import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Always use SSL with Neon
export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection
pool.connect()
  .then(() => {
    console.log('Successfully connected to Neon database');
  })
  .catch((err) => {
    console.error('Error connecting to Neon database:', err.stack);
  });

export default pool; 