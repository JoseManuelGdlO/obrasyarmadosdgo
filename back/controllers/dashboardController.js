const { Op } = require("sequelize");
const OrdenTrabajo = require("../models/OrdenTrabajo");
const Maquina = require("../models/Maquina");
const Proyecto = require("../models/Proyecto");
const Cliente = require("../models/Cliente");
const ChecklistDiario = require("../models/ChecklistDiario");
const UsuarioMaquina = require("../models/UsuarioMaquina");
const Articulo = require("../models/Articulo");
const P = require("../constants/permissions");
const { hasMaquinasViewGlobal } = require("../middlewares/permissions");

const ACTIVE_MACHINE_STATES = ["Operativa", "Disponible"];

const todayStr = () => new Date().toISOString().slice(0, 10);

const trend = (value, isPositive) => ({ value, isPositive });

const countBy = (rows, key) =>
  rows.reduce((acc, row) => {
    const currentKey = row[key] || "unknown";
    acc[currentKey] = (acc[currentKey] || 0) + 1;
    return acc;
  }, {});

const formatOrderStatus = (estado) => {
  switch (estado) {
    case "cerrada":
      return "Completada";
    case "en_progreso":
      return "En Progreso";
    case "abierta":
      return "Pendiente";
    case "pausada":
      return "Pausada";
    default:
      return "Pendiente";
  }
};

const formatOrderPriority = (prioridad) => {
  switch (prioridad) {
    case "alta":
      return "Alta";
    case "critica":
      return "Alta";
    case "media":
      return "Media";
    case "baja":
    default:
      return "Baja";
  }
};

const listAccessibleMachines = async (req) => {
  if (hasMaquinasViewGlobal(req)) {
    return Maquina.findAll();
  }

  if (
    req.permissions?.has(P.MAQUINAS_READ_ASSIGNED) ||
    req.permissions?.has(P.MAQUINAS_UPDATE_ASSIGNED)
  ) {
    const links = await UsuarioMaquina.findAll({
      where: { userId: req.user.id },
      attributes: ["maquinaId"],
    });
    const maquinaIds = links.map((link) => link.maquinaId);
    if (maquinaIds.length === 0) return [];
    return Maquina.findAll({ where: { id: { [Op.in]: maquinaIds } } });
  }

  return [];
};

const getHome = async (req, res) => {
  try {
    const today = todayStr();
    const canViewOrders = req.user?.rol === "admin" || req.permissions?.has(P.ORDENES_VIEW);
    const canViewChecklists =
      req.user?.rol === "admin" || req.permissions?.has(P.CHECKLIST_DIARIO_VIEW);
    const canViewArticulos = req.user?.rol === "admin" || req.permissions?.has(P.ARTICULOS_VIEW);

    const maquinas = await listAccessibleMachines(req);
    const maquinasCountByState = countBy(maquinas, "estado");
    const maquinasTotal = maquinas.length;
    const maquinasActivas = ACTIVE_MACHINE_STATES.reduce(
      (acc, state) => acc + Number(maquinasCountByState[state] || 0),
      0
    );
    const fueraServicio = Number(maquinasCountByState["Fuera de Servicio"] || 0);
    const disponibilidadPromedio = maquinasTotal
      ? Math.round(
          maquinas.reduce((acc, maquina) => acc + Number(maquina.disponibilidad || 0), 0) /
            maquinasTotal
        )
      : 0;

    let ordenesAbiertas = 0;
    let ordenesEnProgreso = 0;
    let ordenesPausadas = 0;
    let ordenesCerradasHoy = 0;
    let ordenesPendientes = 0;
    let recentOrders = [];

    if (canViewOrders) {
      const ordenes = await OrdenTrabajo.findAll({
        attributes: [
          "id",
          "folio",
          "estado",
          "prioridad",
          "fechaCierre",
          "createdAt",
          "maquinaId",
          "proyectoId",
        ],
        include: [
          { model: Maquina, as: "maquina", attributes: ["id", "nombre"] },
          {
            model: Proyecto,
            as: "proyecto",
            attributes: ["id"],
            include: [{ model: Cliente, as: "cliente", attributes: ["id", "nombre"] }],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      const ordenesCountByState = countBy(ordenes, "estado");
      ordenesAbiertas = Number(ordenesCountByState.abierta || 0);
      ordenesEnProgreso = Number(ordenesCountByState.en_progreso || 0);
      ordenesPausadas = Number(ordenesCountByState.pausada || 0);
      ordenesPendientes = ordenesAbiertas;
      ordenesCerradasHoy = ordenes.filter(
        (orden) => orden.estado === "cerrada" && orden.fechaCierre === today
      ).length;

      recentOrders = ordenes.slice(0, 4).map((orden) => ({
        id: orden.folio || `OT-${orden.id.slice(0, 8)}`,
        machine: orden.maquina?.nombre || "Sin máquina",
        client: orden.proyecto?.cliente?.nombre || "Sin cliente",
        status: formatOrderStatus(orden.estado),
        priority: formatOrderPriority(orden.prioridad),
      }));
    }

    const maquinaIds = maquinas.map((maquina) => maquina.id);
    let checklistTotal = maquinasTotal;
    let checklistCompletados = 0;
    let checklistPendientes = checklistTotal;
    let checklistDetalle = [];

    if (canViewChecklists && maquinaIds.length > 0) {
      const checklistsHoy = await ChecklistDiario.findAll({
        where: {
          fecha: today,
          maquinaId: { [Op.in]: maquinaIds },
        },
        order: [["createdAt", "DESC"]],
      });

      const checklistsByMachine = new Map();
      for (const checklist of checklistsHoy) {
        if (!checklistsByMachine.has(checklist.maquinaId)) {
          checklistsByMachine.set(checklist.maquinaId, checklist);
        }
      }

      checklistDetalle = maquinas.map((maquina) => {
        const checklist = checklistsByMachine.get(maquina.id);
        const completado =
          checklist && Number(checklist.itemsTotal || 0) > 0
            ? Number(checklist.itemsOk || 0) >= Number(checklist.itemsTotal || 0)
            : false;
        return {
          placa: maquina.placas || "N/A",
          nombre: maquina.nombre,
          completado,
        };
      });

      checklistCompletados = checklistDetalle.filter((item) => item.completado).length;
      checklistPendientes = Math.max(0, checklistTotal - checklistCompletados);
    }

    const checklistPct = checklistTotal
      ? Math.round((checklistCompletados / checklistTotal) * 100)
      : 0;

    let inventarioAlertas = 0;
    if (canViewArticulos) {
      const articulos = await Articulo.findAll({
        attributes: ["stockActual", "stockMinimo"],
      });
      inventarioAlertas = articulos.filter(
        (articulo) => Number(articulo.stockActual || 0) <= Number(articulo.stockMinimo || 0)
      ).length;
    }

    return res.status(200).json({
      stats: {
        ordenesActivas: ordenesAbiertas + ordenesEnProgreso + ordenesPausadas,
        equiposFueraServicio: fueraServicio,
        maquinasActivas: maquinasActivas,
        disponibilidad: disponibilidadPromedio,
        checklist: {
          completados: checklistCompletados,
          total: checklistTotal,
          porcentaje: checklistPct,
        },
      },
      trends: {
        ordenesActivas: trend(ordenesAbiertas + ordenesEnProgreso + ordenesPausadas, true),
        equiposFueraServicio: trend(fueraServicio, false),
        maquinasActivas: trend(maquinasActivas, true),
        disponibilidad: trend(disponibilidadPromedio, disponibilidadPromedio >= 70),
      },
      recentOrders,
      checklist: {
        total: checklistTotal,
        completados: checklistCompletados,
        pendientes: checklistPendientes,
        detalle: checklistDetalle,
      },
      statusOverview: {
        completadasHoy: ordenesCerradasHoy,
        enProgreso: ordenesEnProgreso,
        pendientes: ordenesPendientes,
      },
      meta: {
        inventarioAlertas,
        maquinaCount: maquinasTotal,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener datos del dashboard.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getHome,
};
