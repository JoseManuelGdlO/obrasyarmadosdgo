const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NominaPeriodo = sequelize.define(
  "NominaPeriodo",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    fechaInicio: { type: DataTypes.DATEONLY, allowNull: false },
    fechaFin: { type: DataTypes.DATEONLY, allowNull: false },
    nombre: { type: DataTypes.STRING, allowNull: true },
    estado: {
      type: DataTypes.ENUM("borrador", "cerrado"),
      allowNull: false,
      defaultValue: "borrador",
    },
    totalNeto: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  { tableName: "nomina_periodos", timestamps: true }
);

module.exports = NominaPeriodo;
