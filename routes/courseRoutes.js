// routes/courseRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const courseController = require('../controllers/courseController');

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// Define the routes
router.get('/', courseController.getHomePage);
router.get('/upload', courseController.getUploadPage);
router.post('/upload', upload.single('materialFile'), courseController.handleUpload);
router.get('/course-name/:courseNameId/materials', courseController.getMaterialsForCourse);
router.get('/semester/:semesterId/coursetype/:courseTypeId', courseController.getSubjectsAndMaterials);



module.exports = router;