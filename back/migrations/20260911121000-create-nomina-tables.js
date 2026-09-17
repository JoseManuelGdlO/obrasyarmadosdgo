"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("nomina_periodos", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      fechaInicio: { type: Sequelize.DATEONLY, allowNull: false },
      fechaFin: { type: Sequelize.DATEONLY, allowNull: false },
      nombre: { type: Sequelize.STRING, allowNull: true },
      estado: {
        type: Sequelize.ENUM("borrador", "cerrado"),
        allowNull: false,
        defaultValue: "borrador",
      },
      totalNeto: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("nomina_periodo_lineas", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      periodoId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "nomina_periodos", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      trabajadorId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "trabajadores", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      sueldoBase: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      totalPercepciones: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      totalDeducciones: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      neto: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      estadoPago: {
        type: Sequelize.ENUM("pendiente", "pagado"),
        allowNull: false,
        defaultValue: "pendiente",
      },
      pagadoEn: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex(
      "nomina_periodo_lineas",
      ["periodoId", "trabajadorId"],
      { unique: true, name: "nomina_periodo_lineas_uq" }
    );

    await queryInterface.createTable("nomina_linea_conceptos", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      lineaId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "nomina_periodo_lineas", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      tipo: {
        type: Sequelize.ENUM("percepcion", "deduccion"),
        allowNull: false,
      },
      concepto: { type: Sequelize.STRING, allowNull: false },
      monto: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("nomina_linea_conceptos", ["lineaId"], {
      name: "nomina_linea_conceptos_linea_idx",
    });

    await queryInterface.createTable("nomina_pagos_extras", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      trabajadorId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "trabajadores", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      fecha: { type: Sequelize.DATEONLY, allowNull: false },
      monto: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
      },
      concepto: { type: Sequelize.STRING, allowNull: false },
      estadoPago: {
        type: Sequelize.ENUM("pendiente", "pagado"),
        allowNull: false,
        defaultValue: "pendiente",
      },
      pagadoEn: { type: Sequelize.DATE, allowNull: true },
      creadoPor: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("nomina_pagos_extras", ["trabajadorId"], {
      name: "nomina_pagos_extras_trabajador_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("nomina_pagos_extras");
    await queryInterface.dropTable("nomina_linea_conceptos");
    await queryInterface.dropTable("nomina_periodo_lineas");
    await queryInterface.dropTable("nomina_periodos");
  },
};
