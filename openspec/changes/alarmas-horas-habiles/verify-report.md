```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:e3de046d331e11ab06a89cb4661a89655519c0541b285740419e1e54bba9e556
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 8/8
scenarios: 46/46
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:23dfb4d86d320a433be6a11f340bf6379cd5fba83691413a663dae330a4d89b0
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:bdbaae6aacb7f3e01dbd7bacc0668ae6b7446478e5f529df872706b493ea42ad
```

## Verification Report

**Change**: `alarmas-horas-habiles` (F1B-08, `cierra: no`)
**Versión**: verify sobre `1843dff`. Cuatro lotes: `55eac92`, `c84f875`, `ad2b97b`, `b159c6b`+`1843dff`. Base de medida `6516e5f`.
**Modo**: Strict TDD, almacén hybrid. Árbol: `tasks.md` modificado sin commitear (8 casillas de la fase 0, W6) y cinco `docs/sdd/Parte_*`/`Evidencia_*` ajenos sin trackear.
**`evidence_revision`**: sha256 de la salida de `npm test` (segunda ejecución, exit 0) seguida de la de `npm run build`, ambas de esta sesión.

Convención de estado (la del precedente `archive/2026-09-29-registro-contrato/verify-report.md`):
**PASS** = una prueba que pasó en esta sesión afirma el THEN, en la unidad que lo decide o en la pasada;
**PARTIAL** = algún elemento del THEN no lo afirma ninguna prueba y sólo se sostiene por lectura o por composición de otras;
**FAIL** = no se cumple; **MANUAL** = verificación de una persona por decisión F0-00 (`.tsx` fuera de la red, sin `jsdom`).

### Completeness
| Métrica | Valor |
|---|---|
| Tareas de `tasks.md` | 72/72 `[x]`, 0 sin marcar. Las 8 casillas de la fase 0 (A.2, A.3, 0.1-0.6) están marcadas sólo en el árbol de trabajo (W6) |
| Requisitos / escenarios | 8 / 46 (RQ-TS-15/16/19: 21; RQ-AV-15/16/17: 18; RQ-VT-07/08: 7), coincide con la matriz de `tasks.md:337-392` |
| Cabecera R-1 de `proposal.md:1-9` | `tanda: F1B-08`, `cierra: no`, `toca_maestro: si`, siete campos. R-2 no aplica (ninguna capacidad nueva) |
| `CLAUDE.md` | sin diff contra `6516e5f` |
| `openspec/config.yaml` | `+4 −4` contra `6516e5f`: sólo cuatro citas de `sla.ts:32-35` ancladas a revisión (caso B, declarado en `apply-progress.md:62-63`); `capabilities` intacto |
| Tareas de persona (fuera del recuento, regla del ciclo 1) | P.1, P.2, P.3, P.4 (`tasks.md:394-414`). **Archivar NO las da por hechas** |

### Ejecución (esta sesión, sobre `1843dff`)
| Comando | Salida | Código |
|---|---|---|
| `npm test` (1.ª ejecución) | 159 ficheros pasan, 1 omitido; **1990 pruebas verdes**, 2 omitidas; 221,7 s; **un error no atribuido a fichero**: `Timeout calling "onTaskUpdate"` (RPC del worker de vitest). `sha256:70737c8e…590d` | **1** |
| `npm test` (relanzada una vez, según el encargo) | 159 ficheros pasan, 1 omitido (`migrate.integration.test.ts`, sin credenciales); **1990 verdes**, 2 omitidas; 167,6 s | 0 |
| `npm run typecheck` | `tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit`, sin errores | 0 |
| `npm run lint` | `165 problems (0 errors, 165 warnings)`: el techo `--max-warnings 165` | 0 |
| `npm run build` | Vite compila | 0 |
| detector de citas `tsx apps/desk/server/citas/cli.ts --sha HEAD` | 2980 comprobadas; **0 completas rotas**, 0 cabeceras inválidas, 11 abreviadas rotas (informativas; ninguna en ficheros de este cambio), 1 ancla sin resolver | 0 |

La 1.ª ejecución no es E-091 (`auth/routes.test.ts` pasó, 14 pruebas en 21,9 s): todas las pruebas de fichero pasaron y el error es del canal RPC del worker.
*Hipótesis:* carga de la máquina (la 2.ª ejecución tardó 54 s menos). No se corrige aquí. Cifras contra `apply-progress.md:204`: 1990 verdes, 2 omitidas, 159 ficheros: **coinciden**.

### Strict TDD
- RED previo por lote en `apply-progress.md` (`:12-15`, `:85-89`, `:149-153`, `:199-205`). Lo que nació verde se declara: las tres pruebas previas de `sla.test.ts`, `db/sla.test.ts` S10, S12, S21, «estado ACTUAL» y H3; la de pasadas concurrentes; S30/S31 de `alarmasSla.test.ts`; «cerrados no lleva el campo».
- Mutaciones: las reproduce el orquestador según `apply-progress.md:32-46`, `:108-123`, `:164-182`, `:220-224`. **No las reproduje en esta sesión** (verify no toca código): se citan como hipótesis del apply. Sí comprobé por lectura que cada una tiene una prueba que la nombra.
- Posición (regla de mutación 1): marca antes que avisos, `alarmasSla.test.ts:95-101` (`['BEGIN','marca','aviso','aviso','COMMIT']`); correo tras el último `COMMIT`, `:212-222`; orden alarmas → ritmo → sincronización, `:253-262` (y `avisoRitmoContrato.test.ts:194` sigue verde sin tocarse).
- Fichero vigilado (regla de mutación 2): `schema.sql:588` (PK de la marca) y `:594` (PK del corte) las ejercen `migrate.test.ts:487-511`; el recuento de 35 tablas, `:282-286`. El guardián de `CREATE TABLE` sin esquema sigue verde con las dos tablas calificadas `public.`.

### Cumplimiento de escenarios (todas las pruebas pasaron en `npm test`)
Rutas relativas a `apps/desk/server/` salvo `shared` (= `packages/shared/src/sla.test.ts`) y `migrate` (= `packages/zoho-sync/src/db/migrate.test.ts`).
`dbsla` = `db/sla.test.ts`; `alarmas` = `services/alarmasSla.test.ts`; `avis` = `db/alarmasAvisadas.test.ts`.

**RQ-TS-15 (transitions-st) — 12 escenarios**
| # | Escenario | Prueba | Estado |
|---|---|---|---|
| S1 | Tres alarmas 9/27/36 | `shared:30-34` (objeto entero) | PASS |
| S2 | Umbral exacto no vence, ni fuera de jornada | `shared:62-67` (lunes 17:00, 23:00, martes 08:00) | PASS |
| S3 | +1 ms vence | `shared:66` | PASS |
| S4 | Fin de semana no cuenta | `shared:245-249` | PASS |
| S5 | Festivo no cuenta | `shared:251-256` (viernes 12:00, no 08:00: mismas 9 h) | PASS |
| S6 | Cierre no cuenta | `shared:258-263`, `:236-243` (cierre + fin de semana) | PASS |
| S7 | `Remisión creada` 27 h | `shared:265-268`, `:280-284` (borde fraccionario) | PASS |
| S8 | `Notificación cliente` 36 h | `shared:269-270` | PASS |
| S9 | Reentrar reinicia el reloj | `dbsla:78-84` | PASS |
| S10 | Sin foto de entrada no se mide | `dbsla:95-104` | PASS |
| S11 | No lee la clasificación de espera | `shared:51-55` (alarmas dentro y fuera de las once) y `:265-270` (vencen dos estados de espera); `sla.ts:2` no importa `ESTADOS_EN_ESPERA` | PASS |
| S12 | `Notificado` de Equipo nuevo no se mide | `dbsla:141-145` | PASS |

**RQ-TS-16 — 3 escenarios**
| # | Escenario | Prueba | Estado |
|---|---|---|---|
| S13 | Toda alarma declara cargo | `shared:297-302` (cargo y `areaRespaldo` dentro de `AREAS`), `:310-312` | PASS |
| S14 | Sin cargo pone rojo, nombrando el estado | `shared:314-321` (vacío y sólo espacios devuelve los dos estados) | PASS |
| S15 | Cambiar el cargo no depende del grafo | `alarmas:187-199` (sólo recibe el cargo nuevo) | PASS |

**RQ-TS-19 — 6 escenarios** (nivel de consulta `ticketsConSlaVencido`, que la pasada consume sin filtrar más: `alarmasSla.ts:87` y `db/sla.ts:57`)
| # | Escenario | Prueba | Estado |
|---|---|---|---|
| S16 | Sin OV por ninguna vía, alarma | `dbsla:167-174`; pasada: `alarmas:212-222` (la `Remisión creada` sin OV entra en el lote de correo) | PASS |
| S17 | Con `orden_venta`, sin alarma | `dbsla:192-207` (c1); pasada: `alarmas:201-207` (sin marca ni aviso) | PASS |
| S18 | Con `salesorder_id` | `dbsla:192-207` (c2), enfrentada a `ticketConOrdenVenta` | PASS |
| S19 | Con asociación vigente | `dbsla:192-207` (c3) | PASS |
| S20 | Asociación liberada no cuenta | `dbsla:192-207` (c4) | PASS |
| S21 | Las otras dos no miran la OV | `dbsla:214-220` | PASS |

**RQ-AV-15 (derivacion-avisos) — 6 escenarios**
| # | Escenario | Prueba | Estado |
|---|---|---|---|
| S22 | Un aviso por usuario con el cargo | `db/avisos.test.ts:116-131` (exactamente dos, sin inactivo ni otro cargo) + `alarmas:75-80` (dos destinatarios, dos avisos). No hay prueba de pasada con dos usuarios | PASS |
| S23 | Texto con ticket, estado y plazo | `alarmas:111-131` (el texto casa con el número 701, «9 horas hábiles» y «Notificado») | PASS |
| S24 | Sin nadie con el cargo, al área con un warn | `alarmas:158-168` (dos pasadas: un aviso, una marca con `avisos_creados: 1`, un warn), `:179-185` (área vacía: marca con 0) | PASS |
| S25 | Con alguien en el cargo, el área no recibe | `alarmas:148-156` (uno y cero avisos, 0 warns) | PASS |
| S26 | Fallo del correo no tumba nada | `alarmas:224-231` (`enviado_at` NULL, marca escrita, la pasada resuelve) | PASS |
| S27 | Config de correo vacía, no-op explícito | `avisosWebhook.test.ts:33-38` (unidad: sin `fetch`). **A nivel de pasada no hay prueba**: `alarmas:50` fija siempre una URL | PARTIAL (W3) |

**RQ-AV-16 — 8 escenarios**
| # | Escenario | Prueba | Estado |
|---|---|---|---|
| S28 | Dos pasadas no duplican | `alarmas:75-80` (directa), `:158-168` (dos pasadas) | PASS |
| S29 | Concurrentes no duplican | `alarmas:170-177` (`Promise.all`: un aviso, un warn) | PASS |
| S30 | Reentrar vuelve a avisar | `alarmas:82-87` (nivel `marcarYAvisarAlarma`) | PASS |
| S31 | La marca distingue estados | `alarmas:82-87` | PASS |
| S32 | Misma transacción | `alarmas:95-101` y `:103-108` (`(E)`: BEGIN, marca, avisos, COMMIT; duplicado: BEGIN, marca, ROLLBACK; error ajeno con ROLLBACK sin COMMIT). pg-mem no revierte: por estructura, no por efecto (W4) | PASS (E) |
| S33 | Lo vencido en el corte se marca sin avisar; lo posterior avisa | `alarmas:111-131` (marca con 0, 0 avisos, 0 `fetch`; `tB` avisa después). **Sin prueba** de que la marca silenciosa saque la señal de tablero | PARTIAL (W3) |
| S34 | `Remisión creada` con OV no deja marca | `alarmas:201-207`; el «si pierde la OV, avisa» sólo a nivel de consulta: `dbsla:192-207` (c4, vencida sin marca previa) | PASS |
| S46 | El corte no se mueve con un reinicio | `alarmas:133-142` (corte previo intacto; el vencido posterior avisa) | PASS |

**RQ-AV-17 — 4 escenarios**
| # | Escenario | Prueba | Estado |
|---|---|---|---|
| S35 | Un error en un ticket no detiene el resto | `alarmas:233-242` | PASS |
| S36 | La pasada no bloquea la sincronización | `alarmas:244-249` (base caída: resuelve y deja `logger.error`) y `:253-262` (cadena en `index.ts:88`). La ejecución real del `setInterval` no se prueba (hipótesis: `pasadaAlarmas` nunca rechaza, `alarmasSla.ts:141-147`) | PASS |
| S37 | Los cierres se leen en cada pasada | `dbsla:229-235` (los cierres de la base se descuentan), `:241-259` (una lectura de `calendario_cierres` por llamada, igual con 1 y con 5). Sin prueba de «cierre añadido entre dos pasadas» | PASS |
| S38 | Sin foto de entrada, ni marca ni aviso | `dbsla:95-104` (nivel consulta; la pasada sólo procesa lo que ésta devuelve) | PASS |

**RQ-VT-07 (vistas-tablero) — 6 escenarios**
| # | Escenario | Prueba | Estado |
|---|---|---|---|
| S39 | Vencido con marca, el listado lo señala | `avis:31-36` (y sin escribir en `ticket_transitions`); ruta `tickets.test.ts:574-584` (true para el marcado, false para el otro) | PASS |
| S40 | Sin marca, no | `avis:38-41` | PASS |
| S41 | Al salir del estado, deja de traerla | `avis:43-47` (la fila de marca sigue) | PASS |
| S42 | Al reentrar, no hereda | `avis:49-53` | PASS |
| S43 | Otro estado vencido no la produce | `avis:55-63`, `:65-74` (con dos estados que marcan) | PASS |
| S44 | El cliente no decide | Lectura ejecutada hoy: buscar en `TicketCard.tsx` horasHabiles, calendario, cierres, venc o slaVencido da 0 resultados; el campo se lee sólo en `:98` | PASS (lectura) |

**RQ-VT-08 — 1 escenario**
| # | Escenario | Prueba | Estado |
|---|---|---|---|
| S45 | La tarjeta muestra «Esperando aprobación del cliente» | Bloque `TicketCard.tsx:97-103`, texto en español. Sin prueba posible (F0-00). Verificación de una persona: P.2 | MANUAL |

**Recuento: PASS 43 · PARTIAL 2 (S27, S33) · FAIL 0 · MANUAL 1 (S45) = 46.**
Por requisito: PASS RQ-TS-15, RQ-TS-16, RQ-TS-19, RQ-AV-17, RQ-VT-07; PASS con un escenario PARTIAL RQ-AV-15 y RQ-AV-16; MANUAL RQ-VT-08.

**Lo que `apply-progress.md` declara no probado, contrastado con otro nivel**
| Declarado (`apply-progress.md`) | Lo que hay en otro nivel | Clasificación |
|---|---|---|
| S27 a nivel de pasada (`:184-185`) | `avisosWebhook.test.ts:33-38` prueba la unidad; la rama `!disparado` de `alarmasSla.ts:128-135` es la misma que ejecuta S26 (`alarmas:224-231`) | PARTIAL: la composición es sólida, la prueba de pasada falta |
| S34 a nivel de pasada (`:185`) | `dbsla:192-207` (c4) y `alarmas:201-207`; la pasada no guarda más estado que la marca | PASS por unidad decisoria |
| S37 y S38 a nivel de pasada (`:185-186`) | `dbsla:229-259`, `:95-104` | PASS por unidad decisoria (S37 sin el caso «entre dos pasadas») |
| Coste del prefiltro de marcas (`:186-187`) | Ninguna: quitarlo no pone nada rojo, la PK sigue impidiendo el duplicado (`alarmasSla.ts:88-94`) | Superviviente aceptado (W5) |
| Desempate por `id` con `performed_at` idéntico (`:125-127`) | Ninguna. Con el filtro por `to_status` dos entradas empatadas dan el mismo `desde` (`db/sla.ts:96-99`) | Sin efecto observable: mutante equivalente, no un hueco de comportamiento |

### Comprobaciones independientes (código, no `apply-progress`)
| Comprobación | Línea leída | Resultado |
|---|---|---|
| El `INSERT` de la marca va primero y sin `ON CONFLICT` | `alarmasSla.ts:44-48`: dentro de `enTransaccion`, la primera sentencia es `INSERT INTO public.alarmas_avisadas … VALUES ($1,$2,$3,$4)`; los avisos, después (`:49-50`) | correcta |
| `23505` = «ya avisado» | `alarmasSla.ts:31`, `:53-55`: `code === '23505'` devuelve `null`; cualquier otro error sale (`:55`), probado en `alarmas:103-108` | correcta |
| El corte no depende de `RETURNING` | `alarmasSla.ts:60-64`: `INSERT … ON CONFLICT (id) DO NOTHING` y después `SELECT corte_at`; se usa la fila leída | correcta |
| El corte se mide con los mismos cierres | `db/sla.ts:59`: `vencidoEnCorte: slaVencido(estado, desde, corte, cierres)`; el silencioso escribe la marca con lista de destinatarios vacía (`alarmasSla.ts:102-105`) | correcta |
| `db/sla.ts:40` | `export async function ticketsConSlaVencido(db, ahora, corte?)` | dice lo que las specs le atribuyen |
| `db/sla.ts:49` | segunda línea del `filter` de flujo: `flujoDelTicket(...) === 'servicio'` (`:48-49`); es lo que citan `Paquete_de_Despliegue_2026-09-29.md:504` y `proposal.md:98` | correcta |
| `db/sla.ts:56` | «sin foto de entrada no se mide» | correcta |
| `db/sla.ts:58` | `if (slaVencido(estado, desde, ahora, cierres))`, con los cierres reales | correcta |
| Líneas 2, 28, 40, 48, 49, 56 y 58 no vacías | leídas con `sed`: las siete con contenido; `db/sla.ts` = 125 líneas | correcta |
| `index.ts:88` encadena alarmas, ritmo y sincronización | `pasadaAlarmas(pool, config).then(() => pasadaRitmoContratos(pool).then(() => sync.syncRecent()))`; import en `:15`; 99 líneas | correcta; el guardián de ritmo (`avisoRitmoContrato.test.ts:194`) y el nuevo (`alarmas:253-262`) pasan |
| `TicketCard.tsx` no calcula (regla 13) | sólo `:98` (`=== true`) y el bloque `:97-103`; ningún calendario, hora ni vencimiento. El servidor decide en `db/alarmasAvisadas.ts:16-35` y `routes/tickets.ts:115` | correcta |
| `schema.sql` sólo creció por el final | `git diff 6516e5f HEAD`: `+20 −0`, un solo hunk `@@ -574,3 +574,23`; 576 → 596; `:576` sigue siendo la `ALTER` de `modalidad` | correcta |
| Las dos tablas van calificadas `public.` | `schema.sql:582` y `:593`; `migrate.ts:73` las añade al final de `PUBLIC_TABLES`; `migrate.test.ts:282-286` fija 35 | correcta |
| `types.ts:37` en su sitio | `read?: boolean; esperandoAprobacionCliente?: boolean`, misma línea (`+1 −1`) | correcta |

### Regla 13 (`TicketCard.tsx`)
La tabla de `apply-progress.md:209-216` se contrastó con el código de hoy: la única decisión del cliente que toca el dominio es pintar la marca si el campo es `true` (`TicketCard.tsx:98`); el servidor la impone en `db/alarmasAvisadas.ts:28` (estado actual, entrada actual por `getTime()` y marca) y `routes/tickets.ts:115`, probado por `avis:31-74` y `tickets.test.ts:574-584`. El bloque no tiene `onClick`. **Sin discrepancias.**

### Criterios de éxito de `proposal.md:164-173` (son ocho; `tasks.md:318` decía «siete», ver S1)
| # | Criterio | Evidencia | Estado |
|---|---|---|---|
| 1 | `Notificado` lunes 8:00: no vence el lunes 23:00, sí el martes 8:00:00.001 | `shared:62-67` | PASS |
| 2 | Festivo o cierre entre medias no cuenta | `shared:251-263`, `:236-243` | PASS |
| 3 | `Remisión creada` 28 h: con OV por cualquier vía sin aviso; sin OV, aviso | `dbsla:192-207`, `:167-174`; `alarmas:201-207`, `:212-222` | PASS |
| 4 | Dos pasadas, un aviso; reentrar, aviso nuevo | `alarmas:158-168`, `:75-80`, `:82-87` | PASS |
| 5 | Sin usuario con el cargo, aviso al área con marca y warn; con él, el área nada | `alarmas:158-168`, `:148-156` | PASS |
| 6 | Vencido antes del corte, marca sin aviso; después, aviso | `alarmas:111-131`, `:133-142` | PASS |
| 7 | `Notificación cliente` vencida, el listado trae la marca; al salir, deja de traerla | `avis:31-53`; `tickets.test.ts:574-584` | PASS |
| 8 | Un fallo del correo no rompe la pasada ni la sincronización | `alarmas:224-231`, `:244-249`, `:253-262` | PASS |

### Design coherence
- Una fuente de la regla en `shared` (`sla.ts`); la base sólo aporta el origen del plazo, los cierres y la OV (`db/sla.ts:14-39`). Coincide con D-1..D-3.
- Desvío declarado y sano: los cierres se leen dentro de `ticketsConSlaVencido` (`db/sla.ts:46`), no por parámetro como decía D-3 (`apply-progress.md:93-95`); la firma gana `corte?` (`:40`). Sin N+1 probado (`dbsla:241-259`: una consulta al historial, una a asociaciones, una a cierres).
- La atomicidad (D-6, corregida antes del lote 3) se cumple por la clave primaria, sin `SELECT` previo; la ventana de ese plan la cierra la prueba de concurrentes (`alarmas:170-177`).
- Correo tras todas las transacciones, en un lote, sellado sólo si `disparado` (`alarmasSla.ts:126-136`), `conCopia: true` (`:118`).
- `tieneOrdenVenta` es la tercera implementación de la misma noción (molde H5) y una prueba las enfrenta sobre cinco casos (`dbsla:192-207`); quitar una vía o `liberada_at IS NULL` la pone roja (`apply-progress.md:117`, hipótesis del apply).

### Issues
**CRITICAL**: ninguno.

**WARNING**
- **W1 · La spec delta contradice al código en la forma de la marca.** `specs/derivacion-avisos/spec.md:67-69` (RQ-AV-16) dice `INSERT … ON CONFLICT DO NOTHING RETURNING` y «si no hay fila devuelta, no se crea ningún aviso». El código hace otra cosa y con razón: `INSERT` sin `ON CONFLICT` y `23505` = ya avisado (`alarmasSla.ts:44-55`), porque pg-mem devuelve fila también en el conflicto (H1 falsa, `apply-progress.md:78`). El comportamiento observable es el mismo, pero la fusión del delta dejaría en la spec viva una mecánica que el código no usa. **Al archivar, reescribir esa viñeta** (el `design.md` D-6 ya está corregido, `:113-116`).
- **W2 · Comentario obsoleto.** `migrate.test.ts:478` dice que el servicio «usa el plan B: `SELECT` previo dentro de la misma transacción». Es falso desde el lote 3 (H1 corregida). Editarlo **en su sitio** (mismo número de líneas), por la regla de mutación 4: el fichero está muy citado.
- **W3 · Pruebas de pasada pedidas por `tasks.md` y no escritas.** La tarea 3.3 (`tasks.md:234-239`) pedía a nivel de pasada: dos usuarios con el cargo (S22), las tres vías de OV (S18, S19) y la asociación liberada (S20), OV que se pierde (S34), cierre entre dos pasadas (S37), ticket sin foto (S38), config de correo vacía (S27) y «segunda pasada: cero consultas a `users`». Sólo está S17 a ese nivel; el resto se cubre a nivel de consulta o de unidad (tablas de arriba). Dos elementos quedan sin prueba alguna, de ahí los PARTIAL: **S27** (la rama de pasada con config vacía) y la parte de **S33** «marca de tablero» de lo vencido en el corte. Ninguno es un defecto de comportamiento hoy: son composiciones de piezas probadas.
- **W4 · Atomicidad por estructura, no por efecto** (`alarmas:95-108`): pg-mem no honra el `ROLLBACK` (`db/transaccion.test.ts:25`). La prueba de «un fallo en un ticket» (`alarmas:233-242`) sólo afirma que el otro ticket avisa, no que el fallido no deje marca. Mismo tratamiento que el W2 del precedente. Lo cierra P.2 en producción (Postgres real).
- **W5 · Superviviente declarado: el prefiltro de marcas** (`alarmasSla.ts:88-94`). Quitarlo no rompe nada (la PK impide el duplicado); sólo cuesta consultas a `users` por pasada. Sin prueba de coste, declarado en `apply-progress.md:186-187`.
- **W6 · Árbol de trabajo sucio.** `openspec/changes/alarmas-horas-habiles/tasks.md` tiene `+8 −8` sin commitear (casillas A.2, A.3, 0.1-0.6 marcadas). El orquestador debe commitearlo antes del `archive`, o el archivo moverá una versión distinta de la de `HEAD`.
- **W7 · La primera ejecución de `npm test` dio exit 1** por un timeout del worker de vitest, con 1990/1990 pruebas verdes. Pasa a 0 al relanzar; se anota, no se corrige.

**SUGGESTION**
- S1 · `tasks.md:318` (tarea 4.14) habla de «siete criterios de `proposal.md:148-155`»; hoy son ocho, en `:164-173`. Cita desfasada en el artefacto del cambio: corregir al archivar (caso B, con la revisión).
- S2 · El `warn` de S-4 lleva `cargo`, `estado` y `ticketId` como campos estructurados (`alarmasSla.ts:113-114`), pero ninguna prueba los afirma: `warnsSinCargo` (`alarmas:69`) sólo busca la frase. La spec (RQ-AV-15, S-4) pide que diga el estado. Una aserción sobre el primer argumento de la llamada lo cierra.
- S3 · El listado activo hace tres consultas más por petición (`db/alarmasAvisadas.ts:21-24`) sin caché. Aceptable con la población actual; medir si el tablero crece. No es decisión de este cambio.
- S4 · Sin aserción de que la marca silenciosa de S33 salga en el tablero (parte de W3): una prueba de una línea sobre `ticketsEsperandoAprobacionCliente` con `avisos_creados: 0`.

### Para el `archive-report` (de `tasks.md:316`)
- (a) adenda a E-087: las alarmas son el segundo dependiente de la pasada de sincronización (`index.ts:88`); ya escrita en `docs/sdd/ENTRADA.md` (lote 4, `apply-progress.md:240`).
- (b) línea de cobertura de F1B-08: alarma en horas hábiles, aviso, marca de tablero y corte; **fuera**: «vistas equivalentes a Zoho» (pregunta 4); `cierra: no`.
- (c) corrección documental de §3.7 y §3.10 de la spec viva `transitions-st`; y W1 y S1 de este informe.
- (d) P.1 a P.4 siguen sin resultado: las declara el archive, no las da por hechas.
- (e) nota de despliegue: `tasks.md:322-333`.
- (f) el `git mv` del archive supera 800 líneas por diseño (regla del ciclo 2): pedir techo de mantenedor (previsión de `tasks.md:92`: 5.000).

### Verdict
**PASS WITH WARNINGS.** 8/8 requisitos, 46/46 escenarios (43 PASS, 2 PARTIAL por pruebas de pasada no escritas, 1 MANUAL por decisión F0-00), ocho criterios de éxito cumplidos, regla 13 sin discrepancias, 0 críticos. `npm test` (1990 verdes), `typecheck`, `lint` (165, el techo), `build` y el detector de citas (0 rotas completas) en verde. Listo para `sdd-archive`; W1, W2 y S1 se corrigen allí, y W6 se resuelve antes.
