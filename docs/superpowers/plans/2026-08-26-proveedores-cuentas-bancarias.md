# Proveedores cuentas bancarias Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Permitir una o más cuentas bancarias (banco, número, CLABE) por proveedor, obligatorias al guardar.

**Architecture:** Campo JSON `cuentasBancarias` en `proveedores`; validación en controller; UI con filas dinámicas en `Proveedores.tsx`.

**Tech Stack:** Sequelize/MySQL, Express, React, TanStack Query

**Spec:** `docs/superpowers/specs/2026-08-26-proveedores-cuentas-bancarias-design.md`

## File map

| File | Responsibility |
|------|----------------|
| `back/migrations/20260826140000-add-cuentas-bancarias-to-proveedores.js` | Add JSON column |
| `back/models/Proveedor.js` | Field definition |
| `back/controllers/proveedoresController.js` | Normalize + validate |
| `front/src/pages/Proveedores.tsx` | Form rows + table column |

## Task 1: Migration + model

- Add nullable JSON `cuentasBancarias` to `proveedores`
- Add field to Sequelize model

## Task 2: Controller validation

- Parse array; trim; drop empty rows; require ≥1 on create/update when field sent
- On create always require; on update require when `cuentasBancarias` in body (UI always sends)
- CLABE `/^\d{18}$/`

## Task 3: Frontend

- State: array of `{ banco, numeroCuenta, clabe }` starting with one row
- Add/remove rows; validate before submit
- Table column showing first account + `+N`
