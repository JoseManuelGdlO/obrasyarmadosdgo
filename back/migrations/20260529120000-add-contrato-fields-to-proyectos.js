"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("proyectos", "cantidadContrato", {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn("proyectos", "modificacionContrato", {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn("proyectos", "fechaModificatoria", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("proyectos", "cantidadContrato");
    await queryInterface.removeColumn("proyectos", "modificacionContrato");
    await queryInterface.removeColumn("proyectos", "fechaModificatoria");
  },
};
