# apply-progress: tres-transiciones-cifra-anclada (F1C-09, cierra: si)

Modo: strict TDD, `npm test` (vitest run). Partida `fd253aa`. Lote A de dos (tareas 1.1-4.2). Lote B pendiente (5.1-10.4).

## Lote A

### Rojo (1.10) — `npx vitest run` antes de tocar `transitions.ts`: 30 rojos, 2379 verdes (+8 pruebas nuevas)

| Fichero | Rojo natural |
|---|---|
| `cifrasAncladas.test.ts` (nuevo) | 3: «expected 34 to be 31», «21 to be 20», «38 to be 35» (el registro y el código decían aún 34/21/38) |
| `invariantesGrafo.test.ts` | invariante 2 (31/20), unión 41, solo-SR con `Pendiente`, y 3 casos nuevos (ids retiradas, `diagnostico_complementario.from`, `Pendiente` fuera de servicio) |
| `estados.test.ts` | recuento 20 y lista solo-SR de dos |
| `mapaBlueprint.test.ts` | 35 aristas y el caso nuevo «ninguna arista toca Pendiente» |
| `fasesBlueprint.test.ts` | 4·11·5 y «Pendiente ya no tiene fase» |
| `reentrancia.test.ts` | C2 de ocho estados (2) |
| `prioridad.test.ts`, `cargos.test.ts`, `transitionsSoporteRemoto.test.ts` | 31 transiciones; 1.700 casos; 41 ids |
| `permisos.test.ts`, `cargoPermiso.test.ts`, `flujoSoporteRemoto.test.ts` | 93 = 54/39 y 55/38, 744 casos, 41 en P8 |
| `transicionesEjecucion.test.ts` | huérfanas, extremos contra el grafo, barrido 31 y el 400 nuevo de las tres ids retiradas |

Sin rojo, y es correcto: `fechasDerivadas.test.ts:82` (sólo mensaje), `flujos.test.ts` y P5 reapuntados a `diagnostico_complementario` (la guarda de flujo dispara con cualquier id de servicio; su rojo se prueba en 3.6).

### Verde (Fase 2) y TDD

| Tarea | Prueba | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|
| 1.1/2.5 | `cifrasAncladas.test.ts` | escrita, 3 rojos | `config.yaml` 31/35/20 | 3 cifras + 3 mutaciones | no aplica |
| 1.2-1.9/2.1-2.3 | 15 ficheros de prueba | 27 rojos previos | `transitions.ts`, `estados.ts`, `fasesBlueprint.ts` | por id y por recuento | sólo datos y comentarios |
| 2.4 | anti-desfase | rojo en `mapaBlueprint.test.ts` | `npm run generar-mapa-blueprint`: sólo quita `e21` y mueve una arista a `e15 --> e16` | n/a | n/a |

Suite completa tras el verde: 169 ficheros, 2409 verdes, 2 saltadas. Typecheck limpio. Lint 165 avisos, 0 errores (techo 165, sin nuevos). Build correcto.

### Mutaciones (3.1-3.6), todas revertidas

| # | Mutación | Rojo observado |
|---|---|---|
| 3.1 | reponer `marcar_pendiente` en `transitions.ts:206-207` | 9: invariantes 1 y 2, unión, solo-SR, ids retiradas, huérfanas, extremos, barrido y el 400 |
| 3.2 | `diagnostico_complementario.from` vuelve a `['Pendiente']` | 28: invariante 1, `CASOS` contra el grafo, reentrancia, bodegaje, mapa |
| 3.3 | quitar `'Pendiente'` de `estados.ts:182` | 24: `tsc` en `fasesBlueprint.ts:68`, invariante 1, `estados.test.ts`, mapa |
| 3.4 | `maestro` a `"34"`, `"38"`, `"21"` una por una | 1 rojo cada una, en `cifrasAncladas.test.ts` («expected 34 to be 31» y análogas) |
| 3.5 | reponer `e15 --> e21 : Marcar como pendiente [ST]` en `blueprint-completo.md`; reponer la clave `Pendiente` en `fasesBlueprint.ts` | anti-desfase rojo; `tsc` TS2353 en `fasesBlueprint.ts:57` |
| 3.6 | quitar `exigirMismoFlujo` de `ticketService.ts:125` | P5 reapuntado da 200 (rojo) y P6 rojo: la posición flujo/estado sigue fijada |

### Desviaciones y avisos
- `registro.test.ts:218-220` (reconciliación) cuenta cambios «en curso»: la propuesta de F1C-09 lo ponía rojo desde la planificación. Se añadió `F1C-09` a la lista esperada (SEIS a SIETE). **Hay que revertirlo al archivar** (el archivo quita al cambio de «en curso»).
- Fuera de alcance, anotado: `docs/artefactos/blueprintserviciotecnico.html:765`, `:770-771` siguen pintando las tres retiradas; no lo genera ni lo vigila nada.
- Lote B (script SQL, su prueba, comentarios «34» de caso A, barrido de citas 9.x): no tocado.

### Medida del lote A (válvula 720, techo 800)
`git diff --shortstat --no-renames fd253aa`: 25 ficheros, +227 −173 = **400**; más `wc -l` de lo nuevo sin trackear: `cifrasAncladas.test.ts` 75 + este `apply-progress.md` ~52 = **127**. Total lote A: **~527**. Sin binarios. Por fichero (+/−): `transicionesEjecucion.test.ts` 48/16, `invariantesGrafo.test.ts` 37/13, `permisos.test.ts` 22/22, `mapaBlueprint.test.ts` 16/6, `transitions.ts` 15/15, `config.yaml` 12/12, `tasks.md` 24/24, el resto ≤6/6; mapa regenerado 2/14.
