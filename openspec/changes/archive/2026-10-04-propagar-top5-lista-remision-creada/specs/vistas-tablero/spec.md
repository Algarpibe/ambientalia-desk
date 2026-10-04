# Delta para `vistas-tablero`

## ADDED Requirements

### Requirement: RQ-VT-10 · La lista de «Remisión creada» para Comercial se ordena en el servidor por la entrada al estado, la más antigua primero

Gerencia, `decision/cola-del-taller-los-tres-cabos`, punto 4 (`openspec/config.yaml` → `decisiones_de_gerencia`):
«La lista de equipos en «Remisión creada» para Comercial se ordena por el tiempo transcurrido desde que el ticket
entró en ese estado, que es el mismo reloj de la alarma de 3 días hábiles.»

El servidor **SHALL** servir, en un endpoint propio (distinto del listado de activos y de «Mis Tickets»), la lista
de los tickets cuyo estado actual es `Remisión creada`, ordenada así:

1. El instante de entrada al estado, **ascendente**: el ticket que lleva más tiempo en `Remisión creada` va primero.
   Ese instante **SHALL** ser el MISMO que usa la alarma de SLA: la **última** entrada del ticket a su estado actual
   en `ticket_transitions`, la de mayor `(performed_at, id)` (`entradasActuales` de `apps/desk/server/db/sla.ts`).
   Una entrada posterior a OTRO estado no cuenta. El orden por instante ascendente coincide con el orden por tiempo
   hábil transcurrido descendente, porque el tiempo hábil no decrece cuando la entrada es anterior.
2. Un ticket sin ninguna fila de entrada en `ticket_transitions` —el retrato replicado de Zoho que el motor nunca
   movió— **SHALL** ir **al final** de la lista, no omitirse (supuesto S-8).
3. Los empates, y el orden dentro del tramo sin entrada, **SHALL** resolverse por el número de ticket ascendente
   (supuesto SP-3 de la especificación: la decisión de Gerencia no dice cómo desempatar; es reversible).

La prioridad del ticket **MUST NOT** intervenir en este orden: es el reloj de la alarma, no la cola del taller de
`RQ-VT-09`.

- **Qué trae.** **Todos** los tickets en `Remisión creada`, con o sin orden de venta (supuesto S-7; la alarma sólo
  mide los que no la tienen, pero la lista es del estado). Cada ticket con los datos que ya enseñan las demás listas
  del tablero y su **instante de entrada** al estado. Si la pantalla enseña el tiempo transcurrido, **SHALL** traerlo
  calculado por el servidor, con el calendario de cierres de la alarma (supuesto SP-5): el cliente **MUST NOT**
  calcularlo.
- **Quién la ve.** Cualquier usuario con sesión, como el resto de las vistas (supuesto S-9; comentario de
  `boardView.ts:33-36`); «para Comercial» describe a quién sirve, no una guarda de área. Sin sesión se rechaza como
  el resto de las lecturas.
- **Sin N+1.** Los instantes de entrada se **SHALL** leer en una sola consulta para toda la lista.
- **Regla invariable 13.** El orden y el tiempo transcurrido son decisiones del servidor: el cliente **MUST NOT**
  reordenar la lista, la enseña en el orden que recibe (precedente: `RQ-VT-09`, `boardView.test.ts:138-143`). La
  clave nueva de `FUNCTIONAL_VIEWS` y su `case` son comodidad de la pantalla. La acción «Habilitar Servicio», si la
  lista la ofrece, la sigue autorizando el servidor por su guarda existente (estado y área,
  `ticketService.ts:126-131`; `packages/shared/src/transitions.ts:178`): la lista no concede ni quita permiso.

#### Scenario: el más antiguo en el estado va primero
- GIVEN tres tickets en `Remisión creada` que entraron hace 5, 2 y 9 días hábiles
- WHEN se pide la lista
- THEN llegan en el orden de 9, 5 y 2 días

#### Scenario: si entró varias veces, cuenta la última entrada
- GIVEN un ticket con dos entradas a `Remisión creada`, la primera antes y la segunda después que la de otro ticket
- WHEN se pide la lista
- THEN va detrás del otro, y su instante es el de la segunda entrada

#### Scenario: una entrada posterior a otro estado no cuenta
- GIVEN un ticket en `Remisión creada` cuya fila más reciente en `ticket_transitions` es una entrada a otro estado
- WHEN se calcula su instante
- THEN se usa la última entrada a `Remisión creada`, la misma que lee la alarma

#### Scenario: el instante es el mismo que mide la alarma
- GIVEN un ticket en `Remisión creada` sin orden de venta
- WHEN se pide la lista y se calcula `ticketsConSlaVencido` para el mismo ticket
- THEN el instante de entrada de la lista es igual al `desde` de la alarma

#### Scenario: sin fila de entrada, al final y no se omite
- GIVEN dos tickets en `Remisión creada` con entrada y uno sin ninguna fila en `ticket_transitions`
- WHEN se pide la lista
- THEN el sin entrada aparece el último, con su instante de entrada vacío

#### Scenario: con o sin orden de venta, todos entran
- GIVEN un ticket en `Remisión creada` con orden de venta y otro sin ella
- WHEN se pide la lista
- THEN los dos aparecen

#### Scenario: sólo los tickets en `Remisión creada`
- GIVEN un ticket en `Remisión creada`, otro en `Notificado` y uno cerrado
- WHEN se pide la lista
- THEN sólo aparece el de `Remisión creada`

#### Scenario: la prioridad no cambia el orden
- GIVEN un ticket `Low` que entró hace 9 días y otro `Urgent` que entró hace 2
- WHEN se pide la lista
- THEN el `Low` va delante del `Urgent`

#### Scenario: los empates se resuelven por el número de ticket
- GIVEN dos tickets en `Remisión creada` con exactamente el mismo instante de entrada y los números 20 y 10
- WHEN se pide la lista
- THEN el 10 va delante del 20

#### Scenario: cualquier sesión la lee y sin sesión no
- GIVEN un usuario autenticado de cualquier área y una petición sin sesión
- WHEN piden la lista
- THEN el primero la recibe completa y la segunda se rechaza como el resto de las lecturas

#### Scenario: sin N+1
- GIVEN una lista de N tickets en `Remisión creada` y otra de 2N
- WHEN se piden
- THEN el número de consultas a la base es el mismo en las dos

#### Scenario: la vista del cliente no reordena
- GIVEN una lista de «Remisión creada» en el orden del servidor
- WHEN `applyBoardView` la procesa con la clave de esa vista
- THEN devuelve los tickets en el mismo orden y sin filtrarlos ni quitarlos

#### Scenario: «Habilitar Servicio» desde la lista sigue guardado por el servidor
- GIVEN un usuario sin el área que exige esa transición y un ticket de la lista
- WHEN intenta la transición «Habilitar Servicio»
- THEN el servidor la rechaza con la misma guarda de hoy

#### Scenario: la pantalla se verifica a mano (`.tsx` fuera de la red)
- GIVEN la vista nueva del tablero con tickets en `Remisión creada` de distintas antigüedades
- WHEN una persona de Comercial la abre en la aplicación
- THEN ve el más antiguo arriba
- AND la verificación queda anotada con su resultado por esa persona (fuera del recuento de tareas)

## MODIFIED Requirements

### Requirement: RQ-VT-03 · Toda clave de `FUNCTIONAL_VIEWS` la atiende un `case` real, no el respaldo

Cada `key` declarada en `FUNCTIONAL_VIEWS` (`boardView.ts:7-16`) **MUST** estar cubierta por un `case`
explícito de `applyBoardView`, y **MUST NOT** poder caer en `default:`. Sin esta guarda, añadir una
vista al catálogo y olvidar su `case` cae al respaldo en silencio — el mismo molde de defecto que
RQ-VT-02 corrige para una clave inventada por fuera, aplicado ahora al propio catálogo.

#### Scenario: cada key funcional tiene su propio case
- GIVEN la lista `FUNCTIONAL_VIEWS` con sus siete claves (`todos`, `abiertos`, `cerrados`, `espera`,
  `vencidos`, `mios` y la de «Remisión creada», `RQ-VT-10`)
- WHEN se recorre cada `key` con un ticket construido para que esa vista lo muestre
- THEN ninguna de las siete produce el resultado del respaldo (`[]` de `default:`), salvo que ése sea
  legítimamente su resultado declarado (p. ej. `mios` sin `userId`)

#### Scenario: mutación — control del detector
- GIVEN que se quita del `switch` el `case` de una de las siete vistas (p. ej. `case 'cerrados':`)
- WHEN corre esta prueba
- THEN se pone **roja**, nombrando la clave que quedó sin `case`. Si sigue verde, la prueba no
  distingue y no sirve de guarda de este catálogo

#### Scenario: el `case` de «Remisión creada» devuelve la lista tal como llega
- GIVEN la clave de «Remisión creada» y una lista de tickets en el orden del servidor
- WHEN se recorre esa `key` en `applyBoardView`
- THEN devuelve los mismos tickets en el mismo orden, sin reordenarlos ni filtrarlos
- AND quitar su `case` pone roja la prueba de la clave sin `case`
