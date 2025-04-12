DROP TABLE IF EXISTS daily_cars;
DROP TABLE IF EXISTS cars;

CREATE TABLE cars (
    id SERIAL PRIMARY KEY,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    body_type TEXT NOT NULL,
    engine TEXT,
    country TEXT NOT NULL,
    image_url TEXT,
    brand TEXT,
    production_from_year INTEGER,
    segment TEXT,
    cylinders INTEGER,
    displacement INTEGER,
    drive_type TEXT,
    body_style TEXT,
    to_year INTEGER,
    title TEXT,
    description TEXT,
    engine_speed TEXT,
    power INTEGER,
    torque INTEGER,
    fuel_system TEXT,
    fuel TEXT,
    fuel_capacity NUMERIC(10,2),
    top_speed INTEGER
);

CREATE TABLE daily_cars (
    id SERIAL PRIMARY KEY,
    car_id INTEGER REFERENCES cars(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE(date)
);

-- Create index for faster daily car lookups
CREATE INDEX idx_daily_cars_date ON daily_cars(date); 