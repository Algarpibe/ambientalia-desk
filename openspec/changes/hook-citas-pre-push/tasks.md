# Tasks: detector de citas ruta:línea impuesto en pre-push

Fuentes: `proposal.md` (§4 rojos, §6 mutaciones M1-M30, §8, §11, §12, §15), `specs/citas-verificables/spec.md`
(RQ-CV-01 a RQ-CV-18), `design.md` (§1 respuesta, §3 ficheros, §4 decisiones D1-D12, §7 coste, §8 pruebas,
§10 despliegue, §11 divergencias). Ninguna cita a este propio cambio lleva línea (convención 2 de la
propuesta): las referencias a otros artefactos de la tanda usan ID (RQ-CV-NN, M-NN, D-NN, Pieza N, §N),
nunca `fichero:línea`.

## Review Workload Forecast

| Corte | Ficheros | Líneas (hipótesis) | Riesgo contra 800/intento |
|---|---|---|---|
| Sin trocear — Unidad 1 completa | `git.ts`, `cosecha.ts`, `resolucion.ts`, `detector.ts`, `informe.ts`, `cli.ts`, `reposDePrueba.ts` + 4-7 ficheros `*.test.ts` | **565-815** (estimación propia del diseño, §3) | **Alto** — el extremo superior (815) supera el ledger de 800 |
| **1a** · núcleo puro + pruebas en memoria | `cosecha.ts`, `resolucion.ts`, `detector.ts`, `informe.ts`, porción memoria de `reposDePrueba.ts`, `detector.test.ts`, `cosecha.test.ts`, `resolucion.test.ts`, `informe.test.ts` | **~390-560** (hipótesis mía sobre las líneas por fichero del diseño; el diseño no desglosa las 365-520 líneas de prueba por fichero, así que el reparto entre 1a/1b es una hipótesis de segundo nivel) | Bajo |
| **1b** · adaptador git + CLI + pruebas sintéticas | `git.ts`, `cli.ts`, porción sintética de `reposDePrueba.ts`, `hook.test.ts` | **~155-225** (misma reserva de hipótesis que 1a) | Bajo |
| **2** · línea base + IV-10 + regla de mutación 4 | `lineaBase.jsonl` (51, medida), `CLAUDE.md` + `openspec/config.yaml` (38-66, diseño) | **~89-117** | Bajo |
| **3** · hook + instalador + `.gitattributes` + `DEPLOY.md` | `.githooks/pre-push` (4, fijo), `instalar-hooks.mjs` (25-35), `package.json` (1-2), `.gitattributes` (3-5), `DEPLOY.md` (3-6), `guardianes.test.ts` + `instalador.test.ts` (resto del presupuesto de pruebas) | **~116-162** | Bajo |

1a + 1b recombinadas (545-785) quedan por debajo de 800 en mi propia hipótesis, pero **no** en la del
diseño (565-815, que sí lo roza) — es la discrepancia exacta que motiva el troceado en vez de decidirlo
por mí. 2 y 3 no necesitan más división: incluso en su extremo alto quedan muy por debajo de 800.

### Recalibración con lo medido (Gerencia, 2026-09-13)

**La tabla de arriba es la estimación previa y se deja como estaba.** El corte 1a-i (tareas 1.1-1.27,
commit `7625921`) midió **~30 líneas por tarea**: 819 líneas de código y pruebas en seis ficheros para 27
tareas, más `tasks.md` y `apply-progress.md` (109). Con esa tasa, 1a entero no cabía, y 1b tampoco cabe
en un corte. Los cortes quedan **1a-ii → 1b-i → 1b-ii → 2 → 3**:

| Corte | Tareas | Líneas (medida × tareas) |
|---|---|---|
| **1a-ii** | 1.0 y 1.28-1.42 (16) | ~480 + `tasks.md` y `apply-progress.md` (~50) ≈ **530** · **cerrado en `69bc3a9`: 495 medidas con git, 144 en el ledger** |
| **1b-i** | 2.0-2.11 (12) | ~330 + tarea 2.0 (~65: doce expectativas reescritas, dos pruebas nuevas y cuatro `push`) + ~50 ≈ **445** · **cerrado en `56a0095`: 529 medidas con git (494 inserciones y 35 borrados contra `01df7ce`), un 19 % por encima** |
| **1b-ii** | 2.12-2.26 (15) | ~390 + tarea 2.25 (~20) + tarea 2.26 (~80-90: tres rojos con repositorio sintético y la resolución en `detector.ts`) + ~50 ≈ **540-550** · **con el desvío medido en 1b-i (×1,19), 640-655: roza la parada de las ~650** · **cerrado en `36e5a2d`: 843 con git y 843 en el ledger (todo trackeado), ×1,53-1,56 sobre la previsión** |
| **2** | 3.8, 3.9, 3.10 y 3.1-3.7 (10) | **Con la 3.10 (2026-09-14):** la recalculada que sigue en esta celda (220-250) + tarea 3.10 (~130-150: modos y lectura perezosa de stdin en `cli.ts` ~40-55, pruebas sintéticas de los tres apartados ~85-95) ≈ **350-400** · **con el desvío medido en 1b-ii (×1,55), 540-620: no pasa de las ~650, pero su extremo alto queda a 30** · la actualización de la cifra de la base en tres artefactos (3.2) va dentro de las filas y frases. Previsión anterior de 3.1-3.7: `lineaBase.jsonl` (51) + filas y frases (38-66) + tarea 3.7 ampliada (~15) ≈ 105-135. **Recalculada el 2026-09-14:** tarea 3.8 (~45: caché y contador en memoria) + tarea 3.9 (~35) + `lineaBase.jsonl` (~37: el detector del corte 1b-ii da hoy 37 bloqueantes sobre el árbol de `36e5a2d`, no 51) + filas y frases (38-66) + 3.7 (~15) + `tasks.md` y `apply-progress.md` (~50) ≈ **220-250** · **con el desvío medido en 1b-ii (×1,55), 340-390** · no contaba los modos `--sha` y `--generar-base` del CLI, que 3.1 y 3.2 usan y `ejecutar` no lee en `36e5a2d`: los construye la 3.10 |
| **3** | 4.1-4.14 | sin cambios: **~116-162** |

**El ledger NO mide lo que parecía.** El intento 1 registró `changed_lines: 55` con 928 líneas nuevas
sin trackear (`wc -l` de los siete ficheros de `7625921`): sus árboles de principio y fin
(`e92f6e2`, `ff7e330`) sólo difieren en `tasks.md` (+27/-27) y `design.md` (+1). Cuenta lo trackeado.
Y el intento 2 midió una segunda ceguera: `changed_lines: 144` frente a 247 trackeadas medidas con git.
Las 103 que faltan son de `detector.ts`, que era binario en el árbol de partida y el ledger cuenta como 0.

**Control de tamaño por corte (decisión c), con git y no con el ledger:** `git diff --shortstat` contra
el commit de partida del corte **más** `wc -l` de lo no trackeado (`git ls-files --others
--exclude-standard`). **A las ~650 líneas se PARA y se pregunta.** Prohibido `git add -N`: hipótesis, haría
visible lo nuevo al ledger; el corte se bloquearía por presupuesto y desbloquearlo exige un `reset` de
mantenedor.

```text
Decision needed before apply: No (respondida por Gerencia: A)
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High
```

**800-line per-attempt risk** (el ledger real de este proyecto; `review_budget_lines: 800` en
`openspec/config.yaml:29` en `648432d`): **Alto** si la Unidad 1 se implementa en un solo intento de
`sdd-apply` (extremo superior 815, diseño §3); **Bajo** en cada uno de los cuatro cortes 1a/1b/2/3
propuestos (todos por debajo de 800 incluso en su extremo alto, hipótesis).

### Decisión pendiente para el usuario (ask-on-risk)

¿Qué estrategia de entrega se usa para los cuatro cortes 1a → 1b → 2 → 3 (dependencia lineal: 2 necesita
el detector completo —1a+1b— para generar la base con `--generar-base`; 3 necesita 2, por el orden M18)?

- **(A) Stacked PRs to main** — cada corte se fusiona a main en orden, empezando por 1a. Ninguno de los
  cuatro lo importa nada de producción (RQ-CV-18), así que fusionar uno solo no activa nada a medio
  construir. Líneas por corte: 1a ~390-560, 1b ~155-225, 2 ~89-117, 3 ~116-162.
- **(B) Feature Branch Chain** — una rama tracker acumula los cuatro cortes; PR 1 (1a) apunta al tracker,
  PR 2 (1b) apunta a PR 1, PR 3 (2) a PR 2, PR 4 (3) a PR 3; sólo el tracker se fusiona a main al cierre.
  Mismas líneas que (A) por corte.
- **(C) size:exception** — un solo PR con la Unidad 1 entera sin trocear (1a+1b juntas, ~565-815 según el
  diseño), aprobado explícitamente por un mantenedor porque roza el techo de 800 en su extremo alto; 2 y
  3 seguirían troceadas aparte (~89-117 y ~116-162), muy por debajo del límite.

No elijo por el usuario. Con `ask-on-risk`, el orquestador pregunta antes de `sdd-apply`.

**Respuesta de Gerencia (2026-09-13): (A) Stacked PRs to main.** Cómo se ejecuta en este repositorio:
sin PR de GitHub; cada corte es **un** intento de `sdd-apply` y, al verificarlo, commit y push directos a
`main` (conventional commits, sin coautoría, nunca `--no-verify`). Orden lineal 1a → 1b → 2 → 3, sin
adelantar nada: ni `.githooks`, ni `prepare`, ni `core.hooksPath` hasta el corte 3. Una sola tanda SDD
sobre este árbol, nada en paralelo (regla del ciclo 2).

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1a | Núcleo puro: cosecha, resolución, comprobación, línea base, informe — sin git | PR 1 | `npx vitest run apps/desk/server/citas/detector.test.ts apps/desk/server/citas/cosecha.test.ts apps/desk/server/citas/resolucion.test.ts apps/desk/server/citas/informe.test.ts` | N/A — lógica pura contra `Repo` en memoria, sin proceso real | Revertir los 4 ficheros núcleo + porción memoria de `reposDePrueba.ts` + 4 test files; nada los importa en producción (RQ-CV-18) |
| 1b | Adaptador git (`spawnSync`) + CLI + pruebas con repositorio sintético | PR 2 | `npx vitest run apps/desk/server/citas/hook.test.ts` | Repositorio git temporal por prueba, `cli.ts` invocado en proceso vía `ejecutar({argv, entrada, cwd, env})` — **corregido en la tarea 3.10(a): `entrada` pasa a ser `() => string`, una lectura perezosa que sólo invoca el modo hook** | Revertir `git.ts`, `cli.ts`, porción sintética de `reposDePrueba.ts`, `hook.test.ts`; sin efecto de ejecución sin Unidad 3 |
| 2 | Línea base generada + IV-10 + dos frases de la regla de mutación 4 | PR 3 | `npm test` (regresión completa) | Manual: `npx tsx apps/desk/server/citas/cli.ts --generar-base` sobre el árbol de 1a+1b ya commiteado; inspeccionar `lineaBase.jsonl` (cifra ≤100, R-14) | Revertir `lineaBase.jsonl` + las filas/frases de `CLAUDE.md` y `openspec/config.yaml`; sin efecto sin Unidad 3 |
| 3 | Hook versionado, instalador, `.gitattributes`, `DEPLOY.md` | PR 4 | `npx vitest run apps/desk/server/citas/guardianes.test.ts apps/desk/server/citas/instalador.test.ts` | Manual: push real de cierre con el hook instalado (M16 en ejecución, M18, M19 — Fase 5) | `git revert` + `git config --unset core.hooksPath` en cada clon que ya lo tuviera (el revert del fichero no deshace el `git config`) |

Tras la recalibración, 1a se entrega como **1a-i** (1.1-1.27, ya en `main`) y **1a-ii** (1.0 y 1.28-1.42), y
1b como **1b-i** (2.0-2.11) y **1b-ii** (2.12-2.26). Mismo comando de prueba y misma frontera de reversión
que la unidad de la que salen; cada uno es un intento de `sdd-apply` con `work_unit` propio.

---

## Fase 1 (Unidad 1a) — Núcleo puro + pruebas en memoria

- [x] 1.1 Setup: crear `apps/desk/server/testing/reposDePrueba.ts` — porción `Repo` en memoria +
      constructores `cita()`, `abreviada()`, `anclada()` en tiempo de ejecución (D7).
- [x] 1.2 RED (RQ-CV-08, rojos a+b): `detector.test.ts` — cita rota en doc trackeado ≠0; misma cita
      válida →0.
- [x] 1.3 GREEN: `cosecha.ts` (tokeniza citas completas) + `detector.ts` (fichero+línea+vacía) mínimo
      para 1.2.
- [x] 1.4 RED (RQ-CV-08, rojo c, M4, dos direcciones): extremo final fuera con inicial OK ≠0 nombrando
      el extremo; e inicial en línea en blanco con final OK ≠0 nombrando el otro extremo.
- [x] 1.5 GREEN: comprobar los dos extremos del rango por separado en `detector.ts`, mensaje nombra cuál
      falla.
- [x] 1.6 RED (RQ-CV-06, rojo d, M3): anclada a revisión real →0; anclada a revisión inventada ≠0
      (`Repo` en memoria simula revisiones).
- [x] 1.7 GREEN: patrón de cita anclada en `cosecha.ts`; `detector.ts` resuelve vía `leerLote` simulado.
- [x] 1.8 RED (M9, M10, M17): entrada de la base ya reparada sin quitarla → hook falla; quitándola → 0;
      cita rota nueva con base presente → bloquea.
- [x] 1.9 GREEN: casar la base por (fichero, cita) con multiplicidad (D6); consultar la base ANTES de
      decidir el bloqueo.
- [x] 1.10 MUT (regla de mutación 1, M17): mover temporalmente la consulta de la base a DESPUÉS del
      bloqueo en `detector.ts`; confirmar que 1.8 se pone roja; revertir.
- [x] 1.11 RED (RQ-CV-09, M30): la base generada no contiene abreviadas; abreviada rota → aparece en el
      informe sin bloquear; abreviada válida → entre las comprobadas.
- [x] 1.12 GREEN: generación/lectura de la base excluye abreviadas; una abreviada rota nunca cambia el
      código de salida.
- [x] 1.13 RED (D11): un solo `leerLote` por árbol para sha local + anclas; la lectura de una anclada
      vuelve al índice de su propia revisión sólo si el fichero no está en el sha local.
- [x] 1.14 GREEN: `detector.ts` agrupa todas las lecturas en una única llamada a `Repo.leerLote`.
- [x] 1.15 RED (M22): ejemplo de cita rota CON forma de cita en doc trackeado → bloquea; el mismo ejemplo
      en prosa, sin forma de cita → pasa.
- [x] 1.16 GREEN: confirmar sin código nuevo — ya cubierto por 1.3/1.7 (`cosecha.ts` no distingue
      "ejemplos").
- [x] 1.17 RED (M24, M25): cita válida a `Dockerfile` (sin extensión) → comprobada y 0, fuera de rango →
      bloquea; cita válida a `.dockerignore` (punto inicial) → comprobada, fuera de rango → bloquea.
- [x] 1.18 GREEN: patrón de nombre en `cosecha.ts` sin lista de extensiones y que admite punto inicial.
- [x] 1.19 RED (M26): «fichero A, abreviada, fichero B», válida en A/vacía en B → comprobada, no en lista
      de rotas; A/B intercambiados → en lista de rotas.
- [x] 1.20 RED (M27): mención pelada de un fichero que resuelve, seguida de varias abreviadas → todas
      atribuidas y comprobadas; una fuera de rango → en lista de rotas; sin (d), o capturando cualquier
      token pelado, deja de figurar.
- [x] 1.21 GREEN: atribución Lbc en `cosecha.ts` — último fichero anterior por índice en la misma línea
      física; mención pelada cuenta si resuelve a fichero trackeado.
- [x] 1.22 RED (D1, los dos cortes de Lbc, dos signos cada uno): una cita completa que no resuelve, antes
      de una abreviada, corta la atribución; una abreviada tras la barra de una celda de tabla corta la
      atribución.
- [x] 1.23 GREEN: los dos cortes de Lbc en `cosecha.ts` (sin corte por vocabulario).
- [x] 1.24 RED (RQ-CV-16, D3): `host:puerto` dentro de una URL con esquema → ni comprobada ni saltada;
      cita real de dos puntos fuera de una URL → se cosecha.
- [x] 1.25 GREEN: `cosecha.ts` no trata como cita un `host:puerto` dentro de `<esquema>://…`.
- [x] 1.26 RED (M28, RQ-CV-04): token `~/x/y.md:3` → cifra "fuera del repositorio", no bloquea; ruta
      relativa que no existe → bloquea (control del otro signo).
- [x] 1.27 GREEN: categoría "fuera del repositorio" evaluada antes que cualquier regla de resolución.
**Corte 1a-ii** (tareas 1.0 y 1.28-1.42):

- [x] 1.0 GUARDIÁN (regla de mutación 2, decisión b de Gerencia): **ningún fichero trackeado con extensión
      de texto** (`ts`, `tsx`, `js`, `mjs`, `md`, `yaml`, `yml`, `json`, `jsonl`, `sql`, `sh`) **es binario
      para git**, leído del `--numstat` de `git diff` desde el árbol vacío (binario = `-` `-`). Motivo:
      `git grep -I` se salta EN SILENCIO lo que git cree binario, y ése es un hueco del propio detector.
      El diff va contra lo trackeado del árbol de trabajo: en CI (clon limpio) es HEAD, y en local es lo
      único que deja observar el verde sin commitear. Orden: (1) ROJO hoy por `detector.ts`, con su
      salida literal; (2) el NUL de `detector.ts` pasa al escape `\u0000` → verde; (3) MUT sobre el
      fichero vigilado: un NUL en un `.ts` de `citas/` → rojo; restaurar y comprobar con `cmp`. El NUL es
      el byte que git usa para decidir «binario»; otro byte de control no lo activa, y se registra.
- [x] 1.28 RED (RQ-CV-05, pasos 6-8 de D4): token con `/` que no resuelve en el índice local → bloquea
      "fichero inexistente"; token SIN `/` que no resuelve → se salta e informa.
- [x] 1.29 GREEN: pasos 6-8 del orden D4 en `resolucion.ts` (el paso 5, índice remoto, se prueba en
      Fase 2).
- [x] 1.30 RED (M15): token ambiguo roto en TODAS sus candidatas → bloquea; roto en una sola → se salta,
      saltadas +1.
- [x] 1.31 GREEN: RQ-CV-03 en `resolucion.ts` — comprobar cada candidata, bloquear sólo si todas fallan.
- [x] 1.32 RED (M23): quitar la precedencia exacta → cita a `package.json` (seis candidatos) pasa a
      ambigua y saltada; `ci.yml` (sin candidato exacto) sigue resolviendo por sufijo.
- [x] 1.33 GREEN: RQ-CV-02 — coincidencia exacta antes que sufijo con frontera de segmento.
- [x] 1.34 MUT (regla de mutación 1, M23): invertir el orden — sufijo antes que exacta — en
      `resolucion.ts`; confirmar que 1.32 se pone roja; revertir.
- [x] 1.35 RED (regla de mutación 1, D4 paso 4 antes del 7): token con `/` que resuelve a un DIRECTORIO
      → saltado, nunca "fichero inexistente".
- [x] 1.36 GREEN: fijar el orden D4 de ocho pasos, paso de directorio ANTES que el de "lleva `/`".
- [x] 1.37 MUT (regla de mutación 1): mover el paso de directorio a DESPUÉS del paso "lleva `/`";
      confirmar que 1.35 se pone roja; revertir.
- [x] 1.38 RED (D3): marca ISO y hora `HH:MM` sin `/` que no resuelven → "no es cita"; fichero trackeado
      con nombre de sólo dígitos → comprobado con normalidad.
- [x] 1.39 GREEN: en `resolucion.ts`, tras fallar la resolución local Y remota y sin `/`, reclasificar
      marca ISO/hora como "no es cita".
- [x] 1.40 RED (RQ-CV-10): mensaje con cuatro cifras, desglose de saltadas, "no son citas", frases fijas
      y ausencia de `--no-verify`.
- [x] 1.41 GREEN: `informe.ts` arma el mensaje completo (divergencia #4 del diseño).
- [x] 1.42 RED+GREEN (RQ-CV-18): recorrido de imports desde `apps/desk/server/index.ts` no alcanza
      `citas/`; cabecera de cada fichero declara las dos frases de RQ-CV-18.

## Fase 2 (Unidad 1b) — Adaptador git + CLI + pruebas sintéticas

**Corte 1b-i** (tareas 2.0-2.11):

- [x] 2.0 DEFECTO D6, PRIMERA del corte (decisión a de Gerencia; viene de 1a-i). RQ-CV-09 y D6 fijan que
      una entrada de la base y un elemento del informe llevan el DOCUMENTO que cita y la línea de la cita.
      `detectar()` los construye con el fichero CITADO (`resuelto` o `c.fichero`) y la línea citada, aunque
      la cosecha trae `origenFichero` y `origenLinea`:
      `apps/desk/server/citas/detector.ts:154` en `69bc3a9`, `apps/desk/server/citas/detector.ts:163` en `69bc3a9`,
      `apps/desk/server/citas/detector.ts:170` en `69bc3a9`, `apps/desk/server/citas/detector.ts:195` en `69bc3a9`.
      Consecuencias: el informe no dice dónde corregir, y dos documentos con la misma cita rota comparten
      clave. RED (i): la entrada de base, la lista de bloqueantes y la de abreviadas rotas llevan el
      documento que cita y su línea. RED (ii): la misma cita rota en dos documentos A y B, con base = {A};
      reparar en A y romper en B NO se compensa: B bloquea y la entrada de A caduca. GREEN: los cuatro
      `push` usan el origen, y se reescriben las doce expectativas que fijaban el fichero citado. MUT:
      volver a la clave del fichero citado → (ii) en rojo; restaurar y comprobar con `cmp`.

- [x] 2.1 Setup: extender `reposDePrueba.ts` con el constructor de repositorio git temporal aislado
      (`GIT_DIR`/`GIT_WORK_TREE`/`GIT_INDEX_FILE` vacíos, `GIT_CONFIG_NOSYSTEM`, `GIT_CONFIG_GLOBAL`
      vacío, `GIT_CEILING_DIRECTORIES`, identidad por entorno, `core.autocrlf=false`).
- [x] 2.2 RED (M1, obligatoria): push que sólo mueve líneas en fichero citado, sin tocar el que lo cita
      → hook ≠0; el mismo push con la cita reparada → 0.
- [x] 2.3 GREEN: `git.ts` implementa `lineas()` con `git grep --null -n -I -E`; `cli.ts` orquesta cosecha
      + resolución + detección sobre el sha local.
- [x] 2.4 RED (rojo g, M7): fichero renombrado, cita con `/` y cita pelada al mismo fichero → ambas
      bloquean "existía en `<sha remoto>`"; sin el índice remoto (mutación) la pelada pasa a saltada.
- [x] 2.5 GREEN: `git.ts.rutas()` vía `git ls-tree -r --name-only`; `resolucion.ts` añade la regla del
      índice remoto (RQ-CV-05, D4 paso 5), tras "fuera del repositorio" y antes de las dos últimas.
- [x] 2.6 RED: rama nueva con y sin `origin/main` — con él, índice se toma de ahí; sin él, el mensaje
      dice que no se hizo, sin callarlo.
- [x] 2.7 GREEN: `cli.ts` resuelve el índice remoto: `origin/main` en rama nueva; si falta, "NO HECHO"
      en el informe.
- [x] 2.8 RED (M8): cita reparada sólo en el árbol de trabajo, commit empujado sigue roto → bloquea
      (nunca lee el árbol de trabajo).
- [x] 2.9 GREEN: `git.ts` lee siempre por sha (`rutas`, `lineas`, `leerLote`), nunca el árbol de trabajo.
- [x] 2.10 RED (M29): cita rota en contenido por un commit YA empujado sin hook, sin renombrar ni borrar,
      y un push posterior que no toca ni el fichero ni el citado → bloquea; con esa cita en la base →
      informa y sale 0.
- [x] 2.11 GREEN: barrido siempre COMPLETO del árbol del sha local (RQ-CV-01), nunca limitado a los
      ficheros que cambia el push.
**Corte 1b-ii** (tareas 2.12-2.26):

- [x] 2.26 DEFECTO de la divergencia nº 8, PRIMERA del corte (decisión de Gerencia, 2026-09-14; va antes
      de 2.20, 2.21 y 2.24, que prueban anclas). Hoy una cita anclada se lee por su ruta literal en su
      revisión, sin pasar por el índice del sha local; con nombre pelado la lectura devuelve `null` y el
      bucle la descarta sin contarla ni informarla:
      `apps/desk/server/citas/detector.ts:133` en `56a0095`, `apps/desk/server/citas/detector.ts:202` en `56a0095`.
      Es lo contrario de RQ-CV-10, y cae justo sobre las citas de caso B que prescribe la regla de
      mutación 4: en el árbol real son nueve, todas a `estados.ts` con nombre pelado, ancladas a tres
      revisiones. REGLA: la anclada resuelve su fichero con el índice del sha local (D11) y el orden D4
      —exacta, sufijo, RQ-CV-03 si es ambigua— y se lee en la ruta resuelta dentro de su revisión; si esa
      ruta no existe en la revisión, bloquea como hoy una ruta inexistente. RED en `hook.test.ts`,
      repositorio sintético con dos commits: (i) ancla pelada válida en su revisión → hoy 0 comprobadas
      y 0 bloqueantes → debe contar como comprobada; (ii) la misma ancla apuntando a una línea vacía en
      su revisión → debe bloquear; (iii) nombre pelado que resuelve en el índice local a una ruta que no
      existía en la revisión del ancla → debe bloquear «fichero inexistente». La (iii) se añade al
      encargo porque sin ella la regla de bloqueo no tiene rojo. Siguen verdes las pruebas de 1.13: un
      solo `leerLote` por árbol, y el fichero ausente del sha local leído por su ruta literal en su
      revisión. GREEN en `detector.ts`. MUT: quitar la resolución por índice → vuelve el descarte
      silencioso → (i), (ii) y (iii) en rojo; restaurar y comprobar con `cmp`. Coste medido por
      Gerencia: 33-56 ms. Fuera de esta tarea, declarado en el §11 del diseño: un nombre que NO resuelve
      en el índice local se sigue leyendo por su ruta literal y, si esa lectura falla, se descarta sin
      informar; y no se construye el índice de la propia revisión. Las nueve anclas reales se comprobaron
      con git el 2026-09-14: la ruta existe en las tres revisiones y las nueve líneas están en rango y
      no vacías, así que pasan a comprobadas y no añaden bloqueantes a la base del corte 2.

      **CERRADO** (`apps/desk/server/citas/detector.ts`). La anclada resuelve `c.fichero` con
      `resolverToken` (D4: exacta, sufijo, RQ-CV-03 si ambigua) contra el índice del sha local, con un
      caché por nombre (`resolverParaAncla`, no depende de la revisión). Si resuelve, se lee la ruta
      RESUELTA dentro de la revisión del ancla; si esa lectura falla, bloquea «fichero inexistente». Si
      NO resuelve localmente, sigue la lectura literal de siempre en su propia revisión.

      **AÑADIDO de Gerencia (decisión c), invariante de conservación — cerrado en el mismo intento.**
      Cada cita cosechada cae en EXACTAMENTE una cifra del informe: `comprobadas + Σ saltadas +
      fueraDelRepositorio + noSonCitas + abreviadasRotas.length + bloqueantes.length + informadas =
      cosechadas` (`Σ saltadas = sinBarra + ambiguas + directorios + huerfanas + anclasSinResolver +
      noLegibles`; `caducadas` y la línea de binarios quedan FUERA). `cosechadas` se expone en
      `ResultadoDeteccion` como `citas.length`. Dos categorías nuevas en `Saltadas`:
      `anclasSinResolver` (el «ancla ilegible»: no resuelve localmente y su lectura literal también
      falla) y `noLegibles` (defensivo: una ruta trackeada cuyo contenido git no devuelve como blob,
      p. ej. un submódulo — cubre la abreviada y la completa no anclada). Se eliminó además un chequeo
      muerto en la rama de abreviadas (`resuelto === null`): por construcción, `cosecha.ts` sólo atribuye
      con el MISMO índice que usa `detector.ts`, así que nunca podía dispararse. **La frase «Fuera de
      esta tarea… si esa lectura falla, se descarta sin informar» queda CORREGIDA**: ahora se cuenta como
      saltada con el motivo «ancla sin resolver», nunca en silencio. Pruebas: `hook.test.ts` (tarea
      2.26 propia, con MUT sobre archivo restaurado con `cmp`, y el invariante con un caso de cada
      categoría) y `detector.test.ts` (defensivo `noLegibles` con dos signos; triangulación de la
      anclada ambigua, RQ-CV-03).

- [x] 2.12 RED (M5, divergencia #1 del diseño): cita rota en fichero sin trackear → 0; el mismo fichero
      tras `git add` Y COMMIT → bloquea. **Nació verde**: `git.ts.lineas()` ya lee `git grep <árbol>`,
      que por construcción no ve nada sin commitear. `hook.test.ts` (tareas 2.12-2.13).
- [x] 2.13 GREEN: `git.ts.lineas()` opera sobre el sha ya commiteado, nunca sobre el índice. Sin cambios
      de producción (ya lo hacía desde 1b-i).
- [x] 2.14 RED (M14, divergencia #2 — SEIS exclusiones): cita rota dentro de
      `openspec/changes/archive/`, `.claude/skills/superpowers-main/`, `.agent/skills/`,
      `docs/artefactos/`, un `.csv` y dentro de `apps/desk/server/citas/lineaBase.jsonl` → las seis se
      ignoran; la misma cita fuera de ellas → bloquea. `hook.test.ts` (tareas 2.14-2.15): las cinco de
      punta a punta con el hook (rojo real: «expected 1 to be +0», el control bloqueaba antes de
      excluirlas) y la sexta con `repo.lineas()` directo (evita el `JSON.parse` de `leerBase` sobre
      contenido no-JSON).
- [x] 2.15 GREEN: `EXCLUSIONES` en `cli.ts`, exportada, con las seis rutas/patrones (RQ-CV-07, D5, D6).
- [x] 2.16 RED (D12): borrado de rama, sha que no pela a árbol, varias referencias al mismo árbol → cada
      caso sale 0 o "no comprobado", nunca cuelga ni bloquea sin comprobar. `hook.test.ts`.
- [x] 2.17 GREEN: `cli.ts` implementa D12 — `porArbol` dedup por árbol con unión de índices remotos
      (`indiceRemotoUnido`), mensajes explícitos para rama borrada y sha-sin-árbol, y el defecto cerrado:
      TODO `ejecutar()` corre dentro de un `try/catch` que convierte cualquier `ErrorDeGit` o
      `SyntaxError` (base ilegible) en `{codigo:2, texto:'citas: fallo operativo — ...'}`, nunca una
      excepción sin capturar. Rojo real de la línea mal formada: «expected +0 to be 2»; el fallo de git
      genérico se fuerza con `GIT_DIR` a una ruta inexistente (rojo real: `identidades()` no admite
      ningún status).
- [x] 2.18 RED: ruta no ASCII y salida de `git grep` por encima de 1 MB — el detector no trunca ni falla
      por tamaño de búfer. **Nació verde** (`hook.test.ts`, tareas 2.18-2.19): `core.quotepath=off` y
      `maxBuffer` ya estaban desde 1b-i; prueba con 20.000 líneas candidatas (>1 MB de salida de
      `git grep`) confirma `comprobadas .... 20000` sin truncar.
- [x] 2.19 GREEN: `maxBuffer` explícito en `git.ts`, salida por `Buffer` (no cadena) en el lote. Sin
      cambios de producción (ya lo hacía desde 1b-i).
- [x] 2.20 RED (M20, SIEMPRE en repositorio sintético): documento con cita desanclada, commit que inserta
      líneas delante cayendo en línea vacía → bloquea; la misma cita anclada a la revisión ANTERIOR →
      pasa. Nunca sobre las líneas reales de `CLAUDE.md`. `hook.test.ts`.
- [x] 2.21 GREEN: soporte real de anclaje vía `git cat-file --batch` contra la revisión indicada. **Nació
      verde**: ya implementado desde 1b-i (`arbolDeLectura`, D11); 2.20 lo confirma con git de verdad.
- [x] 2.22 RED (M21, aviso de escalada en TypeScript — D8, divergencia #6): repositorio sintético con una
      identidad → sin aviso; con dos → aviso visible, MISMO código de salida. `hook.test.ts`.
- [x] 2.23 GREEN: `cli.ts` ejecuta `git shortlog -sne --all` vía `git.ts.identidades()` (`avisoDeEscalada`);
      imprime el aviso sin tocar el código de salida (RQ-CV-11).
- [x] 2.24 Confirmar (coste, RQ-CV-01): las anclas se leen agrupadas por (revisión, fichero) en UN solo
      `git cat-file --batch`, nunca un `git show` por cita, con varios pares en `hook.test.ts`. Confirmado
      con git real: cuatro anclas en dos revisiones → una sola llamada a `leerLote`.
- [x] 2.25 RED+GREEN (RQ-CV-10, decisión b de Gerencia): línea «texto que git cree binario .. N (no
      barridos)» en el informe, para que el hueco de `git grep -I` se vea también en ejecución. RED en
      `hook.test.ts`, repositorio sintético: un `.md` trackeado con un NUL en sus primeros 8.000 bytes y
      una cita rota → la línea dice 1 y la cita no se cosecha ni bloquea; sin el NUL → la línea dice 0 y la
      cita bloquea (control del otro signo). El NUL se genera en tiempo de ejecución con `Buffer`, nunca
      como escape en el fuente. GREEN: la función del guardián de la 1.0 pasa a `git.ts`, con la revisión
      como parámetro (el guardián la importa), y lee el `--numstat` desde el árbol vacío contra el sha
      local; `informe.ts` añade la línea fuera de las cuatro cifras. Coste medido: 182-194 ms por
      ejecución (numstat sobre `ef08129`, tres tomas).

## Fase 3 (Unidad 2) — Línea base + IV-10 + regla de mutación 4

**Corte 2** (tareas 3.8, 3.9, 3.10 y 3.1-3.7). Las tres primeras corrigen y completan el detector ANTES
de generar la base (decisiones de Gerencia, 2026-09-14): la base se genera con el detector que va a
imponerla.

- [x] 3.8 COSTE, PRIMERA del corte (RQ-CV-13, D11; hallazgo (a) de 1b-ii en `apply-progress.md`). Hoy
      `detectar()` pide el árbol de la revisión ancla una vez por cita anclada y por pasada:
      `apps/desk/server/citas/detector.ts:154` en `36e5a2d`, `apps/desk/server/citas/detector.ts:200` en `36e5a2d`;
      y el adaptador lanza un `git rev-parse` por llamada, sin caché:
      `apps/desk/server/citas/git.ts:90-91` en `36e5a2d`. Medido con `GIT_TRACE` sobre el árbol del corte
      1b-ii: ~200 procesos `rev-parse`, 160 de ellos para una sola revisión, y el hook en 7,8-9,6 s. REGLA:
      una sola resolución de árbol por revisión DISTINTA (caché por revisión en `detectar()`, o un
      `<rev>^{commit}` por revisión dentro del lote, como pide D11), nunca una por cita. RED en
      `detector.test.ts`, `Repo` en memoria con un contador sobre `arbol()`: N anclas a la MISMA revisión
      → las llamadas deben ser 1 (hoy 2N); con dos revisiones distintas → 2. Siguen verdes la de un solo
      `leerLote` por árbol (1.13 y 2.24) y la de revisión inexistente (1.6). MUT: quitar la caché → N
      llamadas → rojo; restaurar y comprobar con `cmp`. CIERRE: hook invocado como en `pre-push` sobre el
      árbol real con el informe completo (línea de binarios incluida), **≤5 s en tres tomas**; si alguna
      toma pasa de 5 s, se PARA y se pregunta.
      **CERRADO.** Caché `arbolCacheado` en `detectar()`. RED: 6→1 y 4→2. MUT (quitar caché) → mismo rojo;
      restaurado, `cmp` idéntico. CIERRE: tres tomas 2.779/2.618/2.699 ms, todas ≤5 s. Detalle en
      `apply-progress.md`, sección «Corte 2 — primera parte».
- [x] 3.9 RQ-CV-03 EN ANCLADAS AMBIGUAS, SEGUNDA del corte (hallazgo (b) de 1b-ii). Hoy, si el nombre de
      una anclada resuelve en el índice local a varias candidatas y alguna no existe en la revisión del
      ancla, bloquea «fichero inexistente» sin mirar las demás:
      `apps/desk/server/citas/detector.ts:244-245` en `36e5a2d`. REGLA: una candidata ausente en la
      revisión cuenta como rota para esa candidata, y la anclada bloquea sólo si está rota en TODAS; si
      alguna la valida, se salta como ambigua. Una anclada con UNA sola candidata ausente sigue bloqueando
      (casos ii y iii de la 2.26). RED en `detector.test.ts`, `Repo` en memoria: una candidata ausente en
      la revisión y otra válida → no bloquea y cuenta como ambigua; control del otro signo: todas ausentes
      → bloquea. El invariante de conservación sigue cuadrando. MUT: volver a bloquear en cuanto una
      candidata falta → rojo; restaurar y comprobar con `cmp`.
      **CERRADO.** RED: `expected true to be false`. MUT (bloquear en cuanto falta una) → mismo rojo;
      restaurado, `cmp` idéntico. Invariante de conservación (`hook.test.ts`) sigue en verde.
- [x] 3.10 MODOS `--sha` Y `--generar-base` DEL CLI, TERCERA del corte (§5 del diseño; decisión de Gerencia,
      2026-09-14). Hoy `ejecutar` declara `argv` y no lo lee, y el punto de entrada lee el stdin SIEMPRE:
      `apps/desk/server/citas/cli.ts:20` en `36e5a2d`, `apps/desk/server/citas/cli.ts:126` en `36e5a2d`.
      Sin estos modos, 3.1 y 3.2 no se pueden ejecutar. Tres partes, cada una con su rojo en
      `hook.test.ts` (repositorio sintético) y su mutación restaurada con `cmp`:
      (a) **SÓLO el modo hook lee stdin.** Invocado a mano desde una terminal, el stdin es un TTY y la
      lectura esperaría un EOF que no llega. La lectura pasa a ser una función que `ejecutar` llama sólo en
      modo hook (el punto de entrada pasa la lectura de stdin sin ejecutarla), y la firma del §5 del diseño
      se actualiza en el mismo intento. RED: `ejecutar` con `--sha` y una lectura inyectada que cuenta
      llamadas (o que falla) → 0 llamadas; en modo hook → 1. MUT: leer stdin en todos los modos → rojo.
      (b) **`--sha <rev>`**, dos signos: una cita rota en esa revisión → salida 1; la misma cita válida →
      0. Índice remoto de `origin/main`; sin `origin/main`, el informe dice «NO HECHO», nunca silencio (los
      dos casos probados).
      (c) **`--generar-base`** escribe `apps/desk/server/citas/lineaBase.jsonl` ÉL MISMO, no por
      redirección: UTF-8 sin BOM, LF, una entrada por candidato de bloqueo del árbol de `HEAD` calculado
      con la base VACÍA (así una base previa no esconde entradas), ordenada por documento que cita y línea
      (a igualdad, por orden de aparición), cada entrada con documento, línea, cita literal y motivo (D6,
      corregido en la 2.0); imprime la cifra y sale 0. RED: el fichero existe tras la llamada, su primer
      byte no es BOM, no contiene CR, está ordenado y tiene una entrada por bloqueante de un repositorio
      sintético con al menos dos documentos y dos roturas por documento. Control del otro signo: tras
      commitear la base generada (el detector la lee por sha, M8), `ejecutar` en modo hook sobre ese commit
      → 0 bloqueantes, N informadas y salida 0. MUT: escribir con BOM → rojo; escribir sin ordenar → rojo
      (dos mutaciones).
      **CERRADO**, las tres partes. (a) RED `expected 1/0 to be +0/1`; MUT (leer stdin siempre) → mismo
      rojo; restaurado, `cmp` idéntico. (b) RED dos signos con `expected 2 to be 1`; GREEN confirma NO
      HECHO sin `origin/main` y `origin/main` con él. (c) RED con `expected 2 to be +0`; GREEN: fichero
      generado, ordenado, sin BOM ni CR, commiteado pasa el hook en verde. MUT-BOM → rojo (`expected 239
      not to be 239`), restaurado y `cmp` idéntico. **MUT-sin-ordenar: SÍ discrimina.** La prueba se
      amplió con una cita rota repetida en el MISMO documento con otra distinta entre medias, porque
      `agrupar()` (`detector.ts`) casa `bloqueantes` por (documento, texto de la cita): dos ocurrencias de
      la MISMA cita rota comparten clave y salen JUNTAS del `Map`, así que sin `.sort()` el orden natural
      NO es el de aparición. Rojo: `expected [ 'a.md línea 1', 'a.md línea 3', 'a.md línea 2', …(2) ] to deeply equal
      [ 'a.md línea 1', 'a.md línea 2', 'a.md línea 3', …(2) ]`; restaurado y `cmp` idéntico. El `.sort()` es necesario con
      datos reales (51 entradas, 42 claves sobre `773ad75`), no defensivo. Detalle completo en
      `apply-progress.md` y §11 del diseño, fila 10.
- [x] 3.1 Precondición (RQ-CV-14, primera pasada; M18 orden): correr `cli.ts --sha HEAD` sobre el árbol
      de la Unidad 1 (1a+1b) ya commiteada y confirmar 0 bloqueantes antes de generar la base.
      **CERRADO (registro del orquestador).** `cli.ts --sha bfb0b284b160dea29dd9aedf529b8b2f7bd3468b`
      (commit temporal, árbol `b977229`, el mismo de `73a9acb`), 2026-09-14: **salida 1, 37
      bloqueantes**, índice remoto `.. origin/main`, texto que git cree binario `.. 0`. El texto
      original pedía «confirmar 0 bloqueantes»: el resultado real fue 37, y Gerencia (2026-09-14)
      sustituyó esa condición por traer la lista (registrada en 3.2). Ninguna de las 37 está en
      `CLAUDE.md` ni en `openspec/config.yaml`.
- [x] 3.2 Ejecutar `cli.ts --generar-base` y escribir `apps/desk/server/citas/lineaBase.jsonl` (JSON
      Lines, UTF-8 sin BOM, LF, una entrada por línea, ordenada por fichero y línea; D6). Si la cifra
      supera 100 entradas, PARAR y preguntar a Gerencia (R-14) — la medición previa fue 51.
      **Añadido (Gerencia, 2026-09-14): la cifra se fija aquí, con fecha y sha.** Sobre `36e5a2d` el
      detector del corte 1b-ii da hoy ~37 bloqueantes, frente a las 51 que la propuesta, el spec y el
      diseño midieron sobre `773ad75`. Al generar la base, se escribe la cifra nueva con su fecha y el sha
      del árbol en los TRES artefactos: la propuesta (R-14, Q9 y Pieza 3), el spec (medición de R-14 en
      RQ-CV-09 y cierre de R-14) y el diseño (§1, §3 y la medición 7 del §12). Las 51 **no se borran**: son
      una medición fechada sobre `773ad75`, caso B de la regla de mutación 4, y renumerarlas volvería falsa
      la frase. Se añade la cifra vigente al lado, y el reparto por motivo si cambió.
      **CERRADO.** `--generar-base` sobre `HEAD` = `73a9acb`, 2026-09-14 (hecho por el orquestador; el
      fichero llegó SIN TRACKEAR, no se regeneró ni se editó en esta tanda): **37 entradas, 28 claves
      (documento, cita) distintas**, UTF-8 sin BOM, 0 CR, ordenada, ≤100 (R-14 no se dispara). Por
      motivo: 27 extremo inicial en línea vacía, 5 extremo inicial fuera de rango, 1 extremo final
      fuera de rango, 3 fichero inexistente, 1 ambigua rota en sus 4 candidatas. Cifra vigente añadida
      AL LADO de las 51, sin borrarlas (caso B), en los seis sitios: `proposal.md` (fila R-14 del §9,
      fila Q9 del §13, Pieza 3 punto 4), `spec.md` (medición de R-14 en RQ-CV-09, cierre de R-14 en
      RQ-CV-17) y `design.md` (§1 fila «Línea base», §3 fila `lineaBase.jsonl`, medición 7 del §12).
- [x] 3.3 Añadir fila **IV-10** en `CLAUDE.md` (recuento `CLAUDE.md:249` en `648432d`, de «Cuatro» a
      «Cinco»; tabla `CLAUDE.md:262-265` en `648432d` gana la fila) y en `openspec/config.yaml`
      (`incumplimientos_vivos`, tras el final de IV-9 en `openspec/config.yaml:798` en `648432d`), con
      cifra, fecha de medición, SIN dueño y la frase de Q4: «la base no encoge hasta que Gerencia asigne
      quién la repara» (RQ-CV-15).
      **CERRADO.** `CLAUDE.md`: «Cuatro» → «Cinco»; nueva fila en la tabla de incumplimientos vivos con
      `regla: — (regla de mutación 4)`, la cifra (37 entradas, 28 claves, 2026-09-14, `73a9acb`) y la
      frase de Q4 literal. `openspec/config.yaml`: entrada `id: IV-10` añadida tras el final de IV-9
      (`regla`, `ubicacion`, `verificado`, `encontrado_en`, `descripcion`, `destino`,
      `por_que_sin_destino`), validada con `js-yaml` (10 entradas en `incumplimientos_vivos`, la última
      `IV-10`).
- [x] 3.4 Añadir a la regla de mutación 4 de `CLAUDE.md:171-205` en `648432d` las DOS frases: la de Q6
      («un ejemplo de cita rota se escribe sin forma de cita, o el detector lo tratará como rota») y la
      de Q9 (el detector no bloquea la forma abreviada; su comprobación sigue siendo de lectura humana,
      con el informe como ayuda) (RQ-CV-15).
      **CERRADO.** Dos bullets nuevos en el blockquote de la regla de mutación 4, tras la cuarta
      («Una cita en un comentario NO es una aserción»): la frase de Q6 y la de Q9, las dos con las
      palabras literales que pide RQ-CV-15.
- [x] 3.5 Reescribir el ejemplo de cita rota del archive (§2 de la propuesta) SIN forma de cita, en
      prosa (Q6, opción i) — sin escribir ningún `fichero:línea` de ejemplo.
      **CERRADO.** El bullet de Q6 (3.4) trae el ejemplo real del archive en prosa, sin
      `fichero:línea`: «la línea 206 de este fichero», que cita el `proposal.md` archivado de
      `por-entregar-es-espera` y en `984b797` era una línea vacía (fechado contra esa revisión: las
      inserciones de esta tanda le pusieron texto).
- [x] 3.6 Confirmar M22 con el ejemplo real ya insertado en `CLAUDE.md`: con forma de cita → bloquea;
      sin forma → pasa (cierra 1.15-1.16 contra contenido real).
      **CERRADO, con el ejemplo real** (repetida por el orquestador: la primera comprobación usó una
      cita inventada). Tres commits temporales con índice aparte, todo el corte y `lineaBase.jsonl`
      incluidos, que difieren sólo en `CLAUDE.md`: en prosa (`dc71a6c`) → salida 0, 0 bloqueantes, 37
      informadas; con forma de cita anclada a `984b797` (`f8887d1`) → salida 1, una bloqueante
      «extremo inicial en línea vacía»; con forma de cita sin ancla (`4ab1974`) → salida 1, la misma.
      Índice real intacto.
- [x] 3.7 Corregir la frase de que `gentle-ai sdd-attempt` mide `changed_lines` «diffeando el árbol
      entero» (decisiones d y c de Gerencia) en sus DOS sitios: la regla del ciclo 2 de `CLAUDE.md`
      (`CLAUDE.md:353` en `648432d`) y el §3 de `design.md` (sin línea, por la convención 2). Lo medido la
      desmiente, y la frase nueva registra las DOS cegueras del ledger, con su medición y su cita anclada:
      (1) no cuenta lo que no está trackeado: el intento 1 registró 55 con 928 líneas nuevas sin trackear,
      porque sus árboles de principio y fin sólo difieren en lo trackeado; (2) cuenta 0 para un fichero
      que era binario en el árbol de partida: el intento 2 registró 144 frente a 247 trackeadas medidas con
      git, y las 103 que faltan son de `detector.ts`, que en `ef08129` llevaba un NUL.
      **CERRADO.** `CLAUDE.md`: la regla del ciclo 2 pierde «ÁRBOL ENTERO» y gana un párrafo con las
      dos cegueras medidas, las dos por defecto (lo nuevo sin trackear no cuenta: intento 1 y corte
      1b-i; un binario en el árbol de partida cuenta 0: intento 2), y el dato de que con todo trackeado
      (1b-ii) el ledger contó lo mismo que git. `design.md` §3: mismo defecto corregido, nombrando la
      regla por su apartado de `CLAUDE.md`. Redacción ajustada por el orquestador a lo medido.

## Fase 4 (Unidad 3) — Hook, instalador, `.gitattributes`, `DEPLOY.md`

**Corte 3** (tareas 4.1-4.14 más dos añadidos de Gerencia, 2026-09-14).

- [x] 4.1 RED (M16 estático, `guardianes.test.ts`): espera que `.githooks/pre-push` invoque `tsx` vía
      `node_modules/.bin/tsx` o `npx --no tsx`; falla porque el fichero aún no existe.
      **CERRADO.** Rojo real: `ENOENT: no such file or directory, open '.githooks/pre-push'`.
- [x] 4.2 GREEN: crear `.githooks/pre-push` (4 líneas): sin `node_modules/.bin/tsx` falla con mensaje
      explícito; si existe, `exec node_modules/.bin/tsx apps/desk/server/citas/cli.ts "$@"`.
      **CERRADO.** Contenido exacto del §5 del diseño; LF puro, 0 CR, sin BOM (comprobado en el blob del
      índice temporal).
- [x] 4.3 MUT (regla de mutación 2, tres formas): ensuciar `.githooks/pre-push` con `npx tsx` a secas,
      `npm exec tsx`, `npm x tsx` (una mutación por forma) → el guardián se pone rojo cada vez; revertir
      a `node_modules/.bin/tsx`.
      **CERRADO.** Las tres formas mutadas EN MEMORIA sobre el contenido real (regla de mutación 2: se
      ensucia lo vigilado, nunca el fichero real del árbol de trabajo) se ponen rojas; control físico
      adicional en `$SP` (copias del hook, proceso `node` nuevo): las tres formas → INSEGURO; el
      original → SEGURO; `cmp` confirma el `.githooks/pre-push` real intacto.
- [x] 4.4 RED (D10, `guardianes.test.ts`): `git check-attr eol` sobre `.githooks/pre-push` debe devolver
      `lf`; falla porque `.gitattributes` no declara la regla.
      **CERRADO.** Rojo real: `expected 'unspecified' to be 'lf'`.
- [x] 4.5 GREEN: añadir `.githooks/* text eol=lf` a `.gitattributes` (candidatos de anclaje ya presentes:
      `.gitattributes:29` en `648432d`, `.gitattributes:31-33` en `648432d`,
      `.gitattributes:36` en `648432d`).
      **CERRADO.** Línea añadida al final del fichero (tras `*.sh text eol=lf`), con su porqué.
- [x] 4.6 MUT (regla de mutación 2): repositorio sintético SIN esa línea → el guardián se pone rojo; con
      ella, verde.
      **CERRADO.** Dos pruebas con `repoGitTemporal()`: sin la regla en el `.gitattributes` sintético →
      `eolDeclarado` ≠ `lf`; con ella → `lf`. El `.gitattributes` real del repositorio nunca se toca
      para esta mutación.
- [x] 4.7 Añadir el hook con `git add --chmod=+x` (bit de ejecución, declarado y sin guardián — D10).
      **CERRADO por el orquestador** (2026-09-14): `git add --chmod=+x .githooks/pre-push`, y
      `git ls-files -s` da modo 100755; el blob tiene 4 líneas y 0 CR, y `git check-attr eol` devuelve
      `lf`. El contenido es el verificado por 4.1-4.3.
- [x] 4.8 RED (rojo h, M11, dos signos obligatorios, `instalador.test.ts`): directorio sin `.git` →
      `spawnSync` sale 0 y NO instala; directorio CON `.git` → sale 0 Y `git config --get
      core.hooksPath` devuelve `.githooks`.
      **CERRADO.** Rojo real: ambas pruebas fallaban con `status: 1` (excepción del proceso hijo por
      `scripts/instalar-hooks.mjs` inexistente).
- [x] 4.9 RED (M12): entorno sin binario `git` (`status` nulo) → 0 y no instala; con `git` presente →
      instala.
      **CERRADO**, con control del otro signo (con `git` en el `PATH` → instala).
- [x] 4.10 RED (M13): `git config` falla CON repositorio presente → mensaje visible, `npm ci` sigue en
      verde.
      **CERRADO.** Fallo forzado con un DIRECTORIO llamado `config.lock` dentro de `.git/`.
- [x] 4.11 RED (D9): directorio sin `.git` propio, anidado dentro de otro repositorio → `git rev-parse
      --show-toplevel` no coincide con el actual → sale 0 sin instalar.
      **CERRADO.**
- [x] 4.12 GREEN: crear `scripts/instalar-hooks.mjs` con `spawnSync('git', ['rev-parse','--git-dir'])` +
      comparación de raíz (D9) + `git config core.hooksPath .githooks`, cubriendo 4.8-4.11.
      **CERRADO.** 6/6 pruebas de `instalador.test.ts` en verde tras crear el script; `core.hooksPath`
      del repositorio real comprobado vacío antes y después (`git config --get` sale con código 1).
- [x] 4.13 Añadir script `prepare` a `package.json` (`package.json:10-23` en `648432d` no lo declara)
      que invoque `scripts/instalar-hooks.mjs`.
      **CERRADO.** `"prepare": "node scripts/instalar-hooks.mjs"`, primera entrada de `scripts`. JSON
      válido comprobado. La inserción desplaza en `package.json` la línea que antes era la 22 (ahora la
      23) y la que antes era la 55 (ahora la 56); reparadas las dos citas vivas que las nombraban, en
      `openspec/config.yaml`, líneas 60 y 61 (caso A, barrido de la regla de mutación 4).
- [x] 4.13-A1 **AÑADIDO 1 (Gerencia, 2026-09-14) — el `prepare` rompe el build de Docker.** La etapa 2
      (runtime) del `Dockerfile` copiaba sólo `package.json`, `package-lock.json`, `packages` y `apps`
      antes de `npm ci`, que dispara `prepare`; sin `scripts/` copiado, el build fallaría. RED:
      guardián estático nuevo en `guardianes.test.ts` (`etapasNpmCiSinScripts`): toda etapa que ejecuta
      `npm ci` copia `scripts/` antes o usa `--ignore-scripts`. Rojo real con el `Dockerfile` de hoy:
      `expected [ 'etapa 3, línea "RUN npm ci"' ] to deeply equal []` (numerado desde el primer trozo
      del `split`, que incluye el comentario previo al primer `FROM`; corregido a enumerar sólo trozos
      que empiezan por `FROM`, sin cambiar la lógica). GREEN: `COPY scripts ./scripts` añadido en la
      etapa 2, antes de `RUN npm ci`, con una línea de comentario explicando por qué. MUT (regla de
      mutación 2, en memoria sobre el contenido real): quitar el `COPY` → rojo; MUT posición (regla de
      mutación 1): el mismo `COPY` puesto DESPUÉS de `RUN npm ci` → rojo. Control físico adicional en
      `$SP` (copia real, proceso `node` nuevo): original → `[]` (verde); sin el `COPY` → detecta la
      etapa 2; `cmp` confirma el `Dockerfile` real intacto tras el control. Un `git diff` contra la
      partida del corte confirma que el ÚNICO cambio del `Dockerfile` es el `COPY` y su comentario — el
      comentario preexistente sobre `tsx` como devDep de la etapa 2 (falso, registrado aparte) no se tocó.
- [x] 4.14 Añadir a `DEPLOY.md` el comando manual de instalación para `--ignore-scripts` y el `--unset
      core.hooksPath` de la reversión de urgencia (candidatos de anclaje: `DEPLOY.md:64` en `648432d` o
      `DEPLOY.md:204` en `648432d`).
      **CERRADO.** Nueva sección «## 8. El hook de citas (`pre-push`...)», insertada justo antes de
      «## Notas» (el candidato de anclaje `DEPLOY.md:204` en `648432d`), con los dos comandos y la
      frase de que `--no-verify` nunca es la salida legítima. La inserción desplaza en `DEPLOY.md` la
      línea que antes era la 205 (ahora la 224); reparadas las DOS citas vivas (sin ancla) que la
      nombraban, en `docs/sdd/Paquete_de_Despliegue_2026-09-10.md`, líneas 127 y 138 del propio
      documento — la segunda encontrada en la segunda pasada de la forma abreviada (atribuida a
      `DEPLOY.md` por Lbc, misma línea física; caso A, barrido de la regla de mutación 4).
- [x] 4.14-A2 **AÑADIDO 2 (Gerencia, 2026-09-14) — `--no-verify` en IV-10.** Frase mínima en prosa, sin
      forma de cita, en la fila IV-10 de `CLAUDE.md` y en la entrada IV-10 de `openspec/config.yaml`
      (campo `no_verify` nuevo): saltarse el hook con `--no-verify` NO es una salida legítima; las
      legítimas son reparar la cita o añadirla a mano a la base (mitigación de R-4 de la propuesta).
      YAML validado con `js-yaml` tras el cambio: 10 entradas en `incumplimientos_vivos`, última `IV-10`.

## Fase 5 — Verificación final y precondición dura (manual, cuenta como tareas)

- [x] 5.1 M16 en ejecución (registrar en verify): **RENOMBRAR** `node_modules/.bin/tsx` (decisión de
      Gerencia 2026-09-14 — no borrar `node_modules`), intentar el push con el hook invocando
      `node_modules/.bin/tsx`; confirmar que falla con mensaje explícito, nunca sale 0 en silencio.
      **CERRADO.** `sha256sum` guardado, renombrado a `tsx.fase5-bak` con `trap` de restauración.
      Invocación directa (stdin real de `pre-push`): `exit=1`, `pre-push: falta node_modules/.bin/tsx
      (npm ci). El push se para sin comprobar.` (mensaje literal de `.githooks/pre-push:3`). Restaurado;
      sha256 idéntico al original. Repetida con `tsx` restaurado: `exit=0`, informe completo
      (`comprobadas 1755`). Detalle en `apply-progress.md`, sección «Corte 4».
- [x] 5.2 M18, orden (registrar en verify): confirmar que el orden real fue detector-con-pruebas → base
      generada → IV-10 escrito → hook e instalador, y que el push de cierre NO quedó bloqueado por
      citas que la tanda no rompió.
      **CERRADO.** Orden reconstruido con `git log --oneline 773ad75..f962e81` y
      `gentle-ai sdd-attempt status`: detector con pruebas `7625921`…`73a9acb` → base generada ANTES de
      tocar `CLAUDE.md` (la tarea 3.2 genera la base sobre `73a9acb`, la tarea 3.3 escribe IV-10 en
      `CLAUDE.md` después) en `35f2698` → hook e instalador en `f962e81`. Push de cierre:
      `origin/main` = `HEAD` = `f962e81` y `gh run list` muestra el run `34874300637` en `success` sobre
      ese commit — no pudo haber quedado bloqueado. La salida LITERAL del hook durante ESE push concreto
      SÍ está registrada, sólo como copia literal PARCIAL, con procedencia y recorte declarados en el
      apartado 5.2 («M18, el orden real», push de cierre) del progreso de apply.
- [x] 5.3 M19, coste (registrar en verify): invocar el hook directamente con la entrada real de
      `pre-push` por stdin, sobre el árbol completo; registrar el tiempo total (objetivo ≤5 s, tope
      duro 10 s) y confirmar margen (RQ-CV-13).
      **CERRADO.** Tres tomas cronometradas con `date +%s%N` sobre HEAD (`f962e81`): 1.985, 2.190 y
      2.097 ms, `exit=0` y `comprobadas=1755` en las tres (barrido real, no cortocircuitado). Margen
      ~2,8-3 s contra el objetivo de 5 s y ~7,8-8 s contra el tope de 10 s.
- [x] 5.4 Comprobación FINAL sobre lo COMMITEADO (RQ-CV-14, segunda pasada — Q7b): con `proposal.md`,
      spec, `design.md`, `tasks.md`, `CLAUDE.md` y `openspec/config.yaml` ya en su forma definitiva
      (IV-10 dentro), correr el detector y confirmar 0 bloqueantes. No vale la comprobación intermedia.
      **CERRADO por el orquestador.** Hecha tras commitear 5.1-5.3, 5.5 y 5.6 en `53c6fc5`: `--sha 53c6fc5`
      da `exit=0`, 1.765 comprobadas, **0 bloqueantes, 37 informadas y 0 caducadas**, en 2.207 ms. El
      commit de cierre lo vuelve a comprobar el hook en el push. Salida literal en `apply-progress.md`,
      sección «Corte 4 — verificación del orquestador».
- [x] 5.5 Confirmar que TODA cita de `proposal.md`, `specs/spec.md`, `design.md`, `tasks.md` y
      `apply-progress.md` a `CLAUDE.md`, `openspec/config.yaml`, `package.json`, `DEPLOY.md`,
      `.gitattributes` **y `Dockerfile`** está ANCLADA, cita por cita, en su misma línea física, a la
      revisión donde lo que afirma era cierto (`648432d` o la que corresponda), y que ningún ancla quedó
      partida por el salto de línea.
      **CERRADO.** Script `tsx` en el scratchpad (nunca en el repositorio) que importa `cosechar` de
      `cosecha.ts` y `resolverToken`/`construirIndice` de `resolucion.ts` reales, aplicado a los cinco
      artefactos filtrado por los seis destinos: **91 citas** encontradas, **5 en presente** en la
      primera pasada. Reparadas las **4** que eran afirmaciones nuevas sin ancla en `proposal.md` —§3
      Pieza 2 (nota para `sdd-design`, ejemplo de control host:puerto), §3 Pieza 4 (punto 1), y §3 Pieza
      5 (punto 1, cita completa y cita abreviada)—, sobre `Dockerfile`, verificadas ciertas en `648432d`
      con `git show 648432d:Dockerfile`; y la **1** restante en `apply-progress.md`, Corte 2 — segunda
      parte, «Barrido de la regla de mutación 4», `openspec/config.yaml:807-838` en `648432d`, verificada
      como la entrada `PF-1` con `git show 648432d:openspec/config.yaml`. Segunda pasada: **91/91 ancladas, 0 en presente, 0
      partidas**. Regla de mutación 4: `apply-progress.md` (+230) y este `tasks.md` (+33) sí crecen;
      el barrido de citas a los dos no encuentra ninguna fuera del cambio, y las autocitas ya usan la
      numeración nueva. Detalle en `apply-progress.md`, sección «Corte 4».
- [x] 5.6 `npm test`, `npm run typecheck`, `npm run lint` (≤158 avisos) y `npm run build` en verde;
      cobertura sobre los umbrales de `vitest.config.ts:58-63`.
      **CERRADO.** `npm test`: 1108/1110 pasadas, 2 omitidas (120/121 ficheros). `npm run typecheck`:
      exit 0. `npm run lint`: 0 errores, 158 avisos (≤158). `npm run build`: exit 0. `npm run
      test:coverage`: exit 0, global 94,79 % stmts · 83,96 % ramas (el registro original decía 83,95; el
      verify lo remidió en 83,96 con el mismo comando y el mismo árbol) · 98,2 % funcs · 94,79 % líneas
      (umbrales `vitest.config.ts:58-63`: 92/78/96/92, todos superados); `apps/desk/server/citas` 99,23 %
      · 95,42 % · 97,29 % · 99,23 %.

---

## Tareas de PERSONA — fuera del recuento (regla del ciclo 1)

Archivar NO las da por hechas. Ninguna describe trabajo que una tanda pudiera hacer en este
repositorio (reverso de la regla).

- **P.1** Leer lo semántico: que cada línea citada de la línea base (51 entradas medidas sobre
      `773ad75`) DIGA lo que su frase afirma. Dueño: quien decida el alcance de la reparación (casos
      A/B/C de `CLAUDE.md:195-199` en `648432d`). Registro: dueño, resultado y fecha.
- **P.2** Asignar destino a IV-10 y decidir quién repara la base. Dueño: Gerencia. Registro: en la
      propia fila IV-10 de `CLAUDE.md` y `openspec/config.yaml`, con la frase de Q4 mientras siga sin
      decidir.
