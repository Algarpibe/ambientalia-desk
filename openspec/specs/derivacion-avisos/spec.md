# Capacidad `derivacion-avisos` — de quién es el trabajo, y quién se entera

| Dato | Valor |
|---|---|
| Capacidad | `derivacion-avisos` (`openspec/config.yaml:118-120`) |
| Estado | **as-built** (`status_at_start` de `config.yaml`), contrastado contra el código. **§4.3 cerrada a medias por F1A-02**: `DEPLOY.md` §4.2 documenta las cuatro variables de correo; `.env.example` sigue fuera del alcance de lectura |
| Base verificada | commit `ad1875b`, rama `main`. `npm test`: 110 ficheros / 931 pruebas, 929 en verde y 2 saltadas. El código de `ad1875b` es idéntico al de `b6fb6d4`: `git diff --name-only ad1875b..HEAD` no devuelve ningún fichero fuera de `docs/`, `openspec/` y `CLAUDE.md` |
| Tanda que la escribe | F0-02 |
| Contenido | **12** requisitos (`RQ-AV-01`…`RQ-AV-12`, §§1–3) · **3** entradas de comportamiento actual (§4.1–§4.3) · **5** discrepancias diseño↔código (D-1…D-5) y **3** maestro↔código (M-1…M-3) |
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

La casilla `derivado_a` **SHALL** añadirse a las 34 transiciones **en un solo sitio** y **MUST NOT**
declararse una a una (`packages/shared/src/transitions.ts:288-291`). La razón está escrita: el usuario
la quiere en todas, y «repetirla en las 34 entradas garantizaría olvidarla en la 35.ª» (`:282-283`).

- **SHALL** ser `required: false` siempre: «derivar no puede frenar un ticket»
  (`packages/shared/src/transitions.ts:96-98`; el maestro lo dice igual en M1.9.2, `:1653`).
- **SHALL** ir la última del formulario «para no colarse entre los campos de negocio» (`:284`).
- Si alguna etapa dejara de ofrecerla, la salida **SHALL** ser un conjunto de excepciones en ese mismo
  punto, «nunca volver a las 34 copias» (`:285`).
- La clave **SHALL** ser a la vez la clave en `values` y el **nombre de la columna**, y por eso va en
  `snake_case`: «no es un campo de Zoho, es nuestro» (`packages/shared/src/transitions.ts:90-92`).

### RQ-AV-02 · Tres etapas proponen destinatario; las otras 31 heredan

`DERIVACION_POR_DEFECTO` **SHALL** llevar exactamente **tres** entradas
(`packages/shared/src/transitions.ts:267-276`), y proponer **SHALL** ser la excepción: «en una lista
de tres líneas se ve de un vistazo cuáles pisan lo heredado, y en 35 declaraciones no» (`:264-266`).

| Etapa | Propone | Por qué (comentario del código) |
|---|---|---|
| `escalado_a_revision` | Cargo · `Director Técnico` | «Escalar una revisión es subirla al inmediato superior» (`:268`) |
| `escalado_a_comercial` | Cargo · `Coordinador Comercial` | «Sale de Servicio Técnico y pasa a Comercial» (`:270`) |
| `aprobacion` | `primerDerivado` | «El cliente aprobó y el trabajo VUELVE al taller. No hay un puesto fijo al que mandarlo» (`:272-273`) |

**Recuento por comando:** `grep -cE "^  \{ id: '" transitions.ts` da **34** transiciones y el bloque
`:267-276` declara **3** entradas, así que las que heredan son **31**. Coincide con M1.9.2 (`:1653`) y
**no** con el comentario de `transitions.ts:262`, que dice «las otras 32». Ver §4.2.

- Las dos primeras **SHALL** nombrar un **cargo y no una persona**, y el motivo está en las dos
  fuentes: «un id ataría el Blueprint a que esa persona siga en la empresa, y el día que el puesto
  cambie de manos la etapa derivaría a quien ya no está» (`transitions.ts:45-46`; maestro M1.9.2,
  `:1657`).

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
estado (`packages/shared/src/transitions.ts:320-327`), y **MUST NOT** usarse el `area` de la
transición ejecutada.

La razón **SHALL** quedar escrita, y es un caso concreto: `escalado_a_comercial` es de área
`Servicio Técnico` y deja el ticket en `Notificación Comercial`, donde quien tiene que actuar es
Comercial; «avisar por el área de la transición ejecutada mandaría el aviso justo a quien acaba de
hacer el trabajo» (`transitions.ts:312-315`; maestro M1.9.3, `:1671`; diseño `:21-27`).

- Un estado terminal **SHALL** devolver lista vacía: «no hay a quién pasarle el testigo» (`:317`;
  probado en `apps/desk/server/services/avisoArea.test.ts:28`).
- Las áreas compuestas **SHALL** descomponerse por `' / '` antes de contarlas
  (`areasForTransition`, `transitions.ts:307-309`).

> **Given** un ticket en `Notificado` sobre el que Servicio Técnico ejecuta `escalado_a_comercial`
> **When** se calcula a quién avisar
> **Then** el aviso va a Comercial y a Compras, no a Servicio Técnico
> (`design:51`, verificado contra las 34 transiciones).

### RQ-AV-05 · Se restan las áreas del **usuario**, no las de la transición

`areasAAvisar` **SHALL** ser `areasSiguientes(estado)` menos las áreas de quien acaba de actuar
(`apps/desk/server/services/avisoArea.ts:15-17`), y las áreas restadas **SHALL** ser las del
**usuario**, no las de la transición (`:11-13`).

- Sin la resta, `Facturado` —que deja el ticket en una fase que también es de Comercial— «le avisaría
  a Comercial de que le toca a Comercial, y la campana se convierte en ruido que la gente aprende a
  ignorar» (`:6-9`; probado de punta a punta en `apps/desk/server/transiciones.test.ts:349`).
- Un **administrador** tiene las tres áreas, así que la resta le deja el conjunto vacío y **MUST NOT**
  disparar ningún aviso de área. Es deliberado: «si hace el trabajo de las tres áreas, no hay a quién
  pasarle el testigo» (`:11-13`; probado en `avisoArea.test.ts:18`; maestro M1.9.3, `:1672`).

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
(`transitions.ts:290`)— y por eso nada falla. Es la misma clase de defecto que M-5 de `transitions-st`
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
| M-3 | M1.9.2 (`:1653`): «**Treinta y una** heredan al responsable que el ticket ya traía; **tres** proponen a otro» | 34 transiciones (`grep -cE "^  \{ id: '"`) menos 3 entradas de `DERIVACION_POR_DEFECTO` (`transitions.ts:267-276`) = **31** | **El maestro tiene razón y el código no.** El comentario de `transitions.ts:262` dice «las otras 32». Registrado en §4.2 como comportamiento actual, con destino F1C-05. Es la única de las tres cifras de este apartado que no coincide, y la que falla es la del código |

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
