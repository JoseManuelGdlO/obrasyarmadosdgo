const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Nomenclatura = sequelize.define(
  "Nomenclatura",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    codigo: { type: DataTypes.STRING, allowNull: false, unique: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    categoria: { type: DataTypes.STRING, allowNull: false, defaultValue: "general" },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: "nomenclaturas", timestamps: true }
);

module.exports = Nomenclatura;
