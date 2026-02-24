require('dotenv').config();
const { Pool } = require('pg');

/**
 * Shared PostgreSQL connection pool
 * Extracted from server.js to avoid circular dependency with route files
 */
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

module.exports = { pool };
