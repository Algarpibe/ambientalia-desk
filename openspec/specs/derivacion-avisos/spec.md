# Capacidad `derivacion-avisos` — de quién es el trabajo, y quién se entera

| Dato | Valor |
|---|---|
| Capacidad | `derivacion-avisos` (`openspec/config.yaml:118-120`) |
| Estado | **as-built** (`status_at_start` de `config.yaml`), contrastado contra el código. **§4.3 cerrada a medias por F1A-02**: `DEPLOY.md` §4.2 documenta las cuatro variables de correo; `.env.example` sigue fuera del alcance de lectura |
| Base verificada | commit `ad1875b`, rama `main`. `npm test`: 110 ficheros / 931 pruebas, 929 en verde y 2 saltadas. El código de `ad1875b` es idéntico al de `b6fb6d4`: `git diff --name-only ad1875b..HEAD` no devuelve ningún fichero fuera de `docs/`, `openspec/` y `CLAUDE.md` |
| Tanda que la escribe | F0-02 |
| Contenido | **17** requisitos (`RQ-AV-01`…`RQ-AV-17`, §§1–3) · **3** entradas de comportamiento actual (§4.1–§4.3) · **5** discrepancias diseño↔código (D-1…D-5) y **3** maestro↔código (M-1…M-3) |
| Diseño de procedencia | `docs/superpowers/specs/2026-08-12-avisos-por-correo-design.md` (165 líneas, «aprobado por el usuario, pendiente de plan de implementación»). **Histórico congelado: materia prima, no autoridad** (plan R01.1:382) |
| Apartados del maestro | **M1.9.2** (`R08.1.md:1651-1666`) · **M1.9.3** (`:1667-1674`), con el punto abierto nº 36 (Anexo D, `:4106-4109`) · M1.9.1 (`:1614`) · M11.1 (`:2653`) |
| Tandas que la tocan | **F1A-02** (C11 — **hecha en su parte de esta capacidad**: las cuatro variables de correo documentadas en `DEPLOY.md` §4.2. Y dos correcciones que salieron de ahí: el «correo redundante al cambiar de área» que el maestro pedía como ampliación de C11 **ya estaba construido** —RQ-AV-04 y RQ-AV-09—, cosa que el propio maestro reconoce nueve líneas más abajo en `R08.1.md:1582`; y el escalado **sí se pudo construir**, porque `R08.1.md:1575` manda apoyarlo en la tabla de derivación por cargo y no en una jerarquía aparte — ver `transitions-st` RQ-TS-16. Lo único que falta de C11 es el planificador, §3.10) · **F1B-05** (roles y traspaso formal) · **F1C-05** (C10: permisos por cargo, que cambia quién es destinatario) |
| Depende de | `transitions-st` (`areasSiguientes` sale del grafo) · `permissions` (roles, áreas y `recibe_avisos`) · `trazas` (la derivación queda en `values`) |

---

## 0 · Procedencia y método

Rigen las mismas reglas que en `transitions-st`: **ruta y línea** en toda afirmación sobre el código,
**línea del `.md` exportado** en toda afirmación sobre el maestro, y la palabra **hipótesis** delante
de lo demás. Cuando el diseño discrepa del código, manda el código y la discrepancia se escribe (§5).

**Toda cifra de esta spec la produjo un comando, y el comando queda escrito junto a ella.**

### ⚠️ Esta capacidad tiene un punto abierto que el maestro manda tratar en sesión

M1.9.3 abre con la instrucción, y no es un matiz de redacción:

> «**Pendiente de reunión [R08].** El revisor solicita tratar este apartado —el cálculo del
> destinatario del aviso y la pérdida en la ventana entre las dos escrituras— en una sesión de trabajo
> específica, **antes de tomar decisiones**. Se mantiene el punto abierto nº 36 y se añade a la agenda
> pendiente del Anexo I.» (`R08.1.md:1669`)

Esta spec **describe lo construido y no decide nada**. Los dos asuntos que la reunión tiene que
resolver están escritos donde tocan: el cálculo del destinatario en RQ-AV-04 y RQ-AV-05, y la ventana
entre las dos escrituras en RQ-AV-08 y §4.1.

### Las tres fuentes, enfrentadas

| Concepto | Diseño (12/08) | Maestro R08.1 | Código (`ad1875b`) |
|---|---|---|---|
| Quién recibe el aviso de área | «Áreas siguientes − áreas de quien acaba de actuar» (`design:40`) | M1.9.3 (`:1670`): lo mismo, con las mismas palabras | `areasAAvisar` (`apps/desk/server/services/avisoArea.ts:15-17`) |
| Quién marca a un rol como receptor | Casilla `recibe_avisos` en la pantalla de Roles (`design:76-78`) | **No aparece.** `grep -ni "recibe_avisos\|recibe los avisos\|receptor de avisos"` sobre el `.md` no devuelve nada | `roles.recibe_avisos`, leída en `apps/desk/server/db/avisos.ts:81` |
| Dónde se escribe el aviso | Fuera de la transacción de la transición (`design:117-119`) | M1.9.3 (`:1673`): igual, y con el mismo motivo de arquitectura | `apps/desk/server/services/ticketService.ts:113` primero, `:127-165` después |
| Variables de entorno nuevas | **Tres** (`design:128-130`) | — | **Cuatro**: las tres, más `AVISOS_COPIA_EMAIL` (`packages/zoho-sync/src/config.ts:114-117`) |
| Cuántas etapas heredan al derivado | — | M1.9.2 (`:1653`): «**Treinta y una** heredan al responsable que el ticket ya traía; **tres** proponen a otro» | 34 − 3 = **31**. El comentario del propio código dice «las otras **32**» (`packages/shared/src/transitions.ts:262`) |
| El canal de correo | n8n con un nodo Gmail; la app no manda correo (`design:140-145`) | M11.1 `[DECIDIDO 21/08]` (`:2653`): el objetivo es dejar de usar n8n | n8n, tal cual (`apps/desk/server/avisosWebhook.ts:80-85`) |

---

## 1 · La derivación: de quién es el trabajo

### RQ-AV-01 · Todas las etapas ofrecen la casilla, y ninguna la exige

La casilla `derivado_a` **SHALL** añadirse a las 31 transiciones **en un solo sitio** y **MUST NOT**
declararse una a una (`packages/shared/src/transitions.ts:288-291`). La razón está escrita en el código:
repetirla entrada por entrada garantizaría olvidarla en la siguiente que se añada.
(Previously: «las 34 transiciones».)

- **SHALL** ser `required: false` siempre: «derivar no puede frenar un ticket»
  (`packages/shared/src/transitions.ts:96-98`; el maestro lo dice igual en M1.9.2).
- **SHALL** ir la última del formulario «para no colarse entre los campos de negocio».
- Si alguna etapa dejara de ofrecerla, la salida **SHALL** ser un conjunto de excepciones en ese mismo
  punto, nunca volver a repetirla en cada entrada.
- La clave **SHALL** ser a la vez la clave en `values` y el **nombre de la columna**, y por eso va en
  `snake_case`: «no es un campo de Zoho, es nuestro» (`packages/shared/src/transitions.ts:90-92`).

#### Scenario: las 31 transiciones terminan en la casilla y ninguna la exige
- GIVEN `TRANSITIONS` tras retirar tres transiciones
- WHEN se inspeccionan los campos de cada una
- THEN las 31 terminan en `derivado_a` con `required: false`

#### Scenario: `diagnostico_complementario` conserva la casilla al cambiar de origen
- GIVEN `diagnostico_complementario` con `from: ['En Proceso']`
- WHEN se lee su último campo
- THEN es `derivado_a`, no obligatorio

### RQ-AV-02 · Cinco etapas proponen destinatario; las otras 26 heredan

`DERIVACION_POR_DEFECTO` **SHALL** llevar exactamente **cinco** entradas
(`packages/shared/src/transitions.ts:274-282`), y proponer **SHALL** ser la excepción: en una lista de cinco
entradas se ve de un vistazo cuáles pisan lo heredado.
(Previously: «tres entradas» y «las otras 28 heredan»; con 31 transiciones, 31 − 3 = 28. `solicitud_repuestos` y
`entrega_repuestos` entran por `decision/cargo-encargado-de-inventario`.)

| Etapa | Propone | Por qué |
|---|---|---|
| `escalado_a_revision` | Cargo · `Director Técnico` | Escalar una revisión es subirla al inmediato superior |
| `escalado_a_comercial` | Cargo · `Coordinador Comercial` | Sale de Servicio Técnico y pasa a Comercial |
| `aprobacion` | `primerDerivado` | El cliente aprobó y el trabajo vuelve al taller |
| `solicitud_repuestos` | Cargo · `Director Técnico` | El Director Técnico es el encargado del inventario: entrega las piezas |
| `entrega_repuestos` | `primerDerivado` | Entregadas las piezas, el ticket vuelve al técnico que lo tenía a cargo |

**Recuento por comando:** `grep -cE "^  \{ id: '" transitions.ts` da **31** transiciones y el bloque declara
**5** entradas, así que las que heredan son **26** (31 − 5). El maestro vigente R08.4 dice 31 transiciones
(`R08.4.md:1250-1254`).

- Las que proponen un cargo (`escalado_a_revision`, `escalado_a_comercial` y `solicitud_repuestos`) **SHALL**
  nombrar un **cargo y no una persona**: un id ataría el Blueprint a que esa persona siga en la empresa
  (`transitions.ts:44-46`; maestro M1.9.2).
- El cargo nombrado **SHALL** pertenecer a la lista cerrada `CARGOS`, porque el tipo de la propuesta lo exige
  (`transitions.ts:51-53`).
- La propuesta **SHALL** ser sólo eso: una casilla que abre prellenada y que quien ejecuta puede cambiar. El
  servidor **MUST NOT** imponer quién recibe el ticket en estas dos etapas; sólo valida que la persona enviada
  exista y esté activa (`apps/desk/server/services/ticketService.ts:138-142`). El cliente rellena la casilla
  como comodidad, no como guarda (regla invariable 13, punto 2).
- Con **varios** titulares activos del cargo, la propuesta **SHALL** ser la primera persona de la lista, que llega
  ordenada por nombre (`apps/desk/src/lib/personas.ts:76-79`).
- Sin titular activo del cargo, o con un `primerDerivado` nulo o dado de baja, la propuesta **SHALL** caer a lo
  heredado (`apps/desk/src/lib/personas.ts:73`, `:79`): derivar no puede frenar un ticket.
- `destinatarioDelEscalado` (`packages/shared/src/sla.ts:92-109`) **SHALL** seguir leyendo cualquier propuesta de
  tipo `cargo` del grafo, de modo que `En Proceso` devuelve `Director Técnico` por la vía `solicitud_repuestos`
  y `Solicitado` devuelve `ningun_cargo`. Ningún estado con alarma (`ALARMAS_SLA`) es `En Proceso` ni
  `Solicitado`, así que no cambia a quién se avisa.

#### Scenario: cinco proponen, 26 heredan
- GIVEN `TRANSITIONS` y `DERIVACION_POR_DEFECTO`
- WHEN se cuentan las ids con entrada propia y las que no
- THEN hay 5 con propuesta y 26 sin ella, sobre 31 transiciones

#### Scenario: el mapa entero queda fijado
- GIVEN `DERIVACION_POR_DEFECTO`
- WHEN se compara con el mapa esperado
- THEN es exactamente `escalado_a_revision` → cargo `Director Técnico`, `escalado_a_comercial` → cargo `Coordinador Comercial`, `aprobacion` → `primerDerivado`, `solicitud_repuestos` → cargo `Director Técnico` y `entrega_repuestos` → `primerDerivado`

#### Scenario: «Solicitud repuestos» propone al titular activo del cargo Director Técnico
- GIVEN la propuesta por defecto de `solicitud_repuestos` en `TRANSITIONS`, y una lista de personas activas donde una tiene `cargo` «director tecnico» (sin tilde ni mayúsculas) y otra es técnico
- WHEN `derivacionInicial` calcula con qué abre la casilla
- THEN devuelve el id de la persona con ese cargo, no el derivado heredado

#### Scenario: «Solicitud repuestos» cae al heredado si no hay titular activo
- GIVEN la propuesta por defecto de `solicitud_repuestos`, un ticket derivado a un técnico, y una lista de personas activas sin nadie con cargo Director Técnico (porque nadie lo tiene o porque quien lo tiene está dado de baja)
- WHEN `derivacionInicial` calcula con qué abre la casilla
- THEN devuelve el derivado heredado y la etapa sigue siendo ejecutable

#### Scenario: con dos Directores Técnicos activos gana el primero de la lista
- GIVEN dos personas activas con cargo Director Técnico, la lista ordenada por nombre
- WHEN `derivacionInicial` calcula la propuesta de `solicitud_repuestos`
- THEN devuelve la primera de ellas, siempre la misma

#### Scenario: «Entrega de Repuestos» devuelve el ticket al primer derivado
- GIVEN la propuesta por defecto de `entrega_repuestos`, un ticket cuyo primer derivado es un técnico activo y cuyo derivado vigente es el Director Técnico
- WHEN `derivacionInicial` calcula con qué abre la casilla
- THEN devuelve el técnico que tomó el ticket primero, no el Director Técnico

#### Scenario: «Entrega de Repuestos» cae al heredado si el primer derivado no sirve
- GIVEN la propuesta por defecto de `entrega_repuestos` y un primer derivado nulo o dado de baja
- WHEN `derivacionInicial` calcula con qué abre la casilla
- THEN devuelve el derivado heredado

#### Scenario: el servidor no impone el destinatario de «Solicitud repuestos»
- GIVEN un ticket en `En Proceso` y un usuario de Servicio Técnico que ejecuta `solicitud_repuestos`
- WHEN envía `derivado_a` con una persona activa que no es el Director Técnico
- THEN el servidor responde `200` y el ticket queda derivado a esa persona

#### Scenario: el servidor sigue rechazando una persona inexistente o dada de baja
- GIVEN un ticket en `En Proceso`
- WHEN se ejecuta `solicitud_repuestos` con `derivado_a` de una persona dada de baja
- THEN el servidor responde `422` y no escribe la derivación

#### Scenario: `En Proceso` lee `Director Técnico` por la vía `solicitud_repuestos`, y `Solicitado` no tiene cargo
- GIVEN `TRANSITIONS` con las cinco propuestas
- WHEN se llama a `destinatarioDelEscalado` para `En Proceso` y para `Solicitado`
- THEN `En Proceso` devuelve `{ hay: true, cargo: 'Director Técnico', via: ['solicitud_repuestos'] }` y `Solicitado` devuelve `{ hay: false, motivo: 'ningun_cargo' }`
- AND ningún estado de `ALARMAS_SLA` es `En Proceso` ni `Solicitado`

#### Scenario: las tres retiradas no tenían propuesta de derivación
- GIVEN `DERIVACION_POR_DEFECTO`
- WHEN se buscan `marcar_pendiente`, `servicio_externo_pendiente` y `servicio_externo_notificado`
- THEN ninguna figura, y las cinco entradas son `escalado_a_revision`, `escalado_a_comercial`, `aprobacion`, `solicitud_repuestos` y `entrega_repuestos`
(Previously: «las tres entradas siguen siendo `escalado_a_revision`, `escalado_a_comercial` y `aprobacion`».)

#### Scenario: el comentario de recuento del código dice la cifra nueva
- GIVEN el bloque de comentario sobre la herencia en `transitions.ts`
- WHEN se lee su recuento de transiciones que heredan y su mención de las entradas de la lista
- THEN dice 26 y «cinco entradas», coherente con las 31 transiciones y las cinco propuestas, y ningún comentario del fichero conserva la cuenta antigua

#### Scenario: quitar una entrada nueva pone el mapa en rojo
- GIVEN `DERIVACION_POR_DEFECTO` sin `solicitud_repuestos`, o con `entrega_repuestos` cambiada a tipo `cargo`
- WHEN corre la suite
- THEN falla la prueba del mapa entero

### RQ-AV-03 · `primerDerivado` se reconstruye del historial, no de una tabla

No **SHALL** haber tabla de derivaciones: la cadena vive en `ticket_transitions.values`, y
`primerDerivado` la recorre de la más vieja a la más nueva parando en la primera que derive a alguien
(`apps/desk/server/db/primerDerivado.ts:23-32`, razonado en `:12-15`).

- **MUST NOT** mirar sólo la fila más antigua: el ticket nace y pasa por `Habilitar Servicio` sin
  responsable, «así que mirar solo la fila más antigua daría `null` en todos los tickets del mundo
  real» (`:13-15`).
- Una cadena vacía **MUST NOT** contar como persona: «contarla devolvería un id que el desplegable no
  encuentra, y confirmar la etapa borraría la derivación sin que nadie lo pidiera» (`:17-18`; la
  guarda, en `:30`).
- El filtro **SHALL** hacerse en JS y no con `values->>'derivado_a' IS NOT NULL` en SQL, porque pg-mem
  —el motor de los tests— no resuelve los operadores de `jsonb` (`:20-21`).

---

## 2 · El aviso: quién se entera

### RQ-AV-04 · El destinatario se calcula desde el estado de llegada, no desde el área que ejecutó

`areasSiguientes` **SHALL** devolver las áreas base de todas las transiciones cuyo `from` incluye el
estado (`packages/shared/src/transitions.ts:327-334`), y **MUST NOT** usarse el `area` de la
transición ejecutada.

La razón **SHALL** quedar escrita, y es un caso concreto: `escalado_a_comercial` es de área
`Servicio Técnico` y deja el ticket en `Notificación Comercial`, donde quien tiene que actuar es
Comercial; «avisar por el área de la transición ejecutada mandaría el aviso justo a quien acaba de
hacer el trabajo» (`packages/shared/src/transitions.ts:320-323`; maestro M1.9.3, `:1671`; diseño `:21-27`).

- Un estado terminal **SHALL** devolver lista vacía: «no hay a quién pasarle el testigo» (`:317`;
  probado en `apps/desk/server/services/avisoArea.test.ts:30`).
- Las áreas compuestas **SHALL** descomponerse por `' / '` antes de contarlas
  (`areasForTransition`, `packages/shared/src/transitions.ts:313-315`).
- **Desde `blueprint-equipo-nuevo` (F1B-06), `areasSiguientes` SHALL calcularse sobre el catálogo del
  flujo aplicable del ticket que ejecutó la transición** (`transitions-equipo-nuevo` RQ-EN-04), **no
  siempre sobre `TRANSITIONS`.** Sin la restricción, un ticket `Equipo nuevo` en `Notificado` que
  ejecute `Análisis y acciones` calcularía las áreas siguientes contra las transiciones de SERVICIO
  que salen de `Notificado` (`escalado_a_comercial`), no contra las del catálogo de `Equipo nuevo` —
  mismo nombre de estado, catálogo distinto.

> **Given** un ticket en `Notificado` sobre el que Servicio Técnico ejecuta `escalado_a_comercial`
> **When** se calcula a quién avisar
> **Then** el aviso va a Comercial y a Compras, no a Servicio Técnico
> (`design:51`, verificado contra las 34 transiciones).

(Previously: sin la tercera viñeta — sólo existía un catálogo, así que `areasSiguientes` sobre
`TRANSITIONS` bastaba siempre.)

#### Scenario: Las áreas siguientes de un ticket `Equipo nuevo` salen de su propio catálogo
- GIVEN un ticket `clasificaciones = 'Equipo nuevo'` en `Notificado`, sobre el que se ejecuta
  `Análisis y acciones` (catálogo `Equipo nuevo`, `from: Notificado`, `to: Ingresado`)
- WHEN se calcula `areasSiguientes('Ingresado')` para ese ticket
- THEN el resultado sale del catálogo de `Equipo nuevo`, no de `TRANSITIONS`

### RQ-AV-05 · Se restan las áreas del **usuario**, no las de la transición

`areasAAvisar` **SHALL** ser `areasSiguientes(estado)` menos las áreas de quien acaba de actuar
(`apps/desk/server/services/avisoArea.ts:15-17`), y las áreas restadas **SHALL** ser las del
**usuario**, no las de la transición (`:11-13`).

- Sin la resta, `Facturado` —que deja el ticket en una fase que también es de Comercial— «le avisaría
  a Comercial de que le toca a Comercial, y la campana se convierte en ruido que la gente aprende a
  ignorar» (`:6-9`; probado de punta a punta en `apps/desk/server/transiciones.test.ts:349`).
- Un **administrador** tiene las tres áreas, así que la resta le deja el conjunto vacío y **MUST NOT**
  disparar ningún aviso de área. Es deliberado: «si hace el trabajo de las tres áreas, no hay a quién
  pasarle el testigo» (`:11-13`; probado en `avisoArea.test.ts:20`; maestro M1.9.3, `:1672`).

### RQ-AV-06 · Tres supresiones en el aviso de derivación, y las tres tienen motivo

`avisoDerivacion` **SHALL** ser una función pura, separada de la escritura, «porque las tres reglas
son el grueso de la funcionalidad, y son justo lo que se rompe en silencio: un aviso de más no falla
nada, solo convierte la campana en ruido» (`apps/desk/server/services/avisoDerivacion.ts:18-23`).

| Caso | Resultado | Por qué | Evidencia |
|---|---|---|---|
| La persona no cambia | nada | La casilla llega **prellenada** en cada etapa, así que confirmar cinco transiciones seguidas sin tocarla reenviaría el mismo aviso cinco veces | `:32`, razonado en `:25-26`; probado en `avisoDerivacion.test.ts:28` y de punta a punta en `transiciones.test.ts:204` |
| Derivarse a uno mismo | nada | «Ya lo sabe: acaba de hacerlo» | `:33`, razonado en `:27`; probado en `avisoDerivacion.test.ts:37` |
| Vaciar la derivación | nada | «No le da trabajo a nadie» | `:31`, razonado en `:28`; probado en `avisoDerivacion.test.ts:42` |

### RQ-AV-07 · Los destinatarios de área son dos grupos, sin repetidos

`destinatariosDeArea` **SHALL** devolver dos grupos unidos y deduplicados
(`apps/desk/server/db/avisos.ts:74-92`):

1. Quien tenga un rol **marcado como receptor** (`roles.recibe_avisos`) y **activo**, cuyas áreas
   cubran el área en cuestión (`:81`, `:89`).
2. **Todos los administradores activos**, «que reciben copia de los cambios de área por decisión del
   usuario» (`:67-69`; la condición, en `:89`).

- El actor **MUST NOT** avisarse a sí mismo: «acaba de hacerlo» (`:87`; probado en
  `avisos.test.ts:80`).
- Nadie **MUST NOT** recibir el mismo aviso dos veces, aunque le toque por dos vías: la deduplicación
  va por `Map` de id (`:84`, `:90`), y en el llamador se repite **antes de escribir**, porque quien
  sea destinataria por dos áreas a la vez «recibiría el mismo aviso dos veces»
  (`services/ticketService.ts:151-152`, `:156-158`).
- El cruce de áreas **SHALL** hacerse en JS y no con `@>` en SQL, porque `roles.areas` es `jsonb` y
  pg-mem no resuelve la contención; el filtro barato sí va en SQL (`avisos.ts:71-72`, `:81-82`; la
  trampa la anticipaba el diseño en `:103-105`).
- Un rol **con** áreas correctas pero **sin** la casilla **MUST NOT** recibir nada: es lo que
  distingue rol de área, y hay prueba de punta a punta que lo separa
  (`transiciones.test.ts:331-332`, `:346`).

### RQ-AV-08 · El aviso se escribe **fuera** de la transacción de la transición

Los dos avisos **SHALL** escribirse después de `applyTransition` y fuera de su transacción
(`services/ticketService.ts:113` frente a `:127-165`), y el motivo **SHALL** quedar escrito: «
`applyTransition` vive en `packages/zoho-sync` y `avisos` es una tabla de la app: meterla dentro
ataría el paquete de sincronización a un concepto que no es suyo» (`:116-122`).

**La contrapartida está aceptada y declarada en las dos fuentes**: «una caída justo entre las dos
escrituras pierde el aviso; se acepta porque lo que importa —la derivación— sí queda en el ticket y en
el historial, y el destinatario la ve igual en su vista» (`:119-121`; maestro M1.9.3, `:1674`, que la
cierra con «Punto abierto nº 36»).

**Es exactamente el asunto que M1.9.3 (`:1669`) manda tratar en sesión antes de decidir.** Esta spec
lo describe y no propone nada.

---

## 3 · El canal de correo

### RQ-AV-09 · El aviso en la aplicación es la fuente de verdad; el correo va encima

El correo **MUST NOT** poder tumbar una transición ya escrita (`services/ticketService.ts:167-177`;
diseño `:135-138`).

- `dispararAvisos` **MUST NOT** lanzar nunca: devuelve el motivo (`avisosWebhook.ts:53-96`), y está
  «calcado de `dispararRemision`, con las mismas tres reglas: `fetch` inyectable para los tests,
  config vacía = no-op explícito con motivo, y **nunca lanza**» (`:40-45`).
- Se **SHALL** esperar el resultado en vez de soltarlo, «porque `enviado_at` solo tiene sentido si se
  conoce» (`ticketService.ts:167-171`), y la espera **SHALL** estar acotada con
  `AbortSignal.timeout(5000)`: sin él, «un n8n colgado colgaría la respuesta de la transición, que es
  una acción de una persona esperando delante de la pantalla» (`avisosWebhook.ts:50-51`, `:84`).
- Lo que no se selle **SHALL** quedar en `NULL`, «que es la cola de reintento»
  (`ticketService.ts:170-171`; `marcarEnviados` en `db/avisos.ts:57-62`; la columna, en
  `packages/zoho-sync/src/db/schema.sql:145`). Probado en `transiciones.test.ts:395` y `:416`.
- Los avisos de una transición **SHALL** acumularse y mandarse en **una sola** llamada: «una
  transición puede generar el aviso de derivación y varios de área, y un webhook por cabeza sería
  ruido de red por nada» (`ticketService.ts:123-125`).

### RQ-AV-10 · El asunto y el enlace se arman en el servidor, no en n8n

El cuerpo del webhook **SHALL** llevar el asunto y la URL ya redactados
(`avisosWebhook.ts:60-67`), y el motivo **SHALL** quedar escrito: «el flujo debe ser tonto (recibir y
enviar), para que cambiar la redacción sea un cambio de código con test y no una edición a mano en una
interfaz web» (`:47-48`). Probado en `apps/desk/server/avisosWebhook.test.ts:15`.

### RQ-AV-11 · La copia de verificación es una muleta, y nace apagada

`AVISOS_COPIA_EMAIL` **SHALL** nacer vacía (`packages/zoho-sync/src/config.ts:117`, con el comentario
`default OFF: es una muleta de pruebas`), y su propósito **SHALL** quedar escrito: «existe para poder
verificar que el canal de correo sale de verdad. Vacío —lo normal— = no se copia nada, y se apaga
borrando la variable, sin tocar código» (`:54-58`).

- La copia **SHALL** marcarse **aviso por aviso** y sólo en el de **derivación** (`conCopia: true` en
  `services/ticketService.ts:141`; el campo, en `avisosWebhook.ts:16`). El motivo está escrito: los
  avisos de área ya le llegan al administrador como destinatario de pleno derecho, «así que copiarlos
  también le mandaría el mismo texto tantas veces como personas tuviera el área» (`:11-14`;
  `ticketService.ts:139-140`).
- La copia **MUST NOT** heredar el `id` del aviso original: «quien llama sella con `marcarEnviados`
  los ids que mandó, así que un id compartido dejaría marcado como enviado un aviso cuyo destinatario
  real pudo no recibirlo. La copia no es una fila de `avisos`, es un correo de más»
  (`avisosWebhook.ts:20-27`, `:31`; probado en `avisosWebhook.test.ts:98`).
- Su texto **SHALL** decir a quién iba dirigido el original, «porque si no es indistinguible de un
  aviso propio y no sirve para verificar nada» (`:26-27`, `:35`).
- **MUST NOT** copiarse a sí misma cuando el destinatario ya es esa dirección, comparando en
  minúsculas (`:71-75`; probado en `avisosWebhook.test.ts:115`).

### RQ-AV-12 · La bandeja no acepta el destinatario del cliente

Ninguna de las dos rutas de `/api/avisos` **SHALL** aceptar un parámetro de usuario: el destinatario
**SHALL** salir siempre de `req.user` (`apps/desk/server/routes/avisos.ts:16-24`, razonado en
`:10-11`). Aceptarlo del cliente «permitiría leer —o vaciar— la campana de otro».

- `marcarLeidos` **SHALL** llevar el `user_id` **en el `WHERE` junto al id**: «sin él, cualquiera con
  sesión podría vaciarle la campana a otro mandando ids a mano. No es paranoia, es que el id es lo
  único que viaja del cliente» (`db/avisos.ts:46-52`; probado en `avisos.test.ts:42`).
- El listado **SHALL** poner los no leídos delante, y el orden **MUST NOT** ser cosmético: «la campana
  existe para lo que falta por mirar, no para el archivo» (`db/avisos.ts:20-23`, `:30`; probado en
  `avisos.test.ts:21`).

### RQ-AV-13 · Aviso de discrepancia de orden de venta detectada por el sincronizador

El sistema **SHALL** crear un aviso a área Comercial cuando, para un ticket con la marca de fila
`ov_elegida_en_app_at` puesta, el sincronizador reciba de Zoho un valor de `orden_venta` distinto al
que la aplicación tiene guardado y protegido (`zoho-sync` RQ-ZS-01 modificado).

- El aviso **SHALL** entregarse vía `crearAviso` (`apps/desk/server/db/avisos.ts:8-18`) a cada
  destinatario de `destinatariosDeArea(db, 'Comercial', actorId)` (`:74-93`), uno por destinatario y
  por ticket.
- El texto **SHALL** nombrar las dos órdenes de venta: la que trae Zoho en esa pasada y la que la
  aplicación tiene guardada.
- **Regla anti-ruido:** mientras el valor que trae Zoho en pasadas sucesivas siga siendo el mismo que
  ya generó aviso para ese ticket, el sistema **MUST NOT** crear un segundo aviso. Un valor de Zoho
  nuevo, distinto del último avisado, **SHALL** generar un aviso nuevo.
- Un valor de Zoho vacío o nulo **MUST NOT** contarse como discrepancia (**supuesto S-2**): sin
  write-back hacia Zoho, la orden vacía del lado de Zoho es el caso normal, no un conflicto.
- El aviso **SHALL** ser sólo de bandeja (**supuesto S-3**): **MUST NOT** disparar el canal de correo
  de esta capacidad (RQ-AV-09), y `enviado_at` **SHALL** quedar `NULL`.
- El aviso **SHALL** originarse únicamente desde el proceso `ambientalia-desk`, a través de la
  devolución opcional que `createSync` (`packages/zoho-sync/src/sync.ts:62`) expone y que sólo ese
  proceso cablea (`apps/desk/server/index.ts:21-23`). El proceso `apps/hub-sync` **MUST NOT** crear
  este aviso: no cablea esa devolución.

#### Scenario: Primera discrepancia genera un aviso
- GIVEN un ticket con la marca puesta y `orden_venta = "OV-100"` en la aplicación
- WHEN el sincronizador recibe de Zoho `orden_venta = "OV-200"` para ese ticket
- THEN se crea un aviso a cada destinatario de área Comercial, nombrando OV-200 (Zoho) y OV-100
  (aplicación)

#### Scenario: Una segunda pasada con el mismo valor de Zoho no repite el aviso
- GIVEN el aviso del escenario anterior ya creado
- WHEN el sincronizador vuelve a recibir `orden_venta = "OV-200"` en la siguiente pasada
- THEN no se crea ningún aviso nuevo para ese ticket

#### Scenario: Un valor de Zoho distinto genera un aviso nuevo
- GIVEN el ticket del escenario anterior, ya avisado por "OV-200"
- WHEN el sincronizador recibe `orden_venta = "OV-300"`
- THEN se crea un aviso nuevo, nombrando OV-300 y OV-100

#### Scenario: Zoho vacío no es discrepancia
- GIVEN un ticket con la marca puesta y `orden_venta` protegida en la aplicación
- WHEN el sincronizador recibe de Zoho un `orden_venta` vacío o nulo
- THEN no se crea ningún aviso

#### Scenario: El aviso no dispara correo
- GIVEN cualquier discrepancia detectada bajo este requisito
- WHEN se crea el aviso
- THEN `enviado_at` queda `NULL` y no se invoca el canal de correo de RQ-AV-09

#### Scenario: El worker del hub nunca crea este aviso
- GIVEN una discrepancia que la instancia de `createSync` dentro de `apps/hub-sync` detecta en su
  propia pasada
- WHEN esa pasada procesa el ticket
- THEN no se crea ningún aviso — sólo el proceso `ambientalia-desk` está cableado para emitirlo

### RQ-AV-14 · Aviso de ritmo de contrato a Comercial, una vez por contrato y trimestre

El sistema **SHALL** crear un aviso al área Comercial cuando un contrato vigente (`tickets-core` RQ-TC-22)
no vaya a consumir todas sus subOV antes de su fecha de fin al ritmo actual (supuesto S-8). La regla,
evaluada una sola vez por contrato y trimestre del contrato (`zoho-sync` RQ-ZS-15):

- **Desde** el fin del primer trimestre del contrato (antes, no hay ritmo que medir).
- Con `creadas > 0` (las de `RQ-ZS-15`) y contrato vigente hoy.
- **Proyección** = `ejecutadas + (ejecutadas / díasTranscurridos) × díasRestantes`, con `díasTranscurridos`
  = hoy menos inicio y `díasRestantes` = fin menos hoy; si `proyección < creadas`, hay aviso. «Ejecutadas»
  son las de `RQ-ZS-15` (ticket en `Finalizado`), no las consumidas de `RQ-ZS-14`.
- Un contrato ya vencido **MUST NOT** generar aviso (hipótesis, reversible: la ampliación es de E-086 y
  fuera de este cambio; sin ella, avisar tras el vencimiento sólo hace ruido).

El aviso **SHALL** entregarse vía `crearAviso` (`apps/desk/server/db/avisos.ts:8-18`) a cada destinatario
de `destinatariosDeArea(db, 'Comercial', actorId)` (`:74-93`), uno por destinatario y por contrato. El
texto **SHALL** nombrar el lote, el cliente, las ejecutadas y las creadas, y la fecha de fin.

**Regla anti-ruido:** el sistema **MUST NOT** crear un segundo aviso para el mismo contrato y el mismo
trimestre, aunque se evalúe muchas veces y aunque la proyección cambie dentro del trimestre. El trimestre
siguiente **SHALL** poder generar un aviso nuevo si la regla vuelve a cumplirse.

El aviso **SHALL** ser sólo de bandeja (como `RQ-AV-13`, supuesto S-3 de ese requisito): **MUST NOT**
disparar el canal de correo (`RQ-AV-09`), y `enviado_at` **SHALL** quedar `NULL`. El momento de la
evaluación —la pasada periódica del servidor (`apps/desk/server/index.ts:85`) o al leer— lo fija el
diseño (S-8); el aviso **SHALL** originarse únicamente desde el proceso `ambientalia-desk`, no desde
`apps/hub-sync`.

#### Scenario: Ritmo insuficiente genera un aviso a Comercial

- GIVEN un contrato de 10 subOV creadas, 3 ejecutadas, con 90 días transcurridos y 90 restantes
  (proyección 6 < 10), ya pasado el fin de su primer trimestre
- WHEN se evalúa el ritmo
- THEN se crea un aviso a cada destinatario de área Comercial, con el lote, el cliente, 3 ejecutadas, 10
  creadas y la fecha de fin

#### Scenario: Una segunda evaluación en el mismo trimestre no repite el aviso

- GIVEN el aviso del escenario anterior ya creado
- WHEN se evalúa otra vez el mismo contrato en el mismo trimestre, aunque ahora haya 4 ejecutadas
- THEN no se crea ningún aviso

#### Scenario: El trimestre siguiente puede avisar de nuevo

- GIVEN el aviso ya creado en el trimestre 2 y la regla que sigue cumpliéndose en el trimestre 3
- WHEN se evalúa el contrato en el trimestre 3
- THEN se crea un aviso nuevo

#### Scenario: Ritmo suficiente no avisa

- GIVEN un contrato de 10 subOV creadas y 6 ejecutadas, con 90 días transcurridos y 90 restantes
  (proyección 12 ≥ 10)
- WHEN se evalúa el ritmo
- THEN no se crea ningún aviso

#### Scenario: Antes del fin del primer trimestre no se evalúa

- GIVEN un contrato con 0 ejecutadas, dentro de su primer trimestre
- WHEN se evalúa el ritmo
- THEN no se crea ningún aviso

#### Scenario: Sin subOV creadas o con el contrato vencido no hay aviso

- GIVEN un contrato con 0 creadas, y otro con fin anterior a hoy y ritmo insuficiente
- WHEN se evalúa cada uno
- THEN no se crea ningún aviso para ninguno

#### Scenario: El aviso no dispara correo

- GIVEN cualquier aviso de ritmo
- WHEN se crea
- THEN `enviado_at` queda `NULL` y no se invoca el canal de correo de `RQ-AV-09`

### RQ-AV-15 · Aviso de alarma de SLA vencido al cargo declarado

Cuando una alarma de `transitions-st` RQ-TS-15 vence (y, en `Remisión creada`, se cumple RQ-TS-19), el sistema
**SHALL** crear un aviso con `crearAviso` (`apps/desk/server/db/avisos.ts:8`) para **cada usuario activo cuyo
`users.cargo` sea el cargo declarado** en la alarma (hoy `Coordinador Comercial`, `transitions-st` RQ-TS-16),
uno por destinatario y por alarma.

- La resolución del cargo a personas **SHALL** hacerla el **servidor** (regla invariable 13): una función
  `destinatariosDeCargo(db, cargo)` junto a `destinatariosDeArea` (`apps/desk/server/db/avisos.ts:74`); el
  cliente **MUST NOT** decidir a quién va.
- El texto del aviso **SHALL** nombrar el ticket, el estado vencido y el plazo en horas hábiles.
- El aviso **SHALL** entrar en `public.avisos` (fuente de verdad, RQ-AV-09) y el correo **SHALL** salir por
  `dispararAvisos` (`apps/desk/server/avisosWebhook.ts:53`) **después** de confirmada la transacción. Un
  fallo del correo (config vacía, `fetch` caído, tiempo agotado) **MUST NOT** deshacer la marca ni el aviso,
  **MUST NOT** hacer fallar la pasada ni la sincronización, y **SHALL** dejar `enviado_at` en `NULL`.
  A diferencia de `RQ-AV-14`, este aviso **SÍ** usa el canal de correo.
- **Sin nadie con el cargo (S-4, segunda revisión, 2026-09-29):** `users.cargo` es texto libre que existe para
  FIRMAR la remisión (`apps/desk/server/auth/routes.ts:67-68`), no para repartir avisos; un «Coord. Comercial»
  no casa. Si `destinatariosDeCargo` devuelve vacío, el sistema **SHALL** avisar al **área de respaldo**
  declarada en la alarma (hoy `Comercial`, `transitions-st` RQ-TS-16) con `destinatariosDeArea`
  (`apps/desk/server/db/avisos.ts:74`, sin actor) y **SHALL** emitir un único `logger.warn` que diga «sin
  Coordinador Comercial» (el cargo), el estado y el ticket. Si tampoco el área da nadie, **SHALL** escribir la
  marca con cero avisos y el mismo `warn`. Con alguien en el cargo, el área **MUST NOT** recibir el aviso. Que
  el cargo exista en producción es la tarea P.1, y deja de ser bloqueante.
- El aviso **SHALL** originarse únicamente en el proceso `ambientalia-desk`, no en `apps/hub-sync`.

#### Scenario: un aviso por cada usuario con el cargo
- GIVEN dos usuarios activos con `cargo = 'Coordinador Comercial'`, uno inactivo con el mismo cargo y uno activo con otro cargo
- WHEN vence la alarma de un ticket
- THEN se crean exactamente dos avisos, uno para cada usuario activo con el cargo

#### Scenario: el texto nombra ticket, estado y plazo
- GIVEN un ticket que vence en `Notificado`
- WHEN se crea el aviso
- THEN su texto contiene el identificador del ticket, `Notificado` y las 9 horas hábiles

#### Scenario: sin nadie con el cargo, el aviso va al área de respaldo con un warn
- GIVEN una alarma vencida, ningún usuario activo con el cargo y un usuario con un rol receptor del área `Comercial`
- WHEN corre la pasada
- THEN se crea un aviso por cada destinatario de `destinatariosDeArea('Comercial')`, se escribe la marca con ese número de avisos, y se emite un único `logger.warn` que dice «sin Coordinador Comercial» con el estado; si el área tampoco da nadie, marca con cero avisos y el mismo warn

#### Scenario: con alguien en el cargo, el área no recibe el aviso
- GIVEN una alarma vencida, un usuario activo con el cargo y otro con un rol receptor del área `Comercial`
- WHEN corre la pasada
- THEN sólo el usuario con el cargo recibe aviso y no se emite ningún warn

#### Scenario: un fallo del correo no tumba nada
- GIVEN una alarma vencida y un canal de correo que falla o agota su tiempo
- WHEN corre la pasada
- THEN el aviso y la marca quedan escritos, `enviado_at` queda `NULL`, la pasada termina sin lanzar y la sincronización continúa

#### Scenario: config de correo vacía es un no-op explícito
- GIVEN las variables de correo sin configurar
- WHEN vence una alarma
- THEN el aviso entra en la aplicación y el correo no se intenta, sin error

### RQ-AV-16 · Una alarma por entrada al estado: la marca anti-duplicado

El sistema **SHALL** avisar **una sola vez por entrada**: la identidad de una alarma es la terna
**(ticket, estado, instante de entrada)** (supuesto S-2). El sistema **SHALL** registrar la marca y crear los
avisos de esa alarma en la **misma transacción**. La clave primaria de `public.alarmas_avisadas` es la terna.
La **primera sentencia** de la transacción es un `INSERT` **sin `ON CONFLICT`**; un error `23505` (clave duplicada)
significa «ya avisado» y entonces **MUST NOT** crearse ningún aviso; cualquier otro error sale hacia fuera.

- Dos pasadas seguidas, o dos pasadas concurrentes, sobre la misma entrada vencida **MUST NOT** producir más
  de un aviso por destinatario.
- **Reentrar** en el estado es una **entrada nueva** (otro instante) y **SHALL** poder generar una alarma
  nueva cuando vuelva a vencer.
- Si la transacción falla, no queda marca sin aviso ni aviso sin marca.
- **Primera pasada tras el despliegue (S-13, revisado 2026-09-29):** el correo enviado no se recupera, así que
  el valor por defecto es el que no hace daño. La primera pasada **SHALL** fijar un **corte** persistente
  (`public.alarmas_corte`, una fila, escrita una sola vez con el instante de esa pasada). Toda entrada que ya
  estuviera vencida en el corte **SHALL** marcarse con cero avisos y **MUST NOT** avisar (la marca del tablero
  sí sale; el correo, no). Las que venzan después del corte avisan normal. El corte **MUST NOT** moverse con
  un reinicio del proceso. Encender la ráfaga es decisión de Gerencia (P.3).
- Una entrada de `Remisión creada` con orden de venta no vence, así que **MUST NOT** dejar marca; una entrada vencida sin nadie ni en el cargo ni en el área **SHALL** dejarla con cero avisos.

#### Scenario: dos pasadas no duplican
- GIVEN un ticket vencido en `Notificado` y un usuario con el cargo
- WHEN corre la pasada dos veces seguidas
- THEN hay un solo aviso para ese usuario y una sola marca

#### Scenario: dos pasadas concurrentes no duplican
- GIVEN el mismo ticket y dos pasadas que evalúan a la vez
- WHEN las dos intentan marcar
- THEN una gana la marca y crea el aviso; la otra no devuelve fila y no crea nada

#### Scenario: reentrar vuelve a avisar
- GIVEN la alarma de una entrada ya avisada, y el ticket sale y vuelve a entrar en `Notificado` y vuelve a vencer
- WHEN corre la pasada
- THEN se crea una marca nueva (mismo ticket y estado, otro instante de entrada) y un aviso nuevo

#### Scenario: la marca distingue estados
- GIVEN un ticket avisado en `Notificado` que pasa después a `Remisión creada` y vence
- WHEN corre la pasada
- THEN se crea un aviso nuevo: la terna difiere en el estado

#### Scenario: marca y aviso van en la misma transacción
- GIVEN un fallo forzado al crear el aviso, después de escribir la marca
- WHEN corre la pasada
- THEN no queda marca escrita, y la pasada siguiente reintenta el aviso

#### Scenario: lo vencido antes del corte se marca sin avisar; lo posterior avisa
- GIVEN un ticket que ya estaba vencido cuando corrió la primera pasada, y otro que vence después
- WHEN corren la primera pasada y una posterior
- THEN el primero queda marcado con cero avisos, sin correo y con la marca de tablero si su alarma la lleva; el segundo recibe su aviso normal

#### Scenario: el corte no se mueve con un reinicio
- GIVEN un corte ya fijado y un ticket que venció después del corte, sin marca todavía
- WHEN el proceso se reinicia y corre la pasada
- THEN el corte sigue siendo el primero y el ticket recibe su aviso

#### Scenario: `Remisión creada` con orden de venta no deja marca
- GIVEN un ticket vencido en `Remisión creada` con orden de venta
- WHEN corre la pasada
- THEN no hay marca; si más tarde pierde toda orden y sigue vencido, la pasada siguiente sí avisa

### RQ-AV-17 · La pasada de alarmas: disparo, tolerancia a fallos y dependencia de la sincronización

El sistema **SHALL** evaluar las alarmas en una **pasada del servidor** (`pasadaAlarmas`) encadenada en la
pasada periódica de `apps/desk/server/index.ts` junto a `pasadaRitmoContratos` (supuesto S-1); la cadencia
efectiva es `syncIntervalMs` (180 000 ms por defecto).

- En cada pasada, para cada ticket con alarma por su estado actual, **SHALL** calcularse el vencimiento con
  `horasHabilesEntre` y los cierres vigentes leídos de `public.calendario_cierres`.
- Un error al evaluar un ticket **MUST NOT** impedir evaluar los demás, ni la sincronización de Zoho, ni el
  arranque; **SHALL** registrarse y seguir.
- **Requisito no funcional — dependencia (E-087, `docs/sdd/ENTRADA.md:1230-1236`):** las alarmas dependen de
  esa pasada, que hoy es la de la sincronización con Zoho. Al retirar la sincronización sin trasladar la
  llamada a un planificador propio, las alarmas **callarían sin que nada se ponga rojo**. El `archive-report`
  **SHALL** añadir una adenda a E-087 declarando este segundo dependiente.
- Los tickets sin foto de entrada (`transitions-st` RQ-TS-15) **MUST NOT** medirse en la pasada.

#### Scenario: un error en un ticket no detiene el resto
- GIVEN dos tickets vencidos y una fallo de lectura en el primero
- WHEN corre la pasada
- THEN el segundo recibe su aviso y la pasada devuelve el control sin lanzar

#### Scenario: la pasada no bloquea la sincronización
- GIVEN un fallo global en `pasadaAlarmas` (p. ej. no se pueden leer los cierres)
- WHEN corre la pasada periódica
- THEN la sincronización de Zoho se ejecuta igual y el fallo queda registrado

#### Scenario: los cierres se leen en cada pasada
- GIVEN un cierre añadido a `public.calendario_cierres` entre dos pasadas
- WHEN corre la segunda pasada
- THEN el vencimiento lo descuenta

#### Scenario: la pasada ignora tickets sin foto de entrada
- GIVEN un ticket replicado de Zoho en `Notificado`, sin filas en `ticket_transitions`
- WHEN corre la pasada
- THEN no se crea marca ni aviso

---

## 4 · Comportamiento actual, a corregir

*(La numeración de esta sección va aparte de la de requisitos: aquí se registra lo que hay, no lo que
debe haber.)*

### 4.1 · La ventana entre las dos escrituras · **destino: sesión de trabajo, punto abierto nº 36**

**Comportamiento actual, aceptado y declarado.** No es un defecto encontrado por esta tanda: es una
contrapartida escrita en el código (`services/ticketService.ts:119-121`), en el diseño (`:117-119`) y
en el maestro (M1.9.3, `:1674`).

Lo que sí registra esta spec es **cuál es su destino**, y no es una tanda: M1.9.3 (`:1669`) manda
tratarlo «en una sesión de trabajo específica, **antes de tomar decisiones**», y el punto abierto nº 36
del Anexo D lo formula así, con las dos mitades juntas:

> «Aceptar formalmente —o no— la pérdida de aviso en la ventana entre las dos escrituras (M1.9.3), y
> decidir si el borrado de administrador es compatible con la auditoría inmutable que exige M11.4.»
> (`R08.1.md:4106-4108`)

La segunda mitad de ese punto **no es de esta capacidad**: el borrado de administrador vive en
`tickets-core` (RQ-TC-11) y en M11.4 (`:2700`). Se anota aquí porque comparten número y quien vaya a
la sesión con el punto nº 36 delante se encontrará las dos.

### 4.2 · Un comentario con la cuenta de derivaciones equivocada · **destino F1C-05**

**Comportamiento actual, a corregir cuando alguien toque el fichero.**
`packages/shared/src/transitions.ts:262` dice que heredar al derivado anterior es «lo que hacen las
otras **32**». Son **31**.

**Recuento por comando:** `grep -cE "^  \{ id: '" packages/shared/src/transitions.ts` = **34**
transiciones; el bloque `DERIVACION_POR_DEFECTO` (`:267-276`) declara **3** entradas; 34 − 3 = **31**.
El maestro dice 31 en M1.9.2 (`:1653`), así que aquí el equivocado es el código.

El comentario no cambia ningún comportamiento —el mapa se lee por clave, no por longitud
(`transitions.ts:290` en `fd253aa`)— y por eso nada falla. Es la misma clase de defecto que M-5 de `transitions-st`
y §4.5 de `tickets-core`: **una cuenta escrita a mano que envejeció**. F0-02 no lo corrige: es código.
Destino F1C-05, que es la tanda que toca la matriz de cargos por transición y por tanto abrirá este
fichero con un motivo propio.

### 4.3 · Las tres variables de correo no están en `DEPLOY.md` · **CERRADO A MEDIAS en F1A-02**

**La mitad de `DEPLOY.md` está cerrada.** Las **cuatro** variables —`N8N_AVISOS_WEBHOOK_URL`,
`N8N_AVISOS_TOKEN`, `APP_BASE_URL` y `AVISOS_COPIA_EMAIL`— tienen sección propia en `DEPLOY.md` §4.2,
cada una con las dos frases que la regla de secretos pide: qué enciende y qué se rompe si se pone mal.
Se cerró en F1A-02 porque es la tanda que estrena el reloj de C11 y, con él, el primer motivo real
para encender correo en producción.

**La otra mitad sigue sin verificar, y no por olvido.** La regla pide `.env.example` **y**
`DEPLOY.md`. `.env.example` **queda fuera del alcance de lectura de esta sesión** —le pasó lo mismo a
F0-02 al escribir esta entrada—, así que sigue sin afirmarse nada sobre él: no se sabe si las cuatro
variables están. Es lo único que queda de §4.3, y quien pueda leer ese fichero lo cierra en un minuto.

**Lo que la entrada original decía y era inexacto:** hablaba de «las tres variables», pero `config.ts`
lee **cuatro** (`packages/zoho-sync/src/config.ts:114-117`). El «tres» venía del diseño, que declaraba
tres; `AVISOS_COPIA_EMAIL` se añadió después y es justamente la que más falta hacía documentar —la
única que manda correo a alguien que no es el destinatario—. Está en D-1 de §5.1, y el título de esta
entrada arrastraba la cifra vieja.

---

## 5 · Discrepancias

### 5.1 · Diseño ↔ código

| # | Dice el diseño | Dice el código | Lectura |
|---|---|---|---|
| D-1 | «**Tres** variables de entorno nuevas en `config.ts`: la URL del webhook de avisos, su token y la URL pública de la aplicación» (`design:128-130`) | **Cuatro**: esas tres (`config.ts:114-116`) más `AVISOS_COPIA_EMAIL` (`:117`) | **Añadida después.** Y es la que más falta hacía documentar: es la única de las cuatro que manda correo a una dirección que **no** es la del destinatario. Nace apagada (`:117`), lo cual cumple la mitad de la regla de secretos; la otra mitad está en §4.3 |
| D-2 | La copia del administrador «es solo de los cambios de área: las derivaciones ya tienen destinatario nombrado y añadirle copia sería ruido» (`design:70-72`) | **Al revés**: `conCopia` se marca **sólo** en el aviso de derivación (`ticketService.ts:141`) y **no** en los de área (`:163`) | **No es contradicción, son dos mecanismos distintos que el diseño no separaba.** El diseño hablaba de los administradores como **destinatarios de pleno derecho**, y eso el código lo hace (`db/avisos.ts:89`). `AVISOS_COPIA_EMAIL` es otra cosa: una dirección única de verificación, y precisamente **por** lo que decía el diseño se excluye de los avisos de área —al administrador ya le llegan— y se aplica sólo a las derivaciones (`avisosWebhook.ts:11-14`). La regla del diseño se cumple; el mecanismo que la cumple no es el que el diseño imaginaba |
| D-3 | «El enganche en `executeTransition`, justo donde hoy se crea el aviso de derivación (**línea 112-122**)» (`design:117`) | Hoy la derivación se calcula en `:127-143` y el bloque de área en `:145-165` | Cita que envejeció con el fichero. Se anota porque es la clase de defecto que la regla de método persigue: la línea 112 de hoy es `derivadoAntes`, no el aviso |
| D-4 | ⚠️ «Las dos tablas son app-nativas, así que en `schema.sql` van calificadas `public.` — sin calificar aterrizarían en `desk` por el `search_path` de producción» (`design:107-108`), con el DDL escrito sin calificar en `:96-97` | Las dos `CREATE TABLE` **sí** califican (`public.roles`, `schema.sql:103`; `public.avisos`, `:131`). Las dos `ALTER TABLE` que este diseño prescribe **no**: `ALTER TABLE roles ADD COLUMN ... recibe_avisos` (`:143`) y `ALTER TABLE avisos ADD COLUMN ... enviado_at` (`:145`). Tampoco `CREATE INDEX ... ON avisos` (`:139`) | **El diseño avisó, y el aviso no llegó a la `ALTER`.** Es la instancia más afilada de **IV-6**: el `CREATE TABLE public.avisos` lleva encima el comentario que explica por qué el `public.` es explícito (`:126-127`), y catorce líneas más abajo las dos `ALTER` lo dejan caer. Analizado en `tickets-core` §5.3; registrado en `openspec/config.yaml` y en `CLAUDE.md`. **No se corrige aquí: es código**, y su destino es F1B-01 |
| D-5 | «Un flujo **nuevo** en n8n: webhook + nodo Gmail» (`design:132`) | El disparo existe y está probado con `fetch` inyectable (`avisosWebhook.ts:53-96`; `avisosWebhook.test.ts`), pero **el flujo vive en n8n y ninguna prueba lo alcanza** | Sin discrepancia de código. Se anota el mismo hueco que `remisiones` §5.4: del lado del repositorio el contrato está escrito (`avisosWebhook.ts:60-67`), y del otro lado no hay nada que lo verifique |

### 5.2 · Maestro ↔ código

| # | Dice el maestro | Dice el código | Lectura |
|---|---|---|---|
| M-1 | M1.9.3 (`:1667-1674`) describe el cálculo del destinatario, la resta de áreas, el caso del administrador y la escritura fuera de la transacción | Los cuatro, exactos: `avisoArea.ts:15-17`, `:11-13`, `ticketService.ts:113` frente a `:127-165` | **Sin discrepancia.** Se anota porque es una de las afirmaciones as-built del maestro que **sí** resiste el contraste completo, y conviene que su verificación quede reproducible. La única sombra es la de M-2 |
| M-2 | M1.9.3 no nombra en ningún punto **cómo se elige a un rol receptor**. `grep -ni "recibe_avisos\|recibe los avisos\|receptor de avisos"` sobre el `.md` no devuelve **ninguna** línea | La casilla existe, es del **rol** y no del usuario, y decide quién recibe: `roles.recibe_avisos` (`schema.sql:143`), leída en `db/avisos.ts:81`, con la pantalla en `apps/desk/src/components/RolesAdmin.tsx` | **Hueco del maestro, no discrepancia.** M1.9.3 dice a qué **área** se avisa y se salta a qué **persona** de esa área. El mecanismo lo eligió el diseño (`:76-78`) frente a deducirlo del nombre del rol, «que se rompe en silencio en cuanto alguien renombra "Coordinador Comercial"». El motivo de que sea del rol y no del usuario está en el esquema: «el destinatario es el cargo, y así sobrevive al cambio de persona» (`schema.sql:141-142`). **Corrección para el maestro**: M1.9.3 necesita el párrafo del rol receptor, y M1.9.1 necesita saber que `roles` tiene esa columna. Importa para F1C-05, que redefine la matriz de cargos |
| M-3 | M1.9.2 (`:1653`): «**Treinta y una** heredan al responsable que el ticket ya traía; **tres** proponen a otro» | 34 transiciones (`grep -cE "^  \{ id: '"`) menos 3 entradas de `DERIVACION_POR_DEFECTO` (`transitions.ts:267-276` en `fd253aa`) = **31** | **El maestro tiene razón y el código no.** El comentario de `transitions.ts:262` dice «las otras 32». Registrado en §4.2 como comportamiento actual, con destino F1C-05. Es la única de las tres cifras de este apartado que no coincide, y la que falla es la del código |

---

## 6 · Fuera de alcance de esta spec

- **El grafo de estados, las 34 transiciones y qué área ejecuta cada una** → `transitions-st`. Aquí
  sólo está que `areasSiguientes` se deriva de él (RQ-AV-04).
- **El modelo de roles y áreas, las sesiones, y qué significa «administrador»** → `permissions`. Aquí
  sólo están las tres cosas que el aviso consulta: las áreas del usuario (RQ-AV-05), la casilla
  `recibe_avisos` del rol y el `is_admin` (RQ-AV-07).
- **Cómo se escribe la fila de `ticket_transitions` y qué guarda `values`** → `trazas`. Aquí sólo está
  que `primerDerivado` la recorre (RQ-AV-03).
- **El alta del ticket, sus guardas y la orden de venta** → `tickets-core`.
- **El webhook de remisiones, del que éste está calcado** → `remisiones`. Comparten patrón
  (`avisosWebhook.ts:43`) y no comparten ruta, token ni flujo.
- **El borrado de administrador**, que es la otra mitad del punto abierto nº 36 → `tickets-core`
  (RQ-TC-11) y M11.4 (`:2700`).
- **Las 23 `ALTER TABLE` sin calificar de `schema.sql`** → registradas como **IV-6** en
  `openspec/config.yaml` y en `CLAUDE.md`, analizadas en `tickets-core` §5.3. Dos de ellas son de esta
  capacidad (`schema.sql:143` y `:145`) y aquí se citan por su contenido y como D-4, no como desvío
  propio.
- **Las pruebas de interfaz.** Los 39 ficheros `.tsx` de `apps/desk/src` quedan fuera de la red de
  pruebas por decisión de Gerencia (F0-00, 2026-09-08; `vitest.config.ts:16-20`). La campana y la
  casilla de `RolesAdmin.tsx` son de esos 39: **no hay prueba que las cubra**. Lo que sí está probado
  es todo lo que hay detrás —la regla, los destinatarios, las rutas y el webhook—.

### RQ-AV-18 · El destino de un traspaso y el del aviso salen de la misma derivación

El área que el historial enseña como destino de un traspaso sin persona derivada (`trazas`, RQ-TZ-18) **SHALL** salir de
`areasSiguientes` sobre el estado de llegada (`packages/shared/src/transitions.ts:327-334`), la misma función base que
usa `areasAAvisar` (`apps/desk/server/services/avisoArea.ts:15-17`), y **MUST NOT** salir de una segunda tabla de áreas
(regla invariable 13).

- **SHALL** calcularse sobre el catálogo del flujo aplicable del ticket, como el aviso (RQ-AV-04, tercera viñeta).
- Al leer, la línea **MUST NOT** restar las áreas de quien actuó: el historial guarda el nombre del actor, no sus áreas,
  y la línea cuenta a quién le toca, no a quién se avisa (hipótesis; ver riesgos de la fase).
- Componer la línea **MUST NOT** crear avisos ni cambiar a quién se avisa: RQ-AV-05 y RQ-AV-06 no cambian.
- Con persona derivada, el destino es la persona (RQ-TZ-18) y el aviso a la persona derivada sigue como hoy.

#### Scenario: El destino por área coincide con la base del aviso
- GIVEN una transición de Servicio Técnico que deja el ticket en un estado cuyas áreas siguientes son Comercial y Compras
- WHEN se compone la línea de traspaso sin persona derivada
- THEN el destino enseña esas mismas áreas que `areasSiguientes` devuelve para ese estado

#### Scenario: Un ticket `Equipo nuevo` usa su propio catálogo
- GIVEN un ticket de la clasificación `Equipo nuevo` y una transición de su catálogo
- WHEN se compone la línea de traspaso por área
- THEN el área sale del catálogo de `Equipo nuevo`, no de `TRANSITIONS`

#### Scenario: Una área nueva en el catálogo llega sola a la línea
- GIVEN una transición añadida al catálogo cuya área de salida cambia `areasSiguientes` de un estado
- WHEN se compone la línea para ese estado
- THEN el destino refleja el cambio sin tocar el compositor del historial

#### Scenario: Componer la línea no crea avisos
- GIVEN una transición ya ejecutada con sus avisos escritos
- WHEN se abre el historial
- THEN no se inserta ningún aviso ni cambia ninguno existente
