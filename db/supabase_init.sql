-- PostgreSQL schema for Supabase (and local Postgres via Docker)
-- Run in Supabase → SQL Editor, or auto-applied by docker-compose postgres init.

CREATE TABLE IF NOT EXISTS "User" (
  email VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phonenumber VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  emailverified BOOLEAN NOT NULL DEFAULT FALSE,
  verificationtoken VARCHAR(64) NULL,
  verificationtokenexpires TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS product (
  productid VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stocklevel INT NOT NULL DEFAULT 0,
  description TEXT NULL,
  imageurl VARCHAR(512) NULL
);

CREATE TABLE IF NOT EXISTS "Order" (
  orderid VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  orderdate TIMESTAMPTZ NOT NULL,
  totalprice DECIMAL(10,2) NOT NULL,
  orderstatus VARCHAR(50) NOT NULL,
  paymentmethod VARCHAR(50) NOT NULL,
  paymentstatus VARCHAR(50) NULL,
  creditstatus VARCHAR(50) NULL,
  CONSTRAINT fk_order_user FOREIGN KEY (email) REFERENCES "User"(email)
);

CREATE TABLE IF NOT EXISTS order_item (
  orderid VARCHAR(50) NOT NULL,
  productid VARCHAR(50) NOT NULL,
  quantity INT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (orderid, productid),
  CONSTRAINT fk_order_item_order FOREIGN KEY (orderid) REFERENCES "Order"(orderid),
  CONSTRAINT fk_order_item_product FOREIGN KEY (productid) REFERENCES product(productid)
);

CREATE TABLE IF NOT EXISTS inventory (
  inventoryid VARCHAR(50) PRIMARY KEY,
  productid VARCHAR(50) NOT NULL,
  location VARCHAR(100) NOT NULL,
  quantityavailable INT NOT NULL DEFAULT 0,
  quantityreserved INT NOT NULL DEFAULT 0,
  lastcheckupdate TIMESTAMPTZ NULL,
  CONSTRAINT fk_inventory_product FOREIGN KEY (productid) REFERENCES product(productid)
);

CREATE TABLE IF NOT EXISTS inventory_audit (
  auditid BIGSERIAL PRIMARY KEY,
  inventoryid VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  deltaquantity INT NOT NULL,
  note VARCHAR(255) NULL,
  createdat TIMESTAMPTZ NOT NULL,
  CONSTRAINT fk_audit_inventory FOREIGN KEY (inventoryid) REFERENCES inventory(inventoryid)
);

CREATE TABLE IF NOT EXISTS invoice (
  invoiceid BIGSERIAL PRIMARY KEY,
  orderid VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  createdat TIMESTAMPTZ NOT NULL,
  CONSTRAINT fk_invoice_order FOREIGN KEY (orderid) REFERENCES "Order"(orderid),
  CONSTRAINT fk_invoice_user FOREIGN KEY (email) REFERENCES "User"(email)
);

INSERT INTO product (productid, name, category, price, stocklevel, description, imageurl) VALUES
('P-CHARGER-01', 'Fast Charger 20W', 'Chargers', 9.99, 50, 'USB-C fast charger 20W', '/images/products/charger.jpg'),
('P-EARPH-01', 'Wireless Earphones', 'Earphones', 19.99, 30, 'Bluetooth earphones', '/images/products/earphones.jpg'),
('P-PBANK-01', 'Power Bank 10000mAh', 'Power Banks', 24.99, 20, 'Compact 10,000mAh power bank', '/images/products/powerbank.jpg'),
('P-CASE-01', 'Phone Case (Clear)', 'Phone Cases', 7.49, 100, 'Clear protective phone case', '/images/products/case.jpg')
ON CONFLICT (productid) DO NOTHING;

INSERT INTO inventory (inventoryid, productid, location, quantityavailable, quantityreserved, lastcheckupdate) VALUES
('INV-CHARGER-01', 'P-CHARGER-01', 'Main Warehouse', 50, 0, NOW()),
('INV-EARPH-01', 'P-EARPH-01', 'Main Warehouse', 30, 0, NOW()),
('INV-PBANK-01', 'P-PBANK-01', 'Main Warehouse', 20, 0, NOW()),
('INV-CASE-01', 'P-CASE-01', 'Main Warehouse', 100, 0, NOW())
ON CONFLICT (inventoryid) DO NOTHING;
