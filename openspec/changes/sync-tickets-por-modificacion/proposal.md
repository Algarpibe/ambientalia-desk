---
tanda: fuera-del-plan
motivo: "La réplica pierde los cierres y cambios de estado hechos en Zoho: syncRecent sólo relee la primera página por actividad de conversación"
capacidad: [zoho-sync]
maestro: []
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta: sincronizar los tickets por fecha de modificación, no por actividad de conversación

## Intención

`syncRecent` pide sólo la página 1 de `/tickets` ordenada por `-recentThread` (`packages/zoho-sync/src/sync.ts:173-177` en `9822bd7`, vía `fetchTicketPage`, `:138-143`), sin paginar y sin marca de agua. Lo llaman los dos ciclos: `apps/hub-sync/src/hubSync.ts:93` y `apps/desk/server/index.ts:88`. El baseline ya lo registró como c.5 (`docs/sdd/F0-00_Baseline_as-built.md:121`).

Cerrar un ticket o cambiarle el estado en Zoho no genera conversación, así que el ticket no vuelve a esa ventana de 100 y la réplica no se entera. Caso medido: el ticket nº 884 se cerró en Zoho el 2026-10-02 (`modifiedTime` 2026-10-02T19:54:45Z, `statusType: Closed`, comprobado contra Zoho el 2026-10-06) y la réplica lo sigue mostrando abierto. El tablero enseña como pendiente trabajo que ya está cerrado.

## Alcance

### Dentro
- `syncRecent` pasa a pedir «modificados desde la marca de agua» por `/tickets/search` (`modifiedTimeRange`, orden por `modifiedTime`, paginado).
- Caída al comportamiento de hoy, con error explícito en el log, si la búsqueda falla o no hay marca de agua.
- Requisito nuevo en el delta de `zoho-sync` (el último vivo es RQ-ZS-21, `openspec/specs/zoho-sync/spec.md:1156`).
- Barrido de citas de `sync.ts` al cierre (regla de mutación 4).

### Fuera
- Los tickets 689, 880, 881 y 882: también aparecen desfasados, pero su `modifiedTime` en Zoho es anterior a la fecha en que salieron de la ventana, así que esta causa no los explica. Hipótesis: `managed_by_app`. No se resuelven aquí.
- La guarda de `upsertTicket` (`packages/zoho-sync/src/db/repo.ts:71`) y las dos marcas por columna: no cambian.
- Interruptores, escritores nuevos y cambios de esquema: ninguno. Sólo cambia cómo se lee de Zoho.
- Recuperar lo ya perdido: es una tarea de persona (abajo).

## Capacidades

- **Nuevas:** ninguna.
- **Modificadas:** `zoho-sync` — requisito nuevo (RQ-ZS-22, hipótesis de numeración): el incremental de tickets se guía por la fecha de modificación. RQ-ZS-01 y RQ-ZS-04 no cambian.

## Enfoque (supuestos razonables y reversibles; el diseño los cierra)

1. **Marca de agua.** `max(modified_time)` de los tickets de origen Zoho: se excluyen los nacidos en la app (`PREFIJO_TICKET_APP`, `packages/shared/src/transitions.ts:124`) **y las filas con `managed_by_app = true`**. Lo segundo es un hallazgo de esta propuesta: la app escribe `modified_time=now()` con su propio reloj en `packages/zoho-sync/src/db/repo.ts:298` y en `apps/desk/server/db/prioridadCliente.ts:93`, y las dos escrituras marcan `managed_by_app`; sin excluirlas, una transición hecha en la app adelantaría la marca por encima de cambios de Zoho aún sin traer. El patrón de marca de agua ya existe en `syncActivities` (`sync.ts:244-265`) y `syncContacts` (`:266-288`).
2. **Solape.** La ventana empieza un margen antes de la marca (propuesta: 15 minutos, cinco ciclos de 180 000 ms). Cubre la latencia del índice de búsqueda de Zoho (hipótesis, sin medir) y da reintentos a un ticket que falle. Las escrituras son idempotentes.
3. **Orden ascendente.** Con `sortBy=modifiedTime` lo persistido es siempre un prefijo: si se alcanza el tope de `from` (999) o falla una página intermedia, la marca avanza hasta ahí y el ciclo siguiente continúa. Un orden descendente dejaría un hueco.
4. **Réplica vacía o sin marca.** Se conserva el comportamiento de hoy (página 1 por `-recentThread`); la carga inicial sigue siendo de `backfillTickets`. Las pruebas actuales (`packages/zoho-sync/src/sync.test.ts:33-42`) siguen describiendo ese camino.
5. **Fallo de la búsqueda.** Respuesta no-OK o excepción: `console.error` que nombra el endpoint y el código, y ese ciclo cae a la página 1 por `-recentThread`. Nunca peor que hoy.
6. **Forma de la respuesta — decisión del diseño.** `ticketRowFromZoho` lee `customFields`, `description`, `closedTime` y `onholdTime` (`packages/zoho-sync/src/db/mappers.ts:43-57`). Hipótesis sin verificar: la respuesta de búsqueda los trae como la de detalle. Si no los trae, persistirla directamente **vaciaría columnas promovidas**. El diseño lo comprueba con una respuesta real; la salida segura es usar la búsqueda sólo como índice de identificadores y releer cada ticket por detalle, como hace `syncTicket` (`sync.ts:178-182`).
7. **Sin mover líneas citadas.** El cuerpo de `syncRecent` conserva sus cinco líneas y delega en una función declarada al final del fichero, como se hizo con `HistoriaPendiente` (`sync.ts:331-351`). Hay 58 citas `sync.ts:NNN` en 17 ficheros fuera del archivo.
8. **`strict_tdd`.** Rojo previo por camino, y mutaciones: quitar la exclusión de `managed_by_app`, quitar la caída, invertir el orden.

## Áreas afectadas

| Área | Impacto |
|---|---|
| `packages/zoho-sync/src/sync.ts` | Modificado: `syncRecent` y función nueva al final |
| `packages/zoho-sync/src/sync.test.ts` (o fichero de pruebas hermano) | Pruebas nuevas |
| `openspec/changes/sync-tickets-por-modificacion/specs/zoho-sync/spec.md` | Delta |

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| El token no tiene el permiso de búsqueda (`Desk.search.READ`): hipótesis, el repositorio no registra los scopes | Media | La caída del punto 5 deja el sistema como hoy y el log lo dice; ampliar el permiso es tarea de persona |
| La búsqueda devuelve un ticket recortado y se vacían columnas | Media | Punto 6: se decide con una respuesta real antes de escribir código |
| Un ticket falla al persistir (`persistEach` lo aísla, `sync.ts:126-136`) y la marca avanza por encima de él | Baja | El solape lo reintenta cinco ciclos y el fallo queda en el log (`sync.ts:132`); después sólo vuelve si Zoho lo modifica. Igual que hoy, no peor. Se acepta y se declara |
| Releer por detalle tras una parada larga dispara muchas peticiones (`zohoFetch` no reintenta ante un 429) | Baja | Tope por ciclo; el orden ascendente permite continuar |
| La cita `sync.ts:173-177` (en `9822bd7`) sigue existiendo pero deja de decir «sólo la página 1» | Alta | Barrido al cierre leyendo qué afirma cada frase (casos A, B y C) |

## Reversión

Revertir el commit de fusión devuelve `syncRecent` a la página 1. Sin migración, sin datos que deshacer: lo escrito son las mismas filas que escribiría `backfillTickets`.

## Dependencias

Permiso de búsqueda en el token OAuth del worker y de la App (hipótesis sin verificar).

## Tareas de persona (fuera del recuento; archivar NO las da por hechas)

| Tarea | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|
| Ejecutar `backfillTickets` una vez tras desplegar: la marca de agua no recupera lo perdido, porque el máximo de la réplica ya pasó del 2 de octubre | Responsable del despliegue | Tras desplegar | Informe de archivo de este cambio |
| Comprobar en el log del primer ciclo que la búsqueda no cae; si cae por permisos, ampliar el scope del token | Responsable del despliegue | Tras desplegar | Informe de archivo de este cambio |
| Comprobar que el ticket nº 884 figura cerrado | Responsable del despliegue | Tras el relleno | Informe de archivo de este cambio |

## Criterios de éxito

- [ ] Un ticket modificado en Zoho sin conversación nueva y fuera de la ventana de 100 llega a la réplica en el ciclo siguiente.
- [ ] Con más de 100 modificados, se paginan todos; al alcanzar el tope, el ciclo siguiente continúa.
- [ ] Una transición hecha en la app no adelanta la marca de agua.
- [ ] Si la búsqueda falla, hay un error explícito en el log y el ciclo se comporta como hoy.
- [ ] Ninguna columna promovida se vacía por venir de la búsqueda.
- [ ] Ninguna cita `sync.ts:NNN` queda desfasada o afirmando algo falso.
