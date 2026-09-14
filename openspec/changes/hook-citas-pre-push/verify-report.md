```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:400a38b98ec9ccdbe5d96ae762ac4441f3e3691e7aa45d968fd1d4b11a00fc73
verdict: fail
blockers: 0
critical_findings: 0
requirements: 18/18
scenarios: 62/64
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:74013b6ecf8d939a6f5b517e5c6f5afdaa5f6507c75e58404273e6db1cb5dff6
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:54079bee2e53effae66943ef329de5f32b9bf78a25d3eb637a5e676deb4b1c90
```

# Informe de verificación — hook-citas-pre-push

**Sobre del resultado:** `test_output_hash` y `build_output_hash` son el sha256 de la salida completa
(stdout y stderr) de `npm test` y `npm run build` ejecutados sobre `b861065`, el commit de la primera
versión de este informe, que no cambia código. `evidence_revision` es el sha256 de las dos salidas
concatenadas, primero la de test y después la de build. `scenarios: 62/64` porque dos escenarios son
PARTIAL (WARNING-3).

**Fase**: sdd-verify · **Rama**: `main` · **HEAD verificado**: `a4d5b81` (= `origin/main`); test y build del
sobre, repetidos sobre `b861065`
**Preflight** (`openspec/config.yaml:25-30`): interactive · hybrid · ask-on-risk · 800 líneas · strict_tdd
**Modo de verificación**: artefactos completos (propuesta, spec, diseño, tareas y progreso de apply).
`gentle-ai sdd-status`: 102/102 tareas, apply `all_done`, verify `ready`.

Convención de este informe: no cita líneas de ningún artefacto de la tanda (convención 2 de la
propuesta). Los nombra por apartado, tarea o identificador. Las citas a código van contra `a4d5b81`.

## Veredicto: FAIL — por evidencia incompleta, sin bloqueantes ni CRITICAL

**0 CRITICAL · 3 WARNING · 3 SUGGESTION.**

El veredicto es FAIL porque dos de los 64 escenarios están cubiertos sólo en parte (WARNING-3). El
validador nativo (`gentle-ai sdd-verify-validate`) rechaza un veredicto aprobatorio con `scenarios`
incompleto: «passing verdict contradicts failing or incomplete evidence». Contar esos dos como
cubiertos sería falso: los escenarios dicen «WHEN corre el hook» y las pruebas sólo ejercen la cosecha.
No hay nada roto. Lo que falta es una prueba de integración, y la tanda no es archivable hasta que
exista (o hasta que alguien con autoridad reescriba esos dos escenarios).

Los 18 requisitos de la spec están implementados y probados, las 102 tareas están cerradas y los cinco
comandos de la tarea 5.6 dan `exit 0` con cifras propias de este verify. De los 64 escenarios, 62 están
cubiertos (48 con prueba automática y 14 con evidencia manual verificable) y 2 sólo en parte
(WARNING-3). Hay **un criterio de aceptación de la propuesta incumplido** (WARNING-1: los artefactos de
la tanda se citan entre sí por línea) y una afirmación imprecisa sobre la evidencia del push de
`f962e81` (WARNING-2). Ninguno de los tres cambia el comportamiento del detector ni del hook. Aquí se
registran y no se reparan, porque verify es de sólo lectura.

---

## 1. Artefactos leídos

| Artefacto | Estado |
|---|---|
| `proposal.md` (1.068 líneas) | Leído completo |
| `specs/citas-verificables/spec.md` (754 líneas) | Leído completo |
| `design.md` (631 líneas) | Leído completo |
| `tasks.md` (630 líneas) | Leído completo |
| `apply-progress.md` (992 líneas) + Engram obs. 535 | Corte 4 leído completo; cortes 1-3 contrastados con `tasks.md` |
| Engram obs. 533 (`sdd/hook-citas-pre-push/tasks`) | Leído |
| Engram obs. 558 y 559 | Leídas completas; ver apartado 12 |
| `gentle-ai sdd-status hook-citas-pre-push --json` | Ejecutado |

---

## 2. Estado nativo

`taskProgress`: 102 total, 102 completas, 0 pendientes. Dependencias: proposal, specs, design, tasks y
apply en `all_done`; verify `ready`; archive `blocked`, que es lo esperado mientras no exista este
informe. Las dos tareas de PERSONA (P.1 y P.2) están fuera del recuento, con dueño y registro, como
exige la regla del ciclo 1 de `CLAUDE.md`.

---

## 3. Comandos ejecutados por este verify — cifras propias (tarea 5.6)

Ejecutados de nuevo desde la raíz del repositorio sobre `a4d5b81`, sin reutilizar las cifras del
progreso de apply, y comparados con las que registró el corte 4:

| Comando | Cifra de este verify | Cifra del corte 4 | ¿Coincide? |
|---|---|---|---|
| `npm test` | 120 ficheros pasan, 1 omitido (121); 1.108 pruebas pasan, 2 omitidas (1.110); `exit 0` | 1.108 pasan, 2 omitidas (120/121 ficheros) | Sí |
| `npm run typecheck` | sin salida; `exit 0` | `exit 0` | Sí |
| `npm run lint` | 0 errores, 158 avisos; `exit 0` | 0 errores, 158 avisos | Sí, justo en el trinquete de 158 |
| `npm run build` | `vite build` completo en 2,33 s; `exit 0` | `exit 0` en 1,67 s | Sí (el tiempo no es criterio) |
| `npm run test:coverage` | `exit 0`. Global: 94,79 % sentencias, 83,96 % ramas, 98,2 % funciones, 94,79 % líneas. `apps/desk/server/citas`: 99,23 % / 95,42 % / 97,29 % / 99,23 % | Global 94,79 / 83,95 / 98,2 / 94,79; `citas` 99,23 / 95,42 / 97,29 / 99,23 | Sí, salvo 0,01 pp en ramas (SUGGESTION-1) |

Los umbrales de `vitest.config.ts:58-63` (líneas 92, sentencias 92, funciones 96, ramas 78) quedan
superados con margen.

**Comprobación adicional:** el detector se ejecutó de nuevo con `--sha HEAD` sobre `a4d5b81`, un commit
posterior al de la tarea 5.4. Resultado: 1.766 comprobadas, 1.599 saltadas, 3 fuera del repositorio, 7
abreviadas rotas, 7 que no son citas, 0 textos binarios para git, índice remoto `origin/main`, línea
base con 37 informadas y 0 caducadas, **0 bloqueantes**, `exit 0`. No se repitió la mutación de la
tarea 5.1 (renombrar el binario de `tsx`): ya la hicieron dos actores distintos, con `sha256` idéntico
antes y después, y repetirla sobre el binario real añade riesgo sin aportar señal nueva.

---

## 4. Matriz de requisitos (RQ-CV-01 a RQ-CV-18)

| Requisito | Estado | Evidencia |
|---|---|---|
| RQ-CV-01 · barrido completo del sha local, lectura en lote | PASS | `apps/desk/server/citas/cli.ts:164` (el barrido es del árbol completo, nunca de lo que cambia el push, M29); pruebas verdes de `hook.test.ts` para M1 y M29 |
| RQ-CV-02 · coincidencia exacta antes que sufijo | PASS | `resolverToken` en `resolucion.ts`; tareas 1.32-1.34 con mutación de posición revertida |
| RQ-CV-03 · la ambigua sólo bloquea si está rota en todas sus candidatas | PASS | `resolverToken` más la resolución propia de las ancladas; tarea 3.9 con mutación revertida y `sha256` comprobado |
| RQ-CV-04 · «fuera del repositorio» con cifra propia | PASS | `apps/desk/server/citas/detector.ts:59`; reproducido por este verify (cifra 3) |
| RQ-CV-05 · índice remoto, directorios, con y sin barra | PASS | orden D4 en `resolucion.ts`; `indiceRemoto` e `indiceRemotoUnido` en `cli.ts`; pruebas verdes «rojo g y M7» y «rama nueva» |
| RQ-CV-06 · abreviada informativa; completa anclada por revisión | PASS, con hueco declarado | atribución en `cosecha.ts`; la decisión D1 del diseño declara y acepta las abreviadas huérfanas |
| RQ-CV-07 · sólo lo trackeado, más exclusiones | PASS | `apps/desk/server/citas/cli.ts:46-53`: seis exclusiones (línea base, `openspec/changes/archive/`, `superpowers-main`, `.agent/skills/`, `docs/artefactos/`, `*.csv`), según la divergencia nº 2 del apartado 11 del diseño. Ver SUGGESTION-3 |
| RQ-CV-08 · fichero, rango y línea vacía; los dos extremos por separado | PASS | `apps/desk/server/citas/detector.ts:109-115` (función `rotura`) |
| RQ-CV-09 · la base sólo encoge, se genera y no crece desde el hook | PASS | `lineaBase.jsonl` con 37 líneas; `leerBase` y `generarBase` en `cli.ts` |
| RQ-CV-10 · mensaje con cuatro cifras y frases fijas | PASS | `apps/desk/server/citas/informe.ts:34-54` |
| RQ-CV-11 · aviso de escalada sin bloquear | PASS | `apps/desk/server/citas/cli.ts:71-75` (`avisoDeEscalada`); prueba verde M21 |
| RQ-CV-12 · instalador `.mjs` con guarda de dos signos | PASS | `scripts/instalar-hooks.mjs`; `instalador.test.ts`, 6/6 verdes |
| RQ-CV-13 · coste: objetivo 5 s, tope 10 s | PASS por registro de la tanda | M19 es manual según el apartado 8 del diseño; el corte 4 registró 1,99-2,83 s en seis tomas. Este verify no lo volvió a cronometrar |
| RQ-CV-14 · 0 bloqueantes antes de instalar y otra vez sobre lo commiteado | PASS, reproducido | apartado 3: `--sha HEAD` sobre `a4d5b81`, 0 bloqueantes |
| RQ-CV-15 · IV-10 sin dueño y dos frases nuevas en la regla de mutación 4 | PASS | `CLAUDE.md` vigente: cinco desvíos vivos, fila IV-10 con la frase de Q4 y la de `--no-verify`, y las frases de Q6 y Q9 en la regla 4; `openspec/config.yaml` con la entrada IV-10 |
| RQ-CV-16 · host y puerto no cuentan como cita | PASS | `cosecha.ts`; tareas 1.24-1.25 con rojo y verde |
| RQ-CV-17 · el diseño declara los huecos | PASS | apartado 1 del diseño, D1-D3 |
| RQ-CV-18 · vive fuera de `testing/` y nada de producción lo importa | PASS | `apps/desk/server/citas/informe.ts:4-6` lo declara; `guardianes.test.ts` (14/14) recorre el grafo de imports desde `apps/desk/server/index.ts` |

**18 de 18.**

### 4.1 Matriz por escenario (64)

Cada fila da el `it` que ejerce el escenario, leyendo su cuerpo y no sólo el nombre. Ninguna de las
pruebas citadas está marcada `.skip`, `.todo` ni `it.fails`. «Manual» quiere decir evidencia
verificable fuera de la suite: una tarea de la fase 5 con su comprobación, o un fichero real.

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
| 11 | 03 | rota en todas sus candidatas | `apps/desk/server/citas/detector.test.ts:296` | COMPLIANT |
| 12 | 03 | válida en una sola candidata | `apps/desk/server/citas/detector.test.ts:302` | COMPLIANT |
| 13 | 04 | una ruta `~/` se salta en su propia cifra | `apps/desk/server/citas/cosecha.test.ts:89` y la invariante de conservación de `hook.test.ts` | COMPLIANT |
| 14 | 04 | control: la ruta relativa que no resuelve sigue bloqueando | `apps/desk/server/citas/cosecha.test.ts:95` y `apps/desk/server/citas/detector.test.ts:285` | COMPLIANT |
| 15 | 04 | mutación: quitar la categoría (M28) | la misma prueba del nº 13 | COMPLIANT |
| 16 | 05 | la cita pelada a un fichero renombrado bloquea (M7) | pruebas de los nº 3 y nº 4 | COMPLIANT |
| 17 | 05 | un token sin barra que no resuelve se informa | `apps/desk/server/citas/detector.test.ts:285` | COMPLIANT |
| 18 | 05 | un token con barra que no resuelve bloquea | la misma prueba del nº 17 | COMPLIANT |
| 19 | 05 | un token que resuelve a directorio se salta | `apps/desk/server/citas/resolucion.test.ts:27` | COMPLIANT |
| 20 | 06 | abreviadas tras un nombre con punto inicial: todas comprobadas | `apps/desk/server/citas/cosecha.test.ts:22`, sólo a nivel de cosecha | **PARTIAL** |
| 21 | 06 | (a) un nombre sin extensión se cosecha y se comprueba (M24) | `apps/desk/server/citas/cosecha.test.ts:8` y `apps/desk/server/citas/detector.test.ts:238` | COMPLIANT |
| 22 | 06 | (b) un nombre con punto inicial se cosecha (M25) | `apps/desk/server/citas/cosecha.test.ts:14` y `apps/desk/server/citas/detector.test.ts:238` | COMPLIANT |
| 23 | 06 | (c) abreviada atribuida al fichero anterior, en los dos órdenes (M26) | `apps/desk/server/citas/detector.test.ts:264` y `apps/desk/server/citas/cosecha.test.ts:42` | COMPLIANT |
| 24 | 06 | (d) la mención pelada que resuelve captura la atribución y la que no, no (M27) | `apps/desk/server/citas/cosecha.test.ts:22` y `apps/desk/server/citas/cosecha.test.ts:31`, sólo a nivel de cosecha | **PARTIAL** |
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
| 37 | 09 | mutación de posición: la base se aplica después de decidir el bloqueo (M17) | manual: «MUT 1.10» del corte 1, mutación a mano sobre `detector.ts` que pone en rojo `apps/desk/server/citas/detector.test.ts:103`, revertida | COMPLIANT (manual) |
| 38 | 10 | mensaje completo: cuatro cifras, lista y frases fijas | `apps/desk/server/citas/informe.test.ts:29`, `:42` y `:47` | COMPLIANT |
| 39 | 10 | el mensaje de bloqueo nombra las dos salidas | `apps/desk/server/citas/informe.test.ts:47` | COMPLIANT |
| 40 | 10 | un fichero de texto que git cree binario se declara | `apps/desk/server/citas/hook.test.ts:444` | COMPLIANT |
| 41 | 11 | con una identidad, sin aviso | `apps/desk/server/citas/hook.test.ts:392` | COMPLIANT |
| 42 | 11 | con dos identidades, aviso sin bloquear | la misma prueba del nº 41 | COMPLIANT |
| 43 | 11 | hueco declarado: segundo clon con `--ignore-scripts` | manual: `DEPLOY.md:204` (apartado 8, con el comando manual) | COMPLIANT (manual) |
| 44 | 12 | sin `.git`, no instala | `apps/desk/server/citas/instalador.test.ts:40` | COMPLIANT |
| 45 | 12 | con `.git`, instala de verdad | `apps/desk/server/citas/instalador.test.ts:50` | COMPLIANT |
| 46 | 12 | sin binario `git` (M12) | `apps/desk/server/citas/instalador.test.ts:63` y su control en `:76` | COMPLIANT |
| 47 | 12 | `git config` falla con el repositorio presente | `apps/desk/server/citas/instalador.test.ts:89` | COMPLIANT |
| 48 | 12 | el hook sin dependencias falla en voz alta (M16) | manual: tarea 5.1, `tsx` renombrado y hook real con `exit=1` y mensaje explícito | COMPLIANT (manual) |
| 49 | 12 | guardián estático de la invocación (control de M16) | `apps/desk/server/citas/guardianes.test.ts:94` | COMPLIANT |
| 50 | 13 | la medición queda dentro del objetivo de 5 s | manual: tarea 5.3, seis tomas entre 1,99 y 2,83 s | COMPLIANT (manual) |
| 51 | 13 | control del tope duro de 10 s | manual: la misma medición | COMPLIANT (manual) |
| 52 | 14 | orden correcto: detector, base, IV-10 y hook | manual: tarea 5.2, reconstruida con `git log` y `sdd-attempt status` | COMPLIANT (manual) |
| 53 | 14 | mutación: instalar antes de generar la base (M18) | manual: tarea 5.2; el apartado 8 del diseño declara M18 manual | COMPLIANT (manual) |
| 54 | 14 | comprobación final sobre lo commiteado | manual: tarea 5.4, `--sha 53c6fc5` con 0 bloqueantes; repetida por este verify sobre `a4d5b81` | COMPLIANT (manual) |
| 55 | 15 | IV-10 declarado sin dueño | manual: `CLAUDE.md:272` | COMPLIANT (manual) |
| 56 | 15 | el recuento pasa de cuatro a cinco | manual: `CLAUDE.md:255` | COMPLIANT (manual) |
| 57 | 15 | la regla de mutación 4 gana las dos frases | manual: `CLAUDE.md:185` (Q6) y `CLAUDE.md:188` (Q9) | COMPLIANT (manual) |
| 58 | 15 | mutación: un ejemplo con forma de cita bloquea (M22) | `apps/desk/server/citas/detector.test.ts:214` | COMPLIANT |
| 59 | 16 | `host:puerto` dentro de una URL no se cuenta | `apps/desk/server/citas/cosecha.test.ts:75` | COMPLIANT |
| 60 | 16 | control: una cita real con dos puntos sigue siendo cita | `apps/desk/server/citas/cosecha.test.ts:81` | COMPLIANT |
| 61 | 17 | el diseño elige la atribución y declara el hueco | manual: decisión D1 del diseño | COMPLIANT (manual) |
| 62 | 17 | la base generada supera la guarda de R-14 | manual: tarea 3.2, 37 entradas (≤ 100) | COMPLIANT (manual) |
| 63 | 18 | el grafo de imports de producción no llega al detector | `apps/desk/server/citas/guardianes.test.ts:51` | COMPLIANT |
| 64 | 18 | la cobertura del detector cuenta | manual: `vitest.config.ts:51-57` incluye `apps/desk/server/**`, y la cobertura medida en el apartado 3 | COMPLIANT (manual) |

**Recuento:** 48 COMPLIANT con prueba automática, 14 COMPLIANT con evidencia manual, 2 PARTIAL, 0
UNTESTED y 0 FAILING. **62 de 64.**

---

## 5. Criterios de aceptación (apartado 15 de la propuesta)

Todas las casillas se cumplen **salvo una**:

- **Incumplida:** «Ningún artefacto de la tanda cita sus propias líneas ni las de otro artefacto de la
  tanda». Ver WARNING-1.

El resto (precondición de entrega, ubicación fuera de `testing/`, grafo de imports, barrido completo,
M29, lote único de anclas, índice remoto, invocación del hook sin `npx`, precedencia exacta, dos
extremos del rango, cuatro cifras del mensaje, abreviadas informativas y M30, aviso de escalada, base
generada y fechada que sólo encoge, exclusiones, `prepare` en `.mjs`, mutación de dos signos M11,
`git config` fallido que no tumba `npm ci`, `DEPLOY.md`, precondición dura repetida sobre lo commiteado,
anclaje a `648432d`, anclas sin partir, coste medido, mutaciones ejecutadas, IV-10, frases nuevas de la
regla 4, ejemplo del archivo sin forma de cita, comandos en verde y tareas de persona fuera del recuento)
se ha comprobado contra código, pruebas o el estado actual de `CLAUDE.md`, `openspec/config.yaml`,
`package.json`, `.gitattributes`, `DEPLOY.md` y `Dockerfile`.

---

## 6. Cumplimiento TDD (strict_tdd)

| Comprobación | Resultado | Detalle |
|---|---|---|
| Evidencia TDD registrada | Sí | Las fases 1-4 traen RED, GREEN y MUT con la salida literal del error; la fase 5 trae su tabla y explica por qué el ciclo no aplica a tareas manuales o documentales |
| Todas las tareas tienen prueba | Sí | 102/102; sólo las de la fase 5 (manuales, justificadas) no tienen fichero propio |
| RED confirmado: los ficheros de prueba existen | Sí | Los **7** ficheros `apps/desk/server/citas/*.test.ts` existen y corrieron en este verify |
| GREEN confirmado en ejecución real | Sí | Los 7 pasan al 100 % en `npm test` (91 pruebas; apartado 7) |
| Triangulación | Sí | Cada mutación M1-M30 (sin M6, retirada) trae el control del signo contrario con salida distinta |
| Red de seguridad en los ficheros modificados | Sí | Los defectos cerrados en código propio (tareas 2.0, 2.26, 3.8 y 3.9) traen su mutación sobre el fichero real, restaurada y comprobada byte a byte |

---

## 7. Capas de prueba

| Capa | Pruebas | Ficheros |
|---|---|---|
| En memoria, sin procesos | 46 (24 + 12 + 6 + 4) | `detector.test.ts`, `cosecha.test.ts`, `resolucion.test.ts`, `informe.test.ts` |
| Repositorio git temporal real | 45 (25 + 6 + 14) | `hook.test.ts`, `instalador.test.ts`, `guardianes.test.ts` |
| Manual o documental (fase 5) | — | ejecución directa del hook, reproducida en el apartado 3 |
| **Total del módulo** | **91 pruebas en 7 ficheros** | |

No hay pruebas de integración HTTP ni E2E, y es lo correcto: el detector no tiene interfaz ni llamadas
de red, y `apps/desk/src` no interviene en esta capacidad.

---

## 8. Cobertura por fichero (`apps/desk/server/citas/`)

| Fichero | Sentencias | Ramas | Funciones | Líneas | Sin cubrir (según v8) |
|---|---|---|---|---|---|
| `cli.ts` | 96,69 % | 90,76 % | 88,88 % | 96,69 % | bloque final de autoejecución como punto de entrada, no alcanzable en proceso |
| `cosecha.ts` | 100 % | 90,47 % | 100 % | 100 % | ramas defensivas |
| `detector.ts` | 100 % | 99,13 % | 100 % | 100 % | una rama |
| `git.ts` | 100 % | 94,59 % | 100 % | 100 % | dos ramas |
| `informe.ts` | 100 % | 100 % | 100 % | 100 % | — |
| `resolucion.ts` | 100 % | 97,36 % | 100 % | 100 % | una rama |

Ningún fichero queda por debajo de los umbrales globales.

---

## 9. Calidad de las aserciones

- Tautologías: 0.
- Comprobaciones de mera presencia en el DOM: no aplica (no hay componentes).
- Aserciones por caso: de 1,17 (`resolucion.test.ts`, 7 en 6 casos) a 3,12 (`hook.test.ts`, 78 en 25
  casos). Ningún caso sin aserción.
- Los nombres de los casos describen comportamiento, no implementación.

---

## 10. Métricas de calidad

Linter: 0 errores y 158 avisos; los que muestra la salida son de `packages/zoho-sync/`, fuera del
módulo de esta tanda. Tipos: `exit 0`.

---

## 11. Hallazgos

### CRITICAL

**Ninguno.** Se evaluaron las tres condiciones que la skill de verify trata como CRITICAL y ninguna se da:
(1) no hay tareas marcadas como completas sin evidencia (102/102 con evidencia de cierre); (2) ningún
comando termina con código distinto de cero (apartado 3); (3) ningún escenario queda sin cubrir ni en
rojo (apartado 4.1: 0 UNTESTED y 0 FAILING; los 2 PARTIAL van en WARNING-3).

### WARNING

#### WARNING-1 · Los artefactos de la tanda se citan entre sí por línea (criterio de aceptación incumplido)

**Criterio:** convención 2 de la cabecera de la propuesta y la casilla del apartado 15, «Ningún artefacto
de la tanda cita sus propias líneas ni las de otro artefacto de la tanda». Además, la cabecera
«Fuentes» de `tasks.md` afirma que ninguna cita a este cambio lleva línea y que las referencias entre
artefactos van por identificador. El propio fichero lo contradice en su fase 5.

**Medición.** Hacen falta dos detectores, porque ninguno caza solo todo lo que abarca la afirmación:

1. Forma completa, `grep -noE "(apply-progress|proposal|design|tasks|spec)\.md:[0-9]+(-[0-9]+)?"` sobre
   la carpeta del cambio en `a4d5b81`: **19 coincidencias**.
2. Forma abreviada (dos puntos y número entre comillas invertidas): hay 16 en los cinco artefactos. Se
   leyó el referente de cada una en su frase. **6 apuntan a un artefacto de la tanda**, y las otras 10
   apuntan a `Dockerfile`, `.dockerignore`, `vitest.config.ts` u `openspec/config.yaml`.

**Total: 25 citas por línea entre artefactos de la tanda.** Dónde están, por apartado:

| Documento que cita | Apartado o tarea | Citas | A qué artefacto apuntan |
|---|---|---|---|
| `apply-progress.md` | corte 4, «TDD Cycle Evidence» | 1 completa + 1 abreviada | `design.md` |
| `apply-progress.md` | corte 4, «5.2 — M18, el orden real» | 2 completas | el propio `apply-progress.md` |
| `apply-progress.md` | corte 4, «5.5 — Anclaje de citas a los seis destinos» (tablas «Antes» y «Reparación», y nota de método) | 12 completas | `proposal.md` (8), el propio `apply-progress.md` (3) y `design.md` (1) |
| `apply-progress.md` | corte 4, «5.5», frase final que dice que «las tres autocitas» se renumeraron | 3 abreviadas | el propio `apply-progress.md` |
| `tasks.md` | tarea 5.2 | 2 completas | `apply-progress.md` |
| `tasks.md` | tarea 5.5 | 2 completas + 2 abreviadas | `proposal.md` (3) y `apply-progress.md` (1) |

**Qué no caza ninguno de los dos detectores:** una referencia a un artefacto de la tanda que dé la línea
en prosa («la línea N de…»). No se buscó.

**Por qué el hook no lo ve:** las 25 resuelven hoy a líneas que existen y no están vacías, así que el
detector las da por buenas. La convención no prohíbe citas rotas: prohíbe esta forma de cita, porque no
hay revisión a la que anclarla y se rompe con la siguiente edición. El corte 4 detectó el patrón (nota
de método del apartado 5.5), pero lo trató como un problema de desfase bajo la regla de mutación 4 y
**renumeró las autocitas**, que es justo lo que la convención quería evitar.

**Por qué WARNING y no CRITICAL:** no cambia el comportamiento de nada ejecutable. `--sha HEAD` sobre
`a4d5b81` no las da como bloqueantes. Cuando el cambio se archive, la carpeta pasa a
`openspec/changes/archive/`, que `apps/desk/server/citas/cli.ts:48` excluye del barrido, así que
tampoco podrán bloquear un push futuro. Pero **el criterio sigue incumplido**, y archivar no lo cumple:
sólo deja de vigilarlo.

**Remedio recomendado (no aplicado):** reescribir las 25 en prosa, nombrando el apartado, la tarea o el
identificador (RQ-CV-NN, M-NN, D-NN) en lugar del número de línea. Por ejemplo, en vez del número de la
fila de reparación de `openspec/config.yaml`, «la fila de reparación de `openspec/config.yaml` del
apartado 5.5». Aplicar el remedio en `tasks.md` y `apply-progress.md` no cambia código.

#### WARNING-2 · La salida del hook en el push de `f962e81` tiene registro, pero resumido y no literal

El apartado 5.2 del progreso de apply («Push de cierre») y la tarea 5.2 de `tasks.md` dicen que la
salida literal del hook durante ese push «no quedó registrada en ningún artefacto de la tanda» y que no
se reconstruye.

Evidencia comprobada en Engram:

- **Obs. 558** («hook-citas: corte 3 cerrado (f962e81)…»), literal: «el primer `git push` real ejecutó el
  hook, que salió 0 (37 informadas, 0 bloqueantes), push en 5 s».
- **Obs. 559** («hook-citas-pre-push: implementación cerrada (f962e81)…»), literal: «empujado CON el hook
  (salida 0, informe con 1.755 comprobadas y 37 informadas)».

**Evidencia PARCIAL, con el recorte declarado:** las dos observaciones son resúmenes numéricos (salida
0, 1.755 comprobadas, 37 informadas, 0 bloqueantes), no el bloque que imprime el hook. El analista
refiere una copia literal parcial, con la lista de abreviadas recortada con «…», en el informe de turno
del corte 3. Ese informe no está en ningún artefacto del repositorio, ni en Engram en forma literal. No
se reconstruye.

**Imprecisión:** «no registrada» es inexacto. Hay registro de las cifras clave; lo que falta es la salida
literal completa. Debería decir «no registrada en forma literal».

#### WARNING-3 · Dos escenarios de RQ-CV-06 sólo se prueban a nivel de cosecha

Los nº 20 y nº 24 de la matriz (abreviadas tras un nombre con punto inicial, y la mención pelada que
resuelve o no) sólo tienen prueba sobre `cosechar()`: `apps/desk/server/citas/cosecha.test.ts:22` y
`:31`. Ninguna prueba ejecuta `detectar()` ni el hook con esa misma configuración (`.dockerignore`
seguido de `.git` y `docs`) para comprobar el resto del escenario: que las abreviadas acaban entre las
comprobadas y no entre las huérfanas, y que una abreviada fuera de rango en esa línea aparece en la
lista de abreviadas rotas con el push en `exit 0`. La atribución, que es la parte difícil, sí está
probada; el tramo que falta es de integración. Además, el control de `cosecha.test.ts:31` anuncia en
su nombre dos signos («sin (d), o capturando cualquier token pelado»), pero su cuerpo sólo ejerce el
primero: no hay prueba de que capturar un token pelado que no resuelve desvíe la atribución a `.git` o
a `docs`. **Remedio:** una prueba en `detector.test.ts` con esa línea exacta que compruebe comprobadas,
huérfanas y lista de abreviadas rotas, con los dos signos de la mutación de (d). Es trabajo de apply,
no de verify.

### SUGGESTION

- **SUGGESTION-1 · 0,01 pp en la cobertura de ramas.** El corte 4 registró 83,95 % y este verify mide
  83,96 % con el mismo comando y el mismo árbol. Es redondeo y no afecta a ningún umbral.
- **SUGGESTION-2 · Comentario falso preexistente en `Dockerfile`.** `Dockerfile:14` dice «tsx es
  devDep», pero `package.json:42` declara `tsx` en `dependencies`. La tarea 4.13-A1 ya lo declara falso y
  fuera de alcance, y la tanda no lo tocó a propósito. No se comprobó dónde quedó registrado aparte.
- **SUGGESTION-3 · La propuesta sigue diciendo «cuatro exclusiones».** Lo dice en el apartado 15 y en la
  fila M14 del apartado 6, pero la divergencia nº 2 del diseño las elevó a seis, que son las que están
  implementadas (`apps/desk/server/citas/cli.ts:46-53`). Es sólo higiene de redacción.

---

## 12. Evidencia de la corrección B (referencia rápida)

| Fuente | Contenido literal | Naturaleza |
|---|---|---|
| Engram obs. 558 | «el primer `git push` real ejecutó el hook, que salió 0 (37 informadas, 0 bloqueantes), push en 5 s» | Resumen |
| Engram obs. 559 | «empujado CON el hook (salida 0, informe con 1.755 comprobadas y 37 informadas)» | Resumen |
| Copia literal parcial citada por el analista (informe de turno del corte 3) | No está en el repositorio ni en Engram en forma literal | Evidencia parcial; no se reconstruye |

---

## 13. Conclusión

La capacidad `citas-verificables` cumple su spec: 18/18 requisitos, 62/64 escenarios (2 PARTIAL),
102/102 tareas, los cinco comandos de la 5.6 en verde con cifras propias y RQ-CV-14 reproducido sobre
`a4d5b81`. La tanda **no cumple** uno de sus propios criterios de aceptación (WARNING-1, 25 citas por
línea entre artefactos). El remedio es documental y está descrito arriba.

**Siguiente paso recomendado:** no archivar todavía. Primero una remediación acotada con dos piezas:
(1) la prueba de integración de WARNING-3, con rojo previo bajo `strict_tdd`, y (2) reescribir en
prosa las 25 citas de WARNING-1. Después, un verify nuevo. WARNING-2 y las SUGGESTION no bloquean.
