"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("proyecto_estimacion_estados_cuenta", "infoEstimacionNo", {
      type: Sequelize.STRING(120),
      allowNull: true,
    });
    await queryInterface.addColumn("proyecto_estimacion_estados_cuenta", "infoOrdenCompraNo", {
      type: Sequelize.STRING(40),
      allowNull: true,
    });
    await queryInterface.addColumn("proyecto_estimacion_estados_cuenta", "infoFecha", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("proyecto_estimacion_estados_cuenta", "infoFecha");
    await queryInterface.removeColumn("proyecto_estimacion_estados_cuenta", "infoOrdenCompraNo");
    await queryInterface.removeColumn("proyecto_estimacion_estados_cuenta", "infoEstimacionNo");
  },
};
