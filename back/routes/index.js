const express = require("express");
const { login } = require("../controllers/authController");
const auth = require("../middlewares/auth");
const authRoutes = require("./authRoutes");
const usersRoutes = require("./usersRoutes");

const router = express.Router();

// Endpoint publico.
router.post("/auth/login", login);

// El resto de rutas de /api requieren autenticacion.
router.use(auth);
router.use("/auth", authRoutes);
router.use("/users", usersRoutes);

module.exports = router;
