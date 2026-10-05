# Delta para `zoho-sync`

## ADDED Requirements

### RQ-ZS-17 · Ejecutor de la migración de tickets abiertos: seco por defecto, negativa total, marcador antes del `UPDATE`, idempotente

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
   `corte` y `ejecutado_por`; y **después**
2. hacer el `UPDATE` de `desk.tickets … WHERE id = $1 AND managed_by_app = false RETURNING id`: `status` al destino,
   `status_type` sólo cuando D-10 lo cambia, `managed_by_app = true` y `updated_at = now()`. **No** toca
   `modified_time` (D-5), `closed_time` ni `source` (D-4). Si el `UPDATE` no devuelve fila, se lanza error y se
   deshace todo (D-3).

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
lista como ya gobernados (RQ-TC-41).

**Frontera ante el sincronizador.** Un ticket migrado queda con `managed_by_app = true`, así que `upsertTicket` sale
antes de escribir (`packages/zoho-sync/src/db/repo.ts:71`) y no sobrescribe ni el estado, ni el `status_type`, ni
ninguna otra columna. Supuesto S-1: la sincronización sigue corriendo y no hay interruptor para pararla; el
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
- THEN `modified_time`, `source` y `closed_time` son los mismos y `updated_at` cambia

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
- THEN el primero queda `Finalizado` con `status_type = 'Closed'`, `managed_by_app = true` y `closed_time` intacto
- AND el segundo queda `En Proceso` con `managed_by_app = true`
- AND cada uno tiene exactamente una fila marcador en `ticket_transitions`

#### Scenario: El marcador guarda los tres valores previos
- GIVEN un ticket `Pendiente` con `status_type = 'On Hold'` y `managed_by_app = false`
- WHEN se aplica la migración
- THEN su marcador lleva `from_status = 'Pendiente'`, `to_status = 'En Proceso'` y en `"values"` `estado_previo`, `status_type_previo` y `managed_by_app_previo`, además de `estado_destino`, `regla`, `corte` y `ejecutado_por`

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
- THEN los totales por pareja, los sin equivalencia, los ya gobernados, los nacidos tras el corte, los sin remisión vigente y el número más alto a marcar son los mismos en las dos respuestas

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

### RQ-ZS-18 · Reversión por marcador: sólo donde el marcador sigue siendo la última transición, restaurando los tres valores previos

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
2. borrar únicamente los marcadores de los tickets restaurados.

Un ticket que tenga transiciones **posteriores** al marcador (alguien lo movió desde la aplicación) **MUST NOT**
revertirse ni perder su marcador, y el procedimiento **SHALL** listarlo para decisión de una persona. La reversión
**MUST NOT** tocar `closed_time` (la migración tampoco lo tocó).

La copia previa de la base y la sincronización completa son requisitos de persona y quedan escritos en el
procedimiento. Tras revertir, `managed_by_app` vuelve a `false` en los tickets que lo tenían así, de modo que el
sincronizador vuelve a sobrescribirlos; el procedimiento **SHALL** decirlo. La reversión está **probada sobre pg-mem**
con una prueba que ejecuta el texto del procedimiento. **Hipótesis:** pg-mem puede no soportar toda sintaxis de
extracción de `jsonb` que use la reversión; si no, la forma de restaurar se decide en el diseño sin cambiar lo que
exige este requisito, y la primera lectura real es la pasada en seco de la persona.

#### Scenario: La reversión devuelve las filas a como estaban
- GIVEN una base migrada con `aplicar=true`, con tickets `Entregado` y `Pendiente` de servicio
- WHEN se ejecuta la reversión del procedimiento
- THEN cada ticket recupera su `status`, `status_type` y `managed_by_app` previos, iguales a los de antes de migrar
- AND los marcadores de esos tickets desaparecen

#### Scenario: Un ticket movido después del marcador no se revierte
- GIVEN un ticket migrado al que luego se le añadió otra fila en `ticket_transitions`
- WHEN se ejecuta la reversión
- THEN su `status`, `managed_by_app` y su marcador quedan como estaban
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

#### Scenario: La reversión no toca `closed_time`
- GIVEN un ticket `Entregado` con `closed_time` fijado, migrado y luego revertido
- WHEN se compara `closed_time` antes y después
- THEN es el mismo valor
