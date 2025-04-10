import { Pool } from 'pg';
import { parse } from 'csv-parse';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function updateCars() {
  const client = await pool.connect();
  try {
    console.log('Starting update of car data...');
    
    // Read the CSV file
    const csvFilePath = path.join(__dirname, '..', 'data', 'cars.csv');
    
    if (!fs.existsSync(csvFilePath)) {
      console.error(`CSV file not found at ${csvFilePath}`);
      return;
    }
    
    console.log(`Reading CSV from: ${csvFilePath}`);
    const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });

    // Parse the CSV
    const records: any[] = [];
    const parser = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    for await (const record of parser) {
      records.push(record);
    }

    console.log(`Found ${records.length} records in CSV file`);

    // Get all existing cars to match against
    const existingCarsResult = await client.query(
      'SELECT id, make, model, year FROM cars'
    );
    
    const existingCars = existingCarsResult.rows;
    console.log(`Found ${existingCars.length} existing cars in database`);

    let updatedCount = 0;
    let matchedCount = 0;

    // For each car in the database, find matching record in CSV and update
    for (const car of existingCars) {
      // Find matching car in CSV by make, model, and year
      const matchingRecords = records.filter(record => {
        const makeMatch = record.brand && car.make && 
          record.brand.trim().toLowerCase() === car.make.trim().toLowerCase();
        
        const modelMatch = record.model && car.model && 
          record.model.trim().toLowerCase() === car.model.trim().toLowerCase();
        
        let yearMatch = false;
        if (record.from_year && car.year) {
          const fromYear = parseInt(record.from_year);
          yearMatch = fromYear === car.year;
        }
        
        return makeMatch && modelMatch && yearMatch;
      });

      if (matchingRecords.length > 0) {
        matchedCount++;
        const record = matchingRecords[0]; // Use the first match if multiple

        // Convert cylinders to integer if possible
        let cylinders = null;
        if (record.cylinders) {
          const cylinderNum = parseInt(record.cylinders);
          if (!isNaN(cylinderNum)) {
            cylinders = cylinderNum;
          }
        }

        // Convert displacement to integer if possible
        let displacement = null;
        if (record.displacement) {
          const displacementNum = parseInt(record.displacement);
          if (!isNaN(displacementNum)) {
            displacement = displacementNum;
          }
        }

        // Convert power to integer if possible
        let power = null;
        if (record.power) {
          const powerNum = parseInt(record.power);
          if (!isNaN(powerNum)) {
            power = powerNum;
          }
        }

        // Convert torque to integer if possible
        let torque = null;
        if (record.torque) {
          const torqueNum = parseInt(record.torque);
          if (!isNaN(torqueNum)) {
            torque = torqueNum;
          }
        }

        // Convert fuel_capacity to numeric if possible
        let fuelCapacity = null;
        if (record.fuel_capacity) {
          const fuelCapacityNum = parseFloat(record.fuel_capacity);
          if (!isNaN(fuelCapacityNum)) {
            fuelCapacity = fuelCapacityNum;
          }
        }

        // Convert top_speed to integer if possible
        let topSpeed = null;
        if (record.top_speed) {
          const topSpeedNum = parseInt(record.top_speed);
          if (!isNaN(topSpeedNum)) {
            topSpeed = topSpeedNum;
          }
        }

        // Convert to_year to integer if possible
        let toYear = null;
        if (record.to_year) {
          const toYearNum = parseInt(record.to_year);
          if (!isNaN(toYearNum)) {
            toYear = toYearNum;
          }
        }

        // Update the car record
        try {
          const updateResult = await client.query(
            `UPDATE cars 
             SET segment = $1, 
                 cylinders = $2, 
                 displacement = $3, 
                 drive_type = $4, 
                 body_style = $5, 
                 to_year = $6, 
                 title = $7, 
                 description = $8, 
                 engine_speed = $9, 
                 power = $10, 
                 torque = $11, 
                 fuel_system = $12, 
                 fuel = $13, 
                 fuel_capacity = $14, 
                 top_speed = $15
             WHERE id = $16
             RETURNING id`,
            [
              record.segment || null,
              cylinders,
              displacement,
              record.drive_type || null,
              record.body_style || null,
              toYear,
              record.title || null,
              record.description || null,
              record.engine_speed || null,
              power,
              torque,
              record.fuel_system || null,
              record.fuel || null,
              fuelCapacity,
              topSpeed,
              car.id
            ]
          );

          if (updateResult && updateResult.rowCount && updateResult.rowCount > 0) {
            updatedCount++;
          }
        } catch (err) {
          console.error(`Error updating car id=${car.id}:`, err);
        }
      }
    }

    console.log(`Successfully matched ${matchedCount} cars from CSV`);
    console.log(`Successfully updated ${updatedCount} cars in database`);
    
  } catch (err) {
    console.error('Error during update:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if directly executed
if (require.main === module) {
  updateCars().then(() => {
    console.log('Car update completed successfully');
  }).catch(err => {
    console.error('Error in car update:', err);
    process.exit(1);
  });
}

export { updateCars }; 