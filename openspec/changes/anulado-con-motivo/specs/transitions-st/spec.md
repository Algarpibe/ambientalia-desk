# Delta para transitions-st

## ADDED Requirements

### Requirement: RQ-TS-40 · `Anulado`: estado terminal con motivo obligatorio de lista cerrada, que ejecuta Comercial

Fuente: `decision/c2-anulado` (motivos), `decision/c3-salida-esperas` (las dos esperas externas, Comercial),
`decision/e223-anulacion-tres-flujos` y `decision/f1c01-area-anulado` (Comercial en todos); maestro M1.10
(`R08.4.md:2138-2152`).

**El estado.** `Anulado` **SHALL** registrarse en `CLASIFICACION_EN_ESPERA` con clase `ninguna`, en la misma línea que
`Ticket creado` (`packages/shared/src/estados.ts:99`) para no desplazar citas. **SHALL** ser terminal y cerrado:
`statusType: 'Closed'` (`apps/desk/server/transitionExec.ts:5`).

**Los motivos.** La lista **SHALL** vivir en `packages/shared/src/anulacion.ts` con exactamente cinco, en este orden:
«El cliente no aprueba o se echa atrás», «Sin solución técnica», «Repuesto no disponible», «Caducidad de espera: el
cliente no responde ni retira el equipo» y «Otro». «Otro» **SHALL** exigir un detalle de texto no vacío **[SUPUESTO S-6]**.
«Creado por error» y «duplicado» **MUST NOT** ser motivos: se borran, no se anulan (`R08.4.md:2145`).

**La transición de servicio.** `anulacion` **SHALL** ir de `En Espera de Repuestos`, `Servicio externo`,
`Rev./Diagnostico`, `Notificación Comercial` y `Notificación cliente` a `Anulado`, con área `Comercial` y los campos
`comment()`, el motivo (`select`, obligatorio, con las cinco `options`) y el detalle. `Solicitado` y `En espera de SKU
inventario` **MUST NOT** anularse (c3).

**La guarda.** El servidor **SHALL** imponer el motivo: si falta, `422` por `buildTransitionPlan`; si no es de la lista o
es «Otro» sin detalle, `422` por `erroresAnulacion`, sumado al único `422` agregado del escalón C
(`apps/desk/server/services/ticketService.ts:134`). Ese `422` **SHALL** correr después del `403` de área y de cargo
(escalón B), según el orden total de §3.8.

#### Scenario: Comercial anula con un motivo de la lista — ROJO
- GIVEN un ticket de servicio en `Notificación cliente` y un usuario de Comercial
- WHEN ejecuta `anulacion` con «Sin solución técnica»
- THEN responde `200`, el ticket queda en `Anulado` con `status_type = 'Closed'`, y la traza guarda el motivo en `values`

#### Scenario: sin motivo, 422 — ROJO
- GIVEN un ticket en `En Espera de Repuestos`
- WHEN Comercial ejecuta `anulacion` sin motivo
- THEN responde `422` y el ticket no cambia

#### Scenario: un motivo fuera de la lista da 422 — ROJO
- GIVEN un ticket en `Servicio externo`
- WHEN Comercial ejecuta `anulacion` con «Creado por error»
- THEN responde `422` con la lista de motivos válidos

#### Scenario: «Otro» sin detalle da 422 — ROJO
- GIVEN un ticket en `Rev./Diagnostico`
- WHEN Comercial ejecuta `anulacion` con «Otro» y sin detalle
- THEN responde `422`

#### Scenario: un usuario sin Comercial recibe 403 antes que el 422 del motivo — ROJO
- GIVEN un usuario de Servicio Técnico y un ticket en `Notificación Comercial`
- WHEN ejecuta `anulacion` con un motivo fuera de la lista
- THEN responde `403`, no `422`; poner la guarda del motivo antes de la de área lo pone en rojo (regla de mutación 1)

#### Scenario: desde Solicitado y desde En espera de SKU inventario no se anula — ROJO
- GIVEN un ticket en `Solicitado` o en `En espera de SKU inventario`
- WHEN Comercial ejecuta `anulacion` con un motivo válido
- THEN responde `409`

#### Scenario: un anulado sale de los abiertos
- GIVEN un ticket que acaba de pasar a `Anulado`
- WHEN se calculan las vistas del tablero
- THEN no está en «abiertos» ni en «en espera», y sí en «cerrados»

## MODIFIED Requirements

### Requirement: RQ-TS-04 · `Finalizado` y `Anulado` son los únicos estados terminales

`Finalizado` y `Anulado` (RQ-TS-40) **SHALL** ser los únicos estados sin transición de salida
(`invariantesGrafo.test.ts:62-66`; maestro M1.3.8), y **SHALL** ser los únicos que producen
`statusType: 'Closed'` (`transitionExec.ts:5`, `:39`). Todos los demás producen `'Open'`. Retirar las tres
transiciones y sacar `Pendiente` del catálogo de servicio **SHALL NOT** crear ningún otro terminal.
(Previously, hasta F1C-01: `Finalizado` era el único terminal y el único cerrado. Antes, sin la cláusula sobre la retirada ni escenarios.)

`areasSiguientes` **SHALL** devolver lista vacía para un estado terminal: no hay a quién pasarle el
testigo (`packages/shared/src/transitions.ts:325-334`).

#### Scenario: `Finalizado` y `Anulado` son los únicos sin salida
- GIVEN los 21 estados de `ESTADOS_SERVICIO`
- WHEN se calculan las transiciones salientes de cada uno
- THEN sólo `Finalizado` y `Anulado` no tienen ninguna, y `Notificado` conserva sus tres salidas

#### Scenario: en la unión, `Pendiente` sigue teniendo salida
- GIVEN la unión de los tres catálogos
- WHEN se calculan las salidas de `Pendiente`
- THEN tiene `continuacion_soporte` y no es terminal

#### Scenario: `Anulado` produce `Closed` — ROJO
- GIVEN la transición `anulacion`
- WHEN se construye su plan de escritura
- THEN `statusType` es `'Closed'`; sacar `Anulado` de `CLOSED_STATUSES` lo pone en rojo

### Requirement: RQ-TS-05 · Alcanzabilidad de los 21 estados de servicio

**Verificado por cierre transitivo** sobre `TRANSITIONS` (la cifra se fija en la prueba; la tabla es la
derivación):

| Desde | Estados alcanzados, contando el origen | No alcanzados |
|---|---|---|
| `OV asignada` | 19 | `Ticket creado`, `Remisión creada` |
| `Ticket creado`, sólo por botones | 19 | `OV asignada`, `Remisión creada` |
| `Ticket creado`, sumando el paso sin botón de RQ-TS-03 | 20 | `OV asignada` |

(Previously, hasta F1C-01: 18, 18 y 19 sobre 20 estados; `Anulado` (RQ-TS-40) se alcanza desde las dos esperas externas y los tres orígenes de Rechazo. Antes de F1C-09: 19, 19 y 20 sobre 21, por `Pendiente`.)

`Remisión creada` **MUST NOT** ser alcanzable por ninguna transición con botón; su única entrada es el paso
sin botón de `estadoPorRemision.ts`. No hay estados huérfanos y no hay callejones sin salida más allá de
`Finalizado` y `Anulado`.

**Discrepancia con el maestro (R08.1, histórica).** M1.3.8 (`R08.1.md:1413`) decía «18 desde `OV asignada`,
y desde `Ticket creado` los otros 20». Las dos cifras eran correctas pero no sobre la misma base. Con 21
estados de servicio la conclusión —«no hay estados huérfanos»— se sostiene.

#### Scenario: alcanzabilidad desde `OV asignada`
- GIVEN `TRANSITIONS` tras el cambio
- WHEN se calcula el cierre transitivo desde `OV asignada`
- THEN alcanza 19 estados y no alcanza `Ticket creado` ni `Remisión creada`

#### Scenario: no hay huérfanos con el paso sin botón
- GIVEN `TRANSITIONS` y el paso `TRANSICION_REMISION_CONFIRMADA`
- WHEN se calcula el cierre desde `Ticket creado`
- THEN alcanza 20 estados, todos menos `OV asignada`

### Requirement: RQ-TS-26 · La cifra anclada del maestro dice 32 / 40 / 21 en el mismo commit que el código

`openspec/config.yaml` **SHALL** declarar en `cifras_ancladas` `transiciones` = 32, `pasos_del_mapa` = 40 y
`estados` = 21 de servicio, y **SHALL** cerrar la `divergencia` caducada de `pasos_del_mapa`. La descripción
de la capacidad `transitions-st` en `capabilities` **SHALL** decir «32 transiciones y 21 estados». Estos
valores **SHALL** coincidir con `TRANSITIONS.length`, con las aristas del diagrama completo y con
`ESTADOS_SERVICIO.length`, y **SHALL** cambiar en el mismo commit que el código. El texto `codigo` de `pasos_del_mapa` **SHALL** nombrar las 32
transiciones y la arista de `anulacion` desde sus cinco orígenes.

(Previously, hasta F1C-01: 31 / 35 / 20, fijadas por F1C-09. `Anulado` era el movimiento previsto por decisión que
anunciaba `cifras_ancladas`.)

#### Scenario: las tres cifras coinciden con el código
- GIVEN `cifras_ancladas` y el código tras el cambio
- WHEN se comparan
- THEN 32 = `TRANSITIONS.length`, 40 = aristas del diagrama completo y 21 = `ESTADOS_SERVICIO.length`

#### Scenario: la mención a `Pendiente` de `esperas` queda coherente
- GIVEN la entrada `esperas` de `cifras_ancladas`
- WHEN se lee su recuento de estados de servicio
- THEN no cuenta `Pendiente` entre los 21; el recuento de espera que lee el barrido es el del código (12 desde E-226, `RQ-TS-39`)
