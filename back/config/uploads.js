const path = require("path");
const fs = require("fs");

const MACHINE_UPLOADS_DIR =
  process.env.MACHINE_UPLOADS_DIR || path.resolve(__dirname, "../../uploads/maquinas");

const MACHINE_UPLOADS_ROUTE = "/uploads/maquinas";

const WORKER_UPLOADS_DIR =
  process.env.WORKER_UPLOADS_DIR || path.resolve(__dirname, "../../uploads/trabajadores");

const WORKER_UPLOADS_ROUTE = "/uploads/trabajadores";

const ensureMachineUploadsDir = () => {
  if (!fs.existsSync(MACHINE_UPLOADS_DIR)) {
    fs.mkdirSync(MACHINE_UPLOADS_DIR, { recursive: true });
  }
};

const ensureWorkerUploadsDir = () => {
  if (!fs.existsSync(WORKER_UPLOADS_DIR)) {
    fs.mkdirSync(WORKER_UPLOADS_DIR, { recursive: true });
  }
};

const ESTIMACION_UPLOADS_DIR =
  process.env.ESTIMACION_UPLOADS_DIR || path.resolve(__dirname, "../../uploads/estimaciones");

const ESTIMACION_UPLOADS_ROUTE = "/uploads/estimaciones";

const ensureEstimacionUploadsDir = () => {
  if (!fs.existsSync(ESTIMACION_UPLOADS_DIR)) {
    fs.mkdirSync(ESTIMACION_UPLOADS_DIR, { recursive: true });
  }
};

const COMPRAS_UPLOADS_DIR =
  process.env.COMPRAS_UPLOADS_DIR || path.resolve(__dirname, "../../uploads/compras");

const COMPRAS_UPLOADS_ROUTE = "/uploads/compras";
const COMPRAS_IMPORTS_DIR = path.join(COMPRAS_UPLOADS_DIR, "imports");
const COMPRAS_FACTURAS_DIR = path.join(COMPRAS_UPLOADS_DIR, "facturas");

const ensureComprasUploadsDir = () => {
  if (!fs.existsSync(COMPRAS_IMPORTS_DIR)) {
    fs.mkdirSync(COMPRAS_IMPORTS_DIR, { recursive: true });
  }
  if (!fs.existsSync(COMPRAS_FACTURAS_DIR)) {
    fs.mkdirSync(COMPRAS_FACTURAS_DIR, { recursive: true });
  }
};

module.exports = {
  MACHINE_UPLOADS_DIR,
  MACHINE_UPLOADS_ROUTE,
  ensureMachineUploadsDir,
  WORKER_UPLOADS_DIR,
  WORKER_UPLOADS_ROUTE,
  ensureWorkerUploadsDir,
  ESTIMACION_UPLOADS_DIR,
  ESTIMACION_UPLOADS_ROUTE,
  ensureEstimacionUploadsDir,
  COMPRAS_UPLOADS_DIR,
  COMPRAS_UPLOADS_ROUTE,
  COMPRAS_IMPORTS_DIR,
  COMPRAS_FACTURAS_DIR,
  ensureComprasUploadsDir,
};
