# Módulo Nómina (Gestión)

Fecha: 2026-09-11  
Estado: aprobado para implementación

## Objetivo

Agregar en **Gestión** (sidebar, debajo de Compras) el módulo **Nómina** para:

1. Gestionar **periodos de pago** con fechas libres, líneas por trabajador (sueldo base + percepciones − deducciones = neto).
2. Registrar **pagos extras** fuera del periodo.
3. Controlar acceso con permisos configurables por el administrador.

## Decisiones

| Tema | Decisión |
|------|----------|
| Beneficiarios | **Trabajadores** (opción A) |
| Modelo de pago | Periodos + pagos extras (opción C) |
| Monto base | `sueldoBase` en trabajador; el periodo lo propone y es editable (opción B) |
| Frecuencia | Fechas **libres** al crear el periodo (opción D) |
| Enfoque v1 | Nómina con **percepciones/deducciones** (opción 2) |
| Cálculo fiscal | Fuera de alcance (sin IMSS/ISR automático) |

## Navegación y permisos

- Sidebar **Gestión**: ítem **Nómina** → `/nomina` (debajo de Compras).
- Subruta o pestaña: `/nomina/extras` para pagos extras.
- En **Configuración → Trabajadores**: campo editable **Sueldo base**.

| Permiso | Uso |
|---------|-----|
| `nomina.view` | Ver periodos, líneas, conceptos y extras |
| `nomina.create` | Crear periodos, editar líneas/conceptos, crear extras |
| `nomina.pay` | Marcar pagado / cerrar periodo |

Sembrar permisos y otorgarlos a roles existentes (mismo patrón que Compras). El admin los asigna en Roles y Permisos.

## Pantallas

1. **Lista de periodos** — fechas, nombre opcional, estado (`borrador` / `cerrado`), total neto, # trabajadores; botón Nueva nómina.
2. **Detalle de periodo** — tabla de líneas; al abrir una línea, modal/panel de conceptos (percepciones y deducciones); acciones de pago/cierre si tiene `nomina.pay`.
3. **Pagos extras** — listado + alta + marcar pagado.
4. **Trabajadores** — input `sueldoBase` en create/edit.

## Modelo de datos

### `trabajadores`

| Campo | Tipo | Notas |
|-------|------|-------|
| `sueldoBase` | DECIMAL(14,2) null | Nuevo; editable en UI |

### `nomina_periodos`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID PK | |
| `fechaInicio` | DATEONLY | Obligatorio |
| `fechaFin` | DATEONLY | Obligatorio; ≥ fechaInicio |
| `nombre` | STRING null | Etiqueta opcional |
| `estado` | ENUM `borrador`,`cerrado` | Default `borrador` |
| `totalNeto` | DECIMAL(14,2) | Suma de netos de líneas |
| timestamps | | |

### `nomina_periodo_lineas`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID PK | |
| `periodoId` | FK → nomina_periodos | CASCADE |
| `trabajadorId` | FK → trabajadores | RESTRICT |
| `sueldoBase` | DECIMAL(14,2) | Snapshot al generar / editable en borrador |
| `totalPercepciones` | DECIMAL(14,2) | Suma conceptos tipo percepción |
| `totalDeducciones` | DECIMAL(14,2) | Suma conceptos tipo deducción |
| `neto` | DECIMAL(14,2) | `sueldoBase + percepciones − deducciones` |
| `estadoPago` | ENUM `pendiente`,`pagado` | Default `pendiente` |
| `pagadoEn` | DATE null | Cuando se marca pagado |
| timestamps | | |

Unique: `(periodoId, trabajadorId)`.

### `nomina_linea_conceptos`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID PK | |
| `lineaId` | FK → nomina_periodo_lineas | CASCADE |
| `tipo` | ENUM `percepcion`,`deduccion` | |
| `concepto` | STRING | Texto libre; UI puede sugerir: bono, horas extra, falta, descuento, otro |
| `monto` | DECIMAL(14,2) | Siempre ≥ 0; el signo lo da `tipo` |
| timestamps | | |

### `nomina_pagos_extras`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID PK | |
| `trabajadorId` | FK → trabajadores | |
| `fecha` | DATEONLY | |
| `monto` | DECIMAL(14,2) | > 0 |
| `concepto` | STRING | |
| `estadoPago` | ENUM `pendiente`,`pagado` | |
| `pagadoEn` | DATE null | |
| `creadoPor` | FK users null | |
| timestamps | | |

## Flujos

### Crear periodo

1. Usuario elige `fechaInicio`, `fechaFin` y opcionalmente `nombre`.
2. Backend crea periodo en `borrador` e inserta una línea por cada trabajador **activo** y sin `bajaLogica`.
3. Cada línea copia `sueldoBase` del trabajador (0 si null); sin conceptos iniciales.
4. Recalcula `totalNeto` del periodo.

### Editar línea / conceptos (solo `borrador`)

1. Actualizar `sueldoBase` de la línea y/o CRUD de conceptos.
2. Recalcular `totalPercepciones`, `totalDeducciones`, `neto` de la línea y `totalNeto` del periodo.
3. Si periodo está `cerrado` → 409 / UI solo lectura.

### Pagar / cerrar

- Marcar una línea `pagado` (`nomina.pay`) → set `pagadoEn`.
- Cerrar periodo (`nomina.pay`): todas las líneas pendientes → `pagado`; periodo → `cerrado`.

### Pagos extras

- Alta con trabajador, fecha, monto, concepto (`pendiente`).
- Marcar `pagado` con `nomina.pay`.

## API

Auth requerida.

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/nomina/periodos` | view | Listar periodos |
| POST | `/nomina/periodos` | create | Crear periodo + líneas |
| GET | `/nomina/periodos/:id` | view | Detalle + líneas + conceptos |
| PATCH | `/nomina/periodos/:id` | create o pay | Actualizar nombre/fechas (borrador) o cerrar |
| PATCH | `/nomina/periodos/:id/lineas/:lineaId` | create / pay | Editar sueldoBase o estadoPago |
| POST | `/nomina/periodos/:id/lineas/:lineaId/conceptos` | create | Agregar concepto |
| PATCH | `/nomina/.../conceptos/:conceptoId` | create | Editar concepto |
| DELETE | `/nomina/.../conceptos/:conceptoId` | create | Eliminar concepto |
| GET/POST | `/nomina/extras` | view / create | Listar / crear extras |
| PATCH | `/nomina/extras/:id` | create o pay | Editar o marcar pagado |

Trabajadores: incluir `sueldoBase` en serialize create/update/get/list.

## UI (patrón existente)

- Misma estética que Compras (Card, Table, Dialog, toasts).
- Lista de periodos con filtros por estado/fechas.
- Detalle: tabla líneas; Dialog “Conceptos” con dos secciones (percepciones / deducciones) y totales.
- Extras: tabla + formulario modal.
- Trabajadores: campo numérico Sueldo base junto a datos laborales.

## Fuera de alcance (v1)

- Cálculo automático IMSS / ISR / CFDI
- Horas desde checklist o asistencias
- Prorrateo por proyecto/obra
- Export a layout bancario
- Reapertura de periodos cerrados (salvo necesidad explícita posterior)

## Criterios de éxito

- Ítem Nómina visible en Gestión debajo de Compras, gated por `nomina.view`.
- Admin puede asignar `nomina.view|create|pay` en Roles y Permisos.
- Se puede guardar sueldo base en trabajadores.
- Crear periodo con fechas libres genera líneas de trabajadores activos con sueldo propuesto.
- Se pueden agregar percepciones/deducciones y el neto se recalcula.
- Se pueden registrar pagos extras y marcar pagos / cerrar periodo.
- Periodo cerrado no permite editar conceptos ni montos.
