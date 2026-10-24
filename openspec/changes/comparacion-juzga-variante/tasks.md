# Tareas — `comparacion-juzga-variante` (F1F-05, `cierra: no`)

`strict_tdd`: cada tarea de producción va precedida de su tarea en ROJO, vista y anotada en `apply-progress.md` (salida y causa); luego el VERDE
mínimo. D* son de `design.md`; RQ-KP-* de `specs/kpis/spec.md`; M* son las diez mutaciones de D9 (mismo número que `proposal.md`). **Colocación
(mutación 4, D1/D4/D6):** en `packages/shared/src/indicadoresComparacion.ts`, `apps/desk/src/lib/comparacionExportacion.ts`, `apps/desk/server/testing/septiembre2026.ts`
y los cuatro ficheros de prueba existentes todo cambio es EN SU MISMA LÍNEA o AL FINAL; ninguna línea existente se desplaza. **Mutación** = aplicar, correr,
ver el rojo con el nombre de la prueba (se anota), revertir y comprobar verde. Todo en el worktree `C:\dev\Desk_2_R1.023-worktrees\comparacion-juzga-variante`; rutas bajo `apps/desk/` salvo `packages/shared`.
Una rama, dos lotes (L1, L2); cada lote es UN intento, techo 800, válvula 720 medidas (`git diff --shortstat --no-renames <base del lote>` + `wc -l` de lo nuevo sin
trackear; el `apply-progress` del lote cuenta).

**Cierre de lote (X.c):** commit del lote; luego `set -o pipefail; npm run typecheck && npm run lint && node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`
y vitest dirigido a los ficheros del lote; `npm test` completo lo corre el orquestador. Medida ≤ 720.

## Lote L1 · shared + sembrador + aceptación + sha256 (~420 con progreso; ≤ 720)

- [x] L1.1 Línea base (`packages/shared`, `apps/desk/server/routes/indicadoresSeptiembre.test.ts`): correr RQ-KP-38 ANTES de escribir nada; debe estar verde en `e1a92b59` (supuesto de D6). Si no, parar.
- [x] L1.2 ROJO `packages/shared/src/indicadoresComparacion.test.ts`, AL FINAL: «la variante y la letra difieren por ticket» (`ticketsVariante` distinto de `tickets`), «`tickets` sigue siendo la letra», «un ticket coincide sólo si coinciden todos» (variante), clave `ticketsVariante` entre `tickets` y `nota` (orden de claves), nota nueva (dice quién juzga: variante; letra informativa), sin `aprob|umbral|semáforo|veredicto`. Rojo: `ticketsVariante` inexistente. RQ-KP-40.
- [x] L1.3 ROJO C13 en su línea: `:136` reescribe el título y `:140` pasa a `expect(r.nota).not.toContain('no precisa')`; `:141` queda. Rojo: la nota de `:10` aún dice «no precisa». D7.
- [x] L1.4 ROJO aceptación `apps/desk/server/routes/indicadoresComparacionSeptiembre.test.ts` (nuevo, D6), HECHA ANTES de D2 (con `ticketsVariante` inexistente falla): CSV en memoria con las doce cabeceras importadas de `server/comparacion/leerExportacion.ts:5-19`, ID de 18 dígitos vía `idDe`, periodo 2026-09-01/09-30. Pruebas: (1) cruce limpio 13/0/0/0/0; (2) `ticketsVariante` `{13,13,100}`; (3) por indicador 47→11, 49→9, 50·53→11, 51→12, 54/57/58/59→9 al 100 %, la 55 `comparados` 0 y `porcentaje` `null`; (4) `it.each` ocho indicadores con la celda del primer ticket alterada (+5 / `Cumple`↔`No cumple`) → `{13,12,92.3}` y variante < 100; (5) orden de claves de `comparacion` en GET y POST; (6) el fichero no importa escritura a disco (molde `indicadoresComparacion.test.ts:141-145`). Rojo anotado: por `sembrarSeptiembre` sin `idDe` (IDs `sep-NN` van a `rechazadas`) y por `ticketsVariante` inexistente. RQ-KP-42.
- [x] L1.5 VERDE `apps/desk/server/testing/septiembre2026.ts`: segundo parámetro opcional `idDe` EN SU LÍNEA (`:55`) y `:60` usa `idDe(t)` (D6). `indicadoresSeptiembre.test.ts` no cambia.
- [x] L1.6 VERDE `packages/shared/src/indicadoresComparacion.ts` (D1-D3): `:45` gana `ticketsVariante: LecturaTickets` en la misma línea; `LecturaTickets`, `PorTicket` y `lecturaPorTicket` AL FINAL; `:92` mapa por lectura, `:106` sin condición de lectura (`e.r !== 'sin'`, `porTicket[contra]`), `:119-120` y `:126` (`tickets, ticketsVariante,`); `:10` y `:2` con los textos de D3. `:9` y `:90` no se mueven.
- [x] L1.7 VERDE tipado del test del lib: `apps/desk/src/lib/comparacionExportacion.test.ts:64` gana `ticketsVariante: { comparados: 5, coincidentes: 5, porcentaje: 100 }` en la misma línea (sin ella no compila).
- [x] L1.8 Dos sha256 (D7, S-5): correr; tomar el hash «received» del cuerpo real con todo lo demás verde y cambiarlo EN SU LÍNEA en `apps/desk/server/routes/indicadores.test.ts:263` y `apps/desk/server/routes/indicadoresComparacion.test.ts:326`, con el comentario `// recalculado por decision/f1f05-variante-juzga-el-95 (ticketsVariante y nota)`. `indicadores.test.ts:271` (CSV) NO cambia; si cae, el apply metió la comparación en el CSV.
- [x] L1.9 Mutación M1 (`shared:120` → `lecturaPorTicket(porTicket.valor)`): caen «la variante y la letra difieren por ticket» y la aceptación (2).
- [x] L1.10 Mutación M4 (nota antigua en `shared:10`): caen C13 (`:140`) y «la nota dice quién juzga».
- [x] L1.11 Mutación M5 (regla 2: ensuciar lo vigilado): en el CSV de la prueba y en `gerencia` de `septiembre2026.ts` alterar una celda fuera de ±1 → caen aceptación (2) y (3).
- [x] L1.12 Mutación M6 (`shared:126`, intercambiar `tickets` ↔ `ticketsVariante`): cae «`tickets` sigue siendo la letra».
- [x] L1.13 Mutación M7 (`shared:109`, coincide si coincide ALGUNO): caen «un ticket coincide sólo si coinciden todos» y C9 (`indicadoresComparacion.test.ts:101-109`).
- [x] L1.14 Mutación M10 (comparación en el CSV del GET, `apps/desk/server/routes/indicadores.ts:45-50`): cae el sha256 de `indicadores.test.ts:271`.
- [x] L1.15 Colocación (mutación 4): `git diff -U0 <base> -- packages/shared/src/indicadoresComparacion.ts apps/desk/server/testing/septiembre2026.ts` y los cuatro ficheros de prueba existentes (`indicadoresComparacion.test.ts` de shared y de rutas, `indicadores.test.ts`, `comparacionExportacion.test.ts`): sólo hunks reescritos en sitio o tras la última línea; ninguno inserta en medio.
- [x] L1.c Cierre de lote L1: X.c; medida ≤ 720 (estimación ~420); `apply-progress.md` con rojos, mutaciones y nota de las sha256.

## Lote L2 · cliente: lib, `.tsx`, anclas (~330 con progreso; ≤ 720)

- [ ] L2.1 Línea base: suite del lote L1 en verde; base de L2 = commit de L1.
- [ ] L2.2 ROJO `apps/desk/src/lib/comparacionExportacion.test.ts`: `:90-91`, `:95`, `:98` y `:103` pasan EN SU LÍNEA a `v.tablas[1].columnas`/`v.tablas[1].tickets` (letra). AL FINAL, pruebas nuevas (RQ-KP-41): «la variante va primero con su rótulo» (`v.tablas.map((t) => t.titulo)` con los literales `ROTULO_VARIANTE`/`ROTULO_LETRA` escritos en la prueba), «la tabla de la variante lee la variante», «los tickets salen de su clave», «la 55 de la variante dice `MENSAJE_SIN_PARES`» (esperado importado de shared), «la letra sigue pintando «—»», fila de tickets con `Object.keys(t.tickets)` = `['comparados','coincidentes','porcentaje']` (S-7), prueba de fuente: `lib/comparacionExportacion.ts` no contiene el literal de la frase. Rojo: `tablas` inexistente.
- [ ] L2.3 VERDE `apps/desk/src/lib/comparacionExportacion.ts` (D4): `:39-40` por `tablas: TablaVista[]`; `:4` importa `MENSAJE_SIN_PARES` y `type Conteo`; `:48` `pct(p, vacio = SIN_DATO)`; `:68-72` por el array de dos `tablaVista(...)`; `TablaVista`, `tablaVista`, `ROTULO_VARIANTE` y `ROTULO_LETRA` AL FINAL.
- [ ] L2.4 VERDE `apps/desk/src/components/ComparacionExportacion.tsx` (D5, sin prueba por F0-00): `:51-59` pasan a `v.tablas.map((t) => …)` con rótulo `text-slate-600` sin color de estado y fila «Tickets» con dos `<td />` vacíos; cabecera, mensaje (`:50`) y nota (`:68`) sin cambio.
- [ ] L2.5 Mutación M2 (la tabla de la variante lee `k`): cae «la tabla de la variante lee la variante».
- [ ] L2.6 Mutación M3 (letra primero / rótulos intercambiados en `:68-72`): cae «la variante va primero con su rótulo».
- [ ] L2.7 Mutación M8 (letra con la frase / variante con «—»): caen «la letra sigue pintando «—»» y «la 55 de la variante dice…».
- [ ] L2.8 Mutación M9 (frase redefinida en el cliente): cae el esperado importado de shared y la prueba de fuente sin literal.
- [ ] L2.9 Mutación 6 en el lado cliente (`tickets` ↔ `ticketsVariante` al armar `tablas`): cae «los tickets salen de su clave». Palabras prohibidas (`:130-135`) sigue verde.
- [ ] L2.10 Anclas caso B del `proposal.md` (D10): anclar «en `e1a92b59`», sin renumerar, las líneas 24, 25, 27, 28, 29, 90 y 107 (shared 106, 126, 10 y 2; lib 68-72 y 48; `.tsx` 50-59 y 57). Las de la spec delta (74, 78, 143, 144, 195) son caso A y no se tocan.
- [ ] L2.11 Barrido de la regla de mutación 4 (D10): (1) `git diff -U0 <base de L1> -- <lib, shared>` sólo en sitio o al final; (2) Grep de `indicadoresComparacion\.ts:[0-9]+`, `comparacionExportacion\.ts:[0-9]+`, `ComparacionExportacion\.tsx:[0-9]+` y las rutas de las pruebas, SIN excluir `openspec/changes/archive/`, `docs/`, `DEPLOY.md`, cada resultado leído contra lo que afirma (A/B/C); conocidas: `openspec/specs/kpis/spec.md:1160` y `:1440`, `:1636-1637` siguen ciertas; (3) pase de abreviadas `:NN` en cada fichero que ya cita el módulo; (4) detector. NO se toca `openspec/config.yaml` (cita `:5290`).
- [ ] L2.12 Tabla de la regla invariable 13 (mutación 3) escrita en `apply-progress.md`, decisión a decisión con la línea del servidor (D8): números de variante y letra, `null` en vez de 0/100, frase `MENSAJE_SIN_PARES`, orden y rótulos (sin guarda, presentación), «Difieren»/«Sin comparar» vacíos, sin semáforo ni veredicto. `git diff --stat` del `.tsx` como prueba de que no calcula.
- [ ] L2.c Cierre de lote L2: X.c; medida ≤ 720 (estimación ~330); `apply-progress.md` con rojos, mutaciones, barrido y tabla de la regla 13.

## Tareas de persona — fuera del recuento

Regla del ciclo 1: no son unidades de trabajo del repositorio. **Archivar NO las da por hechas.**

| # | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Corregir, si procede, S-1 a S-7 | Gerencia | Lista semanal de supuestos (regla E-237) |
| P-2 | Repetir la comparación de septiembre (01/09 a 30/09) y pasar el «Sólo en Desk» | Gerencia | `openspec/config.yaml:5309` |
| P-3 | Probar en la aplicación la tabla de la variante | Gerencia / analista | Lista acumulada de pruebas en la app |

## Review Workload Forecast

| Lote | Bruto | ×1,8 | Con progreso | Tareas |
|---|---|---|---|---|
| L1 | ~165 | ~300 | ~420 | 15 + cierre |
| L2 | ~130 | ~235 | ~330 | 12 + cierre |

Total ≈ 750 con ×1,8 (D11); partido en dos intentos, ambos ≤ 720.

Decision needed before apply: No — cada lote cabe en 720 (una rama, L1/L2, un intento por lote; sin PR encadenados)
Chained PRs recommended: No (la entrega es una rama fusionada a `main` por el analista)
Chain strategy: n/a
400-line budget risk: Medium
