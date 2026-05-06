const Proveedor = require("../models/Proveedor");
const { buildSimpleCrudController } = require("./simpleCrudFactory");

module.exports = buildSimpleCrudController({
  model: Proveedor,
  entityName: "proveedor",
  listKey: "proveedores",
  requiredFields: ["nombre"],
  searchableFields: ["nombre", "categoria", "contacto", "email"],
});
