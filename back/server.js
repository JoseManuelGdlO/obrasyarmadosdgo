require("dotenv").config();

const express = require("express");
const cors = require("cors");
const sequelize = require("./config/database");
const authRoutes = require("./routes/authRoutes");
// Asegura que el modelo quede registrado en Sequelize al iniciar la app.
require("./models/User");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Permite definir múltiples orígenes separados por coma en CORS_ORIGIN.
const corsOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    // Si no se define lista, se habilita para cualquier origen (útil en desarrollo).
    origin: corsOrigins.length > 0 ? corsOrigins : true,
  })
);
app.use(express.json());

// Endpoint liviano para chequeos de disponibilidad.
app.get("/health", (_req, res) => {
  return res.status(200).json({ status: "ok" });
});

// Agrupa los endpoints de autenticación bajo /api/auth.
app.use("/api/auth", authRoutes);

const startServer = async () => {
  try {
    // Valida la conexión a DB antes de aceptar tráfico HTTP.
    await sequelize.authenticate();

    app.listen(PORT, () => {
      console.log(`Servidor backend corriendo en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error("Error al iniciar el servidor:", error.message);
    process.exit(1);
  }
};

startServer();
