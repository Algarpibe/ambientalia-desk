# Capacidad `vistas-tablero` — qué promete cada vista funcional del tablero

| Dato | Valor |
|---|---|
| Capacidad | `vistas-tablero` (nueva) |
| Cubre | `FUNCTIONAL_VIEWS`, `viewLabel`, `applyBoardView` (`apps/desk/src/lib/boardView.ts`) — qué tickets devuelve cada vista y qué rótulo promete, incluida una clave desconocida |
| Tanda que la escribe | `vista-todos-y-estados-en-espera` (F1B-08) |
| Depende de | `packages/shared/src/estados.ts` (`ESTADOS_EN_ESPERA`; NO de `enEsperaDe`, ver RQ-VT-04) |
| Fuente en el maestro | Ítem **22** del **§3.2 «MVP — P0 · *Control y ejecución*»**: «Interfaz que replica la estructura de Zoho Desk con blueprints controlados» (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.1.md:2978`; su registro completo es `:2977-2982`, en la tabla que abre en `:2851` con columnas `#`/`Funcionalidad`/`Módulo`/`Eje`/`Valor`/`Complejidad`). **Verificado contra el `.md` del maestro el 2026-09-13**, ya no es cita de segunda mano. ⚠️ Pero ese §3.2 está marcado `[EN REVISIÓN — R08]` (`:2841`) y el maestro dice que la tabla «se mantiene como está, sin retocar» hasta esa sesión (`:2842`): el ítem es la fuente, y la fuente está pendiente de revisar |

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
(`countClosedTickets`, `packages/zoho-sync/src/db/repo.ts:172-175`), no una cuenta local de lo ya
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
- **Excepción declarada, no carencia — cerrada en el archivado.** `Pagination.tsx:6` pinta este rótulo
  con el `total` que `App.tsx:138` recibe del servidor. Como `RQ-VT-06`, no admite escenario
  automatizado bajo `strict_tdd`: los dos ficheros son `.tsx`, fuera de `vitest.config.ts:16-20` por
  decisión de Gerencia (F0-00). Verificación MANUAL, dueño QA / quien despliegue. El `verify-report`
  de esta tanda encontró que `tasks.md` («Fuera del recuento») declaraba esta excepción para el
  escenario hermano (sin entrelazar, fila 5) pero no para éste; `tasks.md` queda congelado tal cual se
  archivó — la declaración que faltaba queda registrada aquí y en
  `sdd/vista-todos-y-estados-en-espera/archive-report`

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
- (Antes de esta tanda, `apps/desk/src/lib/boardView.test.ts:90` afirmaba `toBe('Todos los Tickets')`
  — ROJO al cambiar el respaldo. Hoy afirma `toBe('Vista no reconocida')`, en verde. Fue el escenario;
  no se añadió una prueba nueva para esto)

#### Scenario: mutación — control de la separación
- GIVEN que se revierte la separación y `case 'todos':` vuelve a compartir cuerpo con `default:`
- WHEN corre la suite de `boardView.test.ts`
- THEN fallan **exactamente dos** pruebas: la de «todos incluye los cerrados» (RQ-VT-01) y la de
  «clave desconocida devuelve vacío» (este requisito). Si falla una sola o ninguna, las dos ramas no
  están fijadas por separado

### Requirement: RQ-VT-03 · Toda clave de `FUNCTIONAL_VIEWS` la atiende un `case` real, no el respaldo

Cada `key` declarada en `FUNCTIONAL_VIEWS` (`boardView.ts:7-16`) **MUST** estar cubierta por un `case`
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

`applyBoardView` **SHALL** clasificar un ticket como «en espera» consultando el registro de dominio
`ESTADOS_EN_ESPERA` (`packages/shared/src/estados.ts:120`) a través de un predicado compartido, en un
módulo propio de `apps/desk/src/lib` (forma propuesta en `proposal.md §3`: `enEspera.ts`,
`esEstadoEnEspera(status?: string | null): boolean`; la confirma `sdd-design`) — hoy inline en
`boardView.ts:39` como `(ESTADOS_EN_ESPERA as readonly string[]).includes(t.status ?? '')` —, y
**MUST NOT** usar ninguna expresión regular sobre `status`. Es la regla invariable 13, punto 1: la
clasificación existe en `packages/shared` y el cliente la consume.

El predicado compartido **SHALL** tener EXACTAMENTE **dos** consumidores, los dos que CLASIFICAN:
`boardView.ts:39` (vistas `espera` y `abiertos`, `:47-48`) y `ClienteDetalle.tsx:18` (sub-vista de
espera de la ficha de cliente, consumida en `:96` y en la sub-vista de `:98`). El requisito
**MUST NOT** extenderse a quien PINTA: `ClienteDetalle.tsx:22` (dentro de `badgeClass`) y
`TicketDetailView.tsx:245` (`/espera|hold/i` en el `className`) deciden color, no clasificación, y
**SHALL** conservar su propia expresión regular — decisión de Gerencia, Q1: `Por Entregar` no es un
atasco (el equipo está listo, falta que el cliente venga) y el propio tablero ya lo pinta azul
(`TicketCard.tsx:21`). `ClienteDetalle.tsx` **SHALL** llevar un comentario junto a `:18`/`:22` que
declare deliberada la divergencia entre las dos líneas y su porqué: sin él, el siguiente lector las
unifica y reintroduce el ámbar que Q1 rechazó.

**Se hereda la decisión D3 de `design.md`, no se reabre.** `enEsperaDe(estado)`
(`packages/shared/src/estados.ts:169-173`) devuelve la CLASE (`externa | interna | ninguna |
sin_clasificar`), no un booleano, y consumirla obligaría al cliente a reescribir el criterio «externa
o interna» que `estados.ts` ya posee — el mismo defecto IV-1 movido un metro. Esta tanda sólo traslada
el `.includes()` ya existente a un módulo propio y le añade el segundo consumidor que ya clasificaba
con su propia regex; no cambia el criterio.

(Previously: el predicado vivía inline en `boardView.ts:39`, con **un** consumidor. `ClienteDetalle.tsx:18`
implementaba su propia copia con `/espera/i`, acertando 2 de los 9 estados vigentes antes de esta
tanda.)

#### Scenario: los seis estados que se escapaban aparecen bajo «espera» y no bajo «abiertos»
- GIVEN tickets abiertos en cada uno de los seis estados que la regex vieja no reconocía
  (`Servicio externo`, `Notificación cliente`, `Notificación a Compras`, `Notificación Comercial`,
  `Solicitado`, `Liberación Comercial`)
- WHEN se filtra por `espera` y por `abiertos`
- THEN los seis aparecen en `espera` y ninguno aparece en `abiertos`

#### Scenario: mutación — el fichero vigilado, no una copia (evidencia histórica de la implementación)
- GIVEN que, durante la implementación, se revirtió temporalmente `boardView.ts:39` a `/espera/i`, con
  el registro de `estados.ts` ya existente
- WHEN corrieron dos detectores: el tripwire nuevo (importa `applyBoardView` y afirma sobre su salida)
  y el viejo, que entonces vivía en `packages/shared/src/estados.test.ts:113-121` y reimplementaba la
  regex localmente
- THEN el nuevo se puso rojo y el viejo se quedó verde. Esa discrepancia demostró que el viejo vigilaba
  una copia del código, no el código (ver capacidad `transitions-st`, requisito 3.6). El tripwire viejo
  **ya no existe**: se retiró al cerrar IV-1, y este escenario no es repetible tal cual hoy — queda
  como registro de la evidencia que cerró el hallazgo

#### Scenario: fixture corregido, prueba por la razón correcta
- GIVEN que el fixture de `boardView.test.ts:11` usaba `'En espera de repuesto'`, un estado que no
  existe en el registro (el real es `'En Espera de Repuestos'`, `estados.ts:61`)
- WHEN se corrige el fixture a la cadena real
- THEN `boardView.test.ts:20` y `:21` — hoy verdes por casualidad, porque la regex vieja también
  casaba con la cadena inventada — quedan verdes contra el registro real, no contra la coincidencia
  accidental

#### Scenario: los dos estados de entrega entran en «espera» y no en «abiertos»
- GIVEN un ticket abierto en `Por Entregar` y otro en `Por Entregar / Sin facturar`, los dos con
  `statusType` distinto de `'Closed'`
- WHEN se filtra por `espera` y por `abiertos`
- THEN los dos aparecen en `espera` y ninguno aparece en `abiertos`

#### Scenario: la ficha de cliente cuenta un `Por Entregar` bajo «espera»
- GIVEN un cliente con un ticket en `Por Entregar`
- WHEN se consulta la sub-vista «espera» de `ClienteDetalle.tsx:96` (`tickets.filter(esEspera)`, tras
  consumir el módulo compartido)
- THEN ese ticket aparece en esa sub-vista

#### Scenario: el límite se mantiene — el color no se mueve
- GIVEN un ticket en `Por Entregar`
- WHEN se evalúan `ClienteDetalle.tsx:22` (`badgeClass`) y `TicketDetailView.tsx:245`
- THEN los dos siguen devolviendo su clase de color por omisión — azul (`bg-blue-50 text-blue-600
  border-blue-200` y `bg-blue-500` respectivamente) — y no la de ámbar, porque ninguna de las dos
  expresiones regulares (`/espera/i`, `/espera|hold/i`) casa con `'Por Entregar'`

#### Scenario: el comentario que declara la divergencia deliberada existe
- GIVEN `ClienteDetalle.tsx:18` (clasifica, consume el módulo compartido) y `:22` (pinta, conserva
  `/espera/i`)
- WHEN se inspecciona el fichero
- THEN hay un comentario junto a esas líneas que declara la divergencia deliberada entre las dos y su
  porqué — verificable por lectura o por `grep`, no por `vitest`: el fichero es `.tsx` y queda fuera de
  la red de pruebas (`vitest.config.ts:16`, `:17-20`; F0-00, decisión que esta tanda no reabre)

### Requirement: RQ-VT-05 · Un ticket cerrado nunca aparece bajo «Espera»

La vista `espera` **MUST NOT** devolver ningún ticket con `statusType === 'Closed'`, aunque su
`status` esté en `ESTADOS_EN_ESPERA`.

#### Scenario: cerrado en un estado de espera no aparece en «espera» — hueco de detector cerrado
- GIVEN un ticket con `statusType: 'Closed'` y `status` en `ESTADOS_EN_ESPERA` (p. ej. `'Solicitado'`)
- WHEN se filtra por `espera`
- THEN el ticket no aparece
- (Antes de esta tanda, el fixture de `boardView.test.ts` no tenía ningún `Closed` en estado de
  espera, así que quitar el filtro de cerrados de la rama `espera` — `boardView.ts:48` — no lo
  detectaba nadie. Este escenario cierra ese hueco)

#### Scenario: los dos estados de entrega, cerrados, tampoco aparecen en «espera»
- GIVEN un ticket con `statusType: 'Closed'` y `status: 'Por Entregar'`, y otro con
  `statusType: 'Closed'` y `status: 'Por Entregar / Sin facturar'`
- WHEN se filtra por `espera`
- THEN ninguno de los dos aparece: el filtro de cerrados (`boardView.ts:48`) sigue aplicándose ANTES
  de comprobar la clasificación, también para los dos estados nuevos (regla de mutación 1 — M3 de
  `proposal.md §6` exige que quitar ese orden ponga esto en rojo)

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

### Requirement: RQ-VT-07 · «Esperando aprobación del cliente»: marca de vista calculada por el servidor

El listado de tickets que sirve el servidor **SHALL** traer un campo booleano (nombre y forma los fija el
diseño) que sea **verdadero** cuando el ticket está **hoy** en `Notificación cliente` y existe la marca de
alarma (`derivacion-avisos` RQ-AV-16) de `Notificación cliente` para su **entrada actual**
(supuesto S-12); en cualquier otro caso **SHALL** ser falso.

- Es una **marca de vista, no un estado**: el ticket **MUST NOT** cambiar de estado ni escribir en
  `ticket_transitions` por esta marca (`decision/anexo-3-alerta`, `openspec/config.yaml:2329`, consecuencia 4).
- Al **salir** del estado, el campo **SHALL** volver a falso; al **reentrar**, **SHALL** ser falso hasta que
  la nueva entrada venza y se marque.
- La marca se escribe al vencer aunque no haya nadie con el cargo (`derivacion-avisos` RQ-AV-15, S-4 revisado):
  la señal del tablero **MUST NOT** depender de que exista el destinatario.
- **Regla invariable 13:** el servidor **SHALL** decidir la marca; el cliente **MUST NOT** recalcular el
  vencimiento ni el calendario.
- Un estado distinto de `Notificación cliente` **MUST NOT** producir la marca aunque su alarma esté vencida
  (`Notificado`, `Remisión creada`).

#### Scenario: vencido en `Notificación cliente` con marca, el listado lo señala
- GIVEN un ticket en `Notificación cliente` con más de 36 h hábiles y la marca de su entrada actual
- WHEN se pide el listado de tickets
- THEN el ticket trae el campo en verdadero

#### Scenario: en `Notificación cliente` sin vencer, no
- GIVEN un ticket en `Notificación cliente` con 36 h hábiles exactas y sin marca
- WHEN se pide el listado
- THEN el campo es falso

#### Scenario: al salir del estado deja de traerla
- GIVEN el ticket anterior con marca, que ejecuta una transición y sale de `Notificación cliente`
- WHEN se pide el listado
- THEN el campo es falso, aunque la fila de marca siga existiendo

#### Scenario: al reentrar no hereda la marca de la entrada anterior
- GIVEN el mismo ticket, que vuelve a `Notificación cliente` y aún no vence
- WHEN se pide el listado
- THEN el campo es falso, porque la marca es de la entrada anterior

#### Scenario: otro estado vencido no produce la marca
- GIVEN un ticket vencido y marcado en `Notificado`
- WHEN se pide el listado
- THEN el campo es falso

#### Scenario: el cliente no decide
- GIVEN el listado con el campo en verdadero para un ticket
- WHEN el cliente lo consume
- THEN sólo lo pinta; no lee el calendario ni compara horas (verificación por lectura del `.tsx`)

### Requirement: RQ-VT-08 · La marca del tablero se pinta, y se verifica a mano (`.tsx` fuera de la red)

`TicketCard.tsx` **SHALL** pintar la marca de `RQ-VT-07` de forma visible y con texto en español
(«esperando aprobación del cliente»). Como el fichero es `.tsx`, queda **fuera de la red de pruebas** por
decisión de Gerencia (F0-00, `vitest.config.ts:16-20`): la prueba automatizada vive en el servidor
(`RQ-VT-07`), y este requisito **no admite escenario automatizado**. **No** se propone `jsdom` ni
`@testing-library`.

#### Scenario: manual — verificación por una persona
- GIVEN el tablero en `ambientalia-desk.ambientalia.cloud`, tras el despliegue, y un ticket vencido en `Notificación cliente`
- WHEN se inspecciona su tarjeta
- THEN muestra la marca «esperando aprobación del cliente» y un ticket no vencido no la muestra
- Verificación anotada con su resultado por una persona (tarea P.2 de la propuesta)

### Requirement: RQ-VT-09 · La cola del taller («Mis Tickets» y el tablero) se ordena en el servidor por urgencia y habilitación comercial

El servidor SHALL servir ordenadas por la MISMA función de `packages/shared` las dos listas de la cola del taller:
el listado de activos que pinta el tablero (`GET /api/tickets`) y «Mis Tickets» —los tickets no cerrados derivados al
usuario de la sesión, la misma noción que hoy filtra `apps/desk/src/lib/boardView.ts:44-46`—. El orden SHALL ser:

1. Primero la prioridad: `Urgent > High > Medium > Low > sin prioridad`. Un valor que no sea uno de esos cuatro
   (vacío, `null` o desconocido) SHALL contar como «sin prioridad».
2. Dentro de una misma prioridad, la fecha y hora de la transición `habilitar_servicio`, **ascendente** (el que
   Comercial habilitó antes va delante).
   - Si el ticket la ejecutó más de una vez, SHALL contar la **última** (S-10a).
   - Si no tiene esa fila, SHALL contar su `created_time` (S-10b). Sin ninguna de las dos fechas, va al final de su
     prioridad.

- Las fechas de habilitación SHALL leerse en una sola consulta para toda la lista, no una por ticket (sin N+1).
- El predicado «es de Mis Tickets» SHALL tener una sola implementación, en `packages/shared`, que consumen el
  servidor y `applyBoardView`. Dos implementaciones de la misma noción es el molde H5.
- **Regla invariable 13:** el cliente MUST NOT reordenar ninguna de las dos listas: las enseña en el orden que recibe.
- No es una regla de visibilidad: el listado de activos sigue sirviendo todos los tickets a todo el mundo (comentario
  de `boardView.ts:33-36`).

#### Scenario: de más a menos urgente
- GIVEN cinco tickets abiertos derivados al usuario, con prioridad `Low`, `null`, `Urgent`, `Medium` y `High`
- WHEN el usuario pide «Mis Tickets»
- THEN llegan en el orden `Urgent`, `High`, `Medium`, `Low`, sin prioridad

#### Scenario: dentro de una prioridad, el que se habilitó antes
- GIVEN dos tickets `High` derivados al usuario, el primero creado después pero habilitado antes que el segundo
- WHEN el usuario pide «Mis Tickets»
- THEN el habilitado antes va delante, aunque se creara después

#### Scenario: si se habilitó dos veces, cuenta la última
- GIVEN un ticket `High` habilitado dos veces, la primera antes y la segunda después que otro ticket `High`
- WHEN se pide la cola
- THEN va detrás del otro

#### Scenario: sin fila de habilitación cuenta la creación
- GIVEN un ticket `High` sin fila de `habilitar_servicio`, creado entre las habilitaciones de otros dos `High`
- WHEN se pide la cola
- THEN queda entre los dos

#### Scenario: la urgencia manda sobre la habilitación
- GIVEN un ticket `Low` habilitado antes que un ticket `High`
- WHEN se pide la cola
- THEN el `High` va delante

#### Scenario: un valor desconocido cuenta como sin prioridad
- GIVEN tickets derivados al usuario con prioridad `Alta`, `''` y `null`, y uno `Low`
- WHEN el usuario pide «Mis Tickets»
- THEN el `Low` va primero y los otros tres detrás, entre ellos por su habilitación

#### Scenario: sólo los suyos y abiertos
- GIVEN un ticket derivado a otro usuario, uno cerrado derivado al usuario y uno sin derivar
- WHEN el usuario pide «Mis Tickets»
- THEN ninguno de los tres aparece

#### Scenario: el tablero se ordena con la misma función
- GIVEN los mismos tickets
- WHEN se pide el listado de activos
- THEN llegan todos, en el orden de la cola del taller

#### Scenario: sin N+1
- GIVEN una lista de activos de N tickets y otra de 2N
- WHEN se piden
- THEN el número de consultas a la base es el mismo en las dos

#### Scenario: la vista del cliente no reordena
- GIVEN una lista de «Mis Tickets» en el orden del servidor
- WHEN `applyBoardView` la filtra con la clave `mios`
- THEN devuelve los tickets en el mismo orden y con el mismo predicado que el servidor
