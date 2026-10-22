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
