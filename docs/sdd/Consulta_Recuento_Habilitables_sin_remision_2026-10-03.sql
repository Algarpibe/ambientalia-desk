-- =====================================================================================================
-- Recuento contra producción · la ejecuta una persona (Gerencia)
-- Origen: F1B-03, parte L (`tipo-servicio-ticket-sin-ov`), lote 2, tarea 2.9 · design.md §12. Es la segunda
--         consulta de la condición de PUBLICACIÓN de la guarda de «Habilitar Servicio» (RQ-TS-33).
--         La primera, `Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql`, mide llegadas HISTÓRICAS a
--         «Ingresado»; ésta mide los tickets que HOY esperan en un estado de origen y todavía no han
--         ejecutado la transición.
--
-- CÓMO: consola de PostgreSQL de producción, base `desk`. Va envuelta en
-- BEGIN TRANSACTION READ ONLY … ROLLBACK: sólo lee y no puede escribir aunque se equivoque.
-- Se pegan en el panel las filas de salida (son pocas).
-- =====================================================================================================


-- -----------------------------------------------------------------------------------------------------
-- Qué cuenta: los tickets que HOY están en `Ticket creado`, `OV asignada` o `Remisión creada` (los tres
--   orígenes de `habilitar_servicio`, packages/shared/src/transitions.ts:178), por estado, clasificación y
--   `managed_by_app`, repartidos con la definición de «vigente» a la letra:
--     · vigente = remisión de tipo 'entrada' y `anulada_at IS NULL`, SIN filtro de estado de envío; la misma
--       definición que la consulta del 25/09 (`Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql:58-65`)
--       y que la guarda (`esRemisionEntradaVigente`, packages/shared/src/remision.ts).
--     · confirmada = estado 'ok' u 'ok_con_avisos' (`esRemisionConfirmada`, sólo presentación).
-- Salida: una fila por (estado, clasificacion, managed_by_app) → tickets | sin_remision_vigente |
--   vigente_con_alguna_confirmada | vigente_sin_ninguna_confirmada.
--   · sin_remision_vigente: los que QUEDARÁN BLOQUEADOS al publicar (422; el botón sale desactivado).
--   · vigente_con_alguna_confirmada: se habilitan, sin aviso.
--   · vigente_sin_ninguna_confirmada: se habilitan, y verán el aviso «Remisión de entrada sin confirmar».
--   tickets = la suma de las tres. Al final, una fila de TOTAL (estado = '— total —').
-- Hipótesis: que un ticket que ya llegó a «Ingresado» no vuelve a un estado de origen, con lo que esta
--   población y la de la consulta del 25/09 no se solapan; esta consulta no depende de que sea cierto.
-- Lo habilitado desde Zoho no pasa por la aplicación y la guarda no lo ve: no se mide aquí.
-- -----------------------------------------------------------------------------------------------------
BEGIN TRANSACTION READ ONLY;

WITH origen AS (
  SELECT t.id, t.status, COALESCE(t.classification, '(sin clasificar)') AS clasificacion,
         t.managed_by_app
  FROM desk.tickets t
  WHERE t.status IN ('Ticket creado', 'OV asignada', 'Remisión creada')
), clasif AS (
  SELECT o.*,
         EXISTS (SELECT 1 FROM public.remisiones r
                 WHERE r.ticket_id = o.id AND r.tipo = 'entrada'
                   AND r.anulada_at IS NULL)                                             AS vigente,
         EXISTS (SELECT 1 FROM public.remisiones r
                 WHERE r.ticket_id = o.id AND r.tipo = 'entrada'
                   AND r.anulada_at IS NULL AND r.estado IN ('ok', 'ok_con_avisos'))     AS confirmada
  FROM origen o
)
SELECT status AS estado, clasificacion, managed_by_app,
       COUNT(*)                                          AS tickets,
       COUNT(*) FILTER (WHERE NOT vigente)               AS sin_remision_vigente,
       COUNT(*) FILTER (WHERE vigente AND confirmada)    AS vigente_con_alguna_confirmada,
       COUNT(*) FILTER (WHERE vigente AND NOT confirmada) AS vigente_sin_ninguna_confirmada
FROM clasif
GROUP BY ROLLUP ((status, clasificacion, managed_by_app))
ORDER BY (status IS NULL), status, clasificacion, managed_by_app;

ROLLBACK;
