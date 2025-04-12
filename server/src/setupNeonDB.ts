import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupDatabase() {
  try {
    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cars (
        id SERIAL PRIMARY KEY,
        brand VARCHAR(255),
        model VARCHAR(255),
        production_from_year INTEGER,
        segment VARCHAR(255),
        cylinders INTEGER,
        displacement INTEGER,
        drive_type VARCHAR(255),
        body_style VARCHAR(255),
        to_year INTEGER,
        fuel VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS daily_cars (
        id SERIAL PRIMARY KEY,
        car_id INTEGER REFERENCES cars(id),
        date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE
      );
    `);

    // Import car data from CSV
    const results: any[] = [];
    fs.createReadStream(path.join(__dirname, '../data/cars.csv'))
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        // Clear existing data
        await pool.query('DELETE FROM daily_cars');
        await pool.query('DELETE FROM cars');

        // Insert new data
        for (const car of results) {
          await pool.query(
            `INSERT INTO cars (
              brand, model, production_from_year, segment, cylinders,
              displacement, drive_type, body_style, to_year, fuel
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              car.brand,
              car.model,
              parseInt(car.production_from_year),
              car.segment,
              parseInt(car.cylinders),
              parseInt(car.displacement),
              car.drive_type,
              car.body_style,
              parseInt(car.to_year),
              car.fuel
            ]
          );
        }

        console.log('Database setup complete!');
        process.exit(0);
      });
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase(); 