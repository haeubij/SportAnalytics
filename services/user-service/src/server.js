const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const logger = require('./utils/logger');
const { register } = require('./utils/metrics');
const tracingMiddleware = require('./middleware/tracing');
const metricsMiddleware = require('./middleware/metricsMiddleware');
const idempotencyMiddleware = require('./middleware/idempotency');
const { startConsumer } = require('./messaging/consumer');

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

app.use(idempotencyMiddleware);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service' });
});

app.use('/api/users', require('./routes/users'));

app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, { traceId: req.traceId });
  res.status(500).json({ message: 'Something went wrong!' });
});

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/users';

mongoose.connect(MONGODB_URI)
  .then(() => logger.info('Connected to MongoDB'))
  .catch(err => logger.error(`MongoDB connection error: ${err.message}`));

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
