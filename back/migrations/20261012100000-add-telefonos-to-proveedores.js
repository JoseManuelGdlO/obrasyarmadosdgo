"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable("proveedores");
    if (!tableDesc.telefonos) {
      await queryInterface.addColumn("proveedores", "telefonos", {
        type: Sequelize.JSON,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable("proveedores");
    if (tableDesc.telefonos) {
      await queryInterface.removeColumn("proveedores", "telefonos");
    }
  },
};
