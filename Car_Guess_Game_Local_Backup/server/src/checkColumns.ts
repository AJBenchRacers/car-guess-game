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

async function checkColumns() {
  try {
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'cars'
      ORDER BY ordinal_position
    `);
    
    console.log('Columns in cars table:');
    console.log(result.rows.map(row => row.column_name));
    
    // Check for data in specific columns
    const dataResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(segment) as with_segment,
        COUNT(cylinders) as with_cylinders,
        COUNT(displacement) as with_displacement,
        COUNT(drive_type) as with_drive_type
      FROM cars
    `);
    
    if (dataResult.rows.length > 0) {
      console.log('\nColumn data statistics:');
      console.log(dataResult.rows[0]);
    }
    
    // Get a sample row to see the data
    const sampleResult = await pool.query(`
      SELECT * FROM cars LIMIT 1
    `);
    
    if (sampleResult.rows.length > 0) {
      console.log('\nSample car data:');
      console.log(sampleResult.rows[0]);
    }
    
  } catch (err) {
    console.error('Error checking columns:', err);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  checkColumns().then(() => {
    console.log('Finished checking columns');
  }).catch(err => {
    console.error('Error:', err);
  });
} 