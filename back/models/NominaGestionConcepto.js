const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NominaGestionConcepto = sequelize.define(
  "NominaGestionConcepto",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    tipo: {
      type: DataTypes.ENUM("percepcion", "deduccion"),
      allowNull: false,
    },
    modo: {
      type: DataTypes.ENUM("monto", "precio_cantidad"),
      allowNull: false,
      defaultValue: "monto",
    },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    valores: { type: DataTypes.JSON, allowNull: true },
  },
  { tableName: "nomina_gestion_conceptos", timestamps: true }
);

module.exports = NominaGestionConcepto;
