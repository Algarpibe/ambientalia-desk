# Archive Report — `alta-equipo-nuevo-en-ticket` (F1B-14, primer cambio)

**Fecha de archivo**: 2026-09-24 · **Apply**: `33d4107` · **Verify**: `a865ad3`
**Archivado a**: `openspec/changes/archive/2026-09-24-alta-equipo-nuevo-en-ticket/`

## Cobertura de F1B-14 (R-1)

Este cambio construye el **alta de ticket con equipo nuevo**: `clasificaciones = 'Equipo nuevo'` crea o
reutiliza el equipo del catálogo en el mismo paso, de forma atómica con el `INSERT` del ticket
(RQ-TC-15, RQ-TC-16). **Queda fuera** — es el segundo cambio de la fila, `edicion-comercial-equipo`,
`cierra: si` —: la restricción por área del `PATCH` de los 6 campos comerciales, el registro de
cambios de esos 6 campos, y el botón «Editar» en la hoja de vida. `cierra: no` en este cambio es
correcto: la fila F1B-14 no termina hasta que el segundo cambio cierre.

## Estado final (autoridad: launch prompt + verify-report a865ad3, supera apply-progress.md)

- **Verify**: PASS WITH WARNINGS · 0 CRITICAL · 0 blockers · 4/4 requisitos · 12/12 escenarios
- **Tests**: 1345 passed / 0 failed / 2 skipped (preexistentes, ajenos), 138 ficheros — medidos por
  `sdd-verify` en `a865ad3`; no se re-ejecutan aquí porque `sdd-archive` sólo tocó `openspec/specs/**`
  (markdown), ningún fichero de código
- **Build**: `npm run typecheck` exit 0 · **Lint**: exit 0, 165 avisos preexistentes
- **Ledger**: `apply` settled passed (changed_lines 555) · `verify` settled passed
- **Tareas**: 40/40 completas, 0 sin marcar (`tasks.md` archivado, verificado antes de mover)

## Fusión de especificaciones — `tickets-core` (única capacidad con delta)

Fusión **por ID**, precedente `orden-precedencia-guardas` (`openspec/changes/archive/2026-09-21-orden-precedencia-guardas`): cabeceras `### Requirement: RQ-TC-0x` del delta casan con `### RQ-TC-0x`
de la spec viva; el prefijo `Requirement: ` se retira al fusionar.

| Requisito | Acción | Detalle |
|---|---|---|
| RQ-TC-04 | MODIFIED | Excepción por `clasificaciones = 'Equipo nuevo'`; cita reparada a `ticketService.ts:23-27` |
| RQ-TC-05 | MODIFIED | Subtabla de las dos guardas nuevas de la rama «Equipo nuevo»; las 7 citas de la tabla de guardas reparadas contra HEAD (`:23-24` … `:96-100`) |
| RQ-TC-15 | ADDED | Alta con «Equipo nuevo»: creación o reutilización por serial normalizado — insertado tras RQ-TC-06 |
| RQ-TC-16 | ADDED | Atomicidad del alta del equipo con el `INSERT` del ticket — insertado tras RQ-TC-15 |

Cabecera de la spec actualizada: **14→16** requisitos, tanda F1B-14 añadida a «Tandas que la tocan».
`hojas-vida`: **sin delta** en este cambio — ver W2 más abajo.

**Delta cost** (`git diff --numstat` sobre `openspec/specs/`): tickets-core +130/-30 · remisiones +3/-3
· transitions-st +34/-32. **Total merge: +167/-65** insertions/deletions.

## Reparación de citas a `ticketService.ts` (regla de mutación 4, casos A/B)

Método: para cada cita, `git show 817eba3:apps/desk/server/services/ticketService.ts` (estado
INMEDIATAMENTE antes de este cambio) contra el árbol de hoy, comprobando lo que la frase AFIRMA, los
dos extremos del rango por separado. `817eba3` = docs previos al commit de código `33d4107`.

**Desplazamiento no uniforme, confirmado línea a línea**: `:1-17` sin cambio · `:18-23` +1 (import
nuevo) · `:24` en adelante +2 (rama «Equipo nuevo» inserta 2 líneas netas) · el comentario del
escalón D (antiguo `:89-93`) se **reescribió de 5 a 4 líneas** (contenido distinto, no sólo desplazado)
· `createTicket(` → `crearTicketConEquipo(` en `:101`(antes)/`:103`(hoy).

### Caso A — reapuntadas a la línea de hoy (23 citas, en 3 ficheros)

`tickets-core/spec.md`: `:94-98→:96-100` (RQ-TC-08), `:30-34,:41→:32-36,:43` (RQ-TC-08), `:27,:39→:29,:41`
y `:97→:99` (RQ-TC-13), `:37→:39` y `:39→:41` (RQ-TC-13 prosa), `:97→:99` (§4.1), `:94-97→:96-99` y
`:148-149→:150-151` (§4.2) — más las 7 de la tabla de RQ-TC-05 (incluidas en la fusión del delta).

`remisiones/spec.md`: `:22-25→:23-27` (RQ-RE-15), `:149→:151` y `:148-149→:150-151` (RQ-RE-16).

`transitions-st/spec.md` (la más densa — `executeTransition` completo se desplazó +2): `:112-221→
:114-223` (**el `services/ticketService.ts:112-221` que `verify-report` marcó como WARNING** — hoy
`executeTransition` empieza en `:114`), la tabla de 8 guardas de RQ-TS-06 completa, `:132→:134` (×2,
RQ-TS-08), `:136-140→:138-142` (RQ-TS-12), la tabla de escalones A/B/C/D §3.8 completa (10 citas),
`:130-132→:132-134` y `:146-150→:148-152` (§3.8 nota estructural), `:160-183→:162-185` (§3.10),
`:146-150→:148-152` (§3.4, fila `habilitar_servicio`).

**Hallazgo al verificar, corregido más allá del estricto alcance**: `RQ-TS-11` citaba
`ticketService.ts:145` para «el actor cae a `TRANSITION_ACTOR`» — comprobado contra `817eba3`, esa
cita YA apuntaba a una línea de comentario, no a `const actor = …`, es decir **ya estaba rota antes de
este cambio**. Se corrigió a `:153` (línea real de hoy) en vez de dejarla o renumerarla a ciegas,
porque mi primer intento de repararla por desplazamiento (`:147`) introducía un error nuevo peor que el
que había. Declarado aquí por la regla de método.

### Caso B — ancladas a `817eba3` porque el contenido cambió, no sólo la línea (1 cita)

`tickets-core/spec.md` RQ-TC-08: «el buscador ya sólo ofrece las libres, "pero una lista no es una
frontera"» citaba `ticketService.ts:89-93`. Ese comentario se **reescribió** en este mismo cambio (Fase
5.2, desviación de diseño declarada en `tasks.md`) y la frase citada literalmente **ya no está** en el
código — el comentario de hoy (`:92-95`) sigue documentando el escalón D pero con otras palabras.
Anclada a `817eba3` con nota explícita; no se reescribe el requisito (eso es cambiar comportamiento
documentado, no reparar una cita).

## Citas rotas preexistentes — encontradas, NO tocadas (no las desplazó este cambio)

Comprobadas contra `817eba3` y ya inválidas ahí — anteriores a este cambio, fuera de su alcance:

- `tickets-core/spec.md:87` (`:61-62`, RQ-TC-03), `:339` (`:56`, RQ-TC-10), `:388` (`:94` abreviada,
  RQ-TC-13 «guarda posterior»), `:396` (`:87-92` en la misma frase donde sólo `:37` era reparable)
- `remisiones/spec.md:108` (`:53-58`)
- `permissions/spec.md`: `:71`,`:86`,`:301`,`:303` (`:89`,`:90`,`:89-91`,`:86-88` — citan el 403 de
  `executeTransition` con numeración de `createManagedTicket`, nunca coincidió)
- `derivacion-avisos/spec.md`: `:44`,`:168`,`:179`,`:181`,`:185`,`:197`,`:204`,`:208`,`:212`,`:229`,
  `:232`,`:265`,`:324`,`:333` (patrón sistemático: `:113`/`:115-122`/`:119-121`/`:123-125`/`:141`
  citan bloques de `createManagedTicket`, no de `executeTransition`, en requisitos que sí hablan de
  `executeTransition`)
- `transitions-st/spec.md:370,372,374,377,383` (RQ-TS-13, mismo patrón sistemático) — `:624` (`:45-49`
  /`:94`, nota "movida"; ambigua, no se reclasifica sin más evidencia) — `:973` (tabla D-1, mismo `:145`)
- `trazas/spec.md:49,410,413,471` (mismo patrón)

Las tablas «Las tres fuentes, enfrentadas» (§0) y «Discrepancias» (§5.1/§5.2, D-x/M-x) de
`tickets-core`, `permissions` y `transitions-st` quedan **fuera de este barrido a propósito**: sus
cabeceras de columna anclan explícitamente a `ad1875b`, así que ya son Caso B por estructura — no
afirman el presente y renumerarlas sería el error que la regla de mutación 4 previene.

`openspec/config.yaml`: comprobado, sin citas pendientes — las que este cambio desplazaba (IV-8 en
`:41`, equipo↔cliente en `:61-79`, OV en `:96-100`/`:150`) ya estaban reparadas por `sdd-apply`;
el resto (`:132`/`:134`, `:89`, `:45-48`/`:134-135`) es preexistente y ajeno a este cambio. No se tocó
el fichero.

## Verificación mecánica

**Movimiento**: `git mv openspec/changes/alta-equipo-nuevo-en-ticket
openspec/changes/archive/2026-09-24-alta-equipo-nuevo-en-ticket` — snapshot recursivo previo al
movimiento, `diff -r` contra el snapshot: **salida vacía, exit 0** (única evidencia de paso).

**Medida del movimiento** (`git diff --cached --numstat --no-renames -- openspec/changes/`): **14
ficheros, +1170/-1170** — el "cuenta doble" de la regla del ciclo 2 de `CLAUDE.md`: 7 ficheros
borrados de la ruta vieja + los mismos 7 insertados en la nueva, 1170 líneas cada lado
(`wc -l` de los 7 ficheros archivados: 242+181+114+98+236+120+179 = 1170). Cero bytes de contenido
alterados — el `diff -r` ya lo probó.

## Los 3 WARNING del verify-report y su destino

1. **W1 — `transitions-st/spec.md:185` citaba `ticketService.ts:112-221`.** Reparado en este archive a
   `:114-223` (ver Caso A arriba).
2. **W2 — `proposal.md` declara `hojas-vida` como capacidad modificada, sin delta `specs/hojas-vida/`
   en la carpeta.** Supuesto razonable y reversible (regla de ejecución, no cambia alcance de fila ni
   cuesta nada ni toca producción ni contradice decisión registrada): la actualización de
   `hojas-vida/spec.md` — incluida la nueva vía de escritura desde `POST /api/tickets` — la lleva el
   **segundo cambio**, `edicion-comercial-equipo` (`exploration.md:109` de este mismo cambio ya se lo
   asigna, apuntando a `hojas-vida/spec.md:180-181`). El `proposal.md` archivado no se reescribe — es
   auditoría, y la discrepancia queda documentada aquí, no enmendada en el artefacto histórico.
3. **W3 — RQ-TC-15 más amplia que sus escenarios para equipo reutilizado con `clientId` NULL.**
   Comportamiento preexistente (la guarda equipo↔cliente, rama `(iii)` de `ticketService.ts:65-69`,
   deja ese ~3,4 % fuera a propósito desde antes de este cambio). Se deja anotado en el propio
   `verify-report.md` archivado; no es defecto introducido por esta tanda y no se corrige aquí.

## Trazabilidad Engram

`sdd/alta-equipo-nuevo-en-ticket/proposal` obs. #1034 · `/spec` obs. #1035 · `/design` obs. #1036 ·
`/tasks` obs. #1037 · `/verify-report` obs. #1040 · este informe: `sdd/alta-equipo-nuevo-en-ticket/archive-report`.

## Ciclo SDD completo

Propuesta → spec → diseño → tareas → aplicar → verificar → archivar. F1B-14 sigue abierta
(`cierra: no`): pendiente el segundo cambio, `edicion-comercial-equipo`.
