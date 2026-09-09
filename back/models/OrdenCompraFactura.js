const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const OrdenCompraFactura = sequelize.define(
  "OrdenCompraFactura",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    ordenCompraId: { type: DataTypes.UUID, allowNull: false },
    archivoPath: { type: DataTypes.STRING, allowNull: false },
    nombreOriginal: { type: DataTypes.STRING, allowNull: false },
    mimeType: { type: DataTypes.STRING, allowNull: false },
    uploadedBy: { type: DataTypes.UUID, allowNull: true },
  },
  { tableName: "orden_compra_facturas", timestamps: true }
);

module.exports = OrdenCompraFactura;
