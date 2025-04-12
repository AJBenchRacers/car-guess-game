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

async function listCars() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT make, model, year, body_type, engine, country 
      FROM cars 
      ORDER BY make, model 
      LIMIT 100
    `);
    
    console.log('\nCars in database:');
    console.log('=====================================');
    
    if (result.rows.length === 0) {
      console.log('No cars found in the database.');
    } else {
      result.rows.forEach((car, index) => {
        console.log(`${index + 1}. ${car.make} ${car.model} (${car.year}) - ${car.body_type}, ${car.country}`);
      });
      
      console.log('\nTotal cars listed:', result.rows.length);
      
      // Get total count
      const countResult = await client.query('SELECT COUNT(*) FROM cars');
      console.log('Total cars in database:', countResult.rows[0].count);
    }
  } catch (err) {
    console.error('Error listing cars:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

listCars(); 