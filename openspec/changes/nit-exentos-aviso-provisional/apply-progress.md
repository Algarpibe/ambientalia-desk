# Apply-progress: nit-exentos-aviso-provisional (F1B-19) — lote 1 · exentos

Estado: lote 1 CERRADO en casillas 1.1 a 3.3 (14/14). Quedan las 3.4 y 3.5 (las cierra el orquestador), el lote 2 y el lote 3.
Modo: strict TDD. Rojo anotado antes del verde; ninguna línea existente se movió.

## Qué se hizo
- `schema.sql`: once líneas al final (796 a 807) con el SQL exacto del diseño §1; la única fila sembrada es `222222222222`.
- `migrate.ts:73`: `'nit_exentos'` en `PUBLIC_TABLES`, dentro de línea.
- `packages/shared/src/nitExentos.ts` (nuevo, `esNitExento` sobre `nitCoincide`) y su export en `packages/shared/src/index.ts:28`, dentro de línea.
- `apps/desk/server/db/nitExentos.ts` (nuevo, `nitExentosActivos`).
- `ticketService.ts:6`, `:18` y `:96` dentro de línea; comentario de `altaManual.ts:155-156` reescrito sin mover líneas.
- Pruebas: `nitExentos.test.ts`, `nitExentosEsquema.test.ts` (nuevos), `describe` nuevo al final de `altaManual.test.ts`, y `migrate.test.ts` editado en sitio.

## Rojo → verde (pruebas impulsoras)
| Prueba | Rojo (motivo) | Verde |
|---|---|---|
| `nitExentos.test.ts` entero | módulo `./nitExentos` inexistente | sí |
| `nitExentosEsquema.test.ts` (4) | tabla y siembra inexistentes | sí |
| `altaManual.test.ts`: `201` sin formato y tres formatos, dos provisionales (S-2) | `409` (no había exención) | sí |
| `altaManual.test.ts`: fila inactiva, lista vacía | `relation public.nit_exentos does not exist` | sí |
| `altaManual.test.ts`: lectura con NIT exento / no exento | la lista no se leía | sí |
| `migrate.test.ts`: recuento 46 y las siete aserciones por distancia | 45 tablas; distancias al final | sí |
| `altaManual.test.ts`: posición (serial, A, C), `409` no exento, base más dígito sin guion, lectura sin cliente manual | nacen VERDES (guardas), como dice el diseño | verde |

## Mutaciones (todas restauradas; `git diff` sin restos)
| Id | Qué se mutó | Prueba que se puso roja | Restaurada |
|---|---|---|---|
| M1 | quitar `!esNitExento(…)` de `ticketService.ts:96` | las cuatro `201` con formato, S-2 y las dos de lectura | sí |
| M2 | exención antes de `validarContenidoAltaManual` (`ticketService.ts:91`) | posición «serial distinto» y posición «clientId», y las dos de lectura | sí |
| M3 | quitar `WHERE activo = true` | «fila inactiva: vuelve el 409» | sí |
| M4 | borrar la siembra de `schema.sql` | las `201`, lectura, las cuatro de `nitExentosEsquema.test.ts` y las de distancia de `migrate.test.ts` | sí |
| M5 | quitar `public.` del `CREATE` | «toda tabla del esquema está clasificada» y la de orden relativo de `nitExentosEsquema.test.ts` | sí |
| M6 | `some` por `every` | «con la lista vacía nadie es exento», «fila inactiva» y «lista vacía» | sí |
| M7 | quitar `'nit_exentos'` de `PUBLIC_TABLES` | «toda tabla del esquema está clasificada» y «son 46 tablas» | sí |
Ninguna sobrevivió. Nota de alcance de M2: la guarda de A (`exento sin correo`) no se mueve con esa mutación; la prueba de posición de A es una guarda.

## Desviaciones del diseño
1. Hallazgo nuevo (el diseño §4 trae dos, esto es un tercero): `migrate.test.ts:652` fija el número TOTAL de sentencias tras `idx_prioridad_ajustes`; se editó en sitio (`+ 2` y la frase de `nit_exentos`). El lote 2 tendrá que sumar `+ 1` ahí.
2. Los números de línea del diseño §4 coincidían con el fichero real (`:282-286`, `:794-882`); sin ajuste.
3. La prueba de posición de C usa `clientId` (como pide el diseño); la de la orden de venta ya asociada no es alcanzable con provisional (C `422` gana): ya la fija la prueba existente `un provisional con orden de venta ya usada`.
4. El arnés da error si se llama dos veces a `adminCookie()` en una prueba: el `describe` nuevo la pide una vez en su `beforeEach`.

## Medida y comprobaciones (lote 1)
`wc -l`: `ticketService.ts` 277, `altaManual.ts` 161, `migrate.ts` 131, `migrate.test.ts` 911, `packages/shared/src/index.ts` 40, `schema.sql` 807.
`npm run typecheck` código 0; `npm run lint` código 0 (0 errores, 165 avisos previos). `npm test`: 4291 pasan, 1 falla, 7 omitidas.
La que falla es `registro.test.ts` («en curso» son ONCE): da DOCE porque el proposal de esta tanda, ya commiteado, cuenta como en curso. No es de este lote.

## Para los lotes 2 y 3
Lote 2: tabla `provisional_books_avisados`, lecturas y servicio sin cablear; renumerar de nuevo las siete aserciones y `:652` (`+ 1`); cifras `[10, 34, 3]` y `47`.
Lote 3: pasada, `index.ts:15` y `:88`, `DEPLOY.md`, casos k y l. Decidir quién actualiza `registro.test.ts` («ONCE» a «DOCE») y la cita `altaManual.ts:156` de `openspec/config.yaml:4216`.
