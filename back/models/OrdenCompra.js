const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const OrdenCompra = sequelize.define(
  "OrdenCompra",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    empresa: { type: DataTypes.STRING, allowNull: true },
    clienteId: { type: DataTypes.UUID, allowNull: true },
    proyectoId: { type: DataTypes.UUID, allowNull: true },
    proyecto: { type: DataTypes.STRING, allowNull: false },
    proveedor: { type: DataTypes.STRING, allowNull: false },
    total: {
      type: DataTypes.DECIMAL(14, 4),
      allowNull: false,
      defaultValue: 0,
    },
    archivoImportPath: { type: DataTypes.STRING, allowNull: true },
  },
  { tableName: "ordenes_compra", timestamps: true }
);

module.exports = OrdenCompra;
