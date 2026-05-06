const RolePermission = require("../models/RolePermission");
const Role = require("../models/Role");

const listRolePermissions = async (_req, res) => {
  try {
    const rows = await RolePermission.findAll({
      order: [
        ["rol", "ASC"],
        ["permission", "ASC"],
      ],
    });
    return res.status(200).json({ rolePermissions: rows });
  } catch (error) {
    return res.status(500).json({
      message: "Error al listar permisos por rol.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const createRolePermission = async (req, res) => {
  try {
    const { rol, permission } = req.body;
    if (!rol || !permission) {
      return res.status(400).json({ message: "Rol y permiso son obligatorios." });
    }
    const roleExists = await Role.findOne({ where: { nombre: rol, activo: true } });
    if (!roleExists) {
      return res.status(400).json({ message: "Rol inválido." });
    }

    const existing = await RolePermission.findOne({ where: { rol, permission } });
    if (existing) {
      return res.status(409).json({ message: "Este permiso ya está asignado al rol." });
    }

    const created = await RolePermission.create({ rol, permission });
    return res.status(201).json({
      message: "Permiso asignado al rol correctamente.",
      rolePermission: created,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al asignar permiso al rol.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deleteRolePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await RolePermission.findByPk(id);
    if (!row) {
      return res.status(404).json({ message: "Asignación de permiso no encontrada." });
    }
    await row.destroy();
    return res.status(200).json({ message: "Permiso removido del rol correctamente." });
  } catch (error) {
    return res.status(500).json({
      message: "Error al remover permiso del rol.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  listRolePermissions,
  createRolePermission,
  deleteRolePermission,
};
