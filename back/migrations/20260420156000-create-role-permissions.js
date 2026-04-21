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
      "users.manage",
      "clientes.crud",
      "articulos.crud",
      "maquinas.crud",
      "operadores.manage",
      "maquinas.read_assigned",
      "maquinas.update_assigned",
    ]);

    addPerms("usuario", [
      "clientes.crud",
      "articulos.crud",
      "maquinas.crud",
    ]);

    addPerms("maquinista", ["maquinas.read_assigned", "maquinas.update_assigned"]);

    await queryInterface.bulkInsert("role_permissions", rows);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("role_permissions");
  },
};
