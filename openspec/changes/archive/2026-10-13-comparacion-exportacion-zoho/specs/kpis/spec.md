# Delta: KPIs — la comparación lee la exportación de Zoho (`comparacion-exportacion-zoho`)

Delta sobre `openspec/specs/kpis/spec.md`. Tanda F1F-05 (`cierra: no`). Propuesta:
`openspec/changes/comparacion-exportacion-zoho/proposal.md`. «La exportación» es el CSV que Zoho Desk exporta
(muestra: `docs/analisis-tickets/Tickets.csv`). «La ruta de comparación» es la ruta nueva `POST`, distinta del
`GET /api/indicadores`; su nombre lo fija el diseño. Las citas a la spec viva van por identificador RQ-KP-NN,
no por línea, porque la fusión las desplaza.

**Nota de fusión.** Los tres bloques de `## MODIFIED Requirements` (RQ-KP-14, RQ-KP-17 y RQ-KP-18) sustituyen
**entero** el de la spec viva con la misma cabecera; son bloques completos, con todos sus escenarios
existentes. Los de `## ADDED Requirements` se añaden al final, tras RQ-KP-22, en el orden RQ-KP-23 a
RQ-KP-28. La tabla «0 · Procedencia y método» no lleva cabecera `### Requirement:`: su fusión es aparte
(sección siguiente), con el formato de tres columnas `Id | Supuesto | Origen`.

## Filas de la tabla de supuestos

**Se sustituye** la fila `SP-9` por:

| Id | Supuesto | Origen |
|---|---|---|
| SP-9 | En el `GET /api/indicadores` el valor de Zoho se lee de los datos sincronizados del ticket. La comparación con la exportación es de la ruta de comparación (RQ-KP-26), que no lee los datos sincronizados | Spec |

**Se añaden**, al final y en este orden (`S-1` a `S-9` de la propuesta §5, con identificador propio para no
chocar con `S-1` a `S-8` ya existentes):

| Id | Supuesto | Origen |
|---|---|---|
| S-I | La exportación de noviembre trae las mismas columnas que la muestra: 59, separador coma, comillas, BOM UTF-8, CRLF | Propuesta (§5, S1) |
| S-J | El fichero se sube, se compara y **no se guarda** | Propuesta (§5, S2) |
| S-K | Se exigen las doce columnas que se leen, no las 59 | Propuesta (§5, S3) |
| S-L | En la ruta de comparación el valor de Zoho sale **sólo** del fichero; un ticket del periodo ausente de él no se completa con los datos sincronizados | Propuesta (§5, S4) |
| S-M | Un «ID» repetido: vale la primera fila y las siguientes se rechazan con motivo | Propuesta (§5, S5) |
| S-N | Un ticket del fichero que existe en Desk pero fuera del periodo se cuenta **aparte** de «no está en Desk» | Propuesta (§5, S6) |
| S-O | El periodo va por `desde` y `hasta`, como el `GET`; el `400` de parámetros precede al del fichero | Propuesta (§5, S7) |
| S-P | Una celda de indicador no vacía que `valorDeZoho` no acepta se cuenta y se lista por columna como «valor ilegible» | Propuesta (§5, S8) |
| S-Q | Los listados salen completos, sin paginar | Propuesta (§5, S9) |

## MODIFIED Requirements

### Requirement: RQ-KP-14 · La lectura no crece con el número de tickets y no escribe

El `GET /api/indicadores` **SHALL** leer con un número constante de **cuatro** consultas, independiente del
número de tickets: tickets del periodo, todas sus transiciones, los cierres de empresa y la última respuesta
de la encuesta de cada ticket del periodo (RQ-KP-22). El `GET` **MUST NOT** ejecutar ninguna sentencia que no
sea de lectura, ni llamar a Zoho, ni leer ningún fichero. La lectura de un fichero es **exclusiva** de la
ruta de comparación (RQ-KP-26) y no cambia nada del `GET`.

#### Scenario: Diez tickets, cuatro consultas
- GIVEN diez tickets del periodo, cada uno con transiciones
- WHEN llama un administrador
- THEN el número de consultas es cuatro, el mismo que con un solo ticket, y todas son de lectura

#### Scenario: Veinte tickets, cuatro consultas
- GIVEN veinte tickets del periodo, algunos con respuestas de la encuesta y otros sin ellas
- WHEN llama un administrador
- THEN el número de consultas sigue siendo cuatro y todas son de lectura

#### Scenario: El GET no cambia por existir la ruta de comparación
- GIVEN la ruta de comparación registrada
- WHEN un administrador llama al `GET /api/indicadores`
- THEN responde lo mismo que antes del cambio, con cuatro consultas, sin leer ningún fichero

### Requirement: RQ-KP-17 · Resumen de comparación en la ruta

El `GET /api/indicadores` **SHALL** armar los pares sólo con los valores de Zoho ya presentes en los datos
sincronizados del ticket (SP-9) y **MUST NOT** leer ningún fichero ni cargar el export de Zoho. Cargar la
exportación es de la ruta de comparación (RQ-KP-26), no del `GET`. Si **ningún** par tiene valor de Zoho,
`comparacion` **SHALL** decir `«sin valor de Zoho con que comparar»` y
`porcentaje` **MUST** ser `null` en cada indicador. Si hay valores de Zoho pero ningún par comparable, el
mensaje **SHALL** ser `«sin pares comparables»`, también con `porcentaje` `null`.

#### Scenario: Los datos sincronizados no traen valores de Zoho
- GIVEN tickets sin ningún valor de Zoho en sus datos sincronizados
- WHEN responde la ruta
- THEN `comparacion` dice «sin valor de Zoho con que comparar» y ningún indicador trae porcentaje

#### Scenario: Con valores de Zoho
- GIVEN dos tickets cuyo 59 de Zoho coincide con el de la aplicación y otro que difiere en 3 días
- WHEN responde la ruta
- THEN el 59 trae `comparados` 3, `coincidentes` 2 y `porcentaje` `66.7`, y lista una diferencia mayor

#### Scenario: El GET no usa el fichero
- GIVEN una exportación subida antes por la ruta de comparación
- WHEN un administrador llama al `GET`
- THEN el `GET` no la conoce: sus pares salen sólo de los datos sincronizados

### Requirement: RQ-KP-18 · Lo que el módulo no hace

El `GET /api/indicadores` y el cálculo de los indicadores **MUST NOT** escribir en la base (sin tabla de
fotos, sin escritor, sin migración propia del cálculo). La **única escritura admitida** en la capacidad es
la de la carga de respuestas de la encuesta de RQ-KP-21, **sólo** sobre la tabla
`public.encuesta_respuestas` de RQ-KP-19; esta excepción no autoriza ningún otro escritor, ninguna
escritura desde el `GET` ni desde el cálculo, ni ninguna escritura sobre otra tabla. La carga de la
exportación (RQ-KP-26) **no** es una escritura: no crea tabla, no migra y no guarda nada. El sistema **MUST
NOT** además: escribir contra Zoho; enviar correo o la encuesta; mostrar tablero, semáforo ni umbral (letra:
`R08.4.md:2956`, `R08.4.md:2959`, `R08.4.md:6316`); corregir la reentrancia (`R08.4.md:2961`) ni IV-11 o
IV-12; tocar `computeAnalisis` (`packages/shared/src/analisis.ts:17-95`). El cliente **MUST** limitarse a un
enlace de descarga visible para administradores y, **sólo** para la comparación con la exportación, a un
selector de fichero que lo sube y pinta lo que el servidor devuelve (RQ-KP-28); la imposición de ese permiso
es la de RQ-KP-12. La capacidad **MUST NOT** añadir ninguna otra pantalla de carga en el cliente.

#### Scenario: Una petición no deja rastro
- GIVEN un administrador que llama a la ruta con o sin `formato=csv`
- WHEN termina la petición
- THEN todas las sentencias ejecutadas fueron de lectura y no hubo llamada de red a Zoho

#### Scenario: Sin elementos de tablero
- GIVEN la respuesta JSON y el CSV
- WHEN se inspeccionan
- THEN no traen color, semáforo, meta ni bandera de aprobación

#### Scenario: La carga no abre la puerta a otras escrituras
- GIVEN una carga válida de respuestas por RQ-KP-21
- WHEN termina la petición
- THEN las únicas sentencias de escritura se ejecutaron sobre `public.encuesta_respuestas` y ninguna sobre `tickets`, `ticket_transitions` ni otra tabla

#### Scenario: La carga de la exportación no es una excepción de escritura
- GIVEN una carga válida de la exportación por la ruta de comparación
- WHEN termina la petición
- THEN no se ejecutó ninguna sentencia de escritura sobre ninguna tabla y no se creó ningún fichero

## ADDED Requirements

### Requirement: RQ-KP-23 · Lector de la exportación

El sistema **SHALL** tener un lector de la exportación, **puro** (recibe el texto, no conoce la base ni el
disco). **SHALL** aceptar CSV con separador coma, comillas, comillas dobladas, saltos de línea dentro de un
campo entrecomillado, BOM UTF-8 y fin de línea CRLF (S-I). Las cabeceras **SHALL** reconocerse por nombre
normalizado (tildes, mayúsculas y espacios, como `valorDeZoho` en `packages/shared/src/indicadores.ts:109`):
«Cumplimiento del tiempo  promesa», con dos espacios en el fichero, **MUST** casar.

El lector **SHALL** exigir **doce** columnas (S-K): «ID», «ID de la solicitud» y las diez de indicadores
(«Tiempo permanecía», «Tiempo de diagnóstico», «Tiempo de servicio», «Tiempo total servicio», «Tiempo
recogida del equipo», «Cumplimiento del tiempo  promesa», «Calificación de satisfacción», «Tiempo de
cotización», «Tiempo de orden de compra», «Tiempo de orden de Venta»). Si falta **alguna**, el lector
**SHALL** fallar con un mensaje que **nombra cada columna que falta**. **MUST NOT** devolver «sin valor de
Zoho» en silencio por un fichero de otro formato. Un fichero sin filas de datos o ilegible como CSV
**SHALL** fallar con mensaje propio.

Por cada fila el lector **SHALL** devolver sólo la clave, el número de solicitud y las diez celdas de
indicadores (RQ-KP-27). Una fila con problema **SHALL** ir a *rechazadas* con su número de fila y su motivo y
no impide leer las demás. Una celda de indicador no vacía que `valorDeZoho` no acepta (un decimal, un texto) se
cuenta y se lista por columna como «valor ilegible» (S-P); no se rechaza la fila.

#### Scenario: Fichero con la cabecera completa
- GIVEN un fichero con las 59 columnas de la muestra, BOM, CRLF y un campo entrecomillado con coma y otro con salto de línea
- WHEN se lee
- THEN se devuelven las filas con clave, número y diez celdas, y ninguna fila rechazada por el formato

#### Scenario: Falta una columna (mutación sobre el fichero vigilado)
- GIVEN el fixture sin la columna «Tiempo de servicio»
- WHEN se lee
- THEN falla y el mensaje nombra «Tiempo de servicio»; no hay resultado parcial ni «sin valor de Zoho»

#### Scenario: Faltan dos columnas
- GIVEN el fixture sin «Tiempo de servicio» ni «ID de la solicitud»
- WHEN se lee
- THEN el mensaje nombra las dos

#### Scenario: Columna renombrada
- GIVEN el fixture con «Tiempo de servicio» escrita «Tiempo del servicio»
- WHEN se lee
- THEN falla nombrando «Tiempo de servicio»; no se adivina por parecido

#### Scenario: Dos espacios en la cabecera de la promesa
- GIVEN la cabecera «Cumplimiento del tiempo  promesa» con dos espacios y celdas «Cumple» y «No Cumple»
- WHEN se lee
- THEN la columna se reconoce y los valores llegan a `valorDeZoho` tal cual

#### Scenario: Valor no numérico en una columna de tiempo (mutación sobre el fichero vigilado)
- GIVEN una fila con «abc» en «Tiempo de diagnóstico» y otra con «2.5»
- WHEN se lee
- THEN ambas filas se conservan, cada una cuenta un «valor ilegible» de esa columna con fila y columna en el listado, y el listado no repite «abc» ni «2.5»

#### Scenario: Celdas con comas y saltos de línea
- GIVEN un campo entrecomillado con una coma y otro con un salto de línea, en columnas que no se leen
- WHEN se lee
- THEN el número de filas leídas es el de registros, no el de líneas físicas

### Requirement: RQ-KP-24 · Clave de cruce

El cruce **SHALL** hacerse por «ID» ↔ `desk.tickets.id` (`id text PRIMARY KEY`; el sincronizador mapea
`id: raw.id` en `packages/zoho-sync/src/db/mappers.ts:46`). El cruce **MUST NOT** hacerse por número de
solicitud ni aproximando. Una clave **vacía** o que **no sea sólo dígitos** (por ejemplo, notación científica
de una hoja de cálculo) **SHALL** dar una fila rechazada con motivo que nombra fila y columna «ID». Un «ID»
repetido: vale la primera fila y las siguientes se rechazan con motivo (S-M).

«ID de la solicitud» es **exigida**. Sirve para nombrar al ticket en los listados y para contrastar con
`tickets.number`. Si el `id` cruza y el número no coincide, la ruta **SHALL** contar y listar la discrepancia
(clave, número del fichero, número de Desk), y el par **SHALL** compararse igual: la clave es el `id`. Que
«ID de la solicitud» sea `ticketNumber` es hipótesis apoyada en los valores de la muestra, no en código.

#### Scenario: Cruce por ID
- GIVEN un ticket de Desk con `id` de 18 dígitos y una fila del fichero con ese «ID»
- WHEN se cruza
- THEN la fila se compara con ese ticket

#### Scenario: Mismo número, otro ID
- GIVEN una fila cuyo «ID de la solicitud» es el `number` de un ticket de Desk pero cuyo «ID» no es el `id` de ninguno
- WHEN se cruza
- THEN no se cruza con ese ticket; la fila va a «sólo en el fichero»

#### Scenario: Clave vacía (mutación sobre el fichero vigilado)
- GIVEN una fila con «ID» vacío
- WHEN se lee
- THEN se rechaza con motivo que nombra su número de fila y la columna «ID», y las demás filas se comparan

#### Scenario: Clave en notación científica
- GIVEN una fila con «ID» «1.23457E+17»
- WHEN se lee
- THEN se rechaza con motivo que dice que la clave no es sólo dígitos; no se cruza aproximando

#### Scenario: ID repetido
- GIVEN dos filas con el mismo «ID» válido
- WHEN se lee
- THEN la primera entra y la segunda se rechaza con motivo; el motivo no cita ninguna celda

#### Scenario: Número distinto
- GIVEN una fila cuyo «ID» cruza y cuyo «ID de la solicitud» difiere de `tickets.number`
- WHEN se compara
- THEN la discrepancia se cuenta y se lista, y el par se compara con los valores de esa fila

### Requirement: RQ-KP-25 · Tickets que no cruzan, en los dos sentidos

La respuesta **SHALL** contar y listar los tickets que no cruzan en **los dos sentidos**: (a) filas válidas del
fichero cuyo «ID» no existe en Desk, y (b) tickets de Desk del periodo cuyo `id` no está en el fichero. Un
ticket del fichero que sí existe en Desk pero **fuera** del periodo pedido **SHALL** contarse y listarse
**aparte** de (a) (S-N); **MUST NOT** decirse de él que «no está en Desk». Los listados **SHALL** salir
completos (S-Q) e identificar cada ticket por «ID» y número de solicitud, sin otro dato del fichero. Las dos
listas y los recuentos **SHALL** estar siempre presentes, vacíos si es el caso.

Los tickets del periodo ausentes del fichero **MUST NOT** completarse con los datos sincronizados (S-L).

#### Scenario: Sólo en el fichero
- GIVEN una fila válida cuyo «ID» no existe en `desk.tickets`
- WHEN se compara
- THEN se cuenta y se lista en «sólo en el fichero», y no entra en la comparación

#### Scenario: Sólo en Desk
- GIVEN un ticket del periodo en Desk cuyo `id` no figura en el fichero
- WHEN se compara
- THEN se cuenta y se lista en «sólo en Desk», y sus pares no se completan con datos sincronizados

#### Scenario: Existe en Desk fuera del periodo
- GIVEN una fila válida cuyo «ID» existe en Desk con día de creación fuera de `desde`/`hasta`
- WHEN se compara
- THEN se cuenta y se lista como «en Desk fuera del periodo», no como «sólo en el fichero»

#### Scenario: Los dos sentidos a la vez
- GIVEN una fila ajena a Desk y un ticket del periodo ausente del fichero
- WHEN se compara
- THEN las dos listas traen un elemento cada una y ninguna se funde con la otra

### Requirement: RQ-KP-26 · Ruta de comparación con la exportación

La ruta de comparación **SHALL** ser un `POST` multipart, **sólo para administradores**, distinta del `GET
/api/indicadores`. Recibe el periodo por los parámetros `desde` y `hasta` y el fichero. La escalera **SHALL**
ser, en este orden: sesión `401` < administrador `403` < `400` (periodo inválido por `validarPeriodo`,
`apps/desk/server/indicadores.ts:26`; luego, falta de fichero, fichero ilegible o cabecera incompleta de
RQ-KP-23). Multer en memoria **SHALL** ir **detrás** de las guardas de sesión y de administrador (molde
`apps/desk/server/routes/encuestaRespuestas.ts:19`), con el límite común `LIMITE_SUBIDA_BYTES`
(`apps/desk/server/util/subida.ts:6`, 10 MB); pasado el límite, el manejador central **SHALL** responder `413`
nombrando el límite (`apps/desk/server/app.ts:86`). En los `401`, `403` y `400` **no se ejecuta ninguna
consulta** de tickets y la cabecera se valida **antes** de leer tickets.

Los valores de Zoho de cada par **SHALL** salir de la fila del fichero por `valorDeZoho`
(`packages/shared/src/indicadores.ts:109`) y la comparación **SHALL** armarla `compararIndicadores`
(`packages/shared/src/indicadoresComparacion.ts:90`), con la tolerancia de un día y **sin veredicto** (RQ-KP-16).
**MUST NOT** existir una segunda implementación de la comparación. Los pares de la aplicación **SHALL** salir de
la misma ruta de cálculo que el `GET` (`leerEntradasIndicadores`, `tablaIndicadores`), sin cambiar el 55, el 47
ni las fórmulas ni el orden de los otros ocho.

La respuesta **SHALL** traer: el periodo; el recuento del fichero (filas leídas y rechazadas, cada una con
número de fila y motivo); el cruce (cruzados, sólo en el fichero, en Desk fuera del periodo, sólo en Desk, número
distinto, valores ilegibles); y `comparacion` con la forma del `GET`. **Toda** sentencia de la ruta **SHALL** ser
un `SELECT`: sin tabla, sin migración, sin variable de entorno, sin escritura ni fichero en disco (S-J).
Una fila mala **MUST NOT** dar `400`: va a rechazadas y las demás se comparan.

#### Scenario: Sin sesión
- GIVEN una petición sin sesión, con fichero y periodo válidos
- WHEN llega
- THEN `401` y no se ejecuta ninguna consulta de tickets ni se procesa el fichero

#### Scenario: Usuario sin rol de administrador
- GIVEN un usuario con sesión sin rol de administrador
- WHEN envía un fichero
- THEN `403`, no se ejecuta ninguna consulta de tickets y multer no procesó el cuerpo

#### Scenario: Posición de las guardas (regla de mutación 1)
- GIVEN un fichero mayor que el límite enviado sin sesión y otro enviado por un usuario sin rol
- WHEN llegan
- THEN el primero da `401` y el segundo `403`, no `413`; mover multer delante de las guardas rompe la prueba

#### Scenario: Periodo inválido con fichero malo
- GIVEN `desde=2026-12-31`, `hasta=2026-12-01` y un fichero sin la columna «ID»
- WHEN llama un administrador
- THEN `400` por el periodo (S-O) y no se ejecuta ninguna consulta de tickets

#### Scenario: Sin fichero
- GIVEN un administrador con periodo válido y sin fichero
- WHEN llama
- THEN `400` con mensaje que dice que falta el fichero y sin consultas de tickets

#### Scenario: Cabecera incompleta antes de leer tickets
- GIVEN un administrador con periodo válido y un fichero sin dos columnas exigidas
- WHEN llama
- THEN `400` cuyo mensaje nombra las dos, y no se ejecuta ninguna consulta de tickets

#### Scenario: Fichero sobre el límite
- GIVEN un fichero de más de 10 MB
- WHEN lo sube un administrador
- THEN `413` y el mensaje dice el límite en MB del manejador central; fijado también por el valor de `LIMITE_SUBIDA_BYTES`

#### Scenario: Comparación con tolerancia y sin veredicto
- GIVEN un ticket cuyo 59 de la aplicación difiere en un día del de la fila, y otro que difiere en tres
- WHEN responde la ruta
- THEN el primero cuenta como coincidente, el segundo como diferencia mayor, y la respuesta no trae color, meta ni bandera

#### Scenario: Camino único del valor
- GIVEN una fila cuya «Cumplimiento del tiempo  promesa» es «Cumple»
- WHEN se arma el par del 54
- THEN el valor llegó por `valorDeZoho` y se comparó con `compararIndicadores`; no hay otra función que lea la celda ni que compare

#### Scenario: Todo es lectura
- GIVEN una carga válida con filas que cruzan, otras que no y otras rechazadas
- WHEN termina la petición
- THEN todas las sentencias fueron `SELECT`, no se escribió ningún fichero y no hubo llamada a Zoho

#### Scenario: Una fila mala no tumba la carga
- GIVEN un fichero válido con una fila de clave vacía
- WHEN llama un administrador
- THEN responde `200`, la fila va a rechazadas con su motivo y las demás se comparan

### Requirement: RQ-KP-27 · Privacidad de la exportación

La exportación lleva nombre y correo del contacto. El sistema **MUST NOT** guardar, registrar en logs ni
devolver ningún dato del fichero que no sea la clave, el número de solicitud y los valores de los indicadores.
Sólo se leen esas doce columnas; las demás no salen del lector. El motivo de una fila rechazada o de un
«valor ilegible» **SHALL** nombrar fila y columna y **MUST NOT** contener el contenido de la celda. Un error
inesperado **MUST NOT** volcar filas ni celdas al log ni a la respuesta.

#### Scenario: Datos de contacto centinela
- GIVEN un fixture con la cabecera real y, en las columnas de contacto, el nombre «Centinela Prueba» y el correo «centinela@ejemplo.invalid»
- WHEN un administrador sube el fichero y se recorre la respuesta JSON, los motivos y lo escrito en logs
- THEN ninguno de los dos valores aparece en ninguna parte

#### Scenario: Una fila rechazada no cita la celda
- GIVEN una fila con clave vacía y otra con un valor ilegible «xyz» en un indicador
- WHEN se leen
- THEN cada motivo trae número de fila y nombre de columna y no contiene «xyz» ni ninguna otra celda

#### Scenario: Una columna de contacto no sale aunque se pida
- GIVEN una respuesta de la ruta
- WHEN se inspeccionan sus claves
- THEN sólo hay claves, números de solicitud, motivos con fila y columna, y valores de indicadores

### Requirement: RQ-KP-28 · Cliente de la comparación

En «Análisis», junto al enlace de descarga, el cliente **SHALL** ofrecer a los administradores un selector de
fichero `.csv` y un botón «Comparar» que sube el fichero con `desde` y `hasta` tal como se escriben y pinta lo
que el servidor devuelve: recuentos, porcentajes y listados, **sin color, meta, semáforo ni veredicto**. El
cliente **MUST NOT** leer el fichero, cruzar ni calcular ningún porcentaje. Lo decidible (armar la petición,
decidir qué mostrar) **SHALL** vivir en `apps/desk/src/lib/*.ts` y probarse allí. Regla invariable 13: cada
decisión del cliente tiene su imposición en el servidor, y los espejos son comodidad:

- mostrar el control sólo a administradores: `403` de la ruta de comparación (RQ-KP-26);
- deshabilitar «Comparar» sin fichero: `400` de «falta el fichero» (RQ-KP-26);
- limitar el selector a `.csv`: `400` de cabecera que nombra las columnas (RQ-KP-23);
- avisar de fichero grande: `413` del manejador central (RQ-KP-26);
- enviar el periodo sin validarlo: `400` de `validarPeriodo` (RQ-KP-26).

#### Scenario: El cliente no valida lo que impone el servidor
- GIVEN un periodo mal escrito y un fichero cualquiera
- WHEN el cliente arma la petición
- THEN envía `desde` y `hasta` tal como se escribieron y lo rechaza el servidor con `400`

#### Scenario: El cliente pinta lo devuelto
- GIVEN una respuesta con porcentajes, listados y motivos
- WHEN la función de presentación la procesa
- THEN muestra los mismos números y listas, sin recalcular y sin color, meta ni veredicto

#### Scenario: Un error del servidor se muestra tal cual
- GIVEN un `400` cuyo mensaje nombra las columnas que faltan
- WHEN el cliente lo recibe
- THEN muestra ese mensaje y no lo sustituye por «sin valor de Zoho»
