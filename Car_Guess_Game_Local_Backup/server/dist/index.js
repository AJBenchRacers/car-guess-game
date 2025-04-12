"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const pg_1 = require("pg");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Database connection
const pool = new pg_1.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Function to get today's car or select a new one
async function getTodaysCar() {
    try {
        // Check for a daily car in the daily_cars table
        const todayCarResult = await pool.query('SELECT car_id FROM daily_cars WHERE date = CURRENT_DATE');
        let carId;
        if (todayCarResult.rows.length > 0) {
            // Use the existing daily car
            carId = todayCarResult.rows[0].car_id;
        }
        else {
            // Select a random car and set it as today's car
            const randomCarResult = await pool.query('SELECT id FROM cars ORDER BY RANDOM() LIMIT 1');
            if (randomCarResult.rows.length === 0) {
                throw new Error('No cars available in the database');
            }
            carId = randomCarResult.rows[0].id;
            // Save this car as today's car
            await pool.query('INSERT INTO daily_cars (car_id, date) VALUES ($1, CURRENT_DATE)', [carId]);
        }
        // Get the car's details
        const carDetailsResult = await pool.query(`SELECT * FROM cars WHERE id = $1`, [carId]);
        if (carDetailsResult.rows.length === 0) {
            throw new Error('Car not found');
        }
        return carDetailsResult.rows[0];
    }
    catch (error) {
        console.error('Error getting today\'s car:', error);
        throw error;
    }
}
// Search for car models based on user input
app.get('/api/search/models', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || typeof query !== 'string' || query.length < 1) {
            return res.json([]);
        }
        // Simple search query that returns both brand and model
        const result = await pool.query(`SELECT DISTINCT brand, model 
       FROM cars 
       WHERE LOWER(model) LIKE LOWER($1) 
          OR LOWER(brand) LIKE LOWER($1)
       ORDER BY brand, model`, [`%${query}%`]);
        // Format results to include brand and model
        const formattedResults = result.rows.map(row => ({
            display: `${row.brand} ${row.model}`,
            model: row.model
        }));
        res.json(formattedResults);
    }
    catch (error) {
        console.error('Error searching for models:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get game state endpoint to check if game is started
app.get('/api/game-state', async (req, res) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const result = await pool.query('SELECT * FROM daily_cars WHERE date = $1', [todayStart]);
        res.json({
            hasGame: result.rows.length > 0
        });
    }
    catch (error) {
        console.error('Error getting game state:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Handle car model guesses
app.post('/api/guess', async (req, res) => {
    try {
        const { model } = req.body;
        const correctCar = await getTodaysCar();
        // Get the guessed car's details
        const guessResult = await pool.query('SELECT * FROM cars WHERE LOWER(model) = LOWER($1) LIMIT 1', [model]);
        const guessedCar = guessResult.rows[0];
        if (!guessedCar) {
            return res.json({
                isCorrect: false,
                message: 'Car not found in our database. Try another model.',
                similarities: null
            });
        }
        // Enhanced debug logging
        console.log('Full guessed car data:', JSON.stringify(guessedCar, null, 2));
        console.log('Full correct car data:', JSON.stringify(correctCar, null, 2));
        // Check if the guess is correct - must match both model and year exactly
        const isCorrect = guessedCar.id === correctCar.id ||
            (guessedCar.model.toLowerCase() === correctCar.model.toLowerCase() &&
                guessedCar.production_from_year === correctCar.production_from_year);
        // Helper function to compare numeric values and add direction indicators
        const compareNumeric = (guessedValue, correctValue) => {
            return {
                value: guessedValue,
                isMatch: guessedValue === correctValue,
                direction: guessedValue < correctValue ? 'higher' : guessedValue > correctValue ? 'lower' : null
            };
        };
        // Calculate similarities with expanded features
        const similarities = {
            brand: {
                value: guessedCar.brand || guessedCar.make,
                isMatch: (guessedCar.brand || guessedCar.make) === (correctCar.brand || correctCar.make)
            },
            production_from_year: {
                value: guessedCar.production_from_year || guessedCar.year,
                isMatch: (guessedCar.production_from_year || guessedCar.year) === (correctCar.production_from_year || correctCar.year),
                isClose: Math.abs((guessedCar.production_from_year || guessedCar.year) - (correctCar.production_from_year || correctCar.year)) <= 5,
                direction: (guessedCar.production_from_year || guessedCar.year) < (correctCar.production_from_year || correctCar.year) ? 'higher' : (guessedCar.production_from_year || guessedCar.year) > (correctCar.production_from_year || correctCar.year) ? 'lower' : null
            },
            body_style: {
                value: guessedCar.body_style || guessedCar.body_type,
                isMatch: (guessedCar.body_style || guessedCar.body_type) === (correctCar.body_style || correctCar.body_type)
            },
            segment: {
                value: guessedCar.segment || 'Unknown',
                isMatch: guessedCar.segment === correctCar.segment
            },
            cylinders: {
                value: guessedCar.cylinders !== null ? guessedCar.cylinders : 'Unknown',
                isMatch: guessedCar.cylinders === correctCar.cylinders,
                isClose: guessedCar.cylinders && correctCar.cylinders && Math.abs(guessedCar.cylinders - correctCar.cylinders) <= 2,
                direction: guessedCar.cylinders && correctCar.cylinders ?
                    (guessedCar.cylinders < correctCar.cylinders ? 'higher' :
                        guessedCar.cylinders > correctCar.cylinders ? 'lower' : null) : null
            },
            displacement: {
                value: guessedCar.displacement || 'Unknown',
                isMatch: guessedCar.displacement === correctCar.displacement,
                isClose: guessedCar.displacement && correctCar.displacement && Math.abs(guessedCar.displacement - correctCar.displacement) <= 500,
                direction: guessedCar.displacement && correctCar.displacement ? (guessedCar.displacement < correctCar.displacement ? 'higher' : guessedCar.displacement > correctCar.displacement ? 'lower' : null) : null
            },
            power: {
                value: guessedCar.power || 'Unknown',
                isMatch: guessedCar.power === correctCar.power,
                isClose: guessedCar.power && correctCar.power && Math.abs(guessedCar.power - correctCar.power) <= 50,
                direction: guessedCar.power && correctCar.power ? (guessedCar.power < correctCar.power ? 'higher' : guessedCar.power > correctCar.power ? 'lower' : null) : null
            },
            torque: {
                value: guessedCar.torque || 'Unknown',
                isMatch: guessedCar.torque === correctCar.torque,
                isClose: guessedCar.torque && correctCar.torque && Math.abs(guessedCar.torque - correctCar.torque) <= 50,
                direction: guessedCar.torque && correctCar.torque ? (guessedCar.torque < correctCar.torque ? 'higher' : guessedCar.torque > correctCar.torque ? 'lower' : null) : null
            },
            fuel_system: {
                value: guessedCar.fuel_system || 'Unknown',
                isMatch: guessedCar.fuel_system === correctCar.fuel_system
            },
            fuel: {
                value: guessedCar.fuel || 'Unknown',
                isMatch: guessedCar.fuel === correctCar.fuel
            },
            fuel_capacity: {
                value: guessedCar.fuel_capacity || 'Unknown',
                isMatch: guessedCar.fuel_capacity === correctCar.fuel_capacity,
                isClose: guessedCar.fuel_capacity && correctCar.fuel_capacity && Math.abs(guessedCar.fuel_capacity - correctCar.fuel_capacity) <= 10,
                direction: guessedCar.fuel_capacity && correctCar.fuel_capacity ? (guessedCar.fuel_capacity < correctCar.fuel_capacity ? 'higher' : guessedCar.fuel_capacity > correctCar.fuel_capacity ? 'lower' : null) : null
            },
            top_speed: {
                value: guessedCar.top_speed || 'Unknown',
                isMatch: guessedCar.top_speed === correctCar.top_speed,
                isClose: guessedCar.top_speed && correctCar.top_speed && Math.abs(guessedCar.top_speed - correctCar.top_speed) <= 20,
                direction: guessedCar.top_speed && correctCar.top_speed ? (guessedCar.top_speed < correctCar.top_speed ? 'higher' : guessedCar.top_speed > correctCar.top_speed ? 'lower' : null) : null
            },
            drive_type: {
                value: guessedCar.drive_type || 'Unknown',
                isMatch: guessedCar.drive_type === correctCar.drive_type
            }
        };
        // If the guess is correct, include the car details
        let carDetails = null;
        if (isCorrect) {
            carDetails = {
                brand: correctCar.brand || correctCar.make,
                model: correctCar.model,
                production_from_year: correctCar.production_from_year || correctCar.year,
                to_year: correctCar.to_year,
                body_style: correctCar.body_style || correctCar.body_type,
                segment: correctCar.segment,
                title: correctCar.title,
                description: correctCar.description,
                engine_speed: correctCar.engine_speed,
                cylinders: correctCar.cylinders,
                displacement: correctCar.displacement,
                power: correctCar.power,
                torque: correctCar.torque,
                fuel_system: correctCar.fuel_system,
                fuel: correctCar.fuel,
                fuel_capacity: correctCar.fuel_capacity,
                top_speed: correctCar.top_speed,
                drive_type: correctCar.drive_type,
                image_url: correctCar.image_url
            };
        }
        res.json({
            isCorrect,
            message: isCorrect ? 'Congratulations! You guessed the correct car!' : 'Not the correct car. Try again!',
            similarities,
            carDetails
        });
    }
    catch (error) {
        console.error('Error processing guess:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/api/cars/count', async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) FROM cars');
        res.json({ count: parseInt(result.rows[0].count) });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
