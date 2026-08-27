# Evidencia de estimación en estados de cuenta (+ volumen Docker)

Fecha: 2026-08-27  
Estado: pendiente revisión del usuario

## Objetivo

Mover el archivo de carátula de la estimación desde la columna `proyecto_estimaciones.caratula` a un campo en la tabla intermedia de estados de cuenta, y montar un volumen Docker para `uploads/estimaciones` para que los archivos sobrevivan recreaciones del contenedor.

Los textos de UI se mantienen como **carátula** (mismo wording que hoy). El nombre técnico del campo es `evidenciaEstimacion`.

## Decisiones de producto

| Tema | Decisión |
|------|----------|
| Enfoque | Corte limpio: un solo lugar de verdad |
| Dónde vive la ruta | `proyecto_estimacion_estados_cuenta.evidenciaEstimacion` |
| Columna antigua | Eliminar `proyecto_estimaciones.caratula` tras migrar datos |
| Persistencia de archivo | Disco local + volume Docker (mismo patrón que máquinas) |
| UI copy | Seguir diciendo “carátula” / “Agregar carátula” |
| Posición UI | Igual que hoy (bloque superior del formulario de estimación) |
| Fotos extra | Sin cambio |
| BLOB / S3 | Fuera de alcance |

## Arquitectura de datos

### `proyecto_estimacion_estados_cuenta`

Nuevo campo nullable:

| Columna | Tipo | Notas |
|--------|------|--------|
| `evidenciaEstimacion` | `STRING(512)` | Ruta pública relativa, ej. `/uploads/estimaciones/<filename>` |

Relación 1:1 con la estimación (ya existente). Una evidencia por estimación.

### `proyecto_estimaciones`

- Quitar columna `caratula` después de migrar.
- Resto de campos sin cambio.

### Migración

1. Agregar `evidenciaEstimacion` a `proyecto_estimacion_estados_cuenta`.
2. Por cada estimación con `caratula` no nula: copiar el valor a la fila de estados de cuenta correspondiente (`estimacionId`). Si no existe fila de estados, crearla con montos en `0` y la ruta migrada.
3. Remover `proyecto_estimaciones.caratula`.

Down: reponer `caratula`, copiar de vuelta, quitar `evidenciaEstimacion`.

### Almacenamiento de archivos

- Disco: `uploads/estimaciones/` (multer existente).
- Formatos: JPG/PNG; máx. 2MB (sin cambio).
- Docker (`docker-compose` servicio `back`):
  - Env: `ESTIMACION_UPLOADS_DIR=/app/uploads/estimaciones`
  - Volume: `${ESTIMACION_UPLOADS_HOST_DIR:-./storage/estimaciones}:/app/uploads/estimaciones`
- Documentar `ESTIMACION_UPLOADS_HOST_DIR` en `.env.example`.

## API

Base: `/proyectos/:proyectoId/estimaciones`  
Permisos: sin cambio.

| Método | Comportamiento |
|--------|----------------|
| `GET /` y `GET /:id` | Incluyen `evidenciaEstimacion` aplanado desde `estadoCuenta` (como los montos). Ya no exponen `caratula`. |
| `POST /` | Multipart: archivo opcional field `evidenciaEstimacion`. Al crear la fila de estados de cuenta se guarda la ruta. |
| `PATCH /:id` | Archivo opcional `evidenciaEstimacion`; body `quitarEvidenciaEstimacion=true` pone la ruta en `null` y borra el archivo previo. |
| `DELETE /:id` | Cascade estados de cuenta; borrar archivos usando `evidenciaEstimacion` + fotos extra. |
| `DELETE` proyecto | Recolectar paths desde `estadoCuenta.evidenciaEstimacion` + fotos (actualizar `proyectosController.remove`). |

Validación de archivo: misma que hoy (MIME/tamaño vía middleware de estimaciones).

## Backend (archivos principales)

- Migración nueva (add field + copy + drop `caratula`)
- Modelo `ProyectoEstimacionEstadoCuenta.js` (+ quitar `caratula` de `ProyectoEstimacion.js`)
- `uploadEstimacionFiles.js`: field multer `evidenciaEstimacion` (reemplaza `caratula`)
- `proyectoEstimacionesController.js`: create/update/serialize/delete usan `evidenciaEstimacion` en estados de cuenta
- `proyectosController.js`: cleanup de uploads al borrar proyecto
- `docker-compose.yml` + `.env.example`

`serializeEstimacion` debe incluir `evidenciaEstimacion` (string \| null) y no incluir `caratula`.

## UI (`ProyectoDetalle`)

- Misma posición y flujo que la carátula actual.
- Labels visibles: **Agregar carátula**, **Carátula**, etc. (sin renombrar a “evidencia”).
- Estado/código: renombrar a `evidenciaEstimacion` / `quitarEvidenciaEstimacion` en tipos, FormData y lecturas.
- FormData: `evidenciaEstimacion` (file); `quitarEvidenciaEstimacion=true` al quitar.
- Lightbox y preview local: sin cambio de comportamiento.
- Detalle por estimación: mostrar el enlace/miniatura con wording de carátula, leyendo `evidenciaEstimacion`.

## Errores

- Archivo inválido/tamaño: rechazo del middleware; toast/mensaje existente.
- Fallo de red: toast de error; draft del formulario se conserva.
- Quitar evidencia: limpia ruta en BD y archivo en disco (best-effort delete como hoy).

## Criterios de éxito

1. Al crear/editar estimación con carátula, la ruta queda en `proyecto_estimacion_estados_cuenta.evidenciaEstimacion` y el archivo en disco.
2. `proyecto_estimaciones` ya no tiene columna `caratula`; datos previos migrados.
3. GET estimación expone `evidenciaEstimacion`; la UI de carátula funciona igual en textos y UX.
4. Con Docker, tras recrear el contenedor `back`, las imágenes de estimaciones siguen disponibles si el host dir del volume se mantiene.
5. Borrar estimación o proyecto elimina la evidencia en disco (best-effort) junto con fotos extra.
6. Fotos extra y módulos de montos no cambian de comportamiento.

## Fuera de alcance

- Guardar imagen como BLOB en MySQL
- Object storage (S3, etc.)
- Cambiar copy de UI a “Evidencia estimación”
- Cambios en fotos extra o en la tabla de estimaciones (columnas visibles)
