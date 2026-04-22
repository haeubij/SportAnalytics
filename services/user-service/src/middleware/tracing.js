const { randomUUID } = require('crypto');

function tracingMiddleware(req, res, next) {
  req.traceId = randomUUID();
  res.setHeader('X-Trace-Id', req.traceId);
  next();
}

module.exports = tracingMiddleware;
