/**
 * Role-Based Access Control Middleware
 * Restricts route access to specific user roles
 * @param  {...string} roles - Allowed roles (e.g. 'admin', 'staff')
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before verifying role permissions',
        errors: [{ message: 'User not authenticated' }],
      });
    }

    const normalizedAllowedRoles = roles.map((r) => r.toLowerCase());
    const userRole = (req.user.role || '').toLowerCase();

    if (!normalizedAllowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user.role}' is not authorized to perform this action`,
        errors: [
          {
            message: `This action requires one of the following roles: [${roles.join(', ')}]`,
          },
        ],
      });
    }

    next();
  };
};

module.exports = {
  authorizeRoles,
};
