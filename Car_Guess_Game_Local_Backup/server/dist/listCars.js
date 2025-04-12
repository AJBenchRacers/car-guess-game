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
async function listCars() {
    const client = await pool.connect();
    try {
        const result = await client.query(`
      SELECT make, model, year, body_type, engine, country 
      FROM cars 
      ORDER BY make, model 
      LIMIT 100
    `);
        console.log('\nCars in database:');
        console.log('=====================================');
        if (result.rows.length === 0) {
            console.log('No cars found in the database.');
        }
        else {
            result.rows.forEach((car, index) => {
                console.log(`${index + 1}. ${car.make} ${car.model} (${car.year}) - ${car.body_type}, ${car.country}`);
            });
            console.log('\nTotal cars listed:', result.rows.length);
            // Get total count
            const countResult = await client.query('SELECT COUNT(*) FROM cars');
            console.log('Total cars in database:', countResult.rows[0].count);
        }
    }
    catch (err) {
        console.error('Error listing cars:', err);
    }
    finally {
        client.release();
        await pool.end();
    }
}
listCars();
