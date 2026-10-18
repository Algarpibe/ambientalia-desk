# Progreso del apply — `anulado-con-motivo` (F1C-01, `cierra: si`) · lote 1 (intento 2)

Partida `594ca0b`, worktree `anulado-con-motivo`. Estado: **parcial** — código y vigilantes hechos; quedan tres pruebas en rojo por un
hallazgo de diseño (§ Hallazgos) y la válvula de 720 líneas superada (§ Medida).

## Rojo antes del verde

- `packages/shared/src/anulacion.test.ts` (37 casos): el fichero no cargaba (`./anulacion` no existía) — 37 de 37 sin poder correr.
- `apps/desk/server/anulacion.test.ts` (34 casos): 34 de 34 en rojo (`400` «Transición desconocida» en vez de `200`/`403`/`409`/`422`).
- Verde: 71 de 71 con D1-D5. La prueba de posición PA-1 (y sus dos réplicas en equipo nuevo y soporte remoto) llevan las dos guardas activas a la vez.
- Vigilantes: con el código verde cayeron 91 pruebas de la suite (90 por cifras/pares/áreas atadas a este cambio + la preexistente de
  `registro.test.ts`, que ya caía en la partida por la cabecera de este mismo cambio en `openspec/changes/`). Tras actualizar sólo las atadas: 4 en rojo (§ Hallazgos).

## Lo hecho

| Fichero | Qué | Líneas |
|---|---|---|
| `packages/shared/src/anulacion.ts` | nuevo (D1): constantes, `MOTIVOS_ANULACION`, `camposAnulacion`, `erroresAnulacion`, `esAnulado` | — → 59 |
| `packages/shared/src/index.ts` | export en la línea de `liberacionSinFactura` | 46 → 46 |
| `packages/shared/src/estados.ts` | `'Anulado': 'ninguna'` en la línea de `'Ticket creado'` (`:99`); comentarios `:88`, `:111`, `:142` (DOCE→DIEZ), `:145` (OCHO→SEIS), `:187` en sitio | 190 → 190 |
| `packages/shared/src/transitions.ts` | import en `:74`; `anulacion` en `:262`; `anulacion_equipo_nuevo` en `:362`; `anulacion_soporte` (2 líneas) antes del `]` final; docblocks `:347-348`, `:384-385` | 397 → 399 |
| `packages/shared/src/fasesBlueprint.ts` | `'Anulado': 'cierre'` en la línea de `Finalizado`; «los 21 estados» | 68 → 68 |
| `packages/shared/src/mapaBlueprint.ts` | comentario `e01..e21` | 242 → 242 |
| `apps/desk/server/transitionExec.ts` | `CLOSED_STATUSES` con `ESTADO_ANULADO` (`:5`) | 99 → 99 |
| `apps/desk/server/services/ticketService.ts` | `errAnulacion` en el único `422` (`:134`); import `:6`; «otras 43» (`:238`) | 277 → 277 |
| `openspec/config.yaml` | `cifras_ancladas` y `covers` de `transitions-st`, en sitio | 5137 → 5137 |
| `docs/artefactos/blueprint-*.md` | cinco regenerados (fase 1 sin cambios de contenido) | — |
| 18 pruebas vigilantes | cifras, pares, áreas y casos de D7, en sitio (`transicionesEjecucion` +4, `invariantesGrafo` +2, `transitionsSoporteRemoto` +2) | — |

`estados.ts` 190 → 190 y `transitions.ts` 397 → 399 (+2, las de la entrada de soporte remoto, que ocupa lo que sus vecinas).

## Cifras de los vigilantes (antes → después)

`ESTADOS` 23→24; `ESTADOS_SERVICIO` 20→21; `TRANSITIONS` 31→32; unión 41→44 (32+7+5); aristas del mapa 35→40; fases 4·11·5→4·11·6;
salida única 12→10 y derivación en espera 8→6 (`Anulado` da segunda salida a `En Espera de Repuestos` y `Servicio externo`);
matriz de área 93 (55/38)→96 (57/39); matriz EN 18→21 (14/7); matriz SR 12→15 (10/5); compuesta 93 (56/37)→96 (58/38);
barrido de cargo 837→864; `cargos.test.ts` 1815→1870; barrido de ejecución 33→38, EN 7→11, SR 4→6; S21 93→96; derivación por defecto 26→27 heredan.
Alcanzabilidad de RQ-TS-05: ninguna prueba la mide con las cifras 19/19/20 del delta; no hay discrepancia que reportar por ese lado.

## Mutaciones (D9), todas restauradas

| # | Resultado |
|---|---|
| M0 control | 71 de 71 en verde |
| M1 sin mirar las `options` | rojo: 9 (4 de shared, 5 de servidor) |
| M2 `required: false` | rojo: 6 (el motivo ausente, `camposAnulacion`, las tres transiciones) |
| M3 área `Servicio Técnico` (una por catálogo) | rojo: 5 / 4 / 6 (propias; la SR además cae en la matriz de `permisos.test.ts`) |
| M4 guarda del motivo antes del `403` | rojo: 3 (PA-1 y sus réplicas EN y SR) |
| M5 `Anulado` fuera de `CLOSED_STATUSES` | rojo: 3 (`status_type = 'Closed'` en los tres flujos). «Vistas» queda para el lote 2: `boardView` no tiene prueba de `Anulado` en este lote |
| M10 «Otro» sin detalle pasa | rojo: 7 |

Ninguna sobrevivió. `git status` sin restos.

## Hallazgos (no corregidos: son de diseño)

1. **`areasSiguientes` cuenta la anulación como salida.** Con `anulacion*` en los catálogos, `areasSiguientes('Verificación', EN)` pasa de
   `['Servicio Técnico']` a `['Servicio Técnico', 'Comercial']` (`packages/shared/src/transitions.ts:327-334`). `areasAAvisar` (`avisoArea.ts:15`) lo hereda:
   cada vez que Servicio Técnico deja un ticket de equipo nuevo en `Ingresado`, `En Proceso`, `Notificado` o `Verificación` —o uno de servicio en
   `En Espera de Repuestos` o `Servicio externo`— se crearía un aviso «le toca a tu área» a Comercial. Y `lineaTraspaso` (`traspaso.ts`) añade «, Comercial» al título.
   Tres pruebas en rojo que NO se tocaron: `avisoArea.test.ts` ×2 y `traspaso.test.ts` ×1. Salida natural, a decidir: que `areasSiguientes` ignore las
   transiciones a `Anulado`. Es un cambio de comportamiento, no de cifra.
2. `anulacion` (servicio) hereda la casilla «Derivado a» que `transitions.ts:297` añade a TODA transición de servicio; D3 decía «sin `derivacion()`». Las otras dos no la llevan.
3. `registro.test.ts` (11f/05g) cae también en la partida: cuenta F1C-01 como «en curso» por la cabecera de este cambio.

## Cierre del intento

Códigos: `npm test` 1 (4 en rojo de 4.882: las tres del hallazgo 1 y la preexistente; 287 ficheros en verde de 293), `npm run typecheck` 0,
`npm run lint` 0 (165 avisos, los de la partida).

## Medida del lote

`git diff --shortstat --no-renames 594ca0b`: 31 ficheros, 196 inserciones y 158 borrados (354); sin trackear: `anulacion.ts` 59, las dos pruebas 378
(437). Total 791, **por encima de la válvula de 720** (más este fichero y `tasks.md`). Pesa lo que la propuesta no contó: 18 ficheros vigilantes con ~320 líneas
tocadas, más 28 de los cinco mapas regenerados.

---

# Lote 2 (intento 3) · métricas e histórico (D6, D8)

Partida `490915f`. Estado: **hecho** (tasks 3.0 a 3.4). Queda 3.5 (commit y detector `--sha HEAD`) para el orquestador.

## Lo que hizo el orquestador entre los dos agentes (recogido)

- **S-8:** `areasSiguientes` ignora las transiciones a `Anulado` (`packages/shared/src/transitions.ts:330`); oráculos alineados en
  `packages/shared/src/reasignacion.test.ts` y `apps/desk/server/routes/reasignacion.test.ts`. Cierra el hallazgo 1 del lote 1
  (`avisoArea.test.ts` ×2 y `traspaso.test.ts` ×1 vuelven a verde sin tocarlos).
- `registro.test.ts` (11f/05g): de OCHO a NUEVE en curso (F1C-01), que es lo que cuenta la cabecera de este cambio.
- Las entradas que el agente anterior había insertado en `transicionesEjecucion.test.ts`, `invariantesGrafo.test.ts` y
  `transitionsSoporteRemoto.test.ts` se unieron en la línea de su vecina, porque desplazaban citas (regla de mutación 4).
- 3.0: `apps/desk/server/anulacion.test.ts` (pruebas HTTP del lote 1, su rojo consta arriba) y este fichero entran en este intento.

## Rojo antes del verde

| Prueba | Resultado antes del código | Naturaleza |
|---|---|---|
| `packages/shared/src/analisisAnulados.test.ts` (6 casos) | **6 de 6 en rojo** | finalizados+tendencia, tiempo, OTD, creados/activos, ficha (2 casos) |
| `apps/desk/src/lib/boardView.test.ts` (3 casos nuevos, al FINAL) | **0 en rojo, 3 en verde** | **caracterización**: las vistas leen `statusType`, que ya es `Closed`. Fijan el último escenario de RQ-TS-40 |
| `apps/desk/server/consultaCandidatosAnulado.test.ts` (5 casos) | **4 de 5 en rojo** (el `.sql` no existía) | el quinto («no escribe») pasa en vacío sin fichero; se vigila con M9 |

Matiz: del escenario «un anulado sigue contando como creado» (`creados` 1, `activos` 0) los dos asertos de la spec ya se cumplían
(caracterización); el caso cayó en rojo por los asertos que añadí (`finalizados` 0, tiempo y OTD `null`).

## Verde

| Fichero | Qué | Líneas |
|---|---|---|
| `packages/shared/src/analisis.ts` | `if (cerrado && !esAnulado(r.status) && inRange(fin, from, to))` en `:59`; el import ocupa la línea 2, que estaba en blanco | 95 → 95 |
| `packages/shared/src/cierreEnCifras.ts` | `resolucionPromedioMs` salta `esAnulado(t.status)` (S-5); el tipo gana `status: string`; el import va en la línea del import vecino | 69 → 69 |
| `packages/shared/src/cierreEnCifras.test.ts`, `ventanaResolucion.test.ts` | el ayudante `t` gana `status: 'Finalizado'` (el tipo ahora lo exige), en sitio | sin cambio |
| `packages/shared/src/analisisAnulados.test.ts`, `apps/desk/server/consultaCandidatosAnulado.test.ts` | nuevos | 48 · 37 |
| `docs/sdd/Consulta_Candidatos_Anulado_2026-10-18.sql` | nuevo, `BEGIN TRANSACTION READ ONLY … ROLLBACK`, lista número, fecha del Rechazo, fecha de llegada a Finalizado y origen | 64 |
| `apps/desk/src/lib/boardView.test.ts` | bloque nuevo AL FINAL | 174 → 190 |

`TicketLite` ya trae `status` (`apps/desk/server/db/directory.ts:23`; lo rellena `ticketsLite`), así que `conResolucion` compila sin tocarla.
**pg-mem NO ejecuta la consulta:** probado, rechaza `CROSS JOIN LATERAL` con `jsonb_array_elements(h.raw …)` («column h.raw does not exist») y `LEAST`.
Se queda el guardián de texto; la consulta real la ejecuta una persona en producción (P-1). Riesgo: su SQL no está probado por ejecución.

## Mutaciones (D9)

| # | Mutación | Resultado |
|---|---|---|
| M5 | `Anulado` fuera de `CLOSED_STATUSES` | rojo: 3 de `anulacion.test.ts` (los tres `status_type = 'Closed'`). **`boardView.test.ts` NO cae**: construye el ticket ya `Closed`, no ejecuta el servidor |
| M6 | quitar `!esAnulado(r.status)` de `analisis.ts:59` | rojo: 4 de 6 |
| M7 | la exclusión sólo en contador y tendencia; el tiempo cuenta al anulado | rojo: 2 (el del tiempo y el de creados/activos, por el aserto del tiempo) |
| M8 | la exclusión sólo en contador, tendencia y tiempo; el OTD cuenta al anulado | rojo: 2 (el del OTD y el de creados/activos) |
| S-5 | quitar la exclusión de `resolucionPromedioMs` | rojo: 2 |
| M9 | añadir `UPDATE desk.tickets SET status = status` al `.sql` | rojo: «no escribe» |
| M9b | `ROLLBACK` → `COMMIT` | rojo: «transacción de sólo lectura» |

M7 y M8 se escribieron como reemplazos de varias operaciones en `analisis.ts`, sin reescribir el bloque. Todas restauradas; `git status` sin restos.

## Códigos y bundle

`npm test` 0 (292 ficheros en verde, 3 omitidos; 4.885 pruebas, 11 omitidas), `npm run typecheck` 0, `npm run lint` 0 (165 avisos, 0 errores, `npx eslint . -f json`),
`npm run build` 0. Bundle en la rama: `index-BKKKYfFl.js` 417.636 B y `Analisis-C1JUTeT_.js` 8.822 B; en `dist/assets` de main: `index-BqihsiwC.js` 416.666 B y
`Analisis-CJVf3pT6.js` 8.822 B (la diferencia del `index` es de este cambio; el `dist` de main puede no ser el de su HEAD).

## Medida del intento

`git diff --shortstat --no-renames 490915f`: 5 ficheros, 23 inserciones y 7 borrados (30). Sin trackear: `anulacion.test.ts` 192, `analisisAnulados.test.ts` 48,
`consultaCandidatosAnulado.test.ts` 37, el `.sql` 64, este fichero (141). Total ≈ 512, por debajo de la válvula de 720.
