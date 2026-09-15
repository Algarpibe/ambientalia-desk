```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:724e4c5d21959f247ecee51af8d93c76433002658f2d99da0e0f6ed7b4c01ce9
verdict: pass
blockers: 0
critical_findings: 0
requirements: 18/18
scenarios: 64/64
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:b7ea5ef063670f7cee109a2e8360a941808d0fffe347b7d5cb78c9480640387c
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:f485d10c89b2d8877395ceb5a379d39fd2fce091d48b2bd7f74d679bd633f692
```

# Informe de verificación — hook-citas-pre-push

**Sobre del resultado:** `test_output_hash` y `build_output_hash` son el sha256 de la salida completa
(stdout y stderr) de `npm test` y `npm run build` ejecutados sobre `dabc2db`, el commit de la
remediación. `evidence_revision` es el sha256 de las dos salidas concatenadas, primero la de test y
después la de build.

**Fase**: sdd-verify (repetido tras remediación) · **Rama**: `main` · **HEAD verificado**: `dabc2db`
(= `origin/main`, CI success)
**Verify anterior**: evidencia `sha256:400a38b98ec9ccdbe5d96ae762ac4441f3e3691e7aa45d968fd1d4b11a00fc73`,
veredicto `fail`, 18/18 requisitos, 62/64 escenarios, 0 CRITICAL, 3 WARNING, 3 SUGGESTION, sobre `a4d5b81`.
Entre `a4d5b81` y `dabc2db`: 3 commits (`b861065`, `fac7709` documentales del verify anterior; `dabc2db`
la remediación), 6 ficheros, +628/-40.
**Preflight** (`openspec/config.yaml:25-30`): interactive · hybrid · ask-on-risk · 800 líneas · strict_tdd
**Modo de verificación**: artefactos completos (propuesta, spec, diseño, tareas y progreso de apply).
`gentle-ai sdd-status hook-citas-pre-push --cwd . --json`: 102/102 tareas, `taskProgress.allComplete`
true, `apply: all_done`. Al leerlo, ANTES de persistir este informe, el estado nativo reportaba
`remediationState.required: true` / `complete: false` y `nextRecommended: remediate`, porque referenciaba
la revisión de evidencia FALLIDA anterior (`sha256:400a38b9…`): es la marca de que hacía falta este
verify nuevo, con evidencia distinta. Tras persistir (apartado 15), el ciclo nativo la despejó solo.

Convención de este informe: no cita líneas de ningún artefacto de la tanda (convención 2 de la
propuesta). Los nombra por apartado, tarea o identificador. Toda cita a código va contra `dabc2db`, leída
línea a línea (regla de mutación 4: se comprobó el principio y el final de cada rango citado).

## Veredicto: PASS — 18/18 requisitos, 64/64 escenarios, 0 CRITICAL, 0 WARNING, 1 SUGGESTION abierta

**0 CRITICAL · 0 WARNING · 1 SUGGESTION abierta (2 SUGGESTION cerradas en esta remediación).**

Los tres WARNING del verify anterior están cerrados, comprobado de forma independiente en este verify
(apartado 5). Los dos escenarios que estaban PARTIAL (RQ-CV-06, filas 20 y 24 de la matriz) tienen ahora
prueba de punta a punta a través de `detectar()`, en `apps/desk/server/citas/detector.test.ts` (bloque
«RQ-CV-06 de punta a punta»), y el control de dos signos que faltaba en `cosecha.test.ts` está escrito.
Repetí yo mismo una variante de MUT-b (impedir que `NOMBRE_FICHERO` empiece por punto) sobre una copia
mutada de `apps/desk/server/citas/cosecha.ts`: 5 de 39 pruebas de `detector.test.ts` +
`cosecha.test.ts` se ponen rojas —las tres del bloque nuevo y las dos de `(d)` en `cosecha.test.ts`—,
restauré el fichero y `cmp` confirmó bytes idénticos al original (`sha256`
`d53e11badbe115fe68fee85c2d464c757ba82775576fbd6ad12a5c4bc52678e4` antes y después). Detalle en el
apartado 6.

Los 18 requisitos de la spec están implementados y probados, las 102 tareas están cerradas y los cinco
comandos de la tarea 5.6 dan `exit 0` con cifras propias de este verify (apartado 3). De los 64
escenarios, 64 están cubiertos: 50 con prueba automática y 14 con evidencia manual verificable. Queda
**una SUGGESTION abierta por decisión** (el comentario falso de `Dockerfile:14` en `5f05466`, registrado aparte y
fuera de alcance a propósito) y ninguna WARNING ni CRITICAL.

---

## 1. Artefactos leídos

| Artefacto | Estado |
|---|---|
| `proposal.md` (1.071 líneas) | Leído completo (§6 M14, §15, Pieza 2, Pieza 4, Pieza 5, R-14) |
| `specs/citas-verificables/spec.md` (755 líneas) | Leído completo, las 18 secciones `Requirement` y los 64 `Scenario` |
| `design.md` (631 líneas) | Decisiones D1-D12 localizadas y cruzadas contra el código que las implementa |
| `tasks.md` (633 líneas) | Leído completo; 102/102 marcadas `[x]`, P.1/P.2 fuera del recuento |
| `apply-progress.md` (1.113 líneas) | Sección «Remediación del verify fallido» leída completa; cortes 1-4 contrastados contra `tasks.md` y el código real |
| Engram obs. 521 (`sdd/hook-citas-pre-push/spec`) | Leída; es la versión ANTERIOR a las correcciones del orquestador (obs. 522) — no se usó como fuente de conteo, se usó `spec.md` en disco |
| Engram obs. 533 (`sdd/hook-citas-pre-push/tasks`) | Leída |
| Engram obs. 535 (`sdd/hook-citas-pre-push/apply-progress`) | Leída; es anterior a la remediación — se usó `apply-progress.md` en disco como fuente vigente |
| `gentle-ai sdd-status hook-citas-pre-push --cwd . --json` | Ejecutado |

---

## 2. Estado nativo

`taskProgress`: 102 total, 102 completas, 0 pendientes, `allComplete: true`. Dependencias: proposal,
specs, design, tasks y apply en `all_done`. ANTES de persistir este informe, `verify: blocked` y
`archive: blocked` en el JSON nativo, porque `remediationState.required: true` apuntaba a la revisión de
evidencia FALLIDA del verify anterior (`sha256:400a38b9…`) — es exactamente la condición que motiva
repetir el verify con evidencia nueva. El estado posterior a persistir está en el apartado 15. Las dos
tareas de PERSONA (P.1 y P.2) siguen fuera del recuento, con dueño y registro, regla del ciclo 1 de
`CLAUDE.md`.

---

## 3. Comandos ejecutados por este verify — cifras propias

Ejecutados desde la raíz del repositorio sobre `dabc2db`, sin reutilizar las cifras de `apply-progress.md`:

| Comando | Cifra de este verify | Cifra de la remediación (registrada en `apply-progress.md`) | ¿Coincide? |
|---|---|---|---|
| `npm test` | 120 ficheros pasan, 1 omitido (121); 1.111 pruebas pasan, 2 omitidas (1.113); `exit 0` | 1.111 pasan, 2 omitidas (1.108 + 3 `it` nuevos) | Sí |
| `npm run typecheck` | sin salida; `exit 0` | `exit 0` | Sí |
| `npm run lint` | 0 errores, 158 avisos; `exit 0` | 0 errores, 158 avisos | Sí, justo en el trinquete |
| `npm run build` | `vite build` completo en 2,47 s; `exit 0` | `exit 0` (tiempo no es criterio) | Sí |
| `npm run test:coverage` | `exit 0`. Global: 94,79 % sentencias, 83,93 % ramas, 98,2 % funciones, 94,79 % líneas. `apps/desk/server/citas`: 99,23 % / 95,39 % / 97,29 % / 99,23 % | Global 94,79/83,96/98,2/94,79 (medido en el verify anterior); `citas` 99,23/95,39/97,29/99,23 | Sentencias, funciones y líneas sí; ramas globales varían **83,94 · 83,94 · 83,93** entre ejecuciones sobre el MISMO árbol (SUGGESTION-1, cerrada como ruido de medición, ver apartado 5) |

Los umbrales de `vitest.config.ts:58-63` (líneas 92, sentencias 92, funciones 96, ramas 78) quedan
superados con margen en las cinco métricas, en las tres ejecuciones.

**Comprobación adicional (RQ-CV-14, segunda pasada, repetida sobre `dabc2db`):**
`node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha dabc2db < /dev/null`:

```text
citas · dabc2db · dabc2db
  comprobadas ............ 1852
  saltadas ............... 1576   (sin barra y sin resolver 383 · ambiguas con alguna candidata válida 139 · directorios 0 · abreviadas huérfanas 1054 · anclas sin resolver 0 · no legibles 0)
  fuera del repositorio .. 3
  abreviadas rotas ....... 7   (informativas: no bloquean)
  no son citas ........... 7   (marcas de hora ISO, horas y puertos de URL; fuera de las cuatro cifras)
  texto que git cree binario .. 0   (no barridos)
  índice remoto .......... origin/main
  línea base ............. 37 informadas · 0 caducadas
exit=0
```

**0 bloqueantes** (sin cabecera «Bloqueantes:», que `informe.ts:47-48` sólo omite con la lista vacía),
**37 informadas, 0 caducadas**, `exit 0`. Las 7 abreviadas rotas listadas son las mismas 7 de siempre
(`DEPLOY.md`, `apps/desk/server/transitionExec.ts`, `apps/desk/server/app.ts`,
`apps/desk/server/routes/catalogo.ts`, `apps/desk/src/components/CatalogoEquipos.tsx` y dos a
`packages/shared/src/permissions.ts`), informativas y sin efecto sobre el código de salida.

---

## 4. Matriz de requisitos (RQ-CV-01 a RQ-CV-18)

| Requisito | Estado | Evidencia |
|---|---|---|
| RQ-CV-01 · barrido completo del sha local, lectura en lote | PASS | `apps/desk/server/citas/cli.ts:164` (comentario «RQ-CV-01: barrido COMPLETO…», línea que precede al `detectar()` del bucle `porArbol`); pruebas verdes de `hook.test.ts` para M1 (`:48`) y M29 (`:118`) |
| RQ-CV-02 · coincidencia exacta antes que sufijo | PASS | `resolverRuta` en `resolucion.ts`; `resolucion.test.ts:16` y `:20`; tareas 1.32-1.34 con mutación de posición revertida |
| RQ-CV-03 · la ambigua sólo bloquea si está rota en todas sus candidatas | PASS | bucle de `roturas`/`every` en `detector.ts:262-278`; tarea 3.9 con mutación revertida y `sha256` comprobado |
| RQ-CV-04 · «fuera del repositorio» con cifra propia | PASS | `detector.ts:59` (campo `fueraDelRepositorio`, comentario «RQ-CV-04: su propia cifra»); `cli.ts --sha dabc2db` reproducido por este verify (cifra 3) |
| RQ-CV-05 · índice remoto, directorios, con y sin barra | PASS | orden D4 en `resolucion.ts`; `indiceRemoto`/`indiceRemotoUnido` en `cli.ts:62-89`; `hook.test.ts:65` (rojo g y M7) y `:82` (rama nueva) |
| RQ-CV-06 · abreviada informativa; completa anclada por revisión | PASS, sin huecos declarados pendientes | atribución Lbc en `cosecha.ts:104-166`; los dos escenarios que quedaban PARTIAL en el verify anterior (filas 20 y 24) tienen ahora prueba de `detectar()` de punta a punta en `detector.test.ts:284-325` |
| RQ-CV-07 · sólo lo trackeado, más exclusiones | PASS | `apps/desk/server/citas/cli.ts:46-53`: seis exclusiones (línea base, `openspec/changes/archive/`, `superpowers-main`, `.agent/skills/`, `docs/artefactos/`, `*.csv`); `hook.test.ts:227` y `:249` |
| RQ-CV-08 · fichero, rango y línea vacía; los dos extremos por separado | PASS | `apps/desk/server/citas/detector.ts:109-115` (función `rotura`); `detector.test.ts:6`, `:29`, `:41` |
| RQ-CV-09 · la base sólo encoge, se genera y no crece desde el hook | PASS | `lineaBase.jsonl` con 37 líneas; `leerBase` (`cli.ts:55-59`) y `generarBase` (`cli.ts:120-132`) |
| RQ-CV-10 · mensaje con cuatro cifras, frases fijas y la línea de binarios | PASS | `apps/desk/server/citas/informe.ts:34-55`; `informe.test.ts:29`, `:36`, `:42`, `:47`; `hook.test.ts:444` (línea de binarios) |
| RQ-CV-11 · aviso de escalada sin bloquear | PASS | `apps/desk/server/citas/cli.ts:71-75` (`avisoDeEscalada`); `hook.test.ts:392` |
| RQ-CV-12 · instalador `.mjs` con guarda de dos signos | PASS | `scripts/instalar-hooks.mjs`; `apps/desk/server/citas/instalador.test.ts`, 6/6 verdes (`:40`, `:50`, `:63`, `:76`, `:89`, `:105`) |
| RQ-CV-13 · coste: objetivo 5 s, tope 10 s | PASS por registro de la tanda | M19 es manual según el §8 del diseño; el corte 4 registró 1,99-2,83 s en seis tomas. Este verify no lo volvió a cronometrar (no está entre los seis comandos encargados) |
| RQ-CV-14 · 0 bloqueantes antes de instalar y otra vez sobre lo commiteado | PASS, reproducido | apartado 3: `--sha dabc2db`, 0 bloqueantes, 37 informadas, 0 caducadas |
| RQ-CV-15 · IV-10 sin dueño y dos frases nuevas en la regla de mutación 4 | PASS | `CLAUDE.md` vigente: cinco desvíos vivos, fila IV-10 con la frase de Q4 y la de `--no-verify`; las frases de Q6 y Q9 están en la regla de mutación 4 |
| RQ-CV-16 · host y puerto no cuentan como cita | PASS | `cosecha.ts:88-92`; `cosecha.test.ts:83` y `:89` |
| RQ-CV-17 · el diseño declara los huecos | PASS | `design.md` §D1-D3; medición por opción de la propia spec (RQ-CV-17) |
| RQ-CV-18 · vive fuera de `testing/` y nada de producción lo importa | PASS | `apps/desk/server/citas/informe.ts:4-6` lo declara; `guardianes.test.ts:51` recorre el grafo de imports desde `apps/desk/server/index.ts`; `vitest.config.ts:53` incluye el servidor y `:57` excluye `testing/` |

**18 de 18.**


### 4.1 Matriz por escenario (64)

Cada fila da el `it` que ejerce el escenario, leído contra el fichero, no sólo el nombre. Ninguna de las
pruebas citadas está marcada `.skip`, `.todo` ni `it.fails`. «Manual» quiere decir evidencia verificable
fuera de la suite: una tarea de la fase 5 con su comprobación, o un fichero real.

| nº | RQ-CV | Escenario | Prueba o evidencia | Estado |
|---|---|---|---|---|
| 1 | 01 | un push que sólo mueve líneas del citado bloquea (M1) | `apps/desk/server/citas/hook.test.ts:48` | COMPLIANT |
| 2 | 01 | una rotura que llegó sin hook la caza el push siguiente (M29) | `apps/desk/server/citas/hook.test.ts:118` | COMPLIANT |
| 3 | 01 | fichero renombrado, con cita completa y con cita pelada (rojo g, M7) | `apps/desk/server/citas/hook.test.ts:65` | COMPLIANT |
| 4 | 01 | rama nueva, con y sin `origin/main` | `apps/desk/server/citas/hook.test.ts:82` | COMPLIANT |
| 5 | 01 | una reparación sin commitear no cuenta (M8) | `apps/desk/server/citas/hook.test.ts:104` | COMPLIANT |
| 6 | 01 | borrado de rama | `apps/desk/server/citas/hook.test.ts:268` | COMPLIANT |
| 7 | 01 | las anclas se leen en un solo proceso | `apps/desk/server/citas/detector.test.ts:138`; implementación en `apps/desk/server/citas/git.ts:73` | COMPLIANT |
| 8 | 02 | nombre pelado con varios candidatos resuelve a la raíz | `apps/desk/server/citas/resolucion.test.ts:16` | COMPLIANT |
| 9 | 02 | control: sin coincidencia exacta, el sufijo sigue funcionando | `apps/desk/server/citas/resolucion.test.ts:20` | COMPLIANT |
| 10 | 02 | mutación: quitar la precedencia (M23) | la misma prueba del nº 8, que la mutación pone en rojo | COMPLIANT |
| 11 | 03 | rota en todas sus candidatas | `apps/desk/server/citas/detector.test.ts:339` | COMPLIANT |
| 12 | 03 | válida en una sola candidata | `apps/desk/server/citas/detector.test.ts:345` | COMPLIANT |
| 13 | 04 | una ruta `~/` se salta en su propia cifra | `apps/desk/server/citas/cosecha.test.ts:97` y la invariante de conservación de `hook.test.ts:164` | COMPLIANT |
| 14 | 04 | control: la ruta relativa que no resuelve sigue bloqueando | `apps/desk/server/citas/cosecha.test.ts:103` y `apps/desk/server/citas/detector.test.ts:328` | COMPLIANT |
| 15 | 04 | mutación: quitar la categoría (M28) | la misma prueba del nº 13 | COMPLIANT |
| 16 | 05 | la cita pelada a un fichero renombrado bloquea (M7) | pruebas de los nº 3 y nº 4 | COMPLIANT |
| 17 | 05 | un token sin barra que no resuelve se informa | `apps/desk/server/citas/detector.test.ts:328` | COMPLIANT |
| 18 | 05 | un token con barra que no resuelve bloquea | la misma prueba del nº 17 | COMPLIANT |
| 19 | 05 | un token que resuelve a directorio se salta | `apps/desk/server/citas/resolucion.test.ts:27` | COMPLIANT |
| 20 | 06 | abreviadas tras un nombre con punto inicial: todas comprobadas | `apps/desk/server/citas/detector.test.ts:285` (de punta a punta, a través de `detectar()`) | COMPLIANT |
| 21 | 06 | (a) un nombre sin extensión se cosecha y se comprueba (M24) | `apps/desk/server/citas/cosecha.test.ts:8` y `apps/desk/server/citas/detector.test.ts:238` | COMPLIANT |
| 22 | 06 | (b) un nombre con punto inicial se cosecha (M25) | `apps/desk/server/citas/cosecha.test.ts:14` y `apps/desk/server/citas/detector.test.ts:238` | COMPLIANT |
| 23 | 06 | (c) abreviada atribuida al fichero anterior, en los dos órdenes (M26) | `apps/desk/server/citas/detector.test.ts:264` y `apps/desk/server/citas/cosecha.test.ts:50` | COMPLIANT |
| 24 | 06 | (d) la mención pelada que resuelve captura la atribución y la que no, no (M27) | `apps/desk/server/citas/detector.test.ts:307` (válida) y `:317` (rota), ambas a través de `detectar()`; control de dos signos en `apps/desk/server/citas/cosecha.test.ts:31` | COMPLIANT |
| 25 | 06 | la abreviada rota se informa y no bloquea (M30) | `apps/desk/server/citas/detector.test.ts:112`; `generarBase` sólo recorre bloqueantes (`apps/desk/server/citas/cli.ts:124`) | COMPLIANT |
| 26 | 06 | una revisión inventada en una cita anclada bloquea | `apps/desk/server/citas/detector.test.ts:53` | COMPLIANT |
| 27 | 06 | mutación: el ancla protege del desfase de contenido (M20) | `apps/desk/server/citas/hook.test.ts:373` | COMPLIANT |
| 28 | 07 | un fichero sin trackear se ignora | `apps/desk/server/citas/hook.test.ts:212` | COMPLIANT |
| 29 | 07 | control: el mismo fichero, trackeado, bloquea | la misma prueba del nº 28 | COMPLIANT |
| 30 | 07 | una cita rota dentro de un directorio excluido se ignora | `apps/desk/server/citas/hook.test.ts:228` | COMPLIANT |
| 31 | 08 | la cita rota bloquea y la válida pasa (rojos a y b) | `apps/desk/server/citas/detector.test.ts:6` | COMPLIANT |
| 32 | 08 | extremo final fuera de rango (rojo c, M4) | `apps/desk/server/citas/detector.test.ts:29` | COMPLIANT |
| 33 | 08 | control: extremo inicial en blanco (M4) | `apps/desk/server/citas/detector.test.ts:41` | COMPLIANT |
| 34 | 09 | una entrada de la base ya reparada pone el hook en rojo (M9) | `apps/desk/server/citas/detector.test.ts:79` | COMPLIANT |
| 35 | 09 | una cita rota nueva, con la base presente, bloquea (M10) | `apps/desk/server/citas/detector.test.ts:97` | COMPLIANT |
| 36 | 09 | la base no contiene abreviadas | `apps/desk/server/citas/detector.test.ts:112` y `apps/desk/server/citas/cli.ts:124` | COMPLIANT |
| 37 | 09 | mutación de posición: la base se aplica después de decidir el bloqueo (M17) | manual: tarea 1.10 del corte 1a-i, mutación a mano sobre `detector.ts` que pone en rojo `apps/desk/server/citas/detector.test.ts:103`, revertida | COMPLIANT (manual) |
| 38 | 10 | mensaje completo: cuatro cifras, lista y frases fijas | `apps/desk/server/citas/informe.test.ts:29`, `:36` y `:47` | COMPLIANT |
| 39 | 10 | el mensaje de bloqueo nombra las dos salidas | `apps/desk/server/citas/informe.test.ts:47` | COMPLIANT |
| 40 | 10 | un fichero de texto que git cree binario se declara | `apps/desk/server/citas/hook.test.ts:444` | COMPLIANT |
| 41 | 11 | con una identidad, sin aviso | `apps/desk/server/citas/hook.test.ts:392` | COMPLIANT |
| 42 | 11 | con dos identidades, aviso sin bloquear | la misma prueba del nº 41 | COMPLIANT |
| 43 | 11 | hueco declarado: segundo clon con `--ignore-scripts` | manual: sección 8 de `DEPLOY.md` (comando manual de instalación) | COMPLIANT (manual) |
| 44 | 12 | sin `.git`, no instala | `apps/desk/server/citas/instalador.test.ts:40` | COMPLIANT |
| 45 | 12 | con `.git`, instala de verdad | `apps/desk/server/citas/instalador.test.ts:50` | COMPLIANT |
| 46 | 12 | sin binario `git` (M12) | `apps/desk/server/citas/instalador.test.ts:63` y su control en `:76` | COMPLIANT |
| 47 | 12 | `git config` falla con el repositorio presente | `apps/desk/server/citas/instalador.test.ts:89` | COMPLIANT |
| 48 | 12 | el hook sin dependencias falla en voz alta (M16) | manual: tarea 5.1, `node_modules/.bin/tsx` renombrado y hook real con `exit=1` y mensaje explícito | COMPLIANT (manual) |
| 49 | 12 | guardián estático de la invocación (control de M16) | `apps/desk/server/citas/guardianes.test.ts:91-106` (prueba positiva en `:94`, las tres mutaciones sucias en el `it.each` de `:98-106`) | COMPLIANT |
| 50 | 13 | la medición queda dentro del objetivo de 5 s | manual: tarea 5.3, seis tomas entre 1,99 y 2,83 s | COMPLIANT (manual) |
| 51 | 13 | control del tope duro de 10 s | manual: la misma medición | COMPLIANT (manual) |
| 52 | 14 | orden correcto: detector, base, IV-10 y hook | manual: tarea 5.2, reconstruida con `git log` y `sdd-attempt status` | COMPLIANT (manual) |
| 53 | 14 | mutación: instalar antes de generar la base (M18) | manual: tarea 5.2; el §8 del diseño declara M18 manual | COMPLIANT (manual) |
| 54 | 14 | comprobación final sobre lo commiteado | manual: tarea 5.4, `--sha 53c6fc5` con 0 bloqueantes; repetida por este verify sobre `dabc2db` (apartado 3) | COMPLIANT (manual) |
| 55 | 15 | IV-10 declarado sin dueño | manual: fila IV-10 de la tabla de incumplimientos vivos de `CLAUDE.md` | COMPLIANT (manual) |
| 56 | 15 | el recuento pasa de cuatro a cinco | manual: cabecera de la sección de incumplimientos vivos de `CLAUDE.md` | COMPLIANT (manual) |
| 57 | 15 | la regla de mutación 4 gana las dos frases | manual: bullets de Q6 y Q9 en la regla de mutación 4 de `CLAUDE.md` | COMPLIANT (manual) |
| 58 | 15 | mutación: un ejemplo con forma de cita bloquea (M22) | `apps/desk/server/citas/detector.test.ts:214` | COMPLIANT |
| 59 | 16 | `host:puerto` dentro de una URL no se cuenta | `apps/desk/server/citas/cosecha.test.ts:83` | COMPLIANT |
| 60 | 16 | control: una cita real con dos puntos sigue siendo cita | `apps/desk/server/citas/cosecha.test.ts:89` | COMPLIANT |
| 61 | 17 | el diseño elige la atribución y declara el hueco | manual: `design.md`, decisión D1 | COMPLIANT (manual) |
| 62 | 17 | la base generada supera la guarda de R-14 | manual: tarea 3.2, 37 entradas (≤ 100) | COMPLIANT (manual) |
| 63 | 18 | el grafo de imports de producción no llega al detector | `apps/desk/server/citas/guardianes.test.ts:51` | COMPLIANT |
| 64 | 18 | la cobertura del detector cuenta | manual: `vitest.config.ts:51-57` incluye `apps/desk/server/**` y excluye `testing/`; cobertura medida en el apartado 3 | COMPLIANT (manual) |

**Recuento:** 50 COMPLIANT con prueba automática, 14 COMPLIANT con evidencia manual, 0 PARTIAL, 0
UNTESTED y 0 FAILING. **64 de 64.**

---

## 5. Cierre de los hallazgos del verify anterior

### WARNING-1 · citas por línea entre artefactos de la tanda — CERRADO

Repetidos los dos detectores del encargo, sobre el árbol de `dabc2db` (más este propio informe, ya
escrito):

1. `git grep -nE "(apply-progress|tasks|proposal|design|spec|verify-report)\.md:[0-9]"` sobre
   `openspec/changes/hook-citas-pre-push` → **0 coincidencias** (exit 1, sin resultados). Ninguno de los
   cinco artefactos de la tanda (`proposal.md`, `spec.md`, `design.md`, `tasks.md`,
   `apply-progress.md`) cita a otro por línea con la forma completa, y este propio informe tampoco.
2. Forma abreviada (dos puntos y número entre comillas invertidas): **28 coincidencias** en el árbol
   actual — `apply-progress.md` (4), `proposal.md` (6) y este propio `verify-report.md` (18, todas
   evidencia de código citada en los apartados 3 y 4, no autocitas). Leído el referente de cada una:
   - Las 4 de `apply-progress.md` (líneas 313, 325, 326, 342) apuntan a `Dockerfile` (2, atribuidas por
     Lbc en la tabla de la sección 5.5) y a `openspec/config.yaml` (2, la fila de reparación de esa
     misma sección).
   - Las 6 de `proposal.md` (líneas 521, 537 ×3, 565, 796) **NO** apuntan todas a `Dockerfile` u
     `openspec/config.yaml`, como decía la versión anterior de este apartado: **2 apuntan a
     `vitest.config.ts`** (línea 521, «`:57`» tras «`vitest.config.ts:53`»; línea 796, «`:58-63`»), **3
     apuntan a `.dockerignore`** (línea 537, las tres abreviadas de `.git` (`:3`), `docs` (`:10`) y
     `*.md` (`:12`)) y **1 a `Dockerfile`** (línea 565, «`:10`» tras «`Dockerfile:2` en `648432d`»).
   - Las 18 de este propio informe son citas de código (`hook.test.ts`, `resolucion.test.ts`,
     `instalador.test.ts`, `informe.test.ts`, `guardianes.test.ts`, `vitest.config.ts`), consistentes con
     la convención de este mismo report: no citar líneas de otro artefacto SDD de la tanda, pero sí citar
     código, que es justo lo que exige la matriz del apartado 4.1.

**0 de las 28 apunta a otro artefacto SDD de la tanda** (propuesta, spec, diseño, tareas o progreso de
apply citándose entre sí por línea). Lo que ninguno de los dos detectores caza —comprobado, no cambia el
resultado—: una referencia a un artefacto de la tanda que dé la línea en prosa («la línea N de…»); no se
encontró ninguna al leer las secciones reescritas.

### WARNING-2 · salida literal del push de `f962e81` — CERRADO

El apartado «5.2 — M18, el orden real» de `apply-progress.md` trae la copia literal PARCIAL de la salida
del hook durante ese push (comprobadas, saltadas, abreviadas rotas por cifra, índice remoto y línea
base), con procedencia declarada (informe de turno del corte 3, pegado por Gerencia) y el recorte
declarado explícitamente (la lista completa de las 7 abreviadas rotas y cualquier línea entre
«Abreviadas rotas:» y el «To https://…» de git no está en la copia y no se reconstruye). La tarea 5.2 de
`tasks.md` quedó corregida en el mismo sentido.

### WARNING-3 · RQ-CV-06, dos escenarios sólo probados a nivel de cosecha — CERRADO

`apps/desk/server/citas/detector.test.ts` gana el bloque «RQ-CV-06 de punta a punta»
(`detector.test.ts:284-325`, tres `it`, comprobado contra el fichero: línea 284 abre el `describe` y la
325 cierra su último `it`):

- `detector.test.ts:285` — una línea con **una cita completa a `Dockerfile` seguida de una abreviada**
  (atribuida a `Dockerfile`, que no empieza por punto), y detrás la mención **pelada** de `` `.dockerignore` ``
  seguida de **dos abreviadas más** (atribuidas a `.dockerignore`, el nombre con punto inicial): tres
  abreviadas en total, dos de ellas tras el nombre con punto. No es «`Dockerfile` más tres abreviadas
  tras un nombre con punto», como decía la versión anterior de este apartado.
- `detector.test.ts:307` — la misma línea con `.dockerignore` pelado, `` `.git` `` (no trackeado) y
  `` `docs` `` (directorio), cada uno con su abreviada: las tres válidas, comprobadas, ninguna huérfana.
- `detector.test.ts:317` — la misma línea con la última abreviada fuera de rango: figura en la lista de
  abreviadas rotas y el push sale 0.

Las tres ejercen `detectar()` completo, no sólo `cosechar()`: comprueban `comprobadas`,
`saltadas.huerfanas`, `saltadas.noLegibles`, `abreviadasRotas` y `bloquea`. `apps/desk/server/citas/cosecha.test.ts`
gana el segundo signo del control que su nombre ya anunciaba, dentro del `it` que empieza en la línea 31
(el `describe` completo va de `cosecha.test.ts:21` a `:47`, comprobado contra el fichero): el primer
signo («sin (d), la abreviada queda huérfana») está en las líneas 32-37; el segundo signo («capturando
cualquier token pelado, la atribución se pierde igual») está en el comentario y el código de las líneas
39-45, no en la 39 sola, pero es ahí donde empieza. Antes sólo comprobaba el primer signo.

**Repetido de forma independiente en este verify** (no heredado de `apply-progress.md`): apliqué una
mutación equivalente a MUT-b —`NOMBRE_FICHERO` deja de admitir que un segmento empiece por punto o por
guion— sobre `apps/desk/server/citas/cosecha.ts` (backup con `sha256`
`d53e11badbe115fe68fee85c2d464c757ba82775576fbd6ad12a5c4bc52678e4`), corrí
`npx vitest run apps/desk/server/citas/detector.test.ts apps/desk/server/citas/cosecha.test.ts` y
obtuve **5 de 39 en rojo**: las tres del bloque nuevo de `detector.test.ts` (284-325) y las dos de
`cosecha.test.ts` (`(d) la mención pelada…`, líneas 21-47, incluido el control de dos signos). Restauré
el fichero con la copia de respaldo y `cmp` confirmó bytes idénticos (mismo `sha256` antes y después);
repetí la suite completa de los dos ficheros y quedó 39/39 en verde, y `git status --porcelain` sobre
`apps/desk/server/citas/` no mostró diferencias.

### SUGGESTION-1 · cobertura de ramas — CERRADA como hipótesis, no como ruido medido

Medí `npm run test:coverage` una vez para este informe (83,93 % de ramas globales) y la propia
remediación ya había medido tres tomas más sobre el mismo árbol sin tocar ningún fuente: **83,94 · 83,94
· 83,93**. La cifra global de ramas **varía entre ejecuciones** del mismo árbol. **Hipótesis, no
medida:** el origen sería la cobertura de bloques de rama que v8 informa fuera de `citas` (el módulo de
esta tanda), variando de una ejecución a otra por algo del propio instrumentador.

**Lo que sí está medido, y no explicado:** la cobertura de ramas de `apps/desk/server/citas` **bajó de
95,42 a 95,39** en esta remediación, **sin cambiar ningún fuente del módulo** — sólo se añadieron pruebas
nuevas (`detector.test.ts:284-325`, `cosecha.test.ts:39-45`). **Hipótesis, no medida:** las pruebas
nuevas hacen que v8 informe más bloques de rama sobre el mismo código, y el denominador crece más que el
numerador. Ninguna de las dos cifras pone en riesgo el umbral (ramas ≥ 78, medido siempre ≥ 83,9 en lo
global y en 95,39 en `citas`). No se declara «ruido de medición» como si estuviera comprobado: es una
hipótesis sobre una cifra medida, no una conclusión medida.

### SUGGESTION-2 · comentario falso preexistente en `Dockerfile` — SIGUE ABIERTA, a propósito

`Dockerfile:14` en `5f05466` sigue diciendo que `tsx` es `devDependency`, cuando `package.json:42` lo declara en
`dependencies`. La tarea 4.13-A1 ya lo registró como falso y fuera de alcance, y la remediación lo deja
explícitamente sin tocar («`Dockerfile:14` en `5f05466` no se toca: está registrado aparte»). Sigue sin cerrarse —
correcto: no era tarea de esta remediación ni de este verify, y forzarlo sería tocar código fuera del
encargo.

### SUGGESTION-3 · «cuatro exclusiones» en la propuesta — CERRADA

`proposal.md`, fila **M14** del §6: «**Ampliadas a SEIS** por la divergencia nº 2 del apartado 11 del
diseño: se suman la propia línea base `apps/desk/server/citas/lineaBase.jsonl` y `*.csv` (implementadas
en `apps/desk/server/citas/cli.ts:46-53`, verificado el 2026-09-15: la línea 46 abre `EXCLUSIONES` y la
53 lo cierra)». La misma frase está en la casilla correspondiente del §15. Comprobado contra
`cli.ts:46-53`: el array `EXCLUSIONES` tiene exactamente 6 elementos.

---

## 6. Mutaciones que repetí yo mismo en este verify

| Mutación | Fichero | Qué cambia | Resultado | Restauración |
|---|---|---|---|---|
| Variante de MUT-b (WARNING-3) | `apps/desk/server/citas/cosecha.ts` | `NOMBRE_FICHERO` deja de admitir punto o guion como primer carácter de un segmento | 5/39 rojas en `detector.test.ts` + `cosecha.test.ts` (las tres del bloque «RQ-CV-06 de punta a punta» y las dos de «(d)» en `cosecha.test.ts`) | Copia de respaldo restaurada; `cmp` bytes idénticos; mismo `sha256` (`d53e11b…`) antes y después; 39/39 verdes al repetir |

No repetí M9/M17 (RQ-CV-09) ni el resto de mutaciones ya cerradas en cortes anteriores: sus salidas
literales están documentadas en `apply-progress.md` con rojo real, control del otro signo y restauración
por `cmp`, y ya las revisó el verify anterior sin CRITICAL. Repetir sólo la del hallazgo remediado
(WARNING-3) es lo que este encargo pedía comprobar de forma independiente.

---

## 7. Criterios de aceptación (apartado 15 de la propuesta)

Todas las casillas se cumplen, incluida la que estaba incumplida en el verify anterior:

- **Antes incumplida, ahora cumplida:** «Ningún artefacto de la tanda cita sus propias líneas ni las de
  otro artefacto de la tanda» — WARNING-1, cerrada (apartado 5).

El resto (precondición de entrega, ubicación fuera de `testing/`, grafo de imports, barrido completo,
M29, lote único de anclas, índice remoto, invocación del hook sin `npx`, precedencia exacta, dos
extremos del rango, cuatro cifras del mensaje, abreviadas informativas y M30, aviso de escalada, base
generada y fechada que sólo encoge, seis exclusiones, `prepare` en `.mjs`, mutación de dos signos M11,
`git config` fallido que no tumba `npm ci`, `DEPLOY.md`, precondición dura repetida sobre lo commiteado,
anclaje a `648432d`, anclas sin partir, coste medido, mutaciones ejecutadas, IV-10, frases nuevas de la
regla 4, ejemplo del archivo sin forma de cita, comandos en verde y tareas de persona fuera del recuento)
se comprobó contra código, pruebas o el estado actual de `CLAUDE.md`, `openspec/config.yaml`,
`package.json`, `.gitattributes`, `DEPLOY.md` y `Dockerfile`.

---

## 8. Cumplimiento TDD (strict_tdd)

| Comprobación | Resultado | Detalle |
|---|---|---|
| Evidencia TDD registrada | Sí | Cortes 1-4 traen RED, GREEN y MUT con salida literal del error, incluida la sección de remediación de WARNING-3; Fase 5 trae su propia tabla y explica por qué el ciclo RED→GREEN→REFACTOR no aplica a tareas manuales o documentales |
| Todas las tareas tienen prueba | Sí | 102/102; sólo las de la fase 5 (manuales, justificadas) no tienen fichero propio |
| RED confirmado: los ficheros de prueba existen | Sí | Los **7** ficheros `apps/desk/server/citas/*.test.ts` existen y corrieron en este verify (1.111 pruebas, apartado 3) |
| GREEN confirmado en ejecución real | Sí | Los 7 pasan al 100 % en `npm test` |
| Triangulación | Sí | Cada mutación M1-M30 (sin M6, retirada) trae el control del signo contrario con salida distinta; la mutación de WARNING-3 repetida en este verify confirma triangulación real, no aparente |
| Red de seguridad en los ficheros modificados | Sí | La mutación de `cosecha.ts` en la remediación se restauró y comprobó byte a byte (`cmp`), igual que las de los cortes anteriores |

---

## 9. Capas de prueba

| Capa | Pruebas | Ficheros |
|---|---|---|
| En memoria, sin procesos | 49 (27 + 12 + 6 + 4) | `detector.test.ts`, `cosecha.test.ts`, `resolucion.test.ts`, `informe.test.ts` |
| Repositorio git temporal real | 45 (25 + 6 + 14) | `hook.test.ts`, `instalador.test.ts`, `guardianes.test.ts` |
| Manual o documental (fase 5) | — | ejecución directa del hook, reproducida en el apartado 3 |
| **Total del módulo** | **94 pruebas en 7 ficheros** | |

No hay pruebas de integración HTTP ni E2E, y es lo correcto: el detector no tiene interfaz ni llamadas
de red, y `apps/desk/src` no interviene en esta capacidad.

---

## 10. Cobertura por fichero (`apps/desk/server/citas/`)

| Fichero | Sentencias | Ramas | Funciones | Líneas | Sin cubrir (según v8) |
|---|---|---|---|---|---|
| `cli.ts` | 96,69 % | 90,76 % | 88,88 % | 96,69 % | bloque final de autoejecución como punto de entrada, no alcanzable en proceso |
| `cosecha.ts` | 100 % | 90,24 % | 100 % | 100 % | ramas defensivas |
| `detector.ts` | 100 % | 99,13 % | 100 % | 100 % | una rama |
| `git.ts` | 100 % | 94,59 % | 100 % | 100 % | dos ramas |
| `informe.ts` | 100 % | 100 % | 100 % | 100 % | — |
| `resolucion.ts` | 100 % | 97,29 % | 100 % | 100 % | una rama |

Ningún fichero queda por debajo de los umbrales globales.

---

## 11. Calidad de las aserciones

- Tautologías: 0.
- Comprobaciones de mera presencia en el DOM: no aplica (no hay componentes).
- Las tres pruebas nuevas de la remediación (`detector.test.ts:285`, `:307`, `:317`) ejercen `detectar()`
  completo y afirman sobre `comprobadas`, `saltadas.huerfanas`, `saltadas.noLegibles`, `abreviadasRotas`
  y `bloquea` a la vez: no son aserciones triviales ni de sólo tipo.
- Los nombres de los casos describen comportamiento, no implementación.

**Calidad de las aserciones**: ✅ sin hallazgos nuevos.

---

## 12. Métricas de calidad

Linter: 0 errores y 158 avisos; los que muestra la salida son de `packages/zoho-sync/`, fuera del módulo
de esta tanda. Tipos: `exit 0`.

---

## 13. Hallazgos

### CRITICAL

**Ninguno.** Se evaluaron las tres condiciones que la skill de verify trata como CRITICAL y ninguna se
da: (1) no hay tareas marcadas como completas sin evidencia (102/102 con evidencia de cierre); (2) ningún
comando termina con código distinto de cero (apartado 3); (3) ningún escenario queda sin cubrir ni en
rojo (apartado 4.1: 0 UNTESTED, 0 FAILING, 0 PARTIAL).

### WARNING

**Ninguno.** Los tres del verify anterior están cerrados y comprobados de forma independiente (apartado
5).

### SUGGESTION

- **SUGGESTION-2 (abierta, a propósito) · comentario falso preexistente en `Dockerfile`.** `Dockerfile:14` en `5f05466`
  dice «tsx es devDep», pero `package.json:42` lo declara en `dependencies`. Fuera de alcance por decisión
  explícita de la tanda (4.13-A1) y de esta remediación.

Las otras dos SUGGESTION del verify anterior (cobertura de ramas y «cuatro exclusiones») están cerradas,
apartado 5. La de cobertura se cierra como hipótesis sobre una cifra medida, no como ruido confirmado.

---

## 14. Validación del sobre

Antes de persistir, este informe se pasó por `gentle-ai sdd-verify-validate`. Salida literal, capturada
contra la versión de este mismo fichero inmediatamente anterior a rellenar este apartado (mismo YAML,
mismo veredicto y mismas cifras; el propio validador no depende del texto de este apartado, sólo del
sobre): pegada aquí sin editar, y repetida una vez más justo antes de persistir para confirmar que los
bytes finales siguen validando (apartado de cierre de la respuesta de esta fase).

```text
Comando: gentle-ai sdd-verify-validate --input <ruta> --requirements 18 --scenarios 64
{
  "valid": true,
  "verdict": "pass",
  "evidence_revision": "sha256:724e4c5d21959f247ecee51af8d93c76433002658f2d99da0e0f6ed7b4c01ce9"
}
```

---

## 15. Conclusión

La capacidad `citas-verificables` cumple su spec: **18/18 requisitos, 64/64 escenarios**, 102/102 tareas,
los cinco comandos de la 5.6 en verde con cifras propias de este verify y RQ-CV-14 reproducido sobre
`dabc2db`. Los tres WARNING y las dos SUGGESTION cerrables del verify anterior están cerrados y
verificados de forma independiente, incluida una repetición propia de la mutación de WARNING-3. Queda
abierta, a propósito y fuera de alcance, la SUGGESTION-2 sobre el comentario del `Dockerfile`.

**Estado nativo medido ahora** (`gentle-ai sdd-status hook-citas-pre-push --cwd . --json`, tras persistir
este informe): `remediationState.required: false`, `dependencies.verify: all_done`,
`dependencies.archive: ready`, `nextRecommended: archive`. La versión anterior de esta conclusión decía
que el estado nativo «sigue mostrando `remediationState.required: true`»: eso era cierto sólo ANTES de
persistir el informe (apartado 2, con la evidencia fallida anterior todavía activa); una vez persistido
este informe en `pass`, el ciclo nativo consumió la `evidence_revision` nueva y despejó la marca por sí
mismo, sin ninguna acción adicional de este verify.

**Siguiente paso recomendado:** `sdd-archive`.
