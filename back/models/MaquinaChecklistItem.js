const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MaquinaChecklistItem = sequelize.define(
  "MaquinaChecklistItem",
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
    orden: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    label: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    itemType: {
      type: DataTypes.ENUM("check", "number"),
      allowNull: false,
      defaultValue: "check",
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "maquina_checklist_items",
    timestamps: true,
  }
);

module.exports = MaquinaChecklistItem;
