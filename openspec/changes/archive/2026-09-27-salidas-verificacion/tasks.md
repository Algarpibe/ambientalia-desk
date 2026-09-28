# Tareas: las dos salidas de `Verificación` (F1A-03)

## Review Workload Forecast

| Campo | Valor |
|---|---|
| Líneas estimadas (código+pruebas) | ~12 (`transitions.ts`) + ~90 (seis ficheros de prueba) ≈ 102 |
| Líneas totales del lote (con apply-progress) | ~180-450, sobre techo de 800 |
| Riesgo de presupuesto (400/800) | Bajo |
| PRs encadenados | No |
| División sugerida | un solo PR |
| Estrategia de entrega | ask-on-risk |
| Estrategia de encadenado | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

`verify-report.md` (~350) y el `archive-report.md` son intentos aparte del ledger de `sdd-attempt`, no
suman a este lote (regla del ciclo 2).

### Suggested Work Units

| Unit | Objetivo | PR | Comando de prueba enfocado | Arnés de ejecución real | Frontera de reversión |
|---|---|---|---|---|---|
| 1 | Rojo de los seis ficheros de prueba + dato de `transitions.ts` en verde | PR 1 | `npx vitest run packages/shared/src/invariantesGrafo.test.ts packages/shared/src/reentrancia.test.ts apps/desk/server/permisos.test.ts apps/desk/server/transicionesEjecucion.test.ts apps/desk/server/flujoEquipoNuevo.test.ts apps/desk/server/services/avisoArea.test.ts` | Ticket real `Equipo nuevo` en `Verificación` vía `POST /api/tickets/:id/transition` (P7, `flujoEquipoNuevo.test.ts`) | Revertir el commit del dato (`transitions.ts`) y las siete ediciones de prueba; sin migración |

## Fase 1 — Rojo (strict TDD, antes de tocar `transitions.ts`)

- [x] 1.1 `packages/shared/src/invariantesGrafo.test.ts`: `:172-174` 39→40 (`"34+5"→"34+6"`); `:177-180`
      `sinSalida` → exactamente `['Finalizado']`, retirar «excepción nombrada»; `:200-208` seis pares
      (añadir `rechazo_verificacion`, `liberacion.from` con los dos orígenes) y afirmar que las salidas
      de `Verificación` son exactamente `liberacion` + `rechazo_verificacion`; `:211` «cinco»→«seis».
- [x] 1.2 `packages/shared/src/reentrancia.test.ts`: `:191-194` ciclo →
      `['Ingresado','En Proceso','Notificado','Verificación']` (orden de aparición,
      `reentrancia.ts:108-117`); confirmar que `:198` sigue en `[]` (cero campos de fecha).
- [x] 1.3 `apps/desk/server/permisos.test.ts`: título/comentario `:208-219` «5×3»→«6×3»; `:243-248`
      15/10/5 → 18/12/6.
- [x] 1.4 `apps/desk/server/transicionesEjecucion.test.ts`: `:302-307` añadir fila
      `rechazo_verificacion: { desde: ['Verificación'], a: 'Notificado' }` y `liberacion.desde` →
      `['En Proceso','Verificación']`; `:334-354` reescribir el barrido para recorrer **cada** entrada
      de `t.from` (no `t.from[0]`); `:358` 5→7.
- [x] 1.5 `apps/desk/server/flujoEquipoNuevo.test.ts`: `:93-106` P6 recorre **cada** entrada de `t.from`
      (7×403, en vez de `t.from[0]`); añadir **P7** al final: ticket `Equipo nuevo` sembrado en
      `Verificación` — `liberacion` → `200`/`Finalizado`, y por separado `rechazo_verificacion` →
      `200`/`Notificado`.
- [x] 1.6 `apps/desk/server/services/avisoArea.test.ts`: +1 caso al final — importar
      `TRANSITIONS_EQUIPO_NUEVO` de `@ambientalia/shared` y afirmar
      `areasSiguientes('Verificación', TRANSITIONS_EQUIPO_NUEVO)` = `['Servicio Técnico']` y
      `areasAAvisar('Verificación', ['Servicio Técnico'], TRANSITIONS_EQUIPO_NUEVO)` = `[]`.
- [x] 1.7 `npm test` — confirmar que los seis ficheros fallan en rojo contra el catálogo de 5
      transiciones sin tocar; anotar los nombres de prueba que fallan.

## Fase 2 — Verde: cambio de datos en `transitions.ts`

- [x] 2.1 `packages/shared/src/transitions.ts:359` en su sitio — `from: ['En Proceso']` →
      `from: ['En Proceso', 'Verificación']` en la entrada `liberacion`.
- [x] 2.2 Añadir tras `:360` (antes del `]` de `:361`):
      `{ id: 'rechazo_verificacion', name: 'Rechazo de verificación', from: ['Verificación'], to: 'Notificado', area: 'Servicio Técnico', fields: [comment(), derivacion()] }`.
- [x] 2.3 Reescribir el comentario `:343-345` en tres líneas: las dos salidas ya existen, con su
      decisión (D3 de `design.md`); retirar la mención de excepción del invariante 3.
- [x] 2.4 `:347` «las cinco son `Servicio Técnico`» → «las seis son `Servicio Técnico`», en su sitio —
      cero desplazamiento de línea hasta `:361`.
- [x] 2.5 `npm test` — confirmar que las siete pruebas de la Fase 1 pasan a verde.

## Fase 3 — Mutación (regla de mutación 2, guardián de `transitions.ts`)

- [x] 3.1 M1 — quitar `'Verificación'` de `liberacion.from`; `npm test`; anotar qué se pone rojo
      (pares RQ-EN-01, salidas exactas, espejo `CASOS_EQUIPO_NUEVO`, recuento 7, P7); revertir.
- [x] 3.2 M2 — borrar `rechazo_verificacion`; `npm test`; anotar rojo (recuento 40, pares, reentrancia,
      matriz 18/12/6, P7); revertir.
- [x] 3.3 M3 — M1+M2 a la vez; `npm test`; confirmar que **esta vez sí** se pone rojo el invariante 3
      (`:177-180`) — es la única mutación que lo alcanza; revertir.
- [x] 3.4 M4 — área de `rechazo_verificacion` → `'Comercial'`; `npm test`; anotar rojo (corrección (b)
      `:211`, matriz de permisos); revertir.
- [x] 3.5 Registrar los cuatro resultados (prueba, rojo/verde) en la nota de apply-progress.

## Fase 4 — Comprobación regla invariable 13 (regla de mutación 3)

- [x] 4.1 Confirmar `git diff --stat -- apps/desk/src` vacío para este cambio.
- [x] 4.2 Enumerar, decisión a decisión (tabla de `design.md`): qué transiciones ofrece el panel en
      `Verificación` → impuesto por `ticketService.ts:125` (flujo) y `:126-128` (origen); filtro por
      área (`TransitionPanel.tsx:57`) → impuesto por `:129-131`, probado por la matriz 6×3; campos del
      formulario → impuestos por `buildTransitionPlan` `:133-134`/`:138-142`. Cero decisiones nuevas en
      el cliente.

## Fase 5 — Cierre

- [x] 5.1 `npm test` completo, en verde.
- [x] 5.2 `npm run typecheck`.
- [x] 5.3 `npm run lint`.
- [x] 5.4 `npm run build`.
- [x] 5.5 Barrido de citas (regla de mutación 4): `grep -rnoE "transitions\.ts:[0-9]+(-[0-9]+)?"` sobre
      el repo, más un segundo pase por forma abreviada (`` `:NNN-NNN` `` sin nombre de fichero) en los
      ficheros que ya citan el módulo; repetir para los seis ficheros de prueba tocados
      (`invariantesGrafo.test.ts`, `reentrancia.test.ts`, `permisos.test.ts`,
      `transicionesEjecucion.test.ts`, `flujoEquipoNuevo.test.ts`, `avisoArea.test.ts`); clasificar cada
      resultado A (presente) / B (histórico, con revisión nombrada) / C (superado); `proposal.md` y
      `design.md` ya declaran que `:350-361`→`:350-363` se desplaza (caso A esperado).
- [x] 5.6 Detector de citas del `pre-push`: no hay script dedicado en `package.json` (sin entrada
      `citas`/`detector`); ejecutar directamente `npx tsx apps/desk/server/citas/cli.ts --sha <commit>`
      sobre el commit candidato, o dejar que corra el hook instalado (`core.hooksPath=.githooks`) al
      hacer `push`. Salida `1` (bloqueo) o `2` (fallo operativo) para antes del `archive`.
- [x] 5.7 Confirmar en `docs/sdd/ENTRADA.md` que E-082 (`:1187-1192`) y E-083 (`:1194-1199`) siguen
      escritas, y marcar el criterio «0 citas rotas nuevas» de `proposal.md` tras 5.5-5.6 en verde.

## Comprobaciones de persona — fuera del recuento (regla del ciclo 1)

No cuentan como tareas; archivar este cambio no las da por hechas.

- **E-082** (guarda de gas patrón por familia/compuesto) — dueño: Gerencia, con validación de Calidad;
  escrita en `docs/sdd/ENTRADA.md:1187-1192`; destino propuesto: fila F1A-03, segunda parte.
- **E-083** (guarda de certificado en `Liberación` desde `Verificación`) — dueño: Gerencia (Calidad);
  escrita en `docs/sdd/ENTRADA.md:1194-1199`; destino propuesto: fila F1A-03 si se exige, o pasaje del
  expediente R08.3 si se retira.
- **Verificación en la app tras despliegue** — dueño: Servicio Técnico / Gerencia; sin fichero propio
  todavía; se hace sobre `ambientalia-desk.ambientalia.cloud` una vez desplegado, siguiendo la
  convención de verificación en producción del proyecto.
- **Comprobación de persona nº 2** heredada de `blueprint-equipo-nuevo` — «un ticket en `Verificación`
  cae en columna “Otros” del tablero (sin columna propia)»; dueño: Servicio Técnico; re-observar tras
  este despliegue, porque `Verificación` deja de ser un callejón sin salida; escrita en
  `openspec/changes/archive/2026-09-25-blueprint-equipo-nuevo/archive-report.md:84-89`.
