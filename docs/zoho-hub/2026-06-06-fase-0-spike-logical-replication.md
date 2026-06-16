# Fase 0 — Spike: logical replication `zoho-hub` → `desk-db` (go/no-go)

**Objetivo:** validar, con tablas de prueba, que la replicación lógica nativa de Postgres entre los dos servicios
de EasyPanel es viable y estable **antes** de diseñar la migración real (Opción D). No toca la app ni los datos
reales.

> 🔒 **Seguridad:** la contraseña de `zoho-hub-db` quedó expuesta en una captura → **rótala** y úsala solo como
> secreto/variable de entorno. En los comandos de abajo aparece como `***` — sustitúyela al ejecutar, no la pegues
> en commits ni chats.

Convención: **hub** = `zoho-hub-db` (publisher) · **app** = `desk-db` (subscriber). Ejecuta con `psql` o la consola
SQL de EasyPanel contra cada servicio.

---

## Criterios go/no-go (lo que el spike debe demostrar)
1. **`wal_level = logical`** se puede activar en el Postgres del hub (EasyPanel).
2. El Postgres de **app alcanza por red** al del hub (mismo proyecto/red de EasyPanel).
3. **Copia inicial + streaming** funcionan (los INSERT del hub aparecen en app).
4. **Lag de replay aceptable** bajo carga (objetivo: pocos segundos en un INSERT masivo).
5. **Runbook de DDL** claro y funciona (orden: **suscriptores primero, hub después** en cambios aditivos).

---

## Paso 1 — Activar logical replication en el HUB
En el hub:
```sql
SHOW wal_level;   -- si NO dice 'logical', hay que cambiarlo
```
Si no es `logical`:
```sql
ALTER SYSTEM SET wal_level = logical;
-- max_wal_senders y max_replication_slots suelen venir en 10 (suficiente); si están en 0, súbelos:
-- ALTER SYSTEM SET max_wal_senders = 10;
-- ALTER SYSTEM SET max_replication_slots = 10;
```
Luego **reinicia el servicio `zoho-hub-db` en EasyPanel** (el cambio de `wal_level` exige reinicio). Verifica:
```sql
SHOW wal_level;   -- debe decir 'logical'
```
> Si EasyPanel no permite `ALTER SYSTEM`/reinicio con `wal_level=logical`, eso es ya un **no-go** para D nativo
> (habría que revisar la imagen/args del servicio Postgres). Es justo lo que este spike busca descubrir.

## Paso 2 — Tablas de prueba + publicación (en el HUB)
```sql
CREATE TABLE rep_test_accounts (id text PRIMARY KEY, name text, updated_at timestamptz DEFAULT now());
CREATE TABLE rep_test_tickets  (id text PRIMARY KEY, number int, subject text, account_id text, modified_time timestamptz);
INSERT INTO rep_test_accounts (id,name) VALUES ('a1','ACME'),('a2','Corola');
INSERT INTO rep_test_tickets  (id,number,subject,account_id,modified_time)
  VALUES ('t1',1,'Prueba 1','a1', now()), ('t2',2,'Prueba 2','a2', now());
CREATE PUBLICATION zoho_pub FOR TABLE rep_test_accounts, rep_test_tickets;
```
(La PK ya da `REPLICA IDENTITY` para updates/deletes.)

## Paso 3 — Tablas espejo + suscripción (en APP / desk-db)
Las tablas deben existir con **estructura compatible** antes de suscribir:
```sql
CREATE TABLE rep_test_accounts (id text PRIMARY KEY, name text, updated_at timestamptz);
CREATE TABLE rep_test_tickets  (id text PRIMARY KEY, number int, subject text, account_id text, modified_time timestamptz);

CREATE SUBSCRIPTION zoho_sub
  CONNECTION 'host=ambientalia_project_zoho-hub-db port=5432 dbname=zoho-hub user=postgres password=*** sslmode=disable'
  PUBLICATION zoho_pub;
```
Al crearse, hace **copia inicial** automática.

## Paso 4 — Verificar copia inicial + streaming
En app:
```sql
SELECT count(*) FROM rep_test_accounts;  -- esperado 2
SELECT count(*) FROM rep_test_tickets;   -- esperado 2
```
En hub, inserta y comprueba que llega a app casi al instante:
```sql
-- HUB
INSERT INTO rep_test_tickets (id,number,subject,account_id,modified_time) VALUES ('t3',3,'En vivo','a1', now());
```
```sql
-- APP (repetir hasta verlo)
SELECT id,subject FROM rep_test_tickets WHERE id='t3';
```
**Medir lag** —
en HUB:
```sql
SELECT application_name, state, write_lag, flush_lag, replay_lag FROM pg_stat_replication;
```
en APP:
```sql
SELECT subname, received_lsn, latest_end_lsn, last_msg_receipt_time FROM pg_stat_subscription;
```

## Paso 5 — Prueba de DDL drift (el riesgo #1 de D)
Demuestra el orden correcto y el fallo/recuperación.
1. **Provoca el fallo** (orden incorrecto): añade columna en el HUB e inserta usándola:
```sql
-- HUB
ALTER TABLE rep_test_tickets ADD COLUMN status text;
INSERT INTO rep_test_tickets (id,number,subject,account_id,modified_time,status) VALUES ('t4',4,'Con status','a2', now(),'Ingresado');
```
   En APP, la aplicación de cambios **se detiene con error** (la tabla suscriptora no tiene `status`). Verifica:
```sql
-- APP
SELECT subname, last_error FROM pg_stat_subscription_stats;  -- (PG16+); o revisa los logs del servicio
SELECT id FROM rep_test_tickets WHERE id='t4';               -- NO aparece todavía
```
2. **Recupera** aplicando el DDL en el suscriptor:
```sql
-- APP
ALTER TABLE rep_test_tickets ADD COLUMN status text;
```
   La replicación se reanuda sola; ahora `t4` (con `status`) aparece. Esto **confirma el runbook**:
   **en cambios aditivos, aplica el DDL a los suscriptores ANTES que al hub** (el suscriptor tolera columnas de
   más; el hub con una columna que el suscriptor no tiene rompe el apply).

## Paso 6 — Lag bajo carga (simular el sync)
En HUB:
```sql
INSERT INTO rep_test_accounts (id,name)
SELECT 'bulk-'||g, 'Cuenta '||g FROM generate_series(1,50000) g;
```
Mide `replay_lag` (Paso 4) durante/después. **Objetivo: que se ponga al día en pocos segundos.**

## Paso 7 — Limpieza
```sql
-- APP
DROP SUBSCRIPTION zoho_sub;
DROP TABLE rep_test_accounts, rep_test_tickets;
```
```sql
-- HUB
DROP PUBLICATION zoho_pub;
DROP TABLE rep_test_accounts, rep_test_tickets;
```

---

## Qué reportar tras el spike
- `wal_level` quedó en `logical` ✔/✘ (y si exigió tocar la imagen de EasyPanel).
- App pudo conectar al hub (red) ✔/✘.
- Copia inicial + streaming ✔/✘.
- `replay_lag` con los 50k registros (segundos).
- DDL drift: confirmado el orden "suscriptores primero" ✔/✘.

Con esos resultados decidimos **go/no-go** y abrimos el **brainstorming → spec → plan** de las fases de código
(sync único en el hub, esquema `zoho` replicado en `desk-db`, vistas-contrato, write-back CQRS, matviews de
Análisis). Ver decisión en memoria `zoho-hub-arquitectura`.
