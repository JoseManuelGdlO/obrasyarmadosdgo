const { Op } = require("sequelize");
const Articulo = require("../models/Articulo");

const listArticulos = async (req, res) => {
  try {
    const { q, categoria, belowMin } = req.query;
    const where = {};
    if (q && String(q).trim()) {
      const term = `%${String(q).trim()}%`;
      where[Op.or] = [
        { nombre: { [Op.like]: term } },
        { categoria: { [Op.like]: term } },
        { codigo: { [Op.like]: term } },
        { proveedor: { [Op.like]: term } },
      ];
    }
    if (categoria && String(categoria).trim()) {
      where.categoria = String(categoria).trim();
    }
    if (String(belowMin || "") === "true") {
      where.stockActual = { [Op.lte]: Articulo.sequelize.col("stockMinimo") };
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
    const {
      nombre,
      categoria,
      codigo,
      stockActual,
      stockMinimo,
      precioUnitario,
      proveedor,
      ubicacion,
      unidad,
    } = req.body;
    if (!nombre || !String(nombre).trim()) {
      return res.status(400).json({ message: "El nombre es obligatorio." });
    }
    if (!categoria || !String(categoria).trim()) {
      return res.status(400).json({ message: "La categoría es obligatoria." });
    }
    const created = await Articulo.create({
      nombre: nombre.trim(),
      categoria: categoria.trim(),
      codigo: codigo ? String(codigo).trim() : null,
      stockActual: Number(stockActual ?? 0),
      stockMinimo: Number(stockMinimo ?? 0),
      precioUnitario: Number(precioUnitario ?? 0),
      proveedor: proveedor ? String(proveedor).trim() : null,
      ubicacion: ubicacion ? String(ubicacion).trim() : null,
      unidad: unidad ? String(unidad).trim() : "unidad",
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
    const {
      nombre,
      categoria,
      codigo,
      stockActual,
      stockMinimo,
      precioUnitario,
      proveedor,
      ubicacion,
      unidad,
    } = req.body;
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
    if (codigo !== undefined) {
      updates.codigo = codigo ? String(codigo).trim() : null;
    }
    if (stockActual !== undefined) {
      updates.stockActual = Number(stockActual);
    }
    if (stockMinimo !== undefined) {
      updates.stockMinimo = Number(stockMinimo);
    }
    if (precioUnitario !== undefined) {
      updates.precioUnitario = Number(precioUnitario);
    }
    if (proveedor !== undefined) {
      updates.proveedor = proveedor ? String(proveedor).trim() : null;
    }
    if (ubicacion !== undefined) {
      updates.ubicacion = ubicacion ? String(ubicacion).trim() : null;
    }
    if (unidad !== undefined) {
      updates.unidad = unidad ? String(unidad).trim() : "unidad";
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

const getInventarioResumen = async (_req, res) => {
  try {
    const articulos = await Articulo.findAll();
    const resumen = articulos.reduce(
      (acc, a) => {
        const stock = Number(a.stockActual || 0);
        const min = Number(a.stockMinimo || 0);
        const precio = Number(a.precioUnitario || 0);
        if (stock <= 0) acc.agotados += 1;
        else if (stock <= min) acc.stockBajo += 1;
        else acc.disponibles += 1;
        acc.valorTotal += stock * precio;
        return acc;
      },
      { disponibles: 0, stockBajo: 0, agotados: 0, valorTotal: 0, totalArticulos: articulos.length }
    );
    return res.status(200).json({ resumen });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener resumen de inventario.",
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
  getInventarioResumen,
};
