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
  await redisClient.connect();
  app.listen(port, () => {
    console.log(`Voice Gateway listening on port ${port}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = { redisClient };
