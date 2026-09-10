# Apply progress: vista-todos-y-estados-en-espera

**Tanda A · F1B-08 · base `8d0c4b5`.** Ejecutado en un solo intento SDD, commiteando por unidad de
trabajo (5 unidades de código + 1 commit de corrección de lint descubierto en verificación + 1 commit
final de bookkeeping). Modo: **Strict TDD** (config: `interactive · hybrid · ask-on-risk · 800 líneas ·
strict_tdd`, `openspec/config.yaml:22-30`).

## Estado

**40/40 tareas de `sdd-apply` completas** (Fases 0-6, `tasks.md` líneas 93-293). Las 2 tareas de
`## Fuera de sdd-apply — destino sdd-archive` (reanclar `permissions/spec.md`, cerrar filas IV-1/IV-5)
quedan **sin marcar a propósito**: no son mías (regla del ciclo 1). Las 5 comprobaciones manuales de
`## Fuera del recuento` tampoco cuentan — dueño fuera del repositorio.

## Commits (work-unit-commits, conventional, sin atribución IA)

| Commit | Unidad | Ficheros |
|---|---|---|
| `c30c74c` | 1 · Remisión creada → interna (P21) | `estados.ts`, `estados.test.ts` |
| `b07c91c` | 2 · boardView consume ESTADOS_EN_ESPERA (IV-1) | `boardView.ts`, `boardView.test.ts`, `estados.test.ts` |
| `52277b4` | 3 · VistaKey derivada + default: separado | `boardView.ts`, `boardView.test.ts`, `App.tsx`, `Sidebar.tsx` |
| `0163ba8` | fix · lint `no-unused-vars` en guarda `never` (descubierto en verificación de Fase 5, pertenece a Unidad 3) | `boardView.ts` |
| `b4576ef` | 4 · «Todos» trae cerrados paginados (RQ-VT-01) | `boardView.ts`, `boardView.test.ts`, `App.tsx`, `columns.ts` |
| `48d7545` | 5 · TicketCard reclavado (IV-5) | `TicketCard.tsx` |

Fase 0 y Fase 6 no generan commit propio: son control de mutación y verificación transversal sin
cambio de producto que sobreviva (todo revertido tras comprobarse).

---

## Fase 0 — Control de mutación previo (P2)

- [x] 0.1 Quitado temporalmente `t.statusType !== 'Closed' &&` de `boardView.ts:44` (rama `espera`).
  `npm test -- apps/desk/src/lib/boardView.test.ts` → **10/10 verde**, igual que antes de mutar.
  **Confirma el hueco**: el fixture de entonces no tenía ningún `Closed` en estado de espera, así que
  nada detectaba el filtro que faltaba. Cerrado por RQ-VT-05 en la Fase 2.
- [x] 0.2 Revertido antes de seguir. `git diff --stat` sobre el fichero, vacío tras revertir. No se
  commiteó nada de esta fase.

## Fase 1 — Dominio: `Remisión creada` → `interna` (P21)

RED confirmado: 4/4 pruebas rojas por la razón correcta (contenido de listas, no error de sintaxis) —
`npm test -- packages/shared/src/estados.test.ts` → 4 failed / 9 passed. GREEN: `estados.ts:78`
(`'Remisión creada': 'interna'`, al final del bloque `interna`, con derivación escrita) →
`npm test -- packages/shared/src/estados.test.ts` → **13/13 verde**.

**Control de mutación P4**: revertida la entrada a `'ninguna'`, corrida en solitario la prueba de la
suma de longitudes (`3+5+12+1=21` original) → **sigue verde** (`npm test -- ... -t "3 \+ 5 \+ 12 \+ 1
= 21"` → 1 passed, 12 skipped). Confirma que la suma NO es el detector real; lo son las cuatro listas
explícitas. Revertido tras comprobarlo.

**Deviación declarada, no de diseño**: se corrigen también las cifras «ocho»/«OCHO»/«CINCO» de los
comentarios de cabecera de `estados.ts` (líneas 21, 28, 109, 135-138 tras el cambio) a «nueve»/«NUEVE»/
«SEIS», porque quedaban prosa falsa tras la reclasificación y la regla de método del proyecto exige
que las afirmaciones sobre el código sean ciertas. No estaba en `tasks.md` como tarea numerada; es una
consecuencia directa y mínima de 1.4.

## Fase 2 — IV-1: `boardView` consume `ESTADOS_EN_ESPERA` (RQ-VT-04, RQ-VT-05)

- [x] 2.1 Fixture corregido (`'En espera de repuesto'` → `'En Espera de Repuestos'`). Confirmado que
  `:20`/`:21` seguían verdes ANTES de tocar `boardView.ts` (10/10) — la regex vieja también casaba con
  la cadena correcta por coincidencia.
- [x] 2.2-2.3 Añadidos los seis casos de RQ-VT-04 (`Servicio externo`, `Notificación cliente`,
  `Notificación a Compras`, `Notificación Comercial`, `Solicitado`, `Liberación Comercial`) y el caso
  nuevo de RQ-VT-05 (`Closed` en estado de espera).
- [x] 2.4 RED confirmado: **6 failed / 11 passed** — exactamente los seis casos nuevos de RQ-VT-04; el
  caso RQ-VT-05 se quedó verde solo, como predecía la tarea (el filtro `statusType !== 'Closed'` ya
  existía).
- [x] 2.5-2.6 GREEN: `boardView.ts:39` consume `(ESTADOS_EN_ESPERA as readonly string[]).includes(...)`
  → **17/17 verde**.
- [x] 2.7 Tripwire real confirmado: es el mismo bloque de 2.1-2.2, sin prueba aparte.
- [x] 2.8 **Control de mutación P3**: revertida la regex a `/espera/i` con el tripwire falso aún
  presente. `npm test -- boardView.test.ts estados.test.ts` → boardView.test.ts **6 failed / 24
  passed** (RED), estados.test.ts **13/13 verde** (sin cambio). La discrepancia demuestra que el viejo
  vigilaba una copia. Revertido.
- [x] 2.9 Retirado el tripwire falso: comentario `estados.ts` antiguas líneas 102-113 + `it()` líneas
  114-122 (verificado de disco: el rango real era **112-120** para el `it(`, no «113-121» como citaban
  `proposal.md`/`design.md` — desajuste de una línea, igual que ya advertía `tasks.md`).
- [x] 2.10 `npm test -- estados.test.ts` → **12/12 verde** tras la retirada.

## Fase 3 — `VistaKey` derivada + `default:` separado (RQ-VT-02, RQ-VT-03)

RED confirmado: **2 failed / 15 passed** (`:23` clave desconocida, `:56`→`:90` viewLabel). GREEN:
`FUNCTIONAL_VIEWS` a `as const satisfies readonly BoardViewDef[]`, `VistaKey` derivado,
`vistaNoReconocida(_key: never)`, propagado a `App.tsx:57` (`useState<VistaKey>`) y `Sidebar.tsx:82`
(props tipadas). `npm test` (boardView) → **17/17 verde**; `npm run typecheck` → limpio.

**Control de mutación D2**: añadida temporalmente una séptima key `'huerfana'` a `FUNCTIONAL_VIEWS`
sin su `case`. `npm run typecheck` → **falla** exactamente en `boardView.ts(56,39): Argument of type
'string' is not assignable to parameter of type 'never'` — el argumento de `vistaNoReconocida(key)`.
Revertido; `npm run typecheck` vuelve a limpio.

**3.6 (verificación, no tarea nueva)**: confirmado que RQ-VT-03 lo cubre la combinación de los seis
`it()` ya existentes (uno por vista funcional, cada uno con aserción de contenido distinta de `[]`) más
la guarda `never`, que protege las vistas futuras que esos seis no pueden cubrir por definición. No se
añadió un séptimo test.

**Hallazgo de esta fase (bug propio, corregido durante verificación)**: al correr `npm run lint` en la
Fase 5, `boardView.ts:59` (`function vistaNoReconocida(_key: never)`) dio **error**
`@typescript-eslint/no-unused-vars`: el argumento único y no usado de una función SÍ se marca por
defecto (`after-used` sólo exime argumentos que preceden a uno usado; el guion bajo no basta). Corregido
con `void _key;` en el cuerpo (commit `0163ba8`, separado de la unidad 3 porque se descubrió después).

## Fase 4 — «Todos» = activos + cerrados paginados (RQ-VT-01)

RED confirmado: **1 failed / 16 passed** (`:18`, `todos` con cerrados intercalados). GREEN:
`case 'todos': return tickets` (sin filtro) → **17/17 verde**. `App.tsx`: `useAsync` compuesto que pide
`fetchActiveTickets()` + `fetchClosedTickets(closedPage)` en paralelo para `view === 'todos'`, sólo la
segunda para `cerrados`, sólo la primera para el resto; `tickets = [...activos, ...(cerrados?.items ??
[])]`; condición de `Pagination` de `isClosed && closedMeta` a `(view === 'todos' || view ===
'cerrados') && closedMeta`. `columns.ts:6` corregido (ya no afirma que un cerrado sale del tablero).
`npm run typecheck` y `npm run build` → limpios (único detector automático que alcanza `App.tsx`).

**Control de mutación P1**: refusionados temporalmente `case 'todos':`/`default:` en un solo cuerpo.
`npm test -- boardView.test.ts` → **exactamente 2 fallos**: «todos = activos y cerrados, sin filtrar»
(RQ-VT-01) y «key desconocida → vacío» (RQ-VT-02), ninguno más. Revertido.

**4.5 (hallazgo de esta fase, no de `design.md`)**: el orden «activos antes que cerrados, sin
entrelazar» de RQ-VT-01 vive en la concatenación de `App.tsx`, sin detector automático (`.tsx` fuera de
`vitest.config.ts:17-20`). Se declara aquí, misma clase que RQ-VT-06 — verificación manual pendiente,
ya anotada en `tasks.md` fila 5 de «Fuera del recuento».

## Fase 5 — `TicketCard` reclavado (IV-5, RQ-VT-06)

**Excepción declarada, sin rojo previo** (decisión de Gerencia F0-00). Import corregido a
`@ambientalia/shared`; `statusColorMap` reclavado con los ocho nombres reales del registro (se corrige
la truncadura `'En Espera de Repues...'` → `'En Espera de Repuestos'`); campo `label` retirado, el chip
pinta `ticket.status` verbatim.

**Control de mutación P5 — recuento antes/después de `npm test`:**

| Momento | Ficheros | Pruebas |
|---|---|---|
| Antes de 5.1/5.2 | 113 (112 passed, 1 skipped) | 1011 (1009 passed, 2 skipped) |
| Después de 5.1/5.2 | 113 (112 passed, 1 skipped) | 1011 (1009 passed, 2 skipped) |

**Idéntico** — prueba de disco de que `vitest.config.ts:17-20` excluye de verdad los `.tsx`: ningún
test recoge este cambio, ni para bien ni para mal.

`npm run typecheck`, `npm run lint` (0 errores / 158 avisos), `npm run build` → limpios.

## Fase 6 — Verificaciones transversales

- [x] 6.1 **Regla 13 verificada contra el código final** (no rehecha):

  | # | Decide el cliente | Línea del servidor | Veredicto | Verificado |
  |---|---|---|---|---|
  | 1 | Qué tickets enseña cada vista (`boardView.ts:38`) | Ninguna — `tickets.ts:104-116` da la misma lista a todo autenticado | Comodidad ya adjudicada | Sí, código final leído |
  | 2 | Qué es «en espera» (`ESTADOS_EN_ESPERA`) | Ninguna, no hace falta | Consumo de dominio | Sí |
  | 3 | Tamaño de página del bloque cerrado | `tickets.ts:106` (`pageSize=50`), `:107` clamp | Imposición probada: `tickets.test.ts:84` | Sí, línea confirmada |
  | 4 | Qué es «cerrado» (`boardView.ts:41`) | `repo.ts:139`, `repo.ts:124` | Espejo legítimo: `tickets.test.ts:72,87` | Sí |
  | 5 | Qué devuelve clave desconocida | Ninguna | Presentación | Sí |
  | 6 | Color de la tarjeta | Ninguna | Presentación pura | Sí |
  | 7 | Pedir `?scope=closed&page=N` en «Todos» | `tickets.ts:105,107` | Imposición probada: `tickets.test.ts:90-99` | Sí, escenario confirmado, y ahora SÍ se ejercita desde «Todos» |

  Las 7 filas siguen ciertas. Ninguna guarda nueva en el cliente.

- [x] 6.2 **Control P1-bis**: `tickets.ts:106` `pageSize` de 50 a 5 temporalmente. Con los 3 cerrados
  de `seedMixed` (`tickets.test.ts:57-63`), `items` sigue ≤3 (≤5). Resultado: **sólo `:84`
  (`pageSize`) rompe**; `:86` (`items.length ≤ pageSize`, se autoajusta) y `:87`
  (`items.every(Closed)`) siguen verdes, igual que `:90-99` (página 99). `npm test --
  apps/desk/server/tickets.test.ts` → 1 failed / 35 passed, exactamente la fila predicha. Revertido —
  `tickets.ts` no se modifica como parte del alcance.
- [x] 6.3 Suite completa: `npm test` → **1009 passed / 2 skipped (1011)**, 112 ficheros passed / 1
  skipped (113). `npm run typecheck` → limpio. `npm run lint` → **0 errores / 158 avisos** (trinquete
  de `ci.yml:41`, sin superarlo). `npm run build` → limpio.
- [x] 6.4 **Hallazgo de esta fase**: el control positivo original de la tarea (`estados.ts:104`, cadena
  `/espera/i` en comentario) **ya no existe** — la tarea 2.9, ejecutada antes en esta misma tanda,
  retiró correctamente ese comentario al cerrar IV-1 (documentaba el defecto ya arreglado). Se usa un
  control positivo equivalente: `apps/desk/src/components/ClienteDetalle.tsx` (fichero ajeno, no
  tocado, fuera del alcance de esta tanda), que sigue usando `/espera/i` de verdad.

  ```
  grep -n "espera/i" apps/desk/src/lib/boardView.ts         → sin resultados (exit 1)
  grep -n "espera/i" apps/desk/src/components/ClienteDetalle.tsx → 2 resultados (exit 0)
  ```

  Confirma que `boardView.ts` no tiene ninguna `/espera/i` residual, y que el `grep` en sí funciona
  (no es un patrón roto que dé cero por defecto). **Observación incidental, fuera de alcance**:
  `ClienteDetalle.tsx:18,22` tiene su propia clasificación independiente por regex sobre `TicketLite`,
  no tocada por `design.md` (no está en su lista de 9 ficheros) ni por `tasks.md`. No se registra como
  incumplimiento nuevo aquí — no es tarea de esta tanda determinarlo.

---

## Comprobación explícita — `packages/shared/src/sla.test.ts` NO se toca

Verificado de disco tras la Fase 1: `npm test -- packages/shared/src/sla.test.ts` → **15/15 verde**.
Cadena de razonamiento confirmada contra el código final:
- `sla.ts:34` (`'Notificado': 24`) es la única entrada de `SLA_HORAS_POR_ESTADO` — sin cambios.
- `estados.ts` clasifica `'Notificado': 'ninguna'` — esta tanda no lo toca.
- `ESTADOS_EN_ESPERA` es derivada (`estados.ts:114-117`, `ESTADOS.filter` sobre `CLASIFICACION_EN_ESPERA`).
- `conSla = ['Notificado']`, que sigue `'ninguna'` → intersección con `ESTADOS_EN_ESPERA` vacía →
  `sla.test.ts:52` (`expect(conSla.filter(...)).toEqual([])`) sigue verde.

Fichero `sla.test.ts` **no fue editado** en ningún commit de esta tanda (confirmado con
`git log --follow -p` sobre los 6 commits: cero menciones al fichero fuera de esta lectura de
verificación).

---

## TDD Cycle Evidence (Strict TDD)

| Tarea | RED | GREEN | REFACTOR / Control |
|---|---|---|---|
| 1.2-1.4 (Remisión creada → interna) | 4 failed / 9 passed, razón correcta | 13/13 verde | Control P4: sum-test sigue verde con mutación → confirma detector real son las 4 listas |
| 2.1-2.5 (boardView consume ESTADOS_EN_ESPERA) | fixture: 10/10 verde (regex coincidía por azar); 6 casos nuevos: 6 failed/11 passed | 17/17 verde | Control P3: real rojo (6 failed), falso verde (13/13) tras revertir regex |
| 2.9 (retirar tripwire falso) | N/A (retirada, no feature) | 12/12 verde | — |
| 3.1-3.2 (VistaKey + default separado) | 2 failed / 15 passed | 17/17 verde + typecheck limpio | Control D2: typecheck falla con key sin `case`, mensaje exacto sobre `never` |
| 4.1-4.2 («Todos» trae cerrados) | 1 failed / 16 passed | 17/17 verde | Control P1: exactamente 2 fallos al refusionar todos/default |
| 5.1-5.2 (TicketCard reclavado) | N/A — excepción declarada, `.tsx` fuera de red de pruebas | N/A | Control P5: recuento idéntico antes/después (113 ficheros / 1011 pruebas) |
| 6.2 (control P1-bis, sin cambio de producto) | N/A | N/A | pageSize 50→5: sólo `:84` rompe, confirma que el resto mide contenido no envoltorio |

## Work Unit Evidence

| Unidad | Focused test | Resultado | Runtime harness | Rollback boundary |
|---|---|---|---|---|
| 1 | `npm test -- packages/shared/src/estados.test.ts` | 13/13 verde | N/A — dato en código, sin endpoint propio | Revertir `estados.ts:78` (mover a `ninguna`) y las 4 pruebas — sin efecto en datos |
| 2 | `npm test -- apps/desk/src/lib/boardView.test.ts` | 17/17 verde | Manual tras despliegue: vista «Tickets en espera», confirmar `Notificación cliente`/`Servicio externo` | Revertir `boardView.ts:39` (import + `enEspera`) y las pruebas nuevas |
| 3 | `npm run typecheck` + `npm test -- boardView.test.ts` | typecheck limpio, 17/17 verde | N/A — `default:` inalcanzable desde la interfaz | Revertir `boardView.ts`+`App.tsx`+`Sidebar.tsx` juntos (único acoplamiento) |
| 4 | `npm test -- boardView.test.ts` (caso `todos`) | 17/17 verde; sin detector automático para `App.tsx` | Manual tras despliegue: vista «Todos», cerrados tras activos sin intercalar, «Página X de Y · N cerrados» | Revertir `App.tsx` y `case 'todos'` — sólo lectura |
| 5 | N/A — `.tsx` fuera de red de pruebas | Control: recuento idéntico 113/1011 antes-después | Manual tras despliegue: 4 comprobaciones de color (fuera del recuento) | `git revert` del fichero — vuelve el respaldo `bg-slate-100` |

---

## Deviaciones de diseño

Ninguna deviación de fondo. Tres ajustes menores, todos documentados en su fase arriba:

1. Corrección de las cifras «ocho»→«nueve» en comentarios de cabecera de `estados.ts` (consecuencia
   directa de 1.4, no estaba numerada en `tasks.md`).
2. `void _key;` en `vistaNoReconocida` para satisfacer `@typescript-eslint/no-unused-vars` (design.md
   citaba el cuerpo sin él; el lint del repositorio lo exige).
3. Control positivo alternativo de la tarea 6.4 (`ClienteDetalle.tsx` en vez de `estados.ts:104`,
   retirado legítimamente por la tarea 2.9 de esta misma tanda).

## Riesgos / hallazgos para el orquestador

- El `git log` de esta tanda (6 commits) está **completo y aislado**: ningún commit toca
  `openspec/specs/`, `openspec/config.yaml`, `CLAUDE.md` ni los 7 ficheros sin trackear de `docs/`.
- Las 2 tareas de «Fuera de sdd-apply» (reanclar `permissions/spec.md`, cerrar filas IV-1/IV-5) quedan
  para `sdd-archive`, según lo previsto.
- `ClienteDetalle.tsx:18,22` tiene su propia clasificación por `/espera/i`, independiente de
  `ESTADOS_EN_ESPERA` — no es un IV nuevo de esta tanda (fuera de los 9 ficheros de `design.md` §4),
  se deja anotado por si Gerencia quiere evaluarlo en una tanda futura.
