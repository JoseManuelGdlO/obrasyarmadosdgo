"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("orden_trabajo_items", {
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
      articuloId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "articulos", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      cantidad: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      unidad: { type: Sequelize.STRING, allowNull: true },
      costoUnitario: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("orden_trabajo_items", ["ordenTrabajoId"], {
      name: "orden_trabajo_items_ot_idx",
    });
    await queryInterface.addIndex("orden_trabajo_items", ["articuloId"], {
      name: "orden_trabajo_items_articulo_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("orden_trabajo_items");
  },
};
