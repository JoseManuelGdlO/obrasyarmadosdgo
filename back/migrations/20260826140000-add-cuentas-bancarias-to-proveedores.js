"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable("proveedores");
    if (!tableDesc.cuentasBancarias) {
      await queryInterface.addColumn("proveedores", "cuentasBancarias", {
        type: Sequelize.JSON,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable("proveedores");
    if (tableDesc.cuentasBancarias) {
      await queryInterface.removeColumn("proveedores", "cuentasBancarias");
    }
  },
};
