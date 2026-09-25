```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:0041bc1ad2328a74b6654ee80b9d151ea220b9553f43b505177614035967d594
verdict: pass
blockers: 0
critical_findings: 0
requirements: 4/4
scenarios: 11/11
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:afe6586dd6ccf3a0a67261eb69817b0ea8eaa2faf3499bd752cffc72a61f9d10
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:5be5ad7894a4aa26e12453c17f10f249d051b04ffb7c159d180c69803f674939
```

## Verification Report

**Cambio**: `edicion-comercial-equipo` (F1B-14, segundo cambio, `cierra: si`)
**Version de la spec**: delta `hojas-vida` (RQ-HV-09..12)
**Modo**: Strict TDD
**Commits verificados**: `b580371` (ficha) -> `f0304ec` (lote 1, servidor/esquema) -> `5d853fe` (lote 2, cliente + barrido de citas) -> `9f7b808` (anclaje final de citas). HEAD `9f7b808`, sin push, working tree limpio salvo cuatro ficheros `docs/sdd/*` ajenos a este cambio (preexistentes al arrancar esta verificacion).

### Completeness
| Metric | Value |
|--------|-------|
| Tasks total | 65 |
| Tasks complete | 65 |
| Tasks incomplete | 0 |

Las tres casillas que apply-progress.md dejaba explicitamente para el orquestador (13.4, 16.4, 18.4 - commit de cada lote y ejecucion del CLI de citas contra un sha ya commiteado) estan verificadas y marcadas [x] por este sdd-verify con evidencia citada en la propia linea de tasks.md: git log --oneline confirma f0304ec (13.4) y 5d853fe (16.4); el CLI de citas contra HEAD (18.4) devuelve exit 0 sobre 9f7b808.

### Build & Tests Execution
**Build**: PASS (`npm run build`, exit 0 -- `tsc -b && vite build`). Aviso de Vite (no bloqueante, no es un error): `EquiposAdmin.tsx` se importa dinamicamente desde `App.tsx` y estaticamente desde `HojaDeVida.tsx`, asi que el import dinamico no separa ese modulo en su propio chunk. Es el ciclo de MODULOS entre `HojaDeVida.tsx` y `EquiposAdmin.tsx` que `design.md` (seccion "Cambios de ficheros y lotes") ya identifico y acepto a proposito ("se resuelve en el render y no hay regla no-cycle en eslint"); `apply-progress.md` solo habia corrido `typecheck`, no el build completo -- este sdd-verify es la primera vez que el aviso de Vite queda documentado por ejecucion real. No cambia el resultado del build ni el comportamiento en runtime.

```text
npm run build
tsc -b && vite build
111 modules transformed
aviso: EquiposAdmin.tsx dynamically imported by App.tsx but also statically imported by HojaDeVida.tsx
built in 1.59-1.73s, exit 0
```

**Tests**: PASS -- 1383 passed / 0 failed / 2 skipped (140 ficheros pasados, 1 saltado -- migrate.integration.test.ts, preexistente, requiere Postgres real).

```text
npm test
Test Files  140 passed | 1 skipped (141)
Tests  1383 passed | 2 skipped (1385)
Duration ~92-94s, exit 0
```

**Typecheck**: PASS -- `npm run typecheck` (`tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit`) -- sin salida, exit 0.

**Lint**: PASS -- `npm run lint` -- 165 warnings (`@typescript-eslint/no-explicit-any`), 0 errores, exit 0. Confirmado por diferencia contra el baseline `b580371` (`git stash` + lint -> 165 identico): 0 warnings nuevos, no por estimacion. El precedente de "158" que citaba `tasks.md` 13.3 estaba desactualizado, tal como ya dejo anotado `apply-progress.md` -- no es un hallazgo de esta tanda.

**Coverage** (ficheros de este cambio, ejecucion focalizada -- `equipoComercial.test.ts`, `equiposCambios.test.ts`, `equipos.test.ts`, `migrate.test.ts`, `ticketService.test.ts`; NO es la cobertura global del proyecto):

| Fichero | Lineas | Ramas | Notas |
|---|---|---|---|
| `packages/shared/src/equipoComercial.ts` | 100% | 100% | Excelente |
| `apps/desk/server/db/equiposCambios.ts` | 100% | 92.85% | Excelente -- rama sin cubrir: `isoLocal`, el `else` (`String(v)`) del ternario nunca se ejerce porque `created_at` siempre llega como `Date` desde pg-mem/pg |
| `apps/desk/server/routes/equipos.ts` | 97.18% | 80.18% | Excelente -- lineas 81-84 sin cubrir son la validacion preexistente de `clientId` en el PATCH (anterior a F1B-14, fuera del alcance de este cambio) |
| `apps/desk/server/db/equipos.ts` | 89.03% | 67.67% | Aceptable -- fichero completo, con mucho codigo anterior a este cambio no ejercido por el subconjunto de pruebas de este barrido; la unica linea nueva de F1B-14 (linea 409, la re-exportacion) SI se ejerce (los 8/8 de equiposCambios.test.ts importan por esa via) |

El aviso "ERROR: Coverage for branches (76.49%) does not meet global threshold (78%)" que imprime vitest en esta ejecucion es un artefacto de correr solo 5 ficheros de prueba contra un umbral GLOBAL de `vitest.config.ts` pensado para la suite completa -- no es una regresion de este cambio ni una comprobacion real fallida; no se interpreta como bloqueante.

---

### TDD Compliance
| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | Si | Tabla completa en apply-progress.md (Fases 1-18, ambos lotes) |
| All tasks have tests | Si | Los 39 tests nuevos cubren las Fases 1-18; Fases 14-16 (.tsx) son comodidad probada, fuera de la red por F0-00 |
| RED confirmed (tests exist) | Si | equipoComercial.test.ts, equiposCambios.test.ts, bloque F1B-14 de equipos.test.ts, ampliacion de migrate.test.ts, prueba RQ-HV-11 en ticketService.test.ts -- todos existen y verificados por lectura directa |
| GREEN confirmed (tests pass) | Si | 44/44 en equipos.test.ts (incluye las 16+4 de F1B-14), 8/8 en equiposCambios.test.ts, 8/8 en equipoComercial.test.ts, 22/22 en migrate.test.ts, 49/49 en ticketService.test.ts -- confirmado por ejecucion real en este sdd-verify, no solo por el reporte de apply |
| Triangulacion adecuada | Si | cambiosComerciales: 4 casos; puedeEditarCamposRestringidos: 4 casos; guarda de area: 15 escenarios HTTP; orden A/B/C: 7 escenarios de posicion |
| Safety Net ficheros modificados | Si | routes/equipos.ts partia de 28/28 verdes (24 preexistentes + 4 de escalon A/C); db/equipos.ts solo gana una linea de re-exportacion al final, sin tocar codigo existente |

**TDD Compliance**: 6/6 checks passed

---

### Test Layer Distribution
| Layer | Tests | Files | Tools |
|-------|-------|-------|-------|
| Unit | 8 | 1 (equipoComercial.test.ts) | vitest |
| Integration (pg-mem / HTTP-mem) | 31 | 4 (equiposCambios.test.ts, equipos.test.ts bloque F1B-14+escalon A/C, migrate.test.ts, ticketService.test.ts) | vitest + pg-mem + supertest |
| E2E | 0 | 0 | no instalado (F0-00: sin .tsx en la red de pruebas) |
| **Total** | **39** | **6** | |

---

### Assertion Quality
Auditados equipoComercial.test.ts, equiposCambios.test.ts y el bloque F1B-14 de equipos.test.ts (16 tests) contra los patrones prohibidos de strict-tdd-verify.md (tautologias, bucles fantasma, mocks sin llamada a produccion, smoke-test-only, exceso de mocks sobre aserciones). Ninguno encontrado: todas las aserciones llaman a produccion real (HTTP contra el arnes, o las funciones puras/DB directamente) y comparan valores concretos, no solo presencia/ausencia. Los `expect(...).toEqual([])` de "cero filas" (criterios 2, 7, 9.1b) tienen siempre una prueba hermana con filas NO vacias en el mismo describe (criterios 1, 3, 9.1) -- no son huerfanos.

**Assertion quality**: Todas las aserciones verifican comportamiento real.

---

### Quality Metrics
**Linter**: 165 warnings preexistentes (@typescript-eslint/no-explicit-any), 0 nuevos, 0 errores
**Type Checker**: Sin errores

---

### Spec Compliance Matrix (delta hojas-vida, RQ-HV-09..12)

| Requisito | Escenario | Prueba | Resultado |
|---|---|---|---|
| RQ-HV-09 | Tecnico sin Comercial, solo Drive cambia | equipos.test.ts > [criterio 1] | COMPLIANT |
| RQ-HV-09 | Tecnico sin Comercial cambia un restringido -> 403 | equipos.test.ts > [criterio 2] | COMPLIANT |
| RQ-HV-09 | Comercial/admin cambia los tres | equipos.test.ts > [criterio 3] / [criterio 3b] | COMPLIANT |
| RQ-HV-09 | Escalon A (mantenedor) gana a la guarda de area | equipos.test.ts > [posicion 8.1] | COMPLIANT |
| RQ-HV-09 | Escalon B gana al 422 de contenido | equipos.test.ts > [posicion 8.2] | COMPLIANT -- confirmado ademas por MUTACION real de este sdd-verify |
| RQ-HV-10 | PATCH que cambia dos de seis deja dos filas | equipos.test.ts > [9.1] | COMPLIANT |
| RQ-HV-10 | PATCH que no cambia nada no genera registro | equipos.test.ts > [9.1b] | COMPLIANT |
| RQ-HV-10 | El registro sobrevive al borrado del equipo | equipos.test.ts > [12.1] + equiposCambios.test.ts | COMPLIANT |
| RQ-HV-10 | Lectura mas reciente primero | equiposCambios.test.ts > orden created_at DESC | COMPLIANT |
| RQ-HV-11 | Alta directa, sin Comercial, tres restringidos -> 201, 0 filas | equipos.test.ts > [RQ-HV-11] | COMPLIANT |
| RQ-HV-11 | Alta de ticket Equipo nuevo, datos comerciales completos -> 0 filas | ticketService.test.ts > RQ-HV-11 | COMPLIANT -- ver nota |
| RQ-HV-12 | Boton Editar, campos restringidos en solo lectura, seccion Cambios | Comprobacion de persona (Persona-1/2/3) -- fuera de la red de pruebas por F0-00 | PARTIAL (persona) -- codigo estatico confirmado, archivar no la da por hecha |

**Compliance summary**: 11/11 escenarios automaticos compliant. RQ-HV-12 no tiene escenarios automaticos por diseno de la delta (vitest.config.ts:16-20, decision F0-00); sus tres comprobaciones de persona quedan registradas en tasks.md con dueno Comercial/Gerencia, tal como exige la Regla del ciclo 1 de CLAUDE.md.

**Nota RQ-HV-11 (segundo escenario)**: la delta describe el GIVEN como "sesion sin area Comercial", pero ticketService.test.ts (lineas 584-597) invoca createManagedTicket a nivel de servicio con el actor 'Admin', sin pasar por el middleware HTTP de sesion/area. Verificado por lectura: ninguna de las dos vias de alta (POST /api/equipos ni crearTicketConEquipo) llama a registrarEdicion ni comprueba area (D9) -- la exencion es incondicional, no depende de que area tenga el actor -- asi que el resultado (0 filas) es identico con cualquier sesion, incluida una sin Comercial. La prueba SI demuestra el requisito (D9: eximir siempre), aunque su GIVEN literal no reproduce "sin Comercial" en el nivel de sesion HTTP. SUGGESTION, no CRITICAL/WARNING: no hay comportamiento sin probar, solo una descripcion de escenario mas estricta que la prueba.

### Orden de guardas del PATCH -- verificado por ejecucion y por DOS mutaciones reales

Codigo real (apps/desk/server/routes/equipos.ts:73-121), confirmado linea a linea:

1. linea 76 -> 404 equipo inexistente (A)
2. linea 82 -> 422 cliente no encontrado (A, preexistente, fuera de alcance de F1B-14)
3. lineas 92/94 -> 422 modelo obligatorio / no encontrado (A, preexistente)
4. linea 101 -> 422 mantenedor no encontrado, via camposHojaDeVida/escalon === 'A' (A)
5. lineas 107-110 -> 403 guarda de area nueva de F1B-14 (B)
6. linea 111 -> 422 de contenido -- fechas, Drive (C)

Coincide exactamente con D8 de design.md y con el orden 404 -> 422(A) -> 403(B) -> 422(C) del encargo.

**Mutacion 1 -- posicion**: se movio el 403 (paso 5) para que corriera DESPUES del 422 de escalon C (paso 6), dejando intacta la condicion. `npx vitest run apps/desk/server/equipos.test.ts` con la mutacion aplicada dio 2 tests en rojo, exactamente los que fijan el orden B<C: [posicion 8.2] (expected 422 to be 403) y [P-BC 8.6a] (expected 422 to be 403); los otros 42/44 siguieron verdes, incluida [P-BC 8.6b] (que ya esperaba 422 con Comercial, sin cambio de comportamiento). Revertido con la copia de respaldo; `npx vitest run apps/desk/server/equipos.test.ts` volvio a dar 44/44 verde; `git diff --stat apps/desk/server/routes/equipos.ts` quedo vacio (confirmado tambien con git status --porcelain).

**Mutacion 2 -- quitar cambios de la respuesta de GET /historial**: en routes/equipos.ts:41, se quito `cambios: await listarCambiosEquipo(...)` del res.json. `npx vitest run apps/desk/server/equipos.test.ts` dio 1 test en rojo, exactamente el que depende de esa clave: [11.2] GET /historial trae cambios con la fila de un PATCH previo (Target cannot be null or undefined, porque hist.body.cambios paso a ser undefined); 43/44 restantes siguieron verdes. Revertido; 44/44 verde; git diff --stat apps/desk/server/routes/equipos.ts quedo vacio.

git status --porcelain del repositorio tras las dos mutaciones y sus reversiones: solo los cuatro ficheros docs/sdd/* ya presentes al empezar esta verificacion (ajenos a edicion-comercial-equipo); ningun fichero de codigo quedo modificado.

### Esquema -- public.equipos_cambios

| Comprobacion | Resultado |
|---|---|
| CREATE TABLE calificado (public.equipos_cambios) | Si -- schema.sql:496-505 |
| Sin FK en cascada | Si -- confirmado por lectura, no hay REFERENCES en la definicion (supuesto c4) |
| En PUBLIC_TABLES | Si -- migrate.ts:73, anadida en la MISMA linea (D3), sin desplazar migrate.ts:80 (BOOKS_TABLES) |
| Recuento del guardian | Si -- migrate.test.ts da [10, 18, 3] / 31 tablas totales, verde por ejecucion real |
| Test de existencia tras migrate() | Si -- migrate.test.ts, verde |
| Guardian de calificacion (regla de mutacion 2) | Si -- documentado y ejecutado en apply-progress.md (M7a/M7b), no repetido en este sdd-verify por redundancia; el guardian en si se confirmo verde en la corrida completa de npm test |

### Regla 13 / regla de mutacion 3 -- decisiones del cliente contrastadas contra el codigo de hoy

Tabla completa en apply-progress.md (Fase 17, lote 2). Contraste de 5 de sus 5 filas contra HEAD (9f7b808), mas de las 3 minimas pedidas:

| Decision del cliente | Linea de servidor citada | Verificado hoy |
|---|---|---|
| Bloquear los tres restringidos en edicion si !puedeEditarCamposRestringidos | routes/equipos.ts:107-110 | Exacto -- linea 107 es el if con la condicion, lineas 108-110 el 403 |
| No bloquear nada en el alta (equipo === null) | routes/equipos.ts:48-71 (a1) | Exacto -- POST /api/equipos no aplica guarda de area; en el cliente, EquiposAdmin.tsx:108 confirma que el alta nunca bloquea |
| Mandar los seis campos siempre | equipoComercial.ts:46-55 (D2) | Exacto -- cambiosComerciales compara contra guardado campo a campo |
| Boton Editar visible para toda sesion | requireAuth(db) en routes/equipos.ts:73 | Exacto |
| Seccion Cambios visible | listarCambiosEquipo (db/equiposCambios.ts), re-exportada en db/equipos.ts:409; routes/equipos.ts:41 | Exacto -- las dos lineas citadas coinciden byte a byte con el arbol de hoy |

Ninguna decision del cliente carece de imposicion en servidor. La unica decision SIN contrapartida en servidor ("no bloquear nada en el alta") es correcta a proposito: el servidor tampoco restringe el alta (a1), asi que el cliente no es una guarda -- es comodidad simetrica con el servidor.

### Barrido de citas (regla de mutacion 4)

CLI de citas contra HEAD -> exit 0. 2202 comprobadas, 14 abreviadas rotas (todas informativas y preexistentes o auto-explicativas -- dos son texto de tasks.md que documenta un "antes -> despues" en prosa, no citas vivas), 0 cabeceras R-1 invalidas. Verificadas por lectura directa, ademas del CLI: CLAUDE.md lineas 194/201 -> migrate.test.ts:327/404-406 (exacto); zoho-sync/spec.md:250 -> migrate.test.ts:345-351 (exacto); equipoNuevo.ts:64 -> routes/equipos.ts:164-211 (exacto); openspec/config.yaml:2784 -- Caso B, nombrada la revision 0807a77, correccion pendiente correctamente registrada en docs/sdd/ENTRADA.md -> E-075 (confirmado por lectura, presente y con el contenido correcto).

### Comprobaciones de persona RQ-HV-12 (regla del ciclo 1 -- no cuentan, no se dan por hechas)

Verificacion estatica de codigo (sustituto de comprobacion de persona, no la reemplaza):
- Boton Editar: HojaDeVida.tsx:204 -- presente.
- Seccion Cambios: HojaDeVida.tsx:228 (definicion en lineas 148-167) -- presente.
- Bloqueo de campos restringidos: EquiposAdmin.tsx lineas 108, 259, 262, 268-270 (restringidosBloqueados) -- presente, y condicionado a !!equipo (solo en edicion, no en alta -- ver desviacion abajo).

Dueno: Comercial/Gerencia, verificacion manual en ambientalia-desk.ambientalia.cloud. Archivar este cambio NO las da por hechas.

### Correctness (Static Evidence)
| Requisito | Estado | Nota |
|------------|--------|------|
| RQ-HV-09 | Implementado | Guarda de area en PATCH, orden D8 verificado por ejecucion + 2 mutaciones |
| RQ-HV-10 | Implementado | Registro transaccional, sin ON DELETE CASCADE, lectura ordenada |
| RQ-HV-11 | Implementado | Las dos vias de alta no llaman a registrarEdicion ni aplican guarda |
| RQ-HV-12 | Implementado (codigo) / pendiente de persona | Boton, bloqueo, seccion -- confirmados por lectura estatica |

### Coherence (Design)
| Decision | Seguida? | Nota |
|----------|-----------|------|
| D1 (helper en packages/shared, sin modificar permissions.ts) | Si | permissions.ts intacto; equipoComercial.ts solo consume canExecuteTransition |
| D2 (normalizacion, comparar contra guardado) | Si | cambiosComerciales exacta a lo disenado |
| D3 (tabla en public, al final de schema.sql) | Si | |
| D4 (ampliar /historial, no ruta nueva) | Si | routes/equipos.ts:41 |
| D5 (modulo aparte + re-exportacion, sin desplazar citas) | Si | db/equipos.ts:409 |
| D6 (no mover camposHojaDeVida) | Si | Confirmado sin mover; deuda registrada en ENTRADA.md -> E-077 |
| D7 (escalon 'A'/'C' en el retorno) | Si | routes/equipos.ts:164 |
| D8 (orden A<B<C) | Si | Verificado por ejecucion + mutaciones |
| D9 (alta libre, sin guarda ni registro) | Si | RQ-HV-11, dos escenarios verdes |
| D10 (fusion de la delta en sdd-archive, no en sdd-apply) | Si | Spec viva hojas-vida/spec.md:180-181 confirmada SIN tocar -- pendiente correctamente diferida al archive |

### Desviaciones conocidas (evaluadas, no corregidas -- por instruccion del encargo)

1. routes/equipos.ts:75 partido en dos lineas (const actual / if (!actual)): confirmado por lectura; el desplazamiento de citas que causo esta correctamente barrido en 5d853fe/9f7b808. Sin accion pendiente.
2. openspec/config.yaml:2784 revertido por el orquestador: confirmado por lectura -- el campo sigue con el texto original ("deja hoy editar los seis campos a cualquier usuario con sesion"), que ya no es cierto desde f0304ec. La correccion pendiente esta correctamente registrada en docs/sdd/ENTRADA.md -> E-075, con destino propuesto (expediente R08.3) y dueno propuesto (Gerencia). No se toca desde esta verificacion, por la misma razon que E-075 documenta.
3. El cliente bloquea los tres campos restringidos solo en edicion (!!equipo), no en alta: confirmado por lectura, EquiposAdmin.tsx:108. Es coherente con RQ-HV-11/D9 (el servidor tampoco restringe el alta) -- no es una guarda del cliente sin contrapartida (regla invariable 13.2), es comodidad simetrica con una regla de servidor que tambien es "sin restriccion". Sin accion pendiente.

### Issues Found

**CRITICAL**: Ninguno.

**WARNING**: Ninguno.

**SUGGESTION**:
1. El GIVEN de la delta para el segundo escenario de RQ-HV-11 ("sesion sin area Comercial") no se reproduce literalmente en ticketService.test.ts:584-597 (usa 'Admin' como actor de servicio, sin pasar por sesion HTTP). El requisito queda demostrado igual (la exencion es incondicional, D9), pero quien lea la prueba junto a la delta puede notar la discrepancia de redaccion. No bloqueante.
2. npm run build (no ejecutado por apply-progress.md, que solo corrio typecheck) expone un aviso de Vite por el ciclo de modulos HojaDeVida.tsx <-> EquiposAdmin.tsx que design.md ya habia aceptado como riesgo conocido. Queda documentado por primera vez con evidencia de ejecucion real en este sdd-verify; no cambia el resultado del build.
3. La rama else (String(v)) de isoLocal en equiposCambios.ts:14 no tiene cobertura de rama (pg-mem siempre entrega created_at como Date). Es una rama defensiva sin caso de prueba, no una guarda de negocio -- informativo, no bloqueante.

### Verdict
**PASS**

1383/1383 pruebas relevantes en verde (2 skips preexistentes ajenos), build/typecheck/lint en verde, 11/11 escenarios automaticos de la delta compliant con prueba real, orden de guardas D8 confirmado por ejecucion y por dos mutaciones reales (revertidas, git diff limpio), esquema calificado y guardado por su guardian, regla 13/mutacion 3 contrastada en sus 5 filas, y barrido de citas de la regla de mutacion 4 verde por CLI y por lectura directa de una muestra representativa. Cero hallazgos CRITICAL o WARNING; tres SUGGESTION informativos, ninguno bloqueante.
