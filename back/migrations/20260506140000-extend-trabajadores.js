"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable("trabajadores");

    if (!tableDesc.cargo) {
      await queryInterface.addColumn("trabajadores", "cargo", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!tableDesc.departamento) {
      await queryInterface.addColumn("trabajadores", "departamento", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!tableDesc.especialidad) {
      await queryInterface.addColumn("trabajadores", "especialidad", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!tableDesc.fechaIngreso) {
      await queryInterface.addColumn("trabajadores", "fechaIngreso", {
        type: Sequelize.DATEONLY,
        allowNull: true,
      });
    }
    if (!tableDesc.experiencia) {
      await queryInterface.addColumn("trabajadores", "experiencia", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!tableDesc.avatar) {
      await queryInterface.addColumn("trabajadores", "avatar", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    await queryInterface.changeColumn("trabajadores", "estado", {
      type: Sequelize.ENUM("activo", "inactivo", "vacaciones", "licencia"),
      allowNull: false,
      defaultValue: "activo",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("trabajadores", "estado", {
      type: Sequelize.ENUM("activo", "inactivo"),
      allowNull: false,
      defaultValue: "activo",
    });

    const tableDesc = await queryInterface.describeTable("trabajadores");
    const columnsToDrop = [
      "avatar",
      "experiencia",
      "fechaIngreso",
      "especialidad",
      "departamento",
      "cargo",
    ];
    for (const col of columnsToDrop) {
      if (tableDesc[col]) {
        await queryInterface.removeColumn("trabajadores", col);
      }
    }
  },
};
