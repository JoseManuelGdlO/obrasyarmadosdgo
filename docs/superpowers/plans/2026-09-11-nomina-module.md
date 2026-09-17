# Nómina Module — Implementation Plan

> **For agentic workers:** Execute inline (user requested implement now). Spec: `docs/superpowers/specs/2026-09-11-nomina-module-design.md`

**Goal:** Gestión → Nómina: periodos con percepciones/deducciones, pagos extras, sueldoBase en trabajadores, permisos admin.

**Architecture:** Sequelize tables + Express `/api/nomina/*`; React pages `/nomina` and `/nomina/extras`; extend Trabajadores.

**Tech Stack:** Same as Compras (Express, Sequelize, React Query, permissions).

## File map

| File | Responsibility |
|------|----------------|
| `back/migrations/20260911120000-add-sueldo-base-to-trabajadores.js` | Column sueldoBase |
| `back/migrations/20260911121000-create-nomina-tables.js` | Periodos, líneas, conceptos, extras |
| `back/migrations/20260911122000-grant-nomina-permissions.js` | Grant perms |
| `back/models/Nomina*.js` + Trabajador + index | Models/associations |
| `back/controllers/nominaController.js` | Business logic |
| `back/routes/nominaRoutes.js` + index | Mount API |
| `back/constants/permissions.js` + front permissions | NOMINA_* |
| `front/.../Trabajadores.tsx` | Sueldo base field |
| `front/.../Nomina.tsx`, `NominaExtras.tsx` | UI |
| `AppSidebar.tsx`, `App.tsx` | Nav + routes |

### Tasks: backend schema → API → trabajadores UI → nomina UI → migrate
