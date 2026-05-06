const { Op } = require("sequelize");
const Proveedor = require("../models/Proveedor");

const ESTADOS_PROVEEDOR = ["activo", "inactivo", "en_evaluacion"];

const trimOrNull = (value) => {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
};

const normalizeEstado = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const str = String(value).trim().toLowerCase().replace(/\s+/g, "_");
  if (str === "en_evaluación" || str === "en_evaluacion") return "en_evaluacion";
  if (str === "activo") return "activo";
  if (str === "inactivo") return "inactivo";
  return null;
};

const normalizeStringArray = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => (item === null || item === undefined ? "" : String(item).trim()))
      .filter((item) => item.length > 0);
  }
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const normalizeNumber = (value, { decimals = 2, min, max } = {}) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return 0;
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  let rounded = Number(num.toFixed(decimals));
  if (typeof min === "number" && rounded < min) rounded = min;
  if (typeof max === "number" && rounded > max) rounded = max;
  return rounded;
};

const normalizeInt = (value, { min = 0 } = {}) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return 0;
  const num = parseInt(value, 10);
  if (Number.isNaN(num)) return null;
  return num < min ? min : num;
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

  if (body.categoria !== undefined) {
    payload.categoria = trimOrNull(body.categoria) || "general";
  } else if (!partial) {
    payload.categoria = "general";
  }

  if (body.contacto !== undefined) payload.contacto = trimOrNull(body.contacto);
  if (body.contactoPrincipal !== undefined)
    payload.contactoPrincipal = trimOrNull(body.contactoPrincipal);
  if (body.telefono !== undefined) payload.telefono = trimOrNull(body.telefono);
  if (body.email !== undefined) payload.email = trimOrNull(body.email);
  if (body.direccion !== undefined) payload.direccion = trimOrNull(body.direccion);
  if (body.ciudad !== undefined) payload.ciudad = trimOrNull(body.ciudad);
  if (body.tiempoRespuesta !== undefined)
    payload.tiempoRespuesta = trimOrNull(body.tiempoRespuesta);

  if (body.especialidades !== undefined) {
    payload.especialidades = normalizeStringArray(body.especialidades);
  }
  if (body.certificaciones !== undefined) {
    payload.certificaciones = normalizeStringArray(body.certificaciones);
  }

  if (body.calificacion !== undefined) {
    const cal = normalizeNumber(body.calificacion, { decimals: 1, min: 0, max: 5 });
    if (cal === null) {
      errors.push("La calificación debe ser un número válido.");
    } else {
      payload.calificacion = cal;
    }
  }
  if (body.costoPromedio !== undefined) {
    const costo = normalizeNumber(body.costoPromedio, { decimals: 2, min: 0 });
    if (costo === null) {
      errors.push("El costo promedio debe ser un número válido.");
    } else {
      payload.costoPromedio = costo;
    }
  }
  if (body.ordenesCompletadas !== undefined) {
    const ord = normalizeInt(body.ordenesCompletadas, { min: 0 });
    if (ord === null) {
      errors.push("Las órdenes completadas deben ser un entero válido.");
    } else {
      payload.ordenesCompletadas = ord;
    }
  }

  if (body.estado !== undefined) {
    const estado = normalizeEstado(body.estado);
    if (estado === null) {
      errors.push(`El estado debe ser uno de: ${ESTADOS_PROVEEDOR.join(", ")}.`);
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
        { categoria: { [Op.like]: term } },
        { contacto: { [Op.like]: term } },
        { contactoPrincipal: { [Op.like]: term } },
        { email: { [Op.like]: term } },
        { ciudad: { [Op.like]: term } },
      ];
    }
    const proveedores = await Proveedor.findAll({
      where,
      order: [["nombre", "ASC"]],
    });
    return res.status(200).json({ proveedores });
  } catch (error) {
    return res.status(500).json({
      message: "Error al listar proveedores.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getById = async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) {
      return res.status(404).json({ message: "Proveedor no encontrado." });
    }
    return res.status(200).json({ proveedor });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener el proveedor.",
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
    const proveedor = await Proveedor.create(payload);
    return res.status(201).json({
      message: "Proveedor creado correctamente.",
      proveedor,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al crear proveedor.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const proveedor = await Proveedor.findByPk(id);
    if (!proveedor) {
      return res.status(404).json({ message: "Proveedor no encontrado." });
    }
    const { payload, errors } = buildPayload(req.body, { partial: true });
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(" ") });
    }
    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: "No hay campos para actualizar." });
    }
    await proveedor.update(payload);
    const updated = await Proveedor.findByPk(id);
    return res.status(200).json({
      message: "Proveedor actualizado correctamente.",
      proveedor: updated,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al actualizar proveedor.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const proveedor = await Proveedor.findByPk(id);
    if (!proveedor) {
      return res.status(404).json({ message: "Proveedor no encontrado." });
    }
    await proveedor.destroy();
    return res.status(200).json({ message: "Proveedor eliminado correctamente." });
  } catch (error) {
    return res.status(500).json({
      message: "Error al eliminar proveedor.",
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
