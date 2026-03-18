const jwt = require('jsonwebtoken');

/**
 * @purpose JWT-Authentifizierungs-Middleware für den Video Service
 * @description Identisch zum User Service – liest x-auth-token Header.
 *              req.user.id und req.user.role kommen aus dem JWT-Payload.
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
