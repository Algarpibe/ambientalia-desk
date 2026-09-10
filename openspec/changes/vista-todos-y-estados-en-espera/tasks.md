# Tasks: la vista «Todos» deja de mentir, y las esperas dejan de adivinarse

**Tanda A · F1B-08 · base `b0bb704` (rama `main`).** Toda cita verificada de disco en esta sesión
contra el árbol de trabajo, no heredada de `proposal.md` ni de `design.md` sin comprobar. Donde este
documento corrige o afina algo que los artefactos anteriores decían, se marca explícitamente como
**«hallazgo de esta fase»**, no como una tarea nueva de alcance.

**Nota de proceso.** Este artefacto excede el presupuesto genérico de 530 palabras del skill
`sdd-tasks` a propósito, con el mismo criterio que ya usó `sdd-spec` (obs. 432): la regla de método
del proyecto exige ruta y línea por afirmación, y bajo `strict_tdd` cada pieza lleva su rojo, su
verde y su ejecución de control. Comprimir por debajo del umbral habría cortado alguna de las tres.

---

## Review Workload Forecast

**⚠️ El presupuesto no lo decide el código. Lo decide el árbol entero del intento.**
`gentle-ai sdd-attempt` mide `changed_lines` diffeando el árbol completo entre el principio y el
final del intento (`CLAUDE.md`, regla del ciclo 2), y los artefactos SDD ya escritos en este árbol
**cuentan como líneas del intento**, no sólo el código. Verificado de disco, contando líneas totales
de cada fichero con el `Read` de esta misma sesión:

| Artefacto | Líneas (fichero completo, nuevo en este árbol) |
|---|---|
| `proposal.md` | 393 |
| `specs/vistas-tablero/spec.md` | 165 |
| `specs/transitions-st/spec.md` (delta) | 155 |
| `design.md` | 310 |
| `tasks.md` (este fichero) | ~330 (estimado tras escribirlo) |
| **Subtotal artefactos SDD, todo adición pura** | **≈ 1.353** |

Eso **ya supera los 800** de `review_budget_lines` antes de tocar una sola línea de código, y antes de
que existan `verify-report.md` ni `archive-report.md`. Precedente exacto en este mismo repositorio
(`CLAUDE.md`, regla del ciclo 2, tanda del 10/09): esos dos informes sumaron **+206** y **+125**
respectivamente en un intento SDD normal. Proyectando la misma magnitud:

| Bloque | Líneas estimadas |
|---|---|
| Artefactos SDD ya en el árbol (proposal+specs+design+tasks) | ≈ 1.353 (adición pura) |
| Código + pruebas (tabla de abajo) | 133-207 (mezcla add/del) |
| `verify-report.md` (proyectado por precedente) | ≈ 200 |
| `archive-report.md` (proyectado por precedente) | ≈ 125 |
| **Total estimado del intento completo** | **≈ 1.811-1.885** |

**Código + pruebas, por fichero** (estimación de esta fase sobre el diseño ya cerrado, no la de
`proposal.md` §10, que no conocía aún D2/D3/D5):

| Fichero | Acción | Líneas est. |
|---|---|---|
| `packages/shared/src/estados.ts` | Reclasificar una entrada | 5-8 |
| `packages/shared/src/estados.test.ts` | 4 bloques al nuevo reparto + retirar tripwire falso (~20 líneas) | 40-55 |
| `packages/shared/src/columns.ts` | Sólo el comentario de la línea 6 | 1-3 |
| `apps/desk/src/lib/boardView.ts` | `VistaKey` derivada, consumo de `ESTADOS_EN_ESPERA`, `todos`/`default` separados | 15-25 |
| `apps/desk/src/lib/boardView.test.ts` | Fixture, tripwire real, seis estados, RQ-VT-05, `todos`/`default` | 55-75 |
| `apps/desk/src/App.tsx` | Fetch compuesto, tipos `VistaKey`, `Pagination` en «Todos» | 20-35 |
| `apps/desk/src/components/Sidebar.tsx` | Sólo tipos (línea 82) | 2-4 |
| `apps/desk/src/components/TicketCard.tsx` | Mapa reclavado, `label` retirado, import corregido | 15-25 |
| `apps/desk/src/api/client.ts` | Sin cambios (D1) | 0 |
| **Total código + pruebas** | | **153-230** |

```text
Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High
```

(El literal de guarda pide «400-line»; el valor operativo de esta tanda es
`review_budget_lines: 800`. El riesgo es **High** contra cualquiera de los dos umbrales: ≈1.811-1.885
duplica holgadamente los 800, y el código solo ya está en el rango medio incluso sin los artefactos.)

**Lo que partir el código NO arregla.** Aunque el código se trocee en cinco PR perfectos, el intento
SDD medido por `sdd-attempt` sigue sumando los ≈1.353 de artefactos y los ≈325 de informes futuros,
porque el diff es del árbol completo, no del código. Partir en PR ayuda a la **carga cognitiva del
revisor humano** (objetivo real del guardia de 800 líneas) pero no cambia lo que mide el propio
`sdd-attempt`. Por eso `Chain strategy: pending`: la decisión real que le toca al orquestador con
`ask-on-risk` no es sólo «¿cómo trocear el código?», es **«¿se acepta el intento completo con
`size:exception`, se reinicia el `sdd-attempt` tras aislar el árbol, o se pide una forma de contar que
no penalice los artefactos generados?»** — ninguna de las tres la decide esta fase.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | `Remisión creada` → `interna` (P21) | PR 1 | `npm test -- packages/shared/src/estados.test.ts` | N/A — dato en código, sin endpoint ni UI propios en `packages/shared` | Revertir `estados.ts:90` y las 4 pruebas de `estados.test.ts`; sin efecto en datos (clasificación en código, no columna) |
| 2 | `boardView` consume `ESTADOS_EN_ESPERA` (IV-1, RQ-VT-04/05) | PR 2 | `npm test -- apps/desk/src/lib/boardView.test.ts` | Manual, tras despliegue: vista «Tickets en espera» en `ambientalia-desk.ambientalia.cloud`, confirmar un ticket en `Notificación cliente` o `Servicio externo` | Revertir `boardView.ts:35` + import; `boardView.test.ts` vuelve al fixture con el typo |
| 3 | `VistaKey` derivada + `default:` separado (RQ-VT-02/03) | PR 3 | `npm run typecheck` (detector primario) + `npm test -- apps/desk/src/lib/boardView.test.ts` | N/A — `default:` es inalcanzable desde la interfaz (`Sidebar.tsx:118-121`); nada en producción lo ejercita por sí solo | Revertir los **tres ficheros a la vez** (`boardView.ts`, `App.tsx`, `Sidebar.tsx`) — único acoplamiento de la tanda (design §9) |
| 4 | «Todos» = activos + cerrados paginados (RQ-VT-01) + comentario de `columns.ts` | PR 4 | `npm test -- apps/desk/src/lib/boardView.test.ts` (caso `todos`); **sin detector automático para `App.tsx`** (`.tsx` fuera de `vitest.config.ts:17-20`) | Manual, tras despliegue: vista «Todos», confirmar cerrados tras activos sin intercalar y «Página X de Y · {total} cerrados» | Revertir `App.tsx` y `case 'todos'` de `boardView.ts` — sólo lectura, sin migración |
| 5 | `TicketCard` reclavado (IV-5, RQ-VT-06) | PR 5 | N/A — `.tsx` fuera de red de pruebas por decisión de Gerencia (F0-00); control: contar ficheros/pruebas de `npm test` antes/después, exigir cifra idéntica | Manual, tras despliegue: 4 comprobaciones de color (§ tarea 5.3) | `git revert` del fichero — vuelve el respaldo `bg-slate-100` |

---

## Phase 0 — Control de mutación previo (P2), antes de tocar nada

- [x] 0.1 En `apps/desk/src/lib/boardView.ts:44` (`case 'espera': return tickets.filter((t) => t.statusType !== 'Closed' && enEspera(t))`), quitar temporalmente `t.statusType !== 'Closed' &&` y correr `npm test`. **Resultado esperado: sigue verde** — el fixture actual no tiene ningún ticket `Closed` en estado de espera (`'c'` es `Closed` pero `'Finalizado'`, `boardView.test.ts:12`, que no está en `ESTADOS_EN_ESPERA`). Confirma el hueco de detector que RQ-VT-05 va a cerrar en la Fase 2.
- [x] 0.2 Revertir el cambio de 0.1 (`git checkout` o deshacer a mano). No se commitea nada de esta fase.

---

## Phase 1 — Dominio: `Remisión creada` pasa a `interna` (P21)

**RED (ya escrito, no se inventa).** Cuatro pruebas de `packages/shared/src/estados.test.ts` se ponen
rojas solas al mover la entrada:

- [x] 1.1 Confirmar que hoy están verdes (línea base) y anotar su forma actual: `:33-41` (interna,
      cinco), `:43-58` (ninguna, doce, con `STATUS_REMISION_CREADA` en `:56`), `:84-95`
      (`ESTADOS_EN_ESPERA`, ocho), `:176-185` (derivación, «la quinta es Liberación Comercial»).
- [x] 1.2 Editar las cuatro para el nuevo reparto:
      - `:33-41` → añadir `'Remisión creada'` al final de la lista de `interna` (pasa a seis).
      - `:43-58` → quitar `STATUS_REMISION_CREADA` de la lista de `ninguna` (pasa a once).
      - `:84-95` → añadir `'Remisión creada'` al final de `ESTADOS_EN_ESPERA` (pasa a nueve).
      - `:176-185` → el cruce da **seis**, no cinco; las dos que sobran son `'Liberación Comercial'` y
        `'Remisión creada'`. **Añadir la aserción paralela de salidas** para `Remisión creada`
        (`TRANSITIONS.filter(t => t.from.includes('Remisión creada'))` → `['habilitar_servicio · Comercial']`,
        `transitions.ts:178`), igual que la ya existente para `Liberación Comercial` en `:183-184`.
- [x] 1.3 Ejecutar `npm test -- packages/shared/src/estados.test.ts` y confirmar que las cuatro están
      **rojas** por la razón correcta (contenido de la lista/cifra), no por un error de sintaxis.
- [x] 1.4 **GREEN**: en `packages/shared/src/estados.ts`, mover `'Remisión creada': 'ninguna',`
      (línea 90) **al final del bloque `interna`**, tras `'Liberación Comercial': 'interna'` (línea 74),
      reclasificada como `'interna'`. Añadir un comentario de una línea con la derivación (mismo estilo
      que `:72-74`): entra por `facturado`/similar, sale por `habilitar_servicio`
      (`transitions.ts:178`, área Comercial) → Servicio Técnico no puede moverla → tercero es «otra área
      de la casa» → `interna`.
- [x] 1.5 `npm test -- packages/shared/src/estados.test.ts` en verde.
- [x] 1.6 **Control de mutación P4**: devolver temporalmente la entrada a `'ninguna'` y correr
      `packages/shared/src/estados.test.ts:71-75` (`3+5+12+1=21`) en solitario. **Debe seguir verde** —
      confirma que la suma de longitudes no es el detector real; el detector real son las cuatro listas
      de 1.2. Revertir la mutación tras comprobarlo.

---

## Phase 2 — IV-1: `boardView` consume `ESTADOS_EN_ESPERA` (RQ-VT-04, RQ-VT-05)

- [x] 2.1 **RED que se auto-dispara**: corregir el fixture roto de `boardView.test.ts:11`, de
      `status: 'En espera de repuesto'` (no existe en el registro) a `status: 'En Espera de Repuestos'`
      (`estados.ts:61`, exacto). Correr `npm test -- apps/desk/src/lib/boardView.test.ts` **antes** de
      tocar `boardView.ts`: `:20` (`abiertos`) y `:21` (`espera`) siguen verdes por ahora porque la regex
      vieja también casaba con la cadena correcta.
- [x] 2.2 Añadir a `boardView.test.ts` un caso por cada uno de los **seis** estados que la regex vieja no
      reconocía (`Servicio externo`, `Notificación cliente`, `Notificación a Compras`,
      `Notificación Comercial`, `Solicitado`, `Liberación Comercial`) — un ticket abierto por estado,
      afirmando que cada uno cae en `espera` y en ninguno cae en `abiertos`. Cita: escenario de
      `vistas-tablero/spec.md:112-117` (RQ-VT-04). **Nota de esta fase**: `design.md` (paso 2, §7) sólo
      esboza un caso (`'Notificación cliente'`); el spec pide los seis explícitamente y es el contrato,
      así que esta tarea amplía la cobertura del esbozo de diseño a lo que el requisito promete, sin
      cambiar el mecanismo elegido.
- [x] 2.3 Añadir un caso **nuevo** (RQ-VT-05, cierra el hueco de la Fase 0): un ticket `statusType:
      'Closed'` con `status: 'Servicio externo'` (o cualquier estado de `ESTADOS_EN_ESPERA`) **NO**
      aparece en `ids('espera')`. Cita: `vistas-tablero/spec.md:139-145`.
- [x] 2.4 `npm test -- apps/desk/src/lib/boardView.test.ts` → confirmar rojo en `:20`/`:21` y en los
      casos nuevos de 2.2 (el 2.3 puede seguir verde: el filtro `statusType !== 'Closed'` de
      `boardView.ts:44` ya existe, sólo no estaba probado).
- [x] 2.5 **GREEN**: en `apps/desk/src/lib/boardView.ts`, importar `ESTADOS_EN_ESPERA` de
      `@ambientalia/shared` (junto al `import type { Ticket }` de la línea 1) y sustituir la línea 35
      (`const enEspera = (t: Ticket) => /espera/i.test(t.status ?? '')`) por
      `const enEspera = (t: Ticket) => (ESTADOS_EN_ESPERA as readonly string[]).includes(t.status ?? '')`
      (D3: un cast ensancha el tipo, no reescribe la regla; precedente `estados.test.ts:179`).
- [x] 2.6 `npm test -- apps/desk/src/lib/boardView.test.ts` en verde completo.
- [x] 2.7 **Tripwire real de IV-1** (ya cubierto por 2.1-2.2: el fixture corregido y los seis casos
      importan `applyBoardView` y afirman sobre su salida). Confirmarlo explícitamente en el PR: no se
      añade un test aparte con este único propósito, es el mismo bloque.
- [x] 2.8 **Control de mutación P3**: con el tripwire falso de `estados.test.ts` todavía presente,
      revertir temporalmente `boardView.ts:35` a `/espera/i`. Correr la suite completa:
      `boardView.test.ts` (tripwire real) debe ponerse **rojo**; `estados.test.ts:112-120` (tripwire
      falso, ver 2.9) debe seguir **verde**. Que discrepen es la prueba de que el viejo vigilaba una
      copia. Revertir la mutación.
- [x] 2.9 **Retirar el tripwire falso**: borrar de `packages/shared/src/estados.test.ts` el comentario
      de las líneas 101-111 y el `it('documenta el defecto...')` de las líneas 112-120 (verificado de
      disco en esta sesión — el rango exacto difiere en una línea del citado en `design.md`/`proposal.md`
      como «113-121»: el `it(` abre en 112, cierra en 120, y 121 cierra el `describe` exterior, que no
      se toca).
- [x] 2.10 `npm test -- packages/shared/src/estados.test.ts` en verde tras la retirada.

---

## Phase 3 — `VistaKey` derivada + `default:` separado (RQ-VT-02, RQ-VT-03)

- [x] 3.1 **RED**: en `boardView.test.ts`, cambiar `:23` (`key desconocida → como todos`, hoy
      `toEqual(['a', 'b', 'd'])`) a `toEqual([])`, y `:56` (`viewLabel('zzz')`, hoy
      `toBe('Todos los Tickets')`) a `toBe('Vista no reconocida')`. Correr `npm test` y confirmar rojo.
- [x] 3.2 **GREEN, `boardView.ts`**:
      - Convertir `FUNCTIONAL_VIEWS` (línea 6) a `as const satisfies readonly BoardViewDef[]` y exportar
        `type VistaKey = typeof FUNCTIONAL_VIEWS[number]['key']`.
      - Cambiar `FUNCTIONAL_BY_LABEL` (línea 18) a `Record<string, VistaKey>`.
      - Cambiar la firma de `applyBoardView` (línea 34) y `viewLabel` (línea 21) para que `key` sea
        `VistaKey`, no `string`.
      - Añadir `function vistaNoReconocida(_key: never): Ticket[] { return [] }` y separar
        `default: return vistaNoReconocida(key)` del `case 'todos':`, que de momento conserva su filtro
        actual (`tickets.filter((t) => t.statusType !== 'Closed')`) — el cambio de comportamiento de
        «todos» es la Fase 4, no ésta.
      - Cambiar el respaldo de `viewLabel` (línea 22) de `'Todos los Tickets'` a `'Vista no reconocida'`.
- [x] 3.3 Propagar el tipo `VistaKey`:
      - `apps/desk/src/App.tsx:57` → `useState<VistaKey>('todos')` (importar `VistaKey` de `./lib/boardView`).
      - `apps/desk/src/components/Sidebar.tsx:82` → `activeView: VistaKey; onSelectView: (key: VistaKey) => void`.
- [x] 3.4 `npm test` y `npm run typecheck` en verde.
- [x] 3.5 **Control de mutación D2**: añadir temporalmente una séptima entrada a `FUNCTIONAL_VIEWS` sin
      su `case` correspondiente en `applyBoardView`. Correr `npm run typecheck` → **debe fallar**,
      señalando la llamada a `vistaNoReconocida` con un argumento no asignable a `never`. Revertir la
      mutación. Sin esta ejecución, el mecanismo (a) es una declaración de intención, no un detector.
- [x] 3.6 **RQ-VT-03, nota de verificación de esta fase**: `specs/vistas-tablero/spec.md:82-100`
      (RQ-VT-03) describe un escenario de recorrido por las seis `key` con fixtures dedicados. La
      cobertura real de esa promesa la da la **combinación** de dos piezas ya existentes/añadidas, no un
      test nuevo: (a) las seis vistas ya tienen su propio `it()` en `boardView.test.ts` (`todos`,
      `cerrados`, `abiertos`, `espera`, `vencidos`, `mios`), cada uno con una aserción de contenido
      distinta de `[]`/respaldo; (b) el guardián `never` de 3.2/3.5 protege las claves **futuras** que
      esos seis `it()` no pueden cubrir por definición. No se añade un séptimo test que sólo repita (a).

---

## Phase 4 — «Todos» = activos + cerrados paginados (RQ-VT-01)

- [x] 4.1 **RED**: en `boardView.test.ts:18`, cambiar `todos = activos (excluye cerrados)` (nombre y
      expectativa `['a', 'b', 'd']`) a un nombre que refleje la conducta nueva y `toEqual(['a', 'b', 'c', 'd'])`.
      Correr `npm test` y confirmar rojo.
- [x] 4.2 **GREEN, `boardView.ts`**: cambiar `case 'todos':` para que devuelva `tickets` sin filtrar
      (`case 'todos': return tickets`), separado ya de `default:` desde la Fase 3.
- [x] 4.3 `npm test -- apps/desk/src/lib/boardView.test.ts` en verde.
- [x] 4.4 **`App.tsx` — sin RED automático, `.tsx` fuera de `vitest.config.ts:17-20`.** Cambios
      concretos, en orden:
      - Sustituir el `useAsync<Ticket[] | ClosedPage>` de las líneas 61-64 (que ramifica por `isClosed`)
        por un único `useAsync` cuyo `fn` devuelve `{ activos: Ticket[]; cerrados: ClosedPage | null }`:
        para `view === 'cerrados'`, `activos: []` y sólo se pide `fetchClosedTickets(closedPage)`; para
        `view === 'todos'`, se piden las dos en paralelo (`Promise.all`); para el resto, sólo
        `fetchActiveTickets()` y `cerrados: null`.
      - Sustituir las líneas 65-67 (`tickets`/`closedMeta`/`all`) por la concatenación única:
        `tickets = [...activos, ...(cerrados?.items ?? [])]`, con `closedMeta = cerrados`.
      - No se toca `closedPage` ni su `useEffect` de reinicio (`App.tsx:58-59`): D1 ya lo señala como
        reutilizable sin estado nuevo.
      - Cambiar la condición de `Pagination` (línea 126, hoy `isClosed && closedMeta`) a «hay bloque
        cerrado» (`(view === 'todos' || view === 'cerrados') && closedMeta`).
- [x] 4.5 **Hallazgo de esta fase, no de `design.md`**: el escenario «activos primero, cerrados después,
      sin entrelazar» de RQ-VT-01 (`vistas-tablero/spec.md:35-40`) lo cumple la propia concatenación de
      4.4, que vive en `App.tsx` — un `.tsx` fuera de la red de `vitest`. `design.md` §7 declara sin
      detector automático a `App.tsx` en general, pero no nombra esta promesa de orden en particular.
      Se añade aquí, explícitamente, a la misma clase de excepción declarada que RQ-VT-06 (Fase 5): sin
      test automatizado bajo la decisión de Gerencia F0-00, verificado a mano.
- [x] 4.6 **`columns.ts`**: corregir el comentario de la línea 6 (hoy: «'Finalizado' (cierre) NO es
      columna: el ticket sale del tablero al cerrarse»). Con «Todos» trayendo cerrados, ya no es cierto
      que salgan del tablero: caen en `'otros'` (`columns.ts:33,44-45`), que `board.ts:26` enseña en
      cuanto deja de estar vacía. Nueva redacción: «'Finalizado' (cierre) no tiene columna propia: cae
      en la columna de seguridad 'Otros' cuando aparece (p. ej. en la vista 'Todos')».
- [x] 4.7 `npm run typecheck` y `npm run build` en verde (único detector automático que alcanza `App.tsx`).
- [x] 4.8 **Control de mutación P1**: revertir temporalmente `case 'todos':` a compartir cuerpo con
      `default:` (fusionar ambos en `return tickets.filter((t) => t.statusType !== 'Closed')`). Correr
      `npm test -- apps/desk/src/lib/boardView.test.ts`. **Debe haber exactamente 2 fallos**, nombrados:
      el de 4.1 («todos incluye cerrados») y el de 3.1 («clave desconocida devuelve vacío»). Si falla 1
      o 0, las dos ramas no están fijadas por separado. Revertir la mutación.

---

## Phase 5 — `TicketCard` reclavado (IV-5, RQ-VT-06)

**Excepción declarada, no carencia. NO admite rojo previo.** `vitest.config.ts:16` fija
`environment: 'node'`; `:17-20` incluye sólo `apps/**/*.test.ts` y `packages/**/*.test.ts`, y `:57`
excluye `**/*.tsx` del coverage — decisión explícita de Gerencia (F0-00, 2026-09-08). **Prohibido**
instalar `jsdom`/`@testing-library`, ampliar el include a `*.test.tsx`, o fingir una prueba.

- [x] 5.1 En `TicketCard.tsx:2`, cambiar `import type { Ticket } from '../data/mockData'` a
      `import type { Ticket } from '@ambientalia/shared'` (higiene declarada, D5; `mockData.ts:1-2` ya
      reexporta el mismo tipo, así que esto no cambia comportamiento).
- [x] 5.2 En `TicketCard.tsx:14-23`, reclavar `statusColorMap` con los nombres reales del registro
      (`estados.ts`) en vez de las claves en mayúsculas de `mockData.ts`, y **borrar el campo `label`**
      (línea 26 pasa a pintar `ticket.status` verbatim). Las ocho entradas ya nombran estados reales;
      la de `'En Espera de Repues...'` (línea 22) se corrige al nombre completo `'En Espera de Repuestos'`.
- [x] 5.3 **Control de mutación P5**: contar ficheros y pruebas de `npm test` **antes** de 5.1/5.2 y
      **después**. Exigir cifra idéntica — prueba de disco de lo que `vitest.config.ts:17-20` declara:
      ningún test recoge este cambio, ni para bien ni para mal.
- [x] 5.4 `npm run typecheck`, `npm run lint`, `npm run build` en verde.

---

## Phase 6 — Verificaciones transversales (antes de cerrar la tanda)

- [x] 6.1 **Regla de mutación 3 — casilla de la regla 13, verificar, no rehacer.** `design.md` §5 ya
      trae la tabla resuelta (7 decisiones, 3 con línea de servidor probada). Confirmar por escrito, en
      el PR o en el resumen de `sdd-apply`, que las 7 filas siguen siendo ciertas contra el código
      final (en particular la fila 7, nueva: `?scope=closed&page=N` en «Todos», impuesta por
      `tickets.ts:105,107` y probada en `tickets.test.ts:90-99`).
- [x] 6.2 **Control de mutación P1-bis** (validación, sin cambio de producto): en
      `apps/desk/server/routes/tickets.ts:106`, cambiar temporalmente `const pageSize = 50` a `5`.
      Con los 3 cerrados que siembra `apps/desk/server/tickets.test.ts:57-63` (función `seedMixed`),
      `items` sigue teniendo como máximo 3 elementos (≤ 5), así que **sólo** `:84`
      (`expect(res.body.pageSize).toBe(50)`) debe ponerse roja; `:86` y `:87` deben seguir verdes. Si se
      pone roja alguna más, la prueba está midiendo el contenido creyendo medir el sobre. Revertir el
      cambio — **`tickets.ts` no se modifica como parte del alcance de esta tanda**, esto es sólo una
      ejecución de control sobre un detector ya existente.
- [x] 6.3 Suite completa: `npm test`, `npm run typecheck`, `npm run lint` (sin superar los 158 avisos
      del trinquete, `ci.yml:41`) y `npm run build`, todos en verde.
- [x] 6.4 Confirmar que no queda ninguna `/espera/i` en `apps/desk/src/lib/boardView.ts` (`grep -n
      "espera/i" apps/desk/src/lib/boardView.ts` → sin resultados; control positivo previo: el mismo
      `grep` sobre `estados.ts:104` con el patrón `/espera/i` en la cadena de comentario debe devolver
      ≥ 1, para confirmar que el propio `grep` no está roto — precedente de este repositorio, un barrido
      se dio por limpio una vez porque el patrón estaba mal escrito).

---

## Fuera de `sdd-apply` — destino `sdd-archive`

- [ ] **Reanclar/reescribir `openspec/specs/permissions/spec.md`.** Verificado de disco:
      `:270` cita `boardView.ts:34-52` (reanclar al nuevo rango tras las Fases 2-4); `:273-274` afirma
      que la clasificación por regex de `boardView.ts:35` «es un desvío en ese mismo fichero... y
      pertenece a `transitions-st` §3.6» — con IV-1 cerrado, esto se **reescribe**, no se reancla, para
      dejar de afirmar que sigue vivo. Precedente en el propio repositorio: commit `4e0b542`.
- [ ] Cerrar las filas IV-1 e IV-5 en `openspec/config.yaml` y en `CLAUDE.md` (tabla de incumplimientos
      vivos), con la misma disciplina de «barrer al cerrar» que ya aplicó el commit `4e0b542`.

---

## Fuera del recuento — dueño fuera del repositorio (regla del ciclo 1)

Ninguna de las siguientes es una tarea que una tanda pueda marcar por sí sola: sus verificaciones las
hace una **persona**, sobre la app **ya desplegada**, después de que `sdd-apply` haya mergeado. No
cuentan para que `verify`/`archive` pasen a `ready`, y **archivar no las da por hechas**.

| # | Comprobación | Dueño | Dónde queda anotada |
|---|---|---|---|
| 1 | `En Proceso` pinta azul (`#EBF8FF`/`#3182CE`), no `bg-slate-100` | QA / quien despliegue | `proposal.md` §3 Pieza 5, `design.md` §2·D5 — anotar resultado en el PR o en `docs/sdd/` |
| 2 | `Notificación cliente` pinta ámbar (`#FFF9E6`/`#D97706`) | QA / quien despliegue | ídem |
| 3 | `En Espera de Repuestos` se lee entero, sin `...` | QA / quien despliegue | ídem |
| 4 | Un estado sin entrada en el mapa (p. ej. `Finalizado`, visible en «Todos») conserva el chip neutro con nombre completo | QA / quien despliegue | ídem |
| 5 | En «Todos», los cerrados aparecen **después** de los activos, sin intercalar (RQ-VT-01, sin detector automático — tarea 4.5) | QA / quien despliegue | `vistas-tablero/spec.md:35-40` — anotar resultado |

**Nota, no tarea.** La pregunta abierta de `design.md` §6 (¿`Finalizado` merece columna propia en modo
«estado»?) **no bloquea** esta tanda: ya tiene supuesto vigente aplicado (se queda en «Otros», tarea
4.6). Si Gerencia responde distinto más adelante, es una tanda nueva, no una casilla pendiente de ésta.

---

## Fuera de alcance — no se generan tareas

- `packages/shared/src/sla.test.ts` — no se toca (riesgo R-1 de `proposal.md` §6, pregunta Q3; se
  reformula en la tanda de la alarma de 72 h de P21).
- Columna propia para `Finalizado` — juicio de producto, ver «Nota, no tarea» arriba.
- Los siete ficheros sin trackear de `docs/sdd/` y `docs/Manifesto/` listados en el `git status` de la
  sesión — ajenos a este cambio.
- `?scope=all` (`tickets.ts:113-114`, `client.ts:14-17`) — sigue sin uso en el front, sin cambios.

---

## Regla del ciclo 2 — recordatorio

Esta tanda corre sola sobre `C:\dev\Desk_2_R1.023`. Si hiciera falta otro intento SDD en paralelo, va
en un worktree aislado — nunca dos intentos sobre el mismo árbol de trabajo a la vez.
