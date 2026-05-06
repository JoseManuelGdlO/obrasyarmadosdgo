"use strict";

const { randomUUID } = require("crypto");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const permissions = [
      "proveedores.view",
      "proveedores.create",
      "proveedores.edit",
      "proveedores.delete",
      "trabajadores.view",
      "trabajadores.create",
      "trabajadores.edit",
      "trabajadores.delete",
      "proyectos.view",
      "proyectos.create",
      "proyectos.edit",
      "proyectos.delete",
      "asignaciones.view",
      "asignaciones.create",
      "asignaciones.edit",
      "asignaciones.delete",
      "nomenclaturas.view",
      "nomenclaturas.create",
      "nomenclaturas.edit",
      "nomenclaturas.delete",
      "ordenes.view",
      "ordenes.create",
      "ordenes.edit",
      "ordenes.delete",
    ];

    const existing = await queryInterface.sequelize.query(
      "SELECT permission FROM role_permissions WHERE rol = 'admin'",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const existingSet = new Set(existing.map((row) => row.permission));
    const toInsert = permissions
      .filter((permission) => !existingSet.has(permission))
      .map((permission) => ({
        id: randomUUID(),
        rol: "admin",
        permission,
        createdAt: now,
        updatedAt: now,
      }));

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert("role_permissions", toInsert);
    }

    await queryInterface.bulkInsert("nomenclaturas", [
      {
        id: randomUUID(),
        codigo: "OT-GRAL",
        nombre: "Orden general",
        categoria: "ordenes",
        activo: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("role_permissions", {
      rol: "admin",
      permission: [
        "proveedores.view",
        "proveedores.create",
        "proveedores.edit",
        "proveedores.delete",
        "trabajadores.view",
        "trabajadores.create",
        "trabajadores.edit",
        "trabajadores.delete",
        "proyectos.view",
        "proyectos.create",
        "proyectos.edit",
        "proyectos.delete",
        "asignaciones.view",
        "asignaciones.create",
        "asignaciones.edit",
        "asignaciones.delete",
        "nomenclaturas.view",
        "nomenclaturas.create",
        "nomenclaturas.edit",
        "nomenclaturas.delete",
        "ordenes.view",
        "ordenes.create",
        "ordenes.edit",
        "ordenes.delete",
      ],
    });
    await queryInterface.bulkDelete("nomenclaturas", { codigo: "OT-GRAL" });
  },
};
