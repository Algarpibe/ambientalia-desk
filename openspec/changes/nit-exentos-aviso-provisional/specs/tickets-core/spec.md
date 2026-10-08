## MODIFIED Requirements

### RQ-TC-30 · Cliente provisional: tabla propia `public.clientes_provisionales`, cinco datos obligatorios

El alta del ticket **SHALL** admitir un modo manual de cliente: en lugar de un `clientId` de Books, el cuerpo trae
razón social, NIT, contacto, teléfono y correo, y el servidor crea una fila en `public.clientes_provisionales`
(sentencia `CREATE TABLE` con el esquema calificado, al final de `schema.sql`) con la marca «pendiente de validar»,
quién la creó, cuándo y el **motivo escrito obligatorio** de por qué no se usó el cliente de Books. El ticket
**SHALL** quedar con el identificador del provisional como `client_id`, y ese identificador **MUST NOT** poder
coincidir con el de ningún contacto de Books. Los cinco datos y el motivo son obligatorios (supuesto Q2); si falta
alguno el alta responde `422` listando **todos** los que faltan (**escalón A**) sin escribir nada. Es A y no C por la
misma razón que `exigirEquipoNuevo` (`apps/desk/server/services/equipoNuevo.ts:32-44`, A, en `ticketService.ts:25`):
faltan datos del **sujeto que el alta va a crear**, no contenido del ticket. La **validez** de esos datos —provisional
junto con `clientId` u orden de venta— sigue en C. No son los «obligatorios» de C del cuadro de `transitions-st` §3.8
(`:88`), que son los del cuerpo del ticket. Puede hacer el alta manual quien hoy puede crear tickets (supuesto Q1). El
alta manual **MUST NOT** escribir en `books.*` ni hacia Zoho.
Si el NIT del provisional ya pertenece a uno o más clientes de Books (comparado sin puntos, espacios ni dígito de
verificación) y no es un NIT exento (`RQ-TC-57`), el alta **SHALL** responder `409` (escalón D, unicidad) con el cuerpo
`{ error, candidatos: [{ id, name }] }`: **uno o más** candidatos, ordenados por nombre y después por id, para que se
use uno de ellos, sin escribir nada (P-B, decidido por el usuario el 2026-10-02). Que se devuelvan todos es un
supuesto reversible (`design.md` §4.6). Los NIT genéricos de la lista `public.nit_exentos` (`RQ-TC-57`, E-154) quedan
exentos de este `409`: el alta sigue su curso y responde `201`.

#### Scenario: Alta con cliente provisional
- GIVEN una sesión que puede crear tickets y los cinco datos y el motivo completos
- WHEN se envía `POST /api/tickets` en modo manual de cliente
- THEN responde `201`, existe una fila en `public.clientes_provisionales` marcada pendiente con autor, fecha y motivo, y el ticket tiene ese id como `client_id`

#### Scenario: Faltan datos del cliente
- GIVEN un cuerpo manual sin NIT ni correo
- WHEN se envía el alta
- THEN responde `422` nombrando NIT y correo en la misma lista y no queda ningún ticket, equipo ni provisional escrito

#### Scenario: Motivo vacío
- GIVEN un cuerpo manual con los cinco datos y un motivo de sólo espacios
- WHEN se envía el alta
- THEN responde `422` y no se escribe nada

#### Scenario: El NIT ya está en Books
- GIVEN un cliente de Books con NIT «900.123.456-7», que no está en la lista de exentos, y un alta manual con NIT «900123456»
- WHEN se envía el alta
- THEN responde `409` con `candidatos: [{ id, name }]` del cliente de Books (uno), y no queda ningún ticket, equipo ni provisional escrito

#### Scenario: Dos contactos de Books comparten el NIT
- GIVEN dos contactos de Books cuyo NIT normalizado es «900123456» (p. ej. dos sucursales), insertados en orden inverso al alfabético
- WHEN se envía un alta manual con NIT «900123456»
- THEN responde `409` con los dos en `candidatos`, ordenados por nombre y después por id, y no queda nada escrito

#### Scenario: El id provisional no se confunde con uno de Books
- GIVEN un cliente provisional creado
- WHEN se compara su identificador con el conjunto de ids de `books.contacts`
- THEN no coincide con ninguno

## ADDED Requirements

### RQ-TC-57 · NIT genéricos exentos del `409` de NIT en Books: lista como dato en `public.nit_exentos`

Gerencia, `decision/e154-nit-genericos-exentos` (`openspec/config.yaml:4207`): «Exentos el NIT de consumidor final
(222222222222) y los genéricos que confirme contabilidad sobre la lista de NIT repetidos en Books.»

**La lista es un dato, no una constante.** El sistema **SHALL** guardarla en la tabla `public.nit_exentos`
(sentencia `CREATE TABLE` con el esquema calificado, al final de `schema.sql`) con las columnas `nit` (clave primaria;
base normalizada, sólo dígitos), `motivo` (obligatorio), `activo` (por defecto verdadero) y `created_at`. La siembra
**SHALL** contener **exactamente una fila**: `222222222222`, motivo «Consumidor final». **MUST NOT** sembrarse ningún otro
NIT, ni como candidato: sólo entra lo que Gerencia nombró y lo que contabilidad confirme después, por SQL en producción
(supuesto S-1, reversible: sin pantalla de mantenimiento). Una fila se retira con `activo = false` y **MUST NOT** borrarse,
porque la siembra la reinsertaría. **MUST NOT** existir una constante espejo de la lista en `packages/shared`: la tabla es
la única fuente.

**Cómo casa.** `esNitExento(nit, exentos)` **SHALL** ser una función pura de `packages/shared` que devuelve verdadero si y
sólo si algún exento activo casa con el NIT por `nitCoincide` (`packages/shared/src/altaManual.ts:46-53`), la **misma**
función con la que el alta compara contra Books. **MUST NOT** haber una segunda implementación de «mismo NIT», y
`nitCoincide` y `normalizarNit` (`packages/shared/src/altaManual.ts:32-35`) **MUST NOT** cambiar. Un NIT sin dígitos
**MUST NOT** ser nunca exento, ni siquiera con una lista de entradas vacías.

**Dónde se aplica.** En el alta manual de cliente (`RQ-TC-30`), si el NIT del provisional es exento el alta **MUST NOT**
responder el `409` de NIT en Books, aunque Books tenga uno o más contactos con ese NIT. La exención **SHALL** vivir en el
**escalón D** (unicidad), en el mismo lugar que hoy ocupa la comprobación del NIT
(`apps/desk/server/services/ticketService.ts:96`): **MUST NOT** saltar ninguna guarda de A, B ni C, ni la guarda de la
orden de venta ya asociada a otro ticket (`apps/desk/server/services/ticketService.ts:97-100`), que se sigue evaluando. Un
NIT exento con serial distinto del registrado responde el `422` del serial, y un alta exenta sin los cinco datos responde
el `422` de A, igual que con un NIT no exento.

**Lista inactiva o vacía.** Si la fila está con `activo = false`, o la tabla no tiene filas, ningún NIT es exento y
**SHALL** volver el `409` con candidatos para un NIT que casa con Books.

**Comportamiento conocido (no es defecto).** Un NIT tecleado como base más dígito de verificación **sin guion** no casa
con el exento guardado sin dígito (contrato de `nitCoincide`), y, si Books lo tiene con guion, sigue dando `409`. La salida
es sembrar también esa forma, por SQL.

**Dos provisionales con el mismo NIT exento se permiten** (supuesto S-2, reversible): hoy nada impide dos provisionales con
el mismo NIT, exento o no, y este cambio **MUST NOT** añadir esa unicidad.

La exención y la lista las decide y las impone el servidor; el cliente **MUST NOT** espejarlas (regla invariable 13). Esta
capacidad **MUST NOT** escribir en `books.*` ni hacia Zoho.

#### Scenario: El NIT de consumidor final no da 409 aunque Books lo tenga
- GIVEN la siembra de `public.nit_exentos` y uno o más contactos de Books con NIT «222222222222»
- WHEN se envía un alta manual con NIT «222222222222» y lo demás válido
- THEN responde `201` y existen el provisional y el ticket

#### Scenario: El NIT exento con formato también queda exento
- GIVEN la misma situación, y altas con NIT «222.222.222.222», «222 222 222 222» y «222222222222-2»
- WHEN se envía cada alta
- THEN cada una responde `201`

#### Scenario: Un NIT no exento repetido en Books sigue dando 409
- GIVEN un contacto de Books con NIT «900123456» que no está en la lista
- WHEN se envía un alta manual con NIT «900123456»
- THEN responde `409` con todos los candidatos y no queda nada escrito

#### Scenario: La exención no salta el 422 del serial
- GIVEN un NIT exento presente en Books y un serial distinto del registrado
- WHEN se envía el alta
- THEN responde el `422` del serial y no queda nada escrito

#### Scenario: La exención no salta el 422 de A
- GIVEN un NIT exento presente en Books y un cuerpo manual sin alguno de los cinco datos
- WHEN se envía el alta
- THEN responde el `422` de A listando lo que falta y no queda nada escrito

#### Scenario: Con cliente provisional y orden de venta responde el 422 de C, exento o no
- GIVEN un cliente manual (exento o no) y una orden de venta, ya asociada a otro ticket o no (`apps/desk/server/services/altaManual.ts:116`)
- WHEN se envía el alta; la exención no cambia la respuesta (`apps/desk/server/services/altaManual.test.ts:212`)
- THEN responde el `422` de C («no se combina con una orden de venta») antes de llegar a D, y no queda nada escrito

#### Scenario: La exención no salta el 403 de B (cargo de la OVI)
- GIVEN un NIT exento, una orden OVI y un usuario sin el cargo que la asocia
- WHEN se envía el alta (`apps/desk/server/services/altaManual.test.ts:511`)
- THEN responde el `403` de B, no `201` ni el `422` de C, y no queda nada escrito

#### Scenario: Fila inactiva, el 409 vuelve
- GIVEN la fila `222222222222` con `activo = false` y un contacto de Books con ese NIT
- WHEN se envía un alta manual con NIT «222222222222»
- THEN responde `409` con candidatos

#### Scenario: Lista vacía, el 409 vuelve
- GIVEN la tabla `public.nit_exentos` sin filas y un contacto de Books con NIT «222222222222»
- WHEN se envía un alta manual con NIT «222222222222»
- THEN responde `409` con candidatos

#### Scenario: La siembra contiene exactamente la fila de Gerencia
- GIVEN el esquema recién migrado
- WHEN se leen las filas de `public.nit_exentos`
- THEN hay una sola, con `nit` «222222222222», `activo` verdadero y motivo «Consumidor final»

#### Scenario: Un NIT sin dígitos nunca es exento
- GIVEN una lista con entradas válidas
- WHEN se evalúa `esNitExento` con una cadena vacía, sólo espacios o sólo signos
- THEN devuelve falso

#### Scenario: Base más dígito de verificación sin guion no es exento (comportamiento conocido)
- GIVEN el exento «222222222222» y un alta con NIT «2222222222222» (base y dígito pegados, sin guion)
- WHEN se evalúa `esNitExento`
- THEN devuelve falso

#### Scenario: Dos provisionales con el mismo NIT exento se permiten
- GIVEN un provisional ya creado con NIT «222222222222»
- WHEN se envía otra alta manual con el mismo NIT exento y lo demás válido
- THEN responde `201` y existen los dos provisionales
