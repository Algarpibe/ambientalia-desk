# Archivo: Alta manual de equipo y cliente desconocidos (F1B-15)

## Cobertura de la fila F1B-15 (R-1)

**Cubre** todo el contenido de la fila (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:95`, origen E-129 en
`docs/sdd/ENTRADA.md:1554`): alta manual de equipo y de cliente provisional, enlace con Books, validación del equipo y
guarda de «Habilitar Servicio»; **deja fuera** sólo tareas de persona (abajo) y el aviso P-A, que pasa a la bandeja.
`cierra: si`.

Decisiones de Gerencia que reorientaron la tanda: E-152 (la vista `public.clients` no se toca, `docs/sdd/ENTRADA.md:1751`)
y E-153 (P-B, el alta rechaza un NIT que ya está en Books, `:1756`). E-154 (NIT genéricos exentos, `:1761`) sigue
**abierta** y no es trabajo de esta tanda.

## Commits de la rama `alta-manual-equipo-cliente` (desde `cc76d98`)

| Commit | Qué |
|---|---|
| `9910430` | Lote 1: tabla de clientes provisionales y su resolución en el servidor, sin tocar la vista |
| `9e0f468` | Lote 2a: alta manual de equipo y cliente provisional con su traza |
| `96ec938` | Lote 2b: P-B, `409` con candidatos cuando el NIT ya está en Books |
| `8cb209a` | Documental: RQ-TC-30 alineado con el escalón A y los candidatos del `409` |
| `8bd4121` | Lote 3: enlace, validación del equipo y guarda de «Habilitar Servicio» |
| `ba7547e` | Lote 4: interfaz, candidatos del `409`, `pendienteValidar` en la ficha |
| `51157f2` | `verify-report.md` |
| `099d11f` | Prueba de W-3: tras validar, la ficha y la hoja de vida no llevan `pendienteValidar` |
| `91e4924` | Documental: cierra W-1, W-3 (requisito), W-4, W-5 y W-7; adenda fechada del verify |
| (este) | Archivo: fusión de las cuatro deltas, mudanza a `archive/`, anclas caso B en `rechazo-solo-comercial` |

## Registro de intentos (`gentle-ai sdd-attempt`)

| Intento | Unidad | Resultado | Líneas |
|---|---|---|---|
| 1 | Lote 1 (sondeo de la vista) | interrumpido; replanificado tras E-152 (reset de mantenedor) | 0 |
| 2 | Lote 1 | passed | 684 |
| 3 | Lote 2a | passed | 597 |
| 4 | Lote 2b (P-B) | passed | 276 |
| 5 | Lote 3 | passed | 553 |
| 6 | Lote 4 | passed | 409 |
| 7 | Verify | passed | 286 |
| 8 | Prueba de W-3 | passed | 19 |
| 9 | Este archivo | abierto al escribir este informe | — |

Acumulado de los intentos 1-8: 2.824 líneas. Ningún intento pasó del techo de 800.

## Verify

`verify-report.md` (commit `51157f2`): **PASS WITH WARNINGS**, 0 CRITICAL, 7 WARNING, 8 SUGGESTION. En `ba7547e`:
`npm test` 2543 pasan y 2 omitidas; tras `099d11f`, 2544 y 2. `lint` 165 avisos (techo), `typecheck` y `build` limpios,
detector de citas con 0 bloqueantes. La adenda fechada (`verify-report.md:288`) registra lo cerrado después; el veredicto
no se reescribió.

| Hallazgo | Estado al archivar |
|---|---|
| W-1 | Cerrado en `91e4924`: la matriz de `tasks.md:134` pasa a 47 escenarios y 11 requisitos (44 y 10 verificados, más los tres de RQ-HV-19); `91e4924` escribió 45 por error y se corrige en este commit |
| W-2 | **Anotado**: los dos «fallo a mitad» (TC-31 y TC-32) se prueban por la secuencia `BEGIN`/`ROLLBACK`, no por el estado final, porque pg-mem no revierte un `ROLLBACK` |
| W-3 | Cerrado: la prueba que faltaba (equipo validado, columna en `false`) en `099d11f`, `apps/desk/server/routes/altaManual.test.ts:280`, con la mutación de `apps/desk/server/db/equipos.ts:115` en rojo; el requisito RQ-HV-19 en `91e4924` |
| W-4 | Cerrado en `91e4924`: siete supuestos reversibles en `proposal.md:109` y siguientes |
| W-5 | Cerrado en `91e4924`: destino de la verificación en la app en `tasks.md:132` |
| W-6 | **Anotado**: formato TDD incompleto en `apply-progress.md` y siete pruebas que nacen verdes, todas con mutación |
| W-7 | Cerrado en `91e4924`: `design.md:194` apunta a `packages/shared/src/types.ts:8` (caso A) |

## Fusión de las deltas en las specs vivas

Medida **antes de aplicar**, en un worktree aparte (`amec-medida-archivo`, sobre `91e4924`); los cuatro ficheros se
copiaron a la rama y su sha256 es idéntico al medido.

| Spec | Numstat | Qué entra |
|---|---|---|
| `hojas-vida` | +105 / −0 | RQ-HV-16, RQ-HV-17, RQ-HV-18 y RQ-HV-19 (14 escenarios), desde `openspec/specs/hojas-vida/spec.md:453` |
| `tickets-core` | +176 / −0 | RQ-TC-30 a RQ-TC-34 (23 escenarios), desde `openspec/specs/tickets-core/spec.md:1452` |
| `transitions-st` | +53 / −5 | RQ-TS-32 (7 escenarios) en `openspec/specs/transitions-st/spec.md:1416`, y cinco filas de §3.8 editadas en sitio |
| `zoho-sync` | +27 / −0 | RQ-ZS-16 (3 escenarios) en `openspec/specs/zoho-sync/spec.md:675` |
| **Total** | **366** | 11 requisitos, 47 escenarios |

**§3.8 de `transitions-st`** (lo pedía la delta en su apartado «Fuera de alcance — para el `archive-report`»): las guardas
del alta manual, contrastadas con `apps/desk/server/services/ticketService.ts` en `91e4924`, entran en la tabla de
escalones (`openspec/specs/transitions-st/spec.md:1155`, `:1157`, `:1158`): A `:25` equipo manual o nuevo y `:28` cliente
provisional; C `:91` contenido del alta manual; D `:96` NIT ya en Books, antes de la OV ya usada, que sigue última. La
fila `createManagedTicket` (`:1180`) las lista en el orden del código (`:24` · `:25` · `:27` · `:28` · `:39` · …), y la
tabla de puertas (`:1225`) pasa a `A A A A A C C C C C D D`: la quinta C, la última, es el contrato vencido.

## Barrido de citas (regla de mutación 4)

Las cuatro inserciones van en medio de cada spec. Barrido de la forma completa sobre todo el repositorio, **sin excluir
`archive/`**, con umbral por fichero (`hojas-vida` > 450, `tickets-core` > 1449, `transitions-st` > 1413,
`zoho-sync` > 672): sólo cuatro citas, todas `transitions-st/spec.md:1545`, en
`openspec/changes/archive/2026-10-02-rechazo-solo-comercial/` (`design.md:85`, `exploration.md:87`,
`specs/transitions-st/spec.md:209`, `tasks.md:63`).

**Ya estaban rotas antes de esta fusión.** La fusión de `rechazo-solo-comercial` (`b16cbb4`) las desplazó: en `7e58874`
la línea 1545 es un paso de escenario. Lo que afirman es la fila «Permisos por área | 102 (60/42) → 93 (54/39)…», que es
la línea 1545 en `4984c3b` (= `b16cbb4^`). Reparadas como **caso B**, ancladas `en 4984c3b`.

Segundo pase sobre la forma abreviada, en los ficheros que citan esas cuatro specs: dos líneas más del mismo cambio
archivado llevan la misma afirmación (`apply-progress.md:50` y `verify-report.md:152` de `rechazo-solo-comercial`, con
`transitions-st/spec.md:63`, la `:1630` y la `:1545`); en `4984c3b` las tres dicen lo que se afirma, así que se anclan
igual. Las otras cuatro abreviadas que salen por encima del umbral apuntan a otro fichero o describen una cita rota, y
no cambian. En total, **seis líneas** editadas en sitio.

## Medida (regla del archivo)

Parte con carga de revisión: 366 (fusión) + 12 (seis anclas en sitio) + este informe. La mudanza de la carpeta queda
fuera del techo. La cifra final del intento, con `git diff --shortstat --no-renames`, la registra el `settle`.

## Supuestos reversibles

Están en `proposal.md`, sección «Supuestos reversibles aplicados durante la construcción» (`:109`): orden del enlace,
validar con `false`, todos los candidatos del `409`, DV pegado, lectura de todo Books, NIT vacío tras normalizar y
`pendienteValidar` como alcance añadido. Q1-Q4 siguen en `proposal.md:61-70`.

## Tareas de persona (regla del ciclo 1: archivar no las da por hechas)

| Tarea | Dueño | Destino |
|---|---|---|
| Q1/Q2 (Anexo D nº 83): quién hace el alta manual y si los cinco datos son el mínimo | Gerencia | `openspec/config.yaml` → `decisiones_de_gerencia` |
| P-A: aviso a Comercial cuando un contacto de Books comparta NIT con un provisional sin enlazar | Gerencia (alcance y destino) | entrada nueva en `docs/sdd/ENTRADA.md` (no es E-154) |
| Verificación en la app tras desplegar (alta manual, enlace, validación, «Habilitar Servicio») | Persona de Comercial | §6 del próximo paquete de despliegue que incluya F1B-15 |

## Queda anotado

- **W-2 y W-6**, arriba.
- **F1F-03**: el coste de leer todos los contactos de Books en cada alta manual es hipótesis sin medir
  (`design.md:152-156`); se mide con el volumen real en F1F-03.
- **E-154**: lista de NIT genéricos exentos, decisión de Gerencia, abierta.

## Pendiente tras este commit (fuera del commit de archivo, como hizo `72ac490` con F1C-10)

- `apps/desk/server/reconciliacion/registro.test.ts:220`: quitar `F1B-15` de «en curso» y regenerar
  `docs/sdd/RECONCILIACION.md`.
- Registrar P-A en `docs/sdd/ENTRADA.md`.
- No fusionado a `main`.
