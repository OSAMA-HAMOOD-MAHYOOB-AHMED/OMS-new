-- Schema for Al-Wakeel Al-Shamel OMS
-- Designed for MySQL 8+

CREATE TABLE IF NOT EXISTS `User` (
  email VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phoneNumber VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS Product (
  productID VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stockLevel INT NOT NULL DEFAULT 0,
  description TEXT NULL
);

CREATE TABLE IF NOT EXISTS `Order` (
  orderID VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  orderDate DATETIME NOT NULL,
  totalPrice DECIMAL(10,2) NOT NULL,
  orderStatus VARCHAR(50) NOT NULL,
  paymentMethod VARCHAR(50) NOT NULL,
  creditStatus VARCHAR(50) NULL,
  CONSTRAINT fk_order_user FOREIGN KEY (email) REFERENCES `User`(email)
);

CREATE TABLE IF NOT EXISTS Order_Item (
  orderID VARCHAR(50) NOT NULL,
  productID VARCHAR(50) NOT NULL,
  quantity INT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (orderID, productID),
  CONSTRAINT fk_order_item_order FOREIGN KEY (orderID) REFERENCES `Order`(orderID),
  CONSTRAINT fk_order_item_product FOREIGN KEY (productID) REFERENCES Product(productID)
);

CREATE TABLE IF NOT EXISTS Inventory (
  inventoryID VARCHAR(50) PRIMARY KEY,
  productID VARCHAR(50) NOT NULL,
  location VARCHAR(100) NOT NULL,
  quantityAvailable INT NOT NULL DEFAULT 0,
  quantityReserved INT NOT NULL DEFAULT 0,
  lastCheckupDate DATETIME NULL,
  CONSTRAINT fk_inventory_product FOREIGN KEY (productID) REFERENCES Product(productID)
);

-- Extra (needed for Phase 1 demo): inventory checkups / stock movements history
CREATE TABLE IF NOT EXISTS Inventory_Audit (
  auditID BIGINT PRIMARY KEY AUTO_INCREMENT,
  inventoryID VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  deltaQuantity INT NOT NULL,
  note VARCHAR(255) NULL,
  createdAt DATETIME NOT NULL,
  CONSTRAINT fk_audit_inventory FOREIGN KEY (inventoryID) REFERENCES Inventory(inventoryID)
);

