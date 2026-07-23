const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('./database');
const mailer = require('./mailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'event_secret_key_123';

// Wrap Express with HTTP server to bind WebSockets socket.io
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware to normalize URL paths for Vercel serverless routing
app.use((req, res, next) => {
  if (!req.url.startsWith('/api') && !req.url.startsWith('/socket.io')) {
    req.url = '/api' + req.url;
  }
  next();
});

app.use(cors());
app.use(express.json());

// Initialize Database
db.initDb().catch((err) => {
  console.error('Failed to initialize database:', err);
});

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Authorization token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// Register
app.post('/api/auth/register', async (req, res) => {
  const {
    email,
    password,
    fullName,
    role,
    businessName,
    category,
    basePrice,
    location,
    contactPhone,
    servicesOffered,
    bannerImage,
    businessLogo,
    profilePhoto,
    yearsExperience,
    gstNumber,
    panNumber,
    aadhaarNumber,
    workingHours,
    website,
    socialLinksJson
  } = req.body;

  if (!email || !password || !fullName || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.run(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, fullName, role]
    );

    // If role is provider, initialize provider profile with all fields and status = 'pending'
    if (role === 'provider') {
      await db.run(
        `INSERT INTO providers (
          user_id, category, business_name, base_price, location, rating, contact_phone, services_offered, banner_image, business_logo, profile_photo, years_experience, gst_number, pan_number, aadhaar_number, status, working_hours, availability_json, social_links_json, website
        ) VALUES (?, ?, ?, ?, ?, 5.0, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
        [
          result.id,
          category || 'volunteer',
          businessName || `${fullName}'s Services`,
          parseFloat(basePrice || 1000),
          location || 'Delhi',
          contactPhone || '',
          servicesOffered || '',
          bannerImage || '',
          businessLogo || '',
          profilePhoto || '',
          parseInt(yearsExperience || 0),
          gstNumber || '',
          panNumber || '',
          aadhaarNumber || '',
          workingHours || '09:00 AM - 06:00 PM',
          JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
          socialLinksJson || '{}',
          website || ''
        ]
      );
    }

    res.status(201).json({ message: 'Registration successful! Awaiting admin activation.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get Current User Profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const dbUser = await db.get('SELECT id, email, full_name, role FROM users WHERE id = ?', [req.user.id]);
    if (!dbUser) return res.status(404).json({ message: 'User not found' });

    const user = {
      id: dbUser.id,
      email: dbUser.email,
      fullName: dbUser.full_name,
      role: dbUser.role
    };

    let providerProfile = null;
    if (user.role === 'provider') {
      providerProfile = await db.get('SELECT * FROM providers WHERE user_id = ?', [user.id]);
    }

    res.json({ user, providerProfile });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// Forgot Password
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ message: 'No account found with this email' });
    }

    // Generate Token
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + 3600000; // 1 hour

    await db.run('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?', [
      token,
      expiry,
      user.id
    ]);

    // Send email (defaults to origin of standard React dev server)
    const origin = req.headers.origin || 'http://localhost:5173';
    const emailRes = await mailer.sendPasswordResetEmail(email, token, origin);

    res.json({
      message: 'Password reset link sent to your email address.',
      simulated: emailRes.simulated,
      resetUrl: emailRes.resetUrl // sent to UI for easy testing if SMTP isn't set up
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error processing request' });
  }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE reset_token = ?', [token]);
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    if (Date.now() > user.reset_token_expires) {
      return res.status(400).json({ message: 'Reset token has expired' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.run(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    res.json({ message: 'Password has been successfully reset. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error resetting password' });
  }
});

// ==========================================
// SERVICE PROVIDER ROUTES
// ==========================================

// Get All Providers (with filter/search)
app.get('/api/providers', async (req, res) => {
  const { category, location, minPrice, maxPrice, search } = req.query;

  let query = "SELECT * FROM providers WHERE status = 'approved'";
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (location) {
    query += ' AND LOWER(location) = LOWER(?)';
    params.push(location);
  }

  if (minPrice) {
    query += ' AND base_price >= ?';
    params.push(parseFloat(minPrice));
  }

  if (maxPrice) {
    query += ' AND base_price <= ?';
    params.push(parseFloat(maxPrice));
  }

  if (search) {
    query += ' AND (business_name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  try {
    const providers = await db.all(query, params);
    res.json(providers);
  } catch (error) {
    console.error('Fetch providers error:', error);
    res.status(500).json({ message: 'Error fetching providers' });
  }
});

// Get Specific Provider, Portfolios, & Reviews
app.get('/api/providers/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const provider = await db.get('SELECT * FROM providers WHERE id = ?', [id]);
    if (!provider) return res.status(404).json({ message: 'Provider not found' });

    const portfolios = await db.all('SELECT * FROM portfolios WHERE provider_id = ?', [id]);
    
    const reviews = await db.all(
      `SELECT r.*, u.full_name AS reviewer_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.provider_id = ?
       ORDER BY r.created_at DESC`,
      [id]
    );

    res.json({ provider, portfolios, reviews });
  } catch (error) {
    console.error('Fetch provider details error:', error);
    res.status(500).json({ message: 'Error fetching provider details' });
  }
});

// Update/Onboard Service Provider Profile
app.post('/api/providers/onboard', authenticateToken, async (req, res) => {
  const {
    category,
    businessName,
    description,
    basePrice,
    location,
    contactPhone,
    servicesOffered,
    bannerImage,
    businessLogo,
    profilePhoto,
    yearsExperience,
    gstNumber,
    panNumber,
    aadhaarNumber,
    workingHours,
    availabilityJson,
    socialLinksJson,
    website
  } = req.body;

  if (req.user.role !== 'provider') {
    return res.status(403).json({ message: 'Only service providers can onboard' });
  }

  try {
    const existing = await db.get('SELECT * FROM providers WHERE user_id = ?', [req.user.id]);
    const currentStatus = existing ? existing.status : 'pending';

    if (existing) {
      // Update
      await db.run(
        `UPDATE providers SET
          category = ?, business_name = ?, description = ?, base_price = ?,
          location = ?, contact_phone = ?, services_offered = ?, banner_image = ?,
          business_logo = ?, profile_photo = ?, years_experience = ?, gst_number = ?,
          pan_number = ?, aadhaar_number = ?, working_hours = ?, availability_json = ?,
          social_links_json = ?, website = ?, status = ?
         WHERE user_id = ?`,
        [
          category,
          businessName,
          description,
          parseFloat(basePrice),
          location,
          contactPhone,
          servicesOffered,
          bannerImage,
          businessLogo || '',
          profilePhoto || '',
          parseInt(yearsExperience || 0),
          gstNumber || '',
          panNumber || '',
          aadhaarNumber || '',
          workingHours || '09:00 AM - 06:00 PM',
          availabilityJson || JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
          socialLinksJson || '{}',
          website || '',
          currentStatus,
          req.user.id
        ]
      );
    } else {
      // Insert
      await db.run(
        `INSERT INTO providers (
          user_id, category, business_name, description, base_price, location,
          contact_phone, services_offered, banner_image, business_logo, profile_photo,
          years_experience, gst_number, pan_number, aadhaar_number, status, working_hours,
          availability_json, social_links_json, website
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
        [
          req.user.id,
          category,
          businessName,
          description,
          parseFloat(basePrice),
          location,
          contactPhone,
          servicesOffered,
          bannerImage,
          businessLogo || '',
          profilePhoto || '',
          parseInt(yearsExperience || 0),
          gstNumber || '',
          panNumber || '',
          aadhaarNumber || '',
          workingHours || '09:00 AM - 06:00 PM',
          availabilityJson || JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
          socialLinksJson || '{}',
          website || ''
        ]
      );
    }

    const updatedProfile = await db.get('SELECT * FROM providers WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Profile successfully updated', profile: updatedProfile });
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({ message: 'Error updating provider profile' });
  }
});

// ==========================================
// PORTFOLIO ROUTES
// ==========================================

// Add Portfolio Item
app.post('/api/portfolios', authenticateToken, async (req, res) => {
  const { title, description, imageUrl, price } = req.body;

  if (req.user.role !== 'provider') {
    return res.status(403).json({ message: 'Only providers can add portfolio items' });
  }

  try {
    const provider = await db.get('SELECT id FROM providers WHERE user_id = ?', [req.user.id]);
    if (!provider) return res.status(404).json({ message: 'Provider profile not found' });

    const result = await db.run(
      'INSERT INTO portfolios (provider_id, title, description, image_url, price) VALUES (?, ?, ?, ?, ?)',
      [provider.id, title, description, imageUrl, parseFloat(price || 0)]
    );

    const newItem = await db.get('SELECT * FROM portfolios WHERE id = ?', [result.id]);
    res.status(201).json({ message: 'Portfolio item added successfully', item: newItem });
  } catch (error) {
    console.error('Add portfolio error:', error);
    res.status(500).json({ message: 'Error adding portfolio item' });
  }
});

// Delete Portfolio Item
app.delete('/api/portfolios/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const item = await db.get('SELECT * FROM portfolios WHERE id = ?', [id]);
    if (!item) return res.status(404).json({ message: 'Portfolio item not found' });

    const provider = await db.get('SELECT id FROM providers WHERE user_id = ?', [req.user.id]);
    if (!provider || provider.id !== item.provider_id) {
      return res.status(403).json({ message: 'Unauthorized deletion request' });
    }

    await db.run('DELETE FROM portfolios WHERE id = ?', [id]);
    res.json({ message: 'Portfolio item deleted successfully' });
  } catch (error) {
    console.error('Delete portfolio error:', error);
    res.status(500).json({ message: 'Error deleting portfolio item' });
  }
});

// ==========================================
// BOOKING ROUTES
// ==========================================

// Create Booking
app.post('/api/bookings', authenticateToken, async (req, res) => {
  const { providerId, eventDate, totalPrice, quotationId } = req.body;

  if (!providerId || !eventDate || !totalPrice) {
    return res.status(400).json({ message: 'Missing booking parameters' });
  }

  try {
    const result = await db.run(
      'INSERT INTO bookings (user_id, provider_id, event_date, status, total_price, quotation_id) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, providerId, eventDate, 'pending', parseFloat(totalPrice), quotationId || null]
    );

    const newBooking = await db.get('SELECT * FROM bookings WHERE id = ?', [result.id]);
    res.status(201).json({ message: 'Booking requested successfully', booking: newBooking });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Error creating booking request' });
  }
});

// Get Bookings
app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    let bookings;
    if (req.user.role === 'provider') {
      const provider = await db.get('SELECT id FROM providers WHERE user_id = ?', [req.user.id]);
      if (!provider) return res.json([]);
      bookings = await db.all(
        `SELECT b.*, u.full_name AS client_name, u.email AS client_email,
                pm.amount AS payment_amount, pm.status AS payment_detail_status,
                pm.transaction_ref, pm.card_last4, pm.upi_id, pm.payment_date,
                r.id AS review_id, r.rating AS review_rating, r.comment AS review_comment
         FROM bookings b
         JOIN users u ON b.user_id = u.id
         LEFT JOIN payments pm ON b.id = pm.booking_id
         LEFT JOIN reviews r ON b.id = r.booking_id
         WHERE b.provider_id = ?
         ORDER BY b.event_date ASC`,
        [provider.id]
      );
    } else {
      bookings = await db.all(
        `SELECT b.*, p.business_name, p.category, p.contact_phone, p.user_id AS provider_user_id,
                pm.amount AS payment_amount, pm.status AS payment_detail_status,
                pm.transaction_ref, pm.card_last4, pm.upi_id, pm.payment_date,
                r.id AS review_id, r.rating AS review_rating, r.comment AS review_comment
         FROM bookings b
         JOIN providers p ON b.provider_id = p.id
         LEFT JOIN payments pm ON b.id = pm.booking_id
         LEFT JOIN reviews r ON b.id = r.booking_id
         WHERE b.user_id = ?
         ORDER BY b.event_date ASC`,
        [req.user.id]
      );
    }
    res.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

// Update Booking Status
app.put('/api/bookings/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // approved, cancelled, completed

  if (!['approved', 'cancelled', 'completed'].includes(status)) {
    return res.status(400).json({ message: 'Invalid booking status' });
  }

  try {
    const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [id]);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Validate permission (provider of this booking, or the user who created it)
    let hasPermission = false;

    if (req.user.role === 'provider') {
      const provider = await db.get('SELECT id FROM providers WHERE user_id = ?', [req.user.id]);
      if (provider && provider.id === booking.provider_id) {
        hasPermission = true;
      }
    } else if (booking.user_id === req.user.id) {
      // User can cancel their own booking
      if (status === 'cancelled') {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      return res.status(403).json({ message: 'Unauthorized status modification' });
    }

    await db.run('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);

    // Handle refunds on cancellations
    if (status === 'cancelled' && booking.payment_status === 'paid') {
      await db.run("UPDATE bookings SET payment_status = 'refunded' WHERE id = ?", [id]);
      await db.run("UPDATE payments SET status = 'refunded' WHERE booking_id = ?", [id]);
    }

    const updated = await db.get('SELECT * FROM bookings WHERE id = ?', [id]);
    res.json({ message: `Booking status updated to ${status}`, booking: updated });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ message: 'Error modifying booking status' });
  }
});

// ==========================================
// PAYMENT ROUTES
// ==========================================

// Process Payment for a Booking
app.post('/api/bookings/:id/pay', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { paymentMethod, amount, cardName, cardNumber, upiId } = req.body;

  if (!paymentMethod || !amount) {
    return res.status(400).json({ message: 'Missing payment details' });
  }

  if (!['upi', 'credit_card', 'debit_card', 'cash'].includes(paymentMethod)) {
    return res.status(400).json({ message: 'Invalid payment method' });
  }

  try {
    const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [id]);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Validate that the user paying is the one who created the booking
    if (booking.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized payment attempt' });
    }

    // Generate pseudo-random transaction reference
    const transactionRef = 'TXN-' + crypto.randomBytes(8).toString('hex').toUpperCase();
    let cardLast4 = null;
    let paymentStatus = 'paid';
    let paymentDetailStatus = 'completed';

    if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
      if (!cardNumber || cardNumber.length < 4) {
        return res.status(400).json({ message: 'Valid card details required' });
      }
      cardLast4 = cardNumber.slice(-4);
    } else if (paymentMethod === 'upi') {
      if (!upiId) {
        return res.status(400).json({ message: 'UPI ID is required' });
      }
    } else if (paymentMethod === 'cash') {
      paymentStatus = 'unpaid'; // Still unpaid until provider marks it paid
      paymentDetailStatus = 'pending';
    }

    // Insert transaction log
    await db.run(
      `INSERT INTO payments (booking_id, amount, payment_method, status, transaction_ref, card_last4, upi_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, parseFloat(amount), paymentMethod, paymentDetailStatus, transactionRef, cardLast4, upiId || null]
    );

    // Update booking status and payment status
    await db.run(
      'UPDATE bookings SET payment_status = ?, payment_method = ? WHERE id = ?',
      [paymentStatus, paymentMethod, id]
    );

    res.json({
      message: paymentMethod === 'cash' ? 'Booking requested with Cash payment option.' : 'Payment processed successfully.',
      payment: {
        transactionRef,
        status: paymentDetailStatus,
        paymentStatus
      }
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ message: 'Error processing payment transaction' });
  }
});

// Mark Cash Payment as Received (Provider only)
app.post('/api/bookings/:id/cash-paid', authenticateToken, async (req, res) => {
  const { id } = req.params;

  if (req.user.role !== 'provider') {
    return res.status(403).json({ message: 'Only service providers can register cash payments.' });
  }

  try {
    const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [id]);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Validate that the provider belongs to this booking
    const provider = await db.get('SELECT id FROM providers WHERE user_id = ?', [req.user.id]);
    if (!provider || provider.id !== booking.provider_id) {
      return res.status(403).json({ message: 'Unauthorized provider modification request' });
    }

    if (booking.payment_method !== 'cash') {
      return res.status(400).json({ message: 'This booking is not set for Cash payment' });
    }

    // Update booking's payment status to paid
    await db.run(
      "UPDATE bookings SET payment_status = 'paid' WHERE id = ?",
      [id]
    );

    // Update existing cash payment detail status to completed
    await db.run(
      "UPDATE payments SET status = 'completed' WHERE booking_id = ?",
      [id]
    );

    res.json({ message: 'Cash payment marked as completed.' });

  } catch (error) {
    console.error('Cash payment completion error:', error);
    res.status(500).json({ message: 'Error completing cash payment transaction' });
  }
});

// ==========================================
// STATISTICS & REVIEW ROUTES
// ==========================================

// Get Live Statistics (Production-ready stats)
app.get('/api/stats', async (req, res) => {
  try {
    const providerCount = await db.get('SELECT COUNT(*) AS count FROM providers');
    const bookingCount = await db.get("SELECT COUNT(*) AS count FROM bookings WHERE status = 'completed'");
    const clientCount = await db.get("SELECT COUNT(*) AS count FROM users WHERE role = 'user'");
    
    // Average rating dynamically calculated from reviews table
    const ratingRow = await db.get('SELECT AVG(rating) AS avgRating FROM reviews');
    let avgRating = 5.0;
    if (ratingRow && ratingRow.avgRating !== null) {
      avgRating = parseFloat(ratingRow.avgRating.toFixed(1));
    } else {
      // Fallback: average of baseline ratings in providers table
      const fallbackRow = await db.get('SELECT AVG(rating) AS avgRating FROM providers');
      if (fallbackRow && fallbackRow.avgRating !== null) {
        avgRating = parseFloat(fallbackRow.avgRating.toFixed(1));
      }
    }

    res.json({
      providers: providerCount.count,
      completedBookings: bookingCount.count,
      clients: clientCount.count,
      averageRating: avgRating
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ message: 'Error fetching real-time statistics' });
  }
});

// Submit Review (Client only)
app.post('/api/reviews', authenticateToken, async (req, res) => {
  const { providerId, rating, comment, bookingId } = req.body;

  if (!providerId || !rating || !bookingId) {
    return res.status(400).json({ message: 'Missing review parameters' });
  }

  const parsedRating = parseInt(rating);
  if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
  }

  try {
    // 1. Verify that booking exists and client owns it
    const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized review attempt' });
    }

    // 2. Insert the review
    await db.run(
      'INSERT INTO reviews (booking_id, provider_id, user_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [bookingId, providerId, req.user.id, parsedRating, comment || '']
    );

    // 3. Re-calculate the average rating for the provider in real-time
    const ratingRow = await db.get('SELECT AVG(rating) AS avgRating FROM reviews WHERE provider_id = ?', [providerId]);
    if (ratingRow && ratingRow.avgRating !== null) {
      const newAvgRating = parseFloat(ratingRow.avgRating.toFixed(1));
      await db.run('UPDATE providers SET rating = ? WHERE id = ?', [newAvgRating, providerId]);
    }

    res.status(201).json({ message: 'Review submitted successfully.' });

  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ message: 'Error submitting review' });
  }
});



// ==========================================
// AI RECOMMENDATION & QUOTATION ROUTE
// ==========================================
app.post('/api/recommendations/generate', async (req, res) => {
  const {
    eventType,
    budget,
    guests,
    duration,
    theme,
    indoorOutdoor,
    destination,
    venue,
    eventDate,
    decorationPref,
    foodPref,
    musicPref,
    securityReq,
    photographyReq,
    accommodationReq,
    specialReq
  } = req.body;

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  let userId = null;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      userId = payload.id;
    } catch (e) {
      // Proceed as anonymous/non-logged user
    }
  }

  if (!eventType || !budget || !destination || !theme || !guests) {
    return res.status(400).json({ message: 'Required event metrics are missing' });
  }

  try {
    // 1. Fetch all approved providers
    const allProviders = await db.all("SELECT * FROM providers WHERE status = 'approved'");

    // 2. Define Category allocations
    const budgetAllocations = {
      venue: 0.25,
      caterer: 0.25,
      decorator: 0.15,
      event_manager: 0.10,
      clothing_brand: 0.05,
      jewellery_shop: 0.05,
      lighting: 0.03,
      sound: 0.02,
      music_artist: 0.03,
      volunteers: 0.02,
      security_guards: 0.02,
      bouncers: 0.02,
      salon: 0.01,
      laundry: 0.01
    };

    const targetBudget = parseFloat(budget);
    const guestCount = parseInt(guests);
    const matchedVendors = [];
    let calculatedTotal = 0;

    const categories = Object.keys(budgetAllocations);

    for (const cat of categories) {
      const allocatedCategoryBudget = targetBudget * budgetAllocations[cat];

      // Filter providers in this category
      let candidates = allProviders.filter((p) => p.category === cat);
      if (candidates.length === 0) continue;

      // Score candidates based on location proximity, price proximity, and rating
      const scoredCandidates = candidates.map((p) => {
        let score = 0;

        // Proximity to city
        if (p.location.toLowerCase() === destination.toLowerCase()) {
          score += 100;
        }

        // Price estimation logic
        let estPrice = 0;
        if (cat === 'caterer' || cat === 'salon') {
          estPrice = p.base_price * guestCount;
        } else if (cat === 'laundry') {
          estPrice = p.base_price * guestCount * 0.25;
        } else {
          estPrice = p.base_price;
        }

        const priceDiffPercent = Math.abs(estPrice - allocatedCategoryBudget) / (allocatedCategoryBudget || 1);
        score += Math.max(0, (1 - priceDiffPercent) * 50);
        score += p.rating * 5;

        return { provider: p, score, estimatedPrice: estPrice };
      });

      scoredCandidates.sort((a, b) => b.score - a.score);
      const bestMatch = scoredCandidates[0];

      matchedVendors.push({
        providerId: bestMatch.provider.id,
        category: cat,
        businessName: bestMatch.provider.businessName || bestMatch.provider.business_name,
        location: bestMatch.provider.location,
        rating: bestMatch.provider.rating,
        contactPhone: bestMatch.provider.contact_phone,
        estimatedPrice: Math.round(bestMatch.estimatedPrice),
        description: bestMatch.provider.description,
        servicesOffered: bestMatch.provider.services_offered
      });

      calculatedTotal += bestMatch.estimatedPrice;
    }

    // 3. Heuristic / AI narratives
    let statusText = 'Optimal fit within your budget.';
    if (calculatedTotal > targetBudget * 1.15) {
      statusText = 'Recommendation exceeds budget due to premium category vendor rates and guest scaling. Consider adjusting guest counts.';
    } else if (calculatedTotal < targetBudget * 0.8) {
      statusText = 'Recommendation is well below budget, offering premium choices with savings!';
    }

    let summaryNarrative = `Based on your responses, we have curated an optimized quotation for your ${eventType} event. We have budgeted for ${guestCount} expected guests at your target budget of INR ${targetBudget.toLocaleString()}. The selection includes services from ${matchedVendors.length} key departments, matched with premium vendors in/around ${destination}, and tailored to suit your preferred '${theme}' theme and styling aesthetic.`;
    
    let suggestedThemeDetails = `For the '${theme}' theme, we recommend an immersive layout featuring colors like ruby and gold overlays if royal, or pastels and warm fairy lights if minimalist. Ambient table setups, photo booths, and floral structures are integrated into the decorating guidelines.`;
    
    let suggestedDestinationDetails = `Planning in ${destination} allows for a rich local event setting. Outdoor arrangements are highly recommended if weather permits, taking advantage of local venue settings.`;
    
    let timeline = [];
    const eventDays = parseInt(duration) || 1;
    if (eventDays === 1) {
      timeline = [
        'Hour 09:00 AM - Guest check-in and breakfast hospitality.',
        'Hour 11:30 AM - Event commencement and ceremonial greetings.',
        'Hour 01:30 PM - Gourmet lunch catering buffet.',
        'Hour 04:00 PM - Theme-based performance (Music/Dance troupe show).',
        'Hour 07:00 PM - High tea refreshments & concluding photo sessions.',
        'Hour 09:00 PM - Guest checkout.'
      ];
    } else if (eventDays === 2) {
      timeline = [
        'Day 1 - Morning: Arrival of guests, registration at welcome desk.',
        'Day 1 - Evening: Sangeet/Mehandi choreography celebration with live music sound setups.',
        'Day 2 - Afternoon: Main ceremonial ritual and formal photography session.',
        'Day 2 - Night: Grand banquet royal dinner followed by farewell checkout.'
      ];
    } else {
      timeline = [
        'Day 1 - Arrival, check-in, orientation, and welcome night dinner buffet.',
        'Day 2 - Sangeet and dance artist performances. Mehandi stalls open for guests.',
        'Day 3 - Main ceremony event, decorative mandap/stage photoshoot, high security gate patrol, and royal dinner.',
        'Day 4 - Farewell brunch, client reviews, and luggage dispatch.'
      ];
    }

    // Call Gemini API if API key is present
    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `You are a professional AI event planner. Write custom event planning narratives, theme suggestions, destination highlights, and a timeline for this event:
        Event Type: ${eventType}
        Theme: ${theme}
        Budget: INR ${budget}
        Guests: ${guests}
        Duration: ${duration} days
        Destination: ${destination}
        Indoor/Outdoor: ${indoorOutdoor}
        Special Requirements: ${specialReq || 'None'}
        
        Respond ONLY with a JSON object containing:
        {
          "summaryNarrative": "A detailed, beautiful narrative detailing the plan and execution (100-150 words)",
          "themeDetails": "Advice on decoration, colors, styling matching the theme (50-80 words)",
          "destinationDetails": "Advice on destination venue highlights and weather (50-80 words)",
          "timeline": ["Day 1 - Morning: ...", "Day 1 - Evening: ...", ...]
        }`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
            const text = data.candidates[0].content.parts[0].text.trim();
            const cleanText = text.replace(/^```json/, '').replace(/```$/, '').trim();
            const aiResult = JSON.parse(cleanText);
            summaryNarrative = aiResult.summaryNarrative || summaryNarrative;
            suggestedThemeDetails = aiResult.themeDetails || suggestedThemeDetails;
            suggestedDestinationDetails = aiResult.destinationDetails || suggestedDestinationDetails;
            timeline = aiResult.timeline || timeline;
          }
        }
      } catch (e) {
        console.warn("Gemini API call failed, using heuristic fallback:", e.message);
      }
    }

    // Save quotation to database
    const breakdownData = {
      vendors: matchedVendors,
      statusText,
      summaryNarrative,
      suggestedThemeDetails,
      suggestedDestinationDetails,
      timeline
    };

    const insertRes = await db.run(
      `INSERT INTO quotations (
        user_id, event_type, budget, guests, duration, theme, indoor_outdoor, destination, venue, event_date,
        decoration_pref, food_pref, music_pref, security_req, photography_req, accommodation_req, special_req,
        total_cost, itemized_breakdown_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        eventType,
        targetBudget,
        guestCount,
        duration || '1',
        theme,
        indoorOutdoor || 'Indoor',
        destination,
        venue || '',
        eventDate || '',
        decorationPref || '',
        foodPref || '',
        musicPref || '',
        securityReq || 'No',
        photographyReq || 'No',
        accommodationReq || 'No',
        specialReq || '',
        Math.round(calculatedTotal),
        JSON.stringify(breakdownData)
      ]
    );

    res.json({
      quotationId: insertRes.id,
      eventType,
      budget: targetBudget,
      guests: guestCount,
      duration: duration || '1',
      theme,
      indoorOutdoor: indoorOutdoor || 'Indoor',
      destination,
      venue,
      eventDate,
      totalCost: Math.round(calculatedTotal),
      vendors: matchedVendors,
      statusText,
      summaryNarrative,
      suggestedThemeDetails,
      suggestedDestinationDetails,
      timeline
    });

  } catch (error) {
    console.error('AI Recommendation Error:', error);
    res.status(500).json({ message: 'Error generating AI quotation' });
  }
});

// Get User's Saved Quotations
app.get('/api/recommendations/my-quotes', authenticateToken, async (req, res) => {
  try {
    const quotes = await db.all('SELECT * FROM quotations WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    const parsedQuotes = quotes.map(q => ({
      ...q,
      itemized_breakdown: JSON.parse(q.itemized_breakdown_json)
    }));
    res.json(parsedQuotes);
  } catch (error) {
    console.error('Fetch quotes error:', error);
    res.status(500).json({ message: 'Error fetching saved quotations' });
  }
});

// ==========================================
// SUPPORT TICKET ROUTES
// ==========================================

// Create support ticket
app.post('/api/tickets', authenticateToken, async (req, res) => {
  const { subject, message } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ message: 'Subject and message are required' });
  }

  try {
    const result = await db.run(
      'INSERT INTO support_tickets (user_id, subject, message, status) VALUES (?, ?, ?, ?)',
      [req.user.id, subject, message, 'open']
    );
    const ticket = await db.get('SELECT * FROM support_tickets WHERE id = ?', [result.id]);
    res.status(201).json({ message: 'Support ticket submitted successfully', ticket });
  } catch (err) {
    console.error('Create ticket error:', err);
    res.status(500).json({ message: 'Error creating support ticket' });
  }
});

// Get support tickets (All for Admin, User-specific for customers)
app.get('/api/tickets', authenticateToken, async (req, res) => {
  try {
    let tickets;
    if (req.user.role === 'admin') {
      tickets = await db.all(
        `SELECT t.*, u.full_name AS client_name, u.email AS client_email
         FROM support_tickets t
         JOIN users u ON t.user_id = u.id
         ORDER BY t.created_at DESC`
      );
    } else {
      tickets = await db.all(
        `SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC`,
        [req.user.id]
      );
    }
    res.json(tickets);
  } catch (err) {
    console.error('Get tickets error:', err);
    res.status(500).json({ message: 'Error fetching support tickets' });
  }
});

// Respond to support ticket (Admin only)
app.post('/api/tickets/:id/respond', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { response } = req.body;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only administrators can reply to support tickets' });
  }

  if (!response) {
    return res.status(400).json({ message: 'Response text is required' });
  }

  try {
    const ticket = await db.get('SELECT * FROM support_tickets WHERE id = ?', [id]);
    if (!ticket) return res.status(404).json({ message: 'Support ticket not found' });

    await db.run(
      "UPDATE support_tickets SET admin_response = ?, status = 'resolved', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [response, id]
    );

    // Send notification
    await db.run(
      "INSERT INTO notifications (user_id, title, message) VALUES (?, 'Support Ticket Resolved', ?)",
      [ticket.user_id, `Your ticket regarding "${ticket.subject}" has been answered by the Admin.`]
    );

    const updated = await db.get('SELECT * FROM support_tickets WHERE id = ?', [id]);
    res.json({ message: 'Ticket responded and resolved successfully', ticket: updated });
  } catch (err) {
    console.error('Respond ticket error:', err);
    res.status(500).json({ message: 'Error responding to support ticket' });
  }
});

// ==========================================
// ADMIN DASHBOARD ROUTES
// ==========================================

// Middleware to verify Admin role
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden. Admin privileges required.' });
  }
  next();
};

// Get All Users (Admin only)
app.get('/api/admin/users', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const users = await db.all('SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at DESC');
    res.json(users);
  } catch (err) {
    console.error('Admin fetch users error:', err);
    res.status(500).json({ message: 'Error fetching users list' });
  }
});

// Delete User (Admin only)
app.delete('/api/admin/users/:id', authenticateToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.run('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted successfully from database' });
  } catch (err) {
    console.error('Admin delete user error:', err);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Get All Providers with details (Admin only)
app.get('/api/admin/providers', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const providers = await db.all(
      `SELECT p.*, u.email, u.full_name
       FROM providers p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.id DESC`
    );
    res.json(providers);
  } catch (err) {
    console.error('Admin fetch providers error:', err);
    res.status(500).json({ message: 'Error fetching service providers list' });
  }
});

// Update Provider Status (Admin only)
app.post('/api/admin/providers/:id/status', authenticateToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // approved, rejected

  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const provider = await db.get('SELECT * FROM providers WHERE id = ?', [id]);
    if (!provider) return res.status(404).json({ message: 'Provider profile not found' });

    await db.run('UPDATE providers SET status = ? WHERE id = ?', [status, id]);

    // Send notification to the provider user
    await db.run(
      "INSERT INTO notifications (user_id, title, message) VALUES (?, 'Partner Account Status Update', ?)",
      [provider.user_id, `Your provider profile has been ${status} by the platform administration.`]
    );

    res.json({ message: `Provider status successfully updated to ${status}` });
  } catch (err) {
    console.error('Admin update status error:', err);
    res.status(500).json({ message: 'Error updating provider status' });
  }
});

// Get All Bookings (Admin only)
app.get('/api/admin/bookings', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const bookings = await db.all(
      `SELECT b.*, u.full_name AS client_name, u.email AS client_email,
              p.business_name, p.category, p.contact_phone
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN providers p ON b.provider_id = p.id
       ORDER BY b.created_at DESC`
    );
    res.json(bookings);
  } catch (err) {
    console.error('Admin fetch bookings error:', err);
    res.status(500).json({ message: 'Error fetching platform bookings' });
  }
});

// Get Platform Settings (Admin only)
app.get('/api/admin/settings', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const settings = await db.all('SELECT * FROM platform_settings');
    res.json(settings);
  } catch (err) {
    console.error('Admin fetch settings error:', err);
    res.status(500).json({ message: 'Error fetching settings' });
  }
});

// Update Platform Settings (Admin only)
app.put('/api/admin/settings', authenticateToken, verifyAdmin, async (req, res) => {
  const { platformFee } = req.body;
  if (!platformFee) return res.status(400).json({ message: 'Platform fee value required' });

  try {
    await db.run("INSERT INTO platform_settings (key, value) VALUES ('platform_fee', ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [platformFee]);
    res.json({ message: 'Platform settings updated successfully' });
  } catch (err) {
    console.error('Admin update settings error:', err);
    res.status(500).json({ message: 'Error updating platform settings' });
  }
});

// Get Advanced Analytics (Admin only)
app.get('/api/admin/stats', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const totalUsers = await db.get('SELECT COUNT(*) AS count FROM users');
    const totalProviders = await db.get("SELECT COUNT(*) AS count FROM providers");
    const pendingProviders = await db.get("SELECT COUNT(*) AS count FROM providers WHERE status = 'pending'");
    const totalBookings = await db.get('SELECT COUNT(*) AS count FROM bookings');
    const completedBookings = await db.get("SELECT COUNT(*) AS count FROM bookings WHERE status = 'completed'");
    
    // Revenue calculations
    const revenueRow = await db.get("SELECT SUM(total_price) AS sum FROM bookings WHERE payment_status = 'paid'");
    const totalRevenue = revenueRow.sum || 0;

    // Platform settings fee
    const feeSetting = await db.get("SELECT value FROM platform_settings WHERE key = 'platform_fee'");
    const platformFeeRate = feeSetting ? parseFloat(feeSetting.value) : 100;

    // Total platform fee earned = paid bookings count * platformFeeRate
    const paidBookingsCountRow = await db.get("SELECT COUNT(*) AS count FROM bookings WHERE payment_status = 'paid'");
    const platformFeesEarned = (paidBookingsCountRow.count || 0) * platformFeeRate;

    // Bookings split by category
    const categoryStats = await db.all(
      `SELECT p.category, COUNT(b.id) AS booking_count, SUM(b.total_price) AS revenue
       FROM bookings b
       JOIN providers p ON b.provider_id = p.id
       GROUP BY p.category`
    );

    res.json({
      totalUsers: totalUsers.count,
      totalProviders: totalProviders.count,
      pendingProviders: pendingProviders.count,
      totalBookings: totalBookings.count,
      completedBookings: completedBookings.count,
      totalRevenue,
      platformFeesEarned,
      platformFeeRate,
      categoryStats
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ message: 'Error compiling administrative analytics' });
  }
});

// ==========================================
// REAL-TIME WEBSOCKET CHAT EVENTS
// ==========================================
io.on('connection', (socket) => {
  console.log('Socket client connected:', socket.id);
  
  socket.on('join_room', ({ bookingId }) => {
    socket.join(`booking_${bookingId}`);
    console.log(`Socket ${socket.id} joined room booking_${bookingId}`);
  });

  socket.on('send_message', async (data) => {
    const { bookingId, senderId, receiverId, message } = data;
    try {
      await db.run(
        'INSERT INTO messages (booking_id, sender_id, receiver_id, message) VALUES (?, ?, ?, ?)',
        [bookingId, senderId, receiverId, message]
      );
      io.to(`booking_${bookingId}`).emit('receive_message', {
        bookingId,
        senderId,
        receiverId,
        message,
        created_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Socket message save error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket client disconnected:', socket.id);
  });
});

// Load Chat Messages history
app.get('/api/bookings/:bookingId/messages', authenticateToken, async (req, res) => {
  const { bookingId } = req.params;
  try {
    const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    const provider = await db.get('SELECT * FROM providers WHERE id = ?', [booking.provider_id]);
    if (req.user.role !== 'admin' && req.user.id !== booking.user_id && req.user.id !== (provider ? provider.user_id : null)) {
      return res.status(403).json({ message: 'Unauthorized message request' });
    }

    const messages = await db.all('SELECT * FROM messages WHERE booking_id = ? ORDER BY created_at ASC', [bookingId]);
    res.json(messages);
  } catch (err) {
    console.error('Fetch messages error:', err);
    res.status(500).json({ message: 'Error loading messages history' });
  }
});

// ==========================================
// STRIPE CHECKOUT API
// ==========================================
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

app.post('/api/payments/create-checkout-session', authenticateToken, async (req, res) => {
  const { bookingId, successUrl, cancelUrl } = req.body;
  try {
    const booking = await db.get('SELECT b.*, p.business_name FROM bookings b JOIN providers p ON b.provider_id = p.id WHERE b.id = ?', [bookingId]);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.user_id !== req.user.id) return res.status(403).json({ message: 'Unauthorized checkout request' });

    if (stripe) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'inr',
            product_data: {
              name: `EventLux Booking - ${booking.business_name}`,
              description: `Event date: ${booking.event_date}`
            },
            unit_amount: Math.round(booking.total_price * 100)
          },
          quantity: 1
        }],
        mode: 'payment',
        success_url: `${successUrl || 'http://localhost:5173/#dashboard'}?payment_status=success&bookingId=${bookingId}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${cancelUrl || 'http://localhost:5173/#dashboard'}?payment_status=cancel&bookingId=${bookingId}`
      });
      return res.json({ id: session.id, url: session.url });
    } else {
      // Simulation Mode sandbox fallback
      const mockSessionId = 'mock_stripe_' + Math.random().toString(36).substr(2, 9);
      const simulatedUrl = `${successUrl || 'http://localhost:5173/#dashboard'}?payment_status=success&bookingId=${bookingId}&session_id=${mockSessionId}`;
      return res.json({ id: mockSessionId, url: simulatedUrl, simulated: true });
    }
  } catch (err) {
    console.error('Stripe checkout route error:', err);
    res.status(500).json({ message: 'Error initiating Stripe checkout' });
  }
});

app.post('/api/payments/confirm-payment', authenticateToken, async (req, res) => {
  const { bookingId, session_id } = req.body;
  try {
    const booking = await db.get('SELECT b.*, u.email, u.full_name FROM bookings b JOIN users u ON b.user_id = u.id WHERE b.id = ?', [bookingId]);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.payment_status === 'paid') return res.json({ message: 'Payment already completed' });

    const transactionRef = session_id || 'simulated_txn_' + Math.random().toString(36).substr(2, 9);
    
    // Update booking payment status
    await db.run(
      "UPDATE bookings SET payment_status = 'paid', payment_method = 'credit_card' WHERE id = ?",
      [bookingId]
    );

    // Save to payments table
    await db.run(
      "INSERT INTO payments (booking_id, amount, payment_method, status, transaction_ref, card_last4) VALUES (?, ?, 'credit_card', 'completed', ?, '4242')",
      [bookingId, booking.total_price, transactionRef]
    );

    // Try sending email notification
    try {
      await mailer.transporter.sendMail({
        from: '"EventLux Billings" <billing@eventlux.com>',
        to: booking.email,
        subject: 'Verified Invoice Receipt - Booking ID #' + bookingId,
        html: `<h3>Thank you for your payment, ${booking.full_name}!</h3>
               <p>Your booking payment of <strong>INR ${booking.total_price.toLocaleString()}</strong> has been securely settled in Escrow.</p>
               <p>Transaction Reference: <strong>${transactionRef}</strong></p>
               <p>Printable invoices are available inside your <a href="http://localhost:5173/#dashboard">Customer Portal</a>.</p>`
      });
    } catch (mailErr) {
      console.warn('Billing email fail:', mailErr.message);
    }

    res.json({ message: 'Stripe transaction verified successfully' });
  } catch (err) {
    console.error('Confirm payment error:', err);
    res.status(500).json({ message: 'Payment confirmation failure' });
  }
});

// ==========================================
// CLIENT TIMELINE UPDATE API
// ==========================================
app.put('/api/recommendations/quotations/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { itemizedBreakdown } = req.body;
  
  if (!itemizedBreakdown) return res.status(400).json({ message: 'Missing timeline payload' });

  try {
    const quote = await db.get('SELECT * FROM quotations WHERE id = ?', [id]);
    if (!quote) return res.status(404).json({ message: 'Quotation not found' });
    if (quote.user_id !== req.user.id) return res.status(403).json({ message: 'Unauthorized timeline modification' });

    await db.run(
      'UPDATE quotations SET itemized_breakdown_json = ? WHERE id = ?',
      [JSON.stringify(itemizedBreakdown), id]
    );

    res.json({ message: 'Event timeline successfully updated in database' });
  } catch (err) {
    console.error('Update timeline error:', err);
    res.status(500).json({ message: 'Failed to update quotation timeline' });
  }
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`Event Management Backend & Socket Server running on port ${PORT}`);
  });
}

module.exports = app;
