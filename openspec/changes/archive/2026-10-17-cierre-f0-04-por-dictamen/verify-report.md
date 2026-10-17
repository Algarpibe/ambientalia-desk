# Informe de verify: cierre de F0-04 por dictamen

Cambio documental (`tanda: F0-04`, `cierra: si`). HEAD `1bac53e`, base `badce5a`. Worktree
`C:\dev\Desk_2_R1.023-worktrees\cierre-f0-04-por-dictamen`.

**Veredicto: PASS** — 0 CRITICAL, 1 WARNING, 2 SUGGESTION.

**Strict TDD:** las tareas 1 y 2 no tienen tareas de código, así que no hay evidencia TDD que aportar. La única
edición de prueba (`registro.test.ts:218-221`, rojo esperado en `:220`) es de la fase archive (3.3-3.4) y NO está hecha.

## Códigos de salida (cada uno por separado)

| Comando | Código | Detalle |
|---|---|---|
| `npm test` | 0 | 282 ficheros pasan, 3 saltados; 4769 pruebas pasan, 11 saltadas |
| `npm run typecheck` | 0 | |
| `npm run lint` | 0 | 0 errores, 165 avisos (tope 165) |
| `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` | 0 | línea base 0; cabeceras R-1 inválidas 0; 13 abreviadas rotas informativas, ninguna de este cambio |

## 1. Tarea 2.1 — citas de `proposal.md`

| Cita | Dice | ¿Cierto? |
|---|---|---|
| `openspec/config.yaml:1686` | `- clave: "decision/e013b-copia-pruebas"` | Sí |
| `config.yaml:1693-1695` | «No la montamos… F0-04 se da por cerrada con esa pieza retirada y con la fecha de la decisión, y el avance recupera 1…» (extremos 1693 y 1695 correctos) | Sí |
| `config.yaml:1697-1700` | consecuencia (1): pieza retirada tachada y fechada, con `R01.1.md:128` (extremos correctos) | Sí |
| `config.yaml:1701-1704` | consecuencia (2): `F0-04/proposal.md:6` dice `cierra: no`; «hasta que una sesión de construcción lo cambie citando esta decisión, `npm run reconcile` no contará F0-04 por cabecera» (1701 a 1704) | Sí |
| `F0-04/proposal.md:6` | `cierra: no` | Sí |
| `F0-04/proposal.md:16` | fila «Estado»: «dos de los tres contenidos de su fila están verificados; falta constancia de staging» | Sí |
| `R01.4.md:68` | «F0-04 \| Pruebas del motor y CI (staging retirado)» | Sí |
| `R01.1.md:128` | fila F0-04 con tres contenidos; staging tachado y «RETIRADA por Gerencia el 21/09» | Sí |
| `R08.4.md:3503` | «[DECIDIDO 17/09 y 21/09] … La tanda F0-04 se dio por cerrada el 21/09 con esa pieza retirada» (M11.5) | Sí |
| `permisos.test.ts:41` | `describe('matriz área × transición, contra el servidor'` | Sí |
| `transicionesEjecucion.test.ts:188` | `describe('las 31 transiciones, ejecutadas contra el servidor'`; `:250` prueba destino y traza (`ticket_transitions`) | Sí |
| `invariantesGrafo.test.ts:62` | «Finalizado es el único estado sin transición de salida» | Sí |
| `invariantesGrafo.test.ts:177` | «sin salida en la unión es exactamente Finalizado» | Sí |
| `ci.yml:27` / `:41` / `:45` | `npm run typecheck` / `npm run lint -- --max-warnings 165` / `npm run test:coverage` (el «test» es la suite con cobertura) | Sí |
| `ci.yml:2-6` | `pull_request` y `push` a `main` | Sí |
| `comprobaciones.ts:217` | `const archivo = new Set(delPlan.filter((x) => x.archivada && x.cierra)…)` | Sí |
| `comprobaciones.ts:222-224` | `enCurso` excluye `archivo` y `commit` aunque exista otra cabecera sin archivar | Sí |
| `registro.test.ts:218-221` | prueba «OCHO, con F0-04» (aún sin corregir; es trabajo de archive) | Sí |
| `docs/sdd/RECONCILIACION.md` («cerradas por archivo» / «en curso») | secciones del informe generado | Sí |
| «quince ficheros… cinco en `openspec/config.yaml`» | ver WARNING W1 | **No reproducible con un patrón único** |

## 2. Afirmaciones

- (a) La fila sólo necesita la pieza retirada: R01.1 `:128` (tachado + «RETIRADA»), R01.1 `:487` (fila de fuentes,
  `M11.5`), R01.4 `:68` (título «staging retirado») y `:347` (nota «ejecutada y no cuenta en ninguna cifra… candidata»),
  y `F0-04/proposal.md:16` («falta constancia de staging»). Confirmado.
- (b) Los tres ficheros de prueba y el workflow existen y hacen lo dicho (tabla anterior).
- (c) Recuento con `git grep` en `badce5a` (el árbol anterior a este cambio): ver W1.
- (d) `comprobaciones.ts:217` y `:222-224` implementan «archivada + `cierra: si` → por archivo, y fuera de en curso
  aunque haya otra cabecera sin archivar». Contrastado además con la prueba sintética existente `11d`
  (`comprobaciones.test.ts:294-300`: archivada `si` y archivada `no` de la misma tanda → sólo «por archivo», no «en curso»).

## 3. Cabecera

Siete campos presentes y válidos (`tanda`, `motivo`, `capacidad`, `maestro`, `cierra`, `toca_maestro`,
`origen_cabecera`); el detector informa 0 cabeceras R-1 inválidas. `maestro: ["M11.5"]` coincide con la columna 4 de
`R01.1.md:487` (`filasDelPlan` lee `columnas[4]` con el `|` inicial: `comprobaciones.ts:136-138`), y `R08.4.md:3503`
registra el cierre de F0-04 del 21/09.

## 4. R-4

`grep -l "^tanda: F0-04" openspec/changes/archive/*/proposal.md` no devuelve nada: hoy no hay ningún cambio archivado
con `tanda: F0-04`. Archivado, éste será el único (`F0-04/proposal.md` sigue sin archivar y con `cierra: no`).

## 5. Tarea 2.2 — `git diff --name-only badce5a HEAD`

Sólo dos ficheros: `openspec/changes/cierre-f0-04-por-dictamen/proposal.md` y `…/tasks.md`. Ningún código de
producción, ni `openspec/specs/`, ni `openspec/changes/F0-04/`, ni `CLAUDE.md`, `openspec/config.yaml`,
`docs/sdd/ENTRADA.md`, `docs/sdd/F0-05_*.md`, `docs/sdd/R08.4_Expediente_de_cambios.md`. Cumple.

## Hallazgos

**CRITICAL:** ninguno.

**WARNING**

- W1 — `proposal.md:47-49` («quince ficheros… cinco de ellas en `openspec/config.yaml`») no sale con un patrón único en
  `badce5a`: ruta completa `openspec/changes/F0-04/proposal.md` → 18 ficheros y 4 apariciones en `config.yaml`
  (`:332`, `:1257`, `:1530`, `:1701`); ruta completa seguida de `:número` → 15 ficheros y 3 en `config.yaml`;
  `F0-04/proposal.md` suelto → 22 ficheros y 5 en `config.yaml`. La conclusión (hay muchas citas y varias en fichero de
  Supervisión, así que no se mueve la carpeta) no cambia, pero las cifras mezclan patrones. Corregir en la propuesta
  a «18 ficheros, 4 en `openspec/config.yaml`» (ruta completa, `badce5a`) o fechar el patrón.

**SUGGESTION**

- S1 — `proposal.md:38` llama «test» a `ci.yml:45`, que es `npm run test:coverage`; basta decirlo.
- S2 — La hipótesis «22 por archivo, 7 en curso» (tarea 3.5) debe medirse al regenerar `RECONCILIACION.md`, no darse por buena.

## Estado del árbol

`git status --short` muestra sólo este fichero. Pendientes de archive (no son defectos): tareas 3.1-3.7, incluido
el rojo esperado en `registro.test.ts:220`.

## Estado posterior al informe (orquestador)

- **W1 corregido en sitio** en el mismo commit que este informe: la propuesta dice ahora «dieciocho ficheros de `badce5a`, cuatro de ellas en `openspec/config.yaml`», el recuento de la ruta completa (`git grep -l`). **S1 corregido**: `ci.yml:45` aparece como `test:coverage`. S2 se resuelve al regenerar la reconciliación en el archive.
