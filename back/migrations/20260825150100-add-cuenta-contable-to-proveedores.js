"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable("proveedores");
    if (!tableDesc.cuentaContableId) {
      await queryInterface.addColumn("proveedores", "cuentaContableId", {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "cuentas_contables", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
      await queryInterface.addIndex("proveedores", ["cuentaContableId"], {
        unique: true,
        name: "proveedores_cuenta_contable_id_unique",
      });
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable("proveedores");
    if (tableDesc.cuentaContableId) {
      await queryInterface.removeIndex(
        "proveedores",
        "proveedores_cuenta_contable_id_unique"
      );
      await queryInterface.removeColumn("proveedores", "cuentaContableId");
    }
  },
};
