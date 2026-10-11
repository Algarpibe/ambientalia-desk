# Apply: tiempo-en-tarjeta-remision-creada (F1B-07, un lote)

Commit de código y pruebas: `73123f4`. Partida del intento: `dc8c822`. Todas las casillas 1.1 a 4.6 hechas; 4.7 y 4.8 anotadas al final.

## Rojos vistos (strict_tdd)
- `npx vitest run packages/shared/src/tiempoEnEstado.test.ts` → `Failed to load url ./tiempoEnEstado ... Does the file exist?` (módulo inexistente, 0 pruebas).
- `npx vitest run apps/desk/server/listaRemisionCreada.test.ts` (antes del producto): 13 verdes, 5 rojas. RC-13 `expected [ [ 'c', undefined ], …(1) ] to deeply equal [ [ 'c', 9 ], [ 'f', 1 ] ]`; RC-14 `expected undefined to be 1`; RC-15 `expected { id: 's', … } to have property "diasHabilesEnEstado"`; RC-16 igual con `con`; RC-18 `expected [ +0, +0 ] to deeply equal [ 1, 1 ]`. RC-17 nació verde (caracteriza; su rojo es M6) y RC-1…RC-12 intactas (RC-11 verde).
- Verde: 27/27 en los dos ficheros. `.tsx`: sin rojo previo (F0-00).

## Mutaciones (sobre código verde; cada una restaurada desde copia fuera del repositorio)
Comando de todas: `npx vitest run apps/desk/server/listaRemisionCreada.test.ts packages/shared/src/tiempoEnEstado.test.ts`.

| M | Cambio | Pruebas rojas (mensaje) |
|---|---|---|
| M1 | `tiempoEnEstado.ts` `diasHabilesEntre(sumarDias(entrada, -1), …)` | T-1 `expected 1 to be +0`; T-2…T-6, T-9; RC-13 (`10`/`2`), RC-14, RC-15 |
| M2 | `listaRemisionCreada.ts:15` `new Set()` | RC-13 `[ 'c', 10 ]`; RC-18 `[ +0, +0 ]` |
| M2b | pura: `new Set<string>()` en lugar de `cierres` | T-5 `expected 3 to be 2`; RC-13 |
| M3a | UTC en la entrada | T-6 `expected +0 to be 1`; RC-14 `expected +0 to be 1` |
| M3b | UTC en `ahora` | T-6 `expected 2 to be 1` |
| M4 | `0` en vez de `null` | T-7 `expected +0 to be null`; RC-15; RC-16 |
| M5 | quitar el campo de la línea 16 | RC-13, RC-14, RC-15, RC-16 |
| M6a | campo en `routes/tickets.ts:115` | RC-17 `/api/tickets: … to not have property` |
| M6b | campo en `routes/prioridad.ts:85` | RC-17 `/api/mis-tickets: … to not have property` |
| M7 | `desde` y `hasta` invertidos | T-2…T-7, T-9; RC-13…RC-16 |
| M8 | cierres dentro del `map` (`Promise.all`) | RC-11 `expected 9 to be 6`; RC-18 `[ 3, 6 ]` |
| M9a-d | los cuatro textos | T-8, una aserción por texto (`'Menos de un día'`, `'1 día'`, `'2 días'`, `'Sin fecha'`) |
| M10a | `dias == null` | T-8 `expected 'Sin fecha de entrada' to be null` |
| M10b | `dias <= 1` | T-8 `expected 'Menos de 1 día hábil' to be '1 día hábil'` |

Supervivientes: ninguno. Tras todas: `git diff` sólo muestra la edición legítima; `tiempoEnEstado.ts` idéntico a la copia (`cmp`).

## Regla de mutación 3 (decisión del cliente → línea del servidor, verificadas en el árbol)
| Decisión en pantalla | Línea que la impone | Prueba |
|---|---|---|
| Qué número | `apps/desk/server/db/listaRemisionCreada.ts:16`; cuenta `packages/shared/src/calendarioLaboral.ts:196` | RC-13, RC-14 |
| Qué día es hábil | `packages/shared/src/calendarioLaboral.ts:139`; cierres `apps/desk/server/db/calendarioCierres.ts:31` | RC-13 |
| En qué vistas aparece | sólo `listaRemisionCreada.ts:16`; `routes/tickets.ts:115` y `routes/prioridad.ts:85` no lo componen | RC-17 |
| «Sin fecha de entrada» | `null` desde `listaRemisionCreada.ts:16` | RC-15 |
| Orden | `listaRemisionCreada.ts:16` (`ordenarPorEntrada`, `packages/shared/src/listaPorEntrada.ts:10`) | RC-1…RC-6 |
| Texto / color | función pura de `shared` / constante del `.tsx` | T-8 / manual |

`grep` de `diasHabilesEnEstado` y `textoTiempoEnEstado` en `apps/desk/src`: sólo `DistintivoTiempoEnEstado.tsx:1,5` y los tres usos de `TicketCard.tsx:103`, `TicketList.tsx:29`, `TicketTable.tsx:34`. El cliente no bloquea, no rellena, no avisa.

## Regla de mutación 4 (`wc -l`)
| Fichero | Antes | Después | Edición |
|---|---|---|---|
| `apps/desk/server/db/listaRemisionCreada.ts` | 17 | 17 | en sitio (6+6) |
| `packages/shared/src/types.ts` | 810 | 810 | en sitio (1+1) |
| `packages/shared/src/index.ts` | 41 | 42 | línea 42 al final |
| `TicketCard.tsx` / `TicketList.tsx` / `TicketTable.tsx` | 109 / 37 / 51 | 109 / 37 / 51 | en sitio (2+2 cada uno) |
| `apps/desk/server/listaRemisionCreada.test.ts` | 148 | 221 | línea 7 en sitio y bloque al final |

Barrido de citas: ninguna línea existente cambió de número, así que nada se reapunta. Comprobado: sin citas a `packages/shared/src/index.ts` por encima de la 41 ni a `listaRemisionCreada.test.ts` por encima de la 148 (los `index.ts:88` etc. son de `apps/desk/server/index.ts`). Las líneas 9 y 16 de `listaRemisionCreada.ts` cambian lo que dicen, no su sitio (D-6).

## Cierre
`npm test`: 267 ficheros pasan, 3 saltados; 4408 pruebas pasan, 11 saltadas; código 0. `npm run typecheck`: 0. `npx eslint . --max-warnings 165`: 0 errores, 165 avisos (ninguno nuevo); código 0.

## Desviaciones
- Ninguna de diseño. Hipótesis confirmadas: pg-mem devuelve la fila de cierres en la forma que `comoDiaCivil` normaliza; RC-17 se siembra con `UPDATE tickets SET derivado_a` sobre el usuario de la sesión; typecheck y lint pasan con las líneas largas.
- M2 se partió en dos (servidor, pura) porque T-5 sólo caza la segunda; M3 en dos mitades; M1 se probó con una importación de `sumarDias` duplicada por el `sed` (esbuild la toleró; el resultado rojo es válido).
- RC-13 pasa también `ahora` sólo por parámetro: la ruta usa el reloj real (D-2).
