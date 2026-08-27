const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { ESTADO_CUENTA_FIELDS } = require("../constants/estadoCuentaFields");
const { DATOS_ESTIMACION_FIELDS } = require("../constants/datosEstimacionFields");

const montoAttrs = Object.fromEntries(
  ESTADO_CUENTA_FIELDS.map((field) => [
    field,
    { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  ])
);

const datosAttrs = Object.fromEntries(
  DATOS_ESTIMACION_FIELDS.map((field) => [
    field,
    { type: DataTypes.STRING(512), allowNull: true },
  ])
);

const ProyectoEstimacionEstadoCuenta = sequelize.define(
  "ProyectoEstimacionEstadoCuenta",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    estimacionId: { type: DataTypes.UUID, allowNull: false, unique: true },
    ...montoAttrs,
    ...datosAttrs,
    evidenciaEstimacion: { type: DataTypes.STRING(512), allowNull: true },
  },
  { tableName: "proyecto_estimacion_estados_cuenta", timestamps: true }
);

module.exports = ProyectoEstimacionEstadoCuenta;
