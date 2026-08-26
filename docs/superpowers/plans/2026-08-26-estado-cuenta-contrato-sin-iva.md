# Estado de Cuenta del Contrato (Sin IVA) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist five manual currency fields per estimation and expose them in a collapsible module inside the estimation form on `ProyectoDetalle`.

**Architecture:** Add five `DECIMAL(15,2)` columns on `proyecto_estimaciones`. Wire them through create/update in `proyectoEstimacionesController`. On the front, extend `EstimacionForm` / `EstimacionData` and render a closed-by-default `Collapsible` with `$`-prefixed number inputs; values travel in the existing FormData submit.

**Tech Stack:** Sequelize migrations/models, Express controller, React + TanStack Query, Radix Collapsible, shadcn Input/Label.

## Global Constraints

- All five fields are manually editable (no auto-calculation).
- Scoped per estimation, not per project.
- UI only inside Agregar/Editar estimación; table columns unchanged.
- Labels: Contrato Principal sin IVA, Acumulado Estimación Anterior, Esta Estimación, Estimado a la Fecha, Saldo por Estimar.
- Column names: `contratoPrincipalSinIva`, `acumuladoEstimacionAnterior`, `estaEstimacion`, `estimadoALaFecha`, `saldoPorEstimar`.
- Default `0`; values ≥ 0; `DECIMAL(15, 2)`.
- Collapsible starts closed; `$` prefix on each input.

## File map

| File | Responsibility |
|------|----------------|
| `back/migrations/20260826150000-add-estado-cuenta-to-proyecto-estimaciones.js` | Add/remove the 5 columns |
| `back/models/ProyectoEstimacion.js` | Sequelize attributes |
| `back/controllers/proyectoEstimacionesController.js` | Read/write fields on create/update |
| `front/src/pages/ProyectoDetalle.tsx` | Types, form state, FormData, Collapsible UI |

---

### Task 1: Backend — migration + model + controller

**Files:**
- Create: `back/migrations/20260826150000-add-estado-cuenta-to-proyecto-estimaciones.js`
- Modify: `back/models/ProyectoEstimacion.js`
- Modify: `back/controllers/proyectoEstimacionesController.js`

**Interfaces:**
- Produces: columns and model fields `contratoPrincipalSinIva`, `acumuladoEstimacionAnterior`, `estaEstimacion`, `estimadoALaFecha`, `saldoPorEstimar` (number ≥ 0, default 0)
- Produces: create/update accept those keys from `req.body`; list/get return them via Sequelize

- [ ] **Step 1: Create migration**

```js
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const cols = [
      "contratoPrincipalSinIva",
      "acumuladoEstimacionAnterior",
      "estaEstimacion",
      "estimadoALaFecha",
      "saldoPorEstimar",
    ];
    for (const col of cols) {
      await queryInterface.addColumn("proyecto_estimaciones", col, {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      });
    }
  },

  async down(queryInterface) {
    for (const col of [
      "saldoPorEstimar",
      "estimadoALaFecha",
      "estaEstimacion",
      "acumuladoEstimacionAnterior",
      "contratoPrincipalSinIva",
    ]) {
      await queryInterface.removeColumn("proyecto_estimaciones", col);
    }
  },
};
```

- [ ] **Step 2: Update model**

Add to `ProyectoEstimacion` attributes (after `caratula`):

```js
contratoPrincipalSinIva: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
acumuladoEstimacionAnterior: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
estaEstimacion: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
estimadoALaFecha: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
saldoPorEstimar: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
```

- [ ] **Step 3: Wire controller create/update**

Add helper after `toDecimal`:

```js
const ESTADO_CUENTA_FIELDS = [
  "contratoPrincipalSinIva",
  "acumuladoEstimacionAnterior",
  "estaEstimacion",
  "estimadoALaFecha",
  "saldoPorEstimar",
];

const parseNonNegativeDecimal = (value, fieldName) => {
  const num = toDecimal(value, 0);
  if (num < 0) {
    const err = new Error(`${fieldName} debe ser mayor o igual a 0.`);
    err.status = 400;
    throw err;
  }
  return num;
};

const pickEstadoCuentaFromBody = (body, { partial = false } = {}) => {
  const out = {};
  for (const field of ESTADO_CUENTA_FIELDS) {
    if (body[field] === undefined) {
      if (!partial) out[field] = 0;
      continue;
    }
    out[field] = parseNonNegativeDecimal(body[field], field);
  }
  return out;
};
```

In `createEstimacion`, merge `...pickEstadoCuentaFromBody(req.body)` into `ProyectoEstimacion.create({...})`.

In `updateEstimacion`, after building `updates` for existing fields:

```js
Object.assign(updates, pickEstadoCuentaFromBody(req.body, { partial: true }));
```

In create/update `catch`, if `error.status === 400`, return `res.status(400).json({ message: error.message })` before the 500 path (and still cleanup uploads on create when not persisted).

- [ ] **Step 4: Run migration**

Run: `cd back && npx sequelize-cli db:migrate` (or project’s usual migrate command)  
Expected: migration applied without error.

- [ ] **Step 5: Commit**

```bash
git add back/migrations/20260826150000-add-estado-cuenta-to-proyecto-estimaciones.js \
  back/models/ProyectoEstimacion.js \
  back/controllers/proyectoEstimacionesController.js
git commit -m "feat: persist estado de cuenta sin IVA on estimaciones"
```

---

### Task 2: Frontend — form state + Collapsible UI

**Files:**
- Modify: `front/src/pages/ProyectoDetalle.tsx`

**Interfaces:**
- Consumes: API fields from Task 1
- Produces: form keys matching column names; FormData appends the five values on create/update

- [ ] **Step 1: Extend types and defaults**

Add to `EstimacionData` and `EstimacionForm` (form values as strings):

```ts
contratoPrincipalSinIva: number // / string in form
acumuladoEstimacionAnterior: number
estaEstimacion: number
estimadoALaFecha: number
saldoPorEstimar: number
```

Update `emptyEstimacion`, `toEstimacionData`, `toEstimacionForm`, `startEditEstim` to include all five (default `"0"` / `0`).

- [ ] **Step 2: Append to FormData in `buildEstimFormData`**

```ts
body.append("contratoPrincipalSinIva", String(Number(estimForm.contratoPrincipalSinIva || 0)))
body.append("acumuladoEstimacionAnterior", String(Number(estimForm.acumuladoEstimacionAnterior || 0)))
body.append("estaEstimacion", String(Number(estimForm.estaEstimacion || 0)))
body.append("estimadoALaFecha", String(Number(estimForm.estimadoALaFecha || 0)))
body.append("saldoPorEstimar", String(Number(estimForm.saldoPorEstimar || 0)))
```

- [ ] **Step 3: Add Collapsible UI**

Imports: `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` from `@/components/ui/collapsible`; `ChevronDown` from `lucide-react`.

Place after carátula/fotos block and before the submit buttons row, still inside the estimación card:

```tsx
<Collapsible className="rounded-md border border-border">
  <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left font-medium hover:bg-muted/50">
    Estado de Cuenta del Contrato (Sin IVA)
    <ChevronDown className="h-4 w-4 shrink-0" />
  </CollapsibleTrigger>
  <CollapsibleContent className="border-t border-border px-4 py-4">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* five fields: Label + relative wrapper with $ + Input type=number min=0 step=0.01 */}
    </div>
  </CollapsibleContent>
</Collapsible>
```

Each money input pattern:

```tsx
<div className="space-y-2">
  <Label>Contrato Principal sin IVA</Label>
  <div className="relative">
    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
      $
    </span>
    <Input
      type="number"
      min="0"
      step="0.01"
      className="pl-7"
      value={estimForm.contratoPrincipalSinIva}
      onChange={(e) =>
        setEstimForm((prev) => ({ ...prev, contratoPrincipalSinIva: e.target.value }))
      }
    />
  </div>
</div>
```

Repeat for the other four labels/keys. Collapsible default closed (`defaultOpen` omitted / `false`).

- [ ] **Step 4: Smoke-check in UI**

With front/back running: open a project → Gestionar → expand module → set values → save → edit same estimation → values restored. Table layout unchanged.

- [ ] **Step 5: Commit**

```bash
git add front/src/pages/ProyectoDetalle.tsx
git commit -m "feat: collapsible estado de cuenta in estimacion form"
```
