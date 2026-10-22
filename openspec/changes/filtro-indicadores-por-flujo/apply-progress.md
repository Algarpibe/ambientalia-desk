# apply-progress — filtro-indicadores-por-flujo (F1F-05, `cierra: no`) · lote L1a

Base del lote: `9caba837`. Worktree `C:\dev\Desk_2_R1.023-worktrees\filtro-indicadores-por-flujo`. Modo: Strict TDD. Sin commit.
Tareas hechas: L1a.1 a L1a.16 (la L1a.c es del orquestador). Todo en el árbol de trabajo, sin tocar lo prohibido por el encargo.

## Línea base (L1a.1)
- `npm test` antes de tocar nada: 5325 pasan, 1 falla (`guardián · D10 … MUT (regla de mutación 2, repositorio sintético SIN la línea)`, 6483 ms) y 2 `Unhandled Errors`
  (`Timeout calling "onTaskUpdate"`, de infraestructura de vitest). El fallo es un tiempo agotado bajo carga: el mismo fichero
  (`apps/desk/server/citas/guardianes.test.ts`) pasa 17/17 en solitario (1482 ms esa prueba). No es de este cambio; no se tocó.
- `npm run typecheck`: 0. `npm run lint`: 165 avisos, 0 errores (techo 165, sin holgura).

## TDD Cycle Evidence
| Tarea | Fichero de prueba | Capa | Red de seguridad | ROJO | VERDE | TRIANGULAR | REFACTOR |
|---|---|---|---|---|---|---|---|
| L1a.2 | `routes/indicadores.test.ts`, `routes/indicadoresComparacion.test.ts` | Integración (pg-mem) | 29/29 y 36/36 | Verde a propósito | 3 sha256 literales, estables en 2 pasadas | json, csv y POST | n/a |
| L1a.3-4 | `packages/shared/src/flujos.test.ts` | Unitaria | 54/54 | 12 rojas | 66/66 | 8 clasificaciones + tabla de 26 × 3 | n/a |
| L1a.5-6 | `server/indicadores.test.ts` | Unitaria + integración | 25/25 | 19 rojas | 44/44 | 3 flujos, 6 valores malos, 2 y 20 tickets | n/a |
| L1a.7-8 | `routes/indicadores.test.ts` | Integración (ruta) | 29/29 | 11 rojas | 81/81 con las dos rutas | json, csv, 5 valores malos, orden de guardas | n/a |

## ROJOS (salida de vitest copiada)
### L1a.3 (símbolos inexistentes en `flujos.ts`)
    × FLUJOS y NOMBRE_FLUJO (D2): la lista sale del registro, sin tercera lista > FLUJOS son las claves de CATALOGO_POR_FLUJO, en su orden
    → expected undefined to deeply equal [ 'servicio', 'equipo-nuevo', …(1) ]
    × FLUJOS y NOMBRE_FLUJO (D2): la lista sale del registro, sin tercera lista > NOMBRE_FLUJO sale exportado con un nombre por flujo
    → expected undefined to deeply equal { servicio: 'servicio técnico', …(2) }
    × flujoPorClasificacion (RQ-KP-30, D1, M12): sólo la clasificación, sin estado > «soporte REMOTO» → soporte-remoto
    → (0 , flujoPorClasificacion) is not a function
    Tests  12 failed | 54 passed (66)
### L1a.5 (`validarFlujo`, `recortarPorFlujo`, `clasificaciones` inexistentes)
    × validarFlujo (RQ-KP-29, D3) > sin parámetro: vale y no filtra (flujo null)
    → (0 , validarFlujo) is not a function
    × validarFlujo (RQ-KP-29, D3) > MENSAJE_FLUJO nombra el parámetro «flujo» y cada flujo de FLUJOS
    → the given combination of arguments (undefined and string) is invalid for this assertion. You can use an array, a map, an object, a set, a string, or a weakset instead of a string
    × la clasificación en la lectura (D4, RQ-KP-31): la misma consulta, cuatro en total > M10 · con 2 tickets son EXACTAMENTE cuatro consultas, también con clasificaciones
    → Cannot read properties of undefined (reading 'size')
    × recortarPorFlujo (D5, M1, M2, M6, M12) > M2 · sin flujo devuelve LA MISMA entrada, no una copia
    → (0 , recortarPorFlujo) is not a function
    Tests  19 failed | 25 passed (44)
### L1a.7 (la ruta aún no valida ni recorta)
    × RQ-KP-31 · el recorte del GET por flujo > El recorte filtra: flujo=equipo-nuevo sobre los tres flujos trae sólo los suyos y la clave `flujo` tras `periodo`
    → expected [ 'periodo', 'tickets', 'comparacion' ] to deeply equal [ 'periodo', 'flujo', 'tickets', …(1) ]
    × RQ-KP-31 · el recorte del GET por flujo > la comparación sale de las filas recortadas: el valor de Zoho de un ticket de servicio no cuenta en el resumen de equipo nuevo
    → expected { comparable: true, …(5) } to match object { comparable: false, …(1) }
    × RQ-KP-31 · el CSV por flujo (M5) > El CSV también filtra: flujo=soporte-remoto da sólo las filas del SR, la cabecera de hoy y el nombre con el flujo
    → expected 'attachment; filename="indicadores-202…' to match /^attachment; filename="indicadores-so…/
    × RQ-KP-29 · el parámetro flujo y su orden (M3, M8) > vacío (flujo=): 400 con MENSAJE_FLUJO y ninguna consulta de datos
    → expected 200 to be 400 // Object.is equality
    Tests  11 failed | 34 passed (45)

## Caracterizaciones de M2 (L1a.2), antes de producción
- GET json sin parámetros: `0975f415450ecfb42cb419fa9eac640c80b143f0278940792c6e30db603992cf` (claves `periodo, tickets, comparacion`).
- GET csv sin parámetros: `c83ef69af8de973b0d0fa21bf968a335084516482de0cd4790b0bc873ba88be2` (1 + 4×9 filas).
- POST sin `flujo`: `862d1958da8da38ec164e10ddd2158bcb0f1fc66f5e835af60a0f4cbc10623a7` (claves `periodo, fichero, cruce, comparacion`).
- Calculadas con el código de hoy (primera pasada con marcador `PENDIENTE`, sustituido por el hash recibido), verdes antes del primer cambio de producción
  y verdes tras L1a.8. Ojo: las `id` del POST tienen que ser numéricas (`'101'`); el lector rechaza `'en'`.
- Fixture: «Equipo nuevo» en `Ticket creado`, «Soporte remoto» en `Rev./Diagnostico`, «Servicio» en `Por Facturar`, `NULL` en `Ticket creado` (más uno fuera del periodo en el POST).

## Mutaciones (L1a.9 a L1a.16): mutar, ver rojo, revertir con otra edición, mismo sha256
Script: edición exacta antes/después (`mut.cjs`, fuera del repositorio). Las tres sumas de los ficheros de producción no cambiaron en ninguna.
### L1a.9 · M1 — `recortarPorFlujo` no filtra (`=== flujo || true`): 10 rojas
Fichero `apps/desk/server/indicadores.ts`; sha256 antes = después = `123f2bd19d6d9784541b3bc1ae92c6acce571b9f23c778f0c1be2f5ba4ebe0d8` (IGUAL).
    × RQ-KP-31 · el recorte del GET por flujo > El recorte filtra: flujo=equipo-nuevo sobre los tres flujos trae sólo los suyos y la clave `flujo` tras `periodo`
    → expected [ 'en', 'sr', 'sv', 'nu' ] to deeply equal [ 'en' ]
    × RQ-KP-31 · el CSV por flujo (M5) > El CSV también filtra: flujo=soporte-remoto da sólo las filas del SR, la cabecera de hoy y el nombre con el flujo
    → expected [ …(37) ] to have a length of 10 but got 37

### L1a.10 · M2 — sin flujo recorta a `servicio` y se emite `flujo`: 4 rojas
Ficheros `apps/desk/server/indicadores.ts` (sha256 antes = después = `123f2bd19d6d9784541b3bc1ae92c6acce571b9f23c778f0c1be2f5ba4ebe0d8`) y `apps/desk/server/routes/indicadores.ts` (antes = después = `79ac6c57cc3bb98e4639064ef3b283e928adf34e3754ac31121fd27e1e1fbfb1`), los dos IGUAL.
    × recortarPorFlujo (D5, M1, M2, M6, M12) > M2 · sin flujo devuelve LA MISMA entrada, no una copia
    → expected { tickets: [ …(2) ], …(4) } to be { tickets: [ …(4) ], …(4) } // Object.is equality
    × RQ-KP-13 · la forma del JSON > administrador: 200 con { periodo, tickets, comparacion } y el K2 sembrado (50 = 4, variante 5)
    → expected [ 'comparacion', 'flujo', …(2) ] to deeply equal [ 'comparacion', 'periodo', 'tickets' ]

### L1a.11 · M3 — `validarFlujo` deja pasar `otro`, `''`, array y `Servicio`: 11 rojas
Fichero `apps/desk/server/indicadores.ts`; sha256 antes = después = `123f2bd19d6d9784541b3bc1ae92c6acce571b9f23c778f0c1be2f5ba4ebe0d8` (IGUAL).
    × validarFlujo (RQ-KP-29, D3) > otro → error con MENSAJE_FLUJO
    → expected { ok: true, flujo: 'otro' } to deeply equal { ok: false, …(1) }
    × RQ-KP-29 · el parámetro flujo y su orden (M3, M8) > Valor desconocido (flujo=otro): 400 con MENSAJE_FLUJO y ninguna consulta de datos
    → expected 200 to be 400 // Object.is equality

### L1a.12 · M5 — el csv relee sin recortar (suma una lectura): 2 rojas
Fichero `apps/desk/server/routes/indicadores.ts`; sha256 antes = después = `79ac6c57cc3bb98e4639064ef3b283e928adf34e3754ac31121fd27e1e1fbfb1` (IGUAL).
    × RQ-KP-31 · el CSV por flujo (M5) > El CSV también filtra: flujo=soporte-remoto da sólo las filas del SR, la cabecera de hoy y el nombre con el flujo
    → expected [ …(37) ] to have a length of 10 but got 37

### L1a.13 · M6a — el recorte usa `flujoDelTicket` con el estado real: 9 rojas
Fichero `apps/desk/server/indicadores.ts`; sha256 antes = después = `123f2bd19d6d9784541b3bc1ae92c6acce571b9f23c778f0c1be2f5ba4ebe0d8` (IGUAL).
    × recortarPorFlujo (D5, M1, M2, M6, M12) > M1/M6/M12 · con «equipo-nuevo» salen sólo ["en"]: «Equipo Nuevo» en Ticket creado, SR en Rev./Diagnostico y la clasificación null cuentan por clasificación
    → expected [] to deeply equal [ 'en' ]
    × recortarPorFlujo (D5, M1, M2, M6, M12) > M12 · «Por Facturar» con «Equipo nuevo» (heredado) también es equipo-nuevo
    → expected [] to deeply equal [ 'he' ]

### L1a.13 · M6b — el predicado depende del estado (`flujoDelTicket` con `Ticket creado`): 15 rojas
Fichero `packages/shared/src/flujos.ts`; sha256 antes = después = `76e8cf419547c03d3648d8fb2b3029cf11fe6518184633a6c24afd3cd49043b8` (IGUAL).
    × flujoPorClasificacion (RQ-KP-30, D1, M12): sólo la clasificación, sin estado > M6 · enfrentado a flujoDelTicket en los ESTADOS del registro: el predicado no mira el estado y flujoDelTicket sí
    → Equipo nuevo en En Espera de Repuestos: expected 'servicio' to be 'equipo-nuevo' // Object.is equality

### L1a.14 · M8 — `flujo` se valida ANTES que el periodo: 2 rojas
Fichero `apps/desk/server/routes/indicadores.ts`; sha256 antes = después = `79ac6c57cc3bb98e4639064ef3b283e928adf34e3754ac31121fd27e1e1fbfb1` (IGUAL).
    × RQ-KP-29 · el parámetro flujo y su orden (M3, M8) > Periodo antes que flujo (regla de mutación 1): periodo invertido + flujo=otro → el mensaje del periodo, que no nombra «flujo»
    → expected { Object (error) } to deeply equal { Object (error) }
    × RQ-KP-29 · el parámetro flujo y su orden (M3, M8) > formato=xml + flujo=otro → el mensaje del formato (el flujo va detrás de todo el periodo)
    → expected 'El parámetro «flujo» debe ser servici…' to contain 'formato'

### L1a.15 · M10 — una consulta de clasificaciones aparte (5 sentencias): 9 rojas
Fichero `apps/desk/server/indicadores.ts`; sha256 antes = después = `123f2bd19d6d9784541b3bc1ae92c6acce571b9f23c778f0c1be2f5ba4ebe0d8` (IGUAL).
    × la clasificación en la lectura (D4, RQ-KP-31): la misma consulta, cuatro en total > M10 · con 2 tickets son EXACTAMENTE cuatro consultas, también con clasificaciones
    → expected [ …(5) ] to have a length of 4 but got 5
    × la clasificación en la lectura (D4, RQ-KP-31): la misma consulta, cuatro en total > M10 · con 20 tickets son EXACTAMENTE cuatro consultas, también con clasificaciones
    → expected [ …(5) ] to have a length of 4 but got 5

### L1a.16 · M12 — compara la clasificación sin normalizar: 5 rojas
Fichero `packages/shared/src/flujos.ts`; sha256 antes = después = `76e8cf419547c03d3648d8fb2b3029cf11fe6518184633a6c24afd3cd49043b8` (IGUAL).
    × flujoPorClasificacion (RQ-KP-30, D1, M12): sólo la clasificación, sin estado > «Equipo Nuevo» → equipo-nuevo
    → expected 'servicio' to be 'equipo-nuevo' // Object.is equality
    × flujoPorClasificacion (RQ-KP-30, D1, M12): sólo la clasificación, sin estado > «  equipo   NUEVO » → equipo-nuevo
    → expected 'servicio' to be 'equipo-nuevo' // Object.is equality


## Cierre de lote (cifras en el informe del apply)
- `npm test` (dos pasadas): 313 ficheros pasan, 3 omitidos; 5376 pruebas pasan, 11 omitidas, 0 fallan (línea base: 5325 + 1 fallo por tiempo). Código de salida 1 en las dos, sólo por
  `Unhandled Errors` de vitest (`[vitest-worker]: Timeout calling "onTaskUpdate"`: 2 errores y 1 error), los mismos que ya daba la línea base.
- `npm run typecheck`: 0. `npm run lint`: 0, 165 avisos (ninguno nuevo).
- Medida: `git diff --shortstat --no-renames 9caba837` = 333 inserciones y 30 borrados (363) + `wc -l` de este fichero (130, sin trackear) = 493, bajo 720.
- `git diff -U0`: producción sólo en sitio (`indicadores.ts` -2/-43/-64,2/-73/-88 y +97,21; `routes/indicadores.ts` -7/-42,3/-48/-53, 0 líneas netas; `flujos.ts` -126,2 y +164,12); pruebas sólo añadidas al final.

## Desviaciones del diseño
- Ninguna de código. Las pruebas del GET que el diseño reparte entre varios ficheros quedan en `routes/indicadores.test.ts` y `server/indicadores.test.ts`.
- Los nombres de escenario de M12 en este lote son «Equipo Nuevo → equipo-nuevo» (`flujos.test.ts`) y «Ticket sin clasificación (M12)» (ruta); «Otra mayúscula» y «Clasificación ausente» se cubren con los casos `Equipo Nuevo` y `null`.
- M5 se mutó releyendo (una sentencia más), así que además de «El CSV también filtra» cae el conteo de cuatro lecturas de hoy.

## Salvedad de `npm test` en el cierre de L1a (decisión del usuario, 2026-10-22)
Tres pasadas de `npm test` sobre el contenido de `88641e65` (las dos primeras sobre el árbol idéntico antes del commit), las tres con código **1**:
| Pasada | Ficheros | Pruebas | Fallidas | Errores | Duración |
|---|---|---|---|---|---|
| 1 | 316 (313 pasan, 3 omitidos) | 5.387 (5.376 pasan, 11 omitidas) | 0 | 2 × `Timeout calling "onTaskUpdate"` | 324 s |
| 2 | 316 (313 / 3) | 5.387 (5.376 / 11) | 0 | 2 × `Timeout calling "onTaskUpdate"` | 374 s |
| 3 | 316 (313 / 3) | 5.387 (5.376 / 11) | 0 | 2 × `Timeout calling "onTaskUpdate"` | 406 s |
`main` dio el mismo error ese día en `126b5ab0` (316 ficheros, 5.337 pruebas, 0 fallidas). El encargo pedía los cuatro códigos en 0; se preguntó
y el usuario decidió asentar con tres condiciones, que se comprueban en CADA pasada de L1b, L2, verify y archive: (a) 0 pruebas fallidas; (b) los
únicos errores son «Timeout calling "onTaskUpdate"»; (c) ficheros de prueba ≥ 316 más los que añada la tanda, y pruebas que sólo suben
(5.337 en `126b5ab0`, 5.387 en L1a). Si falla cualquiera, se para. typecheck 0; lint 0 (165 avisos); build 0 (`index-BpbCtGfB.js`, 426.074 B).


## Lote L1b (POST, cruce por flujo, clasificacion de los sin cruzar, forma)

Base del lote: `e123e9d0`. Modo: Strict TDD. Sin commit. Tareas hechas: L1b.1 a L1b.12 (la L1b.c es del orquestador).

### Linea base (L1b.1)
- Arbol limpio sobre `e123e9d0` (`git status` vacio). Los tres ficheros de prueba tocados, antes de editar: 62/62 verdes (`cruzarExportacion.test.ts` 19, `ticketsPorId.test.ts` 7, `indicadoresComparacion.test.ts` 36).
- Las tres caracterizaciones de M2 de L1a (sha256 literales) siguen en verde tras L1b.7 sin tocarlas: el POST sin `flujo` da los bytes de hoy.

### TDD Cycle Evidence
| Tarea | Fichero de prueba | Capa | Red de seguridad | ROJO | VERDE | TRIANGULAR | REFACTOR |
|---|---|---|---|---|---|---|---|
| L1b.2-3 | `server/comparacion/cruzarExportacion.test.ts` | Unitaria (pura) | 19/19 | fichero entero sin cargar | 30/30 | 2 flujos, 26 estados x 2 clasificaciones, `null`, grafia sin normalizar | n/a |
| L1b.4-5 | `server/db/ticketsPorId.test.ts` | Integracion (pg-mem) | 7/7 | 6 rojas | 13/13 | bloques de 2, 5001 ID, vacia, repetidos | n/a |
| L1b.6-7 | `server/routes/indicadoresComparacion.test.ts` | Integracion (ruta) | 36/36 | 16 rojas | 57/57 | 3 flujos, 4 valores malos, sin fichero, fichero sin ID, con y sin flujo | n/a |

### ROJOS (salida de vitest copiada)
#### L1b.2 (`cruzarPorFlujo` inexistente)
    FAIL  apps/desk/server/comparacion/cruzarExportacion.test.ts [ apps/desk/server/comparacion/cruzarExportacion.test.ts ]
    TypeError: (0 , cruzarPorFlujo) is not a function
     Test Files  1 failed (1)
          Tests  no tests
#### L1b.4 (`ticketsConClasificacion` inexistente): 5 de las 6 rojas
    × ticketsConClasificacion · número y clasificación por ID (D7) > devuelve Map<id, { numero, clasificacion }> sólo de los ID que existen; la clasificación va cruda y null si no hay
    → (0 , ticketsConClasificacion) is not a function
    × ticketsConClasificacion · número y clasificación por ID (D7) > lista vacía: mapa vacío y NINGUNA sentencia
    → (0 , ticketsConClasificacion) is not a function
#### L1b.6 (la ruta aun no valida ni cruza por flujo): 16 rojas
    × RQ-KP-32 · el POST con flujo: los cubos y la forma (M4, M6) > Otro flujo dentro del periodo: el SR del periodo va a `deOtroFlujo`, no a «fuera del periodo», y el flujo sale tras `periodo`
    → expected [ 'periodo', 'fichero', 'cruce', …(1) ] to deeply equal [ 'periodo', 'flujo', 'fichero', …(2) ]
    × RQ-KP-32 · el POST con flujo: los cubos y la forma (M4, M6) > con flujo, `deOtroFlujo` está siempre, aunque vacío
    → expected undefined to deeply equal { total: +0, tickets: [] }
    × RQ-KP-29 · el parámetro flujo del POST y su orden (M3, M8) > Valor desconocido (flujo=otro): 400 con MENSAJE_FLUJO y ninguna consulta de datos
    → expected 200 to be 400 // Object.is equality
    × RQ-KP-29 · el parámetro flujo del POST y su orden (M3, M8) > Flujo antes que «falta el fichero» y que el lector: flujo=otro sin fichero → MENSAJE_FLUJO
    → expected { Object (error) } to deeply equal { Object (error) }
    × RQ-KP-32 · las mismas consultas con y sin flujo (M10) > Mismas consultas: con y sin flujo son cuatro de datos más UNA por bloque de «ID» sin cruzar; sólo SELECT, y sólo con flujo se lee la clasificación por ID
    → expected 'SELECT id, number FROM tickets WHERE …' to match /\bclassification\b/
    Tests  16 failed | 41 passed (57)

### Mutaciones (L1b.8 a L1b.12): mutar, ver rojo, revertir, mismo sha256
Scripts de sustitucion literal fuera del repositorio. Las sumas de `routes/indicadoresComparacion.ts` y `comparacion/cruzarExportacion.ts` no cambiaron en ninguna.
#### L1b.8 · M3 — el POST deja pasar `flujo=otro` (`if (!fl.ok && false)`): 6 rojas
Fichero `apps/desk/server/routes/indicadoresComparacion.ts`; sha256 antes = despues = `85ea3bc80316f5ee7f03ec4f73f8e8dc32a98c548aeb0a13da8898122321655b` (IGUAL).
    × RQ-KP-29 · el parámetro flujo del POST y su orden (M3, M8) > Valor desconocido (flujo=otro): 400 con MENSAJE_FLUJO y ninguna consulta de datos
    → expected 200 to be 400 // Object.is equality
    × RQ-KP-29 · el parámetro flujo del POST y su orden (M3, M8) > vacío (flujo=): 400 con MENSAJE_FLUJO y ninguna consulta de datos
    → expected 200 to be 400 // Object.is equality
#### L1b.9 · M4 — se recorta `entradas.tickets` antes de cruzar (`recortarPorFlujo(entradas, flujo).tickets`): 2 rojas
Mismo fichero y mismas sumas (IGUAL). El cuerpo sale igual (el SR del periodo se reconoce igual por su clasificacion al preguntar por ID): lo que cambia son los «ID» que se preguntan, y eso lo fijan dos pruebas (ver desviaciones).
    × RQ-KP-32 · el POST con flujo: los cubos y la forma (M4, M6) > Otro flujo dentro del periodo: el SR del periodo va a `deOtroFlujo`, no a «fuera del periodo», y el flujo sale tras `periodo`
    → expected [ '222', '444', '555', '666' ] to not include '222'
    × RQ-KP-32 · las mismas consultas con y sin flujo (M10) > los «ID» que se preguntan por separado son los mismos con y sin flujo: los del fichero que no están en NINGÚN flujo del periodo
    → expected [ '222', '444', '555', '666' ] to deeply equal [ '444', '555', '666' ]
#### L1b.9b · M4 (extra) — `cruzarPorFlujo` ignora `existentes` (`const e = undefined`): 6 rojas, entre ellas «Otro flujo fuera del periodo»
Fichero `apps/desk/server/comparacion/cruzarExportacion.ts`; sha256 antes = despues = `abda23ddac584748d5eb6c1ddfad5c6c3d8b3a6f963f9be11c72f213d90c0439` (IGUAL).
    × RQ-KP-32 · el POST con flujo: los cubos y la forma (M4, M6) > Otro flujo fuera del periodo: el servicio de fuera va a `deOtroFlujo` y el equipo nuevo de fuera a «fuera del periodo»
    → expected { total: 1, tickets: [ { …(2) } ] } to deeply equal { total: 2, …(1) }
    × cruzarPorFlujo · los cubos con flujo (M4) > el equipo nuevo de fuera es «fuera del periodo» y el ausente de Desk es «sólo en el fichero»; ninguno es «de otro flujo»
    → expected [ { id: '10', numero: 3010 }, …(1) ] to deeply equal [ { id: '11', numero: 3011 } ]
#### L1b.10 · M6 — `cruzarPorFlujo` usa `flujoDelTicket` con el estado del ticket: 9 rojas
Mismo fichero y mismas sumas (IGUAL).
    × cruzarPorFlujo · el flujo no depende del estado (M6) > «Equipo nuevo» cruza con equipo-nuevo en cada uno de los estados del registro, también `Ticket creado`, `Por Facturar` y `Rev./Diagnostico`
    → En Espera de Repuestos: expected [] to deeply equal [ '7' ]
    × cruzarPorFlujo · el flujo no depende del estado (M6) > el mismo ticket con otro flujo pedido sale `deOtroFlujo` en cada estado: el estado no lo rescata
    → Ticket creado: expected [ { id: '7', numero: 7, …(6) } ] to deeply equal []
    × RQ-KP-32 · el POST con flujo: los cubos y la forma (M4, M6) > M6 · el estado no decide: «Equipo nuevo» en `Ticket creado` y en `Por Facturar` es de equipo nuevo, y «Soporte remoto» en `Rev./Diagnostico` de soporte remoto
    → expected +0 to be 2 // Object.is equality
#### L1b.11 · M8 — `validarFlujo` detras de «falta el fichero»: 1 roja
Fichero `apps/desk/server/routes/indicadoresComparacion.ts`; sha256 antes = despues = `85ea3bc80316f5ee7f03ec4f73f8e8dc32a98c548aeb0a13da8898122321655b` (IGUAL).
    × RQ-KP-29 · el parámetro flujo del POST y su orden (M3, M8) > Flujo antes que «falta el fichero» y que el lector: flujo=otro sin fichero → MENSAJE_FLUJO
    → expected { Object (error) } to deeply equal { Object (error) }
#### L1b.12 · M10 — llamar siempre a `ticketsConClasificacion`: 1 roja; y consulta de clasificaciones aparte (`numerosDeTickets` mas `ticketsConClasificacion`): 3 rojas
Mismo fichero y misma suma `85ea3bc8…` en las dos (IGUAL).
    × RQ-KP-32 · las mismas consultas con y sin flujo (M10) > Mismas consultas: con y sin flujo son cuatro de datos más UNA por bloque de «ID» sin cruzar; sólo SELECT, y sólo con flujo se lee la clasificación por ID
    → expected 'SELECT id, number, classification FRO…' not to match /\bclassification\b/
    → (consulta aparte) expected [ …(6) ] to have a length of 5 but got 6

### Cierre de lote (cifras en el informe del apply)
- `npm test`: 316 ficheros (313 pasan, 3 omitidos); 5.425 pruebas (5.414 pasan, 11 omitidas), 0 fallan; unico error `Timeout calling "onTaskUpdate"` (1 error); codigo 1; 334 s. Condiciones de la salvedad: (a) 0 fallidas, (b) solo ese error, (c) 316 >= 316 ficheros y 5.414 >= 5.387 pruebas pasadas (suben 38 pruebas nuevas: 11 + 6 + 21).
- `npm run typecheck`: 0. `npm run lint`: 0, 165 avisos (ninguno nuevo).
- `git diff -U0 e123e9d0`: produccion solo en sitio o tras la ultima linea (`indicadoresComparacion.ts` -3, -8,4, -15, -26,3, -34,2, -40, -43 y +52,9; `cruzarExportacion.ts` -2 y +42,27; `ticketsPorId.ts` +20,14; `indicadoresExportacion.ts` -16 y -21); pruebas solo anadidas al final.

### Desviaciones del diseno
- Ninguna de codigo. `cruzarPorFlujo` decide el flujo de un «ID» del periodo por `clasificaciones` y el de uno de fuera por `existentes`, como dice D6; `flujoDe` mira primero si el ticket es del periodo.
- Mutacion M4 (L1b.9), tal como la describen las tareas, es OBSERVACIONALMENTE EQUIVALENTE en el cuerpo: el SR del periodo recortado cae en `sinCruzar`, se pregunta por ID y su clasificacion lo manda a `deOtroFlujo` igual. Lo que cambia son los «ID» de la sentencia por bloque (aparece el `222`). Se anadio esa asercion a «Otro flujo dentro del periodo» y a la prueba de los mismos «ID»; esas dos son las que caen. «Otro flujo fuera del periodo» se mutó aparte (L1b.9b: ignorar `existentes`).

### Salvedad de `npm test` en el cierre de L1b (pasada del orquestador)
Una pasada sobre el árbol de L1b, código **1**: 316 ficheros (313 pasan, 3 omitidos), 5.425 pruebas (5.414 pasan, 11 omitidas), **0 fallidas**,
2 errores, los dos `[vitest-worker]: Timeout calling "onTaskUpdate"`, 313 s. Condiciones del usuario: (a) 0 fallidas, sí; (b) sólo ese error, sí;
(c) 316 ≥ 316 ficheros y 5.425 ≥ 5.387 pruebas, sí. La pasada del agente dio lo mismo con 1 error (334 s). typecheck 0; lint 0 (165 avisos);
build 0 (`index-BpbCtGfB.js`, 426.074 B, sin cambio: el cliente aún no usa lo nuevo).


## Lote L2 (cliente: URL, vista y selector; mutaciones M7, M9, M11; barrido; regla 13)

Base del lote: `a72ea5c1`. Modo: Strict TDD. Sin commit. Tareas hechas: L2.1 a L2.12 (L2.13, el `npm run reconcile`, y la L2.c son del orquestador).

### Linea base (L2.1)
- Arbol limpio sobre `a72ea5c1`. Antes de editar: `indicadoresUrl.test.ts` 11, `comparacionExportacion.test.ts` 31 y `api/client.test.ts` 3, todos verdes (45/45).

### TDD Cycle Evidence
| Tarea | Fichero de prueba | Capa | Red de seguridad | ROJO | VERDE | TRIANGULAR | REFACTOR |
|---|---|---|---|---|---|---|---|
| L2.2-3 | `src/lib/indicadoresUrl.test.ts` | Unitaria (pura) | 11/11 | 6 rojas | 18/18 | con flujo, con periodo, vacio, ausente, valor desconocido; 3 rotulos | n/a |
| L2.4-5 | `src/lib/comparacionExportacion.test.ts` | Unitaria (pura) | 31/31 | 6 rojas | 40/40 | solo flujo, con periodo, vacio; con y sin `deOtroFlujo`, vacio con flujo, total 40 con 2 tickets | n/a |
| L2.6 | sin prueba (`.tsx`, F0-00) | n/a | typecheck 0 | n/a | typecheck 0 | n/a | n/a |

### ROJOS (salida de vitest copiada)
#### L2.2 (`opcionesFlujo` inexistente y la URL aun no lleva el flujo): 6 rojas
    × urlIndicadores con flujo (RQ-KP-33, M7) > con flujo: `flujo=equipo-nuevo` tras el formato
    → expected '/api/indicadores?formato=csv' to be '/api/indicadores?formato=csv&flujo=eq…' // Object.is equality
    × urlIndicadores con flujo (RQ-KP-33, M7) > con periodo y flujo: el flujo va tras `hasta`
    → expected '/api/indicadores?formato=csv&desde=20…' to be '/api/indicadores?formato=csv&desde=20…' // Object.is equality
    × opcionesFlujo (RQ-KP-33): «Todos» y la lista de `shared`, con sus rótulos > la primera es «Todos» con valor vacío
    → (0 , opcionesFlujo) is not a function
#### L2.4 (la URL y la vista aun no conocen el flujo): 6 rojas
    × urlComparacion con flujo (RQ-KP-33, M9) > sólo flujo: la ruta con `flujo` y nada más
    → expected '/api/indicadores/comparacion' to be '/api/indicadores/comparacion?flujo=eq…' // Object.is equality
    × vistaComparacion con flujo y «De otro flujo» (RQ-KP-33, M11): sólo si llegan, sin calcular > con `deOtroFlujo`: recuento y lista tras «Fuera del periodo», con el total tal como llegó (40 aunque haya 2 tickets)
    → expected [ 'Filas leídas', …(7) ] to deeply equal [ 'Filas leídas', …(8) ]
    × vistaComparacion con flujo y «De otro flujo» (RQ-KP-33, M11): sólo si llegan, sin calcular > con flujo la clave está siempre, aunque vacía: total 0 y sin líneas, y se pinta
    → expected undefined to be '0' // Object.is equality
    × vistaComparacion con flujo y «De otro flujo» (RQ-KP-33, M11): sólo si llegan, sin calcular > el periodo gana « · Flujo: <nombre>» con el flujo de la RESPUESTA, y sin flujo queda como hoy
    → expected 'Periodo: 2026-01-01 a 2026-01-31' to be 'Periodo: 2026-01-01 a 2026-01-31 · Fl…' // Object.is equality

### Mutaciones (L2.7 a L2.9): mutar, ver rojo, revertir con otra edicion, mismo sha256
Fichero `apps/desk/src/lib/indicadoresUrl.ts`: sha256 antes = despues = `0e31ad235eab8fca99c10a9cf749010bd1eaf4f72e134b25c2f9720a18a32a21`.
Fichero `apps/desk/src/lib/comparacionExportacion.ts`: sha256 antes = despues = `335c362f2013cf27e9fb7ab6479cff424449557f792628cf09b934f4c26fdeef`. Los dos IGUAL en las 8 mutaciones.
| Tarea | Mutacion | sha256 mutado | Rojas | Prueba que cae |
|---|---|---|---|---|
| L2.7 M7 | `urlIndicadores` pierde el parametro (sin `if (flujo) q.set(…)`) | `52f72583f2acc211…` | 3 | «con flujo: `flujo=equipo-nuevo` tras el formato», «con periodo y flujo…», «el cliente no valida…» |
| L2.7 M7b | el vacio entra (`flujo !== undefined`) | `dc76f26baa22bddacb…` | 1 | «"Todos" (vacío) y ausente: la URL de hoy, sin `flujo` ni siquiera vacío» (`…&flujo=`) |
| L2.8 M9 | `urlComparacion` pierde el parametro | `0ddcd79bfde2a748…` | 3 | «con periodo y flujo…», «sólo flujo…», «el cliente no valida…» |
| L2.8 M9b | el vacio entra | `fcfbfa2628f8d8b7…` | 1 | «sin flujo, o "Todos" (vacío): la URL de hoy…» |
| L2.9 M11a | el recuento «De otro flujo» se pinta sin que venga | `829020b98beac58c…` | 1 | «sin `deOtroFlujo`: ni recuento ni lista…» (9 recuentos en vez de 8) |
| L2.9 M11b | la lista «De otro flujo» se pinta sin que venga | `f3beb5564170546e…` | 1 | la misma (7 listas en vez de 6) |
| L2.9 M11c | el total de la lista se calcula (`tickets.length`) | `304b22a1b36838a1…` | 1 | «con `deOtroFlujo`: …total tal como llegó (40 aunque haya 2 tickets)» |
| L2.9 M11d | el total del recuento se calcula | `d2d54d3967dea647…` | 1 | la misma: `expected '2' to be '40'` |
Salida literal de M7: `× urlIndicadores con flujo (RQ-KP-33, M7) > con flujo: ...` con `→ expected '/api/indicadores?formato=csv' to be '/api/indicadores?formato=csv&flujo=eq…'`.
Salida literal de M11d: `→ expected '2' to be '40' // Object.is equality`. Incidente: la primera mutacion de M7 se lanzo con un texto de reversion vacio, no revirtio y se
restauro a mano con otra edicion; el sha256 volvio a `0e31ad23…` antes de seguir (el script de mutacion exige ahora un ancla).

### Barrido de la regla de mutacion 4 contra `8a068fe9` (L2.10, L2.11)
(1) `git diff -U0 8a068fe9`: los 12 ficheros de produccion, solo trozos en sitio o tras la ultima linea. `server/indicadores.ts` -2 -43 -64,2 -73 -88 y +97,21;
`routes/indicadores.ts` -7 -42,3 -48 -53; `routes/indicadoresComparacion.ts` -3 -8,4 -15 -26,3 -34,2 -40 -43 y +52,9; `flujos.ts` -126,2 y +164,12; `cruzarExportacion.ts` -2 y +42,27;
`ticketsPorId.ts` +20,14; `indicadoresExportacion.ts` -16 -21; `indicadoresUrl.ts` -3 -5 -8 y +19,5; `comparacionExportacion.ts` -4 -13 -16 -56 -62 -76; `client.ts` -897 -899;
`Analisis.tsx` -6 -75 -83 -91; `ComparacionExportacion.tsx` -9 -20. Los 8 `*.test.ts`: un solo trozo `-N,0` al final cada uno. Ningun desplazamiento.
(2) `git grep -noE` con la ruta completa (84, 28, 37, 114, 1, 2, 2, 12, 5, 62, 19 y 1 citas); las que caen en una linea editada en sitio o la cruzan, sin contar los artefactos de este cambio, se leyeron contra su frase:
- **Siguen ciertas (A)**: `DEPLOY.md:735` (`routes/indicadoresComparacion.ts:27-28`: 27 llama a `validarPeriodo`, 28 responde el 400 del periodo; el del flujo comparte la linea) y `DEPLOY.md:744-745` (`:30-31` lector y `:29` sin fichero);
  `openspec/config.yaml:4105` (`routes/indicadores.ts:52`, el comentario «ningún fichero, ninguna escritura», sin tocar); `Paquete_de_Despliegue_2026-10-04(b).md` 586, 593, 643, 864, 905, 978;
  `ENTRADA.md:2128` y `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md:247` (`indicadores.ts:57-64`, «filtra sólo por periodo»: el `WHERE` no cambia, solo el `SELECT`); `openspec/changes/archive/2026-10-11-tiempo-en-tarjeta-remision-creada/proposal.md:25` (`apps/desk/server/indicadores.ts:88`, sigue leyendo `listarCierres`);
  `2026-10-18-anulado-con-motivo` (`:64-74`, la lectura por ticket); los de `comparacion-exportacion-zoho` (`:27`, `:28`, `:29`, `:31`, `:39-48`, `routes/indicadores.ts:52-53`, `comparacionExportacion.ts:76`, `Analisis.tsx:6` y `:83`);
  `openspec/changes/archive/2026-10-17-fecha-migracion-fuera-de-cifras/design.md:34` (`apps/desk/server/routes/indicadoresComparacion.ts:25-36`); `2026-10-03-continuidad-indicadores` (`:42`, `:43`, `indicadoresUrl.ts:5-10`, `Analisis.tsx:83`, `:81-88`); `openspec/changes/archive/2026-10-11-tiempo-en-tarjeta-remision-creada/proposal.md:71` (`apps/desk/server/routes/indicadores.ts:48`);
  `2026-10-08-mapa-blueprint-tres-flujos/design.md:32` y `:176` (`flujos.ts:127-131`: un cuarto flujo rompe `tsc` ahi) y `2026-09-29-blueprint-soporte-remoto/verify-report.md:87`.
- **Dato fechado (B), cierto de su dia, sin tocar**: las ancladas `en 42a4828` (`2026-10-07-indicadores-51-55` y Paquete 586/864); `openspec/changes/archive/2026-10-07-indicadores-51-55/apply-progress.md:406` y `:409` («líneas sin cambio»);
  `2026-10-19-reloj-sla-esperas/apply-progress.md:142` (`Analisis.tsx:83` «idéntica a la de `bef8ae3`»); `openspec/changes/archive/2026-10-03-continuidad-indicadores/design.md:243` (cita el enlace con `urlIndicadores('csv')` de entonces; la barra `apps/desk/src/components/Analisis.tsx:81-88` sigue donde estaba).
- **Superadas (C), a anotar sin editar (la rama no las toca)**: `2026-10-08-mapa-blueprint-tres-flujos/archive-report.md:100` y `design.md:212` dicen de `flujos.ts:127-131` «unificarlos exige exportar esa tabla; quedó fuera»: esta tanda la exporta (D2).
- **Ninguna frase ha dejado de ser cierta.** `DEPLOY.md` no documenta el parametro `flujo` (no se toca): lo recoge el orquestador si quiere.
(3) Pase de abreviadas: citas con nombre sin ruta y herencia de las `:N` pegadas a una cita completa, en todo fichero rastreado que cite estos modulos; las que heredan un modulo editado (10, todas de `archive/`) estan arriba.
(4) Detector de `pre-push` sobre `a72ea5c`: salida 0, 13 abreviadas rotas (las mismas que en `main`), 0 cabeceras R-1 invalidas, base de citas 0/0. Lee el commit, no el arbol: el orquestador debe repetirlo tras el commit de L2.

### Regla 13 (L2.12): decisiones del cliente y linea del servidor que las impone (leidas en el fichero hoy)
| # | Decision del cliente | Linea del servidor |
|---|---|---|
| C1 | Selector solo a administradores (`Analisis.tsx:83`, `:91`) | `requireAdmin` (403): `apps/desk/server/routes/indicadores.ts:41`, `apps/desk/server/routes/indicadoresComparacion.ts:25` |
| C2 | Ofrece solo «Todos» y `FLUJOS` | `validarFlujo` (400): `routes/indicadores.ts:42-43`, `routes/indicadoresComparacion.ts:27-28`; la funcion, `apps/desk/server/indicadores.ts:107-111` |
| C3 | «Todos» no envia `flujo` | `validarFlujo(undefined)` da `null` (`indicadores.ts:108`) y `recortarPorFlujo` devuelve la misma entrada (`:115`); el unico corte sigue en `indicadores.ts:70` |
| C4 | La descarga lleva el flujo | recorte `routes/indicadores.ts:44` (`indicadores.ts:114-117`) y nombre del CSV `routes/indicadores.ts:48` |
| C5 | La comparacion lleva el mismo flujo | `routes/indicadoresComparacion.ts:34` (`cruceDeLaPeticion`, `:55`) y `cruzarPorFlujo` (`apps/desk/server/comparacion/cruzarExportacion.ts:53`) |
| C6 | Pinta el flujo y «De otro flujo» solo si llegan, sin calcular | serializacion `routes/indicadoresComparacion.ts:40` (`flujo`) y `:43` (`deOtroFlujo`); en el GET `routes/indicadores.ts:53` |
| C7 | Rotulos de `NOMBRE_FLUJO` | ninguna: es rotulo, no decision; su fuente es `packages/shared/src/flujos.ts:127` |

### Cierre de lote (cifras en el informe del apply)
- `npm test`: codigo **0**, 316 ficheros (313 pasan, 3 omitidos), 5.441 pruebas (5.430 pasan, 11 omitidas), 0 fallidas, ningun error, 307 s. Salvedad: (a) 0 fallidas, (b) sin errores, (c) 316 >= 316 y 5.430 >= 5.414 (suben 16 pruebas: 7 + 9).
- `npm run typecheck`: 0. `npm run lint`: 0, 165 avisos (ninguno nuevo). `npm run build`: 0, `index-eZJekTNg.js` 426.466 B (antes `index-BpbCtGfB.js`, 426.074 B): el bundle cambia, como era de esperar.
- Medida: `git diff --shortstat --no-renames a72ea5c1` = 215 inserciones y 29 borrados (244; las 88 lineas de esta seccion y las 12 marcas de `tasks.md` incluidas) + 0 lineas sin trackear = 244, bajo 600 y 720. Sin la reconciliacion (L2.13, del orquestador).

### Desviaciones del diseno
- Ninguna. Una decision menor del `.tsx`: el `<select>` lleva `aria-label="Flujo"` y el `title` del diseno; el `<a>` y el `<select>` van juntos en un fragmento dentro de la misma linea 83.
