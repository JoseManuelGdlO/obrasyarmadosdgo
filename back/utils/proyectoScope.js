const { Op } = require("sequelize");
const RoleProyecto = require("../models/RoleProyecto");

/**
 * null = sin restricción (todos los proyectos).
 * Set = lista blanca de proyectoIds.
 */
const resolveProyectoScopeForRol = async (rol) => {
  if (!rol || rol === "admin") {
    return null;
  }
  const rows = await RoleProyecto.findAll({
    where: { rol },
    attributes: ["proyectoId"],
  });
  if (rows.length === 0) {
    return null;
  }
  return new Set(rows.map((row) => row.proyectoId));
};

const hasProyectoAccess = (req, proyectoId) => {
  if (proyectoId === undefined || proyectoId === null || proyectoId === "") {
    // Sin proyecto: solo permitido si el rol no está restringido.
    return req.proyectoIds === null;
  }
  if (req.proyectoIds === null) {
    return true;
  }
  return req.proyectoIds.has(String(proyectoId));
};

const denyProyectoAccess = (res) =>
  res.status(403).json({ message: "No tiene acceso a este proyecto." });

/** Cláusula where para filtrar por id de proyecto (campo configurable). */
const proyectoScopeWhere = (req, field = "id") => {
  if (req.proyectoIds === null) {
    return {};
  }
  return { [field]: { [Op.in]: [...req.proyectoIds] } };
};

/**
 * Para órdenes: si está restringido, solo proyectos en alcance (excluye null).
 * Si además hay query proyectoId, valida que esté en alcance.
 */
const mergeProyectoIdFilter = (req, where, queryProyectoId) => {
  if (req.proyectoIds === null) {
    if (queryProyectoId) {
      where.proyectoId = queryProyectoId;
    }
    return { ok: true };
  }

  const allowed = [...req.proyectoIds];
  if (queryProyectoId) {
    if (!req.proyectoIds.has(String(queryProyectoId))) {
      return { ok: false, message: "No tiene acceso a este proyecto." };
    }
    where.proyectoId = queryProyectoId;
    return { ok: true };
  }

  where.proyectoId = { [Op.in]: allowed };
  return { ok: true };
};

module.exports = {
  resolveProyectoScopeForRol,
  hasProyectoAccess,
  denyProyectoAccess,
  proyectoScopeWhere,
  mergeProyectoIdFilter,
};
