const path = require("path");
const fs = require("fs");

const MACHINE_UPLOADS_DIR =
  process.env.MACHINE_UPLOADS_DIR || path.resolve(__dirname, "../../uploads/maquinas");

const MACHINE_UPLOADS_ROUTE = "/uploads/maquinas";

const ensureMachineUploadsDir = () => {
  if (!fs.existsSync(MACHINE_UPLOADS_DIR)) {
    fs.mkdirSync(MACHINE_UPLOADS_DIR, { recursive: true });
  }
};

module.exports = {
  MACHINE_UPLOADS_DIR,
  MACHINE_UPLOADS_ROUTE,
  ensureMachineUploadsDir,
};
