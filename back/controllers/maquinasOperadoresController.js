const User = require("../models/User");
const Maquina = require("../models/Maquina");
const UsuarioMaquina = require("../models/UsuarioMaquina");

const listOperadores = async (req, res) => {
  try {
    const { maquinaId } = req.params;
    const maquina = await Maquina.findByPk(maquinaId);
    if (!maquina) {
      return res.status(404).json({ message: "Máquina no encontrada." });
    }
    const links = await UsuarioMaquina.findAll({
      where: { maquinaId },
      include: [{ model: User, as: "user", attributes: ["id", "email", "rol", "status"] }],
    });
    return res.status(200).json({ operadores: links });
  } catch (error) {
    return res.status(500).json({
      message: "Error al listar operadores.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const assignOperador = async (req, res) => {
  try {
    const { maquinaId } = req.params;
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId es obligatorio." });
    }
    const maquina = await Maquina.findByPk(maquinaId);
    if (!maquina) {
      return res.status(404).json({ message: "Máquina no encontrada." });
    }
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }
    if (user.rol !== "maquinista") {
      return res.status(400).json({
        message: "Solo se pueden asignar usuarios con rol maquinista.",
      });
    }
    const [row, created] = await UsuarioMaquina.findOrCreate({
      where: { userId, maquinaId },
      defaults: {},
    });
    if (!created) {
      return res.status(409).json({ message: "El usuario ya está asignado a esta máquina." });
    }
    return res.status(201).json({
      message: "Operador asignado correctamente.",
      asignacion: row,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al asignar operador.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const unassignOperador = async (req, res) => {
  try {
    const { maquinaId, userId } = req.params;
    const maquina = await Maquina.findByPk(maquinaId);
    if (!maquina) {
      return res.status(404).json({ message: "Máquina no encontrada." });
    }
    const deleted = await UsuarioMaquina.destroy({
      where: { maquinaId, userId },
    });
    if (!deleted) {
      return res.status(404).json({ message: "Asignación no encontrada." });
    }
    return res.status(200).json({ message: "Operador desasignado correctamente." });
  } catch (error) {
    return res.status(500).json({
      message: "Error al desasignar operador.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  listOperadores,
  assignOperador,
  unassignOperador,
};
