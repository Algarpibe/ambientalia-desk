# Delta para `tickets-core`

Retrofit: la reasignación ya está commiteada (`56ff441`). §4.1 y §4.2 del spec vigente ya llevan la
nota de REASIGNADO; este delta consolida ambas con sus specs hermanas y añade la talla cuantificada
que faltaba.

## MODIFIED Requirements

### Requirement: 4.1 · La precedencia del `409` de la OV frente al `422` de obligatorios

> **⚠️ REASIGNADO EL 2026-09-09.** Decía «destino F1A» y F1A cerró sin tocarlo: `ticketService.ts:43-49`
> sigue evaluando el `409` antes del `422`. **No hay tanda en el plan que lo cubra** —
> `grep -niE "guarda|precedenc|409|422"` sobre el plan entero devuelve cero filas sobre esta
> precedencia— es una fila que falta, redactada como entrada **5.a** de
> `docs/sdd/F0-01_Correcciones_para_el_plan.md`.
>
> Va con `transitions-st` §3.8, que **son DOS inversiones, no una**: (a) esta misma — el `409` de la
> OV contra el `422` de obligatorios, en órdenes opuestos entre el alta y `habilitar_servicio` — y (b)
> el `409` de estado antes del `403` de área, sólo en `executeTransition`. Corregir una sin la otra
> deja el problema (`transitions-st` §3.8).

**Comportamiento actual, a corregir en F1A.** En el alta, el `409` de la orden de venta gana al `422`
de obligatorios (`ticketService.ts:43-49` antes de `:50-58`; fijado en
`services/ticketService.test.ts:295`). En `habilitar_servicio` es al revés
(`ticketService.test.ts:176`). **Las dos puertas de la misma regla evalúan en órdenes opuestos**
(`ticketService.test.ts:277-287`).

**Talla cuantificada, no prometida.** Hay **12** pruebas de precedencia
(`services/ticketService.test.ts:143` y `:289`, un `describe` por endpoint). `:176` («los obligatorios
que faltan ganan a la orden de venta ya usada: 422, no 409») y `:295` («la orden de venta ya usada
gana a los obligatorios que faltan: 409, no 422») son **títulos opuestos literales, las dos en
verde**: una cambia sí o sí. Bajo el orden natural cambian **6 de 12**
(`:154`, `:160`, `:166`, `:187`, `:295`, `:304`), y tres de ellas alteran **qué error ve el usuario**,
no sólo el código de estado.

Detalle completo, con la segunda inversión hermana, en `transitions-st` §3.8. **Corregir una sin la
otra deja el problema.**

(Previously: citaba la segunda inversión sin declarar que eran dos, sin la talla cuantificada de las
12 pruebas y sin el resultado del `grep` sobre el plan.)

#### Scenario: El mismo error doble responde distinto según la puerta de entrada

- GIVEN un ticket con obligatorios sin completar y una orden de venta ya usada por otro ticket
- WHEN se manda por `POST /api/tickets`
- THEN responde `409` (la orden de venta gana)
- WHEN el mismo error doble se manda por `habilitar_servicio`
- THEN responde `422` (los obligatorios ganan) — el mismo par de errores, dos resultados

### Requirement: 4.2 · La tercera puerta de la orden de venta sigue abierta

> **⚠️ REASIGNADO EL 2026-09-09, y no a otra tanda.** Decía «destino F1A» y F1A cerró sin tocarlo.
> Al buscarle sitio apareció algo mayor: **la regla que esta puerta impondría está en duda en el
> propio maestro.** `R08.1.md:2071-2079` lista tres variantes reales y habituales —OV separadas por
> mano de obra y repuestos, OV global por varios equipos, varias OV sobre un mismo ticket— y concluye
> que «ninguna de las tres encaja en un modelo de "una OV, un ticket"». Es el **punto abierto nº 52**.
>
> **Esta entrada adopta el mismo enmarcado que `remisiones` §5.1: si nº 52 se resuelve a favor de las
> variantes, el arreglo es RETIRAR las dos puertas que ya existen (`ticketService.ts:45` y `:100`), no
> añadir la tercera.** Construirla antes de decidir cuesta el doble. Y nº 52 **no está en la tabla de
> decisiones del plan** (`plan:348-359`), así que ni llega a la agenda del viernes: redactado como
> entrada **5.b** de `docs/sdd/F0-01_Correcciones_para_el_plan.md`. La regla completa, con la cita
> íntegra del maestro y las dos alternativas, vive en `remisiones` §5.1.
>
> *Lo medido no se pierde:* `ordenVentaUnTicket.test.ts:141-159` fija el modo de fallo exacto y `:161`
> deja el `it.fails` esperando, sea cual sea la dirección de la decisión.

**Comportamiento actual, a corregir en F1A** (`config.yaml`, `incumplimientos_vivos`, IV-4). El alta
de remisión escribe `salesorder_id` sin llamar a `ticketConOrdenVenta`
(`apps/desk/server/routes/remision.ts:218-226` — eran `:189-197` antes de que F1B-01 subiera la
guarda del serial). Hay un `it.fails` esperando (`apps/desk/server/ordenVentaUnTicket.test.ts:161`) y
una prueba que fija el daño observable (`:156-158`). La regla completa es de `remisiones`.

(Previously: no nombraba explícitamente el enmarcado «retirar, no añadir» de `remisiones` §5.1 como
el mismo enmarcado adoptado aquí.)

#### Scenario: La cardinalidad OV↔ticket depende de la misma decisión en las dos specs

- GIVEN que `tickets-core` impone la regla en dos puertas (alta y `habilitar_servicio`)
- AND `remisiones` la deja abierta en la tercera (alta de remisión de entrada)
- WHEN Gerencia resuelve el punto abierto nº 52 a favor de las variantes reales
- THEN el arreglo consistente en las dos specs es retirar las dos puertas de `tickets-core`, no
      construir la de `remisiones`
