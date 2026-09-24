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
| Qué cierra la remisión | «El colector decide»: un `Code` final clasifica y hace **una sola** llamada al callback (`design:21-23`) | M1.3.3 (`:1157`): el paso lo dispara «se crea una remisión para el ticket» | El ticket avanza **en el callback**, y sólo con desenlace confirmado (`apps/desk/server/routes/remision.ts:353-363`) |
| Los estados | `ok · ok_con_avisos · error` en el contrato del callback (`design:143`) | — | **Cuatro**, con `pendiente` como estado de partida (`packages/shared/src/remision.ts:60`) |
| El checklist «Incluye» | Sale del **perfil** por marca y modelo, replicando el `Switch Entrada - Marca` del flujo (`design:11`) | — | Sale de los **accesorios del modelo**; al perfil sólo se cae sin modelo enlazado (`apps/desk/server/db/checklistRemision.ts:31-42`) |
| La orden de venta | No aparece en el diseño | M1.3.5 (`:1192`): la fecha de remisión de salida «debe registrarse una sola vez» | La remisión de **entrada** puede capturarla, y es la **tercera puerta** —abierta— de «una OV, un ticket» (`routes/remision.ts:218-240`) |
| Alcance del cerrojo de envío | «Sólo se permite enviar cuando el estado es `pendiente` o `error`» (`design:165-166`) | — | Eso, **más** el corte por anulación y una reclamación atómica (`routes/remision.ts:275-288`) |
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
  `remisiones.test.ts:311`).

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
  la orden de venta, que hace un `UPDATE tickets` (`remision.ts:214-222`). Fijado por la prueba
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
ser un paso explícito, `POST /api/remisiones/:id/enviar` (`routes/remision.ts:269`).

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
  que este subsistema ya ha tenido dos veces» (`:136-139`; probado en `remisiones.test.ts:244`).
- Sólo bloquea una `pendiente` **vigente**: una con desenlace —bueno o malo— o anulada **MUST NOT**
  bloquear (`db/remisiones.ts:69`, razonado en `:63-65`; probado en `remisiones.test.ts:263`).
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
- Si el disparo no sale, la reclamación **SHALL** soltarse (`routes/remision.ts:307`), para que un
  webhook mal configurado no obligue a esperar la ventana entera (`:261-263`; probado en
  `remisiones.test.ts:417` y `:431`).
- La ruta **SHALL** responder `502` —no `500`— cuando n8n no contesta (`routes/remision.ts:309`;
  probado en `remisiones.test.ts:454`), y `dispararRemision` **SHALL** desenvolver `error.cause`,
  porque el `fetch` nativo de Node «casi siempre rechaza con el genérico "fetch failed"» y sin mirarlo
  el técnico vería siempre el mismo mensaje inútil (`remisionWebhook.ts:96-98`, razonado en `:93-95`).

> **Given** dos peticiones simultáneas de `/enviar` sobre la misma remisión pendiente
> **When** las dos pasan por `reclamarEnvio`
> **Then** exactamente una gana, la otra recibe `409`, y n8n recibe **un** disparo
> (`remisiones.test.ts:475`).

### RQ-RE-08 · El cerrojo de reenvío tiene cinco puertas, en este orden

`POST /:id/enviar` **SHALL** cortar en el orden observable siguiente:

| Orden | Guarda | Respuesta | Evidencia |
|---|---|---|---|
| 1 | La remisión no existe | `404` | `routes/remision.ts:272` |
| 2 | **Está anulada** | `409` | `:232-234` |
| 3 | Ya está cerrada (`ok` u `ok_con_avisos`) | `409` | `:237-239` |
| 4 | Reclamación perdida | `409` | `:243-245` |
| 5 | Sin ticket asociado | `422` | `:248` |

La anulación **SHALL** cortar **antes** de mirar el estado del flujo, porque «generar un documento en
Drive de algo que se acaba de anular sería absurdo» (`:230-231`; probado en `remisiones.test.ts:631`).

### RQ-RE-09 · El callback es la única voz que cierra la remisión

`POST /api/remisiones/:id/callback` **MUST NOT** usar la cookie de sesión —n8n no la tiene— y **SHALL**
autenticarse con un secreto compartido en la cabecera `X-Remision-Callback`
(`routes/remision.ts:344-346`).

- Sin `REMISION_CALLBACK_TOKEN` configurado la ruta **SHALL** responder `503` y **MUST NOT** quedar
  abierta: «una remisión que nadie puede cerrar es mejor que un endpoint sin autenticar» (`:297-299`,
  `:302`; probado en `remisiones.test.ts:511`).
- **SHALL** aceptar exactamente tres estados y rechazar el resto con `422` (`:308-309`; probado en
  `remisiones.test.ts:493`).
- La transición que se escriba detrás **SHALL** ir firmada por **quien creó la remisión**, no por el
  marcador genérico (`:320`). La razón está escrita: esta petición no tiene sesión, pero el autor
  «está guardado en la propia remisión», y sin esto «el hilo de un ticket llevado por una sola persona
  enseñaba un "Equipo Técnico" que parece un usuario y que nunca intervino» (`:315-319`; probado en
  `remisiones.test.ts:342`).
- El grupo entero de rutas **SHALL** vivir bajo `/api/remisiones` y no bajo `/api/tickets/:id/…`
  precisamente por esto: el callback «necesita su propio criterio de acceso por ruta»
  (`routes/remision.ts:23-27`).

### RQ-RE-10 · El orden de registro de las rutas es una regla, no una casualidad

`/api/remisiones/nueva` y `/api/remisiones/listado` **SHALL** registrarse **antes** que
`/api/remisiones/:id`, porque registrada antes `:id` se comería los dos literales
(`routes/remision.ts:39`, `:88` y `:110`, razonado en `:77-78` y `:108`). Hay regresión que lo fija
(`remisiones.test.ts:762`).

---

## 3 · Lo que la remisión mueve en el ticket

### RQ-RE-11 · El ticket avanza por el recuento de confirmadas, no por el acto de crear

`sincronizarEstadoPorRemision` **SHALL** ser la **única** escritura de `Remisión creada`
(`apps/desk/server/db/estadoPorRemision.ts:1-7` y `:52-60`), y se **SHALL** invocar desde **tres**
sitios, no desde uno:

| Llamada | Momento | Evidencia |
|---|---|---|
| Callback de n8n | Al conocerse el desenlace | `routes/remision.ts:363` |
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

- Anular y restaurar **SHALL** exigir administrador (`routes/remision.ts:318` y `:330`; probado en
  `remisiones.test.ts:605`).
- El listado **MUST NOT** incluir anuladas por omisión, y `?incluirAnuladas=1` **SHALL** exigir
  administrador **dentro del handler** y no en la ruta entera, porque «un no-admin sigue pudiendo ver
  el listado normal» (`routes/remision.ts:88-93`, razonado en `:83-86`; probado en
  `remisiones.test.ts:739`). Ocultar el interruptor en la interfaz no basta: sin esta comprobación
  «cualquier usuario con sesión podría pedir esta URL a mano y ver quién anuló qué y cuándo»
  (`:83-85`). Es la regla invariable 13 aplicada: el filtro del navegador es comodidad **porque** la
  ruta lo impone y hay prueba.

### RQ-RE-13 · Las fotos son datos de la app, con dos guardas propias

Las fotos **SHALL** guardarse en `public.remision_fotos` como base64 sobre `text`
(`schema.sql:294-303`), y su subida **SHALL** aceptar sólo cuatro tipos de imagen, **con SVG fuera**
porque permite script embebido (`routes/remision.ts:19-20` y `:329`).

- La lectura **SHALL** servirlas con `X-Content-Type-Options: nosniff` (`:340`).
- El listado del panel **MUST NOT** devolver el base64; sólo la ruta de contenido lo sirve
  (`db/remisiones.ts:202` y `:226`; probado en `remisiones.test.ts:519`).
- `urlSegura` **SHALL** exigir `https://` y rechazar la comilla doble antes de que `carpetaUrl` llegue
  a un `href` (`packages/shared/src/remision.ts:100-101`). Las dos razones están escritas y son
  distintas: el `javascript:` que se ejecutaría al clic si el secreto del callback se filtrara
  (`:87-90`), y la comilla que se saldría del atributo en el HTML que la historia del ticket devuelve
  por la API, «y dejaría la seguridad entera en manos de quien lo pinte» (`:94-98`).

### RQ-RE-16 · La tercera puerta: una orden de venta no puede quedar en dos tickets

Antes de escribir `orden_venta`, `fecha_orden_venta` y `salesorder_id` sobre el ticket destino,
`POST /api/remisiones` **SHALL** comprobar contra `ticketConOrdenVenta(db, { salesorderId, numero },
ticketId)` (`packages/zoho-sync/src/db/repo.ts:330-347`) que la orden no pertenezca ya a otro ticket,
por las **dos vías** —`salesorder_id` y número— y **excluyendo el propio ticket destino**. La
comprobación **SHALL** ejecutarse dentro del bloque `if (b.salesOrderId)` de `remision.ts:218-240`,
**después** del `422` «Orden de venta no encontrada» (`:220`) y **antes** del `UPDATE` (`:235-239`).

Si la orden ya pertenece a otro ticket, la respuesta **SHALL** ser `409`, con el texto de
`ticketService.ts:151` («La orden de venta {ov} ya está asociada al ticket #{n}»), y **ninguna** de
las tres columnas **SHALL** quedar escrita. El `422` del serial (`remision.ts:152-157`) **SHALL**
seguir ganando al `409` nuevo, sin mover ninguna de las dos guardas. La condición
`WHERE ... COALESCE(orden_venta,'') = ''` (`:237`) **SHALL** mantenerse intacta: protege la carrera de
dos remisiones sobre el **mismo** ticket, una pregunta distinta de la que resuelve este requisito.

**Las dos vías son requisito, no preferencia.** La divergencia `orden_venta`/`salesorder_id` por
sincronización (IV-11, fuera de alcance) puede dejar a un ticket con sólo una de las dos columnas
vigente; comprobar sólo por número dejaría ese ticket sin protección.

**Tercer punto de captura legítimo.** La remisión de entrada **SHALL** contarse como el tercer punto
de captura de la orden de venta, junto con el alta del ticket (`tickets-core` RQ-TC-08) y
`habilitar_servicio` (`ticketService.ts:150-151`). La lista de
`docs/sdd/Decisiones_Gerencia_2026-09-10.md:156-164`, que sólo nombraba los dos primeros, quedó
incompleta por omisión de redacción, no por decisión (decisión 1 de la ronda de preguntas del
2026-09-16).

**Guarda transitoria.** Esta guarda **SHALL** retirarse el día en que la tabla propia con
`salesorder_id` como `PRIMARY KEY` (`Decisiones_Gerencia_2026-09-10.md:147-150`) sustituya a las tres
guardas de aplicación; retirar sólo ésta sin retirar las otras dos sería el defecto.

(Previously: dos escenarios sueltos en `§5.1 · Comportamiento actual, a corregir`, que narraban el
defecto sin corregir y la decisión pendiente de construir. Promovidos aquí porque IV-4 pasa de defecto
a comportamiento decidido y construido.)

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
- AND el `UPDATE` es no-op porque `orden_venta` ya no está vacía (`:237`), y la remisión se crea con
      `201`

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
| D-2 | Cerrojo en `/:id/enviar`: «sólo se permite enviar cuando el estado es `pendiente` o `error`» (`design:165-166`) | Eso **y dos guardas más**: la anulación corta antes (`routes/remision.ts:275-277`) y la reclamación atómica después (`:286-288`) | **Ampliado.** El diseño resolvía el reintento del usuario; el código añadió el reintento *concurrente* —doble clic, dos pestañas—, que el diseño no contemplaba |
| D-3 | «No hay migración de esquema: `remisiones.estado`, `remisiones.resultado` y `remisiones.resuelto_at` ya existen» (`design:173-175`) | Cierto para esas tres. Pero el subsistema **sí** ganó columnas después: `enviado_at` (`schema.sql:291`), `empresa` y `persona_contacto` (`:308-309`), `origen` (`:312`), `anulada_at` y `anulada_por` (`:316-317`), más el `DROP NOT NULL` de `ticket_id` (`:306`) | El diseño era exacto **el 04/08**. Se anota porque es la clase de afirmación que envejece: siete sentencias después, «no hay migración de esquema» ya no describe este subsistema. Seis de esas siete son de las 23 sin calificar de IV-6 |
| D-4 | El resultado se sondea «cada 2 s hasta 60 s» desde `CrearRemision.tsx` (`design:181`) | La espera es constante compartida, `ESPERA_DESENLACE_SEGUNDOS = 60` (`packages/shared/src/remision.ts:43`), con una hermana que el diseño no tenía: `VENTANA_REENVIO_SEGUNDOS = 120` (`:53`) | **Ampliado, y la ampliación es la que cierra el agujero.** El diseño dejaba las dos esperas al mismo valor implícito; el código las separa a propósito y escribe por qué (`:45-52`) |
| D-5 | Empresa y persona de contacto no aparecen: el documento las toma del cliente | La remisión las **captura al crearse** y el envío usa las guardadas (`routes/remision.ts:211`; `remisionWebhook.ts:57`) | **Añadido después del diseño.** El razonamiento está en el código (`remisionWebhook.ts:50-56`): entre crear y enviar alguien pudo corregir el cliente en Books, y «el documento no puede desdecir lo que la remisión dice que era» |
| D-6 | La orden de venta no se menciona en ninguna parte del diseño | La remisión de entrada **puede capturarla** (`routes/remision.ts:218-240`), y ésa es la tercera puerta abierta de «una OV, un ticket» | **Añadido después, y con un defecto dentro.** El código explica el porqué del añadido —«se puede capturar aquí para no tener que hacerlo en Habilitar Servicio», opcional porque «cuando el equipo entra, la venta puede no existir todavía» (`:205-208`)—; lo que no explica es por qué esa vía no comprueba la regla. Ver §5.1 |
| D-7 | «El panel de remisiones en `TicketDetailView` (sigue en pendientes)» queda **fuera de alcance** (`design:260`) | Existe: `GET /api/remisiones?ticketId=` lo alimenta (`routes/remision.ts:97-102`), y en el cliente están `PanelRemisiones.tsx`, `RemisionesPage.tsx` y `ResultadoRemision.tsx` | **Construido después.** Se anota para que nadie lea el «fuera de alcance» del diseño como estado actual |

> **Nota sobre el propio diseño.** Cita `CrearRemision.tsx` diciendo que `submit()` llama a `onCreada()`
> y cierra el modal de inmediato (`design:179`). Es la clase de cita que envejece con el fichero, y
> aquí no se verifica: los 39 ficheros `.tsx` de `apps/desk/src` quedan fuera de la red de pruebas por
> decisión de Gerencia (F0-00, 2026-09-08; `vitest.config.ts:16-20`).

### 6.2 · Maestro ↔ código

| # | Dice el maestro | Dice el código | Lectura |
|---|---|---|---|
| M-1 | M1.3.3 (`:1157`): el paso `Ticket creado → Remisión creada` lo dispara «**se crea** una remisión para el ticket» | Crear la remisión **no mueve nada**: la deja en `pendiente` (`routes/remision.ts:213-216`). El ticket avanza en el **callback**, y sólo si el desenlace es `ok` u `ok_con_avisos` (`:353-363`; el recuento, en `estadoPorRemision.ts:43-49`) | **Discrepancia real, no de matiz.** El propio código lo dice donde importa: «aquí es donde el ticket avanza a "Remisión creada", **y no al crear la remisión**: es este callback el que dice que el documento existe de verdad en Drive. Un desenlace en `error` no mueve nada» (`routes/remision.ts:354-356`). Con la redacción del maestro, una remisión fallida movería el ticket, que es justo lo que la implementación evita, y hay prueba de ello (`remisiones.test.ts:816`). **Corrección para el maestro**: el disparador es el desenlace confirmado, no el alta |
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
