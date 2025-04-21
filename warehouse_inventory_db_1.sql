-- Database: warehouse_inventory_db
-- Create if it doesn't exist
CREATE DATABASE IF NOT EXISTS warehouse_inventory_db_1;
USE warehouse_inventory_db_1;

-- Warehouses Table: Stores information about each warehouse location.
CREATE TABLE IF NOT EXISTS warehouses (
    warehouse_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE, -- Ensure warehouse names are unique
    address TEXT,
    storage_capacity INT, -- Optional: Max number of product units/types (as defined by user)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Suppliers Table: Stores information about product suppliers.
CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255) UNIQUE,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products Table: Stores general information about each type of product.
-- Removed reorder_level and target_stock_level, added cost.
CREATE TABLE IF NOT EXISTS products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(100) UNIQUE NOT NULL, -- Stock Keeping Unit
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Cost per unit (Mandatory)
    supplier_id INT, -- Foreign key linking to the supplier
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE SET NULL ON UPDATE CASCADE -- If supplier deleted, set product's supplier to NULL
);

-- Inventory Table: Tracks the quantity of specific products in specific warehouses.
CREATE TABLE IF NOT EXISTS inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    warehouse_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0), -- Ensure quantity cannot be negative
    storage_location VARCHAR(100), -- Specific location within the warehouse
    last_counted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE ON UPDATE CASCADE, -- If product deleted, delete inventory entries
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id) ON DELETE CASCADE ON UPDATE CASCADE, -- If warehouse deleted, delete inventory entries
    UNIQUE KEY unique_product_warehouse (product_id, warehouse_id) -- Only one entry per product per warehouse
);

-- Transactions Table: Logs movements of inventory.
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    inventory_id INT NULL, -- Allow NULL initially if product/inventory is deleted later? Or handle differently? Let's keep NOT NULL for now.
    product_id INT NOT NULL, -- Store product_id directly for easier lookup even if inventory row is gone
    warehouse_id INT NOT NULL, -- Store warehouse_id directly
    transaction_type ENUM('RECEIPT', 'SHIPMENT', 'ADJUSTMENT', 'INITIAL') NOT NULL,
    quantity_change INT NOT NULL, -- Change in quantity (+ve for receipts/in, -ve for shipments/out/adjustments)
    new_quantity INT NOT NULL, -- The resulting quantity after the transaction
    notes TEXT,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT, -- Optional: For user tracking later
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT ON UPDATE CASCADE, -- Don't delete product if transactions exist
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id) ON DELETE RESTRICT ON UPDATE CASCADE -- Don't delete warehouse if transactions exist
    -- We removed the direct FK to inventory to allow logging even if an inventory item is somehow removed,
    -- but this means we rely on product_id/warehouse_id in this table.
    -- Alternatively, keep FK to inventory and use ON DELETE RESTRICT. Let's try this:
    -- FOREIGN KEY (inventory_id) REFERENCES inventory(inventory_id) ON DELETE RESTRICT ON UPDATE CASCADE -- Don't delete inventory record if transactions exist
    -- This requires inventory_id to be NOT NULL.
);
-- Re-adding the inventory_id foreign key with RESTRICT is safer. Let's adjust the table definition:
ALTER TABLE transactions MODIFY COLUMN inventory_id INT NOT NULL;
ALTER TABLE transactions ADD CONSTRAINT fk_inventory_transaction
    FOREIGN KEY (inventory_id) REFERENCES inventory(inventory_id)
    ON DELETE RESTRICT ON UPDATE CASCADE;


-- --- VIEWS ---

-- View for Understocked Items (Quantity < 5)
CREATE OR REPLACE VIEW view_understocked_items AS
SELECT
    p.product_id, p.sku, p.name AS product_name, p.category, p.cost,
    w.warehouse_id, w.name AS warehouse_name,
    i.inventory_id, i.quantity, i.storage_location
FROM inventory i
JOIN products p ON i.product_id = p.product_id
JOIN warehouses w ON i.warehouse_id = w.warehouse_id
WHERE i.quantity < 5; -- Fixed threshold

-- View for Overstocked Items (Quantity > 50)
CREATE OR REPLACE VIEW view_overstocked_items AS
SELECT
    p.product_id, p.sku, p.name AS product_name, p.category, p.cost,
    w.warehouse_id, w.name AS warehouse_name,
    i.inventory_id, i.quantity, i.storage_location
FROM inventory i
JOIN products p ON i.product_id = p.product_id
JOIN warehouses w ON i.warehouse_id = w.warehouse_id
WHERE i.quantity > 50; -- Fixed threshold

-- View for Combined Inventory Details (useful for searching/listing)
CREATE OR REPLACE VIEW view_inventory_details AS
SELECT
    i.inventory_id,
    i.quantity,
    i.storage_location,
    i.updated_at AS inventory_last_updated,
    p.product_id,
    p.sku,
    p.name AS product_name,
    p.description AS product_description,
    p.category,
    p.cost,
    w.warehouse_id,
    w.name AS warehouse_name,
    s.supplier_id,
    s.name AS supplier_name
FROM inventory i
JOIN products p ON i.product_id = p.product_id
JOIN warehouses w ON i.warehouse_id = w.warehouse_id
LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id; -- Left join in case supplier is null

-- View for Dashboard: Total Inventory Value (using cost)
CREATE OR REPLACE VIEW view_dashboard_total_value AS
SELECT SUM(i.quantity * p.cost) AS total_value
FROM inventory i
JOIN products p ON i.product_id = p.product_id;

-- View for Dashboard: Recent Transactions (Example: Last 5)
-- Note: Requires formatting date in application code or using MySQL date functions
CREATE OR REPLACE VIEW view_dashboard_recent_transactions AS
SELECT
    t.transaction_id, t.transaction_type, t.quantity_change, t.new_quantity, t.notes, t.transaction_date,
    p.sku, p.name as product_name
FROM transactions t
JOIN products p ON t.product_id = p.product_id
ORDER BY t.transaction_date DESC
LIMIT 5;

