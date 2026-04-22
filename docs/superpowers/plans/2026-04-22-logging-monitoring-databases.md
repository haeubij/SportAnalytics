# Logging, Monitoring & Databases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Prometheus metrics, JSON-structured tracing logs, and a Grafana+Loki+Prometheus monitoring stack to all 3 microservices.

**Architecture:** Each service exposes `/metrics` (prom-client), writes JSON logs to Docker volumes. Promtail reads those volumes → Loki. Prometheus scrapes `/metrics`. Grafana visualizes both with 3 KPI panels + alert rules.

**Tech Stack:** `prom-client` (npm), Winston JSON format, Promtail 2.9, Loki 2.9, Prometheus 2.51, Grafana 10.4

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `services/user-service/package.json` | Modify | Add prom-client |
| `services/auth-service/package.json` | Modify | Add prom-client |
| `services/video-service/package.json` | Modify | Add prom-client |
| `services/user-service/src/utils/metrics.js` | Create | Prometheus registry + counters/histogram |
| `services/auth-service/src/utils/metrics.js` | Create | Prometheus registry + counters/histogram |
| `services/video-service/src/utils/metrics.js` | Create | Prometheus registry + counters/histogram |
| `services/user-service/src/utils/logger.js` | Modify | Switch to JSON format + service label |
| `services/auth-service/src/utils/logger.js` | Modify | Switch to JSON format + service label |
| `services/video-service/src/utils/logger.js` | Modify | Switch to JSON format + service label |
| `services/user-service/src/middleware/tracing.js` | Create | Correlation-ID per request |
| `services/auth-service/src/middleware/tracing.js` | Create | Correlation-ID per request |
| `services/video-service/src/middleware/tracing.js` | Create | Correlation-ID per request |
| `services/user-service/src/middleware/metricsMiddleware.js` | Create | Measure request count/errors/duration |
| `services/auth-service/src/middleware/metricsMiddleware.js` | Create | Measure request count/errors/duration |
| `services/video-service/src/middleware/metricsMiddleware.js` | Create | Measure request count/errors/duration |
| `services/user-service/src/server.js` | Modify | Wire tracing + metrics + /metrics route |
| `services/auth-service/src/server.js` | Modify | Wire tracing + metrics + /metrics route |
| `services/video-service/src/server.js` | Modify | Wire tracing + metrics + /metrics route |
| `services/user-service/tests/metrics.test.js` | Create | Tests for /metrics and tracing header |
| `services/auth-service/tests/metrics.test.js` | Create | Tests for /metrics and tracing header |
| `services/video-service/tests/metrics.test.js` | Create | Tests for /metrics and tracing header |
| `docker-compose.yml` | Modify | Add Loki/Promtail/Prometheus/Grafana + SERVICE_NAME envs |
| `monitoring/prometheus.yml` | Create | Scrape targets for all 3 services |
| `monitoring/loki-config.yml` | Create | Loki filesystem storage, 7d retention |
| `monitoring/promtail-config.yml` | Create | Read log volumes, push to Loki |
| `monitoring/grafana/datasources/prometheus.yml` | Create | Auto-provision Prometheus datasource |
| `monitoring/grafana/datasources/loki.yml` | Create | Auto-provision Loki datasource |
| `monitoring/grafana/dashboards/dashboard.yml` | Create | Dashboard provider config |
| `monitoring/grafana/dashboards/sport-analytics.json` | Create | 3 KPI panels |
| `monitoring/grafana/alerting/rules.yml` | Create | Alert rules: error rate + response time |

---

## Task 1: Add prom-client dependency to all 3 services

**Files:**
- Modify: `services/user-service/package.json`
- Modify: `services/auth-service/package.json`
- Modify: `services/video-service/package.json`

- [ ] **Step 1: Add prom-client to user-service**

```bash
cd services/user-service && npm install prom-client@15.1.3
```

Expected output: `added 1 package` (or similar), no errors.

- [ ] **Step 2: Add prom-client to auth-service**

```bash
cd ../../services/auth-service && npm install prom-client@15.1.3
```

- [ ] **Step 3: Add prom-client to video-service**

```bash
cd ../../services/video-service && npm install prom-client@15.1.3
```

- [ ] **Step 4: Commit**

```bash
git add services/user-service/package.json services/user-service/package-lock.json \
        services/auth-service/package.json services/auth-service/package-lock.json \
        services/video-service/package.json services/video-service/package-lock.json
git commit -m "chore: add prom-client dependency to all microservices"
```

---

## Task 2: Write failing tests for user-service (metrics & tracing)

**Files:**
- Create: `services/user-service/tests/metrics.test.js`

- [ ] **Step 1: Create the test file**

Create `services/user-service/tests/metrics.test.js`:

```javascript
/**
 * Metrics & Tracing Tests for user-service
 */

// ── Mock Kafka (same pattern as users.test.js) ────────────────────────────────
jest.mock('kafkajs', () => {
  const mockProducer = {
    connect: jest.fn().mockResolvedValue(),
    disconnect: jest.fn().mockResolvedValue(),
    send: jest.fn().mockResolvedValue()
  };
  const mockConsumer = {
    connect: jest.fn().mockResolvedValue(),
    disconnect: jest.fn().mockResolvedValue(),
    subscribe: jest.fn().mockResolvedValue(),
    run: jest.fn().mockResolvedValue()
  };
  return {
    Kafka: jest.fn().mockImplementation(() => ({
      producer: () => mockProducer,
      consumer: () => mockConsumer
    }))
  };
});

jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return { ...actual, connect: jest.fn().mockResolvedValue({}) };
});

process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-users';

const request = require('supertest');
const app = require('../src/server');

describe('GET /metrics', () => {
  it('returns 200 with prometheus text format', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toContain('http_requests_total');
    expect(res.text).toContain('http_request_duration_seconds');
  });
});

describe('Tracing middleware', () => {
  it('sets X-Trace-Id header on every response', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-trace-id']).toBeDefined();
    expect(res.headers['x-trace-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it('generates unique traceId per request', async () => {
    const [res1, res2] = await Promise.all([
      request(app).get('/health'),
      request(app).get('/health')
    ]);
    expect(res1.headers['x-trace-id']).not.toBe(res2.headers['x-trace-id']);
  });
});

describe('Error metrics', () => {
  it('tracks http_errors_total on 401 responses', async () => {
    await request(app).get('/api/users').expect(401);
    const res = await request(app).get('/metrics');
    expect(res.text).toContain('http_errors_total');
  });
});
```

- [ ] **Step 2: Run test — verify it FAILS**

```bash
cd services/user-service && npm test -- --testPathPattern=metrics
```

Expected: FAIL — `Cannot GET /metrics` or `x-trace-id is not defined`

---

## Task 3: Implement metrics + logger + tracing for user-service

**Files:**
- Create: `services/user-service/src/utils/metrics.js`
- Modify: `services/user-service/src/utils/logger.js`
- Create: `services/user-service/src/middleware/tracing.js`
- Create: `services/user-service/src/middleware/metricsMiddleware.js`

- [ ] **Step 1: Create `services/user-service/src/utils/metrics.js`**

```javascript
const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status', 'service'],
  registers: [register]
});

const httpErrorsTotal = new client.Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP error responses (4xx/5xx)',
  labelNames: ['method', 'route', 'status', 'service'],
  registers: [register]
});

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status', 'service'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register]
});

module.exports = { register, httpRequestsTotal, httpErrorsTotal, httpRequestDurationSeconds };
```

- [ ] **Step 2: Replace `services/user-service/src/utils/logger.js` with JSON format**

```javascript
const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/user-service.log'),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 3
    })
  ]
});

module.exports = logger;
```

- [ ] **Step 3: Create `services/user-service/src/middleware/tracing.js`**

```javascript
const { randomUUID } = require('crypto');

function tracingMiddleware(req, res, next) {
  req.traceId = randomUUID();
  res.setHeader('X-Trace-Id', req.traceId);
  next();
}

module.exports = tracingMiddleware;
```

- [ ] **Step 4: Create `services/user-service/src/middleware/metricsMiddleware.js`**

```javascript
const { httpRequestsTotal, httpErrorsTotal, httpRequestDurationSeconds } = require('../utils/metrics');

function metricsMiddleware(req, res, next) {
  if (req.path === '/metrics' || req.path === '/health') return next();

  const end = httpRequestDurationSeconds.startTimer();

  res.on('finish', () => {
    const labels = {
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status: res.statusCode,
      service: 'user-service'
    };
    httpRequestsTotal.inc(labels);
    if (res.statusCode >= 400) {
      httpErrorsTotal.inc(labels);
    }
    end(labels);
  });

  next();
}

module.exports = metricsMiddleware;
```

---

## Task 4: Wire middleware into user-service server.js — test — commit

**Files:**
- Modify: `services/user-service/src/server.js`

- [ ] **Step 1: Update server.js to add tracing, metrics middleware and /metrics route**

Replace the full content of `services/user-service/src/server.js`:

```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

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

// Tracing — adds req.traceId + X-Trace-Id header to every request
app.use(tracingMiddleware);

// Metrics — measures request count, errors, duration (excludes /metrics + /health)
app.use(metricsMiddleware);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, { traceId: req.traceId, ip: req.ip });
  next();
});

// Metrics endpoint — scraped by Prometheus, no auth required
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service' });
});

// Routes
app.use('/api/users', require('./routes/users'));

// Error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, { traceId: req.traceId });
  res.status(500).json({ message: 'Something went wrong!' });
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/users';

mongoose.connect(MONGODB_URI)
  .then(() => logger.info('Connected to MongoDB'))
  .catch(err => logger.error(`MongoDB connection error: ${err.message}`));

// Kafka consumer (non-blocking)
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
```

- [ ] **Step 2: Run ALL user-service tests — verify they PASS**

```bash
cd services/user-service && npm test
```

Expected: All tests PASS including the new metrics.test.js

- [ ] **Step 3: Commit**

```bash
git add services/user-service/src/utils/metrics.js \
        services/user-service/src/utils/logger.js \
        services/user-service/src/middleware/tracing.js \
        services/user-service/src/middleware/metricsMiddleware.js \
        services/user-service/src/server.js \
        services/user-service/tests/metrics.test.js
git commit -m "feat(user-service): add JSON logging, tracing middleware, Prometheus metrics"
```

---

## Task 5: Replicate to auth-service — test — commit

**Files:**
- Create: `services/auth-service/tests/metrics.test.js`
- Create: `services/auth-service/src/utils/metrics.js`
- Modify: `services/auth-service/src/utils/logger.js`
- Create: `services/auth-service/src/middleware/tracing.js`
- Create: `services/auth-service/src/middleware/metricsMiddleware.js`
- Modify: `services/auth-service/src/server.js`

- [ ] **Step 1: Create `services/auth-service/tests/metrics.test.js`**

```javascript
jest.mock('kafkajs', () => {
  const mockProducer = {
    connect: jest.fn().mockResolvedValue(),
    disconnect: jest.fn().mockResolvedValue(),
    send: jest.fn().mockResolvedValue()
  };
  const mockConsumer = {
    connect: jest.fn().mockResolvedValue(),
    disconnect: jest.fn().mockResolvedValue(),
    subscribe: jest.fn().mockResolvedValue(),
    run: jest.fn().mockResolvedValue()
  };
  return {
    Kafka: jest.fn().mockImplementation(() => ({
      producer: () => mockProducer,
      consumer: () => mockConsumer
    }))
  };
});

jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return { ...actual, connect: jest.fn().mockResolvedValue({}) };
});

process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-auth';

const request = require('supertest');
const app = require('../src/server');

describe('GET /metrics', () => {
  it('returns 200 with prometheus text format', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toContain('http_requests_total');
    expect(res.text).toContain('http_request_duration_seconds');
  });
});

describe('Tracing middleware', () => {
  it('sets X-Trace-Id header on every response', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-trace-id']).toBeDefined();
    expect(res.headers['x-trace-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it('generates unique traceId per request', async () => {
    const [res1, res2] = await Promise.all([
      request(app).get('/health'),
      request(app).get('/health')
    ]);
    expect(res1.headers['x-trace-id']).not.toBe(res2.headers['x-trace-id']);
  });
});
```

- [ ] **Step 2: Create `services/auth-service/src/utils/metrics.js`**

```javascript
const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status', 'service'],
  registers: [register]
});

const httpErrorsTotal = new client.Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP error responses (4xx/5xx)',
  labelNames: ['method', 'route', 'status', 'service'],
  registers: [register]
});

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status', 'service'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register]
});

module.exports = { register, httpRequestsTotal, httpErrorsTotal, httpRequestDurationSeconds };
```

- [ ] **Step 3: Replace `services/auth-service/src/utils/logger.js`**

```javascript
const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'auth-service' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/auth-service.log'),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 3
    })
  ]
});

module.exports = logger;
```

- [ ] **Step 4: Create `services/auth-service/src/middleware/tracing.js`**

```javascript
const { randomUUID } = require('crypto');

function tracingMiddleware(req, res, next) {
  req.traceId = randomUUID();
  res.setHeader('X-Trace-Id', req.traceId);
  next();
}

module.exports = tracingMiddleware;
```

- [ ] **Step 5: Create `services/auth-service/src/middleware/metricsMiddleware.js`**

```javascript
const { httpRequestsTotal, httpErrorsTotal, httpRequestDurationSeconds } = require('../utils/metrics');

function metricsMiddleware(req, res, next) {
  if (req.path === '/metrics' || req.path === '/health') return next();

  const end = httpRequestDurationSeconds.startTimer();

  res.on('finish', () => {
    const labels = {
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status: res.statusCode,
      service: 'auth-service'
    };
    httpRequestsTotal.inc(labels);
    if (res.statusCode >= 400) {
      httpErrorsTotal.inc(labels);
    }
    end(labels);
  });

  next();
}

module.exports = metricsMiddleware;
```

- [ ] **Step 6: Replace full `services/auth-service/src/server.js`**

```javascript
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

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// Body parser
app.use(express.json());

// Tracing — adds req.traceId + X-Trace-Id header to every request
app.use(tracingMiddleware);

// Metrics — measures request count, errors, duration (excludes /metrics + /health)
app.use(metricsMiddleware);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, { traceId: req.traceId, ip: req.ip });
  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));

// Error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, { traceId: req.traceId });
  res.status(500).json({ message: 'Something went wrong!' });
});

// MongoDB connection
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
```

- [ ] **Step 7: Run auth-service tests — verify PASS**

```bash
cd services/auth-service && npm test
```

Expected: All tests PASS

- [ ] **Step 8: Commit**

```bash
git add services/auth-service/
git commit -m "feat(auth-service): add JSON logging, tracing middleware, Prometheus metrics"
```

---

## Task 6: Replicate to video-service — test — commit

**Files:**
- Create: `services/video-service/tests/metrics.test.js`
- Create: `services/video-service/src/utils/metrics.js`
- Modify: `services/video-service/src/utils/logger.js`
- Create: `services/video-service/src/middleware/tracing.js`
- Create: `services/video-service/src/middleware/metricsMiddleware.js`
- Modify: `services/video-service/src/server.js`

- [ ] **Step 1: Create `services/video-service/tests/metrics.test.js`**

```javascript
jest.mock('kafkajs', () => {
  const mockProducer = {
    connect: jest.fn().mockResolvedValue(),
    disconnect: jest.fn().mockResolvedValue(),
    send: jest.fn().mockResolvedValue()
  };
  const mockConsumer = {
    connect: jest.fn().mockResolvedValue(),
    disconnect: jest.fn().mockResolvedValue(),
    subscribe: jest.fn().mockResolvedValue(),
    run: jest.fn().mockResolvedValue()
  };
  return {
    Kafka: jest.fn().mockImplementation(() => ({
      producer: () => mockProducer,
      consumer: () => mockConsumer
    }))
  };
});

jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return { ...actual, connect: jest.fn().mockResolvedValue({}) };
});

process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-videos';

const request = require('supertest');
const app = require('../src/server');

describe('GET /metrics', () => {
  it('returns 200 with prometheus text format', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toContain('http_requests_total');
    expect(res.text).toContain('http_request_duration_seconds');
  });
});

describe('Tracing middleware', () => {
  it('sets X-Trace-Id header on every response', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-trace-id']).toBeDefined();
    expect(res.headers['x-trace-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it('generates unique traceId per request', async () => {
    const [res1, res2] = await Promise.all([
      request(app).get('/health'),
      request(app).get('/health')
    ]);
    expect(res1.headers['x-trace-id']).not.toBe(res2.headers['x-trace-id']);
  });
});
```

- [ ] **Step 2: Create `services/video-service/src/utils/metrics.js`**

```javascript
const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status', 'service'],
  registers: [register]
});

const httpErrorsTotal = new client.Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP error responses (4xx/5xx)',
  labelNames: ['method', 'route', 'status', 'service'],
  registers: [register]
});

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status', 'service'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register]
});

module.exports = { register, httpRequestsTotal, httpErrorsTotal, httpRequestDurationSeconds };
```

- [ ] **Step 3: Replace `services/video-service/src/utils/logger.js`**

```javascript
const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'video-service' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/video-service.log'),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 3
    })
  ]
});

module.exports = logger;
```

- [ ] **Step 4: Create `services/video-service/src/middleware/tracing.js`**

```javascript
const { randomUUID } = require('crypto');

function tracingMiddleware(req, res, next) {
  req.traceId = randomUUID();
  res.setHeader('X-Trace-Id', req.traceId);
  next();
}

module.exports = tracingMiddleware;
```

- [ ] **Step 5: Create `services/video-service/src/middleware/metricsMiddleware.js`**

```javascript
const { httpRequestsTotal, httpErrorsTotal, httpRequestDurationSeconds } = require('../utils/metrics');

function metricsMiddleware(req, res, next) {
  if (req.path === '/metrics' || req.path === '/health') return next();

  const end = httpRequestDurationSeconds.startTimer();

  res.on('finish', () => {
    const labels = {
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status: res.statusCode,
      service: 'video-service'
    };
    httpRequestsTotal.inc(labels);
    if (res.statusCode >= 400) {
      httpErrorsTotal.inc(labels);
    }
    end(labels);
  });

  next();
}

module.exports = metricsMiddleware;
```

- [ ] **Step 6: Replace full `services/video-service/src/server.js`**

```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

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

// Tracing — adds req.traceId + X-Trace-Id header to every request
app.use(tracingMiddleware);

// Metrics — measures request count, errors, duration (excludes /metrics + /health)
app.use(metricsMiddleware);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, { traceId: req.traceId, ip: req.ip });
  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
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
  logger.error(`Unhandled error: ${err.message}`, { traceId: req.traceId });
  res.status(500).json({ message: 'Something went wrong!' });
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/videos';

mongoose.connect(MONGODB_URI)
  .then(() => logger.info('Connected to MongoDB'))
  .catch(err => logger.error(`MongoDB connection error: ${err.message}`));

// Kafka consumer (non-blocking)
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
```

- [ ] **Step 7: Run video-service tests — verify PASS**

```bash
cd services/video-service && npm test
```

Expected: All tests PASS

- [ ] **Step 8: Commit**

```bash
git add services/video-service/
git commit -m "feat(video-service): add JSON logging, tracing middleware, Prometheus metrics"
```

---

## Task 7: Create monitoring/ infrastructure config files

**Files:**
- Create: `monitoring/prometheus.yml`
- Create: `monitoring/loki-config.yml`
- Create: `monitoring/promtail-config.yml`

- [ ] **Step 1: Create `monitoring/prometheus.yml`**

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: sport-analytics
    static_configs:
      - targets:
          - user-service:3001
          - auth-service:3002
          - video-service:3003
    metrics_path: /metrics
```

- [ ] **Step 2: Create `monitoring/loki-config.yml`**

```yaml
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
    final_sleep: 0s
  chunk_idle_period: 5m
  chunk_retain_period: 30s

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

storage_config:
  boltdb_shipper:
    active_index_directory: /loki/boltdb-shipper-active
    cache_location: /loki/boltdb-shipper-cache
    shared_store: filesystem
  filesystem:
    directory: /loki/chunks

limits_config:
  retention_period: 168h

chunk_store_config:
  max_look_back_period: 168h

table_manager:
  retention_deletes_enabled: true
  retention_period: 168h
```

- [ ] **Step 3: Create `monitoring/promtail-config.yml`**

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: user-service
    static_configs:
      - targets:
          - localhost
        labels:
          service: user-service
          job: sport-analytics
          __path__: /var/log/user-service/*.log
    pipeline_stages:
      - json:
          expressions:
            level: level
            traceId: traceId
      - labels:
          level:
          traceId:

  - job_name: auth-service
    static_configs:
      - targets:
          - localhost
        labels:
          service: auth-service
          job: sport-analytics
          __path__: /var/log/auth-service/*.log
    pipeline_stages:
      - json:
          expressions:
            level: level
            traceId: traceId
      - labels:
          level:
          traceId:

  - job_name: video-service
    static_configs:
      - targets:
          - localhost
        labels:
          service: video-service
          job: sport-analytics
          __path__: /var/log/video-service/*.log
    pipeline_stages:
      - json:
          expressions:
            level: level
            traceId: traceId
      - labels:
          level:
          traceId:
```

- [ ] **Step 4: Commit**

```bash
git add monitoring/
git commit -m "feat(monitoring): add Prometheus, Loki, Promtail config files"
```

---

## Task 8: Create Grafana provisioning files

**Files:**
- Create: `monitoring/grafana/datasources/prometheus.yml`
- Create: `monitoring/grafana/datasources/loki.yml`
- Create: `monitoring/grafana/dashboards/dashboard.yml`
- Create: `monitoring/grafana/dashboards/sport-analytics.json`
- Create: `monitoring/grafana/alerting/rules.yml`

- [ ] **Step 1: Create `monitoring/grafana/datasources/prometheus.yml`**

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    uid: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
```

- [ ] **Step 2: Create `monitoring/grafana/datasources/loki.yml`**

```yaml
apiVersion: 1

datasources:
  - name: Loki
    type: loki
    uid: loki
    access: proxy
    url: http://loki:3100
    isDefault: false
    editable: false
```

- [ ] **Step 3: Create `monitoring/grafana/dashboards/dashboard.yml`**

```yaml
apiVersion: 1

providers:
  - name: sport-analytics
    orgId: 1
    folder: SportAnalytics
    type: file
    disableDeletion: false
    editable: true
    options:
      path: /etc/grafana/provisioning/dashboards
```

- [ ] **Step 4: Create `monitoring/grafana/dashboards/sport-analytics.json`**

```json
{
  "annotations": { "list": [] },
  "editable": true,
  "fiscalYearStartMonth": 0,
  "graphTooltip": 0,
  "id": null,
  "links": [],
  "panels": [
    {
      "datasource": { "type": "prometheus", "uid": "prometheus" },
      "fieldConfig": {
        "defaults": {
          "color": { "mode": "palette-classic" },
          "custom": { "lineWidth": 2 }
        },
        "overrides": []
      },
      "gridPos": { "h": 8, "w": 8, "x": 0, "y": 0 },
      "id": 1,
      "options": {
        "legend": { "calcs": [], "displayMode": "list", "placement": "bottom" },
        "tooltip": { "mode": "single" }
      },
      "targets": [
        {
          "datasource": { "type": "prometheus", "uid": "prometheus" },
          "expr": "sum(rate(http_requests_total[5m])) by (service)",
          "legendFormat": "{{service}}",
          "refId": "A"
        }
      ],
      "title": "KPI 1 — Request Rate (req/s)",
      "type": "timeseries"
    },
    {
      "datasource": { "type": "prometheus", "uid": "prometheus" },
      "fieldConfig": {
        "defaults": {
          "color": { "mode": "palette-classic" },
          "custom": { "lineWidth": 2 },
          "unit": "percent",
          "thresholds": {
            "mode": "absolute",
            "steps": [
              { "color": "green", "value": null },
              { "color": "red", "value": 10 }
            ]
          }
        },
        "overrides": []
      },
      "gridPos": { "h": 8, "w": 8, "x": 8, "y": 0 },
      "id": 2,
      "options": {
        "legend": { "calcs": [], "displayMode": "list", "placement": "bottom" },
        "tooltip": { "mode": "single" }
      },
      "targets": [
        {
          "datasource": { "type": "prometheus", "uid": "prometheus" },
          "expr": "sum(rate(http_errors_total[5m])) by (service) / sum(rate(http_requests_total[5m])) by (service) * 100",
          "legendFormat": "{{service}}",
          "refId": "A"
        }
      ],
      "title": "KPI 2 — Error Rate % (Alert: >10%)",
      "type": "timeseries"
    },
    {
      "datasource": { "type": "prometheus", "uid": "prometheus" },
      "fieldConfig": {
        "defaults": {
          "color": { "mode": "palette-classic" },
          "custom": { "lineWidth": 2 },
          "unit": "s",
          "thresholds": {
            "mode": "absolute",
            "steps": [
              { "color": "green", "value": null },
              { "color": "red", "value": 0.5 }
            ]
          }
        },
        "overrides": []
      },
      "gridPos": { "h": 8, "w": 8, "x": 16, "y": 0 },
      "id": 3,
      "options": {
        "legend": { "calcs": [], "displayMode": "list", "placement": "bottom" },
        "tooltip": { "mode": "single" }
      },
      "targets": [
        {
          "datasource": { "type": "prometheus", "uid": "prometheus" },
          "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))",
          "legendFormat": "{{service}}",
          "refId": "A"
        }
      ],
      "title": "KPI 3 — Response Time p95 (Alert: >500ms)",
      "type": "timeseries"
    }
  ],
  "schemaVersion": 38,
  "tags": ["sport-analytics"],
  "templating": { "list": [] },
  "time": { "from": "now-1h", "to": "now" },
  "timepicker": {},
  "timezone": "browser",
  "title": "SportAnalytics — Service Monitoring",
  "uid": "sport-analytics-main",
  "version": 1
}
```

- [ ] **Step 5: Create `monitoring/grafana/alerting/rules.yml`**

```yaml
apiVersion: 1

groups:
  - orgId: 1
    name: sport-analytics-alerts
    folder: SportAnalytics
    interval: 1m
    rules:
      - uid: high-error-rate
        title: High Error Rate (>10%)
        condition: C
        data:
          - refId: A
            relativeTimeRange:
              from: 300
              to: 0
            datasourceUid: prometheus
            model:
              expr: "sum(rate(http_errors_total[5m])) / sum(rate(http_requests_total[5m])) * 100"
              instant: true
              refId: A
          - refId: C
            relativeTimeRange:
              from: 0
              to: 0
            datasourceUid: "-100"
            model:
              conditions:
                - evaluator:
                    params: [10]
                    type: gt
                  operator:
                    type: and
                  query:
                    params: [C]
                  reducer:
                    type: last
                  type: query
              datasource:
                type: __expr__
                uid: "-100"
              expression: A
              refId: C
              type: threshold
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Error rate above 10% across all services"

      - uid: high-response-time
        title: High Response Time p95 (>500ms)
        condition: C
        data:
          - refId: A
            relativeTimeRange:
              from: 300
              to: 0
            datasourceUid: prometheus
            model:
              expr: "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))"
              instant: true
              refId: A
          - refId: C
            relativeTimeRange:
              from: 0
              to: 0
            datasourceUid: "-100"
            model:
              conditions:
                - evaluator:
                    params: [0.5]
                    type: gt
                  operator:
                    type: and
                  query:
                    params: [C]
                  reducer:
                    type: last
                  type: query
              datasource:
                type: __expr__
                uid: "-100"
              expression: A
              refId: C
              type: threshold
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "95th percentile response time above 500ms"
```

- [ ] **Step 6: Commit**

```bash
git add monitoring/grafana/
git commit -m "feat(grafana): add provisioned datasources, dashboard, and alert rules"
```

---

## Task 9: Update docker-compose.yml with monitoring stack

**Files:**
- Modify: `docker-compose.yml`

- [ ] **Step 1: Add `SERVICE_NAME` env var to each existing service**

In `docker-compose.yml`, add to the `environment:` section of each service:

For `user-service`:
```yaml
- SERVICE_NAME=user-service
```

For `auth-service`:
```yaml
- SERVICE_NAME=auth-service
```

For `video-service`:
```yaml
- SERVICE_NAME=video-service
```

- [ ] **Step 2: Append monitoring services to docker-compose.yml**

Add these services after the `mongo-videos` block (before the `volumes:` section):

```yaml
  # ─── Loki (Log Aggregation) ───────────────────────────────────────────────────
  loki:
    image: grafana/loki:2.9.0
    container_name: loki
    ports:
      - "3100:3100"
    volumes:
      - ./monitoring/loki-config.yml:/etc/loki/local-config.yaml
      - loki-data:/loki
    command: -config.file=/etc/loki/local-config.yaml
    restart: unless-stopped

  # ─── Promtail (Log Collector) ─────────────────────────────────────────────────
  promtail:
    image: grafana/promtail:2.9.0
    container_name: promtail
    volumes:
      - ./monitoring/promtail-config.yml:/etc/promtail/config.yml
      - user-service-logs:/var/log/user-service:ro
      - auth-service-logs:/var/log/auth-service:ro
      - video-service-logs:/var/log/video-service:ro
    command: -config.file=/etc/promtail/config.yml
    depends_on:
      - loki
    restart: unless-stopped

  # ─── Prometheus (Metrics Scraper) ─────────────────────────────────────────────
  prometheus:
    image: prom/prometheus:v2.51.0
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    restart: unless-stopped

  # ─── Grafana (Dashboards + Alerting) ─────────────────────────────────────────
  grafana:
    image: grafana/grafana:10.4.0
    container_name: grafana
    ports:
      - "3030:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_ALERTING_ENABLED=true
      - GF_UNIFIED_ALERTING_ENABLED=true
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/alerting:/etc/grafana/provisioning/alerting
    depends_on:
      - loki
      - prometheus
    restart: unless-stopped
```

- [ ] **Step 3: Add new volumes to the `volumes:` section**

```yaml
  loki-data:
  prometheus-data:
  grafana-data:
```

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml
git commit -m "feat(docker): add Loki, Promtail, Prometheus, Grafana to docker-compose"
```

---

## Task 10: Smoke test — verify full stack

- [ ] **Step 1: Start the full stack**

```bash
docker compose up --build -d
```

Wait ~30 seconds for all services to initialize.

- [ ] **Step 2: Verify all services are healthy**

```bash
docker compose ps
```

Expected: All containers show `Up` status (no `Exit` or `Restarting`)

- [ ] **Step 3: Verify /metrics endpoints**

```bash
curl http://localhost:3001/metrics | grep http_requests_total
curl http://localhost:3002/metrics | grep http_requests_total
curl http://localhost:3003/metrics | grep http_requests_total
```

Expected: Each returns Prometheus text with `http_requests_total`

- [ ] **Step 4: Verify tracing header**

```bash
curl -v http://localhost:3001/health 2>&1 | grep X-Trace-Id
```

Expected: `X-Trace-Id: <uuid>`

- [ ] **Step 5: Verify Grafana is accessible**

Open `http://localhost:3030` in browser.
Login: `admin` / `admin`
Navigate to: **Dashboards → SportAnalytics → SportAnalytics — Service Monitoring**
Expected: Dashboard loads with 3 panels (data may be sparse initially)

- [ ] **Step 6: Verify Prometheus scraping**

Open `http://localhost:9090/targets` in browser.
Expected: All 3 targets (user-service, auth-service, video-service) show `UP`

- [ ] **Step 7: Verify Loki receiving logs**

In Grafana → Explore → select Loki datasource → run query:
```
{job="sport-analytics"}
```
Expected: JSON log entries with `service`, `level`, `traceId` fields visible

- [ ] **Step 8: Verify alert rules loaded**

In Grafana → Alerting → Alert rules
Expected: `High Error Rate (>10%)` and `High Response Time p95 (>500ms)` rules visible

- [ ] **Step 9: Final commit**

```bash
git add .
git commit -m "feat: complete logging/monitoring stack — Grafana+Loki+Prometheus operational"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Standard-Logs in Textfile → Winston File transport writes JSON to `/app/logs/*.log`
- ✅ Tracing → `tracing.js` middleware adds UUID `traceId` to every request + response header
- ✅ Logs für zentralen Dienst interpretierbar → JSON format, Promtail extracts `level`+`traceId` as Loki labels
- ✅ Dienst ist konfiguriert → Grafana, Loki, Prometheus, Promtail in docker-compose with auto-provisioning
- ✅ 3 KPIs → Request Rate, Error Rate (alert >10%), Response Time p95 (alert >500ms) in Grafana dashboard
- ✅ Service1 DB-Änderung (user-service) → PUT/DELETE routes already implemented, no changes needed
- ✅ Service2 DB-Änderung (video-service) → POST/DELETE routes already implemented, no changes needed

**No placeholders found.**

**Type consistency:** `register`, `httpRequestsTotal`, `httpErrorsTotal`, `httpRequestDurationSeconds` used consistently across all tasks. `tracingMiddleware` and `metricsMiddleware` names consistent between task 3/4, 5, and 6.
