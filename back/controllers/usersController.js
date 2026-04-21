const { Op } = require("sequelize");
const User = require("../models/User");

const ALLOWED_ROLES = ["admin", "usuario", "maquinista"];
const ALLOWED_STATUS = ["activo", "suspendido"];

const listUsers = async (_req, res) => {
  try {
    const users = await User.findAll({
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({
      message: "Error al listar usuarios.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener el usuario.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const createUser = async (req, res) => {
  try {
    const { email, password, rol, status } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email y password son obligatorios.",
      });
    }

    if (rol !== undefined && !ALLOWED_ROLES.includes(rol)) {
      return res.status(400).json({ message: "Rol inválido." });
    }

    if (status !== undefined && !ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({ message: "Estado inválido." });
    }

    const existing = await User.unscoped().findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "El usuario ya existe." });
    }

    const created = await User.create({
      email,
      password,
      ...(rol !== undefined ? { rol } : {}),
      ...(status !== undefined ? { status } : {}),
    });

    const user = await User.findByPk(created.id);

    return res.status(201).json({
      message: "Usuario creado correctamente.",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al crear usuario.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, rol, status } = req.body;

    const user = await User.unscoped().findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    const updates = {};
    if (email !== undefined) {
      if (!email) {
        return res.status(400).json({ message: "Email no puede estar vacío." });
      }
      const other = await User.unscoped().findOne({
        where: { email, id: { [Op.ne]: id } },
      });
      if (other) {
        return res.status(409).json({ message: "El email ya está en uso." });
      }
      updates.email = email;
    }
    if (password !== undefined) {
      if (!password) {
        return res.status(400).json({ message: "Password no puede estar vacío." });
      }
      updates.password = password;
    }
    if (rol !== undefined) {
      if (!ALLOWED_ROLES.includes(rol)) {
        return res.status(400).json({ message: "Rol inválido." });
      }
      updates.rol = rol;
    }
    if (status !== undefined) {
      if (!ALLOWED_STATUS.includes(status)) {
        return res.status(400).json({ message: "Estado inválido." });
      }
      updates.status = status;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No hay campos para actualizar." });
    }

    await user.update(updates);
    const safe = await User.findByPk(id);

    return res.status(200).json({
      message: "Usuario actualizado correctamente.",
      user: safe,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al actualizar usuario.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.unscoped().findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    if (user.status === "suspendido") {
      return res.status(400).json({ message: "El usuario ya está suspendido." });
    }

    await user.update({ status: "suspendido" });
    const safe = await User.findByPk(id);

    return res.status(200).json({
      message: "Usuario suspendido correctamente.",
      user: safe,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al suspender usuario.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
