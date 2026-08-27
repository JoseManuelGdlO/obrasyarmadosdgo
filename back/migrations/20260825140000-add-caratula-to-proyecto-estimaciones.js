"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("proyecto_estimaciones", "caratula", {
      type: Sequelize.STRING(512),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("proyecto_estimaciones", "caratula");
  },
};
