# Archive · `reasignacion-con-motivo` (F1B-05, `cierra: si`)

**Fecha:** 2026-10-06 · **Rama:** `reasignacion-con-motivo` · **Partida:** `b14cd0f` · **Informe escrito por el orquestador**, con
cifras medidas por él; no lo generó el agente de archivo.

**Qué parte de la fila F1B-05 cubre, en una línea:** el protocolo de traspaso que le faltaba —reasignar la persona a cargo sin cambiar
de estado, con motivo obligatorio, traza en el historial y aviso a quien lo recibe—; con la línea de traspaso, las trazas y la casilla
comercial ya construidas por `traspaso-y-trazas`, y la visibilidad por área cerrada sin construir por decisión de Gerencia, **no queda
contenido construible de la fila** y por eso el cambio declara `cierra: si`. **Deja fuera**, porque no son de esta fila: la restricción
por propietario del registro (después del corte, con F1C-05) y las ausencias por usuario (M6).

## Qué decisión construye

`decision/e089-e220-visibilidad-y-traspaso` (Gerencia, 2026-10-06; `openspec/config.yaml` → `decisiones_de_gerencia`), respuesta
textual: «Traspaso en parte: reasignar sin cambiar estado, con motivo y aviso, ya; la restricción por propietario después del corte con
F1C-05». Pasaje del maestro: M1.9.2, línea 2035 de la R08.4.md.

## Qué quedó construido

- Reglas puras en `packages/shared/src/reasignacion.ts`: `puedeReasignar` (administrador, o un área de alguna transición que sale del
  estado dentro del flujo del ticket), `reasignacionDelCuerpo` (un solo error, en el orden motivo, destino ausente, destino igual al
  actual) y los textos de error.
- Tabla `public.reasignaciones`, calificada, al final de `packages/zoho-sync/src/db/schema.sql`, con `CHECK` del motivo; está en
  `PUBLIC_TABLES` y el guardián de `packages/zoho-sync/src/db/migrate.test.ts` la vigila.
- Capa de datos en `apps/desk/server/db/reasignaciones.ts`: el `UPDATE` de `derivado_a` va condicionado a la persona a cargo leída y,
  sólo si acierta fila, se inserta la traza, las dos sentencias en una transacción. No toca `managed_by_app`, el estado ni `updated_at`.
- Ruta `POST /api/tickets/:id/reasignar` (`apps/desk/server/routes/reasignacion.ts:23`), con la escalera A `404` < B `403` < C `422`
  (motivo, destino ausente, destino igual al actual, destino inexistente o inactivo) < D `409` (la persona a cargo cambió entre la
  lectura y la escritura: sin traza y sin aviso).
- Aviso al destino en la aplicación y por correo, fuera de la transacción (`apps/desk/server/services/avisoReasignacion.ts`);
  reasignarse a uno mismo no avisa; un correo que no sale no tumba la respuesta.
- Historial: cuarta fuente, compuesta al leer la tabla (`apps/desk/server/db/eventoReasignacion.ts`), con De, A, Motivo y Reasignado por.
- `usosDeUsuario` cuenta a quien figura como origen o destino de una reasignación, y eliminar un ticket borra sus reasignaciones.
- Cliente: `apps/desk/src/components/PanelReasignar.tsx`, montado en el detalle del ticket; consume el predicado y el validador de
  `packages/shared`. La tabla de la regla 13, con diez decisiones y la línea de servidor de cada una, está en `apply-progress.md` y
  contrastada fila a fila en `verify-report.md`.
- Sin interruptor y sin variables de entorno. No se tocaron `ticketService.ts` ni `repo.ts`.

## El sincronizador

`derivado_a` está fuera de `TICKET_COLS` (`packages/zoho-sync/src/db/repo.ts:41-54`), así que la reasignación de un ticket venido de
Zoho sobrevive sin protección nueva, a condición de no poner `managed_by_app`. Lo prueba `apps/desk/server/reasignacionSync.test.ts`
con la ruta real: el ticket lo fabrica `upsertTicket`, se reasigna, llega otra pasada con un estado nuevo, y `derivado_a` se conserva,
el estado de Zoho entra y `managed_by_app` sigue en `false`. Su mutación (añadir `managed_by_app = true` al `UPDATE`) la pone roja,
reproducida por el orquestador y por el verificador.

## Supuestos anotados que quedan vivos (reversibles; para Gerencia en el §9 del paquete de despliegue)

Origen y destino por id, actor por nombre (S-1); en un estado sin transiciones de salida sólo reasigna un administrador (S-2); el cargo
no interviene (S-3); destino igual a la persona actual da `422` (S-4); reasignarse a uno mismo se permite y no avisa (S-5); el destino
puede ser cualquier persona activa, sin exigir que sea del área —el maestro dice «técnicos de la misma área»— (S-6); el correo lleva
copia y no se avisa a la persona de origen (S-7); eliminar un ticket borra sus reasignaciones (S-8, añadido por el diseño).

## Medida, por intento (registro de `gentle-ai sdd-attempt` = `git diff --shortstat --no-renames` más lo nuevo sin trackear)

| Intento | Commit | Registro | Git |
|---|---|---|---|
| Lote 1 · `shared`, tabla, guardián y capa de datos | `289236b` | 537 | 446 nuevas + 69 + 22 |
| Lote 2 · aviso, usos, borrado e historial | `60a3ebd` | 494 | 290 nuevas + 167 + 37 |
| Lote 3 · ruta, registro y sincronizador | `5d12bb9` | 530 | 439 nuevas + 71 + 20 |
| Lote 4 · cliente y documentos | `acf2157` | 399 | 152 nuevas + 231 + 16 |
| Verify | `f908907` | 351 | 325 nuevas + 13 + 13 |
| Cierre | `3877d4f` | 93 | 88 + 5 |

Ningún intento pasó de la válvula de 720 y ninguno se partió. En los seis, las cuatro órdenes (pruebas, typecheck, lint y detector de
citas) las repitió el orquestador sobre el árbol final mirando el código de salida antes de asentar. La planificación (`821c348`,
1.414 líneas) fue sin intento, como en las tandas anteriores. Producto y pruebas contra la partida: 27 ficheros, 1.478 inserciones y 36
borrados (`git diff --shortstat --no-renames b14cd0f 3877d4f -- apps packages`). Los informes de dos lotes dieron cifras menores que el
registro (410 y 286) porque no contaban `tasks.md` ni `apply-progress.md`; la cifra buena es la de git.

**Ficheros existentes editados en sitio, mismas líneas antes y después:** `apps/desk/server/db/historial.ts` (162),
`apps/desk/server/auth/users.ts` (158), `apps/desk/server/db/eliminarTicket.ts` (189), `apps/desk/server/app.ts` (96),
`packages/zoho-sync/src/db/migrate.ts` (131) y `apps/desk/src/components/TicketDetailView.tsx` (420). Crecen sólo por el final
`packages/shared/src/index.ts` (37 → 38), `apps/desk/src/api/client.ts` (864 → 871), `packages/zoho-sync/src/db/schema.sql`
(751 → 765) y `packages/zoho-sync/src/db/migrate.test.ts` (779 → 819). Ninguna cita a código cambia de número.

## Verificación

- `verify-report.md`: PASS WITH WARNINGS, 0 CRITICAL, 4 WARNING y 8 SUGGESTION, sobre 10 requisitos y 66 escenarios. 68 mutaciones
  propias del verificador: 63 rojas y 5 supervivientes, de las que 2 son equivalentes (una comparación redundante en el validador y el
  `ORDER BY` de la lectura, que pg-mem no distingue) y 3 eran pruebas que faltaban.
- El cierre (`3877d4f`) cubrió las tres con pruebas nuevas, cada una vista en rojo con su mutación: el aviso se escribe después del
  `COMMIT` y por la conexión del pool (W-1), `NOT NULL` del destino y de quien reasigna en la tabla (W-2), y el `UPDATE` de un ticket
  sin persona a cargo no toca `updated_at` (W-3). W-4 eran las casillas del orquestador, ya marcadas.
- Tras el cierre: 3.868 pruebas, typecheck en 0, lint con 165 avisos y 0 errores, detector de citas en 0.
- El orquestador reprodujo por su cuenta siete mutaciones repartidas en los lotes y el cierre; las siete, rojas.

## Límites declarados

- **La suite no ejercita el bloqueo de fila de PostgreSQL.** El `409` de carrera se prueba de forma determinista, intercalando otra
  escritura justo antes del `UPDATE`; lo que hace PostgreSQL con dos transacciones reales a la vez es hipótesis no medida.
- **pg-mem no revierte un `ROLLBACK`.** Que si falla el alta de la traza `derivado_a` no cambie se prueba por la secuencia de verbos de
  la transacción, no por el estado final.
- **Si falla el alta del aviso tras escribir, la respuesta es `500` con la reasignación ya hecha.** Es el mismo límite del aviso de
  derivación; lo fija una prueba.
- **El panel no tiene pruebas de interfaz**: los `.tsx` están fuera de la red por decisión de Gerencia (F0-00). Lo decidible está en
  `apps/desk/src/lib/reasignacion.ts`, con prueba; lo demás es la tarea de persona P-1.

## Lo que no se hizo, y por qué

- **`openspec/config.yaml` no se tocó.** La tarea 4.11 (anotar ahí el estado de aplicación de la decisión) quedó retirada: la entrada
  está a mitad de un fichero citado por número de línea y no hay un patrón de nota al final. El estado de aplicación queda aquí y en el
  §9 de `docs/sdd/Paquete_de_Despliegue_2026-10-06.md`.
- **`docs/sdd/ENTRADA.md` no se tocó**: tiene cambios de Supervisión sin commitear en `main`. Por eso los supuestos van al paquete de
  despliegue y la entrada la abre Supervisión. Una cita de ese fichero a una spec viva queda desplazada por este archivo y **no** se
  ancló: la de su línea 1248 (a `permissions`, líneas 463 a 475 de antes).
- **La frase «nueve tablas» de `apps/desk/src/components/CreateTicket.tsx`** (ya desfasada antes de este cambio) sigue ahí: es un
  `.tsx` fuera del alcance. El runbook de borrado manual sí se corrigió a diez.

## Fusión de los deltas (por script, bloque a bloque)

`fusiona.mjs` sustituyó cada requisito MODIFIED por su bloque del delta y añadió los ADDED al final de cada spec, y comprobó que cada
bloque vivo es idéntico línea a línea al del delta: **10 bloques, 10 idénticos**.

| Capacidad | MODIFIED | ADDED | Líneas vivas |
|---|---|---|---|
| `trazas` | RQ-TZ-06 (+8), RQ-TZ-17 (+7) | RQ-TZ-20 | 730 → 823 |
| `permissions` | RQ-PM-11 (+24) | RQ-PM-27 | 760 → 853 |
| `tickets-core` | RQ-TC-11 (mismas líneas) | RQ-TC-50, RQ-TC-51, RQ-TC-52 | 2.711 → 2.945 |
| `derivacion-avisos` | — | RQ-AV-20 | 899 → 956 |

Dos de los cuatro MODIFIED no estaban en la propuesta y los destapó el trabajo: RQ-TZ-06 decía «tres fuentes» y prohibía registrar
eventos en tabla propia (lo vio el diseño); RQ-TC-11 decía «nueve tablas hijas» (lo vio el barrido de citas del lote 4).

## Citas desplazadas por la fusión (regla de mutación 4)

Tres de los cuatro MODIFIED desplazan lo que les sigue, en dos specs (`trazas` y `permissions`); RQ-TC-11 se modifica sobre sus
mismas líneas y `tickets-core` no se desplaza. El barrido encontró **80** citas completas a esas dos specs cuya línea cambia, en 48
ficheros. Se trataron con el método del 2026-10-04, que ancla cada cita a la revisión que escribió la frase en vez de
renumerarla:

| Resultado | Cuántas |
|---|---|
| Ancladas ahora a su revisión | 20 |
| Ya llevaban ancla | 15 |
| Ya estaban desplazadas antes de este archivo (todas en `openspec/changes/archive/`, sin tocar) | 44 |
| En `docs/sdd/ENTRADA.md`, sin tocar | 1 |

De las 20 ancladas, 12 son de los artefactos de este mismo cambio, y las otras 8 de documentos anteriores, entre ellas una en la spec
viva de `vistas-tablero`.

**Un bloqueo del detector, y cómo se quitó.** En el primer intento de este archivo el RQ-TC-11 modificado llevaba una nota de tres
líneas, que desplazaba todo `tickets-core`; una cita de `docs/sdd/ENTRADA.md` (su línea 2148) pasaba a caer en una línea vacía y el
detector salió con 1. Como ese fichero no se puede tocar, se quitó la causa: el requisito se modifica sobre sus mismas líneas, sin nota.

## Medida de este archivo (regla del archivo)

Parte con carga de revisión, medida antes de commitear: la fusión de los deltas (485 inserciones y 8 borrados en las cuatro specs
vivas, más una línea anclada en la de `vistas-tablero`), las anclas y la lista de «en curso» de `apps/desk/server/reconciliacion/registro.test.ts` (20 y 23, contando las tres líneas de la nota retirada del delta), y este informe. Queda por
debajo de 800. El resto es la mudanza de la carpeta, que sin detección de renombrado cuenta dos veces cada línea movida.

## Consecuencia en el avance

F1B-05 sale de «en curso»: la prueba que fija esa lista pasa de trece a doce tandas. La tanda cuenta en el avance sólo desde este
archivo, con el verify en PASS y `cierra: si`; `docs/sdd/RECONCILIACION.md` se regenera en `main` tras la fusión.

## Tareas de persona — fuera del recuento; archivar no las da por hechas

| # | Dueño | Qué | Dónde queda escrito |
|---|---|---|---|
| P-1 | Analista | Verificar en la aplicación el panel, el aviso y la línea del historial | `docs/sdd/Paquete_de_Despliegue_2026-10-06.md`, §9.3 |
| P-2 | Gerencia | Confirmar o corregir S-2, S-4, S-5, S-6 y S-8 | el mismo paquete, §9.1 |
| P-3 | Gerencia | Pegar la corrección 30 en el maestro | `docs/sdd/F0-01_Correcciones_para_el_maestro.md` |
| P-4 | Mantenedor | Desplegar y comprobar que existe `public.reasignaciones` en producción | `DEPLOY.md` |
