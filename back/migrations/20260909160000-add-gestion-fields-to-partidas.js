"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("orden_compra_partidas", "quienRecibeMaterial", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("orden_compra_partidas", "quienLoUsa", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("orden_compra_partidas", "quienLoPide", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("orden_compra_partidas", "quienRecibeMaterial");
    await queryInterface.removeColumn("orden_compra_partidas", "quienLoUsa");
    await queryInterface.removeColumn("orden_compra_partidas", "quienLoPide");
  },
};
