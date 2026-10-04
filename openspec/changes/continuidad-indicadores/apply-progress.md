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
