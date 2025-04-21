// controller.js - Handles application logic
const model = require('./model');

async function getCommonViewData() {
    try {
        const [warehouses, suppliers, products] = await Promise.all([
            model.getAllWarehouses(),
            model.getAllSuppliers(),
            model.getAllProducts()
        ]);
        return { warehouses, suppliers, products };
    } catch (error) {
        console.error("Error fetching common view data:", error);
        return { warehouses: [], suppliers: [], products: [] };
    }
}

// --- Dashboard Controller ---
const renderDashboard = async (req, res) => {
    try {
        const commonData = await getCommonViewData();
        const dashboardData = await model.getDashboardStats();
        res.render('index', {
            title: 'Dashboard',
            dashboardData: dashboardData,
            warehouses: commonData.warehouses,
            suppliers: commonData.suppliers,
            products: commonData.products,
            inventoryItems: [],
            success_msg: req.flash('success_msg'),
            error_msg: req.flash('error_msg')
        });
    } catch (error) {
        console.error("Error rendering dashboard:", error);
        req.flash('error_msg', 'Error loading dashboard. Please try again.');
        res.redirect('/');
    }
};

// --- Warehouse Controllers ---
const processAddWarehouse = async (req, res) => {
    const { warehouseName, address, capacity } = req.body;
    if (!warehouseName) {
        req.flash('error_msg', 'Warehouse name is required.');
        return res.redirect('/');
    }
    try {
        await model.addWarehouse(warehouseName, address, capacity);
        req.flash('success_msg', 'Warehouse added successfully!');
    } catch (error) {
        console.error("Error adding warehouse:", error);
        req.flash('error_msg', 'Failed to add warehouse. Please try again.');
    }
    res.redirect('/');
};

// --- Supplier Controllers ---
const processAddSupplier = async (req, res) => {
    const { supplierName, contactPerson, phone, email, address } = req.body;
    if (!supplierName) {
        req.flash('error_msg', 'Supplier name is required.');
        return res.redirect('/');
    }
    try {
        await model.addSupplier(supplierName, contactPerson, phone, email, address);
        req.flash('success_msg', 'Supplier added successfully!');
    } catch (error) {
        console.error("Error adding supplier:", error);
        req.flash('error_msg', 'Failed to add supplier. Please try again.');
    }
    res.redirect('/');
};

// --- Product Controllers ---
const processAddProduct = async (req, res) => {
    const { sku, name, description, category, cost, supplier_id } = req.body;
    if (!sku || !name || !cost || !supplier_id) {
        req.flash('error_msg', 'Missing required product fields (SKU, Name, Cost, Supplier).');
        return res.redirect('/');
    }
    try {
        await model.addProduct(sku, name, description, category, cost, supplier_id);
        req.flash('success_msg', 'Product type added successfully!');
    } catch (error) {
        console.error("Error adding product:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            req.flash('error_msg', 'Duplicate SKU detected. Please use a unique SKU.');
        } else {
            req.flash('error_msg', 'Failed to add product. Please try again.');
        }
    }
    res.redirect('/');
};

const processDeleteProduct = async (req, res) => {
    const { sku } = req.body;
    if (!sku) {
        req.flash('error_msg', 'SKU is required for deletion.');
        return res.redirect('/');
    }
    try {
        const product = await model.findProductBySku(sku);
        const hasHistory = await model.checkProductTransactionHistory(product.product_id);
        if (hasHistory) {
            req.flash('error_msg', `Cannot delete product SKU ${sku} because it has transaction history.`);
            return res.redirect('/');
        }
        const deletedRows = await model.deleteProduct(product.product_id);
        if (deletedRows > 0) {
            req.flash('success_msg', `Product SKU ${sku} deleted successfully.`);
        } else {
            req.flash('error_msg', `Failed to delete product SKU ${sku}.`);
        }
    } catch (error) {
        console.error(`Error deleting product SKU ${sku}:`, error);
        if (error.message.includes('not found')) {
            req.flash('error_msg', `Product with SKU ${sku} not found.`);
        } else {
            req.flash('error_msg', `Error deleting product SKU ${sku}. Please try again.`);
        }
    }
    res.redirect('/');
};

// --- Inventory Controllers ---
const processAddInventory = async (req, res) => {
    const { product_id, warehouse_id, quantity, storage_location, notes } = req.body;
    if (!product_id || !warehouse_id || !quantity || quantity < 1) {
        req.flash('error_msg', 'Missing required inventory fields (Product, Warehouse, Quantity > 0).');
        return res.redirect('/');
    }
    try {
        await model.addInventory(product_id, warehouse_id, quantity, storage_location, notes);
        req.flash('success_msg', 'Inventory added/updated successfully!');
        res.redirect('/inventory/search');
    } catch (error) {
        console.error("Error adding inventory:", error);
        req.flash('error_msg', 'Failed to add inventory. Please check inputs and try again.');
        res.redirect('/');
    }
};

const processUpdateInventoryQuantity = async (req, res) => {
    const { inventory_id, new_quantity, notes } = req.body;
    if (!inventory_id || new_quantity === undefined || new_quantity < 0) {
        req.flash('error_msg', 'Missing required fields for quantity update (ID, New Quantity >= 0).');
        return res.redirect('/inventory/search');
    }
    try {
        await model.updateInventoryQuantity(inventory_id, new_quantity, notes);
        req.flash('success_msg', 'Inventory quantity updated successfully.');
    } catch (error) {
        console.error(`Error updating inventory ${inventory_id}:`, error);
        if (error.message.includes('not found')) {
            req.flash('error_msg', `Inventory item with ID ${inventory_id} not found.`);
        } else {
            req.flash('error_msg', 'Failed to update inventory quantity. Please try again.');
        }
    }
    res.redirect('/inventory/search');
};

const renderInventorySearch = async (req, res) => {
    const searchCriteria = {
        sku: req.query.sku || null,
        name: req.query.name || null,
        category: req.query.category || null,
        warehouseId: req.query.warehouse_id || null,
        stockLevel: req.query.stock_level || null
    };

    try {
        const commonData = await getCommonViewData();
        const inventoryItems = await model.searchInventory(searchCriteria);
        const dashboardData = await model.getDashboardStats();
        res.render('index', {
            title: 'Inventory Search',
            dashboardData: dashboardData,
            warehouses: commonData.warehouses,
            suppliers: commonData.suppliers,
            products: commonData.products,
            inventoryItems: inventoryItems,
            searchCriteria: searchCriteria,
            success_msg: req.flash('success_msg'),
            error_msg: req.flash('error_msg')
        });
    } catch (error) {
        console.error("Error rendering inventory search:", error);
        req.flash('error_msg', 'Error loading inventory search. Please try again.');
        res.redirect('/');
    }
};

module.exports = {
    renderDashboard,
    processAddWarehouse,
    processAddSupplier,
    processAddProduct,
    processDeleteProduct,
    processAddInventory,
    processUpdateInventoryQuantity,
    renderInventorySearch,
};