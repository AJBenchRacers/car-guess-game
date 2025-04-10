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

async function setChevroletCar() {
  const client = await pool.connect();
  try {
    console.log('Setting a random Chevrolet car as the daily car...');
    
    // Find a random Chevrolet car
    const chevroletCarsResult = await client.query(`
      SELECT id 
      FROM cars 
      WHERE LOWER(brand) = 'chevrolet' OR LOWER(make) = 'chevrolet'
      ORDER BY RANDOM()
      LIMIT 1
    `);
    
    if (chevroletCarsResult.rows.length === 0) {
      console.error('No Chevrolet cars found in the database.');
      return;
    }
    
    const carId = chevroletCarsResult.rows[0].id;
    
    // Set as today's car
    await client.query(`
      DELETE FROM daily_cars 
      WHERE date = CURRENT_DATE
    `);
    
    await client.query(`
      INSERT INTO daily_cars (car_id, date)
      VALUES ($1, CURRENT_DATE)
    `, [carId]);
    
    console.log(`Set Chevrolet car (id=${carId}) as today's car.`);
    
    // Get the car details
    const carDetailsResult = await client.query(`
      SELECT * FROM cars WHERE id = $1
    `, [carId]);
    
    console.log('Daily car details:');
    console.log(carDetailsResult.rows[0]);
    
  } catch (err) {
    console.error('Error setting Chevrolet car:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if directly executed
if (require.main === module) {
  setChevroletCar().then(() => {
    console.log('Chevrolet car setup completed');
  }).catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}

export { setChevroletCar }; 