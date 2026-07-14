const Role = require("../models/Role");
const RoleProyecto = require("../models/RoleProyecto");
const Proyecto = require("../models/Proyecto");
const sequelize = require("../config/database");
const { logError } = require("../utils/logger");

const listRoleProyectos = async (_req, res) => {
  try {
    const rows = await RoleProyecto.findAll({
      order: [
        ["rol", "ASC"],
        ["createdAt", "ASC"],
      ],
    });
    return res.status(200).json({ roleProyectos: rows });
  } catch (error) {
    logError("Error al listar proyectos por rol.", error);
    return res.status(500).json({
      message: "Error al listar proyectos por rol.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const syncRoleProyectos = async (req, res) => {
  try {
    const rol = decodeURIComponent(req.params.rol || "").trim();
    const { proyectoIds } = req.body;

    if (!rol) {
      return res.status(400).json({ message: "Rol es obligatorio." });
    }

    const roleExists = await Role.findOne({ where: { nombre: rol, activo: true } });
    if (!roleExists) {
      return res.status(400).json({ message: "Rol inválido." });
    }

    if (!Array.isArray(proyectoIds)) {
      return res.status(400).json({ message: "proyectoIds debe ser un arreglo." });
    }

    const uniqueIds = [...new Set(proyectoIds.map((id) => String(id).trim()).filter(Boolean))];

    if (uniqueIds.length > 0) {
      const found = await Proyecto.findAll({
        where: { id: uniqueIds },
        attributes: ["id"],
      });
      if (found.length !== uniqueIds.length) {
        return res.status(400).json({ message: "Uno o más proyectos no existen." });
      }
    }

    const tx = await sequelize.transaction();
    try {
      await RoleProyecto.destroy({ where: { rol }, transaction: tx });
      if (uniqueIds.length > 0) {
        await RoleProyecto.bulkCreate(
          uniqueIds.map((proyectoId) => ({ rol, proyectoId })),
          { transaction: tx }
        );
      }
      await tx.commit();
    } catch (err) {
      await tx.rollback();
      throw err;
    }

    const rows = await RoleProyecto.findAll({ where: { rol } });
    return res.status(200).json({
      message: "Alcance de proyectos actualizado correctamente.",
      roleProyectos: rows,
    });
  } catch (error) {
    logError("Error al sincronizar proyectos del rol.", error);
    return res.status(500).json({
      message: "Error al sincronizar proyectos del rol.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  listRoleProyectos,
  syncRoleProyectos,
};
