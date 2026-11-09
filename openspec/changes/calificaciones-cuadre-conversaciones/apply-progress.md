# apply-progress — `calificaciones-cuadre-conversaciones`, lote L1 (partida `5b49569f`)

## Hecho, por fichero y línea
- `packages/zoho-sync/src/conversaciones.ts`: `:106` y `:107` (docblock, siguen siendo cinco líneas), `:119` (`; const contadas = contadasPorZoho(lista.items)`), `:120` (`… && contadas === esperado`), `:124` (`recibidos ${contadas} únicos sin calificaciones (${recibidos.size} con ellas), …`); `esCalificacion` (`:186` el `channel === 'FEEDBACK'`) y `contadasPorZoho` AL FINAL, tras `:175`. `:121`, `:135` sin cambio.
- `apps/desk/server/rellenoConversaciones.ts`: `:4` (importa `esCalificacion`), `:74` («sin calificaciones (RQ-ZS-48)»), `:76` (`SELECT raw`, mismo `WHERE`), `:77` (`.filter((f) => !esCalificacion(f.raw)).length`). Sigue con 154 líneas.
- Pruebas nuevas (24): `packages/zoho-sync/src/conversacionesCalificaciones.test.ts` (21: predicado por tabla, `contadasPorZoho`, `guardarYReflejar` directo, (a) y (b) en pasada periódica y en `syncConversations`) y `apps/desk/server/rellenoConversacionesCalificaciones.test.ts` (3: (a), (b) y CA-4 del relleno).
- Cierre (L1.3): `git diff --numstat` → `rellenoConversaciones.ts` 4/4; `conversaciones.ts` 22/5 (5 en sitio + 17 al final). `file` de ambos y de los dos nuevos: CRLF. Sin pruebas existentes editadas.

## Rojo → verde
- Rojo (24 de 24, antes de tocar producción): predicado y `contadasPorZoho`, 13 pruebas, `TypeError: (0 , esCalificacion) is not a function` / `(0 , contadasPorZoho) is not a function` (export inexistente, previsto). Las 11 restantes, por ASERCIÓN: (a) en las tres vías `expected [] to deeply equal [ 'vieja' ]`; (b) en las tres `expected [ 'falta' ] to deeply equal []`; relleno CA-4 `expected { completo: +0, descuadrado: 1, …(3) } to match object { completo: 1, … }`; directo `expected { marcadas: [], completa: false } to deeply equal { marcadas: [ 'vieja' ], … }`, `…completa: true` y, con `marcar` apagado, (b) `completa: true` frente a `false`.
- Verde: focal de la tabla de `tasks.md` (los dos nuevos + `conversaciones.test.ts`, `sync.conversaciones.test.ts`, `rellenoConversaciones.test.ts`, `rellenoConversacionesPausas.test.ts`, `conversacionesPausas.test.ts`, `sync.conversacionesPeriodicas.test.ts`): 8 ficheros, 110 pruebas, 0 rojas. `opcionesConversaciones`, `completitud/`, `rellenoConversacionesRutas` y `zoho-sync/src/db`: 395 verdes (D-10: ninguna guarda se rompe). `npm run typecheck` salida 0; `npm run lint -- --max-warnings 165` salida 0, «165 problems (0 errors, 165 warnings)».

## Mutaciones (PM: sha256 y `file` antes; `perl -i -pe … if $. == N`; restaurar desde la copia). 110 pruebas en la focal
| Id | Mutación (línea) | Rojas | Restaurado |
|---|---|---|---|
| M-1 | `:120` `contadas === esperado` → `recibidos.size === esperado` | 10: (a) y (b) en las tres vías + 4 directas | sha igual, CRLF |
| M-2 | `:120` → `recibidos.size >= esperado` | 4: (b) en las tres vías + directa `marcar` apagado (b) | sha igual, CRLF |
| M-3 | `:119` filtra calificaciones en `recibidos` | 5: (a) en las tres vías + 2 directas («recibida nunca se marca», «guardada se marca y se desmarca») | sha igual, CRLF |
| M-4 | `rellenoConversaciones.ts:77` quita el `.filter` | 3: relleno (a), (b) y CA-4 | sha igual, CRLF |
| M-5 | `:186` `.channel?.toString().trim().toUpperCase() === 'FEEDBACK'` | 3: `'feedback'`, `' FEEDBACK'` y `['FEEDBACK']` | sha igual, CRLF |
| P-2 | `:121` `completa` → `completa: recibidos.size === esperado` | 2: `marcar` apagado (a) y (b) | sha igual, CRLF |
Ninguna mutación sobrevivió. sha256 de `conversaciones.ts`: `a0f36705…cc52d`; de `rellenoConversaciones.ts`: `12f268f2…1357d`.

## Barrido de citas (L1.7, regla de mutación 4)
`grep -rnoE` completo de `conversaciones.ts:N` (124 citas) y `rellenoConversaciones.ts:N` (186; incluye `routes/`, que es otro fichero) sobre el árbol del worktree; las que caen en líneas editadas, leídas contra el fichero nuevo:
- Registros fechados, B (no se tocan): `openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/verify-report.md:81`, `…2026-11-02-relleno-completo-conversaciones/{design.md:48, proposal.md:47}`, `…2026-11-04-persistencia-adjuntos/proposal.md:52` (109-140), `docs/sdd/Paquete_de_Despliegue_2026-10-30.md:74` y `:95`, `…2026-11-02.md:77`. Ninguna toca código.
- `rellenoConversaciones.ts:76` (`…2026-11-02-relleno-completo-conversaciones/{apply-progress.md:208, verify-report.md:79, :80}`, `…2026-11-07-verificacion-completitud/{design.md:46, proposal.md:115}`): A, el `WHERE` sigue en `:76`. `…2026-11-08-modo-sin-zoho/tasks.md:77` (`:4`) es de `routes/rellenoConversaciones.ts`: no aplica.
- De esta propuesta: `design.md` y `tasks.md` describen el estado nuevo: A. `proposal.md:39, :40, :41, :171, :173, :190` y `:48, :172, :174` describen `79546497`: B, pasan a B al archivar (D-12); sin tocar.
- Seis de Supervisión, NO tocados: `docs/sdd/ENTRADA.md:2411` (`conversaciones.ts:120-127` «cuadra con `esperadoDeZoho`»: B, ahora cuadra el recuento sin calificaciones), `docs/sdd/ENTRADA.md:2414` (`:120` «`recibidos.size === esperado`»: B), `openspec/config.yaml:6310` (`:120` ídem: B). `CLAUDE.md`, `F0-05_*` y `R08.4_Expediente_de_cambios.md`: sin citas en líneas editadas.
- Segundo pase de abreviadas (`:119`, `:120`, `:124`, `:104-108`, `:4`, `:74-77` sin fichero) en los 29 ficheros que citan los módulos: ninguna cae en lo editado (la `:120` de `…2026-11-02-relleno-completo-conversaciones/apply-progress.md:214` es de `estado.enMarcha`, sin cambio).
- Código y comentarios con cita a líneas editadas: ninguno (`apps/desk/server/completitud/lectores.ts:4` cita `:67-93`, sin tocar).

## Medida (L1.8)
`git diff --shortstat --no-renames 5b49569f` = 35 inserciones + 18 borrados (3 ficheros, con `tasks.md` 9/9) + `wc -l` de lo nuevo sin trackear: 135 + 82 (pruebas) + este fichero (34). Total ≈ 53 + 217 + 34 = ~304, muy por debajo de 800 (estimado ~700 con margen). Sin binarios.

Informe contrastado por el orquestador: `git diff --numstat` 22/5 (`conversaciones.ts`, 175 → 192, sólo crece por el final) y 4/4 (`rellenoConversaciones.ts`, 154 → 154); `wc -l` 135 + 82 + 34; CRLF en los cuatro `.ts`. Corregido en sitio un espacio perdido tras la coma en la línea de log `packages/zoho-sync/src/conversaciones.ts:124` («(3 con ellas),Zoho cuenta 3»), sin cambio de línea. M-2 reproducida por el orquestador (`>=` en `:120`): 4 rojas de 24 —la (b) en relleno, pasada periódica y `syncConversations`, y la directa con `marcar` apagado—; sha256 restaurado `0c699615ba82aa6b`, CRLF.
