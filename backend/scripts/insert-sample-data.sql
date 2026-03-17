-- HER BY MAGGIE Sample Data Insertion
-- Use this to add more sample data without resetting the entire database

-- Insert additional services
INSERT INTO services (name, description, base_price, duration_minutes, allow_quantity, category) VALUES
('Executive Makeup', 'Professional makeup for corporate events and business meetings', 400.00, 60, true, 'makeup'),
('Editorial Makeup', 'Creative makeup for photoshoots and editorial work', 700.00, 120, false, 'makeup'),
('Special FX Makeup', 'Special effects makeup for theater and events', 900.00, 180, false, 'makeup')
ON CONFLICT DO NOTHING;

-- Insert additional hair products
INSERT INTO hair_products (name, description, price, original_price, category, hair_type, length, color, texture, stock_quantity) VALUES
('Cambodian Straight', 'Super straight Cambodian hair with natural shine', 1250.00, 1550.00, 'weave', 'virgin', '24-inch', '#1B', 'straight', 5),
('Mongolian Wavy', 'Luxurious Mongolian hair with beachy waves', 1350.00, 1650.00, 'weave', 'virgin', '18-inch', '#2', 'wavy', 7),
('Silky Straight Bundle', '3 bundles of silky straight hair for full install', 3200.00, 4000.00, 'bundle', 'virgin', '20-22-24', '#1B', 'straight', 8),
('Kinky Curly Bundle', '3 bundles of kinky curly hair for natural look', 3000.00, 3800.00, 'bundle', 'virgin', '16-18-20', '#4', 'kinky', 6)
ON CONFLICT DO NOTHING;

-- Insert additional packages
INSERT INTO packages (name, description, base_price, base_duration_minutes, is_full_day_service, transport_fee) VALUES
('Mother of the Bride', 'Special package for mother of the bride including makeup and hair', 900.00, 120, false, 0),
('Prom Package', 'Makeup and hair styling for prom night', 650.00, 90, false, 0),
('Photoshoot Package', 'Complete makeup and hair for professional photoshoots', 1500.00, 180, false, 100.00)
ON CONFLICT DO NOTHING;

-- Display completion message
DO $$ 
BEGIN
    RAISE NOTICE '✅ Additional sample data inserted successfully!';
    RAISE NOTICE '💄 Added 3 new services';
    RAISE NOTICE '👑 Added 4 new hair products';
    RAISE NOTICE '📦 Added 3 new packages';
END $$;