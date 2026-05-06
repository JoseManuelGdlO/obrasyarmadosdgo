const sequelize = require("../config/database");
const User = require("./User");
const Role = require("./Role");
const RolePermission = require("./RolePermission");
const UsuarioMaquina = require("./UsuarioMaquina");
const Cliente = require("./Cliente");
const Articulo = require("./Articulo");
const Maquina = require("./Maquina");
const MaquinaChecklistItem = require("./MaquinaChecklistItem");
const MaquinaPlanServicio = require("./MaquinaPlanServicio");
const PlanServicioPieza = require("./PlanServicioPieza");
const Proveedor = require("./Proveedor");
const Trabajador = require("./Trabajador");
const Proyecto = require("./Proyecto");
const Asignacion = require("./Asignacion");
const Nomenclatura = require("./Nomenclatura");
const OrdenTrabajo = require("./OrdenTrabajo");
const MovimientoInventario = require("./MovimientoInventario");
const ChecklistDiario = require("./ChecklistDiario");

Maquina.hasMany(MaquinaChecklistItem, {
  foreignKey: "maquinaId",
  as: "checklistItems",
  onDelete: "CASCADE",
});
MaquinaChecklistItem.belongsTo(Maquina, { foreignKey: "maquinaId", as: "maquina" });

Maquina.hasMany(MaquinaPlanServicio, {
  foreignKey: "maquinaId",
  as: "planesServicio",
  onDelete: "CASCADE",
});
MaquinaPlanServicio.belongsTo(Maquina, { foreignKey: "maquinaId", as: "maquina" });

MaquinaPlanServicio.hasMany(PlanServicioPieza, {
  foreignKey: "planServicioId",
  as: "piezas",
  onDelete: "CASCADE",
});
PlanServicioPieza.belongsTo(MaquinaPlanServicio, {
  foreignKey: "planServicioId",
  as: "planServicio",
});

Articulo.hasMany(PlanServicioPieza, {
  foreignKey: "articuloId",
  as: "planServicioPiezas",
});
PlanServicioPieza.belongsTo(Articulo, { foreignKey: "articuloId", as: "articulo" });

Articulo.hasMany(MovimientoInventario, {
  foreignKey: "articuloId",
  as: "movimientosInventario",
  onDelete: "CASCADE",
});
MovimientoInventario.belongsTo(Articulo, { foreignKey: "articuloId", as: "articulo" });

User.belongsToMany(Maquina, {
  through: UsuarioMaquina,
  foreignKey: "userId",
  otherKey: "maquinaId",
  as: "maquinasAsignadas",
});
Maquina.belongsToMany(User, {
  through: UsuarioMaquina,
  foreignKey: "maquinaId",
  otherKey: "userId",
  as: "operadores",
});

UsuarioMaquina.belongsTo(User, { foreignKey: "userId", as: "user" });
UsuarioMaquina.belongsTo(Maquina, { foreignKey: "maquinaId", as: "maquina" });

User.hasMany(UsuarioMaquina, { foreignKey: "userId", as: "asignacionesMaquina" });
Maquina.hasMany(UsuarioMaquina, { foreignKey: "maquinaId", as: "asignacionesOperadores" });

Cliente.hasMany(Proyecto, { foreignKey: "clienteId", as: "proyectos" });
Proyecto.belongsTo(Cliente, { foreignKey: "clienteId", as: "cliente" });

Proyecto.hasMany(Asignacion, { foreignKey: "proyectoId", as: "asignaciones" });
Asignacion.belongsTo(Proyecto, { foreignKey: "proyectoId", as: "proyecto" });
Maquina.hasMany(Asignacion, { foreignKey: "maquinaId", as: "asignaciones" });
Asignacion.belongsTo(Maquina, { foreignKey: "maquinaId", as: "maquina" });
Trabajador.hasMany(Asignacion, { foreignKey: "trabajadorId", as: "asignaciones" });
Asignacion.belongsTo(Trabajador, { foreignKey: "trabajadorId", as: "trabajador" });

Proyecto.hasMany(OrdenTrabajo, { foreignKey: "proyectoId", as: "ordenes" });
OrdenTrabajo.belongsTo(Proyecto, { foreignKey: "proyectoId", as: "proyecto" });
Maquina.hasMany(OrdenTrabajo, { foreignKey: "maquinaId", as: "ordenes" });
OrdenTrabajo.belongsTo(Maquina, { foreignKey: "maquinaId", as: "maquina" });
Proveedor.hasMany(OrdenTrabajo, { foreignKey: "proveedorId", as: "ordenes" });
OrdenTrabajo.belongsTo(Proveedor, { foreignKey: "proveedorId", as: "proveedor" });
Nomenclatura.hasMany(OrdenTrabajo, { foreignKey: "nomenclaturaId", as: "ordenes" });
OrdenTrabajo.belongsTo(Nomenclatura, { foreignKey: "nomenclaturaId", as: "nomenclatura" });

Maquina.hasMany(ChecklistDiario, {
  foreignKey: "maquinaId",
  as: "checklistsDiarios",
  onDelete: "CASCADE",
});
ChecklistDiario.belongsTo(Maquina, { foreignKey: "maquinaId", as: "maquina" });
Trabajador.hasMany(ChecklistDiario, {
  foreignKey: "trabajadorId",
  as: "checklistsDiarios",
});
ChecklistDiario.belongsTo(Trabajador, { foreignKey: "trabajadorId", as: "trabajador" });
User.hasMany(ChecklistDiario, { foreignKey: "userId", as: "checklistsDiarios" });
ChecklistDiario.belongsTo(User, { foreignKey: "userId", as: "usuario" });

module.exports = {
  sequelize,
  User,
  Role,
  RolePermission,
  UsuarioMaquina,
  Cliente,
  Articulo,
  Maquina,
  MaquinaChecklistItem,
  MaquinaPlanServicio,
  PlanServicioPieza,
  Proveedor,
  Trabajador,
  Proyecto,
  Asignacion,
  Nomenclatura,
  OrdenTrabajo,
  MovimientoInventario,
  ChecklistDiario,
};
