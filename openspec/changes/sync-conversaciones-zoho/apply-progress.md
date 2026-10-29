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
