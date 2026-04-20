"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Crea la versión base de users para entornos nuevos.
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      rol: {
        type: Sequelize.ENUM("admin", "usuario"),
        allowNull: false,
        defaultValue: "usuario",
      },
      status: {
        type: Sequelize.ENUM("activo", "suspendido"),
        allowNull: false,
        defaultValue: "activo",
      },
      lastAccess: {
        type: Sequelize.DATE,
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

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable("users");
  },
};
