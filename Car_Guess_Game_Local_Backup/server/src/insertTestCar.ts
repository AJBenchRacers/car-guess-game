import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function insertTestCar() {
  const client = await pool.connect();
  try {
    // Make sure tables exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS cars (
        id SERIAL PRIMARY KEY,
        make VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        year INTEGER NOT NULL,
        body_type VARCHAR(100) NOT NULL,
        engine VARCHAR(100),
        country VARCHAR(100) NOT NULL,
        image_url TEXT
      );
      
      CREATE TABLE IF NOT EXISTS daily_cars (
        id SERIAL PRIMARY KEY,
        car_id INTEGER REFERENCES cars(id),
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        UNIQUE(date)
      );
      
      CREATE INDEX IF NOT EXISTS idx_daily_cars_date ON daily_cars(date);
    `);
    
    // Insert a test car
    const carResult = await client.query(`
      INSERT INTO cars (make, model, year, body_type, engine, country)
      VALUES ('Toyota', 'Supra', 1998, 'Coupe', '2JZ-GTE', 'Japan')
      RETURNING id;
    `);
    
    const carId = carResult.rows[0].id;
    
    // Clear existing daily car for today
    await client.query(`
      DELETE FROM daily_cars WHERE date = CURRENT_DATE;
    `);
    
    // Set as today's car
    await client.query(`
      INSERT INTO daily_cars (car_id, date)
      VALUES ($1, CURRENT_DATE);
    `, [carId]);
    
    console.log('Test car inserted and set as today\'s car successfully!');
  } catch (err) {
    console.error('Error inserting test car:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

insertTestCar(); 