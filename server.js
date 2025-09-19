// server.js (The new, clean version)
const express = require('express');
const path = require('path');

// Import your new router
const courseRoutes = require('./routes/courseRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Set up the view engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Use the routes defined in courseRoutes.js
app.use('/', courseRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
