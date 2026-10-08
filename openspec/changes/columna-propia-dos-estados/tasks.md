# Tareas: columna propia para `Verificación` y `Solicitud Soporte`

Un solo lote de apply. Dos entradas de datos, sin lógica. Orden TDD estricto (D5 del diseño).
Requisitos: RQ-EN-07 (`transitions-equipo-nuevo`) y RQ-SR-03 (`transitions-soporte-remoto`).
Verify y archive no son casillas de este fichero.

## Lote 1 — rojo, verde y cierre

### 1. Rojo (no se toca `columns.ts`) — RQ-EN-07, RQ-SR-03
- [x] 1.1 Invertir en sitio `packages/shared/src/flujos.test.ts:125-128` y `:204-206` (texto de D4); el fichero sigue en 258 líneas.
- [x] 1.2 `packages/shared/src/columns.test.ts`: reescribir `:2` con el import de `ESTADOS` en la misma línea e insertar `solicitud_soporte` y `verificacion` en la lista de ids de `:7-8` (D2), sin cambiar líneas; `:1-40` conservan su posición.
- [x] 1.3 Añadir al final de `columns.test.ts`, tras una línea vacía, `COLUMNA_ANTES` y el `describe` con las aserciones (a)-(f) (D3).
- [x] 1.4 Correr `npx vitest run packages/shared/src/columns.test.ts packages/shared/src/flujos.test.ts` y ANOTAR en `apply-progress` qué falla. Esperado: lista de ids (21 frente a 23); (b) recibe `[]`; (c) recibe `'otros'`; (e) recibe `['Finalizado','Verificación','Solicitud Soporte']`; las dos de `flujos.test.ts` reciben `'otros'`. (a), (d) y (f) nacen verdes: son guardas. Si el fallo no coincide, parar y anotar la diferencia.

### 2. Verde — RQ-EN-07, RQ-SR-03
- [x] 2.1 `packages/shared/src/columns.ts:15`: `solicitud_soporte` en la misma línea física que `ticket_creado`, con el texto exacto de D1.
- [x] 2.2 `packages/shared/src/columns.ts:20`: `verificacion` en la misma línea física que `proceso`, con el texto exacto de D1.
- [x] 2.3 Repetir 1.4 y comprobar que todo pasa en verde.

### 3. Comprobaciones de cierre del lote
- [x] 3.1 `wc -l`: `columns.ts` = 47; `flujos.test.ts` = 258; `columns.test.ts` conserva sus líneas 1-40 en posición (`git diff` sin desplazamientos antes de `:42`).
- [x] 3.2 M1 (quitar `verificacion`): rojo en (b), (c), lista de ids y `flujos.test.ts:126-128`; restaurar.
- [x] 3.3 M2 (quitar `solicitud_soporte`): rojo en (b), (c), lista de ids y `flujos.test.ts:204-206`; restaurar.
- [x] 3.4 M3 (mover una de las dos de posición): rojo SÓLO en la lista de ids (`columns.test.ts:6-11`), la exhaustiva sigue verde; restaurar.
- [x] 3.5 M4 (añadir `'Pendiente'` a los `statuses` de una): rojo en (c) y (f), y (b) NO; restaurar. Tras cada mutación, `git diff` limpio de rastro.
- [x] 3.6 `npm test`, `npm run typecheck` y `npm run lint` en verde (lint: 165 avisos, 0 errores; confirma la hipótesis de que no hay `max-len`, D1).
- [x] 3.7 Detector de citas: `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` con código de salida 0.
- [x] 3.8 Barrido de la regla de mutación 4 (D8): `grep -rnoE "(columns|columns\.test|flujos\.test)\.ts:[0-9]+(-[0-9]+)?"` sobre el repositorio, cada cita contrastada con el fichero (qué AFIRMA, extremos inicial y final); segundo pase de abreviadas en los ficheros que ya citan el módulo.
- [x] 3.9 `git diff --stat` sin ningún fichero bajo `apps/desk/src` (criterio 11) y medida del intento: `git diff --shortstat --no-renames` más `wc -l` de lo nuevo sin trackear.

## Tareas de personas — fuera del recuento

No son casillas y **archivar no las da por hechas** (regla del ciclo 1).

| Qué | Dueño | Destino y dónde queda escrito |
|---|---|---|
| Comprobación visual: un ticket en `Verificación` y otro en `Solicitud Soporte` aparecen en su columna, en la posición de S-1; `Otros` deja de enseñarlos | Persona con acceso a la aplicación desplegada | `archive-report.md` de este cambio, como pendiente declarado |
| Respuesta a S-1 (posición), S-2 (rótulo) y S-3 (columnas vacías visibles sólo sin «ocultar vacías») | Gerencia | `openspec/config.yaml` → `decisiones_de_gerencia`, por la sesión que la recoja |
| Citas que quedan falsas de texto: `openspec/config.yaml:4193-4195`, `docs/sdd/ENTRADA.md:2133` y `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md:258-260` | Supervisión (no se editan en la rama) | Traspaso en el parte de cierre; el `archive-report.md` lo declara |

## Review Workload Forecast

| Concepto | Líneas |
|---|---|
| Código (`columns.ts`, 2 líneas modificadas) | ~4 |
| Pruebas (`columns.test.ts` ~18, `flujos.test.ts` ~8, import y lista ~4) | ~30-45 |
| `tasks.md` con casillas marcadas | ~25 |
| `apply-progress.md` | ~55 |
| **Total estimado** | **~130** |
| **×1,8** | **~235** |

Por debajo de 300 y de las 800 del presupuesto: un solo lote, sin partir. Es estimación, no medida; la medida se ejecuta al cerrar el intento (3.9). Sin `.tsx`.
