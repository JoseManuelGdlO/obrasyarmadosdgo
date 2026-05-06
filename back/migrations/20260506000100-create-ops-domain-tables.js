"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("proveedores", {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      nombre: { type: Sequelize.STRING, allowNull: false },
      categoria: { type: Sequelize.STRING, allowNull: false, defaultValue: "general" },
      contacto: { type: Sequelize.STRING, allowNull: true },
      telefono: { type: Sequelize.STRING, allowNull: true },
      email: { type: Sequelize.STRING, allowNull: true },
      estado: { type: Sequelize.ENUM("activo", "inactivo"), allowNull: false, defaultValue: "activo" },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("trabajadores", {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      nombre: { type: Sequelize.STRING, allowNull: false },
      puesto: { type: Sequelize.STRING, allowNull: true },
      telefono: { type: Sequelize.STRING, allowNull: true },
      email: { type: Sequelize.STRING, allowNull: true },
      estado: { type: Sequelize.ENUM("activo", "inactivo"), allowNull: false, defaultValue: "activo" },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("proyectos", {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      clienteId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "clientes", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      nombre: { type: Sequelize.STRING, allowNull: false },
      descripcion: { type: Sequelize.TEXT, allowNull: true },
      estado: {
        type: Sequelize.ENUM("planeado", "en_progreso", "pausado", "completado"),
        allowNull: false,
        defaultValue: "planeado",
      },
      fechaInicio: { type: Sequelize.DATEONLY, allowNull: true },
      fechaFin: { type: Sequelize.DATEONLY, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("nomenclaturas", {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      codigo: { type: Sequelize.STRING, allowNull: false, unique: true },
      nombre: { type: Sequelize.STRING, allowNull: false },
      categoria: { type: Sequelize.STRING, allowNull: false, defaultValue: "general" },
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("asignaciones", {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      proyectoId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "proyectos", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      maquinaId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "maquinas", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      trabajadorId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "trabajadores", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      fechaInicio: { type: Sequelize.DATEONLY, allowNull: true },
      fechaFin: { type: Sequelize.DATEONLY, allowNull: true },
      estado: { type: Sequelize.ENUM("activa", "cerrada"), allowNull: false, defaultValue: "activa" },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("ordenes_trabajo", {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
      proyectoId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "proyectos", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      maquinaId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "maquinas", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      proveedorId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "proveedores", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      nomenclaturaId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "nomenclaturas", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      titulo: { type: Sequelize.STRING, allowNull: false },
      descripcion: { type: Sequelize.TEXT, allowNull: true },
      prioridad: {
        type: Sequelize.ENUM("baja", "media", "alta", "critica"),
        allowNull: false,
        defaultValue: "media",
      },
      estado: {
        type: Sequelize.ENUM("abierta", "en_progreso", "pausada", "cerrada"),
        allowNull: false,
        defaultValue: "abierta",
      },
      fechaProgramada: { type: Sequelize.DATEONLY, allowNull: true },
      fechaCierre: { type: Sequelize.DATEONLY, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("ordenes_trabajo");
    await queryInterface.dropTable("asignaciones");
    await queryInterface.dropTable("nomenclaturas");
    await queryInterface.dropTable("proyectos");
    await queryInterface.dropTable("trabajadores");
    await queryInterface.dropTable("proveedores");
  },
};
