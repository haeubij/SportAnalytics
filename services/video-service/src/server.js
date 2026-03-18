const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const logger = require('./utils/logger');
const { startConsumer } = require('./messaging/consumer');

const app = express();

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// Body parser
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'video-service' });
});

// Routes
app.use('/api/videos', require('./routes/videos'));

// Error handler
app.use((err, req, res, next) => {
  if (err.message === 'Only video files are allowed') {
    return res.status(400).json({ message: err.message });
  }
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ message: 'Something went wrong!' });
});

// MongoDB connection – GridFS needs the connection to be ready before uploads
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/videos';

mongoose.connect(MONGODB_URI)
  .then(() => logger.info('Connected to MongoDB'))
  .catch(err => logger.error(`MongoDB connection error: ${err.message}`));

// Kafka consumer (non-blocking – listens for user.deleted events)
startConsumer().catch(err =>
  logger.error(`Kafka consumer startup error: ${err.message}`)
);

const PORT = process.env.PORT || 3003;

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Video Service running on port ${PORT}`);
  });
}

module.exports = app;
