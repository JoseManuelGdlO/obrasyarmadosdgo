const Maquina = require("../models/Maquina");
const MaquinaPlanServicio = require("../models/MaquinaPlanServicio");
const PlanServicioPieza = require("../models/PlanServicioPieza");
const Articulo = require("../models/Articulo");

const FRECUENCIA_TIPOS = ["km", "hrs", "meses"];

const ensureMaquina = async (maquinaId) => Maquina.findByPk(maquinaId);

const listPlanesServicio = async (req, res) => {
  try {
    const { maquinaId } = req.params;
    const maquina = await ensureMaquina(maquinaId);
    if (!maquina) {
      return res.status(404).json({ message: "Máquina no encontrada." });
    }
    const planes = await MaquinaPlanServicio.findAll({
      where: { maquinaId },
      order: [["createdAt", "ASC"]],
      include: [
        {
          model: PlanServicioPieza,
          as: "piezas",
          required: false,
          include: [{ model: Articulo, as: "articulo", required: false }],
        },
      ],
    });
    return res.status(200).json({ planesServicio: planes });
  } catch (error) {
    return res.status(500).json({
      message: "Error al listar planes de servicio.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getPlanServicioById = async (req, res) => {
  try {
    const { maquinaId, id } = req.params;
    const maquina = await ensureMaquina(maquinaId);
    if (!maquina) {
      return res.status(404).json({ message: "Máquina no encontrada." });
    }
    const plan = await MaquinaPlanServicio.findOne({
      where: { id, maquinaId },
      include: [
        {
          model: PlanServicioPieza,
          as: "piezas",
          required: false,
          include: [{ model: Articulo, as: "articulo", required: false }],
        },
      ],
    });
    if (!plan) {
      return res.status(404).json({ message: "Plan de servicio no encontrado." });
    }
    return res.status(200).json({ planServicio: plan });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener el plan de servicio.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const createPlanServicio = async (req, res) => {
  try {
    const { maquinaId } = req.params;
    const { nombre, frecuenciaTipo, frecuenciaValor } = req.body;
    const maquina = await ensureMaquina(maquinaId);
    if (!maquina) {
      return res.status(404).json({ message: "Máquina no encontrada." });
    }
    if (!nombre || !String(nombre).trim()) {
      return res.status(400).json({ message: "nombre es obligatorio." });
    }
    if (!frecuenciaTipo || !FRECUENCIA_TIPOS.includes(frecuenciaTipo)) {
      return res.status(400).json({ message: "frecuenciaTipo inválido." });
    }
    if (frecuenciaValor === undefined || !String(frecuenciaValor).trim()) {
      return res.status(400).json({ message: "frecuenciaValor es obligatorio." });
    }

    const created = await MaquinaPlanServicio.create({
      maquinaId,
      nombre: String(nombre).trim(),
      frecuenciaTipo,
      frecuenciaValor: String(frecuenciaValor).trim(),
    });
    return res.status(201).json({
      message: "Plan de servicio creado correctamente.",
      planServicio: created,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al crear plan de servicio.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updatePlanServicio = async (req, res) => {
  try {
    const { maquinaId, id } = req.params;
    const maquina = await ensureMaquina(maquinaId);
    if (!maquina) {
      return res.status(404).json({ message: "Máquina no encontrada." });
    }
    const plan = await MaquinaPlanServicio.findOne({
      where: { id, maquinaId },
    });
    if (!plan) {
      return res.status(404).json({ message: "Plan de servicio no encontrado." });
    }

    const { nombre, frecuenciaTipo, frecuenciaValor } = req.body;
    const updates = {};
    if (nombre !== undefined) {
      if (!String(nombre).trim()) {
        return res.status(400).json({ message: "nombre no puede estar vacío." });
      }
      updates.nombre = String(nombre).trim();
    }
    if (frecuenciaTipo !== undefined) {
      if (!FRECUENCIA_TIPOS.includes(frecuenciaTipo)) {
        return res.status(400).json({ message: "frecuenciaTipo inválido." });
      }
      updates.frecuenciaTipo = frecuenciaTipo;
    }
    if (frecuenciaValor !== undefined) {
      if (!String(frecuenciaValor).trim()) {
        return res.status(400).json({
          message: "frecuenciaValor no puede estar vacío.",
        });
      }
      updates.frecuenciaValor = String(frecuenciaValor).trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No hay campos para actualizar." });
    }

    await plan.update(updates);
    const updated = await MaquinaPlanServicio.findByPk(id);
    return res.status(200).json({
      message: "Plan actualizado correctamente.",
      planServicio: updated,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al actualizar plan de servicio.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deletePlanServicio = async (req, res) => {
  try {
    const { maquinaId, id } = req.params;
    const maquina = await ensureMaquina(maquinaId);
    if (!maquina) {
      return res.status(404).json({ message: "Máquina no encontrada." });
    }
    const plan = await MaquinaPlanServicio.findOne({
      where: { id, maquinaId },
    });
    if (!plan) {
      return res.status(404).json({ message: "Plan de servicio no encontrado." });
    }
    await plan.destroy();
    return res.status(200).json({ message: "Plan de servicio eliminado correctamente." });
  } catch (error) {
    return res.status(500).json({
      message: "Error al eliminar plan de servicio.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  listPlanesServicio,
  getPlanServicioById,
  createPlanServicio,
  updatePlanServicio,
  deletePlanServicio,
};
