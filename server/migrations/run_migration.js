import pool from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    const connection = await pool.getConnection();
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'add_password_reset_fields.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      console.log('Executing:', statement.trim().substring(0, 50) + '...');
      await connection.query(statement);
    }
    
    console.log('✅ Migration completed successfully!');
    connection.release();
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

runMigration();

