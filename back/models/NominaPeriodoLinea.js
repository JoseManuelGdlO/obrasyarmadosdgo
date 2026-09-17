const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NominaPeriodoLinea = sequelize.define(
  "NominaPeriodoLinea",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    periodoId: { type: DataTypes.UUID, allowNull: false },
    trabajadorId: { type: DataTypes.UUID, allowNull: false },
    sueldoBase: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalPercepciones: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalDeducciones: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    neto: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    estadoPago: {
      type: DataTypes.ENUM("pendiente", "pagado"),
      allowNull: false,
      defaultValue: "pendiente",
    },
    pagadoEn: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "nomina_periodo_lineas", timestamps: true }
);

module.exports = NominaPeriodoLinea;
