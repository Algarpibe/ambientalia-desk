# Apply progress — hook-citas-pre-push

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
`openspec/config.yaml:807-838` («la entrada `PF-1`»). Caso **B · histórico** (auditoría fechada al
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
