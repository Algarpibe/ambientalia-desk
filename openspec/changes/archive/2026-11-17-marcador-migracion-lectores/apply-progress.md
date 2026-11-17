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

## L2 · pantallas y reconocimiento (intento 2) — HECHO, casillas 2.1 a 2.28

Partida `eae6fb05` (commit de L1 y de su `apply-progress`). Commit del código: `749d1bd3`. Modo: strict TDD, una pasada RED → GREEN → mutaciones. Ninguna línea existente se movió: todo hunk de fichero existente es `-N +N` o va al final (recuento más abajo).

### Rojo visto (2.5)

Orden: `npx vitest run packages/shared/src/marcadorMigracion.test.ts apps/desk/server/migracionMarcadorLectores.test.ts apps/desk/server/db/traspaso.test.ts apps/desk/server/db/historialTipoEvento.test.ts`. Resultado: 10 pruebas en rojo, antes de tocar producción (51 verdes de 61 en los cuatro ficheros). Primer intento: la prueba de P13 llevaba una barra invertida mal escrita y el fichero no compilaba; se corrigió (`sep` de `node:path`) y se repitió, así que el rojo de abajo es el del fichero entero ya compilando.

| Prueba | Por qué cae (leído del log) |
|---|---|
| 4 de `presentarMarcador` (unitarias) | `TITULO_MARCADOR_MIGRACION` y `TEXTO_REGLA_MIGRACION` llegan `undefined` y `presentarMarcador` «is not a function»: la importación existe, el símbolo no |
| R2 (historial y conversación de z1) | el título real es «Transición: Migración de ticket abier…» y se esperaba `TITULO_MARCADOR_MIGRACION` (`undefined` hasta 2.6); la conversación aún enseña el marcador |
| R3 (hoja de vida de z1 y z2) | valor: `[ 'En Proceso', null ]` en vez de `[]` (las dos etapas del marcador salen) |
| P10 | título «Transición: …» en vez del del presentador |
| P11 | valor: la conversación de T-201 devuelve un mensaje (el marcador, con «Regla: pendiente-servicio-a-en-proceso» y «Managed by app previo: false») en vez de `[]` |
| P12 | valor: la hoja de vida de T-211 devuelve `['Habilitar Servicio', …]` (el marcador como segunda etapa) en vez de `['Habilitar Servicio']` |
| P13 | valor: cinco ficheros en vez de cuatro; el sobrante es `apps/desk/server/db/traspaso.ts`, justo por su línea 2 y su línea 26 de `e728808d` |

R2, P10 y P11 caen por el motivo bueno: el valor del lector, no la importación. La segunda mitad de P12 (el ticket sin marcador conserva «Ticket creado», «Habilitar Servicio» y «Aprobar» en orden) es caracterización: verde antes y después.

### Verde (2.11)

Seis ficheros focales (los cuatro de 2.5 más `migracionTicketsAbiertos.test.ts` y `cierreMigracionEnCifras.test.ts`, sin tocar los dos últimos ni las pruebas de las líneas 46 y 54 de `migracionMarcadorLectores.test.ts` en `e728808d`, CA-6): 85/85. `git diff --stat e728808d -- apps/desk/src` sale vacío (2.12, CA-9): el cliente no decide nada sobre el marcador (design §9); lo oculta y lo redacta el servidor.

### Mutaciones (2.22-2.27)

Con el lote commiteado. Protocolo de cada una: `file` antes, `perl -i -pe 's/\Q…\E/…/ if $. == N'` con las cadenas en variables de entorno, `npx vitest run` del fichero de pruebas, restauración con el inverso, `file` igual («with CRLF line terminators») y `git diff --numstat -- <f>` vacío. M13 y M14 se restauraron con `git checkout -- <f>` por estar la rama limpia (el fichero queda byte a byte el del commit).

| # | Mutación | Pruebas rojas | Verdes que importaba |
|---|---|---|---|
| M9 | `historial.ts` línea 143, sólo `eventoTransicion(f, nombres)` | P10 y R2 | — |
| M10 | `conversacion.ts` línea 143, sin `.filter(...)` | P11 y R2 | — |
| M11 | `equipos.ts` línea 278, sin `.filter(...)` | P12 y R3 | — |
| M12 | `traspaso.ts` línea 26 sustituida por un comentario | `traspaso.test.ts`: «marcador con destino relleno y área siguiente: ninguna» y «el marcador de F1F-01 no da traspaso, ni con destino ni sin él» (la segunda es la del bloque 139-144) | el resto de `traspaso.test.ts` (20 de 22) |
| M13 | `traspaso.ts` líneas 2 y 26 a su texto de `e728808d` (comprobado con `diff` contra `git show`) | **sólo P13** (17 de 18 verdes) | todo lo demás |
| M14 | `equipos.ts` línea 278 con `f.transition_id !== 'migracion_f1f01_abiertos'` (regla de mutación 2: se ensucia el fichero vigilado) | **sólo P13** (17 de 18 verdes) | **R3 y P12 verdes**: P13 es el único detector |

**Fallo propio, corregido sin efecto:** la primera vez, M10 y M11 se escribieron con el texto nuevo vacío; el perl inverso (`s/\Q\E/…/`) casa en la columna 0 e inserta el texto delante en vez de restaurar, y M11 además dejaba el paréntesis sin cerrar (rojo «no tests»). Se detectó por el `numstat` no vacío tras restaurar, se hizo `git checkout -- <f>` y se repitieron con un texto nuevo no vacío (`/* sin filtro */`, `tr.rows as any[]`). Los resultados de la tabla son los de la repetición. Regla para el ayudante: el texto nuevo nunca va vacío.

### Barrido de citas (2.13-2.17, regla de mutación 4)

Método: `grep -rnoE "<módulo>\.ts:[0-9]+(-[0-9]+)?"` sobre TODO el worktree (sin `node_modules`, `.git`, `dist`, `.codegraph`; con `openspec/changes/archive/`, `docs/` y los dos ficheros vedados), un comando por módulo, y un filtro que conserva las citas cuyo rango contiene una línea editada. Cae en línea editada, fuera de los artefactos de este cambio: **108 citas** (`sla.ts` 39, `relojSla.ts` 12, `historial.ts` 27, `conversacion.ts` 7, `equipos.ts` 10, `traspaso.ts` 4, `migracionMarcadorLectores.test.ts` 9; `esperasVencidas.ts`, `index.ts` y `migracionTicketsAbiertos.test.ts`: cero); 86 son del archivo y 22 de otros ficheros. Segundo pase de abreviadas sobre las 595 líneas físicas que citan alguno de los módulos: sólo tres abreviadas caen en línea editada, todas en `normalizar-estados-zoho` archivada (`relojSla.ts` `:45` dos veces y `conversacion.ts` `:140`), las tres caso A. Se leyó cada cita contra lo que dice HOY la línea.

| Grupo de citas | Dónde | Caso | Por qué |
|---|---|---|---|
| Títulos de R1 y R2 (`sla.ts` línea 88; `historial.ts` línea 137 y `conversacion.ts` línea 140) | `migracionMarcadorLectores.test.ts` líneas 41 y 62 | **A** | siguen señalando el `SELECT` de cada lector; cambió el título, no la cita |
| `sla.ts` 88-95 de `entradasActuales` | `openspec/specs/zoho-sync/spec.md` (spec viva) | **A** | el rango sigue siendo la consulta y el marcador de identidad sigue sin mover la entrada |
| `historial.ts` 131-161 y 131-162, `:136-144`, `:157` | `openspec/specs/trazas/spec.md` (spec viva) | **A** | el rango de `getHistorialTicket` no se movió; el marcador entra por la misma rama |
| `equipos.ts` 261-292 y 260-292 | `docs/sdd/F0-00_Baseline_as-built.md` y `docs/sdd/Triaje_Linea_Base_Citas_2026-09-15.md` | **A/C** | ya llevan su ancla `a3a8f03`; hablan de la fusión con `ticket_history`, que no cambió |
| `historial.ts` línea 143 y `traspaso.ts` 25-26 | `Paquete_de_Despliegue_2026-10-05.md` líneas 74 y 77 y `…05b.md` línea 230 (vedados) | **A** | la línea 143 sigue componiendo traspaso y transición, y la 26 sigue excluyendo el marcador del traspaso; sólo cambia cómo lo reconoce |
| `sla.ts` 88, `historial.ts` 137, `conversacion.ts` 140, `equipos.ts` 275 y los tres títulos de la prueba | `openspec/config.yaml` línea 6775 y `docs/sdd/ENTRADA.md` línea 2094 (vedados) | **B** | ya medidos «sobre `d182230e`» o colgados de entradas de 2026-10-04; la ubicación sigue valiendo, lo que afirman («lo enseñan como Transición», «cuenta como entrada») ya no. Traza abajo |
| 64 citas del archivo: `blueprint-equipo-nuevo`, `alarmas-horas-habiles` (ancla `6516e5f`), `prioridad-top5-cliente`, `propagar-top5-lista-remision-creada` (78-102), `reasignacion-con-motivo`, `fecha-migracion-fuera-de-cifras`, `fecha-cierre-migracion`, `reloj-sla-esperas`, `calibracion-directa`, `salidas-esperas` (`sla.ts` 87-91 y 88; `relojSla.ts` 75-85 y 77-81), `normalizar-estados-zoho` (`relojSla.ts` 3 y 45, `sla.ts` 2 y 88-95), `traspaso-y-trazas` (`historial.ts` 131-161 y 142-144; `traspaso.ts` 25-26, 26 y 19-46), `tipo-evento-transicion` (`historial.ts` 3, 131-162) y `migracion-tickets-abiertos` (`sla.ts` 88-95 como ubicación de la consulta) | `openspec/changes/archive/` | **A** | afirman ubicación o estructura (el import de la línea 2, la consulta de la 88, la composición de la 142-144, la exclusión de la 26), y eso sigue cierto |
| 22 citas del archivo, caso B sin ancla (**LISTADAS, no editadas**) | `openspec/changes/archive/` | **B** | describen el comportamiento de antes de esta tanda; lista abajo |

**Caso B del archivo, sin ancla (no se editan: registro fechado).**
- `2026-10-04-migracion-tickets-abiertos/apply-progress.md`: líneas 117, 179 y 246 (`sla.ts` línea 88: «arranca en la fecha de la migración»); línea 126 (`conversacion.ts` línea 140: «igual, como mensaje privado del hilo»).
- `2026-10-04-migracion-tickets-abiertos/design.md` línea 38 (D-6, `sla.ts` 88-95: «toma como entrada la última fila cuyo `to_status` coincide», sin la fecha de Zoho); `tasks.md` línea 154 y `verify-report.md` línea 157 (`sla.ts` 88-95 y 87-88: lo que «el diseño sólo leyó»).
- `2026-10-05-traspaso-y-trazas`: `proposal.md` línea 96 (`conversacion.ts` línea 140: «sólo se toca el historial», «sin destino»); `proposal.md` línea 180, `design.md` línea 184, `tasks.md` líneas 162 y 195, `apply-progress.md` líneas 69 y 114 y `verify-report.md` línea 140 (`migracionMarcadorLectores.test.ts` 62-71 y 62: «sigue verde sin editarse», «lo enseñan como Transición»); `verify-report.md` línea 177 (lista de lectores, `conversacion.ts` línea 140 y `equipos.ts` línea 275, como «Transición»).
- `2026-10-06-reasignacion-con-motivo/proposal.md` línea 84 (`sla.ts` 93-99): A para las filas reales, B para el marcador de una regla que cambia el estado.
- `2026-10-18-tipo-evento-transicion`: `apply-progress.md` línea 53, `design.md` línea 108, `tasks.md` línea 36 y `verify-report.md` línea 126 (`historial.ts` línea 143 «sin tocar»): cierto de SU diff, hoy la línea cambia.
- `2026-10-21-salidas-esperas/proposal.md` línea 160 (`sla.ts` línea 88: «la alarma no ve la entrada de los tickets de Zoho»): cierto de las filas reales, ya no del marcador.

Detector (2.17): `tsx apps/desk/server/citas/cli.ts --sha HEAD` sale 0; **8.953 comprobadas, 13 abreviadas rotas informativas** (las mismas 13 de L1). Este fichero anota toda cita a un fichero editado con «en `e728808d`», con «línea N» sin dos puntos o sin número.

### Traza para E-215, E-216 y E-217 (2.16) — la hace la supervisión al fusionar; esta rama NO toca los dos ficheros

Nada de esto se ha escrito. Qué línea cambia de verdad y cómo debería quedar:

| Fichero y línea | Hoy | Cómo queda |
|---|---|---|
| `docs/sdd/ENTRADA.md` línea 2083 (cabecera de E-215) | `**ABIERTA**` | `~~ABIERTA~~ **RESUELTA <fecha>**`, mismo molde que E-213 en la línea 2073, con el hash de la fusión |
| `docs/sdd/ENTRADA.md` línea 2086 (Estado de E-215) | «abierta · … Traza 17/11/2026 (supervisión): destino decidido…» | se añade, en la MISMA línea, «Resuelta por `<fusión>` (`marcador-migracion-lectores`): el historial lo enseña como «Migración desde Zoho Desk» con textos en español y la conversación lo oculta (RQ-TZ-26, RQ-TZ-27)». Las líneas 2084 y 2085 (Qué, Dueño) no se tocan: son el registro del hallazgo |
| `docs/sdd/ENTRADA.md` líneas 2088 y 2091 (E-216) | `**ABIERTA**` y Estado abierta | igual: tachar y «Resuelta por `<fusión>`: la hoja de vida no lista el marcador (RQ-HV-20)». La línea 2089 (cita la línea 275 de `equipos.ts` y «entra como una más») queda como registro del defecto; su ubicación sigue valiendo |
| `docs/sdd/ENTRADA.md` líneas 2093 y 2096 (E-217) | `**ABIERTA**` y Estado abierta | igual: «Resuelta por `<fusión>`: la alarma y los relojes fechan el marcador con la fecha de Zoho (RQ-TC-84, RQ-TC-85, RQ-TC-86); «Finalizado» con `cierre_origen: 'migracion'` queda sin dato (S-10)». La línea 2094 (cita la línea 88 de `sla.ts`) queda como registro |
| `openspec/config.yaml` línea 6775 (`decision/marcador-migracion-en-pantallas`, punto (2) de `consecuencias`) | «Vivos, medidos … sobre `d182230e`: E-215 … E-216 … E-217 … Los fija hoy la prueba … que la tanda reescribe en sitio» | caso B ya anclado por «sobre `d182230e`»: se añade al final de la MISMA línea física «; resueltas por `<fusión>` (`marcador-migracion-lectores`)», sin partirla ni mover ninguna otra. La línea 6776 (cita las pruebas 41, 54, 62 y 73) sigue valiendo: R1, R2 y R3 conservaron su número de líneas, y la 54 no se tocó |
| `openspec/config.yaml`, bloque `decisiones_de_gerencia_adenda_2` | — | si la supervisión quiere un registro propio de los supuestos S-1 a S-13, va al FINAL del bloque (regla del bloque final de `CLAUDE.md`), nunca en medio |

`CLAUDE.md` no necesita cambio por esta tanda: ninguno de los cuatro incumplimientos vivos nombra el marcador.

### TDD Cycle Evidence

| Casilla | Fichero de prueba | Capa | Red de seguridad | RED | GREEN | TRIANGULAR | REFACTOR |
|---|---|---|---|---|---|---|---|
| 2.1 | `packages/shared/src/marcadorMigracion.test.ts` | Unitaria | las 11 de L1, verdes | 4 rojas (símbolos inexistentes) | 15 verdes | `values` completo, nulo, vacío, no-objeto, regla desconocida y cuatro textos | sin cambios |
| 2.2, 2.3 | `migracionMarcadorLectores.test.ts` (R2, R3) | Integración (pg-mem) | las del fichero, verdes salvo R2 y R3 | R2 y R3 rojas | verdes | z1 (identidad) y z2 (destino relleno) | sin cambios |
| 2.4 | `migracionMarcadorLectores.test.ts` (P10-P13) | Integración (pg-mem) y escaneo | idem | P10, P11, P12 y P13 rojas | verdes | P10 con dos reglas, P11 con dos tickets, P12 con marcador y sin él, P13 con la mutación M14 | sin cambios |
| 2.6-2.10 | los tres ficheros de arriba | — | — | — | `presentarMarcador` (30 líneas), `eventoMigracion`, tres filtros, `traspaso.ts` | M9-M14 | sin cambios |

### Cambios de código por línea (design §5), todos en sitio o al final

`marcadorMigracion.ts`: línea 3 y `TITULO_MARCADOR_MIGRACION`, `TEXTO_REGLA_MIGRACION` y `presentarMarcador` al final. `historial.ts`: 3 y 143 en sitio; `eventoMigracion` al final. `conversacion.ts`: 1, 140 y 143. `equipos.ts`: 6, 274 y 278 (conserva los dos `as any[]` de `e728808d`, uno en la línea 266 y uno en la 278: la 278 no suma otro). `traspaso.ts`: 2 y 26. Pruebas: línea 4 del unitario; líneas 1, 2, 62-71 (10 líneas), 73-77 (5 líneas) y el `describe` de L2 al final.

**Desviaciones del diseño, ninguna de regla:** (1) `eventoMigracion` lleva `tipoEvento` (`tipoEventoDeTransicion` da `null` para el marcador) en la misma forma que `eventoTransicion`, para que `historialTipoEvento.test.ts` siga verde. (2) El `describe` de L2 usa ayudantes propios (`habilitar`, `creacionDe`, `etapasDeLaHoja`). (3) P13 detecta también las comillas dobles y las invertidas, no sólo `'…'`. (4) Un detalle de `presentarMarcador` que no es texto, o es sólo espacios, se omite (`trim()`), no sólo el vacío exacto.

### Recuento `-N +N` de los hunks de ficheros existentes (`git diff -U0 eae6fb05`)

`conversacion.ts` 1, 140 y 143 (-1+1 cada una). `equipos.ts` 6, 274 y 278 (-1+1 cada una). `historial.ts` 3 y 143 (-1+1) y +8 al final, tras la 162. `traspaso.ts` 2 y 26 (-1+1). `migracionMarcadorLectores.test.ts`: 1-2 (-2+2), 62 (-1+1), 65-68 (-4+4), 70 (-1+1), 73 (-1+1), 76 (-1+1) y +82 al final (R2 sigue en 10 líneas y R3 en 5). `marcadorMigracion.test.ts`: 4 (-1+1) y +41 al final. `marcadorMigracion.ts`: 3 (-1+1) y +30 al final. Ningún hunk desplaza una línea existente.

### Las cinco comprobaciones (2.19), sobre `749d1bd3`

Cadena con `set -o pipefail` y `&&`. Memoria física libre al arrancar: 10.062 MB. Sin el fallo conocido de `onTaskUpdate`.

| # | Comprobación | Resultado | Duración |
|---|---|---|---|
| 1 | `npm run typecheck` | sale 0 | 21 s |
| 2 | `npm run lint -- --max-warnings 165` | sale 0, 165 avisos (los mismos de la partida), sin `any` ni `eslint-disable` nuevos | 18 s |
| 3 | `tsx apps/desk/server/citas/cli.ts --sha HEAD` | sale 0; 8.953 comprobadas, 13 abreviadas rotas informativas | 8 s |
| 4 | `npm test` (log entero en el scratchpad, `npmtest-l2-1817.log`) | sale 0; 379 ficheros pasan, 6 saltados; 6.529 pruebas pasan, 36 saltadas | 145 s (`Duration` de vitest 143,81 s) |
| 5 | `npm run build` | sale 0 | 13 s |

Total de la cadena: 205 s.

**Bundle:** `dist/assets/index-F1jDYjEU.js`, 427,51 kB (y `index-BXv9vVDm.css`, 32,68 kB). Igual que la partida: D-1 se mantiene, el cliente no importa el módulo y **sólo se despliega el servidor**.

### Medida (2.20)

`git diff --shortstat --no-renames eae6fb05` sobre el árbol de este fichero: **9 ficheros, 333 inserciones y 50 borrados = 383 líneas**, de ellas 56 son las 28 casillas de `tasks.md` y 122 este fichero (L2, tras remedir). Sin ficheros nuevos sin trackear ni binarios. Muy por debajo del techo de 800 (el size-exception no aplica). La remide el orquestador al cerrar el intento (±2).

### Pendiente

Nada de código. Quedan, fuera del recuento y para la supervisión: la traza de E-215 a E-217 de arriba y el cierre del intento con `gentle-ai sdd-attempt settle`, con la medida remedida.
