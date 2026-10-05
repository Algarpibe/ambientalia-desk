# Delta para `zoho-sync`

## ADDED Requirements

### RQ-ZS-19 · Interruptor de entorno para APLICAR la migración de tickets abiertos (E-231)

`POST /api/admin/migrar-tickets-abiertos` (RQ-ZS-17) **MUST** rechazar `aplicar=true` con `403` mientras la variable
`MIGRACION_TICKETS_HABILITADA` no valga exactamente `true`. La variable **nace cerrada**: ausente o con cualquier otro valor
(`TRUE`, `1`, vacía…) está apagada, y se lee en `packages/zoho-sync/src/config.ts` como los demás interruptores.

El interruptor **SHALL** gobernar sólo `aplicar=true`: la pasada en seco (sin `aplicar` o con `aplicar=false`) sigue
respondiendo igual, y un `aplicar` inválido sigue siendo `400`. En el orden total de F1B-10 es escalón **B** (permiso):
corre detrás de la sesión y del rol, y **delante** de la validación de `corte` (C) y de cualquier lectura de la base.

#### Scenario: Apagado, aplicar=true no lee ni escribe
- GIVEN la variable apagada y un ticket abierto migrable
- WHEN un administrador llama con un `corte` válido y `aplicar=true`
- THEN responde `403` con un mensaje que nombra `MIGRACION_TICKETS_HABILITADA`
- AND no consulta `tickets` ni escribe en `tickets` ni en `ticket_transitions`

#### Scenario: Apagado, la pasada en seco sigue disponible
- GIVEN la variable apagada
- WHEN un administrador llama sin `aplicar` o con `aplicar=false`
- THEN responde `200` con el informe en seco, sin escribir

#### Scenario: El interruptor va antes del contenido y de la negativa
- GIVEN la variable apagada
- WHEN un administrador llama con `aplicar=true` y un `corte` inválido, o con un estado sin equivalencia en la base
- THEN responde `403`, no `400` ni `409`

#### Scenario: Encendido, el comportamiento de RQ-ZS-17
- GIVEN `MIGRACION_TICKETS_HABILITADA=true`
- WHEN un administrador llama con un `corte` válido y `aplicar=true`
- THEN la migración se aplica como describe RQ-ZS-17
