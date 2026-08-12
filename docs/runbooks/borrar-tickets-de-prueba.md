# Runbook — borrar tickets de prueba a mano

> ✅ **Desde 2026-08-12 esto se hace desde la aplicación**: detalle del ticket → menú «…» → «Eliminar
> ticket», con vista previa de lo que se va y de los enlaces de Drive. Solo administradores, y solo
> tickets nacidos en Desk. **Este runbook queda como vía de rescate** si la aplicación no arranca, o
> para casos que el botón no cubre.

**Por qué existe:** el esquema **no tiene claves foráneas**. `DELETE FROM tickets` siempre funciona y
deja las filas hijas huérfanas en silencio. Ya ha mordido dos veces (`debt.md:421`). Este barrido son
**nueve tablas** y el sistema no avisa si te dejas una.

**Dónde se corre:** EasyPanel → servicio `desk-db` → Postgres Client. ⚠️ El botón abre `psql` en la base
`postgres`: hay que hacer `\c desk` antes de nada. Las tablas de Zoho Desk viven en el esquema `desk` y
las de la aplicación en `public` — por eso todo va calificado abajo.

⚠️ **`desk.activities` NO se toca**: está replicada desde el hub por `zoho_ref_pub`, y borrar filas a
mano diverge la réplica.

**Sobre los números:** `APP_TICKET_NUMBER_BASE = 10_000` y `reseedTicketNumber` pone la secuencia en
`max(MAX(number de tickets de app), 9999)`. Al borrar todos los tickets de la aplicación, **el siguiente
vuelve a ser #10000**. Es normal y explica que los mismos números reaparezcan tras cada limpieza; no
significa que el borrado anterior fallara.

---

## Paso 0 — Mirar qué hay (nunca borrar a ciegas)

Ajusta la lista de números en los tres pasos. Aquí van #10000, #10001 y #10002.

```sql
\c desk

SELECT id, number, status, subject, managed_by_app, created_at
  FROM desk.tickets
 WHERE number IN (10000, 10001, 10002)
 ORDER BY number;
```

**Comprueba antes de seguir** que salen los que esperas y que **los tres identificadores empiezan por
`app-`**.

⚠️ **No te fíes de `managed_by_app`**, aunque lo parezca: `writeTransition` la pone en `true` en
*cualquier* transición hecha desde Desk, también sobre un ticket venido de Zoho (ver
`apps/desk/server/db/ticketFuentes.ts:32-38`). Un ticket de Zoho que alguien movió una vez desde Desk
la tiene en `true`, y borrarlo aquí solo haría que volviera en la siguiente sincronización —o antes,
porque abrir su ficha lo resucita. **El prefijo `app-` del identificador sí es inmutable**: lo acuña
`createTicket` y ningún UPDATE lo toca.

## Paso 1 — Guardar los enlaces de Google Drive ANTES de borrar

Este es el paso que faltó la última vez y dejó cuatro carpetas huérfanas en Drive. Los documentos de la
remisión (PDF, editable, etiqueta `.dymo`) viven en Drive y **no se borran con la fila**: al perder la
fila se pierde el único puntero que los localiza.

```sql
SELECT t.number, r.id AS remision_id, r.estado,
       r.resultado ->> 'carpetaUrl' AS carpeta_drive
  FROM public.remisiones r
  JOIN desk.tickets t ON t.id = r.ticket_id
 WHERE t.number IN (10000, 10001, 10002);
```

**Copia esa salida a un sitio seguro.** Con esos enlaces se borran las carpetas en Drive a mano, antes o
después del SQL — pero los enlaces hay que tenerlos ya.

## Paso 2 — El barrido, en una transacción

El orden importa: las hijas de la remisión van primero, porque la foto cuelga de la **remisión** y no del
ticket. Si borras la remisión antes que sus fotos, las fotos quedan inalcanzables.

```sql
BEGIN;

CREATE TEMP TABLE _borrar ON COMMIT DROP AS
  SELECT id FROM desk.tickets
   WHERE number IN (10000, 10001, 10002)
     AND id LIKE 'app-%';   -- salvaguarda REAL: el prefijo es inmutable, managed_by_app no lo es

SELECT count(*) AS tickets_a_borrar FROM _borrar;   -- debe ser 3

DELETE FROM public.remision_fotos
 WHERE remision_id IN (SELECT id FROM public.remisiones
                        WHERE ticket_id IN (SELECT id FROM _borrar));
DELETE FROM public.remisiones             WHERE ticket_id IN (SELECT id FROM _borrar);
DELETE FROM public.avisos                 WHERE ticket_id IN (SELECT id FROM _borrar);
DELETE FROM public.ticket_reads           WHERE ticket_id IN (SELECT id FROM _borrar);
DELETE FROM public.resolution_attachments WHERE ticket_id IN (SELECT id FROM _borrar);
DELETE FROM desk.attachments              WHERE ticket_id IN (SELECT id FROM _borrar);
DELETE FROM desk.conversations            WHERE ticket_id IN (SELECT id FROM _borrar);
DELETE FROM desk.ticket_transitions       WHERE ticket_id IN (SELECT id FROM _borrar);
DELETE FROM desk.ticket_history           WHERE ticket_id IN (SELECT id FROM _borrar);
DELETE FROM desk.tickets                  WHERE id IN (SELECT id FROM _borrar);

COMMIT;
```

Si algún `DELETE` da un número que no cuadra con lo que esperabas, **`ROLLBACK;` y revisa**. Mientras no
hagas `COMMIT` no se ha ido nada.

## Paso 3 — Comprobar que no quedó nada

Sin claves foráneas **esta es la única prueba** de que el barrido fue completo. Todas las cuentas deben
dar **0**.

```sql
SELECT 'remisiones'             AS tabla, count(*) FROM public.remisiones
  WHERE ticket_id IS NOT NULL AND ticket_id NOT IN (SELECT id FROM desk.tickets)
UNION ALL SELECT 'avisos', count(*) FROM public.avisos
  WHERE ticket_id IS NOT NULL AND ticket_id NOT IN (SELECT id FROM desk.tickets)
UNION ALL SELECT 'ticket_reads', count(*) FROM public.ticket_reads
  WHERE ticket_id NOT IN (SELECT id FROM desk.tickets)
UNION ALL SELECT 'resolution_attachments', count(*) FROM public.resolution_attachments
  WHERE ticket_id NOT IN (SELECT id FROM desk.tickets)
UNION ALL SELECT 'attachments', count(*) FROM desk.attachments
  WHERE ticket_id NOT IN (SELECT id FROM desk.tickets)
UNION ALL SELECT 'conversations', count(*) FROM desk.conversations
  WHERE ticket_id NOT IN (SELECT id FROM desk.tickets)
UNION ALL SELECT 'ticket_transitions', count(*) FROM desk.ticket_transitions
  WHERE ticket_id NOT IN (SELECT id FROM desk.tickets)
UNION ALL SELECT 'ticket_history', count(*) FROM desk.ticket_history
  WHERE ticket_id NOT IN (SELECT id FROM desk.tickets)
UNION ALL SELECT 'remision_fotos', count(*) FROM public.remision_fotos
  WHERE remision_id NOT IN (SELECT id FROM public.remisiones);
```

⚠️ Los `IS NOT NULL` de `remisiones` y `avisos` no son adorno: en las dos, `ticket_id` **puede ser NULL
legítimamente** —las remisiones históricas importadas de la hoja de Google no calzan con ningún ticket—
y sin ese filtro contarías esas filas como huérfanas.

Si alguna cuenta sale distinta de 0, hay basura de un borrado anterior: mírala antes de limpiarla, porque
puede no ser de estos tickets.

---

## Lo que arreglaría esto de raíz

`POST /api/admin/borrar-ticket` con `dryRun`, que haga el barrido en una transacción y **devuelva los
enlaces de Drive antes de borrar la fila**. Pedido y no construido (`debt.md:444`). A la tercera vez que
haga falta este runbook, probablemente salga más barato construirlo.
