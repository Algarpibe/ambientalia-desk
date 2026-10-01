-- =====================================================================================================
-- Siembra del compuesto de los equipos y de los gases patron · F1A-03 (verificacion-gas-patron-certificado)
-- Lo ejecuta Alfonso en produccion. NO SE HA EJECUTADO: el repositorio no tiene acceso a la base (sin psql
-- local). Esta revisado por lectura, y todas las sentencias van calificadas por esquema porque en psql el
-- search_path NO es el de la aplicacion (desk.equipos, desk.tickets, public.catalogo_modelos, public.gases_patron).
--
-- Origen: decision/f1a03-familia-y-gas-patron (openspec/config.yaml, respuesta de Gerencia del 28/09/2026):
--   APSA-370 SO2, APNA-370 NOx, APMA-370 CO, APOA-370 O3; los convertidores, el compuesto que convierten;
--   los equipos existentes se rellenan con el valor de su modelo; a mano, solo las excepciones del lote AP-370
--   de 2024 (tickets #601 a #622 y #653 a #654: 24). Los compuestos van en su forma canonica de
--   packages/shared/src/gasPatron.ts (SO₂, NOₓ, CO, O₃, H₂S, TRS, NH₃).
--
-- LO QUE EL REPOSITORIO NO TIENE Y NO SE INVENTA (marcado [P.1], comentado, a entregar por el Director Tecnico):
--   · el compuesto de cada modelo convertidor (bloque A);
--   · el compuesto de cada serial del lote AP-370 de 2024 (bloque C);
--   · la lista de cilindros vigentes: cilindro, compuesto, vencimiento y disponibilidad (bloque D).
--
-- ORDEN (nota del paquete de despliegue):
--   1) los pasos 2 y 3 (recuentos), ANTES de desplegar: no leen ninguna columna nueva;
--   2) desplegar (migrate crea las dos columnas y las dos tablas al arrancar);
--   3) pasos 1 y 4: comprobaciones y bloques A, B y C (con los datos [P.1]); despues el bloque D;
--   4) la verificacion en la app (P.4).
-- Sin los datos [P.1] solo corren A (los cuatro AP-370) y B. Es idempotente: A y B filtran por IS NULL, D por
-- ON CONFLICT, y C fija valores.
--
-- CÓMO: consola de PostgreSQL de produccion, base `desk`.
-- =====================================================================================================

-- 1 · Comprobaciones previas (DESPUES de desplegar). Deben salir: la tabla, las dos columnas y CUATRO modelos.
SELECT to_regclass('public.gases_patron') AS tabla_gases;
SELECT table_schema, table_name, column_name FROM information_schema.columns
 WHERE column_name = 'compuesto' AND ((table_schema = 'desk' AND table_name = 'equipos') OR (table_schema = 'public' AND table_name = 'catalogo_modelos'));
SELECT id, marca_id, nombre FROM public.catalogo_modelos WHERE nombre IN ('APSA-370', 'APNA-370', 'APMA-370', 'APOA-370') ORDER BY nombre;
-- Si no salen las dos columnas, la tabla y CUATRO modelos: NO SIGAS (el paso 4 lo vuelve a exigir y aborta).

-- 2 · Recuento para el paquete (P.3), ANTES de desplegar: tickets hoy en «Verificación».
SELECT count(*) AS tickets_en_verificacion FROM desk.tickets WHERE status = 'Verificación';

-- 3 · Recuento para el paquete (P.3), ANTES de desplegar: tickets «Equipo nuevo» en «En Proceso» cuyo equipo es de
--     uno de los cuatro modelos. Son los que, con compuesto y gas vigente, dejaran de poder liberarse desde «En Proceso».
SELECT count(*) AS en_proceso_de_los_cuatro_modelos
  FROM desk.tickets t
  JOIN desk.equipos e ON e.id = t.equipo_id
  JOIN public.catalogo_modelos m ON m.id = e.modelo_id
 WHERE t.classification = 'Equipo nuevo' AND t.status = 'En Proceso'
   AND m.nombre IN ('APSA-370', 'APNA-370', 'APMA-370', 'APOA-370');

-- 4 · Siembra, en una sola transaccion: o entra todo o no entra nada.
BEGIN;

-- 4.0 · Si no hay exactamente cuatro modelos, la excepcion aborta la transaccion y no se escribe nada.
DO $$
BEGIN
  IF (SELECT count(*) FROM public.catalogo_modelos WHERE nombre IN ('APSA-370', 'APNA-370', 'APMA-370', 'APOA-370')) <> 4 THEN
    RAISE EXCEPTION 'No hay exactamente cuatro modelos APSA/APNA/APMA/APOA-370 en public.catalogo_modelos: no se siembra nada';
  END IF;
END $$;

-- 4.A · Compuesto por modelo (solo donde esta vacio: no pisa una correccion hecha en la app).
UPDATE public.catalogo_modelos m SET compuesto = v.compuesto
  FROM (VALUES ('APSA-370', 'SO₂'), ('APNA-370', 'NOₓ'), ('APMA-370', 'CO'), ('APOA-370', 'O₃')) AS v(nombre, compuesto)
 WHERE m.nombre = v.nombre AND m.compuesto IS NULL;

-- 4.A.convertidores · [P.1] el compuesto de cada convertidor lo entrega el Director Tecnico. Sin valores inventados.
-- UPDATE public.catalogo_modelos m SET compuesto = v.compuesto
--   FROM (VALUES ('<nombre del modelo convertidor>', '<SO₂|NOₓ|CO|O₃|H₂S|TRS|NH₃>')) AS v(nombre, compuesto)
--  WHERE m.nombre = v.nombre AND m.compuesto IS NULL;

-- 4.B · Herencia a los equipos que ya existen, por su modelo (solo los que aun no tienen compuesto).
UPDATE desk.equipos e SET compuesto = m.compuesto, updated_at = now()
  FROM public.catalogo_modelos m
 WHERE e.modelo_id = m.id AND m.compuesto IS NOT NULL AND e.compuesto IS NULL;

-- 4.C · Excepciones del lote AP-370 de 2024 (tickets #601 a #622 y #653 a #654: 24). Va DESPUES de B porque corrige
--       lo heredado. Primero se LISTAN, con el compuesto que heredaron:
SELECT t.number AS ticket, e.serial, e.compuesto AS compuesto_heredado
  FROM desk.tickets t
  JOIN desk.equipos e ON e.id = t.equipo_id
 WHERE t.number BETWEEN 601 AND 622 OR t.number IN (653, 654)
 ORDER BY t.number;
-- [P.1] Serial → compuesto (H₂S, TRS o NH₃) lo entrega el Director Tecnico. SIN `IS NULL`, a proposito: corrige un valor
-- ya heredado. Antes de descomentar, comprobar con el SELECT de arriba que cada serial sale una sola vez.
-- UPDATE desk.equipos e SET compuesto = v.compuesto, updated_at = now()
--   FROM (VALUES ('<serial>', '<H₂S|TRS|NH₃>')) AS v(serial, compuesto)
--  WHERE e.serial = v.serial;

-- 4.D · Gases patron vigentes. [P.1] la lista de cilindros la entrega el Director Tecnico (cilindro, compuesto, fecha
--       de vencimiento del certificado, disponibilidad). Sin valores inventados. Repetirlo no duplica (ON CONFLICT).
-- INSERT INTO public.gases_patron (cilindro, compuesto, disponible, vence, registrado_por) VALUES
--   ('<cilindro>', '<SO₂|NOₓ|CO|O₃|H₂S|TRS|NH₃>', true, DATE '<AAAA-MM-DD>', '<quien lo registra>')
-- ON CONFLICT (cilindro) DO NOTHING;

-- 4.E · Comprobacion dentro de la transaccion: recuento por compuesto, en modelos, en equipos y en gases.
SELECT 'modelos' AS donde, compuesto, count(*) AS n FROM public.catalogo_modelos GROUP BY compuesto ORDER BY compuesto;
SELECT 'equipos' AS donde, compuesto, count(*) AS n FROM desk.equipos GROUP BY compuesto ORDER BY compuesto;
SELECT 'gases' AS donde, compuesto, count(*) AS n FROM public.gases_patron GROUP BY compuesto ORDER BY compuesto;

-- 4.F · Si 4.E cuadra, escribir COMMIT; Si algo no cuadra, escribir ROLLBACK; en su lugar.
COMMIT;

-- Que cambia en la practica (nota del paquete): con compuestos y SIN gases cargados, todo equipo de familia sale de
-- «En Proceso» con motivo registrado («Sin gas patrón vigente de …») y con certificado obligatorio; SOLO con compuestos
-- y gases vigentes la guarda bloquea («debe pasar por Verificación»).
