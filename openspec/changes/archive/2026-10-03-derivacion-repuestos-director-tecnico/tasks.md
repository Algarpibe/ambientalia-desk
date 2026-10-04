# Tareas: «Solicitud repuestos» deriva al Director Técnico y «Entrega de Repuestos» devuelve al técnico (F1C-11)

Worktree `C:\dev\Desk_2_R1.023-worktrees\derivacion-repuestos-director-tecnico`, partida `f55b7d9`. Preflight: auto · hybrid · ask-on-risk · 800 (válvula 720) · strict_tdd. Un solo lote (D-7). Regla de forma (D-1): en ficheros citados, sólo ediciones en la misma línea o añadidos al final, también en pruebas. Citas contra el árbol del 2026-10-03.

## Review Workload Forecast

| Sumando | Líneas |
|---|---|
| Código (`transitions.ts` 12, `cargos.ts` 6, `sla.ts` 4) | 22 |
| Pruebas: ~203 brutas × 1,8 (en sitio cuenta 2) | ~365 |
| Casillas de `tasks.md` | ~60 |
| `apply-progress.md` | ~100 |
| `ENTRADA.md` y texto del maestro | ~40 |
| **Total (hipótesis)** | **~587** |

Margen: 133 contra 720 y 213 contra el techo de 800. Válvula: si tras 3.x la medida real pasa de 560, 4.8-4.10 y `apply-progress.md` van a un segundo lote.

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

(Sin PR: una rama, fusión a `main` tras el `settle`. El techo operativo es el del registro de intentos.)

| Unidad | Meta | Prueba focal | Arnés real | Reversión |
|---|---|---|---|---|
| 1 | Dos entradas en `DERIVACION_POR_DEFECTO` y octavo cargo | `npx vitest run packages/shared/src/transitions.test.ts packages/shared/src/sla.test.ts packages/shared/src/cargos.test.ts apps/desk/src/lib/personas.test.ts apps/desk/server/transiciones.test.ts apps/desk/server/cargoPermiso.test.ts` | `POST /api/tickets/:id/transition` con `solicitud_repuestos` y `entrega_repuestos` contra pg-mem (N4) | `git revert` del commit del lote |

## Fase 1 — Rojo (con el dato viejo)

- [x] 1.1 Abrir el intento en este worktree; línea base `npm test`, `npm run typecheck`, `npm run lint` (165 avisos, 0 errores); anotar `wc -l` de `sla.ts`, `sla.test.ts`, `cargos.test.ts` y `transitions.test.ts`.
- [x] 1.2 RED R1 `packages/shared/src/transitions.test.ts:73`, `:79-93`: mapa de cinco, las dos nuevas en la línea de `:87` y `:91`; 31 − 5 = 26.
- [x] 1.3 RED R2 y R3 `packages/shared/src/sla.test.ts:112-119` y `:178-182` (mismas líneas): `En Proceso` → `Director Técnico` por `solicitud_repuestos`; `Solicitado` y `Por Facturar` → `ningun_cargo`; lista `['Rev./Diagnostico', 'Notificado', 'En Proceso']`. Además `:93` y `:95` (rango viejo 267-276 → `:274-282`, abreviada → `:275`).
- [x] 1.4 RED R4, R5 y R6 `packages/shared/src/cargos.test.ts:22-30`, `:57-62`, `:204-205`: octavo literal, `toHaveLength(8)`, `1870`. Al final del fichero, `cargoDeRespaldoDeLaDecision()` (D-3); `cargosDeLaDecision()` (`:45-55`) no se toca; «Guardián sin objeto» si no acierta.
- [x] 1.5 RED N2 `packages/shared/src/cargos.test.ts`, al final: `esCargo('Especialista técnico')`, `cargoPermisoDelCuerpo` lo acepta y sus veredictos sobre las 31 son los de `Técnico`.
- [x] 1.6 RED R7 `apps/desk/server/permisos.test.ts:356`, `:368`, `:446`, `:458` (`837` = 31 × 3 × 9) y R8 `apps/desk/server/prioridadTop5.test.ts:150`, `:157`, `:359`, `:366` («diez … ocho cargos», `toHaveLength(10)`; `aceptados` sigue en 2).
- [x] 1.7 RED N3 `apps/desk/server/cargoPermiso.test.ts`, al final: alta y edición con `cargoPermiso: 'Especialista técnico'`; hoy `422`.
- [x] 1.8 RED N1 `apps/desk/src/lib/personas.test.ts`, al final: `derivacionInicial` con el `porDefecto` **real** de `TRANSITIONS` (D-2): gana el Director Técnico plegado, el primero de dos, y cae al heredado sin titular, en el mismo `it`; `entrega_repuestos` devuelve al primer derivado y cae si es nulo o inactivo.
- [x] 1.9 RED N4 `apps/desk/server/transiciones.test.ts`, `describe` nuevo al final: ticket en `En Proceso` con historial (patrón `:97-112`); `solicitud_repuestos` al Director Técnico → `200`, `Solicitado`, aviso sólo a él (patrón `:166-187`); `entrega_repuestos` con el `primerDerivado` del detalle → `200`, `En Proceso`, aviso al técnico.
- [x] 1.10 N5 en ese `describe`: `derivado_a` activo que no es el Director Técnico → `200`; dado de baja → `422`. **Caracterización: nace verde** (el servidor no cambia, `ticketService.ts:138-142`); su detector es M7.
- [x] 1.11 Confirmar el rojo de R1-R8, N1-N4 con la prueba focal y anotar cuáles fallan; N5 debe estar verde. Si alguna de R/N no se pone roja, se anota y no se toca.

## Fase 2 — Verde

- [x] 2.1 `packages/shared/src/cargos.ts`: `:14` añade `'Especialista técnico'` (técnico en minúscula, como `openspec/config.yaml:3494`); `:9-10` comentario, en sitio.
- [x] 2.2 `packages/shared/src/transitions.ts`: seis líneas en sitio, las del diseño D-1 (`:269`, `:272`, `:275`, `:276`, `:280`, `:281`); `:277-279` intactas y primer literal de `:276` en la columna 41.
- [x] 2.3 `packages/shared/src/sla.ts`: cuatro líneas de comentario en sitio (el 268 → `:275` en `:66`, el 271 → `:278` en `:70`). Sin líneas netas.
- [x] 2.4 Prueba focal y `npm test` en verde; `wc -l` de los cuatro ficheros igual que en 1.1 (cero netas).

## Fase 3 — Mutaciones (se reproducen, se ven rojas, se revierten con `git diff`)

- [x] 3.1 M1: quitar `solicitud_repuestos` → rojas R1, R2, R3, N1, N4.
- [x] 3.2 M2: quitar `entrega_repuestos` → rojas R1, N1, N4; cambiarla a `cargo` → además R2 y R3.
- [x] 3.3 M3: otro cargo en `solicitud_repuestos` → rojas R1, R2, N1, N4.
- [x] 3.4 M4: mover «Especialista técnico» en `CARGOS` → rojas R4, R5.
- [x] 3.5 M5, **sobre el fichero vigilado**, en sitio en `openspec/config.yaml:3494`: «Especialista técnico» → «Especialista tecnico» → roja R5 por desigualdad; quitar «no está entre los siete cargos» → roja R5 por «Guardián sin objeto». Revertir y `git diff --stat openspec/config.yaml` vacío.
- [x] 3.6 M6: quitar el octavo → rojas R4, R5, R6, R7, R8, N2, N3.
- [x] 3.7 M7: rechazar en `ticketService.ts` un derivado distinto del propuesto → roja N5 (la única que lo caza).

## Fase 4 — Cierre

- [x] 4.1 `npm test`, `npm run typecheck`, `npm run lint` (165 avisos exactos, 0 errores).
- [x] 4.2 **Medida y válvula** antes del commit: `git diff --shortstat --no-renames f55b7d9` más `wc -l` de lo nuevo sin trackear; si pasa de 560, partir (ver forecast). Registrar la cifra.
- [x] 4.3 Commit `feat(tickets): derivación de «Solicitud repuestos» al Director Técnico y octavo cargo (F1C-11, cierra: si)`.
- [x] 4.4 Detector: `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` con 0 bloqueantes.
- [x] 4.5 Barrido de citas (regla 4, D-6), **sin excluir `openspec/changes/archive/`**: `grep -rnoE "(transitions|cargos)\.ts:[0-9]+(-[0-9]+)?"` y los de `sla.ts`, `sla.test.ts`, `cargos.test.ts`, `transitions.test.ts`, `personas.test.ts`, `permisos.test.ts`, `prioridadTop5.test.ts`, `cargoPermiso.test.ts`, `transiciones.test.ts`; cada resultado leído contra el fichero, principio y final del rango.
- [x] 4.6 Pase de abreviadas en los ficheros que citan esos módulos (`CLAUDE.md`, `openspec/config.yaml`, specs vivas de `derivacion-avisos`, `permissions`, `transitions-st`, comentarios editados). Reparar caso A, B o C; nunca renumerar a ciegas. Lo de D-6 que no se toca (casos B y C, delta al archivar) se confirma, no se edita.
- [x] 4.7 Regla 13 por escrito en `apply-progress.md`, decisión a decisión con la tabla de D-5: el relleno de «Derivado a» (`TransitionPanel.tsx:87-94`) es comodidad sin imposición (`ticketService.ts:138-142`, N5); el octavo cargo es espejo legítimo (N3).
- [x] 4.8 `docs/sdd/ENTRADA.md`, **al final**, desde **E-160**: (a) pregunta S-1, ¿la derivación al Director Técnico se propone o se impone?; (b) hallazgo de `docs/artefactos/blueprintserviciotecnico.html:390` («estas tres proponen a otro»), fuera de alcance, sin dueño asignado.
- [x] 4.9 `docs/sdd/F0-01_Correcciones_para_el_maestro.md`, **al final** (tras «La de F1B-03, parte L (20)»): texto para M1.9.2, «tres proponen» pasa a cinco, con la recolocación de las 26 que heredan. El `.docx` no se toca.
- [x] 4.10 Medida final tras 4.8-4.9, antes del `settle`; registrar. Segundo commit `docs(sdd): entradas y correccion de M1.9.2 de F1C-11`; luego `settle` y fusión a `main`.

## De personas — no son tareas de esta tanda; archivar no las da por hechas

| Tarea | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|
| Asignar el cargo «Especialista técnico» a Johny Luna en producción | Gerencia o administrador | Condición de **despliegue**: sin titular la propuesta cae al heredado | `DEPLOY.md` y paquete de despliegue |
| Confirmar el `users.cargo` del Director Técnico en producción (plegado «director tecnico») | Gerencia | Condición de **despliegue** | Paquete de despliegue |
| S-1: ¿se propone o se impone? | Gerencia | Si se impone, cambio nuevo | `docs/sdd/ENTRADA.md` (4.8) |
| Regenerar o corregir `blueprintserviciotecnico.html:390` | Sin asignar | Hallazgo en bandeja | `docs/sdd/ENTRADA.md` (4.8) |

## Instrucciones para `verify` y `archive` (sin casilla)

- `verify`: re-ejecutar M1-M7 contra el árbol de ese día; su informe cuenta en el presupuesto.
- `archive`: el delta corrige «tres entradas / 28» (`derivacion-avisos/spec.md:78-111`) y «siete cargos» (`permissions/spec.md:284`, `:422`, `:462`); `:656` se corrige en la fusión. Medir antes de aplicar (≤ 800); commit sólo de este cambio.

**Recuento de tareas ejecutables: 32** (Fase 1: 11, Fase 2: 4, Fase 3: 7, Fase 4: 10). Personas: 4, fuera del recuento.
