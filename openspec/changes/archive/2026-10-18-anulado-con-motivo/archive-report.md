# Informe de archivo — `anulado-con-motivo` (F1C-01, `cierra: si`)

**Qué parte de F1C-01 cubre y qué deja fuera:** cubre la fila entera de construcción, «C2 estado `Anulado` con motivo»
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:99`): el estado, los cinco motivos, la transición a `Anulado` en los
tres flujos con motivo impuesto en el servidor, el cierre y las tres métricas sin anulados. Deja fuera, como tareas de
persona, el marcado del histórico abandonado (consecuencia 3 de `decision/c2-anulado`), la revisión de los supuestos y la
corrección de las cifras en el maestro.

## Qué quedó construido

- **Motivos:** `packages/shared/src/anulacion.ts`, con los cinco de `R08.4.md:2139-2144`. «Otro» exige detalle; «Creado por
  error» y «duplicado» no son motivos.
- **Estado:** `Anulado` es de clase `ninguna` (`packages/shared/src/estados.ts:99`, en la misma línea que `Ticket creado`),
  terminal y cerrado (`apps/desk/server/transitionExec.ts:5`).
- **Transiciones**, de área Comercial (`decision/f1c01-area-anulado`), cada una en la misma línea que su vecina:
  - `anulacion` (servicio), desde las dos esperas externas y los tres orígenes de Rechazo, en `packages/shared/src/transitions.ts:262`;
  - `anulacion_equipo_nuevo`, desde los cuatro estados no terminales, en `:362`;
  - `anulacion_soporte`, desde `En Proceso` y `Pendiente`, en `:396`.
- **Guarda:** `erroresAnulacion` dentro del único `422` del escalón C (`apps/desk/server/services/ticketService.ts:134`),
  detrás del `403` de área. Una prueba de posición lo fija.
- **Métricas:** `computeAnalisis` excluye los anulados con una sola condición (`packages/shared/src/analisis.ts:59`), y la
  ficha de cliente los salta en `resolucionPromedioMs` (S-5).
- **Histórico:** `docs/sdd/Consulta_Candidatos_Anulado_2026-10-18.sql`, sólo lectura (`READ ONLY … ROLLBACK`), que lista
  los candidatos Rechazo→Finalizado. No escribe ninguna marca.
- **Cifras ancladas:** 31/20/35 pasan a 32/21/40 en `openspec/config.yaml → cifras_ancladas` y en `cifrasAncladas.test.ts`.
- **Base de datos: no hay migración.** El motivo viaja en `values` (`ticket_transitions.values`, y `tickets.custom_fields`
  por `target: customField`), y `tickets.status` es `text` sin CHECK.

## Specs: fusión sin desplazar ninguna cita

Antes de fusionar se midió que los bloques MODIFIED crecían entre 2 y 10 líneas, y eso habría desplazado 165 citas por
línea a tres specs vivas (133 de `transitions-st`). Los deltas se regeneraron con una regla dura: **cada sustitución cambia
N líneas por N líneas**. Así:

- los escenarios nuevos pasaron a dos requisitos ADDED, RQ-EN-14 y RQ-SR-13;
- los ADDED van al final de cada spec;
- los diez MODIFIED quedaron en sitio, comprobado hunk a hunk con `git diff -U0`: todos «en sitio» salvo el añadido final.

| Spec | Requisitos | Líneas |
|---|---|---|
| `transitions-st` | MODIFIED RQ-TS-04, 05 y 26; ADDED RQ-TS-40 | 2.613 → 2.681 |
| `transitions-equipo-nuevo` | MODIFIED RQ-EN-01, 02 y 13; ADDED RQ-EN-14 | 568 → 586 |
| `transitions-soporte-remoto` | MODIFIED RQ-SR-01, 02 y 05; ADDED RQ-SR-13 | 355 → 373 |
| `tickets-core` | ADDED RQ-TC-71 y 72 | 4.258 → 4.323 |

Las líneas citadas que cambiaron de contenido (`transitions-st/spec.md:185`; `transitions-equipo-nuevo/spec.md:38`, `:40` y
`:121`) sólo las citan informes archivados, que afirman su propia revisión. Ninguna afirma algo que este cambio haga falso.

## Regla de mutación 4

- `estados.ts` (190) y `transitions.ts` (397) conservan su número de líneas. Las tres entradas nuevas de los tests citados
  (`transicionesEjecucion.test.ts`, `invariantesGrafo.test.ts`, `transitionsSoporteRemoto.test.ts`) van en la línea de su
  vecina. `anulacion_soporte` se movió en el verify a la línea de su vecina, y así ninguna de las citas `388-397` se repunta.
- **Los seis artefactos del mapa, regenerados, sí cambian de longitud.** Sus citas son todas de informes archivados (caso
  B) y se anclaron a la revisión en que eran ciertas, sin renumerar:
  - 16 citas en `openspec/changes/archive/2026-10-02-rechazo-solo-comercial/`, ancladas a `b16cbb4`. Allí la línea 54 de
    `blueprint-completo.md` y la 44 y la 22 de las fases 2 y 3 son la arista `e03 --> e17 : Rechazo`.
  - 1 cita en `openspec/changes/archive/2026-10-01-tres-transiciones-cifra-anclada/design.md`, anclada a `c1680a8`. Allí
    la línea 31 es `state "Pendiente" as e21`.
- **Caso C, en un fichero de Supervisión que la rama no toca:** `docs/sdd/ENTRADA.md`, E-223, dice que ningún catálogo
  tiene transición de anulación. Este cambio lo supera. Va como texto para Supervisión.

## Intentos (registro de `gentle-ai sdd-attempt`)

| # | Unidad | Commits | Medida (`--no-renames`) |
|---|---|---|---|
| 1 | planificación | `30fa8dc` | 326 contra `200a9b5` |
| 2 | specs | `594ca0b` | 479 |
| 3 | lote 1 | `bb350be`, `490915f` | 642. Partido: superaba la válvula con 870, así que las pruebas HTTP y `apply-progress.md` pasaron al intento 4 |
| 4 | lote 2 | `04339d6` | 522 |
| 5 | verify | `af0446c` | 188 |
| 6 | archive | este commit y el de la reconciliación | revisable: fusión, anclas y deltas regenerados 445, más este informe; el resto es la mudanza |

## Códigos y bundle

- Códigos: test 0 (292 ficheros, 4.885 pruebas, 11 omitidas), typecheck 0, lint 0 (165 avisos, los de la partida) y
  detector 0.
- Bundle: `index-*.js` pasa de 416.666 a 417.636 bytes (+970). El chunk de Análisis no cambia: 8.822 bytes.

## Avisos del verify y su destino

- W1 y W2: escenarios sin prueba (alcanzabilidad de RQ-TS-05, medida 19/19/20 y cierta; las tres salidas de `Notificado`;
  la coherencia de `esperas`). Es un hueco heredado y queda anotado.
- W3, W6 y S2: corregidos en sitio en `af0446c`.
- W4: M5 no cae en `boardView.test.ts`, porque construye el ticket ya `Closed`; la red de M5 son las pruebas HTTP.
- W5: resuelto como se describe arriba.
- S1: no se aplica; las specs vivas conservan la marca «— ROJO».
- S3 y S4: van para la bandeja.

## Supuestos para la lista semanal (F1C-01)

- S-1: los cinco motivos son los mismos en los tres flujos.
- S-2: equipo nuevo se anula desde `Ingresado`, `En Proceso`, `Notificado` y `Verificación`.
- S-3: soporte remoto se anula desde `En Proceso` y `Pendiente`, y no desde `Solicitud Soporte`.
- S-4: `En Espera de Repuestos` y `Servicio externo` siguen en `ESTADOS_SIN_SALIDA` (les falta la salida de F1C-03).
- S-5: la ficha de cliente excluye los anulados.
- S-6: el detalle de «Otro» es un campo de texto propio.
- S-7: el anulado sigue contando como creado.
- S-8: anular no da el testigo (avisos, traspaso y reasignación sin cambios).
- S-9: la anulación de servicio hereda la casilla «Derivado a».
- S-10: `rechazo_garantia` (`Notificación a Compras` → `Notificación Comercial`) no se anula: es un rechazo de garantía, no un abandono.

Cómo se revierte cada uno: `proposal.md` §4.

## Tareas de personas — archivar NO las da por hechas

| # | Qué | Dueño |
|---|---|---|
| P-1 | Ejecutar `docs/sdd/Consulta_Candidatos_Anulado_2026-10-18.sql` en producción, confirmar los abandonados y marcarlos | Alfonso y Servicio Técnico |
| P-2 | Revisar S-1 a S-10 en la lista semanal | Gerencia |
| P-3 | Pegar en el maestro 21 estados, 32 transiciones y 40 pasos | Gerencia |
| P-4 | Comprobar tras el despliegue que Comercial ve «Anulación» con su desplegable de motivos | quien despliegue |

## Para la bandeja (no se corrige aquí)

- `TicketDetailView.tsx:245` pinta un anulado del mismo color que un finalizado.
- Los indicadores por ticket (`apps/desk/server/indicadores.ts:64-74`) y `estadoSubOV` (`packages/shared/src/contratos.ts:140`)
  cuentan al anulado: el primero como «Cumple» si tiene promesa, el segundo como «en curso».
