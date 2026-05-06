const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Proveedor = sequelize.define(
  "Proveedor",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    categoria: { type: DataTypes.STRING, allowNull: false, defaultValue: "general" },
    contacto: { type: DataTypes.STRING, allowNull: true },
    telefono: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true },
    estado: { type: DataTypes.ENUM("activo", "inactivo"), allowNull: false, defaultValue: "activo" },
  },
  { tableName: "proveedores", timestamps: true }
);

module.exports = Proveedor;
