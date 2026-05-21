const express = require("express");
const Maquina = require("../models/Maquina");
const MaquinaClase = require("../models/MaquinaClase");
const MaquinaTipo = require("../models/MaquinaTipo");
const MaquinaChecklistItem = require("../models/MaquinaChecklistItem");
const Trabajador = require("../models/Trabajador");
const {
  buildAndSaveChecklist,
} = require("../controllers/checklistsDiariosController");

const router = express.Router();

router.get("/maquinas/:id", async (req, res) => {
  try {
    const maquina = await Maquina.findByPk(req.params.id, {
      attributes: [
        "id",
        "nombre",
        "marca",
        "modelo",
        "placas",
        "numeroSerie",
        "estado",
      ],
      include: [
        { model: MaquinaClase, as: "clase", attributes: ["id", "nombre"] },
        { model: MaquinaTipo, as: "tipoCatalogo", attributes: ["id", "nombre"] },
      ],
    });
    if (!maquina) {
      return res.status(404).json({ message: "Máquina no encontrada." });
    }
    const json = maquina.toJSON();
    return res.status(200).json({
      maquina: {
        ...json,
        tipo: json.tipoCatalogo?.nombre || "",
        claseNombre: json.clase?.nombre || "",
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener la máquina.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.get("/maquinas/:id/checklist-items", async (req, res) => {
  try {
    const maquina = await Maquina.findByPk(req.params.id);
    if (!maquina) {
      return res.status(404).json({ message: "Máquina no encontrada." });
    }
    const checklistItems = await MaquinaChecklistItem.findAll({
      where: { maquinaId: req.params.id },
      order: [["orden", "ASC"]],
    });
    return res.status(200).json({ checklistItems });
  } catch (error) {
    return res.status(500).json({
      message: "Error al listar ítems del checklist.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.get("/trabajadores", async (_req, res) => {
  try {
    const trabajadores = await Trabajador.findAll({
      attributes: ["id", "nombre"],
      where: { estado: "activo" },
      order: [["nombre", "ASC"]],
    });
    return res.status(200).json({ trabajadores });
  } catch (error) {
    return res.status(500).json({
      message: "Error al listar trabajadores.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.post("/checklists-diarios", async (req, res) => {
  try {
    const result = await buildAndSaveChecklist({
      body: req.body || {},
      userId: null,
      source: "publico",
    });
    if (result.status !== 201) {
      return res.status(result.status).json({ message: result.message });
    }
    return res.status(201).json({
      message: "Checklist registrado correctamente.",
      checklistDiario: result.checklistDiario,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al registrar checklist.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
