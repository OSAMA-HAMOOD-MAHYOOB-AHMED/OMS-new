-- Product images migration (run manually if DB was created before this change)
ALTER TABLE Product
  ADD COLUMN imageUrl VARCHAR(512) NULL;

UPDATE Product SET imageUrl = '/images/products/charger.jpg' WHERE productID = 'P-CHARGER-01';
UPDATE Product SET imageUrl = '/images/products/earphones.jpg' WHERE productID = 'P-EARPH-01';
UPDATE Product SET imageUrl = '/images/products/powerbank.jpg' WHERE productID = 'P-PBANK-01';
UPDATE Product SET imageUrl = '/images/products/case.jpg' WHERE productID = 'P-CASE-01';
