CREATE TABLE cars (
    id SERIAL PRIMARY KEY,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    body_type VARCHAR(100) NOT NULL,
    engine VARCHAR(100),
    country VARCHAR(100) NOT NULL,
    image_url TEXT
);

CREATE TABLE daily_cars (
    id SERIAL PRIMARY KEY,
    car_id INTEGER REFERENCES cars(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE(date)
);

-- Create index for faster daily car lookups
CREATE INDEX idx_daily_cars_date ON daily_cars(date); 