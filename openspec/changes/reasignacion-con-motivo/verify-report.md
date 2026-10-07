```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:f3df509a85c31cad8f46e1ed16484e01d18ba2914d4fdd1e6c24956b32ed8af8
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 10/10
scenarios: 66/66
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:7f796333a7fc219ba5757e5f13a450c74882488515a1ce054abbb519d60cda59
build_command: npm run typecheck
build_exit_code: 0
build_output_hash: sha256:f9de8b15b07069fcbf31f4a415061f4b90d66551059b5518c6d53e721545e547
```

## Informe de verificación

**Cambio**: reasignacion-con-motivo (F1B-05, `cierra: si`) · **Cabeza**: `acf2157` · **Base**: `b14cd0f` · **Modo**: Strict TDD, adversario · **Worktree**: `C:\dev\Desk_2_R1.023-worktrees\reasignacion-con-motivo`

### Veredicto: PASS WITH WARNINGS

Cero CRITICAL, cuatro WARNING, ocho SUGGESTION. Las cuatro órdenes de cierre salen en 0 (vistas). De 68 mutaciones, 63 se ponen rojas y 5 sobreviven: dos son equivalentes bajo pg-mem y tres son pruebas que faltan (W-1 a W-3). Ningún superviviente rompe hoy un requisito observable: el código de esos tres casos es correcto por lectura; lo que falta es el detector. Envelope: 10 requisitos y 66 escenarios, todos con prueba pasada; dos escenarios llevan salvedad de calidad de la prueba (RQ-AV-20 «fuera de la transacción», W-1; RQ-TC-52 «un solo predicado», sólo estático por F0-00) y el validador exige contarlos completos, por eso el envelope dice 10/10 y 66/66 y los matices viven en los WARNING. Los hashes de salida son el sha256 de la salida de cada orden sin la línea final del código de salida.

### Completitud

| Métrica | Valor |
|---|---|
| Tareas marcadas | 58 |
| Tareas sin marcar | 13: 1.1, 1.16, 1.18, 2.1, 2.15, 2.17, 3.1, 3.19, 3.21, 4.1, 4.13, 4.14, 4.15 (`openspec/changes/reasignacion-con-motivo/tasks.md:47,62,64,73,87,89,98,116,118,128,140,141,142`) |

Las 13 son ceremonia del intento (abrir, correr el detector, commit, asentar, medir) que el apply dejó al orquestador; ninguna describe código. Ver W-4.

### Ejecución (código de salida mirado)

| Orden | Resultado | Salida |
|---|---|---|
| `npm test` | 248 ficheros pasados, 2 saltados; 3.865 pruebas pasadas, 7 saltadas | **0** |
| `npm run typecheck` | sin errores | **0** |
| `npm run lint -- --max-warnings 165` | 165 avisos, 0 errores (en el tope) | **0** |
| `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` | 6.582 comprobadas, rotas bloqueantes 0, cabeceras R-1 inválidas 0, línea base 0; 14 abreviadas rotas informativas | **0** |

Entre las 14 abreviadas rotas hay una del cambio: `openspec/changes/reasignacion-con-motivo/apply-progress.md:217` (`:157` atribuida a `trazas/spec.md`; en realidad es la línea 157 de `historial.ts`; informativa, ver S-3). Cobertura: no medida (no hay herramienta declarada). `git status` quedó limpio tras las mutaciones, salvo este informe.

### TDD (strict-tdd-verify)

| Comprobación | Resultado | Detalle |
|---|---|---|
| Evidencia TDD en apply-progress | OK | Tablas «Evidencia TDD (rojo a verde)» en los cuatro lotes (`apply-progress.md:16,74,127,183`), con la razón del rojo; no usan el nombre «TDD Cycle Evidence» |
| Los ficheros de prueba existen | OK | 9 ficheros del cambio más `migrate.test.ts`, `tickets.test.ts`, `users.test.ts`, `eliminarTicket.test.ts` |
| Verde ahora | OK | los 9 ficheros del cambio, 130 pruebas, verdes por separado y en la suite |
| Rojo histórico | Hipótesis | no se repite a posteriori; en su lugar, las 68 mutaciones prueban que las pruebas discriminan |
| Triangulación | OK, con W-3 | motivo vacío, de espacios y ausente; destino ausente, igual, inexistente e inactivo; origen nulo y no nulo |
| Excepciones declaradas | OK | `.tsx` y `client.ts` fuera de la red por F0-00 (`vitest.config.ts:16-20`); el rojo se exigió sólo a `lib/reasignacion.test.ts` |

Capas: unitarias y de integración con pg-mem y supertest; sin E2E. La carrera real de PostgreSQL y el rollback real no se ejercen: pg-mem no tiene `connect`, así que `enTransaccion` ejecuta sin transacción (`apps/desk/server/db/transaccion.ts:14`). Es el origen de W-1.

### Matriz de cumplimiento (66 escenarios)

Prueba = `fichero:línea del it`. Abreviaturas de fichero: R = `apps/desk/server/routes/reasignacion.test.ts`, D = `apps/desk/server/db/reasignaciones.test.ts`, S = `packages/shared/src/reasignacion.test.ts`, E = `apps/desk/server/db/eventoReasignacion.test.ts`, A = `apps/desk/server/services/avisoReasignacion.test.ts`, U = `apps/desk/server/auth/users.test.ts`, T = `apps/desk/server/db/eliminarTicket.test.ts`, M = `packages/zoho-sync/src/db/migrate.test.ts`, L = `apps/desk/src/lib/reasignacion.test.ts`, Y = `apps/desk/server/reasignacionSync.test.ts`.

**RQ-TC-50 · la ruta y su escalera (tickets-core)**; implementan `apps/desk/server/routes/reasignacion.ts:25-39` y `packages/shared/src/reasignacion.ts:39-47`.

| Escenario | Prueba | Resultado |
|---|---|---|
| usuario del área reasigna, el estado no cambia | R:51 | COMPLIANT |
| inexistente: 404 antes que 403 y 422 | R:83 | COMPLIANT |
| 403 antes que 422 | R:89 | COMPLIANT |
| el permiso se evalúa aunque el cuerpo sea válido | R:72 | COMPLIANT |
| sin motivo, 422 | R:105 (3 casos), R:115 | COMPLIANT |
| motivo antes que destino | R:115, S:100 | COMPLIANT |
| motivo antes que cada falla del destino | R:121, S:104 | COMPLIANT |
| destino ausente, 422 | R:155, S:110 | COMPLIANT |
| destino igual al actual, 422 (S-4) | R:149, S:116 | COMPLIANT |
| destino inexistente o inactivo, 422 | R:169 | COMPLIANT |
| igual al actual antes que inexistente (caract.) | R:141 | COMPLIANT |
| cambió entre lectura y escritura, 409 | R:232, D:59, D:66 | COMPLIANT |
| posición: 422 antes que 409 | R:246 | COMPLIANT |
| motivo guardado recortado | R:181, S:90 | COMPLIANT |
| origen nulo se puede reasignar | R:188, D:43 | COMPLIANT |
| reasignarse a uno mismo se permite (S-5) | R:194 | COMPLIANT |
| destino de otra área (S-6) | R:201 | COMPLIANT |
| no se puede vaciar por esta ruta | R:163 | COMPLIANT |

**RQ-TC-51 · atómica, sin mover estado, sobrevive al sincronizador**; implementa `apps/desk/server/db/reasignaciones.ts:30-39`.

| Escenario | Prueba | Resultado |
|---|---|---|
| actualización y traza juntas | D:33, D:92 (BEGIN, UPDATE, INSERT, ROLLBACK) | COMPLIANT |
| si falla la traza, `derivado_a` no cambia | D:92 por verbos (pg-mem no revierte) | COMPLIANT |
| eliminar el ticket borra sus reasignaciones (S-8) | T:244, T:262 | COMPLIANT |
| `ticket_transitions` no cambia | R:311 | COMPLIANT |
| la entrada vigente del estado es la misma | R:311 | COMPLIANT |
| `primerDerivado` no cambia | R:311 | COMPLIANT |
| el estado no se mueve | R:51, D:50 | COMPLIANT |
| sobrevive al sincronizador | Y:22 | COMPLIANT |
| no fija `managed_by_app` | Y:22, D:50 | COMPLIANT |
| el `de` es el valor vigente al aplicar | D:59, R:208 | COMPLIANT |

**RQ-TC-52 · el cliente consume el predicado y el validador**

| Escenario | Prueba | Resultado |
|---|---|---|
| un solo predicado, sin segunda copia | sólo estática: una definición (`packages/shared/src/reasignacion.ts:24`), importada en `apps/desk/src/components/PanelReasignar.tsx:30` | COMPLIANT con salvedad (el `.tsx` está fuera de la red por F0-00; ninguna prueba impide una copia; S-8) |
| un solo validador del motivo | L:52 enfrenta `puedeEnviarReasignacion` con `reasignacionDelCuerpo` | COMPLIANT |
| `lib/` no ofrece a la persona a cargo ni «Sin derivar» | L:13, L:19, L:27 | COMPLIANT |

**RQ-TC-11 mod. · borrado de ticket, diez tablas**: cubierto por T:60, T:89 (once entradas con la cabecera) y T:244; delta `openspec/changes/reasignacion-con-motivo/specs/tickets-core/spec.md:12-27`. Sin escenario propio.

**RQ-PM-27 · quién reasigna (permissions)**

| Escenario | Prueba | Resultado |
|---|---|---|
| usuario del área reasigna | R:51, S:21 | COMPLIANT |
| sin el área y sin ser admin, 403 | R:72, R:89 | COMPLIANT |
| el administrador pasa en cualquier estado | R:67, S:43 | COMPLIANT |
| estado sin salida, sólo admin (S-2) | R:351, S:51 | COMPLIANT |
| el cargo no abre la puerta (S-3) | S:58 | COMPLIANT |
| no hace falta ser la persona a cargo | R:60, S:72 | COMPLIANT |
| sujeto ausente falla cerrado | S:67 | COMPLIANT |
| barrido de estados por áreas contra la ruta | R:330, S:21 | COMPLIANT |
| sin sesión, 401 | R:46 | COMPLIANT |

**RQ-PM-11 mod. · usos de usuario**: origen U:176, destino U:182, recuento U:188, `reasignado_por` no cuenta U:198 y D:152. Los cuatro COMPLIANT.

**RQ-TZ-20 · traza y lectura (trazas)**

| Escenario | Prueba | Resultado |
|---|---|---|
| fila con origen, destino, motivo recortado, actor y fecha | D:33, R:181 | COMPLIANT |
| el historial enseña De, A, Motivo, Reasignado por | E:15, E:51 | COMPLIANT |
| origen nulo se lee «Sin derivar» | E:22 | COMPLIANT |
| id que no resuelve se enseña crudo | E:29 | COMPLIANT |
| no escribe en `ticket_transitions` | R:311 | COMPLIANT |
| reloj de la alarma y `primerDerivado` no se mueven | R:311 | COMPLIANT |
| no genera además línea de traspaso | E:60 | COMPLIANT |
| la base rechaza un motivo vacío | M:802, D:86 | COMPLIANT |
| el esquema califica la tabla y va al final | M:794, M:788 | COMPLIANT |
| abrir el historial no escribe (caract.) | E:84 | COMPLIANT |

**RQ-TZ-06 mod. y RQ-TZ-17 mod. (cuatro fuentes)**: «un ajuste de prioridad no aparece» E:67; «una reasignación sí aparece» E:60; «la reasignación entra en la misma línea de tiempo» E:51; «Zoho y app conviven» y «la remisión anulada y restaurada sigue» son escenarios heredados, cubiertos por `apps/desk/server/db/historial.test.ts:15` y `apps/desk/server/db/remisionRestaurada.test.ts:48,64`. Los cinco COMPLIANT.

**RQ-AV-20 · aviso (derivacion-avisos)**

| Escenario | Prueba | Resultado |
|---|---|---|
| el destino recibe aviso con motivo y actor | A:14, R:259 | COMPLIANT |
| a uno mismo no crea aviso | A:22, A:86, R:270 | COMPLIANT |
| no se avisa a la persona de origen | A:79, R:259 | COMPLIANT |
| administradores con copia sin duplicados | A:55, A:72 | COMPLIANT |
| el correo fallando no tumba la reasignación | R:276, R:287, A:94, A:103 | COMPLIANT |
| el aviso se escribe fuera de la transacción | R:302 y A:112 pasan pero **no discriminan** (la mutación TX sobrevive) | COMPLIANT con salvedad (W-1) |
| la decisión del aviso es una función pura (caract.) | A:14, A:26 | COMPLIANT |

### Los 17 criterios de aceptación de la propuesta

| # | Criterio | Evidencia | Estado |
|---|---|---|---|
| 1 | Área reasigna: 200, `derivado_a` cambia, `status` no | R:51 | OK |
| 2 | Sin fila nueva en `ticket_transitions`; inventario igual | R:311; `escritoresTransiciones.test.ts` verde en la suite; mutación D12 roja | OK |
| 3 | `entradasActuales` igual antes y después | R:311 | OK |
| 4 | `primerDerivado` igual | R:311 | OK |
| 5 | Fila en `reasignaciones` con todos los campos | D:33, R:181 | OK |
| 6 | Evento con De, A, Motivo, Reasignado por; «Sin derivar» | E:15, E:22, E:51 | OK |
| 7 | Sin área: 403; admin pasa | R:72, R:67 | OK |
| 8 | Estado sin salida: 403 a no admin | R:351, S:51 | OK |
| 9 | Inexistente: 404 aunque cuerpo y permiso sean inválidos | R:83 | OK |
| 10 | Motivo y destino inválidos: 422 | R:105 a R:169 | OK |
| 11 | Aviso al destino; a uno mismo no | R:259, R:270 | OK |
| 12 | Correo fallando: 200, todo escrito | R:276 | OK |
| 13 | Falla la traza: `derivado_a` no cambia | D:92 por verbos (pg-mem no revierte) | OK, límite declarado |
| 14 | Tras `upsertTicket`: conserva `derivado_a`, entra el estado, `managed_by_app` false | Y:22 (ticket fabricado por `upsertTicket`, precondición `Y:25`) | OK |
| 15 | No se borra al usuario origen o destino | U:176, U:182 | OK |
| 16 | Predicado del cliente = guarda del servidor; barrido | R:330, S:21 | OK, con la salvedad de RQ-TC-52 |
| 17 | test, typecheck, lint y detector en 0 | tabla de ejecución | OK |

### Mutaciones (reproducidas por mí; 68; cada una restaurada con `git checkout --` antes de la siguiente)

Conjunto: los 9 ficheros de la lista (130 pruebas) más, según la mutación, `migrate.test.ts` y `repo.test.ts`. Roja = al menos una prueba falló. Rutas abreviadas: `routes/reasignacion.ts` = `apps/desk/server/routes/reasignacion.ts`; `db/reasignaciones.ts` = `apps/desk/server/db/reasignaciones.ts`.

| # | Mutación | Resultado | Prueba que cae |
|---|---|---|---|
| G1 | quitar la guarda 404 (`routes/reasignacion.ts:27`) | roja | R:83 |
| G2 | quitar la guarda 403 (`:29`) | roja | R:72, R:89, R:330, R:351 |
| G3 | quitar la guarda del validador (`:32`) | roja | 10 de R |
| G4a | aceptar destino inactivo (`:35`) | roja | R:169 |
| G4b | aceptar destino inexistente (`:35`) | roja | R:169 |
| G5 | quitar el 409 (`:38`) | roja | R:232 |
| N1 | quitar el aviso (`:41`) | roja | 5 de R |
| N2 | actor = id en lugar de nombre (`:37`) | roja | R:181 |
| N3 | motivo sin recortar en la ruta (`:37`) | roja | R:181 |
| P1 | 403 delante del 404 (línea movida) | roja | R:83 |
| P2 | bloque 422 delante del 403 | roja | R:89, R:330 |
| P3 | guarda de destino activo delante del validador | roja | 10 de R |
| P4 | escritura delante de la guarda de destino activo | roja | R:169 |
| P5 | aviso delante de la escritura | roja | R:232, R:302 |
| P6 | escritura delante de las guardas C | roja | 31 de R |
| P7 | 404 detrás de las guardas C | roja | R:83 |
| V1 | destino delante de motivo (`packages/shared/src/reasignacion.ts:43-44`) | roja | S:100, S:104, R:115, R:121 |
| V2 | «mismo» delante de «destino ausente» | roja | S:120, R:131 |
| V3 | «mismo» delante de «motivo» | roja | S:104, S:120, R:121, R:131 |
| V4 | sin `trim` en el motivo | roja | 7 pruebas |
| V5 | sin `trim` en el destino | roja | 5 pruebas |
| V6 | comparar con `actual` en lugar de `actual ?? ''` (`:45`) | **SUPERVIVIENTE, equivalente** | S-1 |
| V7 | predicado sin `isAdmin` | roja | S:43, S:51, R:330 |
| V8 | sin el `!s` (falla cerrado) | roja | S:67 |
| V9 | `some` por `every` | roja | 6 pruebas |
| V10 | catálogo ignorando la clasificación | roja | S:21, R:330 |
| D1 | quitar `derivado_a = $3` del UPDATE (`db/reasignaciones.ts:34`) | roja | D:59, R:232 |
| D2 | quitar `IS NULL` del UPDATE (`:33`) | roja | D:66 |
| D3 | `return true` con cero filas | roja | D:59, D:66, D:73, D:106, R:232 |
| D4 | quitar el chequeo de filas | roja | las mismas 5 |
| D5 | el UPDATE de origen nulo toca `status` | roja | R:51, Y:22 |
| D5b | el UPDATE de origen no nulo toca `status` | roja | D:50, R:311 |
| D6 | el UPDATE no nulo toca `updated_at` | roja | D:50 |
| D6b | el UPDATE de origen nulo toca `updated_at` | **SUPERVIVIENTE** | W-3 |
| D7 | UPDATE no nulo fija `managed_by_app` | roja | D:50 |
| D7b | UPDATE nulo fija `managed_by_app` | roja | Y:22 |
| D8 | quitar `ORDER BY id` (`:45`) | **SUPERVIVIENTE, equivalente bajo pg-mem** | S-2 |
| D9 | usos sólo por `de` | roja | U:188, D:136, T:244 |
| D10 | usos sólo por `a` | roja | U:176, D:136 |
| D11 | INSERT de la traza por `db` (fuera de la transacción) | roja | D:92 |
| D12 | INSERT en `ticket_transitions` dentro de `reasignar` | roja | R:311 |
| A1 | quitar la supresión «a uno mismo» (`apps/desk/server/services/avisoReasignacion.ts:17`) | roja | A:22, A:86, R:270 |
| A2 | quitar `conCopia` | roja | A:55 |
| A3 | texto sin el motivo (`:18`) | roja | A:14, A:55, R:259 |
| A4 | sellar siempre `enviado_at` | roja | R:276, R:287, A:94, A:103 |
| A5 | aviso sin `ticket_id` | roja | A:55, R:259 |
| E1 | no resolver el nombre del origen (`apps/desk/server/db/eventoReasignacion.ts:14`) | roja | E:15, E:51 |
| E2 | no resolver el nombre del destino (`:15`) | roja | E:15, E:22, E:51 |
| E3 | quitar «Sin derivar» | roja | E:22 |
| E4 | crudo cambiado por un signo de interrogación | roja | E:29 |
| E5 | pedir usuarios aunque no haya filas (`:32`) | roja | E:73 |
| E6 | quitar el detalle «Motivo» | roja | E:15 |
| U1 | quitar la tercera fuente de `usosDeUsuario` (`apps/desk/server/auth/users.ts:139`) | roja | U:176, U:182, U:188, T:244 |
| T1 | quitar `reasignaciones` del barrido (`apps/desk/server/db/eliminarTicket.ts:54`) | roja | T:60, T:89, T:244, T:262 |
| H1 | quitar la cuarta fuente (`apps/desk/server/db/historial.ts:157`) | roja | E:51, E:60, E:67 |
| L1 | opciones sin filtrar a la persona a cargo (`apps/desk/src/lib/reasignacion.ts:12`) | roja | L:13 |
| L2 | `puedeEnviarReasignacion` siempre true (`:20`) | roja | L:37, L:42, L:52 |
| R1 | quitar el registro en `apps/desk/server/app.ts:61` | roja | 33 de R |
| S1 | `CREATE` sin `public.` (`packages/zoho-sync/src/db/schema.sql:756`) | roja | M:794 y el guardián de clasificación |
| S2 | quitar el `CHECK` | roja | M:802, D:86 |
| S3 | quitar de `PUBLIC_TABLES` (`packages/zoho-sync/src/db/migrate.ts:73`) | roja | guardianes de recuentos y clasificación |
| S4 | el `CREATE` deja de ser penúltimo (sentencia añadida al final) | roja | M:794 y el guardián de F1A-03 |
| S5 | quitar el índice | roja | M:794 |
| S6 | `CREATE` en `desk.` | roja | 17 pruebas |
| S7 | `a` y `reasignado_por` sin `NOT NULL` | **SUPERVIVIENTE** | W-2 |
| S9 | `a` con clave foránea a `users` | roja | M:802, D:33 y otras |
| SY1 | `derivado_a` dentro de `TICKET_COLS` (`packages/zoho-sync/src/db/repo.ts`) | roja | Y:22 y `repo.test.ts` |
| TX | aviso DENTRO de la transacción (parámetro `despues` en `reasignar`) | **SUPERVIVIENTE** | W-1 |

**Recuento: 68 mutaciones, 63 rojas, 5 supervivientes** (V6 y D8 equivalentes; D6b, S7 y TX, pruebas que faltan). Una mutación adicional (UPDATE de `ticket_transitions` sin filas) se descartó por no tocar datos y no se cuenta.

### Regla 13 y regla de mutación 3

Contrasté las 9 filas de la tabla de `apply-progress.md:193-204` contra `PanelReasignar.tsx`, `lib/reasignacion.ts` y `routes/reasignacion.ts`: **todas las líneas citadas dicen lo que la fila afirma** (`apps/desk/src/components/PanelReasignar.tsx:30` guarda del panel, `:40` errores, `:57` opciones, `:63` botón; `apps/desk/src/lib/reasignacion.ts:12` y `:20`; `apps/desk/server/routes/reasignacion.ts:23`, `:29`, `:31-32`, `:34-35`, `:37-39`) y las pruebas R:46, 72, 105, 115, 141, 149, 155, 163, 169, 232, 330 y 351 están en esas líneas. Decisiones del cliente que enumeré en `PanelReasignar.tsx`: ocultar sin sesión o sin permiso (`:30`), opciones (`:57`), botón (`:63`), opción «Elegir…» deshabilitada (equivale a no ofrecer «Sin derivar») y mostrar los errores del servidor (`:40`). **Ninguna decisión queda fuera de la tabla ni sin línea de servidor.** Dos matices: (a) el espejo del permiso es legítimo porque la guarda está probada (R:72, R:330; mutaciones G2 y V7 rojas); (b) `derivadoActual` llega del ticket cargado (`apps/desk/src/components/TicketDetailView.tsx:338`) y puede estar viejo: lo impone el 409 (R:232). Hipótesis: el panel se pinta como se describe (los `.tsx` no se prueban; P-1).

### Regla de mutación 4 (citas)

- Número de líneas igual a `b14cd0f` (`git show b14cd0f:<ruta> | wc -l` contra `wc -l`): `historial.ts` 162/162, `users.ts` 158/158, `eliminarTicket.ts` 189/189, `app.ts` 96/96, `migrate.ts` 131/131, `TicketDetailView.tsx` 420/420. `migrate.test.ts` crece de 779 a 811 y `client.ts` de 864 a 871, sólo por el final.
- Citas que el apply clasificó como «dejan de ser ciertas»: (1) `openspec/specs/trazas/spec.md:141` queda cubierta por el MODIFIED de RQ-TZ-06 (`specs/trazas/spec.md:38`); su abreviada «`:157`» y «`:123-124`» siguen ciertas (`apps/desk/server/db/historial.ts:157` une las cuatro fuentes y `:123-124` es el orden). (2) `trazas/spec.md:28` y `:484` caen **fuera** de todo requisito (tablas de procedencia y de discrepancias, con la columna rotulada «Código (`ad1875b`)» en `:26`): ningún MODIFIED las cubre y no hace falta; son Caso B históricas (S-4). (3) `openspec/specs/tickets-core/spec.md:601` queda cubierta por el MODIFIED de RQ-TC-11 (`specs/tickets-core/spec.md:12-27`, «diez tablas hijas»): **el apply se equivoca al decir que no** (`apply-progress.md:218`, S-3). (4) Las «dos referencias» de `openspec/specs/permissions/spec.md:257-266` quedan cubiertas por el MODIFIED de RQ-PM-11 (`specs/permissions/spec.md:9-35`, «tres»). **Ninguna queda desfasada tras el archivo.**
- Segundo pase de abreviadas (el apply no lo hizo): barrido de las líneas tocadas de `historial.ts` (3, 128, 157), `users.ts` (4, 128, 139) y `eliminarTicket.ts` (32, 54) sobre 909 ficheros versionados fuera de `archive/` y del propio cambio. Sólo caen `trazas/spec.md:141` (cubierta), `openspec/specs/permissions/spec.md:263` (`users.ts:128-131`: la frase del `values` está hoy en 130-131, dentro del rango; sigue cierta) y `docs/sdd/Paquete_de_Despliegue_2026-10-06.md:205` (`eliminarTicket.ts:54`, verificada). Sin otra afectada.
- Frases obsoletas sin forma de cita: `docs/runbooks/borrar-tickets-de-prueba.md:10` («nueve tablas», borrado manual sin `public.reasignaciones`) y `apps/desk/src/components/CreateTicket.tsx:254` («nueve tablas», ya desfasada antes del cambio): S-5.

### Topología

`CREATE TABLE IF NOT EXISTS public.reasignaciones` calificado en `packages/zoho-sync/src/db/schema.sql:756`, penúltima sentencia, con `idx_reasignaciones_ticket` (`:765`) última y en una sola sentencia (M:794). `'reasignaciones'` está en `PUBLIC_TABLES` (`packages/zoho-sync/src/db/migrate.ts:73`); los guardianes reaccionan (S1, S3, S4, S5 y S6 rojas). Sin claves foráneas (S9 roja). Pendiente W-2 (`NOT NULL`).

### Sincronizador

Y:22 fabrica el ticket con `upsertTicket(db, ticketRowFromZoho(...))` (no con un `INSERT` a mano), afirma `managed_by_app === false` antes (`apps/desk/server/reasignacionSync.test.ts:25`), pasa por la ruta real con cookie de administrador, vuelve a llamar a `upsertTicket` con `En Proceso` y compara la fila entera. Discrimina: D7b (marcar `managed_by_app` en el UPDATE de origen nulo), D5 (tocar `status`) y SY1 (`derivado_a` en `TICKET_COLS`) caen en Y:22; SY1 cae además en `packages/zoho-sync/src/db/repo.test.ts`. La rama de origen no nulo no la ejerce Y:22 (usa origen nulo): D7 sólo cae en D:50.

### Cabecera R-1 y `cierra: si`

Los siete campos están (`openspec/changes/reasignacion-con-motivo/proposal.md:1-9`) y el detector da cero cabeceras inválidas. Lo sostiene: la fila F1B-05 «Roles, traspaso, checkbox comercial, trazas» (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:85`) tenía al 05/10 dos faltas (`:212`: visibilidad por área y traspaso con motivo); la decisión `decision/e089-e220-visibilidad-y-traspaso` (`openspec/config.yaml:3992-4019`) cierra la primera sin construir (consecuencia 1, `:4002-4003`), aprueba la segunda «ya» (consecuencia 3) y dice «F1B-05 puede cerrar» (consecuencia 5, `:4015`). Este cambio cubre el traspaso con motivo, traza y aviso; **deja fuera** la restricción por propietario (F1C-05), las ausencias (M6) y la visibilidad por área (cerrada sin construir). Lo que queda son comprobaciones de persona (P-1 a P-4). Salvedad: `cierra: si` cuenta sólo cuando el archivo tenga este verify en PASS; el `archive-report.md` debe llevar la línea de cobertura de fila de R-1. La prueba de `apps/desk/server/reconciliacion/registro.test.ts:218-222` (lista «en curso») cambia en el archivo, no antes; hoy la suite pasa.

### Documentos

Leí las citas de la corrección 30, del apartado de `DEPLOY.md` y del §9 del paquete: **todas dicen lo que la frase afirma** (`schema.sql:756`, `db/reasignaciones.ts:34,36,51`, `eventoReasignacion.ts:30`, `avisoReasignacion.ts:17,18`, `routes/reasignacion.ts:23,29,31,32,35,41`, `shared/reasignacion.ts:24-27,26,45`, `eliminarTicket.ts:54`, `users.ts:139`, R:232, R:302, `TicketDetailView.tsx:320`). Las del maestro: la línea 2035 de la R08.4 trae «La pueden hacer la persona a cargo y el Director o el Coordinador del área.» y las 2060-2062 el trío «Línea de traspaso en el historial, aviso personal y reasignación con motivo» / «Propuesto R08.4» / «Recomendación: en la fila F1B-05… (sin empezar)», que es lo que la corrección dice reemplazar. `git diff --stat b14cd0f acf2157 -- docs/sdd/ENTRADA.md openspec/config.yaml` sale vacío. Sin menciones de reuniones en lo añadido (revisados los tres diffs).

## Hallazgos

### CRITICAL
Ninguno.

### WARNING

**W-1 · El escenario «el aviso se escribe fuera de la transacción» (RQ-AV-20) no tiene prueba que discrimine.** La mutación TX (pasar `notificarReasignacion` como `despues` dentro de `enTransaccion`) deja las 130 pruebas en verde. Causa: pg-mem no expone `connect`, así que `enTransaccion` ejecuta `fn(db)` sin transacción (`apps/desk/server/db/transaccion.ts:14`) y ni `apps/desk/server/routes/reasignacion.test.ts:302` ni `apps/desk/server/services/avisoReasignacion.test.ts:112` pueden ver el orden. El código es correcto hoy (`apps/desk/server/routes/reasignacion.ts:37-41`: el aviso va después del `await reasignar`). **Corrección**: prueba de ruta con un pool falso con `connect` (molde de `apps/desk/server/db/reasignaciones.test.ts:92-104`) que registre los verbos por conexión y afirme que el `INSERT INTO avisos` llega por el pool después de `tx:COMMIT`.

**W-2 · `NOT NULL` de `a` y de `reasignado_por` sin detector (regla de mutación 2).** La mutación S7 (quitarlos en el `CREATE` que empieza en `packages/zoho-sync/src/db/schema.sql:756`) deja 71 pruebas en verde. RQ-TZ-20 dice que `a` es obligatorio (`openspec/changes/reasignacion-con-motivo/specs/trazas/spec.md:93`). `packages/zoho-sync/src/db/migrate.test.ts:802` sólo prueba el `CHECK` del motivo y el origen nulo. **Corrección**: en ese bloque, dos `INSERT` directos que deban rechazarse (`a` nulo; `reasignado_por` nulo).

**W-3 · El UPDATE de origen nulo no está cubierto contra `updated_at`.** La mutación D6b (añadir `updated_at = now()` en `apps/desk/server/db/reasignaciones.ts:33`) sobrevive; la misma en la rama no nula (`:34`) cae en D:50. DD-2 y la propuesta prohíben tocar `updated_at`. **Corrección**: repetir D:50 con un ticket sin persona a cargo (`de: null`) y afirmar `status`, `managed_by_app` y `updated_at` iguales.

**W-4 · 13 tareas sin marcar en `tasks.md`** (lista arriba). Son del orquestador: abrir y asentar cada intento, commit, medida. 1.16, 2.15, 3.19 y 4.13 (correr las cuatro órdenes) tienen ahora evidencia en la tabla de ejecución. Para 4.14: `git diff --shortstat --no-renames b14cd0f acf2157` da 38 ficheros, 3.220 inserciones y 36 borrados en todo el cambio (planificación y documentos incluidos); los lotes de construcción midieron 537, 410, 530 y 286 según `apply-progress.md`. Este intento de verify añade un fichero nuevo, este informe. **Corrección**: marcarlas al asentar.

### SUGGESTION

**S-1 · Código muerto.** `packages/shared/src/reasignacion.ts:45`: `(actual ?? '')` es equivalente a `actual` porque `destino` ya no es vacío en ese punto (mutación V6 sobrevive; S:124 lo documenta). Simplificar o dejarlo; no es defecto.

**S-2 · `ORDER BY id` no se puede probar con pg-mem** (`apps/desk/server/db/reasignaciones.ts:45`; mutación D8 equivalente bajo pg-mem, que devuelve en orden de inserción). El consumidor reordena (`apps/desk/server/db/historial.ts:157` ordena con `masRecientePrimero`). Dejarlo: es defensa contra el orden no garantizado de PostgreSQL.

**S-3 · Imprecisiones en `apply-progress.md`.** `:218` dice que el delta de `tickets-core` no modifica RQ-TC-11 y que queda desfasada; es lo contrario (`specs/tickets-core/spec.md:12-27`). `:65` cita `avisoReasignacion.ts:16` para el texto del aviso: es la firma, el texto está en `:18`. `:217` genera una abreviada rota informativa en el detector. Para dejar el detector sin esa línea, escribir «línea 157 de `historial.ts`» en prosa.

**S-4 · `openspec/specs/trazas/spec.md:28` y `:484` seguirán diciendo tres fuentes tras el archivo.** Son Caso B (la columna dice `ad1875b`): correctas como registro fechado. Opcional: añadir «en `ad1875b`» a la celda para que la cita nombre su revisión.

**S-5 · Frases «nueve tablas» sin actualizar** en `docs/runbooks/borrar-tickets-de-prueba.md:10` (el borrado manual dejaría filas en `public.reasignaciones` y haría inborrable a su origen o destino) y `apps/desk/src/components/CreateTicket.tsx:254` (ya desfasada antes). Documentales; añadir `reasignaciones` al runbook.

**S-6 · El DEPLOY apunta a `apps/desk/server/db/eventoReasignacion.ts:30`** (cabecera) para «el historial falla al leerla»; la consulta es `apps/desk/server/db/reasignaciones.ts:45`. Apuntar a `:31` o a `reasignaciones.ts:45`.

**S-7 · Una sola prueba cubre cuatro escenarios** (R:311: `ticket_transitions`, `entradasActuales`, `primerDerivado`, estado). Funciona (D12, D5b y la ruta la ponen roja) pero un fallo no dice cuál. Partirla en cuatro `it` si se reabre el fichero.

**S-8 · «Un solo predicado, sin segunda copia» (RQ-TC-52) sólo tiene evidencia estática.** Una prueba de `packages/shared` o `apps/desk/src/lib` que lea `PanelReasignar.tsx` como texto y exija el `import` de `puedeReasignar` desde `@ambientalia/shared` (sin tocar `vitest.config.ts` ni instalar jsdom) fijaría el escenario sin reabrir la decisión F0-00.

## Tareas de persona — fuera del recuento; archivar no las da por hechas

| # | Dueño | Qué | Dónde queda escrito |
|---|---|---|---|
| P-1 | Analista | Verificar en la aplicación el panel, el aviso y la línea del historial (los `.tsx` están fuera de la red de pruebas) | `docs/sdd/Paquete_de_Despliegue_2026-10-06.md` §9.3 |
| P-2 | Gerencia | Confirmar o corregir S-2, S-4, S-5, S-6 y S-8 | mismo paquete, §9.1 |
| P-3 | Gerencia | Pegar la corrección 30 en el maestro | `docs/sdd/F0-01_Correcciones_para_el_maestro.md` |
| P-4 | Mantenedor | Desplegar y comprobar que existe `public.reasignaciones` | `DEPLOY.md` |

## Siguiente paso

`sdd-archive` es viable si el orquestador acepta los WARNING; W-1 a W-3 son pruebas que faltan (unas 60 líneas) y pueden ir antes del archivo o quedar como deuda anotada. Antes de asentar, marcar las 13 casillas de W-4. El archivo supera 800 líneas sólo por la mudanza de carpetas: medir antes la fusión de los cuatro deltas más el `archive-report.md` (regla del archivo, E-150) y fusionar por script.
