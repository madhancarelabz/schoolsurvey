require('dotenv').config();
const { Pool } = require('pg');

/**
 * Shared PostgreSQL connection pool
 * Extracted from server.js to avoid circular dependency with route files
 */
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Prevent unhandled crashes on idle clients
pool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err);
});

module.exports = { pool };
