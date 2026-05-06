"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { QueryTypes } = queryInterface.sequelize;

    // Detectar y eliminar la FK por nombre real (varía según motor/instalación).
    const fkRows = await queryInterface.sequelize.query(
      `SELECT CONSTRAINT_NAME
         FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'maquinas'
          AND COLUMN_NAME = 'clienteId'
          AND REFERENCED_TABLE_NAME IS NOT NULL`,
      { type: QueryTypes.SELECT }
    );

    for (const row of fkRows) {
      const name = row.CONSTRAINT_NAME || row.constraint_name;
      if (name) {
        try {
          await queryInterface.removeConstraint("maquinas", name);
        } catch (err) {
          // Ignoramos si ya no existe.
        }
      }
    }

    // Eliminar también el índice asociado a la columna si existe.
    const idxRows = await queryInterface.sequelize.query(
      `SELECT INDEX_NAME
         FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'maquinas'
          AND COLUMN_NAME = 'clienteId'
          AND INDEX_NAME <> 'PRIMARY'`,
      { type: QueryTypes.SELECT }
    );
    for (const row of idxRows) {
      const name = row.INDEX_NAME || row.index_name;
      if (name) {
        try {
          await queryInterface.removeIndex("maquinas", name);
        } catch (err) {
          // Ignoramos si ya no existe.
        }
      }
    }

    // Finalmente, soltar la columna.
    const tableDesc = await queryInterface.describeTable("maquinas");
    if (tableDesc.clienteId) {
      await queryInterface.removeColumn("maquinas", "clienteId");
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable("maquinas");
    if (!tableDesc.clienteId) {
      await queryInterface.addColumn("maquinas", "clienteId", {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "clientes", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  },
};
