# Apply progress — hook-citas-pre-push

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
2. **La frase de la regla del ciclo 2 también está en el §3 de `design.md`** («diffeando el árbol
   entero»). La tarea 3.7 sólo nombra `CLAUDE.md`.
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
