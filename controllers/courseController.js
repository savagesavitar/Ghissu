// controllers/courseController.js
const db = require('../db'); // This connects to your db.js file
const fs = require('fs');
const path = require('path');
// The function to get the homepage (with debug checkpoints)
// controllers/courseController.js



// 1. HOMEPAGE: Fetch Courses + Read Meme Folder
exports.getHomePage = async (req, res) => {
  try {
    // 1. Fetch Courses for Navbar
    const [courseTypes] = await db.query('SELECT * FROM course_types');
    const sqlQuery = `
      SELECT c.id AS course_id, c.name AS course_name, s.id AS semester_id, s.semester_num
      FROM courses c LEFT JOIN semesters s ON c.id = s.course_id ORDER BY c.id, s.semester_num;
    `;
    const [rows] = await db.query(sqlQuery);
    
    const coursesMap = new Map();
    rows.forEach(row => {
      if (!row.course_id) return;
      if (!coursesMap.has(row.course_id)) {
        coursesMap.set(row.course_id, { id: row.course_id, name: row.course_name, semesters: [] });
      }
      const course = coursesMap.get(row.course_id);
      if (row.semester_id && !course.semesters.find(s => s.id === row.semester_id)) {
        course.semesters.push({ id: row.semester_id, semester_num: row.semester_num, types: courseTypes });
      }
    });
    const courses = Array.from(coursesMap.values());

    // 2. SAFE MEME LOADING (The Fix!)
    const memeDir = path.join(__dirname, '../public/images/memes');
    let memeFiles = [];

    try {
        // Only try to read if the folder actually exists
        if (fs.existsSync(memeDir)) {
            memeFiles = fs.readdirSync(memeDir).filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));
        } else {
            console.log("⚠️ Meme folder missing. Skipping memes.");
        }
    } catch (err) {
        console.error("Error checking meme folder:", err);
        // Do nothing, just let memeFiles be empty []
    }

    // 3. Render the page
    res.render('index', { 
      activePage: 'home', 
      courses: courses,
      memeFiles: memeFiles 
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};
// 2. UPLOAD PAGE: Checks for success flag and sends data
exports.getUploadPage = async (req, res) => {
  try {
    // Check if we just finished a successful upload
    const successMessage = req.query.status === 'success' ? 'Material link added successfully!' : null;

    const [courseTypes] = await db.query('SELECT * FROM course_types');
    
    const sqlQuery = `
      SELECT c.id AS course_id, c.name AS course_name, s.id AS semester_id, s.semester_num
      FROM courses c
      LEFT JOIN semesters s ON c.id = s.course_id
      ORDER BY c.id, s.semester_num;
    `;
    const [rows] = await db.query(sqlQuery);

    const coursesMap = new Map();
    rows.forEach(row => {
      if (!row.course_id) return;
      if (!coursesMap.has(row.course_id)) {
        coursesMap.set(row.course_id, { id: row.course_id, name: row.course_name, semesters: [] });
      }
      const course = coursesMap.get(row.course_id);
      if (row.semester_id && !course.semesters.find(s => s.id === row.semester_id)) {
        course.semesters.push({
          id: row.semester_id,
          semester_num: row.semester_num
        });
      }
    });

    res.render('upload', { 
      activePage: 'upload',
      coursesData: JSON.stringify(Array.from(coursesMap.values())),
      typesData: JSON.stringify(courseTypes),
      successMessage: successMessage // <--- Pass the message to the view
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// 3. HANDLE UPLOAD: Redirects back to upload page with success flag
exports.handleUpload = async (req, res) => {
  try {
    const { title, semester_id, course_type_id, author_name, author_branch, author_year, drive_link } = req.body;

    if (!title || !semester_id || !course_type_id || !drive_link) {
      return res.status(400).send('Missing required fields.');
    }

    const query = `
      INSERT INTO materials 
      (title, semester_id, course_type_id, author_name, author_branch, author_year, drive_link) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    await db.query(query, [title, semester_id, course_type_id, author_name, author_branch, author_year, drive_link]);

    // Redirect back to the SAME page with a status flag
    res.redirect('/upload?status=success'); 
  // In controllers/courseController.js inside handleUpload:

  } catch (err) {
    // --- LOGGING CODE ---
    console.log("========================================");
    console.log("❌ UPLOAD ERROR:");
    console.log(err.sqlMessage || err.message); 
    console.log("========================================");
    // --------------------
    
    console.error(err);
    res.status(500).send('Server Error: ' + (err.sqlMessage || err.message)); 
  }
};

// ... (Keep getMaterialsByCategory and others as they are) ...
// 4. VIEW MATERIALS: Fetch by Semester + Type (THIS WAS MISSING)
exports.getMaterialsByCategory = async (req, res) => {
  try {
    const { semesterId, typeId } = req.params;
    const [materials] = await db.query(
      'SELECT * FROM materials WHERE semester_id = ? AND course_type_id = ?', 
      [semesterId, typeId]
    );
    res.render('materials', { materials });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// 5. Feedback & Queries (Placeholders to prevent crashes)
exports.getFeedbackPage = (req, res) => { res.render('feedback', { activePage: 'feedback' }); };
// ... existing functions ...

// 7. RENDER QUERIES PAGE (Fetch existing queries to display)
exports.getQueriesPage = async (req, res) => {
  try {
    // Fetch all queries, newest first
    const [queries] = await db.query('SELECT * FROM queries ORDER BY created_at DESC');
    
    // Check for a success message in the URL (e.g., ?status=success)
    const successMessage = req.query.status === 'success' ? 'Your query has been submitted successfully!' : null;

    // We also need to fetch courses for the navbar dropdown to work
    // (You can copy this block from getHomePage if you want navbar to be dynamic everywhere)
    const [courseTypes] = await db.query('SELECT * FROM course_types');
    const sqlQuery = `
      SELECT c.id AS course_id, c.name AS course_name, s.id AS semester_id, s.semester_num
      FROM courses c LEFT JOIN semesters s ON c.id = s.course_id ORDER BY c.id, s.semester_num;
    `;
    const [rows] = await db.query(sqlQuery);
    const coursesMap = new Map();
    rows.forEach(row => {
      if (!row.course_id) return;
      if (!coursesMap.has(row.course_id)) { coursesMap.set(row.course_id, { id: row.course_id, name: row.course_name, semesters: [] }); }
      const course = coursesMap.get(row.course_id);
      if (row.semester_id && !course.semesters.find(s => s.id === row.semester_id)) {
        course.semesters.push({ id: row.semester_id, semester_num: row.semester_num, types: courseTypes });
      }
    });
    const courses = Array.from(coursesMap.values());

    res.render('queries', { 
      activePage: 'queries', 
      queries: queries, 
      successMessage: successMessage,
      courses: courses // for navbar
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error loading queries page');
  }
};

// 8. HANDLE QUERY SUBMISSION
exports.handleQuerySubmission = async (req, res) => {
  try {
    const { student_name, branch, year, question } = req.body;

    if (!student_name || !branch || !year || !question) {
      return res.status(400).send('All fields are required.');
    }

    await db.query(
      'INSERT INTO queries (student_name, branch, year, question) VALUES (?, ?, ?, ?)',
      [student_name, branch, year, question]
    );

    res.redirect('/queries?status=success');

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error submitting query');
  }
};
// ... (Keep getMaterialsByCategory as it is) ...
// 4. VIEW MATERIALS: Fetch by Semester + Type
exports.getMaterialsByCategory = async (req, res) => {
  try {
    const { semesterId, typeId } = req.params;
    const [materials] = await db.query(
      'SELECT * FROM materials WHERE semester_id = ? AND course_type_id = ?', 
      [semesterId, typeId]
    );
    res.render('materials', { materials });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};
exports.getMaterialsForCourse = async (req, res) => {
  const { courseNameId } = req.params;
  const [materials] = await db.query('SELECT * FROM materials WHERE course_name_id = ?', [courseNameId]);
  res.render('materials', { materials });
};
// controllers/courseController.js
// ... (at the end of the file, with your other exports)

// Renders the feedback page
exports.getFeedbackPage = (req, res) => {
  // This line renders the EJS file and makes the nav button active
  res.render('feedback', { activePage: 'feedback' });
};
// controllers/courseController.js

// ... at the end of the file

exports.getSubjectsAndMaterials = async (req, res) => {
  try {
    const { semesterId, courseTypeId } = req.params;

    // --- THIS QUERY HAS BEEN CORRECTED ---
    const sqlQuery = `
      SELECT
        cn.id AS subject_id,
        cn.name AS subject_name,
        m.filename AS material_filename,
        m.filename AS material_title, -- FIX: Use filename as the title
        s.semester_num,
        ct.name AS course_type_name
      FROM course_names cn
      LEFT JOIN materials m ON cn.id = m.course_name_id
      JOIN semesters s ON cn.semester_id = s.id
      JOIN course_types ct ON cn.course_type_id = ct.id
      WHERE cn.semester_id = ? AND cn.course_type_id = ?
      ORDER BY cn.name, m.filename; -- FIX: Order by filename
    `;
    const [rows] = await db.query(sqlQuery, [semesterId, courseTypeId]);

    if (rows.length === 0) {
      // It's better to render a page with a message than a 404 error.
      const [semesterInfo] = await db.query('SELECT semester_num FROM semesters WHERE id = ?', [semesterId]);
      const [courseTypeInfo] = await db.query('SELECT name FROM course_types WHERE id = ?', [courseTypeId]);
      
      const pageData = {
        semesterNum: semesterInfo[0]?.semester_num || 'Unknown',
        courseTypeName: courseTypeInfo[0]?.name || 'Unknown',
        subjects: []
      };
      return res.render('subjectsAndMaterials', { pageData, activePage: '' });
    }

    // Process the flat data into a nested structure for the template
    const subjectsMap = new Map();
    rows.forEach(row => {
      if (!subjectsMap.has(row.subject_id)) {
        subjectsMap.set(row.subject_id, {
          id: row.subject_id,
          name: row.subject_name,
          materials: []
        });
      }
      if (row.material_filename) {
        subjectsMap.get(row.subject_id).materials.push({
          filename: row.material_filename,
          title: row.material_title // This will now correctly use the filename
        });
      }
    });

    const pageData = {
      semesterNum: rows[0].semester_num,
      courseTypeName: rows[0].course_type_name,
      subjects: Array.from(subjectsMap.values())
    };

    res.render('subjectsAndMaterials', { pageData, activePage: '' });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};