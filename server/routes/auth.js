import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ status: 'error', message: 'Username and password are required' });
  }

  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT * FROM Users WHERE USERNAME = ?',
      [username]
    );

    if (rows.length === 0) {
      connection.release();
      return res.status(401).json({ status: 'error', message: 'Invalid username or password' });
    }

    const user = rows[0];
    const hashed = user.PASSWORD;
    const match = await bcrypt.compare(password, hashed);

    if (!match) {
      connection.release();
      return res.status(401).json({ status: 'error', message: 'Invalid username or password' });
    }

    // Login Log audit
    await connection.execute(
      'INSERT INTO AuditLog (LOG_TYPE, USER_ID, TRANS_ID, LOG_DATE) VALUES (?, ?, NULL, NOW())',
      ['LOGIN', user.USER_ID]
    );
    connection.release();

    // Issue JWT token
    const token = jwt.sign({ userId: user.USER_ID }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '2h' });

    // Don't send password back to client
    delete user.PASSWORD;
    res.json({ status: 'success', message: 'Login successful', user, token });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ status: 'error', message: 'An internal server error occurred' });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ status: 'error', message: 'Email is required' });
  }

  try {
    const connection = await pool.getConnection();

    // Check if user exists with this email
    const [rows] = await connection.execute(
      'SELECT USER_ID, USERNAME, EMAIL, F_NAME FROM Users WHERE EMAIL = ?',
      [email]
    );

    if (rows.length === 0) {
      connection.release();
      // Don't reveal if email exists or not for security
      return res.json({ status: 'success', message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    const user = rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await connection.execute(
      'UPDATE Users SET RESET_TOKEN = ?, RESET_TOKEN_EXPIRY = ? WHERE USER_ID = ?',
      [resetToken, resetTokenExpiry, user.USER_ID]
    );

    // Send email with reset link
    const transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY
      }
    });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${user.F_NAME || user.USERNAME},</p>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <p><a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>If the button doesn't work, copy and paste this URL into your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <br>
        <p style="color: #666; font-size: 12px;">If you didn't request this password reset, you can safely ignore this email.</p>
      `
    });

    connection.release();
    res.json({ status: 'success', message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (err) {
    console.error('Error during password reset request:', err);
    res.status(500).json({ status: 'error', message: 'An internal server error occurred' });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ status: 'error', message: 'Token and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ status: 'error', message: 'Password must be at least 6 characters long' });
  }

  try {
    const connection = await pool.getConnection();

    // Find user with valid reset token
    const [rows] = await connection.execute(
      'SELECT USER_ID, USERNAME FROM Users WHERE RESET_TOKEN = ? AND RESET_TOKEN_EXPIRY > NOW()',
      [token]
    );

    if (rows.length === 0) {
      connection.release();
      return res.status(400).json({ status: 'error', message: 'Invalid or expired reset token' });
    }

    const user = rows[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await connection.execute(
      'UPDATE Users SET PASSWORD = ?, RESET_TOKEN = NULL, RESET_TOKEN_EXPIRY = NULL WHERE USER_ID = ?',
      [hashedPassword, user.USER_ID]
    );

    // Log password reset in audit log
    await connection.execute(
      'INSERT INTO AuditLog (LOG_TYPE, USER_ID, TRANS_ID, LOG_DATE) VALUES (?, ?, NULL, NOW())',
      ['PASSWORD_RESET', user.USER_ID]
    );

    connection.release();
    res.json({ status: 'success', message: 'Password has been reset successfully. You can now login with your new password.' });
  } catch (err) {
    console.error('Error during password reset:', err);
    res.status(500).json({ status: 'error', message: 'An internal server error occurred' });
  }
});

// Public driver registration (no invite required)
router.post('/register', async (req, res) => {
  const { username, password, f_name, l_name, email } = req.body;

  if (!username || !password || !f_name || !l_name || !email) {
    return res.status(400).json({ status: 'error', message: 'All fields are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ status: 'error', message: 'Password must be at least 6 characters long' });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ status: 'error', message: 'Please enter a valid email address' });
  }

  try {
    const connection = await pool.getConnection();

    // Check if username already exists
    const [existingUsers] = await connection.execute(
      'SELECT USERNAME FROM Users WHERE USERNAME = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      connection.release();
      return res.status(409).json({ status: 'error', message: 'Username already exists' });
    }

    // Check if email already exists
    const [existingEmails] = await connection.execute(
      'SELECT EMAIL FROM Users WHERE EMAIL = ?',
      [email]
    );

    if (existingEmails.length > 0) {
      connection.release();
      return res.status(409).json({ status: 'error', message: 'Email already registered' });
    }

    // Get next user ID
    const [maxIdResult] = await connection.query('SELECT MAX(USER_ID) AS maxId FROM Users');
    const nextUserId = (maxIdResult[0].maxId || 0) + 1;

    // Create driver account
    const hashedPassword = await bcrypt.hash(password, 10);
    await connection.execute(
      'INSERT INTO Users (USER_ID, USERNAME, PASSWORD, USER_TYPE, F_NAME, L_NAME, EMAIL, POINT_TOTAL) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
      [nextUserId, username, hashedPassword, 'driver', f_name, l_name, email]
    );

    // Log account creation
    await connection.execute(
      'INSERT INTO AuditLog (LOG_TYPE, USER_ID, TRANS_ID, LOG_DATE) VALUES (?, ?, NULL, NOW())',
      ['ACCOUNT_CREATED', nextUserId]
    );

    connection.release();
    res.json({ status: 'success', message: 'Account created successfully! You can now login.' });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ status: 'error', message: 'An internal server error occurred' });
  }
});

export default router;
