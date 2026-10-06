# Diseño — `ovi-garantia-por-cargo`

Leído en el worktree `ovi-garantia-por-cargo` sobre `215310d`, el 2026-10-06. Los diez supuestos S-1…S-10 del
`proposal.md` están aceptados. Toda línea citada se leyó en ese árbol; lo que no, lleva «hipótesis».

## 1 · Enfoque

La regla vive entera en `packages/shared` (puro). Un módulo nuevo del servidor lee lo que el ticket ya tiene y
traduce los motivos a HTTP. En los ficheros muy citados (`ticketService.ts`, `remision.ts`, `cargos.ts`) se editan
líneas **en sitio**: **cero líneas insertadas, cero borradas**; `subOV.ts` sólo crece por el final (tras `:55`).

    cuerpo ─► números recibidos ─► ordenesQueEntran(recibidas, lo que el ticket ya tiene) ─► entrantes
    entrantes ─► motivoCargoOVI(entrantes, sujeto) ─► 403            (escalón B)
    entrantes ─► motivoGarantiaSinOVI(tipoServicio, entrantes) ─► 422 (escalón C)

## 2 · Decisiones

| # | Decisión | Alternativa rechazada | Por qué |
|---|---|---|---|
| D1 | `esOVI` es «prefijo de OVI»: el número, recortado y sin distinguir mayúsculas, EMPIEZA por `OVI-` (`/^OVI-/i`). DECIDIDO por el orquestador. Una sola implementación, en `subOV.ts`, junto a la sintaxis | Derivarla de `BASE` (`subOV.ts:24`, sintaxis completa) | El número es texto libre en el alta y en las transiciones: con la sintaxis estricta, `OVI-26-1` esquivaría la guarda de cargo. «Prefijo de OVI» y «sintaxis de subOV» son dos preguntas distintas y el comentario lo dice; no es una segunda noción de OVI, es la única |
| D2 | Los «entrantes» se calculan UNA vez por petición y los consumen las dos guardas | Que cada guarda vuelva a leer el ticket | Dos lecturas son dos nociones de «ya la traía» |
| D3 | En las transiciones los números se leen de `b.values` con `ordenesDeTransicion`, no del plan | Mover `buildTransitionPlan` (`ticketService.ts:133`) por delante del `403` | El plan nace después del escalón B; una prueba enfrenta las dos lecturas (EQ-1) |
| D4 | La remisión responde con `res.status(...)` y los motivos puros; alta y transiciones lanzan `HttpError` | Unificar con `HttpError` en la remisión | Es el estilo de cada fichero (`remision.ts:220`; `apps/desk/server/app.ts:79`) |
| D5 | Sin rama por `PREFIJO_TICKET_APP` (S-3): reconfirmar no es asociar en ningún ticket | Ramificar por el prefijo | S-3 aceptado; la prueba de Zoho usa un id sin prefijo |
| D6 | En las transiciones la garantía va en el `422` agregado de `:134`, tras la cuarentena | Tras el vencido (`:147`), como S-9 literal | Es la fila que fija el proposal §4; todo es escalón C |
| D7 | Pruebas de servidor en dos ficheros NUEVOS | Añadirlas a `remisiones.test.ts` | Ese fichero está citado por línea (`:988`, `:1246`) |

## 3 · `packages/shared` (lote 1)

**`subOV.ts`, al final del fichero:**

    const PREFIJO_OVI = /^OVI-/i
    export function esOVI(numero: unknown): boolean   // texto, recortado, EMPIEZA por `OVI-`; sin exigir la sintaxis completa
    // comentario obligatorio: es «prefijo de OVI», distinto de «sintaxis de subOV» (`clasificarOV`); el número es texto libre
    // y exigir la sintaxis entera dejaría esquivar la guarda de cargo tecleando un número mal formado (`OVI-26-1`)

**`ordenOVI.ts` (nuevo; se exporta en `index.ts` junto a `:23`, añadido a esa misma línea con `;`):**

    export const TIPO_SERVICIO_GARANTIA = 'Garantía'            // literal exacto de TIPOS_SERVICIO (ticketCreate.ts:4), S-7
    export interface OrdenRecibida { numero?: unknown; salesorderId?: unknown }
    export interface OrdenesDelTicket { numeros: readonly unknown[]; salesorderIds: readonly unknown[] }
    export type SujetoOVI = Pick<SujetoDePermiso, 'isAdmin' | 'cargoPermiso'>
    export function ordenesDeTransicion(t: Pick<Transition, 'fields'>, valores: unknown): string[]
    export function ordenesQueEntran(recibidas: readonly OrdenRecibida[], yaTiene: OrdenesDelTicket): string[]
    export function motivoCargoOVI(entrantes: readonly string[], sujeto: SujetoOVI | null | undefined): string | null
    export function erroresGarantiaSinOVI(tipoServicio: unknown, entrantes: readonly string[]): string[]
    export function motivoGarantiaSinOVI(tipoServicio: unknown, entrantes: readonly string[]): string | null

- `ordenesDeTransicion`: por cada campo con `kind === 'ordenVenta'` (`transitions.ts:87`, `:375`), `String(valores[f.key])`
  si no es `undefined`, `null` ni `''`. Es lo mismo que el plan guarda (`transitionExec.ts:44`, `:88`, `:91`).
- `ordenesQueEntran`: una orden **ya es del ticket** si su número recortado es IGUAL (sensible a mayúsculas) a uno
  de `numeros`, o si su `salesorderId` no vacío está en `salesorderIds`. Devuelve los números recortados de las
  demás, sin vacíos ni repetidos. Otra caja = entra (falla cerrado).
- `motivoCargoOVI`: la primera entrante con `esOVI` y `!puedeCrearOVIGarantia(sujeto)`; sujeto ausente = sin cargo (S-10).
- `erroresGarantiaSinOVI`: si `tipoServicio === TIPO_SERVICIO_GARANTIA`, un texto por cada entrante que no es `esOVI`.
  `motivoGarantiaSinOVI` es el primero o `null` (mismo par que `motivoCuarentena`/`erroresCuarentena`, `subOV.ts:47-55`).

**`cargos.ts:67-74`, reescrito en sitio (ocho líneas siguen siendo ocho):**

    /**
     * Asociar una OVI a un ticket (F1B-03, `decision/e157-ovi-garantia-por-cargo`): basta el cargo Director Técnico; el admin pasa.
     * SIN área: el acto no tiene área propia y sólo AÑADE condición (RQ-PM-21). La llama `motivoCargoOVI` (`ordenOVI.ts`).
     */
    export function puedeCrearOVIGarantia(s: Pick<SujetoDePermiso, 'isAdmin' | 'cargoPermiso'>): boolean {
      if (s.isAdmin) return true
      return cargoEfectivo(s) === EXCEPCIONES_POR_CARGO.crearOVIGarantia
    }

**Mensajes** (cuerpo `{ error }`; en el `422` agregado de transiciones, dentro de `{ errors }`):

| Código | Texto |
|---|---|
| `403` | `La orden de venta ${n} es una OVI: asociarla a un ticket sólo lo hace el cargo Director Técnico` (el cargo sale de `EXCEPCIONES_POR_CARGO.crearOVIGarantia`, `cargos.ts:33`) |
| `422` | `El ticket es de tipo de servicio Garantía y sólo admite una orden OVI: la orden de venta ${n} no lo es` |

## 4 · Servidor: módulo nuevo `apps/desk/server/services/guardasOVI.ts`

    export type { SujetoOVI }
    export function exigirCargoOVI(entrantes: readonly string[], sujeto: SujetoOVI | null | undefined): void   // HttpError 403 { error }
    export function exigirGarantiaOVI(tipoServicio: unknown, entrantes: readonly string[]): void               // HttpError 422 { error }
    export function entrantesDeAlta(ordenVenta: string | null, numeroBooks: string | null): string[]           // el ticket nace: todo entra
    export async function entrantesDeTransicion(db, t: Transition, valores: unknown, ticketId: string, row): Promise<string[]>
    export async function entrantesDeRemision(db, ov: { id: string; number?: string | null }, ticketId: string, row): Promise<string[]>  // lote 3

Lo que el ticket ya tiene: `row.orden_venta` y `row.salesorder_id` (`packages/zoho-sync/src/db/rows.ts:31`, `:50`)
más las asociaciones con `liberada_at` nulo de `listarAsociaciones` (`packages/zoho-sync/src/db/ovAsociaciones.ts:81-84`).
`entrantesDeTransicion` devuelve `[]` **sin consultar** si la transición no trae ninguna orden. Hipótesis a comprobar
en el apply: que `getTicketWithRefs` entregue `salesorder_id` en `row` (lo fija la prueba RE-5).

## 5 · Ediciones en sitio (línea actual → línea nueva; el resto de cada línea, byte a byte)

**`apps/desk/server/services/ticketService.ts`** — 9 líneas tocadas, 0 insertadas, 0 borradas:

| Línea | Edición |
|---|---|
| `:6` | en la lista de `@ambientalia/shared`, tras `motivoSinRemisionVigente,` se añade ` erroresGarantiaSinOVI,` |
| `:18` | al final: `; import { entrantesDeAlta, entrantesDeTransicion, exigirCargoOVI, exigirGarantiaOVI, type SujetoOVI } from './guardasOVI'` |
| `:21` | `actorId?: string): Promise<unknown> {` → `actorId?: string, sujeto?: SujetoOVI): Promise<unknown> {` |
| `:36` | `let fechaOrdenVenta: string \| null = null` → se añade `; let numeroBooks: string \| null = null // el número que Books da a salesOrderId: las guardas de OVI lo juzgan aunque el cuerpo traiga otro tecleado (:42)` |
| `:43` | `fechaOrdenVenta = ov.date ?? null` → se añade `; numeroBooks = ov.number ?? null` |
| `:44` | `  }` → `  } const entranAlta = entrantesDeAlta(ordenVenta, numeroBooks); exigirCargoOVI(entranAlta, sujeto) // B (F1B-03), la única guarda de permiso del alta: tras «Orden de venta no encontrada» (A, :39) y antes de equipo↔cliente (C, :65)` |
| `:96` | tras `if (vencido) throw new HttpError(422, { error: vencido });` se añade ` exigirGarantiaOVI(tipoServicio, entranAlta);` y el comentario pasa a `/* C (cuarentena, vencido, Garantía sólo con OVI) antes que D */` |
| `:131` | tras `throw new HttpError(403, { error: MENSAJE_PRIORIDAD_BLOQUEADA });` se añade ` const entran = await entrantesDeTransicion(db, t, b.values, id, current.row); exigirCargoOVI(entran, user);`; el comentario final gana `; F1B-03: el cargo de la OVI que ENTRA, tras la prioridad y antes de la verificación` |
| `:134` | tras `const errCuarentena = …;` se añade ` const errGarantia = erroresGarantiaSinOVI(current.row.tipo_servicio, entran);`; la condición gana `\|\| errGarantia.length` y la lista `...errGarantia` detrás de `...errCuarentena` |

La forma `} sentencia` ya existe en `:131`. `:42` no se toca: sigue diciendo lo que citan `exploration.md` y `CLAUDE.md`.

**`apps/desk/server/routes/tickets.ts:125`:** `…, req.user?.id))` → `…, req.user?.id, req.user))`.

**`apps/desk/server/routes/remision.ts`** — 3 líneas tocadas, 0 insertadas, 0 borradas:

| Línea | Edición |
|---|---|
| `:4` | la lista gana `motivoCargoOVI, motivoGarantiaSinOVI` |
| `:7` | al final: `; import { entrantesDeRemision } from '../services/guardasOVI'` |
| `:220` | línea nueva completa, abajo |

    if (!ov) { res.status(422).json({ error: 'Orden de venta no encontrada' }); return }; const entran = await entrantesDeRemision(db, ov, ticketId, found.row); const sinCargo = motivoCargoOVI(entran, req.user); if (sinCargo) { res.status(403).json({ error: sinCargo }); return }; const cuarentena = motivoCuarentena(ov.number); if (cuarentena) { res.status(422).json({ error: cuarentena }); return }; const vencido = await motivoContratoVencido(db, ov.number); if (vencido) { res.status(422).json({ error: vencido }); return }; const sinOVI = motivoGarantiaSinOVI(found.row.tipo_servicio, entran); if (sinOVI) { res.status(422).json({ error: sinOVI }); return } // A, luego B (cargo de la OVI que entra, F1B-03), luego C (cuarentena, vencido, Garantía sólo con OVI), antes de la unicidad (D)

El orden relativo de las guardas que ya existían no cambia: A → cuarentena → vencido → D.

**Citas desplazadas: ninguna** (el repositorio tiene citas `ticketService.ts:NNN` / `remision.ts:NNN` en más de
sesenta ficheros, `openspec/changes/archive/` incluido; al no insertar ni borrar líneas, ninguna cambia de número).
Lo que el cierre SÍ debe releer, porque cambia el CONTENIDO de la línea: las citas a `ticketService.ts` `:21`, `:36`,
`:43`, `:44`, `:96`, `:131`, `:134` y a `remision.ts` `:220` (y los rangos que las contienen, p. ej. `:218-244`).

## 6 · El usuario en el alta

`createManagedTicket(db, body, actorName, actorId?, sujeto?)`. El único llamador de producto es
`routes/tickets.ts:125`. Las 56 llamadas de prueba (`services/ticketService.test.ts` 54, `trazaTop5AlNacer.test.ts` 1,
`services/equipoNuevo.test.ts` 1) siguen con cuatro argumentos como máximo y no cambian: ninguna prueba de `apps/` ni
`packages/` da de alta, transiciona ni remisiona con un número `OVI-` (barrido con Grep: sólo aparece en
`subOV.test.ts`, `contratos.test.ts` y `db/contratos.test.ts:94`), y en las pruebas de `apps/desk/server` «Garantía»
sólo aparece como clasificación de un texto de conversación (`db/conversacion.test.ts:18`), nunca como tipo de
servicio de un ticket. Sin sujeto, una OVI recibe `403` (S-10); sin OVI, nada cambia. Hipótesis: que ninguna prueba
existente quede roja; lo confirma la suite del lote 2.

## 7 · Plan de pruebas

**Lote 1 — `packages/shared`**

- `subOV.test.ts`: `esOVI` cierto para `OVI-2026-001`, ` ovi-2026-001 `, `OVI-2026-001-01`, `OVI-2026-00123`, `OVI-26-1`
  (mal formado, A1); falso para `OV-2026-001`, `OV-2026-001-01`, `OVIEDO-1`, `SO-00123`, `''`, no-texto. Y `clasificarOV` no cambia.
- `ordenOVI.test.ts` (nuevo): tablas de `ordenesQueEntran` (número igual, otra caja, id igual con número distinto,
  vacíos, repetidos), `motivoCargoOVI` (los ocho cargos, admin, sujeto ausente, cargo raro), los dos de garantía
  (literal exacto; `garantía` en minúsculas no activa), `TIPO_SERVICIO_GARANTIA` ∈ `TIPOS_SERVICIO`, y
  `ordenesDeTransicion` sobre `habilitar_servicio`, `aprobacion`, `aprobacion_y_repuestos` y una sin campo de orden.
- `cargos.test.ts`, en sitio (§8).

**Lote 2 — `apps/desk/server/oviGarantia.test.ts` (nuevo, por HTTP con `appHarness`)**

| Id | Caso | Espera |
|---|---|---|
| AL-1 | Alta, OVI por `salesOrderId`, sin cargo | `403` |
| AL-2 / AL-3 | Director Técnico con área Comercial (sin Servicio Técnico) / administrador sin cargo | `201` |
| AL-4 / AL-5 | OVI TECLEADA en `ordenVenta` sin id / en minúsculas, sin cargo | `403` |
| AL-6 | `ordenVenta: 'OV-…'` tecleada y `salesOrderId` de una OVI, sin cargo | `403` |
| AL-7 | `createManagedTicket` con cuatro argumentos y OVI | `403` (S-10) |
| AL-8 | `OV-` ordinaria, sin cargo | `201` |
| POS-AL-1 | equipo inexistente + OVI sin cargo | `422` «Equipo no registrado» |
| POS-AL-2 | `salesOrderId` inexistente + `ordenVenta: 'OVI-…'` sin cargo | `422` «Orden de venta no encontrada» |
| POS-AL-3 | OVI sin cargo + cliente que no es el del equipo | `403` |
| POS-AL-4 | OVI sin cargo + faltan obligatorios | `403` |
| GA-AL-1..5 | Garantía+`OV-` → `422`; Garantía+OVI con cargo → `201`; Garantía sin orden → `201` (S-2); OVI tecleada + id de una `OV-` → `422`; Mantenimiento+OVI con cargo → `201` | |
| POS-AL-5 | Garantía + `OV-` ya asociada a otro ticket | `422` de garantía, no `409` |
| POS-AL-6 | Garantía + `OV-…-X9` (cuarentena) | `422` de cuarentena (S-9) |
| TR-1..6 | OVI nueva sin cargo en `habilitar_servicio`, `aprobacion` y `aprobacion_y_repuestos` → `403`; con cargo o admin → `200` | |
| RC-1 | **Ticket de Zoho** (id sin `PREFIJO_TICKET_APP`) con `orden_venta` OVI, la reconfirma en «Habilitar Servicio», Comercial sin cargo | `200` |
| RC-2 / RC-3 | Lo mismo en ticket de la aplicación / OVI vigente sólo en `ov_asociaciones` | `200` |
| RC-4 / RC-5 / RC-6 | Cambiarla por OTRA OVI / reasociar una liberada / la misma en otra caja | `403` |
| POS-TR-1 | estado que no aplica + OVI sin cargo | `409` |
| POS-TR-2 | Servicio Técnico sin cargo en «Habilitar Servicio» con OVI | `403` con el texto del ÁREA |
| POS-TR-3 / 3b | OVI nueva sin cargo, sin remisión vigente / con cliente provisional | `403` con el texto del cargo |
| POS-TR-4 | `aprobacion_y_repuestos`: OVI adicional sin cargo + falta una fecha obligatoria | `403` |
| POS-TR-5 | OVI de otro ticket, sin cargo | `403`, no `409` |
| GA-TR-1..4 | Garantía+`OV-` nueva → `422`; Garantía+«OV adicional» `OV-` → `422` (S-5); Garantía que reconfirma su `OV-` → `200` (S-1); Garantía+OVI con cargo → `200` | |
| POS-TR-6 | Garantía + `OV-` ya usada por otro ticket | `422` de garantía, no `409` |
| POS-TR-7 | Garantía + `OV-` + falta un obligatorio | `422` con los DOS textos en `errors` |
| EQ-1 | `ordenesDeTransicion(t, v)` frente a `[plan.columns.orden_venta, plan.ovAdicional]` en las tres transiciones | iguales |

**Lote 3 — `apps/desk/server/oviGarantiaRemision.test.ts` (nuevo)**

| Id | Caso | Espera |
|---|---|---|
| RE-1 / RE-2 / RE-3 | OVI sin cargo / Director Técnico / administrador | `403` / `201` / `201` |
| RE-4 | reenviar la OVI que el ticket ya tiene en `orden_venta`, sin cargo | `201` |
| RE-5 | `orden_venta` vacía y `salesorder_id` vivo (IV-11), se reenvía ESA orden, sin cargo | `201` |
| RE-6 | el ticket ya tiene OTRA orden y llega una OVI, sin cargo | `403` (S-8) |
| POS-RE-1 | OVI con sufijo, sin cargo | `403`, no la cuarentena |
| POS-RE-2 | OVI de otro ticket, sin cargo | `403`, no `409` |
| POS-RE-3 | remisión pendiente + OVI sin cargo | `409` (caracterización, IV-12 punto 4) |
| POS-RE-4 | ítem fuera del checklist + OVI sin cargo | `422` del checklist (caracterización) |
| GA-RE-1..3 | Garantía+`OV-` → `422`; Garantía+OVI con cargo → `201`; Garantía sin orden → `201` | |
| POS-RE-5 / POS-RE-6 | Garantía + `OV-` de otro ticket → `422` de garantía; Garantía + `OV-…-X9` → cuarentena | |

**Mutaciones que el apply ejecuta y anota en `apply-progress.md`** (se revierte cada una tras verla roja):

| Id | Mutación | Prueba que debe ponerse roja |
|---|---|---|
| M-AL-1 | cargo del alta, de `:44` a antes del `if` de `:37` (sólo con `ordenVenta`) | POS-AL-2 |
| M-AL-2 | cargo del alta, a detrás de equipo↔cliente (`:79`) y, aparte, detrás de `:88` | POS-AL-3; POS-AL-4 |
| M-AL-3 | garantía del alta, a detrás del `409` (`:100`) y, aparte, delante de la cuarentena | POS-AL-5; POS-AL-6 |
| M-TR-1 | cargo de transiciones, a antes del área (`:129`) y, aparte, antes de `:126` | POS-TR-2; POS-TR-1 |
| M-TR-2 | cargo de transiciones, al final de `:131`; detrás de `:134`; detrás de `:152` | POS-TR-3 y 3b; POS-TR-4; POS-TR-5 |
| M-TR-3 | garantía fuera del agregado, a detrás de `:152` | POS-TR-6 (y POS-TR-7) |
| M-RE-1 | cargo de la remisión, a detrás de la cuarentena y, aparte, detrás del `409` (`:234`) | POS-RE-1; POS-RE-2 |
| M-RE-2 | garantía de la remisión, a detrás del `409` y, aparte, delante de la cuarentena | POS-RE-5; POS-RE-6 |
| M-RC-1 | `ordenesQueEntran` devuelve TODO lo recibido (se quita «ya la traía») | **RC-1** (Zoho), RC-2, RC-3, RE-4, RE-5 |
| M-SH-1 | se quita la `i` de `PREFIJO_OVI`; se devuelve el área a `puedeCrearOVIGarantia`; `esOVI` pasa a exigir la sintaxis completa | AL-5; AL-2; el caso `OVI-26-1` de `subOV.test.ts` y de `ordenOVI.test.ts` |

«Habilitar Servicio» y las dos «OV adicional» comparten la misma línea: M-TR-1 y M-TR-2 valen para las tres, y
TR-1..6 fijan que cada transición pasa por ella. No observables (proposal §4), y no se fingen: cargo frente a
garantía; «Orden de venta no encontrada» frente al cargo en la remisión; el `403` nuevo frente a los de cargo y
prioridad de `:131` (confirmado: `liberacion_sin_factura` no tiene campo de orden, `transitions.ts:247`, y ninguna
de las tres transiciones con orden tiene campo de prioridad, `:189`, `:199`, `:203`).

## 8 · Pruebas existentes que cambian (`packages/shared/src/cargos.test.ts`, en sitio, mismo número de líneas)

| Líneas | Hoy | Pasa a |
|---|---|---|
| `:117` | título «la de la OVI aún no» | «la de la OVI la llama `ordenOVI.ts` (F1B-03)» |
| `:118-123` | exige área: `:121` espera `false` para Comercial + Director Técnico | sin área: para `[]`, `['Comercial']` y `['Servicio Técnico']` pasa sólo Director Técnico; sin cargo `false`; admin `true` |
| `:185` | la primitiva entra en el barrido de RQ-PM-21 con área Servicio Técnico | la línea se sustituye por un comentario: ya no lleva área y no entra |
| `:204-205` | 5 × 11 × (31 + 3) = 1.870 | 5 × 11 × (31 + 2) = **1.815** |
| `:226-229` | «`puedeCrearOVIGarantia`, ninguno» | su único llamador fuera de `cargos.ts` es `ordenOVI.ts` (una sola implementación) |

Cambian en el **lote 1**, no en el 2 como estimaba el proposal: el primer llamador es `ordenOVI.ts`, de `shared`.
`:153` y `:267` siguen valiendo tal cual.

## 9 · Lotes de apply

| Lote | Contenido | Estimado (inserciones + borrados) | × 1,8 | En verde al cerrar |
|---|---|---|---|---|
| 1 | `subOV.ts` +10, `ordenOVI.ts` +55, `index.ts` 2, `cargos.ts` 14, `mantenimientoNovedades.ts` 2, pruebas: `subOV.test.ts` +18, `ordenOVI.test.ts` +90, `cargos.test.ts` 24 | 215 | **387** | regla pura y predicado sin área; nada del servidor cambia |
| 2 | `guardasOVI.ts` +45, `ticketService.ts` 18, `tickets.ts` 2, `oviGarantia.test.ts` +240 | 305 | **549** | alta y transiciones imponen las dos guardas; M-AL, M-TR, M-RC-1 y M-SH-1 anotadas |
| 3 | `guardasOVI.ts` +10, `remision.ts` 6, `oviGarantiaRemision.test.ts` +135 | 151 | **272** | las cuatro entradas; M-RE anotadas |

Cada lote cierra con `npm test`, `npm run typecheck` y `npm run lint` en verde, y con su medida real
(`git diff --shortstat --no-renames` más `wc -l` de lo nuevo). Una línea reescrita cuenta dos veces.

## 10 · Comentarios y textos que dejan de ser ciertos

- `packages/shared/src/cargos.ts:68-69` → §3 (lote 1).
- `packages/shared/src/mantenimientoNovedades.ts:10`: «Tiene la misma forma que `puedeCrearOVIGarantia`» → «…que
  `puedeFijarPrioridadTop5` (área Y cargo); `puedeCrearOVIGarantia` dejó de llevar área en F1B-03» (lote 1, en sitio).
- `ticketService.ts:96`, `:131`, `:134` y `remision.ts:220`: sus comentarios de escalón, dentro de la misma edición.
- `openspec/specs/permissions/spec.md` RQ-PM-20 y su escenario: lo corrige el delta de spec, no el apply.

## 11 · Al cerrar, fuera del código

- **IV-12 gana un cuarto punto** (`CLAUDE.md` y `openspec/config.yaml`): en la remisión el `403` de cargo (B) corre
  detrás de la fecha (`remision.ts:127`, C), la recepción (`:158`, C), la remisión pendiente (`:177`, D) y el
  checklist (`:197`, C), porque el número de la orden sólo se conoce tras leer Books (`:219`). Se anota, no se
  corrige; POS-RE-3 y POS-RE-4 lo caracterizan. La nota de IV-12 que dice que la cuarentena «comparte el `if`» de
  «Orden de venta no encontrada» deja de ser exacta: ahora van en sentencias separadas de la misma línea.
- **Tarea de persona P-1**: asignar los cargos de permiso ANTES de publicar; sin ellos sólo el administrador asocia
  una OVI. Va al paquete de despliegue y se repite en el `archive-report.md`. P-2 y P-3, como en el proposal §12.
- Barrido de la regla de mutación 4 sobre el contenido de las líneas de §5.

## 12 · Matriz de amenazas, migración y preguntas abiertas

Matriz de amenazas: no aplica (sin rutas nuevas, intérprete, subprocesos ni automatización de VCS). Migración:
ninguna. Marcha atrás: `revert`.

- [x] **D1, DECIDIDA por el orquestador (A1):** «es OVI» = el número recortado empieza por `OVI-`, sin distinguir
  mayúsculas. Un número mal formado como `OVI-26-1` también pide el cargo y también vale como OVI para la guarda de
  garantía; se cierra el esquive por número tecleado (alta y transiciones, que no se contrasta con Books). Sigue siendo
  una sola implementación (`subOV.ts`). Consecuencia aceptada: `OVIEDO-1` no lo es (el guion forma parte del prefijo).
