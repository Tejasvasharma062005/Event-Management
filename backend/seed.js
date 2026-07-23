const db = require('./database');
const bcrypt = require('bcryptjs');

const seedAdminOnly = async () => {
  console.log('Initialising PostgreSQL database...');
  try {
    await db.initDb();

    const passwordHash = await bcrypt.hash('password123', 10);

    // Create Admin account (skip if already exists)
    console.log('Seeding Admin account...');
    await db.run(
      "INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, 'admin') ON CONFLICT (email) DO NOTHING",
      ['admin@example.com', passwordHash, 'System Administrator']
    );

    console.log('Finished seeding. PostgreSQL database has been initialised with the Admin account.');
  } catch (err) {
    console.error('Failed to seed database:', err);
    process.exit(1);
  }
};

seedAdminOnly();
