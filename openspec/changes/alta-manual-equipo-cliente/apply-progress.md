# Apply-progress: alta-manual-equipo-cliente (F1B-15) — lote 1

Strict TDD · partida `cc76d98` · tareas 1.1-1.13 `[x]`. El orquestador commitea y mide. Sin cambios en la vista, `books/repo.ts` ni el hub.

## Ciclo TDD (rojo capturado antes del código)
| Tarea | Prueba | Rojo | Verde |
|---|---|---|---|
| 1.1-1.2 | `migrate.test.ts` | 7 rojas: «expected [10,26,3] to deeply equal [10,27,3]», «expected 43 to be 44» | 49/49 (era 44/44) |
| 1.4 | `shared/altaManual.test.ts` | «Cannot find module './altaManual'» | 4/4 |
| 1.5-1.6 | `services/clientes.test.ts` | «Cannot find module './clientes'» | 14/14 (HTTP rojo por `directory.ts`: «expected [[c1,undefined]]…», luego verde) |
| 1.8 | `db/ticketsConCliente.test.ts` | «Cannot find module './ticketsConCliente'» | 4/4 |
| 1.10 | `lectoresProvisionales.test.ts` | 4 rojas: «expected null to be 'Zeta Provisional'» (ticketFuentes, analisis), remisión, PATCH «expected 422 to be 200» | 4/4 |
| 1.12 | `registro.test.ts:220` | «F1B-15» sobraba en la lista | 23/23 |

## Mutaciones (aplicada → rojo → revertida → verde)
- m1 sin `public.` en el `CREATE`: 2 rojas (guardián de tablas y prueba de calificación). m2 `ALTER TABLE public.equipos`: 3 rojas (guardián de `ALTER`, recuento 44, calificación).
- m3 `false AS provisional` en `schema.sql:172`: 1 roja («la vista public.clients es idéntica a la de 132d25f»). m4 sin la entrada de `PUBLIC_TABLES`: 3 rojas.
- P4 consulta de provisionales antes de Books en `obtenerCliente`: 2 rojas («expected 1 to be +0», prioridad con espía). Todas con 49/49 y 14/14 tras revertir.

## Cierre (1.13)
- `npm test`: 174 ficheros pasan (1 omitido), 2455 pruebas pasan, 2 omitidas, 0 rojas. `typecheck` limpio; `lint` 165 avisos, 0 errores (techo 165, 0 nuevos: `aProvisional` tipado sin `any`); `build` verde.

## Barrido de citas (1.11)
- Sólo `analisis.ts` desplaza líneas (+1 import, +3 en la consulta: el `JOIN clients` pasa de `:16` a `:17`). El resto son añadidos al final o ediciones en la misma línea.
- Caso A: `equipos.ts:163` y `design.md:99` → `analisis.ts:17`. Caso B: `archive/2026-09-23-hojas-vida/design.md:15` → «en `cc76d98`».
- Cita errónea de la propia planificación: `types.ts:99` es `accountName` del ticket crudo de Zoho; el tipo `Ticket` lleva la marca en `:8` (corregido en `design.md:92` y `tasks.md:49`).
- Dos bloqueantes ya presentes en `design.md` (la ruta de `view.ts` de pg-mem y la línea vacía 28 de `ticketService.ts`) reescritos en prosa. Detector sobre una instantánea del árbol: 0 bloqueantes (sobre `HEAD` siguen esos dos hasta commitear). Medida: 626 inserciones y 58 borrados contra `cc76d98`, sin binarios.

## Desviaciones
- `HojaDeVida.tsx:153`: una línea (`as Record<string, string>` con respaldo al nombre del campo) porque ampliar `CambioEquipo['campo']` rompía `tsc`; la etiqueta propia es del lote 4.
- `mappers.ts:246` no se toca: `rowToTicketDetail` hereda la marca de `rowToTicket` (`:199`). `ticketService.ts:2` queda para el lote 2.
- La prueba existente «las seis sentencias nuevas» de `migrate.test.ts:648-652` pasa a contar las dos de F1B-15 (misma línea).

## Frontera de reversión
`git revert` del lote 1: la tabla y la columna quedan sin uso. Arnés real: `GET /api/clients`, `/api/clients/:id`, `POST /api/remisiones`, `PATCH /api/equipos/:id` contra pg-mem.

# Lote 2a — alta manual y traza (tareas 2.1-2.7, 2.8a, 2.9a `[x]`)

Strict TDD · partida `9910430` · sin tocar la vista, `books/repo.ts`, el hub ni `.tsx`. El orquestador commitea y mide.

## Ciclo TDD
| Tarea | Prueba | Rojo | Verde |
|---|---|---|---|
| Red de seguridad | 6 ficheros de `ticketService`/`equipoNuevo`/`tickets`/`flujoEquipoNuevo`/`equipos`/`ordenVentaUnTicket` | — | 224/224 antes de tocar |
| 2.1, 2.3, 2.6 | `services/altaManual.test.ts` (31 pruebas: TC-30/31/33, HV-16/17, C-1, P3, atomicidad, espías) | «Failed to load url ./altaManual» | 31/31 (una corrección propia de la prueba: la fecha llega como `Date` en pg-mem) |
| 2.2, 2.4, 2.5 | ídem + red de seguridad + `lectoresProvisionales.test.ts` | — | 259/259 |

## Mutación P3 (2.7, la reproduje yo)
Quité `validarContenidoAltaManual` de `ticketService.ts:91` y la puse tras el bloque del `409` de la OV (`:100`): roja sólo la prueba de posición («expected 409 to be 422»), 30 verdes. Revertida con copia previa: 259/259.

## Casilla de la regla 13 (decisiones del cliente de este lote: ninguna; `.tsx` es del lote 4)
El servidor impone: serial≠confirmación, reservados y provisional+OV/cliente en `validarContenidoAltaManual` (`ticketService.ts:91`); los cinco datos y el motivo en `exigirClienteProvisional` (`:28`); equipo manual en `exigirEquipoManual` (`:25`).

## Cierre (2.9a)
- `npm test`: 175 ficheros pasan (1 omitido), 2486 pruebas pasan (+31), 2 omitidas, 0 rojas. `typecheck` limpio. `lint`: 165 avisos, 0 errores (techo 165, 0 nuevos). `build` verde.

## Barrido de citas (2.8a)
- Cero desplazamientos: todo en `ticketService.ts`, `equipoNuevo.ts`, `db/equipos.ts` y `routes/tickets.ts` es edición en la misma línea (`:2`, `:4`, `:18`, `:21`, `:24`, `:25`, `:28`, `:29`, `:73`, `:89`, `:91`, `:108`; `equipoNuevo.ts` `:8`, `:84`, `:87`; `db/equipos.ts` `:42`, `:78`, `:104`, `:123`, `:125`, `:128`).
- Releído lo que AFIRMAN: `ticketService.ts:89` (el cliente del ticket resuelto en el alta; sigue cierto, ahora por `obtenerCliente` o el provisional nuevo), `:91` (contenido tras obligatorios y antes de la modalidad; cierto), `:24` y `:29` (cierto). Caso A en `design.md:34` y `:189`: `:28` «era una línea vacía» y hoy lleva `exigirClienteProvisional`.
- Detector sobre instantánea del árbol (`--sha` de un commit temporal): exit 0, 0 bloqueantes; 13 abreviadas rotas informativas, las mismas que en `9910430`.
- Medida contra `9910430` (con `git add -N`): 524 inserciones y 28 borrados, sin binarios; incluye +29/-4 de `tasks.md` de la partición, previos al intento.

## Desviaciones
- `ticketService.ts:108` y no `:107`: la llamada a `crearTicketConEquipo` cierra en `:108` (`}, altaManualDe(…))`). `:2` cambia el import de `getTicketWithRefs` al envoltorio de provisionales (respuestas del alta y de la transición con el nombre del provisional).
- Forma del cuerpo, no fijada en el diseño: `clienteManual {razonSocial,nit,contacto,telefono,correo,motivo}` y `equipoManual {serial,confirmacionSerial,modeloId | marca+modeloTexto+tipo,motivo,fechaFacturaCompra?}`. Con `equipoId` presente el `equipoManual` se ignora.
- Los `422` de faltantes del cliente provisional van en A (`:28`), como dice D7, aunque el texto de RQ-TC-30 los llama C.

# Lote 2b — P-B: NIT ya en Books (tareas 2.7b-2.7e, 2.8b, 2.9b `[x]`)

Strict TDD · partida `9e0f468` · sin tocar la vista, `books/repo.ts`, el hub ni `.tsx`; el `422` de NIT obligatorio (`altaManual.ts:42`) no cambia. El orquestador commitea y mide.

## Ciclo TDD
| Tarea | Prueba | Rojo | Verde |
|---|---|---|---|
| 2.7b, 2.7d, añadido A | `shared/altaManual.test.ts` (+8: normalización, cuatro pares del DV pegado, vacío por lado, `primerConflictoUnicidad`) | 8 rojas: «(0 , primerConflictoUnicidad) is not a function» (y `normalizarNit`, `nitCoincide`) | 12/12 |
| 2.7b, 2.7c, añadidos A y B | `services/altaManual.test.ts` (+8, por HTTP) | 2 rojas: «expected 201 to be 409» (el `409` simple y el de tres candidatos en orden inverso). Las otras seis **nacen verdes** (son negativas: 201 sin coincidencia, `422` del NIT obligatorio, vacío por los dos lados, P5 y `422` de C antes que D) y las prueban las mutaciones de abajo | 39+8 = 47/47 en el fichero |

## Mutaciones (aplicada → rojo → revertida con copia previa, `cmp` idéntico y `git diff` sin restos)
- **P5 (2.7c):** comprobación del NIT delante de `validarContenidoAltaManual` (`ticketService.ts:91`): 2 rojas en HTTP, «serial distinto + NIT en Books → 422, no 409» y «provisional + OV usada + NIT en Books → 422 de C».
- **P6 (2.7b):** invertido el orden dentro de `primerConflictoUnicidad` (OV antes que NIT): 1 roja en shared («con los dos conflictos a la vez devuelve el del NIT»). Por HTTP no compiten (provisional + OV es `422` de C), como dice `tasks.md:94`.
- **NIT sin normalizar (2.7d, regla 2):** `nitCoincide` compara el texto crudo: 6 rojas (3 en shared, 3 en HTTP: el `409` simple, el de candidatos múltiples y la guarda del «---»).
- **Guarda del vacío (añadido A):** quitada la línea `if (base === '' || baseBooks === '') return false`: 3 rojas, 1 en shared («lado tecleado») y 2 por HTTP («---» contra Books «---», y «---» contra Books vacío, nulo y «N/A»). Hallazgo: con **una sola** de las dos mitades de la guarda quitada, la otra basta (dos vacíos sólo son iguales si ambos lo son), así que la prueba por lado es de intención; añadí `('---', null)` y `('abc', 'N/A')` a shared para que el lado de Books se vea con un tecleado también vacío.

## Decisiones y supuestos (reversibles)
- **Lectura:** `clientesBooksPorNit` (`db/clientesProvisionales.ts`, plural) hace `SELECT id, name, nit FROM clients` sin `WHERE` por NIT y decide en JS con `nitCoincide`; así el SQL no puede excluir vacíos ni nulos y la guarda queda mutable. Lee la vista `public.clients` como `getClient` (`books/repo.ts:127-130`). Hipótesis: el recorrido completo es aceptable en un alta manual. Comprobado en pg-mem con las pruebas HTTP (NIT nulo incluido).
- **`409`:** `{ error, candidatos: [{ id, name }] }`, con `error` en español (`errorNitEnBooks`, `services/altaManual.ts`); orden por nombre (`localeCompare('es')`) y luego por id, fijado con tres candidatos insertados en orden inverso. Sin lista de NIT genéricos: pendiente de Gerencia como **E-154**.
- **Posición:** la comprobación va en `ticketService.ts:96`, tras todo C (`:91`, cuarentena y vencido en la propia línea) y antes de la OV, que sigue siendo la última guarda (`:97-100`, ahora `conflicto?.tipo === 'ov'`). El `422` del NIT obligatorio no se toca.

## Casilla de la regla 13 (2.7e) — decisión a decisión
**El formulario es del lote 4 y aún no existe: hoy el cliente no toma ninguna de estas decisiones; se escribe la comparación para que el lote 4 no nazca sin ella.**
| Decisión futura del cliente | Línea del servidor que la impone | ¿Espejo legítimo? |
|---|---|---|
| Mostrar el `409` del NIT en Books | `ticketService.ts:96` (`errorNitEnBooks`, `services/altaManual.ts`) | Sí: probado por `services/altaManual.test.ts` («P-B») |
| Ofrecer los candidatos y dejar elegir uno | el cuerpo `candidatos` del mismo `409` (`ticketService.ts:96`); ordenados en `clientesBooksPorNit` | Sí: el servidor decide quién es candidato |
| No dejar seguir con un NIT vacío o sin dígitos | `exigirClienteProvisional` (NIT obligatorio, `altaManual.ts:42`); «---» pasa ese escalón y no casa por la guarda de `nitCoincide` | El bloqueo del vacío es del servidor; el cliente sólo puede avisar |
| Normalizar el NIT para avisar antes de enviar | no hay decisión: el cliente consumirá `normalizarNit`/`nitCoincide` de `@ambientalia/shared` (punto 1), sin reescribirlas | Consume, no reescribe |
Sin línea de servidor que lo imponga, la decisión sería la guarda: aquí las cuatro tienen línea.

## Barrido de citas (2.8b)
- `ticketService.ts` no insertó ni borró líneas (edición en la misma línea, 250 antes y después): ninguna cita a ese fichero se desplaza. Releído lo que AFIRMAN: `:96` (cuarentena, vencido y ahora el `409` del NIT y de la OV; cierto), `:96-100` en `ordenVentaUnTicket.test.ts:19` (la puerta de creación de la OV: sigue cierta), `:91` en `altaManual.ts:95` y `equipoNuevo.ts:65`, `:97-100` en `equipoNuevo.ts:66` (el `409` de la OV: cierto).
- `clientesProvisionales.ts` y `altaManual.ts` sólo ganaron líneas al final; sin citas `ruta:línea` a esos dos ficheros en el repositorio. `design.md` gana +8 líneas en §4.6: las citas `design.md:NNN` de este cambio apuntan antes de §4.6 (`:34`, `:92`, `:99`).
- Detector sobre instantánea del árbol (`git stash create`): exit 0, 0 bloqueantes; 13 abreviadas rotas informativas, las mismas que en 2a.

## Cierre (2.9b)
- `npm test`: 175 ficheros pasan (1 omitido), 2502 pruebas pasan (+16), 2 omitidas, 0 rojas. `typecheck` limpio (un primer intento falló por `enUso` posiblemente nulo en `ticketService.ts:99`; reparado leyendo `conflicto.ticket.number`). `lint`: 165 avisos, 0 errores (techo 165, 0 nuevos). `build` verde.
- Medida contra `9e0f468`: `git diff --shortstat --no-renames` 261 inserciones y 15 borrados (276), sin ficheros sin trackear ni binarios; incluye este informe.

## Frontera de reversión
`git revert` del lote 2b: el alta manual vuelve a no comprobar el NIT; `normalizarNit`, `nitCoincide` y `primerConflictoUnicidad` quedan sin uso.

# Lote 3 — enlace, validación, guarda B y D12 (tareas 3.1-3.10 `[x]`)

Strict TDD · partida `8cb209a` · sin tocar la vista, `books/repo.ts`, el hub ni `.tsx`. El orquestador commitea y mide.

## Ciclo TDD
| Tarea | Prueba | Rojo | Verde |
|---|---|---|---|
| 3.1 | `shared/altaManual.test.ts` (+4: `motivoAltaPendiente`) | 4 rojas: «motivoAltaPendiente is not a function» | 16/16 |
| 3.2, 3.3 | `ticketService.test.ts`, al final (+8: provisional, equipo, ambos, tras enlazar, soporte remoto, sin consultas extra, P1, P2) | 4 rojas: `habilitar_servicio` pasaba (provisional, equipo, ambos, P2). Las otras cuatro **nacen verdes** (negativas: tras enlazar, soporte remoto, sin consultas extra, P1) y las prueban las mutaciones de abajo | 110/110 |
| 3.6 | `routes/altaManual.test.ts` (nuevo, 27: enlace 14, validación 8, D12 4, más TC-33) | 17 rojas (ruta inexistente: «Ruta de API no encontrada»). **Seis nacen verdes por la razón equivocada y no cuentan como rojo (con las 4 de D12, 10 verdes de 27):** las que esperan `404`/`422` coinciden con el `404` genérico de `/api`; su rojo real son las mutaciones de orden de abajo. Las 4 de D12 nacen verdes por diseño (caracterización) | 27/27 |

## Mutaciones (aplicada → rojo observado → revertida con copia previa, `cmp` idéntico y `git diff` sin restos)
- **P1 (3.5):** `exigirAltaValidada` antes del permiso de área (`ticketService.ts:129`) → roja sólo «POSICIÓN (P1)» (esperaba 403).
- **P2 (3.5):** la guarda detrás del `422` de obligatorios (`:134`) → roja sólo «POSICIÓN (P2)».
- **Atajo `t.id !== 'habilitar_servicio'` (sin consultas extra):** quitado → rojas «soporte remoto no bloquea» y «sin consultas extra».
- **Enlace M1:** `403` antes de los `404` → rojas las dos de «A antes que B». **M2:** `409` antes que `403` → roja «B permiso antes que B estado». **M3:** `422` de contactId antes que `403` → rojas «B antes que C» (las dos).
- **Validación:** `409` antes que `403` → roja «orden: A antes que B … validado y sin permiso → 403».
- **D12 (3.8):** `getClient` → `obtenerCliente` en `contratos.ts:52` (con su import) → roja la de contratos («El cliente no existe» ya no se devuelve). Las líneas de `design.md` D12 siguen siendo las de hoy: `contratos.ts:52`, `prioridad.ts:30` y `:38`, `equipos.ts:56` y `:171`. Sin mutar (sólo caracterización): prioridad y equipos.

## Decisiones y supuestos (reversibles)
- **Orden de guardas del enlace (D10 contra la escalera A<B<C<D de `transitions-st` §3.8).** El diseño pone el `422` de contactId «ausente o con prefijo» en C y la búsqueda del contacto en A; sin contactId no hay qué buscar, y un id con prefijo `prov-` nunca es de Books. **Supuesto:** la búsqueda del contacto en Books (`404`, A) sólo corre si hay un contactId bien formado (no vacío y sin prefijo provisional); el ausente o con prefijo salta A y cae en C, tras el `403` y el `409`. Resultado: `404` provisional · `404` contacto · `403` · `409` · `422`. Cumple A<B<C sin alcance nuevo; seis pruebas lo fijan y tres mutaciones lo muerden.
- Cierre de la carrera del doble enlace: `UPDATE … WHERE id=$1 AND enlazado_a IS NULL RETURNING id` dentro de la transacción; vacío → `409` (el mismo del chequeo previo).
- La validación deja `pendiente_validar = false` (no `NULL`): distingue «validado» de «nunca pendiente». `getEquipo` sólo lee `=== true`, así que el efecto es igual. Responde `{ id, pendienteValidar: false }`; el enlace, `{ id, enlazadoA, tickets, equipos }`.
- `exigirAltaValidada` lee `obtenerCliente` (campo `provisional`) y `getEquipo`; un provisional ya enlazado se resuelve por Books y no bloquea (riesgo aceptado de D10).
- Rutas montadas en sitio en `app.ts:22` (import) y `:61` (registro), mismo `requireAuth(db)` que las demás.

## Casilla de la regla 13
El lote 3 no toca `.tsx`: hoy el cliente no toma ninguna de estas decisiones. Para el lote 4, la línea del servidor de cada una: desactivar «Habilitar Servicio» con algo pendiente → `exigirAltaValidada`, cola de `ticketService.ts:131` (función al final del fichero); «Enlazar» y «Validar» sólo a Comercial o admin → `403` de `routes/altaManual.ts`; el predicado `motivoAltaPendiente` lo consume el cliente de `@ambientalia/shared`, sin reescribirlo. Las tres tienen línea.

## Barrido de citas (3.9)
- `ticketService.ts` pasó de 250 a 264 líneas: **sólo se añadió al final** (`exigirAltaValidada`, `:251-264`) y se editaron `:6` (import) y `:131` en sitio. Cero desplazamientos. `grep -rnoE "(ticketService|contratos|prioridad|equipos|clientesProvisionales|altaManual|app)\.ts:N(-N)?"` más el pase abreviado: ninguna cita se mueve; `contratos.ts`, `prioridad.ts` y `equipos.ts` no cambian (la mutación se revirtió).
- Releído lo que AFIRMAN las citas a `ticketService.ts:131` (`cargoPermiso.test.ts:17`, `permissions/spec.md:362`, `:486`, `transitions-st/spec.md:33`, `transitions-equipo-nuevo/spec.md:339`, `design.md:36`, `:198`, `:215`): el cargo, la prioridad y la verificación de Verificación siguen en esa línea; ahora la cierra además `exigirAltaValidada`, que es lo que dicen `design.md` y `tasks.md`. `app.ts:61` (Paquetes de despliegue): sigue siendo la línea que monta las rutas; ahora monta también las de alta manual (Caso A, la frase sigue cierta).
- `registro.test.ts:220` no hizo falta tocarlo (F1B-15 ya está en «en curso»).
- Detector sobre instantánea del árbol (`git stash create`): exit 0, 0 bloqueantes; 13 abreviadas rotas informativas, las mismas que en 2b.

## Cierre (3.10)
- `npm test`: 176 ficheros pasan (1 omitido), 2541 pruebas pasan (+39), 2 omitidas, 0 rojas. `typecheck` limpio. `lint`: 165 avisos, 0 errores (techo 165, 0 nuevos). `build` verde.
- Medida contra `8cb209a`: `git diff --shortstat --no-renames` 170 inserciones y 5 borrados en seguimiento, más 316 líneas en los dos ficheros nuevos (`routes/altaManual.ts` 53, `routes/altaManual.test.ts` 263); con `apply-progress.md` y `tasks.md`: 237 + 316 = 553.

## Frontera de reversión
`git revert` del lote 3: «Habilitar Servicio» vuelve a no mirar lo pendiente y desaparecen las dos rutas; las funciones de enlace y `motivoAltaPendiente` quedan sin uso.
