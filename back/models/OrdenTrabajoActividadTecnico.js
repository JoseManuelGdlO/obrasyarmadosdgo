const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const OrdenTrabajoActividadTecnico = sequelize.define(
  "OrdenTrabajoActividadTecnico",
  {
    actividadId: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
    trabajadorId: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
  },
  { tableName: "orden_trabajo_actividad_tecnicos", timestamps: true }
);

module.exports = OrdenTrabajoActividadTecnico;
