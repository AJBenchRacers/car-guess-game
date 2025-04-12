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
    }
    catch (err) {
        console.error('Error checking columns:', err);
    }
    finally {
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
