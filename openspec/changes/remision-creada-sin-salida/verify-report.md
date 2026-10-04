```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:594f2982fab79f9fc485c7f641f6b967f0b6215ff72419bc060d119897ff93e0
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 2/2
scenarios: 24/24
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:594f2982fab79f9fc485c7f641f6b967f0b6215ff72419bc060d119897ff93e0
build_command: npm run typecheck
build_exit_code: 0
build_output_hash: sha256:f9de8b15b07069fcbf31f4a415061f4b90d66551059b5518c6d53e721545e547
```

## Verification Report

**Change**: `remision-creada-sin-salida` (`tanda: F1B-03`, `cierra: no`)
**Mode**: Strict TDD. Worktree `C:\dev\Desk_2_R1.023-worktrees\remision-creada-sin-salida`, apply en `55a4cba`, base `2a74fdc`.

### Completeness
| Metric | Value |
|---|---|
| Casillas de las fases 0-5 | 35 marcadas, 0 pendientes |
| Sección de personas | H-A, H-B, H-C (`tasks.md:146-148`): NO verificadas, ver «Lo no comprobado» |

### Ejecución (códigos de salida medidos por mí)
| Comando | Salida | Resultado |
|---|---|---|
| `npx vitest run transitions.test.ts botonRemision.test.ts remisionCreadaSinSalida.test.ts` | `0` | 3 ficheros, 54 pruebas verdes |
| `npm test` | `0` | 189 ficheros + 1 omitido; **2.990 pasan, 2 omitidas** (lo esperado) |
| `npm run typecheck` | `0` | limpio |
| `npm run lint` | `0` | `165 problems (0 errors, 165 warnings)`: la cifra esperada, sin avisos nuevos |

El hash del test es de una segunda corrida completa, también con salida 0 y las mismas cifras; la salida lleva marcas de tiempo, así que no es reproducible bit a bit.

### Matriz criterio, prueba, resultado
| # | Criterio | Prueba que lo cubre | Resultado |
|---|---|---|---|
| 1 | Predicado `true` en cada `from` de `habilitar_servicio` (recorrido del catálogo), `false` en el resto | `transitions.test.ts > puedeCrearRemisionDeEntrada: atado a los orígenes de habilitar_servicio` (una prueba por estado de `ESTADOS`; `debe` sale de `transitionById('habilitar_servicio').from`), `… cada origen de habilitar_servicio es un estado del registro` y `transitions > crear remisión se ofrece en los tres orígenes…` | COMPLIANT |
| 2 | Mutación del fichero vigilado, tres veces + cuarto origen | M1a/M1b/M1c y M2 del orquestador y de `apply-progress.md` §3; **M1a reproducida por mí: 7 rojas** (P2, fila `Remisión creada` de P1, 5 de `botonRemision`) | COMPLIANT |
| 3 | Cinco filas de `Remisión creada` | `botonRemision.test.ts > botonRemision: Remisión creada sin entrada vigente` (vacía, anulada, salida, pendiente, fallida: 5 aserciones `toEqual`) | COMPLIANT |
| 4 | Mutar la protección / el predicado | **M3a reproducida por mí: cae sólo `… mientras las remisiones no han cargado (null) no se ofrece`** (`expected true to be false`); M1a pone rojas las filas visibles | COMPLIANT |
| 5 | `null` visible en `OV asignada` y `Ticket creado` | `… null en la fase inicial sigue ofreciendo crear` | COMPLIANT (caracterización, declarada) |
| 6 | Servidor, tres orígenes, por HTTP | `remisionCreadaSinSalida.test.ts > … desde «%s»: 422 con el texto único, alta 201, el ticket sigue en su origen y habilitar_servicio 200` x3 | COMPLIANT (ver W-1) |
| 7 | Variante del origen 3 (remisión de otro tipo) | `… desde «Remisión creada» con sólo una remisión de salida, el mismo recorrido` | COMPLIANT |
| 8 | Guarda, `invariantesGrafo`, `cifrasAncladas`, `mapaBlueprint` sin editarse | `git diff 2a74fdc 55a4cba --stat`: ninguno aparece; suite completa verde | COMPLIANT |
| 9 | `npm test`, `typecheck`, `lint` verdes; rojo previo | tabla de arriba; rojo en `apply-progress.md` §1 | COMPLIANT |
| 10 | Número de líneas y citas | `wc -l`: 397 / 43 / 267, iguales a la base; barrido revisado abajo | COMPLIANT |

### Matriz de escenarios
**`transitions-st` · RQ-TS-34 (7)**: el predicado admite cada origen (P1 + P2); rechaza el resto (P1 por estado); quitar un origen cae (M1a-c, verificado M1a); cuarto origen cae (M2: `cada origen… es un estado del registro`, `cifrasAncladas`, `invariantesGrafo`, `mapaBlueprint`); desde cada origen hay acción que desbloquea (P3 + P7); la guarda no cambia (sin diff en `ticketService.ts`, `ticketService.test.ts` verde sin editar, P7 recorre el `422` antes del alta); no se añade transición (`TRANSITIONS` sin diff, pruebas de grafo verdes). Todos COMPLIANT.

**`remisiones` · RQ-RE-28 (17)**: tres orígenes por HTTP (3) y origen 3 (1) COMPLIANT; límite de H-1 COMPLIANT (el fichero de servidor sólo recorre `ORIGENES` y no afirma nada sobre otros estados); seis escenarios de `botonRemision` (vacía, anuladas, otro tipo, pendiente, confirmada, `error`) COMPLIANT; sin cargar COMPLIANT; las mutaciones de protección y de predicado COMPLIANT (reproducidas); protección sólo de `Remisión creada` COMPLIANT; fuera de los orígenes oculto COMPLIANT; comentarios sin desplazar líneas COMPLIANT salvo la parte `.tsx` (persona, H-A).

**Resumen**: 24/24 escenarios cubiertos. 21 por pruebas que corrieron y pasaron, 2 de mutación por reproducción directa, 1 (comentarios, parte `TransitionPanel.tsx`) por lectura mía más persona pendiente.

### Criterio central: ¿la prueba de servidor lo demuestra?
Leída entera (`apps/desk/server/remisionCreadaSinSalida.test.ts:1-50` en `55a4cba`). **Sí lo demuestra y no hay atajo que lo vacíe**:
- El `422` previo es el de `exigirRemisionVigente`, no otro: se afirma el **texto único** completo, que sólo sale de `motivoSinRemisionVigente` (`packages/shared/src/remision.ts:131-135`), llamado desde `ticketService.ts:273-277`. El orden `422, alta, 200` es secuencial sobre el mismo ticket, así que discrimina: si el alta no desbloqueara, el último paso daría `422`.
- El alta va por `POST /api/remisiones` (`remision.ts:120`, `201` en `:263`), sin `INSERT`. La remisión recién creada queda `pendiente` y aun así habilita: es RQ-RE-20 (`esRemisionEntradaVigente` = `tipo === 'entrada' && !anuladaAt`, `remision.ts:126-128`; el estado de envío no entra). Se afirma además que tras el alta el ticket **sigue en su origen** y que la salida llega a `Ingresado`.
- El ticket sembrado (`id, number, status, managed_by_app, serial`) es mínimo, pero se parece a uno real en lo que la guarda lee: `serial` y la ausencia de remisión vigente. No tiene equipo ni cliente (la guarda de alta validada no se activa). En el origen 3 principal **no hay ninguna fila de remisión**, mientras que uno real vendría con una anulada; la variante con `tipo: 'salida'` cubre «hay una fila y no cuenta», pero «sólo anulada» no se recorre por HTTP (W-1).

### Lo que NO debía cambiar
`git diff 2a74fdc 55a4cba --stat`: 13 ficheros, +1.102/-22. Código: `transitions.ts`, `botonRemision.ts`, `TransitionPanel.tsx` (sólo comentario), tres ficheros de prueba. **No aparecen** `ticketService.ts` (guarda), `routes/remision.ts`, `estados.ts`, `estadoPorRemision.ts` ni nada bajo `openspec/specs/`. En `transitions.ts` el diff es el comentario y el `return` del predicado (`:154-164`); `TRANSITIONS` (`:178`, `from` de `habilitar_servicio`) no se toca. `wc -l`: 397 / 43 / 267, idénticos.

### Regla 13
Releí cada línea citada en la tabla de `apply-progress.md` §4: `remision.ts:120`, `:174`, `:177`, `:263`, `ticketService.ts:131` y `:273-277`, `botonRemision.ts:31`, `:33`, `:34-35`, `:39-40`. Todas dicen lo que la frase afirma. Las seis decisiones están bien clasificadas: 1 y 6 con imposición probada, 3 y 4 presentación sin contrapartida, 5 imposición vecina, y la **2 es el hueco H-1, declarado NO corregido** (`apply-progress.md:64`, delta de RQ-RE-28 y límite fijado por prueba). Conforme a la regla 13, punto 2.

### Mutaciones y TDD
- Reproducidas por mí con copia de seguridad y `cmp`: **M1a** (quitar `|| status === STATUS_REMISION_CREADA` del predicado) cae en 7; **M3a** (quitar la protección de `botonRemision.ts:31`) cae en 1, la de `null`. Revertidas con `cmp` igual a la copia; `git status --short` vacío al final.
- **«No hay mutación de posición»: bien razonado.** Con `null`, `vigentes = []` (`botonRemision.ts:33`), así que ni la rama de pendiente (`:34-35`) ni la de confirmada (`:39-40`) pueden dispararse; con el predicado en `false` las dos mitades del `||` devuelven el mismo objeto. Mover la protección a un `if` propio tras `:40` o invertir operandos es un mutante equivalente. No hay par de guardas cuyo orden sea observable.
- **TDD**: consta el rojo con mensaje literal para P1, P2 y las cinco de P3 (`apply-progress.md` §1), el rojo intermedio de P5 (§2) y la declaración de caracterización de P4-P8 (rotuladas así en el código y en el delta). Cambiar el aserto viejo `Remisión creada` por `Rev./Diagnostico` es coherente: el aserto viejo contradecía el requisito.

### Citas (regla de mutación 4)
Reabrí `botonRemision.ts` `:31`, `:33-35`, `:39-40`; `transitions.ts` `:164`, `:178`, `:150-151`; y las citas vivas `openspec/specs/remisiones/spec.md:185` (`:34-35` y `:22-25`), `:791` (`:33`), `:802` (`:39`) y `archive/2026-09-29-blueprint-soporte-remoto/tasks.md:304` (`transitions.ts:163-165`). Siguen diciendo lo mismo que la frase: ninguna línea de código se movió. La clasificación A/B/C es correcta: la única **C** es `Paquete_de_Despliegue_2026-10-04.md:141` (registro fechado, superado por este cambio, no se edita); el resto, **A**. La cita del delta a `transitions.ts:178` es correcta. Los deltas citan por nombre de función. **El detector de citas no lo corrí** (lo corre el orquestador tras su commit).

### Comentarios reescritos
Los tres dicen la verdad del código de hoy: `transitions.ts:154-161` (con una confirmada `botonRemision` lo esconde: cierto, `botonRemision.ts:39-40`), `botonRemision.ts:37-38` (con `null` en `Remisión creada` no se ofrece, primera guarda: cierto, `:31`) y `TransitionPanel.tsx:18-20` (idem; comprobado por lectura, el `.tsx` está fuera de la red de pruebas).

### Coherencia con el diseño
Predicado compartido como fuente única, protección en la misma línea que el predicado, guarda y servidor intactos: todo seguido. Única desviación, declarada: M2 cae en `cada origen… es un estado del registro`, `cifrasAncladas`, `mapaBlueprint` e `invariantesGrafo`, no en la P1 por estado (que recorre `ESTADOS`). Mismo efecto.

### Hallazgos

**CRITICAL**: ninguno.

**WARNING**
- **W-1 · El ticket atascado real, `Remisión creada` con sólo una remisión anulada, no se recorre por HTTP.** El origen 3 principal se siembra sin ninguna fila y la variante usa una de `salida`. La anulada (el caso que fabrica `anular`, `remision.ts:333`/`:336`) sólo la cubren el cliente (`botonRemision.test.ts`) y el predicado `!anuladaAt` (`remision.ts:126-128`). No hay riesgo funcional visible (el alta sólo mira remisiones previas para el `409` de pendiente, `:174-183`). Cubrible con una variante más usando `remisionDePrueba(db, 't1', { anulada: true })`.
- **W-2 · Las comprobaciones de persona siguen pendientes** (`tasks.md:146-148`) y lo que se ve en pantalla no tiene prueba automática (`.tsx` excluido por F0-00). No bloquea el archivo, pero archivar no las da por hechas.

**SUGGESTION**
- **S-1 ·** `transitions.test.ts` pone dos imports en una línea. Lint no se queja; cosmético.
- **S-2 ·** Si un cuarto origen de `habilitar_servicio` estuviera fuera de `ESTADOS`, sólo lo caza `cada origen… es un estado del registro`. Está cubierto; se anota para que nadie la borre creyendo que sobra.

### Lo no comprobado
- **H-A** (ver el botón en pantalla sobre un ticket real en `Remisión creada` sin entrada, y que no parpadea al cargar), **H-B** (recuento en producción de tickets en `Remisión creada` sin entrada vigente) y **H-C** (Gerencia decide H-1): pendientes, no se dan por hechas.
- Detector de citas (`apps/desk/server/citas/cli.ts --sha HEAD`): lo corre el orquestador.
- Pruebas de `.tsx`: no existen por decisión de Gerencia (F0-00); `TransitionPanel.tsx` sólo se leyó.
- M1b, M1c, M2, M3b y M3c: no repetidas por mí; constan en `apply-progress.md` §3 con mensaje literal.
- La medida del intento de apply (347 líneas) se toma de `apply-progress.md`, no se remidió. Cobertura: no medida.

### Verdict
**PASS WITH WARNINGS**: los diez criterios y los 24 escenarios están cubiertos por pruebas que corrieron en verde (2.990 pasan y 2 omitidas, typecheck y lint con salida 0), las dos mutaciones reproducidas caen y el árbol queda limpio; sólo quedan una variante sugerida (anulada por HTTP) y las comprobaciones de persona.

### Remediación tras el verify (orquestador, 2026-10-04)

- **W-1 cerrado.** Se añadió a `apps/desk/server/remisionCreadaSinSalida.test.ts` la variante que faltaba: un ticket en `Remisión creada` cuya única remisión de entrada está anulada recorre `422` → alta `201` → `habilitar_servicio` `200`. Es caracterización (nace verde). El fichero pasa a 5 pruebas y la suite a 2.991.
- **W-2 sigue abierto:** H-A, H-B y H-C son de personas y archivar no las da por hechas.
- Mutaciones M1b, M1c, M2 (origen ficticio y origen real), M3b y M3c: reproducidas por el orquestador antes de asentar el apply; todas caen.
