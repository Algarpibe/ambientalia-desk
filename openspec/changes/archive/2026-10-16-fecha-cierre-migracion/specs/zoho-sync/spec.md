# Delta: zoho-sync — el ejecutor escribe el cierre de «Entregado» con su marca y la reversión lo restaura (`fecha-cierre-migracion`)

Delta sobre `openspec/specs/zoho-sync/spec.md`. Tanda F1F-01 (`cierra: no`). Propuesta:
`openspec/changes/fecha-cierre-migracion/proposal.md`. Decisión que construye: `decision/migracion-e207-e212`
(Gerencia; `openspec/config.yaml:4737-4770`, consecuencia (1) en `:4747-4751`). La regla de qué fecha se escribe es
`tickets-core` RQ-TC-64 (`cierreDeMigracion`); aquí se exige lo que hacen con ella el ejecutor, el informe y la
reversión. Las líneas citadas de la spec viva son las del worktree en `main`.

**Nota de fusión.** Los dos bloques de `## MODIFIED Requirements` (RQ-ZS-17 y RQ-ZS-18) sustituyen **entero** el
bloque vivo con la misma cabecera: son completos, con todos sus escenarios existentes (RQ-ZS-17: 24 en
`spec.md:895-1021`; RQ-ZS-18: 7 en `spec.md:1049-1084`). No hay `## ADDED` en esta capacidad. Qué cambia en
RQ-ZS-17: el marcador (`"values"` gana `cierre_origen` y `closed_time_previo`), el `UPDATE` (escribe `closed_time`
sólo si la regla cierra), el informe (recuento de cierres por origen) y dos escenarios (`:912-915`, `:932-937`), más
cinco escenarios al final (los 24 existentes se conservan; tres con texto ajustado: `:912-915`, `:932-937` y
`:939-942`; el informe igual `:998-1001` gana el recuento de cierres; 29 en total). Qué cambia en RQ-ZS-18: la restauración
(también `closed_time`, sólo en la regla `entregado-a-finalizado`), el párrafo de `:1040`, los escenarios de
`:1049-1053` y `:1055-1059`, y el de `:1081-1084` («La reversión no toca `closed_time`»), que **se sustituye** por
cuatro nuevos al final (siete menos uno más cuatro: diez en total).

**Aviso para el diseño y el archivo: el título de RQ-ZS-18.** El título vivo («… restaurando los tres valores
previos», `spec.md:1023`) deja de ser exacto: con este cambio la reversión restaura hasta cuatro valores. La
cabecera se **conserva idéntica** en este delta porque es la clave de la fusión; renombrarla a «… restaurando los
valores previos» es una edición de título que decide el archivo (o una sección `RENAMED`). Por el mismo motivo se
conservan los títulos de escenario «El marcador guarda los tres valores previos» (`spec.md:939`), que describe el
caso de `Pendiente`, y todo texto fuera de lo que este cambio modifica.

## MODIFIED Requirements

### Requirement: RQ-ZS-17 · Ejecutor de la migración de tickets abiertos: seco por defecto, negativa total, marcador antes del `UPDATE`, idempotente

Un ejecutor (fichero nuevo bajo `apps/desk/server/db/`) **SHALL** aplicar el plan de `tickets-core` RQ-TC-41 sobre
`desk.tickets` y `desk.ticket_transitions`. Se expone por un endpoint de superadministrador **añadido al final** de
`apps/desk/server/routes/admin.ts`, sin mover ninguna línea existente. Recibe la fecha de corte y el parámetro
`aplicar`.

**Seco por defecto.** El ejecutor **MUST** escribir sólo con `aplicar=true` explícito (el literal `'true'` en la
petición, como los demás interruptores del proyecto). `aplicar` ausente o `false` **SHALL** ejecutar la pasada en
seco: calcula el plan e informa, no abre transacción (D-2) y **MUST NOT** escribir ninguna fila; **cualquier otro valor
(`1`, `TRUE`…) es `400`** (D-12), también en seco y sin leer nada. Esto **invierte** el convenio de los endpoints
actuales, donde lo opcional es `?dryRun=true` (`apps/desk/server/routes/admin.ts:83-84`).

**Fecha de corte obligatoria.** El `corte` es un instante ISO **con desfase** (`2026-12-01T00:00:00-05:00`); una fecha
pelada es `400` (D-11). Una petición sin `corte` o con un `corte` inválido **SHALL** rechazarse con `400` antes de
leer o escribir nada, también en seco.

**Sólo superadministrador.** El endpoint **SHALL** ir tras `requireAuth` y `requireSuperAdmin`, igual que sus
vecinos (`apps/desk/server/routes/admin.ts:17`, `apps/desk/server/routes/admin.ts:83`; `requireSuperAdmin` es el
alias local de `requireAdmin`). Un usuario autenticado que no lo sea **SHALL** recibir `403` y **MUST NOT** provocar
lectura del plan ni escritura; sin sesión, `401`. Lo impone el servidor: el cliente no participa.

**Negativa total.** Con `aplicar=true`, si el plan está bloqueado (algún ticket abierto, que se cambiaría, tiene un
estado sin equivalencia, `tickets-core` RQ-TC-40), el ejecutor **SHALL** no escribir **nada** —ni un marcador ni un
`UPDATE`—, y responder `409` con el informe completo, cuyo campo `negativa` es
`{ motivo: 'estados-sin-equivalencia', estados }` (D-13). En seco, los mismos estados salen con `200` y `negativa`
rellena. La comprobación **MUST** ir antes de cualquier escritura.

**Marcador antes del `UPDATE`, en una transacción.** Por cada ticket del plan, en la misma transacción, el ejecutor
**SHALL**:

1. insertar una fila en `ticket_transitions` (`packages/zoho-sync/src/db/schema.sql:57-61`) con
   `transition_id = 'migracion_f1f01_abiertos'`, `from_status` el estado previo, `area = 'Servicio Técnico'`,
   `performed_by` el actor de la migración, `transition_name` y `to_status` según la regla (D-6): **`NULL` en las
   reglas de identidad**, con el destino en `"values"`, y el destino en las dos reglas que cambian el estado.
   `"values"` lleva `estado_previo`, `estado_destino`, `status_type_previo`, `managed_by_app_previo`, `regla`,
   `corte` y `ejecutado_por`; y, **sólo cuando la regla cierra** (`entregado-a-finalizado`, `tickets-core`
   RQ-TC-64), además `cierre_origen` (`'zoho'` o `'migracion'`) y `closed_time_previo` (el `closed_time` que el
   ticket tenía antes, que puede ser **nulo**: la clave **MUST** estar presente con valor nulo, no omitida, para que
   la reversión distinga «era nulo» de «no hay dato»); y **después**
2. hacer el `UPDATE` de `desk.tickets … WHERE id = $1 AND managed_by_app = false RETURNING id`: `status` al destino,
   `status_type` sólo cuando D-10 lo cambia, `managed_by_app = true` y `updated_at = now()`. Sólo cuando la regla
   cierra, el `UPDATE` **SHALL** además escribir `closed_time` con el valor que da `tickets-core` RQ-TC-64 (la fecha
   de Zoho conservada o el instante de la migración); en las demás reglas **MUST NOT** tocarlo. **No** toca
   `modified_time` (D-5) ni `source` (D-4). Si el `UPDATE` no devuelve fila, se lanza error y se
   deshace todo (D-3).

El **instante de la migración** (S-1 de `fecha-cierre-migracion`) es el de la ejecución con `aplicar=true`: **uno solo
por ejecución**, igual para todos los tickets de ese plan, tomado fuera de la regla pura (que no lee el reloj). El
`closed_time` que se pasa a la regla es el que la lectura del plan trae del propio ticket; sin columna nueva, sin
`ALTER` y sin variable de entorno.

En seco no se abre transacción (D-2); al aplicar, la lectura del plan va **dentro** de la transacción, por el mismo
cliente (D-1). El orden marcador → `UPDATE` es deliberado, como en el molde de
`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:45-53`, y **SHALL** quedar fijado por una prueba que ponga
roja su inversión (regla de mutación 1). Si cualquier escritura falla, la transacción entera **SHALL** deshacerse:
no puede quedar un ticket marcado sin cambiar, ni cambiado sin marcador. El ejecutor **MUST NOT** usar
`applyTransition` (`packages/zoho-sync/src/db/repo.ts:322`): no es una transición del blueprint y no debe pasar por
sus guardas. Las sentencias **SHALL** ir con el esquema calificado donde corran fuera de la conexión de la aplicación
(en el procedimiento de RQ-ZS-18); en el ejecutor rige el `search_path` de la aplicación.

**Idempotencia.** Una segunda pasada con los mismos datos **SHALL** no cambiar nada: ningún `UPDATE` y ningún marcador
nuevo. Lo garantiza la frontera: tras la primera pasada los tickets tienen `managed_by_app = true` y el plan los
lista como ya gobernados (RQ-TC-41). En particular, una segunda pasada **MUST NOT** reescribir `closed_time` ni
`cierre_origen` de un «Entregado» ya migrado.

**Frontera ante el sincronizador.** Un ticket migrado queda con `managed_by_app = true`, así que `upsertTicket` sale
antes de escribir (`packages/zoho-sync/src/db/repo.ts:71`) y no sobrescribe ni el estado, ni el `status_type`, ni
ninguna otra columna (tampoco `closed_time`). Supuesto S-1: la sincronización sigue corriendo y no hay interruptor para pararla; el
ejecutor **MUST NOT** añadir ninguno, ni tabla, ni columna, ni flag.

**El informe** es el mismo en seco y al aplicar, y **SHALL** contener:

- `corte`, `aplicar` y `aplicado` (no un «modo seco/aplicado»), y `negativa` (nula si no la hay);
- `abiertos` y `migrables`;
- `porEstado`: por pareja (estado de origen, estado de destino), con la regla, `cambiaEstado` y el recuento;
- `sinEquivalencia`, agrupado por estado, con recuento y números;
- `yaGobernados`, dos recuentos: `nacidosEnLaApp` y `deZoho`;
- `trasElCorte`, con número, estado y `created_time`;
- `sinRemisionVigente`: los que migran a `OV asignada` o `Ticket creado` sin remisión de entrada vigente, con número;
- `pendientes`, por ticket: número, clasificación y destino;
- `cierres`: el recuento de los tickets que la migración cierra, **por origen** —cuántos llevan la fecha de cierre de
  Zoho (`zoho`) y cuántos la de la migración (`migracion`)—, calculado con `tickets-core` RQ-TC-64 y no con una
  segunda implementación de la regla; sólo cuenta los tickets que el plan cierra, de modo que sin «Entregado» ambos
  recuentos son cero. El nombre exacto del campo lo fija el diseño; la pasada en seco **MUST** dar los dos números
  para que Gerencia los vea antes de aplicar;
- `numeracion`: `masAltoAMarcar` (número más alto que se marcaría), `base` (`APP_TICKET_NUMBER_BASE`) y `arrastra`
  (`masAltoAMarcar` ≥ `base`; se informa y no bloquea, D-7);
- `avisos`, con el recordatorio de que la sincronización completa y reciente antes de marcar es requisito de persona
  (S-7). La línea «en `avisos`» de D-7 se lee como este campo del informe, no como la tabla `avisos`
  (**hipótesis**; no hay tabla nueva).

El informe **SHALL** ir además al log, porque quien lo dispara desde una consola no siempre conserva el cuerpo
(como `apps/desk/server/routes/admin.ts:88-92`).

**Alcance.** El ejecutor **MUST NOT** crear remisiones, ni tocar tickets cerrados, ni tickets nacidos tras el corte, ni
tickets de la aplicación con prefijo `app-` que ya estén gobernados. **Ningún código ejecuta esta herramienta contra
producción**: lo hace una persona.

#### Scenario: Sin `aplicar` no se escribe nada
- GIVEN una base con tickets abiertos que tienen equivalencia y la petición no trae `aplicar`
- WHEN corre el endpoint
- THEN responde el informe con `aplicar` y `aplicado` en `false`
- AND no se emite `BEGIN` y `desk.tickets` y `desk.ticket_transitions` quedan idénticas a como estaban

#### Scenario: `aplicar=false` es seco y cualquier otro valor es `400`
- GIVEN la misma base y `aplicar=false`, y por otro lado `aplicar=1` o `aplicar=TRUE`
- WHEN corre el endpoint
- THEN `aplicar=false` no escribe nada y responde en seco
- AND `aplicar=1` y `aplicar=TRUE` responden `400`, también en seco y sin leer nada

#### Scenario: Un `corte` sin desfase es `400`
- GIVEN un `corte` `2026-12-01`, o `2026-12-01T00:00:00` sin desfase
- WHEN corre el endpoint
- THEN responde `400` y no se lee ni se escribe nada

#### Scenario: `modified_time` y `source` intactos
- GIVEN un ticket que se migra con `aplicar=true`
- WHEN se compara la fila antes y después
- THEN `modified_time` y `source` son los mismos y `updated_at` cambia
- AND `closed_time` sólo cambia si la regla del ticket cierra (escenarios «`Entregado` sin fecha de Zoho…» y «`Pendiente` y la identidad no tocan `closed_time`»)

#### Scenario: El marcador de identidad no mueve `entradasActuales`
- GIVEN un ticket migrado por una regla de identidad, con `to_status` nulo en su marcador y el destino en `"values"`
- WHEN se calcula `entradasActuales` (`apps/desk/server/db/sla.ts:88-95`)
- THEN el marcador no cuenta como entrada al estado actual

#### Scenario: `numeracion.arrastra` a un lado y otro de 10000
- GIVEN tickets a marcar cuyo número más alto es 9999, y otra base donde es 10000
- WHEN corre el endpoint en seco
- THEN `numeracion.arrastra` es `false` en la primera y `true` en la segunda, y ninguna bloquea

#### Scenario: Un `UPDATE` sin fila deshace todo
- GIVEN un ticket que pasó a `managed_by_app = true` entre la lectura y la escritura
- WHEN se aplica la migración
- THEN el `UPDATE … RETURNING id` no devuelve fila, se lanza error y la transacción entera se deshace

#### Scenario: Con `aplicar=true` se marca y se cambia
- GIVEN un ticket `Entregado` con `status_type` distinto de `Closed` y `managed_by_app = false`, y un `Pendiente` de servicio
- WHEN corre el endpoint con `aplicar=true` y una fecha de corte
- THEN el primero queda `Finalizado` con `status_type = 'Closed'`, `managed_by_app = true` y `closed_time` escrito según `tickets-core` RQ-TC-64
- AND el segundo queda `En Proceso` con `managed_by_app = true` y su `closed_time` intacto
- AND cada uno tiene exactamente una fila marcador en `ticket_transitions`

#### Scenario: El marcador guarda los tres valores previos
- GIVEN un ticket `Pendiente` con `status_type = 'On Hold'` y `managed_by_app = false`
- WHEN se aplica la migración
- THEN su marcador lleva `from_status = 'Pendiente'`, `to_status = 'En Proceso'` y en `"values"` `estado_previo`, `status_type_previo` y `managed_by_app_previo`, además de `estado_destino`, `regla`, `corte` y `ejecutado_por`
- AND su marcador no lleva `cierre_origen` ni `closed_time_previo`, porque esa regla no cierra

#### Scenario: Un solo estado sin equivalencia detiene todo
- GIVEN diez tickets con equivalencia y uno abierto con estado «En revisión externa»
- WHEN corre el endpoint con `aplicar=true`
- THEN responde `409` con el informe completo, cuya `negativa` nombra ese estado y `sinEquivalencia` ese ticket
- AND no se inserta ningún marcador y no se hace ningún `UPDATE`, ni siquiera sobre los diez que sí tenían equivalencia

#### Scenario: La negativa va antes de cualquier escritura
- GIVEN un plan bloqueado donde el ticket sin equivalencia es el último de la lista
- WHEN corre `aplicar=true` y se inspecta la base tras el error
- THEN ninguna fila cambió, de modo que mover la comprobación después del primer ticket pone roja la prueba

#### Scenario: El marcador va antes del `UPDATE`
- GIVEN un conector de pruebas que registra el orden de las sentencias
- WHEN se aplica la migración a un ticket
- THEN el `INSERT` en `ticket_transitions` precede al `UPDATE` de `desk.tickets` y ambos van dentro de la misma transacción
- AND invertir el orden pone roja una prueba

#### Scenario: Un fallo en mitad deshace todo
- GIVEN un fallo forzado en el `UPDATE` del segundo ticket
- WHEN se aplica la migración
- THEN el primer ticket no queda marcado ni cambiado, y no hay marcadores huérfanos

#### Scenario: Una segunda pasada no cambia nada
- GIVEN una base ya migrada con `aplicar=true`
- WHEN corre otra vez el endpoint con `aplicar=true` y los mismos datos
- THEN no se inserta ningún marcador y no cambia ninguna fila
- AND los tickets aparecen en la lista de ya gobernados

#### Scenario: Un ticket migrado no lo pisa el sincronizador
- GIVEN un ticket migrado, con `managed_by_app = true`, y un payload de Zoho con otro estado, otro `status_type` y otro asunto
- WHEN corre `upsertTicket`
- THEN no se escribe ninguna columna de `desk.tickets`

#### Scenario: Un ticket sin migrar sí lo pisa el sincronizador
- GIVEN un ticket con `managed_by_app = false` que el plan no cambió (p. ej. nacido tras el corte) y un payload de Zoho con otro estado
- WHEN corre `upsertTicket`
- THEN el estado se sobrescribe con el de Zoho, igual que hoy

#### Scenario: Cerrados, nacidos tras el corte y gobernados no se tocan
- GIVEN un ticket `Closed`, un abierto nacido tras el corte y un abierto con `managed_by_app = true`
- WHEN se aplica la migración
- THEN los tres quedan idénticos y sin marcador

#### Scenario: Sin fecha de corte, `400`, también en seco
- GIVEN una petición sin fecha de corte, y otra con fecha inválida
- WHEN corren el endpoint
- THEN las dos responden `400` y no se lee ni se escribe ninguna fila

#### Scenario: Quien no es superadministrador se rechaza
- GIVEN un usuario autenticado sin rol de administrador, y una petición sin sesión
- WHEN llaman al endpoint con `aplicar=true`
- THEN el primero recibe `403` y la segunda `401`
- AND no se escribe nada y no se calcula el plan

#### Scenario: El informe es igual en seco y al aplicar
- GIVEN la misma base
- WHEN corre el endpoint en seco y luego se prepara una copia idéntica y se aplica
- THEN los totales por pareja, los sin equivalencia, los ya gobernados, los nacidos tras el corte, los sin remisión vigente, el número más alto a marcar y el recuento de cierres por origen son los mismos en las dos respuestas

#### Scenario: El informe da el número más alto que se marcaría
- GIVEN tickets a marcar con números 4100 y 4300 y un ticket nacido tras el corte con 9500
- WHEN corre el endpoint en seco
- THEN el informe dice 4300

#### Scenario: El informe lista los abiertos sin remisión de entrada vigente y no crea ninguna
- GIVEN un ticket abierto en `OV asignada` sin remisión de entrada vigente
- WHEN se aplica la migración
- THEN el informe lo lista, sigue migrándose y no se inserta ninguna fila en las tablas de remisiones

#### Scenario: El endpoint se añade al final de `admin.ts`
- GIVEN `apps/desk/server/routes/admin.ts` antes y después del cambio
- WHEN se compara
- THEN las líneas existentes conservan su número y la ruta nueva va detrás de todas las anteriores

#### Scenario: No hay esquema nuevo ni flag nuevo
- GIVEN `packages/zoho-sync/src/db/schema.sql`, `.env.example` y `DEPLOY.md` tras el cambio
- WHEN se comparan con los de antes
- THEN no hay tabla, columna ni variable de entorno añadidas por este cambio

#### Scenario: `Entregado` con fecha de cierre de Zoho la conserva y la marca `zoho`
- GIVEN un ticket `Entregado` abierto, con `managed_by_app = false` y `closed_time` de Zoho `2026-08-14T15:30:00Z`
- WHEN corre el endpoint con `aplicar=true`
- THEN queda `Finalizado` con `status_type = 'Closed'` y `closed_time = 2026-08-14T15:30:00Z`
- AND su marcador lleva en `"values"` `cierre_origen = 'zoho'` y `closed_time_previo = 2026-08-14T15:30:00Z`

#### Scenario: `Entregado` sin fecha de Zoho cierra con el instante de la migración, marcado
- GIVEN un ticket `Entregado` abierto, con `managed_by_app = false` y `closed_time` nulo
- WHEN corre el endpoint con `aplicar=true`
- THEN queda `Finalizado` con `status_type = 'Closed'` y `closed_time` igual al instante de la ejecución
- AND su marcador lleva `cierre_origen = 'migracion'` y la clave `closed_time_previo` presente con valor nulo

#### Scenario: Todos los cierres de una ejecución comparten el mismo instante de migración
- GIVEN dos tickets `Entregado` sin fecha de Zoho en la misma ejecución con `aplicar=true`
- WHEN se comparan sus `closed_time`
- THEN son iguales (S-1)

#### Scenario: `Pendiente` y la identidad no tocan `closed_time`
- GIVEN un ticket `Pendiente` de servicio, uno `Pendiente` de soporte remoto y uno en un estado de identidad, cada uno con `closed_time` nulo o fijado
- WHEN corre el endpoint con `aplicar=true`
- THEN el `closed_time` de los tres es el mismo que antes
- AND sus marcadores no llevan `cierre_origen` ni `closed_time_previo`

#### Scenario: La pasada en seco cuenta las dos ramas y no escribe
- GIVEN dos tickets `Entregado` con fecha de Zoho, tres sin ella y un `Pendiente` de servicio
- WHEN corre el endpoint sin `aplicar`
- THEN el informe da el recuento de cierres por origen: 2 de Zoho y 3 de la migración
- AND `aplicado` es `false`, no se emite `BEGIN` y ningún `closed_time` ni ninguna otra fila cambia

### Requirement: RQ-ZS-18 · Reversión por marcador: sólo donde el marcador sigue siendo la última transición, restaurando los tres valores previos

El cambio **SHALL** entregar el procedimiento `docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql` con la reversión de
RQ-ZS-17 prefijada `-- REV ` (D-14): una sentencia por cada regla que cambia el estado **más una para las filas de
identidad**, que restaura sólo `managed_by_app`; el filtro es por la clave `"values"->>'regla'` del marcador y `status_type_previo` se RESTAURA. El diseño §8 sólo
nombra las reglas que cambian el estado: la de identidad es un **hueco del diseño** que se cierra aquí, porque sin
ella los marcadores de identidad no se borrarían. Las sentencias van **calificadas por esquema** (`desk.tickets`, `desk.ticket_transitions`), porque en `psql` el `search_path`
no es el de la aplicación, como en `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:57-65`. La reversión
**SHALL**, en una sola transacción:

1. restaurar, en cada ticket cuyo marcador `migracion_f1f01_abiertos` sea su **última** transición (el `id` máximo de
   `ticket_transitions` para ese ticket), los tres valores guardados en el marcador: `status`, `status_type` y
   `managed_by_app`;
2. restaurar además `closed_time` desde la clave `closed_time_previo` del marcador, **sólo** en los tickets de la regla
   `entregado-a-finalizado` (la única que cierra, `tickets-core` RQ-TC-64): si el valor previo era nulo, `closed_time`
   **SHALL** volver a ser **nulo**, no quedarse con la fecha de la migración;
3. borrar únicamente los marcadores de los tickets restaurados.

Un ticket que tenga transiciones **posteriores** al marcador (alguien lo movió desde la aplicación) **MUST NOT**
revertirse ni perder su marcador, y el procedimiento **SHALL** listarlo para decisión de una persona. La reversión
**MUST NOT** tocar `closed_time` en las reglas que no cierran (identidad y las dos de `Pendiente`: la migración tampoco
se lo tocó); ni en un ticket no revertido (transiciones posteriores al marcador). El comentario del procedimiento que
hoy dice «No toca closed_time» **SHALL** corregirse para reflejar esto.

La copia previa de la base y la sincronización completa son requisitos de persona y quedan escritos en el
procedimiento. Tras revertir, `managed_by_app` vuelve a `false` en los tickets que lo tenían así, de modo que el
sincronizador vuelve a sobrescribirlos; el procedimiento **SHALL** decirlo. La reversión está **probada sobre pg-mem**
con una prueba que ejecuta el texto del procedimiento, y esa prueba **MUST** ponerse roja si se quita del `.sql` la
restauración de `closed_time` (regla de mutación 2: se muta el fichero vigilado). **Hipótesis:** pg-mem puede no soportar toda sintaxis de
extracción de `jsonb` que use la reversión; si no, la forma de restaurar se decide en el diseño sin cambiar lo que
exige este requisito, y la primera lectura real es la pasada en seco de la persona.

#### Scenario: La reversión devuelve las filas a como estaban
- GIVEN una base migrada con `aplicar=true`, con tickets `Entregado` y `Pendiente` de servicio
- WHEN se ejecuta la reversión del procedimiento
- THEN cada ticket recupera su `status`, `status_type` y `managed_by_app` previos, iguales a los de antes de migrar
- AND cada `Entregado` recupera además su `closed_time` previo
- AND los marcadores de esos tickets desaparecen

#### Scenario: Un ticket movido después del marcador no se revierte
- GIVEN un ticket migrado al que luego se le añadió otra fila en `ticket_transitions`
- WHEN se ejecuta la reversión
- THEN su `status`, `managed_by_app`, `closed_time` y su marcador quedan como estaban
- AND el procedimiento lo lista para decisión de una persona

#### Scenario: La reversión sólo borra marcadores de lo restaurado
- GIVEN dos tickets migrados, uno movido después y otro no
- WHEN se ejecuta la reversión
- THEN queda el marcador del primero y no el del segundo

#### Scenario: La reversión es una sola transacción
- GIVEN el texto del procedimiento
- WHEN se inspecta
- THEN el `UPDATE` y el `DELETE` van entre un único `BEGIN` y un único `COMMIT`

#### Scenario: Las sentencias van calificadas
- GIVEN el texto del procedimiento
- WHEN se recorre
- THEN toda sentencia nombra `desk.tickets` o `desk.ticket_transitions`, ninguna sin esquema

#### Scenario: Una reversión repetida no cambia nada
- GIVEN una base ya revertida
- WHEN se ejecuta otra vez la reversión
- THEN no cambia ninguna fila, porque ya no hay marcadores

#### Scenario: La reversión restaura el `closed_time` previo de un `Entregado` con fecha de Zoho
- GIVEN un ticket `Entregado` con `closed_time` de Zoho `2026-08-14T15:30:00Z`, migrado (cierre con origen `zoho`) y luego revertido
- WHEN se compara `closed_time` antes de migrar y después de revertir
- THEN es el mismo valor, `2026-08-14T15:30:00Z`

#### Scenario: La reversión devuelve `closed_time` a nulo cuando era nulo
- GIVEN un ticket `Entregado` con `closed_time` nulo, migrado (cierre con origen `migracion`, `closed_time` igual al instante de la migración) y luego revertido
- WHEN se compara `closed_time` tras revertir
- THEN es nulo, igual que antes de migrar, y no conserva la fecha de la migración

#### Scenario: La reversión no toca `closed_time` en las reglas que no cierran
- GIVEN un ticket `Pendiente` de servicio y uno de identidad, cada uno con `closed_time` fijado o nulo, migrados y luego revertidos
- WHEN se compara `closed_time` antes y después
- THEN es el mismo valor en los dos

#### Scenario: Quitar la restauración de `closed_time` del `.sql` pone roja la prueba
- GIVEN el texto del procedimiento sin la restauración de `closed_time` en la regla `entregado-a-finalizado`
- WHEN corre la prueba de la reversión sobre un `Entregado` migrado
- THEN la prueba falla, porque `closed_time` queda con el valor que le dio la migración
