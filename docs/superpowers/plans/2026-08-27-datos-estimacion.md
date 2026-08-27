# Datos Estimación (C1–C10) — Implementation Plan

> Implemented inline after approved spec.

**Goal:** Add lockable text module "Datos Estimación" under carátula, persist on `proyecto_estimacion_estados_cuenta`, autofill read-only on later estimates, show in Estados de cuenta.

**Architecture:** 10 STRING columns on the existing 1:1 estado-cuenta table; flat API like montos; first capture writable, later copies + read-only in UI and backend.

**Tech Stack:** Sequelize migrations/models, Express controller, React + Collapsible in `ProyectoDetalle.tsx`.

**Spec:** `docs/superpowers/specs/2026-08-27-datos-estimacion-design.md`

## Global Constraints

- Fields are free text STRING, nullable
- After first project capture: UI disabled + backend ignores/locks changes
- Copy from most recent estimation that has any non-empty datos field
- Key `proyectoNombreEstimacion` (not `proyecto`) to avoid clash

## File map

| File | Responsibility |
|------|----------------|
| `back/constants/datosEstimacionFields.js` | Field name list |
| `back/migrations/20260827130000-add-datos-estimacion-to-estados-cuenta.js` | ADD COLUMN × 10 |
| `back/models/ProyectoEstimacionEstadoCuenta.js` | Model attrs |
| `back/controllers/proyectoEstimacionesController.js` | Serialize, create copy, update lock |
| `front/src/pages/ProyectoDetalle.tsx` | Form collapsible + estados display |

---

### Task 1: Constants + migration + model

**Files:**
- Create: `back/constants/datosEstimacionFields.js`
- Create: `back/migrations/20260827130000-add-datos-estimacion-to-estados-cuenta.js`
- Modify: `back/models/ProyectoEstimacionEstadoCuenta.js`

- [ ] **Step 1: Add constants**

```js
"use strict";

const DATOS_ESTIMACION_FIELDS = [
  "periodoContrato",
  "registroPatronalImss",
  "periodoEjecucionTrabajos",
  "obra",
  "campus",
  "noSirgoc",
  "proyectoNombreEstimacion",
  "contratista",
  "rfc",
  "domicilio",
];

module.exports = { DATOS_ESTIMACION_FIELDS };
```

- [ ] **Step 2: Migration add/remove columns**

Use `Sequelize.STRING` nullable for each field on `proyecto_estimacion_estados_cuenta`. Down removes them.

- [ ] **Step 3: Model**

Spread string attrs from `DATOS_ESTIMACION_FIELDS` alongside monto attrs and `evidenciaEstimacion`.

- [ ] **Step 4: Run migration**

Run: `cd back && npx sequelize-cli db:migrate`

- [ ] **Step 5: Commit**

```bash
git add back/constants/datosEstimacionFields.js \
  back/migrations/20260827130000-add-datos-estimacion-to-estados-cuenta.js \
  back/models/ProyectoEstimacionEstadoCuenta.js
git commit -m "feat: add Datos Estimación columns to estados de cuenta"
```

---

### Task 2: Controller — serialize, create copy, update lock

**Files:**
- Modify: `back/controllers/proyectoEstimacionesController.js`

**Helpers to add:**

```js
const { DATOS_ESTIMACION_FIELDS } = require("../constants/datosEstimacionFields");

const parseDatosString = (value) => {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s === "" ? null : s;
};

const hasAnyDatos = (obj) =>
  DATOS_ESTIMACION_FIELDS.some((f) => {
    const v = obj?.[f];
    return v != null && String(v).trim() !== "";
  });

const pickDatosFromBody = (body) => {
  const out = {};
  for (const field of DATOS_ESTIMACION_FIELDS) {
    if (body[field] === undefined) {
      out[field] = null;
      continue;
    }
    out[field] = parseDatosString(body[field]);
  }
  return out;
};

const findLatestDatosForProyecto = async (proyectoId, transaction) => {
  const rows = await ProyectoEstimacion.findAll({
    where: { proyectoId },
    include: [estadoCuentaInclude],
    order: [
      ["numero", "DESC"],
      ["createdAt", "DESC"],
    ],
    transaction,
  });
  for (const row of rows) {
    const estado = row.estadoCuenta || {};
    if (hasAnyDatos(estado)) {
      return Object.fromEntries(
        DATOS_ESTIMACION_FIELDS.map((f) => [
          f,
          estado[f] != null && String(estado[f]).trim() !== ""
            ? String(estado[f])
            : null,
        ])
      );
    }
  }
  return null;
};
```

- [ ] **Step 1: `serializeEstimacion`** — also flatten the 10 string fields (null if empty).

- [ ] **Step 2: `createEstimacion`** — before create: `existingDatos = await findLatestDatosForProyecto(proyectoId)`. If found, use that; else `pickDatosFromBody(req.body)`. Merge into `ProyectoEstimacionEstadoCuenta.create`.

- [ ] **Step 3: `updateEstimacion`** — do **not** apply body datos if row already has any datos OR project has latest datos. If row has none and project has none, allow first fill via `pickDatosFromBody`. If row empty but project has datos, copy project datos (keep locked). Prefer: never overwrite non-empty datos from body; if body sent and row empty and no project datos, allow set once.

Per spec PATCH: "No permite modificar estos 10 campos si ya estaban llenos". So:
- If `hasAnyDatos(existingEstado)` → omit datos from `estadoUpdates`
- Else if `findLatestDatosForProyecto` returns values → set those (ignore body)
- Else → allow `pickDatosFromBody` into upsert

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: lock and copy Datos Estimación on create/update"
```

---

### Task 3: Frontend form + Estados de cuenta

**Files:**
- Modify: `front/src/pages/ProyectoDetalle.tsx`

- [ ] **Step 1: Types/constants** — `DATOS_ESTIMACION_FIELDS`, labels map, empty form helpers, extend `EstimacionData` / `EstimacionForm` / mappers.

- [ ] **Step 2: Derive `datosLocked`** — true if any estimation in list `hasAnyDatos`. When opening new form, prefill from latest estimation that has datos. Inputs `disabled={datosLocked}` (also when editing if locked).

- [ ] **Step 3: Collapsible under carátula** — title "Datos Estimación", grid of Label+Input text.

- [ ] **Step 4: Estados de cuenta** — Collapsible after Carátula, before `MODULOS_MONTOS`, table Concepto | Valor, empty → "—".

- [ ] **Step 5: Ensure POST/PATCH FormData or JSON includes the 10 keys** (same path as montos).

- [ ] **Step 6: Commit**

```bash
git commit -m "feat: UI Datos Estimación in form and estados de cuenta"
```

---

### Task 4: Manual verification

- [ ] First estimation: fill datos → save → appear in Estados de cuenta
- [ ] Second estimation: fields autofilled + disabled → save → same values stored
- [ ] PATCH cannot change datos once set
- [ ] Commit plan doc if not yet committed
