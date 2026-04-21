const Maquina = require("../models/Maquina");
const MaquinaChecklistItem = require("../models/MaquinaChecklistItem");

const ensureMaquina = async (maquinaId) => {
  return Maquina.findByPk(maquinaId);
};

const listChecklistItems = async (req, res) => {
  try {
    const { maquinaId } = req.params;
    const maquina = await ensureMaquina(maquinaId);
    if (!maquina) {
      return res.status(404).json({ message: "Máquina no encontrada." });
    }
    const items = await MaquinaChecklistItem.findAll({
      where: { maquinaId },
      order: [["orden", "ASC"]],
    });
    return res.status(200).json({ checklistItems: items });
  } catch (error) {
    return res.status(500).json({
      message: "Error al listar ítems del checklist.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getChecklistItemById = async (req, res) => {
  try {
    const { maquinaId, id } = req.params;
    const maquina = await ensureMaquina(maquinaId);
    if (!maquina) {
      return res.status(404).json({ message: "Máquina no encontrada." });
    }
    const item = await MaquinaChecklistItem.findOne({
      where: { id, maquinaId },
    });
    if (!item) {
      return res.status(404).json({ message: "Ítem no encontrado." });
    }
    return res.status(200).json({ checklistItem: item });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener el ítem.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const createChecklistItem = async (req, res) => {
  try {
    const { maquinaId } = req.params;
    const { label, itemType, unit, orden } = req.body;
    const maquina = await ensureMaquina(maquinaId);
    if (!maquina) {
      return res.status(404).json({ message: "Máquina no encontrada." });
    }
    if (!label || !String(label).trim()) {
      return res.status(400).json({ message: "label es obligatorio." });
    }
    const tipo = itemType || "check";
    if (!["check", "number"].includes(tipo)) {
      return res.status(400).json({ message: "itemType inválido." });
    }

    const created = await MaquinaChecklistItem.create({
      maquinaId,
      label: String(label).trim(),
      itemType: tipo,
      unit: tipo === "number" && unit ? String(unit).trim() : null,
      orden: orden !== undefined ? Number(orden) : 0,
    });
    return res.status(201).json({
      message: "Ítem creado correctamente.",
      checklistItem: created,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al crear ítem del checklist.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateChecklistItem = async (req, res) => {
  try {
    const { maquinaId, id } = req.params;
    const maquina = await ensureMaquina(maquinaId);
    if (!maquina) {
      return res.status(404).json({ message: "Máquina no encontrada." });
    }
    const item = await MaquinaChecklistItem.findOne({
      where: { id, maquinaId },
    });
    if (!item) {
      return res.status(404).json({ message: "Ítem no encontrado." });
    }

    const { label, itemType, unit, orden } = req.body;
    const updates = {};
    if (label !== undefined) {
      if (!String(label).trim() || String(label).trim().length === 0) {
        return res.status(400).json({ message: "label no puede estar vacío." });
      }
      updates.label = String(label).trim();
    }
    if (itemType !== undefined) {
      if (!["check", "number"].includes(itemType)) {
        return res.status(400).json({ message: "itemType inválido." });
      }
      updates.itemType = itemType;
    }
    if (unit !== undefined) {
      updates.unit = unit ? String(unit).trim() : null;
    }
    if (orden !== undefined) {
      updates.orden = Number(orden);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No hay campos para actualizar." });
    }

    await item.update(updates);
    const updated = await MaquinaChecklistItem.findByPk(id);
    return res.status(200).json({
      message: "Ítem actualizado correctamente.",
      checklistItem: updated,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al actualizar ítem.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deleteChecklistItem = async (req, res) => {
  try {
    const { maquinaId, id } = req.params;
    const maquina = await ensureMaquina(maquinaId);
    if (!maquina) {
      return res.status(404).json({ message: "Máquina no encontrada." });
    }
    const item = await MaquinaChecklistItem.findOne({
      where: { id, maquinaId },
    });
    if (!item) {
      return res.status(404).json({ message: "Ítem no encontrado." });
    }
    await item.destroy();
    return res.status(200).json({ message: "Ítem eliminado correctamente." });
  } catch (error) {
    return res.status(500).json({
      message: "Error al eliminar ítem.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  listChecklistItems,
  getChecklistItemById,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
};
