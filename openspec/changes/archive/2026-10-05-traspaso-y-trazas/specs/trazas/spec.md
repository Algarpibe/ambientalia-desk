# Delta para `trazas`

Medido el 2026-10-05 contra el árbol del worktree. Supuestos S-1…S-6 de la propuesta, vinculantes. Fuera de este delta:
visibilidad por área (E-089), reasignación con motivo, registro de borrados, y marcar al actor de respaldo (E-219).

## ADDED Requirements

### RQ-TZ-14 · Restaurar una remisión deja rastro: quién, cuándo, y la anulación que deshace

Hoy `restaurarRemision` pone a `NULL` las dos columnas de anulación y no recibe a nadie
(`apps/desk/server/db/remisiones.ts:151-153`), y el historial deriva «Remisión anulada» de esas mismas columnas
(`apps/desk/server/db/historial.ts:110-119`): tras restaurar desaparecen los dos hechos. Desde este cambio:

- Restaurar **SHALL** guardar la persona y el instante de la restauración, y **SHALL** conservar la persona y el
  instante de la anulación que deshace, **antes** de vaciar las columnas de anulación vigentes. Las columnas nuevas de
  `public.remisiones` **SHALL** ser anulables, calificadas con esquema y añadidas al final del esquema (sin `NOT NULL`
  y sin relleno de filas existentes, S-3).
- La persona **SHALL** ser el usuario de la sesión; si la sesión no trae nombre, **SHALL** ser el mismo respaldo que ya
  usa la ruta (`apps/desk/server/routes/remision.ts:344-346`, `TRANSITION_ACTOR`). **MUST NOT** quedar vacía.
- Anular **MUST NOT** borrar el rastro de una restauración anterior. Guarda el **último** ciclo anular→restaurar (S-2):
  una segunda restauración sustituye la anulación previa y la restauración guardadas por las del nuevo ciclo.
- El historial **SHALL** enseñar «Remisión restaurada», con persona e instante, y la anulación que la precedió, con
  persona e instante. **MUST NOT** escribir ninguna fila al abrirse. Las restauraciones anteriores al cambio siguen sin
  rastro (S-3).

#### Scenario: Anular y restaurar deja los dos hechos en el historial
- GIVEN una remisión anulada por «Ana» a las 10:00
- WHEN «Beto», administrador, la restaura a las 11:00
- THEN el historial enseña «Remisión anulada» (Ana, 10:00) y «Remisión restaurada» (Beto, 11:00)
- AND las columnas de anulación vigentes quedan vacías

#### Scenario: La posición importa: la anulación se guarda antes de vaciarla
- GIVEN una remisión anulada por «Ana»
- WHEN se restaura
- THEN la persona de la anulación previa guardada es «Ana», no vacía

#### Scenario: Restauración sin nombre en la sesión usa el respaldo, no vacío
- GIVEN una petición de restaurar cuya sesión no trae nombre
- WHEN se restaura
- THEN la persona de la restauración vale el respaldo `TRANSITION_ACTOR` y no `NULL`

#### Scenario: Anulada, restaurada y anulada de nuevo
- GIVEN una remisión anulada (ciclo 1) y restaurada
- WHEN se anula otra vez
- THEN el rastro de la restauración del ciclo 1 sigue ahí y la anulación vigente es la nueva
- AND el historial enseña los tres hechos en orden cronológico

#### Scenario: Un segundo ciclo pisa el primero (S-2)
- GIVEN el caso anterior
- WHEN se restaura por segunda vez
- THEN solo se guarda la anulación y la restauración del ciclo 2

#### Scenario: Remisión nunca restaurada
- GIVEN una remisión sin restauración guardada, anulada o no
- WHEN se abre el historial
- THEN no aparece «Remisión restaurada» y los eventos existentes no cambian

### RQ-TZ-15 · Liberar las asociaciones al borrar un ticket nombra al actor

`liberarAsociacionesDeTicket` hoy no escribe `liberada_por` (`packages/zoho-sync/src/db/ovAsociaciones.ts:132-138`),
aunque la liberación individual sí (`:106`). Desde este cambio:

- Liberar las asociaciones vigentes de un ticket que se borra **SHALL** escribir `liberada_por` con la persona que
  borra, en la misma sentencia que `liberada_at` y `motivo_liberacion`. `eliminarTicket` **SHALL** recibir esa persona
  de la ruta; si la sesión no trae nombre, **SHALL** usarse el mismo respaldo que el resto de escritores.
- Una asociación ya liberada **MUST NOT** modificarse (conserva su `liberada_por` y su instante).
- Esto **no** es el registro de borrados que pide la decisión de Gerencia pendiente; no crea tabla ni fila nueva.

#### Scenario: Borrar un ticket con asociaciones vigentes las deja liberadas con persona
- GIVEN un ticket con dos asociaciones vigentes y una ya liberada por «Carla»
- WHEN «Beto» borra el ticket
- THEN las dos vigentes quedan con `liberada_at`, el motivo y `liberada_por = 'Beto'`
- AND la ya liberada conserva `liberada_por = 'Carla'`

#### Scenario: Ticket sin asociaciones vigentes
- GIVEN un ticket sin asociaciones vigentes
- WHEN se borra
- THEN no se actualiza ninguna fila y no falla

### RQ-TZ-16 · Todo escritor de `ticket_transitions` nombra al actor; hay una prueba que lo vigila

Todo `INSERT INTO ticket_transitions` de producción **SHALL** nombrar la columna `performed_by`. Una prueba de barrido
**SHALL** recorrer el código de producción, encontrar cada escritor y ponerse roja si uno no la nombra. Hoy son cuatro
(`packages/zoho-sync/src/db/repo.ts:255`, `:315`, `:429` y `apps/desk/server/db/migracionTicketsAbiertos.ts:79`).

- El barrido **SHALL** comprobar que la columna se **nombra**, no que el valor sea no nulo en ejecución (S-6); su
  descripción **SHALL** decir qué comprueba y qué no. No hay `NOT NULL` en la tabla ni se tocan filas.
- La prueba se valida ensuciando lo vigilado: una copia sintética de un escritor sin `performed_by` **SHALL** ponerla roja.
- El barrido **SHALL** recorrer además, en un caso aparte y sin contarlos entre los escritores de producción, los
  procedimientos `.sql` de `docs/sdd/`: todo `INSERT INTO ticket_transitions` escrito en uno de ellos **SHALL** nombrar
  `performed_by`. Hoy es uno (`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:46`).

#### Scenario: Los cuatro escritores de hoy pasan
- GIVEN el código de producción actual
- WHEN corre el barrido
- THEN encuentra los cuatro escritores y todos nombran `performed_by`

#### Scenario: Un escritor sintético sin actor lo pone en rojo
- GIVEN una copia sintética con un `INSERT INTO ticket_transitions` sin `performed_by`
- WHEN corre el barrido sobre ella
- THEN falla nombrando el fichero

#### Scenario: El barrido no encuentra nada
- GIVEN un árbol donde el patrón de búsqueda no encuentra ningún escritor
- WHEN corre el barrido
- THEN falla: cero escritores no es éxito

#### Scenario: Un procedimiento `.sql` de `docs/sdd/` sin actor lo pone en rojo
- GIVEN un `.sql` de procedimiento bajo `docs/sdd/` que inserta en `ticket_transitions` sin nombrar `performed_by`
- WHEN corre el barrido de procedimientos
- THEN falla nombrando el fichero
- AND el procedimiento de hoy, que sí la nombra, pasa

### RQ-TZ-17 · Las excepciones a la traza del ticket se declaran, no se absorben

Cada cosa que cambia datos sin fila en `ticket_transitions` **SHALL** estar declarada con su situación:

| Hecho | Situación |
|---|---|
| Ajustes de prioridad y Top 5 (`prioridad_ajustes`) | Registro propio; **no** entra en el historial del ticket |
| Asociaciones de orden de venta (`ov_asociaciones`) | Registro propio; **no** entra en el historial |
| Cambios del equipo (`equipos_cambios`) | Registro propio; **no** entra en el historial |
| Resolución del ticket | Sin registro por evento: guarda solo la última (hipótesis, no releída) |
| Rellenos de datos y sincronización de Zoho | Sin registro por evento, fuera de este cambio |
| Borrado de administrador | Sin fila; dueño Gerencia |

El historial **MUST NOT** incorporar ninguno de esos registros propios.

#### Scenario: Un ajuste de prioridad no aparece en el historial
- GIVEN un ticket con un ajuste en `prioridad_ajustes`
- WHEN se abre su historial
- THEN ningún evento procede de ese registro

### RQ-TZ-18 · Cada traspaso se lee como una línea propia, compuesta al leer

Por cada transición de la aplicación con destino resoluble, el historial **SHALL** componer una línea de traspaso
con: origen (`performed_by`), destino, fecha y hora. **SHALL** derivarse al leer de `ticket_transitions` y **MUST NOT**
usar tabla, columna ni escritura nuevas. Es solo la presentación derivada (S-1): no aprueba el protocolo de traspaso.

- Destino: la persona de `values.derivado_a`, resuelta por nombre con la misma traducción que el campo (RQ-TZ-08); un id
  que no resuelve **SHALL** enseñarse crudo (S-5). Si la clave falta o está vacía, el destino **SHALL** ser el área del
  estado de llegada (RQ-AV-18).
- Hay línea aunque la persona no cambie (S-4). Si no hay persona ni área (estado terminal), no hay línea.
- La línea **MUST NOT** quitar ni alterar el evento de transición existente; su hora es la de la transición.

#### Scenario: Con persona derivada
- GIVEN una transición de «Ana» con `derivado_a` = id de «Beto», a las 10:00
- WHEN se abre el historial
- THEN hay una línea con origen «Ana», destino «Beto» y las 10:00, además del evento de la transición

#### Scenario: Sin persona derivada, destino por área
- GIVEN una transición a un estado cuya área siguiente es Comercial y sin clave `derivado_a`
- WHEN se abre el historial
- THEN la línea tiene como destino el área Comercial

#### Scenario: Clave `derivado_a` vacía
- GIVEN `derivado_a` igual a cadena vacía
- WHEN se abre el historial
- THEN se trata como ausente: destino por área

#### Scenario: Id que no resuelve
- GIVEN `derivado_a` con un id que no está entre las personas
- WHEN se abre el historial
- THEN el destino se enseña con el id crudo, sin «desconocido»

#### Scenario: La persona no cambia
- GIVEN «Ana» ejecuta una transición y se deriva a sí misma
- WHEN se abre el historial
- THEN hay línea de traspaso, con origen y destino «Ana»

#### Scenario: Estado terminal y sin persona
- GIVEN una transición cuyo estado de llegada no tiene áreas siguientes y sin `derivado_a`
- WHEN se abre el historial
- THEN no hay línea de traspaso

#### Scenario: Abrir el historial no escribe
- GIVEN cualquier ticket
- WHEN se abre su historial dos veces
- THEN no se inserta ni actualiza ninguna fila

### RQ-TZ-19 · La creación y el marcador de la migración no son traspasos

La fila de creación (`from_status` = `FROM_STATUS_CREACION`, `apps/desk/server/db/ticketFuentes.ts:25-27`) y el
marcador de la migración de tickets abiertos **MUST NOT** producir línea de traspaso. El marcador **SHALL** reconocerse
por su identificador de transición (`packages/shared/src/migracionTickets.ts:14`), **no** por tener el destino vacío:
dos de sus reglas sí llevan destino. El marcador sigue enseñándose como hoy; su presentación (E-215), su paso por la
hoja de vida (E-216) y su reloj de alarma (E-217) quedan fuera de este cambio y sin empeorar.

#### Scenario: La creación no genera traspaso
- GIVEN un ticket recién creado con derivación
- WHEN se abre el historial
- THEN existe el evento de creación y no hay línea de traspaso de esa fila

#### Scenario: Marcador de identidad (destino vacío)
- GIVEN un marcador de la migración con `to_status` nulo
- WHEN se abre el historial
- THEN no hay línea de traspaso para él

#### Scenario: Marcador con destino
- GIVEN un marcador de la regla que cambia el estado, con `to_status` relleno y un área siguiente
- WHEN se abre el historial
- THEN tampoco hay línea de traspaso

#### Scenario: Una transición normal con destino nulo no se confunde con el marcador
- GIVEN una fila con otro identificador de transición y `to_status` nulo
- WHEN se abre el historial
- THEN el criterio de exclusión es el identificador, no el destino vacío

## MODIFIED Requirements

### RQ-TZ-06 · La historia es una sola línea de tiempo, no un fallback

`getHistorialTicket` **SHALL** combinar las **tres** fuentes en una sola línea de tiempo ordenada de
más reciente a más antigua, y **MUST NOT** elegir una de ellas
(`apps/desk/server/db/historial.ts:131-161`, con la unión en `:157` y el orden en `:123-124`):

| Fuente | De dónde | Línea |
|---|---|---|
| Historial de Zoho | `ticket_history` | `historial.ts:132` |
| Transiciones de la app y la creación, más la línea de traspaso derivada de cada transición (RQ-TZ-18) | `ticket_transitions` | `:136-144` |
| Remisiones: creación, desenlace, anulación y restauración | `remisiones` | `:149-155` |

- **SHALL** derivarse al leer y **MUST NOT** registrar eventos nuevos en tabla propia: eso es lo que hace que aparezca
  sola la historia ya existente, las 149 remisiones migradas incluidas
  (`historial.ts:126-129`; `design unificada:32`). La restauración se deriva de las columnas de la remisión (RQ-TZ-14),
  y el traspaso de la fila de la transición (RQ-TZ-18).
- La consulta de remisiones **MUST** ser propia y **MUST NOT** reutilizar
  `listRemisionesByTicket`: aquélla filtra `anulada_at IS NULL` porque el panel del ticket sólo enseña
  lo vigente, y aquí hacen falta justo las anuladas — «el historial registra lo que PASÓ, y una
  remisión anulada pasó (y su anulación también)» (`historial.ts:146-148`).

> **Given** un ticket que vino de Zoho y luego se movió en la app
> **When** se abre su pestaña de Historia
> **Then** se ven las dos cosas: los eventos de Zoho y las transiciones de la app.
> *(Con el `else` del diseño original se veían sólo las de Zoho — era el más grave de los tres fallos
> que la historia unificada vino a arreglar, `design unificada:19-23`.)*

(Previously: la fuente de remisiones listaba creación, desenlace y anulación; la restauración borraba la anulación sin
rastro, y el traspaso no tenía línea propia.)

#### Scenario: Zoho y app conviven en la misma línea de tiempo
- GIVEN un ticket de Zoho movido después en la app
- WHEN se abre su historial
- THEN aparecen los eventos de Zoho y los de la app, ordenados del más reciente al más antiguo

#### Scenario: La remisión anulada y restaurada sigue en la historia
- GIVEN una remisión anulada y restaurada
- WHEN se abre el historial
- THEN aparecen su creación, su anulación y su restauración, aunque ya no figure anulada
