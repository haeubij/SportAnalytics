const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('passport');

dotenv.config();

const logger = require('./utils/logger');
const { register } = require('./utils/metrics');
const tracingMiddleware = require('./middleware/tracing');
const metricsMiddleware = require('./middleware/metricsMiddleware');
const { startConsumer } = require('./messaging/consumer');

const app = express();

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// Body parser
app.use(express.json());

// Session (required by passport; OAuth callback uses session: false,
// but passport.initialize() still needs it available)
app.use(session({
  secret: process.env.SESSION_SECRET || 'sport-analytics-session-secret',
  resave: false,
  saveUninitialized: false
}));

// Passport middleware
app.use(passport.initialize());

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

// Routes
app.use('/api/auth', require('./routes/auth'));

// Error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ message: 'Something went wrong!' });
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auth';

mongoose.connect(MONGODB_URI)
  .then(() => logger.info('Connected to MongoDB'))
  .catch(err => logger.error(`MongoDB connection error: ${err.message}`));

// Kafka consumer (non-blocking – service still starts if Kafka is unavailable)
startConsumer().catch(err =>
  logger.error(`Kafka consumer startup error: ${err.message}`)
);

const PORT = process.env.PORT || 3002;

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Auth Service running on port ${PORT}`);
  });
}

module.exports = app;
