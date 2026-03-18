const jwt = require('jsonwebtoken');

/**
 * @purpose JWT-Authentifizierungs-Middleware für den Auth Service
 * @description Liest das Token aus dem x-auth-token Header – identisch zum User Service,
 *              damit dasselbe Token in beiden Services funktioniert.
 */
module.exports = function(req, res, next) {
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded.user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(401).json({ message: 'Token is not valid' });
  }
};
