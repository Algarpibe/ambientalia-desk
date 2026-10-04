# Apply-progress — `remision-creada-sin-salida` (F1B-03, `cierra: no`)

Modo: Strict TDD. Commit de partida del intento: `6186c98`. Un solo lote. 35/35 casillas de las fases 0-5 marcadas `[x]` en `tasks.md`; la sección de personas (H-A, H-B, H-C) no es de este lote.

## 0 · Punto de partida

| Fichero | `wc -l` antes | después |
|---|---|---|
| `packages/shared/src/transitions.ts` | 397 | 397 |
| `apps/desk/src/lib/botonRemision.ts` | 43 | 43 |
| `apps/desk/src/components/TransitionPanel.tsx` | 267 | 267 |
| `packages/shared/src/transitions.test.ts` | 127 | 142 |
| `apps/desk/src/lib/botonRemision.test.ts` | 68 | 102 |

`npm test` de partida: 188 ficheros pasan + 1 omitido; 2.954 pruebas pasan y 2 omitidas.

## 1 · Rojos observados (antes de tocar código)

Comando: `npx vitest run packages/shared/src/transitions.test.ts apps/desk/src/lib/botonRemision.test.ts apps/desk/server/remisionCreadaSinSalida.test.ts`. 7 rojas, el resto verde.

| Prueba | Mensaje literal |
|---|---|
| P2 · `transitions > crear remisión se ofrece en los tres orígenes de habilitar servicio, en ningún estado posterior` | `expected false to be true // Object.is equality` (en `STATUS_REMISION_CREADA`) |
| P1 · `puedeCrearRemisionDeEntrada: atado a los orígenes de habilitar_servicio > Remisión creada: ofrece crear remisión` | `Remisión creada es origen de habilitar_servicio: expected false to be true // Object.is equality` |
| P3 · `…Remisión creada sin entrada vigente > con la lista vacía ofrece crear una` | `expected { visible: false, …(2) } to deeply equal { visible: true, …(2) }` |
| P3 · `… > con sólo una anulada ofrece crear una` | ídem |
| P3 · `… > con sólo una confirmada de salida ofrece crear una (no es de entrada)` | ídem |
| P3 · `… > con una pendiente se reetiqueta y lleva a la que hay` | ídem |
| P3 · `… > con sólo una fallida ofrece crear otra` | ídem |

Nacieron VERDES, como se declaró (caracterización): P4 (`con una confirmada de entrada no se ofrece (ok y ok_con_avisos)`), P5 (`mientras las remisiones no han cargado (null) no se ofrece`), P6 (`null en la fase inicial sigue ofreciendo crear`), P7 (`it.each` de los tres orígenes, 3 pruebas) y P8 (variante de salida, 1 prueba). Las otras 22 filas por estado de P1 también nacieron verdes (sólo `Remisión creada` es origen nuevo). La tarea 1.3 (`botonRemision.test.ts`, línea 19 original: deja de afirmar `Remisión creada`, afirma `Rev./Diagnostico`) es verde por construcción.

## 2 · Verde y rojo intermedio de P5

Tras editar sólo `transitions.ts` (predicado): `transitions.test.ts` verde; `botonRemision.test.ts`: 1 roja, la de P5, `botonRemision: Remisión creada sin entrada vigente > mientras las remisiones no han cargado (null) no se ofrece` → `expected true to be false // Object.is equality`. Es el rojo intermedio previsto. Tras editar `botonRemision.ts:31` (protección en la misma línea): 2 ficheros, 50 pruebas, todo verde. P5 volvió a verde.

Resultado de 2.5: `transitions.test.ts`, `botonRemision.test.ts`, `remisionCreadaSinSalida.test.ts` y `ticketService.test.ts`: 4 ficheros, 196 pruebas verdes. `cifrasAncladas`, `invariantesGrafo` y `mapaBlueprint`: 3 ficheros, 44 pruebas verdes, **sin haberlos editado** (criterio 8).

**Hipótesis del diseño §10 resuelta:** `habilitar_servicio` por HTTP no pidió nada más que orden de venta y serial sobre un ticket sembrado con `INSERT INTO tickets (id, number, status, managed_by_app, serial)`. No hubo que ajustar el sembrado. Los tres orígenes y la variante de salida pasaron a la primera.

## 3 · Mutaciones

Todas se aplicaron con un script que reemplaza el texto exacto y se revirtieron copiando la copia de seguridad del fichero (comparada con `cmp`). Pruebas que se corren: los tres ficheros del lote (más `cifrasAncladas`, `invariantesGrafo` y `mapaBlueprint` en M1 y M2).

| # | Mutación | Cayó | Mensaje literal (resumen por prueba) |
|---|---|---|---|
| M1a | quitar `\|\| status === STATUS_REMISION_CREADA` (`transitions.ts:164`) | 7: P2, P1 fila `Remisión creada`, y las 5 de P3 | P2 `expected false to be true`; P1 `Remisión creada es origen de habilitar_servicio: expected false to be true`; P3 `expected { visible: false, …(2) } to deeply equal { visible: true, …(2) }` ×5. P7/P8 siguen verdes |
| M1b | quitar `status === STATUS_OV_ASIGNADA \|\|` | 4 | P2 `expected false to be true`; P1 `OV asignada es origen de habilitar_servicio: expected false to be true`; `botonRemision > en la fase inicial y sin remisiones, ofrece crear una` `expected false to be true`; P6 `null en la fase inicial sigue ofreciendo crear` `expected { visible: false, …(2) } to deeply equal { visible: true, …(2) }` |
| M1c | quitar `status === STATUS_TICKET_CREADO \|\|` | 8 | P2; P1 `Ticket creado es origen de habilitar_servicio: expected false to be true`; las 5 de `botonRemision` que usan `Ticket creado` (inicial, pendiente ×2, anulada, error); P6 |
| M2 | `transitions.ts:178`: añadir `'Origen ficticio'` al `from` | 20, en 4 ficheros | **Diferencia con el diseño:** P1 por estado NO cae (recorre `ESTADOS`, y el ficticio no está). Cae la prueba añadida `cada origen de habilitar_servicio es un estado del registro` → `Origen ficticio no está en ESTADOS: expected [ 'En Espera de Repuestos', …(22) ] to include 'Origen ficticio'`. Caen además (hipótesis del diseño confirmada) `cifrasAncladas` (`pasos_del_mapa: … mapaBlueprint: el estado "Origen ficticio" no tiene fase asignada en FASE_POR_ESTADO …`), 13 de `mapaBlueprint`, y 2+2 de `invariantesGrafo` (`habilitar_servicio: from «Origen ficticio» no está declarado: expected false to be true`) |
| M3a | `botonRemision.ts:31`: quitar el segundo operando | 1: P5 | `expected true to be false // Object.is equality` |
| M3b | dejar `remisiones === null` sin condición de estado | 1: P6 | `expected { visible: false, …(2) } to deeply equal { visible: true, …(2) }` |
| M3c | `remisiones === null` → `!remisiones?.length` | 1: P3 fila lista vacía | `expected { visible: false, …(2) } to deeply equal { visible: true, …(2) }` |

**Incidente de método, sin consecuencia.** En el primer intento de M1a la sustitución no casó (error de script) y mi revertido con `git checkout` descartó por error la edición real de `transitions.ts`. Se volvió a aplicar el mismo script de la fase 2 (resultado idéntico: 397 líneas, 6 inserciones y 6 borrados) y desde entonces los revertidos se hicieron con copia de seguridad y `cmp`. Tras la última mutación: `cmp` de ambos ficheros contra la copia correcta da igual, `git diff --stat` coincide con el de 2.5 (5 ficheros, +71/-22) y los tres ficheros del lote están verdes (54 pruebas).

**Declaración de no mutación de posición (regla de mutación 1).** No existe un par de guardas que ordenar. `null` implica `vigentes = []` (`botonRemision.ts:33`), así que con `null` ni la rama de pendiente (`:34-35`) ni la de confirmada (`:39-40`) pueden dispararse; y con el predicado en `false` las dos mitades del `||` devuelven el mismo objeto. M3-pos (protección en un `if` propio tras `:40`, u operandos invertidos) es mutante equivalente, declarado. Lo observable es la condición, y la cubren M3a-c.

## 4 · Regla invariable 13 y regla de mutación 3 (líneas releídas hoy en el worktree)

| # | Decisión del cliente | Línea del servidor | Veredicto |
|---|---|---|---|
| 1 | Ofrecer «Crear remisión» en los tres orígenes (`transitions.ts:164`, `botonRemision.ts:31`) | `apps/desk/server/routes/remision.ts:120-264`; no lee `found.row.status`; `201` en `:263` | Fijado por P7 (3 orígenes) y P8 (salida), `remisionCreadaSinSalida.test.ts` |
| 2 | No ofrecerlo en los demás estados | **Ninguna.** El alta no filtra por estado | Hueco H-1 previo, no corregido (E-184) |
| 3 | No ofrecerlo en `Remisión creada` con `null` (`botonRemision.ts:31`) | Ninguna, y no la necesita | Presentación (carga) |
| 4 | No ofrecerlo con una confirmada de entrada (`botonRemision.ts:39-40`) | Ninguna | Ya era así |
| 5 | Reetiquetar con una pendiente (`botonRemision.ts:34-35`) | `remision.ts:174-183`, `409` en `:177` | Imposición vecina existente |
| 6 | Desactivar «Habilitar Servicio» sin entrada vigente | `ticketService.ts:131` (llamada), `:273-277` (`exigirRemisionVigente`, `422`) | Sin tocar; P7/P8 lo recorren (422 antes del alta, 200 después) |

## 5 · Cierre

| Comando | Código de salida | Resultado |
|---|---|---|
| `npm test` | `exit=0` | 189 ficheros pasan + 1 omitido (190); **2.990 pruebas pasan** y 2 omitidas (2.992). Antes: 188 + 1 / 2.954 + 2. Diferencia +1 fichero, +36 pruebas (24 en `transitions.test.ts`, 8 en `botonRemision.test.ts`, 4 en el fichero de servidor) |
| `npm run typecheck` | `exit=0` | limpio |
| `npm run lint` | `exit=0` | `165 problems (0 errors, 165 warnings)`: la cifra esperada |
| Detector de citas | **no corrido** | El commit aún no existe; lo corre el orquestador tras su commit (`node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`) |

`wc -l` al cierre: `transitions.ts` 397, `botonRemision.ts` 43, `TransitionPanel.tsx` 267, iguales a 0.1.

## 6 · Barrido de citas (regla de mutación 4)

Grep sobre todo el repositorio, sin excluir `openspec/changes/archive/`, de `transitions.ts:16x`/`:15x`/`:167-168` y `botonRemision.ts:2|3x|4x`. Líneas cambiadas: `transitions.ts:154-164` (comentario y `return`), `botonRemision.ts:2`, `:31`, `:37-38`, `TransitionPanel.tsx:18-20`. Sin desplazamiento en ningún fichero de código. No se editó ninguna spec viva, paquete fechado ni artefacto archivado. Columnas separadas para que no tengan forma de cita:

| Fichero | Línea | Cita (nombre y número del módulo) | Qué afirma | Clase |
|---|---|---|---|---|
| `docs/sdd/Paquete_de_Despliegue_2026-10-04.md` | 141 | `transitions.ts` 163-165 y `botonRemision.ts` 31 | Que un ticket en `Remisión creada` sin remisión de entrada vigente no tiene el botón | **C · superado** por este cambio. Registro fechado: no se edita |
| `openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/tasks.md` | 304 | `transitions.ts` 163-165 | Ocultar «Crear remisión» fuera de la fase inicial no tiene contrapartida en el servidor | A: sigue cierta (los estados posteriores a `Ingresado` siguen en `false`; el predicado vive en `:163-165`) |
| `openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/design.md` | 102 | `transitions.ts` 163-165 | `false` para el flujo de soporte remoto | A |
| `openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/design.md` | 216 | `transitions.ts` 163-165 | Igual que `tasks.md` 304 | A |
| `openspec/specs/remisiones/spec.md` | 185 | `botonRemision.ts` 34-35 y «razonado en» 22-25 | Reetiqueta con pendiente (`if (pendiente)`); comentario | A: líneas 34-35 y 22-25 intactas |
| `openspec/specs/remisiones/spec.md` | 791 | `botonRemision.ts` 33 | El `filter(esRemisionEntradaVigente)` | A |
| `openspec/specs/remisiones/spec.md` | 802 | `botonRemision.ts` 39 | `vigentes.some(esRemisionConfirmada)` | A |
| `docs/sdd/F0-00_Baseline_as-built.md` | 149 | `botonRemision.ts` 2 y 30-31 | Importa y consume `puedeCrearRemisionDeEntrada` de `@ambientalia/shared` | A: `:2` sigue importándolo y `:31` lo sigue llamando |
| `openspec/changes/archive/2026-10-03-tipo-servicio-ticket-sin-ov/` (`verify-report.md` 131-135, `tasks.md` 87, `specs/remisiones/spec.md` 16 y 27, `proposal.md` 72, 73, 79, 138, 139, `design.md` 13 y 15, `apply-progress.md` 98-103, 114, 116) | varias | `botonRemision.ts` 2, 33, 34, 39 | `filter` de vigentes, pendiente, confirmada, import | A: ninguna de esas líneas se movió |
| `openspec/changes/archive/2026-10-01-tres-transiciones-cifra-anclada/exploration.md` y `docs/sdd/F0-00_Baseline_as-built.md` | 19 y 87 | `transitions.ts` 167 y 168 | Comentario «Transiciones 2–32 del Blueprint» | A: línea intacta |
| Varios (`mapaBlueprint.ts` 11, `invariantesGrafo.test.ts` 111, specs `transitions-st` 108 y 1396, archivo `generador-mapa-blueprint`, maestro R08.2, correcciones F0-01) | varias | `transitions.ts` 150 | `TRANSICION_REMISION_CONFIRMADA` | A: líneas 150-151 sin tocar |

Segundo pase de abreviadas (`:154-165`, `:163-165`, `:31`) en los ficheros que ya citan los módulos: sin hallazgos nuevos; las coincidencias del patrón en `transitions-st/spec.md` (451, 454, 1032, 1200) y `remisiones/spec.md` (75) son de otros ficheros. **Observación para el orquestador (no citas):** en las specs vivas no hay ninguna frase con `puedeCrearRemisionDeEntrada` ni «fase inicial» que el cambio vuelva falsa; las especificaciones de delta de este cambio (`specs/transitions-st`, `specs/remisiones`) son las que dicen lo nuevo. Los comentarios que SÍ cambié (`transitions.ts` 154-161, `botonRemision.ts` 37-38, `TransitionPanel.tsx` 18-20) quedan ciertos.

## 7 · Preguntas para `docs/sdd/ENTRADA.md` (las numera y escribe el orquestador)

| # | Pregunta o hallazgo | Destino |
|---|---|---|
| a | **Pregunta a Gerencia (H-1):** ¿debe el servidor impedir crear una remisión de entrada fuera de la fase inicial? Hoy el alta (`remision.ts:120-264`) no lee el estado del ticket, y el botón es la única guarda. | Punto abierto con dueño Gerencia; cambio aparte si procede |
| b | **Pendiente de persona con acceso a producción (H-B):** ¿existe algún ticket en `Remisión creada` sin entrada vigente? No cambia el arreglo, sólo su urgencia. | Persona con acceso a producción |
| c | **Hallazgo de supervisión:** anular una remisión y sincronizar el estado del ticket no comparten transacción (`remision.ts:333`, `:336`); es lo que fabrica el caso. | Supervisión |
| d | **Hallazgo de supervisión:** con la remisión de salida, el origen 3 (`Remisión creada` sin entrada vigente) deja de ser hipotético: P8 lo prueba por HTTP. | Supervisión |

## 8 · Evidencia TDD y de unidad de trabajo

| Tarea | RED | GREEN | REFACTOR |
|---|---|---|---|
| 1.1-1.2 (P2, P1) | 2 rojas observadas (§1) | `transitions.ts:164` (§2) | comentario `:154-161` reescrito en 8 líneas |
| 1.3-1.7 (P3-P6) | 5 rojas P3; P4/P5/P6 verdes de nacimiento; P5 roja intermedia | `botonRemision.ts:31` | comentario `:37-38` en 2 líneas |
| 1.8-1.9 (P7, P8) | caracterización: nacen verdes (declarado) | n/a | n/a |
| 2.4 | `.tsx` sin prueba (F0-00): va a la sección de persona | comentario `TransitionPanel.tsx:18-20` en 3 líneas | n/a |

| Evidencia | Valor |
|---|---|
| Prueba focal | `npx vitest run packages/shared/src/transitions.test.ts apps/desk/src/lib/botonRemision.test.ts apps/desk/server/remisionCreadaSinSalida.test.ts`: 3 ficheros, 54 pruebas verdes |
| Arnés de ejecución | P7/P8 por HTTP con `instalarArnes`/`appWith`/`userCookie(['Comercial'])`: verdes. La parte `.tsx` va a H-A (persona) |
| Frontera de reversión | revertir el commit: `transitions.ts:164`, `botonRemision.ts:31` y los tres comentarios vuelven a su forma, las pruebas a su aserto anterior |

## 9 · Medida del intento (regla del ciclo 2, obligación de 2026-09-28)

- `git diff --shortstat --no-renames 6186c98`: 6 ficheros, 106 inserciones y 57 borrados = **163** (de ellas, 70 son las 35 casillas de `tasks.md`).
- `wc -l` de lo nuevo sin trackear: `remisionCreadaSinSalida.test.ts` 50 + este `apply-progress.md` 134 = **184**.
- **Suma: 347** líneas, contra ~340 estimadas y el tope de 800. Sin binarios.

## 10 · Desviaciones y riesgos

- M2 cae en una prueba distinta a la del diseño (la de «cada origen es un estado del registro», no la P1 por estado), porque P1 recorre `ESTADOS` y el estado ficticio no está en él. El efecto es el mismo: la mutación no pasa.
- Los ficheros editados conservan el fin de línea del árbol de trabajo (CRLF en los `.ts`/`.tsx`; `tasks.md` y este fichero en LF).
