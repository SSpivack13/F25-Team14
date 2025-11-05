import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Helper: get user's role and org ids from Users and UserOrganizations tables
async function getUserInfo(connection, userId) {
  const [uRows] = await connection.execute('SELECT USER_TYPE FROM Users WHERE USER_ID = ?', [userId]);
  if (uRows.length === 0) return null;
  const userInfo = uRows[0];

  // Get user's organizations from UserOrganizations table
  let orgIds = [];
  try {
    const [uoRows] = await connection.execute('SELECT ORG_ID FROM UserOrganizations WHERE USER_ID = ?', [userId]);
    if (uoRows && uoRows.length > 0) {
      orgIds = uoRows.map(r => r.ORG_ID);
    }
  } catch (err) {
    console.error('Error querying UserOrganizations:', err);
    // Table might not exist or other DB error; return empty list
  }

  return { USER_TYPE: userInfo.USER_TYPE, orgIds };
}

// Get point rules
router.get('/pointrules', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // req.userId is set by verifyToken middleware
    const userId = req.userId;
    if (!userId) {
      connection.release();
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const userInfo = await getUserInfo(connection, userId);
    if (!userInfo) {
      connection.release();
      return res.status(401).json({ status: 'error', message: 'User not found' });
    }

    // If sponsor, only return rules for their organizations
    if (userInfo.USER_TYPE === 'sponsor') {
      if (!userInfo.orgIds || userInfo.orgIds.length === 0) {
        connection.release();
        return res.json({ status: 'success', data: [] });
      }
      const placeholders = userInfo.orgIds.map(() => '?').join(',');
      const sql = `SELECT RULE_ID, ORG_ID, RULE_TYPE, PT_CHANGE FROM PointRules WHERE ORG_ID IN (${placeholders})`;
      const [rows] = await connection.execute(sql, userInfo.orgIds);
      connection.release();
      return res.json({ status: 'success', data: rows });
    }

    // Admin or other users: allow optional org_id filter
    const { org_id } = req.query;
    if (org_id) {
      let orgIds = org_id;
      if (Array.isArray(orgIds)) {
        orgIds = orgIds;
      } else if (typeof orgIds === 'string' && orgIds.includes(',')) {
        orgIds = orgIds.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        orgIds = [orgIds];
      }
      const placeholders = orgIds.map(() => '?').join(',');
      const sql = `SELECT RULE_ID, ORG_ID, RULE_TYPE, PT_CHANGE FROM PointRules WHERE ORG_ID IN (${placeholders})`;
      const [rows] = await connection.execute(sql, orgIds);
      connection.release();
      return res.json({ status: 'success', data: rows });
    }

    const [rows] = await connection.query('SELECT RULE_ID, ORG_ID, RULE_TYPE, PT_CHANGE FROM PointRules');
    connection.release();
    return res.json({ status: 'success', data: rows });
  } catch (err) {
    console.error('Error fetching point rules:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch point rules' });
  }
});

// Add a point rule. Body: { ORG_ID, RULE_TYPE, PT_CHANGE }
router.post('/pointrules/add', async (req, res) => {
  const { ORG_ID: requestedOrgId, RULE_TYPE, PT_CHANGE } = req.body;
  try {
    const connection = await pool.getConnection();
    const userId = req.userId;
    if (!userId) {
      connection.release();
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const userInfo = await getUserInfo(connection, userId);
    if (!userInfo) {
      connection.release();
      return res.status(401).json({ status: 'error', message: 'User not found' });
    }

    const role = userInfo.USER_TYPE;
    if (!(role === 'admin' || role === 'sponsor')) {
      connection.release();
      return res.status(403).json({ status: 'error', message: 'Forbidden: only admin or sponsor can add point rules' });
    }

    if (!RULE_TYPE || PT_CHANGE === undefined || PT_CHANGE === null) {
      connection.release();
      return res.status(400).json({ status: 'error', message: 'RULE_TYPE and PT_CHANGE are required' });
    }

    // Determine final ORG_ID
    let finalOrgId = null;
    if (role === 'sponsor') {
      if (!userInfo.orgIds || userInfo.orgIds.length === 0) {
        connection.release();
        return res.status(403).json({ status: 'error', message: 'Sponsor not assigned to any organization' });
      }
      if (requestedOrgId) {
        // ensure sponsor is adding for one of their orgs
        if (!userInfo.orgIds.map(String).includes(String(requestedOrgId))) {
          connection.release();
          return res.status(403).json({ status: 'error', message: 'Forbidden: cannot add rule for this organization' });
        }
        finalOrgId = requestedOrgId;
      } else {
        finalOrgId = userInfo.orgIds[0];
      }
    } else {
      // admin
      finalOrgId = requestedOrgId || null;
    }

    const [result] = await connection.execute(
      'INSERT INTO PointRules (ORG_ID, RULE_TYPE, PT_CHANGE) VALUES (?, ?, ?)',
      [finalOrgId || null, RULE_TYPE, PT_CHANGE]
    );
    connection.release();

    if (result.affectedRows > 0) {
      return res.status(201).json({ status: 'success', message: 'Point rule added', id: result.insertId });
    }
    return res.status(500).json({ status: 'error', message: 'Failed to add point rule' });
  } catch (err) {
    console.error('Error adding point rule:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to add point rule' });
  }
});

// Delete a point rule by RULE_ID
router.delete('/pointrules/:ruleId', async (req, res) => {
  const { ruleId } = req.params;
  try {
    const connection = await pool.getConnection();
    const userId = req.userId;
    if (!userId) {
      connection.release();
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const userInfo = await getUserInfo(connection, userId);
    if (!userInfo) {
      connection.release();
      return res.status(401).json({ status: 'error', message: 'User not found' });
    }

    const role = userInfo.USER_TYPE;

    const [ruleRows] = await connection.execute('SELECT ORG_ID FROM PointRules WHERE RULE_ID = ?', [ruleId]);
    if (ruleRows.length === 0) {
      connection.release();
      return res.status(404).json({ status: 'error', message: 'Point rule not found' });
    }
    const rule = ruleRows[0];

    if (role === 'sponsor') {
      if (!userInfo.orgIds || !userInfo.orgIds.map(String).includes(String(rule.ORG_ID))) {
        connection.release();
        return res.status(403).json({ status: 'error', message: 'Forbidden: cannot delete this rule' });
      }
    }

    const [result] = await connection.execute('DELETE FROM PointRules WHERE RULE_ID = ?', [ruleId]);
    connection.release();
    if (result.affectedRows > 0) {
      return res.json({ status: 'success', message: 'Point rule deleted' });
    }
    return res.status(500).json({ status: 'error', message: 'Failed to delete point rule' });
  } catch (err) {
    console.error('Error deleting point rule:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to delete point rule' });
  }
});

export default router;
