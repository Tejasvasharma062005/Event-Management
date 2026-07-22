const db = require('./database');
const bcrypt = require('bcryptjs');

const seedAdminOnly = async () => {
  console.log('Initializing database connection...');
  try {
    await db.initDb();
    
    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Create Admin Account
    console.log('Seeding Admin account...');
    await db.run(
      'INSERT OR IGNORE INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, "admin")',
      ['admin@example.com', passwordHash, 'System Administrator']
    );

    console.log('Finished seeding. SQLite database has been initialized with the Admin account only.');
  } catch (err) {
    console.error('Failed to seed database:', err);
  }
};

seedAdminOnly();
