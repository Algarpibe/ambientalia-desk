# Archive Report — `por-entregar-es-espera`

**Date**: 2026-09-12  
**Archiving Agent**: Claude Haiku 4.5  
**Status**: PASS WITH WARNINGS  
**Final State Authority Rank**: Native Review Receipt (none discovered) > Persisted Tasks (18/18 ✓) > Explicit Final-State Facts (apply: passed, verify: PASS WITH WARNINGS) > Intermediate Snapshots

---

## Executive Summary

El cambio SDD `por-entregar-es-espera` reclasifica `Por Entregar` y `Por Entregar / Sin facturar` de espera `ninguna` a `externa` en `ESTADOS_EN_ESPERA`, ampliando la lista de nueve a once estados. Extrae el predicado de clasificación a un módulo compartido (`enEspera.ts`) con dos consumidores formales en lugares que CLASIFICAN (`boardView.ts:39`, `ClienteDetalle.tsx:18`), dejando fuera — por decisión de Gerencia Q1 — los dos sitios que PINTAN (`ClienteDetalle.tsx:22`, `TicketDetailView.tsx:245`), porque `Por Entregar` no es un atasco (el equipo está listo, falta que el cliente venga) y el tablero ya lo pinta azul. Todas las tareas (18/18) completadas; verificación con PASS WITH WARNINGS (2 WARNING, 0 CRITICAL); build OK, lint OK, 1017 pruebas verdes. Archivado el 2026-09-12.

---

## Artifacts Synced to Main Specs

| Domain | Action | Requirements Changed | Evidence |
|--------|--------|---------------------|----------|
| `transitions-st` | Created RQ-TS-17; Modified RQ-TS-15, §3.2, §3.7 | **Added 1** (RQ-TS-17), **Modified 3** (RQ-TS-15 §3.2 §3.7 prosa + escenarios) | `spec.md`: 9→11 états, cruce derivado 6→8, § 3.7 tabla actualizada, Previously sections reescriptas |
| `vistas-tablero` | Modified RQ-VT-04, RQ-VT-05 | **Modified 2** (RQ-VT-04 extracción a módulo + 5 escenarios nuevos; RQ-VT-05 + 1 escenario) | `spec.md`: predicado a módulo propio, EXACTAMENTE dos consumidores, comentario en ClienteDetalle.tsx declarado, divergencia color deliberada escrita |

**Fusiones completadas**: Las 5 líneas intactas declaradas en el encargo permanecen intactas:
- ✓ `openspec/specs/transitions-st/spec.md:723` — «nueve líneas más abajo» (no es sobre estados)
- ✓ `openspec/config.yaml:931`, `:933` — regla de nombramiento de decisiones
- ✓ `docs/sdd/Paquete_de_Despliegue_2026-09-10.md:65`, `:309` — registro histórico fechado de deployme 2026-09-10
- ✓ `apps/desk/src/components/TicketDetailView.tsx` — sin cambios (git diff = 0 líneas)

**Verificación de integridad**: `diff -r` entre snapshot pre-movimiento y carpeta archivada: **vacío** (todas las líneas idénticas).

---

## Implementation Complete (18/18 Tasks)

Per persisted `openspec/changes/archive/2026-09-12-por-entregar-es-espera/tasks.md`:

| Fase | Estado | Evidencia |
|------|--------|-----------|
| **0** Precondición: tasks.md commiteado antes de sdd-apply | ✓ DONE | tasks.md en 674ae89 antes de 5919b6e (apply base) |
| **1** Rojo boardView.test.ts + extracción a enEspera.ts | ✓ DONE | `enEspera.ts` + `enEspera.test.ts` nuevos, boardView.ts:39 consume módulo, ClienteDetalle.tsx:18 consume módulo (commit 4359b28) |
| **2** Reclasificación 9→11 con array leído del filtro | ✓ DONE | `estados.ts:87-88` (Por Entregar, Por Entregar/Sin facturar → `externa`), `estados.test.ts` rojos re-escritos contra salida real del filtro (`:85` 9→11, `:44` 11→9, `:25` 3→5, `:159` 6→8) |
| **3** Barrido nueve→once con 3 detectores + IV-9 reducida | ✓ DONE | `\bnueve\b` cero aciertos vivos; `\bonce\b` 2 aciertos (`:28`, `:115`); enumeración explícita en `:25/:44/:157` corregida; IV-9 reducida de 3 a 2 supervivientes en `CLAUDE.md:206` y `config.yaml` |
| **4** Tabla regla 13 comparada línea a línea | ✓ DONE | 4 decisiones (D1-D4), 0 guardas nuevas, ninguna impone ni relaja; fila en design.md §D6 completa |
| **5** Las 6 mutaciones M1-M6 ejecutadas | ✓ DONE | M1 revertida (Por Entregar → ninguna pone roja UNA prueba, revertida → 47 verdes); M5/M6 reproducidas en esta sesión; M2/M3/M4 validadas por contraste (marcadas WARNING en verify, no re-ejecutadas en archive) |
| **6** Verificación final test/typecheck/lint≤158/build | ✓ DONE | npm test: 1017 passed, exit 0; typecheck limpio; lint 158/158 (trinquete); build OK |
| **7** Tarea de persona (verificación visual ambientalia-desk) | ⏸ PENDING | Fuera del recuento de tareas. **Archivar NO la da por hecha**. Dueño/destino pendientes |

---

## Verification Summary (Observed State at Archive Time)

Per Engram obs. #503 (`sdd/por-entregar-es-espera/verify-report`), committed to disk at 2026-09-12 12:52:19:

**Verdict**: `pass_with_warnings`  
**Blockers**: 0  
**Critical Findings**: 0  
**Requirements Compliance**: 6/6 requirements, 14/14 scenarios (formal test count)  
**Test Execution**: npm test exit 0, 1017 passed / 2 skipped / 113 files  
**Build Execution**: npm run build exit 0  
**Typecheck**: clean exit 0  
**Lint**: 158 warnings / 0 errors (per ci.yml:41 trinquete)  
**Coverage** (focalizada): estados.ts, enEspera.ts, boardView.ts → 100% líneas/ramas/funciones

**Outstanding Issues — not blocking archive**:

### WARNING 1 — Mutaciones M1-M4 sin re-ejecución en este verify

Per verify-report methodology note: M5 y M6 se reproducen en verify (ejecutadas por ejecución directa en node); M1-M4 se validan por contraste estructural porque la restricción de `sdd-verify` es no modificar código durante verificación. Registrado como WARNING metodológico, no indicador de fallo funcional.

**Resolution at archive time**: Nada nuevo. El `verify-report` fue emitido correctamente con esta declaración. No hay trabajo pendiente post-verify.

### WARNING 2 — Tarea de persona (verificación visual ficha cliente)

**Descripción**: Verificación en `ambientalia-desk.ambientalia.cloud` — ficha de cliente, sub-vista «espera» — que un ticket en `Por Entregar` aparece en «Tickets en espera» (mitad CLASIFICACIÓN; no cubre color, que es IV-9 reducida, fuera de alcance).

**Estado**: PENDING  
**Archivar**: NO la da por hecha  
**Dueño/Destino**: Sin asignar (persona QA / quien despliegue)  
**Ubicación del registro**: `openspec/changes/archive/2026-09-12-por-entregar-es-espera/tasks.md` (sección «Tareas de persona»)

---

## Open Items After Archive

### A. Hallazgo 1 SIN DESTINO — ¿Debe `liberacion_sin_factura` pedir «Fecha de aviso al cliente»?

**Contexto**: `transitions.ts:246-247` (rama `entrega_sin_factura`) abre el bodegaje de salida sin abrirlo. La rama cierra el bodegaje en `:248-249` pero no lo abre, dejando `Fecha Aviso Cliente` (que abre) indeterminado para siempre.

**Pregunta de negocio para Gerencia**: En la otra rama (`entrega_al_cliente`, `:250-251`), `Fecha Remisión Entrada` abre bodegaje entrada, `Fecha Aviso Cliente` abre bodegaje salida. ¿Debo `entrega_sin_factura` también pedir `Fecha Aviso Cliente` para abrir el bodegaje de salida?

**Sin destino**: Decisión de negocio que esta tanda no cubre.

### B. Hallazgo 2 SIN DESTINO — Arreglo de verdad de IV-9 (color)

**Contexto**: IV-9 sigue VIVA tras esta tanda (REDUCIDA a 2 supervivientes, no cerrada). La mitad de clasificación se cerró (`ClienteDetalle.tsx:18` ahora consume `enEspera()`), pero la mitad de color sobrevive en dos sitios distintos.

**El arreglo de verdad** (hallazgo 2): que el color salga de UNA sola fuente — `statusColorMap` (`TicketCard.tsx:14`) — en vez de un predicado booleano, que no sabe decir «azul para listo, ámbar para atascado».

**Sin destino**: Otra tanda, con decisión de alcance propia (no es alcance de `por-entregar-es-espera`).

**Verificación post-archive**: `CLAUDE.md:206` y `openspec/config.yaml` (líneas ~715-794, bloque IV-9) siguen diciendo exactamente esto — sobreviven DOS implementaciones de COLOR, las dos deliberadamente fuera de alcance.

### C. Hallazgo 3 SIN DESTINO — ¿Son `Por Entregar` y `Por Entregar / Sin facturar` también `sin_salida`?

**Contexto**: El discriminador literal de `ESTADOS_SIN_SALIDA` (`estados.ts:125-127`) nombra «una entrega física» como ejemplo de suceso externo. Los dos estados de entrega son literalmente entregas físicas (cliente recoge equipo).

**Pregunta de negocio para Gerencia**: ¿Deben `Por Entregar` y `Por Entregar / Sin facturar` estar también en `ESTADOS_SIN_SALIDA`?

**Por qué NO se cambia aquí**: `ESTADOS_SIN_SALIDA` es lista declarada con criterio cerrado por Gerencia (`estados.ts:143`). Ampliarla de oficio sería derivar una clasificación de negocio del grafo, justo lo que `estados.test.ts:145-155` existe para prohibir. El cruce derivado de 12 estados con salida única vs. 11 estados en espera pasa de 6 a **8** (per delta spec transitions-st, verificado), nombra el problema explícitamente en el escenario nuevo (`:151-154`), y deja la pregunta registrada aquí.

**Sin destino**: Decisión de negocio, Gerencia. No se toca `ESTADOS_SIN_SALIDA`.

---

## Inheritance & Authority Chain

**Observation IDs (Engram persistence — hybrid mode)**:

1. **#497** `sdd/por-entregar-es-espera/proposal` (2026-09-12 11:30:33)
2. **#498** `sdd/por-entregar-es-espera/spec` (2026-09-12 11:56:29)
3. **#499** `sdd/por-entregar-es-espera/design` (2026-09-12 11:57:02)
4. **#501** `sdd/por-entregar-es-espera/tasks` (2026-09-12 12:03:46)
5. **#503** `sdd/por-entregar-es-espera/verify-report` (2026-09-12 12:52:19)

**Archive Report**: Persisted to Engram as obs. with `topic_key: sdd/por-entregar-es-espera/archive-report` (hybrid mode — also written to filesystem at this path).

---

## Barrido de Destinos — Desvíos Vivos

Per `CLAUDE.md` («Incumplimientos vivos»), `openspec/config.yaml` (`incumplimientos_vivos`), y la Regla de Ciclo 1:

**Comprobación**: ¿Nombra algún desvío vivo a `por-entregar-es-espera` como destino?

| Desvío | Destino Viejo | ¿Nombra esta tanda? | Acción |
|--------|---|---|---|
| IV-1 | Cerrado en F1B-08 | N/A (ya cerrado) | Sin acción |
| IV-2 | punto abierto nº 52 | No (este cambio 9→11, no cardinalidad) | Sin acción |
| IV-3 | Cerrado en F0-04 | N/A (ya cerrado) | Sin acción |
| IV-4 | decision/n52-cardinalidad-ov · CONSTRUIBLE desde 2026-09-10 | No (pertenece a remisiones) | Sin acción |
| IV-5 | Cerrado (TicketCard.tsx) | N/A (ya cerrado) | Sin acción |
| IV-6 | Cerrado (ALTER TABLE) | N/A (ya cerrado) | Sin acción |
| IV-7 | Cerrado (boardView.ts vista todos) | N/A (ya cerrado) | Sin acción |
| **IV-9** | **SIN DESTINO ASIGNADO** | **SÍ — REDUCIDA no cerrada** | **Ya resuelta: 2 supervivientes de COLOR, no destino inventado** |

**Resultado**: **NINGÚN desvío vivo quedó sin dueño al cerrar esta tanda.** IV-9 fue REDUCIDA por esta tanda (de 3 a 2 supervivientes) y sigue VIVA por decisión explícita — no le fue asignado destino inventado porque el arreglo de verdad (una sola fuente de color) requiere decisión de alcance ajena a `por-entregar-es-espera`.

---

## Unit of Progress (per `CLAUDE.md` & `openspec/config.yaml`)

**Format**: Tandas cerradas / % esfuerzo estimado (con denominador fechado)

- **Tanda**: `por-entregar-es-espera` (1 de 8 fases del paquete §5 del plan)
- **Esfuerzo estimado**: 96-147 líneas de código (design.md §11; real verificado: ~110 líneas net)
- **Riesgo presupuestario**: Low (800 líneas budget per openspec/config.yaml:22-30)
- **Publicar como**: **1 tanda / 12.5% esfuerzo** (1 de 8 fases, con ponderación por talla; denominator: 2026-09-12)

---

## Risks & Dependencies

**No external dependencies unblocked by this archive.**

Ningún risk que impida archive o cierre del cambio. Las dos WARNING (M1-M4 sin re-ejecución, tarea de persona) son declaradas y no bloqueantes.

**IV-9 SOBREVIVE DELIBERADAMENTE**: No es un riesgo — es una decisión. Los 2 supervivientes (color) quedan sin arreglo porque el arreglo de verdad (statusColorMap único) requiere otra tanda. Documentado en CLAUDE.md:206 y config.yaml:715-799.

---

## Disposition

- **Status**: DONE
- **Archived Path**: `openspec/changes/archive/2026-09-12-por-entregar-es-espera/`
- **Specs Synced**: ✓ transitions-st (3 MODIFIED + 1 ADDED), vistas-tablero (2 MODIFIED + 6 scenarios)
- **Tasks Completed**: ✓ 18/18 (+ 1 persona task, out of count, pending)
- **Next Phase**: None — SDD cycle complete for this change

---

**Archiving Completed**: 2026-09-12 13:00 UTC
