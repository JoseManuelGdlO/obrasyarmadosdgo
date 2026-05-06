"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("articulos", "codigo", {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
    await queryInterface.addColumn("articulos", "stockActual", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn("articulos", "stockMinimo", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn("articulos", "precioUnitario", {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn("articulos", "proveedor", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("articulos", "ubicacion", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("articulos", "unidad", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "unidad",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("articulos", "unidad");
    await queryInterface.removeColumn("articulos", "ubicacion");
    await queryInterface.removeColumn("articulos", "proveedor");
    await queryInterface.removeColumn("articulos", "precioUnitario");
    await queryInterface.removeColumn("articulos", "stockMinimo");
    await queryInterface.removeColumn("articulos", "stockActual");
    await queryInterface.removeColumn("articulos", "codigo");
  },
};
