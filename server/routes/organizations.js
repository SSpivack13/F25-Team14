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

// Get user organizations with points (for admin adjust points page)
router.get('/user/:userId/organizations-with-points', async (req, res) => {
  const { userId } = req.params;

  try {
    const connection = await pool.getConnection();

    // Get user info
    const [userRows] = await connection.execute(
      'SELECT USER_ID, F_NAME, L_NAME, USER_TYPE FROM Users WHERE USER_ID = ?',
      [userId]
    );

    if (userRows.length === 0) {
      connection.release();
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const user = userRows[0];

    // Get all organizations the user belongs to with their points
    const [orgRows] = await connection.execute(`
      SELECT o.ORG_ID, o.ORG_NAME, COALESCE(uo.POINT_TOTAL, 0) as POINT_TOTAL
      FROM Organizations o
      INNER JOIN UserOrganizations uo ON o.ORG_ID = uo.ORG_ID
      WHERE uo.USER_ID = ?
      ORDER BY o.ORG_NAME
    `, [userId]);

    connection.release();

    res.json({
      status: 'success',
      data: {
        user: user,
        organizations: orgRows
      }
    });
  } catch (err) {
    console.error('Error fetching user organizations with points:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch user organizations' });
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
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY
      }
    });

    const inviteUrl = `${process.env.CLIENT_URL}/register?invite=${inviteToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `You're invited to join ${org.ORG_NAME}`,
      html: `
        <h2>You're invited to join ${org.ORG_NAME}!</h2>
        <p>You've been invited to join our driver program.</p>
        <p><a href="${inviteUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Accept Invitation</a></p>
        <p>If the button doesn't work, copy and paste this URL into your browser:</p>
        <p>${inviteUrl}</p>
        <br>
        <p style="color: #666; font-size: 12px;">If you didn't expect this invitation, you can safely ignore this email.</p>
      `
    });

    connection.release();
    res.json({ status: 'success', message: 'Invitation sent successfully' });
  } catch (err) {
    console.error('Error sending invitation:', err);
    res.status(500).json({ status: 'error', message: 'Failed to send invitation', error: err.message });
  }
});

router.post('/organizations/bulk-upload', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const userType = (req.headers['x-user-type'] || '').toLowerCase();

    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }

    const connection = await pool.getConnection();
    const fileContent = req.file.buffer.toString('utf-8');
    const lines = fileContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    let total = lines.length;
    let successful = 0;
    let failed = 0;
    const errors = [];

    // For admin files: map of orgName -> orgId created/found during processing
    const orgNameToId = {};

    // If sponsor upload, resolve sponsor's org once
    let sponsorOrgId = null;
    if (userType === 'sponsor') {
      if (!userId) {
        connection.release();
        return res.status(403).json({ status: 'error', message: 'Missing sponsor id header' });
      }
      const [rows] = await connection.execute(`
        SELECT o.ORG_ID FROM Organizations o
        INNER JOIN UserOrganizations uo ON o.ORG_ID = uo.ORG_ID
        WHERE uo.USER_ID = ?
      `, [userId]);
      if (rows.length === 0) {
        connection.release();
        return res.status(400).json({ status: 'error', message: 'Sponsor not assigned to any organization' });
      }
      sponsorOrgId = rows[0].ORG_ID;
    }

    // Helper: create or find org by exact name
    const findOrCreateOrg = async (orgName, allowCreate = false) => {
      if (!orgName || orgName.trim() === '') return null;
      if (orgNameToId[orgName]) return orgNameToId[orgName];

      // Find in DB
      const [existing] = await connection.execute(
        'SELECT ORG_ID FROM Organizations WHERE ORG_NAME = ?',
        [orgName]
      );
      if (existing.length > 0) {
        orgNameToId[orgName] = existing[0].ORG_ID;
        return existing[0].ORG_ID;
      }
      if (!allowCreate) return null;

      // Org_ID is not auto-increment — compute next ORG_ID and insert explicitly
      const [maxIdRows] = await connection.query('SELECT MAX(ORG_ID) AS maxId FROM Organizations');
      const nextOrgId = ((maxIdRows[0] && maxIdRows[0].maxId) || 0) + 1;

      const [insertRes] = await connection.execute(
        'INSERT INTO Organizations (ORG_ID, ORG_NAME) VALUES (?, ?)',
        [nextOrgId, orgName]
      );

      orgNameToId[orgName] = nextOrgId;
      return nextOrgId;
    };

    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split('|');

      const lineNo = i + 1;
      if (parts.length < 2) {
        errors.push(`Line ${lineNo}: Invalid format`);
        failed++;
        continue;
      }

      const type = parts[0].trim();
      if (!['O', 'D', 'S'].includes(type)) {
        errors.push(`Line ${lineNo}: Invalid type '${type}' (must be O, D, or S)`);
        failed++;
        continue;
      }

      // O record (admin only) format: O|Organization Name
      if (type === 'O') {
        if (userType !== 'admin') {
          errors.push(`Line ${lineNo}: O records are admin-only`);
          failed++;
          continue;
        }
        const orgName = (parts[1] || '').trim();
        if (!orgName) {
          errors.push(`Line ${lineNo}: Organization name required for O record`);
          failed++;
          continue;
        }
        // ensure no pipe in name
        if (orgName.includes('|')) {
          errors.push(`Line ${lineNo}: Organization name contains invalid '|' character`);
          failed++;
          continue;
        }
        try {
          const orgId = await findOrCreateOrg(orgName, true);
          successful++;
        } catch (err) {
          console.error(`Line ${lineNo} error creating org:`, err);
          errors.push(`Line ${lineNo}: ${err.message}`);
          failed++;
        }
        continue;
      }

      // D or S records require 5 fields: type|OrgName|First|Last|Email
      if (parts.length !== 5) {
        errors.push(`Line ${lineNo}: Invalid ${type} record format; expected 5 fields`);
        failed++;
        continue;
      }

      const orgName = (parts[1] || '').trim();
      const firstName = (parts[2] || '').trim();
      const lastName = (parts[3] || '').trim();
      const email = (parts[4] || '').trim();

      // Basic validation
      if ([orgName, firstName, lastName, email].some(f => f.includes('|'))) {
        errors.push(`Line ${lineNo}: Fields cannot contain '|' character`);
        failed++;
        continue;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push(`Line ${lineNo}: Invalid email '${email}'`);
        failed++;
        continue;
      }

      // Resolve target organization id
      let targetOrgId = null;
      if (userType === 'sponsor') {
        // Sponsors must omit organization name (per rules) — but allow if they included by mistake: use sponsor org
        targetOrgId = sponsorOrgId;
      } else if (userType === 'admin') {
        // Admins must provide organization name
        if (!orgName) {
          errors.push(`Line ${lineNo}: Organization name required for admin uploads`);
          failed++;
          continue;
        }
        // Try find or create (admins can rely on earlier O records or create implicitly)
        const resolved = await findOrCreateOrg(orgName, true);
        if (!resolved) {
          errors.push(`Line ${lineNo}: Organization '${orgName}' not found and could not be created`);
          failed++;
          continue;
        }
        targetOrgId = resolved;
      }

      try {
        // Check if user already exists
        const [existingUserRows] = await connection.execute(
          'SELECT USER_ID FROM Users WHERE EMAIL = ?',
          [email]
        );

        let newUserId;
        if (existingUserRows.length > 0) {
          newUserId = existingUserRows[0].USER_ID;
        } else {
          // compute next USER_ID (table is not auto-increment)
          const [maxUserRows] = await connection.query('SELECT MAX(USER_ID) AS maxId FROM Users');
          const nextUserId = ((maxUserRows[0] && maxUserRows[0].maxId) || 0) + 1;

          // create user with explicit USER_ID
          const username = email.split('@')[0];
          const hashedPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
          const userTypeDb = (type === 'D') ? 'driver' : 'sponsor';

          const [ins] = await connection.execute(
            'INSERT INTO Users (USER_ID, USERNAME, EMAIL, F_NAME, L_NAME, PASSWORD, USER_TYPE) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [nextUserId, username, email, firstName, lastName, hashedPassword, userTypeDb]
          );

          newUserId = nextUserId;
        }

        // Add to UserOrganizations composite table if not already present
        const [existingOrgUser] = await connection.execute(
          'SELECT * FROM UserOrganizations WHERE USER_ID = ? AND ORG_ID = ?',
          [newUserId, targetOrgId]
        );

        if (existingOrgUser.length === 0) {
          await connection.execute(
            'INSERT INTO UserOrganizations (USER_ID, ORG_ID) VALUES (?, ?)',
            [newUserId, targetOrgId]
          );
        } else {
          // already in org — treat as non-fatal
        }

        successful++;
      } catch (err) {
        console.error(`Line ${lineNo} processing error:`, err);
        errors.push(`Line ${lineNo}: ${err.message}`);
        failed++;
      }
    } // end for lines

    connection.release();

    res.json({
      status: 'success',
      message: `Processed ${total} records`,
      results: { total, successful, failed, errors }
    });
  } catch (err) {
    console.error('Error in bulk upload:', err);
    res.status(500).json({ status: 'error', message: 'Failed to process file: ' + err.message });
  }
});

// Update driver points in organization (sponsor or admin)
router.put('/organizations/update-driver-points', async (req, res) => {
  const { driverId, pointsDelta, user, orgId: requestedOrgId } = req.body;

  if (!user || !['sponsor', 'admin'].includes(user.USER_TYPE)) {
    return res.status(403).json({ status: 'error', message: 'Forbidden: only sponsors and admins can adjust points' });
  }

  try {
    const connection = await pool.getConnection();

    let orgId;

    if (user.USER_TYPE === 'sponsor') {
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

      orgId = sponsorOrgRows[0].ORG_ID;
    } else {
      // Admin can specify organization
      if (!requestedOrgId) {
        connection.release();
        return res.status(400).json({ status: 'error', message: 'Organization ID is required for admin' });
      }
      orgId = requestedOrgId;
    }

    // Update driver's points in UserOrganizations
    const [result] = await connection.execute(
      'UPDATE UserOrganizations SET POINT_TOTAL = COALESCE(POINT_TOTAL, 0) + ? WHERE USER_ID = ? AND ORG_ID = ?',
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
