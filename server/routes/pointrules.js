import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get point rules (optionally filter by org_id)
router.get('/pointrules', async (req, res) => {
  const { org_id } = req.query;
  try {
    const connection = await pool.getConnection();
    let rows;
    if (org_id) {
      const [r] = await connection.execute('SELECT RULE_ID, ORG_ID, RULE_TYPE, PT_CHANGE FROM PointRules WHERE ORG_ID = ?', [org_id]);
      rows = r;
    } else {
      const [r] = await connection.query('SELECT RULE_ID, ORG_ID, RULE_TYPE, PT_CHANGE FROM PointRules');
      rows = r;
    }
    connection.release();
    res.json({ status: 'success', data: rows });
  } catch (err) {
    console.error('Error fetching point rules:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch point rules' });
  }
});

// Add a point rule. Expect body: { ORG_ID, RULE_TYPE, PT_CHANGE, user }
// user should contain USER_TYPE to authorize (admin or sponsor)
router.post('/pointrules/add', async (req, res) => {
  const { ORG_ID, RULE_TYPE, PT_CHANGE, user } = req.body;
  if (!user || !user.USER_TYPE) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized: user info required' });
  }
  const role = user.USER_TYPE;
  if (!(role === 'admin' || role === 'sponsor')) {
    return res.status(403).json({ status: 'error', message: 'Forbidden: only admin or sponsor can add point rules' });
  }
  if (!RULE_TYPE || PT_CHANGE === undefined || PT_CHANGE === null) {
    return res.status(400).json({ status: 'error', message: 'RULE_TYPE and PT_CHANGE are required' });
  }

  try {
    const connection = await pool.getConnection();
    // If RULE_ID is auto-increment in DB, let DB set it. Insert ORG_ID (nullable) if provided.
    const [result] = await connection.execute(
      'INSERT INTO PointRules (ORG_ID, RULE_TYPE, PT_CHANGE) VALUES (?, ?, ?)',
      [ORG_ID || null, RULE_TYPE, PT_CHANGE]
    );
    connection.release();
    if (result.affectedRows > 0) {
      res.status(201).json({ status: 'success', message: 'Point rule added', id: result.insertId });
    } else {
      res.status(500).json({ status: 'error', message: 'Failed to add point rule' });
    }
  } catch (err) {
    console.error('Error adding point rule:', err);
    res.status(500).json({ status: 'error', message: 'Failed to add point rule' });
  }
});

// Delete a point rule by RULE_ID
router.delete('/pointrules/:ruleId', async (req, res) => {
  const { ruleId } = req.params;
  const { user } = req.body || {};
  if (!user || !user.USER_TYPE) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized: user info required' });
  }
  const role = user.USER_TYPE;
  if (!(role === 'admin' || role === 'sponsor')) {
    return res.status(403).json({ status: 'error', message: 'Forbidden: only admin or sponsor can delete point rules' });
  }

  try {
    const connection = await pool.getConnection();
    const [result] = await connection.execute('DELETE FROM PointRules WHERE RULE_ID = ?', [ruleId]);
    connection.release();
    if (result.affectedRows > 0) {
      res.json({ status: 'success', message: 'Point rule deleted' });
    } else {
      res.status(404).json({ status: 'error', message: 'Point rule not found' });
    }
  } catch (err) {
    console.error('Error deleting point rule:', err);
    res.status(500).json({ status: 'error', message: 'Failed to delete point rule' });
  }
});

export default router;
