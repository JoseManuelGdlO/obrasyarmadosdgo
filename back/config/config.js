require("dotenv").config();

// Configuración base consumida por sequelize-cli (migraciones y seeders).
const baseConfig = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  dialect: process.env.DB_DIALECT || "mysql",
  logging: false,
};

module.exports = {
  // Se replica la misma configuración por simplicidad en este proyecto.
  development: baseConfig,
  test: baseConfig,
  production: baseConfig,
};
