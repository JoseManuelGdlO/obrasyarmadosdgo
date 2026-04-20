"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable("users");

    if (!tableDefinition.rol) {
      await queryInterface.addColumn("users", "rol", {
        type: Sequelize.ENUM("admin", "usuario"),
        allowNull: false,
        defaultValue: "usuario",
      });
    }

    if (!tableDefinition.status) {
      await queryInterface.addColumn("users", "status", {
        type: Sequelize.ENUM("activo", "suspendido"),
        allowNull: false,
        defaultValue: "activo",
      });
    }

    if (!tableDefinition.lastAccess) {
      await queryInterface.addColumn("users", "lastAccess", {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableDefinition = await queryInterface.describeTable("users");

    if (tableDefinition.lastAccess) {
      await queryInterface.removeColumn("users", "lastAccess");
    }

    if (tableDefinition.status) {
      await queryInterface.removeColumn("users", "status");
    }

    if (tableDefinition.rol) {
      await queryInterface.removeColumn("users", "rol");
    }
  },
};
