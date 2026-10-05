const { Op } = require("sequelize");
const ExcelJS = require("exceljs");
const {
  sequelize,
  Trabajador,
  NominaPeriodo,
  NominaPeriodoLinea,
  NominaLineaConcepto,
  NominaPagoExtra,
  NominaGestionConcepto,
} = require("../models");
const { logError } = require("../utils/logger");
const P = require("../constants/permissions");

const round2 = (n) => Number(Number(n || 0).toFixed(2));

const userCan = (req, permission) =>
  req.user?.rol === "admin" || (req.permissions && req.permissions.has(permission));

const money = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return NaN;
  return round2(n);
};

const serializeConcepto = (c) => ({
  id: c.id,
  lineaId: c.lineaId,
  tipo: c.tipo,
  concepto: c.concepto,
  monto: Number(c.monto),
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
});

const serializeLinea = (l) => {
  const json = typeof l.toJSON === "function" ? l.toJSON() : l;
  return {
    id: json.id,
    periodoId: json.periodoId,
    trabajadorId: json.trabajadorId,
    sueldoBase: Number(json.sueldoBase),
    totalPercepciones: Number(json.totalPercepciones),
    totalDeducciones: Number(json.totalDeducciones),
    neto: Number(json.neto),
    estadoPago: json.estadoPago,
    pagadoEn: json.pagadoEn,
    createdAt: json.createdAt,
    updatedAt: json.updatedAt,
    trabajador: json.trabajador
      ? {
          id: json.trabajador.id,
          nombre: json.trabajador.nombre,
          puesto: json.trabajador.puesto,
          cargo: json.trabajador.cargo,
          departamento: json.trabajador.departamento || null,
          especialidad: json.trabajador.especialidad || null,
          telefono: json.trabajador.telefono || null,
          email: json.trabajador.email || null,
          fechaIngreso: json.trabajador.fechaIngreso || null,
          experiencia: json.trabajador.experiencia || null,
          estado: json.trabajador.estado || null,
          sueldoBase:
            json.trabajador.sueldoBase != null ? Number(json.trabajador.sueldoBase) : null,
        }
      : undefined,
    conceptos: Array.isArray(json.conceptos)
      ? json.conceptos.map(serializeConcepto)
      : undefined,
  };
};

const serializePeriodo = (p, { includeLineas = false } = {}) => {
  const json = typeof p.toJSON === "function" ? p.toJSON() : p;
  const lineas = Array.isArray(json.lineas) ? json.lineas : [];
  return {
    id: json.id,
    fechaInicio: json.fechaInicio,
    fechaFin: json.fechaFin,
    nombre: json.nombre,
    estado: json.estado,
    totalNeto: Number(json.totalNeto),
    trabajadoresCount: includeLineas ? lineas.length : json.trabajadoresCount ?? lineas.length,
    createdAt: json.createdAt,
    updatedAt: json.updatedAt,
    lineas: includeLineas ? lineas.map(serializeLinea) : undefined,
  };
};

const serializeExtra = (e) => {
  const json = typeof e.toJSON === "function" ? e.toJSON() : e;
  return {
    id: json.id,
    trabajadorId: json.trabajadorId,
    fecha: json.fecha,
    monto: Number(json.monto),
    concepto: json.concepto,
    estadoPago: json.estadoPago,
    pagadoEn: json.pagadoEn,
    creadoPor: json.creadoPor,
    createdAt: json.createdAt,
    updatedAt: json.updatedAt,
    trabajador: json.trabajador
      ? { id: json.trabajador.id, nombre: json.trabajador.nombre }
      : undefined,
  };
};

const recalculateLinea = async (lineaId, transaction) => {
  const linea = await NominaPeriodoLinea.findByPk(lineaId, { transaction });
  if (!linea) return null;

  const conceptos = await NominaLineaConcepto.findAll({
    where: { lineaId },
    transaction,
  });

  let totalPercepciones = 0;
  let totalDeducciones = 0;
  for (const c of conceptos) {
    const m = Number(c.monto) || 0;
    if (c.tipo === "percepcion") totalPercepciones += m;
    else if (c.tipo === "deduccion") totalDeducciones += m;
  }

  totalPercepciones = round2(totalPercepciones);
  totalDeducciones = round2(totalDeducciones);
  const neto = round2(Number(linea.sueldoBase) + totalPercepciones - totalDeducciones);

  await linea.update(
    { totalPercepciones, totalDeducciones, neto },
    { transaction }
  );
  return linea;
};

const recalculatePeriodoTotal = async (periodoId, transaction) => {
  const lineas = await NominaPeriodoLinea.findAll({
    where: { periodoId },
    attributes: ["neto"],
    transaction,
  });
  const totalNeto = round2(lineas.reduce((acc, l) => acc + Number(l.neto || 0), 0));
  await NominaPeriodo.update({ totalNeto }, { where: { id: periodoId }, transaction });
  return totalNeto;
};

const assertPeriodoBorrador = (periodo) => {
  if (!periodo) return { status: 404, message: "Periodo no encontrado." };
  if (periodo.estado === "cerrado") {
    return { status: 409, message: "El periodo está cerrado y no se puede editar." };
  }
  return null;
};

const listPeriodos = async (req, res) => {
  try {
    const { estado, fechaDesde, fechaHasta, q } = req.query;
    const where = {};
    if (estado === "borrador" || estado === "cerrado") where.estado = estado;
    if (fechaDesde || fechaHasta) {
      where.fechaInicio = {};
      if (fechaDesde) where.fechaInicio[Op.gte] = fechaDesde;
      if (fechaHasta) where.fechaInicio[Op.lte] = fechaHasta;
    }
    if (q && String(q).trim()) {
      where.nombre = { [Op.like]: `%${String(q).trim()}%` };
    }

    const periodos = await NominaPeriodo.findAll({
      where,
      order: [
        ["fechaInicio", "DESC"],
        ["createdAt", "DESC"],
      ],
      include: [
        {
          model: NominaPeriodoLinea,
          as: "lineas",
          attributes: ["id"],
        },
      ],
    });

    return res.json({
      periodos: periodos.map((p) => {
        const json = p.toJSON();
        return serializePeriodo({
          ...json,
          trabajadoresCount: (json.lineas || []).length,
          lineas: undefined,
        });
      }),
    });
  } catch (error) {
    logError("nomina.listPeriodos", error);
    return res.status(500).json({ message: "Error al listar periodos de nómina." });
  }
};

const createPeriodo = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, nombre } = req.body || {};
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ message: "fechaInicio y fechaFin son obligatorios." });
    }
    if (String(fechaFin) < String(fechaInicio)) {
      return res.status(400).json({ message: "fechaFin debe ser mayor o igual a fechaInicio." });
    }

    const periodo = await sequelize.transaction(async (transaction) => {
      const created = await NominaPeriodo.create(
        {
          fechaInicio,
          fechaFin,
          nombre: nombre != null && String(nombre).trim() ? String(nombre).trim() : null,
          estado: "borrador",
          totalNeto: 0,
        },
        { transaction }
      );

      const trabajadores = await Trabajador.findAll({
        where: { bajaLogica: false, estado: "activo" },
        attributes: ["id", "sueldoBase"],
        transaction,
      });

      if (trabajadores.length > 0) {
        const rows = trabajadores.map((t) => {
          const sueldoBase = round2(t.sueldoBase != null ? Number(t.sueldoBase) : 0);
          return {
            periodoId: created.id,
            trabajadorId: t.id,
            sueldoBase,
            totalPercepciones: 0,
            totalDeducciones: 0,
            neto: sueldoBase,
            estadoPago: "pendiente",
          };
        });
        await NominaPeriodoLinea.bulkCreate(rows, { transaction });
        await recalculatePeriodoTotal(created.id, transaction);
      }

      return created;
    });

    const full = await NominaPeriodo.findByPk(periodo.id, {
      include: [
        {
          model: NominaPeriodoLinea,
          as: "lineas",
          include: [
            {
              model: Trabajador,
              as: "trabajador",
              attributes: TRABAJADOR_NOMINA_ATTRS,
            },
            { model: NominaLineaConcepto, as: "conceptos" },
          ],
        },
      ],
    });

    return res.status(201).json({ periodo: serializePeriodo(full, { includeLineas: true }) });
  } catch (error) {
    logError("nomina.createPeriodo", error);
    return res.status(500).json({ message: "Error al crear el periodo de nómina." });
  }
};

const getPeriodo = async (req, res) => {
  try {
    const periodo = await NominaPeriodo.findByPk(req.params.id, {
      include: [
        {
          model: NominaPeriodoLinea,
          as: "lineas",
          include: [
            {
              model: Trabajador,
              as: "trabajador",
              attributes: TRABAJADOR_NOMINA_ATTRS,
            },
            { model: NominaLineaConcepto, as: "conceptos" },
          ],
        },
      ],
    });
    if (!periodo) {
      return res.status(404).json({ message: "Periodo no encontrado." });
    }
    const json = serializePeriodo(periodo, { includeLineas: true });
    if (json.lineas) {
      json.lineas.sort((a, b) =>
        String(a.trabajador?.nombre || "").localeCompare(String(b.trabajador?.nombre || ""), "es")
      );
    }
    return res.json({ periodo: json });
  } catch (error) {
    logError("nomina.getPeriodo", error);
    return res.status(500).json({ message: "Error al obtener el periodo." });
  }
};

const updatePeriodo = async (req, res) => {
  try {
    const periodo = await NominaPeriodo.findByPk(req.params.id);
    if (!periodo) {
      return res.status(404).json({ message: "Periodo no encontrado." });
    }

    const { nombre, fechaInicio, fechaFin, estado } = req.body || {};
    const wantsClose = estado === "cerrado";

    if (wantsClose) {
      if (!userCan(req, P.NOMINA_PAY)) {
        return res.status(403).json({ message: "No tiene permisos para esta operación." });
      }
      if (periodo.estado === "cerrado") {
        return res.status(409).json({ message: "El periodo ya está cerrado." });
      }
      await sequelize.transaction(async (transaction) => {
        await NominaPeriodoLinea.update(
          { estadoPago: "pagado", pagadoEn: new Date() },
          {
            where: { periodoId: periodo.id, estadoPago: "pendiente" },
            transaction,
          }
        );
        await periodo.update({ estado: "cerrado" }, { transaction });
      });
      const full = await NominaPeriodo.findByPk(periodo.id, {
        include: [
          {
            model: NominaPeriodoLinea,
            as: "lineas",
            include: [
              {
                model: Trabajador,
                as: "trabajador",
                attributes: TRABAJADOR_NOMINA_ATTRS,
              },
              { model: NominaLineaConcepto, as: "conceptos" },
            ],
          },
        ],
      });
      return res.json({ periodo: serializePeriodo(full, { includeLineas: true }) });
    }

    const err = assertPeriodoBorrador(periodo);
    if (err) return res.status(err.status).json({ message: err.message });

    if (!userCan(req, P.NOMINA_CREATE)) {
      return res.status(403).json({ message: "No tiene permisos para esta operación." });
    }

    const patch = {};
    if (nombre !== undefined) {
      patch.nombre = nombre != null && String(nombre).trim() ? String(nombre).trim() : null;
    }
    if (fechaInicio !== undefined) patch.fechaInicio = fechaInicio;
    if (fechaFin !== undefined) patch.fechaFin = fechaFin;

    const nextInicio = patch.fechaInicio ?? periodo.fechaInicio;
    const nextFin = patch.fechaFin ?? periodo.fechaFin;
    if (String(nextFin) < String(nextInicio)) {
      return res.status(400).json({ message: "fechaFin debe ser mayor o igual a fechaInicio." });
    }

    await periodo.update(patch);
    return res.json({ periodo: serializePeriodo(periodo) });
  } catch (error) {
    logError("nomina.updatePeriodo", error);
    return res.status(500).json({ message: "Error al actualizar el periodo." });
  }
};

const updateLinea = async (req, res) => {
  try {
    const periodo = await NominaPeriodo.findByPk(req.params.id);
    if (!periodo) {
      return res.status(404).json({ message: "Periodo no encontrado." });
    }

    const linea = await NominaPeriodoLinea.findOne({
      where: { id: req.params.lineaId, periodoId: periodo.id },
    });
    if (!linea) {
      return res.status(404).json({ message: "Línea no encontrada." });
    }

    const { sueldoBase, estadoPago } = req.body || {};

    if (estadoPago !== undefined) {
      if (!userCan(req, P.NOMINA_PAY)) {
        return res.status(403).json({ message: "No tiene permisos para esta operación." });
      }
      if (estadoPago !== "pendiente" && estadoPago !== "pagado") {
        return res.status(400).json({ message: "estadoPago inválido." });
      }
      if (estadoPago === "pagado") {
        await linea.update({
          estadoPago: "pagado",
          pagadoEn: linea.pagadoEn || new Date(),
        });
      } else if (periodo.estado === "cerrado") {
        return res.status(409).json({ message: "No se puede revertir el pago en un periodo cerrado." });
      } else {
        await linea.update({ estadoPago: "pendiente", pagadoEn: null });
      }
    }

    if (sueldoBase !== undefined) {
      if (!userCan(req, P.NOMINA_CREATE)) {
        return res.status(403).json({ message: "No tiene permisos para esta operación." });
      }
      const err = assertPeriodoBorrador(periodo);
      if (err) return res.status(err.status).json({ message: err.message });
      const n = money(sueldoBase);
      if (n === null || Number.isNaN(n) || n < 0) {
        return res.status(400).json({ message: "sueldoBase inválido." });
      }
      await sequelize.transaction(async (transaction) => {
        await linea.update({ sueldoBase: n }, { transaction });
        await recalculateLinea(linea.id, transaction);
        await recalculatePeriodoTotal(periodo.id, transaction);
      });
    }

    const full = await NominaPeriodoLinea.findByPk(linea.id, {
      include: [
        {
          model: Trabajador,
          as: "trabajador",
          attributes: TRABAJADOR_NOMINA_ATTRS,
        },
        { model: NominaLineaConcepto, as: "conceptos" },
      ],
    });
    const periodoFresh = await NominaPeriodo.findByPk(periodo.id);

    return res.json({
      linea: serializeLinea(full),
      periodo: serializePeriodo(periodoFresh),
    });
  } catch (error) {
    logError("nomina.updateLinea", error);
    return res.status(500).json({ message: "Error al actualizar la línea." });
  }
};

const addConcepto = async (req, res) => {
  try {
    const periodo = await NominaPeriodo.findByPk(req.params.id);
    const err = assertPeriodoBorrador(periodo);
    if (err) return res.status(err.status).json({ message: err.message });

    const linea = await NominaPeriodoLinea.findOne({
      where: { id: req.params.lineaId, periodoId: periodo.id },
    });
    if (!linea) {
      return res.status(404).json({ message: "Línea no encontrada." });
    }

    const { tipo, concepto, monto } = req.body || {};
    if (tipo !== "percepcion" && tipo !== "deduccion") {
      return res.status(400).json({ message: "tipo debe ser percepcion o deduccion." });
    }
    const conceptoStr = concepto != null ? String(concepto).trim() : "";
    if (!conceptoStr) {
      return res.status(400).json({ message: "concepto es obligatorio." });
    }
    const m = money(monto);
    if (m === null || Number.isNaN(m) || m < 0) {
      return res.status(400).json({ message: "monto inválido." });
    }

    const created = await sequelize.transaction(async (transaction) => {
      const row = await NominaLineaConcepto.create(
        { lineaId: linea.id, tipo, concepto: conceptoStr, monto: m },
        { transaction }
      );
      await recalculateLinea(linea.id, transaction);
      await recalculatePeriodoTotal(periodo.id, transaction);
      return row;
    });

    const fullLinea = await NominaPeriodoLinea.findByPk(linea.id, {
      include: [
        {
          model: Trabajador,
          as: "trabajador",
          attributes: TRABAJADOR_NOMINA_ATTRS,
        },
        { model: NominaLineaConcepto, as: "conceptos" },
      ],
    });
    const periodoFresh = await NominaPeriodo.findByPk(periodo.id);

    return res.status(201).json({
      concepto: serializeConcepto(created),
      linea: serializeLinea(fullLinea),
      periodo: serializePeriodo(periodoFresh),
    });
  } catch (error) {
    logError("nomina.addConcepto", error);
    return res.status(500).json({ message: "Error al agregar el concepto." });
  }
};

const updateConcepto = async (req, res) => {
  try {
    const periodo = await NominaPeriodo.findByPk(req.params.id);
    const err = assertPeriodoBorrador(periodo);
    if (err) return res.status(err.status).json({ message: err.message });

    const linea = await NominaPeriodoLinea.findOne({
      where: { id: req.params.lineaId, periodoId: periodo.id },
    });
    if (!linea) {
      return res.status(404).json({ message: "Línea no encontrada." });
    }

    const conceptoRow = await NominaLineaConcepto.findOne({
      where: { id: req.params.conceptoId, lineaId: linea.id },
    });
    if (!conceptoRow) {
      return res.status(404).json({ message: "Concepto no encontrado." });
    }

    const { tipo, concepto, monto } = req.body || {};
    const patch = {};
    if (tipo !== undefined) {
      if (tipo !== "percepcion" && tipo !== "deduccion") {
        return res.status(400).json({ message: "tipo inválido." });
      }
      patch.tipo = tipo;
    }
    if (concepto !== undefined) {
      const conceptoStr = String(concepto).trim();
      if (!conceptoStr) {
        return res.status(400).json({ message: "concepto inválido." });
      }
      patch.concepto = conceptoStr;
    }
    if (monto !== undefined) {
      const m = money(monto);
      if (m === null || Number.isNaN(m) || m < 0) {
        return res.status(400).json({ message: "monto inválido." });
      }
      patch.monto = m;
    }

    await sequelize.transaction(async (transaction) => {
      await conceptoRow.update(patch, { transaction });
      await recalculateLinea(linea.id, transaction);
      await recalculatePeriodoTotal(periodo.id, transaction);
    });

    const fullLinea = await NominaPeriodoLinea.findByPk(linea.id, {
      include: [
        {
          model: Trabajador,
          as: "trabajador",
          attributes: TRABAJADOR_NOMINA_ATTRS,
        },
        { model: NominaLineaConcepto, as: "conceptos" },
      ],
    });
    const periodoFresh = await NominaPeriodo.findByPk(periodo.id);

    return res.json({
      concepto: serializeConcepto(conceptoRow),
      linea: serializeLinea(fullLinea),
      periodo: serializePeriodo(periodoFresh),
    });
  } catch (error) {
    logError("nomina.updateConcepto", error);
    return res.status(500).json({ message: "Error al actualizar el concepto." });
  }
};

const deleteConcepto = async (req, res) => {
  try {
    const periodo = await NominaPeriodo.findByPk(req.params.id);
    const err = assertPeriodoBorrador(periodo);
    if (err) return res.status(err.status).json({ message: err.message });

    const linea = await NominaPeriodoLinea.findOne({
      where: { id: req.params.lineaId, periodoId: periodo.id },
    });
    if (!linea) {
      return res.status(404).json({ message: "Línea no encontrada." });
    }

    const conceptoRow = await NominaLineaConcepto.findOne({
      where: { id: req.params.conceptoId, lineaId: linea.id },
    });
    if (!conceptoRow) {
      return res.status(404).json({ message: "Concepto no encontrado." });
    }

    await sequelize.transaction(async (transaction) => {
      await conceptoRow.destroy({ transaction });
      await recalculateLinea(linea.id, transaction);
      await recalculatePeriodoTotal(periodo.id, transaction);
    });

    const fullLinea = await NominaPeriodoLinea.findByPk(linea.id, {
      include: [
        {
          model: Trabajador,
          as: "trabajador",
          attributes: TRABAJADOR_NOMINA_ATTRS,
        },
        { model: NominaLineaConcepto, as: "conceptos" },
      ],
    });
    const periodoFresh = await NominaPeriodo.findByPk(periodo.id);

    return res.json({
      linea: serializeLinea(fullLinea),
      periodo: serializePeriodo(periodoFresh),
    });
  } catch (error) {
    logError("nomina.deleteConcepto", error);
    return res.status(500).json({ message: "Error al eliminar el concepto." });
  }
};

const listExtras = async (req, res) => {
  try {
    const { estadoPago, trabajadorId, q } = req.query;
    const where = {};
    if (estadoPago === "pendiente" || estadoPago === "pagado") where.estadoPago = estadoPago;
    if (trabajadorId) where.trabajadorId = trabajadorId;
    if (q && String(q).trim()) {
      where.concepto = { [Op.like]: `%${String(q).trim()}%` };
    }

    const extras = await NominaPagoExtra.findAll({
      where,
      order: [
        ["fecha", "DESC"],
        ["createdAt", "DESC"],
      ],
      include: [
        {
          model: Trabajador,
          as: "trabajador",
          attributes: ["id", "nombre"],
        },
      ],
    });

    return res.json({ extras: extras.map(serializeExtra) });
  } catch (error) {
    logError("nomina.listExtras", error);
    return res.status(500).json({ message: "Error al listar pagos extras." });
  }
};

const createExtra = async (req, res) => {
  try {
    const { trabajadorId, fecha, monto, concepto } = req.body || {};
    if (!trabajadorId || !fecha || monto === undefined || !concepto) {
      return res.status(400).json({
        message: "trabajadorId, fecha, monto y concepto son obligatorios.",
      });
    }
    const trabajador = await Trabajador.findByPk(trabajadorId);
    if (!trabajador || trabajador.bajaLogica) {
      return res.status(404).json({ message: "Trabajador no encontrado." });
    }
    const m = money(monto);
    if (m === null || Number.isNaN(m) || m <= 0) {
      return res.status(400).json({ message: "monto debe ser mayor a 0." });
    }
    const conceptoStr = String(concepto).trim();
    if (!conceptoStr) {
      return res.status(400).json({ message: "concepto es obligatorio." });
    }

    const extra = await NominaPagoExtra.create({
      trabajadorId,
      fecha,
      monto: m,
      concepto: conceptoStr,
      estadoPago: "pendiente",
      creadoPor: req.user?.id || null,
    });

    const full = await NominaPagoExtra.findByPk(extra.id, {
      include: [{ model: Trabajador, as: "trabajador", attributes: ["id", "nombre"] }],
    });
    return res.status(201).json({ extra: serializeExtra(full) });
  } catch (error) {
    logError("nomina.createExtra", error);
    return res.status(500).json({ message: "Error al crear el pago extra." });
  }
};

const updateExtra = async (req, res) => {
  try {
    const extra = await NominaPagoExtra.findByPk(req.params.id);
    if (!extra) {
      return res.status(404).json({ message: "Pago extra no encontrado." });
    }

    const { trabajadorId, fecha, monto, concepto, estadoPago } = req.body || {};

    if (estadoPago !== undefined) {
      if (!userCan(req, P.NOMINA_PAY)) {
        return res.status(403).json({ message: "No tiene permisos para esta operación." });
      }
      if (estadoPago !== "pendiente" && estadoPago !== "pagado") {
        return res.status(400).json({ message: "estadoPago inválido." });
      }
      if (estadoPago === "pagado") {
        await extra.update({
          estadoPago: "pagado",
          pagadoEn: extra.pagadoEn || new Date(),
        });
      } else {
        await extra.update({ estadoPago: "pendiente", pagadoEn: null });
      }
    }

    const patch = {};
    if (trabajadorId !== undefined) {
      const trabajador = await Trabajador.findByPk(trabajadorId);
      if (!trabajador || trabajador.bajaLogica) {
        return res.status(404).json({ message: "Trabajador no encontrado." });
      }
      patch.trabajadorId = trabajadorId;
    }
    if (fecha !== undefined) patch.fecha = fecha;
    if (concepto !== undefined) {
      const conceptoStr = String(concepto).trim();
      if (!conceptoStr) {
        return res.status(400).json({ message: "concepto inválido." });
      }
      patch.concepto = conceptoStr;
    }
    if (monto !== undefined) {
      const m = money(monto);
      if (m === null || Number.isNaN(m) || m <= 0) {
        return res.status(400).json({ message: "monto debe ser mayor a 0." });
      }
      patch.monto = m;
    }

    if (Object.keys(patch).length > 0) {
      if (!userCan(req, P.NOMINA_CREATE)) {
        return res.status(403).json({ message: "No tiene permisos para esta operación." });
      }
      if (extra.estadoPago === "pagado" && estadoPago === undefined) {
        return res.status(409).json({ message: "No se puede editar un pago extra ya pagado." });
      }
      await extra.update(patch);
    }

    const full = await NominaPagoExtra.findByPk(extra.id, {
      include: [{ model: Trabajador, as: "trabajador", attributes: ["id", "nombre"] }],
    });
    return res.json({ extra: serializeExtra(full) });
  } catch (error) {
    logError("nomina.updateExtra", error);
    return res.status(500).json({ message: "Error al actualizar el pago extra." });
  }
};

const safeFilenamePart = (value) =>
  String(value || "")
    .trim()
    .replace(/[^\w\-áéíóúñÁÉÍÓÚÑ ]+/gi, "")
    .replace(/\s+/g, "_")
    .slice(0, 60) || "periodo";

const CONCEPTOS_EXPORT = {
  percepcion: [
    "Bono",
    "Horas extras",
    "Compensaciones y/o reposiciones",
    "Otros",
  ],
  deduccion: [
    "Faltas",
    "Descuento / Préstamos y/o tiempo",
    "Retención de pensión alimenticia",
    "Retención INFONAVIT",
    "Otros",
  ],
};

const CONCEPTOS_FIJOS_EXPORT = {
  percepcion: CONCEPTOS_EXPORT.percepcion.filter((c) => c !== "Otros"),
  deduccion: CONCEPTOS_EXPORT.deduccion.filter((c) => c !== "Otros"),
};

const montoConceptoExport = (linea, tipo, nombre, fijosNombres) => {
  const conceptos = (linea.conceptos || []).filter((c) => c.tipo === tipo);
  if (nombre === "Otros") {
    const fijos = new Set(fijosNombres || CONCEPTOS_FIJOS_EXPORT[tipo]);
    return conceptos
      .filter((c) => !fijos.has(c.concepto))
      .reduce((acc, c) => acc + (Number(c.monto) || 0), 0);
  }
  return conceptos
    .filter((c) => c.concepto === nombre)
    .reduce((acc, c) => acc + (Number(c.monto) || 0), 0);
};

const TRABAJADOR_NOMINA_ATTRS = [
  "id",
  "nombre",
  "puesto",
  "cargo",
  "departamento",
  "especialidad",
  "telefono",
  "email",
  "fechaIngreso",
  "experiencia",
  "estado",
  "sueldoBase",
];

const conceptoExportKey = (tipo, nombre) =>
  `${tipo}__${nombre}`.replace(/[^\w]+/g, "_");

const exportPeriodoXlsx = async (req, res) => {
  try {
    const periodo = await NominaPeriodo.findByPk(req.params.id, {
      include: [
        {
          model: NominaPeriodoLinea,
          as: "lineas",
          include: [
            {
              model: Trabajador,
              as: "trabajador",
              attributes: TRABAJADOR_NOMINA_ATTRS,
            },
            { model: NominaLineaConcepto, as: "conceptos" },
          ],
        },
      ],
    });
    if (!periodo) {
      return res.status(404).json({ message: "Periodo no encontrado." });
    }

    const lineas = [...(periodo.lineas || [])].sort((a, b) =>
      String(a.trabajador?.nombre || "").localeCompare(String(b.trabajador?.nombre || ""), "es")
    );

    const catalogo = await NominaGestionConcepto.findAll({
      where: { activo: true },
      order: [
        ["orden", "ASC"],
        ["nombre", "ASC"],
      ],
    });
    const exportPercepcion = catalogo.some((c) => c.tipo === "percepcion")
      ? catalogo
          .filter(
            (c) =>
              c.tipo === "percepcion" &&
              String(c.nombre || "").trim().toLowerCase() !== "sueldo base"
          )
          .map((c) => c.nombre)
      : CONCEPTOS_EXPORT.percepcion;
    const exportDeduccion = catalogo.some((c) => c.tipo === "deduccion")
      ? catalogo.filter((c) => c.tipo === "deduccion").map((c) => c.nombre)
      : CONCEPTOS_EXPORT.deduccion;
    const fijosPercepcion = exportPercepcion.filter((nombre) => nombre !== "Otros");
    const fijosDeduccion = exportDeduccion.filter((nombre) => nombre !== "Otros");

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Obras y Armados";
    workbook.created = new Date();

    const resumen = workbook.addWorksheet("Resumen");
    const conceptoCols = [
      ...exportPercepcion.map((nombre) => ({
        header: nombre,
        key: conceptoExportKey("percepcion", nombre),
        width: Math.min(28, Math.max(12, nombre.length + 2)),
      })),
      ...exportDeduccion.map((nombre) => ({
        header: nombre,
        key: conceptoExportKey("deduccion", nombre),
        width: Math.min(28, Math.max(12, nombre.length + 2)),
      })),
    ];

    resumen.columns = [
      { header: "Trabajador", key: "trabajador", width: 32 },
      { header: "Cargo", key: "cargo", width: 22 },
      { header: "Departamento", key: "departamento", width: 18 },
      { header: "Especialidad", key: "especialidad", width: 18 },
      { header: "Teléfono", key: "telefono", width: 16 },
      { header: "Email", key: "email", width: 28 },
      { header: "Fecha de ingreso", key: "fechaIngreso", width: 16 },
      { header: "Experiencia", key: "experiencia", width: 18 },
      { header: "Estado", key: "estado", width: 14 },
      { header: "Sueldo base", key: "sueldoBase", width: 14 },
      ...conceptoCols,
      { header: "Total percepciones", key: "percepciones", width: 16 },
      { header: "Total deducciones", key: "deducciones", width: 16 },
      { header: "Neto", key: "neto", width: 14 },
      { header: "Estado pago", key: "estadoPago", width: 14 },
    ];
    resumen.getRow(1).font = { bold: true };

    for (const linea of lineas) {
      const row = {
        trabajador: linea.trabajador?.nombre || "",
        cargo: linea.trabajador?.cargo || linea.trabajador?.puesto || "",
        departamento: linea.trabajador?.departamento || "",
        especialidad: linea.trabajador?.especialidad || "",
        telefono: linea.trabajador?.telefono || "",
        email: linea.trabajador?.email || "",
        fechaIngreso: linea.trabajador?.fechaIngreso || "",
        experiencia: linea.trabajador?.experiencia || "",
        estado: linea.trabajador?.estado || "",
        sueldoBase: Number(linea.sueldoBase) || 0,
        percepciones: Number(linea.totalPercepciones) || 0,
        deducciones: Number(linea.totalDeducciones) || 0,
        neto: Number(linea.neto) || 0,
        estadoPago: linea.estadoPago,
      };
      for (const nombre of exportPercepcion) {
        row[conceptoExportKey("percepcion", nombre)] = montoConceptoExport(
          linea,
          "percepcion",
          nombre,
          fijosPercepcion
        );
      }
      for (const nombre of exportDeduccion) {
        row[conceptoExportKey("deduccion", nombre)] = montoConceptoExport(
          linea,
          "deduccion",
          nombre,
          fijosDeduccion
        );
      }
      resumen.addRow(row);
    }

    resumen.addRow({});
    resumen.addRow({
      trabajador: "TOTAL PERIODO",
      neto: Number(periodo.totalNeto) || 0,
    });
    resumen.lastRow.font = { bold: true };

    const moneyKeys = [
      "sueldoBase",
      "percepciones",
      "deducciones",
      "neto",
      ...conceptoCols.map((c) => c.key),
    ];
    moneyKeys.forEach((col) => {
      resumen.getColumn(col).numFmt = "#,##0.00";
    });

    const detalle = workbook.addWorksheet("Conceptos");
    detalle.columns = [
      { header: "Trabajador", key: "trabajador", width: 32 },
      { header: "Cargo", key: "cargo", width: 22 },
      { header: "Departamento", key: "departamento", width: 18 },
      { header: "Teléfono", key: "telefono", width: 16 },
      { header: "Email", key: "email", width: 28 },
      { header: "Tipo", key: "tipo", width: 14 },
      { header: "Concepto", key: "concepto", width: 36 },
      { header: "Monto", key: "monto", width: 14 },
    ];
    detalle.getRow(1).font = { bold: true };

    for (const linea of lineas) {
      const conceptos = [...(linea.conceptos || [])].sort((a, b) => {
        if (a.tipo === b.tipo) {
          return String(a.concepto).localeCompare(String(b.concepto), "es");
        }
        return a.tipo === "percepcion" ? -1 : 1;
      });
      for (const c of conceptos) {
        detalle.addRow({
          trabajador: linea.trabajador?.nombre || "",
          cargo: linea.trabajador?.cargo || linea.trabajador?.puesto || "",
          departamento: linea.trabajador?.departamento || "",
          telefono: linea.trabajador?.telefono || "",
          email: linea.trabajador?.email || "",
          tipo: c.tipo === "percepcion" ? "Percepción" : "Deducción",
          concepto: c.concepto,
          monto: Number(c.monto) || 0,
        });
      }
    }
    detalle.getColumn("monto").numFmt = "#,##0.00";

    const info = workbook.addWorksheet("Periodo");
    info.columns = [
      { header: "Campo", key: "campo", width: 20 },
      { header: "Valor", key: "valor", width: 40 },
    ];
    info.getRow(1).font = { bold: true };
    info.addRows([
      { campo: "Nombre", valor: periodo.nombre || "Sin nombre" },
      { campo: "Fecha inicio", valor: periodo.fechaInicio },
      { campo: "Fecha fin", valor: periodo.fechaFin },
      { campo: "Estado", valor: periodo.estado },
      { campo: "Total neto", valor: Number(periodo.totalNeto) || 0 },
      { campo: "Trabajadores", valor: lineas.length },
    ]);

    const label = safeFilenamePart(
      periodo.nombre || `${periodo.fechaInicio}_${periodo.fechaFin}`
    );
    const filename = `nomina_${label}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    logError("nomina.exportPeriodoXlsx", error);
    if (!res.headersSent) {
      return res.status(500).json({ message: "Error al exportar la nómina." });
    }
    return res.end();
  }
};

const normalizeValores = (raw) => {
  if (raw == null || raw === "") return { valores: [] };
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return { error: "Los valores deben ser una lista." };
    }
  }
  if (!Array.isArray(value)) return { error: "Los valores deben ser una lista." };
  const valores = [];
  for (const item of value) {
    const etiqueta = String(item?.etiqueta || "").trim();
    const valorRaw = item?.valor;
    const vacio =
      !etiqueta && (valorRaw === "" || valorRaw === null || valorRaw === undefined);
    if (vacio) continue;
    if (!etiqueta) return { error: "Cada opción necesita un nombre." };
    const valor = Number(valorRaw);
    if (!Number.isFinite(valor) || valor < 0) {
      return { error: `Valor inválido en «${etiqueta}».` };
    }
    valores.push({ etiqueta, valor: Number(valor.toFixed(2)) });
  }
  const nombres = new Set();
  for (const item of valores) {
    const key = item.etiqueta.toLowerCase();
    if (nombres.has(key)) {
      return { error: `La opción «${item.etiqueta}» está repetida.` };
    }
    nombres.add(key);
  }
  return { valores };
};

const esSueldoBaseNombre = (nombre) =>
  String(nombre || "").trim().toLowerCase() === "sueldo base";

const valoresDesdeCargos = async () => {
  const rows = await Trabajador.findAll({
    where: { bajaLogica: false },
    attributes: ["cargo", "puesto", "sueldoBase"],
  });
  const grupos = new Map();
  for (const row of rows) {
    const cargo = String(row.cargo || row.puesto || "").trim();
    if (!cargo) continue;
    const key = cargo.toLowerCase();
    if (!grupos.has(key)) grupos.set(key, { etiqueta: cargo, montos: new Set() });
    const sueldoRaw = row.sueldoBase;
    if (sueldoRaw === null || sueldoRaw === undefined || sueldoRaw === "") continue;
    const sueldo = Number(sueldoRaw);
    if (!Number.isFinite(sueldo) || sueldo < 0) continue;
    grupos.get(key).montos.add(Number(sueldo.toFixed(2)));
  }
  const opciones = [];
  const ordenados = [...grupos.values()].sort((a, b) =>
    a.etiqueta.localeCompare(b.etiqueta, "es")
  );
  for (const grupo of ordenados) {
    const montos = [...grupo.montos].sort((a, b) => a - b);
    if (montos.length === 0) {
      opciones.push({ etiqueta: grupo.etiqueta, valor: null });
      continue;
    }
    if (montos.length === 1) {
      opciones.push({ etiqueta: grupo.etiqueta, valor: montos[0] });
      continue;
    }
    for (const valor of montos) {
      opciones.push({
        etiqueta: `${grupo.etiqueta} · ${valor.toLocaleString("es-MX")}`,
        valor,
      });
    }
  }
  return opciones;
};

const conValoresDeCargos = async (concepto) => {
  if (!esSueldoBaseNombre(concepto.nombre)) return concepto;
  const cargos = await valoresDesdeCargos();
  const guardados = Array.isArray(concepto.valores) ? concepto.valores : [];
  const porEtiqueta = new Map(
    guardados.map((item) => [String(item.etiqueta || "").toLowerCase(), item])
  );
  const usados = new Set();
  const opciones = cargos.map((cargo) => {
    const key = cargo.etiqueta.toLowerCase();
    const guardado = porEtiqueta.get(key);
    if (guardado) {
      usados.add(key);
      return { etiqueta: cargo.etiqueta, valor: guardado.valor, origen: "cargo" };
    }
    return { etiqueta: cargo.etiqueta, valor: cargo.valor, origen: "cargo" };
  });
  for (const item of guardados) {
    const key = String(item.etiqueta || "").toLowerCase();
    if (!key || usados.has(key)) continue;
    opciones.push({ etiqueta: item.etiqueta, valor: item.valor, origen: "manual" });
  }
  return { ...concepto, valores: opciones };
};

const serializeGestionConcepto = (row) => {
  const json = typeof row.toJSON === "function" ? row.toJSON() : row;
  const parsed = normalizeValores(json.valores);
  return {
    id: json.id,
    nombre: json.nombre,
    tipo: json.tipo,
    modo: json.modo,
    activo: Boolean(json.activo),
    orden: Number(json.orden) || 0,
    valores: parsed.valores || [],
  };
};

const listGestionConceptos = async (req, res) => {
  try {
    const where = {};
    if (String(req.query.activo || "") === "true") where.activo = true;
    if (req.query.tipo === "percepcion" || req.query.tipo === "deduccion") {
      where.tipo = req.query.tipo;
    }
    const conceptos = await NominaGestionConcepto.findAll({
      where,
      order: [
        ["tipo", "ASC"],
        ["orden", "ASC"],
        ["nombre", "ASC"],
      ],
    });
    const serializados = await Promise.all(
      conceptos.map((row) => conValoresDeCargos(serializeGestionConcepto(row)))
    );
    return res.json({ conceptos: serializados });
  } catch (error) {
    logError("nomina.listGestionConceptos", error);
    return res.status(500).json({ message: "Error al listar los conceptos." });
  }
};

const createGestionConcepto = async (req, res) => {
  try {
    const nombre = String(req.body?.nombre || "").trim();
    const tipo = req.body?.tipo;
    const modo = req.body?.modo || "monto";
    const ordenRaw = req.body?.orden;
    if (!nombre) return res.status(400).json({ message: "El nombre es obligatorio." });
    if (tipo !== "percepcion" && tipo !== "deduccion") {
      return res.status(400).json({ message: "El tipo debe ser percepcion o deduccion." });
    }
    if (modo !== "monto" && modo !== "precio_cantidad") {
      return res.status(400).json({ message: "El modo de captura no es válido." });
    }
    const orden =
      ordenRaw === undefined || ordenRaw === null || ordenRaw === "" ? 0 : Number(ordenRaw);
    if (!Number.isFinite(orden)) return res.status(400).json({ message: "Orden inválido." });
    const valoresParsed = normalizeValores(req.body?.valores);
    if (valoresParsed.error) return res.status(400).json({ message: valoresParsed.error });
    const created = await NominaGestionConcepto.create({
      nombre,
      tipo,
      modo,
      orden,
      valores: valoresParsed.valores,
      activo: req.body?.activo === undefined ? true : Boolean(req.body.activo),
    });
    return res.status(201).json({
      concepto: await conValoresDeCargos(serializeGestionConcepto(created)),
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Ya existe un concepto con ese nombre y tipo." });
    }
    logError("nomina.createGestionConcepto", error);
    return res.status(500).json({ message: "Error al crear el concepto." });
  }
};

const updateGestionConcepto = async (req, res) => {
  try {
    const concepto = await NominaGestionConcepto.findByPk(req.params.id);
    if (!concepto) return res.status(404).json({ message: "Concepto no encontrado." });
    const updates = {};
    if (req.body?.nombre !== undefined) {
      const nombre = String(req.body.nombre || "").trim();
      if (!nombre) return res.status(400).json({ message: "El nombre es obligatorio." });
      updates.nombre = nombre;
    }
    if (req.body?.tipo !== undefined) {
      if (req.body.tipo !== "percepcion" && req.body.tipo !== "deduccion") {
        return res.status(400).json({ message: "El tipo debe ser percepcion o deduccion." });
      }
      updates.tipo = req.body.tipo;
    }
    if (req.body?.modo !== undefined) {
      if (req.body.modo !== "monto" && req.body.modo !== "precio_cantidad") {
        return res.status(400).json({ message: "El modo de captura no es válido." });
      }
      updates.modo = req.body.modo;
    }
    if (req.body?.orden !== undefined) {
      const orden = Number(req.body.orden);
      if (!Number.isFinite(orden)) return res.status(400).json({ message: "Orden inválido." });
      updates.orden = orden;
    }
    if (req.body?.activo !== undefined) updates.activo = Boolean(req.body.activo);
    if (req.body?.valores !== undefined) {
      const valoresParsed = normalizeValores(req.body.valores);
      if (valoresParsed.error) return res.status(400).json({ message: valoresParsed.error });
      updates.valores = valoresParsed.valores;
    }
    await concepto.update(updates);
    return res.json({
      concepto: await conValoresDeCargos(serializeGestionConcepto(concepto)),
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Ya existe un concepto con ese nombre y tipo." });
    }
    logError("nomina.updateGestionConcepto", error);
    return res.status(500).json({ message: "Error al actualizar el concepto." });
  }
};

const deleteGestionConcepto = async (req, res) => {
  try {
    const concepto = await NominaGestionConcepto.findByPk(req.params.id);
    if (!concepto) return res.status(404).json({ message: "Concepto no encontrado." });
    await concepto.destroy();
    return res.json({ ok: true });
  } catch (error) {
    logError("nomina.deleteGestionConcepto", error);
    return res.status(500).json({ message: "Error al eliminar el concepto." });
  }
};

module.exports = {
  listPeriodos,
  createPeriodo,
  getPeriodo,
  updatePeriodo,
  updateLinea,
  addConcepto,
  updateConcepto,
  deleteConcepto,
  listExtras,
  createExtra,
  updateExtra,
  exportPeriodoXlsx,
  listGestionConceptos,
  createGestionConcepto,
  updateGestionConcepto,
  deleteGestionConcepto,
};
