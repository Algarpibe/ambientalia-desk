---
tanda: F1C-09
motivo: ""
capacidad: [transitions-st, mapa-blueprint, permissions, transitions-soporte-remoto, derivacion-avisos]
maestro: ["M1.3", "M1.3.7", "M1.3.8", "R08.4.md:1250-1254", "R08.4.md:1626", "R08.4.md:1627", "R08.4.md:6454"]
cierra: si
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta: tres transiciones menos y la cifra anclada a 31

Mapa de rutas y líneas completo en `exploration.md` (misma carpeta). Aquí sólo lo que decide.

## Intención

Ejecutar `decision/tres-transiciones-y-la-cifra-anclada` (`openspec/config.yaml:3403-3424`, E-140, que
cierra E-103, E-106, E-116, E-118 y E-119), «a la vez, en una sola entrega». Desde el 01/10 el maestro
vigente dice 31 transiciones, 35 pasos y 20 estados en servicio técnico
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1249-1254`, `:6454`) y el
código y la cifra vigilada siguen en 34/38/21: cada día es un día de desvío declarado
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:306`).

Para el técnico: desaparece «Pendiente» como paso sin objetivo; «Diagnóstico complementario» se usa
desde En Proceso cuando, reparando, hay que volver a diagnosticar (E-119); «Servicio externo» queda sólo
como ida y vuelta con un tercero (R08.4.md:1627).

La parte «se registra la R08.4 como maestro vigente» **ya está hecha**: versionados el `.md` y el `.docx`
y rehecha la tabla de la copia citable (`CLAUDE.md:674-680`). Esta tanda sólo lo comprueba.

## Alcance

1. **Catálogo** (`packages/shared/src/transitions.ts`): retirar `marcar_pendiente` (`:206-207`),
   `servicio_externo_pendiente` (`:230-231`) y `servicio_externo_notificado` (`:232-233`); cambiar el
   origen de `diagnostico_complementario` (`:244`) de `Pendiente` a `En Proceso`. Ajustar los recuentos
   de sus comentarios (`:167`, `:269`, `:272`, `:289-290`, `:293`, `:386`).
2. **Registro de estados** (`packages/shared/src/estados.ts`): `Pendiente` pasa a
   `ESTADOS_SOLO_SOPORTE_REMOTO` (`:182`); `ESTADOS_SERVICIO` baja de 21 a 20 (`:187-190`). `ESTADOS`
   sigue en 23 y `Pendiente` sigue `sin_clasificar` (`:105`), porque soporte remoto lo usa
   (`transitions.ts:393-396`). Quitar `'Pendiente'` de `FASE_POR_ESTADO` (`fasesBlueprint.ts:57`).
3. **Guardianes**, en el mismo commit que el código: todos los de la tabla §3 de `exploration.md`
   (34→31, 38→35, 21→20, 44→41, 102→93 con 54/39, 816→744, 1.850→1.700, C2 de nueve a ocho estados).
   Las pruebas que usaban `marcar_pendiente` como «transición de servicio sobre un ticket de soporte
   remoto» (`flujos.test.ts:189-193`, `flujoSoporteRemoto.test.ts:73-76`,
   `transitionsSoporteRemoto.test.ts:61-63`) pasan a usar `diagnostico_complementario`, que desde ahora
   sale del mismo origen, En Proceso.
4. **Mapa regenerado**: `docs/artefactos/blueprint-*.md` con `scripts/generar-mapa-blueprint.ts`; la
   anti-desfase (`mapaBlueprint.test.ts:154-159`) lo exige.
5. **Cifras ancladas** (`openspec/config.yaml`): `transiciones` 34→31 (`:1367-1370`),
   `pasos_del_mapa` 38→35 (`:1360-1366`, y su `divergencia` caducada), `estados` 21→20 servicio
   (`:1371-1383`, supuesto S-1) y la mención a Pendiente de `esperas` (`:1342-1345`, `:1356-1359`);
   `capabilities` → `transitions-st` (`:110`).
6. **Specs**: deltas de las cinco capacidades de la cabecera (requisitos con 34/38/21 o con
   `marcar_pendiente`; lista en `exploration.md` §4).
7. **Migración de producción, escrita y NO ejecutada**:
   `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql`, con su prueba sobre pg-mem (§Enfoque).
8. **Barrido de citas** de la regla de mutación 4 al cerrar, sobre `transitions.ts`, `estados.ts` y
   `fasesBlueprint.ts`, completas y abreviadas.

## Fuera de alcance

- «Rechazo» desde Notificación cliente sólo para Comercial: es **F1C-10** (R-4, un cambio, un `tanda:`).
- Derivación de los repuestos (F1C-11), aviso «En garantía» (F1B-18), SKU (F1C-12).
- Los estados nuevos `Anulado`, `Pendiente de facturar`, `Control de calidad` (F1C-01, F1C-02, F1C-07).
- La regla de mapeo de estados de la migración desde Zoho del 14/12: es contenido de **F1F-01**; esta
  tanda la deja escrita como entrada para ella (pregunta P-1).
- Editar el `.docx` del maestro.

## Enfoque

- **No mover líneas de `transitions.ts`**: cada entrada retirada (dos líneas) se sustituye por dos
  líneas de comentario que dicen qué se retiró, cuándo y por qué (E-103/E-106). Así no se desplaza
  nada por debajo de `:206`, que es la mitad del fichero más citado del repositorio. Precedente: la
  ubicación de `cfOvAdicional` se eligió para no desplazar citas (`transitions.ts:366-368`). El barrido
  se hace igual (regla de mutación 4), pero se espera vacío de desplazamientos.
- **Rojo primero** (`strict_tdd`): las aserciones nuevas (31, 35, 20; ids retiradas ausentes de
  `TRANSITIONS`; `diagnostico_complementario.from` = `['En Proceso']`; `Pendiente` fuera de los
  derivados de servicio) se escriben antes de tocar el catálogo.
- **Mutaciones obligatorias**: reponer una retirada → rojo en el recuento y en la lista de ids;
  devolver `diagnostico_complementario` a `Pendiente` → rojo en el invariante 1; dejar `Pendiente`
  fuera de `ESTADOS_SOLO_SOPORTE_REMOTO` → rojo en el invariante 1 (regla de mutación 2 sobre el
  registro vigilado).
- **Migración** (patrón de `docs/sdd/Siembra_Compuestos_y_Gases_Patron_2026-10-01.sql:1-27`):
  1. Cabecera: lo ejecuta Alfonso en la consola de producción, base `desk`; NO se ha ejecutado.
  2. Recuento previo, de sólo lectura, en tres grupos: servicio técnico gobernado por la app
     (`managed_by_app = true`), servicio técnico gobernado por Zoho (`false`) y soporte remoto (no se
     toca). Servicio técnico = clasificación normalizada distinta de «Soporte remoto», el mismo
     criterio que `flujos.ts:56-60`.
  3. `BEGIN` → `INSERT INTO desk.ticket_transitions` de **una fila nueva por ticket** (`from_status`
     Pendiente, `to_status` En Proceso, `performed_by` que nombra la migración, `transition_id` marcador
     de migración que no es un botón) → `UPDATE desk.tickets SET status = 'En Proceso'` del primer grupo
     → recuento posterior → `COMMIT`. Idempotente: el filtro es `status = 'Pendiente'`; una segunda
     pasada no encuentra filas.
  4. **El historial no se reescribe**: ninguna fila existente de `ticket_transitions` se modifica ni se
     borra. La fila añadida registra el traslado, para que el historial no salte de Pendiente a En
     Proceso sin paso (supuesto S-2).
  5. El segundo grupo **no se toca desde la base**: `upsertTicket` lo devolvería a Pendiente en la
     siguiente pasada (`packages/zoho-sync/src/db/repo.ts:71`, cada 180.000 ms según
     `packages/zoho-sync/src/config.ts:88`). Se lista por número y queda para la pregunta P-1.
  6. Una prueba ejecuta el script contra pg-mem con un ticket de cada grupo, comprueba los tres
     desenlaces y la segunda ejecución sin efectos. Hipótesis: pg-mem admite las sentencias del
     script; si no, el diseño decide qué parte se prueba y cuál se revisa por lectura.

## Supuestos (modo producción: razonables, reversibles, anotados)

| ID | Supuesto | Por qué |
|---|---|---|
| S-1 | La cifra anclada `estados` pasa a **20 de servicio** (`ESTADOS_SERVICIO`), no sólo `transiciones` y `pasos_del_mapa` | El invariante 1 lo impone y el maestro vigente ya dice 20 (R08.4.md:1253-1254). La decisión nombra 34→31 y 38→35, y no lo contradice |
| S-2 | La migración **añade** una fila de traza por ticket en `ticket_transitions` | «Sin reescribir» prohíbe tocar filas existentes, no anotar el traslado. Reversible: la fila se identifica por su marcador |
| S-3 | Sólo se mueven por SQL los tickets con `managed_by_app = true` | Los demás los repone el sincronizador (`repo.ts:71`) |
| S-4 | No hay lista del reloj del SLA que contenga Pendiente | `sla.ts:15` es un comentario. El diseño lo confirma. Si existe, se quita en esta tanda (R08.4.md:1626) |
| S-5 | `cierra: si` | Todo el contenido de la fila (plan R01.4 §E, `:173`) se construye en el repositorio. La ejecución del script es una tarea de persona y queda fuera del recuento (regla del ciclo 1). Archivar no la da por hecha |

## Preguntas para Gerencia (no bloquean la tanda)

- **P-1 · Tickets de servicio en «Pendiente» que gobierna Zoho.** El script no los mueve porque el
  sincronizador los devolvería. ¿Se pasan a En Proceso **en Zoho Desk**, a mano, mientras Zoho siga
  activo (el sincronizador los traería ya movidos), o se dejan para que la migración del 14/12 (F1F-01)
  los asigne a En Proceso con su regla de mapeo? Supuesto mientras no conteste: la segunda opción, y el
  recuento previo dice cuántos son. A quién corresponde: Gerencia. Qué desbloquea: el destino de ese
  grupo. Ninguna de las dos opciones cambia el código de esta tanda.

## Tareas de persona (fuera del recuento, regla del ciclo 1)

| Tarea | Dueño | Cuándo | Dónde queda escrita |
|---|---|---|---|
| Ejecutar el recuento previo (sólo lectura) y anotar los tres grupos | Alfonso | antes de desplegar | parte del corte + `archive-report.md` |
| Ejecutar la migración tras desplegar y anotar el recuento posterior | Alfonso | tras desplegar F1C-09 | ídem |
| Responder P-1 | Gerencia | antes de F1F-01 | `openspec/config.yaml` → `decisiones_de_gerencia_adenda` |

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Citas `transitions.ts:NNN` desfasadas (fichero más citado) | Media | Sustituir por comentarios del mismo número de líneas; barrido completo y abreviado al cierre |
| Un ticket de servicio queda en Pendiente **sin ninguna transición** hasta la migración | Alta, transitorio | Desplegar y migrar en el mismo corte; recuento previo antes de desplegar |
| Un cliente abierto con la lista vieja ejecuta una id retirada | Baja | Hipótesis: el servidor resuelve la id contra el catálogo (`transitionById`, `transitions.ts:305-307`) y una id retirada se rechaza. El diseño localiza la línea del servidor y prueba el código de respuesta |
| La guarda D-1 de `mapaBlueprint.test.ts:65-71` deja de probar nada si se borra `Pendiente` sin sustituirlo | Media | Se elige otro estado de servicio y se comprueba que la mutación sigue dando rojo |
| Pruebas que usaban `marcar_pendiente` como ejemplo pierden cobertura | Media | Se reapuntan a `diagnostico_complementario`, mismo origen; se comprueba la posición del 409 de flujo (regla de mutación 1) |

## Plan de vuelta atrás

Revertir el commit de la tanda: catálogo, registro, guardianes, mapa y cifras vuelven juntos porque van
juntos. Datos: borrar las filas con el marcador de migración y devolver a `Pendiente` los tickets que
esas filas nombran, en una transacción. El script incluye esa reversión comentada.

## Criterios de aceptación

1. `TRANSITIONS` tiene **31** entradas con 31 ids distintos; ninguna es `marcar_pendiente`,
   `servicio_externo_pendiente` ni `servicio_externo_notificado`.
2. `diagnostico_complementario` sale de `['En Proceso']` hacia `Continuación del proceso`.
3. `ESTADOS_SERVICIO` tiene **20** estados y no contiene `Pendiente`; `ESTADOS` sigue en **23**.
4. Los invariantes 1, 3 y 4 de servicio y los de la unión siguen en verde; la unión tiene **41** ids.
5. El diagrama completo tiene **35** aristas y los cuatro `docs/artefactos/blueprint-*.md` coinciden con
   el generador.
6. Permisos: **93** casos (54 prohibidos, 39 permitidos); ejecución: 31 transiciones en 33 ejecuciones.
7. `cifras_ancladas` dice 31, 35 y 20 en el mismo commit que el código.
8. El script de migración existe, va calificado por esquema, es idempotente y su prueba pasa con los tres
   grupos.
9. `npm test`, `npm run typecheck` y `npm run lint` en verde; las tres mutaciones del Enfoque dan rojo.
10. Barrido de citas de la regla de mutación 4 hecho y anotado en el `apply-progress`.

## Estimación de líneas (techo 800 por intento)

Medida: `git diff --shortstat --no-renames` contra el commit de partida más `wc -l` de lo nuevo sin
trackear. Hipótesis, a confirmar por `sdd-tasks`.

| Intento | Contenido | Líneas |
|---|---|---|
| 1 · propose | `exploration.md` + `proposal.md` | ~330 |
| 2 · spec + design + tasks | 5 deltas (~300) + `design.md` (~220) + `tasks.md` (~150) | ~670 |
| 3 · apply lote A | `transitions.ts` (~20), `estados.ts` + `fasesBlueprint.ts` + `mapaBlueprint.ts` (~20), 14 ficheros de prueba (~170), 4 artefactos regenerados (~40), `config.yaml` (~25), `apply-progress.md` (~120) | ~395 |
| 4 · apply lote B | script SQL (~80), su prueba (~90), barrido de citas (~40), `apply-progress.md` (~60) | ~270 |
| 5 · verify | `verify-report.md` | ~350 |
| 6 · archive | mudanza + fusión de 5 deltas + `archive-report.md`; lo revisable, estimado en ~450 | regla del archivo |

Si el intento 2 supera 800, se parte en spec por un lado y design + tasks por otro.
