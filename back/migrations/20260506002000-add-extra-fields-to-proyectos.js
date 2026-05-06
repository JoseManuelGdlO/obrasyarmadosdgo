"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("proyectos", "ubicacion", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("proyectos", "presupuesto", {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn("proyectos", "progreso", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn("proyectos", "maquinasAsignadas", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn("proyectos", "responsable", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("proyectos", "responsable");
    await queryInterface.removeColumn("proyectos", "maquinasAsignadas");
    await queryInterface.removeColumn("proyectos", "progreso");
    await queryInterface.removeColumn("proyectos", "presupuesto");
    await queryInterface.removeColumn("proyectos", "ubicacion");
  },
};
