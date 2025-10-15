import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/about', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM About ORDER BY SPRINT DESC LIMIT 1');
    connection.release();

    if (rows.length > 0) {
      res.json({ status: 'success', data: rows[0] });
    } else {
      res.status(404).json({ status: 'error', message: 'About information not found' });
    }
  } catch (err) {
    console.error('Error fetching about information:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch about information', error: err.message });
  }
});

export default router;
