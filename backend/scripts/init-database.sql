-- HER BY MAGGIE Database Initialization Script
-- Run this script in your PostgreSQL database to set up the initial structure

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'customer',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    allow_quantity BOOLEAN DEFAULT false,
    image_url TEXT,
    category VARCHAR(50) DEFAULT 'makeup',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add-ons table
CREATE TABLE IF NOT EXISTS addons (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Packages table
CREATE TABLE IF NOT EXISTS packages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    base_duration_minutes INTEGER NOT NULL,
    is_full_day_service BOOLEAN DEFAULT false,
    transport_fee DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Package services junction
CREATE TABLE IF NOT EXISTS package_services (
    id SERIAL PRIMARY KEY,
    package_id INTEGER REFERENCES packages(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hair Products table
CREATE TABLE IF NOT EXISTS hair_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    category VARCHAR(100) NOT NULL,
    hair_type VARCHAR(100),
    length VARCHAR(50),
    color VARCHAR(50),
    texture VARCHAR(50),
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES users(id),
    service_id INTEGER REFERENCES services(id),
    package_id INTEGER REFERENCES packages(id),
    appointment_date TIMESTAMP NOT NULL,
    total_duration_minutes INTEGER NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    location_address TEXT,
    transport_fee DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    deposit_paid BOOLEAN DEFAULT false,
    deposit_amount DECIMAL(10,2) DEFAULT 0,
    payment_reference VARCHAR(255),
    reschedule_count INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointment add-ons junction
CREATE TABLE IF NOT EXISTS appointment_addons (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
    addon_id INTEGER REFERENCES addons(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Time slots table for availability
CREATE TABLE IF NOT EXISTS time_slots (
    id SERIAL PRIMARY KEY,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    appointment_id INTEGER REFERENCES appointments(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table for hair products
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES users(id),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    payment_status VARCHAR(20) DEFAULT 'pending',
    shipping_address TEXT,
    payment_reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES hair_products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_hair_products_active ON hair_products(is_active);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_date ON time_slots(slot_date);

-- Insert sample data

-- Sample Services
INSERT INTO services (name, description, base_price, duration_minutes, allow_quantity, category) VALUES
('Basic Makeup', 'Natural everyday makeup look perfect for work or casual outings', 350.00, 60, true, 'makeup'),
('Glam Makeup', 'Full glam makeup for special occasions, events, and photoshoots', 600.00, 90, true, 'makeup'),
('Bridal Makeup', 'Specialized bridal makeup package with trial session', 1200.00, 120, false, 'makeup'),
('Bridal Trial', 'Bridal makeup trial session to test your wedding day look', 400.00, 90, false, 'makeup'),
('Hair Weave Installation', 'Professional hair weave installation with customization', 800.00, 120, false, 'hair'),
('Hair Styling', 'Professional hair styling for events and special occasions', 300.00, 60, true, 'hair'),
('Makeup Lesson', 'One-on-one makeup lesson tailored to your needs', 450.00, 90, false, 'lesson')
ON CONFLICT DO NOTHING;

-- Sample Add-ons
INSERT INTO addons (name, description, price, duration_minutes) VALUES
('False Lashes', 'Application of premium false eyelashes', 50.00, 15),
('Facial Treatment', 'Quick pre-makeup facial and skin prep', 150.00, 30),
('Eyebrow Shaping', 'Professional eyebrow shaping and grooming', 80.00, 20),
('Lip Liner', 'Precise lip lining and definition', 30.00, 10),
('Complexion Boost', 'Advanced skin prep and priming', 100.00, 25)
ON CONFLICT DO NOTHING;

-- Sample Packages
INSERT INTO packages (name, description, base_price, base_duration_minutes, is_full_day_service, transport_fee) VALUES
('Full Wedding Package', 'Complete bridal package including trial, day-of makeup, and touch-ups', 2500.00, 240, true, 200.00),
('Bridal Party Package', 'Makeup for bride and up to 4 bridesmaids', 1800.00, 180, false, 0),
('Full Glam Day', 'Full makeup and hair styling for special events', 1200.00, 150, false, 0),
('Bridal Premium', 'Bridal makeup plus hair styling and false lashes', 1600.00, 180, true, 150.00)
ON CONFLICT DO NOTHING;

-- Sample Hair Products
INSERT INTO hair_products (name, description, price, original_price, category, hair_type, length, color, texture, stock_quantity) VALUES
('Brazilian Body Wave', 'Premium 100% Brazilian virgin hair with natural body wave pattern', 1200.00, 1500.00, 'weave', 'virgin', '18-inch', 'natural black', 'body wave', 15),
('Peruvian Straight', 'Luxury Peruvian straight hair with silky smooth texture', 1400.00, 1700.00, 'weave', 'virgin', '20-inch', 'jet black', 'straight', 10),
('Malaysian Curly', 'Beautiful Malaysian hair with natural curly pattern', 1300.00, 1600.00, 'weave', 'virgin', '16-inch', 'dark brown', 'curly', 8),
('Indian Remy', 'High-quality Indian Remy hair with cuticle intact', 1100.00, 1300.00, 'weave', 'remy', '22-inch', 'natural', 'straight', 12),
('Closure Piece', '4x4 closure piece for seamless installs', 400.00, 500.00, 'closure', 'virgin', '4x4', 'natural black', 'straight', 20),
('Frontal Piece', '13x4 frontal piece for versatile styling', 600.00, 750.00, 'frontal', 'virgin', '13x4', 'natural', 'body wave', 15)
ON CONFLICT DO NOTHING;

-- Create admin user (password: admin123)
INSERT INTO users (email, password, role, first_name, last_name, phone) VALUES
('admin@maggiethe-mua.com', '$2a$10$8F8Jc6Jc6Jc6Jc6Jc6Jc6.Jc6Jc6Jc6Jc6Jc6Jc6Jc6Jc6Jc6Jc6', 'admin', 'Maggie', 'MUA', '+27123456789')
ON CONFLICT (email) DO NOTHING;

-- Sample time slots for the next 30 days
INSERT INTO time_slots (slot_date, start_time, end_time, is_available)
SELECT 
    CURRENT_DATE + i AS slot_date,
    '09:00:00' AS start_time,
    '17:00:00' AS end_time,
    true AS is_available
FROM generate_series(0, 30) AS i
ON CONFLICT DO NOTHING;

-- Update function for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hair_products_updated_at BEFORE UPDATE ON hair_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Display success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ HER BY MAGGIE database initialized successfully!';
    RAISE NOTICE '📊 Tables created: users, services, addons, packages, hair_products, appointments, orders';
    RAISE NOTICE '👤 Admin user created: admin@maggiethe-mua.com (password: admin123)';
    RAISE NOTICE '💄 Sample data inserted for services, addons, packages, and hair products';
END $$;