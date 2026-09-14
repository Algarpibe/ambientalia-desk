# Informe de verificación — hook-citas-pre-push

**Fase**: sdd-verify · **Rama**: `main` · **HEAD verificado**: `a4d5b81` (= `origin/main`)
**Preflight** (`openspec/config.yaml:25-30`): interactive · hybrid · ask-on-risk · 800 líneas · strict_tdd
**Modo de verificación**: artefactos completos (propuesta, spec, diseño, tareas y progreso de apply).
`gentle-ai sdd-status`: 102/102 tareas, apply `all_done`, verify `ready`.

Convención de este informe: no cita líneas de ningún artefacto de la tanda (convención 2 de la
propuesta). Los nombra por apartado, tarea o identificador. Las citas a código van contra `a4d5b81`.

## Veredicto: PASS WITH WARNINGS

**0 CRITICAL · 2 WARNING · 3 SUGGESTION.**

Los 18 requisitos de la spec están implementados y probados, las 102 tareas están cerradas y los cinco
comandos de la tarea 5.6 dan `exit 0` con cifras propias de este verify. Hay **un criterio de aceptación
de la propuesta incumplido** (WARNING-1: los artefactos de la tanda se citan entre sí por línea) y una
afirmación imprecisa sobre la evidencia del push de `f962e81` (WARNING-2). Ninguno de los dos cambia el
comportamiento del detector ni del hook. Si WARNING-1 debe repararse antes de archivar es una decisión
de quien cierra la tanda: aquí se registra, no se repara, porque verify es de sólo lectura.

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
comando termina con código distinto de cero (apartado 3); (3) ningún requisito de la spec queda sin
prueba verde (apartado 4).

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

La capacidad `citas-verificables` cumple su spec: 18/18 requisitos con ejecución real, 102/102 tareas,
los cinco comandos de la 5.6 en verde con cifras propias y RQ-CV-14 reproducido sobre `a4d5b81`. La tanda
**no cumple** uno de sus propios criterios de aceptación (WARNING-1, 25 citas por línea entre
artefactos). El remedio es documental y está descrito arriba.

**Siguiente paso recomendado:** decidir si WARNING-1 se repara antes de `sdd-archive` o se archiva con
el incumplimiento registrado. En los dos casos, el informe se commitea antes de archivar.
