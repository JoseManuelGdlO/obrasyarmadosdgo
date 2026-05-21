const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MaquinaTipo = sequelize.define(
  "MaquinaTipo",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    claseId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  { tableName: "maquina_tipos", timestamps: true }
);

module.exports = MaquinaTipo;
