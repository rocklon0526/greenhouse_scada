-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Insert default roles
INSERT INTO roles (name) VALUES ('admin'), ('operator'), ('viewer')
ON CONFLICT (name) DO NOTHING;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES roles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (password: admin123)
-- Note: In production, use a script to generate the hash. 
-- Here we use a placeholder hash for 'admin123' generated via bcrypt.
-- $2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW
INSERT INTO users (username, hashed_password, role_id) 
SELECT 'admin', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', id 
FROM roles WHERE name = 'admin'
ON CONFLICT (username) DO NOTHING;

-- Create sensor_data table (TimescaleDB hypertable candidate, but standard PG for now)
CREATE TABLE IF NOT EXISTS sensor_data (
    time TIMESTAMP WITH TIME ZONE NOT NULL,
    tag_name VARCHAR(100) NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    PRIMARY KEY (time, tag_name)
);

-- Create alarm_history table
CREATE TABLE IF NOT EXISTS alarm_history (
    id SERIAL PRIMARY KEY,
    tag_name VARCHAR(100) NOT NULL,
    alarm_type VARCHAR(50) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    start_value DOUBLE PRECISION NOT NULL,
    end_value DOUBLE PRECISION,
    message TEXT
);

CREATE INDEX IF NOT EXISTS idx_sensor_data_time ON sensor_data (time DESC);
CREATE INDEX IF NOT EXISTS idx_alarm_history_start_time ON alarm_history (start_time DESC);
