const Nomenclatura = require("../models/Nomenclatura");
const { buildSimpleCrudController } = require("./simpleCrudFactory");

module.exports = buildSimpleCrudController({
  model: Nomenclatura,
  entityName: "nomenclatura",
  listKey: "nomenclaturas",
  requiredFields: ["codigo", "nombre"],
  searchableFields: ["codigo", "nombre", "categoria"],
});
