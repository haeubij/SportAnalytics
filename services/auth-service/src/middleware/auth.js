const jwt = require('jsonwebtoken');

/**
 * @purpose JWT-Authentifizierungs-Middleware für den Auth Service
 * @description Validiert das JWT-Token aus dem Authorization Bearer Header
 *              oder dem x-auth-token Header.
 *              Unterstützt OIDC-konforme JWT-Struktur (iss, sub, aud, user).
 */
module.exports = function(req, res, next) {
  // Support both Bearer token (OIDC standard) and x-auth-token (legacy)
  let token = req.header('x-auth-token');

  const authHeader = req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    // Support both OIDC-style (decoded.user) and legacy (decoded directly)
    req.user = decoded.user || { id: decoded.sub, role: decoded.role };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
