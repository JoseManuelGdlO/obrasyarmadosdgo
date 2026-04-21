"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("plan_servicio_piezas", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      planServicioId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "maquina_planes_servicio", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      articuloId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "articulos", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      cantidad: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
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

    await queryInterface.addConstraint("plan_servicio_piezas", {
      fields: ["planServicioId", "articuloId"],
      type: "unique",
      name: "plan_servicio_piezas_plan_articulo_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("plan_servicio_piezas");
  },
};
