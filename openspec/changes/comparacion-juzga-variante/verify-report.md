# Verify-report — `comparacion-juzga-variante` (F1F-05, `cierra: no`)

**Veredicto: PASS CON AVISOS.** CRITICAL 0 · WARNING 1 · SUGGESTION 3. Rama `comparacion-juzga-variante`, HEAD verificado `0c68801c`, base `e1a92b59`. Modo auto, store hybrid, `strict_tdd`. Tareas: L1 15 + cierre y L2 12 + cierre, **todas marcadas** (`tasks.md:16-47`); P-1 a P-3 son de persona, fuera del recuento (`tasks.md:49-57`, regla del ciclo 1).

## 1 · Ejecución (códigos exactos)

| Comando | Salida |
|---|---|
| `npm test` completo (lo corrió el orquestador, no yo) | 0 · 317 ficheros · 5520 pruebas · 11 omitidas (sobre `9924cf70`: 317 · 5512) |
| `vitest run` dirigido a 6 ficheros (shared `indicadoresComparacion`, `lib/comparacionExportacion`, `routes/indicadoresComparacionSeptiembre`, `routes/indicadoresComparacion`, `routes/indicadores`, `routes/indicadoresSeptiembre`) | 0 · 6 ficheros · 215 pruebas · 0 rojas |
| `npm run typecheck` | 0 |
| `npm run lint` | 0 · 0 errores · 165 avisos (sin cambio respecto del lote L1) |
| `tsx apps/desk/server/citas/cli.ts --sha HEAD` | 0 (sobre `0c68801c`; el posterior al commit de este informe va en el resultado de fase) |

## 2 · Matriz requisito → escenario → implementación → prueba

Implementación: `sh` = `packages/shared/src/indicadoresComparacion.ts`; `lib` = `apps/desk/src/lib/comparacionExportacion.ts`. Pruebas: `sh.t` = `packages/shared/src/indicadoresComparacion.test.ts`; `lib.t` = `apps/desk/src/lib/comparacionExportacion.test.ts`; `acc` = `apps/desk/server/routes/indicadoresComparacionSeptiembre.test.ts`.

**SP-6** (fila de una línea: delta `specs/kpis/spec.md:17`, vivo `openspec/specs/kpis/spec.md:32`): texto de la tabla, sin escenarios; la regla que enuncia la cubren RQ-KP-40/41. **COMPLIANT** (1 línea = 1 línea).

**RQ-KP-16 (MODIFIED)** — 6 escenarios, de título idéntico al vivo. Comportamiento sin cambio salvo la lectura por ticket (`sh:105-110`, `:119-120`).

| Escenario | Prueba | Estado |
|---|---|---|
| Cuatro pares del 50·53 | `sh.t:17` (C1) | COMPLIANT |
| La tolerancia es de un día | `sh.t:25` (C2) | COMPLIANT |
| Un «sin dato» no coincide con nada | `sh.t:49` (C4) | COMPLIANT |
| Textos del 54 | `sh.t:60` (C6) | COMPLIANT |
| La diferencia mayor lleva su causa | `sh.t:95` (C8) | COMPLIANT |
| Letra contra Zoho y fórmula contra Zoho | `sh.t:81` (C7) | COMPLIANT |

La viñeta nueva de tickets (dos lecturas, `sh:119-120`, `:126`) la cubre RQ-KP-40.

**RQ-KP-40** — `sh:45` (`tickets`, `ticketsVariante`), `sh:105-110` (mapa por lectura), `sh:10` (nota), `sh:130-138` (`LecturaTickets`, `lecturaPorTicket`).

| Escenario | Prueba | Estado |
|---|---|---|
| La variante y la letra difieren por ticket | `sh.t:171` | COMPLIANT |
| `tickets` sigue siendo la letra | `sh.t:177` (roja bajo M6) | COMPLIANT |
| Coincide sólo si coinciden todos | `sh.t:181`; C9 `sh.t:101` | COMPLIANT |
| Sin tickets comparados en la variante | `sh.t:189`, `:195` | COMPLIANT |
| La nota dice quién juzga | `sh.t:204`; C13 `sh.t:136` | COMPLIANT |
| Sin bandera de aprobado | `sh.t:212`; C13 | COMPLIANT |
| El cuerpo del GET y del POST cambia sólo en dos claves | sha256 `apps/desk/server/routes/indicadores.test.ts:263` y `apps/desk/server/routes/indicadoresComparacion.test.ts:326` (comentario con la decisión); orden de claves `acc:89`; `sh.t:200` | COMPLIANT |
| El CSV del GET no cambia (mutación) | `indicadores.test.ts:271`, hash sin hunk en el diff; M10 | COMPLIANT |

**RQ-KP-41** — `lib:68-72` (`tablas`), `lib:84-100` (`TablaVista`, rótulos, `tablaVista`), `lib:4` (importa `MENSAJE_SIN_PARES`), `apps/desk/src/components/ComparacionExportacion.tsx:51-64`.

| Escenario | Prueba | Estado |
|---|---|---|
| La variante va primero con su rótulo | `lib.t:224` | COMPLIANT |
| La letra no lleva el rótulo de la variante (mutación) | `lib.t:224` (M3 a y b rojas) | COMPLIANT |
| La tabla de la variante lee la variante (mutación) | `lib.t:227` (M2) | COMPLIANT |
| Los tickets de cada tabla salen de su clave | `lib.t:233` | COMPLIANT |
| Difieren y Sin comparar vacíos | `lib.t:256` (`Object.keys` = 3 claves) | COMPLIANT |
| La 55 de la variante dice «sin pares comparables» | `lib.t:238` | COMPLIANT |
| La letra sigue pintando «—» (mutación) | `lib.t:247` (M8) | COMPLIANT |
| La frase se importa, no se reescribe (mutación) | `lib.t:259` (prueba de fuente; M9) | COMPLIANT, ver SUGGESTION 2 |
| Sin color, meta, semáforo ni veredicto | `lib.t:130` (palabras prohibidas, sigue verde) | COMPLIANT |

**RQ-KP-42** — `apps/desk/server/testing/septiembre2026.ts:55,60` (`idDe`); prueba nueva `acc`.

| Escenario | Prueba | Estado |
|---|---|---|
| 13/13 por ticket con la variante | `acc:64` | COMPLIANT |
| 100 % por indicador (47→11, 49→9, 50·53→11, 51→12, 54/57/58/59→9) | `acc:69` (`it.each` ESPERADOS) | COMPLIANT |
| La 55 sin pares comparables | `acc:74` | COMPLIANT |
| Un valor alterado rompe el 100 % (ocho indicadores) | `acc:80` (`it.each`, 13/12/92,3) | COMPLIANT |
| El CSV no se escribe ni se copia | `acc:103`; ningún `.csv` en `git diff --name-only e1a92b59 HEAD` | COMPLIANT |

Recuento: 6 + 8 + 9 + 5 = **28 escenarios, 28 COMPLIANT** (0 PARTIAL, 0 MISSING), más la fila SP-6.

## 3 · Evidencia TDD (strict)

`apply-progress.md:11-17` y `:82-84` traen los rojos antes del verde con salida y causa: L1.2 (6 rojas de 8; las 2 verdes de salida, a propósito y dichas), L1.3 (`not.toContain('no precisa')`), L1.4 (22 pruebas; primero IDs `sep-NN` rechazados, luego `ticketsVariante` inexistente), L2.2 (9 rojas de 48: `tablas is not iterable`). Verdes mínimos L1.5-L1.8 y L2.3-L2.4. **Contrastado con la realidad:** los 6 ficheros están en verde ahora (215 pruebas), existen todos los ficheros de prueba citados y las mutaciones caen (§4). Triangulación: la variante se prueba con valores distintos de la letra (`sh.t:171-199`) y la aceptación con ocho alteraciones por separado. Línea base: L1.1 corrió RQ-KP-38 antes de escribir (33 pruebas verdes, `apply-progress.md:9`). El `.tsx` queda sin prueba por F0-00 y no decide nada.

Calidad de aserciones: sin tautologías, sin `toBeDefined` solitarios, sin humo. Único bucle: `lib.t:257` itera `tablas`, que `lib.t:224` ya fija en dos elementos, así que no puede ser fantasma. Ninguna mutación sobrevivió a su prueba nombrada. **Aserciones: 0 CRITICAL, 0 WARNING.**

## 4 · Las diez mutaciones de D9 (`design.md:174-187`)

| # | Prueba que cayó | Reproducida por |
|---|---|---|
| M1 | 12: «la variante y la letra difieren por ticket», aceptación (2) y las ocho alteradas | orquestador |
| M2 | «la tabla de la variante lee la variante» | orquestador |
| M3 | letra primero: 8; rótulos intercambiados: «la variante va primero con su rótulo» | **yo (b)** |
| M4 | C13 (`sh.t:136`), «la nota dice quién juzga», las dos sha256 de cuerpo | **yo** |
| M5 | aceptación (2) y (3); RQ-KP-38 | apply (`apply-progress.md:45-46`) |
| M6 | «`tickets` sigue siendo la letra» (+13); lado cliente: «los tickets salen de su clave» (+3) | apply |
| M7 | «un ticket coincide sólo si coinciden todos», C9, ocho alteradas, sha256 del POST | apply |
| M8 | «la 55 de la variante dice…», «la letra sigue pintando «—»», «porcentaje null» | **yo** |
| M9 | prueba de fuente `lib.t:259`; el esperado importado no cae (SUGGESTION 2) | apply |
| M10 | sha256 del CSV (`indicadores.test.ts:271`) | apply |

**Reproducidas por mí** (aplicar con `node -e` → vitest → `git checkout` → `git diff --stat` vacío y sha256 del fichero igual):
- **M4**, nota antigua en `sh:10`: 4 rojas de 134 — C13 `sh.t:136`, «la nota dice quién juzga» y las dos sha256 de cuerpo (`indicadores.test.ts:263`, `indicadoresComparacion.test.ts:326`). Revertido: `eb79e6ff8f21` antes y después.
- **M8**, letra con la frase y variante con «—» (`lib:70-71`): 3 rojas de 48 — «porcentaje null: «—», nunca 0 ni 100», «la 55 de la variante dice `MENSAJE_SIN_PARES`…», «la letra sigue pintando «—»…». Revertido: `67223cc4129b` antes y después.
- **M3 b**, rótulos intercambiados: 1 roja de 48 — «la variante va primero con su rótulo». Revertido; `git diff --stat` vacío.

## 5 · Comprobaciones del encargo

| Comprobación | Resultado |
|---|---|
| MODIFIED RQ-KP-16: líneas | 53 en el delta (`specs/kpis/spec.md:19-71`) y 53 en el vivo (`openspec/specs/kpis/spec.md:560-612`). OK |
| Seis títulos de escenario | `diff` de los `#### Scenario` de ambos bloques: vacío (idénticos) |
| Fila SP-6 | 1 línea en el delta y 1 en el vivo (`:32`). OK |
| `sh:9` y `sh:90` | `MENSAJE_SIN_PARES` y la firma de `compararIndicadores`, intactas |
| sha256 del CSV (`indicadores.test.ts:271`) | `c83ef69a…ba88be2`, sin hunk en el diff. OK |
| sha256 de cuerpo | `:263` `0975f415…`→`95cb5026…`; `indicadoresComparacion.test.ts:326` `862d1958…`→`265b7cbf…`. Recalculadas, no borradas, en `c47b6cd2` (su mensaje nombra `decision/f1f05-variante-juzga-el-95`; los comentarios de línea también) |
| JSON de `GET /api/indicadores` | Cambian sólo `comparacion.ticketsVariante` (nuevo, entre `tickets` y `nota`; `sh:126`, orden fijado por `acc:89`) y `comparacion.nota` (`sh:10`). `apps/desk/server/routes/indicadores.ts` no aparece en el diff: el CSV queda intacto |
| `.tsx` sin lógica | `ComparacionExportacion.tsx`: 14 inserciones y 9 borrados; sólo `map` sobre `v.tablas` y `t.*`; ninguna suma, resta, comparación ni color de estado |
| Colocación (mutación 4) | `sh`, `septiembre2026.ts`, `lib` y los cuatro ficheros de prueba: hunks en sitio o al final; sólo el `.tsx` cambia de longitud (73→78) |
| Ficheros fuera de alcance | `git diff --name-only e1a92b59 HEAD`: ninguno de `openspec/config.yaml`, `docs/sdd/ENTRADA.md`, `_to_delete/`, n8n, `.env.example`, `.csv` ni `openspec/specs/`. Tocados y previstos (L2.10-L2.11): `apply-progress.md` y `verify-report.md` de `openspec/changes/archive/2026-10-23-poblacion-cierre-variante-47-51/` (2 líneas cada uno, anclas caso B) |

**Tabla de la regla invariable 13** (`apply-progress.md:146-154`) contrastada con el código: variante y letra consumen `sh:116` y `:119-120`; el `null` en vez de 0/100 sale de `porcentaje` en shared y `lib:48` sólo escribe `—` o la frase; la frase se importa (`lib:4`); orden y rótulos son presentación sin guarda (probado en `lib.t:224`); «Difieren» y «Sin comparar» no existen por ticket (`LecturaTickets`, `sh:45`) y el cliente no resta (`lib.t:256`). Cada decisión nombra su línea de shared: **COMPLIANT**.

## 6 · Coherencia con el diseño

D1-D8 y D10 implementados como se dicen; D9 completo (§4); D11 (dos intentos ≤ 720) sin la cifra en el `apply-progress` (WARNING 1). Sin desviación que rompa una spec.

## 7 · Hallazgos

**CRITICAL: 0.**

**WARNING (1)**
1. `openspec/changes/comparacion-juzga-variante/apply-progress.md:72` y `:160` dejan la medida del ledger de cada lote en «ver el informe del lote»: la cifra exacta (`git diff --shortstat --no-renames` más `wc -l` de lo nuevo) no está en el repositorio, y la obligación del 2026-09-28 pide registrar ESO. No puedo comprobar desde el repositorio el techo de 720 de los intentos 3 y 4; el orquestador debe dejar las dos cifras en el informe del lote o al cerrar.

**SUGGESTION (3)**
1. `lib.t:257` es un `for … of` sobre `tablas`; hoy no puede ser fantasma (`lib.t:224` fija dos), pero un `expect(…tablas).toHaveLength(2)` en la misma prueba lo haría explícito.
2. M9: el esperado importado de shared no cae si el literal coincide con la constante (`apply-progress.md:100`); sólo la prueba de fuente (`lib.t:259`) lo caza. Está dicho y es suficiente; conviene conservarla.
3. El detector da 13 abreviadas rotas informativas, ajenas a este cambio (`apply-progress.md:142`).

## 8 · Qué queda fuera

P-1 (supuestos S-1 a S-7), P-2 (repetir septiembre) y P-3 (probar la tabla en la aplicación) son de persona. **Archivar no las da por hechas.** `cierra: no`: la fila F1F-05 sigue en curso.

**Siguiente:** `sdd-archive`, tras dejar escrita la medida del ledger (WARNING 1).
