# apply-progress: tres-transiciones-cifra-anclada (F1C-09, cierra: si)

Modo: strict TDD, `npm test` (vitest run). Partida `fd253aa`. Lote A (1.1-4.2) en `ad1aaa0`; lote B (5.1-10.4) abajo. Las tareas de persona (P-1, recuento, ejecutar el script, verificación en la app) NO están hechas y archivar no las da por hechas.

## Lote A

### Rojo (1.10) — `npx vitest run` antes de tocar `transitions.ts`: 30 rojos, 2379 verdes (+8 pruebas nuevas)

| Fichero | Rojo natural |
|---|---|
| `cifrasAncladas.test.ts` (nuevo) | 3: «expected 34 to be 31», «21 to be 20», «38 to be 35» (el registro y el código decían aún 34/21/38) |
| `invariantesGrafo.test.ts` | invariante 2 (31/20), unión 41, solo-SR con `Pendiente`, y 3 casos nuevos (ids retiradas, `diagnostico_complementario.from`, `Pendiente` fuera de servicio) |
| `estados.test.ts` | recuento 20 y lista solo-SR de dos |
| `mapaBlueprint.test.ts` | 35 aristas y el caso nuevo «ninguna arista toca Pendiente» |
| `fasesBlueprint.test.ts` | 4·11·5 y «Pendiente ya no tiene fase» |
| `reentrancia.test.ts` | C2 de ocho estados (2) |
| `prioridad.test.ts`, `cargos.test.ts`, `transitionsSoporteRemoto.test.ts` | 31 transiciones; 1.700 casos; 41 ids |
| `permisos.test.ts`, `cargoPermiso.test.ts`, `flujoSoporteRemoto.test.ts` | 93 = 54/39 y 55/38, 744 casos, 41 en P8 |
| `transicionesEjecucion.test.ts` | huérfanas, extremos contra el grafo, barrido 31 y el 400 nuevo de las tres ids retiradas |

Sin rojo, y es correcto: `fechasDerivadas.test.ts:82` (sólo mensaje), `flujos.test.ts` y P5 reapuntados a `diagnostico_complementario` (la guarda de flujo dispara con cualquier id de servicio; su rojo se prueba en 3.6).

### Verde (Fase 2) y TDD

| Tarea | Prueba | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|
| 1.1/2.5 | `cifrasAncladas.test.ts` | escrita, 3 rojos | `config.yaml` 31/35/20 | 3 cifras + 3 mutaciones | no aplica |
| 1.2-1.9/2.1-2.3 | 15 ficheros de prueba | 27 rojos previos | `transitions.ts`, `estados.ts`, `fasesBlueprint.ts` | por id y por recuento | sólo datos y comentarios |
| 2.4 | anti-desfase | rojo en `mapaBlueprint.test.ts` | `npm run generar-mapa-blueprint`: sólo quita `e21` y mueve una arista a `e15 --> e16` | n/a | n/a |

Suite completa tras el verde: 169 ficheros, 2409 verdes, 2 saltadas. Typecheck limpio. Lint 165 avisos, 0 errores (techo 165, sin nuevos). Build correcto.

### Mutaciones (3.1-3.6), todas revertidas

| # | Mutación | Rojo observado |
|---|---|---|
| 3.1 | reponer `marcar_pendiente` en `transitions.ts:206-207` | 9: invariantes 1 y 2, unión, solo-SR, ids retiradas, huérfanas, extremos, barrido y el 400 |
| 3.2 | `diagnostico_complementario.from` vuelve a `['Pendiente']` | 28: invariante 1, `CASOS` contra el grafo, reentrancia, bodegaje, mapa |
| 3.3 | quitar `'Pendiente'` de `estados.ts:182` | 24: `tsc` en `fasesBlueprint.ts:68`, invariante 1, `estados.test.ts`, mapa |
| 3.4 | `maestro` a `"34"`, `"38"`, `"21"` una por una | 1 rojo cada una, en `cifrasAncladas.test.ts` («expected 34 to be 31» y análogas) |
| 3.5 | reponer `e15 --> e21 : Marcar como pendiente [ST]` en `blueprint-completo.md`; reponer la clave `Pendiente` en `fasesBlueprint.ts` | anti-desfase rojo; `tsc` TS2353 en `fasesBlueprint.ts:57` |
| 3.6 | quitar `exigirMismoFlujo` de `ticketService.ts:125` | P5 reapuntado da 200 (rojo) y P6 rojo: la posición flujo/estado sigue fijada |

### Desviaciones y avisos
- `registro.test.ts:218-220` (reconciliación) cuenta cambios «en curso»: la propuesta de F1C-09 lo ponía rojo desde la planificación. Se añadió `F1C-09` a la lista esperada (SEIS a SIETE). **Hay que revertirlo al archivar** (el archivo quita al cambio de «en curso»).
- Fuera de alcance, anotado: `docs/artefactos/blueprintserviciotecnico.html:765`, `:770-771` siguen pintando las tres retiradas; no lo genera ni lo vigila nada.
- Lote B: ver sección siguiente.

### Medida del lote A (válvula 720, techo 800)
`git diff --shortstat --no-renames fd253aa`: 25 ficheros, +227 −173 = **400**; más `wc -l` de lo nuevo sin trackear: `cifrasAncladas.test.ts` 75 + este `apply-progress.md` ~52 = **127**. Total lote A: **~527**. Sin binarios. Por fichero (+/−): `transicionesEjecucion.test.ts` 48/16, `invariantesGrafo.test.ts` 37/13, `permisos.test.ts` 22/22, `mapaBlueprint.test.ts` 16/6, `transitions.ts` 15/15, `config.yaml` 12/12, `tasks.md` 24/24, el resto ≤6/6; mapa regenerado 2/14.

## Lote B (tareas 5.1-10.4)

### Rojo (5.1/5.2) — `npx vitest run packages/zoho-sync/src/db/migracionPendienteF1C09.test.ts`
7 pruebas, 7 rojas, rojo natural: `ENOENT ... Migracion_Pendiente_a_En_Proceso_F1C-09.sql` (el script no existía). La prueba deriva su fixture de `schema.sql` (bloques `tickets` y `ticket_transitions`, calificados `desk.`) y siembra cinco tickets: servicio-app con traza previa, servicio-app con `classification` NULL, servicio-Zoho, soporte remoto, control En Proceso.

### Verde (6.1/6.2) — pg-mem NO admitió el script tal cual
Se ejecuta **por sentencias** (el script se parte por `;` tras quitar los comentarios; la atomicidad `BEGIN`/`COMMIT` se comprueba por lectura estática, caso f). Lo que pg-mem no admitió y cómo se resolvió en el propio script (válido también en PostgreSQL real):

| Rechazo de pg-mem | Cambio en el script |
|---|---|
| `GROUP BY 1` sobre un `CASE` («Cannot read properties of null») | subconsulta con alias `grupo` y `GROUP BY grupo` |
| `btrim()`, `trim()`, `replace()` no existen | `lower(coalesce(classification,'')) LIKE '%soporte%remoto%'` (más tolerante que la regla de la aplicación con espacios y mayúsculas; anotado como hipótesis en la cabecera, y el paso 1 lista las clasificaciones distintas) |
| subconsulta correlacionada en la reversión | reversión sin correlación: `id IN (SELECT max(id) ... GROUP BY ticket_id)` |

`BEGIN`/`COMMIT`, `"values"` entrecomillado, `::jsonb` y `INSERT ... SELECT` sí pasaron. Desviación del diseño D6/D7: ninguna de comportamiento; sólo el predicado de clasificación (arriba) y la reversión «ticket cuya fila marcador es su última transición».
Resultado: 7/7 verdes (casos a-f + «no toca status_type/managed_by_app, no reescribe filas, sin metacomandos ni secretos»).

### TDD
| Tarea | Prueba | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|
| 5.1/5.2/6.1/6.2 | `migracionPendienteF1C09.test.ts` | 7 rojas (ENOENT) | 7 verdes tras el script | cinco tickets en tres grupos + control; segunda ejecución; reversión | el script se reescribió tres veces contra pg-mem (tabla anterior) |

### Mutaciones (7.1, 7.2), todas revertidas
| # | Mutación | Rojo observado |
|---|---|---|
| 7.1a | quitar `managed_by_app = true` del filtro (regla 2, fichero vigilado) | 1: caso (a) (se movería también el servicio-Zoho) |
| 7.1b | `UPDATE tickets` sin calificar | 6: (a), (b), (c), (d), (f) y la estática (pg-mem no halla `public.tickets`; el caso d lo nombra) |
| 7.2 | UPDATE antes del INSERT (regla 1, posición) | 3: (a) sin filas marcador, (c) y (f) |
| extra | `SET managed_by_app = false` en el UPDATE | 1: la estática |
Restaurado el script: 7/7 verdes.

### Comentarios «34» (8.1)
Caso A (31 / 20): `appHarness.ts:61`, `ticketService.test.ts:12`, `bodegaje.ts:28`, `bodegaje.test.ts:38`, `sla.ts:14`, `sla.ts:75` (21 → 20 estados), `sla.test.ts:22`. Ya estaban en 31 desde el lote A: `permisos.test.ts:11`, `:24`, `transicionesEjecucion.test.ts:106-133`, `fechasDerivadas.ts:89`. Caso B, se quedan: `estados.ts:3-4` (dice «Hasta F0-04»), `prioridad.test.ts:82` («medidos ANTES»), `estados.test.ts:218` (F1B-06 en su momento). `valoresDeTransicion.ts:10` no existe con ese nombre en el árbol.

### Barrido de citas, regla de mutación 4 (9.1-9.3)
Método: guion en node sobre los ficheros que cambiaron desde `fd253aa` (rangos antiguos de cada hunk, `git diff -U0`), contra TODAS las citas completas `ruta.ts:N(-M)` del repositorio rastreado (sin archive, sin `docs/artefactos/`), más un segundo pase con la forma abreviada heredando el módulo del párrafo. Resultado: 156 coincidencias completas y 68 abreviadas, y se leyó la frase de cada una.
- **Sin cambio (la frase sigue afirmando algo cierto)**: rangos de bloque como `estados.ts:59-106/-112/-160`, `transitions.ts:267-276`, `:277-291`, `:292-293`, `:65-74`, `permisos.test.ts:24-33`, `:89-109`, `transicionesEjecucion.test.ts:105-117`, `:272-285` en las frases estructurales (RQ-TS-08, -12, -17, RQ-TZ-01, RQ-SR-03, RQ-EN-07), las ya ancladas (`ad1875b`, `ae5aaf4:`) y las que quedan bajo un requisito que el delta MODIFICA (RQ-TS-01/05/07/11/12, RQ-PM-03, RQ-AV-01/02, RQ-SR-06): las reescribe el archive, editarlas aquí sería pisar el delta.
- **Caso B (anclar a `fd253aa`, 17 citas en 8 ficheros, mismas líneas físicas, nada se mueve)**: `openspec/specs/transitions-st/spec.md` `:29` (×2), `:33`, `:1267`, `:1333`, `:1346` (×2), `:1351`, `:1360`; `permissions/spec.md:519` (×2); `derivacion-avisos/spec.md:587`, `:631`; `trazas/spec.md:30`, `:485`; `CLAUDE.md:370`; `openspec/config.yaml:542`, `:544`, `:545` (el `:77-82 (102 casos…)` abreviado lleva ancla propia); `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:173` (×4, las líneas 206, 230, 232 y 244 del estado anterior); y el delta `specs/transitions-soporte-remoto/spec.md:83` (`Previously … transitions.ts:206`).
- **Caso C**: la frase de `derivacion-avisos/spec.md:587` (comentario con «la 35.ª») la cerró F1C-09 en `transitions.ts:289-290`; la cita queda anclada al comentario viejo.
- **Listadas, NO corregidas (fichero fechado ajeno o ya desfasado antes de esta tanda)**: la línea 1714 del maestro R08.2 (el maestro no se edita desde el repositorio); `docs/sdd/F0-00_*`, `F0-01_*`, `F0-00_Recomendaciones_R02`, `Decisiones_Gerencia_2026-09-10`, `Parte_2026-09-21`, `F1A-05_Auditoria…:211` (registros fechados, caso B por naturaleza); `Paquete_de_Despliegue_2026-09-30.md:1284` y `…2026-10-01.md:1754` («44 transiciones» de la unión, hoy 41, dato del paquete de su fecha); y dos ya rotas antes de F1C-09 en bloques que el delta reescribe: `transitions-st/spec.md:48` (`transitions.ts:288-291`, hoy `TRANSITIONS` está en `:295-298`) y `:51` (`invariantesGrafo.test.ts:15-21`).
- Detector (10.1): `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` sale con código 0, 0 bloqueantes, 4.502 comprobadas, 0 cabeceras inválidas, 11 abreviadas rotas informativas (las mismas 11 de antes del lote B, todas ajenas). Una primera pasada dio 1 bloqueante y 2 abreviadas nuevas, las tres escritas en este mismo fichero (una cita con puntos suspensivos y dos formas abreviadas), y se repararon en prosa antes de cerrar.

### Cierre (10.1-10.4)
- `npm test`: 170 ficheros pasan, 1 saltado; 2416 verdes, 2 saltadas (antes del lote B: 2409 verdes; +7 de la prueba nueva).
- `npm run typecheck` limpio; `npm run lint` 165 avisos, 0 errores (techo 165, sin subir); `npm run build` correcto.
- TS-29 (10.3): `Migracion_Pendiente_a_En_Proceso` sólo aparece en `packages/zoho-sync/src/db/migracionPendienteF1C09.test.ts`; ni el arranque ni `migrate.ts` lo invocan.
- Medida del lote B (partida `ad1aaa0`): `git diff --shortstat --no-renames` = 15 ficheros, +39 −39 = **78**; más `wc -l` de lo nuevo sin trackear: script SQL 65 + prueba 146 = **211**; total **289** más las líneas añadidas a este `apply-progress.md` (~60). Sin binarios. Válvula 720 y techo 800 sin riesgo. Acumulado F1C-09: lote A ~527 + lote B ~350.
- Fuera de alcance, sigue anotado: `docs/artefactos/blueprintserviciotecnico.html:765`, `:770-771`.
