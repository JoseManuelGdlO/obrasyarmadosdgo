const { Op } = require("sequelize");
const sequelize = require("../config/database");
const Articulo = require("../models/Articulo");
const MovimientoInventario = require("../models/MovimientoInventario");

const TIPOS = ["entrada", "salida", "ajuste"];

const listMovimientos = async (req, res) => {
  try {
    const { articuloId, tipo, from, to } = req.query;
    const where = {};
    if (articuloId) where.articuloId = articuloId;
    if (tipo && TIPOS.includes(String(tipo))) where.tipo = tipo;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt[Op.gte] = new Date(from);
      if (to) where.createdAt[Op.lte] = new Date(to);
    }
    const movimientos = await MovimientoInventario.findAll({
      where,
      include: [{ model: Articulo, as: "articulo", required: false }],
      order: [["createdAt", "DESC"]],
      limit: 200,
    });
    return res.status(200).json({ movimientos });
  } catch (error) {
    return res.status(500).json({
      message: "Error al listar movimientos.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const listKardexArticulo = async (req, res) => {
  try {
    const { id } = req.params;
    const { from, to, tipo } = req.query;
    const where = { articuloId: id };
    if (tipo && TIPOS.includes(String(tipo))) where.tipo = tipo;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt[Op.gte] = new Date(from);
      if (to) where.createdAt[Op.lte] = new Date(to);
    }
    const movimientos = await MovimientoInventario.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: 500,
    });
    return res.status(200).json({ movimientos });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener kardex del artículo.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const createMovimiento = async (req, res) => {
  const tx = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { tipo, cantidad, motivo, referencia, costoUnitario } = req.body;
    if (!TIPOS.includes(tipo)) {
      await tx.rollback();
      return res.status(400).json({ message: "Tipo de movimiento inválido." });
    }
    const qty = Number(cantidad);
    if (!Number.isFinite(qty) || qty <= 0) {
      await tx.rollback();
      return res.status(400).json({ message: "cantidad debe ser mayor a cero." });
    }
    if (!motivo || !String(motivo).trim()) {
      await tx.rollback();
      return res.status(400).json({ message: "motivo es obligatorio." });
    }

    const articulo = await Articulo.findByPk(id, { transaction: tx, lock: tx.LOCK.UPDATE });
    if (!articulo) {
      await tx.rollback();
      return res.status(404).json({ message: "Artículo no encontrado." });
    }

    const stockAnterior = Number(articulo.stockActual || 0);
    let stockNuevo = stockAnterior;
    if (tipo === "entrada") stockNuevo = stockAnterior + qty;
    if (tipo === "salida") stockNuevo = stockAnterior - qty;
    if (tipo === "ajuste") stockNuevo = qty;
    if (stockNuevo < 0) {
      await tx.rollback();
      return res.status(400).json({ message: "La salida deja stock negativo." });
    }

    await articulo.update(
      {
        stockActual: stockNuevo,
        ...(costoUnitario !== undefined && costoUnitario !== null
          ? { precioUnitario: Number(costoUnitario) }
          : {}),
      },
      { transaction: tx }
    );

    const movimiento = await MovimientoInventario.create(
      {
        articuloId: id,
        tipo,
        cantidad: qty,
        stockAnterior,
        stockNuevo,
        motivo: String(motivo).trim(),
        referencia: referencia ? String(referencia).trim() : null,
        costoUnitario:
          costoUnitario !== undefined && costoUnitario !== null
            ? Number(costoUnitario)
            : null,
        userId: req.user?.id || null,
      },
      { transaction: tx }
    );

    await tx.commit();
    return res.status(201).json({
      message: "Movimiento registrado correctamente.",
      movimiento,
      articulo,
    });
  } catch (error) {
    await tx.rollback();
    return res.status(500).json({
      message: "Error al registrar movimiento.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const listAlertasStockMinimo = async (_req, res) => {
  try {
    const articulos = await Articulo.findAll({
      where: sequelize.where(
        sequelize.cast(sequelize.col("stockActual"), "SIGNED"),
        Op.lte,
        sequelize.cast(sequelize.col("stockMinimo"), "SIGNED")
      ),
      order: [["stockActual", "ASC"]],
    });
    return res.status(200).json({ alertas: articulos });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener alertas de stock mínimo.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  listMovimientos,
  listKardexArticulo,
  createMovimiento,
  listAlertasStockMinimo,
};
