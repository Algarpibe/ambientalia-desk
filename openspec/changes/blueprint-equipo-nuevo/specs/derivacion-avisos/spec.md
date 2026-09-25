# Delta for derivacion-avisos

## MODIFIED Requirements

### Requirement: RQ-AV-04 · El destinatario se calcula desde el estado de llegada, no desde el área que ejecutó

`areasSiguientes` **SHALL** devolver las áreas base de todas las transiciones cuyo `from` incluye el
estado (`packages/shared/src/transitions.ts:327-334`), y **MUST NOT** usarse el `area` de la
transición ejecutada.

La razón **SHALL** quedar escrita, y es un caso concreto: `escalado_a_comercial` es de área
`Servicio Técnico` y deja el ticket en `Notificación Comercial`, donde quien tiene que actuar es
Comercial; «avisar por el área de la transición ejecutada mandaría el aviso justo a quien acaba de
hacer el trabajo» (`packages/shared/src/transitions.ts:320-323`; maestro M1.9.3, `:1671`; diseño
`:21-27`).

- Un estado terminal **SHALL** devolver lista vacía: «no hay a quién pasarle el testigo» (`:317`;
  probado en `apps/desk/server/services/avisoArea.test.ts:28`).
- Las áreas compuestas **SHALL** descomponerse por `' / '` antes de contarlas
  (`areasForTransition`, `packages/shared/src/transitions.ts:313-315`).
- **Desde `blueprint-equipo-nuevo` (F1B-06), `areasSiguientes` SHALL calcularse sobre el catálogo del
  flujo aplicable del ticket que ejecutó la transición** (`transitions-equipo-nuevo` RQ-EN-04), **no
  siempre sobre `TRANSITIONS`.** Sin la restricción, un ticket `Equipo nuevo` en `Notificado` que
  ejecute `Análisis y acciones` calcularía las áreas siguientes contra las transiciones de SERVICIO
  que salen de `Notificado` (`escalado_a_comercial`), no contra las del catálogo de `Equipo nuevo` —
  mismo nombre de estado, catálogo distinto.

> **Given** un ticket en `Notificado` sobre el que Servicio Técnico ejecuta `escalado_a_comercial`
> **When** se calcula a quién avisar
> **Then** el aviso va a Comercial y a Compras, no a Servicio Técnico
> (`design:51`, verificado contra las 34 transiciones).

(Previously: sin la tercera viñeta — sólo existía un catálogo, así que `areasSiguientes` sobre
`TRANSITIONS` bastaba siempre.)

#### Scenario: Las áreas siguientes de un ticket `Equipo nuevo` salen de su propio catálogo
- GIVEN un ticket `clasificaciones = 'Equipo nuevo'` en `Notificado`, sobre el que se ejecuta
  `Análisis y acciones` (catálogo `Equipo nuevo`, `from: Notificado`, `to: Ingresado`)
- WHEN se calcula `areasSiguientes('Ingresado')` para ese ticket
- THEN el resultado sale del catálogo de `Equipo nuevo`, no de `TRANSITIONS`
