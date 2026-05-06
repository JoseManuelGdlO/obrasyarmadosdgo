"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("checklists_diarios", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      maquinaId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "maquinas", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      fecha: { type: Sequelize.DATEONLY, allowNull: false },
      operador: { type: Sequelize.STRING, allowNull: false },
      trabajadorId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "trabajadores", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      trabajadorNombre: { type: Sequelize.STRING, allowNull: true },
      lecturas: { type: Sequelize.JSON, allowNull: true },
      respuestas: { type: Sequelize.JSON, allowNull: true },
      itemsSnapshot: { type: Sequelize.JSON, allowNull: true },
      itemsTotal: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      itemsOk: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      observaciones: { type: Sequelize.TEXT, allowNull: true },
      notas: { type: Sequelize.TEXT, allowNull: true },
      userId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      source: {
        type: Sequelize.ENUM("interno", "publico"),
        allowNull: false,
        defaultValue: "interno",
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("checklists_diarios", ["maquinaId", "fecha"], {
      name: "checklists_diarios_maquina_fecha_idx",
    });
    await queryInterface.addIndex("checklists_diarios", ["fecha"], {
      name: "checklists_diarios_fecha_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("checklists_diarios");
  },
};
