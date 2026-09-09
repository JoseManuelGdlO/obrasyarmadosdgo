const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const OrdenCompraPartida = sequelize.define(
  "OrdenCompraPartida",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    ordenCompraId: { type: DataTypes.UUID, allowNull: false },
    indice: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    cantidad: {
      type: DataTypes.DECIMAL(14, 4),
      allowNull: false,
      defaultValue: 0,
    },
    unidad: { type: DataTypes.STRING, allowNull: true },
    nombreProducto: { type: DataTypes.STRING, allowNull: false },
    caracteristicas: { type: DataTypes.TEXT, allowNull: true },
    paraQueSeUsara: { type: DataTypes.TEXT, allowNull: true },
    quienRecibeMaterial: { type: DataTypes.STRING, allowNull: true },
    quienLoUsa: { type: DataTypes.STRING, allowNull: true },
    quienLoPide: { type: DataTypes.STRING, allowNull: true },
    precioUnitario: {
      type: DataTypes.DECIMAL(14, 4),
      allowNull: false,
      defaultValue: 0,
    },
    importeTotal: {
      type: DataTypes.DECIMAL(14, 4),
      allowNull: false,
      defaultValue: 0,
    },
  },
  { tableName: "orden_compra_partidas", timestamps: true }
);

module.exports = OrdenCompraPartida;
