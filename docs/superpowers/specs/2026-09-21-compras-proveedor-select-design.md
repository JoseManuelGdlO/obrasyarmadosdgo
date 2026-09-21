# Compras: seleccionar proveedor desde catálogo

Fecha: 2026-09-21  
Estado: aprobado para implementación

## Objetivo

En el diálogo **Nueva compra** del módulo de Compras, reemplazar el campo de texto libre de proveedor por un desplegable (`Select`) con los proveedores ya guardados en el catálogo de Proveedores.

## Decisiones de producto

| Tema | Decisión |
|------|----------|
| UI | Desplegable tipo Empresa/Proyecto (un solo proveedor) |
| Fuente | Catálogo existente `GET /proveedores` |
| Si no está en catálogo | No se permite texto libre; hay que darlo de alta en Proveedores |
| Persistencia | Sin cambio de esquema: se sigue guardando `proveedor` como string (nombre) |
| Filtro de lista | Solo proveedores con estado **Activo** |
| Backend / migraciones | Fuera de alcance |

## Enfoque técnico

Solo frontend en `front/src/pages/Compras.tsx`:

1. Al abrir Nueva compra, consultar `/proveedores` (mismo patrón de `enabled` que clientes/proyectos: `proveedores.view` o permiso de importar compras).
2. Filtrar en cliente donde `estado === "activo"` (valor que devuelve la API).
3. Ordenar por nombre (la API ya ordena; reforzar en cliente si hace falta).
4. Reemplazar el `Input` de proveedor por `Select`; el valor seleccionado es el `nombre` del proveedor.
5. `resetNuevaForm` limpia el proveedor seleccionado.
6. Validación al guardar: exige proveedor no vacío (elegido de la lista).

El payload de create no cambia: `{ proveedor: string, ... }`.

## Permisos y errores

- Listar proveedores requiere `proveedores.view` en API (igual que hoy).
- Si la query falla o el usuario no tiene permiso: Select vacío + toast; no se puede completar la compra sin proveedor.
- Si no hay proveedores activos: placeholder que indique que no hay activos / dar de alta en Proveedores.

## Fuera de alcance

- Campo `proveedorId` / FK en `ordenes_compra`
- Alta de proveedor desde el diálogo de compra
- Cambios al import XLSM o a facturas
- Relajar permisos del endpoint de proveedores

## Prueba manual

1. Abrir Nueva compra con proveedores activos → aparecen en el Select.
2. Elegir uno, completar el resto y guardar → la fila muestra ese nombre.
3. Sin selección → no guarda (toast de validación).
4. Sin proveedores activos → placeholder de lista vacía.
