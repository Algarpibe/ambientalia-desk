-- =====================================================================================================
-- Candidatos a «Anulado» en el histórico · los ejecuta Alfonso con Servicio Técnico
-- Origen: decision/c2-anulado, consecuencia (3) (openspec/config.yaml → decisiones_de_gerencia);
--         anulado-con-motivo (F1C-01), RQ-TC-72. Molde: docs/sdd/Consultas_Recuentos_2026-09-25.sql, bloque A.
--
-- CÓMO: consola de PostgreSQL de producción, base `desk`. La consulta va envuelta en
-- BEGIN TRANSACTION READ ONLY … ROLLBACK: sólo lee y no puede escribir aunque se equivoque.
-- NO marca nada ni cambia ningún ticket: marcar los abandonados es decisión de personas (se marca, no se reescribe).
--
-- Qué lista: los tickets que HOY están en «Finalizado» y en algún momento pasaron por la transición «Rechazo»
--   (la huella del apaño que sustituye el estado Anulado). Una fila por ticket, del más reciente al más antiguo.
-- Salida: numero | fecha_rechazo | fecha_finalizado | origen
--   numero           el número del ticket, con el «#» que ve el usuario.
--   fecha_rechazo    el primer Rechazo conocido (lo hecho en Desk o lo heredado de Zoho, el más antiguo de los dos).
--   fecha_finalizado cuándo llegó a «Finalizado»: el último paso hecho en Desk, o si no hay, el closed_time del ticket.
--   origen           'app' (sólo hay rastro en Desk), 'zoho' (sólo en el historial de Zoho) o 'ambos'.
-- Notas: «Rechazo» es el nombre de tres transiciones, no un estado (packages/shared/src/transitions.ts,
--   ids rechazo_comercial, rechazo_cliente y rechazo_revision). «Rechazo de garantía» NO cuenta.
--   Hipótesis: que en Zoho la transición también se llame exactamente «Rechazo».
-- Qué hacer con el resultado: Servicio Técnico confirma cuáles se abandonaron de verdad; el resto sí se entregó.
-- =====================================================================================================

BEGIN TRANSACTION READ ONLY;

WITH rech_desk AS (
  SELECT tt.ticket_id, MIN(tt.performed_at) AS fecha
  FROM desk.ticket_transitions tt
  WHERE tt.transition_id IN ('rechazo_comercial', 'rechazo_cliente', 'rechazo_revision')
  GROUP BY tt.ticket_id
), rech_zoho AS (
  SELECT h.ticket_id, MIN(h.event_time) AS fecha
  FROM desk.ticket_history h
  CROSS JOIN LATERAL (
    SELECT e FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof(h.raw -> 'actorInfo') = 'array' THEN h.raw -> 'actorInfo' ELSE '[]'::jsonb END) e
    UNION ALL
    SELECT e FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof(h.raw -> 'eventInfo') = 'array' THEN h.raw -> 'eventInfo' ELSE '[]'::jsonb END) e
  ) p
  WHERE p.e ->> 'propertyName' = 'Transition'
    AND trim(p.e -> 'propertyValue' ->> 'name') = 'Rechazo'
  GROUP BY h.ticket_id
), llegada AS (
  SELECT tt.ticket_id, MAX(tt.performed_at) AS fecha
  FROM desk.ticket_transitions tt
  WHERE tt.to_status = 'Finalizado'
  GROUP BY tt.ticket_id
)
SELECT
  '#' || t.number                                                   AS numero,
  LEAST(d.fecha, z.fecha)                                           AS fecha_rechazo,
  COALESCE(l.fecha, t.closed_time)                                  AS fecha_finalizado,
  CASE WHEN d.ticket_id IS NOT NULL AND z.ticket_id IS NOT NULL THEN 'ambos'
       WHEN d.ticket_id IS NOT NULL THEN 'app'
       ELSE 'zoho' END                                              AS origen
FROM desk.tickets t
LEFT JOIN rech_desk d ON d.ticket_id = t.id
LEFT JOIN rech_zoho z ON z.ticket_id = t.id
LEFT JOIN llegada l ON l.ticket_id = t.id
WHERE t.status = 'Finalizado'
  AND (d.ticket_id IS NOT NULL OR z.ticket_id IS NOT NULL)
ORDER BY fecha_finalizado DESC NULLS LAST, numero;

ROLLBACK;
