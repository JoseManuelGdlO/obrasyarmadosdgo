const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Trabajador = sequelize.define(
  "Trabajador",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    puesto: { type: DataTypes.STRING, allowNull: true },
    telefono: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true },
    estado: { type: DataTypes.ENUM("activo", "inactivo"), allowNull: false, defaultValue: "activo" },
  },
  { tableName: "trabajadores", timestamps: true }
);

module.exports = Trabajador;
