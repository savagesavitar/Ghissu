// routes/courseRoutes.js
const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

// Homepage
router.get('/', courseController.getHomePage);

// Upload Page
router.get('/upload', courseController.getUploadPage);
router.post('/upload', courseController.handleUpload);

// Materials Page (Looking for getMaterialsByCategory)
router.get('/materials/semester/:semesterId/type/:typeId', courseController.getMaterialsByCategory);

// Feedback & Queries
router.get('/feedback', courseController.getFeedbackPage);
// ... existing routes ...

// Queries Page Routes
router.get('/queries', courseController.getQueriesPage);
router.post('/queries', courseController.handleQuerySubmission);

module.exports = router;

module.exports = router;