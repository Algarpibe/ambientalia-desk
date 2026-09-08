# Runbook — verificaciones pendientes de la Fase 0

**Por qué existe:** la auditoría F0-00 y las diez respuestas dejaron seis comprobaciones que **no se pueden hacer desde el repositorio**. Necesitan la consola de EasyPanel, la de Zoho, la de GitHub o la de n8n. Ninguna es reversible por accidente salvo el bloque 2, que se marca aparte.

**Cuándo:** el bloque 1 y el 2 son de hoy. Los bloques 3 a 5 pueden esperar, pero condicionan specs de F0-02 y el diseño de F1C-02.

**Dónde:** EasyPanel → servicio → *Postgres Client*.

> ⚠️ **Esquema.** En producción `DB_SCHEMA=desk`, así que `tickets`, `ticket_transitions`, `activities` y `contacts` viven en el esquema **`desk`**; el catálogo (`catalogo_*`), `remisiones*`, `users` y `sessions` viven en **`public`**. Las consultas de abajo van calificadas. Si prefieres no calificar, primero:
> ```sql
> SET search_path = desk, public;
> ```

---

## Bloque 1 · Replicación lógica — **el urgente**

**Por qué corre primero.** `desk.activities` es tabla suscriptora **y** tiene un escritor local: `upsertActivity` hace `INSERT … ON CONFLICT (id) DO UPDATE`, pero el *apply* de la replicación hace `INSERT` crudo. Si el sync local escribe primero, el apply choca con clave duplicada, **el worker se atasca y reintenta la misma transacción para siempre**. Ambos procesos consultan Zoho cada 180 s, así que la carrera es rutina, no excepción.

**El riesgo grave no es frescura de datos: es disco.** Una suscripción atascada no avanza su slot, y el publicador **retiene WAL indefinidamente**. La replicación se activó el 2026-08-10 (`debt.md:299-301`). Si lleva atascada desde entonces, es un mes de WAL acumulado en el hub.

### 1.1 · En `desk-db` — estado de las cuatro tablas suscritas

```sql
SELECT srrelid::regclass AS tabla, srsubstate
FROM pg_subscription_rel;
```

Se esperan cuatro filas en estado `r`: `desk.activities`, `books.contacts`, `books.sales_orders`, `books.items`.

### 1.2 · En `desk-db` — ¿el apply está vivo, y desde cuándo no avanza?

```sql
SELECT subid, subname, pid, received_lsn, latest_end_lsn,
       last_msg_receipt_time, latest_end_time
FROM pg_stat_subscription;
```

**`pid` a `NULL`, o `latest_end_time` congelado hace días = atascada.**

### 1.3 · En `zoho-hub-db` — cuánto WAL se está reteniendo

```sql
SELECT slot_name, active, confirmed_flush_lsn,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), confirmed_flush_lsn)) AS wal_retenido
FROM pg_replication_slots;
```

### 1.4 · Y en el log de Postgres de `desk-db`

Buscar errores de **clave duplicada sobre `activities`**. Ahí sale la fila concreta que bloquea el apply.

### Qué hacer con el resultado

| Resultado | Acción |
|---|---|
| Todo `r`, `pid` no nulo, `latest_end_time` reciente, WAL pequeño | No hay problema. Aun así, documenta los flags (bloque 5) |
| Atascada | **El arreglo es `SYNC_ACTIVITIES=false` en el despliegue de Desk**, no reiniciar la suscripción. Reiniciar sin quitar el segundo escritor devuelve el problema en el siguiente ciclo de 180 s |

> ⚠️ **Destrabar un apply puede ser CON PÉRDIDA.** No se arregla reiniciando: hay que borrar la fila local en conflicto, o `ALTER SUBSCRIPTION … SKIP (lsn = …)`, que **salta una transacción entera** con todo lo que llevara dentro. Por eso 1.2 y 1.3 van antes: miden cuánto lleva parada y cuánto se perdería.

---

## Bloque 2 · Rotación de secretos — **hoy lo barato, el resto en F0-04**

`debt.md:29-31` los da por **comprometidos**: *«Todos comprometidos (aparecieron en el chat)»*. Y `:840`: *«apareció en capturas durante el desarrollo»*. `.env` **nunca** entró en el histórico de git (verificado), así que **no hay que reescribir historia**: es rotar y ya.

### 2.1 · La lista se deriva de `config.ts`, no de la prosa

La lista de `debt.md` tenía doce y le faltaban al menos tres, que sí están en `packages/zoho-sync/src/config.ts`:

| # | Credencial | Origen |
|---|---|---|
| 1-3 | Passwords de las 3 BD (desk / hub / sales-tracker) | `debt.md:29` |
| 4 | `ZOHO_CLIENT_SECRET` | `config.ts:78` |
| 5-7 | Refresh tokens Desk / Books / CRM | `config.ts:79, 100, 106` |
| 8-9 | 2 PATs de GitHub | `debt.md:30` |
| 10 | `ADMIN_PASSWORD` | `config.ts:97` |
| 11 | API key de n8n | `debt.md:30` |
| 12 | Password de `hub_reader` | `debt.md:31` |
| **13** | **`N8N_REMISION_TOKEN`** | `config.ts:112` — no estaba en la lista |
| **14** | **`REMISION_CALLBACK_TOKEN`** | `config.ts:113` — no estaba, y es **el grave** |
| **15** | **`N8N_AVISOS_TOKEN`** | `config.ts:115` — no estaba |
| 16-17 | `ZOHO_BOOKS_CLIENT_SECRET`, `ZOHO_CRM_CLIENT_SECRET` | `config.ts:99, 105`. **Solo si en producción están puestas por separado** — tienen *fallback* a `ZOHO_CLIENT_SECRET` |

**Por qué `REMISION_CALLBACK_TOKEN` es el grave.** Con él, un `POST /api/remisiones/:id/callback` con `estado='ok'` avanza el ticket a «Remisión creada» y deja una fila en `ticket_transitions` **firmada por quien creó la remisión, no por quien llamó**. Es falsificar una entrada de auditoría.

### 2.2 · Hoy, sin coordinación

- [ ] **Revocar los 2 PATs de GitHub.** Verificado que no rompe este repo: no hay `.npmrc`, ni dependencia `@algarpibe` en ningún `package.json`, ni `NODE_AUTH_TOKEN`/`NPM_TOKEN` en `ci.yml` ni en el `Dockerfile`. ⚠️ `@algarpibe/zoho-sync` se publica en GitHub Packages: lo que lo consuma **fuera** de este repo puede necesitar el token de reemplazo.
- [ ] **`ADMIN_PASSWORD`.** No espera a F0-04: da acceso a los endpoints admin, y `eliminarTicket` destruye `ticket_transitions` de forma irreversible. Es una env y un redespliegue de un servicio.
- [ ] **API key de n8n.** Comprueba antes quién la consume: la app dispara n8n por *webhook URL* (`config.remisionWebhookUrl`), no por API key, así que probablemente no rompe nada.
- [ ] **`REMISION_CALLBACK_TOKEN`, `N8N_REMISION_TOKEN`, `N8N_AVISOS_TOKEN`.** Rotar en pareja: el valor vive en la env de la app **y** en el nodo de n8n. Si solo se cambia un lado, las remisiones dejan de cerrarse.
- [ ] Barrido de confirmación: `git log -S '<valor>'` por si algo se incrustó en un fichero de código.

### 2.3 · En F0-04, coordinado

- [ ] `ZOHO_CLIENT_SECRET` + los 3 refresh tokens. **Es una operación atómica**: rotar el secret invalida los tokens.
- [ ] Los 3 passwords de BD.
- [ ] **`hub_reader` — va DESPUÉS del bloque 1.** Si es el usuario con el que la suscripción conecta al hub, rotar su password sin `ALTER SUBSCRIPTION … CONNECTION` **rompe la replicación**: el mismo incidente que el bloque 1 investiga. Confirmarlo contra la connstring real de la suscripción antes de tocarlo.

---

## Bloque 3 · Campos «Final» — cierra la pregunta 10

`fecha_orden_compra_final` y `fecha_orden_venta_final` son, casi con seguridad, **la columna 42/43 del Anexo G renombrada en el layout de Zoho** para la rama de `Aprobación`. Estas dos consultas lo confirman o lo desmienten sin preguntarle a nadie.

### 3.1 · ¿Se han usado alguna vez?

Cubre todo el histórico: estas columnas las rellena el sync desde el layout de Zoho.

```sql
SELECT
  COUNT(*) FILTER (WHERE fecha_orden_compra       IS NOT NULL) AS oc,
  COUNT(*) FILTER (WHERE fecha_orden_venta        IS NOT NULL) AS ov,
  COUNT(*) FILTER (WHERE fecha_orden_compra_final IS NOT NULL) AS oc_final,
  COUNT(*) FILTER (WHERE fecha_orden_venta_final  IS NOT NULL) AS ov_final
FROM desk.tickets;
```

### 3.2 · ¿Qué rama las rellena?

Solo cubre transiciones ejecutadas desde Desk 2.0, así que la muestra es más corta.

```sql
SELECT transition_id, COUNT(*) AS ejecuciones,
  COUNT(*) FILTER (WHERE NULLIF(values->>'Fecha Orden de Compra Final','') IS NOT NULL) AS oc_final,
  COUNT(*) FILTER (WHERE NULLIF(values->>'Fecha Orden de Venta Final','')  IS NOT NULL) AS ov_final,
  COUNT(*) FILTER (WHERE NULLIF(values->>'Fecha Orden de Compra','')       IS NOT NULL) AS oc,
  COUNT(*) FILTER (WHERE NULLIF(values->>'Fecha Orden De Venta','')        IS NOT NULL) AS ov
FROM desk.ticket_transitions
WHERE transition_id IN ('aprobacion','aprobacion_y_repuestos')
GROUP BY transition_id;
```

### Qué significa cada resultado

| Resultado | Lectura |
|---|---|
| `oc_final` y `ov_final` a **0** en 3.1 | Se crearon y nunca se rellenaron. La pregunta a Gustavo pasa a ser «¿los retiramos del layout?» |
| `oc_final` con valores, y en 3.2 solo bajo `aprobacion` | Confirma la duplicación de layout: es la columna 42 con otro nombre en la rama sin repuestos |
| **Y en todo caso** | La columna 58 del Anexo G, *Tiempo de orden de compra*, **es el bodegaje de proceso** (M1.10) y se calcula sobre `fecha_orden_compra`. Si la rama sin repuestos escribe la «Final», **ese indicador no es calculable para esos tickets** |

---

## Bloque 4 · «Una OV, un ticket» — ¿regla o ficción?

La regla se comprueba en dos puertas (`ticketService.ts:45-49` y `:99-102`) y **está abierta en la tercera**: `remision.ts:188-196` escribe `salesorder_id` sin llamar a `ticketConOrdenVenta`.

Y el Anexo D nº 52 del maestro dice que **ninguna variante real de OV encaja en «una OV, un ticket»** — en particular la *OV global por varios equipos*, que es justo la que pasaría por esa tercera puerta.

### 4.1 · Por identificador

```sql
SELECT salesorder_id, COUNT(*) AS tickets, array_agg(number ORDER BY number) AS cuales
FROM desk.tickets
WHERE COALESCE(salesorder_id,'') <> ''
GROUP BY salesorder_id HAVING COUNT(*) > 1
ORDER BY tickets DESC;
```

### 4.2 · Por número de texto

```sql
SELECT orden_venta, COUNT(*) AS tickets, array_agg(number ORDER BY number) AS cuales
FROM desk.tickets
WHERE COALESCE(orden_venta,'') <> ''
GROUP BY orden_venta HAVING COUNT(*) > 1
ORDER BY tickets DESC;
```

| Resultado | Lectura |
|---|---|
| **Cero filas** | La tercera puerta es un agujero teórico. Se tapa en F1A añadiendo `ticketConOrdenVenta` a `remision.ts` |
| **Filas** | Alguien ya remisiona para esquivar el 409. La regla es ficción y **la spec `tickets-core` no puede escribirse como «una OV, un ticket»**. Va al punto 52 con datos |

---

## Bloque 5 · Flags de sincronización — documentación, no ejecución

`SYNC_CONTACTS` y `SYNC_ACTIVITIES` valen `true` por defecto (`config.ts:89-90`: `env.SYNC_CONTACTS !== 'false'`) y **no aparecen en `.env.example` ni en `DEPLOY.md`**.

- [ ] Comprobar en EasyPanel si están fijados en el despliegue de Desk, o si están a su valor por defecto.
- [ ] Anotar el valor real. Entra en `.env.example` y `DEPLOY.md` en **F0-01**, con dos frases: qué enciende y qué se rompe si se pone mal.

Un interruptor que enciende un escritor sobre una tabla suscriptora y que nadie ha escrito en ningún sitio es un accidente esperando fecha.

---

## Resumen para llevar

| Bloque | Dónde | Urgencia | Reversible |
|---|---|---|---|
| 1 · Replicación | `desk-db` + `zoho-hub-db` | **Hoy** — riesgo de disco en el hub | Las consultas sí; destrabar el apply **no** |
| 2 · Secretos (parte de hoy) | GitHub, EasyPanel, n8n | **Hoy** | Rotar es irreversible por diseño |
| 3 · Campos «Final» | `desk-db` | Antes de F0-02 | Sí, solo lectura |
| 4 · OV duplicadas | `desk-db` | Antes de F0-02 | Sí, solo lectura |
| 5 · Flags | EasyPanel | Antes de F0-01 | Sí, solo lectura |

**Todo lo de los bloques 1, 3, 4 y 5 es de solo lectura.** El único que cambia estado es el bloque 2, y sus dos primeras tareas —revocar PATs y cambiar `ADMIN_PASSWORD`— no requieren coordinación con nadie.
