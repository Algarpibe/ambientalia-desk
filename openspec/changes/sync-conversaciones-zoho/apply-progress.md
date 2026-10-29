# Progreso de apply — `sync-conversaciones-zoho`

Modo `strict_tdd`. Worktree propio, rama `sync-conversaciones-zoho`. Las comprobaciones de cada intento corren en serie sobre el
árbol commiteado (`typecheck`, `lint -- --max-warnings 165`, detector de citas, `npm test` con log y memoria medida antes, `build`).

## Lote L1 — intento i2 (commit `226bc2ee`, partida `d38391f8`) y este registro (intento i2b)

### M0

| | Ficheros de prueba | Pruebas | Resultado |
|---|---|---|---|
| M0 previo, `d38391f8` | 329 (325 pasan, 4 saltados) | 5.732 (5.706 pasan, 26 saltadas) | exit 0, 233 s, `npmtest-scz-i1c-165451.log` |
| Pasada del agente, sin el parche de `migrate.test.ts` | 332 (327 pasan, 1 falla, 4 saltados) | 5.778 (5.747 pasan, 5 fallan) | exit 1, 359 s, `npmtest-scz-L1-173051.log`: las 5 rojas, todas de `migrate.test.ts` |
| M0 posterior, `226bc2ee` | 332 (328 pasan, 4 saltados) | 5.778 (5.752 pasan, 26 saltadas) | exit 0, 266 s, `npmtest-scz-i2-174210.log`, 14.358 MB libres antes |

Diferencia: +3 ficheros y +46 pruebas, todas nuevas; ninguna existente cambió de resultado salvo las 5 de `migrate.test.ts`
(abajo). Cadena del commit: `typecheck=0 lint=0 detector=0 test=0 build=0` (`scz-i2-codes.txt`); lint 165 avisos contra 165.

### Rojo primero (L1.2-L1.7), medido antes de implementar

- `conversaciones.test.ts`: no cargaba (`Cannot find module './conversaciones'`).
- `sync.conversaciones.test.ts`: con sólo el `ALTER` añadido, rojas por la razón correcta: «250» (`expected ['/tickets/T1/conversations']
  to deeply equal [...3]`), «500 en la segunda» (`promise resolved "undefined" instead of rejecting`), «#958» (`expected [] to deeply
  equal ['495552000057899091']`), «recuento de raw no coincide» (`expected '' to contain 'Zoho cuenta 6'`), «P1» (`expected [] to
  deeply equal ['vieja']`). «Sin la opción», «`marcarAusentes` apagado» y «ticket sin fila» nacen verdes: su valor está en M4.
- `conversacionAusentes.test.ts`: «marcada no sale» (`expected ['vive','ausente'] to deeply equal ['vive']`), «desmarcada vuelve»
  (`to have a length of 1 but got 2`) y la de CARACTERIZACIÓN (`expected [...] to not include 'ausente'`).
- Ninguna roja por el arnés; un `href` de adjunto mal formado en el arnés se corrigió antes del verde.

### Implementación (L1.8-L1.11)

| Fichero | `git diff --numstat d38391f8 226bc2ee` | Qué |
|---|---|---|
| `packages/zoho-sync/src/conversaciones.ts` | 140 0 (nuevo) | D2 sin `crearPasadaConversaciones` (es de L2). Guardas por respuesta: 429 en `:78`, `!res.ok` en `:82`; página corta `:86`; tope `:87`; `completa` en `:120`; marcado `:128-138` |
| `packages/zoho-sync/src/sync.ts` | 11 11 | `:3` y `:7` (importaciones; las cuatro que dejaron de usarse salen de su línea), `:9`, `:62`, `:183-191` (9 líneas por 9). `inicio` en `:186`, antes de leer en `:187` |
| `packages/zoho-sync/src/db/repo.ts` | 2 2 | `:103` desmarca; `:219` filtra |
| `packages/zoho-sync/src/db/schema.sql` | 4 0 | al final: tres de comentario sin punto y coma y el `ALTER` sin calificar |
| `packages/zoho-sync/src/db/migrate.test.ts` | 15 15 | en sitio, ver desvío 1 |
| tres ficheros de prueba nuevos | 312 + 131 + 65 | 46 pruebas |

Total del intento i2: **+680 −28 = 708** con `--no-renames`, nada sin trackear.

### Desvíos respecto a `design.md` y `tasks.md`

1. **`migrate.test.ts` no estaba previsto** y el `ALTER` nuevo lo rompía: el recuento de `ALTER` (69 → 70, sin calificar 29 → 30),
   el conjunto de tablas con `ALTER` sin calificar (gana `conversations`) y las posiciones contadas desde el final (+1 cada una). Se
   corrigió en sitio, 15 líneas por 15, con el mismo molde que `566d0d68`; pasa 64/64. Lo hizo el orquestador: el agente tenía
   prohibido tocar pruebas existentes.
2. Las importaciones de `sync.ts:3` y `:7` que dejaron de usarse se quitan de su línea (si no, lint sumaba cuatro avisos).
3. Tres pruebas más de las listadas, para que M2 y M7 se vean también por `createSync`.
4. `ORDER BY id` en el `SELECT` de las guardadas (`conversaciones.ts:129`), para un orden determinista; el texto del log es
   `recibidos N únicos, Zoho cuenta M` o `sin recuento`.
5. La medida del lote no cabía en 720 con este registro dentro, así que el lote se partió en i2 (código y pruebas) e i2b (esto).

### Mutaciones (L1.13). Copia antes de cada una, `perl -i -pe` con `$. == N`, restauradas con sha256 del diff, `git status` y CRLF

| Id | Colocación | Rojas (fichero › prueba › aserción) |
|---|---|---|
| M1 | `conversaciones.ts:86` → `if (true) return …` | 9 (repetida por el orquestador): las cinco de lectura de `conversaciones.test.ts`, las dos de lista de `sync.conversaciones.test.ts`, la de lista con error, y **«151 guardadas y 150 recibidas marcan exactamente 1»** › `expected { marcadas: [], completa: false }`: la lista parcial **no marca nada** |
| M2 | `:120` sin `lista.error === null` | `conversaciones` › «lista con error nunca marca» (`expected true to be false`); `sync.conversaciones` › «lista con error no marca aunque las 100 igualen el recuento» (`expected ['extra'] to deeply equal []`) |
| M3a | `:120` sin `recibidos.size === esperado` | «recuento que no coincide» (`expected true to be false`), «repetido no completa un 3», `sync.conversaciones` › «recuento de raw no coincide» (`expected ['4955…'] to deeply equal []`) |
| M3b | `:120` con `lista.items.length` | «id repetido cuenta una vez» (`expected false to be true`), «tres con un repetido NO completan un 3» (`expected true to be false`) |
| M4 | `sync.ts:189` con `marcar: true` | `sync.conversaciones` › «sin la opción» y «`marcarAusentes` apagado» (`expected ['4955…'] to deeply equal []`) |
| M7 | `repo.ts:103` sin `,ausente_en_zoho_at=NULL` | `conversaciones` › «reaparece» y «`upsertConversation` por sí solo»; `sync.conversaciones` › «marcada que Zoho vuelve a devolver» (`expected ['c0'] to deeply equal []`) |
| M9 | `repo.ts:219` sin el filtro | las tres de `conversacionAusentes` (`['vive','ausente']`; longitud 2; `to not include 'ausente'`) |
| M10a | `conversaciones.ts:129` sin `source='zoho'` | «fila `source=app` nunca se marca» (`expected ['app1'] to deeply equal []`); restaurada a mano, sha256 final igual |
| M10b | `:129` con `$2 IS NOT NULL` | «`created_at` posterior» (`['nueva','vieja']`), `sync.conversaciones` › P1 (`['durante','vieja']`) |
| P1 | `sync.ts:186` y `:187` intercambiadas | `sync.conversaciones` › P1 (`expected ['durante','vieja'] to deeply equal ['vieja']`) |

Ninguna mutación quedó verde. P1 depende de dos esperas de 5 ms dentro de la `zohoFetch` falsa; fue roja estable con P1 y M10b.

### Regla invariable 13 (L1.14)

`git diff --name-only d38391f8 226bc2ee` no tiene nada bajo `apps/desk/src`: el cliente no decide nada; ocultar lo ausente lo
decide el servidor en `repo.ts:219`.

### Riesgos que quedan

- `created_at < $2` con un `Date` enlazado está probado en pg-mem, no contra Postgres real: **hipótesis** que se comporta igual.

## Lote L2 — intento i3 (commit `25350a28`, partida `9500f076`) y este registro (intento i3b)

### M0

| | Ficheros de prueba | Pruebas | Resultado |
|---|---|---|---|
| M0 previo, `9500f076` | 332 (328 pasan, 4 saltados) | 5.778 (5.752 pasan) | exit 0, 266 s, `npmtest-scz-i2b-175223.log` |
| Pasada del agente, antes de acotar la §17 | 334 (329 pasan, 1 falla) | 5.794 (5.767 pasan, 1 falla) | exit 1, 378 s, `npmtest-scz-L2-181900.log`: `deploySalidasEsperas.test.ts` › «es la última» (desvío 1) |
| M0 posterior, `25350a28` | 335 (331 pasan, 4 saltados) | 5.798 (5.772 pasan, 26 saltadas) | exit 0, 282 s, `npmtest-scz-i3-183424.log`, 14.298 MB libres |

+20 pruebas: 3 de `config.test.ts` (añadidas al final), 11 de `sync.conversacionesPeriodicas.test.ts`, 2 de
`hubSyncSinConversaciones.test.ts` y 4 de `deployConversaciones.test.ts`. Cadena: `typecheck=0 lint=0 detector=0 test=0 build=0`; lint
165 contra 165; el bundle sigue siendo `index-F1jDYjEU.js` (el cliente no cambia).

### Rojo primero (L2.2-L2.5)

- `config.test.ts`: las tres rojas porque los campos no existían (`undefined` frente a `false`).
- `sync.conversacionesPeriodicas.test.ts`: 8 de 11 rojas por la razón correcta (lista de peticiones vacía, nada marcado, log vacío:
  p. ej. `expected '' to contain '/tickets/101/conversations 500'`). Nacen verdes, de CARACTERIZACIÓN: «apagada, sin la opción o con
  periodica false» y «búsqueda cae → sin pasada»; su valor está en M5 y P3.
- `hubSyncSinConversaciones.test.ts`: la conductual, roja sólo en la aserción de `loadConfig` (`[undefined, undefined]` frente a
  `[true, true]`); la estática nace verde, su valor está en M8b. `deployConversaciones.test.ts` nace verde: su valor está en G1-G3.

### Implementación (L2.6-L2.10)

| Fichero | numstat | Qué |
|---|---|---|
| `packages/zoho-sync/src/conversaciones.ts` | 35 0 | `crearPasadaConversaciones` al final (`:149`): memoria `:157`, pausa `:159`, `inicio` antes de leer `:161`, corte por 429 `:164` |
| `packages/zoho-sync/src/sync.ts` | 7 7 | `:7`, `:66`, `:176`, `:375`, `:411`, `:426`, `:433`; `:383` y `:406` intactas (S-8) |
| `packages/zoho-sync/src/config.ts` | 2 2 | `:66` tipo, `:125` las dos lecturas `=== 'true'` |
| `apps/desk/server/index.ts` | 1 1 | `:23` la opción `conversaciones`: única lectura de los dos campos en el código |
| `DEPLOY.md` | 49 0 | §18, §19 y §20 al final |
| `apps/desk/server/deploySalidasEsperas.test.ts` | 2 2 | desvío 1 |
| pruebas nuevas y añadidas | 24 + 169 + 49 + 46 | |

Total del intento i3: **+383 −12 = 395** con `--no-renames`, nada sin trackear.

### Desvíos

1. **`deploySalidasEsperas.test.ts:23` exigía que la §17 fuera la última sección de `DEPLOY.md`.** Se acota en sitio la §17 hasta la §18
   (`:17`) y el título pasa a «la última hasta la §18» (`:20`), con el molde de `deployControlCalidad.test.ts:14`, que hizo lo mismo cuando
   F1C-03 añadió la §17. Lo hizo el orquestador.
2. **Guardián nuevo `apps/desk/server/deployConversaciones.test.ts`** (no estaba en `tasks.md`): sin él, nada vigila que los dos
   interruptores sigan documentados con sus dos frases (regla de secretos). Molde de `deploySalidasEsperas.test.ts`.
3. Texto del corte por 429: `conversaciones: pasada cortada por 429 en el ticket N; sin pedir: N, M, …` (el actual y los que faltan).

### Mutaciones (L2.12), restauradas con sha256 del diff, `git status` y CRLF

| Id | Colocación | Rojas |
|---|---|---|
| M4 | `sync.ts:66` con `marcar: true` | periódicas › «con la pasada encendida y `marcarAusentes` apagado no marca nada» |
| M5 | `sync.ts:66`, `periodica === true` → `true` | periódicas › «apagada, sin la opción o con periodica false»; el worker conductual (por `TypeError` al construir; la forma limpia es M8a') |
| M6a, M6b | `config.ts:125`, cada `=== 'true'` → `!== 'false'` | las tres de `config.test.ts` |
| M8a' | `sync.ts:66` con `(conversaciones?.periodica ?? config.syncConversacionesPeriodica)` | worker conductual › `expected [ Array(1) ] to have a length of +0 but got 1`: pide una conversación (repetida por el orquestador) |
| M8b | `, conversaciones: { periodica: true }` en `apps/hub-sync/src/hub-sync.ts:21`, el **fichero vigilado** | worker estática › «hub-sync.ts no pasa `conversaciones`»; restaurado, `git status` limpio |
| M11 | `conversaciones.ts:157` sin la memoria | periódicas › «el mismo `modifiedTime` en el segundo ciclo no se vuelve a pedir» |
| P2 | `conversaciones.ts:78-82`, `!res.ok` antes del 429 | dos 429 de la pasada y tres de `leerConversaciones` |
| P3 | la pasada llamada en `sync.ts:411` con la lista vacía y quitada de `:433` | 9 periódicas, entre ellas «pide la lista de los dos modificados y sólo de ésos» |
| G1 | `DEPLOY.md:863` sin `**Nace cerrado**` (fichero vigilado) | `deployConversaciones` › «MARCAR_CONVERSACIONES_AUSENTES: … nace cerrado» |
| G2 | `DEPLOY.md:867` con `=true` | la misma, por la línea de entorno |
| G3 | `config.ts:125` con `SYNC_CONVERSACIONES_PERIODICA !== 'false'` | `deployConversaciones` › «SYNC_CONVERSACIONES_PERIODICA: …» |

Ninguna mutación quedó verde.

### Regla invariable 13 (L2.13)

`git diff --name-only b4255928 25350a28` no tiene nada bajo `apps/desk/src`.

### Barrido de la regla de mutación 4 (L2.14)

Ninguna línea se movió: todas las ediciones de `sync.ts`, `repo.ts`, `config.ts`, `index.ts`, `migrate.test.ts`, `registro.test.ts` y
`deploySalidasEsperas.test.ts` son sustituciones en sitio, y `schema.sql` y `DEPLOY.md` sólo crecen al final. Se barrieron las citas
completas y abreviadas por nombre de todo el repositorio cuyo rango toca una línea **editada**: **248**.

- **Documentos vivos fuera de esta carpeta, 20** (tres de ellas, las de `DEPLOY.md` §18-§19, son de esta tanda). Siguen ciertas: `DEPLOY.md:784`, `:794`, `:819`, `:826`
  (`config.ts:125` sigue leyendo `CONTROL_CALIDAD_LIBERACION` y `SALIDAS_ESPERAS`); `openspec/specs/derivacion-avisos/spec.md:384-385`
  (`createSync` en `sync.ts:62` y el cableado de `index.ts:21-23` siguen ahí); `openspec/specs/trazas/spec.md:509` (la sentencia de
  `repo.ts:97-103` sigue siendo el `INSERT` de `upsertConversation`); los cinco paquetes de despliegue que citan `index.ts:23` como
  cableado del aviso de discrepancia (sigue en esa línea). Ancladas: `docs/sdd/ENTRADA.md:2048` (`9822bd7`) y
  `docs/sdd/Paquete_de_Despliegue_2026-09-27.md:77` (`dcb5c99`). Históricas por fecha del documento, caso B sin ancla:
  `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md:292` («contaba DIEZ», en pasado) y `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:474`
  («26 sin calificar», hoy 30). No se tocan: son registros fechados.
- **Archivadas, 195.** Las 29 a `sync.ts`, `config.ts` e `index.ts` siguen ciertas o están ancladas (`17ddfec`, `9822bd7`). Las 166 a
  `registro.test.ts:218-220` y `migrate.test.ts` (10 ancladas, 156 sin ancla) están en carpetas fechadas de 33 tandas anteriores, cada
  una de las cuales editó esas mismas líneas en sitio: caso B por la fecha de su carpeta, sin reanclar, como hizo cada tanda previa.
- **Este cambio, 33.** Los apartados «Lo que hay hoy» de `proposal.md` y la columna «Hoy» de `design.md` D3 están medidos en `b4255928`,
  como dicen sus cabeceras.
