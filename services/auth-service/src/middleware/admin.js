/**
 * @purpose Admin-Middleware für den Auth Service
 */
module.exports = function(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};
