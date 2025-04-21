// routes.js - Defines application endpoints
const express = require('express');
const router = express.Router();
const controller = require('./controller'); // Import controller functions

// --- Dashboard Route ---
router.get('/', controller.renderDashboard); // Show main page with dashboard

// --- Warehouse Routes ---
router.post('/warehouses/add', controller.processAddWarehouse);
// Add GET /warehouses to list warehouses on a separate page later if needed

// --- Supplier Routes --- (Need forms/pages for these)
router.post('/suppliers/add', controller.processAddSupplier);
// Add GET /suppliers/add, GET /suppliers later

// --- Product Routes ---
router.post('/products/add', controller.processAddProduct); // Handles adding product type
router.post('/products/delete', controller.processDeleteProduct); // Handles deleting product by SKU
// Add GET /products/add, GET /products later

// --- Inventory Routes ---
router.post('/inventory/add', controller.processAddInventory); // Handles adding stock
router.get('/inventory/search', controller.renderInventorySearch); // Handles displaying search results/list
router.post('/inventory/update/quantity', controller.processUpdateInventoryQuantity); // Handles quantity update

// --- Add other routes for specific pages/actions as needed ---
// Example: Route to show the Add Supplier form page
// router.get('/suppliers/add', controller.renderAddSupplierForm);


module.exports = router;
