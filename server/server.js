import mysql from 'mysql2/promise';
import cors from 'cors';
import express from 'express';
import 'dotenv/config';

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

app.get('/api/test-db', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to the database.');
    connection.release();
    res.json({ status: 'success', message: 'Database connection is working' });
  } catch (err) {
    console.error('Error connecting to the database:', err);
    res.status(500).json({ status: 'error', message: 'Database connection failed', error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default pool;