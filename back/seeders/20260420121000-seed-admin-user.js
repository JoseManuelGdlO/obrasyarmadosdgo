"use strict";

const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const now = new Date();
    const [existing] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'admin@obrasyarmado.com' LIMIT 1",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (existing) {
      return;
    }

    await queryInterface.bulkInsert("users", [
      {
        id: randomUUID(),
        email: "admin@obrasyarmado.com",
        password: hashedPassword,
        rol: "admin",
        status: "activo",
        lastAccess: now,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("users", { email: "admin@obrasyarmado.com" });
  },
};
