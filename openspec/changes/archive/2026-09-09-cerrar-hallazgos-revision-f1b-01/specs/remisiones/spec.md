# Delta for remisiones

## MODIFIED Requirements

### Requirement: El serial es obligatorio al crear la remisión

El alta **SHALL** rechazar con `422` toda remisión cuyo serial resuelto esté vacío
(`routes/remision.ts:152-157`). Es la decisión `[DECIDIDO]` de M1.1 (`R08.1.md:1045`) — «El campo
número de serie es obligatorio al crear la remisión» —.

- El serial **SHALL** resolverse con la misma precedencia con la que se guarda: el equipo del catálogo
  manda sobre la copia propia del ticket (`remision.ts:153`). Una guarda sobre `found.row.serial` a
  secas rechazaría tickets que **sí** tienen equipo (probado en `remisiones.test.ts`, «M5 · con equipo
  del catálogo, manda el serial del equipo»).
- La cadena en blanco **SHALL** contar como ausente, igual que en el alta de tickets
  (`ticketService.ts:53-58`): el sync escribe `''` tan fácilmente como `NULL`.
- La guarda **SHALL** evaluarse **antes de cualquier escritura**, y en particular antes del bloque de
  la orden de venta, que hace un `UPDATE tickets` (`remision.ts:214-222`). Fijado por la prueba
  «M5 · con orden de venta y sin serial: 422 y el ticket sigue sin OV».
- La guarda va con los otros `422` y **antes** del `409` de la remisión pendiente, y esa precedencia
  **SHALL** quedar fijada por una prueba que active las dos condiciones a la vez: cuando un ticket
  tiene simultáneamente una remisión `pendiente` vigente y el serial resuelto vacío, la respuesta
  **SHALL** ser `422`, **MUST NOT** ser `409`, y **MUST NOT** crear ninguna remisión nueva. No hereda la
  inversión abierta del **alta de tickets** (`tickets-core` §4.1), que es otra cosa y sigue sin
  corregir.

> **Given** un ticket sincronizado desde Zoho que aún no ha pasado por «Habilitar Servicio», y por
> tanto no tiene serial ni equipo del catálogo
> **When** alguien intenta crear su remisión
> **Then** responde `422` y no se crea ninguna remisión ni se escribe nada en el ticket.

**A quién afecta de verdad.** Un ticket nacido en la app siempre trae serial: el alta exige `equipoId`
del catálogo (`ticketService.ts:22-25`) y el equipo lo lleva. Lo que esto cierra es la otra entrada
—la que M1.3.2 llama la que «nunca se cruza» con aquélla—, donde el ticket llega de Zoho sin serial.

**La columna sigue admitiendo `NULL`, a propósito** (`schema.sql:279`): la decisión dice «obligatorio
**al crear**», y ahí está la guarda; la columna guarda además el histórico importado que esta
aplicación no controla.

(Previously: la precedencia del `422` sobre el `409` estaba declarada sólo en comentario
(`remision.ts:144-147`); ninguna prueba ejercitaba ambas condiciones a la vez —las del `409` siempre
tenían serial y las del `422` nunca tenían remisión previa—.)

#### Scenario: Serial vacío y remisión pendiente a la vez
- GIVEN un ticket con una remisión `pendiente` vigente y sin serial resuelto (ni equipo de catálogo ni
  copia propia)
- WHEN se intenta crear una segunda remisión para ese ticket
- THEN responde `422` por falta de serial, no `409` por remisión pendiente
- AND no se crea ninguna remisión nueva

#### Scenario: Comportamiento sin cambios cuando sólo aplica una guarda
- GIVEN un ticket con serial resuelto y una remisión `pendiente` vigente
- WHEN se intenta crear una segunda remisión
- THEN responde `409` con el `id` de la remisión pendiente, igual que hoy
