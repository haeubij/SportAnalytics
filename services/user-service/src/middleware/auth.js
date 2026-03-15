const jwt = require('jsonwebtoken');

/**
 * @purpose JWT-Authentifizierungs-Middleware für den User Service
 * @description Validiert das JWT-Token aus dem x-auth-token Header.
 *              Stellt keine Tokens aus – das ist Aufgabe des Auth Service.
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
    res.status(401).json({ message: 'Token is not valid' });
  }
};
