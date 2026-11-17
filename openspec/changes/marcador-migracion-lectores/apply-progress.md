# Apply-progress: `marcador-migracion-lectores` (F1F-01, `cierra: no`)

## L1 · núcleo y relojes (intento 1) — HECHO, casillas 1.1 a 1.26

Partida `6dcb85f2`. Commit del código: `707fc260` (un solo commit; el primero, `b0bfb22b`, se enmendó al fortalecer P6, ver M7).
Modo: strict TDD, una pasada RED → GREEN → mutaciones. Ninguna línea existente se movió: todos los hunks de ficheros existentes son `-N +N` o van al final.

### Rojo visto (1.6)

Orden: `npx vitest run packages/shared/src/marcadorMigracion.test.ts apps/desk/server/migracionMarcadorLectores.test.ts apps/desk/server/db/migracionTicketsAbiertos.test.ts`.
Resultado: 1 fichero y 9 pruebas en rojo, antes de tocar código de producción.

| Prueba | Por qué cae |
|---|---|
| `marcadorMigracion.test.ts` (fichero entero) | importación: `./marcadorMigracion` no existe |
| R1 (`sla.ts:88 · ningún marcador entra…`) | valor: `['z2']` en vez de `[]` (z2 entraba con el `performed_at` de la migración) |
| R4 (`migracionTicketsAbiertos`, t2 sin historia) | valor: `['t2']` en vez de `[]` |
| P1, P2 | valor: entraban con el `performed_at` del marcador (P1 daba también `T-205`, sin fecha) |
| P4, P5, P6, P7, P8 | valor: `secuenciaDelReloj` daba `null` con un marcador de identidad (`to_status` nulo) o no fechaba el cambio de estado |
| P3, P9 | verdes antes y después: son caracterizaciones |

### Verde (1.13)

Las tres pruebas focales: 44/44. `npx vitest run packages/shared apps/desk/server/db/sla`: 68 ficheros, 1.797 pruebas, sin rojos. Salvedad de proceso: P7 estuvo en rojo por una causa falsa (la fila de la prueba no llevaba `created_time`, así que la secuencia daba `null` también con el arreglo); se corrigió la prueba y desde entonces M3 y M5 la ponen roja por la causa buena.

### Mutaciones (1.18-1.25)

Con el lote commiteado. Protocolo de cada una: `file` antes, `perl -i -pe 's/\Q…\E/…/ if $. == N'`, `npx vitest run` de los dos ficheros de prueba de L1 (más el unitario en M7 y M8), restauración con el `perl` inverso, `file` igual y `git diff --numstat -- <f>` vacío. Las cuatro cosas se cumplieron en las ocho; el `file` fue siempre «with CRLF line terminators».

| # | Mutación | Pruebas rojas |
|---|---|---|
| M1 | `sla.ts:93` vuelve a `r.rows` | R1, P1, P2, R4 |
| M2 | `sla.ts:88` sin `transition_id` | R1, P1, P2, R4 |
| M3 | `relojSla.ts:43` con `filasApp` | P4, P5, P7, P8 |
| M4 | `relojSla.ts:45` con `etapasZoho` | P5 |
| M5 | `relojSla.ts:77` sin `transition_id` | P7 |
| M6 | `esperasVencidas.ts:36` sin `transition_id` | P8 |
| M7 | `resolverMarcador`: sin fecha pasa de `return null` a `continue` | la unitaria «un marcador que cambia el estado y no tiene fecha…» y P6 |
| M8 | rama de D-3 con la regla de D-2 | las dos unitarias de «Entregado» y P2 |

**Hallazgo en M7, resuelto en el lote:** la primera versión de P6 NO se ponía roja (sólo la unitaria). La historia de la prueba acababa en «Servicio externo», que no es el estado actual: la secuencia daba `null` por el hueco (`relojSla.ts:48`) con o sin la regla de S-11, así que P6 no discriminaba. Se cambió la historia de T-207 a «Ingresado → En Proceso» (llega al estado actual, sin «Pendiente») y M7 pone roja P6. Es el modo de fallo de siempre: una prueba verde que no sabe distinguir. Los resultados de M1-M6 y M8 no dependen de P6 y no se repitieron.

### Las cinco comprobaciones (1.15), sobre `707fc260`

Cadena con `set -o pipefail` y `&&`. Memoria física libre al arrancar: 8.462 MB. Sin el fallo conocido de `onTaskUpdate`.

| # | Comprobación | Resultado | Duración |
|---|---|---|---|
| 1 | `npm run typecheck` | sale 0 | 14 s |
| 2 | `npm run lint -- --max-warnings 165` | sale 0, 165 avisos (los mismos de la partida), sin `any` ni `eslint-disable` nuevos | 15 s |
| 3 | `tsx apps/desk/server/citas/cli.ts --sha HEAD` | sale 0; 8.952 comprobadas, 13 abreviadas rotas informativas (no bloquean) | 8 s |
| 4 | `npm test` (log entero en el scratchpad) | sale 0; 379 ficheros pasan, 6 saltados; 6.521 pruebas pasan, 36 saltadas | 137 s (`Duration` de vitest 134,78 s) |
| 5 | `npm run build` | sale 0 | 8 s |

Una primera pasada idéntica sobre `b0bfb22b` también salió 0 en las cinco (141 s en `npm test`, memoria 8.171 MB); se repitió sobre el commit final por la enmienda.

**Bundle:** `dist/assets/index-F1jDYjEU.js`, 427,51 kB. Igual que el de la partida: D-1 se mantiene (el cliente no importa el módulo) y no hace falta la subruta.

### TDD Cycle Evidence

| Casilla | Fichero de prueba | Capa | Red de seguridad | RED | GREEN | TRIANGULAR | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1.1 | `packages/shared/src/marcadorMigracion.test.ts` | Unitaria | N/A (nuevo) | escrito, rojo por importación | 11 pruebas verdes | cuatro ramas de D-4, S-13, normalización, sin fecha, orden | sin cambios |
| 1.2, 1.3 | `migracionMarcadorLectores.test.ts`, `migracionTicketsAbiertos.test.ts` | Integración (pg-mem) | las existentes de los dos ficheros, verdes salvo R1 y R4 en el rojo | R1 y R4 rojos | verdes | identidad frente a z2 (S-13) y t2 real | sin cambios |
| 1.4, 1.5 | `migracionMarcadorLectores.test.ts` | Integración (pg-mem) | idem | P1, P2, P4-P8 rojos; P3 y P9 caracterización | verdes | dos tickets por prueba donde hacía falta (con y sin fecha) | P6 y P7 corregidas tras M7 y la causa falsa de P7 |
| 1.7-1.12 | los tres ficheros de arriba | — | — | — | `marcadorMigracion.ts` (73 líneas), `conFechaDeZoho`, cuatro lectores | M1-M8 | `Fila` tipada en `relojSla.ts:40` por el typecheck |

### Cambios de código por línea (design §5), todos en sitio o al final

`packages/shared/src/index.ts`: línea 57 nueva. `apps/desk/server/db/sla.ts`: 2, 88 y 93 en sitio; `conFechaDeZoho` al final (21 líneas con su comentario; no se exporta, nadie más la llama). `apps/desk/server/db/relojSla.ts`: 3, 40, 43, 45 y 77 en sitio. `apps/desk/server/db/esperasVencidas.ts`: 36 en sitio. Pruebas: imports en las líneas 2, 4 y 13 (la 1 no necesitó cambio), R1 y R4 con el mismo número de líneas, `describe` de L1 al final.

**Desviaciones del diseño, ninguna de regla:** (1) `conFechaDeZoho` no se exporta (el diseño no lo pedía). (2) El `describe` de L1 usa sus propios ayudantes (`marcadorDe`, `cambioDeZoho`…). (3) En `relojSla.ts:40` el `map` lleva la anotación `(f): Fila`, que el diseño no escribía y el typecheck exigió (el spread de `Record<string, unknown>` pierde la firma de índice).

### Medida (1.16)

`git diff --shortstat --no-renames 6dcb85f2` sobre el commit de este fichero: **10 ficheros, 424 inserciones y 42 borrados = 466 líneas**, de ellas 52 son las 26 casillas marcadas de `tasks.md` y 80 este fichero. Sin ficheros nuevos sin trackear (todo está commiteado) ni binarios. Muy por debajo del techo de 800. Esta misma línea la remide el orquestador al cerrar el intento (±2).

### Pendiente para L2

Todo lo de L2 (2.1 a 2.28), incluido el barrido de citas de design §8. Quedan sin tocar `historial.ts`, `conversacion.ts`, `equipos.ts` y `traspaso.ts`; sus citas y las de `openspec/config.yaml` y `docs/sdd/ENTRADA.md` se barren en L2.
