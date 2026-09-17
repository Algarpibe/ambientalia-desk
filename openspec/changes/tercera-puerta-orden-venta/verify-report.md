```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:f4330d894d879600d06c93f63badc9d37e7e662b2a2a8bd805eab256be62db2c
verdict: fail
blockers: 1
critical_findings: 1
requirements: 2/2
scenarios: 3/4
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:62b2a69b70e49d2d81899f880dec49d676af3e3b69125650bb0f1221875ed6a3
build_command: npm run typecheck
build_exit_code: 0
build_output_hash: sha256:f9de8b15b07069fcbf31f4a415061f4b90d66551059b5518c6d53e721545e547
```

## Verification Report

**Change**: tercera-puerta-orden-venta (IV-4)
**Version**: R1 `79cf09b` + R2 `f367186` (HEAD de `main`)
**Mode**: Strict TDD

### Completeness
| Metric | Value |
|--------|-------|
| Tasks total | 24 |
| Tasks complete | 24 |
| Tasks incomplete | 0 |

Confirmado por conteo directo sobre `openspec/changes/tercera-puerta-orden-venta/tasks.md`: `grep -c '^- \[x\]'` → 24, `grep -c '^- \[ \]'` → 0.

### Build & Tests Execution

**Build**: ✅ Passed
```text
npm run typecheck  (tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit)
exit 0, sin salida
```

**Tests**: ✅ 1131 passed / ❌ 0 failed / ⚠️ 2 skipped
```text
npm test
121 archivos de prueba, 1131 tests pasados, 2 skip, exit 0
```

**Coverage**: ➖ No disponible (el runner de este repositorio no tiene herramienta de cobertura configurada; no es un fallo, es lo que hay)

### Spec Compliance Matrix

| Requirement | Scenario | Test | Result |
|---|---|---|---|
| RQ-RE-16 | Una orden ya asociada a otro ticket se rechaza antes de escribir nada | `ordenVentaUnTicket.test.ts` > describe puerta 3 > `it('rechaza con 409 una orden de venta que ya está en otro ticket')` | ✅ COMPLIANT |
| RQ-RE-16 | El 422 del serial gana al 409 nuevo | `remisiones.test.ts` > `it('ticket destino sin serial y con una OV ya usada por otro: 422 "falta el serial", no 409')` | ✅ COMPLIANT |
| RQ-RE-16 | Reenviar la misma orden al propio ticket no se rechaza a sí mismo | (ninguna encontrada) | ❌ UNTESTED |
| tickets-core 4.2 | La cardinalidad OV↔ticket, resuelta en la misma dirección en las dos specs | Sin cambio de texto; escenario narrativo sobre una decisión de Gerencia, cubierto por las pruebas ya existentes de las puertas 1 y 2 (`ordenVentaUnTicket.test.ts:118-133`) | ✅ COMPLIANT |

**Compliance summary**: 3/4 scenarios compliant

### Correctness (Static Evidence)

| Requirement | Status | Notes |
|---|---|---|
| RQ-RE-16 | ✅ Implemented | `remision.ts:230-234` — guarda por las dos vías, propio ticket excluido, después del 422 de `:220` y antes del UPDATE de `:235-239` |
| tickets-core 4.2 | ✅ Implemented | Narrativa corregida en el delta; código sin cambios en esta tanda porque las puertas 1 y 2 ya existían |

### Coherence (Design)

| Decision | Followed? | Notes |
|---|---|---|
| D1 — fusionar `:141-159` en el ex-`it.fails` | ✅ Sí | El bloque `:141-159` ya no existe; el describe de la puerta 3 lo sustituye |
| D2 — posición de la guarda dentro del bloque OV | ✅ Sí | Verificado línea a línea (sección 2.2 abajo) |
| D3 — forma de la llamada y de la respuesta 409 | ✅ Sí | `ov.id`/`ov.number`/`ticketId`, `res.status(409).json(); return`, sin `HttpError` |
| D4 — prueba de posición al final de `remisiones.test.ts` | ✅ Sí | `remisiones.test.ts:1028-1054`, pegada a M5 |
| Citas re-ancladas por Caso A/B/C (regla de mutación 4) | ⚠️ Con matiz | `proposal.md` decía Caso B para las cinco; `design.md` §8.2 corrigió a 3×A + 2×C, y el trabajo sigue la corrección (sección 3 abajo) |

### Issues Found

**CRITICAL**:
1. `RQ-RE-16`, escenario «Reenviar la misma orden al propio ticket no se rechaza a sí mismo» — **UNTESTED**. Ninguna prueba de la suite (`ordenVentaUnTicket.test.ts` completo, `remisiones.test.ts` completo, ni `packages/zoho-sync/src/db/repo.test.ts`) envía a `POST /api/remisiones` el `salesOrderId` que el propio ticket destino YA tiene. La exclusión existe en el código (`ticketId` como tercer argumento de `ticketConOrdenVenta`, `remision.ts:230`) y es correcta por lectura, pero ninguna corrida la ejercita en este endpoint. Bajo la regla del skill de verify («un escenario sin prueba que pase en runtime no es conforme»), es un hallazgo bloqueante para el archive.

**WARNING**:
1. El rojo de la tarea 1.1 («expected 201 to be 409») y las mutaciones M-a/M-b (`design.md` §5) no son reproducibles por esta fase sin abrir otro intento del ledger (regla del ciclo 2 de `CLAUDE.md`: una tanda SDD por árbol de trabajo). Se verificó en su lugar que la prueba de posición existe y que su aserción distingue de verdad 422 de 409 (sección 2.3 abajo).
2. La cabecera de `apply-progress.md` (línea 3) dice «23 de 24» tareas hechas, pero `tasks.md` de hoy tiene las 24 casillas en `[x]` y el propio cuerpo de `apply-progress.md` documenta más abajo que la condición dura de 2.15 sí se cumplió tras la decisión de Gerencia de anclar las seis citas. La cabecera no se actualizó tras esa decisión: desajuste de redacción, no trabajo pendiente.

**SUGGESTION**: Ninguna adicional a lo ya nombrado como límite (sección 4 abajo).

### Verdict

**FAIL**

Decide el veredicto un único CRITICAL: el escenario de auto-exclusión de `RQ-RE-16` no tiene prueba de cobertura en ningún fichero de la suite. Todo lo demás —guarda en su posición y forma exactas, `npm test` en 1131/1131 verdes, `typecheck` limpio, detector de citas en 0 bloqueantes con línea base en cero, y el cierre de IV-4/registro de IV-11 verificados línea a línea— cumple con evidencia propia. El detalle completo, criterio a criterio, sigue debajo.

---

## Detalle extendido — criterio a criterio, evidencia propia

**Fecha:** 2026-09-16 · **Árbol verificado:** `f367186`
**Método:** evidencia propia leída del árbol de hoy. Cada veredicto lleva el comando que lo sostiene
o la cita `ruta:línea` que lo demuestra. Lo que no se pudo reproducir sin abrir otro intento del ledger
va marcado como **límite**, no como aprobado.

### 1 · Criterios de `proposal.md` §13, uno a uno

| # | Criterio | Veredicto | Evidencia propia |
|---|---|---|---|
| 1 | `.fails` de `:161` quitado y visto rojo por «expected 201 to be 409» | **LIMITE, no reproducible sin mutar** | `ordenVentaUnTicket.test.ts` de hoy ya no tiene `.fails` (línea 161 forma parte del `it` normal de la puerta 3, líneas 155-177). El único registro del rojo original está en `apply-progress.md` (tabla R1, fila 1.1); reproducirlo exigiría revertir la guarda y re-ejecutar, que es abrir otro intento del ledger. No se hizo. |
| 2 | Prueba de `:141-159` invertida, afirma `409` | **CUMPLE** | Ese bloque ya no existe. `ordenVentaUnTicket.test.ts:155-177` afirma `res.status` a `409` (línea 172). Verde en los 1131 tests pasados. |
| 3 | Guarda llama a `ticketConOrdenVenta` por las dos vías, propio ticket excluido, después del 422 de `:220` y antes del UPDATE | **CUMPLE** | `remision.ts:230` llama `ticketConOrdenVenta(db, { salesorderId: ov.id, numero: ov.number }, ticketId)`. `:220` es el 422, `:230-234` la guarda, `:235-239` el UPDATE. |
| 4 | 409 con `res.status(409).json(...); return`, texto de `ticketService.ts:135` | **CUMPLE** | `remision.ts:232-233`, mismo patrón y texto que la puerta 2, sin condicional de la puerta 1. `HttpError` no aparece en `remision.ts` (0 coincidencias). |
| 5 | `WHERE COALESCE(orden_venta,'') = ''` intacto | **CUMPLE** | `remision.ts:237`, sin cambios de comportamiento. |
| 6 | Prueba de posición existe, afirma 422 «Falta el serial» (no 409), tres columnas sin escribir | **CUMPLE** | `remisiones.test.ts:1028-1054`. Afirma status 422, error que casa `/serial/i`, tres columnas en null, ticket dueño único. Verde. |
| 7 | Cinco citas caducas re-ancladas como Caso B, sin tocar aserciones, ancla en la misma línea física | **CUMPLE CON MATIZ** | `design.md` §8.2 corrigió la propuesta: tres son Caso A y dos Caso C, no las cinco Caso B. El trabajo sigue esa corrección (detalle sección 3). Ninguna aserción `expect(...)` se tocó. |
| 8 | `npm test` verde y `npm run typecheck` sin errores | **CUMPLE** | Ver Build & Tests Execution arriba. |
| 9 | `CLAUDE.md`/`config.yaml` registran IV-11 y el recuento concuerda con la tabla | **CUMPLE** | Ver 2.5 y 2.6 más abajo. |

### 2 · Los siete puntos que Gerencia exige verificar

**2.1 · Escenarios de los dos deltas, contra las pruebas que existen** — ver «Spec Compliance Matrix» arriba. El hallazgo CRITICAL de esa tabla (escenario 3 de RQ-RE-16, UNTESTED) es la razón del veredicto FAIL. Se buscó exhaustivamente: `ordenVentaUnTicket.test.ts` completo (178 líneas), `remisiones.test.ts` completo (las 5 apariciones de `salesOrderId` revisadas, ninguna reenvía la OV que el ticket destino ya tiene), y `packages/zoho-sync/src/db/repo.test.ts` (0 menciones de `ticketConOrdenVenta`). El único test que ejercita auto-exclusión es el de la puerta 2 (`transiciones.test.ts:312-319`), sobre un endpoint distinto.

**2.2 · La guarda, en su posición y forma exactas** — CUMPLE, sin matices. Confirmado por lectura directa: `:218` abre el bloque OV; `:219-220` `getSalesOrder` + 422; `:221-229` comentario transitorio; `:230-234` la guarda; `:235-239` el UPDATE con el WHERE intacto en `:237`. El 422 del serial (`:152-157`) sigue por encima del bloque OV: orden real ticket/fecha (`:123-127`) a serial (`:152-157`) a remisión pendiente (`:174-183`) a checklist (`:191-197`) a bloque OV (`:218-240`) a `createRemision`.

**2.3 · El rojo de 1.1 y las dos mutaciones — LIMITE declarado, no dado por bueno.** No se reprodujo sin abrir otro intento del ledger. Se comprobó en su lugar: la prueba de posición existe (`remisiones.test.ts:1028-1054`) y su aserción distingue de verdad 422 de 409 (status + regex + tres columnas null + conteo del ticket dueño) — no es tautológica, ejercita `request(app).post(...)` contra código real. El comentario que la acompaña (`:1011-1027`) describe el mecanismo de M-a/M-b con el mensaje exacto esperado, pero es prosa, no ejecución.

**2.4 · El detector de citas — CONDICION DURA.** `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha f367186` da comprobadas 1944, abreviadas rotas 12 (informativas), línea base 0 informadas y 0 caducadas, codigo de salida 0, 0 bloqueantes. CUMPLE exactamente como exige el punto 5 del encargo.

**2.5 · El cierre de IV-4, en sus dos ficheros.** `CLAUDE.md`: (a) fila de IV-4 retirada de la tabla de «Incumplimientos vivos» — la tabla de hoy (`:277-280`) tiene cuatro filas y ninguna es IV-4; (b) párrafo «IV-4 está CERRADO y ya no cuenta» en `:298-304`, mismo patrón que IV-1/IV-3/IV-5/IV-6/IV-7/IV-10, entre el cierre de IV-3 y el de IV-5; (c) párrafo `:259-266` cuenta los dos movimientos fechados (alta IV-11 2026-09-16, baja IV-4 en `79cf09b`); (d) encabezado `:255` en «Cuatro», contado contra la tabla ya editada (4 filas reales). `openspec/config.yaml` bloque `id: IV-4`: `estado: CERRADO`, `cerrado_por`, `cerrado_verificado_en`, `por_que_esta_cerrado` apuntando a RQ-RE-16. **CUMPLE en los cuatro sub-puntos.**

**2.6 · IV-11 sigue registrado y vivo.** `CLAUDE.md:280` y `openspec/config.yaml` bloque `id: IV-11` (`:930` en adelante): sin `estado: CERRADO`, `destino: "SIN DESTINO ASIGNADO — a propósito"`, advertencia de población 1 presente. **CUMPLE.**

### 3 · Dónde el verify y el registro del `apply` NO coinciden

Dos divergencias reales:

1. **Clasificación de las cinco citas (criterio 7 de §13).** `apply-progress.md` (tarea 1.5) ejecuta el re-anclaje sin corregir la clasificación de `proposal.md` §2.6 («todas Caso B»); `design.md` §8.2 ya había corregido a 3xA + 2xC antes del `apply`. Verificado contra el fichero de hoy que el trabajo sigue la corrección del diseño: la tabla de las tres puertas (`ordenVentaUnTicket.test.ts:19-21`) refleja el estado actual (Caso A); el párrafo «EL DEFECTO, VERIFICADO» (`:23-38`) está anclado a `b99d47a` (Caso C); el doc del fixture (`:156`) cita `remision.ts:237`, la línea de hoy (Caso A). El resultado es correcto; la palabra «Caso B» de §13 quedó desactualizada por la corrección posterior del diseño.
2. **El recuento de la cabecera de `apply-progress.md`.** Dice «23 de 24» (línea 3), pero `tasks.md` tiene las 24 casillas en `[x]` y el cuerpo del propio `apply-progress.md`, en la sección de 2.15, documenta que Gerencia decidió anclar las seis citas restantes y que la condición dura terminó cumplida. La cabecera no se actualizó tras esa decisión.

**La divergencia que sí importa para el veredicto no está en lo que el `apply` registró, sino en lo que NO registró:** `apply-progress.md` no menciona en ningún punto que el escenario de auto-exclusión de RQ-RE-16 carece de prueba propia. No es una afirmación falsa del `apply` — su mandato era ejecutar tareas, no auditar cobertura escenario por escenario contra los deltas de spec.

En todo lo demás —los nueve criterios de §13, los siete puntos de Gerencia, IV-4/IV-11, el detector, `npm test`/`typecheck`— el verify y el `apply` coinciden, confirmado con evidencia propia y no por transcripción.

### 4 · Límites de esta verificación

1. No se reprodujo el rojo de 1.1 ni las mutaciones M-a/M-b sin abrir otro intento del ledger — fuera del mandato de esta fase.
2. No se re-auditó cita a cita el barrido completo de las poblaciones A (34) y B (26) de `design.md` §8.3/§8.4: se comprobó por muestreo dirigido (citas del bloque OV en `remisiones/spec.md`, los bloques `id: IV-4`/`id: IV-11`, y las cinco citas de `ordenVentaUnTicket.test.ts`) más la condición dura del detector, que cubre existencia y no vacuidad de línea pero no el contenido semántico de cada cita — el propio detector lo declara. El muestreo no encontró divergencias.
3. `sdd-archive` no se ejecutó ni se preparó, conforme al alcance de esta fase. La sección 5.1 de `openspec/specs/remisiones/spec.md` (viva) sigue describiendo el defecto ya cerrado como «DECIDIDA, y se construye» — confirmado por lectura directa— porque el delta que la retira sólo toma efecto al fundirse en el archive. Es deuda declarada, no un hallazgo nuevo.
4. `npm run lint` se corrió como verificación adicional (no exigida por §13): 0 errores, 158 warnings preexistentes de no-explicit-any, ninguno en los ficheros tocados por esta tanda.

### 5 · Nota sobre el veredicto

El veredicto FAIL no cuestiona la calidad de la guarda construida — está en su posición y forma exactas, probada por dos escenarios reales y por una prueba de posición cuya aserción distingue el 409 del 422— sino que señala que uno de los tres escenarios que el propio delta declara con SHALL no tiene ninguna prueba que lo ejecute. Corregirlo es añadir un `it` a `ordenVentaUnTicket.test.ts` o a `remisiones.test.ts` que reenvíe a un ticket el `salesOrderId` que ya tiene y confirme 201 sin 409; no toca `remision.ts`, que ya implementa la exclusión correctamente por lectura de código.

### 6 · Añadido por el orquestador al comprobar este informe — un hallazgo que el verify no vio

El verify auditó los deltas contra las pruebas, pero no contrastó las citas del delta **entre sí**. Al
hacerlo aparece una incoherencia dentro del propio `specs/remisiones/spec.md` de esta tanda:

- Su línea 37 dice que el `WHERE ... COALESCE(orden_venta,'') = ''` del `UPDATE` está en la línea **237**
  — correcto contra el árbol de hoy, comprobado en `apps/desk/server/routes/remision.ts`.
- Su línea 79, dentro del escenario «Reenviar la misma orden al propio ticket no se rechaza a sí mismo»,
  sigue diciendo que ese mismo `WHERE` está en la línea **223**, que es donde estaba **antes** de que R1
  insertara la guarda.

O sea: **el mismo documento sitúa el mismo `WHERE` en dos líneas distintas.** La 37 la actualizó la tarea
2.3; la 79 se quedó atrás porque va en forma abreviada, y la forma abreviada **no bloquea** al detector —
es informativa—. Por eso pasó el barrido de R2 con el detector en 0 y por eso no la caza ninguna
comprobación automática: es exactamente el caso que `CLAUDE.md` describe cuando dice que el detector no
comprueba que la línea diga lo que la frase afirma.

**Severidad: WARNING, no bloqueante.** No cambia el veredicto `fail` ni los recuentos del envelope: no es
un escenario sin prueba ni un requisito incumplido. Cae natural en la misma tanda que cierre el CRITICAL,
porque toca ese mismo fichero y ese mismo escenario.
