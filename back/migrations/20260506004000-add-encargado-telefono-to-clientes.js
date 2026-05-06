"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("clientes", "encargadoNombre", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("clientes", "telefono", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("clientes", "telefono");
    await queryInterface.removeColumn("clientes", "encargadoNombre");
  },
};
