"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("maquinas", "idu", {
      type: Sequelize.STRING(3),
      allowNull: false,
    });
    await queryInterface.addIndex("maquinas", ["idu"], {
      unique: true,
      name: "maquinas_idu_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("maquinas", "maquinas_idu_unique");
    await queryInterface.removeColumn("maquinas", "idu");
  },
};
