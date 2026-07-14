"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("role_proyectos", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      rol: {
        type: Sequelize.STRING(80),
        allowNull: false,
      },
      proyectoId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "proyectos", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
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

    await queryInterface.addConstraint("role_proyectos", {
      fields: ["rol", "proyectoId"],
      type: "unique",
      name: "role_proyectos_rol_proyecto_unique",
    });

    await queryInterface.addIndex("role_proyectos", ["rol"], {
      name: "role_proyectos_rol_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("role_proyectos");
  },
};
