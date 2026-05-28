"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable("maquinas");
    if (!tableDesc.numeroEconomico) {
      await queryInterface.addColumn("maquinas", "numeroEconomico", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable("maquinas");
    if (tableDesc.numeroEconomico) {
      await queryInterface.removeColumn("maquinas", "numeroEconomico");
    }
  },
};
