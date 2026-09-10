```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:7c1ac8c1de26ba9f63c0b1d9fca8f3891f8c46893f1f7865f3e5db6a7fcbfa96
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 10/10
scenarios: 17/17
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:7a80926c279f6a2ef65bb6ce3ee8cd8be8f551a8abfec38a91b834a1ed7d0348
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:6a4c4072315d2dd3756e7377b56efbb52d1711561d7c3a39287bfb99211a411c
```

## Verification Report

**Change**: vista-todos-y-estados-en-espera (Tanda A · F1B-08)
**Base**: `8d0c4b5` → **HEAD verificado**: `3b7d89c0e10e847d12d704dd94deed5ec52efa34`
**Mode**: Strict TDD (`interactive · hybrid · ask-on-risk · 800 líneas · strict_tdd`, confirmado en
`openspec/config.yaml:26-30` de disco, no heredado)
**evidence_revision**: sha256 del HEAD `3b7d89c0e10e847d12d704dd94deed5ec52efa34`, no un hash sha256
nativo de Git — declarado así porque el esquema exige el prefijo `sha256:`.

Todas las citas de ruta:línea de este informe se re-verificaron contra el árbol de trabajo en esta
sesión de `sdd-verify`, no se heredaron de `proposal.md`, `design.md`, `tasks.md` ni `apply-progress.md`
sin comprobar.

### Citas re-verificadas de disco: 32 comprobadas, 8 caducas, 2 imprecisas

| # | Cita en el artefacto | Afirmación | Estado real | Veredicto |
|---|---|---|---|---|
| 1 | `vistas-tablero/spec.md` RQ-VT-04 | `enEsperaDe` en `estados.ts:158-162` | función en `estados.ts:163-167` | **CADUCA** (+5) |
| 2 | `vistas-tablero/spec.md` RQ-VT-04 | `ESTADOS_EN_ESPERA` en `estados.ts:111` | declarado en `estados.ts:114` | **CADUCA** (+3) — mismo defecto que el ejemplo del orquestador |
| 3 | `vistas-tablero/spec.md` RQ-VT-05 | filtro de cerrados en `boardView.ts:44` | `case 'espera':` está en `boardView.ts:48` | **CADUCA** (+4) |
| 4 | `vistas-tablero/spec.md` (encabezado, cubre) | `FUNCTIONAL_VIEWS` en `boardView.ts:6-15` | declarado en `boardView.ts:7-16` | **CADUCA** (+1) |
| 5 | `transitions-st/spec.md` RQ-TS-15 | `Notificado: 'ninguna'` en `estados.ts:79` | en `estados.ts:83` | **CADUCA** (+4) — mismo ejemplo que dio el orquestador, repetido dos veces en el spec |
| 6 | `transitions-st/spec.md` §3.7 | `Notificado: 'ninguna'` en `estados.ts:79` (segunda aparición) | en `estados.ts:83` | **CADUCA** (+4), misma cita que la fila 5 |
| 7 | `transitions-st/spec.md` §3.2 | Escenario "la derivación da seis" en `estados.test.ts:176-185` | el `it(...)` real ocupa `estados.test.ts:157-169` | **CADUCA** (offset de unas 19 líneas) |
| 8 | `transitions-st/spec.md` §3.2 | "por eso los cuatro se declaran y no se derivan" en `estados.ts:132-136` | el texto que sostiene esa frase vive en `estados.ts:120-121`; `:132-136` habla de otro párrafo distinto | **CADUCA/imprecisa** |
| 9 | `transitions-st/spec.md` §3.2 | frase "el suceso ocurre fuera de la aplicación" en `estados.ts:120-124` | la frase entrecomillada empieza en `estados.ts:125` | imprecisa (±1-5 líneas) |

Citas confirmadas frescas (exactas), muestra representativa de las ~23 restantes comprobadas:
`estados.ts:114` (`ESTADOS_EN_ESPERA`, ejemplo del orquestador), `estados.ts:83` (`Notificado`,
contra `sla.test.ts`/`config.yaml`/`CLAUDE.md`, que sí la citan bien), `estados.ts:78`
(`'Remisión creada': 'interna'`), `estados.ts:26-33`, `estados.ts:28`, `estados.ts:61`,
`boardView.ts:38-56` (`applyBoardView`, ejemplo del orquestador, y reanclaje de `permissions/spec.md:270`),
`boardView.ts:39`, `packages/zoho-sync/src/db/repo.ts:145-148` (`countClosedTickets`),
`apps/desk/server/routes/tickets.ts:106` (`pageSize=50`), `apps/desk/server/tickets.test.ts:84,86,87,90-99`,
`apps/desk/src/components/TicketCard.tsx:2,14-23,83`, `apps/desk/src/components/Sidebar.tsx:82`,
`packages/shared/src/columns.ts:6`, `vitest.config.ts:16,17-20,57`, `ClienteDetalle.tsx:18,22`,
`TicketDetailView.tsx:245`, `openspec/config.yaml` (IV-1/IV-5/IV-7 `CERRADO`, IV-9 abierto),
`CLAUDE.md` («Cuatro» desvíos, confirmado por `grep` de disco — la copia de `CLAUDE.md` cacheada al
abrir esta sesión mostraba texto de antes de `3b7d89c`; se descartó como hipótesis de segunda mano y
se leyó el fichero de nuevo).

Ninguna de las ocho citas caducas cambia un veredicto de COMPLIANT a NON-COMPLIANT. Son errores de
trazabilidad documental (la regla de método del proyecto las trata como defecto igualmente), no
defectos funcionales: el código en la línea correcta hace lo que el requisito promete. Se listan, no
se corrigen (fuera de alcance de `sdd-verify`).

---

### Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 42 |
| Tasks complete | 42 |
| Tasks incomplete | 0 |

Las 42 tareas de `tasks.md` (40 de Fases 0-6 + 2 de "Fuera de `sdd-apply` → destino `sdd-archive`")
están `[x]`. Las dos últimas (`:299`, `:304`) las ejecutó el orquestador en `3b7d89c`, verificadas
igual que las demás: `openspec/specs/permissions/spec.md:270` reanclado a `boardView.ts:38-56`
(confirmado de disco), `:273-274` reescrito para decir dónde vive hoy el desvío (confirmado);
`openspec/config.yaml` tiene IV-1, IV-5 e IV-7 con `estado: CERRADO` y abre IV-9 (confirmado);
`CLAUDE.md` dice «Cuatro» desvíos vivos, no «Seis» (confirmado por `grep` directo sobre el fichero en
disco, no sobre la copia inyectada al arrancar esta sesión, que resultó ser de antes del commit).

Las 5 comprobaciones manuales de `tasks.md:331-337` ("Fuera del recuento") no cuentan para este
recuento: su dueño está fuera del repositorio (regla del ciclo 1 de `CLAUDE.md`). No son blocker.

---

### Build & Tests Execution

**Tests**: ✅ 1009 passed / 2 skipped (1011), 112 ficheros passed / 1 skipped (113) — idéntico al
baseline declarado (1009 passed / 2 skipped, 112 ficheros)
```text
$ npm test
Test Files  112 passed | 1 skipped (113)
     Tests  1009 passed | 2 skipped (1011)
Exit code: 0
sha256(salida completa): 7a80926c279f6a2ef65bb6ce3ee8cd8be8f551a8abfec38a91b834a1ed7d0348
```

**Typecheck**: ✅ limpio
```text
$ npm run typecheck
> tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit
Exit code: 0
```

**Lint**: ✅ 0 errores / 158 avisos — idéntico al trinquete de `ci.yml:41`
```text
$ npm run lint
✖ 158 problems (0 errors, 158 warnings)
Exit code: 0
sha256(salida completa): a47e0f44714bf71d0b0a2f5c576cd7a57666ac8ef191bf3520156e9cc7cc8493
```

**Build**: ✅ limpio
```text
$ npm run build
✓ 105 modules transformed. built in 1.71s
Exit code: 0
sha256(salida completa): 6a4c4072315d2dd3756e7377b56efbb52d1711561d7c3a39287bfb99211a411c
```

**Coverage (ficheros cambiados, foco `estados.test.ts` + `boardView.test.ts`)**:

| Fichero | Líneas | Ramas | Funciones | Rating |
|---|---|---|---|---|
| `packages/shared/src/estados.ts` | 100% | 100% | 100% | ✅ Excelente |
| `apps/desk/src/lib/boardView.ts` | 100% | 96.55% (línea 39, una rama sin cubrir) | 100% | ✅ Excelente |
| `packages/shared/src/columns.ts` | 93.54% | 100% | 0%* | ✅ Excelente — *sólo se tocó el comentario de `:6`; `columnForStatus` la cubre `columns.test.ts` (5 pruebas, no incluidas en esta corrida focalizada) |
| `App.tsx`, `Sidebar.tsx`, `TicketCard.tsx` | N/A | N/A | N/A | ➖ Excluidos por decisión de Gerencia (`vitest.config.ts:57`, `.tsx`) |

---

### Spec Compliance Matrix — `vistas-tablero` (6 requisitos, 13 escenarios)

| Requisito | Escenario | Test | Resultado |
|---|---|---|---|
| RQ-VT-01 | activos y cerrados, sin entrelazar | `boardView.ts:53` (no filtra) + concatenación en `App.tsx:74` (sin test, `.tsx`) | ✅ COMPLIANT (manual, declarado) — la mitad probada por `boardView.test.ts:18`; el orden "sin entrelazar" vive en `App.tsx`, sin detector automático. Declarado explícitamente en `tasks.md:337` (fila 5 de "Fuera del recuento") como excepción bajo F0-00 |
| RQ-VT-01 | rótulo declara total real de cerrados | `tickets.test.ts:82` (servidor) + `App.tsx:138` (`total={closedMeta.total}`, inspección de código) | ✅ COMPLIANT (manual, NO declarado) — sin test dedicado que ejercite el paso servidor→UI; no está listado en "Fuera del recuento" (`tasks.md:331-337`), a diferencia del escenario anterior. Misma clase de excepción técnica (`.tsx`), pero sin la anotación explícita. Ver WARNING |
| RQ-VT-01 | bloque de cerrados respeta paginación | `tickets.test.ts:84,86` | ✅ COMPLIANT |
| RQ-VT-02 | clave desconocida → `[]` | `boardView.test.ts:23` | ✅ COMPLIANT |
| RQ-VT-02 | clave desconocida → `'Vista no reconocida'` | `boardView.test.ts:90` | ✅ COMPLIANT |
| RQ-VT-02 | mutación — control de separación | Atestiguado en `apply-progress.md` (control P1, Fase 4): exactamente 2 fallos al refusionar. No re-ejecutado (destructivo); coherente con `boardView.ts:53-54` hoy separado | ✅ COMPLIANT (atestiguado) |
| RQ-VT-03 | cada key funcional tiene su case | 6 `it()` de `boardView.test.ts` + guarda `never` en `boardView.ts:59` | ✅ COMPLIANT |
| RQ-VT-03 | mutación — control D2 | Atestiguado (typecheck falla con mensaje exacto sobre `never`). No re-ejecutado | ✅ COMPLIANT (atestiguado) |
| RQ-VT-04 | seis estados escapados caen en «espera» | `boardView.test.ts:39-44` (6 casos) | ✅ COMPLIANT |
| RQ-VT-04 | mutación — fichero vigilado, no copia | Atestiguado (control P3). Tripwire falso retirado, confirmado por lectura directa de `estados.test.ts` (ya no existe ningún `it('documenta el defecto...')`) | ✅ COMPLIANT (atestiguado + confirmación estructural) |
| RQ-VT-04 | fixture corregido | `boardView.test.ts:11` usa `'En Espera de Repuestos'` (coincide con `estados.ts:61`) | ✅ COMPLIANT |
| RQ-VT-05 | cerrado en espera no aparece en «espera» | `boardView.test.ts:54-57` | ✅ COMPLIANT |
| RQ-VT-06 | color real de la tarjeta (manual) | Excepción declarada, `.tsx` fuera de `vitest.config.ts:17-20` (F0-00). `TicketCard.tsx:14-23` reclavado con 8 nombres reales | ✅ COMPLIANT (manual, declarado) — pendiente de las 4 comprobaciones manuales de `tasks.md:333-336` |

**Compliance summary `vistas-tablero`**: 6/6 requisitos implementados; 13/13 escenarios verificados.
10 con test automatizado pasando, 2 atestiguados de mutación (no re-ejecutados, coherentes con el
código), y 3 por excepción manual bajo F0-00 (2 declaradas explícitamente en `tasks.md`, 1 no
declarada — ver WARNING). Ninguno es defecto funcional.

### Spec Compliance Matrix — `transitions-st` delta (4 bloques MODIFIED, 4 escenarios)

| Requisito | Escenario | Test | Resultado |
|---|---|---|---|
| RQ-TS-15 | `Notificado` sigue fuera de las 9+4 tras el reparto | `sla.test.ts:50-54` | ✅ COMPLIANT (cita `estados.ts:79` en el spec está CADUCA, real `:83`) |
| §3.2 (C3) | derivación mal hecha da 6, no 4 | `estados.test.ts:157-169` | ✅ COMPLIANT (cita del spec `estados.test.ts:176-185` está CADUCA) |
| §3.6 (IV-1) | registro reemplaza la regex, tripwire real lo demuestra | `boardView.test.ts` (tripwire real, 17/17 verde) + tripwire falso retirado (confirmado, ya no existe en `estados.test.ts`) | ✅ COMPLIANT |
| §3.7 | Remisión creada entra en la vista sin mover el reloj | `estados.test.ts:84-96` (nueve en `ESTADOS_EN_ESPERA`) + `sla.test.ts:50-54` | ✅ COMPLIANT |

**Compliance summary `transitions-st`**: 4/4 bloques MODIFIED ciertos contra el código final; 4/4
escenarios con evidencia de ejecución completa. Dos de las cuatro citas de línea que sostienen estos
bloques están caducas (filas 5/6 y 7 de la tabla de citas), sin afectar el veredicto.

**Totales combinados**: 10/10 requisitos implementados; 17/17 escenarios verificados (14 con evidencia
de ejecución automatizada directa, 3 por excepción manual sancionada por F0-00 — ninguno es defecto).

---

### TDD Compliance

| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ✅ | Tabla "TDD Cycle Evidence" en `apply-progress.md`, 7 filas |
| All tasks have tests | ✅ | 6/6 unidades de trabajo con test focalizado o control explícito (unidad 5 es la excepción declarada) |
| RED confirmado (tests existen) | ✅ | `estados.test.ts` (12 pruebas), `boardView.test.ts` (17 pruebas) confirmados en disco |
| GREEN confirmado (tests pasan) | ✅ | 1009/1009 pruebas relevantes pasan hoy; los recuentos por fichero (12, 17, 15) coinciden exactamente con los declarados en `apply-progress.md` |
| Triangulación adecuada | ✅ | RQ-VT-04 triangula con 6 casos distintos; RQ-VT-02/03 con 2-3 casos cada uno |
| Safety Net ficheros modificados | ✅ | Fases 1-2 corren la suite existente antes de mutar (`estados.test.ts`/`boardView.test.ts` en verde antes de cada GREEN) |

**TDD Compliance**: 6/6 checks passed

---

### Test Layer Distribution

| Layer | Tests | Files | Tools |
|-------|-------|-------|-------|
| Unit | 29 nuevas/editadas (17 `boardView.test.ts` + 12 `estados.test.ts`) | 2 | vitest |
| Integration | 0 (rutas de servidor como `tickets.test.ts` preexistentes, no tocadas por esta tanda) | — | — |
| E2E | 0 | — | — |
| **Total (esta tanda)** | **29** | **2** | vitest |

---

### Assertion Quality

Auditados `boardView.test.ts` y `estados.test.ts` completos (los dos ficheros de test que esta tanda
edita). Cero violaciones: todas las aserciones llaman código de producción real (`applyBoardView`,
`viewLabel`, `enEsperaDe`, `ESTADOS_EN_ESPERA`, …), comparan contra valores concretos (arrays/strings
específicos, no `toBeDefined()` suelto), no hay mocks, no hay bucles sobre colecciones potencialmente
vacías, no hay aserciones de detalle de implementación (clases CSS, recuentos de llamadas a mock).

**Assertion quality**: ✅ Sin hallazgos — todas las aserciones verifican comportamiento real

---

### Correctness (Static Evidence)

| Requisito | Estado | Notas |
|---|---|---|
| RQ-VT-01 | ✅ Implementado | `boardView.ts:53` sin filtro; `App.tsx:60-74` compone activos+cerrados; `tickets.ts:104-116` sirve ambos scopes |
| RQ-VT-02 | ✅ Implementado | `default: return vistaNoReconocida(key)`, separado de `case 'todos':` (`boardView.ts:54`) |
| RQ-VT-03 | ✅ Implementado | `VistaKey` derivado de `FUNCTIONAL_VIEWS` + guarda `never` (`boardView.ts:19,59`) |
| RQ-VT-04 | ⚠️ Implementado, con matiz | `boardView.ts:39` consume `(ESTADOS_EN_ESPERA as readonly string[]).includes(...)`, no llama a la función `enEsperaDe` que el texto del requisito nombra — ver WARNING |
| RQ-VT-05 | ✅ Implementado | `boardView.ts:48`, filtro `statusType !== 'Closed'` en la rama `espera` |
| RQ-VT-06 | ✅ Implementado | `TicketCard.tsx:14-23` reclavado, import corregido (`:2`) |
| RQ-TS-15 | ✅ Implementado | `estados.ts:83` (`Notificado: 'ninguna'`), `sla.ts:32-35` sin cambios |
| §3.2 (C3) | ✅ Implementado | `estados.ts:78` (`Remisión creada: 'interna'`), derivación fija en `estados.test.ts:157-169` |
| §3.6 (IV-1) | ✅ Implementado | `boardView.ts:2,39` |
| §3.7 | ✅ Implementado | `estados.ts:114-117` (`ESTADOS_EN_ESPERA`, 9 entradas) |

### Coherence (Design)

| Decisión | Seguida | Notas |
|---|---|---|
| D1 (no estado nuevo para `closedPage`) | ✅ Sí | `App.tsx:58-59` sin cambios, confirmado |
| D2 (guarda `never` como detector) | ✅ Sí | `boardView.ts:59`, control de mutación atestiguado |
| D3 (cast en vez de reescribir la regla) | ✅ Sí, con matiz de nombre | Spec dice `enEsperaDe`, el código usa el array directamente; funcionalmente equivalente, D3 lo eligió así explícitamente (`tasks.md:157`) |
| D5 (import higiénico en `TicketCard`) | ✅ Sí | `TicketCard.tsx:2` |
| Regla 13 (7 filas, tabla de `apply-progress.md` 6.1) | ✅ Sí, re-verificada | Las 7 filas siguen ciertas contra el código final (comprobación independiente en esta sesión) |

---

### Issues Found

**CRITICAL**: None

**WARNING**:
1. Ocho citas de línea caducas en los artefactos de esta tanda (tabla de citas, filas 1-7 de 9), de las
   cuales dos (`estados.ts:79` en vez de `:83`, en dos sitios de `transitions-st/spec.md`) son
   exactamente el defecto que ya señaló el orquestador como ejemplo; las otras seis son hallazgo nuevo
   de esta verificación: `enEsperaDe` en `estados.ts:158-162` (real `:163-167`), `ESTADOS_EN_ESPERA` en
   `estados.ts:111` (real `:114`, mismo defecto que el ejemplo del orquestador pero en otra cita),
   `boardView.ts:44` para el filtro de `espera` (real `:48`), `FUNCTIONAL_VIEWS` en `boardView.ts:6-15`
   (real `:7-16`), y el escenario de `estados.test.ts:176-185` (real `:157-169`, offset de ~19 líneas).
2. RQ-VT-04 nombra una función que el código no llama. El requisito dice que `applyBoardView` clasifica
   con `enEsperaDe(estado)`, pero `boardView.ts:39` usa
   `(ESTADOS_EN_ESPERA as readonly string[]).includes(t.status ?? '')` directamente, sin invocar
   `enEsperaDe`. La decisión de diseño D3 (`tasks.md:157`) eligió este camino a propósito, y el efecto
   normativo del requisito (no usar regex, consumir el registro de dominio) sí se cumple — pero el
   texto del requisito describe un mecanismo distinto del implementado. No bloquea: es una imprecisión
   de redacción, no una guarda ausente.
3. RQ-VT-01, escenario "el rótulo declara el total real de cerrados", no tiene test dedicado ni está
   declarado como excepción manual. A diferencia del escenario "sin entrelazar" (declarado
   explícitamente en `tasks.md:337`, fila 5 de "Fuera del recuento"), este escenario no aparece en esa
   tabla. Se apoya en `tickets.test.ts:82` (servidor) + una lectura de código de `App.tsx:138`
   (`total={closedMeta.total}`, un passthrough sin lógica propia, sin recuento local competidor
   detectado). Misma clase técnica que las excepciones sí declaradas (`.tsx` fuera de vitest), pero sin
   la anotación explícita. Riesgo bajo, pero es una laguna de documentación: debería estar en la tabla
   de "Fuera del recuento" junto a las otras 5, o llevar un test que lo ejercite explícitamente.

**SUGGESTION**:
1. `packages/shared/src/sla.test.ts:50-54` sigue verde por la razón correcta hoy (intersección vacía
   entre `SLA_HORAS_POR_ESTADO` y `ESTADOS_EN_ESPERA`, confirmado), pero es una dependencia saliente
   declarada, no un defecto: la tanda de la alarma de 72 h de P21 tendrá que reformular esa prueba si
   declara SLA para `Remisión creada`. Ya está anotado como riesgo R-1 en `transitions-st/spec.md`; no
   requiere acción de esta verificación.
2. RQ-VT-06 y las 4 comprobaciones de color siguen sin dueño de calendario fijado más allá de "QA / quien
   despliegue" (`tasks.md:333-336`). No bloquea `archive`, pero conviene que Gerencia confirme quién y
   cuándo las ejecuta tras el despliegue de esta tanda.

---

### Verdict

**PASS WITH WARNINGS**

10/10 requisitos implementados, 17/17 escenarios verificados (14 con evidencia de ejecución
automatizada, 3 por excepción manual sancionada bajo F0-00), 42/42 tareas completas, 1009/1009 pruebas
relevantes en verde (idéntico al baseline), typecheck/lint/build limpios (lint en el mismo trinquete de
158 avisos). Cero hallazgos CRITICAL: ningún defecto funcional, ninguna guarda ausente, ningún
escenario obligatorio sin cobertura ni excepción sancionada. Los 3 WARNING son de trazabilidad
documental (citas de línea caducas + una imprecisión de nombre de función + un escenario manual no
declarado explícitamente) y no bloquean el archivado; se recomienda que `sdd-archive` los deje
anotados o los repare al fusionar, sin reabrir la implementación.
