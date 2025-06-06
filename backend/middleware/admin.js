/**
 * @author Janis Häubi
 * @version 1.0.0
 * @date 14.05.2024 (KW20)
 * @purpose Admin-Middleware
 * @description Prüft, ob der aktuelle Nutzer Admin-Rechte hat.
 * @param req Express Request
 * @param res Express Response
 * @param next Callback für nächste Middleware
 */
// Admin middleware to protect admin-only routes
module.exports = function(req, res, next) {
  // Check if user has admin role
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  
  next();
}; 