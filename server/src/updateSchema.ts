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

async function updateSchema() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database schema update...');
    
    // Check if columns already exist
    const checkColumnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'cars'
    `;
    
    const columnsResult = await client.query(checkColumnsQuery);
    const existingColumns = columnsResult.rows.map(row => row.column_name);
    
    console.log('Existing columns:', existingColumns);
    
    // Add the new columns if they don't exist
    const columnsToAdd = [
      { name: 'brand', type: 'VARCHAR(100)' },
      { name: 'production_from_year', type: 'INTEGER' },
      { name: 'segment', type: 'VARCHAR(100)' },
      { name: 'cylinders', type: 'INTEGER' },
      { name: 'displacement', type: 'INTEGER' },
      { name: 'drive_type', type: 'VARCHAR(100)' },
      { name: 'body_style', type: 'VARCHAR(100)' },
      { name: 'to_year', type: 'INTEGER' },
      { name: 'title', type: 'TEXT' },
      { name: 'description', type: 'TEXT' },
      { name: 'engine_speed', type: 'VARCHAR(100)' },
      { name: 'power', type: 'INTEGER' },
      { name: 'torque', type: 'INTEGER' },
      { name: 'fuel_system', type: 'VARCHAR(100)' },
      { name: 'fuel', type: 'VARCHAR(100)' },
      { name: 'fuel_capacity', type: 'NUMERIC(10,2)' },
      { name: 'top_speed', type: 'INTEGER' }
    ];
    
    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name.toLowerCase())) {
        console.log(`Adding column: ${column.name}`);
        await client.query(`
          ALTER TABLE cars 
          ADD COLUMN ${column.name} ${column.type}
        `);
      } else {
        console.log(`Column ${column.name} already exists, skipping`);
      }
    }
    
    // Update brand from make if it's null
    await client.query(`
      UPDATE cars
      SET brand = make
      WHERE brand IS NULL
    `);
    
    // Update production_from_year from year if it's null
    await client.query(`
      UPDATE cars
      SET production_from_year = year
      WHERE production_from_year IS NULL
    `);
    
    // Update body_style from body_type if it's null
    await client.query(`
      UPDATE cars
      SET body_style = body_type
      WHERE body_style IS NULL
    `);
    
    console.log('Schema update completed successfully');
  } catch (err) {
    console.error('Error updating schema:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the function if directly executed
if (require.main === module) {
  updateSchema().then(() => {
    console.log('Schema update script completed');
  }).catch(err => {
    console.error('Schema update failed:', err);
  });
}

export { updateSchema }; 