const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "authorization",
  "jwt",
  "secret",
]);

const normalizeLogLevel = (level) => {
  const normalized = String(level || "info").toLowerCase();
  return Object.prototype.hasOwnProperty.call(LOG_LEVELS, normalized)
    ? normalized
    : "info";
};

const configuredLevel = normalizeLogLevel(process.env.LOG_LEVEL);

const shouldLog = (level) =>
  LOG_LEVELS[level] <= LOG_LEVELS[configuredLevel];

const timestamp = () => new Date().toISOString();

const ANSI = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
};

const useColor = () =>
  Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;

const colorGreen = (text) =>
  useColor() ? `${ANSI.green}${text}${ANSI.reset}` : text;

const formatRequestLine = (method, path, statusCode, durationMs) =>
  `${colorGreen(method)} ${path} ${statusCode} ${durationMs}ms`;

const write = (level, message) => {
  if (!shouldLog(level)) {
    return;
  }

  const line = `${timestamp()} ${message}`;

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
};

const isSensitiveKey = (key) => {
  const normalized = String(key).toLowerCase();
  return (
    SENSITIVE_KEYS.has(normalized) ||
    normalized.includes("password") ||
    normalized.includes("token") ||
    normalized.includes("secret")
  );
};

const sanitizeValue = (value) => {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (typeof value === "object") {
    return sanitizePayload(value);
  }

  return value;
};

const sanitizePayload = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeValue(item));
  }

  if (typeof obj !== "object") {
    return obj;
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveKey(key)) {
      sanitized[key] = "***";
    } else {
      sanitized[key] = sanitizeValue(value);
    }
  }

  return sanitized;
};

const logger = {
  error: (message) => write("error", message),
  warn: (message) => write("warn", message),
  info: (message) => write("info", message),
  debug: (message) => write("debug", message),
};

const logError = (context, error) => {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error(`${context}: ${err.message}`);

  if (!err.stack) {
    return;
  }

  if (process.env.NODE_ENV === "development") {
    logger.error(err.stack);
    return;
  }

  logger.debug(err.stack);
};

module.exports = {
  logger,
  sanitizePayload,
  formatRequestLine,
  colorGreen,
  logError,
};
