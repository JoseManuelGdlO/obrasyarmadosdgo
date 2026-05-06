const { Op } = require("sequelize");
const Role = require("../models/Role");

const listRoles = async (_req, res) => {
  try {
    const roles = await Role.findAll({ order: [["nombre", "ASC"]] });
    return res.status(200).json({ roles });
  } catch (error) {
    return res.status(500).json({
      message: "Error al listar roles.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const createRole = async (req, res) => {
  try {
    const { nombre, descripcion, activo } = req.body;
    if (!nombre) {
      return res.status(400).json({ message: "El nombre del rol es obligatorio." });
    }
    const existing = await Role.findOne({ where: { nombre } });
    if (existing) {
      return res.status(409).json({ message: "El rol ya existe." });
    }
    const role = await Role.create({
      nombre,
      descripcion: descripcion || null,
      ...(activo !== undefined ? { activo: Boolean(activo) } : {}),
    });
    return res.status(201).json({ message: "Rol creado correctamente.", role });
  } catch (error) {
    return res.status(500).json({
      message: "Error al crear rol.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, activo } = req.body;
    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: "Rol no encontrado." });
    }
    const updates = {};
    if (nombre !== undefined) {
      if (!nombre) {
        return res.status(400).json({ message: "El nombre no puede estar vacío." });
      }
      const other = await Role.findOne({ where: { nombre, id: { [Op.ne]: id } } });
      if (other) {
        return res.status(409).json({ message: "El nombre del rol ya está en uso." });
      }
      updates.nombre = nombre;
    }
    if (descripcion !== undefined) updates.descripcion = descripcion || null;
    if (activo !== undefined) updates.activo = Boolean(activo);
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No hay cambios para actualizar." });
    }
    await role.update(updates);
    return res.status(200).json({ message: "Rol actualizado correctamente.", role });
  } catch (error) {
    return res.status(500).json({
      message: "Error al actualizar rol.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: "Rol no encontrado." });
    }
    await role.destroy();
    return res.status(200).json({ message: "Rol eliminado correctamente." });
  } catch (error) {
    return res.status(500).json({
      message: "Error al eliminar rol.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  listRoles,
  createRole,
  updateRole,
  deleteRole,
};
