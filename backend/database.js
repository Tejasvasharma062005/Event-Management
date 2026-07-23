const { Pool, types } = require('pg');
require('dotenv').config();

// ─────────────────────────────────────────────────────────────────────────────
// PostgreSQL returns COUNT(*) as a BigInt (OID 20) which node-postgres serialises
// as a string to avoid JS precision loss. Override the parser so every COUNT(*)
// result comes back as a plain JS number — no changes needed in route handlers.
// ─────────────────────────────────────────────────────────────────────────────
types.setTypeParser(20, (val) => parseInt(val, 10));

if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL environment variable is not set. The server cannot connect to PostgreSQL.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon / Supabase / Railway all require SSL in production.
  // Disable only when the connection string explicitly opts out (local dev).
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=disable')
    ? false
    : { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Convert SQLite-style `?` placeholders to PostgreSQL `$1, $2, …` style. */
const convertPlaceholders = (sql) => {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
};

/**
 * Execute a non-SELECT query (INSERT / UPDATE / DELETE / DDL).
 * INSERT queries automatically receive `RETURNING id` so callers can use
 * `result.id` exactly like SQLite's `this.lastID`.
 */
const run = async (sql, params = []) => {
  const trimmed = sql.trim();
  const isInsert = /^INSERT/i.test(trimmed);
  const hasReturning = /RETURNING/i.test(trimmed);

  let finalSql = convertPlaceholders(trimmed);
  if (isInsert && !hasReturning) {
    finalSql += ' RETURNING id';
  }

  const result = await pool.query(finalSql, params);
  return {
    id: result.rows[0]?.id ?? null,
    changes: result.rowCount
  };
};

/** Fetch a single row. Returns `undefined` when no row matches (mirrors SQLite). */
const get = async (sql, params = []) => {
  const result = await pool.query(convertPlaceholders(sql.trim()), params);
  return result.rows[0];
};

/** Fetch all matching rows. */
const all = async (sql, params = []) => {
  const result = await pool.query(convertPlaceholders(sql.trim()), params);
  return result.rows;
};

// ─────────────────────────────────────────────────────────────────────────────
// Schema initialisation — all tables use CREATE TABLE IF NOT EXISTS so this is
// safe to call on every cold start without data loss.
// ─────────────────────────────────────────────────────────────────────────────
const initDb = async () => {
  // ── Users ──────────────────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id                  SERIAL PRIMARY KEY,
      email               TEXT UNIQUE NOT NULL,
      password_hash       TEXT NOT NULL,
      full_name           TEXT NOT NULL,
      role                TEXT CHECK(role IN ('user', 'provider', 'admin')) NOT NULL,
      reset_token         TEXT,
      reset_token_expires BIGINT,
      created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ── Providers ──────────────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS providers (
      id                SERIAL PRIMARY KEY,
      user_id           INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category          TEXT NOT NULL,
      business_name     TEXT NOT NULL,
      description       TEXT,
      base_price        REAL NOT NULL,
      location          TEXT NOT NULL,
      rating            REAL DEFAULT 5.0,
      contact_phone     TEXT,
      services_offered  TEXT,
      banner_image      TEXT,
      business_logo     TEXT,
      profile_photo     TEXT,
      years_experience  INTEGER DEFAULT 0,
      gst_number        TEXT,
      pan_number        TEXT,
      aadhaar_number    TEXT,
      status            TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
      working_hours     TEXT,
      availability_json  TEXT,
      social_links_json  TEXT,
      website           TEXT
    )
  `);

  // ── Portfolios ─────────────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS portfolios (
      id          SERIAL PRIMARY KEY,
      provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
      title       TEXT NOT NULL,
      description TEXT,
      image_url   TEXT,
      price       REAL
    )
  `);

  // ── Quotations ─────────────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS quotations (
      id                      SERIAL PRIMARY KEY,
      user_id                 INTEGER REFERENCES users(id) ON DELETE SET NULL,
      event_type              TEXT NOT NULL,
      budget                  REAL NOT NULL,
      guests                  INTEGER NOT NULL,
      duration                TEXT,
      theme                   TEXT NOT NULL,
      indoor_outdoor          TEXT,
      destination             TEXT NOT NULL,
      venue                   TEXT,
      event_date              TEXT,
      decoration_pref         TEXT,
      food_pref               TEXT,
      music_pref              TEXT,
      security_req            TEXT,
      photography_req         TEXT,
      accommodation_req       TEXT,
      special_req             TEXT,
      total_cost              REAL NOT NULL,
      itemized_breakdown_json TEXT NOT NULL,
      created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ── Bookings ───────────────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id             SERIAL PRIMARY KEY,
      user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider_id    INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
      event_date     TEXT NOT NULL,
      status         TEXT CHECK(status IN ('pending', 'approved', 'completed', 'cancelled')) DEFAULT 'pending',
      total_price    REAL NOT NULL,
      quotation_id   INTEGER REFERENCES quotations(id) ON DELETE SET NULL,
      payment_status TEXT CHECK(payment_status IN ('unpaid', 'pending', 'paid', 'refunded')) DEFAULT 'unpaid',
      payment_method TEXT,
      created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ── Payments ───────────────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id              SERIAL PRIMARY KEY,
      booking_id      INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      amount          REAL NOT NULL,
      payment_method  TEXT CHECK(payment_method IN ('upi', 'credit_card', 'debit_card', 'cash')) NOT NULL,
      status          TEXT CHECK(status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
      transaction_ref TEXT NOT NULL,
      card_last4      TEXT,
      upi_id          TEXT,
      payment_date    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ── Reviews ────────────────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id          SERIAL PRIMARY KEY,
      booking_id  INTEGER UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
      provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating      INTEGER CHECK(rating BETWEEN 1 AND 5) NOT NULL,
      comment     TEXT,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ── Support Tickets ────────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id             SERIAL PRIMARY KEY,
      user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject        TEXT NOT NULL,
      message        TEXT NOT NULL,
      status         TEXT CHECK(status IN ('open', 'resolved', 'closed')) DEFAULT 'open',
      admin_response TEXT,
      created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ── Platform Settings ──────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS platform_settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // ── Notifications ──────────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title      TEXT NOT NULL,
      message    TEXT NOT NULL,
      is_read    INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ── Messages (WebSocket Live Chat) ─────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id          SERIAL PRIMARY KEY,
      booking_id  INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      sender_id   INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      message     TEXT NOT NULL,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default platform fee — safe to run repeatedly (ON CONFLICT DO NOTHING).
  await pool.query(
    "INSERT INTO platform_settings (key, value) VALUES ('platform_fee', '100') ON CONFLICT (key) DO NOTHING"
  );

  console.log('PostgreSQL database tables successfully initialised.');
};

module.exports = { pool, initDb, run, get, all };
