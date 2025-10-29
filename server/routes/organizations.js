import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all organizations
router.get('/organizations', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM Organizations');
    connection.release();
    res.json({ status: 'success', data: rows });
  } catch (err) {
    console.error('Error fetching organizations:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch organizations' });
  }
});

// Add organization (admin only)
router.post('/organizations/add', async (req, res) => {
  const { ORG_LEADER, user } = req.body;

  if (!user || user.USER_TYPE !== 'admin') {
    return res.status(403).json({ status: 'error', message: 'Forbidden: only admin can create organizations' });
  }

  if (!ORG_LEADER) {
    return res.status(400).json({ status: 'error', message: 'Organization leader username is required' });
  }

  try {
    const connection = await pool.getConnection();

    // Check if the username exists and is a supervisor
    const [userRows] = await connection.execute(
      'SELECT USER_ID, USERNAME, USER_TYPE FROM Users WHERE USERNAME = ?',
      [ORG_LEADER]
    );

    if (userRows.length === 0) {
      connection.release();
      return res.status(400).json({ status: 'error', message: 'Username not found' });
    }

    const supervisorUser = userRows[0];

    if (supervisorUser.USER_TYPE !== 'sponsor') {
      connection.release();
      return res.status(400).json({ status: 'error', message: 'User is not a sponsor' });
    }

    // Check if this supervisor is already leading an organization
    const [existingOrgRows] = await connection.execute(
      'SELECT ORG_ID FROM Organizations WHERE ORG_LEADER = ?',
      [ORG_LEADER]
    );

    if (existingOrgRows.length > 0) {
      connection.release();
      return res.status(400).json({ status: 'error', message: 'This supervisor is already leading an organization' });
    }

    // Get the next ORG_ID
    const [maxIdResult] = await connection.query('SELECT MAX(ORG_ID) AS maxId FROM Organizations');
    const nextOrgId = (maxIdResult[0].maxId || 0) + 1;

    // Insert new organization
    const [result] = await connection.execute(
      'INSERT INTO Organizations (ORG_ID, ORG_LEADER) VALUES (?, ?)',
      [nextOrgId, ORG_LEADER]
    );

    // Update the supervisor's ORG_ID to assign them to this organization
    await connection.execute(
      'UPDATE Users SET ORG_ID = ? WHERE USER_ID = ?',
      [nextOrgId, supervisorUser.USER_ID]
    );

    connection.release();

    if (result.affectedRows > 0) {
      res.status(201).json({ status: 'success', message: 'Organization created successfully', orgId: nextOrgId });
    } else {
      res.status(500).json({ status: 'error', message: 'Failed to create organization' });
    }
  } catch (err) {
    console.error('Error creating organization:', err);
    res.status(500).json({ status: 'error', message: 'Failed to create organization' });
  }
});

// Get organization details by user's ORG_ID
router.get('/organizations/my-org/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const connection = await pool.getConnection();
    
    // Get organization ID for user
    const [userRows] = await connection.execute(
      'SELECT ORG_ID FROM Users WHERE USER_ID = ?',
      [userId]
    );

    if (userRows.length === 0 || !userRows[0].ORG_ID) {
      connection.release();
      return res.status(404).json({ status: 'error', message: 'User not assigned to any organization' });
    }

    const orgId = userRows[0].ORG_ID;

    // Get organization details
    const [orgRows] = await connection.execute(
      'SELECT * FROM Organizations WHERE ORG_ID = ?',
      [orgId]
    );

    // Get all members of this organization
    const [memberRows] = await connection.execute(
      'SELECT USER_ID, USERNAME, F_NAME, L_NAME, USER_TYPE FROM Users WHERE ORG_ID = ?',
      [orgId]
    );

    connection.release();

    if (orgRows.length > 0) {
      res.json({ 
        status: 'success', 
        data: {
          organization: orgRows[0],
          members: memberRows
        }
      });
    } else {
      res.status(404).json({ status: 'error', message: 'Organization not found' });
    }
  } catch (err) {
    console.error('Error fetching organization:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch organization' });
  }
});

export default router;
