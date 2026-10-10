# Apply-progress: aviso-en-garantia (F1B-18) — lote 1

Modo: Strict TDD. Base del intento: `fdd9592`. Casillas hechas: 1.1-1.9, 2.1-2.6, 3.1-3.9 (lote 2 pendiente).

## Evidencia TDD

| Casilla | Prueba | Rojo | Verde |
|---|---|---|---|
| 1.1 | `registro.test.ts:218-220` | Con el `proposal.md` presente, 11f/05g ya devolvía DOCE con `F1B-18` (1 de 23 rojo). | Tras «DOCE» y `'F1B-18'`: 23/23. Las demás pruebas del fichero no cayeron |
| 1.2-1.3 | `garantia.test.ts` (G1-G9 + zona) | Módulo `./garantia` inexistente | 26/26 |
| 1.4-1.5 | `garantiaTickets.test.ts` (S1-S5 + sólo lectura) | Módulo `./garantiaTickets` inexistente | 10/10 |
| 1.6-1.7 | `garantiaListas.test.ts` (R1-R5, no escritura, fallo de lectura) | 8 caídas: R1, R2, R3 (x4), R4, R5 por marca ausente, más la de orden de la ruta de fallo (`normal.body.some(garantia)` falso). **Nota:** las pruebas «sin marca» (sin equipo; detalle con lectura rota) pasan ya en rojo por construcción; su detector es M10 | 12/12 |
| 1.8 | `equipos.test.ts` (al final) | 1 caída: `finGarantia` no devuelto. **Nota:** «ausente si NULL» pasa en rojo por construcción; su detector es la prueba de `YYYY-MM-DD` más la forma `...(fin ? {…} : {})` | 38/38 |
| 1.9 | las cuatro | `10 failed / 40 passed`: los dos módulos inexistentes, R1-R5, la ruta de fallo y `equipos.test.ts`, como se esperaba | — |
| 2.1-2.5 | `garantia.ts`, `index.ts`, `types.ts`, `garantiaTickets.ts`, `equipos.ts`, adjuntos | — | — |
| 2.6 | las cuatro + `misTickets.test.ts` + `busquedaConfrontacion.test.ts` + `registro.test.ts` | — | 7 ficheros, 133/133 verdes. VT09-9 sigue en una consulta fija |

Triangulación: fin vencido / igual / `sin_dato` en cinco formas; Date y cadena; dos zonas; cuatro productores. Sin refactor pendiente.

Prueba añadida por mutación (no estaba en tasks): «sin N+1» en `garantiaListas.test.ts` (3 vs 6 tickets con equipo propio). Motivo en M9.

## Work Unit Evidence

| Evidencia | Valor |
|---|---|
| Prueba enfocada | `npx vitest run packages/shared/src/garantia.test.ts apps/desk/server/db/garantiaTickets.test.ts apps/desk/server/garantiaListas.test.ts apps/desk/server/db/equipos.test.ts`: exit 0 |
| Ruta real | `garantiaListas.test.ts` pasa por `createApp` y pg-mem (cola, cerrados, detalle, remisión creada, mis tickets) |
| Rollback | revertir el commit del lote; el lote 2 (cliente) no depende de nada más |

## Mutaciones (M1-M10), cada una aplicada, corrida y RESTAURADA

| # | Mutación | Prueba | ¿Roja? | Restaurada |
|---|---|---|---|---|
| M1 | `<=` → `<` | `garantia.test.ts` | Sí: G1, G3, G7 y las dos de zona | Sí |
| M2 | `diaEnZona(creadoEn)` → `toISOString().slice(0,10)` | `garantia.test.ts` | Sí: G1, G7, tres de G8, las dos de zona | Sí |
| M3 | fin por `diaEnZona` en vez de `esFechaCalendarioReal` | `garantia.test.ts` | Sí: G6 | Sí |
| M4 | `fechaSolo` → `diaEnZona` en `garantiaTickets.ts` | `garantiaTickets.test.ts` | Sí: S1 y S5 | Sí |
| M5 | `fechaSolo` → `toISOString().slice(0,10)` | `garantiaTickets.test.ts` | Sí: S5. **Node SÍ aplica `TZ` en caliente en el worker de vitest**, así que NO es «no cazable» | Sí |
| M6 | invertir `sin_dato` / `vencida` | `garantia.test.ts` | Sí: 11 pruebas, entre ellas G4 y G5 | Sí |
| M7a | quitar el adjunto de `colaTaller.ts` | `garantiaListas.test.ts` | Sí: R1, R5 y la de fallo de lista | Sí |
| M7b | quitar el adjunto de cerrados | idem | Sí: R2 | Sí |
| M7c | quitar el adjunto del detalle | idem | Sí: R3 (x4) | Sí |
| M7d | quitar el adjunto de `listaRemisionCreada.ts` | idem | Sí: R4 | Sí |
| M8 | quitar `fin_garantia` del `SELECT` de `searchEquipos` | `equipos.test.ts` | Sí: la de `YYYY-MM-DD` | Sí |
| M9a | consulta por equipo dentro de `marcasDeGarantia` | `garantiaTickets.test.ts` | Sí: S3 | Sí |
| M9b | N+1 en `colaDelTaller` | `misTickets.test.ts` | **NO**: sus tickets no tienen `equipo_id`, `marcasDeGarantia` no consulta y el bucle no cuesta nada. **Desvío:** se añadió la prueba «sin N+1» a `garantiaListas.test.ts` | Sí |
| M9b | idem | `garantiaListas.test.ts` (prueba nueva) | Sí | Sí |
| M10 | `marcasDeGarantia` propaga el error | `garantiaTickets.test.ts` + `garantiaListas.test.ts` | Sí: S4 y las dos de la ruta de fallo | Sí |

Reglas de mutación 1 y 2: no aplican (sin guarda nueva ni fichero de datos vigilado).

## Regla de mutación 3 (líneas reales tras editar)

| Decisión del cliente (lote 2) | Línea del servidor |
|---|---|
| Distintivo, cola y mis tickets | `colaTaller.ts:23-24` (cálculo y adjunto) |
| Distintivo, cerrados | `routes/tickets.ts:110` |
| Distintivo, detalle | `routes/tickets.ts:143-144` |
| Distintivo, remisión creada | `listaRemisionCreada.ts:15-16` |
| Fin de garantía para el aviso del alta | `equipos.ts:66` (`SELECT`) y `:42` (`toLite`) |
| Aviso de `CreateTicket`, resaltado en Notificado | Ninguna, a propósito: avisan |
| No pintar con vencida o sin equipo | El servidor manda `vencida` o no manda nada |

## Cierre

- 3.3 `wc -l`: `types.ts` 810/810, `equipos.ts` 420/420, `colaTaller.ts` 25/25, `routes/tickets.ts` 223/223, `listaRemisionCreada.ts` 17/17; `index.ts` 40 → 41.
- 3.4 Barrido: 932 citas `…ts:NN` de los seis nombres, sin excluir `archive/`. Filtradas a las que tocan una línea editada (37, 362; 42, 66; 5, 23, 24; 9, 110, 143, 144; 5, 15, 16; `index.ts` de `shared` ≥ 41): 112 menos las de `routes/equipos.ts` (otro fichero) y las de `index.ts` del servidor (otro fichero): 61 fuera del propio cambio, ninguna a `packages/shared/src/index.ts`. Como las ediciones son DENTRO de línea y ningún fichero cambió de longitud, ninguna cita se desplazó; se leyó qué afirma cada una: `routes/tickets.ts:104-116`/`:105-114`/`:110`/`:9`/`:143`/`:144` (el manejador, `total`, el import, la llamada a `rowToTicketDetail`), `colaTaller.ts:22-24`/`:21-25`/`:24` (marca de tablero, `colaDelTaller`), `listaRemisionCreada.ts:13-16`/`:15`/`:16` (activos, entradas, orden), `equipos.ts` en sus líneas 42, 59 a 75, 66 y 78, más el rango de `toLite` de la exploración del 2026-09-10 (`toLite`, `searchEquipos`, `getEquipo`), `types.ts:37`/`:4-38`. Todas siguen verdaderas: **caso A** (presentes y ciertas hoy) las de `openspec/specs/`; **caso B** (históricas, con su revisión dentro del paquete fechado) las de `archive/` y `docs/sdd/Paquete_*`, que afirman algo cierto de su momento y hoy lo siguen siendo. Ninguna caso C. Ninguna renumerada. Límite honesto: el pase de abreviadas (`` `:NN` `` sin fichero) dio ~250 formas en 251 ficheros que nombran estos módulos y casi todas son de OTROS (`ticketService`, `remision`, `estados`); se leyeron las que van pegadas a una cita completa de estos módulos (`:115`, `:78`, `:67`), no las demás, y el detector no las bloquea.
- 3.5 `npm test`: exit **0** (265 ficheros, 4.378 pruebas).
- 3.6 `npm run typecheck`: exit **0**.
- 3.7 `npm run lint -- --max-warnings 165`: exit **0**, 165 avisos. La primera pasada dio exit 1 con 173: ocho `any` eran míos en `garantiaListas.test.ts`; los quité con un tipo `Fila`.
- 3.8 detector `--sha HEAD`: la primera pasada dio exit **1** con UN bloqueante, mío: una cita ambigua en este mismo fichero (la forma completa del rango de `toLite`, rota en sus dos candidatas); reescrita en prosa. Segunda pasada tras el `amend`: exit **0** (ver el informe del lote).
