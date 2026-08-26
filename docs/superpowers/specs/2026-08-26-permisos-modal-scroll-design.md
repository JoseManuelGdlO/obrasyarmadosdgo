# Modal Configurar Permisos: scroll del cuerpo

Fecha: 2026-08-26  
Estado: aprobado para implementación (pendiente revisión final del usuario)

## Objetivo

En el modal **Configurar Permisos** / **Asignar Permisos**, poder recorrer todo el contenido (rol, permisos y proyectos) cuando no cabe en la pantalla, sin que el título ni los botones de acción desaparezcan.

## Decisiones de producto

| Tema | Decisión |
|------|----------|
| Dónde | Solo `PermisosModal` (usado en Gestión de Usuarios y Roles y Permisos) |
| Patrón | Igual que el modal de máquinas: columna, `max-h-[90vh]`, cuerpo con scroll |
| Título y X | Fijos arriba |
| Guardar / Cancelar | Fijos abajo, siempre visibles |
| Listas internas | Sin `max-h` ni scroll propio; crecen con el contenido |
| Comportamiento de datos | Sin cambios: mismos permisos, proyectos, búsqueda y guardado |

## Layout

`DialogContent` pasa a columna con altura máxima y `overflow-hidden` (ancho actual `sm:max-w-lg`). El `<form>` envuelve cuerpo y footer para que Guardar siga haciendo submit:

1. **Header fijo:** `DialogHeader` + título (y el cierre X ya existente).
2. **Cuerpo con scroll:** `flex-1 min-h-0 overflow-y-auto` — selector de rol, buscador, grupos de permisos y, si aplica, proyectos permitidos.
3. **Footer fijo:** botones Guardar permisos y Cancelar, fuera del área con scroll.

El padding actual del diálogo se conserva; no hace falta `p-0` como en máquinas.

## Listas internas

- Quitar `max-h-64` de la lista de permisos y `max-h-40` de la lista de proyectos.
- Conservar recuadros con borde para agrupar; no añadir barra de scroll interna.
- El buscador de permisos sigue filtrando módulo y clave; el vacío muestra el mensaje actual.
- **Proyectos permitidos** sigue condicionado a que el rol tenga algún permiso `proyectos.*`.

## Fuera de alcance

- Slider tipo `Slider` de Radix como control de scroll.
- Reordenar permisos o proyectos.
- Cambios de API, catálogo de permisos o persistencia.
- Scroll en otros modales.

## Casos límite

- Si el contenido cabe, no aparece scroll innecesario.
- El `Select` de rol sigue usando portal y no se recorta.
- Rueda, trackpad y barra nativa del cuerpo mueven el contenido; checkboxes y teclado no cambian.

## Archivos principales a tocar

- `front/src/components/modals/PermisosModal.tsx`

## Criterios de éxito

1. En una ventana baja (~900px de alto), título y botones se ven siempre; rol, permisos y proyectos se recorren en el centro.
2. En una ventana alta, si todo cabe, no hay scroll de más.
3. Buscar un permiso, marcar checkboxes y guardar sigue funcionando igual.
4. El mismo comportamiento en Gestión de Usuarios y en Roles y Permisos.
