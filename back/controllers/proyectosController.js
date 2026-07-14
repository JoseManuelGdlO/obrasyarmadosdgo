const { Op } = require("sequelize");
const Proyecto = require("../models/Proyecto");
const { logError } = require("../utils/logger");
const {
  hasProyectoAccess,
  denyProyectoAccess,
  proyectoScopeWhere,
} = require("../utils/proyectoScope");

const list = async (req, res) => {
  try {
    const { q } = req.query;
    const where = {
      ...proyectoScopeWhere(req, "id"),
    };
    if (q) {
      const term = `%${String(q).trim()}%`;
      const search = {
        [Op.or]: ["nombre", "descripcion", "estado"].map((field) => ({
          [field]: { [Op.like]: term },
        })),
      };
      if (where.id) {
        where[Op.and] = [{ id: where.id }, search];
        delete where.id;
      } else {
        Object.assign(where, search);
      }
    }
    const rows = await Proyecto.findAll({ where, order: [["createdAt", "DESC"]] });
    return res.status(200).json({ proyectos: rows });
  } catch (error) {
    logError("Error al listar proyecto.", error);
    return res.status(500).json({ message: "Error al listar proyecto." });
  }
};

const getById = async (req, res) => {
  try {
    const row = await Proyecto.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: "proyecto no encontrado." });
    if (!hasProyectoAccess(req, row.id)) {
      return denyProyectoAccess(res);
    }
    return res.status(200).json({ proyecto: row });
  } catch (error) {
    logError("Error al obtener proyecto.", error);
    return res.status(500).json({ message: "Error al obtener proyecto." });
  }
};

const create = async (req, res) => {
  try {
    const missing = ["clienteId", "nombre"].filter(
      (field) => req.body[field] === undefined || req.body[field] === ""
    );
    if (missing.length > 0) {
      return res.status(400).json({ message: `Campos obligatorios: ${missing.join(", ")}.` });
    }
    const row = await Proyecto.create(req.body);
    return res.status(201).json({ message: "proyecto creado correctamente.", proyecto: row });
  } catch (error) {
    logError("Error al crear proyecto.", error);
    return res.status(500).json({ message: "Error al crear proyecto." });
  }
};

const update = async (req, res) => {
  try {
    const row = await Proyecto.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: "proyecto no encontrado." });
    if (!hasProyectoAccess(req, row.id)) {
      return denyProyectoAccess(res);
    }
    await row.update(req.body);
    return res.status(200).json({ message: "proyecto actualizado correctamente.", proyecto: row });
  } catch (error) {
    logError("Error al actualizar proyecto.", error);
    return res.status(500).json({ message: "Error al actualizar proyecto." });
  }
};

const remove = async (req, res) => {
  try {
    const row = await Proyecto.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: "proyecto no encontrado." });
    if (!hasProyectoAccess(req, row.id)) {
      return denyProyectoAccess(res);
    }
    await row.destroy();
    return res.status(200).json({ message: "proyecto eliminado correctamente." });
  } catch (error) {
    logError("Error al eliminar proyecto.", error);
    return res.status(500).json({ message: "Error al eliminar proyecto." });
  }
};

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
};
