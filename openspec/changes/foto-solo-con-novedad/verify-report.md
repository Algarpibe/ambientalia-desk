```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:bb4ef89618565cf2f479753394aac65baf4f7d587c098d40208c5ab2bc20b4c2
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 4/4
scenarios: 10/10
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:e7990b29c0067c7a3aea33286f58c77e86dc5704a98d0b3224fcfdacad14a77b
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:934b6e36c743b743a25e258dacaf29c2a2c81bcf7d4f3e6bbffe6ee162bea996
```

## Verification Report

**Change**: foto-solo-con-novedad (F1B-04, primer cambio, `cierra: no`)
**Version**: HEAD `7aefbab` (rama `main`) - base previa `a0a2935` - commits `d5d66a1`, `265cd45`, `7aefbab`
**Mode**: Strict TDD

### Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 49 |
| Tasks complete | 49 |
| Tasks incomplete | 0 |
| Comprobaciones de persona (fuera del recuento, regla del ciclo 1) | 3 (Persona-1/2/3, RQ-RE-19) |

`tasks.md` traia 47/49 `[x]` al recibir esta fase: las dos que faltaban, 10.3 (commit) y 10.4 (CLI de
citas), estaban reservadas explicitamente al orquestador. `sdd-verify` confirmo las dos con evidencia
propia (`git log`, ejecucion del CLI) y las marco `[x]` en `tasks.md`. Las tres comprobaciones de
persona (RQ-RE-19) no llevan casilla en `tasks.md`: viven en tabla aparte, con dueno (Servicio
Tecnico) y destino escrito (`specs/remisiones/spec.md`), y archivar este cambio no las da por hechas.

---

### Acciones de esta fase (bookkeeping, no cambia comportamiento)

| Accion | Evidencia |
|---|---|
| Marcado `[x]` 10.3 en `tasks.md` | `git log --oneline a0a2935..HEAD` muestra `265cd45` (feat remisiones, F1B-04), HEAD en `7aefbab` |
| Marcado `[x]` 10.4 en `tasks.md` | `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` contra `7aefbab` da exit 0 (2188 comprobadas, 14 abreviadas rotas informativas, 0 cabeceras R-1 invalidas) |

Unico fichero tocado por `sdd-verify`: `openspec/changes/foto-solo-con-novedad/tasks.md` (dos
casillas). Ningun fichero de codigo, prueba o configuracion se modifico.

---

### Build & Tests Execution - reproducido en esta sesion

**Build**: PASSED
```text
$ npm run build
tsc -b && vite build
111 modules transformed, built in 1.65s
(exit 0; unico aviso preexistente: import dinamico/estatico de EquiposAdmin.tsx, no relacionado con este cambio)
```

**Typecheck**: PASSED
```text
$ npm run typecheck
tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit
(exit 0, 0 errores)
```

**Lint**: PASSED
```text
$ npm run lint
165 problems (0 errors, 165 warnings)
(exit 0; las 165 son @typescript-eslint/no-explicit-any preexistentes - comprobado con grep sobre la
salida completa: NINGUNA cae en los 8 ficheros de codigo/pruebas que este cambio toco)
```

**Tests**: 1390 passed / 0 failed / 2 skipped (preexistentes, integracion migrate.integration.test.ts, no tocada por este cambio)
```text
$ npm test
Test Files  141 passed | 1 skipped (142)
     Tests  1390 passed | 2 skipped (1392)
(exit 0)
```

---

### TDD Compliance

| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | YES | Tabla "TDD Cycle Evidence" completa en `apply-progress.md` |
| All tasks have tests | YES | Fases 1-5 con RED-GREEN por tarea; Fase 6 (`.tsx`) sin RED/GREEN automatico, por F0-00, verificado por typecheck + persona |
| RED confirmed (tests exist) | YES | `fotoNovedad.test.ts` (nuevo), `remision.test.ts` (ampliado), `migrate.test.ts` (ampliado) |
| GREEN confirmed (tests pass) | YES | 1390/1390 verde en esta sesion |
| Triangulacion adecuada | YES | P1 (4 casos), P2 (4 casos), P3-P7 (5 pruebas independientes del orden), guardian 37/19/18 |
| Safety net en ficheros modificados | YES | `db/remisiones.ts`, `routes/remision.ts`, `migrate.test.ts` ya tenian suite propia corrida antes de tocarlos |
| Mutaciones propias de sdd-verify (2 exigidas) | YES | ver tabla siguiente |

**TDD Compliance**: 7/7 checks passed

#### Mutaciones ejecutadas por sdd-verify (independientes de las de apply-progress.md)

| # | Mutacion | Resultado (rojo) | Reversion | git diff tras revertir |
|---|---|---|---|---|
| V1 | Mover la guarda de novedad (`:283-289`) DESPUES del bloque `reclamarEnvio` | P3: `enviado_at` queda con fecha en vez de null. P4: 409 en vez de 200 | `git checkout -- apps/desk/server/routes/remision.ts` | Vacio |
| V2 | Borrar por completo el bloque de la guarda (`const fotos` + `if faltaFotoPorNovedad`) - no ensayada por apply-progress.md | P3: 422 esperado, 200 recibido. P4: mismo patron | `git checkout -- apps/desk/server/routes/remision.ts` | Vacio |

Las dos mutaciones se corrieron con `npx vitest run apps/desk/server/fotoNovedad.test.ts`; entre cada
una y la siguiente se confirmo verde (6/6) y `git status --short apps/ packages/` sin salida.

---

### Test Layer Distribution

| Layer | Tests | Files | Tools |
|-------|-------|-------|-------|
| Unit | 1 (`faltaFotoPorNovedad`, 4 aserciones) | 1 (`packages/shared/src/remision.test.ts`, ampliado) | vitest |
| Integration | 6 (P2-P7) | 1 (`apps/desk/server/fotoNovedad.test.ts`, nuevo) | vitest + supertest + Express real + pg-mem |
| Guardian de esquema | 1 prueba ampliada (recuento 37/19/18) | 1 (`packages/zoho-sync/src/db/migrate.test.ts`) | vitest |
| E2E | 0 | 0 | no instalado |
| Total nuevo/ampliado por este cambio | 8 | 3 | |

---

### Changed File Coverage

| File | Line pct | Branch pct | Uncovered Lines | Rating |
|------|--------|----------|-----------------|--------|
| `apps/desk/server/routes/remision.ts` | 98.52% | 80.86% | `:232-234` (rama preexistente "orden de venta ya asociada", IV-4, NO tocada por este cambio; la guarda nueva `:283-289` esta 100% cubierta) | Excelente |
| `apps/desk/server/db/remisiones.ts` | 100% | 68% | ninguna de linea; huecos de rama preexistentes en `isoOrNull`/parseo de `incluye`/`resultado`, ajenos a `hayNovedad` (las dos ramas del ternario `typeof r.hay_novedad === 'boolean'` si estan cubiertas por P2, que ejercita true/false/null) | Excelente en lineas |
| `packages/shared/src/remision.ts` | 100% | 100% | - | Excelente |
| `packages/shared/src/types.ts` | 100% | 100% | - (interfaz, sin ramas) | Excelente |
| `packages/zoho-sync/src/db/schema.sql` | N/A (SQL, no instrumentado) | - | - | Validado por el guardian de `migrate.test.ts`, no por cobertura de lineas |
| `apps/desk/src/api/client.ts` | N/A para el campo anadido | - | - | Adicion de un unico campo de tipo (`hayNovedad?: boolean`), sin logica de runtime; validado por typecheck |
| `apps/desk/src/components/CrearRemision.tsx` | Fuera de la red de pruebas (F0-00, `.tsx`) | - | - | Validado por typecheck + comprobaciones de persona |

Nota de medicion: cobertura tomada con `vitest run --coverage` focalizado en las suites que ejercitan
cada fichero. El umbral global del proyecto (92%/96%) no aplica a esta seleccion parcial de ficheros
y su aviso de error de umbral es artefacto de correr un subconjunto, no un hallazgo - con la suite
completa (`npm test`) los 1390 casos pasan.

---

### Assertion Quality

Todas las aserciones nuevas verifican comportamiento real: codigos de respuesta HTTP reales (201, 422,
409, 200), valores persistidos leidos de vuelta de la base (`enviado_at`, `hayNovedad`), llamadas
reales a `fetch` interceptadas (`toHaveBeenCalledTimes`, `not.toHaveBeenCalled`) y estructura del
payload realmente construido (`not.toHaveProperty`). Ninguna tautologia, ningun bucle sobre coleccion
potencialmente vacia, ningun smoke-test sin asercion de comportamiento. Ratio mocks/aserciones dentro
de rango (un fetch simulado por prueba, 2-5 aserciones de valor cada una).

**Assertion quality**: Todas las aserciones verifican comportamiento real.

---

### Quality Metrics

**Linter**: 0 errores (165 warnings preexistentes, ninguno en ficheros de este cambio)
**Type Checker**: 0 errores

---

### Spec Compliance Matrix

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| RQ-RE-17 | El alta persiste el valor declarado | `fotoNovedad.test.ts` - alta persiste hayNovedad - P2 | COMPLIANT |
| RQ-RE-17 | Cualquier valor que no sea true/false se guarda como no declarado | `fotoNovedad.test.ts` - P2 (casos sinClave, conCadena) | COMPLIANT |
| RQ-RE-17 | El payload a n8n no cambia | `fotoNovedad.test.ts` - payload a n8n no gana hayNovedad - P7 | COMPLIANT |
| RQ-RE-18 | Con novedad y cero fotos, el predicado bloquea | `packages/shared/src/remision.test.ts` - faltaFotoPorNovedad | COMPLIANT |
| RQ-RE-18 | Sin novedad, o con al menos una foto, el predicado no bloquea | idem (mismo test, 3 de los 4 casos) | COMPLIANT |
| RQ-RE-19 | Persona-1/2/3 (pregunta visible, bloqueo con Si+0 fotos, mensaje del 422 entendible) | Comprobacion de persona - `.tsx` fuera de la red de pruebas (F0-00). Fuente inspeccionada: `CrearRemision.tsx:279-290` y `:100-101` | PERSON-CHECK (no cuenta en scenarios, dueno Servicio Tecnico) |
| RQ-RE-08 (MODIFIED) | Novedad sin fotos bloquea sin reclamar el envio | `fotoNovedad.test.ts` - sexta puerta - P3 | COMPLIANT |
| RQ-RE-08 (MODIFIED) | Reintento inmediato tras subir la foto tiene exito | `fotoNovedad.test.ts` - P4 | COMPLIANT |
| RQ-RE-08 (MODIFIED) | La anulacion gana a la guarda de novedad | `fotoNovedad.test.ts` - P5 (mitad anulada) | COMPLIANT |
| RQ-RE-08 (MODIFIED) | Ya enviada gana a la guarda de novedad | `fotoNovedad.test.ts` - P5 (mitad ok) | COMPLIANT |
| RQ-RE-08 (MODIFIED) | Sin novedad o historica, cero fotos, se envia como hoy | `fotoNovedad.test.ts` - P6 | COMPLIANT |

**Compliance summary**: 10/10 escenarios automaticos compliant (100%). RQ-RE-19 aporta 3 comprobaciones
de persona adicionales, fuera del recuento por decision de Gerencia (F0-00) - no se cuentan como
UNTESTED, siguiendo la excepcion explicita del encargo de esta fase.

---

### Orden de las seis puertas de POST /:id/enviar - verificado contra el codigo real

| Orden | Guarda | Respuesta | Linea (HEAD 7aefbab) | Prueba de posicion |
|---|---|---|---|---|
| 1 | No existe | 404 | `:272` | preexistente (`remisiones.test.ts`) |
| 2 | Anulada | 409 | `:275-277` | P5 (mitad anulada) |
| 3 | Ya enviada (ok/ok_con_avisos) | 409 | `:280-282` | P5 (mitad ok) |
| 4 | Novedad sin fotos (NUEVA) | 422 | `:283-289` | P3, P4 |
| 5 | Reclamacion perdida | 409 | `:293-295` | preexistente + P4 (reintento) |
| 6 | Sin ticket | 422 | `:298` | preexistente |

Orden confirmado leyendo `apps/desk/server/routes/remision.ts:269-319` linea a linea y con dos
mutaciones de posicion propias de sdd-verify (V1, V2 arriba) mas las tres ya ejecutadas por sdd-apply
(M1, M2, M3 de `apply-progress.md`) - las cinco confirmaron rojo al mover o quitar la guarda, y las
cinco revirtieron a git diff vacio.

---

### IV-12 - el ALTA de remision no gano guardas ni cambio de orden

`git diff a0a2935..HEAD -- apps/desk/server/routes/remision.ts` (reproducido en esta sesion) toca
exactamente dos puntos del ALTA:

1. `:4` - el import gana `faltaFotoPorNovedad` (sin efecto en el orden de guardas).
2. `:246` - dentro de la llamada a `createRemision` (`:242-255`), se anade
   `hayNovedad: typeof b.hayNovedad === 'boolean' ? b.hayNovedad : null,` en la MISMA linea de
   `creadoPor` - lectura y persistencia, no una guarda (no valida, no rechaza, no hace return).

Las cinco guardas de IV-12 se releyeron en el arbol actual y son byte a byte las mismas de `a0a2935`,
en el mismo orden: `:127` (fecha invalida, 422), `:155` (falta el serial, 422), `:177` (409 de
remision pendiente), `:197` (items fuera del checklist, 422), `:220` (orden de venta no encontrada,
422). Ninguna se movio, ninguna se anadio.

---

### Esquema y payload - confirmado

| Comprobacion | Evidencia |
|---|---|
| ALTER TABLE calificada | `packages/zoho-sync/src/db/schema.sql` (tail): `ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS hay_novedad boolean`, al final del fichero |
| Guardian de migrate.test.ts en verde | `npx vitest run packages/zoho-sync/src/db/migrate.test.ts` da 22/22, incluida "son 37 ALTER: 19 calificadas (14 de public + 5 de books) y 18 sin calificar" |
| Payload a n8n sin cambios | `git diff a0a2935..HEAD -- apps/desk/server/remisionWebhook.ts` da vacio (reproducido en esta sesion) |

---

### Regla 13 / regla de mutacion 3 - tabla del apply contrastada contra el codigo

| Decision del cliente (CrearRemision.tsx) | Linea del servidor citada | Contraste con el codigo real |
|---|---|---|
| No deja crear/continuar sin contestar la pregunta | Ninguna | Confirmado: `submit()` (`:100`) bloquea con `hayNovedad === null`, y `POST /api/remisiones` no exige el campo - `:246` lo normaliza pero nunca rechaza por el. 13.2 correcto |
| No deja crear/continuar con Si y 0 fotos | `routes/remision.ts:283-289`, en `/enviar`, NO en el alta | Confirmado: la guarda vive solo en `/enviar`; el alta (`:120-260`) no la tiene. 13.2 correcto - correccion de design.md (que decia 13.3) sostenida por el codigo |
| Oculta Continuar sin fotos si quedaria en 0 | La misma `:283-289` | Confirmado en `CrearRemision.tsx:353`: `!faltaFotoPorNovedad(hayNovedad, envio.fotosSubidas)` en la condicion del boton |
| Manda hayNovedad solo como booleano | `routes/remision.ts:246` normaliza a true/false/null | Confirmado: mismo endpoint, mismo momento - el servidor decide de nuevo sin confiar en el cliente. 13.3, espejo legitimo |

Las cuatro filas se releyeron contra el codigo de HEAD `7aefbab`, no se aceptaron de
`apply-progress.md` por transcripcion.

---

### Correctness (Static Evidence)

| Decision (design.md) | Status | Notes |
|------------|--------|-------|
| D1 - ALTER al final de schema.sql | Implemented | Confirmado, tail del fichero |
| D2 - Guardian 37/19/18, edicion en linea | Implemented | `migrate.test.ts:369-380`, verde |
| D3 - Alta lee hayNovedad en linea, sin guarda | Implemented | `routes/remision.ts:246` |
| D4 - db/remisiones.ts en linea, 0 lineas netas | Implemented | `:25,40,47-48,50` |
| D5 - Predicado al final de remision.ts | Implemented | `:104-112`, no toca index.ts |
| D6 - Remision.hayNovedad antes del cierre de types.ts | Implemented | `:733-735` |
| D7 - Guarda en /enviar entre "ya enviada" y reclamarEnvio | Implemented | `:283-289`, mutacion-probada (V1/V2 + M1-M3) |
| D8 - Payload sin cambios | Implemented | git diff vacio en remisionWebhook.ts |
| D9 - Cliente: pregunta, bloqueo, payload | Implemented | CrearRemision.tsx, confirmado por typecheck + lectura |
| D10 - Pruebas en fichero nuevo fotoNovedad.test.ts | Implemented | 6 pruebas, P2-P7 |

### Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| Desplazamientos de citas estimados en design.md | Corregidos, no seguidos al pie | apply-progress.md Fase 9 midio los reales y reaputo todas las citas; design.md recibio notas de correccion sin reabrir D1-D10 |
| Barrido de citas completo (no solo la lista de design.md) | Si, y encontro 2 citas adicionales | spec.md:298 (:330) y la abreviada :353-363 de la fila M-1 - reapuntadas igual que las demas |
| Clasificacion Caso A/B de F0-00_Baseline_as-built.md:173,468 | Reclasificado de "probable Caso B" a Caso A | apply-progress.md, seccion Deviations from design, con justificacion |

---

### Issues Found

**CRITICAL**: None

**WARNING**:
1. Desplazamiento real de citas en `routes/remision.ts` (+7, no +5 como estimaba design.md) y en
   `CrearRemision.tsx` (+1/+4/+9/+25 reales contra +1/+2/aprox5/aprox13 estimados) - regla de diseno:
   "Design deviation exists -> WARNING unless it breaks a spec". No rompe ningun requisito ni
   comportamiento; apply-progress.md lo midio y reapunto todas las citas afectadas en su barrido de la
   Fase 9 (regla de mutacion 4), y design.md recibio la nota de correccion correspondiente.
2. Dos citas adicionales (spec.md:298/:330 y la abreviada :353-363 de la fila M-1) no estaban en la
   lista de design.md y se encontraron solo por correr el barrido COMPLETO en vez de la lista del
   diseno - senal de que un barrido parcial habria dejado dos citas rotas. Ya reapuntadas; se anota
   para que el patron "barrido completo, no solo la lista" se mantenga en cambios futuros.
3. Reclasificacion Caso A/B de dos citas de F0-00_Baseline_as-built.md (:173, :468) frente a lo que
   design.md marcaba como "probable Caso B" - decision razonada y documentada, no un error, pero es
   una desviacion del diseno que la regla de decision de este skill exige reportar.

**SUGGESTION**:
1. Cobertura de rama (no de linea) por debajo de 100% en db/remisiones.ts (68%) y routes/remision.ts
   (80.86%) - los huecos son ramas PREEXISTENTES ajenas a este cambio (isoOrNull, parseo de
   incluye/resultado, la guarda de orden de venta duplicada :232-234). Las dos ramas del ternario que
   si introduce este cambio (typeof r.hay_novedad === 'boolean' ? ... : null) estan cubiertas por P2.
   No requiere accion.
2. El detector de citas (cli.ts --sha HEAD) reporta 2 de sus 14 "abreviadas rotas" informativas dentro
   del propio apply-progress.md de este cambio (linea 133, citando :153 y :127 de routes/remision.ts
   DENTRO de una frase sobre CLAUDE.md) - es el patron ya documentado en CLAUDE.md (el detector no
   bloquea la forma abreviada, hace falta un segundo pase, lectura humana): la prosa menciona numeros
   de linea de OTRO fichero y el detector los atribuye al fichero que se esta narrando. No bloquea
   (exit 0 confirmado) y no es una cita rota de verdad.

---

### Verdict

**PASS WITH WARNINGS**

Los 49/49 tasks estan completos (dos casillas de repositorio confirmadas y marcadas por esta fase,
tres comprobaciones de persona correctamente fuera del recuento). Los 10/10 escenarios automaticos de
la delta pasan con evidencia de ejecucion real (npm test, 1390/1390 verde). El orden de las seis
puertas de /enviar esta probado por posicion con cinco mutaciones (tres de apply-progress.md, dos
propias de esta fase) y las cinco revierten a git diff vacio. IV-12 (orden de guardas del ALTA) se
confirmo byte a byte intacto contra a0a2935. El esquema esta calificado y guardado por
migrate.test.ts. El payload a n8n no cambio (git diff vacio). La tabla de la regla 13 se contrasto
linea a linea contra el codigo de HEAD, no se acepto de segunda mano. Las tres WARNING son
desviaciones de ESTIMACION de lineas (no de comportamiento ni de requisito), ya medidas, documentadas
y corregidas por el propio apply; no bloquean archivar.
