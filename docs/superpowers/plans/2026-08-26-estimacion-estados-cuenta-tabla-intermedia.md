# Move estado de cuenta to intermediate table — Plan

> Implemented inline after approved spec.

**Goal:** Relocate 24 module montos to `proyecto_estimacion_estados_cuenta` 1:1; keep API flat for the front.

**Done:**
- [x] Spec
- [x] Migration create + copy + drop columns
- [x] Model + associations
- [x] Controller create/update/list/get serialize + upsert
- [x] Front unchanged
