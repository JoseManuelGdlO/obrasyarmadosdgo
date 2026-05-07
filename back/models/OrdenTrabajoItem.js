const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const OrdenTrabajoItem = sequelize.define(
  "OrdenTrabajoItem",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    ordenTrabajoId: { type: DataTypes.UUID, allowNull: false },
    articuloId: { type: DataTypes.UUID, allowNull: false },
    cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    unidad: { type: DataTypes.STRING, allowNull: true },
    costoUnitario: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  },
  { tableName: "orden_trabajo_items", timestamps: true }
);

module.exports = OrdenTrabajoItem;
