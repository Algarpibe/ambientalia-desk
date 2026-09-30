# Delta for permissions

Cambio `prioridad-top5-cliente` (F1B-07, parte decidida, `cierra: no`). Base `6055c4d`, medido el 2026-09-30. Supuestos
S-4 y S-5 de `proposal.md`. RQ-PM-13 se modifica sólo en su escenario de posición de la migración (corrección C-1 de
`tasks.md`: el diseño, `design.md` §2, añade dos tablas detrás de la `ALTER` de `cargo_permiso`). Fuentes: `decision/c10-permisos-cargo` (`openspec/config.yaml:1927-1947`),
`decision/c10b-gerente-director` (`:2584-2598`) y `decision/top5-manual` (`:1949-1965`). Continúa `RQ-PM-01..22`.

## ADDED Requirements

### Requirement: RQ-PM-23 · Un solo predicado para fijar prioridad, mantener la lista Top 5 y ajustar por ticket

Los tres actos del Top 5 —fijar la prioridad de un cliente, marcar o desmarcar el Top 5 y ajustar la prioridad de un
ticket— SHALL decidirse con `puedeFijarPrioridadTop5` (`packages/shared/src/cargos.ts:80-83`) y con nada más (supuesto
S-5). Ninguna ruta del servidor MUST reescribir la regla por su cuenta. El cliente MAY ocultar esos controles con el
mismo predicado como comodidad, porque la imposición del servidor está probada (regla invariable 13, punto 3). El
predicado conserva el área `Comercial` (supuesto S-4): un Director Comercial sin área `Comercial` queda fuera.

#### Scenario: las tres rutas dan el mismo veredicto
- GIVEN cada uno de los siete cargos, «sin cargo» y admin, con área `Comercial`
- WHEN cada uno intenta fijar la prioridad de un cliente, marcar el Top 5 y ajustar un ticket
- THEN sólo Director Comercial y admin reciben `200` en las tres, y el resto `403` en las tres

#### Scenario: Director Comercial sin área Comercial
- GIVEN un usuario con cargo `Director Comercial` y sólo el área `Servicio Técnico`
- WHEN intenta cualquiera de los tres actos
- THEN responde `403`

#### Scenario: el cargo sin área no concede (RQ-PM-21)
- GIVEN un usuario de `Compras` con cargo `Director Comercial`
- WHEN intenta marcar un cliente como Top 5
- THEN responde `403`

## MODIFIED Requirements

### Requirement: RQ-PM-13 · Columna `cargo_permiso`, separada del cargo de firma

`public.users` SHALL tener una columna `cargo_permiso`, nullable y distinta de `users.cargo`. La migración SHALL ser
una sentencia `ALTER TABLE public.users` calificada, que se añadió al final de `schema.sql` en `29f65d1`; las tandas
posteriores añaden sus sentencias DETRÁS de ella y MUST NOT insertar ninguna por delante. `users.cargo` (texto libre
que firma la remisión) MUST NOT actuar como autoridad de permiso, ni siquiera si su texto coincide con un cargo de la
lista.
(Previously: la migración tenía que ser la última sentencia del fichero; `prioridad-top5-cliente` añade dos tablas y un
índice detrás, al final, para no desplazar ninguna cita.)

#### Scenario: el cargo de firma no da permiso
- GIVEN un usuario con `cargo = 'Director Comercial'` y `cargo_permiso` nulo
- WHEN ejecuta `liberacion_sin_factura`
- THEN recibe `403`

#### Scenario: la migración está calificada y detrás de todo lo que había en `29f65d1`
- GIVEN `schema.sql`
- WHEN se recorren sus `ALTER TABLE`
- THEN el de `cargo_permiso` es `public.users`, calificado y sin `CHECK`
- AND es la última de las sentencias que existían en `29f65d1`: nada se ha insertado por delante de ella
- AND lo que va detrás son sólo sentencias añadidas después de `29f65d1`
- AND el guardián de `migrate.test.ts` sigue en verde

### Requirement: RQ-PM-20 · Primitivas sin llamador: OVI de garantía y Top 5

`shared` SHALL exportar `puedeCrearOVIGarantia` (Director Técnico o admin) y `puedeFijarPrioridadTop5` (Director
Comercial o admin). `puedeFijarPrioridadTop5` **tiene llamadores** desde F1B-07: las rutas de prioridad del cliente y
de ajuste por ticket (`tickets-core` RQ-TC-27 y RQ-TC-29) y la guarda de las transiciones (`transitions-st` RQ-TS-21).
`puedeCrearOVIGarantia` **sigue sin llamador**: el acto de crear OVI de garantía es de F1B-03 y no existe en el código.
La prueba de las primitivas SHALL decir cuál tiene llamador y cuál no. Este cambio MUST NOT construir el acto de la OVI
de garantía.
(Previously: «Hoy no las llama nadie», las dos sin llamador, con el Top 5 de F1B-07 aún sin construir.)

#### Scenario: por cargo y admin
- GIVEN cada uno de los siete cargos, «sin cargo» y admin
- WHEN se evalúan las dos primitivas
- THEN sólo Director Técnico (y admin) pasa la primera y sólo Director Comercial (y admin) la segunda

#### Scenario: sólo la del Top 5 tiene llamador
- GIVEN el código de `apps/` y `packages/`, sin pruebas
- WHEN se buscan llamadores de las dos primitivas
- THEN `puedeFijarPrioridadTop5` tiene al menos uno en el servidor y `puedeCrearOVIGarantia` ninguno

## Fuera de alcance

- Construir la OVI de garantía y asignar su predicado: F1B-03 (`openspec/config.yaml:2349`).
- Asignar `cargo_permiso` en producción: tarea de persona P.1 de F1C-05 y P.1 de este cambio; archivar no la da por hecha.
- Quién ajusta la prioridad fuera del Top 5: pregunta 3.b abierta (`docs/sdd/Preguntas_Gerencia_2026-09-29.md:69-89`).
