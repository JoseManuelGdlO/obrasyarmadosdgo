"use strict";

const { randomUUID } = require("crypto");

const TIPOS_SEED = [
  { nombre: "Excavadora", clase: "Maquinaria" },
  { nombre: "Grúa", clase: "Maquinaria" },
  { nombre: "Bulldozer", clase: "Maquinaria" },
  { nombre: "Pavimentadora", clase: "Maquinaria" },
  { nombre: "Compactadora", clase: "Maquinaria" },
  { nombre: "Montacargas", clase: "Maquinaria" },
  { nombre: "Camión", clase: "Vehículo" },
  { nombre: "Retroexcavadora", clase: "Maquinaria" },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.createTable("maquina_clases", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      activo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });

    await queryInterface.createTable("maquina_tipos", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      claseId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "maquina_clases", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      activo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });

    await queryInterface.addIndex("maquina_tipos", ["claseId", "nombre"], {
      unique: true,
      name: "maquina_tipos_claseId_nombre_unique",
    });

    const claseIds = {};
    for (const nombre of ["General", "Vehículo", "Maquinaria"]) {
      const id = randomUUID();
      claseIds[nombre] = id;
      await queryInterface.bulkInsert("maquina_clases", [
        { id, nombre, activo: true, createdAt: now, updatedAt: now },
      ]);
    }

    const tipoIdsByNombre = {};
    const ensureTipo = async (nombre, claseNombre) => {
      if (tipoIdsByNombre[nombre]) return tipoIdsByNombre[nombre];
      const id = randomUUID();
      const claseId = claseIds[claseNombre] || claseIds.General;
      await queryInterface.bulkInsert("maquina_tipos", [
        { id, nombre, claseId, activo: true, createdAt: now, updatedAt: now },
      ]);
      tipoIdsByNombre[nombre] = id;
      return id;
    };

    for (const item of TIPOS_SEED) {
      await ensureTipo(item.nombre, item.clase);
    }

    await queryInterface.addColumn("maquinas", "claseId", {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: "maquina_clases", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
    await queryInterface.addColumn("maquinas", "tipoId", {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: "maquina_tipos", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });

    const maquinas = await queryInterface.sequelize.query(
      "SELECT id, tipo FROM maquinas",
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const row of maquinas) {
      const tipoNombre = String(row.tipo || "").trim();
      let tipoId = tipoIdsByNombre[tipoNombre];
      if (!tipoId && tipoNombre) {
        tipoId = await ensureTipo(tipoNombre, "General");
      }
      if (!tipoId) {
        tipoId = await ensureTipo("Sin clasificar", "General");
      }
      const tipoRow = await queryInterface.sequelize.query(
        "SELECT claseId FROM maquina_tipos WHERE id = :tipoId LIMIT 1",
        {
          replacements: { tipoId },
          type: Sequelize.QueryTypes.SELECT,
        }
      );
      const claseId = tipoRow[0]?.claseId || claseIds.General;
      await queryInterface.sequelize.query(
        "UPDATE maquinas SET claseId = :claseId, tipoId = :tipoId WHERE id = :id",
        { replacements: { claseId, tipoId, id: row.id } }
      );
    }

    await queryInterface.changeColumn("maquinas", "claseId", {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: "maquina_clases", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
    await queryInterface.changeColumn("maquinas", "tipoId", {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: "maquina_tipos", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });

    await queryInterface.removeColumn("maquinas", "tipo");

    const docFields = [
      ["tipoCombustible", Sequelize.STRING],
      ["pedimento", Sequelize.STRING],
      ["pedimentoNumero", Sequelize.STRING],
      ["factura", Sequelize.STRING],
      ["facturaNumero", Sequelize.STRING],
      ["facturaImporte", Sequelize.DECIMAL(12, 2)],
      ["tarjeton", Sequelize.STRING],
      ["tarjetonNumero", Sequelize.STRING],
      ["contratoCompraventa", Sequelize.STRING],
      ["seguro", Sequelize.STRING],
      ["seguroVigencia", Sequelize.DATEONLY],
    ];

    for (const [name, type] of docFields) {
      await queryInterface.addColumn("maquinas", name, {
        type,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("maquinas", "tipo", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    const maquinas = await queryInterface.sequelize.query(
      `SELECT m.id, t.nombre AS tipoNombre
       FROM maquinas m
       LEFT JOIN maquina_tipos t ON m.tipoId = t.id`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const row of maquinas) {
      await queryInterface.sequelize.query(
        "UPDATE maquinas SET tipo = :tipo WHERE id = :id",
        {
          replacements: {
            tipo: row.tipoNombre || "General",
            id: row.id,
          },
        }
      );
    }

    await queryInterface.changeColumn("maquinas", "tipo", {
      type: Sequelize.STRING,
      allowNull: false,
    });

    const docFields = [
      "seguroVigencia",
      "seguro",
      "contratoCompraventa",
      "tarjetonNumero",
      "tarjeton",
      "facturaImporte",
      "facturaNumero",
      "factura",
      "pedimentoNumero",
      "pedimento",
      "tipoCombustible",
    ];
    for (const name of docFields) {
      await queryInterface.removeColumn("maquinas", name);
    }

    await queryInterface.removeColumn("maquinas", "tipoId");
    await queryInterface.removeColumn("maquinas", "claseId");
    await queryInterface.dropTable("maquina_tipos");
    await queryInterface.dropTable("maquina_clases");
  },
};
