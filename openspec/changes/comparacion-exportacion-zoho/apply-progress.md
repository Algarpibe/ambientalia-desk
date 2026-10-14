# Progreso de apply — `comparacion-exportacion-zoho` (F1F-05, `cierra: no`)

Modo: Strict TDD (vitest). Artefactos: hybrid. Techo 800 líneas por intento, válvula 720. Worktree
`C:\dev\Desk_2_R1.023-worktrees\comparacion-exportacion-zoho`, rama `comparacion-exportacion-zoho`.

## Lote 1 · Lector de la exportación (tareas 1.1 a 1.14; la 1.15 es del orquestador)

### Estado de las tareas

| Tarea | Estado | Nota |
|---|---|---|
| 1.1 | hecha | Commit de partida `b523352`; el intento lo abrió el orquestador. `wc -l` de partida: `analizarRespuestas.ts` **183**, `packages/shared/src/indicadores.ts` **262**, `packages/shared/src/index.ts` **43** |
| 1.2 | hecha | `packages/shared/src/indicadoresExportacion.ts` (28 líneas, sólo tipos) y una línea al final de `index.ts` (43 a 44) |
| 1.3 | hecha | `apps/desk/server/testing/exportacionZoho.ts` (49 líneas): `CABECERA_MUESTRA` (59), `filaMuestra`, `csvMuestra`; centinelas y relleno exportados |
| 1.4 a 1.6 | hechas | `apps/desk/server/comparacion/leerExportacion.test.ts`: 28 pruebas |
| 1.7 | hecha | Rojo mirado (abajo) |
| 1.8 | hecha | `analizarRespuestas.ts` sigue en **183** líneas (sólo la línea 54 cambia: `export function leerRegistros`); `indicadores.ts` 262 a **264** (+2) |
| 1.9 | hecha | `apps/desk/server/comparacion/leerExportacion.ts` (85 líneas) |
| 1.10 | hecha | `leerExportacion.test.ts` + `apps/desk/server/encuesta`: **73 pruebas verdes** (28 nuevas + 45 de la encuesta, intactas) |
| 1.11 | hecha | M7, M8, M9, M10, M12 y M20 ejecutadas una a una (abajo). Una mitad de M7 es equivalente |
| 1.12 | hecha | Los tres códigos, abajo |
| 1.13 | hecha | Medida, abajo |
| 1.14 | hecha | Barrido, abajo |
| 1.15 | **no es de este agente** | El commit, el detector de citas y el asentado son del orquestador |

### Evidencia de ciclo TDD

Red de seguridad antes de tocar `analizarRespuestas.ts`: `npx vitest run apps/desk/server/encuesta` = 45 pruebas verdes (código 0).

| Tarea | Fichero de prueba | Capa | Red de seguridad | ROJO | VERDE | TRIANGULAR | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1.2 | (ninguno: sólo tipos) | — | N/A (nuevo) | sin rojo previo, lo exige el rojo de 1.4 | `tsc` verde (1.12) | ➖ omitida: sólo tipos, una única salida | ➖ |
| 1.3 | (lo ejercita la prueba de 1.4) | — | N/A (nuevo) | ídem | ídem | ➖ | ➖ |
| 1.4 | `leerExportacion.test.ts` | Unitaria | N/A (nuevo) | 14 pruebas rojas por la aserción | 28/28 | 2 a 4 casos por escenario (ver abajo) | limpio |
| 1.5 | ídem | Unitaria | N/A | 7 pruebas rojas por la aserción | 28/28 | ídem | limpio |
| 1.6 | ídem | Unitaria | N/A | 2 rojas por `TypeError` (ver nota) y 1 por la aserción de importaciones | 28/28 | ➖ guardianes: una sola salida | limpio |
| 1.8 | `analizarRespuestas.test.ts` | Unitaria | 45/45 | el rojo del contrato de `leerRegistros` | 45/45 + 28/28 | ➖ cambio de una palabra | ➖ |
| 1.9 | `leerExportacion.test.ts` | Unitaria | N/A | idem 1.4 a 1.6 | 28/28 | ver mutaciones | rama defensiva añadida con su prueba (abajo) |

**Cómo se vio el rojo (1.7).** El módulo `leerExportacion.ts` no existía, así que se creó el esqueleto mínimo: las constantes
(`COLUMNAS_INDICADOR`, `ERRORES_EXPORTACION`, `MOTIVOS_EXPORTACION`, tipos) y una `leerExportacion` que devuelve
`{ ok: false, error: '' }`. Resultado: `Tests 24 failed | 4 passed (28)`. Los fallos son de aserción: «se esperaba una lectura y
falló» (el protector `leida`) o `expected { ok: false, error: '' } to deeply equal { ok: false, … }`. **Dos** rojos no son de
aserción sino `TypeError ... is not a function` y es lo esperado: `leerRegistros` aún no se exportaba (línea 54) y
`normalizarNombreZoho` aún no existía en `shared`. Pasaron en rojo **cuatro** pruebas, con motivo: las dos guardianas de
listas (comparan constantes que el esqueleto ya traía), la «no hay otra forma de importar…» (el esqueleto no importa nada) y
«las 47 columnas restantes no salen» (con el esqueleto no sale nada: pasa en vacío). Su poder de detección se comprobó
después con las mutaciones M17a y M17b del lector (abajo), que la ponen roja.

**Rama añadida después del primer verde.** `posCabecera === -1` (un fichero como `""` + `,,` no es «sólo blancos» por `trim`
pero no tiene ningún registro con contenido) se añadió con su prueba dentro de «fichero vacío». Comprobado: quitada la rama, esa
prueba cae con `Cannot read properties of undefined (reading 'map')`; restaurada, verde.

### Mutaciones del lote (1.11)

Cada una se ejecutó de verdad: editar, correr `leerExportacion.test.ts`, ver el rojo, restaurar desde copia y confirmar verde (28/28 al final de cada serie; `cmp` de los tres ficheros mutables contra su copia, idénticos).

| Mutación | Qué se mutó | Resultado |
|---|---|---|
| M7a | `idRepetido` antes que `idNoDigitos` en la cadena de motivos | **SOBREVIVE, equivalente.** El conjunto de IDs vistos sólo recibe IDs ya válidos, así que un «ID» con caracteres no puede estar «visto»: el orden de esas dos ramas no es observable. Se declara equivalente; no se toca el diseño |
| M7b | `sinFilas` antes que `faltan` | ROJA: «orden de los errores de fichero» |
| M7c | `repetida` antes que `faltan` | ROJA: «orden de los errores de fichero» |
| M7d | `binario` después de `faltan` | ROJAS: «fichero con un NUL…» y «orden de los errores de fichero» |
| M8a | `csvMuestra` ignora `quitar` (el fixture no pierde la columna) | ROJAS: «falta una columna», «faltan dos», «orden de los errores» |
| M8b | `quitar` sin su primer elemento | ROJAS: las mismas tres |
| M8c | `csvMuestra` ignora `renombrar` | ROJA: «columna renombrada: … no adivina por parecido» |
| M9a | quitar la rama `idVacio` | ROJA: «`ID` vacío…» |
| M9b | aceptar «ID» con caracteres/científico | ROJAS: «ID en notación científica…» y «una fila rechazada… no citan ninguna celda» |
| M9c | aceptar «ID» repetido | ROJA: «ID repetido…» |
| M9d | «ID» visto sin recortar | ROJA: «ID repetido…» (el caso con espacios) |
| M10a | los ilegibles no se cuentan | ROJAS: «valor no numérico…» y «no citan ninguna celda» |
| M10b | el listado de ilegibles repite la celda | ROJAS: las mismas dos |
| M10c | un ilegible además rechaza la fila | **Primero sobrevivía en la prueba de «abc»/«2.5»** (sólo caía la de «no citan»). Se añadió `expect(l.rechazadas).toEqual([])` a esa prueba y ahora caen las dos |
| M12a | `NOMBRES_ZOHO`: «Tiempo de diagnóstico» pasa a «… del equipo» | ROJAS (5): el guardián «las diez cabeceras… las acepta valorDeZoho» y cuatro de lectura |
| M12b | `COLUMNAS_INDICADOR`: una cabecera renombrada | ROJAS (20), entre ellas el guardián |
| M12c | `CABECERA_MUESTRA`: una cabecera cambiada | ROJAS (21), entre ellas «la primera línea de `Tickets.csv` es `CABECERA_MUESTRA`» y el guardián de las listas |
| M12d | `COLUMNAS_INDICADOR`: una columna de indicador cambiada (57 a 58) | ROJAS (5), entre ellas el guardián |
| M20 | detector de ilegibles con expresión propia que acepta decimales (`/^-?[\d.]+$/`) | ROJA: «valor no numérico…» (el «2.5» deja de contarse) |

**M17 a nivel del lector** (hecha además de las pedidas; la M17 de la ruta es del lote 3): M17a, el lector deja salir todas las celdas en `campos`: ROJAS (3), entre ellas «las 47 columnas restantes no salen» y «`campos` trae exactamente las diez claves». M17b, el motivo de una fila rechazada interpola las celdas: ROJAS (5), entre ellas «no citan ninguna celda» y «las 47 columnas restantes no salen». Restaurado: 28/28.

### Códigos de salida (1.12), cada uno mirado con `echo $?` justo después, sin tuberías

| Orden | Código | Recuento |
|---|---|---|
| `npm test` | **0** | `Test Files 272 passed | 3 skipped (275)`; `Tests 4573 passed | 11 skipped (4584)` |
| `npm run typecheck` | **0** | `tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit` sin salida de error |
| `npm run lint` | **0** | `165 problems (0 errors, 165 warnings)`: **el mismo número** que la referencia; ninguno es de ficheros nuevos |

### Medida (1.13)

Contra el commit de partida `b523352`, con `git diff --shortstat --no-renames` y `wc -l` de lo nuevo sin trackear:

| Parte | Líneas |
|---|---|
| `git diff --shortstat --no-renames b523352` (4 ficheros: `analizarRespuestas.ts`, `index.ts`, `indicadores.ts`, `tasks.md`) | 18 inserciones + 15 borrados = **33** |
| `leerExportacion.test.ts` (nuevo) | 218 |
| `leerExportacion.ts` (nuevo) | 85 |
| `exportacionZoho.ts` (nuevo) | 49 |
| `indicadoresExportacion.ts` (nuevo) | 28 |
| `apply-progress.md` (nuevo; con esta tabla) | ~155 |
| **Total aproximado** | **~568**, por debajo de la válvula de 720 y a ~230 del techo de 800. Ficheros binarios: ninguno |

Los 33 de los tracked son 5 de código (+4 −1: la línea 54, las 2 de `indicadores.ts`, la de `index.ts`) y 28 de las casillas de `tasks.md` (14 líneas cambiadas). El
orquestador debe repetir la medida al cerrar el intento: `apply-progress.md` y `tasks.md` pueden variar unas líneas tras su propio asentado.

### Barrido de citas (1.14, regla de mutación 4)

Comandos: `grep -rnoE "[A-Za-z0-9_/.-]*<fichero>:[0-9]+(-[0-9]+)?"` sobre todo el worktree (sin `node_modules`, `.git`, `.codegraph`, `dist`) y se excluyó
la carpeta de este cambio. Lo que cada edición hizo, medido con `git diff -U0`: `analizarRespuestas.ts` `@@ -54 +54 @@` (una sola
línea cambia, ninguna se mueve); `indicadores.ts` `@@ -262,0 +263,2 @@` (sólo añade al final); `index.ts` `@@ -43,0 +44 @@` (sólo
añade al final).

- **`analizarRespuestas.ts`: 14 citas, todas leídas.** Ninguna toca la línea 54. `Paquete_de_Despliegue_2026-10-08.md:38` y `Paquete_de_Despliegue_2026-10-09.md:819` citan `:1-2`
  (cabecera y primera importación: sin cambio); `Paquete_de_Despliegue_2026-10-08.md:61` cita `:146` (sin cambio); las once de `openspec/changes/archive/2026-10-07-indicadores-51-55/`
  (`apply-progress.md:269,367,390` y `tasks.md:205` a `:173-179`; `verify-report.md:43` `:175`, `:44` `:140`, `:55` `:144-147`, `:79` `:173-179`, `:124` `:173`, `:143` `:147`, `:161` `:104`)
  caen en líneas 104 a 179, todas posteriores a la 54 y de contenido y posición intactos. Veredicto: **ninguna afectada**.
- **`packages/shared/src/indicadores.ts`: 70 citas con la ruta completa, más 6 abreviadas** (`indicadores.ts:NNN` sin ruta, todas en
  `openspec/changes/archive/2026-10-07-indicadores-51-55/{tasks.md:77,verify-report.md:167}`, de las líneas 76, 85, 88-89, 228-232 y 254). Ninguna tiene un extremo por encima de 262 y el fichero
  sólo creció por el final: todas siguen diciendo lo que decían. El resto de los 149 resultados del patrón son de
  `apps/desk/server/indicadores.ts` (54) y `apps/desk/server/routes/indicadores.ts` (19), otros ficheros, no editados.
- **`packages/shared/src/index.ts`: 30 citas con ruta completa y 1 con `shared/src/index.ts`**: ninguna por encima de la línea 43. Las demás
  coincidencias del patrón `index.ts:NNN` (117 de `apps/desk/server/index.ts` y 74 abreviadas) son de otros ficheros; las abreviadas con número mayor de 43 se leyeron una a una
  (`openspec/specs/transitions-st/spec.md:1452`, `openspec/specs/zoho-sync/spec.md:753`, `…/2026-09-28-parche-iv11-orden-venta/{apply-progress.md:42,design.md:21}`, `…/2026-09-29-registro-contrato/{apply-progress.md:19,299,design.md:163}`,
  la línea 53 del `apply-progress.md` archivado de `tiempo-en-tarjeta-remision-creada`): todas son del `index.ts` del servidor o de `zoho-sync` (el `setInterval`), no del de `shared`.
- **Segundo pase (abreviadas `:54`)**: en los ficheros que citan `analizarRespuestas.ts` no hay ninguna `:54` o rango con 54 que sea de ese módulo (las coincidencias son de `avisosWebhook.ts`, `eliminarTicket.ts`, `admin.ts` y otros).
- **Citas de ficheros que no se pueden editar aquí** (`docs/sdd/ENTRADA.md`, `openspec/config.yaml`, `CLAUDE.md`, `docs/sdd/F0-05_*`, `docs/sdd/R08.4_Expediente_de_cambios.md`): ninguna queda afectada por este lote; no hay nada que listar para Supervisión.

### Hipótesis del diseño resueltas en este lote

- **Hipótesis 1 (`Tickets.csv` versionado y su cabecera):** `git ls-files docs/analisis-tickets/Tickets.csv` lo lista; el guardián lee sólo los primeros 4.096 bytes y compara la línea 1 con `CABECERA_MUESTRA.join(',')` (59 cabeceras, sin comillas, `Tiempo permanecía` con tilde, `Cumplimiento del tiempo  promesa` con dos espacios): **verde**. Ninguna fila ni dato de contacto se leyó ni se copió.
- Las hipótesis 2 a 9 del diseño no son de este lote.

### Desviaciones y dudas (el diseño manda; ninguna cambia fórmula, orden ni los ficheros citados)

1. **«Fila» cuenta registros incluidos los en blanco intermedios.** El diseño dice «ordinal del registro» y «un registro con todos los campos vacíos no cuenta». Se tomó: `fila` = posición del registro en el fichero (la cabecera es la 1, si va primera), de modo que coincida con la numeración de una hoja de cálculo; un registro en blanco no suma a `leidas` pero sí ocupa su ordinal. Fijado por la prueba «el número de fila es el ordinal del registro». Si Supervisión prefiere que los blancos no consuman ordinal, es un cambio de una línea y de una aserción.
2. **Rama extra `posCabecera === -1`** (fichero sin ningún registro con contenido, por ejemplo `""` y comas): error `vacio`. No estaba en el diseño; con su prueba y su comprobación de rojo.
3. **El lector no importa `NOMBRES_ZOHO`** (el diseño D1 lo nombraba entre las importaciones). No lo usa; sólo lo usa la prueba guardiana. La prueba de pureza fija las importaciones permitidas (`valorDeZoho`, `normalizarNombreZoho` y tres tipos).
4. **M7a equivalente** (arriba): el orden `idRepetido`/`idNoDigitos` no es observable porque sólo se recuerdan IDs válidos. El diseño pedía mutarlo; se declara superviviente por equivalencia.
5. **`\uFEFF` en el código fuente:** al escribir los ficheros, la secuencia de escape `\uFEFF` se convirtió en un carácter BOM real (dos veces, en ficheros distintos), y un `sed` posterior lo agravó. Se dejó sin ningún BOM literal ni escape: el lector usa `String.fromCharCode(0xfeff)` y el fixture emite los tres bytes `EF BB BF` con `Buffer`. Aviso para los lotes siguientes: no escribir `\uFEFF` en el código; usar esa forma.
6. **Aviso de fin de línea:** `git` avisa «LF will be replaced by CRLF» (índice LF, árbol CRLF por `autocrlf`); es el comportamiento del repositorio, no un cambio.
7. Las pruebas del lector comprueban `Tickets.csv` leyendo 4.096 bytes (no el fichero entero): sigue sin leerse ninguna fila de datos.

### Ficheros del lote

Modificados (en sitio o al final): `apps/desk/server/encuesta/analizarRespuestas.ts` (línea 54), `packages/shared/src/indicadores.ts` (+2 al final), `packages/shared/src/index.ts` (+1 al final), `openspec/changes/comparacion-exportacion-zoho/tasks.md` (casillas).
Nuevos: `packages/shared/src/indicadoresExportacion.ts`, `apps/desk/server/testing/exportacionZoho.ts`, `apps/desk/server/comparacion/leerExportacion.ts`, `apps/desk/server/comparacion/leerExportacion.test.ts`, este `apply-progress.md`.

### Resumen de pruebas

- Pruebas nuevas: **28** (todas en `leerExportacion.test.ts`; unitarias; 0 de integración; 1 lee la primera línea de un fichero del repositorio).
- Pruebas verdes del fichero: 28/28; con la encuesta: 73/73; suite completa: 4573 verdes, 11 omitidas.
- Funciones puras nuevas: `leerExportacion`, `filaMuestra`, `csvMuestra` (esta última sólo de prueba).

---

## Lote 2 · Cruce y consulta por ID (tareas 2.1 a 2.11; la 2.12 es del orquestador)

Commit de partida del lote: `49a13fe` (el `HEAD` de la rama al empezar).

### Estado de las tareas

| Tarea | Estado | Nota |
|---|---|---|
| 2.1 | hecha | Partida `49a13fe`; el intento lo abrió el orquestador |
| 2.2 | hecha | `apps/desk/server/comparacion/cruzarExportacion.test.ts`: 19 pruebas (RQ-KP-24 y RQ-KP-25) |
| 2.3 | hecha | `apps/desk/server/db/ticketsPorId.test.ts`: 6 pruebas con pg-mem y `migrate`, hipótesis 5 incluida |
| 2.4 | hecha | Rojo mirado (abajo) |
| 2.5 | hecha | `apps/desk/server/comparacion/cruzarExportacion.ts` (41 líneas) |
| 2.6 | hecha | `apps/desk/server/db/ticketsPorId.ts` (19 líneas); la hipótesis 5 se cumple, sin respaldo |
| 2.7 | hecha | 25 pruebas verdes en los dos ficheros |
| 2.8 | hecha | M11, M13, M14 y M15 ejecutadas, más tres mutaciones de la consulta (abajo); ninguna sobrevive |
| 2.9 | hecha | Los tres códigos, abajo |
| 2.10 | hecha | Medida, abajo |
| 2.11 | hecha | Sólo ficheros nuevos; `git status` lo confirma |
| 2.12 | **no es de este agente** | Commit, detector de citas y asentado son del orquestador |

### Evidencia de ciclo TDD

- **Rojo (2.4).** Las dos pruebas se escribieron antes que el código. Para que el rojo fuera de aserción y no de importación se crearon
  antes dos esqueletos que compilan y devuelven vacío (`cruzarExportacion` y `repartirSinCruzar` con listas vacías; `numerosDeTickets` con
  un mapa vacío). Resultado: 20 de 25 pruebas rojas, todas por aserción (`expected [] to deeply equal [ '111' ]`, `expected [] to have a length of 1 but got +0`,
  `expected { camposZoho: {} } to deeply equal …`); las 5 verdes eran las de «vacío en los dos lados» y la de no mutar la entrada, que un esqueleto vacío cumple por construcción.
- **Verde (2.7).** Con la implementación real: 25/25. Con el lote 1 (`apps/desk/server/comparacion` más `ticketsPorId.test.ts`): 53/53.

### Hipótesis 5 del diseño — resuelta

`id IN ($1,…)` sobre la clave de texto `tickets.id` **funciona en pg-mem**, con ID de 18 dígitos, sin respaldo: la prueba «hipótesis 5» guarda
`123456789012345678` y `123456789012345679` y pide el primero. Se probó a propósito el reverso (mutación Mz): con `id = ANY (…)` caen 5 de las 6 pruebas
de la consulta, así que el uso de `IN` está fijado por pruebas. El texto de la sentencia no contiene ningún ID (parámetros ligados) y es un único `SELECT`.

### Mutaciones del lote (cada una ejecutada de verdad: editar, correr, mirar rojo, revertir)

Cada mutación se aplicó con un script que sustituye el texto, corre `apps/desk/server/comparacion` y `apps/desk/server/db/ticketsPorId.test.ts`, y restaura el fichero original.

| # | Mutación | Resultado |
|---|---|---|
| M11a | no listar `numeroDistinto` (condición `false`) | ROJAS (3): «número distinto…», «número del fichero ilegible…», «orden de delPeriodo» |
| M11b | descartar el par cuando el número difiere (`continue` antes de `cruzados.push`) | ROJAS (3): las mismas |
| M13a-1 | indexar las filas por número en vez de por «ID» | ROJAS (8) |
| M13a-2 | buscar la fila por el número del ticket | ROJAS (8) |
| M13a-3 | calcular `sinCruzar` contra los números del periodo | ROJAS (2): «cruce por ID» y «sólo en el fichero» |
| M13b | el lector acepta una clave no numérica (rama `idNoDigitos` anulada) | ROJAS (2): «ID en notación científica…» y «no citan ninguna celda» (del lote 1) |
| M14a | vaciar `soloEnDesk` | ROJAS (4) |
| M14b | vaciar `sinCruzar` (el «sólo en el fichero») | ROJAS (5) |
| M14c | fundir «fuera del periodo» con «sólo en el fichero» (todo a `soloEnFichero`) | ROJAS (2) |
| M14d | el reverso: todo a «fuera del periodo» | ROJAS (2) |
| M15 | `camposZoho: { ...t.camposZoho, ...f.campos }` | ROJA (1): «camposZoho es la bolsa de la fila y NO conserva ninguna clave sincronizada» |
| Mx | `numerosDeTickets` ignora `trozo` | ROJA (1): «con trozo = 2 parte en bloques» |
| My | `numerosDeTickets` sin quitar ID repetidos | ROJA (1): «los ID repetidos no repiten parámetros» |
| Mz | `= ANY` en vez de `IN` | ROJAS (5), ver hipótesis 5 |

Ninguna sobrevive; no hay equivalentes declarados en este lote. Tras restaurar, las 53 pruebas siguen verdes.

### Códigos de salida (2.9), cada uno con `echo $?` justo después, salida a fichero y sin tuberías

| Orden | Código | Recuento |
|---|---|---|
| `npm test` | **0** | `Test Files 274 passed | 3 skipped (277)`; `Tests 4598 passed | 11 skipped (4609)` (lote 1: 4573; +25 de este lote) |
| `npm run typecheck` | **0** | sin errores |
| `npm run lint` | **0** | `165 problems (0 errors, 165 warnings)`: el mismo número que la referencia; ninguno es de ficheros nuevos |

### Medida (2.10)

Contra la partida `49a13fe`. Ficheros binarios: ninguno.

| Parte | Líneas |
|---|---|
| `git diff --shortstat --no-renames 49a13fe` (`tasks.md` 11+11 y esta sección 108+0) | 119 inserciones + 11 borrados = **130** |
| `cruzarExportacion.ts` (nuevo) | 41 |
| `cruzarExportacion.test.ts` (nuevo) | 134 |
| `ticketsPorId.ts` (nuevo) | 19 |
| `ticketsPorId.test.ts` (nuevo) | 66 |
| **Total aproximado** | **390**, por debajo de la válvula de 720 y a ~420 del techo de 800 |

El orquestador debe repetir la medida al cerrar el intento: `apply-progress.md` y `tasks.md` pueden variar unas líneas tras su propio asentado.

### Barrido de citas (2.11)

El lote sólo crea ficheros nuevos y toca `tasks.md` y este `apply-progress.md` (dentro de su propia carpeta de cambio). Ningún fichero existente con citas
vivas cambió de línea: `git status --short` sólo lista cuatro ficheros nuevos sin trackear más los dos `.md` de este cambio. Las citas de este apartado
son prosa; no se escribió ninguna `ruta:línea` nueva.

### Desviaciones y dudas

1. **Esqueletos para el rojo.** Antes de implementar se dejaron dos esqueletos vacíos (ver «Rojo»); se reemplazaron por la implementación en el mismo lote. No quedan restos.
2. **`sinCruzar` se calcula contra los «ID» del periodo, no contra los cruzados.** Equivale (todo cruzado es del periodo) y evita una segunda pasada; lo fijan las mutaciones M13a-3 y M14b.
3. **`numeroDistinto` sigue el orden de `delPeriodo`** (el de los cruzados); el diseño sólo fija ese orden para `delPeriodo`, y se eligió el de los cruzados para que coincida con la tabla de pares.
4. **`numerosDeTickets` quita los ID repetidos** antes de partir en bloques (el diseño no lo decía; el lector ya rechaza repetidos, pero la función es general). Cubierto por la mutación My.
5. Ninguna duda abierta que bloquee el lote 3.

### Ficheros del lote 2

Nuevos: `apps/desk/server/comparacion/cruzarExportacion.ts`, `apps/desk/server/comparacion/cruzarExportacion.test.ts`, `apps/desk/server/db/ticketsPorId.ts`, `apps/desk/server/db/ticketsPorId.test.ts`.
Modificados: `openspec/changes/comparacion-exportacion-zoho/tasks.md` (casillas 2.1 a 2.11) y este `apply-progress.md`.

### Resumen de pruebas del lote 2

- Pruebas nuevas: **25** (19 unitarias del cruce, 6 de integración con pg-mem de la consulta).
- Suite completa: 4598 verdes, 11 omitidas.

---

## Lote 3 · Ruta de comparación (tareas 3.1 a 3.15; la 3.16 es del orquestador)

Commit de partida del lote: `4984aee`. `wc -l` de partida: `apps/desk/server/app.ts` **96**, `apps/desk/server/testing/appHarness.ts` **117**.

### Estado de las tareas

| Tarea | Estado | Nota |
|---|---|---|
| 3.1 | hecha | Partida `4984aee`; el intento lo abrió el orquestador. Moldes leídos: `apps/desk/server/routes/encuestaRespuestas.ts` y su prueba |
| 3.2 | hecha | `estadoDePostGrande(app, ruta, cookie, bytes)` al FINAL de `apps/desk/server/testing/appHarness.ts` (117 a 141 líneas); el `import` de `node:http` es dinámico dentro de la función para no tocar la cabecera del fichero |
| 3.3 a 3.5 | hechas | `apps/desk/server/routes/indicadoresComparacion.test.ts`: 34 pruebas (cuerpo 8, escalera y posición 23, escenario nuevo de RQ-KP-14/-17 1, privacidad 3; los `it.each` cuentan por caso) |
| 3.6 | hecha | Rojo mirado (abajo) |
| 3.7 | hecha | `apps/desk/server/routes/indicadoresComparacion.ts` (51 líneas) |
| 3.8 | hecha | `apps/desk/server/app.ts`: la línea 22 gana el `import` y la 61 el registro, ambos al final de la línea; sigue en **96** líneas |
| 3.9 | hecha | 34/34; con `apps/desk/server/routes`, `apps/desk/server/indicadores.test.ts`, `apps/desk/server/comparacion` y `apps/desk/server/db/ticketsPorId.test.ts`: **409 pruebas verdes** (el `GET` no se editó y sigue verde) |
| 3.10 | hecha | Líneas reales, abajo |
| 3.11 | hecha | M1 a M6 y M16 a M19 ejecutadas una a una (abajo); ninguna sobrevive |
| 3.12 | hecha | `app.ts` 96 = 96; `appHarness.ts` 117 a 141, sólo crece al final (`git diff -U0`: un único bloque que añade 24 líneas tras la 117) |
| 3.13 | hecha | Los tres códigos, abajo |
| 3.14 | hecha | Medida, abajo |
| 3.15 | hecha | Barrido, abajo |
| 3.16 | **no es de este agente** | Commit, detector de citas y asentado son del orquestador |

### Evidencia de ciclo TDD

| Tarea | Fichero de prueba | Capa | Red de seguridad | ROJO | VERDE | TRIANGULAR | REFACTOR |
|---|---|---|---|---|---|---|---|
| 3.2 | (lo ejercita 3.4) | — | N/A (añadido al final) | sin rojo propio (lo exige el rojo de 3.4) | 34/34 | ➖ un único camino | ➖ |
| 3.3 a 3.5 | `apps/desk/server/routes/indicadoresComparacion.test.ts` | Integración (supertest, pg-mem, espía de `Queryable`) | `app.ts` y las rutas existentes: la suite de 3.9 sin la prueba nueva estaba verde antes de registrar la ruta | 33 de 34 rojas | 34/34 | de 2 a 5 casos por escenario (ver abajo) | limpio |
| 3.7, 3.8 | ídem | ídem | ídem | ídem | 34/34 y 409/409 | ver mutaciones | un comentario de la ruta se reescribió porque la prueba de pureza prohíbe la palabra de la consola en el fuente |

**Cómo se vio el rojo (3.6).** Antes de la prueba se creó un esqueleto mínimo de la ruta (la constante `MENSAJE_SIN_EXPORTACION` y un registro vacío que no registra nada) para que el rojo fuera de aserción y no de importación; `app.ts` aún no se tocaba. Resultado: `Tests 33 failed | 1 passed (34)`. Los fallos son `AssertionError: expected 404 to be 200` (6), `to be 400` (5), `to be 401` (3), `to be 403` (2) y `to be 500` (1), más 3 `TypeError ... reading 'porColumna'` (el cuerpo de un `404` no trae `comparacion`: consecuencia de la misma causa) y 1 `ECONNRESET` (el `404` no lee el cuerpo de más de 10 MB; también consecuencia). Pasó en rojo UNA prueba, con motivo: «una columna de contacto no sale aunque se pida» (con un `404` no sale ninguna clave); su poder de detección se comprobó con M17d, que la pone roja.

**Triangulación.** Los `it.each` de 401 (4 casos más sin fichero y sobre el límite), 403 (4 casos más sobre el límite) y 400 del lector (cero bytes, NUL, cabecera sin filas, columna repetida), los dos casos de «periodo inválido ↔ fichero», los dos del 54 («  Cumple  » coincide, «no cumple» difiere) y la tolerancia (1 día coincide, 3 días no) fuerzan la lógica real.

### Hipótesis del diseño

- **Hipótesis 3** (el corte de conexión de supertest con más de 10 MB para `401` y `403`): no se comprobó si supertest corta aquí; se usó `estadoDePostGrande` para esos dos casos por precaución, como en la encuesta. Con administrador, supertest sí entrega el `413` (prueba verde), como predecía la hipótesis.
- **Hipótesis 4** (fichero de cero bytes): se cumple lo que la prueba afirma, un `400` con `error` de texto y ninguna consulta de tickets. Qué mensaje da (`vacio` o `MENSAJE_SIN_EXPORTACION`) no se determinó; la prueba no lo fija, a propósito.
- **Hipótesis 6** (espiar el registro): CONFIRMADA. `vi.spyOn(logger, 'error')` captura lo que el manejador central le pasa: la prueba del `500` exige que lo capturado contenga «fallo simulado de lectura».
- **Hallazgo nuevo:** un fichero de EXACTAMENTE `LIMITE_SUBIDA_BYTES` bytes también da `413` (multer marca el límite al alcanzarlo, no al superarlo); uno de `LIMITE_SUBIDA_BYTES - 1` pasa a la ruta. La prueba fija el segundo caso y el valor del límite (10 MB). No afecta al diseño; se anota por si «supera el límite» se lee como «mayor que».

### Líneas reales de la ruta (3.10, leídas del fichero ya escrito)

Todas en `apps/desk/server/routes/indicadoresComparacion.ts` salvo las de otros ficheros, que se nombran.

| Paso de D3 | Dónde |
|---|---|
| 1 · `requireAuth` (`401`) | `apps/desk/server/routes/indicadoresComparacion.ts:25`, primer middleware; el `401` lo emiten `apps/desk/server/auth/middleware.ts:17` (sin cookie) y `apps/desk/server/auth/middleware.ts:19` (sesión inválida) |
| 2 · `requireAdmin` (`403`) | `apps/desk/server/routes/indicadoresComparacion.ts:25`, segundo middleware; lo emite `apps/desk/server/auth/middleware.ts:27` |
| 3 · multer `single('file')` | `apps/desk/server/routes/indicadoresComparacion.ts:25`, tercer middleware (límite en `apps/desk/server/util/subida.ts:6`); el `413` lo emite `apps/desk/server/app.ts:86` y el `400` de campo `apps/desk/server/app.ts:88` |
| 4 · `validarPeriodo` (`400`) | `apps/desk/server/routes/indicadoresComparacion.ts:27` la llamada y `apps/desk/server/routes/indicadoresComparacion.ts:28` el `400` |
| 5 · `!req.file` (`400`, `MENSAJE_SIN_EXPORTACION`) | `apps/desk/server/routes/indicadoresComparacion.ts:29` |
| 6 · lector (`400`) | `apps/desk/server/routes/indicadoresComparacion.ts:30` la llamada y `apps/desk/server/routes/indicadoresComparacion.ts:31` el `400` |
| 7 · primera consulta de tickets | `apps/desk/server/routes/indicadoresComparacion.ts:33` (`leerEntradasIndicadores`) |

Los tres middlewares comparten la línea 25, así que el ORDEN entre ellos lo fijan las pruebas de posición (M1 a M3), no la numeración. Alimentan el 5.4 (pasos 4 a 6 de D5).

### Mutaciones del lote (3.11)

Cada una se aplicó con un script que sustituye el texto, corre `apps/desk/server/routes/indicadoresComparacion.test.ts` (34 pruebas) y restaura el fichero; al final `cmp` de la ruta y del lector contra su copia: idénticos.

| # | Mutación | Resultado |
|---|---|---|
| M1 | multer delante de `requireAdmin` | ROJAS (2): 403 ↔ «intruso» y 403 ↔ límite |
| M2 | multer delante de `requireAuth` | ROJAS (4): 401 ↔ «intruso», 401 ↔ límite, 403 ↔ «intruso», 403 ↔ límite |
| M3 | `requireAdmin` delante de `requireAuth` | ROJAS (29): sin `req.user` nadie es administrador, así que casi todo da `403` |
| M4 | `!req.file` delante de `validarPeriodo` | ROJA (1): periodo inválido sin fichero |
| M5 | `leerExportacion` delante de `validarPeriodo` | ROJA (1): periodo inválido con fichero sin «ID» |
| M6 | consulta de tickets delante de `leerExportacion` | ROJAS (7): los cinco casos «400 del lector ↔ consultas» y los dos de recuento de consultas |
| M16 | pasar a la comparación los ausentes del fichero (`tickets: entradas.tickets`) | ROJAS (7), entre ellas la de los invariantes `comparados + sinComparar = cruzados` |
| M17a | la lista de ilegibles devuelve la celda | ROJAS (2): «2.5» y centinela |
| M17b | (lector) el motivo de la fila rechazada interpola la celda | ROJAS (3), entre ellas el centinela |
| M17c | `fichero.filas` con las filas del lector | ROJAS (4), entre ellas el centinela |
| M17d | (lector y ruta) una columna de contacto entra en `campos` y sale en la respuesta | ROJAS (5), entre ellas «una columna de contacto no sale aunque se pida» |
| M18 | una sentencia `UPDATE` en la ruta | ROJA (1): «todo es lectura» |
| M19a | el valor de Zoho del 59 se lee con `Number` en vez de `valorDeZoho` | ROJA (1): «2.5» |
| M19b | `compararIndicadores(pares, 0)`: tolerancia cero, comparar a mano | ROJAS (2): tolerancia y los invariantes |

Ninguna sobrevive; no hay equivalentes declarados en este lote.

### Códigos de salida (3.13), cada uno con `echo $?` justo después, salida a fichero y sin tuberías

| Orden | Código | Recuento |
|---|---|---|
| `npm test` | **0** | `Test Files 275 passed | 3 skipped (278)`; `Tests 4632 passed | 11 skipped (4643)` (lote 2: 4598; +34 de este lote) |
| `npm run typecheck` | **0** | sin errores |
| `npm run lint` | **0** | `165 problems (0 errors, 165 warnings)`: el mismo número que la referencia; ninguno es de ficheros nuevos |

### Medida (3.14)

Contra la partida `4984aee`, con `git diff --shortstat --no-renames` y `wc -l` de lo nuevo sin trackear. Ficheros binarios: ninguno.

| Parte | Líneas |
|---|---|
| `git diff --shortstat --no-renames 4984aee` | 174 inserciones + 17 borrados = **191** (`app.ts` 2+2, `appHarness.ts` 24+0, `tasks.md` 15+15, esta sección 133+0) |
| `indicadoresComparacion.ts` (nuevo) | 51 |
| `indicadoresComparacion.test.ts` (nuevo) | 299 |
| **Total** | **541**, por debajo de la válvula de 720 y del techo de 800 |

El orquestador debe repetir la medida al cerrar el intento: `apply-progress.md` y `tasks.md` pueden variar unas líneas tras su propio asentado.

### Barrido de citas (3.15, regla de mutación 4)

`git diff -U0`: `app.ts` cambia sólo dos líneas, la 22 y la 61, por el final, y ninguna se mueve (el fichero sigue en 96 líneas); `appHarness.ts` sólo añade al final.

- **`apps/desk/server/app.ts`**: las citas completas a las líneas 22 y 61 (decenas, en `docs/sdd/Paquete_de_Despliegue_*.md` y en `openspec/changes/archive/*`) hablan de «la línea de los registros» o «de las importaciones»; siguen siendo esas líneas, con un registro más al final. **Veredicto: ninguna afectada** (posición y papel intactos). `DEPLOY.md:620` cita `apps/desk/server/app.ts:86` (el `413`) y `DEPLOY.md:691` y `docs/sdd/Paquete_de_Despliegue_2026-10-09.md:267` citan `apps/desk/server/app.ts:90-92` (el `500` interno): leídas contra el fichero, la 86 es el `res.status(413)` y la 90 a la 92 son el `logger.error` y el `500`. **Ninguna afectada.**
- **Segundo pase (abreviadas de las líneas 22 y 61)**: en los ficheros que citan `app.ts` aparecen sueltas las líneas 22 y 61 en los paquetes de despliegue de 29/09 a 01/10 y en archivados de `asociacion-ov-ticket`, `registro-contrato` y `prioridad-top5-cliente`, entre otros; todos se refieren a esas dos mismas líneas de `app.ts`. Misma conclusión: posición intacta. No se leyó una a una cada frase de los archivados; es lectura humana que el detector no cubre.
- **`apps/desk/server/testing/appHarness.ts`**: 70 citas con la ruta completa; la única zona con extremo en la línea 117 es la de las líneas 105 a 117 (función `emularMezclaJsonb`), citada en `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:357`, `openspec/changes/prueba-integracion-mezcla-jsonb/proposal.md:18` y `packages/zoho-sync/src/db/liberacion.integration.test.ts:16`: sigue acabando en la 117. **Ninguna afectada.**
- **Ficheros que no se pueden editar aquí** (`docs/sdd/ENTRADA.md`, `openspec/config.yaml`, `CLAUDE.md`, `docs/sdd/F0-05_*`, `docs/sdd/R08.4_Expediente_de_cambios.md`): ninguna queda afectada; nada que listar para Supervisión.

### Desviaciones y dudas

1. **Esqueleto para el rojo** (un registro vacío), reemplazado por la ruta real en el mismo lote.
2. **`import` dinámico de `node:http`** en el auxiliar del arnés (el diseño dice «al final del fichero»): evita insertar una línea en la cabecera de `appHarness.ts`, que tiene citas vivas.
3. **Una prueba de pureza lee el fuente** de la ruta, el lector, el cruce y `ticketsPorId.ts` y exige que no contengan `node:fs`, `from 'fs'` ni la palabra de la consola (RQ-KP-26 «sin fichero en disco», RQ-KP-27). Efecto: no se puede escribir esa palabra ni en un comentario de esos cuatro ficheros.
4. **Hallazgo del límite exacto** (arriba): `LIMITE_SUBIDA_BYTES` bytes ya son `413`.
5. **Las pruebas de «escalera» usan `it.each`**, así que el recuento de 34 cuenta los casos.
6. **M3 rompe 29 pruebas** y no las pocas que prevé el diseño; es lo esperado: sin `req.user` ningún administrador pasa.
7. Ninguna duda abierta que bloquee el lote 4.

### Ficheros del lote 3

Nuevos: `apps/desk/server/routes/indicadoresComparacion.ts`, `apps/desk/server/routes/indicadoresComparacion.test.ts`.
Modificados: `apps/desk/server/app.ts` (líneas 22 y 61, por el final), `apps/desk/server/testing/appHarness.ts` (+24 al final), `openspec/changes/comparacion-exportacion-zoho/tasks.md` (casillas 3.1 a 3.15) y este `apply-progress.md`.

### Resumen de pruebas del lote 3

- Pruebas nuevas: **34** (todas de integración con supertest y pg-mem; una de ellas lee además el fuente de cuatro módulos).
- Suite completa: 4632 verdes, 11 omitidas.
