const OrdenTrabajo = require("../models/OrdenTrabajo");
const { buildSimpleCrudController } = require("./simpleCrudFactory");

module.exports = buildSimpleCrudController({
  model: OrdenTrabajo,
  entityName: "orden",
  listKey: "ordenes",
  requiredFields: ["titulo"],
  searchableFields: ["titulo", "descripcion", "estado", "prioridad"],
});
