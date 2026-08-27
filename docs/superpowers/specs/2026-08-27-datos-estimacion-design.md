# Datos Estimación (C1–C10) en estados de cuenta

Fecha: 2026-08-27  
Estado: aprobado para implementación

## Objetivo

En **Proyectos → lista → Gestionar → Agregar estimación**, agregar un módulo desplegable **Datos Estimación** debajo de **Agregar carátula**, con 10 campos de texto. Se capturan una sola vez por proyecto; las estimaciones siguientes se autorellenan en solo lectura. Se persisten en la tabla intermedia de estados de cuenta y se muestran en la sección **Estados de cuenta**.

## Decisiones

| Tema | Decisión |
|------|----------|
| Almacenamiento | Columnas nuevas en `proyecto_estimacion_estados_cuenta` (opción 1) |
| Edición | Solo lectura después de la primera captura (opción B) |
| Autorelleno | Al crear otra estimación, copiar desde la estimación más reciente del mismo proyecto que ya tenga datos |
| UI form | Collapsible debajo de carátula, cerrado por defecto |
| UI lectura | Collapsible en Estados de cuenta, debajo de Carátula y antes de los módulos de montos |
| Tipo de campos | Texto libre (`STRING`), no montos |

## Campos (C1–C10)

| Key | Label UI |
|-----|----------|
| `periodoContrato` | Periodo de Contrato |
| `registroPatronalImss` | No. De Registro Patronal IMSS |
| `periodoEjecucionTrabajos` | Periodo de ejecucion de los trabajos |
| `obra` | Obra |
| `campus` | Campus |
| `noSirgoc` | No. de SIRGOC |
| `proyectoNombreEstimacion` | Proyecto |
| `contratista` | Contratista |
| `rfc` | RFC |
| `domicilio` | Domicilio |

Nota: `proyectoNombreEstimacion` evita colisión con el nombre del proyecto de la entidad `Proyecto`.

## UI — formulario Agregar / Editar estimación

1. Debajo del bloque **Carátula**, un `Collapsible` titulado **Datos Estimación** (mismo patrón visual que los módulos de montos).
2. Grid de inputs de texto con los 10 labels.
3. **Primera captura** (ninguna estimación del proyecto tiene estos datos): campos editables.
4. **Estimaciones siguientes**: al abrir el formulario vacío (o al crear), se autorellenan con los valores existentes y quedan `disabled` (solo lectura).
5. **Editar estimación**: se muestran los valores guardados de esa fila; si el proyecto ya tenía datos de estimación, los campos también quedan solo lectura.

## Datos — `proyecto_estimacion_estados_cuenta`

Agregar 10 columnas:

| Columna | Tipo | Notas |
|---------|------|--------|
| `periodoContrato` | STRING | nullable |
| `registroPatronalImss` | STRING | nullable |
| `periodoEjecucionTrabajos` | STRING | nullable |
| `obra` | STRING | nullable |
| `campus` | STRING | nullable |
| `noSirgoc` | STRING | nullable |
| `proyectoNombreEstimacion` | STRING | nullable |
| `contratista` | STRING | nullable |
| `rfc` | STRING | nullable |
| `domicilio` | STRING | nullable |

Migración: solo `ADD COLUMN`. Filas existentes quedan en `null` hasta la primera captura.

Constantes: lista compartida (p. ej. `DATOS_ESTIMACION_FIELDS`) análoga a `ESTADO_CUENTA_FIELDS`.

## API

Base: `/proyectos/:proyectoId/estimaciones`  
Permisos: sin cambio.  
Contrato HTTP: campos planos en el JSON de `estimacion` (igual que los montos).

| Método | Comportamiento |
|--------|----------------|
| `GET /` y `GET /:id` | Incluyen los 10 campos (desde `estadoCuenta`, aplanados en `serializeEstimacion`) |
| `POST /` | Si el proyecto **no** tiene datos previos → guardar del body. Si **sí** tiene → ignorar body de estos campos y copiar de la estimación más reciente que los tenga |
| `PATCH /:id` | No permite modificar estos 10 campos si ya estaban llenos en esa fila (o si el proyecto ya tenía captura); mantener valores existentes |
| `DELETE` | Cascade existente |

Criterio “tiene datos”: al menos uno de los 10 campos no vacío en alguna fila `estadoCuenta` del proyecto.

## UI — Estados de cuenta

Por cada estimación desplegada:

1. Carátula (como hoy).
2. Collapsible **Datos Estimación** (cerrado por defecto): tabla Concepto | Valor; vacío → “—”.
3. Módulos de montos (como hoy).

Solo lectura; sin edición desde esta sección.

## Criterios de éxito

1. El módulo aparece debajo de carátula en Agregar/Editar estimación.
2. Primera captura: editable y persistida en BD.
3. Estimaciones siguientes: autorelleno + solo lectura en UI y backend.
4. Visible en **Estados de cuenta** por estimación.
5. `GET` de estimación incluye los 10 campos.
6. Intentos de cambiar datos ya capturados no alteran la BD.

## Fuera de alcance

- Exportación PDF/impresión.
- Validación de formato de RFC u otros formatos.
- Edición posterior desbloqueable por admin.
- Campos en la entidad `Proyecto` (no se duplican ahí).
