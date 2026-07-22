const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'event_management.db');
const db = new sqlite3.Database(dbPath);

// Helper to run query and return Promise
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

// Helper to get single row
const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Helper to get all rows
const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const initDb = async () => {
  // Enable foreign keys
  await run('PRAGMA foreign_keys = ON');

  // Check if migration/recreation is needed
  let needsRecreation = false;
  try {
    await get("SELECT status FROM providers LIMIT 1");
  } catch (e) {
    needsRecreation = true;
  }

  if (needsRecreation) {
    console.log('Schema update required. Re-creating tables...');
    await run('DROP TABLE IF EXISTS notifications');
    await run('DROP TABLE IF EXISTS support_tickets');
    await run('DROP TABLE IF EXISTS platform_settings');
    await run('DROP TABLE IF EXISTS reviews');
    await run('DROP TABLE IF EXISTS payments');
    await run('DROP TABLE IF EXISTS bookings');
    await run('DROP TABLE IF EXISTS portfolios');
    await run('DROP TABLE IF EXISTS providers');
    await run('DROP TABLE IF EXISTS users');
    await run('DROP TABLE IF EXISTS quotations');
  }

  // Users Table
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT CHECK(role IN ('user', 'provider', 'admin')) NOT NULL,
      reset_token TEXT,
      reset_token_expires INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Providers Table
  await run(`
    CREATE TABLE IF NOT EXISTS providers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      category TEXT NOT NULL,
      business_name TEXT NOT NULL,
      description TEXT,
      base_price REAL NOT NULL,
      location TEXT NOT NULL,
      rating REAL DEFAULT 5.0,
      contact_phone TEXT,
      services_offered TEXT,
      banner_image TEXT,
      business_logo TEXT,
      profile_photo TEXT,
      years_experience INTEGER DEFAULT 0,
      gst_number TEXT,
      pan_number TEXT,
      aadhaar_number TEXT,
      status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
      working_hours TEXT,
      availability_json TEXT,
      social_links_json TEXT,
      website TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Portfolios Table
  await run(`
    CREATE TABLE IF NOT EXISTS portfolios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      price REAL,
      FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
    )
  `);

  // Quotations Table
  await run(`
    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      event_type TEXT NOT NULL,
      budget REAL NOT NULL,
      guests INTEGER NOT NULL,
      duration TEXT,
      theme TEXT NOT NULL,
      indoor_outdoor TEXT,
      destination TEXT NOT NULL,
      venue TEXT,
      event_date TEXT,
      decoration_pref TEXT,
      food_pref TEXT,
      music_pref TEXT,
      security_req TEXT,
      photography_req TEXT,
      accommodation_req TEXT,
      special_req TEXT,
      total_cost REAL NOT NULL,
      itemized_breakdown_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Bookings Table
  await run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      provider_id INTEGER NOT NULL,
      event_date TEXT NOT NULL,
      status TEXT CHECK(status IN ('pending', 'approved', 'completed', 'cancelled')) DEFAULT 'pending',
      total_price REAL NOT NULL,
      quotation_id INTEGER,
      payment_status TEXT CHECK(payment_status IN ('unpaid', 'pending', 'paid', 'refunded')) DEFAULT 'unpaid',
      payment_method TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
      FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL
    )
  `);

  // Payments Table
  await run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT CHECK(payment_method IN ('upi', 'credit_card', 'debit_card', 'cash')) NOT NULL,
      status TEXT CHECK(status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
      transaction_ref TEXT NOT NULL,
      card_last4 TEXT,
      upi_id TEXT,
      payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    )
  `);

  // Reviews Table
  await run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER UNIQUE,
      provider_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      rating INTEGER CHECK(rating BETWEEN 1 AND 5) NOT NULL,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Support Tickets Table
  await run(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT CHECK(status IN ('open', 'resolved', 'closed')) DEFAULT 'open',
      admin_response TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Platform Settings Table
  await run(`
    CREATE TABLE IF NOT EXISTS platform_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Notifications Table
  await run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Messages Table for WebSockets Live Chat
  await run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    )
  `);

  // Initialize Platform Fee Setting if missing
  try {
    await run("INSERT OR IGNORE INTO platform_settings (key, value) VALUES ('platform_fee', '100')");
  } catch (e) {
    console.error('Failed to initialize platform settings:', e);
  }

  // Ensure quotations has the venue column (run-time migration check)
  try {
    await get("SELECT venue FROM quotations LIMIT 1");
  } catch (e) {
    console.log("Adding 'venue' column to quotations table...");
    try {
      await run("ALTER TABLE quotations ADD COLUMN venue TEXT");
    } catch (err) {
      console.warn("Could not alter quotations table:", err.message);
    }
  }
 
  console.log('Database tables successfully initialized.');

  // Decoupled mock seeding for production/clean installation.
  // To seed mock data, run "npm run seed" or "node seed.js" inside the backend folder.
};

module.exports = {
  db,
  initDb,
  run,
  get,
  all
};
