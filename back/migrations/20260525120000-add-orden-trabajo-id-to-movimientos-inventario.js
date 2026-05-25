"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("movimientos_inventario", "ordenTrabajoId", {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: "ordenes_trabajo", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await queryInterface.addIndex("movimientos_inventario", ["ordenTrabajoId", "motivo"], {
      name: "movimientos_inventario_orden_trabajo_motivo",
    });

    await queryInterface.sequelize.query(`
      UPDATE movimientos_inventario m
      INNER JOIN ordenes_trabajo o ON m.referencia = o.folio
      SET m.ordenTrabajoId = o.id
      WHERE m.motivo = 'Consumo OT' AND m.ordenTrabajoId IS NULL
    `);

    await queryInterface.sequelize.query(`
      UPDATE movimientos_inventario m
      INNER JOIN ordenes_trabajo o ON m.referencia = CONCAT('OT:', o.id)
      SET m.ordenTrabajoId = o.id
      WHERE m.motivo = 'Consumo OT' AND m.ordenTrabajoId IS NULL
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      "movimientos_inventario",
      "movimientos_inventario_orden_trabajo_motivo"
    );
    await queryInterface.removeColumn("movimientos_inventario", "ordenTrabajoId");
  },
};
