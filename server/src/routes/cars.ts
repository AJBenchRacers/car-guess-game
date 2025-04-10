import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import session from 'express-session';

dotenv.config();

// Extend Express Request type to include session
interface GameRequest extends Request {
  session: session.Session & {
    dailyCarId?: number;
  }
}

const router = Router();
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Search for models based on partial input
router.get('/search-models', async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error('Error searching models:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get car details for comparison
router.get('/car-details/:model', async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error('Error fetching car details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get daily car
router.get('/daily-car', async (req: GameRequest, res: Response) => {
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
  } catch (error) {
    console.error('Error selecting daily car:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Compare guess with daily car
router.post('/compare-guess', async (req: GameRequest, res: Response) => {
  const { model } = req.body;
  
  if (!req.session?.dailyCarId) {
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
  } catch (error) {
    console.error('Error comparing guess:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 