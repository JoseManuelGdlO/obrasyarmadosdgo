const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NominaPagoExtra = sequelize.define(
  "NominaPagoExtra",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    trabajadorId: { type: DataTypes.UUID, allowNull: false },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    monto: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    concepto: { type: DataTypes.STRING, allowNull: false },
    estadoPago: {
      type: DataTypes.ENUM("pendiente", "pagado"),
      allowNull: false,
      defaultValue: "pendiente",
    },
    pagadoEn: { type: DataTypes.DATE, allowNull: true },
    creadoPor: { type: DataTypes.UUID, allowNull: true },
  },
  { tableName: "nomina_pagos_extras", timestamps: true }
);

module.exports = NominaPagoExtra;
