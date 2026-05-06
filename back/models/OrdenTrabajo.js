const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const OrdenTrabajo = sequelize.define(
  "OrdenTrabajo",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    proyectoId: { type: DataTypes.UUID, allowNull: true },
    maquinaId: { type: DataTypes.UUID, allowNull: true },
    proveedorId: { type: DataTypes.UUID, allowNull: true },
    nomenclaturaId: { type: DataTypes.UUID, allowNull: true },
    titulo: { type: DataTypes.STRING, allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    prioridad: {
      type: DataTypes.ENUM("baja", "media", "alta", "critica"),
      allowNull: false,
      defaultValue: "media",
    },
    estado: {
      type: DataTypes.ENUM("abierta", "en_progreso", "pausada", "cerrada"),
      allowNull: false,
      defaultValue: "abierta",
    },
    fechaProgramada: { type: DataTypes.DATEONLY, allowNull: true },
    fechaCierre: { type: DataTypes.DATEONLY, allowNull: true },
  },
  { tableName: "ordenes_trabajo", timestamps: true }
);

module.exports = OrdenTrabajo;
