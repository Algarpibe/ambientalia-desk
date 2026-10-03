```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:98f215f3200ee5cba66938036ceae72a9052e5727ae4648cbca1a0c651222b2a
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 4/4
scenarios: 24/24
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:20cfc5248031406b4b47d90e4c3299d8484716f32b3e4b964d9633fbb0c384e3
build_command: npm run typecheck
build_exit_code: 0
build_output_hash: sha256:f9de8b15b07069fcbf31f4a415061f4b90d66551059b5518c6d53e721545e547
```

# Informe de verificación — derivacion-repuestos-director-tecnico (F1C-11)

**Modo:** Strict TDD · hybrid · **HEAD verificado:** `3d1b753` (planificación `870adb6`, código `d179c12`, base `f55b7d9`).
Verificación independiente, ejecutada el 2026-10-03 en el worktree, árbol limpio.

## Veredicto: PASS WITH WARNINGS

0 CRITICAL · 4 WARNING · 3 SUGGESTION. Nada bloquea el archivo. W1, W2 y W4 son instrucciones obligatorias para `sdd-archive`.

## Completitud

| Métrica | Valor |
|---|---|
| Tareas ejecutables | 32/32 marcadas (ninguna casilla `[ ]` en `tasks.md`) |
| Tareas de personas | 4, fuera del recuento por la regla del ciclo 1 (`tasks.md:73-78`) |
| Requisitos de las deltas | 4 (RQ-AV-02, RQ-PM-12, RQ-PM-20, RQ-PM-23) |
| Escenarios de las deltas | 24 (13 en `derivacion-avisos`, 11 en `permissions`) |

## Ejecución (contra `3d1b753`)

| Comando | Resultado |
|---|---|
| `npm test` | salida 0 · 178 ficheros pasan, 1 omitido · **2.639 pruebas pasan, 2 omitidas** (igual que el apply) |
| `npm run typecheck` | salida 0 |
| `npm run lint` | salida 0 · `165 problems (0 errors, 165 warnings)`, en el techo |
| `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` | salida 0 · comprobadas 4.800 · abreviadas rotas 15 (informativas) · cabeceras R-1 inválidas 0 |

## Cero líneas netas (punto 3)

`wc -l` en HEAD y en `f55b7d9`: `transitions.ts` 397=397, `cargos.ts` 98=98, `sla.ts` 146=146. Líneas tocadas según
`git diff f55b7d9 HEAD`: `transitions.ts` 6+/6−, `cargos.ts` 3+/3−, `sla.ts` 2+/2−. Forma de D-1, leída en el fichero:

- `transitions.ts:276` = `escalado_a_revision: {…'Director Técnico'}, solicitud_repuestos: { tipo: 'cargo', cargo: 'Director Técnico' },`
- `transitions.ts:281` = `aprobacion: { tipo: 'primerDerivado' }, entrega_repuestos: { tipo: 'primerDerivado' },`
- `cargos.ts:14` = `'Director Comercial', 'Coordinador Comercial', 'Asistente Comercial', 'Especialista técnico',` (minúscula como `openspec/config.yaml:3494`).
- Los comentarios `transitions.ts:269` y `:272` dicen 26 y «cinco entradas»; `cargos.ts:9-10` nombra las dos decisiones.

## Matriz escenario → prueba (punto 1)

Todas las pruebas citadas pasan en la ejecución completa. `packages/shared/src/` = `packages/shared/src`, `apps/desk/` = `apps/desk`.

### `derivacion-avisos` (RQ-AV-02)

| Escenario | Prueba | Estado |
|---|---|---|
| Cinco proponen, 26 heredan | `packages/shared/src/transitions.test.ts:79` (mapa de cinco; el 26 es consecuencia, no se afirma literal) | COMPLIANT (W3) |
| El mapa entero queda fijado | `packages/shared/src/transitions.test.ts:79-93` | COMPLIANT |
| `solicitud_repuestos` propone al titular activo | `apps/desk/src/lib/personas.test.ts:135` (cargo «  director TECNICO » plegado, `porDefecto` real) | COMPLIANT |
| Cae al heredado sin titular | `apps/desk/src/lib/personas.test.ts:135` (tramo sin titular: `u-t` y `null`) | COMPLIANT |
| Dos Directores Técnicos: gana el primero | `apps/desk/src/lib/personas.test.ts:135` (`u-d1` antes que `u-d2`); previa `:85` | COMPLIANT |
| `entrega_repuestos` devuelve al primer derivado | `apps/desk/src/lib/personas.test.ts:145` y `apps/desk/server/transiciones.test.ts:477` (N4, HTTP) | COMPLIANT |
| Cae al heredado si el primer derivado no sirve | `apps/desk/src/lib/personas.test.ts:145` (nulo y de baja) | COMPLIANT |
| El servidor no impone el destinatario | `apps/desk/server/transiciones.test.ts:515` (N5: 200 y `derivado_a` escrito) | COMPLIANT (S1) |
| El servidor rechaza persona de baja | `apps/desk/server/transiciones.test.ts:515` (422 y estado intacto) | COMPLIANT |
| `En Proceso` lee Director Técnico; `Solicitado` sin cargo | `packages/shared/src/sla.test.ts:115` y `:179`; falta el AND de `ALARMAS_SLA` | PARCIAL (W3) |
| Las tres retiradas no tenían propuesta | `packages/shared/src/transitions.test.ts:79` (la igualdad de mapa excluye cualquier otra) | COMPLIANT |
| El comentario de recuento dice la cifra nueva | Sin prueba: es lectura del código. Leído en `transitions.ts:269` y `:272`; 0 aciertos de «otras 28», «tres líneas» y «tres entradas» en `packages/shared/src/*.ts` | Aceptado por lectura: el escenario es de lectura; sin prueba (W3) |
| Quitar una entrada nueva pone el mapa en rojo | M1 de este informe (R1 roja) y M1-M3 del apply | COMPLIANT |

### `permissions` (RQ-PM-12, RQ-PM-20, RQ-PM-23)

| Escenario | Prueba | Estado |
|---|---|---|
| La lista tiene ocho entradas exactas | `packages/shared/src/cargos.test.ts:23` (a mano y en orden), `:57` (contra las dos decisiones) | COMPLIANT |
| «Especialista técnico» va al final | `packages/shared/src/cargos.test.ts:23` (orden exacto) | COMPLIANT |
| El guardián lee las dos decisiones | `packages/shared/src/cargos.test.ts:57`; M5a/M5b del apply (el orquestador reprodujo M5) | COMPLIANT |
| El octavo cargo no concede ni quita nada | `packages/shared/src/cargos.test.ts:260` (4 áreas × 31 = veredictos de `Técnico`; `cargoQueFaltaParaTransicion` da `Director Comercial`), `:189` (1.870), `apps/desk/server/permisos.test.ts:356` (837) | COMPLIANT |
| No pasa las primitivas con cargo exigido | `packages/shared/src/cargos.test.ts:118` y `:124` (recorren `CARGOS`, ocho), `:260` | COMPLIANT |
| El alta acepta el octavo cargo | `apps/desk/server/cargoPermiso.test.ts:271` (N3: alta, edición y 422 con otra grafía) | COMPLIANT |
| Por cargo y admin (RQ-PM-20) | `packages/shared/src/cargos.test.ts:118`, `:124` | COMPLIANT |
| Sólo la del Top 5 tiene llamador | `packages/shared/src/cargos.test.ts:226` | COMPLIANT |
| Las tres rutas dan el mismo veredicto | `apps/desk/server/prioridadTop5.test.ts:150` (PUT) y `:359` (POST), diez sujetos | COMPLIANT |
| Director Comercial sin área Comercial | `apps/desk/server/prioridadTop5.test.ts:168`, `:377` | COMPLIANT |
| El cargo sin área no concede | `apps/desk/server/prioridadTop5.test.ts:173`, `:377` | COMPLIANT |

## Mutaciones reproducidas por esta verificación (punto 4)

Cada una aplicada sobre los 8 ficheros focales y revertida con `git checkout --`; `git status --short` quedó vacío.

| # | Mutación | Rojo observado | Esperado (D-4) |
|---|---|---|---|
| M1 | Quitar `solicitud_repuestos` de `transitions.ts:276` | 5 rojas: `transitions.test.ts:79` (R1), `sla.test.ts:115` (R2), `sla.test.ts:179` (R3), `personas.test.ts:135` (N1), `transiciones.test.ts:477` (N4) | R1, R2, R3, N1, N4: exacto |
| M6 | Quitar «Especialista técnico» de `cargos.ts:14` | 9 rojas: `cargos.test.ts:23` (R4), `:57` (R5), `:189` (R6), `permisos.test.ts` ×2 (R7, 744≠837), `prioridadTop5.test.ts` ×2 (R8, 9≠10), `cargos.test.ts:254` (N2), `cargoPermiso.test.ts:271` (N3, 422≠201) | R4-R8, N2, N3: exacto |
| M7 | En `ticketService.ts`, junto a `:138-142`, rechazar con 422 un derivado de `solicitud_repuestos` cuyo cargo no contenga «director» | 1 roja y sólo ella: N5 (`transiciones.test.ts:515`, `expected 422 to be 200`); N4 sigue verde | N5: exacto |

M4 y M5 las reprodujo el orquestador; M2 y M3 constan en el apply y no se repitieron aquí.

## Cumplimiento TDD (módulo estricto)

| Comprobación | Resultado |
|---|---|
| Tabla «TDD Cycle Evidence» (`apply-progress.md:96-108`) | Presente, 9 filas |
| Ficheros de prueba existen y pasan | 9/9 pasan en la ejecución completa |
| RED con salida literal | Listada (`apply-progress.md:17-33`); coherente con M1 y M6 reproducidos |
| Pruebas que nacen verdes | N5 y la 2.ª `it` de N2, declaradas y justificadas (`apply-progress.md:36-39`); N5 tiene detector real (M7) |
| Triangulación | Adecuada: activo, baja, dos titulares, sin titular, nulo, otra grafía |

**Calidad de aserciones:** sin tautologías ni bucles fantasma (`cargos.test.ts:260` recorre listas fijas y cuenta `comparadas` = 4 × 31).
Cobertura por herramienta: no disponible, se omite sin tratarlo como fallo. Capas: unidad (`packages/shared`, `personas.test.ts`) e
integración HTTP con pg-mem (`transiciones`, `cargoPermiso`, `permisos`, `prioridadTop5`). Pruebas `.tsx` excluidas por decisión de
Gerencia (F0-00): no se registra como carencia.

## Contraste con la letra de Gerencia (punto 5)

`respuesta_textual` (`openspec/config.yaml:3494`): «Solicitud repuestos» deriva al cargo Director Técnico, que ejecuta «Entrega de
Repuestos» y devuelve el ticket «al técnico que lo tenía»; con el Director ausente, al especialista técnico; el cargo se da de alta
para que el respaldo vaya al cargo y no al nombre.

| Pieza de la letra | Construido | Supuesto |
|---|---|---|
| Deriva al cargo Director Técnico | `transitions.ts:276` | S-1: propuesta editable, el servidor no impone; pregunta a Gerencia en E-160 |
| Devuelve al técnico que lo tenía | `transitions.ts:281`, `primerDerivado` | S-4; coincide con `R08.4.md:1619` |
| Cargo, no persona | Literal de la lista cerrada, no un id | — |
| Alta de «Especialista técnico» | Octavo de `CARGOS` (`cargos.ts:14`) | S-7: al final |
| Respaldo por ausencia | **No construido, a propósito**: `config.yaml:3614` lo aplaza a 1E; plan R01.4 `:109` y `:223` lo excluyen de F1C-11 | — |
| Asignarlo a Johny Luna | Tarea de persona, fuera del repositorio | W4 |

**Fuera de alcance, comprobado:** `git diff f55b7d9 HEAD --name-only` no contiene ningún `.tsx`; `ticketService.ts` no cambia;
la búsqueda de `ausenc|respaldo|Johny` sobre las líneas añadidas de `apps/` y `packages/` sólo acierta en el nombre
`cargoDeRespaldoDeLaDecision` y en comentarios; no hay lógica de respaldo, de ausencias ni de imposición. S-2 (`users.cargo`
plegado), S-3, S-5 (cae al heredado) y S-6 (`destinatarioDelEscalado('En Proceso')` con Director Técnico) se cumplen; `ALARMAS_SLA`
(`sla.ts:137-140`) sólo tiene `Notificado`, `Remisión creada` y `Notificación cliente`, así que a nadie se le avisa distinto.

## Barrido de citas (punto 6)

Del `git grep` de citas completas a `transitions.ts` y `cargos.ts` en `f55b7d9` que solapan líneas editadas, se leyeron 22 contra HEAD
(entre ellas 4 de `archive/` y 3 de `openspec/specs/`). Lo que afirman sigue cierto o es histórico declarado:

| Cita | Afirma | Veredicto |
|---|---|---|
| `openspec/config.yaml:1427`, `:2400` (`transitions.ts:274-282`) | el bloque del mapa | Cierto: `:274` es `const DERIVACION_POR_DEFECTO`, `:282` su cierre |
| `openspec/config.yaml:1552` (`:276`) | la línea de `escalado_a_revision` | Cierto: el primer literal conserva su columna |
| `openspec/config.yaml:1940` (`:276-281`, «sobre `3f30710`») | dos cargos declarados | Caso B anclado a su revisión |
| `openspec/config.yaml:1443`, `:2593` (`:276-281`) | lo declarado en esas líneas | Cierto o histórico anclado |
| `openspec/specs/transitions-st/spec.md:1394` (`transitions.ts:274`) | `aprobacion: { tipo: 'primerDerivado' }` | Falsa **desde antes** (`aprobacion` está en `:281`); ya lo era en `f55b7d9` (S3) |
| `openspec/specs/derivacion-avisos/spec.md:81`, `:656` (rango viejo 267-276) | el bloque del mapa | Desfasadas por una tanda anterior; las repara el archivo (W2) |
| `docs/sdd/ENTRADA.md:216`, `:1044` (`:276-281`) | los dos cargos `Director Técnico` y `Coordinador Comercial` | Cierto: los literales siguen en esas líneas |
| `Decisiones_Gerencia_2026-09-10.md:346`, `F0-00_Baseline_as-built.md:55`, `F0-03/decisiones-para-carga.md:113` | citas ya desfasadas o fechadas | Caso B, sin tocar (D-6) |
| `Desk2.0_Plan_…R01.4.md:175` (`cargos.ts:12-15`, «siete») | dependencia que F1C-11 cierra | Caso C, se conserva |
| `Paquete_de_Despliegue_2026-10-01.md:188` (`cargos.ts:12-15`) | la lista y la lectura «sin cargo» | Cierto: `:12-15` es la lista |
| `archive/2026-09-30-permisos-por-cargo/` `proposal.md:24`, `archive-report.md:57`, `verify-report.md:60` (`:276`, `cargos.ts:12-15`) | dos cargos como texto en `:276`, `TS2820` en esa línea, siete entradas | Históricos; `:276` conserva el mismo primer literal y `:12-15` sigue siendo la lista |
| `archive/2026-10-01-prioridad-top5-cliente/verify-report.md:231` (`cargos.ts:13`, `transitions.ts:276`) | `:13` es la lista; `:276` declara Director Técnico | Cierto hoy |
| `sla.test.ts:93`, `sla.ts:66` (rango viejo `267-276`) | el bloque del mapa | Reparadas por esta tanda a `:274-282` |

**Citas nuevas.** E-160 (`ENTRADA.md`): `ticketService.ts:138-142` (valida persona existente y activa; leído, cierto), `proposal.md:110`
(es la fila de S-1: cierto). E-161: `transitions.ts:274-282` cierto;
`blueprintserviciotecnico.html:388` y `:390` no se comprobaron contra el HTML y E-161 ya marca «Hipótesis» la parte que depende del generador.
Corrección nº 21: `R08.4.md:2005` («Tres proponen a otro:»), `:2006-2017` (cabecera y tres filas), `:2015-2017` (Aprobación), `:2018`
(«Las dos primeras nombran un cargo»), `:2025-2026` y `:2027` (reglas de destino), `:1264` («tres construidas … y dos decididas») y
`:1417` («las cinco etapas»): todas leídas y ciertas. `cargos.ts:12-15` y `transitions.ts:274-282` de la corrección: ciertas.

## Hallazgos

### CRITICAL

Ninguno.

### WARNING

- **W1 · `registro.test.ts:218-220` se pone roja al archivar.** El apply la editó a OCHO «en curso» con `'F1C-11'` (desviación 1),
  porque `870adb6` dejó el `proposal.md` de F1C-11 fuera de `archive/`. En `comprobaciones.ts:215-222`, `enCurso` excluye las tandas con
  `x.archivada && x.cierra` y `archivo` las suma a «cerradas por archivo». Con el cambio en `openspec/changes/archive/` y `cierra: si`,
  F1C-11 sale de «en curso» y la prueba espera ocho con siete reales. **El commit de archivo debe devolver ese literal a SIETE en el mismo
  commit** (precedente `6dbae98`), o `main` queda rojo. Se comprueba con `npx vitest run apps/desk/server/reconciliacion`. Las pruebas de
  `comprobaciones.test.ts` usan fixtures y no cambian; el denominador (78) tampoco.
- **W2 · Citas que el archivo debe reparar.** `derivacion-avisos/spec.md:81` y `:656` (`:267-276`) se corrigen al fusionar el delta;
  `permissions/spec.md:284`, `:422` y `:462` dicen «siete cargos» y los sustituye el delta. Si la fusión omite una, queda una afirmación falsa
  en presente. Comprobación posterior a la fusión: `grep -n "siete cargos\|267-276" openspec/specs/permissions/spec.md openspec/specs/derivacion-avisos/spec.md`.
- **W3 · Tres afirmaciones de la delta sin aserción por ejecución.** (a) «26 heredan»: `transitions.test.ts:79` fija el mapa de cinco y 26
  es consecuencia (31 − 5), pero nada afirma 26. (b) El comentario de recuento (`transitions.ts:269`, `:272`) sólo lo detecta la lectura humana.
  (c) El AND «ningún estado de `ALARMAS_SLA` es `En Proceso` ni `Solicitado`» no tiene aserción: `sla.test.ts:293-294` sólo compara las claves de dos
  tablas. Hoy es cierto (`sla.ts:137-140`). Es el molde de la regla de mutación 4 («una cita en un comentario no es una aserción»); no cambia el veredicto.
- **W4 · Las dos tareas de persona sobre producción no están escritas donde se cargan.** `tasks.md:77-78` dice que quedan en `DEPLOY.md`
  y en el paquete de despliegue; ninguno de los dos aparece en `git diff f55b7d9 HEAD --name-only`, y E-160/E-161 sólo recogen la pregunta S-1 y el
  HTML. `apply-progress.md:120` afirma que quedan «con su dueño y destino», pero la única huella es la frase «condición de despliegue» de la
  corrección nº 21. Al archivar, `tasks.md` va a `archive/`, que no se carga. Faltan: (1) asignar «Especialista técnico» a Johny Luna;
  (2) confirmar que `users.cargo` del Director Técnico se lee como «director tecnico» plegado. Sin ellas la propuesta cae al heredado en silencio
  (S-5). **Archivar no las da por hechas** (regla del ciclo 1): conviene que `sdd-archive` las escriba en `ENTRADA.md` o en el paquete de despliegue.

### SUGGESTION

- **S1 · N5 ejecuta con cookie de administrador** (`transiciones.test.ts:515-531`, `adminCookie()`), mientras el escenario dice «un usuario de
  Servicio Técnico». El admin salta las guardas de área; lo que se prueba (que nadie impone el destinatario) no cambia, pero un usuario de Servicio
  Técnico sería más fiel al escenario.
- **S2 · La 2.ª `it` de N2 (`cargos.test.ts:260`) nace verde y no detecta la ausencia del literal** (la 1.ª sí). Declarado en el apply; sólo
  protege contra una futura excepción de cargo mal puesta.
- **S3 · `openspec/specs/transitions-st/spec.md:1394` cita `transitions.ts:274` para `aprobacion`**; ya estaba desfasada en `f55b7d9`, dentro
  de una fila histórica de F1B-06. Sin acción en esta tanda.

## Cabecera R-1 y fila del plan (punto 8)

`proposal.md:1-9`: siete campos presentes (`tanda: F1C-11`, `motivo: ""` válido porque la tanda es del plan, `capacidad`, `maestro`,
`cierra: si`, `toca_maestro: si`, `origen_cabecera: declarada`); el detector da 0 cabeceras inválidas. `cierra: si` es coherente con
`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:109`: la fila pide la derivación al Director Técnico y declara fuera de sí misma el
respaldo («espera al registro de ausencias (1E)»), y `:223` lo repite («Sólo la derivación al Director Técnico (S)»). Lo que la fila pide está
construido y probado. Toca el maestro: la corrección nº 21 lo entrega como texto (el `.docx` no se edita desde el repositorio).

## Medida (referencia)

`git diff --shortstat --no-renames f55b7d9 HEAD -- . ':!openspec/changes'`: 14 ficheros, +256/−47 (código, pruebas y docs fuera de la carpeta del cambio).

## Siguiente paso

`sdd-archive`, con W1, W2 y W4 como instrucciones, y la medida de la parte revisable antes de aplicar (regla del archivo).
