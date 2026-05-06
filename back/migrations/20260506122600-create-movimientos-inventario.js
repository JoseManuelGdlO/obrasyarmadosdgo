"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("movimientos_inventario", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      articuloId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "articulos", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      tipo: {
        type: Sequelize.ENUM("entrada", "salida", "ajuste"),
        allowNull: false,
      },
      cantidad: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      stockAnterior: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      stockNuevo: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      motivo: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      referencia: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      costoUnitario: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("movimientos_inventario");
  },
};
