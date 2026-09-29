# Tasks — `blueprint-soporte-remoto` (F1B-06, cambio 2 de 2, `cierra: si`)

**Entradas:** `proposal.md`, `exploration.md`, `design.md`, `specs/{transitions-soporte-remoto,transitions-equipo-nuevo,tickets-core}/spec.md`
de esta misma carpeta. Preflight: `auto · hybrid · ask-on-risk · 800 líneas · strict_tdd`. `strict_tdd` activo: cada tarea de
implementación va precedida de su prueba en rojo y de un «confirmar rojo natural»; lo que nace verde se declara en `apply-progress.md`.

Las citas de este documento se leyeron el 2026-09-29 contra el árbol de `66ab783` por lectura directa en `flujos.ts` (`:1-106`), `flujos.test.ts`
(`:1-140`), `repo.ts` (`:396-452`), `migrate.test.ts` (`:318-444`), `schema.sql` (`:560-573`), `ticketService.ts` (`:80-109`) y
`equipoNuevo.ts` (`:55-73`). El resto viene de `design.md` §8 y lo re-mide la tarea 0.3 (hipótesis hasta entonces).

**Matriz de amenazas de la skill:** N/A (`design.md` §6: sin red, shell, subprocesos ni automatización de VCS). Los casos de contenido
hostil que sí hay (modalidad `''`, `null`, `'Remoto'`, `'presencial'`, modalidad fuera de soporte remoto) son RED explícitos: 1.16, 2.14 (A3, A5).

## Alineación de planificación (antes del lote 1)

- [x] A.1 `specs/transitions-soporte-remoto/spec.md`, RQ-SR-05 (`:172-174`) y el escenario de `:195-198`: «nombre el flujo `soporte-remoto`» → «nombre el flujo
  (`soporte remoto`, con espacio, como `equipo nuevo` y `servicio técnico` en `flujos.ts:91`)». El id del flujo es `soporte-remoto`; el TEXTO del `409` es humano.
  Mismo número de líneas. Sin esto la prueba 1.16 y la spec discrepan (**hallazgo al planificar**). Documental, directo.
- [ ] A.2 Recuento de escenarios: el encargo hablaba de 20 en `tickets-core`; la spec tiene **19** `#### Scenario` y **un** bloque `Given/When/Then` heredado en RQ-TC-06
  (`specs/tickets-core/spec.md:157-160`). Se cuenta como el 20.º (regresión). Total de la matriz: **56** (55 con encabezado + 1).

## Fase 0 · Preparación (orquestador; sin código)

- [ ] 0.1 `git rev-parse HEAD` (esperado `66ab783`) y `git status --short` (sólo los sin trackear de la cabecera de sesión y `openspec/changes/blueprint-soporte-remoto/`).
- [ ] 0.2 Línea base verde: `npm test`, `npm run typecheck`, `npx eslint . --max-warnings 165`. Anotar nº de ficheros y de tests en `apply-progress.md`.
- [x] 0.3 **Re-medir citas** (esta sesión no tuvo Bash; los valores entre paréntesis son los provisionales de `design.md` §8, contados con ripgrep e incluyen sin trackear;
  `git grep` sólo cuenta lo trackeado, así que puede salir MENOR por las citas de esta carpeta). Regla de decisión: si un fichero sale **mayor** que su provisional, alguien añadió citas: se leen.
  **Medido por el orquestador el 2026-09-29 sobre `66ab783` (sólo trackeado), ninguno sale mayor que su provisional:** `transitions.ts` 374 · `estados.ts` 253 · `flujos.ts` 12 · `ticketService.ts` 486 · `schema.sql` 199 · `db/repo.ts` 91 con ruta (más 159 `repo.ts` sin ruta, ambiguos entre `db/` y `books/`) · `rows.ts` 42 · `mappers.ts` 9 · `migrate.test.ts` 55 · `invariantesGrafo.test.ts` 62 · `estados.test.ts` 72 · `flujos.test.ts` 0 · `CreateTicket.tsx` 31 · `equipoNuevo.ts` 40.

  ```bash
  git grep -nE "transitions\.ts:[0-9]+"            | wc -l   # 377
  git grep -nE "estados\.ts:[0-9]+"                | wc -l   # 256
  git grep -nE "flujos\.ts:[0-9]+"                 | wc -l   # 13
  git grep -nE "ticketService\.ts:[0-9]+"          | wc -l   # 496
  git grep -nE "schema\.sql:[0-9]+"                | wc -l   # 200
  git grep -nE "db/repo\.ts:[0-9]+"                | wc -l   # 95
  git grep -nE "rows\.ts:[0-9]+"                   | wc -l   # 42
  git grep -nE "mappers\.ts:[0-9]+"                | wc -l   # 9
  git grep -nE "types\.ts:[0-9]+"                  | wc -l   # 40
  git grep -nE "migrate\.test\.ts:[0-9]+"          | wc -l   # 55
  git grep -nE "invariantesGrafo\.test\.ts:[0-9]+" | wc -l   # ~62
  git grep -nE "estados\.test\.ts:[0-9]+"          | wc -l   # ~77
  git grep -nE "flujos\.test\.ts:[0-9]+"           | wc -l   # 5
  git grep -nE "CreateTicket\.tsx:[0-9]+"          | wc -l   # 31
  git grep -nE "TicketProperties\.tsx:[0-9]+"      | wc -l   # a medir
  git grep -nE "api/client\.ts:[0-9]+"             | wc -l   # a medir
  git grep -nE "equipoNuevo\.ts:[0-9]+"            | wc -l   # a medir
  for f in permisos transicionesEjecucion avisoArea reentrancia; do echo $f; git grep -nE "$f\.test\.ts:[0-9]+" | wc -l; done   # a medir
  git grep -nE "repo\.test\.ts:[0-9]+" -- packages/zoho-sync/src/db | wc -l   # a medir
  ```
- [ ] 0.4 Confirmar largos de fichero (`wc -l`) contra `design.md` §8: `transitions.ts` 376, `estados.ts` 190, `flujos.ts` 106, `ticketService.ts` 234-235, `schema.sql` 573, `db/repo.ts` 452,
  `rows.ts` 132, `mappers.ts` 261, `types.ts` 810, `migrate.test.ts` 444, `invariantesGrafo.test.ts` 219, `flujos.test.ts` 140 (leído hoy: 140), `CreateTicket.tsx` 455.
  Si alguno difiere, los puntos de inserción se han movido: se para y se declara.
- [ ] 0.5 Dos hipótesis de `design.md` que se comprueban antes de escribir código: (a) `git grep -nE "flujoDelTicket|catalogoDelTicket|transicionesDelTicket" -- packages/shared/src ':!*.test.ts'`
  sólo en cuerpos de función (ningún módulo de `shared` lo llama al cargar, D2); (b) `git grep -nE "\bcreateTicket\(" -- . ':!*.test.ts'` = sólo `equipoNuevo.ts:90` (D4); y leer
  `equipoNuevo.ts:80-99` para confirmar que `crearTicketConEquipo` reenvía `modalidad` sin construir un objeto nuevo (si lo construye, el ajuste va en línea en ese fichero).
- [ ] 0.6 Ledger: un intento de `gentle-ai sdd-attempt` por lote, **en serie** (regla del ciclo 2). `verify` y `archive` son intentos aparte.

## Review Workload Forecast

| Campo | Valor |
|---|---|
| Líneas estimadas | ~1.420 en tres lotes (615 + 665 + 140); incluye pruebas y `apply-progress.md` (~60 por lote); NO incluye `verify-report` ni `archive-report` |
| Techo de esta sesión | **800 por lote** (`review_budget_lines`); el mayor (lote 2, ~665) deja ~135 de margen; ninguno se parte |
| Riesgo de presupuesto | **Alto** en conjunto; **Medio** por lote (lote 2) y **Bajo** (lotes 1 y 3) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main — un commit por lote, integrado antes de abrir el siguiente |

```text
Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High
```

(La etiqueta literal dice «400-line»; el techo real es 800 por lote. El riesgo es alto por el TOTAL. Bajo modo `auto` la cadena `stacked-to-main` se aplica como supuesto
reversible: no es ninguna de las cinco condiciones de parada de `CLAUDE.md`.)

**Reestimación contra las tareas listadas** (la propuesta decía 520 + 550; se sube porque el cliente sale del lote 2 y el cierre pasa a lote propio):

| Lote | Código | Pruebas | `apply-progress.md` (adenda) | Total | Margen a 800 | Depende |
|---|---|---|---|---|---|---|
| 1 · `shared` | ~160 (catálogo 52, estados 16, `flujos.ts` 90) | ~395 (`transitionsSoporteRemoto` 120, `flujos.test` 145, `invariantesGrafo` 90, `estados.test` 22, `reentrancia` 18) | ~60 | **~615** | ~185 | — |
| 2 · Servidor y BD | ~60 (`schema` 4, `repo.ts` 24, `rows`/`mappers`/`types` 6, `ticketService` 24) | ~545 (`flujoSoporteRemoto.test` 330, `repo.test` 75, `transicionesEjecucion` 45, `permisos` 40, `migrate.test` 40, `avisoArea` 14) | ~60 | **~665** | ~135 | 1 |
| 3 · Cliente y cierre | ~50 (`CreateTicket.tsx` 24, `TicketProperties.tsx` 8, `client.ts` 4, `equipoNuevo.ts` 4, reparaciones de citas ~10) + ~30 de texto para R08.3 | 0 (`.tsx` fuera de la red, F0-00) | ~60 (incluye la casilla de la regla 13) | **~140** | ~660 | 2 |
| **Total** | | | | **~1.420** | | |

**Válvula del lote 2:** si tras 2.13 el acumulado medido supera **640**, la tarea 2.14 (barridos de `permisos`, `transicionesEjecucion` y `avisoArea`, ~100 líneas, con su comprobación en 2.15 y 2.17)
pasa al frente del lote 3, que tiene margen. Se decide con `git diff --shortstat --no-renames HEAD` en ese punto, no de memoria.

**Previsión de `verify`** (intento aparte): **~380 líneas de `verify-report.md`**, sumando OBLIGATORIO (precedentes: 358 en `detector-citas-extremos`; aquí la matriz tiene 56 filas). Nada más:
`verify` no toca código. Contra un techo de 800 cabe, pero el informe no es opcional ni «extra».

**Previsión de `archive`** (intento aparte): el ledger mide SIN detección de renombrado, así que **la carpeta cuenta dos veces** (borrada y reinsertada; `CLAUDE.md`, regla del ciclo 2).

| Concepto | Líneas |
|---|---|
| Carpeta que se mueve: `proposal` 170, `exploration` 65, `design` 261, tres specs 636, `tasks` ~480, `apply-progress` ~180, `verify-report` ~380, `archive-report` ~180 | ~2.350 |
| Contada dos veces (`git mv` sin `-M`) | ~4.700 |
| Fusión de los tres deltas en `openspec/specs/` (spec nueva de `transitions-soporte-remoto` entera, RQ-EN-04, RQ-TC-05/06/07/10 y la sección 4.3) | ~500 (**se mide, no se estima**: hacerla en un worktree cuesta un minuto) |
| **Total previsto** | **~5.200** (± 400) |

**El archive NO cabe en 800 y necesitará un techo de mantenedor: se pide 6.000** (precedente: 5.000 aprobados para 4.502 medidas, margen 498). La justificación no es el tamaño: ~4.700 de esas líneas
son un `git mv` verbatim de carga de revisión cero; lo realmente revisable son ~500 de fusión más el `archive-report`.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | `Solicitud Soporte`, catálogo de 4 transiciones, registro de flujos, `estadoInicialDelAlta`, `modalidadDelAlta`, invariantes | PR 1 | `npx vitest run packages/shared/src/estados.test.ts packages/shared/src/transitionsSoporteRemoto.test.ts packages/shared/src/reentrancia.test.ts packages/shared/src/invariantesGrafo.test.ts packages/shared/src/flujos.test.ts` | node puro (vitest, `vitest.config.ts:16`) | `git revert` del lote 1, **después** de revertir 2 y 3. Ojo: el lote 1 SÍ cambia comportamiento vivo (S-6: SR heredados en `En Proceso`/`Pendiente`/`Finalizado` pasan a su flujo) |
| 2 | Columna `modalidad`, nacimiento en `Solicitud Soporte`, guarda de modalidad, barridos de ejecución y permisos | PR 2 | `npx vitest run apps/desk/server/flujoSoporteRemoto.test.ts packages/zoho-sync/src/db/repo.test.ts packages/zoho-sync/src/db/migrate.test.ts apps/desk/server/permisos.test.ts apps/desk/server/transicionesEjecucion.test.ts apps/desk/server/services/avisoArea.test.ts` | pg-mem + `appHarness` (`apps/desk/server/testing/appHarness`) | `git revert` del lote 2; la columna queda (aditiva, nullable). **Nota de despliegue abajo**: SR ya nacidos en `Solicitud Soporte` quedan sin transiciones con el código viejo |
| 3 | Selector y lectura de Modalidad, casilla de la regla 13, barrido de la regla 4, texto para R08.3 | PR 3 | N/A: `apps/desk/src/**/*.tsx` fuera de la red (F0-00). Sustituto: `npm run typecheck && npm run build` | Verificación manual en `ambientalia-desk.ambientalia.cloud` tras desplegar (P.2) | `git revert`; UI y documentación, el servidor sigue poniendo `remoto` por defecto |

**Convenciones de todos los lotes.**
- «En su sitio» = mismo número de líneas (una edición cuenta `+n −n`); «al final» = sólo inserciones, `−0`. El cierre de cada lote lo comprueba con `git diff --numstat HEAD -- <fichero>` y con el recuento `wc -l`.
- **Medida de cada lote** (techo 800; si se pasa, se para y se declara): tracked `git diff --shortstat --no-renames HEAD -- <ficheros del lote>` **más** `wc -l` de los ficheros nuevos sin trackear del lote
  **más** el delta de `wc -l openspec/changes/blueprint-soporte-remoto/apply-progress.md` (se lista por ruta: hay sin trackear ajenos en `docs/sdd/`). El resultado va en `apply-progress.md`.
- **Barrido de la regla de mutación 4 al cierre de cada lote** (sobre los ficheros del lote; el barrido completo es 3.7): `grep -rnoE "<fichero>\.(ts|tsx|sql):[0-9]+(-[0-9]+)?" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=archive`,
  más segundo pase para la forma abreviada en los ficheros que ya citan el módulo; se comprueban los DOS extremos de cada rango y se LEE qué afirma cada cita (A presente / B histórico / C superado).
- Tras cada cierre: `npm test`, `npm run typecheck`, `npx eslint . --max-warnings 165` y `apply-progress.md` del lote (≤ 60 líneas).
- **No hay comentario nuevo por encima de `migrate.test.ts:444`** (`CLAUDE.md` cita `:409-411`): la explicación del nuevo recuento va en el título de la prueba y en el docblock del `describe` FINAL.

---

## Lote 1 · `shared`: estado, catálogo, registro, invariantes

**Estimación:** código ~160 · pruebas ~395 · artefactos ~60 · **total ~615**. **Depende de:** — (primer lote; tras A.1 y la fase 0).

**Ficheros muy citados que toca** (todos EN SU SITIO salvo lo marcado):

| Fichero (líneas; citas provisionales) | Puntos | Tipo |
|---|---|---|
| `packages/shared/src/transitions.ts` (376; 377) | `:366` reescribir el comentario «Va al FINAL del fichero» (mismo nº de líneas, caso A: «va detrás de `TRANSICIONES_BASE`»); `TRANSITIONS_SOPORTE_REMOTO` tras `:376` | EN SU SITIO + FINAL |
| `packages/shared/src/estados.ts` (190; 256) | `:101` «(2)»→«(3)»; `:105` `'Solicitud Soporte': 'sin_clasificar',` ANTES del `//` final; `:111` «22»→«23»; `:182` segunda sentencia `ESTADOS_SOLO_SOPORTE_REMOTO`; `:184`, `:185`, `:189` exclusión | EN SU SITIO |
| `packages/shared/src/flujos.ts` (106; 13) | `:7` import; `:9-10` comentario y `Flujo`; `:21` segunda propiedad en la misma línea; `:57` condición antepuesta en la misma línea; `:91` `return NOMBRE_FLUJO[flujo]`; resto tras `:106` | EN SU SITIO + FINAL |
| `packages/shared/src/estados.test.ts` (~77 citas) | `:15-17`, `:66-69` (aserción nueva en la misma línea `:69`), `:72`; caso de clase de espera al final | EN SU SITIO + FINAL |
| `packages/shared/src/invariantesGrafo.test.ts` (219; ~62) | `:3`, `:5`, `:154-158`, `:161`, `:163`, `:172-174`; `describe` nuevo al final | EN SU SITIO + FINAL |
| `packages/shared/src/flujos.test.ts` (140; 5) | `:3-6` imports, `:42-45` invertida a propósito, `:136-138` «tres entradas»; `describe` nuevos al final | EN SU SITIO + FINAL |
| `packages/shared/src/reentrancia.test.ts` | `describe` al final (molde `:182-198`) | FINAL |

Módulo nuevo: `packages/shared/src/transitionsSoporteRemoto.test.ts`. `packages/shared/src/index.ts` ya reexporta `transitions`, `estados` y `flujos` (hipótesis, se comprueba en 1.11).
**Aviso de encadenado:** con el lote 1 solo, el enrutado ya cambia en vivo para SR heredados (S-6), pero ningún SR nace todavía en `Solicitud Soporte`; el despliegue es de los tres lotes juntos.

### Bloque A · Estado

- [x] 1.1 RED — `estados.test.ts` en su sitio: `:15-17` 22→23; `:66-69` título y lista `['Pendiente', 'Verificación', 'Solicitud Soporte']` (la aserción nueva en la misma línea `:69`); `:72` «5 + 6 + 9 + 3 = 23».
  Al final: `CLASIFICACION_EN_ESPERA['Solicitud Soporte'] === 'sin_clasificar'`; `ESTADOS_SERVICIO` sigue en 21, en el MISMO orden y sin `Solicitud Soporte`; `ESTADOS_SOLO_SOPORTE_REMOTO` = `['Solicitud Soporte']`.
  RQ: RQ-SR-03 (escenarios «Solicitud Soporte no es un estado de servicio» y «Clase de espera»).
- [x] 1.2 Confirmar rojo natural (`ESTADOS` tiene 22; la constante no existe).
- [x] 1.3 GREEN — `estados.ts` en su sitio (`:101`, `:105`, `:111`, `:182`, `:184-185`, `:189`). `ESTADOS_SOLO_SOPORTE_REMOTO` va en `:182` y no al final porque `:188` evalúa `ESTADOS_SERVICIO` al cargar (`ReferenceError` si va después).
- [x] 1.4 Confirmar 1.1 en verde; `npm run typecheck` (`fasesBlueprint.ts:68` sigue compilando por la exclusión); `git diff --numstat -- packages/shared/src/estados.ts` = `n n` (190 líneas sin cambio).
- [x] 1.5 MUTACIÓN (M9) — quitar `Solicitud Soporte` de la lista de `:182`: ROJO en 1.1 y en `tsc` de `fasesBlueprint.ts:68`; revertir; `git diff` limpio.

### Bloque B · Catálogo y grafo

- [x] 1.6 RED — `transitionsSoporteRemoto.test.ts` (nuevo): (a) los cuatro pares exactos `from→to` y ninguno más; (b) salidas de `Solicitud Soporte` = `['asignacion_soporte']` (S-5); (c) `fields` de cada una = `['comment', 'derivado_a']`, sin `modalidad`
  (RQ-SR-10) y sin campo de fecha ni motivo obligatorio; (d) `area` = `'Servicio Técnico'` en las cuatro (S-1); (e) ids únicos entre los tres catálogos y `marcar_pendiente` resuelve a servicio (`transicionPorId`/`flujoDeTransicion`);
  (f) entradas y salidas por estado: `Finalizado` recibe sólo `ejecutar_soporte` de este catálogo (la prueba de pares que distingue una entrada retirada, aunque `sinSalida` no cambie).
  RQ: RQ-SR-01 (3 escenarios), RQ-SR-02 (área), RQ-SR-03 («Quitar `Ejecutar`»), RQ-SR-06 (2), RQ-SR-10 (1).
- [x] 1.7 RED — `reentrancia.test.ts` (al final, molde `:182-198`): `camposFechaReentrantes(TRANSITIONS_SOPORTE_REMOTO)` = `[]` y `tablaDeReentrancia` da un único ciclo `En Proceso ↔ Pendiente` (la forma exacta se fija en el rojo: hipótesis). RQ: RQ-SR-01 («cero campos de fecha reentrantes»).
- [x] 1.8 RED — `invariantesGrafo.test.ts` en su sitio: `:3` y `:5` importan `TRANSITIONS_SOPORTE_REMOTO`; `:161` la unión lo suma; `:154-158` comentario; `:163` «(23)»; `:172-174` 44 = 34 + 6 + 4; y sin cambio `sinSalida = ['Finalizado']` (`:177-180`).
  Al final (parte catálogo): `ESTADOS_SOLO_SOPORTE_REMOTO` = derivados(SR) − derivados(servicio ∪ EN); pares de RQ-SR-01; salidas de `Solicitud Soporte` = `['asignacion_soporte']`; campos = `['comment', 'derivado_a']`.
  RQ: RQ-SR-03 («La unión deriva exactamente ESTADOS», «Finalizado sigue siendo el único sin salida»).
- [x] 1.9 Confirmar rojo natural de 1.6-1.8 (el export no existe → `undefined`). Declarar los que nacen verdes: `sinSalida = ['Finalizado']` y «`marcar_pendiente` es de servicio» (regresión de guardas vecinas; su rojo lo dan 1.12-1.14).
- [x] 1.10 GREEN — `transitions.ts`: reescribir `:366` en su sitio y añadir `TRANSITIONS_SOPORTE_REMOTO` tras `:376` con `asignacion_soporte`, `ejecutar_soporte`, `soporte_pendiente`, `continuacion_soporte`
  (`comment()` de `:73-74` y `derivacion()` de `:97-98`, ya evaluadas; área `Servicio Técnico`).
- [x] 1.11 Confirmar 1.6-1.8 en verde; `git diff --numstat -- packages/shared/src/transitions.ts` = inserciones al final más `+n −n` de `:366` (n ≤ 2); confirmar que `index.ts` reexporta el catálogo (si no, una línea al final, `−0`).
- [x] 1.12 MUTACIÓN — añadir una entrada con `from: ['Solicitud Soporte']` y `to: 'Finalizado'`: ROJO en 1.6(b) y 1.8; revertir.
- [x] 1.13 MUTACIÓN — borrar `ejecutar_soporte`: ROJO en 1.6(f) aunque `sinSalida` siga en `['Finalizado']`; revertir.
- [x] 1.14 MUTACIÓN — `soporte_pendiente` → id `marcar_pendiente` (`transitions.ts:206`): ROJO en 1.6(e); revertir.
- [x] 1.15 MUTACIÓN (M7) — `from: ['Solicitud soporte']` (grafía de la hoja): ROJO en 1.6(a) y en los invariantes 1 y 4 de la unión (`invariantesGrafo.test.ts`); revertir.

### Bloque C · Registro de flujos y nacimiento

- [x] 1.16 RED — `flujos.test.ts` en su sitio: `:3-6` imports (`esClasificacionSoporteRemoto`, `estadoInicialDelAlta`, `modalidadDelAlta`, `MODALIDADES`, `TRANSITIONS_SOPORTE_REMOTO`); `:42-45` invertida:
  SR en `Solicitud Soporte`, `En Proceso`, `Pendiente`, `Finalizado` → `soporte-remoto`; SR en `Ticket creado`, `Rev./Diagnostico`, `Ingresado` → `servicio`; `:136-138` título «tres entradas» y tercera aserción.
  Al final: normalización de `esClasificacionSoporteRemoto` (molde `:14-31`: «Soporte Remoto», «soporte remoto», no «Soporte remoto extra», `null`/`undefined`); `En Proceso` desambigua entre `equipo-nuevo`, `soporte-remoto` y `servicio`;
  SR heredado en `Rev./Diagnostico` y `Ticket creado` ve las de `TRANSITIONS` desde ese estado; SR en `Solicitud Soporte` ve sólo `asignacion_soporte`; `catalogoDelTicket` SR = `TRANSITIONS_SOPORTE_REMOTO`; `flujoDeTransicion('soporte_pendiente')` = `soporte-remoto`;
  `fueraDeFlujo` de `marcar_pendiente` sobre SR en `En Proceso` contiene «soporte remoto» y «servicio técnico», y `asignacion_soporte` sobre servicio en `Rev./Diagnostico` da el mensaje de flujo; `columnForStatus('Solicitud Soporte')` = `'otros'` (S-10, molde `:125-133`);
  `estadoInicialDelAlta` (SR literal y «soporte remoto» normalizado → `Solicitud Soporte`; las otras dos clasificaciones, `null` y `undefined` → `Ticket creado`);
  `MODALIDADES` = `['remoto', 'en sitio']` y `modalidadDelAlta` en tabla de las 10 filas de D5 (SR ausente → `remoto`; `remoto`/`en sitio` exactos; `''`, `null`, `'Remoto'`, `'presencial'` → error que nombra `modalidad`; otra clasificación ausente → `null`; con cualquier valor → error).
  La forma del retorno se fija en el rojo (hipótesis: `{ valor } | { error }`).
  RQ: RQ-EN-04 (5 escenarios), RQ-SR-05, RQ-SR-06, RQ-SR-07, RQ-SR-08, RQ-SR-09, RQ-TC-07, RQ-TC-10 (3 escenarios), RQ-SR-03 (tablero).
- [x] 1.17 RED — `invariantesGrafo.test.ts` al final (parte entrada, D7): los estados sin transición de entrada en la unión son exactamente `Remisión creada`, `OV asignada`, `Ticket creado` y `Solicitud Soporte` (hipótesis, se fija en el rojo);
  para cada una de las tres `CLASIFICACIONES`, `estadoInicialDelAlta` está declarado y `transicionesDelTicket` desde él no es vacío. RQ: RQ-TC-07.
- [x] 1.18 Confirmar rojo natural (las funciones no existen). Nacen verdes y se declaran: SR en `Ticket creado`/`Rev./Diagnostico` → `servicio`, `esClasificacionEquipoNuevo` y los tres tests de EN heredados (`flujos.test.ts:34-36`, `:47-49`), `columnForStatus('Solicitud Soporte')`
  si el fallback ya lo resuelve (S-10 *verificado*: `columns.ts:15`, `:38`, `:45-46`).
- [x] 1.19 GREEN — `flujos.ts`: `:7`, `:9-10`, `:21`, `:57`, `:91` en su sitio; tras `:106`: `CLASIFICACION_SOPORTE_REMOTO` (`(typeof CLASIFICACIONES)[number]`), `esClasificacionSoporteRemoto` (misma `normalizar`, `:32-34`),
  `ESTADOS_DEL_CATALOGO_SOPORTE_REMOTO`, `NOMBRE_FLUJO: Record<Flujo, string>` (`soporte remoto`), `estadoInicialDelAlta`, `MODALIDADES`/`Modalidad`/`modalidadDelAlta`.
  `estadoInicialDelAlta` usa el MISMO predicado que `flujoDelTicket` (H5: nacimiento y enrutado no pueden divergir).
- [x] 1.20 Confirmar 1.16-1.17 en verde; `flujos.ts` 106→106+N con `+n −n` en las cinco líneas de sitio; confirmar la hipótesis de carga de 0.5(a) (`npm test` sin `ReferenceError`).
- [x] 1.21 MUTACIÓN (M11) — quitar la condición de estado en `:57`: ROJO (SR heredado en `Rev./Diagnostico` ve `[]`, 1.16); revertir.
- [x] 1.22 MUTACIÓN (M10) — `estadoInicialDelAlta` siempre `Ticket creado`: ROJO (1.16 y el invariante de entrada 1.17); revertir.
- [x] 1.23 MUTACIÓN (molde H5) — `estadoInicialDelAlta` compara con el literal `'Soporte remoto'` en vez de `esClasificacionSoporteRemoto`: ROJO en «soporte remoto» normalizado (nacimiento y enrutado divergen); revertir.
- [x] 1.24 MUTACIÓN — `modalidadDelAlta` acepta `'Remoto'` (normaliza a minúsculas): ROJO en la tabla de 1.16; revertir.
- [x] 1.25 Cierre del lote 1: `npx vitest run` con el comando enfocado de la tabla; `npm test`; `npm run typecheck`; `eslint`. **Todo rojo fuera de `shared` se lee**: sólo se admite lo deliberado de D3
  (`estados.test.ts`, `invariantesGrafo.test.ts`, `flujos.test.ts:42-45`); cualquier otro (`permisos`, `sla.test.ts:202`, `transicionesEjecucion`) es hallazgo y se declara antes de seguir.
  Medir (nuevo: `transitionsSoporteRemoto.test.ts`); recuentos: `estados.ts` 190 sin cambio, `transitions.ts` 376→376+N con `−≤2`, `flujos.ts` 106→106+N; barrido de citas sobre los siete ficheros (relee las cuyo contenido cambia:
  `estados.ts:101-111`, `:182-189`; `flujos.ts:56-61`, `:90-92`; `transitions.ts:365-376`; `invariantesGrafo.test.ts:163`, `:172`); `apply-progress.md` (~60 líneas).

---

## Lote 2 · Servidor y BD: columna, nacimiento, guarda de modalidad, barridos

**Estimación:** código ~60 · pruebas ~545 · artefactos ~60 · **total ~665**. **Depende de:** Lote 1.

**Ficheros muy citados que toca:**

| Fichero (líneas; citas provisionales) | Puntos | Tipo |
|---|---|---|
| `packages/zoho-sync/src/db/schema.sql` (573; 200) | tras `:573`: comentario de dos líneas SIN punto y coma (`schema.sql:520-521`, el divisor de sentencias parte por `;`) y `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS modalidad text;` — sin calificar, sin `CHECK` | FINAL |
| `packages/zoho-sync/src/db/repo.ts` (452; 95 como `db/repo.ts:`) | `:2` import `estadoInicialDelAlta` (y se retira `STATUS_TICKET_CREADO` si queda sin uso); `:401` `modalidad?: string \| null`; `:405-411` comentario; `:418` segunda sentencia `const estadoInicial = …`; `:420-422` columna, `$19`, `input.modalidad ?? null`; `:422` y `:435` `estadoInicial`; `:434` payload | EN SU SITIO |
| `packages/zoho-sync/src/db/rows.ts` (132; 42) · `mappers.ts` (261; 9) · `packages/shared/src/types.ts` (810; 40) | `:50` · `:246` · `:131` | EN SU SITIO |
| `apps/desk/server/services/ticketService.ts` (234-235; 496) | `:6` import; `:20` comentario; `:91` guarda en línea; `:107` `modalidad` a `crearTicketConEquipo` | EN SU SITIO (234 líneas) |
| `packages/zoho-sync/src/db/migrate.test.ts` (444; 55) | `:374` título 39→40 y 20→21; `:376` 39→40; `:378` 20→21; `describe` FINAL tras `:444` | EN SU SITIO + FINAL |
| `packages/zoho-sync/src/db/repo.test.ts`, `apps/desk/server/{permisos,transicionesEjecucion}.test.ts`, `apps/desk/server/services/avisoArea.test.ts` | casos nuevos | FINAL |

Módulo nuevo: `apps/desk/server/flujoSoporteRemoto.test.ts` (molde `flujoEquipoNuevo.test.ts`). **Hallazgo al planificar:** `migrate.test.ts:374-378` fija 39 `ALTER` (19 calificadas, 20 sin calificar, conjunto `tickets`/`equipos`/`contacts`);
añadir la de `modalidad` lo pone rojo por diseño (40 y 21, conjunto igual porque `tickets` ya estaba).

### Bloque A · Columna (regla de mutación 2: se ensucia el fichero vigilado)

- [x] 2.1 RED — `migrate.test.ts` en su sitio: `:374` («son 40 ALTER: 19 calificadas … y 21 sin calificar»), `:376` a 40, `:378` a 21. Al final, molde `:432-444`: sólo UNA sentencia de `schema.sql` menciona `modalidad` (la `ALTER`), y una fila previa queda con `modalidad` NULL (S-9, sin relleno).
- [x] 2.2 Confirmar rojo natural (hay 39 `ALTER` y 0 sentencias con `modalidad`).
- [x] 2.3 GREEN — `schema.sql` tras `:573` (comentario de dos líneas sin `;` + la `ALTER`).
- [x] 2.4 Confirmar 2.1 en verde y `migrate.integration.test.ts` sin cambios; `schema.sql` 573→573+N con `−0`.
- [x] 2.5 MUTACIÓN (M5, regla 2) — escribir en `schema.sql` `UPDATE tickets SET modalidad = 'remoto';`: ROJO (recuento de sentencias con `modalidad` = 2); revertir; `git diff` limpio.
- [x] 2.6 MUTACIÓN (M6, regla 2) — `ALTER TABLE desk.tickets ADD COLUMN IF NOT EXISTS modalidad text`: ROJO en `migrate.test.ts:374-385` (identidades calificadas); revertir.

### Bloque B · Escritor (`createTicket`)

- [x] 2.7 RED — `repo.test.ts` (al final; molde `:188-245`): alta SR con `modalidad: 'en sitio'` → fila `status = 'Solicitud Soporte'`, `modalidad = 'en sitio'`; foto #1 `to_status = 'Solicitud Soporte'`, `transition_id = 'enviar'`, `from_status = '(creación)'`, `area = 'Comercial'`, `values.modalidad = 'en sitio'`;
  SR sin modalidad (`null`) → columna `NULL` y `values` SIN la clave; «soporte remoto» normalizado nace en `Solicitud Soporte`; `Equipo nuevo` y `Equipo para servicio de mantenimiento` → `Ticket creado`, `modalidad` NULL, `values` sin la clave;
  ninguno de los tres nace en `OV asignada`; fallo del segundo `INSERT` de una alta SR (envoltorio de `Queryable` que lanza en `ticket_transitions`) → `ROLLBACK` y ninguna de las dos filas;
  `TICKET_COLS` no contiene `modalidad` y un `upsertTicket` con datos de Zoho no pisa `'en sitio'` (molde `:279-297` y `:299-363`). Si `modalidad` debe o no figurar en `PROMOTED_COLUMNS` se lee en el rojo (hipótesis: no, Zoho no la envía).
  RQ: RQ-TC-06 (3 escenarios), RQ-TC-07 (2), RQ-SR-04 (2), RQ-SR-11 (2), RQ-SR-07/09 a nivel de escritor.
- [x] 2.8 Confirmar rojo natural: rojos los de SR (nacimiento, foto, rollback SR, `modalidad`); **nacen verdes** y se declaran: EN y mantenimiento en `Ticket creado`, «ninguno en `OV asignada`», `TICKET_COLS` sin `modalidad` y «el sync no la pisa» (la columna existe tras 2.3).
- [x] 2.9 GREEN — `repo.ts` en su sitio (`:2`, `:401`, `:405-411`, `:418`, `:420-422`, `:434-435`): el estado de la fila y `to_status` de la foto salen de la MISMA constante local `estadoInicial`; `:434` gana `...(input.modalidad ? { modalidad: input.modalidad } : {})`.
- [x] 2.10 Confirmar 2.7 en verde; `git diff --numstat -- packages/zoho-sync/src/db/repo.ts` = `n n` (452 sin cambio).
- [x] 2.11 MUTACIÓN (M8, regla 2) — añadir `'modalidad'` a `TICKET_COLS` (`repo.ts:44-54`): ROJO (ausencia y «no la pisa»); revertir.
- [x] 2.12 MUTACIÓN — dejar `:435` en `STATUS_TICKET_CREADO` mientras `:422` usa `estadoInicial` (fila y foto se desacoplan): ROJO (SR: `to_status` ≠ `status`); revertir.

### Bloque C · Guarda de modalidad, ejecución y lectura

- [x] 2.13 RED — `flujoSoporteRemoto.test.ts` (nuevo, `appHarness`, molde `flujoEquipoNuevo.test.ts`), serie **P** (ejecución):
  P1 SR en `Solicitud Soporte`, usuario de Servicio Técnico, `asignacion_soporte` → 200 y `En Proceso`; P2 usuario sólo de Comercial → 403 en las cuatro desde su estado de origen; P3 `soporte_pendiente` y luego `continuacion_soporte` → 200 y 200, `Pendiente` y de vuelta a `En Proceso`;
  P4 `ejecutar_soporte` → `Finalizado`, y una segunda ejecución no procede; P5 `marcar_pendiente` sobre SR en `En Proceso` → 409 con «soporte remoto» en el mensaje; **P6 posición (M4):** servicio en `Rev./Diagnostico` + `asignacion_soporte` → 409 de flujo, NO «no aplica desde el estado»;
  P7 SR heredado en `Rev./Diagnostico` ejecuta una transición de `TRANSITIONS` → 200; P8 en `Solicitud Soporte` las ejecutables por Servicio Técnico son exactamente `asignacion_soporte`; **P9** `ejecutar_soporte` con `values: { modalidad: 'en sitio' }` sobre SR con `modalidad = 'remoto'` → 200 y la fila conserva `'remoto'` (RQ-SR-10).
  Serie **A** (alta, `POST /api/tickets`): A1 SR + equipo + `en sitio` → 201, fila y foto; A2 SR sin `modalidad` → 201 y `'remoto'`; A3 tabla `'presencial'`, `''`, `'Remoto'`, `null` → 422 nombrando `modalidad`, sin ticket ni equipo;
  A4 mantenimiento y `Equipo nuevo` sin `modalidad` → 201 y `NULL`; A5 `Equipo nuevo` con `modalidad: 'remoto'` y mantenimiento con `'en sitio'` → 422, sin escribir; A6 SR sin `equipoId` → `422 'Falta el equipo'` y cero filas;
  **A7 posición (M3):** SR + modalidad inválida + OV ya asociada a otro ticket → 422, no 409; **A8 posición (M2):** SR + modalidad inválida + OV en cuarentena (`OV-2026-170-X9`) → 422 de modalidad, no el de cuarentena;
  **A9 posición (M1):** `Equipo nuevo` + fecha opcional inválida (F1B-02) + `modalidad: 'remoto'` → 422 del equipo nuevo, no el de modalidad; A10 `GET` de la ficha trae `modalidad` (`'en sitio'`) y `null` cuando no hay.
  RQ: RQ-SR-02, RQ-SR-05 (6), RQ-SR-07 (3), RQ-SR-08, RQ-SR-09 (2), RQ-SR-10 (1), RQ-SR-11 (lectura), RQ-TC-05 (3), RQ-TC-06 (1), RQ-EN-04 (1).
- [x] 2.14 RED — barridos (al final de cada fichero, sin tocar lo existente): `permisos.test.ts` (molde `:209-270`): matriz 4×3 de `TRANSITIONS_SOPORTE_REMOTO` contra el servidor, esperado = `canExecuteTransition`, 12 casos, sólo Comercial = 403;
  `transicionesEjecucion.test.ts` (molde `:290-340`): las cuatro ejecutadas, sin `huérfanas` (toda id con caso) y `delGrafo` origen→destino; `avisoArea.test.ts` (molde `:76-80`): `areasSiguientes('Solicitud Soporte', TRANSITIONS_SOPORTE_REMOTO)` = `['Servicio Técnico']` y `areasAAvisar(…)` de un usuario de Servicio Técnico = `[]`.
  Ninguna exclusión explícita de SLA: `packages/shared/src/sla.ts:32-35` sólo da SLA a `Notificado` y `sla.test.ts:202` ya recorre `CATALOGO_POR_FLUJO` (D6).
- [x] 2.15 Confirmar rojo natural: rojos A1, A2, A3, A5, A7, A8, A9, A10 (el campo y la guarda no existen). **Nacen VERDES y se declaran** —el lote 1 ya entrega el enrutado por la vía de `shared`—: P1-P9, A4, A6 y los tres barridos de 2.14.
  Su rojo se obtiene por mutación (2.18-2.23); es honesto decirlo, no maquillar la columna.
- [x] 2.16 GREEN — `ticketService.ts` en su sitio: `:6` importa `modalidadDelAlta`; `:20` reescribe el comentario «nace en Ticket creado» (`+n −n`); `:91` gana la segunda sentencia, tras `validarCamposEquipoNuevo` y antes de la cuarentena/vencido de `:96` y del `409` de `:97-100`;
  `:107` pasa `modalidad` a `crearTicketConEquipo`; la guarda EN LÍNEA en `:91` (corrección de supervisión: el mismo largo, 234), que lanza `HttpError(422, { error })` con el texto que nombra `modalidad`. `rows.ts:50`, `mappers.ts:246` y `types.ts:131` en su sitio (`modalidad ?? null`).
- [x] 2.17 Confirmar 2.13 y 2.14 en verde; `git diff --numstat -- apps/desk/server/services/ticketService.ts`: en sitio `+n −n` y la función al final `−0`; orden resultante del escalón C: equipo↔cliente (`:61-79`) < obligatorios (`:83-88`) < cliente (`:89-90`) < opcionales de EN (`:91`) < modalidad (`:91`) < cuarentena/vencido (`:96`).
- [x] 2.18 MUTACIÓN (M1, regla 1) — mover la guarda de modalidad ANTES de `validarCamposEquipoNuevo`: ROJO A9; revertir.
- [x] 2.19 MUTACIÓN (M2, regla 1) — moverla DESPUÉS de la cuarentena (`:96`): ROJO A8; revertir.
- [x] 2.20 MUTACIÓN (M3, regla 1) — moverla DESPUÉS del `409` (`:97-100`): ROJO A7; revertir.
- [x] 2.21 MUTACIÓN (M4, regla 1) — guarda 3 (`:125`) DESPUÉS de la de estado (`:126-128`): ROJO P6; revertir.
- [x] 2.22 MUTACIÓN (S-1 revertida, molde del cambio 1) — `area: 'Comercial'` en `asignacion_soporte`: ROJO en la matriz 4×3 y en P1/P2 (demuestra que los barridos discriminan); revertir.
- [x] 2.23 MUTACIÓN — quitar el `422` de «modalidad enviada fuera de soporte remoto» (RQ-SR-09): ROJO A5; y quitar el default `remoto` de `modalidadDelAlta`: ROJO A2 y 1.16; revertir ambas.
- [x] 2.24 Verificación de regresión (sin RED nuevo): `npx vitest run apps/desk/server/services/ticketService.test.ts apps/desk/server/ordenVentaUnTicket.test.ts apps/desk/server/remisiones.test.ts apps/desk/server/flujoEquipoNuevo.test.ts`
  en verde, con `git diff` que muestre sólo inserciones al final de los ficheros de prueba tocados (`remisiones.test.ts:988` y las aserciones existentes no se tocan). Cubre los ocho escenarios heredados de RQ-TC-05 y el de RQ-TC-06.
- [x] 2.25 Cierre del lote 2: comando enfocado de la tabla; `npm test`; `npm run typecheck`; `eslint`; medir (nuevo: `flujoSoporteRemoto.test.ts`); recuentos `repo.ts` 452 y `ticketService.ts` 234-235 sin cambio en sitio, `schema.sql` 573→573+N, `migrate.test.ts` 444→444+N;
  barrido de citas sobre `ticketService.ts` (496: las que apuntan a `:91`, `:107`, `:20`, y «C antes que D» de `transitions-st`), `db/repo.ts` (95: `:405-411`, `:418-422`, `:434-435`), `schema.sql`, `rows.ts`, `mappers.ts`, `types.ts` y `migrate.test.ts` (`:327`, `:409-411` no se mueven); `apply-progress.md` (~60 líneas).

---

## Lote 3 · Cliente y cierre

**Estimación:** código ~50 · texto R08.3 ~30 · pruebas 0 · artefactos ~60 · **total ~140**. **Depende de:** Lote 2. `apps/desk/src` está fuera de la red de pruebas (F0-00, `vitest.config.ts:16-20`): sin RED/GREEN para `.tsx`; **no se propone `jsdom`**.

**Ficheros muy citados que toca:**

| Fichero (líneas; citas provisionales) | Puntos | Tipo |
|---|---|---|
| `apps/desk/src/components/CreateTicket.tsx` (455; 31) | `:3` import (`esClasificacionSoporteRemoto`, `MODALIDADES` de `@ambientalia/shared`); `:45` estado; `:230` payload (omite la clave fuera de SR); `:422` selector | EN SU SITIO (objetivo 0 desplazadas) |
| `apps/desk/src/components/TicketProperties.tsx` (a medir) | `:141-144` lectura junto a la clasificación | EN SU SITIO |
| `apps/desk/src/api/client.ts` (a medir) | tipo del alta gana `modalidad?: string`, en línea | EN SU SITIO |
| `apps/desk/server/services/equipoNuevo.ts` (a medir) | `:65-66` reparación de deriva previa | EN SU SITIO |
| `docs/sdd/R08.3_Expediente_de_cambios.md` (~657) | texto para el expediente (`toca_maestro: si`, sin tocar el `.docx`) | FINAL |

- [ ] 3.1 `client.ts` en línea: el tipo del cuerpo del alta gana `modalidad?: string`. `types.ts:131` ya lo trae del lote 2.
- [ ] 3.2 `CreateTicket.tsx` `:3`, `:45`, `:230`, `:422` en su sitio: estado inicial `remoto`; selector de dos opciones (`MODALIDADES`) visible sólo si `esClasificacionSoporteRemoto(clasificaciones)`, con etiquetas en español («Remoto», «En sitio») en la capa de presentación;
  el payload OMITE la clave en cualquier otra clasificación. El cliente no reescribe el predicado (regla 13, punto 1).
- [ ] 3.3 `TicketProperties.tsx` `:141-144`: mostrar `modalidad` en sólo lectura junto a la clasificación cuando no es `null`.
- [ ] 3.4 Sin prueba posible (F0-00): `npm run typecheck`, `npm run build` y `npx eslint . --max-warnings 165` en verde. La imposición está probada en node: 2.13 (A1-A10) y 1.16.
- [ ] 3.5 **Regla de mutación 3 — casilla de la regla 13, decisión a decisión de `CreateTicket.tsx`** (se escribe en `apply-progress.md`, dentro de las ~60 líneas; con la línea REAL leída al cerrar, no la del diseño). Se lee el fichero entero y se enumera todo lo que el cliente bloquea, rellena solo o avisa:
  | Decisión del cliente | Línea del servidor que la impone (a confirmar) |
  |---|---|
  | Mostrar el selector sólo en SR y omitir la clave en otra clasificación | `ticketService.ts:91` (guarda en línea sobre `modalidadDelAlta`, 422 si llega fuera de SR); prueba A5 |
  | Preseleccionar `remoto` | `modalidadDelAlta` en `flujos.ts` (el servidor pone `remoto` si falta); prueba A2 |
  | Ofrecer sólo dos valores | mismo `422` fuera del dominio; prueba A3 |
  | Enseñar la modalidad sólo en lectura | ninguna ruta la escribe tras el alta; prueba P9 |
  | No elegir el estado inicial | `repo.ts:418` y `:422` (`estadoInicialDelAlta`); pruebas 2.7 |
  | Exigir equipo en SR (preexistente, contigua al cambio) | `ticketService.ts:24`; prueba A6 |
  | Cualquier otra decisión que aparezca al leer el fichero | — |
  Sin línea, la decisión es la guarda: se para y se declara. **Heredado, no nuevo:** ocultar «Crear remisión» fuera de la fase inicial (`transitions.ts:163-165`) no tiene contrapartida en `routes/remision.ts` (0 usos de `puedeCrearRemisionDeEntrada`); el SR lo hereda y es F1B-03.
- [ ] 3.6 **Deriva previa, caso A:** `apps/desk/server/services/equipoNuevo.ts:65-66` cita `ticketService.ts:89` para `validarCamposEquipoNuevo`, que está en `:91` (leído hoy), y lo llama «la última guarda del escalón C», **falso ya hoy** por `:96` (cuarentena y vencido, C, que corre después) y falso a fortiori con la modalidad en `:91`.
  Reescribir en su sitio, mismas dos líneas: «`ticketService.ts:91`, tras los obligatorios y el cliente, antes de la cuarentena y el vencido de `:96` y del `409` de unicidad (escalón D)». Lo que afirma la cita se comprueba contra el árbol de ese momento (regla 4: LEER, no renumerar).
- [ ] 3.7 **Barrido de la regla de mutación 4 sobre CADA fichero muy citado tocado** (`transitions.ts`, `estados.ts`, `flujos.ts`, `ticketService.ts`, `schema.sql`, `db/repo.ts`, `rows.ts`, `mappers.ts`, `types.ts`, `migrate.test.ts`, `invariantesGrafo.test.ts`, `estados.test.ts`, `flujos.test.ts`, `CreateTicket.tsx`,
  `TicketProperties.tsx`, `api/client.ts`, `equipoNuevo.ts`, y los `*.test.ts` ampliados al final). Comando por fichero: `grep -rnoE "<fichero>\.(ts|tsx|sql):[0-9]+(-[0-9]+)?" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=archive`, y un segundo pase con la forma abreviada (`` `:NN` ``) en los ficheros que ya citan el módulo.
  Tres reglas: los DOS extremos de cada rango; lo que AFIRMA la frase y no sólo que la línea exista; y A/B/C para reparar. Como ninguna edición desplaza líneas, es verificación de contenido. Se releen a mano las que cambian de contenido:
  `ticketService.ts:91`, `:107`, `:20`; `repo.ts:405-411`, `:418-422`, `:434-435`; `estados.ts:101-111`, `:182-189`; `flujos.ts:56-61`, `:90-92`; `transitions.ts:365-376`; `invariantesGrafo.test.ts:163`, `:172`; `flujos.test.ts:42-45` (citada por la spec como prueba invertida: pasa a Caso B, se nombra la revisión `66ab783`).
  Después, el detector de `hook-citas-pre-push` sobre el diff: 0 rotas nuevas (no se salta con `--no-verify`).
- [ ] 3.8 Texto para el expediente R08.3, AL FINAL de `docs/sdd/R08.3_Expediente_de_cambios.md` (~30 líneas, sin tocar el `.docx`): M1.5 (`R08.2.md:1551-1568`) construido con los supuestos S-1 a S-10; el Anexo H (`R08.2.md:4642-4645`) deja de decir «No construido»;
  el campo «Modalidad» viene de `decision/anexo-43-en-sitio` (`openspec/config.yaml:2413`, `:2416`) y no de M1.5; el área de las cuatro transiciones es un supuesto abierto (P.3).
- [ ] 3.9 Comprobar que `git diff --stat HEAD -- CLAUDE.md openspec/config.yaml` está vacío (`transitions-soporte-remoto` ya está en `capabilities`, `openspec/config.yaml:123-127`; R-2 se cumple con la spec).
- [ ] 3.10 Cierre general: `npm test`; `npm run typecheck`; `npm run lint`; `npm run build`; medir el lote (sin ficheros nuevos de código); confirmar uno a uno los cuatro criterios de éxito de `proposal.md:160-163`;
  `apply-progress.md` (~60 líneas, con la casilla de 3.5). **Para el `archive-report`:** una línea con qué parte del contenido de la fila F1B-06 cubre (soporte remoto y Modalidad, `cierra: si`; equipo nuevo lo hizo `blueprint-equipo-nuevo`; «hereda C12» satisfecho sin trabajo aquí).
- [ ] 3.11 **Para el paquete de despliegue (anotado el 2026-09-29 por encargo de supervisión):** el supuesto S-6 entra en el paquete como **cambio visible**, no sólo como riesgo. El día del despliegue, los tickets de soporte remoto que estén en `Pendiente` en producción cambian de salidas: dejan de ver las de servicio y sólo les queda «Continuación soporte». Se escribe con el recuento de P.1 (tickets SR por estado). Sin ese recuento, el paquete lo dice como «sin medir», no lo omite.

---

## Matriz de cobertura de escenarios (56/56)

31 en `transitions-soporte-remoto` (S1-S31), 5 en `transitions-equipo-nuevo` RQ-EN-04 (E1-E5), 20 en `tickets-core` (T1-T19 con encabezado y T20 = bloque heredado de RQ-TC-06, `specs/tickets-core/spec.md:157-160`; ver A.2). **Total 56.**
`(V)` = nace VERDE y se prueba su discriminación por mutación o como regresión; se declara en `apply-progress.md` (ver 1.9, 1.18, 2.8, 2.15).

| # | Requisito | Escenario | Lote | Tarea(s) |
|---|---|---|---|---|
| S1 | RQ-SR-01 | Las cuatro transiciones existen con sus pares exactos | 1 | 1.6, 1.10-1.11 |
| S2 | RQ-SR-01 | Ninguna entrada declara campos de fecha ni motivo | 1 | 1.6-1.7, 1.10-1.11 |
| S3 | RQ-SR-01 | No hay salida de anulación (mutación) | 1 | 1.6, 1.12 |
| S4 | RQ-SR-02 | Las cuatro exigen el área Servicio Técnico | 2 | 2.13 P2, 2.14, 2.22 (V) |
| S5 | RQ-SR-02 | Un usuario de Servicio Técnico las ejecuta | 2 | 2.13 P1, 2.14 (V) |
| S6 | RQ-SR-03 | La unión deriva exactamente ESTADOS | 1 | 1.8-1.11, 1.15 |
| S7 | RQ-SR-03 | Solicitud Soporte no es un estado de servicio | 1 | 1.1-1.5, 1.8 |
| S8 | RQ-SR-03 | Finalizado sigue siendo el único sin salida | 1 | 1.8-1.11 (V) |
| S9 | RQ-SR-03 | Quitar `Ejecutar` deja a Finalizado sin entrada (mutación) | 1 | 1.6(f), 1.13 |
| S10 | RQ-SR-03 | Clase de espera de Solicitud Soporte | 1 | 1.1-1.4 |
| S11 | RQ-SR-04 | Alta de soporte remoto | 2 | 2.7-2.10, 2.13 A1, 2.16 |
| S12 | RQ-SR-04 | Las otras clasificaciones no cambian | 1, 2 | 1.16-1.19, 2.7-2.10, 2.13 A4 (V) |
| S13 | RQ-SR-04 | Soporte remoto sin equipo sigue rechazado | 2 | 2.13 A6 (V), 2.24 |
| S14 | RQ-SR-05 | Solicitud Soporte sólo ofrece Asignación | 1, 2 | 1.16-1.19, 2.13 P8 (V) |
| S15 | RQ-SR-05 | El bucle Pendiente ↔ En Proceso funciona | 2 | 2.13 P3 (V), 2.14 |
| S16 | RQ-SR-05 | Ejecutar finaliza | 2 | 2.13 P4 (V), 2.14 |
| S17 | RQ-SR-05 | Una transición de servicio sobre soporte remoto da 409 con el flujo | 1, 2 | 1.16-1.19, 2.13 P5 (V) |
| S18 | RQ-SR-05 | La guarda de flujo gana a la de estado (posición) | 2 | 2.13 P6 (V), 2.21 |
| S19 | RQ-SR-05 | Soporte remoto heredado en estado sólo de servicio no queda varado | 1, 2 | 1.16-1.19, 1.21, 2.13 P7 (V) |
| S20 | RQ-SR-06 | Ninguna colisión de ids | 1 | 1.6(e), 1.10-1.11, 1.14 |
| S21 | RQ-SR-06 | `marcar_pendiente` sigue siendo de servicio | 1 | 1.6(e), 1.16-1.19 (V) |
| S22 | RQ-SR-07 | Modalidad válida se guarda | 2 | 2.7-2.10, 2.13 A1 |
| S23 | RQ-SR-07 | Modalidad inválida da 422 | 1, 2 | 1.16-1.19, 1.24, 2.13 A3, 2.16 |
| S24 | RQ-SR-07 | La guarda gana al 409 de la OV (posición) | 2 | 2.13 A7, 2.20 |
| S25 | RQ-SR-08 | Sin modalidad se guarda remoto | 1, 2 | 1.16-1.19, 2.13 A2, 2.23 |
| S26 | RQ-SR-09 | Equipo nuevo o mantenimiento sin modalidad | 2 | 2.7-2.10, 2.13 A4 (V) |
| S27 | RQ-SR-09 | Modalidad enviada con otra clasificación | 1, 2 | 1.16-1.19, 2.13 A5, 2.23 |
| S28 | RQ-SR-10 | Las transiciones no editan modalidad | 1 | 1.6(c), 1.10-1.11 |
| S29 | RQ-SR-10 | Un valor de modalidad en una transición no la cambia | 2 | 2.13 P9 (V) |
| S30 | RQ-SR-11 | La sincronización no toca modalidad | 2 | 2.7-2.10 (V), 2.11 |
| S31 | RQ-SR-11 | `TICKET_COLS` no contiene modalidad (mutación) | 2 | 2.7, 2.11 |
| E1 | RQ-EN-04 | `Equipo nuevo` heredado en estado sólo de servicio sigue en servicio | 1 | regresión `flujos.test.ts:47-49` (V); 1.16-1.20 |
| E2 | RQ-EN-04 | `Equipo nuevo` en un estado de su catálogo pasa a equipo-nuevo | 1 | regresión `flujos.test.ts:34-36` (V); 1.20 |
| E3 | RQ-EN-04 | `Soporte remoto` en un estado de su catálogo pasa a soporte-remoto | 1 | 1.16-1.19 |
| E4 | RQ-EN-04 | `Soporte remoto` heredado en estado sólo de servicio sigue en servicio | 1, 2 | 1.16-1.19, 1.21, 2.13 P7 |
| E5 | RQ-EN-04 | La clasificación desambigua `En Proceso` | 1 | 1.16-1.19 |
| T1 | RQ-TC-05 | El alta sin discrepancia no cambia | 2 | regresión (V); 2.24 |
| T2 | RQ-TC-05 | La OV ya usada deja de ganar a los obligatorios | 2 | regresión (V); 2.24 |
| T3 | RQ-TC-05 | La OV ya usada deja de ganar al cliente no encontrado | 2 | regresión (V); 2.24 |
| T4 | RQ-TC-05 | La discrepancia equipo↔cliente gana a la OV ya usada | 2 | regresión (V); 2.24 |
| T5 | RQ-TC-05 | Dentro de C, equipo↔cliente antes de contar obligatorios | 2 | regresión (V); 2.24 |
| T6 | RQ-TC-05 | Rama «Equipo nuevo», datos obligatorios ausentes | 2 | regresión (V); 2.24 |
| T7 | RQ-TC-05 | Rama «Equipo nuevo», dato opcional inválido | 2 | regresión (V); 2.13 A9, 2.18, 2.24 |
| T8 | RQ-TC-05 | Las otras dos clasificaciones no cambian (`Falta el equipo`) | 2 | 2.13 A6 (V), 2.24 |
| T9 | RQ-TC-05 | Modalidad inválida en un alta de soporte remoto | 2 | 2.13 A3, 2.16 |
| T10 | RQ-TC-05 | Modalidad enviada con otra clasificación | 2 | 2.13 A5, 2.23 |
| T11 | RQ-TC-05 | La guarda de modalidad gana a la OV ya usada | 2 | 2.13 A7, 2.20 |
| T12 | RQ-TC-06 | Alta de soporte remoto deja las dos filas con `Solicitud Soporte` | 2 | 2.7-2.10, 2.12 |
| T13 | RQ-TC-06 | Alta de otra clasificación no cambia | 2 | 2.7-2.10 (V) |
| T14 | RQ-TC-06 | Un fallo posterior revierte las dos filas | 2 | 2.7-2.10 |
| T15 | RQ-TC-07 | Ningún ticket de la app nace en `OV asignada` | 2 | 2.7-2.10 (V) |
| T16 | RQ-TC-07 | El estado inicial depende de la clasificación | 1, 2 | 1.16-1.19, 1.22, 2.7-2.10 |
| T17 | RQ-TC-10 | Un ticket `Equipo nuevo` deja de caer en el grafo de servicio | 1 | regresión `flujos.test.ts:72-75` (V); 1.20 |
| T18 | RQ-TC-10 | Un ticket `Soporte remoto` deja de caer en el grafo de servicio | 1, 2 | 1.16-1.19, 2.13 P1/P8 |
| T19 | RQ-TC-10 | La prueba «soporte remoto siempre enruta a servicio» se invierte | 1 | 1.16-1.19 |
| T20 | RQ-TC-06 (bloque heredado) | Ticket anterior al payload completo: la historia cae a la fila | 2 | regresión `repo.test.ts:221` y `ticketFuentes.ts:63-75` (V); 2.24 |

**56/56 escenarios cubiertos** (31 + 5 + 20). Los escenarios ejecutados contra el servidor (P-series) nacen verdes porque el lote 1 ya entrega el enrutado por `shared`; su rojo lo dan las mutaciones M1-M4 (2.18-2.21), M11 (1.21) y 2.22, no un RED natural.
`.tsx` (selector y lectura): sin escenario de spec y sin prueba posible (F0-00); cubierto por la regla 13 (3.5) y por P.2.

## Tareas de persona — fuera del recuento (regla del ciclo 1)

Cada una con dueño, destino y dónde queda escrita. **Archivar este cambio NO las da por hechas.** Ninguna describe trabajo que una tanda pueda hacer en este repositorio (se comprobó al sacarlas: el apply no puede consultar producción ni desplegar).

- **P.1 · Alfonso — recuento de SR por estado (solo lectura), ANTES de desplegar.** Cuántos tickets `Soporte remoto` cambian de flujo por S-6 (los que están en `En Proceso`, `Pendiente` o `Finalizado`); los demás siguen en servicio. Destino: decidir si S-6 es aceptable o hay que mover datos.
  Escrita en: este documento, `proposal.md` (§Tareas de persona) y el parte. No bloquea los lotes. La consulta cuenta con dos criterios a la vez, el de la propuesta y el que aplica el código (`normalizar`, `flujos.ts:32-34`, que también colapsa espacios internos); si difieren, se dice:

  ```sql
  SELECT status,
         count(*) FILTER (WHERE lower(trim(classification)) = 'soporte remoto')                                   AS criterio_propuesta,
         count(*) FILTER (WHERE regexp_replace(lower(trim(classification)), '\s+', ' ', 'g') = 'soporte remoto') AS criterio_codigo
  FROM desk.tickets
  GROUP BY status
  HAVING count(*) FILTER (WHERE regexp_replace(lower(trim(classification)), '\s+', ' ', 'g') = 'soporte remoto') > 0
  ORDER BY status;
  ```
  Resultado (a rellenar por Alfonso): `_________`.
- **P.2 · Alfonso / Servicio Técnico — verificación en la app tras desplegar los tres lotes**, en `ambientalia-desk.ambientalia.cloud`: (1) alta con clasificación `Soporte remoto`: el selector de Modalidad aparece sólo entonces, preseleccionado en «Remoto»; (2) el ticket nace en `Solicitud Soporte` y la ficha muestra la modalidad;
  (3) un usuario de Servicio Técnico ve sólo «Asignación»; (4) el bucle `En Proceso` → «Soporte pendiente» → `Pendiente` → «Continuación soporte» → `En Proceso`, y «Ejecutar» → `Finalizado` sin más salidas; (5) un alta de equipo nuevo o de mantenimiento no muestra selector y queda sin modalidad;
  (6) el ticket en `Solicitud Soporte` cae en la columna «Otros» del tablero (S-10, F1B-09 le dará la suya); (7) un SR heredado en `Pendiente` ve ahora las cuatro del flujo remoto. Destino: verificación en la app. Escrita en: este documento y `proposal.md`.
- **P.3 · Gerencia / Servicio Técnico — confirmar el área de las cuatro transiciones (S-1).** La hoja `DF-soporte-remoto-030226.xlsx` trae `ÁREA_RESPONSABLE` vacía y M1.5 no la dice; `Asignación` podría ser de Comercial, que recibe la solicitud. Destino: si la respuesta es Comercial, se cambia UN dato (`area` de `asignacion_soporte`) y la matriz 4×3 de 2.14, y desbloquea cerrar S-1 como decisión y no como supuesto.
  Escrita en: `docs/sdd/ENTRADA.md` (entrada nueva; la última registrada es E-089, la numera quien la escribe), este documento y `proposal.md`. Registrar la PREGUNTA en la bandeja es documentación directa del orquestador al cerrar (no es tarea de `apply` ni cuenta); la RESPUESTA es de Gerencia.

### Nota de despliegue (reversión)

- La `ALTER` la aplica `migrate()` al arrancar; es aditiva y nullable y **se queda** aunque se revierta el código (el código viejo ignora la clave nueva porque `SELECT t.*` sólo añade una propiedad).
- **Un rollback deja sin transiciones a los SR ya nacidos en `Solicitud Soporte`:** con el código viejo ese estado no está en ningún catálogo, `flujoDelTicket` los manda a `servicio` y `TRANSITIONS` no tiene salidas desde él. Antes de revertir, contarlos con
  `SELECT count(*) FROM desk.tickets WHERE status = 'Solicitud Soporte';`. Moverlos a otro estado es dato de producción y **decisión de persona**, no de esta tanda.
- Desplegar los tres lotes juntos (un solo despliegue): el lote 1 solo cambia el enrutado de SR heredados sin que ninguno nazca en `Solicitud Soporte`, y el lote 2 solo deja al cliente viejo enviando altas SR sin `modalidad` (el servidor pone `remoto`, RQ-SR-08).

## Dependencias entre lotes

Lote 1 es la base: `Solicitud Soporte`, catálogo, registro de flujos, `estadoInicialDelAlta` y `modalidadDelAlta` viven en `packages/shared` (regla 13: una sola fuente). Lote 2 depende sólo del 1: el escritor y la guarda importan esas funciones de `shared`,
y los barridos de ejecución y permisos recorren el catálogo. Lote 3 depende del 2: el selector consume `MODALIDADES` y `esClasificacionSoporteRemoto` de `shared` y lee `modalidad` del servidor; el cierre (regla 4, regla 13) sólo tiene sentido con todo el código dentro.
Una tanda SDD por árbol (regla del ciclo 2): los tres lotes van **en serie**; `verify` y `archive` son intentos aparte del ledger, y el archive suma el `git mv` y supera 800 por eso.
