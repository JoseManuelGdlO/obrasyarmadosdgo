/**
 * Autorización por rol (RBAC). Debe usarse después de `auth`.
 * @param {...string} allowedRoles - Valores permitidos de `req.user.rol`.
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    const role = req.user?.rol;
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({
        message: "No tiene permisos para esta operación.",
      });
    }
    return next();
  };
};

module.exports = { requireRole };
