# Tasks — `orden-precedencia-guardas` (F1B-10)

**Fase:** `sdd-tasks` · **Árbol:** `60f03ae` (limpio) · **Entradas:** `proposal.md`, `design.md`,
`specs/transitions-st/spec.md`, `specs/tickets-core/spec.md` de esta misma carpeta.

## Review Workload Forecast

| Campo | Valor |
|---|---|
| Líneas estimadas (`sdd-apply`) | ≈666, recalculado sobre el inventario REAL de 20 sitios de `design.md` §6 (2 los resuelve el delta, 18 quedan para el barrido de `apply`) — no las ~80 que estimaba `proposal.md` antes de medir |
| Riesgo de presupuesto (techo 800) | **Alto** — 134 de margen, con el informe `apply-progress` como sumando obligatorio |
| PRs/commits encadenados recomendados | Sí — 2 rebanadas, ya decididas en `proposal.md` §7 |
| Corte sugerido | Rebanada 1 «el orden» → Rebanada 2 «contrato de errores + registro» |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main — son DOS COMMITS SECUENCIALES DEL MISMO CAMBIO, no dos PRs independientes (`CLAUDE.md`, regla del ciclo 2: «una rebanada son dos intentos del ledger y dos commits del mismo cambio, no dos ciclos SDD») |

```text
Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High
```

**Disparador ya fijado, no se re-decide** (`proposal.md` §7): antes de escribir el `apply-progress`,
medir en worktree aislado `git diff --shortstat --no-renames` contra el commit de partida + `wc -l` de
lo nuevo sin trackear. Con la estimación ya sobre 500, el corte en dos rebanadas se da por hecho, no
por confirmar.

**Riesgo de presupuesto → decisión de Gerencia, no de esta fase** (`ask-on-risk`): el orquestador
pregunta antes de lanzar `sdd-apply` si acepta el corte en dos rebanadas de abajo, o exige otra forma
de entrega. Este documento no decide por Gerencia.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 · Rebanada «el orden» | Mover G4 y el `409` de `executeTransition`; voltear `:327`, `:336`, `:205`; escribir N1 y N2; reescribir 3 comentarios + 4 docblocks de prueba | Commit 1 | `npx vitest run apps/desk/server/services/ticketService.test.ts` | `npm test` contra el Postgres de pruebas (mismo arnés que hoy, sin credenciales Zoho) | `git revert` del commit devuelve `:45-49` y `:132-136` a su sitio y `:327`/`:336`/`:205` a `409`; sin migración ni estado persistido (`proposal.md` §11) |
| 2 · Rebanada «contrato + registro» | Crear `contratoErrores.test.ts` (N3, N4); reparar P4 (afirmaciones vivas + notas Caso C); barrido de las 18 citas de cierre pendientes | Commit 2 (depende del 1 sólo para los números finales del barrido) | `npx vitest run apps/desk/server/contratoErrores.test.ts` | N/A — P3 no toca producción; las mutaciones de N3/N4 son temporales y se revierten en el mismo paso (`design.md` §5.2.3) | Revertir el commit: fichero nuevo + reparaciones documentales, sin dependencia de estado ni migración |

---

## Phase 1 · RED natural — N1 (equipo↔cliente gana a la OV ya usada)

- [x] 1.1 Escribir N1 en `ticketService.test.ts`: `equipoConCliente('eq-1','cli-A')`, cuerpo con
  `clientId:'cli-B'` y `ordenVenta:'OV-DUP'` ya usada; se espera `422` con el mensaje de `:82`.
  RQ: `tickets-core` Scenario «La discrepancia equipo↔cliente gana a la orden de venta ya usada».
- [x] 1.2 Correr la suite y confirmar rojo NATURAL de N1 (hoy responde `409`), sin tocar producción.
  Registrar el nombre del `it` en el `apply-progress`.

## Phase 2 · GREEN — bajar G4 detrás de G7 (alta de ticket) — Rebanada 1

- [x] 2.1 Mover el bloque `ticketService.ts:43-49` COMPLETO (comentario `:43-44` + `const enUso` de
  `:45` + las 5 líneas ejecutables) detrás de `:94`, antes de `:95`. RQ: `tickets-core` RQ-TC-05.
- [x] 2.2 Reescribir el comentario del bloque G4: declarar el escalón D y su posición (última guarda
  antes de `createTicket`, `:97`), no la anécdota del buscador de OV.
- [x] 2.3 Reescribir el comentario `:50-64` de G5: conservar razón (a) — la rama (i) rellena
  `clientId` antes de `:88` —; retirar razón (b) («no es esta tanda», caduca: ésta ES la tanda);
  remitir a `tickets-core` RQ-TC-05/RQ-TC-13, no repetir la posición en prosa (molde H3, `CLAUDE.md`).
- [x] 2.4 Correr la suite y confirmar N1 en VERDE.

## Phase 3 · Voltear las dos pruebas del error doble en el alta — Rebanada 1

- [x] 3.1 `ticketService.test.ts:327` → `422` + `r.body.error` =
  `'Faltan campos obligatorios: cliente, tipo de servicio, clasificaciones, prefijo'` (el montaje ya
  usa `equipo()` sin `client_id` y un cuerpo sin obligatorios). RQ: `tickets-core` RQ-TC-05, Scenario
  «La orden de venta ya usada deja de ganar a los obligatorios que faltan».
- [x] 3.2 `ticketService.test.ts:336` → `422` + **aserción de texto NUEVA y obligatoria**
  `r.body.error` = `'Cliente no encontrado'` (hoy sólo lleva `toBe(409)` sin texto; un `toBe(422)`
  pelado no distingue cuál de las tres guardas del escalón C ganó — regla de mutación 1). RQ:
  RQ-TC-05, Scenario «La orden de venta ya usada deja de ganar al cliente no encontrado».

## Phase 4 · N2 — G5 vs G6, nace verde, rojo por mutación — Rebanada 1

- [x] 4.1 Escribir N2 en `ticketService.test.ts`: sin `clientId` en el cuerpo, equipo con `client_id`
  válido, demás obligatorios vacíos → `422` listando los que faltan SIN «cliente» entre ellos. Nace
  VERDE. RQ: `tickets-core` Scenario «Dentro del escalón C, la discrepancia equipo↔cliente se
  resuelve antes de contar los obligatorios».
- [x] 4.2 Mutación: mover temporalmente `:65-83` detrás de `:92`; correr la suite; confirmar que el
  `it` de N2 (y no otro) se pone rojo; revertir con `git diff`. Registrar en `apply-progress`: nombre
  del `it`, mutación aplicada, diff de reversión.

## Phase 5 · GREEN — bajar el `409` de `executeTransition` — Rebanada 1

- [x] 5.1 Mover el bloque ejecutable `ticketService.ts:132-136` (con la `const nuevaOrdenVenta` de
  `:132` incluida) y su comentario `:129-131`, detrás de `:140-144`, antes de `:145`. RQ:
  `transitions-st` RQ-TS-06.
- [x] 5.2 Reescribir el comentario `:129-131`: declarar el escalón D y el paralelo con `createTicket`
  (`:97`), no la anécdota de «la segunda puerta».
- [x] 5.3 `ticketService.test.ts:205` → `422`, cambiando la FORMA del cuerpo a `r.body.errors` =
  `['La persona a la que se deriva no existe o está dada de baja']` (NO `r.body.error`; la guarda de
  derivación lanza `{ errors: [...] }`, forma ya visible en `:224`).

## Phase 6 · Docblocks del fichero de pruebas — Rebanada 1

- [x] 6.1 Reescribir `ticketService.test.ts:127-142`: retirar el rango falso `:82-110` y la nota «422
  antes que 409 es una rareza»; declararlo consecuencia del orden total.
- [x] 6.2 Reescribir `:172-193` (incluye la reparación P4 de `:186-192`, que hoy dice «la precedencia
  NO está decidida… es una fila que falta»): tras la tanda ya no se contradice con `:327`.
- [x] 6.3 Reescribir `:302-314` y `:321-326`: el rango `:22-94` sigue acertando por casualidad, pero
  lo que el bloque AFIRMA deja de ser cierto; se reescribe por lo que afirma, no porque la línea
  exista.

## Phase 7 · Contrato de errores 404/422 (P3) — Rebanada 2

- [ ] 7.1 Crear `apps/desk/server/contratoErrores.test.ts` (convención de nombres de
  `ordenVentaUnTicket.test.ts`, `transicionesEjecucion.test.ts`).
- [ ] 7.2 Escribir N3: `id` de ruta inexistente en `executeTransition` → `404`. Nace VERDE. Mutación:
  cambiar ese `404` (`:119`) por `422`, correr, confirmar rojo del `it` NUEVO (no sólo `:149`, que
  también se pone rojo con la misma mutación), revertir. RQ: `transitions-st` Scenario «El sujeto
  direccionado por la URL responde 404…».
- [ ] 7.3 Escribir N4: `id` de ruta existente, `derivado_a` inexistente → `422`. Nace VERDE. Mutación:
  cambiar ese `422` (`:143`) por `404`, correr, confirmar rojo del `it` NUEVO, revertir. RQ: mismo
  Scenario, segunda mitad.
- [ ] 7.4 Confirmar que P3 no cambió ningún código, texto ni guarda de producción en `ticketService.ts`
  ni en `remision.ts`.

## Phase 8 · Reparación documental P4 (afirmaciones vivas + Caso C) — Rebanada 2

- [ ] 8.1 Reparar las 5 afirmaciones vivas restantes de P4 (`proposal.md` §5.7), conservando el texto
  y añadiendo qué lo cierra: `openspec/specs/transitions-st/spec.md:675`, `:679-680`, `:685` y
  `openspec/specs/tickets-core/spec.md:358`, `:366`.
- [ ] 8.2 Añadir las 4 notas de Caso C, conservando el texto original: `docs/sdd/F0-01_Correcciones_
  para_el_plan.md:243`, `docs/sdd/Puntos_para_Gerencia_2026-09-11.md:366`, `:369`, `:373`,
  `docs/sdd/Decisiones_Gerencia_2026-09-10.md:598`.

## Phase 9 · Barrido de citas de cierre — 18 sitios pendientes de `ticketService.ts` — Rebanada 2

**Método obligatorio** (`design.md` §6, `proposal.md` §8.2): `grep -rnoE
"ticketService\.ts:[0-9]+(-[0-9]+)?"` sobre el repositorio + **segundo pase** para la forma abreviada
(sin nombre de fichero) en los ficheros que ya citan el módulo; comprobar los DOS extremos de cada
rango por separado; **leer qué afirma la frase**, no sólo que la línea exista; clasificar cada sitio
A/presente, B/histórico (ancla a su revisión) o C/superado. **El número final se lee del fichero
después de editar — nunca del mapa de renumeración de `design.md` §4**, porque los tres comentarios
reescritos (Fases 2, 5) alteran el conteo.

- [ ] 9.1 IV-11 — el más fácil de saltar porque no habla de precedencia (3 sitios): `CLAUDE.md:332`,
  `openspec/config.yaml:984` (`:134` → la línea de `ticketConOrdenVenta` en `executeTransition` tras
  el movimiento) y `openspec/config.yaml:987` (`:45-49`, reapuntar los DOS extremos).
- [ ] 9.2 IV-4 cerrado, Caso B — **NO renumerar**, anclar a su revisión: `openspec/config.yaml:455` y
  la forma ABREVIADA de `:478`.
- [ ] 9.3 G5 se desplaza −7: `openspec/config.yaml:721`, `:736` (`:65-77`/`:65-83`).
- [ ] 9.4 `CLAUDE.md:208` (sólo el paréntesis «hoy la guarda existe» es presente; el resto es
  histórico) y `CLAUDE.md:330` (`:65-83` reapunta; `:39` sin cambio).
- [ ] 9.5 `openspec/specs/transitions-st/spec.md:306` (RQ-TS-12, Caso A: `:140-144` sube a
  `:132-136`).
- [ ] 9.6 `openspec/specs/tickets-core/spec.md:181`, `:185`, `:401` (con forma abreviada) — Caso A;
  `:87`, `:100`, `:214`, `:474`, `:476`, `:479` — clasificar leyendo la frase, algunas ya falsas
  antes de esta tanda.
- [ ] 9.7 `openspec/specs/remisiones/spec.md:330` (⚠️ cita `:135`, NO `:134` — un `grep` anclado en
  `:134` no la caza) y `:342`.
- [ ] 9.8 `apps/desk/server/ordenVentaUnTicket.test.ts:19`, `:20` — Caso A. **NO tocar** `:25` (lleva
  ancla propia «en `b99d47a`», Caso B).
- [ ] 9.9 `DEPLOY.md:160` (`:141` sube a `:133`).
- [ ] 9.10 Documentos fechados — Caso B, **NO renumerar**, anclar a su fecha: `docs/sdd/*`,
  `docs/runbooks/*`, `docs/Manifesto/*`, `openspec/changes/F0-0*/`. **NO tocar**
  `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md` (veto de Gerencia, modificado en local).
- [ ] 9.11 Registrar SIN CORREGIR — ya falsas antes de esta tanda, corregirlas no es tarea de quien
  las encuentra: `openspec/specs/permissions/spec.md:71`, `:86`, `:301`, `:303`;
  `apps/desk/server/permisos.test.ts:30`, `:53`; `apps/desk/server/remisiones.test.ts:903`;
  `apps/desk/server/transicionesEjecucion.test.ts:115`.

## Phase 10 · Verificación final — Rebanada 2

- [ ] 10.1 `npm test` completo en verde, incluidas las 9 pruebas que quedan INTACTAS (`:144`, `:149`,
  `:154`, `:160`, `:166`, `:194`, `:218`, `:316`, `:343`) y `remisiones.test.ts:957`, ninguna tocada.
- [ ] 10.2 `npm run typecheck` en verde.
- [ ] 10.3 `npm run lint` en verde.
- [ ] 10.4 Cerrar el `apply-progress` con: evidencia de mutación+reversión de N2, N3 y N4 (nombre del
  `it`, mutación aplicada, `git diff` de la reversión); medida final de
  `git diff --shortstat --no-renames` + `wc -l` de lo nuevo sin trackear, contra el disparador de 500.

---

## No entra en `sdd-apply` — registrado, no ejecutado aquí

- **Fusión de los deltas** `transitions-st`/`tickets-core` en `openspec/specs/` (RQ-TS-06, §3.4, §3.8;
  RQ-TC-05, §4.1, RQ-TC-13): es trabajo de `sdd-archive`, no de `apply` (`design.md` §6.3 — la cabecera
  y los «(Previously: …)» de los deltas son Caso B anclado a `ad65161`; las tablas normativas pasan a
  Caso A sólo cuando `archive` las funda en `openspec/specs/`).
- **Reordenar el alta de remisión** (`remision.ts`): es IV-12, registrado y sin destino
  (`proposal.md` §12.3). No se toca en esta tanda.
- Los tres puntos abiertos de `proposal.md` §12 (agregar los dos errores en una respuesta, el literal
  duplicado, IV-12): dueño Gerencia, sin destino inventado. Archivar esta tanda no los da por hechos
  (regla del ciclo 1).

## Riesgos de dependencia entre fases

- Fases 3-6 dependen de que la Fase 2 (mover G4) esté hecha primero — voltear `:327`/`:336` antes del
  movimiento dejaría la prueba en rojo sin que el código la sostenga.
- La Rebanada 2 depende de la 1 SÓLO para los números finales del barrido (Fase 9); el resto (Fases
  7-8) es independiente y puede empezar en paralelo si el barrido se pospone a que la 1 esté commiteada.
- El barrido (Fase 9) es el punto de mayor riesgo de presupuesto: 18 sitios en al menos 10 ficheros,
  con dos pases por fichero (rango completo + forma abreviada). Subestimarlo ya costó un `reset` en
  este proyecto por el mismo patrón (informe de fase omitido del presupuesto).
