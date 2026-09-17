# Delta for tickets-core

Contexto: `openspec/specs/tickets-core/spec.md`. Corrige únicamente la narrativa de `§4.2`
(`:410-415`), que hoy **afirma** que el alta de remisión escribe `salesorder_id` sin llamar a
`ticketConOrdenVenta` y que el `it.fails` de `ordenVentaUnTicket.test.ts:161` sigue esperando: las dos
dejan de ser ciertas con `remisiones` `RQ-RE-16` (delta hermano de este mismo cambio). No es una cita
`ruta:línea` desfasada — es prosa que ningún detector caza, y por eso se corrige aquí y no se deja para
"trabajo de cierre".

Del recuadro de la decisión (`:398-408`) cambia **una sola línea**, y la cambia este mismo cambio:
`:405` decía «La regla completa vive en `remisiones` §5.1» y el delta hermano **retira** esa §5.1, así
que al fusionar habría quedado apuntando a una sección que este cambio acaba de borrar. Pasa a apuntar
a `RQ-RE-16`, que es donde la regla vive ahora. No es una cita heredada: es una que rompíamos nosotros,
y por eso se repara en la misma tanda que la rompe.

El resto del bloque **no cambia de texto**: ni el encabezado, ni las otras diez líneas del recuadro,
ni el `#### Scenario: La cardinalidad OV↔ticket...` (`:424-433`). Ese escenario ya
describe la decisión en abstracto —«la tercera, la de `remisiones`, SE CONSTRUYE»— y sigue siendo
cierto tal cual está: mi requisito lo ejercita sin modificarlo, mismo patrón que `citas-verificables`
con `RQ-CV-03`. Se copia el bloque completo porque la regla de MODIFIED exige copiar todo el requisito
y editar sólo lo que cambia; la línea `:415` («La regla completa es de `remisiones`») se conserva
porque sigue siendo cierta, con un puntero añadido a `RQ-RE-16`.

## MODIFIED Requirements

### Requirement: 4.2 · La tercera puerta de la orden de venta: DECIDIDA, y se construye

> **✅ RESUELTO EL 2026-09-10 · `decision/n52-cardinalidad-ov`.** El punto abierto nº 52 está cerrado:
> **`1 ticket : N OV`, sin tabla puente**, y está en la tabla de decisiones del plan (`plan:350`).
>
> **Se CONSTRUYE la tercera puerta; las dos que ya existen SE QUEDAN** — `ticketService.ts:45-48` en el
> alta (RQ-TC-08) y `:134-135` en `habilitar_servicio` (RQ-TS-14). Una OV pertenece como mucho a un
> ticket, que es justo lo que comprueban. La variante que ponía la regla en duda, la OV global por
> lote, **desaparece por proceso**: se sustituye por subórdenes `OV-AAAA-NNN-SS`, una por ticket
> (`decision/subov-lote-convencion`). La regla completa vive en `remisiones` `RQ-RE-16`.
>
> *Lo medido no se pierde, y ya está cerrado:* `ordenVentaUnTicket.test.ts:141-159` en `b99d47a` fijó el
> modo de fallo exacto y el `it.fails` de `:161` en `b99d47a` dejaba esperando — cerrado por
> `tercera-puerta-orden-venta` (`79cf09b`): hoy verde con un `409`.

**Comportamiento actual. IV-4 CERRADO.** El alta de remisión ya llama a `ticketConOrdenVenta` por las
**dos vías** —`salesorder_id` y número—, excluyendo el propio ticket, dentro del bloque de la orden de
venta (`apps/desk/server/routes/remision.ts:218-240`), antes del `UPDATE` (`:235-239`). El `it.fails`
de `apps/desk/server/ordenVentaUnTicket.test.ts:161` deja de existir como tal: la prueba pasa a
afirmar el `409` en positivo. **La regla completa es de `remisiones`** (hoy `RQ-RE-16`).

(Previously: no nombraba explícitamente el enmarcado «retirar, no añadir» de `remisiones` §5.1 como
el mismo enmarcado adoptado aquí. Y encabezaba con «a corregir en F1A», épica cerrada, con la segunda
puerta citada en `:100` cuando vivía en `:128-129`. **Y sostuvo ese enmarcado en presente —«RETIRAR
las dos puertas», «nº 52 no está en la tabla de decisiones»— hasta que se barrió, el 2026-09-10, el
mismo día en que `decision/n52-cardinalidad-ov` lo invirtió.** La segunda puerta vive hoy en
`:134-135`.)

(Previously, tras `tercera-puerta-orden-venta`: decía «IV-4 pasa de bloqueado a CONSTRUIBLE», que el
alta de remisión escribía `salesorder_id` **sin** llamar a `ticketConOrdenVenta`, y que el `it.fails`
de `ordenVentaUnTicket.test.ts:161` seguía esperando.)

#### Scenario: La cardinalidad OV↔ticket, resuelta en la misma dirección en las dos specs

- GIVEN que `tickets-core` impone la regla en dos puertas (alta y `habilitar_servicio`)
- AND `remisiones` la deja abierta en la tercera (alta de remisión de entrada)
- WHEN Gerencia resuelve el punto abierto nº 52 como `1 ticket : N OV` (10/09,
      `decision/n52-cardinalidad-ov`)
- THEN las dos puertas de `tickets-core` **se quedan** —una OV pertenece como mucho a un ticket— y la
      tercera, la de `remisiones`, **se construye**
- AND la variante que ponía la regla en duda, la OV global por lote, deja de existir: se sustituye por
      subórdenes `OV-AAAA-NNN-SS`, una por ticket
