const sequelize = require("../config/database");
const User = require("./User");
const RolePermission = require("./RolePermission");
const UsuarioMaquina = require("./UsuarioMaquina");
const Cliente = require("./Cliente");
const Articulo = require("./Articulo");
const Maquina = require("./Maquina");
const MaquinaChecklistItem = require("./MaquinaChecklistItem");
const MaquinaPlanServicio = require("./MaquinaPlanServicio");
const PlanServicioPieza = require("./PlanServicioPieza");

Cliente.hasMany(Maquina, { foreignKey: "clienteId", as: "maquinas" });
Maquina.belongsTo(Cliente, { foreignKey: "clienteId", as: "cliente" });

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

module.exports = {
  sequelize,
  User,
  RolePermission,
  UsuarioMaquina,
  Cliente,
  Articulo,
  Maquina,
  MaquinaChecklistItem,
  MaquinaPlanServicio,
  PlanServicioPieza,
};
