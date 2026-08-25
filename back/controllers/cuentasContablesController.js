const { Op } = require("sequelize");
const CuentaContable = require("../models/CuentaContable");
const Proveedor = require("../models/Proveedor");
const { logError } = require("../utils/logger");

const DIGITS_ONLY = /^\d+$/;

const trimOrNull = (value) => {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
};

const normalizeNumero = (value) => {
  if (value === undefined) return undefined;
  const num = trimOrNull(value);
  if (num === null) return null;
  if (!DIGITS_ONLY.test(num)) {
    return { error: "El número de cuenta solo puede contener dígitos." };
  }
  return num;
};

const isUniqueViolation = (error) =>
  error?.name === "SequelizeUniqueConstraintError" ||
  error?.original?.code === "ER_DUP_ENTRY";

const buildPayload = (body, { partial = false } = {}) => {
  const payload = {};
  const errors = [];

  if (!partial || body.numero !== undefined) {
    const numero = normalizeNumero(body.numero);
    if (numero && typeof numero === "object" && numero.error) {
      errors.push(numero.error);
    } else if (!numero) {
      errors.push("El número de cuenta es obligatorio.");
    } else {
      payload.numero = numero;
    }
  }

  if (body.nombre !== undefined) payload.nombre = trimOrNull(body.nombre);
  if (body.activa !== undefined) {
    payload.activa =
      body.activa === true ||
      body.activa === "true" ||
      body.activa === 1 ||
      body.activa === "1";
  } else if (!partial) {
    payload.activa = true;
  }

  return { payload, errors };
};

const proveedorInclude = {
  model: Proveedor,
  as: "proveedor",
  attributes: ["id", "nombre"],
  required: false,
};

const list = async (req, res) => {
  try {
    const { q, disponibles, excludeProveedorId } = req.query;
    const where = {};

    if (q && String(q).trim()) {
      const term = `%${String(q).trim()}%`;
      where[Op.or] = [{ numero: { [Op.like]: term } }, { nombre: { [Op.like]: term } }];
    }

    const wantDisponibles =
      disponibles === "1" || disponibles === "true" || disponibles === true;

    if (wantDisponibles) {
      where.activa = true;
    }

    const rows = await CuentaContable.findAll({
      where,
      include: [proveedorInclude],
      order: [["numero", "ASC"]],
    });

    let filtered = rows;
    if (wantDisponibles) {
      const excludeId = excludeProveedorId ? String(excludeProveedorId).trim() : null;
      filtered = rows.filter((row) => {
        const assignedId = row.proveedor?.id ? String(row.proveedor.id) : null;
        if (!assignedId) return true;
        return excludeId && assignedId === excludeId;
      });
    }

    return res.status(200).json({ cuentasContables: filtered });
  } catch (error) {
    logError("Error al listar cuentas contables.", error);
    return res.status(500).json({ message: "Error al listar cuentas contables." });
  }
};

const getById = async (req, res) => {
  try {
    const row = await CuentaContable.findByPk(req.params.id, {
      include: [proveedorInclude],
    });
    if (!row) {
      return res.status(404).json({ message: "Cuenta contable no encontrada." });
    }
    return res.status(200).json({ cuentaContable: row });
  } catch (error) {
    logError("Error al obtener la cuenta contable.", error);
    return res.status(500).json({ message: "Error al obtener la cuenta contable." });
  }
};

const create = async (req, res) => {
  try {
    const { payload, errors } = buildPayload(req.body, { partial: false });
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(" ") });
    }
    const row = await CuentaContable.create(payload);
    const created = await CuentaContable.findByPk(row.id, {
      include: [proveedorInclude],
    });
    return res.status(201).json({
      message: "Cuenta contable creada correctamente.",
      cuentaContable: created,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return res.status(400).json({ message: "El número de cuenta ya existe." });
    }
    logError("Error al crear cuenta contable.", error);
    return res.status(500).json({ message: "Error al crear cuenta contable." });
  }
};

const update = async (req, res) => {
  try {
    const row = await CuentaContable.findByPk(req.params.id);
    if (!row) {
      return res.status(404).json({ message: "Cuenta contable no encontrada." });
    }
    const { payload, errors } = buildPayload(req.body, { partial: true });
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(" ") });
    }
    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: "No hay campos para actualizar." });
    }
    await row.update(payload);
    const updated = await CuentaContable.findByPk(row.id, {
      include: [proveedorInclude],
    });
    return res.status(200).json({
      message: "Cuenta contable actualizada correctamente.",
      cuentaContable: updated,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return res.status(400).json({ message: "El número de cuenta ya existe." });
    }
    logError("Error al actualizar cuenta contable.", error);
    return res.status(500).json({ message: "Error al actualizar cuenta contable." });
  }
};

const remove = async (req, res) => {
  try {
    const row = await CuentaContable.findByPk(req.params.id);
    if (!row) {
      return res.status(404).json({ message: "Cuenta contable no encontrada." });
    }
    const assigned = await Proveedor.findOne({
      where: { cuentaContableId: row.id },
    });
    if (assigned) {
      return res.status(400).json({
        message: "No se puede eliminar: la cuenta está asignada a un proveedor.",
      });
    }
    await row.destroy();
    return res.status(200).json({ message: "Cuenta contable eliminada correctamente." });
  } catch (error) {
    logError("Error al eliminar cuenta contable.", error);
    return res.status(500).json({ message: "Error al eliminar cuenta contable." });
  }
};

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
};
