-- =====================================================================================================
-- Recuento contra producción · la ejecuta Alfonso
-- Origen: fila F1B-03 del plan («Antes de cambiar nada, contar los tickets que llegaron a `Ingresado`
--         sin remisión», docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:158 y :386) y
--         docs/sdd/Decisiones_Gerencia_2026-09-10.md:374-375. Es la tarea de persona que bloquea F1B-03.
--
-- CÓMO: consola de PostgreSQL de producción, base `desk`. Va envuelta en
-- BEGIN TRANSACTION READ ONLY … ROLLBACK: sólo lee y no puede escribir aunque se equivoque.
-- La cifra de la fila de resumen se pega en el panel.
-- =====================================================================================================


-- -----------------------------------------------------------------------------------------------------
-- D · Tickets que llegaron a «Ingresado» sin remisión de entrada vigente
-- Qué cuenta: los tickets que alguna vez pasaron por «Habilitar Servicio» (la única transición que lleva
--   a «Ingresado», packages/shared/src/transitions.ts:178) y, de ellos, cuántos NO tenían en ese momento
--   una remisión de entrada vigente (tipo 'entrada', no anulada) creada antes de llegar. Es el histórico
--   que la guarda nueva de F1B-03 no repara. Se mira lo hecho desde Desk (desk.ticket_transitions) y lo
--   heredado de Zoho (desk.ticket_history); la llegada es la PRIMERA vez que el ticket pasó por ahí.
-- Salida: 1 fila → llegaron | sin_remision_al_llegar | nunca_tuvieron_remision | remision_solo_anulada |
--   remision_creada_despues | desde_ticket_creado. Al panel: `sin_remision_al_llegar` y `llegaron`.
--   sin_remision_al_llegar = nunca_tuvieron_remision + remision_solo_anulada + remision_creada_despues.
--   desde_ticket_creado: de los que llegaron sin remisión, cuántos venían del origen «Ticket creado»
--   (sólo se sabe para los hechos desde Desk: from_status).
-- Hipótesis: que en Zoho la transición se llame exactamente «Habilitar Servicio», igual que en Desk.
--   Hipótesis: que una remisión anulada se trate como «sin remisión», porque la guarda exige remisión
--   vigente (R01.1.md:386); si se anuló DESPUÉS de llegar, aquí cuenta como sin remisión igualmente.
-- -----------------------------------------------------------------------------------------------------
BEGIN TRANSACTION READ ONLY;

WITH llegada_desk AS (
  SELECT tt.ticket_id, MIN(tt.performed_at) AS llego_at,
         bool_or(tt.from_status = 'Ticket creado') AS desde_ticket_creado
  FROM desk.ticket_transitions tt
  WHERE tt.transition_id = 'habilitar_servicio'
  GROUP BY tt.ticket_id
), llegada_zoho AS (
  SELECT h.ticket_id, MIN(h.event_time) AS llego_at
  FROM desk.ticket_history h
  CROSS JOIN LATERAL (
    SELECT e FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof(h.raw -> 'actorInfo') = 'array' THEN h.raw -> 'actorInfo' ELSE '[]'::jsonb END) e
    UNION ALL
    SELECT e FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof(h.raw -> 'eventInfo') = 'array' THEN h.raw -> 'eventInfo' ELSE '[]'::jsonb END) e
  ) p
  WHERE p.e ->> 'propertyName' = 'Transition'
    AND trim(p.e -> 'propertyValue' ->> 'name') = 'Habilitar Servicio'
  GROUP BY h.ticket_id
), llegada AS (
  SELECT COALESCE(d.ticket_id, z.ticket_id) AS ticket_id,
         LEAST(d.llego_at, z.llego_at)      AS llego_at,   -- LEAST ignora el NULL del lado que falte
         COALESCE(d.desde_ticket_creado, false) AS desde_ticket_creado
  FROM llegada_desk d
  FULL JOIN llegada_zoho z ON z.ticket_id = d.ticket_id
), clasif AS (
  SELECT l.*,
         EXISTS (SELECT 1 FROM public.remisiones r
                 WHERE r.ticket_id = l.ticket_id AND r.tipo = 'entrada')                 AS alguna,
         EXISTS (SELECT 1 FROM public.remisiones r
                 WHERE r.ticket_id = l.ticket_id AND r.tipo = 'entrada'
                   AND r.anulada_at IS NULL)                                             AS alguna_vigente,
         EXISTS (SELECT 1 FROM public.remisiones r
                 WHERE r.ticket_id = l.ticket_id AND r.tipo = 'entrada'
                   AND r.anulada_at IS NULL AND r.created_at <= l.llego_at)              AS vigente_al_llegar
  FROM llegada l
)
SELECT
  COUNT(*)                                                                  AS llegaron,
  COUNT(*) FILTER (WHERE NOT vigente_al_llegar)                             AS sin_remision_al_llegar,
  COUNT(*) FILTER (WHERE NOT alguna)                                        AS nunca_tuvieron_remision,
  COUNT(*) FILTER (WHERE alguna AND NOT alguna_vigente)                     AS remision_solo_anulada,
  COUNT(*) FILTER (WHERE alguna_vigente AND NOT vigente_al_llegar)          AS remision_creada_despues,
  COUNT(*) FILTER (WHERE NOT vigente_al_llegar AND desde_ticket_creado)     AS desde_ticket_creado
FROM clasif;

ROLLBACK;
