# Información Estimación en estados de cuenta

Fecha: 2026-09-09  
Estado: aprobado para implementación

## Objetivo

En **Proyectos → Gestionar → Agregar/Editar estimación**, agregar un módulo desplegable **Información Estimación** debajo de **Carátula** y antes de **Datos Estimación**, con 3 campos obligatorios por estimación. Visible también en **Estados de cuenta**.

## Decisiones

| Tema | Decisión |
|------|----------|
| Almacenamiento | Columnas en `proyecto_estimacion_estados_cuenta` |
| Alcance | Por estimación; siempre editables en create/update |
| Campos existentes | Independientes de `numero` y `fechaEstimacion` |
| Obligatoriedad | Requeridos al guardar (create y update) |
| UI form | Collapsible debajo de carátula, cerrado por defecto |
| UI lectura | Collapsible en Estados de cuenta, debajo de carátula |

## Campos

| Key | Label UI | Tipo | Validación |
|-----|----------|------|------------|
| `infoEstimacionNo` | Estimación No. | STRING(120) | Obligatorio; alfanumérico (letras, números, espacios, `-`, `.`, `/`) |
| `infoOrdenCompraNo` | Orden de Compra No. | STRING(40) | Obligatorio; solo dígitos |
| `infoFecha` | Fecha | DATEONLY | Obligatorio; formato `YYYY-MM-DD` |

## API

Base: `/proyectos/:proyectoId/estimaciones`  
GET incluye los 3 campos aplanados. POST/PATCH validan y persisten en estados de cuenta.

## Criterios de éxito

1. Módulo visible debajo de carátula en formulario.
2. Los 3 campos son obligatorios al crear/editar.
3. Se muestran en Estados de cuenta por estimación.
4. Filas existentes pueden editarse para completar los campos.
