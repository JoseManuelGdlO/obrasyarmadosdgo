"use strict";

const { DATOS_ESTIMACION_FIELDS } = require("../constants/datosEstimacionFields");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    for (const field of DATOS_ESTIMACION_FIELDS) {
      await queryInterface.addColumn("proyecto_estimacion_estados_cuenta", field, {
        type: Sequelize.STRING(512),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    for (const field of [...DATOS_ESTIMACION_FIELDS].reverse()) {
      await queryInterface.removeColumn("proyecto_estimacion_estados_cuenta", field);
    }
  },
};
