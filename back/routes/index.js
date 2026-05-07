const express = require("express");
const { login } = require("../controllers/authController");
const auth = require("../middlewares/auth");
const { loadRolePermissions } = require("../middlewares/permissions");
const authRoutes = require("./authRoutes");
const usersRoutes = require("./usersRoutes");
const rolesRoutes = require("./rolesRoutes");
const rolePermissionsRoutes = require("./rolePermissionsRoutes");
const clientesRoutes = require("./clientesRoutes");
const articulosRoutes = require("./articulosRoutes");
const maquinasRoutes = require("./maquinasRoutes");
const planServicioPiezasRoutes = require("./planServicioPiezasRoutes");
const proveedoresRoutes = require("./proveedoresRoutes");
const trabajadoresRoutes = require("./trabajadoresRoutes");
const proyectosRoutes = require("./proyectosRoutes");
const asignacionesRoutes = require("./asignacionesRoutes");
const nomenclaturasRoutes = require("./nomenclaturasRoutes");
const ordenesTrabajoRoutes = require("./ordenesTrabajoRoutes");
const movimientosInventarioRoutes = require("./movimientosInventarioRoutes");
const checklistsDiariosRoutes = require("./checklistsDiariosRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const notificationsRoutes = require("./notificationsRoutes");
const publicRoutes = require("./publicRoutes");

const router = express.Router();

// Endpoint publico.
router.post("/auth/login", login);

// Endpoints publicos para checklist diario via QR (sin auth).
router.use("/public", publicRoutes);

// El resto de rutas de /api requieren autenticacion.
router.use(auth);
router.use(loadRolePermissions);
router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/roles", rolesRoutes);
router.use("/role-permissions", rolePermissionsRoutes);
router.use("/clientes", clientesRoutes);
router.use("/articulos", articulosRoutes);
router.use("/movimientos-inventario", movimientosInventarioRoutes);
router.use("/maquinas", maquinasRoutes);
router.use("/planes-servicio/:planId/piezas", planServicioPiezasRoutes);
router.use("/proveedores", proveedoresRoutes);
router.use("/trabajadores", trabajadoresRoutes);
router.use("/proyectos", proyectosRoutes);
router.use("/asignaciones", asignacionesRoutes);
router.use("/nomenclaturas", nomenclaturasRoutes);
router.use("/ordenes-trabajo", ordenesTrabajoRoutes);
router.use("/checklists-diarios", checklistsDiariosRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/notifications", notificationsRoutes);

module.exports = router;
