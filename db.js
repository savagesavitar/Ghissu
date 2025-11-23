// db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// DEBUGGING LOGS (Check your Render Logs for these!)
console.log("------------------------------------------------");
console.log("Checking Database Configuration...");
if (process.env.DATABASE_URL) {
    console.log("✅ DATABASE_URL FOUND: ", process.env.DATABASE_URL.substring(0, 20) + "..."); // Hides password
    console.log("🚀 Switching to CLOUD mode.");
} else {
    console.log("❌ DATABASE_URL IS MISSING OR UNDEFINED.");
    console.log("⚠️ Falling back to LOCALHOST mode (This will fail on Render).");
}
console.log("------------------------------------------------");

const dbConfig = process.env.DATABASE_URL
    ? {
        // CLOUD SETTINGS
        uri: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    }
    : {
        // LOCAL SETTINGS
        host: 'localhost',
        user: 'root',
        password: 'your_local_password',
        database: 'ghissu_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };

// Create the pool
const pool = process.env.DATABASE_URL 
    ? mysql.createPool(dbConfig.uri) 
    : mysql.createPool(dbConfig);

// Helper to check connection
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Connected to Database successfully!');
        connection.release();
    } catch (err) {
        console.error('❌ Database Connection Failed:', err.message);
    }
})();

module.exports = pool;