# Evidencia estimación en estados de cuenta — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mover la ruta de carátula a `proyecto_estimacion_estados_cuenta.evidenciaEstimacion`, eliminar `proyecto_estimaciones.caratula`, y montar volumen Docker para `uploads/estimaciones`, manteniendo el copy de UI como “carátula”.

**Architecture:** Corte limpio: multer field `evidenciaEstimacion`; create/update upsert en la fila 1:1 de estados de cuenta; `serializeEstimacion` aplana `evidenciaEstimacion`; Docker volume paralelo a máquinas.

**Tech Stack:** Node/Express, Sequelize, MySQL, multer, React/Vite, docker-compose.

## Global Constraints

- UI copy: “carátula” / “Agregar carátula” (no renombrar a evidencia).
- Campo técnico: `evidenciaEstimacion` (STRING nullable).
- Multipart field: `evidenciaEstimacion`; flag: `quitarEvidenciaEstimacion=true`.
- Fotos extra: sin cambio.
- No BLOB / S3.

## File map

| File | Responsibility |
|------|----------------|
| `back/migrations/20260827120000-move-caratula-to-estado-cuenta-evidencia.js` | Add field, migrate paths, drop `caratula` |
| `back/models/ProyectoEstimacionEstadoCuenta.js` | Attr `evidenciaEstimacion` |
| `back/models/ProyectoEstimacion.js` | Remove `caratula` |
| `back/middlewares/uploadEstimacionFiles.js` | Multer field rename |
| `back/routes/proyectoEstimacionesRoutes.js` | Use new field constant |
| `back/controllers/proyectoEstimacionesController.js` | Create/update/serialize/delete |
| `back/controllers/proyectosController.js` | Cleanup paths on project delete |
| `docker-compose.yml` | Volume + env |
| `.env.example` | `ESTIMACION_UPLOADS_HOST_DIR` |
| `front/src/pages/ProyectoDetalle.tsx` | Types/FormData/state → `evidenciaEstimacion`; UI labels stay |

---

### Task 1: Migration + models

**Files:**
- Create: `back/migrations/20260827120000-move-caratula-to-estado-cuenta-evidencia.js`
- Modify: `back/models/ProyectoEstimacionEstadoCuenta.js`
- Modify: `back/models/ProyectoEstimacion.js`

- [ ] **Step 1:** Add migration that adds `evidenciaEstimacion`, copies from `proyecto_estimaciones.caratula` (create missing estado rows with zeros), drops `caratula`. Down reverses.
- [ ] **Step 2:** Add `evidenciaEstimacion` to estado cuenta model; remove `caratula` from estimacion model.
- [ ] **Step 3:** Commit.

### Task 2: Upload middleware, routes, controllers, Docker

**Files:**
- Modify: `back/middlewares/uploadEstimacionFiles.js`
- Modify: `back/routes/proyectoEstimacionesRoutes.js`
- Modify: `back/controllers/proyectoEstimacionesController.js`
- Modify: `back/controllers/proyectosController.js`
- Modify: `docker-compose.yml`
- Modify: `.env.example`

- [ ] **Step 1:** Rename multer field `caratula` → `evidenciaEstimacion` (export `ESTIMACION_EVIDENCIA_FIELDS`).
- [ ] **Step 2:** Wire routes to new fields constant.
- [ ] **Step 3:** Controller: serialize/create/update/delete use `evidenciaEstimacion` on estado cuenta; project remove includes estadoCuenta.
- [ ] **Step 4:** docker-compose volume + `.env.example`.
- [ ] **Step 5:** Commit.

### Task 3: Frontend

**Files:**
- Modify: `front/src/pages/ProyectoDetalle.tsx`

- [ ] **Step 1:** Types/state/FormData use `evidenciaEstimacion` / `quitarEvidenciaEstimacion`; keep UI labels “Carátula”.
- [ ] **Step 2:** Commit.

### Task 4: Verify

- [ ] **Step 1:** Grep confirms no remaining `caratula` column usage on estimaciones model/API payload (except UI strings and error messages that say “carátula”).
- [ ] **Step 2:** Run migration if DB available; smoke-check TypeScript/lint on touched front file.
