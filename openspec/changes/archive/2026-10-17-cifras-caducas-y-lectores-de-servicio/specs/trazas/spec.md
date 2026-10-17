# Delta para trazas

## MODIFIED Requirements

### Requirement: RQ-TZ-01 · Toda transición deja fila, con fecha, hora y persona

Toda transición **SHALL** insertar una fila en `ticket_transitions` con nueve columnas:
`ticket_id`, `transition_id`, `transition_name`, `from_status`, `to_status`, `area`, `performed_by`,
`values` y `comment_id` (`packages/zoho-sync/src/db/repo.ts:314-318`), más el `performed_at` que la
tabla pone por defecto.

- **MUST NOT** existir ningún camino que escriba la fila sin actor: `performed_by` va en la misma
  sentencia `INSERT` que el resto (`repo.ts:315-317`). Es M1.10 `[DECIDIDO — R08]`, «no admite
  excepciones» (`R08.1.md:1677`).
- El actor **SHALL** ser el usuario de la sesión, y **MAY** caer a `TRANSITION_ACTOR` sólo si la
  sesión no trae nombre (`apps/desk/server/services/ticketService.ts:111`;
  `apps/desk/server/transitionActor.ts:3`). El único camino que alcanza el respaldo hoy está en §4.1.
- La cobertura **SHALL** ser de las 41 transiciones de los tres flujos, ejercitando **todos** los `from` de cada una
  —44 ejecuciones: 33 de servicio, porque `habilitar_servicio` tiene tres; 7 de equipo nuevo y 4 de soporte remoto— y comprobando en cada una el estado destino
  **y** la fila del historial (`apps/desk/server/transicionesEjecucion.test.ts:105-117`, `:272-285`, `:365`, `:419`).
- La escritura **SHALL** ser atómica con el resto de la transición: transacción cuando el pool lo
  permita, con `ROLLBACK` (`repo.ts:322-347`).
