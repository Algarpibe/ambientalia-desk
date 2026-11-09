# Informe de verificación — `calificaciones-cuadre-conversaciones` (`fuera-del-plan`, `cierra: no`)

**Veredicto: PASS con avisos.** 0 CRITICAL, 3 WARNING, 4 SUGGESTION.
**Revisión verificada:** `e9468199` (partida de la tanda `79546497`; código en `e3fe1238` a `e9468199`). **Fecha:** 2026-11-09. **Intento:** verify.
**Escenarios:** 34 de 34 CUMPLE (MODIFIED RQ-ZS-26 y RQ-ZS-28; ADDED RQ-ZS-48 a RQ-ZS-51). **CA-1 a CA-10:** 9 CUMPLE y 1 PARCIAL (CA-10, por `npm test` entero,
detector y build, que son del orquestador y no se corrieron aquí). **Mutaciones reproducidas aquí:** 10 (todas con rojo y restauradas con el mismo `sha256sum` y CRLF;
`git status --short` vacío al final). **Focal corrida aquí:** 39 ficheros (37 pasan, 2 saltados por diseño), 484 pruebas verdes y 7 saltadas.
`npm run typecheck` salida 0; `npm run lint -- --max-warnings 165` salida 0 con «165 problems (0 errors, 165 warnings)».
Método: se leyó el código de producción y de las pruebas, no los informes; las mutaciones son distintas de las del orquestador (M-2, R-1, P-1a, R-2 B) salvo R-1, que se repite
porque es el único caso de la regla de mutación 2 del cambio.

## 1 · Criterios de aceptación

| CA | Prueba que lo fija | Veredicto y razón |
|---|---|---|
| CA-1 (a), tres vías | relleno `apps/desk/server/rellenoConversacionesCalificaciones.test.ts:54`; pasada periódica y `syncConversations`, un mismo `describe.each` en `packages/zoho-sync/src/conversacionesCalificaciones.test.ts:115` con el `it` de `packages/zoho-sync/src/conversacionesCalificaciones.test.ts:116`; directa en `packages/zoho-sync/src/conversacionesCalificaciones.test.ts:73` | CUMPLE. Fixture: Zoho cuenta 2 (`commentCount` 2, `threadCount` 0), la lista trae `r1`, `r2` y la calificación; la cuarta (`vieja`) se marca y la calificación no. Las tres vías pasan por su propio camino: `crearRellenoConversaciones` con `createSync` real, `crearPasadaConversaciones` y `createSync(...).syncConversations` |
| CA-2 (b), tres vías | relleno `apps/desk/server/rellenoConversacionesCalificaciones.test.ts:64`; las otras dos vías en `packages/zoho-sync/src/conversacionesCalificaciones.test.ts:125` (dos ejecuciones); directa `packages/zoho-sync/src/conversacionesCalificaciones.test.ts:98` | CUMPLE. Es el fixture de S-1: Zoho cuenta 3 (2 + 1), la lista trae 2 reales y 1 calificación (=3) y falta la real `falta`. No se marca nada y el log dice «recibidos 2» y «Zoho cuenta 3». Con la producción quitada (M-0) y con `recibidos.size` (M-1) se ponen rojas |
| CA-3 | `packages/zoho-sync/src/conversacionesCalificaciones.test.ts:73` (recibida nunca se marca) y `packages/zoho-sync/src/conversacionesCalificaciones.test.ts:80` (guardada ausente se marca y reaparecida se desmarca) | CUMPLE. Segunda llamada con `cal` de vuelta: `marcadas: []` y `ausente_en_zoho_at` vuelve a nulo |
| CA-4 | `apps/desk/server/rellenoConversacionesCalificaciones.test.ts:76` | CUMPLE. Con `marcar` apagado y una calificación visible, la verificación da «completo» y `descuadrados` vacío; `apps/desk/server/rellenoConversaciones.ts:76` y `apps/desk/server/rellenoConversaciones.ts:77` usan el mismo `esCalificacion` |
| CA-5 | las pruebas existentes de las tres vías y del relleno; la focal de aquí | CUMPLE. `git diff --stat 79546497 HEAD` sólo edita dos pruebas existentes en sitio (guardas del árbol); `packages/zoho-sync/src/conversaciones.test.ts`, `apps/desk/server/rellenoConversaciones.test.ts` y `apps/desk/server/rellenoConversacionesRutas.test.ts` intactas y verdes |
| CA-6 | `packages/zoho-sync/src/conversacionesCalificaciones.test.ts:41` (objeto y texto), `packages/zoho-sync/src/conversacionesCalificaciones.test.ts:46` (diez negativos) y `packages/zoho-sync/src/conversacionesCalificaciones.test.ts:59` (`contadasPorZoho`) | CUMPLE. Tabla con minúsculas, espacio inicial, lista, nulo, sin canal, número y JSON de una cadena |
| CA-7 | `apps/desk/server/rellenoConversacionesResumen.test.ts:74`, `apps/desk/server/rellenoConversacionesResumen.test.ts:89`, `apps/desk/server/rellenoConversacionesResumen.test.ts:132`, `apps/desk/server/rellenoConversacionesResumen.test.ts:157`, `apps/desk/server/rellenoConversacionesResumen.test.ts:233`, `apps/desk/server/rellenoConversacionesResumen.test.ts:275`; `apps/desk/server/rellenoConversacionesResumenRutas.test.ts:34` | CUMPLE. Fila con `terminadaAt` nulo mientras espera la primera petición, completada al terminar; segunda instancia sobre la misma base la devuelve sin llamar a Zoho; base que rechaza y `avisar` que lanza no cortan; `limite: 0` no escribe; marcadores de asunto, contacto y empresa ausentes |
| CA-8 | `apps/desk/server/rellenoConversacionesNumeros.test.ts:61`, `apps/desk/server/rellenoConversacionesNumeros.test.ts:80`, `apps/desk/server/rellenoConversacionesNumeros.test.ts:122`, `apps/desk/server/rellenoConversacionesNumeros.test.ts:153`; posición desde `apps/desk/server/rellenoConversacionesNumeros.test.ts:188` hasta la línea 216 del mismo fichero | CUMPLE. Orden ascendente, `noEncontrados`, `limite=0` sin Zoho ni fila, seis `400` (vacío, letra, coma doble, 201, repetido, junto a `desde`) y el orden `401`, `403` de rol, `503`, `403` del interruptor, `400` con dos guardas activas a la vez |
| CA-9 | `packages/zoho-sync/src/db/rellenoConversacionesPasadas.test.ts:28`; guardián de `packages/zoho-sync/src/db/migrate.test.ts:266` | CUMPLE. Mutación R-1 de la sección 4: con el `CREATE` sin calificar se ponen rojas las dos |
| CA-10 | `apps/desk/server/deployCalificacionesConversaciones.test.ts:40`; guardas del árbol en sitio; typecheck y lint aquí | PARCIAL. §25 y su prueba, guardas en sitio, typecheck 0 y lint 165 comprobados aquí; `npm test` entero, detector y build, del orquestador |

## 2 · Escenarios de la delta

Lo que sigue se refiere a `openspec/changes/calificaciones-cuadre-conversaciones/specs/zoho-sync/spec.md`.

| Requisito y escenario | Prueba | Veredicto |
|---|---|---|
| RQ-ZS-26 (MODIFIED): los ocho escenarios existentes (el #958, recuento que no coincide, ausente, parcial, `marcar` apagado, reaparece, App y guardadas durante la lectura, id repetido) | `packages/zoho-sync/src/conversaciones.test.ts:199`, `packages/zoho-sync/src/conversaciones.test.ts:210`, `packages/zoho-sync/src/conversaciones.test.ts:221`, `packages/zoho-sync/src/conversaciones.test.ts:236` y el resto del bloque | CUMPLE. Sin editar, verdes. El criterio cambia por `contadas === esperado` en `packages/zoho-sync/src/conversaciones.ts:120`; para marcar se sigue usando `recibidos` (`packages/zoho-sync/src/conversaciones.ts:135`) |
| RQ-ZS-28 (MODIFIED): los diez escenarios del relleno (orden, `desde` y `limite`, completo, descuadrado, sin recuento, error, no está, `managed_by_app`, lo visible tras marcar, sin datos de cliente) | `apps/desk/server/rellenoConversaciones.test.ts:97`, `apps/desk/server/rellenoConversaciones.test.ts:204`, `apps/desk/server/rellenoConversaciones.test.ts:277`, `apps/desk/server/rellenoConversaciones.test.ts:380` | CUMPLE. Sin editar, verdes. Sólo cambia la fuente de `visibles` |
| RQ-ZS-48: (a) en relleno, pasada periódica y `syncConversations` | `apps/desk/server/rellenoConversacionesCalificaciones.test.ts:54`; `packages/zoho-sync/src/conversacionesCalificaciones.test.ts:116` (dos vías) | CUMPLE |
| RQ-ZS-48: (b) en las tres vías | `apps/desk/server/rellenoConversacionesCalificaciones.test.ts:64`; `packages/zoho-sync/src/conversacionesCalificaciones.test.ts:125` (dos vías) | CUMPLE |
| RQ-ZS-48: recibida nunca se marca; guardada ausente sí y se desmarca | `packages/zoho-sync/src/conversacionesCalificaciones.test.ts:73` y `packages/zoho-sync/src/conversacionesCalificaciones.test.ts:80` | CUMPLE |
| RQ-ZS-48: la verificación del relleno da «completo» | `apps/desk/server/rellenoConversacionesCalificaciones.test.ts:76` | CUMPLE |
| RQ-ZS-48: sin calificaciones, como hoy | pruebas existentes de las tres vías | CUMPLE |
| RQ-ZS-48: objeto y texto; canal distinto, ausente o `raw` nulo | `packages/zoho-sync/src/conversacionesCalificaciones.test.ts:41` y `packages/zoho-sync/src/conversacionesCalificaciones.test.ts:46` | CUMPLE |
| RQ-ZS-49: fila al lanzar y completada al terminar | `apps/desk/server/rellenoConversacionesResumen.test.ts:74` y `apps/desk/server/rellenoConversacionesResumen.test.ts:89` | CUMPLE |
| RQ-ZS-49: una instancia nueva devuelve la última | `apps/desk/server/rellenoConversacionesResumen.test.ts:132`; `apps/desk/server/rellenoConversacionesResumenRutas.test.ts:34` | CUMPLE |
| RQ-ZS-49: un fallo al escribir no corta | `apps/desk/server/rellenoConversacionesResumen.test.ts:157`, `apps/desk/server/rellenoConversacionesResumen.test.ts:175`, `apps/desk/server/rellenoConversacionesResumen.test.ts:187` | CUMPLE |
| RQ-ZS-49: `limite=0` no escribe y un fallo de lectura no tumba el `GET` | `apps/desk/server/rellenoConversacionesResumen.test.ts:233`, `apps/desk/server/rellenoConversacionesResumen.test.ts:241`; `apps/desk/server/rellenoConversacionesResumenRutas.test.ts:56`, `apps/desk/server/rellenoConversacionesResumenRutas.test.ts:67` | CUMPLE |
| RQ-ZS-49: sin datos de cliente | `apps/desk/server/rellenoConversacionesResumen.test.ts:275` | CUMPLE |
| RQ-ZS-49: tabla calificada y guardián que discrimina | `packages/zoho-sync/src/db/rellenoConversacionesPasadas.test.ts:21`, `packages/zoho-sync/src/db/rellenoConversacionesPasadas.test.ts:28`, `packages/zoho-sync/src/db/rellenoConversacionesPasadas.test.ts:34`, `packages/zoho-sync/src/db/rellenoConversacionesPasadas.test.ts:41`, `packages/zoho-sync/src/db/rellenoConversacionesPasadas.test.ts:45` | CUMPLE |
| RQ-ZS-50: recorre sólo esos, ascendente | `apps/desk/server/rellenoConversacionesNumeros.test.ts:61` y `apps/desk/server/rellenoConversacionesNumeros.test.ts:134` | CUMPLE |
| RQ-ZS-50: `limite=0` cuenta y nombra los inexistentes | `apps/desk/server/rellenoConversacionesNumeros.test.ts:122` y `apps/desk/server/rellenoConversacionesNumeros.test.ts:100` | CUMPLE |
| RQ-ZS-50: `400` de vacío, mal formado, 201 o junto a `desde`; 200 no dan `400` | `apps/desk/server/rellenoConversacionesNumeros.test.ts:153` y `apps/desk/server/rellenoConversacionesNumeros.test.ts:177` | CUMPLE |
| RQ-ZS-50: posición con dos guardas activas | `apps/desk/server/rellenoConversacionesNumeros.test.ts:185` | CUMPLE (mutación P-1c de la sección 4) |
| RQ-ZS-51: la sección existe y cubre lo obligatorio; quitar una parte la pone roja | `apps/desk/server/deployCalificacionesConversaciones.test.ts:40`, `apps/desk/server/deployCalificacionesConversaciones.test.ts:45`, `apps/desk/server/deployCalificacionesConversaciones.test.ts:51`, `apps/desk/server/deployCalificacionesConversaciones.test.ts:57`, `apps/desk/server/deployCalificacionesConversaciones.test.ts:62`, `apps/desk/server/deployCalificacionesConversaciones.test.ts:67` | CUMPLE (mutaciones R-2 A, D y E de la sección 4) |

## 3 · Strict TDD

### TDD Compliance
| Check | Resultado | Detalle |
|---|---|---|
| Evidencia TDD reportada | ⚠️ | `openspec/changes/calificaciones-cuadre-conversaciones/apply-progress.md` no trae una tabla «TDD Cycle Evidence»; trae, por lote, un bloque «Rojo → verde» con la aserción fallida de cada prueba. El contenido equivale; el formato no es el de la plantilla (W-3) |
| Todas las tareas tienen prueba | ✅ | L1 a L4: 76 pruebas nuevas en 8 ficheros nuevos |
| RED confirmado | ✅ | Los 8 ficheros existen. Rojo declarado: L1 24 de 24, L2 21 de 21, L3 19 de 25 (las 6 restantes son caracterización declarada), L4 5 de 5 |
| GREEN confirmado | ✅ | 484 pruebas verdes en la focal de aquí; ninguna roja |
| Triangulación | ✅ | Tablas de 2 y 10 casos para el predicado; (a) y (b) con valores distintos; seis `400` distintos; cuatro escalones de posición |
| Safety net de los ficheros modificados | ⚠️ | Las suites existentes se corrieron después de editar (395 verdes en L1, 1.112 en L2); `apply-progress.md` no dice que se corrieran antes de la primera edición |

**Producción quitada, reproducido aquí (M-0).** Con `esCalificacion` sin acierto (`'FEEDBACK'` por `'FEEDBACKX'` en `packages/zoho-sync/src/conversaciones.ts:186`) la focal de L1 da 14 rojas de 106 **por aserción**, no por import: `expected [] to deeply equal [ 'vieja' ]`, `expected [ 'falta' ] to deeply equal []`, `expected false to be true`, `expected 3 to be 2` y `expected { completo: +0, descuadrado: 1, …(3) } to match object { completo: 1, descuadrado: +0 }`. Restaurado.

### Test Layer Distribution
| Capa | Pruebas | Ficheros | Herramienta |
|---|---|---|---|
| Unidad | 28 | 3 | vitest (predicado, `contadasPorZoho`, guardas del esquema y del `DEPLOY.md`) |
| Integración | 48 | 5 | vitest con pg-mem, `createSync` real y supertest sobre `createApp` |
| E2E | 0 | 0 | no hay; las `.tsx` están fuera de la red por decisión de Gerencia |
| **Total** | **76** | **8** | |

### Assertion Quality
**Assertion quality**: ✅ todas las aserciones verifican comportamiento real. Cero tautologías, cero `toBeDefined` solos, cero `vi.mock` (los 8 ficheros usan pg-mem y `createSync` reales). Los `toEqual([])` de `packages/zoho-sync/src/conversacionesCalificaciones.test.ts:87`, `packages/zoho-sync/src/conversacionesCalificaciones.test.ts:94`, `packages/zoho-sync/src/conversacionesCalificaciones.test.ts:131`, `apps/desk/server/rellenoConversacionesCalificaciones.test.ts:61`, `apps/desk/server/rellenoConversacionesCalificaciones.test.ts:69` y `apps/desk/server/rellenoConversacionesCalificaciones.test.ts:80` tienen su compañera no vacía en la prueba (a) de la misma vía. Sin bucles que pudieran quedar vacíos.
**Cobertura de ficheros cambiados:** no medida (no se corrió herramienta de cobertura en esta fase; no es un fallo).

## 4 · Mutaciones reproducidas aquí

Procedimiento: `sha256sum` y `file` antes, copia al scratchpad, `perl -i -p <fichero.pl>`, focal, restauración con `cp`, mismo `sha256sum` y CRLF. Al final `git status --short` vacío.

| Id | Lote | Fichero y línea | Mutación | Rojas | Restaurado |
|---|---|---|---|---|---|
| M-1 | L1 | `packages/zoho-sync/src/conversaciones.ts:120` | `contadas === esperado` por `recibidos.size === esperado` | 10 de 106: (a) y (b) en las tres vías y 4 directas | `0c699615ba82aa6b`, CRLF |
| M-0 | L1 | `packages/zoho-sync/src/conversaciones.ts:186` | `'FEEDBACK'` por `'FEEDBACKX'` (producción quitada) | 14 de 106, por aserción | igual |
| P-3 | L2 | `apps/desk/server/rellenoConversacionesResumen.ts:65` | `abrir` después de `await correr()` (regla 1) | 4 de 281: «fila al lanzar» (dos) y «completa al terminar» (dos) | `62a7b722b9115dcb`, CRLF |
| M-7 | L2 | `apps/desk/server/rellenoConversacionesResumen.ts:64` | `limite === 0` por `false` | 2: «`limite: 0` no deja fila» con guarda falsa y con base real | igual |
| R-1 | L2 | `packages/zoho-sync/src/db/schema.sql:857` | `EXISTS public.relleno` por `EXISTS relleno` (regla 2) | 2 de 231: guardián de `packages/zoho-sync/src/db/migrate.test.ts:266` y «el CREATE va calificado» | `4dbde11e45095173`, CRLF |
| M-8 | L3 | `apps/desk/server/rellenoConversaciones.ts:60` | quitar la conjunción de `numeros` | 6 de 86: módulo (4) y ruta con `limite=0` (2) | `33c52d23bcb22697`, CRLF |
| P-1c | L3 | `apps/desk/server/routes/rellenoConversaciones.ts:36` | validador de `numeros` DELANTE de `requireSuperAdmin` (regla 1) | 12 de 86; entre ellas las de posición: 403 de rol, 503 del modo y 403 del interruptor | `2f9c3a6233ba2cbb`, CRLF |
| R-2 A | L4 | `DEPLOY.md:1083` | encabezado «Qué se rompe si se pone mal» renombrado | 5 de 11 | `065d944f6f252c38`, CRLF |
| R-2 D | L4 | `DEPLOY.md:1083` | `numeros` por `otros` sólo en ese apartado | 3 de 11 | igual |
| R-2 E | L4 | `DEPLOY.md:1072` | «No hay interruptor nuevo» por «Hay un interruptor nuevo» | 5 de 11 | igual |

Nota sobre P-1c: el mutante responde `400` con cuerpo vacío, así que también ponen en rojo los cinco `400` por el texto. Lo que fija la POSICIÓN son las tres de guarda con `numeros=x`
(403 de rol, 503 y 403 del interruptor), que caen por llegar al `400` antes que a su guarda. La `401` no cae porque el mutante va detrás de `requireAuth`; la cubre P-1d, que el apoyo
declara y que aquí no se reprodujo. **Ninguna de las diez sobrevivió.** Sobrevive la declarada R-2 C (la frase «contacto y cuenta» está dos veces en `DEPLOY.md`); no se reprodujo aquí (W-1).

## 5 · Regla invariable 13 y regla de mutación 3, decisión a decisión

`git diff --stat 79546497 HEAD -- apps/desk/src` está vacío: el cliente no cambia ni consume nada nuevo. Cada decisión del cambio es del servidor; ninguna tiene espejo en el cliente.

| Decisión | Línea del servidor que la impone | Prueba |
|---|---|---|
| Qué es una calificación (`channel === 'FEEDBACK'` exacto) | `packages/zoho-sync/src/conversaciones.ts:186`, en `esCalificacion` (`packages/zoho-sync/src/conversaciones.ts:182`) | `packages/zoho-sync/src/conversacionesCalificaciones.test.ts:46` |
| Cuándo el cuadre es completo (sin error, recuento presente, ids únicos sin calificaciones = recuento) | `packages/zoho-sync/src/conversaciones.ts:119` y `packages/zoho-sync/src/conversaciones.ts:120`; `contadasPorZoho` en `packages/zoho-sync/src/conversaciones.ts:190` | `packages/zoho-sync/src/conversacionesCalificaciones.test.ts:116` |
| Qué se marca (con lista completa, toda fila de Zoho anterior al inicio que no vino, calificaciones incluidas) | `packages/zoho-sync/src/conversaciones.ts:135` y `packages/zoho-sync/src/conversaciones.ts:136` (el `Set` `recibidos` es el de TODOS los ids, línea 119 del mismo fichero) | `packages/zoho-sync/src/conversacionesCalificaciones.test.ts:73` |
| Qué cuenta la verificación del relleno | `apps/desk/server/rellenoConversaciones.ts:76` y `apps/desk/server/rellenoConversaciones.ts:77` | `apps/desk/server/rellenoConversacionesCalificaciones.test.ts:76` |
| `numeros`: formato, tope de 200, repetidos, ascendente | `apps/desk/server/routes/rellenoConversaciones.ts:52` y `apps/desk/server/routes/rellenoConversaciones.ts:57` | `apps/desk/server/rellenoConversacionesNumeros.test.ts:153` |
| `400` de `numeros`, también junto a `desde` | `apps/desk/server/routes/rellenoConversaciones.ts:38` | `apps/desk/server/rellenoConversacionesNumeros.test.ts:153` |
| Orden de guardas (401, 403 de rol, 503, 403 del interruptor, 400) | `apps/desk/server/routes/rellenoConversaciones.ts:36` (cadena de middleware) y `apps/desk/server/routes/rellenoConversaciones.ts:38` | `apps/desk/server/rellenoConversacionesNumeros.test.ts:185` |
| Qué recorre la pasada con `numeros` y qué nombra como inexistente | `apps/desk/server/rellenoConversaciones.ts:60`, `apps/desk/server/rellenoConversaciones.ts:61` y `apps/desk/server/rellenoConversaciones.ts:144` | `apps/desk/server/rellenoConversacionesNumeros.test.ts:61` |
| Guardado del resumen (cuándo se escribe, que no rechaza, que `limite=0` no escribe) | `apps/desk/server/rellenoConversacionesResumen.ts:63` a `apps/desk/server/rellenoConversacionesResumen.ts:68`; enganche en `apps/desk/server/rellenoConversaciones.ts:144` | `apps/desk/server/rellenoConversacionesResumen.test.ts:249` |
| `GET` con `ultimaGuardada`, que nunca lanza ni tumba | `apps/desk/server/routes/rellenoConversaciones.ts:46` a `apps/desk/server/routes/rellenoConversaciones.ts:48`; `ultima` en `apps/desk/server/rellenoConversacionesResumen.ts:48` | `apps/desk/server/rellenoConversacionesResumenRutas.test.ts:56` |

## 6 · Ediciones en sitio (`git diff --numstat 79546497 HEAD`)

| Fichero | Antes → después | Inserciones / borrados | Veredicto |
|---|---|---|---|
| `packages/zoho-sync/src/conversaciones.ts` | 175 → 192 | 22 / 5 | CUMPLE: 5 en sitio (líneas 106, 107, 119, 120, 124) y 17 al final |
| `apps/desk/server/rellenoConversaciones.ts` | 154 → 154 | 24 / 24 | CUMPLE: sólo en sitio |
| `apps/desk/server/routes/rellenoConversaciones.ts` | 49 → 59 | 18 / 8 | CUMPLE: las líneas 1 a 49 conservan su número; lo nuevo, tras la 49 |
| `packages/zoho-sync/src/db/migrate.ts` | 131 → 131 | 1 / 1 | CUMPLE (línea 73) |
| `packages/zoho-sync/src/db/schema.sql` | 852 → 862 | 10 / 0 | CUMPLE: sólo al final; el `CREATE` es la última sentencia |
| `DEPLOY.md` | 1066 → 1110 | 44 / 0 | CUMPLE: sólo al final (§25) |
| `packages/zoho-sync/src/db/migrate.test.ts` | 911 → 911 | 16 / 16 | CUMPLE: guardas del árbol en sitio |
| `apps/desk/server/deployModoSinZoho.test.ts` | 73 → 73 | 6 / 6 | CUMPLE |
| `packages/zoho-sync/src/sync.ts` y `apps/desk/src` | — | 0 / 0 | CUMPLE: no cambian |

Los ocho ficheros editados tienen CRLF y ningún retorno de carro suelto (contado con perl).

## 7 · Barrido de citas (regla de mutación 4)

Método: script propio sobre todo el repositorio (sin `node_modules`; con `openspec/changes/archive/`, `docs/` y el propio cambio), con rangos y listas separadas por comas, contra las líneas editadas
de cada fichero y, para `DEPLOY.md` y `schema.sql`, contra lo añadido; segundo pase de abreviadas sobre los seis de Supervisión. Resultado: **360 citas** caen en líneas editadas o añadidas;
ninguna apunta a una línea vacía o inexistente y ninguna está en código ni en comentarios.

| Grupo | Cuántas | Caso |
|---|---|---|
| El propio cambio (propuesta, diseño, tareas, apply-progress) | 102 | las de diseño y tareas, A; las de la propuesta que describen `79546497`, B al archivar |
| `openspec/changes/archive/` | 227 | registros fechados: B las que afirman el estado de su fecha; A las que citan una posición que se conserva (la línea 76 de `apps/desk/server/rellenoConversaciones.ts`, el `GET` y el recuento de la ruta) |
| `docs/sdd/Paquete_de_Despliegue_*.md` | 18 | las de `packages/zoho-sync/src/conversaciones.ts` 119-127 (30/10 y 02/11): B; las de la ruta y del relleno del 03/11 y las de `packages/zoho-sync/src/db/migrate.ts` 70-73 y 73: A por posición |
| `openspec/specs/` vivas | 6 | `openspec/specs/zoho-sync/spec.md:745`, `openspec/specs/zoho-sync/spec.md:765`, `openspec/specs/gases-patron/spec.md:56`, `openspec/specs/remisiones/spec.md:857` y `openspec/specs/tickets-core/spec.md:1522`: A (posición de las listas); `openspec/specs/gases-patron/spec.md:198`: B («contadores medidos sobre `f5255d2`») |
| `DEPLOY.md` (la §25 nueva) | 3 | `DEPLOY.md:1080`, `DEPLOY.md:1081` y `DEPLOY.md:1083`, A: `packages/zoho-sync/src/db/schema.sql:857` es el `CREATE`; `apps/desk/server/routes/rellenoConversaciones.ts:47` el `GET`; `apps/desk/server/routes/rellenoConversaciones.ts:38` el `400` |
| Cuatro de los seis de Supervisión | 4 (más 2 abreviadas) | tabla siguiente |

### Citas para Supervisión

| Fichero de Supervisión y línea | Cita | Línea a la que apuntaría hoy | Caso |
|---|---|---|---|
| `docs/sdd/ENTRADA.md:2411` | `packages/zoho-sync/src/conversaciones.ts:120-127` («sólo corre cuando lo recibido cuadra con `esperadoDeZoho`») | misma, 120 a 127; hoy cuadra `contadas` (sin calificaciones) con `esperado` | B: cierta de su fecha (el defecto de las calificaciones); anclar en `79546497`; no renumerar |
| `docs/sdd/ENTRADA.md:2414` | `packages/zoho-sync/src/conversaciones.ts:120` («el criterio es `recibidos.size === esperado`») | misma; hoy `contadas === esperado` | B: falsa hoy, cierta en `79546497`; anclar |
| `openspec/config.yaml:6310` | `packages/zoho-sync/src/conversaciones.ts:120` («`recibidos.size === esperado`») | misma | B: ídem; es el «QUÉ SE CONSTRUYE» de `decision/calificaciones-y-borrados-de-zoho` y su fecha es el 08/11 |
| `openspec/config.yaml:707` | la línea 282 (forma abreviada, sin nombre de fichero) de `packages/zoho-sync/src/db/migrate.test.ts` («reparto 10+16+3=29») | la misma línea 282, hoy con `[10, 35, 3]` (48 tablas) | B: el 29 era cierto de su fecha y es falso hoy; la prueba sigue en esa línea |
| `CLAUDE.md:197` | `packages/zoho-sync/src/db/migrate.ts:63-64,70-73,80` (las tres listas de tablas) | las mismas; `PUBLIC_TABLES` ganó un elemento en la línea 73 | A: la posición y la afirmación siguen ciertas (la colisión `contacts` no cambia) |
| `CLAUDE.md:195` | las líneas 286 y 319 (formas abreviadas) «de la revisión citada originalmente» de `packages/zoho-sync/src/db/migrate.test.ts` | — | B ya declarada en la propia frase (revisión anterior); sin acción |

`docs/sdd/F0-05_Bloques_para_ClaudeCode.md`, `docs/sdd/F0-05_Mecanismo_de_Reconciliacion.md` y `docs/sdd/R08.4_Expediente_de_cambios.md`: 0 citas en líneas editadas. Nota, no cita:
`DEPLOY.md:888` dice que el `GET` «sólo devuelve el estado»; la §25 lo precisa (SUGGESTION S-1).

## 8 · Hipótesis, SQL y tareas de persona

**S-2 es hipótesis.** La búsqueda de `FEEDBACK` en `packages` y `apps` (sin `node_modules`) da sólo la producción (`packages/zoho-sync/src/conversaciones.ts:186`) y tres ficheros de prueba nuevos: no hay ningún
fixture real de una conversación con ese canal; el único respaldo es la medida del analista (`docs/sdd/ENTRADA.md:2410`). **Falla seguro**: con otro canal o campo, la calificación cuenta como hoy y el ticket
sigue sin marcarse; el caso (b) muestra que nunca se marca de más. La mide P-1.

**SQL.** Las dos de la propuesta (apartado 8 de `openspec/changes/calificaciones-cuadre-conversaciones/proposal.md`) son de sólo lectura (`BEGIN READ ONLY;`, `ROLLBACK;` y `\q`) y casan con la topología:
`desk.tickets` (`number`, `raw`, `managed_by_app`; `packages/zoho-sync/src/db/schema.sql:41`) y `desk.conversations` (`kind`, `source`, `raw`, `ausente_en_zoho_at`, `ticket_id`;
`packages/zoho-sync/src/db/schema.sql:46`). La de P-3 descuenta el canal `FEEDBACK` con el mismo criterio que el predicado y protege los recuentos con una expresión regular de dígitos. La consulta de
`DEPLOY.md` (de `DEPLOY.md:1093` a `DEPLOY.md:1096`) lee `public.relleno_conversaciones_pasadas`, también con `BEGIN READ ONLY;`, `ROLLBACK;` y `\q`; sus columnas existen en
`packages/zoho-sync/src/db/schema.sql:858`. Sin hallazgos.

## 9 · Hallazgos

**CRITICAL: ninguno.**

**WARNING**
- **W-1.** La mutación R-2 C (la frase «contacto y cuenta» de `DEPLOY.md`) sobrevive por diseño: aparece dos veces. Declarada en `apply-progress.md`, no reproducida aquí. No afecta a ningún CA.
- **W-2.** S-2 sigue sin fixture real (sección 8). Hasta que P-1 se corra, el cambio no está comprobado en producción. Dueño: Alfonso.
- **W-3.** `apply-progress.md` no usa la tabla «TDD Cycle Evidence» y no declara el safety net previo a editar los ficheros existentes (sección 3). El rojo previo de cada lote sí está, por aserción.

**SUGGESTION**
- **S-1.** `DEPLOY.md:888` queda impreciso sobre el `GET`; la §25 lo declara. Supervisión puede anotar el cruce al archivar.
- **S-2.** Medir cobertura de los ficheros cambiados cuando haya herramienta instalada.
- **S-3.** La mutación P-1c pone en rojo cinco `400` por el cuerpo del mutante y no por la posición; las tres pruebas de posición son las que cuentan. Una variante que conserve el texto del `400` aislaría mejor la posición.
- **S-4.** La consulta P-3 de la propuesta ya avisa de que un `managed_by_app` no refresca su `raw`; la medida de E-257 puede salir con recuento viejo.

## 10 · Para el orquestador

PASS con avisos. 0 CRITICAL, 3 WARNING, 4 SUGGESTION. Quedan del orquestador: `npm test` entero a log, `npm run build`, el detector de citas sobre el commit del verify y la medida del intento
(este informe suma al ledger). Las tareas de persona P-1 a P-3 siguen fuera del recuento; archivar no las da por hechas.
