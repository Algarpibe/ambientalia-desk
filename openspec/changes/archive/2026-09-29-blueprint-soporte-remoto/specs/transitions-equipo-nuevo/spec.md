# Delta for transitions-equipo-nuevo

## MODIFIED Requirements

### Requirement: RQ-EN-04 · El flujo se determina por clasificación y por si el estado actual pertenece a ese catálogo

El sistema **SHALL** determinar el flujo aplicable de un ticket así, con **tres flujos**:

- si `clasificaciones = 'Equipo nuevo'` **Y** su estado actual (`current.row.status`) pertenece a los 5
  estados del catálogo de `Equipo nuevo` (§1), el flujo aplicable **SHALL** ser `equipo-nuevo`;
- si `clasificaciones = 'Soporte remoto'` **Y** su estado actual pertenece a los 4 estados del catálogo de
  `transitions-soporte-remoto` (`Solicitud Soporte`, `En Proceso`, `Pendiente`, `Finalizado`), el flujo
  aplicable **SHALL** ser `soporte-remoto`;
- en cualquier otro caso (otra clasificación, o `Equipo nuevo` / `Soporte remoto` con un estado que sólo
  existe en el grafo de servicio) el flujo aplicable **SHALL** ser `servicio`.

- Un ticket `Equipo nuevo` o `Soporte remoto` heredado cuyo estado actual no existe en su catálogo — p. ej.
  `Rev./Diagnostico`, `Ticket creado` — **MUST NOT** quedar varado: **SHALL** seguir viendo y pudiendo
  ejecutar las transiciones de `TRANSITIONS` (servicio) desde ese estado, sin tocar sus datos (s5;
  caso real #979, `Decisiones_Gerencia_2026-09-10.md:105-108`; S-6 de `blueprint-soporte-remoto`).
- Un ticket de servicio (clasificación distinta de `Equipo nuevo` y de `Soporte remoto`) **SHALL** tener
  siempre flujo `servicio`, con independencia de su estado.
- La clasificación desambigua los estados compartidos por nombre: `En Proceso` y `Finalizado` existen en
  los tres catálogos.

(Previously: dos flujos. «Un ticket de servicio o de `Soporte remoto` (clasificación distinta de `Equipo
nuevo`) SHALL tener siempre flujo `servicio`, con independencia de su estado.»)

#### Scenario: Ticket `Equipo nuevo` heredado en un estado sólo de servicio sigue en servicio
- GIVEN un ticket `clasificaciones = 'Equipo nuevo'` en `Rev./Diagnostico` (no existe en el catálogo
  de `Equipo nuevo`)
- WHEN se listan sus transiciones ejecutables
- THEN son las de `TRANSITIONS` (servicio) desde `Rev./Diagnostico`, y el ticket no queda sin
  transiciones

#### Scenario: Ticket `Equipo nuevo` en un estado de su catálogo pasa a flujo equipo-nuevo
- GIVEN un ticket `clasificaciones = 'Equipo nuevo'` en `Ingresado`
- WHEN se calcula su flujo aplicable
- THEN es `equipo-nuevo`, no `servicio`

#### Scenario: Ticket `Soporte remoto` en un estado de su catálogo pasa a flujo soporte-remoto
- GIVEN un ticket `clasificaciones = 'Soporte remoto'` en `Solicitud Soporte`, `En Proceso`, `Pendiente`
  o `Finalizado`
- WHEN se calcula su flujo aplicable
- THEN es `soporte-remoto`, no `servicio`

#### Scenario: Ticket `Soporte remoto` heredado en un estado sólo de servicio sigue en servicio
- GIVEN un ticket `clasificaciones = 'Soporte remoto'` en `Rev./Diagnostico` o `Ticket creado`
- WHEN se calcula su flujo aplicable y se listan sus transiciones
- THEN es `servicio` y ve las de `TRANSITIONS` desde ese estado

#### Scenario: La clasificación desambigua `En Proceso`
- GIVEN tres tickets en `En Proceso`, uno `Equipo nuevo`, uno `Soporte remoto` y uno de servicio
- WHEN se calcula el flujo aplicable de cada uno
- THEN son `equipo-nuevo`, `soporte-remoto` y `servicio` respectivamente

## Fuera de alcance de este delta

- El resto de requisitos de `transitions-equipo-nuevo` (RQ-EN-01 a RQ-EN-03, RQ-EN-05 a RQ-EN-07): no
  cambian. RQ-EN-05 ya es genérica por flujo; su mensaje de `409` nombra «soporte remoto» sin cambio de
  texto (escenario en `transitions-soporte-remoto` RQ-SR-05).
- El catálogo, área, nacimiento y Modalidad de soporte remoto → `transitions-soporte-remoto`.
- La sección «Fuera de alcance» de la spec viva, que remite soporte remoto a este cambio, se reescribe al
  archivar: soporte remoto pasa a estar construido.
- Pruebas de interfaz: `TransitionPanel.tsx` es `.tsx`, fuera de la red de pruebas (F0-00); no se propone
  `jsdom`.
