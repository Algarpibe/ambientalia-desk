# Delta: zoho-sync — el estado de un ticket se normaliza al sincronizar y al leer, sin escribir datos (`normalizar-estados-zoho`)

Delta sobre `openspec/specs/zoho-sync/spec.md`. Tanda F1F-01 (`cierra: no`). Propuesta:
`openspec/changes/normalizar-estados-zoho/proposal.md`. Decisión que construye: `decision/e249-normalizar-al-leer`
(Gerencia; `openspec/config.yaml` → `decisiones_de_gerencia_adenda`, citada por clave): opción A, normalizar al leer y al
sincronizar en la misma función de `packages/shared`, sin escribir datos. Caso que lo motiva: el ticket #1004 está en
«Notificación Comercial» y Zoho lo guarda con dos espacios entre las palabras. Aquí se exige qué regla es, dónde se aplica
y qué se observa; el diseño decide los puntos de paso concretos, salvo los dos que la decisión nombra (la sincronización y
«toda lectura»).

**Nota de fusión.** Sólo `## ADDED Requirements`: un bloque nuevo, RQ-ZS-24, que se añade **al final** de la spec viva,
después de RQ-ZS-23 (`openspec/specs/zoho-sync/spec.md:1437`), de modo que no se mueve ninguna línea viva. No hay
`## MODIFIED` ni `## REMOVED`. Los escenarios de tablero, botones, transición, esperas, alarmas e indicadores se escriben
aquí, no en otras capacidades, porque lo que cambia es el dato que entra y sale de la réplica.

## ADDED Requirements

### Requirement: RQ-ZS-24 · El estado de un ticket se normaliza al sincronizar y en toda lectura, con una sola regla y sin reescribir la columna guardada

**La regla.** El sistema **SHALL** definir UNA regla de normalización de nombres de estado en UN módulo de
`packages/shared`, con dos formas generadas desde ese mismo módulo: una función TypeScript y su expresión SQL. La regla
**MUST** (a) quitar los espacios U+0020 de ambos extremos y (b) reemplazar cada secuencia de dos o más espacios U+0020 por
uno solo. **MUST NOT** cambiar mayúsculas, tildes ni ningún otro carácter (tabuladores, NBSP y otros blancos quedan como
están). Aplicada a un valor ya normalizado **MUST** devolverlo idéntico (idempotente). Las dos formas **MUST** dar el mismo
resultado sobre las mismas muestras.

**Dónde se aplica.** La regla **SHALL** aplicarse (1) al sincronizar un ticket desde Zoho, en el mapeo de la fila
(`packages/zoho-sync/src/db/mappers.ts:47`), de modo que lo que se guarda desde ese día ya es el nombre normalizado; y (2)
en TODA lectura del estado de un ticket, en TypeScript y en SQL, de modo que un valor guardado con espacios de más se
comporte exactamente como su gemelo normalizado. En SQL la normalización **MUST** ir dentro de la consulta. El sistema
**MUST NOT** reescribir la columna `tickets.status` para normalizarla: no existe ningún `UPDATE` cuyo fin sea normalizar.

**El catálogo.** Cada uno de los 26 nombres del registro (`packages/shared/src/estados.ts:59-106`) **MUST** ser punto fijo
de la regla. Cada estado de Zoho conocido, normalizado, **MUST** ser un nombre del registro. La fuente de los estados
conocidos es la columna «Estado» de `docs/analisis-tickets/Tickets.csv` (exportación del 08/09); no es la lista completa de
Zoho (supuesto S-6 de la propuesta).

**La historia.** Las filas de `ticket_transitions` que la aplicación escriba desde este cambio **SHALL** llevar el
`from_status` normalizado, porque se escribe el valor que se leyó (`apps/desk/server/services/ticketService.ts:155`,
`packages/zoho-sync/src/db/repo.ts:315-317`). Las filas existentes **MUST NOT** reescribirse.

**Lo saliente.** Ninguna escritura de la aplicación hacia Zoho **SHALL** mandar el nombre de un estado. Esto caracteriza el
código de hoy y debe seguir así: la única escritura a Zoho Desk es `/sendReply`, con canal, tipo de contenido, contenido,
remitente y destinatario (`apps/desk/server/routes/tickets.ts:203-209`), y el conjunto exacto de llamadas salientes no-GET
está fijado por `apps/desk/server/superficieSaliente.test.ts:44-67`.

#### Scenario: Espacios repetidos dentro del nombre se colapsan

- GIVEN el texto `Notificación  Comercial` (dos espacios entre las palabras)
- WHEN se aplica la regla
- THEN el resultado es `Notificación Comercial` (un espacio)
- AND tres o más espacios seguidos (`Notificación   Comercial`) también dan `Notificación Comercial`

#### Scenario: Los espacios de los extremos se recortan

- GIVEN los textos ` En Proceso`, `En Proceso ` y `  En   Proceso  `
- WHEN se aplica la regla a cada uno
- THEN los tres dan `En Proceso`

#### Scenario: Un nombre ya limpio no cambia

- GIVEN el texto `Notificación Comercial`
- WHEN se aplica la regla una vez y luego otra vez sobre su resultado
- THEN ambos resultados son idénticos al original

#### Scenario: Mayúsculas, tildes y otros blancos no se tocan

- GIVEN los textos `notificación comercial`, `Notificacion Comercial`, `Rev./Diagnostico` y un nombre con un tabulador o un NBSP entre palabras
- WHEN se aplica la regla a cada uno
- THEN cada resultado es idéntico a su entrada
- AND la regla no iguala `notificación comercial` con `Notificación Comercial`

#### Scenario: Una cadena sin contenido útil no falla

- GIVEN la cadena vacía y una cadena de sólo espacios
- WHEN se aplica la regla
- THEN el resultado es la cadena vacía en ambos casos
- AND no se lanza ninguna excepción

#### Scenario: Los 26 estados del registro son puntos fijos

- GIVEN los 26 nombres de `packages/shared/src/estados.ts:59-106`
- WHEN se aplica la regla a cada uno
- THEN cada resultado es idéntico a su entrada

#### Scenario: Todo estado conocido de Zoho normaliza a un nombre del registro

- GIVEN los valores distintos de la columna «Estado» de `docs/analisis-tickets/Tickets.csv`, incluido `Notificación  Comercial` con dos espacios
- WHEN se aplica la regla a cada valor
- THEN cada resultado es un nombre del registro
- AND un valor ajeno al registro, añadido a una copia del fichero, hace fallar la comprobación

#### Scenario: La forma SQL da lo mismo que la forma TypeScript

- GIVEN una base PostgreSQL real (prueba de integración con `TEST_DATABASE_URL`, que se salta en local si falta)
- AND las muestras de los escenarios anteriores
- WHEN se evalúa la expresión SQL de la regla sobre cada muestra y la función TypeScript sobre la misma
- THEN los dos resultados son idénticos en todas las muestras

#### Scenario: La sincronización guarda el nombre normalizado

- GIVEN una respuesta de Zoho con `status` igual a `Notificación  Comercial` (dos espacios)
- WHEN se mapea y se persiste el ticket
- THEN `tickets.status` guarda `Notificación Comercial`

#### Scenario: Un ticket guardado con dos espacios se lee normalizado y cae en su columna

- GIVEN un ticket cuyo `tickets.status` guardado es `Notificación  Comercial` (dos espacios)
- WHEN el cliente pide la lista de tickets o el ticket por su id
- THEN el `status` de la respuesta es `Notificación Comercial`
- AND el tablero lo coloca en la columna `notif_comercial` (`packages/shared/src/columns.ts:29`) y no en «Otros»

#### Scenario: El ticket de dos espacios tiene los mismos botones que su gemelo

- GIVEN dos tickets, uno guardado con `Notificación  Comercial` y otro con `Notificación Comercial`
- WHEN se piden las transiciones disponibles de cada uno
- THEN la lista del primero es no vacía y es la misma que la del segundo

#### Scenario: La transición se ejecuta y deja la historia normalizada

- GIVEN el ticket guardado con `Notificación  Comercial` y una transición cuyo origen es `Notificación Comercial`
- WHEN un usuario con el área de la transición la ejecuta
- THEN la respuesta es `200` y no `409`
- AND la nueva fila de `ticket_transitions` lleva `from_status` igual a `Notificación Comercial`
- AND las filas de `ticket_transitions` que ya existían no cambian

#### Scenario: Las lecturas no escriben la columna

- GIVEN el ticket guardado con `Notificación  Comercial`
- WHEN se ejecutan el listado, el detalle, el tablero, las esperas, las alarmas y los indicadores
- THEN `tickets.status` de esa fila sigue siendo `Notificación  Comercial` con sus dos espacios
- AND ninguna sentencia `UPDATE` sobre `tickets.status` se emite durante esas lecturas

#### Scenario: Las esperas cuentan al ticket como a su gemelo

- GIVEN dos tickets en un estado de espera que la consulta de esperas filtra en SQL, uno guardado con espacios de más y otro con el nombre del catálogo, con la misma antigüedad
- WHEN se calculan las esperas vencidas
- THEN los dos aparecen, con el mismo estado y el mismo plazo

#### Scenario: Las alarmas cuentan al ticket como a su gemelo

- GIVEN dos tickets en un estado con alarma de plazo, uno guardado con espacios de más y otro con el nombre del catálogo, ambos vencidos
- WHEN se calculan las alarmas vencidas
- THEN la alarma se dispara para los dos con el mismo estado
- AND la clave de la alarma ya avisada usa el nombre normalizado

#### Scenario: Los indicadores cuentan al ticket como a su gemelo

- GIVEN dos tickets cerrados, uno guardado con `Anulado` precedido de un espacio y otro con `Anulado`
- WHEN se calculan los indicadores del periodo
- THEN los dos cuentan como anulados y ninguno entra en el promedio de resolución

#### Scenario: La ficha de cliente recibe el estado normalizado

- GIVEN un cliente con un ticket guardado con `Notificación  Comercial`
- WHEN se pide el detalle del cliente (`apps/desk/server/db/directory.ts:26` lo arma desde la fila)
- THEN el `status` de ese ticket en la respuesta es `Notificación Comercial`

#### Scenario: El reloj del SLA no se rompe por un espacio en un solo lado

- GIVEN un ticket cuyo último paso del historial de Zoho dice `Notificación Comercial` y cuyo `tickets.status` guardado dice `Notificación  Comercial`
- WHEN se reconstruye la secuencia del reloj (`apps/desk/server/db/relojSla.ts:58` compara el último paso con el estado del ticket)
- THEN la secuencia no es `null`: los dos lados se comparan normalizados
- AND el caso inverso (espacio de más en el historial, nombre limpio en el ticket) da el mismo resultado

#### Scenario: Ninguna escritura hacia Zoho manda el nombre de un estado

- GIVEN el conjunto de llamadas salientes no-GET fijado por `apps/desk/server/superficieSaliente.test.ts:44-67`
- WHEN se ejecuta una transición sobre el ticket guardado con dos espacios
- THEN ninguna petición hacia Zoho Desk ni hacia n8n lleva el nombre de un estado como campo
- AND la prueba de superficie sigue en verde sin añadir ninguna llamada
