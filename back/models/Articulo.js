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
  },
  {
    tableName: "articulos",
    timestamps: true,
  }
);

module.exports = Articulo;
