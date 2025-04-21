// db.js - Database Connection Setup
const mysql = require('mysql2/promise');
require('dotenv').config(); // Load .env variables

const dbPool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Enable decimal numbers to be returned as strings to avoid precision issues
  decimalNumbers: true
});

// Test connection on startup (optional, good for debugging)
dbPool.getConnection()
  .then(connection => {
    console.log('Database connected successfully!');
    connection.release(); // Release the connection back to the pool
  })
  .catch(err => {
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('!!! Error connecting to the database:');
    console.error('!!! Please check .env credentials (DB_USER, DB_PASSWORD, DB_NAME)');
    console.error('!!! Ensure MySQL server is running and database exists.');
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error(err);
    process.exit(1); // Exit if database connection fails
  });


module.exports = dbPool; // Export the pool
