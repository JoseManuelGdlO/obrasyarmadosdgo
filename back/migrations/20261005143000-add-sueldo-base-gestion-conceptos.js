"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT id FROM nomina_gestion_conceptos WHERE tipo = 'percepcion' AND nombre = 'Sueldo base' LIMIT 1"
    );
    if (rows.length > 0) return;

    const { randomUUID } = require("crypto");
    const now = new Date();
    await queryInterface.bulkInsert("nomina_gestion_conceptos", [
      {
        id: randomUUID(),
        nombre: "Sueldo base",
        tipo: "percepcion",
        modo: "monto",
        activo: true,
        orden: 0,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("nomina_gestion_conceptos", {
      tipo: "percepcion",
      nombre: "Sueldo base",
    });
  },
};
