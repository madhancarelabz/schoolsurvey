require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { createClient } = require('redis');
const { pool } = require('./db'); // Use shared pool from db.js (avoids circular dependency)

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Redis Client
const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Routes
const otpRoutes = require('./routes/otp');
const sessionRoutes = require('./routes/session');
const voiceRoutes = require('./routes/voice');

app.use('/api/otp', otpRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/voice', voiceRoutes);

// Health Check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// Start Server
async function startServer() {
  try {
    // 1. Check Database (Fail fast if unreachable)
    console.log('Testing database connection...');
    await pool.query('SELECT 1');
    console.log('PostgreSQL connected.');

    // 2. Connect Redis
    console.log('Connecting to Redis...');
    await redisClient.connect();
    console.log('Redis connected.');

    // 3. Start Listening
    app.listen(port, () => {
      console.log(`Voice Gateway listening on port ${port}`);
    });
  } catch (err) {
    console.error('CRITICAL: Failed to start server:', err);
    process.exit(1);
  }
}

// Global error handlers for debugging
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
  process.exit(1);
});

startServer();

module.exports = { redisClient };
