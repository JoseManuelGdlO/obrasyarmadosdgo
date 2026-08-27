# Estimación Carátula y Fotos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir agregar una carátula (foto) y fotos extra a cada estimación de proyecto, con miniaturas y lightbox de vista previa en el formulario de `ProyectoDetalle`.

**Architecture:** Campo `caratula` en `proyecto_estimaciones` + tabla `proyecto_estimacion_fotos` para extras. Archivos en disco local (`uploads/estimaciones/`) vía multer, mismo patrón que máquinas. Create/update de estimación aceptan multipart; extras usan endpoints dedicados con upload/borrado inmediato. Tras crear, el front deja el formulario en modo edición.

**Tech Stack:** Express, Sequelize, multer, MySQL, React (Vite), React Query, shadcn Dialog, FormData.

**Spec:** `docs/superpowers/specs/2026-08-25-estimacion-caratula-fotos-design.md`

## Global Constraints

- Imágenes: solo JPG/PNG, máx. 2MB por archivo
- Tope de fotos extra: 20 por estimación
- Rutas públicas: `/uploads/estimaciones/<filename>`
- Campo DB carátula: `caratula` (STRING nullable)
- Multipart fields: `caratula` (1 archivo), `fotos` (múltiples en POST extras)
- Flag quitar carátula: `quitarCaratula=true` (string o boolean)
- Permisos: `PROYECTOS_VIEW` / `PROYECTOS_EDIT` + `requireProyectoScope`
- Sin suite de tests automatizados en back: verificar con `npm run migrate` + curl + UI manual
- No cambiar la tabla de estimaciones para mostrar fotos
- Commit frecuente por tarea

## File map

| File | Responsibility |
|------|----------------|
| `back/config/uploads.js` | Dir/ruta/ensure para estimaciones |
| `back/middlewares/uploadEstimacionFiles.js` | Multer carátula + fotos |
| `back/migrations/20260825140000-add-caratula-to-proyecto-estimaciones.js` | Columna `caratula` |
| `back/migrations/20260825140100-create-proyecto-estimacion-fotos.js` | Tabla extras |
| `back/models/ProyectoEstimacion.js` | Campo `caratula` |
| `back/models/ProyectoEstimacionFoto.js` | Modelo foto extra |
| `back/models/index.js` | Asociación `fotos` |
| `back/controllers/proyectoEstimacionesController.js` | CRUD + fotos + cleanup disco |
| `back/routes/proyectoEstimacionesRoutes.js` | Multipart + rutas fotos |
| `back/server.js` | Static `/uploads/estimaciones` |
| `front/src/pages/ProyectoDetalle.tsx` | UI carátula, extras, lightbox, FormData |

---

### Task 1: Upload config + middleware estimaciones

**Files:**
- Modify: `back/config/uploads.js`
- Create: `back/middlewares/uploadEstimacionFiles.js`

**Interfaces:**
- Produces: `ESTIMACION_UPLOADS_DIR`, `ESTIMACION_UPLOADS_ROUTE`, `ensureEstimacionUploadsDir`
- Produces: `uploadEstimacionFiles`, `ESTIMACION_CARATULA_FIELDS`, `ESTIMACION_FOTOS_FIELDS`, `validateUploadedEstimacionFileSizes`, `cleanupUploadedEstimacionFilesIfPresent`, `ESTIMACION_IMAGE_MAX_SIZE` (2MB)

- [ ] **Step 1: Extend `back/config/uploads.js`**

Add alongside machine/worker exports:

```js
const ESTIMACION_UPLOADS_DIR =
  process.env.ESTIMACION_UPLOADS_DIR || path.resolve(__dirname, "../../uploads/estimaciones");

const ESTIMACION_UPLOADS_ROUTE = "/uploads/estimaciones";

const ensureEstimacionUploadsDir = () => {
  if (!fs.existsSync(ESTIMACION_UPLOADS_DIR)) {
    fs.mkdirSync(ESTIMACION_UPLOADS_DIR, { recursive: true });
  }
};
```

Export the three new symbols.

- [ ] **Step 2: Create `back/middlewares/uploadEstimacionFiles.js`**

Mirror `uploadMaquinaFiles.js` but only images:

```js
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const {
  ESTIMACION_UPLOADS_DIR,
  ensureEstimacionUploadsDir,
} = require("../config/uploads");
const { logger } = require("../utils/logger");

const ESTIMACION_IMAGE_MAX_SIZE = 2 * 1024 * 1024;
const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png"]);

const FIELD_CONFIG = {
  caratula: { mimeTypes: IMAGE_MIME_TYPES, maxSize: ESTIMACION_IMAGE_MAX_SIZE },
  fotos: { mimeTypes: IMAGE_MIME_TYPES, maxSize: ESTIMACION_IMAGE_MAX_SIZE },
};

const getExtensionFromMimeType = (mimeType) => {
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  return "";
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureEstimacionUploadsDir();
    cb(null, ESTIMACION_UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext =
      getExtensionFromMimeType(file.mimetype) || path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const config = FIELD_CONFIG[file.fieldname];
  if (!config) {
    cb(new Error(`Campo de archivo no permitido: ${file.fieldname}.`));
    return;
  }
  if (!config.mimeTypes.has(file.mimetype)) {
    cb(new Error("Formato de imagen inválido. Solo se permite JPG o PNG."));
    return;
  }
  cb(null, true);
};

const uploadEstimacionFiles = multer({
  storage,
  limits: { fileSize: ESTIMACION_IMAGE_MAX_SIZE },
  fileFilter,
});

const ESTIMACION_CARATULA_FIELDS = [{ name: "caratula", maxCount: 1 }];
const ESTIMACION_FOTOS_FIELDS = [{ name: "fotos", maxCount: 20 }];

const validateUploadedEstimacionFileSizes = (req) => {
  const files = req.files || {};
  const errors = [];
  for (const [fieldname, entries] of Object.entries(files)) {
    const config = FIELD_CONFIG[fieldname];
    if (!config || !entries?.length) continue;
    for (const file of entries) {
      if (file.size > config.maxSize) {
        errors.push(`La imagen no puede superar ${config.maxSize / (1024 * 1024)}MB.`);
      }
    }
  }
  return errors;
};

const cleanupUploadedEstimacionFilesIfPresent = async (req) => {
  const paths = new Set();
  if (req.files) {
    for (const entries of Object.values(req.files)) {
      for (const file of entries) {
        if (file?.path) paths.add(file.path);
      }
    }
  }
  for (const filePath of paths) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== "ENOENT") {
        logger.warn(`No se pudo eliminar archivo temporal: ${error.message}`);
      }
    }
  }
};

module.exports = {
  uploadEstimacionFiles,
  ESTIMACION_CARATULA_FIELDS,
  ESTIMACION_FOTOS_FIELDS,
  validateUploadedEstimacionFileSizes,
  cleanupUploadedEstimacionFilesIfPresent,
  ESTIMACION_IMAGE_MAX_SIZE,
};
```

- [ ] **Step 3: Verify module loads**

Run: `node -e "require('./back/middlewares/uploadEstimacionFiles'); require('./back/config/uploads'); console.log('ok')"`  
(from repo root; adjust cwd if needed: `cd back && node -e "require('./middlewares/uploadEstimacionFiles'); console.log('ok')"`)

Expected: `ok`

- [ ] **Step 4: Commit**

```bash
git add back/config/uploads.js back/middlewares/uploadEstimacionFiles.js
git commit -m "feat: add estimacion image upload middleware"
```

---

### Task 2: Migrations + models + associations

**Files:**
- Create: `back/migrations/20260825140000-add-caratula-to-proyecto-estimaciones.js`
- Create: `back/migrations/20260825140100-create-proyecto-estimacion-fotos.js`
- Modify: `back/models/ProyectoEstimacion.js`
- Create: `back/models/ProyectoEstimacionFoto.js`
- Modify: `back/models/index.js`

**Interfaces:**
- Produces: model `ProyectoEstimacionFoto` with fields `id`, `estimacionId`, `ruta`
- Produces: `ProyectoEstimacion.hasMany(..., as: "fotos")` and inverse `belongsTo`
- Consumes: table `proyecto_estimaciones` existing PK UUID

- [ ] **Step 1: Migration carátula**

`back/migrations/20260825140000-add-caratula-to-proyecto-estimaciones.js`:

```js
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("proyecto_estimaciones", "caratula", {
      type: Sequelize.STRING(512),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("proyecto_estimaciones", "caratula");
  },
};
```

- [ ] **Step 2: Migration tabla fotos**

`back/migrations/20260825140100-create-proyecto-estimacion-fotos.js`:

```js
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("proyecto_estimacion_fotos", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      estimacionId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "proyecto_estimaciones", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      ruta: {
        type: Sequelize.STRING(512),
        allowNull: false,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex("proyecto_estimacion_fotos", ["estimacionId"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("proyecto_estimacion_fotos");
  },
};
```

- [ ] **Step 3: Update model `ProyectoEstimacion.js`**

Add field:

```js
caratula: { type: DataTypes.STRING(512), allowNull: true },
```

- [ ] **Step 4: Create `ProyectoEstimacionFoto.js`**

```js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ProyectoEstimacionFoto = sequelize.define(
  "ProyectoEstimacionFoto",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    estimacionId: { type: DataTypes.UUID, allowNull: false },
    ruta: { type: DataTypes.STRING(512), allowNull: false },
  },
  { tableName: "proyecto_estimacion_fotos", timestamps: true }
);

module.exports = ProyectoEstimacionFoto;
```

- [ ] **Step 5: Wire associations in `models/index.js`**

Require the model; export it; after `ProyectoEstimacion.belongsTo(Proyecto, ...)` add:

```js
ProyectoEstimacion.hasMany(ProyectoEstimacionFoto, {
  foreignKey: "estimacionId",
  as: "fotos",
  onDelete: "CASCADE",
});
ProyectoEstimacionFoto.belongsTo(ProyectoEstimacion, {
  foreignKey: "estimacionId",
  as: "estimacion",
});
```

- [ ] **Step 6: Run migrations**

Run from `back/`: `npm run migrate`  
Expected: both migrations executed without error.

Verify:

```bash
docker exec mysql-db mysql -uroot -p123456 -N -e "SHOW COLUMNS FROM obrasyarmadosdgo.proyecto_estimaciones LIKE 'caratula'; SHOW TABLES FROM obrasyarmadosdgo LIKE 'proyecto_estimacion_fotos';"
```

Expected: row for `caratula` and table name printed.

- [ ] **Step 7: Commit**

```bash
git add back/migrations/20260825140000-add-caratula-to-proyecto-estimaciones.js \
  back/migrations/20260825140100-create-proyecto-estimacion-fotos.js \
  back/models/ProyectoEstimacion.js \
  back/models/ProyectoEstimacionFoto.js \
  back/models/index.js
git commit -m "feat: add caratula and estimacion fotos schema"
```

---

### Task 3: Controller + static serving + routes

**Files:**
- Modify: `back/controllers/proyectoEstimacionesController.js`
- Modify: `back/routes/proyectoEstimacionesRoutes.js`
- Modify: `back/server.js`

**Interfaces:**
- Consumes: upload middleware exports from Task 1; models from Task 2
- Produces handlers: existing CRUD updated + `addFotosEstimacion`, `deleteFotoEstimacion`
- List/get JSON shape: `{ estimacion(es) }` each with `caratula` and nested `fotos: [{ id, ruta, createdAt, updatedAt }]`
- `POST /` multipart field `caratula`
- `PATCH /:id` multipart `caratula` + body `quitarCaratula`
- `POST /:id/fotos` multipart `fotos` (1–20)
- `DELETE /:id/fotos/:fotoId`

- [ ] **Step 1: Serve static uploads in `server.js`**

Import and call `ensureEstimacionUploadsDir`; mount:

```js
app.use(
  ESTIMACION_UPLOADS_ROUTE,
  express.static(path.resolve(ESTIMACION_UPLOADS_DIR), { maxAge: "7d" })
);
```

- [ ] **Step 2: Rewrite controller with file helpers and foto endpoints**

Replace/extend `proyectoEstimacionesController.js` following máquinas patterns:

```js
const path = require("path");
const fs = require("fs/promises");
const Proyecto = require("../models/Proyecto");
const ProyectoEstimacion = require("../models/ProyectoEstimacion");
const ProyectoEstimacionFoto = require("../models/ProyectoEstimacionFoto");
const {
  ESTIMACION_UPLOADS_DIR,
  ESTIMACION_UPLOADS_ROUTE,
} = require("../config/uploads");
const { cleanupUploadedEstimacionFilesIfPresent } = require("../middlewares/uploadEstimacionFiles");
const { logError } = require("../utils/logger");

const MAX_FOTOS_EXTRA = 20;

const fotosInclude = {
  model: ProyectoEstimacionFoto,
  as: "fotos",
  attributes: ["id", "ruta", "createdAt", "updatedAt"],
};

const buildPublicEstimacionUploadPath = (filename) =>
  `${ESTIMACION_UPLOADS_ROUTE}/${encodeURIComponent(filename)}`;

const resolveStoredUploadToAbsolute = (storedPath) => {
  if (!storedPath || typeof storedPath !== "string") return null;
  const normalizedRoute = `${ESTIMACION_UPLOADS_ROUTE}/`;
  if (!storedPath.startsWith(normalizedRoute)) return null;
  const filename = decodeURIComponent(storedPath.slice(normalizedRoute.length));
  const absolutePath = path.resolve(ESTIMACION_UPLOADS_DIR, filename);
  const uploadsRoot = path.resolve(ESTIMACION_UPLOADS_DIR);
  if (!absolutePath.startsWith(`${uploadsRoot}${path.sep}`) && absolutePath !== uploadsRoot) {
    return null;
  }
  return absolutePath;
};

const safeDeleteStoredUpload = async (storedPath) => {
  const absolutePath = resolveStoredUploadToAbsolute(storedPath);
  if (!absolutePath) return;
  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
};

const getUploadedFile = (req, fieldname) => req.files?.[fieldname]?.[0] || null;
const getUploadedFiles = (req, fieldname) => req.files?.[fieldname] || [];
const parseTruthyFlag = (value) => value === true || value === "true" || value === "1";

// keep ensureProyecto, toDecimal

// listEstimaciones / getEstimacionById: findAll/findOne with include: [fotosInclude]

// createEstimacion: after create, if getUploadedFile(req,'caratula'), set caratula path;
//   on error call cleanupUploadedEstimacionFilesIfPresent(req)
//   reload with fotos include before response

// updateEstimacion:
//   - apply scalar updates as today
//   - if new caratula file: safeDelete old, set new path
//   - else if parseTruthyFlag(req.body.quitarCaratula): safeDelete + set null
//   - reload with fotos

// deleteEstimacion:
//   - load with fotos
//   - collect caratula + fotos rutas
//   - destroy estimacion (CASCADE fotos rows)
//   - safeDelete each path

const addFotosEstimacion = async (req, res) => {
  try {
    const { proyectoId, id } = req.params;
    const proyecto = await ensureProyecto(proyectoId);
    if (!proyecto) {
      await cleanupUploadedEstimacionFilesIfPresent(req);
      return res.status(404).json({ message: "Proyecto no encontrado." });
    }
    const estimacion = await ProyectoEstimacion.findOne({
      where: { id, proyectoId },
      include: [fotosInclude],
    });
    if (!estimacion) {
      await cleanupUploadedEstimacionFilesIfPresent(req);
      return res.status(404).json({ message: "Estimación no encontrada." });
    }
    const files = getUploadedFiles(req, "fotos");
    if (!files.length) {
      return res.status(400).json({ message: "Debes enviar al menos una foto." });
    }
    const currentCount = estimacion.fotos?.length || 0;
    if (currentCount + files.length > MAX_FOTOS_EXTRA) {
      await cleanupUploadedEstimacionFilesIfPresent(req);
      return res.status(400).json({
        message: `Máximo ${MAX_FOTOS_EXTRA} fotos extra por estimación.`,
      });
    }
    const created = [];
    for (const file of files) {
      const foto = await ProyectoEstimacionFoto.create({
        estimacionId: estimacion.id,
        ruta: buildPublicEstimacionUploadPath(file.filename),
      });
      created.push(foto);
    }
    const refreshed = await ProyectoEstimacion.findOne({
      where: { id: estimacion.id },
      include: [fotosInclude],
    });
    return res.status(201).json({
      message: "Fotos agregadas correctamente.",
      estimacion: refreshed,
      fotos: created,
    });
  } catch (error) {
    await cleanupUploadedEstimacionFilesIfPresent(req);
    logError("Error al agregar fotos a la estimación.", error);
    return res.status(500).json({
      message: "Error al agregar fotos a la estimación.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deleteFotoEstimacion = async (req, res) => {
  try {
    const { proyectoId, id, fotoId } = req.params;
    const proyecto = await ensureProyecto(proyectoId);
    if (!proyecto) {
      return res.status(404).json({ message: "Proyecto no encontrado." });
    }
    const estimacion = await ProyectoEstimacion.findOne({ where: { id, proyectoId } });
    if (!estimacion) {
      return res.status(404).json({ message: "Estimación no encontrada." });
    }
    const foto = await ProyectoEstimacionFoto.findOne({
      where: { id: fotoId, estimacionId: estimacion.id },
    });
    if (!foto) {
      return res.status(404).json({ message: "Foto no encontrada." });
    }
    const ruta = foto.ruta;
    await foto.destroy();
    await safeDeleteStoredUpload(ruta);
    return res.status(200).json({ message: "Foto eliminada correctamente." });
  } catch (error) {
    logError("Error al eliminar foto de la estimación.", error);
    return res.status(500).json({
      message: "Error al eliminar foto de la estimación.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  listEstimaciones,
  getEstimacionById,
  createEstimacion,
  updateEstimacion,
  deleteEstimacion,
  addFotosEstimacion,
  deleteFotoEstimacion,
};
```

Implement the full create/update/delete/list/get bodies completely (no stubs): preserve existing scalar logic; always `include: [fotosInclude]` on reads; wrap create/update catch with cleanup of uploaded files.

- [ ] **Step 3: Update routes**

`proyectoEstimacionesRoutes.js`:

```js
const express = require("express");
const { requirePermission, requireProyectoScope } = require("../middlewares/permissions");
const P = require("../constants/permissions");
const {
  listEstimaciones,
  getEstimacionById,
  createEstimacion,
  updateEstimacion,
  deleteEstimacion,
  addFotosEstimacion,
  deleteFotoEstimacion,
} = require("../controllers/proyectoEstimacionesController");
const {
  uploadEstimacionFiles,
  ESTIMACION_CARATULA_FIELDS,
  ESTIMACION_FOTOS_FIELDS,
  validateUploadedEstimacionFileSizes,
  cleanupUploadedEstimacionFilesIfPresent,
} = require("../middlewares/uploadEstimacionFiles");

const router = express.Router({ mergeParams: true });

const handleCaratulaUpload = (req, res, next) => {
  uploadEstimacionFiles.fields(ESTIMACION_CARATULA_FIELDS)(req, res, async (error) => {
    if (!error) {
      const sizeErrors = validateUploadedEstimacionFileSizes(req);
      if (sizeErrors.length > 0) {
        await cleanupUploadedEstimacionFilesIfPresent(req);
        return res.status(400).json({ message: sizeErrors[0] });
      }
      return next();
    }
    await cleanupUploadedEstimacionFilesIfPresent(req);
    if (error.name === "MulterError" && error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "La imagen no puede superar 2MB." });
    }
    return res.status(400).json({
      message: error.message || "No se pudo procesar la carátula.",
    });
  });
};

const handleFotosUpload = (req, res, next) => {
  uploadEstimacionFiles.fields(ESTIMACION_FOTOS_FIELDS)(req, res, async (error) => {
    if (!error) {
      const sizeErrors = validateUploadedEstimacionFileSizes(req);
      if (sizeErrors.length > 0) {
        await cleanupUploadedEstimacionFilesIfPresent(req);
        return res.status(400).json({ message: sizeErrors[0] });
      }
      return next();
    }
    await cleanupUploadedEstimacionFilesIfPresent(req);
    if (error.name === "MulterError" && error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "La imagen no puede superar 2MB." });
    }
    return res.status(400).json({
      message: error.message || "No se pudieron procesar las fotos.",
    });
  });
};

router.use(requireProyectoScope);

router.get("/", requirePermission(P.PROYECTOS_VIEW), listEstimaciones);
router.post("/", requirePermission(P.PROYECTOS_EDIT), handleCaratulaUpload, createEstimacion);
router.post(
  "/:id/fotos",
  requirePermission(P.PROYECTOS_EDIT),
  handleFotosUpload,
  addFotosEstimacion
);
router.delete(
  "/:id/fotos/:fotoId",
  requirePermission(P.PROYECTOS_EDIT),
  deleteFotoEstimacion
);
router.get("/:id", requirePermission(P.PROYECTOS_VIEW), getEstimacionById);
router.patch(
  "/:id",
  requirePermission(P.PROYECTOS_EDIT),
  handleCaratulaUpload,
  updateEstimacion
);
router.delete("/:id", requirePermission(P.PROYECTOS_EDIT), deleteEstimacion);

module.exports = router;
```

**Order note:** register `/:id/fotos` routes **before** `GET/PATCH/DELETE /:id` so Express does not treat `fotos` as an id conflict (foto routes use `/:id/fotos` so they are fine either way; keep fotos routes adjacent for clarity).

- [ ] **Step 4: Manual API verification**

Restart backend. With a valid JWT and `proyectoId` / small JPG:

```bash
# create with caratula
curl -s -X POST "http://127.0.0.1:3000/api/proyectos/$PID/estimaciones" \
  -H "Authorization: Bearer $TOKEN" \
  -F "montoEstimacion=100" \
  -F "caratula=@/path/to/small.jpg;type=image/jpeg"

# add extra foto
curl -s -X POST "http://127.0.0.1:3000/api/proyectos/$PID/estimaciones/$EID/fotos" \
  -H "Authorization: Bearer $TOKEN" \
  -F "fotos=@/path/to/small2.jpg;type=image/jpeg"

# list should show caratula + fotos[]
curl -s "http://127.0.0.1:3000/api/proyectos/$PID/estimaciones" -H "Authorization: Bearer $TOKEN"
```

Expected: 201/200 JSON with paths under `/uploads/estimaciones/`; GET image URL returns binary.

- [ ] **Step 5: Commit**

```bash
git add back/controllers/proyectoEstimacionesController.js \
  back/routes/proyectoEstimacionesRoutes.js \
  back/server.js
git commit -m "feat: API support for estimacion caratula and fotos"
```

---

### Task 4: Frontend form — carátula, extras, lightbox

**Files:**
- Modify: `front/src/pages/ProyectoDetalle.tsx`

**Interfaces:**
- Consumes: `apiRequest` FormData support, `toAbsoluteAssetUrl` from `front/src/lib/api.ts`
- Consumes: Dialog from `@/components/ui/dialog`
- Types: extend `EstimacionData` with `caratula: string | null` and `fotos: Array<{ id: string; ruta: string }>`
- Local state: `caratulaFile: File | null`, `quitarCaratula: boolean`, `previewUrl: string | null` (lightbox), revoke object URLs on cleanup

- [ ] **Step 1: Extend types and mapping**

```ts
type EstimacionFoto = { id: string; ruta: string }

type EstimacionData = {
  id: string
  numero: number
  fechaEstimacion: string
  montoEstimacion: number
  fechaPago: string
  montoPagado: number
  factura: string
  retencionAmortizacion: number
  caratula: string | null
  fotos: EstimacionFoto[]
}
```

Map `caratula` and `fotos` from API in the existing `.map(...)`.

- [ ] **Step 2: Local photo state + helpers**

Add state near `editingEstimId`:

```ts
const [caratulaFile, setCaratulaFile] = useState<File | null>(null)
const [caratulaPreviewLocal, setCaratulaPreviewLocal] = useState<string | null>(null)
const [quitarCaratula, setQuitarCaratula] = useState(false)
const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
```

When selecting a file: validate JPG/PNG and size ≤ 2MB (same messages as máquinas if helpers exist; else inline), set file + `URL.createObjectURL`, clear `quitarCaratula`.

On unmount / clear: `URL.revokeObjectURL` for local preview.

`clearPhotoLocalState()` resets file, local preview, `quitarCaratula`.

- [ ] **Step 3: Change create/update mutations to FormData**

```ts
const buildEstimFormData = () => {
  const body = new FormData()
  body.append("fechaEstimacion", estimForm.fechaEstimacion || "")
  body.append("montoEstimacion", String(Number(estimForm.montoEstimacion || 0)))
  body.append("fechaPago", estimForm.fechaPago || "")
  body.append("montoPagado", String(Number(estimForm.montoPagado || 0)))
  body.append("factura", estimForm.factura.trim())
  body.append("retencionAmortizacion", String(Number(estimForm.retencionAmortizacion || 0)))
  if (caratulaFile) body.append("caratula", caratulaFile)
  if (quitarCaratula) body.append("quitarCaratula", "true")
  return body
}
```

**Create `onSuccess`:** do **not** reset to empty. Set:

```ts
const estimacion = response.estimacion
setEditingEstimId(String(estimacion.id))
setEstimForm({ /* from estimacion scalars */ })
clearPhotoLocalState()
invalidateEstim()
toast.success("Estimación agregada correctamente.")
```

Type the mutation response as `{ estimacion: Record<string, unknown>; message?: string }`.

**Update `onSuccess`:** keep current reset-to-empty behavior OR stay in edit — prefer stay in edit with refreshed form + `clearPhotoLocalState()` + invalidate (better UX with photos). Spec: after create stay in edit; for update, staying in edit is fine.

- [ ] **Step 4: Mutations for add/delete fotos**

```ts
const addFotos = useMutation({
  mutationFn: async ({ estimId, files }: { estimId: string; files: FileList }) => {
    const body = new FormData()
    Array.from(files).forEach((f) => body.append("fotos", f))
    return apiRequest(`/proyectos/${id}/estimaciones/${estimId}/fotos`, {
      method: "POST",
      body,
    })
  },
  onSuccess: () => {
    toast.success("Fotos agregadas.")
    invalidateEstim()
  },
  onError: (e: Error) => toast.error(e.message),
})

const deleteFoto = useMutation({
  mutationFn: ({ estimId, fotoId }: { estimId: string; fotoId: string }) =>
    apiRequest(`/proyectos/${id}/estimaciones/${estimId}/fotos/${fotoId}`, {
      method: "DELETE",
    }),
  onSuccess: () => {
    toast.success("Foto eliminada.")
    invalidateEstim()
  },
  onError: (e: Error) => toast.error(e.message),
})
```

- [ ] **Step 5: UI block under the estimation fields grid (before action buttons)**

```tsx
{/* Carátula */}
<div className="space-y-2">
  <Label>Carátula</Label>
  <div className="flex flex-wrap items-center gap-3">
    <Button type="button" variant="outline" asChild>
      <label className="cursor-pointer">
        Agregar carátula
        <input
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ""
            if (!file) return
            // validate type/size → toast.error if invalid
            if (caratulaPreviewLocal) URL.revokeObjectURL(caratulaPreviewLocal)
            setCaratulaFile(file)
            setCaratulaPreviewLocal(URL.createObjectURL(file))
            setQuitarCaratula(false)
          }}
        />
      </label>
    </Button>
    {/* show thumb from local preview OR saved caratula (unless quitar) */}
  </div>
</div>

{editingEstimId && (
  <div className="space-y-2">
    <Label>Fotos adicionales</Label>
    <Button type="button" variant="outline" asChild>
      <label className="cursor-pointer">
        Agregar fotos
        <input
          type="file"
          accept="image/jpeg,image/png"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = e.target.files
            e.target.value = ""
            if (!files?.length || !editingEstimId) return
            addFotos.mutate({ estimId: editingEstimId, files })
          }}
        />
      </label>
    </Button>
    {/* map estimaciones.find(e => e.id === editingEstimId)?.fotos thumbnails with remove */}
  </div>
)}
```

Thumbnail: `button` wrapping `img` with `onClick={() => setLightboxSrc(src)}`; separate small destructive button for remove (carátula local clear / `setQuitarCaratula(true)` / `deleteFoto`).

Resolve display URL:

```ts
const savedCaratula =
  editingEstimId
    ? estimaciones.find((e) => e.id === editingEstimId)?.caratula
    : null
const caratulaSrc =
  caratulaPreviewLocal ||
  (!quitarCaratula ? toAbsoluteAssetUrl(savedCaratula) : null)
```

- [ ] **Step 6: Lightbox Dialog**

```tsx
<Dialog open={Boolean(lightboxSrc)} onOpenChange={(open) => !open && setLightboxSrc(null)}>
  <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
    <DialogTitle className="sr-only">Vista previa</DialogTitle>
    {lightboxSrc && (
      <img src={lightboxSrc} alt="Vista previa" className="max-h-[85vh] w-full object-contain" />
    )}
  </DialogContent>
</Dialog>
```

Import `Dialog`, `DialogContent`, `DialogTitle` from `@/components/ui/dialog`. Escape / overlay close comes from Radix.

- [ ] **Step 7: Wire `startEditEstim` / `cancelEditEstim`**

On start edit: `clearPhotoLocalState()`.  
On cancel: `clearPhotoLocalState()`.  
On delete estim if `editingEstimId === deleted`: cancel edit + clear photos.

- [ ] **Step 8: Manual UI verification**

1. Proyectos → Gestionar → Agregar carátula → miniatura → clic abre lightbox → Agregar  
2. Form stays in edit; Agregar fotos works immediately; quitar foto individual  
3. Quitar/cambiar carátula + Guardar cambios  
4. Borrar estimación limpia UI sin error  

- [ ] **Step 9: Commit**

```bash
git add front/src/pages/ProyectoDetalle.tsx
git commit -m "feat: estimacion caratula and fotos UI with lightbox"
```

---

### Task 5: End-to-end smoke + polish

**Files:**
- Possibly fix only if bugs found in Task 3–4 files

- [ ] **Step 1: Reject non-image**

Upload `.txt` as carátula via UI or curl → expect 400 message about JPG/PNG.

- [ ] **Step 2: Confirm disk cleanup**

After delete estimacion, file under `uploads/estimaciones/` for that estimation is gone (list dir or `ls`).

- [ ] **Step 3: Commit any fixes** (skip empty commit if clean)

```bash
git status
# if fixes: commit with message describing the fix
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Campo `caratula` | 2, 3 |
| Tabla `proyecto_estimacion_fotos` | 2, 3 |
| uploads/estimaciones multer JPG/PNG 2MB | 1, 3 |
| POST/PATCH multipart carátula | 3, 4 |
| `quitarCaratula` | 3, 4 |
| POST/DELETE fotos extras inmediato | 3, 4 |
| List/get include fotos | 3 |
| Delete estimacion cleans files | 3 |
| UI Agregar carátula + thumbs | 4 |
| Extras solo en edición | 4 |
| Tras create → modo edición | 4 |
| Lightbox preview | 4 |
| Tabla sin fotos | 4 (no changes to table columns) |
| Max 20 extras | 3 |
| Permisos existentes | 3 |

## Placeholder / consistency review

- Field names aligned: multipart `caratula` / `fotos`, DB `caratula` / `ruta`, association `as: "fotos"`.
- No TBD steps; verification is curl/UI because back has no test runner.
- Route order documented to avoid param conflicts.
