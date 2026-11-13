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
