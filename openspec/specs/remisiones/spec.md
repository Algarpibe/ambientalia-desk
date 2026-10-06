# Capacidad `remisiones` — el documento de entrada del equipo, y lo que mueve

| Dato | Valor |
|---|---|
| Capacidad | `remisiones` (`openspec/config.yaml:129-131`) |
| Estado | **as-built parcial** (`status_at_start` de `config.yaml`), contrastado contra el código |
| Base verificada | commit `ad1875b`, rama `main`. `npm test`: 110 ficheros / 931 pruebas, 929 en verde y 2 saltadas. El código de `ad1875b` es idéntico al de `b6fb6d4`: `git diff --name-only ad1875b..HEAD` no devuelve ningún fichero fuera de `docs/`, `openspec/` y `CLAUDE.md` |
| Tanda que la escribe | F0-02 |
| Contenido | **14** requisitos (`RQ-RE-01`…`RQ-RE-14`, §§1–4) · **4** entradas de comportamiento actual (§5.1–§5.4) · **7** discrepancias diseño↔código (D-1…D-7) y **3** maestro↔código (M-1…M-3) |
| Diseño de procedencia | `docs/superpowers/specs/2026-08-04-remision-entrada-desenlace-design.md` (265 líneas, «Aprobado para planificación»). **Histórico congelado: materia prima, no autoridad** (plan R01.1:382) |
| Apartados del maestro | M1.3.1 (`R08.1.md:1141`) · M1.3.3 (`:1150-1161`) · M1.3.5 (`:1191-1192`) · M11.1 (`:2653`) · M11.3 (`:2690`) |
| Tandas que la tocan | **F1A** (tercera puerta de la OV) · **F1B-04** (recepción unificada, accesorios por lista cerrada, foto sólo con novedad) · **F1C-02** (remisión de salida en las dos vías de cierre) · **F1E-01** (punto abierto nº 14: quién escribe `remisiones_entrada`) |
| Depende de | `transitions-st` (los dos pasos sin botón y el grafo) · `tickets-core` (el ticket y su equipo) · `catalogo-equipos` (los accesorios del modelo) · `permissions` (quién anula) |

---

## 0 · Procedencia y método

Rigen las mismas reglas que en `transitions-st`: **ruta y línea** en toda afirmación sobre el código,
**línea del `.md` exportado** en toda afirmación sobre el maestro, y la palabra **hipótesis** delante
de lo demás. Cuando el diseño discrepa del código, manda el código y la discrepancia se escribe (§6).

**Toda cifra de esta spec la produjo un comando, y el comando queda escrito junto a ella.** Es la
regla que esta tanda se ganó: las cifras que se contaron a ojo salieron mal, las que salieron de un
script salieron bien.

### Las tres fuentes, enfrentadas

| Concepto | Diseño (04/08) | Maestro R08.1 | Código (`ad1875b`) |
|---|---|---|---|
| Qué cierra la remisión | «El colector decide»: un `Code` final clasifica y hace **una sola** llamada al callback (`design:21-23`) | M1.3.3 (`:1157`): el paso lo dispara «se crea una remisión para el ticket» | El ticket avanza **en el callback**, y sólo con desenlace confirmado (`apps/desk/server/routes/remision.ts:364-374`, reapuntada por `foto-solo-con-novedad`/F1B-04; cita válida en `a0a2935` como `:353-363`) |
| Los estados | `ok · ok_con_avisos · error` en el contrato del callback (`design:143`) | — | **Cuatro**, con `pendiente` como estado de partida (`packages/shared/src/remision.ts:60`) |
| El checklist «Incluye» | Sale del **perfil** por marca y modelo, replicando el `Switch Entrada - Marca` del flujo (`design:11`) | — | Sale de los **accesorios del modelo**; al perfil sólo se cae sin modelo enlazado (`apps/desk/server/db/checklistRemision.ts:31-42`) |
| La orden de venta | No aparece en el diseño | M1.3.5 (`:1192`): la fecha de remisión de salida «debe registrarse una sola vez» | La remisión de **entrada** puede capturarla, y es la **tercera puerta** —abierta— de «una OV, un ticket» (`routes/remision.ts:218-244`) |
| Alcance del cerrojo de envío | «Sólo se permite enviar cuando el estado es `pendiente` o `error`» (`design:165-166`) | — | Eso, **más** el corte por anulación y una reclamación atómica (`routes/remision.ts:279-299`, remedida el 2026-09-27 tras `parche-iv11-orden-venta` [+4 líneas antes de este punto]; reapuntada por `foto-solo-con-novedad`/F1B-04; cita válida en `a0a2935` como `:275-288`) |
| Remisión de salida | Fuera de alcance: «la rama de **salida** del flujo, intacta» (`design:261`) | M1.3.5 (`:1191`) la nombra como hito de las dos vías de cierre | `createRemision` escribe `'entrada'` **literal** (`apps/desk/server/db/remisiones.ts:48`). No hay forma de crear una de salida |

---

## 1 · Qué es una remisión, y de dónde salen sus datos

### RQ-RE-01 · La remisión es un documento, no una vista del ticket

Una remisión **SHALL** guardar los datos con los que se hizo, y **MUST NOT** derivarlos del ticket
cada vez que se muestra (`routes/remision.ts:170-174`).

- `empresa` y `persona_contacto` **SHALL** capturarse del cliente **al crear** la remisión
  (`routes/remision.ts:211`; columnas en `packages/zoho-sync/src/db/schema.sql:308-309`). La razón
  está escrita: si el ticket cambia de cliente, o el cliente se renombra en Books, «la remisión debe
  seguir diciendo a qué empresa y a qué persona correspondió cuando se hizo» (`:170-173`).
- `empresa` **SHALL** caer a `name` cuando el contacto de Books no traiga `companyName` (`:211`),
  porque el histórico importado se llenó con el nombre del cliente y sin ese respaldo «la columna
  significaría una cosa en unas filas y nada en otras» (`:204-210`; probado en
  `apps/desk/server/remisiones.test.ts:166`).
- El envío a n8n **SHALL** usar lo guardado en la remisión y **MUST NOT** releer el cliente
  (`apps/desk/server/remisionWebhook.ts:57`, razonado en `:50-56`; probado en
  `remisiones.test.ts:342`).

> **Given** una remisión creada y todavía sin enviar
> **When** alguien corrige el nombre del cliente en Books y después se envía
> **Then** el documento sale con la empresa que la remisión guardó, no con la corregida.

### RQ-RE-02 · El equipo, el perfil y el checklist se recalculan en el servidor

El alta **MUST NOT** aceptar del navegador el equipo, la marca, el modelo ni el perfil: los cuatro
**SHALL** resolverse desde el ticket (`routes/remision.ts:155-160`). La razón está escrita: son «los
que deciden qué checklist aplica, y confiar en el cliente permitiría remisionar con la lista
equivocada» (`:155-156`).

- El equipo **SHALL** salir de `equipos` y no de las columnas del ticket, que son «una copia tomada al
  crearlo»; sólo cuando el ticket no tiene `equipo_id` —los históricos de Zoho— se cae a ellas
  (`routes/remision.ts:46-53`, razonado en `:34-37`; probado en `remisiones.test.ts:79` y `:90`).
- Los ítems marcados **SHALL** validarse contra el mismo checklist con el que se abrió el formulario
  (`routes/remision.ts:162-168`): «si las dos puertas no leyeran de la misma fuente, lo que el técnico
  ve marcable dejaría de ser lo que el servidor acepta» (`:162-164`). Un ítem fuera de la lista
  **SHALL** responder `422` (`:168`; probado en `remisiones.test.ts:176`).

### RQ-RE-03 · El checklist «Incluye» sale de los accesorios del modelo

`checklistDeRemision` **SHALL** devolver los artículos de clase `accesorio` del modelo del equipo, en
el orden de su ficha y sólo los activos (`apps/desk/server/db/checklistRemision.ts:38-42`).

- **SHALL** caer al perfil de `remision_checklist` sólo cuando el ticket no tiene modelo enlazado
  (`:35-37`), que es la red de los históricos que nunca se pudieron enlazar (`:27-29`).
- **SHALL** declarar de dónde salió la lista en `origen: 'modelo' | 'perfil'` (`:13`, `:36`, `:41`),
  porque «este modelo aún no tiene lista» (accionable) no es lo mismo que «este tipo de equipo no
  lleva accesorios» (`:9-11`; probado en `remisiones.test.ts:101`).
- `perfilChecklist` **SHALL** evaluar el **modelo antes que la marca**, replicando el orden del nodo
  `Switch Entrada - Marca` del flujo (`packages/shared/src/remision.ts:31-36`, razonado en `:17-19`),
  con dos diferencias deliberadas respecto del original: comparación insensible a mayúsculas y
  espacios, y respaldo explícito a `otro` en vez del descarte silencioso del `Switch` (`:21-25`).
- Los perfiles **SHALL** ser seis (`remision.ts:8`), y `kunak` **SHALL** existir aunque hoy no tenga
  ítems: «su formulario nunca tuvo checklist» (`:6`).

---

### RQ-RE-15 · El serial es obligatorio al crear la remisión

El alta **SHALL** rechazar con `422` toda remisión cuyo serial resuelto esté vacío
(`routes/remision.ts:152-157`). Es la decisión `[DECIDIDO]` de M1.1 (`R08.1.md:1045`) — «El campo
número de serie es obligatorio al crear la remisión» —.

- El serial **SHALL** resolverse con la misma precedencia con la que se guarda: el equipo del catálogo
  manda sobre la copia propia del ticket (`remision.ts:153`). Una guarda sobre `found.row.serial` a
  secas rechazaría tickets que **sí** tienen equipo (probado en `remisiones.test.ts`, «M5 · con equipo
  del catálogo, manda el serial del equipo»).
- La cadena en blanco **SHALL** contar como ausente, igual que en el alta de tickets
  (`ticketService.ts:53-58`): el sync escribe `''` tan fácilmente como `NULL`.
- La guarda **SHALL** evaluarse **antes de cualquier escritura**, y en particular antes del bloque de
  la orden de venta, que hace un `UPDATE tickets` (bloque `remision.ts:218-244`, el `UPDATE` en `:239-243`). Fijado por la prueba
  «M5 · con orden de venta y sin serial: 422 y el ticket sigue sin OV».
- La guarda va con los otros `422` y **antes** del `409` de la remisión pendiente, y esa precedencia
  **SHALL** quedar fijada por una prueba que active las dos condiciones a la vez: cuando un ticket
  tiene simultáneamente una remisión `pendiente` vigente y el serial resuelto vacío, la respuesta
  **SHALL** ser `422`, **MUST NOT** ser `409`, y **MUST NOT** crear ninguna remisión nueva. No hereda la
  inversión abierta del **alta de tickets** (`tickets-core` §4.1), que es otra cosa y sigue sin
  corregir.

> **Given** un ticket sincronizado desde Zoho que aún no ha pasado por «Habilitar Servicio», y por
> tanto no tiene serial ni equipo del catálogo
> **When** alguien intenta crear su remisión
> **Then** responde `422` y no se crea ninguna remisión ni se escribe nada en el ticket.

**A quién afecta de verdad.** Un ticket nacido en la app siempre trae serial: el alta exige `equipoId`
del catálogo (`ticketService.ts:23-27`) y el equipo lo lleva. Lo que esto cierra es la otra entrada
—la que M1.3.2 llama la que «nunca se cruza» con aquélla—, donde el ticket llega de Zoho sin serial.

**La columna sigue admitiendo `NULL`, a propósito** (`schema.sql:279`): la decisión dice «obligatorio
**al crear**», y ahí está la guarda; la columna guarda además el histórico importado que esta
aplicación no controla.

#### Scenario: Serial vacío y remisión pendiente a la vez
- GIVEN un ticket con una remisión `pendiente` vigente y sin serial resuelto (ni equipo de catálogo ni
  copia propia)
- WHEN se intenta crear una segunda remisión para ese ticket
- THEN responde `422` por falta de serial, no `409` por remisión pendiente
- AND no se crea ninguna remisión nueva

#### Scenario: Comportamiento sin cambios cuando sólo aplica una guarda
- GIVEN un ticket con serial resuelto y una remisión `pendiente` vigente
- WHEN se intenta crear una segunda remisión
- THEN responde `409` con el `id` de la remisión pendiente, igual que hoy

---

## 2 · El envío y su desenlace

### RQ-RE-04 · Crear y enviar son dos pasos, y el orden importa

`POST /api/remisiones` **SHALL** dejar la remisión en `pendiente` y **MUST NOT** disparar el flujo
(`routes/remision.ts:213-216`; el literal `'pendiente'` en `db/remisiones.ts:48`). El disparo **SHALL**
ser un paso explícito, `POST /api/remisiones/:id/enviar` (`routes/remision.ts:273`).

La razón **SHALL** quedar escrita: las fotos se suben después, contra la remisión ya creada, «así que
en este punto todavía no existen y el documento saldría sin ellas» (`routes/remision.ts:213-215`).

### RQ-RE-05 · Los cuatro estados, y qué cuenta como confirmada

El estado de una remisión **SHALL** ser uno de cuatro —`pendiente`, `ok`, `ok_con_avisos`, `error`—
declarados en un solo sitio (`packages/shared/src/remision.ts:60`), con etiqueta en español **en
shared y no en la capa de presentación**, porque la necesitan las dos orillas: las pantallas de
remisiones y la historia del ticket, que se compone en el servidor (`:63-67`; mapa en `:78-83`).

- El mapa de etiquetas **SHALL** llevar la anotación `Record<string, string>` **y** el `satisfies
  Record<EstadoRemision, string>` a la vez, y las dos razones **SHALL** quedar escritas: `estado` sale
  de Postgres con un cast sin validar y la columna no tiene `CHECK`, así que indexarlo debe poder
  fallar sin lanzar; y el `satisfies` impide que falte uno de los cuatro conocidos
  (`remision.ts:69-77`).
- `ok_con_avisos` **SHALL** contar como éxito: «la remisión se generó pero falló algún aviso (correo o
  Telegram), y por decisión de producto eso NO invalida la remisión» (`db/remisiones.ts:129-131`).

### RQ-RE-06 · Una sola remisión sin desenlace por ticket, con salida

El alta **SHALL** rechazar con `409` una segunda remisión mientras haya una `pendiente` vigente
(`routes/remision.ts:144-153`, con `remisionPendienteDe` en `db/remisiones.ts:67-71`), y el `409`
**SHALL** devolver el `id` de la que ya existe: «sin él, lo único que puede hacer quien lo recibe es
volver a intentarlo a ciegas» (`routes/remision.ts:141-142`).

- La guarda **MUST NOT** ser absoluta: `permitirSegunda: true` **SHALL** dejar pasar, porque bloquear
  sin salida dejaría al técnico sin poder crear otra si n8n se cae, «que es justo la clase de callejón
  que este subsistema ya ha tenido dos veces» (`:136-139`; probado en `remisiones.test.ts:275`).
- Sólo bloquea una `pendiente` **vigente**: una con desenlace —bueno o malo— o anulada **MUST NOT**
  bloquear (`db/remisiones.ts:69`, razonado en `:63-65`; probado en `remisiones.test.ts:294`).
- El botón del cliente **SHALL** seguir visible con una pendiente, reetiquetado y llevando a ella
  (`apps/desk/src/lib/botonRemision.ts:34-35`, razonado en `:22-25`). Es **comodidad, no guarda**: la
  frontera es el `409` del servidor, y el propio fichero lo declara —«el servidor lo rechazaba con un
  409, pero el botón invitaba a intentarlo» (`:17-20`)—.

### RQ-RE-07 · La reclamación del envío es atómica

`reclamarEnvio` **SHALL** ser un **único `UPDATE` condicional** y **MUST NOT** ser un `SELECT` seguido
de un `UPDATE` (`apps/desk/server/db/remisiones.ts:170-182`). La razón está escrita: dos peticiones simultáneas —doble
clic, dos pestañas, o un reintento tras perder la cobertura— «pasarían las dos el filtro si se leyera
primero, y cada una generaría su propio documento y su propia carpeta en Drive» (`:156-159`).

- Se **SHALL** poder reclamar si nunca se disparó, si el intento anterior terminó (`resuelto_at`), o
  si el disparo lleva más de `VENTANA_REENVIO_SEGUNDOS` sin contestar (`:177`).
- `VENTANA_REENVIO_SEGUNDOS` (120) **SHALL** ser mayor que `ESPERA_DESENLACE_SEGUNDOS` (60), y la
  razón **SHALL** quedar escrita: iguales, el reintento que ofrece la pantalla caería justo cuando la
  reclamación caduca, y «un n8n simplemente lento —subir varias fotos a Drive pasa del minuto—
  acabaría generando un segundo documento mientras el primero sigue vivo»
  (`packages/shared/src/remision.ts:43` y `:53`, razonado en `:45-52`).
- Si el disparo no sale, la reclamación **SHALL** soltarse (`routes/remision.ts:318`, reapuntada por
  `foto-solo-con-novedad`/F1B-04; cita válida en `a0a2935` como `:307`), para que un
  webhook mal configurado no obligue a esperar la ventana entera (`:261-263`; probado en
  `remisiones.test.ts:448` y `:462`).
- La ruta **SHALL** responder `502` —no `500`— cuando n8n no contesta (`routes/remision.ts:320`,
  reapuntada por `foto-solo-con-novedad`/F1B-04; cita válida en `a0a2935` como `:309`;
  probado en `remisiones.test.ts:485`), y `dispararRemision` **SHALL** desenvolver `error.cause`,
  porque el `fetch` nativo de Node «casi siempre rechaza con el genérico "fetch failed"» y sin mirarlo
  el técnico vería siempre el mismo mensaje inútil (`remisionWebhook.ts:96-98`, razonado en `:93-95`).

> **Given** dos peticiones simultáneas de `/enviar` sobre la misma remisión pendiente
> **When** las dos pasan por `reclamarEnvio`
> **Then** exactamente una gana, la otra recibe `409`, y n8n recibe **un** disparo
> (`remisiones.test.ts:506`).

### Requirement: RQ-RE-08 · El cerrojo de reenvío tiene SEIS puertas, en este orden

`POST /:id/enviar` **SHALL** cortar en el orden observable siguiente:

| Orden | Guarda | Respuesta | Evidencia |
|---|---|---|---|
| 1 | La remisión no existe | `404` | `routes/remision.ts:276` |
| 2 | Está anulada | `409` | `:279-281` |
| 3 | Ya está cerrada (`ok` u `ok_con_avisos`) | `409` | `:284-286` |
| 4 | **Contenido del registro de entrada**: en el formulario nuevo, rotulado → fotos mínimas → foto de cada novedad (RQ-RE-26); en legado, novedad declarada y cero fotos (RQ-RE-27) | `422` | entre la de orden 3 (`:284-286`) y `reclamarEnvio` (`:297`) |
| 5 | Reclamación perdida | `409` | `:297-299` |
| 6 | Sin ticket asociado | `422` | `:302` |

La anulación **SHALL** cortar **antes** de mirar el estado del flujo, porque «generar un documento en Drive de
algo que se acaba de anular sería absurdo» (`:277-278`; probado en `remisiones.test.ts:662`).

La puerta de orden 4 **SHALL** ejecutarse **antes** de `reclamarEnvio` (orden 5) y **MUST NOT** escribir nada ni
reclamar el envío: `reclamarEnvio` es el único `UPDATE` que fija `enviado_at` (`db/remisiones.ts:170-182`), y un
`422` posterior a esa reclamación dejaría la remisión bloqueada durante toda la ventana de reenvío
(`VENTANA_REENVIO_SEGUNDOS`, 120 s). Sigue siendo **una sola** puerta, con una sola posición: lo que cambia es
la regla que aplica según la remisión sea del formulario nuevo o de legado. Encaja en el orden A<B<C<D de
F1B-10: existencia (404), estado y permiso (anulada, ya enviada), **contenido** (rotulado y fotos, o novedad sin
foto), unicidad (reclamación).

#### Scenario: Novedad sin fotos bloquea sin reclamar el envío
- GIVEN una remisión de legado pendiente con `hay_novedad = true` y cero fotos
- WHEN se llama `POST /:id/enviar`
- THEN responde `422`, no dispara a n8n, y `enviado_at` sigue `NULL`

#### Scenario: Reintento inmediato tras subir la foto tiene éxito
- GIVEN el `422` del escenario anterior
- WHEN se sube una foto y se reintenta `POST /:id/enviar` de inmediato
- THEN responde `200`, porque la reclamación nunca se había tomado

#### Scenario: La anulación gana a la puerta de contenido
- GIVEN una remisión anulada, de legado con `hay_novedad = true` y cero fotos, o del formulario nuevo incompleta
- WHEN se llama `POST /:id/enviar`
- THEN responde `409` de anulada, no `422`

#### Scenario: Ya enviada gana a la puerta de contenido
- GIVEN una remisión en `ok`, de legado con `hay_novedad = true` y cero fotos, o del formulario nuevo incompleta
- WHEN se llama `POST /:id/enviar`
- THEN responde `409` de ya enviada, no `422`

#### Scenario: Sin novedad o histórica, cero fotos, se envía como hoy
- GIVEN una remisión de legado con `hay_novedad` en `false` o `null`, y cero fotos
- WHEN se llama `POST /:id/enviar` sin otros bloqueos
- THEN responde `200`, igual que antes de este cambio

#### Scenario: La puerta de contenido va antes de reclamar, también con el formulario nuevo
- GIVEN una remisión del formulario nuevo sin las fotos mínimas
- WHEN se llama `POST /:id/enviar` y, tras el `422`, se completan las fotos y se reintenta de inmediato
- THEN el segundo intento responde `200` y dispara a n8n; mover la puerta detrás de `reclamarEnvio` pone esta prueba en rojo

### RQ-RE-09 · El callback es la única voz que cierra la remisión

`POST /api/remisiones/:id/callback` **MUST NOT** usar la cookie de sesión —n8n no la tiene— y **SHALL**
autenticarse con un secreto compartido en la cabecera `X-Remision-Callback`
(`routes/remision.ts:355-357`, reapuntada por `foto-solo-con-novedad`/F1B-04; cita válida en `a0a2935`
como `:344-346`).

- Sin `REMISION_CALLBACK_TOKEN` configurado la ruta **SHALL** responder `503` y **MUST NOT** quedar
  abierta: «una remisión que nadie puede cerrar es mejor que un endpoint sin autenticar» (`:297-299`,
  `:302`; probado en `remisiones.test.ts:542`).
- **SHALL** aceptar exactamente tres estados y rechazar el resto con `422` (`:308-309`; probado en
  `remisiones.test.ts:524`).
- La transición que se escriba detrás **SHALL** ir firmada por **quien creó la remisión**, no por el
  marcador genérico (`:320`). La razón está escrita: esta petición no tiene sesión, pero el autor
  «está guardado en la propia remisión», y sin esto «el hilo de un ticket llevado por una sola persona
  enseñaba un "Equipo Técnico" que parece un usuario y que nunca intervino» (`:315-319`; probado en
  `remisiones.test.ts:373`).
- El grupo entero de rutas **SHALL** vivir bajo `/api/remisiones` y no bajo `/api/tickets/:id/…`
  precisamente por esto: el callback «necesita su propio criterio de acceso por ruta»
  (`routes/remision.ts:23-27`).

### RQ-RE-10 · El orden de registro de las rutas es una regla, no una casualidad

`/api/remisiones/nueva` y `/api/remisiones/listado` **SHALL** registrarse **antes** que
`/api/remisiones/:id`, porque registrada antes `:id` se comería los dos literales
(`routes/remision.ts:39`, `:88` y `:110`, razonado en `:77-78` y `:108`). Hay regresión que lo fija
(`remisiones.test.ts:793`).

---

## 3 · Lo que la remisión mueve en el ticket

### RQ-RE-11 · El ticket avanza por el recuento de confirmadas, no por el acto de crear

`sincronizarEstadoPorRemision` **SHALL** ser la **única** escritura de `Remisión creada`
(`apps/desk/server/db/estadoPorRemision.ts:1-7` y `:52-60`), y se **SHALL** invocar desde **tres**
sitios, no desde uno:

| Llamada | Momento | Evidencia |
|---|---|---|
| Callback de n8n | Al conocerse el desenlace | `routes/remision.ts:374` (reapuntada por `foto-solo-con-novedad`/F1B-04; cita válida en `a0a2935` como `:363`) |
| Anulación | Tras marcar `anulada_at` | `:282` |
| Restauración | Tras deshacer la anulación | `:292` |

- El destino **SHALL** derivarse del recuento y **MUST NOT** derivarse de quién llama, «así el
  callback, la anulación y la restauración no pueden discrepar sobre en qué estado debería estar el
  ticket» (`estadoPorRemision.ts:16-19`).
- El corte de las dos entradas **SHALL** estar en `estadoPorRemision.ts:41`: un ticket que no esté en
  `Ticket creado` ni en `Remisión creada` **MUST NOT** moverse. Cubre dos casos con una sola
  condición —el ticket venido de Zoho, que se queda en `OV asignada`, y el ya avanzado, que no
  retrocede al anular— y las pruebas los barren por separado
  (`estadoPorRemision.test.ts:88`, `:101` y `:116`).
- Llamarla dos veces seguidas **SHALL** escribir **una** sola transición (`:50`; probado en
  `estadoPorRemision.test.ts:181`).

**El grafo, las dos constantes y la regla de las dos entradas son de `transitions-st` (RQ-TS-02 y
RQ-TS-03).** Aquí sólo está desde dónde se invoca el paso y con qué recuento.

### RQ-RE-12 · Anular es marcar, no borrar

`anularRemision` **SHALL** poner `anulada_at` y `anulada_por` y **MUST NOT** borrar la fila
(`db/remisiones.ts:146-148`). La razón está escrita: «el documento y el PDF pueden ya existir en Drive
y haberse mandado a un cliente, así que borrar la fila dejaría ese documento sin nada que lo
explique» (`:142-145`; el mismo razonamiento, en el esquema, en `schema.sql:315`).

- Anular y restaurar **SHALL** exigir administrador (`routes/remision.ts:329` y `:341`, reapuntadas por
  `foto-solo-con-novedad`/F1B-04; citas válidas en `a0a2935` como `:318` y `:330`; probado en
  `remisiones.test.ts:636`).
- El listado **MUST NOT** incluir anuladas por omisión, y `?incluirAnuladas=1` **SHALL** exigir
  administrador **dentro del handler** y no en la ruta entera, porque «un no-admin sigue pudiendo ver
  el listado normal» (`routes/remision.ts:88-93`, razonado en `:83-86`; probado en
  `remisiones.test.ts:770`). Ocultar el interruptor en la interfaz no basta: sin esta comprobación
  «cualquier usuario con sesión podría pedir esta URL a mano y ver quién anuló qué y cuándo»
  (`:83-85`). Es la regla invariable 13 aplicada: el filtro del navegador es comodidad **porque** la
  ruta lo impone y hay prueba.

### Requirement: RQ-RE-13 · Las fotos son datos de la app, con dos guardas propias

Las fotos **SHALL** guardarse en `public.remision_fotos` como base64 sobre `text`
(`schema.sql:294-303`), y su subida **SHALL** aceptar sólo cuatro tipos de imagen, **con SVG fuera**
porque permite script embebido (`routes/remision.ts:19-20` y subida en `:378-388`).

- La lectura **SHALL** servirlas con `X-Content-Type-Options: nosniff` (`:394`).
- El listado del panel **MUST NOT** devolver el base64; sólo la ruta de contenido lo sirve
  (`db/remisiones.ts:202` y `:226`; probado en `remisiones.test.ts:550`). Lo que el listado SÍ devuelve de cada
  foto es su metadato, incluidas `categoria` y `novedad` (RQ-RE-25).
- Cada foto **SHALL** poder llevar una categoría (`equipo`, `accesorios`, `embalaje` o `novedad`) y, para la de
  novedad, la clave de la novedad que documenta; la subida valida las dos (RQ-RE-25) y las puertas de
  `/enviar` las leen (RQ-RE-26). Las columnas son aditivas, `NULL`-ables y sin relleno: las fotos anteriores
  quedan con `categoria = NULL`.
- La categoría de la foto **MUST NOT** viajar a n8n: el cuerpo que arma `buildRemisionPayload` sigue llevando de
  cada foto sólo `fileName`, `mimeType` y `data` (`remisionWebhook.ts:23`).
- `urlSegura` **SHALL** exigir `https://` y rechazar la comilla doble antes de que `carpetaUrl` llegue
  a un `href` (`packages/shared/src/remision.ts:100-101`). Las dos razones están escritas y son
  distintas: el `javascript:` que se ejecutaría al clic si el secreto del callback se filtrara
  (`:87-90`), y la comilla que se saldría del atributo en el HTML que la historia del ticket devuelve
  por la API, «y dejaría la seguridad entera en manos de quien lo pinte» (`:94-98`).

#### Scenario: El listado de fotos trae categoría y novedad y no el base64
- GIVEN una remisión con una foto de categoría `novedad` y su clave
- WHEN se lista con `GET /api/remisiones/:id`
- THEN la foto trae `categoria` y `novedad` y no trae el base64

#### Scenario: Las fotos de n8n no ganan la categoría
- GIVEN una remisión con fotos categorizadas
- WHEN se arma el cuerpo con `buildRemisionPayload` a partir de `listFotosConContenido`
- THEN cada foto del cuerpo tiene exactamente las claves `fileName`, `mimeType` y `data`

### RQ-RE-16 · La tercera puerta: una orden de venta no puede quedar en dos tickets

Antes de escribir `orden_venta`, `fecha_orden_venta` y `salesorder_id` sobre el ticket destino,
`POST /api/remisiones` **SHALL** comprobar, por **tres vías** —`salesorder_id`, número y la asociación
vigente de `public.ov_asociaciones` (`tickets-core` RQ-TC-17)—, que la orden no pertenezca ya a otro
ticket, excluyendo el propio ticket destino
(`ticketConOrdenVenta(db, { salesorderId, numero }, ticketId)`,
`packages/zoho-sync/src/db/repo.ts:362-379`, ampliado con la tercera vía). La comprobación **SHALL**
ejecutarse dentro del bloque `if (b.salesOrderId)` de `remision.ts:218-244`, **después** del `422`
«Orden de venta no encontrada» (`:220`) y **antes** del `UPDATE` (`:239-243`).

Antes de esta comprobación de unicidad (escalón D), el alta de remisión **SHALL** aplicar la misma
guarda de cuarentena que las otras dos puertas (`tickets-core` RQ-TC-18, escalón C) cuando la OV
recibida lleve sufijo: una subOV en cuarentena se rechaza con `422` sin llegar a comprobar unicidad
(`remision.ts:220`).

Inmediatamente **después** de la cuarentena y **antes** de la unicidad (`:230`), el alta de remisión
**SHALL** aplicar la guarda de contrato vencido (`tickets-core` RQ-TC-25, escalón C): una subOV de un
lote cuyo contrato venció se rechaza con `422` sin llegar a comprobar unicidad, sin escribir las tres
columnas ni la asociación, y sin crear la remisión. La guarda **SHALL** ir dentro del mismo bloque
`if (b.salesOrderId)`, junto a las otras dos, y **MUST NOT** reordenar ninguna guarda existente del alta
de remisión.

**IV-12 queda intacto y a propósito.** El alta de remisión sigue incumpliendo el orden total de F1B-10 en
dos puntos (`remision.ts:127` C antes que A `:155`; `:220` A después de C `:127`, `:197`), y el `409` de
remisión pendiente (`:177`, escalón D) sigue corriendo **antes** de todo el bloque de la orden de venta.
La consecuencia observable, que este requisito fija en vez de esconder: una remisión pendiente en el
ticket gana **también** a la guarda de vencido (`:177` precede a `:220`); el vencido sólo le gana al `409`
de **unicidad de la OV** (`:232`).

Si la orden ya pertenece a otro ticket, la respuesta **SHALL** ser `409`, con el texto de
`ticketService.ts:151` («La orden de venta {ov} ya está asociada al ticket #{n}»), y **ninguna** de
las tres columnas **SHALL** quedar escrita. El `422` del serial (`remision.ts:152-157`) **SHALL**
seguir ganando al `409` nuevo, sin mover ninguna de las guardas. La condición
`WHERE ... COALESCE(orden_venta,'') = ''` (`:241`) **SHALL** mantenerse intacta: protege la carrera de
dos remisiones sobre el **mismo** ticket, una pregunta distinta de la que resuelve este requisito.

**Las tres vías son requisito, no preferencia.** La divergencia `orden_venta`/`salesorder_id` por
sincronización (IV-11) puede dejar a un ticket con sólo una de las dos columnas vigente; la asociación
vigente cubre además el caso en que ninguna columna coincide pero la OV sigue en uso. El mismo `UPDATE`
que escribe las tres columnas y la marca `ov_elegida_en_app_at` **SHALL** además insertar la fila de
asociación (`tickets-core` RQ-TC-17), en la misma transacción.

**Tercer punto de captura legítimo.** La remisión de entrada **SHALL** contarse como el tercer punto
de captura de la orden de venta, junto con el alta del ticket (`tickets-core` RQ-TC-08) y
`habilitar_servicio` (`transitions-st` RQ-TS-14).

**Guardas de aplicación, todavía necesarias.** Las tres guardas —alta, `habilitar_servicio` y ésta—
**MUST NOT** retirarse: `public.ov_asociaciones` sólo cubre lo que sus escritores hayan asociado desde
el cambio `asociacion-ov-ticket`; sin relleno retroactivo de los tickets existentes (dato de persona
pendiente, fuera de alcance) el histórico quedaría sin protección si se retiraran. Retirar sólo una de
las tres sería el defecto.

(Previously: tres vías, cuarentena en C y escritura de asociación, sin guarda de contrato vencido; el
escenario de reenvío citaba `:237`, que hoy es un comentario, y el `WHERE` de `orden_venta` vacía está en
`:241`, que es la línea que cita ahora.)

#### Scenario: Una orden ya asociada a otro ticket se rechaza antes de escribir nada
- GIVEN una orden de venta ya asociada al ticket 7001
- WHEN se crea una remisión de entrada sobre otro ticket con esa misma orden
- THEN responde `409`, con el texto que nombra la orden y el ticket 7001
- AND ninguna de las tres columnas del ticket destino queda escrita

#### Scenario: El 422 del serial gana al 409 nuevo
- GIVEN un ticket destino sin serial —ni equipo con serial— y una orden ya asociada a otro ticket
- WHEN se crea la remisión de entrada
- THEN responde `422` «Falta el serial», no `409`
- AND ninguna de las tres columnas del destino queda escrita, y el ticket dueño de la orden sigue
  siendo el único

#### Scenario: Reenviar la misma orden al propio ticket no se rechaza a sí mismo
- GIVEN un ticket cuya orden de venta ya es la que llega en la remisión (reintento de red, doble clic)
- WHEN se crea la remisión de entrada
- THEN la comprobación excluye al propio ticket destino y no llega al `409`
- AND el `UPDATE` es no-op porque `orden_venta` ya no está vacía (`:241`), y la remisión se crea con
  `201`

#### Scenario: El UPDATE deja la orden protegida del sincronizador
- GIVEN una remisión de entrada que captura una orden de venta libre para su ticket
- WHEN el `UPDATE` de `remision.ts:239-243` escribe `orden_venta`, `fecha_orden_venta` y
  `salesorder_id`
- THEN la misma sentencia deja la marca `ov_elegida_en_app_at` puesta sobre la fila
- AND una pasada posterior del sincronizador no pisa `orden_venta` ni `fecha_orden_venta` de ese
  ticket

#### Scenario: Una OV en cuarentena bloquea la remisión antes del 409 de unicidad
- GIVEN una OV con sufijo no canónico, sin asociación vigente
- WHEN se crea una remisión de entrada con esa OV
- THEN responde `422` de cuarentena, no `409` de unicidad, y no se escribe nada

#### Scenario: El UPDATE también crea la fila de asociación
- GIVEN una remisión de entrada que captura una OV libre para su ticket
- WHEN el `UPDATE` escribe las tres columnas y la marca `ov_elegida_en_app_at`
- THEN también existe una fila vigente en `public.ov_asociaciones` para ese ticket y esa OV

#### Scenario: Una subOV de contrato vencido bloquea la remisión
- GIVEN una subOV libre de un lote con contrato cuya fecha de fin es anterior a hoy, y un ticket destino
  con serial y sin remisión pendiente
- WHEN se crea una remisión de entrada con esa OV
- THEN responde `422` de contrato vencido, no se escriben las tres columnas ni la asociación y no se crea
  la remisión

#### Scenario: El vencido gana al 409 de unicidad de la OV — posición fijada por prueba
- GIVEN una subOV de un lote vencido con asociación vigente a otro ticket, y un ticket destino sin
  remisión pendiente
- WHEN se crea la remisión de entrada con esa OV
- THEN responde `422` de vencido, no `409`; invertir el orden de las dos guardas debe poner esta prueba
  en rojo (regla de mutación 1 de `CLAUDE.md`)

#### Scenario: La remisión pendiente (409, `:177`) gana al vencido — IV-12 conservado
- GIVEN un ticket con una remisión pendiente sin desenlace y una subOV de un lote vencido
- WHEN se crea otra remisión de entrada con esa OV y sin `permitirSegunda`
- THEN responde el `409` de remisión pendiente, no el `422` de vencido, y `remisiones.test.ts:988` sigue
  pasando sin cambios

#### Scenario: Los ítems fuera del checklist ganan al vencido
- GIVEN una subOV de un lote vencido y un ítem `incluye` que no está en el checklist
- WHEN se crea la remisión de entrada
- THEN responde el `422` «Ítems fuera del checklist» (`:197`), no el de vencido

#### Scenario: Un lote sin contrato o con contrato aún no iniciado no bloquea la remisión
- GIVEN una subOV libre de un lote sin contrato, y otra de un lote cuyo contrato empieza mañana
- WHEN se crea una remisión de entrada con cada una
- THEN ambas responden `201`, igual que hoy

### Requirement: RQ-RE-17 · La remisión de entrada declara si el equipo llega con novedad

El alta **SHALL** persistir en `public.remisiones.hay_novedad boolean` (columna calificada, aditiva y
`NULL`-able) si el equipo llega con novedad, de dos maneras según el origen del cuerpo:

- **Formulario nuevo** (`novedades` presente, RQ-RE-27): `hay_novedad` lo **deriva** el servidor de las
  novedades marcadas (RQ-RE-23) y el `hayNovedad` del cuerpo **SHALL** ignorarse. El servidor exige que la
  lista venga contestada —la lista vacía se rechaza—, de modo que «sin contestar» y «Sin novedad» dejan de
  confundirse.
- **Legado** (sin `novedades`): `hayNovedad` **SHALL** guardarse como `true` o `false` cuando el cuerpo trae
  exactamente eso, y como `null` en cualquier otro caso —ausente, `undefined` u otro tipo—, sin rechazar la
  petición por ese campo. La obligación de contestar no la impone el servidor en el legado.

Las remisiones **anteriores** a esta columna y las de `origen: 'historico'` **SHALL** leerse con
`hay_novedad = null` —«sin declarar»— y **MUST NOT** quedar sujetas a la guarda de RQ-RE-08 que exige foto por
novedad ni a las del formulario nuevo: la regla no es retroactiva.

El envío a n8n (`remisionWebhook.ts:5-24`) **MUST NOT** ganar ningún campo nuevo: ni `hayNovedad`, ni
`novedades`, ni `novedadOtro`, ni `rotulado*`. `observaciones` sigue viajando como hasta ahora; en el formulario
nuevo lleva el texto compuesto de RQ-RE-23.

#### Scenario: El alta de legado persiste el valor declarado
- GIVEN una remisión de entrada sin `novedades` y con `hayNovedad: true`
- WHEN se crea con `POST /api/remisiones`
- THEN la fila queda con `hay_novedad = true`

#### Scenario: En legado, cualquier valor que no sea true/false se guarda como no declarado
- GIVEN una remisión sin `novedades` y sin `hayNovedad` en el cuerpo, o con un valor que no es booleano
- WHEN se crea
- THEN la fila queda con `hay_novedad = null`, y la petición no se rechaza por ese campo

#### Scenario: En el formulario nuevo el hayNovedad del cuerpo no manda
- GIVEN una remisión con `novedades` de una novedad real y `hayNovedad: false`
- WHEN se crea
- THEN la fila queda con `hay_novedad = true`

#### Scenario: El payload a n8n no cambia
- GIVEN una remisión del formulario nuevo, con novedades, rotulado y fotos categorizadas
- WHEN se envía con `POST /:id/enviar`
- THEN el payload que construye `buildRemisionPayload` tiene exactamente las mismas claves que sin este cambio: no incluye `hayNovedad`, `novedades`, `novedadOtro`, `rotuladoPor`, `rotuladoAt` ni la categoría de las fotos
- AND `observaciones` lleva el texto compuesto

### Requirement: RQ-RE-18 · Predicados compartidos de exigencia de foto y de validación de novedades

`packages/shared` **SHALL** conservar el predicado puro `faltaFotoPorNovedad` (`packages/shared/src/remision.ts:110`)
con su comportamiento actual, como la regla de las remisiones de legado (RQ-RE-27), y **SHALL** exportar además,
en un módulo propio, las reglas puras del formulario nuevo, que dependen sólo de sus argumentos (la lista de
novedades con sus marcas, la selección, el texto y las fotos):

- la **validación de la selección**: lista no vacía, claves conocidas y activas, la novedad con `excluye_demas`
  no combinada con otra, y texto presente cuando alguna marcada tiene `exige_texto` (RQ-RE-23);
- la **derivación de `hay_novedad`** y la **composición de `observaciones`** (RQ-RE-23);
- el cálculo de **lo que falta** para enviar: las categorías mínimas sin foto y las novedades marcadas sin la
  suya (RQ-RE-26).

El servidor (RQ-RE-23, RQ-RE-25, RQ-RE-26) y el formulario (RQ-RE-19) **SHALL** consumir las MISMAS funciones —
regla invariable 13, punto 1: el cliente no reescribe la regla del servidor—. Ningún `.tsx` **MUST** llevar su
propia copia de las reglas de selección ni de fotos.

#### Scenario: Con novedad y cero fotos, el predicado de legado bloquea
- GIVEN `hayNovedad = true` y `fotos.length = 0`
- WHEN se evalúa `faltaFotoPorNovedad`
- THEN devuelve que la remisión está bloqueada

#### Scenario: Sin novedad, o con al menos una foto, el predicado de legado no bloquea
- GIVEN `hayNovedad` en `false` o `null`, o `fotos.length >= 1` con `hayNovedad = true`
- WHEN se evalúa `faltaFotoPorNovedad`
- THEN devuelve que la remisión no está bloqueada

#### Scenario: La validación de la selección distingue cada causa
- GIVEN una lista con sus marcas
- WHEN se valida una selección vacía, una con clave desconocida, una con clave inactiva, una con la novedad que excluye combinada con otra y una con «Otro» sin texto
- THEN cada una se rechaza con su causa propia, y una selección correcta se acepta

#### Scenario: La derivación y la composición siguen las marcas, no las claves
- GIVEN una selección de dos novedades, una con `exige_texto`, y el texto
- WHEN se derivan `hay_novedad` y `observaciones`
- THEN `hay_novedad` es `true` y `observaciones` junta las etiquetas con `; ` y añade `: {texto}` a la que exige texto
- AND cambiar las marcas, no las claves, cambia el resultado

#### Scenario: Lo que falta para enviar se calcula por categoría y por novedad
- GIVEN fotos con categorías y claves de novedad
- WHEN se calcula lo que falta para dos novedades marcadas
- THEN devuelve las categorías mínimas sin foto y las novedades sin la suya; una foto de una categoría no cubre otra; la novedad con `excluye_demas` no exige foto

### Requirement: RQ-RE-19 · El formulario pide rotulado, lista de novedades y fotos por categoría, y no deja crear ni continuar sin ellas

`CrearRemision.tsx` **SHALL** presentar, en lugar de la pregunta «¿El equipo llega con novedad?» y del texto libre
de observaciones:

- la lista de novedades servida por RQ-RE-22, de selección múltiple y sin ninguna marcada por defecto; marcar la
  novedad que excluye a las demás desmarca el resto y marcar otra la desmarca; marcar la que exige texto abre su
  campo de texto;
- la casilla «Rotulado y guardado», sin marcar por defecto;
- las fotos por categoría —equipo, accesorios y embalaje— y, por cada novedad marcada, la de esa novedad.

El formulario **SHALL** impedir crear la remisión sin lista contestada, sin la casilla marcada y sin el texto
exigido, y **MUST NOT** ofrecer «Continuar sin fotos» cuando aceptarlo dejaría sin foto alguna categoría mínima o
alguna novedad marcada. Todas las comprobaciones **SHALL** salir de las funciones compartidas de RQ-RE-18.

**Regla 13, decisión a decisión.** Cada decisión del formulario tiene su contrapartida en el servidor, con lo
que el formulario es comodidad probada: claves válidas y activas, lista vacía, exclusión de «Sin novedad», texto
de «Otro» y rotulado, en el alta (RQ-RE-23, RQ-RE-24); categoría y novedad de la foto, en la subida
(RQ-RE-25); fotos mínimas y foto por novedad, en `/enviar` (RQ-RE-26). La persona, la fecha y la hora del
rotulado y `hay_novedad` y `observaciones` los decide el servidor y el formulario no los decide.

#### Comprobaciones de persona de RQ-RE-19 — NO son escenarios automáticos
> Los `.tsx` quedan fuera de la red de pruebas por decisión de Gerencia (F0-00, `vitest.config.ts:16-20`).
> **Dueño:** Servicio Técnico, en la app. **ARCHIVAR ESTE CAMBIO NO LAS DA POR HECHAS.**

- **Persona-1.** GIVEN el formulario de alta · WHEN se abre · THEN muestra la lista de novedades de la base, sin
  ninguna marcada, y la casilla «Rotulado y guardado» sin marcar; no hay campo de observaciones libre.
- **Persona-2.** GIVEN «Sin novedad» marcada · WHEN se marca otra novedad · THEN «Sin novedad» se desmarca; y
  al revés.
- **Persona-3.** GIVEN «Otro» marcada y sin texto, o la casilla sin marcar · WHEN se intenta crear · THEN el
  formulario lo impide.
- **Persona-4.** GIVEN una novedad marcada y sin su foto, o alguna categoría mínima sin foto · WHEN se intenta
  crear o continuar · THEN el formulario lo impide y no ofrece «Continuar sin fotos».
- **Persona-5.** GIVEN un envío bloqueado por el `422` de RQ-RE-26 · WHEN el técnico lo lee · THEN el mensaje
  dice qué categoría o novedad falta.

---

## 4 · El histórico importado

### RQ-RE-14 · Una remisión sin ticket es un dato legítimo

`remisiones.ticket_id` **SHALL** admitir `NULL`, y la razón **SHALL** quedar escrita: «el histórico
importado de la hoja de Google trae remisiones que no calzan con ningún ticket de Zoho: NULL es un
estado legítimo, no un dato que falta» (`schema.sql:305-306`).

- El origen **SHALL** distinguirse en la columna `origen`, con `'app'` por omisión
  (`packages/zoho-sync/src/db/schema.sql:312-313`), porque «una remisión histórica no tiene fotos ni carpeta de Drive, y la
  pantalla debe poder tratarla distinto» (`:312`).
- El recuento de la importación **SHALL** distinguir **traer** un número de ticket de **haberlo
  resuelto** (`apps/desk/server/db/remisionesHistoricas.ts:14-30`), y la razón es un caso real: «en la
  primera corrida real, 113 filas traían número de ticket pero solo 90 enlazaron (23 apuntaban a
  tickets de Zoho que ya no están en la base)» (`:10-13`).
- El seed **SHALL** llevar **149** filas —`grep -cE '^\s*\{'` sobre
  `apps/desk/server/db/remisionesHistoricasSeed.ts` da 149, con la constante declarada en `:35`— y
  `apps/desk/server/admin.test.ts:403` fija el total contra la constante, no contra un literal.
- El `created_at` de las históricas **SHALL** anclarse a las 12:00 del día de servicio y no a
  medianoche, porque la columna es `timestamptz` y el panel formatea en `America/Bogota`: «un `date`
  convertido a pelo se pinta como el día ANTERIOR a las 19:00» (`schema.sql:319`). La condición del
  `WHERE` lo deja en no-op a partir de la segunda pasada, «en vez de reescribir 149 filas en cada
  arranque» (`:319-320`).

---

## 5 · Comportamiento actual, a corregir

*(La numeración de esta sección va aparte de la de requisitos: aquí se registra lo que hay, no lo que
debe haber.)*

### 5.2 · La remisión de salida no existe · **destino F1C-02**

**Comportamiento actual, a corregir en F1C-02.** `createRemision` escribe `'entrada'` como **literal
dentro del `INSERT`** (`apps/desk/server/db/remisiones.ts:48`), así que ninguna ruta del producto
puede crear una remisión de salida. La columna existe y admite el valor (`schema.sql:274`), el tipo de
shared lo declara —«la rama de salida está en el roadmap, así que no se da por supuesto»
(`packages/shared/src/types.ts:492`)— y la historia del ticket ya sabe redactarla
(`apps/desk/server/db/conversacion.ts:100`), pero nadie la escribe.

Importa porque el maestro apoya en ella las **dos vías de cierre** de M1.3.5 (`:1191`): «Por Facturar
→ Por Entregar → **remisión de salida** → Finalizado», y su hermana sin factura. Hoy ese hito no tiene
quien lo produzca.

*Hipótesis:* las filas con `tipo='salida'` que aparecen en las pruebas
(`db/conversacion.test.ts:140`, `db/historial.test.ts:124`) se insertan a mano en el `INSERT` de cada
prueba, no por una vía de producto. No se ha localizado ninguna que las cree, pero tampoco se ha
inspeccionado la base de producción en busca de filas de salida importadas.

### 5.3 · Las tres variables de entorno del subsistema no están en `DEPLOY.md` · **destino REASIGNADO: sin tanda asignada**

> **⚠️ REASIGNADO EL 2026-09-09** (`reasignar-desvios-huerfanos`). Decía «destino F1A» y F1A cerró sin
> documentarlas: **verificado hoy, `grep -n "REMISION\|N8N_REMISION" DEPLOY.md` sigue devolviendo
> cero**. F1A-02 (`6ea3ca8`) sí añadió 54 líneas a `DEPLOY.md`, pero las del canal de correo de C11,
> no éstas. **Queda sin tanda asignada.** Bajo la regla de secretos de `CLAUDE.md` un flag no
> documentado es defecto, no configuración, así que no puede quedarse apuntando a una épica cerrada.

**Comportamiento actual, a corregir cuando alguien toque el despliegue.** La regla de secretos de
`CLAUDE.md` dice que un interruptor «va en `.env.example` y `DEPLOY.md` con dos frases: qué enciende y
qué se rompe si se pone mal», y que «un flag no documentado se trata como defecto, no como
configuración».

`config.ts` lee tres variables propias de esta capacidad —`N8N_REMISION_WEBHOOK_URL`,
`N8N_REMISION_TOKEN` y `REMISION_CALLBACK_TOKEN` (`packages/zoho-sync/src/config.ts:111-113`)—, cada
una con su comentario de qué apaga si se deja vacía (`:42-47`). **Verificado por comando:**
`grep -n "REMISION\|N8N" DEPLOY.md` no devuelve **ninguna** línea. Las que sí están documentadas ahí
son `DATABASE_URL`, las seis `ZOHO_*`, `ENABLE_WRITES` y `SYNC_INTERVAL_MS` (`DEPLOY.md:81-91`), más
`SYNC_ACTIVITIES` y `SYNC_CONTACTS`, que tienen sección propia con las dos frases que la regla pide
(`:94-118`). Ese contraste es el que convierte esto en defecto y no en olvido de formato: el documento
sabe hacerlo, y con estas tres no se hizo.

*No verificado en esta tanda:* la otra mitad de la regla, `.env.example`. El fichero queda fuera del
alcance de lectura de esta sesión, así que **no se afirma nada sobre él**; lo que está probado es el
hueco de `DEPLOY.md`.

### 5.4 · El contrato con n8n se apoya en nombres de nodos que ninguna prueba comprueba · **destino: sin tanda asignada**

**Comportamiento actual.** El colector depende de los nombres de **17** nodos del flujo, y el propio
diseño lo registra como riesgo: «renombrar cualquiera de ellos lo rompe en silencio, igual que las 127
expresiones que ya existen en el flujo» (`design:252-256`). Del lado del repositorio el contrato está
escrito en dos sitios —el cuerpo que exige `Validar payload`
(`apps/desk/server/remisionWebhook.ts:26-30`, con el tipo en `:5-24`) y el formato de fotos que espera
`Code fotos Entrada` (`:18-23`)—, pero **ninguna prueba puede verificarlo**: el flujo vive en n8n, no
en el árbol.

⚠️ `Remisiones_ST_3.13` (`2OJl7Y75KykNNHyT`) es **producción y no se toca** (`design:12`). El flujo
que este subsistema usa es `_Desk` (`BpLlnPAfjpHaoeKA`), **activo y en uso real**.

*Hipótesis:* la única contención práctica hoy son las cuatro ejecuciones manuales que el diseño
describe (`design:222-229`). No están en ninguna tanda del §5 del plan.

---

## 6 · Discrepancias

### 6.1 · Diseño ↔ código

| # | Dice el diseño | Dice el código | Lectura |
|---|---|---|---|
| D-1 | El checklist sale del **perfil** por marca y modelo (`design:11`; `perfilChecklist` en `packages/shared/src/remision.ts:27`) | Sale de los **accesorios del modelo**; al perfil sólo se cae sin modelo enlazado (`checklistRemision.ts:35-42`) | **Superado por la fase 2.** El motivo está escrito en el código: el perfil «agrupaba familias enteras —todos los `ap*` de Horiba compartían lista—, así que un APMA y un APSA recibían lo mismo aunque no lleven lo mismo» (`checklistRemision.ts:19-22`). El perfil no se retiró: quedó como red de los ~79 históricos sin equipo enlazado (`:27-29`) |
| D-2 | Cerrojo en `/:id/enviar`: «sólo se permite enviar cuando el estado es `pendiente` o `error`» (`design:165-166`) | Eso **y dos guardas más**: la anulación corta antes (`routes/remision.ts:279-281`) y la reclamación atómica después (`:297-299`, reapuntada por `foto-solo-con-novedad`/F1B-04; cita válida en `a0a2935` como `:286-288`) | **Ampliado.** El diseño resolvía el reintento del usuario; el código añadió el reintento *concurrente* —doble clic, dos pestañas—, que el diseño no contemplaba |
| D-3 | «No hay migración de esquema: `remisiones.estado`, `remisiones.resultado` y `remisiones.resuelto_at` ya existen» (`design:173-175`) | Cierto para esas tres. Pero el subsistema **sí** ganó columnas después: `enviado_at` (`schema.sql:291`), `empresa` y `persona_contacto` (`:308-309`), `origen` (`:312`), `anulada_at` y `anulada_por` (`:316-317`), más el `DROP NOT NULL` de `ticket_id` (`:306`) | El diseño era exacto **el 04/08**. Se anota porque es la clase de afirmación que envejece: siete sentencias después, «no hay migración de esquema» ya no describe este subsistema. Seis de esas siete son de las 23 sin calificar de IV-6 |
| D-4 | El resultado se sondea «cada 2 s hasta 60 s» desde `CrearRemision.tsx` (`design:181`) | La espera es constante compartida, `ESPERA_DESENLACE_SEGUNDOS = 60` (`packages/shared/src/remision.ts:43`), con una hermana que el diseño no tenía: `VENTANA_REENVIO_SEGUNDOS = 120` (`:53`) | **Ampliado, y la ampliación es la que cierra el agujero.** El diseño dejaba las dos esperas al mismo valor implícito; el código las separa a propósito y escribe por qué (`:45-52`) |
| D-5 | Empresa y persona de contacto no aparecen: el documento las toma del cliente | La remisión las **captura al crearse** y el envío usa las guardadas (`routes/remision.ts:211`; `remisionWebhook.ts:57`) | **Añadido después del diseño.** El razonamiento está en el código (`remisionWebhook.ts:50-56`): entre crear y enviar alguien pudo corregir el cliente en Books, y «el documento no puede desdecir lo que la remisión dice que era» |
| D-6 | La orden de venta no se menciona en ninguna parte del diseño | La remisión de entrada **puede capturarla** (`routes/remision.ts:218-244`), y ésa es la tercera puerta abierta de «una OV, un ticket» | **Añadido después, y con un defecto dentro.** El código explica el porqué del añadido —«se puede capturar aquí para no tener que hacerlo en Habilitar Servicio», opcional porque «cuando el equipo entra, la venta puede no existir todavía» (`:205-208`)—; lo que no explica es por qué esa vía no comprueba la regla. Ver §5.1 |
| D-7 | «El panel de remisiones en `TicketDetailView` (sigue en pendientes)» queda **fuera de alcance** (`design:260`) | Existe: `GET /api/remisiones?ticketId=` lo alimenta (`routes/remision.ts:97-102`), y en el cliente están `PanelRemisiones.tsx`, `RemisionesPage.tsx` y `ResultadoRemision.tsx` | **Construido después.** Se anota para que nadie lea el «fuera de alcance» del diseño como estado actual |

> **Nota sobre el propio diseño.** Cita `CrearRemision.tsx` diciendo que `submit()` llama a `onCreada()`
> y cierra el modal de inmediato (`design:179`). Es la clase de cita que envejece con el fichero, y
> aquí no se verifica: los 39 ficheros `.tsx` de `apps/desk/src` quedan fuera de la red de pruebas por
> decisión de Gerencia (F0-00, 2026-09-08; `vitest.config.ts:16-20`).

### 6.2 · Maestro ↔ código

| # | Dice el maestro | Dice el código | Lectura |
|---|---|---|---|
| M-1 | M1.3.3 (`:1157`): el paso `Ticket creado → Remisión creada` lo dispara «**se crea** una remisión para el ticket» | Crear la remisión **no mueve nada**: la deja en `pendiente` (`routes/remision.ts:213-216`). El ticket avanza en el **callback**, y sólo si el desenlace es `ok` u `ok_con_avisos` (`:364-374`, reapuntada por `foto-solo-con-novedad`/F1B-04; cita válida en `a0a2935` como `:353-363`; el recuento, en `estadoPorRemision.ts:43-49`) | **Discrepancia real, no de matiz.** El propio código lo dice donde importa: «aquí es donde el ticket avanza a "Remisión creada", **y no al crear la remisión**: es este callback el que dice que el documento existe de verdad en Drive. Un desenlace en `error` no mueve nada» (`routes/remision.ts:365-367`, reapuntada por `foto-solo-con-novedad`/F1B-04; cita válida en `a0a2935` como `:354-356`). Con la redacción del maestro, una remisión fallida movería el ticket, que es justo lo que la implementación evita, y hay prueba de ello (`remisiones.test.ts:847`). **Corrección para el maestro**: el disparador es el desenlace confirmado, no el alta |
| M-2 | M1.3.5 (`:1191`): las dos vías de cierre pasan por «**remisión de salida**» antes de `Finalizado` | No hay forma de crear una: `createRemision` escribe `'entrada'` literal (`db/remisiones.ts:48`) | **No construido**, registrado en §5.2. El maestro apoya el rediseño de C4 en un hito que hoy no tiene productor. **Punto a decidir** antes de F1C-02: si la remisión de salida se construye, o si la vía de cierre se apoya en otro hito |
| M-3 | M11.1 `[DECIDIDO 21/08]` (`:2653`): el objetivo es «dejar de usar herramientas fragmentadas —**n8n**, Zoho Desk 1.0 y hojas de cálculo de Excel—». M11.3 (`:2690`) matiza: n8n «se integra y progresivamente se absorbe» | El documento de remisión **lo genera n8n entero**: el repositorio arma el cuerpo (`remisionWebhook.ts:31-66`) y espera el callback. Sin `N8N_REMISION_WEBHOOK_URL` la remisión se queda en `pendiente`, y el código lo declara estado legítimo y no fallo silencioso (`remisionWebhook.ts:72-73`, `:80`) | Sin discrepancia con M11.3, que es la redacción vigente; sí con la lectura corta de M11.1. Conviene que quede escrito **cuánto** queda por absorber: hoy n8n es la única vía de producir el documento, el PDF, la carpeta de Drive y la etiqueta `.dymo`. Ninguna tanda del §5 del plan lo absorbe. **Punto a decidir**, no corrección |

---

## 7 · Fuera de alcance de esta spec

- **El grafo de estados, las 34 transiciones, los dos pasos sin botón como declaración y la regla de
  las dos entradas que no se cruzan** → `transitions-st` (RQ-TS-02, RQ-TS-03, RQ-TS-05). Aquí sólo
  está desde dónde se invoca el paso y con qué recuento (RQ-RE-11).
- **El ticket, su identidad, sus campos y la primera puerta de la orden de venta** → `tickets-core`
  (RQ-TC-08). Aquí sólo está la tercera puerta, que es la que está abierta (§5.1).
- **Las guardas de sesión, el modelo de roles y qué significa «administrador»** → `permissions`. Aquí
  sólo está que anular y ver anuladas lo exigen (RQ-RE-12).
- **La fila del historial, su composición y cómo se pinta la remisión en el hilo del ticket** →
  `trazas`.
- **Los avisos de campana y de correo que una transición genera** → `derivacion-avisos`. Ninguna ruta
  de remisión los emite.
- **El catálogo de tipos, marcas, modelos, artículos y accesorios** → `catalogo-equipos` (no es de
  F0-02). Aquí sólo está que el checklist lo consume (RQ-RE-03).
- **Lo que llega de Zoho y de Books, y la cadencia del sync** → `zoho-sync`. Aquí sólo está que la
  orden de venta y el cliente se resuelven contra Books al crear (RQ-RE-01, D-6).
- **Las 23 `ALTER TABLE` sin calificar de `schema.sql`** → registradas como **IV-6** en
  `openspec/config.yaml` y en `CLAUDE.md`, con su análisis en `tickets-core` §5.3. Siete de las
  sentencias de este subsistema están entre ellas (`schema.sql:291`, `:306`, `:308-309`, `:312`,
  `:316-317`); aquí se citan por su contenido, no como desvío.
- **Las pruebas de interfaz.** Los 39 ficheros `.tsx` de `apps/desk/src` quedan fuera de la red de
  pruebas por decisión de Gerencia (F0-00, 2026-09-08; `vitest.config.ts:16-20`). `botonRemision.ts`
  sí está cubierto (`apps/desk/src/lib/botonRemision.test.ts`), pero los componentes que lo consumen
  no.

---



### RQ-RE-20 · «Remisión de entrada vigente» tiene una sola definición, y una prueba afirma en qué diverge del recuento de `Remisión creada`

El repositorio **SHALL** tener **una** definición de «remisión de entrada vigente», y la guarda de `habilitar_servicio`
(`transitions-st` RQ-TS-33) y el cliente **SHALL** consumirla. Hoy hay varias nociones vecinas (molde H5, ninguna rota por
separado):

| Noción | Dónde | `anulada_at IS NULL` | `estado` | `tipo` |
|---|---|---|---|---|
| Pendiente de una remisión nueva | `apps/desk/server/db/remisiones.ts:67-73` | sí | sólo `pendiente` | no filtra |
| Remisiones del panel del ticket | `apps/desk/server/db/remisiones.ts:76-79` | sí | cualquiera | no filtra |
| Recuento que mueve `Remisión creada` | `apps/desk/server/db/estadoPorRemision.ts:43-47` | sí | `ok` u `ok_con_avisos` | no filtra |
| `vigentes` del botón de remisión (cliente) | `apps/desk/src/lib/botonRemision.ts:33` en `a77ec68` | sí | cualquiera | `entrada` |

**La definición (a la letra de Gerencia; no es un supuesto):** `tipo = 'entrada'` y `anulada_at IS NULL` —creada y no
anulada—, **sea cual sea su estado de envío** (`docs/sdd/Decisiones_Gerencia_2026-09-10.md:355-356`;
`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1230`). **SHALL** vivir como predicado puro
en `packages/shared`, y la cuarta noción de la tabla **SHALL** pasar a consumirlo (es la misma condición). Las dos
primeras **MUST NOT** cambiar de comportamiento: cumplen otro oficio (la unicidad de una remisión en curso, RQ-RE-06; el
listado del panel), y `estadoPorRemision.ts` **MUST NOT** reescribirse (su recuento mueve el estado del ticket).

**«Confirmada» es otra noción, y no entra en la guarda.** Que una remisión esté en `ok` u `ok_con_avisos` decide el
estado `Remisión creada` (RQ-RE-11; `transitions-st` RQ-TS-03) y, en el cliente, el aviso no bloqueante de «remisión sin
confirmar» y que no se ofrezca crear otra (`apps/desk/src/lib/botonRemision.ts:39`). El cliente **SHALL** tomarla de un
predicado de `packages/shared` y **MUST NOT** usarla para desactivar «Habilitar Servicio».

**La guarda y el recuento divergen A PROPÓSITO — consecuencia declarada, no defecto.** El recuento de
`sincronizarEstadoPorRemision` cuenta sólo las confirmadas y no filtra `tipo`; la guarda cuenta toda entrada no anulada.
Por tanto:

- **Divergencia en `estado`:** con una remisión de entrada no anulada en `pendiente` o en `error`, la guarda
  **SHALL** habilitar y el recuento **MUST NOT** pasar el ticket a `Remisión creada`. Un ticket puede así seguir en
  `Ticket creado` y habilitarse desde ahí.
- **Divergencia en `tipo`:** con una fila confirmada y no anulada de `tipo` distinto de `entrada`, la guarda **MUST NOT**
  habilitar y el recuento sí cuenta. Hoy no puede darse porque `createRemision` escribe siempre `'entrada'`
  (`apps/desk/server/db/remisiones.ts:44-53`), y llegará con la remisión de salida (F1B-17).

**Una prueba SHALL enfrentar la guarda y el recuento** recorriendo la misma tabla de filas —`pendiente`, `error`, `ok`,
`ok_con_avisos`, anulada, histórica `ok`, una segunda vigente tras una anulada, y una de `tipo` distinto— y **SHALL
afirmar el veredicto de cada una, fila a fila**, nombrando las dos divergencias. Si alguien alinea una noción con la otra
sin una decisión —filtra `estado` en el predicado, lo quita del recuento o filtra `tipo` en el recuento—, la prueba
**SHALL** ponerse roja.

#### Scenario: Guarda y recuento coinciden donde deben
- GIVEN un ticket con, por separado, una remisión de entrada `ok`, `ok_con_avisos`, histórica `ok`, anulada, y otra vigente tras una anulada
- WHEN se evalúan la guarda de `habilitar_servicio` y el recuento de `sincronizarEstadoPorRemision`
- THEN las dos dan el mismo veredicto en cada caso: cuentan las cuatro no anuladas y no cuenta la anulada

#### Scenario: La divergencia por `estado` está declarada y afirmada
- GIVEN un ticket en `Ticket creado` con una remisión de entrada no anulada en `pendiente` (y, por separado, en `error`)
- WHEN se evalúan la guarda y el recuento
- THEN la guarda habilita, el recuento no pasa el ticket a `Remisión creada`, y la prueba lo nombra como divergencia declarada; reintroducir el filtro de estado en el predicado, o quitarlo del recuento, la pone roja

#### Scenario: La divergencia por `tipo` está declarada y afirmada
- GIVEN una fila no anulada, en `ok`, con `tipo` distinto de `entrada`, insertada a mano
- WHEN se evalúan la guarda y el recuento
- THEN la guarda no la cuenta, el recuento sí, y la prueba lo nombra como divergencia declarada; filtrar `tipo` en el recuento la pone roja

#### Scenario: Una remisión pendiente sigue bloqueando la creación de otra
- GIVEN un ticket con una remisión `pendiente` no anulada
- WHEN se evalúa la noción de pendiente (`remisionPendienteDe`)
- THEN sigue devolviéndola —la unicidad de RQ-RE-06 no cambia—, y la guarda de «Habilitar Servicio» dice que **sí** hay una vigente

#### Scenario: El listado del panel no cambia
- GIVEN un ticket con remisiones de cualquier estado, algunas anuladas
- WHEN se lista con `listRemisionesByTicket`
- THEN devuelve las no anuladas de cualquier estado, como antes, y el cliente aplica el predicado compartido encima

#### Scenario: El cliente no redefine «vigente»
- GIVEN `apps/desk/src` y `packages/shared`
- WHEN se buscan condiciones sobre `anulada_at` o `tipo` de una remisión para decidir si «Habilitar Servicio» se puede pulsar, o sobre `estado` para decidir el aviso de «sin confirmar»
- THEN las dos salen de predicados de `packages/shared`, no hay copia de ninguna en el cliente, y el `estado` no interviene en desactivar el botón

### Requirement: RQ-RE-21 · El catálogo de novedades de entrada es dato de la base, no constante del código

El sistema **SHALL** guardar los tipos de novedad de la remisión de entrada en `public.catalogo_novedades`, con
las columnas `clave` (llave primaria), `etiqueta`, `orden`, `activo`, `excluye_demas` y `exige_texto`. La tabla
**SHALL** crearse con esquema calificado y figurar en `PUBLIC_TABLES`
(`packages/zoho-sync/src/db/migrate.ts:70-73`), de modo que el guardián de `migrate.test.ts` la reconozca.

- Tras `migrate`, la tabla **SHALL** contener **diez** filas activas, en este orden y con estas etiquetas, que son
  la lista de `decision/f1b04-desplegables` (`openspec/config.yaml:2941`): «Sin novedad» · «Golpe o abolladura en
  la carcasa» · «Rayón o daño estético» · «Pantalla o display dañado» · «Conector o puerto dañado» · «Falta un
  accesorio» · «Embalaje inadecuado o dañado» · «Humedad, suciedad o contaminación visible» · «Sello o precinto
  roto» · «Otro».
- Las dos marcas **SHALL** ser el comportamiento: `excluye_demas` es verdadera sólo en «Sin novedad» y
  `exige_texto` es verdadera sólo en «Otro». El servidor **SHALL** decidir leyendo las marcas y **MUST NOT**
  decidir por la `clave` ni por la `etiqueta`.
- La siembra **SHALL** ser idempotente por `clave`: reaplicar `migrate` **MUST NOT** duplicar filas ni pisar lo
  que alguien haya editado (etiqueta, orden, marcas o `activo`).
- Una novedad **SHALL** retirarse con `activo = false` y **MUST NOT** retirarse borrando la fila: la siembra
  reinsertaría una fila borrada en el siguiente arranque.
- Toda sentencia de `schema.sql` que cree o modifique estas tablas y columnas **SHALL** calificar el esquema
  (`public.`), y la siembra **MUST NOT** rellenar ni actualizar filas existentes de `public.remisiones` ni de
  `public.remision_fotos`.

#### Scenario: Tras migrar quedan las diez novedades, en orden y con las dos marcas
- GIVEN una base vacía a la que se aplica `migrate`
- WHEN se lee `public.catalogo_novedades` ordenada por `orden`
- THEN hay diez filas activas con las etiquetas de la lista, en ese orden
- AND sólo «Sin novedad» tiene `excluye_demas` y sólo «Otro» tiene `exige_texto`

#### Scenario: Reaplicar migrate no duplica ni pisa lo editado
- GIVEN la tabla sembrada, con una fila editada a mano (otra etiqueta, `activo = false`) y otra con una marca cambiada
- WHEN se vuelve a aplicar `migrate`
- THEN siguen diez filas, y las dos filas editadas conservan lo editado

#### Scenario: El guardián conoce la tabla y sus sentencias calificadas
- GIVEN `schema.sql` con `CREATE TABLE public.catalogo_novedades` y las `ALTER TABLE public.…` de las columnas nuevas
- WHEN corre el guardián de `migrate.test.ts`
- THEN `catalogo_novedades` figura en `PUBLIC_TABLES` y pasa; quitar `public.` al `CREATE`, o a una `ALTER` de `remision_fotos`, o quitar el nombre de `PUBLIC_TABLES`, lo pone en rojo

#### Scenario: Una sentencia de relleno sobre filas existentes pone en rojo el guardián
- GIVEN `schema.sql` al que se añade un `UPDATE` sobre `public.remisiones` o `public.remision_fotos` para rellenar las columnas nuevas
- WHEN corre la prueba que vigila el fichero
- THEN se pone en rojo

#### Scenario: Cambiar una marca de la tabla cambia lo que el servidor acepta
- GIVEN la fila «Otro» con `exige_texto` apagada en la tabla
- WHEN se crea una remisión del formulario nuevo con «Otro» y sin texto
- THEN el alta se acepta, porque el servidor lee el dato y no una constante

### Requirement: RQ-RE-22 · La lista de novedades activas se sirve al formulario desde la base

El sistema **SHALL** exponer una ruta de lectura, accesible con sesión, que devuelva las novedades con
`activo = true`, ordenadas por `orden`, cada una con su `clave`, su `etiqueta` y sus dos marcas
(en la respuesta, en camelCase como el resto de la API: `excluyeDemas`, `exigeTexto`; las columnas de la tabla
siguen en snake_case). La ruta **MUST NOT** devolver las novedades inactivas, y sin sesión **SHALL**
responder `401`. El formulario **SHALL** pintar esa lista y **MUST NOT** llevar una copia propia de las etiquetas
ni de las marcas.

#### Scenario: La ruta devuelve las activas en orden con sus marcas
- GIVEN la lista sembrada, con una novedad pasada a `activo = false`
- WHEN un usuario con sesión pide la lista
- THEN recibe sólo las activas, en orden de `orden`, con `clave`, `etiqueta`, `excluyeDemas` y `exigeTexto`

#### Scenario: Sin sesión no hay lista
- GIVEN una petición sin sesión
- WHEN pide la lista de novedades
- THEN responde `401`

### Requirement: RQ-RE-23 · El alta valida las novedades marcadas y deriva `hay_novedad` y `observaciones`

Cuando el cuerpo de `POST /api/remisiones` trae `novedades` (la clave presente con cualquier valor distinto de
`undefined`; ver RQ-RE-27), el alta **SHALL** tratarlo como la lista de claves de novedad marcadas y **SHALL**
rechazar con `422`, sin crear la remisión ni escribir nada en el ticket, cualquiera de estos casos:

- `novedades` no es una lista de textos, o es una lista vacía. «Sin contestar» y «Sin novedad» **MUST NOT**
  confundirse: la lista vacía se rechaza.
- Una clave no existe en `public.catalogo_novedades` o está inactiva (`activo = false`).
- Una novedad con `excluye_demas` verdadera viene combinada con cualquier otra.
- Una novedad con `exige_texto` verdadera está marcada y `novedadOtro` falta o es sólo espacios.

Una clave repetida **SHALL** contar una sola vez. Con todas las comprobaciones superadas, el alta **SHALL**:

- guardar en `public.remisiones.novedades` (`jsonb`) una **instantánea** de lo marcado —cada elemento con su
  `clave` y su `etiqueta`—, en el orden de `orden` del catálogo, de modo que corregir después una etiqueta del
  catálogo **MUST NOT** cambiar lo que la remisión guardó (RQ-RE-01);
- guardar en `novedad_otro` el texto recortado cuando haya una novedad marcada con `exige_texto`, y `NULL` en
  otro caso;
- **derivar** `hay_novedad`: `true` si hay al menos una novedad marcada sin `excluye_demas`, `false` si sólo está
  la que excluye a las demás. El `hayNovedad` del cuerpo **SHALL** ignorarse;
- **componer** `observaciones` con las etiquetas de lo marcado, en el mismo orden y separadas por `; `, y con
  `{etiqueta}: {texto}` para la novedad con `exige_texto`. Ejemplo: «Rayón o daño estético; Otro: pantalla
  rota». Las `observaciones` del cuerpo **SHALL** ignorarse. Así el listado, el CSV, el hilo y el documento
  siguen leyendo `observaciones` como hoy.

**Posición en el orden de guardas.** La validación de las novedades —y, detrás de ella, la del rotulado
(RQ-RE-24)— **SHALL** ejecutarse **después** del `422` del serial (`routes/remision.ts:154-157`, escalón A) y
**antes** del `409` de remisión pendiente (`:174-183`, escalón D): A < C < D. Entre las dos nuevas, la de
novedades corre primero. **MUST NOT** moverse ninguna guarda existente del alta, y IV-12 sigue sin corregirse:
al ir antes del `409`, las guardas nuevas corren también antes de «Ítems fuera del checklist» (`:197`) y de la
comprobación de la orden de venta (`:220`), y la fecha inválida (`:127`) sigue corriendo antes que ellas.

El texto del `422` **SHALL** nombrar la causa (la clave desconocida o inactiva, la combinación con la novedad
que excluye, o la falta de texto) y el servidor **MUST NOT** aceptar del cuerpo `hay_novedad`/`hayNovedad` ni
`observaciones` como fuente de verdad cuando `novedades` está presente.

#### Scenario: Una lista correcta se guarda como instantánea y deriva los dos campos
- GIVEN un ticket con serial y las novedades «Rayón o daño estético» y «Otro» activas
- WHEN se crea la remisión con esas dos claves, `novedadOtro: " pantalla rota "`, `hayNovedad: false` y unas `observaciones` cualesquiera
- THEN responde `201` y la fila guarda `novedades` con las dos claves y etiquetas, `novedad_otro = 'pantalla rota'`, `hay_novedad = true` y `observaciones = 'Rayón o daño estético; Otro: pantalla rota'`

#### Scenario: Sólo «Sin novedad» deriva hay_novedad en false
- GIVEN un ticket con serial
- WHEN se crea la remisión con la lista de la novedad que excluye a las demás
- THEN `hay_novedad = false`, `observaciones = 'Sin novedad'` y `novedad_otro` es `NULL`

#### Scenario: La lista vacía se rechaza
- GIVEN un ticket con serial
- WHEN se crea la remisión con `novedades: []`
- THEN responde `422` y no se crea ninguna remisión

#### Scenario: Una clave desconocida o inactiva se rechaza
- GIVEN una clave que no existe en el catálogo, y otra de una novedad con `activo = false`
- WHEN se crea una remisión con cada una
- THEN responde `422` las dos veces y no se crea ninguna remisión

#### Scenario: «Sin novedad» no convive con otra
- GIVEN la novedad con `excluye_demas` y otra cualquiera
- WHEN se crea la remisión con las dos marcadas
- THEN responde `422`

#### Scenario: «Otro» sin texto se rechaza
- GIVEN la novedad con `exige_texto` marcada
- WHEN `novedadOtro` falta, está vacío o es sólo espacios
- THEN responde `422`

#### Scenario: Una instantánea no cambia cuando se edita el catálogo
- GIVEN una remisión creada con una novedad cuya etiqueta se corrige después en la tabla
- WHEN se lee la remisión
- THEN `novedades` y `observaciones` conservan la etiqueta con la que se creó

#### Scenario: El serial gana a las novedades — posición A < C
- GIVEN un ticket sin serial resuelto y una lista de novedades inválida
- WHEN se crea la remisión
- THEN responde el `422` «Falta el serial», no el de las novedades

#### Scenario: Las novedades ganan a la remisión pendiente — posición C < D
- GIVEN un ticket con una remisión pendiente vigente y una lista de novedades inválida
- WHEN se crea otra remisión sin `permitirSegunda`
- THEN responde el `422` de las novedades, no el `409`, y no se crea ninguna remisión

#### Scenario: Las novedades corren antes que el rotulado
- GIVEN una lista de novedades inválida y `rotulado` ausente
- WHEN se crea la remisión
- THEN el `422` es el de las novedades

#### Scenario: Con la lista de novedades sin filas activas no se puede crear una remisión del formulario nuevo
- GIVEN `public.catalogo_novedades` sin ninguna fila activa
- WHEN se crea una remisión con cualquier lista de claves
- THEN responde `422` y no se crea ninguna remisión

### Requirement: RQ-RE-24 · El rotulado es una confirmación obligatoria con persona, fecha y hora del servidor

Con `novedades` presente en el cuerpo (RQ-RE-27), el alta **SHALL** exigir la confirmación «Rotulado y guardado»
(`decision/f1b04-rotulacion`, `openspec/config.yaml:2925`; maestro,
`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1239`): `rotulado` **SHALL** valer
exactamente `true`, y en cualquier otro caso —ausente, `false` u otro tipo— el alta **SHALL** responder `422`
sin crear la remisión.

- La persona **SHALL** ser el usuario autenticado y la fecha y hora **SHALL** ser el reloj del servidor: se
  guardan en `public.remisiones.rotulado_por` y `rotulado_at`. El cuerpo **MUST NOT** decidir ninguno de los dos:
  cualquier `rotuladoPor` o `rotuladoAt` que traiga **SHALL** ignorarse.
- La remisión devuelta por el alta y por la lectura **SHALL** exponer `rotuladoPor` y `rotuladoAt`.
- El alta **MUST NOT** registrar ubicación de almacén: lo decidido es una confirmación, no una ubicación.
- La remisión de legado (RQ-RE-27) **SHALL** quedar con `rotulado_por` y `rotulado_at` en `NULL`.

#### Scenario: Sin confirmación de rotulado, el alta se rechaza
- GIVEN una lista de novedades válida
- WHEN `rotulado` falta, es `false` o no es booleano
- THEN responde `422` y no se crea ninguna remisión

#### Scenario: Persona y hora salen del servidor aunque el cuerpo traiga otras
- GIVEN un usuario autenticado y un cuerpo con `rotulado: true`, `rotuladoPor: 'Otra Persona'` y `rotuladoAt: '2020-01-01T00:00:00Z'`
- WHEN se crea la remisión
- THEN `rotuladoPor` es el nombre del usuario autenticado y `rotuladoAt` cae entre el instante anterior y el posterior a la petición

#### Scenario: Una remisión de legado no lleva rotulado
- GIVEN un alta sin `novedades`
- WHEN se crea la remisión
- THEN `rotulado_por` y `rotulado_at` quedan en `NULL` y la petición no se rechaza por ello

### Requirement: RQ-RE-25 · La foto lleva categoría, y la subida la valida

La subida `POST /api/remisiones/:id/fotos` **SHALL** aceptar los campos `categoria` y `novedad` y guardarlos en
`public.remision_fotos.categoria` y `novedad` (columnas calificadas, aditivas y `NULL`-ables, sin relleno). Las
categorías válidas **SHALL** ser cuatro: `equipo`, `accesorios`, `embalaje` y `novedad`.

- La categoría **SHALL** validarse **detrás** del `415` del tipo de imagen (`routes/remision.ts:383`): el orden
  de la subida es remisión inexistente `404`, archivo ausente `400`, tipo no permitido `415`, categoría
  `422`.
- Una `categoria` presente y fuera de las cuatro **SHALL** responder `422` y **MUST NOT** guardar la foto.
- Con `categoria = 'novedad'`, `novedad` **SHALL** ser la `clave` de una novedad marcada en la propia remisión
  (en su instantánea `novedades`); en otro caso —ausente, o no marcada, o la remisión sin `novedades`— **SHALL**
  responder `422` y no guardar la foto.
- Con cualquier otra categoría, el campo `novedad` **SHALL** ignorarse y guardarse como `NULL`.
- Una subida **sin** `categoria` **SHALL** aceptarse y guardar `categoria = NULL`: es lo que sube un cliente
  anterior a este cambio. Esa foto cuenta para la regla de legado (RQ-RE-27) y **MUST NOT** contar para ninguna
  categoría ni novedad de las puertas de RQ-RE-26.
- El listado de fotos de la remisión **SHALL** exponer `categoria` y `novedad` y **MUST NOT** devolver el
  base64 (RQ-RE-13).

#### Scenario: Una foto con categoría válida se guarda con ella
- GIVEN una remisión del formulario nuevo
- WHEN se sube una imagen permitida con `categoria = 'embalaje'`
- THEN responde `201` y el listado de fotos muestra `categoria = 'embalaje'` y `novedad` nula

#### Scenario: Una categoría desconocida se rechaza
- GIVEN una remisión
- WHEN se sube una imagen permitida con `categoria = 'otra'`
- THEN responde `422` y no se guarda ninguna foto

#### Scenario: El tipo de imagen gana a la categoría — posición del 415
- GIVEN un archivo de tipo no permitido y una `categoria` inválida a la vez
- WHEN se sube
- THEN responde `415`, no `422`; mover la validación de la categoría antes del `415` debe poner esta prueba en rojo

#### Scenario: Una foto de novedad exige una novedad marcada en la remisión
- GIVEN una remisión con las novedades «Rayón o daño estético» y «Otro» marcadas
- WHEN se sube una foto con `categoria = 'novedad'` y la clave de «Rayón o daño estético»
- THEN responde `201` y la foto queda con esa `novedad`
- AND con la clave de una novedad no marcada, o sin `novedad`, responde `422` y no se guarda

#### Scenario: Una foto de novedad en una remisión de legado se rechaza
- GIVEN una remisión con `novedades` en `NULL`
- WHEN se sube una foto con `categoria = 'novedad'`
- THEN responde `422`

#### Scenario: Una subida sin categoría sigue funcionando
- GIVEN una remisión cualquiera
- WHEN se sube una imagen permitida sin `categoria`
- THEN responde `201` y la foto queda con `categoria = NULL`

### Requirement: RQ-RE-26 · Una remisión del formulario nuevo no se envía sin rotulado, sin las tres fotos mínimas y sin la foto de cada novedad

Para una remisión con `novedades` no nulo (RQ-RE-27), la sexta puerta de `POST /:id/enviar` (RQ-RE-08)
**SHALL** responder `422` —sin reclamar el envío, sin disparar a n8n y sin escribir nada— en cuanto falte alguna
de estas tres cosas, evaluadas **en este orden**:

1. **Rotulado:** `rotulado_at` es `NULL`.
2. **Fotos mínimas:** no hay al menos una foto de cada categoría `equipo`, `accesorios` y `embalaje`. El registro
   fotográfico es siempre obligatorio, haya o no novedad (E-123, `docs/sdd/ENTRADA.md:1515`; maestro,
   `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1241`). El `422` **SHALL**
   nombrar las categorías que faltan.
3. **Foto de cada novedad:** alguna novedad marcada sin `excluye_demas` no tiene al menos una foto con
   `categoria = 'novedad'` y `novedad` igual a su clave. Cada novedad marcada exige la suya: una foto no sirve
   para dos novedades. La novedad con `excluye_demas` **MUST NOT** exigir foto. El `422` **SHALL** nombrar las
   novedades que faltan.

Una foto cuenta sólo para su propia categoría: una foto de `equipo` **MUST NOT** contar para `accesorios` ni
para ninguna novedad, y una foto sin categoría **MUST NOT** contar para ninguna. Las marcas de cada novedad
marcada **SHALL** leerse del catálogo por su `clave` aunque la fila esté hoy inactiva: retirar una novedad
(`activo = false`) afecta a las altas nuevas y **MUST NOT** relajar la exigencia de una remisión que ya la marcó.

**Posición.** La puerta **SHALL** ir detrás de «anulada» y «ya enviada» (`routes/remision.ts:279-286`, escalón B)
y **antes** de `reclamarEnvio` (`:297`, escalón D). Corregir y reenviar de inmediato **SHALL** tener éxito, porque
la reclamación nunca se tomó; un `422` posterior a la reclamación dejaría `enviado_at` fijado y bloquearía el
reintento durante `VENTANA_REENVIO_SEGUNDOS`.

#### Scenario: Sin rotulado, no se envía
- GIVEN una remisión del formulario nuevo con las fotos completas y `rotulado_at` en `NULL`
- WHEN se llama `POST /:id/enviar`
- THEN responde `422`, no dispara a n8n y `enviado_at` sigue `NULL`

#### Scenario: Faltan fotos mínimas y el 422 nombra las categorías
- GIVEN una remisión del formulario nuevo, rotulada, con sólo una foto de `equipo`
- WHEN se llama `POST /:id/enviar`
- THEN responde `422`, nombra `accesorios` y `embalaje`, no dispara y `enviado_at` sigue `NULL`

#### Scenario: Sin novedad con las tres fotos mínimas se envía
- GIVEN una remisión del formulario nuevo con sólo la novedad que excluye a las demás, rotulada, con una foto de cada categoría mínima
- WHEN se llama `POST /:id/enviar`
- THEN responde `200`

#### Scenario: Cada novedad marcada exige su foto
- GIVEN una remisión rotulada, con las tres categorías mínimas, y dos novedades marcadas con foto sólo de una
- WHEN se llama `POST /:id/enviar`
- THEN responde `422` y nombra la novedad que falta
- AND subir la foto de la segunda y reintentar de inmediato responde `200`

#### Scenario: Una foto de otra categoría no sustituye a la de la novedad
- GIVEN una remisión con una novedad marcada y varias fotos de `equipo`, `accesorios` y `embalaje`, pero ninguna con `categoria = 'novedad'`
- WHEN se llama `POST /:id/enviar`
- THEN responde `422`

#### Scenario: Una foto sin categoría no cuenta
- GIVEN una remisión del formulario nuevo con tres fotos sin categoría
- WHEN se llama `POST /:id/enviar`
- THEN responde `422` por las fotos mínimas

#### Scenario: Una novedad retirada después sigue exigiendo su foto
- GIVEN una remisión que marcó una novedad, y esa novedad pasada después a `activo = false` en la tabla
- WHEN se llama `POST /:id/enviar` sin la foto de esa novedad
- THEN responde `422` por esa novedad

#### Scenario: El orden interno es rotulado, fotos mínimas, foto por novedad
- GIVEN una remisión sin rotulado, sin fotos mínimas y con una novedad sin foto
- WHEN se llama `POST /:id/enviar`
- THEN el `422` es el del rotulado
- AND con el rotulado hecho, el `422` es el de las fotos mínimas
- AND con las mínimas subidas, el `422` es el de la foto de la novedad; permutar cualquier par de las tres guardas pone la prueba en rojo

#### Scenario: La anulación y «ya enviada» ganan a la puerta de contenido
- GIVEN una remisión del formulario nuevo anulada, o en `ok`, sin rotulado y sin fotos
- WHEN se llama `POST /:id/enviar`
- THEN responde el `409` de anulada o de ya enviada, no el `422`

#### Scenario: El 422 de contenido no reclama el envío
- GIVEN una remisión del formulario nuevo incompleta
- WHEN se llama `POST /:id/enviar`, se completa lo que faltaba y se reintenta de inmediato
- THEN el primer intento responde `422` con `enviado_at` en `NULL` y el segundo responde `200`

### Requirement: RQ-RE-27 · El formulario nuevo se reconoce por `novedades`; lo anterior sigue por la regla de legado

El alta **SHALL** tratar la remisión como del **formulario nuevo** cuando el cuerpo trae la clave `novedades` con
cualquier valor distinto de `undefined`, y las reglas de RQ-RE-23 y RQ-RE-24 **SHALL** aplicarse sólo entonces
(un `null` o cualquier valor que no sea una lista se rechaza con `422`, no se toma por ausente). `/enviar` y la
subida **SHALL** reconocerla por `public.remisiones.novedades IS NOT NULL`.

Una remisión con `novedades` en `NULL` —las históricas, las pendientes anteriores a este cambio, las que sube
un cliente anterior que no manda `novedades`— **SHALL** ser de **legado** y **SHALL** comportarse como antes:

- el alta guarda `hay_novedad` y `observaciones` como los trae el cuerpo (RQ-RE-17), sin exigir rotulado ni
  lista y sin escribir `novedades`, `novedad_otro`, `rotulado_por` ni `rotulado_at`;
- `/enviar` aplica sólo el predicado `faltaFotoPorNovedad` (RQ-RE-18), con el mismo `422` y el mismo texto
  (`routes/remision.ts:291`): `hay_novedad = true` y cero fotos bloquea; con una foto, de cualquier categoría
  o sin ella, no bloquea; `hay_novedad` en `false` o `null` no bloquea ni con cero fotos;
- la subida acepta fotos sin categoría (RQ-RE-25).

#### Scenario: Un alta de cliente viejo, sin `novedades`, se crea como hoy
- GIVEN un cuerpo con `hayNovedad: true`, unas `observaciones` y sin `novedades` ni `rotulado`
- WHEN se crea la remisión
- THEN responde `201`, `hay_novedad = true`, `observaciones` es la del cuerpo y `novedades`, `rotulado_por` y `rotulado_at` son `NULL`

#### Scenario: La remisión de legado con novedad y cero fotos sigue bloqueada por la regla anterior
- GIVEN una remisión con `novedades` en `NULL`, `hay_novedad = true` y cero fotos
- WHEN se llama `POST /:id/enviar`
- THEN responde `422` con el texto de legado y no reclama el envío
- AND con una foto sin categoría y el reintento inmediato responde `200`

#### Scenario: La remisión de legado sin novedad se envía con cero fotos
- GIVEN una remisión con `novedades` en `NULL`, `hay_novedad` en `false` o `null` y cero fotos
- WHEN se llama `POST /:id/enviar` sin otros bloqueos
- THEN responde `200`

#### Scenario: Una remisión histórica no queda sujeta a las reglas nuevas
- GIVEN una remisión de `origen = 'historico'`
- WHEN se llama `POST /:id/enviar` o se lee
- THEN no se le aplican el rotulado ni las fotos por categoría

#### Scenario: `novedades` nulo o que no es lista se rechaza, no se toma por legado
- GIVEN un cuerpo con `novedades: null`, o con `novedades: 'x'`
- WHEN se crea la remisión
- THEN responde `422`

### Requirement: RQ-RE-28 · El alta de remisión de entrada acepta los tres orígenes de «Habilitar Servicio», y el botón la ofrece en `Remisión creada`

**Servidor (imposición).** `POST /api/remisiones` **SHALL** crear la remisión de entrada y responder `201` para un ticket
en cada uno de los tres estados de origen de `habilitar_servicio` (`OV asignada`, `Ticket creado` y `Remisión creada`)
que no tenga una remisión de entrada vigente (RQ-RE-20), incluido el ticket en `Remisión creada` cuya única confirmada
es de `tipo` distinto de `entrada` (origen 3 del ticket atascado). Tras crearla, `habilitar_servicio` **SHALL** dejar de
responder `422` por falta de remisión y el ticket **SHALL** llegar a `Ingresado`. Esto se fija por prueba de servidor,
por HTTP, sin `INSERT` directo de la remisión que se crea.

**Hueco previo declarado, NO corregido.** El alta **no lee el estado del ticket**: acepta cualquier estado, no sólo los
tres orígenes. Que «sólo se crea remisión en la fase inicial» no tenga contrapartida en el servidor es el hueco H-1
(regla invariable 13, punto 2): el botón es hoy la única guarda de esa restricción y ya lo era antes de este cambio. Este
requisito **MUST NOT** añadir esa guarda ni afirmar que el servidor rechaza otros estados; que el alta responda `201`
fuera de los tres orígenes es comportamiento actual sin decidir, no un requisito, y la prueba de servidor **MUST NOT**
fijarlo en ningún sentido.

**Cliente (comodidad).** `botonRemision` **SHALL** consumir `puedeCrearRemisionDeEntrada` (RQ-TS-34) y, en
`Remisión creada`, **SHALL** comportarse así:

| Situación en `Remisión creada` | Resultado de `botonRemision` |
|---|---|
| Remisiones sin cargar (`null`) | no visible |
| Sin entrada vigente (lista vacía, sólo anuladas, o sólo de tipo distinto de entrada) | visible, «Crear remisión», sin `pendienteId` |
| Entrada vigente pendiente | visible, «Remisión pendiente de envío», con su `pendienteId` |
| Entrada vigente confirmada (`ok` u `ok_con_avisos`) | no visible |
| Entrada vigente sólo en `error` | visible, «Crear remisión» (la guarda ya pasa; es inocuo) |

**Protección de la carga.** En `Remisión creada`, con las remisiones sin cargar (`null`: mientras carga, o de forma
permanente si la primera carga falla), el botón **SHALL** quedar no visible. Sin ella, todo ticket sano en ese estado
enseñaría «Crear remisión» durante la carga. La protección **SHALL** ser **sólo de `Remisión creada`**: en `OV asignada`
y `Ticket creado`, con `null`, el botón **SHALL** seguir visible como hasta ahora.

**Regla invariable 13, decisión a decisión.**

- *Ofrecer «Crear remisión» en los tres orígenes*: la imposición del servidor es que el alta acepta (primer párrafo,
  probado); el predicado vive en `packages/shared` (RQ-TS-34).
- *No ofrecerlo en `Remisión creada` sin cargar*: **sin contrapartida en el servidor y no la necesita**. Es presentación
  pura: no impide nada, el servidor crearía igual.
- *No ofrecerlo con una confirmada vigente*: sin contrapartida en el servidor; era así antes de este cambio; presentación.
- *Reetiquetar con una pendiente*: imposición existente, el `409` de remisión pendiente del alta; sin cambio.
- *No ofrecerlo fuera de los tres orígenes*: sin contrapartida, hueco H-1 (arriba), no corregido.

**Qué no cambia.** El bloque de `botonRemision` que documenta el caso de la remisión pendiente y su salida no se toca. Los
comentarios que afirmaban que el botón no cabe en `Remisión creada` se reescriben **en sitio**, sin alterar el número de
líneas de los ficheros citados.

#### Scenario: Desde `OV asignada`, sin vigente, la remisión se crea y el ticket se habilita — CARACTERIZACIÓN
- GIVEN un ticket en `OV asignada` sin remisión de entrada vigente, con el resto de requisitos de `habilitar_servicio` cumplidos
- WHEN Comercial ejecuta `habilitar_servicio` y responde `422` con el texto único de RQ-TS-33; luego se hace `POST /api/remisiones` para ese ticket; y se vuelve a ejecutar `habilitar_servicio`
- THEN el alta responde `201` y la segunda ejecución ya no responde `422` y el ticket llega a `Ingresado`

#### Scenario: Desde `Ticket creado`, sin vigente, la remisión se crea y el ticket se habilita — CARACTERIZACIÓN
- GIVEN un ticket en `Ticket creado` sin remisión de entrada vigente, con el resto de requisitos cumplidos
- WHEN se recorre el mismo `422` → alta → `habilitar_servicio` del escenario anterior
- THEN el alta responde `201` y el ticket llega a `Ingresado`

#### Scenario: Desde `Remisión creada`, sin vigente, la remisión se crea y el ticket se habilita — CARACTERIZACIÓN
- GIVEN un ticket en `Remisión creada` sin remisión de entrada vigente (sembrado por la ruta de la prueba, sin pasar por la sincronización), con el resto de requisitos cumplidos
- WHEN se recorre el mismo `422` → alta → `habilitar_servicio`
- THEN el alta responde `201` y el ticket llega a `Ingresado`

#### Scenario: Origen 3 — `Remisión creada` con una confirmada de tipo distinto de entrada — CARACTERIZACIÓN
- GIVEN un ticket en `Remisión creada` cuya única remisión confirmada tiene `tipo` distinto de `entrada` (insertada a mano en la prueba; hoy ningún código escribe otro tipo)
- WHEN se recorre el mismo `422` → alta → `habilitar_servicio`
- THEN el alta responde `201` y el ticket llega a `Ingresado`

#### Scenario: La prueba de servidor no fija el comportamiento fuera de los tres orígenes — CARACTERIZACIÓN (límite)
- GIVEN la prueba de servidor de este requisito
- WHEN se lee su conjunto de casos
- THEN sólo cubre los tres orígenes y la variante del origen 3, y no contiene ninguna aserción de que el alta responde `201` (ni de que rechaza) en otros estados; ese hueco (H-1) queda documentado y sin corregir

#### Scenario: `Remisión creada` con lista vacía ofrece «Crear remisión» — ROJO
- GIVEN `botonRemision('Remisión creada', [])`
- WHEN se evalúa
- THEN `visible` es `true`, `texto` es «Crear remisión» y `pendienteId` es `null`

#### Scenario: `Remisión creada` con sólo remisiones anuladas ofrece «Crear remisión» — ROJO
- GIVEN `botonRemision('Remisión creada', …)` con una remisión de entrada anulada
- WHEN se evalúa
- THEN `visible` es `true` y `texto` es «Crear remisión» (una anulada no cuenta como vigente)

#### Scenario: `Remisión creada` con sólo una confirmada de otro tipo ofrece «Crear remisión» — ROJO
- GIVEN `botonRemision('Remisión creada', …)` con una remisión confirmada de `tipo` distinto de `entrada`
- WHEN se evalúa
- THEN `visible` es `true` y `texto` es «Crear remisión» (la salida no depende de que no haya ninguna confirmada)

#### Scenario: `Remisión creada` con una entrada pendiente reetiqueta — ROJO
- GIVEN `botonRemision('Remisión creada', …)` con una remisión de entrada vigente en `pendiente`
- WHEN se evalúa
- THEN `visible` es `true`, `texto` es «Remisión pendiente de envío» y `pendienteId` es el de esa remisión

#### Scenario: `Remisión creada` con una entrada confirmada no ofrece nada — CARACTERIZACIÓN
- GIVEN `botonRemision('Remisión creada', …)` con una remisión de entrada vigente en `ok` (y otra con `ok_con_avisos`)
- WHEN se evalúa
- THEN `visible` es `false` (el ticket sano no ve el botón)

#### Scenario: `Remisión creada` con una entrada vigente sólo en `error` ofrece «Crear remisión» — ROJO
- GIVEN `botonRemision('Remisión creada', …)` cuya única remisión de entrada vigente está en `error`
- WHEN se evalúa
- THEN `visible` es `true` y `texto` es «Crear remisión»

#### Scenario: Sin cargar, `Remisión creada` no muestra el botón — CARACTERIZACIÓN (protección; se vuelve significativa con el cambio)
- GIVEN `botonRemision('Remisión creada', null)`
- WHEN se evalúa
- THEN `visible` es `false`; nace verde porque hoy el predicado ya devuelve `false` en ese estado, y la mutación de retirar la condición de «sin cargar» **MUST** ponerla roja una vez el predicado admite `Remisión creada`

#### Scenario: Retirar la protección de la carga pone roja la prueba — verificación por mutación
- GIVEN el predicado ya admitiendo `Remisión creada` y la protección en `botonRemision`
- WHEN se retira la condición de «sin cargar» de `botonRemision`
- THEN la prueba del escenario anterior se pone roja

#### Scenario: Retirar `Remisión creada` del predicado pone rojas las filas visibles — verificación por mutación
- GIVEN la protección en `botonRemision` y el predicado admitiendo `Remisión creada`
- WHEN se retira `Remisión creada` del predicado
- THEN se ponen rojos los escenarios de lista vacía, anuladas, otro tipo, pendiente y `error`

#### Scenario: La protección es sólo de `Remisión creada` — CARACTERIZACIÓN
- GIVEN `botonRemision('OV asignada', null)` y `botonRemision('Ticket creado', null)`
- WHEN se evalúan
- THEN ambas devuelven `visible: true`, «Crear remisión»

#### Scenario: Fuera de los tres orígenes el botón sigue oculto — CARACTERIZACIÓN
- GIVEN `botonRemision('Ingresado', [])` y cualquier otro estado fuera del `from` de `habilitar_servicio`
- WHEN se evalúa
- THEN `visible` es `false`

#### Scenario: Los comentarios se reescriben sin desplazar líneas — verificación de cierre
- GIVEN `transitions.ts`, `botonRemision.ts` y `TransitionPanel.tsx` con sus comentarios reescritos en sitio
- WHEN se compara el número de líneas de `transitions.ts` y de `botonRemision.ts` con el de partida, y se barren las citas completas y abreviadas a esos dos ficheros
- THEN el número de líneas es el mismo y ninguna cita queda rota; el comentario de `TransitionPanel.tsx` (`.tsx`, fuera de la red de pruebas por F0-00) se comprueba por persona

### Requirement: RQ-RE-29 · La lista de novedades de entrada la mantiene el Director Técnico desde la aplicación

`public.catalogo_novedades` (RQ-RE-21) **SHALL** poder mantenerse sin SQL: listar todas las novedades —activas y
retiradas—, dar de alta una nueva y cambiar la etiqueta, el orden, si está activa y si exige texto
(`decision/f1b04-desplegables`). Sólo **MAY** hacerlo quien tenga el área Servicio Técnico y el cargo Director Técnico,
o un administrador; la regla vive en `packages/shared` y el servidor la impone.

**Lo que no se puede.** La clave **MUST NOT** cambiar ni repetirse. Ninguna novedad se borra: se retira con
`activo = false`. La que excluye a las demás («Sin novedad») **MUST NOT** retirarse ni perder esa marca, y ninguna otra
la gana. Dos novedades **MUST NOT** tener la misma etiqueta, sin distinguir mayúsculas ni espacios de los extremos.

**Orden de guardas** (F1B-10): existencia (`404`) → permiso (`403`) → contenido (`422`) → unicidad (`409`).

#### Scenario: El Director Técnico da de alta una novedad
- GIVEN un usuario con área Servicio Técnico y cargo Director Técnico
- WHEN da de alta la clave `tapa_suelta` con la etiqueta «Tapa suelta»
- THEN responde `201` y la novedad aparece activa en la lista del formulario

#### Scenario: Otro cargo no puede
- GIVEN un usuario de Servicio Técnico con cargo Técnico
- WHEN intenta dar de alta o cambiar una novedad
- THEN responde `403` y la tabla no cambia

#### Scenario: Retirar en vez de borrar
- GIVEN la novedad `sello_roto` activa
- WHEN el Director Técnico la marca como no activa
- THEN deja de servirse al formulario y sigue en la tabla, legible para las remisiones que ya la marcaron

#### Scenario: «Sin novedad» no se retira
- GIVEN la novedad que excluye a las demás
- WHEN alguien intenta retirarla o quitarle la marca
- THEN responde `422` y la tabla no cambia

#### Scenario: Unicidad
- GIVEN la etiqueta «Otro» ya existe
- WHEN se da de alta otra con la etiqueta « otro »
- THEN responde `409`

### RQ-RE-30 · La remisión de entrada exige el cargo cuando la orden recibida es OVI (escalón B)

En el bloque de la orden de venta (`apps/desk/server/routes/remision.ts:218-243`), una orden resuelta desde
`salesOrderId` cuyo número es OVI y que **entra** (RQ-PM-25: no coincide con `orden_venta`, `salesorder_id` ni una
asociación vigente del ticket) SHALL exigir el cargo (RQ-PM-24); sin él responde `403`. Las guardas actúan aunque el
`UPDATE` no vaya a escribir porque el ticket ya tenga otra orden (SUPUESTO S-8, falla cerrado).

**Dónde cae, sin reordenar nada.** El `if` de `remision.ts:220` reúne hoy «Orden de venta no encontrada» (A) y la
cuarentena (C), y detrás van el vencido (C) y la unicidad (D). La guarda de cargo se intercala **entre** «no encontrada»
y la cuarentena: A → cargo → cuarentena → vencido → garantía (RQ-RE-31) → unicidad. El orden relativo de las guardas
que ya existen **no cambia**. Como el número sólo se conoce tras leer Books, el `403` corre **detrás** de la fecha
(`:127`, C), la recepción (`:158`, C), la remisión pendiente (`:177`, D) y el checklist (`:197`, C). Es un **cuarto punto
de IV-12** (B después de C y D), del mismo molde que los tres registrados: se anota y **no se corrige aquí**; los dos
últimos pares de abajo lo caracterizan.

**Par no observable:** «Orden de venta no encontrada» frente a cargo: sin orden no hay número que juzgar.

#### Scenario: OVI sin cargo — ROJO
- GIVEN un usuario sin cargo ni admin y un `salesOrderId` de una orden `OVI-2026-001` que el ticket no tiene
- WHEN crea la remisión de entrada
- THEN responde `403` de cargo y no se escribe orden alguna

#### Scenario: con cargo, administrador sin cargo, y Director Técnico sin el área Servicio Técnico pasan
- GIVEN cada uno de los tres, con una OVI nueva
- WHEN crean la remisión
- THEN la guarda de cargo no los detiene

#### Scenario: reconfirmar la OVI que el ticket ya tiene no pide cargo — ROJO
- GIVEN un ticket de Zoho cuyo `salesorder_id` ya es el de `OVI-2026-001`, y un usuario sin cargo
- WHEN crea la remisión con ese mismo `salesOrderId`
- THEN no recibe el `403` de cargo

#### Scenario: ticket con otra orden, OVI distinta sin cargo (S-8) — ROJO
- GIVEN un ticket con `orden_venta` `OV-2026-001` y una OVI distinta, de un usuario sin cargo
- WHEN crea la remisión con esa OVI
- THEN responde `403`, aunque el `UPDATE` no fuera a escribir

#### Scenario: posición, cargo < C cuarentena — ROJO
- GIVEN `OVI-2026-001-01` (con sufijo) y un usuario sin cargo
- WHEN crea la remisión
- THEN responde el `403`, no el `422` de cuarentena; con cargo responde el `422` de cuarentena de siempre

#### Scenario: posición, cargo < D orden ya asociada — ROJO
- GIVEN una OVI ya asociada a otro ticket y un usuario sin cargo
- WHEN crea la remisión
- THEN responde el `403`, no el `409`

#### Scenario: posición, D remisión pendiente < cargo (caracterización del punto de IV-12) — CARACTERIZACIÓN
- GIVEN un ticket con remisión pendiente y una OVI de un usuario sin cargo
- WHEN crea la remisión
- THEN responde el `409` de remisión pendiente, no el `403`

#### Scenario: posición, C checklist < cargo (caracterización del punto de IV-12) — CARACTERIZACIÓN
- GIVEN un ítem fuera del checklist y una OVI de un usuario sin cargo
- WHEN crea la remisión
- THEN responde el `422` de «Ítems fuera del checklist», no el `403`

### RQ-RE-31 · Un ticket de «Garantía» sólo admite una orden `OVI-` en la remisión de entrada (escalón C)

Si `tipo_servicio` es exactamente «Garantía» (SUPUESTO S-7) y entra una orden que no es OVI, la remisión SHALL responder
`422` con el texto de garantía de `tickets-core` RQ-TC-43. Cae **después** del contrato vencido (C, `:220`) y **antes** de
la unicidad (D, `:232`), sin tocar el orden de las guardas existentes. Una OVI en un ticket que no es de Garantía se
admite con el cargo. Cargo frente a garantía **no es observable** aquí: la remisión trae una sola orden.

#### Scenario: Garantía con una orden `OV-` — ROJO
- GIVEN un ticket de «Garantía» y un usuario con el cargo
- WHEN crea la remisión con `salesOrderId` de `OV-2026-001`
- THEN responde `422` de garantía y no se asocia

#### Scenario: Garantía con OVI y cargo, y OVI en un ticket que no es de Garantía, se admiten
- GIVEN un Director Técnico, con un ticket de «Garantía» y una OVI, y con un ticket de otro tipo y una OVI
- WHEN crea la remisión
- THEN se admite en los dos casos

#### Scenario: posición, C garantía < D orden ya asociada — ROJO
- GIVEN un ticket de «Garantía» y una `OV-` ya asociada a otro ticket
- WHEN un usuario con el cargo crea la remisión
- THEN responde el `422` de garantía, no el `409`

#### Scenario: la remisión de un ticket de Garantía que ya tiene su orden no se revisa (S-1) — CARACTERIZACIÓN
- GIVEN un ticket de «Garantía» cuya `orden_venta` ya es una `OV-` y la misma orden reenviada
- WHEN crea la remisión
- THEN no recibe el `422` de garantía
