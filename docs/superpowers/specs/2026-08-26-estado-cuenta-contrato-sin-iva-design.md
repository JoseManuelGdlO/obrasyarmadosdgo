# Estado de Cuenta del Contrato (Sin IVA)

Fecha: 2026-08-26  
Estado: aprobado para implementación (pendiente revisión final del usuario)

## Objetivo

En **Proyectos → Gestionar → formulario de estimación**, agregar un módulo desplegable para capturar a mano el estado de cuenta del contrato sin IVA, por cada estimación.

## Decisiones de producto

| Tema | Decisión |
|------|----------|
| Comportamiento de campos | Todos editables a mano (sin cálculo automático) |
| Alcance de datos | Por estimación (no por proyecto) |
| Dónde gestionar | Collapsible dentro del formulario Agregar / Editar estimación (`ProyectoDetalle`) |
| Persistencia | Columnas en `proyecto_estimaciones`; se guardan con create/update de la estimación |
| Prefijo UI | Signo `$` fijo a la izquierda de cada input |
| Estado inicial del módulo | Cerrado por defecto |
| Tabla de estimaciones | Sin columnas nuevas para estos montos |

## Campos

| Label UI | Columna BD |
|----------|------------|
| Contrato Principal sin IVA | `contratoPrincipalSinIva` |
| Acumulado Estimación Anterior | `acumuladoEstimacionAnterior` |
| Esta Estimación | `estaEstimacion` |
| Estimado a la Fecha | `estimadoALaFecha` |
| Saldo por Estimar | `saldoPorEstimar` |

## Arquitectura de datos

### `proyecto_estimaciones`

Cinco columnas nuevas:

| Columna | Tipo | Notas |
|---------|------|--------|
| `contratoPrincipalSinIva` | `DECIMAL(15, 2)` | `allowNull: false`, `defaultValue: 0` |
| `acumuladoEstimacionAnterior` | `DECIMAL(15, 2)` | idem |
| `estaEstimacion` | `DECIMAL(15, 2)` | idem |
| `estimadoALaFecha` | `DECIMAL(15, 2)` | idem |
| `saldoPorEstimar` | `DECIMAL(15, 2)` | idem |

Campos existentes sin cambio: `numero`, fechas, `montoEstimacion`, `factura`, `retencionAmortizacion`, `caratula`, fotos, etc.

No hay tabla aparte ni relación 1:1.

## API

Base: `/proyectos/:proyectoId/estimaciones`  
Permisos: sin cambio (`PROYECTOS_VIEW` / `PROYECTOS_EDIT` + scope existente).

| Método | Comportamiento |
|--------|----------------|
| `GET /` y `GET /:id` | Incluyen los 5 campos |
| `POST /` | Acepta los 5 campos (JSON o multipart FormData, mismo canal que hoy) |
| `PATCH /:id` | Actualiza los 5 campos si vienen en el body |
| `DELETE /:id` | Sin lógica extra (columnas van con la fila) |

Validación: montos numéricos ≥ 0; se normalizan con el helper decimal existente (`toDecimal`). Default `0` si omitidos al crear.

## UI (`ProyectoDetalle`)

### Módulo desplegable

- Componente: `Collapsible` ya disponible en el design system.
- Título del trigger: **Estado de Cuenta del Contrato (Sin IVA)**.
- Ubicación: dentro de la card del formulario de estimación, debajo de los campos actuales (fechas, montos, factura, carátula/fotos).
- Contenido al abrir: grid responsive (1 columna en móvil; 2–3 en desktop) con los 5 campos.
- Cada campo: `Label` + input numérico con `$` prefijado a la izquierda (mismo patrón visual de pesos).
- Valores por defecto al crear: `0`.
- Al editar: se cargan desde la estimación seleccionada.
- Submit: mismos botones Crear / Guardar; los 5 valores viajan en el mismo request.

### Fuera de alcance

- Cálculo automático entre campos (p. ej. estimado a la fecha = acumulado + esta).
- Columnas nuevas en la tabla de estimaciones.
- Manejo de IVA / estado de cuenta con IVA.
- PDF / impresión del estado de cuenta.
- Convertir otras secciones de `ProyectoDetalle` en módulos desplegables.

## Errores

- Valor inválido o negativo: rechazo en backend con mensaje claro; el formulario conserva lo escrito.
- Fallo de red/API: toast de error existente; sin pérdida local del draft del formulario.

## Archivos principales a tocar

**Backend**

- Migración: agregar las 5 columnas a `proyecto_estimaciones`
- Modelo: `ProyectoEstimacion.js`
- Controller: `proyectoEstimacionesController.js` (create/update + respuesta)

**Frontend**

- `front/src/pages/ProyectoDetalle.tsx` (tipos, form state, Collapsible, FormData/payload, mapeo edit)

## Criterios de éxito

1. En el formulario de estimación, el módulo desplegable muestra los 5 labels y permite capturar montos con `$`.
2. Al crear una estimación, los valores se persisten y vuelven al editarla.
3. Al editar y guardar, los 5 montos se actualizan correctamente.
4. Si no se toca el módulo, los campos quedan en `0` y el CRUD actual sigue funcionando.
5. La tabla de estimaciones no cambia su layout por esta feature.
