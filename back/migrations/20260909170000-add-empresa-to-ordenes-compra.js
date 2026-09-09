"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("ordenes_compra", "empresa", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("ordenes_compra", "clienteId", {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: "clientes", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
    await queryInterface.addColumn("ordenes_compra", "proyectoId", {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: "proyectos", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
    await queryInterface.addIndex("ordenes_compra", ["clienteId"], {
      name: "ordenes_compra_cliente_idx",
    });
    await queryInterface.addIndex("ordenes_compra", ["proyectoId"], {
      name: "ordenes_compra_proyecto_id_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("ordenes_compra", "ordenes_compra_proyecto_id_idx");
    await queryInterface.removeIndex("ordenes_compra", "ordenes_compra_cliente_idx");
    await queryInterface.removeColumn("ordenes_compra", "proyectoId");
    await queryInterface.removeColumn("ordenes_compra", "clienteId");
    await queryInterface.removeColumn("ordenes_compra", "empresa");
  },
};
