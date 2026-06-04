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
