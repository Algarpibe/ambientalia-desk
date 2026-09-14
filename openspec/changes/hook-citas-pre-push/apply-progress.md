# Apply progress — hook-citas-pre-push

## Corte 4 — verificación del orquestador y tarea 5.4

Partida `f962e81`. Intento de runtime ordinal 7. Commit A `53c6fc5` (tareas 5.1-5.3, 5.5 y 5.6);
la 5.4 va en el commit de cierre, porque exige un commit sobre el que correr `--sha`.

**Repetido por el orquestador**, no heredado del sub-agente:

- **5.1.** `node_modules/.bin/tsx` renombrado con `trap` de restauración y hook invocado directamente
  con el stdin de `pre-push`:

  ```text
  pre-push: falta node_modules/.bin/tsx (npm ci). El push se para sin comprobar.
  exit=1
  ```

  Restaurado: sha256 idéntico y la copia de respaldo ya no existe. Repetido con `tsx`: `exit=0` y
  `comprobadas 1755`.
- **5.3.** Tres tomas más: 2.639, 2.544 y 2.831 ms, `exit=0` y `comprobadas 1755` en las tres. Con las
  del sub-agente (1.985-2.190 ms), el rango medido es 1,99-2,83 s: cumple el objetivo de 5 s y queda
  lejos del tope de 10 s.
- **5.5.** El script del scratchpad, repetido tras las correcciones de abajo: **98 filas, 98 ancladas,
  0 en presente, 0 partidas**.
- **Hook instalado de verdad**: `git config --show-origin core.hooksPath` → `.githooks`, desde `.git/config`.

**Corregido por el orquestador antes del commit A.** La sección del sub-agente traía afirmaciones
falsas:

- decía que `wc -l` no había cambiado y que no hacía falta el barrido de la regla de mutación 4, cuando
  `apply-progress.md` pasó de 701 a 931 líneas y `tasks.md` creció 33;
- daba un tamaño de 8 líneas, cuando eran 289;
- situaba los bloques literales en la numeración anterior a insertar la sección.

Las tres se corrigieron en el sitio, sin mover líneas, y la misma afirmación falsa se corrigió en la 5.5
de `tasks.md`. El barrido hecho: fuera del cambio nadie cita líneas de estos dos ficheros; dentro, las
autocitas se comprobaron contra el fichero.

### 5.4 — Comprobación final sobre lo COMMITEADO (RQ-CV-14, segunda pasada)

`node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha 53c6fc5`, con `proposal.md`, spec,
`design.md`, `tasks.md`, `CLAUDE.md` y `openspec/config.yaml` en su forma definitiva:

```text
citas · 53c6fc5 · 53c6fc5
  comprobadas ............ 1765
  saltadas ............... 1601   (sin barra y sin resolver 383 · ambiguas con alguna candidata válida 157 · directorios 0 · abreviadas huérfanas 1061 · anclas sin resolver 0 · no legibles 0)
  fuera del repositorio .. 3
  abreviadas rotas ....... 7   (informativas: no bloquean)
  no son citas ........... 7   (marcas de hora ISO, horas y puertos de URL; fuera de las cuatro cifras)
  texto que git cree binario .. 0   (no barridos)
  índice remoto .......... origin/main
  línea base ............. 37 informadas · 0 caducadas
exit=0
```

**0 bloqueantes · 37 informadas · 0 caducadas**, en 2.207 ms. No aparece la cabecera «Bloqueantes:», y
`apps/desk/server/citas/informe.ts:30` sólo la omite con la lista vacía. Como este commit de cierre
vuelve a tocar `apply-progress.md` y `tasks.md`, el hook del push lo comprueba otra vez sobre el sha final.

**Tamaño del intento 7** con git: `git diff --shortstat f962e81`, medido con este cierre escrito →
**3 ficheros, 342 inserciones y 14 borrados: 356 líneas**, dentro del presupuesto de 800. Nada nuevo sin trackear fuera de los 8 documentos ajenos de la línea base.

## Corte 4 — Fase 5: verificación final (5.1-5.3, 5.5, 5.6)

Partida `f962e81` (= `origin/main` = `HEAD`). Intento de runtime `sdd-attempt` ordinal 7, token
`sha256:232898218cbeecd78a7f0b93bfafcd0b4d57a3a1cea21541cd5a83b1d98e7661`. Fase de verificación y
anclaje de citas: **sin código de producción tocado**; los únicos cambios son texto en `proposal.md` y
en este mismo `apply-progress.md` (anclajes de citas, tarea 5.5) y la actualización de `tasks.md`
(marcas `[x]` y evidencia). 5.4 queda `[ ]`, es tarea del orquestador. Sin `git add`, commit ni push.

### TDD Cycle Evidence

Las cinco tareas de esta fase son de **verificación manual y documental** (diseño,
`design.md:546` y `:550-552`: «M16 en ejecución ..., M18 ..., M19 ... — Manual, registrado en
verify»); 5.5 es un anclaje de citas igual en naturaleza a 4.14/4.14-A2 del corte 3 (documental, sin
prueba automatizada); 5.6 ejecuta la suite ya existente sin escribir código nuevo. Por eso el ciclo
RED → GREEN → REFACTOR no aplica: no hay producción que hacer fallar primero.

| Tarea | Fichero de prueba | Capa | Red de seguridad | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 5.1 (M16 en ejecución) | — | Manual (proceso real, hook + `sh`) | N/A (sin código de producción tocado) | ➖ N/A (verificación, no desarrollo) | ✅ ejecutado dos veces (roto y restaurado), evidencia abajo | ➖ N/A | ➖ N/A |
| 5.2 (M18, orden) | — | Documental (`git log`, `sdd-attempt status`, `apply-progress.md`) | N/A | ➖ N/A | ✅ orden reconstruido y contrastado con tres fuentes | ➖ N/A | ➖ N/A |
| 5.3 (M19, coste) | — | Manual (proceso real, hook + `sh`) | N/A | ➖ N/A | ✅ tres tomas ejecutadas, evidencia abajo | ✅ 3 tomas (triangulación por repetición) | ➖ N/A |
| 5.5 (anclaje) | — | Documental (script `tsx` propio sobre `cosecha.ts`/`resolucion.ts` reales) | ✅ 91/91 citas comprobadas antes de tocar nada | ➖ N/A (no es TDD de producción) | ✅ script ejecutado, 5 en presente detectadas | ✅ segunda pasada tras reparar, 0 en presente | ➖ N/A |
| 5.6 (suite) | — | N/A (ejecución de suite existente) | ✅ 1108/1110 antes de esta fase (heredado del corte 3) | ➖ N/A | ✅ 1108/1110 tras la fase, sin regresión | ➖ N/A | ➖ N/A |

### Test Summary
- **Total tests escritos esta tanda**: 0 (fase de verificación, sin producción nueva).
- **Total tests pasando (regresión completa, `npm test`)**: 1108/1110 (2 `skipped`), sin cambio frente
  al corte 3.
- **Capas usadas**: Manual (2: M16 en ejecución, M19 coste) · Documental (2: M18 orden, anclaje 5.5) ·
  Regresión (1: suite completa).

### 5.1 — M16 en ejecución, sin borrar `node_modules`

Método real (decisión de Gerencia 2026-09-14): en vez de borrar `node_modules`, se renombra sólo
`node_modules/.bin/tsx`, con `sha256sum` guardado antes y un `trap` de restauración en la misma sesión
de shell, para que el binario vuelva aunque algo falle a media prueba.

**Salida literal 1 — sin `tsx` (invocación directa del hook, mismo stdin que fabrica `pre-push`):**

```
pre-push: falta node_modules/.bin/tsx (npm ci). El push se para sin comprobar.
exit=1
```

Mensaje explícito de `.githooks/pre-push:3`; nunca sale 0 en silencio. Confirmado tras restaurar:
`sha256sum node_modules/.bin/tsx` → `ccf543c56fffe704c66222818bfc4e6bfe7330fa980d5d15c7f7d9db15cd2353`,
idéntico al guardado antes de renombrar.

**Salida literal 2 — con `tsx` restaurado (control del otro signo):**

```
citas · f962e81 · refs/heads/main
  comprobadas ............ 1755
  saltadas ............... 1574   (sin barra y sin resolver 383 · ambiguas con alguna candidata válida 139 · directorios 0 · abreviadas huérfanas 1052 · anclas sin resolver 0 · no legibles 0)
  fuera del repositorio .. 3
  abreviadas rotas ....... 7   (informativas: no bloquean)
  no son citas ........... 7   (marcas de hora ISO, horas y puertos de URL; fuera de las cuatro cifras)
  texto que git cree binario .. 0   (no barridos)
  índice remoto .......... f962e81
  línea base ............. 37 informadas · 0 caducadas
exit=0
```

(el bloque de «Abreviadas rotas» con las 7 líneas se omite aquí por brevedad; es el mismo listado que
imprime `--sha HEAD` más abajo). Redacción de la tarea 5.1 ajustada en `tasks.md`: decía «borrar
`node_modules`»; el método real es renombrar `node_modules/.bin/tsx` (decisión de Gerencia
2026-09-14), sin perder qué se comprueba: que el hook falla con mensaje explícito, nunca en silencio.

### 5.2 — M18, el orden real

Reconstruido con tres fuentes independientes: `git log --oneline 773ad75..f962e81`,
`gentle-ai sdd-attempt status --cwd C:/dev/Desk_2_R1.023 --change hook-citas-pre-push` (ordinales 3-7)
y este propio `apply-progress.md`.

1. **Detector con pruebas**: `7625921` (núcleo, 1.1-1.27) → `ef08129` → `69bc3a9` → `01df7ce` →
   `56a0095` (adaptador git + CLI, 2.0-2.11) → `049a233` → `36e5a2d` (2.12-2.26) → `742359b` →
   `984b797` → `73a9acb` (coste por revisión, RQ-CV-03 en ancladas, modos `--sha`/`--generar-base`,
   3.8-3.10). Confirmado por `sdd-attempt status`, ordinales 3-5 (`outcome: passed` los tres).
2. **Base generada e IV-10 escrito**, ambos en `35f2698`, y **en ese orden dentro del mismo commit**:
   la base se generó ANTES de tocar `CLAUDE.md`. Cita en este mismo artefacto: `apply-progress.md:503`
   («**3.2** ... `--generar-base` sobre `73a9acb`: 37 entradas, 28 claves») antecede a
   `apply-progress.md:509` («**3.3.** `CLAUDE.md`: ... fila nueva ... IV-10»). Confirmado también por
   `sdd-attempt status` ordinal 5, `work_unit`: «coste por revision, RQ-CV-03 en ancladas, modos del
   CLI, linea base, IV-10 y regla de mutacion 4 (tareas 3.8, 3.9, 3.10 y 3.1-3.7)».
3. **Hook e instalador**, en `f962e81` (`sdd-attempt status` ordinal 6, `work_unit`: «corte 3: hook
   versionado, instalador, gitattributes, DEPLOY, arreglo del Dockerfile y --no-verify en IV-10»).

**Push de cierre.** `git rev-parse HEAD origin/main` → los dos valen
`f962e81bf498144c1bafcd3eade485bcc1a9edba`. `gh run list --limit 8` muestra el run `34874300637`
(«feat(citas): hook pre-push, instalador, eol=lf, DEPLOY y arreglo del …», evento `push`, rama `main`)
en `completed / success`, 2026-09-14T17:21:56Z. Como el workflow de CI sólo se dispara cuando GitHub
recibe el push, esto confirma que el push de `f962e81` llegó y no quedó bloqueado por ninguna cita que
la tanda no rompiera. **La salida LITERAL del hook durante ESE push concreto no quedó registrada en
ningún artefacto de la tanda: se dice así, «no registrada», y no se reconstruye.**

### 5.3 — M19, coste

Invocación directa del hook con el stdin real de `pre-push` (`refs/heads/main <sha-local>
refs/heads/main <sha-remoto>`), sobre el árbol completo (HEAD = `f962e81`), tres tomas cronometradas
con `date +%s%N`:

| Toma | Tiempo | Salida | `comprobadas` |
|---|---|---|---|
| 1 | 1.985 ms | 0 | 1.755 |
| 2 | 2.190 ms | 0 | 1.755 |
| 3 | 2.097 ms | 0 | 1.755 |

Las tres cifras de `comprobadas` son idénticas y no cero: el barrido corrió de verdad sobre el árbol
completo, no cortocircuitó por local = remoto (de hecho local y remoto SÍ son iguales aquí — primer
push ya integrado —, y aun así el hook barre igual: no hay atajo de «nada que revisar»). Margen: **~2,8
a ~3 s** contra el objetivo de 5 s (RQ-CV-13) y **~7,8 a ~8 s** contra el tope duro de 10 s.

### 5.5 — Anclaje de citas a los seis destinos

**Alcance.** `proposal.md`, `specs/citas-verificables/spec.md`, `design.md`, `tasks.md` y este
`apply-progress.md`, filtrados por citas a `CLAUDE.md`, `openspec/config.yaml`, `package.json`,
`DEPLOY.md`, `.gitattributes` y `Dockerfile` (añadido a la lista porque el corte 3 lo modificó).

**Método.** Script `anclaje-fase5.mts`, SÓLO en el scratchpad
(`C:\Users\algar\AppData\Local\Temp\claude\C--dev-Desk-2-R1-023\41e88804-b007-406a-a955-7ac3c33a5b7b\scratchpad`,
nunca en el repositorio), que importa `cosechar` de `apps/desk/server/citas/cosecha.ts` y
`construirIndice`/`resolverToken` de `apps/desk/server/citas/resolucion.ts` — el mismo código que usa
el hook real, sin reimplementar su lógica — y los aplica línea a línea a los cinco artefactos.

**Antes (primera pasada): 91 citas encontradas a los seis destinos, 86 ancladas, 5 en presente** (las filas usan la numeración de hoy; en `f962e81` era la línea 258):

| Documento:línea | Cita | Destino | Estado |
|---|---|---|---|
| `apply-progress.md:549` | `` `openspec/config.yaml:807-838` `` | `openspec/config.yaml` | en presente |
| `proposal.md:406` | `` `Dockerfile:18` `` (ejemplo de control, dos signos) | `Dockerfile` | en presente |
| `proposal.md:536` | `` `Dockerfile:18` `` («copia `apps` entera») | `Dockerfile` | en presente |
| `proposal.md:565` | `` `Dockerfile:2` `` («`node:22-alpine` no instala git») | `Dockerfile` | en presente |
| `proposal.md:565` | `` `:10` `` (abreviada, atribuida a `Dockerfile`) | `Dockerfile` | en presente |

0 anclas partidas por salto de línea en ninguna de las 91.

**Reparación, cita por cita (caso B de `CLAUDE.md:195-199` en `648432d` — anclar a la revisión donde
la frase sigue siendo cierta, sin renumerar):**

| Documento:línea | Revisión probada | Comprobación | Resultado |
|---|---|---|---|
| `proposal.md:406` | `648432d` | `Dockerfile:18` en `648432d` = `COPY apps ./apps` (`git show 648432d:Dockerfile \| sed -n '18p'`) | Cierto → anclada a `648432d` |
| `proposal.md:536` | `648432d` | ídem — `COPY apps ./apps` en la línea 18 | Cierto → anclada a `648432d` |
| `proposal.md:565` (completa) | `648432d` | `Dockerfile:2` en `648432d` = `FROM node:22-alpine AS build` | Cierto → anclada a `648432d` |
| `proposal.md:565` (abreviada `:10`) | `648432d` | `Dockerfile:10` en `648432d` = `FROM node:22-alpine`; sin `apk add` en todo el fichero | Cierto → anclada a `648432d` |
| `apply-progress.md:549` | `648432d` | `openspec/config.yaml:807` en `648432d` = `- id: PF-1`; `:838` en `648432d` = `docs/artefactos/NOTA.md.` (cierre del bloque de esa entrada) | Cierto → anclada a `648432d` |

Las tres claims sobre `Dockerfile` siguen siendo también ciertas HOY (`f962e81`): el `COPY scripts
./scripts` del corte 3 se insertó DESPUÉS de la línea 18, así que no desplazó ni la línea 2 ni la 10 ni
la 18. Se ancla igual a `648432d`, por consistencia con la convención Q7a (`design.md:308-311`), que
manda anclar TODA cita a estos seis ficheros desde los artefactos de la tanda, sin condicionarlo a que
además siga siendo cierto en el presente.

**Después (segunda pasada, mismo script, antes de escribir esta propia sección): 91/91 ancladas, 0 en
presente, 0 partidas.**

⚠️ **Nota de método (efecto recursivo, mismo molde que Q6 en `apply-progress.md` del corte 3).** Las
tablas de esta misma sección 5.5, al citar `` `Dockerfile:18` ``, `` `apply-progress.md:549` ``, etc.
con forma de cita para dejar rastro exacto, entran ELLAS MISMAS en el alcance del barrido en cuanto se
escriben — el propio `apply-progress.md` es uno de los cinco artefactos vigilados. Volviendo a correr
el script una vez escrita esta sección (incluida la reparación de los dos nuevos casos que ese
crecimiento sacó a la luz: `apply-progress.md`, la abreviada `` `:838` `` de la fila de reparación de
`config.yaml`, y `tasks.md`, la cita completa a `` `openspec/config.yaml:807-838` `` del resumen de
5.5) el recuento final, reproducible y estable es **98 filas, 98 ancladas, 0 en presente, 0 partidas**.
Las 91 originales quedan documentadas arriba como la fotografía ANTES de escribir este párrafo; las 7
adicionales son citas de ESTE mismo informe sobre sí mismo, no citas nuevas en el código o los
artefactos de diseño.

Las 86 citas que ya llegaban ancladas de cortes anteriores no se re-verificaron una a una en esta fase
—ya tienen su propia evidencia de verificación en las secciones de los cortes 2 y 3 de este mismo
artefacto—; el script sí las recorrió todas y no encontró ninguna sin ancla ni con ancla partida.

**Comprobación intermedia** (item 6 de la tarea): `node_modules/.bin/tsx apps/desk/server/citas/cli.ts
--sha HEAD` → `exit=0`, `comprobadas 1755`, 0 bloqueantes — mismo resultado antes y después de los
anclajes de esta fase, porque `--sha HEAD` lee el árbol COMMITEADO (`f962e81`) y los cuatro anclajes
que añadió esta fase están en el árbol de trabajo, sin commitear. Para lo no commiteado la comprobación
válida es el propio script, no `--sha HEAD`: así se deja dicho aquí explícitamente.

**Bloques de salida literal pegada** (los cinco ```text``` de este mismo `apply-progress.md`, líneas
935-978 hoy): revisados a mano — no contienen ninguna cita a los seis destinos (son salidas de `vitest`
sobre pruebas del detector, no menciones a `CLAUDE.md`/`config.yaml`/`package.json`/`DEPLOY.md`/
`.gitattributes`/`Dockerfile`); el propio barrido del script tampoco encontró coincidencias ahí. No se
tocan.

**Regla de mutación 4 (corregido por el orquestador).** Los anclajes van DENTRO de su línea física y
`proposal.md` sigue en 1.068 líneas, pero esta sección añade 230 líneas arriba de `apply-progress.md`
(701 → 931) y la fase 5 añade 33 a `tasks.md`. Barrido con `git grep -nE "(apply-progress|tasks)\.md:[0-9]+"`:
fuera del cambio no hay citas a estos dos ficheros; dentro, las tres autocitas (hoy `:503`, `:509` y `:549`) se renumeraron y se comprobaron.

### 5.6 — Suite completa

| Comando | Resultado |
|---|---|
| `npm test` | **1108/1110** pasadas, 2 `skipped` (120/121 ficheros, 1 `skipped` sin `DATABASE_URL`) |
| `npm run typecheck` | exit 0, sin salida |
| `npm run lint` | **0 errores, 158 avisos** (≤ 158, mismo trinquete que el corte 3) |
| `npm run build` | exit 0, `vite build` completo (`✓ built in 1.67s`) |
| `npm run test:coverage` | exit 0 — **global 94,79 % stmts · 83,95 % ramas · 98,2 % funcs · 94,79 % líneas**; `apps/desk/server/citas` **99,23 % · 95,42 % · 97,29 % · 99,23 %** |

Umbrales de `vitest.config.ts:58-63` (lines 92, statements 92, functions 96, branches 78): los cinco
superados con margen. Sin cambio frente a las cifras del corte 3 (fase de verificación, sin producción
nueva).

### Tamaño y limpieza

- **Tamaño con git** (corregido por el orquestador; la cifra anterior, 8, se midió antes de escribir
  esta sección y `tasks.md`): `git diff --numstat f962e81` → `apply-progress.md` +231/-1,
  `proposal.md` +3/-3, `tasks.md` +42/-9 = **276 inserciones, 13 borrados, 289 líneas**, antes de la
  5.4. Por debajo del presupuesto de 800 de este intento.
- **Nuevo sin trackear**: ninguno fuera de los 8 documentos ajenos de `docs/` de la línea base del
  orquestador (`linea-base-sin-trackear-f962e81.txt`, comprobado por diferencia de conjuntos: los
  mismos 8 ficheros, mismo tamaño en líneas cada uno).
- **`tsx` restaurado**: `sha256sum node_modules/.bin/tsx` tras la prueba de 5.1 →
  `ccf543c56fffe704c66222818bfc4e6bfe7330fa980d5d15c7f7d9db15cd2353`, idéntico al guardado antes de
  renombrar; `node_modules/.bin/tsx.fase5-bak` no existe (restaurado por el `trap` al terminar la
  sesión de shell que hizo el renombrado).
- **Scripts**: `anclaje-fase5.mts` y `coverage-out.txt` viven SÓLO en el scratchpad; nada se escribió
  en el repositorio salvo los ficheros de la tanda (`proposal.md`, `apply-progress.md`, `tasks.md`).
- **`git status --porcelain` final**: `M openspec/changes/hook-citas-pre-push/apply-progress.md`,
  `M openspec/changes/hook-citas-pre-push/proposal.md` (más `tasks.md` tras esta misma edición), y los
  8 documentos ajenos de `docs/`, intactos, sin tocar. Sin `git add`, commit ni push.

### Work Unit Evidence

| Evidencia | Valor |
|---|---|
| Comando de prueba enfocado y resultado | Invocación directa de `.githooks/pre-push` vía stdin real (mismo comando de 5.1/5.3): sin `tsx` → `exit=1` con mensaje explícito; con `tsx` → `exit=0`, `comprobadas 1755`, 0 bloqueantes |
| Arnés de runtime real | El propio hook (`sh .githooks/pre-push`) invocado con el binario real `node_modules/.bin/tsx` sobre el árbol de trabajo real — es el runtime real de producción, no un mock ni una prueba sintética |
| Frontera de reversión | `git checkout -- openspec/changes/hook-citas-pre-push/proposal.md openspec/changes/hook-citas-pre-push/apply-progress.md openspec/changes/hook-citas-pre-push/tasks.md` revierte exactamente esta fase, sin tocar ninguna unidad de producción de los cortes 1-3 |

## Corte 3 — verificación del orquestador (4.1-4.14 y los tres añadidos)

Partida `35f2698`. **4.7, hecha por el orquestador:** `git add --chmod=+x .githooks/pre-push`; `git ls-files -s`
da modo 100755, el blob tiene 4 líneas y 0 CR, y `git check-attr eol` devuelve `lf`.

**Mutaciones sobre los ficheros VIGILADOS reales** (regla de mutación 2; el sub-agente las hizo en memoria o
sobre copias). Cada una: copia en el scratchpad, fichero real ensuciado, `npx vitest run` en proceso nuevo,
restauración y `cmp` idéntico en las diez:

| Tarea | Fichero ensuciado | Mutación | Salida literal |
|---|---|---|---|
| 4.3 | `.githooks/pre-push` | `exec npx tsx` | `AssertionError: expected false to be true` |
| 4.3 | `.githooks/pre-push` | `exec npm exec tsx` | `AssertionError: expected false to be true` |
| 4.3 | `.githooks/pre-push` | `exec npm x tsx` | `AssertionError: expected false to be true` |
| 4.6 | `.gitattributes` | quitar la línea de `.githooks` | `AssertionError: expected 'unspecified' to be 'lf'` |
| añadido 1 | `Dockerfile` | quitar `COPY scripts ./scripts` | `AssertionError: expected [ 'etapa 2, línea "RUN npm ci"' ] to deeply equal []` |
| añadido 1 | `Dockerfile` | mover el `COPY` detrás de `npm ci` (posición) | la misma |
| 4.8 | `scripts/instalar-hooks.mjs` | fijar otra clave en vez de `core.hooksPath` | `AssertionError: expected null to be '.githooks'` |
| 4.9 | `scripts/instalar-hooks.mjs` | lanzar el error cuando no hay binario `git` | `AssertionError: expected 1 to be +0` |
| 4.10 | `scripts/instalar-hooks.mjs` | callar el mensaje del fallo de `git config` | `AssertionError: expected '' to match /no se pudo fijar core\.hooksPath/` |
| 4.11 | `scripts/instalar-hooks.mjs` | quitar la comparación de raíz (D9) | `AssertionError: expected '.githooks' to be null` |

**`docker build` real** (Docker 29.6.2, 2026-09-14), sobre el árbol de trabajo del corte: **salida 0** en 33 s;
las dos etapas ejecutaron `npm ci` sin caché y las dos lanzaron `node scripts/instalar-hooks.mjs` (562 y 167
paquetes), que sale 0 sin `.git`. Final: `naming to docker.io/library/desk-citas-verif:corte3 done`.
**Control del otro signo**, el mismo `Dockerfile` sin el `COPY scripts` pasado por stdin: **salida 1**, con
`Error: Cannot find module '/app/scripts/instalar-hooks.mjs'` y `ERROR: failed to solve: process "/bin/sh -c npm
ci" did not complete successfully: exit code: 1`. El comentario de `tsx` como devDep de la etapa 2 no se tocó.

**Cierre de la regla de mutación 4 con el detector**: `--sha` sobre un commit temporal con todo el corte
(`5116132`) → salida 0, 0 bloqueantes, 37 informadas, 0 caducadas. Citas comprobadas a los ficheros que el corte
modifica: `DEPLOY.md` 31 (18 completas, 8 abreviadas y 4 ancladas, más 1 abreviada rota que ya estaba antes del
corte), `package.json` 14 (12 ancladas, 1 completa y 1 abreviada), `CLAUDE.md` 40 ancladas, `openspec/config.yaml`
35 (18 ancladas, 15 completas y 2 abreviadas, más 1 en la base), `Dockerfile` 8 (5 completas y 3 abreviadas) y
`.gitattributes` 9 ancladas. **Reparadas por el orquestador:** dos citas de la propuesta al `RUN npm ci` de la
etapa 2 del `Dockerfile`, que el `COPY` nuevo desplazó tres líneas sin que nada se pusiera rojo; el sub-agente no
barrió el `Dockerfile`. Van ancladas a `648432d` (caso B), revisión en la que el `Dockerfile` era idéntico al de
`35f2698`.

**Cierre**: `npm run typecheck` exit 0; `eslint . --max-warnings 158` → 0 errores, 158 avisos; `npm run test:coverage` → 1108 pasadas y 2 omitidas de 1110 (120 ficheros y 1 omitido), global 94,79 % líneas · 83,96 % ramas · 98,2 % funciones, `apps/desk/server/citas` 99,23 % · 95,42 % · 97,29 %; `core.hooksPath` del clon real sin fijar hasta el paso de instalación; **coste del hook** sobre el árbol del corte completo salvo estas cifras (`ab8ed6e`), tres tomas: 2.896, 2.373 y 1.925 ms, salida 0; `--sha` sobre ese árbol → salida 0, 0 bloqueantes, 37 informadas; 0 bytes de control en los blobs tocados. **Tamaño con git:** `git diff --shortstat 35f2698` → 12 ficheros, +404/-22 = 426 (con el hook ya en el índice), más lo nuevo sin trackear (`instalador.test.ts` 119 y `scripts/instalar-hooks.mjs` 46) = **591**, por debajo de la parada de ~650.

## Corte 3 — Fase 4 (Unidad 3): hook, instalador, `.gitattributes`, `DEPLOY.md` + 2 añadidos (15/16, 4.7 pendiente del orquestador)

Partida `35f2698`. Preflight `openspec/config.yaml:25-30` en `648432d`: `interactive · hybrid ·
ask-on-risk · 800 líneas · strict_tdd`. Modo Strict TDD activo: todas las tareas siguieron
RED → GREEN → (MUT donde aplica). Sin commit, push ni `git add` en el repositorio real (fuera de
`sdd-apply`); las comprobaciones de contenido de blob usaron `GIT_INDEX_FILE` aparte, índice real
intacto en cada comprobación.

### TDD Cycle Evidence

| Tarea | Fichero de prueba | Capa | Red de seguridad | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 4.1-4.3 (M16) | `guardianes.test.ts` | Estático (contenido real + variantes en memoria) | ✅ 14/14 antes de tocar | ✅ `ENOENT` real | ✅ 1 → 8 pasan | ✅ 3 formas sucias | ➖ sin cambios necesarios |
| 4.4-4.6 (D10) | `guardianes.test.ts` | Estático (real) + sintético (`repoGitTemporal`) | ✅ 8/8 antes | ✅ `expected 'unspecified' to be 'lf'` | ✅ 11/11 | ✅ sintético sin/con la línea | ➖ sin cambios necesarios |
| 4.8-4.12 (M11/M12/M13/D9) | `instalador.test.ts` (nuevo) | Proceso hijo del `.mjs` | N/A (fichero nuevo) | ✅ 6/6 rojas (`status:1`, excepción por script ausente) | ✅ 6/6 | ✅ M11 dos signos, M12 dos signos, M13, D9 | ➖ sin cambios necesarios |
| 4.13 (`prepare`) | `package.json` (JSON válido) | Estático | N/A (script nuevo) | — (tarea mecánica, sin comportamiento que fallar antes) | ✅ | ➖ Single | ➖ N/A |
| 4.13-A1 (Dockerfile) | `guardianes.test.ts` | Estático (contenido real + en memoria) | ✅ 11/11 antes | ✅ `expected [ 'etapa 3, línea "RUN npm ci"' ] to deeply equal []` | ✅ 14/14 | ✅ MUT quitar `COPY` + MUT posición (después de `npm ci`) | ➖ sin cambios necesarios |
| 4.14 (`DEPLOY.md`) | — (documental) | N/A | N/A | — (sección nueva, sin comportamiento comprobable por vitest) | ✅ lectura manual | ➖ N/A | ➖ N/A |
| 4.14-A2 (IV-10 `--no-verify`) | — (documental + `js-yaml`) | N/A | N/A | — | ✅ YAML válido, 10 entradas | ➖ N/A | ➖ N/A |

### Test Summary
- **Total tests escritos esta tanda**: 20 (14 en `guardianes.test.ts` incluidas las 4 preexistentes de
  M16/D10/Dockerfile nuevas = 10 nuevas + 6 en `instalador.test.ts`).
- **Total tests pasando (regresión completa, `npm test`)**: 1108/1110 (2 skipped, mismo fichero que ya
  se saltaba antes: `migrate.integration.test.ts`, sin `DATABASE_URL`). Antes de este corte: 1092/1094.
- **Capas usadas**: Estático (2: M16, guardián Dockerfile) · Estático+sintético (1: D10) · Proceso hijo
  (1: instalador) · Documental sin prueba automatizada (2: `DEPLOY.md`, IV-10).
- **Ficheros de prueba nuevos**: `apps/desk/server/citas/instalador.test.ts` (119 líneas, 6 pruebas).
- **Ficheros de prueba ampliados**: `apps/desk/server/citas/guardianes.test.ts` (+123 líneas: bloques
  M16, D10 y Dockerfile).

### Mutaciones — salida literal

| # | Qué se muta | Dónde | Salida literal | Restaurado / `cmp` |
|---|---|---|---|---|
| M16 | `.githooks/pre-push` → `npx tsx` | En memoria (contenido real de la suite) | `invocaTsxDeFormaSegura(sucio)` → `false` (assert pasa) | No aplica (nunca se escribió a disco); además control físico en `$SP`: `npx tsx -> INSEGURO (rojo)` |
| M16 | `.githooks/pre-push` → `npm exec tsx` | En memoria | `false` | `$SP`: `npm exec tsx -> INSEGURO (rojo)` |
| M16 | `.githooks/pre-push` → `npm x tsx` | En memoria | `false` | `$SP`: `npm x tsx -> INSEGURO (rojo)` |
| M16 (control físico) | copia real de `.githooks/pre-push` en `$SP`, proceso `node` nuevo | `$SP/mut-c3-m16/` | `original -> SEGURO (verde)`; las tres sucias `-> INSEGURO (rojo)` | `cmp $SP/.../pre-push-original` vs real: **idéntico**, hook real intacto |
| D10 | repositorio sintético (`repoGitTemporal`) SIN `.githooks/* text eol=lf` | `guardianes.test.ts` (test sintético permanente) | `eolDeclarado(...)` ≠ `'lf'` (assert pasa) | Repositorio temporal, borrado tras la prueba; `.gitattributes` real nunca tocado |
| D10 (control) | mismo repositorio sintético CON la línea | ídem | `eolDeclarado(...)` === `'lf'` | ídem |
| Dockerfile (AÑADIDO 1) | quitar `COPY scripts ./scripts` de la etapa 2 | En memoria (regex sobre contenido real) | `etapasNpmCiSinScripts(sucio)` → `['etapa 2, línea "RUN npm ci"']` (no vacío, assert pasa) | No aplica (en memoria) |
| Dockerfile posición (regla de mutación 1) | `COPY scripts` movido a DESPUÉS de `RUN npm ci` | En memoria | ídem, no vacío | No aplica (en memoria) |
| Dockerfile (control físico) | copia real en `$SP`, proceso `node` nuevo, quitar `COPY` | `$SP/mut-c3-dockerfile/` | original → `[]`; sin `COPY` → `['etapa 2, linea: RUN npm ci']` | `cmp $SP/.../Dockerfile-original` vs real: **idéntico**, `Dockerfile` real intacto |

### Barrido de la regla de mutación 4 (ficheros que este corte inserta líneas)

Puntos de inserción medidos con `git diff 35f2698`: `package.json` (+1 línea, antes de la vieja línea
11 → todo lo de ahí en adelante +1), `.gitattributes` (+6 líneas al FINAL del fichero, nada se
desplaza), `openspec/config.yaml` (+4 líneas tras la vieja línea 824, antes de `por_que_sin_destino:`
→ todo lo de ahí en adelante +4; más un cambio de contenido sin desplazamiento en las líneas 60-61),
`DEPLOY.md` (+19 líneas tras la vieja línea 203, antes de `## Notas` → todo lo de ahí en adelante +19),
`CLAUDE.md` (0 líneas netas: la fila IV-10 crece dentro de su misma línea física).

`git grep -noE` de cada fichero sin `openspec/changes/archive/`, comprobado contra el árbol de hoy.
**Tabla deliberadamente SIN forma de cita** (decisión Q6 de la propuesta, aplicada aquí porque este
propio artefacto queda en alcance del barrido en cuanto el hook se instale): fichero y número se
nombran por separado, nunca unidos por dos puntos dentro de una misma comilla invertida.

| Documento que cita | Línea del citante | Fichero citado | Línea citada (antes) | ¿Cruza el punto de inserción? | Caso | Reparación |
|---|---|---|---|---|---|---|
| `openspec/config.yaml`, sección de cobertura | 60 y 61 | `package.json` | 55 y 22 | Sí (inserción en la línea 11) | A · presente | pasan a 56 y 23 |
| `docs/sdd/Paquete_de_Despliegue_2026-09-10.md` | 127 | `DEPLOY.md` | 205 | Sí (inserción en la línea 204) | A · presente | pasa a 224 |
| `docs/sdd/Paquete_de_Despliegue_2026-09-10.md` | 138 | `DEPLOY.md`, forma abreviada atribuida por Lbc a la mención de `DEPLOY.md` de esa misma línea | 205 | Sí — encontrada en la segunda pasada (forma abreviada), el primer barrido sólo mira la forma completa | A · presente | pasa a 224 |
| `docs/sdd/F1A-05_Auditoria_blueprint_audit-F1A.md` | 46 | `openspec/config.yaml` | rango 807-838 | Cruza el punto de inserción de esta tanda (línea 825), pero la cita ya está ANCLADA a la revisión `648432d` desde el corte 2 | Anclada, inmune | Ninguna |
| Este mismo artefacto (`apply-progress.md`), narrativa del corte 2 | en torno a la línea 96 de hoy | `openspec/config.yaml` | rango 807-838 | Cruza, pero es narrativa sobre una reparación ya hecha, no una afirmación viva sobre el presente | — | Ninguna |
| `proposal.md`, `design.md`, `tasks.md` y `spec.md` de esta propia tanda | varias | `openspec/config.yaml`, `.gitattributes` y `DEPLOY.md` | varias, algunas por encima de los puntos de inserción de hoy | Da igual: todas van ANCLADAS a la revisión `648432d` por la convención 1 de la propia propuesta | Ancladas, inmunes | Ninguna |
| `CLAUDE.md`, `openspec/specs/*/spec.md` y la línea base (dato, excluida del barrido) | varias | `openspec/config.yaml`, `DEPLOY.md`, `.gitattributes` | varias | Todas por debajo de sus puntos de inserción, o son dato excluido del barrido | A · sin desplazamiento | Ninguna |

La segunda pasada (forma abreviada) sobre los documentos que citan estos cuatro módulos encontró la
entrada de la línea 138 de `Paquete_de_Despliegue_2026-09-10.md` —la forma abreviada atribuida a
`DEPLOY.md` por la regla Lbc, en la misma línea física— que el primer barrido (sólo forma completa) no
veía. Ninguna otra forma abreviada nueva apareció.

### Controles

- **Tamaño con git, medido AL FINAL** (tras escribir `tasks.md` y este mismo artefacto):
  `git diff --shortstat 35f2698` → **8 ficheros, 167 inserciones, 6 borrados = 173 líneas**. Nuevos sin
  trackear: `.githooks/pre-push` (4), `apps/desk/server/citas/instalador.test.ts` (119),
  `scripts/instalar-hooks.mjs` (46) = **169**. **Total: 342 líneas**, muy por debajo de la parada de
  ~650 y del presupuesto de 800.
- `git config --get core.hooksPath` sobre el repositorio real: **vacío, código 1**, comprobado antes y
  después de toda la tanda (incluidas las 6 pruebas de `instalador.test.ts`, que sólo tocan
  repositorios sintéticos).
- **0 bytes de control y 0 CR** en los blobs de los 11 ficheros tocados/nuevos (índice temporal
  `GIT_INDEX_FILE`, comprobado byte a byte con Node sobre `git cat-file -p`; el índice real quedó
  intacto en cada comprobación — `git status --short` sólo mostraba los `M`/`??` esperados, nada
  staged).
- Los 8 documentos ajenos de `docs/` sin trackear (lista base del orquestador): **intactos**, comprobado
  por diferencia de conjuntos contra la lista base.
- Guardián de binarios (tarea 1.0) y RQ-CV-18: en verde dentro de la regresión completa (120/121
  ficheros, 1108/1110 pruebas).
- `npm test`: 120/121 ficheros (1 `skipped`, sin `DATABASE_URL`), 1108/1110 pruebas (2 `skipped`).
- `npm run typecheck`: limpio (`tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit`, sin salida).
- `npx eslint . --max-warnings 158`: **0 errores, 158 avisos** — mismo trinquete, sin avisos nuevos.
- `npm run test:coverage`: **All files 94,79% stmts · 83,96% branch · 98,2% funcs · 94,79% lines**
  (thresholds 92/78/96/92, todos superados). `apps/desk/server/citas`: **99,23% stmts · 95,42% branch ·
  97,29% funcs · 99,23% lines**.

### Work Unit Evidence

| Evidencia | Valor |
|---|---|
| Comando de prueba enfocado y resultado | `npx vitest run apps/desk/server/citas/guardianes.test.ts apps/desk/server/citas/instalador.test.ts` → 20/20 verdes |
| Arnés de runtime real | `instalador.test.ts` invoca `scripts/instalar-hooks.mjs` como PROCESO HIJO real (`spawnSync(process.execPath, [SCRIPT], ...)`) contra repositorios git temporales aislados y directorios sueltos — es el runtime real del instalador, no un mock |
| Frontera de reversión | `git checkout -- .githooks .gitattributes CLAUDE.md DEPLOY.md Dockerfile openspec/config.yaml package.json apps/desk/server/citas/guardianes.test.ts` + `rm scripts/instalar-hooks.mjs apps/desk/server/citas/instalador.test.ts .githooks/pre-push` revierte exactamente este corte, sin tocar la Unidad 1, la Unidad 2 ni los 8 documentos ajenos de `docs/` |

### Deviaciones del diseño
Ninguna. El contenido del hook (§5), la guarda en `.mjs` (Pieza 5 de la propuesta, D9) y el punto de
anclaje de `.gitattributes` (D10) se implementaron tal cual el diseño. El único añadido no previsto en
`design.md`/`proposal.md` es el guardián del `Dockerfile` (AÑADIDO 1 de Gerencia, fuera del alcance
original de la Unidad 3 pero necesario porque el `prepare` nuevo interactúa con el build de Docker), y
la frase de `--no-verify` en IV-10 (AÑADIDO 2), ambos encargados explícitamente por Gerencia el
2026-09-14 y registrados como tareas propias en `tasks.md` (4.13-A1, 4.14-A2).

### Pendiente
- **4.7** (bit de ejecución, `git add --chmod=+x .githooks/pre-push`): el fichero ya está escrito y
  verificado (4.1-4.3); la operación de índice la hace el orquestador al commitear, fuera del alcance
  de `sdd-apply`.
- **Fase 5** (5.1-5.6, verificación final y precondición dura): pendiente, corte siguiente.

## Corte 2 — verificación del orquestador (tareas 3.8-3.10 y 3.1-3.7, 10/10)

Partida `984b797`; la primera parte está en el commit `73a9acb` y el resto se commitea encima.

**Mutaciones de la primera parte, repetidas en proceso nuevo** (copia en el scratchpad, `cmp` idéntico
en las cinco):

| Tarea | Mutación | Salida literal |
|---|---|---|
| 3.8 | `arbolCacheado` devuelve `repo.arbol(rev)` sin la caché | `AssertionError: expected 7 to be 1` y `expected 6 to be 2` |
| 3.9 | bloquear en cuanto falta una candidata (`ausentes > 0`) | `AssertionError: expected true to be false` |
| 3.10(a) | leer stdin antes de elegir modo | `AssertionError: expected 1 to be +0` |
| 3.10(c) | escribir la base con BOM | `AssertionError: expected 239 not to be 239` |
| 3.10(c) | quitar el `.sort()` | `expected [ 'a.md línea 1', 'a.md línea 3', 'a.md línea 2', …(2) ] to deeply equal [ 'a.md línea 1', 'a.md línea 2', 'a.md línea 3', …(2) ]` |

La mutación del orden la declaró primero el sub-agente como «no discrimina» porque git ya daría las
bloqueantes ordenadas. Era falso: `agrupar()` en `detector.ts` agrupa por (documento, cita), así que las
repeticiones de una misma cita salen juntas. La prueba ganó ese caso y la mutación se pone roja.

**Coste del hook (3.8)**, tres tomas con el informe completo: sobre el árbol `b977229` (3.8-3.10),
2.810, 2.837 y 2.663 ms; sobre el árbol del corte completo salvo estas cifras (`8459867`), 1.850, 1.957 y 1.871 ms, salida 0.

**3.1 y 3.2**, ejecutadas por el orquestador el 2026-09-14: `--sha` sobre el árbol `b977229` → salida 1,
37 bloqueantes; `--generar-base` sobre `73a9acb` → 37 entradas, 28 claves, sin BOM ni CR, ordenada.

**Cierre de la regla de mutación 4 con el detector**: `--sha` sobre un commit temporal con TODO el corte
(`dc71a6c`, base incluida) → salida 0, 0 bloqueantes, 37 informadas, 0 caducadas. Citas a los dos
ficheros que este corte inserta, comprobadas por el detector en ese árbol (75): `CLAUDE.md` 40 (38
ancladas, 1 completa y 1 abreviada, comprobadas todas) y `openspec/config.yaml` 35 (17 ancladas, 15
completas y 2 abreviadas comprobadas; 1 completa en la base, de `openspec/specs/trazas/spec.md`). Las
completas sin ancla a `config.yaml` caen todas antes del punto de inserción de IV-10; la única detrás
(`docs/sdd/F1A-05_Auditoria_blueprint_audit-F1A.md`) quedó anclada. La completa sin ancla a `CLAUDE.md`
estaba en este mismo fichero, con una línea equivocada, y se reparó (ver el barrido). Una bloqueante
nueva la habría causado este corte y se habría reparado; no hubo ninguna.

**Cierre**: `npm run typecheck` exit 0; `eslint . --max-warnings 158` → 0 errores, 158 avisos; `npm run test:coverage` → 1092 pasadas y 2 omitidas de 1094 (119 ficheros y 1 omitido), global 94,79 % líneas · 83,96 % ramas · 98,2 % funciones, `apps/desk/server/citas` 99,23 % · 95,42 % · 97,29 %; `--sha` sobre el árbol `8459867` → salida 0, 0 bloqueantes, 37 informadas, 0 caducadas; 0 bytes de control en los blobs de los ficheros tocados; guardián de binarios y RQ-CV-18 en verde. **Tamaño con git:** `git diff --shortstat 984b797` → 12 ficheros, +570/-48 = 618, más `lineaBase.jsonl` sin trackear (37) = **655**, frente a la parada de ~650: se alcanzó al cerrar, sin trabajo pendiente, y parte del exceso es esta misma sección de evidencia.

## Corte 2 — segunda parte (tareas 3.1-3.7) — CERRADO, 7/7

Base: `984b797` (+ commit local `73a9acb` sin empujar). `lineaBase.jsonl` llegó SIN TRACKEAR, generado
por el orquestador: no se regeneró/editó/borró. Sin `git add`, commit ni push (fuera de `sdd-apply`).

**3.1** (registro). `cli.ts --sha bfb0b284b160dea29dd9aedf529b8b2f7bd3468b` (árbol `b977229` = el de
`73a9acb`), 2026-09-14: salida 1, **37 bloqueantes**, índice remoto `.. origin/main`, texto binario
`.. 0`. El texto original pedía «confirmar 0»: Gerencia (2026-09-14) sustituyó esa condición por traer
la lista (37 líneas, `c2-bloqueantes.txt`). Ninguna toca `CLAUDE.md`/`config.yaml`.

**3.2** (registro + documental). `--generar-base` sobre `73a9acb`: **37 entradas, 28 claves**, UTF-8
sin BOM, 0 CR, ordenada, ≤100. Por motivo: 27 línea vacía, 5 inicio fuera de rango, 1 final fuera de
rango, 3 fichero inexistente, 1 ambigua (27+5+1+3+1=37). Cifra vigente añadida AL LADO de las 51 (caso
B, no se borran) en: `proposal.md` (R-14 §9, Q9 §13, Pieza 3 punto 4), `spec.md` (RQ-CV-09, RQ-CV-17) y
`design.md` (§1, §3, medición 7 del §12).

**3.3.** `CLAUDE.md`: «Cuatro»→«Cinco»; fila nueva (`Regla = — (regla de mutación 4)`, no 1/13: IV-10
no es espejo cliente/servidor de la regla invariable 13) con la cifra y la frase de Q4 literal.
`config.yaml`: `id: IV-10` tras IV-9, mismos campos que IV-8/IV-9. Validado con `js-yaml`: 10 entradas,
última `IV-10`.

**3.4/3.5.** Dos bullets nuevos en la regla de mutación 4 de `CLAUDE.md`: Q6 («un ejemplo de cita rota
se escribe sin forma de cita, o el detector lo tratará como rota») con el ejemplo REAL del archive en
prosa: «la línea 206 de este fichero», que cita el `proposal.md` archivado de `por-entregar-es-espera` y
en `984b797` era una línea vacía; y Q9 (el detector no bloquea la abreviada, lectura humana con el
informe como ayuda). **Corregido por el orquestador:** la primera redacción decía que esa línea estaba
«hoy vacía», y dejó de ser cierto con las propias inserciones de esta tanda (tras ellas la 206 tenía
texto); ahora se fecha contra `984b797`, donde se comprobó vacía.

**3.6 (repetida por el orquestador con el ejemplo REAL).** La primera comprobación del sub-agente usó una
cita inventada fuera de rango, no el ejemplo real. Se repitió con tres commits temporales, índice aparte,
padre `73a9acb`, todo el corte y `lineaBase.jsonl` incluidos, y que difieren sólo en el blob de
`CLAUDE.md` (`git hash-object -w` + `git update-index --cacheinfo`):

| Variante del ejemplo de Q6 | Commit | Salida | Bloqueantes | Línea base |
|---|---|---|---|---|
| En prosa (redacción final) | `dc71a6c` | 0 | 0 | 37 informadas · 0 caducadas |
| Con forma de cita, anclada a `984b797` | `f8887d1` | 1 | 1: extremo inicial en línea vacía (línea 206 de `CLAUDE.md`) | 37 informadas · 0 caducadas |
| Con forma de cita, sin ancla | `4ab1974` | 1 | 1: extremo inicial en línea vacía (línea 206 de `CLAUDE.md`) | 37 informadas · 0 caducadas |

Índice real intacto (`git diff --cached --quiet`). Cierra 1.15-1.16 contra contenido real.

**3.7.** `CLAUDE.md` (regla del ciclo 2): pierde «ÁRBOL ENTERO» y gana un párrafo con las dos cegueras
medidas, las dos por DEFECTO: (1) lo nuevo sin trackear no cuenta —intento 1, 55 con 928 líneas nuevas
sin trackear; corte 1b-i, 238 frente a 529 con git por 291 de ficheros nuevos—; (2) un fichero binario
para git en el árbol de partida cuenta 0 —intento 2, 144 frente a 247, las 103 de `detector.ts`, que en
`ef08129` llevaba un NUL (1 byte NUL, comprobado)—; con todo trackeado y sin binarios (1b-ii) contó 843,
lo mismo que git. `design.md` §3, mismo defecto corregido. **Corregido por el orquestador:** la primera
redacción ocupaba 21 líneas de `CLAUDE.md` y afirmaba un mecanismo no medido («cuenta sólo lo trackeado
en ambos extremos»); quedó en 11 líneas y sólo con lo medido. En el §3 del diseño decía además «Nota de
Método», que no existe: la regla está en `CLAUDE.md`.

### Barrido de la regla de mutación 4

`git grep -nE "CLAUDE\.md:[0-9]+"` y `"config\.yaml:[0-9]+"` sin archive: **38 + 31 = 69** citas; de las que caen
detrás de un punto de inserción, todas ancladas salvo **UNA**: `docs/sdd/F1A-05_Auditoria_blueprint_audit-F1A.md:46` →
`openspec/config.yaml:807-838` en `648432d` («la entrada `PF-1`»). Caso **B · histórico** (auditoría fechada al
commit `e8c5e90`, 2026-09-09; IV-10 desplaza el rango): reparada anclándola a `648432d` y nombrando el
desplazamiento. Las 68 restantes, ya ancladas, no necesitan reparación con independencia de dónde
inserte esta tanda. Las citas a las líneas 349, 519, 658 y 22-30 de `openspec/config.yaml` que hace
`CLAUDE.md` (`CLAUDE.md:62` en `984b797`, `CLAUDE.md:315` en `984b797`) y las 7 de
`openspec/specs/*/spec.md` a la declaración de capacidad: caso **A · presente**, todas antes de la
línea 798 (punto de inserción de IV-10), sin cambio. *(Corregido por el orquestador: la primera
redacción las citaba sin ancla y con la segunda línea equivocada, 323 en vez de 315.)* Segunda pasada (forma abreviada, en los ficheros que citan
`CLAUDE.md`/`config.yaml`): ninguna forma abreviada adicional referencia a esos dos ficheros.

### Controles

- **Tamaño con git**: la cifra final del corte está en la verificación del orquestador, arriba. Sin
  trackear nuevo salvo `lineaBase.jsonl` (37, del orquestador, sin tocar).
- 0 bytes de control y 0 CR en el blob de cada fichero tocado (índice temporal `GIT_INDEX_FILE`, real
  intacto en cada comprobación).
- Los 8 documentos ajenos de `docs/` sin trackear: intactos.
- `npx vitest run apps/desk/server/citas`: 6 ficheros, 75 pruebas verdes.
- `npm test`: 119/120 ficheros, 1092/1094 pruebas — igual que la primera parte.
- `npm run typecheck`: limpio. `npm run lint`: 0 errores, 158 avisos — sin avisos nuevos.

## Corte 2 — primera parte (tareas 3.8, 3.9, 3.10) — CERRADO, 3/3

Base del corte: `984b797`. Orden ejecutado: 3.8 → 3.9 → 3.10, como exige la nota del corte en `tasks.md`
(las tres corrigen el detector ANTES de generar la base en 3.1-3.7, que no son de este intento).

### 3.8 · Coste (RQ-CV-13, D11)

`detector.test.ts`: caché `arbolCacheado` por revisión DISTINTA dentro de `detectar()`. RED: `expected 6
to be 1` (3 anclas a la misma revisión) y `expected 4 to be 2` (2 anclas, 2 revisiones) — sin caché,
`arbol()` se llamaba 2 veces por cita y pasada. GREEN: 22/22 en `detector.test.ts`. MUT (quitar la caché,
`arbolCacheado` vuelve a llamar `repo.arbol(rev)` directo) → mismo rojo exacto; restaurado, `cmp` idéntico.

CIERRE (hook invocado como `pre-push` sobre el árbol real, commit temporal con índice APARTE,
`origin/main` = `984b797`): tres tomas **2.779 / 2.618 / 2.699 ms**, las tres ≤5 s (antes: 7,8-9,6 s,
hallazgo (a) de 1b-ii). Índice real intacto tras la medición (`git diff --cached --quiet`). Informe con
`texto que git cree binario .. 0`.

### 3.9 · RQ-CV-03 en ancladas ambiguas

`detector.test.ts`: una candidata ausente en la revisión del ancla cuenta como rota PARA ESA candidata,
nunca bloquea de inmediato. RED: `expected true to be false` (candidata ausente + otra válida bloqueaba
en la versión mala). Control del otro signo (todas ausentes → bloquea) nace verde. GREEN: 24/24. MUT
(bloquear en cuanto falta una candidata) → mismo rojo; restaurado, `cmp` idéntico. El invariante de
conservación de `hook.test.ts` (tarea 2.26) sigue en verde.

### 3.10 · Modos `--sha` y `--generar-base` (§5 del diseño)

`entrada` pasa de `string` a `() => string`; `ejecutar` sólo la invoca en modo hook. Tres partes en
`hook.test.ts`, repositorio sintético:

| Parte | RED | GREEN | MUT | Resultado |
|---|---|---|---|---|
| (a) lectura perezosa | `codigo: 2` (modo no existía; `entrada.split` sobre una función) | `llamadas` 0 con `--sha`, 1 en modo hook | leer stdin en TODOS los modos | `expected 1 to be +0`; restaurado, `cmp` idéntico |
| (b) `--sha <rev>` | `codigo: 2` (modo no existía) | rota→1, válida→0; sin `origin/main` → `NO HECHO`; con él, lo nombra | cubierta por la MUT de (a): sin `--sha` no hay modo que mutar aparte | — |
| (c) `--generar-base` | `codigo: 2` (modo no existía) | 5 entradas, sin BOM, sin CR, orden `a.md línea 1,a.md línea 2,a.md línea 3,b.md línea 1,b.md línea 2` (con `a.md línea 1` y `a.md línea 3` la MISMA cita rota repetida, y `a.md línea 2` una cita distinta entre medias); commiteada, el hook da `línea base .. 5 informadas · 0 caducadas`, salida 0 | escribir con BOM | `expected 239 not to be 239` (primer byte `0xEF`); restaurado, `cmp` idéntico |
| (c) | — | — | escribir SIN el `.sort()` | `expected [ 'a.md línea 1', 'a.md línea 3', 'a.md línea 2', …(2) ] to deeply equal [ 'a.md línea 1', 'a.md línea 2', 'a.md línea 3', …(2) ]`; restaurado, `cmp` idéntico |

**MUT «sin ordenar» — corregida (orquestador, 2026-09-14): SÍ discrimina.** «No discrimina» era
**falso**: la prueba nunca repetía la MISMA cita rota en un documento. `bloqueantes` se construye
recorriendo `porClaveCandidatos` (`Map` de `agrupar()`, clave = documento + texto de la cita): dos
ocurrencias de la MISMA cita rota comparten clave y salen JUNTAS, aunque entre ellas haya otra cita rota
distinta. Ampliada la prueba con ese caso: sin `.sort()`, `a.md línea 1, a.md línea 3, a.md línea 2`, no el de aparición.
Necesario con datos reales (51 entradas, 42 claves sobre `773ad75`). Detalle en el §11, fila 10.

### Verificación final

`npm test`: 1092/1094 (2 skipped preexistentes, 119/120 ficheros verdes; un `[vitest-worker]: Timeout
calling "onTaskUpdate"` transitorio en la primera corrida no reprodujo en la segunda, exit 0, mismo
recuento). `npm run typecheck`: limpio. `eslint . --max-warnings 158`: 0 errores, 158 avisos (igual que
baseline, ninguno nuevo). `npm run test:coverage`: global 94,79 % líneas/sentencias · 83,93 % ramas ·
98,21 % funciones (umbral 92/92/96/78, todos superados); `apps/desk/server/citas`: 99,24 % líneas ·
95,11 % ramas · 97,43 % funciones · 99,24 % sentencias. 0 bytes de control y 0 CR en el BLOB a commitear
de los 7 ficheros tocados (verificado con un índice git temporal aislado, nunca el real; el CRLF del
árbol de trabajo es el efecto normal de `core.autocrlf=true` en Windows, no una violación — lo que se
commitea es LF puro). Guardián de binarios (1.0) y RQ-CV-18 (grafo de imports): verdes, dentro de la
suite completa.

**Tamaño con git, medido AL FINAL** (tras la corrección de la 3.10(c)): `git diff --shortstat 984b797` →
**327/22 = 349 líneas** en 7 ficheros; 0 nuevos sin trackear. **Pendiente:** 3.1-3.7 de esta Fase 3, Fase 4
y Fase 5.

## Corte 1b-ii (tareas 2.12–2.26) — CERRADO, 15/15

Base del corte: `049a233`. **Tamaño con git: `git diff --shortstat 049a233` → 11 ficheros, +711/-89 =
800 líneas** al terminar el sub-agente, medido por el orquestador; 0 ficheros nuevos sin trackear frente a
la línea base de Gerencia (`comm -13`; los 8 documentos ajenos de `docs/` siguen `??`, sin tocar). El
sub-agente había escrito aquí 752 (663+89): midió ANTES de escribir `tasks.md` y este fichero. **La parada
de ~750 de este corte se superó**; Gerencia decidió el 2026-09-14 hacer settle y commit igualmente. Con
esta corrección del orquestador incluida, el corte se commitea con **+754/-89 = 843 líneas** medidas con git. Todo
está trackeado, así que el ledger cuenta lo mismo que git (en 1b-i contó 238 frente a 529 porque 291 eran
ficheros nuevos sin trackear: `cli.ts` 74, `git.ts` 86 y `hook.test.ts` 131).

Cierre repetido por el orquestador: `npm run typecheck` exit 0; `eslint . --max-warnings 158` → 0 errores,
158 avisos; `npm run test:coverage` → 1085 pasadas y 2 omitidas de 1087 (119 ficheros y 1 omitido),
global 94,75 % líneas · 83,88 % ramas · 98,44 % funciones, `apps/desk/server/citas` 99,17 % líneas ·
95,98 % ramas · 100 % funciones. 0 bytes de control y 0 CR en los 11 ficheros tocados. Guardián de
binarios (1.0) y RQ-CV-18 en verde. Detector sobre un commit temporal del corte frente a `049a233`: la
misma lista de 37 bloqueantes, ninguna cita rota nueva en lo tocado.

### Tabla de mutaciones del corte (17, repetidas por el orquestador en proceso nuevo)

Cada una: copia del fichero en el scratchpad de la sesión (nunca dentro del repositorio), sustitución con
exactamente una coincidencia por patrón, `npx vitest run <prueba> -t "<nombre>"`, restauración y `cmp`.
Las dos que el sub-agente hizo (2.26 y 2.25) están repetidas aquí. Salida literal: la primera aserción que
falla. Donde la salida de vitest trae una cita con forma de cita, se describe en prosa para no romper el
barrido.

| # | Tarea | Mutación | Salida literal | Control |
|---|---|---|---|---|
| 1 | 2.26 invariante | `detector.ts`: `saltadas.anclasSinResolver++` → `void 0` | `AssertionError: expected 11 to be 12 // Object.is equality` | `cmp` idéntico |
| 2 | 2.26 invariante | `detector.ts`, rama abreviada: `saltadas.noLegibles++` → `void 0` | `AssertionError: expected 1 to be 2 // Object.is equality` | `cmp` idéntico |
| 3 | 2.26 invariante | `detector.ts`, completa no anclada: `saltadas.noLegibles++` → `void 0` | `AssertionError: expected 1 to be 2 // Object.is equality` | `cmp` idéntico |
| 4 | 2.26 | `detector.ts`: `resolverToken(nombre, indice)` → siempre `no-resuelto` | `AssertionError: expected +0 to be 1 // Object.is equality` | `cmp` idéntico |
| 5 | 2.12-2.13 | `git.ts`: `git grep` sobre el disco con `--untracked` en vez del árbol | `AssertionError: expected 2 to be +0 // Object.is equality` | `cmp` idéntico |
| 6 | 2.14-2.15 | `cli.ts`: quitar `'*.csv'` de `EXCLUSIONES` | `AssertionError: expected 1 to be +0 // Object.is equality` | `cmp` idéntico |
| 7 | 2.14-2.15 | `cli.ts`: quitar `RUTA_BASE` de `EXCLUSIONES` | `AssertionError: expected [ { …(3) } ] to deeply equal []` | `cmp` idéntico |
| 8 | 2.16-2.17 | `cli.ts`: rama del sha local en ceros → `if (false)` | `AssertionError: expected 'citas · 0000000 · refs/heads/main: no…' to contain 'rama borrada'` | `cmp` idéntico |
| 9 | 2.16-2.17 | `cli.ts`: agrupar por `ref` en vez de por árbol | `AssertionError: expected [ '', …(2) ] to have a length of 2 but got 3` | `cmp` idéntico |
| 10 | 2.17 | `cli.ts`: el `catch` hace `throw e` en vez de devolver salida 2 | 2 fallos: `Error: línea de stdin mal formada (se esperaban 4 campos): "esto no son cuatro campos"` y `Error: git shortlog -sne --all salió 129: error: too many arguments given outside repository` | `cmp` idéntico |
| 11 | 2.18 | `git.ts`: quitar `-c core.quotepath=off` | **VERDE** (`Tests 1 passed \| 21 skipped (22)`): no discrimina, ver hallazgo (c) | `cmp` idéntico |
| 12 | 2.18 | `git.ts`: decodificar la salida de `git grep` en `latin1` | `AssertionError: expected +0 to be 1 // Object.is equality` | `cmp` idéntico |
| 13 | 2.19 | `git.ts`: `MAX_BUFFER` de 1 MB | `AssertionError: expected 2 to be +0 // Object.is equality` | `cmp` idéntico |
| 14 | 2.20-2.21 | `detector.ts`: `arbolDeLectura` devuelve siempre el árbol local | `AssertionError: expected 'citas · bb70362 · refs/heads/main\n  …' not to contain` la anclada a la revisión anterior | `cmp` idéntico |
| 15 | 2.22-2.23 | `cli.ts`: umbral de escalada `<= 1` → `<= 2` | `AssertionError: expected 'citas · d3cbe6e · refs/heads/main\n  …' to match /identidad/` | `cmp` idéntico |
| 16 | 2.24 | `detector.ts`: un `leerLote` por objeto | `AssertionError: expected 4 to be 1 // Object.is equality` | `cmp` idéntico |
| 17 | 2.25 | `informe.ts`: quitar la línea `texto que git cree binario` | `AssertionError: expected 'citas · d68523d · refs/heads/main\n  …' to match /texto que git cree binario \.+ 1 +\(n…/` | `cmp` idéntico |

Antes de las mutaciones, `npx vitest run apps/desk/server/citas` sin mutar: 6 ficheros, 68 pruebas en verde.

### Tareas que NACIERON VERDES y de dónde sale su rojo

- **2.12-2.13** (M5): `git.ts` ya leía el árbol commiteado desde 1b-i. Rojo: mutación 5.
- **2.18-2.19** (ruta no ASCII y búfer): ya estaban desde 1b-i. Rojo: mutaciones 12 y 13 (la 11 no
  discrimina).
- **2.20-2.21** (protección del ancla): ya estaba desde 1b-i. Rojo: mutación 14.
- **2.24** (lote único): ya estaba desde 1a-ii. Rojo: mutación 16.

### Rojo previo NO registrado

**En 2.15-2.16 y 2.22-2.23 el rojo previo al GREEN NO quedó registrado; lo sustituye el rojo de
mutación** (mutaciones 6-9 y 15). Es una sustitución declarada, no el rojo de strict_tdd. En 2.14 y 2.17 sí
quedó el rojo literal en `tasks.md`, y 2.17 añade el de la mutación 10.

### Hallazgos que este corte NO corrige (registrados por decisión de Gerencia, 2026-09-14)

- **(a) Coste del hook: 7,8-9,6 s** (tres tomas: 8.125, 7.776 y 9.598 ms) con el informe completo, sobre
  el árbol real del corte, invocado como el hook (`node_modules/.bin/tsx`, stdin de `pre-push`). RQ-CV-13
  pide ≤5 s con tope duro de 10 s; el §7 del diseño midió 1,34-1,49 s. **No lo introduce este corte**: el
  código de `049a233` tarda 9,6 s sobre el mismo árbol. Causa medida con `GIT_TRACE`: ~200 procesos
  `git rev-parse --verify -q <rev>^{tree}`, **160 de ellos para `648432d`**, porque `detectar()` llama a
  `repo.arbol()` por cada cita anclada en las dos pasadas y el adaptador lanza un `rev-parse` por llamada,
  sin caché. D11 pedía una resolución por revisión distinta dentro del lote.
- **(b) Borde de RQ-CV-03 en ancladas ambiguas:** si el nombre de una anclada resuelve en el índice local
  a varias candidatas y una de ellas no existe en la revisión del ancla, la anclada bloquea «fichero
  inexistente» aunque otra candidata sea válida allí. RQ-CV-03 dice que bloquea sólo si está rota en
  TODAS. No afecta a las nueve anclas peladas reales, que resuelven a una sola ruta.
- **(c) `core.quotepath=off` no discrimina** (mutación 11): con `-z` y `--null` git no entrecomilla las
  rutas, así que la opción es redundante en `ls-tree` y `grep` (hipótesis sobre el porqué; lo medido es que
  quitarla deja la prueba en verde). Redundancia declarada; la ruta no ASCII sí tiene detector
  (mutación 12).

### Descartes silenciosos convertidos (tarea 2.26 + invariante, ver enumeración íntegra más abajo)

1. `detector.ts:159-160` (antes) — chequeo muerto en abreviadas, ELIMINADO (nunca podía dispararse).
2. `detector.ts:161-162` (antes) — abreviada con contenido `null` pese a indexada → `saltadas.noLegibles`.
3. `detector.ts:202` (antes) — completa con contenido `null`, TRES caminos: ancla resuelta localmente
   pero ausente en su revisión → bloquea «fichero inexistente»; ancla no resuelta localmente y lectura
   literal también falla → `saltadas.anclasSinResolver` («ancla sin resolver»); completa no anclada
   defensiva → `saltadas.noLegibles`.

Ecuación cerrada: `comprobadas + Σ saltadas + fueraDelRepositorio + noSonCitas + abreviadasRotas.length +
bloqueantes.length + informadas = cosechadas` (`caducadas` y la línea de binarios fuera de la suma),
verificada con un número LITERAL de citas escritas por la prueba en `hook.test.ts` (12 citas → 12).

### Enumeración de descartes silenciosos (tarea 2.26, ANTES de tocar nada), sobre `049a233`

Barrido de todo `continue` en `detectar()` (`apps/desk/server/citas/detector.ts`) que no incrementa
ninguna cifra ni empuja a una lista, antes de cualquier cambio de este corte:

1. **Abreviada, atribución fuera del índice exacto** — `detector.ts:159-160` en `049a233`:
   `const resuelto = indice.exactos.has(c.atribuidoA) ? c.atribuidoA : null; if (resuelto === null)
   continue // no resuelve: fuera de alcance de esta tarea`. **Código muerto**: `cosecha.ts` sólo fija
   `atribuidoA` cuando `resuelveAFichero(nombre)` es true, y `resuelveAFichero` es exactamente
   `indice.exactos.has(nombre)` con el MISMO índice que usa `detector.ts` en la misma llamada. Por
   construcción, `resuelto` nunca es `null` aquí. Tratamiento: se ELIMINA el chequeo redundante (no
   hace falta motivo nuevo: nunca se ejecuta, y una prueba para él sería intestable por construcción).

2. **Abreviada, contenido `null` pese a estar en el índice exacto** — `detector.ts:161-162` en
   `049a233`: `const contenido = lote.get(...); if (contenido === null || contenido === undefined)
   continue`. Alcanzable de forma defensiva (p. ej. un submódulo git: listado por `ls-tree -r` pero
   `cat-file --batch` no da un blob, sólo una cabecera `commit`). Tratamiento: cuenta como
   `saltadas.noLegibles` (motivo «no legible»).

3. **Completa (anclada o no), contenido `null` tras resolución** — `detector.ts:202` en `049a233`:
   `if (contenidos.some((contenido) => contenido === null || contenido === undefined)) continue`. Cubre
   TRES caminos distintos que había que separar:
   - **(a)** Anclada, el nombre RESUELVE en el índice local (D11/D4: exacta, sufijo, RQ-CV-03 si
     ambigua) pero la ruta resuelta no existe en la revisión del ancla → pasa a BLOQUEAR «fichero
     inexistente» (regla central de la tarea 2.26, casos ii/iii de su encargo).
   - **(b)** Anclada, el nombre NO resuelve en el índice local y la lectura literal en su propia
     revisión también falla (el «ancla ilegible») → cuenta como `saltadas.anclasSinResolver`.
   - **(c)** No anclada, contenido `null` pese a resolución local exitosa (defensivo, submódulo) →
     cuenta como `saltadas.noLegibles`.

**Ecuación corregida** (con el término que faltaba, decisión c de Gerencia):
`comprobadas + Σ saltadas + fueraDelRepositorio + noSonCitas + abreviadasRotas.length +
bloqueantes.length + informadas = cosechadas`, donde `Σ saltadas = sinBarra + ambiguas + directorios +
huerfanas + anclasSinResolver + noLegibles`. `caducadas` (entradas de la base) y la línea de binarios
(ficheros) quedan FUERA de la suma, como pide el encargo. `cosechadas` se expone en
`ResultadoDeteccion` como `citas.length` (cardinalidad del array que produce `cosechar()`).

**Categorías nuevas en `Saltadas`:** `anclasSinResolver` (motivo «ancla sin resolver», el ancla
ilegible) y `noLegibles` (motivo «no legible», el caso defensivo de contenido `null` pese a índice).

### Plan de implementación (antes de escribir código)

- `detector.ts`: importar `resolverToken` y `ResolucionLocal` de `./resolucion`; nuevo caché
  `resolverParaAncla(nombre)` memoizado por nombre (el índice local no depende de la revisión ancla);
  primera pasada de `objetosNecesarios` usa la resolución para pedir la ruta correcta del árbol ancla;
  segunda pasada separa bloqueo/saltada según si la resolución local tuvo éxito; abreviada simplificada
  (elimina el chequeo muerto, cuenta `noLegibles` en el `continue` de contenido).
- `informe.ts`: añade los dos motivos nuevos al desglose de «saltadas».
- `informe.test.ts`: actualiza el regex de la prueba existente con los dos motivos nuevos (cifra 0).
- `hook.test.ts`: dos bloques nuevos — (1) los tres rojos propios de 2.26 (i/ii/iii) con su MUT; (2) el
  invariante de conservación con un caso de cada categoría más el ancla ilegible, llamando a `detectar()`
  directamente sobre un `Repo` git real (para tener el objeto `ResultadoDeteccion` completo, no sólo el
  texto del CLI).
- `detector.test.ts`: un bloque para `noLegibles` (con y sin el defecto, dos signos) y uno de
  triangulación para el caso «ambiguo» de una anclada resuelta por el índice local.
- `design.md` §11 fila 8 (a) y §5 (línea «saltadas»); `tasks.md` tarea 2.26: documentar el cierre.

## Corte 1b-i (tareas 2.0–2.11) — cerrado

**12/12.** Intento 3 del ledger, tras el `reset` de Gerencia; base del corte `01df7ce`. Salidas literales
de vitest y mutaciones sobre copia, restauradas con `cmp`, como en 1a-ii.

| Tarea | RED observado | GREEN |
|---|---|---|
| 2.0 (i) | «expected [ { fichero: 'citado.md', …(3) } ] to deeply equal [ ObjectContaining{…} ]» | `origen()`: documento, línea de la cita y cita literal |
| 2.0 (ii) | «expected false to be true»: con la clave vieja, reparar en A y romper en B se compensaba | ídem; la base de la prueba la genera el propio detector |
| 2.1 | arnés, sin rojo propio; su mutación, abajo | `repoGitTemporal` aislado |
| 2.2/2.3 | «Cannot find module './cli'» | `git.ts` (`git grep --null` sobre el sha) y `cli.ts` |
| 2.4/2.5 | «expected '…' to match /sin barra y sin resolver 0/»: la pelada se saltaba | paso 5 de D4 con el índice remoto |
| 2.6/2.7 | «to match /índice remoto \.+ NO HECHO: no ha…/main» | `origin/main` en rama nueva; «NO HECHO» con motivo, también con el objeto ausente |
| 2.8/2.9 | nació VERDE: `git.ts` lee por sha desde la 2.3. Rojo por la mutación de la tarea, abajo | — |
| 2.10/2.11 | «bloquea sin base» nació verde (el barrido ya era completo); la parte de la base, «to match /línea base \.+ 1 informadas · 0 caduc…/» | la base se lee del sha empujado y se excluye del barrido |

**Las doce expectativas de 1a que fijaban el fichero citado**, reescritas en la 2.0 (diez pruebas en
rojo tras corregir los cuatro `push`): en `detector.test.ts`, nueve (RQ-CV-08 línea vacía, extremo final,
extremo inicial y revisión inventada; las dos entradas de base de M9 y de «ya presente en la base»; la
abreviada rota de M30; el inexistente de 1.28 y la ambigua de 1.30); en `informe.test.ts`, tres (la base
y las dos líneas de las listas). ⚠️ La de M9 seguía **verde** con la clave vieja: la entrada caducaba
igual, así que no discriminaba el campo.

### Mutaciones

| Mutación | Salida | Control |
|---|---|---|
| 2.0 · `origen()` vuelve al fichero citado y la línea citada | 10 failed / 8 passed, entre ellos (ii) «expected false to be true» | `cmp` idéntico |
| 2.1 · el arnés no borra las variables heredadas (GIT_DIR apunta a un señuelo temporal) | «git add -A salió 128: fatal: this operation must be run in a work tree» | `cmp` idéntico |
| 2.4 · se retira el paso 5 (sin índice remoto) | «to match /sin barra y sin resolver 0/» · 1 failed | `cmp` idéntico |
| 2.9 · `git grep` sin el sha: lee el árbol de trabajo | «expected +0 to be 1» · sólo falla M8; M1 no lo distingue | `cmp` idéntico |
| 2.10 · barrido limitado a los ficheros que cambia el push | 5 failed / 1 passed; M29 «expected +0 to be 1» | `cmp` idéntico |

### Coste de la divergencia nº 8, medido sobre HEAD real (tres tomas, seis exclusiones de D5/D6)

| Cifra | Valor |
|---|---|
| Citas cosechadas · ancladas · revisiones distintas | 3.360 · 94 · 6 (todas pelan a árbol) |
| Ancladas leídas por ruta literal | 85 |
| **Ancladas que se DESCARTAN EN SILENCIO** (ni comprobadas, ni bloqueantes, ni en ninguna cifra) | **9**: todas son el nombre pelado `estados.ts` con ancla, el caso B de la regla de mutación 4 |
| De esas 9, resolubles por D11 (índice del sha local) · válidas | 9 · 9 · 0 índices de revisión construidos |
| Lote literal · lote extra de D11 | 51-60 ms · **33-56 ms** |

La divergencia no rompe ninguna cita hoy, pero deja 9 sin mirar y sin contarlas. Cerrarla cuesta un lote.

### Hallazgos que este corte NO corrige

1. **La divergencia nº 8 descarta en silencio** las anclas cuya ruta literal no existe en su revisión
   (cifras arriba). Destino: lo decide Gerencia.
2. **Exclusiones:** sólo la base, que la 2.11 necesitaba; las otras cinco llegan con la 2.15. El signo
   «dentro de la base se ignora» de la 2.14 nacerá verde, y su rojo tendrá que salir de mutación.
3. **D12 a medias:** «no hay origin/main» y «objeto ausente» ya están, con prueba (2.6); un fallo de git o
   una base ilegible todavía lanzan excepción en vez de salir con 2 (tarea 2.17).
4. **`ejecutar` recibe también `env`**, que el §5 del diseño no nombra: sin él, git en proceso heredaría
   el entorno del padre y el aislamiento del arnés no llegaría al adaptador.
5. `hook.test.ts` tarda ~11 s en local (seis pruebas con git real en Windows).

## Corte 1a-ii (tareas 1.0 y 1.28–1.42) — cerrado

**16/16.** Intento 2 del ledger, tras el `reset` que ejecutó Gerencia (objetivo «corte 1a-ii», techo de
800). Base del corte: `ef08129`. Todo rojo es salida literal de vitest; sólo se conservan `FAIL`,
`AssertionError` y el recuento. Cada mutación se hizo sobre copia y se restauró comprobando con `cmp`.

| Tarea | RED observado | GREEN |
|---|---|---|
| 1.0 | «expected [ Array(1) ] to deeply equal []», recibido `apps/desk/server/citas/detector.ts` | el NUL pasa al escape de texto, escrito con node → 26 pruebas |
| 1.28/1.29 | «expected [] to deeply equal [ ObjectContaining{…} ]» | `resolverRuta`, pasos 3, 7 y 8 |
| 1.30/1.31 | 2 fallos: «expected [] to deeply equal [ ObjectContaining{…} ]» y «expected undefined to be 1» | `rotura()` por candidata; bloquea sólo si fallan todas |
| 1.32/1.33 | verde al escribirla: la precedencia existía desde 1a-i. Rojo por la mutación que describe la tarea (quitarla): «expected { tipo: 'ambiguo', …(1) } to deeply equal { tipo: 'unico', ruta: 'package.json' }», con los seis candidatos | restaurada (1.33) |
| 1.35/1.36 | «expected { tipo: 'inexistente' } to deeply equal { tipo: 'directorio' }» | índice de directorios; paso 4 antes del 7 |
| 1.38/1.39 | «expected { tipo: 'sin-barra' } to deeply equal { tipo: 'no-es-cita' }» | paso 6 (D3) |
| 1.40/1.41 | primero «Cannot find module './informe'»; con `informe.ts` escrito y el detector sin contadores, 2 fallos: «to match /saltadas …/» y «to match /no son citas …/» | contadores en `detectar()` → 39 pruebas |
| 1.42 | RED+GREEN: verde a la primera; el rojo sale de ensuciar lo vigilado (abajo) | — |

### Mutaciones

| Mutación | Salida | Control |
|---|---|---|
| 1.0 · un NUL en `resolucion.ts`, byte 7 | «expected [ Array(1) ]», recibido `resolucion.ts` · 1 failed | `cmp` idéntico |
| 1.0 · un byte 0x01 en el mismo sitio | 1 passed: git sólo decide «binario» por un NUL en los primeros 8.000 bytes, y se registra | `cmp` idéntico |
| 1.34 · exacta tras el `return` de ambigua | «expected { tipo: 'ambiguo', …(1) }» · 1 failed / 30 passed | `cmp` idéntico |
| 1.34 · exacta entre «un candidato» y «ambigua» | 31 passed. **Mutante equivalente**: `construirIndice` mete la ruta exacta como su propio sufijo, así que con un solo candidato ese candidato es ella | `cmp` idéntico |
| 1.37 · directorio tras «lleva barra» | «expected { tipo: 'inexistente' } to deeply equal { tipo: 'directorio' }» · 1 failed | `cmp` idéntico |
| 1.42-a · `apps/desk/server/index.ts` importa el detector | «expected [ …(3) ] to deeply equal []»: `detector.ts`, `resolucion.ts`, `cosecha.ts` | `cmp` idéntico |
| 1.42-b · `informe.ts` pierde «NADA de producción lo importa» | «informe.ts: expected … to contain 'NADA de producción lo importa'» | `cmp` idéntico |

### Hallazgos que este corte NO corrige

1. **D6 no se cumple en `detectar()`.** D6 dice que `fichero` es la ruta del **documento** que cita y
   `linea` dónde estaba; el detector guarda el fichero **citado** y la línea citada (`fichero: c.fichero`,
   `linea: c.desde`). Viene de 1a-i. Importa antes del corte 2, que genera la base con esa clave, y el
   informe lista hoy el fichero citado en vez de dónde reparar. Destino: lo decide Gerencia.
2. **CERRADO en el corte 2, segunda parte (tarea 3.7).** La frase de la regla del ciclo 2 también
   estaba en el §3 de `design.md` («diffeando el árbol entero») y la tarea 3.7 sólo nombraba
   `CLAUDE.md`; ambos sitios quedaron corregidos en la misma tanda.
3. **`git diff -a` no cambia el numstat de un fichero que es binario en la base**: `detector.ts` sigue
   dando `-` `-` contra `ef08129`. El control de tamaño lo cuenta con `diff` tras cambiar el NUL por otro
   carácter.
4. **Escapes.** Con la herramienta Write, los escapes de salto, tabulador y NUL se quedaron como texto;
   sólo el escape unicode del NUL se convirtió en byte, dos veces. Aun así, este corte no deja ningún
   escape de byte de control escrito con la herramienta: van con node o con `String.fromCharCode`, y cada
   fichero tocado se comprobó con 0 bytes de control.
5. Las cabeceras de `cosecha.ts`, `resolucion.ts` y `detector.ts` decían que `guardianes.test.ts` era de
   la unidad 3; ya no es cierto, y se quitó.

## Corte 1a-i (tareas 1.1–1.27) — cerrado por re-troceo

**27/42 tareas de la Fase 1.** El intento 1 del ledger (objetivo «corte 1a, tareas 1.1-1.42», techo de 800
líneas) superó el presupuesto con 27 tareas hechas. Por decisión de Gerencia (2026-09-13), el corte 1a
se parte en **1a-i** (1.1–1.27, este commit) y **1a-ii** (1.28–1.42, intento nuevo). El intento 1 se
cierra como `interrupted`.

Pendientes para 1a-ii: resolución D4 pasos 6-8, ambiguas (M15), precedencia exacta/sufijo y su MUT
(M23), directorio antes de «lleva `/`» y su MUT, marcas ISO/hora (D3), `informe.ts` (RQ-CV-10) y
RQ-CV-18.

## Ficheros

| Fichero | Qué hace |
|---|---|
| `apps/desk/server/testing/reposDePrueba.ts` | `Repo` en memoria (D7) + `cita()`, `abreviada()`, `anclada()` |
| `apps/desk/server/citas/cosecha.ts` | Completas, abreviadas con atribución Lbc (RQ-CV-06, D1), ancla (D2), fuera del repositorio (RQ-CV-04), host:puerto (RQ-CV-16, D3) |
| `apps/desk/server/citas/resolucion.ts` | Índice exacto + sufijo (RQ-CV-02); ambigua, directorio y marca ISO pendientes |
| `apps/desk/server/citas/detector.ts` | Puerto `Repo`, dos extremos (RQ-CV-08), anclaje (RQ-CV-06), base con multiplicidad (RQ-CV-09, D6), un solo `leerLote` (D11) |
| `apps/desk/server/citas/cosecha.test.ts` · `detector.test.ts` | 12 + 13 pruebas |

## TDD — evidencia por tarea

| Tarea | RED | GREEN |
|---|---|---|
| 1.1 | — (arnés) | ✅ |
| 1.2/1.3 | ✅ reconstruido por mutación, ver «Reparación» (no se observó en el momento) | ✅ |
| 1.4/1.5 | ✅ `expected false to be true` | ✅ |
| 1.6/1.7 | ✅ `expected +0 to be 1` | ✅ |
| 1.8/1.9 | ✅ propiedades inexistentes antes de 1.9 | ✅ |
| 1.10 MUT | ✅ mutación de POSICIÓN, ver «Reparación» | ✅ revertida |
| 1.11/1.12 | ✅ `Target cannot be null or undefined` | ✅ |
| 1.13/1.14 | ✅ `expected 3 to be 1` (contador de `leerLote`) | ✅ |
| 1.15–1.19 | verde directo: confirmación sin código nuevo, como piden las tareas | — |
| 1.20/1.21 | ✅ `expected false to be true` | ✅ |
| 1.22/1.23 | ✅ corte 2: `atribuidoA: 'valido.md'` en vez de `null` | ✅ |
| 1.24/1.25 | ✅ `expected 'completa' to be 'no-es-cita'` | ✅ |
| 1.26/1.27 | ✅ `expected 'completa' to be 'fuera-de-repositorio'` | ✅ |

## Reparación antes del settle (2026-09-13, orquestador)

Cada mutación se aplicó sobre una copia de seguridad y se restauró con comprobación byte a byte
(`cmp`). Salidas literales de vitest; sólo se conservan las líneas `FAIL`, `AssertionError` y el
recuento.

### 1. Rojo de 1.2 y 1.3

**1.3-a · se retira de `cosecha.ts` el `push` de las citas completas.**

```text
FAIL  … > RQ-CV-08 comprobación mecánica básica > una cita a una línea vacía bloquea; la misma cita a una línea con contenido pasa (rojos a, b)
AssertionError: expected false to be true // Object.is equality
Tests  11 failed | 2 passed (13)
```

Siguen verdes dos. **M26**: correcto, porque su atribución no depende del `push` retirado. **M9**:
**no discriminaba**, porque «entrada de la base ya reparada» pasaba igual sin cosechar ninguna cita.
Arreglo: se añade `comprobadas === 1` al caso reparado. Con la mutación puesta:

```text
FAIL  … > una entrada de la base ya reparada, sin quitarla, pone el hook rojo; quitándola también, pasa (M9)
AssertionError: expected +0 to be 1 // Object.is equality
```

**1.3-b · se retira de `detector.ts` la comprobación de línea vacía** (signo roto de 1.2):

```text
FAIL  … > una cita a una línea vacía bloquea; la misma cita a una línea con contenido pasa (rojos a, b)
AssertionError: expected false to be true // Object.is equality
Tests  4 failed | 9 passed (13)
```

**1.3-c · control del otro signo: toda cita en rango bloquea** (signo válido de 1.2):

```text
FAIL  … > una cita a una línea vacía bloquea; la misma cita a una línea con contenido pasa (rojos a, b)
AssertionError: expected true to be false // Object.is equality
Tests  1 failed | 12 skipped (13)
```

Restaurado: `Tests  25 passed (25)` en `citas/`.

### 2. MUT 1.10 — mutación de POSICIÓN (regla de mutación 1, M17)

La mutación anterior del sub-agente **quitaba** el filtro de la base (condición, no posición). Rehecha:
la decisión se toma antes de consultar la base (`bloquea` = hay candidatos) y la base se consulta
después, sólo para el informe.

```text
FAIL  … > línea base (RQ-CV-09, M9, M10, M17) > la misma cita rota, ya presente en la base, informa y no bloquea
AssertionError: expected true to be false // Object.is equality
Tests  1 failed | 12 passed (13)
```

Roja a la primera: el orden está probado. Revertida y verde.

### 3. Divergencias que no se refactorizan

Anclas leídas por ruta literal en el árbol de su revisión, y puerto `Repo` dentro de `detector.ts`:
divergencia nº 8 del §11 del diseño. El coste se mide en el corte 1b, donde hay git de verdad.

### 4. Barrido de formas de cita en los ficheros nuevos

Tres literales. La cabecera de `reposDePrueba.ts` escribía un ejemplo con forma de cita en el propio
comentario que lo prohíbe: se reescribe en prosa (Q6). Se quedan los dos de `cosecha.test.ts`, que son
los ejemplos de sus categorías y no citas rotas: un puerto de URL («no es cita», RQ-CV-16) y una ruta
con `~/` («fuera del repositorio», RQ-CV-04).
