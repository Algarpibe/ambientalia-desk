# Delta para `tickets-core`

## ADDED Requirements

### RQ-TC-35 · Marcar un cliente como Top 5, o cambiar su prioridad, propaga esa prioridad a sus tickets abiertos, cada uno con su traza

Gerencia, `decision/cola-del-taller-los-tres-cabos`, punto 3 (`openspec/config.yaml` → `decisiones_de_gerencia`):
«Al marcar un cliente como Top 5, sus tickets abiertos toman la nueva prioridad, cada uno con su traza […]. En
ningún caso se tocan los tickets con un ajuste manual con motivo, que mantienen el suyo.»

Cuando la escritura de `RQ-TC-27` se acepta con `top5` verdadero, el servidor **SHALL**, en la MISMA transacción que
escribe `public.cliente_prioridad`, hacer que cada ticket del cliente (`tickets.client_id`) que sea **abierto** y no
esté **exento** (`RQ-TC-37`) tome la prioridad que resulta de la fórmula del alta (`RQ-TC-24`): la más alta entre
`High` por contrato vigente hoy y la prioridad del Top 5; sin contrato vigente, la del Top 5.

- **Abierto** (supuesto S-3): `status_type <> 'Closed' OR status_type IS NULL` (el predicado de `repo.ts:151`). Los
  tickets en espera cuentan como abiertos. No es la noción de la vista «abiertos» del cliente, que excluye además las
  esperas.
- Por cada ticket cuya prioridad **cambia**, el servidor **SHALL** actualizar `tickets.priority`, poner la marca
  `prioridad_en_app_at` (`zoho-sync` RQ-ZS-01) e insertar UNA fila en `public.prioridad_ajustes` con ticket,
  prioridad anterior (`de`), prioridad nueva (`a`), un motivo de texto fijo generado por el servidor, no vacío
  (supuesto S-11), el autor que marcó, la fecha y el origen de propagación (`RQ-TC-38`).
- Si la prioridad resultante es igual a la actual, el servidor **MUST NOT** escribir el ticket ni dejar traza.
- Si la del Top 5 es más baja que la actual y no hay contrato, el ticket **SHALL** bajar (supuesto S-5; es lo que hace
  el alta). Cambiar la prioridad de un cliente que ya es Top 5 **SHALL** propagar igual (supuesto S-6).
- La propagación **SHALL** incluir los tickets venidos de Zoho. Su `managed_by_app` **MUST NOT** cambiar.
- Las lecturas **SHALL** ser un número fijo de consultas, independiente del número de tickets del cliente.
- Si falla cualquier escritura, **ni** la fila del cliente **ni** ningún ticket ni ninguna traza **SHALL** cambiar.
- **Regla invariable 13.** Qué tickets se tocan, qué prioridad toma cada uno y que el sincronizador no la pise son
  decisiones del servidor; el cliente no envía lista de tickets. La fórmula es la de `packages/shared`
  (`prioridadAlNacer`), que el servidor consume. Lo que el cliente añade (decir cuántos tickets cambiaron) es
  comodidad.

#### Scenario: marcar Top 5 propaga a los abiertos, con una traza por ticket
- GIVEN un cliente con dos tickets abiertos `Low`, sin contrato, y un usuario con permiso
- WHEN marca al cliente como Top 5 con `prioridad: 'High'`
- THEN los dos tickets quedan `High`
- AND `public.prioridad_ajustes` tiene una fila por ticket con `de` `Low`, `a` `High`, motivo no vacío, autor, fecha y origen de propagación

#### Scenario: cambiar la prioridad de un Top 5 propaga la nueva (S-6)
- GIVEN un cliente Top 5 `High` cuyos tickets abiertos ya están `High` por propagación
- WHEN se cambia su prioridad a `Medium`
- THEN los tickets quedan `Medium`, cada uno con una fila nueva de traza `High` → `Medium`

#### Scenario: contrato vigente y Top 5 `Low` dejan el ticket en `High`
- GIVEN un cliente con contrato vigente y un ticket abierto `Medium`
- WHEN se marca al cliente como Top 5 con `prioridad: 'Low'`
- THEN el ticket queda `High`

#### Scenario: sin contrato, un Top 5 más bajo hace bajar al ticket (S-5)
- GIVEN un cliente sin contrato con un ticket abierto `High`
- WHEN se marca como Top 5 con `prioridad: 'Low'`
- THEN el ticket queda `Low`, con su traza

#### Scenario: si la prioridad ya es la resultante, no se escribe ni se traza
- GIVEN un ticket abierto `High` de un cliente que se marca Top 5 `High`
- WHEN se propaga
- THEN el ticket no se escribe y `prioridad_ajustes` no gana ninguna fila por él

#### Scenario: los cerrados no cambian
- GIVEN un cliente con un ticket cerrado `Low` y uno abierto `Low`
- WHEN se marca Top 5 `High`
- THEN el cerrado conserva `Low`, sin traza, y el abierto pasa a `High`

#### Scenario: las esperas y el `status_type` nulo cuentan como abiertos (S-3)
- GIVEN un ticket del cliente en `En Espera de Repuestos` y otro con `status_type` nulo, ambos `Low`
- WHEN se marca Top 5 `High`
- THEN los dos quedan `High`

#### Scenario: otro cliente y un ticket sin cliente no cambian
- GIVEN un ticket de otro cliente y un ticket sin `client_id`, ambos `Low`
- WHEN se marca Top 5 `High` a un cliente distinto
- THEN ninguno cambia ni gana traza

#### Scenario: un ticket de Zoho conserva `managed_by_app = false` al propagarse
- GIVEN un ticket de Zoho con `managed_by_app = false` de un cliente que se marca Top 5
- WHEN se propaga
- THEN su prioridad cambia y `managed_by_app` sigue `false`

#### Scenario: si falla una escritura, no cambia nada
- GIVEN una propagación a dos tickets cuya inserción de traza del segundo falla
- WHEN se ejecuta el `PUT`
- THEN no cambian la fila de `cliente_prioridad`, ni la prioridad de ningún ticket, ni la traza

#### Scenario: sin N+1
- GIVEN un cliente con N tickets abiertos y otro con 2N
- WHEN se marca cada uno como Top 5
- THEN el número de consultas de lectura es el mismo en los dos

### RQ-TC-36 · Desmarcar un cliente devuelve sus tickets abiertos a la prioridad calculada, con traza

Gerencia, punto 3: «al desmarcarlo, vuelven a la prioridad calculada».

Cuando la escritura de `RQ-TC-27` se acepta con `top5` falso, el servidor **SHALL**, en la MISMA transacción, devolver
cada ticket del cliente que sea abierto, no esté exento (`RQ-TC-37`) y **tenga base** a la prioridad calculada:
`prioridadAlNacer(base, contrato vigente hoy, null)`.

- **Base** (supuesto D-2 de la propuesta): la prioridad que el ticket tenía antes de que el Top 5 la tocara, es decir,
  el `de` de su primera fila de origen alta bajo Top 5 o propagación posterior a su última fila de reversión. Con
  varias propagaciones seguidas la base es la de la primera.
- Un ticket **sin base** (sin ninguna fila de esos orígenes) **MUST NOT** tocarse (supuesto S-10: los nacidos bajo
  Top 5 antes de este cambio).
- Cada ticket cuya prioridad cambia **SHALL** quedar con una fila de traza de origen reversión (`de` la actual, `a` la
  calculada, que puede ser vacía si la base lo era), `tickets.priority` actualizada y la marca `prioridad_en_app_at`
  **conservada** (supuesto S-2).
- Si la calculada es igual a la actual, ni escritura ni traza.
- Una prioridad que una transición haya escrito después de la propagación (`repo.ts:300`) **no** es ajuste manual
  (supuesto S-4): no exime, y la reversión la sustituye por la calculada.
- Desmarcar a un cliente que nunca fue Top 5 **SHALL** responder `200` sin cambiar ningún ticket.
- Un cliente que se vuelve a marcar tras desmarcarlo **SHALL** tomar como base la prioridad que tenían sus tickets
  tras la reversión.
- **Regla invariable 13.** Todo lo anterior lo decide y lo impone el servidor con la fórmula de `shared`; el cliente
  no calcula ni la base ni la prioridad calculada.

#### Scenario: desmarcar devuelve a la prioridad anterior, con traza
- GIVEN un cliente sin contrato con dos tickets abiertos `Low` propagados a `High`
- WHEN se desmarca
- THEN los dos vuelven a `Low`, cada uno con una fila de traza `High` → `Low` de origen reversión

#### Scenario: con contrato vigente, la calculada es `High`
- GIVEN un cliente con contrato vigente, un ticket `Low` propagado por un Top 5 `Medium`, ahora `High`
- WHEN se desmarca
- THEN el ticket queda `High`, sin escritura ni traza si ya lo estaba

#### Scenario: un ticket nacido bajo Top 5 vuelve a su calculada
- GIVEN un ticket nacido `High` por el Top 5 de su cliente con cuerpo `Low`, con su traza de alta (`RQ-TC-38`)
- WHEN se desmarca al cliente
- THEN el ticket vuelve a `Low`, con traza

#### Scenario: un ticket que no tenía prioridad vuelve a no tenerla
- GIVEN un ticket abierto sin prioridad al que el Top 5 asignó `High`
- WHEN se desmarca
- THEN su prioridad queda vacía y la fila de traza tiene `a` vacío

#### Scenario: varias propagaciones, una sola reversión
- GIVEN un ticket `Low` propagado a `High` y luego a `Medium`
- WHEN se desmarca
- THEN vuelve a `Low`, la base de la primera propagación

#### Scenario: ciclo marcar, desmarcar, marcar
- GIVEN un ticket `Low` marcado `High`, desmarcado y marcado de nuevo `Medium`
- WHEN se desmarca por segunda vez
- THEN la base es `Low` (el `de` de la primera fila posterior a la reversión)

#### Scenario: un ticket sin base no se toca (S-10)
- GIVEN un ticket abierto `High` sin ninguna fila de traza del Top 5
- WHEN se desmarca al cliente
- THEN conserva `High`, sin escritura ni traza

#### Scenario: una prioridad escrita por una transición no exime (S-4)
- GIVEN un ticket propagado a `High` al que una transición cambió luego la prioridad a `Medium`, sin fila manual
- WHEN se desmarca
- THEN el ticket vuelve a la calculada de su base

#### Scenario: tras revertir se conserva la marca (S-2)
- GIVEN un ticket revertido
- WHEN se consulta `prioridad_en_app_at`
- THEN sigue puesta

#### Scenario: desmarcar a quien nunca fue Top 5
- GIVEN un cliente sin fila en `cliente_prioridad` y un ticket abierto
- WHEN un usuario con permiso envía `top5: false`
- THEN responde `200` y el ticket no cambia

### RQ-TC-37 · Un ajuste manual con motivo exime al ticket de la propagación y de la reversión

Gerencia, punto 3: «En ningún caso se tocan los tickets con un ajuste manual con motivo, que mantienen el suyo.»

Un ticket está **exento** cuando tiene **al menos una fila manual** en `public.prioridad_ajustes`, es decir, de origen
vacío (`RQ-TC-38`), **antes o después** de cualquier propagación. Un ticket exento **MUST NOT** cambiar de prioridad,
ganar traza ni recibir la marca `prioridad_en_app_at` al marcar al cliente, al cambiar su prioridad ni al
desmarcarlo. Las filas que existen hoy son todas manuales y **SHALL** contar. La exención **SHALL** evaluarse dentro
de la transacción de la propagación.

- **Regla invariable 13.** La exención la impone el servidor; el cliente no la conoce ni la espeja.

#### Scenario: ajuste manual antes de marcar
- GIVEN un ticket `Medium` ajustado a mano a `Low` con motivo, y otro ticket `Medium` del mismo cliente sin ajuste
- WHEN se marca Top 5 `High`
- THEN el ajustado conserva `Low`, sin traza nueva; el otro pasa a `High`

#### Scenario: ajuste manual después de propagar
- GIVEN un ticket propagado a `High` y luego ajustado a mano a `Medium` con motivo
- WHEN se desmarca al cliente
- THEN conserva `Medium`

#### Scenario: cambiar la prioridad del Top 5 tampoco toca al exento
- GIVEN un ticket con ajuste manual y un cliente Top 5 `High`
- WHEN se cambia su prioridad a `Low`
- THEN el ticket conserva su prioridad

#### Scenario: las filas anteriores al despliegue cuentan como manuales
- GIVEN una fila de `prioridad_ajustes` creada antes de añadir la columna de origen, que quedó con origen vacío
- WHEN se marca al cliente
- THEN su ticket queda exento

#### Scenario: posición de la exención frente al filtro de abiertos
- GIVEN tres tickets del cliente: uno cerrado con ajuste manual, uno abierto con ajuste manual y uno abierto sin ajuste
- WHEN se marca Top 5 `High`
- THEN sólo el abierto sin ajuste cambia

#### Scenario: un ticket con trazas del Top 5 y sin ajuste manual no está exento
- GIVEN un ticket con sólo filas de origen propagación
- WHEN se cambia la prioridad del cliente
- THEN el ticket cambia

#### Scenario: el exento no recibe la marca
- GIVEN un ticket de Zoho exento
- WHEN se propaga o revierte
- THEN su `prioridad_en_app_at` sigue vacía

### RQ-TC-38 · La traza gana origen; un ticket nacido bajo Top 5 deja traza; el esquema

`public.prioridad_ajustes` **SHALL** ganar la columna `origen` (texto, admite NULL; NULL significa **manual**, que es
lo que son todas las filas de hoy) y su columna `a` **SHALL** admitir NULL, para poder revertir a «sin prioridad». La
lista de orígenes **SHALL** vivir en `packages/shared` y **SHALL** distinguir tres valores distintos de NULL:
propagación, reversión y alta bajo Top 5. Un `origen` fuera de la lista **SHALL** tratarse como manual, esto es,
protegiendo al ticket (supuesto SP-4 de la especificación, reversible).

- **Alta bajo Top 5.** Cuando un ticket nace con un cliente Top 5 y el Top 5 cambia su resultado respecto al que
  tendría sin él, el alta **SHALL** dejar, en la misma transacción que el ticket, una fila de origen alta con `de` =
  la prioridad sin Top 5 (`prioridadAlNacer(pedida, contrato, null)`), `a` = la que nació, y el autor del alta
  (supuesto SP-2: si no cambia el resultado, no hay fila). Un fallo posterior del alta **MUST NOT** dejar la fila.
- La lectura de la traza de un ticket (`GET /api/tickets/:id/prioridad`) **SHALL** devolver todas sus filas con su
  `origen` (supuesto SP-1 de la especificación).
- Esquema: `ALTER TABLE public.prioridad_ajustes ADD COLUMN IF NOT EXISTS origen text;` y
  `ALTER TABLE public.prioridad_ajustes ALTER COLUMN a DROP NOT NULL;`, **calificadas**, al **final** de
  `packages/zoho-sync/src/db/schema.sql`, sin relleno y sin mover ninguna línea anterior. Hipótesis: `pg-mem` admite
  `DROP NOT NULL`; la comprueba el diseño.
- **Regla invariable 13.** El origen y la traza los escribe el servidor.

#### Scenario: la columna nueva y las filas anteriores
- GIVEN `schema.sql` aplicado sobre una base con filas previas en `prioridad_ajustes`
- WHEN se leen
- THEN las anteriores tienen origen vacío y se puede insertar una fila con `a` vacío

#### Scenario: las sentencias están calificadas y al final
- GIVEN `schema.sql`
- WHEN se recorren sus sentencias `ALTER TABLE`
- THEN las dos de `prioridad_ajustes` van calificadas con `public.`, detrás de todas las anteriores

#### Scenario: una sentencia sin calificar se rechaza (regla de mutación 2)
- GIVEN `schema.sql` ensuciado con `ALTER TABLE prioridad_ajustes ADD COLUMN origen text` sin esquema
- WHEN corre el guardián de `migrate.test.ts`
- THEN se pone rojo

#### Scenario: un ticket que nace bajo Top 5 deja traza
- GIVEN un cliente Top 5 `High` sin contrato y un alta con cuerpo `Low`
- WHEN se crea el ticket
- THEN nace `High` y hay una fila de origen alta con `de` `Low` y `a` `High`

#### Scenario: si el Top 5 no cambia el resultado, no hay fila
- GIVEN un cliente con contrato vigente y Top 5 `Low`
- WHEN se crea un ticket con cuerpo `High`
- THEN nace `High` y no se inserta ninguna fila

#### Scenario: sin Top 5, el alta no deja traza
- GIVEN un cliente que no es Top 5
- WHEN se crea un ticket
- THEN `prioridad_ajustes` no gana ninguna fila

#### Scenario: un fallo posterior no deja la fila de alta
- GIVEN un alta bajo Top 5 cuya guarda posterior falla
- WHEN se ejecuta
- THEN no queda ticket ni traza

#### Scenario: la lectura muestra el origen
- GIVEN un ticket con una fila manual y una de propagación
- WHEN se consulta su prioridad
- THEN ve ambas con su origen

#### Scenario: un origen desconocido protege al ticket
- GIVEN una fila con un origen que no está en la lista
- WHEN se marca al cliente
- THEN el ticket queda exento

### RQ-TC-39 · Lo que la propagación y la reversión NO hacen

La propagación y la reversión **MUST NOT**: cambiar el estado ni escribir en `ticket_transitions` ni reiniciar el
reloj de SLA; cambiar `managed_by_app`; tocar tickets cerrados, de otros clientes o sin `client_id`; escribir hacia
Zoho; avisar de discrepancias de prioridad con Zoho; propagar solas los Top 5 marcados antes del despliegue (se
propaga al volver a guardarlos); calificar a clientes sin contrato ni Top 5 ni cambiar quién ajusta a mano fuera de
los Top 5 (pregunta 3.b de Gerencia, abierta, que mantiene `cierra: no`); ni migrar `ajustarPrioridad` a la marca
nueva.

#### Scenario: no tocan estado, transiciones ni reloj
- GIVEN un ticket abierto con una entrada al estado actual
- WHEN se propaga y se revierte
- THEN su estado, `ticket_transitions` y el instante que lee el SLA no cambian, pero su prioridad sí

#### Scenario: `managed_by_app` no cambia
- GIVEN un ticket con `managed_by_app = false`
- WHEN se propaga
- THEN sigue `false`

#### Scenario: un Top 5 marcado antes del despliegue no propaga solo
- GIVEN un cliente Top 5 con tickets `Low` y ningún `PUT` posterior
- WHEN corre la aplicación
- THEN los tickets siguen `Low`
- AND al volver a guardar el Top 5 se propaga

## MODIFIED Requirements

### RQ-TC-24 · Prioridad `High` al nacer, por el contrato del cliente, impuesta por el servidor

Cuando el **cliente del ticket** —ya resuelto en el alta (`ticketService.ts:89`)— tenga un contrato
**vigente** hoy (`RQ-TC-22`) **o** sea **Top 5** (`RQ-TC-26`), `createManagedTicket` **SHALL** crear el ticket con
**la más alta** de las prioridades que apliquen, con el orden `Urgent > High > Medium > Low`: `High` por el contrato
(supuesto S-4: «Alta» del maestro ≡ el literal `High` de `packages/shared/src/transitions.ts:84`) y la `prioridad` de
`public.cliente_prioridad` por el Top 5. La prioridad del cuerpo **MUST NOT** intervenir cuando aplica al menos una de
las dos, y también para correctivos cotizados aparte (`decision/anexo-53-contratos`, regla `:2456`: «manda la
prioridad más alta de las dos»). Si el cliente no tiene contrato vigente ni es Top 5, la prioridad **SHALL** ser la
que hoy resulte del cuerpo, o ninguna (`ticketService.ts:106` en `9288779`). La imposición **SHALL** ser del servidor
(regla invariable 13): que el formulario la muestre o no es comodidad.
(Previously: sólo combinaba el contrato; «manda la más alta de las dos» con Top 5 quedaba fuera, para F1B-07.)

La prioridad se toma del cliente del **ticket**, no de la subOV ni del cliente del contrato ni del de la OV (supuesto
S-9 de F1B-06). Este requisito gobierna el **nacimiento**; lo que ocurre con los tickets **ya existentes** cuando
cambia el Top 5 del cliente lo fijan `RQ-TC-35` (marcar o cambiar), `RQ-TC-36` (desmarcar) y `RQ-TC-37` (los
exentos), con la misma fórmula, y un ticket que nace bajo Top 5 deja la traza de `RQ-TC-38` para poder volver a su
calculada. Lo que una transición escriba después en `priority` no lo reevalúa este requisito (supuesto S-1 de F1B-07)
ni lo trata la propagación como ajuste manual (supuesto S-4 de `propagar-top5-lista-remision-creada`). Un valor
desconocido en el cuerpo **MUST** perder siempre frente al contrato y al Top 5 (supuesto S-3). Un ticket sin
`client_id` no hereda de ningún cliente.

#### Scenario: Cliente con contrato vigente → el ticket nace `High` aunque el cuerpo traiga `Low`

- GIVEN un cliente con un contrato vigente, no Top 5, y un alta cuyo cuerpo trae `prioridad: 'Low'`
- WHEN se crea el ticket
- THEN el ticket queda con prioridad `High`

#### Scenario: Cliente con contrato vigente y cuerpo sin prioridad → `High`

- GIVEN un cliente con contrato vigente, no Top 5, y un alta sin prioridad
- WHEN se crea el ticket
- THEN el ticket queda con prioridad `High`

#### Scenario: Combinación 1 · sin contrato y sin Top 5, todo queda como hoy

- GIVEN un cliente sin contrato vigente y no Top 5, y dos altas: una con `prioridad: 'Low'` y otra sin prioridad
- WHEN se crean los tickets
- THEN el primero queda `Low` y el segundo sin prioridad, igual que antes de este cambio

#### Scenario: Combinación 2 · contrato vigente y sin Top 5 → `High`

- GIVEN un cliente con contrato vigente y sin fila Top 5, y un alta con `prioridad: 'Medium'`
- WHEN se crea el ticket
- THEN el ticket queda `High`

#### Scenario: Combinación 3 · Top 5 sin contrato → la del Top 5

- GIVEN un cliente Top 5 con `prioridad: 'Medium'`, sin contrato vigente, y un alta con `prioridad: 'Low'`
- WHEN se crea el ticket
- THEN el ticket queda `Medium`

#### Scenario: Combinación 4 · contrato y Top 5 a la vez → manda la más alta

- GIVEN un cliente con contrato vigente y Top 5 con `prioridad: 'Low'`
- WHEN se crea el ticket
- THEN el ticket queda `High`
- AND con `prioridad: 'High'` en el Top 5 también queda `High`

#### Scenario: Top 5 más alta que el contrato no existe en la lista blanca, pero el orden se respeta

- GIVEN la función pura que combina las prioridades y las entradas `High` (contrato) y `Medium` (Top 5)
- WHEN se evalúa, y luego con las entradas intercambiadas
- THEN el resultado es `High` en ambos órdenes

#### Scenario: `Urgent` del cuerpo pierde frente al contrato y al Top 5 (S-3)

- GIVEN un alta con `prioridad: 'Urgent'` para un cliente Top 5 con `prioridad: 'Medium'` sin contrato, y otra para un cliente con contrato vigente
- WHEN se crean los tickets
- THEN el primero queda `Medium` y el segundo `High`

#### Scenario: `Urgent` del cuerpo sin contrato ni Top 5 se conserva como hoy

- GIVEN un cliente sin contrato vigente ni Top 5 y un alta con `prioridad: 'Urgent'`
- WHEN se crea el ticket
- THEN el ticket queda `Urgent`, como antes de este cambio

#### Scenario: Un contrato vencido o aún no iniciado no da prioridad

- GIVEN un cliente cuyo único contrato tiene fin anterior a hoy, y otro cuyo único contrato empieza mañana, ninguno Top 5
- WHEN se crea un ticket con `prioridad: 'Low'` para cada uno
- THEN ambos quedan `Low`

#### Scenario: El día del fin todavía cuenta

- GIVEN un contrato con fin igual a hoy
- WHEN el cliente crea un ticket sin prioridad
- THEN el ticket nace `High`

#### Scenario: Manda el cliente del ticket, no el del contrato

- GIVEN un contrato vigente del cliente A y un alta para el cliente B, que no tiene contrato ni es Top 5, con una subOV del lote de A
- WHEN se crea el ticket
- THEN la prioridad no se fuerza a `High` por el contrato de A

#### Scenario: El Top 5 se toma del cliente del ticket, no del de la OV

- GIVEN un cliente A Top 5 y un alta para el cliente B, no Top 5, con una orden de venta de A
- WHEN se crea el ticket
- THEN la prioridad no hereda el Top 5 de A

#### Scenario: S-1 (invertido) · marcar Top 5 cambia los tickets abiertos existentes

- GIVEN un cliente con dos tickets abiertos de prioridad `Low` y un usuario con permiso
- WHEN marca al cliente como Top 5 con `prioridad: 'High'`
- THEN los dos tickets abiertos quedan `High`, cada uno con su traza (`RQ-TC-35`)
- AND un ticket creado después nace `High`

#### Scenario: S-9 (invertido) · desmarcar el Top 5 devuelve los tickets a su prioridad calculada

- GIVEN un ticket nacido `High` por el Top 5 de su cliente, con cuerpo `Low` y sin contrato
- WHEN se quita el Top 5 del cliente
- THEN el ticket vuelve a `Low`, con su traza (`RQ-TC-36`)
- AND un ticket nuevo de ese cliente, sin contrato, toma la prioridad del cuerpo

#### Scenario: ticket sin `client_id` no hereda

- GIVEN un ticket de Zoho sin `client_id`
- WHEN se evalúa su prioridad
- THEN ningún Top 5 ni contrato se le aplica

### RQ-TC-27 · Fijar o quitar el Top 5 y su prioridad sólo con `puedeFijarPrioridadTop5`

El servidor SHALL exponer la lectura y la escritura de `top5` y `prioridad` de un cliente. La escritura SHALL exigir
`puedeFijarPrioridadTop5` (`packages/shared/src/cargos.ts:80-83`), que se CONSUME y MUST NOT reescribirse en el cliente
ni en el servidor (regla invariable 13). Sin el permiso, el servidor SHALL responder `403` y no escribir nada. Un único
predicado SHALL cubrir fijar la prioridad y mantener la lista (supuesto S-5). `prioridad` SHALL pertenecer a la lista
blanca `High | Medium | Low`; cualquier otro valor, incluido `Urgent`, SHALL responder `422` (supuesto S-3). Cuando
`top5` sea verdadero, `prioridad` SHALL ser obligatoria (hipótesis de esta especificación, ver riesgos). `top5` MUST
ser booleano; otro tipo SHALL responder `422`. Cada escritura SHALL registrar `actualizado_por` y `actualizado_at`. La
lectura SHALL estar disponible para cualquier usuario autenticado.

La escritura SHALL respetar el orden de precedencia: `403` (B) antes de todo `422` (C).

Una escritura aceptada SHALL escribir la fila del cliente y propagar o revertir (`RQ-TC-35`, `RQ-TC-36`) en la MISMA
transacción: o se escribe todo o nada. Un `404`, un `403` o un `422` MUST NOT propagar ni revertir nada. La
respuesta SHALL incluir, además de la fila, cuántos tickets cambiaron de prioridad. El cuerpo MUST NOT poder dirigir la
propagación: el cliente no envía lista de tickets ni prioridades por ticket, y lo que envíe de más se ignora (regla
invariable 13: qué tickets se tocan lo decide el servidor; el recuento que la pantalla muestra es comodidad).

#### Scenario: Director Comercial fija un Top 5
- GIVEN un usuario del área `Comercial` con cargo `Director Comercial` y un cliente sin fila
- WHEN marca `top5: true` con `prioridad: 'Medium'`
- THEN responde `200` y `public.cliente_prioridad` guarda la fila con `actualizado_por` y `actualizado_at`

#### Scenario: administrador fija un Top 5
- GIVEN un administrador sin `cargo_permiso`
- WHEN marca `top5: true` con `prioridad: 'High'` sobre un cliente
- THEN responde `200` y la fila queda escrita

#### Scenario: sin permiso, 403 y sin escritura
- GIVEN un usuario de `Comercial` con cargo `Coordinador Comercial`
- WHEN intenta marcar un cliente como Top 5
- THEN responde `403` y no existe fila nueva ni cambiada

#### Scenario: técnico sin permiso
- GIVEN un usuario del área `Servicio Técnico` con cargo `Director Técnico`
- WHEN intenta fijar la prioridad de un cliente
- THEN responde `403`

#### Scenario: valor fuera de la lista blanca
- GIVEN un usuario con permiso
- WHEN envía `prioridad: 'Urgent'` o `prioridad: 'Alta'` para un Top 5
- THEN responde `422` y no se escribe la fila

#### Scenario: Top 5 sin prioridad
- GIVEN un usuario con permiso
- WHEN envía `top5: true` sin `prioridad`
- THEN responde `422`

#### Scenario: 403 antes que 422
- GIVEN un usuario sin permiso y un cuerpo con `prioridad` inválida
- WHEN envía la escritura
- THEN responde `403`, no `422`

#### Scenario: quitar el Top 5
- GIVEN un cliente Top 5 y un usuario con permiso
- WHEN envía `top5: false`
- THEN responde `200` y el cliente deja de ser Top 5

#### Scenario: lectura abierta al autenticado
- GIVEN un usuario autenticado sin cargo de permiso y un cliente Top 5
- WHEN consulta la prioridad del cliente
- THEN ve `top5` y `prioridad`

#### Scenario: el 403 y el 422 no propagan nada
- GIVEN un cliente con tickets abiertos `Low`, un usuario sin permiso y otro con permiso que envía un cuerpo inválido
- WHEN cada uno intenta marcar al cliente
- THEN responden `403` y `422` y ningún ticket cambia ni gana traza

#### Scenario: la respuesta dice cuántos tickets cambiaron
- GIVEN un cliente con dos tickets abiertos `Low` y uno ya `High`
- WHEN se marca Top 5 `High`
- THEN responde `200` con la fila y el recuento 2

#### Scenario: el cuerpo no dirige la propagación
- GIVEN un cuerpo válido con campos de más, como una lista de tickets o una prioridad por ticket
- WHEN se envía la escritura
- THEN los tickets tocados son los del cliente que corresponde, con la prioridad que calcula el servidor

#### Scenario: la fila y los tickets se escriben juntos
- GIVEN una escritura aceptada cuya propagación falla
- WHEN se ejecuta
- THEN la fila de `cliente_prioridad` conserva su valor anterior

### RQ-TC-29 · Ajuste de la prioridad de un ticket de un cliente Top 5, con motivo y traza

Un usuario con `puedeFijarPrioridadTop5` SHALL poder cambiar la prioridad de un ticket concreto cuyo cliente sea Top 5,
aportando un **motivo escrito obligatorio**. Las respuestas SHALL seguir el orden de precedencia, sin solape de
códigos: `404` si el ticket no existe (A); `409` si el cliente del ticket no es Top 5, incluido el ticket sin
`client_id` (B, supuesto S-8: estado del sujeto, que precede al permiso como en `ticketService.ts:126-130`); `403` si
el usuario no cumple el predicado (B); `422` si falta el motivo, si es sólo
espacios o si la prioridad no está en `High | Medium | Low` (C). Cuando el ajuste se aplique, el servidor SHALL, en una
**misma transacción**: actualizar `tickets.priority`, insertar una fila en `public.prioridad_ajustes` (ticket,
prioridad anterior, prioridad nueva, motivo, autor, fecha) y fijar `managed_by_app = true` (supuesto S-6). El ajuste
MUST NOT escribir en `ticket_transitions`, ni cambiar el estado, ni reiniciar el reloj de SLA. La sentencia
`CREATE TABLE` de `public.prioridad_ajustes` SHALL llevar el esquema calificado y SHALL ir al final de `schema.sql`,
después de la de `cliente_prioridad`. Sólo la prioridad de ese ticket cambia; los demás tickets del cliente no.

La fila de traza de un ajuste manual SHALL llevar el origen vacío, que es lo que significa «manual» (`RQ-TC-38`), y
desde ese momento el ticket queda **exento** de la propagación y de la reversión del Top 5 (`RQ-TC-37`): conserva el
valor que se le ajustó.

#### Scenario: ajuste con motivo
- GIVEN un ticket de un cliente Top 5 con prioridad `Medium` y un Director Comercial
- WHEN ajusta a `High` con motivo «Parada de planta»
- THEN responde `200`, el ticket queda `High` y `public.prioridad_ajustes` tiene una fila con anterior `Medium`, nueva `High`, el motivo, el autor y la fecha

#### Scenario: sin motivo, 422
- GIVEN un ticket de un cliente Top 5 y un usuario con permiso
- WHEN envía el ajuste sin motivo, o con motivo de sólo espacios
- THEN responde `422`, la prioridad no cambia y no se inserta traza

#### Scenario: valor fuera de la lista blanca
- GIVEN un ticket de un cliente Top 5 y un usuario con permiso
- WHEN envía `prioridad: 'Urgent'` con motivo
- THEN responde `422`

#### Scenario: cliente que no es Top 5, 409
- GIVEN un ticket de un cliente sin fila Top 5 (o con `top5: false`) y un usuario con permiso
- WHEN envía el ajuste con motivo
- THEN responde `409` y no cambia nada

#### Scenario: ticket sin `client_id`, 409
- GIVEN un ticket sin `client_id` y un usuario con permiso
- WHEN envía el ajuste con motivo
- THEN responde `409`

#### Scenario: sin el predicado, 403
- GIVEN un ticket de un cliente Top 5 y un usuario de `Comercial` con cargo `Coordinador Comercial`
- WHEN envía el ajuste con motivo
- THEN responde `403` y no cambia nada

#### Scenario: 409 antes que 403 y que 422 (C-3)
- GIVEN un usuario sin permiso, un ticket de un cliente que no es Top 5 y un cuerpo sin motivo
- WHEN envía el ajuste
- THEN responde `409`, no `403` ni `422`

#### Scenario: 409 antes que 422
- GIVEN un usuario con permiso, un ticket de un cliente que no es Top 5 y un cuerpo sin motivo
- WHEN envía el ajuste
- THEN responde `409`, no `422`

#### Scenario: ticket inexistente
- GIVEN un identificador de ticket que no existe
- WHEN un usuario con permiso envía el ajuste
- THEN responde `404`

#### Scenario: el ajuste no toca `ticket_transitions` ni el SLA
- GIVEN un ticket de un cliente Top 5 con una última transición de entrada al estado actual
- WHEN se ajusta su prioridad
- THEN `ticket_transitions` no gana ninguna fila
- AND el instante de entrada al estado que lee el SLA es el mismo de antes

#### Scenario: S-6 · el ajuste congela la fila frente al sincronizador
- GIVEN un ticket de Zoho con `managed_by_app = false` de un cliente Top 5
- WHEN se ajusta su prioridad
- THEN `managed_by_app` pasa a `true` en la misma transacción
- AND una pasada posterior de `upsertTicket` no sobrescribe `priority`

#### Scenario: atomicidad
- GIVEN un ajuste cuya inserción en `prioridad_ajustes` falla
- WHEN se ejecuta
- THEN `tickets.priority` y `managed_by_app` conservan su valor anterior

#### Scenario: sólo ese ticket cambia
- GIVEN un cliente Top 5 con dos tickets abiertos
- WHEN se ajusta uno
- THEN el otro conserva su prioridad

#### Scenario: la tabla de trazas está calificada y al final
- GIVEN `schema.sql`
- WHEN se recorren sus sentencias `CREATE TABLE`
- THEN `public.prioridad_ajustes` es la última y está calificada

#### Scenario: la fila del ajuste manual lleva origen vacío
- GIVEN un ticket de un cliente Top 5 y un Director Comercial
- WHEN ajusta la prioridad con motivo
- THEN la fila de `prioridad_ajustes` tiene el origen vacío

#### Scenario: tras el ajuste manual, el ticket queda exento del Top 5
- GIVEN un ticket ajustado a mano de un cliente Top 5
- WHEN se cambia la prioridad del cliente o se le quita el Top 5
- THEN el ticket conserva la prioridad que se le ajustó
