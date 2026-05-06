const Trabajador = require("../models/Trabajador");
const { buildSimpleCrudController } = require("./simpleCrudFactory");

module.exports = buildSimpleCrudController({
  model: Trabajador,
  entityName: "trabajador",
  listKey: "trabajadores",
  requiredFields: ["nombre"],
  searchableFields: ["nombre", "puesto", "email"],
});
