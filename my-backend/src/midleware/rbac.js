// src/middleware/rbac.js
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.userRole) {
      return res.status(401).json({ error: 'Unauthorized: Missing user authentication context.' });
    }

    const hasRole = allowedRoles.includes(req.userRole);
    if (!hasRole) {
      return res.status(403).json({
        error: 'Forbidden: You do not have permission to access this resource.',
        requiredRoles: allowedRoles,
        yourRole: req.userRole
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };