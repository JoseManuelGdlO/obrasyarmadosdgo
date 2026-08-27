"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const cols = [
      "pagoDeduccion",
      "pagoOtrasDeducciones",
      "pagoEstaEstimacion",
      "pagoAmortizacionAnticipo",
      "pagoSubTotal1",
      "pagoRetencionFondoGarantia",
      "pagoSubTotal2",
      "pagoIva16",
      "pagoTotalAPagar",
      "anticipoTotalSinIva",
      "anticipoAcumuladoAnterior",
      "anticipoEstaEstimacion",
      "anticipoAcumuladoEsta",
      "anticipoSaldoPorAmortizar",
      "fondoTotalRetencionSinIva",
      "fondoAcumuladoAnterior",
      "fondoEstaEstimacion",
      "fondoAcumuladoEsta",
      "fondoSaldoPorRetener",
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
      "fondoSaldoPorRetener",
      "fondoAcumuladoEsta",
      "fondoEstaEstimacion",
      "fondoAcumuladoAnterior",
      "fondoTotalRetencionSinIva",
      "anticipoSaldoPorAmortizar",
      "anticipoAcumuladoEsta",
      "anticipoEstaEstimacion",
      "anticipoAcumuladoAnterior",
      "anticipoTotalSinIva",
      "pagoTotalAPagar",
      "pagoIva16",
      "pagoSubTotal2",
      "pagoRetencionFondoGarantia",
      "pagoSubTotal1",
      "pagoAmortizacionAnticipo",
      "pagoEstaEstimacion",
      "pagoOtrasDeducciones",
      "pagoDeduccion",
    ]) {
      await queryInterface.removeColumn("proyecto_estimaciones", col);
    }
  },
};
