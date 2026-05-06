"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("role_permissions", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      rol: {
        type: Sequelize.ENUM("admin", "usuario", "maquinista"),
        allowNull: false,
      },
      permission: {
        type: Sequelize.STRING(80),
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addConstraint("role_permissions", {
      fields: ["rol", "permission"],
      type: "unique",
      name: "role_permissions_rol_permission_unique",
    });

    const now = new Date();
    const { randomUUID } = require("crypto");

    const rows = [];

    const addPerms = (rol, perms) => {
      for (const permission of perms) {
        rows.push({
          id: randomUUID(),
          rol,
          permission,
          createdAt: now,
          updatedAt: now,
        });
      }
    };

    addPerms("admin", [
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
    ]);

    addPerms("usuario", [
      "clientes.view",
      "articulos.view",
      "maquinas.view",
    ]);

    addPerms("maquinista", ["maquinas.read_assigned", "maquinas.update_assigned"]);

    await queryInterface.bulkInsert("role_permissions", rows);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("role_permissions");
  },
};
