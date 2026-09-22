# Informe de archivo — `generador-mapa-blueprint` (F1A-06)

| Dato | Valor |
|---|---|
| Tanda | F1A-06 — fila `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:145` |
| Cabecera R-1 | `cierra: si` · `toca_maestro: si` · `capacidad: [mapa-blueprint, transitions-st]` |
| Base | `main` en `125ae3e` |
| Archivado | 2026-09-22, en `openspec/changes/archive/2026-09-22-generador-mapa-blueprint/` |
| Verify | PASS WITH WARNINGS · 0 CRITICAL · tres WARNING por requisito, cuatro por escenario (`34ee71f`) |

Este informe registra el estado **al cierre**. `apply-progress.md` y `verify-report.md` son
instantáneas intermedias: donde discrepen de lo que sigue, manda lo que sigue.

## 1 · Qué se fusionó en las specs vivas

- **`mapa-blueprint`, capacidad nueva** — `openspec/specs/mapa-blueprint/spec.md`, copia literal del
  delta (149 líneas, seis requisitos RQ-MB-01..06, doce escenarios). Ya estaba declarada en
  `openspec/config.yaml → capabilities` desde la fase de spec (R-2 de F0-05); no se añade dos veces.
- **`transitions-st`, RQ-TS-03 modificado** — `openspec/specs/transitions-st/spec.md`, +39/−6. El
  bloque de RQ-TS-03 se sustituye por el del delta: las dos transiciones sin botón declaran `from`/`to`
  y `estadoPorRemision.ts` deriva de esa declaración en vez de repetir los literales. La fusión
  desplaza **+33 líneas** todo lo que la spec tiene desde el antiguo RQ-TS-04.
- **Reanclaje en el mismo commit que la fusión** — `docs/sdd/ENTRADA.md:344` pasa a citar
  `openspec/specs/transitions-st/spec.md:327` (caso A: la frase sigue siendo cierta del árbol de hoy).
  El texto citado estaba en la línea 294 antes de la fusión; tras ella, la 294 es otra frase no vacía,
  así que el detector de citas la habría dado por buena. Barrido previo: es la **única** cita que
  apunta a la zona desplazada; las abreviadas sin fichero de esa zona se leyeron una a una y remiten a
  código o al maestro, ninguna a la propia spec.

La fusión es idéntica, byte a byte, a la del commit desechable de medición `dea0f42`
(`git diff --stat dea0f42 <cierre> -- openspec/specs` vacío).

## 2 · Qué se entregó, por unidad

| Unidad | Commits | Contenido | Ledger |
|---|---|---|---|
| A · datos y motor | `e864b7a` (`54d00f1`, entre A y B, fuera de objetivo) | `fasesBlueprint.ts`; P-2: las dos constantes ganan `from`/`to`; `estadoPorRemision.ts` deriva de ellas; invariante 5b invertido | ordinal 1, 325 líneas |
| B · generador | `c1680a8`..`8a36d03` | `mapaBlueprint.ts` (función pura), CLI `generar-mapa-blueprint`, los cuatro `docs/artefactos/blueprint-*.md`, prueba anti-desfase RQ-MB-06 | ordinales 2 y 3 |
| C · cierre documental | `372196e`..`d2bca6f` | `docs/artefactos/NOTA.md`; entrada 17 de `F0-01` (`docs/sdd/F0-01_Correcciones_para_el_maestro.md:897`); capacidad verificada | ordinales 4 y 5 |
| verify | `34ee71f`, `8df464b`, `3b6c168` | `verify-report.md` | ordinal 6, 177 líneas |
| archive | este commit y el que lo corrige | mover, fusionar, reanclar, informe | ordinal 7, techo 4300 |

`tasks.md`: 38/38.

## 3 · Hechos de estado final que las instantáneas no recogen

- **La regresión de tipos la introdujo la Unidad A, no era deuda previa.** En `125ae3e`,
  `apps/desk/server/db/estadoPorRemision.ts:41` comparaba literales; `e864b7a` introdujo el patrón que
  rompe `tsc` (`TS2345`), y el cierre de A declaró typecheck verde sin serlo. Lo corrigió la Unidad B
  en `c1680a8`, con delta 0 y sin tocar ninguna aserción de `estadoPorRemision.test.ts`.
- **Dos resets de mantenedor, los dos por techos autoimpuestos**, no por trabajo pendiente: Unidad B,
  779 líneas contra 700; Unidad C, 324 contra 300. El techo del preflight es 800
  (`openspec/config.yaml:29`); con él, los dos habrían liquidado limpios. Desde entonces se adquiere a
  800, y el archive con el techo aprobado por Gerencia (4300 sobre 3.848 estimadas).
- **`4312d9c`**, fuera de objetivo: ancla dos abreviadas rotas de la tanda — la de `design.md:159`,
  falso positivo de atribución, pasa a ruta completa; la de `apply-progress.md:63` es caso B y se ancla
  en `125ae3e` (apuntaba a `invariantesGrafo.test.ts`, no a `transitions.ts`).
- **`8df464b`**: el verify corrió el detector sobre `4312d9c`, antes de commitear su propio informe, y
  declaró cero bloqueantes; sobre `34ee71f` el detector daba exit 1, porque `verify-report.md:35`
  narraba con forma de cita una cita rota ajena. Se pasó a prosa sin mover líneas.
- **`3b6c168`**: el verify contaba sus avisos en dos unidades sin decirlo. La lista de avisos agrupa
  por requisito (tres); la matriz cuenta escenarios (cuatro). Las líneas 174 y 177 del verify-report
  dicen ahora «tres WARNING (cuatro escenarios)».
- **Primera versión de este informe (`9f5d426`), sustituida por esta:** tenía una tabla de huecos que
  no coincidía con la matriz del verify, atribuía a un commit cifras que no eran suyas y carecía de la
  línea de cierre. Se reescribió leyendo cada dato en su fuente.

## 4 · Huecos declarados — los cuatro escenarios sin prueba de ejecución

Son ciertos hoy, comprobados por lectura con cita en el verify; lo que falta es una prueba que impida
que dejen de serlo sin que nada se ponga rojo. Filas de la matriz de `verify-report.md`:

| Fila | Requisito | Escenario | Por qué es cierto hoy |
|---|---|---|---|
| `:67` | RQ-MB-01 | la función pura no importa `permissions.ts` | `packages/shared/src/mapaBlueprint.ts:8` importa sólo de `./transitions`; `:9`, sólo tipos de `./fasesBlueprint` |
| `:68` | RQ-MB-01 | la CLI delega todo el cálculo | `scripts/generar-mapa-blueprint.ts` sólo invoca la función pura y escribe |
| `:78` | RQ-MB-06 | una transición sintética sin regenerar da rojo | verificado una vez en la Unidad B con un script suelto no versionado; la igualdad estricta de la prueba permanente cubre el mismo modo de fallo en la práctica |
| `:80` | RQ-TS-03 | sin literales duplicados en `estadoPorRemision.ts` | las líneas 41 y 49 usan `.from`/`.to` de las constantes |

Destino: **ninguno asignado**, a propósito — que lo decida quien fije el alcance. La recomendación del
verify es cerrarlos en la próxima tanda que toque `mapaBlueprint.ts` o `estadoPorRemision.ts`.

## 5 · Contra la fila del plan

La fila (`…R01.1.md:145`) pide cinco cosas:

1. **Generador que produce `docs/artefactos/blueprint-*.md` en Mermaid `stateDiagram-v2`** — hecho
   (Unidad B).
2. **Diagrama completo más una vista por cada una de las tres fases de M1.3.1** — hecho: cuatro
   ficheros.
3. **Prueba anti-desfase en CI** — hecho: `mapaBlueprint.test.ts` corre en `npm run test:coverage`
   (`.github/workflows/ci.yml:45`).
4. **`blueprintserviciotecnico.html` como histórico congelado en `a3a8f03`** — hecho,
   `docs/artefactos/NOTA.md:50`.
5. **Cerrar antes el hueco 38/36** — hecho: entrada 17 de F0-01 (`…Correcciones_para_el_maestro.md:897`),
   que el maestro tiene que recibir (`toca_maestro: si`).

**Desvío declarado respecto de la letra de la fila:** la fila dice «desde `transitions.ts`,
`estados.ts` y `permissions.ts`». El generador **no** lee `permissions.ts`, por decisión de spec:
`canExecuteTransition` decide sobre un usuario y el mapa no tiene usuario
(`openspec/specs/mapa-blueprint/spec.md:21-27`); las áreas salen de `AREAS` y `areasForTransition`,
que viven en `packages/shared/src/transitions.ts:310` y `:313`.

## 6 · Verificación de cierre

Los cuatro comandos —detector de citas, `npm test`, `npm run typecheck`, `npm run lint`— se corren
sobre el commit **que contiene este informe**, completos y leyendo su exit code real, y sus cifras
quedan en la liquidación del ordinal 7 del ledger. No se escriben aquí: un informe no puede medir el
commit que lo contiene, y hacerlo sobre el anterior es exactamente el fallo de `34ee71f`.

**Cierre (R-1):** F1A-06 cubre las cinco piezas de su fila del plan —generador, cuatro vistas, prueba anti-desfase en CI, HTML congelado y hueco 38/36 cerrado vía entrada 17 de F0-01— con un desvío declarado (el generador no lee `permissions.ts`, por RQ-MB-01) y deja fuera, como hueco declarado sin destino, cuatro escenarios sin prueba de ejecución: RQ-MB-01 ×2 (`permissions.ts`, CLI delgada), RQ-MB-06 (transición sintética) y RQ-TS-03 (literales en `estadoPorRemision.ts`).
