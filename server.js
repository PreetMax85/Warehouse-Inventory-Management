// server.js - Main application entry point

// 1. Load Environment Variables
require('dotenv').config();

// 2. Import Modules
const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');
const mainRouter = require('./routes');
const session = require('express-session');
const flash = require('connect-flash');

// 3. Initialize Express App
const app = express();
const PORT = process.env.PORT || 3000;

// 4. Configure Handlebars View Engine
app.engine('.hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials'),
    helpers: {
        ifeq: function(a, b, options) {
            if (a === b) {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }
        },
        gt: function(a, b) {
            return Number(a) > Number(b);
        },
        lt: function(a, b) {
            return Number(a) < Number(b);
        },
        year: function() {
            return new Date().getFullYear();
        }
    }
}));
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

// 5. Setup Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configure Session Middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'a default secret key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Configure Flash Middleware
app.use(flash());

// Make flash messages available in all views
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

// 6. Mount the Router
app.use('/', mainRouter);

// 7. Basic Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err.stack || err);
    res.status(500).send('Something went wrong! Check server logs.');
});

// 8. Start the Server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Access the app at http://localhost:${PORT}`);
    console.log('------------------------------------');
    console.log('Make sure your MySQL database is running and configured in .env!');
    console.log('Use Ctrl+C in the terminal to stop the server.');
    console.log('------------------------------------');
});