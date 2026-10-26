# Delta para tickets-core — valor reclamado en USD, foto al abrir, origen al editar y moneda en cada importe (F1B-13, `cierra: no`)

Numeración comprobada contra `openspec/specs/tickets-core/spec.md`: el último requisito vivo es RQ-TC-77; los nuevos son
RQ-TC-78 a RQ-TC-80. Construye `decision/f1b13-valor-reclamado-usd` (Gerencia, 2026-10-26) con los supuestos S-1 a S-11 de
`proposal.md` y lo que cierra `design.md` (S-8: moneda constante `USD` en `shared`, sin columna ni migración). Marcas bajo
`strict_tdd`: **ROJO** nace rojo; **CARACTERIZACIÓN** fija lo que ya hay. La vista (RQ-TC-80, último escenario) es `.tsx` y
queda fuera de la red de pruebas por decisión de Gerencia (F0-00, `vitest.config.ts:16`, `:17-20`): sin rojo previo.

**Nota de fusión.** Tres bloques `## MODIFIED Requirements` (RQ-TC-45, RQ-TC-47 y RQ-TC-65) que sustituyen **enteros** a los
vivos de la misma cabecera. Cada uno es copia literal del vivo salvo las frases que la decisión vuelve falsas, reescritas
dentro de las mismas líneas: conservan **57, 62 y 80 líneas**, sus escenarios y su orden (en RQ-TC-45 se invierte el
escenario «no es automático»), de modo que la fusión no mueve ninguna línea de la spec viva. Lo nuevo va **al final**.

**Fuera de este delta**, por `cierra: no`: el envío físico de la pieza por remisión sin ticket (F1B-16); la carga en
ISO 14224 (otra fila); la conversión entre monedas, la reescritura de datos previos y el recálculo de la foto.

## MODIFIED Requirements

### RQ-TC-45 · Datos de la ficha y listas cerradas, en `public.garantia_proveedor`

La respuesta y su ficha **SHALL** vivir en una tabla `public.garantia_proveedor`, con **una fila por asociación
respondida** (SUPUESTO S-3), creada con el esquema **calificado** (`CREATE TABLE … public.garantia_proveedor`) al final de
`packages/zoho-sync/src/db/schema.sql` y listada en `PUBLIC_TABLES` de `packages/zoho-sync/src/db/migrate.ts`, de modo que
el guardián de tablas calificadas de `migrate.test.ts` la cuente (de 28 a 29 y de 41 a 42 en sus dos recuentos). La
tabla **MUST NOT** llevar `CHECK` de **listas**: las listas cerradas las impone el servidor desde `packages/shared`, como
`cargo_permiso`. Lo único que lleva es UN `CHECK` de coherencia sí/no entre columnas (`reclama` verdadero exige estado y
excluye motivo; falso exige motivo y excluye estado), que no es una lista. Respaldo si el motor de pruebas no lo acepta
(hipótesis H-1 del diseño): se quita y la guarda es el servidor. La tabla guarda:

- **Respuesta:** sí o no; motivo del «no»; quién y cuándo respondió (SUPUESTO S-2); `ticket_id` y número de la OVI,
  copiados (SUPUESTO S-8).
- **Ficha, sólo en un «sí»:** fabricante (texto; el panel propone la marca del ticket y es editable, SUPUESTO S-5);
  pieza: referencia y serial, texto libre (S-5); RMA, texto, vacío al abrir (S-5); valor reclamado, en USD, foto de la
  OVI al abrir con origen `ovi`, o `manual` sin foto o si lo corrige una persona (RQ-TC-78 a RQ-TC-80); estado;
  resultado y valor recuperado al resolver; fechas de apertura, envío y resolución, del reloj del servidor en cada paso
  (SUPUESTO S-7); y la marca del aviso de 60 días (SUPUESTO S-12; `derivacion-avisos` RQ-AV-19).

**Listas cerradas, definidas una sola vez en `packages/shared` y consumidas por el servidor y el cliente** (regla
invariable 13, sin segunda copia): los **tres** motivos del «no»; los **tres** estados (abierta, enviada al fabricante,
resuelta); los **tres** resultados (reposición, nota crédito, rechazada). La decisión de origen habla en una consecuencia
de «cuatro estados» y su respuesta textual enumera tres: se construyen tres. El nombre literal de cada valor lo fija el
diseño; el requisito exige que sean exactamente tres por lista y que el servidor rechace cualquier otro con `422`.

Esta tabla sostiene el valor reclamado automático y las mediciones: los datos quedan guardados, y el cálculo de la foto
y el de la medición viven en `packages/shared` (RQ-TC-65 y RQ-TC-78).

#### Scenario: la tabla está calificada y el guardián la cuenta — ROJO
- GIVEN `schema.sql` con la sentencia nueva y `PUBLIC_TABLES` con la tabla
- WHEN corre el guardián de `migrate.test.ts`
- THEN cuenta 29 tablas calificadas y 42 sentencias en sus dos recuentos, y la tabla está en `public`

#### Scenario: una sentencia sin calificar se rechaza (regla de mutación 2) — ROJO
- GIVEN el `.sql` vigilado con `CREATE TABLE garantia_proveedor` sin esquema añadido a propósito
- WHEN corre el guardián
- THEN se pone rojo

#### Scenario: las tres listas tienen exactamente tres valores — ROJO
- GIVEN las listas de `packages/shared`
- WHEN se cuentan los motivos, los estados y los resultados
- THEN cada lista tiene tres valores

#### Scenario: valor reclamado manual con su origen — ROJO
- GIVEN una ficha abierta sin foto de la OVI, a la que una persona escribe el valor reclamado 1500 al editarla
- WHEN se lee
- THEN el valor es 1500 y su origen es `manual`

#### Scenario: el valor reclamado es la foto de la OVI al abrir — ROJO
- GIVEN una OVI asociada por `salesorder_id` con orden de Books y costos de catálogo completos
- WHEN se abre la ficha con el «sí», sin teclear valor
- THEN el valor reclamado queda calculado de la orden, en USD, con origen `ovi` (RQ-TC-78)

#### Scenario: RMA vacío al abrir (S-5) — ROJO
- GIVEN un «sí» con fabricante y sin RMA
- WHEN se abre la ficha
- THEN el RMA queda vacío y la ficha se abre

### RQ-TC-47 · Editar los datos de la ficha, y la ficha resuelta no se edita

Los datos editables de una ficha (fabricante, referencia y serial de la pieza, RMA y valor reclamado) **SHALL** poder
corregirse mientras la ficha no esté resuelta. Una ficha **resuelta** **MUST NOT** editarse (SUPUESTO S-6): responde
`409`. El estado, la respuesta y las fechas **MUST NOT** cambiar por esta ruta, y el origen del valor reclamado cambia
sólo según RQ-TC-79: sólo avanza el estado la ruta de RQ-TC-46.

La ruta de editar **SHALL** juzgar en este orden:

| # | Guarda | HTTP | Escalón |
|---|---|---|---|
| G11 | La ficha no existe | `404` | A |
| G12 | Sin el cargo Director Técnico y sin ser administrador (RQ-PM-26) | `403` | B |
| G13 | La ficha está resuelta | `409` | B |
| G14 | Contenido: fabricante vacío tras recortar, o valor reclamado no numérico o negativo | `422` | C |

**Pares no observables:** G11 frente a G13–G14, porque sin ficha no hay estado ni contenido que juzgar.

#### Scenario: editar el RMA de una ficha enviada — ROJO
- GIVEN una ficha «enviada» y un Director Técnico
- WHEN edita el RMA y el valor reclamado
- THEN los datos cambian y el estado y las fechas siguen iguales

#### Scenario: fabricante vacío, o valor negativo o no numérico — ROJO
- GIVEN una ficha «abierta»
- WHEN se edita con fabricante `   `, con valor reclamado `-1` o con valor `abc`
- THEN en los tres casos responde `422` (G14) y la ficha no cambia

#### Scenario: ficha resuelta no se edita — ROJO
- GIVEN una ficha «resuelta»
- WHEN el Director Técnico intenta editarla con datos válidos
- THEN responde `409` (G13) y la ficha no cambia

#### Scenario: la ruta de editar no cambia el estado — ROJO
- GIVEN una ficha «abierta»
- WHEN se edita enviando además un campo de estado «resuelta»
- THEN el estado sigue «abierta»

#### Scenario: ficha inexistente — ROJO
- GIVEN un id de ficha inexistente
- WHEN un Director Técnico intenta editar
- THEN responde `404` (G11)

#### Scenario: sin cargo — ROJO
- GIVEN un usuario sin cargo que no es administrador y una ficha «abierta»
- WHEN intenta editarla
- THEN responde `403` (G12)

#### Scenario: posición G11 < G12, inexistente y sin cargo — CARACTERIZACIÓN
- GIVEN un usuario sin cargo y un id de ficha inexistente
- WHEN intenta editar
- THEN responde el `404` de G11, no el `403`

#### Scenario: posición G12 < G13, resuelta y sin cargo — CARACTERIZACIÓN
- GIVEN un usuario sin cargo y una ficha «resuelta»
- WHEN intenta editarla
- THEN responde el `403` de G12, no el `409` de G13

#### Scenario: posición G13 < G14, resuelta y contenido inválido — CARACTERIZACIÓN
- GIVEN un Director Técnico, una ficha «resuelta» y un cuerpo con fabricante vacío
- WHEN intenta editarla
- THEN responde el `409` de G13, no el `422` de G14

### Requirement: RQ-TC-65 · Medición por fabricante: lo reclamado frente a lo recuperado, calculada sólo en `shared`

El sistema **SHALL** calcular la medición por fabricante con **una única función pura** en `packages/shared`
(regla invariable 13, puntos 1 y 3). La agrupación, la normalización y las sumas **MUST** vivir sólo ahí: ni el servidor
ni el cliente las reescriben.

**Qué fichas entran.** Sólo las fichas con `reclama = true`. Una respuesta «no» **MUST NOT** entrar en ninguna cifra, ni
en ningún recuento.

**Agrupación (SUPUESTO S-1, reversible).** «Por marca» es por el `fabricante` de la ficha, **recortado de espacios y sin
distinguir mayúsculas**; no se pliegan acentos. Dos fichas cuyos fabricantes sólo difieren en mayúsculas o en espacios de
los extremos **SHALL** caer en el mismo grupo. La etiqueta que se muestra del grupo **SHALL** ser determinista (no
depender del orden de entrada de las fichas).

**Reclamado.** La suma de `valor_reclamado` de **TODAS** las fichas «sí» que lo traen, **en cualquier estado**: abiertas,
enviadas y resueltas.

**Recuperado.** La suma de `valor_recuperado` de las fichas en estado «resuelta».

**Casos que quedan escritos sin ambigüedad:**

- Las reclamaciones **rechazadas** cuentan como **reclamadas** (con su `valor_reclamado`) y con **0 recuperado**.
- Las fichas **abiertas** y **enviadas** cuentan como **reclamadas** y **NO** como recuperadas: no aportan nada a lo
  recuperado mientras no estén resueltas.
- Las fichas «sí» **sin `valor_reclamado`** **SHALL** contarse **aparte**, por fabricante, y **MUST NOT** sumar nada al
  reclamado (ni un 0 en silencio). Su `valor_recuperado`, si estuviera resuelta, sí suma a lo recuperado.

**Qué se da por fabricante, además de las dos sumas:** el número de fichas «sí»; cuántas siguen sin resolver (abiertas y
enviadas); el desglose de resultados de las resueltas; y el recuento de fichas sin valor reclamado.

**Cociente (SUPUESTO S-6, reversible).** El cociente recuperado/reclamado **SHALL** darse sólo cuando lo reclamado es
mayor que 0; si lo reclamado es 0, el cociente es «no disponible» y **MUST NOT** ser 0, ni infinito, ni `NaN`. Los
importes son USD (`decision/f1b13-valor-reclamado-usd`), sin conversión en el código, y cada grupo lleva su moneda (RQ-TC-80); no se fijan umbrales (S-5).

#### Scenario: lo reclamado suma todos los estados y lo recuperado sólo las resueltas — ROJO
- GIVEN cuatro fichas «sí» de «Acme»: abierta con reclamado 100, enviada con 200, resuelta con 300 y recuperado 250,
  y rechazada con 400 y recuperado 0
- WHEN se calcula la medición
- THEN «Acme» tiene reclamado 1000 y recuperado 250, con 4 fichas, 2 sin resolver (la abierta y la enviada) y el
  desglose de resultados de las resueltas

#### Scenario: la rechazada cuenta como reclamada con 0 recuperado — ROJO
- GIVEN una única ficha «sí» de «Acme», rechazada, con `valor_reclamado` 500 y `valor_recuperado` 0
- WHEN se calcula la medición
- THEN «Acme» tiene reclamado 500, recuperado 0 y cociente 0 (porque lo reclamado es mayor que 0)

#### Scenario: la abierta y la enviada cuentan como reclamadas y no como recuperadas — ROJO
- GIVEN dos fichas «sí» de «Acme», una abierta con 100 y una enviada con 200, y ninguna resuelta
- WHEN se calcula la medición
- THEN «Acme» tiene reclamado 300 y recuperado 0, con 2 sin resolver

#### Scenario: una ficha «no» no cuenta en nada — ROJO
- GIVEN una respuesta «no» sobre una OVI de «Acme» y ninguna ficha «sí»
- WHEN se calcula la medición con ese conjunto
- THEN «Acme» no aparece, y ningún total ni recuento la incluye

#### Scenario: una ficha «sí» sin valor reclamado se cuenta aparte y no suma — ROJO
- GIVEN dos fichas «sí» de «Acme»: una con reclamado 100 y otra sin `valor_reclamado`
- WHEN se calcula la medición
- THEN «Acme» tiene reclamado 100, 2 fichas y 1 ficha sin valor reclamado; el reclamado no suma 0 por la segunda

#### Scenario: el fabricante se agrupa recortado y sin distinguir mayúsculas — ROJO
- GIVEN una ficha «sí» de `Acme` y otra de `  ACME ` con reclamados 100 y 50
- WHEN se calcula la medición
- THEN hay un solo grupo con reclamado 150 y 2 fichas; la etiqueta mostrada no depende del orden de entrada

#### Scenario: los acentos no se pliegan (S-1) — ROJO
- GIVEN una ficha «sí» de `Müller` y otra de `Muller`
- WHEN se calcula la medición
- THEN son dos grupos distintos

#### Scenario: sin reclamado el cociente no está disponible (S-6) — ROJO
- GIVEN un fabricante cuyas fichas «sí» no traen `valor_reclamado`, o lo traen en 0
- WHEN se calcula la medición
- THEN su cociente es «no disponible», no 0, ni infinito, ni `NaN`

#### Scenario: sin fichas la medición es vacía — ROJO
- GIVEN ninguna ficha «sí»
- WHEN se calcula la medición
- THEN el resultado no tiene fabricantes ni fallas repetidas y no lanza error

## ADDED Requirements

### RQ-TC-78 · Foto del valor reclamado al abrir la ficha

Al responder «sí» (RQ-TC-44), el servidor **SHALL** guardar como **foto** el valor reclamado, calculado así: la orden se
busca por `ov_asociaciones.salesorder_id` (S-1) y el valor es la **suma, por cada línea de `raw->'line_items'`, de
`quantity` por `books.items.purchase_rate`** del artículo de la línea, en USD, **redondeada a 2 decimales una sola vez** al
final (S-6). Un artículo repetido en dos líneas cuenta dos veces. La foto se guarda con origen `ovi`.

**Todo o nada (S-4).** Cada uno de estos huecos, por separado, deja **sin foto**: asociación sin `salesorder_id`; sin fila en
`books.sales_orders`; sin `line_items`, o vacía; una línea sin `item_id` de texto no vacío; una cantidad que no sea un
número finito mayor que 0 (una cantidad en texto es hueco); un artículo ausente de `books.items`; un costo NULL, no
finito o menor o igual que 0. **MUST NOT** guardarse nunca una suma parcial. Sin foto el valor queda `null` y el origen
`manual` (S-3). Un costo que llega como texto (node-postgres) **SHALL** contar igual que uno numérico (D-8).

**Qué no cambia.** Un `valorReclamado` en el cuerpo del «sí», sea cual sea, **SHALL** ignorarse: ni se valida ni se guarda,
y no da `422` (S-2). G1 a G6 de RQ-TC-44, sus códigos y su orden **MUST** quedar intactos: la foto corre tras G6, no
rechaza nada y no tiene transacción propia (S-9). La foto **MUST NOT** recalcularse si el catálogo cambia después (S-11).
El cálculo vive en una **función pura de `packages/shared`**; el servidor sólo lee la orden y los costos, sin funciones
`jsonb` en SQL, y pasa lo leído a esa función (regla invariable 13, puntos 1 y 3).

#### Scenario: la foto suma cantidad por costo con dos decimales — ROJO
- GIVEN una orden con dos unidades de un artículo de costo 150,54 y una de otro de costo 10
- WHEN se responde «sí» sobre su OVI
- THEN el valor reclamado es 311,08 y el origen es `ovi`

#### Scenario: un artículo repetido cuenta dos veces — ROJO
- GIVEN una orden con dos líneas del mismo artículo, de cantidad 1 y de costo 20
- WHEN se calcula la foto
- THEN el valor reclamado es 40

#### Scenario: el redondeo es uno solo, al final — ROJO
- GIVEN tres líneas de cantidad 1 y costo 0,004
- WHEN se calcula la foto
- THEN el valor reclamado es 0,01, no 0

#### Scenario: un costo que llega como texto cuenta igual — ROJO
- GIVEN un costo `'150.54'` en texto y una cantidad 1
- WHEN se calcula la foto
- THEN el valor reclamado es 150,54 y el origen es `ovi`

#### Scenario: cada hueco deja la ficha sin foto — ROJO
- GIVEN, por separado: sin `salesorder_id`, sin fila de la orden, sin `line_items`, con `line_items` vacía, una línea sin
  `item_id`, una cantidad 0 o en texto, un artículo ausente, y un costo NULL o 0
- WHEN se responde «sí»
- THEN en los diez casos el valor reclamado es `null`, el origen es `manual` y la respuesta es `201`

#### Scenario: nunca una suma parcial — ROJO
- GIVEN una orden de dos líneas, la primera con costo 100 y la segunda con un artículo ausente del catálogo
- WHEN se responde «sí»
- THEN el valor reclamado es `null`, no 100

#### Scenario: el valor del cuerpo se ignora sin `422` — ROJO
- GIVEN un «sí» cuyo cuerpo trae `valorReclamado` en 999, en `-1`, en `'abc'` o en `Infinity`
- WHEN el Director Técnico responde
- THEN responde `201` y el valor guardado es el de la foto, o `null` si no hay foto

#### Scenario: editar sigue validando el valor — CARACTERIZACIÓN
- GIVEN una ficha «abierta»
- WHEN se edita con valor reclamado `-1`
- THEN responde `422` (G14); la ignorancia del cuerpo es sólo del «sí»

#### Scenario: las guardas G1 a G6 siguen en su orden — CARACTERIZACIÓN
- GIVEN las pruebas de posición de RQ-TC-44, sin tocar
- WHEN corre la suite
- THEN siguen verdes: la foto no es guarda y no cambia ninguna respuesta de rechazo

#### Scenario: la foto no se recalcula — ROJO
- GIVEN una ficha abierta con foto 311,08 y un costo de catálogo que cambia después
- WHEN se lee la ficha
- THEN el valor reclamado sigue siendo 311,08

### RQ-TC-79 · Origen del valor reclamado al editar

Al editar una ficha (RQ-TC-47), el origen del valor reclamado **SHALL** decidirse con una **función pura de
`packages/shared`**, que compara el valor anterior y el nuevo **por número** (S-5): NULL→NULL y X→X **conservan** el origen
anterior; X→NULL, NULL→X y X→Y lo pasan a `manual`. El servidor **MUST** escribir el origen que esa función devuelve; el
cliente manda el valor tal cual y no decide el origen. G11 a G14 **MUST** quedar intactas.

#### Scenario: guardar el mismo valor conserva el origen — ROJO
- GIVEN una ficha con valor 311,08 y origen `ovi`
- WHEN se edita sólo el RMA, enviando el mismo valor 311,08
- THEN el origen sigue `ovi`

#### Scenario: sin valor antes y después conserva el origen — ROJO
- GIVEN una ficha con valor `null` y origen `manual`
- WHEN se edita sin valor
- THEN el origen sigue `manual`

#### Scenario: corregir el valor pasa el origen a manual — ROJO
- GIVEN una ficha con valor 311,08 y origen `ovi`
- WHEN se edita con valor 300
- THEN el valor es 300 y el origen es `manual`

#### Scenario: escribir un valor donde no había pasa a manual — ROJO
- GIVEN una ficha sin valor reclamado
- WHEN se edita con valor 50
- THEN el valor es 50 y el origen es `manual`

#### Scenario: borrar el valor pasa el origen a manual — ROJO
- GIVEN una ficha con valor 311,08 y origen `ovi`
- WHEN se edita con valor vacío
- THEN el valor es `null` y el origen es `manual`

### RQ-TC-80 · Todo importe de la ficha y de la medición lleva su moneda

Toda ficha que devuelva la API (lectura por ticket, «sí», «no», editar y avanzar) **SHALL** llevar `moneda` con el valor
`'USD'`, constante definida una sola vez en `packages/shared`; la moneda cubre el valor reclamado y el valor recuperado,
y el recuperado se anota en esa moneda. Las fichas **previas** **SHALL** salir con `moneda: 'USD'` y su valor y su origen
intactos: **MUST NOT** reescribirse ningún dato ni añadirse columna. Cada grupo de la medición por fabricante (RQ-TC-65)
**SHALL** llevar `moneda: 'USD'`, puesta por la función de `shared`, y la ruta de RQ-TC-67 sigue devolviendo lo de `shared`
con un solo cambio. El cociente es un cociente, no un importe: **MUST NOT** llevar moneda. La conversión desde otra
moneda es manual: **MUST NOT** existir código de conversión. La pantalla **SHALL** pintar la moneda que llega junto a cada
importe y en los campos de captura, y el origen junto al valor reclamado; **MUST NOT** contener el literal `USD` en ningún
`.tsx`. El formulario del «sí» **MUST NOT** pedir valor.

**Casilla de regla invariable 13** (regla de mutación 3): para cada decisión del cliente, su regla en `shared` y la
imposición en el servidor; las líneas las escribe el cierre del lote.

| # | Decisión del cliente | `shared` | La impone el servidor |
|---|---|---|---|
| C-1 | No ofrecer el valor en el «sí» | `validarRespuesta` | la ruta de responder, que pasa la foto de `fotoDeLaOVI` a `registrarRespuesta` |
| C-2 | Moneda junto a cada importe y en la captura | `MONEDA_GARANTIA_PROVEEDOR` | `aGarantia` y `medirGarantias` |
| C-3 | Pintar el origen | `etiquetaOrigenValor` | el origen que guardan `registrarRespuesta` y `editarFicha` |
| C-4 | Mandar el valor editado tal cual | `origenTrasEditar` | la ruta de editar |

#### Scenario: las cuatro respuestas de la ficha llevan moneda — ROJO
- GIVEN una ficha abierta
- WHEN se pide la lectura del ticket, el «sí», el «no», editar y avanzar
- THEN cada ficha devuelta trae `moneda: 'USD'`

#### Scenario: una ficha previa sale en USD con su valor y origen intactos — ROJO
- GIVEN una ficha anotada antes del cambio, con valor 1500, origen `manual` y moneda sin columna
- WHEN se lee
- THEN trae `moneda: 'USD'`, valor 1500 y origen `manual`, y ningún dato se reescribe

#### Scenario: cada grupo de la medición lleva su moneda — ROJO
- GIVEN fichas «sí» de dos fabricantes
- WHEN se calcula la medición y se pide por la ruta
- THEN cada grupo trae `moneda: 'USD'` y la ruta devuelve exactamente lo de `shared`

#### Scenario: el cociente no lleva moneda — ROJO
- GIVEN un fabricante con reclamado 100 y recuperado 50
- WHEN se calcula la medición
- THEN su cociente es 0,5 y no lleva moneda

#### Scenario: la medición no cambia en nada más — CARACTERIZACIÓN
- GIVEN los mismos datos que antes del cambio
- WHEN se calcula la medición
- THEN las sumas, los recuentos y el orden son los de antes; sólo se añade `moneda`

#### Scenario: la pantalla pinta moneda y origen tal como llegan — fuera de la red de pruebas (F0-00)
- GIVEN una ficha con `moneda`, valor y origen `ovi`, y un grupo de la medición con `moneda`
- WHEN se pinta el panel y la vista
- THEN cada importe lleva su moneda al lado, el origen se ve junto al reclamado, el «sí» no pide valor, y
  `grep -rn "USD" apps/desk/src` da 0
