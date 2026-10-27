# Progreso de apply — `codigo-servicio-bloqueado` (intento 2, lote L1)

Partida `1fc261b4`, rama `codigo-servicio-bloqueado`, worktree propio. Modo `strict_tdd`. Tareas L1.1 a L1.18 hechas; L1.c es del orquestador.

## M0 — línea base (L1.1) y posterior (L1.12)

| | Ficheros de prueba | Pruebas | Resultado |
|---|---|---|---|
| M0 previo (sin tocar nada) | 327 (323 pasan, 4 saltados) | 5.681 (5.655 pasan, 26 saltadas) | exit 0, 241,97 s, memoria libre antes: 14.906 MB |
| M0 posterior | 329 (325 pasan, 4 saltados) | 5.732 (5.706 pasan, 26 saltadas) | exit 0, 254,13 s, memoria libre antes: 14.896 MB |
| Diferencia | +2 | +51 | las 51 son las dos pruebas nuevas; ninguna existente cambió |

Hipótesis del diseño (ninguna prueba existente ejecuta las dos transiciones como no administrador sobre un ticket con código): **confirmada**, la suite
entera sigue verde sin tocar un solo fichero de pruebas existente. `npm run typecheck` = 0. `npm run lint -- --max-warnings 165` = 165 avisos, 0 errores.

## Rojo primero (L1.2-L1.5)

Rojo medido antes de implementar: `codigoServicio.test.ts` no cargaba (`Cannot find module './codigoServicio'`); en la prueba HTTP, 17 rojas por la razón
correcta (`CLAVE_CODIGO_SERVICIO` indefinida, o `expected 200 to be 403`, `expected 200 to be 422`, `expected 'FALSO' to be undefined`) y ninguna por el
arnés. **PCS-1, PCS-4 y PCS-5 nacieron verdes** (la guarda no existía, así que el 403 de área y los dos 409 ya ganaban): no pueden ser rojo previo; su
valor está en la mutación M1. PCS-2 y PCS-3 nacieron rojos. Pruebas: 30 en `codigoServicio.test.ts` (143 líneas) y 21 en
`codigoServicioBloqueado.test.ts` (196 líneas, CB-1..CB-7 y PCS-1..PCS-5; CB-6b y «cargo de dirección» incluidas).

## Implementación (L1.6-L1.11)

- `packages/shared/src/codigoServicio.ts` (58 líneas, nuevo) y `index.ts` línea 56 (`1 0`).
- `ticketCreate.ts` `:7` y `:12` en sitio (`2 2`); el alta sigue pasando `new Date()`.
- `ticketService.ts` `:6`, `:131`, `:155` en sitio (`3 3`). Líneas releídas antes de editar: coinciden con las de `tasks.md`.
- `TransitionPanel.tsx` `:8`, `:80`, `:174` en sitio (`3 3`); `.tsx` fuera de la red de pruebas (F0-00): sus tres escenarios son **VERIFICACIÓN MANUAL**,
  no probados ni dados por pasados (propuesta editable al abrir sin código; bloqueado para el no administrador con código; desbloqueado al administrador).
- El `else if` del `:80` queda dentro de la misma cadena que el de la derivación (`:87`): son excluyentes y la semántica del resto no cambia.
- Colocación: `git diff --numstat 1fc261b4` = `ticketService.ts` 3 3 · `ticketCreate.ts` 2 2 · `TransitionPanel.tsx` 3 3 · `index.ts` 1 0. Cumple.

## Mutaciones (L1.13-L1.15). Copia al scratchpad antes de cada una; `perl -i -pe` con `$. == N`; restaurado por copia

Tras M1 `git diff -- ticketService.ts | sha256sum` = `16271e25…c82bd`, igual al de antes; tras M2, `sha256sum codigoServicio.ts` = `645a05fa…6b4e`, igual;
`git diff -- transitions.ts` vacío. `file` con CRLF en todos los ficheros tras restaurar. Control M0 con el conjunto: 51 verdes.

**M1 posición, `ticketService.ts` (guarda movida):**

| Colocación | Rojas (fichero › prueba › aserción) |
|---|---|
| (a) fuera de `:131`, al final de `:134` | `codigoServicioBloqueado.test.ts › PCS-2` › `expected 422 to be 403` |
| (b) al final de `:128` | `› PCS-1` › `expected 'El código de servicio de este ticket …' to contain 'Tu rol no tiene permiso para esta tra…'` |
| (c) tras el `}` inicial de `:128` | `› PCS-1` (misma aserción) · `› PCS-3` › `expected 403 to be 409` · `› PCS-5` › `expected 403 to be 409` |
| (d) **añadida**: al final de `:125`, antes del 409 de estado | `› PCS-1` · `› PCS-3` · `› PCS-4` › `expected 403 to be 409` · `› PCS-5` |

**Desvío respecto a `tasks.md`:** la tarea daba por rojas PCS-3, PCS-4 y PCS-5 en (c). No es así: en (c) la guarda cae DESPUÉS del `}` que cierra el 409 de
estado, así que PCS-4 sigue verde (y PCS-1 se pone roja, que la tarea no nombraba). Para que PCS-4 discrimine hizo falta la colocación (d), antes del
`if (!t.from.includes(…))`. Las cinco pruebas de posición tienen al menos una colocación que las pone rojas.

**M2 condición, `codigoServicio.ts`:**

| Mutación | Rojas |
|---|---|
| quitar `&& !puedeCambiarCodigoServicio(s)` (`:41`) | `codigoServicio.test.ts › valor distinto: dispara sin administrador y no con administrador` y `› un valor de sólo espacios con previo es un CAMBIO` (`expected true to be false`); `codigoServicioBloqueado.test.ts › CB-4` (las dos transiciones) y `› CB-5 el administrador que inyecta un previo falso` (`expected 403 to be 200`); `› PCS-2` (`expected 403 to be 422`) |
| quitar los `trim()` (`:37`, `:41`) | `codigoServicio.test.ts › previo "   "`, `› previo " \t "`, `› mismo valor, también con espacios alrededor: pasa`; `› CB-2` y `› CB-3 código guardado "   "` (`expected 403 to be 200`) |
| quitar la salida del previo vacío (`:38`) | `codigoServicio.test.ts › previo null / "" / "   " / " \t "`; `› CB-3` (null, `''`, `'   '`) y `› CB-5 primer código con clave inyectada` (`expected 403 to be 200`) |
| `'   '` como vacío (`:26`) | `codigoServicio.test.ts › un valor de sólo espacios con previo es un CAMBIO` (`expected false to be true`); `› CB-6b` (`expected 200 to be 403`) |
| (extra) no borrar la clave inyectada (`:54`) | `codigoServicio.test.ts › una clave inyectada se borra siempre`; `› CB-5 inyectada en un primer código` (`expected 'FALSO' to be undefined`) |

**M2b fichero vigilado**, `transitions.ts:262` `cfText('Código Servicio')` → `cfText('Codigo Servicio')`: rojas `codigoServicio.test.ts › catálogo: son exactamente
ingreso_a_servicio y calibracion_directa` (`expected [ 'ingreso_a_servicio' ] to deeply equal [ 'calibracion_directa', … ]`) · `codigoServicioBloqueado.test.ts › CB-1
calibracion_directa` (`expected 200 to be 403`) · `› CB-4 calibracion_directa` (`expected 'MT_A_B_261001' to be 'MT_A_C_261001'`) · `› PCS-3` (`expected 200 to be 403`).

## M3 — casilla de la regla invariable 13 (L1.16), líneas releídas en este árbol

| Decisión del cliente (`TransitionPanel.tsx`) | Dónde se decide en `shared` | Línea del servidor que la impone |
|---|---|---|
| C-1 Bloquear el código si el ticket ya lo tiene | `cambiaCodigoSinPermiso`, `codigoServicio.ts:35`; el cliente conserva `yaLoTraeElTicket` (`:32-36`) | `apps/desk/server/services/ticketService.ts:131`, 403 nuevo, probado por CB-1 y PCS-1..PCS-5: espejo legítimo (punto 3) |
| C-2 Desbloquear al administrador (`:174`) | `puedeCambiarCodigoServicio`, `codigoServicio.ts:20`, la misma que usa el predicado | La misma línea `:131`: deja pasar al administrador (CB-4), probado |
| C-3 Prellenar la propuesta (`:80`) | `propuestaCodigoServicio`, `codigoServicio.ts:45` | **Ninguna: comodidad pura.** No bloquea nada; el servidor acepta cualquier primer código no vacío (CB-3) |
| C-4 El código es obligatorio (asterisco) | `transitions.ts:191` y `:262`, `cfText('Código Servicio')` con `required` por defecto | `apps/desk/server/transitionExec.ts:77`, probado por CB-6 |
| Traza del previo | `valoresConCodigoPrevio`, `codigoServicio.ts:53` | `ticketService.ts:155` (servidor; el cliente no lo calcula) |

Lo que el cliente decide y el servidor no impone: sólo la propuesta (C-3), por diseño. Lo demás tiene línea y prueba.

## M4 — barrido de citas (L1.17)

`git grep -noE` de `ticketService.ts`, `ticketCreate.ts` y `TransitionPanel.tsx`, con filtro por rango que toque 6/131/155, 7/12 u 8/80/174:
**294** citas (73 fuera de `openspec/changes/archive/`, 221 en archivo, incluidas las de este cambio). Las ediciones son en sitio y ninguna línea se
desplazó, así que sólo podía fallar una frase que afirme más de lo que la línea ya decía. Clasificadas leyendo la frase:

- **Archivo (`changes/archive/`, 221) y paquetes de despliegue fechados (`docs/sdd/Paquete_de_Despliegue_*`, 27): caso B**, fechados; no se tocan.
- **Vivas (DEPLOY.md, pruebas, `TransitionPanel.tsx:57`, `config.yaml:4350`, specs vivas, informes `docs/sdd/*`): caso A y siguen ciertas.** Todas
  afirman que `ticketService.ts:131` contiene la guarda de cargo, de ejecutor, de Decisionales, de firma o de verificación, que `:129-131` impone área y
  cargo, o que `:155` aplica la transición: la línea sigue diciendo eso, con una guarda más. `ticketCreate.ts:7-10`/`:12-14` (E-021, `tickets-core`,
  F1B-01, F0-01) describen `yymmdd` y `buildCodigoServicio` por su cuerpo, que no cambió salvo el tipo del parámetro; `TransitionPanel.tsx:76-80`
  (`transitions-st`) sigue siendo `open()` que reenvía lo prellenado.
- Segundo pase de abreviadas (`:6 :7 :8 :12 :80 :131 :155 :174`) sobre los 21 ficheros vivos del primero: las que apuntan a `ticketService.ts`
  (`cargoPermiso.test.ts:207`, `controlCalidad.test.ts:329`, `permissions/spec.md:1346`, `transitions-st/spec.md:1242`) siguen ciertas; el resto son de `remision.ts`
  y `migrate.ts`, no tocados.
- **Reparaciones: 0.** Ningún caso A roto.
- **Observado, no se repara (no es una cita `ruta:línea`):** `transitions-st/spec.md:1926` dice que la guarda de remisión vigente es «la **undécima**
  del orden de `executeTransition`»; la guarda nueva está antes (`:131`, entre prioridad y OVI que entra), así que el ordinal de hoy sería el duodécimo.
  Un ordinal de prosa, en una spec viva que esta delta (ADDED-only) no edita: queda para el verify y, si procede, la bandeja (R-3).

## Medida del intento (L1.12 y final)

`git diff --shortstat --no-renames 1fc261b4` (con las casillas de `tasks.md`): 5 ficheros, 27 inserciones, 26 borrados (53; sin `tasks.md`: 9 y 8). Sin trackear (`wc -l`): `codigoServicio.ts` 58 +
`codigoServicio.test.ts` 143 + `codigoServicioBloqueado.test.ts` 196 + este informe 108 = 505. Binarios: ninguno. **Total 558**, bajo el margen de 720 (techo 800).
El lote NO se parte. El orquestador repite la medida al cerrar.

## Exclusiones y riesgos

- Los tres escenarios del cliente y su `bloqueado` son VERIFICACIÓN MANUAL (F0-00); `TransitionPanel.tsx` es el único código sin prueba.
- `ticketService.ts` sube `very long lines` de la línea 131 (de 1.630 a 1.870 caracteres): consecuencia de la colocación en sitio.
- Pendientes de personas P-1..P-5: no se tocan; archivar no las da por hechas.
