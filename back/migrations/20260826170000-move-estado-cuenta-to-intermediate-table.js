"use strict";

const { randomUUID } = require("crypto");
const { ESTADO_CUENTA_FIELDS } = require("../constants/estadoCuentaFields");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const montoCols = {};
    for (const field of ESTADO_CUENTA_FIELDS) {
      montoCols[field] = {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      };
    }

    await queryInterface.createTable("proyecto_estimacion_estados_cuenta", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      estimacionId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: "proyecto_estimaciones", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      ...montoCols,
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    const [rows] = await queryInterface.sequelize.query(
      `SELECT id, ${ESTADO_CUENTA_FIELDS.map((f) => `\`${f}\``).join(", ")} FROM proyecto_estimaciones`
    );

    const now = new Date();
    if (rows.length) {
      await queryInterface.bulkInsert(
        "proyecto_estimacion_estados_cuenta",
        rows.map((row) => {
          const montos = {};
          for (const field of ESTADO_CUENTA_FIELDS) {
            montos[field] = row[field] != null ? row[field] : 0;
          }
          return {
            id: randomUUID(),
            estimacionId: row.id,
            ...montos,
            createdAt: now,
            updatedAt: now,
          };
        })
      );
    }

    for (const field of [...ESTADO_CUENTA_FIELDS].reverse()) {
      await queryInterface.removeColumn("proyecto_estimaciones", field);
    }
  },

  async down(queryInterface, Sequelize) {
    for (const field of ESTADO_CUENTA_FIELDS) {
      await queryInterface.addColumn("proyecto_estimaciones", field, {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      });
    }

    const [rows] = await queryInterface.sequelize.query(
      "SELECT * FROM proyecto_estimacion_estados_cuenta"
    );

    for (const row of rows) {
      const sets = ESTADO_CUENTA_FIELDS.map((f) => `\`${f}\` = :${f}`).join(", ");
      const replacements = { id: row.estimacionId };
      for (const field of ESTADO_CUENTA_FIELDS) {
        replacements[field] = row[field];
      }
      await queryInterface.sequelize.query(
        `UPDATE proyecto_estimaciones SET ${sets} WHERE id = :id`,
        { replacements }
      );
    }

    await queryInterface.dropTable("proyecto_estimacion_estados_cuenta");
  },
};
