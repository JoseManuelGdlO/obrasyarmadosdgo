"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ordenes_compra", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      fecha: { type: Sequelize.DATEONLY, allowNull: false },
      proyecto: { type: Sequelize.STRING, allowNull: false },
      proveedor: { type: Sequelize.STRING, allowNull: false },
      total: {
        type: Sequelize.DECIMAL(14, 4),
        allowNull: false,
        defaultValue: 0,
      },
      archivoImportPath: { type: Sequelize.STRING, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("ordenes_compra", ["fecha", "proyecto", "proveedor"], {
      unique: true,
      name: "ordenes_compra_fecha_proyecto_proveedor_uq",
    });
    await queryInterface.addIndex("ordenes_compra", ["proyecto"], {
      name: "ordenes_compra_proyecto_idx",
    });
    await queryInterface.addIndex("ordenes_compra", ["proveedor"], {
      name: "ordenes_compra_proveedor_idx",
    });

    await queryInterface.createTable("orden_compra_partidas", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      ordenCompraId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "ordenes_compra", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      indice: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      cantidad: {
        type: Sequelize.DECIMAL(14, 4),
        allowNull: false,
        defaultValue: 0,
      },
      unidad: { type: Sequelize.STRING, allowNull: true },
      nombreProducto: { type: Sequelize.STRING, allowNull: false },
      caracteristicas: { type: Sequelize.TEXT, allowNull: true },
      paraQueSeUsara: { type: Sequelize.TEXT, allowNull: true },
      precioUnitario: {
        type: Sequelize.DECIMAL(14, 4),
        allowNull: false,
        defaultValue: 0,
      },
      importeTotal: {
        type: Sequelize.DECIMAL(14, 4),
        allowNull: false,
        defaultValue: 0,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex(
      "orden_compra_partidas",
      ["ordenCompraId", "indice", "nombreProducto"],
      {
        unique: true,
        name: "orden_compra_partidas_uq",
      }
    );

    await queryInterface.createTable("orden_compra_facturas", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      ordenCompraId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "ordenes_compra", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      archivoPath: { type: Sequelize.STRING, allowNull: false },
      nombreOriginal: { type: Sequelize.STRING, allowNull: false },
      mimeType: { type: Sequelize.STRING, allowNull: false },
      uploadedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("orden_compra_facturas", ["ordenCompraId"], {
      name: "orden_compra_facturas_orden_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("orden_compra_facturas");
    await queryInterface.dropTable("orden_compra_partidas");
    await queryInterface.dropTable("ordenes_compra");
  },
};
