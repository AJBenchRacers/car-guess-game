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
async function insertTestCar() {
    const client = await pool.connect();
    try {
        // Make sure tables exist
        await client.query(`
      CREATE TABLE IF NOT EXISTS cars (
        id SERIAL PRIMARY KEY,
        make VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        year INTEGER NOT NULL,
        body_type VARCHAR(100) NOT NULL,
        engine VARCHAR(100),
        country VARCHAR(100) NOT NULL,
        image_url TEXT
      );
      
      CREATE TABLE IF NOT EXISTS daily_cars (
        id SERIAL PRIMARY KEY,
        car_id INTEGER REFERENCES cars(id),
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        UNIQUE(date)
      );
      
      CREATE INDEX IF NOT EXISTS idx_daily_cars_date ON daily_cars(date);
    `);
        // Insert a test car
        const carResult = await client.query(`
      INSERT INTO cars (make, model, year, body_type, engine, country)
      VALUES ('Toyota', 'Supra', 1998, 'Coupe', '2JZ-GTE', 'Japan')
      RETURNING id;
    `);
        const carId = carResult.rows[0].id;
        // Clear existing daily car for today
        await client.query(`
      DELETE FROM daily_cars WHERE date = CURRENT_DATE;
    `);
        // Set as today's car
        await client.query(`
      INSERT INTO daily_cars (car_id, date)
      VALUES ($1, CURRENT_DATE);
    `, [carId]);
        console.log('Test car inserted and set as today\'s car successfully!');
    }
    catch (err) {
        console.error('Error inserting test car:', err);
    }
    finally {
        client.release();
        await pool.end();
    }
}
insertTestCar();
