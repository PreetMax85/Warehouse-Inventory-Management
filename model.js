// model.js - Handles all database interactions
const dbPool = require('./db');

// --- Warehouse Functions ---
async function addWarehouse(name, address, capacity) {
    const sql = 'INSERT INTO warehouses (name, address, storage_capacity) VALUES (?, ?, ?)';
    const [result] = await dbPool.query(sql, [name, address, capacity || null]);
    return result.insertId;
}

async function getAllWarehouses() {
    const sql = 'SELECT warehouse_id, name FROM warehouses ORDER BY name';
    const [rows] = await dbPool.query(sql);
    return rows;
}

// --- Supplier Functions ---
async function addSupplier(name, contact, phone, email, address) {
    const sql = 'INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)';
    const [result] = await dbPool.query(sql, [name, contact, phone, email, address]);
    return result.insertId;
}

async function getAllSuppliers() {
    const sql = 'SELECT supplier_id, name FROM suppliers ORDER BY name';
    const [rows] = await dbPool.query(sql);
    return rows;
}

// --- Product Functions ---
async function addProduct(sku, name, description, category, cost, supplierId) {
    const sql = 'INSERT INTO products (sku, name, description, category, cost, supplier_id) VALUES (?, ?, ?, ?, ?, ?)';
    const [result] = await dbPool.query(sql, [sku, name, description, category, cost, supplierId]);
    return result.insertId;
}

async function getAllProducts() {
    const sql = 'SELECT product_id, sku, name FROM products ORDER BY name';
    const [rows] = await dbPool.query(sql);
    return rows;
}

async function findProductBySku(sku) {
    const sql = 'SELECT product_id, sku, name FROM products WHERE sku = ?';
    const [rows] = await dbPool.query(sql, [sku]);
    if (!rows.length) {
        throw new Error(`Product with SKU ${sku} not found`);
    }
    return rows[0];
}

async function deleteProduct(productId) {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        // Delete related inventory records first (if no transaction history check is bypassed)
        const deleteInventorySql = 'DELETE FROM inventory WHERE product_id = ?';
        await connection.query(deleteInventorySql, [productId]);

        // Delete the product
        const deleteProductSql = 'DELETE FROM products WHERE product_id = ?';
        const [result] = await connection.query(deleteProductSql, [productId]);

        if (result.affectedRows === 0) {
            throw new Error(`Product with ID ${productId} not found for deletion`);
        }

        await connection.commit();
        return result.affectedRows;
    } catch (error) {
        await connection.rollback();
        console.error(`Error deleting product ID ${productId}:`, error);
        throw error;
    } finally {
        connection.release();
    }
}

// --- Inventory Functions ---
async function addInventory(productId, warehouseId, quantity, storageLocation, notes) {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        // Check if inventory record already exists
        const checkSql = 'SELECT inventory_id, quantity FROM inventory WHERE product_id = ? AND warehouse_id = ?';
        const [existing] = await connection.query(checkSql, [productId, warehouseId]);

        let inventoryId;
        let newQuantity;

        if (existing.length > 0) {
            // Update existing record
            inventoryId = existing[0].inventory_id;
            newQuantity = parseInt(existing[0].quantity, 10) + parseInt(quantity, 10);
            const updateSql = 'UPDATE inventory SET quantity = ?, storage_location = ?, updated_at = CURRENT_TIMESTAMP WHERE inventory_id = ?';
            await connection.query(updateSql, [newQuantity, storageLocation || null, inventoryId]);
        } else {
            // Insert new record
            newQuantity = parseInt(quantity, 10);
            const insertSql = 'INSERT INTO inventory (product_id, warehouse_id, quantity, storage_location) VALUES (?, ?, ?, ?)';
            const [insertResult] = await connection.query(insertSql, [productId, warehouseId, newQuantity, storageLocation || null]);
            inventoryId = insertResult.insertId;
        }

        // Log the transaction
        const logSql = `INSERT INTO transactions (inventory_id, product_id, warehouse_id, transaction_type, quantity_change, new_quantity, notes)
                        VALUES (?, ?, ?, 'RECEIPT', ?, ?, ?)`;
        await connection.query(logSql, [inventoryId, productId, warehouseId, quantity, newQuantity, notes || 'Stock receipt']);

        await connection.commit();
        return { inventoryId, newQuantity };
    } catch (error) {
        await connection.rollback();
        console.error("Error in addInventory transaction:", error);
        throw error;
    } finally {
        connection.release();
    }
}

async function updateInventoryQuantity(inventoryId, newQuantity, notes) {
    const connection = await dbPool.getConnection();
    try {
        await connection.beginTransaction();

        // Get current quantity and product/warehouse info
        const selectSql = `SELECT i.quantity, i.product_id, i.warehouse_id
                           FROM inventory i
                           WHERE i.inventory_id = ?`;
        const [currentRows] = await connection.query(selectSql, [inventoryId]);

        if (currentRows.length === 0) {
            throw new Error(`Inventory item with ID ${inventoryId} not found`);
        }
        const currentQuantity = parseInt(currentRows[0].quantity, 10);
        const productId = currentRows[0].product_id;
        const warehouseId = currentRows[0].warehouse_id;
        const quantityChange = parseInt(newQuantity, 10) - currentQuantity;

        // Update inventory quantity
        const updateSql = 'UPDATE inventory SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE inventory_id = ?';
        await connection.query(updateSql, [newQuantity, inventoryId]);

        // Log the transaction
        const logSql = `INSERT INTO transactions (inventory_id, product_id, warehouse_id, transaction_type, quantity_change, new_quantity, notes)
                        VALUES (?, ?, ?, 'ADJUSTMENT', ?, ?, ?)`;
        await connection.query(logSql, [inventoryId, productId, warehouseId, quantityChange, newQuantity, notes || 'Manual adjustment']);

        await connection.commit();
        return { updated: true };
    } catch (error) {
        await connection.rollback();
        console.error("Error in updateInventoryQuantity transaction:", error);
        throw error;
    } finally {
        connection.release();
    }
}

async function searchInventory({ sku, name, category, warehouseId, stockLevel }) {
    let sql = 'SELECT * FROM view_inventory_details WHERE 1=1';
    const params = [];

    if (sku) {
        sql += ' AND sku LIKE ?';
        params.push(`%${sku}%`);
    }
    if (name) {
        sql += ' AND product_name LIKE ?';
        params.push(`%${name}%`);
    }
    if (category) {
        sql += ' AND category LIKE ?';
        params.push(`%${category}%`);
    }
    if (warehouseId) {
        sql += ' AND warehouse_id = ?';
        params.push(warehouseId);
    }
    if (stockLevel === 'under') {
        sql += ' AND quantity < 5';
    }
    if (stockLevel === 'over') {
        sql += ' AND quantity > 50';
    }

    sql += ' ORDER BY warehouse_name, product_name';

    const [rows] = await dbPool.query(sql, params);
    return rows;
}

// Check if product has transaction history
async function checkProductTransactionHistory(productId) {
    const sql = 'SELECT COUNT(*) as count FROM transactions WHERE product_id = ?';
    const [rows] = await dbPool.query(sql, [productId]);
    return rows[0].count > 0;
}

// --- Dashboard Functions ---
async function getDashboardStats() {
    const [
        valueResult,
        lowStockResult,
        warehouseCountResult,
        supplierCountResult,
        productTypeCountResult,
        recentTransactionsResult
    ] = await Promise.all([
        dbPool.query('SELECT total_value FROM view_dashboard_total_value'),
        dbPool.query('SELECT COUNT(*) as count FROM view_understocked_items'),
        dbPool.query('SELECT COUNT(*) as count FROM warehouses'),
        dbPool.query('SELECT COUNT(*) as count FROM suppliers'),
        dbPool.query('SELECT COUNT(*) as count FROM products'),
        dbPool.query('SELECT * FROM view_dashboard_recent_transactions')
    ]);

    const formattedTransactions = recentTransactionsResult[0].map(tx => ({
        ...tx,
        formatted_date: new Date(tx.transaction_date).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short'})
    }));

    return {
        totalValue: valueResult[0][0]?.total_value || '0.00',
        lowStockCount: lowStockResult[0][0]?.count || 0,
        warehouseCount: warehouseCountResult[0][0]?.count || 0,
        supplierCount: supplierCountResult[0][0]?.count || 0,
        productTypeCount: productTypeCountResult[0][0]?.count || 0,
        recentTransactions: formattedTransactions,
        recentTransactionCount: formattedTransactions.length
    };
}

module.exports = {
    addWarehouse,
    getAllWarehouses,
    addSupplier,
    getAllSuppliers,
    addProduct,
    getAllProducts,
    findProductBySku,
    deleteProduct,
    addInventory,
    updateInventoryQuantity,
    searchInventory,
    checkProductTransactionHistory,
    getDashboardStats,
};