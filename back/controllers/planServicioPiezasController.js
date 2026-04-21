const { Op } = require("sequelize");
const MaquinaPlanServicio = require("../models/MaquinaPlanServicio");
const PlanServicioPieza = require("../models/PlanServicioPieza");
const Articulo = require("../models/Articulo");

const ensurePlan = async (planId) => {
  return MaquinaPlanServicio.findByPk(planId);
};

const listPiezas = async (req, res) => {
  try {
    const { planId } = req.params;
    const plan = await ensurePlan(planId);
    if (!plan) {
      return res.status(404).json({ message: "Plan de servicio no encontrado." });
    }
    const piezas = await PlanServicioPieza.findAll({
      where: { planServicioId: planId },
      include: [{ model: Articulo, as: "articulo", required: true }],
    });
    return res.status(200).json({ piezas });
  } catch (error) {
    return res.status(500).json({
      message: "Error al listar piezas del plan.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getPiezaById = async (req, res) => {
  try {
    const { planId, id } = req.params;
    const plan = await ensurePlan(planId);
    if (!plan) {
      return res.status(404).json({ message: "Plan de servicio no encontrado." });
    }
    const pieza = await PlanServicioPieza.findOne({
      where: { id, planServicioId: planId },
      include: [{ model: Articulo, as: "articulo", required: false }],
    });
    if (!pieza) {
      return res.status(404).json({ message: "Pieza no encontrada." });
    }
    return res.status(200).json({ pieza });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener la pieza.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const createPieza = async (req, res) => {
  try {
    const { planId } = req.params;
    const { articuloId, cantidad } = req.body;
    const plan = await ensurePlan(planId);
    if (!plan) {
      return res.status(404).json({ message: "Plan de servicio no encontrado." });
    }
    if (!articuloId) {
      return res.status(400).json({ message: "articuloId es obligatorio." });
    }
    const articulo = await Articulo.findByPk(articuloId);
    if (!articulo) {
      return res.status(400).json({ message: "Artículo no encontrado." });
    }
    const qty = cantidad !== undefined ? Number(cantidad) : 1;
    if (qty < 1) {
      return res.status(400).json({ message: "cantidad debe ser al menos 1." });
    }

    const existing = await PlanServicioPieza.findOne({
      where: { planServicioId: planId, articuloId },
    });
    if (existing) {
      return res.status(409).json({
        message: "Este artículo ya está en el plan.",
      });
    }

    const created = await PlanServicioPieza.create({
      planServicioId: planId,
      articuloId,
      cantidad: qty,
    });
    const pieza = await PlanServicioPieza.findByPk(created.id, {
      include: [{ model: Articulo, as: "articulo", required: false }],
    });
    return res.status(201).json({
      message: "Pieza agregada al plan correctamente.",
      pieza,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al agregar pieza al plan.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updatePieza = async (req, res) => {
  try {
    const { planId, id } = req.params;
    const { articuloId, cantidad } = req.body;
    const plan = await ensurePlan(planId);
    if (!plan) {
      return res.status(404).json({ message: "Plan de servicio no encontrado." });
    }
    const pieza = await PlanServicioPieza.findOne({
      where: { id, planServicioId: planId },
    });
    if (!pieza) {
      return res.status(404).json({ message: "Pieza no encontrada." });
    }

    const updates = {};
    if (articuloId !== undefined) {
      const art = await Articulo.findByPk(articuloId);
      if (!art) {
        return res.status(400).json({ message: "Artículo no encontrado." });
      }
      const other = await PlanServicioPieza.findOne({
        where: {
          planServicioId: planId,
          articuloId,
          id: { [Op.ne]: id },
        },
      });
      if (other) {
        return res.status(409).json({
          message: "Otra fila ya usa ese artículo en el plan.",
        });
      }
      updates.articuloId = articuloId;
    }
    if (cantidad !== undefined) {
      const qty = Number(cantidad);
      if (qty < 1) {
        return res.status(400).json({ message: "cantidad debe ser al menos 1." });
      }
      updates.cantidad = qty;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No hay campos para actualizar." });
    }

    await pieza.update(updates);
    const updated = await PlanServicioPieza.findByPk(id, {
      include: [{ model: Articulo, as: "articulo", required: false }],
    });
    return res.status(200).json({
      message: "Pieza actualizada correctamente.",
      pieza: updated,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al actualizar pieza.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deletePieza = async (req, res) => {
  try {
    const { planId, id } = req.params;
    const plan = await ensurePlan(planId);
    if (!plan) {
      return res.status(404).json({ message: "Plan de servicio no encontrado." });
    }
    const pieza = await PlanServicioPieza.findOne({
      where: { id, planServicioId: planId },
    });
    if (!pieza) {
      return res.status(404).json({ message: "Pieza no encontrada." });
    }
    await pieza.destroy();
    return res.status(200).json({ message: "Pieza eliminada del plan correctamente." });
  } catch (error) {
    return res.status(500).json({
      message: "Error al eliminar pieza.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  listPiezas,
  getPiezaById,
  createPieza,
  updatePieza,
  deletePieza,
};
