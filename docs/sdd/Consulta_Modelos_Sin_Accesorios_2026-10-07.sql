-- =====================================================================================================
-- Modelos sin ningún accesorio activo · consulta de sólo lectura · cambio `accesorios-lista-por-modelo` (F1B-04)
-- Origen: decision/e232-accesorios-lista-por-modelo (openspec/config.yaml → decisiones_de_gerencia_adenda):
--   «Contar antes del corte los modelos sin categoría de accesorios».
--
-- QUIÉN LA CORRE: una persona, con acceso a la base de producción, ANTES DEL CORTE (tarea de persona P-1
--   del cambio). NINGUNA sesión de construcción la ejecuta y la suite de pruebas tampoco: no corre contra
--   PostgreSQL de producción. HIPÓTESIS: que PostgreSQL de producción la acepte tal cual (no se ha probado).
--
-- CÓMO: consola de PostgreSQL de producción, base `desk`. Cada consulta va envuelta en
--   BEGIN TRANSACTION READ ONLY … ROLLBACK: sólo lee y no puede escribir aunque se equivoque. Se
--   ejecutan una a una. Todas las tablas van con su esquema: `public` (catálogo), `books` (réplica de
--   artículos de Zoho Books) y `desk` (equipos).
--
-- QUÉ CUENTA (consulta 1): los modelos ACTIVOS del catálogo que NO tienen ningún accesorio activo en su
--   lista. La lista de un modelo es la que arma `listarArticulosDeModelo`
--   (apps/desk/server/db/catalogoArticulos.ts:302-356), y esta consulta replica su criterio, restringido
--   a la clase `accesorio`: un modelo TIENE accesorios si cumple una de estas dos:
--   · un accesorio MANUAL ACTIVO: una fila de public.catalogo_articulos con clase = 'accesorio' y
--     activo = true (apps/desk/server/db/catalogoArticulos.ts:348-356); o
--   · un accesorio DERIVADO NO OCULTO: un artículo activo de Books (COALESCE(status,'active') = 'active')
--     cuya categoría esté asignada al modelo con clase = 'accesorio' en public.catalogo_modelo_categorias
--     (apps/desk/server/db/catalogoArticulos.ts:307-314), y que no tenga lápida en
--     public.catalogo_articulos_ocultos (apps/desk/server/db/catalogoArticulos.ts:316-317).
--   La clase `accesorio` se filtra en SQL porque la lista del modelo mezcla clases y el formulario de
--   remisión sólo toma los accesorios (apps/desk/server/db/checklistRemision.ts:40). El deduplicado por
--   clase y SKU de la lista no cambia si hay o no al menos uno, así que no se replica. S-7 del cambio:
--   «modelos sin categoría de accesorios» se lee como «sin ningún accesorio activo».
-- Tablas y columnas, contrastadas con packages/zoho-sync/src/db/schema.sql:
--   public.catalogo_modelos (id, marca_id, nombre, tipo_id, activo) :339-347 · public.catalogo_marcas
--   (id, nombre) :330-335 · public.catalogo_tipos (id, nombre) :323-328 · public.catalogo_articulos
--   (modelo_id, clase, item_id, activo) :392-402 · public.catalogo_modelo_categorias (modelo_id, clase,
--   categoria) :410-416 · public.catalogo_articulos_ocultos (modelo_id, item_id) :423-427 · books.items
--   (item_id, name, category_name, status, sku) :380-384 · desk.equipos.modelo_id :354 (en producción
--   `equipos` vive en el esquema `desk`).
-- Salida: una fila por modelo activo sin accesorio activo, con los que más equipos tienen arriba:
--   marca | modelo | tipo | equipos | modelos_sin_accesorios | modelos_activos.
--   Al panel: `modelos_sin_accesorios` de `modelos_activos`. La lista de modelos vacíos se lleva al
--   Director Técnico (tarea de persona P-2): la completa en Configuración, «Accesorios por modelo».
--   Con cero filas la consulta no devuelve nada: significa que todos los modelos activos tienen lista.
-- =====================================================================================================
BEGIN TRANSACTION READ ONLY;

WITH con_manual AS (
  SELECT DISTINCT a.modelo_id
  FROM public.catalogo_articulos a
  WHERE a.clase = 'accesorio' AND a.activo = true
), con_derivado AS (
  SELECT DISTINCT c.modelo_id
  FROM public.catalogo_modelo_categorias c
  JOIN books.items i ON i.category_name = c.categoria AND COALESCE(i.status, 'active') = 'active'
  WHERE c.clase = 'accesorio'
    AND NOT EXISTS (SELECT 1 FROM public.catalogo_articulos_ocultos o
                    WHERE o.modelo_id = c.modelo_id AND o.item_id = i.item_id)
), equipos_por_modelo AS (
  SELECT e.modelo_id, COUNT(*) AS equipos
  FROM desk.equipos e
  WHERE e.modelo_id IS NOT NULL
  GROUP BY e.modelo_id
)
SELECT ma.nombre AS marca, mo.nombre AS modelo, ti.nombre AS tipo,
       COALESCE(ep.equipos, 0) AS equipos,
       COUNT(*) OVER () AS modelos_sin_accesorios,
       (SELECT COUNT(*) FROM public.catalogo_modelos WHERE activo = true) AS modelos_activos
FROM public.catalogo_modelos mo
JOIN public.catalogo_marcas ma ON ma.id = mo.marca_id
LEFT JOIN public.catalogo_tipos ti ON ti.id = mo.tipo_id
LEFT JOIN equipos_por_modelo ep ON ep.modelo_id = mo.id
WHERE mo.activo = true
  AND NOT EXISTS (SELECT 1 FROM con_manual x WHERE x.modelo_id = mo.id)
  AND NOT EXISTS (SELECT 1 FROM con_derivado x WHERE x.modelo_id = mo.id)
ORDER BY equipos DESC, ma.nombre, mo.nombre;

ROLLBACK;


-- -----------------------------------------------------------------------------------------------------
-- Accesorios de catálogo sin artículo de Books (los de legado)
-- Qué cuenta: las filas de public.catalogo_articulos de clase `accesorio` con item_id IS NULL, es decir,
--   accesorios escritos a mano («Manuales», «Pletinas»). Desde este cambio ya no se pueden crear otros
--   (S-4); los que existen se conservan y siguen en la lista del modelo y en el formulario, sin SKU. Esta
--   consulta dice cuántos son y de qué modelos, para que quien decida pueda darlos de alta en Books.
-- Salida: una fila por accesorio de legado → marca | modelo | accesorio | activo, ordenada por marca y
--   modelo. Al panel: el número de filas.
-- Misma salvedad: es hipótesis que PostgreSQL de producción la acepte tal cual; ninguna sesión la ejecuta.
-- -----------------------------------------------------------------------------------------------------
BEGIN TRANSACTION READ ONLY;

SELECT ma.nombre AS marca, mo.nombre AS modelo, a.nombre AS accesorio, a.activo
FROM public.catalogo_articulos a
JOIN public.catalogo_modelos mo ON mo.id = a.modelo_id
JOIN public.catalogo_marcas ma ON ma.id = mo.marca_id
WHERE a.clase = 'accesorio' AND a.item_id IS NULL
ORDER BY ma.nombre, mo.nombre, a.nombre;

ROLLBACK;
