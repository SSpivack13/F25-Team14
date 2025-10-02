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

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ status: 'error', message: 'Username and password are required' });
  }

  try {
    const connection = await pool.getConnection();
    // Not permanent: Need to hash passwords before storing them in the database
    const [rows] = await connection.execute(
      'SELECT * FROM Users WHERE USERNAME = ? AND PASSWORD = ?',
      [username, password]
    );
    connection.release();

    if (rows.length > 0) {
      const user = rows[0];
      // Don't send password back to client
      delete user.password;
      res.json({ status: 'success', message: 'Login successful', user });
    } else {
      res.status(401).json({ status: 'error', message: 'Invalid username or password' });
    }
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ status: 'error', message: 'An internal server error occurred' });
  }
});

app.get('/api/about', async (req, res) => {
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

app.post('/api/users/add', async (req, res) => {
  const { username, password, userType } = req.body;

  if (!username || !password || !userType) {
    return res.status(400).json({ status: 'error', message: 'Username, password, and user type are required' });
  }

  try {
    const connection = await pool.getConnection();

    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT USERNAME FROM Users WHERE USERNAME = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      connection.release();
      return res.status(409).json({ status: 'error', message: 'Username already exists' });
    }

    // Not permanent: Need to hash passwords before storing them in the database
    const [result] = await connection.execute(
      'INSERT INTO Users (USERNAME, PASSWORD, USER_TYPE) VALUES (?, ?, ?)',
      [username, password, userType]
    );
    connection.release();

    if (result.affectedRows > 0) {
      res.status(201).json({ status: 'success', message: 'User created successfully' });
    } else {
      throw new Error('Failed to create user');
    }
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ status: 'error', message: 'An internal server error occurred' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default pool;