const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UsuarioMaquina = sequelize.define(
  "UsuarioMaquina",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    maquinaId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "usuario_maquinas",
    timestamps: true,
  }
);

module.exports = UsuarioMaquina;
