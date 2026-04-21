"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("maquinas", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      clienteId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "clientes", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      tipo: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      marca: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      modelo: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      placas: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      numeroSerie: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      estado: {
        type: Sequelize.ENUM(
          "Operativa",
          "Disponible",
          "Mantenimiento",
          "Fuera de Servicio"
        ),
        allowNull: false,
        defaultValue: "Operativa",
      },
      horometroInicial: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      horometroActual: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      horometroFinal: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      disponibilidad: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      fechaAdquisicion: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      ubicacion: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      ultimoMantenimiento: {
        type: Sequelize.DATEONLY,
        allowNull: true,
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
    await queryInterface.dropTable("maquinas");
  },
};
