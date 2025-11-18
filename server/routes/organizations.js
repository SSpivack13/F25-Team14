import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

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
    
    // Check if user is a sponsor and get their organization (including product selections)
    const [sponsorOrgRows] = await connection.execute(`
      SELECT o.ORG_ID, o.ORG_NAME, o.ORG_LEADER_ID, o.product1, o.product2, o.product3, o.product4, o.product5
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
      SELECT u.USER_ID, u.USERNAME, u.F_NAME, u.L_NAME, COALESCE(uo.POINT_TOTAL, 0) as POINT_TOTAL
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

// Get all organizations for a driver (via UserOrganizations)
router.get('/driver/:userId/organizations', async (req, res) => {
  const { userId } = req.params;

  try {
    const connection = await pool.getConnection();
    
    // Get all organizations the driver belongs to
    const [driverOrgRows] = await connection.execute(`
      SELECT o.ORG_ID, o.ORG_NAME, o.ORG_LEADER_ID, o.product1, o.product2, o.product3, o.product4, o.product5
      FROM Organizations o
      INNER JOIN UserOrganizations uo ON o.ORG_ID = uo.ORG_ID
      WHERE uo.USER_ID = ?
      ORDER BY o.ORG_NAME
    `, [userId]);

    connection.release();

    if (driverOrgRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not assigned to any organization' });
    }

    res.json({ 
      status: 'success', 
      data: driverOrgRows
    });
  } catch (err) {
    console.error('Error fetching driver organizations:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch driver organizations' });
  }
});

// Get catalog (products) for a specific organization
router.get('/organization/:orgId/catalog', async (req, res) => {
  const { orgId } = req.params;

  try {
    const connection = await pool.getConnection();
    
    const [orgRows] = await connection.execute(`
      SELECT ORG_ID, ORG_NAME, product1, product2, product3, product4, product5
      FROM Organizations
      WHERE ORG_ID = ?
    `, [orgId]);

    connection.release();

    if (orgRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Organization not found' });
    }

    const org = orgRows[0];
    const productIds = [org.product1, org.product2, org.product3, org.product4, org.product5]
      .filter(id => id !== null && id !== undefined)
      .map(Number);

    res.json({ 
      status: 'success', 
      data: {
        organization: org,
        productIds: productIds
      }
    });
  } catch (err) {
    console.error('Error fetching catalog:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch catalog' });
  }
});

// Update organization catalog (admin or sponsor only)
router.put('/organization/:orgId/catalog', async (req, res) => {
  const { orgId } = req.params;
  const { product1, product2, product3, product4, product5, user } = req.body;

  if (!user || !['admin', 'sponsor'].includes(user.USER_TYPE)) {
    return res.status(403).json({ status: 'error', message: 'Forbidden: only admins and sponsors can update catalog' });
  }

  try {
    const connection = await pool.getConnection();

    // If sponsor, verify they own this organization
    if (user.USER_TYPE === 'sponsor') {
      const [sponsorOrgRows] = await connection.execute(`
        SELECT uo.ORG_ID
        FROM UserOrganizations uo
        WHERE uo.USER_ID = ? AND uo.ORG_ID = ?
      `, [user.USER_ID, orgId]);

      if (sponsorOrgRows.length === 0) {
        connection.release();
        return res.status(403).json({ status: 'error', message: 'Forbidden: you do not own this organization' });
      }
    }
    // If admin, no need to check ownership - they can update any organization

    // Update organization with selected products
    const [result] = await connection.execute(
      'UPDATE Organizations SET product1 = ?, product2 = ?, product3 = ?, product4 = ?, product5 = ? WHERE ORG_ID = ?',
      [product1, product2, product3, product4, product5, orgId]
    );

    connection.release();

    if (result.affectedRows > 0) {
      res.json({ status: 'success', message: 'Catalog updated successfully' });
    } else {
      res.status(404).json({ status: 'error', message: 'Organization not found' });
    }
  } catch (err) {
    console.error('Error updating catalog:', err);
    res.status(500).json({ status: 'error', message: 'Failed to update catalog' });
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

// Send driver invitation email (sponsor only)
router.post('/organizations/invite-driver', async (req, res) => {
  const { email, user } = req.body;

  if (!user || user.USER_TYPE !== 'sponsor') {
    return res.status(403).json({ status: 'error', message: 'Forbidden: only sponsors can invite drivers' });
  }

  if (!email) {
    return res.status(400).json({ status: 'error', message: 'Email is required' });
  }

  try {
    const connection = await pool.getConnection();

    // Get sponsor's organization
    const [sponsorOrgRows] = await connection.execute(`
      SELECT o.ORG_ID, o.ORG_NAME
      FROM Organizations o
      INNER JOIN UserOrganizations uo ON o.ORG_ID = uo.ORG_ID
      WHERE uo.USER_ID = ?
    `, [user.USER_ID]);

    if (sponsorOrgRows.length === 0) {
      connection.release();
      return res.status(400).json({ status: 'error', message: 'Sponsor not assigned to any organization' });
    }

    const org = sponsorOrgRows[0];
    const inviteToken = crypto.randomBytes(32).toString('hex');

    // Store invitation (table already exists)
    await connection.execute(
      'INSERT INTO DriverInvitations (EMAIL, ORG_ID, INVITE_TOKEN, INVITED_BY, CREATED_AT) VALUES (?, ?, ?, ?, NOW())',
      [email, org.ORG_ID, inviteToken, user.USER_ID]
    );

    // Send email with Resend
    const transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 587,
      secure: false,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY
      }
    });

    const inviteUrl = `${process.env.CLIENT_URL}/register?invite=${inviteToken}`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Invitation to join ${org.ORG_NAME}`,
      html: `
        <h2>You're invited to join ${org.ORG_NAME}!</h2>
        <p>You've been invited to join our driver program.</p>
        <p><a href="${inviteUrl}">Click here to sign up</a></p>
        <p>If the link doesn't work, copy and paste this URL: ${inviteUrl}</p>
      `
    });

    connection.release();
    res.json({ status: 'success', message: 'Invitation sent successfully' });
  } catch (err) {
    console.error('Error sending invitation:', err);
    res.status(500).json({ status: 'error', message: 'Failed to send invitation', error: err.message });
  }
});

// Bulk upload users (sponsor only)
router.post('/organizations/bulk-upload', async (req, res) => {
  try {
    // Get user from custom headers
    const userId = req.headers['x-user-id'];
    const userType = req.headers['x-user-type'];

    if (!userId || userType !== 'sponsor') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: only sponsors can bulk upload' });
    }

    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }

    const connection = await pool.getConnection();

    // Get sponsor's organization
    const [sponsorOrgRows] = await connection.execute(`
      SELECT o.ORG_ID, o.ORG_NAME
      FROM Organizations o
      INNER JOIN UserOrganizations uo ON o.ORG_ID = uo.ORG_ID
      WHERE uo.USER_ID = ?
    `, [userId]);

    if (sponsorOrgRows.length === 0) {
      connection.release();
      return res.status(400).json({ status: 'error', message: 'Sponsor not assigned to any organization' });
    }

    const orgId = sponsorOrgRows[0].ORG_ID;
    const fileContent = req.file.buffer.toString('utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim());

    let successful = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split('|');
      
      if (parts.length !== 5) {
        errors.push(`Line ${i + 1}: Invalid format. Expected 5 fields separated by |`);
        failed++;
        continue;
      }

      const [type, orgName, firstName, lastName, email] = parts;

      if (!['D', 'S'].includes(type)) {
        errors.push(`Line ${i + 1}: Invalid type '${type}'. Must be D (Driver) or S (Sponsor)`);
        failed++;
        continue;
      }

      if (orgName.trim() !== '') {
        errors.push(`Line ${i + 1}: Organization name field must be empty for sponsors`);
        failed++;
        continue;
      }

      if (firstName.includes('|') || lastName.includes('|') || email.includes('|')) {
        errors.push(`Line ${i + 1}: Data cannot contain pipe (|) character`);
        failed++;
        continue;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push(`Line ${i + 1}: Invalid email format`);
        failed++;
        continue;
      }

      try {
        const [existingUser] = await connection.execute(
          'SELECT USER_ID FROM Users WHERE EMAIL = ?',
          [email]
        );

        let userId;

        if (existingUser.length > 0) {
          // User already exists
          userId = existingUser[0].USER_ID;
          errors.push(`Line ${i + 1}: User with email ${email} already exists`);

        } else {
          // Generate next USER_ID manually
          const [maxIdResult] = await connection.query(
            'SELECT COALESCE(MAX(USER_ID), 0) + 1 AS nextId FROM Users'
          );
          const nextUserId = maxIdResult[0].nextId;

          const username = email.split('@')[0];
          const hashedPassword = await bcrypt.hash(
            crypto.randomBytes(16).toString('hex'),
            10
          );

          // Insert user with manual USER_ID
          await connection.execute(
            'INSERT INTO Users (USER_ID, USERNAME, EMAIL, F_NAME, L_NAME, PASSWORD, USER_TYPE) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
              nextUserId,
              username,
              email,
              firstName,
              lastName,
              hashedPassword,
              type === 'D' ? 'driver' : 'sponsor'
            ]
          );

          userId = nextUserId;

          console.log(`Created new user: ${email}, USER_ID: ${userId}`);
        }
        
        const [existingOrgUser] = await connection.execute(
          'SELECT * FROM UserOrganizations WHERE USER_ID = ? AND ORG_ID = ?',
          [userId, orgId]
        );

        if (existingOrgUser.length === 0) {
          await connection.execute(
            'INSERT INTO UserOrganizations (USER_ID, ORG_ID) VALUES (?, ?)',
            [userId, orgId]
          );
          console.log(`Added USER_ID ${userId} to ORG_ID ${orgId}`);
          successful++;
        } else {
          errors.push(`Line ${i + 1}: User already assigned to this organization`);
          failed++;
        }
      } catch (err) {
        console.error(`Error processing line ${i + 1}:`, err);
        errors.push(`Line ${i + 1}: ${err.message}`);
        failed++;
      }
    }

    connection.release();

    res.json({
      status: 'success',
      message: `Processed ${lines.length} records`,
      results: {
        total: lines.length,
        successful,
        failed,
        errors
      }
    });
  } catch (err) {
    console.error('Error in bulk upload:', err);
    res.status(500).json({ status: 'error', message: 'Failed to process file: ' + err.message });
  }
});

// Update driver points in organization
router.put('/organizations/update-driver-points', async (req, res) => {
  const { driverId, pointsDelta, user } = req.body;

  if (!user || user.USER_TYPE !== 'sponsor') {
    return res.status(403).json({ status: 'error', message: 'Forbidden: only sponsors can adjust points' });
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

    // Update points in UserOrganizations table
    const [result] = await connection.execute(
      'UPDATE UserOrganizations SET POINT_TOTAL = POINT_TOTAL + ? WHERE USER_ID = ? AND ORG_ID = ?',
      [pointsDelta, driverId, orgId]
    );

    connection.release();

    if (result.affectedRows > 0) {
      res.json({ status: 'success', message: 'Points updated successfully' });
    } else {
      res.status(400).json({ status: 'error', message: 'Driver not found in organization' });
    }
  } catch (err) {
    console.error('Error updating driver points:', err);
    res.status(500).json({ status: 'error', message: 'Failed to update points' });
  }
});

export default router;
