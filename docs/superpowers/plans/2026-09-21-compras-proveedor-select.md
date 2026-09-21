# Compras: Select de proveedor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** En Nueva compra, elegir proveedor desde un Select de proveedores activos del catálogo.

**Architecture:** Solo UI en `Compras.tsx`: query a `/proveedores`, filtrar `estado === "activo"`, Select que guarda el nombre como string (API sin cambios).

**Tech Stack:** React, TanStack Query, shadcn Select, API existente.

## Global Constraints

- Sin texto libre de proveedor
- Sin migración / `proveedorId`
- Solo proveedores activos
- Payload create sin cambios (`proveedor: string`)

---

### Task 1: Select de proveedor en Nueva compra

**Files:**
- Modify: `front/src/pages/Compras.tsx`

- [x] Add `canViewProveedores` and query `["proveedores-lite-compras"]` → `GET /proveedores` when `nuevaOpen && (canViewProveedores || canImport)`
- [x] Derive `proveedoresActivos` filtered by `estado === "activo"`, sorted by `nombre`
- [x] Replace proveedor `Input` with `Select` (value = nombre; empty list placeholder)
- [x] Keep `submitNueva` / `resetNuevaForm` using `proveedor` string
- [ ] Manual check: open Nueva compra, pick provider, save

---
