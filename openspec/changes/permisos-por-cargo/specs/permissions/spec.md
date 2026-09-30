# Delta for permissions

Cambio `permisos-por-cargo` (F1C-05, nivel CARGO, `cierra: no`). Base `e591454`, medido el 2026-09-30. Supuestos
S-1..S-8 de `proposal.md`. Fuentes: `decision/c10-permisos-cargo` (`openspec/config.yaml:1927-1947`) y
`decision/c10b-gerente-director` (`:2584-2598`; los siete nombres, `:2589`). Continúa la numeración `RQ-PM-01..11`.
`transitions-st` no lleva delta: su spec sólo menciona `liberacion_sin_factura` por el checkbox (RQ-TS-08, líneas
759-760 de esa spec) y no afirma quién la ejecuta.

## ADDED Requirements

### Requirement: RQ-PM-12 · Siete cargos, lista cerrada en `shared`

El sistema SHALL declarar en `packages/shared` una lista cerrada de exactamente siete cargos, con estos nombres
exactos: `Director Técnico`, `Coordinador Técnico`, `Técnico`, `Técnico de campo`, `Director Comercial`,
`Coordinador Comercial`, `Asistente Comercial`. «Gerente comercial» MUST NOT figurar: es el nombre informal de
Director Comercial. La lista SHALL existir en un solo sitio y el cliente la MUST consumir.

#### Scenario: la lista tiene siete entradas exactas
- GIVEN la lista de cargos de `shared`
- WHEN se enumera
- THEN tiene siete elementos, iguales y en ese orden a los de `decision/c10b-gerente-director`
- AND «Gerente comercial» no pertenece a ella

### Requirement: RQ-PM-13 · Columna `cargo_permiso`, separada del cargo de firma

`public.users` SHALL tener una columna `cargo_permiso`, nullable y distinta de `users.cargo`. La migración SHALL ser
una sentencia `ALTER TABLE public.users` calificada, al final de `schema.sql`. `users.cargo` (texto libre que firma
la remisión) MUST NOT actuar como autoridad de permiso, ni siquiera si su texto coincide con un cargo de la lista.

#### Scenario: el cargo de firma no da permiso
- GIVEN un usuario con `cargo = 'Director Comercial'` y `cargo_permiso` nulo
- WHEN ejecuta `liberacion_sin_factura`
- THEN recibe `403`

#### Scenario: la migración está calificada y al final
- GIVEN `schema.sql`
- WHEN se recorren sus `ALTER TABLE`
- THEN el de `cargo_permiso` es `public.users` y es la última sentencia del fichero
- AND el guardián de `migrate.test.ts` sigue en verde

### Requirement: RQ-PM-14 · Valor fuera de lista se lee como sin cargo

Un `cargo_permiso` leído de la base que no pertenezca a la lista SHALL tratarse como «sin cargo» (falla cerrado). La
base MUST NOT llevar `CHECK` de la lista (S-3).

#### Scenario: valor desconocido en base
- GIVEN un usuario con `cargo_permiso = 'Gerente comercial'` escrito directamente en base
- WHEN el sistema construye su usuario público y evalúa un permiso de cargo
- THEN su cargo de permiso es «sin cargo» y no ejecuta la excepción

### Requirement: RQ-PM-15 · Alta y edición validan el cargo en servidor; sólo admin lo cambia

`POST /api/users` y `PATCH /api/users/:id` SHALL aceptar `cargoPermiso` sólo si es un cargo de la lista, `null` o
cadena vacía (que se guarda como `null`); cualquier otro valor SHALL responder `422`. Un no administrador MUST
recibir `403` en ambas rutas.

#### Scenario: cargo inválido
- GIVEN un administrador autenticado
- WHEN envía alta o edición con `cargoPermiso: 'Gerente comercial'`
- THEN responde `422` y no se escribe la fila

#### Scenario: no admin
- GIVEN un usuario no administrador con cualquier cargo
- WHEN intenta cambiar `cargoPermiso` de alguien
- THEN responde `403`

#### Scenario: vaciar el cargo
- GIVEN un administrador y un usuario con cargo
- WHEN edita con `cargoPermiso: ''`
- THEN el usuario queda con `cargo_permiso` nulo

### Requirement: RQ-PM-16 · La sesión trae el cargo de permiso

`getSessionUser`, `USER_SELECT` y `rowToPublicUser` SHALL devolver `cargoPermiso`, y `UserPublic` SHALL declararlo.
Una guarda sobre `req.user` MUST ver el cargo: la sesión actual no lo selecciona (`apps/desk/server/auth/sessions.ts:17`).

#### Scenario: la sesión real lleva el cargo
- GIVEN un usuario con `cargo_permiso = 'Director Comercial'` y una sesión válida
- WHEN `requireAuth` resuelve la cookie
- THEN `req.user.cargoPermiso` es `Director Comercial`

### Requirement: RQ-PM-17 · `liberacion_sin_factura` exige Director Comercial

Además del área `Comercial`, ejecutar `liberacion_sin_factura` SHALL exigir el cargo `Director Comercial`. Sin él, el
servidor MUST responder `403` con mensaje que nombre ese cargo. Se impone en el servidor (`ticketService.ts:129-131`);
el cliente sólo lo espeja.

#### Scenario: Comercial sin cargo
- GIVEN un no admin del área `Comercial` sin cargo y un ticket en `Por Facturar`
- WHEN ejecuta `liberacion_sin_factura`
- THEN `403`, el mensaje nombra `Director Comercial` y el ticket no cambia

#### Scenario: Director Comercial
- GIVEN un usuario del área `Comercial` con cargo `Director Comercial`
- WHEN ejecuta `liberacion_sin_factura`
- THEN responde `200`

#### Scenario: otro cargo comercial
- GIVEN un usuario de `Comercial` con cargo `Coordinador Comercial`
- WHEN ejecuta `liberacion_sin_factura`
- THEN `403`

### Requirement: RQ-PM-18 · Posición del 403 de cargo (escalón B)

El `403` de cargo SHALL evaluarse inmediatamente después del `403` de área y después de los `409` de flujo y de
estado, y antes de todo `422`. La suite MUST fallar si se mueve delante del `409` de estado o detrás del `422`
(regla de mutación 1).

#### Scenario: 409 antes que 403 de cargo
- GIVEN un ticket fuera de `Por Facturar` y un Comercial sin cargo
- WHEN ejecuta `liberacion_sin_factura`
- THEN responde `409`, no `403`

#### Scenario: 403 de área antes que el de cargo
- GIVEN un usuario de `Compras` sin cargo y un ticket en `Por Facturar`
- WHEN ejecuta `liberacion_sin_factura`
- THEN el `403` nombra el área, no el cargo

#### Scenario: 403 de cargo antes que 422
- GIVEN un Comercial sin cargo y valores que darían `422`
- WHEN ejecuta `liberacion_sin_factura`
- THEN responde `403`

### Requirement: RQ-PM-19 · El administrador pasa las excepciones de cargo

Un administrador SHALL ejecutar `liberacion_sin_factura` sin tener cargo (`packages/shared/src/permissions.ts:5`,
sin cambio).

#### Scenario: admin sin cargo
- GIVEN un administrador sin `cargo_permiso`
- WHEN ejecuta `liberacion_sin_factura`
- THEN responde `200`

### Requirement: RQ-PM-20 · Primitivas sin llamador: OVI de garantía y Top 5

`shared` SHALL exportar `puedeCrearOVIGarantia` (Director Técnico o admin) y `puedeFijarPrioridadTop5` (Director
Comercial o admin). **Hoy no las llama nadie**: el acto de crear OVI de garantía es de F1B-03 y el Top 5 de F1B-07, y
ninguno existe en el código. Su prueba SHALL decirlo. Este cambio MUST NOT construir esos actos.

#### Scenario: por cargo y admin
- GIVEN cada uno de los siete cargos, «sin cargo» y admin
- WHEN se evalúan las dos primitivas
- THEN sólo Director Técnico (y admin) pasa la primera y sólo Director Comercial (y admin) la segunda

### Requirement: RQ-PM-21 · El cargo sólo restringe

El cargo MUST NOT conceder lo que el área niega. Un cargo SHALL únicamente añadir una condición a una transición que
el área ya permite.

#### Scenario: cargo sin área
- GIVEN un usuario de área `Servicio Técnico` con cargo `Director Comercial`
- WHEN ejecuta `liberacion_sin_factura`, de área `Comercial`
- THEN `403`

### Requirement: RQ-PM-22 · Estricto mientras nadie tenga cargo (S-1)

Sin cargo asignado, nadie SHALL ejecutar una excepción salvo el administrador, sin respaldo al área. Desplegado antes
de asignar cargos, sólo los administradores liberan sin factura.

#### Scenario: nadie tiene cargo
- GIVEN una base donde todos los `cargo_permiso` son nulos
- WHEN un no admin de `Comercial` ejecuta `liberacion_sin_factura`
- THEN `403` con el cargo necesario, y el admin obtiene `200`

## MODIFIED Requirements

### Requirement: RQ-PM-03 · La matriz completa, probada contra el servidor

La matriz de área × transición **SHALL** ser **34 × 3 = 102 casos: 60 prohibidos y 42 permitidos**
(26 transiciones de área simple × 2 áreas prohibidas + 8 compartidas × 1)
(`apps/desk/server/permisos.test.ts:77-82`). La función pura de área conserva 60/42.
(Previously: sin la aserción de la diferencia con el cargo.)

- La matriz **MUST** derivarse del grafo y no escribirse a mano: escrita a mano, la transición 35 que
  añada F1B-06 no tendría fila y nadie se enteraría (`permisos.test.ts:24-27`).
- El **total** sí **SHALL** ir escrito a mano, porque una matriz derivada de un grafo vacío también
  daría verde (`permisos.test.ts:26-27`, `:70`).
- **MUST** probarse contra el servidor y no contra la función pura: el `403` lo lanza
  `ticketService.ts:89`, y hay dos guardas por delante que se comen la respuesta
  (`permisos.test.ts:29-33`). Cada ticket se coloca en `t.from[0]`, un estado válido.
- Un administrador **MAY** ejecutar las 34 sin que su área importe
  (`permissions.ts:5`; probado contra el servidor en `permisos.test.ts:89-109`, con un usuario cuyo
  rol **no** cubre ninguna transición).
- La matriz HTTP con cargo **SHALL** diferir de la matriz de área en **exactamente UN** caso: Comercial sin cargo ×
  `liberacion_sin_factura` (200 en área, 403 con cargo). Esa diferencia **MUST** estar afirmada, para que el `esperado`
  no sea tautológico.

**Y de aquí sale la legitimidad del espejo del cliente.** Con esta matriz probada,
`apps/desk/src/components/TransitionPanel.tsx:56-58` deja de ser un espejo sin comprobar y pasa a ser
**comodidad legítima** bajo la regla invariable 13: la frontera está impuesta y probada en el
servidor, y la pantalla sólo evita ofrecer lo que va a ser rechazado (`permisos.test.ts:35-39`).
Antes de F0-04 no lo era.

#### Scenario: la matriz de área, sin cambios
- GIVEN la matriz de área sin cargo
- WHEN se cuenta
- THEN son 102 casos, 60 prohibidos y 42 permitidos

#### Scenario: prohibición por área
- GIVEN un usuario cuyo rol sólo tiene el área `Compras`
- WHEN intenta ejecutar `facturado`, de área `Comercial`, desde `Por Facturar`
- THEN el servidor responde `403` y el mensaje nombra el área que hacía falta

#### Scenario: exactamente un caso difiere
- GIVEN la matriz HTTP con cargo y la matriz de área
- WHEN se comparan las 102 celdas
- THEN difiere una sola: Comercial sin cargo × `liberacion_sin_factura`, de 200 a 403

## Fuera de alcance

- Regla de las transiciones Decisionales: depende de F1C-04 (plan `:177`; `openspec/config.yaml:1939`).
- Propietario del registro (tercer nivel): aplazado por c10 (`config.yaml:1936`, `:1942`); por eso `cierra: no`.
- Migrar alarmas y derivación (`destinatariosDeCargo`, `apps/desk/src/lib/personas.ts:74-78`) al cargo nuevo.
- Motivo y Fecha prevista de la Liberación sin factura: F1C-02 (`decision/anexo-33-checkbox`, `config.yaml:2388`).
- Construir la OVI de garantía: F1B-03 (`config.yaml:2349`). Top 5 y su edición: F1B-07 (`config.yaml:1958`).
- Asignar `cargo_permiso` en producción: tarea de persona P.1 de la propuesta; archivar no la da por hecha.
