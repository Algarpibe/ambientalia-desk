# Tasks — `asociacion-ov-ticket` (F1B-11, cambio 2 de 3, `cierra: no`)

**Entradas:** `proposal.md`, `design.md`, `specs/{tickets-core,transitions-st,remisiones,zoho-sync}/spec.md`
de esta misma carpeta. `strict_tdd` activo: cada tarea de implementación va precedida de su prueba en
rojo. Todas las citas de este documento se releyeron contra el árbol de `5ad3d37` el 2026-09-28 (HEAD
actual); ninguna se había desplazado.

**Matriz de amenazas:** N/A (`design.md` §Matriz de amenazas) — sin enrutado, shell, subprocesos,
automatización de VCS/PR, clasificación de ejecutables ni integración de procesos. No hay tareas RED
de matriz de amenazas que añadir a las de escenario.

## Review Workload Forecast

| Campo | Valor |
|---|---|
| Líneas estimadas | ~3.430 (`design.md` §7, suma de los seis lotes: 570+580+500+590+700+490; incluye pruebas y `apply-progress.md`, no `verify-report`/`archive-report`) |
| Techo de esta sesión | **800 por lote** (`review_budget_lines`, no el 400 por defecto) — 6 lotes, ninguno por encima de 700 |
| Riesgo de presupuesto | **Alto** en conjunto (3.430 sobre un único PR); **Bajo/Medio por lote** (ninguno pasa de 700/800) |
| PRs/commits encadenados | Sí — seis lotes en serie, uno por commit, sobre el mismo árbol (regla del ciclo 2: una tanda SDD por árbol de trabajo) |
| Corte sugerido | Lote 1 → Lote 2 → Lote 3 → Lote 4 → Lote 5 → Lote 6, cada uno verificado antes del siguiente |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main — cada lote se commitea y se integra antes de abrir el siguiente; no hay rama tracker propia |

```text
Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High
```

(La etiqueta literal de la guarda dice «400-line»; el techo real de esta sesión es 800 por lote,
fijado por el orquestador — ver tabla de arriba. El riesgo es alto porque el TOTAL de los seis lotes
no cabría en un único PR, no porque un lote individual se pase del techo.)

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | Tabla `ov_asociaciones`, índices únicos parciales, `asociarOV`/`liberarAsociacion` | PR 1 | `npx vitest run packages/zoho-sync/src/db/ovAsociaciones.test.ts packages/zoho-sync/src/db/migrate.test.ts` | pg-mem (arnés actual, sin credenciales Zoho) | `git revert` del commit del lote; tabla nueva, nadie más la lee — puede quedarse vacía |
| 2 | Tercera vía en las tres puertas, escritores (alta, `habilitar_servicio`, remisión), exclusión en `soloLibres`, liberación al eliminar ticket | PR 2 | `npx vitest run packages/zoho-sync/src/db/repo.test.ts apps/desk/server/ordenVentaUnTicket.test.ts apps/desk/server/remisiones.test.ts apps/desk/server/db/eliminarTicket.test.ts packages/zoho-sync/src/books/repo.test.ts` | pg-mem + `appHarness` (mismo arnés que `remisiones.test.ts`) | `git revert`; las dos vías de columna siguen protegiendo el histórico sin esta tercera |
| 3 | `ovAdicional` en `Aprobación`/`Aprobación y S. Repuestos`, sin tocar la OV de entrada | PR 3 | `npx vitest run apps/desk/server/transitionExec.test.ts apps/desk/server/services/ticketService.test.ts` | `appHarness` | `git revert`; el campo nuevo es opcional (S-10), nada más lo consume |
| 4 | Clasificador de subOV, cuarentena en las tres puertas y en `soloLibres` | PR 4 | `npx vitest run packages/shared/src/subOV.test.ts apps/desk/server/services/ticketService.test.ts apps/desk/server/remisiones.test.ts packages/zoho-sync/src/books/repo.test.ts` | pg-mem + `appHarness` | `git revert`; sin este lote, una subOV se trata como OV ordinaria (comportamiento previo) |
| 5 | Saldo por lote, rutas de lectura/liberación (`routes/ovAsociaciones.ts`) | PR 5 | `npx vitest run packages/zoho-sync/src/books/subOV.test.ts apps/desk/server/routes/ovAsociaciones.test.ts` | `appHarness` | `git revert`; rutas nuevas, nada del resto del server las llama todavía |
| 6 | Interfaz (ficha, liberar, cuarentena, saldo), fila IV-11 de `CLAUDE.md`, adenda de `config.yaml`, barrido de citas | PR 6 | N/A — `apps/desk/src/**/*.tsx` fuera de la red de pruebas por decisión de Gerencia (F0-00, `vitest.config.ts:16-20`) | Verificación manual en `ambientalia-desk.ambientalia.cloud` tras el despliegue (P.3) | `git revert`; UI pura, sin dato nuevo en servidor |

Una tanda SDD por árbol de trabajo (regla del ciclo 2): los seis lotes van **en serie**, nunca en
paralelo. `verify`/`archive` son intentos aparte del ledger.

---

## Lote 1 · Tabla y unicidad

**Estimación:** código ~170 · pruebas ~300 · artefactos (`apply-progress.md`) ~100 · **total ~570**.
**Depende de:** — (primer lote).

**Ficheros muy citados que toca:**

| Fichero | Línea | Tipo |
|---|---|---|
| `packages/zoho-sync/src/db/schema.sql` | tras `:525` (fin de fichero hoy): `CREATE TABLE public.ov_asociaciones` + 3 índices | FINAL DE FICHERO |
| `packages/zoho-sync/src/db/migrate.ts` | `:73`: añade `'ov_asociaciones'` al final del array `PUBLIC_TABLES` | EN SU SITIO |

Módulo nuevo, sin cita previa: `packages/zoho-sync/src/db/ovAsociaciones.ts`.

- [x] 1.1 RED — `packages/zoho-sync/src/db/ovAsociaciones.test.ts` (nuevo): `asociarOV` crea una fila
  vigente; una segunda `asociarOV` con el mismo `numero`/`salesorderId` para otro ticket lanza `23505`.
  RQ: `tickets-core` RQ-TC-17, escenario «Segunda asociación vigente… rechazada por la base».
- [x] 1.2 Confirmar rojo natural (tabla/módulo inexistentes).
- [x] 1.3 GREEN — `schema.sql`, al final (tras `:525`): `CREATE TABLE IF NOT EXISTS public.ov_asociaciones (…)` +
  `idx_ov_asoc_numero_vigente` + `idx_ov_asoc_so_vigente` (ambos `WHERE liberada_at IS NULL`) +
  `idx_ov_asoc_ticket` (`design.md` §1, bloque SQL).
- [x] 1.4 GREEN — `migrate.ts:73` en su sitio: añadir `'ov_asociaciones'` al final del array `PUBLIC_TABLES`.
- [x] 1.5 GREEN — crear `ovAsociaciones.ts`: `asociarOV(q, {ticketId, numero, salesorderId, origen, actor, fechaOrdenCompra})`
  — `INSERT` idempotente (si ya hay vigente igual `numero`+`ticketId`, no-op); `listarAsociaciones(db, ticketId)`.
- [x] 1.6 Confirmar 1.1 en verde.
- [x] 1.7 RED — `ovAsociaciones.test.ts`: `liberarAsociacion` conserva la fila con fecha/persona/motivo
  de liberación y deja de contar como vigente. RQ-TC-19, escenario «Liberar conserva la fila con su motivo».
- [x] 1.8 RED — `ovAsociaciones.test.ts`: tras liberar, una `asociarOV` con el mismo `numero`/`salesorderId`
  a otro ticket NO lanza `23505`. RQ-TC-19, escenario «Tras liberar, la OV es reasociable».
- [x] 1.9 Confirmar 1.7/1.8 en rojo (`liberarAsociacion` no existe).
- [x] 1.10 GREEN — `ovAsociaciones.ts`: `liberarAsociacion(q, id, actor, motivo)` — `UPDATE ... SET
  liberada_at=now(), liberada_por=$2, motivo_liberacion=$3 WHERE id=$1 AND liberada_at IS NULL RETURNING *`;
  `liberarAsociacionesDeTicket(q, ticketId, motivo)` para el escritor de `eliminarTicket.ts` (lote 2).
- [x] 1.11 Confirmar 1.7/1.8 en verde.
- [x] 1.12 MUTACIÓN (regla 2, fichero vigilado) — ensuciar `schema.sql` quitando `WHERE liberada_at IS
  NULL` de `idx_ov_asoc_numero_vigente`; correr 1.8 y confirmar que se pone ROJA (sin el `WHERE`, el
  índice deja de discriminar por vigencia y la reasociación tras liberar vuelve a chocar); revertir;
  `git diff` limpio.
- [x] 1.13 Cierre del lote: `npx vitest run packages/zoho-sync/src/db/ovAsociaciones.test.ts
  packages/zoho-sync/src/db/migrate.test.ts`; `npm run typecheck`; `eslint --max-warnings 165`; medir
  `git add -N . && git diff --shortstat --no-renames HEAD`; barrido de citas (regla de mutación 4) sobre
  `schema.sql` (0 citas vivas esperadas, `design.md` §6) y `migrate.ts` (2 citas vivas: `tickets-core
  :666`, `Paquete_2026-09-27 :75`, las dos apuntando a `:70` — comprobar que siguen leyendo lo mismo
  tras la edición en `:73`).

---

## Lote 2 · Escritores y puertas

**Estimación:** código ~110 · pruebas ~370 · artefactos ~100 · **total ~580**.
**Depende de:** Lote 1.

**Ficheros muy citados que toca:**

| Fichero | Línea | Tipo |
|---|---|---|
| `packages/zoho-sync/src/db/repo.ts` | `:4` import de `ovAsociaciones` en la línea existente | EN SU SITIO |
| `packages/zoho-sync/src/db/repo.ts` | `:311` `writeTransition`: tras el `UPDATE`, `; await asociarDesdeTransicion(q, …)` | EN SU SITIO |
| `packages/zoho-sync/src/db/repo.ts` | `:349-361` comentario de `ticketConOrdenVenta` reescrito («tres vías») | EN SU SITIO |
| `packages/zoho-sync/src/db/repo.ts` | `:362-379` `ticketConOrdenVenta`: añade la subconsulta de la tercera vía | EN SU SITIO |
| `apps/desk/server/routes/remision.ts` | `:5` import de `asociarOV` | EN SU SITIO |
| `apps/desk/server/routes/remision.ts` | `:221-229` comentario reescrito (condición de retirada nombra los índices de `ov_asociaciones`) | EN SU SITIO |
| `apps/desk/server/routes/remision.ts` | `:239` → `const fijada = await db.query(` | EN SU SITIO |
| `apps/desk/server/routes/remision.ts` | `:241` → añade `RETURNING id` al `WHERE` | EN SU SITIO |
| `apps/desk/server/routes/remision.ts` | `:243` → `); if (fijada.rows.length) await asociarOV(…)` | EN SU SITIO |
| `apps/desk/server/remisiones.test.ts` | casos nuevos AL FINAL; `:988` **no se toca** | FINAL DE FICHERO |

Otros ficheros del diseño (no en la lista de "muy citados" del orquestador, pero editados en este lote):
`apps/desk/server/services/equipoNuevo.ts:80-92` (última función, FINAL DE FUNCIÓN — transacción +
`asociarOV`); `apps/desk/server/db/eliminarTicket.ts:154` (EN SU SITIO — libera vigentes antes de
borrar); `packages/zoho-sync/src/books/repo.ts:160-161` (EN SU SITIO — `soloLibres` suma exclusión por
asociación vigente); `apps/desk/server/ordenVentaUnTicket.test.ts` (casos nuevos al final).

- [x] 2.1 RED — prueba de `ticketConOrdenVenta` (extensión del bloque existente en `repo.test.ts` o
  `ovAsociaciones.test.ts`): con una fila vigente en `ov_asociaciones` sin coincidir por columna,
  `ticketConOrdenVenta` la encuentra. RQ: `tickets-core` RQ-TC-17 (base de la tercera vía).
- [x] 2.2 Confirmar rojo natural.
- [x] 2.3 GREEN — `repo.ts:362-379` en su sitio: reescribir `ticketConOrdenVenta` añadiendo
  `OR id IN (SELECT ticket_id FROM ov_asociaciones WHERE liberada_at IS NULL AND (salesorder_id = $s OR numero = $n))`;
  `:349-361` en su sitio, comentario «tres vías»; `:4` en su sitio, import de `asociarOV`/`listarAsociaciones`.
- [x] 2.4 Confirmar 2.1 en verde.
- [x] 2.5 RED — `ticketService.test.ts` (existente): un alta con OV libre deja una fila vigente en
  `ov_asociaciones` tras crear el ticket. RQ-TC-17, escenario «Escribir la OV crea la asociación en la
  misma transacción» (vía alta).
- [x] 2.6 Confirmar rojo natural.
- [x] 2.7 GREEN — `equipoNuevo.ts:80-92` (última función, al final): envolver las dos ramas de
  `crearTicketConEquipo` en `enTransaccion`, llamar `createTicket(q, …, {transaccionAbierta:true})` y,
  si `input.salesorderId`, `asociarOV(q, {ticketId:id, numero:input.ordenVenta, salesorderId:input.salesorderId, origen:'alta', actor, fechaOrdenCompra:null})`.
- [x] 2.8 Confirmar 2.5 en verde.
- [x] 2.9 RED — `ordenVentaUnTicket.test.ts` (al final): la asociación vigente por tercera vía bloquea el
  alta con `409` sin coincidir por columna (RQ-TC-08, escenario 2); confirmar que el alta sin cuarentena
  ni asociación previa sigue en `201` (RQ-TC-08, escenario 1 — regresión explícita).
- [x] 2.10 Confirmar rojo natural del caso `409` nuevo.
- [x] 2.11 Confirmar 2.9 en verde tras 2.3/2.7 (la puerta 1 ya delega en `ticketConOrdenVenta`, sin GREEN adicional).
- [x] 2.12 RED — `ticketService.test.ts`: `habilitar_servicio` con OV libre deja escrita la asociación
  tras la transición. RQ: `transitions-st` RQ-TS-14, escenario 1.
- [x] 2.13 Confirmar rojo natural.
- [x] 2.14 GREEN — `repo.ts:311` en su sitio, dentro de `writeTransition`, tras el `UPDATE`:
  `; await asociarDesdeTransicion(q, ticketId, plan, actor)` (misma transacción). Crear
  `asociarDesdeTransicion` en `ovAsociaciones.ts` — versión base: sólo `plan.columns.orden_venta`,
  resuelve `salesorder_id` por número contra `sales_orders`, `origen:'habilitar_servicio'` (el lote 3
  la amplía con `ovAdicional`).
- [x] 2.15 Confirmar 2.12 en verde.
- [x] 2.16 RED — `ordenVentaUnTicket.test.ts` (al final): la asociación vigente por tercera vía bloquea
  `habilitar_servicio` con `409`, excluyendo el propio ticket.
- [x] 2.17 Confirmar en verde (delega en el mismo `ticketConOrdenVenta` de 2.3, sin GREEN adicional).
- [x] 2.18 RED — `apps/desk/server/remisiones.test.ts` (al final, SIN tocar `:988`): la remisión de
  entrada que captura una OV libre deja una fila vigente en `ov_asociaciones` (RQ-RE-16, escenario «El
  UPDATE también crea la fila de asociación»); una segunda remisión sobre otro ticket con la misma OV
  asociada por tercera vía responde `409` (RQ-RE-16, escenario 1, ampliado a la tercera vía).
- [x] 2.19 Confirmar rojo natural.
- [x] 2.20 GREEN — `remision.ts:5` en su sitio (import de `asociarOV`, segunda sentencia de la línea);
  `:239` → `const fijada = await db.query(`; `:241` → añade `RETURNING id`; `:243` →
  `); if (fijada.rows.length) await asociarOV(db, {ticketId, numero:ov.number, salesorderId:ov.id, origen:'remision', actor:TRANSITION_ACTOR, fechaOrdenCompra:ov.date ?? null})`. **LO APLICADO (`remision.ts:243`) difiere en dos valores, a propósito:** `actor: req.user?.name ?? TRANSITION_ACTOR` (por las trazas: queda quién capturó la OV, y `TRANSITION_ACTOR` sólo si no hay usuario) y `fechaOrdenCompra: null` (porque `ov.date` es la fecha de la orden de VENTA, no la de la orden de COMPRA que guarda esa columna, S-5);
  `:221-229` en su sitio, reescribir el comentario nombrando los índices de `ov_asociaciones`.
- [x] 2.21 Confirmar 2.18 en verde.
- [x] 2.22 Verificación de regresión (sin RED nuevo; pruebas de posición intactas) — correr
  `remisiones.test.ts:988` (el `422` del serial sigue ganando al `409`), el escenario de reenvío al
  propio ticket (no-op) y el de la marca `ov_elegida_en_app_at` tras el `UPDATE`; confirmar que sus
  aserciones no cambiaron con el `RETURNING id` añadido. RQ-RE-16, escenarios 2, 3 y 4.
- [x] 2.23 RED — `packages/zoho-sync/src/books/repo.test.ts` (existente): `searchSalesOrders` con
  `soloLibres` excluye una OV cuya única traza de uso es una fila vigente en `ov_asociaciones` (sin
  coincidir por columna). RQ: `zoho-sync` RQ-ZS-14, escenario 1.
- [x] 2.24 Confirmar rojo natural.
- [x] 2.25 GREEN — `books/repo.ts:160-161` en su sitio: sumar a cada `NOT IN` la subconsulta
  `SELECT numero/salesorder_id FROM ov_asociaciones WHERE liberada_at IS NULL`.
- [x] 2.26 Confirmar 2.23 en verde.
- [x] 2.27 RED — `apps/desk/server/db/eliminarTicket.test.ts` (existente): eliminar un ticket con una
  asociación vigente la libera (motivo «Ticket eliminado») antes de borrar sus filas.
- [x] 2.28 Confirmar rojo natural.
- [x] 2.29 GREEN — `eliminarTicket.ts:154` en su sitio: dentro de `enTransaccion`, antes del bucle de
  `DELETE`, `await liberarAsociacionesDeTicket(q, ticketId, 'Ticket eliminado')`.
- [x] 2.30 Confirmar 2.27 en verde.
- [x] 2.31 Cierre del lote: `npm test`; `npm run typecheck`; `eslint --max-warnings 165`; medir
  `git add -N . && git diff --shortstat --no-renames HEAD`; barrido de citas (regla de mutación 4) sobre
  `repo.ts` (43 citas vivas — comprobar las 4 externas de `design.md` §6: `ordenVentaUnTicket.test.ts:14`,
  `tickets-core :306`, `transitions-st :399`, `remisiones :364`), `remision.ts` (118 citas — 21 externas
  + 4 propias, entre ellas `CLAUDE.md` IV-12 `:220`), `equipoNuevo.ts` (1 cita, `hojas-vida :273`, no
  cambia), `eliminarTicket.ts` (11 citas), `books/repo.ts` (3 citas: `equipos.test.ts:458`, `F1B-01
  :145`, `Puntos_para_Gerencia :166-170`).

---

## Lote 3 · Varias OV por ticket

**Estimación:** código ~60 · pruebas ~340 · artefactos ~100 · **total ~500**.
**Depende de:** Lote 2.

**Ficheros muy citados que toca:**

| Fichero | Línea | Tipo |
|---|---|---|
| `packages/shared/src/transitions.ts` | `:17` `FieldTarget` gana `\| 'ovAdicional'` | EN SU SITIO |
| `packages/shared/src/transitions.ts` | `:199` `aprobacion_y_repuestos`: `fields` gana `cfOvAdicional()` (**corregido en lote 4**: sin `campoFecha`; decía `'Fecha Orden De Venta'`) | EN SU SITIO |
| `packages/shared/src/transitions.ts` | `:203` `aprobacion`: `fields` gana `cfOvAdicional('Fecha Orden de Venta Final', false)` | EN SU SITIO |
| `packages/shared/src/transitions.ts` | `cfOvAdicional` (declaración `function`, elevada) | FINAL DE FICHERO |

Otros ficheros del diseño: `apps/desk/server/transitionExec.ts:21` (interfaz gana `ovAdicional?: string`,
EN SU SITIO), `:92` (rama `else if (f.target==='ovAdicional')…`, EN SU SITIO); `packages/zoho-sync/src/db/repo.ts:267`
(`TransitionApply` gana `ovAdicional?: string`, EN SU SITIO); `apps/desk/server/services/ticketService.ts:148`
(`plan.columns.orden_venta ?? plan.ovAdicional`, EN SU SITIO).

- [x] 3.1 RED — `transitionExec.test.ts`: un campo con `target:'ovAdicional'` escribe `plan.ovAdicional`,
  no `plan.columns` ni `plan.customFields`. Cubre el riesgo de diseño §4 (la clave `'Orden de Venta'`
  casaría en `LABEL_TO_COL` y sobrescribiría la columna).
- [x] 3.2 Confirmar rojo natural (`FieldTarget` no admite `'ovAdicional'`).
- [x] 3.3 GREEN — `transitions.ts:17` en su sitio: `FieldTarget` gana `| 'ovAdicional'`;
  `transitionExec.ts:21` en su sitio: la interfaz gana el campo; `:92` en su sitio: rama `else if`.
- [x] 3.4 Confirmar 3.1 en verde.
- [x] 3.5 MUTACIÓN (riesgo de diseño, motor) — cambiar temporalmente la clave del campo nuevo a
  `'Orden de Venta'` en vez de `target:'ovAdicional'`; correr 3.9 (más abajo) y confirmar que se pone
  ROJA (la clave casaría con la columna `orden_venta` y la sobrescribiría); revertir; `git diff` limpio.
- [x] 3.6 GREEN — `transitions.ts:199`/`:203` en su sitio: añadir `cfOvAdicional('Fecha Orden De Venta')` *(corregido en lote 4, tarea 4.0b: es `cfOvAdicional()`, sin `campoFecha`; el autofill pisaba `fecha_orden_venta`)*
  y `cfOvAdicional('Fecha Orden de Venta Final', false)` a los `fields` de `aprobacion_y_repuestos` y
  `aprobacion`; `cfOvAdicional` como `function` al final del fichero (elevada — un `const` daría error
  de zona muerta porque `TRANSICIONES_BASE` se evalúa al cargar el módulo).
- [x] 3.7 GREEN — `repo.ts:267` en su sitio: `TransitionApply` gana `ovAdicional?: string`;
  `ticketService.ts:148` en su sitio: `plan.columns.orden_venta ?? plan.ovAdicional`.
- [x] 3.8 GREEN — extender `asociarDesdeTransicion` (`ovAsociaciones.ts`, lote 2): aceptar también
  `plan.ovAdicional`, crear una asociación adicional con `origen:'aprobacion'|'aprobacion_y_repuestos'` y
  copiar `plan.columns.fecha_orden_compra`/`fecha_orden_compra_final` a `fecha_orden_compra` de la
  asociación (S-5); resolver `salesorder_id` por número, `NULL` si no resuelve (S-12).
- [x] 3.9 RED — `ticketService.test.ts` (existente): tras `Aprobación` con una OV nueva y su fecha de
  OC, el ticket queda con dos asociaciones vigentes y `orden_venta`/`fecha_orden_venta` del ticket no
  cambian. RQ: `transitions-st` RQ-TS-18, escenario 1.
- [x] 3.10 Confirmar rojo natural.
- [x] 3.11 Confirmar 3.9 en verde tras 3.6-3.8.
- [x] 3.12 RED — `ticketService.test.ts`: la asociación creada por `Aprobación` tiene la fecha de OC, y
  ninguna columna del ticket la guarda. RQ-TS-18, escenario 2.
- [x] 3.13 Confirmar en verde (mismo GREEN de 3.8, sin GREEN adicional).
- [x] 3.14 Verificación de regresión — `bodegaje.test.ts:360`/`:362` (existentes): el bodegaje de
  entrada cierra con la OV de `habilitar_servicio` sin cambio de código (criterio de éxito del
  `proposal.md`, punto 9); confirmar que siguen en verde tal cual.
- [x] 3.15 Confirmar verde sin cambios de código (bodegaje lee el historial por etiqueta).
- [x] 3.16 `npm run typecheck` intermedio (riesgo de diseño: `FieldTarget` en un `switch` exhaustivo en
  otro sitio del código).
- [x] 3.17 Cierre del lote: `npm test`; `npm run typecheck`; `eslint --max-warnings 165`; correr
  `invariantesGrafo.test.ts` y regenerar el mapa del Blueprint si hace falta (riesgo de diseño); medir
  `git add -N . && git diff --shortstat --no-renames HEAD`; barrido de citas sobre `transitions.ts` (217
  citas vivas: comprobar `bodegaje.test.ts:360`/`:362`, `transitions-st :295`, y que ninguna edición cae
  antes de `:295` — regla del diseño §6) y `transitionExec.ts` (41 citas: `rows.ts:120`, `tickets-core :328`).

---

## Lote 4 · Cuarentena

**Estimación:** código ~90 · pruebas ~400 · artefactos ~100 · **total ~590**.
**Depende de:** Lotes 1-3.

**Ficheros muy citados que toca:**

| Fichero | Línea | Tipo |
|---|---|---|
| `apps/desk/server/services/ticketService.ts` | `:6` import de `motivoCuarentena`/`erroresCuarentena` | EN SU SITIO |
| `apps/desk/server/services/ticketService.ts` | `:96` antepone `if (motivoCuarentena(ordenVenta)) throw new HttpError(422, …)` | EN SU SITIO |
| `apps/desk/server/services/ticketService.ts` | `:134` suma `erroresCuarentena([...])` al `422` existente | EN SU SITIO |
| `apps/desk/server/routes/remision.ts` | `:4` import de `motivoCuarentena` | EN SU SITIO |
| `apps/desk/server/routes/remision.ts` | `:220` → `if (!ov \|\| motivoCuarentena(ov.number))` | EN SU SITIO |
| `apps/desk/server/remisiones.test.ts` | caso nuevo AL FINAL; `:988` **no se toca** | FINAL DE FICHERO |

Otro fichero del diseño: `packages/zoho-sync/src/books/repo.ts:2` (import, EN SU SITIO), `:163`
(`limit * 3` con `soloLibres`, EN SU SITIO), `:176` (filtrar `!esCuarentena` y cortar a `limit`, EN SU
SITIO). Módulo nuevo: `packages/shared/src/subOV.ts` (exportado al final de `index.ts:22`).

- [x] 4.0a RED — **corrección de RQ-TS-18** (`specs/transitions-st/spec.md:47-51`: «sin tocar la OV de entrada»). `ticketService.test.ts`
  (al final): con el catálogo REAL de `aprobacion_y_repuestos`, simula el autofill de `TransitionPanel.tsx:103` (`values[f.key]=numero`;
  `values[f.campoFecha]=fechaOV`) tras teclear a mano la `Fecha Orden De Venta` obligatoria; `fecha_orden_venta` debe seguir siendo la tecleada.
  Rojo: `expected '2026-07-15' to be '2026-06-10'`.
- [x] 4.0b GREEN — `transitions.ts:199` `cfOvAdicional()` y `function cfOvAdicional(campoFecha?: string, required = false)` (comentario en su sitio).
  Guardián nuevo en `transitionExec.test.ts` (al final): ningún campo `ovAdicional` tiene un `campoFecha` que resuelva a `orden_venta`/`fecha_orden_venta`
  (nació verde; con el catálogo viejo se pone rojo: `campoFecha "Fecha Orden De Venta" → fecha_orden_venta`). Las pruebas de lote 3 no citaban el `campoFecha` viejo: no se adaptó ninguna.
- [x] 4.0c RED/GREEN — el origen de la asociación adicional es la TRANSICIÓN, no se deduce de la fecha de OC: `repo.ts:311` en su sitio pasa `transition.id`
  a `asociarDesdeTransicion(…, actor, transitionId)`. Rojo discriminante en `ovAsociaciones.test.ts` (al final): transición `aprobacion` con `fecha_orden_compra` puesta
  → `expected 'aprobacion_y_repuestos' to be 'aprobacion'`. La prueba pedida («`aprobacion` sin fecha de OC final → origen `aprobacion`», `ticketService.test.ts`) **nace VERDE** con la
  deducción vieja: es guarda de regresión, no discrimina.
- [x] 4.0d Docs en su sitio: `design.md:111-113` y `:74` corregidos con el porqué (RQ-TS-18 manda sobre el diseño); 3.6 y la fila de `:199` del lote 3, arriba, con nota «corregido en lote 4».
  La desviación 1 y el riesgo 3 de `apply-progress.md` (lote 3) quedan CERRADOS por este lote (se dejan como están: son históricos, caso B).
- [x] 4.0e Para el lote 6 (sin código ahora): el cliente depende del `campoFecha` (`TransitionPanel.tsx:66` lo oculta al teclado, `:103` lo escribe). Regla 13: el servidor no autorrellena
  nada; el autofill es comodidad del cliente. Tras esta corrección no hace falta cambio en `.tsx` (el campo manual vuelve a ser tecleable); **verificar en el lote 6** (6.2) que la pantalla lo enseña.

- [x] 4.1 RED — `packages/shared/src/subOV.test.ts` (nuevo): tabla de casos — `OV-2026-001-X9` (sufijo
  no canónico) → cuarentena; `OV-2026-001` → ordinaria; `OVI-2026-001` → ordinaria; `OVI-2026-001-X9` →
  cuarentena (S-8); espacios alrededor tras `trim`. RQ: `tickets-core` RQ-TC-18, escenarios 1 y 2.
- [x] 4.2 Confirmar rojo natural (módulo inexistente).
- [x] 4.3 GREEN — crear `subOV.ts`: `clasificarOV(numero)` (`ordinaria`\|`subov`\|`cuarentena`),
  `motivoCuarentena(numero)`, `erroresCuarentena(numeros[])`; exportar al final de `index.ts:22`.
- [x] 4.4 Confirmar 4.1 en verde.
- [x] 4.5 RED — `ticketService.test.ts`: el alta con una OV en cuarentena responde `422` sin llegar a
  comprobar unicidad. RQ-TC-18, escenario 1 (vía alta).
- [x] 4.6 Confirmar rojo natural.
- [x] 4.7 GREEN — `ticketService.ts:6` en su sitio (import); `:96` en su sitio: antepone la guarda de
  cuarentena antes de `ticketConOrdenVenta`.
- [x] 4.8 Confirmar 4.5 en verde.
- [x] 4.9 RED — `ticketService.test.ts`: `habilitar_servicio` con OV en cuarentena responde `422`, no
  `409`. RQ: `transitions-st` RQ-TS-14, escenario 2.
- [x] 4.10 Confirmar rojo natural.
- [x] 4.11 GREEN — `ticketService.ts:134` en su sitio: sumar `erroresCuarentena([plan.columns.orden_venta, plan.ovAdicional])`
  al array de errores del `422` ya existente.
- [x] 4.12 Confirmar 4.9 en verde.
- [x] 4.13 RED — `apps/desk/server/remisiones.test.ts` (al final, SIN tocar `:988`): una OV con sufijo
  no canónico bloquea la remisión con `422` antes del `409` de unicidad. RQ: `remisiones` RQ-RE-16,
  escenario 5.
- [x] 4.14 Confirmar rojo natural.
- [x] 4.15 GREEN — `remision.ts:4` en su sitio (import); `:220` en su sitio: `if (!ov ||
  motivoCuarentena(ov.number)) { … }` (el mensaje de «no encontrada» se mantiene cuando `!ov`: A sigue
  primero).
- [x] 4.16 Confirmar 4.13 en verde.
- [x] 4.17 MUTACIÓN (regla 1, posición) — mover la guarda de cuarentena de `ticketService.ts:96` a
  DESPUÉS de la comprobación de unicidad; correr 4.5 y confirmar que se pone ROJA (el `409` saldría
  antes que el `422` de cuarentena); revertir. Repetir la misma mutación con `ticketService.ts:134`
  (contra 4.9) y con `remision.ts:220` (contra 4.13); las tres deben ponerse rojas al invertir el orden;
  revertir cada una; `git diff` limpio.
- [x] 4.18 RED — `packages/zoho-sync/src/books/repo.test.ts`: una subOV en cuarentena no aparece en
  `searchSalesOrders` (con o sin `soloLibres`). RQ-TC-18 (fuera del desplegable).
- [x] 4.19 Confirmar rojo natural.
- [x] 4.20 GREEN — `books/repo.ts:2` en su sitio (import); `:163` en su sitio: pedir `limit * 3` cuando
  `soloLibres` **(LO APLICADO: SIEMPRE `limit * 3`, con o sin `soloLibres`, porque 4.18 exige la cuarentena fuera en los dos casos y el filtro es de TS)**; `:176` en su sitio: filtrar `!esCuarentena(r.number)` en TS y cortar a `limit` (pg-mem
  no tiene operador `~`).
- [x] 4.21 Confirmar 4.18 en verde.
- [x] 4.22 Cierre del lote: `npm test`; `npm run typecheck`; `eslint --max-warnings 165`; medir
  `git add -N . && git diff --shortstat --no-renames HEAD`; barrido de citas sobre `ticketService.ts`
  (156 citas: ~30 externas + 5 propias — comprobar que `transitions-st :902-903` — «C antes que D» —
  sigue siendo cierto tras 4.7/4.11), `remision.ts` (confirmar que la guarda de cuarentena en `:220`
  queda detrás del `409` de remisión pendiente `:177` — molde de IV-12, se anota, no se corrige aquí),
  `books/repo.ts`.

---

## Lote 5 · API de servidor

**Estimación:** código ~250 · pruebas ~350 · artefactos ~100 · **total ~700**.
**Depende de:** Lote 4.

Ningún fichero de la lista de "muy citados" del orquestador se toca en este lote (rutas y módulo
nuevos: `books/subOV.ts`, `routes/ovAsociaciones.ts`, registro en `app.ts` tras `:60` — 0 citas vivas
ancladas ahí según `design.md` §6, así que el registro no desplaza nada citable).

- [ ] 5.1 RED — `packages/zoho-sync/src/books/subOV.test.ts` (nuevo): `saldoPorLote(db, lote)` con 5
  subOV del lote (2 con asociación vigente, 2 libres, 1 en cuarentena) devuelve `{creadas:5,
  consumidas:2, libres:2, ejecutado:40}`, con la de cuarentena fuera del recuento. RQ: `zoho-sync`
  RQ-ZS-14, escenario 3.
- [ ] 5.2 Confirmar rojo natural.
- [ ] 5.3 GREEN — crear `books/subOV.ts`: `listarCuarentena(db)`, `saldoPorLote(db, lote)` sobre
  `books.sales_orders` con `order_status` distinto de borrador/anulada (S-11); cuarentena filtrada en TS.
- [ ] 5.4 Confirmar 5.1 en verde.
- [ ] 5.5 RED — `books/subOV.test.ts`: una subOV en cuarentena no aparece ni en `soloLibres` ni en el
  saldo del lote. RQ-ZS-14, escenario 2.
- [ ] 5.6 Confirmar en verde (reutiliza 4.20 del lote 4 + 5.3, sin GREEN adicional).
- [ ] 5.7 RED — `apps/desk/server/routes/ovAsociaciones.test.ts` (nuevo, arnés `appHarness`):
  `GET /api/tickets/:id/ov-asociaciones` devuelve vigentes y liberadas, distinguibles por su estado. RQ:
  `tickets-core` RQ-TC-20, escenario 1.
- [ ] 5.8 Confirmar rojo natural (ruta inexistente).
- [ ] 5.9 GREEN — crear `routes/ovAsociaciones.ts`: `registerOvAsociacionesRoutes(app, {db})` con
  `GET /api/tickets/:id/ov-asociaciones` (`listarAsociaciones`); registrar en `app.ts` tras `:60`
  (import + llamada).
- [ ] 5.10 Confirmar 5.7 en verde.
- [ ] 5.11 RED — `ovAsociaciones.test.ts`: liberar sin rol Comercial responde `403` y la fila no cambia
  (escalera F1B-10: A `404` inexistente < B `403`/`409` < C `422` motivo vacío). RQ-TC-19, escenario 2.
- [ ] 5.12 Confirmar rojo natural.
- [ ] 5.13 GREEN — `PUT /api/ov-asociaciones/:id/liberar`: `404` si no existe;
  `canExecuteTransition(user.areas, user.isAdmin, 'Comercial')` → `403`; `409` si ya liberada; `422` si
  `motivo` vacío tras `trim`; si no, `liberarAsociacion`.
- [ ] 5.14 Confirmar 5.11 en verde.
- [ ] 5.15 RED — `ovAsociaciones.test.ts`: motivo vacío → `422`; liberar una ya liberada → `409`;
  liberar con rol Comercial y motivo válido → `200` con la fila actualizada.
- [ ] 5.16 Confirmar rojo natural.
- [ ] 5.17 Confirmar 5.15 en verde (mismo GREEN de 5.13, sin GREEN adicional).
- [ ] 5.18 RED — `ovAsociaciones.test.ts`: `GET /api/ov-asociaciones/cuarentena` y
  `GET /api/ov-asociaciones/saldo/:lote` devuelven `listarCuarentena`/`saldoPorLote`.
- [ ] 5.19 Confirmar rojo natural.
- [ ] 5.20 GREEN — registrar las dos rutas de lectura (`requireAuth`, sin restricción de rol: son de
  sólo lectura para Comercial y quien consulte).
- [ ] 5.21 Confirmar 5.18 en verde.
- [ ] 5.22 Cierre del lote: `npm test`; `npm run typecheck`; `eslint --max-warnings 165`; medir
  `git add -N . && git diff --shortstat --no-renames HEAD`; barrido de citas sobre `app.ts` (0 citas
  vivas ancladas — comprobar por lectura la hipótesis de `design.md` §6 sobre las tres menciones de
  `Triaje_Linea_Base_Citas_2026-09-15.md:71-73`).

---

## Lote 6 · Interfaz y cierre

**Estimación:** código ~350 · pruebas 0 · artefactos ~140 · **total ~490**.
**Depende de:** Lote 5.

**Ficheros muy citados que toca:**

| Fichero | Línea | Tipo |
|---|---|---|
| `CLAUDE.md` | fila de IV-11, tabla «Incumplimientos vivos» | EN SU SITIO |
| `openspec/config.yaml` | adenda nueva en `adendas_incumplimientos_vivos`, clave propia, remitida desde la ficha de IV-11 en su sitio | FINAL DE FICHERO |

Otro fichero del diseño: `apps/desk/src/components/TicketDetailView.tsx`, montaje tras `:245` (0 citas
vivas en o tras esa línea) — categoría propia del diseño «MITAD», fuera de las tres pedidas por el
orquestador porque no hay ninguna cita que desplazar ahí. `apps/desk/src` queda fuera de la red de
pruebas (F0-00, `vitest.config.ts:16-20`): sin tareas RED/GREEN para `.tsx`.

- [ ] 6.1 Crear el cliente de las rutas del lote 5 (`apps/desk/src/lib`, al final de un módulo existente
  o uno propio): `listarOvAsociaciones`, `liberarOvAsociacion`, `listarCuarentena`, `saldoPorLote`.
- [ ] 6.2 `TicketDetailView.tsx`, montaje tras `:245`: lista de OV vigentes/liberadas con botón
  «liberar» (Comercial, motivo obligatorio; el `422`/`403` del servidor se enseña, no se duplica en
  cliente — regla 13, punto 1). **Nota del lote 4 (4.0e):** comprobar aquí que `TransitionPanel.tsx:66`/`:103` siguen bien con `cfOvAdicional()` sin `campoFecha` en `aprobacion_y_repuestos` (la fecha manual vuelve a ser tecleable; ningún cambio de `.tsx` esperado).
- [ ] 6.3 Nueva vista/sección para Comercial: lista de cuarentena y saldo por lote (fuente: rutas del
  lote 5).
- [ ] 6.4 Regla 13 (checklist, sin código) — enumerar en `apply-progress.md` las decisiones de cliente
  de este cambio y su línea de servidor: ocultar OV usadas/cuarentena en el desplegable
  (`books/repo.ts:159-176` tras el lote 4), botón «liberar» sólo Comercial (`routes/ovAsociaciones.ts`,
  lote 5), motivo obligatorio al liberar (idem), filtro del desplegable por cliente **sin guarda nueva**
  (comodidad declarada, IV-8, regla 13 punto 2).
- [ ] 6.5 Actualizar `CLAUDE.md`, fila de IV-11 (tabla «Incumplimientos vivos»), EN SU SITIO: la
  asociación propia (`public.ov_asociaciones`) cubre desde este cambio lo que sus tres escritores
  asocien; las filas previas sin marca ni asociación siguen expuestas (relleno pendiente, P.2); IV-11
  sigue **REDUCIDO, no cerrado**.
- [ ] 6.6 Añadir la adenda de IV-11 al FINAL de `openspec/config.yaml` → `adendas_incumplimientos_vivos`
  (clave propia), remitida por clave desde la ficha existente de IV-11 en su sitio — sin insertar en
  mitad del fichero (corrección del orquestador del 2026-09-28: `config.yaml` no admite inserción en
  mitad).
- [ ] 6.7 Barrido completo de la regla de mutación 4 (cierre de la tanda): `grep -rnoE
  "<fichero>\.ts:[0-9]+(-[0-9]+)?"` sobre el repositorio para cada fichero tocado en los seis lotes
  (`repo.ts`, `remision.ts`, `ticketService.ts`, `schema.sql`, `migrate.ts`, `transitions.ts`,
  `transitionExec.ts`, `books/repo.ts`, `eliminarTicket.ts`, `equipoNuevo.ts`, `TicketDetailView.tsx`,
  `app.ts`); segundo pase para la forma abreviada en los ficheros que ya citan cada módulo; comprobar
  los DOS extremos de cada rango; LEER qué afirma cada cita contra el fichero editado (las ediciones son
  en su sitio: el contenido cambia aunque la línea no se mueva); clasificar A/presente, B/histórico o
  C/superado. Ninguna edición de este cambio desplaza líneas (todo en su sitio o al final), así que el
  barrido es de VERIFICACIÓN de contenido, no de renumeración. **Pendiente conocido (lote 4):** la tabla de destinos de `openspec/specs/transitions-st/spec.md` no incluye `ovAdicional`; corregirla en este barrido. **Pendiente conocido (lote 2):** `openspec/specs/hojas-vida/spec.md:273` cita `equipoNuevo.ts:80-92` para «crea el equipo en transacción», y tras el lote 2 la función ocupa `:80-99` (caso A parcial: el final del rango se queda corto).
- [ ] 6.8 Cierre general: `npm test`; `npm run typecheck`; `npm run lint`; `npm run build`; medir
  `git add -N . && git diff --shortstat --no-renames HEAD` del lote; confirmar uno a uno los seis
  criterios de éxito de `proposal.md` §Criterios de éxito.

---

## Matriz de cobertura de escenarios (24/24)

| # | Requisito | Escenario | Lote | Tarea(s) |
|---|---|---|---|---|
| 1 | RQ-TC-08 | El alta sin cambios sigue igual | 2 | 2.9-2.11 |
| 2 | RQ-TC-08 | La asociación vigente por la tercera vía bloquea el alta | 2 | 2.9-2.11 |
| 3 | RQ-TC-08 | Las pruebas de posición existentes no cambian | 2 | 2.22 |
| 4 | RQ-TC-17 | Escribir la OV crea la asociación en la misma transacción | 2 | 2.5-2.8 |
| 5 | RQ-TC-17 | Segunda asociación vigente sobre la misma OV rechazada por la base | 1 | 1.1-1.6 |
| 6 | RQ-TC-18 | subOV con sufijo no canónico rechazada antes de comprobar unicidad | 4 | 4.5-4.8, 4.13-4.16 |
| 7 | RQ-TC-18 | OV simple y OVI no entran en cuarentena | 4 | 4.1-4.4 |
| 8 | RQ-TC-19 | Liberar conserva la fila con su motivo | 1 | 1.7, 1.9-1.11 |
| 9 | RQ-TC-19 | Sin rol Comercial, la liberación se rechaza | 5 | 5.11-5.14 |
| 10 | RQ-TC-19 | Tras liberar, la OV es reasociable | 1 | 1.8-1.11 |
| 11 | RQ-TC-20 | La ficha devuelve las dos listas | 5 | 5.7-5.10 |
| 12 | RQ-TS-14 | `habilitar_servicio` sin cuarentena sigue igual, asociación escrita | 2 | 2.12-2.17 |
| 13 | RQ-TS-14 | OV en cuarentena bloquea antes de la unicidad | 4 | 4.9-4.12 |
| 14 | RQ-TS-18 | Tras `Aprobación` con OV nueva, la de entrada no cambia | 3 | 3.9-3.11 |
| 15 | RQ-TS-18 | La fecha de OC vive en la asociación nueva | 3 | 3.12-3.13 |
| 16 | RQ-RE-16 | Una orden ya asociada a otro ticket se rechaza antes de escribir | 2 | 2.18-2.21 |
| 17 | RQ-RE-16 | El 422 del serial gana al 409 nuevo | 2 | 2.22 |
| 18 | RQ-RE-16 | Reenviar la misma orden al propio ticket no se autobloquea | 2 | 2.22 |
| 19 | RQ-RE-16 | El UPDATE deja la orden protegida del sincronizador | 2 | 2.22 |
| 20 | RQ-RE-16 | Una OV en cuarentena bloquea la remisión antes del 409 | 4 | 4.13-4.16 |
| 21 | RQ-RE-16 | El UPDATE también crea la fila de asociación | 2 | 2.18-2.21 |
| 22 | RQ-ZS-14 | Una OV con asociación vigente no aparece en `soloLibres` | 2 | 2.23-2.26 |
| 23 | RQ-ZS-14 | Una subOV en cuarentena no aparece en el buscador ni en el saldo | 5 | 5.5-5.6 |
| 24 | RQ-ZS-14 | El saldo del lote cuenta correctamente | 5 | 5.1-5.4 |

**24/24 escenarios cubiertos.**

---

## Tareas de persona — fuera del recuento (regla del ciclo 1)

Dueño, destino y registro en cada una. **Archivar este cambio NO las da por hechas.**

- **P.1 Alfonso** ejecuta `docs/sdd/Consulta_SubOV_formato_2026-09-27.sql` (sólo lectura) sobre
  producción y devuelve la salida; dice cuántas OV caen en cuarentena el día uno. No bloquea construir
  (`proposal.md` §Tareas de persona); queda registrado aquí y en `openspec/config.yaml`.
- **P.2 Gerencia** decide el relleno retroactivo de asociaciones para tickets/OV existentes (dato de
  producción). Sin esta decisión, las filas anteriores a este cambio siguen expuestas aunque IV-11
  quede REDUCIDO (`proposal.md` §Cierre esperado; P.2 del cambio 1, `archive-report.md:78` de
  `parche-iv11-orden-venta`).
- **P.3 Comercial** verifica en la app, tras el despliegue del lote 6, que la ficha del ticket lista las
  OV vigentes y liberadas, que el botón «liberar» exige rol Comercial y motivo, y que la lista de
  cuarentena y el saldo por lote se ven correctamente (`ambientalia-desk.ambientalia.cloud`).

## Dependencias entre lotes

Lote 1 es la base (tabla, índices, `asociarOV`/`liberarAsociacion`): todo lo demás depende de él. Lote
2 (escritores + tercera vía en las tres puertas) depende del Lote 1 y es prerrequisito de los Lotes 3 y
4, que amplían `asociarDesdeTransicion` (Lote 3) y añaden la guarda de cuarentena sobre los mismos
puntos de entrada (Lote 4). El Lote 5 (rutas de lectura/liberación, saldo) depende de que el
clasificador de subOV (Lote 4) exista. El Lote 6 (interfaz y cierre documental) depende de que las rutas
del Lote 5 estén construidas. Una tanda SDD por árbol de trabajo (regla del ciclo 2): los seis lotes se
ejecutan **en serie**, nunca en paralelo; `verify` y `archive` son intentos aparte del ledger.
