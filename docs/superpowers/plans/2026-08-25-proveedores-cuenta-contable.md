# Proveedores Cuenta Contable Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Catálogo de cuentas contables (número solo dígitos, único) y asignación 1:1 obligatoria a proveedores al crear/editar.

**Architecture:** Tabla `cuentas_contables` + FK `proveedores.cuentaContableId` (nullable en BD, única, requerida en API). CRUD de catálogo con filtro `disponibles`. UI nueva tipo Nomenclaturas; selector obligatorio en `Proveedores.tsx`.

**Tech Stack:** Express, Sequelize, MySQL, React (Vite), React Query, shadcn Dialog/Select.

**Spec:** `docs/superpowers/specs/2026-08-25-proveedores-cuenta-contable-design.md`

## Global Constraints

- `numero`: string, solo dígitos `/^\d+$/`, único en catálogo
- Relación 1:1: una cuenta → máximo un proveedor (índice único en `cuentaContableId`)
- Create/PATCH proveedor exige `cuentaContableId`; BD permite NULL para legacy
- Selector solo muestra cuentas `activa=true` libres (+ cuenta actual al editar)
- No crear cuenta “al vuelo” desde el formulario de proveedor
- Sin suite de tests automatizados: verificar con `npm run migrate` + curl + UI manual
- Commit frecuente por tarea

## File map

| File | Responsibility |
|------|----------------|
| `back/migrations/20260825150000-create-cuentas-contables.js` | Tabla `cuentas_contables` |
| `back/migrations/20260825150100-add-cuenta-contable-to-proveedores.js` | FK + unique en `proveedores` |
| `back/migrations/20260825150200-grant-cuentas-contables-permissions.js` | Permisos a roles existentes |
| `back/models/CuentaContable.js` | Modelo Sequelize |
| `back/models/Proveedor.js` | Campo `cuentaContableId` |
| `back/models/index.js` | Asociaciones 1:1 |
| `back/constants/permissions.js` | Claves `cuentas_contables.*` |
| `back/controllers/cuentasContablesController.js` | CRUD + `disponibles` + validaciones |
| `back/routes/cuentasContablesRoutes.js` | Rutas + permisos |
| `back/routes/index.js` | Mount `/cuentas-contables` |
| `back/controllers/proveedoresController.js` | Exigir y validar cuenta; include en list/get |
| `front/src/lib/permissions.ts` | Constantes espejo |
| `front/src/components/modals/CuentaContableModal.tsx` | Modal crear/editar cuenta |
| `front/src/pages/CuentasContables.tsx` | Página catálogo |
| `front/src/pages/Proveedores.tsx` | Selector + columna cuenta |
| `front/src/App.tsx` | Ruta protegida |
| `front/src/components/layout/AppSidebar.tsx` | Ítem de menú |

---

### Task 1: Migrations (tabla, FK, permisos)

**Files:**
- Create: `back/migrations/20260825150000-create-cuentas-contables.js`
- Create: `back/migrations/20260825150100-add-cuenta-contable-to-proveedores.js`
- Create: `back/migrations/20260825150200-grant-cuentas-contables-permissions.js`

**Interfaces:**
- Produces: table `cuentas_contables` (`id`, `numero` UNIQUE, `nombre`, `activa`, timestamps)
- Produces: column `proveedores.cuentaContableId` (UUID NULL FK, UNIQUE)
- Produces: permissions `cuentas_contables.view|create|edit|delete` granted to all roles already in `role_permissions` (+ `admin`)

- [ ] **Step 1: Create `back/migrations/20260825150000-create-cuentas-contables.js`**

```js
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("cuentas_contables", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      numero: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      activa: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("cuentas_contables");
  },
};
```

- [ ] **Step 2: Create `back/migrations/20260825150100-add-cuenta-contable-to-proveedores.js`**

```js
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable("proveedores");
    if (!tableDesc.cuentaContableId) {
      await queryInterface.addColumn("proveedores", "cuentaContableId", {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "cuentas_contables", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
      await queryInterface.addIndex("proveedores", ["cuentaContableId"], {
        unique: true,
        name: "proveedores_cuenta_contable_id_unique",
      });
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable("proveedores");
    if (tableDesc.cuentaContableId) {
      await queryInterface.removeIndex(
        "proveedores",
        "proveedores_cuenta_contable_id_unique"
      );
      await queryInterface.removeColumn("proveedores", "cuentaContableId");
    }
  },
};
```

- [ ] **Step 3: Create `back/migrations/20260825150200-grant-cuentas-contables-permissions.js`**

Mirror `back/migrations/20260506145000-grant-checklist-diario-permissions.js` with:

```js
const NEW_PERMISSIONS = [
  "cuentas_contables.view",
  "cuentas_contables.create",
  "cuentas_contables.edit",
  "cuentas_contables.delete",
];
```

Same `up`/`down` pattern (insert missing role×permission rows; delete on down).

- [ ] **Step 4: Run migrations**

```bash
cd back && npm run migrate
```

Expected: three migrations applied without error.

- [ ] **Step 5: Commit**

```bash
git add back/migrations/20260825150000-create-cuentas-contables.js \
  back/migrations/20260825150100-add-cuenta-contable-to-proveedores.js \
  back/migrations/20260825150200-grant-cuentas-contables-permissions.js
git commit -m "feat: migrate cuentas contables and proveedor FK"
```

---

### Task 2: Models + associations + permission constants

**Files:**
- Create: `back/models/CuentaContable.js`
- Modify: `back/models/Proveedor.js`
- Modify: `back/models/index.js`
- Modify: `back/constants/permissions.js`
- Modify: `front/src/lib/permissions.ts`

**Interfaces:**
- Produces: model `CuentaContable` with fields `id`, `numero`, `nombre`, `activa`
- Produces: `Proveedor.cuentaContableId`
- Produces: `Proveedor.belongsTo(CuentaContable, { as: "cuentaContable" })`
- Produces: `CuentaContable.hasOne(Proveedor, { as: "proveedor", foreignKey: "cuentaContableId" })`
- Produces: `P.CUENTAS_CONTABLES_VIEW|CREATE|EDIT|DELETE` (back + front)

- [ ] **Step 1: Create `back/models/CuentaContable.js`**

```js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CuentaContable = sequelize.define(
  "CuentaContable",
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    numero: { type: DataTypes.STRING, allowNull: false, unique: true },
    nombre: { type: DataTypes.STRING, allowNull: true },
    activa: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: "cuentas_contables", timestamps: true }
);

module.exports = CuentaContable;
```

- [ ] **Step 2: Add field to `back/models/Proveedor.js`**

After `estado` field definition, add:

```js
cuentaContableId: {
  type: DataTypes.UUID,
  allowNull: true,
},
```

- [ ] **Step 3: Wire associations in `back/models/index.js`**

```js
const CuentaContable = require("./CuentaContable");
// ...
CuentaContable.hasOne(Proveedor, { foreignKey: "cuentaContableId", as: "proveedor" });
Proveedor.belongsTo(CuentaContable, { foreignKey: "cuentaContableId", as: "cuentaContable" });
```

Export `CuentaContable` in the module exports object.

- [ ] **Step 4: Add permissions constants**

In `back/constants/permissions.js` after `PROVEEDORES_DELETE`:

```js
CUENTAS_CONTABLES_VIEW: "cuentas_contables.view",
CUENTAS_CONTABLES_CREATE: "cuentas_contables.create",
CUENTAS_CONTABLES_EDIT: "cuentas_contables.edit",
CUENTAS_CONTABLES_DELETE: "cuentas_contables.delete",
```

Same four keys in `front/src/lib/permissions.ts` after `PROVEEDORES_DELETE`.

- [ ] **Step 5: Commit**

```bash
git add back/models/CuentaContable.js back/models/Proveedor.js back/models/index.js \
  back/constants/permissions.js front/src/lib/permissions.ts
git commit -m "feat: models and permissions for cuentas contables"
```

---

### Task 3: API catálogo `/cuentas-contables`

**Files:**
- Create: `back/controllers/cuentasContablesController.js`
- Create: `back/routes/cuentasContablesRoutes.js`
- Modify: `back/routes/index.js`

**Interfaces:**
- Consumes: `CuentaContable`, `Proveedor`, `P.CUENTAS_CONTABLES_*`
- Produces: CRUD handlers; `GET ?q=&disponibles=1&excludeProveedorId=`
- Produces: route mount `router.use("/cuentas-contables", cuentasContablesRoutes)`

- [ ] **Step 1: Create `back/controllers/cuentasContablesController.js`**

Implement dedicated controller (not plain `simpleCrudFactory`) with:

```js
const { Op } = require("sequelize");
const CuentaContable = require("../models/CuentaContable");
const Proveedor = require("../models/Proveedor");
const { logError } = require("../utils/logger");

const DIGITS_ONLY = /^\d+$/;

const trimOrNull = (value) => {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
};

const normalizeNumero = (value) => {
  if (value === undefined) return undefined;
  const num = trimOrNull(value);
  if (num === null) return null;
  if (!DIGITS_ONLY.test(num)) return { error: "El número de cuenta solo puede contener dígitos." };
  return num;
};

const buildPayload = (body, { partial = false } = {}) => {
  const payload = {};
  const errors = [];

  if (!partial || body.numero !== undefined) {
    const numero = normalizeNumero(body.numero);
    if (numero && typeof numero === "object" && numero.error) {
      errors.push(numero.error);
    } else if (!numero) {
      errors.push("El número de cuenta es obligatorio.");
    } else {
      payload.numero = numero;
    }
  }

  if (body.nombre !== undefined) payload.nombre = trimOrNull(body.nombre);
  if (body.activa !== undefined) {
    payload.activa = body.activa === true || body.activa === "true" || body.activa === 1 || body.activa === "1";
  } else if (!partial) {
    payload.activa = true;
  }

  return { payload, errors };
};
```

`list`:
- Support `q` search on `numero` / `nombre`
- If `disponibles=1` (or `true`): only `activa=true` AND (`proveedor` is null OR `proveedor.id === excludeProveedorId` when that query param is present)
- Include association `proveedor` with attributes `["id", "nombre"]` when useful for UI
- Order by `numero ASC`

`create` / `update`: use `buildPayload`; on unique violation return 400 `"El número de cuenta ya existe."`

`remove`: if `Proveedor.findOne({ where: { cuentaContableId: id } })` exists → 400 `"No se puede eliminar: la cuenta está asignada a un proveedor."`; else destroy.

- [ ] **Step 2: Create `back/routes/cuentasContablesRoutes.js`**

```js
const express = require("express");
const { requirePermission } = require("../middlewares/permissions");
const P = require("../constants/permissions");
const controller = require("../controllers/cuentasContablesController");

const router = express.Router();
router.get("/", requirePermission(P.CUENTAS_CONTABLES_VIEW), controller.list);
router.get("/:id", requirePermission(P.CUENTAS_CONTABLES_VIEW), controller.getById);
router.post("/", requirePermission(P.CUENTAS_CONTABLES_CREATE), controller.create);
router.patch("/:id", requirePermission(P.CUENTAS_CONTABLES_EDIT), controller.update);
router.delete("/:id", requirePermission(P.CUENTAS_CONTABLES_DELETE), controller.remove);

module.exports = router;
```

- [ ] **Step 3: Mount in `back/routes/index.js`**

```js
const cuentasContablesRoutes = require("./cuentasContablesRoutes");
// ...
router.use("/cuentas-contables", cuentasContablesRoutes);
```

Place near `/proveedores` / `/nomenclaturas`.

- [ ] **Step 4: Manual API smoke test**

With backend running and an admin token:

```bash
# Create
curl -s -X POST "$API/cuentas-contables" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"numero":"00123","nombre":"Proveedores varios"}'
# Expected: 201 with cuentaContable.numero === "00123"

# Reject letters
curl -s -X POST "$API/cuentas-contables" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"numero":"ABC"}'
# Expected: 400 digits message

# Duplicate
curl -s -X POST "$API/cuentas-contables" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"numero":"00123"}'
# Expected: 400 already exists

# Disponibles
curl -s "$API/cuentas-contables?disponibles=1" -H "Authorization: Bearer $TOKEN"
# Expected: includes 00123
```

- [ ] **Step 5: Commit**

```bash
git add back/controllers/cuentasContablesController.js \
  back/routes/cuentasContablesRoutes.js back/routes/index.js
git commit -m "feat: API CRUD for cuentas contables"
```

---

### Task 4: Extender API proveedores (cuenta obligatoria + include)

**Files:**
- Modify: `back/controllers/proveedoresController.js`

**Interfaces:**
- Consumes: `CuentaContable`, association `cuentaContable`
- Produces: create/update require valid free `cuentaContableId`; list/get include `{ id, numero, nombre, activa }`

- [ ] **Step 1: Require `CuentaContable` and helper**

At top of `proveedoresController.js`:

```js
const CuentaContable = require("../models/CuentaContable");

const cuentaInclude = {
  model: CuentaContable,
  as: "cuentaContable",
  attributes: ["id", "numero", "nombre", "activa"],
};

const assertCuentaDisponible = async (cuentaContableId, { excludeProveedorId } = {}) => {
  const cuenta = await CuentaContable.findByPk(cuentaContableId);
  if (!cuenta) return { error: "Cuenta contable no encontrada.", code: 404 };
  if (!cuenta.activa) return { error: "La cuenta contable no está activa.", code: 400 };
  const occupied = await Proveedor.findOne({
    where: {
      cuentaContableId,
      ...(excludeProveedorId ? { id: { [Op.ne]: excludeProveedorId } } : {}),
    },
  });
  if (occupied) {
    return { error: "La cuenta contable ya está asignada a otro proveedor.", code: 400 };
  }
  return { cuenta };
};
```

- [ ] **Step 2: Extend `buildPayload`**

When `!partial || body.cuentaContableId !== undefined`:
- If missing/empty → push `"La cuenta contable es obligatoria."`
- Else set `payload.cuentaContableId = String(body.cuentaContableId).trim()`

Note: actual existence/availability check happens in create/update (async), not inside sync `buildPayload`.

- [ ] **Step 3: Update `list` / `getById` / `create` / `update`**

- `findAll` / `findByPk`: add `include: [cuentaInclude]`
- `create`: after buildPayload, if no `cuentaContableId` already caught; call `assertCuentaDisponible(payload.cuentaContableId)`; on error return code/message; else create; return with include
- `update`: if `payload.cuentaContableId` present, `assertCuentaDisponible(payload.cuentaContableId, { excludeProveedorId: id })`; for partial updates that omit the field, leave as-is **except** if the existing row has `null` and client did not send a value, still require sending one when they intend to save from UI (UI always sends it). Spec: create/PATCH exigen cuenta — on create always; on PATCH if `cuentaContableId` is in body OR current is null and body omits it, require it:

```js
const nextCuentaId =
  payload.cuentaContableId !== undefined
    ? payload.cuentaContableId
    : proveedor.cuentaContableId;
if (!nextCuentaId) {
  return res.status(400).json({ message: "La cuenta contable es obligatoria." });
}
if (payload.cuentaContableId !== undefined) {
  const check = await assertCuentaDisponible(payload.cuentaContableId, {
    excludeProveedorId: id,
  });
  if (check.error) return res.status(check.code).json({ message: check.error });
}
```

Also add `cuentaContable.numero` to list search `Op.or` via `$cuentaContable.numero$` if dialect supports it; otherwise keep searching proveedor fields only (acceptable).

- [ ] **Step 4: Smoke test assignment**

```bash
# Assign on create
curl -s -X POST "$API/proveedores" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Demo SA","categoria":"general","cuentaContableId":"<UUID>"}'
# Expected: 201 with proveedor.cuentaContable.numero

# Second proveedor same cuenta
curl -s -X POST "$API/proveedores" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Otro","categoria":"general","cuentaContableId":"<UUID>"}'
# Expected: 400 already assigned

# Disponibles no longer includes that cuenta
curl -s "$API/cuentas-contables?disponibles=1" -H "Authorization: Bearer $TOKEN"
```

- [ ] **Step 5: Commit**

```bash
git add back/controllers/proveedoresController.js
git commit -m "feat: require unique cuenta contable on proveedores"
```

---

### Task 5: UI catálogo Cuentas Contables

**Files:**
- Create: `front/src/components/modals/CuentaContableModal.tsx`
- Create: `front/src/pages/CuentasContables.tsx`
- Modify: `front/src/App.tsx`
- Modify: `front/src/components/layout/AppSidebar.tsx`

**Interfaces:**
- Consumes: `/cuentas-contables` CRUD, `PERMISSIONS.CUENTAS_CONTABLES_*`
- Produces: page at `/cuentas-contables`; sidebar item next to Proveedores

- [ ] **Step 1: Create `front/src/components/modals/CuentaContableModal.tsx`**

Mirror `NomenclaturaModal` shape:

```tsx
export type CuentaContableFormData = {
  numero: string;
  nombre: string;
  activa: boolean;
};
```

- Input `numero`: `inputMode="numeric"`, strip non-digits on change (`value.replace(/\D/g, "")`), required
- Input `nombre`: optional
- Select activa/inactivo like nomenclatura
- Titles: "Crear cuenta contable" / "Editar cuenta contable"

- [ ] **Step 2: Create `front/src/pages/CuentasContables.tsx`**

Mirror `Nomenclaturas.tsx` structure:

- Query `["cuentas-contables"]` → `GET /cuentas-contables`
- Mutations POST/PATCH/DELETE
- Table columns: Número, Nombre, Estado, Asignada a (proveedor.nombre or "—"), Acciones
- Search by número/nombre client-side
- Use `ConfirmDeleteButton`; surface API error toast on delete-in-use
- `toast` from sonner on success/error

- [ ] **Step 3: Route in `front/src/App.tsx`**

Import `CuentasContables` and add:

```tsx
<Route
  path="/cuentas-contables"
  element={
    <ProtectedRoute requiredPermissions={[PERMISSIONS.CUENTAS_CONTABLES_VIEW]}>
      <CuentasContables />
    </ProtectedRoute>
  }
/>
```

Near `/proveedores` or `/nomenclaturas`.

- [ ] **Step 4: Sidebar item in `AppSidebar.tsx`**

In `configItems`, after Proveedores:

```ts
{
  title: "Cuentas contables",
  url: "/cuentas-contables",
  icon: Settings, // or Building — reuse existing import
  requiredPermissions: [PERMISSIONS.CUENTAS_CONTABLES_VIEW],
},
```

- [ ] **Step 5: Manual UI check**

- Open `/cuentas-contables`, create `00123`, edit nombre, toggle inactiva, delete unused
- Confirm menu visible for admin after re-login if permissions were just granted

- [ ] **Step 6: Commit**

```bash
git add front/src/components/modals/CuentaContableModal.tsx \
  front/src/pages/CuentasContables.tsx front/src/App.tsx \
  front/src/components/layout/AppSidebar.tsx
git commit -m "feat: UI catalog for cuentas contables"
```

---

### Task 6: Selector de cuenta en Proveedores

**Files:**
- Modify: `front/src/pages/Proveedores.tsx`

**Interfaces:**
- Consumes: `GET /cuentas-contables?disponibles=1&excludeProveedorId=<id>`
- Produces: form field `cuentaContableId` required; table column showing `cuentaContable.numero`

- [ ] **Step 1: Extend types and mapping**

```ts
type CuentaContableLite = {
  id: string;
  numero: string;
  nombre?: string | null;
  activa?: boolean;
};

// on ProveedorBackend:
cuentaContableId?: string | null;
cuentaContable?: CuentaContableLite | null;

// on ProveedorVM:
cuentaContableId: string;
cuentaNumero: string;
cuentaNombre: string;
```

Map from backend; default empty strings when missing.

- [ ] **Step 2: Load available accounts**

```ts
const cuentasQuery = useQuery({
  queryKey: ["cuentas-contables-disponibles", editingId],
  queryFn: () => {
    const params = new URLSearchParams({ disponibles: "1" });
    if (editingId) params.set("excludeProveedorId", editingId);
    return apiRequest<{ cuentasContables: CuentaContableLite[] }>(
      `/cuentas-contables?${params.toString()}`
    );
  },
  enabled: isDialogOpen,
});
```

Response key must match controller `listKey` — use **`cuentasContables`** consistently in controller JSON.

- [ ] **Step 3: Form field + submit validation**

- Add `cuentaContableId: ""` to `defaultForm`
- In dialog form, Select labeled "Número de cuenta" (required), options from `cuentasQuery` showing `numero` + optional nombre
- `buildPayload` includes `cuentaContableId`
- `handleSubmit`: if empty → `toast.error("La cuenta contable es obligatoria")`
- On edit open: set `cuentaContableId` from proveedor
- Invalidate `["cuentas-contables-disponibles"]` (and optionally `["cuentas-contables"]`) after create/update proveedor

- [ ] **Step 4: Table column**

Add `<TableHead>Cuenta</TableHead>` and cell with `proveedor.cuentaNumero || "—"` (and nombre in muted text if present).

- [ ] **Step 5: Manual UI checklist (from spec)**

- [ ] Crear cuenta solo dígitos
- [ ] Rechazar letras / duplicado
- [ ] Asignar al crear proveedor
- [ ] No asignar misma cuenta a segundo proveedor
- [ ] Al editar, cuenta actual visible
- [ ] Cambiar cuenta libera la anterior
- [ ] No eliminar cuenta asignada
- [ ] Listado muestra número
- [ ] Legacy sin cuenta: lista OK; editar exige cuenta

- [ ] **Step 6: Commit**

```bash
git add front/src/pages/Proveedores.tsx
git commit -m "feat: assign cuenta contable in proveedores UI"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Tabla `cuentas_contables` | 1 |
| FK + unique `cuentaContableId` | 1 |
| Permisos seed/grant | 1, 2 |
| Modelo + asociaciones | 2 |
| CRUD API + validación dígitos/único | 3 |
| `disponibles` + `excludeProveedorId` | 3 |
| Delete blocked if assigned | 3 |
| Proveedor create/update require free active cuenta | 4 |
| Include cuenta in list/get | 4 |
| Página catálogo + sidebar + route | 5 |
| Selector + columna en Proveedores | 6 |
| Outside scope (asientos, etc.) | not implemented |

## Self-review notes

- JSON list key fixed as `cuentasContables` (aligned with `nomenclaturas` / `proveedores` plural camelCase).
- Partial PATCH that omits `cuentaContableId` keeps existing assignment; still blocks save when current is null and no new id provided.
- MySQL UNIQUE on nullable FK allows multiple NULL legacy rows.
