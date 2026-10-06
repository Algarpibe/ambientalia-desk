# Delta para tickets-core — ficha de garantía con el proveedor sobre la asociación OVI (F1B-13, `cierra: no`)

Numeración comprobada contra `openspec/specs/tickets-core/spec.md`: el último requisito vivo es RQ-TC-43; los nuevos son
RQ-TC-44 a RQ-TC-49. El delta **no modifica** ningún requisito vivo: todo es añadido. Supuestos S-1…S-12: los de
`proposal.md` §6, todos reversibles, aceptados. Marcas bajo `strict_tdd`: **ROJO** nace rojo; **CARACTERIZACIÓN** nace
verde y la posición se prueba moviendo la guarda (regla de mutación 1). **Fuera de este delta**, por `cierra: no`: el
valor reclamado tomado automáticamente de la OVI, las dos mediciones y el envío físico por remisión; no se especifican.

Orden total de precedencia: A existencia < B estado y permiso < C contenido < D unicidad.

## ADDED Requirements

### RQ-TC-44 · Responder «¿Se reclama al fabricante?» sobre una asociación OVI vigente

Cada asociación de `public.ov_asociaciones` (`tickets-core` RQ-TC-19) cuya orden es OVI **SHALL** poder recibir **una**
respuesta a «¿Se reclama al fabricante?», como acto propio sobre `ov_asociaciones.id` y no como campo de las cuatro
puertas de entrada de una orden (SUPUESTO S-1, reversible). La respuesta es «sí» o «no». Un «sí» **SHALL** abrir una
ficha en estado «abierta» (RQ-TC-45) con el fabricante dado; un «no» **SHALL** guardar uno de los tres motivos de la
lista cerrada de RQ-TC-45 y no abre ficha. Se guardan quién respondió y cuándo (la sesión y el reloj del servidor,
SUPUESTO S-2), el `ticket_id` de la asociación y el número de la OVI, copiado y congelado (SUPUESTO S-8). Una segunda
respuesta **MUST NOT** cambiar la primera (SUPUESTO S-10): da `409`. Mientras una asociación OVI vigente no tiene
respuesta, está «pendiente de respuesta» (RQ-TC-48).

La ruta **SHALL** juzgar en este orden, donde cada línea gana a las siguientes:

| # | Guarda | HTTP | Escalón |
|---|---|---|---|
| G1 | La asociación no existe | `404` | A |
| G2 | Sin el cargo Director Técnico y sin ser administrador (RQ-PM-26) | `403` | B |
| G3 | La asociación está liberada | `409` | B |
| G4 | La orden de la asociación no es OVI (`esOVI` de `shared`, la misma noción de RQ-PM-24; no se escribe por segunda vez) | `422` | C |
| G5 | Respuesta ausente, motivo fuera de la lista cerrada, o fabricante vacío tras recortar en un «sí» | `422` | C |
| G6 | La asociación ya tiene respuesta | `409` | D |

G4 es C y no A porque la asociación existe y quien actúa tiene permiso: lo que no vale es la clase de su número, la misma
razón por la que la cuarentena es C. G6 es D porque pregunta por otra fila; la respalda un índice único por
`asociacion_id` (SUPUESTO S-3, una ficha por asociación) y la carrera entre dos respuestas simultáneas **SHALL**
traducirse del error de unicidad (`23505`) a `409`, y no a `500`. Como en la liberación
(`apps/desk/server/routes/ovAsociaciones.ts:44-48`), el `404` va delante y el permiso antes del estado.

**Pares no observables, dichos para que nadie los dé por probados:** G1 frente a G3–G6 (sin fila no hay nada más que
juzgar). G3 frente a G6 comparten código `409`: liberada y ya respondida da el `409` de «liberada» y se distingue sólo por
el texto, así que se prueba por el texto. G4 frente a G6: una orden que no es OVI nunca llega a tener respuesta.

#### Scenario: «sí» sobre una OVI vigente abre la ficha — ROJO
- GIVEN un Director Técnico y una asociación vigente de `OVI-2026-001` sin respuesta
- WHEN responde «sí» con fabricante «Acme»
- THEN responde éxito, la ficha queda en «abierta» con la OVI, el `ticket_id` y quién y cuándo respondió

#### Scenario: «no» guarda uno de los tres motivos — ROJO
- GIVEN un Director Técnico y una asociación OVI vigente sin respuesta
- WHEN responde «no» con uno de los tres motivos de la lista cerrada
- THEN se guarda la respuesta con el motivo, no se abre ficha y la OVI deja de estar «pendiente de respuesta»

#### Scenario: «no» sin motivo, o con un motivo fuera de la lista — ROJO
- GIVEN un Director Técnico y una asociación OVI vigente sin respuesta
- WHEN responde «no» sin motivo, o con un texto que no es de la lista
- THEN responde `422` (G5) y no se escribe nada

#### Scenario: «sí» sin fabricante, o con fabricante de sólo espacios — ROJO
- GIVEN un Director Técnico y una asociación OVI vigente sin respuesta
- WHEN responde «sí» con fabricante vacío o `   `
- THEN responde `422` (G5) y no se abre ficha

#### Scenario: segunda respuesta rechazada (S-10) — ROJO
- GIVEN una asociación ya respondida «no»
- WHEN el Director Técnico responde «sí»
- THEN responde `409` (G6), y la respuesta guardada sigue siendo la primera

#### Scenario: carrera de dos respuestas — ROJO
- GIVEN dos respuestas simultáneas sobre la misma asociación, y el índice único rechaza la segunda con `23505`
- WHEN se procesan
- THEN una tiene éxito y la otra responde `409`, nunca `500`

#### Scenario: la asociación no es OVI — ROJO
- GIVEN un Director Técnico y una asociación vigente de `OV-2026-001`
- WHEN responde la pregunta
- THEN responde `422` (G4) y no se escribe nada

#### Scenario: la asociación no existe, o el id no es numérico — ROJO
- GIVEN un Director Técnico
- WHEN responde sobre un id inexistente, y sobre `abc`
- THEN en los dos casos responde `404` (G1)

#### Scenario: la asociación está liberada — ROJO
- GIVEN un Director Técnico y una asociación OVI liberada, sin respuesta
- WHEN responde la pregunta
- THEN responde `409` (G3) y no se escribe nada

#### Scenario: sin cargo — ROJO
- GIVEN un usuario sin cargo Director Técnico que no es administrador
- WHEN responde la pregunta sobre una asociación OVI vigente
- THEN responde `403` (G2) y no se escribe nada

#### Scenario: posición G1 < G2, inexistente y sin cargo — CARACTERIZACIÓN
- GIVEN un usuario sin cargo y un id de asociación inexistente
- WHEN responde la pregunta
- THEN responde el `404` de G1, no el `403`

#### Scenario: posición G2 < G3, liberada y sin cargo — CARACTERIZACIÓN
- GIVEN un usuario sin cargo y una asociación OVI liberada
- WHEN responde la pregunta
- THEN responde el `403` de G2, no el `409` de G3

#### Scenario: posición G2 < G6, ya respondida y sin cargo — CARACTERIZACIÓN
- GIVEN un usuario sin cargo y una asociación OVI ya respondida
- WHEN responde la pregunta
- THEN responde el `403` de G2, no el `409` de G6

#### Scenario: posición G3 < G4, liberada y que no es OVI — CARACTERIZACIÓN
- GIVEN un Director Técnico y una asociación liberada de `OV-2026-001`
- WHEN responde la pregunta
- THEN responde el `409` de «liberada» (G3), no el `422` de «no es OVI»

#### Scenario: posición G3 < G5, liberada y cuerpo inválido — CARACTERIZACIÓN
- GIVEN un Director Técnico, una asociación OVI liberada y un cuerpo sin respuesta
- WHEN responde la pregunta
- THEN responde el `409` de G3, no el `422` de G5

#### Scenario: posición G4 < G5, no es OVI y cuerpo inválido — CARACTERIZACIÓN
- GIVEN un Director Técnico, una asociación vigente de `OV-2026-001` y un cuerpo con motivo fuera de la lista
- WHEN responde la pregunta
- THEN responde el `422` de «no es OVI» (G4), no el de contenido (G5)

#### Scenario: posición G5 < G6, ya respondida y cuerpo inválido — CARACTERIZACIÓN
- GIVEN un Director Técnico, una asociación OVI ya respondida y un cuerpo con motivo fuera de la lista
- WHEN responde la pregunta
- THEN responde el `422` de G5, no el `409` de G6

#### Scenario: liberada y ya respondida, distinguibles por el texto — CARACTERIZACIÓN
- GIVEN una asociación OVI respondida y después liberada
- WHEN el Director Técnico responde otra vez
- THEN responde `409` con el texto de «liberada», no con el de «ya respondida»

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
  pieza: referencia y serial, texto libre (S-5); RMA, texto, vacío al abrir (S-5); valor reclamado, captura manual en
  pesos, con su origen constante `manual` (SUPUESTO S-4); estado; resultado y valor recuperado al resolver; fechas de
  apertura, envío y resolución, del reloj del servidor en cada paso (SUPUESTO S-7); y la marca del aviso de 60 días
  (SUPUESTO S-12; `derivacion-avisos` RQ-AV-19).

**Listas cerradas, definidas una sola vez en `packages/shared` y consumidas por el servidor y el cliente** (regla
invariable 13, sin segunda copia): los **tres** motivos del «no»; los **tres** estados (abierta, enviada al fabricante,
resuelta); los **tres** resultados (reposición, nota crédito, rechazada). La decisión de origen habla en una consecuencia
de «cuatro estados» y su respuesta textual enumera tres: se construyen tres. El nombre literal de cada valor lo fija el
diseño; el requisito exige que sean exactamente tres por lista y que el servidor rechace cualquier otro con `422`.

Esta tabla es la que ya anticipa que el valor reclamado automático y las mediciones se construirán después: los datos
que harán falta quedan guardados, y el cálculo no se construye aquí.

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
- GIVEN una ficha abierta con valor reclamado 1500000 tecleado
- WHEN se lee
- THEN el valor es 1500000 y su origen es `manual`

#### Scenario: el valor reclamado no es automático — CARACTERIZACIÓN
- GIVEN una OVI asociada con orden de Books que pudiera traer costo
- WHEN se abre la ficha sin teclear valor
- THEN el valor reclamado queda vacío, no se calcula de la orden

#### Scenario: RMA vacío al abrir (S-5) — ROJO
- GIVEN un «sí» con fabricante y sin RMA
- WHEN se abre la ficha
- THEN el RMA queda vacío y la ficha se abre

### RQ-TC-46 · La ficha avanza sólo hacia delante y cada paso exige lo suyo

El estado de la ficha **SHALL** avanzar sólo en el orden abierta → enviada al fabricante → resuelta, sin retrocesos
(SUPUESTO S-6); `siguienteEstado`, de `packages/shared`, es el único que dice cuál es el paso siguiente de un estado. Qué
exige cada paso (SUPUESTO S-6): **enviar** no exige nada más (la fuente no pide RMA); **resolver** exige un resultado de
la lista cerrada y un valor recuperado: en «reposición» y «nota crédito» es obligatorio, numérico y no negativo; en
«rechazada» se acepta ausente o `0` y se guarda `0`, y cualquier otro valor da `422` (SUPUESTO S-6, reversible: exigir el
`0` explícito). Cada paso guarda la fecha del reloj del servidor (SUPUESTO S-7). Una ficha resuelta no avanza más.

La ruta de avanzar **SHALL** juzgar en este orden:

| # | Guarda | HTTP | Escalón |
|---|---|---|---|
| G7 | La ficha no existe (una respuesta «no» no es ficha) | `404` | A |
| G8 | Sin el cargo Director Técnico y sin ser administrador (RQ-PM-26) | `403` | B |
| G9 | El paso no aplica desde el estado actual (salto, retroceso o ficha ya resuelta) | `409` | B |
| G10 | Contenido del paso: resultado fuera de la lista; en «reposición» y «nota crédito», valor recuperado ausente, no numérico o negativo; en «rechazada», valor recuperado distinto de `0` (ausente se acepta y se guarda `0`) | `422` | C |

**Pares no observables:** G7 frente a G9–G10, porque sin ficha no hay estado ni contenido que juzgar.

#### Scenario: abierta → enviada sin más datos — ROJO
- GIVEN una ficha «abierta» y un Director Técnico
- WHEN la avanza a «enviada» sin RMA ni otro dato
- THEN pasa a «enviada» y guarda la fecha de envío

#### Scenario: enviada → resuelta con resultado y valor — ROJO
- GIVEN una ficha «enviada»
- WHEN se resuelve con «reposición» y valor recuperado 800000
- THEN pasa a «resuelta» y guarda resultado, valor y fecha de resolución

#### Scenario: «rechazada» resuelve con valor recuperado 0 — ROJO
- GIVEN una ficha «enviada»
- WHEN se resuelve con «rechazada» y valor recuperado `0`
- THEN pasa a «resuelta»; y con valor recuperado distinto de `0` responde `422` (G10)

#### Scenario: «rechazada» sin valor recuperado se guarda como 0 (S-6) — ROJO
- GIVEN una ficha «enviada»
- WHEN se resuelve con «rechazada» sin valor recuperado
- THEN pasa a «resuelta» y el valor recuperado guardado es `0`

#### Scenario: resolver sin resultado o sin valor recuperado — ROJO
- GIVEN una ficha «enviada»
- WHEN se resuelve sin resultado, con resultado fuera de la lista, o con «reposición» o «nota crédito» sin valor recuperado, no numérico o negativo
- THEN responde `422` (G10) y la ficha sigue «enviada»

#### Scenario: saltar, retroceder o avanzar una ficha resuelta — ROJO
- GIVEN una ficha «abierta», y otra «enviada», y otra «resuelta»
- WHEN se intenta resolver la primera, volver a «abierta» la segunda y avanzar la tercera
- THEN en los tres casos responde `409` (G9) y el estado no cambia

#### Scenario: ficha inexistente, o una respuesta «no» — ROJO
- GIVEN un id de ficha inexistente, y la asociación con respuesta «no»
- WHEN se intenta avanzar cada una
- THEN en los dos casos responde `404` (G7)

#### Scenario: sin cargo — ROJO
- GIVEN un usuario sin cargo que no es administrador y una ficha «abierta»
- WHEN la avanza
- THEN responde `403` (G8) y el estado no cambia

#### Scenario: posición G7 < G8, inexistente y sin cargo — CARACTERIZACIÓN
- GIVEN un usuario sin cargo y un id de ficha inexistente
- WHEN intenta avanzar
- THEN responde el `404` de G7, no el `403`

#### Scenario: posición G8 < G9, sin cargo y paso no permitido — CARACTERIZACIÓN
- GIVEN un usuario sin cargo y una ficha «resuelta»
- WHEN intenta avanzarla
- THEN responde el `403` de G8, no el `409` de G9

#### Scenario: posición G9 < G10, paso no permitido y contenido inválido — CARACTERIZACIÓN
- GIVEN un Director Técnico, una ficha «abierta» y un cuerpo de resolver con resultado fuera de la lista
- WHEN intenta resolverla saltando el envío
- THEN responde el `409` de G9, no el `422` de G10

### RQ-TC-47 · Editar los datos de la ficha, y la ficha resuelta no se edita

Los datos editables de una ficha (fabricante, referencia y serial de la pieza, RMA y valor reclamado) **SHALL** poder
corregirse mientras la ficha no esté resuelta. Una ficha **resuelta** **MUST NOT** editarse (SUPUESTO S-6): responde
`409`. El estado, la respuesta, el origen del valor reclamado y las fechas **MUST NOT** cambiar por esta ruta: sólo avanza
el estado la ruta de RQ-TC-46.

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

### RQ-TC-48 · Lectura por ticket, «pendiente de respuesta», y liberar la asociación no borra la ficha

La lectura de las respuestas y fichas de un ticket **SHALL** estar disponible para **cualquier usuario con sesión**
(SUPUESTO S-2): leer no decide nada, como las lecturas de asociaciones
(`apps/desk/server/routes/ovAsociaciones.ts:26`). La respuesta del servidor **SHALL** traer, para cada asociación OVI del
ticket, su respuesta y su ficha si la hay, y **SHALL** indicar cuáles asociaciones OVI vigentes están «pendientes de
respuesta» (OVI vigente sin respuesta). Una asociación liberada sin respuesta **MUST NOT** salir pendiente ni aparecer
en la lista (SUPUESTO S-11); una liberada CON respuesta sí aparece, con su ficha intacta. Las OVI asociadas antes de este cambio salen «pendiente de respuesta», **sin relleno retroactivo**
(SUPUESTO S-11): no se inventan respuestas.

**Liberar la asociación no cierra ni borra la ficha** (SUPUESTO S-8): la liberación de `tickets-core` RQ-TC-17 y RQ-TC-20
**MUST NOT** tocar `garantia_proveedor`, que conserva el número de la OVI copiado y sigue su curso (se edita, avanza y
avisa) aparte del ticket. La fila de la asociación nunca se borra, así que la referencia por `asociacion_id` sigue
siendo estable.

#### Scenario: cualquier sesión lee — ROJO
- GIVEN un usuario sin cargo que no es administrador
- WHEN lee las respuestas y fichas de un ticket
- THEN recibe la lista, con éxito

#### Scenario: sin sesión no lee — CARACTERIZACIÓN
- GIVEN una petición sin sesión
- WHEN lee las fichas de un ticket
- THEN responde `401`

#### Scenario: OVI vigente sin respuesta sale «pendiente de respuesta» — ROJO
- GIVEN un ticket con una asociación vigente de `OVI-2026-001` sin respuesta, y otra con respuesta «no»
- WHEN se lee
- THEN sólo la primera sale «pendiente de respuesta»

#### Scenario: una orden `OV-` nunca sale pendiente — ROJO
- GIVEN un ticket con una asociación vigente de `OV-2026-001`
- WHEN se lee
- THEN no sale «pendiente de respuesta»

#### Scenario: liberada sin respuesta no sale pendiente (S-11) — ROJO
- GIVEN una asociación OVI liberada sin respuesta
- WHEN se lee
- THEN no sale «pendiente de respuesta» y no aparece en la lista

#### Scenario: asociaciones anteriores al cambio salen pendientes sin relleno (S-11) — CARACTERIZACIÓN
- GIVEN una asociación OVI vigente creada antes de que existiera la tabla
- WHEN se lee
- THEN sale «pendiente de respuesta» y no existe fila en `garantia_proveedor`

#### Scenario: liberar no borra ni cierra la ficha (S-8) — ROJO
- GIVEN una ficha «abierta» sobre una asociación OVI
- WHEN un usuario de Comercial libera la asociación con motivo
- THEN la ficha sigue «abierta», con el número de la OVI y sin cambio alguno, y sigue pudiendo editarse y avanzar

### RQ-TC-49 · El cliente no decide nada que el servidor no imponga (regla invariable 13)

El panel de la ficha, junto al de asociaciones del detalle del ticket, **SHALL** limitarse a mostrar y a ofrecer las
acciones; **toda decisión que toma tiene contrapartida en el servidor** y el cliente **MUST NOT** ser la única guarda.
Las nueve decisiones y quien las impone (las líneas del servidor las nombra el cierre del lote, regla de mutación 3):

| # | Decisión del cliente | Regla que consume | La impone |
|---|---|---|---|
| 1 | Enseña la pregunta, el formulario y los botones sólo a quien tiene el cargo | `puedeGestionarReclamacion` (envoltorio de `shared` sobre `puedeCrearOVIGarantia`) | G2, G8, G12 |
| 2 | Ofrece la pregunta sólo en las filas `pendiente` | la lectura del servidor | G3, G4, G6 |
| 3 | Las tres opciones del «no» | `MOTIVOS_NO_RECLAMA` y sus etiquetas, de `shared` | G5 |
| 4 | Ofrece sólo el paso siguiente del estado | `siguienteEstado` | G9 |
| 5 | Rellena el fabricante con la marca del ticket (`fabricantePropuesto`, de la lectura) | la lectura del servidor | nada que imponer: es relleno; el servidor sólo exige fabricante no vacío (G5, G14) |
| 6 | Pinta «pendiente de respuesta» | la lectura del servidor | no decide nada |
| 7 | Oculta el formulario de edición en una ficha resuelta | `estado` de la lectura | G13 |
| 8 | Al resolver como «rechazada» no pide valor recuperado | `RESULTADOS_RECLAMACION` | G10 |
| 9 | No pinta el panel si el ticket no tiene ninguna OVI | la lectura del servidor (lista vacía) | no decide nada |

El cliente **SHALL** consumir las listas y los predicados de `packages/shared` y **MUST NOT** reescribirlos (molde H5).
Los `.tsx` están fuera de la red de pruebas por decisión de Gerencia (F0-00), así que estos requisitos del cliente no
llevan rojo previo: lo que lo respalda es la prueba del servidor de RQ-TC-44, RQ-TC-46 y RQ-TC-47.

#### Scenario: el servidor rechaza lo que el cliente ocultaría — ROJO
- GIVEN un usuario sin cargo que llama a las rutas de responder, editar y avanzar saltándose el panel
- WHEN las invoca
- THEN responden `403`, de modo que el panel es comodidad y no guarda

#### Scenario: el servidor rechaza el paso que el cliente no ofrecería — ROJO
- GIVEN un Director Técnico que llama a avanzar con un paso no permitido
- WHEN lo invoca
- THEN responde `409`

#### Scenario: «pendiente de respuesta» no es dato del cliente — CARACTERIZACIÓN
- GIVEN la respuesta del servidor de RQ-TC-48
- WHEN el panel la pinta
- THEN no deriva por su cuenta qué asociación está pendiente
