const Cliente = require("../models/Cliente");

const listClientes = async (_req, res) => {
  try {
    const clientes = await Cliente.findAll({ order: [["nombre", "ASC"]] });
    return res.status(200).json({ clientes });
  } catch (error) {
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
    return res.status(200).json({ cliente });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener el cliente.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const createCliente = async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre || !String(nombre).trim()) {
      return res.status(400).json({ message: "El nombre es obligatorio." });
    }
    const created = await Cliente.create({ nombre: nombre.trim() });
    return res.status(201).json({
      message: "Cliente creado correctamente.",
      cliente: created,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al crear cliente.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    const cliente = await Cliente.findByPk(id);
    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado." });
    }
    if (nombre !== undefined) {
      if (!nombre || !String(nombre).trim()) {
        return res.status(400).json({ message: "El nombre no puede estar vacío." });
      }
      await cliente.update({ nombre: nombre.trim() });
    } else {
      return res.status(400).json({ message: "No hay campos para actualizar." });
    }
    const updated = await Cliente.findByPk(id);
    return res.status(200).json({
      message: "Cliente actualizado correctamente.",
      cliente: updated,
    });
  } catch (error) {
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
