const crypto = require("crypto");

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
const CHARSET = LETTERS + DIGITS;
const IDU_LENGTH = 3;
const MAX_UNIQUE_ATTEMPTS = 20;

const IDU_PATTERN = /^(?=.*[A-Z])(?=.*[0-9])[A-Z0-9]{3}$/;

const randomInt = (max) => crypto.randomInt(0, max);

const shuffle = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const isValidMaquinaIdu = (value) => {
  if (typeof value !== "string") return false;
  return IDU_PATTERN.test(value.trim().toUpperCase());
};

const generateMaquinaIdu = () => {
  const chars = [
    LETTERS[randomInt(LETTERS.length)],
    DIGITS[randomInt(DIGITS.length)],
  ];
  while (chars.length < IDU_LENGTH) {
    chars.push(CHARSET[randomInt(CHARSET.length)]);
  }
  return shuffle(chars).join("");
};

const generateUniqueMaquinaIdu = async () => {
  const Maquina = require("../models/Maquina");
  for (let attempt = 0; attempt < MAX_UNIQUE_ATTEMPTS; attempt++) {
    const idu = generateMaquinaIdu();
    const existing = await Maquina.findOne({ where: { idu } });
    if (!existing) {
      return idu;
    }
  }
  throw new Error("No se pudo generar un IDU único para la máquina.");
};

module.exports = {
  generateMaquinaIdu,
  generateUniqueMaquinaIdu,
  isValidMaquinaIdu,
};
