# Tareas: alta manual de equipo y cliente desconocidos (F1B-15)

Worktree `C:\dev\Desk_2_R1.023-worktrees\alta-manual-equipo-cliente`, partida `132d25f`. Preflight: auto · hybrid · ask-on-risk · 800 · strict_tdd. Un intento por lote; no se rebasa con el intento abierto.

## Correcciones al diseño (prevalecen sobre `design.md`)

- **C-1 (corrige D8).** En «Equipo nuevo» el alta manual **conserva la fecha de factura obligatoria** de F1B-14 (`decision/equipo-nuevo-alta-en-ticket`, `openspec/config.yaml`). El modo manual sólo relaja el **modelo de catálogo** (admite modelo no catalogado con texto). Fuera de «Equipo nuevo», el alta manual sigue rechazando fecha de factura, fin de garantía y mantenedor (RQ-HV-17). Consecuencia: `validarContenidoAltaManual` no rechaza `fechaFactura` cuando la clasificación es «Equipo nuevo» (la exige). Tareas 1.9 (RED) y 1.10 (GREEN).
- **C-2 (derivada de C-1, a confirmar en `verify`).** El texto del delta `specs/hojas-vida/spec.md` RQ-HV-17 debe decir «salvo la fecha de factura en «Equipo nuevo», que sigue obligatoria». Tarea 1.18, documental.

## Review Workload Forecast

| Campo | Valor |
|---|---|
| Líneas estimadas | Lote 1 ~475 · Lote 2 ~330 · Lote 3 ~280 (total ~1.085 en tres intentos; ninguno pasa de 800) |
| Riesgo sobre 800 | Bajo (lotes 2 y 3), Medio (lote 1: si cruza 720 se parte) |
| Estrategia de entrega | ask-on-risk |
| Medida | `git diff --shortstat --no-renames` contra `132d25f` más `wc -l` de lo nuevo sin trackear; binarios aparte |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

Un intento por lote, fusionado a `main` tras el `settle`. Válvula: el lote 1 se parte en **1a** (esquema y vista, ~150: tareas 1.1-1.8 y 1.19) y **1b** (alta, ~325: 1.9-1.18) si la medida llega a 720 antes de cerrar.

### Unidades de trabajo

| Unidad | Meta | Prueba focal | Arnés real | Frontera de reversión |
|---|---|---|---|---|
| 1 | Esquema, vista, alta manual, traza | `npx vitest run packages/zoho-sync/src/db/migrate.test.ts packages/zoho-sync/src/books/repo.test.ts apps/desk/server/services/altaManual.test.ts` | `POST /api/tickets` manual contra pg-mem | `git revert` del lote; la vista exige `DROP VIEW` manual |
| 2 | Enlace, validación, guarda B, rechazos D12 | `npx vitest run apps/desk/server/routes/altaManual.test.ts apps/desk/server/services/ticketService.test.ts` | Enlace, validación y `habilitar_servicio` por HTTP | `git revert` del lote 2 |
| 3 | Interfaz | `npm run typecheck && npm run build` | Verificación en la app tras desplegar (persona) | `git revert` del lote 3 (`.tsx` fuera de la red, F0-00) |

## Lote 1 — esquema, vista, alta manual y traza

- [ ] 1.0 **SONDEO pg-mem (primera tarea).** Prueba desechable o permanente en `migrate.test.ts`: `CREATE OR REPLACE VIEW` sobre vista existente y `UNION ALL` con `NULL::text`. **Si falla: PARAR y consultar (cambia D2); no seguir.**
- [ ] 1.1 RED `books/repo.test.ts`: id de Books → `provisional:false`; provisional sin enlazar → `true`; enlazado deja de resolverse. Rojo: columna `provisional` inexistente.
- [ ] 1.2 RED `migrate.test.ts` (al final): prueba estática que compara las listas de columnas de las dos sentencias de la vista con `provisional` última; cifras en sitio (`:286` 39→40, `:374-378` 43→44 y 22→23). Rojo: sin tabla, sin vista final.
- [ ] 1.3 GREEN `schema.sql`: editar `:172` en sitio (`false AS provisional`); al final `CREATE TABLE public.clientes_provisionales`, `ALTER TABLE equipos ADD COLUMN IF NOT EXISTS pendiente_validar boolean` (sin calificar) y segundo `CREATE OR REPLACE VIEW public.clients` con `UNION ALL … WHERE enlazado_a IS NULL`. Comentarios sin punto y coma.
- [ ] 1.4 GREEN `migrate.ts`: `clientes_provisionales` al final de `:73` (misma línea).
- [ ] 1.5 GREEN `books/repo.ts` (`:76-78`, `:120`, `:130`, en sitio) y `types.ts` (`provisional?` `:301`, `pendienteValidar?`, `CambioEquipo['campo']` `:555`).
- [ ] 1.6 Mutaciones regla 2 sobre `schema.sql`/`migrate.ts`, una a una, revertir con `git diff`: (m1) quitar `public.` del `CREATE TABLE`; (m2) `ALTER TABLE public.equipos`; (m3) `provisional` fuera del final en una vista; (m4) quitar `false AS provisional` de `:172`; (m5) quitar `WHERE enlazado_a IS NULL`; (m6) quitar la entrada de `PUBLIC_TABLES`. Cada una pone rojo un guardián.
- [ ] 1.7 RED→GREEN `packages/shared/src/altaManual.ts` (nuevo, export al final de `index.ts`): `PREFIJO_PROVISIONAL`, `serialesCoinciden`. Prueba en `altaManual.test.ts` de shared.
- [ ] 1.8 Verificar: `npm test` (zoho-sync) en verde; `getClient` de un id de Books sin cambios (RQ-ZS-09).
- [ ] 1.9 RED `services/altaManual.test.ts`: criterios 1-4 y escenarios TC-30/31, HV-16/17; **C-1:** alta manual en «Equipo nuevo» sin fecha de factura → `422`. Rojo: módulo inexistente.
- [ ] 1.10 GREEN `services/altaManual.ts` (nuevo): `exigirEquipoManual` (A), `exigirClienteProvisional` (A), `validarContenidoAltaManual` (C; respeta C-1), `escribirAltaManual(q, …)`.
- [ ] 1.11 RED P3 (regla 1): serial que no coincide + OV ya usada → `422` y no `409`. Rojo natural: sin comparación; tras GREEN, mover la comparación detrás de `ticketService.ts:96` debe poner rojo.
- [ ] 1.12 GREEN `ticketService.ts` en sitio: `:21` (`actorId`), `:24`, `:25`, `:28` (línea vacía), `:89`, `:91`, `:107`, imports `:5`/`:6`; sin insertar líneas.
- [ ] 1.13 GREEN `equipoNuevo.ts` (`crearTicketConEquipo`, final) llama a `escribirAltaManual`; `db/equipos.ts` (`pendiente_validar` en `createEquipo` y `getEquipo`); `routes/tickets.ts:125` pasa `req.user?.id`.
- [ ] 1.14 RED→GREEN atomicidad: fallo del `INSERT` del ticket no deja `clientes_provisionales`, `equipos` ni `tickets` (TC-31c); espías de Zoho/`books.*` en cero (TC-33).
- [ ] 1.15 Mutación P3: mover la comparación del serial detrás de `:96`, confirmar rojo, revertir.
- [ ] 1.16 **Barrido de citas (regla 4):** `grep -rnoE "(ticketService|schema|migrate|equipoNuevo|repo|equipos|types)\.(ts|sql):[0-9]+(-[0-9]+)?"` + pase abreviado; releer lo que AFIRMAN `schema.sql:169-173` y `ticketService.ts:131`; reparar por caso A/B/C. Luego `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` con 0 bloqueantes.
- [ ] 1.17 Si `registro.test.ts:220` se pone roja, añadir `F1B-15` a la lista «en curso» (orden alfabético, tras `F1B-11`).
- [ ] 1.18 Documental: aplicar C-2 en el delta `specs/hojas-vida/spec.md` RQ-HV-17.
- [ ] 1.19 Cierre: `npm test`, `npm run typecheck`, `npm run lint` (techo 165), `npm run build`; medir líneas y registrarlas.

## Lote 2 — enlace, validación, guarda B y rechazos

- [ ] 2.1 RED `shared/altaManual.test.ts`: `motivoAltaPendiente` (provisional, equipo pendiente, ambos nombrados juntos; ninguno → `null`).
- [ ] 2.2 GREEN `packages/shared/src/altaManual.ts`: `motivoAltaPendiente`.
- [ ] 2.3 RED `ticketService.test.ts` (al final): TS-32 a-d y g. Rojo: `habilitar_servicio` pasa hoy.
- [ ] 2.4 RED P1: ticket pendiente + usuario sin Comercial → `403` de área. RED P2: pendiente + Comercial sin OV obligatoria → `422` de pendiente, no el de `:134`.
- [ ] 2.5 GREEN `ticketService.ts:131` cola: `exigirAltaValidada` tras `exigirVerificacion(gas)` y antes de `:132`; lectura en función nueva **al final**; sin consultas si `t.id !== 'habilitar_servicio'`.
- [ ] 2.6 Mutaciones P1 (guarda antes de `:129`) y P2 (guarda detrás de `:134`): ambas rojo; revertir.
- [ ] 2.7 RED `routes/altaManual.test.ts`: enlace TC-32 a-e (orden `404`·`422`·`403`·`409`), validación HV-18 a-d, espías TC-33. Rojo: rutas inexistentes.
- [ ] 2.8 GREEN `db/clientesProvisionales.ts` y `routes/altaManual.ts` (nuevos): enlace en una `enTransaccion` (`UPDATE … WHERE enlazado_a IS NULL RETURNING`), validación con `registrarEdicion`; montar la ruta.
- [ ] 2.9 RED→GREEN D12: `422` de provisional en `contratos.ts:52`, `prioridad.ts:38`, `equipos.ts:174`; `backfillClientId.ts:103` filtra `provisional = false`; `searchClients` devuelve provisionales marcados.
- [ ] 2.10 Barrido de citas (misma forma que 1.16, más `contratos|prioridad|backfillClientId`) y detector con 0 bloqueantes.
- [ ] 2.11 `registro.test.ts:220`: mantener `F1B-15` en «en curso» si hace falta.
- [ ] 2.12 Cierre: `npm test`, `typecheck`, `lint` (165), `build`; medir y registrar.

## Lote 3 — interfaz (`.tsx` fuera de la red, F0-00: sin rojo previo)

- [ ] 3.1 `CreateTicket.tsx`: modo manual de cliente y equipo, serial doble con aviso, ocultar los tres campos comerciales salvo la fecha de factura en «Equipo nuevo» (C-1).
- [ ] 3.2 `HojaDeVida.tsx`: aviso de pendiente y acciones «Enlazar»/«Validar» sólo a Comercial o admin; `TransitionPanel.tsx` desactiva «Habilitar Servicio»; `src/api/client.ts` (al final).
- [ ] 3.3 **Casilla regla 13** por escrito, decisión por decisión, con línea del servidor (de `design.md` §5, líneas fijadas contra el árbol de hoy): serial doble → `validarContenidoAltaManual`; ocultar campos → `CAMPOS_COMERCIALES_RESTRINGIDOS` `equipoComercial.ts:14`; cinco datos y motivo → `exigirClienteProvisional`; ofrecer equipo existente → `exigirEquipoManual`; no combinar provisional con OV/cliente → `validarContenidoAltaManual`; desactivar «Habilitar» → `exigirAltaValidada`; «Enlazar»/«Validar» → `403` de `routes/altaManual.ts`; etiqueta del buscador → sin imposición (presentación).
- [ ] 3.4 Barrido de citas y detector `--sha HEAD` con 0 bloqueantes; `registro.test.ts:220`.
- [ ] 3.5 Cierre: `npm test`, `typecheck`, `lint` (165), `build`; medir y registrar.

**Instrucción para `archive` (SIN casilla):** al archivar, quitar `F1B-15` de la lista «en curso» de `registro.test.ts:220`. Archivar no la da por hecha.

## Tareas de persona (fuera del recuento; archivar no las da por hechas)

| Tarea | Dueño | Destino |
|---|---|---|
| Q1/Q2 (Anexo D nº 83): quién hace el alta manual y si los cinco datos son el mínimo | Gerencia | `openspec/config.yaml` → `decisiones_de_gerencia` |
| Revertir la vista en producción: `DROP VIEW public.clients` manual, sólo si hay que revertir | Alfonso | `design.md` §10 |
| Verificación en la app tras desplegar (alta manual, enlace, validación, «Habilitar Servicio») | Persona de Comercial | `docs/sdd/` parte de verificación |

## Matriz de cobertura (38 escenarios, 10 requisitos)

| Requisito | Escenarios → tareas |
|---|---|
| RQ-TC-30 | alta 1.9-1.10 · faltan datos 1.9-1.10 · motivo vacío 1.9-1.10 · id no se confunde 1.7, 1.9 |
| RQ-TC-31 | dos marcas 1.9-1.13 · soporte remoto 1.9-1.13 · fallo 1.14 · posición OV 1.11, 1.15 |
| RQ-TC-32 | enlace, sin permiso, fallo a mitad, inexistente, doble 2.7-2.8 |
| RQ-TC-33 | espías 1.14 y 2.7 |
| RQ-HV-16 | serial no coincide, existente, no catalogado, sin texto 1.9-1.10 |
| RQ-HV-17 | reservados, Comercial tampoco 1.9-1.10 (con C-1) · PATCH después 1.9 |
| RQ-HV-18 | correcta, sin permiso, no catalogado, ya validada 2.7-2.8 |
| RQ-TS-32 | provisional, equipo, ambos, tras enlazar, soporte remoto 2.3, 2.5 · posición 2.4, 2.6 |
| RQ-ZS-16 | guardianes en verde 1.2-1.4 · `CREATE` sin calificar 1.6 (m1, m2) |
| RQ-ZS-09 | columnas previas 1.2 · id de Books 1.1 · provisional aparece 1.1 · columna en medio 1.2, 1.6 (m3) |
