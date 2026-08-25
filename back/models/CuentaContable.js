const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CuentaContable = sequelize.define(
  "CuentaContable",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    numero: { type: DataTypes.STRING, allowNull: false, unique: true },
    nombre: { type: DataTypes.STRING, allowNull: true },
    activa: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: "cuentas_contables", timestamps: true }
);

module.exports = CuentaContable;
