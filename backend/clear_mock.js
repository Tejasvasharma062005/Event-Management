const db = require('./database');

const clearMockData = async () => {
  console.log('Purging mock data from database...');
  try {
    // Run database init to ensure connection
    await db.initDb();
    
    // Clear all transaction and listing tables
    await db.run('DELETE FROM messages');
    await db.run('DELETE FROM notifications');
    await db.run('DELETE FROM support_tickets');
    await db.run('DELETE FROM reviews');
    await db.run('DELETE FROM payments');
    await db.run('DELETE FROM bookings');
    await db.run('DELETE FROM portfolios');
    await db.run('DELETE FROM providers');
    await db.run('DELETE FROM quotations');
    
    // Clear non-admin users
    await db.run("DELETE FROM users WHERE role != 'admin'");
    
    console.log('All mock data successfully purged from the SQLite database.');
  } catch (err) {
    console.error('Failed to clear database:', err);
  }
};

clearMockData();
