const MaquinaPlanServicio = require("../models/MaquinaPlanServicio");
const RolePermission = require("../models/RolePermission");
const UsuarioMaquina = require("../models/UsuarioMaquina");
const P = require("../constants/permissions");

const loadRolePermissions = async (req, res, next) => {
  try {
    const rows = await RolePermission.findAll({
      where: { rol: req.user.rol },
      attributes: ["permission"],
    });
    req.permissions = new Set(rows.map((r) => r.permission));
    return next();
  } catch (error) {
    return res.status(500).json({
      message: "Error al cargar permisos.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (req.user?.rol === "admin") {
      return next();
    }
    if (!req.permissions || !req.permissions.has(permission)) {
      return res.status(403).json({
        message: "No tiene permisos para esta operación.",
      });
    }
    return next();
  };
};

const requireAnyPermission =
  (...permissions) =>
  (req, res, next) => {
    if (req.user?.rol === "admin") {
      return next();
    }
    if (!req.permissions) {
      return res.status(403).json({ message: "No tiene permisos para esta operación." });
    }
    const ok = permissions.some((p) => req.permissions.has(p));
    if (!ok) {
      return res.status(403).json({
        message: "No tiene permisos para esta operación.",
      });
    }
    return next();
  };

const hasMaquinasViewGlobal = (req) =>
  req.permissions && (req.permissions.has(P.MAQUINAS_VIEW) || req.permissions.has(P.MAQUINAS_EDIT));

const resolveMaquinaIdFromRequest = async (req) => {
  if (req.params.maquinaId) {
    return req.params.maquinaId;
  }
  if (req.params.planId) {
    const plan = await MaquinaPlanServicio.findByPk(req.params.planId, {
      attributes: ["maquinaId"],
    });
    return plan ? plan.maquinaId : null;
  }
  return null;
};

/**
 * Si no tiene acceso global de lectura/edición en máquinas, exige asignación en usuario_maquinas.
 */
const requireMaquinaAssignment = async (req, res, next) => {
  try {
    if (hasMaquinasViewGlobal(req)) {
      return next();
    }
    const maquinaId = await resolveMaquinaIdFromRequest(req);
    if (!maquinaId) {
      return res.status(400).json({ message: "No se pudo determinar la máquina." });
    }
    const link = await UsuarioMaquina.findOne({
      where: { userId: req.user.id, maquinaId },
    });
    if (!link) {
      return res.status(403).json({
        message: "No tiene acceso a esta máquina.",
      });
    }
    return next();
  } catch (error) {
    return res.status(500).json({
      message: "Error al verificar acceso a la máquina.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Lectura: crud global o permiso de lectura/actualización asignada + asignación.
 */
const requireMaquinaReadAccess = requireAnyPermission(
  P.MAQUINAS_VIEW,
  P.MAQUINAS_EDIT,
  P.MAQUINAS_READ_ASSIGNED,
  P.MAQUINAS_UPDATE_ASSIGNED
);

/**
 * Escritura en recurso de máquina: crud o update_assigned + asignación.
 */
const requireMaquinaWriteAccess = requireAnyPermission(P.MAQUINAS_EDIT, P.MAQUINAS_UPDATE_ASSIGNED);

module.exports = {
  loadRolePermissions,
  requirePermission,
  requireAnyPermission,
  requireMaquinaAssignment,
  resolveMaquinaIdFromRequest,
  hasMaquinasViewGlobal,
  requireMaquinaReadAccess,
  requireMaquinaWriteAccess,
  P,
};
