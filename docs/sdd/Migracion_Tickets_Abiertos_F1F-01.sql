-- =====================================================================================================
-- Migracion de los tickets abiertos de Zoho Desk a la aplicacion · F1F-01 (migracion-tickets-abiertos)
-- Lo ejecuta una persona con acceso a produccion. NO SE HA EJECUTADO: el repositorio no tiene acceso a la base
-- (sin psql local). Este documento esta revisado por lectura y su reversion esta probada sobre pg-mem
-- (apps/desk/server/db/migracionTicketsF1F01.test.ts). Todas las sentencias van calificadas por esquema
-- porque en psql el search_path NO es el de la aplicacion (desk.tickets, desk.ticket_transitions).
--
-- QUE HACE LA MIGRACION: NO es este fichero. La hace el endpoint POST /api/admin/migrar-tickets-abiertos
-- (apps/desk/server/routes/admin.ts, ejecutor en apps/desk/server/db/migracionTicketsAbiertos.ts), que marca
-- cada ticket abierto de Zoho como gobernado por la aplicacion (managed_by_app = true) y, en dos reglas, le
-- cambia el estado: «Entregado» pasa a «Finalizado» (status_type «Closed») y «Pendiente» de servicio pasa a
-- «En Proceso» (status_type «Open»). Por cada ticket deja una fila marcador en desk.ticket_transitions con
-- transition_id = 'migracion_f1f01_abiertos' y, en "values", lo que habia antes: estado_previo,
-- status_type_previo y managed_by_app_previo (mas estado_destino, regla, corte y ejecutado_por).
-- ESTE fichero trae las lecturas de antes y de despues (solo SELECT) y la REVERSION, comentada.
--
-- REQUISITOS, de PERSONA (ninguno lo comprueba el codigo):
--   a) copia de la base ANTES de aplicar;
--   b) sincronizacion COMPLETA y reciente de Zoho justo antes (si no, se marca lo que Zoho dijo hace dias);
--   c) la aplicacion en reposo: nadie moviendo tickets mientras corre la pasada;
--   d) la pasada en seco hecha y leida: `numeracion.arrastra` debe ser false (si es true, NO aplicar y consultar
--      a Gerencia: el salto de la numeracion propia no tiene vuelta atras) y `negativa` debe ser null (si trae
--      estados sin equivalencia, el endpoint se niega a aplicar y responde 409; hay que decidir a donde va cada uno).
--
-- COMO SE LLAMA EL ENDPOINT (sesion de super administrador, cookie `sid`; `corte` es un instante ISO CON desfase,
-- una fecha pelada o sin desfase da 400; `aplicar` solo admite `true` o `false`, cualquier otro valor da 400):
--   en seco (por defecto; ni abre transaccion ni escribe):
--     curl -X POST -b "sid=<sesion>" "https://<host>/api/admin/migrar-tickets-abiertos?corte=2026-12-01T00:00:00-05:00"
--   aplicando (la misma llamada con aplicar=true; si hay negativa responde 409 con el informe y no escribe nada):
--     curl -X POST -b "sid=<sesion>" "https://<host>/api/admin/migrar-tickets-abiertos?corte=2026-12-01T00:00:00-05:00&aplicar=true"
-- El informe es el mismo en seco y al aplicar (aplicado indica si se escribio) y tambien va al log del servidor.
--
-- ORDEN:
--   1) las lecturas del paso 1, ANTES de aplicar;
--   2) la pasada en seco, el informe leido y los requisitos cumplidos;
--   3) la pasada con aplicar=true;
--   4) las mismas lecturas del paso 1 DESPUES: los marcadores salen a uno por ticket movido, y repetir la llamada
--      con aplicar=true no cambia nada (lo ya gobernado no se vuelve a elegir).
-- COMO: consola de PostgreSQL de produccion, base `desk`. Sin metacomandos de psql.
-- =====================================================================================================

-- 1 · ANTES y DESPUES, solo lectura: tickets por estado y status_type, y cuantos gobierna ya la aplicacion.
SELECT status, status_type, managed_by_app, count(*) AS cantidad
  FROM desk.tickets GROUP BY status, status_type, managed_by_app ORDER BY status, status_type, managed_by_app;

-- 1b · Filas marcador por regla (antes: 0; despues: una por ticket migrado) y por estado previo.
SELECT "values"->>'regla' AS regla, "values"->>'estado_previo' AS estado_previo, count(*) AS marcadores
  FROM desk.ticket_transitions WHERE transition_id = 'migracion_f1f01_abiertos'
 GROUP BY "values"->>'regla', "values"->>'estado_previo' ORDER BY 1, 2;

-- 1c · Tickets que ya gobierna la aplicacion y no llevan marcador (nacidos en la app o de antes de la migracion).
SELECT count(*) AS gobernados_sin_marcador
  FROM desk.tickets t WHERE t.managed_by_app = true
   AND t.id NOT IN (SELECT ticket_id FROM desk.ticket_transitions WHERE transition_id = 'migracion_f1f01_abiertos');

-- =====================================================================================================
-- REVERSION (comentada, prefijo «-- REV »; quitar el prefijo para ejecutarla). Va en UNA transaccion. Para cada
-- ticket cuyo marcador sigue siendo su ULTIMA transicion (el id maximo de ticket_transitions de ese ticket),
-- restaura desde el "values" del marcador lo que habia antes, una sentencia por regla:
--   · entregado-a-finalizado y pendiente-servicio-a-en-proceso: restauran status, status_type y managed_by_app;
--   · identidad y pendiente-soporte-se-conserva: no cambiaron el estado, restauran SOLO managed_by_app.
-- Despues borra los marcadores de esos mismos tickets. Un ticket con una transicion POSTERIOR al marcador (alguien
-- lo movio desde la aplicacion) NO se revierte ni pierde su marcador: el SELECT inicial (y el mismo, repetido tras el
-- COMMIT) los lista para decision de una persona. No toca closed_time ni modified_time (la migracion tampoco).
-- OJO: al revertir, managed_by_app vuelve a false en los tickets que lo tenian asi, y el sincronizador vuelve a
-- sobrescribirlos con lo que diga Zoho en su siguiente pasada. Si habia filas con managed_by_app_previo = true, vuelven a true.
-- Hipotesis: la sintaxis UPDATE ... FROM, "values"->>'clave' y max(id) ... GROUP BY esta probada sobre pg-mem (que rechaza un alias en el UPDATE, por eso la tabla va sin alias y la columna como desk.tickets.id), no sobre PostgreSQL de produccion;
-- la primera lectura real es la de la persona, con el SELECT de la copia.
--
-- REV SELECT t.number, t.status, m.id AS marcador FROM desk.tickets t JOIN desk.ticket_transitions m ON m.ticket_id = t.id
-- REV  WHERE m.transition_id = 'migracion_f1f01_abiertos'
-- REV    AND m.id NOT IN (SELECT max(id) FROM desk.ticket_transitions GROUP BY ticket_id) ORDER BY t.number;
-- REV BEGIN;
-- REV UPDATE desk.tickets SET status = m."values"->>'estado_previo', status_type = m."values"->>'status_type_previo',
-- REV        managed_by_app = (m."values"->>'managed_by_app_previo')::boolean, updated_at = now()
-- REV   FROM desk.ticket_transitions m
-- REV  WHERE m.ticket_id = desk.tickets.id AND m.transition_id = 'migracion_f1f01_abiertos' AND m."values"->>'regla' = 'entregado-a-finalizado'
-- REV    AND m.id IN (SELECT max(id) FROM desk.ticket_transitions GROUP BY ticket_id);
-- REV UPDATE desk.tickets SET status = m."values"->>'estado_previo', status_type = m."values"->>'status_type_previo',
-- REV        managed_by_app = (m."values"->>'managed_by_app_previo')::boolean, updated_at = now()
-- REV   FROM desk.ticket_transitions m
-- REV  WHERE m.ticket_id = desk.tickets.id AND m.transition_id = 'migracion_f1f01_abiertos' AND m."values"->>'regla' = 'pendiente-servicio-a-en-proceso'
-- REV    AND m.id IN (SELECT max(id) FROM desk.ticket_transitions GROUP BY ticket_id);
-- REV UPDATE desk.tickets SET managed_by_app = (m."values"->>'managed_by_app_previo')::boolean, updated_at = now()
-- REV   FROM desk.ticket_transitions m
-- REV  WHERE m.ticket_id = desk.tickets.id AND m.transition_id = 'migracion_f1f01_abiertos'
-- REV    AND m."values"->>'regla' IN ('identidad', 'pendiente-soporte-se-conserva')
-- REV    AND m.id IN (SELECT max(id) FROM desk.ticket_transitions GROUP BY ticket_id);
-- REV DELETE FROM desk.ticket_transitions WHERE transition_id = 'migracion_f1f01_abiertos'
-- REV    AND id IN (SELECT max(id) FROM desk.ticket_transitions GROUP BY ticket_id);
-- REV COMMIT;
-- REV SELECT t.number, t.status, m.id AS marcador FROM desk.tickets t JOIN desk.ticket_transitions m ON m.ticket_id = t.id
-- REV  WHERE m.transition_id = 'migracion_f1f01_abiertos'
-- REV    AND m.id NOT IN (SELECT max(id) FROM desk.ticket_transitions GROUP BY ticket_id) ORDER BY t.number;
