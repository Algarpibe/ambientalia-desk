# Verify report: fecha-cierre-migracion (F1F-01, E-207, cierra: no)

Verificación independiente, 2026-10-16. Worktree `fecha-cierre-migracion`, HEAD `6444b92` + 4.7 marcada en `tasks.md` (sin commit). Modo: Strict TDD, runner `npm test`.

**Veredicto: PASS WITH WARNINGS · CRITICAL 0 · WARNING 4 · SUGGESTION 3**

## 1. Escenarios → pruebas (todos cubiertos)
Rutas: S=`packages/shared/src/migracionTickets.test.ts`, A=`apps/desk/server/db/migracionTicketsAbiertos.test.ts`, R=`apps/desk/server/db/migracionTicketsF1F01.test.ts`.

| Escenario | Prueba |
|---|---|
| RQ-TC-40 «Entregado» va a Finalizado y cierra (modificado) | S:43 |
| RQ-TC-40 «Sólo Entregado cierra; otras reglas no tocan closed_time» (nuevo) | S:252 (+ A:220) |
| RQ-TC-40, los otros 9 escenarios (sin cambio) | S:25, 34, 50, 55, 60, 66, 70, 76 |
| RQ-TC-64 Zoho se conserva, origen `zoho` | S:239 |
| RQ-TC-64 sin Zoho, instante de la migración | S:243 |
| RQ-TC-64 regla que no cierra devuelve `null` (6 combinaciones) | S:252 |
| RQ-TC-64 precedencia Zoho antes que migración | S:247 (+ A:207; mutación 1 de apply-progress) |
| RQ-TC-64 no lee el reloj | S:76 (regex sobre la fuente: sin `Date.now(` ni `new Date()`); S:261 (instante inyectado) |
| RQ-ZS-17 Entregado con Zoho: conserva y marca `zoho` | A:207 |
| RQ-ZS-17 sin Zoho: instante de ejecución, marcado, `closed_time_previo` presente nulo | A:200 |
| RQ-ZS-17 mismo instante en todos los cierres | A:214 |
| RQ-ZS-17 Pendiente e identidad no tocan closed_time | A:220 |
| RQ-ZS-17 seco cuenta las dos ramas y no escribe | A:232 (+ A:48 en «seco») |
| RQ-ZS-17 escenarios previos (seco, 400, negativa, orden marcador/UPDATE, rollback, idempotencia, sync, informe) | A:48, 64, 73, 92, 102, 110, 121, 133, 142, 149, 159, 168, 179 (sin cambios de fondo) |
| RQ-ZS-18 restaura closed_time previo (con fecha de Zoho) | R:93 (a), R:212 («e1») |
| RQ-ZS-18 vuelve a NULL cuando era nulo | R:212 («e2») |
| RQ-ZS-18 no toca closed_time en reglas que no cierran | R:222 (+ R:108 a2, R:188 i) |
| RQ-ZS-18 quitar la restauración pone roja la prueba | R:205 (UNA sola sentencia) y R:188 (i); reproducido abajo |
| RQ-ZS-18 escenarios previos (borrado selectivo, transacción única, calificadas, repetida) | R:118, 126, 135, 143, 152, 160, 171, 231 |

Sin escenario huérfano.

## 2. Diseño: cero líneas desplazadas — CUMPLE
`git diff -U0 5d8eb10 HEAD` sobre los tres ficheros de producción y las tres pruebas. Todos los hunks de en medio son `-N +N` (una línea editada en sitio):
- `migracionTicketsAbiertos.ts`: `:5, :25, :33, :37, :58, :64, :66, :72, :75, :85, :88`.
- `.sql`: `:14, :65, :76`, todo comentario o la línea de reversión de la regla 2.
- `migracionTickets.ts`: `:48` en sitio; lo nuevo es el bloque `+114,29` al final del fichero.
- Pruebas: `S:5` y bloque nuevo desde `:229`; `A:45, :56` y nuevo desde `:188`; `R:93, :188, :191` y nuevo desde `:196`.
Ninguna cita al estilo `fichero.ts:N` se desfasa. Sin `\ No newline` ni cambios de CRLF.

## 3. Regla 13 — CUMPLE
`git diff --stat 164d322 HEAD -- apps/desk/src` vacío. El cambio no añade decisiones de cliente.

## 4. Mutaciones reproducidas (restauradas con copia y `cmp`: RESTORED_A, RESTORED_B; `git status` sólo `tasks.md`)
- **(a)** borrada la línea 125 `if (eq.statusTypeDestino !== 'Closed') return null` de `cierreDeMigracion`. Rojo, 5 pruebas caen: S:252 (otras tres reglas), A:73 (marcador lleva `to_status` NULL…), A:220 (Pendiente/identidad), R:93 (a), R:108 (a2). `cierresDeMigracion` conserva su propio filtro (`:137`), por eso A:232 y S:269 no caen: correcto.
- **(b)** restauración de `closed_time` movida de `.sql:76` (regla 2) a `.sql:81` (regla `pendiente-servicio-a-en-proceso`). Rojo, 5 caen: R:93 (a), R:188 (i), R:205 (UNA sola sentencia), R:212 («e2»), R:222 (no toca en reglas que no cierran). La posición de la restauración queda fijada (regla de mutación 1).

## 5. Códigos de salida (uno por uno, leídos)
| Comando | Código | Nota |
|---|---|---|
| `npm test` | 0 | 277 ficheros (3 skipped), 4711 pruebas (11 skipped). Coincide con apply-progress |
| `npm run typecheck` | 0 | |
| `npm run lint` | 0 | 0 errores, 165 avisos previos |
| `npm run build` | 0 | |
| `tsx apps/desk/server/citas/cli.ts --sha HEAD` | 0 | lista abreviadas rotas informativas ya existentes (p. ej. `transitions-st/spec.md:484`); no bloquean y ninguna es de este cambio |

## 6. Coherencia con `decision/migracion-e207-e212` — CUMPLE
`cierreDeMigracion` (`migracionTickets.ts:123-129`): fecha de Zoho si existe (`origen: 'zoho'`), si no el instante de la migración (`origen: 'migracion'`); sólo la regla con `statusTypeDestino === 'Closed'` cierra. El ejecutor (`migracionTicketsAbiertos.ts`) lee `closed_time`, escribe `COALESCE($4::timestamptz, closed_time)` y deja `closed_time_previo`, `closed_time_destino` y `cierre_origen` en el marcador sólo si hay cierre. Un único `ahora` por ejecución. Sin esquema ni flag nuevo.

### WARNINGs (afirmaciones que el cambio vuelve falsas, fuera de su alcance)
- **W-1** `openspec/config.yaml:4749`: «no escribe `closed_time` en ningún sitio… `grep closed_time` da 0». Falso desde `6444b92` (cita `migracionTicketsAbiertos.ts:84-88`, caso B: es medición del 2026-10-14). Lo corrige quien tenga permiso sobre `config.yaml`.
- **W-2** `openspec/config.yaml:4759`: describe el `UPDATE` de la migración sin `closed_time`; ahora lo escribe. Mismo caso B/C.
- **W-3** Lectores de `closed_time` fuera de F1F-05: `apps/desk/server/analisis.ts:26` en `73bd52f` (`finalizadoAt: x.fecha_finalizacion_st ?? x.closed_time`) y `apps/desk/src/components/ClienteDetalle.tsx:124-126` en `73bd52f` (promedio creación→cierre) tratan la fecha de migración como cierre real y sesgarán el tiempo medio. Es el H-1 de la propuesta (`proposal.md:65`, riesgo `:89`); la marca `cierre_origen` permite filtrar. Sin corregir aquí por alcance, queda como pregunta a Gerencia.
- **W-4** La spec viva de zoho-sync aún dice «MUST NOT tocar `closed_time`» (`openspec/specs/zoho-sync/spec.md:851` en `164d322`, y `:915`, `:1040` y `:1081`). Lo sustituyen los deltas RQ-ZS-17/18 al archivar; hasta entonces la spec viva contradice el código. La fusión debe ser completa (reemplazo entero de ambos bloques).

### SUGGESTIONs
- **S-1** El escenario «La función no lee el reloj» se cubre por regex de fuente (S:76) y por instante inyectado; no hay una prueba de dos llamadas idénticas separadas en el tiempo. Suficiente, anotado.
- **S-2** El cast `::timestamptz` sobre `NULL` sólo se ejercita en pg-mem; la integración `migracionConcurrente` está skipped (sin base real). Probar en la copia previa antes de aplicar en producción (hipótesis declarada en apply-progress).
- **S-3** La 4.7 (medida del intento de apply) la marcó la orquestación: el registro del intento dice **302** líneas (`git diff --shortstat --no-renames 37c282f 6444b92`: +263 −39), que incluyen `tasks.md` y `apply-progress.md`; el código y sus pruebas son 229 (+208 −21). Bajo el tope de 800.

## TDD (apply-progress)
Rojo y verde por lote documentados y plausibles: lote 1 (7 rojas por `ReferenceError`, luego 38/38), lote 2 (5 rojas, 18/18), lote 3 (4 rojas, 14/14). Cuatro mutaciones del apply (precedencia, filtro, regla 2 quitada, restauración doble) coinciden con mi reproducción de las clases (a) y (b). Sin discrepancias.
