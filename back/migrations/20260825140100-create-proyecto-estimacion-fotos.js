"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("proyecto_estimacion_fotos", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      estimacionId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "proyecto_estimaciones", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      ruta: {
        type: Sequelize.STRING(512),
        allowNull: false,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex("proyecto_estimacion_fotos", ["estimacionId"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("proyecto_estimacion_fotos");
  },
};
