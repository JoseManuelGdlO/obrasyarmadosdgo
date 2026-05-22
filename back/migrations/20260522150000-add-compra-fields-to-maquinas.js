"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("maquinas", "costoVehiculo", {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
    });
    await queryInterface.addColumn("maquinas", "fechaFactura", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
    await queryInterface.addColumn("maquinas", "compradoA", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("maquinas", "compradoA");
    await queryInterface.removeColumn("maquinas", "fechaFactura");
    await queryInterface.removeColumn("maquinas", "costoVehiculo");
  },
};
