const Asignacion = require("../models/Asignacion");
const { buildSimpleCrudController } = require("./simpleCrudFactory");

module.exports = buildSimpleCrudController({
  model: Asignacion,
  entityName: "asignacion",
  listKey: "asignaciones",
  requiredFields: ["proyectoId", "maquinaId"],
  searchableFields: ["estado"],
});
