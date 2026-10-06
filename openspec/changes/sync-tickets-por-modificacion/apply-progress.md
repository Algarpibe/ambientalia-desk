# apply-progress — sync-tickets-por-modificacion

Lotes 1 a 5 aplicados en un solo intento, en el worktree propio, base `9822bd7`.

## Rojo antes que verde (lotes 1-3)

`npx vitest run packages/zoho-sync/src/sync.modificados.test.ts` contra el `syncRecent` de hoy: `Tests 14 failed | 1 passed (15)`. La que nace
verde es la 5 (sin marca = camino de hoy); su rojo lo da la mutación M5. Tras el cambio: `Tests 15 passed (15)`.

## Mutaciones (rojo, restaurar, verde)

| Mutación | Prueba que se puso roja |
|---|---|
| M3 quitar `managed_by_app = false` | 3 |
| M4 quitar `id NOT LIKE $1` de la consulta de marca | 4 (el primer intento tocó por error la consulta de `syncPendingHistory`, la primera coincidencia del texto: no era la mutación pedida y se repitió con el contexto `tickets WHERE`) |
| M5 marca nula como fallo (con log) | 5 |
| M1 persistir la respuesta de búsqueda | 1 (también 11, 12, 13) |
| M2a quitar el solape | 2 (también 3, 4) |
| M2b `sortBy=-modifiedTime` | 2 |
| M6 quitar el bucle de páginas | 6 (también 9, 14) |
| M10a quitar la ordenación | 10 |
| M10b invertir la ordenación | 10 (también 11) |
| M10c quitar la deduplicación explícita | NINGUNA: mutante equivalente, `Map.set` ya deduplica por clave. La deduplicación queda cubierta por la estructura y por la prueba 10 (cuatro referencias, tres detalles) |
| M7 vacío como fallo | 7 |
| M8 quitar la caída | 8, 8b, 9 |
| M9 POSICIÓN: detalle dentro del bucle de paginación | 9 (también 6, 10, 11) |
| M11 aislar el `429` | 11 |
| M12 cortar ante cualquier fallo | 12 |
| M13 dejar salir la excepción de persistencia | 13 |
| M14 quitar el aviso del tope | 14 |

## Hipótesis del diseño comprobadas

pg-mem acepta `max(modified_time)` con `WHERE id NOT LIKE $1 AND managed_by_app = false`: no hizo falta la forma alternativa.

## Lote 4 y cierre

- `sync.test.ts`, `ovDiscrepanciaSync.test.ts`, `hubSync.test.ts` sin tocar: 3 ficheros, 20 pruebas verdes.
- `npm test`: 237 ficheros pasados, 2 omitidos; 3651 pruebas pasadas, 7 omitidas, 0 fallidas; salida 0.
- `npm run typecheck`: salida 0. `npm run lint -- --max-warnings 165`: salida 0, 0 errores, 165 avisos (ninguno en los ficheros nuevos).

## Colocación (regla de mutación 4)

`git diff 9822bd7 -U0 -- packages/zoho-sync/src/sync.ts`: un hunk en 174-176 (3 líneas por 3) y uno que añade 76 líneas tras la 358. Ninguna línea existente se movió.

Barrido de citas a `sync.ts` (`git grep`, sin `archive/`): sólo caen sobre 173-177 `ENTRADA.md:2048` (caso C, anclada a `9822bd7` y con qué la superó),
`proposal.md:15` y `:65` (caso B, ancladas a `9822bd7`) y `design.md:57` (caso B, anclada igual: cita la frase de ENTRADA). `F0-00_Baseline_as-built.md:121`
(`170-174`, ya anclada a `17ddfec`) no se toca. El resto de citas a `sync.ts` apunta a líneas que no se movieron. Segundo pase: `spec.md:743`, `spec.md:264-265`,
`ENTRADA.md:1270` y el comentario de `hubSync.test.ts:154` siguen ciertos (no afirman «página 1»). `DEPLOY.md`: una frase añadida al final (tarea 5.4).
