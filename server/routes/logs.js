import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Admin: fetch audit logs with optional filters
// Query params: requester_id (required), start_date, end_date, user_id, log_type
router.get('/auditlogs', async (req, res) => {
  const { requester_id, start_date, end_date, user_id, log_type } = req.query;
  if (!requester_id) {
    return res.status(400).json({ status: 'error', message: 'requester_id is required' });
  }

  try {
    const connection = await pool.getConnection();
    // Verify requester is admin
    const [reqRows] = await connection.execute('SELECT USER_TYPE FROM Users WHERE USER_ID = ?', [requester_id]);
    if (!reqRows || reqRows.length === 0) {
      connection.release();
      return res.status(404).json({ status: 'error', message: 'Requester user not found' });
    }
    if (reqRows[0].USER_TYPE !== 'admin') {
      connection.release();
      return res.status(403).json({ status: 'error', message: 'Forbidden: admin access required' });
    }

    // Build dynamic WHERE clause
    const where = [];
    const values = [];
    if (start_date) {
      where.push('LOG_DATE >= ?');
      values.push(start_date);
    }
    if (end_date) {
      where.push('LOG_DATE <= ?');
      values.push(end_date);
    }
    if (user_id) {
      where.push('USER_ID = ?');
      values.push(user_id);
    }
    if (log_type) {
      where.push('LOG_TYPE = ?');
      values.push(log_type);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await connection.query(`SELECT LOG_ID, LOG_TYPE, USER_ID, TRANS_ID, LOG_DATE FROM AuditLog ${whereSql} ORDER BY LOG_DATE DESC`, values);
    connection.release();
    return res.json({ status: 'success', data: rows });
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch audit logs' });
  }
});

export default router;