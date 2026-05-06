const { Op } = require("sequelize");

const buildSimpleCrudController = ({
  model,
  entityName,
  listKey,
  requiredFields = [],
  searchableFields = [],
}) => {
  const list = async (req, res) => {
    try {
      const { q } = req.query;
      const where = {};
      if (q && searchableFields.length > 0) {
        const term = `%${String(q).trim()}%`;
        where[Op.or] = searchableFields.map((field) => ({
          [field]: { [Op.like]: term },
        }));
      }
      const rows = await model.findAll({ where, order: [["createdAt", "DESC"]] });
      return res.status(200).json({ [listKey]: rows });
    } catch (_error) {
      return res.status(500).json({ message: `Error al listar ${entityName}.` });
    }
  };

  const getById = async (req, res) => {
    try {
      const row = await model.findByPk(req.params.id);
      if (!row) return res.status(404).json({ message: `${entityName} no encontrado.` });
      return res.status(200).json({ [entityName]: row });
    } catch (_error) {
      return res.status(500).json({ message: `Error al obtener ${entityName}.` });
    }
  };

  const create = async (req, res) => {
    try {
      const missing = requiredFields.filter((field) => req.body[field] === undefined || req.body[field] === "");
      if (missing.length > 0) {
        return res.status(400).json({ message: `Campos obligatorios: ${missing.join(", ")}.` });
      }
      const row = await model.create(req.body);
      return res.status(201).json({ message: `${entityName} creado correctamente.`, [entityName]: row });
    } catch (_error) {
      return res.status(500).json({ message: `Error al crear ${entityName}.` });
    }
  };

  const update = async (req, res) => {
    try {
      const row = await model.findByPk(req.params.id);
      if (!row) return res.status(404).json({ message: `${entityName} no encontrado.` });
      await row.update(req.body);
      return res.status(200).json({ message: `${entityName} actualizado correctamente.`, [entityName]: row });
    } catch (_error) {
      return res.status(500).json({ message: `Error al actualizar ${entityName}.` });
    }
  };

  const remove = async (req, res) => {
    try {
      const row = await model.findByPk(req.params.id);
      if (!row) return res.status(404).json({ message: `${entityName} no encontrado.` });
      await row.destroy();
      return res.status(200).json({ message: `${entityName} eliminado correctamente.` });
    } catch (_error) {
      return res.status(500).json({ message: `Error al eliminar ${entityName}.` });
    }
  };

  return { list, getById, create, update, remove };
};

module.exports = { buildSimpleCrudController };
