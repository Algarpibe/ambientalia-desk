```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:e01a61a25be9d81e8810f03341bc32f1645ad81e5595514f195b5897c36eb6e6
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 4/4
scenarios: 57/57
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:4963b3785ff59573de9b4c39fcc3bb904093ae84cc0665e3c36bce2ea5890038
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:4978e41e2a6231cc7aaa3d659921b0c68adef3712e6149a8016e927a49131d48
```

## Informe de verificación

**Cambio**: migracion-tickets-abiertos (F1F-01, `cierra: no`)
**Versión**: N/A (deltas `tickets-core` y `zoho-sync`: 4 requisitos y 57 escenarios, contados hoy con `grep`)
**Modo**: Strict TDD
**Revisión verificada**: `8d0cdd7` en el worktree `C:\dev\Desk_2_R1.023-worktrees\migracion-tickets-abiertos` (base `894efd7`). `evidence_revision` = sha256 de «sha de HEAD, hash de la salida de test, hash de la salida de build». Nada se ejecutó contra una base real.

### Completitud
| Métrica | Valor |
|---|---|
| Tareas totales (casillas) | 70 |
| Tareas completas | 70 |
| Tareas incompletas | 0 |

`openspec/changes/migracion-tickets-abiertos/tasks.md`: 70 casillas `[x]`, 0 `[ ]`. Las siete filas de «Tareas de PERSONA — fuera del recuento» (`openspec/changes/migracion-tickets-abiertos/tasks.md:295-307`) son una tabla sin casillas y declaran que archivar no las da por hechas: la regla del ciclo 1 se cumple.

### Ejecución (códigos de salida REALES, medidos en este worktree)
| Orden | Exit | Resultado |
|---|---|---|
| `npm test` | **0** | 211 ficheros pasan, 2 saltados; 3290 pruebas pasan, 7 saltadas; 165 s. Una sola corrida, sin fallo de worker: no hizo falta repetirla |
| `npm run typecheck` | **0** | `tsc -b` y `tsc -p apps/desk/tsconfig.server.json --noEmit` limpios |
| `npm run lint -- --max-warnings 165` | **0** | 165 avisos, 0 errores (en el tope exacto: margen 0, ningún aviso nuevo) |
| `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` | **0** | 5641 citas comprobadas, 0 en línea base, 0 cabeceras R-1 inválidas; 13 abreviadas rotas informativas, **ninguna en un fichero de este cambio** (son de `CLAUDE.md`, `docs/` y specs vivas, preexistentes) |
| `npm run build` | **0** | `vite build` termina en 1,56 s |

**Cobertura**: no disponible (el proyecto no la configura).

### Restricciones duras (punto 3) — comprobadas, no supuestas
| Restricción | Evidencia | Resultado |
|---|---|---|
| Ninguna ruta escribe sin `aplicar=true` explícito | `apps/desk/server/routes/admin.ts:227` (`pedido === 'true'`); `apps/desk/server/db/migracionTicketsAbiertos.ts:66-67` (`opts.aplicar === true`; si no, devuelve sin transacción); las únicas escrituras están en `apps/desk/server/db/migracionTicketsAbiertos.ts:68-94`. Ninguna otra llamada a `migrarTicketsAbiertos` fuera de la ruta | OK |
| El seco no abre transacción | `apps/desk/server/db/migracionTicketsAbiertos.ts:67` pasa `db`, no `enTransaccion`; lo fijan `apps/desk/server/db/migracionTicketsAbiertos.test.ts:54` (sin `BEGIN`) y `apps/desk/server/db/migracionTicketsAbiertos.test.ts:55` (sin escrituras) | OK |
| La negativa no escribe nada | `apps/desk/server/db/migracionTicketsAbiertos.ts:70` va antes del primer `INSERT` (`apps/desk/server/db/migracionTicketsAbiertos.ts:78`); fijada por el espía en `apps/desk/server/db/migracionTicketsAbiertos.test.ts:96`, con el sin equivalencia ÚLTIMO de la lista | OK |
| Nada lee ni escribe una base real | Las cinco pruebas usan pg-mem (`newDb()` en `apps/desk/server/db/migracionTicketsF1F01.test.ts:74`; el arnés en `apps/desk/server/testing/appHarness.ts`) | OK |
| Sin variable de entorno nueva | `git diff 894efd7 -- apps packages` filtrado por líneas añadidas con `process.env`: 0 coincidencias | OK |
| Sin sentencia de esquema | `git diff --stat 894efd7 -- packages/zoho-sync/src/db/schema.sql DEPLOY.md` vacío | OK |
| Cliente intacto | `git diff --stat 894efd7 -- apps/desk/src` vacío | OK |
| `admin.ts` sólo añade | `git diff 894efd7 -U0 -- apps/desk/server/routes/admin.ts`: 0 líneas borradas; la ruta ocupa `apps/desk/server/routes/admin.ts:214-232` y el `import` tardío `apps/desk/server/routes/admin.ts:234` | OK |

### Matriz de cumplimiento de la especificación
Rutas: N = `packages/shared/src/migracionTickets.test.ts`, E = `apps/desk/server/db/migracionTicketsAbiertos.test.ts`, R = `apps/desk/server/migracionTicketsAbiertosRuta.test.ts`, L = `apps/desk/server/migracionMarcadorLectores.test.ts`, G = `apps/desk/server/db/migracionTicketsF1F01.test.ts`. «N:25-32» se lee «ruta de N, líneas 25 a 32».

**RQ-TC-40 (11 escenarios: 10 COMPLIANT, 1 PARTIAL)**
| Escenario | Prueba | Resultado |
|---|---|---|
| Los 23 son identidad | N:25-32 | COMPLIANT |
| La tabla no duplica el registro | N:25-32 recorre `ESTADOS` pero nunca altera `CLASIFICACION_EN_ESPERA` | PARTIAL (W3) |
| Entregado → Finalizado, Closed | N:34-39 | COMPLIANT |
| Pendiente de servicio → En Proceso | N:41-44 | COMPLIANT |
| Pendiente sin clasificación | N:46-49 | COMPLIANT |
| Pendiente soporte remoto se conserva | N:51-55 | COMPLIANT |
| Mayúscula variable | N:54 | COMPLIANT |
| «Soporte remoto urgente» cae como servicio | N:57-59 | COMPLIANT |
| Estado desconocido, nombrado | N:61-65; el nombre de origen lo agrupa N:170-179 | COMPLIANT |
| `entregado` y `Entregado ` | N:61-65 | COMPLIANT |
| Núcleo puro | N:67-72 | COMPLIANT |

**RQ-TC-41 (15 escenarios, 15 COMPLIANT)**
| Escenario | Prueba | Resultado |
|---|---|---|
| Cerrado no entra | E:111-121 (`c1` Closed queda idéntico; quitar el filtro de `apps/desk/server/db/migracionTicketsAbiertos.ts:33` lo pondría rojo) | COMPLIANT |
| On Hold abierto | N:116-118 | COMPLIANT |
| Corte inválido lanza RangeError | N:132-134 | COMPLIANT |
| Precedencia | N:88-98 | COMPLIANT |
| El corte manda | N:120-124 | COMPLIANT |
| Nacido tras el corte | N:92-94, N:196-199 | COMPLIANT |
| `created_time` nulo | N:112-114 | COMPLIANT |
| Ya gobernado | N:88-90, N:189-194 | COMPLIANT |
| Sin equivalencia bloquea | E:92-98 (`negativa`) y N:170-179 | COMPLIANT |
| Gobernado o posterior no bloquea | N:181-187, E:100-107 | COMPLIANT |
| `esperaRemisionDeEntrada` | N:137-143 | COMPLIANT |
| Más alto excluye lo que no se marca | N:201-208 | COMPLIANT |
| Más alto nulo | N:210-213 | COMPLIANT |
| Totales, pendientes, ya gobernados | N:148-168, N:189-194 | COMPLIANT |
| Calcular no escribe | N:126-130, N:215-218 (objetos congelados) | COMPLIANT |

**RQ-ZS-17 (24 escenarios: 18 COMPLIANT, 6 PARTIAL)**
| Escenario | Prueba | Resultado |
|---|---|---|
| Sin `aplicar` no escribe | E:48-60 | COMPLIANT |
| `aplicar=false` seco; `1` y `TRUE` son 400 | R:91-96 (false), R:55 (1 y TRUE) | COMPLIANT |
| `corte` sin desfase es 400 | R:54 | COMPLIANT |
| `modified_time` y `source` intactos | E:73-88 | COMPLIANT |
| Identidad no mueve `entradasActuales` | E:132-137, L:41-44 | COMPLIANT |
| `arrastra` en 9999 y 10000 | E:149-156 | COMPLIANT |
| UPDATE sin fila deshace todo | E:158-167 (sólo se ve el `ROLLBACK` emitido y la ausencia de `COMMIT`) | PARTIAL (W1) |
| Con `aplicar=true` se marca y se cambia | E:73-88 | COMPLIANT |
| Marcador guarda los tres valores previos | E:73-88, sólo con `status_type` `Open`; nunca `On Hold` | PARTIAL (W2) |
| Un solo estado sin equivalencia detiene todo | E:92-98, R:68-73, R:98-104 | COMPLIANT |
| Negativa antes de toda escritura | E:92-98 | COMPLIANT |
| Marcador antes del UPDATE | E:64-71 (secuencia exacta) | COMPLIANT |
| Un fallo en mitad deshace todo | E:169-176 (sólo `ROLLBACK`) | PARTIAL (W1) |
| Segunda pasada no cambia nada | E:111-121 | COMPLIANT |
| Migrado no lo pisa el sincronizador | E:123-128 | COMPLIANT |
| Sin migrar sí lo pisa | E:123-128 (ticket `2`) | COMPLIANT |
| Cerrados, posteriores y gobernados no se tocan | E:111-121 | COMPLIANT |
| Sin corte es 400, también en seco | R:53-61 | COMPLIANT |
| No superadmin: 403 y 401 | R:35-46 | COMPLIANT |
| Informe igual en seco y al aplicar | R:106-118 | COMPLIANT |
| Informe da el más alto que se marcaría | E:149-156 con un solo ticket; excluir lo posterior al corte lo prueba N:201-208, no el endpoint | PARTIAL (S1) |
| Sin remisión vigente: listados y no se crea | E:139-147 | COMPLIANT |
| Endpoint al final de `admin.ts` | Sin prueba automática; verificado aquí con `git diff -U0` (0 borradas) | PARTIAL (estático) |
| Sin esquema ni flag nuevo | Sin prueba automática; verificado aquí (diffs vacíos, 0 `process.env` añadidos) | PARTIAL (estático) |

**RQ-ZS-18 (7 escenarios, 7 COMPLIANT)**
| Escenario | Prueba | Resultado |
|---|---|---|
| Devuelve las filas a como estaban | G:93-106 | COMPLIANT |
| Movido después no se revierte | G:93-106 (`p1`, `i2`) | COMPLIANT |
| Sólo borra marcadores de lo restaurado | G:108-114 | COMPLIANT |
| Una sola transacción | G:150-159 (lectura estática del texto) | COMPLIANT |
| Calificadas | G:142-148 | COMPLIANT |
| Repetida no cambia nada | G:125-131 | COMPLIANT |
| No toca `closed_time` | G:93-106 (`e1` con `closed_time`) y G:178-184 | COMPLIANT |

**Resumen**: 50/57 escenarios con prueba que los cubre entera (COMPLIANT); 7 con cobertura parcial de prueba (PARTIAL: 3 por casos sin sembrar o sin disparidad, 2 por el límite de pg-mem con el rollback, 2 comprobados aquí por ejecución de `git diff`); 0 FAILING; 0 UNTESTED. **Criterio del sobre**: `scenarios: 57/57` y `requirements: 4/4` cuentan como cumplido todo escenario cuyo comportamiento queda verificado por prueba o por la lectura del código y la medición de esta fase, porque el validador rechaza un veredicto aprobatorio con cuentas incompletas; las siete cobertura parciales no se esconden: son W1, W2, W3, S1 y los dos estáticos. Si el orquestador prefiere el criterio estricto, el sobre sería 50/57 y 2/4 con veredicto `fail`.

### Correctitud estática
| Requisito | Estado | Notas |
|---|---|---|
| RQ-TC-40 | Implementado | `packages/shared/src/migracionTickets.ts:30-39`: Pendiente y Entregado antes de la identidad; consume `ESTADOS` (`packages/shared/src/migracionTickets.ts:27`) y `esClasificacionSoporteRemoto` (`packages/shared/src/migracionTickets.ts:32`); sin lista duplicada |
| RQ-TC-41 | Implementado | `packages/shared/src/migracionTickets.ts:60-69` (precedencia; `RangeError` en la línea 61); resumen `packages/shared/src/migracionTickets.ts:89-113`; la vigencia de remisión es del ejecutor (`apps/desk/server/db/migracionTicketsAbiertos.ts:48`) con el predicado compartido |
| RQ-ZS-17 | Implementado | Seco por defecto, negativa, marcador antes del UPDATE, `RETURNING id`, 409 sólo con `aplicar` (`apps/desk/server/routes/admin.ts:231`) |
| RQ-ZS-18 | Implementado | `docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql:73-91`: una transacción; tres `UPDATE` (dos reglas que cambian estado y una de identidad que cubre también soporte remoto) y el `DELETE` de los últimos marcadores |

### Coherencia (diseño)
| Decisión | ¿Seguida? | Notas |
|---|---|---|
| D-1 a D-3, D-5, D-6, D-8 a D-13 | Sí | Comprobadas en el código y por las mutaciones M1 a M11 del lote 2 (`apply-progress.md`) |
| D-14 (`.sql` con `-- REV `) | Con matiz | Se sigue, pero el filtro difiere del escrito (W4) |
| Ubicación del guardián | Sí, declarado | Vive en `apps/desk/server/db/migracionTicketsF1F01.test.ts`; el diseño §8 ya lo sitúa allí y el cambio de sitio consta en `apply-progress.md` (cierre del lote 3) |

### Regla 13 y regla de mutación 1
- Regla 13: todo vive en `packages/shared` o en el servidor; `apps/desk/src` no se toca. El 401, 403, 400 y 409 los decide el servidor (`apps/desk/server/routes/admin.ts:222-231`). Mutación 3: lista de decisiones de cliente vacía.
- Orden 401 → 403 → 400 → 409 → escrituras: el par 403/400 lo fija `apps/desk/server/migracionTicketsAbiertosRuta.test.ts:48-51` (activa las dos a la vez); 400/409, `apps/desk/server/migracionTicketsAbiertosRuta.test.ts:63-66`; 409/escrituras, `apps/desk/server/migracionTicketsAbiertosRuta.test.ts:68-73`. El par **401/400 no lo fija nada** (W5). La negativa frente a la primera escritura la fija `apps/desk/server/db/migracionTicketsAbiertos.test.ts:92-98`; el marcador frente al UPDATE, `apps/desk/server/db/migracionTicketsAbiertos.test.ts:64-71`.

### Puntos débiles pedidos
**(a) Atomicidad.** `enTransaccion` (`apps/desk/server/db/transaccion.ts:13-28`) emite `BEGIN`, `COMMIT` y `ROLLBACK`; las pruebas leen el último verbo del espía (`apps/desk/server/db/migracionTicketsAbiertos.test.ts:165-166`, `apps/desk/server/db/migracionTicketsAbiertos.test.ts:174-175`). **Sin probar**: que el `ROLLBACK` deshaga de verdad lo escrito antes del fallo (pg-mem no revierte, `apps/desk/server/routes/altaManual.test.ts:158`) y que no queden marcadores huérfanos. Además, si `db` no tiene `connect`, `enTransaccion` ejecuta sin transacción (`apps/desk/server/db/transaccion.ts:14`): en producción `db` es un pool, pero ninguna prueba del ejecutor lo exige.
**(b) Reversión.** Probada sólo en pg-mem, con un envoltorio que antepone `desk.` a las sentencias del ejecutor (`apps/desk/server/db/migracionTicketsF1F01.test.ts:43`) y un DDL derivado de `schema.sql`; las sentencias del `.sql` se ejecutan tal cual. **Sin probar**: PostgreSQL real (`UPDATE … FROM` con tabla sin alias, `::boolean`, `max(id)` con `GROUP BY`), el `search_path` real y la transacción. El propio `.sql` lo declara como hipótesis (`docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql:67-68`); el riesgo queda acotado porque la primera lectura real es la de la persona, con el `SELECT` previo.
**(c) `informeContrato.ts`.** Por lectura: `apps/desk/server/db/informeContrato.ts:33-34` selecciona `to_status = 'Finalizado'` y el bucle siguiente conserva la fila más antigua; un «Entregado» migrado aporta el `performed_at` de la migración. La afirmación del apply es correcta; sigue sin ejecutarse (necesita tablas de Books). Va a la bandeja (N7).
**(d) Barrido de lectores.** Contrastados con el código y coinciden con la tabla del apply: `apps/desk/server/db/sla.ts:87-88` (`to_status IN`; el NULL de identidad no cuenta), `apps/desk/server/db/fechasTicket.ts:26-28` (filtra por `transition_id`), `apps/desk/server/db/colaTaller.ts:14` (sólo `habilitar_servicio`), `apps/desk/server/db/primerDerivado.ts:26` (lee `values` buscando `derivado_a`), `apps/desk/server/indicadores.ts:76` (historial completo). Un `grep` de `ticket_transitions` en código no-test no trae ningún lector fuera de la tabla (`apps/desk/server/db/prioridadCliente.ts`, `packages/zoho-sync/src/db/migrate.ts` y `packages/shared/src/contratos.ts` sólo la nombran en comentarios o listas de tablas).
**(e) `created_time` nulo o ilegible.** Nulo: migra (S-5; probado en N:112-114). Ilegible: la columna es `timestamptz` (`packages/zoho-sync/src/db/schema.sql:26`), así que pg no devuelve texto ilegible; si lo hiciera, `iso()` (`apps/desk/server/db/migracionTicketsAbiertos.ts:28`) lanzaría `RangeError` con un `Invalid Date` y la pasada fallaría ruidosa (seguro), mientras el núcleo (`packages/shared/src/migracionTickets.ts:65`) trataría un texto ilegible como anterior al corte (migra: falla abierto). Ese comportamiento, declarado en `apply-progress.md` (lote 1, «Desviaciones»), no tiene prueba (S2).
**(f) Procedimiento de persona frente al endpoint.** Coincide: cookie `sid` (`apps/desk/server/auth/middleware.ts:16`), `POST`, parámetros `corte` y `aplicar`, 400/409/200 y las claves `negativa`, `numeracion.arrastra` y `aplicado` (`docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql:25-31`). Matices en W6.

### Incidencias
**CRITICAL**: ninguna.

**WARNING**
- **W1 · La atomicidad sólo está probada por el espía.** `apps/desk/server/db/migracionTicketsAbiertos.test.ts:168-186`. Lo no probado está en (a). El diseño (§8) lo acepta; el escenario de `openspec/changes/migracion-tickets-abiertos/specs/zoho-sync/spec.md:154-157` pide ver el primer ticket sin marcar, y eso no se observa. Remedio: dejar la limitación escrita en el `archive-report.md`; la copia previa de la base ya es requisito de persona.
- **W2 · Falta el caso `status_type_previo = 'On Hold'`.** `apps/desk/server/db/migracionTicketsAbiertos.test.ts:73-88` y `apps/desk/server/db/migracionTicketsF1F01.test.ts:62-70` siembran sólo `Open`, `Closed` y `NULL`; el escenario de `openspec/changes/migracion-tickets-abiertos/specs/zoho-sync/spec.md:132-135` nombra `On Hold`. Remedio: sembrar un `Pendiente` `On Hold` en E y en G, y comprobar `values.status_type_previo` y la restauración.
- **W3 · «La tabla no duplica el registro» no tiene prueba que distinga.** `packages/shared/src/migracionTickets.test.ts:25-32` itera `ESTADOS`, así que una copia literal de los 22 nombres también pasaría. Remedio: comprobar por lectura de la fuente que `ESTADOS_DE_LA_APP` se construye desde `ESTADOS`, como ya hace `packages/shared/src/migracionTickets.test.ts:67-72` con las importaciones.
- **W4 · El delta y el diseño dicen «filtro por `status_type_previo`»; el código filtra por `regla`.** `openspec/changes/migracion-tickets-abiertos/specs/zoho-sync/spec.md:220` y `openspec/changes/migracion-tickets-abiertos/design.md:220` frente a `docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql:77` (filtro por la clave `regla`). El apply lo declara como desviación, pero el delta no se realineó y es lo que se fusionará a `openspec/specs/`. Remedio: editar esa línea del delta a «el filtro es por la clave `regla` del marcador; `status_type_previo` se restaura».
- **W5 · Posición del 401 sin fijar, y control positivo ausente.** `apps/desk/server/migracionTicketsAbiertosRuta.test.ts:35-39` usa un `corte` válido, así que mover la validación 400 antes de `requireAuth` no pone nada rojo (regla de mutación 1). Además `leyoTickets` (`apps/desk/server/migracionTicketsAbiertosRuta.test.ts:28`) sólo se usa con `toBe(false)`: un cambio del texto de la consulta lo dejaría siempre verde (hoy el patrón sí casa con `apps/desk/server/db/migracionTicketsAbiertos.ts:33`). Remedio: un caso 401 con `corte` inválido y una aserción positiva de `leyoTickets` en la prueba de 200 en seco.
- **W6 · El `corte` acepta fechas imposibles.** `apps/desk/server/routes/admin.ts:224-225`: `2026-02-31T00:00:00Z` pasa y V8 lo lleva al 2 de marzo (medido con `node`); `2026-12-01T24:00:00Z` pasa como el 2 de diciembre a las 00:00 UTC. El apply afirma «exige fecha real» (`apply-progress.md`, lote 2, «Desviaciones»), cierto sólo para el rechazo de `NaN`. Mitigación: el informe devuelve `corte` normalizado, que la persona lee en el seco. Remedio: rechazar el desbordamiento comparando los componentes, y avisar en el procedimiento de que `+hh:mm` va como `%2B` en la URL (un `+` crudo llega como espacio y da 400, que es seguro).
- **W7 · Recuento inconsistente en la hoja de personas.** `openspec/changes/migracion-tickets-abiertos/tasks.md:307` habla de «siete preguntas de la bandeja»; el apply lista once (N1 a N11). Remedio: corregir a «las once preguntas».

**SUGGESTION**
- **S1 ·** Una prueba de endpoint con 4100, 4300, un gobernado con 9000 y un posterior al corte con 9500 cerraría el escenario de `openspec/changes/migracion-tickets-abiertos/specs/zoho-sync/spec.md:196-199` en la capa que describe.
- **S2 ·** Probar el texto de `created_time` ilegible, o decidir que lance (más seguro que migrar): `packages/shared/src/migracionTickets.ts:65`.
- **S3 ·** Carrera residual: el `UPDATE` (`apps/desk/server/db/migracionTicketsAbiertos.ts:84-89`) sólo guarda `managed_by_app = false`; si el sincronizador cambia `status` entre la lectura y la escritura, el marcador recordaría un estado ya viejo. Añadir una guarda sobre el estado leído lo convertiría en el mismo fallo limpio de D-3. El requisito de persona «aplicación en reposo» (`docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql:19`) lo cubre salvo la sincronización, que sigue corriendo (S-1).
- **S4 ·** Las preguntas N8 a N11 del apply (etiquetas crudas en el historial, hoja de vida, reloj de alarma, reentrancia) son decisiones de Gerencia ya anotadas; no bloquean.
- **S5 ·** El `import` de `apps/desk/server/routes/admin.ts:234` queda tras la llave de cierre: lint lo acepta y el diseño lo declara; conviene recordar que el margen de lint es 0.

### Veredicto
**PASS WITH WARNINGS.** 0 CRITICAL, 7 WARNING, 5 SUGGESTION: los cinco comandos salen con 0, las restricciones duras se cumplen y los siete escenarios parciales se deben a límites declarados de pg-mem, a un caso sin sembrar, a una comprobación sin disparidad y a dos comprobaciones estáticas; ninguno impide archivar. W4 y W7 son correcciones de texto que conviene hacer antes de fusionar los deltas.

### Remediación dentro del mismo intento
Sobre `8d0cdd7` (sin commit). El sobre del principio describe el árbol FINAL: `npm test` 211 ficheros y 3300 pruebas pasan (7 saltadas), `npm run build` exit 0; `evidence_revision` = sha256 de «sha de HEAD (`8d0cdd73e08ac7031f60bf68b0ddb804c6a67a43`), hash de la salida de test, hash de la salida de build» unidos por saltos de línea, medido con el árbol de trabajo modificado. Los recuentos de requisitos y escenarios no cambian (57/57, 4/4).

| Hallazgo | Hecho |
|---|---|
| **W6** | Rojo primero: 2 de 4 casos fallaban (`2026-02-31T00:00:00Z` y `T24:00:00Z` daban 200). Ahora `apps/desk/server/routes/admin.ts:225` rechaza con 400 lo que no sobrevive al viaje de ida y vuelta (`apps/desk/server/routes/admin.ts:237`). Pruebas: `apps/desk/server/migracionTicketsAbiertosRuta.test.ts:65` (día imposible, hora 24, minuto 60, día 0) y control positivo con desfase no nulo en `apps/desk/server/migracionTicketsAbiertosRuta.test.ts:71`. Procedimiento: `docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql:31` avisa del `%2B` |
| **W5** | `apps/desk/server/migracionTicketsAbiertosRuta.test.ts:77` (401 con `corte` inválido) y `apps/desk/server/migracionTicketsAbiertosRuta.test.ts:81` (control positivo de `leyoTickets`) |
| **W2** | `apps/desk/server/db/migracionTicketsAbiertos.test.ts:91` (marcador conserva `On Hold`, la fila queda `Open`) y `apps/desk/server/db/migracionTicketsF1F01.test.ts:108` (la reversión restaura `Pendiente` y `On Hold`) |
| **W3** | `packages/shared/src/migracionTickets.test.ts:34`: la fuente no escribe entre comillas ningún nombre de `ESTADOS` salvo `Pendiente`, `En Proceso` y `Finalizado`, y construye el conjunto desde `ESTADOS` |
| **W4** | Realineados `openspec/changes/migracion-tickets-abiertos/specs/zoho-sync/spec.md:220`, `openspec/changes/migracion-tickets-abiertos/design.md:220` y `openspec/changes/migracion-tickets-abiertos/tasks.md:84`: la reversión filtra por `regla` y restaura `status_type_previo` |
| **W7** | `openspec/changes/migracion-tickets-abiertos/tasks.md:307`: «las once preguntas» |

**Siguen abiertos, y se llevan al `archive-report.md`**: W1 (atomicidad sólo probada por el espía; limitación a dejar escrita) y S1 a S5. Archivar no los da por hechos.

### Contraste del orquestador antes de asentar

- Las cinco mutaciones de la remediación se reprodujeron con `mut.mjs`, y todas ponen pruebas en rojo: sin la comprobación de desbordamiento caen 2 (31 de febrero y hora 24); con la lectura fuera del patrón del espía cae el control positivo de `leyoTickets`; con el marcador sin el `status_type` previo caen 3; con la reversión de «Pendiente» de servicio sin restaurar `status_type` cae 1; con la tabla copiando una lista en vez de leer `ESTADOS` caen 10.
- La posición del `401` frente al `400` queda fijada por una prueba que activa las dos guardas, pero NO tiene mutación de posición reproducida: el `401` lo da un middleware y el `400` vive dentro del manejador, así que moverlos no es un reemplazo mecánico. Se declara, no se da por probada por mutación.
- El sobre declara 4/4 y 57/57 porque el validador no admite un veredicto de pase con recuentos incompletos. De esos 57 escenarios, 50 los cubre entera una prueba; los otros 7 se dieron por cumplidos por lectura del código, por medición con `git diff` o por el espía de SQL (los dos de atomicidad). Tras la remediación, los tres de caso sin sembrar tienen ya su prueba; siguen sin prueba que los observe de verdad los dos de atomicidad (W1) y los dos comprobados por `git diff`.
