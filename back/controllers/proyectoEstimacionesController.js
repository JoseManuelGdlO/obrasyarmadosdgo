const path = require("path");
const fs = require("fs/promises");
const Proyecto = require("../models/Proyecto");
const ProyectoEstimacion = require("../models/ProyectoEstimacion");
const ProyectoEstimacionFoto = require("../models/ProyectoEstimacionFoto");
const {
  ESTIMACION_UPLOADS_DIR,
  ESTIMACION_UPLOADS_ROUTE,
} = require("../config/uploads");
const {
  cleanupUploadedEstimacionFilesIfPresent,
} = require("../middlewares/uploadEstimacionFiles");
const { logError } = require("../utils/logger");

const MAX_FOTOS_EXTRA = 20;

const fotosInclude = {
  model: ProyectoEstimacionFoto,
  as: "fotos",
  attributes: ["id", "ruta", "createdAt", "updatedAt"],
};

const buildPublicEstimacionUploadPath = (filename) =>
  `${ESTIMACION_UPLOADS_ROUTE}/${encodeURIComponent(filename)}`;

const resolveStoredUploadToAbsolute = (storedPath) => {
  if (!storedPath || typeof storedPath !== "string") return null;
  const normalizedRoute = `${ESTIMACION_UPLOADS_ROUTE}/`;
  if (!storedPath.startsWith(normalizedRoute)) return null;
  const filename = decodeURIComponent(storedPath.slice(normalizedRoute.length));
  const absolutePath = path.resolve(ESTIMACION_UPLOADS_DIR, filename);
  const uploadsRoot = path.resolve(ESTIMACION_UPLOADS_DIR);
  if (!absolutePath.startsWith(`${uploadsRoot}${path.sep}`) && absolutePath !== uploadsRoot) {
    return null;
  }
  return absolutePath;
};

const safeDeleteStoredUpload = async (storedPath) => {
  const absolutePath = resolveStoredUploadToAbsolute(storedPath);
  if (!absolutePath) return;
  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
};

const getUploadedFile = (req, fieldname) => req.files?.[fieldname]?.[0] || null;
const getUploadedFiles = (req, fieldname) => req.files?.[fieldname] || [];
const parseTruthyFlag = (value) => value === true || value === "true" || value === "1";

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
      include: [fotosInclude],
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
      include: [fotosInclude],
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
      await cleanupUploadedEstimacionFilesIfPresent(req);
      return res.status(404).json({ message: "Proyecto no encontrado." });
    }

    const {
      numero,
      fechaEstimacion,
      montoEstimacion,
      fechaPago,
      montoPagado,
      factura,
      retencionAmortizacion,
    } = req.body;

    let numeroFinal = numero !== undefined ? Number(numero) : null;
    if (!numeroFinal || numeroFinal < 1) {
      const count = await ProyectoEstimacion.count({ where: { proyectoId } });
      numeroFinal = count + 1;
    }

    const uploadedCaratula = getUploadedFile(req, "caratula");
    const created = await ProyectoEstimacion.create({
      proyectoId,
      numero: numeroFinal,
      fechaEstimacion: fechaEstimacion || null,
      montoEstimacion: toDecimal(montoEstimacion),
      fechaPago: fechaPago || null,
      montoPagado: toDecimal(montoPagado),
      factura: factura ? String(factura).trim() || null : null,
      retencionAmortizacion: toDecimal(retencionAmortizacion),
      caratula: uploadedCaratula
        ? buildPublicEstimacionUploadPath(uploadedCaratula.filename)
        : null,
    });
    const estimacion = await ProyectoEstimacion.findOne({
      where: { id: created.id },
      include: [fotosInclude],
    });
    return res.status(201).json({
      message: "Estimación agregada correctamente.",
      estimacion,
    });
  } catch (error) {
    await cleanupUploadedEstimacionFilesIfPresent(req);
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
      await cleanupUploadedEstimacionFilesIfPresent(req);
      return res.status(404).json({ message: "Proyecto no encontrado." });
    }
    const estimacion = await ProyectoEstimacion.findOne({
      where: { id, proyectoId },
    });
    if (!estimacion) {
      await cleanupUploadedEstimacionFilesIfPresent(req);
      return res.status(404).json({ message: "Estimación no encontrada." });
    }

    const {
      numero,
      fechaEstimacion,
      montoEstimacion,
      fechaPago,
      montoPagado,
      factura,
      retencionAmortizacion,
    } = req.body;
    const updates = {};
    if (numero !== undefined) updates.numero = Number(numero) || estimacion.numero;
    if (fechaEstimacion !== undefined) updates.fechaEstimacion = fechaEstimacion || null;
    if (montoEstimacion !== undefined) updates.montoEstimacion = toDecimal(montoEstimacion);
    if (fechaPago !== undefined) updates.fechaPago = fechaPago || null;
    if (montoPagado !== undefined) updates.montoPagado = toDecimal(montoPagado);
    if (factura !== undefined) {
      updates.factura = factura ? String(factura).trim() || null : null;
    }
    if (retencionAmortizacion !== undefined) {
      updates.retencionAmortizacion = toDecimal(retencionAmortizacion);
    }

    const uploadedCaratula = getUploadedFile(req, "caratula");
    const previousCaratula = estimacion.caratula;
    if (uploadedCaratula) {
      updates.caratula = buildPublicEstimacionUploadPath(uploadedCaratula.filename);
    } else if (parseTruthyFlag(req.body.quitarCaratula)) {
      updates.caratula = null;
    }

    await estimacion.update(updates);
    if (
      previousCaratula &&
      updates.caratula !== undefined &&
      previousCaratula !== updates.caratula
    ) {
      await safeDeleteStoredUpload(previousCaratula);
    }
    const refreshed = await ProyectoEstimacion.findOne({
      where: { id: estimacion.id },
      include: [fotosInclude],
    });
    return res.status(200).json({
      message: "Estimación actualizada correctamente.",
      estimacion: refreshed,
    });
  } catch (error) {
    await cleanupUploadedEstimacionFilesIfPresent(req);
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
      include: [fotosInclude],
    });
    if (!estimacion) {
      return res.status(404).json({ message: "Estimación no encontrada." });
    }
    const pathsToDelete = [
      estimacion.caratula,
      ...(estimacion.fotos || []).map((foto) => foto.ruta),
    ];
    await estimacion.destroy();
    for (const storedPath of pathsToDelete) {
      await safeDeleteStoredUpload(storedPath);
    }
    return res.status(200).json({ message: "Estimación eliminada correctamente." });
  } catch (error) {
    logError("Error al eliminar estimación.", error);
    return res.status(500).json({
      message: "Error al eliminar estimación.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const addFotosEstimacion = async (req, res) => {
  try {
    const { proyectoId, id } = req.params;
    const proyecto = await ensureProyecto(proyectoId);
    if (!proyecto) {
      await cleanupUploadedEstimacionFilesIfPresent(req);
      return res.status(404).json({ message: "Proyecto no encontrado." });
    }
    const estimacion = await ProyectoEstimacion.findOne({
      where: { id, proyectoId },
      include: [fotosInclude],
    });
    if (!estimacion) {
      await cleanupUploadedEstimacionFilesIfPresent(req);
      return res.status(404).json({ message: "Estimación no encontrada." });
    }
    const files = getUploadedFiles(req, "fotos");
    if (!files.length) {
      return res.status(400).json({ message: "Debes enviar al menos una foto." });
    }
    const currentCount = estimacion.fotos?.length || 0;
    if (currentCount + files.length > MAX_FOTOS_EXTRA) {
      await cleanupUploadedEstimacionFilesIfPresent(req);
      return res.status(400).json({
        message: `Máximo ${MAX_FOTOS_EXTRA} fotos extra por estimación.`,
      });
    }
    const created = [];
    for (const file of files) {
      const foto = await ProyectoEstimacionFoto.create({
        estimacionId: estimacion.id,
        ruta: buildPublicEstimacionUploadPath(file.filename),
      });
      created.push(foto);
    }
    const refreshed = await ProyectoEstimacion.findOne({
      where: { id: estimacion.id },
      include: [fotosInclude],
    });
    return res.status(201).json({
      message: "Fotos agregadas correctamente.",
      estimacion: refreshed,
      fotos: created,
    });
  } catch (error) {
    await cleanupUploadedEstimacionFilesIfPresent(req);
    logError("Error al agregar fotos a la estimación.", error);
    return res.status(500).json({
      message: "Error al agregar fotos a la estimación.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deleteFotoEstimacion = async (req, res) => {
  try {
    const { proyectoId, id, fotoId } = req.params;
    const proyecto = await ensureProyecto(proyectoId);
    if (!proyecto) {
      return res.status(404).json({ message: "Proyecto no encontrado." });
    }
    const estimacion = await ProyectoEstimacion.findOne({ where: { id, proyectoId } });
    if (!estimacion) {
      return res.status(404).json({ message: "Estimación no encontrada." });
    }
    const foto = await ProyectoEstimacionFoto.findOne({
      where: { id: fotoId, estimacionId: estimacion.id },
    });
    if (!foto) {
      return res.status(404).json({ message: "Foto no encontrada." });
    }
    const ruta = foto.ruta;
    await foto.destroy();
    await safeDeleteStoredUpload(ruta);
    return res.status(200).json({ message: "Foto eliminada correctamente." });
  } catch (error) {
    logError("Error al eliminar foto de la estimación.", error);
    return res.status(500).json({
      message: "Error al eliminar foto de la estimación.",
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
  addFotosEstimacion,
  deleteFotoEstimacion,
};
