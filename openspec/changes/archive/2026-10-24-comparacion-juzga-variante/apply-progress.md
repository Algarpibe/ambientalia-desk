# Apply-progress — `comparacion-juzga-variante` (F1F-05, `cierra: no`)

## Lote L1 · shared + sembrador + aceptación + sha256 (intento 3 del registro) — base `5a454f76`

Modo: strict TDD. Todo en el worktree de la rama `comparacion-juzga-variante`. Los ficheros de código van en CRLF en el árbol de trabajo (el índice los guarda en LF); los artefactos de `openspec/changes`, en LF.

### L1.1 · Línea base (antes de escribir nada)

`npx vitest run` de `routes/indicadoresSeptiembre.test.ts` y `shared/indicadoresComparacion.test.ts` sobre `5a454f76`: 2 ficheros, 33 pruebas en verde (RQ-KP-38 incluida). El supuesto de D6 se cumple.

### Rojos vistos (antes del verde)

| Tarea | Prueba | Salida | Causa |
|---|---|---|---|
| L1.2 | `shared/indicadoresComparacion.test.ts`, bloque nuevo al final (8 pruebas) | 6 caen: «la variante y la letra difieren por ticket», «un ticket coincide sólo si coinciden todos…», «un par sin variante comparable…», «sin tickets comparados en la variante…» (`expected undefined to deeply equal …`), «la clave ticketsVariante va entre tickets y nota» (`expected [ 'comparable', 'mensaje', …(4) ] to deeply equal [ … (5) ]`) y «la nota dice quién juzga» (`expected 'La letra de Gerencia no precisa cuál …' to contain 'se juzga con la variante…'`) | `ticketsVariante` no existe y la nota es la vieja. Verdes de salida y a propósito: «`tickets` sigue siendo la letra» (caracteriza lo que no debe cambiar; su discriminante es M6) y «la nota no decide» |
| L1.3 | C13 en su línea (título en `:136`, `not.toContain('no precisa')` en `:140`) | `expected 'La letra de Gerencia no precisa cuál …' not to contain 'no precisa'` | La nota de la línea 10 todavía dice «no precisa» |
| L1.4 | `routes/indicadoresComparacionSeptiembre.test.ts` (nuevo, 22 pruebas) | Primera pasada, con `sembrarSeptiembre` sin `idDe`: cae casi todo, p. ej. `expected { cruzados: +0, …(5) } to match object { cruzados: 13, …(5) }` y `expected { comparados: +0, …(5) } to match object { comparados: 11, …(2) }`. Tras L1.5 (sembrador) quedan 10 rojas: `expected undefined to deeply equal { comparados: 13, …(2) }` (la de `ticketsVariante` y las ocho alteradas) y el orden de claves | Dos causas, vistas por separado: los IDs `sep-NN` van a `rechazadas` del lector (sólo dígitos) y `ticketsVariante` no existe |

### Verdes

- L1.5: `apps/desk/server/testing/septiembre2026.ts`, `idDe` opcional en su línea (`:55`) e `idDe(t)` en `:60`. `indicadoresSeptiembre.test.ts` no cambia: 11 de 11.
- L1.6: `packages/shared/src/indicadoresComparacion.ts` según D1-D3, en sitio: `:2`, `:10`, `:45`, `:92`, `:106-107`, `:110`, `:119-120`, `:126`; `LecturaTickets`, `PorTicket` y `lecturaPorTicket` al final (nueve líneas nuevas tras la última de la base). `:9` sigue siendo `MENSAJE_SIN_PARES` y `:90` la firma de `compararIndicadores`.
- L1.7: `apps/desk/src/lib/comparacionExportacion.test.ts:64` gana `ticketsVariante` en la misma línea. `typecheck` salida 0.
- **Aceptación 13/13 sin ajustar nada:** tras D2, `ticketsVariante` da `{13,13,100}`, la variante por indicador da 47→11, 49→9, 50·53→11, 51→12, 54/57/58/59→9 al 100 % y la 55 `comparados` 0 con `porcentaje` `null`. Las expectativas no se tocaron.
- Hallazgo de la prueba nueva: dos llamadas a `adminCookie()` en una prueba chocan con `users_pkey` (una sesión de administrador por prueba, como en `indicadoresComparacion.test.ts`); se memoiza por base, con el mismo molde.

### L1.8 · Las dos sha256 (decisión `decision/f1f05-variante-juzga-el-95`)

Corridas con todo lo demás en verde, cayeron exactamente dos pruebas (las de cuerpo JSON) y la del CSV siguió verde. Cada hash se cambió en su línea con el comentario `// recalculado por decision/f1f05-variante-juzga-el-95 (ticketsVariante y nota)`.

| Línea | Prueba | Antes | Después |
|---|---|---|---|
| `routes/indicadores.test.ts:263` | GET json sin parámetros | `0975f415…3992cf` | `95cb5026…14a984` |
| `routes/indicadoresComparacion.test.ts:326` | POST sin flujo | `862d1958…0623a7` | `265b7cbf…9273c` |
| `routes/indicadores.test.ts:271` (CSV) | GET csv | `c83ef69a…ba88be2` | **sin cambio** |

### Mutaciones (sha256 del fichero antes y después de revertir: iguales; `git diff` del fichero, vacío)

| # | Fichero | Qué se cambió | Pruebas que cayeron | sha256 antes → después |
|---|---|---|---|---|
| M1 (L1.9) | `shared/indicadoresComparacion.ts` | `ticketsVariante = lecturaPorTicket(porTicket.valor)` (`:120`) | 12: «la variante y la letra difieren por ticket», «un par sin variante comparable…», «sin tickets comparados en la variante…», «ticketsVariante da 13 comparados, 13 coincidentes y 100 %» y las ocho «un valor alterado en el X» | `eb79e6ff…c6425` → igual |
| M4 (L1.10) | ídem | nota antigua en `:10` | 4: C13 (`:140`), «la nota dice quién juzga» y las dos sha256 de cuerpo JSON | ídem |
| M6 (L1.12) | ídem | `tickets: ticketsVariante, ticketsVariante: tickets` (`:126`) | 14: «`tickets` sigue siendo la letra», «la variante y la letra difieren por ticket», C9, «un par sin variante…», «sin tickets comparados…», «ticketsVariante da 13…» y las ocho alteradas | ídem |
| M7 (L1.13) | ídem | «coincide si coincide ALGUNO»: `todoCoincide` nace `false` (`:107`) y `:109` pasa a `coincide → true` (dos líneas: con una sola no hay «alguno») | 11: «un ticket coincide sólo si coinciden todos…», C9, las ocho alteradas y la sha256 del POST | ídem |
| M5 (L1.11) a | `testing/septiembre2026.ts` | `sep-01` `gerencia['47']` 144 → 146 (regla de mutación 2: se ensucia lo vigilado) | 3: «ticketsVariante da 13 comparados…», «indicador 47: la variante da 11…» y, de RQ-KP-38, «indicador 47: formulaZoho coincide con la celda de Gerencia…» | `6d3c8c94…adc4` → igual |
| M5 (L1.11) b | `routes/indicadoresComparacionSeptiembre.test.ts` | la celda del 47 del ticket 932 pasa a 999 en el CSV en memoria | 2: «ticketsVariante da 13 comparados…» y «indicador 47: la variante da 11…» | `d0034646…1291` → igual |
| M10 (L1.14) | `routes/indicadores.ts` | `res.send(aCsv(…) + JSON.stringify(compararIndicadores([])))` en el CSV del GET | 5, entre ellas «GET csv sin parámetros: el cuerpo es idéntico byte a byte…» (la sha256 de `:271`) | `79ac6c57…fbfb1` → igual |

M2, M3, M8 y M9 son del lote L2 (cliente). La mutación 1 de la regla (posición) no aplica: no se añade ninguna guarda.

### Colocación (L1.15, mutación 4) — `git diff -U0 5a454f76`

| Fichero | Hunks | Líneas base → hoy |
|---|---|---|
| `shared/src/indicadoresComparacion.ts` | `-2`, `-10`, `-45`, `-92`, `-106,2`, `-110`, `-119,2`, `-126` (mismo número de líneas nuevas) y `+130,9` tras la última | 129 → 138 |
| `server/testing/septiembre2026.ts` | `-55`, `-60` | 63 → 63 |
| `shared/src/indicadoresComparacion.test.ts` | `-136`, `-140` y `+161,55` tras la última | 160 → 215 |
| `routes/indicadoresComparacion.test.ts` | `-326` | 523 → 523 |
| `routes/indicadores.test.ts` | `-263` | 377 → 377 |
| `src/lib/comparacionExportacion.test.ts` | `-64` | 220 → 220 |

Ninguna línea existente se desplazó. `:9` es `MENSAJE_SIN_PARES` y `:90` la firma de `compararIndicadores`.

### Hallazgos y supuestos

- Supuesto reversible: el «ID» de la prueba nueva es `9` más el número con relleno a 17 cifras (18 dígitos, como Zoho); «ID de la solicitud» es el número.
- Supuesto reversible: la prueba «no escribe a disco» no puede buscar `node:fs` a secas (importa `readFileSync` para leerse a sí misma); exige que su única importación de `fs` sea `readFileSync` y que no aparezcan las funciones de escritura, con las expresiones escritas de forma que no casen consigo mismas.
- No se tocó producción más allá de D1-D3 ni `openspec/config.yaml`, `ENTRADA.md`, `_to_delete/`, n8n, `.env.example` ni CSV alguno. Ningún `it` se borró ni se saltó.

### Cierre de lote (L1.c)

Cadena X.c sobre el commit de código del lote, sin `npm test` (lo corre el orquestador). `npm run typecheck`: salida 0. `npm run lint`: salida 0, 0 errores y **165 avisos** (sin cambio). Detector de citas (`cli.ts --sha HEAD`) y vitest dirigido a los seis ficheros del lote: ver el informe del lote. Medida (base `5a454f76`, `git diff --shortstat --no-renames` más lo nuevo sin trackear, que es 0 tras el commit): cifra exacta en el informe del lote; estimación ~420, techo 800, válvula 720.

## Lote L2 · cliente: lib, `.tsx`, anclas (intento 4 del registro) — base `9924cf70`

Modo: strict TDD. Mismos finales de línea que L1 (código en CRLF en el árbol, LF en el índice; artefactos en LF). Los cambios se hicieron con un editor de cadenas que conserva CRLF: `git diff --stat` sólo trae las líneas tocadas.

### L2.1 · Línea base

Suite del lote L1 en verde (el orquestador corrió `npm test`: 317 ficheros, 5512 pruebas, salida 0). Base de L2 = `9924cf70`.

### L2.2 · ROJO visto antes del verde (`apps/desk/src/lib/comparacionExportacion.test.ts`)

`npx vitest run` del fichero: **9 pruebas caen de 48**. Tres son las existentes reescritas EN SU LÍNEA para leer la letra (`:90-91`, `:95`, `:98` y `:103` pasan a `v.tablas[1].…`; el `:2` gana `MENSAJE_SIN_PARES` en su misma línea) y seis las nuevas del bloque final: «la variante va primero con su rótulo», «la tabla de la variante lee la variante», «los tickets salen de su clave…», «la 55 de la variante dice `MENSAJE_SIN_PARES`…», «la letra sigue pintando «—»…» y «la fila de tickets no trae «Difieren» ni «Sin comparar»…». Salida común: `TypeError: Cannot read properties of undefined (reading '0')` o `(0 , vistaComparacion).tablas is not iterable`. Causa: `tablas` no existe. Verdes de salida y a propósito: la prueba de fuente (el `lib` aún no contiene la frase; su discriminante es M9) y «no muta la respuesta con las dos tablas».

### Verdes

- L2.3 `comparacionExportacion.ts`: `:4` (importa `MENSAJE_SIN_PARES` y `type Conteo`), `:39-40` (comentario y `tablas: TablaVista[]`), `:47-48` (`pct(p, vacio = SIN_DATO)`), `:68-72` (comentario, `tablas: [`, `tablaVista(ROTULO_VARIANTE, …, (k) => k.variante, …ticketsVariante, MENSAJE_SIN_PARES)`, `tablaVista(ROTULO_LETRA, …, (k) => k, …tickets, SIN_DATO)`, `],`); `TablaVista`, `ROTULO_VARIANTE`, `ROTULO_LETRA` y `tablaVista` al final (`:84-100`). 48 de 48 en verde; `typecheck` salida 0.
- L2.4 `ComparacionExportacion.tsx`: `:51-59` pasan a `v.tablas.map((t) => …)` con rótulo `text-slate-600`, la misma `<table>` con su cabecera y la fila «Tickets» con dos `<td />` vacíos. Mensaje (`:50`) y nota (ahora `:73`) sin cambio. `git diff --stat` del `.tsx`: **14 inserciones, 9 borrados**. Sin prueba por F0-00.

### Mutaciones de L2 (sha256 del `lib` antes y después de revertir con `git checkout`: `67223cc4129b…` los dos; `git diff` del fichero, vacío, en todas)

| # | Qué se cambió | Pruebas que cayeron |
|---|---|---|
| M2 (L2.5) | la tabla de la variante lee `k` en vez de `k.variante` | 1: «la tabla de la variante lee la variante» |
| M3 (L2.6) a | letra primero (las dos filas del array intercambiadas de sitio) | 8: las tres existentes que leen `tablas[1]` («una fila por columna…», «porcentaje null…», «no recalcula el porcentaje…») y las cinco nuevas «la variante va primero con su rótulo», «la tabla de la variante lee la variante», «los tickets salen de su clave», «la 55 de la variante…», «la letra sigue pintando «—»» |
| M3 (L2.6) b | rótulos intercambiados (cada tabla conserva su lectura) | 1: «la variante va primero con su rótulo» (los rótulos son literales de la prueba, no importados) |
| M8 (L2.7) a | letra con la frase y variante con «—» | 3: «porcentaje null: «—», nunca 0 ni 100», «la 55 de la variante dice `MENSAJE_SIN_PARES`…», «la letra sigue pintando «—»…» |
| M8 (L2.7) b | sólo la variante con «—» | 2: «la 55 de la variante dice…», «la letra sigue pintando «—»…» |
| M9 (L2.8) | frase redefinida en el cliente (el literal escrito en el `lib`, sin importar la constante) | 1: la prueba de fuente «la frase… sólo viene de shared: el cliente no la escribe». **El esperado importado NO cae** (el literal vale lo mismo que la constante); sólo caería si shared cambiara la frase, así que el discriminante de M9 es la prueba de fuente |
| M6 lado cliente (L2.9) | `tickets` ↔ `ticketsVariante` al armar `tablas` | 4: «porcentaje null: «—»…», «los tickets salen de su clave», «la 55 de la variante…», «la letra sigue pintando «—»…» |

La prueba de palabras prohibidas (`color`, `meta`, `cumple`, `tone`…) siguió verde en todas: ni los rótulos ni la frase contienen ninguna.

### Colocación (obligación 1) — `git diff -U0 9924cf70` del cliente

| Fichero | Hunks | Líneas |
|---|---|---|
| `apps/desk/src/lib/comparacionExportacion.ts` | `-4`, `-39,2`, `-47,2`, `-68,5` (mismo número de líneas nuevas) y `+84,17` tras la última | 83 → 100 |
| `apps/desk/src/lib/comparacionExportacion.test.ts` | `-2`, `-90,2`, `-95`, `-98`, `-103` y `+221,49` tras la última | 220 → 269 |
| `apps/desk/src/components/ComparacionExportacion.tsx` | un hunk `-51,9 +51,14` | 73 → 78 |

Ninguna línea existente del `lib` ni de su prueba se desplazó. Sólo el `.tsx` cambia de longitud, como decía D4.

### L2.10 · Anclas del `proposal.md` (caso B, D10) — leídas una a una

| Línea | Qué afirma | Caso | Hecho |
|---|---|---|---|
| 24 | `shared:106` tiene `if (contra === 'valor' && …)` | B (hoy es `e.r !== 'sin'`) | «en `e1a92b59`» |
| 25 | `shared:126` cierra `tickets`; «la variante sólo existe por indicador» | B (hoy `tickets, ticketsVariante,`) | «en `e1a92b59`» |
| 27 | `shared:10` nota vieja; `:2` cabecera vieja | B | «en `e1a92b59`» tras `:10`; la abreviada `:2` hereda el ancla |
| 28 | `lib:68-72` una sola tabla | B | «en `e1a92b59`» |
| 29 | `.tsx:50-59` una sola tabla | B | «en `e1a92b59`» |
| 90 | `lib:48` pinta «—» en `comparados = 0` | B (hoy `pct` lleva `vacio`) | «en `e1a92b59`» |
| 107 | `.tsx:57` fila de tickets | B (hoy en `:60`) | «en `e1a92b59`» |
| 91 (fuera de la lista de D10) | `lib.test.ts:93-98` «intacta» | B (L2 reescribió `:95` y `:98` para leer `tablas[1]`) | «en `e1a92b59`, intacta entonces», con la reescritura dicha |

### L2.11 · Barrido de la regla de mutación 4 (todo el repositorio versionado del worktree, incluidos `openspec/changes/archive/`, `docs/`, `DEPLOY.md` y `openspec/config.yaml`)

Método: se listaron las líneas viejas tocadas en cada fichero editado entre `e1a92b59` y hoy (`shared`: 2, 10, 45, 92, 106-107, 110, 119-120, 126; test de shared: 136, 140; `routes/indicadoresComparacion.test.ts`: 326; `routes/indicadores.test.ts`: 263; `septiembre2026.ts`: 55, 60; `lib`: 4, 39-40, 47-48, 68-72; test del `lib`: 2, 64, 90-91, 95, 98, 103; `.tsx`: desde 51) y se buscaron las citas `fichero:NN(-MM)` de los ocho ficheros cuyo rango las toca. Salieron **53** citas; todas las demás caen en líneas que no se movieron ni se reescribieron.

| Grupo | Citas | Caso | Resolución |
|---|---|---|---|
| Artefactos de ESTE cambio (design, proposal, tasks, spec delta, apply-progress de L1) | 33 | A: son el plan y el registro de qué línea se reescribe, y esa línea sigue siendo la que se dice | Sin cambio |
| `comparacion-exportacion-zoho` (archivado): `indicadoresComparacion.ts:40-47` ×3 | 3 | A: `:40-47` sigue siendo `ResumenComparacion` (la `:45` gana un campo en la misma línea) | Sin cambio |
| `filtro-indicadores-por-flujo` (archivado): `comparacionExportacion.ts:51-83`; `indicadores.test.ts:256-377`; `indicadoresComparacion.test.ts:312-491` | 3 | A: `vistaComparacion` sigue en `:51-83`; los bloques de prueba siguen en sus líneas (sólo se reescribió el hash de una línea interior) | Sin cambio |
| `poblacion-cierre-variante-47-51` (archivado): design:151, proposal:70, spec:323-324, tasks:55 | 8 | A: localizan dónde están las tres caracterizaciones y dicen que se actualizan | Sin cambio |
| ídem: apply-progress:94 y verify-report:76 (dos citas cada una) | 4 | B: nombran los hashes `0975f415…` y `862d1958…`, que dejaron de ser los de esas líneas | Anclados «en `e1a92b59`» (y una nota en apply-progress) |
| `openspec/specs/kpis/spec.md:1636-1637` | 2 | A: localizan las caracterizaciones, que siguen en `:263`, `:271` y `:326` | Sin cambio |
| `openspec/config.yaml`, `DEPLOY.md`, `docs/` | 0 | — | Ninguna cita toca una línea reescrita (la de `config.yaml:5290` apunta a `shared:9`, `MENSAJE_SIN_PARES`, intacta; la de `spec.md:1160`, a `shared:90`, intacta) |

**Pendientes de main: ninguno.** Pase de abreviadas `:NN` en las líneas físicas de esas 53 citas: las que hay (`:271`, `:58`, `:2`, `:136-141`, `:93-98`) o caen en líneas intactas o heredan el ancla puesta; el detector (`cli.ts --sha HEAD`) da 13 abreviadas rotas informativas y **ninguna** es de estos ficheros. Como siempre, el detector comprueba que la línea exista, no que diga lo que la frase afirma: la lectura de arriba es la comprobación de lo segundo.

### L2.12 · Regla invariable 13 — decisión a decisión del cliente (regla de mutación 3)

| Decisión que toma el cliente | Línea que la impone (shared / servidor) | Caso |
|---|---|---|
| Qué números pinta la tabla de la variante | `packages/shared/src/indicadoresComparacion.ts:116` (`variante` por columna) y `:120` (`ticketsVariante`) | Consume |
| Qué números pinta la tabla de la letra | mismo fichero, `:116` y `:119` | Consume |
| `null` y no 0/100 | `porcentaje`, mismo fichero, `:57` (`n === 0 ? null`) | Consume |
| La frase «sin pares comparables» de la variante | `MENSAJE_SIN_PARES`, mismo fichero, `:9`, importada; la prueba de fuente impide una copia literal | Consume |
| Variante primero y los dos rótulos | La regla del 95 % la dice la nota (`:10`); orden y rótulos son presentación | Sin guarda: no bloquea ni escribe nada; probado en `lib` |
| «Difieren» y «Sin comparar» vacíos en la fila de tickets | `LecturaTickets` no los trae (`:45`) | El cliente no resta |
| Sin semáforo, meta ni veredicto | El resumen no los trae (`:45-46`; vigilado por la prueba de palabras prohibidas y por C13) | Consume |

El `.tsx` no calcula: su `git diff --stat` es 14 inserciones y 9 borrados, todos de estructura (el `map` de `v.tablas`, el rótulo y los `t.*` en lugar de `v.*`); no aparece una suma, resta, división ni comparación.

### Cierre de lote (L2.c)

Cadena `set -o pipefail; npm run typecheck && npm run lint && tsx apps/desk/server/citas/cli.ts --sha HEAD`: typecheck salida 0; lint salida 0 (0 errores, 165 avisos, sin cambio); detector salida 0 (0 cabeceras inválidas). Vitest dirigido (el test del `lib`, el de shared, los dos de rutas de la comparación, `indicadores.test.ts`, la aceptación de septiembre y RQ-KP-38): 6 ficheros, todo verde, salida 0. `npm run build`: salida 0; `index-Hz9CFuzO.js` = **426.836 B** (producción hoy 426.563 B: +273 B). Medida y SHAs: ver el informe del lote.
