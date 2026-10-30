# Informe de verificación — `sync-conversaciones-zoho` (1G-01, `cierra: no`)

- Cambio: `sync-conversaciones-zoho`. Rama `sync-conversaciones-zoho`, HEAD `e91d7962`, partida `b4255928`. Fecha: 2026-10-29.
- Modo: `strict_tdd` activo, verificación independiente (no se tomó `apply-progress.md` como prueba; se reprodujo).
- Tareas: L1.1-L1.15 y L2.1-L2.15 marcadas (30/30). Las tareas de persona P-1 a P-4 están fuera del recuento (regla del ciclo 1).

## Veredicto: PASS WITH WARNINGS

0 CRITICAL · 4 WARNING · 3 SUGGESTION. Las nueve mutaciones pedidas se reprodujeron y cada una puso al menos una prueba en rojo.
Tres mutaciones adicionales (pausas y un `catch` redundante) sobreviven: ver W-1 y S-1.

## Las cinco comprobaciones sobre HEAD, en serie

| Comprobación | Salida | Resultado |
|---|---|---|
| `npm run typecheck` | 0 | sin errores |
| `npm run lint -- --max-warnings 165` | 0 | 165 avisos, 0 errores (umbral 165) |
| `tsx apps/desk/server/citas/cli.ts --sha HEAD < /dev/null` | 0 | sin bloqueo |
| `npm test` (1.ª pasada) | **1** | 331 ficheros pasan, 4 saltados; 5.772 pruebas pasan, 26 saltadas; único fallo: `Errors 1` = `[vitest-worker]: Timeout calling "onTaskUpdate"`, ninguna prueba roja. 323,98 s. Log `scratchpad/npmtest-scz-verify-213545.log` |
| `npm test` (2.ª pasada, reintento único) | 0 | mismas cifras, 302,76 s, sin errores. Log en la ruta de `scratchpad/scz-verify-lastlog2.txt` |
| `npm run build` | 0 | `dist/assets/index-F1jDYjEU.js` + `index-BXv9vVDm.css`: el bundle no cambia, como se esperaba |

Memoria física libre antes de las pasadas: 14.312 MB y 15.865 MB (ambas por encima de 12.000 MB). Cifras: 5.798 pruebas = 5.732 de
partida + 66 nuevas (33 + 10 + 11 + 3 + 2 + 4 + 3), coincide con `apply-progress.md`. Ficheros 335 = 329 + 6 nuevos.

## Cobertura de la spec (escenario → prueba → ¿asserta el ENTONCES?)

Todas pasan en la ejecución dirigida (7 ficheros, 79 pruebas) y en las dos pasadas completas.

### RQ-ZS-25

| Escenario | Prueba | Veredicto |
|---|---|---|
| 250 en tres páginas | `conversaciones.test.ts:79` (lista exacta de las tres rutas con `from`/`limit`, 250 ids en orden) y `sync.conversaciones.test.ts:52` (rutas + 250 filas) | PASS |
| Última página exacta, `204` | `conversaciones.test.ts:91` (3 peticiones, 200 ítems, `error` nulo) | PASS |
| Página que falla guarda y propaga | `sync.conversaciones.test.ts:62` (100 guardadas, rechaza con `Zoho /tickets/T2/conversations 500`); `conversaciones.test.ts:104` | PASS |
| Tope de 20 páginas | `conversaciones.test.ts:112` (20 peticiones, la última `from=1900`, 2.000 ítems, `error` «tope de 20 páginas»). La spec dice «se lee su lista»: se prueba en `leerConversaciones`, no por `createSync` | PASS |

### RQ-ZS-26

| Escenario | Prueba | Veredicto |
|---|---|---|
| El #958 | `conversaciones.test.ts:199` (`marcadas == [HILO]`, 6 filas, 2 adjuntos intactos); `sync.conversaciones.test.ts:75` | PASS |
| Recuento que no coincide, con log | `conversaciones.test.ts:210` (log con `958`, `recibidos 5`, `Zoho cuenta 6`); `sync.conversaciones.test.ts:91` | PASS |
| Recuento ausente no vale cero | `conversaciones.test.ts:221` (`esperado: null`, log «sin recuento»); `:55` y `:60` de `esperadoDeZoho`; `sync.conversaciones.test.ts:98` | PASS |
| Lista parcial no marca | `sync.conversaciones.test.ts:103`, `conversaciones.test.ts:236` y `:304` (151/150 → exactamente 1 con la lista entera) | PASS con matiz (S-2) |
| Interruptor apagado no marca | `conversaciones.test.ts:244` (también sin log), `sync.conversaciones.test.ts:81` y `:86` | PASS |
| Fila que reaparece se desmarca | `conversaciones.test.ts:252` (los dos valores de `marcar`), `:263` (`upsertConversation` solo), `sync.conversaciones.test.ts:110` | PASS |
| `source='app'` y filas posteriores | `conversaciones.test.ts:269` y `:276`; `sync.conversaciones.test.ts:119` (P1: fila insertada DURANTE la petición) | PASS |
| Id repetido cuenta una vez | `conversaciones.test.ts:290` y `:297` (tres elementos con un repetido no completan un 3) | PASS |

### RQ-ZS-27

| Escenario | Prueba | Veredicto |
|---|---|---|
| Se piden las de los modificados y sólo ésas | `sync.conversacionesPeriodicas.test.ts:63` (rutas exactas de 101 y 102, filas guardadas, `Z1` con 0) | PASS |
| Apagado o sin la opción: cero peticiones | `:72` (sin opción, `periodica:false`, sólo `marcarAusentes`) | PASS |
| El worker no pide con las dos variables a `'true'` | `hubSyncSinConversaciones.test.ts:27` (`loadConfig`=`[true,true]`, `syncRecent` leyó el detalle, 0 `/conversations`) y `:43` (la línea `createSync({` de `hub-sync.ts` no contiene `conversaciones`) | PASS |
| Marca con el detalle, también gestionado por la App | `sync.conversacionesPeriodicas.test.ts:95` (`raw` 5/1, detalle 5/0 → hilo marcado, 6 filas); `:102` (apagado no marca) | PASS |
| 429 espera y repite; cuatro cortan | `:111` (misma ruta dos veces) y `:118` (4 peticiones al primero, 0 al segundo, log `sin pedir: 101, 102, 103`); `conversaciones.test.ts:120`, `:133`, `:141` | PASS en lógica; la ESPERA de 2.000 ms no se asserta (W-1) |
| `modifiedTime` ya traído no se repide | `:128` (mismo → no; otro → sí) y `:141` (un fallo no se recuerda) | PASS |
| Caída a la página 1 no corre la pasada | `:80` (búsqueda `500`, 0 conversaciones, `syncRecent` = 1) | PASS |
| Fallo de la pasada no tumba `syncRecent` | `:152` (lista `500`, devuelve 2, log, la pasada sigue) y `:160` (error de base) | PASS |
| Los dos interruptores nacen cerrados | `config.test.ts:118`, `:124` (`''`, `false`, `TRUE`, `True`, `1`, `yes`, ` true`), `:133` | PASS |

La pausa de 150 ms entre tickets («SHALL pausar») sólo tiene la prueba de constantes `conversaciones.test.ts:39`: ver W-1.

### RQ-TZ-25

| Escenario | Prueba | Veredicto |
|---|---|---|
| Marcada desaparece con su adjunto | `conversacionAusentes.test.ts:27` (ids == `['vive']`, adjunto de `vive` exacto, `ausente.pdf` ausente del JSON, 2 filas y 2 adjuntos en la base) | PASS |
| Al desmarcar vuelve con su adjunto | `conversacionAusentes.test.ts:38` | PASS |
| Lo que compone la App no cambia | `conversacionAusentes.test.ts:49` (transición con comentario y remisión siguen; la de Zoho marcada no sale). CARACTERIZACIÓN: su valor está en la mutación g | PASS |

## Comportamiento frente a spec y diseño (en el código)

| Punto | Evidencia | Veredicto |
|---|---|---|
| `from` desde 0, `limit=100`, tope 20 | `conversaciones.ts:75` (`from = 0`), `:77`, `:86-88`, constantes `:19-21` | PASS |
| `completa` = sin error Y `esperado !== null` Y únicos == esperado | `conversaciones.ts:119-120` (`Set` de ids) | PASS |
| Recuento ausente o no numérico nunca vale 0 | `esperadoDeZoho` `:50-57`, `recuento` `:40-44` (entero ≥ 0 o texto numérico; si falta uno, `null`) | PASS |
| Sólo `source='zoho'`, sin marca, `created_at < inicio` | `conversaciones.ts:128-131`; `inicio` se toma ANTES de leer (`sync.ts:186`, `conversaciones.ts:161`) | PASS |
| Nunca se borra | no hay `DELETE` en `conversaciones.ts`; sólo `UPDATE … ausente_en_zoho_at=now()` (`:136`); `conversaciones.test.ts:199` cuenta filas y adjuntos | PASS |
| Desmarcado al guardar | `repo.ts:103` (`ausente_en_zoho_at=NULL` en el `DO UPDATE`), con el interruptor encendido o apagado | PASS |
| Filtro del lector | `repo.ts:219`; el adjunto no sale porque `byConv` se arma por conversación visible | PASS |
| La pasada corre sólo tras el bucle y no en los dos `paginaReciente()` | los `return paginaReciente()` están en `sync.ts:383` y `:406`, antes de `:411`; `trasLeer` sólo se invoca en `:433` | PASS |
| 429: 2 s, 3 reintentos, corte con log | `conversaciones.ts:23-24`, `:78-81` (429 antes que `!res.ok`), `:162`, `:164-167` | PASS |
| Memoria por `modifiedTime`, sólo si la lista llegó sin error | `conversaciones.ts:152`, `:157`, `:169` | PASS |
| Un fallo de la pasada nunca rechaza `syncRecent` | cada ticket en su `try` (`:158-172`) y `.catch` en `sync.ts:433`; devuelve `leidos` | PASS |
| `syncConversations` usa el recuento de `tickets.raw` | `sync.ts:183-191` (`SELECT raw FROM tickets`); lanza DESPUÉS de guardar | PASS |
| La pasada usa el recuento del detalle leído | `conversaciones.ts:163` (`esperadoDeZoho(t)`), no `raw` | PASS |

`conversaciones.ts` no importa nada de `sync.ts` (sin ciclo). Las ediciones de `sync.ts` son sustituciones en sitio.

## S-1b — propiedad de seguridad clave: PASS

- El grep de `syncConversacionesPeriodica` y `marcarConversacionesAusentes` en `apps` y `packages` (sin pruebas) da sólo `config.ts:66`, `config.ts:125` (tipo y lectura del entorno) y `apps/desk/server/index.ts:23`, el único lector. `marcarAusentes` aparece en `conversaciones.ts:34`, `sync.ts:66` y `:189`, pero leen la OPCIÓN `conversaciones`, no `config`.
- `sync.ts` no contiene ninguna lectura de esos campos de `config`.
- `apps/hub-sync/src/hub-sync.ts:21` sigue siendo `createSync({ zohoFetch, db: pool, config })`, sin `conversaciones`.
- El fichero vigilado lo pincha `hubSyncSinConversaciones.test.ts:43` (mutación h) y la conducta `:27` (mutación e).

## Preservación de líneas (`git diff --numstat b4255928 HEAD`)

| Fichero | + | − |
|---|---|---|
| `packages/zoho-sync/src/sync.ts` | 17 | 17 |
| `packages/zoho-sync/src/db/repo.ts` | 2 | 2 |
| `packages/zoho-sync/src/config.ts` | 2 | 2 |
| `apps/desk/server/index.ts` | 1 | 1 |
| `packages/zoho-sync/src/db/migrate.test.ts` | 15 | 15 |
| `apps/desk/server/reconciliacion/registro.test.ts` | 2 | 2 |
| `apps/desk/server/deploySalidasEsperas.test.ts` | 2 | 2 |

Inserciones == borrados en los siete: PASS. `schema.sql` (+4) y `DEPLOY.md` (+49) sólo crecen al final.

## Regla del esquema, regla 13 y secretos

- **Esquema:** el `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ausente_en_zoho_at timestamptz;` es la última línea de `schema.sql`, sin calificar; `conversations` está en `DESK_TABLES` (`migrate.ts:63`). El comentario previo no lleva punto y coma. Ningún `CREATE TABLE` añadido (el diff de `schema.sql` no contiene ninguno). PASS.
- **Regla invariable 13:** `git diff --name-only b4255928 HEAD` no tiene nada bajo `apps/desk/src` (0 coincidencias). El filtro de lo ausente vive en el servidor (`repo.ts:219`). PASS.
- **Secretos:** ambos interruptores se leen con triple igual a `'true'` (`config.ts:125`); `DEPLOY.md` §18 y §19 llevan «Qué enciende», «Qué se rompe si se pone mal», «Nace cerrado» y la línea de entorno vacía; `deployConversaciones.test.ts:31` lo vigila. Se reprodujeron las mutaciones i e i2 sobre `config.ts`. PASS.
- Líneas que Alfonso debe añadir a `.env.example` (no se pudo leer `.env*`; P-1):

```
SYNC_CONVERSACIONES_PERIODICA=
MARCAR_CONVERSACIONES_AUSENTES=
```

## Mutaciones reproducidas por el verificador

Cada una con copia previa, `perl -i -pe` con condición de número de línea, `git status` limpio antes y después y `sha256sum` idéntico tras restaurar.

| Id | Colocación | Rojo (fichero › prueba › aserción) |
|---|---|---|
| a | `conversaciones.ts:86` a `if (true) return …` | 9 rojas: `conversaciones.test.ts` › «250 en tres páginas» (`expected [Array(1)] to deeply equal [...3]`), «200 exactas», «500 en la segunda», «tope de 20», «excepción de red»; `sync.conversaciones.test.ts` › «250» y «500»; la de lista con error; y **`conversaciones.test.ts` › «M1: 151 guardadas y 150 recibidas» › `expected { marcadas: [], completa: false } to deeply equal …`**: con la lista parcial no se marca NADA |
| b | `:120` sin `lista.error === null &&` | `conversaciones.test.ts` › «lista con error nunca marca» (`expected true to be false`); `sync.conversaciones.test.ts` › «lista con error (segunda página 500)…» (`expected ['extra'] to deeply equal []`) |
| c | `:120` sin `&& recibidos.size === esperado` | `conversaciones.test.ts` › «recuento que no coincide» y «tres elementos con un repetido NO completan un 3» (`expected true to be false`); `sync.conversaciones.test.ts` › «recuento de tickets.raw que no coincide» (`expected ['4955…'] to deeply equal []`) |
| d | `sync.ts:189` a `marcar: true` | `sync.conversaciones.test.ts` › «sin la opción conversaciones no marca nada» y «con marcarAusentes apagado» (`expected ['495552000057899091'] to deeply equal []`) |
| e | `sync.ts:66` a `true ? crear…(… conversaciones?.…)` | `hubSyncSinConversaciones.test.ts` › «syncRecent … no pide ninguna conversación» y `sync.conversacionesPeriodicas.test.ts` › «apagada, sin la opción o con periodica false» (`expected […] to have a length of +0 but got 1` y `got 2`): rojas por PETICIONES, no por `TypeError` |
| f | `repo.ts:103` sin `,ausente_en_zoho_at=NULL` | `conversaciones.test.ts` › «fila marcada que Zoho vuelve a devolver…» y «upsertConversation por sí solo»; `sync.conversaciones.test.ts` › «marcada que Zoho vuelve a devolver…» (`expected ['c0'] to deeply equal []`) |
| g | `repo.ts:219` sin `AND ausente_en_zoho_at IS NULL` | `conversacionAusentes.test.ts` › las tres (`expected ['vive','ausente'] to deeply equal ['vive']`; longitud 2; `not include 'ausente'`) |
| h | `hub-sync.ts:21` más `, conversaciones: { periodica: true }` | `hubSyncSinConversaciones.test.ts` › «hub-sync.ts no pasa conversaciones…» (`expected 'const sync = createSync({ zohoFetch, …' not to contain 'conversaciones'`) |
| i | `config.ts:125`, la de `MARCAR…` a `!== 'false'` | `config.test.ts` › «nacen cerrados», «sólo el literal», «son independientes» (`expected true to be false`) |
| i2 | misma línea, la de `SYNC_CONVERSACIONES_PERIODICA` a `!== 'false'` | las mismas tres |
| X1 | `conversaciones.ts:159` sin `await dormir(pausaMs)` | **verde (54/54)**: sobrevive |
| X2 | `conversaciones.ts:79` sin `await dormir(pausa429Ms)` | **verde (54/54)**: sobrevive |
| X3 | `sync.ts:433` sin el `.catch(...)` de `trasLeer` | **verde (54/54)**: sobrevive (la pasada nunca rechaza; el `catch` es redundante) |

## Evidencia de TDD estricto

| Comprobación | Resultado | Detalle |
|---|---|---|
| Apply reporta evidencia | ⚠️ | No hay tabla «TDD Cycle Evidence» (RED/GREEN/TRIANGULATE/SAFETY NET); hay una narración «Rojo primero» por lote con el mensaje de cada rojo (`apply-progress.md:19-28`, `:95-102`) y M0 antes y después (`:8-17`, `:83-93`) |
| Ficheros de prueba existen | ✅ 7/7 | los seis nuevos más las tres pruebas añadidas a `config.test.ts` |
| GREEN | ✅ | 79/79 dirigidas; suite completa verde (2.ª pasada) |
| Rojo plausible | ✅ con salvedad | Los módulos, la columna, la opción y los campos de `config` no existen en `b4255928`; las doce mutaciones rojas prueban que las aserciones discriminan. No se reprodujo el rojo contra el árbol de partida: prueba e implementación se commitearon juntas (`226bc2ee`, `25350a28`) |
| Triangulación | ✅ | `leerConversaciones` 9 casos; `guardarYReflejar` 15, con valores distintos (`marcadas`, `completa`, log) |
| Pruebas que nunca pueden fallar | ninguna | sin tautologías, bucles fantasma ni pruebas de humo. Los `for` de `conversaciones.test.ts:252`, `sync.conversaciones.test.ts:110` y `config.test.ts:124` recorren listas fijas no vacías. Los `toEqual([])` tienen su par no vacío (`conversaciones.test.ts:199` frente a `:229`) |
| Relación mocks/aserciones | ✅ | sin exceso; el arnés enruta por ruta (`from`/`limit`), no por orden de llamada |
| Capas | informativo | unitarias e integración sobre pg-mem; sin E2E. Cobertura por fichero: no medida |

## Hallazgos

### CRITICAL
Ninguno.

### WARNING
- **W-1 — Las pausas no están probadas por conducta.** RQ-ZS-27 dice «SHALL pausar 150 ms entre tickets» y «esperar 2.000 ms» ante un 429. Las mutaciones X1 (`packages/zoho-sync/src/conversaciones.ts:159`) y X2 (`:79`) quedan verdes: las pruebas pasan `pausaMs: 0` y `pausa429Ms: 0`, y sólo la prueba de constantes (`conversaciones.test.ts:39`) fija los números, sin ver que el cableado los use. Tampoco se prueba que la App, que no pasa `pausaMs` (`apps/desk/server/index.ts:23`), reciba los valores por defecto.
- **W-2 — El cableado de `apps/desk/server/index.ts:23` no tiene prueba.** Es el único sitio donde los interruptores llegan a `createSync`; invertir `periodica` y `marcarAusentes`, o no pasarlos, no pone nada rojo (ninguna prueba importa `index.ts`, que arranca el servidor; no se mutó por eso). S-1b está cubierta por el lado del worker, no por el de la App.
- **W-3 — La evidencia de TDD no sigue la tabla del protocolo** (`apply-progress.md`) y el rojo previo no es reproducible desde el historial de git.
- **W-4 — La primera `npm test` salió con exit 1** sólo por `Timeout calling "onTaskUpdate"` con todas las pruebas verdes (`npmtest-scz-verify-213545.log`); la repetición salió 0. Es el fallo conocido de la máquina, no del cambio.

### SUGGESTION
- **S-1 — `sync.ts:433`: el `.catch` es redundante** (X3 sobrevive) porque `crearPasadaConversaciones` nunca rechaza. Es defensa en profundidad legítima, pero quien la quite no verá rojo; una prueba con una `trasLeer` que rechaza la fijaría.
- **S-2 — «Una lista parcial no marca»** (spec: 150 guardadas, `commentCount` 150, segunda página 500): `sync.conversaciones.test.ts:103` usa 100 guardadas más una fila `extra` y `commentCount` 100, de modo que el recuento SÍ coincide y sólo el error impide marcar. Es más estricto que la spec (aísla la rama del error), pero no es el caso literal.
- **S-3 — Un ticket con lista completa pero recuento que no coincide se recuerda** (`conversaciones.ts:169`) y no se repide hasta que cambie su `modifiedTime`. Si Zoho actualiza `commentCount` y `threadCount` con retraso respecto al `modifiedTime`, el hilo fantasma queda sin marcar hasta la siguiente modificación. Es el diseño (S-7) y falla del lado seguro, pero merece una línea en el informe de cierre.

## Lo que no se prueba

- `created_at < $2` con un `Date` enlazado se prueba en pg-mem, no contra PostgreSQL real: **hipótesis** de que se comporta igual (`conversaciones.ts:129`). Lo mismo para el `now()` de `instanteBase`.
- Que `from` cuente desde 0 en `/tickets/{id}/conversations` es **hipótesis** tomada del esquema del conector; las pruebas fijan que se PIDE `from=0`, no que Zoho lo respete.
- Que el detalle real de Zoho traiga `commentCount` y `threadCount` con el significado supuesto está fijado sólo con fixtures (`sync.conversacionesPeriodicas.test.ts:50-53`).
- Que la cuota diaria de Zoho alcance con las peticiones extra de la pasada (`DEPLOY.md` §18 ya lo declara hipótesis).
- El cableado de `index.ts:23` (W-2) y la espera real de 150 y 2.000 ms (W-1).
- No se midió cobertura por fichero. El relleno (P-3) y la comprobación del #958 (P-4) son de persona y no se dan por hechos.
- No se ejecutó `gentle-ai sdd-verify-validate` ni `sdd-attempt` (fuera del encargo).

## Siguiente paso recomendado

`sdd-archive`, con W-1 y W-2 anotadas para la bandeja (R-3) o corregidas antes si Gerencia lo prefiere; ninguna bloquea.
