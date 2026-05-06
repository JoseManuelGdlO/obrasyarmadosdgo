"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("clientes", "tipoIndustria", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("clientes", "pais", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("clientes", "ciudad", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("clientes", "estado", {
      type: Sequelize.ENUM("activo", "en_configuracion", "suspendido", "inactivo"),
      allowNull: false,
      defaultValue: "activo",
    });
    await queryInterface.addColumn("clientes", "proyectosActivos", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("clientes", "proyectosActivos");
    await queryInterface.removeColumn("clientes", "estado");
    await queryInterface.removeColumn("clientes", "ciudad");
    await queryInterface.removeColumn("clientes", "pais");
    await queryInterface.removeColumn("clientes", "tipoIndustria");
  },
};
