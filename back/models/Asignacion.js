const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Asignacion = sequelize.define(
  "Asignacion",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    proyectoId: { type: DataTypes.UUID, allowNull: false },
    maquinaId: { type: DataTypes.UUID, allowNull: false },
    trabajadorId: { type: DataTypes.UUID, allowNull: true },
    fechaInicio: { type: DataTypes.DATEONLY, allowNull: true },
    fechaFin: { type: DataTypes.DATEONLY, allowNull: true },
    estado: {
      type: DataTypes.ENUM("activa", "cerrada"),
      allowNull: false,
      defaultValue: "activa",
    },
  },
  { tableName: "asignaciones", timestamps: true }
);

module.exports = Asignacion;
