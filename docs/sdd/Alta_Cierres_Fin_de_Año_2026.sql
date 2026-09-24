-- =====================================================================================================
-- Alta de los cierres de la empresa de fin de año 2026 · lo ejecuta Alfonso en producción
-- Origen: decision/calendario-habil («los cierres de la empresa que registre Gerencia») y la respuesta
--         de Gerencia del 24/09/2026: del 30/12/2026 al 02/01/2027, ambos incluidos, días completos;
--         el 24/12 también cerrado. 2027 no se registra todavía.
--
-- ⚠️ ANTES DE EJECUTAR: la tabla public.calendario_cierres la crea el servidor al arrancar
--   (apps/desk/server/index.ts, migrate). Sólo existe en producción cuando se despliega una versión que
--   incluya la tanda F1B-12 (commit 66df3d8 o posterior). El paso 1 lo comprueba: si devuelve NULL,
--   NO sigas — hay que desplegar primero.
--
-- CÓMO: consola de PostgreSQL de producción, base `desk`. Es una sola transacción: o entran los cinco
--   días o no entra ninguno. Se puede repetir sin duplicar (ON CONFLICT DO NOTHING).
-- =====================================================================================================

-- 1 · Comprobación: debe devolver `calendario_cierres`, no NULL.
SELECT to_regclass('public.calendario_cierres') AS tabla;

-- 2 · Alta.
BEGIN;

INSERT INTO public.calendario_cierres (fecha, motivo, registrado_por) VALUES
  ('2026-12-24', 'Cierre de fin de año 2026 (Nochebuena)',                     'Alfonso'),
  ('2026-12-30', 'Cierre de fin de año 2026',                                   'Alfonso'),
  ('2026-12-31', 'Cierre de fin de año 2026',                                   'Alfonso'),
  ('2027-01-01', 'Cierre de fin de año 2026 (además festivo legal: Año Nuevo)', 'Alfonso'),
  ('2027-01-02', 'Cierre de fin de año 2026 (sábado: sin efecto en el cálculo)', 'Alfonso')
ON CONFLICT (fecha) DO NOTHING;

-- 3 · Comprobación dentro de la transacción: deben salir las cinco filas.
SELECT fecha, motivo, registrado_por FROM public.calendario_cierres
WHERE fecha BETWEEN DATE '2026-12-24' AND DATE '2027-01-02'
ORDER BY fecha;

-- 4 · Si el paso 3 muestra las cinco fechas, confirmar. Si algo no cuadra, escribir ROLLBACK; en su lugar.
COMMIT;

-- Qué cambia en la práctica: el 24/12 (jueves), el 30/12 (miércoles) y el 31/12 (jueves) dejan de contar
-- como días hábiles. El 25/12 y el 01/01 ya eran festivos legales, y el 02/01 es sábado: se registran
-- igual porque forman parte del rango que fijó Gerencia.
