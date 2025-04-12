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
exports.updateSchema = updateSchema;
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
            { name: 'brand', type: 'TEXT' },
            { name: 'production_from_year', type: 'INTEGER' },
            { name: 'segment', type: 'TEXT' },
            { name: 'cylinders', type: 'INTEGER' },
            { name: 'displacement', type: 'INTEGER' },
            { name: 'drive_type', type: 'TEXT' },
            { name: 'body_style', type: 'TEXT' },
            { name: 'to_year', type: 'INTEGER' },
            { name: 'title', type: 'TEXT' },
            { name: 'description', type: 'TEXT' },
            { name: 'engine_speed', type: 'TEXT' },
            { name: 'power', type: 'INTEGER' },
            { name: 'torque', type: 'INTEGER' },
            { name: 'fuel_system', type: 'TEXT' },
            { name: 'fuel', type: 'TEXT' },
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
            }
            else {
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
    }
    catch (err) {
        console.error('Error updating schema:', err);
    }
    finally {
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
