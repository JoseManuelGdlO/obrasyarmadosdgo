const Proyecto = require("../models/Proyecto");
const ProyectoEstimacion = require("../models/ProyectoEstimacion");
const { logError } = require("../utils/logger");

const ensureProyecto = async (proyectoId) => {
  return Proyecto.findByPk(proyectoId);
};

const toDecimal = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") return fallback;
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
};

const listEstimaciones = async (req, res) => {
  try {
    const { proyectoId } = req.params;
    const proyecto = await ensureProyecto(proyectoId);
    if (!proyecto) {
      return res.status(404).json({ message: "Proyecto no encontrado." });
    }
    const estimaciones = await ProyectoEstimacion.findAll({
      where: { proyectoId },
      order: [
        ["numero", "ASC"],
        ["createdAt", "ASC"],
      ],
    });
    return res.status(200).json({ estimaciones });
  } catch (error) {
    logError("Error al listar estimaciones del proyecto.", error);
    return res.status(500).json({
      message: "Error al listar estimaciones del proyecto.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getEstimacionById = async (req, res) => {
  try {
    const { proyectoId, id } = req.params;
    const proyecto = await ensureProyecto(proyectoId);
    if (!proyecto) {
      return res.status(404).json({ message: "Proyecto no encontrado." });
    }
    const estimacion = await ProyectoEstimacion.findOne({
      where: { id, proyectoId },
    });
    if (!estimacion) {
      return res.status(404).json({ message: "Estimación no encontrada." });
    }
    return res.status(200).json({ estimacion });
  } catch (error) {
    logError("Error al obtener la estimación.", error);
    return res.status(500).json({
      message: "Error al obtener la estimación.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const createEstimacion = async (req, res) => {
  try {
    const { proyectoId } = req.params;
    const proyecto = await ensureProyecto(proyectoId);
    if (!proyecto) {
      return res.status(404).json({ message: "Proyecto no encontrado." });
    }

    const { numero, fechaEstimacion, montoEstimacion, fechaPago, montoPagado } = req.body;

    let numeroFinal = numero !== undefined ? Number(numero) : null;
    if (!numeroFinal || numeroFinal < 1) {
      const count = await ProyectoEstimacion.count({ where: { proyectoId } });
      numeroFinal = count + 1;
    }

    const estimacion = await ProyectoEstimacion.create({
      proyectoId,
      numero: numeroFinal,
      fechaEstimacion: fechaEstimacion || null,
      montoEstimacion: toDecimal(montoEstimacion),
      fechaPago: fechaPago || null,
      montoPagado: toDecimal(montoPagado),
    });
    return res.status(201).json({
      message: "Estimación agregada correctamente.",
      estimacion,
    });
  } catch (error) {
    logError("Error al agregar estimación.", error);
    return res.status(500).json({
      message: "Error al agregar estimación.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateEstimacion = async (req, res) => {
  try {
    const { proyectoId, id } = req.params;
    const proyecto = await ensureProyecto(proyectoId);
    if (!proyecto) {
      return res.status(404).json({ message: "Proyecto no encontrado." });
    }
    const estimacion = await ProyectoEstimacion.findOne({
      where: { id, proyectoId },
    });
    if (!estimacion) {
      return res.status(404).json({ message: "Estimación no encontrada." });
    }

    const { numero, fechaEstimacion, montoEstimacion, fechaPago, montoPagado } = req.body;
    const updates = {};
    if (numero !== undefined) updates.numero = Number(numero) || estimacion.numero;
    if (fechaEstimacion !== undefined) updates.fechaEstimacion = fechaEstimacion || null;
    if (montoEstimacion !== undefined) updates.montoEstimacion = toDecimal(montoEstimacion);
    if (fechaPago !== undefined) updates.fechaPago = fechaPago || null;
    if (montoPagado !== undefined) updates.montoPagado = toDecimal(montoPagado);

    await estimacion.update(updates);
    return res.status(200).json({
      message: "Estimación actualizada correctamente.",
      estimacion,
    });
  } catch (error) {
    logError("Error al actualizar estimación.", error);
    return res.status(500).json({
      message: "Error al actualizar estimación.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deleteEstimacion = async (req, res) => {
  try {
    const { proyectoId, id } = req.params;
    const proyecto = await ensureProyecto(proyectoId);
    if (!proyecto) {
      return res.status(404).json({ message: "Proyecto no encontrado." });
    }
    const estimacion = await ProyectoEstimacion.findOne({
      where: { id, proyectoId },
    });
    if (!estimacion) {
      return res.status(404).json({ message: "Estimación no encontrada." });
    }
    await estimacion.destroy();
    return res.status(200).json({ message: "Estimación eliminada correctamente." });
  } catch (error) {
    logError("Error al eliminar estimación.", error);
    return res.status(500).json({
      message: "Error al eliminar estimación.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  listEstimaciones,
  getEstimacionById,
  createEstimacion,
  updateEstimacion,
  deleteEstimacion,
};
