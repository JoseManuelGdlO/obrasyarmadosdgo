"use strict";

const PERMISSIONS = [
  "cuentas_contables.view",
  "cuentas_contables.create",
  "cuentas_contables.edit",
  "cuentas_contables.delete",
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const tables = await queryInterface.showAllTables();
    const normalized = tables.map((t) =>
      typeof t === "string" ? t.toLowerCase() : String(t).toLowerCase()
    );

    if (normalized.includes("proveedores")) {
      const tableDesc = await queryInterface.describeTable("proveedores");
      if (tableDesc.cuentaContableId) {
        try {
          await queryInterface.removeIndex(
            "proveedores",
            "proveedores_cuenta_contable_id_unique"
          );
        } catch (_err) {
          // Index may not exist depending on dialect/name.
        }
        await queryInterface.removeColumn("proveedores", "cuentaContableId");
      }
    }

    if (normalized.includes("cuentas_contables")) {
      await queryInterface.dropTable("cuentas_contables");
    }

    await queryInterface.bulkDelete("role_permissions", {
      permission: PERMISSIONS,
    });
  },

  async down() {
    // Irreversible: feature removed from the application.
  },
};
