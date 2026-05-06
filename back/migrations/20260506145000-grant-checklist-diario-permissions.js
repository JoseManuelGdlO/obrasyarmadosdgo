"use strict";

const { randomUUID } = require("crypto");

const NEW_PERMISSIONS = [
  "checklist_diario.view",
  "checklist_diario.create",
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const { QueryTypes } = queryInterface.sequelize;

    const roles = await queryInterface.sequelize.query(
      "SELECT DISTINCT rol FROM role_permissions",
      { type: QueryTypes.SELECT }
    );
    const rolesFromTable = roles.map((row) => row.rol).filter(Boolean);
    const roleSet = new Set([...rolesFromTable, "admin"]);

    const existingRows = await queryInterface.sequelize.query(
      "SELECT rol, permission FROM role_permissions WHERE permission IN (:perms)",
      {
        type: QueryTypes.SELECT,
        replacements: { perms: NEW_PERMISSIONS },
      }
    );
    const existing = new Set(
      existingRows.map((row) => `${row.rol}::${row.permission}`)
    );

    const toInsert = [];
    for (const rol of roleSet) {
      for (const permission of NEW_PERMISSIONS) {
        const key = `${rol}::${permission}`;
        if (!existing.has(key)) {
          toInsert.push({
            id: randomUUID(),
            rol,
            permission,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert("role_permissions", toInsert);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("role_permissions", {
      permission: NEW_PERMISSIONS,
    });
  },
};
