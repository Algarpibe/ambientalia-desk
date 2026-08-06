# Deuda técnica / trabajo diferido — Desk Ambientalia

Lista de trabajo aplazado a propósito, para avanzar ligeros. Cada ítem indica **qué**,
**por qué se difirió**, **estado del código** y **cómo retomarlo**.

---

## 🗓️ ESTADO ACTUAL (actualizado 2026-06-19)

> Esta sección es la **fuente de verdad**. Las secciones numeradas más abajo son referencia histórica;
> varias quedaron **resueltas** esta sesión (marcadas aquí). Auditoría de seguridad completa cerrada
> (Fases A–D); specs/planes en `docs/superpowers/{specs,plans}/2026-06-19-*`.

### ✅ RESUELTO esta sesión (el detalle de abajo quedó obsoleto)
- **Reply sin gate por área** (§3d, §4) → `requireArea` en `/api/tickets/:id/reply` (F2-06).
- **`String(err)` crudo en respuestas 500** (§3f, §3i) → error-handler central que NO filtra detalles + `asyncHandler` (F4-01).
- **`/api/admin/*` con `?token=ADMIN_TOKEN`** (§1, §2) → ahora sesión + rol superadmin (F2-02). `config.adminToken` quedó huérfano (limpieza menor).
- **Re-sync de conversaciones/detalle al abrir** (§4) → lectura desde réplica local + refresco en background lazy (F3-02).
- **Dedup Books-lite (clients/sales_orders) a vistas sobre `books.*`** (§3j Fase 2) → hecho (reorg esquemas Fase 2).
- **`any` en la capa de mapeo de Desk** (mappers.ts/sync.ts) → reducido (F4-03; warnings repo 157→134). El `any` de booksHub/crmHub sigue (patrón helper deliberado).
- **Independizar `zoho-hub-sync`** (§4) → PARCIAL: monorepo (Etapa 1) + paquete de lectura publicado `@algarpibe/zoho-sync` (repo propio, GitHub Packages) + usuario `hub_reader`. Falta (si se quiere) la separación total de despliegues (Etapa 2 / A-full).
- **Estructura/calidad (auditoría):** rate-limit login + helmet (Fase B), CI con typecheck/lint/test/build + branch protection (Fase C), paginación de tickets (F3-01), partir `app.ts` en routers+servicio (F4-02), logging pino+request-id (F4-05), caché Análisis (F3-04), test integración path `desk` contra Postgres real (F5-02), modelo de authz documentado (F2-07, `docs/modelo-autorizacion.md`).

### 🔴 VIGENTE — prioridad alta (fuera de la auditoría; el usuario decidió diferirla)
- **Rotación de secretos** (engloba el "rotar Zoho Client Secret" de §4): passwords de las 3 BD (desk/hub/sales-tracker),
  `ZOHO_CLIENT_SECRET` + refresh tokens (Desk/Books/CRM), **2 PATs de GitHub** expuestos, `ADMIN_PASSWORD`, API key de n8n,
  password de `hub_reader`. Todos comprometidos (aparecieron en el chat). Rotar + guardar solo como secretos/env.

### 🟡 DIFERIDO con criterio (auditoría Fase D — BAJA)
- **F3-03 — adjuntos fuera de la BD** (= §1): diferido hasta **medir volumen** (`/api/admin/measure-attachments`, ahora con sesión admin) y elegir destino (volumen VPS / MinIO-S3). No urge a la escala actual.
- **F2-05 — token CSRF**: SALTADO. Ya mitigado por `sameSite=lax` + API JSON; añadir tokens no aporta valor real en un SPA same-origin.
- **R2 — calificar queries vs `search_path`** (§3j): solo si pg-mem deja de ser el harness de tests. (El path `desk`/`search_path` ya tiene test de integración contra Postgres real en CI — F5-02.)

### 🟢 ROADMAP / proyectos futuros (no urgentes)
**Plataforma Desk:**
- **Subsistema D — correo propio (Gmail API)** D0→D3 (§3g). El "último cordón con Zoho": que la app reciba/responda correos por sí misma (hoy entra/sale por Zoho).
- **Subsistema Remisiones** — integrar el flujo n8n `Remisiones_ST_3.13` a la plataforma (§3e). Grande.
  **EN CURSO desde 2026-08-03: solo la rama de ENTRADA** (la que dispara el botón "Crear remisión" del ticket).
- **Remisiones — gestión de accesorios por marca/modelo (DIFERIDA, 2026-08-03).** *Qué pide el usuario:* una
  tabla de accesorios **por marca-modelo** y una **página en la app** para añadir / editar / eliminar, sin SQL.
  *Qué hay ya:* la tabla `public.remision_checklist(perfil, item, orden, activo)` con 109 ítems, sembrada bajo
  demanda con `POST /api/admin/seed-remision-checklist` (idempotente y **no destructiva**, precisamente para que
  una futura pantalla de edición no se vea revertida), y lectura por `getChecklist` / `listChecklist` (esta
  última ya devuelve también los desactivados, pensando en esa pantalla). *Qué falta:* (a) el CRUD y su UI;
  (b) decidir la **granularidad**.
  **Granularidad — DECIDIDA por el usuario (2026-08-03): por marca-modelo, y SIN herencia.** Un modelo sin lista
  propia no hereda del perfil ni de la marca: se queda **sin accesorios** hasta que alguien se los dé de alta en
  la página de gestión. Queda descartada la propuesta de override-con-fallback sobre `perfil`. (Contexto: hoy se
  indexa por `perfil` — grimm_edm280, grimm_edm180, horiba_ap, environics, kunak, otro — porque así los agrupaba
  n8n; hay ~34 modelos en el desplegable de Equipos.)
  **Listar los artículos del catálogo (petición del usuario, 2026-08-03):** la página debe mostrar los artículos
  de esa marca/modelo que ya están en la BD, con **SKU, Nombre y Categoría**. Esa fuente es **`books.items`**
  (sincronizada desde Zoho Books), que tiene justo esas columnas: `sku`, `name`, `category_name`. Tres cosas a
  resolver antes de construirlo:
  1. ⚠️ **`books.items` NO existe en `desk-db`.** Solo la crea `migrateBooks`, que únicamente llama el worker
     `apps/hub-sync` contra el hub; el `schema.sql` de la app solo crea `books.contacts` y `books.sales_orders`.
     Hay que decidir cómo llega: añadirla a la publicación `zoho_ref_pub` (como se hizo con contacts/sales_orders),
     leerla del hub, o consumirla con el paquete `@algarpibe/zoho-sync`.
  2. ⚠️ **`books.items` no tiene marca ni modelo.** La marca vive dentro de `raw` (`raw->>'brand'` /
     `raw->>'manufacturer'`, p.ej. "Horiba Ltd.") y **no hay campo de modelo en absoluto**. Así que se puede
     prefiltrar por marca y categoría, pero **la asociación artículo↔modelo es precisamente lo que crea esta
     página**: no se puede deducir del catálogo.
  3. ⚠️ **Buena parte de los 109 ítems actuales no son artículos vendibles**: "Manuales", "Caja de transporte",
     "Repuestos reemplazados", "Pletinas (par)"… no tienen SKU en Books. El modelo de datos probablemente necesite
     **las dos cosas**: ítems de texto libre e ítems enlazados a `books.items` por `item_id`/SKU. Enlazar todo al
     catálogo obligaría a inventar artículos que no existen.

  **Estado de "cero filas" — DECIDIDO (2026-08-03): siempre significa "modelo sin lista definida todavía".** No
  existe el estado "este modelo no lleva accesorios por naturaleza", así que **no hace falta ninguna marca
  centinela** (se descarta el `sin_accesorios boolean` que se había planteado). El formulario mostrará solo dos
  situaciones: **catálogo sin sembrar** y **lista del modelo aún sin definir**, esta última accionable ("dala de
  alta en Gestión de accesorios"). Nota: Kunak, que en el flujo de n8n nunca tuvo checklist, cae en el segundo
  caso — se le definirá su lista como a cualquier otro modelo. Lo importante es que el mensaje **empuja a
  completarlo** en vez de afirmar que el equipo no lleva accesorios, que es lo que fallaba en `aa15d0c`.
- **Remisiones — rama de SALIDA (DIFERIDA, 2026-08-03).** *Qué es:* la remisión que se emite cuando el equipo se
  **devuelve** al cliente, para verificar que sale con todo lo que entró. *Por qué se difiere:* **no se puede
  diseñar hasta que la de entrada esté cerrada.** Hallazgos de leer el flujo (`Remisiones_ST_3.13_Desk`, export
  del 2026-08-03) que quien la retome no debería redescubrir:
  - Entrada y salida **no son simétricas**. Los 6 formularios de entrada llevan un checklist "Incluye" **fijo por
    marca** (Otro 27 ítems · Grimm EDM280 26 · Grimm EDM180 25 · Environics 16 · Horiba 15 · **Kunak ninguno**).
    Los 6 de salida tienen **cero campos fijos**: usan `defineForm: "json"` y se construyen en ejecución.
  - El "Incluye" de salida **no es un catálogo**: sale de lo que entró, vía
    `($json["incluye_entrada"] || []).map(x => ({ option: String(x) }))`. Por eso la tabla de checklists por marca
    que se crea para entrada **no le sirve** a salida.
  - Salida añade un campo que entrada no tiene: `Estado` (Operativo / No Operativo / Diagnosticado / Calibrado /
    En óptimas condiciones), y muestra en rojo las observaciones de la entrada como advertencia.
  - Depende de localizar la remisión de entrada por número de serie (hoy `Buscar remisiones entrada (SN)` sobre la
    hoja `remisiones_entrada` de Google Sheets).
  - **Decisión bloqueante antes de abordarla:** dónde quedan guardadas las remisiones de entrada — ¿siguen en
    Google Sheets, o pasan a Postgres? Salida tiene que leer de donde entrada escriba.
- **CONVERSACIONES — papelera del administrador (APLAZADA, 2026-08-06).** *Qué pide el usuario:* un botón de
  papelera en la esquina superior derecha de una entrada del hilo, para que **el administrador y solo él** pueda
  eliminarla. *Por qué se aplaza:* el usuario prefirió cerrar antes lo de las fotos. Lo que ya se investigó, para
  que quien lo retome no lo redescubra:
  - **El hilo no guarda nada: se DERIVA al leer** (`getConversacionTicket`). Cada entrada viene de una de tres
    fuentes y "eliminar" significa una cosa distinta en cada una, así que primero hay que decidir **sobre cuáles**
    aplica el botón:
    | Entrada | Fuente | Qué significaría borrarla |
    |---|---|---|
    | Correo o comentario de Zoho | `conversations` (réplica) | Se deshace solo — ver abajo |
    | Creación y transiciones | `ticket_transitions` | Reescribir el rastro de auditoría que enseña HISTORIA |
    | Remisión | `remisiones` | Ya existe: **anular**, y ya es solo de admin |
  - ⚠️ **Un `DELETE` sobre `conversations` NO funciona.** Es una réplica: `upsertConversation` escribe con
    `ON CONFLICT (id) DO UPDATE`, y `planSyncZoho` vuelve a sincronizar en segundo plano **cada vez que alguien
    abre un ticket nacido en Zoho**. La fila borrada reaparece en la siguiente apertura.
  - **Dos caminos viables.** (a) **Lápida local** — tabla propia de conversaciones ocultas que el compositor
    filtra al leer: sobrevive al sync, es reversible de un clic (como `restaurarRemision`) y no mete un concepto
    de Desk dentro de la réplica de Zoho. **Recomendado.** (b) **Borrar también en Zoho** — `deleteTicketComment`
    existe, pero **solo para comentarios**: un hilo de correo no se borra por esa vía. Irreversible y dependiente
    de que Zoho esté en pie.
  - **Autorización:** `requireAdmin` ya existe y comprueba `req.user.isAdmin`. **Hay un solo nivel de
    administrador**: el `requireSuperAdmin` de `routes/equipos.ts` es esa misma función renombrada en el `import`.
    El botón se esconde por comodidad; quien protege el dato es el endpoint.
- **Backfill** de detalle+conversaciones de todo el histórico (§2) y de `serial`/`código` desde el `subject` (§4) — bajo demanda.
- **Webhooks de Zoho Desk** — casi-tiempo-real (disparar `syncTicket` en cambios) en vez del polling cada 3 min (§4).
- **Imágenes inline de emails** — proxyar como los adjuntos (hoy salen como imagen rota) (§4).
- **Reconciliar `equipos.cliente_nombre` → `equipos.client_id`** (2026-08-03). La carga inicial de ~352 equipos
  (hecha una vez desde un CSV que ya se retiró del código; recuperable en el historial de git, último commit que
  lo contiene: `b67310a`) dejó `client_id` en NULL y el cliente como **texto libre**, con grafías que no casan con
  Books (`AMBIENTALIA` vs `Ambientalia S.A.S.`, la errata `Sololucione ambientales - SOLAM`, dobles espacios).
  Mientras tanto `searchEquipos` acota por cliente cruzando `client_id` **y** contención de nombre en ambos
  sentidos, con "Ver todos" como salida. **Arreglo de fondo:** endpoint admin idempotente que empareje por nombre
  normalizado, escriba `client_id` donde no haya ambigüedad y devuelva los ~4-5 que no casen para corregirlos a
  mano en la página Equipos. Hecho eso, el filtro puede pasar a ser solo por `client_id`.

**Zoho-hub / arquitectura:**
- **zoho-hub:** Opción A (cutover total + write-back), SP3 (write-back CQRS), SP4 (matviews); replicar `contacts` a desk-db (requiere gatear `ensureContact`).
- **Separación total de despliegues** (Etapa 2 / A-full) si el hub gana más consumidores/equipos.
- **CRM Fase 3** (Accounts/Contacts, módulos custom). **Books:** pagos/estimates.
- **Ampliar** tipos/helpers del paquete `@algarpibe/zoho-sync` cuando aparezca la 1ª app consumidora. Decidir **borrar/mantener `hub-test-app`**.

### ⚪ LATENTES / menores (por diseño; abordar si tocan ese código) — ver detalle abajo
managed_by_app atómica (I-1), backoff 429 en backfill (I-3), `status_type` fino (M-1), checkbox required (M-2),
enumeración por timing en login (M-3), `getEquipo` sin filtro `active` (M-9), dedup parser semilla (M-10),
PATCH `serial` vacío (M-14), escapar comodines de búsqueda (M-5), TZ en `due_date` (M-12), `@types/bcryptjs` redundante,
`config.syncBooks` sin uso, guard anti-drift `DESK_TABLES`↔`schema.sql`.

---

## 1. Descargar y almacenar archivos adjuntos (imágenes, PDFs)

**Qué:** Guardar los archivos de los adjuntos (no solo su metadata) para tenerlos
independientes de Zoho.

**Por qué se difirió:** Posible problema de almacenamiento en el VPS. Hay que **medir el
volumen real** antes de comprometer espacio, y elegir bien el destino.

**Estado del código:**
- ✅ Descarga **en vivo** ya funciona: proxy autenticado `GET /api/attachment?path=...`
  (sirve el archivo desde Zoho en el momento; no lo guarda).
- ✅ Endpoint de **medición** listo: `GET /api/admin/measure-attachments?token=ADMIN_TOKEN`
  (recorre todos los tickets y totaliza cantidad + GB de adjuntos, sin descargar nada).
- ❌ Falta: persistir los archivos en un destino y servirlos desde ahí.

**Cómo retomar:**
1. Definir `ADMIN_TOKEN` en Environment y llamar a `/api/admin/measure-attachments` para
   obtener el tamaño total real (`totalHuman` cuando `done: true`).
2. Con ese dato, elegir destino:
   - **Volumen en disco** (EasyPanel persistent volume) — recomendado si son pocos GB. La BD
     guarda la ruta; el proxy sirve desde local y cae a Zoho si falta.
   - **MinIO / S3** — si son decenas de GB o se quiere almacenamiento de objetos dedicado.
   - **Postgres `bytea`** — solo si el total es pequeño (cientos de MB); infla BD/backups.
3. Implementar: al sincronizar conversaciones, descargar cada adjunto vía `zohoFetch(path)` y
   guardarlo; el proxy `/api/attachment` consulta primero el almacenamiento local.

---

## 2. Pre-poblar detalle + conversaciones de TODOS los tickets

**Qué:** Cargar en la BD el detalle completo (customFields) y las conversaciones de los ~900
tickets de una vez, sin tener que abrirlos uno por uno.

**Por qué se difirió:** Solo aporta valor si se quieren **reportes/consultas SQL sobre todo el
histórico**, **respaldo total** o **resiliencia a caídas de Zoho**. Para el uso diario del
tablero NO hace falta: cada ticket ya carga su detalle completo al abrirlo (carga perezosa).

**Estado del código:**
- ✅ Endpoint listo: `GET /api/admin/backfill-details?token=ADMIN_TOKEN`
  (recorre todos los tickets, `syncTicket` + `syncConversations` por cada uno; segundo plano,
  throttled 150 ms, reintento ante 429, tolerante a errores; `?restart=1` reinicia).

**Cómo retomar:** definir `ADMIN_TOKEN`, redeploy, llamar al endpoint y sondear hasta
`done: true` (~8-12 min). Idempotente; re-ejecutable para refrescar el histórico.

**Si más adelante se quiere reportería seria:** considerar materializar campos clave de
`customFields` (jsonb) en **columnas estructuradas** o vistas, para consultas más cómodas.

---

## 3. Hallazgos de la revisión del Subsistema A (para el Subsistema B)

- **Guarda `managed_by_app` atómica (I-1):** `upsertTicket` (`server/db/repo.ts`) protege los tickets
  gestionados por la app con un `SELECT managed_by_app` + early-return (no atómico, TOCTOU). Hoy es
  **latente** (nada pone `managed_by_app=true` aún). Cuando el **Subsistema B** empiece a marcar
  tickets como gestionados, hacer la escritura **atómica**: usar `... ON CONFLICT (id) DO UPDATE SET
  ... WHERE tickets.managed_by_app = false` (Postgres real lo soporta; sólo pg-mem no — gatear el test).
- **Backfill sin backoff de 429 (I-3 residual):** el backfill principal (`server/sync.ts`) recorre
  ~900 tickets + sus contactos/cuentas (ya con dedup) de forma secuencial **sin manejo de 429**. Si
  Zoho limita, esos tickets quedan con empresa/contacto null hasta re-sync. Añadir backoff/espera ante
  429 en `zohoFetch` o entre páginas (el endpoint admin `backfill-details` ya tiene reintento).

## 3b. Hallazgos de la revisión del Subsistema B (menores)

- **`status_type` fino (M-1):** `buildTransitionPlan` solo marca `Closed` para `'Finalizado'`; el resto →
  `'Open'`. Estados casi-terminales ('Liberación Comercial', 'Por Entregar'…) siguen en el tablero activo
  (tienen transiciones salientes, así que es correcto), pero el `status_type` deja de reflejar el "On Hold"
  de Zoho. Refinar con un mapa estado→tipo en **reportería (Subsistema G)**.
- **Checkbox obligatorio (M-2):** un campo `checkbox` con `required=true` (p.ej. 'Cumple condiciones
  comerciales') escribe `false` sin error si el usuario no lo marca (no se puede exigir "marcado=true").
  Decisión de producto: si "obligatorio" = "debe quedar marcado", añadir en la rama checkbox de
  `buildTransitionPlan` un error cuando `required && asBool(raw) !== true`.

## 3c. Hallazgos de la revisión del Subsistema H1 (menores)

- **Enumeración de usuarios por timing en login (M-3):** `POST /api/auth/login` corre bcrypt solo si el
  correo existe; un correo inexistente responde más rápido → revela si un correo está registrado. Bajo
  riesgo (equipo pequeño y conocido). Si se quiere endurecer: correr siempre un `bcrypt.compare` contra un
  hash dummy cuando el usuario no existe/está inactivo, para igualar tiempos.
- **`@types/bcryptjs` redundante:** bcryptjs 3.x trae sus propios tipos; `@types/bcryptjs` (devDep) ya no
  hace falta. Se puede quitar en una limpieza futura (inofensivo).
- *(Resueltos en la revisión)*: cookie `Secure` en producción, `/api/attachment` ahora requiere sesión,
  401 en peticiones de datos devuelve al login, y el bootstrap exige `ADMIN_PASSWORD` ≥ 8.

## 3d. Hallazgos de la revisión del Subsistema H2 (menores / por diseño)

- **`/api/tickets/:id/reply` no está gateado por área/rol:** cualquier usuario autenticado (con
  ENABLE_WRITES) puede responder correos al cliente. Diferido en el spec (el correo se rehace en D). Cuando
  se aborde, gatearlo por rol/área o una capacidad "puede responder".
- **Orden 409 antes de 403 en la transición:** un usuario sin permiso puede distinguir "no aplica desde el
  estado" (409) de "aplica pero no tienes el área" (403), revelando qué transiciones son válidas para un
  estado. Bajo riesgo (el Blueprint completo ya viaja al cliente en `shared/transitions.ts`). Si se quiere
  ocultar, mover el check de área (403) antes del check de `from` (409).
- **`users.role_id` sin FK; no hay DELETE de rol (solo desactivar):** es seguro (un rol borrado/inactivo →
  LEFT JOIN da áreas `[]`, fail-closed). Si algún día se añade borrado de roles, usar FK `ON DELETE SET NULL`.

## 3g. SUBSISTEMA D — Correo propio (DIFERIDO, alcance definido 2026-06-05)

El **último cordón con Zoho**: que la app reciba y responda correos de clientes por sí misma. HOY Zoho Desk
recibe el correo → crea tickets → la app sincroniza (solo lectura); responder va por Zoho
(`POST /api/tickets/:id/reply` → `sendReply`, requiere `ENABLE_WRITES`).

**Transporte recomendado: Gmail API** sobre el buzón de **Google Workspace** (`servicio@ambientalia.com.co`,
confirmar dirección exacta). Volumen bajo (<20/día). Por qué Gmail API (vs IMAP/SMTP o un ESP): Google firma
DKIM y envía por su infra (gran entregabilidad, **sin tocar DNS** si el Workspace ya está bien), sync
incremental por `historyId` (sin polling pesado), **hilos nativos** (`threadId`), adjuntos por API, y OAuth
con refresh token (mismo patrón que Zoho → `GMAIL_REFRESH_TOKEN` + Google Cloud project/consent, scopes
`gmail.modify`+`gmail.send`).

**Descomposición (cada uno spec→plan→build):**
- **D0 — Infraestructura/decisiones:** cuenta, scopes/OAuth, sync por `historyId`, etiqueta "procesado",
  threading (`threadId` + `[Ticket #N]` de respaldo), identidad/firma, verificación DNS (DKIM/SPF/DMARC),
  **almacenamiento de adjuntos** (cierra ese debt), anti-bucle (autoresponders/bounces), e **investigar cómo
  llega hoy el correo a Zoho** (reenvío/MX/IMAP — el usuario no estaba seguro) para diseñar el corte.
- **D1 — Recepción (inbound → tickets):** leer mensajes nuevos (`history.list`), parsear
  (de/asunto/cuerpo/adjuntos/`Message-ID`/`References`), dedupe, **emparejar por `threadId`/References a un
  ticket o crear uno nuevo** (managed_by_app, cliente por email→contacto/cuenta), insertar conversación +
  adjuntos, re-apertura si estaba cerrado, marcar "procesado".
- **D2 — Envío (responder):** reemplaza `/api/tickets/:id/reply` → componer MIME + `messages.send` con
  `threadId` + cabeceras de threading; registrar conversación enviada; adjuntos salientes; **gating por rol**
  (cierra el debt del reply sin gate, §4).
- **D3 — Corte (cutover):** desconectar Zoho del buzón / cambiar reenvío, coexistencia (etiqueta/shadow),
  pruebas end-to-end, fallback a Zoho.

Orden: D0 → D1 → D2 → D3. *(Decisión de diferirlo: 2026-06-05, priorizar depuración de UI antes.)*

## 3e. IDEA FUTURA — Subsistema "Remisiones" (integrar el flujo n8n en la plataforma)

Existe un flujo de **n8n** (`Remisiones_ST_3.13`) que gestiona remisiones de **entrada** y **salida** de
Servicio Técnico. Se evaluó traerlo a la plataforma. **Diferido** por ser grande; retomar tras C/D.

**Qué hace el n8n hoy:** formulario (credencial empleado, tipo entrada/salida, fecha, nº de serie) →
busca empleado por credencial, equipo por serial (marca/modelo/cliente) y cliente → formularios por marca
(Grimm EDM180/280, Horiba, Environics, Kunak, Otro) con checklist "Incluye" → genera PDF/GDoc (plantilla
F-ST-010), etiqueta DYMO, correo (Gmail), avisos Telegram, y registra en Google Sheets + Drive. La salida
hace match con la entrada por serial y captura "Estado" + faltantes.

**Lo que la plataforma simplifica:** el "número de credencial" desaparece (el técnico = usuario logueado,
H1); los clientes ya están en `accounts`; los campos de equipo ya existen en tickets.

**Dos flujos pedidos (compatibles con un `remisiones.ticket_id` nullable):**
1. **Crear ticket desde una remisión de entrada** (= subsistema C disparado por la remisión; asunto
   estandarizado `MT_serial_modelo_AAMMDD` + campos del equipo).
2. **Remisión de entrada independiente** que luego se asocia a un ticket.

**Bloques a construir:** registro de `equipos` (serial→marca/modelo/cliente) + alta si no existe; catálogos
"Incluye" por marca/modelo (config); formularios entrada/salida; vínculo con tickets (reusa C); generación
PDF; **almacenamiento de archivos** (fotos/PDF — *primera vez que la plataforma guarda archivos reales*);
notificaciones (correo→D / Telegram); DYMO (opcional).

**Decisiones clave para el diseño:** (a) dónde se guardan archivos (Google Drive vs disco VPS vs S3/MinIO);
(b) cómo se genera el PDF (HTML→PDF en backend vs seguir con Google Docs API); (c) correo: Gmail/SMTP ahora
o esperar al Subsistema D; (d) Postgres como fuente de verdad (mover de Sheets/Drive) ¿con o sin espejo a
Drive durante la transición). Fases sugeridas: 1) equipos+entrada+ticket, 2) PDF+archivos, 3) salida,
4) notificaciones/DYMO. *(El JSON del flujo lo tiene el usuario; pedirlo al retomar.)*

## 3f. Hallazgos de la revisión del Subsistema I (menores / por diseño)

- **Marca de agua `<=` en `syncRecent` (M-4):** `server/books/sync.ts` corta al primer registro con
  `last_modified_time <= watermark` sobre un feed DESC. Si dos registros comparten el timestamp máximo y
  solo el segundo cambia entre ciclos, podría saltarse hasta el próximo backfill/cambio (auto-sanable por
  upsert idempotente). Es **fiel al spec**. Mejora opcional: usar `<` (re-escribe 1 fila, inofensivo) o
  añadir un comentario aclaratorio.
- **Comodines de búsqueda no escapados (M-5):** en `searchClients`/`searchSalesOrders`, `%` y `_` dentro
  del término actúan como comodines LIKE (p.ej. `search=%` lista todo, tope 20). **No es inyección** (va
  como parámetro `$1`); solo calidad de búsqueda en un endpoint con sesión y límite 20. Escapar `%`/`_`
  si se quiere afinar.
- **`String(err)` en respuestas 500** (`/api/clients`, `/api/sales-orders`): devuelve el error crudo
  (mensajes de Postgres, no secretos). Consistente con el resto del código; considerar mensaje genérico
  + log servidor a futuro.
- *(Verificado en la revisión)*: sin inyección SQL (parámetros ligados), ambos endpoints exigen sesión
  (401 sin cookie), **solo lectura** (no se escribe en Books), arranque resiliente (si faltan
  `ZOHO_BOOKS_*` se omite el sync y la app arranca; llamadas Books envueltas en `.catch`), token de Books
  separado del de Desk (caché + refresh 401, sin filtrar secretos).

## 3g. Hallazgos de la revisión del Subsistema C (menores / por diseño)

- **Gap de número en rollback (M-6, por diseño):** `createTicket` consume `nextTicketNumber` (auto-commit)
  antes del `BEGIN`. Si la transacción del INSERT hace rollback, ese número se "quema" → puede haber huecos
  en `tickets.number`. Es el trade-off estándar de las secuencias de Postgres (garantiza no-duplicados y
  no-doble-consumo bajo concurrencia, a costa de posibles huecos). La atomicidad que importa (ticket +
  transición todo-o-nada) está intacta.
- **`prioridad`/`tipoServicio`/`clasificaciones` no en lista blanca server-side (M-7):** solo `prefijo` se
  valida contra `PREFIJOS`. Los demás se exigen presentes pero no se restringen a un set (un caller directo
  de la API podría guardar texto libre). Sin riesgo de integridad (columnas `text` sin CHECK); fiel al spec.
  Si se quiere, añadir validación contra `TIPOS_SERVICIO`/`CLASIFICACIONES`/`['High','Medium','Low']`.
- **`buildCodigoServicio` usa fecha local (M-8):** el `AAMMDD` se calcula con getters locales; en un VPS sin
  TZ America/Bogota podría rodar de día cerca de medianoche. Cosmético (el código es editable en la vista
  previa). Si molesta, fijar `TZ=America/Bogota` en el contenedor o calcular en esa zona.
- *(Verificado en la revisión)*: sin inyección SQL (parámetros ligados, identificadores literales),
  `POST /api/tickets` exige sesión (401), validación server-side (422) de obligatorios + cliente/OV
  existentes + prefijo, atomicidad ticket+transición (BEGIN/COMMIT/ROLLBACK), estado inicial "OV asignada"
  correcto, **solo lectura en Books**, y limpieza de efectos en el frontend (sin setState tras desmontar).

## 3h. Hallazgos de la revisión del Subsistema E (menores / latentes, fuera de alcance)

- **`getEquipo` no filtra `active` (M-9):** el gate de creación (`POST /api/tickets`) usa `getEquipo`, que
  NO exige `active = true` (sí lo hace `searchEquipos`). Hoy nada pone `active=false`, así que es inofensivo;
  cuando llegue la **gestión de equipos** (baja lógica), añadir `AND active = true` a `getEquipo` para que un
  equipo dado de baja no pueda usarse pasando su id directo.
- **Dedup del parser colapsa por `serial|cliente|modelo` (M-10):** dos filas idénticas salvo el `tipo`
  colapsarían a la primera. Verificado: el `equipos.seed.csv` actual tiene **0** llaves duplicadas → sin
  pérdida real. Edge latente si el listado futuro añade mismo serial+modelo con tipo distinto.
- *(Verificado en la revisión)*: sin inyección SQL (parámetros ligados), el **gate** no confía en el
  frontend (marca/modelo/serie/tipo salen del equipo registrado, 422 si falta/no existe), endpoints con
  sesión (401), semilla idempotente y tolerante al arranque (no tumba el boot), `equipos.seed.csv` íntegro
  (353 líneas, 5 columnas, seriales WS600-UMB corregidos, sin filas de prueba).

## 3i. Hallazgos de la revisión del Subsistema Vistas (menores / por diseño)

- **"Vence hoy" excluye lo de hoy ya vencido (M-11):** en `groupByDueDate` (`src/board.ts`), `d < now → vencidos`
  antes de `d < fin de hoy → hoy`. Un ticket con vencimiento hoy pero a una hora ya pasada cae en **Vencidos**,
  no en "Vence hoy". Es fiel al spec (`dueDate < now`), solo que la etiqueta "Vence hoy" lo sobrevende. Sin bug.
- **Acople de zona horaria en `due_date` solo-fecha (M-12):** `new Date('2026-06-10')` se parsea como medianoche
  **UTC**, mientras los cortes (`startToday`/`endToday`) se construyen en hora **local**. En UTC-5 (Colombia) un
  vencimiento "de hoy" solo-fecha resuelve a hoy 00:00 UTC = ayer 19:00 local → puede caer en `vencidos` unas horas
  "antes" cerca de medianoche. Impacto bajo (un solo offset fijo en prod). Si molesta: normalizar ambos a la misma zona.
- **Cobertura de ramas (M-13):** los tests no ejercen `dueDate` inválido-no-nulo (→ `sinfecha`) ni una prioridad
  desconocida-no-nula (→ `otra`); ambos correctos por inspección. Añadir casos si se quiere blindar.
- *(Verificado)*: sin inyección SQL (`getAllTickets` literal sin filtro), endpoint con sesión en ambos scopes,
  regla "solo Modo de estado = activos" correcta (`statusType !== 'Closed'` ≡ el WHERE viejo, null incluido),
  carga única + derivación cliente (sin refetch), `visibleColumns` no oculta mal las columnas de prioridad/vencimiento.

## 3h. Hallazgos de la revisión del Subsistema F (gestión de equipos) — menores

- **PATCH no re-valida `serial` vacío (M-14):** `POST /api/equipos` exige `serial` no vacío, pero
  `PATCH /api/equipos/:id` con `{ serial: '' }` lo deja vacío sin 422 (solo `trim`). Bajo impacto (con
  sesión, `serial` no es llave). Añadir el mismo guard que en create si se quiere simetría.
- **`listEquiposManage` ordena por `serial`** (el spec sugería `updated_at`/`serial`): los recién editados no
  flotan arriba. Cosmético.
- **Lista de gestión sin paginación UI (M-15):** trae solo la primera página de 50; los equipos más allá de 50
  en una búsqueda dada no son alcanzables (la búsqueda acota). Añadir "siguiente página" si hace falta.
- *(Verificado)*: SQL parametrizado con **allow-list** de columnas en `updateEquipo`, los 4 endpoints bajo
  `requireAuth` (401 sin sesión), `cliente_nombre` derivado en servidor de `getClient`, `searchEquipos`
  sigue filtrando `active=true` (intacto) → un equipo desactivado no sirve para crear tickets nuevos pero los
  tickets existentes conservan su `equipo_id`; sin borrado físico; `createEquipo` usa `eq-<uuid>` (sin colisión
  con los ids hash de la semilla).

## 3j. Reorg de esquemas — alternativa R2 (calificar queries) + dedup Fase 2

**Contexto:** estamos reorganizando las tablas por producto Zoho (`desk.*`/`books.*`/`crm.*`). La **Fase 1** (Zoho Desk →
`desk.*`) se hace vía **R1: `search_path`** (toggle `DB_SCHEMA=desk` en prod; queries siguen "peladas"; ver
`docs/superpowers/specs/2026-06-18-reorg-esquemas-fase1-design.md`).

**R2 — alternativa descartada AHORA, anotada para el futuro:** calificar las **~230 queries** del server a `desk.*`
(`FROM desk.tickets`). **Ventaja:** 100% testeable en pg-mem (las tablas calificadas sí funcionan; pg-mem **no** soporta
`search_path` ni `ALTER … SET SCHEMA`, verificado). **Costo:** churn enorme + disciplina permanente (toda query nueva debe
calificar desk/public). **Cuándo reconsiderar:** si se quiere cobertura automática total del layout por esquema, o si
pg-mem deja de ser el harness de tests. Hasta entonces, R1 + validación en prod (como SP2/Books).

**Fase 2 pendiente — dedup Books-lite:** reemplazar `public.clients`/`public.sales_orders` por **vistas** sobre `books.*`
(proyección lite; `ticket_number` etc. desde `raw`), replicar `books.contacts`/`books.sales_orders` a desk-db, apagar el
`createBooksSync` lite. Spec propio cuando cierre la Fase 1.

## 4. Otros pendientes conocidos (menores)

- **`serial`/`codigo_servicio` vacíos en tickets históricos de Zoho:** confirmado en producción — solo 1
  ticket tiene `serial` poblado (el creado en la app); los históricos tienen `serial` Y `codigo_servicio`
  en NULL (el número de serie vive solo en el **`subject`**, p.ej. `…MT_18A19042_EDM180C_260305`). La
  **hoja de vida** ya lo resuelve emparejando por el serial-token dentro del asunto (`getEquipoHistorial`).
  **Mejora futura:** un backfill que extraiga `serial` (y código) del asunto a las columnas, para que también
  se beneficien el gate de creación, la búsqueda y reportería. (El mapeo promueve `serial` desde un
  customField "Serial" de Zoho que los tickets no diligencian.)
- **Activar escrituras (reply):** `ENABLE_WRITES=true` habilita **responder por correo** (sigue yendo a
  Zoho, transitorio). Las **transiciones ya NO** necesitan este flag (escriben en Postgres). Probar primero
  con un ticket de prueba.
- **Rotar el Zoho Client Secret** 🔐 — apareció en capturas durante el desarrollo; regenerarlo
  en api-console.zoho.com y actualizar `ZOHO_CLIENT_SECRET`.
- **Imágenes en línea de emails:** las `inlineattachments` requieren auth de Zoho y no cargan
  en la app (salen como imagen rota). Se podrían proxyar igual que los adjuntos.
- **Frescura de conversaciones:** se sincronizan al abrir el ticket la primera vez (y tras
  responder desde la app). Una respuesta hecha **directamente en Zoho** no aparece hasta
  re-sincronizar. Opción futura: re-sync de conversaciones en cada apertura o por webhook.
- **Webhooks de Zoho Desk:** para casi-tiempo-real (disparar `syncTicket` en cambios) en vez
  del polling cada 3 min (`syncRecent`).
- **Independizar `zoho-hub-sync` a su propio proyecto (repo/carpeta):** hoy el worker `zoho-hub-sync` se
  despliega desde el **mismo repo** que la Desk app (`Algarpibe/ambientalia-desk`) usando `APP_ENTRYPOINT=hub-sync.ts`;
  comparte todo el código de sync (`server/sync.ts`, `server/hubSync.ts`, `server/books/*`, `zohoClient`,
  `tokenManager`, mappers, `schema.sql`). **Objetivo futuro:** separarlo a nivel de archivos/carpetas en su
  **propio proyecto/repo** (o monorepo con paquete compartido), desacoplando los dos despliegues. Implica extraer
  el **motor de sync Zoho** (mappers + cliente Zoho/Books + tokenManager + esquema de las tablas Zoho + lógica de
  sync) a un **paquete compartido** que ambos importen, o duplicarlo en el nuevo repo. Hacerlo cuando el hub madure
  (p.ej. al sumar CRM o más consumidores). Relacionado con la arquitectura zoho-hub (Opción D).
- ~~**Remisión huérfana si falla la subida de una foto**~~ — **RESUELTO 2026-08-05.** Plan en
  `docs/superpowers/plans/2026-08-05-remision-huerfana-fotos.md`.
  **El diagnóstico de esta entrada estaba mal descrito:** el bucle de fotos SÍ estaba dentro del `try`. Lo que se
  perdía era el `rem.id`, una `const` local que el `catch` dejaba atrás al volver al formulario. El efecto era el
  descrito, pero el arreglo no era mover el `try` sino sacar el id a estado.
  Se hizo la opción (b): `apps/desk/src/lib/envioRemision.ts` orquesta crear → fotos → enviar de forma
  **reanudable**, con las dependencias inyectadas para poder probarla sin harness de componentes. El avance
  (`remisionId` + `fotosSubidas`) vive en estado, así que reintentar continúa con la remisión que ya existe.
  Cuatro cosas que el análisis original no contemplaba y que salieron de la revisión:
  1. **La opción (a) también hacía falta**, pero como salida y no por defecto: una foto corrupta o demasiado
     pesada dejaba al técnico atrapado reintentando para siempre. "Continuar sin las N fotos que faltan" manda lo
     que sí subió; n8n concilia contra lo mandado, así que no cuenta como error.
  2. **`fotosSubidas` es un índice posicional** sobre la lista de ficheros del componente. Si esa lista cambia
     entre intentos se suben fotos equivocadas **en silencio**. De ahí que los campos se congelen con
     `creada || !!busy` y no solo con `creada`: entre el clic y la respuesta del servidor había una ventana.
  3. **Recargar o cerrar el navegador** perdía el estado igual. Al abrir el formulario se busca una remisión del
     ticket en `pendiente` y se ofrece enviarla; y crear una segunda con ese cartel a la vista pide confirmación.
  4. **`ResultadoRemision` no sondeaba si traía `errorEnvio`**, así que un 409 del cerrojo de reenvío —que
     significa "se está enviando bien ahora mismo"— se pintaba como fallo rojo, y ante un fallo rojo el técnico
     crea otra remisión: realimentaba el propio bug. Ahora sondea siempre y la escala de color distingue **gris**
     (tropiezo al sondear), **ámbar** (envío sin confirmar) y **rojo** (veredicto de n8n).
  ~~**`POST /api/remisiones` no deduplica**~~ — **RESUELTO 2026-08-06.** Regla: una `pendiente` por ticket. 409
  por defecto, con el id de la que ya existe; `permitirSegunda: true` en el cuerpo la deja pasar, y es el
  formulario diciendo que el humano pasó por el `confirm`. **No se bloqueó del todo a propósito:** si n8n se cae
  y la primera se queda en `pendiente` para siempre, un bloqueo duro dejaría al técnico sin poder crear otra sin
  un administrador que anule — un callejón sin salida nuevo, y este subsistema ya tuvo esa trampa dos veces.
  ⚠️ **La premisa que traía esta entrada era falsa:** decía que no se podía bloquear porque "un ticket puede
  recibir dos equipos", y **hoy eso no es expresable**. El equipo y el serial de la remisión se derivan del
  ticket y no se aceptan del navegador (deciden qué checklist aplica), así que dos remisiones de un ticket son
  siempre del MISMO equipo. Volverá a ser cierto con la rama de salida o si el formulario deja elegir equipo;
  hasta entonces, dos pendientes son un duplicado.
  ~~Tampoco hay reenvío para una remisión en `estado: 'error'`~~ — **RESUELTO 2026-08-06.** Y **esta entrada
  estaba mal**: decía "es capacidad nueva, no arreglo", y no lo era. El servidor ya lo permitía —`/enviar` solo
  cierra el paso a las anuladas y a las que terminaron bien— y `ResultadoRemision` ya sabía reenviar y sondear
  (`puedeReintentar` incluye `estado === 'error'`). La capacidad estaba entera y solo era **inalcanzable**: no
  había desde dónde llegar. Se cableó un botón en `PanelRemisiones`, fuera del bloque que lista los fallos —ése
  solo aparece si n8n los detalló, así que un error sin detalle dejaba la tarjeta en rojo y sin nada que hacer—.
  No se ofrece para una remisión del histórico: ésa nunca pasó por n8n, y "reenviarla" generaría en Drive un
  documento nuevo para un servicio de hace años.

- ~~**`POST /api/tickets/:id/reply` devolvía 500 tras haber enviado el correo**~~ — **RESUELTO 2026-08-06.**
  El `await sync.syncConversations(id)` iba fuera de todo `try`, después del `sendReply`. Con Zoho caído el
  usuario leía "falló" sobre un correo que sí había salido, y el reintento natural mandaba un segundo correo al
  cliente. Ahora degrada a un `warn` en el log, como ya hacía la ruta hermana de historia: pasado el `sendReply`
  nada puede devolver error, porque el efecto irreversible ya ocurrió. El refresco es una comodidad — el hilo se
  recompone solo al abrir el ticket.
