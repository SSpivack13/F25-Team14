import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.post('/users/add', async (req, res) => {
  const { username, password, userType, f_name, l_name} = req.body;

  if (!username || !password || !userType || !f_name || !l_name) {
    return res.status(400).json({ status: 'error', message: 'All Fields Required' });
  }

  try {
    const connection = await pool.getConnection();

    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT USERNAME FROM Users WHERE USERNAME = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      connection.release();
      return res.status(409).json({ status: 'error', message: 'Username already exists' });
    }
    const [maxIdResult] = await connection.query('SELECT MAX(USER_ID) AS maxId FROM Users');
    const nextUserId = (maxIdResult[0].maxId || 0) + 1;

    // Not permanent: Need to hash passwords before storing them in the database
    const [result] = await connection.execute(
      'INSERT INTO Users (USER_ID, USERNAME, PASSWORD, USER_TYPE, F_NAME, L_NAME, POINT_TOTAL) VALUES (?, ?, ?, ?, ?, ?, 0)',
      [nextUserId, username, password, userType, f_name, l_name]
    );
    connection.release();

    if (result.affectedRows > 0) {
      res.status(201).json({ status: 'success', message: 'User created successfully' });
    } else {
      throw new Error('Failed to create user');
    }
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ status: 'error', message: 'An internal server error occurred' });
  }
});

router.get('/users/:userid/points', async (req, res) => {
  const { userid } = req.params;

  if (!userid) {
    return res.status(400).json({ status: 'error', message: 'User ID is required' });
  }

  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT F_NAME, L_NAME, POINT_TOTAL FROM Users WHERE USER_ID = ?',
      [userid]
    );
    connection.release();

    if (rows.length > 0) {
      const userPoints = rows[0];
      res.json({ status: 'success', data: userPoints });
    } else {
      res.status(404).json({ status: 'error', message: 'User not found' });
    }
  } catch (err) {
    console.error('Error fetching user points:', err);
    res.status(500).json({ status: 'error', message: 'An internal server error occurred' });
  }
});

export default router;
