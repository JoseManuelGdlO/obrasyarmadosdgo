const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ProyectoEstimacionFoto = sequelize.define(
  "ProyectoEstimacionFoto",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    estimacionId: { type: DataTypes.UUID, allowNull: false },
    ruta: { type: DataTypes.STRING(512), allowNull: false },
  },
  { tableName: "proyecto_estimacion_fotos", timestamps: true }
);

module.exports = ProyectoEstimacionFoto;
