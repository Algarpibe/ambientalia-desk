# Tasks — `permisos-por-cargo` (F1C-05, nivel CARGO, `cierra: no`)

**Entradas:** `proposal.md`, `exploration.md`, `design.md`, `specs/permissions/spec.md` de esta carpeta. Preflight (`openspec/config.yaml:25-30`, gana): `auto · hybrid · ask-on-risk · 800 líneas · strict_tdd`.
`strict_tdd` activo: cada tarea de código va precedida de su prueba en rojo y de un «confirmar rojo natural»; lo que nace verde se declara en `apply-progress.md`. Los `.tsx` están fuera de la red de pruebas (F0-00, `vitest.config.ts:16-20`): sin RED/GREEN, no se propone `jsdom`.
Puntos de inserción leídos el 2026-09-30 contra el árbol de HEAD (`e591454`, lo confirma la 0.1); las cifras sin ejecutar van marcadas «hipótesis».

## Correcciones al diseño y a la spec (prevalecen sobre ellos)

- **C-1 · Forma del cuerpo.** Spec y diseño coinciden: `cargoPermiso` (cadena de la lista, `null` o `''`) en `POST /api/users` y `PATCH /api/users/:id`. Manda el diseño en todo lo demás.
- **C-2 · `index.ts` tiene 24 líneas, no 25.** `packages/shared/src/index.ts:24` es `export * from './contratos'`; el `export * from './cargos'` nuevo es la línea **:25** (el diseño decía la línea 26). Sigue siendo «al final», sin desplazar nada.
- **C-3 · Dónde se inserta en `auth/routes.ts`** (el diseño dice «+2 y +2» sin fijar línea): la validación del alta va **tras `:69` y antes de `createUser` (`:70`)**, no entre `:65` y `:69`. Así `:67-68` no se mueven, y las citan `apps/desk/server/db/avisos.test.ts:113`, `openspec/specs/derivacion-avisos/spec.md:415` y `docs/sdd/Paquete_de_Despliegue_2026-09-30.md:961`. La de la edición va tras `auth/routes.ts:96` (después del 422 de rol de `auth/routes.ts:94`, antes del bloque de protección de `auth/routes.ts:97`). La importación **no** abre línea: se añade con `;` a `auth/routes.ts:7`; el tipo del parche de `auth/routes.ts:76` se edita en sitio con `import('@ambientalia/shared').Cargo`.
- **C-4 · Hueco de la spec sin prueba en el diseño.** RQ-PM-13, escenario «la migración está calificada y al final», exige que la `ALTER` de `cargo_permiso` sea la última sentencia de `schema.sql`. El diseño sólo reescribe los recuentos de `migrate.test.ts:374-377`. Se añade una prueba AL FINAL de `migrate.test.ts` (tarea 2.3).
- **C-5 · `cargoPermisoDelCuerpo(undefined)` devuelve `{ ok: true, cargo: null }`**, no error: el diseño dice «otra cosa → error», pero el alta sin el campo es válida (S-4, «ausente o `null` → sin cargo»). En la edición la ruta sólo llama si el campo no es `undefined`, para no borrar el cargo al guardar otros datos.
- **C-6 · Cita vieja dentro del delta.** `specs/permissions/spec.md` (RQ-PM-03 modificado) dice que el 403 lo lanza «`ticketService.ts:89`»: hoy el 403 de área es `ticketService.ts:129-130`. La 3.5 relee todas las citas del delta contra HEAD y las corrige en el delta (caso A) antes de que el archive las fusione en la spec viva.
- **C-7 · Helper de pruebas.** Para el escenario «el cargo de firma no da permiso» hace falta un usuario con `users.cargo = 'Director Comercial'` y `cargo_permiso` nulo: `userCookie(areas, cargoPermiso?)` no fija `cargo`, así que esa prueba crea el usuario con `createUser` directo (acepta `cargo`).

**Matriz de amenazas de la skill:** N/A (`design.md` «Threat Matrix»: sin enrutado de procesos, shell, subprocesos ni automatización de VCS). Los casos de contenido hostil que sí hay (valor fuera de lista escrito por SQL, cargo con mayúsculas o espacios, cargo de firma con el nombre de un cargo) son RED explícitos: 1.1, 2.6, 2.10.

## Review Workload Forecast

Medida de cada lote: `git add -N <nuevos>` + `git diff --shortstat --no-renames HEAD -- <ficheros del lote>` **más** `wc -l` de su `apply-progress.md` (≤ 60 líneas, contadas DENTRO de su lote). Una edición en sitio cuenta `+n −n`. Lo nuevo sin trackear no lo cuenta el ledger: se suma a mano con `wc -l`. El ledger mide sin detección de renombrado.

| Lote | Código | Pruebas | `apply-progress` | Total estimado | Margen a 800 | Depende |
|---|---|---|---|---|---|---|
| 1 · `shared` | ~75 (`cargos.ts` ~55, `types.ts` ±8, `transitions.ts` ±2, `index.ts` +1, `permisos.test.ts:5` ±2) | ~195 (`cargos.test.ts` ~145, final de `permisos.test.ts` ~50) | ~60 | **~330** | ~470 | — |
| 2 · Servidor | ~50 (`schema.sql` +5, `users.ts` ±15, `sessions.ts` ±2, `appHarness.ts` ±4, `auth/routes.ts` ±8, `ticketService.ts` ±6, `migrate.test.ts` ±6, `permisos.test.ts:64` ±2) | ~250 (`cargoPermiso.test.ts` ~215, `users.test.ts` +~20, final de `migrate.test.ts` +~14) | ~60 | **~360** | ~440 | 1 |
| 3 · Cliente y cierre | ~60 (`TransitionPanel.tsx` ±4, `client.ts` ±4, `UsersAdmin.tsx` ~+22 ±4, `permisos.test.ts:53` ±2, texto R08.3 ~+30) | — | ~60 (incluye la casilla de la regla 13) | **~150** | ~650 | 2 |
| **Total** | | | | **~840** | | |

```text
Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium
```

- La etiqueta literal dice «400-line»; el techo real es **800 por lote** (`review_budget_lines`) y la entrega es **commit directo a `main`**, un commit por lote, en serie (decisión del usuario). **Ningún lote pasa de 800** (el mayor, el 2, ronda ~360) y **ninguno pasa de 400**: el riesgo es Medio sólo por el TOTAL (~840). Por eso no hay decisión previa al apply. `stacked-to-main` se aplica como supuesto reversible del modo `auto`: no es ninguna de las cinco condiciones de parada de `CLAUDE.md`.
- **Válvula:** si tras el GREEN de un lote el acumulado medido supera **90 % del techo (720)**, se para y se declara. Las mutaciones no añaden líneas (se revierten); `apply-progress.md` sí.
- **Previsión de `verify`** (intento aparte, sin tocar código): **~340 líneas de `verify-report.md`**, sumando OBLIGATORIO (precedentes: 358 en `detector-citas-extremos`; aquí 21 escenarios y tres lotes que contrastar). Cabe en 800, pero no es opcional.
- **Previsión de `archive`** (intento aparte): el ledger mide sin renombrado, así que **la carpeta cuenta dos veces** (borrada y reinsertada).

| Concepto | Líneas |
|---|---|
| Carpeta que se mueve: `proposal` 164, `exploration` 129, `design` 239, spec 217, `tasks` ~300, `apply-progress` ~180 (3 × ~60), `verify-report` ~340, `archive-report` ~190 | ~1.760 |
| Contada dos veces (`git mv` sin `-M`) | ~3.520 |
| Fusión del delta en `openspec/specs/permissions/spec.md` (RQ-PM-03 modificado y RQ-PM-12..22 nuevos) | ~230 (**se mide, no se estima**: hacerla en un worktree cuesta un minuto) |
| **Total previsto** | **~3.750** (± 400) |

**El archive probablemente NO cabe en 800 (excede unas 4,7 veces) y necesitará aprobación de techo de mantenedor, como `detector-citas-extremos`** (allí 5.000 aprobados para 4.502 medidas). Aquí se pide **4.500** (~750 de margen sobre lo previsto). La justificación no es el tamaño: ~3.520 de esas líneas son un `git mv` verbatim de carga de revisión cero; lo revisable son ~230 de fusión más el `archive-report`.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | `cargos.ts`: lista cerrada, tabla de excepciones, compuesta, primitivas, `cargoPermisoDelCuerpo`; `UserPublic.cargoPermiso`; tipo en `transitions.ts:52` | commit 1 | `npx vitest run packages/shared/src/cargos.test.ts` y `npx vitest run apps/desk/server/permisos.test.ts -t "cargo"` | node puro (`vitest.config.ts:16`) | `git revert` del lote 1 tras revertir 2-3. Sin efecto vivo: nadie llama a la compuesta |
| 2 | Columna `cargo_permiso`, sesión, alta/edición validadas, 403 de cargo en `ticketService.ts:131`, matriz HTTP | commit 2 | `npx vitest run apps/desk/server/cargoPermiso.test.ts apps/desk/server/permisos.test.ts apps/desk/server/auth packages/zoho-sync/src/db/migrate.test.ts` | pg-mem + supertest (`appHarness`) | `git revert`; la columna queda (aditiva, sólo la lee este código). **Primer lote con efecto vivo**: sólo admin libera sin factura hasta P.1 |
| 3 | `TransitionPanel.tsx`, `UsersAdmin.tsx`, `client.ts`, regla 13 escrita, barrido de la regla 4, texto R08.3 | commit 3 | `npm run typecheck && npm run build` (`.tsx` fuera de la red) | N/A para `.tsx` (F0-00); verificación manual en P.2 | `git revert`; UI y documentación, el servidor sigue imponiendo |

**Convenciones de todos los lotes.**
- «En sitio» = mismo número de líneas; «al final» = sólo inserciones. El cierre de cada lote lo comprueba con `git diff --numstat HEAD -- <fichero>` y `wc -l`.
- Barrido de la regla de mutación 4 al cierre de cada lote sobre los ficheros que tocó (el completo es 3.6): `grep -rnoE "<fichero>\.(ts|tsx|sql):[0-9]+(-[0-9]+)?" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=archive`, más segundo pase para la forma abreviada; se comprueban los DOS extremos de cada rango y se LEE qué afirma cada cita (A presente / B histórico / C superado).
- Tras cada cierre: `npm test`, `npm run typecheck`, `npm run lint` (techo de avisos **165 sin holgura**, `eslint.config.js:15`: el código nuevo no puede añadir ningún `any`) y `apply-progress.md` (≤ 60 líneas). Si `auth/routes.test.ts` da timeout intermitente es E-091: se relanza y se anota.
- Una tanda SDD por árbol (regla del ciclo 2): los tres lotes, `verify` y `archive` van **en serie**, cada uno en su intento del ledger; nada en paralelo sobre este árbol.

## Fase 0 · Preparación (orquestador; sin código)

- [ ] 0.1 `git rev-parse --short HEAD` (esperado `e591454`) y `git status --short` (sólo los sin trackear de la cabecera de sesión y `openspec/changes/permisos-por-cargo/`). `git diff --stat e591454 HEAD -- apps packages` vacío.
- [ ] 0.2 Línea base verde: `npm test`, `npm run typecheck`, `npm run lint`. Anotar en `apply-progress.md` nº de ficheros de prueba, de pruebas y de **avisos de eslint** (techo 165).
- [ ] 0.3 Re-medir largos y citas antes de escribir (valores leídos hoy entre paréntesis; si un fichero sale MAYOR, alguien añadió citas: se leen). `wc -l` sobre `packages/shared/src/{types,index,transitions,permissions}.ts` (`index.ts` **24**), `packages/zoho-sync/src/db/schema.sql` (**596**), `migrate.test.ts`, `apps/desk/server/auth/{routes,users,sessions}.ts`, `services/ticketService.ts`, `permisos.test.ts` (**335**), `testing/appHarness.ts` (**96**), `TransitionPanel.tsx`, `UsersAdmin.tsx`, `api/client.ts`. Copiar la tabla de puntos de cada lote a su `apply-progress.md` con los valores medidos.
- [ ] 0.4 `Grep "cargo_permiso|cargoPermiso"` sobre `apps/` y `packages/` = 0 (nada preexistente) y `Director Comercial` = 0 en `*.ts`/`*.tsx`.

---

## Lote 1 · `shared`: cargos, compuesta, primitivas

**Estimación ~330.** **Depende de:** —.

**Puntos de inserción (medidos hoy)**

| Fichero | Punto | Tipo |
|---|---|---|
| `packages/shared/src/cargos.ts` | fichero nuevo | NUEVO |
| `packages/shared/src/cargos.test.ts` | fichero nuevo | NUEVO |
| `packages/shared/src/index.ts` (24 líneas) | `:25` nueva: `export * from './cargos'` | FINAL |
| `packages/shared/src/types.ts` | `:1` se añade `; import type { Cargo } from './cargos'` tras el `;`; `:220` (comentario de `cargo`, `:221`) se reescribe; `:222` gana `; cargoPermiso?: Cargo \| null` (`UserPublic`, `:211-223`) | EN SITIO |
| `packages/shared/src/transitions.ts` | `:52` pasa a `\| { tipo: 'cargo'; cargo: import('./cargos').Cargo }`; los literales de `:276` y `:278` no cambian | EN SITIO |
| `apps/desk/server/permisos.test.ts` (335) | `:5` importa además `puedeEjecutarTransicion`, `CARGOS`, `EXCEPCIONES_POR_CARGO`; pruebas puras nuevas al FINAL (tras `:335`) | EN SITIO + FINAL |

`permissions.ts` **no se toca**.

### Bloque A · RED

- [ ] 1.1 RED — `packages/shared/src/cargos.test.ts` (nuevo), comando `npx vitest run packages/shared/src/cargos.test.ts`:
  - **S1** la lista literal de siete, escrita a mano y EN ORDEN (`Director Técnico`, `Coordinador Técnico`, `Técnico`, `Técnico de campo`, `Director Comercial`, `Coordinador Comercial`, `Asistente Comercial`); «Gerente comercial» no está; `esCargo` exacto, sin plegar (`'director comercial'`, `' Director Comercial'` y `7` → `false`).
  - Tabla: toda clave de `EXCEPCIONES_POR_CARGO.transiciones` existe en `TRANSITIONS` y **en ningún otro catálogo** (`TRANSITIONS_EQUIPO_NUEVO`, `TRANSITIONS_SOPORTE_REMOTO`); su valor es un `Cargo`; contenido exacto `{ liberacion_sin_factura: 'Director Comercial' }`, `crearOVIGarantia: 'Director Técnico'`, `fijarPrioridadTop5: 'Director Comercial'`.
  - `cargoQueFaltaParaTransicion`: admin → `null`; sin excepción → `null`; con el cargo → `null`; sin cargo, con otro cargo y con `cargoPermiso: undefined` → `'Director Comercial'`.
  - `puedeEjecutarTransicion`: nunca concede lo que el área niega; admin pasa; `Comercial` + `Director Comercial` → sí; `Comercial` sin cargo → no.
  - **S16** `puedeCrearOVIGarantia` y `puedeFijarPrioridadTop5` por cada uno de los siete cargos, «sin cargo» y admin; el nombre de la prueba dice que **hoy no las llama nadie** (F1B-03 y F1B-07, RQ-PM-20).
  - `cargoPermisoDelCuerpo`: `null`, `''`, `undefined` → `{ ok: true, cargo: null }` (C-5); `'  Director Comercial '` recortado → cargo; `'Gerente comercial'`, `5`, `{}` → `{ ok: false, error }`.
- [ ] 1.2 RED — `permisos.test.ts` **al final**, nuevas, puras (sobre `TRANSITIONS × AREAS`), comando `npx vitest run apps/desk/server/permisos.test.ts -t "cargo"`:
  - **S21 (nivel puro)** la lista de casos donde `puedeEjecutarTransicion` sin cargo difiere de `canExecuteTransition` es, escrita a mano, exactamente `[{ transicion: 'liberacion_sin_factura', area: 'Comercial' }]`; con la compuesta el total es 102 = **61 / 41**.
  - Matriz con cargo `AREAS × (CARGOS ∪ {null}) × TRANSITIONS` = 3 × 8 × 34 = **816** casos (total escrito a mano): ningún caso con la compuesta verdadera y el área falsa (**S17**, nivel puro); con `Director Comercial` la compuesta coincide con el área en los 102.
- [ ] 1.3 Confirmar rojo natural: `./cargos` no existe (todo rojo por importación) y `puedeEjecutarTransicion` no está exportada. **Nacen verdes y se declaran:** `permisos.test.ts:77-81` (102 = 60/42, sólo área; **S19**, es el suelo) y todo el resto del fichero, que no se toca.

### Bloque B · GREEN

- [ ] 1.4 GREEN — `cargos.ts` (nuevo) con la API de `design.md` §1: `CARGOS` (`as const`), `Cargo`, `esCargo`, `EXCEPCIONES_POR_CARGO`, `SujetoDePermiso`, `cargoQueFaltaParaTransicion` (admin → `null` **antes** de mirar la tabla), `puedeEjecutarTransicion` = `canExecuteTransition(s.areas, s.isAdmin, t.area) && cargoQueFalta === null` (importa `canExecuteTransition` de `./permissions`), `puedeCrearOVIGarantia`, `puedeFijarPrioridadTop5` (docstring: sin llamador hasta F1B-03/F1B-07; el área la pone el acto), `cargoPermisoDelCuerpo`. Sin `any`.
- [ ] 1.5 GREEN — `index.ts:25` al final; `types.ts:1`, `:220`, `:222` en sitio; `transitions.ts:52` en sitio. **Hipótesis a comprobar:** los literales `'Director Técnico'` (`transitions.ts:276`) y `'Coordinador Comercial'` (`:278`) tipan contra `Cargo` sin cambio; si `npm run typecheck` rechaza alguno por no estar el objeto contextualmente tipado, se declara y se ajusta la anotación EN SITIO, sin insertar línea.
- [ ] 1.6 Confirmar 1.1-1.2 en verde y `npm run typecheck` limpio. `git diff --numstat` de `types.ts` y `transitions.ts` = `+n −n`; `index.ts` 24 → 25 con `−0`; `permisos.test.ts` 335 → 335+N con `−` sólo en `:5`.

### Bloque C · Mutaciones (reglas 1 y 2)

- [ ] 1.7 MUTACIÓN **(g)** — `'Director comercial'` en `CARGOS`: ROJO en la lista literal de siete (S1); revertir.
- [ ] 1.8 MUTACIÓN **(f)** — clave `liberacion_sin_facturaX` en `EXCEPCIONES_POR_CARGO.transiciones`: ROJO en «toda clave existe en `TRANSITIONS`» y en «exactamente un caso difiere»; revertir.
- [ ] 1.9 MUTACIÓN **(l)** — `&&` → `||` en `puedeEjecutarTransicion`: ROJO en la matriz de 816 «nunca amplía» (S17); revertir.
- [ ] 1.10 MUTACIÓN **(i), mitad pura** — quitar la salida del admin en `cargoQueFaltaParaTransicion`: ROJO en la prueba de admin de 1.1 (la mitad HTTP, contra `permisos.test.ts:89-109`, es la 2.22); revertir.
- [ ] 1.11 MUTACIÓN **(m, extra de este plan)** — cambiar el literal de `transitions.ts:276` a `'Director técnico'`: ROJO en `npm run typecheck` (prueba que S-7 tipa de verdad); revertir.
- [ ] 1.12 Cierre del lote 1: comandos enfocados de la tabla; `npm test`; `npm run typecheck`; `npm run lint` (≤ 165); medir (nuevos: `cargos.ts`, `cargos.test.ts`); barrido de citas sobre `types.ts` (`:211-223`, `:220-222`), `transitions.ts` (`:52`, `:246`, `:276`, `:278`), `index.ts` y `permisos.test.ts`; `apply-progress.md` (~60 líneas, con los nacidos verdes y el resultado de la hipótesis de 1.5).

---

## Lote 2 · Servidor: columna, sesión, rutas, guarda y matriz

**Estimación ~360.** **Depende de:** Lote 1. **Es el lote que activa la restricción en vivo.**

**Puntos de inserción (medidos hoy)**

| Fichero | Punto | Tipo |
|---|---|---|
| `packages/zoho-sync/src/db/schema.sql` (596) | tras `:596`: comentario ASCII sin tildes y **sin `;`** (el troceo de `migrate.ts` es por `;`) + `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS cargo_permiso text;` | FINAL |
| `packages/zoho-sync/src/db/migrate.test.ts` | título `:374` y cifras `:376-377` (40→**41**, 19→**20**, «15 de public»); `:378` (21) y `:385` no cambian; prueba de C-4 AL FINAL del fichero. **No** se añade docstring arriba: desplazaría el bloque que cita `CLAUDE.md` (regla de mutación 2) | EN SITIO + FINAL |
| `apps/desk/server/auth/users.ts` | `:4` importa `esCargo`; `:14` `USER_SELECT` + `u.cargo_permiso`; `:30` (`rowToPublicUser`, `:19-32`) + línea `cargoPermiso: esCargo(row.cargo_permiso) ? row.cargo_permiso : null`; `:36` y `:40-42` (`createUser`); `:86` (tipo del parche) y `:98` (asignación, misma línea con `;`) | EN SITIO (+1 línea en `:30`) |
| `apps/desk/server/auth/sessions.ts` | `:17` (`getSessionUser`, `:15-25`) + `u.cargo_permiso` | EN SITIO |
| `apps/desk/server/testing/appHarness.ts` | `:91` y `:93`: `userCookie(areas, cargoPermiso?)` | EN SITIO |
| `apps/desk/server/auth/routes.ts` (176) | `:7` se añade `; import { cargoPermisoDelCuerpo } from '@ambientalia/shared'`; **alta:** +2 líneas tras `:69`, antes de `:70`; `:70` pasa `cargoPermiso`; **edición:** `:76` tipo del parche; +2 líneas tras `:96`; `updateUser` (`:104`) queda detrás (mutación k) | EN SITIO + INSERCIÓN (+4) |
| `apps/desk/server/services/ticketService.ts` (549 con cita) | `:6` importa además `cargoQueFaltaParaTransicion`; `:118` firma de `user` gana `cargoPermiso?: Cargo \| null` (importar `type Cargo` en `:6`); **`:131`** (hoy `}`) pasa a `} const cargoFalta = cargoQueFaltaParaTransicion(t.id, user); if (cargoFalta) throw new HttpError(403, { error: \`«${t.name}» sólo la ejecuta el cargo ${cargoFalta}\` }) // Escalón B (F1C-05)`; `:129-130` **no cambian** | EN SITIO, **cero líneas insertadas** |
| `apps/desk/server/permisos.test.ts` | `:64` (esperado con la compuesta); `:30` (cita `ticketService.ts:130`) sigue siendo el 403 de área | EN SITIO |
| `apps/desk/server/cargoPermiso.test.ts`, `apps/desk/server/auth/users.test.ts` (+~20 al final) | nuevos / al final | NUEVO / FINAL |

**Plan B de la guarda** (sólo si `apply` rechaza la forma en sitio de `:131`): 403 de área en una línea (`:129`), de cargo en `:130`, comentario en `:131`; hay que reapuntar `permisos.test.ts:30` y la cita `ticketService.ts:129-130` de `openspec/specs/permissions/spec.md` (`design.md` §5). Se declara.

### Bloque A · Esquema (regla de mutación 2: se ensucia el fichero vigilado)

- [ ] 2.1 RED — `migrate.test.ts` en sitio `:374`, `:376`, `:377`: **41** `ALTER`, **20** calificadas, «15 de public»; `:378` y `:385` intactos.
- [ ] 2.2 RED — `migrate.test.ts` **al final** (C-4, **S3**): la última sentencia de `schema.sql` es un `ALTER TABLE public.users … cargo_permiso` calificado y sin `CHECK` (texto de la sentencia sin `CHECK`, D-4). Comando `npx vitest run packages/zoho-sync/src/db/migrate.test.ts`.
- [ ] 2.3 Confirmar rojo natural (hay 40 `ALTER` y la última sentencia es `CREATE TABLE public.alarmas_corte`). El guardián `:345-352` y el de tablas clasificadas nacen verdes y se declaran.
- [ ] 2.4 GREEN — `schema.sql` tras `:596` (comentario sin `;` + la sentencia). Confirmar 2.1-2.2 en verde y `migrate.integration.test.ts` sin cambios; `schema.sql` 596 → 596+N con `−0`.
- [ ] 2.5 MUTACIÓN **(e)** (regla 2) — escribir en `schema.sql` `ALTER TABLE users ADD COLUMN IF NOT EXISTS cargo_permiso text` **sin calificar**: ROJO en `migrate.test.ts:345-352` (`users` no es de `DESK_TABLES`) y en el recuento de `:374-386`; revertir; `git diff` limpio.

### Bloque B · Datos de usuario y sesión

- [ ] 2.6 RED — `cargoPermiso.test.ts` (nuevo) y `auth/users.test.ts` al final. Comando `npx vitest run apps/desk/server/cargoPermiso.test.ts apps/desk/server/auth/users.test.ts`:
  - **S4 / (j)** unitaria: una fila con `cargo_permiso = 'Gerente comercial'` escrita por SQL → `getUserById` devuelve `cargoPermiso: null`; con `'Director Comercial'` → `'Director Comercial'`; `rowToPublicUser` de una fila sin la columna → `null`.
  - `createUser` con `cargoPermiso` lo persiste; `updateUser` lo cambia y con `null` lo vacía; `listUsers` lo trae.
  - **S8 / (h)** sesión real: usuario con `cargo_permiso = 'Director Comercial'` y cookie válida pasando por `requireAuth`: `req.user.cargoPermiso === 'Director Comercial'`.
- [ ] 2.7 Confirmar rojo natural (`createUser` ignora el campo, `USER_SELECT` y `getSessionUser` no lo seleccionan).
- [ ] 2.8 GREEN — `users.ts` (`:4`, `:14`, `:30`, `:36`, `:40-42`, `:86`, `:98`), `sessions.ts:17`, `appHarness.ts:91-93` (`userCookie(areas, cargoPermiso?)` pasa el cargo a `createUser`). `listPersonas` (`users.ts:74-81`) **no cambia**. Confirmar 2.6 en verde; `users.ts` 105 → 106 (sólo la línea de `:30`).
- [ ] 2.9 MUTACIÓN **(h)** — quitar `u.cargo_permiso` de `sessions.ts:17`: ROJO en S8 y, más adelante, en «Comercial + Director Comercial → 200» (2.15); revertir. MUTACIÓN **(j)** — `rowToPublicUser` sin `esCargo`: ROJO en S4; revertir.

### Bloque C · Rutas de alta y edición

- [ ] 2.10 RED — `cargoPermiso.test.ts` (supertest, `appWith()` + `adminCookie()`): **S5** alta y edición con `cargoPermiso: 'Gerente comercial'` → `422 { error }` y **no se escribe la fila** (ni se crea el usuario ni cambia el cargo previo); **S6** un no admin (`userCookie(['Comercial'])`) recibe `403` en `POST /api/users` y en `PATCH /api/users/:id`; **S7** `PATCH` con `cargoPermiso: ''` deja `cargo_permiso` nulo; alta con `cargoPermiso: 'Director Comercial'` → `201` con el cargo; alta sin el campo → `201` con `null`; edición sin el campo **no borra** el cargo existente; **S2** el cargo de firma no da permiso (usuario `Comercial` con `users.cargo = 'Director Comercial'` y `cargo_permiso` nulo → `403` en `liberacion_sin_factura`, C-7; queda verde tras la 2.15, se declara aquí).
  **(k) posición:** el 422 del PATCH no escribe: la fila conserva el valor anterior.
- [ ] 2.11 Confirmar rojo natural (las rutas ignoran el campo). **Nace verde y se declara:** el 403 a un no admin (`requireAdmin`, `auth/middleware.ts:26-29`, ya lo impone) y la edición sin el campo.
- [ ] 2.12 GREEN — `routes.ts`: `:7`; alta, +2 tras `:69` (`cargoPermisoDelCuerpo(req.body.cargoPermiso)`, `!ok` → `422 { error }`); `:70` pasa el cargo; edición, `:76` y +2 tras `:96`, **sólo si `req.body.cargoPermiso !== undefined`**, antes de `updateUser`. `users.cargo` de firma (`:68`, `:90`) sigue libre. Confirmar 2.10 en verde y `git diff --numstat` de `routes.ts` = `+4` netas más ediciones en sitio.
- [ ] 2.13 MUTACIÓN **(k)** — mover la validación del PATCH detrás de `updateUser`: ROJO en «el 422 no escribe»; revertir.

### Bloque D · Guarda de cargo y matriz HTTP

- [ ] 2.14 RED — `permisos.test.ts:64` en sitio: `esperado[t.id] = puedeEjecutarTransicion({ areas: [area], isAdmin: false, cargoPermiso: null }, t) ? 200 : 403`; **S21** (nivel HTTP): se añade en `cargoPermiso.test.ts` la comparación de las 102 celdas observadas contra las de área: difiere **una sola**, Comercial sin cargo × `liberacion_sin_factura` (200 → 403). Antes del GREEN la matriz de `:41-66` sale roja en el área `Comercial`.
- [ ] 2.15 RED — `cargoPermiso.test.ts`, ticket en `Por Facturar` (`t.from[0]`), valores de `valoresValidos`:
  - **S9** Comercial sin cargo → `403` cuyo mensaje nombra `Director Comercial`, y el ticket no cambia; **S10** `Comercial` + `Director Comercial` → `200`; **S11** `Comercial` + `Coordinador Comercial` → `403`; **S17** `Servicio Técnico` + `Director Comercial` → `403` de ÁREA; `Comercial` + `Director Técnico` → `403`; valor fuera de lista escrito por SQL (`'Gerente comercial'`) → `403`;
  - **S15** administrador sin `cargo_permiso` → `200`; **S18** base donde todos los `cargo_permiso` son nulos: no admin de `Comercial` → `403` con el cargo necesario y el admin `200`;
  - **S20** `Compras` ejecutando `facturado` desde `Por Facturar` → `403` y el mensaje contiene `área: Comercial`.
  - **Posiciones (regla 1):** **S12** ticket fuera de `Por Facturar`, Comercial sin cargo → `409`, no `403`; **S13** `Compras` sin cargo en `Por Facturar` → el `403` nombra el área (`área: Comercial`), no el cargo; **S14** Comercial sin cargo y sin la casilla obligatoria (`transitions.ts:247`) → `403`, no `422`; y el caso de flujo: el mismo ticket con clasificación `Equipo nuevo` → `409` de flujo gana (`ticketService.ts:125`).
- [ ] 2.16 Confirmar rojo natural (la guarda no existe: todo Comercial sin cargo da `200`). **Nacen verdes y se declaran:** S12 y S13 (el `409` y el `403` de área ya contestan primero), S15, S20, y las matrices gemelas de Equipo nuevo y Soporte remoto (`permisos.test.ts:238`, `:321`), que **no cambian** porque la excepción no está en esos catálogos. `transicionesEjecucion.test.ts:50` ejecuta con `adminCookie()`: no se ve afectada.
- [ ] 2.17 GREEN — `ticketService.ts:6`, `:118` y `:131` en sitio (cero líneas insertadas). Comprobar: `wc -l` sigue igual, `git diff --numstat` = `+3 −3`, y `ticketService.ts:129-130` y `:132-134` intactos (`:130` sigue citado por `permisos.test.ts:30`).
- [ ] 2.18 Confirmar 2.14-2.15 en verde; `permisos.test.ts:77-81` sigue en 60/42 (S19); el orden queda 400 `:123` · 404/409 de flujo `:125` · 409 de estado `:126-128` · 403 de área `:129-130` · **403 de cargo `:131`** · 422 `:132-134`.
- [ ] 2.19 MUTACIÓN **(a)** (regla 1) — guarda de cargo ANTES de `:126`: ROJO en S12 (409 de estado gana); revertir.
- [ ] 2.20 MUTACIÓN **(b)** — guarda de cargo ANTES de `:129`: ROJO en S13 (se compara el MENSAJE, `área: Comercial`); revertir.
- [ ] 2.21 MUTACIÓN **(c)** — guarda de cargo DETRÁS de `:134`: ROJO en S14 (403 gana al 422); y **(d)** guarda ANTES de `:125`: ROJO en el caso de flujo `Equipo nuevo`; revertir ambas.
- [ ] 2.22 MUTACIÓN **(i), mitad HTTP** — quitar la salida del admin en `cargoQueFaltaParaTransicion`: ROJO en `permisos.test.ts:89-109` y en S15; revertir.
- [ ] 2.23 Cierre del lote 2: comando enfocado de la tabla; `npm test`; `npm run typecheck`; `npm run lint` (≤ 165); medir (nuevos: `cargoPermiso.test.ts`); recuentos (`schema.sql` 596 → 596+N `−0`, `ticketService.ts` sin cambio de largo, `users.ts` +1, `routes.ts` 176 → 180, `migrate.test.ts` → +N al final); barrido de citas de `auth/routes.ts` (ver 3.6), `users.ts`, `sessions.ts`, `ticketService.ts`, `appHarness.ts`, `migrate.test.ts`, `schema.sql`; `apply-progress.md` (~60 líneas).

---

## Lote 3 · Cliente y cierre

**Estimación ~150.** **Depende de:** Lote 2. `apps/desk/src` está fuera de la red de pruebas (F0-00): sin RED/GREEN para `.tsx`; **no se propone `jsdom`**.

**Puntos de inserción (medidos hoy)**

| Fichero | Punto | Tipo |
|---|---|---|
| `apps/desk/src/components/TransitionPanel.tsx` | `:8` importa `puedeEjecutarTransicion` en lugar de `canExecuteTransition` (único uso, `:57`); `:57` pasa a `(t) => !!user && puedeEjecutarTransicion(user, t)` | EN SITIO |
| `apps/desk/src/api/client.ts` | `:107` (`NewUser` + `cargoPermiso`), `:121` (parche + `cargoPermiso`) | EN SITIO |
| `apps/desk/src/components/UsersAdmin.tsx` | alta: estado tras `:98`, `:108` pasa `cargoPermiso`, `<select>` junto a `:119`; edición: estado tras `:152`, `:159` pasa `cargoPermiso`, `<select>` junto a `:170`. Siete `CARGOS` más «Sin cargo» | INSERCIÓN (~+22) |
| `apps/desk/server/permisos.test.ts` | `:53` cita `ticketService.ts:86` como el 409 de estado; el 409 está en `:126-128` | EN SITIO (caso A) |
| `docs/sdd/R08.3_Expediente_de_cambios.md` | texto para el expediente (`toca_maestro: si`), al FINAL, sin tocar el `.docx` | FINAL |

### Bloque A · Cliente

- [ ] 3.1 `TransitionPanel.tsx:8` y `:57` en sitio: oculta la transición si `!puedeEjecutarTransicion(user, t)`, la misma función de `shared`; el cliente no reescribe la regla (regla 13, punto 1).
- [ ] 3.2 `client.ts:107`, `:121` en sitio y `UsersAdmin.tsx`: `<select>` con `CARGOS` (importado de `@ambientalia/shared`) y «Sin cargo»; vacío se manda como `''` y el servidor lo guarda nulo. El campo `cargo` de firma sigue siendo texto libre y separado.
- [ ] 3.3 Sin prueba posible (F0-00): `npm run typecheck`, `npm run build` y `npm run lint` (≤ 165) en verde. La imposición está probada en node: lote 2.

### Bloque B · Cierre

- [ ] 3.4 **Regla de mutación 3 — casilla de la regla 13, decisión a decisión** (se escribe en `apply-progress.md` con la línea REAL leída al cerrar, no la del diseño). Se lee cada `.tsx` tocado entero y se enumera lo que el cliente bloquea, rellena solo o avisa:
  | Decisión del cliente | Línea del servidor que la impone (a confirmar) |
  |---|---|
  | `TransitionPanel.tsx:57` oculta la transición si falta el área o el cargo | `ticketService.ts:129-130` (área) y `:131` (cargo); probadas por `permisos.test.ts:41-66` y `cargoPermiso.test.ts` → comodidad legítima (punto 3) |
  | `UsersAdmin.tsx` ofrece los siete cargos y «Sin cargo» | el 422 de `auth/routes.ts` en alta y edición (líneas reales al cerrar) |
  | La consola sólo la usa un administrador | `requireAdmin` en `auth/routes.ts` (alta y edición; 403 a no admin probado, S6) |
  | El campo `cargo` de firma es texto libre | ninguna, y es correcto: no es autoridad (S2) |
  | Cualquier otra decisión que aparezca al leer los ficheros | — |
  Sin línea, la decisión es la guarda: se para y se declara.
- [ ] 3.5 **Citas del delta y del propio cambio.** Releer contra HEAD cada cita de `specs/permissions/spec.md` (en particular la de `ticketService.ts:89` del RQ-PM-03, C-6, y `permisos.test.ts:77-82`, `:24-27`, `:29-33`, `:35-39`, `:89-109`) y de `design.md`/`proposal.md` que cambien de contenido; si difieren, se corrigen en el delta (caso A) y se declara. **Reapuntar en sitio `permisos.test.ts:53`** (`ticketService.ts:86` → `ticketService.ts:126-128`, caso A) y comprobar que `permisos.test.ts:30` sigue citando el `throw` del 403 de área (`ticketService.ts:130`).
- [ ] 3.6 **Barrido de la regla de mutación 4 sobre CADA fichero muy citado tocado**, con el comando `grep -rnoE "<fichero>\.(ts|tsx|sql):[0-9]+(-[0-9]+)?" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=archive` y un segundo pase para la forma abreviada:
  - **`auth/routes.ts` (+4, el único que desplaza):** `:67-68` no se mueven (C-3); `:70` y siguientes suben +2 y `:97` y siguientes +4. Comprobar `docs/sdd/F0-00_Baseline_as-built.md:405` (`routes.ts:129`, DELETE, hoy `:133`) y los dos planes fechados del 2026-08-12 (`:121-124`, `:74-105`): **caso B**, se nombra la revisión `e591454`; verificar `avisos.test.ts:113` y `openspec/specs/derivacion-avisos/spec.md:415` (`:67`, siguen en caso A).
  - **`UsersAdmin.tsx`** (inserta): sólo hay citas en un registro fechado y un plan del 2026-08-12 → caso B.
  - **En sitio o al final** (verificación de contenido): `ticketService.ts` (`:129-131`, `:131`, y las ~549 citas: ninguna se mueve), `transitions.ts`, `schema.sql` (al final), `permisos.test.ts`, `types.ts`, `users.ts`, `sessions.ts`, `appHarness.ts`, `migrate.test.ts` (los citados por `CLAUDE.md` no se mueven), `index.ts`, `client.ts`, `TransitionPanel.tsx` (`CLAUDE.md:369`, specs vivas: `TransitionPanel.tsx:56-57` siguen siendo el filtro de transiciones). Los DOS extremos de cada rango; se LEE qué afirma cada frase.
  - Después, el detector de citas sobre el diff: `npx tsx apps/desk/server/citas/cli.ts --sha HEAD`, **0 rotas nuevas** (no se salta con `--no-verify`).
- [ ] 3.7 Texto para el expediente R08.3, AL FINAL de `docs/sdd/R08.3_Expediente_de_cambios.md` (~30 líneas, sin tocar el `.docx`): M1.9.1 pasa de «por área» a «por área y cargo» para tres restricciones (Anexo D nº 39); `[AS-BUILT]` y `[ABIERTO — R05]` (gerente comercial = Director Comercial); el maestro sigue diciendo «permiso por área»: releer las líneas `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.2.md:1714`, `:1715` y `:1723` ANTES de citarlas. Declara que el cargo sólo restringe, que faltan los Decisionales (F1C-04) y el propietario del registro, y que OVI de garantía y Top 5 están como primitivas sin llamador.
- [ ] 3.8 `git diff --stat HEAD -- CLAUDE.md openspec/config.yaml` vacío (R-2 no aplica: sin capacidad nueva; `permissions` ya está en `capabilities`).
- [ ] 3.9 **Para el `archive-report`** (se redacta en `apply-progress.md`; lo inserta el archive): (a) la línea de cobertura de `proposal.md` «Cubre de F1C-05 el nivel CARGO…»; (b) **H5, sin destino**: conviven dos «cargo» (`users.cargo` de firma, alarmas y derivación frente a `cargo_permiso` cerrado); que lo asigne quien decida el alcance; (c) corrección documental de §4.1 de la spec viva `permissions` («no distinguido» → implementado para el cargo); (d) resultado de P.1 y P.2 si ya existe; (e) la nota de despliegue literal de abajo.
- [ ] 3.10 Cierre general: `npm test`; `npm run typecheck`; `npm run lint` (techo 165 sin holgura); `npm run build`; medir el lote; confirmar uno a uno los seis criterios de éxito de `proposal.md`; `apply-progress.md` (~60 líneas, con la casilla de 3.4).

---

## Nota para el cierre — paquete de despliegue (literal)

Antes de desplegar hace falta un paquete de despliegue NUEVO (los `Paquete_de_Despliegue_*` son registros fechados y no se editan). De esta tanda:

1. **Una columna nueva**, sin relleno y sin `CHECK`: `public.users.cargo_permiso` (la crea `migrate` al arrancar).
2. **El hueco es inevitable.** La columna nace con el despliegue, así que el cargo NO se puede asignar antes. Desde la migración hasta que un administrador asigne el cargo en la consola de usuarios, **sólo los administradores ejecutan «Liberación sin factura»**: un Comercial no admin deja de ver el botón y, si llama a la API, recibe 403 que nombra «Director Comercial».
3. **Las otras dos restricciones** (crear OVI de garantía → Director Técnico; prioridad Top 5 → Director Comercial) no tienen llamador hasta F1B-03 y F1B-07: hoy no cambia nada observable.
4. **Precondición (P.1):** nombrar quién asigna `Director Comercial` a quién justo tras desplegar y aceptar ese intervalo por escrito.
5. Rollback: revertir los commits; la columna es aditiva y sólo la lee este código. Sin desplegar el código, `UPDATE public.users SET cargo_permiso = NULL` retira las asignaciones; vaciar `EXCEPCIONES_POR_CARGO.transiciones` devuelve exactamente la matriz de área.

---

## Matriz de cobertura de escenarios (21/21)

`(V)` = nace VERDE y se prueba su discriminación por mutación o como regresión; `(M)` = manual.

| # | Requisito | Escenario | Lote | Tarea(s) |
|---|---|---|---|---|
| S1 | RQ-PM-12 | La lista tiene siete entradas exactas | 1 | 1.1, 1.7 |
| S2 | RQ-PM-13 | El cargo de firma no da permiso | 2 | 2.10 (V tras 2.15), 2.17 |
| S3 | RQ-PM-13 | La migración está calificada y al final | 2 | 2.2, 2.4, 2.5 |
| S4 | RQ-PM-14 | Valor desconocido en base | 2 | 2.6, 2.9 (j) |
| S5 | RQ-PM-15 | Cargo inválido | 2 | 2.10, 2.12, 2.13 (k) |
| S6 | RQ-PM-15 | No admin | 2 | 2.10 (V) |
| S7 | RQ-PM-15 | Vaciar el cargo | 2 | 2.10, 2.12 |
| S8 | RQ-PM-16 | La sesión real lleva el cargo | 2 | 2.6, 2.9 (h) |
| S9 | RQ-PM-17 | Comercial sin cargo | 2 | 2.15, 2.17 |
| S10 | RQ-PM-17 | Director Comercial | 2 | 2.15, 2.9 (h) |
| S11 | RQ-PM-17 | Otro cargo comercial | 2 | 2.15 |
| S12 | RQ-PM-18 | 409 antes que 403 de cargo | 2 | 2.15 (V), 2.19 (a) |
| S13 | RQ-PM-18 | 403 de área antes que el de cargo | 2 | 2.15 (V), 2.20 (b) |
| S14 | RQ-PM-18 | 403 de cargo antes que 422 | 2 | 2.15, 2.21 (c) |
| S15 | RQ-PM-19 | Admin sin cargo | 1, 2 | 1.10, 2.15 (V), 2.22 (i) |
| S16 | RQ-PM-20 | Por cargo y admin (primitivas sin llamador) | 1 | 1.1 |
| S17 | RQ-PM-21 | Cargo sin área | 1, 2 | 1.2, 1.9 (l), 2.15 |
| S18 | RQ-PM-22 | Nadie tiene cargo | 2 | 2.15 |
| S19 | RQ-PM-03 | La matriz de área, sin cambios (102 = 60/42) | 1, 2 | 1.3 (V: `permisos.test.ts:77-81`), 2.18 |
| S20 | RQ-PM-03 | Prohibición por área | 2 | 2.15 (V) |
| S21 | RQ-PM-03 | Exactamente un caso difiere | 1, 2 | 1.2, 2.14, 1.8 (f) |

**21/21 cubiertos.** Las doce mutaciones del diseño: (f), (g), (l), (i-pura) en el lote 1; (e), (h), (j), (k), (a), (b), (c), (d), (i-HTTP) en el lote 2; (m) es extra. `.tsx`: sin escenario automatizable (F0-00); cubierto por la casilla de la regla 13 (3.4) y por P.2.

## Tareas de persona — fuera del recuento (regla del ciclo 1)

Cada una con dueño, destino y dónde queda escrita. **Archivar este cambio NO las da por hechas.** Ninguna describe trabajo que una tanda pueda hacer en este repositorio (se comprobó al sacarlas: el apply no puede consultar producción, asignar datos ni desplegar).

- **P.1 · Gerencia o administración — asignar `cargo_permiso` a cada usuario real en producción, empezando por el Director Comercial, y aceptar por escrito el intervalo sin cargo.** Dato de producción. Desde la migración hasta la primera asignación, **sólo un administrador libera sin factura** (no hay respaldo al área, S-1). Ayuda de sólo lectura (hipótesis de nombres de tabla: `public.users`): `SELECT id, email, name, cargo, active FROM public.users WHERE active ORDER BY name;`. Se asigna en la consola de usuarios (`UsersAdmin.tsx`), no por SQL. Destino: paquete de despliegue de la tanda. Escrita en: este documento, `proposal.md` (§Tareas de persona) y el `archive-report`. Resultado (a rellenar): `_________`.
- **P.2 · Comercial, con quien decida Gerencia — verificación en la app tras desplegar**, en `ambientalia-desk.ambientalia.cloud`: (1) un no admin de Comercial sin cargo no ve «Liberación sin factura» en un ticket en `Por Facturar`; (2) tras asignarle `Director Comercial` en la consola, la ve y la ejecuta sin volver a entrar (si el botón pide recargar la página, se anota: hipótesis del diseño); (3) un Director Comercial de otra área no la ve; (4) el administrador la ve siempre. Destino: verificación en la app. Escrita en: este documento, `proposal.md` y el `archive-report`.
- **P.3 · Gerencia — asignar destino a la divergencia H5** (dos «cargo»: firma/alarmas/derivación frente a permiso). Hoy queda registrada SIN destino. Destino: la respuesta se registra en `openspec/config.yaml` → `decisiones_de_gerencia`, o se asigna a una fila del §5 del plan; sin respuesta sigue abierta. Escrita en: el `archive-report` y `design.md` §11.

## Dependencias entre lotes

Lote 1 es la base: `CARGOS`, la tabla de excepciones y la compuesta viven en `packages/shared` (regla 13: una sola fuente; el cliente las consume). El lote 2 depende sólo del 1: columna, sesión, rutas y guarda consumen `shared` y es el primero con efecto vivo. El lote 3 depende del 2: el espejo del cliente sólo es «comodidad legítima» cuando la imposición del servidor está probada, y el cierre (regla 3, regla 4, texto R08.3) sólo tiene sentido con todo el código dentro. Una tanda SDD por árbol (regla del ciclo 2): los tres lotes van **en serie**; `verify` y `archive` son intentos aparte, y el archive suma el `git mv` y supera 800 (~3.750 previstos, techo de 4.500 por pedir a un mantenedor).
