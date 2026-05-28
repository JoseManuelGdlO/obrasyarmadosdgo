const { logger, sanitizePayload, formatRequestLine, colorGreen } = require("../utils/logger");

const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH"]);

const getRequestPath = (req) => {
  const path = `${req.baseUrl || ""}${req.path || ""}`;
  return path || req.originalUrl?.split("?")[0] || "/";
};

const isHealthCheck = (req) => {
  const path = getRequestPath(req);
  return req.method === "GET" && (path === "/health" || req.path === "/health");
};

const hasQueryParams = (req) => Object.keys(req.query || {}).length > 0;

const hasBody = (req) => {
  const body = req.body;
  if (body === null || body === undefined) {
    return false;
  }
  if (typeof body === "object" && !Array.isArray(body)) {
    return Object.keys(body).length > 0;
  }
  return true;
};

const isMultipart = (req) => {
  const contentType = req.headers["content-type"] || "";
  return contentType.includes("multipart/form-data");
};

const getUploadedFileFields = (req) => {
  if (!req.files) {
    return [];
  }

  if (Array.isArray(req.files)) {
    return req.files.map((file) => file.fieldname).filter(Boolean);
  }

  return Object.keys(req.files);
};

const buildDebugDetails = (req) => {
  const details = {};
  const method = req.method.toUpperCase();

  if (hasQueryParams(req)) {
    details.query = sanitizePayload(req.query);
  }

  if (isMultipart(req)) {
    const fileFields = getUploadedFileFields(req);
    details.multipart = fileFields.length > 0 ? { fileFields } : true;
    return details;
  }

  if (METHODS_WITH_BODY.has(method) && hasBody(req)) {
    details.body = sanitizePayload(req.body);
  }

  return details;
};

const requestLogger = (req, res, next) => {
  if (isHealthCheck(req)) {
    return next();
  }

  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const statusCode = res.statusCode;
    const path = getRequestPath(req);
    const line = formatRequestLine(req.method, path, statusCode, durationMs);

    logger.info(line);

    if (statusCode >= 500) {
      logger.error(line);
    }

    const debugDetails = buildDebugDetails(req);
    if (Object.keys(debugDetails).length > 0) {
      logger.debug(
        `${colorGreen(req.method)} ${path} debug ${JSON.stringify(debugDetails)}`
      );
    }
  });

  return next();
};

module.exports = requestLogger;
