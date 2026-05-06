const { Op } = require("sequelize");
const UsuarioMaquina = require("../models/UsuarioMaquina");
const Maquina = require("../models/Maquina");
const MaquinaChecklistItem = require("../models/MaquinaChecklistItem");
const MaquinaPlanServicio = require("../models/MaquinaPlanServicio");
const PlanServicioPieza = require("../models/PlanServicioPieza");
const Articulo = require("../models/Articulo");
const { ESTADOS_MAQUINA } = require("../models/Maquina");
const P = require("../constants/permissions");
const { hasMaquinasViewGlobal } = require("../middlewares/permissions");

const normalizeRequiredString = (value) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const buildIncludeFromQuery = (includeParam) => {
  if (!includeParam || typeof includeParam !== "string") {
    return [];
  }
  const parts = includeParam.split(",").map((s) => s.trim().toLowerCase());
  const includes = [];
  if (parts.includes("checklist")) {
    includes.push({
      model: MaquinaChecklistItem,
      as: "checklistItems",
      required: false,
      separate: true,
      order: [["orden", "ASC"]],
    });
  }
  if (parts.includes("planes")) {
    includes.push({
      model: MaquinaPlanServicio,
      as: "planesServicio",
      required: false,
      include: [
        {
          model: PlanServicioPieza,
          as: "piezas",
          required: false,
          include: [{ model: Articulo, as: "articulo", required: false }],
        },
      ],
    });
  }
  return includes;
};

const listMaquinas = async (req, res) => {
  try {
    const { search, tipo, estado, include: includeParam } = req.query;
    const where = {};

    if (tipo) {
      where.tipo = tipo;
    }
    if (estado) {
      if (!ESTADOS_MAQUINA.includes(estado)) {
        return res.status(400).json({ message: "Estado de máquina inválido." });
      }
      where.estado = estado;
    }
    if (search && String(search).trim()) {
      const term = `%${String(search).trim()}%`;
      where[Op.or] = [
        { nombre: { [Op.like]: term } },
        { tipo: { [Op.like]: term } },
        { placas: { [Op.like]: term } },
      ];
    }

    if (!hasMaquinasViewGlobal(req)) {
      const links = await UsuarioMaquina.findAll({
        where: { userId: req.user.id },
        attributes: ["maquinaId"],
      });
      const ids = links.map((l) => l.maquinaId);
      if (ids.length === 0) {
        return res.status(200).json({ maquinas: [] });
      }
      where.id = { [Op.in]: ids };
    }

    const include = buildIncludeFromQuery(includeParam);

    const maquinas = await Maquina.findAll({
      where,
      include,
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json({ maquinas });
  } catch (error) {
    return res.status(500).json({
      message: "Error al listar máquinas.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getMaquinaById = async (req, res) => {
  try {
    const { id } = req.params;
    const { include: includeParam } = req.query;
    const include = buildIncludeFromQuery(
      includeParam || "checklist,planes"
    );

    const maquina = await Maquina.findByPk(id, {
      include: include.length ? include : undefined,
    });
    if (!maquina) {
      return res.status(404).json({ message: "Máquina no encontrada." });
    }

    if (!hasMaquinasViewGlobal(req)) {
      const link = await UsuarioMaquina.findOne({
        where: { userId: req.user.id, maquinaId: id },
      });
      if (!link) {
        return res.status(403).json({
          message: "No tiene acceso a esta máquina.",
        });
      }
    }

    return res.status(200).json({ maquina });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener la máquina.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const createMaquina = async (req, res) => {
  try {
    if (!req.permissions?.has(P.MAQUINAS_CREATE)) {
      return res.status(403).json({
        message: "No tiene permisos para crear máquinas.",
      });
    }
    const body = req.body;
    const {
      nombre,
      tipo,
      marca,
      modelo,
      placas,
      numeroSerie,
      estado,
      horometroInicial,
      horometroActual,
      horometroFinal,
      disponibilidad,
      fechaAdquisicion,
      ubicacion,
      ultimoMantenimiento,
    } = body;

    const normalizedNombre = normalizeRequiredString(nombre);
    const normalizedTipo = normalizeRequiredString(tipo);
    const normalizedMarca = normalizeRequiredString(marca);
    const normalizedModelo = normalizeRequiredString(modelo);
    const normalizedPlacas = normalizeRequiredString(placas);
    const normalizedNumeroSerie = normalizeRequiredString(numeroSerie);
    const normalizedUbicacion = normalizeRequiredString(ubicacion);

    if (
      !normalizedNombre ||
      !normalizedTipo ||
      !normalizedMarca ||
      !normalizedModelo ||
      !normalizedPlacas ||
      !normalizedNumeroSerie
    ) {
      return res.status(400).json({
        message:
          "nombre, tipo, marca, modelo, placas y numeroSerie son obligatorios.",
      });
    }
    if (fechaAdquisicion === undefined || !normalizedUbicacion) {
      return res.status(400).json({
        message: "fechaAdquisicion y ubicacion son obligatorios.",
      });
    }
    if (estado !== undefined && !ESTADOS_MAQUINA.includes(estado)) {
      return res.status(400).json({ message: "Estado inválido." });
    }

    const created = await Maquina.create({
      nombre: normalizedNombre,
      tipo: normalizedTipo,
      marca: normalizedMarca,
      modelo: normalizedModelo,
      placas: normalizedPlacas,
      numeroSerie: normalizedNumeroSerie,
      ...(estado !== undefined ? { estado } : {}),
      horometroInicial: horometroInicial ?? 0,
      horometroActual: horometroActual ?? horometroInicial ?? 0,
      horometroFinal: horometroFinal ?? 0,
      disponibilidad: disponibilidad ?? 0,
      fechaAdquisicion,
      ubicacion: normalizedUbicacion,
      ultimoMantenimiento: ultimoMantenimiento ?? null,
    });

    const maquina = await Maquina.findByPk(created.id);
    return res.status(201).json({
      message: "Máquina creada correctamente.",
      maquina,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al crear máquina.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateMaquina = async (req, res) => {
  try {
    const { id } = req.params;
    const maquina = await Maquina.findByPk(id);
    if (!maquina) {
      return res.status(404).json({ message: "Máquina no encontrada." });
    }

    if (!req.permissions?.has(P.MAQUINAS_EDIT)) {
      if (!req.permissions.has(P.MAQUINAS_UPDATE_ASSIGNED)) {
        return res.status(403).json({
          message: "No tiene permisos para editar máquinas.",
        });
      }
      const link = await UsuarioMaquina.findOne({
        where: { userId: req.user.id, maquinaId: id },
      });
      if (!link) {
        return res.status(403).json({
          message: "No tiene acceso a esta máquina.",
        });
      }
    }

    const allowed = [
      "nombre",
      "tipo",
      "marca",
      "modelo",
      "placas",
      "numeroSerie",
      "estado",
      "horometroInicial",
      "horometroActual",
      "horometroFinal",
      "disponibilidad",
      "fechaAdquisicion",
      "ubicacion",
      "ultimoMantenimiento",
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const requiredStringFields = [
      "nombre",
      "tipo",
      "marca",
      "modelo",
      "placas",
      "numeroSerie",
      "ubicacion",
    ];
    for (const field of requiredStringFields) {
      if (updates[field] !== undefined) {
        const normalized = normalizeRequiredString(updates[field]);
        if (!normalized) {
          return res.status(400).json({
            message: `${field} no puede estar vacío.`,
          });
        }
        updates[field] = normalized;
      }
    }

    if (updates.estado !== undefined && !ESTADOS_MAQUINA.includes(updates.estado)) {
      return res.status(400).json({ message: "Estado inválido." });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No hay campos para actualizar." });
    }

    await maquina.update(updates);
    const updated = await Maquina.findByPk(id);
    return res.status(200).json({
      message: "Máquina actualizada correctamente.",
      maquina: updated,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al actualizar máquina.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deleteMaquina = async (req, res) => {
  try {
    if (!req.permissions?.has(P.MAQUINAS_DELETE)) {
      return res.status(403).json({
        message: "No tiene permisos para eliminar máquinas.",
      });
    }
    const { id } = req.params;
    const maquina = await Maquina.findByPk(id);
    if (!maquina) {
      return res.status(404).json({ message: "Máquina no encontrada." });
    }
    await maquina.destroy();
    return res.status(200).json({ message: "Máquina eliminada correctamente." });
  } catch (error) {
    return res.status(500).json({
      message: "Error al eliminar máquina.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  listMaquinas,
  getMaquinaById,
  createMaquina,
  updateMaquina,
  deleteMaquina,
};
