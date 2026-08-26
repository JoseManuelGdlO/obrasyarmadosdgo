# Estimación: tabla intermedia de estados de cuenta

Fecha: 2026-08-26  
Estado: aprobado para implementación

## Objetivo

Mover los 24 montos de los 4 módulos desplegables desde columnas de `proyecto_estimaciones` a una tabla intermedia 1:1, sin cambiar la UI ni el contrato HTTP del front.

## Decisiones

| Tema | Decisión |
|------|----------|
| Estructura | Una tabla `proyecto_estimacion_estados_cuenta` (1:1) |
| Columnas en estimaciones | Eliminar las 24 columnas de montos manuales |
| API | Mismo payload plano (los 24 campos en el JSON de estimación) |
| UI | Sin cambios |
| Borrado | `ON DELETE CASCADE` desde la estimación |

## Tabla `proyecto_estimacion_estados_cuenta`

| Columna | Tipo | Notas |
|---------|------|--------|
| `id` | UUID PK | |
| `estimacionId` | UUID | FK UNIQUE → `proyecto_estimaciones.id`, CASCADE |
| 24 montos | `DECIMAL(15,2)` | mismos nombres; default 0; not null |
| `createdAt` / `updatedAt` | DATETIME | |

Montos: `contratoPrincipalSinIva`, `acumuladoEstimacionAnterior`, `estaEstimacion`, `estimadoALaFecha`, `saldoPorEstimar`, `pagoDeduccion`, `pagoOtrasDeducciones`, `pagoEstaEstimacion`, `pagoAmortizacionAnticipo`, `pagoSubTotal1`, `pagoRetencionFondoGarantia`, `pagoSubTotal2`, `pagoIva16`, `pagoTotalAPagar`, `anticipoTotalSinIva`, `anticipoAcumuladoAnterior`, `anticipoEstaEstimacion`, `anticipoAcumuladoEsta`, `anticipoSaldoPorAmortizar`, `fondoTotalRetencionSinIva`, `fondoAcumuladoAnterior`, `fondoEstaEstimacion`, `fondoAcumuladoEsta`, `fondoSaldoPorRetener`.

## Migración

1. Crear tabla.
2. Insertar una fila por estimación existente copiando columnas actuales (o 0).
3. Remover las 24 columnas de `proyecto_estimaciones`.

## API / backend

- Modelo `ProyectoEstimacionEstadoCuenta` + asociación `hasOne` / `belongsTo`.
- List/get: include + aplanar montos en el objeto `estimacion` (o setear en JSON de respuesta).
- Create: crear estimación + fila de estados con los montos del body.
- Update: upsert de la fila intermedia.
- Delete: cascade.

Validación ≥ 0 se mantiene.

## Frontend

Sin cambios de UI/FormData (sigue enviando los 24 keys en el body).

## Criterios de éxito

1. Tras migrar, GET estimación incluye los 24 montos (datos migrados o 0).
2. Crear/editar sigue persistiendo los módulos.
3. `proyecto_estimaciones` ya no tiene esas 24 columnas.
4. UI de los 4 collapsibles funciona igual.
