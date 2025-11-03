import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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

export default router;
