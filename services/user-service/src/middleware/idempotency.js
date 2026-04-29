const mongoose = require('mongoose');

const idempotencyKeySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  statusCode: { type: Number, required: true },
  body: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now, expires: 86400 }
});

const IdempotencyKey = mongoose.model('IdempotencyKey', idempotencyKeySchema);

function idempotencyMiddleware(req, res, next) {
  const key = req.headers['x-idempotency-key'];

  if (!key) return next();

  IdempotencyKey.findOne({ key }).then(existing => {
    if (existing) {
      return res.status(existing.statusCode).json(existing.body);
    }

    const originalJson = res.json.bind(res);
    res.json = function(body) {
      if (res.statusCode < 500) {
        IdempotencyKey.create({ key, statusCode: res.statusCode, body }).catch(() => {});
      }
      return originalJson(body);
    };

    next();
  }).catch(() => next());
}

module.exports = idempotencyMiddleware;
