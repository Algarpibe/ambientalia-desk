# Delta para derivacion-avisos — aviso de reasignación a la persona de destino (F1B-05, `cierra: si`)

Numeración comprobada contra `openspec/specs/derivacion-avisos/spec.md`: el último requisito vivo es RQ-AV-19; el nuevo es
RQ-AV-20. El delta **no modifica** ningún requisito vivo: RQ-AV-06, RQ-AV-08 y RQ-AV-09 describen el aviso de **derivación**
de una transición y siguen siendo ciertos; el aviso de reasignación reutiliza su patrón sin cambiarlos. Supuestos S-5 y
S-7 de `proposal.md`, reversibles. Marcas: **ROJO** nace rojo; **CARACTERIZACIÓN** nace verde.

## ADDED Requirements

### RQ-AV-20 · Reasignar avisa a la persona de destino, en la aplicación y por correo, fuera de la transacción

Cuando se reasigna la persona a cargo (`tickets-core` RQ-TC-50), el sistema **SHALL** avisar a la **persona de destino**
con un aviso en la aplicación (tabla `avisos`, fuente de verdad, RQ-AV-09) y por correo encima. El texto es **propio** de la
reasignación y **SHALL** incluir el **motivo** y el **nombre de quien reasigna**. La decisión de a quién avisar y con qué
texto **SHALL** ser una **función pura**, separada de la escritura, como `avisoDerivacion` (RQ-AV-06).

- **Supresión «a uno mismo»** (SUPUESTO S-5, reversible): si la persona de destino es la que reasigna, **MUST NOT** crearse
  aviso: «ya lo sabe, acaba de hacerlo», el mismo criterio de RQ-AV-06 y RQ-AV-07. No hay otra supresión: reasignar a una
  persona distinta del actor siempre avisa.
- **Copia al administrador** (SUPUESTO S-7, reversible): los administradores activos reciben copia del aviso, como en el
  aviso de derivación (RQ-AV-07, segundo grupo); sin duplicados, y nadie recibe dos veces el mismo aviso. **No** se avisa a
  la persona de origen.
- **Fuera de la transacción.** Los avisos **SHALL** escribirse **después** de la transacción de la reasignación y **fuera**
  de ella, con el mismo motivo y la misma contrapartida aceptada de RQ-AV-08: lo que importa —la reasignación y su traza—
  queda escrito, y una caída entre las dos escrituras pierde el aviso, no la reasignación.
- **El correo no tumba la acción.** Se **SHALL** esperar su resultado, acotado en el tiempo como en RQ-AV-09, y **MUST NOT**
  poder revertir ni fallar una reasignación ya escrita: con el canal de correo caído o sin configurar, la respuesta de la
  ruta es `200`, la reasignación y su traza quedan escritas y el aviso en la aplicación existe con `enviado_at` en `NULL`
  (la cola de reintento de RQ-AV-09).
- **Texto.** Asunto y enlace se arman en el servidor (RQ-AV-10), con el ticket de origen en el `ticket_id` del aviso.

#### Scenario: el destino recibe el aviso con el motivo y el nombre de quien reasigna — ROJO
- GIVEN «Carla» reasigna un ticket a «Beto» con motivo «Ana sale de vacaciones»
- WHEN la ruta responde
- THEN hay un aviso en la aplicación para «Beto» cuyo texto contiene el motivo y el nombre «Carla», con el `ticket_id` del ticket

#### Scenario: reasignarse a uno mismo no crea aviso — ROJO
- GIVEN «Carla» se reasigna el ticket a sí misma
- WHEN la ruta responde
- THEN la respuesta es `200`, la reasignación y su traza existen y no se crea ningún aviso para «Carla»

#### Scenario: no se avisa a la persona de origen — ROJO
- GIVEN un ticket a cargo de «Ana» que «Carla» reasigna a «Beto»
- WHEN la ruta responde
- THEN «Ana» no recibe ningún aviso por esta reasignación

#### Scenario: los administradores reciben copia sin duplicados — ROJO
- GIVEN un administrador activo que además es la persona de destino
- WHEN se reasigna el ticket a esa persona
- THEN recibe un solo aviso, no dos

#### Scenario: el correo fallando no tumba la reasignación — ROJO
- GIVEN un canal de correo que falla, o que no está configurado
- WHEN se reasigna un ticket
- THEN la respuesta es `200`, `derivado_a` cambió, la traza existe, el aviso en la aplicación existe y `enviado_at` queda `NULL`

#### Scenario: el aviso se escribe fuera de la transacción — ROJO
- GIVEN un fallo al escribir el aviso, después de que la transacción de la reasignación se confirmó
- WHEN se reasigna
- THEN `derivado_a` y la traza permanecen cambiados y el fallo del aviso no revierte nada

#### Scenario: la decisión del aviso es una función pura — CARACTERIZACIÓN
- GIVEN actor, persona de destino y motivo
- WHEN se evalúa la función del aviso sin base de datos
- THEN devuelve el aviso o «nada» (destino igual al actor) sin escribir, y se prueba sin red ni base
