-- =====================================================================================================
-- Migracion de los tickets de servicio en «Pendiente» a «En Proceso» · F1C-09 (tres-transiciones-cifra-anclada)
-- Lo ejecuta Alfonso en produccion. NO SE HA EJECUTADO: el repositorio no tiene acceso a la base (sin psql
-- local). Esta revisado por lectura y probado sobre pg-mem
-- (packages/zoho-sync/src/db/migracionPendienteF1C09.test.ts). Todas las sentencias van calificadas por
-- esquema porque en psql el search_path NO es el de la aplicacion (desk.tickets, desk.ticket_transitions).
--
-- Origen: E-103, E-106 y E-140 (openspec/config.yaml): F1C-09 retira `marcar_pendiente` y las dos
-- transiciones de servicio externo; «Pendiente» pasa a ser un estado SOLO de soporte remoto. Un ticket de
-- servicio que ya estuviera en «Pendiente» se quedaria sin salida, y por eso se traslada a «En Proceso».
--
-- QUE MUEVE: el GRUPO 1, es decir `status = 'Pendiente'`, `managed_by_app = true` y clasificacion distinta
-- de «soporte remoto» (los NULL cuentan como servicio). No toca `status_type` (ya es Open: el ticket llego a
-- Pendiente por la aplicacion) ni `managed_by_app`.
-- QUE NO MUEVE: el grupo 2 (servicio que gobierna Zoho: decision P-1 de Gerencia, pendiente) ni el grupo 3
-- (soporte remoto, que conserva «Pendiente»).
-- Hipotesis: soporte remoto se reconoce con lower(...) LIKE '%soporte%remoto%' (sin trim, replace ni
-- regexp_replace, que pg-mem no tiene); es mas tolerante que la regla de la aplicacion con espacios y
-- mayusculas, y el paso 1 lista las clasificaciones distintas de «Pendiente» para ver si alguna cae mal.
--
-- ORDEN:
--   1) el paso 1 (recuento, solo lectura), ANTES de desplegar;
--   2) desplegar;
--   3) el paso 2 (traslado) en el mismo corte, y el recuento posterior: el grupo 1 sale a 0.
-- Es idempotente: una segunda pasada no encuentra filas del grupo 1. Ninguna fila existente de
-- ticket_transitions se modifica; el INSERT de la traza va ANTES del UPDATE porque los dos filtran por
-- `status = 'Pendiente'`.
--
-- COMO: consola de PostgreSQL de produccion, base `desk`. Sin metacomandos de psql.
-- =====================================================================================================

-- 1 · ANTES de desplegar, solo lectura: tres grupos y, aparte, el numero de los tickets que gobierna Zoho.
SELECT grupo, count(*) AS tickets FROM (
  SELECT CASE WHEN lower(coalesce(classification, '')) LIKE '%soporte%remoto%' THEN '3 soporte remoto: no se toca'
              WHEN managed_by_app = true THEN '1 servicio, gobierna la app: se mueve'
              ELSE '2 servicio, gobierna Zoho: no se mueve (P-1)' END AS grupo
    FROM desk.tickets WHERE status = 'Pendiente') AS g
 GROUP BY grupo ORDER BY grupo;
SELECT number FROM desk.tickets WHERE status = 'Pendiente' AND managed_by_app = false
   AND lower(coalesce(classification, '')) NOT LIKE '%soporte%remoto%' ORDER BY number;
SELECT classification, count(*) AS tickets FROM desk.tickets WHERE status = 'Pendiente'
 GROUP BY classification ORDER BY classification;

-- 2 · TRAS desplegar: traza y traslado en una sola transaccion.
BEGIN;
INSERT INTO desk.ticket_transitions (ticket_id, transition_id, transition_name, from_status, to_status, area, performed_by, "values", comment_id)
SELECT id, 'migracion_f1c09_pendiente', 'Traslado de Pendiente a En Proceso (F1C-09)', 'Pendiente', 'En Proceso',
       'Servicio Técnico', 'Migración F1C-09', '{"decision":"E-140"}'::jsonb, NULL
  FROM desk.tickets
 WHERE status = 'Pendiente' AND managed_by_app = true AND lower(coalesce(classification, '')) NOT LIKE '%soporte%remoto%';
UPDATE desk.tickets SET status = 'En Proceso', modified_time = now(), updated_at = now()
 WHERE status = 'Pendiente' AND managed_by_app = true AND lower(coalesce(classification, '')) NOT LIKE '%soporte%remoto%';
COMMIT;

-- 3 · Recuento posterior: el grupo 1 sale a 0 (repetir el primer SELECT del paso 1).

-- REVERSION (comentada, prefijo «-- REV »; quitar el prefijo para ejecutarla): devuelve a Pendiente los
-- tickets cuya fila marcador sigue siendo su ultima transicion y borra las filas marcador, en una transaccion.
-- REV BEGIN;
-- REV UPDATE desk.tickets SET status = 'Pendiente', modified_time = now(), updated_at = now()
-- REV  WHERE status = 'En Proceso' AND id IN (
-- REV    SELECT ticket_id FROM desk.ticket_transitions WHERE transition_id = 'migracion_f1c09_pendiente'
-- REV       AND id IN (SELECT max(id) FROM desk.ticket_transitions GROUP BY ticket_id));
-- REV DELETE FROM desk.ticket_transitions WHERE transition_id = 'migracion_f1c09_pendiente';
-- REV COMMIT;
