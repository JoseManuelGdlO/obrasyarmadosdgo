const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MaquinaPlanServicio = sequelize.define(
  "MaquinaPlanServicio",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    maquinaId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    frecuenciaTipo: {
      type: DataTypes.ENUM("km", "hrs", "meses"),
      allowNull: false,
    },
    frecuenciaValor: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "maquina_planes_servicio",
    timestamps: true,
  }
);

module.exports = MaquinaPlanServicio;
