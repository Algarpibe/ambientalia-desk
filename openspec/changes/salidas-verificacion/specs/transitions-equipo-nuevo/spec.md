# Delta for `transitions-equipo-nuevo`

Cambio `salidas-verificacion` (F1A-03, `cierra: no`). Construye E1 y E2: las dos salidas de
`Verificación` que F1B-06 dejó fuera a propósito (`spec.md:39-40` en `openspec/specs/transitions-equipo-nuevo/`).

## MODIFIED Requirements

### Requirement: RQ-EN-01 · Catálogo separado, 6 transiciones sobre 5 estados

El sistema **SHALL** declarar el catálogo de `Equipo nuevo` como registro **separado** de
`TRANSITIONS` (`packages/shared/src/transitions.ts:295`) — no fundido en él —, con la misma forma de
`Transition` (`id`, `name`, `from: string[]`, `to: string`, `area: string`, `fields`,
`transitions.ts:55-62`) y la casilla de derivación en las seis (`:295-298`).

| Transición | Origen → destino | Área |
|---|---|---|
| Ingreso equipo nuevo | Ingresado → En Proceso | Servicio Técnico |
| Producto no conforme | En Proceso → Notificado | Servicio Técnico |
| Análisis y acciones | Notificado → Ingresado | Servicio Técnico |
| Verificación | En Proceso → Verificación | Servicio Técnico |
| Liberación | En Proceso, Verificación → Finalizado | Servicio Técnico |
| Rechazo de verificación | Verificación → Notificado | Servicio Técnico |

- El catálogo **SHALL** cubrir exactamente los mismos cinco estados: `Ingresado`, `En Proceso`,
  `Notificado`, `Finalizado` y `Verificación`. Sólo cambia el número de transiciones, no el de estados.
- `Verificación` **SHALL** tener exactamente dos salidas: `Liberación` (mismo id que desde `En
  Proceso`, `from` ampliado por s1) hacia `Finalizado`, y `Rechazo de verificación`
  (`rechazo_verificacion`, nueva, s2) hacia `Notificado`. Las dos declaran sólo `comment()` y
  `derivacion()`, sin motivo obligatorio (s3), igual que el resto del catálogo.
- `Finalizado` **SHALL** seguir siendo el único estado terminal de la unión de los dos catálogos: el
  invariante **SHALL** endurecerse a `sinSalida = ['Finalizado']` exactamente — quitar cualquiera de
  las dos salidas de `Verificación` **MUST** devolverlo a esa lista y poner la prueba en rojo.
- Las nuevas aristas cierran un ciclo que incluye a `Verificación`: `En Proceso → Verificación →
  Notificado → Ingresado → En Proceso` (vía `rechazo_verificacion` y `analisis_y_acciones`, ya
  existente). El componente conexo de reentrancia **SHALL** incluir `Verificación`, con cero campos de
  fecha reentrantes — las seis entradas sólo declaran comentario.
- Regla 13: ninguna decisión nueva vive en el cliente. `executeTransition` impone origen, flujo y área
  con el mismo catálogo compartido (`apps/desk/server/services/ticketService.ts:125-131`); ampliar
  `liberacion.from` y añadir `rechazo_verificacion` basta para que el servidor las imponga sin tocar la
  guarda.

(Previously: `Verificación` **MUST NOT** tener salida — excepción nombrada del invariante 3 de la
unión, `packages/shared/src/invariantesGrafo.test.ts:177-180`; 5 transiciones, no 6.)

#### Scenario: Las seis transiciones existen y sólo Finalizado queda sin salida
- GIVEN el catálogo de `Equipo nuevo` tras el cambio
- WHEN se listan sus 6 entradas y se calcula `sinSalida` sobre la unión con `TRANSITIONS`
- THEN cubren exactamente los 6 pares de la tabla y `sinSalida` es exactamente `['Finalizado']`

#### Scenario: El invariante 1 se extiende a la unión de los dos catálogos
- GIVEN la unión de `TRANSITIONS` y el catálogo de `Equipo nuevo`
- WHEN se calculan los estados derivados de los `from`/`to` de los dos
- THEN el resultado es exactamente `ESTADOS` (`estados.ts:112`) tras registrar `Verificación`, y el
  guardián de `transitions-st` (`invariantesGrafo.test.ts:35-42`) se extiende para comprobar la unión,
  no sólo `TRANSITIONS`

#### Scenario: Quitar las DOS salidas de Verificación pone el invariante en rojo (mutación)
- GIVEN el invariante `sinSalida = ['Finalizado']` en verde
- WHEN se retira `Verificación` del `from` de `liberacion` Y se borra `rechazo_verificacion`
- THEN `sinSalida` vuelve a incluir `Verificación` y la prueba del invariante falla

#### Scenario: Quitar UNA sola salida la caza la prueba de pares, no el invariante (mutación)
- GIVEN la prueba que fija que las salidas de `Verificación` son exactamente `liberacion` y
  `rechazo_verificacion`
- WHEN se retira sólo una de las dos
- THEN esa prueba de pares falla, aunque `sinSalida` siga en `['Finalizado']` —con una salida
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
- WHEN se calcula sobre las seis entradas
- THEN el ciclo `Ingresado → En Proceso → Notificado` se amplía a `En Proceso → Verificación →
  Notificado → Ingresado`, con cero campos de fecha reentrantes

### Requirement: RQ-EN-02 · Área por equivalencia con Servicio Técnico

Ninguna fuente accesible da el área de las seis transiciones (ni el maestro, ni Zoho). El sistema
**SHALL** declarar las seis como área `Servicio Técnico`, por equivalencia con el grafo de servicio —
supuesto reversible s2 de la propuesta, aplicado por la regla de ejecución.

*Hipótesis*, no cerrada por ninguna fuente: `Liberación` podría ser de área Comercial, por analogía con
`liberacion_sin_factura` (`transitions.ts:246`). El catálogo **SHALL** declararla Servicio Técnico
hasta que una fuente la corrija.

(Previously: «las cinco transiciones»; ahora «las seis», con `rechazo_verificacion` incluida por s2.)

#### Scenario: Las seis transiciones exigen el área Servicio Técnico
- GIVEN un usuario cuya única área es `Comercial`
- WHEN intenta ejecutar cualquiera de las seis transiciones del catálogo de `Equipo nuevo`
- THEN el servidor responde `403`, incluidas `Liberación` desde `Verificación` y `Rechazo de
  verificación`

## Notas fuera de bloques Requirement

- La sección «Nota de despliegue — no es requisito» (`spec.md:193-198`) **se retira**: describía el
  bloqueo de `archive-report.md:32` que este cambio levanta; deja de aplicar.
- La sección «Fuera de alcance de esta spec» (`spec.md:200-206`) **actualiza** su segunda viñeta: ya no
  dice «Las dos salidas de Verificación… → F1A-03» — las construye este cambio. La guarda de gas patrón
  (E3/E4) y la de certificado (E5) siguen fuera, ver abajo.

## Fuera de alcance de este delta

- **E3/E4** · Guarda de obligatoriedad por tipo de analizador/convertidor y lista de gases patrón →
  `docs/sdd/ENTRADA.md` E-082 (dueño Gerencia/Calidad; sin destino de tanda).
- **E5** · Guarda de certificado en `Liberación` desde `Verificación` (`R08.2.md:1520`) →
  `docs/sdd/ENTRADA.md` E-083 (dueño Gerencia/Calidad; sin destino de tanda).
- Área de `Liberación` y tickets heredados (preguntas abiertas de F1B-06): E1 no depende de ellas.
