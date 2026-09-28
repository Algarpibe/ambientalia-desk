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
