# Delta para `remisiones`

Retrofit: la reasignación ya está commiteada (`56ff441`, base `607e26a`, rama `main`). Este delta
formaliza en SDD lo que ese commit ya escribió en `openspec/config.yaml` y en
`openspec/specs/tickets-core/spec.md` §4.2, y corrige las citas de código que quedaron caducas tras el
corrimiento de 29 líneas de F1B-01.

**Saneado el 2026-09-10, y la lección está en cómo se encontró.** Este delta seguía citando la segunda
puerta de «una OV, un ticket» en `ticketService.ts:100` —hoy una línea en blanco— cuando vive en
`:128-129`. Es **la misma cita, del mismo código**, que se había corregido esa mañana en el delta
hermano de `tickets-core` §4.2: el saneamiento se hizo fichero a fichero en vez de por cita, y la
hermana se quedó fuera. Lo cazó `sdd-verify`, no el saneamiento. Corregidas las dos apariciones
(`:20` y `:30`), y de paso `:45` → `:45-48`, que es el bloque completo de la primera puerta.

## MODIFIED Requirements

### Requirement: 5.1 · La tercera puerta de la orden de venta sigue abierta

> **⚠️ REASIGNADO EL 2026-09-09, y no a otra tanda.** Decía «destino F1A» y F1A cerró sin tocarlo.
> **Destino nuevo: PUNTO ABIERTO Nº 52 DEL MAESTRO.** Al buscarle sitio apareció algo mayor que la
> orfandad: la regla que esta puerta impondría está en duda en el propio maestro.
> `R08.1.md:2071-2079` lista tres variantes reales y habituales —OV separadas por mano de obra y
> repuestos · OV global por varios equipos · varias OV sobre un mismo ticket— y concluye: «Ninguna de
> las tres encaja en un modelo de "una OV, un ticket", y las tres son habituales. Punto abierto nº 52.»
>
> **El enmarcado se invierte respecto de las tandas anteriores: el arreglo puede ser RETIRAR las dos
> puertas que ya existen (`ticketService.ts:45-48` y `:128-129`), no añadir la tercera.** Construirla antes
> de decidir cuesta el doble. Y nº 52 **no está** en la tabla de decisiones del plan
> (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:348-359`), así que ni llega a la agenda
> del viernes.

`POST /api/remisiones` **escribe** `orden_venta`, `fecha_orden_venta` y `salesorder_id` en el ticket
con un `UPDATE` condicional, **sin llamar a `ticketConOrdenVenta`**
(`apps/desk/server/routes/remision.ts:218-226` — eran `:189-197` antes de que F1B-01 bajara 29 líneas
la guarda del serial; el `UPDATE`, en `:221-225`). Las otras dos puertas sí la llaman: el alta
(`services/ticketService.ts:43-49`, RQ-TC-08) y `habilitar_servicio`
(`services/ticketService.ts:128-129`, RQ-TS-14).

**Lo que la condición sí impide y lo que no.** El `WHERE ... COALESCE(orden_venta,'') = ''`
(`remision.ts:223`) impide pisar la OV que el propio ticket ya tenga —por eso el formulario la enseña
en gris (`:214-216`, la frase en `:215`)— y **no** impide que **dos tickets distintos** acaben con la
misma orden.

El daño observable está fijado en positivo, no como conjetura:
`apps/desk/server/ordenVentaUnTicket.test.ts:141-159` toma una OV ya asociada al ticket 7001 y la
manda a un ticket nuevo; la prueba **exige `201`, sin error de ningún tipo** (`:153-154`), y comprueba
que la orden queda en los dos tickets por sus dos vías (`:158`). Al lado, el `it.fails` (`:161-176`)
deja escrito el modo de fallo que corregir esta puerta pondría en verde, **sea cual sea la dirección
de la decisión de nº 52**: `409`, mensaje que nombre el ticket 7001, y la columna **sin escribir**
(`:174`).

(Previously: destino «F1A»; enmarcado único como «añadir la tercera puerta»; citas de `remision.ts`
sin actualizar tras el corrimiento de F1B-01.)

#### Scenario: Hoy, sin la tercera puerta, una OV puede duplicarse

- GIVEN una orden de venta ya asociada al ticket 7001
- WHEN se crea una remisión de entrada sobre otro ticket con esa misma orden de venta
- THEN el alta responde `201` sin ningún error
- AND la orden queda asociada a los dos tickets, por sus dos vías (`ordenVentaUnTicket.test.ts:158`)

#### Scenario: El arreglo depende de una decisión de Gerencia, no de esta spec

- GIVEN que el punto abierto nº 52 del maestro sigue sin resolver
- WHEN Gerencia decide a favor de las tres variantes reales (`R08.1.md:2071-2079`)
- THEN el arreglo correcto es retirar las dos puertas existentes, no completar la tercera
- AND si decide en contra, el arreglo es el `409` que el `it.fails` ya deja esperando

## Notas de citas caducas (fuera del alcance de este delta)

`openspec/specs/transitions-st/spec.md:484` cita la misma tercera puerta con el rango viejo
(`remision.ts:189-197`); no se corrige en este cambio porque `transitions-st` no es una capacidad
modificada de esta propuesta — queda para la próxima tanda que toque esa spec.
`openspec/changes/F0-01/proposal.md:120` y `openspec/changes/F0-04/proposal.md:194` citan el mismo
rango viejo y **no se tocan**: son proposals archivados, registro histórico de lo que era cierto en
su commit, igual que `estado_al_baseline`.
