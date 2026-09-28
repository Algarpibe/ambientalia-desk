-- =====================================================================================================
-- Consulta_SubOV_formato_2026-09-27.sql
--
-- QUÉ ES
--   Barrido de SÓLO LECTURA de los números de orden de venta que NO cumplen el formato canónico de
--   la subOV de lote, antes de construir la cuarentena de F1B-11. Lo pide la fila de F1B-11 del plan
--   («antes, barrer si ya existe alguna subOV con formato `_1`»,
--   docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:165) y el pendiente de
--   docs/sdd/Decisiones_Gerencia_2026-09-10.md:498. Toda subOV con formato viejo entraría en
--   cuarentena el día uno.
--
-- FORMATO CANÓNICO (decision/subov-lote-convencion, docs/sdd/Decisiones_Gerencia_2026-09-10.md:437-442)
--   Lote (prefijo, no es documento)  OV-AAAA-NNN      p. ej. OV-2026-170
--   SubOV (documento real en Books)  OV-AAAA-NNN-SS   p. ej. OV-2026-170-01
--   Expresión que usará Desk: ^OV-(\d{4})-(\d{3,4})-(\d{2})$
--   Una OV normal, que no es de lote, tiene la forma OV-AAAA-NNN y NO se trata como defecto aquí.
--
-- DÓNDE VIVEN LOS NÚMEROS (base `desk`)
--   books.sales_orders.salesorder_number   réplica de Books (packages/zoho-sync/src/db/schema.sql:160-165)
--   desk.tickets.orden_venta               número guardado en el ticket (columna de TICKET_COLS,
--                                          packages/zoho-sync/src/db/repo.ts:48)
--   desk.tickets.salesorder_id             id de Books, cuando la OV se eligió en un buscador
--                                          (packages/zoho-sync/src/db/schema.sql:187)
--
-- RESPONSABLE: Alfonso. Tarea de persona (regla del ciclo 1): no la ejecuta ninguna tanda.
--
-- ES DE SÓLO LECTURA. Todo va dentro de BEGIN READ ONLY … ROLLBACK: PostgreSQL rechaza cualquier
-- escritura dentro de esa transacción, y el ROLLBACK final no deja nada abierto. Sólo hay SELECT.
--
-- CÓMO SE EJECUTA (psql contra la base `desk` de producción)
--   1. Conéctate con psql a la base `desk` como lo haces siempre. NO pegues la cadena de conexión ni
--      la contraseña en ningún chat, captura ni documento: un secreto que aparece ahí queda quemado.
--   2. Dentro de psql:
--        \o salida_subov_2026-09-27.txt
--        \i Consulta_SubOV_formato_2026-09-27.sql
--        \o
--   3. Revisa que el fichero de salida termine con ROLLBACK.
--
-- QUÉ HAY QUE DEVOLVER
--   El fichero salida_subov_2026-09-27.txt completo (lleva números de OV, estados, fechas y nombres de
--   cliente; ninguna credencial). Son cuatro bloques:
--     (1) recuento por fuente y clase de formato;
--     (2) detalle de las OV de Books con formato no reconocido;
--     (3) detalle de los tickets cuya orden de venta tiene formato no reconocido;
--     (4) números base de lote que existen además como OV propia en Books (el choque que
--         docs/sdd/Decisiones_Gerencia_2026-09-10.md:463-465 anticipa).
--   Si un bloque sale vacío, también es un resultado: dilo así.
-- =====================================================================================================

BEGIN READ ONLY;

-- (1) Recuento por fuente y clase de formato -----------------------------------------------------
WITH numeros AS (
  SELECT 'books.sales_orders'::text AS fuente, trim(salesorder_number) AS numero
    FROM books.sales_orders
   WHERE COALESCE(trim(salesorder_number), '') <> ''
  UNION ALL
  SELECT 'desk.tickets'::text, trim(orden_venta)
    FROM desk.tickets
   WHERE COALESCE(trim(orden_venta), '') <> ''
),
clasificados AS (
  SELECT fuente, numero,
         CASE
           WHEN numero ~ '^OV-[0-9]{4}-[0-9]{3,4}-[0-9]{2}$' THEN '1_subov_canonica'
           WHEN numero ~ '^OV-[0-9]{4}-[0-9]{3,4}$'          THEN '2_ov_simple'
           WHEN numero ~ '_[0-9]+$'                          THEN '3_sufijo_guion_bajo'
           ELSE                                                   '4_otro_formato'
         END AS clase
    FROM numeros
)
SELECT fuente, clase, count(*) AS total
  FROM clasificados
 GROUP BY fuente, clase
 ORDER BY fuente, clase;

-- (2) OV de Books con formato no reconocido -------------------------------------------------------
SELECT so.salesorder_number,
       CASE WHEN trim(so.salesorder_number) ~ '_[0-9]+$' THEN 'sufijo_guion_bajo' ELSE 'otro_formato' END AS clase,
       so.status,
       so.date,
       so.customer_name,
       so.salesorder_id
  FROM books.sales_orders so
 WHERE COALESCE(trim(so.salesorder_number), '') <> ''
   AND trim(so.salesorder_number) !~ '^OV-[0-9]{4}-[0-9]{3,4}(-[0-9]{2})?$'
 ORDER BY so.date DESC NULLS LAST, so.salesorder_number;

-- (3) Tickets cuya orden de venta tiene formato no reconocido -------------------------------------
SELECT t.number             AS ticket,
       t.orden_venta,
       CASE WHEN trim(t.orden_venta) ~ '_[0-9]+$' THEN 'sufijo_guion_bajo' ELSE 'otro_formato' END AS clase,
       t.status,
       t.managed_by_app,
       t.salesorder_id,
       so.salesorder_number AS numero_en_books_por_id
  FROM desk.tickets t
  LEFT JOIN books.sales_orders so ON so.salesorder_id = t.salesorder_id
 WHERE COALESCE(trim(t.orden_venta), '') <> ''
   AND trim(t.orden_venta) !~ '^OV-[0-9]{4}-[0-9]{3,4}(-[0-9]{2})?$'
 ORDER BY t.number;

-- (4) Números base de lote emitidos también como OV propia en Books --------------------------------
SELECT base.salesorder_number AS numero_base,
       base.status             AS estado_base,
       base.date               AS fecha_base,
       count(sub.salesorder_id) AS subov_del_lote
  FROM books.sales_orders base
  JOIN books.sales_orders sub
    ON trim(sub.salesorder_number) ~ '^OV-[0-9]{4}-[0-9]{3,4}-[0-9]{2}$'
   AND left(trim(sub.salesorder_number), length(trim(sub.salesorder_number)) - 3) = trim(base.salesorder_number)
 WHERE trim(base.salesorder_number) ~ '^OV-[0-9]{4}-[0-9]{3,4}$'
 GROUP BY base.salesorder_number, base.status, base.date
 ORDER BY base.salesorder_number;

ROLLBACK;
