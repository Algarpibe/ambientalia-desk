# Apply progress — hook-citas-pre-push

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
