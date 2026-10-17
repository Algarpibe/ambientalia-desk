# apply-progress — `cifras-caducas-y-lectores-de-servicio` (F1B-09, `cierra: no`)

Modo: strict TDD. Rojo visto antes de cada verde. Sin commit ni push (la cadena de cierre la lleva el orquestador).

## Lote 1

**1.1 Rojo.** `npx vitest run packages/shared/src/comentariosVigilados.test.ts` → 5 fallidos de 5. Cifras medidas por el
propio caso (a): salida única = 12 (`Hay DOCE` ya acertaba), cruce con `en_espera` = 8. Mensajes:
- (a) `estados.ts debe decir «da OCHO,» (cruce con en_espera: 8)`
- (b) `el comentario sobre «Remisión creada» debe nombrar `remision_confirmada``
- (c) `ticketService.ts debe decir «en las otras 40 transiciones»`
- (d) `la línea «Campos:» debe nombrar `liberacion``
- (e) `el JSDoc de transitionsForStatus debe decir «sin llamador de producción»`

**1.2 Rojo por mutación del guardián de llamadores.** Desviación de orden: con (e) aún rojo por la mitad del JSDoc, la
mutación no podía distinguirse, así que se hizo DESPUÉS de 1.3 (con la base en verde). Se añadió `void transitionById('x')`
al final de `packages/shared/src/fechasDerivadas.ts` → (e) rojo: `expected [ Array(1) ] to deeply equal []`. Restaurado;
`git diff` de ese fichero vacío.

**1.3 Verde.** Seis sustituciones en sitio (estados.ts:83, :145; ticketService.ts:238; transitions.ts:348, :300, :67).
Líneas citadas verificadas: `transitions.ts:150` (`TRANSICION_REMISION_CONFIRMADA`), `:178` (`habilitar_servicio`), `:300`/`:301`/`:305`
(JSDoc, `transitionsForStatus`, `transitionById`), `:360` (campos de `liberacion`). Resultado: 5 de 5 en verde.

**1.4 Mutaciones del detector** (ensuciando el fichero vigilado, restaurado cada vez):
| Mutación | Caso en rojo |
|---|---|
| `estados.ts` «da OCHO» → «da SEIS» | (a) |
| `ticketService.ts` «otras 40» → «otras 43» | (c) |
| `transitions.ts` «Campos: ...liberacion...» → «Campos: sólo `comment()`» | (d) |

## Lote 2

2.1 Ocho frases en sitio (cinco punteros a `transitions-st`: remisiones:752, tickets-core:1753, zoho-sync:789,
derivacion-avisos:732, trazas:516; y transitions-st:1360, :1367, :1385) → 31. 2.2 `transicionesEjecucion.test.ts` :290, :292, :311 → seis.
(2.3 queda abierta: la cierra la cadena del orquestador.)

## `wc -l` antes → después (diseño D2: idénticos)
| Fichero | Antes | Después |
|---|---|---|
| packages/shared/src/estados.ts | 190 | 190 |
| apps/desk/server/services/ticketService.ts | 277 | 277 |
| packages/shared/src/transitions.ts | 397 | 397 |
| openspec/specs/remisiones/spec.md | 2183 | 2183 |
| openspec/specs/tickets-core/spec.md | 4200 | 4200 |
| openspec/specs/zoho-sync/spec.md | 1519 | 1519 |
| openspec/specs/derivacion-avisos/spec.md | 1172 | 1172 |
| openspec/specs/trazas/spec.md | 823 | 823 |
| openspec/specs/transitions-st/spec.md | 2573 | 2573 |
| apps/desk/server/transicionesEjecucion.test.ts | 453 | 453 |
| packages/shared/src/comentariosVigilados.test.ts (nuevo) | — | 92 |

## Códigos de salida
`npm test` 0 (282 ficheros pasan, 3 omitidos; 4769 pruebas) · `npm run typecheck` 0 · `npm run lint` 0 (0 errores, 165 avisos) ·
`npx tsx apps/desk/server/citas/cli.ts` 0.

## Medida
`git diff --shortstat --no-renames HEAD`: 10 ficheros, 17 inserciones, 17 borrados = 34; más `wc -l` del nuevo sin trackear = 92. Total 126.
