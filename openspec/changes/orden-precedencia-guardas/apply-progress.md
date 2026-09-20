# Apply progress — `orden-precedencia-guardas` (F1B-10)

**Fase:** `sdd-apply`, **Rebanadas 1 y 2 — COMPLETAS.**
**Worktree:** `C:\dev\Desk_2_R1.023-worktrees\f1b-10-r1`, rama `f1b-10-r1`.
**Commit R1** (el orden, Fases 1-6): `ccedf4f`, base `a756d74`.
**Commit R2** (contrato + registro, Fases 7-10): `cc6aa1d`, base `3f2bb7c` (apply-progress de R1).
**Ledger:** dos intentos (`gentle-ai sdd-attempt acquire`), uno por rebanada, cada uno con su propio
techo de 800. R1 gastó 182 líneas; R2 gasta 292. **Ningún `settle` se ejecutó** — lo hace el
orquestador.

---

## Rebanada 1 «el orden» — resumen (detalle completo en la revisión anterior de este documento)

Movió `ticketService.ts:43-49` (G4, OV ya usada) detrás de `:94` (última guarda de `createManagedTicket`)
y `:132-136` (OV de `executeTransition`) detrás de `:144` (última guarda de `executeTransition`).
Volteó `ticketService.test.ts:327`, `:336` y `:205` a `422`. Escribió N1 (rojo natural) y N2 (rojo por
mutación, G5↔G6). Reescribió tres comentarios y cuatro docblocks de prueba. Medición:
`git diff --shortstat --no-renames a756d74` → **182 líneas** (110 inserciones + 72 borrados, 2
ficheros). `npm test` 1134/1136, `typecheck` limpio, `lint` 0 errores.

---

## Rebanada 2 «contrato + registro» — Fases 7 a 10

### Fase 7 · Contrato de errores 404/422 (P3)

Fichero nuevo `apps/desk/server/contratoErrores.test.ts`, con **N3** y **N4**:

- **N3** — «el sujeto direccionado por la URL (id inexistente) responde 404, no 422». Nace VERDE.
- **N4** — «la entidad referenciada desde el cuerpo (derivado_a inexistente) responde 422, no 404».
  Nace VERDE.

**Cero cambios de producción**: confirmado con `git diff --stat apps/desk/server/services/ticketService.ts`
vacío tras revertir las dos mutaciones (ver evidencia de mutación más abajo).

### Fase 8 · Reparación documental P4

**5 afirmaciones vivas reparadas** (Caso C: texto original conservado, nota de cierre añadida):

- `openspec/specs/transitions-st/spec.md` — nota `✅ CERRADO por orden-precedencia-guardas (F1B-10)`
  insertada entre el bloque `⚠️ REASIGNADO` y el párrafo «Comportamiento actual», cubriendo las tres
  citas de la cabecera (heading §3.8, «no hay fila», «falta una fila en el plan»).
- `openspec/specs/tickets-core/spec.md` — misma nota de cierre, insertada antes de «Comportamiento
  actual» de §4.1, cubriendo las dos citas equivalentes.

**4 notas de Caso C añadidas** (texto original conservado, nota con qué lo cerró):

- `docs/sdd/F0-01_Correcciones_para_el_plan.md` — nota tras la propuesta de fila F1B-10 (§5.a).
- `docs/sdd/Puntos_para_Gerencia_2026-09-11.md` — dos notas: una tras la intro de «Entrada 5», otra
  tras el párrafo 5.a.
- `docs/sdd/Decisiones_Gerencia_2026-09-10.md` — nota en la fila 5 de la tabla de aprobación.

### Fase 9 · Barrido de citas de cierre

**18 sitios del inventario de `design.md` §6** — 16 reapuntados (Caso A), 2 ya anclados y verificados
sin tocar (Caso B: `config.yaml:524`, `:547`, IV-4 cerrado):

| Fichero | Cita vieja → nueva |
|---|---|
| `CLAUDE.md` | `:134`→`:148` (IV-11) · `:50-78`→`:43-77` (parcial) · `:65-77`→`:59-71` y `:65-83`→`:59-77` (IV-8) |
| `openspec/config.yaml` | `:134`→`:148` (×2, IV-11) · `:45-49`→`:94-98` · `:65-77`→`:59-71` · `:65-83`→`:59-77` |
| `openspec/specs/transitions-st/spec.md` | `:140-144`→`:136-140` (RQ-TS-12) |
| `openspec/specs/tickets-core/spec.md` | `:43-49`→`:94-98` · `:43-44`→`:89-93` · `:45-48`→`:94-97` · `:134-135`→`:148-149` (RQ-TC-08, §4.2) |
| `openspec/specs/remisiones/spec.md` | `:135`→`:149` · `:134-135`→`:148-149` |
| `apps/desk/server/ordenVentaUnTicket.test.ts` | `:45-49`→`:94-98` · `:132-136`→`:146-150` (`:25` NO tocada, ancla propia) |
| `DEPLOY.md` | `:141`→`:181` (semántica «copia a otras personas», no el mapa pre-reescritura) |

**Discrepancia medida contra el mapa de `design.md` §4**: dos reapuntados NO coinciden con lo que el
mapa pre-reescritura de comentarios sugería, y se resolvieron leyendo el fichero, no el mapa:

- RQ-TS-12 (`:140-144`) es `:136-140` hoy, no `:132-136` como estimaba el mapa — ese rango pertenece
  hoy al bloque de la OV, no al de la persona derivada.
- `DEPLOY.md:160` («copia a otras personas») es `:181` (la línea real de `conCopia: true`), no `:133`
  como estimaba el mapa — `:133` es hoy sólo el comentario de derivación, sin la semántica de copia.

**6 sitios ya falsos antes de esta tanda** (`tickets-core/spec.md:87,100,214,474,476,479`) — verificados
contra `60f03ae`: las seis citaban ya, antes de F1B-10, líneas ajenas al tema que describen (dentro del
bloque G5 en vez de `codigoServicio`/`marca-modelo-serial`/`obligatorios`). Registrados, no corregidos
(no es tarea de quien los encuentra).

**Registradas sin corregir** (`openspec/specs/permissions/spec.md:71,86,301,303`,
`apps/desk/server/permisos.test.ts:30,53`, `apps/desk/server/remisiones.test.ts:903`,
`apps/desk/server/transicionesEjecucion.test.ts:115`) — ya falsas antes de esta tanda, citan
`ticketService.ts:86-91` (posición pre-`9ed5635` del `403`) cuando la guarda vive hoy en `:127-129`.

**Barrido adicional, fuera del inventario de 18 — necesario para el criterio de 0 bloqueantes.** El
detector de `pre-push` corrido sobre el commit de R1 (`ccedf4f`) devolvía **15 citas bloqueantes**,
ninguna de ellas parte del inventario de 18 (son citas a `ticketService.test.ts`, no a
`ticketService.ts`, y a fragmentos de docblocks ya reescritos por R1). Se repararon las 15, cita a
cita, decidiendo ANCLAR o REAPUNTAR por lo que afirma la frase:

| Cita rota (descrita en prosa, no citada) | Sitios (nº) | Decisión | Detalle |
|---|---|---|---|
| línea 205 del fichero de pruebas del servicio | 6 (`design.md` ×2, `proposal.md` ×2, delta de `transitions-st` ×1, `tasks.md` ×1) | **ANCLAR** inline | Instrucciones/tablas que describen el árbol de partida; ancladas `en 60f03ae` (design/tasks) o `en ad65161` (proposal/delta) |
| líneas 82 a 110 del servicio | 2 (`design.md`, `transitions-st/spec.md`) | **DE-CITAR** | Cita de un docblock YA ERRÓNEO antes de esta tanda (rango nunca válido); reescrita en prosa sin forma ruta-línea (regla Q6) |
| líneas 302 a 314 del fichero de pruebas | 2 (`design.md`, `tickets-core/spec.md`) | 1 de-citada (quotation), 1 anclada `en 60f03ae` (afirmación histórica real) | |
| línea 273 del fichero de pruebas del servicio | 2 (delta de `tickets-core`, spec viva) | 1 ancla `en ad65161` (delta), 1 reapunta a la línea 278 (spec viva, hecho vigente) | |
| líneas 277 a 287 del fichero de pruebas | 1 | ANCLAR `en 60f03ae` | |
| líneas 154 a 177 del servicio | 1 | REAPUNTAR a las líneas 160 a 183 | Hecho vigente (avisos por correo), no tocado por el movimiento de guardas, sólo desplazado |
| el nombre abreviado del plan de fases (con puntos suspensivos), línea 367 | 1 (`design.md`) | DE-CITAR | Falso positivo del detector por los puntos suspensivos (Q6); reescrito en prosa, sin ancla (veto de Gerencia sobre ese fichero) |

**Dos roturas colaterales de mis propias ediciones, cazadas por el detector y reparadas en el mismo
commit** (ejemplo vivo de la regla de mutación 4): `exploration.md` citaba, con la forma abreviada de
ruta, las líneas 373 a 375 de `tickets-core/spec.md` — desplazadas por mi propia nota de cierre de la
Fase 8; reapuntadas a las líneas 380 a 382 de ese mismo fichero, con la ruta completa (la abreviada
resultaba ambigua entre las seis copias del módulo que existen en el repositorio). Y una mención en
prosa de este mismo `tasks.md` citaba, con forma de cita real, la línea 205 del fichero de pruebas
como ejemplo de las seis citas repetidas de la tabla de arriba —el propio ejemplo se leía como cita
real y bloqueaba—; reescrita sin forma de cita, como se hizo en la tabla de arriba de este documento.

### Fase 10 · Verificación final

```
npm test
 Test Files  122 passed | 1 skipped (123)
      Tests  1136 passed | 2 skipped (1138)

npm run typecheck   → limpio, sin salida

npm run lint         → 0 errores, 158 warnings preexistentes (mismo recuento que R1; ninguno en
                        ficheros tocados por esta tanda)
```

**Detector de citas** (`npx tsx apps/desk/server/citas/cli.ts --sha cc6aa1d`), salida final:

```
citas · cc6aa1d · cc6aa1d
  comprobadas ............ 2025
  saltadas ............... 2407
  fuera del repositorio .. 2
  abreviadas rotas ....... 20   (informativas: no bloquean)
  no son citas ........... 7
  texto que git cree binario .. 0
  índice remoto .......... origin/main
  línea base ............. 0 informadas · 0 caducadas
```

Sin sección «Bloqueantes». **Exit code 0.** Las 20 abreviadas rotas son informativas (no bloquean); la
mayoría son preexistentes a esta tanda y ajenas a su alcance (`transitions.ts`, `permissions.ts`,
`catalogo.ts`, `app.ts`); tres son abreviadas del propio `design.md` §6.2 (`:474`, `:476` hacia
`tickets-core/spec.md`, `:303` hacia `CLAUDE.md`) que quedaron desfasadas por mi propia edición de
Fase 8/9 y no se persiguieron por no ser bloqueantes — quedan registradas aquí para quien continúe.

## Evidencia de mutación (N3, N4)

| Comprobación | Nace | Mutación aplicada | Resultado | Reversión |
|---|---|---|---|---|
| **N3** | VERDE | `ticketService.ts:123` — `HttpError(404, ...)` → `HttpError(422, ...)` | El `it` de N3 se puso ROJO (esperaba `404`, recibió `422`); **colateral esperado, por la misma guarda**: `ticketService.test.ts` — «ticket inexistente gana al área ajena: 404, no 403» y «un ticket que no existe es 404» también se pusieron rojas | `git diff --stat` vacío tras revertir con un segundo `Edit` al texto exacto anterior |
| **N4** | VERDE | `ticketService.ts:139` — `HttpError(422, ...)` → `HttpError(404, ...)` | El `it` de N4 se puso ROJO; **colateral esperado**: dos pruebas de `ticketService.test.ts` sobre la misma guarda de derivación también rojas | `git diff --stat` vacío tras revertir |

Confirmado tras cada reversión: `npx vitest run apps/desk/server/contratoErrores.test.ts
apps/desk/server/services/ticketService.test.ts` → 38/38 passed.

## Medición del ledger — R2

```
git diff --shortstat --no-renames 3f2bb7c
 17 files changed, 214 insertions(+), 78 deletions(-)
```

**292 líneas** (R2 sola). Sin ficheros nuevos sin trackear (`contratoErrores.test.ts` va incluido en
las 17 tocadas, `git status --porcelain` vacío tras el commit). **Total R1+R2: 474 líneas**, contra el
disparador de 500 de `proposal.md` §7 (no se dispara un tercer corte) y muy por debajo del techo de 800
del intento de R2 (que abre su propia generación de ledger).

## Deviations from Design

Ninguna en el código o las pruebas. En el barrido, **dos** reapuntados se apartaron del mapa de
renumeración pre-reescritura de `design.md` §4 (RQ-TS-12 y `DEPLOY.md:160`, ver tabla de la Fase 9) —
consecuencia esperada y advertida por el propio `design.md`: «el número final se lee del fichero,
nunca del mapa». Y el barrido de cierre creció de 18 a 18+15 sitios: los 15 no estaban en el inventario
de `design.md` §6 porque son citas a `ticketService.test.ts` (no a `ticketService.ts`) y a
fragmentos de docblocks ya reescritos por R1 — el criterio de aceptación duro (detector en 0
bloqueantes) los exigía igual.

## Issues Found

- Las 6 citas de `tickets-core/spec.md` (`:87,100,214,474,476,479`) ya eran falsas antes de esta
  tanda; no se corrigen (no es tarea de quien las encuentra).
- 20 abreviadas rotas quedan (informativas, no bloquean); 3 de ellas nuevas por mi propia edición de
  Fase 8/9 (`design.md` §6.2), registradas arriba.

## Remaining Tasks

Ninguna de `sdd-apply`. Pendiente de fases posteriores:

- `sdd-verify` sobre esta rebanada.
- `sdd-archive` — fusión de los deltas `transitions-st`/`tickets-core` en `openspec/specs/` (RQ-TS-06,
  §3.4, §3.8; RQ-TC-05, §4.1, RQ-TC-13). Los apuntes «✅ CERRADO por F1B-10» que esta tanda añadió a
  las secciones «Comportamiento actual» quedan como puente hasta que el `archive` sustituya esas
  secciones por el `SHALL` normativo definitivo.
- Los tres puntos abiertos de `proposal.md` §12 (dueño Gerencia, sin destino inventado).

## Workload / PR Boundary

- Mode: chained PR slice (stacked-to-main), Rebanada 2 de 2 — última.
- Current work unit: «Rebanada 2 · contrato + registro» (Fases 7-10).
- Boundary: empieza en `3f2bb7c` (R1 cerrada) y termina en `cc6aa1d`. Incluye el contrato de errores,
  la reparación documental P4 y el barrido completo de citas (18 del inventario + 15 del detector).
- Estimated review budget impact: 292 líneas de R2, 474 del cambio completo.
