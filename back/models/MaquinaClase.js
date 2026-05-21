const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MaquinaClase = sequelize.define(
  "MaquinaClase",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  { tableName: "maquina_clases", timestamps: true }
);

module.exports = MaquinaClase;
