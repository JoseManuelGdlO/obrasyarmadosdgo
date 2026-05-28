const { Op } = require("sequelize");
const MaquinaTipo = require("../models/MaquinaTipo");
const MaquinaClase = require("../models/MaquinaClase");
const { buildSimpleCrudController } = require("./simpleCrudFactory");
const { logError } = require("../utils/logger");

const base = buildSimpleCrudController({
  model: MaquinaTipo,
  entityName: "maquinaTipo",
  listKey: "tipos",
  requiredFields: ["nombre", "claseId"],
  searchableFields: ["nombre"],
});

const list = async (req, res) => {
  try {
    const { q, claseId, activo } = req.query;
    const where = {};
    if (claseId) where.claseId = claseId;
    if (activo === "true") where.activo = true;
    if (activo === "false") where.activo = false;
    if (q) {
      where.nombre = { [Op.like]: `%${String(q).trim()}%` };
    }
    const tipos = await MaquinaTipo.findAll({
      where,
      include: [{ model: MaquinaClase, as: "clase", attributes: ["id", "nombre"] }],
      order: [["nombre", "ASC"]],
    });
    return res.status(200).json({ tipos });
  } catch (error) {
    logError("Error al listar tipos de máquina.", error);
    return res.status(500).json({ message: "Error al listar tipos de máquina." });
  }
};

const create = async (req, res) => {
  try {
    const { nombre, claseId, activo } = req.body;
    if (!nombre || !claseId) {
      return res.status(400).json({ message: "Campos obligatorios: nombre, claseId." });
    }
    const clase = await MaquinaClase.findByPk(claseId);
    if (!clase) {
      return res.status(400).json({ message: "Clase no encontrada." });
    }
    const row = await MaquinaTipo.create({
      nombre: String(nombre).trim(),
      claseId,
      activo: activo !== undefined ? Boolean(activo) : true,
    });
    return res.status(201).json({
      message: "Tipo de máquina creado correctamente.",
      maquinaTipo: row,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "Ya existe un tipo con ese nombre en la clase seleccionada.",
      });
    }
    logError("Error al crear tipo de máquina.", error);
    return res.status(500).json({ message: "Error al crear tipo de máquina." });
  }
};

module.exports = { ...base, list, create };
