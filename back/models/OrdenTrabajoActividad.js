const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const OrdenTrabajoActividad = sequelize.define(
  "OrdenTrabajoActividad",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    ordenTrabajoId: { type: DataTypes.UUID, allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    horaInicio: { type: DataTypes.TIME, allowNull: true },
    horaFin: { type: DataTypes.TIME, allowNull: true },
    orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { tableName: "orden_trabajo_actividades", timestamps: true }
);

module.exports = OrdenTrabajoActividad;
