const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SOURCES = ["interno", "publico"];

const ChecklistDiario = sequelize.define(
  "ChecklistDiario",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    maquinaId: { type: DataTypes.UUID, allowNull: false },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    operador: { type: DataTypes.STRING, allowNull: false },
    trabajadorId: { type: DataTypes.UUID, allowNull: true },
    trabajadorNombre: { type: DataTypes.STRING, allowNull: true },
    lecturas: { type: DataTypes.JSON, allowNull: true },
    respuestas: { type: DataTypes.JSON, allowNull: true },
    itemsSnapshot: { type: DataTypes.JSON, allowNull: true },
    itemsTotal: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    itemsOk: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    observaciones: { type: DataTypes.TEXT, allowNull: true },
    notas: { type: DataTypes.TEXT, allowNull: true },
    userId: { type: DataTypes.UUID, allowNull: true },
    source: {
      type: DataTypes.ENUM(...SOURCES),
      allowNull: false,
      defaultValue: "interno",
    },
  },
  { tableName: "checklists_diarios", timestamps: true }
);

module.exports = ChecklistDiario;
module.exports.SOURCES = SOURCES;
