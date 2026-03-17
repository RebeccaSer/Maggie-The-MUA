-- HER BY MAGGIE Database Reset Script
-- WARNING: This will delete all data and recreate the database structure

-- Drop all tables (in correct order to handle foreign keys)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS appointment_addons CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS time_slots CASCADE;
DROP TABLE IF EXISTS package_services CASCADE;
DROP TABLE IF EXISTS hair_products CASCADE;
DROP TABLE IF EXISTS addons CASCADE;
DROP TABLE IF EXISTS packages CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop triggers and functions
DROP TRIGGER IF EXISTS update_users_updated_at ON users CASCADE;
DROP TRIGGER IF EXISTS update_services_updated_at ON services CASCADE;
DROP TRIGGER IF EXISTS update_hair_products_updated_at ON hair_products CASCADE;
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments CASCADE;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Display reset message
DO $$ 
BEGIN
    RAISE NOTICE '🔄 Database reset completed. Run init-database.sql to recreate structure.';
END $$;