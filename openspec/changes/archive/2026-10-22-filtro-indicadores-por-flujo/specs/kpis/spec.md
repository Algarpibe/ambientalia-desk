# Delta: KPIs — los indicadores se filtran por flujo (`filtro-indicadores-por-flujo`)

Delta sobre `openspec/specs/kpis/spec.md`. Tanda F1F-05 (`cierra: no`). Propuesta:
`openspec/changes/filtro-indicadores-por-flujo/proposal.md`. «El GET» es `GET /api/indicadores` (json y csv);
«el POST» es `POST /api/indicadores/comparacion` (RQ-KP-26). «Flujo» es uno de `servicio`, `equipo-nuevo` y
`soporte-remoto`. Las citas a la spec viva van por identificador RQ-KP-NN, no por línea.

**Nota de fusión.** Todo es `## ADDED Requirements`: se añaden al final de la spec viva, tras RQ-KP-28, en el
orden RQ-KP-29 a RQ-KP-33. No hay `## MODIFIED Requirements` (RQ-KP-13, -14, -15 y -26 siguen siendo ciertos sin
`flujo`) ni filas para la tabla «0 · Procedencia y método»: los supuestos S-1 a S-8 viven en la propuesta (§6), así
que la fusión no desplaza ninguna línea de la spec viva.

## ADDED Requirements

### Requirement: RQ-KP-29 · Parámetro `flujo` y su validación

El GET y el POST **SHALL** aceptar un parámetro opcional `flujo` en la URL, junto a `desde` y `hasta`. Sus únicos
valores válidos son las claves de `CATALOGO_POR_FLUJO` (`packages/shared/src/flujos.ts:19-22`), comparadas por
igualdad exacta. Un valor vacío, repetido o con otra grafía (`Servicio`, `equipo nuevo`) **MUST** responder `400`
con la forma `{ error }` de `validarPeriodo` y un mensaje que nombra el parámetro «flujo». La validación de
`flujo` **MUST NOT** modificar `validarPeriodo` (`apps/desk/server/indicadores.ts:26-38`). Orden de las guardas:
en el GET, sesión < administrador < periodo < flujo < lectura; en el POST, sesión < administrador < multer <
periodo < flujo < «falta el fichero» < lector < consultas. Un `flujo` inválido **MUST NOT** ejecutar ninguna
consulta de tickets.

#### Scenario: Valor desconocido
- GIVEN un administrador y `flujo=otro`
- WHEN llama al GET o al POST con periodo válido
- THEN responde `400` y el mensaje contiene «flujo»

#### Scenario: Vacío, repetido y otra grafía
- GIVEN un administrador y, por separado, `flujo=`, `flujo=servicio&flujo=servicio` y `flujo=Servicio`
- WHEN llama al GET
- THEN las tres peticiones dan `400` que nombra «flujo»

#### Scenario: Los tres valores válidos
- GIVEN un administrador y periodo válido
- WHEN llama al GET con `flujo=servicio`, `flujo=equipo-nuevo` y `flujo=soporte-remoto`
- THEN las tres responden `200`

#### Scenario: Periodo antes que flujo (regla de mutación 1)
- GIVEN `desde=2026-12-31`, `hasta=2026-12-01` y `flujo=otro`, en el GET y, aparte, en el POST
- WHEN llama un administrador
- THEN ambas rutas dan `400` cuyo mensaje es el del periodo y no nombra «flujo»

#### Scenario: Flujo antes que «falta el fichero» en el POST (regla de mutación 1)
- GIVEN periodo válido, `flujo=otro` y ninguna parte de fichero
- WHEN llama un administrador al POST
- THEN el `400` nombra «flujo» y no dice que falta el fichero

#### Scenario: Flujo inválido no lee tickets
- GIVEN `flujo=otro` con periodo válido
- WHEN llama un administrador
- THEN no se ejecuta ninguna consulta de tickets

### Requirement: RQ-KP-30 · El flujo de un ticket lo decide su clasificación

Un predicado **único** de `packages/shared` **SHALL** decidir el flujo de un ticket para los indicadores. Devuelve
`Flujo` y lo da **sólo** la clasificación: consume `esClasificacionSoporteRemoto` y `esClasificacionEquipoNuevo`
(`packages/shared/src/flujos.ts:116-119`, `:40-43`) y devuelve `servicio` cuando ninguna la reconoce, incluida la
clasificación ausente o `null`. **MUST NOT** depender del estado del ticket ni reescribir la normalización
(`packages/shared/src/flujos.ts:32-34`), y **MUST NOT** ser `flujoDelTicket` (`:56-61`): éste exige además que el
estado esté en el catálogo del flujo, condición de **enrutado** de transiciones (`:50-55`), no de población. Con
él, un mismo ticket de equipo nuevo cambiaría de flujo al pasar de `Ticket creado` a `Ingresado` y un heredado
en `Por Facturar` contaría como `servicio`. El cliente **MUST NOT** reimplementar este predicado.

#### Scenario: «Equipo nuevo» en un estado de servicio
- GIVEN un ticket con clasificación «Equipo nuevo» y estado `Ticket creado`
- WHEN se decide su flujo
- THEN es `equipo-nuevo` (con `flujoDelTicket` sería `servicio`)

#### Scenario: «Equipo nuevo» finalizado y heredado
- GIVEN dos tickets con clasificación «Equipo nuevo», uno en `Finalizado` y otro heredado en `Por Facturar`
- WHEN se decide su flujo
- THEN los dos son `equipo-nuevo` (con `flujoDelTicket`, el segundo sería `servicio`)

#### Scenario: Otra mayúscula
- GIVEN un ticket con clasificación «Equipo Nuevo»
- WHEN se decide su flujo
- THEN es `equipo-nuevo`; un predicado que compare sin normalizar da `servicio` y se pone rojo

#### Scenario: Clasificación ausente
- GIVEN un ticket con clasificación `null`
- WHEN se decide su flujo
- THEN es `servicio`, igual que con una clasificación no reconocida

#### Scenario: Soporte remoto
- GIVEN un ticket con clasificación «Soporte remoto» y estado `Rev./Diagnostico`
- WHEN se decide su flujo
- THEN es `soporte-remoto` (con `flujoDelTicket` sería `servicio`)

### Requirement: RQ-KP-31 · Recorte del GET por flujo

La lectura **SHALL** traer la clasificación de cada ticket en la misma consulta de tickets
(`apps/desk/server/indicadores.ts:64`), de modo que RQ-KP-14 se mantenga: **cuatro** consultas, con o sin `flujo`.
Con `flujo`, el GET **SHALL** devolver, en json y en csv, **sólo** los tickets cuyo flujo por RQ-KP-30 es el
pedido; el recorte se aplica después de leer y es una función pura. El JSON **SHALL** llevar la clave `flujo` con el
valor pedido; las cabeceras del CSV no cambian y el nombre del fichero **SHALL** incluir el flujo. **Sin `flujo`**,
el cuerpo json y el cuerpo csv **MUST** ser idénticos byte a byte a los anteriores a este cambio: la misma
población, las mismas claves, sin clave `flujo` y sin sufijo en el nombre.

#### Scenario: El recorte filtra
- GIVEN tickets de los tres flujos en el periodo
- WHEN un administrador pide el JSON con `flujo=equipo-nuevo`
- THEN `tickets` sólo trae los de equipo nuevo, `flujo` vale `equipo-nuevo`, y los de otros flujos no aparecen

#### Scenario: El CSV también filtra
- GIVEN los mismos tickets
- WHEN pide el CSV con `flujo=soporte-remoto`
- THEN las filas sólo son de tickets de soporte remoto, las cabeceras son las de RQ-KP-15 y el nombre del fichero contiene `soporte-remoto`

#### Scenario: Sin `flujo`, los bytes de hoy
- GIVEN una caracterización de las respuestas json y csv sin parámetro, escrita antes del cambio
- WHEN se repite tras el cambio
- THEN los cuerpos son idénticos byte a byte, sin clave `flujo` ni `null`, y las pruebas anteriores pasan sin editarse

#### Scenario: Cuatro consultas con y sin flujo
- GIVEN diez tickets con transiciones
- WHEN llama un administrador con `flujo=servicio` y, aparte, sin `flujo`
- THEN ambas ejecutan cuatro consultas, todas de lectura

#### Scenario: Ticket sin clasificación
- GIVEN un ticket con clasificación `null` y «Equipo Nuevo» en otro, en el periodo
- WHEN se pide `flujo=servicio` y luego `flujo=equipo-nuevo`
- THEN el primero sale sólo con `servicio` y el segundo sólo con `equipo-nuevo`

### Requirement: RQ-KP-32 · La comparación por flujo y el cubo «de otro flujo»

El POST **SHALL** cruzar el fichero contra **todos** los tickets del periodo y repartir **después**: con el reparto
sin clasificación de RQ-KP-25, recortar antes llevaría un ticket de otro flujo a «fuera del periodo», y con
clasificación cambiaría los «ID» que se consultan. Con `flujo`: un ticket del fichero que existe en
Desk y es de otro flujo **SHALL** ir al cubo `deOtroFlujo`, que gana a «fuera del periodo» y a «sólo en el
fichero»; «sólo en Desk» y «número distinto» **SHALL** contar sólo tickets del flujo pedido; y la comparación
**SHALL** hacerse sólo con los cruzados del flujo pedido. La clasificación de los tickets fuera del periodo sale,
sólo con `flujo`, de `ticketsConClasificacion` (`apps/desk/server/db/ticketsPorId.ts:24`), que consulta por bloques
como `numerosDeTickets` (`apps/desk/server/db/ticketsPorId.ts:10`) con una columna más y la sustituye. La
respuesta **SHALL** llevar la clave `flujo` y el cubo `deOtroFlujo` **sólo** con `flujo`; sin él, ambos
**MUST NOT** aparecer y el cuerpo es el de hoy. El número de consultas **MUST NOT** cambiar.

#### Scenario: Otro flujo dentro del periodo
- GIVEN un ticket de soporte remoto del periodo presente en el fichero y `flujo=equipo-nuevo`
- WHEN llama un administrador al POST
- THEN está en `deOtroFlujo`, no en `soloEnFichero` ni en `fueraDelPeriodo`, y no entra en `cruzados`

#### Scenario: Otro flujo fuera del periodo
- GIVEN un ticket de servicio existente pero fuera del periodo, presente en el fichero, y `flujo=equipo-nuevo`
- WHEN llama
- THEN está en `deOtroFlujo` y no en `fueraDelPeriodo`; uno de equipo nuevo fuera del periodo sigue en `fueraDelPeriodo`

#### Scenario: Ausente de Desk
- GIVEN un número del fichero que no existe en Desk y `flujo=servicio`
- WHEN llama
- THEN va a `soloEnFichero`, no a `deOtroFlujo`

#### Scenario: «Sólo en Desk» del flujo pedido
- GIVEN un ticket de servicio y otro de equipo nuevo del periodo, ambos ausentes del fichero, y `flujo=servicio`
- WHEN llama
- THEN `soloEnDesk` trae sólo el de servicio, y lo mismo vale para `numeroDistinto`

#### Scenario: Sin `flujo`, el cuerpo de hoy
- GIVEN una caracterización del POST sin parámetro, escrita antes del cambio
- WHEN se repite tras el cambio
- THEN no hay clave `flujo` ni `deOtroFlujo` y el cuerpo es idéntico byte a byte

#### Scenario: Mismas consultas
- GIVEN el POST con y sin `flujo` sobre los mismos datos
- WHEN se cuentan las consultas
- THEN son las mismas: cuatro de `leerEntradasIndicadores` y una por bloque de «ID» sin cruzar

### Requirement: RQ-KP-33 · Cliente del filtro por flujo

En «Análisis», junto a la descarga, el cliente **SHALL** ofrecer a los administradores un selector con «Todos» (por
defecto) y los tres flujos, con las etiquetas de `NOMBRE_FLUJO` (`packages/shared/src/flujos.ts:127-131`,
exportado). El selector gobierna la descarga **y** la comparación. «Todos» **MUST NOT** enviar `flujo`. Las URL las
arman `urlIndicadores` (`apps/desk/src/lib/indicadoresUrl.ts:5`) y `urlComparacion`
(`apps/desk/src/lib/comparacionExportacion.ts:13`), con un `flujo` opcional, cada una con su prueba en `lib`. La
función de presentación (`vistaComparacion`) **SHALL** mostrar «De otro flujo» sólo si la respuesta trae
`deOtroFlujo`. El `.tsx` **MUST** sólo pintar y **MUST NOT** clasificar, recortar ni validar. Regla invariable 13:

- mostrar el selector sólo a administradores: `403` de `requireAdmin` (`apps/desk/server/routes/indicadores.ts:41`,
  `apps/desk/server/routes/indicadoresComparacion.ts:25`);
- ofrecer sólo «Todos» y los tres flujos: `400` de `flujo` (RQ-KP-29);
- «Todos» no envía `flujo`: sin parámetro el único corte es el periodo (`apps/desk/server/indicadores.ts:70`);
- la descarga lleva el flujo elegido: el recorte del GET (RQ-KP-31);
- la comparación lleva el mismo flujo: el reparto del POST (RQ-KP-32);
- pintar el flujo y «de otro flujo» tal como llegan: la serialización de la respuesta (RQ-KP-31, RQ-KP-32).

#### Scenario: `urlIndicadores` lleva el flujo
- GIVEN `urlIndicadores('csv', undefined, 'equipo-nuevo')` (firma exacta a fijar por el diseño)
- WHEN se arma la URL
- THEN contiene `flujo=equipo-nuevo`, y sin flujo no contiene `flujo`

#### Scenario: `urlComparacion` lleva el flujo
- GIVEN un periodo y el flujo `soporte-remoto`
- WHEN se arma la URL
- THEN contiene `desde`, `hasta` y `flujo=soporte-remoto`; sin flujo, la URL es la de hoy

#### Scenario: «Todos» no envía parámetro
- GIVEN el selector en «Todos»
- WHEN se arman las dos URL
- THEN ninguna contiene `flujo`, ni siquiera vacío

#### Scenario: Cubo sólo si llega
- GIVEN una respuesta sin `deOtroFlujo` y otra con él
- WHEN se procesan con `vistaComparacion`
- THEN la primera no muestra «De otro flujo» y la segunda sí, con el total y la lista tal como llegan, sin calcularlos

#### Scenario: El cliente no valida
- GIVEN un valor de `flujo` fuera del dominio
- WHEN el cliente arma la petición
- THEN lo envía sin validarlo y lo rechaza el servidor con `400`

## Mutación → escenario

| M | Mutación | Escenario que se pone rojo |
|---|---|---|
| M1 | El recorte devuelve todos | RQ-KP-31 · El recorte filtra |
| M2 | Sin `flujo` cambia la respuesta | RQ-KP-31 · Sin `flujo`, los bytes de hoy; RQ-KP-32 · Sin `flujo`, el cuerpo de hoy |
| M3 | Flujo inválido sin `400` | RQ-KP-29 · Valor desconocido; Vacío, repetido y otra grafía |
| M4 | Otro flujo cae en «sólo en el fichero» o «fuera del periodo» | RQ-KP-32 · Otro flujo dentro del periodo; Otro flujo fuera del periodo |
| M5 | El CSV ignora el recorte | RQ-KP-31 · El CSV también filtra |
| M6 | El predicado pasa a `flujoDelTicket` | RQ-KP-30 · «Equipo nuevo» en un estado de servicio; «Equipo nuevo» finalizado y heredado; Soporte remoto |
| M7 | `urlIndicadores` pierde el parámetro | RQ-KP-33 · `urlIndicadores` lleva el flujo |
| M8 | Posición de las guardas | RQ-KP-29 · Periodo antes que flujo; Flujo antes que «falta el fichero» |
| M9 | `urlComparacion` pierde el parámetro | RQ-KP-33 · `urlComparacion` lleva el flujo |
| M10 | Una consulta más | RQ-KP-31 · Cuatro consultas con y sin flujo; RQ-KP-32 · Mismas consultas |
| M11 | `vistaComparacion` pinta el cubo sin que venga | RQ-KP-33 · Cubo sólo si llega |
| M12 | Fixture vigilado: «Equipo Nuevo» y `null` | RQ-KP-30 · Otra mayúscula; Clasificación ausente; RQ-KP-31 · Ticket sin clasificación |
