const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PlanServicioPieza = sequelize.define(
  "PlanServicioPieza",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    planServicioId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    articuloId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: { min: 1 },
    },
  },
  {
    tableName: "plan_servicio_piezas",
    timestamps: true,
  }
);

module.exports = PlanServicioPieza;
