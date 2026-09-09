# Capacidad `trazas` — qué queda escrito de todo lo que pasa

| Dato | Valor |
|---|---|
| Capacidad | `trazas` (`openspec/config.yaml:122-124`) |
| Estado | **as-built parcial** (`status_at_start` de `config.yaml`: «decidido R08 sin excepciones»), contrastado contra el código |
| Base verificada | commit `ad1875b`, rama `main`. `npm test`: 110 ficheros / 931 pruebas, 929 en verde y 2 saltadas |
| Tanda que la escribe | F0-02 |
| Contenido | **11** requisitos (`RQ-TZ-01`…`RQ-TZ-11`, §§1–2) · **5** entradas de comportamiento actual (§3.1–§3.5) · **5** discrepancias diseño↔código (D-1…D-5) y **4** maestro↔código (M-1…M-4) |
| Diseños de procedencia | `docs/superpowers/specs/2026-06-05-historia-ticket-design.md` (113 líneas) · `2026-08-05-historia-unificada-ticket-design.md` · `2026-08-05-conversaciones-relato-ticket-design.md`. **Histórico congelado** (plan R01.1:382) |
| Apartados del maestro | **M1.10** (`R08.1.md:1675-1677`), con el `[DECIDIDO — R08]` «sin excepciones» en `:1677` · M1.9.2 (`:1651-1666`) · Anexo G col. 7 y 12 (`:4321-4329`) · Anexo G.8 (`:4476`) |
| Tandas que la tocan | **F1C-06** y **C9** (los tiempos se calculan sobre el historial) · **F1C-04** (C7, los tres bodegajes) · **F1A-05** / **F1B-09** (auditoría de blueprint) |
| Depende de | `transitions-st` (la fila que escribe cada transición) · `tickets-core` (la foto de la creación) · `zoho-sync` (el historial que llega de fuera) |

---

## 0 · Procedencia y método

Rigen las mismas reglas que en `transitions-st`: **ruta y línea** en toda afirmación sobre el código,
**línea del `.md` exportado** en toda afirmación sobre el maestro, **hipótesis** delante de lo demás.
El diseño de junio no es autoridad; cuando discrepa del código, manda el código y la discrepancia se
escribe (§5).

### Las tres fuentes, enfrentadas

| Concepto | Diseño (05/06 y 05/08) | Maestro R08.1 | Código (`ad1875b`) |
|---|---|---|---|
| Cómo se combinan las dos historias | «**Fallback** a `ticket_transitions` cuando no hay historial de Zoho» (`design historia:16`, `:68`) | — | **Unificadas**, no fallback: `[...zoho, ...transiciones, ...remisiones]` ordenado (`apps/desk/server/db/historial.ts:157`) |
| Cómo se construye | «**Derivada al leer**» (`design unificada:32`) | — | Derivada al leer (`historial.ts:126-131`) |
| El «quién» de cada transición | Actor = constante temporal `'Equipo Técnico'` (`design B:20`) | M1.10 `[DECIDIDO — R08]`: fecha, hora y persona, «**no admite excepciones**»; «lo que falta por confirmar es que registre siempre el usuario» (`:1677`) | **Confirmado**: `performed_by` en la misma sentencia que el resto de la fila (`packages/zoho-sync/src/db/repo.ts:282-286`), comprobado en las 34 (`transicionesEjecucion.test.ts:272-285`) |
| Qué guarda la creación | `values = { orden_venta }` (`design C:78`) | — | **Payload completo**, diez claves (`repo.ts:396-400`) |
| Dónde vive el tracking | «**HISTORIA**, unificada; CONVERSACIONES se queda para el correo real» (`design unificada:31`) | — | Dos composiciones **hermanas** sobre las mismas fuentes: `historial.ts` y `conversacion.ts` |

---

## 1 · Lo que se escribe

### RQ-TZ-01 · Toda transición deja fila, con fecha, hora y persona

Toda transición **SHALL** insertar una fila en `ticket_transitions` con nueve columnas:
`ticket_id`, `transition_id`, `transition_name`, `from_status`, `to_status`, `area`, `performed_by`,
`values` y `comment_id` (`packages/zoho-sync/src/db/repo.ts:282-286`), más el `performed_at` que la
tabla pone por defecto.

- **MUST NOT** existir ningún camino que escriba la fila sin actor: `performed_by` va en la misma
  sentencia `INSERT` que el resto (`repo.ts:283-285`). Es M1.10 `[DECIDIDO — R08]`, «no admite
  excepciones» (`R08.1.md:1677`).
- El actor **SHALL** ser el usuario de la sesión, y **MAY** caer a `TRANSITION_ACTOR` sólo si la
  sesión no trae nombre (`apps/desk/server/services/ticketService.ts:111`;
  `apps/desk/server/transitionActor.ts:3`). El único camino que alcanza el respaldo hoy está en §4.1.
- La cobertura **SHALL** ser de las 34 transiciones, ejercitando **todos** los `from` de cada una
  —36 ejecuciones, porque `habilitar_servicio` tiene tres— y comprobando en cada una el estado destino
  **y** la fila del historial (`apps/desk/server/transicionesEjecucion.test.ts:105-117`, `:272-285`).
- La escritura **SHALL** ser atómica con el resto de la transición: transacción cuando el pool lo
  permita, con `ROLLBACK` (`repo.ts:290-315`).

### RQ-TZ-02 · La fila de la creación se distingue por su origen

La creación del ticket **SHALL** dejar fila con `from_status = '(creación)'`
(`packages/shared/src/transitions.ts:110`, `FROM_STATUS_CREACION`; escrita en `repo.ts:396`).

- No es un estado de Zoho —de ahí los paréntesis—: es la marca de que esa fila es la foto del
  nacimiento y no una transición (`transitions.ts:100-103`; maestro M1.3.8, `:1417`).
- La constante **SHALL** vivir en `shared` y **MUST NOT** repetirse como literal: la escribe
  `zoho-sync/db/repo` y la leen los **dos** compositores del ticket. Con el literal repetido, cambiarlo
  en el escritor dejaba a los dos paneles degradando la creación a transición genérica **en silencio**,
  y con los tests en verde porque cada uno codificaba el mismo literal (`transitions.ts:104-109`).
- El discriminador **SHALL** ser `esCreacion(fila)` (`apps/desk/server/db/ticketFuentes.ts:25-27`).

### RQ-TZ-03 · El `values` de cada fila es el rastro completo

`values` **SHALL** guardar **todos** los valores diligenciados en la transición
(`repo.ts:285`, con `JSON.stringify(values)` sobre lo que llegó del cliente).

De aquí sale la regla que gobierna los indicadores, y **SHALL** quedar escrita en esta spec porque
sin ella F1C-06 la pierde:

> **Las columnas de `tickets` guardan el ÚLTIMO valor; el historial guarda TODOS.**
> **Los KPIs de G.6 SHALL calcularse sobre `ticket_transitions.values`, no sobre `tickets.*`.**

(`packages/shared/src/reentrancia.ts:14-32`, en especial `:19` y `:24`.) No se pierde ningún dato por
reentrancia; lo que se pierde es el dato **si se lee por la columna**. El detalle de los diez campos
reentrantes es de `transitions-st` §3.3.

### RQ-TZ-04 · El comentario es una conversación, no un campo

El comentario de una transición **SHALL** escribirse como fila de `conversations` con
`kind='comment'`, `author_type='agent'`, `is_public=false`, `content_type='plainText'`,
`commented_time=now()` y `source='app'` (`repo.ts:258-267`), y su id **SHALL** llevar el prefijo
`app-` (`repo.ts:261`).

- La fila del historial **SHALL** apuntarla por `comment_id` (`repo.ts:285`), y ese `comment_id`
  **SHALL** ser `null` cuando no hubo comentario (`repo.ts:259-260`) y en la fila de la creación
  (`repo.ts:395`).
- El comentario **MUST NOT** enseñarse además como campo diligenciado: se excluye por su clave
  (`ticketFuentes.ts:100`), porque `writeTransition` ya lo guarda como conversación propia y dejarlo
  lo enseñaba dos veces —una como mensaje y otra como campo— y encima etiquetado «Comment», la única
  palabra en inglés de la interfaz (`ticketFuentes.ts:87-93`).

### RQ-TZ-05 · El historial de Zoho se sincroniza y se guarda crudo

Los eventos de Zoho **SHALL** guardarse en `ticket_history` con su `raw` completo y mapearse **al
leer**, no al escribir (`packages/zoho-sync/src/db/history.ts:13-19` para el `upsert`, `:29-32` para
la lectura; el mapeo puro está en `packages/shared/src/historyMap.ts:22`).

La razón **SHALL** quedar escrita: mejorar la redacción no debe exigir un re-sync
(`design historia:17`). El `upsert` **SHALL** ser idempotente por hash, porque **los eventos de Zoho
no traen id** (`design historia:24`, `:42`; `ON CONFLICT (id) DO NOTHING` en `history.ts:16`).

---

## 2 · Lo que se deriva al leer

### RQ-TZ-06 · La historia es una sola línea de tiempo, no un fallback

`getHistorialTicket` **SHALL** combinar las **tres** fuentes en una sola línea de tiempo ordenada de
más reciente a más antigua, y **MUST NOT** elegir una de ellas
(`apps/desk/server/db/historial.ts:131-161`, con la unión en `:157` y el orden en `:123-124`):

| Fuente | De dónde | Línea |
|---|---|---|
| Historial de Zoho | `ticket_history` | `historial.ts:132` |
| Transiciones de la app y la creación | `ticket_transitions` | `:136-144` |
| Remisiones: creación, desenlace y anulación | `remisiones` | `:149-155` |

- **SHALL** derivarse al leer y **MUST NOT** registrar eventos nuevos: eso es lo que hace que aparezca
  sola la historia ya existente, las 149 remisiones migradas incluidas
  (`historial.ts:126-129`; `design unificada:32`).
- La consulta de remisiones **MUST** ser propia y **MUST NOT** reutilizar
  `listRemisionesByTicket`: aquélla filtra `anulada_at IS NULL` porque el panel del ticket sólo enseña
  lo vigente, y aquí hacen falta justo las anuladas — «el historial registra lo que PASÓ, y una
  remisión anulada pasó (y su anulación también)» (`historial.ts:146-148`).

> **Given** un ticket que vino de Zoho y luego se movió en la app
> **When** se abre su pestaña de Historia
> **Then** se ven las dos cosas: los eventos de Zoho y las transiciones de la app.
> *(Con el `else` del diseño original se veían sólo las de Zoho — era el más grave de los tres fallos
> que la historia unificada vino a arreglar, `design unificada:19-23`.)*

### RQ-TZ-07 · Hay foto o no la hay, y se decide una vez

La creación **SHALL** leerse de su foto en `values` cuando exista, y **SHALL** caer a la fila del
ticket cuando no (`ticketFuentes.ts:63-75`, `lectorCreacion`).

- El discriminador **SHALL** ser «hay alguna clave distinta de `orden_venta`»
  (`ticketFuentes.ts:73`), porque los tickets anteriores a que `createTicket` guardara el payload
  completo dejaron sólo esa.
- **MUST** decidirse **una vez** y no campo a campo (`ticketFuentes.ts:64-65`): mezclar las dos
  fuentes daría una creación mitad histórica mitad actual.
- La única excepción **SHALL** ser `Cliente`, que sale siempre del estado actual porque el nombre vive
  en otra tabla y resolverlo por la foto pediría una segunda consulta. La excepción **SHALL** ir
  escrita con su fecha de caducidad: el día que la app pueda reasignar el cliente de un ticket, este
  detalle tiene que pasar por el lector como los demás (`historial.ts:27-31`).

### RQ-TZ-08 · La derivación se guarda por id y se traduce al leer

El `values` **SHALL** guardar la derivación por **id de persona** y **MUST NOT** guardar el nombre: un
nombre copiado se quedaría viejo en cuanto se corrigiera una errata (`ticketFuentes.ts:101-102`).

- La traducción **SHALL** hacerse al leer, resolviendo todos los ids de una vez y **sólo si alguna
  fila deriva** (`ticketFuentes.ts:108-114`, `nombresDerivados`; usado en `historial.ts:141`).
- Un id que no esté en el mapa **SHALL** dejarse **crudo** y **MUST NOT** sustituirse por
  «desconocido»: no debería pasar —los usuarios se desactivan, no se borran— y verlo es lo único que
  permitiría diagnosticarlo (`ticketFuentes.ts:102-105`).
- Ese id es además lo que impide borrar a una persona con historial: ver `permissions` RQ-PM-11.

### RQ-TZ-09 · Las etiquetas de los campos no se traducen con diccionario

`values` guarda las claves con el nombre técnico del campo, y la etiqueta **SHALL** derivarse
mecánicamente —guiones bajos a espacios, inicial en mayúscula— y **MUST NOT** salir de un diccionario
(`ticketFuentes.ts:82-85`, `etiquetaCampo`).

La razón **SHALL** quedar escrita: el conjunto de campos lo decide el Blueprint, y un diccionario
quedaría desactualizado en silencio el día que alguien añada uno (`ticketFuentes.ts:77-81`).

Los campos vacíos **SHALL** descartarse: «una lista de seis "—" no informa de nada»
(`historial.ts:18-23`; el filtro de `values` en `ticketFuentes.ts:100`).

### RQ-TZ-10 · Cuándo se le pregunta a Zoho, y cuándo no

El plan de sincronización **SHALL** derivarse del **prefijo del id** y de si ya hay datos de Zoho
(`ticketFuentes.ts:44-47`, `planSyncZoho`):

| Caso | Plan |
|---|---|
| Nació en la app (`app-`) | `'no'` |
| Vino de Zoho y ya hay historial local | `'en-segundo-plano'` |
| Vino de Zoho y no hay historial local | `'ahora'` |

- **MUST NOT** usarse `managed_by_app` ni `source` para decidirlo. La razón está escrita y es concreta:
  `writeTransition` las pone las dos en cualquier transición hecha desde Desk, también sobre un ticket
  venido de Zoho, así que usarlas dejaba a ese ticket **sin refrescar jamás** su historia de Zoho desde
  la primera vez que alguien lo moviera aquí — y como `syncTicketHistory` sólo se llama desde esa ruta,
  nadie más lo repararía (`ticketFuentes.ts:29-39`).
- Si el ticket nació en la app, preguntarle a Zoho es un `404` en cada apertura
  (`ticketFuentes.ts:30`).
- El plan `'en-segundo-plano'` **SHALL** ejecutarse sin bloquear la respuesta
  (`apps/desk/server/routes/tickets.ts:181-183`).

### RQ-TZ-11 · Las fechas ya anotadas se proponen, no se preguntan

`instanteUltimaTransicion` **SHALL** devolver cuándo se ejecutó por **última** vez una etapa sobre un
ticket (`apps/desk/server/db/fechasTicket.ts:22-34`).

- La **última** y no la primera: un informe devuelto a corrección se vuelve a escalar, así que la
  primera describe una revisión que quedó anulada (`fechasTicket.ts:11-12`).
- **SHALL** devolver el **instante** en ISO y **MUST NOT** recortarlo al día: `performed_at` es
  `timestamptz` en UTC, y recortarlo daría un día de más a cualquier cosa hecha después de las 19:00
  en Colombia (`fechasTicket.ts:14-16`).
- Cero filas **SHALL** significar «no consta» y **MUST NOT** significar «no ocurrió»: un ticket
  escalado en Zoho no tiene fila y la pantalla deja el campo vacío para teclearlo
  (`fechasTicket.ts:18-20`).

`primerDerivado` **SHALL** recorrer las filas de la más vieja a la más nueva y parar en la primera que
derive a alguien, saltándose las que no lo hicieron: el ticket nace y pasa por «Habilitar Servicio»
sin responsable, así que mirar sólo la fila más antigua daría `null` en todos los tickets del mundo
real (`apps/desk/server/db/primerDerivado.ts:23-33`, en especial `:12-15`). Una cadena vacía **MUST
NOT** contarse como persona (`:17-18`, `:30`).

---

## 3 · Comportamiento actual, a corregir

### 3.1 · El único camino que escribe un actor que no es una persona · **destino: decisión**

**Comportamiento actual.** `TRANSITION_ACTOR` (`transitionActor.ts:3`, valor `'Equipo Técnico'`,
configurable por entorno) puede llegar a `performed_by` por **un** camino: el **callback de n8n** de
la remisión (`apps/desk/server/routes/remision.ts:320`), que aplica el paso sin botón. Esa petición
**no tiene sesión** —n8n no manda la cookie—, así que firma quien creó la remisión y cae al marcador
sólo si la remisión no trae autor, que es el caso de las **históricas**
(`routes/remision.ts:315-319`).

Los otros dos usos del respaldo —anular y restaurar remisión, `routes/remision.ts:282` y `:292`— van
detrás de `requireAuth` y `requireAdmin` (`:275`, `:287`), así que ahí es defensivo y no alcanzable.
En el endpoint de transición tampoco se alcanza: el middleware exige sesión
(`routes/tickets.ts:35`).

**Lo confirmado es que ninguna fila se escribe sin actor. No que el actor sea siempre una persona
identificada.** M1.10 dice «sin el "quién" no hay trazabilidad de responsabilidad» (`R08.1.md:1677`),
y un `'Equipo Técnico'` en una remisión histórica cumple la letra y no el propósito. **Punto a
decidir**: si las históricas sin autor deben quedar marcadas como tales en vez de firmadas por un
nombre que parece una persona.

### 3.2 · La creación de los tickets viejos no se puede reconstruir · **sin destino: es irreversible**

**Comportamiento actual, no corregible.** Los tickets creados antes de que `createTicket` guardara el
payload completo tienen en `values` sólo `{ orden_venta }`, y **no hay forma de reconstruir la foto**
(`repo.ts:390-392`). Su historia cae a la fila del ticket, que es **estado actual**: si el ticket
cambió de prioridad o de clasificación después, la historia contará la creación con los valores de
hoy.

`lectorCreacion` lo maneja sin mentir sobre qué está enseñando (`ticketFuentes.ts:63-75`), pero la
pantalla no distingue las dos procedencias. *Hipótesis:* un lector no puede saber si la creación que
ve es la foto o el estado actual; no se ha verificado leyendo `HistoriaPanel.tsx`, que está fuera de
la red de pruebas.

### 3.3 · Un aviso puede perderse entre las dos escrituras · **destino: punto abierto nº 36**

**Comportamiento actual, aceptado y escrito** (maestro M1.9.3, `:1673-1674`). Los avisos se escriben
**después** de la transición y **fuera de su transacción**, porque `avisos` es tabla de la aplicación
y `applyTransition` vive en el paquete de sincronización (`ticketService.ts:115-122`).

La contrapartida: una caída justo entre las dos escrituras **pierde el aviso**
(`ticketService.ts:119-121`). Lo que importa —la derivación— sí queda en el ticket y en el historial.
El maestro pide tratarlo en sesión de trabajo específica antes de decidir (`:1669`). Detalle completo
en `derivacion-avisos`.

### 3.4 · C9 — el bodegaje de entrada mide contra un hito que cambió de significado · **destino F1A-04 → F1C**

**Comportamiento actual, a corregir en C9** (maestro M1.10, `:1678-1684`, punto abierto nº 41). La
fórmula del diccionario es `date_diff("Fecha creación ticket", "Fecha Remisión Entrada")`
(`R08.1.md:1679`), y el propio diccionario añade «2026 omitir esta información» porque Comercial crea
los tickets antes de que llegue el equipo (`:1680`).

La vía que el maestro prefiere es leer el historial, tomando la marca de `Ingreso a Servicio`
(`:1684`). **El dato existe ya**: `instanteUltimaTransicion(db, ticketId, 'ingreso_a_servicio')`
(`fechasTicket.ts:22-34`) devuelve exactamente esa marca, y `ingreso_a_servicio` es la transición que
exige `Fecha Remisión Entrada` (`transitions.ts:190-191`). Lo que falta no es la traza: es el
indicador que la lea.

Con el matiz de M1.3.2 que el maestro nombra (`:1684`): el hito de referencia **MUST** ser la
transición, **nunca** el estado inicial, porque el ticket nace en dos estados distintos según su
origen.

### 3.5 · La historia depende de un `syncTicketHistory` que sólo se llama desde una ruta

**Comportamiento actual, con su riesgo escrito.** El refresco del historial de Zoho ocurre al abrir el
ticket (`routes/tickets.ts:181-183`) y `syncTicketHistory` **sólo** se llama desde ahí
(`ticketFuentes.ts:36-38`). Un ticket que nadie abra no refresca su historia, y un fallo del plan
`'en-segundo-plano'` se registra como aviso y no se reintenta
(`routes/tickets.ts:182`).

*Destino: sin tanda asignada.* Se anota porque es el punto donde la línea de tiempo puede quedarse
incompleta sin que nada lo señale, y porque F1A-05 / F1B-09 —las auditorías de blueprint— van a leer
de aquí.

---

## 4 · Discrepancias

### 4.1 · Diseño ↔ código

| # | Dice el diseño | Dice el código | Lectura |
|---|---|---|---|
| D-1 | «Tickets creados en la app: **fallback** a `ticket_transitions` cuando no hay historial de Zoho»; `getTicketHistory` → «**si vacío**, arma desde `ticket_transitions`» (`design historia:16`, `:68`) | **Unificado**: `[...zoho, ...transiciones, ...remisiones]` ordenado (`historial.ts:157`) | **Superado, y el diseño original era el defecto.** El de agosto lo nombra como «el fallo más grave de los tres porque oculta datos que sí existen»: un ticket que vino de Zoho y se movió en la app no enseñaba jamás sus transiciones (`design unificada:19-23`) |
| D-2 | El historial no incluye remisiones (`design historia` no las menciona) | Tres eventos de remisión: creada, desenlace y anulada (`historial.ts:66-121`) | **Ampliado.** «Crear una remisión no deja rastro en el ticket» era el tercero de los tres fallos (`design unificada:24-25`) |
| D-3 | La composición vive en `server/db/history.ts` (`design historia:65-70`) | Repartida: `history.ts` guarda y lee lo de Zoho (`:13-32`), y la composición está en `apps/desk/server/db/historial.ts` y `conversacion.ts`, con los ayudantes comunes en `ticketFuentes.ts` | Movida al extraerse el paquete de sincronización. Los ayudantes compartidos por los **dos** compositores son estructura que el diseño no previó |
| D-4 | `createTicket` guarda `values = { orden_venta }` (`design C:78`) | Payload completo, diez claves (`repo.ts:396-400`) | **Ampliado a propósito**, y el diseño de agosto documenta el caveat que lo motivó (`design unificada:36-40`). Ver `tickets-core` D-5 |
| D-5 | Actor = constante temporal `'Equipo Técnico'`; «el login/roles reales son el Subsistema H» (`design B:20`) | Usuario de la sesión, con la constante como respaldo alcanzable por un solo camino (`ticketService.ts:111`; §3.1) | **Superado.** El Subsistema H llegó |

> **Nota sobre las citas del propio diseño de agosto.** Apunta a `createTicket` en `repo.ts:326`
> (`design unificada:38`) y a `getTicketHistory` en `history.ts:24` (`:20`); hoy están en `:380` y
> `:29`. Es la clase de cita que envejece, y la razón por la que estas specs se verifican contra el
> commit que declaran.

### 4.2 · Maestro ↔ código

| # | Dice el maestro | Dice el código | Lectura |
|---|---|---|---|
| M-1 | M1.10 `[DECIDIDO — R08]` (`:1677`): «el as-built ya escribe la marca de tiempo…; **lo que falta por confirmar es que registre siempre el usuario** que la ejecutó» | **Confirmado**: `performed_by` va en la misma sentencia que el resto de la fila (`repo.ts:282-286`) y está comprobado en las 34 transiciones, 36 ejecuciones (`transicionesEjecucion.test.ts:272-285`) | **El pendiente está cerrado**, con el matiz de §3.1: ninguna fila se escribe sin actor, pero el actor no siempre es una persona identificada. **Actualización para el maestro** (entrada 12 de `docs/sdd/F0-01_Correcciones_para_el_maestro.md`) |
| M-2 | Anexo G col. 12 (`:4328-4329`): «Hora de actualización del estado — marca de tiempo de cada transición» | `ticket_transitions.performed_at`, con `DEFAULT now()` (`design A:98`) | Sin discrepancia. La columna del diccionario tiene su equivalente, y con mejor granularidad: el diccionario guarda **una** marca por ticket y la tabla guarda **una por transición** |
| M-3 | Anexo G col. 7 (`:4322-4323`): «Hora de modificación — se actualiza automáticamente en cada cambio de estado **y en cada comentario nuevo**» | `modified_time=now()` se escribe en cada transición (`repo.ts:271`). Un comentario **suelto** no pasa por ahí | **Verificado en esta tanda: hoy la diferencia no se manifiesta.** Sólo hay dos sentencias `INSERT INTO conversations` en producción — el `upsert` del sync (`repo.ts:70-76`) y `writeTransition` (`repo.ts:262-266`)—, así que **la app no tiene ningún camino para comentar sin transicionar**. La diferencia aparecerá el día que lo tenga, y entonces `modified_time` dejará de cumplir lo que el diccionario dice. **Punto a tener delante en F1B**, que es donde llega la paridad de comentarios |
| M-4 | Anexo G.8 (`:4476`): «las columnas 48, 49 y 56 son las que la **C9** tiene que redefinir» | El dato para redefinirlas existe en el historial: `instanteUltimaTransicion` (`fechasTicket.ts:22-34`) y el `values` completo (`repo.ts:285`) | Sin discrepancia; se anota porque fija qué parte de C9 es de esta capacidad —la traza— y qué parte es de `kpis` —el cálculo—. Las columnas 48, 49 y 56 están rotas por **creación anticipada del ticket**, no por reentrancia, y su dueño es C9 (`packages/shared/src/reentrancia.ts:74-76`) |

---

## 5 · Fuera de alcance de esta spec

- **Las 34 transiciones, el grafo y los diez campos reentrantes** → `transitions-st`. Aquí sólo está la
  fila que cada transición escribe (RQ-TZ-01) y la regla que de ella se deriva (RQ-TZ-03).
- **El alta del ticket y el contenido de la foto de creación** → `tickets-core` RQ-TC-06. Aquí sólo
  está cómo se lee (RQ-TZ-02, RQ-TZ-07).
- **Quién puede ver el historial y por qué una persona con historial no se borra** → `permissions`
  RQ-PM-11.
- **El alta y el desenlace de las remisiones** → `remisiones`. Aquí sólo están los tres eventos que la
  historia deriva de ellas (RQ-TZ-06).
- **El cálculo de destinatarios de avisos y la cola de reintento del correo** → `derivacion-avisos`.
  Aquí sólo está que la escritura va fuera de la transacción y qué se pierde (§3.3).
- **La cadencia del sync, `syncTicketHistory` y el mapeo Zoho → fila** → `zoho-sync`. Aquí sólo está
  cuándo se le pregunta a Zoho (RQ-TZ-10) y que el `raw` se mapea al leer (RQ-TZ-05).
- **Los once indicadores de G.6, los tres bodegajes y la redefinición de C9** → `kpis` (no es de
  F0-02) y F1C-04 / F1C-06. Aquí sólo está que el dato de entrada existe (§3.4, M-4).
- **El relato de CONVERSACIONES** (`apps/desk/server/db/conversacion.ts`) comparte fuentes y ayudantes
  con la historia, pero su forma —prosa en vez de eventos— y su alcance —correo real con el cliente—
  se describen en la spec de su propia capacidad. Aquí sólo se registra que son **dos composiciones
  hermanas sobre las mismas fuentes** (`conversacion.ts:5-9` importa los mismos ayudantes que
  `historial.ts:5-8`).
- **Las pruebas de interfaz.** Los 39 ficheros `.tsx` de `apps/desk/src` quedan fuera de la red de
  pruebas por decisión de Gerencia (F0-00, 2026-09-08; `vitest.config.ts:16-20`). Todo requisito que
  cite un `.tsx` describe código **no cubierto por pruebas**.
