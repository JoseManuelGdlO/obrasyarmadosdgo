"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable("trabajadores");

    if (!tableDesc.bajaLogica) {
      await queryInterface.addColumn("trabajadores", "bajaLogica", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }

    if (!tableDesc.fechaBaja) {
      await queryInterface.addColumn("trabajadores", "fechaBaja", {
        type: Sequelize.DATEONLY,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable("trabajadores");

    if (tableDesc.fechaBaja) {
      await queryInterface.removeColumn("trabajadores", "fechaBaja");
    }

    if (tableDesc.bajaLogica) {
      await queryInterface.removeColumn("trabajadores", "bajaLogica");
    }
  },
};
