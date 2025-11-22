const mysql = require('mysql2'); // Use standard mysql2 (or mysql2/promise)
const util = require('util');
require('dotenv').config();

// 1. Setup Connection Config
const dbConfig = process.env.DATABASE_URL
    ? {
        // If running on Render (Cloud)
        uri: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false // REQUIRED for Aiven/Render Cloud DBs
        },
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    }
    : {
        // If running on Localhost (Laptop)
        host: 'localhost',
        user: 'root',
        password: 'your_local_password', // Keep your local password here
        database: 'ghissu_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };

// 2. Create the Pool
const pool = process.env.DATABASE_URL
    ? mysql.createPool(dbConfig.uri) // Cloud uses URI string
    : mysql.createPool(dbConfig);    // Local uses object params

// 3. Enable Async/Await (Promisify)
pool.query = util.promisify(pool.query).bind(pool);

// 4. Test Connection (Optional debug log)
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database Connection Failed:', err.code);
        console.error('   Make sure DATABASE_URL is set in Render Environment Variables.');
    } else {
        console.log('✅ Connected to Database successfully!');
        connection.release();
    }
});

module.exports = pool;