"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("roles", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      nombre: {
        type: Sequelize.STRING(80),
        allowNull: false,
        unique: true,
      },
      descripcion: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      activo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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

    await queryInterface.changeColumn("users", "rol", {
      type: Sequelize.STRING(80),
      allowNull: false,
      defaultValue: "usuario",
    });

    await queryInterface.changeColumn("role_permissions", "rol", {
      type: Sequelize.STRING(80),
      allowNull: false,
    });

    const now = new Date();
    const { randomUUID } = require("crypto");
    await queryInterface.bulkInsert("roles", [
      { id: randomUUID(), nombre: "admin", descripcion: "Administrador", activo: true, createdAt: now, updatedAt: now },
      { id: randomUUID(), nombre: "usuario", descripcion: "Usuario general", activo: true, createdAt: now, updatedAt: now },
      { id: randomUUID(), nombre: "maquinista", descripcion: "Operador de máquinas", activo: true, createdAt: now, updatedAt: now },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("users", "rol", {
      type: Sequelize.ENUM("admin", "usuario", "maquinista"),
      allowNull: false,
      defaultValue: "usuario",
    });
    await queryInterface.changeColumn("role_permissions", "rol", {
      type: Sequelize.ENUM("admin", "usuario", "maquinista"),
      allowNull: false,
    });
    await queryInterface.dropTable("roles");
  },
};
