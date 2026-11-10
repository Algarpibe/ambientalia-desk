# Informe de archivo — `calificaciones-cuadre-conversaciones` (`fuera-del-plan`, `cierra: no`)

Construye `decision/calificaciones-y-borrados-de-zoho`, precisada por `decision/calificaciones-junto-con-que` («va sola»), con la excepción de
`decision/restos-del-historico-de-conversaciones` (la medición de peticiones por pasada). Rama `calificaciones-cuadre-conversaciones`, partida
`79546497`, en su propio worktree. Lo escribe el orquestador con cifras medidas; las citas de este informe se comprobaron con un script propio,
porque el detector excluye `openspec/changes/archive/`.

**Qué parte cubre y qué deja fuera (R-1):** cubre todo lo construible del alcance de Gerencia —la comparación corregida en las tres vías y en la
verificación del relleno, el resumen guardado con la medida de peticiones y `numeros` para relanzar sobre los 51—; deja fuera el relance mismo y la
medida de E-257, que son tareas de persona (P-2 y P-3), y E-257 no se arregla aquí si no desaparece.

## 1 · Qué se construyó

| Pieza | Dónde | Requisito |
|---|---|---|
| Predicado único de calificación (`channel === 'FEEDBACK'` exacto) y recuento de lo que Zoho cuenta | `packages/zoho-sync/src/conversaciones.ts:182`, `:190` | RQ-ZS-48 |
| Criterio de lista completa en sitio: cuentan los ids que no son calificación; para marcar valen todos | `packages/zoho-sync/src/conversaciones.ts:119-120` | RQ-ZS-26 |
| Verificación del relleno con el mismo predicado | `apps/desk/server/rellenoConversaciones.ts:75-78` | RQ-ZS-28 |
| Tabla `public.relleno_conversaciones_pasadas`, calificada y al final | `packages/zoho-sync/src/db/schema.sql:857-862`, `packages/zoho-sync/src/db/migrate.ts:73` | RQ-ZS-49 |
| Módulo del resumen guardado, que nunca rechaza; enganche en sitio | `apps/desk/server/rellenoConversacionesResumen.ts:28`, `:63`; `apps/desk/server/rellenoConversaciones.ts:144` | RQ-ZS-49 |
| `GET` con `ultimaGuardada` | `apps/desk/server/routes/rellenoConversaciones.ts:46-48` | RQ-ZS-49 |
| `numeros` validado en el `400` existente | `apps/desk/server/routes/rellenoConversaciones.ts:38`, `:52`, `:57` | RQ-ZS-50 |
| `DEPLOY.md` §25 | `DEPLOY.md:1068` | RQ-ZS-51 |

`packages/zoho-sync/src/sync.ts` y `apps/desk/src` no cambian. Ningún número de línea existente se movió: las ediciones en ficheros citados van en su
misma línea y lo nuevo, al final (comprobado por `verify-report.md` §6 y en cada contraste de `apply-progress.md`).

**Spec viva** (`openspec/specs/zoho-sync/spec.md`, 2.564 → 2.711 líneas, CRLF): RQ-ZS-26 (`openspec/specs/zoho-sync/spec.md:1705`) y RQ-ZS-28
(`openspec/specs/zoho-sync/spec.md:1822`) sustituidos en sitio con neto 0 (54 → 54 y 64 → 64); RQ-ZS-48 a 51 añadidos al final
(`openspec/specs/zoho-sync/spec.md:2566`, `:2627`, `:2668`, `:2696`). Fusión por script con ensayo `--dry` e identidad de los seis bloques con el
delta; `git diff --numstat`: 150/3. La cita de `openspec/specs/zoho-sync/spec.md:2314` a la línea 1982 sigue cierta.

## 2 · La opción del punto 1 y por qué pasa la prueba (b)

**Elegida: descontar las calificaciones de lo recibido** (S-1). Completa = sin error, con recuento de Zoho, y los ids únicos recibidos que NO son
calificación iguales a `commentCount` + `threadCount`; el marcado sigue usando todos los ids recibidos, así que una calificación que viene nunca se
marca. **Rechazada «recibido ≥ contado»:** en (b) Zoho cuenta 3 (2 comentarios + 1 hilo) y la lista trae 2 reales + 1 calificación = 3, y falta una real;
con ≥, 3 ≥ 3 daría «completa» y se marcaría como borrada una conversación que Zoho sí tiene. Con la opción elegida cuentan 2 ≠ 3 y no se marca nada.
Lo fijan, en las tres vías, `apps/desk/server/rellenoConversacionesCalificaciones.test.ts:64` (relleno) y
`packages/zoho-sync/src/conversacionesCalificaciones.test.ts:125` (pasada periódica y `syncConversations`, con `describe.each`); (a) en
`apps/desk/server/rellenoConversacionesCalificaciones.test.ts:54` y `packages/zoho-sync/src/conversacionesCalificaciones.test.ts:116`. Las mutaciones
M-1 (volver a `recibidos.size`) y M-2 (`>=`) las ponen rojas: 10 y 4 rojas, reproducidas por el orquestador (M-2) y por verify (M-1).

**El canal es HIPÓTESIS (S-2):** no hay en el repositorio ningún fixture ni dato con ese campo en una conversación. Falla seguro: si el campo o el valor
no fueran ésos, la calificación contaría como hoy y el ticket seguiría sin marcarse; nunca se marca de más. Lo mide P-1.

## 3 · Intentos del registro (medida = `git diff --shortstat --no-renames` del intento más lo nuevo sin trackear)

| Intento | Unidad | Commits | Medida = registro |
|---|---|---|---|
| i1 | propuesta y delta | `2225345a`, `7cbdadd5` | 505 |
| i2 | diseño y tareas | `8a6db0db`, `5b49569f` | 375 |
| i3 | L1 criterio y `visibles` | `e3fe1238`, `0fc75999` | 306 |
| i4 | L2 tabla, módulo del resumen y guardas del árbol | `41d9883d` | 527 |
| i5 | L3 `GET` y `numeros` | `761ab3b1` | 410 |
| i6 | L4 `DEPLOY.md` §25 | `0019942d`, `e9468199` | 170 |
| i7 | verify | `183e2680` | 192 |
| i8 | archivo | este commit | ver §8 |

En cada intento las cinco comprobaciones (typecheck, `npm run lint -- --max-warnings 165`, detector de citas, `npm test` a log y build) salieron en 0
sobre el último commit del intento. Pasadas fallidas, guardadas como evidencia del `settle`: i1 (detector 1, dos rangos con extremo en línea vacía, y
3 `Hook timed out in 10000ms` ajenos en `avisos`, `flujoEquipoNuevo` y `ampliacionContratoPuertas`, por carga); i2, i3 e i6 (detector 1, citas de los
artefactos). `npm test`: 6.359 pruebas al empezar, 6.435 al cerrar (+76); lint 165 avisos contra 165; `apps/desk/src` sin cambios.

## 4 · Verify

PASS con avisos (`verify-report.md`): 0 CRITICAL, 3 WARNING, 4 SUGGESTION; CA-1 a CA-10 y 34 escenarios contra pruebas. Mutaciones: 22 en los lotes,
todas con rojo salvo R-2 C (W-1: «contacto y cuenta» aparece dos veces en la §25; no afecta a ningún CA); reproducidas por el orquestador M-2, M-4, R-1,
P-1a y R-2 B, y por verify diez (R-1 repetida, por ser la única de la regla 2). W-2: S-2 hipótesis hasta P-1. W-3: `apply-progress.md` no usa la tabla de evidencia TDD del skill; el rojo
previo de cada lote sí consta, por aserción.

## 5 · Supuestos para la lista semanal (`decision/preguntas-de-detalle-sin-llegar`)

S-1 (descontar), S-2 (canal `FEEDBACK`, hipótesis), S-3 (un solo predicado), S-4 (una calificación que ya no viene se marca), S-5 (tabla en `public`,
fila al lanzar y al terminar), S-6 (contacto y cuenta sin contar, a lo sumo 3 por ticket), S-7 (`numeros`; junto a `desde`, `400`), S-8 (sin
interruptor nuevo), S-9 (MODIFIED a igual longitud), S-10 (un número que no está se nombra y no se recorre), S-11 (relanzar es la pasada tal cual),
S-12 (tope de 200 números), S-13 (sin progreso por ticket) y S-14 (el `GET` puede dar `terminado` un instante antes que `terminadaAt`). Ninguno cambia
el alcance de Gerencia. Las tres preguntas de producto de `proposal.md` §6 van con ellos.

## 6 · Tareas de persona (no son tareas de esta tanda; archivar NO las da por hechas)

**Ninguna línea nueva para `.env.example`:** no hay interruptor nuevo (S-8).

**P-1 · Comprobar el canal (Alfonso), antes de desplegar.** En `psql` de `desk-db`, base `desk`, la consulta P-1 de `proposal.md` §8 (sólo lectura,
`BEGIN READ ONLY; … ROLLBACK;` y `\q`). Esperado: filas con canal `FEEDBACK`, una en el #238 y dos en el #319. Si el canal sale con otro nombre o
valor, se corrige la cadena de `packages/zoho-sync/src/conversaciones.ts:186` antes de desplegar; si no sale ninguna, la hipótesis cae y se para.

**P-2 · Relanzar sobre los 51 (Alfonso), tras fusionar y desplegar.**
1. Copia previa de `desk-db` (base `desk`) con el botón de EasyPanel.
2. En la App: `MODO_SIN_ZOHO_DESK` cerrado (vacío; abierto, el `POST` responde `503`), `MARCAR_CONVERSACIONES_AUSENTES=true` (encendida desde el 30/10:
   comprobarlo) y `RELLENO_CONVERSACIONES_HABILITADO=true`; redesplegar. Al arrancar, la migración crea la tabla vacía.
3. Como superadministrador, `POST /api/admin/relleno-conversaciones?numeros=208,209,222,235,238,241,242,249,277,319,332,337,339,364,370,408,442,444,448,472,474,521,538,543,547,565,568,569,576,586,596,646,652,654,684,711,712,726,743,758,763,764,771,852,891,928,951,965,969,972,980&limite=0`.
   Esperado: `aRecorrer: 51`, `saltadosApp: 0`, `noEncontrados: []`. Sin Zoho ni escritura.
4. El mismo `POST` sin `&limite=0`: responde `lanzada: true`.
5. `GET /api/admin/relleno-conversaciones` hasta `terminado: true` y `ultimaGuardada.terminadaAt` no nulo.
6. Cerrar `RELLENO_CONVERSACIONES_HABILITADO` (vacío) y redesplegar.
7. Pasar al analista el JSON de `ultimaGuardada` (sólo números de ticket y recuentos). **Cierra E-266** si `cuentas.completo` es 51; si no, la lista de
   no completos dice cuáles y por qué clase. **Cierra E-254 (d)** con `peticiones` y `vistos429` de esa pasada, más el límite de `limitePeticiones`
   (hasta 3 lecturas de contacto y cuenta por ticket sin contar).

**P-3 · Medir E-257 (Alfonso; la cierra Supervisión), después de P-2.** La consulta P-3 de `proposal.md` §8 (sólo lectura): archivados cuyas
conversaciones de Zoho visibles, sin calificaciones, no casan con `commentCount` + `threadCount` de `tickets.raw`. **La cierra 0 filas**, salvo los
que la pasada clasifique «no está en Zoho» o «sin recuento». Si no da 0, E-257 queda como entrada propia con su medición, sin ampliar la tanda. Es
**supuesto del orquestador** que esta comparación mide E-257; y un ticket `managed_by_app` no refresca su `raw` y puede salir por recuento viejo (la
consulta trae esa columna para separarlo).

## 7 · Citas para Supervisión (la rama no toca los seis ficheros)

Líneas de los seis tal como están en `main` (`50f4d88d`); el código citado no mueve ninguna línea, así que la «línea nueva» es la misma.

| Fichero y línea | Cita | Caso |
|---|---|---|
| `docs/sdd/ENTRADA.md:2411` | `packages/zoho-sync/src/conversaciones.ts:120-127` («cuadra con `esperadoDeZoho`») | B: hoy cuadra lo recibido sin calificaciones; anclar en `79546497` |
| `docs/sdd/ENTRADA.md:2414` | `packages/zoho-sync/src/conversaciones.ts:120` («`recibidos.size === esperado`») | B: anclar en `79546497` |
| `openspec/config.yaml:6496` (era la 6310 en `79546497`) | `packages/zoho-sync/src/conversaciones.ts:120` (ídem) | B: anclar en `79546497` |
| `openspec/config.yaml:707` | la línea 282 de `packages/zoho-sync/src/db/migrate.test.ts` («reparto 10+16+3=29») | B, ya lo era antes de esta tanda: hoy 10 + 35 + 3 = 48 |
| `docs/sdd/ENTRADA.md:2411` | `:50-57`, `:163` de `conversaciones.ts` y la línea 104 de `apps/desk/server/rellenoConversaciones.ts` | A |
| `docs/sdd/ENTRADA.md:2306`, `:2417` | la línea 169 de `conversaciones.ts` y la 96 de `apps/desk/server/rellenoConversaciones.ts` | A |
| `CLAUDE.md:194`, `:197`, `:203` | líneas 327 y 409-411 de `migrate.test.ts`; 63-64, 70-73 y 80 de `migrate.ts` | A (la 73 crece por el final; `contacts` sigue siendo la única colisión) |

Además, no en los seis: la línea 888 de `DEPLOY.md` (§21, «el `GET` … sólo devuelve el estado») queda imprecisa; la §25 lo precisa en prosa. Y E-266
dice que el estado del relleno «vivía en memoria»: con esta tanda desplegada deja de ser así.

## 8 · Este intento

Mudanza de la carpeta (1.220 líneas, que el registro cuenta dos veces por medir sin detección de renombrado), fusión del delta (150/3) y este
informe. Parte con carga de revisión (fusión más informe) medida antes de aplicar: ≈ 153 + este informe, por debajo de 800. Techo pedido al
registro: 2 × 1.220 + 800 = 3.240. El commit contiene sólo el cambio archivado y la spec viva (`git show --numstat`).
