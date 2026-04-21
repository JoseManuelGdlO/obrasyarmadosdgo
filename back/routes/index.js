const express = require("express");
const { login } = require("../controllers/authController");
const auth = require("../middlewares/auth");
const {
  loadRolePermissions,
  requirePermission,
} = require("../middlewares/permissions");
const authRoutes = require("./authRoutes");
const usersRoutes = require("./usersRoutes");
const clientesRoutes = require("./clientesRoutes");
const articulosRoutes = require("./articulosRoutes");
const maquinasRoutes = require("./maquinasRoutes");
const planServicioPiezasRoutes = require("./planServicioPiezasRoutes");
const P = require("../constants/permissions");

const router = express.Router();

// Endpoint publico.
router.post("/auth/login", login);

// El resto de rutas de /api requieren autenticacion.
router.use(auth);
router.use(loadRolePermissions);
router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/clientes", requirePermission(P.CLIENTES_CRUD), clientesRoutes);
router.use("/articulos", requirePermission(P.ARTICULOS_CRUD), articulosRoutes);
router.use("/maquinas", maquinasRoutes);
router.use("/planes-servicio/:planId/piezas", planServicioPiezasRoutes);

module.exports = router;
