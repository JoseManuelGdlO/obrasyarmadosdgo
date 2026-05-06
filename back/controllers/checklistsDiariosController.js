const { Op } = require("sequelize");
const ChecklistDiario = require("../models/ChecklistDiario");
const Maquina = require("../models/Maquina");
const MaquinaChecklistItem = require("../models/MaquinaChecklistItem");
const Trabajador = require("../models/Trabajador");

const trimOrNull = (value) => {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
};

const todayStr = () => new Date().toISOString().slice(0, 10);

const normalizeFecha = (value) => {
  if (value === undefined || value === null || value === "") return todayStr();
  const str = String(value).trim();
  if (str === "") return todayStr();
  const date = new Date(str);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

/**
 * Construye y persiste un nuevo ChecklistDiario.
 * Reutilizado tanto por el endpoint autenticado como por el público.
 */
const buildAndSaveChecklist = async ({ body, userId, source }) => {
  const maquinaId = trimOrNull(body.maquinaId);
  if (!maquinaId) {
    return { status: 400, message: "maquinaId es obligatorio." };
  }

  const maquina = await Maquina.findByPk(maquinaId);
  if (!maquina) {
    return { status: 404, message: "Máquina no encontrada." };
  }

  const operador = trimOrNull(body.operador);
  if (!operador) {
    return { status: 400, message: "El nombre del operador es obligatorio." };
  }

  const fecha = normalizeFecha(body.fecha);
  if (fecha === null) {
    return { status: 400, message: "Fecha inválida." };
  }

  const items = await MaquinaChecklistItem.findAll({
    where: { maquinaId },
    order: [["orden", "ASC"]],
  });
  if (items.length === 0) {
    return {
      status: 400,
      message: "Esta máquina no tiene checklist configurado.",
    };
  }

  const itemsSnapshot = items.map((it) => ({
    id: it.id,
    label: it.label,
    itemType: it.itemType,
    unit: it.unit,
    orden: it.orden,
  }));

  const validItemIds = new Set(items.map((it) => it.id));
  const checkItemIds = new Set(
    items.filter((it) => it.itemType === "check").map((it) => it.id)
  );

  const respuestasInput =
    body.respuestas && typeof body.respuestas === "object" ? body.respuestas : {};
  const lecturasInput =
    body.lecturas && typeof body.lecturas === "object" ? body.lecturas : {};

  const respuestas = {};
  for (const [key, value] of Object.entries(respuestasInput)) {
    if (validItemIds.has(key)) {
      respuestas[key] = Boolean(value);
    }
  }
  const lecturas = {};
  for (const [key, value] of Object.entries(lecturasInput)) {
    if (validItemIds.has(key)) {
      const num = Number(value);
      if (Number.isFinite(num)) {
        lecturas[key] = num;
      }
    }
  }

  const itemsTotal = checkItemIds.size;
  let itemsOk = 0;
  for (const id of checkItemIds) {
    if (respuestas[id] === true) itemsOk += 1;
  }

  let trabajadorId = trimOrNull(body.trabajadorId);
  let trabajadorNombre = trimOrNull(body.trabajadorNombre);
  if (trabajadorId) {
    const trabajador = await Trabajador.findByPk(trabajadorId);
    if (!trabajador) {
      return { status: 400, message: "Trabajador no encontrado." };
    }
    trabajadorNombre = trabajador.nombre;
  }

  const checklistDiario = await ChecklistDiario.create({
    maquinaId,
    fecha,
    operador,
    trabajadorId: trabajadorId || null,
    trabajadorNombre: trabajadorNombre || null,
    lecturas,
    respuestas,
    itemsSnapshot,
    itemsTotal,
    itemsOk,
    observaciones: trimOrNull(body.observaciones),
    notas: trimOrNull(body.notas),
    userId: userId || null,
    source: source === "publico" ? "publico" : "interno",
  });

  return { status: 201, checklistDiario };
};

const list = async (req, res) => {
  try {
    const { maquinaId, fechaDesde, fechaHasta, source } = req.query;
    const where = {};
    if (maquinaId) where.maquinaId = maquinaId;
    if (source && ["interno", "publico"].includes(source)) where.source = source;
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) where.fecha[Op.gte] = fechaDesde;
      if (fechaHasta) where.fecha[Op.lte] = fechaHasta;
    }
    const checklistsDiarios = await ChecklistDiario.findAll({
      where,
      order: [
        ["fecha", "DESC"],
        ["createdAt", "DESC"],
      ],
    });
    return res.status(200).json({ checklistsDiarios });
  } catch (error) {
    return res.status(500).json({
      message: "Error al listar checklists diarios.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getById = async (req, res) => {
  try {
    const checklistDiario = await ChecklistDiario.findByPk(req.params.id, {
      include: [
        { model: Maquina, as: "maquina" },
        { model: Trabajador, as: "trabajador" },
      ],
    });
    if (!checklistDiario) {
      return res.status(404).json({ message: "Checklist no encontrado." });
    }
    return res.status(200).json({ checklistDiario });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener el checklist.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const create = async (req, res) => {
  try {
    const result = await buildAndSaveChecklist({
      body: req.body || {},
      userId: req.user?.id || null,
      source: "interno",
    });
    if (result.status !== 201) {
      return res.status(result.status).json({ message: result.message });
    }
    return res.status(201).json({
      message: "Checklist registrado correctamente.",
      checklistDiario: result.checklistDiario,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al registrar checklist.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  list,
  getById,
  create,
  buildAndSaveChecklist,
};
