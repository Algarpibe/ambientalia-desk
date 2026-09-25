# Delta for transitions-st

## MODIFIED Requirements

### Requirement: RQ-TS-06 · Orden de las guardas, y qué contesta cada una

`POST /api/tickets/:id/transition` (`routes/tickets.ts:192-194`) **SHALL** exigir sesión
(`routes/tickets.ts:35`) y **SHALL** aplicar las guardas de `executeTransition`
(`services/ticketService.ts:114-223`) **en este orden**, que es el que exige el orden total de
precedencia (§3.8): existencia (A) y estado/permiso (B) antes que contenido (C), y éste antes que
unicidad (D).

| Orden | Guarda | Escalón | Respuesta | Evidencia |
|---|---|---|---|---|
| 1 | La transición existe | A | `400 'Transición desconocida'` | `ticketService.ts:123` |
| 2 | El ticket existe | A | `404 'Ticket no encontrado'` | `:125` |
| 3 | La transición pertenece al flujo aplicable del ticket | B | `409`, mensaje de flujo | `transitions-equipo-nuevo` RQ-EN-05 |
| 4 | El estado actual está en el `from` de la transición | B | `409 '…no aplica desde el estado…'` | `:126-128` |
| 5 | El área del usuario cubre el área de la transición | B | `403 '…no tiene permiso para esta transición…'` | `:129-131` |
| 6 | Los campos obligatorios están presentes | C | `422 { errors: plan.errors }` | `:134` |
| 7 | Una fecha derivada tecleada sin fuente no es una fecha real | C | `422 { errors }` | `:134` (fijada por el diseño; ver `RQ-TS-08`) |
| 8 | La persona a la que se deriva existe y está activa | C | `422 'La persona a la que se deriva no existe o está dada de baja'` | `:138-142` |
| 9 | La orden de venta no está ya asociada a otro ticket | D | `409 '…ya está asociada al ticket #…'` | `:148-152` |

(Previously: ocho filas, sin la guarda 3 de flujo. La añade `blueprint-equipo-nuevo` (F1B-06) al
entrar en juego un segundo catálogo (`transitions-equipo-nuevo`): hasta entonces todo ticket tenía un
único flujo posible y la comprobación no hacía falta. Las guardas 3-7 antiguas pasan a ser 4-8, y la 8
antigua pasa a ser 9.)

(Previously, antes de esa: siete filas, sin la 6 (fecha derivada); evidencias `:117`, `:119`,
`:120-122`, `:123-125`, `:128`, `:140-144` y `:132-136` — caducas contra `4976787`, reancladas por
`fechas-derivadas-servidor`. La guarda 6 antigua (persona) pasó a fila 7; la 7 antigua (OV) pasó a
fila 8.)

El orden **MUST** tenerse en cuenta al probar: una matriz de permisos montada sobre un estado de
origen inválido comprueba el `409` de la guarda 4 y cree comprobar el `403` de la 5
(`permisos.test.ts:29-33`).

> **Given** un ticket en estado `En Proceso`
> **When** se ejecuta `aprobacion`, cuyo único `from` es `Notificación cliente`
> **Then** el servidor responde `409` y no escribe nada.

#### Scenario: La fecha derivada inválida sin fuente responde 422, detrás de los obligatorios
- GIVEN una transición con sus campos obligatorios completos, sin fuente disponible para una de las
  tres fechas derivadas, y un valor tecleado que no es una fecha real (p. ej. `2026-02-30`)
- WHEN se ejecuta la transición
- THEN el servidor responde `422 { errors }`, con el error de esa fecha

#### Scenario: La guarda de flujo (3) gana a la de estado (4) — posición fijada por prueba
- GIVEN un ticket de servicio en `Rev./Diagnostico` (estado ausente del catálogo de `Equipo nuevo`)
- WHEN se ejecuta `Ingreso equipo nuevo` (catálogo `transitions-equipo-nuevo`, `from: [Ingresado]`)
- THEN responde `409` con el mensaje de flujo, no con «no aplica desde el estado» — invertir el orden
  de las guardas 3 y 4 debe poner esta prueba en rojo (regla de mutación 1 de `CLAUDE.md`)

### Requirement: RQ-TS-15 · El reloj del SLA — corrección C11, cerrada en F1A-02

El SLA **SHALL** declararse como **dato**, no derivarse del grafo
(`packages/shared/src/sla.ts`, `SLA_HORAS_POR_ESTADO`). De las 34 transiciones no se deduce que
`Notificado` merezca un día y `Pendiente` no: es una decisión de negocio, igual que
`ESTADOS_SIN_SALIDA`.

- Hoy **SHALL** haber exactamente **uno**: `Notificado`, 24 h. Es el único que el maestro decidió
  (M1.7, `R08.1.md:1570`; punto abierto nº 40), y venía del blueprint de Zoho, que sí lo tiene.
- La unidad **SHALL** ser la **hora**, no el día: el maestro deja abierto en «24/48 h» el plazo de la
  otra regla por tiempo que tiene pensada (`:1586`), y declarar días obligaría a cambiar la unidad el
  día que Gerencia elija 48.
- En el instante **exacto** del vencimiento el SLA **MUST NOT** estar vencido: un plazo de «un día»
  que saltara a las 23:59:59.999 no sería un día. La comparación es estricta
  (`sla.ts`, `slaVencido`; probado en `packages/shared/src/sla.test.ts`).
- El origen del plazo **SHALL** ser la **ÚLTIMA** entrada del ticket a su estado actual, leída de
  `ticket_transitions` (`apps/desk/server/db/sla.ts`). No la primera: `Notificado` está en un ciclo
  con `Rev./Diagnostico` —componente C3 de la tabla de reentrancia— y con la primera, un ticket que
  acaba de volver saldría vencido por una espera que ya terminó.
- Un ticket **sin ninguna fila** en `ticket_transitions` **MUST NOT** reportarse como vencido: no se
  sabe cuándo entró en su estado, y un SLA sobre una fecha desconocida no es un SLA.
  `tickets.created_time` dice cuándo nació el ticket, que es otra cosa. **Esto acota la regla a los
  tickets que la aplicación ha movido**, y en producción los replicados de Zoho no lo están.
- El reloj **MUST NOT** leer `ESTADOS_EN_ESPERA`. El único estado con SLA está clasificado `ninguna`
  (`estados.ts:91`), así que no es ninguno de los **once** de la vista ni de los cuatro sin salida.
  Probado.
- **El reloj MUST NOT aplicarse a un ticket cuyo flujo aplicable no es el de servicio, aunque su
  estado actual coincida en NOMBRE con `Notificado`.** Desde `blueprint-equipo-nuevo` (F1B-06),
  `Notificado` también existe en el catálogo de `Equipo nuevo` (`transitions-equipo-nuevo` RQ-EN-01):
  la consulta de `ticketsConSlaVencido` (`apps/desk/server/db/sla.ts:40-45`) filtra hoy sólo por
  `status`, sin distinguir catálogo, así que **SHALL** excluir los tickets cuyo flujo aplicable
  (`transitions-equipo-nuevo` RQ-EN-04) no sea `servicio` — supuesto s6 de la propuesta.

**Lo que este requisito NO incluye, y sigue abierto — ver §3.10.** Nada de esto **dispara**: no hay
planificador. El destinatario del escalado sí está resuelto, y es `RQ-TS-16`.

*(Previously, hasta el archivado de `vista-todos-y-estados-en-espera` el 2026-09-10: la última viñeta
decía «no es ninguno de los **ocho** de la vista». `ESTADOS_EN_ESPERA` pasa de 8 a 9 con
`Remisión creada` reclasificada a `interna`; `Notificado` no cambia de clase, sigue fuera de las dos
listas.)*

*(Previously, hasta el archivado de `por-entregar-es-espera` el 2026-09-12: el escenario hablaba del
reparto a **9** —la cifra aparecía en su título, en el GIVEN y en el THEN— y nombraba `Remisión creada`
como la entrada que lo llevaba ahí. `ESTADOS_EN_ESPERA` pasa de 9 a 11 con `Por Entregar` y
`Por Entregar / Sin facturar` reclasificados a `externa`; `Notificado` no cambia de clase, sigue fuera
de las dos listas. Las aserciones de `sla.test.ts` no cambian: sólo su título y su comentario pasan de
«nueve» a «once».)*

(Previously, antes de `blueprint-equipo-nuevo`: sin la viñeta de flujo — sólo existía un catálogo y
`Notificado` no tenía homónimo en otro grafo.)

#### Scenario: el estado con SLA sigue fuera de las dos clasificaciones tras el reparto a once
- GIVEN que `ESTADOS_EN_ESPERA` pasa a tener once entradas (`Por Entregar` y
  `Por Entregar / Sin facturar` incluidas)
- WHEN se comprueba la clasificación de `Notificado`, el único estado con SLA declarado
- THEN sigue siendo `'ninguna'` y no pertenece ni a las once de la vista ni a las cuatro de
  `ESTADOS_SIN_SALIDA` — `packages/shared/src/sla.test.ts:50-54` sigue verde sin tocar sus aserciones

#### Scenario: Un ticket `Equipo nuevo` en `Notificado` no cuenta para el SLA de 24 h
- GIVEN un ticket `clasificaciones = 'Equipo nuevo'` que lleva más de 24 h en `Notificado`
- WHEN se calcula `ticketsConSlaVencido`
- THEN el ticket no aparece en la lista, aunque un ticket de servicio en las mismas condiciones sí
  aparecería
