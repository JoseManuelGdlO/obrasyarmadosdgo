require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const sequelize = require("./config/database");
const routes = require("./routes");
const requestLogger = require("./middlewares/requestLogger");
const errorHandler = require("./middlewares/errorHandler");
const { logger } = require("./utils/logger");
const {
  MACHINE_UPLOADS_DIR,
  MACHINE_UPLOADS_ROUTE,
  ensureMachineUploadsDir,
  WORKER_UPLOADS_DIR,
  WORKER_UPLOADS_ROUTE,
  ensureWorkerUploadsDir,
} = require("./config/uploads");
// Registra modelos y asociaciones Sequelize al iniciar la app.
require("./models");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";

// Permite definir múltiples orígenes separados por coma en CORS_ORIGIN.
const corsOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .map((origin) => origin.replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    // Si no se define lista, se habilita para cualquier origen (útil en desarrollo).
    origin:
      corsOrigins.length > 0
        ? (origin, callback) => {
            if (!origin) {
              return callback(null, true);
            }
            const normalizedOrigin = origin.replace(/\/+$/, "");
            return callback(null, corsOrigins.includes(normalizedOrigin));
          }
        : true,
  })
);
app.use(express.json());
ensureMachineUploadsDir();
ensureWorkerUploadsDir();
app.use(
  MACHINE_UPLOADS_ROUTE,
  express.static(path.resolve(MACHINE_UPLOADS_DIR), {
    maxAge: "7d",
  })
);
app.use(
  WORKER_UPLOADS_ROUTE,
  express.static(path.resolve(WORKER_UPLOADS_DIR), {
    maxAge: "7d",
  })
);
app.use(requestLogger);

// Endpoint liviano para chequeos de disponibilidad.
app.get("/health", (_req, res) => {
  return res.status(200).json({ status: "ok" });
});

// Agrupa endpoints de API bajo /api.
app.use("/api", routes);
app.use(errorHandler);

const startServer = async () => {
  try {
    // Valida la conexión a DB antes de aceptar tráfico HTTP.
    await sequelize.authenticate();

    app.listen(PORT, HOST, () => {
      logger.info(`Servidor backend corriendo en http://${HOST}:${PORT}/health`);
    });
  } catch (error) {
    logger.error(`Error al iniciar el servidor: ${error.message}`);
    process.exit(1);
  }
};

startServer();
