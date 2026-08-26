const sequelize = require("../config/database");
const Proyecto = require("../models/Proyecto");
const ProyectoEstimacion = require("../models/ProyectoEstimacion");
const ProyectoEstimacionFoto = require("../models/ProyectoEstimacionFoto");
const { ESTIMACION_UPLOADS_ROUTE } = require("../config/uploads");
const {
  cleanupUploadedEstimacionFilesIfPresent,
} = require("../middlewares/uploadEstimacionFiles");
const {
  deleteStoredEstimacionUploadsBestEffort,
} = require("../utils/estimacionUploads");
const { logger, logError } = require("../utils/logger");

const MAX_FOTOS_EXTRA = 20;

const fotosInclude = {
  model: ProyectoEstimacionFoto,
  as: "fotos",
  attributes: ["id", "ruta", "createdAt", "updatedAt"],
};

const buildPublicEstimacionUploadPath = (filename) =>
  `${ESTIMACION_UPLOADS_ROUTE}/${encodeURIComponent(filename)}`;

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

const ESTADO_CUENTA_FIELDS = [
  "contratoPrincipalSinIva",
  "acumuladoEstimacionAnterior",
  "estaEstimacion",
  "estimadoALaFecha",
  "saldoPorEstimar",
];

const parseNonNegativeDecimal = (value, fieldName) => {
  const num = toDecimal(value, 0);
  if (num < 0) {
    const err = new Error(`${fieldName} debe ser mayor o igual a 0.`);
    err.status = 400;
    throw err;
  }
  return num;
};

const pickEstadoCuentaFromBody = (body, { partial = false } = {}) => {
  const out = {};
  for (const field of ESTADO_CUENTA_FIELDS) {
    if (body[field] === undefined) {
      if (!partial) out[field] = 0;
      continue;
    }
    out[field] = parseNonNegativeDecimal(body[field], field);
  }
  return out;
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
  let persisted = false;
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
    const estadoCuenta = pickEstadoCuentaFromBody(req.body);
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
      ...estadoCuenta,
    });
    persisted = true;
    let estimacion = created;
    try {
      const reloaded = await ProyectoEstimacion.findOne({
        where: { id: created.id },
        include: [fotosInclude],
      });
      if (reloaded) {
        estimacion = reloaded;
      } else {
        created.setDataValue("fotos", []);
      }
    } catch (reloadError) {
      logger.warn(`No se pudo recargar la estimación creada: ${reloadError.message}`);
      created.setDataValue("fotos", []);
    }
    return res.status(201).json({
      message: "Estimación agregada correctamente.",
      estimacion,
    });
  } catch (error) {
    if (!persisted) {
      await cleanupUploadedEstimacionFilesIfPresent(req);
    }
    if (error.status === 400) {
      return res.status(400).json({ message: error.message });
    }
    logError("Error al agregar estimación.", error);
    return res.status(500).json({
      message: "Error al agregar estimación.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateEstimacion = async (req, res) => {
  let uploadedPathPersisted = false;
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
    Object.assign(updates, pickEstadoCuentaFromBody(req.body, { partial: true }));

    const uploadedCaratula = getUploadedFile(req, "caratula");
    const previousCaratula = estimacion.caratula;
    if (uploadedCaratula) {
      updates.caratula = buildPublicEstimacionUploadPath(uploadedCaratula.filename);
    } else if (parseTruthyFlag(req.body.quitarCaratula)) {
      updates.caratula = null;
    }

    await estimacion.update(updates);
    uploadedPathPersisted = Boolean(uploadedCaratula);
    if (
      previousCaratula &&
      updates.caratula !== undefined &&
      previousCaratula !== updates.caratula
    ) {
      await deleteStoredEstimacionUploadsBestEffort([previousCaratula]);
    }
    let refreshed = estimacion;
    try {
      const reloaded = await ProyectoEstimacion.findOne({
        where: { id: estimacion.id },
        include: [fotosInclude],
      });
      if (reloaded) {
        refreshed = reloaded;
      }
    } catch (reloadError) {
      logger.warn(`No se pudo recargar la estimación actualizada: ${reloadError.message}`);
    }
    return res.status(200).json({
      message: "Estimación actualizada correctamente.",
      estimacion: refreshed,
    });
  } catch (error) {
    if (!uploadedPathPersisted) {
      await cleanupUploadedEstimacionFilesIfPresent(req);
    }
    if (error.status === 400) {
      return res.status(400).json({ message: error.message });
    }
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
    await deleteStoredEstimacionUploadsBestEffort(pathsToDelete);
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
  let transaction;
  let persisted = false;
  try {
    const { proyectoId, id } = req.params;
    const proyecto = await ensureProyecto(proyectoId);
    if (!proyecto) {
      await cleanupUploadedEstimacionFilesIfPresent(req);
      return res.status(404).json({ message: "Proyecto no encontrado." });
    }
    const files = getUploadedFiles(req, "fotos");
    if (!files.length) {
      return res.status(400).json({ message: "Debes enviar al menos una foto." });
    }

    transaction = await sequelize.transaction();
    const estimacion = await ProyectoEstimacion.findOne({
      where: { id, proyectoId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!estimacion) {
      await transaction.rollback();
      await cleanupUploadedEstimacionFilesIfPresent(req);
      return res.status(404).json({ message: "Estimación no encontrada." });
    }
    const currentCount = await ProyectoEstimacionFoto.count({
      where: { estimacionId: estimacion.id },
      transaction,
    });
    if (currentCount + files.length > MAX_FOTOS_EXTRA) {
      await transaction.rollback();
      await cleanupUploadedEstimacionFilesIfPresent(req);
      return res.status(400).json({
        message: `Máximo ${MAX_FOTOS_EXTRA} fotos extra por estimación.`,
      });
    }
    const created = await ProyectoEstimacionFoto.bulkCreate(
      files.map((file) => ({
        estimacionId: estimacion.id,
        ruta: buildPublicEstimacionUploadPath(file.filename),
      })),
      { transaction }
    );
    await transaction.commit();
    persisted = true;

    let refreshed = {
      ...estimacion.toJSON(),
      fotos: created,
    };
    try {
      const reloaded = await ProyectoEstimacion.findOne({
        where: { id: estimacion.id },
        include: [fotosInclude],
      });
      if (reloaded) {
        refreshed = reloaded;
      }
    } catch (reloadError) {
      logger.warn(`No se pudo recargar la estimación con fotos: ${reloadError.message}`);
    }
    return res.status(201).json({
      message: "Fotos agregadas correctamente.",
      estimacion: refreshed,
      fotos: created,
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    if (!persisted) {
      await cleanupUploadedEstimacionFilesIfPresent(req);
    }
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
    await deleteStoredEstimacionUploadsBestEffort([ruta]);
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
