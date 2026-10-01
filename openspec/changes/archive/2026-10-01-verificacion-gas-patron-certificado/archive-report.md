# Informe de archivo — `verificacion-gas-patron-certificado` (F1A-03, `cierra: si`)

Archivado el 2026-10-01 en `openspec/changes/archive/2026-10-01-verificacion-gas-patron-certificado/`.

## Cobertura de la fila (sostiene `cierra: si`)

«Cubre de F1A-03 la guarda de Verificación por familia y gas patrón vigente (E3/E4), el certificado de fábrica en
Liberación (E5), el compuesto del equipo heredado del modelo y la tabla de gases patrón; con E1/E2 de
`salidas-verificacion`, la fila queda entera. Deja fuera la siembra (tarea de persona) y la edición del compuesto
desde la hoja de vida (F1B-02).» (`proposal.md:212-215`). Ninguna exigencia de la fila quedó sin destino.

## Commits

| Qué | Commit | Medida |
|---|---|---|
| Lote 1 · dato (lista de compuestos, esquema, herencia, `PATCH`, R-2) | `084875c` | 772 |
| Lote 2 · guardas (veredicto, 409 de Verificación, motivo, 422 del certificado) | `f644027` | 594 |
| Lote 3 · PDF del certificado, interfaz, script de siembra | `5251896` | 535 |
| Verify (PASS WITH WARNINGS) | `15e7bce` | 149 |
| Registros de Gerencia (E-146, E-147, E-148) | `f6f1b5b`, `4eafe5e`, `28167e8` | documental |
| Este archivo | el commit que lo contiene | ver «Medida» |

## Estado al cierre

- **Verify:** PASS WITH WARNINGS · 0 CRITICAL, 5 WARNING, 3 SUGGESTION · 53/53 casillas · 15 requisitos y 84
  escenarios, todos cubiertos · 2.363 pruebas en verde (168 ficheros + 1 omitido) · typecheck limpio · lint 165
  avisos, ninguno nuevo · build en verde.
- **Mutaciones reproducidas por el orquestador o el verify** (todas en rojo y revertidas): m-1a, m-1b y m-1c
  (posición de la guarda de Verificación), m-10a, m-10b y m-10e (subida del PDF), m-7a (`CREATE` sin calificar).
- **Hechos de estado final que superan a los informes intermedios:**
  - El intento 1 (lote 1) se cerró con **reset de mantenedor** autorizado por Gerencia (E-146): medida propia
    772, el registro imputó 1.651 por commits ajenos en la ventana del intento. Hallazgo E-147, cerrado con la
    opción 1 (E-148): desde la tanda siguiente cada intento SDD trabaja en su propio worktree («Regla del ciclo 3»
    de `CLAUDE.md`).
  - Lotes 2 y 3, verify y este archivo cerraron cada uno en su intento, dentro de su techo.

## Decisiones de diseño aceptadas por Gerencia (`decision/archivo-f1a03-y-worktrees-01-10`)

Las tres desviaciones declaradas por el apply y juzgadas conformes por el verify pasan a ser decisiones de diseño
(escritas al final de `design.md`):

1. El número del certificado vive sólo en la traza de la transición (`ticket_transitions.values`, RQ-EN-10); no se
   copia a `tickets.custom_fields` (`apps/desk/server/services/ticketService.ts:133`).
2. El PDF se sirve con tipo fijo, `attachment` y `nosniff` (`apps/desk/server/routes/certificadoFabrica.ts:57-59`).
3. Un veredicto que bloquea también exige el certificado (`packages/shared/src/gasPatron.ts:83`); no es observable
   porque el 409 sale antes que el 422.

Correcciones del delta que el apply aplicó (`tasks.md`, cabecera): C-1 sólo el administrador corrige el compuesto
(supuesto reversible d-1); C-5 el alta ignora el compuesto del cuerpo y lo hereda del modelo; C-6 26 tablas en
`public` y columna `vence`.

## Specs fusionadas en las vivas

| Spec viva | Acción | Líneas |
|---|---|---|
| `openspec/specs/gases-patron/spec.md` | creada (capacidad nueva, ya declarada en `capabilities` desde el lote 1) | +213 |
| `openspec/specs/hojas-vida/spec.md` | RQ-HV-13 a RQ-HV-15 añadidos al final | +138 |
| `openspec/specs/transitions-equipo-nuevo/spec.md` | RQ-EN-08 a RQ-EN-12 añadidos; RQ-EN-01 modificado; E3, E4 y E5 salen de «Fuera de alcance» | +290 / −9 |

Este archivo no toca `openspec/config.yaml`: `gases-patron` entró en `capabilities` en el lote 1 (`084875c`).

## Medida (condición de Gerencia, `aprobaciones_de_techo_del_ledger_adenda`)

`git diff --shortstat --no-renames` del commit de archivo:

- **Parte con carga de revisión** (fusión de las tres specs + este informe): 650 de specs (641 / 9) más este
  informe (112) y las tres anclas de las notas (3 / 3): **762** (753 / 9). Por debajo de 850.
- **Total que ve el registro:** **4.784** (2.764 inserciones / 2.020 borrados, `28167e8..HEAD`, los commits de archivo,
  medido con `git diff --shortstat --no-renames`), por debajo del techo de 6.000.
  El `git mv` de la carpeta cuenta dos veces (regla del ciclo 2, desvío 3) y no tiene carga de revisión.

*Nota de procedencia:* el primer commit de archivo que preparó el agente de fase incluía, por error, todos los
ficheros sin trackear del repositorio (las copias R08.3/R08.4 del maestro, siete partes y una evidencia: +6.450
líneas ajenas) y un informe en inglés con cifras que no casaban con el commit. Se deshizo antes de publicarlo y se
rehízo sólo con el archivo; este informe sustituye al de aquel commit.

## Pendientes que archivar NO da por hechos

**Tareas de persona** (regla del ciclo 1; fuera del recuento):

| Tarea | Dueño | Destino | Estado |
|---|---|---|---|
| P.1 · Entregar la lista de gases patrón (cilindro, compuesto, disponibilidad, vencimiento del certificado del cilindro), el compuesto de cada serial del lote AP-370 de 2024 y el de los modelos convertidores | **Director Técnico** | bloques A, C y D de `docs/sdd/Siembra_Compuestos_y_Gases_Patron_2026-10-01.sql` | pendiente — **el script no se ejecuta hasta tenerla** (Gerencia, E-148) |
| P.2 · Ejecutar la siembra en producción tras desplegar (A, B, C, D) | Alfonso | paquete de despliegue | pendiente |
| P.3 · Contar antes de desplegar los tickets en Verificación y los de Equipo nuevo en En Proceso de los cuatro modelos | Alfonso | paquete de despliegue, puntos 2 y 3 | pendiente |
| P.4 · Verificación en la app tras desplegar (`ambientalia-desk.ambientalia.cloud`) | Calidad y Servicio Técnico | con quien decida Gerencia | pendiente |

**Puntos abiertos con destino** (de `tasks.md`): el cambio del compuesto no queda en `equipos_cambios` → F1B-02; el
compuesto del modelo no tiene pantalla → F1B-02 / F1D-01; equipos sin `modelo_id` quedan fuera de la guarda
(hipótesis: proporción sin medir) → F1B-02 o la siembra; quién corrige el compuesto → `decision/c10-permisos-cargo`.

**Seguimiento del verify:** WARNING — siembra no ejecutada; `.tsx` sin prueba (F0-00); lote 1 sobre la válvula de 720
(733 declarado); escritura jsonb de `custom_fields` sin ejercitar en Postgres real (hipótesis); `nosniff` de la ruta
redundante con `helmet`. SUGGESTION — aclarar el comentario de `gasPatron.ts:81`; tabla de siete columnas de TDD en
el próximo apply; repetir aquí P.1-P.4 (hecho).

## Despliegue

La nota literal del paquete de despliegue está al final de `tasks.md` («Nota para el cierre — paquete de
despliegue»). Lo esencial: desde el despliegue, toda Liberación desde Verificación pide el número del certificado
(también para los tickets que ya estén en Verificación ese día), y un equipo con compuesto y gas patrón vigente no se
libera desde En Proceso. Con la tabla de gases vacía y sin compuestos sembrados, el segundo efecto no alcanza a nadie.

## Barrido de citas (regla de mutación 4)

- `hojas-vida/spec.md`: la fusión inserta 138 líneas tras la `:310`; ninguna cita viva apunta a `:311-326`.
- `transitions-equipo-nuevo/spec.md`: la fusión SÍ desplaza líneas desde la `:41` (+2, +2, +7 y +270). Barrido
  `grep -rnoE "transitions-equipo-nuevo/spec\.md:[0-9]+(-[0-9]+)?"`: fuera de `openspec/changes/archive/` (excluido
  del detector, `apps/desk/server/citas/cli.ts:49`; sus citas son registro fechado, caso B) sólo hay dos, dentro de
  la propia spec, en las notas de la fusión: citaban la posición previa (`:263-271`, `:266-269` y `:201-209`). Caso
  B: se anclan a `28167e8`, la revisión anterior a la fusión, sin renumerar.
- `gases-patron/spec.md`: nueva, sin citas previas.
