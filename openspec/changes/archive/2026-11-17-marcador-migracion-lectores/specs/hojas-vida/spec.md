# Delta de hojas-vida — `marcador-migracion-lectores`

Sólo `ADDED`, a continuación de RQ-HV-19. Fuente: `decision/marcador-migracion-en-pantallas` (`openspec/config.yaml:6766-6782`).

## ADDED Requirements

### Requirement: RQ-HV-20 · La hoja de vida no cuenta el marcador de la migración como una etapa

La hoja de vida (`apps/desk/server/db/equipos.ts:275` en `e728808d`) **MUST NOT** tomar como etapa la fila de
`ticket_transitions` con `transition_id = 'migracion_f1f01_abiertos'`, tenga `to_status` nulo o relleno **[SUPUESTO S-3]**: no
es una etapa del equipo. El marcador **SHALL** reconocerse con `esPasoDeMigracion` (RQ-TZ-28), sin comparación propia. Las
etapas reales y la creación **MUST NOT** cambiar, y la fila **SHALL** seguir en la base.

#### Scenario: marcador de identidad oculto — ROJO
- GIVEN un equipo con un ticket `T-202` cuyo marcador tiene `to_status` nulo y una transición real «Habilitar Servicio»
- WHEN se pide `GET /api/equipos/:id/historial`
- THEN la hoja de vida lleva la etapa de «Habilitar Servicio» y ninguna etapa del marcador

#### Scenario: marcador con destino relleno oculto — ROJO
- GIVEN un equipo con el ticket `T-201`, cuyo marcador lleva `to_status = 'En Proceso'`
- WHEN se pide su hoja de vida
- THEN no hay etapa del marcador, ni con `Managed by app previo` ni con otra clave de `values`

#### Scenario: la creación y las etapas reales no cambian — CARACTERIZACIÓN
- GIVEN un equipo con un ticket sin marcador, con su creación y dos transiciones
- WHEN se pide su hoja de vida
- THEN salen las mismas tres etapas, en el mismo orden
