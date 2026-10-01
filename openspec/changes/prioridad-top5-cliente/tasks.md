# Tasks — `prioridad-top5-cliente` (F1B-07, parte decidida, `cierra: no`)

**Entradas:** `proposal.md`, `exploration.md`, `design.md`, `specs/{tickets-core,transitions-st,permissions,vistas-tablero}/spec.md` de esta carpeta (**12 requisitos y 73 escenarios**, recontados del fichero: tickets-core 5/43, transitions-st 3/17, permissions 3/7, vistas-tablero 1/6; eran 10/65 antes de la corrección C-1 y 11/67 antes de la C-10). Preflight (`openspec/config.yaml:25-30`, gana): `auto · hybrid · ask-on-risk · 800 líneas · strict_tdd`.
`strict_tdd` activo: cada tarea de código va precedida de su prueba en rojo y de un «confirmar rojo natural»; lo que nace verde se declara en `apply-progress.md`. Los `.tsx` están fuera de la red de pruebas (F0-00, `vitest.config.ts:16-20`): sin RED/GREEN, no se propone `jsdom`.
Puntos de inserción leídos el 2026-09-30 contra el árbol de HEAD `6055c4d`; lo no ejecutado va marcado «hipótesis». Base sin ejecutar: no se ha corrido la suite.

## Correcciones al delta, a la propuesta y al diseño (prevalecen sobre ellos)

- **C-1 · RQ-PM-13 (hecha en el delta).** `specs/permissions/spec.md` gana `### Requirement: RQ-PM-13` en `## MODIFIED Requirements`, copiado de la spec viva (`openspec/specs/permissions/spec.md:249-264`). Cambia el escenario «la migración está calificada y al final» (vivo `:260-263`): pasa a exigir la `ALTER` calificada, sin `CHECK`, y última de las sentencias que existían en `29f65d1` (nada insertado por delante). Se ajustó además la frase del cuerpo («al final de `schema.sql`») porque contradecía al escenario. RQ-PM-20 modificado ya quita «hoy no las llama nadie» (sólo queda dentro del «Previously»).
- **C-2 · Dos escenarios sobre «la última tabla» se contradicen.** RQ-TC-26 dice que `cliente_prioridad` es la última `CREATE TABLE`; RQ-TC-29 dice que lo es `prioridad_ajustes`. Manda el diseño (`design.md` §2: `cliente_prioridad` y detrás `prioridad_ajustes`): se prueba que ambas van calificadas, detrás de la `ALTER` de `cargo_permiso`, en ese orden, y que `prioridad_ajustes` es la última. **RESUELTO por el orquestador en el delta (2026-09-30):** el delta ya dice lo mismo que el diseño.
- **C-3 · Orden de la escalera del ajuste.** RQ-TC-29 (cuerpo y escenario «403 antes que 409 y que 422») pone `403` antes que `409`; `design.md` §3 pone **B₁ `409` (cliente no Top 5) antes que B₂ `403`**, por el precedente «estado antes que permiso» (`ticketService.test.ts:137-141`) y su mutación (k). Manda el diseño: la prueba espera `409` para «sin permiso + cliente no Top 5». **Recomendación: corregir ese escenario del delta antes del `verify`**; no se toca aquí. **RESUELTO por el orquestador en el delta (2026-09-30):** el delta ya dice lo mismo que el diseño.
- **C-4 · Las dos tablas nacen en el lote 1.** La propuesta pone `prioridad_ajustes` en el lote 2. Una sola edición del guardián (35→37 y 22→24, `migrate.ts:73`) y de `schema.sql` evita tocar dos veces el mismo punto; el lote 2 sólo la consume (RQ-TC-29, escenario de calificación, se cubre en 1.7).
- **C-5 · `cargos.ts:78` y `cargos.test.ts:117` pasan al lote 1.** El primer llamador de `puedeFijarPrioridadTop5` es el `PUT` del lote 1, y desde ahí «HOY NO LA LLAMA NADIE» miente. El diseño (§10) sólo nombraba `cargos.ts:78`; el título «HOY NO LAS LLAMA NADIE» de `cargos.test.ts:117` no estaba. `cargos.ts:69` (OVI, sigue sin llamador) no cambia.
- **C-6 · «Modo de prioridad» vive en `apps/desk/src/board.ts`, no en `server/`.** La columna sin prioridad se llama «Otra prioridad» (`board.ts:35`; reparto en `:45`). `board.ts:41` es `const p = t.priority`. Corregido en `proposal.md` (segundo cambio visible) y en la nota de despliegue de abajo.
- **C-7 · Pruebas existentes afectadas** (lista del diseño §5, corregida): cambian `ticketService.test.ts:109`, `:120` y los comentarios `ticketService.test.ts:70-71` y `contratoErrores.test.ts:64`; **no cambian** `tickets.test.ts:52`, `transitionExec.test.ts:136-138` (sólo se añade una prueba al final), `valoresDeTransicion.test.ts:157`, `permisos.test.ts:41-66` (detector de la mutación d).
- **C-8 · Las combinaciones del alta se añaden AL FINAL de `ticketService.test.ts`** (tras `:1109`), no en un fichero nuevo: los ayudantes `equipo()`, `cliente()`, `CAMPOS_OK`, `contratoDe`, `VIGENTE` (`:950-959`) no se exportan. El Top 5 se siembra por SQL directo, así que esas pruebas sólo dependen del esquema.
- **C-9 · Orden de GREEN en el lote 2.** `transitions.ts:84` (`required: false`) va ANTES que la guarda: con la guarda y `required: true`, la matriz `permisos.test.ts:41-66` mandaría `priority` al técnico y pondría 403 donde espera 200.
- **C-10 · «Mis tickets» entra en alcance (corrección de lectura del maestro, 2026-10-01).** El plan daba el orden por no acordado y llamaba a M1.9.1 «`[EN REVISIÓN]`» (la vieja 3.9). Las dos cosas eran falsas: `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.2.md:1711` está en M1.9.1, fuera del único apartado en revisión (el §3.2, `:2946-3122`), y el §1.8 lo recoge como decisión del 14/08 (`:781`). Entra: orden por urgencia en el servidor con prueba (`design.md` §12, RQ-VT-09, bloque C del lote 2 y 3.4b del lote 3). Queda fuera el desempate por fecha promesa (S-10; E-093 en `docs/sdd/ENTRADA.md`, ya escrita en el commit de esta corrección). **No** entra la excepción del Director Técnico fuera de los Top 5 (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.2.md:1709`): es la pregunta 3.b.3 (`docs/sdd/Preguntas_Gerencia_2026-09-29.md:87`) y `decision/c10-permisos-cargo` cierra la lista en tres (`openspec/config.yaml:1932-1934`). Su consecuencia, el hueco de «Otra prioridad», va al diseño (§6) y a la nota de despliegue (2.b).

**Matriz de amenazas de la skill:** N/A (`design.md` «Threat Matrix»: sin enrutado de procesos, shell ni VCS). Los casos de contenido hostil que sí hay (prioridad `Urgent`/`Alta`/mayúsculas, motivo vacío o de espacios, valor sucio en base) son RED explícitos: 1.1, 1.12, 2.2, 2.10.

## Review Workload Forecast

Medida de cada lote: `git add -N <nuevos>` + `git diff --shortstat --no-renames HEAD -- <ficheros del lote>` **más** `wc -l` de su `apply-progress.md` (≤ 60 líneas, contadas DENTRO de su lote). Una edición en sitio cuenta `+n −n`. El ledger mide sin detección de renombrado.

| Lote | Código | Pruebas | `apply-progress` | Total estimado | Margen a 800 | Depende |
|---|---|---|---|---|---|---|
| 1 · Dominio, esquema, datos del cliente y alta | ~210 (`prioridad.ts` ~70, `schema.sql` +25, `db/prioridadCliente.ts` ~50, `routes/prioridad.ts` ~45, resto en sitio ±20) | ~330 (`prioridad.test.ts` ~90, `prioridadTop5.test.ts` ~130, `ticketService.test.ts` +~55, `migrate.test.ts` ~+45, `contratos.test.ts` ~+35, `cargos.test.ts` +~20) | ~60 | **~600** | ~200 | — |
| 2 · Ajuste, guarda y «Mis tickets» | ~125 (`prioridad.ts` +35 +~15, `db` +40, `routes` +30 +~20, `transitions.ts` ±1, `ticketService.ts` ±2, `boardView.ts` ±2) | ~385 (`guardaPrioridad.test.ts` ~110, `prioridadTop5.test.ts` +~110, `prioridad.test.ts` +~45 +~35, `misTickets.test.ts` ~80, `boardView.test.ts` +~10, fixtures ±15) | ~60 | **~570** | ~230 | 1 |
| 3 · Interfaz y cierre | ~280 (`Top5Panel.tsx` ~120, `PanelPrioridad.tsx` ~90, `client.ts` +~45, `App.tsx` ±~5, resto ±20) | 0 | ~60 (incluye la casilla de la regla 13) | **~400** (~340 del diseño + ~60 de texto R08.3 y entrada de la bandeja) | ~400 | 2 |
| **Total** | | | | **~1.570** (era ~1.390; +~180 por C-10) | | |

```text
Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High
```

- La etiqueta literal dice «400-line»; el techo real es **800 por lote** (`review_budget_lines`) y la entrega es **commit directo a `main`**, un commit por lote, en serie. **Ningún lote pasa de 800**: el riesgo es Alto porque el lote 1 (~600) y el 2 (~570, tras C-10) pasan de 400. Ninguno llega a la válvula de 720 en la estimación, pero el 2 tiene ~150 de margen: si su estimación previa al intento pasa de 720, se parte ANTES de escribir (el bloque C, «Mis tickets», es separable: sólo depende de `RANGO` del lote 1). Como ninguno pasa de 800 no hay decisión previa al apply.
- **Válvula:** si tras el GREEN de un lote el acumulado medido supera **90 % del techo (720)**, se para y se declara. Las mutaciones no añaden líneas (se revierten); `apply-progress.md` sí.
- **Previsión de `verify`** (intento aparte, sin tocar código): **~320 líneas de `verify-report.md`** (73 escenarios y tres lotes). Cabe en 800, pero hay que sumarlo.
- **Previsión de `archive`** (intento aparte; el ledger mide sin renombrado, así que la carpeta cuenta dos veces):

| Concepto | Líneas |
|---|---|
| Carpeta que se mueve: `proposal` ~215, `exploration` 43, `design` ~320, specs ~580 (319+127+~75+~60), `tasks` ~360, `apply-progress` ~180 (3 × ~60), `verify-report` ~320, `archive-report` ~150 | ~2.170 |
| Contada dos veces (`git mv` sin `-M`) | ~4.340 |
| Fusión del delta en `tickets-core`, `transitions-st`, `permissions` y `vistas-tablero` vivas (RQ-TC-24, RQ-PM-13 y RQ-PM-20 modificados; RQ-TC-26..29, RQ-TS-20..22, RQ-PM-23 y RQ-VT-09 nuevos) | ~500 (**se mide, no se estima**: worktree aislado, un minuto) |
| **Total previsto** | **~4.850** (± 450; re-estimado el 2026-10-01 con C-10) |

**El archive NO cabe en 800 (excede unas 6 veces) y necesita aprobación de techo de mantenedor**, como `detector-citas-extremos` y `permisos-por-cargo`. Con C-10 los **5.000** que se pedían dejan sólo ~150 de margen, menos que la incertidumbre: se piden **5.500** (~650 de margen), y la cifra se vuelve a medir antes del archive. La justificación no es el tamaño: ~4.340 son un `git mv` verbatim de carga de revisión cero; lo revisable son ~500 de fusión más el `archive-report`.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | `prioridad.ts`, «la más alta» en `prioridadAlNacer`, tablas, datos y rutas `GET/PUT` del cliente, herencia al nacer | commit 1 | `npx vitest run packages/shared/src/prioridad.test.ts packages/shared/src/contratos.test.ts packages/shared/src/cargos.test.ts packages/zoho-sync/src/db/migrate.test.ts apps/desk/server/prioridadTop5.test.ts apps/desk/server/services/ticketService.test.ts` | pg-mem + supertest (`appHarness`) | `git revert`; las tablas quedan (aditivas, vacías, sólo las lee este código). **Primer lote con efecto vivo** pero con lista vacía: la prioridad al nacer no cambia |
| 2 | `priority` opcional, guarda de servidor, ajuste con motivo y traza; «Mis tickets» ordenado en el servidor | commit 2 | `npx vitest run apps/desk/server/services/guardaPrioridad.test.ts apps/desk/server/prioridadTop5.test.ts apps/desk/server/permisos.test.ts packages/shared/src/prioridad.test.ts apps/desk/server/misTickets.test.ts apps/desk/src/lib/boardView.test.ts` | pg-mem + supertest | `git revert`; devolver `required: true` a `transitions.ts:84` y quitar la guarda restaura las transiciones. **Segundo efecto vivo:** el técnico pierde la prioridad en dos transiciones |
| 3 | `Top5Panel`, `PanelPrioridad`, `TransitionPanel`, regla 13 escrita, barrido de la regla 4, texto R08.3 | commit 3 | `npm run typecheck && npm run build` (`.tsx` fuera de la red) | N/A para `.tsx` (F0-00); verificación manual en P.2 | `git revert`; UI y documentación, el servidor sigue imponiendo |

**Convenciones de todos los lotes.**
- «En sitio» = mismo número de líneas; «al final» = sólo inserciones. El cierre de cada lote lo comprueba con `git diff --numstat HEAD -- <fichero>` y `wc -l`.
- Barrido de la regla de mutación 4 al cierre de cada lote sobre los ficheros que tocó: `grep -rnoE "<fichero>\.(ts|tsx|sql):[0-9]+(-[0-9]+)?" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=archive`, más segundo pase para la forma abreviada; los DOS extremos de cada rango; se LEE qué afirma cada cita (A presente / B histórico / C superado).
- Tras cada cierre: `npm test`, `npm run typecheck`, `npm run lint` (techo de avisos **165 sin holgura**, `eslint.config.js:15`: cero avisos nuevos, ningún `any`) y `apply-progress.md` (≤ 60 líneas). Si `auth/routes.test.ts` da timeout intermitente es E-091: se relanza y se anota.
- Una tanda SDD por árbol (regla del ciclo 2): los tres lotes, `verify` y `archive` van **en serie**, cada uno en su intento del ledger.

## Fase 0 · Preparación (orquestador; sin código)

- [ ] 0.1 `git rev-parse --short HEAD` (esperado `6055c4d`) y `git status --short` (sólo los sin trackear de la cabecera de sesión y `openspec/changes/prioridad-top5-cliente/`).
- [ ] 0.2 Línea base verde: `npm test`, `npm run typecheck`, `npm run lint`. Anotar en `apply-progress.md` nº de ficheros de prueba, de pruebas y de **avisos de eslint** (techo 165).
- [ ] 0.3 Re-medir largos antes de escribir (hoy, entre paréntesis; si un fichero sale MAYOR, alguien añadió citas): `schema.sql` (**601**), `migrate.ts` (131), `migrate.test.ts` (**525**), `index.ts` (**25**), `contratos.ts` (242), `contratos.test.ts` (217), `cargos.ts` (98), `cargos.test.ts` (208), `transitions.ts` (397), `ticketService.ts` (**234**), `ticketService.test.ts` (**1109**), `transitionExec.test.ts` (274), `contratoErrores.test.ts` (86), `app.ts` (96), `client.ts` (704), `TransitionPanel.tsx` (267), `TicketDetailView.tsx` (420), `Configuracion.tsx` (244). Dos valores que hay que MEDIR y escribir como literal: (i) el nº de sentencias de `schemaStatements()` hoy (**N**; la `ALTER` de `cargo_permiso` es la número N−1 en base 0) y (ii) la lista «transición → claves obligatorias» de las 34, **antes** de tocar `transitions.ts:84`.
- [ ] 0.4 Grep de base: `puedeFijarPrioridadTop5(` fuera de `*.test.ts` = sólo su definición (`cargos.ts:80`); `cliente_prioridad|prioridad_ajustes|Top5` en `apps/` y `packages/` fuera de `cargos*` = 0.

---

## Lote 1 · Dominio, esquema, datos del cliente y alta

**Estimación ~600.** **Depende de:** —.

**Puntos de inserción (medidos hoy)**

| Fichero | Punto | Tipo |
|---|---|---|
| `packages/shared/src/prioridad.ts` | fichero nuevo (parte 1: lista, orden, «la más alta», `prioridadTop5`, `prioridadClienteDelCuerpo`) | NUEVO |
| `packages/shared/src/prioridad.test.ts` | fichero nuevo | NUEVO |
| `packages/shared/src/index.ts` (25) | `:26` nueva: `export * from './prioridad'` | FINAL |
| `packages/shared/src/contratos.ts` (242) — **muy citado** (`:65-68`, 7 citas) | `:10` se añade `; import { prioridadMasAlta } from './prioridad'` (tras `clasificarOV`); `:65` (comentario) se reescribe; `:66-69` pasa de 4 a 4 líneas (`const delCliente`, `return`) | EN SITIO |
| `packages/shared/src/contratos.test.ts` (217) | `:77` y `:79` ganan `, null`; tabla de verdad nueva AL FINAL | EN SITIO + FINAL |
| `packages/shared/src/cargos.ts` (98) | `:78` («HOY NO LA LLAMA NADIE … F1B-07») se reescribe; `:69` (OVI) no cambia | EN SITIO |
| `packages/shared/src/cargos.test.ts` (208) | `:117` (título) se reescribe; prueba de llamadores AL FINAL | EN SITIO + FINAL |
| `packages/zoho-sync/src/db/schema.sql` (601; última sentencia `:601`, `ALTER … cargo_permiso`) | tras `:601`: línea en blanco, comentario ASCII sin tildes y **sin `;`** (el troceo de `migrate.ts` es por `;`), `CREATE TABLE IF NOT EXISTS public.cliente_prioridad`, `public.prioridad_ajustes` y `CREATE INDEX IF NOT EXISTS idx_prioridad_ajustes_ticket` (~+25) | FINAL |
| `packages/zoho-sync/src/db/migrate.ts` (131) | `:73` (última línea de `PUBLIC_TABLES`) se añade `, 'cliente_prioridad', 'prioridad_ajustes'` | EN SITIO |
| `packages/zoho-sync/src/db/migrate.test.ts` (525) | `:282` título y `:283-286` (35→**37**, `[10, 22, 3]`→`[10, 24, 3]`); `:515-524` (comentario, título y cuerpo de la prueba de la `ALTER`) se reescriben; pruebas nuevas AL FINAL (tras `:525`). Los `ALTER` (`:374-378`) no cambian | EN SITIO + FINAL |
| `apps/desk/server/db/prioridadCliente.ts` | fichero nuevo: `filaPrioridadCliente`, `prioridadTop5DelCliente`, `listarTop5`, `fijarPrioridadCliente` | NUEVO |
| `apps/desk/server/routes/prioridad.ts` | fichero nuevo: `GET /api/top5`, `GET` y `PUT /api/clients/:id/prioridad` | NUEVO |
| `apps/desk/server/app.ts` (96) | `:22` se añade el import con `;`; `:61` se añade `; registerPrioridadRoutes(app, { db })` | EN SITIO |
| `apps/desk/server/services/ticketService.ts` (234) — **muy citado** (586 líneas con cita) | `:5` se añade `; import { prioridadTop5DelCliente } from '../db/prioridadCliente'`; `:106` pasa a `priority: prioridadAlNacer(b.prioridad, await hayContratoVigente(db, clientId!), await prioridadTop5DelCliente(db, clientId!)),` | EN SITIO, **cero líneas insertadas** |
| `apps/desk/server/prioridadTop5.test.ts` | fichero nuevo (rutas del cliente) | NUEVO |
| `apps/desk/server/services/ticketService.test.ts` (1109) | combinaciones del alta AL FINAL (tras `:1109`), reutilizando `:950-959` | FINAL |

### Bloque A · Dominio puro (RQ-TC-24 nivel puro, RQ-TC-27 validador)

- [ ] 1.1 RED — `prioridad.test.ts` (nuevo), `npx vitest run packages/shared/src/prioridad.test.ts`: lista literal `['High','Medium','Low']` **igual** a las opciones del campo `target: 'priority'` de `escalado_a_revision` (`transitions.ts:84`); `esPrioridadAsignable` exacto (`'high'`, `'Alta'`, `'Urgent'`, `''`, `7` → `false`); `prioridadMasAlta` (tabla: `High`/`Medium`, intercambiadas → `High` en ambos órdenes; `Urgent` gana a `High` (S-3); desconocida pierde; `null`+`null` → `null`; empate → `a`); `prioridadTop5` (`null`, `{top5:false,…}`, valor sucio en base `'Alta'` → `null`, `{top5:true,prioridad:'Low'}` → `'Low'`); `prioridadClienteDelCuerpo` (`top5` no booleano → error; `true` sin prioridad → error; `true` + `'Urgent'`/`'Alta'` → error; `false` → `prioridad: null` aunque venga valor, S-9; cuerpo no objeto → error). Cubre TC24-7, TC24-8 (nivel puro), TC27-5, TC27-6.
- [ ] 1.2 RED — `contratos.test.ts`: `:77` y `:79` en sitio (`prioridadAlNacer(pedida, true, null)`); AL FINAL `it.each` de la tabla del diseño §1: contrato {sí, no} × Top 5 {`null`, `Low`, `Medium`, `High`} × pedida {`Low`, `undefined`, `Urgent`}: sin ambos → la pedida (hoy); contrato → `High`; Top 5 sin contrato → el del Top 5; los dos → `High`; `Urgent` pedida pierde. Cubre TC24-3 a TC24-6 y TC24-8.
- [ ] 1.3 Confirmar rojo natural: `./prioridad` no existe (todo rojo por importación) y la tabla nueva sale roja (la función de hoy ignora el tercer argumento). **Nacen verdes y se declaran:** los cuatro casos viejos de `contratos.test.ts:77` y `:79` (el argumento de más se ignora; vitest no tipa).
- [ ] 1.4 GREEN — `prioridad.ts` (parte 1, `design.md` §1) sin `any`; `index.ts:26` al final.
- [ ] 1.5 GREEN — `contratos.ts:10`, `:65`, `:66-69` en sitio. Comprobar `git diff --numstat` = `+n −n` y `wc -l` 242 sin cambio. Confirmar 1.1-1.2 en verde; `npm run typecheck` (el tercer parámetro es obligatorio: sólo `ticketService.ts:106` llama a la función, se arregla en 1.17, así que el typecheck queda rojo hasta entonces y se declara).
- [ ] 1.6 MUTACIÓN **(f)** — `prioridadMasAlta` devuelve `b`: ROJO en la tabla (fila contrato + `Low`); **(n)** — `'Alta'` dentro de `PRIORIDADES_ASIGNABLES`: ROJO en la igualdad con `transitions.ts:84`; **(f2)** — `Urgent` fuera de `RANGO`: ROJO en «`Urgent` gana a `High`»; revertir las tres.

### Bloque B · Esquema (regla de mutación 2: se ensucia el fichero vigilado)

- [ ] 1.7 RED — `migrate.test.ts`, comando `npx vitest run packages/zoho-sync/src/db/migrate.test.ts`: (a) `:282-286` en sitio a **37** y `[10, 24, 3]`; (b) `:515-524` reescrita en sitio (C-1, RQ-PM-13): localizar la sentencia que contiene `cargo_permiso`, **una sola**, `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS cargo_permiso text`, calificada, sin `CHECK`, y su posición en `schemaStatements()` es el literal **N−1** medido en 0.3 (nada insertado delante); (c) AL FINAL: las dos tablas existen tras `migrate` (`information_schema`), ambas `CREATE TABLE` van calificadas `public.` y **detrás** de la `ALTER` de `cargo_permiso`, `cliente_prioridad` antes de `prioridad_ajustes`, y `prioridad_ajustes` es la última `CREATE TABLE` (C-2; TC26-1, TC29-14); el `CHECK` rechaza `motivo = ''` con un `INSERT` directo (D-7); un `INSERT … ON CONFLICT (client_id) DO UPDATE` repetido deja una fila. Cubre TC26-1, TC26-2 (vía 1.10), TC29-14, PM13-2.
- [ ] 1.8 Confirmar rojo natural (recuentos 35≠37, tablas inexistentes). **Nace verde y se declara:** (b), la `ALTER` ya es la N−1 y sigue siéndolo; es el suelo de PM13-2 y se discrimina con la mutación (o). **Hipótesis a comprobar:** pg-mem admite `CONSTRAINT <nombre> CHECK (…)` a nivel de columna y `ON CONFLICT … DO UPDATE`; si no, plan B: `CONSTRAINT` a nivel de tabla (precedente `schema.sql:570`) y `UPDATE` + `INSERT` en la capa de datos.
- [ ] 1.9 GREEN — `schema.sql` tras `:601` y `migrate.ts:73`. Confirmar 1.7 en verde, `migrate.integration.test.ts` sin cambios, `schema.sql` 601 → 601+N con `−0`, `migrate.ts` 131 → 131.
- [ ] 1.10 MUTACIÓN **(g)** (regla 2) — `CREATE TABLE IF NOT EXISTS cliente_prioridad` **sin calificar** en `schema.sql`: ROJO en `migrate.test.ts:266-275` y `:286`; **(h)** — quitar el `CHECK` del motivo: ROJO en «motivo vacío rechazado»; **(o, POSICIÓN)** — insertar una sentencia cualquiera ANTES de la `ALTER` de `cargo_permiso`: ROJO en la posición N−1 de 1.7(b); **(p, POSICIÓN)** — intercambiar el orden de las dos tablas: ROJO en 1.7(c). Revertir; `git diff` limpio.

### Bloque C · Datos, rutas y alta (RQ-TC-24, RQ-TC-27, RQ-TC-28, RQ-PM-20, RQ-PM-23 del `PUT`)

- [ ] 1.11 RED — `prioridadTop5.test.ts` (nuevo), `npx vitest run apps/desk/server/prioridadTop5.test.ts` (`appWith()`, `adminCookie()`, `userCookie(areas, cargoPermiso)`): **TC27-1** Director Comercial (`Comercial`) fija `top5:true`,`Medium` → 200 y fila con `actualizado_por` y `actualizado_at`; **TC27-2** admin → 200; **TC27-3** `Coordinador Comercial` → 403 y sin fila; **TC27-4** `Servicio Técnico` + `Director Técnico` → 403; **TC27-5** `Urgent`/`Alta` → 422 sin fila; **TC27-6** `top5:true` sin prioridad → 422; **TC27-7 (posición)** sin permiso + prioridad inválida → **403**, no 422; **TC27-8** `top5:false` → 200 y deja de ser Top 5; **TC27-9** `GET` abierto a sesión sin cargo; cliente inexistente → 404 **con el mensaje propio** (el comodín de `app.ts:73` también da 404: comparar el cuerpo); **TC28-1** base sin cargos: no admin `Comercial` 403 y admin 200; **PM23-1** nueve sujetos (siete cargos, sin cargo, admin) con área `Comercial` sobre el `PUT`: sólo Director Comercial y admin → 200; **PM23-2** `Director Comercial` sólo con `Servicio Técnico` → 403; **PM23-3** `Compras` + `Director Comercial` → 403; **TC24-14 (mitad)** dos tickets abiertos `Low` del cliente conservan `Low` tras marcarlo Top 5 `High`; **TC24-15 (mitad)** desmarcar no cambia un ticket ya `High`.
- [ ] 1.12 RED — `cargos.test.ts` AL FINAL (**PM20-2**): recorre `apps/` y `packages/` sin `*.test.ts` y comprueba que `puedeFijarPrioridadTop5(` tiene ≥ 1 llamador fuera de `cargos.ts` y que `puedeCrearOVIGarantia(` tiene 0 (hipótesis: `node:fs` funciona en `environment: 'node'`, `vitest.config.ts:16`).
- [ ] 1.13 RED — `ticketService.test.ts` AL FINAL (C-8), Top 5 sembrado por SQL en `public.cliente_prioridad`: **TC24-5** Comb. 3 (Top 5 `Medium`, cuerpo `Low` → `Medium`); **TC24-6** Comb. 4 (contrato + Top 5 `Low` → `High`; `High` → `High`); **TC24-8** `Urgent` del cuerpo pierde ante Top 5 y ante contrato; **TC24-9** `Urgent` sin nada se conserva; **TC24-13** Top 5 de A y alta de B con OV de A → sin herencia; **TC24-14 (mitad)** ticket creado después del Top 5 nace `High`; **TC24-15 (mitad)** tras desmarcar, alta sin contrato toma el cuerpo; **TC24-16** `prioridadTop5DelCliente(db, null)` → `null`, y marcar un cliente no toca un ticket sin `client_id`; **TC28-2** sin filas en `cliente_prioridad`, `Low` → `Low`.
- [ ] 1.14 Confirmar rojo natural (rutas inexistentes: 404 del comodín; el alta ignora el Top 5). **Nacen verdes y se declaran:** TC24-1, TC24-2, TC24-3, TC24-4, TC24-10, TC24-11, TC24-12 (`ticketService.test.ts:961-982` ya los fija), TC28-2 y TC27-9 (404 sólo si se compara el mensaje: entonces es rojo).
- [ ] 1.15 GREEN — `db/prioridadCliente.ts` (consultas sin calificar, `public` está en `search_path`, como `db/contratos.ts:6-8`): `filaPrioridadCliente`, `prioridadTop5DelCliente` (delega en `prioridadTop5`), `listarTop5` (join con `public.clients`), `fijarPrioridadCliente` (upsert; plan B de 1.8 si hace falta). Sin `any`.
- [ ] 1.16 GREEN — `routes/prioridad.ts` con la escalera de `design.md` §3: `PUT` = A 404 (`getClient`) < B 403 (`puedeFijarPrioridadTop5(req.user)`, se CONSUME) < C 422 (`prioridadClienteDelCuerpo`); `app.ts:22`, `:61` en sitio.
- [ ] 1.17 GREEN — `ticketService.ts:5` y `:106` en sitio. Comprobar `wc -l` = 234 y `git diff --numstat` = `+2 −2`; `npm run typecheck` vuelve a verde.
- [ ] 1.18 GREEN — `cargos.ts:78` y `cargos.test.ts:117` en sitio (C-5); confirmar 1.11-1.13 en verde.
- [ ] 1.19 MUTACIÓN **(e)** — pasar `null` como tercer argumento en `ticketService.ts:106`: ROJO en TC24-5 y TC24-6; **(m, POSICIÓN)** — el 404 del `PUT` detrás del 403: ROJO en «cliente inexistente + sin cargo → 404» (añadir ese caso a 1.11 si no está); **(p2, POSICIÓN)** — el 422 del `PUT` antes del 403: ROJO en TC27-7; **(q)** — el `PUT` decide con `canExecuteTransition(…, 'Comercial')` en vez del predicado: ROJO en TC27-3 y PM23-1; **(r)** — quitar la llamada al predicado de la ruta: ROJO en PM20-2 y en TC27-3; revertir todas.
- [ ] 1.20 Cierre del lote 1: comando enfocado de la tabla; `npm test`; `npm run typecheck`; `npm run lint` (≤ 165, cero avisos nuevos); medir (nuevos: `prioridad.ts`, `prioridad.test.ts`, `db/prioridadCliente.ts`, `routes/prioridad.ts`, `prioridadTop5.test.ts`); recuentos (`contratos.ts` 242, `ticketService.ts` 234, `migrate.ts` 131, `app.ts` 96 sin cambio de largo; `index.ts` 25 → 26 con `−0`; `schema.sql` 601 → 601+N con `−0`); **barrido regla 4** sobre `contratos.ts` (`:65-68`, 7 citas: ahora afirman «High si hay contrato», deben decir «la más alta»), `ticketService.ts:106` (citas del alta), `schema.sql`, `migrate.ts:70`, `migrate.test.ts`, `cargos.ts`, `index.ts`; `apply-progress.md` (~60 líneas, con los nacidos verdes y el resultado de la hipótesis de 1.8).

---

## Lote 2 · Ajuste, guarda del técnico y «Mis tickets»

**Estimación ~570** (era ~410; +~160 del bloque C por C-10). **Depende de:** Lote 1. **Es el lote con el segundo efecto vivo** (el técnico pierde la prioridad en dos transiciones) **y el tercero** («Mis tickets» llega ordenado del servidor; el cliente lo consume en el lote 3).

**Puntos de inserción (medidos hoy)**

| Fichero | Punto | Tipo |
|---|---|---|
| `packages/shared/src/prioridad.ts` | parte 2 AL FINAL: `MENSAJE_PRIORIDAD_BLOQUEADA`, `ajusteDelCuerpo`, `cambiaPrioridadSinPermiso` | FINAL |
| `packages/shared/src/transitions.ts` (397) — **muy citado** (433 líneas con cita; `:83-84`, `:193`: 5) | `:84` (`priority()`): `required: true` → `false`, misma línea | EN SITIO |
| `apps/desk/server/services/ticketService.ts` (234) | `:6` se añaden `cambiaPrioridadSinPermiso, MENSAJE_PRIORIDAD_BLOQUEADA` al import; **`:131`** (línea larga con `// Escalón B (F1C-05)` al final): ANTES de ese comentario se añade `if (cambiaPrioridadSinPermiso(t, b.values, current.row.priority ?? null, user)) throw new HttpError(403, { error: MENSAJE_PRIORIDAD_BLOQUEADA });`. `:129-130` y `:132-134` no cambian | EN SITIO, **cero líneas insertadas** |
| `apps/desk/server/db/prioridadCliente.ts` | AL FINAL: `ticketParaAjuste`, `ajustesDelTicket`, `ajustarPrioridad` (con `enTransaccion`, `db/transaccion.ts:13`) | FINAL |
| `apps/desk/server/routes/prioridad.ts` | AL FINAL: `GET` y `POST /api/tickets/:id/prioridad` | FINAL |
| `apps/desk/server/services/guardaPrioridad.test.ts` | fichero nuevo | NUEVO |
| `apps/desk/server/prioridadTop5.test.ts` | pruebas del ajuste AL FINAL | FINAL |
| `packages/shared/src/prioridad.test.ts` | pruebas de la parte 2 y de RQ-TS-20 AL FINAL | FINAL |
| `apps/desk/server/transitionExec.test.ts` (274) | una prueba «sin prioridad no da error» AL FINAL (`:136-138` no se toca) | FINAL |
| `apps/desk/server/services/ticketService.test.ts` (1109+) | `:70-71` comentario, `:104-105` y `:109` (obligatorios en lista), `:120` (valores del técnico) | EN SITIO |
| `apps/desk/server/contratoErrores.test.ts` (86) | `:64` comentario («único obligatorio: Días de entrega») | EN SITIO |
| `packages/shared/src/prioridad.ts` | parte 3 AL FINAL: `ordenarPorUrgencia`, `esDeMisTickets` (`design.md` §12) | FINAL |
| `apps/desk/server/routes/prioridad.ts` | AL FINAL: `GET /api/mis-tickets` | FINAL |
| `apps/desk/server/misTickets.test.ts` | fichero nuevo | NUEVO |
| `apps/desk/src/lib/boardView.ts` (59) — citado por `CLAUDE.md` y `vistas-tablero` | `:1` el import gana `esDeMisTickets` (misma línea); `:45` pasa a `? tickets.filter((t) => esDeMisTickets(t, userId))` | EN SITIO |
| `apps/desk/src/lib/boardView.test.ts` | prueba de orden de `mios` AL FINAL | FINAL |

**Plan B de la guarda** (sólo si `apply` rechaza la forma en sitio de `:131`): dos líneas nuevas tras `:131` desplazarían `:132-134` (12 citas de `ticketService.ts:131`); se declara y se barre.

### Bloque A · `priority` opcional y guarda (RQ-TS-20, RQ-TS-21, RQ-TS-22)

- [ ] 2.1 Capturar el literal de 0.3 (ii): lista «transición → claves obligatorias» de las 34, **antes** de tocar `transitions.ts:84`; se pega como literal en la prueba (así «sólo difiere `priority` en esas dos» discrimina).
- [ ] 2.2 RED — `prioridad.test.ts` AL FINAL, `npx vitest run packages/shared/src/prioridad.test.ts`: **TS20-3** `priority` sigue en las dos transiciones con `target:'priority'`, opciones `High/Medium/Low` y no obligatorio; **TS20-4** el literal de 2.1 sin `priority` en esas dos y sin otra diferencia; `ajusteDelCuerpo` (motivo con espacios recortado; vacío o sólo espacios → error; `Urgent`/`Alta` → error; igual a la actual → error (D-9); motivo y prioridad malos a la vez → **dos** errores en `errors[]`; válido → `{ok, prioridad, motivo}`); `cambiaPrioridadSinPermiso` (tabla: transición sin campo `priority` → `false` aunque venga valor (D-8, **TS21-10**); ausente o `''` → `false`; igual a la actual → `false`; distinta + sin permiso → `true`; actual `null` + `'Medium'` → `true` (**TS21-5**); admin → `false`; `Comercial`+`ST` + `Director Comercial` → `false`; `ST` + `Director Comercial` sin `Comercial` → `true`).
- [ ] 2.3 RED — `transitionExec.test.ts` AL FINAL: `buildTransitionPlan(escalado, { comment:'x', 'Días de entrega':'20' }).errors` vacío (**TS20-1**, nivel puro).
- [ ] 2.4 RED — `guardaPrioridad.test.ts` (nuevo; patrón de `ticketService.test.ts:33-63`: pg-mem, `executeTransition`, sujetos `ADMIN`, `SERVICIO`, `COMERCIAL` y `DC_AMBAS = {areas:['Servicio Técnico','Comercial'], cargoPermiso:'Director Comercial'}`), `npx vitest run apps/desk/server/services/guardaPrioridad.test.ts`: **TS21-1** técnico `Low`→`High` en `escalado_a_revision` → 403 y sin cambio de estado, prioridad ni fila en `ticket_transitions`; **TS21-2** ídem en `devolucion_a_correccion`; **TS21-3** misma prioridad pasa; **TS21-4** sin campo pasa; **TS21-5** actual `null` + `Medium` → 403; **TS21-6** admin cambia; **TS21-7** `DC_AMBAS` cambia; **TS21-8** `Comercial` solo + `Director Comercial` → 403 **de área**; **TS21-9** base sin cargos; **TS21-10** otra transición con `priority` en el cuerpo: no interviene; **TS20-1/2** sin `priority` pasa en las dos; **TS22-1 (posición)** usuario sin `Servicio Técnico` con `priority` distinta → el 403 **nombra el área**; **TS22-2 (posición)** técnico con `{priority:'Low'}` **sin** `Días de entrega` → 403 de prioridad, no 422; **TS22-3 (posición)** ticket en `Ingresado` y técnico con `priority` distinta → 409.
- [ ] 2.5 RED — ajustes de fixtures (C-7), comandos `npx vitest run apps/desk/server/services/ticketService.test.ts apps/desk/server/contratoErrores.test.ts`: `ticketService.test.ts:70-71` (comentario: «con un campo obligatorio (`Días de entrega`)»); `:104-105` y `:109` en sitio → `habilitar_servicio` desde `STATUS_TICKET_CREADO` (ya importado en `:4`) con `values: {}`, que tiene dos obligatorios: conserva «TODOS en una lista» (leer los dos textos exactos al escribir); `:120` → `values: { 'Días de entrega': 5 }` (el técnico ya no manda `priority`; sin el cambio saldría 422 por «Falta … Prioridad»); `contratoErrores.test.ts:64` en sitio (sus `ADMIN` pasan la guarda, `:72`, `:82`). `:74` `VALORES_ESCALADO` no cambia: lo usan `ADMIN` y `COMERCIAL` (área gana).
- [ ] 2.6 Confirmar rojo natural: TS21-1/2/5 (hoy 200: no hay guarda), TS20-1/2 (hoy 422 por «Prioridad»), TS22-2 (hoy 422), `:120` (hoy 422), literal de 2.1. **Nacen verdes y se declaran:** TS21-3, TS21-6, TS21-7, TS21-8, TS21-10, TS22-1 (`ticketService.test.ts:96-101` ya fija el área), TS22-3 y `:109` reescrita.
- [ ] 2.7 GREEN — `transitions.ts:84` en sitio (C-9: primero, antes que la guarda). Confirmar `permisos.test.ts:41-66` en verde (el técnico ya no manda `priority`: `valoresValidos` salta los no obligatorios, `appHarness.ts:74`) y `git diff --numstat` = `+1 −1`.
- [ ] 2.8 GREEN — `prioridad.ts` parte 2 (`design.md` §1); `ticketService.ts:6` y `:131` en sitio. Comprobar `wc -l` = 234, `git diff --numstat` = `+2 −2` en total con el lote 1, `:129-130` y `:132-134` intactos. **Hipótesis:** `current.row.priority` es `string | null` (si `tsc` se queja, se ajusta el tipo en sitio y se declara). Confirmar 2.2-2.5 en verde.
- [ ] 2.9 MUTACIÓN **(a, POSICIÓN)** — guarda de prioridad ANTES de `:129`: ROJO en TS22-1 (mensaje de área) y en `ticketService.test.ts:96-101`; **(b, POSICIÓN)** — guarda DETRÁS de `:134`: ROJO en TS22-2 (llega 422); **(c, POSICIÓN)** — guarda ANTES de `:126`: ROJO en TS22-3 (esperado 409); **(d)** — `required: true` de vuelta en `transitions.ts:84`: ROJO en `permisos.test.ts:41-66` (Servicio Técnico recibe 403 en el escalado) y en TS20-1; **(s)** — quitar la condición D-8 (la guarda actúa sin campo `priority`): ROJO en TS21-10; revertir todas. El orden entre las dos 403 de `:131` es **inobservable** (la única excepción de cargo no tiene campo de prioridad): se deja escrito en `apply-progress.md`.

### Bloque B · Ajuste por ticket (RQ-TC-29, RQ-PM-23 del `POST`)

- [ ] 2.10 RED — `prioridadTop5.test.ts` AL FINAL (`npx vitest run apps/desk/server/prioridadTop5.test.ts`): **TC29-1** ajuste con motivo → 200, prioridad nueva y fila en `prioridad_ajustes` (anterior, nueva, motivo, autor, fecha); **TC29-2** sin motivo o de espacios → 422, sin cambio ni traza; **TC29-3** `Urgent` → 422; **TC29-4** cliente sin fila o con `top5:false` → 409; **TC29-5** ticket sin `client_id` → 409; **TC29-6** `Coordinador Comercial` → 403 sin cambio; **TC29-7 (corregido por C-3, POSICIÓN)** sin permiso + cliente no Top 5 + sin motivo → **409** (el 409 gana al 403); **TC29-8 (POSICIÓN)** con permiso + cliente no Top 5 + sin motivo → 409, no 422; **(403<422, POSICIÓN)** sin permiso + Top 5 + sin motivo → 403; **TC29-9** ticket inexistente → 404 **con el mensaje propio** y **(A<B, POSICIÓN)** inexistente + sin cargo → 404; **TC29-10** `ticket_transitions` no gana fila y el instante de entrada que lee `db/sla.ts:88-98` es el mismo; **TC29-11** ticket con `managed_by_app=false` → `true` tras ajustar, y un `upsertTicket` posterior con otra prioridad no la pisa (`repo.ts:71`); **TC29-12** `ajustarPrioridad` con motivo `''` (el `CHECK` lo rechaza en la base) deja `priority` y `managed_by_app` como estaban; **TC29-13** el otro ticket del cliente conserva su prioridad; **PM23-1** nueve sujetos sobre el `POST`: sólo Director Comercial y admin → 200; **PM23-2/3** `Director Comercial` sin `Comercial` y `Compras` + `Director Comercial` → 403; `GET /api/tickets/:id/prioridad` devuelve prioridad, `top5` y ajustes.
- [ ] 2.11 Confirmar rojo natural (rutas inexistentes: el comodín responde 404; se compara el cuerpo). **Nacen verdes y se declaran:** ninguno salvo las comparaciones de «sin cambio» que no dependen de la ruta (se anotan).
- [ ] 2.12 GREEN — `db/prioridadCliente.ts` (`ticketParaAjuste`: `id, client_id, priority`; `ajustarPrioridad` en `enTransaccion`: `UPDATE tickets SET priority=$2, managed_by_app=true, source='app', modified_time=now(), updated_at=now()` como `repo.ts:298` + `INSERT INTO prioridad_ajustes`; **no** escribe `ticket_transitions`; no toca `upsertTicket`, `TICKET_COLS` ni el sincronizador, IV-11) y `routes/prioridad.ts` con la escalera de `design.md` §3: A 404 < B₁ 409 < B₂ 403 < C 422 (`ajusteDelCuerpo`, todos en `errors[]`). Confirmar 2.10 en verde.
- [ ] 2.13 MUTACIÓN **(i)** — ajuste sin `managed_by_app=true`: ROJO en TC29-11; **(j)** — el ajuste escribe en `ticket_transitions`: ROJO en TC29-10; **(k, POSICIÓN)** — 403 del ajuste antes del 409: ROJO en TC29-7; **(k2, POSICIÓN)** — 422 antes del 409: ROJO en TC29-8; **(l, POSICIÓN)** — 422 antes del 403: ROJO en «sin permiso + Top 5 + sin motivo → 403»; **(m2, POSICIÓN)** — 404 del `POST` detrás del 403: ROJO en «inexistente + sin cargo → 404»; **(t)** — `UPDATE` fuera de `enTransaccion`: ROJO en TC29-12; revertir todas.
### Bloque C · «Mis tickets» ordenado en el servidor (RQ-VT-09; C-10)

- [ ] 2.14 RED — `prioridad.test.ts` AL FINAL: `ordenarPorUrgencia` con `[Low, null, Urgent, Medium, High]` → `[Urgent, High, Medium, Low, null]`; `'Alta'`, `''` y `null` al final y entre ellos en el orden de entrada; dos `High` conservan su orden de entrada (estable); la entrada no se muta; `esDeMisTickets` → `false` para cerrado, para derivado a otro y para `derivado: null`, `true` para abierto derivado al usuario.
- [ ] 2.15 RED — `misTickets.test.ts` (nuevo; pg-mem + supertest con `appWith()`), `npx vitest run apps/desk/server/misTickets.test.ts`: los seis escenarios de RQ-VT-09 (urgencia; desempate por `created_time` descendente como `repo.ts:151`; desconocidos como sin prioridad; sólo abiertos y derivados al usuario; **`GET /api/tickets` conserva el orden de hoy**; la forma de cada ticket es la de `GET /api/tickets`, `esperandoAprobacionCliente` incluido); sin sesión → 401. RED en `boardView.test.ts` AL FINAL: `applyBoardView(lista, 'mios', now, 'u1')` devuelve los del usuario **en el orden de entrada** (lista sembrada en orden no cronológico).
- [ ] 2.16 Confirmar rojo natural (`ordenarPorUrgencia` y `esDeMisTickets` no existen; la ruta da el 404 del comodín, `app.ts:73`). **Nacen verdes y se declaran:** «el listado general no cambia» y la prueba de orden de `boardView.test.ts` (`filter` ya es estable): las dos se discriminan con las mutaciones (y) y (z).
- [ ] 2.17 GREEN — `prioridad.ts` parte 3; `routes/prioridad.ts` AL FINAL; `boardView.ts:1` y `:45` en sitio (`wc -l` 59 sin cambio, `git diff --numstat` `+2 −2`). Confirmar 2.14-2.15 en verde y `boardView.test.ts` entero en verde.
- [ ] 2.18 MUTACIÓN **(u)** `ordenarPorUrgencia` devuelve la copia sin ordenar → ROJO en «de más a menos urgente»; **(v)** `Urgent` por debajo de `High` en `RANGO` → ROJO; **(w)** quitar `esDeMisTickets` de la ruta → ROJO en «sólo los suyos»; **(x)** desempate por `created_time` ascendente → ROJO en «el orden de hoy»; **(y)** `ORDER BY` por prioridad en `repo.ts:151` → ROJO en «el listado general no cambia»; **(z)** `boardView.ts:45` ordena por fecha tras filtrar → ROJO en la prueba de orden de `boardView.test.ts`; revertir todas.
- [ ] 2.19 Cierre del lote 2: comando enfocado de la tabla; `npm test`; `npm run typecheck`; `npm run lint` (≤ 165, cero avisos nuevos); medir (nuevo: `guardaPrioridad.test.ts`); recuentos (`ticketService.ts` 234 sin cambio de largo, `transitions.ts` 397, `boardView.ts` 59, `contratoErrores.test.ts` 86; `git diff --numstat` de esos tres = `+n −n`); **barrido regla 4** sobre `ticketService.ts` (`:106` y `:131`, 12 citas: el orden pasa a «… 403 cargo · 403 prioridad · 422»), `transitions.ts` (`:83-84`, `:193`: `priority` ya no es obligatorio), `ticketService.test.ts`; comprobar que `permisos.test.ts:30` sigue citando el 403 de área y que `ticketService.test.ts:96-101` es el mismo texto; `apply-progress.md` (~60 líneas).

---

## Lote 3 · Interfaz y cierre

**Estimación ~400** (era ~380; +~10 de «Mis tickets» y +~10 de la entrada E-094). **Depende de:** Lote 2. `apps/desk/src` está fuera de la red de pruebas (F0-00): sin RED/GREEN para `.tsx`; **no se propone `jsdom`**.

**Puntos de inserción (medidos hoy)**

| Fichero | Punto | Tipo |
|---|---|---|
| `apps/desk/src/api/client.ts` (704; contratos en `:673-704`) | funciones y tipos nuevos AL FINAL (tras `:704`): lista Top 5, prioridad del cliente (`GET`/`PUT`), prioridad y ajustes del ticket (`GET`/`POST`) | FINAL |
| `apps/desk/src/components/Top5Panel.tsx` | fichero nuevo: buscador de Books (`searchClients`, `client.ts:185`), lista con recuento (S-7), controles sólo si `puedeFijarPrioridadTop5(user)` | NUEVO |
| `apps/desk/src/components/PanelPrioridad.tsx` | fichero nuevo: prioridad del ticket, Top 5 del cliente, ajustes y «Ajustar» con motivo | NUEVO |
| `apps/desk/src/components/Configuracion.tsx` (244) | `:2` import con `;`; `:33` el tipo de `section` gana `'top5'`; `:127` entrada «Clientes Top 5 y prioridad» tras «Contratos por lote», con `;`; `:165` `if (section === 'top5') return <Top5Panel onVolver={…} />` con `;` | EN SITIO |
| `apps/desk/src/components/TicketDetailView.tsx` (420) | `:15` import con `;`; `:320` `{ticket && <PanelPrioridad ticketId={ticketId} />}` junto a `MarcaContrato` | EN SITIO |
| `apps/desk/src/components/TransitionPanel.tsx` (267) | `:8` el import gana `puedeFijarPrioridadTop5`; `:160` pasa a `active.fields.filter((f) => f.target !== 'priority' \|\| (!!user && puedeFijarPrioridadTop5(user))).map((f) => (`. `:56-57` (citado por `CLAUDE.md`) no se mueve | EN SITIO |
| `docs/sdd/R08.3_Expediente_de_cambios.md` (742) | texto para el expediente, AL FINAL, sin tocar el `.docx` | FINAL |
| `apps/desk/src/App.tsx` | la vista `mios` usa la lista de `GET /api/mis-tickets` (`:75`, `:78`; punto exacto, hipótesis hasta leerlo entero) | EN SITIO |
| `docs/sdd/ENTRADA.md` (1289 tras E-093, escrita en el commit de C-10) | entrada nueva AL FINAL (**E-094**, hipótesis: se vuelve a leer la última antes de numerar) | FINAL |

### Bloque A · Cliente

- [ ] 3.1 `client.ts` AL FINAL y `Top5Panel.tsx` (nuevo): lista de Top 5 con su prioridad y recuento («N clientes», sin tope, S-7), buscador con `searchClients`; `<select>` con `PRIORIDADES_ASIGNABLES` importado de `@ambientalia/shared`; «Quitar Top 5»; los controles sólo se ven si `puedeFijarPrioridadTop5(user)`; ante un error manda y enseña `errors[]` del servidor, no valida por su cuenta.
- [ ] 3.2 `Configuracion.tsx` `:2`, `:33`, `:127`, `:165` en sitio (sin mover líneas; la entrada la ve cualquiera, la lectura es abierta).
- [ ] 3.3 `PanelPrioridad.tsx` (nuevo) y `TicketDetailView.tsx:15`, `:320` en sitio: enseña prioridad, `top5` del cliente y ajustes; «Ajustar» sólo si el cliente es Top 5 y `puedeFijarPrioridadTop5(user)`; motivo obligatorio se manda al servidor (el cliente no valida motivo ni igualdad).
- [ ] 3.4 `TransitionPanel.tsx:8` y `:160` en sitio: el campo `priority` no se ofrece a quien no cumple el predicado; el asterisco desaparece solo (`:209` lee `required`, que ya es `false` en `transitions.ts:84`). **Hipótesis a comprobar en P.2:** el administrador ve el campo opcional y, si no lo toca, no manda `priority` (el servidor trata `''` como ausente, 2.2).
- [ ] 3.4b `client.ts` AL FINAL `fetchMisTickets()` y `App.tsx` en sitio: con la vista `mios`, el tablero enseña la lista de `GET /api/mis-tickets` tal como llega (C-10, `design.md` §12). El cliente no ordena ni vuelve a filtrar por su cuenta: `applyBoardView` ya consume `esDeMisTickets` (lote 2) y `filter` conserva el orden.
- [ ] 3.5 Sin prueba posible (F0-00): `npm run typecheck`, `npm run build` y `npm run lint` (≤ 165) en verde. La imposición está probada en node: lotes 1 y 2.

### Bloque B · Cierre

- [ ] 3.6 **Regla de mutación 3 — casilla de la regla 13, decisión a decisión** (se escribe en `apply-progress.md` con la línea REAL leída al cerrar, no la del diseño). Se lee cada `.tsx` tocado entero y se enumera lo que el cliente bloquea, rellena solo o avisa:
  | Decisión del cliente | Línea del servidor que la impone (a confirmar) |
  |---|---|
  | `Top5Panel` enseña los controles de edición sólo si `puedeFijarPrioridadTop5(user)` | 403 del `PUT /api/clients/:id/prioridad` (`routes/prioridad.ts`, línea real); probado por TC27-3, TC27-4, PM23-1 → comodidad legítima (punto 3) |
  | El `<select>` ofrece `PRIORIDADES_ASIGNABLES` y «Quitar Top 5» manda `top5:false` | 422 de `prioridadClienteDelCuerpo` en el mismo `PUT` (TC27-5, TC27-6) |
  | `PanelPrioridad` enseña «Ajustar» sólo si el cliente es Top 5 y el usuario cumple el predicado | 409 y 403 del `POST /api/tickets/:id/prioridad` (TC29-4, TC29-6, TC29-7) |
  | `PanelPrioridad` no valida motivo ni igualdad: manda y enseña `errors[]` | 422 de `ajusteDelCuerpo` (TC29-2, TC29-3) |
  | `TransitionPanel` oculta el campo `priority` a quien no cumple el predicado | 403 de `ticketService.ts:131` (TS21-1, TS21-2) |
  | El asterisco de Prioridad desaparece | `transitions.ts:84` (TS20-3), fuente única |
  | La entrada de Configuración y la lista Top 5 las ve cualquiera | `requireAuth` de `GET /api/top5` (TC27-9): lectura abierta por diseño |
  | «Mis tickets» se enseña en el orden en que llega, sin reordenar | `GET /api/mis-tickets` (`routes/prioridad.ts`, línea real), RQ-VT-09 en `misTickets.test.ts` |
  | Cualquier otra decisión que aparezca al leer los ficheros | — |
  Sin línea, la decisión es la guarda: se para y se declara.
- [ ] 3.7 **Barrido de la regla de mutación 4 de los tres lotes** sobre CADA fichero muy citado tocado, con el comando de las convenciones y segundo pase para la forma abreviada: `ticketService.ts` (`:106`, `:131`), `transitions.ts` (`:83-84`, `:193`), `contratos.ts` (`:65-68`), `schema.sql` (al final), `migrate.ts`/`migrate.test.ts`, `cargos.ts`, `index.ts`, `app.ts`, `client.ts`, `boardView.ts` (`:1`, `:45`; lo citan `CLAUDE.md` y `openspec/specs/vistas-tablero/spec.md`), `App.tsx`, `TransitionPanel.tsx` (`CLAUDE.md:369`, `TransitionPanel.tsx:56-57`), `TicketDetailView.tsx`, `Configuracion.tsx`. En sitio o al final: ninguna se mueve, pero cambia lo que afirma cada línea (las citas de `docs/sdd/Paquete_de_Despliegue_*` y `Preguntas_Gerencia_2026-09-29.md` son caso B; las de las specs vivas y del delta, caso A: se corrigen en el delta antes del archive). Las citas del propio delta (`tickets-core/spec.md:860`, `:863` y `permissions/spec.md:402`, `:483` según `design.md` §10, y `ticketService.ts:106` en `9288779`) se releen contra HEAD.
- [ ] 3.8 Detector de citas sobre el diff: `npx tsx apps/desk/server/citas/cli.ts --sha HEAD`, **0 rotas nuevas** (no se salta con `--no-verify`).
- [ ] 3.9 Texto para el expediente R08.3, AL FINAL de `docs/sdd/R08.3_Expediente_de_cambios.md` (`toca_maestro: si`; ~35 líneas, sin tocar el `.docx`): **releer antes de citar** `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.2.md` `:1692` (M1.9.1 no conoce el Top 5 como dato del cliente), `:1709` (ajuste manual atribuido a superadministrador o Director Técnico, dentro del modelo de prioridad de `:1696-1710`), `:1711` y `:781` (orden de «Mis Tickets»), `:4198-4199` (Anexo D nº 53, cerrado por `anexo-53-contratos`, `openspec/config.yaml:2459`) y `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.2.md:5022-5023` (encaje del Top 5 pendiente). Declara: la prioridad se fija en el cliente; manda la más alta entre contrato y Top 5; el ajuste por ticket lo hace el Director Comercial y deja traza en `public.prioridad_ajustes`; el técnico ya no cambia la prioridad; «Mis Tickets» se ordena en el servidor de más a menos urgente, y el desempate por fecha promesa queda pendiente porque el maestro no la define (E-093); quién ajusta fuera de los Top 5 y la calificación de clientes sin contrato ni Top 5 siguen en la pregunta 3.b. **Corregido el 2026-10-01 (C-10):** esta tarea decía que M1.9.1 estaba `[EN REVISIÓN]` y no podía citarse como acuerdo, y era falso: el único apartado marcado es el §3.2 (`:2946-3122`), y M1.9.1 (`:1692`) queda fuera.
- [ ] 3.10 Entrada de la bandeja AL FINAL de `docs/sdd/ENTRADA.md` (**E-094**; formato de `E-092`; E-093 ya existe, es la de la fecha promesa): propagación del Top 5 a los tickets abiertos que ya existan (S-1) — **SIN DESTINO ASIGNADO**, dueño propuesto Gerencia; sin destino inventado (R-3). Cita `top5-manual` (`openspec/config.yaml:1954`, «sus tickets la heredan»). Sin mención de reuniones.
- [ ] 3.11 `git diff --stat HEAD -- CLAUDE.md openspec/config.yaml docs/Manifesto` vacío (R-2 no aplica: sin capacidad nueva; las tres ya están en `capabilities`).
- [ ] 3.12 **Para el `archive-report`** (se redacta en `apply-progress.md`; lo inserta el archive): (a) línea de cobertura de `proposal.md` «Cubre de F1B-07 la prioridad del cliente Top 5 (lista, prioridad y ajuste con motivo por el Director Comercial), "manda la más alta" con el contrato al nacer, el bloqueo de la prioridad para el técnico y el orden de "Mis tickets" de más a menos urgente en el servidor; deja fuera la calificación automática de los clientes sin contrato ni Top 5 y quién ajusta fuera de los Top 5 (3.b), el desempate por fecha promesa (E-093) y la propagación a los tickets abiertos existentes.»; (b) `cierra: no`: el numerador no se mueve; (c) S-1 sin destino (3.10); (d) resultado de P.1, P.2 y P.3 si ya existe; (e) la nota de despliegue literal de abajo.
- [ ] 3.13 Cierre general: `npm test`; `npm run typecheck`; `npm run lint` (techo 165 sin holgura); `npm run build`; medir el lote; confirmar uno a uno los cinco criterios de éxito de `proposal.md`; `apply-progress.md` (~60 líneas, con la casilla de 3.6).

---

## Nota para el cierre — paquete de despliegue (literal)

Antes de desplegar hace falta un paquete de despliegue NUEVO (los `Paquete_de_Despliegue_*` son registros fechados y no se editan). De esta tanda:

1. **Dos tablas nuevas**, aditivas, vacías y sin relleno: `public.cliente_prioridad` y `public.prioridad_ajustes` (las crea `migrate` al arrancar). Sin `CHECK` de la lista de prioridades.
2. **CAMBIO VISIBLE (a):** desde el despliegue, los técnicos ya **no cambian la prioridad** en «Escalado a Revisión» ni en «Devolución a corrección»: el campo desaparece de su formulario y, por API, una prioridad distinta recibe 403. Sólo la cambia el administrador, o quien tenga las áreas Servicio Técnico y Comercial y el cargo Director Comercial.
3. **CAMBIO VISIBLE (b):** los tickets que nacen **sin prioridad** y cuyo cliente no es Top 5 ni tiene contrato vigente **se quedan sin prioridad al escalar** (antes el técnico la fijaba en ese paso). En el «Modo de prioridad» del tablero caen al grupo «Otra prioridad», y en «Mis tickets» van al final. Es consecuencia de que la pregunta 3.b.3 (quién ajusta a mano la prioridad fuera de los Top 5, `docs/sdd/Preguntas_Gerencia_2026-09-29.md:87`) sigue sin respuesta: hasta entonces sólo el administrador puede fijarla.
3b. **CAMBIO VISIBLE (e):** «Mis tickets» aparece **ordenado de más a menos urgente** (Urgent, High, Medium, Low y, al final, sin prioridad); dentro de una misma prioridad, el orden de siempre. Las demás vistas no cambian de orden.
4. **CAMBIO VISIBLE (c):** mientras nadie tenga `cargo_permiso` (P.1 de F1C-05), **sólo el administrador** marca Top 5, fija su prioridad y ajusta tickets. Hasta que se marque algún cliente la lista está vacía y la prioridad al nacer es la de hoy.
5. **CAMBIO VISIBLE (d) (S-1):** los **tickets abiertos que ya existen no heredan** la prioridad cuando un cliente se marca Top 5: sólo los nuevos. Para los abiertos está el ajuste por ticket, con motivo. Propagarla a los abiertos es decisión de Gerencia pendiente (P.3).
6. **Precondición (P.1):** el Director Comercial marca la lista Top 5 y sus prioridades tras desplegar; depende de que P.1 de F1C-05 (asignar `cargo_permiso`) esté hecha.
7. Rollback: revertir los commits; las tablas son aditivas y sólo las lee este código. Devolver `required: true` a `priority()` y quitar la guarda restaura el comportamiento de las transiciones; los tickets ya ajustados o nacidos con Top 5 conservan su prioridad.

---

## Matriz de cobertura de escenarios (73/73)

`(V)` = nace VERDE y se discrimina por mutación o como regresión. TC = `tickets-core`, TS = `transitions-st`, PM = `permissions`. Numeración local por requisito, en el orden del fichero.

| Requisito | Esc. | Escenarios | Lote | Tarea(s) |
|---|---|---|---|---|
| RQ-TC-26 | 2 | TC26-1 tabla calificada y al final (C-2) | 1 | 1.7, 1.9 |
| | | TC26-2 sin calificar se rechaza | 1 | 1.10 (g) |
| RQ-TC-27 | 9 | TC27-1 a TC27-9 | 1 | 1.1, 1.11, 1.16, 1.19 (m, p2, q) |
| RQ-TC-28 | 2 | TC28-1 nadie tiene cargo | 1 | 1.11 |
| | | TC28-2 sin lista, alta de hoy (V) | 1 | 1.13, 1.14 |
| RQ-TC-24 | 16 | TC24-1, TC24-2, TC24-10, TC24-11, TC24-12 (V: `ticketService.test.ts:961-982`) | 1 | 1.14 |
| | | TC24-3 a TC24-6 combinaciones 1-4 | 1 | 1.2, 1.13, 1.19 (e) |
| | | TC24-7 la más alta, en ambos órdenes | 1 | 1.1, 1.6 (f) |
| | | TC24-8, TC24-9 `Urgent` | 1 | 1.1, 1.2, 1.13, 1.6 (f2) |
| | | TC24-13 cliente del ticket, no el de la OV | 1 | 1.13 |
| | | TC24-14, TC24-15 S-1 y S-9 | 1 | 1.11, 1.13 |
| | | TC24-16 sin `client_id` | 1 | 1.13 |
| RQ-TC-29 | 14 | TC29-1 a TC29-13 | 2 | 2.2, 2.10, 2.12, 2.13 |
| | | TC29-7 **invertido por C-3** | 2 | 2.10, 2.13 (k) |
| | | TC29-14 tabla de trazas calificada y al final | 1 | 1.7, 1.9 |
| RQ-TS-20 | 4 | TS20-1, TS20-2 sin `priority` pasa | 2 | 2.3, 2.4, 2.7 |
| | | TS20-3 el campo sigue declarado; TS20-4 sólo difiere `priority` | 2 | 2.1, 2.2, 2.9 (d) |
| RQ-TS-21 | 10 | TS21-1 a TS21-10 | 2 | 2.2, 2.4, 2.8, 2.9 (s) |
| RQ-TS-22 | 3 | TS22-1 área gana, TS22-2 gana al 422, TS22-3 estado gana | 2 | 2.4, 2.9 (a, b, c) |
| RQ-PM-23 | 3 | PM23-1 (`PUT` en el 1, `POST` en el 2), PM23-2, PM23-3 | 1 y 2 | 1.11, 2.10, 1.19 (q) |
| RQ-PM-13 | 2 | PM13-1 el cargo de firma no da permiso (V: `cargoPermiso.test.ts`, sin cambio) | — | regresión en 1.20 |
| | | PM13-2 migración calificada y detrás de todo lo de `29f65d1` (C-1) | 1 | 1.7, 1.8 (V), 1.10 (o) |
| RQ-PM-20 | 2 | PM20-1 por cargo y admin (V: `cargos.test.ts:124-128`, `:186`) | 1 | 1.18 |
| | | PM20-2 sólo el Top 5 tiene llamador | 1 | 1.12, 1.18, 1.19 (r) |
| RQ-VT-09 | 6 | VT09-1 urgencia, VT09-2 desempate de hoy, VT09-3 desconocidos al final, VT09-4 sólo los suyos | 2 | 2.14, 2.15, 2.17, 2.18 (u, v, w, x) |
| | | VT09-5 el listado general no cambia (V) | 2 | 2.15, 2.16, 2.18 (y) |
| | | VT09-6 la vista no reordena (V) | 2 y 3 | 2.15, 2.18 (z), 3.4b |

**73/73 cubiertos.** Mutaciones del diseño §9: (a), (b), (c), (d), (e), (f), (g), (h), (i), (j), (k), (l), (m), (n) todas presentes (lotes 1 y 2); de §12: (u), (v), (w), (x), (y), más (z) de este plan; extras de este plan: (f2), (o), (p), (p2), (q), (r), (s), (k2), (m2), (t). Las de **posición**: (a), (b), (c), (k), (k2), (l), (m), (m2), (o), (p), (p2). `.tsx`: sin escenario automatizable (F0-00); cubierto por la casilla de la regla 13 (3.6) y por P.2.

## Tareas de persona — fuera del recuento (regla del ciclo 1)

Cada una con dueño, destino y dónde queda escrita. **Archivar este cambio NO las da por hechas.** Ninguna describe trabajo que una tanda pueda hacer en este repositorio (el apply no puede consultar producción, asignar datos ni desplegar).

- **P.1 · Director Comercial (o, hasta que tenga cargo, un administrador) — marcar la lista Top 5 y sus prioridades en producción**, desde Configuración → «Clientes Top 5 y prioridad». Dato de producción. Depende de P.1 de F1C-05 (asignar `cargo_permiso`): sin ese cargo sólo lo hace un administrador. Destino: paquete de despliegue de la tanda. Escrita en: este documento, `proposal.md` (§Tareas de persona) y el `archive-report`. Resultado (a rellenar): `_________`.
- **P.2 · Comercial y Servicio Técnico, con quien decida Gerencia — verificación en la app** tras desplegar, en `ambientalia-desk.ambientalia.cloud`: (1) el administrador marca un cliente Top 5 con prioridad y un ticket nuevo de ese cliente nace con ella; (2) un técnico no ve el campo Prioridad en «Escalado a Revisión» ni en «Devolución a corrección» y el administrador sí; (3) «Ajustar» en la ficha sólo aparece en un cliente Top 5 y exige motivo; (4) un ticket nuevo sin prioridad, sin Top 5 y sin contrato cae en «Otra prioridad» del tablero; (5) en «Mis tickets» de un técnico con tickets de varias prioridades, los Urgent/High van arriba y los sin prioridad al final, y «Todos los Tickets» conserva su orden. Destino: verificación en la app. Escrita en: este documento, `proposal.md` y el `archive-report`.
- **P.3 · Gerencia — decidir si el Top 5 se propaga a los tickets abiertos que ya existen (S-1)**, y en ese caso cómo (un `UPDATE` más una traza por ticket sería aditivo). Hoy queda registrado **SIN destino**, sin destino inventado. Destino: la respuesta se registra en `openspec/config.yaml` → `decisiones_de_gerencia`, o se asigna a una fila del §5 del plan; sin respuesta sigue abierta. Escrita en: el `archive-report`, `design.md` §7 y la bandeja (entrada de 3.10, dueño propuesto Gerencia).

## Dependencias entre lotes

Lote 1 es la base: la regla de dominio, las dos tablas y el servidor del cliente viven en `packages/shared` y `apps/desk/server` (regla 13: una sola fuente, el cliente consume). Es también el primero con efecto vivo, pero con la lista vacía no cambia nada observable. El lote 2 depende del 1 (`prioridad.ts`, `prioridad_ajustes`, `db/prioridadCliente.ts`) y trae el segundo efecto vivo: el técnico pierde la prioridad. El lote 3 depende del 2: el espejo del cliente sólo es «comodidad legítima» cuando la imposición del servidor está probada, y el cierre (regla 3, regla 4, texto R08.3, bandeja) sólo tiene sentido con todo el código dentro. Una tanda SDD por árbol (regla del ciclo 2): los tres lotes van **en serie**; `verify` y `archive` son intentos aparte, y el archive suma el `git mv` y supera 800 (~4.850 previstos tras C-10, techo de 5.500 por pedir a un mantenedor).
