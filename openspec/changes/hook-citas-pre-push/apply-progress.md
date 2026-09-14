# Apply progress — hook-citas-pre-push

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
