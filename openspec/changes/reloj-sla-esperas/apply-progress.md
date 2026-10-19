# Progreso de aplicación — `reloj-sla-esperas` (F1C-06, `cierra: si`)

`strict_tdd` activo. Cada verde lleva delante su rojo, visto en la terminal; las salidas son las de vitest, recortadas.

## Lote 1 — packages/shared (intento 3, desde `26a86a2`) · tareas 1.1 a 1.9

**Línea base (1.1):** `npx vitest run packages/shared apps/desk/server/analisis.test.ts` → 57 ficheros, 1.507 pruebas en verde;
`npm run typecheck` → 0.

| Tarea | Rojo | Verde |
|---|---|---|
| 1.2 → 1.3 regla pura (RQ-TC-73, -74, -77) | `relojSla.test.ts`: `Error: Failed to load url ./relojSla ... Does the file exist?` · 1 fichero fallido, sin pruebas (exit 1) | `packages/shared/src/relojSla.ts` y `export * from './relojSla'` al final de `index.ts` → 22 pruebas en verde |
| 1.4 comentarios de `estados.ts` (D2) | sin prueba propia: texto en sitio; lo vigilan `comentariosVigilados.test.ts` (`:96`, frase de `:28`, «Las doce que la vista» de `:115`) y `sla.test.ts:45`, que siguen en verde | `:30-33` y `:117-118` reescritos en sitio: `git diff --numstat` 6 / 6 |
| 1.5 tipos (D4) | cubierto por el rojo de 1.6 y por `tsc` | `types.ts:571` y `:591` en sitio: 2 / 2 |
| 1.6 → 1.7 medias en `computeAnalisis` (RQ-TC-76) | `analisis.test.ts`: 9 fallidas, 3 en verde (`expected undefined to be 2`, `... to be 1.1`, `... to be null`, `expected [ undefined, undefined, undefined ] to deeply equal [ 1, 2, 2 ]`) · exit 1 | `analisis.ts` `:2`, `:19`, `:65`, `:83` en sitio y `mediasDelReloj` al final → 12 en verde |

Nota de orden, dicha tal cual: los dos rojos se vieron en la terminal antes de escribir cada verde, pero este fichero se redactó
después de los verdes de 1.3 y 1.7. Antes de 1.3 se corrigió en la prueba una aserción sobre `ALARMAS_SLA` (es un registro por
estado, no una lista) sin tocar el módulo, que seguía sin existir. `relojSla.test.ts` lleva 22 pruebas y el `describe` nuevo de
`analisis.test.ts` 9.

**Mutaciones (1.8)**, con `herramientas/mut.mjs` (aplica, corre, restaura y comprueba). Las 17 salieron con `exit=1` y
`restaurado=true`; el JSON y el registro están en `C:\dev\Desk_2_R1.023-worktrees\rse-l1-mut.json` y `rse-l1-mut.log`.

| Id | Mutación | Resultado |
|---|---|---|
| M1 | quitar `Notificación cliente` de la lista | ROJO, 6 (lista exacta, «una pausa no entra», pausa abierta, desordenada, ISO, alarma) |
| M2 | añadir `Solicitado` | ROJO, 6 (lista exacta, «seis internas corren», «espera interna entra», pausas) |
| M3 | lista = las `externa` de `CLASIFICACION_EN_ESPERA` (importa el valor; mutación de dos partes) | ROJO, 4 (lista exacta, «Pendiente corre», guardián de imports, «sin pausas») |
| M4a | añadir `Pendiente` | ROJO, 3 |
| M4b | añadir `Pendiente de facturar` | ROJO, 2 |
| M5 | la pausa suma al SLA | ROJO, 6 |
| M5b | la pausa se resta dos veces del SLA | ROJO, 6 |
| M6a | último tramo hasta su propio `desde` | ROJO, 3 (pausa abierta, interna abierta, alarma) |
| M6b | pausa abierta suma al SLA | ROJO, 2 |
| M7 | el terminal suma | ROJO, 8 |
| M9a | el `push` del reloj fuera del bloque de `analisis.ts:59` | ROJO, 4 (anulado, fuera de periodo / fin anterior, abierto, «lo que valían») |
| M9b | el `push` fuera de `dias >= 0`, dentro del bloque | ROJO, 1 (fin anterior a la creación) |
| M10 | escribir `import { CLASIFICACION_EN_ESPERA } from './estados'` en `relojSla.ts` | ROJO, 1 (guardián de imports) |
| M11 | `alarmasSla.ts` importa `ESTADOS_QUE_PARAN_EL_RELOJ` | ROJO, 1 (guardián RQ-TC-77) |
| M11b | `db/sla.ts` importa de `relojSla` | ROJO, 1 |
| M11c | `sla.ts` importa de `relojSla` | ROJO, 1 |
| M12 | quitar la ordenación | ROJO, 1 («desordenada da lo mismo») |
| M15 | dividir entre 8 en vez de 9 | ROJO, 6 |

Ninguna sobrevivió ni resultó equivalente: no hizo falta reforzar ninguna prueba. M9a y M9b son las dos de posición de la regla de
mutación 1: la primera saca el `push` de todo el bloque de `:59` y la segunda sólo de `dias >= 0`; las dos cazadas por pruebas
distintas.

**Barrido de citas (1.9, regla de mutación 4).** `git grep -noE "<fichero>\.ts:[0-9]+(-[0-9]+)?"` sobre el árbol, uno por fichero;
las citas del archivo (`openspec/changes/archive/`) son registros fechados (caso B) y no se tocan. Nada se desplaza: las cuatro
ediciones son en sitio o al final, con inserciones = borrados salvo lo añadido al final.

| Fichero | `git diff --numstat` (ins / bor) | Citas en total · en el archivo · vivas | Las que tocan una línea cambiada o el final |
|---|---|---|---|
| `estados.ts` | 6 / 6 | 451 · 334 · 117 | `transitions-st/spec.md:1182` (`:26-33`) acierta: el bloque `:26-33` sigue siendo «la regla que separa la vista del reloj», y `:1191` (`:28`) no cambia; `fasesBlueprint.ts:3` (`:59-160`) sigue en `CLASIFICACION_EN_ESPERA` (`:59`) y `]` (`:160`). Las de esta misma carpeta (`proposal.md:55`, `:86`, `design.md:39`, `spec.md:22`, `tasks.md:13`) citan el texto de ANTES de `:26-30` y `:117-118` en `6a4f76e` (caso B) |
| `analisis.ts` | 12 / 4 (los 8 sobrantes son `mediasDelReloj`, al final) | 69 · 41 · 28 | `kpis/spec.md:648` y las de esta carpeta (`:17-95`): `computeAnalisis` sigue en `:17` y su `}` en `:95`; `:59` y `:65` aciertan |
| `types.ts` | 2 / 2 | 154 · 133 · 21 | `proposal.md:62` (`types.ts:566-580` y `:581-592`): `Analisis` abre en `:566` y cierra en `:580`; `AnalisisRow`, `:581` y `:592`. Acierta |
| `index.ts` | 1 / 0 (al final) | 238 · 148 · 90 | las 11 con final `>= 48` son de `apps/desk/server/index.ts` (`:88`, `:84-93`, `:58-67`), no del paquete; la única de `shared/src/index.ts` (`F1A-05_Auditoria…md:111`, `:6`) no se toca |

**Los tres códigos (final del lote, árbol completo, `set -o pipefail`):**

| Comando | Código | Resumen |
|---|---|---|
| `npx vitest run` | **1** | 299 ficheros en verde, 1 fallido, 3 omitidos; 5.033 pruebas en verde, 1 fallida, 11 omitidas. La fallida es `apps/desk/server/reconciliacion/registro.test.ts` «`en curso` son exactamente OCHO»: recibe `F1C-06` como novena (la propuesta de este cambio ya está en `openspec/changes/`). No la causa ninguna línea de este lote; no se toca, queda para el orquestador (1.10) |
| `npm run typecheck` | 0 | `tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit` sin salida |
| `npx eslint .` | 0 | 0 errores, 165 avisos (los de partida: no cambia) |

**Work Unit Evidence.** Prueba enfocada: `npx vitest run packages/shared/src/relojSla.test.ts packages/shared/src/analisis.test.ts`
→ exit 0, 34 pruebas en verde. Arnés de ejecución: N/A, son funciones puras sin frontera de ejecución (la lectura de la base es
del lote 2). Frontera de retroceso: `relojSla.ts`, `relojSla.test.ts`, la línea de `index.ts`, los seis cambios en sitio de
`estados.ts` / `types.ts` / `analisis.ts` y el `describe` final de `analisis.test.ts`.

**Desviaciones del diseño:** ninguna. Tres añadidos de prueba que el diseño no pedía y que no cambian el alcance: la prueba de que la función
no modifica su entrada, la de instantes como texto ISO y la de cierres de empresa.

**Cierre del lote 1 (1.10, orquestador).** `apps/desk/server/reconciliacion/registro.test.ts:218` y `:220` pasan en sitio de
OCHO a NUEVE «en curso», con `F1C-06` (2 / 2, mismo molde que `9b82c14` en F1C-04): la cabecera de `proposal.md` lo metió
en curso desde la planificación 1 (`6a4f76e`), y la prueba no se había corrido en ese intento. Al archivar vuelve a ocho.
Mutaciones: 18 entradas en `rse-l1-mut.log` (M1-M7 con variantes, M9a/b, M10, M11/b/c, M12, M15), todas `exit=1` y `restaurado=true`.
Códigos del cierre (árbol completo): `npm run typecheck` 0; `npx eslint .` 0 (0 errores, 165 avisos, los de partida). `npx vitest run`
salió 1 tres veces SIN ninguna aserción rota: la 1.ª por dos `Test timed out in 5000ms` de `apps/desk/server/citas/cli.test.ts`
(sola pasa: exit 0, 2/2); la 2.ª y la 3.ª con 300 ficheros y 5.034 pruebas en verde y sólo «[vitest-worker]: Timeout calling
"onTaskUpdate"», error del trabajador de vitest y no de una prueba. Es carga de la máquina, el mismo caso registrado en F1C-05.
