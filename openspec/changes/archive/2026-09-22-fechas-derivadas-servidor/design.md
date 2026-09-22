# Diseño — `fechas-derivadas-servidor` (F1A-07 · IV-2)

**Fase:** `sdd-design` · **Fecha:** 2026-09-21 · **Árbol:** `f1a-07-r1`, HEAD `91e3e58` (base `4976787`)
**Preflight** (`openspec/config.yaml:25-30`, leído del fichero): `interactive · hybrid · ask-on-risk · 800 · strict_tdd`.
**Entradas:** `proposal.md` (aprobada: D-1…D-3, P-1…P-3; **P-4 retirada** por el analista el 2026-09-21), `exploration.md`, obs. #835 y #840. Los deltas
de `specs/` van en paralelo: **si fijan otro literal (p. ej. el mensaje de §4.1), gana la spec.**
**Anclaje:** citas leídas en este árbol (sin índice `.codegraph/`: Read/Grep). *Hipótesis:* para el código,
`91e3e58` ≡ `4976787` (no se comprobó con git). Tras el `apply`, este documento es caso B de la regla 4.
**`rules.design`** (`openspec/config.yaml:1659-1661`): sin DDL ni cambio de esquema; no tiene sujeto.

---

## 1 · Enfoque en una frase

Una fórmula pura en `packages/shared` (día en Bogotá, derivación, valores efectivos); el servidor la
aplica en `executeTransition` **reescribiendo en sitio cuatro líneas** de `ticketService.ts` y delegando la
lectura de fuentes en un módulo nuevo; el cliente la consume para prellenar. `transitionExec.ts` y
`packages/zoho-sync/src/db/repo.ts` quedan **sin diff**.

## 2 · Decisiones

| # | Elegido | Descartado | Razón |
|---|---|---|---|
| A-1 | `ticketService.ts` **sin mover una línea**: se reescriben `:6`, `:7`, `:130`, `:132` | Insertar un `import` y un bloque de lectura, y presupuestar el barrido de 125 citas en 32 ficheros | Cabe en sitio (§3). Sin insertar, borrar ni mover, la regla 4 no se dispara; queda una comprobación dirigida (§8) |
| A-2 | El `import` nuevo sale de **fundir `:6` y `:7`**, que importan los dos de `@ambientalia/shared`; `:7` queda para el módulo nuevo | (a) dos sentencias en una línea; (b) reexportar desde un módulo ya importado | (a) la config no lo prohíbe (`eslint.config.js:17-33`: `js` y `tseslint` recomendados, sin `max-len` ni `max-statements-per-line`), pero exige `;` en un código que no los usa. (b) el único sitio temático, `../transitionExec` (`:15`), tiene que quedar sin diff; `../db/equipos`, `./avisoArea` y el resto no son sitio legítimo. Fundir dos imports del mismo módulo es limpieza, no truco |
| A-3 | Lectura de fuentes en un módulo **nuevo del servidor**, `apps/desk/server/services/valoresDeTransicion.ts`; la regla (D-1, D-3, P-2) en shared | Todo en `ticketService.ts`, o la regla en el servidor | Regla 13, punto 1: la regla vive en shared y los dos lados la consumen. El módulo del servidor sólo lee |
| A-4 | La fecha inválida va en el **mismo `422`** de `:132`, **detrás** de `plan.errors` y **delante** de la guarda de derivación (`:136-140`) | Un `422` propio antes o después de `:136-140` | Las tres son escalón C (`openspec/specs/transitions-st/spec.md:162-163`); sub-orden «presencia antes que validez» (`:729-731`); y un solo `422` enseña todos los errores de campo de una vez. Lo fijan dos pruebas de posición (§6.3) |
| A-5 | `diaEnZona(valor: unknown)`: `YYYY-MM-DD` real → tal cual; instante con `Z`/`±hh:mm`, o `Date` → día en `ZONA_NEGOCIO` con `formatToParts`; fecha-hora sin desplazamiento, fecha irreal o ilegible → `null` | Aceptar lo que acepte `Date.parse` | `new Date('2026-09-09')` es medianoche UTC, el día 8 en Bogotá; y sin desplazamiento `Date.parse` lee en la zona del proceso, que es lo que se quiere quitar |
| A-6 | `created_time` se normaliza con `iso()` (`apps/desk/server/db/ticketFuentes.ts:49-50`) antes de la fórmula | Fiarse del tipo | Se declara `string \| null` (`packages/zoho-sync/src/db/rows.ts:26`), pero pg y pg-mem entregan `Date` (`ticketFuentes.ts:49`); es el gesto de `fechasTicket.ts:34`. `diaEnZona` acepta además `Date` |
| A-7 | `Intl.DateTimeFormat('en-US', { timeZone: ZONA_NEGOCIO, year: 'numeric', month: '2-digit', day: '2-digit' })` construido **una vez**, a nivel de módulo | Construirlo en cada llamada | Si el runtime no conociera la zona, el proceso cae al arrancar —visible en el despliegue— en vez de dar `500` en tres transiciones. Indicio de que funciona: `fmtTime` ya formatea en `America/Bogota` en cada lista de tickets (`packages/zoho-sync/src/db/mappers.ts:164-176`, `:200`). *Hipótesis* hasta la tarea docker (§6.5) |
| A-8 | Demostración de zona **permanente** con `vi.stubEnv('TZ', …)` por bloque, **en lugar de P-4** (retirada) | P-4 (`process.env.TZ ??= 'UTC'` en `vitest.config.ts`) y corridas manuales con `TZ=` | Hallazgo que la propuesta no tenía: `apps/desk/src/lib/remisionResultado.test.ts:15-16` ya corre un fichero en Bogotá con `vi.stubEnv`, con autoguarda (`:23`). Así las dos zonas se prueban en cada `npm test` y en el CI, y `vitest.config.ts` (37 citas) queda sin diff. Con las tres condiciones del analista (§6.4) |
| A-9 | P-3 en sitio: la línea en blanco `bodegaje.ts:19` pasa a ser el `import`; `:130-132` pasan a dos líneas de comentario y `return diaEnZona(valor)` | Añadir una línea de `import` | Ninguna cita de `bodegaje.ts` apunta a `:19` ni a `:20` (medido). La cabecera `:1-18`, citada como `:8-18`, no se toca |

## 3 · `ticketService.ts` — el texto exacto de las cuatro líneas

Hoy la línea de `import` más larga es `:2` (118 caracteres) y el fichero ya tiene líneas de 140 a 190
(`:68`, `:76`, `:99`, `:149`). No hay `max-len`. La `:6` fundida mide 137.

```ts
// :6   (antes :6 y :7, fundidas)
import { buildSubject, buildCodigoServicio, PREFIJOS, transitionById, canExecuteTransition, CLAVE_DERIVACION } from '@ambientalia/shared'
// :7   (nueva)
import { valoresConFechasDerivadas } from './valoresDeTransicion'
// :130 (antes: const values = (b.values ?? {}) as Record<string, unknown>)
  const { values, erroresFecha } = await valoresConFechasDerivadas(db, current, t, b.values)
// :132 (antes: if (plan.errors.length) throw new HttpError(422, { errors: plan.errors }))
  if (plan.errors.length || erroresFecha.length) throw new HttpError(422, { errors: [...plan.errors, ...erroresFecha] })
```

`:131` (`buildTransitionPlan(t, values)`) y `:153` (`applyTransition(…, plan, actor, values)`) no se tocan:
`values` ya es el efectivo, así que la columna **y** `ticket_transitions.values` (`repo.ts:285`) guardan el
derivado (P-1). `current` ya llega estrechado a no nulo por `:123`.

## 4 · Contratos

### 4.1 `packages/shared/src/fechasDerivadas.ts` (nuevo; `export * from './fechasDerivadas'` como `index.ts:17`)

```ts
export const ZONA_NEGOCIO = 'America/Bogota'
export const FUENTE_DE_FECHA = {
  'Fecha creación ticket': 'createdAt',
  'Fecha Remisión Entrada': 'remisionEntrada',
  'Fecha Revisión Informe': 'escaladoARevisionAt',
} as const
export type EtiquetaFechaDerivada = keyof typeof FUENTE_DE_FECHA
export type FuenteDeFecha = (typeof FUENTE_DE_FECHA)[EtiquetaFechaDerivada]
export interface FuentesDeFechas {
  createdAt?: unknown                                                  // instante: ISO con desplazamiento o Date
  remisiones?: ReadonlyArray<{ tipo: string; fecha: string }> | null   // vigentes, la más reciente primero
  escaladoARevisionAt?: unknown
}
export function diaEnZona(valor: unknown): string | null
export function fechasDerivadas(f: FuentesDeFechas): Record<EtiquetaFechaDerivada, string | null>
export function fuentesQueNecesita(t: Pick<Transition, 'fields'>): Set<FuenteDeFecha>
export function valoresEfectivos(t: Pick<Transition, 'fields'>, recibidos: unknown, fuentes: FuentesDeFechas):
  { values: Record<string, unknown>; erroresFecha: string[] }
```

- **`fechasDerivadas`**: `createdAt` y `escaladoARevisionAt` por `diaEnZona`; `remisionEntrada` =
  `diaEnZona(r.fecha)` de la **primera** con `tipo === 'entrada'` (la regla de `valoresTransicion.ts:56`,
  sobre el orden de `apps/desk/server/db/remisiones.ts:76-79`; `fecha` ya sale `YYYY-MM-DD`, `:14`).
- **`valoresEfectivos`**, en este orden: (1) `recibidos` que no sea objeto plano → `{}`; se copian todas sus
  claves **menos las tres etiquetas** (P-2), con un `Set` y no con `in`, que también ve el prototipo.
  (2) Para cada campo de `t.fields` que sea una de las tres: derivada no nula → se escribe la derivada
  (D-1: pisa navegador y columna). Si no, lo recibido: ausente, `null` o `''` → no se escribe (la ausencia
  la contesta `apps/desk/server/transitionExec.ts:77`); presente → se copia y, si no es una `YYYY-MM-DD` real,
  `Fecha inválida en el campo: <label>`, el molde de `:77` (D-3). Lo inválido se queda en `values` para que
  el plan no lo cuente además como ausente; el `422` impide que se escriba.
- Apto para navegador: sólo `import type { Transition } from './transitions'`. **Sin `any`**: el techo de
  avisos del CI no tiene holgura (`eslint.config.js:14-15`).

### 4.2 `apps/desk/server/services/valoresDeTransicion.ts` (nuevo)

```ts
export async function valoresConFechasDerivadas(
  db: Queryable, current: { row: { id: string; created_time: string | null } }, t: Transition, recibidos: unknown,
): Promise<{ values: Record<string, unknown>; erroresFecha: string[] }>
```

`fuentesQueNecesita(t)` vacío → `valoresEfectivos(t, recibidos, {})` **sin consultas**: P-2 vale también para
las 31 transiciones que no declaran ninguna (las tres que sí: `transitions.ts:191`, `:219`, `:221`). Si no, lee
sólo lo pedido: `iso(current.row.created_time)`; `listRemisionesByTicket` (`remisiones.ts:76-79`) si pide
`remisionEntrada`; `instanteUltimaTransicion(db, id, 'escalado_a_revision')` (`apps/desk/server/db/fechasTicket.ts:22-35`)
si pide `escaladoARevisionAt`, como el detalle (`routes/tickets.ts:142`). **La lectura no es guarda.**

### 4.3 Cliente — `apps/desk/src/lib/valoresTransicion.ts`

Para las tres, `valoresConocidos` (`:49-79`) pasa a `derivadas[etiqueta] ?? (yaEsta(cf[etiqueta]) ? cf[etiqueta]
: null)`, con `derivadas = fechasDerivadas({ createdAt, remisiones, escaladoARevisionAt })`. `diaLocal` (`:22-36`)
se borra; `:1` añade los nombres dentro de sus llaves; la cabecera `:3-17` se reescribe **en sitio**. La columna
llega como `YYYY-MM-DD` (`dateOnly`, `packages/zoho-sync/src/db/mappers.ts:30-37`, `:229`): el prellenado sin
fuente pasa la validación estricta del servidor.

## 5 · Flujo

```
POST /api/tickets/:id/transition → executeTransition
  :120-129  A y B, sin cambios
  :130      valoresConFechasDerivadas ─┬─ fuentesQueNecesita(t) = ∅ → valoresEfectivos(t, b.values, {})  (0 consultas)
                                       └─ si no: iso(created_time) · remisiones · último escalado → valoresEfectivos
  :131      buildTransitionPlan(t, values)          presencia (transitionExec.ts:77)
  :132      422 [...plan.errors, ...erroresFecha]   C: presencia, luego validez
  :136-140  derivación (C) · :146-150 OV (D) · :153 applyTransition(values) → columna e historial con el derivado
Cliente: valoresConocidos → fechasDerivadas (la misma fórmula) → TransitionPanel prellena y bloquea
```

## 6 · Pruebas (`strict_tdd`)

### 6.1 Dónde y con qué arnés

| Fichero | Arnés | Cubre |
|---|---|---|
| `packages/shared/src/fechasDerivadas.test.ts` (nuevo) | ninguno | `diaEnZona` (las cinco ramas de A-5), `fechasDerivadas`, `valoresEfectivos` (D-1, D-3, P-2, mensaje); criterios 6 y 7 en las dos zonas (§6.4) |
| `packages/shared/src/bodegaje.test.ts` (añadido **al final**) | su `paso()` | criterio 6 vía `periodosDeBodegaje`: `'Fecha Remisión Entrada': '2026-02-02T02:00:00Z'` abre el `2026-02-01`. Ninguna prueba vigente lee un instante con `dia()`: todos sus valores son `YYYY-MM-DD` o `'sin fecha'` (medido) |
| `apps/desk/server/services/valoresDeTransicion.test.ts` (nuevo) | `instalarArnes()` y `db` (`apps/desk/server/testing/appHarness.ts:25`, `:34-40`), llamando a `executeTransition` directo como `ticketService.test.ts:46-63` | criterios 1-5 y las dos de posición |
| `apps/desk/src/lib/valoresTransicion.test.ts` | ninguno | se invierten `:33-40` y `:117-123` (con fuente, gana lo derivado) y se añade «sin fuente, la columna se prellena»; `:100-104`, tautológica, pasa a ser la demostración de §6.4 |

**Montaje, todo con precedente leído:** ticket con `created_time` literal (`packages/zoho-sync/src/db/repo.test.ts:128`);
remisión con `INSERT INTO remisiones (id, ticket_id, fecha, tipo)` (`apps/desk/server/db/eliminarTicket.test.ts:126`),
con `created_at` explícito cuando haya dos; escalado con `INSERT INTO ticket_transitions (ticket_id,
transition_id, performed_at)` y `new Date(…)` (`apps/desk/server/transiciones.test.ts:72-73`). **Lectura:**
columna `date` como `Date` → `.toISOString().slice(0, 10)` (`apps/desk/server/remisiones.test.ts:213`);
`values` con `json()` (`ticketFuentes.ts:53-54`).

**Pruebas vigentes que NO cambian, comprobado:** el barrido de las 34 inserta tickets sin `created_time`
(`transicionesEjecucion.test.ts:263-264`; la columna no tiene `DEFAULT`, `schema.sql:26`) y manda `'2026-01-15'`
(`appHarness.ts:75`): sin fuente, pasa. Igual `transiciones.test.ts:202` (ticket de `:16`) y el `422` de `:263`.

### 6.2 Servidor — rojos por aserción contra el código de hoy, no por `import`

1. Navegador ≠ derivado en las tres (`ingreso_a_servicio` desde `Ingresado`; `reporte_por_garantia` desde
   `Notificado`) → columna **y** historial con el derivado. `created_time` y escalado en
   `2026-09-10T00:30:00Z` → `2026-09-09`.
2. Dos remisiones de entrada vigentes, una anulada y una de salida → la `fecha` de la entrada vigente más
   reciente, tal cual.
3. Con fuente y sin mandar las fechas → `200`.
4. Sin fuente: `2026-02-28` pasa; `2026-02-30`, `10/09/2026` y `2026-09-10T00:30` → `422` con el mensaje.
5. P-2: `Fecha Remisión Entrada` enviada en `escalado_a_revision` y en `reporte_por_garantia` no llega al
   historial.

### 6.3 Posición (regla de mutación 1)

- **P-a** · `ingreso_a_servicio` sin remisión, `Fecha Remisión Entrada: '2026-02-30'` **y**
  `derivado_a: 'no-existe'` → `errors` = `['Fecha inválida en el campo: Fecha Remisión Entrada']`.
  *Mutación:* llevar la validez detrás de `:136-140` → contesta la derivación → rojo.
- **P-b** · lo mismo sin `Código Servicio` → `errors` = `['Falta el campo obligatorio: Código Servicio',
  'Fecha inválida en el campo: Fecha Remisión Entrada']`, en ese orden. *Mutación:* invertir el `spread`
  de `:132` → rojo.

P-a es posible porque `TRANSITIONS` añade la derivación a todas (`transitions.ts:295-298`). Otras dos
mutaciones: quitar el filtro de P-2 → rojo el caso 5; `toISOString().slice(0, 10)` en `diaEnZona` → rojos los
dos bloques de §6.4 (el día UTC no depende de la zona del proceso). Las cuatro quedan en `apply-progress` con su salida.

### 6.4 Demostración de zona

En `valoresTransicion.test.ts` y en `fechasDerivadas.test.ts`: `describe.each(['UTC', 'America/Bogota'])`
(precedente de una zona por fichero: `remisionResultado.test.ts:15-16`, autoguarda en `:23`). Aquí se cambia
de zona **entre bloques dentro del mismo proceso**, así que rigen las **tres condiciones del analista**
(2026-09-21, al retirar P-4):

1. **Autocomprobación propia en cada bloque**, antes de mirar nada: el parseo ingenuo de una `YYYY-MM-DD`
   retrocede un día en Bogotá y no en UTC — `new Date('2026-09-10').getDate()` vale `9` en el bloque de
   Bogotá y `10` en el de UTC. Un bloque que no lo demuestra no vale: su zona no está puesta.
2. **`vi.stubEnv('TZ', zona)` en el `beforeAll` de cada bloque y `vi.unstubAllEnvs()` en su `afterAll`**,
   para que ninguna zona se escape al bloque siguiente.
3. **La fase roja queda en `apply-progress`** con comando y salida (tabla de abajo).

Título con «zona». Caso: `2026-09-10T00:30:00Z` → `2026-09-09` en `Fecha creación ticket` y en
`Fecha Revisión Informe`.

| Corrida | Comando exacto | Esperado |
|---|---|---|
| Roja, vieja | `npx vitest run apps/desk/src/lib/valoresTransicion.test.ts -t zona` | bloque UTC **rojo** (`'2026-09-10'`); bloque Bogotá **verde en falso**; las dos autocomprobaciones en verde |
| Verde, nueva | el mismo, y `npx vitest run packages/shared/src/fechasDerivadas.test.ts -t zona` | los dos bloques verdes, con sus autocomprobaciones |

`vitest.config.ts` **no se toca** (P-4 retirada): la suite sigue arrancando en UTC y sólo los bloques de
zona cambian la suya.

### 6.5 Producción (`node:22-alpine`, `Dockerfile:2` y `:10`)

```
docker run --rm node:22-alpine node -e "const p=new Intl.DateTimeFormat('en-US',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date('2026-09-10T00:30:00Z'));const v=t=>p.find(x=>x.type===t).value;console.log(v('year')+'-'+v('month')+'-'+v('day'))"
```

Salida esperada: `2026-09-09`. Sin docker se escribe «no ejecutable», nunca «verde». **Comprobación de
persona** (regla del ciclo 1: fuera del recuento; archivar no la da por hecha). Dueño: quien tenga la consola
de EasyPanel. Qué: el mismo `node -e` en el contenedor real, y además
`node -e "console.log(Intl.DateTimeFormat().resolvedOptions().timeZone)"`. Dónde: E-021 y `archive-report.md`.

## 7 · Desplazamiento por fichero

| Fichero | Citas vivas | Reescritas en sitio | Añadidas | Borradas | Neto |
|---|---|---|---|---|---|
| `apps/desk/server/services/ticketService.ts` | 125 en 32 (medida de la propuesta) | 4: `:6`, `:7`, `:130`, `:132` | 0 | 0 | **0** |
| `packages/shared/src/bodegaje.ts` | 16 en 9 (`grep -o` propio fuera de `openspec/changes/`; la propuesta decía 14 en 8) | 4: `:19`, `:130`, `:131`, `:132` | 0 | 0 | **0** |
| `vitest.config.ts` | 37 en 15 | 0 | 0 | 0 | **sin diff** (P-4 retirada) |
| `packages/shared/src/index.ts` | 1, a `:6` | 0 | 1, `:17`, al final | 0 | 0 |
| `apps/desk/src/lib/valoresTransicion.ts` | 3 en 2, las tres a `:3-17` | `:1`, `:3-17`, `:19-20` | ≈ 8 | ≈ 30 (`:22-36` y cuerpo) | ≈ −20 desde `:21`; `:3` no se mueve |
| `apps/desk/server/transitionExec.ts` | 38 en 14 | 0 | 0 | 0 | **sin diff** |
| `packages/zoho-sync/src/db/repo.ts` | — | 0 | 0 | 0 | **sin diff** |

## 8 · Regla de mutación 4 — lo que queda, medido

- **`ticketService.ts`**: no hay inserción, borrado ni movimiento. Comprobación dirigida de lo que citan
  las cuatro líneas: **0** citas completas a `:1-8`; a `:130-132` sólo `transitions-st/spec.md:584`
  (`:132-136`, el bloque de la OV en otra revisión: no afirma nada de estas líneas); y **una** cita literal del
  cuerpo viejo, `transitions-st/spec.md:162` (fila 5 de RQ-TS-06), que reescribe el delta de `transitions-st`.
- **`vitest.config.ts`**: sin diff (P-4 retirada), así que no hay nada que barrer.
- **Al ARCHIVAR (indicación del analista, 2026-09-21):** las anclas de los bloques `MODIFIED` y `ADDED` de los
  dos deltas se vuelven a comprobar contra el árbol de **ese** momento, no contra `4976787`. Es lo que falló en
  F1B-10: su `apply` movió las líneas después de escribir el delta, y su archive fusionó anclas caducas (E-023).
  Aquí las ediciones de `ticketService.ts` son en sitio, pero **`:130` y `:132` cambian de contenido**: toda cita
  que las nombre tiene que describir el contenido nuevo (`valoresConFechasDerivadas`; el `422` con
  `[...plan.errors, ...erroresFecha]`). Va en las tareas de cierre y en el `archive-report.md`.
- **`valoresTransicion.ts:3-17`**: `openspec/config.yaml:442` (ficha IV-2, que el cierre pasa a CERRADO) y
  `F0-00_Baseline_as-built.md:147`, `:574` (mismo anclaje). Las abreviadas de la fila IV-2 de `CLAUDE.md`
  (`:3-17`, `:49-79`) se reescriben con la fila, con las líneas de después de editar.
- **Rango desplazado una línea** (la propuesta midió dos; aquí cuatro): `bodegaje.ts:60-66` en
  `openspec/config.yaml:476`, `openspec/specs/trazas/spec.md:274`, `CLAUDE.md:338` y
  `docs/sdd/F1A-05_Auditoria_blueprint_audit-F1A.md:224`; el bloque es `:59-65`. Se decide caso a caso (A/B/C).

## 9 · Regla de mutación 3 — la tabla que se completa en el cierre

| Decisión del cliente | Dónde | Línea del servidor que la impone |
|---|---|---|
| Prellena la derivada cuando hay fuente | `valoresConocidos` | `ticketService.ts:130` → `valoresEfectivos` (D-1). Espejo legítimo cuando pasen 6.2.1 y 6.2.3 |
| La enseña bloqueada | `TransitionPanel.tsx:32-36`, `:174` | La misma: el servidor ignora lo que llegue (D-1) |
| Sin fuente, prellena la columna y la bloquea | `valoresConocidos` y `TransitionPanel.tsx:32-36` | **Ninguna, a propósito**: sin fuente el servidor acepta cualquier fecha real (D-3). El bloqueo es comodidad genérica del panel, no regla; el cierre lo declara así |
| Sin fuente ni columna, deja teclear | `TransitionPanel.tsx:254` (`type="date"`) | Presencia `transitionExec.ts:77`; validez `ticketService.ts:132` |
| Manda `YYYY-MM-DD` | `TransitionPanel.tsx:254` | `ticketService.ts:132` |
| *Hipótesis:* no manda las tres en transiciones que no las declaran | `TransitionPanel` | P-2 en `valoresEfectivos`: el servidor las descarta igual |

## 10 · Presupuesto (techo 800 por intento)

Estimaciones en líneas `+`/`−`; lo nuevo cuenta entero. Medida real: `openspec/config.yaml:1681-1690`
(`--shortstat --no-renames` más `wc -l` de lo nuevo sin trackear). Sin `git mv`, el desvío 3 no aplica; lo
nuevo que quede sin trackear al asentar lo cuenta de menos el ledger (desvío 1).

| Fichero | Estimado | Base |
|---|---|---|
| `packages/shared/src/fechasDerivadas.ts` | 100–120 | §4.1, con los comentarios al estilo del paquete |
| `packages/shared/src/fechasDerivadas.test.ts` | 120–150 | ≈ 20 casos, dos zonas |
| `packages/shared/src/index.ts` | 1 | |
| `packages/shared/src/bodegaje.ts` / `.test.ts` | 8 / 15–25 | 4 en sitio / un caso |
| `apps/desk/server/services/valoresDeTransicion.ts` | 30–40 | §4.2 |
| `apps/desk/server/services/valoresDeTransicion.test.ts` | 150–190 | 9 casos y montaje |
| `apps/desk/server/services/ticketService.ts` | 8 | 4 en sitio |
| `apps/desk/src/lib/valoresTransicion.ts` / `.test.ts` | 55–75 / 55–80 | §4.3 / §6.1 |
| **Código y pruebas** | **540–705** | |
| Cierre documental: `CLAUDE.md`, `openspec/config.yaml`, entrada 16 de `F0-01`, barrido, E-021 | 80–110 | |
| `apply-progress.md` y marcas de `tasks.md` | 150–300 | el `apply-progress.md` de `orden-precedencia-guardas` mide 272 |
| **Un solo intento** | **770–1.115** | |

**No cabe con seguridad en un intento de 800.** Recomendación: **dos intentos**, cada uno con la suite en
verde al terminar.

- **A** · shared y servidor, con sus pruebas, posición, mutaciones y docker: ≈ 440–560, más
  progreso ≈ 100–150 → **540–710**. Tras A el servidor ya impone; el cliente sigue prellenando con su
  lógica vieja y la respuesta devuelve el valor impuesto.
- **B** · cliente, demostración de zona de §6.4 y cierre documental: ≈ 190–265, más progreso ≈ 60–120 →
  **250–385**.
- **`verify-report.md`, aparte:** 186–358 por los precedentes de la propuesta; el de
  `orden-precedencia-guardas` mide 302.

## 11 · Matriz de amenazas, migración y vuelta atrás

**Amenazas:** N/A — sin enrutado, shell, subprocesos, VCS/PR, ejecutables ni integración de procesos (el
`docker run` de §6.5 es manual). **Migración:** ninguna. **Vuelta atrás:** revertir; quedan fechas válidas.

## 12 · Preguntas abiertas y riesgos

1. **P-4: RETIRADA** por el analista el 2026-09-21. A-8 la sustituye, con las tres condiciones de §6.4, y
   `vitest.config.ts` queda sin diff.
2. **P-3 estrecha lo legible, y no sólo para IV-2.** `dia()` pasa de aceptar lo que acepte `Date.parse`
   (fecha-hora sin desplazamiento, otros formatos) a devolver `null`, para los seis operandos de
   `BODEGAJES` (`bodegaje.ts:58-80`). *Hipótesis:* nadie los escribe así (`TransitionPanel.tsx:254` manda
   `YYYY-MM-DD`). Comprobación de persona con acceso a la base: contar en `ticket_transitions.values` los
   valores de esas seis etiquetas que no casen `^\d{4}-\d{2}-\d{2}$`.
3. **Presupuesto:** dos intentos (§10) o un techo mayor aprobado por Gerencia. Decide el analista.
