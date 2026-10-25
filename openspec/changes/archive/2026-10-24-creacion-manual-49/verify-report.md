# Informe de verificación: creacion-manual-49 (F1F-05, `cierra: no`)

Verificador independiente, 2026-10-24. Árbol: rama `creacion-manual-49`, HEAD `9572518b`, base `186c2fe4`.

## Veredicto: PASS con avisos

Cero CRÍTICOS, un AVISO (cita presente de `proposal.md` que describe el fixture viejo, ya cubierta por la tarea A.1) y una
SUGERENCIA. El diff de `apps/` y `packages/` es exactamente el contrato; las dos pruebas pasan; la mutación M1 las tumba.

## Criterios de éxito de `proposal.md`

| Criterio | Resultado | Evidencia |
|---|---|---|
| RQ-KP-38 y RQ-KP-42 dicen 8 en el 49, citan la decisión y conservan sus líneas | Cumplido en el delta; la spec viva se fusiona en el archivo | Delta: RQ-KP-38 `specs/kpis/spec.md:15-40` (26 líneas) frente a `openspec/specs/kpis/spec.md:1607-1632` (26); RQ-KP-42 `:42-76` (35) frente a `:1774-1808` (35). «49 → 8» en `:20`, «49 (8, …)» en `:49` y «8 en el 49» en el segundo escenario, `:61`. Cinco escenarios en RQ-KP-42 y cuatro en RQ-KP-38, como en la viva |
| Fixture separa `fechaCreacionTicket` de `creado`, siete celdas, rojo previo | Cumplido | `apps/desk/server/testing/septiembre2026.ts:11`, `:19`, `:22-49`; el rojo (11 de 33) lo documenta `apply-progress.md` |
| Sembrar `t.creado` en `fecha_creacion_ticket` tumba el 49 de 940 y 941 | Cumplido, repetido por mí (M1) | Ver V.1 |
| Sin cambio en `packages/`; cadena en verde; barrido limpio | Cumplido (el `npm test` completo lo corre el orquestador) | V.2 y V.3 |

## V.1 Contraste del diff con el contrato

`git diff 186c2fe4 9572518b -- apps packages`: tres ficheros, 23 inserciones y 23 borrados, sin líneas añadidas ni quitadas netas.

- `fechaCreacionTicket` cambia sólo en 940 (`'2026-05-20'`), 941 (`'2026-05-21'`), 957 (`null`) y 972 (`null`) dentro de `:22-49`.
  En los otros nueve es igual a `creado`, comprobado fila a fila en el diff.
- El 49 cambia sólo en 940 (15 a 6), 941 (15 a 5) y 972 (2 a `null`): tres de las siete celdas; las otras cuatro son las fechas.
- `:60`: el 9.º valor es `t.fechaCreacionTicket`; el 5.º sigue siendo `` `${t.creado}T17:00:00Z` ``, así que `created_time` no cambia.
- Las dos pruebas: `indicadoresSeptiembre.test.ts:43` y `indicadoresComparacionSeptiembre.test.ts:23` pasan el 49 de 9 a 8, y nada más.
- Recalculo con lunes a viernes de `(desde, hasta]` hasta el 28/05/2026, que es la cuenta de
  `diasLunesAViernesFormulaZoho` (`packages/shared/src/indicadores.ts:160-162`) usada en la fórmula (`:190-193`):
  desde el 07/05 salen **15**, desde el 20/05 **6** y desde el 21/05 **5**. Coincide con la propuesta.
- Pruebas: `indicadoresSeptiembre.test.ts` 11 de 11, salida 0; `indicadoresComparacionSeptiembre.test.ts` 22 de 22, salida 0.
- **M1** (`:60`, 9.º valor vuelto a `t.creado`): falla «indicador 49» en `indicadoresSeptiembre.test.ts` (1 roja, 10 verdes). Restaurado
  con copia byte a byte; `git status --porcelain` vacío tras la restauración.

## V.2 Cadena y barrido de citas

Cadena: `npm run typecheck` salida 0; `npm run lint` salida 0; detector `tsx apps/desk/server/citas/cli.ts --sha HEAD` salida 0.

Barrido `septiembre2026.ts:NN` (14 resultados), cada uno leído contra el fichero de 63 líneas:

| Cita | Clase | Comprobación |
|---|---|---|
| `kpis/spec.md:1776` (`apps/desk/server/testing/septiembre2026.ts:55-63`) | A | `:55` es `sembrarSeptiembre` y `:63` su cierre |
| Archivada `openspec/changes/archive/2026-10-24-comparacion-juzga-variante/proposal.md:97` (`apps/desk/server/testing/septiembre2026.ts:55-63`) y `specs/kpis/spec.md:199` | A | Mismo bloque |
| Archivada `openspec/changes/archive/2026-10-24-comparacion-juzga-variante/verify-report.md:61` (`apps/desk/server/testing/septiembre2026.ts:55,60`) | A | `:55` función, `:60` valores |
| Archivada `openspec/changes/archive/2026-10-24-comparacion-juzga-variante/design.md:111` (`apps/desk/server/testing/septiembre2026.ts:60`) | A para la línea; B para «siembra sep-01…» | `:60` sigue siendo la siembra; el 9.º valor cambió, lo citado es otra cosa |
| Archivada `openspec/changes/archive/2026-10-23-poblacion-cierre-variante-47-51/verify-report.md:75` (`apps/desk/server/testing/septiembre2026.ts:22-49`) | A | `:22` abre el array y `:49` lo cierra |
| `apply-progress.md:15` (`:11`), `:36` (`:60`), `:61` (`:55-63`) | A | Correctas |
| `design.md:13` (`:60`) | A | Va anclada «en `186c2fe4`» |
| `specs/kpis/spec.md:44` (`:55-63`) del delta | A | Correcta |
| `tasks.md:16` (`:60`) | A | Describe el cambio de siembra, cierto hoy |
| `tasks.md:31` (`:60`) | A | Es la tarea A.1 sobre el aviso de abajo |
| `proposal.md:26` (`:60`, «`t.creado` en `created_time` y en `fecha_creacion_ticket`») | B sin ancla, ver AVISO | `:60` ya no pone `t.creado` en `fecha_creacion_ticket` |

Rotas: ninguna. Abreviadas: en `proposal.md` (`:11`, `:19`, `:22-49`, `:3-8`, `:52-53`) las líneas citadas existen y dicen lo
que la frase afirma; en la spec viva, `:1612`, `:1781` y `:1793` siguen conteniendo «49 → 9», «49 (9)» y «9 en el 49», lo esperado
hasta que el archivo fusione el delta. Las archivadas que dicen «49 → 9» o describen `t.creado` son caso B y no se tocan.

## V.3 Regla invariable 13

`git diff --stat 186c2fe4 9572518b -- apps/desk/src packages` sale **vacío**: no hay decisión de cliente que enfrentar con el
servidor; el cambio es sólo de fixture y de pruebas, y la aplicación ya lee el campo manual (`packages/shared/src/indicadores.ts:190-193`).

Supuestos de `proposal.md`: S-1 respetado (el segundo escenario de RQ-KP-42 pasa a 8 en el delta); S-2 respetado (26 y 35 líneas);
S-3 respetado (`fechaCreacionTicket` tras `creado` en `:11`, `:19` y en cada ticket, `null` en 957 y 972, `created_time` desde `creado`);
S-4 respetado (23 inserciones y 23 borrados, sin desplazar líneas); S-5 respetado (`indicadoresSeptiembre.test.ts:36` sin cambio).

## Hallazgos

### CRÍTICOS
Ninguno.

### AVISOS
1. `openspec/changes/archive/2026-10-24-creacion-manual-49/proposal.md:26` cita `septiembre2026.ts:60` diciendo que usa `t.creado` en `fecha_creacion_ticket`.
   Era cierto en `186c2fe4` y es falso en HEAD (caso B, sin ancla; `design.md:13` sí la lleva). La tarea A.1
   (`tasks.md:31`) ya está prevista y pendiente: anclar «en `186c2fe4`» antes de la mudanza al archivo. No bloquea.

### SUGERENCIAS
1. M1 sólo cubre 940 y 941; el 972 (49 de Gerencia `null`) no queda cazado por mutación, como la propia propuesta advierte. No requiere acción.

`npm test`: lo corre el orquestador; resultado en su registro.
