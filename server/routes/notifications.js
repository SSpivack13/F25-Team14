import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.post('/notifications/add', async (req, res) => {
  // Accept either NOTIF_TYPE / NOTIF_CONTENT or notif_type / notif_content
  const {
    NOTIF_TYPE, NOTIF_CONTENT,
    notif_type, notif_content
  } = req.body;

  const type = NOTIF_TYPE || notif_type;
  const content = NOTIF_CONTENT || notif_content;

  if (!type || !content) {
    return res.status(400).json({ status: 'error', message: 'NOTIF_TYPE and NOTIF_CONTENT are required' });
  }

  try {
    const connection = await pool.getConnection();

    const [result] = await connection.execute(
      `INSERT INTO Notifications (NOTIF_TYPE, NOTIF_CONTENT) VALUES (?, ?)`,
      [type, content]
    );

    connection.release();

    if (result.affectedRows > 0) {
      res.status(201).json({ status: 'success', message: 'Notification created', id: result.insertId });
    } else {
      res.status(500).json({ status: 'error', message: 'Failed to create notification' });
    }
  } catch (err) {
    console.error('Error creating notification:', err);
    res.status(500).json({ status: 'error', message: 'An internal server error occurred', error: err.message });
  }
});

export default router;
