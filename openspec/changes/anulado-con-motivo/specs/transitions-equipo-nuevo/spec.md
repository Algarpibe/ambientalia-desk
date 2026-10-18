# Delta para transitions-equipo-nuevo

## MODIFIED Requirements

### Requirement: RQ-EN-01 · Catálogo separado, 7 transiciones sobre 6 estados

El sistema **SHALL** declarar el catálogo de `Equipo nuevo` como registro **separado** de
`TRANSITIONS` (`packages/shared/src/transitions.ts:295`) — no fundido en él —, con la misma forma de
`Transition` (`id`, `name`, `from: string[]`, `to: string`, `area: string`, `fields`,
`transitions.ts:55-62`) y la casilla de derivación en las seis de trabajo (`:295-298`); la séptima, `anulacion_equipo_nuevo`, no la lleva:
no hay trabajo a partir de ella.

| Transición | Origen → destino | Área |
|---|---|---|
| Ingreso equipo nuevo | Ingresado → En Proceso | Servicio Técnico |
| Producto no conforme | En Proceso → Notificado | Servicio Técnico |
| Análisis y acciones | Notificado → Ingresado | Servicio Técnico |
| Verificación | En Proceso → Verificación | Servicio Técnico |
| Liberación | En Proceso, Verificación → Finalizado | Servicio Técnico |
| Rechazo de verificación | Verificación → Notificado | Servicio Técnico |
| Anulación | Ingresado, En Proceso, Notificado, Verificación → Anulado | Comercial |

- El catálogo **SHALL** cubrir exactamente seis estados: `Ingresado`, `En Proceso`,
  `Notificado`, `Finalizado`, `Verificación` y `Anulado` (RQ-TS-40, F1C-01). Los orígenes de `Anulación` son los
  cuatro estados no terminales **[SUPUESTO S-2 de F1C-01]**.
- `Verificación` **SHALL** tener exactamente tres salidas: `Liberación` (mismo id que desde `En
  Proceso`, `from` ampliado por s1) hacia `Finalizado`, `Rechazo de verificación`
  (`rechazo_verificacion`, nueva, s2) hacia `Notificado`, y `Anulación` (`anulacion_equipo_nuevo`) hacia `Anulado`. `Rechazo de verificación` declara sólo `comment()` y
  `derivacion()`, sin motivo obligatorio (s3), igual que el resto del catálogo. `Liberación` declara además el
  campo de texto `certificado_fabrica`, **no obligatorio en el catálogo** (RQ-EN-10): es la única de las seis de trabajo que
  lleva un campo de negocio. `Anulación` lleva el motivo obligatorio y su detalle (RQ-TS-40).
- `Finalizado` y `Anulado` **SHALL** ser los únicos estados terminales de la unión de los catálogos: el
  invariante **SHALL** ser `sinSalida = ['Finalizado', 'Anulado']` exactamente — quitar las tres salidas de
  `Verificación` **MUST** devolverlo a esa lista y poner la prueba en rojo.
- Las nuevas aristas cierran un ciclo que incluye a `Verificación`: `En Proceso → Verificación →
  Notificado → Ingresado → En Proceso` (vía `rechazo_verificacion` y `analisis_y_acciones`, ya
  existente). El componente conexo de reentrancia **SHALL** incluir `Verificación`, con cero campos de
  fecha reentrantes — el campo `certificado_fabrica` es de texto, no de fecha.
- Regla 13: ninguna decisión nueva vive en el cliente. `executeTransition` impone origen, flujo y área
  con el mismo catálogo compartido (`apps/desk/server/services/ticketService.ts:125-131`); ampliar
  `liberacion.from` y añadir `rechazo_verificacion` basta para que el servidor las imponga sin tocar la
  guarda. Las dos guardas que dependen del ticket y del equipo (RQ-EN-08, RQ-EN-10) las impone también el servidor.

(Previously, hasta F1C-01: 6 transiciones sobre 5 estados, `sinSalida = ['Finalizado']` y sin `Anulación`. Antes:
`Verificación` **MUST NOT** tener salida — excepción nombrada del invariante 3 de la
unión, `packages/shared/src/invariantesGrafo.test.ts:177-180`; 5 transiciones, no 6. Y, hasta este cambio, las dos
salidas de `Verificación` y las cuatro restantes declaraban «sólo `comment()` y `derivacion()`»; ahora `Liberación`
añade `certificado_fabrica`.)

#### Scenario: Las siete transiciones existen y sólo Finalizado y Anulado quedan sin salida
- GIVEN el catálogo de `Equipo nuevo` tras el cambio
- WHEN se listan sus 7 entradas y se calcula `sinSalida` sobre la unión con `TRANSITIONS`
- THEN cubren exactamente los 7 pares de la tabla y `sinSalida` es exactamente `['Finalizado', 'Anulado']`

#### Scenario: El invariante 1 se extiende a la unión de los dos catálogos
- GIVEN la unión de `TRANSITIONS` y el catálogo de `Equipo nuevo`
- WHEN se calculan los estados derivados de los `from`/`to` de los dos
- THEN el resultado es exactamente `ESTADOS` (`estados.ts:112`) tras registrar `Verificación`, y el
  guardián de `transitions-st` (`invariantesGrafo.test.ts:35-42`) se extiende para comprobar la unión,
  no sólo `TRANSITIONS`

#### Scenario: Quitar las TRES salidas de Verificación pone el invariante en rojo (mutación)
- GIVEN el invariante `sinSalida = ['Finalizado', 'Anulado']` en verde
- WHEN se retira `Verificación` del `from` de `liberacion` y de `anulacion_equipo_nuevo` Y se borra `rechazo_verificacion`
- THEN `sinSalida` vuelve a incluir `Verificación` y la prueba del invariante falla

#### Scenario: Quitar UNA sola salida la caza la prueba de pares, no el invariante (mutación)
- GIVEN la prueba que fija que las salidas de `Verificación` son exactamente `liberacion`,
  `rechazo_verificacion` y `anulacion_equipo_nuevo`
- WHEN se retira sólo una de las dos
- THEN esa prueba de pares falla, aunque `sinSalida` siga en `['Finalizado', 'Anulado']` —con una salida
  restante el estado no queda sin salida, y el invariante no puede distinguirlo—

#### Scenario: Liberación ejecuta desde Verificación (E1)
- GIVEN un ticket `Equipo nuevo` en `Verificación`
- WHEN un usuario de Servicio Técnico ejecuta `Liberación`
- THEN responde `200` y el ticket pasa a `Finalizado`

#### Scenario: Rechazo de verificación ejecuta desde Verificación (E2)
- GIVEN un ticket `Equipo nuevo` en `Verificación`
- WHEN un usuario de Servicio Técnico ejecuta `Rechazo de verificación`, con o sin comentario
- THEN responde `200` y el ticket pasa a `Notificado`

#### Scenario: El ciclo de reentrancia pasa a incluir Verificación
- GIVEN la tabla de reentrancia de `TRANSITIONS_EQUIPO_NUEVO` tras el cambio
- WHEN se calcula sobre las siete entradas
- THEN el ciclo `Ingresado → En Proceso → Notificado` se amplía a `En Proceso → Verificación →
  Notificado → Ingresado`, con cero campos de fecha reentrantes

#### Scenario: Los campos declarados — cinco sin campo de negocio y `liberacion` con el certificado
- GIVEN el catálogo `TRANSITIONS_EQUIPO_NUEVO` tras el cambio
- WHEN se leen las claves de `fields` de cada entrada
- THEN las cinco que no son `liberacion` ni `anulacion_equipo_nuevo` declaran exactamente `comment` y `derivado_a`
- AND `anulacion_equipo_nuevo` declara exactamente `comment`, el motivo de anulación, obligatorio, y su detalle
- AND `liberacion` declara exactamente `comment`, `derivado_a` y `certificado_fabrica`, este último con `required` falso
- AND añadir un campo a cualquier otra entrada, o marcar `certificado_fabrica` como obligatorio, pone la prueba en rojo (sustituye a «exactamente comentario y derivación» de `invariantesGrafo.test.ts:213-216`)

#### Scenario: Comercial anula un equipo nuevo (E3) — ROJO
- GIVEN un ticket `Equipo nuevo` en `Notificado`
- WHEN un usuario de Comercial ejecuta `Anulación` con un motivo de la lista
- THEN responde `200` y el ticket pasa a `Anulado`, cerrado

### Requirement: RQ-EN-02 · Área de las seis: Servicio Técnico, por decisión de Gerencia

Las seis transiciones de trabajo **SHALL** ser de área `Servicio Técnico` (`decision/e226-espera-y-areas-equipo-nuevo`, 17/10): la
regla es Servicio Técnico salvo las de entrega o facturación al cliente, que son de Comercial, y ninguna de las seis lo es.
El docblock de `TRANSITIONS_EQUIPO_NUEVO` (`packages/shared/src/transitions.ts:347-348`) **SHALL** citar esa decisión.

`Liberación` **SHALL** ser de Servicio Técnico (supuesto S-2, lista semanal): es la liberación técnica tras el control, con
el certificado de fábrica (`transitions.ts:359-360`; M1.4, `R08.4.md:1698`), no una entrega ni una facturación. La analogía
con `liberacion_sin_factura` (`transitions.ts:246`), de Comercial porque depende de la factura, **SHALL NOT** aplicarse.

La séptima, `anulacion_equipo_nuevo`, **SHALL** ser de área `Comercial` (`decision/f1c01-area-anulado`): no es trabajo
técnico, es la decisión de cerrar el servicio sin hacerlo.

(Previously, hasta F1C-01: el catálogo eran sólo las seis. Antes: área por equivalencia, supuesto s2, con la hipótesis de que `Liberación` fuera de Comercial. Ver `RQ-EN-13`.)

#### Scenario: Las seis transiciones exigen el área Servicio Técnico
- GIVEN un usuario cuya única área es `Comercial`
- WHEN intenta ejecutar cualquiera de las seis transiciones del catálogo de `Equipo nuevo`
- THEN el servidor responde `403`, incluidas `Liberación` desde `Verificación` y `Rechazo de
  verificación`

#### Scenario: La anulación de equipo nuevo exige Comercial — ROJO
- GIVEN un usuario cuya única área es `Servicio Técnico` y un ticket `Equipo nuevo` en `En Proceso`
- WHEN intenta ejecutar `Anulación` con un motivo de la lista
- THEN el servidor responde `403`

### Requirement: RQ-EN-13 · El área de las seis la vigila una prueba (E-226)

La aserción de área de `packages/shared/src/invariantesGrafo.test.ts:215` **SHALL** exigir `Servicio Técnico` en las seis de trabajo y `Comercial` en `anulacion_equipo_nuevo`, de las siete
transiciones de `TRANSITIONS_EQUIPO_NUEVO` y nombrar E-226 en su mensaje. Ningún área cambió con E-226; F1C-01 añade una transición de Comercial y la matriz crece con ella. Ningún
permiso cambia: la matriz de `apps/desk/server/permisos.test.ts` sigue igual.

#### Scenario: Pasar `liberacion` a Comercial se pone rojo (mutación)
- GIVEN `liberacion` con `area: 'Comercial'`
- WHEN corre `invariantesGrafo.test.ts`
- THEN falla la aserción de área de las seis
