const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RolePermission = sequelize.define(
  "RolePermission",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    rol: {
      type: DataTypes.ENUM("admin", "usuario", "maquinista"),
      allowNull: false,
    },
    permission: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
  },
  {
    tableName: "role_permissions",
    timestamps: true,
  }
);

module.exports = RolePermission;
