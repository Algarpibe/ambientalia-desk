# apply-progress — `control-calidad-liberacion` (F1C-07, `cierra: no`)

## Lote 1a — catálogo, estado, fase, columna, mapa (intento I3) · HECHO

Tareas 1a.1 a 1a.7 marcadas en `tasks.md`.

### Evidencia TDD

| Tarea | ROJO (visto) | VERDE |
|---|---|---|
| 1a.1 línea base | `npx vitest run packages/shared apps/desk/server`: `1 failed, 4399 passed`; `npm run typecheck` en 0. El rojo es `registro.test.ts:220` («en curso» ve F1C-07 por el `proposal.md` de la planificación): **anterior al lote**, no es de 1a | — |
| 1a.2 catálogo | `Error: Cannot find module './camposControlCalidad' imported from .../controlCalidadCatalogo.test.ts` (módulo inexistente) | `controlCalidadCatalogo.test.ts` 7/7 |
| 1a.3 vigilantes | `packages/shared`: `21 failed, 1516 passed` (conteos 33→36, 22→23, 25→26, 41→44, tipos 16/14/13/4→17/16/13/4, columna, fase 11→12) | tras 1a.4–1a.6: `58 files, 1546 passed` |
| 1a.4 código | — | `camposControlCalidad.ts` (nuevo) + `estados.ts:99`, `fasesBlueprint.ts:55`, `columns.ts:30`, `transitions.ts:74`/`:262`, `decisionales.ts:2`/`:46`, todo en su línea |
| 1a.5 `cifras_ancladas` | `cifrasAncladas.test.ts`: `expected 33 to be 36`, `22 to be 23`, `41 to be 44` | solo `openspec/config.yaml:1360-1383` (6 líneas cambiadas, 6/6) |
| 1a.6 mapa | `mapaBlueprint.test.ts` anti-desfase rojo (`difiere`) | `npx tsx scripts/generar-mapa-blueprint.ts`: 6 ficheros escritos, 3 con cambio de contenido (+28/-18 = **46** líneas; la hipótesis era ≈ 40) |

### Vigilantes que el lote movió además de los de D6 (consecuencia del ciclo En Proceso ⇄ Control de calidad y de los nuevos tipos)

`bodegaje.test.ts` (9→10 reentrantes), `cargos.test.ts` (1.925→2.090), `reentrancia.test.ts` (C2 gana el estado y `envio_control_calidad`; 8→9 casos; 9→10 campos, 7→8 obligatorios: **`Fecha Finalización ST` pasa a ser reentrante**, S-16 del diseño), `invariantesGrafo.test.ts:137`, `estados.test.ts` («ninguna» 13→14), `transitions.test.ts:123` (28→31 heredan), `transitionsSoporteRemoto.test.ts:58`, `comentariosVigilados.test.ts` (obliga a `ticketService.ts:238` «otras 44»→47, una línea, mismo largo), `decisionales.test.ts` (tabla 14→16 con `FIRMA_CC`), y en servidor `permisos.test.ts` (99→108, 59/40→65/43, 60/39→66/42, 891→972), `cargoPermiso.test.ts` (99→108), `flujoSoporteRemoto.test.ts:112` (45→48), `transicionesEjecucion.test.ts:185`/`:188`/`:285` (tres casos en `CASOS`, 39→42 ejecuciones).
Con el interruptor sin construir (lote 2a), el barrido ejecuta las tres nuevas con 200 como cualquier otra: es la caracterización de hoy y 2a/2b la mueven (`409`/`403`).

### Mutaciones (a mano, con copia de seguridad y `cmp` tras restaurar; `herramientas/mut.mjs` no existe en el árbol)

| Mutación | Prueba que la caza | Rojo | Restaurado |
|---|---|---|---|
| M12 · aprobación `to: 'Por Entregar'` (`transitions.ts:262`) | `controlCalidadCatalogo.test.ts` «tipos, áreas, recorridos y campos»; `transicionesEjecucion.test.ts` «cada caso declara los mismos extremos» y «las 36 salen de su origen…» | sí (3 rojos) | `cmp` idéntico; 22/22 verdes |
| M14 · quitar `|| IDS_FIRMA_CC.has(t.id)` (`decisionales.ts:46`) | `controlCalidadCatalogo.test.ts` «devuelven null para un Especialista»; `decisionales.test.ts` «RQ-PM-35 · las dos de firma…» | sí (2 rojos, repetida tras mover la prueba al final del fichero) | `cmp` idéntico; 27/27 verdes |

Pendiente para 2b (no existe la prueba HTTP todavía): «aprobado lleva a Por Facturar» (2c) y «el 403 es el de firmante» (2b) caerían en estas mismas mutaciones con su lote.

### Códigos de salida (fin del lote)

- `npm run typecheck`: **0**.
- `npm test` (suite completa): `1 failed | 301 passed` → código 1 por `registro.test.ts` «11f/05g» (anterior al lote; ver riesgos).
- `npx eslint` sobre los siete ficheros de shared tocados o nuevos: 0.

### Citas desplazadas (para el barrido de la regla de mutación 4, lote 3)

Ninguna inserción en ficheros de producción: `estados.ts`, `fasesBlueprint.ts`, `columns.ts`, `decisionales.ts`, `transitions.ts`, `ticketService.ts`, `openspec/config.yaml` dan inserciones = borrados. En pruebas: `decisionales.test.ts` +11 líneas **al final** (nada anterior se mueve), `invariantesGrafo.test.ts`, `reentrancia.test.ts` sin cambio de longitud. Fuera de eso se movió **contenido** sin mover líneas: `transitions.ts:262` (ahora lleva también las tres transiciones, caso A de `:262` en citas que describan «lo que hay en :262»), `estados.ts:99`, `columns.ts:30`, `fasesBlueprint.ts:55`/`:67`, `decisionales.ts:46`, `ticketService.ts:238` (texto). `docs/artefactos/` se renumeró (alias del mapa: sólo `Anulado`, más las aristas nuevas); ninguna cita `ruta:línea` apunta ahí.

### Ficheros tocados

Nuevos: `packages/shared/src/camposControlCalidad.ts`, `packages/shared/src/controlCalidadCatalogo.test.ts`, este `apply-progress.md`.
Modificados: `packages/shared/src/{estados,fasesBlueprint,columns,decisionales,transitions}.ts`; pruebas de `packages/shared/src/` (`cifrasAncladas`, `estados`, `invariantesGrafo`, `tipoEvento`, `decisionales`, `transitions`, `transitionsSoporteRemoto`, `fasesBlueprint`, `columns`, `mapaBlueprint`, `prioridad`, `migracionTickets`, `bodegaje`, `cargos`, `reentrancia`); `apps/desk/server/{permisos,cargoPermiso,flujoSoporteRemoto,transicionesEjecucion}.test.ts`; `apps/desk/server/services/ticketService.ts:238` (un número en un comentario); `openspec/config.yaml` (sólo `cifras_ancladas`); `docs/artefactos/blueprint-{completo,fase-2-diagnostico,fase-3-cierre}.md`; `tasks.md`.

### Riesgos y supuestos

- **Rojo anterior, fuera del lote:** `registro.test.ts` «11f/05g» espera ocho «en curso» y ve F1C-07 (nueve) desde que existe `openspec/changes/control-calidad-liberacion/proposal.md`; se arregla al decidir cómo cuenta la reconciliación una tanda en curso (la regla de avance exige archivo). No lo toqué: no está en el lote 1a.
- **Supuesto reversible:** `IDS_FIRMA_CC` y las constantes viven en `camposControlCalidad.ts` y no se reexportan por `index.ts` en 1a (el diseño sólo exporta `controlCalidad.ts`, lote 1b); `controlCalidad.ts` las reexportará o el servidor las importará de la ruta del fichero.
- `Fecha Finalización ST` pasa a campo reentrante obligatorio (S-16 ya lo preveía): tres vigilantes lo cuentan.
