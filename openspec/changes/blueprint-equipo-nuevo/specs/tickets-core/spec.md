# Delta for tickets-core

## MODIFIED Requirements

### Requirement: RQ-TC-10 · Las clasificaciones son el disparador de rama

`CLASIFICACIONES` **SHALL** ser exactamente tres, y **SHALL** ser obligatoria en el alta
(`packages/shared/src/ticketCreate.ts:5`; obligatoriedad en `ticketService.ts:56`):

`Equipo para servicio de mantenimiento` · `Equipo nuevo` · `Soporte remoto`

Es el campo que activa los distintos flujos de trabajo (maestro Anexo G col. 11, `:4325-4326`; M1.2
`[AS-IS — R05]`, `:1096`). El **tipo de servicio** es una segunda dimensión, distinta de la rama
(Anexo G col. 27, `:4337-4338`), y `TIPOS_SERVICIO` **SHALL** declararlo aparte
(`ticketCreate.ts:4`).

**Dos de las tres ramas tienen grafo tras este cambio.** `Equipo nuevo` deja de caer en el grafo de
servicio: tiene su propio catálogo, capacidad `transitions-equipo-nuevo` (spec propia, F1B-06, primer
cambio, `blueprint-equipo-nuevo`). `Soporte remoto` sigue sin grafo — es `transitions-soporte-remoto`,
el segundo cambio de F1B-06 (`blueprint-soporte-remoto`) — y sus tickets siguen cayendo en el grafo de
servicio técnico.

(Previously: «Sólo una de las tres ramas está implementada. `Equipo nuevo` y `Soporte remoto` no
tienen grafo... Hoy los tres valores se pueden elegir en el alta y los tres caen en el mismo grafo.»)

#### Scenario: Un ticket `Equipo nuevo` deja de caer en el grafo de servicio
- GIVEN un ticket con `clasificaciones = 'Equipo nuevo'` recién creado y llevado a `Ingresado`
- WHEN se listan las transiciones que puede ejecutar
- THEN son las del catálogo `transitions-equipo-nuevo`, nunca las de `TRANSITIONS`

#### Scenario: Un ticket `Soporte remoto` sigue cayendo en el grafo de servicio, fuera de este cambio
- GIVEN un ticket con `clasificaciones = 'Soporte remoto'`
- WHEN se listan sus transiciones
- THEN sigue viendo las de `TRANSITIONS` (servicio), sin cambios

## Nota sobre prosa no-Requirement — sección «4.3 · Dos ramas de `Clasificaciones` sin grafo · destino F1B-06»

Esta sección de `tickets-core` (bajo «4 · Comportamiento actual, a corregir») deja de describir el
estado actual para `Equipo nuevo`: tiene grafo propio desde este cambio. Sigue describiendo el estado
actual para `Soporte remoto`, sin grafo hasta el segundo cambio de F1B-06
(`blueprint-soporte-remoto`). Al archivar, esta sección debe reescribirse para reflejar sólo la rama
que queda sin construir, con la misma disciplina de «Previously» que usa el resto de la spec — no se
borra, se actualiza, siguiendo el criterio de `transitions-st` §3 para entradas parcialmente cerradas.
