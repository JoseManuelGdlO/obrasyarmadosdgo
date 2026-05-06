const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Articulo = sequelize.define(
  "Articulo",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    categoria: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    codigo: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    stockActual: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    stockMinimo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    precioUnitario: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    proveedor: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ubicacion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    unidad: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "unidad",
    },
  },
  {
    tableName: "articulos",
    timestamps: true,
  }
);

module.exports = Articulo;
