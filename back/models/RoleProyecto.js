const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RoleProyecto = sequelize.define(
  "RoleProyecto",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    rol: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    proyectoId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "role_proyectos",
    timestamps: true,
  }
);

module.exports = RoleProyecto;
