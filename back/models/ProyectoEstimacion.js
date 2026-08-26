const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ProyectoEstimacion = sequelize.define(
  "ProyectoEstimacion",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    proyectoId: { type: DataTypes.UUID, allowNull: false },
    numero: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    fechaEstimacion: { type: DataTypes.DATEONLY, allowNull: true },
    montoEstimacion: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    fechaPago: { type: DataTypes.DATEONLY, allowNull: true },
    montoPagado: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    factura: { type: DataTypes.STRING(120), allowNull: true },
    retencionAmortizacion: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    caratula: { type: DataTypes.STRING(512), allowNull: true },
    contratoPrincipalSinIva: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    acumuladoEstimacionAnterior: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    estaEstimacion: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    estimadoALaFecha: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    saldoPorEstimar: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    pagoDeduccion: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    pagoOtrasDeducciones: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    pagoEstaEstimacion: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    pagoAmortizacionAnticipo: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    pagoSubTotal1: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    pagoRetencionFondoGarantia: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    pagoSubTotal2: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    pagoIva16: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    pagoTotalAPagar: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    anticipoTotalSinIva: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    anticipoAcumuladoAnterior: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    anticipoEstaEstimacion: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    anticipoAcumuladoEsta: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    anticipoSaldoPorAmortizar: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    fondoTotalRetencionSinIva: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    fondoAcumuladoAnterior: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    fondoEstaEstimacion: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    fondoAcumuladoEsta: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    fondoSaldoPorRetener: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  },
  { tableName: "proyecto_estimaciones", timestamps: true }
);

module.exports = ProyectoEstimacion;
