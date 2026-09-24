# Plan de independencia de Zoho Desk — meta 31/12/2026

**Fecha:** 09/09/2026 · **Decisión de Gerencia:** el 31/12/2026 Desk 2.0 tiene toda la funcionalidad de Zoho Desk, todo el histórico reposa en el servidor propio, y no se hacen más llamadas a Zoho Desk
**Efecto sobre el plan R01.1:** dos épicas nuevas en la Fase 1 —**1G Repatriación** y **1H Correo propio**— más un corte. Cambia el calendario y obliga a una decisión de prioridad
**Verificado contra:** repositorio en `3aaa0f1` y Zoho Desk en vivo el 09/09/2026

---

## 1 · La buena noticia: el problema es más pequeño de lo que parece

Tres datos medidos hoy, no supuestos:

| Dato | Valor | De dónde sale |
|---|---|---|
| Tickets totales desde 2021 | **≈986** | El ticket más reciente es el nº 986 (03/09/2026) |
| Tickets creados en 2026 | **135** en nueve meses | Búsqueda por rango de fechas en Zoho Desk |
| Ritmo de la operación | **~15 tickets al mes** | Se deduce de lo anterior |

Esto no es una migración de un centro de soporte con miles de correos diarios: es un taller con quince servicios al mes y cinco años de historia. Coincide con la estimación de `debt.md` para el correo propio, «volumen bajo, menos de 20 al día». **El tamaño no es el obstáculo.**

Y buena parte de la repatriación ya está hecha o preparada:

| Dato de Zoho Desk | Estado hoy |
|---|---|
| Tickets, incluidos los archivados | **Sincronizados** en PostgreSQL, con los 59 campos del layout |
| Historia del blueprint (`ticket_history`) | **Sincronizada**, con barrido de 50 en 50 para los tickets antiguos |
| Contactos, cuentas, agentes | **Sincronizados** |
| Conversaciones —comentarios internos **y** hilos de correo— | Tabla `conversations` poblada; existe `GET /api/admin/backfill-details` para pre-poblar **todos** los tickets, y está sin correr para el histórico completo |
| Metadatos de adjuntos | **Sincronizados** (`attachments`: nombre, tamaño, tipo, href de Zoho) |
| **Bytes de los adjuntos** | **No.** La columna `storage_path` existe y está vacía; `/api/attachment` los pide a Zoho en vivo |
| Correo entrante y saliente | **No existe.** Es el Subsistema D |

Es decir: de siete frentes, cinco están hechos, uno está a medio camino con su herramienta ya construida, y sólo dos son trabajo nuevo.

---

## 2 · Tres medidas que deciden el calendario, y las tres se toman esta semana

Ninguna necesita desarrollo. Sin ellas, cualquier fecha que pongamos es una opinión.

### M1 · ¿Cuánto pesan los adjuntos?

`GET /api/admin/measure-attachments`, logueado como super administrador. Recorre los 986 tickets y devuelve cantidad y `totalHuman` sin descargar nada. **Decide el destino:** volumen en disco de EasyPanel si son pocos GB, MinIO o S3 si son decenas, `bytea` en PostgreSQL sólo si son cientos de MB.

Hipótesis, y conviene verla confirmada o desmentida: **serán pocos.** Existe el campo «Documentacion Almacenada en el Drive?» precisamente porque los informes de servicio, que son lo pesado, viven en Google Drive y no como adjuntos de Zoho. Si es así, esta parte es una tanda pequeña.

### M2 · ¿Cómo nacen los tickets de verdad?

Es la medida que más puede encoger el trabajo, y hoy nadie la ha tomado — `debt.md` lo dice: *«investigar cómo llega hoy el correo a Zoho (reenvío/MX/IMAP — el usuario no estaba seguro)»*.

Los tres tickets más recientes (984, 985, 986) traen `channel: "Email"` pero **los creó un agente**, no un correo entrante: `createdBy` apunta a personas, la descripción viene vacía o escrita a mano, y dos de los tres tienen cero hilos de correo. **Hipótesis:** en Ambientalia los tickets se crean a mano y el canal «Email» es una etiqueta heredada.

Si se confirma, **la mitad entrante del Subsistema D desaparece** —Desk 2.0 ya tiene «Crear ticket»— y queda sólo la saliente. Si no se confirma, hay que construir la ingesta completa. Es la diferencia entre dos tandas y cuatro.

Cómo se comprueba: mirar en el panel de Zoho Desk si hay un canal de correo configurado y activo sobre `soporte@`/`servicio@`, y contar cuántos tickets de 2026 tienen hilos entrantes (`threadCount > 0`) frente a los que sólo tienen comentarios.

### M3 · ¿Qué se usa de Zoho Desk que no esté en Desk 2.0?

Media hora con quien trabaja a diario en Zoho. La lista de sospechosos: vistas personalizadas (las dos entradas del menú están puestas y deshabilitadas), plantillas de respuesta y firmas, macros, etiquetas, encuesta de satisfacción, informes nativos, y el SLA propio de Zoho. **Cada una que se use es una tanda; cada una que no, es alcance que se cierra.**

---

## 3 · Épica 1G — Repatriación del histórico

Objetivo: que ninguna pantalla de Desk 2.0 necesite llamar a Zoho para mostrar algo del pasado.

| Tanda | Contenido | Gate | Tamaño |
|---|---|---|---|
| **1G-01** Backfill completo de conversaciones | Correr `backfill-details` sobre los 986 tickets, con verificación: ningún ticket sin sus conversaciones, contraste de conteos contra `commentCount` y `threadCount` de Zoho. Cierra el punto 2 de `debt.md` | — | M |
| **1G-02** Persistencia de adjuntos | Descargar los bytes al destino que decida M1; poblar `storage_path`; `/api/attachment` sirve de local y **sólo cae a Zoho si falta**, con registro de cada caída para saber qué queda por traer. Cierra el punto 1 de `debt.md` | M1 | M |
| **1G-03** Verificación de completitud | Un informe que compara, entidad por entidad, lo que hay en Zoho contra lo que hay en PostgreSQL: tickets, conversaciones, adjuntos por cantidad y bytes, historia, contactos y cuentas. **Es la prueba de que el corte se puede hacer**, y se vuelve a correr el día del corte | 1G-01, 1G-02 | M |
| **1G-04** Modo sin Zoho | Un interruptor que apaga toda salida hacia Zoho Desk y hace que la app funcione sólo contra PostgreSQL. Se prueba en staging antes del corte: lo que se rompa aquí es exactamente lo que falta por repatriar | 1G-03 | S |

**1G-04 es la tanda que da la garantía.** Sin ella, la independencia es una afirmación; con ella, es algo que se ha visto funcionar.

---

## 4 · Épica 1H — Correo propio (Subsistema D)

Objetivo: que Ambientalia reciba y responda correo de clientes sin Zoho. El diseño existe desde el 05/06/2026 en `debt.md` §3g y se respeta.

| Tanda | Contenido | Gate | Tamaño |
|---|---|---|---|
| **1H-00** Decisiones de transporte | Confirmar Gmail API sobre el buzón de Workspace —elegida porque Google firma DKIM, no hay que tocar DNS, el `historyId` da sincronización incremental y el `threadId` da hilos nativos—; proyecto en Google Cloud, scopes `gmail.modify` y `gmail.send`, refresh token; dirección exacta del buzón; identidad y firma; verificación de DKIM/SPF/DMARC | M2 | S |
| **1H-01** Salida: responder al cliente | Enviar desde el ticket con hilo correcto (`threadId` nativo más `[Ticket #N]` de respaldo en el asunto), guardar la conversación saliente en `conversations`, adjuntos salientes. Sustituye a `sendReply` de Zoho y retira `ENABLE_WRITES` de esa ruta | 1H-00 | L |
| **1H-02** Entrada: correo → ticket | Leer con `history.list`, parsear remitente, asunto, cuerpo y adjuntos, deduplicar, **emparejar por `threadId`/`References`** con un ticket existente o crear uno nuevo, reabrir si estaba cerrado, marcar procesado, anti-bucle para autorespuestas y rebotes | 1H-00 · **M2** | L |
| **1H-03** Corte del buzón | Mover la recepción de Zoho a Gmail, con periodo de solape en el que ambos reciben y se comparan | 1H-01, 1H-02 | M |

**Si M2 confirma que los tickets se crean a mano, 1H-02 se reduce a «capturar las respuestas del cliente y engancharlas al ticket»** —que sigue siendo necesario, porque un cliente responde al correo que se le envió— pero desaparece la creación automática, el emparejamiento ciego y buena parte del anti-bucle. La tanda pasa de L a M.

---

## 5 · El corte, y lo que cuesta de verdad

| Paso | Qué |
|---|---|
| 1 | Congelar Zoho Desk: nadie crea ni edita allí |
| 2 | Sincronización final y **1G-03** en verde |
| 3 | El correo pasa a Gmail (1H-03) |
| 4 | Una semana en **1G-04**, modo sin Zoho, con Zoho todavía contratado por si acaso |
| 5 | Baja de licencias |

El paso 4 no es ceremonia: es la única forma de descubrir la llamada a Zoho que nadie recordaba.

---

## 6 · El calendario, dicho con honestidad

Las quince semanas de la Fase 1 ya estaban ocupadas por 1A a 1F, con el margen en la última quincena de diciembre. **1G y 1H suman ocho tandas, de las cuales tres son L: entre cinco y siete semanas.** No caben encima. Hay tres salidas y conviene elegir con los ojos abiertos.

| | (A) Todo, moviendo el diagnóstico | (B) Todo, con la fecha en enero–febrero | (C) Independencia primero, funcionalidad después |
|---|---|---|---|
| Qué se hace antes del 31/12 | 1A–1C, 1G, 1H, 1F | Todo, terminando en febrero | 1A–1C, 1G, 1H, 1F **y** el diagnóstico en versión mínima |
| Qué se aplaza | **1D diagnóstico y 1E informes a 2027** | Nada, sólo la fecha | El encadenamiento No OK, el segundo equipo, el informe de salida |
| Riesgo | Se aplaza justo lo que el negocio pidió el 03/09 y lo que Servicio Técnico está preparando ahora | Se incumple la meta ratificada el 27/08 | Se llega a todo con menos profundidad en cada cosa |
| Coste real | Licencias de Zoho ahorradas desde enero; el taller sigue sin protocolo de diagnóstico | Dos meses más de licencias | Hay que revisar el diagnóstico en 2027 |

**Mi recomendación es (C), y con un matiz que la hace viable:** las tres medidas de §2 pueden encoger 1H entre una y dos semanas y 1G casi por completo. **No decidamos entre A, B y C antes de tener M1, M2 y M3** — se toman esta semana y cambian la aritmética. Si M2 confirma que los tickets se crean a mano y M3 dice que nadie usa vistas ni macros, (C) deja de ser un recorte y pasa a ser el plan entero.

Lo que sí conviene decidir ya, porque no depende de ninguna medida: **1G arranca ahora**, en paralelo con 1A. No tiene gates, no compite con nada, y cada semana que pasa son más adjuntos que sólo viven en Zoho.

---

## 7 · Un frente que esta decisión no cubre, y conviene nombrar

«Todo el histórico en nuestra base de datos» tiene un segundo significado que **no** es Zoho Desk: los **informes de servicio, certificados y remisiones escaneadas que viven en Google Drive**, en carpetas por serial, para más de 300 equipos. El campo «Documentacion Almacenada en el Drive?» del ticket existe precisamente por eso. Ese es el punto abierto **P8**, sigue sin responsable ni fecha, y es donde está la evidencia ISO 9001.

Apagar Zoho Desk no lo toca. Si la intención es que **toda** la memoria documental de Ambientalia esté en el servidor propio, P8 es una épica más y hay que decidirla aparte. Conviene no descubrirlo en diciembre.

---

## 8 · Para la sesión del 11/09

**Decidir:** cuál de las tres salidas del §6, sabiendo que las medidas pueden cambiar la respuesta · si P8 (el histórico de Drive) entra en el mismo objetivo o va aparte.

**Encargar esta semana:** M1, la medición de adjuntos (Alfonso, dos minutos) · M2, cómo llega hoy el correo y cuántos tickets tienen hilos entrantes (Alfonso, en el panel de Zoho) · M3, el inventario de lo que se usa de Zoho Desk (Gustavo y quien más lo use, media hora).

**Arrancar ya, sin esperar:** 1G-01, el backfill completo de conversaciones. La herramienta está construida y sin usar.
