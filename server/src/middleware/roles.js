/**
 * Role-Based Access Control Middleware
 * @param {string|string[]} allowedRoles
 */
export function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Access denied. Requires one of roles: ${roles.join(', ')}`
      });
    }

    next();
  };
}

export const isSuperAdmin = requireRole(['SUPERADMIN']);
export const isAdmin = requireRole(['SUPERADMIN', 'ADMIN']);
export const isExecutive = requireRole(['SUPERADMIN', 'ADMIN', 'EXECUTIVE']);

export default { requireRole, isSuperAdmin, isAdmin, isExecutive };
