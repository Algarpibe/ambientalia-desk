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

## 3. Otros pendientes conocidos (menores)

- **Activar escrituras:** `ENABLE_WRITES=true` en Environment para habilitar responder /
  cambiar estado desde la app (con diálogo de confirmación). Probar primero con un ticket de
  prueba.
- **Rotar el Zoho Client Secret** 🔐 — apareció en capturas durante el desarrollo; regenerarlo
  en api-console.zoho.com y actualizar `ZOHO_CLIENT_SECRET`.
- **Imágenes en línea de emails:** las `inlineattachments` requieren auth de Zoho y no cargan
  en la app (salen como imagen rota). Se podrían proxyar igual que los adjuntos.
- **Frescura de conversaciones:** se sincronizan al abrir el ticket la primera vez (y tras
  responder desde la app). Una respuesta hecha **directamente en Zoho** no aparece hasta
  re-sincronizar. Opción futura: re-sync de conversaciones en cada apertura o por webhook.
- **Webhooks de Zoho Desk:** para casi-tiempo-real (disparar `syncTicket` en cambios) en vez
  del polling cada 3 min (`syncRecent`).
