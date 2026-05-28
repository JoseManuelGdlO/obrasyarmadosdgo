const { Op } = require("sequelize");
const MaquinaClase = require("../models/MaquinaClase");
const { buildSimpleCrudController } = require("./simpleCrudFactory");
const { logError } = require("../utils/logger");

const base = buildSimpleCrudController({
  model: MaquinaClase,
  entityName: "maquinaClase",
  listKey: "clases",
  requiredFields: ["nombre"],
  searchableFields: ["nombre"],
});

const list = async (req, res) => {
  try {
    const { q, activo } = req.query;
    const where = {};
    if (activo === "true") where.activo = true;
    if (activo === "false") where.activo = false;
    if (q) {
      where.nombre = { [Op.like]: `%${String(q).trim()}%` };
    }
    const clases = await MaquinaClase.findAll({
      where,
      order: [["nombre", "ASC"]],
    });
    return res.status(200).json({ clases });
  } catch (error) {
    logError("Error al listar clases de máquina.", error);
    return res.status(500).json({ message: "Error al listar clases de máquina." });
  }
};

module.exports = { ...base, list };
