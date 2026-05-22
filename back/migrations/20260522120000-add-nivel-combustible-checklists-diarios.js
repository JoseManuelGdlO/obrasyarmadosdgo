"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("checklists_diarios", "nivelCombustible", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("checklists_diarios", "nivelCombustible");
  },
};
