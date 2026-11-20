# Informe de verificación — `pasada-en-seco-sin-fecha-zoho` (F1F-01, `cierra: no`)

**Veredicto: PASS WITH WARNINGS** — 0 CRITICAL, 2 WARNING, 3 SUGGESTION.
Revisión verificada: `706f63f5` (partida de la tanda `d2a735a4`). Modo: hybrid, strict TDD. Worktree: `C:\dev\Desk_2_R1.023-worktrees\pasada-en-seco-sin-fecha-zoho`.
Árbol al empezar y al terminar: `git status --short` vacío, salvo este fichero.

## 1. Completitud

Las 27 casillas de `openspec/changes/pasada-en-seco-sin-fecha-zoho/tasks.md` están marcadas (1.1 a 1.27). Las 1.26 y 1.27 las corre el orquestador
(`apply-progress.md` §7); aquí sólo se repiten typecheck, lint y detector. Las tareas de persona quedan fuera del recuento, con dueño y destino, como pide
la regla del ciclo 1. Sin tareas pendientes: se pudo verificar entera.

## 2. Comprobaciones corridas por este verificador

| Comprobación | Resultado |
|---|---|
| `npm run typecheck` | sale 0 |
| `npm run lint -- --max-warnings 165` | sale 0; 165 problemas (0 errores, 165 avisos): el techo, ninguno nuevo |
| detector `tsx apps/desk/server/citas/cli.ts --sha HEAD` | sale 0; 8.988 comprobadas, 0 bloqueos, 13 abreviadas rotas informativas |
| ocho ficheros afectados (los cuatro nuevos o editados, `migracionTicketsF1F01.test.ts`, `migracionMarcadorLectores.test.ts`, `escritoresTransiciones.test.ts`, `marcadorMigracion.test.ts`) | 8 de 8 ficheros, 93 de 93 pruebas verdes |
| `npm test` entero y `npm run build` | NO corridos aquí (los corre el orquestador: 6.548 pasan y 36 omitidas según su encargo); sin contraste propio |

## 3. Escenario → prueba → aserción de valor (los 15)

Rutas: `U*` en `packages/shared/src/sinFechaDeZohoDeMigracion.test.ts`; `P*` y «car.» en `apps/desk/server/db/migracionSinFechaDeZoho.test.ts`;
`P8*` en `apps/desk/server/deployPasadaEnSecoSinFechaZoho.test.ts`. VALOR = compara contra el objeto o la cifra esperada, no sólo existencia.

| # | Requisito · escenario | Prueba (ruta:línea) | Aserción | ¿Valor? |
|---|---|---|---|---|
| 1 | RQ-ZS-68 · fixture literal | `apps/desk/server/db/migracionSinFechaDeZoho.test.ts:70` (P1) | `toEqual(ESPERADO)` sobre el objeto entero: 4200, 4400, 4500, 4600, 4700 y 4800 no figuran por igualdad exacta | VALOR |
| 2 | RQ-ZS-68 · sin migrables | `apps/desk/server/db/migracionSinFechaDeZoho.test.ts:129` (P6); `packages/shared/src/sinFechaDeZohoDeMigracion.test.ts:80` (U7) | `toEqual({ tickets: 0, porRegla: [] })` y cero lecturas de historia | VALOR |
| 3 | RQ-ZS-68 · regla con todos fechados, a cero | `apps/desk/server/db/migracionSinFechaDeZoho.test.ts:138` (P7); `packages/shared/src/sinFechaDeZohoDeMigracion.test.ts:28` (U2) | `toEqual` con las dos reglas, `tickets: 0`, `numeros: []` | VALOR |
| 4 | RQ-ZS-68 · el resto del informe no cambia | `apps/desk/server/db/migracionSinFechaDeZoho.test.ts:149` (car.) | `cierres` `{1, 1}`, `negativa` null | VALOR |
| 5 | RQ-ZS-69 · «entregado» coincide con `cierres` | `apps/desk/server/db/migracionSinFechaDeZoho.test.ts:80` (P2); `packages/shared/src/sinFechaDeZohoDeMigracion.test.ts:45` (U4) | ambas cifras 1 y `numeros` `[4100]` | VALOR |
| 6 | RQ-ZS-69 · predicción en seco = realidad tras aplicar | `apps/desk/server/db/migracionSinFechaDeZoho.test.ts:103` (P4) | números reales de `ticket_transitions` con `entradaDelMarcador` contra los del informe en seco; la guarda `length > 0` evita el vacío trivial | VALOR |
| 7 | RQ-ZS-69 · «Pendiente» con entrada en Zoho no cuenta | P1 (`apps/desk/server/db/migracionSinFechaDeZoho.test.ts:70`, 4400 ausente), P7 (`:138`), U2 (`packages/shared/src/sinFechaDeZohoDeMigracion.test.ts:28`, incluye la etapa de OTRO ticket) | `toEqual` | VALOR |
| 8 | RQ-ZS-69 · `conFechaDeZoho` igual que antes | `apps/desk/server/db/migracionSinFechaDeZoho.test.ts:158` (car.) | claves `['t4400']`, fecha exacta, `size` 0 y cero lecturas sin marcadores | VALOR |
| 9 | RQ-ZS-70 · en seco sin transacción ni escritura | `apps/desk/server/db/migracionSinFechaDeZoho.test.ts:70` (P1) | `not.toContain('BEGIN')`, `escrituras` `[]` (su compañera no vacía es P3), una lectura exacta | VALOR |
| 10 | RQ-ZS-70 · con `aplicar=true`, lectura antes del primer `INSERT` | `apps/desk/server/db/migracionSinFechaDeZoho.test.ts:89` (P3) | igualdad con el seco, `aplicado` true, `lectura < primero` con ambos `> -1` | VALOR |
| 11 | RQ-ZS-70 · con negativa | `apps/desk/server/db/migracionSinFechaDeZoho.test.ts:119` (P5) | campo `toEqual(ESPERADO)`, `negativa` no nula, `aplicado` false, sin escrituras | VALOR (`not.toBeNull` va con valor al lado) |
| 12 | RQ-ZS-70 · `negativa`, `aplicado` y `avisos` no cambian | `apps/desk/server/db/migracionSinFechaDeZoho.test.ts:149` (car.) y `apps/desk/server/db/migracionTicketsAbiertos.test.ts:56` | `avisos` con su texto exacto; la lista de claves ganó `sinFechaDeZoho` | VALOR |
| 13 | RQ-ZS-71 · la viñeta nombra el campo | `apps/desk/server/deployPasadaEnSecoSinFechaZoho.test.ts:32` (P8a) | `faltasPasadaEnSeco(deploy)` `toEqual([])` (sus compañeras rojas son P8b y P8c) | VALOR |
| 14 | RQ-ZS-71 · sin el nombre, roja | `apps/desk/server/deployPasadaEnSecoSinFechaZoho.test.ts:36` (P8b) y `:42` (P8c, posición) | `toEqual(['sinFechaDeZoho'])` | VALOR |
| 15 | RQ-ZS-71 · S-11 y el entorno no cambian | `packages/shared/src/marcadorMigracion.test.ts:86-88` (existente, `toBeNull`) | `resolverMarcador` da null; lo de `.env.example` y `schema.sql` NO tiene prueba: sólo `git diff --exit-code` (ver W1) | VALOR / parcial |

Auditoría de aserciones: sin tautologías, sin bucles fantasma, sin pruebas de humo. Las comparaciones con `[]` tienen compañera no vacía (P1 con P3, P6 con P1,
P8a con P8b). Las pruebas de espía miden orden y presencia de sentencias, que es lo que el requisito dice (RQ-ZS-70), no detalle de implementación.
Distribución: 7 unitarias puras, 9 de servidor sobre pg-mem y 3 de guarda de texto; 0 de interfaz (excluidas por decisión de Gerencia).

## 4. Rojo reproducido contra la partida

`git checkout d2a735a4 -- <los cinco ficheros>` y las cuatro pruebas: **18 rojas y 19 verdes de 37**. Restaurado con `git checkout HEAD -- <los cinco>`;
`git status --short` vacío tras restaurar.

- Rojas (18): la lista de claves de `apps/desk/server/db/migracionTicketsAbiertos.test.ts:56`; U1 a U7 (por importación inexistente); P1 a P7; P8a, P8b y P8c.
- Verdes (19): las dos de caracterización (`:149` y `:158` de `apps/desk/server/db/migracionSinFechaDeZoho.test.ts`, C1 y C2) y las 17 ya existentes de
  `apps/desk/server/db/migracionTicketsAbiertos.test.ts`.
- Coincide con `apply-progress.md` §1 sin discrepancia: lo que cae, cae; lo que nace verde, nace verde.

## 5. Mutaciones reproducidas

Todas con `perl -i -pe` y la condición `$. == N` (nunca `sed -i`), copia previa a `antes-Mn` en el scratchpad, restaurada copiando de vuelta; en cada una `cmp` sin salida,
`file` con CRLF y `git diff --exit-code` limpio. N localizado con `grep -n`: 58 (M1 y M6), 119 (M3), 118 (M4), 92 (M6, `informe.aplicado = true`), 673 (M7).

| M | Qué | Rojas vistas | Contraste con design §5 |
|---|---|---|---|
| M1 | el cálculo pasa a `{ tickets: 0, porRegla: [] }` (`apps/desk/server/db/migracionTicketsAbiertos.ts:58`) | P1 P2 P3 P4 P5 P7 | idéntico a lo previsto |
| M3 | la regla ignora la historia (`packages/shared/src/marcadorMigracion.ts:119`) | U2 P1 P4 P5 P7 | idéntico |
| M4 | sin el filtro `migrar` (`packages/shared/src/marcadorMigracion.ts:118`) | U1 P1 P4 P5 P6 | las previstas más P4 |
| M6 | POSICIÓN: con `aplicar`, el campo se calcula tras el bucle; compila (tsc sin salida) | SÓLO P3 y P5; las otras 35 verdes | idéntico: P1, P2, P6 y P7 siguen verdes, como dice el diseño |
| M7 | FICHERO VIGILADO: `sinFechaDeZoho` pasa a `sinFecha` en `DEPLOY.md:673` | P8a P8b P8c | idéntico (la precondición añadida a P8c funciona) |

M6 demuestra la regla de mutación 1: el valor es el mismo y sólo la posición lo delata, y la delata P3 por el espía. M7, la regla 2: ensuciar el fichero
vigilado pone rojas las tres, también P8c.

## 6. Una sola noción y una sola lectura (RQ-ZS-69)

- **Una consulta a `ticket_history`:** el diff de `d2a735a4` a HEAD, sin `openspec`, no añade ninguna consulta de producción; la única `SELECT … FROM ticket_history`
  del diff es la que ya existía en `conFechaDeZoho`, movida al final de `apps/desk/server/db/sla.ts` (`etapasDeZohoPorTicket`). El resto de menciones del diff son
  pruebas y el fixture.
- **`conFechaDeZoho` la llama:** `const etapas = await etapasDeZohoPorTicket(db, ids)` y luego `etapas.get(String(f.ticket_id)) ?? []`; el informe la llama en
  `apps/desk/server/db/migracionTicketsAbiertos.ts:58` con los `aMigrar`. P1 fija una sola lectura (`toHaveLength(1)`) y P6 cero.
- **Fila simulada contra el bucle** (`apps/desk/server/db/migracionTicketsAbiertos.ts:71-91`): `entradaDelMarcador` lee `transition_id`, `to_status`, `from_status` y
  `values.regla`, y por `llegadaQueCuenta` (`packages/shared/src/cierreEnCifras.ts:39-41`) `values.cierre_origen` y `values.closed_time_destino`. La fila simulada
  pone `ID_TRANSICION_MIGRACION`, `from_status: t.status`, `to_status: eq.destino === t.status ? null : eq.destino` (igual que el `INSERT` del bucle) y
  `values: { regla, closed_time_destino, cierre_origen }` calculados con la misma `cierreDeMigracion`. Coinciden en las claves que se leen; las demás del
  bucle (`estado_previo`, `corte`, `ejecutado_por`…) no las lee la noción. P4 lo prueba de extremo a extremo y U6 la fila sola.
- **`resolverMarcador` no cambió:** `git diff -U0 d2a735a4 HEAD -- packages/shared/src/marcadorMigracion.ts` da dos hunks: la línea 3 (import, en sitio) y 23 líneas
  añadidas al final (`SinFechaDeZoho` y `sinFechaDeZohoDeMigracion`). Ninguna línea de `resolverMarcador` ni de `entradaDelMarcador` tocada.

## 7. Sin líneas movidas y CRLF

`git diff -U0 d2a735a4 HEAD` de los ficheros existentes: todos los hunks son en sitio (`DEPLOY.md` 673; ejecutor 5, 8, 25, 41, 58, 67, 69; `sla.ts` 135-138 a igual número
de líneas y 142; `migracionTicketsF1F01.test.ts` 14, 34-35, 43; lista de claves 56) o añadidos al final (`sla.ts`, `marcadorMigracion.ts`, `migracionTickets.ts`).
Ninguna inserción en medio. CRLF medido con `perl`: `DEPLOY.md` 1196/1196, ejecutor 106/106, `sla.ts` 162/162, `marcadorMigracion.ts` 126/126,
`migracionTickets.ts` 155/155, `migracionTicketsAbiertos.test.ts` 243/243, `migracionTicketsF1F01.test.ts` 238/238, `migracionSinFechaDeZoho.test.ts` 169/169.

## 8. Regla 13 y regla de mutación 3

`git diff --stat d2a735a4 HEAD -- apps/desk/src` vacío (sale 0); `git diff --exit-code d2a735a4 HEAD -- .env.example packages/zoho-sync/src/db/schema.sql` sin salida.
Sin interruptor, variable, migración ni cambio de cliente. La decisión («qué migrados quedan sin fecha») vive en `packages/shared` y la impone el servidor; el
cliente no toma ninguna. `openspec/config.yaml` y `docs/sdd/ENTRADA.md` sin tocar.

## 9. Barrido de citas (regla de mutación 4)

Leídas contra la línea de hoy ocho de la tabla de `apply-progress.md` §4, las de §8 y las del spec y la propuesta: **todas coinciden**.
`DEPLOY.md:663` es la cabecera de la §14 y la `## 15.` empieza en `:754`, así que `:663-693` contiene la viñeta de `:673`; en el ejecutor, `:66` es
`const aplicar = opts.aplicar === true`, `:67` el `if (!aplicar)` y `:63-95` la función entera; `apps/desk/server/db/migracionTicketsAbiertos.test.ts:56` es la lista de claves;
`apps/desk/server/db/migracionTicketsAbiertos.ts:5` importa `normalizarEstado`, `:22` es `negativa` y `:24` `numeracion`; `packages/zoho-sync/src/db/schema.sql:244` es
`CREATE TABLE IF NOT EXISTS ticket_history`; `apps/desk/server/db/migracionConcurrente.integration.test.ts:91` es `await migrate(pool)`;
`packages/shared/src/marcadorMigracion.ts:10-11`, `:58` y `:69` dicen lo que el spec afirma; `apps/desk/server/db/sla.ts:93` es el único llamador de `conFechaDeZoho`;
`openspec/specs/zoho-sync/spec.md:3184` es RQ-ZS-67 y `:812` RQ-ZS-17. Las del estado anterior llevan «en `d2a735a4`» y ahí se leen bien. Sin casos B ni C que reparar.

## 10. Pregunta del encargo: «entregado-a-finalizado» (proposal §2)

**La justificación es correcta, leída línea a línea.**
1. `packages/shared/src/migracionTickets.ts:126-128`: `cierreDeMigracion` devuelve `origen: 'zoho'` si hay `closedTimeZoho` y `'migracion'` si no (y `null` si la regla no cierra, `:125`). Cierto.
2. `packages/shared/src/marcadorMigracion.ts:49` fecha la regla con `llegadaQueCuenta`, que (`packages/shared/src/cierreEnCifras.ts:39-41`) devuelve `destino(values, 'zoho')`, y
   `packages/shared/src/cierreEnCifras.ts:15-16` sólo da `closed_time_destino` si `cierre_origen === 'zoho'`. Cierto: «sin fecha» equivale a `cierre_origen: 'migracion'`.
3. `packages/shared/src/migracionTickets.ts:137-139`: `cierresDeMigracion` salta lo que no es `migrar` o no cierra y suma `conFechaDeMigracion` exactamente si `closedTime` es nulo.
4. `packages/shared/src/migracionTickets.ts:30-39`: «Entregado» es la única regla con `statusTypeDestino: 'Closed'`. Cierto.
5. `packages/shared/src/migracionTickets.ts:131` da sólo la cifra (`CierresMigracion`), así que remitir no da los números. Cierto.
6. El argumento de H5 también vale: antes de la tanda, un cambio en `llegadaQueCuenta` habría separado las dos nociones sin pintar nada rojo; P2 y U4 las enfrentan ahora.

Las citas `openspec/config.yaml:5646` («28 migrables», «identidad, sin cambio de estado») y `openspec/changes/archive/2026-11-17-marcador-migracion-lectores/design.md:235-237` también dicen lo afirmado.

## 11. Hallazgos

**CRITICAL:** ninguno.

**WARNING**
1. **El escenario 15 no tiene prueba de la mitad de entorno.** «`.env.example` y `schema.sql` no ganan entrada» sólo se comprueba con `git diff --exit-code` (aquí y en el apply), no con una
   prueba que quede. Es una caracterización declarada así por el spec; el riesgo es bajo, pero no es una prueba en el sentido del escenario.
2. **El alcance de la tarea 1.12 fue demasiado estrecho y la suite entera lo cazó.** El apply corrió sólo seis ficheros; `apps/desk/server/db/migracionTicketsF1F01.test.ts` (importador del
   ejecutor, con un fixture de pg-mem sin `ticket_history`) cayó en 8 pruebas hasta la corrección en sitio de `706f63f5` (`apply-progress.md` §8). Esa edición toca un fichero que ni
   `design.md` §6 ni `tasks.md` listaban; está justificada, documentada y sin líneas movidas, pero es una desviación del plan y consta aquí. El patrón es el de «guardas que cuentan el árbol».

**SUGGESTION**
1. Dos ficheros nuevos (`apps/desk/server/deployPasadaEnSecoSinFechaZoho.test.ts` y `packages/shared/src/sinFechaDeZohoDeMigracion.test.ts`) están en LF en el árbol de trabajo mientras sus vecinos
   están en CRLF; el índice es LF en todos y el atributo es `text=auto`, así que no afecta al commit. Sólo conviene saberlo al comparar con `perl`.
2. `apply-progress.md` no trae una tabla «TDD Cycle Evidence» con ese nombre; su §1 (rojo con error exacto), §2 (verde) y §3 (mutaciones) llevan lo mismo y se contrastaron por ejecución arriba.
3. Para la próxima tanda que toque el ejecutor o `sla.ts`: añadir a 1.12 el barrido de importadores (`grep -rln` del módulo sobre los ficheros `.test.ts`) antes de cerrar el lote.

## 12. Conformidad con strict TDD

| Comprobación | Resultado |
|---|---|
| Evidencia de TDD | sí, en `apply-progress.md` §1 a §3 (sin la tabla con ese nombre: sugerencia 2) |
| Pruebas existen y caen contra la partida | 18 de 18 rojas esperadas reproducidas; C1 y C2 nacen verdes |
| Verdes en HEAD | 93 de 93 en los ocho ficheros afectados |
| Triangulación | adecuada: valores distintos por regla, con y sin fecha, con y sin historia, tres rutas (seco, aplicar, negativa) |
| Red de seguridad en ficheros modificados | sí: `migracionTicketsAbiertos.test.ts`, `migracionMarcadorLectores.test.ts` y `escritoresTransiciones.test.ts` verdes |
| Mutaciones M1, M3, M4, M6, M7 | todas reproducidas; M6 prueba la posición y M7 el fichero vigilado |

Cobertura por línea: no se pidió herramienta de cobertura en esta tanda; la funcional la dan los 15 escenarios de la sección 3.

## Key Learnings

- La mutación de posición (M6) sólo la ve la prueba que mide el ORDEN por el espía de SQL (P3); P1, P2, P6 y P7 comparan valores y siguen verdes. Sin P3 la guarda sería invisible.
- Una prueba de guarda sobre un fichero de texto necesita su precondición («hay un nombre que sacar») para que M7 ponga rojas las tres, no sólo dos.
- Sacar una lectura a una función compartida obliga a correr los importadores del módulo, no sólo los ficheros previstos: el fixture de pg-mem de la reversión fijaba el árbol de tablas.
- `git status --short` vacío antes y después de reproducir el rojo es la forma barata de demostrar que la restauración fue completa.
