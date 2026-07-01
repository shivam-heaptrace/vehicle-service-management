-- 0001_seed_demo_data.sql
-- Seed data for Vehicle Service Management System
-- Uses ON CONFLICT DO NOTHING so safe to re-run

-- Customers
INSERT INTO customers (first_name, last_name, email, phone, address) VALUES
  ('Aisha', 'Patel', 'aisha.patel@example.com', '555-0101', '12 Maple St, Springfield'),
  ('Marcus', 'Johnson', 'marcus.j@example.com', '555-0102', '45 Oak Ave, Shelbyville'),
  ('Sara', 'Chen', 'sara.chen@example.com', '555-0103', '78 Pine Rd, Capital City'),
  ('Tom', 'Williams', 'tom.w@example.com', '555-0104', '23 Elm Blvd, Ogdenville'),
  ('Priya', 'Sharma', 'priya.sharma@example.com', '555-0105', '99 Birch Lane, Brockway'),
  ('James', 'Nguyen', 'james.nguyen@example.com', '555-0106', '5 Cedar Ct, North Haverbrook'),
  ('Elena', 'Rodriguez', 'elena.r@example.com', '555-0107', '300 Willow Way, Shelbyville'),
  ('David', 'Kim', 'david.kim@example.com', '555-0108', '14 Spruce Dr, Springfield')
ON CONFLICT (email) DO NOTHING;

-- Vehicles
INSERT INTO vehicles (customer_id, make, model, year, license_plate, vin, color, mileage) VALUES
  (1, 'Toyota', 'Camry', 2020, 'ABC1234', '1HGCM82633A123456', 'Silver', 34500),
  (1, 'Honda', 'Civic', 2018, 'XYZ5678', '2T1BURHE0JC123456', 'Blue', 52000),
  (2, 'Ford', 'F-150', 2021, 'DEF9012', '1FTEX1EP9JFA12345', 'Black', 28000),
  (3, 'Chevrolet', 'Malibu', 2019, 'GHI3456', '1G1ZD5ST0JF123456', 'White', 41000),
  (4, 'BMW', '3 Series', 2022, 'JKL7890', 'WBA5E1C56GG123456', 'Red', 15000),
  (5, 'Hyundai', 'Elantra', 2020, 'MNO1234', '5NPD74LF0JH123456', 'Grey', 38000),
  (6, 'Tesla', 'Model 3', 2023, 'PQR5678', '5YJ3E1EA1NF123456', 'White', 8000),
  (7, 'Nissan', 'Altima', 2019, 'STU9012', '1N4BL4BV0KC123456', 'Blue', 47000),
  (8, 'Jeep', 'Wrangler', 2021, 'VWX3456', '1C4GJXAG0MW123456', 'Green', 22000)
ON CONFLICT (license_plate) DO NOTHING;

-- Mechanics
INSERT INTO mechanics (first_name, last_name, email, phone, specialization, is_active) VALUES
  ('Carlos', 'Mendez', 'c.mendez@servicecentre.com', '555-2001', 'Engine & Transmission', TRUE),
  ('Linda', 'Foster', 'l.foster@servicecentre.com', '555-2002', 'Brakes & Suspension', TRUE),
  ('Kevin', 'Okafor', 'k.okafor@servicecentre.com', '555-2003', 'Electrical Systems', TRUE),
  ('Nina', 'Patel', 'n.patel@servicecentre.com', '555-2004', 'General Service & Oil Change', TRUE),
  ('Raj', 'Gupta', 'r.gupta@servicecentre.com', '555-2005', 'AC & Heating', TRUE),
  ('Amy', 'Zhang', 'a.zhang@servicecentre.com', '555-2006', 'Tires & Alignment', TRUE),
  ('Marcus', 'Brown', 'm.brown@servicecentre.com', '555-2007', 'Diagnostics & Engine', TRUE),
  ('Fatima', 'Hassan', 'f.hassan@servicecentre.com', '555-2008', 'Bodywork & Paint', TRUE),
  ('Steve', 'Larson', 's.larson@servicecentre.com', '555-2009', 'Exhaust & Emissions', TRUE),
  ('Diana', 'Cruz', 'd.cruz@servicecentre.com', '555-2010', 'General Service', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Service Appointments
INSERT INTO service_appointments (vehicle_id, customer_id, mechanic_id, appointment_date, status, service_type, description, estimated_hours) VALUES
  (1, 1, 4, NOW() - INTERVAL '30 days', 'completed', 'Oil Change', 'Full synthetic oil change and filter replacement', 1.0),
  (3, 2, 1, NOW() - INTERVAL '20 days', 'completed', 'Engine Tune-Up', 'Spark plugs, air filter, fuel filter replacement', 3.0),
  (5, 4, 2, NOW() - INTERVAL '10 days', 'completed', 'Brake Service', 'Front and rear brake pad replacement', 2.5),
  (2, 1, 6, NOW() - INTERVAL '5 days', 'completed', 'Tire Rotation & Alignment', 'Rotate all four tires and four-wheel alignment', 1.5),
  (4, 3, 7, NOW() + INTERVAL '1 day', 'scheduled', 'Diagnostic Check', 'Check engine light on - full diagnostic scan', 2.0),
  (6, 5, 5, NOW() + INTERVAL '2 days', 'scheduled', 'AC Service', 'AC not cooling - inspect and recharge refrigerant', 2.0),
  (7, 6, 3, NOW() + INTERVAL '3 days', 'scheduled', 'Electrical Inspection', 'Battery warning light - inspect charging system', 1.5),
  (8, 7, 1, NOW() + INTERVAL '5 days', 'scheduled', 'Transmission Service', 'Transmission fluid flush and filter change', 3.0),
  (9, 8, 4, NOW() + INTERVAL '7 days', 'scheduled', 'Oil Change', 'Conventional oil change, filter and top-up', 1.0),
  (1, 1, 2, NOW() + INTERVAL '10 days', 'scheduled', 'Suspension Check', 'Clunking noise from front suspension', 2.0)
ON CONFLICT DO NOTHING;

-- Repair Records (for completed appointments only)
INSERT INTO repair_records (appointment_id, mechanic_id, work_performed, parts_used, labor_hours, parts_cost, labor_cost, status, started_at, completed_at) VALUES
  (1, 4, 'Drained old oil, replaced oil filter, filled with 5W-30 full synthetic (5 quarts)', 'Mobil 1 5W-30 5qt, OEM oil filter', 0.75, 32.50, 52.50, 'completed', NOW() - INTERVAL '30 days', NOW() - INTERVAL '29 days 23 hours'),
  (2, 1, 'Replaced 4 spark plugs, air filter, and fuel filter. Reset ignition timing.', 'NGK iridium spark plugs x4, OEM air filter, fuel filter', 3.0, 145.00, 210.00, 'completed', NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days 21 hours'),
  (3, 2, 'Removed worn brake pads front and rear. Resurfaced rotors. Installed new pads. Brake fluid topped off.', 'Bosch QuietCast brake pads front x2, rear x2, brake fluid', 2.5, 210.00, 175.00, 'completed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days 22 hours'),
  (4, 6, 'Rotated all 4 tires to even wear pattern. Performed 4-wheel computerized alignment. Adjusted toe and camber.', 'No parts required', 1.5, 0.00, 105.00, 'completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days 23 hours')
ON CONFLICT DO NOTHING;

-- Billing (for completed appointments)
INSERT INTO billing (appointment_id, customer_id, subtotal, tax_rate, tax_amount, total_amount, payment_status, payment_method, invoice_date, paid_at) VALUES
  (1, 1, 85.00, 0.08, 6.80, 91.80, 'paid', 'credit_card', NOW() - INTERVAL '29 days 23 hours', NOW() - INTERVAL '29 days 22 hours'),
  (2, 2, 355.00, 0.08, 28.40, 383.40, 'paid', 'cash', NOW() - INTERVAL '19 days 21 hours', NOW() - INTERVAL '19 days 20 hours'),
  (3, 4, 385.00, 0.08, 30.80, 415.80, 'paid', 'debit_card', NOW() - INTERVAL '9 days 22 hours', NOW() - INTERVAL '9 days 21 hours'),
  (4, 1, 105.00, 0.08, 8.40, 113.40, 'paid', 'credit_card', NOW() - INTERVAL '4 days 23 hours', NOW() - INTERVAL '4 days 22 hours')
ON CONFLICT DO NOTHING;
