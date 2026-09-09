# Compras Module — Implementation Plan

> **For agentic workers:** Execute inline (user requested implement now). Spec: `docs/superpowers/specs/2026-09-09-compras-module-design.md`

**Goal:** Gestión → Compras: import Historial_Compras from xlsm (upsert orders+lines) and attach PDF/image invoices to orders.

**Architecture:** Sequelize tables `ordenes_compra`, `orden_compra_partidas`, `orden_compra_facturas`; Express `/api/compras` with multer + exceljs; React pages `/compras` and `/compras/facturas`.

**Tech Stack:** Node/Express, Sequelize/MySQL, multer, exceljs, React Query, existing auth/permissions.

## Global Constraints

- Import only sheet `Historial_Compras`
- Order key: `(fecha, proyecto, proveedor)` text fields
- Partida upsert: `(ordenCompraId, indice, nombreProducto)`; empty índice → `0`
- Facturas on order only; reimport must not delete facturas
- Permissions: `compras.view`, `compras.import`, `compras.facturas`

## File map

| File | Responsibility |
|------|----------------|
| `back/package.json` | Add `exceljs` |
| `back/constants/permissions.js` | COMPRAS_* |
| `back/migrations/20260909150000-create-compras-tables.js` | Tables + indexes |
| `back/migrations/20260909151000-grant-compras-permissions.js` | Grant perms |
| `back/models/OrdenCompra.js` | Model |
| `back/models/OrdenCompraPartida.js` | Model |
| `back/models/OrdenCompraFactura.js` | Model |
| `back/models/index.js` | Associations + export |
| `back/config/uploads.js` | Compras dirs |
| `back/middlewares/uploadComprasFiles.js` | xlsm + factura multer |
| `back/controllers/comprasController.js` | list/get/import/facturas |
| `back/routes/comprasRoutes.js` | Routes |
| `back/routes/index.js` | Mount `/compras` |
| `back/server.js` | Static `/uploads/compras` |
| `front/src/lib/permissions.ts` | COMPRAS_* |
| `front/src/components/layout/AppSidebar.tsx` | Nav item |
| `front/src/App.tsx` | Routes |
| `front/src/pages/Compras.tsx` | List + import + detail |
| `front/src/pages/ComprasFacturas.tsx` | Facturas UX |

### Task 1: Backend schema + permissions + exceljs
### Task 2: Backend uploads + controller + routes
### Task 3: Frontend pages + nav
### Task 4: Migrate + smoke verify
