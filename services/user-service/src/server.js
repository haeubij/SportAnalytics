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
  res.json({ status: 'ok', service: 'user-service' });
});

// Routes
app.use('/api/users', require('./routes/users'));

// Error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ message: 'Something went wrong!' });
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/users';

mongoose.connect(MONGODB_URI)
  .then(() => logger.info('Connected to MongoDB'))
  .catch(err => logger.error(`MongoDB connection error: ${err.message}`));

// Kafka consumer (non-blocking – service still starts if Kafka is unavailable)
startConsumer().catch(err =>
  logger.error(`Kafka consumer startup error: ${err.message}`)
);

const PORT = process.env.PORT || 3001;

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`User Service running on port ${PORT}`);
  });
}

module.exports = app;
