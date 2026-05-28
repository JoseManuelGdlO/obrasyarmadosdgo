const path = require("path");
const fs = require("fs/promises");
const { Op } = require("sequelize");
const Trabajador = require("../models/Trabajador");
const {
  WORKER_UPLOADS_DIR,
  WORKER_UPLOADS_ROUTE,
} = require("../config/uploads");
const { cleanupUploadedFilesIfPresent } = require("../middlewares/uploadTrabajadorFiles");
const { todayDateOnly, normalizeDateOnly } = require("../utils/dateOnly");
const { logError } = require("../utils/logger");

const ESTADOS_TRABAJADOR = ["activo", "inactivo", "vacaciones", "licencia"];

const buildPublicWorkerUploadPath = (filename) =>
  `${WORKER_UPLOADS_ROUTE}/${encodeURIComponent(filename)}`;

const resolveStoredUploadToAbsolute = (storedPath) => {
  if (!storedPath || typeof storedPath !== "string") return null;
  const normalizedRoute = `${WORKER_UPLOADS_ROUTE}/`;
  if (!storedPath.startsWith(normalizedRoute)) return null;
  const filename = decodeURIComponent(storedPath.slice(normalizedRoute.length));
  const absolutePath = path.resolve(WORKER_UPLOADS_DIR, filename);
  const uploadsRoot = path.resolve(WORKER_UPLOADS_DIR);
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
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
};

const getUploadedAvatar = (req) => req.files?.avatar?.[0] || null;

const pickUploadedAvatarPath = (req) => {
  const file = getUploadedAvatar(req);
  if (file?.filename) {
    return buildPublicWorkerUploadPath(file.filename);
  }
  return null;
};

const parseTruthyFlag = (value) => value === true || value === "true";

const buildListWhere = (q) => {
  const baseWhere = { bajaLogica: false };
  if (!q || !String(q).trim()) return baseWhere;
  const term = `%${String(q).trim()}%`;
  return {
    [Op.and]: [
      baseWhere,
      {
        [Op.or]: [
          { nombre: { [Op.like]: term } },
          { puesto: { [Op.like]: term } },
          { cargo: { [Op.like]: term } },
          { email: { [Op.like]: term } },
          { departamento: { [Op.like]: term } },
          { especialidad: { [Op.like]: term } },
        ],
      },
    ],
  };
};

const applyEstadoBajaSideEffects = (trabajador, payload) => {
  if (payload.estado === "inactivo" && trabajador.estado !== "inactivo") {
    payload.fechaBaja = todayDateOnly();
  }
  if (
    payload.estado !== undefined &&
    payload.estado !== "inactivo" &&
    trabajador.estado === "inactivo"
  ) {
    payload.fechaBaja = null;
  }
};

const trimOrNull = (value) => {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
};

const normalizeEstado = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const str = String(value).trim().toLowerCase();
  if (str === "activo") return "activo";
  if (str === "inactivo") return "inactivo";
  if (str === "vacaciones") return "vacaciones";
  if (str === "licencia") return "licencia";
  return null;
};

const buildPayload = (body, { partial = false } = {}) => {
  const payload = {};
  const errors = [];

  if (!partial || body.nombre !== undefined) {
    const nombre = trimOrNull(body.nombre);
    if (!nombre) {
      errors.push("El nombre es obligatorio.");
    } else {
      payload.nombre = nombre;
    }
  }

  if (body.puesto !== undefined) payload.puesto = trimOrNull(body.puesto);
  if (body.cargo !== undefined) payload.cargo = trimOrNull(body.cargo);
  if (body.departamento !== undefined) payload.departamento = trimOrNull(body.departamento);
  if (body.especialidad !== undefined) payload.especialidad = trimOrNull(body.especialidad);
  if (body.telefono !== undefined) payload.telefono = trimOrNull(body.telefono);
  if (body.email !== undefined) payload.email = trimOrNull(body.email);
  if (body.experiencia !== undefined) payload.experiencia = trimOrNull(body.experiencia);
  if (body.avatar !== undefined) payload.avatar = trimOrNull(body.avatar);

  if (body.fechaIngreso !== undefined) {
    const fecha = normalizeDateOnly(body.fechaIngreso);
    if (fecha === null && body.fechaIngreso !== null && body.fechaIngreso !== "") {
      errors.push("La fecha de ingreso no es válida.");
    } else {
      payload.fechaIngreso = fecha;
    }
  }

  if (body.estado !== undefined) {
    const estado = normalizeEstado(body.estado);
    if (estado === null) {
      errors.push(`El estado debe ser uno de: ${ESTADOS_TRABAJADOR.join(", ")}.`);
    } else if (estado !== undefined) {
      payload.estado = estado;
    }
  }

  return { payload, errors };
};

const applyAvatarToPayload = (req, payload, { partial = false } = {}) => {
  const uploadedPath = pickUploadedAvatarPath(req);
  const wantsToRemove = partial && parseTruthyFlag(req.body?.removeAvatar);

  if (uploadedPath) {
    payload.avatar = uploadedPath;
    return;
  }
  if (wantsToRemove) {
    payload.avatar = null;
  }
};

const list = async (req, res) => {
  try {
    const { q } = req.query;
    const trabajadores = await Trabajador.findAll({
      where: buildListWhere(q),
      order: [["nombre", "ASC"]],
    });
    return res.status(200).json({ trabajadores });
  } catch (error) {
    logError("Error al listar trabajadores.", error);
    return res.status(500).json({
      message: "Error al listar trabajadores.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getById = async (req, res) => {
  try {
    const trabajador = await Trabajador.findByPk(req.params.id);
    if (!trabajador || trabajador.bajaLogica) {
      return res.status(404).json({ message: "Trabajador no encontrado." });
    }
    return res.status(200).json({ trabajador });
  } catch (error) {
    logError("Error al obtener el trabajador.", error);
    return res.status(500).json({
      message: "Error al obtener el trabajador.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const create = async (req, res) => {
  try {
    const { payload, errors } = buildPayload(req.body, { partial: false });
    if (errors.length > 0) {
      await cleanupUploadedFilesIfPresent(req);
      return res.status(400).json({ message: errors.join(" ") });
    }
    applyAvatarToPayload(req, payload, { partial: false });
    const trabajador = await Trabajador.create(payload);
    return res.status(201).json({
      message: "Trabajador creado correctamente.",
      trabajador,
    });
  } catch (error) {
    await cleanupUploadedFilesIfPresent(req);
    logError("Error al crear trabajador.", error);
    return res.status(500).json({
      message: "Error al crear trabajador.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const trabajador = await Trabajador.findByPk(id);
    if (!trabajador || trabajador.bajaLogica) {
      await cleanupUploadedFilesIfPresent(req);
      return res.status(404).json({ message: "Trabajador no encontrado." });
    }
    const { payload, errors } = buildPayload(req.body, { partial: true });
    if (errors.length > 0) {
      await cleanupUploadedFilesIfPresent(req);
      return res.status(400).json({ message: errors.join(" ") });
    }
    applyEstadoBajaSideEffects(trabajador, payload);
    applyAvatarToPayload(req, payload, { partial: true });
    if (Object.keys(payload).length === 0) {
      await cleanupUploadedFilesIfPresent(req);
      return res.status(400).json({ message: "No hay campos para actualizar." });
    }
    const oldAvatar = trabajador.avatar;
    await trabajador.update(payload);
    const newAvatar = payload.avatar !== undefined ? payload.avatar : oldAvatar;
    if (oldAvatar && oldAvatar !== newAvatar) {
      await safeDeleteStoredUpload(oldAvatar);
    }
    const updated = await Trabajador.findByPk(id);
    return res.status(200).json({
      message: "Trabajador actualizado correctamente.",
      trabajador: updated,
    });
  } catch (error) {
    await cleanupUploadedFilesIfPresent(req);
    logError("Error al actualizar trabajador.", error);
    return res.status(500).json({
      message: "Error al actualizar trabajador.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const trabajador = await Trabajador.findByPk(id);
    if (!trabajador || trabajador.bajaLogica) {
      return res.status(404).json({ message: "Trabajador no encontrado." });
    }
    await trabajador.update({
      bajaLogica: true,
      estado: "inactivo",
      fechaBaja: trabajador.fechaBaja || todayDateOnly(),
    });
    return res.status(200).json({ message: "Trabajador dado de baja correctamente." });
  } catch (error) {
    logError("Error al eliminar trabajador.", error);
    return res.status(500).json({
      message: "Error al eliminar trabajador.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
};
