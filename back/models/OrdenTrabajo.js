const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const OrdenTrabajo = sequelize.define(
  "OrdenTrabajo",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    folio: { type: DataTypes.STRING, allowNull: true, unique: true },
    proyectoId: { type: DataTypes.UUID, allowNull: true },
    maquinaId: { type: DataTypes.UUID, allowNull: true },
    proveedorId: { type: DataTypes.UUID, allowNull: true },
    nomenclaturaId: { type: DataTypes.UUID, allowNull: true },
    responsableId: { type: DataTypes.UUID, allowNull: true },
    titulo: { type: DataTypes.STRING, allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    descripcionProveedor: { type: DataTypes.TEXT, allowNull: true },
    ubicacionSnapshot: { type: DataTypes.STRING, allowNull: true },
    horometroSnapshot: { type: DataTypes.STRING, allowNull: true },
    horasInvertidas: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0,
    },
    costoTotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
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
    fechaVencimiento: { type: DataTypes.DATEONLY, allowNull: true },
    fechaCierre: { type: DataTypes.DATEONLY, allowNull: true },
  },
  { tableName: "ordenes_trabajo", timestamps: true }
);

module.exports = OrdenTrabajo;
