# Tareas — `filtro-indicadores-por-flujo` (F1F-05, `cierra: no`)

`strict_tdd`: cada tarea abre con su prueba en ROJO, vista y anotada en `apply-progress.md` (salida y causa); luego el VERDE mínimo.
Excepción: las tres caracterizaciones de M2 se escriben ANTES de tocar producción y están en verde a propósito. D* son de `design.md`;
RQ-KP-* de `specs/kpis/spec.md`; M* de D11. Las pruebas nuevas van AL FINAL de su fichero y las de hoy no se editan. Lo de producción va en
sitio (las líneas de D12) o al final: ningún fichero gana ni pierde líneas antes de su última línea de hoy. **Mutación** = mutar, ver el
rojo con el nombre de la prueba (se anota), revertir y comprobar `git diff` vacío del código de producción. Todo en el worktree
`C:\Dev\Desk_2_R1.023-worktrees\filtro-indicadores-por-flujo`; rutas bajo `apps/desk/` salvo `packages/shared`. Cada lote es UN intento, base = commit de
partida del lote, válvula 720.

**Cierre de lote (X.c):** medir (`git diff --shortstat --no-renames <base>` + `wc -l` de lo nuevo sin trackear), códigos EN SERIE:
`npm test`, `npm run typecheck`, `npm run lint` (techo 165 avisos: ninguno nuevo), `npm run build`, todos en 0; `apply-progress.md`; commit.

## Lote L1a — M2, predicado, `validarFlujo`, lectura, recorte, GET (~240 × 1,8 = 430; ≤ 720)

- [ ] L1a.1 Línea base: `npm test` y `npm run typecheck` en verde antes de tocar nada; anotar el nº de avisos de lint.
- [ ] L1a.2 CARACTERIZACIONES M2 (verdes a propósito, antes de producción): GET json y GET csv en `server/routes/indicadores.test.ts` (al final), POST sin
      `flujo` en `server/routes/indicadoresComparacion.test.ts` (al final); fixture con «Equipo nuevo» en `Ticket creado`, «Soporte remoto», «Servicio» y `NULL`;
      `sha256` literal del cuerpo y orden de claves (RQ-KP-31 y RQ-KP-32 «bytes de hoy»).
- [ ] L1a.3 ROJO `packages/shared/src/flujos.test.ts` (al final): `flujoPorClasificacion`, `FLUJOS`, `NOMBRE_FLUJO` exportado; casos de D1; «Equipo Nuevo» y `null` (M12);
      tabla que enfrenta `flujoDelTicket` y el predicado en los 26 `ESTADOS` (M6). RQ-KP-30. Rojo por símbolos inexistentes.
- [ ] L1a.4 VERDE `packages/shared/src/flujos.ts`: `:126` comentario y `:127` `export const` en sitio; `flujoPorClasificacion` y `FLUJOS` tras `:163`.
- [ ] L1a.5 ROJO `server/indicadores.test.ts` (al final): `validarFlujo` (`otro`, `''`, array, `Servicio`, `undefined`), `MENSAJE_FLUJO` nombra cada flujo,
      `recortarPorFlujo(e, null)` con `toBe(e)`, recorte con flujo, `clasificaciones` en la lectura y cuatro consultas. RQ-KP-29, -31.
- [ ] L1a.6 VERDE `server/indicadores.ts`: en sitio `:2`, `:43`, `:64`, `:65`, `:73`, `:88` (D4); `MENSAJE_FLUJO`, `FlujoValidado`, `validarFlujo`, `recortarPorFlujo` tras `:96` (D3, D5).
- [ ] L1a.7 ROJO `server/routes/indicadores.test.ts` (al final): M1 (`flujo=equipo-nuevo` sobre los tres flujos), M3 (cuatro valores malos, sin consulta de datos), M5 (csv `soporte-remoto`,
      cabecera de hoy, nombre con flujo), M8 (periodo invertido + `flujo=otro`; `formato=xml&flujo=otro`), M10 (`datos()` = 4), M12 («Equipo Nuevo» y `NULL`). RQ-KP-29, -31.
- [ ] L1a.8 VERDE `server/routes/indicadores.ts`, 0 líneas insertadas, en sitio: `:7`, `:42`, `:43`, `:44`, `:48`, `:53` (D3, D5). Las tres caracterizaciones de L1a.2 siguen en verde.
- [ ] L1a.9 Mutación M1: `recortarPorFlujo` devuelve todos los tickets → cae «El recorte filtra».
- [ ] L1a.10 Mutación M2: recortar a `servicio` sin flujo, y emitir `flujo: null` → caen las caracterizaciones, el `toBe(e)` y las pruebas de hoy.
- [ ] L1a.11 Mutación M3: `validarFlujo` deja pasar `otro` / `''` / `Servicio` → caen «Valor desconocido» y «Vacío, repetido y otra grafía».
- [ ] L1a.12 Mutación M5: el csv ignora el recorte → cae «El CSV también filtra».
- [ ] L1a.13 Mutación M6: el recorte usa `flujoDelTicket` → caen los casos de estado de L1a.3 y L1a.7.
- [ ] L1a.14 Mutación M8 (regla 1): `validarFlujo` antes de `validarPeriodo` en el GET → cae «Periodo antes que flujo».
- [ ] L1a.15 Mutación M10: `clasificaciones` por una consulta aparte → cae «Cuatro consultas» (`indicadores.test.ts:58` y el par de la ruta).
- [ ] L1a.16 Mutación M12 (regla 2): comparar la clasificación sin normalizar → cae «Otra mayúscula» y «Ticket sin clasificación».
- [ ] L1a.c Cierre de lote L1a: X.c; estimación **~430 (bajo 720)**; `apply-progress.md` con rojos, mutaciones y medida.

## Lote L1b — POST, cruce por flujo, clasificación de los sin cruzar, forma (~215 × 1,8 = 390; ≤ 720)

- [ ] L1b.1 Línea base: suite en verde con L1a aplicado; `git diff` vacío entre el commit de L1a y el árbol.
- [ ] L1b.2 ROJO `server/comparacion/cruzarExportacion.test.ts` (al final): `cruzarPorFlujo` — SR del periodo y servicio fuera → `deOtroFlujo`; EN fuera → `fueraDelPeriodo`;
      ausente → `soloEnFichero`; `soloEnDesk` y `numeroDistinto` sólo del flujo; invariante de D6 (M4, M6). RQ-KP-32.
- [ ] L1b.3 VERDE `server/comparacion/cruzarExportacion.ts`: `:2` en sitio; `TicketExistente`, `CruceRepartido`, `cruzarPorFlujo` tras `:41` (D6).
- [ ] L1b.4 ROJO `server/db/ticketsPorId.test.ts` (al final): `ticketsConClasificacion` — bloques, parámetros, sólo `SELECT`, lista vacía sin sentencia (M10). RQ-KP-32.
- [ ] L1b.5 VERDE `server/db/ticketsPorId.ts`: `ticketsConClasificacion` tras `:19` (D7).
- [ ] L1b.6 ROJO `server/routes/indicadoresComparacion.test.ts` (al final): M3 (cuatro valores malos, sin consultas), M4 (cubos e invariante), M8 (periodo antes que flujo;
      `flujo=otro` sin fichero → `MENSAJE_FLUJO`), M10 (mixto con y sin flujo: 5 sentencias), `flujo` y `deOtroFlujo` sólo con flujo. RQ-KP-29, -32.
- [ ] L1b.7 VERDE `server/routes/indicadoresComparacion.ts` en sitio `:3`, `:8-11`, `:15`, `:26-28`, `:34`, `:35`, `:40`, `:43`; `cruceDeLaPeticion` tras `:51`;
      `packages/shared/src/indicadoresExportacion.ts` en sitio `:16`, `:21` (D3, D6-D8).
- [ ] L1b.8 Mutación M3: el POST deja pasar `flujo=otro` → cae «Valor desconocido» en el POST.
- [ ] L1b.9 Mutación M4: recortar `entradas.tickets` antes de cruzar → caen «Otro flujo dentro del periodo» y «Otro flujo fuera del periodo».
- [ ] L1b.10 Mutación M6: `cruzarPorFlujo` usa `flujoDelTicket` → cae la tabla de estados de L1b.2.
- [ ] L1b.11 Mutación M8 (regla 1): `validarFlujo` detrás de «falta el fichero» (`:29`) → cae «Flujo antes que "falta el fichero"».
- [ ] L1b.12 Mutación M10: llamar siempre a `ticketsConClasificacion`, o una consulta de clasificaciones aparte → cae «Mismas consultas».
- [ ] L1b.c Cierre de lote L1b: X.c; estimación **~390 (bajo 720)**; `apply-progress.md`.

## Lote L2 — cliente, mutaciones restantes, barrido, reconciliación (~200 × 1,8 = 360 + reconciliación; ≤ 720)

- [ ] L2.1 Línea base: suite en verde con L1b aplicado.
- [ ] L2.2 ROJO `src/lib/indicadoresUrl.test.ts` (al final): `urlIndicadores('csv', undefined, 'equipo-nuevo')`, sin flujo y con `''` sin `flujo`; `opcionesFlujo` (M7). RQ-KP-33.
- [ ] L2.3 VERDE `src/lib/indicadoresUrl.ts`: línea 3, `:5`, `:8` en sitio; `opcionesFlujo` tras `:18` (D9).
- [ ] L2.4 ROJO `src/lib/comparacionExportacion.test.ts` (al final): `urlComparacion(…, 'soporte-remoto')` y la de hoy sin flujo (M9); `vistaComparacion` con y sin `deOtroFlujo`, total incoherente repetido (M11). RQ-KP-33.
- [ ] L2.5 VERDE `src/lib/comparacionExportacion.ts` en sitio `:4`, `:13`, `:16`, `:56`, `:62`, `:76`; `src/api/client.ts` en sitio `:897`, `:899` (D9).
- [ ] L2.6 Cableado `.tsx` (sin prueba por decisión F0-00): `src/components/Analisis.tsx` en sitio `:6`, `:75`, `:83`, `:91`; `src/components/ComparacionExportacion.tsx` en sitio `:9`, `:20`. Sólo pintan.
- [ ] L2.7 Mutación M7: `urlIndicadores` pierde el parámetro → cae `indicadoresUrl.test.ts`.
- [ ] L2.8 Mutación M9: `urlComparacion` pierde el parámetro → cae `comparacionExportacion.test.ts`.
- [ ] L2.9 Mutación M11: `vistaComparacion` pinta el cubo sin que venga, o calcula el total → cae «Cubo sólo si llega».
- [ ] L2.10 **Barrido de la regla de mutación 4 (D12)** sobre los 12 ficheros tocados: (1) `git diff -U0 8a068fe9 -- <fichero>` sólo con trozos en sitio o tras la última línea; (2)
      `git grep -noE "<fichero>:[0-9]+(-[0-9]+)?"`, cada resultado leído contra lo que afirma su frase; (3) pase de abreviadas; (4) detector de `pre-push`.
- [ ] L2.11 Comprobar que `DEPLOY.md:735` y `DEPLOY.md:744-745` siguen diciendo la verdad de `apps/desk/server/routes/indicadoresComparacion.ts:27-31`, y `routes/indicadores.ts:52` → `openspec/config.yaml:4105`.
- [ ] L2.12 Tabla de la regla 13 (regla de mutación 3) C1-C6 de D10 con las líneas REALES del servidor tras editar; se pega en `apply-progress.md` y en el verify.
- [ ] L2.13 `npm run reconcile` (`package.json:20`) regenera `docs/sdd/RECONCILIACION.md`; su diff entra en la medida del lote.
- [ ] L2.c Cierre de lote L2: X.c; estimación **~360 + diff de la reconciliación (bajo 720)**; `apply-progress.md` con M1-M12 rojas y restauradas.

## Tareas de persona — fuera del recuento

Regla del ciclo 1: no son unidades de trabajo del repositorio. **Archivar no las da por hechas.**

| # | Qué | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|---|
| P-1 | Confirmar qué tickets cuenta Zoho (población por defecto) | Gerencia | otro cambio de F1F-05 | `openspec/config.yaml` → e224 |
| P-2 | Corregir o aceptar S-1…S-8 (y S-9…S-12 del diseño) | Gerencia | supuestos aceptados con fecha | lista semanal de supuestos |
| P-3 | Probar en la app descarga y comparación con cada flujo | Quien administra la aplicación | dar por visto el comportamiento | lista acumulada de pruebas en la app |

## Review Workload Forecast

| Lote | Bruto | ×1,8 | Tareas |
|---|---|---|---|
| L1a | ~240 | ~430 | 17 |
| L1b | ~215 | ~390 | 13 |
| L2 | ~200 | ~360 + reconciliación | 14 |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

Este repositorio trabaja con techo 800 y válvula 720 por intento, no con PR de 400: cada lote cabe bajo 720 (el mayor, ~430), tres intentos en el
mismo worktree y una sola fusión tras la parada. `delivery_strategy: ask-on-risk` no pide decisión porque ningún lote supera la válvula.
