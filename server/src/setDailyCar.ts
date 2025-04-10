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

async function setDailyCar() {
  const client = await pool.connect();
  try {
    console.log('Setting daily car with more complete data...');
    
    // Get cars with more complete data
    const completeCarsResult = await client.query(`
      SELECT id 
      FROM cars 
      WHERE segment IS NOT NULL
        AND drive_type IS NOT NULL
        AND (displacement IS NOT NULL OR cylinders IS NOT NULL)
      ORDER BY RANDOM()
      LIMIT 1
    `);
    
    if (completeCarsResult.rows.length === 0) {
      console.log('No cars with complete data found. Using any car.');
      const randomCarResult = await client.query(`
        SELECT id 
        FROM cars 
        ORDER BY RANDOM()
        LIMIT 1
      `);
      
      if (randomCarResult.rows.length === 0) {
        console.error('No cars found in the database.');
        return;
      }
      
      // Set as today's car
      await client.query(`
        DELETE FROM daily_cars 
        WHERE date = CURRENT_DATE
      `);
      
      await client.query(`
        INSERT INTO daily_cars (car_id, date)
        VALUES ($1, CURRENT_DATE)
      `, [randomCarResult.rows[0].id]);
      
      console.log(`Set random car (id=${randomCarResult.rows[0].id}) as today's car.`);
      
      // Get the car details
      const carDetailsResult = await client.query(`
        SELECT * FROM cars WHERE id = $1
      `, [randomCarResult.rows[0].id]);
      
      console.log('Daily car details:');
      console.log(carDetailsResult.rows[0]);
    } else {
      // We have a car with more complete data
      const carId = completeCarsResult.rows[0].id;
      
      // Set as today's car
      await client.query(`
        DELETE FROM daily_cars 
        WHERE date = CURRENT_DATE
      `);
      
      await client.query(`
        INSERT INTO daily_cars (car_id, date)
        VALUES ($1, CURRENT_DATE)
      `, [carId]);
      
      console.log(`Set car with more complete data (id=${carId}) as today's car.`);
      
      // Get the car details
      const carDetailsResult = await client.query(`
        SELECT * FROM cars WHERE id = $1
      `, [carId]);
      
      console.log('Daily car details:');
      console.log(carDetailsResult.rows[0]);
    }
    
  } catch (err) {
    console.error('Error setting daily car:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if directly executed
if (require.main === module) {
  setDailyCar().then(() => {
    console.log('Daily car setup completed');
  }).catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}

export { setDailyCar }; 