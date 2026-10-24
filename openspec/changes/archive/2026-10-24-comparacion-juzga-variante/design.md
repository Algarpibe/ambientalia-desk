# Diseño: la comparación juzga el 95 % con la variante de Zoho

Tanda F1F-05 (`cierra: no`). Entradas: `proposal.md` (S-1 a S-7, diez mutaciones) y `specs/kpis/spec.md` (MODIFIED
RQ-KP-16; ADDED RQ-KP-40 a -42). Decisión: `decision/f1f05-variante-juzga-el-95`. Todas las líneas citadas se leyeron en el
árbol del worktree sobre `e1a92b59`; las que el apply va a mover llevan el ancla «en `e1a92b59`».

## Enfoque técnico

Tres piezas, en el orden de la regla invariable 13: (1) `compararIndicadores` (shared) calcula la lectura por ticket de las
DOS lecturas con el mismo código y la devuelve en `ticketsVariante`; (2) la vista del cliente (`lib/*.ts`) arma una lista
ORDENADA de dos tablas, variante primero; el `.tsx` sólo la recorre; (3) una prueba nueva de aceptación lleva septiembre por
el `POST`. Las dos rutas no cambian de código: ya llaman a `compararIndicadores`
(`apps/desk/server/routes/indicadores.ts:53`, `apps/desk/server/routes/indicadoresComparacion.ts:47`).

**Regla de colocación (mutación 4).** En `packages/shared/src/indicadoresComparacion.ts`, `apps/desk/src/lib/comparacionExportacion.ts`
y los cuatro ficheros de prueba existentes, todo cambio va EN SU MISMA LÍNEA o AL FINAL del fichero: ninguna línea existente se
desplaza. Sólo el `.tsx` cambia de longitud.

## Flujo de datos

    pares (parDeIndicador) ──► compararIndicadores
                                 bucle :99 ─ letra ──► porTicket.valor ─────────┐
                                           └ variante ► porTicket.formula_zoho ─┤ lecturaPorTicket (nueva, al final)
                                 ResumenComparacion { …, tickets, ticketsVariante, nota }
    GET /api/indicadores (JSON) ─┘   POST /api/indicadores/comparacion ─► vistaComparacion
                                                                           tablas[0] = variante (k.variante, ticketsVariante, MENSAJE_SIN_PARES)
                                                                           tablas[1] = letra    (k,          tickets,         «—»)
                                                                         ─► ComparacionExportacion.tsx: v.tablas.map(...)

## Decisiones

### D1 · `ticketsVariante` en la misma línea 45 y tipo con nombre al final del fichero

`packages/shared/src/indicadoresComparacion.ts:45` pasa a ser `tickets: LecturaTickets; ticketsVariante: LecturaTickets`, y
`export interface LecturaTickets { comparados: number; coincidentes: number; porcentaje: number | null }` va AL FINAL del fichero
(los tipos se resuelven antes de su declaración). En el cuerpo, la clave sale detrás de `tickets` y antes de `nota`: la línea
`:126` pasa a `tickets, ticketsVariante,` y `:127` (`nota`) no se toca. Orden resultante de `comparacion`: `comparable`, `mensaje`,
`tolerancia`, `porColumna`, `tickets`, `ticketsVariante`, `nota`.

| Opción | Decisión |
|---|---|
| Misma línea + tipo al final | **Elegida**: la línea 9 sigue siendo `MENSAJE_SIN_PARES` (la cita `openspec/config.yaml:5290`, que la rama no puede tocar) y la 90 la firma de `compararIndicadores` (la cita `openspec/specs/kpis/spec.md:1160`). Ninguna cita viva se reapunta |
| Tipo `LecturaTickets` declarado antes de la línea 40 | Rechazada: empuja la 90 y obliga a reapuntar la cita de la spec viva y la de `openspec/config.yaml`, que está fuera del alcance de la rama |
| `ticketsVariante` dentro de `tickets` (`tickets.variante`) | Rechazada: cambia la forma de `tickets`, que el proposal promete intacta (S-1) |

### D2 · Una sola lógica por ticket, indexada por lectura

`:92` pasa a `const porTicket = { valor: new Map<string, PorTicket>(), formula_zoho: new Map<string, PorTicket>() }`
(`type PorTicket = { comparados: number; todoCoincide: boolean }`, al final). El bloque `:106-111` conserva sus seis líneas y
pierde la condición de lectura: `if (e.r !== 'sin') {`, y lee/escribe en `porTicket[contra]`. `contra` ya es el discriminante del
bucle de `:99` (`'valor' | 'formula_zoho'`, el mismo tipo de `Diferencia['contra']`, `:28`). El cierre de `:119-120` pasa a
`const tickets = lecturaPorTicket(porTicket.valor)` y `const ticketsVariante = lecturaPorTicket(porTicket.formula_zoho)`; la
función `lecturaPorTicket` va al final y reutiliza `porcentaje` (`:57`). Mismo criterio que hoy para las dos: comparado con al
menos un par comparable, coincidente si `todoCoincide`.

| Opción | Decisión |
|---|---|
| Un `Map` por lectura y un único cuerpo de acumulación | **Elegida**: la mutación 7 («alguno» en vez de «todos») rompe las dos lecturas a la vez y la cazan C9 (`packages/shared/src/indicadoresComparacion.test.ts:101-109`) y el escenario nuevo |
| Segundo bucle sólo para la variante | Rechazada: duplica el criterio; dos implementaciones de la misma noción es el molde de H5 |

### D3 · Textos de la nota y de la cabecera

- `:10`: `NOTA_PORCENTAJES = 'El 95 % se juzga con la variante de la fórmula de Zoho, por indicador y por ticket. La letra de la
  aplicación es informativa: sus diferencias se explican por definición. La aplicación no decide si se aprueba.'` Sin clave de
  decisión en el texto visible; conserva «no decide si se aprueba», que exige `packages/shared/src/indicadoresComparacion.test.ts:141`.
- `:2`: `// La aplicación NO decide si se aprueba: no hay umbral, semáforo ni veredicto. El 95 % se juzga con la variante de Zoho y la
  letra es informativa (decision/f1f05-variante-juzga-el-95).` La clave va en el comentario.
- Ningún texto contiene `aprob`, `umbral`, `semáforo` ni `veredicto` (lo vigila `apps/desk/server/routes/indicadoresComparacion.test.ts:115-116`).

### D4 · `VistaComparacion.tablas`: lista ordenada que sustituye a `columnas` y `tickets`

`VistaComparacion` pierde `columnas` y `tickets` (`apps/desk/src/lib/comparacionExportacion.ts:39-40`) y gana, en esas dos líneas,
un comentario y `tablas: TablaVista[]`. `TablaVista = { titulo: string; columnas: FilaColumnaVista[]; tickets: { comparados; coincidentes; porcentaje } }`
(strings), declarado al final. El orden es el del array: `tablas[0]` = variante, `tablas[1]` = letra; se prueba con
`v.tablas.map((t) => t.titulo)`. Constantes exportadas al final: `ROTULO_VARIANTE = 'Variante de la fórmula de Zoho · cuenta para el 95 %'`
y `ROTULO_LETRA = 'Letra de la aplicación · informativa'` (S-3).

- `:4` añade `MENSAJE_SIN_PARES` y `type Conteo` a la importación de `@ambientalia/shared` (exportados por `packages/shared/src/index.ts:31`).
- `:48` pasa a `pct(p, vacio = SIN_DATO)`; `:47` actualiza su comentario en sitio.
- `:68-72` (cinco líneas) pasan a: comentario, `tablas: [`, `tablaVista(ROTULO_VARIANTE, porColumna, (k) => k.variante, ticketsVariante, MENSAJE_SIN_PARES),`,
  `tablaVista(ROTULO_LETRA, porColumna, (k) => k, tickets, SIN_DATO),`, `],`. La función `tablaVista` va al final y sólo convierte
  a texto: no suma, no resta, no divide.
- **S-2:** en la variante, `porcentaje` `null` (indicador o tickets) es `MENSAJE_SIN_PARES` importado; en la letra, «—».
- **S-7:** la fila de tickets NO lleva `diferentes` ni `sinComparar`: el servidor no los da (`:45` de shared). Se prueba con
  `Object.keys(t.tickets)` igual a `['comparados', 'coincidentes', 'porcentaje']`; el `.tsx` pinta celdas vacías.
- **Pruebas existentes:** se reescriben EN SU LÍNEA para leer la letra: `:90-91`, `:95`, `:98` y `:103` de
  `apps/desk/src/lib/comparacionExportacion.test.ts` pasan de `v.columnas`/`v.tickets` a `v.tablas[1].columnas`/`v.tablas[1].tickets`.
  La de `:93-98` sigue siendo «letra `null` → «—»». La `:64` gana `ticketsVariante: { comparados: 5, coincidentes: 5, porcentaje: 100 }`
  en la misma línea (sin ella el fixture tipado no compila). `:130-135` (palabras prohibidas) sigue verde: ni los rótulos ni la frase
  contienen `meta`, `cumple`, `tone`…

| Opción | Decisión |
|---|---|
| `tablas` ordenada; quitar `columnas`/`tickets` | **Elegida**: un solo camino que pintar; el único consumidor es el `.tsx` (`apps/desk/src/components/ComparacionExportacion.tsx:25`) |
| Conservar `columnas`/`tickets` (letra) y añadir `variante` | Rechazada: el orden no sería comprobable (dos claves de objeto) y el `.tsx` podría seguir pintando la letra sola |
| Rótulos en shared | Rechazada: son copia de interfaz que el servidor no emite; la regla ya la dice la `nota` (`:10`), que el cliente repite tal cual |

### D5 · Cambio mínimo del `.tsx`

La tabla única de `apps/desk/src/components/ComparacionExportacion.tsx:51-59` en `e1a92b59` pasa a `v.tablas.map((t) => …)`: por
cada tabla, un rótulo de texto (`t.titulo`, `text-slate-600`, sin color de estado) y la misma `<table>` con `t.columnas` y la fila
«Tickets» de `t.tickets` con dos `<td />` vacíos, como la de `:57` en `e1a92b59`. Cabecera de columnas, mensaje (`:50`) y nota (`:68`)
sin cambio. Sin prueba de `.tsx` (F0-00): todo lo decidible está en D4.

### D6 · Aceptación RQ-KP-42 en un fichero NUEVO

`apps/desk/server/routes/indicadoresComparacionSeptiembre.test.ts`. Fichero nuevo para no desplazar las citas de
`apps/desk/server/routes/indicadoresSeptiembre.test.ts` ni de `apps/desk/server/routes/indicadoresComparacion.test.ts`.

**Hallazgo que corrige el brief: el «ID» no puede ser el id sintético.** El lector rechaza todo «ID» que no sea sólo dígitos
(`apps/desk/server/comparacion/leerExportacion.ts:43`, `:72`), y el fixture siembra `sep-01`… (`apps/desk/server/testing/septiembre2026.ts:60`).
Con `sep-01` en el CSV, las trece filas irían a `rechazadas` y no cruzaría ninguna. Solución: `sembrarSeptiembre` gana un segundo
parámetro opcional `idDe: (t: TicketSeptiembre) => string = (t) => t.id`, EN SU LÍNEA (`:55`), y `:60` usa `idDe(t)` en vez de
`t.id`. La prueba nueva siembra con `(t) => \`9${String(t.numero).padStart(17, '0')}\`` (dieciocho dígitos, como Zoho) y usa ese
mismo valor en el «ID» del CSV; «ID de la solicitud» es `String(t.numero)`. `indicadoresSeptiembre.test.ts` sigue llamando sin
segundo argumento.

| Opción | Decisión |
|---|---|
| Parámetro opcional del sembrador | **Elegida**: dos líneas en sitio; el fixture sigue siendo uno |
| `UPDATE tickets SET id` tras sembrar | Rechazada: cambiar la clave primaria en pg-mem es terreno sin probar en este repositorio (hipótesis) |
| Copiar el `INSERT` en la prueba | Rechazada: segunda implementación del sembrado |

**El CSV en memoria.** Cabecera = `[COLUMNA_ID, COLUMNA_NUMERO, ...COLUMNAS_INDICADOR.map((c) => c.nombre)]`, importadas de
`apps/desk/server/comparacion/leerExportacion.ts:5-19`: las doce, sin escribirlas a mano. Celda de cada indicador = `gerencia[columna]` o `''` si es `null`; las
dos de 50·53 leen la misma celda; la 55 vacía. Números con `String(n)`: los negativos (`-118`) los acepta `valorDeZoho`
(`packages/shared/src/indicadores.ts:117`); el 54 va como texto (`Cumple`/`No cumple`). Ninguna celda lleva coma ni comillas, así
que basta `join(',')` con `\r\n`; UTF-8 sin BOM lo decodifica `decodificarFichero` (`apps/desk/server/encuesta/analizarRespuestas.ts:27-29`).
Se descarta `csvMuestra`: rellena las celdas de indicador por omisión (`apps/desk/server/testing/exportacionZoho.ts:29-31`, la 55 con
`Excelente`) y habría que vaciarlas una a una. Nada se escribe a disco.

**Por qué 13/13 es alcanzable (comprobado en el código, no ejecutado).** (a) El cruce es por «ID» texto
(`apps/desk/server/comparacion/cruzarExportacion.ts:20-29`) y el POST lee la misma población por cierre que el GET
(`apps/desk/server/routes/indicadoresComparacion.ts:33`); RQ-KP-38 ya fija trece en el GET
(`apps/desk/server/routes/indicadoresSeptiembre.test.ts:30-34`). (b) La `formulaZoho` no depende de `camposZoho`:
`packages/shared/src/indicadores.ts:223` calcula la variante de los hitos y sólo `valorZoho` lee la bolsa; la variante del POST es la
del GET. (c) RQ-KP-38 (`apps/desk/server/routes/indicadoresSeptiembre.test.ts:42-53`) exige variante dentro de ±1 en números e
igualdad en el 54 en las celdas con valor, y la comparación usa tolerancia 1 (`packages/shared/src/indicadoresComparacion.ts:7`) e
igualdad sin mayúsculas (`packages/shared/src/indicadoresComparacion.ts:75`). (d) Cuento a mano las celdas con valor:
47 → 11, 49 → 9, 50·53 → 11, 51 → 12, 54/57/58/59 → 9; las vacías dan «sin valor de Zoho» y van a `sinComparar`. (e) Cada uno de los
trece tiene al menos una celda con valor (`sep-11` sólo el 51, `sep-13` sólo el 50·53), así que los trece son comparados.
**Supuesto:** que RQ-KP-38 esté verde en `e1a92b59` (lo dice el `verify-report.md` archivado de `poblacion-cierre-variante-47-51`; no
lo ejecuté).

**Pruebas del fichero:** (1) cruce limpio: 13 cruzados, 0 rechazadas, 0 ilegibles, 0 sólo en Desk, 0 número distinto; (2)
`ticketsVariante` `{ comparados: 13, coincidentes: 13, porcentaje: 100 }`; (3) por indicador, `variante` `{ comparados: N,
coincidentes: N, porcentaje: 100 }` con las cifras de (d); la 55 con `comparados` 0 y `porcentaje` `null`; la letra no se exige;
(4) **la mutación escrita**: `it.each` sobre los ocho indicadores, alterando la celda del primer ticket con valor (+5 en números;
`Cumple` ↔ `No cumple` en el 54) → `ticketsVariante` `{ 13, 12, 92.3 }` y la variante de ese indicador por debajo de 100; (5) orden
de las claves de `comparacion` en el GET y en el POST (D1); (6) el propio fichero no importa escritura de disco (molde de lectura de
fuente: `apps/desk/server/routes/indicadoresComparacion.test.ts:141-145`).

### D7 · Caracterizaciones sha256 y C13

`apps/desk/server/routes/indicadores.test.ts:263` y `apps/desk/server/routes/indicadoresComparacion.test.ts:326` cambian de valor
EN SU LÍNEA, con un comentario al final de la misma línea: `// recalculado por decision/f1f05-variante-juzga-el-95 (ticketsVariante y nota)`.
El hash se toma del cuerpo real tras el apply, con todo lo demás verde; el commit nombra la decisión (molde RQ-KP-39).
`apps/desk/server/routes/indicadores.test.ts:271` (CSV) NO cambia: si cambiara, el apply metió la comparación en el CSV. C13:
`packages/shared/src/indicadoresComparacion.test.ts:136` reescribe su título en sitio y `:140` pasa a
`expect(r.nota).not.toContain('no precisa')`; `:141` se queda. Las afirmaciones nuevas de la nota van en el bloque nuevo.

### D8 · Regla invariable 13 y regla de mutación 3 (decisiones del cliente)

| Decisión del cliente | Quién la impone | Caso |
|---|---|---|
| Números de la tabla de la variante | `packages/shared/src/indicadoresComparacion.ts:116` (`variante` por columna) y `:120` (`ticketsVariante`, tras D2) | Consume |
| Números de la tabla de la letra | mismo fichero, líneas 116 y 119 | Consume |
| `null` en vez de `0`/`100` | `porcentaje`, mismo fichero, línea 57 | Consume |
| Frase «sin pares comparables» | `MENSAJE_SIN_PARES`, mismo fichero, línea 9, importada | Consume; prueba de fuente contra una copia literal |
| Variante primero y rótulos | La regla la dice la nota (mismo fichero, línea 10); el orden es presentación | Sin guarda: no bloquea ni escribe nada; probado en `lib` |
| «Difieren»/«Sin comparar» vacíos por ticket | `LecturaTickets` no los trae (mismo fichero, línea 45) | El cliente no resta |
| Sin semáforo ni veredicto | El resumen no los trae (C13, `packages/shared/src/indicadoresComparacion.test.ts:139`) | Consume |

### D9 · Mutaciones y prueba que debe ponerse roja

| # | Mutación | Fichero mutado | Rojo esperado |
|---|---|---|---|
| 1 | `ticketsVariante = lecturaPorTicket(porTicket.valor)` | shared `:120` | shared «la variante y la letra difieren por ticket»; aceptación (2) |
| 2 | La tabla de la variante lee `k` | lib `tablaVista(ROTULO_VARIANTE…)` | lib «la tabla de la variante lee la variante» |
| 3 | Letra primero / rótulos intercambiados | lib `:68-72` | lib «la variante va primero con su rótulo» (rótulos literales en la prueba) |
| 4 | Nota antigua | shared `:10` | C13 (`:140`) y «la nota dice quién juzga» |
| 5 | Celda alterada fuera de ±1 | CSV de la prueba y `gerencia` de `septiembre2026.ts` (regla 2: se ensucia lo vigilado) | aceptación (2) y (3) |
| 6 | `tickets` ↔ `ticketsVariante` | shared `:126` | shared «`tickets` sigue siendo la letra»; lib «los tickets salen de su clave» |
| 7 | Coincide si coincide ALGUNO | shared `:109` | shared «un ticket coincide sólo si coinciden todos»; C9 |
| 8 | Letra con la frase / variante con «—» | lib `tablaVista(…)` | lib «la letra sigue pintando «—»», «la 55 de la variante dice…» |
| 9 | Frase redefinida en el cliente | lib | lib: el esperado sale de la constante de shared; y una prueba de fuente de `lib/comparacionExportacion.ts` sin el literal |
| 10 | Comparación en el CSV del GET | `apps/desk/server/routes/indicadores.ts:45-50` | `apps/desk/server/routes/indicadores.test.ts:271` |

Mutación 1 de la regla (posición) no aplica: no se añade ninguna guarda.

### D10 · Barrido de la regla de mutación 4

Con D1-D6, NO se desplaza ninguna línea de shared, del `lib`, de `septiembre2026.ts` ni de los cuatro ficheros de prueba; sólo
`ComparacionExportacion.tsx` crece (≈ +5 desde `:51`). Barrido hecho en `e1a92b59` (Grep de los seis patrones del encargo, con
`openspec/changes/archive/`, `docs/`, `DEPLOY.md` y `openspec/config.yaml`):

- **Vivas fuera del cambio, sin reparar:** `openspec/config.yaml:5290` (cita la línea 9 de shared) y
  `openspec/specs/kpis/spec.md:1160` (la 90) no se mueven. `openspec/config.yaml:5283`, `openspec/specs/kpis/spec.md:1445`, la línea
  1525 de esa spec y las cuatro de `DEPLOY.md` (731, 735, 744, 745) citan la RUTA `apps/desk/server/routes/indicadoresComparacion.ts`,
  que no se toca. `openspec/specs/kpis/spec.md:1440` cita la línea 13 del `lib`, intacta. `openspec/specs/kpis/spec.md:1636-1637`
  citan las tres caracterizaciones, que siguen en sus líneas.
- **Archivadas:** las de shared (líneas 7, 12, 40-47, 63 y 90) siguen siendo ciertas; las del `lib` (13, 51-83, 59 y 76) siguen en su
  línea porque el `lib` no se desplaza (51-83 crece por el final, caso B si alguien la lee como «hoy»); la del `.tsx` (línea 9) no se
  mueve; las de los dos ficheros de prueba de rutas caen en líneas que no se mueven.
- **De este cambio, caso B al cerrar:** el `proposal.md` describe el código de hoy en sus líneas 24, 25, 27, 28, 29, 90 y 107 (shared
  106, 126, 10 y 2; `lib` 68-72 y 48; `.tsx` 50-59 y 57): tras el apply se anclan «en `e1a92b59`», sin renumerar. Las de la spec
  delta del cambio (líneas 74, 78, 143, 144 y 195) siguen siendo ciertas (caso A). Este `design.md` ya ancla las que el apply mueve.

### D11 · Estimación del apply y partición

Primera estimación (inserciones + borrados) × 1,8:

| Fichero | Estimación | × 1,8 |
|---|---|---|
| `packages/shared/src/indicadoresComparacion.ts` | 28 | 50 |
| `packages/shared/src/indicadoresComparacion.test.ts` | 49 | 88 |
| `apps/desk/server/testing/septiembre2026.ts` | 4 | 7 |
| `apps/desk/server/routes/indicadoresComparacionSeptiembre.test.ts` (nuevo) | 90 | 162 |
| Dos sha256 + `:64` del test del `lib` (tipado) | 6 | 11 |
| `apps/desk/src/lib/comparacionExportacion.ts` | 40 | 72 |
| `apps/desk/src/lib/comparacionExportacion.test.ts` | 66 | 119 |
| `apps/desk/src/components/ComparacionExportacion.tsx` | 28 | 50 |
| Anclas caso B en `proposal.md` | 16 | 29 |
| `apply-progress.md` (el informe cuenta) | 90 | 162 |
| **Total** | **417** | **≈ 750** |

Pasa de 720: **se parte en dos lotes**. **L1** · shared + sembrador + aceptación + dos sha256 + `:64` del test del `lib`
(sin ella no compila) + su informe: ≈ 420. **L2** · `lib` + sus pruebas + `.tsx` + anclas del proposal + su informe: ≈ 330. L1 deja
el cliente compilando y pintando la letra como hoy; L2 lo cambia.

## Matriz de amenazas

N/A: no hay enrutado nuevo, shell, subprocesos, automatización de VCS/PR, clasificación de ejecutables ni integración de procesos.

## Migración / despliegue

Sin migración ni datos. Tras el despliegue, Gerencia repite septiembre con periodo (tarea de persona del proposal).

## Riesgos y preguntas abiertas

- **SP-6 quedaba desfasada** (`openspec/specs/kpis/spec.md:32` en `e1a92b59`: «la letra no precisa cuál es el 95 %»). Resuelto por el orquestador
  en el delta: MODIFIED de la fila SP-6, una línea a igual longitud (molde de la SP-5 de `poblacion-cierre-variante-47-51`).
- Los dos hashes nuevos sólo se conocen ejecutando; el apply los toma con el resto en verde.
- Si RQ-KP-38 no estuviera verde en `e1a92b59`, la aceptación (2) y (3) no lo estaría: se comprueba antes de escribir la prueba nueva.
