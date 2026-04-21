const { Op } = require("sequelize");
const Articulo = require("../models/Articulo");

const listArticulos = async (req, res) => {
  try {
    const { q } = req.query;
    const where = {};
    if (q && String(q).trim()) {
      const term = `%${String(q).trim()}%`;
      where[Op.or] = [
        { nombre: { [Op.like]: term } },
        { categoria: { [Op.like]: term } },
      ];
    }
    const articulos = await Articulo.findAll({
      where,
      order: [["nombre", "ASC"]],
    });
    return res.status(200).json({ articulos });
  } catch (error) {
    return res.status(500).json({
      message: "Error al listar artículos.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getArticuloById = async (req, res) => {
  try {
    const { id } = req.params;
    const articulo = await Articulo.findByPk(id);
    if (!articulo) {
      return res.status(404).json({ message: "Artículo no encontrado." });
    }
    return res.status(200).json({ articulo });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener el artículo.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const createArticulo = async (req, res) => {
  try {
    const { nombre, categoria } = req.body;
    if (!nombre || !String(nombre).trim()) {
      return res.status(400).json({ message: "El nombre es obligatorio." });
    }
    if (!categoria || !String(categoria).trim()) {
      return res.status(400).json({ message: "La categoría es obligatoria." });
    }
    const created = await Articulo.create({
      nombre: nombre.trim(),
      categoria: categoria.trim(),
    });
    return res.status(201).json({
      message: "Artículo creado correctamente.",
      articulo: created,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al crear artículo.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateArticulo = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, categoria } = req.body;
    const articulo = await Articulo.findByPk(id);
    if (!articulo) {
      return res.status(404).json({ message: "Artículo no encontrado." });
    }
    const updates = {};
    if (nombre !== undefined) {
      if (!nombre || !String(nombre).trim()) {
        return res.status(400).json({ message: "El nombre no puede estar vacío." });
      }
      updates.nombre = nombre.trim();
    }
    if (categoria !== undefined) {
      if (!categoria || !String(categoria).trim()) {
        return res.status(400).json({ message: "La categoría no puede estar vacía." });
      }
      updates.categoria = categoria.trim();
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No hay campos para actualizar." });
    }
    await articulo.update(updates);
    const updated = await Articulo.findByPk(id);
    return res.status(200).json({
      message: "Artículo actualizado correctamente.",
      articulo: updated,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al actualizar artículo.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deleteArticulo = async (req, res) => {
  try {
    const { id } = req.params;
    const articulo = await Articulo.findByPk(id);
    if (!articulo) {
      return res.status(404).json({ message: "Artículo no encontrado." });
    }
    await articulo.destroy();
    return res.status(200).json({ message: "Artículo eliminado correctamente." });
  } catch (error) {
    return res.status(500).json({
      message: "Error al eliminar artículo.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  listArticulos,
  getArticuloById,
  createArticulo,
  updateArticulo,
  deleteArticulo,
};
