# Tasks: Reasignar desvíos huérfanos tras el cierre de F1A

## Nota de retrofit

Casi todo el contenido de este cambio ya está commiteado en `56ff441` (base `607e26a`, rama `main`).
Este `tasks.md` no planifica trabajo futuro: registra qué está hecho, con su verificación, y qué queda
abierto y de quién es.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~45 (7 citas de línea + 2 comentarios cruzados + 2 deltas de spec, ya integrados) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | PR único |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Cerrar el ciclo SDD sobre el retrofit ya integrado | PR único | `npm test` | N/A — documentación y comentarios, sin ruta de ejecución nueva | `git revert` del commit de esta tanda, sin tocar `56ff441` |

## A. Hecho en `56ff441` (reasignación original)

- [x] 1. Reasignar IV-1 e IV-5 → F1B-08; IV-2 → punto abierto Gerencia; IV-4 → punto abierto nº 52.
      Verificación: `CLAUDE.md:188-208` (tabla de incumplimientos vivos; las filas reasignadas en
      `:203`, `:204` y `:205`); `openspec/config.yaml:413-439` (bloque `incumplimientos_vivos`, IV-4
      en `:416-418`).
- [x] 2. Añadir IV-7 (`apps/desk/src/lib/boardView.ts:49-50`, vista «todos» oculta 726 cerrados) con
      las dos salidas declaradas como decisión de Gerencia. Verificación: `CLAUDE.md:204`.
- [x] 3. Escribir en `CLAUDE.md` la regla del barrido (reasignar desvíos al cerrar una épica).
      Verificación: `CLAUDE.md:194-199` (el blockquote «un destino es una promesa»).
- [x] 4. Entrada 5 (5.a, 5.b, 5.c) en `docs/sdd/F0-01_Correcciones_para_el_plan.md`.
      Verificación: líneas 243, 280, 304.
- [x] 5. Notas de REASIGNADO en `tickets-core` §4.1/§4.2 y `transitions-st` §3.8.
      Verificación: `openspec/specs/tickets-core/spec.md:312` (§4.1) y `:329` (§4.2);
      `openspec/specs/transitions-st/spec.md:565`.

## B. Hecho en esta tanda (post-retrofit)

- [x] 6. Comentario cruzado entre las dos pruebas de precedencia contradictorias.
      Verificación: `apps/desk/server/services/ticketService.test.ts:186-193` (cita `:194` desde `:319`) y
      `:313-317` (cita `:194` desde `:319`). Suite reportada en verde (26/26 en el fichero, 990 en total);
      reproducir con `npm test -- ticketService.test.ts` y `npm test`.
- [x] 7. Siete citas de `remision.ts` actualizadas de `:189-197`/`:192-196`/`:194`/`:185-187`/`:176-179`
      a `:218-226`/`:221-225`/`:223`/`:214-216`/`:205-208`, en specs vivas y `config.yaml`.
      Verificación: `openspec/specs/remisiones/spec.md:34,374-375,380-381,463`;
      `openspec/specs/transitions-st/spec.md:489`; `openspec/config.yaml:418` (`ubicacion` de IV-4) y
      `:431` (`matiz_de_verificacion`). No se tocan
      `openspec/changes/F0-01/proposal.md:120` ni `F0-04/proposal.md:194` (proposals archivados).
- [x] 8. Cuatro apartados de spec más, huérfanos y no vistos por el barrido de `56ff441`:
      `remisiones` §5.1 → nº 52, enmarcado invertido «retirar, no añadir»
      (`openspec/specs/remisiones/spec.md:349-369`); `remisiones` §5.3 → variables de entorno sin
      documentar, **sin tanda asignada** (`:408-414`; `grep -n "REMISION|N8N_REMISION" DEPLOY.md`
      verificado hoy, cero resultados); `transitions-st` §3.4 → nº 52
      (`openspec/specs/transitions-st/spec.md:475-492`); `transitions-st` §3.6 → F1B-08 (`:507-524`).
- [x] 9. Artefactos del ciclo escritos y verificados por lectura directa: `proposal.md`, `design.md`,
      `specs/remisiones/spec.md`, `specs/tickets-core/spec.md`, todos bajo
      `openspec/changes/reasignar-desvios-huerfanos/`.

- [x] 10. Sanear el delta antes del archivo: `specs/tickets-core/spec.md` encabezaba §4.1 y §4.2 con
      «Comportamiento actual, a corregir en F1A» —épica cerrada— y llevaba diez citas de línea de antes
      de `9ed5635`. Fundirlo tal cual habría devuelto a la spec principal el destino muerto que
      `0a2c4ff` ya le había quitado. Verificación: `grep -n "a corregir en F1A"` sobre
      `openspec/changes/reasignar-desvios-huerfanos/specs/` devuelve cero; las citas nuevas
      (`ticketService.ts:81-86`, `:128-129`; `ticketService.test.ts:194`, `:205`, `:302-314`, `:315`,
      `:327`, `:336`) comprobadas una a una contra el fichero.

- [x] 11. Cerrar los 10 hallazgos de citas de `sdd-verify` (PASS WITH WARNINGS, 0 críticos). El que
      importaba: **`specs/remisiones/spec.md` citaba `ticketService.ts:100` —hoy una línea en blanco—
      dos veces**, y ese delta SÍ se funde en la spec viva. Es **la misma cita, del mismo código**, que
      la tarea 10 ya había corregido en el delta hermano de `tickets-core` §4.2. *La lección: el
      saneamiento se hizo **fichero a fichero** en vez de **cita a cita**, y la hermana se quedó
      fuera.* Corregidos además `CLAUDE.md:130-134`→`:188-208` (tareas 1 y 3 y `design.md:6`),
      `:131`→`:204` (tarea 2 y fila H2), `:121-126`→`:194-199` (tarea 3),
      `tickets-core/spec.md:238,255`→`:312`/`:329` (tarea 5), `test.ts:313-317`→`:321-326` (tarea 6),
      `config.yaml:415,428`→`:418`/`:431` (tarea 7). **Dos sitios quedan fuera de este cambio a
      propósito**: `ticketService.test.ts:176` y `:179` citan `:319` donde hoy es `:327`, y ese fichero
      lo está reescribiendo `mensaje-422-cliente-duplicado`; van en su fase de re-anclaje, que corre
      con el código ya congelado.

      **Verificación, y el detector que hubo que corregir.** El primero que se escribió —
      `grep -rn "ticketService.ts:100"` sobre la carpeta del cambio «devuelve cero»— **es falso**:
      devuelve **cinco**, y las cinco son legítimas. Son la estancia de auditoría: la nota «Saneado»
      que describe el defecto (`specs/remisiones/spec.md:9`), esta misma tarea (`tasks.md:78`, `:88`) y
      dos del `verify-report.md` (`:123`, `:174`). Un grep literal de la cadena que un saneamiento
      retira **siempre** vuelve distinto de cero si el rastro de auditoría la cita — es exactamente lo
      que le pasó a `sdd-verify` con `grep "a corregir en F1A"`, que devolvió cuatro por la misma razón.
      El detector que sí discrimina es **por sitio, no por cadena**:
      `grep -rn "ticketService.ts:100" openspec/changes/reasignar-desvios-huerfanos/specs/` devuelve
      **una** aparición, en la cabecera `Saneado` de `remisiones/spec.md`, y **ninguna dentro de un
      `### Requirement:`** — que es lo único que `sdd-archive` funde en la spec viva.

## C. Entregado a Gerencia — handoff, no tareas de este cambio

**Por qué no son casillas.** El contrato del ciclo exige que *todas* las tareas estén completas para
que `verify` y `archive` pasen a `ready` (`~/.claude/skills/_shared/sdd-status-contract.md:138` y
`:141`). Una casilla cuyo dueño es una persona ajena al repositorio no la puede marcar ninguna tanda:
mientras estuvieran aquí como tareas, este cambio no se podía archivar **nunca** por esa vía. No era un
descuido de ejecución sino un error de modelado —se registró como trabajo pendiente lo que en realidad
era una entrega—, y el propio encabezado de la sección ya lo decía («de Gerencia, no de esta tanda»).
Lo que este cambio debía hacer con los tres puntos era **enrutarlos y dejarlos escritos**, y eso está
hecho y verificado en las tareas 1, 2 y 4.

| # | Punto abierto | Dónde queda escrito | Dueño |
|---|---|---|---|
| H1 | Punto abierto nº 52 del maestro: cardinalidad OV↔ticket. Sin clave en la tabla de decisiones del plan (`openspec/config.yaml:434-437`, verificado por `grep` sobre el plan entero) | `tickets-core` §4.2, `remisiones` §5.1, entrada 5.b de `docs/sdd/F0-01_Correcciones_para_el_plan.md` | Gerencia |
| H2 | `decision/vista-todos-tablero` (IV-7): renombrar la vista «Todos» o cambiar lo que devuelve. Sin clave asignada | `CLAUDE.md:204`, `openspec/config.yaml` (`incumplimientos_vivos`) | Gerencia |
| H3 | Aplicar al plan la entrada 5 de `docs/sdd/F0-01_Correcciones_para_el_plan.md`. El plan lo mantiene Gerencia; ninguna tanda lo edita directamente | `docs/sdd/F0-01_Correcciones_para_el_plan.md:243,280,304` | Gerencia |

Los tres van al documento del viernes (`docs/sdd/Puntos_para_Gerencia_2026-09-11.md`). Archivar este
cambio **no los cierra ni los da por decididos**: siguen vivos en `CLAUDE.md`, en `config.yaml` y en
las specs, que es donde una tanda futura los volverá a encontrar.

## Recuento

**11 completas de 11.** Los tres puntos de Gerencia salen del recuento porque no son trabajo de este
cambio: son su entrega. Ver §C.
