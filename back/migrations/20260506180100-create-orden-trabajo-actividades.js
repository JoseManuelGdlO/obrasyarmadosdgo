"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("orden_trabajo_actividades", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      ordenTrabajoId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "ordenes_trabajo", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      descripcion: { type: Sequelize.TEXT, allowNull: true },
      horaInicio: { type: Sequelize.TIME, allowNull: true },
      horaFin: { type: Sequelize.TIME, allowNull: true },
      orden: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex(
      "orden_trabajo_actividades",
      ["ordenTrabajoId"],
      { name: "orden_trabajo_actividades_ot_idx" }
    );

    await queryInterface.createTable("orden_trabajo_actividad_tecnicos", {
      actividadId: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: "orden_trabajo_actividades", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      trabajadorId: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: "trabajadores", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("orden_trabajo_actividad_tecnicos");
    await queryInterface.dropTable("orden_trabajo_actividades");
  },
};
