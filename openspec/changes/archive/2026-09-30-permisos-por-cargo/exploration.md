## Exploración: permisos-por-cargo (F1C-05, S44, `cierra: no`)

Medido en HEAD `e591454` el 2026-09-30. Preflight: auto · hybrid · ask-on-risk · 800 · strict_tdd. Lo que no
lleva ruta y línea va marcado como «hipótesis». Esta exploración mide; no diseña.

### 1. Alcance decidido y su fuente

| Fuente | Qué fija |
|---|---|
| `openspec/config.yaml:1927-1947` (`decision/c10-permisos-cargo`, 23/09) | La base sigue siendo el área. El cargo SÓLO restringe, con una lista corta de excepciones. Siete cargos. Tres restricciones: Liberación sin factura → Director Comercial; crear OVI de garantía → Director Técnico; prioridad Top 5 → Director Comercial. Propietario del registro: «se decide más adelante» (`:1936`, consecuencia 5 en `:1942`) |
| `config.yaml:2584-2598` (`decision/c10b-gerente-director`, 24/09) | «Gerente comercial» = Director Comercial. Siete cargos con esos nombres exactos (`:2589`); cualquier otro nombre es informal (`:2594`) |
| `config.yaml:2373-2388` (`decision/anexo-33-checkbox`) | «Liberación sin factura», «que sólo ejecuta el Director Comercial» (`:2378`). Motivo y Fecha prevista van en F1C-02, no aquí (`:2388`) |
| `config.yaml:1543-1558` (`decision/ovi-garantia-autor`) | La OVI de garantía la crea el Director Técnico. Su consecuencia (1), `:1551-1552`, dice que «`Director Técnico` existe como cargo en el código» (`transitions.ts:276`): es un string de derivación, no una lista |
| `config.yaml:1949-1962` (`decision/top5-manual`) | La prioridad de los Top 5 la pone el Director Comercial (entre corchetes, tomado como firme por c10, `:1960`) |
| Plan `:178` (fila F1C-05) y `:405` | `:178` ya dice Director Comercial; `:405`, «cerrado sin fleco». `:177` (F1C-04): la regla del resto depende de esa tanda |
| Maestro R08.2 `:1692-1695` (M1.9.1 «Permisos y traspaso») | Por rol, y prioridades «bloqueada su edición por los técnicos». El §3.2 (EN REVISIÓN) no se usa como alcance |

Decidido por el usuario: F1C-05 MÍNIMA antes de F1B-07, y `users.cargo` NO es autoridad.

### 2. Estado actual (medido)

**Cargos en el código.** Sólo dos, como strings de derivación: `packages/shared/src/transitions.ts:276`
(`Director Técnico`) y `:278` (`Coordinador Comercial`). Tipo `{ tipo: 'cargo'; cargo: string }` en
`transitions.ts:52`. No hay lista cerrada. `Director Comercial` en `apps/` y `packages/` (*.ts): 0 aciertos.

**Permiso de transición hoy.** `packages/shared/src/permissions.ts:4-7`: `canExecuteTransition(userAreas, isAdmin,
area)`. El admin pasa todo (`:5`). Es pura y no conoce el cargo.
- Única imposición en servidor: `apps/desk/server/services/ticketService.ts:129-131` (403). Orden: 404 y 409 de
  flujo `:125`, 409 de estado `:126-128`, 403 `:129`; después valores y 422 desde `:132-134`.
- La ruta pasa `req.user!` a `executeTransition` (`apps/desk/server/routes/tickets.ts:193`); la firma de `user`
  está en `ticketService.ts:118` (`{ areas; isAdmin; name?; id? }`). Es el único llamador.
- Otros usos de `canExecuteTransition`, con el literal `'Comercial'` y sin relación con el cargo:
  `routes/contratos.ts:43`, `routes/ovAsociaciones.ts:47`, `shared/src/equipoComercial.ts:32`. Espejo de cliente:
  `apps/desk/src/components/TransitionPanel.tsx:57`; también `ContratosPanel.tsx:24` y `PanelOvAsociaciones.tsx:82`.

**Usuario y cargo.**
- `public.users`: `schema.sql:82-92`. `cargo text` entra por `ALTER` en `:115` (con `empresa` en `:116`): texto libre
  que FIRMA la remisión (`schema.sql:114`, `users.ts:28`).
- Tipo público: `packages/shared/src/types.ts:211-223` (`UserPublic`, `cargo?` en `:221`).
- `USER_SELECT` `auth/users.ts:14`; `rowToPublicUser` `:19-32`; `createUser` `:34-45`; `updateUser` `:83-100`;
  `listPersonas` `:74-81`.
- ⚠️ `getSessionUser` (`auth/sessions.ts:15-25`) NO selecciona ningún cargo (`:17`): `req.user.cargo` llega null.

**Quién lee hoy `users.cargo`** (serían autoridad falsa si se mezclaran):
1. Alarmas SLA: `destinatariosDe` (`apps/desk/server/services/alarmasSla.ts:73-77`) → `destinatariosDeCargo`
   (`apps/desk/server/db/avisos.ts:104-113`), que compara sin mayúsculas ni espacios (`:108-111`) y admite en su
   docstring que es «texto libre que se escribe para firmar la remisión» (`:97-98`). Cargos de las alarmas:
   `packages/shared/src/sla.ts:138-140`; respaldo `sla.ts:119-120`.
2. Derivación en cliente: `apps/desk/src/lib/personas.ts:74-78`, por texto normalizado (aviso en `:33`).
3. Impresión: `users.ts:28-29`, `types.ts:24` y `:220-221`.

**Admin.** `req.user.isAdmin`; middleware `requireAdmin` (`auth/middleware.ts:26-29`). Rutas en
`apps/desk/server/auth/routes.ts`: `POST /api/users` `:55-72`, `PATCH /api/users/:id` `:74-114`, `DELETE` `:129`,
todas con `auth, requireAdmin`. Validación actual del cargo: sólo `trim() || null` (`:68`, `:90`). UI:
`apps/desk/src/components/UsersAdmin.tsx` (texto libre en `:119` y `:170`); cliente HTTP `apps/desk/src/api/client.ts:107`, `:121`.

### 3. Las tres restricciones, dónde se aplican HOY

| Restricción | Existe hoy | Dónde aplicarla |
|---|---|---|
| (a) Liberación sin factura → Director Comercial | SÍ: `transitions.ts:246` (`liberacion_sin_factura`, `from: ['Por Facturar']`, `area: 'Comercial'`); salida `entrega_sin_factura` `:248` | `ticketService.ts:129-131`. No confundir con liberar una OV (`routes/ovAsociaciones.ts:47`) |
| (b) Crear OVI de garantía → Director Técnico | NO como acto: `OVI` sólo es patrón de número (`packages/shared/src/subOV.ts:24-25`; `contratos.ts:12`); `reporte_por_garantia` (`transitions.ts:218`) no crea OVI. El acto es de F1B-03 (`config.yaml:2349`) | Primitiva probada `puedeCrearOVIGarantia` |
| (c) Prioridad Top 5 → Director Comercial | NO: `grep -i 'top ?5'` y `Decisional` en `apps/` y `packages/` = 0 (confirma `config.yaml:1961`) | Primitiva probada `puedeFijarPrioridadTop5` para F1B-07 |

La prioridad tiene hoy una sola fuente: `prioridadAlNacer` (`packages/shared/src/contratos.ts:66`). No hay edición manual.

### 4. Regresión «el cargo sólo restringe»

`apps/desk/server/permisos.test.ts:41-110`: matriz derivada del grafo (`:24-28`); por área, `userCookie([area])`
(`appHarness.ts:91-95`, sin cargo); ticket en `t.from[0]`; esperado `canExecuteTransition([area], false, t.area) ?
200 : 403` (`:64`). Totales a mano `:77-81`: 102 casos, 60/42; el docstring `:73-76` anuncia que F1C-05 los moverá.
Admin por las 34: `:89-109`. Matrices gemelas: `:238,244`, `:321,329`.

⚠️ Con la restricción estricta, Comercial sin cargo pasa de 200 a 403 en `liberacion_sin_factura`: un único caso de
102. El `esperado` de `:64` tiene que conocer la excepción. La matriz de área sin cargo sigue valiendo como suelo, y
una matriz nueva con cargo debe probar que el cargo NUNCA amplía.

### 5. Opciones para «nadie tiene cargo» (no se decide aquí)

| Opción | Efecto | Consecuencia |
|---|---|---|
| A. Estricta: sin cargo no se ejecuta la excepción; sólo admin (`permissions.ts:5`) | La regla se cumple desde el primer día | Comercial no admin sin `liberacion_sin_factura` hasta la asignación |
| B. Respaldo al área mientras nadie activo tenga el cargo (analogía alarmas `alarmasSla.ts:73-76`, `:112-115`) | Nada se rompe al desplegar | No muerde hasta la primera asignación y luego muerde de golpe; exige consulta a BD en la guarda |
| C. Estricta + asignación por migración de datos | Sin hueco | Toca datos de producción (regla de ejecución, punto 3) |
| D. Estricta tras un interruptor que nace cerrado | Código inerte hasta encender | Flag nuevo con `.env.example` y `DEPLOY.md` |

### 6. Aproximaciones

| Aproximación | Pros | Contras | Esfuerzo |
|---|---|---|---|
| **1. Fichero nuevo `packages/shared/src/cargos.ts`** + columna nueva + validación en `routes.ts` + guarda en sitio | No desplaza citas; cumple la regla 13 | El servidor llama a la guarda de cargo aparte | Medio-bajo |
| 2. 4.º parámetro en `canExecuteTransition` | Un solo punto | Cambia una firma con 6 llamadores y ~20 citas | Medio |
| 3. Campo `cargo?` en `Transition` | Declarativo | Desplaza `transitions.ts` (~413 líneas con citas) | Alto |

### 7. Recomendación y puntos de inserción (HOY)

Aproximación 1.

| Pieza | Fichero:línea | Líneas est. |
|---|---|---|
| Lista + excepciones + primitivas + pruebas | `packages/shared/src/cargos.ts` (nuevo) + test; `packages/shared/src/index.ts:3,8` | ~60 + ~130 |
| Migración | `schema.sql`, al final (hoy `:596`); guardián `migrate.test.ts:322-350` | ~8 + ~15 |
| Datos de usuario | `users.ts:14`, `:19-32`, `:34-45`, `:83-100`; `sessions.ts:17`; `types.ts:211-223` | ~25 + ~60 |
| Rutas y validación | `auth/routes.ts:55-72`, `:74-114` en `e591454` | ~20 + ~70 |
| Guarda | `ticketService.ts:129-131` en sitio + firma `:118` | ~6 + ~80 |
| Regresión | `permisos.test.ts:41-110`; `:77-81` | ~100 |
| UI | `UsersAdmin.tsx:119,170` en `e591454`, `client.ts:107,121`, `TransitionPanel.tsx:57` | ~45 (sin red, F0-00) |

Total ~600-700 líneas, 1-2 lotes ≤800; el ledger mide sin renombrado y `verify-report`/`archive-report` suman.

### 8. FUERA de alcance (con fuente)

- Regla de las transiciones Decisionales: depende de F1C-04 (plan `:177`; `config.yaml:1939`); `grep Decisional` = 0.
- Tercer nivel, propietario del registro: aplazado (`config.yaml:1936`, `:1942`); plan `:178` promete tres niveles.
- Migrar alarmas y derivación al cargo nuevo (`destinatariosDeCargo`, `personas.ts`).
- Motivo/Fecha de Liberación sin factura (F1C-02, `config.yaml:2388`).
- Construir la OVI de garantía (F1B-03, `config.yaml:2349`) y la prioridad/Top 5 (F1B-07, `config.yaml:1958`).

### 9. Incumplimientos vivos y ficheros muy citados

- IV-12 sólo si se toca `remision.ts` (no se toca). La fila `ticketService.ts:41-79` no se afecta si `:129-131` se
  edita en sitio. R-4: un solo `tanda: F1C-05`, `cierra: no`.
- Regla de mutación 4 (líneas con cita `<fichero>.ts:N`): `ticketService.ts` 549; `transitions.ts` 413; `schema.sql`
  247 (añadir al final no desplaza); `permisos.test.ts` 57; `permissions.ts` 20; `auth/{routes,users,sessions}.ts` 50.
- Regla 13 / mutación 3: el espejo de `TransitionPanel.tsx:57` consume la función compartida y cada decisión nombra
  su línea de servidor.
- Regla de mutación 1: el nuevo 403 se prueba en POSICIÓN frente al 403 de área y los 409 vecinos.
- Pruebas de interfaz fuera de la red (F0-00): `UsersAdmin.tsx` y `TransitionPanel.tsx` no admiten rojo previo.
