import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ status: 'error', message: 'Username and password are required' });
  }

  try {
    const connection = await pool.getConnection();
    // Not permanent: Need to hash passwords before storing them in the database
    const [rows] = await connection.execute(
      'SELECT * FROM Users WHERE USERNAME = ? AND PASSWORD = ?',
      [username, password]
    );
    connection.release();

    if (rows.length > 0) {
      const user = rows[0];
      // Don't send password back to client
      delete user.password;
      res.json({ status: 'success', message: 'Login successful', user });
    } else {
      res.status(401).json({ status: 'error', message: 'Invalid username or password' });
    }
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ status: 'error', message: 'An internal server error occurred' });
  }
});

export default router;
