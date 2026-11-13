# Progreso de aplicación — `cliente-prestado-conexion-cortada` (E-290)

## Lote L1 (intento i3) — módulo, hijo, integración, unitarias y mutaciones

Partida: `a1882ad7`. Worktree propio: `C:\dev\Desk_2_R1.023-worktrees\cliente-prestado-conexion-cortada`. Contenedor `cpc-pg17` (`postgres:17-alpine`, puerto 55432), sin parar ni borrar.
**PostgreSQL medido: `SHOW server_version` = 17.10.** Estado: L1.1 a L1.9 hechas; L1.10 (las cinco comprobaciones en cadena sobre el commit) la corre el orquestador.

### Rojos previos (strict TDD, D-9)

**L1.3 · integración, con `conexionPerdida.ts` SIN tocar** (hijo y padre ya cambiados; `npx vitest run packages/zoho-sync/src/db/conexionPerdida.integration.test.ts`, salida 1, 3 rojas de 6):
- `conexionPerdida.integration.test.ts › I-4 · cliente prestado con transacción abierta… › expect(codigo).toBe(0) › recibido 1` (el proceso muere por el `error` sin oyente).
- `conexionPerdida.integration.test.ts › I-5 · cliente prestado con consulta en curso… › expect(codigo).toBe(0) › recibido 1`.
- `conexionPerdida.integration.test.ts › I-6 · createPoolFromUrl, cliente prestado… › expect(codigo).toBe(0) › recibido 1`.
- I-1, I-2 e I-3 verdes. Razón correcta (salida 1), no import ni arnés: el import de `TEXTO_CLIENTE_PRESTADO` aún sin exportar queda `undefined` y la prueba llega a la aserción de la salida.

**L1.4 · unitarias** (`npx vitest run packages/zoho-sync/src/db/conexionPerdida.test.ts`; el fichero carga con los nombres aún sin exportar; U-1 a U-10 verdes, 11 rojas): todas por la primera aserción, `expect(() => cliente.emit('error', …)).not.toThrow()` › recibido «lanza» (`Error: terminating connection due to administrator command`, `Error: uno`, `Error: Connection terminated unexpectedly`, `Error: x`):
U-11, U-12, U-13, U-14, U-15, U-16, U-17, U-18 y las tres de U-19 (`createPool desk`, `createPool public`, `createPoolFromUrl`).

### Verde (L1.5, L1.6)

- Unitarias + `pool.test.ts`: 2 ficheros, 32 pruebas, todas verdes (U-1 a U-19).
- Integración con el contenedor: 6 de 6 verdes (I-1 a I-6), `SHOW server_version` = 17.10.
- **Línea OBSERVADA de I-5: `Pool de la base: se perdió la conexión de un cliente prestado; su operación falla y el proceso sigue — Connection terminated unexpectedly`, sin código. Coincide con la hipótesis del diseño**; nada que corregir en la prueba. La consulta en curso rechaza con `57P01` (`consulta`) y el `rollback` rechaza.
- Línea de I-4 e I-6: `… — terminating connection due to administrator command [57P01]`; pasos `listo`, `siguiente` (rechazada), `rollback` (rechazada), `baja` (total 0), `despues` (pid nuevo).
- Módulo: una sola línea en sitio (la 44, `return escucharClientePrestado(pool, registrar)`) y el bloque del §2 en las líneas 46-69. Nota: `git diff --numstat` da 24/0 porque git alinea la 44 nueva con el `return pool` de la 68; físicamente la 44 cambió en sitio y el fichero pasó de 45 a 69 líneas sin mover ninguna.
- Hijo: en sitio `:2`, `:12`, `:14`, `:26`, `:50`, `:51`, `:54`, `:67`; `comoEnTransaccion` al final (detrás de la 78). Padre: en sitio `:6`, `:11`, `:136`, `:145`, `:151`, `:170`, `:176-186`; I-5, I-6 y `lineasPrestado` antes del `})` de cierre (que pasa de la 187 a la 208).
- Desviación menor del diseño: `:50` queda como un `let` con dos declaradores (`let primero: {…}, tras: Promise<void> = Promise.resolve()`), sin `;`; y `comoEnTransaccion` usa un ayudante local `paso(nombre)` con `ok`/`ko` para emitir `consulta`, `siguiente` y `rollback`. El comportamiento es el del §4.1.
- Finales de línea, medidos con perl tras la última edición: módulo 69 de 69, unitarias 345 de 345, integración 208 de 208, hijo 93 de 93, `tasks.md` 72 de 72, este fichero 100 % CRLF.

### L1.7 · typecheck y lint

- `npm run typecheck` → salida 0 (cierra la hipótesis del tipado: `P extends EventEmitter` y `cliente: EventEmitter` sin aserciones).
- `npm run lint -- --max-warnings 165` → salida 0, «✖ 165 problems (0 errors, 165 warnings)»: 165 contra 165, sin `any` nuevo.

### L1.8 · mutaciones M-1 a M-7

Protocolo: `git add` del módulo en verde, sha256 `5f7ab8523419f25ca6e2de540a4cd5abf19ad4f5203bfe733f97443769a74e34`; una línea con `perl -i -pe '… if $. == N'`; unitarias e integración con el contenedor; restauración con la sustitución inversa; `git diff --quiet` = 0, mismo sha256 y CRLF 69 de 69 tras CADA una. `git reset -q` al final: índice como en HEAD.

| Id | Línea | Mutación | Rojas | Verdes | Restauración |
|---|---|---|---|---|---|
| M-1 | 44 | vuelve a `return pool` | U-11 a U-19 (las 11 pruebas); I-4, I-5, I-6 | U-1 a U-10; I-1 a I-3 | OK: diff --quiet, sha igual, CRLF 69/69 |
| M-2 | 60 | comentada la línea del filtro `!prestados.has` | U-12, U-13; I-1, I-2 | U-11, U-14, U-15; I-3 a I-6 | OK |
| M-3 | 61 | comentada la deduplicación `registrados.has` | U-14; I-4, I-6 | I-5 (un solo error) | OK |
| M-4 | 67 | comentado `pool.on('release', …)` | U-13; **I-1, I-2** | I-3 a I-6 | OK |
| M-5 | 63 | `registrar(lineaClientePrestado(err))` sin `try` | U-18 | integración entera | OK |
| M-6 | 51 | `JSON.stringify(err)` en vez de `mensajeDe(err)` | U-11, U-14, U-15, U-16, U-17, las tres de U-19; I-4, I-5, I-6 | U-12, U-13, U-18 | OK |
| M-7 | 63 | el oyente de cliente llama a `lineaConexionPerdida` | U-11, U-14, U-15, U-16, tres de U-19; I-4, I-5, I-6 | U-17, U-18 | OK |

Ninguna mutación quedó sin rojo. **Dos diferencias con lo previsto en el §5, a favor de la prueba:**
- **M-4 también pone rojas I-1 e I-2** (el diseño las daba verdes: «el cliente liberado se descarta»): sin el `release`, el cliente de `pool.query()` queda en `prestados` y, al cortarlo en reposo, el oyente de cliente suma una línea del texto nuevo de más. Es un rojo de integración que el diseño no esperaba.
- M-6 y M-7 son más anchas de lo previsto (U-11, U-14, U-15, U-16, U-19 y las tres de integración): las pruebas de línea exacta y `lineasPrestado` las cazan. M-5 queda sólo en U-18, como se preveía, sin rojo de integración.

### L1.9 · casilla de la regla 13

- `git diff --name-only | grep -c apps/desk/src` → 0: nada bajo `apps/desk/src`.
- `git diff --quiet` sobre `pool.ts`, `migrate.ts`, `schema.sql`, `.env.example` y los sitios (`apps/desk/server/db/transaccion.ts`, `apps/desk/server/db/eliminarTicket.ts`, `repo.ts`, `puestaAlDiaEstricta.ts`, `apps/hub-sync/src/hub-sync.ts`) → salida 0. `DEPLOY.md`, la guarda y los seis de Supervisión, sin tocar.

### Medida del lote (i3)

`git diff --shortstat --no-renames a1882ad7` → 4 ficheros, **220 inserciones y 25 borrados = 245**; sin ficheros trackeables nuevos salvo este `apply-progress.md` (`wc -l` al cerrarlo, abajo); sin binarios.
Por fichero (`git diff --numstat`): hijo 23/8, integración 37/16, unitarias 136/1, módulo 24/0. Con las nueve casillas de `tasks.md` (9/9 = 18) y `apply-progress.md` (65 líneas sin trackear): 245 + 18 + 65 = **328**, muy por debajo de 800.

### Lo que queda para el orquestador

L1.10: las cinco comprobaciones sobre el commit (`typecheck`, `lint` 165/165, citas `--sha HEAD`, `npm test` en primer plano con log, `build`) y la medida del intento. No se corrió `npm test` entero ni el build.

**Contraste del orquestador, antes del commit del lote.** Edición en sitio comprobada contra `a1882ad7`, línea a línea y sin contar los finales: el módulo sólo cambia la 44; la unitaria, la 7; la integración, las 6, 11, 136, 145, 151, 170 y 176 a 185, y sólo se mueve su cierre; el hijo, las 2, 12, 14, 26, 50, 51, 54 y 67. Verde reproducido con el contenedor (38 de 38, PostgreSQL 17.10). M-1 reproducida: con la 44 devuelta a `return pool`, rojas I-4, I-5 e I-6 y verdes I-1 a I-3; restaurada con el mismo sha256 (`5f7ab852…`) y 69 de 69 renglones en CRLF.

## Lote L2 (intento i4) — guarda, `DEPLOY.md` §27 y barrido

Partida: `d092a1e8` (cierre de L1). Mismo worktree y mismo contenedor `cpc-pg17` (PostgreSQL 17.10, sin parar). Estado: L2.1 a L2.6 hechas; L2.7 (cierre: medida del intento, las cinco comprobaciones, `git show --numstat`) la hace el orquestador.

### L2.1 · ROJO de la guarda (contra el `DEPLOY.md` de hoy, sin tocarlo)

Guarda ampliada en sitio (`:4` import de `TEXTO_CLIENTE_PRESTADO` y `lineaClientePrestado`; `:11` comentario; `:32` cuatro cadenas nuevas: `'su transacción no se confirma'`, `'no se corta'`, `TEXTO_CLIENTE_PRESTADO`, `LINEA_MEDIDA_PRESTADO`; `:35` el `return` añade `sin «sigue muriendo»` si la sección con espacios colapsados la contiene) y, al final, `LINEA_MEDIDA_PRESTADO` y un `describe` de tres pruebas con copias ensuciadas. `npx vitest run apps/desk/server/deployPoolConexionCortada.test.ts`, salida 1, **8 de 8 rojas**, por las faltas y no por un import o el arnés (el fichero carga y llega a las aserciones):
- `deployPoolConexionCortada.test.ts › DEPLOY.md §27 · conexión de la base cortada (RQ-ZS-62) › el DEPLOY.md real no tiene faltas › expect(faltasSeccion27(deploy)).toEqual([]) › recibido [ 'su transacción no se confirma', 'Pool de la base: se perdió la conexión de un cliente prestado; su operación falla y el proceso sigue', '… — terminating connection due to administrator command [57P01]', 'sin «sigue muriendo»' ]` (cuatro faltas).
- Las otras cuatro de RQ-ZS-62 (`salvo que se repita`, `pool.connect()`, texto fijo de E-285, posición) rojas porque su `toEqual` exacto recibe esas mismas cuatro faltas de más.
- Las tres nuevas de RQ-ZS-67: `«sigue muriendo» devuelta…` recibe las cuatro faltas en vez de sólo `['sin «sigue muriendo»']`; `sin el texto fijo…` y `sin «su transacción…» y sin «no se corta»` fallan en `expect(sin).not.toBe(deploy)` (el texto aún no está en el fichero: la copia no se puede ensuciar).
- Primer intento con dos defectos míos, corregidos antes de anotar el rojo: la expresión de `:35` salió sin la barra invertida (`/s+/g`) y `:32` con un espacio de más; con la barra puesta, la cuarta falta aparece. Anotado porque el rojo bueno es el segundo.

### L2.2 · `DEPLOY.md` corregido

En sitio, ocho renglones siguen siendo ocho (comprobado línea a línea contra `d092a1e8` sin finales: sólo difieren 1179, 1182, 1183, 1185 y 1186; la guarda difiere sólo en 4, 11, 32 y 35 y lo nuevo va detrás de la 68). Texto final de `DEPLOY.md:1179-1186`:

```
1179  El oyente del pool cubre las conexiones **en reposo**; desde E-290, un oyente por cliente cubre además el cliente **prestado** por `pool.connect()` (su línea está al final de esta sección). **No** cubre:
1180
1181  - **Una consulta en curso** cuando se corta la conexión: ...   (sin cambio)
1182  - **Un cliente prestado por `pool.connect()`** con una transacción abierta (el caso de `apps/desk/server/db/transaccion.ts:16-26`): medido en la prueba de integración, si el servidor corta esa conexión el proceso ya no cae y sale una línea, pero **su operación falla**:
1183    su transacción no se confirma y quien la pidió recibe el error de base de siempre (hipótesis para las rutas de la App); nada la reintenta. Evitar esa falla queda fuera de este cambio.
1184
1185  Por eso la precaución de la §26 **sigue vigente**, ya no porque el proceso muera sino porque la operación de un usuario falla y su transacción no se confirma: antes de cortar con `pg_terminate_backend` el **pid raíz** de una cadena de bloqueos, comprobar que es de la consola (`application_name` «psql» en
1186  `pg_stat_activity`; la App llega con el nombre vacío, medido también en el contenedor local, no en producción) y no de la App. Un pid de la App con una transacción abierta **no se corta**: se pasa al analista, porque la operación de ese usuario fallaría.
```

Bloque final (renglones 1187 a 1196, sin `## ` nuevo; la §27 sigue siendo la última):

```
### La línea del cliente prestado (E-290)

Sale por el mismo canal, stderr (`console.error`), y es **distinta** de la de E-285: lleva su propio texto fijo, seguido del mensaje del error y su SQLSTATE entre corchetes. Sale **una por cliente**, aunque ese cliente dé dos errores (el del servidor y «Connection terminated unexpectedly»). La línea medida contra PostgreSQL 17.10 (contenedor local `postgres:17-alpine`, no producción) al cortar con `pg_terminate_backend` un cliente prestado con la transacción abierta, con el código `57P01`:

> ```
> Pool de la base: se perdió la conexión de un cliente prestado; su operación falla y el proceso sigue — terminating connection due to administrator command [57P01]
> ```

Qué hacer: nada, salvo que se repita. Si alguien informa de una operación fallida a esa hora, esa es la causa: la transacción de esa operación no se confirmó y hay que repetirla. Si la línea se repite **sin** reinicio ni corte conocido, pasar la línea al analista.
```

Decisión de redacción: el texto fijo vive **sólo** en la línea del bloque de código (no en la prosa), para que DEPLOY-2 sea de un renglón y ponga rojas las dos cadenas (`TEXTO_CLIENTE_PRESTADO` y `LINEA_MEDIDA_PRESTADO`), como prevé el diseño. «sigue muriendo» no aparece en ninguna forma (cuenta 0).
`DEPLOY.md`: 1.196 renglones, CRLF 1196 de 1196. La guarda: 96 renglones, CRLF 96 de 96.

### L2.3 · verde

`deployPoolConexionCortada.test.ts` 8 de 8 y `deployArranqueEstricto.test.ts` 4 de 4 (sin tocar). Con las dos de `conexionPerdida` y el contenedor: 4 ficheros, 48 pruebas, todas verdes; `SHOW server_version` = 17.10.

### L2.4 · DEPLOY-1 a DEPLOY-3 sobre el `DEPLOY.md` real

Protocolo: `git add DEPLOY.md` en verde, sha256 `5a622a980c1855747e191d62c7f2b534c91e8fb21f88d63e7e2db9919eabf9ce`; una línea con `perl -i -pe '… if $. == N'`; la guarda; restauración con la sustitución inversa; tras CADA una `git diff --quiet -- DEPLOY.md` = 0, mismo sha256 y CRLF 1196 de 1196. `git reset -q` al final: sin nada en el índice.

| Id | Línea | Mutación | Rojas | Verde |
|---|---|---|---|---|
| DEPLOY-1 | 1183 | `nada la reintenta.` → `nada la reintenta: sigue muriendo.` (forma en un renglón; la partida por un salto la cubre la prueba de copia ensuciada) | 7 de 8; `el DEPLOY.md real no tiene faltas › recibido [ 'sin «sigue muriendo»' ]` | la prueba que devuelve «sigue muriendo» ella misma (esperado) |
| DEPLOY-2 | 1193 | `un cliente prestado; su operación` → `otro cliente; su operación` en la línea medida del bloque | 8 de 8; `real no tiene faltas › recibido [ TEXTO_CLIENTE_PRESTADO, LINEA_MEDIDA_PRESTADO ]` | — |
| DEPLOY-3 | 1186 | `**no se corta**` → `**no se toca**` | 8 de 8; `real no tiene faltas › recibido [ 'no se corta' ]` | — |

Las tres restauraron con diff vacío, sha idéntico y CRLF completo. Ninguna quedó sin rojo.

### L2.5 · barrido de citas (regla de mutación 4)

Método: para cada fichero tocado en la rama (`conexionPerdida.ts`, su `.test.ts`, su `.integration.test.ts`, `testing/hijoConexionCortada.ts`, `deployPoolConexionCortada.test.ts`, `DEPLOY.md`), `grep -rnoE --exclude-dir=node_modules --exclude-dir=.codegraph --exclude-dir=dist --exclude-dir=.git "<fichero escapado>:[0-9]+(-[0-9]+)?" .` y cruce, por script, con el conjunto de líneas cambiadas desde `a1882ad7` (módulo `:44`; unitaria `:7`; integración `:6 :11 :136 :145 :151 :170 :176-186`; hijo `:2 :12 :14 :26 :50 :51 :54 :67`; guarda `:4 :11 :32 :35`; `DEPLOY.md` `:1179 :1182 :1183 :1185 :1186`). Ninguna línea se movió (todo en sitio o al final), así que sólo importan los rangos que tocan una línea cambiada: **40 resultados**, 37 en artefactos de este cambio y 3 en el archivo de `pool-conexion-cortada`. **Ninguno** en otros ficheros del repositorio ni en los seis de Supervisión (`ENTRADA.md`, `F0-05`, `CLAUDE.md`, el expediente, `config.yaml`): sus citas a `DEPLOY.md` van de `:31` a `:1112`, y las de `openspec/specs/zoho-sync/spec.md`, a `DEPLOY.md:1112`, todas por debajo de la §27.

| Cita (donde está) | Qué afirma | Caso | Acción |
|---|---|---|---|
| `proposal.md:15` → `…integration.test.ts:179` | la I-4 «fija» que el proceso muere | B | anclada «en `4d7aad75`», misma línea física |
| `proposal.md:58` → `conexionPerdida.ts:35` | «hoy sólo pone el oyente del pool, en `:43`» | B | anclada, «hoy» quitado |
| `proposal.md:148` → `DEPLOY.md:1182-1183` | su razón escrita es que el proceso muere | B | anclada |
| `proposal.md:168` → `hijoConexionCortada.ts:51-54` | el modo `prestado` no libera nunca el cliente | B | anclada; «Hoy … no libera» pasa a «Su … no liberaba» |
| `specs/zoho-sync/spec.md:98` → `hijoConexionCortada.ts:51-54` | el modo `prestado` no libera el cliente | B | anclada; «no libera» pasa a «no liberaba» |
| `design.md:193` → `DEPLOY.md:1182` y `:1183` (abreviada) | «Sigue muriendo» está partida hoy entre las dos | B (hallada en el barrido) | anclada; «está partida hoy» pasa a «estaba partida … en `4d7aad75`» |
| `proposal.md:77` → `DEPLOY.md:1182-1183`; `:78` → `1185-1186`; `:82` → `1179-1186`, `packages/zoho-sync/src/db/conexionPerdida.ts:43` y `packages/zoho-sync/src/db/conexionPerdida.integration.test.ts:179`; `:107` → `:179`; `:144` → `1185-1186` | nombran dónde están el cliente prestado, la precaución de la §26 y la I-4, o lo que CA-2 pide cambiar | A | sin cambio: las líneas siguen siendo ese lugar |
| `specs/zoho-sync/spec.md:19` → `conexionPerdida.ts:35`; `:91` → `:179`; `:161` → `DEPLOY.md:1179-1183` y `:1182-1183`; `:163` → `1185-1186`; `:175` → `1182-1186` | piden o nombran el sitio a cambiar; `:175` ya va anclada «en `4d7aad75`» | A | sin cambio |
| `design.md:20, 68, 97, 98, 99, 118, 119, 120, 124, 157, 164, 166, 172, 173, 174, 177, 184, 185, 186, 187` y `tasks.md:56` | el plan en sitio: qué línea cambia y a qué (`:157` ya va con «su texto en `4d7aad75`») | A | sin cambio: describen el cambio, no el estado previo |
| `archive/2026-11-12-pool-conexion-cortada/apply-progress.md:160` → `DEPLOY.md:1182` | DEPLOY-2 de entonces borró aquella viñeta | B (informe fechado) | NO se edita |
| `openspec/changes/archive/2026-11-12-pool-conexion-cortada/apply-progress.md:191` → `DEPLOY.md:1185` | la §27 era la última, comprobado en la revisión de entonces | B | NO se edita |
| `openspec/changes/archive/2026-11-12-pool-conexion-cortada/verify-report.md:117` → `DEPLOY.md:1179-1186` | CA-7 «límite escrito» cumplido en aquella revisión | B | NO se edita |

Citas del archivo que no caen en línea cambiada, por tanto caso A y sin acción: `conexionPerdida.ts:43`, `integration.test.ts:132 :141 :101-105 :18 :17`, `hijoConexionCortada.ts:37`, `conexionPerdida.test.ts:30 :44 :61 :74 :93 :165 :184-209`, `deployPoolConexionCortada.test.ts:10 :40 :41 :46`, `DEPLOY.md:1150 :1171 :1143 :1127 :1146`.

**Segundo pase humano (forma abreviada, `:NNN` sin fichero)** en los ficheros que citan los tocados (`proposal.md`, `design.md`, `tasks.md`, `specs/zoho-sync/spec.md`; el archivo, sin editar): se leyeron todas. Sobre líneas cambiadas sólo caían las del plan (`design.md:97-98` `:12 :14 :51 :67`; `:118` `:151`; `:120` `:136 :145 :170`; `:184-185` `:34-35 :11`; `tasks.md:42-59`, listas «en sitio»), caso A por ser el plan, y la `design.md:193`, ya anclada arriba. Las demás abreviadas (`conexionPerdida.ts:3 :15 :27 :35 :43`, `conexionPerdida.test.ts:30 :44 :61 :66 :74 :93`, `deployPoolConexionCortada.test.ts:46-50 :52-56 :58-62 :64-67`, `integration.test.ts:155 :156 :114 :129`) apuntan a líneas que no cambian y siguen diciendo lo mismo. El detector no bloquea la abreviada: esta lectura es la comprobación.
No se corrió el detector (`cli.ts --sha`) sobre el árbol: trabaja sobre un commit y no hay commit del lote; queda para la L2.7 del orquestador.

### L2.6 · respuesta MEDIDA a la pregunta de la §26 (`design.md` §7), para el verify

**Medido** (PostgreSQL 17.10, contenedor local `postgres:17-alpine`, nunca producción; I-4, I-5 e I-6 en verde):
- I-4 (cliente prestado por `pool.connect()` con transacción abierta, en `idle in transaction`: la forma del pid raíz de la §26 cuando es de la App) e I-6 (lo mismo con `createPoolFromUrl`, el pool del worker): el proceso **sale con 0** (antes, con 1 y «Unhandled 'error' event»), sale **una** línea `… — terminating connection due to administrator command [57P01]` y el pool vuelve a servir con **otro pid**.
- I-5 (cliente prestado con consulta en curso): salida 0; línea `… — Connection terminated unexpectedly`, sin código; la consulta rechaza con `57P01`.
- **La razón corregida, medida:** en los tres, la siguiente consulta sobre ese cliente y el `ROLLBACK` **rechazan**: la transacción del usuario no se confirma. Por eso la precaución de la §26 se conserva con esa razón (ya no que el proceso muera).

**Sin medir, y queda dicho:** que la ruta de la App responda su error de siempre (hipótesis, escrita así en `DEPLOY.md:1183`); el arranque, si el pid raíz es la puesta al día (`packages/zoho-sync/src/db/puestaAlDiaEstricta.ts:80`), que la §26 da por detenido con salida 1; PostgreSQL 17.11 de producción y el `application_name` de la App allí; que EasyPanel enseñe stderr.

### Cierre previo del lote (lo que queda es de la L2.7 del orquestador)

- `npm run typecheck` → salida 0. `npm run lint -- --max-warnings 165` → salida 0, «✖ 165 problems (0 errors, 165 warnings)»: 165 contra 165.
- No se corrió `npm test` entero ni el build. `tasks.md`: L2.1 a L2.6 marcadas en sitio, L2.7 sin marcar.
- Casilla de la regla 13: nada bajo `apps/desk/src`. Sin tocar: `pool.ts`, los seis sitios, `conexionPerdida.ts` y sus pruebas, `.env.example`, `schema.sql`, `migrate.ts`, `deployArranqueEstricto.test.ts`, los seis de Supervisión y el archivo de `pool-conexion-cortada`.

- **Medida del lote (i4):** `git diff --shortstat --no-renames d092a1e8` → 7 ficheros, 160 inserciones y 21 borrados = **181**, sin ficheros sin trackear ni binarios; muy por debajo de 800. Por fichero (`--numstat`): `DEPLOY.md` 15/5, guarda 32/4, `apply-progress.md` 101/0, `design.md` 1/1, `proposal.md` 4/4, `spec.md` 1/1, `tasks.md` 6/6.
