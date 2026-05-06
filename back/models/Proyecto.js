const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Proyecto = sequelize.define(
  "Proyecto",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    clienteId: { type: DataTypes.UUID, allowNull: false },
    nombre: { type: DataTypes.STRING, allowNull: false },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    ubicacion: { type: DataTypes.STRING, allowNull: true },
    presupuesto: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    progreso: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    maquinasAsignadas: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    responsable: { type: DataTypes.STRING, allowNull: true },
    estado: {
      type: DataTypes.ENUM("planeado", "en_progreso", "pausado", "completado"),
      allowNull: false,
      defaultValue: "planeado",
    },
    fechaInicio: { type: DataTypes.DATEONLY, allowNull: true },
    fechaFin: { type: DataTypes.DATEONLY, allowNull: true },
  },
  { tableName: "proyectos", timestamps: true }
);

module.exports = Proyecto;
