# Tareas: alta manual de equipo y cliente desconocidos (F1B-15)

Worktree `C:\dev\Desk_2_R1.023-worktrees\alta-manual-equipo-cliente`. Preflight: auto · hybrid · ask-on-risk · 800 ·
strict_tdd. Un intento por lote; no se fusiona `main` con un intento abierto.

**Replanificado el 2026-10-02** tras el sondeo 1.0 (intento 1, `interrupted`, 0 líneas) y la decisión de Gerencia
`decision/f1b15-clientes-provisionales-sin-tocar-la-vista` (E-152): la vista `public.clients` (`schema.sql:169-173`),
`packages/zoho-sync/src/books/repo.ts` y el worker del hub **no se tocan**; los provisionales se resuelven con una
segunda consulta en `apps/desk/server` (RQ-TC-34). Esta versión sustituye a la de `05ef26e` entera: las tareas de la
vista (1.0-1.6 y la reversión con `DROP VIEW`) desaparecen. El inventario de lectores y el caso «alta posterior en
Books» están en `design.md` §4.

## Correcciones al diseño (aplicadas)

- **C-1 (corrige D8).** En «Equipo nuevo» el alta manual **conserva la fecha de factura obligatoria** de F1B-14. El
  modo manual sólo relaja el **modelo de catálogo**. Fuera de «Equipo nuevo» se rechazan fecha de factura, fin de
  garantía y mantenedor (RQ-HV-17).
- **C-2.** Aplicada en planificación el 2026-10-02: RQ-HV-17 del delta `specs/hojas-vida/spec.md` y el criterio 4 de
  `proposal.md` ya dicen «salvo la fecha de factura en «Equipo nuevo»».

## Review Workload Forecast

| Campo | Valor |
|---|---|
| Líneas estimadas | Lote 1 684 medidas · Lote 2a ~690 · Lote 2b ~310 (corregidas con el factor del lote 1) · Lote 3 ~320 · Lote 4 ~270 |
| Riesgo sobre 800 | Bajo en los cuatro; válvula 720 por intento |
| Estrategia de entrega | ask-on-risk |
| Medida | `git diff --shortstat --no-renames` contra el commit de partida del intento más `wc -l` de lo nuevo sin trackear; binarios aparte |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Unidades de trabajo

| Unidad | Meta | Prueba focal | Arnés real | Frontera de reversión |
|---|---|---|---|---|
| 1 | Esquema y resolución de provisionales | `npx vitest run packages/zoho-sync/src/db/migrate.test.ts apps/desk/server/services/clientes.test.ts apps/desk/server/db/ticketsConCliente.test.ts` | `GET /api/clients`, `/api/clients/:id`, `/api/tickets` contra pg-mem | `git revert` del lote; tabla y columna quedan sin uso |
| 2 | Alta manual y traza | `npx vitest run apps/desk/server/services/altaManual.test.ts` | `POST /api/tickets` manual contra pg-mem | `git revert` del lote 2 |
| 3 | Enlace, validación, guarda B, D12 | `npx vitest run apps/desk/server/routes/altaManual.test.ts apps/desk/server/services/ticketService.test.ts` | Enlace, validación y `habilitar_servicio` por HTTP | `git revert` del lote 3 |
| 4 | Interfaz | `npm run typecheck && npm run build` | Verificación en la app tras desplegar (persona) | `git revert` del lote 4 (`.tsx` fuera de la red, F0-00) |

## Lote 1 — esquema y resolución de provisionales (RQ-ZS-16, RQ-TC-34)

- [x] 1.1 RED `migrate.test.ts`: cifras en sitio (`:284`, `:285`, `:286` 39→40; `:376` 43→44; `:378` 22→23) y, al final, prueba de la **vista intacta**: el texto de `schema.sql:169-173` es el de `132d25f` y no contiene `clientes_provisionales` ni `provisional`. Rojo: sin tabla.
- [x] 1.2 GREEN `schema.sql` **sólo al final**: `CREATE TABLE public.clientes_provisionales` (columnas de D1) y `ALTER TABLE equipos ADD COLUMN IF NOT EXISTS pendiente_validar boolean` (sin calificar). Comentarios sin punto y coma. `migrate.ts:73`: `clientes_provisionales` al final de la línea.
- [x] 1.3 Mutaciones regla 2, una a una, revertidas con `git diff`: (m1) quitar `public.` del `CREATE TABLE`; (m2) `ALTER TABLE public.equipos`; (m3) añadir `clientes_provisionales` o `provisional` a `:169-173`; (m4) quitar la entrada de `PUBLIC_TABLES`. Cada una pone rojo un guardián.
- [x] 1.4 RED→GREEN `packages/shared/src/altaManual.ts` (nuevo, export al final de `index.ts`): `PREFIJO_PROVISIONAL`, `serialesCoinciden`. Tipos en sitio: `provisional?` (`types.ts:301`), `clienteProvisional?` (`:8`, en `Ticket`), `pendienteValidar?`, `CambioEquipo['campo']` (`:555`).
- [x] 1.5 RED `services/clientes.test.ts`: los siete escenarios de RQ-TC-34 —búsqueda con ambos y marcas; enlazado no listado; ficha provisional; ficha de Books idéntica con `provisional:false`; inexistente `404`; prioridad de Books con espía (cero consultas a `clientes_provisionales` para un id de Books)—. Rojo: módulo inexistente.
- [x] 1.6 GREEN `db/clientesProvisionales.ts` (lecturas) y `services/clientes.ts`: `obtenerCliente`, `buscarClientes`, `clienteParaEquipo`.
- [x] 1.7 Mutación P4: consulta de provisionales antes que Books en `obtenerCliente` → rojo la prueba de prioridad; revertir.
- [x] 1.8 RED→GREEN `db/ticketsConCliente.test.ts` + `db/ticketsConCliente.ts`: escenario «listado muestra el nombre del provisional» en los cuatro envoltorios; marca por `mappers.ts:185`, `:199`, `:246`.
- [x] 1.9 GREEN lectores del §4 de `design.md`, en sitio: `routes/directory.ts:3`, `:16` (`provisionales=1`), `:26`; imports de `routes/tickets.ts:5`, `routes/prioridad.ts:4`, `routes/remision.ts:5`; `routes/remision.ts:10`, `:203`, `:307`; `routes/equipos.ts:81` (`clienteParaEquipo`); `db/ticketFuentes.ts:172-174`; `analisis.ts` (segunda consulta).
- [x] 1.10 RED→GREEN de los lectores que no cubre 1.5/1.8: historial con el nombre del provisional (`ticketFuentes`), análisis con el nombre (`analisis.ts`), remisión con `empresa` del provisional (`remision.ts:203`), `PATCH` de equipo con otro provisional → `422`.
- [x] 1.11 Barrido de citas (regla 4): `grep -rnoE "(schema|migrate|types|directory|remision|tickets|prioridad|ticketFuentes|analisis|mappers|equipos)\.(ts|sql):[0-9]+(-[0-9]+)?"` + pase abreviado; releer lo que AFIRMAN `remision.ts:203`/`:307` y `directory.ts:16`/`:26`; reparar por caso A/B/C. `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` con 0 bloqueantes.
- [x] 1.12 Si `registro.test.ts:220` se pone roja, añadir `F1B-15` a «en curso» (orden alfabético, tras `F1B-11`).
- [x] 1.13 Cierre: `npm test`, `npm run typecheck`, `npm run lint` (techo 165), `npm run build`; medir y registrar.

## Lote 2 — alta manual y traza (RQ-TC-30, RQ-TC-31, RQ-TC-33, RQ-HV-16, RQ-HV-17, C-1, P-B)

**PARTIDO en 2a y 2b el 2026-10-02, antes de escribir código.** Calibración con el lote 1 (`9910430`, medido con
`git show --numstat`): pruebas 358 frente a ~200 (+79 %), código 255 frente a ~140 (+82 %), documentos 71 → factor
~1,8 sobre código **y** pruebas. Lote 2 entero: código ~190 → ~340, pruebas ~280 → ~500, documentos ~60 → **~900**,
por encima de la válvula de 720. Cada sublote cierra solo, con su prueba, su barrido y su medida:

| Sublote | Tareas | Estimación corregida |
|---|---|---|
| **2a** · alta manual y traza | 2.1-2.7, 2.8a, 2.9a | código ~140 → ~250 · pruebas ~220 → ~400 · documentos ~40 → **~690** |
| **2b** · P-B con su posición y su normalización | 2.7b-2.7e, 2.8b, 2.9b | código ~50 → ~90 · pruebas ~100 → ~180 · documentos ~40 → **~310** |

Si 2a cruza 720 durante el trabajo, se para tras la tarea en curso y se informa parcial. 2b arranca desde el commit
de 2a, en su propio intento.

### 2a — alta manual y traza

- [x] 2.1 RED `services/altaManual.test.ts`: criterios 1-4 y escenarios TC-30/31, HV-16/17; **C-1:** alta manual en «Equipo nuevo» sin fecha de factura → `422`. Rojo: módulo inexistente.
- [x] 2.2 GREEN `services/altaManual.ts` (nuevo): `exigirEquipoManual` (A), `exigirClienteProvisional` (A), `validarContenidoAltaManual` (C; respeta C-1), `escribirAltaManual(q, …)`.
- [x] 2.3 RED P3 (regla 1): serial que no coincide + OV ya usada → `422` y no `409`.
- [x] 2.4 GREEN `ticketService.ts` en sitio: `:21` (`actorId`), `:24`, `:25`, `:28` (línea vacía), `:73` y `:89` (`obtenerCliente`), `:91`, `:108` (la llamada cierra ahí, no en `:107`), `:2`, `:4`, `:18` y `:29` (imports y valor por omisión); sin insertar líneas.
- [x] 2.5 GREEN `equipoNuevo.ts` (`crearTicketConEquipo`, final) llama a `escribirAltaManual`; `db/equipos.ts` (`pendiente_validar` en `createEquipo` y `getEquipo`); `routes/tickets.ts:125` pasa `req.user?.id`.
- [x] 2.6 RED→GREEN atomicidad: fallo del `INSERT` del ticket no deja `clientes_provisionales`, `equipos` ni `tickets` (TC-31c); espías de Zoho/`books.*` en cero (TC-33).
- [x] 2.7 Mutación P3: mover la comparación del serial detrás de `ticketService.ts:96` → rojo; revertir.
- [x] 2.8a Barrido de citas (`ticketService|equipoNuevo|equipos|tickets`) + pase abreviado; releer `ticketService.ts:89`, `:91`; detector con 0 bloqueantes. `registro.test.ts:220` si hace falta.
- [x] 2.9a Cierre de 2a: `npm test`, `typecheck`, `lint` (165, 0 nuevos), `build`; medir y registrar.

### 2b — P-B: NIT ya en Books (`decision/f1b15-p-b-nit-en-books`)

La guarda vive en el **servidor**: `409` con `{ id, name }`, escalón D, **después de todo el escalón C**. Un alta
cuyo NIT no casa con ninguno de Books sigue. El formulario (lote 4) sólo muestra el `409` y ofrece el existente.

- [x] 2.7b RED→GREEN P-B (RQ-TC-30 «El NIT ya está en Books»): `normalizarNit` puro en `packages/shared/src/altaManual.ts` («900.123.456-7» ≡ «900123456»), `clientePorNit` en `db/clientesProvisionales.ts`, `409` con `{ id, name }` en el escalón D, en sitio en `ticketService.ts:96`; nada escrito. Clave: `decision/f1b15-p-b-nit-en-books`. **Añadidos del usuario (2026-10-02):** (A) un NIT cuya base normalizada es vacía NUNCA casa, ni el tecleado («---») ni el de Books (vacío, nulo, sin dígitos), guarda dentro de `nitCoincide`; (B) varios contactos con el mismo NIT: el `409` devuelve TODOS en `{ error, candidatos: [{ id, name }] }`, por nombre y luego por id, y la función de BD es `clientesBooksPorNit` (en plural).
  - **Dígito de verificación pegado (SUPUESTO REVERSIBLE).** «9001234567» (sin guion) **NO** se trata en general como «900123456» + DV: sin guion no se distingue de una cédula de diez dígitos, y un falso positivo bloquearía con `409` un alta legítima y ofrecería el cliente equivocado; un falso negativo sólo deja pasar un duplicado que el enlace (RQ-TC-32) repara. **Excepción precisa:** casa cuando Books trae el NIT con su DV explícito y el número tecleado es exactamente base + DV de Books: «9001234567» casa con «900.123.456-7» y **no** con «900123456» ni con «900.123.456-3». Se implementa como `nitCoincide(tecleado, books)` puro: casa si la base del tecleado (antes del primer guion, sólo dígitos) es igual a la base de Books o a base + DV de Books. Pruebas en `shared/altaManual.test.ts` con los cuatro pares de arriba, más «900 123 456» ≡ «900123456».
  - **POSICIÓN entre las dos guardas de D (NIT en Books y OV ya usada).** Por la API no compiten: un provisional con orden de venta es `422` de C (D7, `design.md` §6, «No combina provisional con OV»). Aun así el orden se fija: **gana el NIT, y la OV va la última**, porque RQ-TC-31 (`specs/tickets-core/spec.md:48-49`) exige que el `409` de unicidad de la OV siga siendo «la última guarda antes de la primera escritura». Para que el orden sea comprobable y no sólo un comentario (regla de mutación 1), las dos comprobaciones de D se resuelven en una función pura `primerConflictoUnicidad({ nitEnBooks, ovEnUso })` en `packages/shared/src/altaManual.ts`, que devuelve el del NIT si existen los dos. Pruebas: (i) en shared, con los dos conflictos a la vez → el del NIT; (ii) por HTTP, alta manual con provisional + OV ya usada + NIT en Books → `422` de C y nada escrito (fija que C precede a los dos D). **Mutación P6, la reproduce el agente:** invertir el orden dentro de `primerConflictoUnicidad` → (i) rojo; revertir con `git diff`.
- [x] 2.7c Mutación P5 (posición frente al **último guardia del escalón C** del alta manual, `validarContenidoAltaManual` en `ticketService.ts:91`): serial distinto (C) + NIT ya en Books (D) → `422`; mover la comprobación del NIT delante de `:91` → rojo; revertir.
- [x] 2.7d Mutación del dato vigilado (regla 2): con un cliente de Books cuyo NIT está escrito «900.123.456-7» y un alta con «900123456», quitar la normalización (comparar el texto crudo) → la prueba del `409` se pone roja; revertir.
- [x] 2.7e Casilla de la regla 13 de P-B, por escrito en `apply-progress.md`: cada decisión del cliente (mostrar el `409`, ofrecer el existente) con la línea del servidor que la impone.
- [x] 2.8b Barrido de citas (`ticketService|clientesProvisionales|altaManual`) + pase abreviado; releer `ticketService.ts:96`; detector con 0 bloqueantes.
- [x] 2.9b Cierre de 2b: `npm test`, `typecheck`, `lint` (165, 0 nuevos), `build`; medir y registrar.

## Lote 3 — enlace, validación, guarda B y D12 (RQ-TC-32, RQ-HV-18, RQ-TS-32)

- [ ] 3.1 RED→GREEN `shared/altaManual.ts`: `motivoAltaPendiente` (provisional, equipo pendiente, ambos nombrados juntos; ninguno → `null`).
- [ ] 3.2 RED `ticketService.test.ts` (al final): TS-32 provisional, equipo, ambos, tras enlazar, soporte remoto. Rojo: `habilitar_servicio` pasa hoy.
- [ ] 3.3 RED P1 (pendiente + sin Comercial → `403`) y P2 (pendiente + Comercial sin OV obligatoria → `422` de pendiente, no el de `:134`).
- [ ] 3.4 GREEN cola de `ticketService.ts:131`: `exigirAltaValidada` tras `exigirVerificacion(gas)` y antes de `:132`; lectura en función nueva **al final**; sin consultas si `t.id !== 'habilitar_servicio'`.
- [ ] 3.5 Mutaciones P1 (guarda antes de `:129`) y P2 (guarda detrás de `:134`): rojo; revertir.
- [ ] 3.6 RED `routes/altaManual.test.ts`: enlace TC-32 (correcto, sin permiso, fallo a mitad, contacto inexistente, doble enlace; orden `404`·`403`·`409`·`422`), validación HV-18 a-d, espías TC-33.
- [ ] 3.7 GREEN `db/clientesProvisionales.ts` (enlace) y `routes/altaManual.ts` (nuevo): enlace en una `enTransaccion` (`UPDATE … WHERE enlazado_a IS NULL RETURNING`; `tickets.client_id`; `equipos.client_id` y `cliente_nombre`; fila `clientId` por equipo), validación con `registrarEdicion`; montar la ruta.
- [ ] 3.8 Caracterización D12 (nacen verdes): un id provisional rechazado en `contratos.ts:52` (`422`), `prioridad.ts:30`/`:38` (`404`), `equipos.ts:56` y `:171` (`422`). Rojo previo por mutación: `getClient` → `obtenerCliente` en `contratos.ts:52`; revertir.
- [ ] 3.9 Barrido de citas (`ticketService|contratos|prioridad|equipos`) + pase abreviado; releer `ticketService.ts:131`; detector con 0 bloqueantes. `registro.test.ts:220`.
- [ ] 3.10 Cierre: `npm test`, `typecheck`, `lint` (165), `build`; medir y registrar.

## Lote 4 — interfaz (`.tsx` fuera de la red, F0-00: sin rojo previo)

- [ ] 4.1 `CreateTicket.tsx`: buscador con `provisionales=1` y etiqueta «provisional»; modo manual de cliente y equipo; serial doble con aviso; ocultar los tres campos comerciales salvo la fecha de factura en «Equipo nuevo» (C-1).
- [ ] 4.2 `HojaDeVida.tsx`: aviso de pendiente y acciones «Enlazar»/«Validar» sólo a Comercial o admin; `TransitionPanel.tsx` desactiva «Habilitar Servicio»; `TicketCard.tsx` marca el cliente provisional; `src/api/client.ts` (al final).
- [ ] 4.3 **Casilla regla 13** por escrito, decisión por decisión, con la línea del servidor de `design.md` §6 fijada contra el árbol de ese día.
- [ ] 4.4 Barrido de citas y detector `--sha HEAD` con 0 bloqueantes; `registro.test.ts:220`.
- [ ] 4.5 Cierre: `npm test`, `typecheck`, `lint` (165), `build`; medir y registrar.

**Instrucción para `archive` (SIN casilla):** quitar `F1B-15` de «en curso» en `registro.test.ts:220`, y registrar
P-A (`design.md` §4.6) como entrada de `docs/sdd/ENTRADA.md`. Archivar no la da por hecha.

## Tareas de persona y pendientes (fuera del recuento; archivar no las da por hechas)

| Tarea | Dueño | Destino |
|---|---|---|
| Q1/Q2 (Anexo D nº 83): quién hace el alta manual y si los cinco datos son el mínimo | Gerencia | `openspec/config.yaml` → `decisiones_de_gerencia` |
| **P-A** · Aviso a Comercial cuando un contacto de Books comparta NIT con un provisional sin enlazar (hoy el enlace depende de que alguien se acuerde) | Gerencia (alcance y destino) | `design.md` §4.6 → `docs/sdd/ENTRADA.md` al archivar |
| Verificación en la app tras desplegar (alta manual, enlace, validación, «Habilitar Servicio») | Persona de Comercial | `docs/sdd/` parte de verificación |

## Matriz de cobertura (43 escenarios, 10 requisitos)

| Requisito | Escenarios → tareas |
|---|---|
| RQ-ZS-16 | guardianes en verde 1.1-1.2 · `CREATE` sin calificar 1.3 (m1, m2) · vista intacta 1.1, 1.3 (m3) |
| RQ-TC-34 | búsqueda, enlazado no listado, ficha provisional, ficha de Books, `404`, prioridad 1.5-1.7 · listado 1.8 |
| RQ-TC-30 | alta, faltan datos, motivo vacío 2.1-2.2 · NIT ya en Books 2.7b-2.7c · id no se confunde 1.4, 2.1 |
| RQ-TC-31 | dos marcas, soporte remoto 2.1-2.5 · fallo 2.6 · posición OV 2.3, 2.7 |
| RQ-TC-32 | enlace, sin permiso, fallo a mitad, inexistente, doble 3.6-3.7 |
| RQ-TC-33 | espías 2.6 y 3.6 |
| RQ-HV-16 | serial no coincide, existente, no catalogado, sin texto 2.1-2.2 |
| RQ-HV-17 | reservados, Comercial tampoco 2.1-2.2 (con C-1) · PATCH después 2.1 |
| RQ-HV-18 | correcta, sin permiso, no catalogado, ya validada 3.6-3.7 |
| RQ-TS-32 | provisional, equipo, ambos, tras enlazar, soporte remoto 3.2, 3.4 · posición 3.3, 3.5 |
