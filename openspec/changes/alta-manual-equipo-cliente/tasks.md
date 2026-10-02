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
| Líneas estimadas | Lote 1 ~340 · Lote 2 ~360 · Lote 3 ~320 · Lote 4 ~270 (total ~1.290 en cuatro intentos) |
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

- [ ] 1.1 RED `migrate.test.ts`: cifras en sitio (`:284`, `:285`, `:286` 39→40; `:376` 43→44; `:378` 22→23) y, al final, prueba de la **vista intacta**: el texto de `schema.sql:169-173` es el de `132d25f` y no contiene `clientes_provisionales` ni `provisional`. Rojo: sin tabla.
- [ ] 1.2 GREEN `schema.sql` **sólo al final**: `CREATE TABLE public.clientes_provisionales` (columnas de D1) y `ALTER TABLE equipos ADD COLUMN IF NOT EXISTS pendiente_validar boolean` (sin calificar). Comentarios sin punto y coma. `migrate.ts:73`: `clientes_provisionales` al final de la línea.
- [ ] 1.3 Mutaciones regla 2, una a una, revertidas con `git diff`: (m1) quitar `public.` del `CREATE TABLE`; (m2) `ALTER TABLE public.equipos`; (m3) añadir `clientes_provisionales` o `provisional` a `:169-173`; (m4) quitar la entrada de `PUBLIC_TABLES`. Cada una pone rojo un guardián.
- [ ] 1.4 RED→GREEN `packages/shared/src/altaManual.ts` (nuevo, export al final de `index.ts`): `PREFIJO_PROVISIONAL`, `serialesCoinciden`. Tipos en sitio: `provisional?` (`types.ts:301`), `clienteProvisional?` (`:99`), `pendienteValidar?`, `CambioEquipo['campo']` (`:555`).
- [ ] 1.5 RED `services/clientes.test.ts`: los siete escenarios de RQ-TC-34 —búsqueda con ambos y marcas; enlazado no listado; ficha provisional; ficha de Books idéntica con `provisional:false`; inexistente `404`; prioridad de Books con espía (cero consultas a `clientes_provisionales` para un id de Books)—. Rojo: módulo inexistente.
- [ ] 1.6 GREEN `db/clientesProvisionales.ts` (lecturas) y `services/clientes.ts`: `obtenerCliente`, `buscarClientes`, `clienteParaEquipo`.
- [ ] 1.7 Mutación P4: consulta de provisionales antes que Books en `obtenerCliente` → rojo la prueba de prioridad; revertir.
- [ ] 1.8 RED→GREEN `db/ticketsConCliente.test.ts` + `db/ticketsConCliente.ts`: escenario «listado muestra el nombre del provisional» en los cuatro envoltorios; marca por `mappers.ts:185`, `:199`, `:246`.
- [ ] 1.9 GREEN lectores del §4 de `design.md`, en sitio: `routes/directory.ts:3`, `:16` (`provisionales=1`), `:26`; imports de `routes/tickets.ts:5`, `routes/prioridad.ts:4`, `routes/remision.ts:5`; `routes/remision.ts:10`, `:203`, `:307`; `routes/equipos.ts:81` (`clienteParaEquipo`); `db/ticketFuentes.ts:172-174`; `analisis.ts` (segunda consulta).
- [ ] 1.10 RED→GREEN de los lectores que no cubre 1.5/1.8: historial con el nombre del provisional (`ticketFuentes`), análisis con el nombre (`analisis.ts`), remisión con `empresa` del provisional (`remision.ts:203`), `PATCH` de equipo con otro provisional → `422`.
- [ ] 1.11 Barrido de citas (regla 4): `grep -rnoE "(schema|migrate|types|directory|remision|tickets|prioridad|ticketFuentes|analisis|mappers|equipos)\.(ts|sql):[0-9]+(-[0-9]+)?"` + pase abreviado; releer lo que AFIRMAN `remision.ts:203`/`:307` y `directory.ts:16`/`:26`; reparar por caso A/B/C. `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` con 0 bloqueantes.
- [ ] 1.12 Si `registro.test.ts:220` se pone roja, añadir `F1B-15` a «en curso» (orden alfabético, tras `F1B-11`).
- [ ] 1.13 Cierre: `npm test`, `npm run typecheck`, `npm run lint` (techo 165), `npm run build`; medir y registrar.

## Lote 2 — alta manual y traza (RQ-TC-30, RQ-TC-31, RQ-TC-33, RQ-HV-16, RQ-HV-17, C-1)

- [ ] 2.1 RED `services/altaManual.test.ts`: criterios 1-4 y escenarios TC-30/31, HV-16/17; **C-1:** alta manual en «Equipo nuevo» sin fecha de factura → `422`. Rojo: módulo inexistente.
- [ ] 2.2 GREEN `services/altaManual.ts` (nuevo): `exigirEquipoManual` (A), `exigirClienteProvisional` (A), `validarContenidoAltaManual` (C; respeta C-1), `escribirAltaManual(q, …)`.
- [ ] 2.3 RED P3 (regla 1): serial que no coincide + OV ya usada → `422` y no `409`.
- [ ] 2.4 GREEN `ticketService.ts` en sitio: `:21` (`actorId`), `:24`, `:25`, `:28` (línea vacía), `:73` y `:89` (`obtenerCliente`), `:91`, `:107`, imports; sin insertar líneas.
- [ ] 2.5 GREEN `equipoNuevo.ts` (`crearTicketConEquipo`, final) llama a `escribirAltaManual`; `db/equipos.ts` (`pendiente_validar` en `createEquipo` y `getEquipo`); `routes/tickets.ts:125` pasa `req.user?.id`.
- [ ] 2.6 RED→GREEN atomicidad: fallo del `INSERT` del ticket no deja `clientes_provisionales`, `equipos` ni `tickets` (TC-31c); espías de Zoho/`books.*` en cero (TC-33).
- [ ] 2.7 Mutación P3: mover la comparación del serial detrás de `ticketService.ts:96` → rojo; revertir.
- [ ] 2.8 Barrido de citas (`ticketService|equipoNuevo|equipos|tickets`) + pase abreviado; releer `ticketService.ts:89`, `:91`; detector con 0 bloqueantes. `registro.test.ts:220` si hace falta.
- [ ] 2.9 Cierre: `npm test`, `typecheck`, `lint` (165), `build`; medir y registrar.

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
P-A y P-B (`design.md` §4.6) como entradas de `docs/sdd/ENTRADA.md`. Archivar no los da por hechos.

## Tareas de persona y pendientes (fuera del recuento; archivar no las da por hechas)

| Tarea | Dueño | Destino |
|---|---|---|
| Q1/Q2 (Anexo D nº 83): quién hace el alta manual y si los cinco datos son el mínimo | Gerencia | `openspec/config.yaml` → `decisiones_de_gerencia` |
| **P-A** · Aviso a Comercial cuando un contacto de Books comparta NIT con un provisional sin enlazar (hoy el enlace depende de que alguien se acuerde) | Gerencia (alcance y destino) | `design.md` §4.6 → `docs/sdd/ENTRADA.md` al archivar |
| **P-B** · Rechazar en el alta un provisional cuyo NIT ya está en Books, ofreciendo el existente (cambia el formulario de campo) | Gerencia (alcance y destino) | `design.md` §4.6 → `docs/sdd/ENTRADA.md` al archivar |
| Verificación en la app tras desplegar (alta manual, enlace, validación, «Habilitar Servicio») | Persona de Comercial | `docs/sdd/` parte de verificación |

## Matriz de cobertura (42 escenarios, 10 requisitos)

| Requisito | Escenarios → tareas |
|---|---|
| RQ-ZS-16 | guardianes en verde 1.1-1.2 · `CREATE` sin calificar 1.3 (m1, m2) · vista intacta 1.1, 1.3 (m3) |
| RQ-TC-34 | búsqueda, enlazado no listado, ficha provisional, ficha de Books, `404`, prioridad 1.5-1.7 · listado 1.8 |
| RQ-TC-30 | alta, faltan datos, motivo vacío 2.1-2.2 · id no se confunde 1.4, 2.1 |
| RQ-TC-31 | dos marcas, soporte remoto 2.1-2.5 · fallo 2.6 · posición OV 2.3, 2.7 |
| RQ-TC-32 | enlace, sin permiso, fallo a mitad, inexistente, doble 3.6-3.7 |
| RQ-TC-33 | espías 2.6 y 3.6 |
| RQ-HV-16 | serial no coincide, existente, no catalogado, sin texto 2.1-2.2 |
| RQ-HV-17 | reservados, Comercial tampoco 2.1-2.2 (con C-1) · PATCH después 2.1 |
| RQ-HV-18 | correcta, sin permiso, no catalogado, ya validada 3.6-3.7 |
| RQ-TS-32 | provisional, equipo, ambos, tras enlazar, soporte remoto 3.2, 3.4 · posición 3.3, 3.5 |
