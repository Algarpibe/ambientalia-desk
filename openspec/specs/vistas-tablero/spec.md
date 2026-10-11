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

### Requirement: RQ-VT-11 · El listado se busca en el servidor por número de ticket y por serial

`GET /api/tickets` y `GET /api/mis-tickets` **SHALL** aceptar un parámetro `q`. El filtro **SHALL** aplicarlo el
**servidor**, en la consulta, sobre tres poblaciones: los tickets activos (`scope` distinto de `closed`), los
cerrados paginados **y su recuento** (`scope=closed`) y «Mis tickets». Hoy el endpoint sólo lee `scope` y `page`
(`apps/desk/server/routes/tickets.ts:104-116`, medido en la propuesta §1).

**Cómo se normaliza `q`** (una sola función de `packages/shared`, ver `RQ-VT-12`):

1. Se recortan los espacios de los dos extremos; los interiores se conservan **[SUPUESTO S-3]**.
2. Un `q` vacío tras recortar **SHALL** significar «sin búsqueda»: la respuesta es la misma que sin `q`.
3. Más de 64 caracteres tras recortar **SHALL** responder `422` **[SUPUESTO S-7, S-9]**. Un `q` que no es una cadena
   única **SHALL** responder `422` **[SUPUESTO S-10]**. No hay mínimo de caracteres en el servidor **[SUPUESTO S-8]**.

**Cómo coincide el número:** el ticket coincide por número cuando `q`, recortado y quitado **un** `#` inicial, son
sólo dígitos, caben en un `integer` y son **iguales** a `tickets.number` **[SUPUESTO S-1]**: «864» y «#864»
encuentran el 864; «86» no lo encuentra por número. Un `q` de dígitos que no cabe en `integer` **SHALL NOT** romper
la consulta: busca sólo por serial.

**Cómo coincide el serial** (letra: parcial, «los últimos dígitos»): el ticket coincide cuando el texto recortado y
en minúsculas está **contenido** en el serial en minúsculas, sin distinguir mayúsculas **[SUPUESTO S-2]**; `%` y `_`
**no** se escapan, como hoy en el autocompletado **[SUPUESTO S-4]**. El serial se busca en **las dos** columnas: la
copia del ticket (`tickets.serial`) **y** el serial del equipo enlazado por `tickets.equipo_id`. La razón: el serial
de un equipo se puede editar (`apps/desk/server/db/equipos.ts:137`, `apps/desk/server/db/equipos.ts:150`) y la copia
del ticket sólo se rellena una vez (`apps/desk/server/backfillSerial.ts:16`; medido en `exploration.md` §2), así que
buscando sólo en la copia un ticket no aparecería por el serial corregido de su equipo. El serial viejo, el de la
copia, **SHALL** seguir encontrando el ticket.

**Un `q` de sólo dígitos** busca por número **y** por serial, con `OR` **[SUPUESTO S-5]**.

**Estructura de la condición:** número y serial se unen con `OR`; ese conjunto **SHALL** ir entre paréntesis y
unido con `AND` al filtro de estado que ya existe, de modo que un ticket cerrado que casa nunca entra en la lista
de activos ni uno activo en la de cerrados. En `scope=closed`, el `total` **SHALL** ser el recuento **filtrado**, y
la página 2 **SHALL** traer los siguientes resultados de la **misma** búsqueda. Una página fuera de rango
**SHALL** devolver `items` vacío con el `total` filtrado.

**Orden y visibilidad.** La búsqueda **SHALL** respetar el `scope` que se pide **[SUPUESTO S-6]**: la vista inicial
es «Todos» (`apps/desk/src/App.tsx:57`), así que por defecto es global. Los resultados **SHALL** conservar el orden
que el listado ya tenía sin `q` (`RQ-VT-09` para activos y «Mis tickets»; `created_time DESC` para cerrados).
«Mis tickets» con `q` **SHALL** aplicar la búsqueda y **después** el predicado `esDeMisTickets`, y devolver sólo los
del usuario de la sesión, en el orden de la cola del taller. **La búsqueda no segmenta la visibilidad:** todo
usuario autenticado ve todos los tickets (`openspec/specs/permissions/spec.md:550` en `373401e`); `q` sólo recorta, no concede ni
niega.

**Posición de la validación:** la comprobación de `q` **SHALL** correr **después** de `requireAuth`
(`apps/desk/server/routes/tickets.ts:35`): sin sesión, un `q` inválido responde `401`, no `422`.

**Regla invariable 13, decisión a decisión** (`proposal.md` §5): el cliente **SHALL** enviar sólo el texto tal
cual lo escribió la persona. **MUST NOT** quitar `#`, pasar a minúsculas, recortar, ni filtrar por `q` los tickets
que recibe; el filtro de vista de `applyBoardView` (`apps/desk/src/lib/boardView.ts:33-37`) no es guarda y no cambia.
El `maxLength` de la caja es comodidad con imposición probada (el `422`). Volver a la página 1 al cambiar el texto
es comodidad: aunque no lo hiciera, una página fuera de rango devuelve `items` vacío.

**Límites declarados (no son fallos):**

- Un ticket **sin serial** —ni en su columna ni en el equipo enlazado— **no se encuentra por serial**. Los tickets
  de Zoho sin serial en sus campos ni en el asunto caen aquí (`packages/zoho-sync/src/db/mappers.ts:61-66`). El
  relleno de `tickets.serial` en filas históricas es dato de producción y queda **fuera**.
- No se busca por asunto, cliente ni contacto: la letra dice número y serial.
- No hay índice nuevo: `LIKE '%x%'` recorre la tabla (hipótesis: miles de filas; la propuesta §10 pide el recuento
  real al desplegar).

#### Scenario: [ROJO] el número coincide exacto, con y sin «#»
- GIVEN tickets con los números 86, 864 y 8640
- WHEN se pide `GET /api/tickets?q=864` y `GET /api/tickets?q=%23864`
- THEN las dos respuestas incluyen el ticket 864
- AND no incluyen el 86 ni el 8640 por número

#### Scenario: [ROJO] un número parcial no encuentra por número
- GIVEN el ticket 864 y ningún serial que contenga «86»
- WHEN se pide `q=86`
- THEN el 864 no aparece

#### Scenario: [ROJO] los últimos dígitos de un serial encuentran el ticket
- GIVEN un ticket con serial `SN-0042517`
- WHEN se pide `q=2517`
- THEN el ticket aparece

#### Scenario: [ROJO] mayúsculas y espacios a los lados no cambian el resultado
- GIVEN un ticket con serial `AbC-123`
- WHEN se pide `q=abc-123` y `q=%20%20ABC-123%20%20`
- THEN las dos respuestas incluyen el ticket y son iguales entre sí

#### Scenario: [ROJO] el espacio interior se conserva
- GIVEN un ticket con serial `AB 12` y otro con `AB12`
- WHEN se pide `q=ab 12`
- THEN aparece el primero y no el segundo **[SUPUESTO S-3]**

#### Scenario: [ROJO] el serial se busca en el equipo enlazado, también tras editarlo
- GIVEN un ticket cuya copia `tickets.serial` es `VIEJO-77` y cuyo equipo enlazado cambió su serial a `NUEVO-88`
- WHEN se piden `q=NUEVO-88` y `q=VIEJO-77`
- THEN las dos respuestas incluyen el ticket

#### Scenario: [ROJO] un ticket sin serial en ningún sitio no se encuentra por serial
- GIVEN un ticket sin `tickets.serial` y sin equipo enlazado
- WHEN se pide `q=` con cualquier fragmento de serial
- THEN no aparece
- AND sí aparece si se pide por su número (límite declarado)

#### Scenario: [ROJO] un texto de dígitos busca en número y en serial
- GIVEN el ticket 864 y, aparte, otro ticket con serial `X-864-Z`
- WHEN se pide `q=864`
- THEN aparecen los dos **[SUPUESTO S-5]**

#### Scenario: [ROJO] un número que no cabe en `integer` no rompe la consulta
- GIVEN un ticket con serial `99999999999-A`
- WHEN se pide `q=99999999999`
- THEN responde `200`, el ticket aparece por serial y no hay error de base de datos

#### Scenario: [ROJO] un «#» solo no es un número
- GIVEN tickets cualesquiera sin serial que contenga «#»
- WHEN se pide `q=%23`
- THEN responde `200` con `items` vacío **[SUPUESTO S-11]**

#### Scenario: [CARACTERIZACIÓN] sin `q`, o con `q` vacío o de espacios, la respuesta es la de hoy
- GIVEN una base con tickets activos y cerrados
- WHEN se pide el listado sin `q`, con `q=` y con `q=%20%20` (activos, `scope=closed` y «Mis tickets»)
- THEN las tres respuestas de cada población son iguales entre sí, byte a byte, y coinciden con la respuesta
  anterior al cambio

#### Scenario: [ROJO] los cerrados paginados traen el recuento filtrado
- GIVEN 120 cerrados, 60 de los cuales casan con `q`, y `pageSize = 50`
- WHEN se piden `scope=closed&q=…&page=1` y `page=2`
- THEN `total` es 60, la página 1 trae 50 y la página 2 trae los otros 10 de la misma búsqueda
- AND quitar `q` del recuento (`countClosedTickets`) pone la prueba en rojo (mutación)

#### Scenario: [ROJO] una página fuera de rango devuelve vacío con el total filtrado
- GIVEN los mismos 60 cerrados que casan
- WHEN se pide `page=9`
- THEN `items` es vacío y `total` es 60

#### Scenario: [ROJO] un cerrado que casa no sale entre los activos, y al revés (posición de la condición)
- GIVEN un cerrado y un activo que casan con el mismo `q` por serial
- WHEN se piden los activos y, aparte, `scope=closed`
- THEN los activos incluyen sólo el activo y los cerrados sólo el cerrado
- AND sacar el `OR` de sus paréntesis, o ponerlo antes del filtro de estado, pone la prueba en rojo (mutación)

#### Scenario: [ROJO] «Mis tickets» con `q` devuelve sólo los del usuario, en el orden de la cola
- GIVEN tres tickets que casan con `q`: dos derivados al usuario de la sesión (prioridades distintas) y uno a otro
- WHEN el usuario pide `GET /api/mis-tickets?q=…`
- THEN llegan sólo sus dos, en el orden de `RQ-VT-09`

#### Scenario: [ROJO] un `q` demasiado largo responde `422`, con sesión
- GIVEN un usuario autenticado
- WHEN pide el listado con un `q` de 65 caracteres no blancos, y con uno de 64
- THEN el primero responde `422` y el segundo `200` **[SUPUESTO S-7]**

#### Scenario: [ROJO] un `q` largo de sólo espacios es vacío
- GIVEN un usuario autenticado
- WHEN pide el listado con 80 espacios
- THEN responde `200`, igual que sin `q` **[SUPUESTO S-9]**

#### Scenario: [ROJO] un `q` repetido responde `422`
- GIVEN un usuario autenticado
- WHEN pide `?q=a&q=b`
- THEN responde `422` **[SUPUESTO S-10]**

#### Scenario: [CARACTERIZACIÓN que se vuelve guarda de posición] sin sesión, un `q` largo responde `401`
- GIVEN una petición sin sesión con un `q` de 65 caracteres
- WHEN se envía a `GET /api/tickets` y a `GET /api/mis-tickets`
- THEN responde `401`, no `422`
- AND montar la validación de `q` delante de `requireAuth` pone la prueba en rojo (mutación de posición,
  regla de mutación 1). Hoy da `401` porque `q` no se lee; la prueba nace verde y fija la posición cuando
  la validación existe

#### Scenario: [CARACTERIZACIÓN] la búsqueda no segmenta la visibilidad
- GIVEN dos usuarios autenticados de áreas distintas y un ticket que casa con `q`
- WHEN cada uno busca ese `q` en el listado general
- THEN los dos lo reciben

#### Scenario: [ROJO] mutaciones del predicado, cada una con su rojo
- GIVEN las pruebas anteriores
- WHEN se muta el predicado de serial de «contiene» a «empieza por», se quita `LOWER`, o la igualdad del número
  pasa a `LIKE`
- THEN cada mutación pone en rojo al menos una prueba distinta

#### Scenario: [VERIFICACIÓN DE PERSONA] el cliente sólo envía el texto
- GIVEN el cliente de la caja (`RQ-VT-13`)
- WHEN se lee su código
- THEN no quita `#`, no cambia mayúsculas, no recorta, y no filtra por `q` los tickets recibidos (lectura del `.tsx`,
  fuera de la red por F0-00)

### Requirement: RQ-VT-12 · La búsqueda por serial y el autocompletado de la recepción comparten una sola implementación del patrón

El patrón de búsqueda por serial **SHALL** tener **una sola implementación**, en `packages/shared`, que consumen
**a la vez** la búsqueda de tickets de `RQ-VT-11` y `searchEquipos` (el autocompletado de la recepción,
`apps/desk/server/db/equipos.ts:59-75`; llamado desde `apps/desk/server/routes/equipos.ts:19`). Es la letra
«con la misma lógica que el autocompletado por serial de la recepción» (E-133) hecha comprobable. Dos
implementaciones de la misma noción es el molde H5, y ya existen otras cuatro nociones de serial con otros
fines (`exploration.md` §3): esta **no** debe ser la quinta.

La implementación compartida **SHALL**: recortar los extremos, pasar a minúsculas y envolver en `%…%`; no escapar
`%` ni `_` **[SUPUESTO S-4]**.

**Efecto colateral declarado [SUPUESTO S-3]:** al compartir la función, el autocompletado de la recepción también
**recorta** los extremos de su texto, cosa que hoy no hace (`apps/desk/server/db/equipos.ts:60`). Se comprobó que
ningún requisito vivo fija lo contrario: `RQ-HV-06` (`openspec/specs/hojas-vida/spec.md:125-134`) exige que
`searchEquipos` encuentre por código interno «con el mismo criterio —insensible a mayúsculas, por coincidencia
parcial— con el que ya busca por serial», y recortar los extremos no contradice nada de eso; los demás pasajes
que nombran «Autocompletado» (`openspec/specs/tickets-core/spec.md:1341` en `2a74fdc`) son filas de discrepancia con el
maestro, no comportamiento. **No hay bloque MODIFIED:** ningún requisito vivo cambia de letra. Reversión: quitar
el recorte del patrón compartido afecta a las dos búsquedas a la vez.

**Alcance de la noción compartida:** es el **patrón** (qué texto se busca y cómo se normaliza). `searchEquipos`
sigue buscando además en cliente, marca, modelo, tipo y código interno (`apps/desk/server/db/equipos.ts:67-69`);
eso no cambia y la búsqueda de tickets no lo hereda.

#### Scenario: [ROJO] los dos buscadores dan el mismo veredicto para la misma tabla de casos
- GIVEN una tabla de seriales y de casos de texto: últimos dígitos, centro del serial, mayúsculas, espacios a los
  lados, `%`, `_` y vacío
- WHEN se evalúa cada caso en `searchEquipos` y en la búsqueda de tickets (los equipos de prueba sin otro campo que
  contenga el texto, para aislar el serial)
- THEN el conjunto de seriales que coincide es el mismo en los dos, caso a caso
- AND devolver `searchEquipos` a su patrón propio (`%${q.toLowerCase()}%`) pone la prueba en rojo (mutación M-4)

#### Scenario: [ROJO] el autocompletado de la recepción recorta los extremos
- GIVEN un equipo con serial `ABC-123`
- WHEN se llama a `searchEquipos` con `'  abc-123  '`
- THEN devuelve el equipo (hoy no lo devuelve: el patrón conserva los espacios) **[SUPUESTO S-3]**

#### Scenario: [CARACTERIZACIÓN] el autocompletado conserva su comportamiento de «contiene», sin distinguir mayúsculas
- GIVEN las pruebas vivas de `apps/desk/server/db/equipos.test.ts` y `RQ-HV-06`
- WHEN se corren tras el cambio
- THEN siguen en verde sin modificar su letra

#### Scenario: [ROJO] una sola función de patrón
- GIVEN el árbol tras el cambio
- WHEN se busca el patrón `%…%` de serial en `apps/desk/server` y `packages/zoho-sync`
- THEN todas las rutas de búsqueda por serial de tickets y de equipos llaman a la función de `packages/shared`;
  ninguna construye el patrón por su cuenta (comprobación por lectura al verificar)

### Requirement: RQ-VT-13 · La caja de búsqueda del listado se verifica a mano (`.tsx` fuera de la red)

La cabecera del listado (hoy sin caja de búsqueda; `apps/desk/src/App.tsx:98-110` según la exploración, a
remedir al aplicar) **SHALL** tener una caja de búsqueda con texto en español que envíe `q` al servidor tras una
espera corta entre pulsaciones, y **SHALL** volver a la página 1 al cambiar el texto. El fichero de la caja es
`.tsx` y queda **fuera de la red de pruebas** por decisión de Gerencia (F0-00, `vitest.config.ts:16-20`): este
requisito **no admite escenario automatizado**. **No** se propone `jsdom` ni `@testing-library`. Lo que sí es
lógica se prueba en `.ts`: la construcción de la URL con `q` (`apps/desk/src/lib/`), cubierta por la prueba de
`RQ-VT-11`. El `maxLength` de 64 es comodidad; el `422` de `RQ-VT-11` es la imposición.
**[SUPUESTO S-7]** En la vista «Remisión creada» (`RQ-VT-10`) la caja **no se enseña** y el texto de búsqueda se
vacía al entrar en ella: esa lista no admite `q`. Si la búsqueda debe cubrirla es pregunta abierta de la bandeja.

Verificación por persona, dueño QA / quien despliegue, **tras el despliegue** y sin contar como tarea de la tanda
(regla del ciclo 1): **archivar este cambio no la da por hecha.**

#### Scenario: manual — número con y sin «#»
- GIVEN el listado en `ambientalia-desk.ambientalia.cloud`, tras el despliegue
- WHEN se escribe un número de ticket con «#» y sin él
- THEN en los dos casos aparece ese ticket

#### Scenario: manual — últimos dígitos y mayúsculas de un serial
- GIVEN un ticket con serial conocido
- WHEN se escriben sus últimos dígitos, y luego el serial completo en minúsculas
- THEN el ticket aparece en las dos búsquedas

#### Scenario: manual — un cerrado de una página que no es la primera
- GIVEN un texto que casa con más de 50 cerrados, en la vista «Todos»
- WHEN se pasa a la página 2
- THEN el contador de la paginación muestra el total filtrado y la página trae los siguientes resultados

#### Scenario: manual — «Mis tickets» y borrar el texto
- GIVEN la vista «Mis tickets» con texto en la caja
- WHEN se busca y luego se borra el texto
- THEN al buscar sólo salen los del usuario y al borrar vuelve el listado completo

### Requirement: RQ-VT-14 · Las listas de tickets traen la marca de garantía calculada por el servidor, por lote

Fuente: E-105 (`docs/sdd/ENTRADA.md:1396-1400`): distintivo «en cabecera, lista y tablero»; maestro R08.4 (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1611-1614`). Mismo molde que `RQ-VT-07`.

Toda lista de tickets que sirve el servidor **SHALL** traer, en cada ticket con equipo, la marca de garantía del predicado de `RQ-TC-58` (nombre y forma los fija el diseño, el mismo campo que el detalle de `RQ-TC-59`). Los productores son tres, y **los tres** la llevan:

1. la cola del taller (`GET /api/tickets` activos y todos, y `GET /api/mis-tickets`);
2. los cerrados de `GET /api/tickets`;
3. la lista de «Remisión creada» (`RQ-VT-10`).

- **Por lote.** El fin de garantía de todos los equipos de la página **SHALL** obtenerse con **una sola** consulta aparte, no una por ticket, y **sin unir `equipos`** en las consultas de tickets. Si la consulta falla, la lista **MUST** servirse igual, sin marcas.
- **Sin equipo, sin marca.** Un ticket sin `equipo_id` no lleva el campo. Un ticket **cerrado** lo lleva igual que uno abierto.
- **Fuera del orden y del contenido.** La marca **MUST NOT** cambiar qué tickets salen, su orden (`RQ-VT-09`, `RQ-VT-10`) ni la paginación o la búsqueda (`RQ-VT-11`).
- **Regla invariable 13.** El servidor decide la marca; el cliente **MUST NOT** recalcularla.

#### Scenario: la cola del taller trae la marca
- GIVEN dos tickets activos, uno de un equipo en garantía y otro de un equipo sin fin de garantía
- WHEN se pide `GET /api/tickets`
- THEN el primero trae `en_garantia` y el segundo `sin_dato`

#### Scenario: «Mis tickets» trae la marca
- GIVEN un ticket del usuario cuyo equipo está en garantía
- WHEN se pide `GET /api/mis-tickets`
- THEN el ticket trae `en_garantia`

#### Scenario: los cerrados traen la marca
- GIVEN un ticket cerrado creado dentro de la garantía de su equipo
- WHEN se pide la vista de cerrados de `GET /api/tickets`
- THEN el ticket trae `en_garantia`

#### Scenario: la lista de «Remisión creada» trae la marca
- GIVEN un ticket en `Remisión creada` con equipo en garantía
- WHEN se pide la lista de «Remisión creada»
- THEN el ticket trae `en_garantia`

#### Scenario: ticket sin equipo, sin marca en la lista
- GIVEN un ticket sin `equipo_id`
- WHEN se pide cualquiera de las tres listas
- THEN el ticket no trae el campo

#### Scenario: instante frontera en la lista
- GIVEN un equipo con fin `2026-03-15` y dos tickets, creados el `2026-03-15T20:00:00-05:00` y el `2026-03-16T00:30:00-05:00`
- WHEN se piden en una lista
- THEN el primero trae `en_garantia` y el segundo trae `vencida`

#### Scenario: una consulta por lote
- GIVEN una página de veinte tickets de equipos distintos
- WHEN se pide la lista
- THEN el fin de garantía se lee con una sola consulta (no veinte)

#### Scenario: la consulta falla, la lista se sirve
- GIVEN un fallo al leer `equipos`
- WHEN se pide la lista
- THEN responde con los mismos tickets y el mismo orden, sin marcas

#### Scenario: un productor sin la marca se detecta
- GIVEN la mutación que quita la marca de uno de los tres productores
- WHEN corre la suite
- THEN falla la prueba de ese productor

### Requirement: RQ-VT-15 · Tarjeta, lista, tabla y cabecera pintan «En garantía» y «Garantía sin dato», y se verifican a mano (`.tsx` fuera de la red)

Fuente: E-105 (`docs/sdd/ENTRADA.md:1396-1400`); maestro R08.4 (`R08.4.md:1611-1614`). Precedente: `RQ-VT-08`, `RQ-VT-13`.

El cliente **SHALL** pintar la marca de `RQ-VT-14` y `RQ-TC-59` como distintivo visible, con texto en español, en la tarjeta del tablero (`TicketCard.tsx`), la lista (`TicketList.tsx`), la tabla (`TicketTable.tsx`) y la cabecera del ticket (`TicketDetailView.tsx`):

- `en_garantia`: distintivo «En garantía» (verde, supuesto S2).
- `sin_dato`: distintivo «Garantía sin dato» (gris neutro, supuesto S2), con título que diga que Comercial lo completa en la hoja de vida del equipo (supuesto S6); **MUST NOT** enlazar ni exigir permiso nuevo.
- `vencida` o marca ausente: **ningún** distintivo (supuestos S1 y S3).
- **No ámbar:** el ámbar es de la espera (`RQ-VT-04`) y se confundiría.
- El cliente **MUST NOT** calcular la marca ni leer fechas de garantía para estas cuatro vistas: sólo pinta el campo que manda el servidor.
- Un ticket cerrado conserva el distintivo.

Los cuatro ficheros son `.tsx` y quedan **fuera de la red de pruebas** por decisión de Gerencia (F0-00, `vitest.config.ts:16-20`): este requisito **no admite escenario automatizado**; la prueba automatizada vive en el servidor (`RQ-VT-14`, `RQ-TC-58`, `RQ-TC-59`). **No** se propone `jsdom` ni `@testing-library`. Verificación por persona, **tras el despliegue** y sin contar como tarea de la tanda (regla del ciclo 1): **archivar este cambio no la da por hecha.**

#### Scenario: manual — tarjeta del tablero
- GIVEN el tablero en `ambientalia-desk.ambientalia.cloud`, tras el despliegue, con un ticket de equipo en garantía y otro de equipo sin fin registrado
- WHEN se inspeccionan sus tarjetas
- THEN la primera muestra «En garantía» en verde y la segunda «Garantía sin dato» en gris

#### Scenario: manual — lista y tabla
- GIVEN los mismos tickets
- WHEN se abre la vista de lista y la de tabla
- THEN cada uno muestra su distintivo, y un ticket de garantía vencida o sin equipo no muestra ninguno

#### Scenario: manual — cabecera del ticket
- GIVEN el detalle de un ticket de equipo en garantía
- WHEN se mira la fila de chips de la cabecera
- THEN aparece «En garantía»; en un ticket con equipo sin fin aparece «Garantía sin dato» con el título que remite a Comercial

#### Scenario: manual — un ticket cerrado conserva el distintivo
- GIVEN un ticket cerrado creado dentro de la garantía de su equipo
- WHEN se abre en la vista «Todos» o en su detalle
- THEN muestra «En garantía»

#### Scenario: manual — el color no se confunde con la espera
- GIVEN un ticket en espera y otro «En garantía» en el mismo tablero
- WHEN se comparan sus tarjetas
- THEN el distintivo de garantía no es ámbar
- Verificación anotada con su resultado por una persona, no por una prueba automatizada

### Requirement: RQ-VT-16 · La lista de «Remisión creada» trae los días hábiles en el estado calculados por el servidor, y tarjeta, lista y tabla los pintan en gris

Fuente: `decision/f1b07-tiempo-en-tarjeta-y-cierre-11-10` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`), que responde E-192; condición que dejó escrita `RQ-VT-10` (`openspec/specs/vistas-tablero/spec.md:398-402`). Supuestos T1 a T7 de `proposal.md`, reversibles hasta el 2026-10-18. `RQ-VT-10` **no** se modifica.

Cada elemento de `GET /api/remision-creada` **SHALL** traer `diasHabilesEnEstado: number | null`, calculado por el servidor:

- **Cuenta (T1).** Son los días hábiles **posteriores** al día de entrada y hasta hoy **inclusive**: la semántica `(desde, hasta]` de `diasHabilesEntre` (`packages/shared/src/calendarioLaboral.ts:196`). El día de entrada **MUST NOT** contar.
- **Calendario.** Festivos de Colombia y cierres sembrados (`esDiaHabil`, `packages/shared/src/calendarioLaboral.ts:139`). El día civil de entrada y el de hoy se toman en la zona de negocio (T6; la misma que usa `horasHabilesEntre`, `packages/shared/src/calendarioLaboral.ts:176-178`), no en UTC.
- **Instante de entrada.** El mismo de `RQ-VT-10`. Sin instante legible el campo es `null` (T3).
- **Sólo en esta lista (T5).** El listado de activos y «Mis tickets» **MUST NOT** traer el campo.
- **Fuera del orden.** El campo **MUST NOT** cambiar qué tickets salen ni su orden (`RQ-VT-10`).
- **Texto fijo, función pura de `packages/shared` (T2, T3).** `0` → «Menos de 1 día hábil»; `1` → «1 día hábil»; `n` ≥ 2 → «n días hábiles»; `null` → «Sin fecha de entrada»; campo ausente → nada que pintar.
- **Regla invariable 13.** El cliente **MUST NOT** calcular el número ni decidir el texto: sólo pinta lo que devuelve la función de `shared` (comodidad probada en el servidor).
- **Dos relojes, declarado.** La alarma mide **horas** hábiles (`Remisión creada`: 27, `packages/shared/src/sla.ts:34`); el distintivo cuenta **días civiles** hábiles. Pueden discrepar y no es un defecto de este requisito.

#### Scenario: el día de entrada no cuenta
- GIVEN un ticket que entró el `2026-03-05T10:00:00-05:00` (jueves)
- WHEN se calcula con hoy `2026-03-05`
- THEN el número es `0` y el texto «Menos de 1 día hábil»

#### Scenario: días entre semana
- GIVEN un ticket que entró el martes `2026-03-03` y hoy es el jueves `2026-03-05`
- WHEN se calcula
- THEN el número es `2` (miércoles y jueves) y el texto «2 días hábiles»

#### Scenario: salta el fin de semana
- GIVEN un ticket que entró el viernes `2026-03-06` y hoy es el lunes `2026-03-09`
- WHEN se calcula
- THEN el número es `1` y el texto «1 día hábil»

#### Scenario: salta un festivo
- GIVEN el lunes `2026-03-23` festivo (San José, jueves 19 trasladado), un ticket que entró el viernes `2026-03-20` y hoy el martes `2026-03-24`
- WHEN se calcula
- THEN el número es `1` y no `2`

#### Scenario: salta un cierre sembrado
- GIVEN el `2026-03-11` sembrado como cierre, un ticket que entró el lunes `2026-03-09` y hoy el jueves `2026-03-12`
- WHEN se calcula
- THEN el número es `2` y no `3`

#### Scenario: el día se toma en la zona de negocio
- GIVEN un ticket que entró el `2026-03-10T02:00:00Z` (el `2026-03-09` a las 21:00 en Bogotá) y hoy es el `2026-03-10` a mediodía en Bogotá
- WHEN se calcula
- THEN el número es `1` (contando desde el día 9 de Bogotá, no desde el 10 UTC)

#### Scenario: sin fecha de entrada
- GIVEN un ticket en `Remisión creada` sin fila de entrada en `ticket_transitions`
- WHEN se pide la lista
- THEN trae `diasHabilesEnEstado: null`, va al final como dice `RQ-VT-10` y su texto es «Sin fecha de entrada»

#### Scenario: la lista trae el campo para todos
- GIVEN tickets de `Remisión creada`, con y sin orden de venta
- WHEN se pide `GET /api/remision-creada`
- THEN cada elemento trae el campo, `number` o `null`

#### Scenario: los demás listados no traen el campo
- GIVEN tickets activos y tickets del usuario
- WHEN se piden `GET /api/tickets` y `GET /api/mis-tickets`
- THEN ningún elemento trae `diasHabilesEnEstado`

#### Scenario: el orden de la lista no cambia
- GIVEN los tickets de las pruebas de orden de `RQ-VT-10`
- WHEN se añade el campo
- THEN el orden y la prueba de «sin N+1» (3 contra 6 tickets) siguen iguales

#### Scenario: textos exactos y campo ausente
- GIVEN la función de texto de `shared`
- WHEN recibe `0`, `1`, `3`, `null` y `undefined`
- THEN devuelve «Menos de 1 día hábil», «1 día hábil», «3 días hábiles», «Sin fecha de entrada» y nada, respectivamente

#### Scenario: los dos relojes pueden discrepar
- GIVEN un ticket que entró el lunes `2026-03-02` a las 16:00 (Bogotá) y ahora es el jueves `2026-03-05` a las 09:00
- WHEN se calculan el distintivo y las horas hábiles (`horasHabilesEntre`)
- THEN el distintivo dice `3` días hábiles (martes, miércoles y jueves), las horas hábiles son `20` (1 + 9 + 9 + 1), por debajo de las 27 de la alarma, y no hay alarma

#### Scenario: manual — el distintivo es gris
- GIVEN la vista «Remisión creada» tras el despliegue, con un ticket de pocos días y otro de muchos
- WHEN se comparan sus distintivos de tiempo
- THEN ambos son grises, nunca ámbar ni rojo (T4)
- Verificación anotada con su resultado por una persona (`.tsx` fuera de la red, F0-00)

#### Scenario: manual — tarjeta, lista y tabla
- GIVEN la vista «Remisión creada» en `ambientalia-desk.ambientalia.cloud`
- WHEN se cambia entre tarjeta, lista y tabla
- THEN los tres modos muestran el distintivo (T7), y las demás vistas no lo muestran (T5)
- Verificación por persona, tras el despliegue; **archivar no la da por hecha** (regla del ciclo 1). No se propone `jsdom` ni `@testing-library`
