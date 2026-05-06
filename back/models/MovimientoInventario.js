const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MovimientoInventario = sequelize.define(
  "MovimientoInventario",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    articuloId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.ENUM("entrada", "salida", "ajuste"),
      allowNull: false,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    stockAnterior: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    stockNuevo: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    motivo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    referencia: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    costoUnitario: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: "movimientos_inventario",
    timestamps: true,
  }
);

module.exports = MovimientoInventario;
