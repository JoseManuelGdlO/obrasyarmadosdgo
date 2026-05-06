const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ESTADOS_TRABAJADOR = ["activo", "inactivo", "vacaciones", "licencia"];

const Trabajador = sequelize.define(
  "Trabajador",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    puesto: { type: DataTypes.STRING, allowNull: true },
    cargo: { type: DataTypes.STRING, allowNull: true },
    departamento: { type: DataTypes.STRING, allowNull: true },
    especialidad: { type: DataTypes.STRING, allowNull: true },
    telefono: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true },
    fechaIngreso: { type: DataTypes.DATEONLY, allowNull: true },
    experiencia: { type: DataTypes.STRING, allowNull: true },
    avatar: { type: DataTypes.STRING, allowNull: true },
    estado: {
      type: DataTypes.ENUM(...ESTADOS_TRABAJADOR),
      allowNull: false,
      defaultValue: "activo",
    },
  },
  { tableName: "trabajadores", timestamps: true }
);

module.exports = Trabajador;
module.exports.ESTADOS_TRABAJADOR = ESTADOS_TRABAJADOR;
