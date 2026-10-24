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
- L1.6: `packages/shared/src/indicadoresComparacion.ts` según D1-D3, en sitio: `:2`, `:10`, `:45`, `:92`, `:106-107`, `:110`, `:119-120`, `:126`; `LecturaTickets`, `PorTicket` y `lecturaPorTicket` al final (`:130-138`). `:9` sigue siendo `MENSAJE_SIN_PARES` y `:90` la firma de `compararIndicadores`.
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
