# apply-progress · continuidad-indicadores (F1F-05, `cierra: no`)

## Lote 1 — hecho (1.1 a 1.11). Partida `579eb5c`. Modo Strict TDD.

**1.1 Línea base** (`npm test` sobre `579eb5c`): 1 rojo, 2631 verdes — `registro.test.ts:220` («en curso» eran SIETE; la cabecera `tanda: F1F-05` la hace OCHO). Salida del rojo: `+   "F1F-05",` sobre `["F0-04","F1B-03","F1B-04","F1B-07","F1B-08","F1B-11","F1C-05"]`. Corregida en sitio (título y lista, `'F1F-05'` al final; numstat 2/2). Lint de partida: 165 avisos, 0 errores.

**1.2 Alinear** — `design.md`: §3.1 (fuente `columna_heredada`, `motivo` texto, `codigoServicio`, `calificacionSatisfaccion`, columna `'50_53'`, unidades `cumplimiento` y `calificacion`, sin `copiado_de_zoho`), §4 filas 49 (R1) y 55 (R5), K13. `proposal.md` §4 fila 55. `specs/kpis/spec.md` RQ-KP-13: enum de unidad ampliado con `calificacion` (el 55 es texto, no cumplimiento).

**1.3 Script de un solo uso** (fuera del repo; `Tickets.csv`: 640 filas, 59 columnas, coma, comillas, BOM; fechas `YYYY-MM-DD`, «Hora de actualización del estado» con hora; el export NO trae «Fecha Remisión de Salida»). Comparables = filas con todos los insumos y valor de Zoho comparable.

| Indicador (fórmula comprobada) | Comparables | Cuadran | No cuadran |
|---|---|---|---|
| 47 `H-1 − Remisión Entrada`, naturales | 202 | 201 | `809`: calculado −21, Zoho −20 |
| 49 `Fecha creación ticket → Revisión Informe`, lunes a viernes sin festivos | 161 | 158 | `838`, `836`, `834`: Zoho +1 (los tres terminan en sábado de dic. 2025) |
| 49 con la misma fecha en naturales (descartada) | 161 | 54 | — |
| 50 (= 53), lunes a viernes sin festivos, tope 0, repuestos antes que OV | 149 | 147 | `827` (termina en sábado, Zoho +1), `628` (festivo 19/08/2024: Zoho −1) |
| 50 sin finalización → 0 | 478 | 478 | — |
| 51 `H-1 − Finalización ST`, naturales | 162 | 162 | — |
| 54 `53 ≤ 52` (Cumple / No cumple) | 365 | 365 | — |
| 54 sin 52 → `Cumple` | 268 | 268 | — |
| 57 `Cotización − Revisión` | 161 | 161 | — |
| 58 `OC − Cotización` | 180 | 180 | — |
| 59 `OV − Cotización` | 180 | 180 | — |

Contraste con festivos (intervalos `b > a`): si Zoho descontara festivos, la fórmula del calendario laboral cuadraría; no lo hace — 49: 0 de 57 intervalos con festivo cuadran con `diasHabilesEntre`, 104 con lunes a viernes; 50: 1 de 33 frente a 85. **Todas las fórmulas cuadran de forma clara (97,9–100 %); no se devuelve nada.** Hallazgo para el lote 2: el 47 de Zoho SÍ es `H-1 − entrada` (201/202); la spec dice que la variante de la app es «sin dato» porque la aplicación no guarda H-1, y eso no cambia. Las 5 filas discrepantes son de borde (sábado, festivo): se registran, no se corrigen. 55: 43 filas con calificación en el export (texto).

**1.4–1.6** RED `packages/shared/src/indicadores.test.ts` (41 pruebas, `it.each`). Rojo guardado (`npx vitest run packages/shared/src/indicadores.test.ts`): `Error: Cannot find module './indicadores' imported from '.../indicadores.test.ts'` — `Tests  no tests`. GREEN: `indicadores.ts` (154 líneas) → 41/41. Refactor: `armar` recibe el cálculo como función de los hitos (41/41 tras él). Export en `index.ts`: `export * from './indicadores'` (sin colisión: typecheck 0).

**1.7 Mutaciones** (aplicadas, ejecutadas, revertidas; `diff` contra la copia verde vacío):

| # | Mutación | Pruebas rojas (mensaje: esperado ≠ obtenido) |
|---|---|---|
| M7 | `diasNaturalesEntre(hasta, desde)` en `naturales` | 7: K8, K8b, K9, 47 (16/12→02/01 y K10), fórmula de Zoho, dos cotizaciones |
| M11 | `dias[0]` (primer valor) | 2: «vale el ÚLTIMO por performedAt aunque llegue desordenado» y «dos cotizaciones» |
| M12 | columna antes que historial | 2: «el historial gana a la columna» y K9 |
| M13 | 51 devuelve `0` sin la entrada | 1: K13 «sin entrada opcional el 51 es sin dato» |
| K14 | quitar `Fecha Remisión de Salida` de los hitos del 47 | 6, entre ellas «K14 guardián … Tiempo permanencia [47]: «Fecha Remisión de Salida» es hito de su columna» |

K14 nace roja por módulo inexistente (como todo el fichero); su discriminación es la fila K14 de arriba. Pruebas verdes de nacimiento: ninguna (todas rojas por módulo inexistente).

**1.8** `index.ts`: numstat `1 0` (sólo inserción, +1; ver desviaciones). `app.ts` sin diff. `calendarioLaboral.ts` sin diff.

**1.9 Cierre verde**: `npm test` 179 ficheros / 2673 pruebas verdes (2 omitidas, como antes), salida 0; `npm run typecheck` 0; `npm run build` 0; `npm run lint` 165 avisos, 0 errores.

## Desviaciones
1. `index.ts` gana UNA línea, no dos: el segundo `export` (`indicadoresComparacion`) no existe hasta 5a (5a.4 lo añade). 1.8 pedía 2.
2. Función pública del lote: `calcularIndicadoresNaturales` (47, 51, 55, 57, 58, 59). El lote 2 añade `calcularIndicadores` con los nueve (RQ-KP-01).
3. Fuente serializada = valor de dominio `columna_heredada` (no hay marca `columna`/`entrada`; la marca de 49 llega en el lote 2).
4. `Indicador` lleva `formulaZoho` desde ya (47, 51, 55 «sin dato»; 57-59 = letra); 49, 50·53, 54 en el lote 2.

## Medida (1.10)
`git diff --shortstat --no-renames 579eb5c`: 27 inserciones y 29 borrados (tracked) + `wc -l` de lo nuevo sin trackear: indicadores.ts 154, indicadores.test.ts 153, apply-progress.md 52 = 359. Total ≈ 415 frente a la válvula de 720.

## Lote 2 — días hábiles, 54 y variante de Zoho (2.1 a 2.10). Partida `24e636a`. Strict TDD.

**Hallazgo de partida (script del lote 1):** Zoho cuenta de lunes a viernes SIN festivos; el 54 de Zoho dice «Cumple» sin tiempo promesa y sin finalización. Resoluciones: R1 (49 sin marca = «sin dato»; la creación sólo vive en la variante; sin `fecha_creacion_ticket` la variante es «sin dato»), R2 (`diasLunesAViernesFormulaZoho` dentro de `indicadores.ts`; `calendarioLaboral.ts` sin tocar).

**2.2–2.4 RED** (`indicadores.test.ts`: +~60 casos; el `calc` pasa a `calcularIndicadores`, que no existe; el test de unidades pasa a las nueve). Salida del rojo (`npx vitest run packages/shared/src/indicadores.test.ts`, salida 1): `→ (0 , calcularIndicadores) is not a function` en todas las pruebas que usan `calc` y en `diasLunesAViernesFormulaZoho`.

**2.1 Alinear.** `design.md`: D2 y §3.2 (R2: `diasLunesAViernesFormulaZoho` dentro de `indicadores.ts`, `calendarioLaboral.ts` sin tocar; `diasNoHabilesDelIntervalo` = lista de días), §4 filas 47 (variante siempre «sin dato»), 49 y 50·53, K10, pruebas de la función y fila 2 de §11. `specs/kpis/spec.md` RQ-KP-03 (el «hábil» con festivos sólo sale de `diasHabilesEntre`; la cuenta de Zoho es de RQ-KP-11).

**2.5 GREEN.** `indicadores.ts` (251 líneas): `calcularIndicadores` (los nueve, en orden RQ-KP-01; sustituye a `calcularIndicadoresNaturales`, que sólo existía en el lote 1), 49, 50·53, 54, variantes, `diasNoHabilesDelIntervalo`, `diasLunesAViernesFormulaZoho`. Primera ejecución: 86/88; las dos rojas eran **errores de mi esperado a mano, no de spec ni de código**, comprobados con el calendario real: (a) 49 con creación del historial 02/12 y revisión 10/12 en lunes a viernes = 3, 4, 7, 8, 9, 10 = **6** (puse 5 olvidando que Zoho cuenta el festivo 08/12); (b) K12 53 = 4 / 52 = 4: la variante de K2 vale 5 (festivo contado) y 5 > 4 = «No cumple» (puse «Cumple»). Todos los casos de la spec (RQ-KP-05 a -07, -11) y de K1–K12 cuadran con `diasHabilesEntre` sin tocar esperados de la spec. Final: 88/88.

**2.6 Mutaciones** (aplicadas, ejecutadas, revertidas; `diff` contra la copia verde vacío; `calendarioLaboral.ts` también vuelve idéntico):

| # | Mutación | Rojas (primera) |
|---|---|---|
| M5 | hábiles por naturales en el 50 | 12 («K1 fin de semana», «K2 festivo 12/10», K2b, K3…) |
| M6 | quitar el 12/10 de `FESTIVOS_TRASLADABLES` (fichero de datos) | 9 («K2 festivo 12/10» y las del calendario) |
| M6b | quitar el 01/01 de `FESTIVOS_FIJOS` | 6 («cierre de fin de año: 28, 29, 30, 31, 4 y 5») |
| M8a | `[desde, hasta]` en `diasHabilesEntre` | 23 (K1, K2… y la del calendario) |
| M8b | `[desde, hasta]` en la cuenta de Zoho | 23 («K1 fin de semana (2 a 6 de octubre)»…) |
| M9 | orden de venta antes que repuestos | 4 («K6 los repuestos mandan», «spec: … 5 y no 11», K5, K7) |
| M10 | el invertido no se marca | 2 («K5 invertido», «la marca orden_invertido del 53 viaja con el 54») |
| M10b | sin tope: invertido con signo (naturales) | 13 |
| M11 | primer valor en vez del último | 3 («vale el ÚLTIMO por performedAt…», «dos cotizaciones…», «K7 reentrante») |
| M14 | variante del 47 cae en la remisión de salida | 3 («el 47 es sin dato aunque haya salida», y las dos de «con y sin entrada opcional») |
| M15a | quitar `sin_finalizar` | 3 |
| M15b | `Cumple` sin tiempo promesa en el valor | 1 («K12 sin tiempo promesa: valor sin dato (no Cumple)…») |
| M15c | `≤` por `<` | 4 («K12 53 = 4 con 52 = 4 cumple (igual)…», «6 contra 6», promesa 0…) |
| M15d | la variante del 54 sin promesa es «sin dato» | 1 (la misma de M15b) |
| M15e | el 54 sin las marcas del 53 | 2 |
| M19 | día UTC en vez de `diaEnZona` para la marca | 2 («K11 marca 06/10 02:30Z», «la marca 03/12 03:00Z es el día 2») |
| R1 | el 49 sin marca arranca de la creación | 1 («R1: heredado sin marca es sin dato…») |
| Z1 / Z2 | variante del 50 / del 49 con el calendario con festivos | 8 / 6 |
| Z3 | la variante descuenta festivos y cierres | 24 |
| H1 / H2 | hito invertido en el 49 / en el 50 | 5 / 14 |
| P1 / P2 | tiempo promesa: primer valor / la columna gana al historial | 1 / 1 |
| D1 | `diasNoHabilesDelIntervalo` sin filtrar fin de semana | 9 |
| O1 | los nueve en otro orden | 6 |

**Hallazgo de la mutación M10:** el «tope en 0» NO es discriminable por el valor: `diasHabilesEntre` ya devuelve 0 con `hasta ≤ desde` (RQ-KP-03), así que `invertido ? 0 : …` es redundante en el número; lo que sí está probado es la marca `orden_invertido` (M10) y que no se use una resta con signo (M10b). Una prueba «sin created_time» (49) no tiene mutación: el código no puede caer en `creadoEn` porque `diagnostico` ni lo recibe; la prueba guarda el contrato.

**2.7** `git diff --stat -- calendarioLaboral.ts calendarioLaboral.test.ts`: vacío.
**2.8 Cierre verde**: `npm test` 179 ficheros / 2720 pruebas verdes (2 omitidas), salida 0; `typecheck` 0; `build` 0; `lint` 165 avisos, 0 errores.

## Desviaciones (lote 2)
5. `calcularIndicadores` devuelve `Indicador[]` (no `FilaIndicadores` del diseño §3.1): la fila con `ticketId` es del serializador del lote 3. `calcularIndicadoresNaturales` se retira (sustituida).
6. Motivo del 54 sin tiempo promesa: el texto exacto de la spec, «falta el tiempo promesa» (no lleva «pendiente de decisión»; la decisión pendiente va en `ENTRADA.md`, E-175).
7. `Fecha creación ticket` entra como `EtiquetaHito` y como hito del 49 (sólo alimenta la variante); la marca de ingreso es un hito más del 49 con fuente `transicion` (no hay valor `marca` en `FuenteHito`).
8. Sin finalización o sin inicio, `diasNoHabilesDelIntervalo` es `null`; con inicio y fin (también invertido), es lista (vacía si no hay descuentos).

## Medida (2.9)
`git diff --shortstat --no-renames 24e636a` (antes de este bloque de notas): 301 inserciones y 25 borrados en 5 ficheros; sin ficheros nuevos sin trackear. Total ≈ 326 + `tasks.md` y estas notas ≈ 400, frente a la válvula de 720.
