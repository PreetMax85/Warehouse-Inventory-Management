# Warehouse Inventory Management System

A simple web application built with Node.js, Express, HTML,CSS, Javascript and MySQL to manage basic warehouse inventory operations. This project serves as a beginner-friendly introduction to full-stack development concepts, focusing on backend logic and database interactions.

## Objective

To develop a minimalistic inventory management system allowing users to perform Create, Read, Update, and Delete (CRUD) operations on warehouse locations, suppliers, product types, and inventory stock levels via a web interface.

## Key Features

* **Dashboard Overview:** Displays key metrics like Total Inventory Value (in ₹), Low Stock Item Count (<5 units), Recent Transactions, Active Warehouse Count, Total Supplier Count, and Total SKU Count. 
* **Insert Operations:**
    * Add new Warehouse locations (Name, Address, Capacity).
    * Add new Suppliers (Name, Contact Info, Address).
    * Add new Product Types (SKU, Name, Category, Cost, Supplier).
    * Add Stock to Inventory (Select existing Product & Warehouse, specify Quantity).
* **Delete Operations:**
    * Delete a Product Type by SKU (also removes associated inventory stock if no transaction history exists).
* **Search/View Operations:**
    * Search inventory stock based on SKU, Product Name, Category, or Warehouse.
    * Filter inventory to show only Understocked (<5 units) or Overstocked (>50 units) items.
    * View a combined list of inventory details based on search criteria.
* **Update Operations:**
    * Update the quantity of an existing inventory item.
* **User Feedback:** Displays success or error messages after performing actions.

## Project Structure
## Local Setup and Installation

Follow these steps to run the project locally:

1.  **Prerequisites:**
    * Node.js and npm installed (https://nodejs.org/)
    * MySQL Server installed and running (https://dev.mysql.com/)
    * MySQL client tool like MySQL Workbench installed (https://dev.mysql.com/downloads/workbench/)

2.  **Clone the Repository (or download files):**
    ```bash
    # If using Git
    git clone https://github.com/PreetMax85/Warehouse-Inventory-Management
    cd warehouse-app-simple
    ```
    If not using Git, ensure all the project files are inside the `warehouse-app-simple` folder.

3.  **Install Dependencies:**
    Open a terminal in the `warehouse-app-simple` directory and run:
    ```bash
    npm install
    ```
    This installs packages listed in `package.json` (`express`, `express-handlebars`, `mysql2`, `dotenv`, `express-session`, `connect-flash`, `nodemon`).

4.  **Database Setup:**
    * Open MySQL Workbench (or your preferred MySQL client).
    * Connect to your local MySQL server.
    * Run the SQL commands found in the `warehouse_inventory_db_1.sql` file to create the `warehouse_inventory_db` database and its tables/views. Ensure the database name matches the one specified in your `.env` file.
    * Make sure you have a MySQL user with privileges to access this database.

5.  **Environment Variables:**
    * Create a file named `.env` in the root of the project (`warehouse-app-simple/`).
    * Add the following content, **replacing the placeholder values** with your actual database credentials and a unique session secret:
        ```text
        # Server Configuration
        PORT=3000

        # Database Configuration
        DB_HOST=localhost
        DB_USER=your_db_user       # !!! Replace with your MySQL username
        DB_PASSWORD=your_db_password # !!! Replace with your MySQL password
        DB_NAME=warehouse_inventory_db # Should match the database name created
        DB_PORT=3306               # Default MySQL port

        # Secret key for sessions/flash messages
        SESSION_SECRET=replace_this_with_a_long_random_secret_string # !!! Replace this value
        ```

6.  **Run the Application:**
    Open a terminal in the project root directory and run:
    ```bash
    npm run dev
    ```
    This command uses `nodemon` to start the server, which will automatically restart if you make changes to the code.

7.  **Access the Application:**
    Open your web browser and navigate to `http://localhost:3000` (or the port specified in your `.env` file).

## Future Improvements I intend to add

* Implement user authentication and authorization.
* Add dedicated pages for viewing/editing Warehouses and Suppliers.
* Implement "soft delete" instead of permanent deletion.
* Add functionality to update product details (cost, category, description).
* Implement inventory transfer functionality between warehouses.
* Improve UI/UX design.

