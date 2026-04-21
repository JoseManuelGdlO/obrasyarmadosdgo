const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ESTADOS_MAQUINA = [
  "Operativa",
  "Disponible",
  "Mantenimiento",
  "Fuera de Servicio",
];

const Maquina = sequelize.define(
  "Maquina",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    clienteId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    marca: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    modelo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    placas: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    numeroSerie: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM(...ESTADOS_MAQUINA),
      allowNull: false,
      defaultValue: "Operativa",
    },
    horometroInicial: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    horometroActual: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    horometroFinal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    disponibilidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0, max: 100 },
    },
    fechaAdquisicion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    ubicacion: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ultimoMantenimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  },
  {
    tableName: "maquinas",
    timestamps: true,
  }
);

module.exports = Maquina;
module.exports.ESTADOS_MAQUINA = ESTADOS_MAQUINA;
