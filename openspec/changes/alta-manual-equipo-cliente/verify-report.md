```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:03631b725a21ee7fc58c573fa216516b42b7f3a792611d339ad7167ecd92bdde
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 10/10
scenarios: 44/44
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:ad020f5210b87681f39564f12783c1ed839f5aa3c0676b21a1550715cb2bb865
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:5d073224e7c8a075f54a3b94e4c4c883dcc8fbea5066933140ae0ee89bb18b23
```

## Verification Report

**Cambio**: `alta-manual-equipo-cliente` (F1B-15, `cierra: si`)
**Modo**: Strict TDD (`npm test`, vitest)
**Rama / commit verificado**: worktree `alta-manual-equipo-cliente`, HEAD `ba7547e` (lotes 1, 2a, 2b, 3 y 4 sobre la partida `cc76d98`). `evidence_revision` es el sha256 del texto del hash del árbol de `ba7547e` (`bed1caedf6571997fff9c05bcdca5d107d674fb6`).
**Veredicto**: **PASS WITH WARNINGS** — 0 CRITICAL, 7 WARNING, 8 SUGGESTION

### Completitud

| Métrica | Valor |
|---|---|
| Tareas con casilla (1.1-1.13, 2.1-2.9b, 3.1-3.10, 4.0-4.5) | todas marcadas `[x]`; 0 incompletas |
| Instrucción para `archive` (`openspec/changes/alta-manual-equipo-cliente/tasks.md:123`, sin casilla) | 1 |
| Requisitos de los deltas (líneas que empiezan por `### ` en los cuatro `spec.md`) | **10** (tickets-core 5, hojas-vida 3, transitions-st 1, zoho-sync 1) |
| Escenarios de los deltas (líneas que empiezan por `#### Scenario`) | **44** (tickets-core 23, hojas-vida 11, transitions-st 7, zoho-sync 3) |
| Cifra de la matriz de `tasks.md` | «43 escenarios, 10 requisitos» (`openspec/changes/alta-manual-equipo-cliente/tasks.md:134`): los requisitos cuadran, los escenarios no (W-1) |

### Build y pruebas (ejecutadas por mí en el worktree, árbol limpio en `ba7547e`)

| Comando | Resultado |
|---|---|
| `npm test` | exit 0 · **176 ficheros pasan, 1 omitido (177)** · **2543 pruebas pasan, 2 omitidas (2545)**, 0 rojas · coincide con `apply-progress.md:207` |
| `npm run typecheck` | exit 0, sin diagnósticos |
| `npm run lint` | exit 0 · **165 problemas (0 errores, 165 avisos)** · en el techo, 0 nuevos |
| `npm run build` | exit 0 · `✓ built in 3.93s` |
| `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` (la orden de `openspec/changes/alta-manual-equipo-cliente/tasks.md:56`) | exit 0 · **0 bloqueantes** · comprobadas 4473 · línea base 0 · cabeceras R-1 inválidas 0 · 13 abreviadas rotas informativas (3 son de `exploration.md` de este cambio, S-6) |
| Cobertura | no ejecutada: la orden de verify no la pedía; sin cifra por fichero |

Ficheros de prueba del cambio, resultado de esta ejecución: `apps/desk/server/services/altaManual.test.ts` 40 · `apps/desk/server/routes/altaManual.test.ts` 28 · `apps/desk/server/services/clientes.test.ts` 14 · `apps/desk/server/db/ticketsConCliente.test.ts` 4 · `apps/desk/server/lectoresProvisionales.test.ts` 4 · `packages/shared/src/altaManual.test.ts` 16 · `packages/zoho-sync/src/db/migrate.test.ts` 49 (5 nuevas, `:695`) · `apps/desk/server/services/ticketService.test.ts` 110 (8 nuevas, `:1188`). Todas verdes.

### Cumplimiento de escenarios (prueba que lo cubre, pasada en esta ejecución)

Abreviaturas, todas con la línea del `it(` abierta y leída: **SA** = `apps/desk/server/services/altaManual.test.ts` · **RA** = `apps/desk/server/routes/altaManual.test.ts` · **CL** = `apps/desk/server/services/clientes.test.ts` · **TS** = `apps/desk/server/services/ticketService.test.ts` · **MG** = `packages/zoho-sync/src/db/migrate.test.ts` · **SH** = `packages/shared/src/altaManual.test.ts`.

| # | Escenario | Prueba (fichero y línea) | Qué afirma (leído) | Estado |
|---|---|---|---|---|
| **RQ-TC-30** | | | | |
| 1 | Alta con cliente provisional | SA 35 | `201`; fila con razón social, NIT, motivo, autor, `enlazado_a` nulo; `client_id` del ticket = id; traza | ✅ («cuándo»: S-7) |
| 2 | Faltan datos del cliente | SA 59 | `422`, el mensaje contiene NIT y correo y no «razón social»; nada escrito | ✅ |
| 3 | Motivo vacío | SA 68 | `422` con «motivo»; nada escrito | ✅ |
| 4 | El NIT ya está en Books | SA 327 | `409`, `candidatos` = `[{ id, name }]`, nada escrito | ✅ |
| 5 | Dos contactos comparten el NIT | SA 347 | `409` con tres candidatos, nombre y luego id, insertados en orden inverso | ✅ |
| 6 | El id provisional no se confunde | SA 84 (+ SA 75, SH 5) | prefijo `prov-`, único por llamada, ausente de `books.contacts` | ✅ |
| **RQ-TC-31** | | | | |
| 7 | Ticket con las dos marcas | SA 35 | `Ticket creado`, `pendiente_validar` verdadero, `clienteProvisional` en la respuesta | ✅ |
| 8 | Soporte remoto nace en su fase | SA 51 | `Solicitud Soporte`, equipo pendiente, un provisional | ✅ |
| 9 | Un fallo no deja nada a medias | SA 279 | `BEGIN`…`ROLLBACK`, sin `COMMIT`, cuatro `INSERT` dentro | ⚠️ por verbos, no por estado final (W-2) |
| 10 | Posición de la unicidad de la OV | SA 231 (control SA 238) | serial distinto + OV usada → `422` y no `409`; el control da `409` | ✅ |
| **RQ-TC-32** | | | | |
| 11 | Enlace correcto | RA 40 | `200`; dos tickets y equipo a `c1`; provisional con autor y fecha; fila `clientId` | ✅ |
| 12 | Sin permiso | RA 62 | `403`, `client_id` sin cambio, sin traza | ✅ |
| 13 | Fallo a mitad | RA 125 | `500`, `BEGIN`…`ROLLBACK`, sin `COMMIT` | ⚠️ por verbos (W-2) |
| 14 | Contacto de Books inexistente | RA 70 | `404`, nada escrito | ✅ |
| 15 | Doble enlace | RA 81 | `409`, el primero se conserva, una sola traza | ✅ |
| **RQ-TC-33** | | | | |
| 16 | Ninguna salida hacia Zoho | SA 310, RA 154, RA 217 | espías de Zoho y de `sync` en cero en los tres flujos; ninguna escritura a `books.*` en alta y enlace (en validación sólo se cuenta Zoho) | ✅ |
| **RQ-TC-34** | | | | |
| 17 | La búsqueda devuelve provisionales marcados | CL 21 (+ CL 114) | Books `false`, provisional `true` | ✅ |
| 18 | Un provisional enlazado no se lista | CL 42 | `[]` por su razón social; el contacto sale con `false` | ✅ |
| 19 | La ficha de un provisional | CL 51 (+ CL 126) | cinco datos y `provisional: true`; por HTTP `200` | ✅ |
| 20 | La ficha de un id de Books no cambia | CL 58 | igual a `getClient` más `provisional: false` | ✅ |
| 21 | Un id inexistente sigue siendo 404 | CL 71 (+ CL 126) | `null` y `404` | ✅ |
| 22 | El listado muestra el nombre del provisional | `apps/desk/server/db/ticketsConCliente.test.ts` 27 (+ 30) | nombre y marca; el de Books igual que antes | ✅ (nivel de envoltorio, S-8) |
| 23 | Prioridad de Books | CL 76 (triangulación CL 88) | cero consultas a `clientes_provisionales` para un id de Books; el provisional sí consulta, tras Books | ✅ |
| **RQ-HV-16** | | | | |
| 24 | Serial que no coincide | SA 101 | `422` con «serial»; nada escrito | ✅ |
| 25 | Serial existente | SA 114 | ticket al `eq-x`, `equipos` sin filas nuevas, sin traza | ✅ |
| 26 | Modelo no catalogado | SA 123 | texto conservado, pendiente, traza `altaManual` con el motivo | ✅ |
| 27 | Modelo no catalogado sin texto | SA 131 | `422`, nada escrito | ✅ |
| **RQ-HV-17** | | | | |
| 28 | Cada campo reservado se rechaza | SA 154 (`it.each`, 3 casos) | `422` con «Comercial», nada escrito, por campo | ✅ |
| 29 | Comercial tampoco | SA 165 | `422` con sesión de Comercial | ✅ |
| 30 | Después se completan por el PATCH | SA 195 | `200` y fila `finGarantia` en el registro | ✅ |
| **RQ-HV-18** | | | | |
| 31 | Validación correcta | RA 172 | `200`, marca fuera, fila `pendiente` → `validado` con autor | ✅ |
| 32 | Sin permiso | RA 181 | `403`, sigue pendiente, sin traza | ✅ |
| 33 | No catalogado se valida sin catálogo | RA 188 | `200`, modelo y `modelo_id` intactos | ✅ |
| 34 | Equipo ya validado | RA 194 | `409`, sin traza | ✅ |
| **RQ-TS-32** | | | | |
| 35 | Cliente provisional bloquea | TS 1205 | `422` nombra el cliente y no el equipo; estado intacto | ✅ (con ADMIN, S-4) |
| 36 | Equipo pendiente bloquea | TS 1214 | `422` nombra el equipo y no el cliente | ✅ |
| 37 | Ambos se nombran juntos | TS 1222 | un `422` con los dos | ✅ |
| 38 | Tras enlazar y validar, pasa | TS 1230 | estado `Ingresado` | ✅ |
| 39 | Posición frente al permiso (P1) | TS 1250 | `403`, no `422` | ✅ |
| 40 | Posición frente a los obligatorios (P2) | TS 1257 | `422` de lo pendiente, `errors` indefinido | ✅ |
| 41 | Soporte remoto no se bloquea | TS 1236 | `asignacion_soporte` avanza a `En Proceso` con provisional y equipo pendiente | ✅ (S-4) |
| **RQ-ZS-16** | | | | |
| 42 | Guardianes de migración en verde | MG 266 (+ MG 282, MG 374, MG 703) | clasificación calificada, 40 tablas, 44 `ALTER`, `PUBLIC_TABLES` | ✅ |
| 43 | Una `CREATE` sin calificar se rechaza | MG 266 y MG 731 sobre el fichero real | el rojo ante la `CREATE` sin `public.` lo demuestra la mutación m1 (`apply-progress.md:16`), no un fixture | ✅ (S-3) |
| 44 | La vista de clientes queda intacta | MG 740 | texto idéntico al de `132d25f`, sin «provisional» | ✅ (más la prueba por `git diff` de abajo) |

**Resultado: 44/44 con prueba que pasó hoy; 2 de ellas (9 y 13) lo hacen por un sustituto declarado.** Ninguno de los 44 depende sólo de un `.tsx`.

#### Cláusulas de requisito sin escenario cuyo cumplimiento es `.tsx` (sin red de pruebas por decisión, F0-00, `vitest.config.ts:16-20`)

| Cláusula | Cliente | Línea del servidor que la impone (regla 13) |
|---|---|---|
| RQ-HV-18: la hoja de vida muestra el aviso y la acción de validar sólo a quien puede | `apps/desk/src/components/HojaDeVida.tsx:206` → `apps/desk/src/components/AltaManual.tsx:132` | `403` y `409` de `apps/desk/server/routes/altaManual.ts:47` y `:48`; la marca llega al cliente por `apps/desk/server/db/equipos.ts:115` y `:165`, probado en `apps/desk/server/routes/altaManual.test.ts:268` |
| RQ-TS-32: el botón es sólo comodidad | `apps/desk/src/components/TransitionPanel.tsx:70` | `apps/desk/server/services/ticketService.ts:258`, llamada en la cola de `:131` |

### RQ-TC-30 tras `8cb209a`, cláusula por cláusula

`git show 8cb209a` cambia tres cosas del requisito: los faltantes del cliente provisional pasan a **escalón A**; el `409` devuelve **uno o más candidatos** `{ error, candidatos: [{ id, name }] }`; y fija el contrato del cuerpo en `design.md`.

| Cláusula del texto | Prueba | Estado |
|---|---|---|
| Fila con marca pendiente, quién, cuándo y motivo | SA 35 (quién, motivo, pendiente); «cuándo» sólo en el esquema, `packages/zoho-sync/src/db/migrate.test.ts:717` | ✅ con S-7 |
| `client_id` del ticket = id del provisional | SA 35 | ✅ |
| El id no puede coincidir con el de Books | SA 84, SA 75, SH 5 | ✅ (por prefijo; la prueba compara con un solo contacto) |
| Cinco datos y motivo obligatorios; `422` los lista todos, sin escribir | SA 59 (NIT y correo juntos), SA 68 (motivo) | ✅; razón social, contacto y teléfono sin prueba propia (S-1) |
| Es escalón **A**, no C | SA 385 (posición) | ✅ |
| La validez (provisional con `clientId` u OV) sigue en C | SA 205, SA 212 | ✅ |
| No son los «obligatorios» de C (`:88`) | el mensaje propio («Faltan datos del cliente provisional») sólo se afirma en SA 385 | ✅ implícito |
| Puede hacer el alta quien hoy puede crear tickets (Q1) | `apps/desk/server/routes/tickets.ts:124` no tiene guarda; **ninguna** prueba hace un alta manual `201` con un usuario no administrador | ⚠️ S-7 |
| No escribe en `books.*` ni hacia Zoho | SA 310 | ✅ |
| `409` si el NIT está en Books, comparado sin puntos, espacios ni DV | SH 40, SH 46, SH 52; HTTP SA 327 y SA 347 («900 123 456») | ✅ |
| Cuerpo `{ error, candidatos }`, uno o más, nombre y luego id | SA 331-332 (uno), SA 351-353 (tres, orden inverso) | ✅ |
| Escalón D, sin escribir nada | SA 333, SA 354; posición frente a C en SA 367 y frente a la OV en SH 77 | ✅ |
| «Ningún NIT genérico exento» es supuesto reversible | SA 347 fija «todos»; no hay prueba de exención, correcto | ✅ |

**Posición de la tarea 4.0 (regla de mutación 1), leída en el fichero real:** el `422` de A es `exigirClienteProvisional` en `apps/desk/server/services/ticketService.ts:28` y el de C es `validarContenidoAltaManual` en `apps/desk/server/services/ticketService.ts:91`; A va antes. La prueba `apps/desk/server/services/altaManual.test.ts:388` manda un `clienteManual` sin NIT **y** un serial `ABC123`/`ABC124` en la misma petición (líneas 389-390), así que **las dos guardas se activan a la vez**; afirma que el `422` contiene «Faltan datos del cliente provisional», que **no** contiene «serial» (los dos son `422`, se distinguen por el texto) y que no se escribió nada. **No reproduje la mutación** (mover la línea 28 detrás de la 91 de `ticketService.ts`): la verificación es por lectura; el rojo lo declara `apply-progress.md:170` y yo no lo comprobé.

### Evidencia E-152: la vista `public.clients` no cambió

La vista está definida en `packages/zoho-sync/src/db/schema.sql:169-173` (única definición: la búsqueda de `VIEW public.clients` da ese fichero y la copia literal de `packages/zoho-sync/src/db/migrate.test.ts:697`).

| Orden ejecutada | Salida |
|---|---|
| `git diff cc76d98 ba7547e -- packages/zoho-sync/src/db/schema.sql` | un solo hunk, `@@ -652,3 +652,25 @@`: +22 líneas **al final** (`CREATE TABLE IF NOT EXISTS public.clientes_provisionales` en `:658` y `ALTER TABLE equipos ADD COLUMN IF NOT EXISTS pendiente_validar boolean` en `:676`). Ningún hunk toca `:169-173` |
| `git show cc76d98:packages/zoho-sync/src/db/schema.sql` con `sed -n 169,173p` y `sha1sum` | `22109bfda828adf0e7744c5e9446002cfc8127fe` |
| `git show ba7547e:packages/zoho-sync/src/db/schema.sql` con `sed -n 169,173p` y `sha1sum` | `22109bfda828adf0e7744c5e9446002cfc8127fe` (idéntico) |
| `git ls-files` filtrado con `grep -i bookshub` | 14 ficheros, todos bajo `packages/zoho-sync/src/booksHub/` (`mappers`, `migrate`, `repo`, `salesRecords`, `schedule`, `sweep`, `sync`, sus pruebas y `schema-books.sql`) |
| `git diff --stat cc76d98 ba7547e -- packages/zoho-sync/src/books/ apps/hub-sync/` | vacía, exit 0 |
| `git diff --stat cc76d98 ba7547e -- packages/zoho-sync/src/booksHub/` | vacía, exit 0 |
| `git diff --name-only cc76d98 ba7547e -- packages/zoho-sync/src/booksHub packages/zoho-sync/src/books apps/hub-sync` contado con `wc -l` | `0` |

Además `packages/zoho-sync/src/db/migrate.test.ts:740` compara la vista con el texto de `132d25f` y pasó. **E-152 cumplido.**

### Alcance añadido a mitad: `pendienteValidar` en la ficha del equipo (lote 4)

- **Ruta real:** `apps/desk/server/db/equipos.ts:115` (`toFull`) y `:165` (`SELECT_EQUIPO_FULL`); **no** existe `packages/zoho-sync/src/db/equipos.ts`.
- **Requisito que lo cubra:** ninguno lo nombra. Lo más cercano es la última frase de RQ-HV-18: «La hoja de vida **SHALL** mostrar el aviso de pendiente mientras dure la marca y la acción de validar sólo a quien puede usarla». Esa frase obliga a la interfaz, no a que `GET /api/equipos/:id` ni `/historial` devuelvan el campo: es una dependencia implícita. Ni escenario, ni `design.md`, ni `proposal.md` mencionan la ficha completa del equipo con la marca (`design.md:194` sólo lista el tipo).
- **Constancia:** sólo `apply-progress.md:164` («Supuesto reversible: es alcance mínimo del lote 4»). Lo cubre una prueba (`apps/desk/server/routes/altaManual.test.ts:268`), pero está **sin requisito**. Hallazgo W-3; verify no edita ninguna spec.

### Supuestos reversibles (CLAUDE.md, «Regla de ejecución»: en la propuesta y en el parte)

Búsqueda: «supuesto» e «hipótesis» sobre la carpeta del cambio y sobre el diff `cc76d98..ba7547e` de `apps/` y `packages/`. `proposal.md:61-70` sólo recoge Q1-Q4; ninguno de los demás está en la propuesta.

| Supuesto | Dónde está escrito | En `proposal.md` |
|---|---|---|
| Q1 alta manual = quien crea tickets; Q2 cinco datos; Q3 soporte remoto no bloquea; Q4 validar sin catálogo | `openspec/changes/alta-manual-equipo-cliente/proposal.md:63-68` | ✅ |
| **Orden del enlace**: un `contactId` ausente o con prefijo no se busca en Books, su `422` queda en C | `apply-progress.md:131`; código `apps/desk/server/routes/altaManual.ts:24-25`; coherente con D10 (`design.md:37`), que no lo llama supuesto | ❌ |
| **Validar con `false`** (no `NULL`) | `apply-progress.md:133`; código `apps/desk/server/routes/altaManual.ts:50` | ❌ (ni en `design.md`) |
| **Todos los candidatos** en el `409`, ningún NIT genérico exento | `design.md:159-162`, `openspec/changes/alta-manual-equipo-cliente/specs/tickets-core/spec.md:22-24`, `apply-progress.md:86`, `apps/desk/server/services/altaManual.ts:156`; abierta como E-154 (`docs/sdd/ENTRADA.md:1761`) | ❌ |
| **DV pegado**: «9001234567» sólo casa con «900.123.456-7» | `tasks.md:93`, `design.md:149-150`, `packages/shared/src/altaManual.ts:38-42`; `design.md:278` lo cuenta como «normalización del NIT» | ❌ |
| **Lectura de Books**: recorrido completo de `clients`, decisión en JS; coste «Hipótesis SIN MEDIR», se mide en F1F-03 | `design.md:152-156`, `apply-progress.md:85`, `apps/desk/server/db/clientesProvisionales.ts:66` | ❌ (ni en `design.md:278`) |
| Guarda del NIT vacío en `nitCoincide` | `design.md:163-165`, `apply-progress.md:82` | ❌ |
| `pendienteValidar` en la ficha del equipo (alcance mínimo) | `apply-progress.md:164` | ❌ (ni en `design.md` ni en los deltas) |
| Parámetro `provisionales=1` (D13) y marca en `mappers.ts` | `design.md:40`, `design.md:92`, `design.md:278` | ❌ |
| Bloques manuales sólo se muestran y mandan si siguen válidos; el serial doble avisa y no bloquea; «Enlazar» no pide provisionales; un provisional sin enlazar elegido va como cliente de Books | `apply-progress.md:177-181` | ❌ |
| Forma del cuerpo del alta y faltantes del cliente en A | `apply-progress.md:65-66`; los fija después `8cb209a` (spec y `design.md`) | ❌ (resuelto en la spec) |

**«El parte»** (documento de seguimiento por corte) no es un fichero de este cambio: no puedo comprobar desde el worktree que los supuestos estén anotados allí. Queda a cargo de quien lo escribe. Hallazgo W-4.

### Tareas de persona (regla del ciclo 1; `openspec/changes/alta-manual-equipo-cliente/tasks.md:126-132`)

| Tarea | Dueño | Destino | Juicio |
|---|---|---|---|
| Q1/Q2 (Anexo D nº 83) | Gerencia | `openspec/config.yaml` → `decisiones_de_gerencia` | ✅ fichero y clave concretos. Q3 y Q4 (`proposal.md:66-68`, `:74`) **no están** en esta tabla |
| P-A (aviso a Comercial cuando un contacto de Books comparta NIT con un provisional sin enlazar) | Gerencia | `design.md` §4.6 → entrada nueva de `docs/sdd/ENTRADA.md` al archivar (`tasks.md:123-124`) | ✅ concreto y con su instrucción para `archive` |
| Verificación en la app tras desplegar (alta manual, enlace, validación, «Habilitar Servicio») | Persona de Comercial | «`docs/sdd/` parte de verificación» | ⚠️ **no es un fichero**; sin fecha ni nombre. Los precedentes la ubican en `docs/sdd/Paquete_de_Despliegue_<fecha>.md`, §6.x |

**¿Qué es E-154?** En el worktree, `docs/sdd/ENTRADA.md:1761` es «F1B-15: NIT genéricos que no deben bloquear el alta manual», **abierta**, dueño Gerencia, destino `design.md` §4.6; la cita `apps/desk/server/services/altaManual.ts:156` es correcta. **No es la verificación en la app.** En el `ENTRADA.md` del repositorio principal el último es E-153 (comprobado). **Ninguna entrada de `ENTRADA.md` registra la verificación en la app**; no se inventa una, y el destino de esa tarea de persona sigue sin concretar (W-5).

### Casilla de la regla 13 del lote 4 (`apply-progress.md:183-200`)

Doce filas (`apply-progress.md:186-198`): cada decisión del cliente lleva una línea del servidor, salvo la última, declarada presentación sin imposición. **Comprobadas por mí contra el árbol de `ba7547e`:**

| Fila | Línea citada | Lo que hay en esa línea | Juicio |
|---|---|---|---|
| Bloquea los cinco datos y el motivo | `apps/desk/server/services/altaManual.ts:45` | `:45` calcula `faltan`; el `throw` `422` es `:46` | ✅ con desfase de una línea (S-5) |
| Serie, repetición, modelo y motivo del equipo manual | `apps/desk/server/services/altaManual.ts:63-70` | los `push` de faltantes del equipo | ✅ |
| Avisa si la serie difiere | `apps/desk/server/services/altaManual.ts:104` | `422` «El serial y su confirmación no coinciden» | ✅ |
| Oculta campos comerciales | `apps/desk/server/services/altaManual.ts:106` y `:72` | filtro de reservados y fecha obligatoria en «Equipo nuevo» | ✅ |
| Cliente manual con cliente elegido o con OV | `apps/desk/server/services/altaManual.ts:115` y `:116` | los dos `422` de C | ✅ |
| Ofrece los candidatos del `409` | `apps/desk/server/services/altaManual.ts:158`, `apps/desk/server/services/ticketService.ts:90` | `errorNitEnBooks`; `:89` resuelve el cliente y `:90` lo rechaza si falta | ✅ con desfase de una línea (S-5) |
| Reutiliza el equipo con serie existente | `apps/desk/server/services/altaManual.ts:78` | `getEquipoBySerial` | ✅ |
| «Enlazar» y «Validar» sólo a Comercial o admin | `apps/desk/server/routes/altaManual.ts:31`, `:47`, `:48`, `:27`, `:34` | `403`, `409`, `404`, `422` | ✅ |
| Desactiva «Habilitar Servicio» | `apps/desk/server/services/ticketService.ts:258`, cola `:131` | `exigirAltaValidada` | ✅ |
| Buscador con `provisionales=1` | `apps/desk/server/routes/directory.ts:16` | `buscarClientes` con `req.query.provisionales === '1'` | ✅ |
| `pendienteValidar` hasta el cliente | `apps/desk/server/db/equipos.ts:115` y `:165` | propiedad y columna | ✅ |

**La casilla está completa.** Ninguna decisión del cliente queda sin línea de servidor.

### Cumplimiento TDD (strict)

| Comprobación | Resultado | Detalle |
|---|---|---|
| Evidencia TDD reportada | ✅ | tablas «Ciclo TDD» por lote en `apply-progress.md:6`, `:42`, `:73`, `:116`, `:158` |
| Todas las tareas con prueba | ✅ | lotes 1-3 con prueba nueva; lote 4: servidor con 2 pruebas, `.tsx` fuera de la red por F0-00 |
| RED confirmada | ✅ | los ficheros de prueba existen y corren; los rojos se anotan con su mensaje |
| GREEN confirmada | ✅ | 2543 pasan hoy |
| Triangulación | ✅ en general | el `409` con 1 y 3 candidatos, el vacío por cada lado, P1 y P2 |
| Red de seguridad de ficheros modificados | ⚠️ | sólo el lote 2a registra una fila (`apply-progress.md:44`); los demás no (W-6) |
| Pruebas que nacen verdes | ⚠️ | 2b: 6 (`:76`); lote 3: 4 + 6 por razón equivocada (`:119-120`); lote 4: 1 (`:160`). Cubiertas con mutación y declaradas con honestidad |

### Capas de prueba

| Capa | Pruebas | Ficheros | Herramienta |
|---|---|---|---|
| Unidad (dominio puro) | 16 | 1 (`packages/shared/src/altaManual.test.ts`) | vitest |
| Integración HTTP o de base contra pg-mem | 103 (90 en cinco ficheros enteros, 8 de `ticketService.test.ts` y 5 de `migrate.test.ts`) | 7 | vitest + supertest + pg-mem |
| UI / E2E | 0 | 0 | fuera de la red por decisión de Gerencia (F0-00); no se propone |

### Calidad de aserciones (paso 5f)

0 tautologías, 0 bucles fantasma (los dos `for` de `apps/desk/server/routes/altaManual.test.ts:94` y `apps/desk/server/services/altaManual.test.ts:141` recorren arreglos literales), 0 `vi.mock`. Vacíos huérfanos revisados: los `[]` de SA 292, SA 316 y CL 45 tienen contrapartida no vacía (SA 315, SA 84, CL 46). **Un caso débil:** `apps/desk/server/services/ticketService.test.ts:1247` espera `[]` sin afirmar que el espía capturó consultas (S-2). `apps/desk/server/routes/altaManual.test.ts:175` usa `.not.toBe(true)`, aceptable porque la traza de la línea siguiente fija el valor.

### Incidencias

#### CRITICAL
Ninguna.

#### WARNING

| ID | Hallazgo | Evidencia |
|---|---|---|
| W-1 | **Cifra de escenarios desfasada.** La matriz dice 43; los deltas tienen 44. Sobra uno: «Dos contactos de Books comparten el NIT», añadido a RQ-TC-30 por `8cb209a` después de escribir la matriz; la fila RQ-TC-30 (`tasks.md:140`) no lo nombra. Requisitos: 10, cuadran | `openspec/changes/alta-manual-equipo-cliente/tasks.md:134`, `:140` |
| W-2 | **Dos escenarios de «fallo a mitad» se prueban por la secuencia de verbos, no por el estado final** (pg-mem no revierte un `ROLLBACK`). No se afirma «los tickets conservan el id provisional» ni «sin filas nuevas». Los propios ficheros lo declaran | `apps/desk/server/services/altaManual.test.ts:246`, `:279`; `apps/desk/server/routes/altaManual.test.ts:125`, `:149` |
| W-3 | **`pendienteValidar` en la ficha del equipo no tiene requisito ni escenario** (sólo la dependencia implícita de la última frase de RQ-HV-18); su único registro es `apply-progress.md:164`. Para `archive`: o el delta de `hojas-vida` lo recoge, o se anota que lo cubre RQ-HV-18 | texto de RQ-HV-18 citado arriba |
| W-4 | **Supuestos reversibles ausentes de `proposal.md`**: orden del enlace, validar con `false`, todos los candidatos, DV pegado, lectura de Books, NIT vacío, `pendienteValidar` y los de interfaz. `proposal.md:61-70` sólo lleva Q1-Q4, y `design.md:278` sólo añade D13, `mappers.ts` y la normalización. La «Regla de ejecución» exige propuesta **y** parte | tabla de supuestos |
| W-5 | **Tarea de persona sin destino concreto** («`docs/sdd/` parte de verificación») y **sin entrada en `ENTRADA.md`**; E-154 es otra cosa. Además faltan Q3 y Q4 en la tabla de personas | `tasks.md:132`, `docs/sdd/ENTRADA.md:1761`, `proposal.md:66-68` |
| W-6 | **Formato TDD incompleto**: las tablas de `apply-progress.md` no tienen columnas de triangulación ni de red de seguridad, y la red de seguridad sólo se registra en 2a. Siete pruebas nacen verdes sin rojo previo (todas con mutación) | `apply-progress.md:44`, `:76`, `:119-120`, `:160` |
| W-7 | **Cita errónea del propio cambio**: `design.md:194` dice que `clienteProvisional?` está en la línea 99 de `types.ts`; esa línea es `accountName?` del ticket crudo de Zoho, y el campo está en `packages/shared/src/types.ts:8`. `apply-progress.md:26` dice haber corregido `design.md:92` y `tasks.md:49`, pero esta fila quedó sin tocar. El detector no la caza (la cita va en forma abreviada) | `openspec/changes/alta-manual-equipo-cliente/design.md:194` |

#### SUGGESTION

| ID | Hallazgo |
|---|---|
| S-1 | Razón social, contacto y teléfono faltantes no tienen prueba individual (SA 59 cubre NIT y correo; SA 68 el motivo). El código es un solo filtro (`apps/desk/server/services/altaManual.ts:45`), así que el riesgo es bajo |
| S-2 | `apps/desk/server/services/ticketService.test.ts:1247` pasa trivialmente si el espía no se usa: añadir una aserción de que `sqls` no está vacío |
| S-3 | Escenario 43: no hay fixture que ensucie `schema.sql` con una `CREATE` sin calificar (sí lo hay para `ALTER`, `packages/zoho-sync/src/db/migrate.test.ts:405`); lo cubre la mutación m1 |
| S-4 | RQ-TS-32 se prueba con `ADMIN` (TS 1205, TS 1214, TS 1222) aunque el escenario dice Comercial; en soporte remoto (TS 1236) no se afirma que «la marca sigue visible» |
| S-5 | Desfases de una línea en la casilla de la regla 13: `apps/desk/server/services/altaManual.ts:45` (el `throw` es `:46`) y `apps/desk/server/services/ticketService.ts:90` (resuelve `:89`, rechaza `:90`) |
| S-6 | Tres abreviadas rotas informativas son de `openspec/changes/alta-manual-equipo-cliente/exploration.md` (líneas 68, 68 y 71): conviene repararlas antes de archivar |
| S-7 | Sin prueba de un alta manual `201` con un usuario no administrador (Q1); «cuándo» del provisional sólo se afirma en el esquema (`packages/zoho-sync/src/db/migrate.test.ts:717`), no en SA 35 |
| S-8 | Sin prueba de que `equipoId` gane a `equipoManual` (`apply-progress.md:178`); y el escenario 22 se prueba en el envoltorio de `apps/desk/server/db/ticketsConCliente.ts`, no por `GET /api/tickets` |

### Coherencia con el diseño

| Decisión | Código | Juicio |
|---|---|---|
| D1 tabla propia calificada, al final de `schema.sql` | `packages/zoho-sync/src/db/schema.sql:658` | ✅ |
| D5 `ALTER` de `equipos` sin calificar | `packages/zoho-sync/src/db/schema.sql:676` | ✅ |
| D7 faltantes en A, validez en C | `apps/desk/server/services/ticketService.ts:28` y `:91` | ✅ |
| D10 enlace: `UPDATE … WHERE enlazado_a IS NULL RETURNING` en una transacción | `apps/desk/server/db/clientesProvisionales.ts:90-94` | ✅ |
| P-B: NIT antes que OV en D | `apps/desk/server/services/ticketService.ts:96`; `primerConflictoUnicidad` en `packages/shared/src/altaManual.ts:63` | ✅ |
| Lógica nueva en módulos propios, sin insertar líneas en `ticketService.ts` | `git diff --numstat cc76d98 ba7547e` da 31 inserciones y 17 borrados: neto +14, la función final de `:251-264`; el resto edita la misma línea (`apply-progress.md:141`) | ✅ |

### Barrido de citas (regla de mutación 4)

El detector sobre `HEAD` da 0 bloqueantes (arriba). Esta verificación no inserta ni borra líneas de ningún fichero citado: sólo añade este informe.

### Próximo paso

`sdd-archive`, tras decidir W-3 y W-5 (de persona o de redacción, no de código). Al archivar, según `tasks.md:123-124`: quitar `F1B-15` de «en curso» en `apps/desk/server/reconciliacion/registro.test.ts:220`, registrar P-A como entrada de `docs/sdd/ENTRADA.md`, y aplicar sobre §3.8 de `transitions-st` lo que indica el delta (`openspec/changes/alta-manual-equipo-cliente/specs/transitions-st/spec.md:51-63`). Archivar no da por hechas las tareas de persona.

### Medida del intento de verify

Medida al escribir el informe, contra `ba7547e`: `git diff --shortstat --no-renames` sin cambios en seguimiento (vacío) y un solo fichero nuevo sin trackear, este `verify-report.md`, de 286 líneas con `wc -l`. Total del intento: 286 líneas, sin binarios. Verify no modifica ningún otro fichero.

## Adenda del 2026-10-02 — lo que se cerró después del verify (el veredicto de arriba no cambia)

Registro fechado: el veredicto, los hallazgos y las cifras de arriba son los de `51157f2` y no se reescriben.

**Cerrado después del verify**

| Hallazgo | Cómo se cerró | Commit |
|---|---|---|
| W-3 | La prueba de `:268` sólo sembraba `null`; la mutación `?? undefined` en `apps/desk/server/db/equipos.ts:115` sobrevivía (28/28). Prueba nueva por el flujo real (validar y releer), `apps/desk/server/routes/altaManual.test.ts:280`: nace verde, declarado, y la mutación la pone roja en la ficha y en el historial. Intento 8 del registro, 19 líneas | `099d11f` |
| W-3 | Requisito RQ-HV-19 con tres escenarios en `specs/hojas-vida/spec.md`: el campo sólo viene cuando vale `true`; validado o nunca pendiente, **ausente**, no `false` | commit documental de esta adenda |
| W-4 | Sección «Supuestos reversibles aplicados durante la construcción» al final de `proposal.md`: siete supuestos, con dónde están escritos y si son reversibles | commit documental de esta adenda |
| W-5 | Destino de la verificación en la app (`tasks.md:132`): «§6 (tareas de persona) del próximo paquete de despliegue que incluya F1B-15; hasta entonces, queda escrita en esta tabla». No se abre entrada en `docs/sdd/ENTRADA.md`; E-154 sigue aparte, porque es decisión de Gerencia y no una verificación | commit documental de esta adenda |
| W-1 | Matriz de `tasks.md:134`: 45 escenarios y 11 requisitos (44 y 10 verificados aquí, más RQ-HV-19) | commit documental de esta adenda |
| W-7 | `design.md:194`: `clienteProvisional?` apunta a `:8` de `packages/shared/src/types.ts` (caso A de la regla de mutación 4) | commit documental de esta adenda |

**Queda anotado para el `archive-report`**

| Punto | Qué tiene que recoger |
|---|---|
| W-2 | Los dos «fallo a mitad» (TC-31 y TC-32) se prueban por la secuencia de verbos, no por el estado final, porque pg-mem no revierte un `ROLLBACK` |
| W-6 | Formato TDD incompleto en `apply-progress.md` y siete pruebas que nacen verdes, todas con mutación |
| §3.8 de `transitions-st` | Añadir las guardas nuevas a la tabla de escalones y a la fila `createManagedTicket` de la tabla de puertas, como pide el delta (`specs/transitions-st/spec.md:51-63`) |
| F1F-03 | La lectura de todo Books es hipótesis sin medir y se mide con el volumen real en F1F-03 (`design.md:152-156`) |
| E-154 | NIT genéricos exentos: abierta, es decisión de Gerencia (`docs/sdd/ENTRADA.md:1761`) |
