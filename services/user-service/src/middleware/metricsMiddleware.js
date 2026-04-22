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
