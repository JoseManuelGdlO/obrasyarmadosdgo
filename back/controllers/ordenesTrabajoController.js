const { Op } = require("sequelize");
const sequelize = require("../config/database");
const OrdenTrabajo = require("../models/OrdenTrabajo");
const OrdenTrabajoActividad = require("../models/OrdenTrabajoActividad");
const OrdenTrabajoItem = require("../models/OrdenTrabajoItem");
const Maquina = require("../models/Maquina");
const Proyecto = require("../models/Proyecto");
const Cliente = require("../models/Cliente");
const Proveedor = require("../models/Proveedor");
const Nomenclatura = require("../models/Nomenclatura");
const Trabajador = require("../models/Trabajador");
const Articulo = require("../models/Articulo");
const MovimientoInventario = require("../models/MovimientoInventario");

const PRIORIDADES = ["baja", "media", "alta", "critica"];
const ESTADOS = ["abierta", "en_progreso", "pausada", "cerrada"];
const ESTADOS_ABIERTOS = ["abierta", "en_progreso", "pausada"];

const trimOrNull = (value) => {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
};

const todayStr = () => new Date().toISOString().slice(0, 10);

const normalizeFecha = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const normalizeHora = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const str = String(value).trim();
  if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) return null;
  const parts = str.split(":");
  const hh = String(parts[0]).padStart(2, "0");
  const mm = String(parts[1]).padStart(2, "0");
  const ss = parts[2] ? String(parts[2]).padStart(2, "0") : "00";
  return `${hh}:${mm}:${ss}`;
};

const horasEntre = (inicio, fin) => {
  if (!inicio || !fin) return 0;
  const [hi, mi] = inicio.split(":").map(Number);
  const [hf, mf] = fin.split(":").map(Number);
  let mins = hf * 60 + mf - (hi * 60 + mi);
  if (mins < 0) mins += 24 * 60;
  return Math.round((mins / 60) * 100) / 100;
};

const includesFull = () => [
  {
    model: Proyecto,
    as: "proyecto",
    include: [{ model: Cliente, as: "cliente" }],
  },
  { model: Maquina, as: "maquina" },
  { model: Nomenclatura, as: "nomenclatura" },
  { model: Proveedor, as: "proveedor" },
  { model: Trabajador, as: "responsable" },
  {
    model: OrdenTrabajoActividad,
    as: "actividades",
    include: [{ model: Trabajador, as: "tecnicos" }],
  },
  {
    model: OrdenTrabajoItem,
    as: "items",
    include: [{ model: Articulo, as: "articulo" }],
  },
];

const generarFolioOT = async (year, transaction) => {
  const prefix = `OT-${year}-`;
  const count = await OrdenTrabajo.count({
    where: { folio: { [Op.like]: `${prefix}%` } },
    transaction,
  });
  const seq = String(count + 1).padStart(4, "0");
  return `${prefix}${seq}`;
};

const sumHorasActividades = (actividades) => {
  if (!Array.isArray(actividades)) return 0;
  return actividades.reduce(
    (acc, act) => acc + horasEntre(act.horaInicio, act.horaFin),
    0
  );
};

const sumCostoItems = (items) => {
  if (!Array.isArray(items)) return 0;
  return items.reduce((acc, item) => {
    const cantidad = Number(item.cantidad) || 0;
    const costo = Number(item.costoUnitario);
    if (!Number.isFinite(costo)) return acc;
    return acc + cantidad * costo;
  }, 0);
};

const list = async (req, res) => {
  try {
    const { estado, prioridad, q, maquinaId, proyectoId } = req.query;
    const where = {};

    if (estado) {
      if (estado === "abiertas") {
        where.estado = { [Op.in]: ESTADOS_ABIERTOS };
      } else if (ESTADOS.includes(estado)) {
        where.estado = estado;
      } else {
        return res.status(400).json({ message: "Estado inválido." });
      }
    }
    if (prioridad) {
      if (!PRIORIDADES.includes(prioridad)) {
        return res.status(400).json({ message: "Prioridad inválida." });
      }
      where.prioridad = prioridad;
    }
    if (maquinaId) where.maquinaId = maquinaId;
    if (proyectoId) where.proyectoId = proyectoId;

    if (q && String(q).trim()) {
      const term = `%${String(q).trim()}%`;
      where[Op.or] = [
        { folio: { [Op.like]: term } },
        { titulo: { [Op.like]: term } },
        { descripcion: { [Op.like]: term } },
        { "$maquina.nombre$": { [Op.like]: term } },
      ];
    }

    const ordenes = await OrdenTrabajo.findAll({
      where,
      include: includesFull(),
      order: [["createdAt", "DESC"]],
      distinct: true,
    });
    return res.status(200).json({ ordenes });
  } catch (error) {
    return res.status(500).json({
      message: "Error al listar órdenes de trabajo.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getById = async (req, res) => {
  try {
    const orden = await OrdenTrabajo.findByPk(req.params.id, {
      include: includesFull(),
    });
    if (!orden) {
      return res.status(404).json({ message: "Orden de trabajo no encontrada." });
    }
    return res.status(200).json({ orden });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener la orden de trabajo.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const validarRefs = async ({
  maquinaId,
  proyectoId,
  proveedorId,
  nomenclaturaId,
  responsableId,
}) => {
  if (maquinaId) {
    const maquina = await Maquina.findByPk(maquinaId);
    if (!maquina) return { error: "Máquina no encontrada.", code: 404 };
  }
  if (proyectoId) {
    const proyecto = await Proyecto.findByPk(proyectoId);
    if (!proyecto) return { error: "Proyecto no encontrado.", code: 404 };
  }
  if (proveedorId) {
    const proveedor = await Proveedor.findByPk(proveedorId);
    if (!proveedor) return { error: "Proveedor no encontrado.", code: 404 };
  }
  if (nomenclaturaId) {
    const nomenclatura = await Nomenclatura.findByPk(nomenclaturaId);
    if (!nomenclatura) return { error: "Nomenclatura no encontrada.", code: 404 };
  }
  if (responsableId) {
    const trabajador = await Trabajador.findByPk(responsableId);
    if (!trabajador) return { error: "Responsable no encontrado.", code: 404 };
  }
  return null;
};

const persistActividades = async (ordenTrabajoId, actividades, transaction) => {
  if (!Array.isArray(actividades)) return;
  for (let i = 0; i < actividades.length; i += 1) {
    const a = actividades[i];
    const horaInicio = normalizeHora(a.horaInicio);
    const horaFin = normalizeHora(a.horaFin);
    const actividad = await OrdenTrabajoActividad.create(
      {
        ordenTrabajoId,
        descripcion: trimOrNull(a.descripcion),
        horaInicio,
        horaFin,
        orden: i,
      },
      { transaction }
    );
    const tecnicos = Array.isArray(a.tecnicos)
      ? Array.from(new Set(a.tecnicos.filter(Boolean).map(String)))
      : [];
    if (tecnicos.length > 0) {
      const trabajadoresValidos = await Trabajador.findAll({
        where: { id: { [Op.in]: tecnicos } },
        transaction,
      });
      await actividad.setTecnicos(trabajadoresValidos, { transaction });
    }
  }
};

const persistItems = async (ordenTrabajoId, items, transaction) => {
  if (!Array.isArray(items)) return [];
  const created = [];
  for (const it of items) {
    if (!it.articuloId) continue;
    const cantidad = Math.max(1, Number(it.cantidad) || 1);
    const articulo = await Articulo.findByPk(it.articuloId, { transaction });
    if (!articulo) {
      throw Object.assign(new Error("Artículo no encontrado en items."), {
        statusCode: 404,
      });
    }
    const costoUnitario =
      it.costoUnitario !== undefined && it.costoUnitario !== null && it.costoUnitario !== ""
        ? Number(it.costoUnitario)
        : Number(articulo.precioUnitario || 0);
    const item = await OrdenTrabajoItem.create(
      {
        ordenTrabajoId,
        articuloId: it.articuloId,
        cantidad,
        unidad: trimOrNull(it.unidad) || articulo.unidad || null,
        costoUnitario: Number.isFinite(costoUnitario) ? costoUnitario : null,
      },
      { transaction }
    );
    created.push(item);
  }
  return created;
};

const create = async (req, res) => {
  const tx = await sequelize.transaction();
  try {
    const titulo = trimOrNull(req.body.titulo);
    if (!titulo) {
      await tx.rollback();
      return res.status(400).json({ message: "El título es obligatorio." });
    }

    const maquinaId = trimOrNull(req.body.maquinaId);
    const proyectoId = trimOrNull(req.body.proyectoId);
    const proveedorId = trimOrNull(req.body.proveedorId);
    const nomenclaturaId = trimOrNull(req.body.nomenclaturaId);
    const responsableId = trimOrNull(req.body.responsableId);

    const refsError = await validarRefs({
      maquinaId,
      proyectoId,
      proveedorId,
      nomenclaturaId,
      responsableId,
    });
    if (refsError) {
      await tx.rollback();
      return res.status(refsError.code).json({ message: refsError.error });
    }

    const prioridad = trimOrNull(req.body.prioridad) || "media";
    if (!PRIORIDADES.includes(prioridad)) {
      await tx.rollback();
      return res.status(400).json({ message: "Prioridad inválida." });
    }

    const estado = trimOrNull(req.body.estado) || "abierta";
    if (!ESTADOS.includes(estado)) {
      await tx.rollback();
      return res.status(400).json({ message: "Estado inválido." });
    }

    let folio = trimOrNull(req.body.folio);
    if (!folio) {
      const year = new Date().getFullYear();
      folio = await generarFolioOT(year, tx);
    } else {
      const existing = await OrdenTrabajo.findOne({
        where: { folio },
        transaction: tx,
      });
      if (existing) {
        await tx.rollback();
        return res.status(409).json({ message: "El folio ya está registrado." });
      }
    }

    let ubicacionSnapshot = trimOrNull(req.body.ubicacionSnapshot);
    let horometroSnapshot = trimOrNull(req.body.horometroSnapshot);
    if (maquinaId) {
      const maquina = await Maquina.findByPk(maquinaId, { transaction: tx });
      if (!ubicacionSnapshot && maquina?.ubicacion) {
        ubicacionSnapshot = maquina.ubicacion;
      }
      if (!horometroSnapshot && maquina?.horometroActual !== undefined) {
        horometroSnapshot = String(maquina.horometroActual);
      }
    }

    const orden = await OrdenTrabajo.create(
      {
        folio,
        titulo,
        descripcion: trimOrNull(req.body.descripcion),
        descripcionProveedor: trimOrNull(req.body.descripcionProveedor),
        maquinaId,
        proyectoId,
        proveedorId,
        nomenclaturaId,
        responsableId,
        ubicacionSnapshot,
        horometroSnapshot,
        prioridad,
        estado,
        fechaProgramada: normalizeFecha(req.body.fechaProgramada) ?? null,
        fechaVencimiento: normalizeFecha(req.body.fechaVencimiento) ?? null,
      },
      { transaction: tx }
    );

    await persistActividades(orden.id, req.body.actividades, tx);
    await persistItems(orden.id, req.body.items, tx);

    const horasInvertidas = sumHorasActividades(req.body.actividades || []);
    const itemsConCosto = await OrdenTrabajoItem.findAll({
      where: { ordenTrabajoId: orden.id },
      transaction: tx,
    });
    const costoTotal = sumCostoItems(itemsConCosto.map((i) => i.toJSON()));

    await orden.update({ horasInvertidas, costoTotal }, { transaction: tx });

    await tx.commit();

    const ordenCompleta = await OrdenTrabajo.findByPk(orden.id, {
      include: includesFull(),
    });
    return res.status(201).json({
      message: "Orden de trabajo creada correctamente.",
      orden: ordenCompleta,
    });
  } catch (error) {
    await tx.rollback();
    const status = error.statusCode || 500;
    return res.status(status).json({
      message: error.message || "Error al crear la orden de trabajo.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const update = async (req, res) => {
  const tx = await sequelize.transaction();
  try {
    const { id } = req.params;
    const orden = await OrdenTrabajo.findByPk(id, { transaction: tx });
    if (!orden) {
      await tx.rollback();
      return res.status(404).json({ message: "Orden de trabajo no encontrada." });
    }

    const updates = {};

    if (req.body.titulo !== undefined) {
      const titulo = trimOrNull(req.body.titulo);
      if (!titulo) {
        await tx.rollback();
        return res.status(400).json({ message: "El título no puede estar vacío." });
      }
      updates.titulo = titulo;
    }
    if (req.body.descripcion !== undefined) {
      updates.descripcion = trimOrNull(req.body.descripcion);
    }
    if (req.body.descripcionProveedor !== undefined) {
      updates.descripcionProveedor = trimOrNull(req.body.descripcionProveedor);
    }
    if (req.body.ubicacionSnapshot !== undefined) {
      updates.ubicacionSnapshot = trimOrNull(req.body.ubicacionSnapshot);
    }
    if (req.body.horometroSnapshot !== undefined) {
      updates.horometroSnapshot = trimOrNull(req.body.horometroSnapshot);
    }
    if (req.body.prioridad !== undefined) {
      const prioridad = trimOrNull(req.body.prioridad);
      if (!prioridad || !PRIORIDADES.includes(prioridad)) {
        await tx.rollback();
        return res.status(400).json({ message: "Prioridad inválida." });
      }
      updates.prioridad = prioridad;
    }
    if (req.body.estado !== undefined) {
      const estado = trimOrNull(req.body.estado);
      if (!estado || !ESTADOS.includes(estado)) {
        await tx.rollback();
        return res.status(400).json({ message: "Estado inválido." });
      }
      updates.estado = estado;
    }
    if (req.body.fechaProgramada !== undefined) {
      updates.fechaProgramada = normalizeFecha(req.body.fechaProgramada);
    }
    if (req.body.fechaVencimiento !== undefined) {
      updates.fechaVencimiento = normalizeFecha(req.body.fechaVencimiento);
    }
    if (req.body.fechaCierre !== undefined) {
      updates.fechaCierre = normalizeFecha(req.body.fechaCierre);
    }

    const refKeys = ["maquinaId", "proyectoId", "proveedorId", "nomenclaturaId", "responsableId"];
    const refsToValidate = {};
    for (const key of refKeys) {
      if (req.body[key] !== undefined) {
        const val = trimOrNull(req.body[key]);
        updates[key] = val;
        refsToValidate[key] = val;
      }
    }
    const refsError = await validarRefs(refsToValidate);
    if (refsError) {
      await tx.rollback();
      return res.status(refsError.code).json({ message: refsError.error });
    }

    if (req.body.folio !== undefined) {
      const nuevoFolio = trimOrNull(req.body.folio);
      if (nuevoFolio && nuevoFolio !== orden.folio) {
        const existing = await OrdenTrabajo.findOne({
          where: { folio: nuevoFolio, id: { [Op.ne]: id } },
          transaction: tx,
        });
        if (existing) {
          await tx.rollback();
          return res.status(409).json({ message: "El folio ya está registrado." });
        }
        updates.folio = nuevoFolio;
      }
    }

    await orden.update(updates, { transaction: tx });

    if (Array.isArray(req.body.actividades)) {
      const previas = await OrdenTrabajoActividad.findAll({
        where: { ordenTrabajoId: id },
        transaction: tx,
      });
      for (const act of previas) {
        await act.setTecnicos([], { transaction: tx });
      }
      await OrdenTrabajoActividad.destroy({
        where: { ordenTrabajoId: id },
        transaction: tx,
      });
      await persistActividades(id, req.body.actividades, tx);
    }

    if (Array.isArray(req.body.items)) {
      await OrdenTrabajoItem.destroy({
        where: { ordenTrabajoId: id },
        transaction: tx,
      });
      await persistItems(id, req.body.items, tx);
    }

    if (
      Array.isArray(req.body.actividades) ||
      Array.isArray(req.body.items)
    ) {
      const actividades = await OrdenTrabajoActividad.findAll({
        where: { ordenTrabajoId: id },
        transaction: tx,
      });
      const items = await OrdenTrabajoItem.findAll({
        where: { ordenTrabajoId: id },
        transaction: tx,
      });
      await orden.update(
        {
          horasInvertidas: sumHorasActividades(actividades.map((a) => a.toJSON())),
          costoTotal: sumCostoItems(items.map((i) => i.toJSON())),
        },
        { transaction: tx }
      );
    }

    await tx.commit();

    const ordenCompleta = await OrdenTrabajo.findByPk(id, {
      include: includesFull(),
    });
    return res.status(200).json({
      message: "Orden de trabajo actualizada correctamente.",
      orden: ordenCompleta,
    });
  } catch (error) {
    await tx.rollback();
    const status = error.statusCode || 500;
    return res.status(status).json({
      message: error.message || "Error al actualizar la orden de trabajo.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const close = async (req, res) => {
  const tx = await sequelize.transaction();
  try {
    const { id } = req.params;
    const orden = await OrdenTrabajo.findByPk(id, { transaction: tx });
    if (!orden) {
      await tx.rollback();
      return res.status(404).json({ message: "Orden de trabajo no encontrada." });
    }
    if (orden.estado === "cerrada") {
      await tx.rollback();
      return res.status(409).json({ message: "La orden ya está cerrada." });
    }

    const items = await OrdenTrabajoItem.findAll({
      where: { ordenTrabajoId: id },
      transaction: tx,
    });

    for (const item of items) {
      const articulo = await Articulo.findByPk(item.articuloId, {
        transaction: tx,
        lock: tx.LOCK.UPDATE,
      });
      if (!articulo) {
        await tx.rollback();
        return res.status(404).json({
          message: `Artículo ${item.articuloId} no encontrado al cerrar la OT.`,
        });
      }
      const stockAnterior = Number(articulo.stockActual || 0);
      const cantidad = Number(item.cantidad || 0);
      const stockNuevo = stockAnterior - cantidad;
      if (stockNuevo < 0) {
        await tx.rollback();
        return res.status(400).json({
          message: `Stock insuficiente para el artículo ${articulo.nombre}.`,
        });
      }
      await articulo.update({ stockActual: stockNuevo }, { transaction: tx });
      await MovimientoInventario.create(
        {
          articuloId: articulo.id,
          tipo: "salida",
          cantidad,
          stockAnterior,
          stockNuevo,
          motivo: "Consumo OT",
          referencia: orden.folio || `OT-${orden.id.slice(0, 8)}`,
          costoUnitario:
            item.costoUnitario !== null && item.costoUnitario !== undefined
              ? Number(item.costoUnitario)
              : null,
          userId: req.user?.id || null,
        },
        { transaction: tx }
      );
    }

    await orden.update(
      { estado: "cerrada", fechaCierre: todayStr() },
      { transaction: tx }
    );

    await tx.commit();

    const ordenCompleta = await OrdenTrabajo.findByPk(id, {
      include: includesFull(),
    });
    return res.status(200).json({
      message: "Orden de trabajo cerrada y stock actualizado.",
      orden: ordenCompleta,
    });
  } catch (error) {
    await tx.rollback();
    return res.status(500).json({
      message: "Error al cerrar la orden de trabajo.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const remove = async (req, res) => {
  try {
    const orden = await OrdenTrabajo.findByPk(req.params.id);
    if (!orden) {
      return res.status(404).json({ message: "Orden de trabajo no encontrada." });
    }
    await orden.destroy();
    return res
      .status(200)
      .json({ message: "Orden de trabajo eliminada correctamente." });
  } catch (error) {
    return res.status(500).json({
      message: "Error al eliminar la orden de trabajo.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  list,
  getById,
  create,
  update,
  close,
  remove,
};
