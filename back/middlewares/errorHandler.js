const { logger } = require("../utils/logger");

const errorHandler = (error, req, res, _next) => {
  const path = `${req.baseUrl || ""}${req.path || ""}` || req.originalUrl?.split("?")[0] || "/";
  logger.error(
    `${req.method} ${path} unhandled ${error?.message || "Error interno del servidor"}`
  );

  if (error?.stack) {
    logger.error(error.stack);
  }

  if (res.headersSent) {
    return;
  }

  return res.status(500).json({
    message: "Error interno del servidor.",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
};

module.exports = errorHandler;
