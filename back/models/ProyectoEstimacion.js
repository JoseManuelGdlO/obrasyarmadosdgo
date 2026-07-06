const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ProyectoEstimacion = sequelize.define(
  "ProyectoEstimacion",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    proyectoId: { type: DataTypes.UUID, allowNull: false },
    numero: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    fechaEstimacion: { type: DataTypes.DATEONLY, allowNull: true },
    montoEstimacion: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    fechaPago: { type: DataTypes.DATEONLY, allowNull: true },
    montoPagado: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  },
  { tableName: "proyecto_estimaciones", timestamps: true }
);

module.exports = ProyectoEstimacion;
