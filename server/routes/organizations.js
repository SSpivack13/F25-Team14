import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcrypt';

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
  const { ORG_LEADER_ID, ORG_NAME, user } = req.body;

  if (!user || user.USER_TYPE !== 'admin') {
    return res.status(403).json({ status: 'error', message: 'Forbidden: only admin can create organizations' });
  }

  if (!ORG_LEADER_ID) {
    return res.status(400).json({ status: 'error', message: 'Organization leader is required' });
  }

  if (!ORG_NAME) {
    return res.status(400).json({ status: 'error', message: 'Organization name is required' });
  }

  try {
    const connection = await pool.getConnection();

    // Check if the user ID exists and is a sponsor
    const [userRows] = await connection.execute(
      'SELECT USER_ID, USERNAME, USER_TYPE FROM Users WHERE USER_ID = ?',
      [ORG_LEADER_ID]
    );

    if (userRows.length === 0) {
      connection.release();
      return res.status(400).json({ status: 'error', message: 'User not found' });
    }

    const supervisorUser = userRows[0];

    if (supervisorUser.USER_TYPE !== 'sponsor') {
      connection.release();
      return res.status(400).json({ status: 'error', message: 'User is not a sponsor' });
    }

    // Check if this sponsor is already leading an organization
    const [existingOrgRows] = await connection.execute(
      'SELECT ORG_ID FROM Organizations WHERE ORG_LEADER_ID = ?',
      [ORG_LEADER_ID]
    );

    if (existingOrgRows.length > 0) {
      connection.release();
      return res.status(400).json({ status: 'error', message: 'This sponsor is already leading an organization' });
    }

    // Get the next ORG_ID
    const [maxIdResult] = await connection.query('SELECT MAX(ORG_ID) AS maxId FROM Organizations');
    const nextOrgId = (maxIdResult[0].maxId || 0) + 1;

    // Insert new organization
    const [result] = await connection.execute(
      'INSERT INTO Organizations (ORG_ID, ORG_LEADER_ID, ORG_NAME) VALUES (?, ?, ?)',
      [nextOrgId, ORG_LEADER_ID, ORG_NAME]
    );

    // Add the supervisor to the organization via UserOrganizations table
    await connection.execute(
      'INSERT INTO UserOrganizations (USER_ID, ORG_ID) VALUES (?, ?)',
      [supervisorUser.USER_ID, nextOrgId]
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

// Get organization details for sponsor
router.get('/organizations/my-org/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const connection = await pool.getConnection();
    
    // Check if user is a sponsor and get their organization
    const [sponsorOrgRows] = await connection.execute(`
      SELECT o.ORG_ID, o.ORG_NAME, o.ORG_LEADER_ID
      FROM Organizations o
      INNER JOIN UserOrganizations uo ON o.ORG_ID = uo.ORG_ID
      WHERE uo.USER_ID = ?
    `, [userId]);

    if (sponsorOrgRows.length === 0) {
      connection.release();
      return res.status(404).json({ status: 'error', message: 'User not assigned to any organization' });
    }

    const org = sponsorOrgRows[0];

    // Get all drivers in this organization
    const [driverRows] = await connection.execute(`
      SELECT u.USER_ID, u.USERNAME, u.F_NAME, u.L_NAME, u.POINT_TOTAL
      FROM Users u
      INNER JOIN UserOrganizations uo ON u.USER_ID = uo.USER_ID
      WHERE uo.ORG_ID = ? AND u.USER_TYPE = 'driver'
      ORDER BY u.USERNAME
    `, [org.ORG_ID]);

    connection.release();

    res.json({ 
      status: 'success', 
      data: {
        organization: org,
        drivers: driverRows
      }
    });
  } catch (err) {
    console.error('Error fetching organization details:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch organization details' });
  }
});

// Add driver to organization (sponsor only)
router.post('/organizations/add-driver', async (req, res) => {
  const { driverId, user } = req.body;

  if (!user || user.USER_TYPE !== 'sponsor') {
    return res.status(403).json({ status: 'error', message: 'Forbidden: only sponsors can add drivers' });
  }

  try {
    const connection = await pool.getConnection();

    // Get sponsor's organization
    const [sponsorOrgRows] = await connection.execute(`
      SELECT uo.ORG_ID
      FROM UserOrganizations uo
      WHERE uo.USER_ID = ?
    `, [user.USER_ID]);

    if (sponsorOrgRows.length === 0) {
      connection.release();
      return res.status(400).json({ status: 'error', message: 'Sponsor not assigned to any organization' });
    }

    const orgId = sponsorOrgRows[0].ORG_ID;

    // Check if driver exists and is actually a driver
    const [driverRows] = await connection.execute(
      'SELECT USER_ID, USER_TYPE FROM Users WHERE USER_ID = ? AND USER_TYPE = ?',
      [driverId, 'driver']
    );

    if (driverRows.length === 0) {
      connection.release();
      return res.status(400).json({ status: 'error', message: 'Driver not found' });
    }

    // Check if driver is already in THIS organization
    const [existingRows] = await connection.execute(
      'SELECT ORG_ID FROM UserOrganizations WHERE USER_ID = ? AND ORG_ID = ?',
      [driverId, orgId]
    );

    if (existingRows.length > 0) {
      connection.release();
      return res.status(400).json({ status: 'error', message: 'Driver is already in this organization' });
    }

    // Add driver to organization
    await connection.execute(
      'INSERT INTO UserOrganizations (USER_ID, ORG_ID) VALUES (?, ?)',
      [driverId, orgId]
    );

    connection.release();
    res.json({ status: 'success', message: 'Driver added to organization successfully' });
  } catch (err) {
    console.error('Error adding driver to organization:', err);
    res.status(500).json({ status: 'error', message: 'Failed to add driver to organization' });
  }
});

// Remove driver from organization (sponsor only)
router.delete('/organizations/remove-driver/:driverId', async (req, res) => {
  const { driverId } = req.params;
  const { user } = req.body;

  if (!user || user.USER_TYPE !== 'sponsor') {
    return res.status(403).json({ status: 'error', message: 'Forbidden: only sponsors can remove drivers' });
  }

  try {
    const connection = await pool.getConnection();

    // Get sponsor's organization
    const [sponsorOrgRows] = await connection.execute(`
      SELECT uo.ORG_ID
      FROM UserOrganizations uo
      WHERE uo.USER_ID = ?
    `, [user.USER_ID]);

    if (sponsorOrgRows.length === 0) {
      connection.release();
      return res.status(400).json({ status: 'error', message: 'Sponsor not assigned to any organization' });
    }

    const orgId = sponsorOrgRows[0].ORG_ID;

    // Remove driver from organization
    const [result] = await connection.execute(
      'DELETE FROM UserOrganizations WHERE USER_ID = ? AND ORG_ID = ?',
      [driverId, orgId]
    );

    connection.release();

    if (result.affectedRows > 0) {
      res.json({ status: 'success', message: 'Driver removed from organization successfully' });
    } else {
      res.status(404).json({ status: 'error', message: 'Driver not found in organization' });
    }
  } catch (err) {
    console.error('Error removing driver from organization:', err);
    res.status(500).json({ status: 'error', message: 'Failed to remove driver from organization' });
  }
});

// Delete organization (admin only with password confirmation)
router.delete('/organizations/:orgId', async (req, res) => {
  const { orgId } = req.params;
  const { password, user } = req.body;

  if (!user || user.USER_TYPE !== 'admin') {
    return res.status(403).json({ status: 'error', message: 'Forbidden: only admin can delete organizations' });
  }

  if (!password) {
    return res.status(400).json({ status: 'error', message: 'Password is required' });
  }

  try {
    const connection = await pool.getConnection();

    // Verify admin's password
    const [adminRows] = await connection.execute(
      'SELECT PASSWORD FROM Users WHERE USER_ID = ?',
      [user.USER_ID]
    );

    if (adminRows.length === 0) {
      connection.release();
      return res.status(401).json({ status: 'error', message: 'Admin user not found' });
    }

    const passwordMatch = await bcrypt.compare(password, adminRows[0].PASSWORD);
    if (!passwordMatch) {
      connection.release();
      return res.status(401).json({ status: 'error', message: 'Invalid password' });
    }

    // Check if organization exists
    const [orgRows] = await connection.execute(
      'SELECT ORG_ID FROM Organizations WHERE ORG_ID = ?',
      [orgId]
    );

    if (orgRows.length === 0) {
      connection.release();
      return res.status(404).json({ status: 'error', message: 'Organization not found' });
    }

    // Delete from UserOrganizations first (if table exists)
    try {
      await connection.execute(
        'DELETE FROM UserOrganizations WHERE ORG_ID = ?',
        [orgId]
      );
    } catch (err) {
      // UserOrganizations table might not exist yet, continue
    }

    // Delete the organization
    const [result] = await connection.execute(
      'DELETE FROM Organizations WHERE ORG_ID = ?',
      [orgId]
    );

    connection.release();

    if (result.affectedRows > 0) {
      res.json({ status: 'success', message: 'Organization deleted successfully' });
    } else {
      res.status(500).json({ status: 'error', message: 'Failed to delete organization' });
    }
  } catch (err) {
    console.error('Error deleting organization:', err);
    res.status(500).json({ status: 'error', message: 'Failed to delete organization' });
  }
});

export default router;
