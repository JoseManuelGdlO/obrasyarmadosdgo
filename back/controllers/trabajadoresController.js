const { Op } = require("sequelize");
const Trabajador = require("../models/Trabajador");

const ESTADOS_TRABAJADOR = ["activo", "inactivo", "vacaciones", "licencia"];

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

const normalizeFecha = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const str = String(value).trim();
  if (str === "") return null;
  const date = new Date(str);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
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
    const fecha = normalizeFecha(body.fechaIngreso);
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

const list = async (req, res) => {
  try {
    const { q } = req.query;
    const where = {};
    if (q && String(q).trim()) {
      const term = `%${String(q).trim()}%`;
      where[Op.or] = [
        { nombre: { [Op.like]: term } },
        { puesto: { [Op.like]: term } },
        { cargo: { [Op.like]: term } },
        { email: { [Op.like]: term } },
        { departamento: { [Op.like]: term } },
        { especialidad: { [Op.like]: term } },
      ];
    }
    const trabajadores = await Trabajador.findAll({
      where,
      order: [["nombre", "ASC"]],
    });
    return res.status(200).json({ trabajadores });
  } catch (error) {
    return res.status(500).json({
      message: "Error al listar trabajadores.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getById = async (req, res) => {
  try {
    const trabajador = await Trabajador.findByPk(req.params.id);
    if (!trabajador) {
      return res.status(404).json({ message: "Trabajador no encontrado." });
    }
    return res.status(200).json({ trabajador });
  } catch (error) {
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
      return res.status(400).json({ message: errors.join(" ") });
    }
    const trabajador = await Trabajador.create(payload);
    return res.status(201).json({
      message: "Trabajador creado correctamente.",
      trabajador,
    });
  } catch (error) {
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
    if (!trabajador) {
      return res.status(404).json({ message: "Trabajador no encontrado." });
    }
    const { payload, errors } = buildPayload(req.body, { partial: true });
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(" ") });
    }
    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: "No hay campos para actualizar." });
    }
    await trabajador.update(payload);
    const updated = await Trabajador.findByPk(id);
    return res.status(200).json({
      message: "Trabajador actualizado correctamente.",
      trabajador: updated,
    });
  } catch (error) {
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
    if (!trabajador) {
      return res.status(404).json({ message: "Trabajador no encontrado." });
    }
    await trabajador.destroy();
    return res.status(200).json({ message: "Trabajador eliminado correctamente." });
  } catch (error) {
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
