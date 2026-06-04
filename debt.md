# Deuda técnica / trabajo diferido — Desk Ambientalia

Lista de trabajo aplazado a propósito, para avanzar ligeros. Cada ítem indica **qué**,
**por qué se difirió**, **estado del código** y **cómo retomarlo**.

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

## 4. Otros pendientes conocidos (menores)

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
