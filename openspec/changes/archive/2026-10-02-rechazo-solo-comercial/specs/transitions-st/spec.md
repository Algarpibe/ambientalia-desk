# Delta para `transitions-st` — «Rechazo» desde Notificación cliente, sólo Comercial (F1C-10)

Cambio `rechazo-solo-comercial`. `rechazo_cliente` (`Notificación cliente` → `Por Facturar`) pasa de
`Comercial / Servicio Técnico` a `Comercial` (E-114, `docs/sdd/ENTRADA.md:1460-1464`; maestro vigente
`R08.4.md:1616`, `:1945`). `rechazo_comercial` y `rechazo_revision` no cambian. Las afirmaciones de F1C-09
que decían «ocho compartidas» eran ciertas de su revisión y se conservan nombrándola (caso B de la regla de
mutación 4); no se renumeran ni se reescriben a presente.

## MODIFIED Requirements

### Requirement: RQ-TS-07 · Permisos por área

El permiso **SHALL** calcularse con `canExecuteTransition(userAreas, isAdmin, transitionArea)`
(`packages/shared/src/permissions.ts:4-6`), que es siete líneas y el único sitio de la regla.

- Las áreas base **SHALL** ser exactamente tres: `Comercial`, `Servicio Técnico`, `Compras`.
- Un área compuesta se descompone por el separador `' / '` (`packages/shared/src/transitions.ts:313-315`).
- **Siete** de las **31** transiciones **SHALL** ser compartidas por dos áreas: cinco `Comercial / Compras` y
  dos `Comercial / Servicio Técnico` (`rechazo_comercial` y `rechazo_revision`). El emparejamiento id → área
  está fijado (`invariantesGrafo.test.ts:91-106`).
  (Previously: **ocho** compartidas, cinco `Comercial / Compras` y tres `Comercial / Servicio Técnico`; la
  tercera era `rechazo_cliente`, de área `Comercial` desde F1C-10.)
- Un administrador **MAY** ejecutar las 31 sin que su área importe (`permissions.ts:5`; probado contra el
  servidor en `permisos.test.ts:89-109`).
- La matriz completa **SHALL** ser 31 × 3 = **93 casos: 55 prohibidos y 38 permitidos**
  (24 transiciones de área simple × 2 áreas prohibidas + 7 compartidas × 1 prohibida).
  (Previously: 93 casos, 54 prohibidos y 39 permitidos, con 23 de área simple y 8 compartidas, hasta F1C-10;
  y antes de F1C-09, 34 × 3 = 102 casos, 60 prohibidos y 42 permitidos, con 26 de área simple.)

**El espejo del cliente es legítimo desde F0-04.** `TransitionPanel.tsx:56-58` filtra los botones por área
en el navegador; con la matriz probada contra el servidor cumple el punto 3 de la regla invariable 13
(`permisos.test.ts:35-39`).

#### Scenario: la matriz tiene 93 casos
- GIVEN la matriz derivada del grafo
- WHEN se cuenta
- THEN son 93 casos, 55 prohibidos y 38 permitidos, y el total va escrito a mano en la prueba

#### Scenario: prohibición por área
- GIVEN un usuario cuyo rol sólo tiene el área `Servicio Técnico`
- WHEN intenta ejecutar `facturado`, de área `Comercial`, desde un estado de origen válido
- THEN el servidor responde `403` y el ticket no se mueve

#### Scenario: el administrador ejecuta las 31
- GIVEN un administrador con un rol que no cubre ninguna transición
- WHEN ejecuta cada una de las 31 desde un estado válido
- THEN todas responden `200`

#### Scenario: hay siete compartidas
- GIVEN el catálogo tras el cambio
- WHEN se cuentan las transiciones cuya área contiene `' / '`
- THEN son siete: cinco `Comercial / Compras` y dos `Comercial / Servicio Técnico`

### Requirement: RQ-TS-23 · Se retiran tres transiciones del catálogo de servicio

`TRANSITIONS` **SHALL NOT** contener las ids `marcar_pendiente`, `servicio_externo_pendiente` ni
`servicio_externo_notificado` (retiradas por E-103/E-106). Las tres eran de área `Servicio Técnico` simple y
sin campo de fecha, así que **SHALL** haberse conservado sin cambio, **en la revisión de F1C-09
(`011f6ea`)**, el emparejamiento de las ocho compartidas y los diez campos de fecha reentrantes. Una id
retirada **SHALL** rechazarse en el servidor como transición desconocida y no escribir nada. Una prueba
**SHALL** fijar la ausencia por id, no sólo por recuento.
(Previously: la frase decía, en presente y sin revisión, que **SHALL** conservarse sin cambio el
emparejamiento de las ocho compartidas. Tras F1C-10 las compartidas son siete, por un cambio ajeno a esas
tres retiradas (`rechazo_cliente`, RQ-TS-30); lo que RQ-TS-23 afirma es que **retirarlas** no movió el
emparejamiento, y eso sigue siendo cierto de F1C-09.)

#### Scenario: el catálogo tiene 31 entradas y ninguna es una retirada
- GIVEN `TRANSITIONS` tras el cambio
- WHEN se cuentan sus entradas y se buscan las tres ids
- THEN hay 31 entradas con 31 ids distintas y ninguna de las tres figura

#### Scenario: una id retirada se rechaza y no escribe
- GIVEN un cliente con la lista vieja y un ticket en `En Proceso`
- WHEN envía `marcar_pendiente` al endpoint de transición
- THEN el servidor responde `400 'Transición desconocida'` (guarda 1, escalón A) y no cambia estado ni inserta fila en `ticket_transitions`

#### Scenario: un ticket de servicio que quedó en `Pendiente` no ofrece transiciones
- GIVEN un ticket de flujo `servicio` en `Pendiente` (aún sin migrar)
- WHEN se listan las transiciones aplicables a ese estado
- THEN la lista es vacía y cualquier transición de servicio ejecutada sobre él responde `409`

#### Scenario: mutación — reponer una retirada pone dos pruebas en rojo
- GIVEN una de las tres entradas repuesta en el catálogo
- WHEN corre la suite
- THEN falla el recuento de 31 y falla la prueba de lista de ids retiradas

#### Scenario: retirar las tres no movió el emparejamiento de compartidas (revisión F1C-09)
- GIVEN el catálogo en la revisión `011f6ea`, antes de F1C-10
- WHEN se comparan las compartidas antes y después de retirar las tres
- THEN el emparejamiento de las ocho compartidas y los diez campos reentrantes es el mismo
  (a partir de F1C-10 son siete, por RQ-TS-30)

## ADDED Requirements

### Requirement: RQ-TS-30 · `rechazo_cliente` es de área `Comercial`, y sólo las otras dos «Rechazo» comparten con Servicio Técnico

La transición `rechazo_cliente` (`from: Notificación cliente`, `to: Por Facturar`) **SHALL** tener
`area: 'Comercial'` en `packages/shared/src/transitions.ts`. `rechazo_comercial`
(`Notificación Comercial` → `Por Facturar`) y `rechazo_revision` (`Rev./Diagnostico` → `Por Facturar`)
**SHALL** conservar `Comercial / Servicio Técnico`. Origen, destino, campos y obligatorios de las tres
**MUST** quedar intactos.

- El servidor **SHALL** responder `403` por área (escalón B, `ticketService.ts:129-130`) cuando quien ejecuta
  `rechazo_cliente` no sea administrador ni tenga el área `Comercial`, sin cambiar estado ni insertar fila en
  `ticket_transitions`. **MUST NOT** hacer falta ningún cambio en el servidor: el área se lee de `t.area` del
  catálogo.
- El invariante 5 de `invariantesGrafo.test.ts` **SHALL** fijar **siete** transiciones compartidas,
  emparejadas por id, y **SHALL** fallar si `rechazo_cliente` vuelve a figurar entre ellas.
- Las filas históricas de `ticket_transitions` de `rechazo_cliente` **MUST** conservar su área original
  (`ticketService.ts:155` guarda el área vigente al ejecutar); no se reescriben ni se migran.
- El mapa del blueprint regenerado **SHALL** marcar las tres aristas de `rechazo_cliente` con `[C]` y no con
  `[C][ST]`; las aristas de `rechazo_comercial` y `rechazo_revision` **SHALL** conservar `[C][ST]`. Los
  cuatro `blueprint-*.md` **MUST** coincidir con el generador (anti-desfase, `mapaBlueprint.test.ts`).
- El barrido de cargo (744 combinaciones) y la única diferencia cargo/área (`liberacion_sin_factura` ×
  Comercial) **MUST** quedar sin cambio.
- Los guardianes del cambio (cifras 55/38 y 56/37, invariante 5 con siete, `403` nuevo) **SHALL** escribirse
  y verse en rojo antes de editar el catálogo (`strict_tdd`).

#### Scenario: el catálogo declara las tres Rechazo
- GIVEN `TRANSITIONS` tras el cambio
- WHEN se buscan `rechazo_comercial`, `rechazo_cliente` y `rechazo_revision`
- THEN sus áreas son `Comercial / Servicio Técnico`, `Comercial` y `Comercial / Servicio Técnico`, y los tres destinos siguen siendo `Por Facturar`

#### Scenario: Servicio Técnico no puede rechazar desde Notificación cliente
- GIVEN un ticket en `Notificación cliente` y un usuario cuyo rol sólo tiene `Servicio Técnico`
- WHEN ejecuta `rechazo_cliente`
- THEN el servidor responde `403`, el ticket sigue en `Notificación cliente` y no se inserta fila en `ticket_transitions`

#### Scenario: Comercial rechaza desde Notificación cliente
- GIVEN un ticket en `Notificación cliente` y un usuario del área `Comercial` con los obligatorios de la transición
- WHEN ejecuta `rechazo_cliente`
- THEN el servidor responde `200`, el ticket pasa a `Por Facturar` y la traza registra el área `Comercial`

#### Scenario: el invariante 5 fija siete compartidas
- GIVEN el catálogo tras el cambio
- WHEN corre el invariante 5
- THEN afirma siete compartidas emparejadas por id (cinco `Comercial / Compras`, `rechazo_comercial` y `rechazo_revision` como `Comercial / Servicio Técnico`) y `rechazo_cliente` no está entre ellas

#### Scenario: el invariante 6 no cambia
- GIVEN el catálogo tras el cambio
- WHEN corre el invariante 6
- THEN siguen siendo diez los campos de fecha reentrantes

#### Scenario: el barrido de cargo sigue en 744
- GIVEN el barrido cargo × área × transición
- WHEN se cuenta tras el cambio
- THEN son 744 combinaciones y la única diferencia entre la matriz HTTP con cargo y la de área sigue siendo Comercial sin cargo × `liberacion_sin_factura`

#### Scenario: el mapa regenerado marca la arista en `[C]`
- GIVEN `npm run generar-mapa-blueprint` ejecutado tras el cambio
- WHEN se leen las aristas que salen de `Notificación cliente` hacia `Por Facturar` en `blueprint-completo.md`, `blueprint-fase-2-diagnostico.md` y `blueprint-fase-3-cierre.md`
- THEN las tres llevan `[C]` sin `[ST]`, las aristas de `Notificación Comercial` y `Rev./Diagnostico` conservan `[C][ST]` y la prueba anti-desfase pasa

#### Scenario: una traza histórica conserva su área
- GIVEN una fila de `ticket_transitions` de `rechazo_cliente` anterior al cambio, con área `Comercial / Servicio Técnico`
- WHEN se despliega el cambio
- THEN la fila conserva ese valor sin migración

#### Scenario: mutación — devolver `rechazo_cliente` a `Comercial / Servicio Técnico`
- GIVEN `rechazo_cliente.area` devuelta a `Comercial / Servicio Técnico`
- WHEN corre la suite
- THEN fallan la matriz de área (54/39), la compuesta (55/38), el invariante 5 (ocho en lugar de siete), la prueba del `403`, la de áreas siguientes y la anti-desfase del mapa

#### Scenario: mutación — cambiar por error otra Rechazo
- GIVEN `rechazo_comercial` o `rechazo_revision` pasada a `Comercial`
- WHEN corre la suite
- THEN falla el invariante 5 (seis compartidas) y falla la prueba de que esa Rechazo admite a Servicio Técnico

### Requirement: RQ-TS-31 · El aviso por área de `Notificación cliente` deja de incluir a Servicio Técnico (supuesto S-1)

`areasSiguientes('Notificación cliente')` (`packages/shared/src/transitions.ts:327-334`), que alimenta
`areasAAvisar` (`apps/desk/server/services/avisoArea.ts:15-17`), **SHALL** devolver exactamente `Comercial` y
`Compras`, sin `Servicio Técnico`, porque las tres salidas del estado (`aprobacion_y_repuestos`,
`aprobacion`, `rechazo_cliente`) ya no incluyen esa área. No cambia ningún requisito de `derivacion-avisos`
(RQ-AV-04 es genérico): es consecuencia del grafo, y se registra como **supuesto S-1** de la propuesta,
reversible con el mismo cambio de catálogo.
(Previously: `Comercial`, `Compras` y `Servicio Técnico`, sin prueba que lo fijara.)

- Una prueba nueva **SHALL** fijar el conjunto exacto de `areasSiguientes('Notificación cliente')`, para que
  el supuesto deje de ser implícito.
- **MUST NOT** emitirse aviso de área a Servicio Técnico al entrar un ticket en `Notificación cliente`; a
  Comercial y Compras sí, con la resta de las áreas de quien acaba de actuar tal como ya define RQ-AV-04.

#### Scenario: las áreas siguientes de Notificación cliente son Comercial y Compras
- GIVEN el catálogo tras el cambio
- WHEN se calcula `areasSiguientes('Notificación cliente')`
- THEN el conjunto es exactamente `Comercial` y `Compras`

#### Scenario: Servicio Técnico no recibe aviso al entrar en Notificación cliente
- GIVEN un ticket que entra en `Notificación cliente` ejecutado por un usuario sólo de `Servicio Técnico`
- WHEN se calculan las áreas a avisar
- THEN son `Comercial` y `Compras`, y `Servicio Técnico` no figura

#### Scenario: mutación — devolver la arista de Servicio Técnico
- GIVEN `rechazo_cliente.area` devuelta a `Comercial / Servicio Técnico`
- WHEN corre la prueba de áreas siguientes
- THEN falla porque el conjunto incluye `Servicio Técnico`

## Notas de fusión (para `sdd-archive`)

Estas afirmaciones de `openspec/specs/transitions-st/spec.md` describen el estado anterior y **no** se
editan por RQ-TS-30; se anotan con su revisión (caso B), sin renumerar y sin desplazar líneas:

- Tabla de invariantes, fila 5 (`:63`): «Las ocho transiciones compartidas son ésas…» pasa a siete, con
  `(Previously: ocho, hasta F1C-10)`.
- Escenario «los invariantes 5 y 6 no cambian» (`:1627-1630`, bajo «Escenarios de RQ-TS-01 añadidos por
  F1C-09»): cierto de la revisión `011f6ea`. Se conserva con su revisión nombrada («en F1C-09, siguen en
  ocho compartidas y diez campos reentrantes») y se añade que RQ-TS-30 los lleva a siete.
- `openspec/specs/transitions-st/spec.md:1545` en `4984c3b` y todo `openspec/changes/archive/**` son citas fechadas: no
  se tocan.
