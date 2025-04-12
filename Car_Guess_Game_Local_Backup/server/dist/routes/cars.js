"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const router = (0, express_1.Router)();
const pool = new pg_1.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});
// Search for models based on partial input
router.get('/search-models', async (req, res) => {
    const { query } = req.query;
    try {
        const searchQuery = `
      SELECT DISTINCT model, brand, from_year
      FROM cars
      WHERE lower(model) LIKE lower($1)
      ORDER BY model
      LIMIT 10;
    `;
        const result = await pool.query(searchQuery, [`%${query}%`]);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Error searching models:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get car details for comparison
router.get('/car-details/:model', async (req, res) => {
    const { model } = req.params;
    try {
        const detailsQuery = `
      SELECT brand, model, from_year, segment, cylinders, drive_type
      FROM cars
      WHERE model = $1
      LIMIT 1;
    `;
        const result = await pool.query(detailsQuery, [model]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Car not found' });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Error fetching car details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get daily car
router.get('/daily-car', async (req, res) => {
    try {
        const dailyCarQuery = `
      SELECT id
      FROM cars
      ORDER BY RANDOM()
      LIMIT 1;
    `;
        const result = await pool.query(dailyCarQuery);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'No cars available' });
            return;
        }
        // Store the daily car ID in the session
        req.session.dailyCarId = result.rows[0].id;
        res.json({ message: 'New daily car selected' });
    }
    catch (error) {
        console.error('Error selecting daily car:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Compare guess with daily car
router.post('/compare-guess', async (req, res) => {
    var _a;
    const { model } = req.body;
    if (!((_a = req.session) === null || _a === void 0 ? void 0 : _a.dailyCarId)) {
        res.status(400).json({ error: 'No daily car selected' });
        return;
    }
    try {
        // Get both cars' details
        const compareQuery = `
      WITH guess_car AS (
        SELECT brand, model, from_year, segment, cylinders, drive_type
        FROM cars
        WHERE model = $1
      ),
      daily_car AS (
        SELECT brand, model, from_year, segment, cylinders, drive_type
        FROM cars
        WHERE id = $2
      )
      SELECT 
        g.*,
        (g.brand = d.brand) as brand_match,
        (g.from_year = d.from_year) as year_match,
        (g.segment = d.segment) as segment_match,
        (g.cylinders = d.cylinders) as cylinders_match,
        (g.drive_type = d.drive_type) as drive_type_match,
        (g.model = d.model) as is_correct_car
      FROM guess_car g
      CROSS JOIN daily_car d;
    `;
        const result = await pool.query(compareQuery, [model, req.session.dailyCarId]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Car not found' });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Error comparing guess:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
