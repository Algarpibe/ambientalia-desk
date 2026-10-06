# Tareas — lista-novedades-mantenible (F1B-04, `cierra: no`)

## Lote 1 · la regla compartida
- [x] 1.1 `puedeMantenerNovedades` en `packages/shared/src/mantenimientoNovedades.ts`: área Servicio Técnico y cargo Director Técnico; el admin pasa.
- [x] 1.2 `altaNovedadDelCuerpo` y `cambioNovedadDelCuerpo`: clave inmutable y con forma, etiqueta y orden válidos, «Sin novedad» intocable, unicidad aparte.

## Lote 2 · el servidor
- [x] 2.1 Escritura en `apps/desk/server/db/novedades.ts`: alta y cambio, sin borrar nunca.
- [x] 2.2 Rutas: lista entera, alta y cambio, con el orden 404 → 403 → 422 → 409.

## Lote 3 · la pantalla
- [x] 3.1 Pantalla de mantenimiento (`.tsx`, fuera de la red de pruebas por F0-00).
- [x] 3.2 Tabla de la regla 13, decisión a decisión, con la línea del servidor que impone cada una.

## Regla 13 — las decisiones de `NovedadesPanel.tsx`, una a una

| Decisión del cliente | Qué hace | Línea del servidor que la impone | Caso |
|---|---|---|---|
| Enseñar los controles | Sólo si `puedeMantenerNovedades(user)`, consumido de `shared` | `apps/desk/server/routes/novedades.ts:27`, `:32`, `:43` (403) | Espejo legítimo: la imposición está probada (`apps/desk/server/novedadesMantenimiento.test.ts`) |
| Pedir la lista entera | Sólo con permiso; si no, ni la pide | `apps/desk/server/routes/novedades.ts:27` (403) | Comodidad |
| Ocultar «Retirar» en «Sin novedad» | No pinta el botón si `excluyeDemas` | `packages/shared/src/mantenimientoNovedades.ts:68` (422), aplicada en `apps/desk/server/routes/novedades.ts:45` | Espejo legítimo, probado |
| No ofrecer borrar | No hay botón | No existe ruta `DELETE`; la prueba «no hay DELETE» (`apps/desk/server/novedadesMantenimiento.test.ts:108`) lo fija | Sin decisión en el cliente |
| Validar el alta o el cambio | **No valida nada**: manda y enseña `erroresDelServidor` | `packages/shared/src/mantenimientoNovedades.ts:24` (clave), `:35` (orden), `:47` y `:78` (unicidad), devueltas en `apps/desk/server/routes/novedades.ts:34` y `:45` | La guarda es el servidor |
| Mandar sólo si cambió | Al salir del campo, compara con el valor cargado | Ninguna, y no hace falta: mandar el mismo valor es un cambio inocuo (la etiqueta propia no choca, `packages/shared/src/mantenimientoNovedades.ts:77`) | Comodidad pura |
