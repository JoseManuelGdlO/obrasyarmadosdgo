# Proveedores: cuentas bancarias múltiples

Fecha: 2026-08-26  
Estado: aprobado para implementación

## Objetivo

En el formulario **Agregar / Editar proveedor**, capturar una o más **cuentas bancarias**, cada una con banco, número de cuenta y CLABE.

## Decisiones de producto

| Tema | Decisión |
|------|----------|
| Campos por cuenta | Banco, número de cuenta, CLABE |
| Cantidad | Una o más |
| Obligatoriedad | Al menos una cuenta al crear/editar y guardar |
| Almacenamiento | JSON en `proveedores.cuentasBancarias` |
| CLABE | Solo dígitos, longitud 18 |
| Fuera de alcance | Catálogo de bancos, transferencias, validación bancaria externa |

## Datos

Campo nuevo en `proveedores`:

- `cuentasBancarias` — `JSON`, nullable en BD (legacy); en API create/update se exige arreglo no vacío

Forma de cada ítem:

```json
{ "banco": "BBVA", "numeroCuenta": "0123456789", "clabe": "012345678901234567" }
```

Validación (create y update cuando se envía el campo; create siempre; update exige al menos una si se persiste el proveedor desde UI):

- Filtrar filas vacías
- Tras filtrar: longitud ≥ 1
- Cada ítem: `banco`, `numeroCuenta`, `clabe` no vacíos (trim)
- `clabe`: `/^\d{18}$/`

## API

- Create/PATCH reciben `cuentasBancarias`
- List/get las devuelven
- Proveedores legacy sin cuentas: listado OK; al editar y guardar desde UI se exige al menos una

## UI

- Sección “Cuentas bancarias” con filas dinámicas (Banco | Número | CLABE)
- Botón “Agregar cuenta”; quitar fila (mínimo una fila en el formulario)
- Tabla de proveedores: primera cuenta (banco / CLABE) y `+N` si hay más
