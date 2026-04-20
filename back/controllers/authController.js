const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Registro básico por email/password.
const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email y password son obligatorios.",
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        message: "El usuario ya existe.",
      });
    }

    // El hash se aplica vía hook beforeCreate del modelo User.
    await User.create({ email, password });

    return res.status(201).json({
      message: "Usuario registrado correctamente.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error interno al registrar usuario.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email y password son obligatorios.",
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        message: "Credenciales inválidas.",
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

    // El token incluye claims mínimos para identificar al usuario.
    const token = jwt.sign(
      { id: user.id, email: user.email },
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

module.exports = {
  register,
  login,
};
