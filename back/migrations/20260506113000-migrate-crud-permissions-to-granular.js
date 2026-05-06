"use strict";

const { randomUUID } = require("crypto");

const CRUD_MAPPING = {
  "users.manage": ["users.view", "users.create", "users.edit", "users.delete"],
  "clientes.crud": ["clientes.view", "clientes.create", "clientes.edit", "clientes.delete"],
  "articulos.crud": ["articulos.view", "articulos.create", "articulos.edit", "articulos.delete"],
  "maquinas.crud": ["maquinas.view", "maquinas.create", "maquinas.edit", "maquinas.delete"],
  "operadores.manage": ["operadores.view", "operadores.create", "operadores.delete"],
  "proveedores.crud": ["proveedores.view", "proveedores.create", "proveedores.edit", "proveedores.delete"],
  "trabajadores.crud": ["trabajadores.view", "trabajadores.create", "trabajadores.edit", "trabajadores.delete"],
  "proyectos.crud": ["proyectos.view", "proyectos.create", "proyectos.edit", "proyectos.delete"],
  "asignaciones.crud": ["asignaciones.view", "asignaciones.create", "asignaciones.edit", "asignaciones.delete"],
  "nomenclaturas.crud": ["nomenclaturas.view", "nomenclaturas.create", "nomenclaturas.edit", "nomenclaturas.delete"],
  "ordenes.crud": ["ordenes.view", "ordenes.create", "ordenes.edit", "ordenes.delete"],
};

const LEGACY_PERMISSIONS = Object.keys(CRUD_MAPPING);

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const { QueryTypes } = queryInterface.sequelize;
    const rows = await queryInterface.sequelize.query(
      "SELECT rol, permission FROM role_permissions",
      { type: QueryTypes.SELECT }
    );

    const existing = new Set(rows.map((row) => `${row.rol}:${row.permission}`));
    const toInsert = [];

    for (const row of rows) {
      const granular = CRUD_MAPPING[row.permission];
      if (!granular) {
        continue;
      }

      for (const permission of granular) {
        const key = `${row.rol}:${permission}`;
        if (existing.has(key)) {
          continue;
        }
        existing.add(key);
        toInsert.push({
          id: randomUUID(),
          rol: row.rol,
          permission,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert("role_permissions", toInsert);
    }

    await queryInterface.bulkDelete("role_permissions", {
      permission: LEGACY_PERMISSIONS,
    });
  },

  async down(queryInterface) {
    const now = new Date();
    const { QueryTypes } = queryInterface.sequelize;
    const rows = await queryInterface.sequelize.query(
      "SELECT rol, permission FROM role_permissions",
      { type: QueryTypes.SELECT }
    );

    const existing = new Set(rows.map((row) => `${row.rol}:${row.permission}`));
    const toInsert = [];

    for (const [legacyPermission, granularPermissions] of Object.entries(CRUD_MAPPING)) {
      for (const row of rows) {
        if (!granularPermissions.includes(row.permission)) {
          continue;
        }
        const key = `${row.rol}:${legacyPermission}`;
        if (existing.has(key)) {
          continue;
        }
        existing.add(key);
        toInsert.push({
          id: randomUUID(),
          rol: row.rol,
          permission: legacyPermission,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert("role_permissions", toInsert);
    }

    const granularPermissions = [...new Set(Object.values(CRUD_MAPPING).flat())];
    await queryInterface.bulkDelete("role_permissions", {
      permission: granularPermissions,
    });
  },
};
