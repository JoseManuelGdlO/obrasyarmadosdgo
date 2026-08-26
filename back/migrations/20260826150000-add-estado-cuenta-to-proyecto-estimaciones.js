"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const cols = [
      "contratoPrincipalSinIva",
      "acumuladoEstimacionAnterior",
      "estaEstimacion",
      "estimadoALaFecha",
      "saldoPorEstimar",
    ];
    for (const col of cols) {
      await queryInterface.addColumn("proyecto_estimaciones", col, {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      });
    }
  },

  async down(queryInterface) {
    for (const col of [
      "saldoPorEstimar",
      "estimadoALaFecha",
      "estaEstimacion",
      "acumuladoEstimacionAnterior",
      "contratoPrincipalSinIva",
    ]) {
      await queryInterface.removeColumn("proyecto_estimaciones", col);
    }
  },
};
