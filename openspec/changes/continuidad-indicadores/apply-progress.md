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

## Lote 3 — lectura, ruta JSON y permiso (3.1 a 3.10). Partida `e252518`. Strict TDD.

**3.1 Alinear.** `design.md` §3.4 (`tablaIndicadores` devuelve una fila por ticket; consulta 1 con `codigo_servicio`; forma JSON de RQ-KP-13, `comparacion` `null` hasta 5a) y §6 (PG-2 también sin parámetros). La spec no cambia.

**3.2-3.3 RED.** `npx vitest run` de los dos ficheros: `indicadores.test.ts` → `Cannot find module './indicadores'`; `routes/indicadores.test.ts` → 8 de 8 rojas, `expected 404 to be 401` (PG-1), `404 to be 403` (PG-2), `404 to be 400` (PG-3), `404 to be 200`.
**3.4 GREEN.** `apps/desk/server/indicadores.ts` (92) y `routes/indicadores.ts` (34). Tras corregir mi siembra (`calendario_cierres` exige `motivo` y `registrado_por`): 24/24.
**3.5** `app.ts`: `wc -l` 96 antes y después; numstat `2 2`; `git diff -U0` sólo las líneas 22 y 61, con el añadido al final.

**3.6 Hipótesis (por ejecución).** (1) pg-mem ejecuta el `JOIN` y `values` llega como objeto: **se cumple** (la prueba de agrupación lee `values` con `toEqual`). (2) `date`: pg-mem entrega texto y `pg` un `Date` a medianoche UTC; `comoDiaCivil` (getters UTC) da el día en las dos formas (prueba con filas falsas de las dos formas): **se cumple** (la duda de `mappers.ts:26-28` queda sin fijar contra un `pg` real; no hay base real en este entorno). (3) Claves de `values`: el ESCRITOR (`ticketService.ts:155` → `valoresConMotivo` → `writeTransition`, `repo.ts:314-318`, `JSON.stringify(values)`) guarda la clave del campo del formulario, y `cfDate(label)` fija `key: label` (`transitions.ts:75-76`): son las etiquetas literales (`Fecha Remisión Entrada`, `Días de entrega`). **Se cumple**, ahora leído en el escritor.

**3.7 Mutaciones** (aplicadas, probadas, revertidas; `cmp` con la copia verde: iguales):

| # | Mutación | Prueba roja |
|---|---|---|
| M1 | `requireAdmin` tras `validarPeriodo` | PG-2 `{desde:'basura'}`: `expected 400 to be 403` |
| M2 | `requireAdmin` tras la lectura | PG-2 `{}`: `expected [ …(3) ] to deeply equal []` (el espía ve las tres consultas) y PG-2 basura `400 ≠ 403` |
| M3 | `requireAuth` tras `requireAdmin` | PG-1: `expected 403 to be 401` (y tres PG-3: `403 ≠ 400`) |
| M4 | `validarPeriodo` tras la lectura | PG-3 ×3: `expected [ …(3) ] to deeply equal []` |
| M20 | una consulta extra por ticket | recuento: `to have a length of 3 but got 5` (2 tickets) y `got 23` (20) |
| M21 | corte por día UTC y no `diaEnZona` | Bogotá: `[ 'fuera', 'dentro' ] ≠ [ 'dentro', 'tarde' ]` |
| M22 | límite superior sin ensanchar | Bogotá: `[ 'dentro' ] ≠ [ 'dentro', 'tarde' ]` |
| M23 | transiciones sin filtrar por los tickets del periodo | Bogotá: `[ 'fuera', 'dentro' ] ≠ [ 'dentro' ]` |

## Desviaciones (lote 3)
9. `tablaIndicadores` devuelve `FilaIndicadores[]` (sin `comparacion`, que es del 5a); el tipo es del servidor (`{ ticketId, codigoServicio, indicadores }`), no el de §3.1.
10. `formulaZoho` se serializa como valor o `null` (la spec no fija la forma del «sin dato» de la variante; se pierde su motivo en el JSON).
11. `formato=csv` se valida pero este lote responde JSON; la rama CSV es del lote 4.
12. Las consultas van sin calificar el esquema, como `listarCierres` y `analisis.ts` (`search_path=desk,public`).

**3.8 Cierre verde**: `npm test` 181 ficheros / 2744 pruebas verdes (2 omitidas), salida 0; `typecheck` 0; `build` 0; `lint` 165 avisos, 0 errores.

## Lote 4 — CSV y enlace en el cliente (4.1 a 4.10). Partida `d25ecda`. Strict TDD.

**4.1 Alinear.** Spec RQ-KP-15: BOM UTF-8 al principio y escenario «BOM y fin de línea» (R3). Diseño §3.4: formato largo de 13 columnas (se retira el de cinco columnas por indicador); §3.5 (`mostrarDescargaIndicadores`) y la cita de la barra a las líneas 81-88.

**4.2-4.3 RED** (`npx vitest run` de los tres ficheros): `csv.test.ts` → `Cannot find module './csv'`; `indicadoresUrl.test.ts` → `Cannot find module './indicadoresUrl'`; `routes/indicadores.test.ts` → 4 rojas nuevas, p. ej. `expected 'application/json; charset=utf-8' to be 'text/csv; charset=utf-8'` y `expected [ Array(1) ] to have a length of 19 but got 1`. **4.4 GREEN:** `util/csv.ts` (`aCsv`), rama CSV de la ruta (después de sesión, administrador, validación y lectura: mismas guardas, mismo orden) e `indicadoresUrl.ts` → 49/49.

**4.5** `Analisis.tsx`: +4 líneas (2 `import` en `:5-6`, `const { user } = useAuth()` en `:76`, el `<a download>` en la línea 83); sin rojo previo (`.tsx` fuera de la red, F0-00). `api/client.ts`: sin diff.

**4.6 Mutaciones** (aplicadas, probadas, revertidas; `cmp` con la copia verde: iguales). Pruebas rojas con su primer nombre:

| # | Mutación | Rojas | Primera roja |
|---|---|---|---|
| M18a/b/c/d | quitar `=` / `+` / `-` / `@` del apóstrofo | 5 / 1 / 3 / 1 | «texto "=1+1" … apóstrofo delante» / «"+57"» / «"-x"» y «`-5 casos`» / «"@a"» |
| M18e | quitar tabulador y CR del apóstrofo | 2 | «texto "\tx"…» y «empieza por retorno de carro» |
| M18f | no duplicar comillas | 4 | «comillas dobles: se duplican y la celda va entrecomillada» |
| M18g | apóstrofo a los números negativos | 2 | «el NÚMERO −228 sale como número, sin apóstrofo» |
| M18h | sin BOM | 5 | «cabeceras de descarga y cuerpo con BOM, CRLF…» |
| M18i | LF en vez de CRLF | 25 | idem (y todas las de fila) |
| M18j/k/l | no entrecomillar `;` / LF / CR | 1 / 1 / 2 | «separador `;` dentro de la celda…» / «salto de línea LF…» / «retorno de carro…» |
| M18m | separador `,` | 5 | «cabecera exacta de 13 columnas» |
| U1 | URL sin codificar | 1 | «codifica los caracteres especiales» |
| U2 | valores vacíos entran | 1 | «valores vacíos no entran» |
| U3 | URL absoluta | 6 | «sin periodo: sólo el formato» |
| U4 / U5 | enlace para todos / para cualquier truthy | 4 / 2 | «usuario {"isAdmin":false} → false» |
| R2 | sin `Content-Disposition` | 1 | «cabeceras de descarga y cuerpo…» |
| R3 | cabecera sin `valor_zoho` | 2 | «cabecera exacta de 13 columnas» |
| R1 | `Content-Type` sin charset | **0 (sobrevive)** | **equivalente:** Express añade `; charset=utf-8` a `text/*` al enviar una cadena; el valor final es el mismo, no hay cambio observable que probar |

La posición de las guardas en la rama CSV la fijan las pruebas PG-1 a PG-3 del lote 3 (M1 a M4, ya reproducidas) más la nueva «PG-2 en CSV» (403 y no 400) y «las guardas son las mismas».

**4.7 Barrido de `Analisis.tsx:N`** (`git grep` sobre todo el árbol, `openspec/changes/archive/` incluido): **3 citas**. (1) `docs/sdd/ENTRADA.md:1284`, línea 95 del componente, → la tarjeta «Cumplimiento promesa»; hoy está en `:99`. Es caso **B** («Medido el 2026-10-01 sobre `e27f9da`», frase fechada y anclada): se deja; además `ENTRADA.md` no se toca en este lote. (2) la baseline F0-00 (línea 137), línea 70 del componente, → `export function Analisis`, as-built fechado: caso **B**, se deja (hoy `:72`). (3) la cita del diseño §3.5 a la barra superior (líneas 78 a 84 en la partida); caso **A** en fichero vivo: reapuntada a las líneas 81 a 88 (cabecera 81, cierre 88), y la abreviada de `tasks.md` (4.5) igual. Además la cita de la baseline pasa a nombrar su revisión (`en d25ecda`): caso **B**, porque la línea 70 ya no es la declaración. Reparadas: 3. Detector tras el commit: en el informe final.

**4.8 Cierre verde**: ver informe final del lote (test, typecheck, build, lint).

## Desviaciones (lote 4)
13. `X-Content-Type-Options: nosniff` en la respuesta CSV (molde de `certificadoFabrica.ts`); el diseño sólo nombraba tipo y disposición.
14. `fuente_hitos` se escribe `hito: fuente` (la spec dice «cada hito con su fuente» sin fijar el separador interno); `indicador` = primer nombre de `NOMBRES_ZOHO` (la spec no fija el texto).
15. Cada fila, la cabecera incluida, termina en CRLF (también la última), no sólo «entre filas».
16. `mostrarDescargaIndicadores` es un segundo export de `indicadoresUrl.ts` (el diseño sólo nombraba `urlIndicadores`): la decisión de mostrar el enlace es la otra lógica decidible del cliente.

## Medida (4.9)
`git diff --shortstat --no-renames d25ecda` (antes de esta nota): 138 inserciones y 18 borrados en 7 ficheros; sin trackear: csv.ts 21, csv.test.ts 36, indicadoresUrl.ts 18, indicadoresUrl.test.ts 20 = 95. Total 251 frente a la válvula de 720. Sin binarios.

## Lote 5a — comparación por pares (5a.1 a 5a.9). Partida `d0a7c85`. Strict TDD.

**5a.1 Alinear.** Spec RQ-KP-16 y SP-6 (R4: se publican DOS lecturas, por indicador y de tickets en que todo lo comparable coincide; la letra no precisa cuál es «el 95 % de los tickets»; `tickets` y `nota` en el resumen; diferencias de la variante en `variante.diferencias`). Diseño §3.3 reescrito a lo construido (`porcentaje` ×100 a un decimal, `diferentes`, `porColumna` siempre con los nueve, lista de días descontados y no un número, sin `causas`, mensajes del 17).

**5a.2–5a.3 RED.** Salida guardada: `indicadoresComparacion.test.ts` → `Transform failed` / `Tests no tests` (módulo inexistente); `routes/indicadores.test.ts` → `expected null to match object { comparable: false, …}` en 5 de 21 (la ruta responde `comparacion: null`). **Desviación de proceso, declarada:** escribí `indicadoresComparacion.ts` ANTES de la prueba por descuido; lo aparté (`mv`) y confirmé el rojo del módulo inexistente, y lo restauré sólo después. El rojo de comportamiento de la prueba unitaria se vio al restaurar: 3 de 22 rojas por errores de MIS pruebas (helper con variante = letra duplicaba diferencias; «No  cumple» con doble espacio no es valor de Zoho en el 54), corregidas en la prueba, no en el código. Con el diseño de `variante.diferencias` salió una cuarta corrección del código (diferencias de la variante aparte): el escenario del 59 pide UNA diferencia.

**5a.4 GREEN.** `indicadoresComparacion.ts` (129 líneas): `compararIndicadores`, `parDeIndicador`, `TOLERANCIA_DIAS`. Ruta: `comparacion: compararIndicadores(filas.flatMap(… parDeIndicador …))`, sólo con `custom_fields` ya leídos (las mismas tres consultas, ningún fichero). `index.ts`: `+1` línea al final.

**5a.5 Mutaciones** (aplicadas por script, pruebas ejecutadas, revertidas; `cmp` con la copia verde: iguales). Rojas (de ambos ficheros) y primera:

| # | Mutación | Rojas | Primera roja |
|---|---|---|---|
| M16 | tolerancia 2 | 7 | «la tolerancia de la letra es de un día»: `expected 2 to be 1` (C2: `(6,8)` coincidiría) |
| M16b | `<` por `≤` | 7 | C1: `expected [2,0,2,2,0] to deeply equal [2,1,1,2,50]` |
| M17a | par sin valor de Zoho coincide | 7 | C1: `[3,2,1,1,66.7] ≠ [2,1,1,2,50]` |
| M17b | `sin_dato` de la app coincide | 8 | C1: igual |
| M17c | `sin_dato` de la variante coincide | 4 | C5: `[1,1,0,0,100] ≠ [0,0,0,1,null]` |
| P1 | porcentaje sin ×100 | 15 | C1: `0.5 ≠ 50` |
| P2 / P2b | `null` por `0` / por `100` con `comparados = 0` | 8 / 8 | C4: `[0,0,0,1,0] ≠ […,null]` / `100 ≠ null` |
| P3 | denominador con `sinComparar` | 11 | C1: `25 ≠ 50` |
| T1 / T2 | texto sensible a mayúsculas / sin recortar espacios | 2 / 2 | C6 / C6b |
| K1 | el ticket siempre coincide | 2 | C9 |
| D1 | sin los días descontados | 1 | C8 |
| V1 | variante contra la letra | 3 | C5 |
| N1 | el mensaje «sin valor de Zoho» no sale | 3 | C12 |

**5a.6** `numstat` de `index.ts`: `1 0`; `app.ts` sin diff. **5a.7 Cierre verde:** `npm test` salida 0 (184 ficheros pasan, 1 omitido; 2811 pruebas, 2 omitidas); `typecheck` 0; `build` 0; `lint` 165 avisos, 0 errores.

## Desviaciones (lote 5a)
17. La comparación textual NO es «sólo recortar espacios» sino recortar **y no distinguir mayúsculas**: lo exige el escenario de la spec (`No Cumple` = `No cumple`); la letra no dice nada al respecto.
18. En el 54, un valor de Zoho que no sea Cumple/No cumple (tras recortar y minúsculas) es «sin valor de Zoho» (lo pide la spec).
19. Un valor de Zoho numérico guardado como texto (`"5"`) cuenta como su número.
20. `diferencias` de la letra y `variante.diferencias` van separadas (el diseño ponía una lista con `causas`; se retira `causas`: la spec pide los días descontados y los hitos, no atribuir causa).
21. `tickets` sólo se calcula para la letra (no hay porcentaje de tickets de la variante: la spec no lo pide).
22. Veredicto: la spec y el diseño NO piden pintar aprobado/no aprobado; no se construyó ninguno y la prueba C13 vigila que no haya claves de aprobado, semáforo, umbral ni meta.

## Medida (5a.8)
`git diff --shortstat --no-renames d0a7c85` (con lo nuevo marcado `add -N`, antes de esta nota): 411 inserciones y 29 borrados en 9 ficheros; total 440 frente a la válvula de 720. Sin binarios.
