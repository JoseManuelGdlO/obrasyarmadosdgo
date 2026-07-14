"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("proyecto_estimaciones", "factura", {
      type: Sequelize.STRING(120),
      allowNull: true,
    });
    await queryInterface.addColumn("proyecto_estimaciones", "retencionAmortizacion", {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("proyecto_estimaciones", "retencionAmortizacion");
    await queryInterface.removeColumn("proyecto_estimaciones", "factura");
  },
};
