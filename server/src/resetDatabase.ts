import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: 'postgres', // Connect to default database
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function resetDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database reset...');
    
    // Drop the database if it exists
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'car_guess_game'
      AND pid <> pg_backend_pid();
    `);
    
    await client.query('DROP DATABASE IF EXISTS car_guess_game');
    console.log('Dropped existing database');
    
    // Create a new database
    await client.query('CREATE DATABASE car_guess_game');
    console.log('Created new database');
    
    // Connect to the new database
    await client.release();
    const newPool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: 'car_guess_game',
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
    });
    
    const newClient = await newPool.connect();
    
    // Read and execute the init.sql file
    const initSqlPath = path.join(__dirname, 'db', 'init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    await newClient.query(initSql);
    console.log('Created tables with correct schema');
    
    // Import the data
    const { importCSV } = await import('./db/importCars');
    await importCSV();
    
    console.log('Database reset completed successfully');
  } catch (err) {
    console.error('Error resetting database:', err);
  }
}

// Run the function if directly executed
if (require.main === module) {
  resetDatabase().then(() => {
    console.log('Database reset script completed');
  }).catch(err => {
    console.error('Database reset failed:', err);
  });
}

export { resetDatabase }; 