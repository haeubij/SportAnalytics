// Admin middleware to protect admin-only routes
module.exports = function(req, res, next) {
  // Check if user has admin role
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  
  next();
}; 