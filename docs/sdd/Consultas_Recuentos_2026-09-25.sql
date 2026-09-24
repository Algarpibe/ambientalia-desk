-- =====================================================================================================
-- Recuentos contra producción · viernes 25/09/2026 · los ejecuta Alfonso
-- Origen: decision/p64b-quien-ejecuta y decision/p64-historico-c1
--         (openspec/config.yaml → decisiones_de_gerencia).
--
-- CÓMO: consola de PostgreSQL de producción, base `desk`. Cada consulta va envuelta en
-- BEGIN TRANSACTION READ ONLY … ROLLBACK: sólo lee y no puede escribir aunque se equivoque.
-- Se ejecutan una a una. Las cifras de la fila de resumen se pegan en el panel.
--
-- Plazos (p64b): A el 25/09 (la tanda de Anulado empieza el 28/09) · B antes del 09/10 · C antes del 02/10.
-- =====================================================================================================


-- -----------------------------------------------------------------------------------------------------
-- A · Rechazo → Finalizado
-- Qué cuenta: los tickets que HOY están en «Finalizado» y en algún momento pasaron por la transición
--   «Rechazo» (la huella del apaño que sustituirá el estado Anulado, decision/c2-anulado). Se mira
--   lo hecho desde Desk (desk.ticket_transitions) y lo heredado de Zoho (desk.ticket_history).
-- Salida: 1 fila con 4 números → total | solo_desk | solo_zoho | en_ambos. Al panel: `total`.
-- Notas: «Rechazo» es el nombre de tres transiciones, no un estado (packages/shared/src/transitions.ts,
--   ids rechazo_comercial, rechazo_cliente y rechazo_revision). «Rechazo de garantía» NO cuenta.
--   Hipótesis: que en Zoho la transición también se llame exactamente «Rechazo».
-- -----------------------------------------------------------------------------------------------------
BEGIN TRANSACTION READ ONLY;

WITH rech_desk AS (
  SELECT DISTINCT tt.ticket_id
  FROM desk.ticket_transitions tt
  WHERE tt.transition_id IN ('rechazo_comercial', 'rechazo_cliente', 'rechazo_revision')
), rech_zoho AS (
  SELECT DISTINCT h.ticket_id
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
)
SELECT
  COUNT(*)                                                                    AS total,
  COUNT(*) FILTER (WHERE d.ticket_id IS NOT NULL AND z.ticket_id IS NULL)     AS solo_desk,
  COUNT(*) FILTER (WHERE d.ticket_id IS NULL AND z.ticket_id IS NOT NULL)     AS solo_zoho,
  COUNT(*) FILTER (WHERE d.ticket_id IS NOT NULL AND z.ticket_id IS NOT NULL) AS en_ambos
FROM desk.tickets t
LEFT JOIN rech_desk d ON d.ticket_id = t.id
LEFT JOIN rech_zoho z ON z.ticket_id = t.id
WHERE t.status = 'Finalizado'
  AND (d.ticket_id IS NOT NULL OR z.ticket_id IS NOT NULL);

ROLLBACK;


-- -----------------------------------------------------------------------------------------------------
-- B · Catálogo de modelos: cuántos hay y cuántos tienen artículos y mano de obra cargados
-- Qué cuenta: los modelos del catálogo (Gerencia dijo 29 el 17/09; la siembra dejó 35) y, de los
--   activos, cuántos tienen artículos (accesorios, consumibles y repuestos) y cuántos mano de obra,
--   sumando los cargados a mano y los que se derivan por categoría de Zoho Books.
-- Salida: 1 fila → modelos_total | modelos_activos | activos_con_articulos | activos_con_mano_obra |
--   activos_con_ambos. Al panel: las cinco, más `modelos_con_inspeccion = 0`.
-- «CON INSPECCIÓN» = modelo con catálogo de inspección cargado en la base (definición del usuario,
--   24/09/2026). Hoy vale 0 y no hace falta consultarlo: la base no tiene ninguna tabla de inspección
--   (el árbol está diseñado en docs/inspecciones/, sin cargar). No bloquea nada, porque 1D pasó a 2027.
--   Al panel: `modelos_con_inspeccion = 0`. La columna `revisar` del catálogo marca un conflicto de
--   tipo, NO una inspección.
-- -----------------------------------------------------------------------------------------------------
BEGIN TRANSACTION READ ONLY;

WITH m AS (
  SELECT mo.id, mo.activo
  FROM public.catalogo_modelos mo
), manual AS (
  SELECT modelo_id, clase, COUNT(*) AS n
  FROM public.catalogo_articulos
  WHERE activo = true
  GROUP BY modelo_id, clase
), derivado AS (
  SELECT c.modelo_id, c.clase, COUNT(DISTINCT i.item_id) AS n
  FROM public.catalogo_modelo_categorias c
  JOIN books.items i ON i.category_name = c.categoria AND COALESCE(i.status, 'active') = 'active'
  WHERE NOT EXISTS (SELECT 1 FROM public.catalogo_articulos_ocultos o
                    WHERE o.modelo_id = c.modelo_id AND o.item_id = i.item_id)
  GROUP BY c.modelo_id, c.clase
), por_modelo AS (
  SELECT m.id, m.activo,
    COALESCE((SELECT SUM(n) FROM manual   x WHERE x.modelo_id = m.id AND x.clase <> 'mano_obra'), 0)
  + COALESCE((SELECT SUM(n) FROM derivado x WHERE x.modelo_id = m.id AND x.clase <> 'mano_obra'), 0) AS n_articulos,
    COALESCE((SELECT SUM(n) FROM manual   x WHERE x.modelo_id = m.id AND x.clase = 'mano_obra'), 0)
  + COALESCE((SELECT SUM(n) FROM derivado x WHERE x.modelo_id = m.id AND x.clase = 'mano_obra'), 0) AS n_mano_obra
  FROM m
)
SELECT
  COUNT(*)                                                           AS modelos_total,
  COUNT(*) FILTER (WHERE activo)                                     AS modelos_activos,
  COUNT(*) FILTER (WHERE activo AND n_articulos > 0)                 AS activos_con_articulos,
  COUNT(*) FILTER (WHERE activo AND n_mano_obra > 0)                 AS activos_con_mano_obra,
  COUNT(*) FILTER (WHERE activo AND n_articulos > 0 AND n_mano_obra > 0) AS activos_con_ambos
FROM por_modelo;

ROLLBACK;


-- -----------------------------------------------------------------------------------------------------
-- C · Liberaciones sin factura anteriores al arreglo de C1, y cuáles siguen sin facturar
-- Qué cuenta: las transiciones «Liberación sin factura» registradas en Desk ANTES del arreglo de C1
--   (commit ec0ed1f, 09/09/2026 13:22 -05:00, que obligó a marcar la casilla), y de ellas cuántas siguen
--   sin facturar: ni transición «Facturado» posterior ni fecha de factura en el ticket (p64-historico-c1:
--   se MARCAN, no se corrigen; las que siguen sin facturar las regulariza el Director Comercial).
-- Salida: 1 fila → liberaciones_pre_c1 | siguen_sin_facturar | facturadas_despues | casilla_sin_marcar.
--   Al panel: las cuatro.
-- Hipótesis: el corte es la hora del commit; si el despliegue en producción fue más tarde, cambiar la
--   fecha de la línea marcada. «Sin facturar» se aproxima sin mirar las facturas de Zoho Books, que no
--   están en la base `desk` (viven en `zoho-hub`).
-- -----------------------------------------------------------------------------------------------------
BEGIN TRANSACTION READ ONLY;

WITH lib AS (
  SELECT tt.id AS fila, tt.ticket_id, tt.performed_at,
         tt."values" ->> 'Liberación del ticket sin facturar' AS casilla_guardada
  FROM desk.ticket_transitions tt
  WHERE tt.transition_id = 'liberacion_sin_factura'
    AND tt.performed_at < TIMESTAMPTZ '2026-09-09 13:22:13-05'   -- ← corte del arreglo de C1
), estado AS (
  SELECT lib.*, t.fecha_factura,
         EXISTS (SELECT 1 FROM desk.ticket_transitions f
                 WHERE f.ticket_id = lib.ticket_id
                   AND f.transition_id IN ('facturado', 'facturado_cierre')
                   AND f.performed_at > lib.performed_at) AS facturada_despues
  FROM lib
  JOIN desk.tickets t ON t.id = lib.ticket_id
)
SELECT
  COUNT(*)                                                                         AS liberaciones_pre_c1,
  COUNT(*) FILTER (WHERE NOT facturada_despues AND fecha_factura IS NULL)          AS siguen_sin_facturar,
  COUNT(*) FILTER (WHERE facturada_despues OR fecha_factura IS NOT NULL)           AS facturadas_despues,
  COUNT(*) FILTER (WHERE casilla_guardada IS DISTINCT FROM 'true')                 AS casilla_sin_marcar
FROM estado;

ROLLBACK;
