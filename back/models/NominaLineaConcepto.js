const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NominaLineaConcepto = sequelize.define(
  "NominaLineaConcepto",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    lineaId: { type: DataTypes.UUID, allowNull: false },
    tipo: {
      type: DataTypes.ENUM("percepcion", "deduccion"),
      allowNull: false,
    },
    concepto: { type: DataTypes.STRING, allowNull: false },
    monto: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  { tableName: "nomina_linea_conceptos", timestamps: true }
);

module.exports = NominaLineaConcepto;
