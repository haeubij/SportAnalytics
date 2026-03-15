/**
 * @purpose Admin-Middleware für den User Service
 * @description Prüft, ob der authentifizierte Nutzer Admin-Rechte hat.
 */
module.exports = function(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};
