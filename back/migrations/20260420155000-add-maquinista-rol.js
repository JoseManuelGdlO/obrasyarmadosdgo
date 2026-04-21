"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      "ALTER TABLE users MODIFY COLUMN rol ENUM('admin', 'usuario', 'maquinista') NOT NULL DEFAULT 'usuario'"
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "UPDATE users SET rol = 'usuario' WHERE rol = 'maquinista'"
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE users MODIFY COLUMN rol ENUM('admin', 'usuario') NOT NULL DEFAULT 'usuario'"
    );
  },
};
