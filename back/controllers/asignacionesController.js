const Asignacion = require("../models/Asignacion");
const Maquina = require("../models/Maquina");
const Proyecto = require("../models/Proyecto");
const Cliente = require("../models/Cliente");
const Trabajador = require("../models/Trabajador");

const ESTADOS_ASIGNACION = ["activa", "cerrada"];

const trimOrNull = (value) => {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
};

const todayStr = () => new Date().toISOString().slice(0, 10);

const normalizeFecha = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const str = String(value).trim();
  if (str === "") return null;
  const date = new Date(str);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const buildIncludes = (includeParam) => {
  const requested = String(includeParam || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const include = [];
  if (requested.includes("proyecto") || requested.includes("all")) {
    include.push({
      model: Proyecto,
      as: "proyecto",
      include: [{ model: Cliente, as: "cliente" }],
    });
  } else if (requested.length === 0) {
    include.push({ model: Proyecto, as: "proyecto" });
  }
  if (requested.includes("maquina") || requested.includes("all") || requested.length === 0) {
    include.push({ model: Maquina, as: "maquina" });
  }
  if (requested.includes("trabajador") || requested.includes("all")) {
    include.push({ model: Trabajador, as: "trabajador" });
  }
  return include;
};

const list = async (req, res) => {
  try {
    const { estado, maquinaId, proyectoId, include } = req.query;
    const where = {};
    if (estado) {
      if (!ESTADOS_ASIGNACION.includes(estado)) {
        return res.status(400).json({ message: "Estado inválido." });
      }
      where.estado = estado;
    }
    if (maquinaId) where.maquinaId = maquinaId;
    if (proyectoId) where.proyectoId = proyectoId;

    const asignaciones = await Asignacion.findAll({
      where,
      include: buildIncludes(include),
      order: [
        ["fechaInicio", "DESC"],
        ["createdAt", "DESC"],
      ],
    });
    return res.status(200).json({ asignaciones });
  } catch (error) {
    return res.status(500).json({
      message: "Error al listar asignaciones.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getById = async (req, res) => {
  try {
    const asignacion = await Asignacion.findByPk(req.params.id, {
      include: buildIncludes("all"),
    });
    if (!asignacion) {
      return res.status(404).json({ message: "Asignación no encontrada." });
    }
    return res.status(200).json({ asignacion });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener la asignación.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const create = async (req, res) => {
  try {
    const maquinaId = trimOrNull(req.body.maquinaId);
    const proyectoId = trimOrNull(req.body.proyectoId);
    if (!maquinaId || !proyectoId) {
      return res
        .status(400)
        .json({ message: "maquinaId y proyectoId son obligatorios." });
    }

    const maquina = await Maquina.findByPk(maquinaId);
    if (!maquina) {
      return res.status(404).json({ message: "Máquina no encontrada." });
    }
    const proyecto = await Proyecto.findByPk(proyectoId);
    if (!proyecto) {
      return res.status(404).json({ message: "Proyecto no encontrado." });
    }

    const trabajadorId = trimOrNull(req.body.trabajadorId);
    if (trabajadorId) {
      const trabajador = await Trabajador.findByPk(trabajadorId);
      if (!trabajador) {
        return res.status(404).json({ message: "Trabajador no encontrado." });
      }
    }

    let estado = trimOrNull(req.body.estado) || "activa";
    if (!ESTADOS_ASIGNACION.includes(estado)) {
      return res.status(400).json({ message: "Estado inválido." });
    }

    const fechaInicio = normalizeFecha(req.body.fechaInicio) || todayStr();
    const fechaFin =
      req.body.fechaFin !== undefined ? normalizeFecha(req.body.fechaFin) : null;

    if (estado === "activa") {
      const existing = await Asignacion.findOne({
        where: { maquinaId, estado: "activa" },
      });
      if (existing) {
        return res.status(409).json({
          message: "Esta máquina ya tiene una asignación activa.",
        });
      }
    }

    const created = await Asignacion.create({
      maquinaId,
      proyectoId,
      trabajadorId: trabajadorId || null,
      fechaInicio,
      fechaFin,
      estado,
    });

    const asignacion = await Asignacion.findByPk(created.id, {
      include: buildIncludes("all"),
    });
    return res.status(201).json({
      message: "Asignación creada correctamente.",
      asignacion,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al crear asignación.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const asignacion = await Asignacion.findByPk(id);
    if (!asignacion) {
      return res.status(404).json({ message: "Asignación no encontrada." });
    }

    const updates = {};

    if (req.body.proyectoId !== undefined) {
      const proyectoId = trimOrNull(req.body.proyectoId);
      if (proyectoId) {
        const proyecto = await Proyecto.findByPk(proyectoId);
        if (!proyecto) {
          return res.status(404).json({ message: "Proyecto no encontrado." });
        }
        updates.proyectoId = proyectoId;
      }
    }

    if (req.body.trabajadorId !== undefined) {
      const trabajadorId = trimOrNull(req.body.trabajadorId);
      if (trabajadorId) {
        const trabajador = await Trabajador.findByPk(trabajadorId);
        if (!trabajador) {
          return res.status(404).json({ message: "Trabajador no encontrado." });
        }
      }
      updates.trabajadorId = trabajadorId || null;
    }

    if (req.body.fechaInicio !== undefined) {
      const fi = normalizeFecha(req.body.fechaInicio);
      if (fi === null && req.body.fechaInicio !== null && req.body.fechaInicio !== "") {
        return res.status(400).json({ message: "fechaInicio inválida." });
      }
      updates.fechaInicio = fi;
    }
    if (req.body.fechaFin !== undefined) {
      const ff = normalizeFecha(req.body.fechaFin);
      if (ff === null && req.body.fechaFin !== null && req.body.fechaFin !== "") {
        return res.status(400).json({ message: "fechaFin inválida." });
      }
      updates.fechaFin = ff;
    }

    if (req.body.estado !== undefined) {
      const estado = trimOrNull(req.body.estado);
      if (!estado || !ESTADOS_ASIGNACION.includes(estado)) {
        return res.status(400).json({ message: "Estado inválido." });
      }
      updates.estado = estado;
      if (estado === "cerrada" && updates.fechaFin === undefined && !asignacion.fechaFin) {
        updates.fechaFin = todayStr();
      }
      if (estado === "activa") {
        const existing = await Asignacion.findOne({
          where: { maquinaId: asignacion.maquinaId, estado: "activa" },
        });
        if (existing && existing.id !== asignacion.id) {
          return res.status(409).json({
            message: "Esta máquina ya tiene una asignación activa.",
          });
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No hay campos para actualizar." });
    }

    await asignacion.update(updates);
    const updated = await Asignacion.findByPk(id, {
      include: buildIncludes("all"),
    });
    return res.status(200).json({
      message: "Asignación actualizada correctamente.",
      asignacion: updated,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al actualizar asignación.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const asignacion = await Asignacion.findByPk(id);
    if (!asignacion) {
      return res.status(404).json({ message: "Asignación no encontrada." });
    }
    await asignacion.destroy();
    return res
      .status(200)
      .json({ message: "Asignación eliminada correctamente." });
  } catch (error) {
    return res.status(500).json({
      message: "Error al eliminar asignación.",
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
