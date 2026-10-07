# Exploración — `ovi-garantia-por-cargo`

Leído en el worktree `ovi-garantia-por-cargo`, partida `215310d`, el 2026-10-06. Toda línea citada se leyó
en ese árbol. Escalones del orden total (F1B-10): **A** existencia < **B** estado y permiso < **C** contenido
< **D** unicidad.

## 1 · Inventario de guardas por entrada

### 1.1 · Alta — `createManagedTicket` (`apps/desk/server/services/ticketService.ts:21`)

La función NO recibe al usuario: su firma es `(db, body, actorName, actorId)` y la ruta le pasa sólo nombre e
id (`apps/desk/server/routes/tickets.ts:125`). Hoy el alta no tiene ninguna guarda de escalón B.

| # | Línea | HTTP | Mensaje | Escalón |
|---|---|---|---|---|
| 1 | `ticketService.ts:24` | 422 | «Falta el equipo» | A |
| 2 | `ticketService.ts:25` | 422 | los de `exigirEquipoManual` / `exigirEquipoNuevo` (no leídos por dentro: hipótesis que son A, como dice `tickets-core` RQ-TC-05) | A |
| 3 | `ticketService.ts:27` | 422 | «Equipo no registrado» | A |
| 4 | `ticketService.ts:28` | 422 | los de `exigirClienteProvisional` (comentario de la línea: «A») | A |
| 5 | `ticketService.ts:39` | 422 | «Orden de venta no encontrada» | A |
| 6 | `ticketService.ts:65-78` | 422 | «El equipo … es de … y el ticket se está creando para …» | C |
| 7 | `ticketService.ts:88` | 422 | «Faltan campos obligatorios: …» | C |
| 8 | `ticketService.ts:90` | 422 | «Cliente no encontrado» | C |
| 9 | `ticketService.ts:91` | 422 | alta manual, campos de equipo nuevo, modalidad | C |
| 10 | `ticketService.ts:96` | 422 | cuarentena (`motivoCuarentena`) | C |
| 11 | `ticketService.ts:96` | 422 | contrato vencido (`motivoContratoVencido`) | C |
| 12 | `ticketService.ts:96` | 409 | NIT ya en Books (`errorNitEnBooks`) | D |
| 13 | `ticketService.ts:99` | 409 | «La orden de venta … ya está asociada al ticket #…» | D |

Cómo llega la orden: `b.salesOrderId` se resuelve contra Books (`:38`) y da `salesorderId`, número y fecha
(`:40-43`); pero `b.ordenVenta` también se acepta como TEXTO LIBRE (`:30`) y **gana** al número de Books
(`ordenVenta = ordenVenta ?? ov.number`, `:42`). Un cuerpo puede traer número sin id, o un número que no es el
de su id. La guarda nueva tiene que mirar las dos cosas: el número final y el de la orden resuelta.

### 1.2 · Transiciones — `executeTransition` (`apps/desk/server/services/ticketService.ts:114`)

Vale igual para «Habilitar Servicio» (`packages/shared/src/transitions.ts:178`, área Comercial, campo
`cfOrdenVenta('Orden de Venta', …)` obligatorio en `:189`) y para la «OV adicional» de `aprobacion_y_repuestos`
(`:199`) y `aprobacion` (`:203`), campo `cfOvAdicional` (`:375`, destino `ovAdicional`).

| # | Línea | HTTP | Mensaje | Escalón |
|---|---|---|---|---|
| 1 | `ticketService.ts:123` | 400 | «Transición desconocida» | A |
| 2 | `ticketService.ts:125` | 404 | «Ticket no encontrado» | A |
| 3 | `ticketService.ts:125` | 409 | fuera de flujo (`exigirMismoFlujo`) | B |
| 4 | `ticketService.ts:126-128` | 409 | «La transición … no aplica desde el estado …» | B |
| 5 | `ticketService.ts:129-130` | 403 | «Tu rol no tiene permiso para esta transición (área: …)» | B |
| 6 | `ticketService.ts:131` | 403 | «La transición … sólo la ejecuta el cargo …» (`cargoQueFaltaParaTransicion`) | B |
| 7 | `ticketService.ts:131` | 403 | `MENSAJE_PRIORIDAD_BLOQUEADA` | B |
| 8 | `ticketService.ts:131` | 409 | verificación de gas (`exigirVerificacion`, sólo `liberacion`) | B |
| 9 | `ticketService.ts:131` | 422 | alta pendiente de validar (`exigirAltaValidada`, sólo `habilitar_servicio`) | B |
| 10 | `ticketService.ts:131` | 422 | sin remisión de entrada vigente (`exigirRemisionVigente`, sólo `habilitar_servicio`) | B |
| 11 | `ticketService.ts:134` | 422 | agregado `{ errors }`: obligatorios, fechas derivadas, cuarentena, certificado, liberación | C |
| 12 | `ticketService.ts:141` | 422 | «La persona a la que se deriva no existe o está dada de baja» | C |
| 13 | `ticketService.ts:147` | 422 | contrato vencido (`erroresContratoVencido`) | C |
| 14 | `ticketService.ts:151` | 409 | «La orden de venta … ya está asociada al ticket #…» | D |

Cómo llega la orden: sólo el NÚMERO, en `values['Orden de Venta']` (columna promovida `orden_venta`,
`packages/zoho-sync/src/db/rows.ts:99`) o en `values['OV adicional']` (`plan.ovAdicional`,
`apps/desk/server/transitionExec.ts:88`). No hay id ni consulta a Books: el `salesorder_id` de la asociación se
resuelve por número al escribir y puede quedar nulo (`packages/zoho-sync/src/db/ovAsociaciones.ts:164`).
`valoresConFechasDerivadas` (`ticketService.ts:132`) no toca la orden: sólo las tres fechas derivadas
(`apps/desk/server/services/valoresDeTransicion.ts:20-31`).

El cliente REENVÍA el valor que el ticket ya trae: el campo se abre bloqueado con ese valor y se manda igual
(`apps/desk/src/components/TransitionPanel.tsx:76-80`). O sea que «Habilitar Servicio» sobre un ticket que ya
tiene orden llega al servidor con esa misma orden: es una reconfirmación, no una orden nueva.

### 1.3 · Remisión de entrada — `POST /api/remisiones` (`apps/desk/server/routes/remision.ts:120`)

Hoy no tiene ninguna guarda de escalón B (sólo `requireAuth`).

| # | Línea | HTTP | Mensaje | Escalón |
|---|---|---|---|---|
| 1 | `remision.ts:123` | 422 | «Falta el ticket» | A |
| 2 | `remision.ts:125` | 422 | «Ticket no encontrado» | A |
| 3 | `remision.ts:127` | 422 | «Fecha inválida» | C (IV-12, punto 1) |
| 4 | `remision.ts:155` | 422 | «Falta el serial del equipo: …» | A |
| 5 | `remision.ts:158` | 422 | recepción (`resolverRecepcion`) | C (IV-12, punto 3) |
| 6 | `remision.ts:177` | 409 | «Este ticket ya tiene una remisión sin desenlace…» | D |
| 7 | `remision.ts:197` | 422 | «Ítems fuera del checklist: …» | C |
| 8 | `remision.ts:220` | 422 | «Orden de venta no encontrada» | A (IV-12, punto 2) |
| 9 | `remision.ts:220` | 422 | cuarentena, en el MISMO `if` que la 8 | C |
| 10 | `remision.ts:220` | 422 | contrato vencido | C |
| 11 | `remision.ts:232` | 409 | «La orden de venta … ya está asociada al ticket #…» | D |

Cómo llega la orden: sólo `b.salesOrderId` (`:218`), resuelto contra Books (`:219`); el número no se acepta del
navegador. La escritura es condicional: el `UPDATE` sólo casa si el ticket no tiene orden (`:241`), y sólo
entonces se asocia (`:243`).

## 2 · Qué tiene el ticket para decidir «ya la traía»

- Columnas `orden_venta` y `salesorder_id` de `desk.tickets` (las dos las lee `ticketConOrdenVenta`,
  `packages/zoho-sync/src/db/repo.ts:369-370`).
- Asociaciones vigentes en `public.ov_asociaciones` (`liberada_at IS NULL`, `repo.ts:371`); se listan con
  `listarAsociaciones` (`packages/zoho-sync/src/db/ovAsociaciones.ts:81-84`).
- El id: los tickets nacidos en la aplicación llevan `PREFIJO_TICKET_APP`
  (`packages/shared/src/transitions.ts:124`); los de Zoho son numéricos.

## 3 · El cliente (`apps/desk/src`)

- Alta: busca órdenes con `searchSalesOrders(…, true)` (`apps/desk/src/components/CreateTicket.tsx:122`) y manda
  `salesOrderId` (`:227`). No filtra por prefijo.
- Panel de transición: `BuscadorOrdenVenta` para todo campo `ordenVenta` no bloqueado
  (`apps/desk/src/components/TransitionPanel.tsx:236`). No filtra por prefijo.
- Remisión: el mismo buscador, y sólo si el ticket no tiene orden
  (`apps/desk/src/components/CrearRemision.tsx:224-225`); manda `salesOrderId` (`:79`).
- Los tres usan `GET /api/sales-orders` (`apps/desk/server/routes/directory.ts:53`, `:58`), que tampoco
  distingue OVI. En `apps/` y `packages/`, fuera de pruebas, «OVI» sólo aparece en `subOV.ts`, `cargos.ts`,
  `contratos.ts` y un comentario de `mantenimientoNovedades.ts` (barrido con `grep`, 2026-10-06).

El cliente no toma hoy ninguna decisión sobre órdenes OVI: ni bloquea, ni rellena, ni avisa.

## 4 · Lo que hoy afirma lo contrario

- `packages/shared/src/cargos.ts:68-69`: «área Servicio Técnico Y cargo Director Técnico» y el supuesto S-9 de
  F1C-05 («el área del acto es Servicio Técnico»). La implementación, `:71-74`.
- `packages/shared/src/cargos.test.ts:118-123` fija el área (la línea 121 exige `false` para «cargo sin área»);
  `:185` mete la primitiva en el barrido de RQ-PM-21 con área `Servicio Técnico`, y `:205` fija el recuento
  1.870; `:226-229` exige que NO tenga llamador.
- `openspec/specs/permissions/spec.md:450-457` (RQ-PM-20): «sigue sin llamador» y «Este cambio MUST NOT construir
  el acto de la OVI de garantía»; su escenario de `:469` lo repite.
- `openspec/specs/permissions/spec.md:471-474` en `38078cc` (RQ-PM-21): «El cargo MUST NOT conceder lo que el área niega». NO
  queda contradicho —ver §5—, pero su prueba de barrido deja de poder incluir esta primitiva con un área.
- `packages/shared/src/mantenimientoNovedades.ts:10`: un comentario dice que su predicado «tiene la misma forma
  que `puedeCrearOVIGarantia`»; deja de ser cierto.

## 5 · Por qué «basta el cargo» no rompe «el cargo sólo restringe»

El alta y la remisión no tienen hoy guarda de área (§1.1, §1.3): cualquier usuario con sesión pasa. En las
transiciones la guarda de área sigue delante (`ticketService.ts:129-130`). En las cuatro entradas la guarda nueva
AÑADE una condición a algo que hoy se permite; en ninguna concede algo que el área niega. Lo que cambia es la
forma del predicado, que deja de llevar un área dentro. El maestro dice lo mismo
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1937`).

## 6 · Hallazgos laterales (no se corrigen aquí)

- **El número de la orden es texto libre en dos puertas** (alta, `ticketService.ts:30`; transiciones, §1.2) y
  ninguna lo contrasta con Books. Es anterior a este cambio. Consecuencia para la guarda de cargo: tiene que
  reconocer la OVI sobre el texto recibido, y un reconocimiento estricto en mayúsculas se esquiva tecleando
  minúsculas (S-6 de la propuesta).
- **Reconfirmar es el camino normal, no la excepción**: `TransitionPanel.tsx:76-80` reenvía la orden del ticket.
  Si reconfirmar pidiera el cargo en tickets de la aplicación, un ticket de garantía cuya OVI asoció el Director
  Técnico en el alta no podría pasar «Habilitar Servicio», que es de área Comercial (S-3 de la propuesta).
