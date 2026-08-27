# Estimación: carátula y fotos extra

Fecha: 2026-08-25  
Estado: aprobado para implementación (pendiente revisión final del usuario)

## Objetivo

En **Proyectos → Gestionar → formulario de estimación**, permitir:

1. **Agregar carátula**: una fotografía principal guardada en un campo propio de la estimación.
2. **Agregar fotos** adicionales después, en el mismo formulario (solo con la estimación ya guardada).

La gestión de imágenes vive en el formulario de agregar/editar. Las miniaturas abren una **vista previa** ampliada (lightbox). La tabla de estimaciones no muestra ni gestiona fotos.

## Decisiones de producto

| Tema | Decisión |
|------|----------|
| Cantidad | Una carátula principal + fotos extra |
| Dónde gestionar | Solo en el formulario de estimación (`ProyectoDetalle`) |
| Al crear | Solo carátula (opcional) |
| Tras crear | El formulario pasa a modo edición de esa estimación para poder agregar fotos extra |
| Al editar | Reemplazar/quitar carátula; agregar/quitar fotos extra |
| Vista previa | Clic en miniatura (carátula o extra) abre lightbox/modal con la imagen ampliada; cerrar con X, clic fuera o Escape |
| Tabla | Sin gestión de fotos; sin galería en la fila |

## Arquitectura de datos

### `proyecto_estimaciones`

Nuevo campo nullable:

- `caratula` — `STRING`, ruta pública relativa (ej. `/uploads/estimaciones/<filename>`)

Campos existentes sin cambio: `numero`, fechas, montos, `factura`, `retencionAmortizacion`, etc.

### Tabla nueva `proyecto_estimacion_fotos`

| Columna | Tipo | Notas |
|---------|------|--------|
| `id` | UUID PK | |
| `estimacionId` | UUID FK → `proyecto_estimaciones.id` | `ON DELETE CASCADE` |
| `ruta` | STRING | Ruta pública relativa |
| `createdAt` / `updatedAt` | DATETIME | |

Una fila = una foto extra (no incluye la carátula).

### Almacenamiento de archivos

- Disco local, mismo patrón que máquinas/trabajadores (`multer` + `config/uploads.js`).
- Carpeta: `uploads/estimaciones/`.
- Servido como estático existente (`/uploads/...`).
- Formatos: JPG/PNG.
- Tamaño máx.: 2MB por archivo.
- Tope práctico de extras: 20 por estimación (configurable en código).

## API

Base: `/proyectos/:proyectoId/estimaciones`  
Permisos: ver con `PROYECTOS_VIEW`; mutaciones con `PROYECTOS_EDIT` (+ scope de proyecto existente).

| Método | Ruta | Comportamiento |
|--------|------|----------------|
| `GET /` y `GET /:id` | existentes | Incluyen `caratula` y arreglo `fotos: [{ id, ruta, ... }]` |
| `POST /` | existente, multipart | Campos actuales + archivo opcional `caratula` |
| `PATCH /:id` | existente, multipart | Campos + archivo opcional `caratula`; body `quitarCaratula=true` para limpiar |
| `POST /:id/fotos` | nuevo | Multipart; uno o más archivos `fotos` → filas en `proyecto_estimacion_fotos` |
| `DELETE /:id/fotos/:fotoId` | nuevo | Borra fila + archivo en disco |
| `DELETE /:id` | existente | Borra estimación, filas de fotos y archivos (carátula + extras) |

Respuestas de list/get deben incluir URLs utilizables por el front (rutas relativas como hoy; el cliente usa `toAbsoluteAssetUrl`).

## UI (`ProyectoDetalle`)

### Crear

- Botón **Agregar carátula** en el bloque del formulario.
- Selector de archivo → miniatura + acción quitar (antes de guardar).
- Clic en la miniatura abre **vista previa** (también con `blob:` local antes de guardar).
- Submit vía `FormData` (campos + archivo).
- Tras crear con éxito: formulario queda en **edición** de esa estimación (no se resetea a “nueva”).

### Editar

- Misma UI de carátula (cambiar / quitar).
- Sección **Agregar fotos** visible solo en edición.
- Miniaturas de extras con quitar (DELETE por foto).
- Clic en cualquier miniatura (carátula o extra) abre la misma vista previa ampliada.
- Guardar cambios de campos + carátula con PATCH.
- Fotos extra: upload/borrado **inmediato** vía endpoints dedicados al elegir archivo o al quitar (con feedback de error); no esperan al “Guardar” del formulario.

### Vista previa (lightbox)

- Overlay centrado con la imagen a tamaño cómodo (máx. viewport).
- Acciones: cerrar (botón, clic en fondo, Escape).
- No requiere navegación anterior/siguiente entre fotos en la primera versión (cada clic abre esa imagen).
- Reutilizar patrones de modal existentes del front si hay uno simple; si no, componente mínimo inline en `ProyectoDetalle` o modal compartido liviano.

### Fuera de alcance

- Galería completa con carrusel / zoom avanzado.
- Gestión de fotos desde la tabla de estimaciones.
- PDF u otros tipos de archivo.
- Cloud storage (S3, etc.).

## Errores y limpieza

- Tipo o tamaño inválido: rechazo con mensaje claro; no persiste ese archivo.
- Fallo a mitad de multi-upload: devolver error; no dejar filas huérfanas sin archivo (o limpiar lo parcial).
- Al reemplazar carátula: borrar archivo anterior del disco.
- Al quitar foto/carátula o borrar estimación: borrar archivo(s) del disco.

## Archivos principales a tocar

**Backend**

- Migración(es): columna `caratula` + tabla `proyecto_estimacion_fotos`
- Modelos: `ProyectoEstimacion`, nuevo `ProyectoEstimacionFoto`, asociaciones
- Middleware upload estimaciones (análogo a `uploadMaquinaFiles`)
- `proyectoEstimacionesController` + rutas

**Frontend**

- `front/src/pages/ProyectoDetalle.tsx` (formulario, FormData, estado post-create)
- Reutilizar helpers de `api.ts` (`FormData`, `toAbsoluteAssetUrl`) como en máquinas

## Criterios de éxito

1. Crear estimación con carátula opcional y ver la miniatura al quedar en modo edición.
2. En edición, agregar varias fotos extra y quitarlas individualmente.
3. Reemplazar o quitar carátula sin perder fotos extra.
4. Borrar estimación elimina archivos y registros asociados.
5. Sin carátula/fotos, el CRUD de estimaciones sigue igual que hoy.
6. Clic en miniatura (local o ya guardada) abre vista previa ampliada y se puede cerrar fácilmente.
