const Cliente = require("../models/Cliente");
const Proyecto = require("../models/Proyecto");
const { logError } = require("../utils/logger");

const attachProyectoCounts = async (clientes) => {
  if (!clientes.length) return [];

  const proyectoCounts = await Proyecto.count({
    where: { clienteId: clientes.map((cliente) => cliente.id) },
    group: ["clienteId"],
  });

  const countByCliente = new Map(
    proyectoCounts.map((row) => [row.clienteId, row.count])
  );

  return clientes.map((cliente) => {
    const json = cliente.toJSON();
    json.proyectosActivos = countByCliente.get(cliente.id) ?? 0;
    return json;
  });
};

const listClientes = async (_req, res) => {
  try {
    const clientes = await Cliente.findAll({ order: [["nombre", "ASC"]] });
    const clientesWithCounts = await attachProyectoCounts(clientes);
    return res.status(200).json({ clientes: clientesWithCounts });
  } catch (error) {
    logError("Error al listar clientes.", error);
    return res.status(500).json({
      message: "Error al listar clientes.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getClienteById = async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await Cliente.findByPk(id);
    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado." });
    }
    const [clienteWithCount] = await attachProyectoCounts([cliente]);
    return res.status(200).json({ cliente: clienteWithCount });
  } catch (error) {
    logError("Error al obtener el cliente.", error);
    return res.status(500).json({
      message: "Error al obtener el cliente.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const createCliente = async (req, res) => {
  try {
    const {
      nombre,
      tipoIndustria,
      pais,
      ciudad,
      encargadoNombre,
      telefono,
      estado,
    } = req.body;
    if (!nombre || !String(nombre).trim()) {
      return res.status(400).json({ message: "El nombre es obligatorio." });
    }
    const created = await Cliente.create({
      nombre: nombre.trim(),
      ...(tipoIndustria !== undefined ? { tipoIndustria } : {}),
      ...(pais !== undefined ? { pais } : {}),
      ...(ciudad !== undefined ? { ciudad } : {}),
      ...(encargadoNombre !== undefined ? { encargadoNombre } : {}),
      ...(telefono !== undefined ? { telefono } : {}),
      ...(estado !== undefined ? { estado } : {}),
    });
    const [clienteWithCount] = await attachProyectoCounts([created]);
    return res.status(201).json({
      message: "Cliente creado correctamente.",
      cliente: clienteWithCount,
    });
  } catch (error) {
    logError("Error al crear cliente.", error);
    return res.status(500).json({
      message: "Error al crear cliente.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = [
      "nombre",
      "tipoIndustria",
      "pais",
      "ciudad",
      "encargadoNombre",
      "telefono",
      "estado",
    ];
    const updates = {};
    const cliente = await Cliente.findByPk(id);
    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado." });
    }
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    if (updates.nombre !== undefined) {
      if (!updates.nombre || !String(updates.nombre).trim()) {
        return res.status(400).json({ message: "El nombre no puede estar vacío." });
      }
      updates.nombre = String(updates.nombre).trim();
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No hay campos para actualizar." });
    }
    await cliente.update(updates);
    const updated = await Cliente.findByPk(id);
    const [clienteWithCount] = await attachProyectoCounts([updated]);
    return res.status(200).json({
      message: "Cliente actualizado correctamente.",
      cliente: clienteWithCount,
    });
  } catch (error) {
    logError("Error al actualizar cliente.", error);
    return res.status(500).json({
      message: "Error al actualizar cliente.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await Cliente.findByPk(id);
    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado." });
    }
    await cliente.destroy();
    return res.status(200).json({ message: "Cliente eliminado correctamente." });
  } catch (error) {
    logError("Error al eliminar cliente.", error);
    return res.status(500).json({
      message: "Error al eliminar cliente.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  listClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
};
