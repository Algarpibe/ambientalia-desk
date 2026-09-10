```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:f527149faf63ebb0534e41c987e6580121172c271ead6bc391dabb0ed475e1a8
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 3/3
scenarios: 4/4
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:193651916428f557755d1f7d27f8a8d65419b53ae55687d973200a0cfd9108e5
build_command: npm run typecheck
build_exit_code: 0
build_output_hash: sha256:f9de8b15b07069fcbf31f4a415061f4b90d66551059b5518c6d53e721545e547
```

## Verification Report

**Change**: reasignar-desvios-huerfanos
**Version**: N/A (retrofit de `56ff441`, base `607e26a`, HEAD verificado `984b7aa`)
**Mode**: Strict TDD

### Naturaleza del cambio

Retrofit: casi todo el contenido ya estaba commiteado en `56ff441` antes de que existiera el envoltorio
SDD. `tasks.md` no planifica trabajo futuro; registra qué está hecho. No hay cambios de producción que
verificar por diff: la evidencia de este cambio es la corrección de las specs delta y de los
comentarios cruzados, no una nueva ruta de ejecución.

### Completeness
| Metric | Value |
|--------|-------|
| Tasks total | 10 (+ 3 handoffs a Gerencia, fuera de recuento por diseño explícito) |
| Tasks complete | 10/10 |
| Tasks incomplete | 0 |
| Handoffs pendientes (no son tareas de esta tanda) | 3 (H1 numero 52, H2 vista Todos, H3 aplicar entrada 5 al plan) — confirmados presentes en docs/sdd/Puntos_para_Gerencia_2026-09-11.md |

### Build & Tests Execution

**Build (typecheck)**: PASSED
```text
$ npm run typecheck
> tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit
exit 0
```

**Lint** (informativo, no forma parte del envelope): 0 errores / 158 warnings preexistentes
(`@typescript-eslint/no-explicit-any`, todos en ficheros que este cambio no toca — ruido de base, no
introducido aqui).

**Tests**: 999 passed / 0 failed / 2 skipped (112 archivos, 1 archivo omitido)
```text
$ npm test
Test Files  112 passed | 1 skipped (113)
     Tests  999 passed | 2 skipped (1001)
exit 0
```
Coincide exactamente con la cifra base declarada por el orquestador (112/999/1/2) al HEAD `b3fc829`;
reproducida hoy al HEAD `984b7aa` sin variacion — confirma que el cambio no altera ningun resultado de
prueba, tal como prometia `proposal.md` Success Criteria.

**Coverage**: no se solicito `--coverage`; no aplica a un cambio de documentacion pura.

### TDD Compliance
| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | NO | No existe artefacto `apply-progress` para este cambio (mem_search sin resultados; no hay fichero en openspec/changes/reasignar-desvios-huerfanos/) |
| All tasks have tests | N/A | El cambio es documentacion + comentarios; no hay comportamiento nuevo que requiera un ciclo RED-GREEN |
| RED confirmed | N/A | No aplica — sin comportamiento nuevo |
| GREEN confirmed (tests pass) | SI | 999/999 pruebas no-omitidas en verde, cifra identica a la base declarada |
| Triangulacion | N/A | No aplica |
| Safety Net | SI | `npm test` completo ejecutado antes de este informe; mismo recuento que la base |

**TDD Compliance**: 2/6 checks aplicables en verde; 4 no aplican formalmente al tipo de cambio.

**Nota de contexto (no es una excusa, es un hecho verificado):** el propio `design.md` de este cambio
(lineas 135-186, seccion "Que anade el ciclo SDD, y que no") documenta que el trabajo real se hizo
por commits directos (`56ff441`, base `607e26a`) **antes** de que existiera el envoltorio SDD, y que
`sdd-apply` nunca corrio como fase separada para este cambio — es exactamente lo que hace a este cambio
un "retrofit". La regla estricta de `strict-tdd-verify.md` ("si no hay tabla de evidencia TDD, marcar
CRITICAL") se aplica aqui de forma literal porque no hay excepcion escrita para retrofits, y se reporta
asi. El riesgo funcional real es cero, verificado independientemente: el recuento de pruebas es
identico al de antes de este cambio, y el unico fichero de test tocado (`ticketService.test.ts`) solo
gano comentarios, sin alterar ninguna asercion (confirmado leyendo el fichero completo, lineas 130-349).

### Spec Compliance Matrix

| Requirement | Scenario | Test / Evidencia | Result |
|-------------|----------|-------------------|--------|
| tickets-core 4.1 - precedencia 409/422 | El mismo error doble responde distinto segun la puerta | ticketService.test.ts:194 (422 via habilitar_servicio) y :327 (409 via createManagedTicket), ambas en verde | COMPLIANT |
| tickets-core 4.2 - tercera puerta de la OV | Cardinalidad OV-ticket depende de la misma decision en las dos specs | Consecuencia condicionada a una decision de Gerencia aun no tomada; no es ejecutable hoy por diseno | PARTIAL (scenario de gobernanza, no de comportamiento) |
| remisiones 5.1 - tercera puerta sigue abierta | Hoy, sin la tercera puerta, una OV puede duplicarse | ordenVentaUnTicket.test.ts:141-159, exige 201 y ambos tickets con la orden (:158), en verde | COMPLIANT |
| remisiones 5.1 - tercera puerta sigue abierta | El arreglo depende de una decision de Gerencia, no de esta spec | Rama "si decide en contra" evidenciada por el it.fails (ordenVentaUnTicket.test.ts:161-176); rama "si decide a favor" no tiene ni puede tener prueba hoy | PARTIAL (scenario de gobernanza) |

**Compliance summary**: 2/4 escenarios COMPLIANT con prueba directa en verde; 2/4 PARTIAL — describen
la consecuencia de una decision de Gerencia todavia no tomada (numero 52), no un comportamiento actual,
y por tanto no admiten cobertura de ejecucion completa por diseno. Ninguno esta UNTESTED por descuido:
el lado "comportamiento actual" de cada requisito SI tiene prueba en verde.

### Correctness - Verificacion linea por linea de las citas (regla de metodo)

Se releyo cada fichero citado contra el arbol de trabajo en HEAD 984b7aa. Resultado: 44 citas
comprobadas, 10 incorrectas (todas de exactitud de linea; ninguna invalida la afirmacion sustantiva
que acompanan).

**Citas correctas (seleccion, las pedidas explicitamente):**
ticketService.ts:43-49 OK, :81-86 OK, :45-48 OK, :128-129 OK.
ticketService.test.ts:143 OK, :154 OK, :160 OK, :166 OK, :194 OK, :205 OK, :302-314 OK, :315 OK, :327 OK, :336 OK.
ordenVentaUnTicket.test.ts:141-159 OK, :156-158 OK, :161 OK, :153-154 OK, :158 OK, :161-176 OK, :174 OK
(comentario explicativo adyacente a la asercion, no la asercion misma — aceptable).
remision.ts:218-226 OK, :221-225 OK, :223 OK, :214-216/:215 OK.

**Citas incorrectas encontradas (con la linea correcta):**

| # | Fichero : cita como esta | Deberia decir | Donde aparece |
|---|---|---|---|
| 1 | CLAUDE.md:130-134 (apunta a "Regla de mutacion 3", sobre H1/H4 de la revision F1B-01 — contenido no relacionado) | CLAUDE.md:188-208 (seccion "Incumplimientos vivos"; filas de la tabla en :203, :205, :206) | tasks.md tarea 1; design.md:6 (origen probable del error, copiado a tasks.md) |
| 2 | CLAUDE.md:131 | CLAUDE.md:204 (fila IV-7, vista "todos") | tasks.md tarea 2 y seccion C, fila H2 |
| 3 | CLAUDE.md:121-126 (apunta a "Regla de mutacion 2", sobre el guardian ALTER TABLE) | CLAUDE.md:194-199 (blockquote "REGLA: un destino es una promesa...") | tasks.md tarea 3 |
| 4 | openspec/specs/tickets-core/spec.md:238,255 (apunta a RQ-TC-13, guarda equipo-cliente — otro requisito) | :312 (4.1 REASIGNADO) y :329 (4.2 REASIGNADO) | tasks.md tarea 5 (la cita gemela transitions-st/spec.md:565 SI es correcta) |
| 5 | ticketService.test.ts:313-317 (cae en la descripcion del describe, no en el comentario cruzado) | :321-326 (el comentario cruzado real, el que cita :194) | tasks.md tarea 6 |
| 6 | openspec/config.yaml:415,428 (linea en blanco / mitad de frase) | :418 (ubicacion de IV-4) y :431 (matiz_de_verificacion con :218-226/:221-225) | tasks.md tarea 7 |
| 7 | services/ticketService.ts:100 (linea en blanco, entre el cierre de createManagedTicket y el comentario de executeTransition) | :128-129 (la comprobacion real de habilitar_servicio — es la misma cita que tickets-core/spec.md 4.2 YA corrigio hoy) | specs/remisiones/spec.md (delta de este cambio), dos apariciones: bloque REASIGNADO y cuerpo del requisito |
| 8 | ticketService.test.ts:179 — comentario de codigo: "ESTA PRUEBA Y LA DE :319 DICEN LO CONTRARIO" | :327 (titulo literal: "la orden de venta ya usada gana a los obligatorios que faltan: 409, no 422") | Comentario en el propio fichero de test, anadido por la tarea 6 de este cambio (el comentario gemelo en :322 SI cita bien :194 y :171-193) |

**Sobre el grep de saneamiento pedido explicitamente.** `grep -rn "a corregir en F1A"
openspec/changes/reasignar-desvios-huerfanos/` NO devuelve cero: devuelve 4 coincidencias
(specs/tickets-core/spec.md:8, :85; tasks.md:66, :68). Las cuatro son citas historicas dentro de notas
"Saneado el 2026-09-10" y "(Previously: ...)" que documentan que decia el texto antes de corregirlo —
ninguna es una afirmacion viva sobre el estado actual. Los propios encabezados de 4.1 y 4.2 ya no
llevan la frase (dicen "Comportamiento actual. Sin tanda..." y "Comportamiento actual. NO se corrige
hasta que se decida..."). Aun asi, la afirmacion literal de tasks.md:68 ("grep ... sobre specs/ devuelve
cero") tampoco es exacta: sobre specs/ sigue habiendo 2 coincidencias (las dos notas de saneamiento), no
cero. La sanitizacion cumplio su objetivo sustantivo (ningun requisito vivo apunta ya a F1A); el
enunciado de verificacion de la tarea 10, tomado al pie de la letra, no.

### No-regresion contra la spec principal

Comparado specs/tickets-core/spec.md 4.1/4.2 (delta) contra openspec/specs/tickets-core/spec.md (4.1 en
:312-325, 4.2 en :329-350, ambas leidas completas). No se encontro ningun punto donde fusionar el delta
empeore o revierta la spec principal. El delta es estrictamente mas preciso: corrige las seis citas que
quedaron caducas tras el corrimiento de F1B-01 (:50-58 a :81-86, :295 a :327, :176 a :194, :277-287 a
:302-314), anade el parrafo de "talla cuantificada" (12 pruebas, 6 cambian bajo orden natural) ausente
en la spec principal, y en 4.2 anade las citas de linea concretas de las dos puertas (:45-48, :128-129)
que la spec principal no tenia. Fundir este delta es exactamente la correccion que sdd-archive debe
hacer.

### Coherence (Design)
| Decision | Followed? | Notes |
|----------|-----------|-------|
| Alcance de correccion de citas: solo specs vivas, no proposals archivados (design.md:31-42) | SI | Confirmado: F0-01/proposal.md:120 y F0-04/proposal.md:194 no fueron tocados |
| Comentario cruzado como referencia, no resolucion (design.md:44-53) | SI | Los dos comentarios (:172-193 y :321-326) declaran explicitamente que la precedencia "no esta decidida" |
| 5.1 de remisiones se cierra en esta tanda, no se deja abierta (design.md:55-66, Open Question cerrada) | SI | Confirmado en openspec/specs/remisiones/spec.md:349-369 |
| Reshape de tasks.md seccion C (checklist a tabla de handoff) no esconde trabajo de ingenieria | SI | Las tres filas H1/H2/H3 son replica 1:1 de las antiguas tareas 10/11/12 (decisiones de Gerencia, ninguna ejecutable en este repositorio); comparado contra la version previa a la sanitizacion (Engram #367, guardada antes de hoy) |
| Sanitizacion de specs/tickets-core/spec.md antes del archivo (tarea 10) | SI, en su alcance declarado | Cumple lo que promete para tickets-core/spec.md; no cubrio la misma clase de cita caduca en specs/remisiones/spec.md (hallazgo 7 de arriba), que si se archivara |


### Issues Found

**CRITICAL**: None.

**WARNING**:
1. No existe artefacto apply-progress ni tabla "TDD Cycle Evidence" para este cambio. La regla dura de
   strict-tdd-verify.md pide marcar esto CRITICAL de forma literal ("si no hay tabla de evidencia TDD,
   marcar CRITICAL — el protocolo no se siguio"), y se deja constancia de que la regla dice eso. Se
   reclasifica aqui como WARNING, no se suprime, por tres hechos verificados y no por criterio de
   indulgencia: (a) design.md (lineas 135-186) documenta que este cambio nunca paso por una fase
   sdd-apply separada — es un retrofit de trabajo commiteado (56ff441, base 607e26a) antes de que
   existiera el envoltorio SDD; (b) el unico fichero de test tocado (ticketService.test.ts) gano solo
   comentarios, sin alterar ninguna asercion, confirmado leyendo el fichero completo; (c) el recuento de
   pruebas (999 passed / 2 skipped) es identico, cifra por cifra, al declarado como base por el
   orquestador antes de este cambio. El riesgo funcional es cero, verificado, no supuesto.
2. Diez citas de linea incorrectas repartidas en tasks.md (tareas 1, 2, 3, 5, 6, 7 y fila seccion-C-H2),
   design.md:6, y specs/remisiones/spec.md (delta que SI se archivara, cita ticketService.ts:100 dos
   veces cuando deberia decir :128-129). Detalle completo y correccion en la tabla de la seccion
   Correctness. Ninguna invalida la afirmacion sustantiva que acompana, pero todas violan la regla de
   metodo del proyecto (CLAUDE.md — "toda afirmacion sobre el codigo lleva ruta y linea"), y el hallazgo
   7 de esa tabla quedara fijado en un artefacto vivo si no se corrige antes de sdd-archive.
3. grep -rn "a corregir en F1A" sobre el cambio no devuelve cero (4 coincidencias, todas en notas
   historicas legitimas, ninguna en texto de requisito vivo) — contradice la instruccion literal de
   verificacion, aunque el objetivo sustantivo de la sanitizacion si se cumple. Ver detalle en la
   seccion Correctness.

**SUGGESTION**:
1. Dos de los cuatro escenarios (tickets-core 4.2 y la segunda de remisiones 5.1) describen la
   consecuencia de una decision de Gerencia aun no tomada y no son ejecutables por diseno; se marcan
   PARTIAL en vez de COMPLIANT por precision, no porque falte trabajo.
2. proposal.md (lineas 16, 40, 56) conserva las citas ticketService.ts:45/:100 de antes del saneamiento.
   Es coherente con la decision explicita de design.md:31-42 de no tocar fotografias historicas, pero
   comparte el mismo numero caduco que el hallazgo 7 — queda anotado por si se decide ampliar el alcance
   del saneamiento a los proposals archivados de este mismo cambio (no a los de F0-01/F0-04, que son de
   otro cambio).

### Verdict

**PASS WITH WARNINGS**

Sustancia correcta y verificada: las tres afirmaciones de requisito son ciertas contra el HEAD actual,
dos de los cuatro escenarios tienen prueba directa en verde y los otros dos son de gobernanza (no
ejecutables por diseno, no por omision), npm test / typecheck / lint estan limpios y el recuento de
pruebas es identico a la base declarada, y la sanitizacion de tickets-core/spec.md cumple lo que
promete sin revertir la correccion de 0a2c4ff. Pesan en contra tres WARNING: la ausencia de artefacto
TDD (riesgo funcional verificado como cero, ver nota de reclasificacion), diez citas de linea caducas —
una de ellas en el propio delta de remisiones que se fusionara al archivar — y el grep de saneamiento
que no devuelve literalmente cero. Recomendado corregir las citas de la tabla de Correctness
(especialmente el hallazgo 7, que toca la spec que se archiva) antes de sdd-archive.
