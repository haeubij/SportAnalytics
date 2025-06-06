const jwt = require('jsonwebtoken');

/**
 * @author Manuel Affolter
 * @version 1.0.0
 * @date 07.05.2024 (KW19)
 * @purpose Authentifizierungs-Middleware
 * @description Prüft das JWT-Token im Header und setzt req.user bei Erfolg.
 * @param req Express Request
 * @param res Express Response
 * @param next Callback für nächste Middleware
 */
module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Add user from payload
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
}; 