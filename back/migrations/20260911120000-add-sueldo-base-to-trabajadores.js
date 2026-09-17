"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable("trabajadores");
    if (!tableDesc.sueldoBase) {
      await queryInterface.addColumn("trabajadores", "sueldoBase", {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable("trabajadores");
    if (tableDesc.sueldoBase) {
      await queryInterface.removeColumn("trabajadores", "sueldoBase");
    }
  },
};
