const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter from env
const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    // If not configured, return null to trigger fallback
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(port),
    secure: port == 465, // true for 465, false for other ports
    auth: {
      user,
      pass
    }
  });
};

/**
 * Sends a password reset email to a user.
 * @param {string} email - Recipient email
 * @param {string} token - Password reset token
 * @param {string} origin - Origin (e.g., http://localhost:5173)
 */
const sendPasswordResetEmail = async (email, token, origin = 'http://localhost:5173') => {
  const resetUrl = `${origin}/reset-password?token=${token}`;
  const transporter = getTransporter();

  const mailOptions = {
    from: `"Event Management Team" <${process.env.SMTP_USER || 'no-reply@eventmanagement.com'}>`,
    to: email,
    subject: 'Password Reset Request - Event Management App',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #6366f1; text-align: center;">Reset Your Password</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password for your Event Management account. Click the button below to set a new password. This link is valid for 1 hour.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>If you did not request a password reset, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
        <p style="font-size: 12px; color: #888; text-align: center;">Event Management App Inc. | Local Server Mode</p>
      </div>
    `
  };

  if (!transporter) {
    console.log('\n==================================================');
    console.log('📬 [PASSWORD RESET EMAIL SIMULATOR] 📬');
    console.log(`To: ${email}`);
    console.log(`Reset Token: ${token}`);
    console.log(`Reset Link: ${resetUrl}`);
    console.log('SMTP is not configured in .env. Showing reset link above.');
    console.log('==================================================\n');
    return {
      success: true,
      simulated: true,
      resetUrl
    };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Reset email sent successfully to ${email}. Message ID: ${info.messageId}`);
    return {
      success: true,
      simulated: false
    };
  } catch (error) {
    console.error('Nodemailer error sending email:', error);
    // Return simulated details anyway so the system doesn't crash
    console.log(`[SMTP Error Fallback] Reset link: ${resetUrl}`);
    return {
      success: false,
      error: error.message,
      simulated: true,
      resetUrl
    };
  }
};

module.exports = {
  sendPasswordResetEmail
};
