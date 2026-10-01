```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:1c49b3ecb0ae926697c7ffdd5e810f93dae08cd442528b9a6c232af82c4a603d
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 12/12
scenarios: 77/77
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:a5204b8f42f4c8bb0a25fdf07264f620049bafca90c77c0483e22570e6874cbd
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:d9abc5f52938b6817568fdcca995b7d7b95caf96f131742bb5fccf1d942f4e0c
```

## Verification Report

**Change**: `prioridad-top5-cliente` (F1B-07, `cierra: no`)
**Version**: N/A (cuatro deltas: `tickets-core`, `transitions-st`, `permissions`, `vistas-tablero`)
**Mode**: Strict TDD, hybrid. Árbol de `f25c520`, rama `main`, sin cambios rastreados sin commitear (los sin trackear de la cabecera de sesión no son del cambio).

### Veredicto: PASS WITH WARNINGS

0 CRÍTICOS, 4 ADVERTENCIAS, 5 SUGERENCIAS. Los 12 requisitos y los 77 escenarios tienen una prueba que pasó en la ejecución real. Las ADVERTENCIAS no rompen ninguna especificación ejecutable: (W1) la herencia del Top 5 sólo a tickets nuevos frente al «todos» literal de `top5-manual`, declarada como S-1 y sin destino; (W2) un criterio de éxito de `proposal.md` caduco tras el rehecho de S-10; (W3) texto caduco en dos deltas que el archive fusionaría a las specs vivas; (W4) la interfaz nueva no tiene prueba posible, por decisión de F0-00.

### Completeness

| Métrica | Valor |
|---|---|
| Tareas totales (`tasks.md`) | 57 |
| Completas (`[x]`) | 57 |
| Incompletas | 0 (el `grep` de casillas vacías no da nada) |
| Tareas de persona (P.1, P.2, P.3) | fuera del recuento, regla del ciclo 1; archivar no las da por hechas |

### Build & Tests Execution

| Comando | Salida | Exit |
|---|---|---|
| `npm test` | 165 ficheros pasan + 1 omitido (`migrate.integration.test.ts`); **2.206 pruebas pasan + 2 omitidas**; 0 fallos; 106 s | 0 |
| Suites enfocadas de `tasks.md` §Suggested Work Units (lotes 1 y 2, más `transitionExec.test.ts` y `cargoPermiso.test.ts`) | 494 pruebas, 494 pasan, 0 fallos, 111 suites | 0 |
| `npm run typecheck` | `tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit` verde | 0 |
| `npm run lint` | 0 errores, **165 avisos** (techo 165, `eslint.config.js:15`): cero nuevos | 0 |
| `npm run build` | cliente compilado, `built in 1.73s` | 0 |
| `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` | 3.700 citas comprobadas, 0 rotas, 11 abreviadas rotas (preexistentes, informativas), 0 cabeceras R-1 inválidas | 0 |

`npm test` no regeneró `docs/sdd/RECONCILIACION.md` (sin cambios rastreados tras correr todo). **Cobertura:** no medida (el proyecto no tiene herramienta de cobertura en sus comandos); no es fallo.

### Strict TDD (apply-progress)

| Comprobación | Resultado |
|---|---|
| Evidencia RED/GREEN | ✅ en prosa por lote: «Rojos naturales confirmados» y «Nacidos verdes (declarados)» (`apply-progress.md:13`, `:18`, y por lote). Ver S4 |
| Los ficheros de prueba existen | ✅ 11 ficheros `.test.ts` tocados desde `6055c4d` (`+1.098 −25`) |
| GREEN confirmado | ✅ todos pasan hoy (494/494 enfocadas, 2.206 completas) |
| Triangulación | ✅ tablas `it.each` de combinaciones (`contratos.test.ts:219`), cinco prioridades, dos transiciones |
| Posición de guardas (regla de mutación 1) | ✅ cada prueba activa dos guardas a la vez: `guardaPrioridad.test.ts:123`, `:130`, `:137`; `prioridadTop5.test.ts:86`, `:92`, `:99`, `:282`, `:287`, `:292`, `:304` |
| Mutaciones | ✅ declaradas y reproducidas por el orquestador (`apply-progress.md:30`, `:73`); este verify no muta (encargo: no tocar código ni pruebas) |
| Nacidos verdes | ⚠️ declarados con su motivo y con la prueba que los discrimina (`apply-progress.md:18-20`, `:43`, `:58`) |
| `.tsx` | declarado: fuera de la red por F0-00 (`vitest.config.ts:17-20`); **no se cuenta como fallo**. `Top5Panel.tsx`, `PanelPrioridad.tsx` y los cuatro `.tsx` editados no admiten prueba; su respaldo es la tabla de la regla 13 y P.2 |

### Spec Compliance Matrix

Recuento del fichero: tickets-core 5 requisitos / 43 escenarios (RQ-TC-26: 2, RQ-TC-27: 9, RQ-TC-28: 2, RQ-TC-24: 16, RQ-TC-29: 14); transitions-st 3 / 17 (RQ-TS-20: 4, RQ-TS-21: 10, RQ-TS-22: 3); permissions 3 / 7 (RQ-PM-23: 3, RQ-PM-13: 2, RQ-PM-20: 2); vistas-tablero 1 / 10 (RQ-VT-09). **Total 12 / 77**, coincide con el encargo.

Las rutas sin prefijo de cada tabla son las del fichero que se nombra en su encabezado.

#### tickets-core (`prioridadTop5.test.ts` salvo que se indique)

| Req | Escenario | Prueba | Estado |
|---|---|---|---|
| TC-26 | tabla calificada y al final | `migrate.test.ts:537` (calificadas, detrás de la `ALTER` de `schema.sql:601`, `prioridad_ajustes` última) y `:531` | ✅ |
| TC-26 | sentencia sin calificar se rechaza | guardián de identidad `migrate.test.ts:266` (compara `esquema.tabla`, no el nombre pelado); la mutación (g) lo puso en rojo (`apply-progress.md:28`, reproducida `:30`) | ✅ ver S3 |
| TC-27 | Director Comercial fija Top 5 | `:41` (TC27-1) | ✅ |
| TC-27 | administrador fija | `:52` (TC27-2) | ✅ |
| TC-27 | sin permiso, 403 y sin fila | `:58` (TC27-3) | ✅ |
| TC-27 | técnico (Director Técnico) sin permiso | `:65` (TC27-4) | ✅ |
| TC-27 | fuera de la lista blanca | `:70` (TC27-5, `Urgent` y `Alta`) | ✅ |
| TC-27 | Top 5 sin prioridad | `:80` (TC27-6) | ✅ |
| TC-27 | 403 antes que 422 | `:86` (TC27-7, posición) | ✅ |
| TC-27 | quitar el Top 5 | `:104` (TC27-8) | ✅ |
| TC-27 | lectura abierta | `:113`, `:125`, `:134` (TC27-9; sin sesión, 401) | ✅ |
| TC-28 | nadie tiene cargo | `:142` (TC28-1) | ✅ |
| TC-28 | sin lista, el alta es la de hoy | `ticketService.test.ts:1166` (TC28-2) | ✅ |
| TC-24 | contrato vigente, cuerpo `Low` → `High` | `ticketService.test.ts:962` (fila 1) | ✅ |
| TC-24 | contrato vigente sin prioridad → `High` | `ticketService.test.ts:962` (fila 2) | ✅ |
| TC-24 | Comb. 1 · sin contrato y sin Top 5 | `ticketService.test.ts:962` (filas 4-5), `:1166`, `contratos.test.ts:219` | ✅ |
| TC-24 | Comb. 2 · contrato sin Top 5 → `High` | `contratos.test.ts:219`, `ticketService.test.ts:962` | ✅ |
| TC-24 | Comb. 3 · Top 5 sin contrato | `ticketService.test.ts:1121` (TC24-5) | ✅ |
| TC-24 | Comb. 4 · los dos, manda la más alta | `ticketService.test.ts:1127` (TC24-6, `Low` y `High`) | ✅ |
| TC-24 | función pura, orden intercambiado | `packages/shared/src/prioridad.test.ts:27` (`prioridadMasAlta`, pares en los dos sentidos) | ✅ |
| TC-24 | `Urgent` del cuerpo pierde | `ticketService.test.ts:1133` (TC24-8) | ✅ |
| TC-24 | `Urgent` sin contrato ni Top 5 se conserva | `ticketService.test.ts:1142` (TC24-9) | ✅ |
| TC-24 | contrato vencido o no iniciado | `ticketService.test.ts:962` (filas 6-7) | ✅ |
| TC-24 | el día del fin cuenta | `ticketService.test.ts:962` (fila 3, `ACABA_HOY`) | ✅ |
| TC-24 | manda el cliente del ticket (contrato) | `ticketService.test.ts:977` | ✅ |
| TC-24 | Top 5 del cliente del ticket, no el de la OV | `ticketService.test.ts:1148` (TC24-13) | ✅ |
| TC-24 | S-1 marcar no cambia los abiertos | `:180` (TC24-14) y `ticketService.test.ts:1154` | ✅ ver W1 |
| TC-24 | S-9 desmarcar no cambia lo creado | `:187` (TC24-15) y `ticketService.test.ts:1160` | ✅ |
| TC-24 | ticket sin `client_id` no hereda | `ticketService.test.ts:1175` (TC24-16) | ✅ ver S2 |
| TC-29 | ajuste con motivo | `:215` (TC29-1) | ✅ |
| TC-29 | sin motivo, 422 | `:227` (TC29-2) | ✅ |
| TC-29 | valor fuera de la lista | `:237` (TC29-3) | ✅ |
| TC-29 | cliente no Top 5, 409 | `:260` (TC29-4) | ✅ |
| TC-29 | ticket sin `client_id`, 409 | `:269` (TC29-5) | ✅ |
| TC-29 | sin el predicado, 403 | `:275` (TC29-6) | ✅ |
| TC-29 | 409 antes que 403 y 422 (C-3) | `:282` (TC29-7) | ✅ |
| TC-29 | 409 antes que 422 | `:287` (TC29-8) | ✅ |
| TC-29 | ticket inexistente, 404 | `:297` (TC29-9) y `:304` (A < B2) | ✅ |
| TC-29 | no toca `ticket_transitions` ni el SLA | `:309` (TC29-10) | ✅ |
| TC-29 | S-6 congela frente al sincronizador | `:320` (TC29-11) | ✅ |
| TC-29 | atomicidad | `:333` (TC29-12, rastreador de verbos) y `:347` (12b, `CHECK`) | ✅ (pg-mem no revierte, `apply-progress.md:44`) |
| TC-29 | sólo ese ticket cambia | `:353` (TC29-13) | ✅ |
| TC-29 | tabla de trazas calificada y al final | `migrate.test.ts:537` | ✅ |

#### transitions-st (`guardaPrioridad.test.ts` salvo que se indique)

| Req | Escenario | Prueba | Estado |
|---|---|---|---|
| TS-20 | sin `priority` pasa (escalado) | `:114` (it.each, primera fila) y `transitionExec.test.ts:277` | ✅ |
| TS-20 | sin `priority` en la devolución | `:114` (segunda fila) | ✅ |
| TS-20 | el campo sigue declarado | `packages/shared/src/prioridad.test.ts:112` (TS20-3) | ✅ |
| TS-20 | las demás transiciones no cambian | `packages/shared/src/prioridad.test.ts:118` (TS20-4, las 34) | ✅ |
| TS-21 | técnico, 403 (escalado y devolución) | `:50` (TS21-1/2, una `it.each` de dos filas) | ✅ |
| TS-21 | la misma prioridad pasa | `:60` (TS21-3) | ✅ |
| TS-21 | sin el campo pasa | `:66` (TS21-4) | ✅ |
| TS-21 | ticket sin prioridad y campo informado | `:72` (TS21-5) | ✅ |
| TS-21 | administrador cambia | `:79` (TS21-6) | ✅ |
| TS-21 | ambas áreas y Director Comercial | `:85` (TS21-7) | ✅ |
| TS-21 | Director Comercial sin Servicio Técnico | `:91` (TS21-8, el 403 nombra el área) | ✅ |
| TS-21 | nadie tiene cargo | `:98` (TS21-9) | ✅ |
| TS-21 | otras transiciones sin guarda | `:106` (TS21-10) y `packages/shared/src/prioridad.test.ts:154` | ✅ |
| TS-22 | el área gana a la guarda | `:123` (TS22-1) | ✅ |
| TS-22 | la guarda gana al 422 | `:130` (TS22-2) | ✅ |
| TS-22 | el 409 de estado gana | `:137` (TS22-3) | ✅ |

#### permissions

| Req | Escenario | Prueba | Estado |
|---|---|---|---|
| PM-23 | las tres rutas dan el mismo veredicto | `prioridadTop5.test.ts:150` (PUT) y `:359` (POST), nueve sujetos; la guarda de transición, `guardaPrioridad.test.ts:79`, `:85`, `:50` | ✅ |
| PM-23 | Director Comercial sin área Comercial | `prioridadTop5.test.ts:168` y `:377` | ✅ |
| PM-23 | el cargo sin área no concede | `prioridadTop5.test.ts:173` y `:377` (Compras + Director Comercial) | ✅ |
| PM-13 | el cargo de firma no da permiso | `apps/desk/server/cargoPermiso.test.ts:150` (S2) | ✅ |
| PM-13 | migración calificada y detrás de lo de `29f65d1` | `migrate.test.ts:519` (posición 116, única, sin `CHECK`) y `:537` (lo que va detrás) | ✅ |
| PM-20 | por cargo y admin | `packages/shared/src/cargos.test.ts:117` y `:124` | ✅ |
| PM-20 | sólo la del Top 5 tiene llamador | `packages/shared/src/cargos.test.ts:226` (PM20-2, lectura de fuentes) | ✅ |

#### vistas-tablero (`misTickets.test.ts` salvo que se indique)

| Req | Escenario | Prueba | Estado |
|---|---|---|---|
| VT-09 | de más a menos urgente | `:32` (VT09-1), `packages/shared/src/prioridad.test.ts:178`; sobre `/api/mis-tickets`, `:85` | ✅ ver S1 |
| VT-09 | dentro de una prioridad, el habilitado antes | `:38` (VT09-2) y `:99` (en «Mis tickets») | ✅ |
| VT-09 | si se habilitó dos veces, cuenta la última | `:44` (VT09-3, S-10a) | ✅ |
| VT-09 | sin fila de habilitación cuenta la creación | `:51` (VT09-4, S-10b) y `packages/shared/src/prioridad.test.ts:189` | ✅ |
| VT-09 | la urgencia manda sobre la habilitación | `:58` (VT09-5) y `packages/shared/src/prioridad.test.ts:197` | ✅ |
| VT-09 | valor desconocido cuenta como sin prioridad | `:64` (VT09-6) y `packages/shared/src/prioridad.test.ts:201` | ✅ ver S1 |
| VT-09 | sólo los suyos y abiertos | `:85` (VT09-7) | ✅ |
| VT-09 | el tablero se ordena con la misma función | `:32`, `:69` (VT09-8) | ✅ |
| VT-09 | sin N+1 | `:121` (las dos rutas, 3 contra 6 tickets) | ✅ |
| VT-09 | la vista del cliente no reordena | `apps/desk/src/lib/boardView.test.ts` (prueba nueva «mis tickets conserva el orden de entrada», `+9` en `git diff 6055c4d f25c520`) | ✅ |

**Compliance summary:** 77/77 escenarios con prueba que pasó; 12/12 requisitos. Ninguno `UNTESTED` ni `FAILING`.

### Criterios de éxito de `proposal.md:217-225`

| # | Criterio | Evidencia | Estado |
|---|---|---|---|
| 1 | Cuatro combinaciones contrato × Top 5; sin ninguno, la de hoy | `contratos.test.ts:219` (14 filas) y `ticketService.test.ts:962`, `:1121`, `:1127`, `:1166` | ✅ |
| 2 | 403 / 422 / 200 con traza (fijar y ajustar) | `prioridadTop5.test.ts:41-86`, `:215-292` | ✅ |
| 3 | El ajuste no escribe en `ticket_transitions` ni reinicia el SLA | `prioridadTop5.test.ts:309` (TC29-10); `prioridadCliente.ts:93` toca `tickets` y `prioridad_ajustes`, nunca `ticket_transitions` | ✅ |
| 4 | Técnico cambia prioridad → 403; sin `priority` → pasa | `guardaPrioridad.test.ts:50`, `:66`, `:114` | ✅ |
| 5 | Mover la guarda delante del 403 de área o detrás del 422 pone la suite en rojo | pruebas de posición `guardaPrioridad.test.ts:123`, `:130` (cada una activa dos guardas); mutaciones (a)(b)(c) reproducidas por el orquestador (`apply-progress.md:46`); no se re-ejecutaron aquí | ✅ |
| 6 | `GET /api/mis-tickets` ordenado; anular el orden da rojo | `misTickets.test.ts:85`, `:99`; mutaciones (u)-(z) (`apply-progress.md:59-69`, reproducidas `:73`). **El texto del criterio dice «dentro de una prioridad en el orden de hoy», que S-10 rehecho superó** | ✅ ver W2 |

Las casillas de `proposal.md:219-225` siguen sin marcar (S5).

### Regla 13: tabla de `apply-progress.md` («Lote 3», `:82`)

Cada fila contrastada con la línea real del servidor y con la prueba citada. Todas aciertan.

| Decisión del cliente | Línea real del servidor | Prueba citada |
|---|---|---|
| `Top5Panel`: controles sólo con `puedeFijarPrioridadTop5` (`Top5Panel.tsx:20`) | 403 `routes/prioridad.ts:40` ✅ | `prioridadTop5.test.ts:58`, `:65`, `:150` ✅ |
| `<select>` con `PRIORIDADES_ASIGNABLES`; «Quitar» manda `top5:false` | 422 `routes/prioridad.ts:43` ✅ | `:70`, `:80`, `:104` ✅ |
| Enseña `errors[]`, no valida | `routes/prioridad.ts:43` ✅ (`errors`) | `:70` ✅ |
| Lista y recuento = lo que llega, sin tope; la lee cualquier sesión | `routes/prioridad.ts:23` ✅ (`requireAuth`, `listarTop5`) | `:113` ✅ |
| `PanelPrioridad`: «Ajustar» sólo si Top 5 y predicado (`PanelPrioridad.tsx:27`) | 409 `routes/prioridad.ts:68-69` ✅, 403 `:71` ✅ | `:260`, `:269`, `:275`, `:282` ✅ |
| Motivo y prioridad se mandan sin validar | 422 `routes/prioridad.ts:74` ✅ | `:227`-`:253` ✅ |
| Prioridad, Top 5 y ajustes salen de `GET /api/tickets/:id/prioridad` | `routes/prioridad.ts:55-59` ✅, `:50-53` ✅ | `:215` ✅ |
| `TransitionPanel.tsx:160` oculta `priority` sin el predicado | 403 `ticketService.ts:131` ✅ (`cambiaPrioridadSinPermiso`) | `guardaPrioridad.test.ts:51` ✅ |
| El asterisco desaparece (`TransitionPanel.tsx:209` lee `required`) | `transitions.ts:84` ✅ (`required: false`); `transitionExec.ts:77` ✅ | `prioridad.test.ts:112`, `transitionExec.test.ts:277` ✅ |
| «Mis tickets» (`App.tsx:69`) y el tablero, en el orden en que llegan | `routes/prioridad.ts:83-85` ✅, `routes/tickets.ts:115` ✅ | `misTickets.test.ts:32`, `:69`, `:85` ✅; `boardView.test.ts` ✅ |
| Entrada de Configuración visible a cualquiera | `routes/prioridad.ts:23`, `:27` ✅ | `:113` ✅ |
| Heredadas: Usuarios/Roles, «Eliminar ticket» | `auth/routes.ts:51` ✅ (`requireAdmin`), `:154` ✅; `routes/catalogo.ts:64` ✅; `routes/tickets.ts:88` ✅ (`requireSuperAdmin`); `TicketDetailView.tsx:208` ✅ (`user?.isAdmin`) | de sus tandas |
| Heredadas sin servidor: `TicketDetailView.tsx:245` (IV-9, color) y `yaLoTraeElTicket` (`TransitionPanel.tsx:32`) | IV-9 sigue vivo (`CLAUDE.md`, fila «1») | sin cambio |

**«Nadie reordena» comprobado:** `boardView.ts:45` usa `filter` sobre el orden recibido (`esDeMisTickets` importado de `shared`, `boardView.ts:1`). El único orden de tickets es `ordenarColaTaller` (`prioridad.ts:101`), consumido por `colaDelTaller` (`colaTaller.ts:24`), que llaman `routes/tickets.ts:115` y `routes/prioridad.ts:85`. Una sola función de orden y un solo predicado de «Mis tickets» (`prioridad.ts:112`): H5 cerrado.

### S-10a y S-10b contra el texto LITERAL de `decision/e099-orden-cola-taller`

Fuente: `openspec/config.yaml:3269` (clave), respuesta textual `:3274`, consecuencias `:3276-3278`. Frases literales:

- «…la cola de trabajo del taller («Mis tickets» y el tablero) los ordena por **la fecha y hora en que Comercial los habilitó («Habilitar Servicio»)**, no por la fecha de llegada. Este orden se aplica dentro de cada nivel de prioridad: **primero la prioridad** (contrato, Top 5, valoración del cliente) **y, entre tickets de la misma prioridad, el orden de habilitación comercial**.»
- Consecuencia (2): «el orden de habilitación nunca adelanta a un ticket de prioridad mayor.»

| Punto | Código | Lo que dice el texto | Veredicto |
|---|---|---|---|
| Habilitación ascendente dentro de la prioridad | `prioridad.ts:101-109` (`ia - ib`), `colaTaller.ts:14` | «el orden de habilitación»; el spec lo da ascendente (el que Comercial habilitó antes va delante) | ✅ coincide |
| Primero la prioridad, luego la habilitación | `prioridad.ts:103-104` | «primero la prioridad»; consecuencia (2) | ✅ coincide |
| Vale para «Mis tickets» y para el tablero | `routes/prioridad.ts:85`, `routes/tickets.ts:115` | «(«Mis tickets» y el tablero)» | ✅ coincide |
| **S-10a** · si se habilitó dos veces, cuenta la **última** (`MAX(performed_at)`) | `colaTaller.ts:14` | **El texto calla.** La frase exacta, «la fecha y hora en que Comercial los habilitó», habla de un acontecimiento y no dice qué pasa si el ticket vuelve a la espera y se habilita otra vez | Supuesto legítimo, no hallazgo. Probado en `misTickets.test.ts:44` y la mutación (x4) |
| **S-10b** · sin fila de habilitación cuenta `created_time` (`createdAt`); sin ninguna fecha, al final de su prioridad | `prioridad.ts:95-98`, `:106` | **El texto calla** sobre tickets sin habilitación. Frase en tensión: «no por la fecha de llegada». Para un ticket habilitado el código la cumple; para uno sin fila usa la creación, lo más cercano a la llegada | Supuesto legítimo, con observación (S1): que Gerencia confirme el respaldo por creación |
| Qué cuenta como «habilitar» | `colaTaller.ts:14` filtra `habilitar_servicio` (`transitions.ts:178`: sale de OV asignada, Ticket creado y Remisión creada) | La respuesta describe la salida de «Remisión creada»; el código cuenta cualquier ejecución de esa transición | Supuesto no declarado en `proposal.md` (S1); no contradice el texto |

Ningún punto del código **contradice** el texto literal, y el texto **no fija** ninguno de los dos supuestos: por eso no son hallazgo. Lo que E-099 dice de la lista de «Remisión creada» por antigüedad y de los bodegajes queda fuera, registrado como E-108 (`ENTRADA.md:1414`) y F1A-04.

### `decision/top5-manual` (`openspec/config.yaml:1949`, respuesta `:1954`)

Frases literales: «La pone el [Director Comercial], que también mantiene la lista de quiénes son Top 5. **El técnico sigue sin poder editarla**, como dice el plan: el bloqueo es para el técnico, no para ese cargo. Si hace falta que un ticket concreto de un Top 5 vaya distinto, **ese mismo cargo** puede ajustarlo en el ticket con motivo escrito.»

**Guardas, todas con el mismo predicado `puedeFijarPrioridadTop5` (`cargos.ts:80-83`: área Comercial Y cargo Director Comercial; el administrador pasa):**

| Acto | Guarda en el servidor |
|---|---|
| Fijar o quitar Top 5 y su prioridad | `routes/prioridad.ts:40` (403) |
| Ajustar un ticket (con motivo, traza y `managed_by_app`) | `routes/prioridad.ts:71` (403), `:75`; escritura única `prioridadCliente.ts:93` |
| Cambiar la prioridad en `escalado_a_revision` y `devolucion_a_correccion` | `ticketService.ts:131` vía `cambiaPrioridadSinPermiso` (`prioridad.ts:81-86`) |

**No existe excepción del Director Técnico (pregunta 3.b.3, `Preguntas_Gerencia_2026-09-29.md:87`, abierta).** La búsqueda de «Director Técnico» sobre código no de prueba da: `cargos.ts:13` (lista de cargos), `cargos.ts:33` (OVI de garantía), `personas.ts:16` (rótulo), `prioridad.ts:79` (comentario que dice que NO hay excepción) y `transitions.ts:276`. Esta última es la excepción por cargo que exige ser Director Técnico para ejecutar `escalado_a_revision` (anterior a este cambio) y **no concede cambiar la prioridad**: la guarda de `ticketService.ts:131` sigue aplicando a quien la ejecute. Probado por `cargos.test.ts:124` (Servicio Técnico + Director Técnico no cumple el predicado) y `prioridadTop5.test.ts:65` (403).

**Caminos que escriben `tickets.priority` (búsqueda sobre `apps/` y `packages/`, sin pruebas):**

| Camino | Línea | Clasificación |
|---|---|---|
| Ajuste por ticket | `prioridadCliente.ts:93` | **Guardado** (`routes/prioridad.ts:71`) |
| Transición con campo `priority` | `transitionExec.ts:88`, luego `repo.ts:300` | **Guardado** (`ticketService.ts:131`); sólo `escalado_a_revision` y `devolucion_a_correccion` declaran el campo (`transitions.ts:193`, `:195`) |
| Alta de ticket (`createManagedTicket`) | `ticketService.ts:106`, luego `repo.ts:420` | Con Top 5 o contrato, la prioridad del cuerpo no interviene (probado). **Para el resto el alta acepta la prioridad pedida sin lista blanca ni permiso**: comportamiento de hoy, **fuera de alcance declarado** (`proposal.md:127-129`, S-3 y pregunta 3.b). Ver S4 |
| Sincronizador Zoho, `upsertTicket` | `repo.ts:71` (sale si `managed_by_app`) | **Fuera de alcance declarado** (`proposal.md:87`, IV-11): Zoho manda en los tickets no gestionados; los ajustados y los nacidos en la app quedan protegidos por la marca |
| `backfill*`, `resolutions.ts`, `remision.ts:240`, `ovAsociaciones.ts:114`, `sync.ts:319` | n/a | No escriben `priority` (comprobado con la búsqueda de `UPDATE tickets`) |

Ningún camino deja escribir `priority` sin guarda salvo los dos declarados fuera de alcance: **no hay hallazgo CRÍTICO**.

**Contraste con la letra:** «se fija una vez y **todos sus tickets la heredan**». El cambio la aplica **al nacer** (S-1): los tickets abiertos de un cliente que se marca Top 5 conservan su prioridad. Es el único punto donde el texto literal fija más de lo construido (W1).

### Coherence (Design)

| Decisión | ¿Seguida? | Notas |
|---|---|---|
| D-1 `prioridad.ts` nuevo; `prioridadAlNacer` con tercer parámetro | ✅ | `ticketService.ts:106`; `contratos.test.ts:219` |
| D-2 lista blanca igualada a `transitions.ts:84` por una prueba | ✅ | `packages/shared/src/prioridad.test.ts:8` |
| D-3 editar el helper `priority()` | ✅ | `transitions.ts:84`, `required: false` |
| D-4 guarda en `:131`, tras el 403 de cargo | ✅ | y antes del 422 (`ticketService.ts:132-134`); `guardaPrioridad.test.ts:130` |
| D-5 rutas en fichero propio | ✅ | `routes/prioridad.ts` |
| D-6 lectura que falla cerrado | ✅ | `prioridad.ts:34-36` |
| D-7 `CHECK (motivo <> '')` | ✅ | `schema.sql:618`; `migrate.test.ts:553` y `prioridadTop5.test.ts:347` |
| D-8 guarda sólo si la transición declara `priority` | ✅ | `prioridad.ts:82` |
| D-9 ajuste igual a la actual: 422 | ✅ | `prioridad.ts:71`; `prioridadTop5.test.ts:247` |
| §12 una función de orden, una consulta, sin N+1 | ✅ | `colaTaller.ts:14`, `:21-25`; `misTickets.test.ts:121` |
| §12 respaldo `createdAt` en lugar de `createdTime` | ✅ desviación declarada | `apply-progress.md:70` |
| Edición en sitio o al final (regla 4) | ✅ | `schema.sql:606`, `:613`, `:622` van al final; `transitions.ts:84` y `ticketService.ts:131` en sitio |

### Cabecera R-1 y `cierra: no`

`proposal.md:1-9` lleva los siete campos y el detector da 0 cabeceras inválidas: `tanda: F1B-07`, `motivo: ""` (no hace falta, no es `fuera-del-plan`), `capacidad` de cuatro, `maestro` de tres pasajes, `cierra: no`, `toca_maestro: si`, `origen_cabecera: declarada`. **`cierra: no` está sostenido** por lo que queda fuera (`proposal.md:71-87`): la calificación de los clientes sin contrato ni Top 5 y quién ajusta fuera del Top 5 (pregunta 3.b, `Preguntas_Gerencia_2026-09-29.md:87`), la «fecha promesa» (E-093), la propagación a los tickets abiertos (E-109, `ENTRADA.md:1422`) y la lista de «Remisión creada» por antigüedad (E-108, `ENTRADA.md:1414`).

### Issues Found

**CRÍTICOS:** ninguno.

**ADVERTENCIAS**
- **W1 · «Todos sus tickets la heredan» se cumple sólo para los nuevos.** `config.yaml:1954` dice «se fija una vez y todos sus tickets la heredan»; el cambio aplica la prioridad al nacer (`ticketService.ts:106`) y los tickets abiertos que ya existan no cambian (S-1, `proposal.md:119-124`; prueba `prioridadTop5.test.ts:180`). Está declarado, con el ajuste por ticket como salida y un punto abierto con dueño Gerencia (E-109, `ENTRADA.md:1422`); `design.md:185-193` lo anota como riesgo. No lo corrige el verify: lo decide Gerencia. Debe constar en el `archive-report` y en el paquete de despliegue.
- **W2 · Criterio de éxito caduco.** `proposal.md:224-225` pide «dentro de una prioridad en el orden de hoy», lo que S-10 rehecho (`proposal.md:138-150`) y el alcance 8 (`proposal.md:63-69`) superaron: el orden dentro de la prioridad es la habilitación comercial. El código y las pruebas siguen S-10, no el criterio.
- **W3 · Texto caduco en dos deltas, que el archive fusionaría a las specs vivas.** `specs/tickets-core/spec.md:313-314` dice «No se ordena y `boardView.ts` no se toca» y `specs/transitions-st/spec.md:127` dice «Orden de «Mis tickets»: sin decisión». Los dos contradicen `specs/vistas-tablero/spec.md` (RQ-VT-09) y el código (`boardView.ts:45`, `routes/prioridad.ts:83-85`). Quien archive debe quitarlas o reescribirlas al fusionar.
- **W4 · Sin pruebas de interfaz, por decisión de F0-00.** `Top5Panel.tsx`, `PanelPrioridad.tsx`, `client.ts:706-757` y los cuatro `.tsx` editados no tienen prueba posible (`vitest.config.ts:17-20`). Se declara, no cuenta como fallo; el respaldo es la tabla de la regla 13 (verificada arriba) y P.2 (verificación manual tras desplegar).

**SUGERENCIAS**
- **S1 · Supuestos de E-099 sin declarar.** (i) `colaTaller.ts:14` cuenta cualquier `habilitar_servicio`, no sólo la salida de «Remisión creada» que describe la respuesta; (ii) `prioridad.ts:96` usa `habilitadoAt ?? createdAt`: si `habilitadoAt` llegara no nulo pero inválido no caería a `createdAt` (hoy no ocurre: lo produce `colaTaller.ts:16` con `toISOString`); (iii) S-10b reintroduce la fecha de llegada para tickets sin habilitar, frente a «no por la fecha de llegada». Merecen una línea en el parte para que Gerencia los confirme. Además VT09-1 y VT09-6 corren sobre `/api/tickets`; sobre `/api/mis-tickets` hay VT09-7 y la habilitación (`misTickets.test.ts:85`, `:99`), suficiente porque la función es la misma.
- **S2 · TC24-16 es débil.** `ticketService.test.ts:1175` comprueba el helper con `null` y que marcar un cliente no toca un ticket insertado a mano; el alta no puede producir un ticket sin `client_id` (`ticketService.ts:106`, `clientId!`). Cubre el escenario tal como está redactado, pero no discrimina nada del alta.
- **S3 · «Sin calificar se rechaza» (TC-26) no es un fixture permanente de fichero ensuciado.** Lo cubre el guardián de identidad `migrate.test.ts:266`, que la mutación (g) puso en rojo (`apply-progress.md:28`). Regla de mutación 2 satisfecha por mutación puntual, no por fixture sintético.
- **S4 · Formato de la evidencia TDD y alta sin lista blanca.** `apply-progress.md` (104 líneas, contra el «≤ 60» de `tasks.md:68`) lleva la evidencia RED/GREEN en prosa por lote y no en una tabla; el contenido es suficiente y verificable. Aparte, el alta sigue aceptando cualquier cadena de prioridad en clientes sin contrato ni Top 5 (`ticketService.ts:106`): ya registrado como 3.b, se repite porque `top5-manual` dice «el técnico sigue sin poder editarla».
- **S5 · Casillas de `proposal.md:219-225` sin marcar.** Las marca el archive o el orquestador; no es defecto del código.

### Verdict

**PASS WITH WARNINGS.** Los 77 escenarios de los 12 requisitos pasan en ejecución real; la suite completa (2.206), `typecheck`, `lint` (165 avisos) y `build` están en verde; la regla 13 se verificó fila a fila; y ni S-10a/S-10b ni `top5-manual` contradicen el código salvo la herencia a tickets existentes (W1, declarada y abierta). Apto para `sdd-archive` si Gerencia acepta W1 y el archive corrige W2 y W3 al fusionar.
