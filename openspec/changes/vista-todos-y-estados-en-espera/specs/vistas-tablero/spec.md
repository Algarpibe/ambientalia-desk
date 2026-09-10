# Capacidad `vistas-tablero` — qué promete cada vista funcional del tablero

| Dato | Valor |
|---|---|
| Capacidad | `vistas-tablero` (nueva) |
| Cubre | `FUNCTIONAL_VIEWS`, `viewLabel`, `applyBoardView` (`apps/desk/src/lib/boardView.ts`) — qué tickets devuelve cada vista y qué rótulo promete, incluida una clave desconocida |
| Tanda que la escribe | `vista-todos-y-estados-en-espera` (F1B-08) |
| Depende de | `packages/shared/src/estados.ts` (`ESTADOS_EN_ESPERA`, `enEsperaDe`) |
| Fuente en el maestro | *Hipótesis*: ítem 22 «Interfaz que replica la estructura de Zoho Desk», citado de segunda mano vía `openspec/config.yaml:328-329`. No verificado contra el `.md` del maestro en esta sesión |

## Purpose

`applyBoardView` decide, para cada vista del Sidebar, qué subconjunto de tickets se enseña y bajo qué
promesa (`viewLabel`). Antes de esta tanda, dos vistas prometían algo distinto de lo que devolvían:
«Todos» ocultaba los cerrados (`boardView.ts:49-50`) y una clave desconocida heredaba en silencio el
cuerpo de «Todos» (`:22`, `:49-50`). Esta capacidad fija, vista a vista, qué promete el rótulo y qué
debe devolver la función — incluida la clave que no reconoce, y el hueco de cobertura que permitía que
una vista nueva se olvidara de su propio `case`.

## Requirements

### Requirement: RQ-VT-01 · «Todos» devuelve activos y cerrados, en dos bloques sin entrelazar

La vista `todos` **SHALL** devolver los tickets activos y los tickets cerrados, con los activos
**primero** y los cerrados **después**, sin intercalarlos por fecha de creación. El indicador de la
vista **SHALL** declarar el `total` de cerrados que reporta el servidor
(`countClosedTickets`, `packages/zoho-sync/src/db/repo.ts:145-148`), no una cuenta local de lo ya
cargado. El bloque de cerrados **SHALL** respetar la paginación que el servidor impone
(`pageSize = 50`, `apps/desk/server/routes/tickets.ts:106`; probado en `apps/desk/server/tickets.test.ts:84`).

(Previamente: `case 'todos':` compartía cuerpo con `default:` y devolvía
`tickets.filter((t) => t.statusType !== 'Closed')` — `boardView.ts:49-50` —, así que sólo mostraba
activos.)

#### Scenario: activos y cerrados, sin entrelazar
- GIVEN una lista de tickets activos y una lista de tickets cerrados, ya obtenidas por separado
- WHEN se compone la vista `todos`
- THEN el resultado empieza por los activos y termina con los cerrados, en ese orden, sin ningún
  cerrado intercalado entre activos por fecha

#### Scenario: el rótulo declara el total real de cerrados
- GIVEN que el servidor reporta 726 tickets cerrados vía `countClosedTickets`
- WHEN se muestra la vista `todos`
- THEN el indicador de la vista usa ese `total`, no la cantidad de cerrados ya cargados en la página
  actual

#### Scenario: el bloque de cerrados respeta la paginación del servidor
- GIVEN que el servidor fija `pageSize = 50` para los cerrados
- WHEN se pide una página de cerrados para «Todos»
- THEN el cliente pinta como máximo `pageSize` cerrados por página y no asume ningún tamaño propio

### Requirement: RQ-VT-02 · Una clave de vista desconocida no hereda el cuerpo de «Todos»

`case 'todos':` y `default:` **MUST NOT** compartir cuerpo. Una clave que no está en
`FUNCTIONAL_VIEWS` **SHALL** devolver una lista **vacía**, y `viewLabel` para esa misma clave
**SHALL** devolver `'Vista no reconocida'`.

(Previamente: `default:` caía en el mismo `return` que `todos` — `boardView.ts:49-50` — y `viewLabel`
caía en `'Todos los Tickets'` — `:22` —, así que una clave desconocida enseñaba el tablero entero bajo
el rótulo más poblado, la misma mentira que la rama `mios` evita a propósito para el usuario sin
sesión.)

#### Scenario: clave desconocida devuelve lista vacía
- GIVEN una clave de vista que no está en `FUNCTIONAL_VIEWS` (p. ej. `'zzz'`)
- WHEN se llama `applyBoardView(tickets, 'zzz', now)`
- THEN el resultado es `[]`

#### Scenario: clave desconocida no promete un rótulo poblado
- GIVEN esa misma clave desconocida
- WHEN se llama `viewLabel('zzz')`
- THEN el resultado es `'Vista no reconocida'`
- (Rojo ya escrito: `apps/desk/src/lib/boardView.test.ts:56` afirma hoy `toBe('Todos los Tickets')` y
  se pone rojo solo al cambiar el respaldo. Es el escenario; no se añade una prueba nueva para esto)

#### Scenario: mutación — control de la separación
- GIVEN que se revierte la separación y `case 'todos':` vuelve a compartir cuerpo con `default:`
- WHEN corre la suite de `boardView.test.ts`
- THEN fallan **exactamente dos** pruebas: la de «todos incluye los cerrados» (RQ-VT-01) y la de
  «clave desconocida devuelve vacío» (este requisito). Si falla una sola o ninguna, las dos ramas no
  están fijadas por separado

### Requirement: RQ-VT-03 · Toda clave de `FUNCTIONAL_VIEWS` la atiende un `case` real, no el respaldo

Cada `key` declarada en `FUNCTIONAL_VIEWS` (`boardView.ts:6-15`) **MUST** estar cubierta por un `case`
explícito de `applyBoardView`, y **MUST NOT** poder caer en `default:`. Sin esta guarda, añadir una
vista al catálogo y olvidar su `case` cae al respaldo en silencio — el mismo molde de defecto que
RQ-VT-02 corrige para una clave inventada por fuera, aplicado ahora al propio catálogo.

#### Scenario: cada key funcional tiene su propio case
- GIVEN la lista `FUNCTIONAL_VIEWS` con sus seis claves (`todos`, `abiertos`, `cerrados`, `espera`,
  `vencidos`, `mios`)
- WHEN se recorre cada `key` con un ticket construido para que esa vista lo muestre
- THEN ninguna de las seis produce el resultado del respaldo (`[]` de `default:`), salvo que ése sea
  legítimamente su resultado declarado (p. ej. `mios` sin `userId`)

#### Scenario: mutación — control del detector
- GIVEN que se quita del `switch` el `case` de una de las seis vistas (p. ej. `case 'cerrados':`)
- WHEN corre esta prueba
- THEN se pone **roja**, nombrando la clave que quedó sin `case`. Si sigue verde, la prueba no
  distingue y no sirve de guarda de este catálogo

### Requirement: RQ-VT-04 · «Espera» y «Abiertos» clasifican por el registro de dominio, no por el nombre del estado

`applyBoardView` **SHALL** clasificar un ticket como «en espera» con `enEsperaDe(estado)`
(`packages/shared/src/estados.ts:158-162`, sobre `ESTADOS_EN_ESPERA`, `estados.ts:111`), y
**MUST NOT** usar ninguna expresión regular sobre `status`. Es la regla invariable 13, punto 1: la
clasificación existe en `packages/shared` y el cliente la consume.

(Previamente: `const enEspera = (t) => /espera/i.test(t.status ?? '')` — `boardView.ts:35` —
reconocía 2 de los 8 estados que el registro declaraba en espera.)

#### Scenario: los seis estados que se escapaban aparecen bajo «espera» y no bajo «abiertos»
- GIVEN tickets abiertos en cada uno de los seis estados que la regex vieja no reconocía
  (`Servicio externo`, `Notificación cliente`, `Notificación a Compras`, `Notificación Comercial`,
  `Solicitado`, `Liberación Comercial`)
- WHEN se filtra por `espera` y por `abiertos`
- THEN los seis aparecen en `espera` y ninguno aparece en `abiertos`

#### Scenario: mutación — el fichero vigilado, no una copia
- GIVEN que se revierte `boardView.ts:35` a `/espera/i`, con el registro de `estados.ts` ya existente
- WHEN corren dos detectores: el tripwire nuevo (importa `applyBoardView` y afirma sobre su salida) y
  el viejo (`packages/shared/src/estados.test.ts:113-121`, que reimplementa la regex localmente)
- THEN el nuevo se pone rojo y el viejo se queda verde. Esa discrepancia demuestra que el viejo
  vigilaba una copia del código, no el código (ver capacidad `transitions-st`, requisito 3.6)

#### Scenario: fixture corregido, prueba por la razón correcta
- GIVEN que el fixture de `boardView.test.ts:11` usaba `'En espera de repuesto'`, un estado que no
  existe en el registro (el real es `'En Espera de Repuestos'`, `estados.ts:61`)
- WHEN se corrige el fixture a la cadena real
- THEN `boardView.test.ts:20` y `:21` — hoy verdes por casualidad, porque la regex vieja también
  casaba con la cadena inventada — quedan verdes contra el registro real, no contra la coincidencia
  accidental

### Requirement: RQ-VT-05 · Un ticket cerrado nunca aparece bajo «Espera»

La vista `espera` **MUST NOT** devolver ningún ticket con `statusType === 'Closed'`, aunque su
`status` esté en `ESTADOS_EN_ESPERA`.

#### Scenario: cerrado en un estado de espera no aparece en «espera» — hueco de detector cerrado
- GIVEN un ticket con `statusType: 'Closed'` y `status` en `ESTADOS_EN_ESPERA` (p. ej. `'Solicitado'`)
- WHEN se filtra por `espera`
- THEN el ticket no aparece
- (Hoy el fixture de `boardView.test.ts` no tiene ningún `Closed` en estado de espera, así que quitar
  el filtro de cerrados de la rama `espera` — `boardView.ts:44` — no lo detecta nadie. Este escenario
  cierra ese hueco)

### Requirement: RQ-VT-06 · El color de la tarjeta refleja el estado real (verificación manual)

`TicketCard` **SHALL** pintar con color el estado real del ticket, no el respaldo neutro
`bg-slate-100`, para al menos los estados alcanzables en producción hoy. La causa del mapa muerto son
las claves del mapa (`TicketCard.tsx:14-23`): son los valores de `status` del array simulado
(`apps/desk/src/data/mockData.ts:11`, `:48`, `:60`, `:85`, `:97`, `:110`, `:122`, `:134`), no los
nombres reales del dominio. El import de `TicketCard.tsx:2` **no** es la causa: `mockData.ts:1-2`
reexporta el mismo tipo `Ticket` de `@ambientalia/shared`.

**Excepción declarada, no carencia.** Este requisito **no admite escenario automatizado** bajo
`strict_tdd`: `vitest.config.ts:16-20` excluye los `.tsx` de `apps/desk/src` de la red de pruebas por
decisión explícita de Gerencia (F0-00, 2026-09-08), fuera de alcance de esta tanda. **No** se propone
`jsdom` ni `@testing-library`, ni ampliar el include a `*.test.tsx`.

#### Scenario: manual — verificación por una persona
- GIVEN el tablero en `ambientalia-desk.ambientalia.cloud`, modo «estado»
- WHEN se inspecciona al menos un ticket en `En Proceso` y uno en `Notificación cliente`
- THEN los dos pintan con su color propio y no con `bg-slate-100`
- Verificación anotada con su resultado por una persona, no por una prueba automatizada
