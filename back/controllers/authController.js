const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email y password son obligatorios.",
      });
    }

    const user = await User.unscoped().findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        message: "Credenciales inválidas.",
      });
    }

    if (user.status !== "activo") {
      return res.status(403).json({
        message: "Su cuenta está suspendida.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Credenciales inválidas.",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({
        message: "Configuración de autenticación incompleta en el servidor.",
      });
    }

    await user.update({ lastAccess: new Date() });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        rol: user.rol,
        status: user.status,
      },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRE || "24h" }
    );

    return res.status(200).json({
      message: "Login exitoso.",
      token,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error interno al iniciar sesión.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Emite un JWT sin expiración. Solo para administradores autenticados y activos.
 */
const issuePermanentToken = async (req, res) => {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({
        message: "Configuración de autenticación incompleta en el servidor.",
      });
    }

    const user = await User.findByPk(req.user.id);
    if (!user || user.status !== "activo" || user.rol !== "admin") {
      return res.status(403).json({
        message: "No autorizado para emitir este token.",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        rol: user.rol,
        status: user.status,
      },
      jwtSecret
    );

    return res.status(200).json({
      message: "Token permanente generado.",
      token,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error interno al generar token permanente.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  login,
  issuePermanentToken,
};
