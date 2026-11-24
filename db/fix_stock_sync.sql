-- One-time repair for databases where Product.stockLevel and Inventory.quantityAvailable
-- drifted apart (admin product edits used to update only the Product table).
-- Inventory is treated as the source of truth, because checkout checks it.
-- Safe to run more than once. Run in Supabase -> SQL Editor.

-- 1) Products the admin added without an inventory row get one.
INSERT INTO inventory (inventoryid, productid, location, quantityavailable, quantityreserved, lastcheckupdate)
SELECT 'INV-' || p.productid, p.productid, 'Warehouse A', p.stocklevel, 0, NOW()
FROM product p
WHERE NOT EXISTS (SELECT 1 FROM inventory i WHERE i.productid = p.productid)
ON CONFLICT (inventoryid) DO NOTHING;

-- 2) Product stock matches the inventory total.
UPDATE product p
SET stocklevel = s.total
FROM (SELECT productid, SUM(quantityavailable) AS total FROM inventory GROUP BY productid) s
WHERE s.productid = p.productid
  AND p.stocklevel <> s.total;
