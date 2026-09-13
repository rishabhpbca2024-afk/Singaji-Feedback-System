/**
 * roleMiddleware
 * Middleware to restrict route access based on user role.
 * TODO: Implement when authentication middleware is ready.
 *
 * Usage: authorizeRoles('admin', 'faculty')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // TODO: check req.user.role against allowedRoles
    // if (!req.user || !allowedRoles.includes(req.user.role)) {
    //   return res.status(403).json({ message: 'Access denied – insufficient permissions' });
    // }
    // next();

    res.status(501).json({ message: 'authorizeRoles middleware – not yet implemented' });
  };
};

module.exports = { authorizeRoles };
