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
exports.checkCars = checkCars;
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const pool = new pg_1.Pool({
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
        }
        else {
            console.log('\nNo car selected for today');
        }
    }
    catch (err) {
        console.error('Error checking cars:', err);
    }
    finally {
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
