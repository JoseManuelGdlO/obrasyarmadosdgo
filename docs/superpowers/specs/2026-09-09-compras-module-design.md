# Módulo Compras (Gestión)

Fecha: 2026-09-09  
Estado: aprobado para implementación

## Objetivo

Agregar en **Gestión** (sidebar, debajo de Checklist Diario) el módulo **Compras** para:

1. Subir un `.xlsm` tipo *CONTROL DE COMPRAS* e importar la hoja **Historial_Compras** (upsert).
2. Gestionar **facturas** (PDF/imagen) asociadas a cada **orden de compra**.

## Decisiones

| Tema | Decisión |
|------|----------|
| Alcance import | Solo hoja `Historial_Compras` (opción B) |
| Modelo | Órdenes + partidas + facturas (opción 2) |
| Clave de orden | `(fecha, proyecto, proveedor)` |
| Upsert partidas | Coincidencia `(orden, índice, nombreProducto)`; actualizar existentes y agregar nuevas (opción C) |
| Facturas | Archivos PDF/JPG/PNG ligados a la **orden**, no a la partida |
| Proyecto / proveedor | Texto libre del Excel (sin FK obligatoria a `proyectos` / `proveedores` en v1) |
| Permisos | `compras.view`, `compras.import`, `compras.facturas` |

## Navegación y UI

- Sidebar **Gestión**: ítem **Compras** → `/compras` (debajo de Checklist Diario).
- Página `/compras`:
  - Botón **Nueva compra**: selector de `.xlsm` → importación.
  - Botón **Facturas**: navega a `/compras/facturas`.
  - Listado de órdenes: fecha, proyecto, proveedor, total, # partidas, # facturas.
  - Click en orden → detalle con partidas y facturas.
- `/compras/facturas`: listado orientado a adjuntar/ver facturas por orden (mismo dato, otra entrada).
- Estilo alineado al resto de la app (layout, tablas, toasts existentes).

## Modelo de datos

### `ordenes_compra`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | PK | |
| `fecha` | DATEONLY | Fecha de compra del Excel |
| `proyecto` | STRING | Texto del Excel (trim) |
| `proveedor` | STRING | Texto del Excel (trim) |
| `total` | DECIMAL | Suma de `importeTotal` de partidas |
| `archivoImportPath` | STRING null | Último xlsm que tocó esta orden (opcional auditoría) |
| timestamps | | |

Unique: `(fecha, proyecto, proveedor)`.

### `orden_compra_partidas`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | PK | |
| `ordenCompraId` | FK → ordenes_compra | CASCADE |
| `indice` | INTEGER null | Columna Índice del Excel |
| `cantidad` | DECIMAL | |
| `unidad` | STRING null | |
| `nombreProducto` | STRING | |
| `caracteristicas` | TEXT null | |
| `paraQueSeUsara` | TEXT null | |
| `precioUnitario` | DECIMAL | |
| `importeTotal` | DECIMAL | |
| timestamps | | |

Unique para upsert: `(ordenCompraId, indice, nombreProducto)`.

### `orden_compra_facturas`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | PK | |
| `ordenCompraId` | FK → ordenes_compra | CASCADE |
| `archivoPath` | STRING | Ruta pública relativa |
| `nombreOriginal` | STRING | |
| `mimeType` | STRING | |
| `uploadedBy` | FK usuario null | Quién subió |
| timestamps | | |

## Mapeo Excel → BD

Hoja: **Historial_Compras**, encabezados en fila 1:

| Columna Excel | Campo |
|---------------|--------|
| Fecha | `ordenes_compra.fecha` |
| Proyecto | `ordenes_compra.proyecto` |
| Proveedor | `ordenes_compra.proveedor` |
| Índice | `indice` |
| Cantidad | `cantidad` |
| Unidad | `unidad` |
| Nombre del Producto | `nombreProducto` |
| Características | `caracteristicas` |
| Para qué se usará | `paraQueSeUsara` |
| Precio Unitario | `precioUnitario` |
| Importe Total | `importeTotal` |

Filas vacías o sin producto/cantidad útil se omiten. Errores por fila se acumulan en la respuesta sin abortar el resto; archivo inválido o sin la hoja falla completo.

## Flujo de importación

1. `POST /api/compras/importar` (multipart, campo archivo `.xlsm`).
2. Validar extensión/MIME; guardar archivo en `uploads/compras/imports/`.
3. Parsear `Historial_Compras` (librería tipo ExcelJS / SheetJS en backend).
4. Por cada fila válida:
   - Normalizar strings (trim); fecha a DATEONLY.
   - Find-or-create orden por `(fecha, proyecto, proveedor)`.
   - Upsert partida por `(ordenCompraId, indice, nombreProducto)`.
5. Recalcular `total` de órdenes afectadas.
6. Respuesta: `{ creadas, actualizadas, ordenesAfectadas, errores[] }`.

## Facturas

- Upload: `POST /api/compras/:id/facturas` → `uploads/compras/facturas/`.
- Tipos: PDF, JPEG, PNG.
- Varias facturas por orden; ver/descargar/eliminar.
- Sin OCR ni metadatos de folio en v1.

## API

Auth requerida en todos los endpoints.

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/compras` | `compras.view` | Listar órdenes (filtros: proyecto, proveedor, fechaDesde, fechaHasta) |
| GET | `/compras/:id` | `compras.view` | Detalle + partidas + facturas |
| POST | `/compras/importar` | `compras.import` | Importar xlsm |
| POST | `/compras/:id/facturas` | `compras.facturas` | Subir factura |
| DELETE | `/compras/:id/facturas/:facturaId` | `compras.facturas` | Eliminar factura |

Permisos nuevos sembrados; roles admin reciben los tres.

## Almacenamiento de archivos

Mismo patrón que máquinas/estimaciones (`multer` + `config/uploads.js`):

- `uploads/compras/imports/` — xlsm importados
- `uploads/compras/facturas/` — PDFs/imágenes
- Servidos bajo `/uploads/compras/...`

## Fuera de alcance (v1)

- Importar hoja `Captura_Orden` o hojas por proyecto
- Edición manual de órdenes/partidas en UI
- Match automático a catálogo `Proyectos` / `Proveedores`
- OCR / captura de folio de factura
- Reemplazo total del historial (delete-all) al reimportar

## Criterios de éxito

- Ítem Compras visible en Gestión debajo de Checklist Diario.
- Subir el xlsm de referencia importa/actualiza órdenes y partidas desde `Historial_Compras`.
- Reimportar actualiza coincidencias y agrega nuevas sin borrar facturas de órdenes existentes.
- Se pueden adjuntar y eliminar facturas PDF/imagen por orden.
- Usuarios sin permiso no ven el módulo / reciben 403 en API.
