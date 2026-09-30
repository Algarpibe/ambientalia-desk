# apply-progress — `permisos-por-cargo` (F1C-05, `cierra: no`) — Lote 1 · `shared` (2026-09-30)

Modo: strict TDD, `hybrid`. Tareas hechas: 0.1-0.4 y 1.1-1.12 (Lote 1 completo). Sin commit: lo hace el orquestador.

## Línea base y medida
- HEAD `38eed82` (no `e591454`: los commits intermedios son sólo de `docs/`; `git diff --stat e591454 HEAD -- apps packages` vacío).
- Antes: 160 ficheros de prueba (159 pasan, 1 omitido), 1.992 pruebas, typecheck limpio, **165 avisos** de eslint.
- Después: 161 ficheros, 2.024 pruebas (+27 `cargos.test.ts`, +5 `permisos.test.ts`; 2 omitidas como antes), typecheck limpio, **165 avisos** (0 `any` nuevos).
- Estimado ~330; medido: `git diff --shortstat --no-renames HEAD` con los nuevos en `git add -N` sobre el código: 362 inserciones + 5 borrados = 367. Total del lote con este fichero, `tasks.md` y `design.md`: 432 inserciones + 21 borrados = **453**. Margen a 800: 347.

## Puntos medidos (0.3)
| Fichero | Largo hoy (diseño) | Cambio |
|---|---|---|
| `types.ts` | 810 | `:1`, `:220`, `:222` en sitio: `+3 −3` |
| `transitions.ts` | 397 (413) | `:52` en sitio: `+1 −1` |
| `index.ts` | 24 | `:25` nueva, al final: `+1 −0` |
| `permisos.test.ts` | 334 (335) | `:5` en sitio; +50 al final (384): `+51 −1` |
| `permissions.ts` | 7 | sin tocar |
Grep previo: `cargo_permiso|cargoPermiso` = 0 y `Director Comercial` en `*.ts(x)` = 0.

## Rojos previos y nacidos verdes
- Rojo natural: `./cargos` no existía (falla la importación de `cargos.test.ts`) y `puedeEjecutarTransicion` no estaba exportada (5 pruebas nuevas de `permisos.test.ts` en rojo).
- Nacen verdes (no se tocan): `permisos.test.ts:77-81` (102 = 60/42, sólo área, S19), la matriz HTTP y las gemelas de Equipo nuevo y Soporte remoto.
- Nacen verdes tras el GREEN por diseño: la comprobación de que la tabla no toca las otras dos matrices (sólo se prueba por mutación (f)).

## Correcciones del usuario (prevalecen sobre diseño y tasks)
- **C-8** Las tres primitivas se llaman `puedeLiberarSinFactura`, `puedeCrearOVIGarantia`, `puedeFijarPrioridadTop5`, reciben el `SujetoDePermiso` completo y exigen área Y cargo; el admin pasa. `puedeLiberarSinFactura(s)` = `puedeEjecutarTransicion(s, <liberacion_sin_factura de TRANSITIONS>)` (falla cerrado si la transición no existe).
- **C-9** Un cargo fuera de la lista o vacío (`''`, `'director comercial'`, `' Director Comercial'`, `undefined`, `null`, `7`, `{}`) es «sin cargo» en las cinco funciones (`cargoEfectivo` con `esCargo`, sin confiar en el tipo); probado.
- **C-10** «El cargo sólo restringe» en `cargos.test.ts`: 5 subconjuntos de `AREAS` × 10 valores de cargo (`CARGOS` ∪ `null`, `''`, `'Gerente comercial'`) × 37 acciones = **1.850** casos (a mano); ninguno concede con el área negada; además exige que alguno conceda. En `permisos.test.ts`: exactamente un caso difiere, 61/41 y 816 casos.
- **C-11** Guardián contra `openspec/config.yaml` (regla de mutación 2): lee el fichero, localiza `decision/c10b-gerente-director` y la frase «Los cargos son siete: … y …» (`config.yaml:2589`, comprobado), compara en orden y como conjunto, 7; si no encuentra bloque o frase, falla con mensaje claro.
- **C-12** `transitions.ts:52` tipado en sitio con `import('./cargos').Cargo`.
- **S-9** (supuesto reversible): el área de los dos actos sin llamador es Servicio Técnico (OVI de garantía) y Comercial (Top 5); lo fijan F1B-03 y F1B-07. También en `design.md` §1.

## Hipótesis de 1.5
Confirmada: los literales `'Director Técnico'` (`transitions.ts:276`) y `'Coordinador Comercial'` (`:278`) tipan contra `Cargo` sin cambio. Ninguna anotación extra.
Otras desviaciones: `cargoPermisoDelCuerpo('   ')` (sólo espacios) → `null`, como `''`; `cargoQueFaltaParaTransicion` usa `Object.hasOwn` para que `'toString'` no cuente como excepción.

## Mutaciones (todas revertidas; `git diff` de `config.yaml` vacío)
| # | Mutación | Rojo |
|---|---|---|
| g | `'Director comercial'` en `CARGOS` | 8: S1 «siete, a mano y en orden», guardián D, `esCargo`/tabla/compuesta |
| g2 | octavo cargo `'Gerente comercial'` | 6: guardián D, S1 (dos), barrido 1.850, 816 casos, `cargoPermisoDelCuerpo` |
| g3 | `config.yaml:2589` «Coordinador» → «Coordinadora» | 1: guardián D |
| f | clave `liberacion_sin_facturaX` | 15: «toda clave existe en TRANSITIONS», «un caso difiere», contenido exacto |
| l | `&&` → `\|\|` en la compuesta | 16: 816 «nunca amplía», barrido 1.850, «cargo sin el área» |
| i (pura) | quitar la salida del admin | 2: «admin nunca echa en falta un cargo», «admin pasa por las 34» |
| n | quitar el área de `puedeCrearOVIGarantia` | 2: barrido «sólo restringe», prueba de la primitiva |
| m | `'Director técnico'` en `transitions.ts:276` | `npm run typecheck`: TS2820 en `transitions.ts(276,41)` |

## Cierre 1.12
`npm test`, `npm run typecheck`, `npm run lint` verdes (arriba). Citas: sólo las de esta carpeta (`design.md`, `tasks.md`, `exploration.md`) apuntan a `types.ts:1`/`:220-222`, `transitions.ts:52` y `permisos.test.ts:5`; siguen acertando (caso A). Nada se desplaza: `types.ts` y `transitions.ts` `+n −n`, `index.ts` y `permisos.test.ts` sólo al final. Tiempo de `npm test`: ~110 s.

# apply-progress — Lote 2 · servidor: columna, sesión, rutas, guarda y matriz (2026-09-30)

Modo: strict TDD, `hybrid`. Tareas hechas: 2.1-2.23 (Lote 2 completo). HEAD `db5630f`. Sin commit: lo hace el orquestador.

## Línea base, medida y lint
- Antes: 161 ficheros, 2.024 pruebas (2 omitidas), **165 avisos** de eslint. Después: 162 ficheros, 2.046 pruebas (2 omitidas; +19 `cargoPermiso.test.ts`, +2 `users.test.ts`, +1 `migrate.test.ts`), typecheck y `npm run build` limpios, **165 avisos** (0 nuevos: ni `any` ni non-null nuevos que avisen). `npm run lint` acepta la línea de `ticketService.ts:131`: el plan B del diseño §5 NO hizo falta.
- Estimado ~360; medido: `git diff --shortstat --no-renames HEAD` con `cargoPermiso.test.ts` en `git add -N`: 416 inserciones + 51 borrados = **467** (269 de `cargoPermiso.test.ts`, que el ledger sólo cuenta con `git add -N`; 46 de las casillas de `tasks.md`; 50 de este fichero). Margen a 800: 333; el 90 % (720) no se alcanza.
- Sin `+n −n` de más: `ticketService.ts` `+3 −3` (234 líneas, sin cambio), `sessions.ts` `+1 −1`, `users.ts` `+10 −10` (158 líneas, sin cambio: el campo de `:30` va en la misma línea que `empresa`, no en una nueva), `types.ts` sin tocar en este lote, `schema.sql` `+5 −0` (596 → 601), `auth/routes.ts` `+7 −3` (176 → 180), `migrate.test.ts` en sitio `:374-377` y +12 al final, `permisos.test.ts` `+2 −2` (`:53`, `:64`).

## Cuándo surte efecto un cambio de cargo
En la SIGUIENTE petición, sin volver a entrar: `requireAuth` llama a `getSessionUser` en cada petición (`auth/middleware.ts:18`) y éste hace el JOIN sessions↔users por token y lee `u.cargo_permiso` cada vez (`auth/sessions.ts:17-21`); la sesión guarda el token, no el cargo. Fijado por la prueba «surte efecto en la siguiente petición, sin volver a entrar» (403 → PATCH admin → 200 con la MISMA cookie) y por su mutación (d). Por eso NO se añade nada a P.1: la nota de despliegue de `tasks.md` ya dice «no hace falta volver a entrar». Sigue en hipótesis, y es del lote 3, que el BOTÓN aparezca sin recargar (el cliente carga `/api/auth/me` al montar).

## Ciclo TDD (RED → GREEN → REFACTOR)
| Tareas | RED (rojo natural) | GREEN | REFACTOR |
|---|---|---|---|
| 2.1-2.5 esquema | 2 rojos: recuento 41/20 y «última sentencia» (había 40 `ALTER`) | `schema.sql` `:597-601` calificada, sin `CHECK` | sin cambio |
| 2.6-2.9 usuario y sesión | `users.test.ts` 2 rojos, S8 rojo (las consultas no traían la columna) | `users.ts` (10 líneas en sitio), `sessions.ts:17`, `appHarness.ts:91-93` | el campo va en la línea de `empresa` para no desplazar |
| 2.10-2.13 rutas | S5 (dos), S7 rojos; el 403 a no admin nace verde | `routes.ts` `:7`, `:70-71`, `:78`, `:99-100` | validación del PATCH antes de `updateUser` |
| 2.14-2.22 guarda | matriz de Comercial en `:64` roja; 8 de `cargoPermiso.test.ts` rojas | `ticketService.ts:6`, `:118`, `:131` en sitio | ninguno |

**Nacen verdes y se declaran:** el 403 a un no admin (S6, `requireAdmin`, `auth/middleware.ts:26-29`), S10 antes de la guarda (200 sin restricción), S17, S20, P1, P2, P3 (el 409 y el 403 de área ya contestan primero: se prueban por mutación), la comprobación de `migrate.integration.test.ts` (omitida sin base real) y las matrices gemelas de Equipo nuevo y Soporte remoto. S2 y S11 pasan a verdes tras la guarda.

## Work Unit Evidence
| Evidencia | Valor |
|---|---|
| Comando enfocado | `npx vitest run apps/desk/server/cargoPermiso.test.ts apps/desk/server/permisos.test.ts apps/desk/server/auth packages/zoho-sync/src/db/migrate.test.ts`: verde. `npm test` completo: 161 ficheros pasan y 1 omitido; 2.044 pasan y 2 omitidas |
| Harness de ejecución | pg-mem + supertest (`appHarness`); el ciclo HTTP entero (sesión, PATCH admin, transición) corre en `cargoPermiso.test.ts` |
| Rollback | `git revert` del lote 2; la columna queda (aditiva). Primer lote con efecto vivo |

## Posiciones (regla de mutación 1): cada prueba activa las DOS guardas a la vez
- **P1** 403 de área vs de cargo: Servicio Técnico sin cargo → «área: Comercial», y no aparece «Director Comercial». **P2** 409 de estado vs cargo: Comercial sin cargo en `Ingresado`. **P3** 409 de flujo (`ticketService.ts:125`) vs cargo: Comercial sin cargo, ticket `Equipo nuevo`, y el mensaje contiene «equipo nuevo». **P4** 403 de cargo vs 422: cuerpo `{}`; el control con el administrador y el mismo cuerpo da 422, así que las dos guardas estaban activas.
- **S-10 (supuesto reversible, del orquestador):** el usuario pidió «frente a los dos 409 gana el 403 de cargo», pero con el 403 de cargo en `:131` (tras el de área, como también pide) los 409 de `:125-128` corren ANTES y ganan; se sigue el orden de F1B-10 (`design.md` §5, orden 400 · 404/409 flujo · 409 estado · 403 área · 403 cargo · 422). P2 y P3 fijan que el 409 gana.

## Mutaciones (todas revertidas; `git diff` de los ficheros de producción = el del GREEN)
| # | Mutación | Rojo |
|---|---|---|
| a | 403 de cargo ANTES del de área | P1 (1) |
| b | 403 de cargo ANTES de los 409 (tras el 404) | P1, P2, P3 (3) |
| c | 403 de cargo DETRÁS del 422 | P4 (1) |
| d | quitar `u.cargo_permiso` de `sessions.ts:17` | S8, S10 (Director Comercial 200) y «surte efecto» (3) |
| e | quitar la validación del alta | S5 (alta), S7 (2) |
| f | quitar `requireAdmin` del PATCH | S6 (1) |
| g | `ALTER TABLE users ...` sin `public.` en `schema.sql` (fichero vigilado, regla 2) | guardián `:345-352`, «sin calificar», recuento 41/20 y «última sentencia» (4) |
| h (j) | `rowToPublicUser` sin `esCargo` | S4 de `users.test.ts` (1) |
| i (HTTP) | quitar la salida del admin en `cargoQueFaltaParaTransicion` | «admin pasa por las 34», S15+S18, P4 control (3) |
| k | validación del PATCH detrás de `updateUser` | S5+(k), S7, «surte efecto» (3) |

## Barrido de citas de la regla 4 (`auth/routes.ts`, único que desplaza)
`:67-68` (`avisos.test.ts:113`, `derivacion-avisos/spec.md:415`, `Paquete_de_Despliegue_2026-09-30.md:961`), `:63`, `:62-67`, `:11-12`, `:18-22`: intactas, **caso A**. Desplazadas: `F0-00_Baseline_as-built.md:405` (`:129`, el DELETE, hoy `:133`) y `2026-08-12-editar-usuario.md:84` (`:74-105`, el PATCH, hoy `:78-118`): **caso B**, ancladas «en `e591454`» (la revisión donde eran ciertas). `2026-08-12-avisos-cambio-de-area.md:564` (`:121-124`) ya no era cierta en HEAD (son comentario del DELETE): caso B preexistente, no desplazada por este lote, queda para 3.6. Contenido cambiado en sitio y releído: `ticketService.ts:129-131` y `:125-131` (specs `transitions-st`, `transitions-equipo-nuevo`) siguen afirmando el área y la cadena de guardas; `users.ts:14-16`, `:19-32` y `sessions.ts:16-23` (spec `permissions`) siguen siendo `USER_SELECT`, `rowToPublicUser` y `getSessionUser`; `permisos.test.ts:30` sigue en el `throw` de área. El detector (`citas/cli.ts --sha`) trabaja sobre commits: queda para el cierre con el commit.
