# Estimación: tres módulos de pago / anticipo / fondo

Fecha: 2026-08-26  
Estado: aprobado para implementación (pendiente revisión final del usuario)

## Objetivo

En **Proyectos → Gestionar → formulario de estimación**, agregar tres módulos desplegables adicionales (mismo patrón que **Estado de Cuenta del Contrato (Sin IVA)**) para capturar montos a mano por estimación.

## Decisiones de producto

| Tema | Decisión |
|------|----------|
| Comportamiento | Todos los campos editables a mano (sin cálculo automático) |
| Alcance | Por estimación |
| UI | Collapsibles cerrados por defecto, debajo del módulo de contrato |
| Prefijo | `$` fijo a la izquierda |
| Sub Total (pago) | Ambos labels en UI = “Sub Total”; columnas distintas en BD |
| Nota anticipo | Texto: `NOTA: SE AMORTIZA 5% MAS QUE EL AUTORIZADO` |
| Fondo campo 5 | Label tal cual: `Saldo Anticipo por Retener` |
| Tabla estimaciones | Sin columnas nuevas |

## Módulos y campos

### 1. Generación del pago

| Label UI | Columna |
|----------|---------|
| Deduccion | `pagoDeduccion` |
| Otras deducciones | `pagoOtrasDeducciones` |
| Esta Estimacion | `pagoEstaEstimacion` |
| Amortizacion del anticipo | `pagoAmortizacionAnticipo` |
| Sub Total | `pagoSubTotal1` |
| Retencion del Fondo Garantia | `pagoRetencionFondoGarantia` |
| Sub Total | `pagoSubTotal2` |
| I. V. A. 16% | `pagoIva16` |
| Total a pagar | `pagoTotalAPagar` |

### 2. Estado de Cuenta del Anticipo (Sin IVA)

Título del trigger incluye la nota:  
`Estado de Cuenta del Anticipo (Sin IVA) NOTA: SE AMORTIZA 5% MAS QUE EL AUTORIZADO`

| Label UI | Columna |
|----------|---------|
| Total del Anticipo N.-1 sin IVA | `anticipoTotalSinIva` |
| Acumulado a Estimacion anterior | `anticipoAcumuladoAnterior` |
| Esta Estimacion | `anticipoEstaEstimacion` |
| Acumulado a esta Estimacion | `anticipoAcumuladoEsta` |
| Saldo Anticipo por Amortizar | `anticipoSaldoPorAmortizar` |

### 3. Estado de Cuenta Fondo de Garantia 3% (Sin IVA)

| Label UI | Columna |
|----------|---------|
| Total de Retencion sin IVA | `fondoTotalRetencionSinIva` |
| Acumulado a Estimacion anterior | `fondoAcumuladoAnterior` |
| Esta Estimacion | `fondoEstaEstimacion` |
| Acumulado a esta Estimacion | `fondoAcumuladoEsta` |
| Saldo Anticipo por Retener | `fondoSaldoPorRetener` |

## Arquitectura de datos

### `proyecto_estimaciones`

19 columnas nuevas, todas `DECIMAL(15, 2)`, `allowNull: false`, `defaultValue: 0`:

`pagoDeduccion`, `pagoOtrasDeducciones`, `pagoEstaEstimacion`, `pagoAmortizacionAnticipo`, `pagoSubTotal1`, `pagoRetencionFondoGarantia`, `pagoSubTotal2`, `pagoIva16`, `pagoTotalAPagar`, `anticipoTotalSinIva`, `anticipoAcumuladoAnterior`, `anticipoEstaEstimacion`, `anticipoAcumuladoEsta`, `anticipoSaldoPorAmortizar`, `fondoTotalRetencionSinIva`, `fondoAcumuladoAnterior`, `fondoEstaEstimacion`, `fondoAcumuladoEsta`, `fondoSaldoPorRetener`.

Sin tablas aparte. Los 5 campos del módulo de contrato existentes no se modifican.

## API

Base: `/proyectos/:proyectoId/estimaciones`  
Permisos: sin cambio.

| Método | Comportamiento |
|--------|----------------|
| `GET /` y `GET /:id` | Incluyen los 19 campos |
| `POST /` | Acepta los 19 (default 0 si omitidos) |
| `PATCH /:id` | Actualiza los que vengan en el body |
| `DELETE /:id` | Sin lógica extra |

Validación: montos ≥ 0 vía el mismo helper `pickEstadoCuentaFromBody` / lista ampliada de campos (o helper equivalente compartido). Mensaje 400 si negativo.

## UI (`ProyectoDetalle`)

- Tres Collapsibles debajo de **Estado de Cuenta del Contrato (Sin IVA)**, antes de los botones Guardar/Agregar.
- Grid responsive 1 / 2 / 3 columnas; cada input con `$` prefijado.
- Valores default `0`; al editar se cargan desde la estimación.
- Viajan en el mismo FormData de create/update.

### Fuera de alcance

- Cálculos automáticos (IVA 16%, subtotales, 5%, 3%).
- Columnas en la tabla de estimaciones.
- PDF / impresión.
- Corrección ortográfica de la nota del anticipo (se guarda el texto solicitado).

## Archivos principales

**Backend:** migración nueva; `ProyectoEstimacion.js`; `proyectoEstimacionesController.js` (lista de campos).

**Frontend:** `front/src/pages/ProyectoDetalle.tsx` (tipos, form, FormData, 3 Collapsibles).

## Criterios de éxito

1. Los tres módulos se abren/cierran y muestran todos los labels con `$`.
2. Crear y editar estimación persiste y restaura los 19 valores.
3. Si no se tocan, quedan en `0` y el CRUD previo sigue igual.
4. La tabla de estimaciones no cambia de layout.
