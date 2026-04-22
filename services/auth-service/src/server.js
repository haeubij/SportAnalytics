const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const logger = require('./utils/logger');
const { register } = require('./utils/metrics');
const tracingMiddleware = require('./middleware/tracing');
const metricsMiddleware = require('./middleware/metricsMiddleware');

const app = express();

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(express.json());

app.use(tracingMiddleware);

app.use(metricsMiddleware);

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, { traceId: req.traceId, ip: req.ip });
  next();
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

app.use('/api/auth', require('./routes/auth'));

app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, { traceId: req.traceId });
  res.status(500).json({ message: 'Something went wrong!' });
});

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auth';

mongoose.connect(MONGODB_URI)
  .then(() => logger.info('Connected to MongoDB'))
  .catch(err => logger.error(`MongoDB connection error: ${err.message}`));

const PORT = process.env.PORT || 3002;

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Auth Service running on port ${PORT}`);
  });
}

module.exports = app;
