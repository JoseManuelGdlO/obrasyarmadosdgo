"use strict";

const { randomUUID } = require("crypto");

const ADMIN_PERMISSIONS = [
  "users.view",
  "users.create",
  "users.edit",
  "users.delete",
  "roles.view",
  "roles.create",
  "roles.edit",
  "roles.delete",
  "role_permissions.view",
  "role_permissions.create",
  "role_permissions.delete",
  "clientes.view",
  "clientes.create",
  "clientes.edit",
  "clientes.delete",
  "articulos.view",
  "articulos.create",
  "articulos.edit",
  "articulos.delete",
  "maquinas.view",
  "maquinas.create",
  "maquinas.edit",
  "maquinas.delete",
  "operadores.view",
  "operadores.create",
  "operadores.delete",
  "maquinas.read_assigned",
  "maquinas.update_assigned",
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

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const { QueryTypes } = queryInterface.sequelize;

    // 1) Promover todos los usuarios actuales a admin.
    await queryInterface.bulkUpdate("users", { rol: "admin", updatedAt: now }, {});

    // 2) Asegurar que el rol admin exista en catálogo de roles.
    const roleAdmin = await queryInterface.sequelize.query(
      "SELECT id FROM roles WHERE nombre = 'admin' LIMIT 1",
      { type: QueryTypes.SELECT }
    );
    if (!roleAdmin.length) {
      await queryInterface.bulkInsert("roles", [
        {
          id: randomUUID(),
          nombre: "admin",
          descripcion: "Administrador",
          activo: true,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    } else {
      await queryInterface.bulkUpdate("roles", { activo: true, updatedAt: now }, { nombre: "admin" });
    }

    // 3) Asegurar que admin tenga todos los permisos.
    const existingRows = await queryInterface.sequelize.query(
      "SELECT permission FROM role_permissions WHERE rol = 'admin'",
      { type: QueryTypes.SELECT }
    );
    const existing = new Set(existingRows.map((row) => row.permission));
    const toInsert = ADMIN_PERMISSIONS
      .filter((permission) => !existing.has(permission))
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
  },

  async down(queryInterface) {
    // Reversión conservadora: no restaura roles previos de usuarios.
    // Solo elimina permisos granulares de admin insertados por esta migración.
    await queryInterface.bulkDelete("role_permissions", {
      rol: "admin",
      permission: ADMIN_PERMISSIONS,
    });
  },
};
