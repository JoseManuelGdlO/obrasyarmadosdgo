"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable("ordenes_trabajo");

    if (!tableDesc.folio) {
      await queryInterface.addColumn("ordenes_trabajo", "folio", {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      });
    }

    if (!tableDesc.responsableId) {
      await queryInterface.addColumn("ordenes_trabajo", "responsableId", {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "trabajadores", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
    }

    if (!tableDesc.ubicacionSnapshot) {
      await queryInterface.addColumn("ordenes_trabajo", "ubicacionSnapshot", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableDesc.horometroSnapshot) {
      await queryInterface.addColumn("ordenes_trabajo", "horometroSnapshot", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableDesc.horasInvertidas) {
      await queryInterface.addColumn("ordenes_trabajo", "horasInvertidas", {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 0,
      });
    }

    if (!tableDesc.costoTotal) {
      await queryInterface.addColumn("ordenes_trabajo", "costoTotal", {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      });
    }

    if (!tableDesc.descripcionProveedor) {
      await queryInterface.addColumn("ordenes_trabajo", "descripcionProveedor", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    if (!tableDesc.fechaVencimiento) {
      await queryInterface.addColumn("ordenes_trabajo", "fechaVencimiento", {
        type: Sequelize.DATEONLY,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable("ordenes_trabajo");
    const columnsToDrop = [
      "fechaVencimiento",
      "descripcionProveedor",
      "costoTotal",
      "horasInvertidas",
      "horometroSnapshot",
      "ubicacionSnapshot",
      "responsableId",
      "folio",
    ];
    for (const col of columnsToDrop) {
      if (tableDesc[col]) {
        await queryInterface.removeColumn("ordenes_trabajo", col);
      }
    }
  },
};
