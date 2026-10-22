```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:4b84302b36435a29d8cf7ceb7c9a0adebd00b8d881ebbe314b30a76c406387fc
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 5/5
scenarios: 27/27
test_command: npx vitest run --exclude "apps/desk/server/citas/**"
test_exit_code: 0
test_output_hash: sha256:6556611877e25c2a15a4e7de9c7f2019198ab691115b4555bfad6c84e30d5e95
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:85953cf90fd00dc363c65a1051c4ae167440cb7e0dfb98cd0875e6800156044d
```

# Informe de verificación — `filtro-indicadores-por-flujo` (F1F-05, `cierra: no`)

Worktree `C:\dev\Desk_2_R1.023-worktrees\filtro-indicadores-por-flujo`, rama `filtro-indicadores-por-flujo`, HEAD `488246c3`, base de la
tanda `8a068fe9`. Preflight: auto · hybrid · ask-on-risk · 800 · strict_tdd. Verificado el 2026-10-22 sin tocar código: cada mutación se
revirtió con hash igual, el worktree temporal se retiró y `git status` quedó vacío. El `evidence_revision` es el sha256 de
`git diff --no-renames 8a068fe9 HEAD`.

## Veredicto: PASS CON AVISOS — 0 CRITICAL · 1 WARNING · 2 SUGGESTION

Los 5 requisitos y los 27 escenarios tienen una prueba que pasa. Las tres caracterizaciones «bytes de hoy» pasan contra el código de
producción de `8a068fe9`. Las seis mutaciones reproducidas ponen en rojo la prueba que deben y el fichero vuelve a su sha256. La
tabla de la regla 13 coincide con el código y la regla de mutación 4 y el detector de citas salen limpios. El aviso es una
justificación imprecisa de la spec (D6 / RQ-KP-32); las sugerencias, un fallo previo de la suite completa y un detalle de forma.

## 1. Códigos de salida (en serie, sobre HEAD, árbol limpio)

| Orden | Comando | Código | Detalle |
|---|---|---|---|
| 1 | `npx vitest run --exclude "apps/desk/server/citas/**"` | **0** | 306 ficheros (303 pasan, 3 omitidos), 5.312 pruebas (5.301 pasan, 11 omitidas), 0 fallidas, 0 errores, 279,8 s |
| 2 | `npx vitest run apps/desk/server/citas` | 1 | 10 ficheros, 129 pruebas, 129 pasan, 0 fallidas, 2 × `Timeout calling "onTaskUpdate"` (95,2 s). Aceptado por el usuario |
| 3 | `npm run typecheck` | **0** | |
| 4 | `npm run lint` | **0** | 0 errores, **165** avisos (techo intacto, ninguno nuevo) |
| 5 | `npm run build` | **0** | `index-eZJekTNg.js`, 426,47 kB (el de apply-progress L2) |

La suite va partida por decisión del usuario (§7). Las dos partes suman 316 ficheros y 5.441 pruebas. Logs en
`C:\Users\algar\AppData\Local\Temp\claude\C--dev-Desk-2-R1-023\3d238944-3ea5-4f5a-98e1-bc25e2bed07e\scratchpad\verif\`.

## 2. Tareas y TDD

`tasks.md`: 44 marcadas, 0 sin marcar (`grep` de `- [x]` = 44, `- [ ]` = 0). `apply-progress.md` lleva las tres tablas «TDD Cycle
Evidence» (L1a, L1b, L2) con ROJO copiado de vitest, VERDE, triangulación y mutaciones con sha256 antes/después. L2.6 (`.tsx`) no
lleva prueba por decisión de Gerencia (F0-00); no se cuenta como carencia. Los ficheros de prueba citados existen y pasan:

| Capa | Ficheros (líneas añadidas por la tanda) |
|---|---|
| Unitaria pura | `packages/shared/src/flujos.test.ts:264-300`, `apps/desk/server/comparacion/cruzarExportacion.test.ts:143-210`, `apps/desk/src/lib/indicadoresUrl.test.ts:26-53`, `apps/desk/src/lib/comparacionExportacion.test.ts:164-219`, `apps/desk/server/indicadores.test.ts:199-253` |
| Integración (pg-mem + supertest) | `apps/desk/server/routes/indicadores.test.ts:256-377`, `apps/desk/server/routes/indicadoresComparacion.test.ts:312-491`, `apps/desk/server/db/ticketsPorId.test.ts:85-137` |

Auditoría de aserciones (5f): sin tautologías ni aserciones sin código de producción; el bucle de `flujos.test.ts:289` recorre `ESTADOS`
con `expect(ESTADOS).toHaveLength(26)` delante (no puede estar vacío); sin dobles pesados (las espías envuelven `db.query`, no sustituyen
la lógica). Una aserción acoplada a implementación (SQL por bloque), ver W1. Los ocho `*.test.ts` sólo crecen al final (§6).

## 3. Matriz requisito · escenario · prueba · resultado

Abreviaturas: `RI` = `apps/desk/server/routes/indicadores.test.ts`; `RC` = `apps/desk/server/routes/indicadoresComparacion.test.ts`;
`SI` = `apps/desk/server/indicadores.test.ts`; `FL` = `packages/shared/src/flujos.test.ts`; `CE` =
`apps/desk/server/comparacion/cruzarExportacion.test.ts`; `TP` = `apps/desk/server/db/ticketsPorId.test.ts`; `UI` =
`apps/desk/src/lib/indicadoresUrl.test.ts`; `UC` = `apps/desk/src/lib/comparacionExportacion.test.ts`.

### RQ-KP-29 · Parámetro `flujo` y su validación (6/6)

| Escenario | Prueba (ruta:línea) | Res. |
|---|---|---|
| Valor desconocido (GET y POST) | `RI:343` (`flujo=otro`), `RC:423` | OK |
| Vacío, repetido y otra grafía | `RI:343` (`flujo=`, repetido, `Servicio`), `RC:423`; puro `SI:206` | OK |
| Los tres valores válidos | `RI:281` (equipo-nuevo), `RI:289` (servicio, soporte-remoto), `RC:455`; puro `SI:203` | OK |
| Periodo antes que flujo | `RI:357`, `RI:367` (formato), `RC:431` | OK |
| Flujo antes que «falta el fichero» | `RC:439` (sin fichero y fichero sin «ID»), `RC:446` (el flujo bueno no tapa la falta) | OK |
| Flujo inválido no lee tickets | `RI:343` (`datos()` vacío), `RI:350` (csv), `RC:423` (`datos()` y `tickets()` vacíos); 401/403 antes: `RI:373`, `RC:451` | OK |

### RQ-KP-30 · El flujo lo decide la clasificación (5/5)

| Escenario | Prueba | Res. |
|---|---|---|
| «Equipo nuevo» en un estado de servicio | `FL:286` (26 estados contra `flujoDelTicket`; `Ticket creado` separa), `RC:396` | OK |
| «Equipo nuevo» finalizado y heredado | `FL:286` (`Por Facturar`, `Finalizado`), `SI:248`, `RC:396` | OK |
| Otra mayúscula | `FL:279` («Equipo Nuevo», «  equipo   NUEVO »), `RI:305` | OK |
| Clasificación ausente | `FL:282` (`null`, `undefined`), `RI:305` | OK |
| Soporte remoto | `FL:277`/`:286` (`Rev./Diagnostico`), `RC:396`, `CE:187` | OK |

### RQ-KP-31 · Recorte del GET por flujo (5/5)

| Escenario | Prueba | Res. |
|---|---|---|
| El recorte filtra | `RI:281` (sólo `['en']`, clave `flujo` tras `periodo`), `RI:289` | OK |
| El CSV también filtra | `RI:326` (filas sólo SR, cabecera de hoy, nombre con el flujo) | OK |
| Sin `flujo`, los bytes de hoy | `RI:257` (sha256 json), `RI:265` (sha256 csv), `RI:336`; `SI:233` (`toBe` la misma entrada) | OK |
| Cuatro consultas con y sin flujo | `RI:312` (4 tickets, no los 10 de la spec), `SI:222` (2 y 20 tickets, exactamente 4) | OK |
| Ticket sin clasificación | `RI:305` | OK |

### RQ-KP-32 · Comparación por flujo y cubo «de otro flujo» (6/6)

| Escenario | Prueba | Res. |
|---|---|---|
| Otro flujo dentro del periodo | `RC:356` (a `deOtroFlujo`, no a fuera del periodo), `CE:157` | OK |
| Otro flujo fuera del periodo | `RC:370` (servicio de fuera a `deOtroFlujo`; EN de fuera sigue en `fueraDelPeriodo`), `CE:160`, `CE:176` | OK |
| Ausente de Desk | `RC:370` (666 a `soloEnFichero`), `CE:160` | OK |
| «Sólo en Desk» del flujo pedido | `RC:370` (777 servicio ausente no sale con `equipo-nuevo`), `CE:152` (también `numeroDistinto`) | OK |
| Sin `flujo`, el cuerpo de hoy | `RC:313` (sha256), `RC:412` | OK |
| Mismas consultas | `RC:463` (4 + una por bloque; sólo con flujo se lee `classification`), `RC:478`, `TP:85-137` | OK |

### RQ-KP-33 · Cliente del filtro por flujo (5/5)

| Escenario | Prueba | Res. |
|---|---|---|
| `urlIndicadores` lleva el flujo | `UI:27`, `UI:30` | OK |
| `urlComparacion` lleva el flujo | `UC:165`, `UC:168` | OK |
| «Todos» no envía parámetro | `UI:33`, `UC:171` (ni siquiera vacío); `UI:44-52` (`opcionesFlujo`) | OK |
| Cubo sólo si llega | `UC:188` (sin), `UC:194` (con, total tal como llegó: 40 con 2 tickets), `UC:201`, `UC:214` | OK |
| El cliente no valida | `UI:38`, `UC:177` (el valor viaja tal cual) | OK |

**Resumen:** 5 requisitos y 27 escenarios (6+5+5+6+5) con prueba que pasa; ninguno PARCIAL ni sin probar. El selector `.tsx` no se
prueba (F0-00) y toda su lógica decidible está en `lib/*.test.ts`.

## 4. Caracterizaciones M2 (los bytes de hoy)

| Caracterización | Prueba | sha256 literal |
|---|---|---|
| GET json sin parámetros | `RI:257` | `0975f415450ecfb42cb419fa9eac640c80b143f0278940792c6e30db603992cf` |
| GET csv sin parámetros | `RI:265` | `c83ef69af8de973b0d0fa21bf968a335084516482de0cd4790b0bc873ba88be2` |
| POST sin `flujo` | `RC:313` | `862d1958da8da38ec164e10ddd2158bcb0f1fc66f5e835af60a0f4cbc10623a7` |

**Contra el código de producción de `8a068fe9`.** Worktree desacoplado `C:\dev\Desk_2_R1.023-worktrees\verif-m2-verify`
(`git rev-parse HEAD` = `8a068fe94e5cb4492b00c987481933cb559958f6`), `node_modules` enlazado con `mklink /J`, copiados SÓLO
`routes/indicadores.test.ts` y `routes/indicadoresComparacion.test.ts`. `npx vitest run <los dos> -t "M2 · caracterización"`: 2 ficheros
pasan, **3 pruebas pasan** (99 omitidas por el filtro), 0 fallidas. Los tres cuerpos de hoy son byte a byte los de antes de la tanda.
Retirada: primero `cmd //c rmdir <destino>\node_modules` (sólo el enlace), luego `git worktree remove --force`; `git worktree list`
ya no lo muestra y el `node_modules` de la tanda sigue entero (338 entradas, 108 en `.bin`, `vitest/package.json` presente).

## 5. Mutaciones reproducidas por mí

Método: script de Node (`mut.cjs`, fuera del repositorio) con un reemplazo exacto de ancla única, sha256 antes y tras mutar, `vitest run`
de los ficheros indicados, y reversión con OTRA edición (reinserta el ancla por posición); preserva los finales de línea (CRLF) porque no
reescribe nada fuera del trozo. Los sha256 antes = después coinciden además con los de apply-progress.

| M | Qué se hizo (fichero) | sha256 antes = después | Rojas | Verde |
|---|---|---|---|---|
| M1 | el filtro de `recortarPorFlujo` acepta todo (condición «o verdadero»), `apps/desk/server/indicadores.ts` | `123f2bd1…0d8` IGUAL | **10** | 79 |
| M3 | `validarFlujo` deja pasar cualquier valor, `apps/desk/server/indicadores.ts` | `123f2bd1…0d8` IGUAL | **17** | 129 |
| M4 | `cruzarPorFlujo` ignora `existentes`, `apps/desk/server/comparacion/cruzarExportacion.ts` | `abda23dd…0439` IGUAL | **6** | 81 |
| M6 | `flujoPorClasificacion` usa `flujoDelTicket` con `Ticket creado`, `packages/shared/src/flujos.ts` | `76e8cf41…3b8` IGUAL | **17** | 181 |
| M7 | `urlIndicadores` pierde el parámetro, `apps/desk/src/lib/indicadoresUrl.ts` | `0e31ad23…a21` IGUAL | **3** | 15 |
| M9 | `urlComparacion` pierde el parámetro, `apps/desk/src/lib/comparacionExportacion.ts` | `335c362f…fdeef` IGUAL | **3** | 37 |

Ficheros de prueba ejecutados: M1 `RI` y `SI`; M3 `RI`, `RC` y `SI`; M4 `CE` y `RC`; M6 `FL`, `CE`, `RI` y `RC`; M7 `UI`; M9 `UC`. Los sha256 de
los ficheros mutados (`b284be72…`, `35903eab…`, `c36cc020…`, `c76e0c16…`, `52f72583…`, `0ddcd79b…`) difieren de los originales: la
mutación se aplicó de verdad. `git status` vacío al terminar.

## 6. Regla 13 y regla de mutación 4

**Regla 13 (tabla C1-C7 de apply-progress, línea a línea contra el árbol de hoy).** Coincide:
`routes/indicadores.ts:41` y `routes/indicadoresComparacion.ts:25` son `requireAdmin`; `:42-43` y `:27-28` llaman a `validarFlujo` y
responden el 400; `indicadores.ts:107-111` es `validarFlujo` (`:108`: `undefined` da `null`); `:114-117` y `:115` son `recortarPorFlujo`
(`return e`); `:70` es el único corte por periodo; `routes/indicadores.ts:44` recorta y `:48` nombra el CSV; `routes/indicadoresComparacion.ts:34`,
`:55` (`cruceDeLaPeticion`) y `cruzarExportacion.ts:53` (`cruzarPorFlujo`); serialización `:40`/`:43` y `routes/indicadores.ts:53`;
`flujos.ts:127` es `NOMBRE_FLUJO`. Cliente: `Analisis.tsx:83` (selector y enlace) y `:91` (el componente de comparación con `flujo`), sin clasificar,
recortar ni validar. Ninguna decisión del cliente queda sin línea del servidor; C7 es rótulo, no decisión.

**Regla 4.** `git diff -U0 8a068fe9 HEAD` por fichero de producción, todos en sitio (mismo `k`) o tras la última línea de entonces:
`indicadores.ts` (96→117) `-2 -43 -64,2 -73 -88`, `+97,21`; `routes/indicadores.ts` (55→55) `-7 -42,3 -48 -53`;
`routes/indicadoresComparacion.ts` (51→60) `-3 -8,4 -15 -26,3 -34,2 -40 -43`, `+52,9`; `flujos.ts` (163→175) `-126,2`, `+164,12`;
`cruzarExportacion.ts` (41→68) `-2`, `+42,27`; `ticketsPorId.ts` (19→33) `+20,14`; `indicadoresExportacion.ts` `-16 -21`;
`indicadoresUrl.ts` (18→23) `-3 -5 -8`, `+19,5`; `comparacionExportacion.ts` `-4 -13 -16 -56 -62 -76`; `client.ts` `-897 -899`; `Analisis.tsx`
`-6 -75 -83 -91`; `ComparacionExportacion.tsx` `-9 -20`. Los ocho `*.test.ts` tienen un solo trozo `-N,0` al final. Ningún desplazamiento.
Detector de `pre-push` sobre `488246c3` (`tsx apps/desk/server/citas/cli.ts origin x`): **salida 0**, 7.579 comprobadas, 13 abreviadas rotas
informativas (las de `main`), **0 cabeceras R-1 inválidas**, línea base 0 informadas y 0 caducadas. El detector sólo comprueba que la
línea exista: la lectura de qué afirma cada frase la hizo el apply (barrido de L2, casos A/B/C) y no la rehice cita a cita (hipótesis).

**Lo que la propuesta dejó fuera sigue fuera.** El diff de producción no contiene `INSERT`, `UPDATE`, `DELETE`, `CREATE`, `ALTER`,
`process.env` ni `SALIDAS_`; no hay migraciones, `schema.sql`, `.env.example` ni `DEPLOY.md` en la lista de ficheros tocados; la población
«como Zoho» (P-1) y las alarmas (`sla.ts`) no se tocan. `flujoDelTicket`, `normalizar`, `numerosDeTickets`, `cruzarExportacion` y
`repartirSinCruzar` no aparecen en ningún trozo del diff: sin cambio (`cruzarExportacion.ts` sólo cambia su `import` y añade al final).

## 7. Pasadas de la suite y salvedad del usuario

`npm test` completo sale 1 en esta tanda y en `main` (`126b5ab0`) por `[vitest-worker]: Timeout calling "onTaskUpdate"`. El usuario decidió
partir la suite (2026-10-22). Condiciones: (a) 0 fallidas en cada pasada; (b) los únicos errores son ese timeout; (c) las dos partes
suman al menos 316 ficheros y al menos 5.441 pruebas.

| Pasada | Quién | Comando | Código | Ficheros | Pruebas | Fallidas | Errores | Tiempo |
|---|---|---|---|---|---|---|---|---|
| 1 | verify | `npm test` | 1 | 316 (313/3) | 5.441 (5.430/11) | 0 | 2 x onTaskUpdate | 339,5 s |
| 2 | verify | `npm test` | 1 | 316 (313/3) | 5.441 (5.430/11) | 0 | 1 x onTaskUpdate | 274,7 s |
| 3 | verify | `npm test` | 1 | 316 (313/3) | 5.441 (5.430/11) | 0 | 1 x onTaskUpdate | 279,3 s |
| 4 | orquestador | `npx vitest run apps/desk/server/citas` | 1 | 10 | 129 (129 pasan) | 0 | 1 x onTaskUpdate | 73,6 s |
| 5 | orquestador | `npx vitest run --exclude "apps/desk/server/citas/**"` | 0 | 306 (303/3) | 5.312 (5.301/11) | 0 | 0 | 245,5 s |
| 6 | orquestador | `npm test -- --maxWorkers=8` | 1 | 316 | 5.441 | 0 | 1 x onTaskUpdate | 240,9 s |
| 7 | **verify** | `npx vitest run --exclude "apps/desk/server/citas/**"` | **0** | 306 (303/3) | 5.312 (5.301/11) | 0 | 0 | 279,8 s |
| 8 | **verify** | `npx vitest run apps/desk/server/citas` | 1 | 10 | 129 (129 pasan) | 0 | 2 x onTaskUpdate | 95,2 s |

Pasadas 7 y 8 sobre HEAD `488246c3`: (a) 0 fallidas en las ocho; (b) los únicos errores son el timeout; (c) 306 + 10 = **316 ficheros** y
5.312 + 129 = **5.441 pruebas**. Cumple. Hashes de salida: pasada 1 `09d2ab00…2bb2085`, 2 `19dc9de2…ae9a82`, 3 `e6d6f3f9…1604eca`, 7
`65566118…5d95`, 8 `7d2dcb50…38f7`. El sobre usa la pasada 7 (código 0). Hipótesis del orquestador, no verificada por mí: las pruebas de
citas llaman a git de forma síncrona y bloquean el bucle del worker.

## 8. Coherencia con el diseño

D1-D13 se cumplen en el código: `flujoPorClasificacion` sólo mira la clasificación (`flujos.ts:169`); `FLUJOS` y `NOMBRE_FLUJO` salen de
`flujos.ts:175` y `:127` sin tercera lista; la clasificación entra en la misma consulta (4 consultas); el recorte es puro y devuelve la
misma referencia sin flujo; `cruzarPorFlujo` y `ticketsConClasificacion` se llaman sólo con flujo; las claves `flujo` y `deOtroFlujo`
sólo aparecen con flujo. Desviaciones: ninguna de código (apply-progress, sección «Desviaciones del diseño»).

## 9. Hallazgos

### CRITICAL
Ninguno.

### WARNING
**W1 · La justificación de RQ-KP-32 y D6 («recortar antes llevaría un ticket de otro flujo a “fuera del periodo”») es imprecisa.**
`apps/desk/server/routes/indicadoresComparacion.ts:56-59`: si se recortara `entradas.tickets` antes de cruzar, el SR del periodo caería en
`sinCruzar`, `ticketsConClasificacion` lo devolvería con su clasificación (`:59`) y `cruzarPorFlujo` lo mandaría igualmente a `deOtroFlujo`
(`apps/desk/server/comparacion/cruzarExportacion.ts:53-68`, `flujoDe` por `existentes`). El cuerpo del POST sería el mismo; sólo cambian
los «ID» de la sentencia por bloque. La frase sólo vale para el reparto de hoy, sin clasificación (`repartirSinCruzar`). Es una
justificación imprecisa de la spec, no un defecto de comportamiento: el requisito «cruzar con todos y repartir después» se cumple.
Consecuencia: la mutación M4 «recortar antes» es observacionalmente equivalente en el cuerpo y la fijan sólo aserciones sobre los
parámetros SQL (`RC:362`, `RC:488`), acopladas a la implementación. Propuesta: reformular la frase en la spec viva al archivar (la razón
real es no cambiar la sentencia ni el número de «ID» sin flujo) o añadir un escenario de cuerpo que dependa de ello.

### SUGGESTION
**S1 (fuera de alcance, para la bandeja).** Las pruebas de `apps/desk/server/citas` provocan el `Timeout calling "onTaskUpdate"` en la suite
completa. Fallo previo a la tanda, también en `main` `126b5ab0`: por separado (pasadas 4, 5, 7 y 8) suman 316 ficheros y 5.441 pruebas con 0
fallidas. Hasta resolverlo, `npm test` no sale 0 y se asienta con esta salvedad.
**S2 (forma).** `RI:312` usa 4 tickets y no los «diez con transiciones» del escenario «Cuatro consultas con y sin flujo»; el recuento
exacto con 2 y 20 tickets está en `SI:222`. Cubierto, pero el GIVEN literal no coincide.

## 10. Veredicto

**PASS CON AVISOS.** 0 CRITICAL, 1 WARNING, 2 SUGGESTION. 5/5 requisitos, 27/27 escenarios, 44/44 tareas. Códigos: suite partida 0 (con la
parte de citas en 1 por el timeout aceptado), typecheck 0, lint 0 (165 avisos), build 0, detector 0. Siguiente: `sdd-archive`. Archivar no
da por hecha la prueba en la app del selector (`.tsx`, F0-00), que sigue en la lista acumulada de pruebas en la app. La reformulación de
W1 puede entrar en la fusión del delta.
