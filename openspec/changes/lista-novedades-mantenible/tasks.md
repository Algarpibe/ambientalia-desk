# Tareas — lista-novedades-mantenible (F1B-04, `cierra: no`)

## Lote 1 · la regla compartida
- [x] 1.1 `puedeMantenerNovedades` en `packages/shared/src/mantenimientoNovedades.ts`: área Servicio Técnico y cargo Director Técnico; el admin pasa.
- [x] 1.2 `altaNovedadDelCuerpo` y `cambioNovedadDelCuerpo`: clave inmutable y con forma, etiqueta y orden válidos, «Sin novedad» intocable, unicidad aparte.

## Lote 2 · el servidor
- [x] 2.1 Escritura en `apps/desk/server/db/novedades.ts`: alta y cambio, sin borrar nunca.
- [x] 2.2 Rutas: lista entera, alta y cambio, con el orden 404 → 403 → 422 → 409.

## Lote 3 · la pantalla
- [ ] 3.1 Pantalla de mantenimiento (`.tsx`, fuera de la red de pruebas por F0-00).
- [ ] 3.2 Tabla de la regla 13, decisión a decisión, con la línea del servidor que impone cada una.
