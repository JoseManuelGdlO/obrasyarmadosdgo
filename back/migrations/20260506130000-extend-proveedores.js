"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable("proveedores");

    if (!tableDesc.contactoPrincipal) {
      await queryInterface.addColumn("proveedores", "contactoPrincipal", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!tableDesc.direccion) {
      await queryInterface.addColumn("proveedores", "direccion", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!tableDesc.ciudad) {
      await queryInterface.addColumn("proveedores", "ciudad", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!tableDesc.especialidades) {
      await queryInterface.addColumn("proveedores", "especialidades", {
        type: Sequelize.JSON,
        allowNull: true,
      });
    }
    if (!tableDesc.certificaciones) {
      await queryInterface.addColumn("proveedores", "certificaciones", {
        type: Sequelize.JSON,
        allowNull: true,
      });
    }
    if (!tableDesc.tiempoRespuesta) {
      await queryInterface.addColumn("proveedores", "tiempoRespuesta", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!tableDesc.calificacion) {
      await queryInterface.addColumn("proveedores", "calificacion", {
        type: Sequelize.DECIMAL(3, 1),
        allowNull: false,
        defaultValue: 0,
      });
    }
    if (!tableDesc.ordenesCompletadas) {
      await queryInterface.addColumn("proveedores", "ordenesCompletadas", {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }
    if (!tableDesc.costoPromedio) {
      await queryInterface.addColumn("proveedores", "costoPromedio", {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      });
    }

    await queryInterface.changeColumn("proveedores", "estado", {
      type: Sequelize.ENUM("activo", "inactivo", "en_evaluacion"),
      allowNull: false,
      defaultValue: "activo",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("proveedores", "estado", {
      type: Sequelize.ENUM("activo", "inactivo"),
      allowNull: false,
      defaultValue: "activo",
    });

    const tableDesc = await queryInterface.describeTable("proveedores");
    const columnsToDrop = [
      "costoPromedio",
      "ordenesCompletadas",
      "calificacion",
      "tiempoRespuesta",
      "certificaciones",
      "especialidades",
      "ciudad",
      "direccion",
      "contactoPrincipal",
    ];
    for (const col of columnsToDrop) {
      if (tableDesc[col]) {
        await queryInterface.removeColumn("proveedores", col);
      }
    }
  },
};
