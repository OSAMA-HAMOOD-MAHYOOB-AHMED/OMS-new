-- Demo seed data (password hashes will be inserted by app init in Phase 1)

INSERT INTO Product (productID, name, category, price, stockLevel, description) VALUES
('P-CHARGER-01', 'Fast Charger 20W', 'Chargers', 9.99, 50, 'USB-C fast charger 20W'),
('P-EARPH-01', 'Wireless Earphones', 'Earphones', 19.99, 30, 'Bluetooth earphones'),
('P-PBANK-01', 'Power Bank 10000mAh', 'Power Banks', 24.99, 20, 'Compact 10,000mAh power bank'),
('P-CASE-01', 'Phone Case (Clear)', 'Phone Cases', 7.49, 100, 'Clear protective phone case');

INSERT INTO Inventory (inventoryID, productID, location, quantityAvailable, quantityReserved, lastCheckupDate) VALUES
('INV-CHARGER-01', 'P-CHARGER-01', 'Main Warehouse', 50, 0, NOW()),
('INV-EARPH-01', 'P-EARPH-01', 'Main Warehouse', 30, 0, NOW()),
('INV-PBANK-01', 'P-PBANK-01', 'Main Warehouse', 20, 0, NOW()),
('INV-CASE-01', 'P-CASE-01', 'Main Warehouse', 100, 0, NOW());

