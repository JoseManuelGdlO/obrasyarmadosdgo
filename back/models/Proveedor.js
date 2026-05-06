const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ESTADOS_PROVEEDOR = ["activo", "inactivo", "en_evaluacion"];

const Proveedor = sequelize.define(
  "Proveedor",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    categoria: { type: DataTypes.STRING, allowNull: false, defaultValue: "general" },
    contacto: { type: DataTypes.STRING, allowNull: true },
    contactoPrincipal: { type: DataTypes.STRING, allowNull: true },
    telefono: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true },
    direccion: { type: DataTypes.STRING, allowNull: true },
    ciudad: { type: DataTypes.STRING, allowNull: true },
    especialidades: { type: DataTypes.JSON, allowNull: true },
    certificaciones: { type: DataTypes.JSON, allowNull: true },
    tiempoRespuesta: { type: DataTypes.STRING, allowNull: true },
    calificacion: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: false,
      defaultValue: 0,
    },
    ordenesCompletadas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    costoPromedio: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    estado: {
      type: DataTypes.ENUM(...ESTADOS_PROVEEDOR),
      allowNull: false,
      defaultValue: "activo",
    },
  },
  { tableName: "proveedores", timestamps: true }
);

module.exports = Proveedor;
module.exports.ESTADOS_PROVEEDOR = ESTADOS_PROVEEDOR;
