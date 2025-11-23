// db.js
const mysql = require('mysql2/promise'); // <--- IMPORTANT: Using Promise version
require('dotenv').config();

const dbConfig = process.env.DATABASE_URL
    ? {
        // CLOUD SETTINGS (Render)
        uri: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }, // Required for secure cloud connection
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    }
    : {
        // LOCAL SETTINGS (Laptop)
        host: 'localhost',
        user: 'root',
        password: 'your_local_password', // Keep your local password here
        database: 'ghissu_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };

// Create the pool
const pool = process.env.DATABASE_URL 
    ? mysql.createPool(dbConfig.uri) 
    : mysql.createPool(dbConfig);

// Helper to check connection (Optional but good for debugging logs)
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