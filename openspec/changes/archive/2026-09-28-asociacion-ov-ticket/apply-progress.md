# Apply progress — `asociacion-ov-ticket` (F1B-11, cambio 2 de 3)

## Lote 1 · Tabla y unicidad (tasks 1.1-1.13) — COMPLETO

**Mode**: Strict TDD. **HEAD de partida**: `8a46998` (main), coincide con el árbol que leyeron
`proposal.md`/`design.md`/`tasks.md` (todos re-leídos contra `5ad3d37`, sin desplazamiento hasta hoy).

### TDD Cycle Evidence

| Task | Test file | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1.1-1.2 | `ovAsociaciones.test.ts` | Unit (pg-mem) | N/A (new) | ✅ Written — natural red: `Cannot find module './ovAsociaciones'` | — | — | — |
| 1.3-1.6 | `ovAsociaciones.test.ts` | Unit (pg-mem) | N/A (new) | (heredado de 1.1) | ✅ 3/3 pass tras `schema.sql`+`migrate.ts`+`ovAsociaciones.ts` | ✅ 3 casos (crear, 23505, idempotencia) | ➖ Ninguno necesario |
| 1.7-1.9 | `ovAsociaciones.test.ts` | Unit (pg-mem) | ✅ 3/3 (el bloque `asociarOV` seguía en verde) | ✅ Written — RED genuino capturado retirando `liberarAsociacion`/`liberarAsociacionesDeTicket` del módulo (ver nota de desviación abajo): `TypeError: (0 , liberarAsociacion) is not a function` | — | — | — |
| 1.10-1.11 | `ovAsociaciones.test.ts` | Unit (pg-mem) | (heredado) | (heredado de 1.7-1.9) | ✅ 6/6 pass tras restaurar `liberarAsociacion`/`liberarAsociacionesDeTicket` | ✅ 3 casos (liberar, reasociar, liberar-por-ticket) | ➖ Ninguno necesario |
| 1.12 | `schema.sql` (mutación regla 2, fichero vigilado) | pg-mem | — | ✅ RED×2 (ver abajo) | ✅ Revertido, `git diff` limpio | — | — |
| 1.13 | cierre | — | — | — | ✅ ver «Gate numbers» abajo | — | — |

### Desviación de proceso (reportada, no oculta)

Al implementar el GREEN de la tarea 1.5 escribí de una vez todo `ovAsociaciones.ts`, incluidas
`liberarAsociacion`/`liberarAsociacionesDeTicket` (cuyas pruebas son 1.7-1.10), en vez de escribir sólo
lo mínimo para pasar la prueba de `asociarOV`. Esto rompía la ley 1 de TDD estricto («no escribir código
de producción antes de que exista una prueba en rojo que lo exija») para esas dos funciones. Corrección
aplicada en el mismo turno, antes de seguir: retiré las dos funciones del módulo (dejando un comentario
`TDD-TEMP`), ejecuté las pruebas 1.7-1.9 y capturé el rojo genuino (`TypeError: (0 , liberarAsociacion)
is not a function`), y sólo entonces restauré la implementación para el GREEN. La evidencia de RED de
1.7-1.9 es por tanto real, aunque el orden de escritura del código no lo fue en el primer intento. Se
documenta aquí en vez de omitirse.

### Prior RED (task 1.1-1.2) — salida real capturada

```
FAIL  packages/zoho-sync/src/db/ovAsociaciones.test.ts [ packages/zoho-sync/src/db/ovAsociaciones.test.ts ]
Error: Cannot find module './ovAsociaciones' imported from
'C:/dev/Desk_2_R1.023/packages/zoho-sync/src/db/ovAsociaciones.test.ts'
Caused by: Error: Failed to load url ./ovAsociaciones (resolved id: ./ovAsociaciones) ...
Does the file exist?
Test Files  1 failed (1) · Tests  no tests
```

**Nota de proceso, no oculta:** el primer intento de GREEN (`schema.sql` + `ovAsociaciones.ts`) falló
por error propio: los bloques de comentario nuevos en `schema.sql` contenían tres puntos y coma
literales dentro del texto del comentario (p. ej. «…renumera despues);» y «id de Books; NULL si…»).
`schemaStatements()` (`migrate.ts:20`) trocea el fichero por el carácter `;` a ciegas, comentarios
incluidos (la misma trampa que el propio `schema.sql:520-521` ya advierte), así que el `CREATE TABLE`
se partió en fragmentos inválidos y `migrate` los omitió uno a uno (`migrate: sentencia omitida…`,
tolerante por sentencia). Efecto: `relation "ov_asociaciones" does not exist` en los tres tests.
Corregido quitando los tres punto y coma de los comentarios (sustituidos por punto/coma normal) antes
de continuar — no fue una prueba «genuina» de acceptance, fue un error de sintaxis propio, capturado y
corregido en el mismo paso de GREEN.

### RED de 1.7-1.9 — salida real capturada (tras retirar temporalmente las dos funciones)

```
✓ asociarOV > crea una fila vigente para el ticket y la OV dados
✓ asociarOV > una segunda asociación vigente ... es rechazada por la base (23505)
✓ asociarOV > es idempotente: repetir el mismo numero/ticketId no crea una segunda fila
× liberarAsociacion > conserva la fila con fecha, persona y motivo de liberacion...
  → TypeError: (0 , liberarAsociacion) is not a function
× liberarAsociacion > tras liberar, la misma OV (numero y salesorderId) es reasociable a otro ticket
  → TypeError: (0 , liberarAsociacion) is not a function
× liberarAsociacionesDeTicket > libera todas las asociaciones vigentes de un ticket con el mismo motivo
  → TypeError: (0 , liberarAsociacionesDeTicket) is not a function
Test Files  1 failed (1) · Tests  3 failed | 3 passed (6)
```

### Mutación 1 (regla 2) — `idx_ov_asoc_numero_vigente` sin `WHERE liberada_at IS NULL`

Ensuciado: `CREATE UNIQUE INDEX IF NOT EXISTS idx_ov_asoc_numero_vigente ON public.ov_asociaciones
(numero);` (sin el `WHERE`). Prueba ejecutada: `liberarAsociacion > tras liberar, la misma OV... es
reasociable a otro ticket`.

```
FAIL ... liberarAsociacion > tras liberar, la misma OV (numero y salesorderId) es reasociable a otro ticket
Error: ERROR: insert into "ov_asociaciones" (...) - duplicate key value violates unique
constraint "ov_asociaciones_pkey"
DETAIL: Key (numero)=(OV-2026-005) already exists.
```

Se confirma la advertencia de `design.md` §1: pg-mem etiqueta mal la restricción violada como
`_pkey` en el mensaje aunque la que realmente discrimina es el índice único parcial por `numero` — por
eso las pruebas de `asociarOV` comprueban el código `23505`, nunca el nombre de la restricción.
Revertido; `git diff -U0 -- schema.sql | grep '^@@'` vuelve a mostrar un único hunk de fin de fichero.

### Mutación 2 (regla 2) — `idx_ov_asoc_so_vigente` sin `WHERE liberada_at IS NULL`

Repetida por separado sobre el segundo índice, tal como pidió el orquestador (la prueba de 1.8
reutiliza el mismo `salesorderId` ('so-5') entre la asociación liberada y la reasociación, así que
también ejercita este índice). Ensuciado: `CREATE UNIQUE INDEX IF NOT EXISTS idx_ov_asoc_so_vigente ON
public.ov_asociaciones (salesorder_id);` (sin el `WHERE`).

```
FAIL ... liberarAsociacion > tras liberar, la misma OV (numero y salesorderId) es reasociable a otro ticket
Error: ERROR: insert into "ov_asociaciones" (...) - duplicate key value violates unique
constraint "ov_asociaciones_pkey"
DETAIL: Key (salesorder_id)=(so-5) already exists.
```

Revertido; verificado con `git diff -U0 -- schema.sql | grep '^@@'` (un único hunk de fin de fichero) y
con la suite completa de `ovAsociaciones.test.ts` + `migrate.test.ts` en verde (29/29).

### migrate.test.ts — guardián de crecimiento de esquema (regresión anticipada, no RED de aceptación)

Añadir `CREATE TABLE public.ov_asociaciones` sube el recuento total de tablas del esquema de 31 a 32
(`PUBLIC_TABLES` de 18 a 19; `DESK_TABLES` y `BOOKS_TABLES` sin cambios). El guardián
`it('son 31 tablas…')` se puso en rojo tal como anticipaba el propio diseño (no es una prueba de
aceptación nueva, es el guardián anti-drift de F0-04 §9 reaccionando a un crecimiento real):

```
FAIL migrate.test.ts > ... > son 31 tablas: 10 de Desk, 18 de la app en public y 3 replicadas de books
AssertionError: expected [ 10, 19, 3 ] to deeply equal [ 10, 18, 3 ]
```

**Cambio exacto aplicado (en sitio, mismas líneas 282-286, sin insertar ni borrar líneas):**

| Línea | Antes | Después |
|---|---|---|
| 282 | `it('son 31 tablas: 10 de Desk, 18 de la app en public y 3 replicadas de books', ...)` | `it('son 32 tablas: 10 de Desk, 19 de la app en public y 3 replicadas de books', ...)` |
| 283 | `.toEqual([10, 18, 3])` | `.toEqual([10, 19, 3])` |
| 284 | `.toBe(31)` | `.toBe(32)` |
| 285 | `.toBe(31)` | `.toBe(32)` |
| 286 | `.toBe(31)` | `.toBe(32)` |

No se tocó el bloque de comentario histórico que narra el recuento (líneas ~217-223, ~353-373):
narra las cifras de tandas anteriores (F1B-01, F1B-02, F1B-04, `parche-iv11-orden-venta`) y añadir un
párrafo nuevo ahí habría sido una inserción a mitad de fichero en `migrate.test.ts` — fichero muy
citado —, prohibida explícitamente por el encargo de esta tanda. La narración queda desactualizada en
ese punto (Caso B/histórico de la regla de mutación 4: cierta de su momento, no de hoy) hasta que otra
tanda decida documentarla al final del fichero.

Las pruebas del guardián de `ALTER TABLE` (39 ALTER: 19 calificadas + 20 sin calificar) NO se vieron
afectadas: `ov_asociaciones` sólo añade sentencias `CREATE TABLE`/`CREATE INDEX`, ninguna `ALTER TABLE`.

### Gate numbers (cierre, task 1.13)

| Gate | Comando | Resultado |
|---|---|---|
| Test focalizado | `npx vitest run packages/zoho-sync/src/db/ovAsociaciones.test.ts packages/zoho-sync/src/db/migrate.test.ts` | **29/29 passed** (6 + 23), 2 test files, 0 failed |
| Test completo | `npm test` (vitest run) | **1480 passed \| 2 skipped** (1482), 147 passed \| 1 skipped test files (148), 0 failed |
| Typecheck | `npm run typecheck` (`tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit`) | Sin salida — 0 errores |
| Lint | `npx eslint . --max-warnings 165` | **165 problems (0 errors, 165 warnings)**, exit code 0 — mismas 165 preexistentes, 0 nuevas (ninguna en `ovAsociaciones.ts`/`ovAsociaciones.test.ts`) |

### Medición (`git diff --numstat --no-renames HEAD`, paths explícitos, sin `git add .`)

```
5	5	packages/zoho-sync/src/db/migrate.test.ts
1	1	packages/zoho-sync/src/db/migrate.ts
114	0	packages/zoho-sync/src/db/ovAsociaciones.test.ts
101	0	packages/zoho-sync/src/db/ovAsociaciones.ts
29	0	packages/zoho-sync/src/db/schema.sql
```

`git diff --shortstat --no-renames HEAD` (mismos 5 paths): **5 files changed, 250 insertions(+), 6
deletions(-)** → 256 de código; **medida real del lote, con `apply-progress.md` (226) y `tasks.md` (26): 508 = ledger**, dentro del presupuesto de ~570 estimado en `design.md` §7 y muy por
debajo del techo de 800/lote. Los ficheros nuevos se midieron con `git add -N <ruta>` por archivo
explícito (nunca `git add .` ni `git add -N .`); los ficheros `docs/sdd/Parte_*`/`Evidencia_*`
untracked de la sesión NO se tocaron (`git status --short` los muestra `??` antes y después).

### Hunk de `schema.sql` (confirmación de "sólo al final")

```
git diff -U0 -- packages/zoho-sync/src/db/schema.sql | grep '^@@'
@@ -525,0 +526,29 @@ ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ov_zoho_avisada text;
```

Un único hunk, que empieza justo después de la última línea preexistente (`:525`) y añade 29 líneas
(la definición de la tabla + comentario + 3 índices). Ninguna línea 1-525 se tocó.

### Barrido de citas (regla de mutación 4)

**`schema.sql`** — `grep -rnoE "schema\.sql:[0-9]+(-[0-9]+)?"` sobre todo el repositorio (excluyendo
`openspec/changes/archive/`): todas las citas vivas encontradas apuntan a líneas ≤ 520 (el rango más
alto es `design.md:22` → `schema.sql:520-521`, el propio comentario preexistente sobre el punto y coma,
que no se tocó). **0 citas vivas** caen en o después de la región nueva (`:526-554`), tal como preveía
`design.md` §6. Como la edición fue estrictamente AL FINAL del fichero (ninguna línea 1-525 se movió,
confirmado por el hunk de arriba), ninguna cita existente pudo desplazarse.

**`migrate.ts`** — `grep -rnoE "migrate\.ts:[0-9]+(-[0-9]+)?"`: las 2 citas anticipadas por `tasks.md`
(`openspec/specs/tickets-core/spec.md:666` y `docs/sdd/Paquete_de_Despliegue_2026-09-27.md:75`, las dos
`migrate.ts:70-73`) se comprobaron por lectura — la línea 70 sigue siendo `export const PUBLIC_TABLES =
[...` y la 73 sigue cerrando el array en la misma línea (con `'ov_asociaciones'` añadido al final del
literal); el rango `:70-73` sigue delimitando correctamente la declaración completa de `PUBLIC_TABLES`,
que es lo único que ambas citas afirman (no afirman un recuento de elementos). Caso A/presente: siguen
leyendo lo mismo. El fichero no cambió de longitud (131 líneas antes y después), así que ninguna otra
cita a `migrate.ts` (barridas también, ~35 citas más, todas en líneas 19-88, muy anteriores a la 131)
pudo desplazarse.

**`migrate.test.ts`** — `grep -rnoE "migrate\.test\.ts:[0-9]+(-[0-9]+)?"`: las citas vivas encontradas
(`CLAUDE.md:194,203`; `openspec/config.yaml` varias; `openspec/specs/tickets-core/spec.md` varias;
`openspec/specs/zoho-sync/spec.md:265,310`) apuntan a líneas 33, 220-222, 229-232, 245, 266, 327,
345-351, 409-411 — ninguna cae en el rango editado (282-286). Se comprobó por lectura el contenido de
las líneas 266, 327 y 345-351 (las más próximas al rango tocado): sin cambios. El fichero no cambió de
longitud (444 líneas antes y después), así que ninguna cita pudo desplazarse.

### Regla invariable 13 (registro, sin código de cliente en este lote)

Este lote no toca ningún fichero de `apps/desk/src`: no aplica todavía (se enumera en el `apply-
progress.md` del lote 6, cuando exista código de cliente que consumir).

### Deviations from Design

Ninguna deviation de fondo respecto a `design.md` §1. La única desviación es de PROCESO (documentada
arriba): escribir `liberarAsociacion`/`liberarAsociacionesDeTicket` antes de tiempo, corregida en el
mismo turno retirándolas y capturando el RED genuino antes de restaurarlas.

### Issues Found

Error de sintaxis propio en el primer intento de `schema.sql` (tres punto y coma dentro de
comentarios nuevos, rompiendo `schemaStatements()`), documentado arriba y corregido antes de cerrar el
lote. No afecta al estado final del fichero (verificado: 0 sentencias omitidas tras la corrección — los
tests pasan y `equipos_cambios`/`ov_asociaciones` existen tras `migrate`).

### Workload / PR Boundary

- Mode: chained PR slice (stacked-to-main), lote 1 de 6.
- Current work unit: Unit 1 — Tabla `ov_asociaciones`, índices únicos parciales, `asociarOV`/`liberarAsociacion`.
- Boundary: empieza en el HEAD `8a46998` (nada de esquema/tabla previo); termina con la tabla, los
  índices, el módulo de acceso a datos y `PUBLIC_TABLES` actualizado, todo en verde. Rollback: revertir
  este commit; la tabla es nueva y nadie más la lee.
- Estimated review budget impact: 508 líneas reales (256 de código y pruebas) sobre ~570 estimadas y 800 de techo — bajo.

### Status

**13/13 tareas del lote 1 completas.** Lote 1 de 6 del cambio `asociacion-ov-ticket`. Siguiente:
lote 2 (Escritores y puertas), que depende de este lote y ya puede arrancar.

---

## Lote 2 · Escritores y puertas (tasks 2.1-2.31) — COMPLETO

**Mode**: Strict TDD. **HEAD de partida**: `3555b6c`. Detalle largo (salidas rojas y de mutación) en Engram,
`sdd/asociacion-ov-ticket/apply-progress`.

### TDD Cycle Evidence

| Tasks | Prueba (fichero, al final) | RED capturado (17 rojas, un solo `vitest` antes de escribir código) | GREEN |
|---|---|---|---|
| 2.1-2.4 | `ovAsociaciones.test.ts` tercera vía (3 casos) | `expected null to deeply equal { id: 't-a', number: 9001 }` | `repo.ts:368-371` |
| 2.5-2.8 | `ticketService.test.ts` alta y rama «Equipo nuevo» | `expected [] to have a length of 1 but got +0` / `expected [] to deeply equal [ … ]` | `equipoNuevo.ts:80-99` |
| 2.9-2.11 | `ordenVentaUnTicket.test.ts` puerta 1 | `expected 201 to be 409` | (delega en `ticketConOrdenVenta`) |
| 2.12-2.15 | `ticketService.test.ts` `habilitar_servicio` (3 casos) | `expected [] to deeply equal [ { ticket_id: 't-h', … } ]` | `repo.ts:311` + `asociarDesdeTransicion` |
| 2.16-2.17 | `ordenVentaUnTicket.test.ts` puerta 2 | `expected 200 to be 409` | (delega) |
| 2.18-2.22 | `remisiones.test.ts` puerta 3 | `expected [] to deeply equal [ { ticket_id: 't-dest-l2', … } ]`, `expected 201 to be 409` | `remision.ts:5,221-243` |
| 2.23-2.26 | `books/repo.test.ts` `soloLibres` | `expected [ 's-libre', 's-solonum', 's-usada' ] to deeply equal [ 's-libre' ]` | `books/repo.ts:160-161` |
| 2.27-2.30 | `eliminarTicket.test.ts` | `expected null not to be null` (liberada_at) y `23505` al reasociar | `eliminarTicket.ts:154` |

**Nacieron verdes (por diseño, no son rojos):** excluir al propio ticket en la tercera vía, la asociación liberada
no cuenta, el alta sin asociación previa sigue en 201 (2.9 escenario 1, regresión), `habilitar_servicio` del propio
ticket con su OV asociada (2.16), las mitades «gana el 422» de las tres pruebas de posición (solo la mitad de
control de población nace roja), el 422 «Orden de venta no encontrada» ante asociación (2.18), el simulacro de
eliminar y «sin OV no asocia». Las pruebas de posición previas (incluida `remisiones.test.ts:988`) no se tocaron.

### Mutaciones (todas revertidas, `git diff` de los ficheros de producción intacto tras cada una)

| Mutación | Rojas |
|---|---|
| Quitar `vias.push(… ov_asociaciones …)` (tercera vía) | 7: 1 de `ovAsociaciones.test.ts`, 2 puerta 1, 2 puerta 2, 2 puerta 3 (las tres pruebas de tercera vía y sus tres de posición) |
| Posición puerta 1: `ticketConOrdenVenta` antes de la guarda de obligatorios (`ticketService.ts`) | POSICIÓN puerta 1 |
| Posición puerta 2: el 409 antes de los errores del plan (`ticketService.ts`) | POSICIÓN puerta 2 |
| Posición puerta 3: todo el bloque de la OV antes del 422 del serial (`remision.ts`) | POSICIÓN puerta 3 nueva + M5 + IV-4 (esta ya existía) |
| Quitar `liberarAsociacionesDeTicket` (`eliminarTicket.ts`) | 2 (liberar y reasociar) |
| Quitar cada escritor (remisión, transición, alta) y la exclusión de `soloLibres` | 1, 3, 2 y 2 respectivamente |

### Medida, cierre y citas (regla de mutación 4)

`npm test`: 147 ficheros / 1.505 pruebas verdes (1 fichero, 2 pruebas omitidas de integración, como antes).
`npm run typecheck`: limpio. `eslint --max-warnings 165`: 165 avisos, 0 errores. `repo.ts` sigue en 452 líneas y
`remision.ts` en 397; ningún hunk desplaza líneas. Ningún fichero nuevo (`ovAsociaciones.ts` es del lote 1).
Medida `git diff --shortstat --no-renames HEAD`: 635 líneas (569+/66-, 14 ficheros, con esta sección y `tasks.md`) sobre ~580 estimadas y 800 de techo. El detector de citas del repo actúa sobre
commits (hook `pre-push`, `apps/desk/server/citas/cli.ts`), sin script npm: se ejecuta al empujar.

Citas leídas contra el fichero editado: `repo.ts:349-352` (test de `ordenVentaUnTicket.test.ts:14`) sigue leyendo
el arranque del comentario; `repo.ts:362-379` (remisiones/tickets-core/transitions-st) sigue siendo la función;
`remision.ts:230`, `:220`, `:241` (`ordenVentaUnTicket.test.ts`, `remisiones.test.ts`, `CLAUDE.md`) intactas y
ciertas; `remision.ts:239-243` (`remisiones` y `zoho-sync`) sigue siendo el `UPDATE`. **Un desfase, caso A
parcial:** `hojas-vida/spec.md:273` cita `equipoNuevo.ts:80-92` para «crea el equipo en transacción»; la función
ocupa ahora `:80-99`, así que el final del rango cae a mitad (el contenido citado sigue cierto). No se edita: es
una spec viva, se anota para el barrido del lote 6.

### Deviations from Design

1. `fecha_orden_compra` de la asociación de remisión queda `null`, no `ov.date` (`tasks.md` 2.20): `ov.date` es la fecha
   de la orden de VENTA y esa columna es la de orden de COMPRA (S-5); supuesto reversible, la remisión no trae OC.
2. `asociarDesdeTransicion` tipa el plan de forma estructural (`{ columns }`), no con `TransitionApply`, para que
   `ovAsociaciones.ts` siga importando sólo de `./migrate`.
3. Las pruebas de tercera vía de `ticketConOrdenVenta` van en `ovAsociaciones.test.ts` (2.1 admitía ese sitio).

### Status

**31/31 tareas del lote 2 completas.** Siguiente: lote 3 (Varias OV por ticket), que amplía `asociarDesdeTransicion`.

## Lote 3 · Varias OV por ticket (tasks 3.1-3.17) — COMPLETO

Detalle largo en Engram: `sdd/asociacion-ov-ticket/apply-progress-lote-3`.

### TDD Cycle Evidence

| Tarea | Prueba (fichero) | RED capturado |
|---|---|---|
| 3.1 | `transitionExec.test.ts` «3.1 · escribe plan.ovAdicional…» | `expected undefined to be 'OV-2026-777'` (el destino no existía, caía a la columna/jsonb) |
| 3.1 | «vacío u omitido no deja nada» | nació VERDE: el campo opcional vacío nunca escribe, con o sin la rama |
| 3.9 | `ticketService.test.ts` «3.9 · dos asociaciones vigentes» y «aprobacion_y_repuestos…» | sólo 1 asociación vigente (la de entrada): `OV adicional` caía a `custom_fields` |
| 3.12 | «3.12 · fecha de OC en la asociación» | no había fila para `OV-2026-902` (`undefined`) |
| S-10 | «S-10 · sin el campo opcional…» | nació VERDE: sin el campo el comportamiento es el de hoy; lo vigila la mutación de `required` |
| guardián | `transitionExec.test.ts` «el catálogo declara bien…» (4 pruebas) | nacieron verdes (vigilan el catálogo ya escrito); su rojo es la mutación 2 |

### Mutaciones (todas revertidas byte a byte; `cmp` contra copia previa)

Ejecutar la suite entera con `npx vitest run` tras cada edición:
- **3.5** en `transitions.ts`, `cfOvAdicional` → `key:'Orden de Venta'` + `target:'customField'`: rojas 5 (las tres de 3.9/3.12
  y del guardián «sólo lo llevan las dos aprobaciones» y «ningún buscador… salvo la OV de entrada»).
- **Mutación 2** (ensuciar el catálogo): clave `'Orden de Venta'` con `target:'ovAdicional'`: rojas 4 (3.9 ×2, 3.12 y el guardián
  «su clave no casa con ninguna columna promovida»).
- **S-10**: `cfOvAdicional('Fecha Orden de Venta Final', true)`: rojas 4 (guardián «es opcional», la S-10 de servicio y dos de
  `transiciones.test.ts` «POST /api/tickets/:id/transition (Postgres)»).
- **Rama `ovAdicional`** de `asociarDesdeTransicion` anulada (`const adicional = undefined as string | undefined`): rojas 3 (3.9 ×2, 3.12).

**Guardián del catálogo:** `transitionExec.test.ts`, describe «el catálogo declara bien el campo de OV adicional» (nuevo, al
final). Antes de este lote ninguna prueba vigilaba que una clave de campo de OV no casara con `PROMOTED_COLUMNS`.

### Lo aplicado y las restricciones «en sitio»

`transitions.ts` 363→376 (hunks `:17`, `:199`, `:203`, y `cfOvAdicional` al final, `function` elevada); `transitionExec.ts` 99→99
(`:21`, `:88`); `repo.ts` 452→452 (`:267`); `ticketService.ts` 234→234 (`:148`). `asociarDesdeTransicion` (módulo del lote 1)
asocia también `plan.ovAdicional`. Cliente (`apps/desk/src`) SIN tocar: el buscador de OV ya existe (`kind:'ordenVenta'`) y
`TransitionPanel.tsx:103` escribe `values[f.key]` y `values[f.campoFecha]`, así que la regla 13 no aplica a este lote.
Servidor que impone: `transitionExec.ts:88` (destino), `ticketService.ts:148-152` (409 de unicidad sobre la OV adicional).

### Cierre (3.14-3.17)

`bodegaje.test.ts` y `packages/shared` completo verdes sin cambios (3.14/3.15). `npm run typecheck` limpio (3.16: ningún `switch`
exhaustivo sobre `FieldTarget`). `npm test`: 147 ficheros / 1.515 pruebas verdes (1 fichero y 2 pruebas omitidos, como antes).
`eslint --max-warnings 165`: 165 avisos, 0 errores. `invariantesGrafo.test.ts` verde: el mapa del Blueprint no se regeneró.
Citas leídas por CONTENIDO: `bodegaje.test.ts:360`/`:362` (`transitions.ts:199`, `:202-203`), `transitions-st/spec.md:295`
(`transitions.ts:17`), `transitionExec.ts:88` (`transitions-st/spec.md:300`), `rows.ts:120` y `tickets-core/spec.md:328` (`:90-92`): ciertas.

### Deviations from Design

1. **Origen de la asociación adicional.** `asociarDesdeTransicion` no recibe la transición y `repo.ts:311` no puede cambiar en este
   lote, así que `aprobacion` frente a `aprobacion_y_repuestos` se deduce de la fecha de OC del plan (`fecha_orden_compra`, obligatoria
   sólo en la segunda; `fecha_orden_compra_final`, sólo en la primera). Supuesto reversible: pasar el `id` de la transición.
2. **Clave del campo `'OV adicional'`** (no está en `PROMOTED_COLUMNS`), etiqueta y `label` iguales.
3. **Riesgo visto, no corregido:** en `aprobacion_y_repuestos` el `campoFecha` del buscador es `'Fecha Orden De Venta'`, la misma fecha
   obligatoria que ya existía; elegir la OV adicional REESCRIBE esa fecha en `fecha_orden_venta` del ticket. Con `aprobacion` no pasa
   (`'…Final'` es otra columna).

### Status

**17/17 tareas del lote 3 completas.** Siguiente: lote 4 (Cuarentena).


## Lote 4 · Cuarentena (tasks 4.0a-4.22) — COMPLETO

Incluye primero la **corrección de RQ-TS-18** (4.0a-4.0e): `design.md:111-112` violaba la spec (`specs/transitions-st/spec.md:47-51`, «sin tocar la OV de entrada»).
`cfOvAdicional('Fecha Orden De Venta')` daba a la OV adicional el `campoFecha` de la columna `fecha_orden_venta` (`rows.ts:108`): el autofill de `TransitionPanel.tsx:103` pisaba la
fecha de entrada y `:66` ocultaba al teclado el campo manual obligatorio. **Cierra la desviación 1 y el riesgo 3 del lote 3** (arriba, históricos, caso B: no se reescriben).

### TDD Cycle Evidence

| Tarea | Prueba | RED capturado (mensaje exacto) |
|---|---|---|
| 4.0a | `ticketService.test.ts` «4.0a · aprobacion_y_repuestos: fecha_orden_venta conserva la fecha tecleada» | `la fecha tecleada gana al autofill de la OV adicional: expected '2026-07-15' to be '2026-06-10'` |
| 4.0b | `transitionExec.test.ts` guardián «ningún campo con destino ovAdicional…» | nació VERDE tras el arreglo; con el catálogo viejo: `aprobacion_y_repuestos: campoFecha "Fecha Orden De Venta" → fecha_orden_venta: expected [ 'orden_venta', 'fecha_orden_venta' ] to not include 'fecha_orden_venta'` |
| 4.0c | `ovAsociaciones.test.ts` «4.0c · el origen es el id de la transición…» | `expected 'aprobacion_y_repuestos' to be 'aprobacion'` (y la inversa: `expected 'aprobacion' to be 'aprobacion_y_repuestos'`) |
| 4.0c | `ticketService.test.ts` «aprobacion sin fecha de OC final registra origen aprobacion» | **NACE VERDE** (la deducción vieja ya daba `aprobacion` sin fecha): guarda de regresión, no discrimina |
| 4.1 | `subOV.test.ts` (tabla `it.each`, 27 casos) | `Cannot find module './subOV'` (módulo inexistente) |
| 4.5 | `ticketService.test.ts` «4.5 · el alta con una OV en cuarentena responde 422…» y «POSICIÓN alta» | `se esperaba un HttpError y la llamada no lanzó ninguno`; posición: `la cuarentena (C) precede a la unicidad (D): expected 409 to be 422` |
| 4.9 | «4.9 · habilitar_servicio…», «POSICIÓN habilitar_servicio», «la OV adicional de una aprobación» | `se esperaba un HttpError…` (×2); posición: `expected 409 to be 422` |
| 4.13 | `remisiones.test.ts` (al final) «4.13 · OV en cuarentena y YA usada…» | `la cuarentena (C) precede a la unicidad (D): expected 409 to be 422` |
| 4.18 | `books/repo.test.ts` «cuarentena de subOV» (2) | `expected [ 's-canon', 's-cuar', 's-madre' ] to deeply equal [ 's-canon', 's-madre' ]`; `expected [ 's-c1', 's-c2' ] to deeply equal [ 's-ok1', 's-ok2' ]` |

Nacieron verdes a propósito (controles de población, no RED): las dos con subOV canónica que llegan al `409` (alta, transición, remisión) y «OV inexistente sigue diciendo *Orden de venta no encontrada*».

### Mutaciones de posición (regla de mutación 1; una a la vez, revertida y `cmp` contra copia previa)

| # | Mutación (guarda movida DESPUÉS de la unicidad) | Resultado |
|---|---|---|
| 4.17-a | `ticketService.ts:96` → tras el bloque del `409` (`:100`) | ROJA 1: `la cuarentena (C) precede a la unicidad (D): expected 409 to be 422` (POSICIÓN alta) |
| 4.17-b | `ticketService.ts:134` → `erroresCuarentena` fuera del `422` y evaluado tras el `409` de `:151` | ROJA 1: mismo mensaje (POSICIÓN habilitar_servicio) |
| 4.17-c | `remision.ts:220` → `if (!ov)` solo, y la cuarentena tras el `409` (`:234`) | ROJA 1: mismo mensaje (4.13) |

### Lo aplicado y las restricciones «en sitio»

`ticketService.ts` 234→234 (`:6`, `:96`, `:134`); `remision.ts` 397→397 (`:4`, `:220`); `repo.ts` 452→452 (`:311`); `books/repo.ts` 182→182 (`:2`, `:163`, `:176`);
`transitions.ts` 376→376 (`:199`, `:372`, `:374`; comentario y firma de `cfOvAdicional`); `shared/index.ts` 22→23 (línea nueva AL FINAL). Verificado con `git diff -U0`.
`subOV.ts`: clasificador (`clasificarOV`, `esCuarentena`, `motivoCuarentena`, `erroresCuarentena`). **Escalón:** la cuarentena es **C** (validez del contenido: la OV existe, su número es lo inválido),
no A; por eso va tras la existencia y antes de la unicidad (D) en las tres puertas. `remision.ts:220` queda DETRÁS del `409` de remisión pendiente `:177` (molde de IV-12: se anota, no se corrige).

### Cierre (4.22)

`npx vitest run`: 148 ficheros / 1.557 pruebas verdes (1 fichero y 2 pruebas omitidos, como antes). `npm run typecheck` limpio. `eslint --max-warnings 165`: 165 avisos, 0 errores.
Medida: `git add -N` sólo de `subOV.ts` y `subOV.test.ts`; `git diff --shortstat --no-renames HEAD`: **17 ficheros, +460 −50 = 510 líneas** (medida al cerrar, con este fichero, `tasks.md` y `design.md` incluidos; techo 800).
Citas leídas por CONTENIDO (edición en sitio, nada se desplazó): `CLAUDE.md` IV-12 → `remision.ts:220` «Orden de venta no encontrada» sigue literal; `:127`, `:155`, `:177`, `:197` intactas;
`ordenVentaUnTicket.test.ts:19`, `tickets-core/spec.md:306`/`:519`, `config.yaml:1132` → `ticketService.ts:96-100` (el `409` del alta sigue ahí, ahora con la cuarentena en `:96`); `transitions-st/spec.md:267`/`:275`/`:902`
y `fechasDerivadas.ts:106` → `ticketService.ts:132-134` (el `422` de contenido, ahora también con la cuarentena; «C antes que D» sigue cierto y más completo); `bodegaje.test.ts:360` → `transitions.ts:199` sigue siendo `aprobacion_y_repuestos`.
Las citas de `archive/` y `config.yaml:579` a `ticketService.ts:134-135` son históricas (caso B): no se tocan.

### Deviations from Design

1. **`books/repo.ts:163`:** el diseño decía `limit * 3` sólo con `soloLibres`; se aplica SIEMPRE, porque 4.18 pide la cuarentena fuera «con o sin `soloLibres`» y el filtro es de TS (pg-mem no tiene `~`).
   Riesgo: si más de dos tercios de la página son cuarentena, devuelve menos de `limit`. Aceptado hasta conocer la cifra de P.1.
2. **Regla del clasificador, consecuencia declarada:** una secuencia de cinco dígitos (`OV-2026-00123`) es la base `OV-2026-0012` más el resto `3` y cae en cuarentena (regla literal de `design.md` §5). Hipótesis: producción no tiene OV de cinco dígitos; lo confirma P.1.
3. **RQ-TS-18:** el diseño del lote 3 se corrigió (4.0a-4.0d); la spec no cambia. Origen de la asociación adicional: ahora la transición (cierra la desviación 1 del lote 3).
4. **Pendiente para el lote 6:** la tabla de destinos de `transitions-st/spec.md` no lista `ovAdicional`; el cliente depende de `campoFecha` (`TransitionPanel.tsx:66`/`:103`); ningún `.tsx` cambia en este lote.

### Status

**27/27 tareas del lote 4 completas (4.0a-4.0e y 4.1-4.22).** Siguiente: lote 5 (API de servidor).

---

## Lote 5 · API de servidor

### 5.0a-5.0c · Corrección del clasificador (SUPERA la desviación 2 del lote 4, que queda como registro histórico, caso B)

S-2 pone en cuarentena SÓLO «una OV con sufijo que no cumpla la expresión» (`Decisiones_Gerencia_2026-09-10.md:459-461`; expresión canónica en `Consulta_SubOV_formato_2026-09-27.sql:15`).
El clasificador del lote 4 leía `OV-2026-00123` como base `OV-2026-0012` + resto `3` y la ponía en cuarentena, sin sufijo alguno. Regla corregida: **sufijo = resto que EMPIEZA por un no-dígito tras la base `OVI?-AAAA-NNN…`**.

- RED (`subOV.test.ts`): `OV-2026-00123`, `OVI-2026-00123`, `OV-2026-001234` → ordinaria. Rojo: `expected { tipo: 'cuarentena', …(1) } to deeply equal { tipo: 'ordinaria' }`, 3 fallos.
  Las demás filas nuevas (`OV-2026-170`/`OVI-2026-170` ordinarias; `OV-2026-00123-01`, `-170-1`, `_1`, `-001`, `OVI-…-170-01` cuarentena; `OV-2026-170-01` subOV del lote `OV-2026-170`) **nacieron VERDES**: guardas de regresión.
- GREEN (`subOV.ts:24-25`): `BASE = /^OVI?-\d{4}-\d{3,}$/`, `BASE_CON_RESTO = /^OVI?-\d{4}-\d{3,}[^\d][\s\S]*$/`; `SUBOV` intacta. Cabecera reescrita en su sitio (4→4 líneas). 39/39.
- Consecuencia declarada, S-2 literal: `OV-2026-00123-01` tiene sufijo y su base de cinco dígitos no casa la subOV (exacta) → cuarentena.
- Docs en su sitio: `design.md:133`, `design.md:135` (`limit * 3` SIEMPRE, aceptado por Gerencia en la revisión del lote 4; mayúsculas aceptado), `specs/tickets-core/spec.md` RQ-TC-18 (+1 línea).
- Citas: nadie cita `subOV.ts:N` (barrido `subOV\.ts:[0-9]+`: 0 resultados).

### 5.1-5.22 · Saldo, rutas y matriz de permisos

**Supuesto del escenario del saldo (orquestador, 2026-09-28, reversible).** La spec decía «cinco subOV: dos vigentes, dos libres, una en cuarentena → 5/2/2/40 %», incoherente (libres = creadas − consumidas). Gerencia fija sólo la fórmula (`Decisiones_Gerencia_2026-09-10.md:472`) y que la cuarentena no suma ni resta (`:459-461`). Se corrigió EN SITIO (`specs/zoho-sync/spec.md:35-38`, `tasks.md` 5.1): cinco subOV canónicas —dos vigentes, tres libres— y una sexta en cuarentena → **5/2/3/40 %**. Una subOV en cuarentena (`OV-2026-170-X9`) no tiene lote canónico según SUBOV: nunca entra en el saldo de ningún lote (sólo cuentan las canónicas del lote pedido) y sale en `listarCuarentena`.
**S-11, HIPÓTESIS:** los literales de estado son `'draft'` y `'void'`. Verificado en el repo: `status NOT IN ('void','draft')` (`booksHub/salesRecords.ts:9`) y `order_status = 'open'` (`books/repo.ts:171`); ningún fichero fija los literales de `order_status`. `books/subOV.ts` comprueba `order_status` y `status`; lo declara en su comentario.
**Lecturas** (supuesto reversible): cualquier usuario con sesión (`requireAuth`); leer no decide nada y la ficha la ve Servicio Técnico. `app.ts`: import en la misma línea `:22`, llamada nueva en `:61`; nada más.
**Áreas:** `areasForTransition('Comercial')` → `['Comercial']` (`transitions.ts:313`, parte por `' / '`); `canExecuteTransition` exige que `user.areas` incluya `'Comercial'` (`permissions.ts:4-6`). Las áreas de usuario son las BASE (`AREAS`, `transitions.ts:310`), no hay valor `'Comercial / Compras'`: un usuario `['Comercial','Compras']` SÍ libera; uno `['Compras']` solo, NO.

| Endpoint | sin sesión | Servicio Técnico | Compras sola | Comercial | Comercial+Compras | admin |
|---|---|---|---|---|---|---|
| `PUT …/:id/liberar` | 401 | 403 (fila intacta) | 403 (fila intacta) | 200 | 200 | 200 |
| `GET /api/tickets/:id/ov-asociaciones` | 401 | 200 | 200 | 200 | 200 | 200 |
| `GET /api/ov-asociaciones/cuarentena` | 401 | 200 | 200 | 200 | 200 | 200 |
| `GET /api/ov-asociaciones/saldo/:lote` | 401 | 200 | 200 | 200 | 200 | 200 |

Prueba de cada celda: `routes/ovAsociaciones.test.ts`, `describe` «PUT … · matriz por área» y «GET … · matriz por área» (un `it` por rol: `sin sesión`, `Servicio Técnico`, `Compras sola`, `Comercial`, `Comercial + Compras`, `administrador`). La celda «GET ficha, sin sesión» **nació verde** (el 401 ya lo daba el montaje de `/api/tickets`), y «A: 404» también.
Escalera: `A: inexistente → 404 aunque…`, `sin Comercial Y motivo vacío → 403, no 422`, `sin Comercial Y ya liberada → 403, no 409`, `ya liberada Y motivo vacío (Comercial) → 409, no 422`, `C: motivo … → 422`.

**Mutaciones (todas revertidas, `cmp` idéntico):**

| | Mutación | Rojo |
|---|---|---|
| M1 (posición) | 403 tras el 422 | `sin Comercial Y motivo vacío → 403, no 422`: `expected 422 to be 403`; `…ya liberada → 403, no 409`: `expected 409 to be 403` |
| M2 (posición) | 409 tras el 422 | `ya liberada Y motivo vacío (Comercial) → 409, no 422`: `expected 422 to be 409` |
| M3 | sin comprobación de permiso | `matriz … Servicio Técnico` y `Compras sola`: `expected 200 to be 403` (+2 de la escalera) |
| M4 (rule 2) | saldo cuenta draft/void | `S-11: una subOV en borrador y otra anulada no cuentan como creadas` |

**Regla 13, servidor:** «botón liberar sólo Comercial» → `routes/ovAsociaciones.ts` (`canExecuteTransition`, consumida de `@ambientalia/shared`); «motivo obligatorio» → mismo fichero, 422 tras `trim`; «desplegable oculta usadas y cuarentena» → `books/repo.ts:159-176` (lote 4). Sin línea de servidor: filtro por cliente (IV-8, declarado).

### Status

Lote 5 completo: 3 + 22 tareas. Nacieron verdes (además de las celdas citadas): `un lote sin subOV`, `sin salesorder_id se reconoce por número`, `cuarentena fuera del buscador` (reutiliza 4.20, tarea 5.6).

---

## Lote 6 · Interfaz y cierre

**Modo**: Strict TDD para lo que tiene red (renombrado, guardián del catálogo); `apps/desk/src/**/*.tsx` queda fuera de la red por decisión de Gerencia (F0-00), sin tareas RED para `.tsx`. HEAD de partida `1c1b5d7`.

### 6.0a · `ejecutado` → `consumido` (RED/GREEN)

- RED: se cambian las expectativas a `consumido` en `books/subOV.test.ts` (5 casos) y `routes/ovAsociaciones.test.ts` (1). Rojo: 6 fallos, `expected { lote: 'OV-2026-170', …(4) } to deeply equal { lote: 'OV-2026-170', …(4) }` (y `to match object { creadas: 1, consumidas: 1, …(2) }`).
- GREEN: `SaldoLote.consumido` y su cálculo en `books/subOV.ts:22`/`:47`; la ruta devuelve el objeto tal cual. 43/43.
- Porqué (escrito en `design.md` §5, fila «Lista de cuarentena y saldo», en su sitio): `Decisiones_Gerencia_2026-09-10.md:472` definía «% ejecutado = consumidas / creadas», pero `decision/anexo-53-contratos` (24/09, `openspec/config.yaml:2448`; informe trimestral `:2457`) redefine «ejecutada» como subOV con ticket FINALIZADO. Ese «% ejecutado» es del cambio 3 (`proposal.md:49`) y NO se implementa aquí. El documento de Gerencia no se renombra.
- 6.0b: consulta 5 al final de `Consulta_SubOV_formato_2026-09-27.sql`; P.4 en `tasks.md`; `draft`/`void` siguen «hipótesis» en `design.md` (S-11).

### 6.1-6.3 · Interfaz

- 6.1 `api/client.ts` (al final): `listarOvAsociaciones`, `liberarOvAsociacion`, `listarCuarentena`, `saldoPorLote`, más `mensajeDelServidor` (extrae el `error` del `HTTP 4xx: {…}` para enseñarlo tal cual).
- 6.2 `PanelOvAsociaciones.tsx` (nuevo) montado en `TicketDetailView.tsx` estrictamente DESPUÉS de `:245`, sobre la caja de transiciones, plegado por defecto; el `import` es segunda sentencia de la línea `:15`. `:245` no se mueve. Había 8 citas vivas EN `:245` (no «0 en o tras»); ninguna posterior.
- 6.3 `OvCuarentenaSaldo.tsx` (nuevo), abierto desde Configuración → «Administración de datos» (la entrada `Órdenes de venta (Zoho Books)` era `soon: true`; se sustituye EN SU SITIO, `Configuracion.tsx:127`; `:118`, la que cita ENTRADA.md, no se mueve). Sólo lectura.

### 6.4 · Regla 13 / mutación 3 — decisión del cliente → línea del servidor

| Decisión del cliente | Línea del servidor que la impone |
|---|---|
| Botón «Liberar» sólo para Comercial y administrador (`PanelOvAsociaciones.tsx`, mismo `canExecuteTransition` de `@ambientalia/shared`) | `routes/ovAsociaciones.ts:47` (403) |
| Motivo obligatorio: el cliente NO lo comprueba, manda y enseña el error | `routes/ovAsociaciones.ts:51` (422) |
| Asociación ya liberada: el cliente NO lo comprueba, enseña el error | `routes/ovAsociaciones.ts:48` (409; carrera en `:54`) |
| La lista de OV del ticket la ve cualquier usuario con sesión; el panel va plegado | `routes/ovAsociaciones.ts:26` (`requireAuth`, sin rol): la visibilidad es comodidad |
| Cuarentena y saldo: la entrada y la pantalla las ve cualquiera; el formato del lote lo valida el servidor | `routes/ovAsociaciones.ts:30`, `:34` (`requireAuth`), `:36` (422 de formato) |
| El desplegable de OV oculta las usadas y las de cuarentena | `books/repo.ts:159-162` (`libresFilter`) y `:176` (`esCuarentena`) |
| `aprobacion`: al elegir la OV adicional se autorrellena `Fecha Orden de Venta Final` y se bloquea el teclado si ya tiene valor (`TransitionPanel.tsx:103`, `:174`) | **Ninguna.** `transitionExec.ts:91` guarda cualquier valor de ese campo como fecha normal (`convert`, `:33`, sólo trunca a 10 caracteres); el servidor no autorrellena ni comprueba que la fecha sea la de la OV. Comodidad pura (regla 13, punto 2), declarada. No bloquea nada que el servidor rechace |
| `aprobacion_y_repuestos`: `Fecha Orden De Venta` vuelve a ser tecleable (`TransitionPanel.tsx:66`; `cfOvAdicional()` sin `campoFecha`) y obligatoria | `transitionExec.ts:77` (`Falta el campo obligatorio`), con `cfDate` `required = true` por defecto (`transitions.ts:75`) |
| Filtro del desplegable por cliente | **Ninguna, a propósito** (IV-8; `books/repo.ts:148-149` sólo filtra si el cliente lo manda). Comodidad declarada |

Sólo dos filas sin línea de servidor —autofill/bloqueo de la fecha final y filtro por cliente—, las dos comodidades declaradas; ninguna guarda vive sólo en el cliente.

### Comprobación de `TransitionPanel.tsx:66`/`:103` (por lectura, sin cambio de `.tsx`)

`fechasDeOV` (`:65-66`) oculta al teclado toda fecha que sea `campoFecha` de algún campo, y `:103` la escribe al elegir la OV. `cfOvAdicional()` de `aprobacion_y_repuestos` (`transitions.ts:199`) NO declara `campoFecha`, así que `Fecha Orden De Venta` NO está en `fechasDeOV` y se teclea a mano; en `aprobacion` (`:203`) la OV adicional arrastra `Fecha Orden de Venta Final`, que nunca resuelve a `fecha_orden_venta` (`rows.ts:118` la mapea a `fecha_orden_venta_final`). Guardián nuevo sobre el catálogo REAL (`transitionExec.test.ts`, al final, 2 `it`): `aprobacion_y_repuestos` → `campoFechas = []`; `aprobacion` → `['Fecha Orden de Venta Final']`. **Nacen VERDES** (describen el catálogo de hoy).

### 6.5-6.6 · Documentos en su sitio

- `CLAUDE.md`: fila de IV-11 (misma línea física) con la actualización del 2026-09-28: `ov_asociaciones` escrita por los tres escritores, tercera vía en las tres puertas, liberación con motivo; **REDUCIDO, no cerrado**: las filas elegidas antes de `parche-iv11-orden-venta` o de este cambio no tienen ni marca ni asociación (sin relleno, P.2 de Gerencia, dato de producción). Fila de IV-12: nota de que la cuarentena (`remision.ts:220`) queda detrás del `409` (`:177`), mismo molde. Sin líneas nuevas en la tabla (`@@ -348,2 +348,2`).
- `openspec/config.yaml`: `adendas_incumplimientos_vivos` NO está al final (`:3099` en `e3d5e90`); precedente de «al final con clave propia»: `aprobaciones_de_techo_del_ledger`. Se añade la clave `adenda_iv11_asociacion_ov_ticket` al final (con `P4_estados_de_books`) y la ficha de IV-11 la remite por clave en su sitio (`:1100`, comentario de `estado`).

### 6.7 · Barrido de citas (regla de mutación 4)

Método: `git grep -o` de `<fichero>:N(-M)?` fuera de `openspec/changes/archive`, filtrado por directorio (`repo.ts` es ambiguo: `db/` y `books/`); se leen las citas cuyo rango CORTA un rango editado (`git diff -U0 4501784^ HEAD` más el árbol de hoy) o cae en un tramo desplazado; segundo pase de la forma abreviada (`:N` en la misma línea física detrás de una cita del módulo). Desplazamientos reales: `app.ts` +1 desde `:61`; `transitions.ts` +13, `schema.sql` +29 y `equipoNuevo.ts` +7, los tres AL FINAL (sin cita posterior). Clasificación por lectura de lo que afirma cada frase.

| Fichero | Citas totales | Leídas | A | B | C | Reparadas |
|---|---|---|---|---|---|---|
| `db/repo.ts` | 46 | 7 | 7 | 0 | 0 | 0 |
| `remision.ts` | 132 | 46 (+8 abreviadas, todas A) | 32 | 10 | 3 | 1 (`remisiones/spec.md:110`: `:214-222` → `:218-244`/`:239-243`; ya rota antes, de F1B-01 `607e26a`) |
| `ticketService.ts` | 179 | 39 (+15 abreviadas) | 31 | 8 | 0 | 0 |
| `transitions.ts` | 233 | 34 (+3 abreviadas) | 17 | 17 | 0 | 0 |
| `books/repo.ts` | 33 | 12 (+4) | 12 | 0 | 0 | 0 |
| `app.ts` | 20 | 2 | 0 | 2 (ancladas `1d030d5`) | 0 | 0 |
| `schema.sql` | 124 | 0 | 0 | 0 | 0 | 0 |
| `equipoNuevo.ts` | 11 | 7 | 3 | 4 | 0 | 2 (`hojas-vida/spec.md:273`: `:80-92` → `:80-99`; `design.md:71`, con ancla `5ad3d37`) |
| `eliminarTicket.ts` | 18 | 5 | 5 | 0 | 0 | 0 |
| `transitionExec.ts` | 47 | 7 | 7 | 0 | 0 | 4 (`design.md:116`, `:164`, `tasks.md:209`, `:218`: la rama `ovAdicional` vive en `:88`, no en `:92`) |
| `migrate.ts` | 53 | 9 (+1) | 9 | 0 | 0 | 0 |
| `TicketDetailView.tsx` | 10 | 0 (las 8 de `:245` intactas) | 0 | 0 | 0 | 0 |

B (históricas, no se tocan): citas datadas de `docs/sdd/F0-00*`, `F0-01`, `F1A-05`, `Recomendaciones_R02`, `Respuestas_Gerencia_R03`, `Paquete_de_Despliegue_2026-09-27.md:314`, `Brecha_Maestro_R08.2_2026-09-17.md:143`, `config.yaml:579`/`:1067`/`:1119`. C (superadas, conservadas como registro): `remisiones/spec.md:34`/`:603` («tercera puerta abierta») y `tickets-core/spec.md:531`. Deriva PREVIA a este cambio, no reparada (no la causa esta tanda): `derivacion-avisos/spec.md:44`/`:194`/`:403` (`ticketService.ts:113`, `:127-165`). `transitions-st/spec.md` (viva): la tabla de RQ-TS-09 no tenía `ovAdicional` ni la clave `OV adicional` en la frase de las 27 etiquetas; se corrige en el DELTA (`specs/transitions-st/spec.md`, requisito MODIFIED RQ-TS-09 completo) que fusiona el archive; la spec viva NO se toca.

### 6.8 · Cierre

`npx vitest run` 150 ficheros / 1614 pruebas en verde (2 saltadas, integración); `npm run typecheck` limpio; `npx eslint . --max-warnings 165` 0 errores, 165 avisos (en el techo, ninguno nuevo); `npm run build` verde. Criterios de éxito de `proposal.md` (estado, sin re-implementar): 1 dos OV vigentes tras `Aprobación` — cubierto (3.9); 2 `409` en las tres puertas y rojo en la base — cubierto (1.1, 2.9, 2.16, 2.18); 3 liberar: fila conservada, reasociable, sólo Comercial — cubierto en servidor (1.7, 1.8, 5.11-5.17), la pantalla queda para P.3; 4 cuarentena fuera del desplegable y del saldo, en la lista — cubierto (4.x, 5.x); 5 saldo correcto — cubierto (5.1, ahora `consumido`); 6 `remisiones.test.ts:988` y `ordenVentaUnTicket.test.ts` — verdes sin tocar sus casos.

### Mutaciones (revertidas, `cmp` idéntico, copias con nombre de ruta completa)

| | Mutación | Rojo |
|---|---|---|
| M1 | la ruta del saldo devuelve `ejecutado` en vez de `consumido` | `ovAsociaciones.test.ts` › `saldo devuelve saldoPorLote`: `expected { lote: 'OV-2026-170', …(4) } to deeply equal …` |
| M2 (regla 2) | `cfOvAdicional('Fecha Orden De Venta')` en `transitions.ts:199` | 3 rojos: el guardián del lote 4 (`campoFecha "Fecha Orden De Venta" → fecha_orden_venta`), el guardián nuevo (`expected [ 'Fecha Orden De Venta' ] to deeply equal []`) y `4.0a` (`expected '2026-07-15' to be '2026-06-10'`) |

### Desviaciones

1. La consulta 5 va DESPUÉS del `ROLLBACK` final (se pidió «al final»); su cabecera lo dice y recomienda envolverla. 2. El hallazgo de 8 citas EN `:245` corrige la premisa de `tasks.md`/`design.md` («0 vivas»). 3. `design.md`/`tasks.md` decían `transitionExec.ts:92` para la rama `ovAdicional`; era `:88` desde el lote 3. 4. Ninguna pantalla probada por máquina: P.3 (verificación manual en la app) sigue de Comercial.

### Status

Lote 6 completo: 6.0a, 6.0b y 6.1-6.8. Todas las tareas del cambio completas (salvo las tareas de persona P.1-P.4, fuera del recuento). Siguiente: `sdd-verify`.

## Remediación del verify

RED capturado antes de tocar producción (`routes/ovAsociaciones.test.ts`): puertas 1/2/3 → `expected 409 to be 201/200/201` con `La orden de venta OV-2026-300 ya está asociada al ticket #8001`; buscador → `expected [] to deeply equal [ 'soX' ]`; estructurales → `actual value must be number or bigint, received "undefined"` (no había cliente de transacción); carrera → `expected 500 to be 409` (`Error interno`); unitaria de `asociarOV` → `Right-hand side of 'instanceof' is not an object`. GREEN: 45/45 y 11/11; suite completa 1622 verdes, typecheck, eslint (165 avisos, 0 errores) y build limpios.

- **R2.** `liberarAsociacion(q, …)` (`ovAsociaciones.ts`) hace tras el `UPDATE … RETURNING` un solo `UPDATE tickets` con `CASE` (pg-mem lo acepta). Cada columna se limpia sólo si contiene esa OV; `fecha_orden_venta` va con `orden_venta` (es la fecha de esa orden; si sólo casa `salesorder_id` no se toca). Siempre pone `ov_elegida_en_app_at`. `liberarAsociacionesDeTicket` no limpia: el ticket se borra. El caso «columnas con OTRA OV» queda intacto (prueba propia).
- **R3.** `OvYaAsociadaError` (409, `body.error`) sale de `asociarOV` ante `23505`; `app.ts:79` lo responde junto a `HttpError`. **Mensaje: «La orden de venta X ya está asociada a otro ticket», SIN el número del ticket**: tras un `23505` la transacción real de Postgres queda abortada y la consulta que lo buscaría fallaría; SAVEPOINT no se probó (hipótesis: pg-mem no lo garantiza) y se descartó por complejidad. La carrera se simula inyectando un INSERT rival justo antes del de la remisión.
- **R4.** `remision.ts:239-243` (397 líneas) va en `enTransaccion(db, async (q) => { … })`: `UPDATE` y `asociarOV` con el mismo cliente. Lo probado es ESTRUCTURAL: un pool grabador registra (cliente, sql) y se afirma que ambas sentencias comparten cliente entre `BEGIN` (primera) y `COMMIT` (última). Lo mismo para liberar (`UPDATE ov_asociaciones` + `UPDATE tickets`). **La atomicidad en sí no es demostrable en pg-mem** (no honra ROLLBACK); sólo se prueba que comparten cliente entre BEGIN/COMMIT.
- **R5.** RQ-TS-18 corregido (la fecha de OC va a la asociación; `fecha_orden_compra_final` de `aprobacion` sigue en columna, vigente); RQ-TS-14 cita `ticketService.ts:148-152`; nota F1A-04 de RQ-TS-09 restaurada (`PROMOTED_COLUMNS` tiene 40 entradas, `rows.ts:85`, contadas).
- **R6 mutación.** `if (liberada)` → `if (liberada && false)`: 5 rojos (tres puertas `409`, buscador `[]`, estructural `/UPDATE tickets/`); revertido y `cmp` idéntico.
- **Desviación.** `appWith(overrides, dbPropia?)` (`testing/appHarness.ts`) admite un pool propio para el grabador.
