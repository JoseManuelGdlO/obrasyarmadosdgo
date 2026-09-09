const path = require("path");
const ExcelJS = require("exceljs");
const { Op } = require("sequelize");
const sequelize = require("../config/database");
const OrdenCompra = require("../models/OrdenCompra");
const OrdenCompraPartida = require("../models/OrdenCompraPartida");
const OrdenCompraFactura = require("../models/OrdenCompraFactura");
const {
  COMPRAS_UPLOADS_ROUTE,
  COMPRAS_IMPORTS_DIR,
  COMPRAS_FACTURAS_DIR,
} = require("../config/uploads");
const { cleanupUploadedPath } = require("../middlewares/uploadComprasFiles");
const { logError } = require("../utils/logger");

const SHEET_NAME = "Historial_Compras";

const HEADER_ALIASES = {
  fecha: ["fecha"],
  proyecto: ["proyecto"],
  proveedor: ["proveedor"],
  indice: ["indice", "índice"],
  cantidad: ["cantidad", "cant."],
  unidad: ["unidad"],
  nombreProducto: ["nombre del producto"],
  caracteristicas: ["caracteristicas", "características"],
  paraQueSeUsara: ["para que se usara", "para qué se usará", "para que se usará"],
  precioUnitario: ["precio unitario"],
  importeTotal: ["importe total"],
};

const normalizeHeader = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const trimStr = (value) => {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
};

const toNumber = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : fallback;
};

const toIndice = (value) => {
  if (value === undefined || value === null || value === "") return 0;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : 0;
};

const toDateOnly = (value) => {
  if (value === undefined || value === null || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    // Excel serial date
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(epoch.getTime() + value * 86400000);
    return toDateOnly(date);
  }
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) return toDateOnly(parsed);
  return null;
};

const publicPathFromDisk = (absolutePath, kind) => {
  const base = kind === "import" ? COMPRAS_IMPORTS_DIR : COMPRAS_FACTURAS_DIR;
  const filename = path.basename(absolutePath);
  const sub = kind === "import" ? "imports" : "facturas";
  return `${COMPRAS_UPLOADS_ROUTE}/${sub}/${filename}`;
};

const serializePartida = (p) => ({
  id: p.id,
  ordenCompraId: p.ordenCompraId,
  indice: p.indice,
  cantidad: Number(p.cantidad),
  unidad: p.unidad,
  nombreProducto: p.nombreProducto,
  caracteristicas: p.caracteristicas,
  paraQueSeUsara: p.paraQueSeUsara,
  quienRecibeMaterial: p.quienRecibeMaterial,
  quienLoUsa: p.quienLoUsa,
  quienLoPide: p.quienLoPide,
  precioUnitario: Number(p.precioUnitario),
  importeTotal: Number(p.importeTotal),
});

const serializeFactura = (f) => ({
  id: f.id,
  ordenCompraId: f.ordenCompraId,
  archivoPath: f.archivoPath,
  nombreOriginal: f.nombreOriginal,
  mimeType: f.mimeType,
  uploadedBy: f.uploadedBy,
  createdAt: f.createdAt,
});

const serializeOrden = (orden, { includeDetails = false } = {}) => {
  const partidas = orden.partidas || [];
  const facturas = orden.facturas || [];
  const base = {
    id: orden.id,
    fecha: orden.fecha,
    empresa: orden.empresa,
    clienteId: orden.clienteId,
    proyectoId: orden.proyectoId,
    proyecto: orden.proyecto,
    proveedor: orden.proveedor,
    total: Number(orden.total),
    archivoImportPath: orden.archivoImportPath,
    partidasCount: includeDetails ? partidas.length : partidas.length || Number(orden.get?.("partidasCount") || partidas.length || 0),
    facturasCount: includeDetails ? facturas.length : facturas.length || Number(orden.get?.("facturasCount") || facturas.length || 0),
    createdAt: orden.createdAt,
    updatedAt: orden.updatedAt,
  };
  if (includeDetails) {
    base.partidas = partidas.map(serializePartida);
    base.facturas = facturas.map(serializeFactura);
  }
  return base;
};

const mapHeaderRow = (rowValues) => {
  const map = {};
  rowValues.forEach((raw, idx) => {
    const norm = normalizeHeader(raw);
    if (!norm) return;
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.some((a) => normalizeHeader(a) === norm)) {
        map[field] = idx + 1; // exceljs 1-based
      }
    }
  });
  return map;
};

const recalculateOrdenTotal = async (ordenCompraId, transaction) => {
  const partidas = await OrdenCompraPartida.findAll({
    where: { ordenCompraId },
    attributes: ["importeTotal"],
    transaction,
  });
  const total = partidas.reduce((sum, p) => sum + Number(p.importeTotal || 0), 0);
  await OrdenCompra.update({ total }, { where: { id: ordenCompraId }, transaction });
  return total;
};

const create = async (req, res) => {
  try {
    const fecha = toDateOnly(req.body?.fecha) || trimStr(req.body?.fecha);
    const proyecto = trimStr(req.body?.proyecto);
    const proveedor = trimStr(req.body?.proveedor);
    const empresa = trimStr(req.body?.empresa);
    const clienteId = trimStr(req.body?.clienteId);
    const proyectoId = trimStr(req.body?.proyectoId);
    const rawPartidas = Array.isArray(req.body?.partidas) ? req.body.partidas : [];

    if (!fecha || !proyecto || !proveedor) {
      return res.status(400).json({
        message: "Fecha, proyecto y proveedor son obligatorios.",
      });
    }
    if (!empresa && !clienteId) {
      return res.status(400).json({
        message: "Empresa es obligatoria.",
      });
    }

    const partidasNorm = [];
    for (let i = 0; i < rawPartidas.length; i += 1) {
      const row = rawPartidas[i] || {};
      const nombreProducto = trimStr(row.nombreProducto);
      const cantidad = toNumber(row.cantidad, 0);
      const precioUnitario = toNumber(row.precioUnitario, 0);
      let importeTotal = toNumber(row.importeTotal, NaN);
      if (!Number.isFinite(importeTotal)) {
        importeTotal = Number((cantidad * precioUnitario).toFixed(4));
      }
      if (!nombreProducto) {
        return res.status(400).json({
          message: `La partida #${i + 1} requiere nombre del producto.`,
        });
      }
      if (cantidad <= 0) {
        return res.status(400).json({
          message: `La partida #${i + 1} requiere cantidad mayor a 0.`,
        });
      }
      partidasNorm.push({
        indice: toIndice(row.indice !== undefined && row.indice !== "" ? row.indice : i + 1),
        cantidad,
        unidad: trimStr(row.unidad),
        nombreProducto,
        caracteristicas: trimStr(row.caracteristicas),
        paraQueSeUsara: trimStr(row.paraQueSeUsara),
        quienRecibeMaterial: trimStr(row.quienRecibeMaterial),
        quienLoUsa: trimStr(row.quienLoUsa),
        quienLoPide: trimStr(row.quienLoPide),
        precioUnitario,
        importeTotal,
      });
    }

    if (partidasNorm.length === 0) {
      return res.status(400).json({ message: "Agrega al menos una partida." });
    }

    const existing = await OrdenCompra.findOne({ where: { fecha, proyecto, proveedor } });
    if (existing) {
      return res.status(409).json({
        message:
          "Ya existe una compra con la misma fecha, proyecto y proveedor. Ábrela desde la tabla para editar o adjuntar archivos.",
        ordenId: existing.id,
      });
    }

    const total = partidasNorm.reduce((sum, p) => sum + Number(p.importeTotal || 0), 0);

    const orden = await sequelize.transaction(async (transaction) => {
      const created = await OrdenCompra.create(
        {
          fecha,
          empresa,
          clienteId,
          proyectoId,
          proyecto,
          proveedor,
          total,
        },
        { transaction }
      );
      await OrdenCompraPartida.bulkCreate(
        partidasNorm.map((p) => ({ ...p, ordenCompraId: created.id })),
        { transaction }
      );
      return created;
    });

    const full = await OrdenCompra.findByPk(orden.id, {
      include: [
        { model: OrdenCompraPartida, as: "partidas" },
        { model: OrdenCompraFactura, as: "facturas" },
      ],
    });

    return res.status(201).json({
      message: "Compra registrada.",
      orden: serializeOrden(full, { includeDetails: true }),
    });
  } catch (error) {
    logError("compras.create", error);
    return res.status(500).json({ message: "Error creando la compra." });
  }
};

const list = async (req, res) => {
  try {
    const where = {};
    const proyecto = trimStr(req.query.proyecto);
    const proveedor = trimStr(req.query.proveedor);
    const empresa = trimStr(req.query.empresa);
    const fechaDesde = trimStr(req.query.fechaDesde);
    const fechaHasta = trimStr(req.query.fechaHasta);
    const q = trimStr(req.query.q);

    if (proyecto) where.proyecto = { [Op.like]: `%${proyecto}%` };
    if (proveedor) where.proveedor = { [Op.like]: `%${proveedor}%` };
    if (empresa) where.empresa = { [Op.like]: `%${empresa}%` };
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) where.fecha[Op.gte] = fechaDesde;
      if (fechaHasta) where.fecha[Op.lte] = fechaHasta;
    }
    if (q) {
      where[Op.or] = [
        { proyecto: { [Op.like]: `%${q}%` } },
        { proveedor: { [Op.like]: `%${q}%` } },
        { empresa: { [Op.like]: `%${q}%` } },
      ];
    }

    const ordenes = await OrdenCompra.findAll({
      where,
      include: [
        {
          model: OrdenCompraPartida,
          as: "partidas",
          attributes: [
            "id",
            "indice",
            "cantidad",
            "unidad",
            "nombreProducto",
            "caracteristicas",
            "paraQueSeUsara",
            "quienRecibeMaterial",
            "quienLoUsa",
            "quienLoPide",
            "precioUnitario",
            "importeTotal",
          ],
        },
        { model: OrdenCompraFactura, as: "facturas", attributes: ["id"] },
      ],
      order: [
        ["fecha", "DESC"],
        ["proyecto", "ASC"],
        ["proveedor", "ASC"],
        [{ model: OrdenCompraPartida, as: "partidas" }, "indice", "ASC"],
      ],
    });

    return res.json({
      ordenes: ordenes.map((o) => serializeOrden(o, { includeDetails: true })),
    });
  } catch (error) {
    logError("compras.list", error);
    return res.status(500).json({ message: "Error listando compras." });
  }
};

const getById = async (req, res) => {
  try {
    const orden = await OrdenCompra.findByPk(req.params.id, {
      include: [
        { model: OrdenCompraPartida, as: "partidas" },
        { model: OrdenCompraFactura, as: "facturas" },
      ],
      order: [
        [{ model: OrdenCompraPartida, as: "partidas" }, "indice", "ASC"],
        [{ model: OrdenCompraFactura, as: "facturas" }, "createdAt", "DESC"],
      ],
    });
    if (!orden) {
      return res.status(404).json({ message: "Orden de compra no encontrada." });
    }
    return res.json({ orden: serializeOrden(orden, { includeDetails: true }) });
  } catch (error) {
    logError("compras.getById", error);
    return res.status(500).json({ message: "Error obteniendo la orden." });
  }
};

const importar = async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: "Debes subir un archivo .xlsm." });
  }

  const importPublicPath = publicPathFromDisk(file.path, "import");
  let creadas = 0;
  let actualizadas = 0;
  const errores = [];
  const ordenesAfectadas = new Set();

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(file.path);
    const sheet = workbook.getWorksheet(SHEET_NAME);
    if (!sheet) {
      await cleanupUploadedPath(file.path);
      return res.status(400).json({
        message: `No se encontró la hoja "${SHEET_NAME}" en el archivo.`,
      });
    }

    const headerRow = sheet.getRow(1);
    const headerValues = [];
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      headerValues[colNumber - 1] = cell.value;
    });
    const colMap = mapHeaderRow(headerValues);
    const required = ["fecha", "proyecto", "proveedor", "nombreProducto"];
    const missing = required.filter((k) => !colMap[k]);
    if (missing.length) {
      await cleanupUploadedPath(file.path);
      return res.status(400).json({
        message: `Encabezados faltantes en Historial_Compras: ${missing.join(", ")}.`,
      });
    }

    await sequelize.transaction(async (transaction) => {
      for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
        const row = sheet.getRow(rowNumber);
        try {
          const cell = (field) => {
            const col = colMap[field];
            if (!col) return null;
            const c = row.getCell(col);
            return c.value && typeof c.value === "object" && "result" in c.value
              ? c.value.result
              : c.value;
          };

          const fecha = toDateOnly(cell("fecha"));
          const proyecto = trimStr(cell("proyecto"));
          const proveedor = trimStr(cell("proveedor"));
          const nombreProducto = trimStr(cell("nombreProducto"));
          const cantidad = toNumber(cell("cantidad"), 0);
          const importeTotal = toNumber(cell("importeTotal"), 0);

          if (!fecha && !proyecto && !proveedor && !nombreProducto) continue;
          if (!nombreProducto && cantidad <= 0 && importeTotal <= 0) continue;
          if (!fecha || !proyecto || !proveedor || !nombreProducto) {
            errores.push({
              fila: rowNumber,
              message: "Faltan fecha, proyecto, proveedor o nombre de producto.",
            });
            continue;
          }

          const indice = toIndice(cell("indice"));
          const unidad = trimStr(cell("unidad"));
          const caracteristicas = trimStr(cell("caracteristicas"));
          const paraQueSeUsara = trimStr(cell("paraQueSeUsara"));
          const precioUnitario = toNumber(cell("precioUnitario"), 0);

          const [orden, created] = await OrdenCompra.findOrCreate({
            where: { fecha, proyecto, proveedor },
            defaults: {
              fecha,
              proyecto,
              proveedor,
              total: 0,
              archivoImportPath: importPublicPath,
            },
            transaction,
          });

          if (!created) {
            await orden.update({ archivoImportPath: importPublicPath }, { transaction });
          }

          ordenesAfectadas.add(orden.id);

          const existing = await OrdenCompraPartida.findOne({
            where: {
              ordenCompraId: orden.id,
              indice,
              nombreProducto,
            },
            transaction,
          });

          const payload = {
            cantidad,
            unidad,
            caracteristicas,
            paraQueSeUsara,
            precioUnitario,
            importeTotal,
          };

          if (existing) {
            await existing.update(payload, { transaction });
            actualizadas += 1;
          } else {
            await OrdenCompraPartida.create(
              {
                ordenCompraId: orden.id,
                indice,
                nombreProducto,
                ...payload,
              },
              { transaction }
            );
            creadas += 1;
          }
        } catch (rowError) {
          errores.push({
            fila: rowNumber,
            message: rowError.message || "Error procesando fila.",
          });
        }
      }

      for (const ordenId of ordenesAfectadas) {
        await recalculateOrdenTotal(ordenId, transaction);
      }
    });

    return res.json({
      message: "Importación completada.",
      creadas,
      actualizadas,
      ordenesAfectadas: ordenesAfectadas.size,
      errores,
      archivoImportPath: importPublicPath,
    });
  } catch (error) {
    await cleanupUploadedPath(file.path);
    logError("compras.importar", error);
    return res.status(500).json({ message: error.message || "Error importando el archivo." });
  }
};

const uploadFactura = async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: "Debes subir un archivo PDF, JPG o PNG." });
  }

  try {
    const orden = await OrdenCompra.findByPk(req.params.id);
    if (!orden) {
      await cleanupUploadedPath(file.path);
      return res.status(404).json({ message: "Orden de compra no encontrada." });
    }

    const factura = await OrdenCompraFactura.create({
      ordenCompraId: orden.id,
      archivoPath: publicPathFromDisk(file.path, "factura"),
      nombreOriginal: file.originalname || path.basename(file.path),
      mimeType: file.mimetype,
      uploadedBy: req.user?.id || null,
    });

    return res.status(201).json({ factura: serializeFactura(factura) });
  } catch (error) {
    await cleanupUploadedPath(file.path);
    logError("compras.uploadFactura", error);
    return res.status(500).json({ message: "Error subiendo la factura." });
  }
};

const deleteFactura = async (req, res) => {
  try {
    const factura = await OrdenCompraFactura.findOne({
      where: { id: req.params.facturaId, ordenCompraId: req.params.id },
    });
    if (!factura) {
      return res.status(404).json({ message: "Factura no encontrada." });
    }

    const filename = path.basename(factura.archivoPath || "");
    const diskPath = path.join(COMPRAS_FACTURAS_DIR, filename);
    await factura.destroy();
    await cleanupUploadedPath(diskPath);

    return res.json({ message: "Factura eliminada." });
  } catch (error) {
    logError("compras.deleteFactura", error);
    return res.status(500).json({ message: "Error eliminando la factura." });
  }
};

const uploadXlsm = async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: "Debes subir un archivo .xlsm." });
  }

  try {
    const orden = await OrdenCompra.findByPk(req.params.id);
    if (!orden) {
      await cleanupUploadedPath(file.path);
      return res.status(404).json({ message: "Orden de compra no encontrada." });
    }

    const previousPath = orden.archivoImportPath;
    const archivoImportPath = publicPathFromDisk(file.path, "import");
    await orden.update({ archivoImportPath });

    if (previousPath && previousPath !== archivoImportPath) {
      const prevDisk = path.join(COMPRAS_IMPORTS_DIR, path.basename(previousPath));
      await cleanupUploadedPath(prevDisk);
    }

    return res.json({
      message: "Archivo XLSM guardado en la compra.",
      archivoImportPath,
      nombreOriginal: file.originalname || path.basename(file.path),
    });
  } catch (error) {
    await cleanupUploadedPath(file.path);
    logError("compras.uploadXlsm", error);
    return res.status(500).json({ message: "Error subiendo el archivo XLSM." });
  }
};

const updatePartidaGestion = async (req, res) => {
  try {
    const partida = await OrdenCompraPartida.findOne({
      where: { id: req.params.partidaId, ordenCompraId: req.params.id },
    });
    if (!partida) {
      return res.status(404).json({ message: "Partida no encontrada." });
    }

    await partida.update({
      caracteristicas: trimStr(req.body?.caracteristicas),
      paraQueSeUsara: trimStr(req.body?.paraQueSeUsara),
      quienRecibeMaterial: trimStr(req.body?.quienRecibeMaterial),
      quienLoUsa: trimStr(req.body?.quienLoUsa),
      quienLoPide: trimStr(req.body?.quienLoPide),
    });

    return res.json({
      message: "Gestión de partida actualizada.",
      partida: serializePartida(partida),
    });
  } catch (error) {
    logError("compras.updatePartidaGestion", error);
    return res.status(500).json({ message: "Error actualizando la gestión de la partida." });
  }
};

module.exports = {
  list,
  getById,
  create,
  importar,
  uploadFactura,
  deleteFactura,
  uploadXlsm,
  updatePartidaGestion,
};
