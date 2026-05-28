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

module.exports = {
  MACHINE_UPLOADS_DIR,
  MACHINE_UPLOADS_ROUTE,
  ensureMachineUploadsDir,
  WORKER_UPLOADS_DIR,
  WORKER_UPLOADS_ROUTE,
  ensureWorkerUploadsDir,
};
