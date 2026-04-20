const jwt = require("jsonwebtoken");

// Middleware de protección para endpoints que requieren sesión válida.
const auth = (req, res, next) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return res.status(500).json({
      message: "Configuración de autenticación incompleta en el servidor.",
    });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Token no proporcionado." });
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Formato de token inválido." });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = {
      id: payload.id ?? payload.sub,
      email: payload.email,
      rol: payload.rol,
      status: payload.status,
    };

    if (req.user.status && req.user.status !== "activo") {
      return res.status(403).json({ message: "Su cuenta está suspendida." });
    }

    return next();
  } catch (_error) {
    return res.status(403).json({ message: "Token inválido o expirado." });
  }
};

module.exports = auth;
