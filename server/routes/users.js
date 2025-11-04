import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcrypt';

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

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await connection.execute(
      'INSERT INTO Users (USER_ID, USERNAME, PASSWORD, USER_TYPE, F_NAME, L_NAME, POINT_TOTAL) VALUES (?, ?, ?, ?, ?, ?, 0)',
      [nextUserId, username, hashed, userType, f_name, l_name]
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

router.get('/users', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM Users');
    connection.release();
    res.json(rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch users' });
  }
});

router.put('/updateUser/:userId', async (req, res) => {
  const { userId } = req.params;
  const fields = req.body;
  if (!userId || !fields || Object.keys(fields).length === 0) {
    return res.status(400).json({ status: 'error', message: 'User ID and at least one field required' });
  }

  const allowedFields = ['F_NAME', 'L_NAME', 'EMAIL', 'USERNAME', 'PASSWORD', 'POINT_TOTAL', 'USER_TYPE', 'ORG_ID'];
  const updates = [];
  const values = [];
  for (const key of Object.keys(fields)) {
    if (allowedFields.includes(key)) {
      updates.push(`${key} = ?`);
      values.push(fields[key]);
    }
  }
  if (updates.length === 0) {
    return res.status(400).json({ status: 'error', message: 'No valid fields to update' });
  }
  values.push(userId);

  try {
    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      `UPDATE Users SET ${updates.join(', ')} WHERE USER_ID = ?`,
      values
    );
    connection.release();
    if (result.affectedRows > 0) {
      res.json({ status: 'success', message: 'User updated successfully' });
    } else {
      res.status(404).json({ status: 'error', message: 'User not found' });
    }
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ status: 'error', message: 'Failed to update user' });
  }
});

// Getting User Profile With User Type 
router.get('/users/:userid/profile', async (req, res) => {
  const { userid } = req.params;

  if ( !userid ) {
    return res.status( 400 ).json({ status: 'error', message: 'User ID is required' });
  }

  try {
    const connection = await pool.getConnection();
    const [ rows ] = await connection.execute(
      'SELECT USER_ID, USERNAME, EMAIL, F_NAME, L_NAME, USER_TYPE FROM Users WHERE USER_ID = ?',
      [ userid ]
    );
    connection.release();

    if ( rows.length > 0 ) {
      const userProfile = rows[ 0 ];
      res.json({ status: 'success', data: userProfile });
    } else {
      res.status( 404 ).json({ status: 'error', message: 'User not found' });
    }
  } catch ( err ) {
    console.error( 'Error fetching user profile:', err );
    res.status( 500 ).json({ status: 'error', message: 'An internal server error occurred' });
  }
});

// Get sponsors not assigned to any organization
router.get('/users/unassigned-sponsors', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Get sponsors who are not in the UserOrganizations table
    const [rows] = await connection.execute(`
      SELECT u.USER_ID, u.USERNAME, u.F_NAME, u.L_NAME 
      FROM Users u 
      WHERE u.USER_TYPE = 'sponsor' 
      AND u.USER_ID NOT IN (
        SELECT DISTINCT USER_ID 
        FROM UserOrganizations
      )
      ORDER BY u.USERNAME
    `);
    
    connection.release();
    res.json({ status: 'success', data: rows });
  } catch (err) {
    console.error('Error fetching unassigned sponsors:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch unassigned sponsors' });
  }
});

export default router;