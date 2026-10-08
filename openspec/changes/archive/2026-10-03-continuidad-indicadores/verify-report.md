# Informe de verificación: continuidad-indicadores (F1F-05, `cierra: no`)

| Dato | Valor |
|---|---|
| Revisión verificada | `3c669e7` (base `f55b7d9`), rama `continuidad-indicadores` |
| Modo | `strict_tdd`; ejecutado de forma independiente, sin fiarse de `apply-progress.md` |
| Veredicto | **PASS WITH WARNINGS** |
| Hallazgos | **0 CRITICAL · 5 WARNING · 4 SUGGESTION** |
| Siguiente fase recomendada | `sdd-archive`, tras atender los WARNING 1 y 2 (texto de la spec y prueba de sólo lectura) |

El maestro citable es `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md` («R08.4.md» abajo).

## 1 · Ejecución (códigos de salida reales, en el árbol limpio de `3c669e7`)

| Orden | Resultado | Salida |
|---|---|---|
| `npm test` | 184 ficheros pasan, 1 omitido; 2.811 pruebas pasan, 2 omitidas (128,7 s) | **0** |
| `npm run typecheck` | sin errores | **0** |
| `npm run build` | `built in 1.60s`, `Analisis-*.js` 4,77 kB | **0** |
| `npm run lint` | `165 problems (0 errors, 165 warnings)` | **0** |
| `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` | sólo abreviadas rotas informativas ya existentes (p. ej. `openspec/specs/transitions-st/spec.md`); ningún bloqueo | **0** |

Las 61 casillas de `openspec/changes/continuidad-indicadores/tasks.md` están marcadas y 0 quedan abiertas; las cuatro
tareas de persona (P-1 a P-4) están fuera del recuento y declaradas en E-181 (regla del ciclo 1).

## 2 · Matriz escenario → prueba

IT = `packages/shared/src/indicadores.test.ts`; CT = `packages/shared/src/indicadoresComparacion.test.ts`;
SV = `apps/desk/server/indicadores.test.ts`; RT = `apps/desk/server/routes/indicadores.test.ts`;
CS = `apps/desk/server/util/csv.test.ts`. Todas se ejecutan y pasan.

| Requisito · escenario | Prueba (fichero:línea) | Estado |
|---|---|---|
| KP-01 · nueve claves en orden, sin 48, 56 ni 16 | IT `:318` | cubierto |
| KP-02 · historial gana a la columna | IT `:25` | cubierto |
| KP-02 · sin historial, columna con su marca | IT `:27` | cubierto |
| KP-02 · último valor escrito | IT `:26` | cubierto |
| KP-02 · instante cercano a medianoche | IT `:30` | cubierto |
| KP-03 · naturales con signo (`-2`) | IT `:45` (59 = -1) y RT `:74` | cubierto con otro número (SUGGESTION 1) |
| KP-04 · entrada y salida (17) | IT `:57` | cubierto |
| KP-04 · falta la salida | IT `:60` | cubierto |
| KP-05 · hábiles con festivo (5) | IT `:229` | cubierto |
| KP-05 · marca leída en Bogotá | IT `:230` | cubierto |
| KP-05 · heredado sin marca | IT `:236` | cubierto |
| KP-06 · rango con dos festivos (6) | IT `:186` | cubierto |
| KP-06 · cierre de empresa (5) | IT `:187` | cubierto |
| KP-06 · repuestos mandan (5) | IT `:191` | cubierto |
| KP-06 · resultado negativo (0) | IT `:196-200` | cubierto |
| KP-06 · sin finalización (0, `sinFinalizar`) | IT `:207-213` | cubierto |
| KP-07 · igual cumple / por encima no cumple | IT `:277`, `:278` | cubierto |
| KP-07 · sin finalización / sin tiempo promesa | IT `:285`, `:289` | cubierto |
| KP-08 · 57 en orden (3), 58 (4), 59 (-1) | IT `:39`, `:45` | cubierto; 57 y 58 negativos sin caso propio (SUGGESTION 1) |
| KP-08 · falta la cotización | IT `:65` | cubierto |
| KP-09 · 51 sin entrada / con entrada (3) | IT `:103`, `:106-110` | cubierto |
| KP-09 · 55 sin entrada / valor de Zoho sin calcular | IT `:115`, `:118` | cubierto |
| KP-10 · dos escrituras / una / sin historial | IT `:84`, `:90`, `:95` | cubierto |
| KP-11 · 50·53 con festivos (6 y 8) | IT `:186` | cubierto |
| KP-11 · 49 de Zoho desde la creación (5 y 7) | IT `:229` | cubierto |
| KP-11 · 54 sin promesa y 54 que difiere | IT `:289`, `:277` | cubierto |
| KP-11 · 47 de Zoho sin dato | IT `:308-313` | cubierto |
| KP-12 · 401, 403, 200 | RT `:24`, `:30`, `:48` | cubierto (posición, con dos guardas a la vez) |
| KP-13 · forma del indicador / periodo inválido | RT `:74`, `:37`; SV `:25` | cubierto |
| KP-14 · tres consultas con 2 y con 20 tickets | SV `:53` | cubierto |
| KP-15 · BOM y CRLF | CS `:29`, `:30`, `:33`; RT `:89` | cubierto |
| KP-15 · negativo / inyección / cuatro caracteres / separador y comillas | CS `:21`, `:19`, `:14`, `:20`, `:12`, `:9`; RT `:111` | cubierto |
| KP-16 · cuatro pares, tolerancia, sin dato, textos, causa, letra contra Zoho | CT `:17`, `:25`, `:49`, `:60`, `:95`, `:81` | cubierto |
| KP-17 · sin valores de Zoho / con valores (66,7) | RT `:143`, `:151`, `:157` | cubierto |
| KP-18 · sin elementos de tablero | CT `:136`; RT `:176` | cubierto |
| **KP-18 · una petición no deja rastro (todas las sentencias de lectura)** | SV `:53` sólo sobre las tres consultas del módulo; RT `:176` cuenta tres consultas de datos pero **no mira el verbo** | **sin prueba por ejecución en la ruta** (WARNING 2) |

## 3 · Contraste con la letra, indicador por indicador

La letra manda (`respuesta_textual` de `decision/e009-kpis`, `decision/e009b-lista-indicadores` y
`decision/encuesta-entre-corte-e-independencia`; maestro `R08.4.md:6285-6364` y `:2951-2961`).

| Col. | Letra | Lo que hace el código (`packages/shared/src/indicadores.ts`) | Veredicto |
|---|---|---|---|
| 47 | «Entre remisión de entrada y remisión de salida» (`R08.4.md:6287`) | naturales con signo entre las dos remisiones; falta un hito: sin dato y dice cuál | Conforme (unidad natural: supuesto S-7) |
| 49 | `Fecha Revisión Informe − Fecha creación ticket`, «sobre las marcas de las transiciones» (`R08.4.md:6293`, `:2951`) | Hábiles entre la marca `ingreso_a_servicio` y la revisión; sin marca: **sin dato**, aunque haya `fecha_creacion_ticket` (IT `:236`); la creación sólo alimenta la variante de Zoho | Conforme a la letra; elegir `ingreso_a_servicio` como «transición correspondiente» y la unidad hábil son SP-3 y S-2, no letra (SUGGESTION 2) |
| 50·53 | Hábiles desde la OV, o desde repuestos si los hubo, hasta la finalización; 0 si negativo o sin finalización (`R08.4.md:6296`) | `servicio()`: repuestos antes que OV, `diasHabilesEntre` con cierres, tope 0, sin finalización 0 con `sin_finalizar`; con finalización y sin inicio: sin dato | Conforme; usa el calendario laboral y ninguna otra aritmética hábil |
| 51 | «Hora de actualización del estado − Fecha Finalización ST» (`R08.4.md:6299`); «si falta algún hito… se dice antes de construir y se decide aparte» | sin dato salvo que llegue `horaActualizacionEstado`; la ruta **nunca** la aporta (`tablaIndicadores` sólo pasa `cierres`) | Conforme; sin supuesto (mutación 2) |
| 54 | `Cumple / No cumple` del 53 contra el 52 (`R08.4.md:6302`, `:6341`) | 53 ≤ 52 `Cumple`; un 52 de 0 es valor; sin promesa: sin dato (no `Cumple`) | Conforme: es el 53 contra el 52 |
| 55 | Calificación; la encuesta es manual y se carga en enero (`openspec/config.yaml:2858`) | sin dato salvo entrada opcional; el valor de Zoho va a `valorZoho`, nunca a `valor` | Conforme |
| 57 | «Entre Fecha Revisión Informe y Fecha de Cotización» (`R08.4.md:6308`) | cotización − revisión, naturales con signo | Conforme |
| 58 | «Entre Fecha Orden de Compra y Fecha de Cotización» (`R08.4.md:6311`) | OC − cotización; el signo es SP-10 (la letra no lo fija) | Conforme, con signo declarado como supuesto |
| 59 | «Lo que tarda en generarse la orden de venta» (`R08.4.md:6314`) | OV − cotización, naturales con signo; S-1 declarado, medido en 180 de 180 filas del export | Supuesto declarado (E-178), no letra |

Entrega «tabla exportable, sin tablero, semáforos ni umbrales» (`R08.4.md:2956`): `grep -rniE` de semáforo, umbral,
aprobado, suspenso, color y veredicto en los seis ficheros de producción nuevos sólo devuelve comentarios que lo
**niegan** y el tipo interno `Veredicto` (coincide / difiere / sin comparar). La respuesta no lleva bandera de
aprobado ni meta; trae `tolerancia: 1` (la letra) y una `nota` que dice que la aplicación no decide. CT `:136` y RT
`:176` lo fijan. La columna `comparable` significa «hay pares», no un juicio. **Conforme.**

### Cálculo a mano de seis casos (calendario 2026: 01/10 jueves; festivos 12/10, 02/11, 16/11, 08/12, 25/12 y 01/01/2027)

| Caso | Mi cuenta | Esperado de la prueba | ¿Correcto? |
|---|---|---|---|
| Festivo: 50·53, OV 08/10, fin 15/10 | (08, 15]: 9, 12, 13, 14, 15 = 5 días L-V; menos el festivo 12 = **4**; Zoho 5 | IT `:182-195`: 4 y 5, descontado `2026-10-12` | Sí |
| Fin de año: OV 24/12, fin 05/01 | L-V: 25, 28, 29, 30, 31, 1, 4, 5 = 8; menos festivos 25/12 y 01/01 = **6**; con cierre 31/12: 5 | IT `:186-187`: 6 y 8; 5 | Sí |
| Reentrante: repuestos 05/10 y 13/10, fin 15/10 | último 13/10: (13, 15] = 14 y 15 = **2** | IT `:202-206`: 2, reentrante, 2 escrituras | Sí |
| Medianoche de Bogotá: marca `2026-10-06T02:30Z` | 21:30 del 05/10; (05, 13/10]: 6, 7, 8, 9, 12, 13, menos el 12 = **5**; variante desde 28/09: 29, 30, 1, 2, 5-9, 12, 13 = **11** | IT `:228`: 5 y 11 | Sí |
| 49 de la spec: marca `2026-12-03T03:00Z` (día 02/12), revisión 10/12 | 3, 4, 7, 8, 9, 10 = 6; menos el 08 = **5**; variante desde 01/12 = 7 | IT `:230`: 5 y 7 | Sí |
| 54: 53 = 4 contra 52 = 4, variante 5 | 4 ≤ 4 `Cumple`; 5 > 4 `No cumple` | IT `:275`: `Cumple` / `No cumple` | Sí |

También recalculé el 47 (16/12 a 02/01 = 15 + 2 = **17**), el 51 (05/01 a 08/01 = **3**, y `2027-01-09T03:00Z` es el 08
en Bogotá) y K3 (30/10 a 17/11: 12 días L-V menos el 02/11 y el 16/11 = 10): todos coinciden con la prueba. Ningún
esperado equivocado.

## 4 · Sólo lectura (evidencia)

- `git diff --stat f55b7d9 HEAD` sobre `packages/shared/src/calendarioLaboral.ts`, `apps/desk/src/api/client.ts`,
  `packages/zoho-sync`, `packages/shared/src/analisis.ts` y `apps/hub-sync`: **vacío**. Ni `schema.sql` ni
  `.env.example` aparecen entre los ficheros tocados.
- Ficheros no documentales tocados: 17, todos nuevos salvo `DEPLOY.md` (+47 al final), `apps/desk/server/app.ts` (un
  `import` y un registro, en la misma línea), `apps/desk/src/components/Analisis.tsx` (+4),
  `packages/shared/src/index.ts` (+2) y `apps/desk/server/reconciliacion/registro.test.ts` (una prueba).
- `grep` sobre lo añadido en `apps/` y `packages/` (sin pruebas) de `insert`, `update`, `delete`, `create table`,
  `alter table`, `process.env`, `fetch(`, `zohoFetch`, `readFile`, `writeFile` y `fs.`: **0 resultados** (salida 1).
- La ruta recibe sólo `{ db }` (`registerIndicadoresRoutes(app, { db })`): no tiene `zohoFetch` ni configuración.
- Prueba por ejecución de que las tres consultas del módulo son `SELECT`: `apps/desk/server/indicadores.test.ts:53` en `42a4828`.
  **Lo que no se prueba:** que la ruta no ejecute otra sentencia (mutación 6, abajo).

## 5 · Mutaciones reproducidas (aplicadas, ejecutadas y revertidas; árbol limpio tras cada una)

| # | Mutación | Resultado |
|---|---|---|
| 1a | Administrador comprobado **después** de consultar | ROJO: 4 pruebas (PG-2 con y sin parámetros; las guardas de CSV) |
| 1b | Administrador **después** de validar y antes de consultar | ROJO: 2 pruebas (PG-2 con `?desde=basura` y PG-2 en CSV): mide la posición, no sólo la condición |
| 2 | El 51 devuelve `0` sin la entrada opcional | ROJO: `K13 sin entrada opcional el 51 es sin dato` |
| 3 | La variante de Zoho descuenta festivos | ROJO: 20 pruebas (K2, K3, fin de año, 50·53, 49, 54) |
| 4 | Un par sin valor de Zoho cuenta como coincidencia | ROJO: 7 pruebas (C1, C3, C6c, C12 y otras) |
| 5 | `porcentaje` devuelve `0` con cero pares | ROJO: 8 pruebas (C4, C5, C6c, C6d y otras) |
| 6 | **Se añade `UPDATE tickets SET subject = subject` en la ruta** | **VERDE: 36 de 36**. Sobrevive (WARNING 2) |

Probé además `desde`, `hasta` y `formato` hostiles contra la ruta real con administrador (prueba temporal, borrada):
una inyección con comilla y `OR 1=1`, una fecha seguida de salto de línea, un `formato` con CRLF inyectado,
`9999-99-99` y `%00` dan `400` con `{ error }`; el mismo día en `desde` y `hasta` da `200`; `desde[]=` no llega como
arreglo (el analizador simple de Express lo deja como clave literal y se ignora: 200 sin filtro, inocuo). Un
`codigo_servicio` con salto de línea, `=`, comillas, `;` y retorno de carro sale como una sola celda entrecomillada, con
`text/csv; charset=utf-8`, `attachment; filename="indicadores-2026-10-03.csv"` y `X-Content-Type-Options: nosniff`; el
BOM son los bytes `EF BB BF` en `apps/desk/server/util/csv.ts`.

## 6 · Seguridad y robustez

- **Orden:** `requireAuth(db), requireAdmin, asyncHandler(...)` en `apps/desk/server/routes/indicadores.ts:41`; validar
  (`:42-43`) y consultar después. Probado por PG-1, PG-2, PG-3 y las mutaciones 1a y 1b.
- **Parámetros ligados:** `$1` y `$2` en `leerEntradasIndicadores`; lo único que se interpola es el nombre de columna,
  tomado de un registro constante (`COLUMNA_DE_HITO`), nunca de la petición.
- **Periodo en Bogotá:** se ensancha un día por lado y el corte exacto se hace con `diaEnZona`; comprobé a mano que el
  23:59 de Bogotá del último día (04:59Z del día siguiente) cae dentro de `hasta + 2` a las 00:00Z.
- **CSV:** apóstrofo a texto que empieza por `=`, `+`, `-`, `@`, tabulador o CR (más amplio que la spec, correcto);
  número sin apóstrofo; comillas y `;`; CRLF en cada fila; BOM.
- **Fuga de datos:** el JSON sólo lleva `ticketId`, `codigoServicio`, los nueve valores, hitos, `valorZoho` y las
  diferencias; `custom_fields` se lee entero pero no se serializa. Es contenido que un administrador ya ve.
- **Tamaño:** sin periodo se leen todos los tickets, todas sus transiciones y su `custom_fields`, sin tope (WARNING 4).

## 7 · Regla 13

La tabla del lote 5b de `openspec/changes/continuidad-indicadores/apply-progress.md` coincide con el código:
`mostrarDescargaIndicadores` es `user?.isAdmin === true` en `apps/desk/src/lib/indicadoresUrl.ts:16-17`, usada en
`apps/desk/src/components/Analisis.tsx:83`; la imposición está en `apps/desk/server/routes/indicadores.ts:41` y
`apps/desk/server/auth/middleware.ts:27`, y la prueban PG-1, PG-2 y las mutaciones 1a y 1b. El cliente no calcula, no
filtra ni da formato: sólo muestra el enlace y compone la dirección con `URLSearchParams`. El espejo es legítimo
(punto 3). Las pruebas `.tsx` siguen excluidas por decisión de Gerencia; no se registra como carencia.

## 8 · Barrido de citas y documentos nuevos

Leí 14 citas que solapan líneas editadas y **todas siguen ciertas**:

1. `docs/sdd/F0-00_Baseline_as-built.md:137` cita `Analisis.tsx:70 en d25ecda`: en esa revisión es `export function Analisis`.
2. `docs/sdd/ENTRADA.md:1284` cita `Analisis.tsx:95 en e27f9da`: es la tarjeta «Cumplimiento promesa».
3. `docs/sdd/Paquete_de_Despliegue_2026-09-29.md:459` cita `apps/desk/server/app.ts:61`: sigue siendo el bloque de registros.
4. `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:744`: ídem, sin desplazamiento (`app.ts` conserva 96 líneas).
5. `openspec/changes/archive/2026-10-01-tres-transiciones-cifra-anclada/apply-progress.md:45`: el localizador de la lista de «en curso» sigue acertando.
6. `openspec/changes/archive/2026-10-02-alta-manual-equipo-cliente/apply-progress.md:13`: `registro.test.ts:220` es histórico (caso B), cierto de su fecha.
7. `openspec/changes/archive/2026-10-02-alta-manual-equipo-cliente/archive-report.md:128`: ídem.
8. `openspec/config.yaml:2527`, `:2555`, `:2655` y `:2858`: son las `respuesta_textual` que la spec cita.
9. `packages/shared/src/calendarioLaboral.ts:196-204`: es `diasHabilesEntre`.
10. `packages/shared/src/bodegaje.ts:225-226`: es `marcaIngresoAServicio`.
11. `packages/shared/src/reentrancia.ts:78-83`: es `INDICADORES_G6`.
12. `apps/desk/server/auth/middleware.ts:26-29`: es `requireAdmin`.
13. `packages/zoho-sync/src/db/schema.sql:57-61` y `:32-37`: `ticket_transitions` y las columnas `fecha_*`.
14. `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:6560`: «F1F-05, sin empezar», como dice la corrección 23.

`CLAUDE.md` no cambia en este cambio y ninguna de sus citas solapa líneas editadas.

**Cifras de E-171 a E-182 y de la corrección 23**, contra la tabla 1.3 de `apply-progress.md`: 201 de 202 (47), 158 de
161 y 54 de 161 (49), 147 de 149 (50·53), 478 de 478 (sin finalización), 162 de 162 (51), 365 de 365 y 268 de 268 (54),
161 de 161 (57), 180 de 180 (58 y 59), 0 de 57 y 1 de 33 con festivo: **todas coinciden**. Las líneas del maestro
(`R08.4.md:6287`, `:6293`, `:6296`, `:6299`, `:6314`, `:6317`) y `packages/shared/src/transitions.ts:203` son ciertas.
Plan: `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:129` es la fila F1F-05, talla S–M, «antes del 14/12», y
`cierra: no` es coherente (el 51 y el 55 quedan sin dato). Fechas de `DEPLOY.md` §9: el 13/11/2026 es viernes y el
16/11 más 28 días es el 14/12.

**Consulta P-1** (`DEPLOY.md`, sección 9): sólo `SELECT` dentro de `BEGIN TRANSACTION READ ONLY` y `ROLLBACK`; usa
`jsonb_object_keys` en el `FROM` (función lateral implícita, válido en PostgreSQL) y `count(*) FILTER`; la columna `raw`
existe en `desk.tickets` (`packages/zoho-sync/src/db/schema.sql:5`). Sintaxis razonable y de sólo lectura; el propio
texto dice que no se probó contra producción. **No medido:** que `custom_fields` contenga los nombres de Zoho; es
justo lo que P-1 averigua, y el documento lo dice.

## 9 · Cabecera R-1, archive y `registro.test.ts`

- Cabecera de `proposal.md`: siete campos presentes y válidos (`tanda: F1F-05`, `capacidad: [kpis]`, `cierra: no`,
  `toca_maestro: si`). `cierra: no` es coherente con la fila del plan: faltan el 51 y el 55.
- `kpis` ya está en `capabilities` (`openspec/config.yaml:240`): R-2 se cumple sin tocar nada más al archivar.
- La spec `specs/kpis/spec.md` mide **523 líneas** y es nueva: cuenta entera como inserción. Los cinco `archive-report.md`
  de precedente miden entre 110 y 264. Parte revisable estimada: 523 + 110 a 264 = **633 a 787**, por debajo de 800
  pero con **13 líneas de margen en el peor caso**. Se mide antes de aplicar (regla del archivo).
- Andamiaje: la cabecera (`:1-35`) y el bloque `## ADDED Requirements` repiten el molde de la spec viva
  `openspec/specs/calendario-laboral/spec.md` (misma tabla inicial, mismo §0, mismo `ADDED`): aceptable por precedente.
  No hay notas de proceso ni referencias a lotes. Sí hay referencias que quedan huérfanas (WARNING 1).
- `apps/desk/server/reconciliacion/registro.test.ts`: la lista de «en curso» (`:218-220`) pasa de siete a ocho con
  `F1F-05`. Al archivar con `cierra: no` **NO se revierte**: `apps/desk/server/reconciliacion/comprobaciones.ts`
  (`enCurso`) sólo saca de esa lista las tandas archivadas **con `cierra: si`**, y `F1B-03` (archivada con
  `cierra: no`) sigue en ella. Quitar `F1F-05` al archivar pondría la prueba en rojo.

## 10 · Hallazgos

**CRITICAL:** ninguno.

### WARNING
1. **Texto de la spec que quedaría desfasado en la viva.** `openspec/changes/continuidad-indicadores/specs/kpis/spec.md:15-17`
   dice «sujeto a las preguntas E-171 a E-178», pero llegan a **E-180** (E-179 es el «95 %», SP-6; E-180 es
   `Fecha Orden de Venta Final`). Además `:15` y `:35` remiten a `proposal.md` (S-n, P-1), que tras archivar vive en la
   carpeta de archivo. Corregir el rango y nombrar la ruta archivada **antes** de la fusión (2 líneas).
2. **KP-18 «una petición no deja rastro» sin prueba por ejecución en la ruta.** La mutación 6 deja 36 de 36 en verde
   porque `apps/desk/server/routes/indicadores.test.ts:176` filtra con `/ticket_transitions|calendario_cierres|FROM tickets/`
   y no mira el verbo: el guardián no discrimina (regla de mutación 2). Arreglo: en el espía de `conEspia`, comprobar
   que toda sentencia posterior a la sesión empieza por `SELECT`.
3. **Margen del archive de 13 líneas en el peor caso.** Mantener el `archive-report.md` bajo ~270 líneas y medir
   `git diff --shortstat --no-renames` de spec más informe antes de aplicar; si pasa de 800, parar y consultar.
4. **Sin tope ni medición del tamaño sin periodo.** `leerEntradasIndicadores` carga todos los tickets, todas las
   transiciones y el `custom_fields` completo, y el enlace del cliente (`urlIndicadores('csv')`) no pasa periodo. Con
   640 tickets es pequeño, pero no está medido ni declarado. Anotarlo en `DEPLOY.md` o dar un periodo por defecto.
5. **Un ticket sin `created_time` desaparece incluso sin periodo.** `apps/desk/server/indicadores.ts` descarta cuando
   `diaEnZona(creadoEn) === null` aunque no haya `desde` ni `hasta`; RQ-KP-13 promete «todos» sin periodo. El alta de
   la aplicación fija `created_time`, así que hoy sería raro; es una omisión silenciosa y sin prueba.

### SUGGESTION
1. KP-03 y KP-08 prometen un `-2` (57) y un `-1` (58) que ninguna prueba fija con ese número; el signo lo cubren K8b
   (`packages/shared/src/indicadores.test.ts:45`) y los tres positivos de K8, que cazarían un intercambio de argumentos.
2. SP-3 (`ingreso_a_servicio` como la «transición correspondiente» del 49) no tiene pregunta propia: E-177 sólo pregunta
   la unidad. Está respaldado por el plan y por F1A-04, pero es una elección de fondo; añadirla a E-177.
3. La cita de la spec y de E-171 a `packages/shared/src/transitions.ts:252-255` es un comentario sobre cómo Zoho
   aproximaba la columna 51, no una prueba de que la aplicación no guarda la hora (cierto por ausencia). Cambiarla por
   un `grep` fechado.
4. Desviación de proceso del lote 5a, declarada y corregida (`indicadoresComparacion.ts` escrito antes de su prueba; se
   apartó y se vio el rojo antes de restaurar). Sin efecto en el resultado.

## 11 · Para el archive

1. Corregir el WARNING 1 antes de fusionar; la spec nueva se copia a `openspec/specs/kpis/spec.md`.
2. Medir la parte revisable antes de aplicar y comprobar que el commit contenga sólo este cambio (`git show --numstat`).
3. Segundo barrido de citas tras la fusión (la spec viva cita `openspec/config.yaml:2527`, `:2655`, `:2858`, `:2555` y
   `:240`; las propias citan `Analisis.tsx:81-88` y `app.ts:22`/`:61`).
4. `registro.test.ts` se queda con ocho «en curso». Las preguntas E-171 a E-180 y P-1 a P-4 (E-181) **no se dan por
   hechas al archivar**; son de Gerencia y de quien despliega, con la fecha límite del 13/11/2026.
