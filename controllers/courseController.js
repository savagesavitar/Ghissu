// controllers/courseController.js
const db = require('../db'); // This connects to your db.js file

// The function to get the homepage (with debug checkpoints)
// controllers/courseController.js

// controllers/courseController.js

// controllers/courseController.js

// controllers/courseController.js

exports.getHomePage = async (req, res) => {
  try {
    const [courseTypes] = await db.query('SELECT * FROM course_types');

    const sqlQuery = `
      SELECT
        c.id AS course_id, c.name AS course_name,
        s.id AS semester_id, s.semester_num,
        cn.id AS course_name_id, cn.name AS subject_name, cn.course_type_id
      FROM courses c
      LEFT JOIN semesters s ON c.id = s.course_id
      LEFT JOIN course_names cn ON s.id = cn.semester_id
      ORDER BY c.id, s.semester_num, cn.id;
    `;
    const [rows] = await db.query(sqlQuery);

    const coursesMap = new Map();
    rows.forEach(row => {
      if (row.course_id && !coursesMap.has(row.course_id)) {
        coursesMap.set(row.course_id, {
          id: row.course_id,
          name: row.course_name,
          semesters: new Map()
        });
      }
      const course = coursesMap.get(row.course_id);

      if (course && row.semester_id && !course.semesters.has(row.semester_id)) {
        const semesterCourseTypes = JSON.parse(JSON.stringify(courseTypes)).map(ct => ({ ...ct, courseNames: [] }));
        course.semesters.set(row.semester_id, {
          id: row.semester_id,
          semester_num: row.semester_num,
          courseTypes: semesterCourseTypes
        });
      }
      const semester = course?.semesters.get(row.semester_id);
      
      if (semester && row.course_name_id) {
        const targetCourseType = semester.courseTypes.find(ct => ct.id === row.course_type_id);
        if (targetCourseType) {
          targetCourseType.courseNames.push({
            id: row.course_name_id,
            name: row.subject_name
          });
        }
      }
    });

    // Convert the final Map into an Array for the EJS template
    const courses = Array.from(coursesMap.values()).map(course => {
      course.semesters = Array.from(course.semesters.values());
      
      // THE PROBLEMATIC FILTERING LOGIC HAS BEEN REMOVED FROM THIS SECTION
      
      return course;
    });

    res.render('index', { courses, activePage: 'home' });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};
// Add the other functions needed by your routes
exports.getUploadPage = (req, res) => {
  res.render('upload');
};

exports.handleUpload = async (req, res) => {
  const { title } = req.body;
  const filename = req.file.filename;
  // This is simplified. You'll need to get the course_name_id from the form.
  const course_name_id = 1; // Placeholder
  await db.query('INSERT INTO materials (title, filename, course_name_id) VALUES (?, ?, ?)', [title, filename, course_name_id]);
  res.send('File uploaded!');
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