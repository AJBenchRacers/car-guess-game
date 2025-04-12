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

async function checkCars() {
  try {
    console.log('Checking car data in the database...');
    
    // Get column statistics
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(segment) as with_segment,
        COUNT(cylinders) as with_cylinders,
        COUNT(displacement) as with_displacement,
        COUNT(drive_type) as with_drive_type,
        COUNT(body_style) as with_body_style,
        COUNT(to_year) as with_to_year,
        COUNT(fuel) as with_fuel
      FROM cars
    `);
    
    console.log('Data statistics:');
    console.log(statsResult.rows[0]);
    
    // Get sample cars with all data
    const sampleResult = await pool.query(`
      SELECT id, make, model, year, segment, cylinders, displacement, drive_type, body_style
      FROM cars
      WHERE segment IS NOT NULL 
        AND cylinders IS NOT NULL 
        AND displacement IS NOT NULL 
        AND drive_type IS NOT NULL
      LIMIT 5
    `);
    
    console.log('\nSample cars with complete data:');
    console.log(sampleResult.rows);
    
    // Check what car will be shown to users today
    const todayCarResult = await pool.query(`
      SELECT c.*
      FROM cars c
      JOIN daily_cars dc ON c.id = dc.car_id
      WHERE dc.date = CURRENT_DATE
    `);
    
    if (todayCarResult.rows.length > 0) {
      console.log('\nToday\'s car:');
      console.log(todayCarResult.rows[0]);
    } else {
      console.log('\nNo car selected for today');
    }
    
  } catch (err) {
    console.error('Error checking cars:', err);
  } finally {
    await pool.end();
  }
}

// Run if directly executed
if (require.main === module) {
  checkCars().then(() => {
    console.log('Car check completed');
  }).catch(err => {
    console.error('Error:', err);
  });
}

export { checkCars }; 