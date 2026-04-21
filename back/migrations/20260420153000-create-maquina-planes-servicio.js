"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("maquina_planes_servicio", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      maquinaId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "maquinas", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      frecuenciaTipo: {
        type: Sequelize.ENUM("km", "hrs", "meses"),
        allowNull: false,
      },
      frecuenciaValor: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("maquina_planes_servicio");
  },
};
