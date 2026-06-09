-- Migration for existing databases (run manually if DB was created before this change)
ALTER TABLE `User`
  ADD COLUMN emailVerified TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN verificationToken VARCHAR(64) NULL,
  ADD COLUMN verificationTokenExpires DATETIME NULL;

ALTER TABLE `Order`
  ADD COLUMN paymentStatus VARCHAR(50) NULL;

UPDATE `User` SET emailVerified = 1 WHERE email LIKE '%@demo.local';
