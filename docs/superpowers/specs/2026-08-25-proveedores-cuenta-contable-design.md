# Proveedores: catálogo de cuentas contables

Fecha: 2026-08-25  
Estado: aprobado para implementación (pendiente revisión final del usuario)

## Objetivo

Permitir asignar a cada proveedor un **número de cuenta contable interno** (solo dígitos), gestionado desde un **catálogo de cuentas** y vinculado 1:1 al proveedor en la pantalla de Proveedores.

## Decisiones de producto

| Tema | Decisión |
|------|----------|
| Tipo de cuenta | Código interno contable (no CLABE / cuenta bancaria) |
| Formato del número | Solo dígitos (`/^\d+$/`), string para conservar ceros a la izquierda |
| Obligatoriedad | Obligatoria al crear/editar proveedor |
| Unicidad del número | Único en el catálogo |
| Relación | 1:1 — una cuenta solo puede estar asignada a un proveedor |
| Dónde se crean las cuentas | Pantalla de catálogo (no “al vuelo” desde el formulario de proveedor) |
| Proveedores existentes | Pueden quedar sin cuenta hasta la próxima edición; al guardar se exige cuenta |
| Fuera de alcance | Asientos, transferencias, reportes financieros |

## Arquitectura de datos

### Tabla nueva `cuentas_contables`

| Columna | Tipo | Notas |
|---------|------|--------|
| `id` | UUID PK | |
| `numero` | STRING, NOT NULL, UNIQUE | Solo dígitos |
| `nombre` | STRING, NULL | Descripción corta opcional |
| `activa` | BOOLEAN, NOT NULL, default `true` | |
| `createdAt` / `updatedAt` | timestamps | |

### Tabla `proveedores`

Nuevo campo:

- `cuentaContableId` — UUID, FK a `cuentas_contables.id`, **nullable en BD** (compatibilidad con datos existentes)
- Índice único en `cuentaContableId` (donde no sea NULL) para reforzar 1:1 a nivel de BD

Validación de aplicación: create/update de proveedor **exigen** `cuentaContableId`.

### Relaciones

- `Proveedor` belongsTo `CuentaContable` (`as: "cuentaContable"`)
- `CuentaContable` hasOne `Proveedor` (opcional, para listados / validación)

## API

### Catálogo `/cuentas-contables`

Patrón similar a Nomenclaturas (`simpleCrudFactory` o controller dedicado con las mismas reglas).

| Método | Ruta | Notas |
|--------|------|--------|
| GET | `/cuentas-contables` | Lista; query opcional `q`, `disponibles=1` (activas sin proveedor, o la del `excludeProveedorId` si se pasa) |
| GET | `/cuentas-contables/:id` | Detalle |
| POST | `/cuentas-contables` | Crear |
| PATCH | `/cuentas-contables/:id` | Editar |
| DELETE | `/cuentas-contables/:id` | Eliminar solo si no está asignada |

Validaciones:

- `numero` obligatorio, solo dígitos, único
- `nombre` opcional (trim / null)
- Al eliminar con proveedor asignado → `400` con mensaje claro

Permisos: `cuentas_contables.view|create|edit|delete` (seed + constantes front/back, mismo patrón que nomenclaturas).

### Proveedores (extensión)

- Create/PATCH exigen `cuentaContableId`
- Validar: cuenta existe, `activa === true`, y no está usada por otro proveedor
- List/get incluyen `cuentaContable` (`id`, `numero`, `nombre`)

Errores de usuario:

- Número inválido o duplicado
- Cuenta ya asignada a otro proveedor
- Proveedor sin cuenta al guardar
- Intento de borrar cuenta en uso

## UI

### Pantalla nueva: Cuentas contables

- Ubicación: menú lateral cerca de Proveedores / catálogos
- CRUD: listar, crear, editar, desactivar o eliminar
- Campos de formulario: número (solo dígitos), nombre opcional, activa
- Estilo y patrones alineados a `Nomenclaturas.tsx`

### Proveedores (`Proveedores.tsx`)

- En crear/editar: selector obligatorio “Número de cuenta”
  - Opciones: cuentas activas libres + la cuenta actual al editar
- En tabla: columna con el número de cuenta (y nombre si cabe)
- Validación client-side: no guardar sin `cuentaContableId`

## Flujo

```text
1. Admin crea cuentas en Catálogo (número + nombre opcional)
2. Al crear/editar proveedor, elige una cuenta libre
3. Esa cuenta deja de aparecer como disponible para otros
4. Al cambiar la cuenta de un proveedor, la anterior vuelve a estar disponible (no se permite guardar sin cuenta)
```

## Migración y permisos

1. Migration: crear `cuentas_contables`
2. Migration: agregar `cuentaContableId` a `proveedores` + índice único parcial/nullable
3. Seed/migration de permisos nuevos y otorgarlos a roles admin existentes (mismo patrón del repo)
4. Front: permisos en `permissions.ts`, ruta, sidebar, página

## Pruebas manuales

- [ ] Crear cuenta con número solo dígitos
- [ ] Rechazar número con letras / duplicado
- [ ] Asignar cuenta a proveedor al crear
- [ ] No poder asignar la misma cuenta a un segundo proveedor
- [ ] Al editar proveedor, la cuenta actual sigue visible en el selector
- [ ] Cambiar de cuenta libera la anterior
- [ ] No eliminar cuenta asignada
- [ ] Listado de proveedores muestra el número de cuenta
- [ ] Proveedor legacy sin cuenta: listado OK; al editar exige asignar una
