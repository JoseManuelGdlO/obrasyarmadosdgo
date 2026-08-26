# Estimación: módulos pago / anticipo / fondo — Plan

> **For agentic workers:** Use executing-plans or implement inline. Checkboxes track progress.

**Goal:** Add 19 manual DECIMAL fields and 3 collapsible modules on the estimation form.

**Architecture:** Same as contrato sin IVA — columns on `proyecto_estimaciones`, extend `ESTADO_CUENTA_FIELDS` (or rename to `MONTOS_MANUALES_FIELDS`), FormData + Collapsibles in `ProyectoDetalle`.

**Tech Stack:** Sequelize, Express, React, Radix Collapsible.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-26-estimacion-modulos-pago-anticipo-fondo-design.md`
- Manual entry only; per estimation; `$` prefix; collapsibles closed by default
- Two UI labels “Sub Total” → `pagoSubTotal1` / `pagoSubTotal2`
- Anticipo note text verbatim from spec

### Task 1: Backend

- Create migration `20260826160000-add-pago-anticipo-fondo-to-proyecto-estimaciones.js`
- Extend model + `ESTADO_CUENTA_FIELDS` with 19 keys
- Migrate + commit

### Task 2: Frontend

- Extend types/defaults/mappers/FormData/startEdit
- Three Collapsibles after contrato module
- Prefer shared money-field renderer to avoid duplication
- Commit
