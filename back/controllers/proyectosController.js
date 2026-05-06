const Proyecto = require("../models/Proyecto");
const { buildSimpleCrudController } = require("./simpleCrudFactory");

module.exports = buildSimpleCrudController({
  model: Proyecto,
  entityName: "proyecto",
  listKey: "proyectos",
  requiredFields: ["clienteId", "nombre"],
  searchableFields: ["nombre", "descripcion", "estado"],
});
