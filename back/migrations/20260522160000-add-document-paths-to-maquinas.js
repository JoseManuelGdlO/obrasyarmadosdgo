"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("maquinas", "pedimentoArchivoPath", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("maquinas", "polizaSeguroPath", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("maquinas", "polizaSeguroPath");
    await queryInterface.removeColumn("maquinas", "pedimentoArchivoPath");
  },
};
