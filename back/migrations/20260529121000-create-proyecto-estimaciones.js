"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("proyecto_estimaciones", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      proyectoId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "proyectos", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      numero: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      fechaEstimacion: { type: Sequelize.DATEONLY, allowNull: true },
      montoEstimacion: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      fechaPago: { type: Sequelize.DATEONLY, allowNull: true },
      montoPagado: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("proyecto_estimaciones", ["proyectoId"], {
      name: "proyecto_estimaciones_proyecto_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("proyecto_estimaciones");
  },
};
