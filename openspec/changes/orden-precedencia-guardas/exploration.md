# Exploración — `orden-precedencia-guardas` (F1B-10)

**Fase:** `sdd-explore` · **Fecha:** 2026-09-17 · **Árbol de referencia:** `9d662a9`
Toda cita `ruta:línea` de este documento se lee contra ese árbol, salvo que diga lo contrario.

**Encargo:** `plan:425` — «Orden único de precedencia entre guardas», capacidades `transitions-st` y
`tickets-core`, fuentes «transitions-st §3.8 (a) y (b), tickets-core §4.1; entrada 5.a de F0-01»,
bloqueo «— (ninguno técnico; el orden se declara en la spec)», talla **M**, sesión «Por asignar».

> **Nota de procedencia.** La entrada 5.a vive en `docs/sdd/F0-01_Correcciones_para_el_plan.md:243`
> («Falta una fila: el contrato de errores del motor no tiene tanda»), **no** en el fichero de
> correcciones para el maestro. Los dos existen y el encargo los nombra igual, «F0-01».

---

## 0 · Lo que más cambia el alcance, primero

**Hay una QUINTA guarda en `createManagedTicket` que ninguna de las dos specs menciona, y su orden no
está probado.** Es la guarda equipo↔cliente, `apps/desk/server/services/ticketService.ts:65-83`, con su
`422` en `:82`. La añadió `cerrar-hallazgos-revision-f1b-01` **después** de que se escribiera
`transitions-st §3.8`, y su posición está declarada **sólo por comentario** (`:54-58`).

Ese comentario es la razón de ser de esta tanda, escrita por la tanda anterior:

> *«Va AQUÍ, después del 409 de la OV y antes de los obligatorios, por dos razones: (a) la rama (i) de
> abajo tiene que rellenar el hueco ANTES de `:88` …; (b) meterla antes del 409 alteraría el tramo
> 409/422 que `ticketService.test.ts` declara y deja explícitamente sin decidir (no es esta tanda).»*
> — `ticketService.ts:54-58`

O sea: la guarda se colocó donde se colocó **para no tocar el tramo que F1B-10 tiene que decidir**. Esta
tanda es «esta tanda». Y bajo la **regla de mutación 1** de `CLAUDE.md`, un orden declarado por
comentario y no fijado por prueba «es tanto como decir ninguna»: es exactamente el molde de H3.

---

## 1 · El orden real de las guardas, leído del código

### 1.1 · `createManagedTicket` (`ticketService.ts:20-105`)

| # | Respuesta | Línea | Nota |
|---|---|---|---|
| 1 | `422` «Falta el equipo» | `:23` | |
| 2 | `422` «Equipo no registrado» | `:25` | |
| 3 | `422` «Orden de venta no encontrada» | `:37` | sólo si `b.salesOrderId` |
| 4 | `409` «… ya está asociada al ticket #…» | `:48` | `ticketConOrdenVenta` |
| 5 | `422` «El equipo … es de … y el ticket se está creando para …» | `:82` | **la quinta guarda; sin prueba de posición** |
| 6 | `422` «Faltan campos obligatorios: …» | `:92` | |
| 7 | `422` «Cliente no encontrado» | `:94` | |

### 1.2 · `executeTransition` (`ticketService.ts:108-215`)

| # | Respuesta | Línea |
|---|---|---|
| 1 | `400` «Transición desconocida» | `:117` |
| 2 | `404` «Ticket no encontrado» | `:119` |
| 3 | `409` «La transición "…" no aplica desde el estado "…"» | `:120-122` |
| 4 | `403` «Tu rol no tiene permiso para esta transición (área: …)» | `:123-125` |
| 5 | `422` `plan.errors` (obligatorios) | `:128` |
| 6 | `409` «La orden de venta … ya está asociada al ticket #…» | `:132-136` |
| 7 | `422` «La persona a la que se deriva no existe o está dada de baja» | `:140-144` |

### 1.3 · Alta de remisión (`apps/desk/server/routes/remision.ts`)

| # | Respuesta | Línea | Nota |
|---|---|---|---|
| 1 | `422` «Falta el ticket» | `:123` | |
| 2 | `422` «Ticket no encontrado» | `:125` | ⚠️ mismo mensaje que el `404` de `:119` del motor |
| 3 | `422` «Fecha inválida» | `:127` | |
| 4 | `422` «Falta el serial del equipo…» | `:154-157` | F1B-01; orden declarado en `:144-147` **y probado** |
| 5 | `409` «Este ticket ya tiene una remisión sin desenlace…» | `:174-183` | |
| 6 | `422` «Ítems fuera del checklist: …» | `:197` | |
| 7 | `422` «Orden de venta no encontrada» | `:220` | sólo si `b.salesOrderId` |
| 8 | `409` tercera puerta (`ticketConOrdenVenta`) | `:231-234` | **ya probado por posición; no se reabre** |

---

## 2 · Las dos inversiones de `transitions-st §3.8`, contrastadas contra el código de hoy

**(a) Las dos puertas de la OV corren en órdenes opuestos. SIGUE SIENDO CIERTO.**
`createManagedTicket` da el `409` de la OV (guarda 4, `:48`) **antes** que el `422` de obligatorios
(guarda 6, `:92`). `executeTransition` lo hace al revés: `422` del plan (guarda 5, `:128`) **antes** que
el `409` de la OV (guarda 6, `:132-136`).

**(b) El `409` de estado antes que el `403` de área, en `executeTransition`. SIGUE SIENDO CIERTO** —
`:120-122` corre antes que `:123-125`. Ojo al leer §3.8(b): lo declara con **SHALL** como el
comportamiento que se **fija**, no como algo que haya que invertir.

**Lo que §3.8 NO refleja: la guarda 5.** Su tabla describe el orden de `createManagedTicket` sin la
guarda equipo↔cliente, porque no existía cuando se redactó. No cambia la naturaleza de la inversión (a),
pero el «orden único» que esta tanda declare tiene que decidir **también** dónde va esa guarda.

---

## 3 · La talla, medida contra el árbol de hoy

**Doce pruebas de precedencia, y la cifra sigue siendo exacta.** `describe('executeTransition · el ORDEN
en que se evalúan las guardas')` (`ticketService.test.ts:143`) tiene **8** `it`;
`describe('createManagedTicket · el ORDEN…')` (`:315`) tiene **4**. Total **12**.

**⚠️ `transitions-st/spec.md:682` cita `:176` y `:295` como el par de pruebas contradictorias, y esa
cita está CADUCADA.** Contra el árbol de hoy:

| Cita | Qué hay hoy en esa línea |
|---|---|
| `:176` | un comentario (`⚠️ ESTA PRUEBA Y LA DE :327 DICEN LO CONTRARIO…`), no un título |
| `:295` | `await equipo(); await cliente()`, cuerpo de otra prueba |
| **`:194`** | `it('los obligatorios que faltan ganan a la orden de venta ya usada: 422, no 409', …)` |
| **`:327`** | `it('la orden de venta ya usada gana a los obligatorios que faltan: 409, no 422', …)` |

Las contradictorias son hoy `:194` y `:327`. **`openspec/specs/tickets-core/spec.md:380-382` ya las
cita bien**; el
desfase vive **sólo** en `transitions-st`. Es la regla de mutación 4 de `CLAUDE.md`, **caso A ·
presente**: la afirmación sigue siendo cierta, sólo hay que reapuntar la línea.

*Y el detalle que lo remata:* el propio comentario del código, en esa misma `:176`, **ya cita `:327`
correctamente**. El código está al día; la spec no.

**El «6 de 12» tiene dos versiones y ninguna está cerrada.** `tickets-core/spec.md:376-377` lista
`:154`, `:160`, `:166`, `:205`, `:327`, `:336`, y esos seis números resuelven a títulos reales hoy. Pero
`F0-01_Correcciones_para_el_plan.md:262-266`, que es el origen del cálculo, usaba **otro conjunto** para
la misma afirmación. **Hipótesis del explorador, no verificada de forma independiente:** ninguna de las
dos fuentes define «el orden natural» con más precisión que «422 de datos antes que 409 de conflicto».

---

## 4 · Qué órdenes están PROBADOS por posición y cuáles sólo DECLARADOS

**El molde** es `apps/desk/server/remisiones.test.ts:957` — *«serial vacío y remisión pendiente a la vez:
422 por el serial, no 409 por la pendiente»*. Activa **dos guardas a la vez** y fija cuál gana.

| Par de guardas | ¿Probado? | Evidencia |
|---|---|---|
| `createManagedTicket` 1 vs 3 | Sí | `ticketService.test.ts:316` |
| `createManagedTicket` 4 vs 6 | Sí | `:327` |
| `createManagedTicket` 4 vs 7 | Sí | `:336` |
| `createManagedTicket` 6 vs 7 | Sí | `:343` |
| **`createManagedTicket` 4 vs 5** | **NO — sólo comentario** (`ticketService.ts:54-58`) | ninguna prueba combina OV duplicada con discrepancia equipo↔cliente |
| **`createManagedTicket` 5 vs 6** | **NO — sólo comentario** (`:54-58`) | las pruebas de la guarda 5 (`:362`–`:458`) siempre satisfacen los obligatorios |
| `executeTransition` 1 vs 2 | Sí | `:144` |
| `executeTransition` 2 vs 4 | Sí | `:149` |
| `executeTransition` 3 vs 4 | Sí | `:154` — fija §3.8(b) |
| `executeTransition` 3 vs 5 | Sí | `:160` |
| `executeTransition` 4 vs 5 | Sí | `:166` |
| `executeTransition` 5 vs 6 | Sí | `:194` — fija §3.8(a) por este lado |
| `executeTransition` 6 vs 7 | Sí | `:205` |
| Remisión 4 vs 5 | Sí | `remisiones.test.ts:957` — el molde |
| Remisión 4 vs 8 | **Sí, ya probado — NO SE REABRE** | `remisiones.test.ts:1029`, bajo el comentario `:1011-1013` |

**Conclusión: de quince pares, trece están probados y dos no.** Los dos que faltan son los de la guarda
equipo↔cliente, y son justo los que el comentario `:54-58` dejó «sin decidir».

---

## 5 · Qué significaría «orden único»

**Las tres puertas NO usan hoy el mismo criterio.** El eje que las separa es
**validación/obligatorios frente a unicidad/conflicto**:

- `executeTransition` y el alta de remisión: validación **antes** que conflicto (`422 → 409`).
- `createManagedTicket`: al revés (`409 → 422`).

Es exactamente el eje que denuncian §3.8(a) y §4.1. **Unificar cambia comportamiento observable en algún
sitio, siempre**, y por dónde se unifique cambia a quién le cambia el mensaje. Eso es decisión de
Gerencia, y el propio `ticketService.test.ts:186-192` ya lo dice por escrito.

**Segunda inconsistencia, que ninguna spec menciona:** el mismo error semántico se contesta con dos
códigos distintos — `404` en `ticketService.ts:119` y `422` en `remision.ts:125`, los dos con el texto
«Ticket no encontrado». No es precedencia: es el **código** de la respuesta. La entrada 5.a habla de
«contrato de errores», que es más ancho que «orden», así que si entra o no en el alcance es una decisión,
no una deducción.

---

## 6 · Preguntas abiertas para la ronda `interactive`

1. **¿Qué dirección gana en el eje obligatorios-vs-unicidad?** (A) `createManagedTicket` se alinea con
   las otras dos: cambian `:327` y `:336` de `409` a `422`. (B) Las otras dos se alinean con
   `createManagedTicket`: cambia `:194`, y muy probablemente hay que mover la guarda de remisión
   pendiente, invirtiendo un precedente que F1B-01 fijó a propósito. Ninguna es gratis.
2. **¿Dónde va la guarda equipo↔cliente en el orden único, y con qué prueba se blinda?**
3. **¿`:154` cambia o no?** §3.8(b) lo declara con `SHALL` como ya correcto, y la lista de «6 de 12» lo
   incluye entre los que cambiarían. Las dos lecturas no pueden ser ciertas a la vez.
4. **¿Alcance = precedencia, o contrato de errores completo?** Si entra el `404`/`422`, la talla crece.
5. **Reparar de camino** la cita caducada de `transitions-st/spec.md:682` (`:176`/`:295` → `:194`/`:327`).

---

## 7 · Hallazgo de registro: las dos specs dicen que el plan no tiene fila para esto

`openspec/specs/transitions-st/spec.md:675-683` y `openspec/specs/tickets-core/spec.md:355-359` siguen
llevando el bloque «⚠️ REASIGNADO EL 2026-09-09 … el plan no tiene fila para esto».

**Es falso desde el 2026-09-10.** Gerencia aprobó la entrada 5.a «tal cual»
(`docs/sdd/Decisiones_Gerencia_2026-09-10.md:598`) y el plan la lleva hoy como **F1B-10** (`plan:425`).

**Y son TRES sitios, no dos: el tercero está en CÓDIGO.** `apps/desk/server/services/ticketService.test.ts:186-192`
repite la misma afirmación —«No hay ninguna fila del plan que lo cubra: es una fila que falta, redactada
como entrada 5.a»— en el comentario de cabecera de las pruebas de precedencia. Un barrido sobre
`openspec/specs` sólo caza dos; hace falta mirar también el código. Es el molde de siempre: un detector
que no caza todo lo que la afirmación abarca.

Esta tanda es el destino que esas tres entradas decían no tener, así que corregirlas es trabajo suyo, no
de quien pase por ahí.

---

## 8 · Lo que esta tanda NO reabre

- **La tercera puerta de la orden de venta** (`remision.ts:231-234`): su orden frente al `422` del serial
  ya está fijado por prueba de posición (`remisiones.test.ts:1029`). Esta tanda lo **recoge** en la spec.
- **IV-8** (`ticketService.ts:39`, el `clientId` de la OV sin contrastar) y **IV-11**: siguen vivos y sin
  destino. No son precedencia.
