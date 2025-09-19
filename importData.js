// importData.js

const fs = require('fs');
const csv = require('csv-parser');
const db = require('./db'); // Your existing database connection

// --- CONFIGURATION ---
// Set the name of the main course you are adding these subjects to.
const courseName = 'Earth Science';
// --------------------

const results = [];

// This function will run the entire import process
async function importData() {
  console.log('Starting data import...');

  // First, read all rows from the CSV file into memory
  await new Promise((resolve, reject) => {
    fs.createReadStream('Course_Structure.csv')
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Finished reading CSV file. Found ${results.length} rows to process.`);

  try {
    // Get the ID for the main course (e.g., "Earth Science")
    // It finds an existing one or creates a new one.
    const courseId = await findOrCreate('courses', { name: courseName });
    
    // Process each row from the CSV file one by one
    for (const row of results) {
      // Skip empty rows in the CSV
      if (!row['Course Code']) {
        continue;
      }
      
      // 1. Handle Semester
      const semesterNum = parseInt(row['Semester'].replace('Semester ', ''), 10);
      const semesterData = { semester_num: semesterNum, course_id: courseId };
      const semesterId = await findOrCreate('semesters', semesterData);

      // 2. Handle Course Type (e.g., "Core", "BSC")
      const courseTypeData = { name: row['Subject Area'] };
      const courseTypeId = await findOrCreate('course_types', courseTypeData);

      // 3. Handle Course Name (the actual subject)
      const courseNameData = {
        name: row['Course Name'],
        semester_id: semesterId,
        course_type_id: courseTypeId
      };
      await findOrCreate('course_names', courseNameData);
      
      console.log(`Processed: ${row['Course Name']}`);
    }

    console.log('✅ Data import completed successfully!');

  } catch (error) {
    console.error('❌ An error occurred during the import:', error);
  } finally {
    // Close the database connection pool
    db.end();
  }
}

/**
 * A helper function to find a record in a table. If it doesn't exist, it creates it.
 * This prevents creating duplicate entries if you run the script multiple times.
 * @param {string} table - The name of the database table (e.g., 'semesters').
 * @param {object} data - An object of column names and values to find or insert (e.g., { name: 'Core' }).
 * @returns {Promise<number>} The ID of the found or newly created record.
 */
async function findOrCreate(table, data) {
  // Create the parts of the SQL query
  const columns = Object.keys(data);
  const values = Object.values(data);
  const whereClause = columns.map(col => `${col} = ?`).join(' AND ');

  // Try to find the record first
  let [rows] = await db.query(`SELECT id FROM ${table} WHERE ${whereClause}`, values);

  if (rows.length > 0) {
    // Record was found, return its ID
    return rows[0].id;
  } else {
    // Record was not found, so we insert it
    const [result] = await db.query(`INSERT INTO ${table} SET ?`, data);
    // Return the ID of the new record
    return result.insertId;
  }
}

// Run the main function
importData();