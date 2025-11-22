const express = require('express');
const path = require('path');

// 1. Import your routes
// IMPORTANT: Make sure the file inside 'routes' folder is actually named 'courseRoutes.js'
const courseRoutes = require('./routes/courseRoutes');

const app = express();

// 2. Set the Port (Required for Render)
const PORT = process.env.PORT || 3000;

// 3. Set up View Engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 4. Middleware
app.use(express.urlencoded({ extended: true })); // Parse form data (for Queries/Uploads)
app.use(express.json()); // Parse JSON
app.use(express.static(path.join(__dirname, 'public'))); // Serve images and CSS

// 5. Use the Routes
app.use('/', courseRoutes);

// 6. Start the Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});