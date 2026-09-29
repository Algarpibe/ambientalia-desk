# Exploración: `blueprint-soporte-remoto` (F1B-06, cambio 2)

Hecha por `sdd-explore` el 2026-09-29 y contrastada por el orquestador contra el árbol en `66ab783`.
Engram: `sdd/blueprint-soporte-remoto/explore`.

## M1.5 del maestro, estado a estado

Fuente: `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.2.md:1551-1568` («[AS-IS]»,
hoja `DFsoporteremoto030226` y blueprint «Soporte Remoto» de Zoho; «las cuatro transiciones … coinciden», `:1552`).

| Origen | Transición | Destino | Líneas |
|---|---|---|---|
| Solicitud Soporte | Asignación | En Proceso | `:1556-1558` |
| En Proceso | Ejecutar | Finalizado | `:1559-1561` |
| En Proceso | Soporte pendiente | Pendiente | `:1562-1564` |
| Pendiente | Continuación soporte | En Proceso | `:1565-1567` |

- Cuatro estados: Solicitud Soporte · En Proceso · Pendiente · Finalizado (`:3650`). «4 transiciones, 4 estados. No construido» (`:4642-4646`).
- Disparador de la rama: «Solicitud de soporte»; estado terminal: Finalizado (M1.2, `:1115-1117`).
- El campo que activa la rama es `Clasificaciones` (`:1127`, Anexo G col. 11 `:4467`).
- `:1568`: el bucle de pausa sirve para medir la espera del cliente y separar trabajo activo de bloqueado.
- **M1.5 no dice** qué área ejecuta cada transición, qué campos lleva cada una ni cómo nace el ticket.

## Estado actual del código

1. **Nacimiento.** `createTicket` fija el estado `Ticket creado` sin parámetro (`packages/zoho-sync/src/db/repo.ts:420-422`, fila #1 de `ticket_transitions` en `:430-435`, área `Comercial`).
2. **Equipo nuevo entra por `habilitar_servicio`** (RQ-EN-03), que exige OV y Serial y es de Comercial (`packages/shared/src/transitions.ts:178`, `:189`). Soporte remoto no puede entrar así: `decision/anexo-43-en-sitio` dice que la rama «no exige remisión» (`openspec/config.yaml:2413`), y `Ingresado` no está en M1.5, así que `flujoDelTicket` lo devolvería a `servicio` (`packages/shared/src/flujos.ts:56-61`).
3. **No hay guarda de remisión** en `executeTransition` hoy (`apps/desk/server/services/ticketService.ts:114-223`); es F1B-03 (`openspec/config.yaml:2417`).
4. **Equipo obligatorio** para soporte remoto: `ticketService.ts:24`; se mantiene.
5. **Estados.** `Solicitud Soporte` no está registrado; `En Proceso` y `Pendiente` ya existen (`packages/shared/src/estados.ts:92`, `:105`). El cambio 1 registró `Verificación` en la misma línea `:105` y declaró `ESTADOS_SOLO_EQUIPO_NUEVO` en `:182`, excluido de `ESTADOS_SERVICIO` (`:185-190`).
6. **Consumidores genéricos por flujo**: panel (`apps/desk/src/components/TransitionPanel.tsx:56`), avisos (`ticketService.ts:196`), SLA (`apps/desk/server/db/sla.ts:49`), guarda 3 (`ticketService.ts:231-234`).
7. **Pruebas que se invierten a propósito**: `packages/shared/src/flujos.test.ts:42-45` («Soporte remoto SIEMPRE enruta a servicio», corrección (a) del cambio 1). Es transitorio por escrito: `openspec/specs/tickets-core/spec.md` RQ-TC-10 remite a este cambio.
8. **Modalidad.** `desk.tickets` no tiene columna `modalidad`; `servicio_in_situ` (`packages/zoho-sync/src/db/schema.sql:39`) es un campo heredado de Zoho con otra semántica. Última sentencia de `schema.sql`: `:573`.
9. **Datos.** `docs/analisis-tickets/Tickets.csv` (snapshot local, fecha desconocida): 22 filas «Soporte remoto», 0 en «Solicitud Soporte». El recuento real por estado es un dato de producción.

## Enfoque recomendado

Tercer flujo `soporte-remoto`: catálogo de 4 transiciones al final de `transitions.ts`, registro en `flujos.ts`,
`Solicitud Soporte` en `estados.ts` con el truco de la misma línea, y el ticket **nace** en `Solicitud Soporte`
cuando la clasificación es «Soporte remoto». `Modalidad` es una columna nueva, fuera de `TICKET_COLS` para que la
sincronización no la pise, fijada en el alta y validada en el servidor.

## Ficheros muy citados

Recuentos del explorador con Grep en modo cuenta, sin Bash; el orquestador los vuelve a medir en tasks.

| Fichero | Citas aprox. | Inserción sin desplazar |
|---|---|---|
| `packages/shared/src/transitions.ts` | 374 | final, tras `:376` |
| `packages/shared/src/estados.ts` | 254 | misma línea `:105` y `:182`; `:185`, `:189` en el sitio |
| `apps/desk/server/services/ticketService.ts` | 487 | en el sitio (`:24`, `:104-107`) |
| `packages/zoho-sync/src/db/schema.sql` | 199 | final, tras `:573` |
| `packages/shared/src/flujos.ts` | 12 | en el sitio; `CATALOGO_POR_FLUJO` gana una línea |
| `packages/shared/src/invariantesGrafo.test.ts` | 62 | `describe` nuevo al final |

## Preguntas abiertas y supuestos

1. Área de las 4 transiciones: supuesto `Servicio Técnico` (mismo s2 que el cambio 1).
2. Espera de `Solicitud Soporte`: supuesto `sin_clasificar`.
3. Campos de las transiciones: supuesto `comment()` y `derivacion()`, como el cambio 1.
4. Modalidad: supuesto fijada en el alta, por defecto `remoto`, sólo lectura después.
5. Sin transición de anulación: se respeta M1.5 tal cual.
6. SR heredados en `En Proceso`/`Pendiente` cambian de flujo (mismo criterio s5 del cambio 1). Cuántos son es dato de producción.
7. Fila #1 de `ticket_transitions`: supuesto `enviar`/`Comercial`, cambia sólo el `to_status`.
