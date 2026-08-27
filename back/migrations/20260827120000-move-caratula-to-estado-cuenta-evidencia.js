"use strict";

const { randomUUID } = require("crypto");
const { ESTADO_CUENTA_FIELDS } = require("../constants/estadoCuentaFields");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("proyecto_estimacion_estados_cuenta", "evidenciaEstimacion", {
      type: Sequelize.STRING(512),
      allowNull: true,
    });

    const [rows] = await queryInterface.sequelize.query(
      "SELECT id, caratula FROM proyecto_estimaciones WHERE caratula IS NOT NULL AND caratula != ''"
    );

    const now = new Date();
    for (const row of rows) {
      const [existing] = await queryInterface.sequelize.query(
        "SELECT id FROM proyecto_estimacion_estados_cuenta WHERE estimacionId = :estimacionId LIMIT 1",
        { replacements: { estimacionId: row.id } }
      );

      if (existing.length) {
        await queryInterface.sequelize.query(
          "UPDATE proyecto_estimacion_estados_cuenta SET evidenciaEstimacion = :ruta, updatedAt = :now WHERE estimacionId = :estimacionId",
          {
            replacements: {
              ruta: row.caratula,
              now,
              estimacionId: row.id,
            },
          }
        );
      } else {
        const montos = {};
        for (const field of ESTADO_CUENTA_FIELDS) {
          montos[field] = 0;
        }
        await queryInterface.bulkInsert("proyecto_estimacion_estados_cuenta", [
          {
            id: randomUUID(),
            estimacionId: row.id,
            ...montos,
            evidenciaEstimacion: row.caratula,
            createdAt: now,
            updatedAt: now,
          },
        ]);
      }
    }

    await queryInterface.removeColumn("proyecto_estimaciones", "caratula");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("proyecto_estimaciones", "caratula", {
      type: Sequelize.STRING(512),
      allowNull: true,
    });

    const [rows] = await queryInterface.sequelize.query(
      "SELECT estimacionId, evidenciaEstimacion FROM proyecto_estimacion_estados_cuenta WHERE evidenciaEstimacion IS NOT NULL AND evidenciaEstimacion != ''"
    );

    for (const row of rows) {
      await queryInterface.sequelize.query(
        "UPDATE proyecto_estimaciones SET caratula = :ruta WHERE id = :id",
        {
          replacements: {
            ruta: row.evidenciaEstimacion,
            id: row.estimacionId,
          },
        }
      );
    }

    await queryInterface.removeColumn(
      "proyecto_estimacion_estados_cuenta",
      "evidenciaEstimacion"
    );
  },
};
