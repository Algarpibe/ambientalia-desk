# Tareas: continuidad de los nueve indicadores de Zoho (F1F-05, `cierra: no`)

Worktree `C:\dev\Desk_2_R1.023-worktrees\continuidad-indicadores`. Preflight: auto · hybrid · ask-on-risk · 800 (válvula 720) · strict_tdd. Seis lotes de apply (los cinco del diseño, con el 5 partido en 5a y 5b: ver el forecast), cada uno con su suite en verde y su propio commit. Abrir intento y `settle` del registro son del orquestador y **no** son casillas. Citas contra el árbol de `f55b7d9`.

**Reglas comunes a todos los lotes** (no se repiten en cada casilla): orden estricto rojo → verde; una prueba que nace verde se declara con la mutación que la detecta; toda mutación se revierte y se comprueba con `git diff` (vuelve al diff del verde); «cierre verde» = `npm test`, `npm run typecheck` y `npm run build` con **código de salida 0** y `npm run lint` con **exactamente 165 avisos y 0 errores**; «medida» = `git diff --shortstat --no-renames <commit de partida>` más `wc -l` de lo nuevo sin trackear, contra la válvula de **720** (si se va a pasar, parar y partir); «commit» = conventional commit sin atribución, y después `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` con salida 0. Los números de lote 1 a 5a/5b se refieren al diseño §11.

**Resoluciones del orquestador aplicadas** (cada una nombra el fichero que se corrige, en la primera casilla del lote afectado): R1 → 49 sin marca es «sin dato», S-9 sólo en la variante (`design.md`); R2 → la función L-V no entra en `calendarioLaboral.ts` (`design.md`); R3 → CSV con `;`, CRLF y BOM (`specs/kpis/spec.md`); R4 → se publican los dos porcentajes (`specs/kpis/spec.md`); R5 → el valor de Zoho del 55 va en `valorZoho` (`design.md`, `proposal.md`); R6 → sin parámetros, todos los tickets; R7 → `client.ts` no se toca.

## Review Workload Forecast

| Lote | Código | Pruebas ×1,8 | Casillas (diseño) | Correcciones en sitio + `apply-progress` | Estimado | ×1,6 | Frente a 720 |
|---|---|---|---|---|---|---|---|
| 1 | 125 | 225 | 25 | 28 + 20 | 423 | **677** | −43 |
| 2 | 120 | 215 | 25 | 32 + 10 | 402 | **643** | −77 |
| 3 | 125 | 225 | 20 | 40 + 10 | 420 | **672** | −48 |
| 4 | 100 | 180 | 20 | 30 + 10 | 340 | **544** | −176 |
| 5a | 115 | 205 | 20 | 40 + 10 | 390 | **624** | −96 |
| 5b | — | — | — | documentos 230 (ENTRADA 70, F0-01 35, DEPLOY 45, `config.yaml` 5, regla 13 35, reparación de citas 30, `tasks.md` 10) | 230 | **368** | −352 |

**Por qué el lote 5 se parte.** Sin partir, 5a + 5b serían 390 + 230 = 620 y ×1,6 = **992**, por encima de 720. Con la partición, ningún lote lo pasa; los márgenes más estrechos son el lote 1 (43) y el 3 (48): se mide a mitad de lote, antes de escribir las mutaciones. Una edición en sitio cuenta 2.

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: no aplica (una rama, seis commits, fusión a `main` al cerrar cada intento tras el `settle`)
400-line budget risk: Low (techo operativo 800, sin revisión por PR)

## Lote 1 — hitos, naturales, 51 y 55, `valorDeZoho` (RQ-KP-01 a -04, -08 a -11 parcial, -10)

- [ ] 1.1 Línea base: `npm test`, `npm run typecheck`, `npm run lint` (165) y anotarla. Si `apps/desk/server/reconciliacion/registro.test.ts` («en curso») está roja por la cabecera `tanda: F1F-05`, `cierra: no`, ajustar en sitio la lista y el título (sin añadir líneas), como la casilla 1.2 de `openspec/changes/archive/2026-10-03-tipo-servicio-ticket-sin-ov/tasks.md`; si está verde, no se toca.
- [ ] 1.2 **Alinear spec y diseño** — se corrige **`design.md`**: §4 fila 49 y S-9 (R1: sin marca → `sin_dato/hito_ausente`, la fecha de creación sólo vive en la variante); §3.1 y K13 (R5: el 55 de Zoho va en `valorZoho`, se elimina la marca `copiado_de_zoho`); tipos (`codigoServicio` en `TicketParaIndicadores`, `calificacionSatisfaccion` en `OpcionesIndicadores`, columna `50_53`, unidad `cumplimiento`, fuente serializada `transicion`/`columna_heredada`, `motivo` como texto de la spec). Y se corrige **`proposal.md`** §4 fila 55 («se copia» → «va en la columna del valor de Zoho»).
- [ ] 1.3 Script de un solo uso **fuera del repositorio** (directorio temporal; NO se commitea): sobre las 640 filas de `docs/analisis-tickets/Tickets.csv` verifica las fórmulas de Zoho que el diseño da por hipótesis (57, 58 y 59 naturales; 49 y 50 de lunes a viernes sin festivos; el 54 «Cumple»). Anota en `apply-progress.md` cuántas filas cuadran **por indicador**. Si una fórmula NO cuadra no se inventa otra: se anota y se **devuelve** (parar el lote).
- [ ] 1.4 RED `packages/shared/src/indicadores.test.ts`: `resolverHito` (historial gana, último valor, columna con fuente `columna`, ausente), 47/57/58/59 naturales con signo (K8, K8b, K10 sin variante), 57 reentrante con dos cotizaciones (`true`; una sola `false`; sin historial `null`). Rojo: módulo inexistente.
- [ ] 1.5 RED mismo fichero: 51 y 55 «sin dato» con motivo en texto, 51 con `horaActualizacionEstado` → 3 (K13), 55 con «Good» en `camposZoho` → `valor` «sin dato» y `valorZoho` «Good» (R5); `valorDeZoho` (K15: erratas del diccionario, `"12"` → 12, ausente y no numérico → `null`); guardián K14 contra `INDICADORES_G6`. Confirmar el rojo con `npx vitest run packages/shared/src/indicadores.test.ts`.
- [ ] 1.6 GREEN `packages/shared/src/indicadores.ts` (tipos, `resolverHito`, naturales, reentrancia, 51 y 55, `valorDeZoho`, `NOMBRES_ZOHO`) y los dos `export` en `packages/shared/src/index.ts` después de `:28`, sin desplazar nada.
- [ ] 1.7 Mutaciones, cada una con su rojo nombrado: **M7** invertir desde/hasta en 47, 57, 58 y 59 → K8, K8b, K10; **M11** primer valor en vez del último (en el 57) → la prueba de reentrante; **M12** leer la columna antes que el historial → K9; **M13** el 51 devuelve número sin la entrada → K13. K14 nace rojo por módulo inexistente; su discriminación: quitar de los hitos del 47 el campo de remisión de salida → K14 roja.
- [ ] 1.8 `git diff --numstat -- packages/shared/src/index.ts` da **2 añadidas, 0 borradas** y `wc -l` sólo crece en esas 2; `apps/desk/server/app.ts` sin diff.
- [ ] 1.9 Cierre verde del lote.
- [ ] 1.10 Medida (con `wc -l` de `indicadores.ts` y `indicadores.test.ts`); anotar la cifra en `apply-progress.md`.
- [ ] 1.11 Commit: `feat(kpis): hitos, tiempos naturales y entradas opcionales de los indicadores (F1F-05, cierra: no)`; detector con salida 0.

## Lote 2 — hábiles, 54 y variante de Zoho (RQ-KP-05 a -07, -11)

- [ ] 2.1 **Alinear spec y diseño**: se corrige **`design.md`** (R2: `diasDeJornadaEntre` desaparece de §3.2, D2 y la tabla de §11; la función va dentro de `indicadores.ts` con el nombre `diasLunesAViernesFormulaZoho` y un comentario de que es la fórmula de Zoho, no el calendario laboral; sus pruebas pasan de `calendarioLaboral.test.ts` a `indicadores.test.ts`; la variante del 49 parte sólo de `Fecha creación ticket`, historial o `fecha_creacion_ticket`, sin caer en `created_time`, como dice RQ-KP-11; K10: la variante del 47 es «sin dato» siempre, se elimina el caso del 19). Y se corrige **`specs/kpis/spec.md`** RQ-KP-03 (la exclusión de «otra aritmética hábil» alcanza a los días hábiles con festivos; la fórmula de Zoho está etiquetada y es de RQ-KP-11).
- [ ] 2.2 RED `indicadores.test.ts`, 50·53: K1, K2, K2b, K3, K4, K5, K6, K7 (reentrante), y «sin finalización → 0 + `sinFinalizar`», «con finalización y sin inicio → sin dato».
- [ ] 2.3 RED mismo fichero, 49: K11 (marca en Bogotá, 5 y variante 11), **R1: heredado sin marca → «sin dato — falta el hito: marca de ingreso a servicio»** y su variante sí calculada desde la creación; escenario de la spec (creación 12-01 → valor 5, `formulaZoho` 7).
- [ ] 2.4 RED mismo fichero, 54 y variantes: K12 (cuatro casos), escenarios de la spec (6 contra 6 `Cumple`; 6 contra 5 `No cumple`; difiere por fórmula `Cumple`/`No cumple`; sin promesa → variante `Cumple`), variante del 47 «sin dato» con entrada y sin ella, `diasLunesAViernesFormulaZoho` (K1 3, K2 5, K3 12, mismo día 0). Confirmar el rojo.
- [ ] 2.5 GREEN `indicadores.ts` (49, 50·53, 54, variantes, `diasNoHabilesDelIntervalo` como lista de días descontados, que pide RQ-KP-16 para el lote 5a). `calendarioLaboral.ts` **no se edita**.
- [ ] 2.6 Mutaciones: **M5** hábiles por naturales en el 50 → K1, K2; **M6** quitar el 12/10 de `FESTIVOS_TRASLADABLES` (mutación en el fichero de datos, regla 2 aplicada al calendario) → K2; **M8** `(desde, hasta]` por `[desde, hasta]` → K4; **M9** orden de venta antes que repuestos → K6; **M10** quitar el tope en 0 → K5; **M11** primer valor en el 50 → K7; **M14** variante del 47 cae en la remisión de salida → la prueba de variante; **M15** quitar `sinFinalizar`, `Cumple` sin promesa, `≤` por `<` → K12 (una por cambio); **M19** día UTC en vez de `diaEnZona` para la marca → K11.
- [ ] 2.7 `git diff -- packages/shared/src/calendarioLaboral.ts packages/shared/src/calendarioLaboral.test.ts` **vacío** (R2).
- [ ] 2.8 Cierre verde del lote.
- [ ] 2.9 Medida; anotar la cifra.
- [ ] 2.10 Commit: `feat(kpis): indicadores en días hábiles, cumplimiento del tiempo promesa y variante de Zoho (F1F-05, cierra: no)`; detector con salida 0.

## Lote 3 — lectura, ruta JSON y permiso (RQ-KP-12 a -14)

- [ ] 3.1 **Alinear spec y diseño** — se corrige **`design.md`** §3.4 y §6: la respuesta JSON sigue RQ-KP-13 (`{ periodo, tickets, comparacion }`; por ticket `ticketId`, `codigoServicio`, `indicadores`; por indicador `columna`, `valor`, `unidad`, `estado`, `motivo`, `hitos` como lista `{ nombre, dia, fuente }`, `reentrante`, `sinFinalizar`, `formulaZoho`, `valorZoho`); `orden_invertido` queda en el dominio y no se serializa; la consulta 1 añade `codigo_servicio`. La spec no cambia.
- [ ] 3.2 RED `apps/desk/server/indicadores.test.ts` (pg-mem): `validarPeriodo` (fechas inexistentes, orden, formato), lectura con dos tickets y cinco transiciones, espía que cuenta **exactamente tres** consultas con dos y con veinte tickets, periodo en Bogotá (`2026-10-01T03:00:00Z` fuera con `desde=2026-10-01`), columna `date` como `Date` y como texto, sin parámetros → todos (R6).
- [ ] 3.3 RED `apps/desk/server/routes/indicadores.test.ts`: PG-1, PG-2, PG-3 con base espía por `appWith({}, espia)`; administrador → 200 con K2 sembrado (50 = 4, variante 5) y la forma de 3.1; `400` con `{ error }` en español. Confirmar el rojo.
- [ ] 3.4 GREEN `apps/desk/server/indicadores.ts` (`validarPeriodo`, `leerEntradasIndicadores`, `tablaIndicadores`) y `apps/desk/server/routes/indicadores.ts` con el serializador a la forma de RQ-KP-13 (`requireAuth` → `requireAdmin` → `validarPeriodo` → lectura).
- [ ] 3.5 `apps/desk/server/app.ts`: `import` al final de la línea `:22` y llamada al final de la `:61`, **ediciones en la misma línea**; `wc -l` del fichero antes y después **idéntico** y `git diff -U0` sólo toca esas dos líneas.
- [ ] 3.6 Hipótesis del diseño §13.1 y §13.2 (JOIN en pg-mem, `date` con las dos formas): anotar en `apply-progress.md` si se cumplen. Regla 13 se escribe en el lote 5b.
- [ ] 3.7 Mutaciones de **posición** (regla 1): **M1** `requireAdmin` detrás de `validarPeriodo` → PG-2 (400); **M2** detrás de la lectura → PG-2 (el espía ve `ticket_transitions`); **M3** `requireAuth` detrás de `requireAdmin` → PG-1 (403); **M4** `validarPeriodo` detrás de la lectura → PG-3; **M20** una consulta por ticket → la del recuento.
- [ ] 3.8 Cierre verde del lote.
- [ ] 3.9 Medida; anotar la cifra.
- [ ] 3.10 Commit: `feat(kpis): ruta GET /api/indicadores de sólo lectura para administradores (F1F-05, cierra: no)`; detector con salida 0.

## Lote 4 — CSV y enlace en el cliente (RQ-KP-15, -18)

- [ ] 4.1 **Alinear spec y diseño**: se corrige **`specs/kpis/spec.md`** RQ-KP-15 (R3: separador `;`, fin de línea CRLF **y BOM UTF-8 al principio**, con su escenario) y **`design.md`** D7 y §3.4 (el CSV es el formato largo de la spec: una fila por ticket e indicador, las 13 columnas de RQ-KP-15; se retira la descripción de cinco columnas por indicador).
- [ ] 4.2 RED `apps/desk/server/util/csv.test.ts`: casos del diseño §9 (comillas duplicadas, salto de línea, `;`, `=`, `+`, `-`, `@`, `=A"`, número −228 sin apóstrofo, texto `-228` con apóstrofo, `null`), BOM al principio y CRLF entre filas.
- [ ] 4.3 RED `apps/desk/server/routes/indicadores.test.ts` (al final): `formato=csv` → `text/csv; charset=utf-8`, `Content-Disposition`, cabecera exacta de 13 columnas, una fila por ticket e indicador. RED `apps/desk/src/lib/indicadoresUrl.test.ts`: sin periodo, con periodo, codificación. Confirmar el rojo.
- [ ] 4.4 GREEN `apps/desk/server/util/csv.ts`, la salida CSV de la ruta y `apps/desk/src/lib/indicadoresUrl.ts` (`URLSearchParams`).
- [ ] 4.5 GREEN `apps/desk/src/components/Analisis.tsx`: `import` y un `<a href={urlIndicadores('csv')} download>` «Descargar indicadores (CSV)» en la barra `:78-84`, visible si `user?.isAdmin`. Sin rojo previo: `.tsx` fuera de la red de pruebas por decisión de Gerencia (F0-00); no se propone jsdom. `apps/desk/src/api/client.ts` **sin diff** (R7).
- [ ] 4.6 Mutaciones **M18**: quitar el apóstrofo de `=`, de `+`, de `-` y de `@` (una a una), quitar el duplicado de comillas, aplicar el apóstrofo a los números, quitar el BOM, cambiar CRLF por LF → una prueba roja por cada una (nombrarla).
- [ ] 4.7 Barrido dirigido de citas a `Analisis.tsx` (el `import` desplaza líneas): `grep -rnoE "Analisis\.tsx:[0-9]+(-[0-9]+)?"` sin excluir `openspec/changes/archive/`; cada resultado contra el fichero, principio y final del rango por separado; reparar lo roto para que el detector dé 0. El barrido completo es de 5b.
- [ ] 4.8 Cierre verde del lote.
- [ ] 4.9 Medida; anotar la cifra.
- [ ] 4.10 Commit: `feat(kpis): salida CSV con escapado y enlace de descarga para administradores (F1F-05, cierra: no)`; detector con salida 0.

## Lote 5a — comparación (RQ-KP-16, -17)

- [ ] 5a.1 **Alinear spec y diseño**: se corrige **`specs/kpis/spec.md`** RQ-KP-16 (R4: se publican **dos** lecturas, por indicador y de tickets en que todo lo comparable coincide, y se dice que la letra no precisa cuál es «el 95 % de los tickets»; SP-6 se ajusta). Y **`design.md`** §3.3 a la spec: `porcentaje` ×100 con un decimal, campo `diferentes`, mensajes «sin valor de Zoho con que comparar» y «sin pares comparables», `porColumna` presente con `porcentaje` `null` aun sin pares, la diferencia lleva la lista de días descontados y no un número, «sin comparar» incluye `sin_dato` de la variante, textos iguales sin mayúsculas ni espacios **laterales**.
- [ ] 5a.2 RED `packages/shared/src/indicadoresComparacion.test.ts`: C1 a C8 y los escenarios de RQ-KP-16 (cuatro pares del 50·53, tolerancia, `sin dato` nunca coincide, textos del 54, diferencia con días `2026-12-25` y `2027-01-01`, letra contra variante).
- [ ] 5a.3 RED `apps/desk/server/routes/indicadores.test.ts` (al final): sin valores de Zoho → «sin valor de Zoho con que comparar» y porcentaje `null` en cada indicador; con valores de Zoho pero ningún par comparable → «sin pares comparables»; con «Tiempo de servicio» en `custom_fields` y el escenario del 59 (3 comparados, 2 coincidentes, `66.7`, una diferencia). Confirmar el rojo.
- [ ] 5a.4 GREEN `packages/shared/src/indicadoresComparacion.ts`, el `export` (después de lo añadido en el lote 1, sin desplazar líneas) y el resumen en la ruta (sólo con lo sincronizado; ningún fichero).
- [ ] 5a.5 Mutaciones: **M16** tolerancia 2 → C2; **M17** contar como coincidente un par sin valor de Zoho, un `sin_dato` en la app y un `sin_dato` en la variante → C3, C4, C5 (una por cambio); porcentaje sin ×100 o con `0` en vez de `null` con `comparados = 0` → su prueba.
- [ ] 5a.6 `git diff --numstat -- packages/shared/src/index.ts` sólo añade; `apps/desk/server/app.ts` sin diff en este lote.
- [ ] 5a.7 Cierre verde del lote.
- [ ] 5a.8 Medida; anotar la cifra.
- [ ] 5a.9 Commit: `feat(kpis): comparación con Zoho por pares, con tolerancia de un día y explicación de diferencias (F1F-05, cierra: no)`; detector con salida 0.

## Lote 5b — cierre documental y de citas

- [ ] 5b.1 **Regla 13 por escrito** en `apply-progress.md`, decisión a decisión con la tabla del diseño §7 y la línea del servidor fijada contra el árbol de ese día (`requireAuth`/`requireAdmin` de la ruta nueva, `validarPeriodo`); el enlace sólo-admin es presentación y la imposición es la del servidor (PG-1, PG-2).
- [ ] 5b.2 `docs/sdd/ENTRADA.md`, **al final**, desde **E-171** (otras ramas usan E-160 a E-170), una entrada por pregunta: E-171 hito del 51; E-172 fuente del 55; E-173 cómo se compara si los valores de Zoho no llegan; E-174 el 47 de Zoho mide hasta el último cambio de estado; E-175 54 sin tiempo promesa; E-176 54 sin finalización; E-177 unidad del 49; E-178 fórmula del 59; E-179 qué porcentaje es «el 95 %»; E-180 `Fecha Orden de Venta Final`; y **E-181** con las tareas de persona P-1 a P-4 como **condición de despliegue**.
- [ ] 5b.3 `docs/sdd/F0-01_Correcciones_para_el_maestro.md`, **al final** (`toca_maestro: si`): el Anexo H deja de decir «sin empezar» (`R08.4.md:6560`); el G.6 recoge que el 47 de Zoho no usa la remisión de salida, que el 59 tiene fórmula y que el 51 depende de un dato que Desk 2.0 no guarda. El `.docx` no se toca.
- [ ] 5b.4 `DEPLOY.md`, **al final**: la consulta de **sólo lectura** de P-1 (la del diseño §12, `BEGIN TRANSACTION READ ONLY … ROLLBACK`), la fecha límite de despliegue (**antes del 13/11** para medir desde el 16/11) y la nota de que no hay variable ni esquema nuevos.
- [ ] 5b.5 `openspec/config.yaml:263-265`: comprobar si «No hay módulo de KPIs ni pantalla … La capacidad NO tiene spec» queda falsa con el cambio; si lo queda, **sólo** esas líneas se ponen al día (descripción de capacidad); no se toca ninguna decisión ni `capabilities`.
- [ ] 5b.6 Barrido de citas (regla 4) sobre **todos** los ficheros editados por los seis lotes, `Analisis.tsx` incluido, **sin excluir `openspec/changes/archive/`**: `grep -rnoE "(app|indicadores|Analisis|index|calendarioLaboral|config)\.(ts|tsx|yaml):[0-9]+(-[0-9]+)?" .` y la misma cadena para `DEPLOY.md`, `ENTRADA.md`, `F0-01`; cada resultado contra el fichero, principio y final por separado.
- [ ] 5b.7 Pase de abreviadas (el detector no las bloquea) en `CLAUDE.md`, `openspec/config.yaml` y las specs que citen estos ficheros; informar de lo hallado.
- [ ] 5b.8 Reparar lo roto como caso A (a hoy), B (nombrando la revisión) o C (conservando y añadiendo qué lo cerró); nunca renumerar a ciegas.
- [ ] 5b.9 Cierre verde del lote; `npm run reconcile` (o el barrido de `registro.test.ts`) sin defectos de registro.
- [ ] 5b.10 Medida (documentos nuevos con `wc -l`); anotar la cifra.
- [ ] 5b.11 Commit: `docs(kpis): preguntas, condiciones de despliegue y reparación de citas de continuidad-indicadores (F1F-05, cierra: no)`; detector con salida 0.

## De personas — no son tareas de esta tanda; archivar no las da por hechas

| Tarea | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|
| **P-1** Consulta de sólo lectura en producción: ¿llegan los valores de las columnas 47 a 59 y la satisfacción en `custom_fields` o en `raw`? | Quien administra el despliegue | Decide si el resumen tendrá valor de Zoho o abre E-173 | `DEPLOY.md` (consulta), `docs/sdd/ENTRADA.md` → E-181 |
| **P-2** Desplegar **antes del 13/11** para medir desde el 16/11 | Quien administra el despliegue | Habilita la comprobación de cuatro semanas | `DEPLOY.md`, `docs/sdd/ENTRADA.md` → E-181 |
| **P-3** Comprobar las cuatro semanas y explicar por escrito cada diferencia mayor de un día | Gerencia, con Servicio Técnico y Comercial | Dar los nueve por buenos | `docs/sdd/ENTRADA.md` → E-181 |
| **P-4** Responder E-171 a E-180 | Gerencia | Cerrar la fila F1F-05 en un cambio posterior | `docs/sdd/ENTRADA.md` → E-171 a E-180; la respuesta, a `openspec/config.yaml` → `decisiones_de_gerencia` |

## Instrucciones para `verify` y `archive` (SIN casilla)

- `verify`: re-ejecutar M1 a M20 contra el árbol de ese día y fijar las líneas de las funciones nuevas; contrastar dato a dato los informes de los subagentes antes de cada `settle`; comprobar que ninguna contradicción spec↔diseño resuelta en las casillas «Alinear» ha vuelto; el `verify-report.md` es un sumando del presupuesto.
- `archive`: fusionar el delta `specs/kpis/spec.md` como spec viva nueva; medir **antes de aplicar** la parte revisable (spec viva + `archive-report.md`) ≤ 800; el commit de archivo contiene **sólo** este cambio (`git show --numstat`); `cierra: no`: F1F-05 sigue «en curso»; segundo barrido de citas tras la fusión; `archive-report.md` en una línea: cubre la continuidad de los indicadores (siete calculados, 51 y 55 «sin dato»), deja fuera H-1, H-2 y la comparación sin valores de Zoho.
