"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.importCSV = importCSV;
const pg_1 = require("pg");
const csv_parse_1 = require("csv-parse");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const pool = new pg_1.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});
async function importCSV() {
    const client = await pool.connect();
    try {
        const csvFilePath = path.join(__dirname, '..', '..', 'data', 'cars.csv');
        if (!fs.existsSync(csvFilePath)) {
            console.error(`CSV file not found at ${csvFilePath}`);
            return;
        }
        console.log(`Importing CSV from: ${csvFilePath}`);
        const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
        const records = [];
        const parser = (0, csv_parse_1.parse)(fileContent, {
            columns: true,
            skip_empty_lines: true
        });
        for await (const record of parser) {
            // Extract the first year from production_years if available
            let year = 0;
            let fromYear = 0;
            if (record.from_year) {
                fromYear = parseInt(record.from_year);
                year = fromYear; // Set year to from_year for compatibility
            }
            else if (record.production_years) {
                const years = record.production_years.split(',');
                if (years.length > 0) {
                    fromYear = parseInt(years[0].trim());
                    year = fromYear;
                }
            }
            // Extract body type from body_style or segment
            let bodyType = '';
            let bodyStyle = record.body_style || '';
            if (record.body_style) {
                // Get the first part before any parentheses
                const bodyStyleParts = record.body_style.split('(');
                bodyType = bodyStyleParts[0].trim();
            }
            else if (record.segment) {
                bodyType = record.segment;
                bodyStyle = record.segment;
            }
            // Extract country - assuming it's not in your CSV
            // You might need to add a mapping for brands to countries
            const country = getBrandCountry(record.brand);
            // Convert cylinders to integer if possible
            let cylinders = null;
            if (record.cylinders) {
                // Remove any non-numeric characters and parse
                const cylinderStr = record.cylinders.toString().replace(/[^0-9]/g, '');
                const cylinderNum = parseInt(cylinderStr);
                if (!isNaN(cylinderNum) && cylinderNum > 0) {
                    cylinders = cylinderNum;
                    console.log(`Parsed cylinders for ${record.brand} ${record.model}: ${cylinders}`);
                }
                else {
                    console.log(`Failed to parse cylinders for ${record.brand} ${record.model}. Raw value: ${record.cylinders}`);
                }
            }
            else {
                console.log(`No cylinders data for ${record.brand} ${record.model}`);
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
            records.push({
                make: record.brand || '',
                model: record.model || '',
                year: year || 0,
                body_type: bodyType || 'Unknown',
                engine: record.engine || '',
                country: country,
                image_url: record.image_urls ? record.image_urls.split(',')[0].trim() : null,
                brand: record.brand || '',
                production_from_year: fromYear || 0,
                segment: record.segment || '',
                cylinders: cylinders,
                displacement: displacement,
                drive_type: record.drive_type || '',
                body_style: bodyStyle,
                to_year: toYear,
                title: record.title || '',
                description: record.description || '',
                engine_speed: record.engine_speed || '',
                power: power,
                torque: torque,
                fuel_system: record.fuel_system || '',
                fuel: record.fuel || '',
                fuel_capacity: fuelCapacity,
                top_speed: topSpeed
            });
        }
        console.log(`Found ${records.length} records in CSV file`);
        // Check if we need to clear the existing data
        const shouldClearData = process.env.CLEAR_DATA === 'true';
        if (shouldClearData) {
            console.log('Clearing existing car data...');
            await client.query('DELETE FROM daily_cars');
            await client.query('DELETE FROM cars');
        }
        let importedCount = 0;
        for (const record of records) {
            if (!record.make || !record.model || !record.year || !record.body_type || !record.country) {
                continue;
            }
            try {
                const result = await client.query(`INSERT INTO cars (
             make, model, year, body_type, engine, country, image_url,
             brand, production_from_year, segment, cylinders, displacement,
             drive_type, body_style, to_year, title, description,
             engine_speed, power, torque, fuel_system, fuel,
             fuel_capacity, top_speed
           )
           VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
             $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
           )
           ON CONFLICT DO NOTHING
           RETURNING id`, [
                    record.make, record.model, record.year, record.body_type,
                    record.engine, record.country, record.image_url,
                    record.brand, record.production_from_year, record.segment,
                    record.cylinders, record.displacement, record.drive_type,
                    record.body_style, record.to_year, record.title, record.description,
                    record.engine_speed, record.power, record.torque,
                    record.fuel_system, record.fuel, record.fuel_capacity, record.top_speed
                ]);
                if (result && result.rowCount && result.rowCount > 0) {
                    importedCount++;
                }
            }
            catch (err) {
                console.error('Error importing record:', err);
            }
        }
        console.log(`Successfully imported ${importedCount} new cars`);
        // Set a random car for today if none exists
        const todayCarResult = await client.query('SELECT * FROM daily_cars WHERE date = CURRENT_DATE');
        if (todayCarResult.rows.length === 0) {
            console.log('Setting a random car for today...');
            const randomCar = await client.query('SELECT id FROM cars ORDER BY RANDOM() LIMIT 1');
            if (randomCar.rows.length > 0) {
                await client.query('INSERT INTO daily_cars (car_id, date) VALUES ($1, CURRENT_DATE)', [randomCar.rows[0].id]);
                console.log('Today\'s car has been set');
            }
        }
        console.log('Import completed successfully');
    }
    catch (err) {
        console.error('Error during import:', err);
        throw err;
    }
    finally {
        client.release();
    }
}
// Helper function to map brand to country
function getBrandCountry(brand) {
    const brandCountryMap = {
        'AC': 'UK',
        'Acura': 'Japan',
        'Alfa Romeo': 'Italy',
        'Aston Martin': 'UK',
        'Audi': 'Germany',
        'BMW': 'Germany',
        'Bentley': 'UK',
        'Bugatti': 'France',
        'Buick': 'USA',
        'Cadillac': 'USA',
        'Chevrolet': 'USA',
        'Chrysler': 'USA',
        'Citroen': 'France',
        'Dodge': 'USA',
        'Ferrari': 'Italy',
        'Fiat': 'Italy',
        'Ford': 'USA',
        'GMC': 'USA',
        'Honda': 'Japan',
        'Hyundai': 'South Korea',
        'Infiniti': 'Japan',
        'Jaguar': 'UK',
        'Jeep': 'USA',
        'Kia': 'South Korea',
        'Lamborghini': 'Italy',
        'Land Rover': 'UK',
        'Lexus': 'Japan',
        'Lincoln': 'USA',
        'Lotus': 'UK',
        'Maserati': 'Italy',
        'Mazda': 'Japan',
        'Mercedes-Benz': 'Germany',
        'Mercury': 'USA',
        'Mini': 'UK',
        'Mitsubishi': 'Japan',
        'Nissan': 'Japan',
        'Oldsmobile': 'USA',
        'Peugeot': 'France',
        'Pontiac': 'USA',
        'Porsche': 'Germany',
        'Ram': 'USA',
        'Renault': 'France',
        'Rolls-Royce': 'UK',
        'Saab': 'Sweden',
        'Saturn': 'USA',
        'Scion': 'Japan',
        'Subaru': 'Japan',
        'Suzuki': 'Japan',
        'Tesla': 'USA',
        'Toyota': 'Japan',
        'Volkswagen': 'Germany',
        'Volvo': 'Sweden'
    };
    return brandCountryMap[brand] || 'Unknown';
}
async function main() {
    try {
        await importCSV();
        console.log('All done!');
    }
    catch (err) {
        console.error('Error in main:', err);
    }
    finally {
        await pool.end();
    }
}
if (require.main === module) {
    main();
}
