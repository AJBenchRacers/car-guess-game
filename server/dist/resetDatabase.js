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
exports.resetDatabase = resetDatabase;
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
dotenv.config();
const pool = new pg_1.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'postgres', // Connect to default database
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});
async function resetDatabase() {
    const client = await pool.connect();
    try {
        console.log('Starting database reset...');
        // Drop the database if it exists
        await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'car_guess_game'
      AND pid <> pg_backend_pid();
    `);
        await client.query('DROP DATABASE IF EXISTS car_guess_game');
        console.log('Dropped existing database');
        // Create a new database
        await client.query('CREATE DATABASE car_guess_game');
        console.log('Created new database');
        // Connect to the new database
        await client.release();
        const newPool = new pg_1.Pool({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: 'car_guess_game',
            password: process.env.DB_PASSWORD,
            port: parseInt(process.env.DB_PORT || '5432'),
        });
        const newClient = await newPool.connect();
        // Read and execute the init.sql file
        const initSqlPath = path.join(__dirname, 'db', 'init.sql');
        const initSql = fs.readFileSync(initSqlPath, 'utf8');
        await newClient.query(initSql);
        console.log('Created tables with correct schema');
        // Import the data
        const { importCSV } = await Promise.resolve().then(() => __importStar(require('./db/importCars')));
        await importCSV();
        console.log('Database reset completed successfully');
    }
    catch (err) {
        console.error('Error resetting database:', err);
    }
}
// Run the function if directly executed
if (require.main === module) {
    resetDatabase().then(() => {
        console.log('Database reset script completed');
    }).catch(err => {
        console.error('Database reset failed:', err);
    });
}
