"use strict";

const SEED = [
  { nombre: "Sueldo base", tipo: "percepcion", modo: "monto", orden: 0 },
  { nombre: "Bono", tipo: "percepcion", modo: "monto", orden: 1 },
  { nombre: "Horas extras", tipo: "percepcion", modo: "precio_cantidad", orden: 2 },
  { nombre: "Compensaciones y/o reposiciones", tipo: "percepcion", modo: "monto", orden: 3 },
  { nombre: "Otros", tipo: "percepcion", modo: "monto", orden: 4 },
  { nombre: "Faltas", tipo: "deduccion", modo: "precio_cantidad", orden: 1 },
  { nombre: "Descuento / Préstamos y/o tiempo", tipo: "deduccion", modo: "monto", orden: 2 },
  { nombre: "Retención de pensión alimenticia", tipo: "deduccion", modo: "monto", orden: 3 },
  { nombre: "Retención INFONAVIT", tipo: "deduccion", modo: "monto", orden: 4 },
  { nombre: "Otros", tipo: "deduccion", modo: "monto", orden: 5 },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("nomina_gestion_conceptos", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      nombre: { type: Sequelize.STRING, allowNull: false },
      tipo: {
        type: Sequelize.ENUM("percepcion", "deduccion"),
        allowNull: false,
      },
      modo: {
        type: Sequelize.ENUM("monto", "precio_cantidad"),
        allowNull: false,
        defaultValue: "monto",
      },
      activo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      orden: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("nomina_gestion_conceptos", ["tipo", "nombre"], {
      unique: true,
      name: "nomina_gestion_conceptos_tipo_nombre_unique",
    });

    const now = new Date();
    const { randomUUID } = require("crypto");
    await queryInterface.bulkInsert(
      "nomina_gestion_conceptos",
      SEED.map((row) => ({
        id: randomUUID(),
        nombre: row.nombre,
        tipo: row.tipo,
        modo: row.modo,
        activo: true,
        orden: row.orden,
        createdAt: now,
        updatedAt: now,
      }))
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("nomina_gestion_conceptos");
  },
};
