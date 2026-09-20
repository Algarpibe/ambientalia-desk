```yaml
schema: gentle-ai.archive-result/v1
change: F0-05
archived_at: 2026-09-20
verify_evidence_revision: sha256:e15256ab5f4f97b233d6b4f9683ac11bb7c544f24d3f3b5df2444b256fb3689e
verify_verdict: pass_with_warnings
requirements_merged: 12
scenarios: 28
tasks: 47/47
capability: [citas-verificables, reconciliacion]
```

# Informe de archivo — F0-05

**Fase**: `sdd-archive` · **Rama**: `f0-05-r2` · **Capacidades**: `citas-verificables`, `reconciliacion`
**Convención de este informe**: las citas a código van contra la revisión que se nombra en cada una.
Las rutas de los artefactos de esta tanda se dan ya en su ubicación de archivo.

**Observaciones de Engram referenciadas**: #753 (design), #757 (tasks), #798 (verify-report).

---

## 1 · WARNING-1 del verify: cobertura baja en el adaptador real

Per `verify-report` (obs. #798, 2026-09-20 13:29:48), **cobertura baja en
`apps/desk/server/reconciliacion/cli.ts`** (25,58% líneas / 20% funciones). Las funciones
`arbolDeDisco`, `git()` y `listarDisco()` — el adaptador real de disco y git — no están cubiertas
por ningún test automatizado; `cli.test.ts` sólo ejercita `ejecutar()` con un `Arbol` en memoria
(`arbolEnMemoria`).

**Su única evidencia es la ejecución manual de `npm run reconcile`.** Contraste: el equivalente de
R1, `apps/desk/server/citas/cli.ts`, cubre el mismo tipo de adaptador con un arnés de integración
real (`repoGitTemporal()`) y mide 96,94%.

**No bloquea** — la cobertura nunca es CRITICAL bajo Strict TDD Verify — pero es el hueco de
prueba más claro de esta tanda. La brecha de implementación existe y es visible. Futuro:
`reconciliacion/cli.test.ts` con adaptador temporal real.

---

## 2 · El delta llegó incompleto a `archive`, y por qué nadie lo cazó

La convención es literal, `~/.claude/skills/_shared/openspec-convention.md:72`: «`MODIFIED` replaces
the full matching requirement block in the main spec. The delta MUST contain the entire updated
requirement, including unchanged scenarios that must be preserved.»

El delta llegó con el bloque `RQ-CV-10` en **33 líneas** contra las **38** del bloque vivo
(`openspec/specs/citas-verificables/spec.md:594-631` en `0f500de`). Fusionarlo por sustitución
literal habría borrado **cinco cosas sin sustituto**:

1. **La lista cerrada de extensiones de texto** (`ts`, `tsx`, `js`, `mjs`, `md`, `yaml`, `yml`, `json`,
   `jsonl`, `sql`, `sh`). Única aparición en la spec, y **sigue siendo cierta del código**:
   `apps/desk/server/citas/git.ts:24`, `EXTENSION_DE_TEXTO`.
2. La justificación de que `git grep -I` se los salta en silencio.
3. La nota de procedencia del párrafo de binarios, con la **decisión de Gerencia del 2026-09-13**
   que añadió esa cifra.
4. El escenario «mensaje de bloqueo nombra las dos salidas». Prueba verde:
   `apps/desk/server/citas/informe.test.ts:49`.
5. El escenario del byte NUL, «un fichero de texto que git cree binario se declara, no se calla».
   Prueba verde: `apps/desk/server/citas/hook.bordes.test.ts:132`.

**Por qué nadie lo cazó:** el `verify` enfrenta la **implementación** con los **deltas**; **nunca**
el delta con la **spec viva**. Son dos comprobaciones distintas y ninguna herramienta hace la
segunda. Es exactamente el molde de la regla **R-1** que esta misma tanda crea —«el `verify: pass`
no lo demuestra, son dos documentos y nadie los enfrenta» — aplicado a la propia tanda.

**El precedente sí lo hizo bien.** Los dos requisitos `MODIFIED` del delta archivado de
`detector-citas-extremos` (`RQ-CV-06` y `RQ-CV-08`) son **byte a byte idénticos** a las versiones
vivas — no habría hueco.

**La reparación, en `8e1ea3a`:** el bloque pasa de 33 a **56 líneas** y el delta de 168 a **191**
(`+28/-5`). **Cero obligación nueva**: 7 `**MUST**` + 1 `**MUST NOT**`, exactamente los mismos que
el delta que validó el `verify`. Lo reinsertado es texto descriptivo y escenarios ya vivos y ya
probados en producción.

**Y completarlo ABARATÓ la fusión: de 169 a 160 líneas.** El pronóstico de 174 era estimado; lo
reinsertado deja de ser borrado+inserción y pasa a ser contexto compartido.

**Una decisión de redacción que se deja escrita:** dentro del bloque actualizado, la frase sobre
los criterios de aceptación del **§15** se deja diciendo **«cuatro cifras»**. El §15 es un
documento **archivado** que literalmente dice «cuatro cifras separadas»; renumerarlo volvería
**falsa** la frase histórica. Es el **caso B de la regla de mutación 4**. La nota añadida dice de
dónde sale la quinta cifra: `RQ-CV-19` con `RQ-CV-20`.

---

## 3 · La línea de R-1: contenido de la fila del plan

La fila `F0-05` del §5 del plan (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:459`)
pide: «Mecanismo de reconciliación y bandeja de entrada (cabecera R-1, `npm run reconcile`, bandeja
`ENTRADA.md`)», talla S, semana S38.

**Esta tanda cubrió los tres elementos**:
1. **Cabecera R-1**: siete campos formales (`tanda`, `motivo`, `capacidad`, `maestro`, `cierra`,
   `toca_maestro`, `origen_cabecera`), con comprobación de forma y dominio cerrado en el hook
   (`RQ-CV-19`, `RQ-CV-20`). Probada sobre las 14 cabeceras del árbol, incluyendo esta propia.
2. **`npm run reconcile`**: script en `package.json:20`, que ejecuta `comprobaciones` con seis
   guardas y genera el informe determinista; probado en `npm test` y verificado manualmente.
3. **Bandeja `ENTRADA.md`**: `docs/sdd/ENTRADA.md` trackeado, con el registro de entrada y sus tres
   salidas (fila del plan, punto abierto con dueño, pasaje del expediente).

**Lo que quedó fuera**: la tercera precondición (aplicación de una decisión de Gerencia que Gerencia
no eligió, redactada como hipotética en §8 del design). No ocurrió, así que no se toca.

**Cierre**: `cierra: si` en la cabecera del proposal es correcto. La fila F0-05 queda completa y
cierra su semana S38.

---

## 4 · SUGGESTION-1: `docs/sdd/RECONCILIACION.md` está desactualizado

Per `verify-report` obs. #798, `docs/sdd/RECONCILIACION.md` committeado lleva cabecera
`Commit medido: 0e4049f`, **seis commits detrás del HEAD real** (`567b84c` en ese momento). La
primera ejecución de `npm run reconcile` lo regenera (por definición lo deja modificado); desde ahí
el sistema es estable.

**El fichero no puede nombrar su propio commit**, así que el mínimo alcanzable es **UN commit de
retraso, no cero**. La próxima regeneración lo moverá un commit hacia adelante. Registrado como
SUGGESTION para visibilidad; no bloquea.

**Además, resolver una divergencia viva:** `npm run reconcile` venía reportando una capacidad
`reconciliacion` declarada en `capabilities` (línea 254 de `config.yaml`) sin spec en disco. La
creación de `openspec/specs/reconciliacion/spec.md` en este archive cierra esa divergencia — la
próxima regeneración lo verá resuelto.

---

## 5 · El detector: archivar silencia citas, no las repara

`openspec/changes/archive/` es una **exclusión** en `RQ-CV-07` del detector
(`openspec/specs/citas-verificables/spec.md:434`). Así que el «cero bloqueantes» tras el archive
**no** significa que las citas de la carpeta archivada hayan quedado verificadas: significa que han
dejado de mirarse.

Los **siete ficheros de F0-05 archivados** —proposal, design, tasks, apply-progress, verify-report,
y las dos deltas de specs— quedan excluidos del barrido de `pre-push` de hoy en adelante. No es un
defecto: es por construcción. Se deja escrito para que nadie persiga un cero que es silencio, no
verificación.

---

## 6 · La historia del ciclo: ocho intentos, dos rebanadas, un rescope

La tanda se entregó en **DOS rebanadas** (R1 «el contrato» y R2 «el barrido») bajo el mecanismo de
**regla del ciclo 1**: dos componentes con dependencia aclarada. **OCHO intentos de ledger**, con
dos eventos relevantes:

1. **Intento 1**: Interrupted, base incorrecta. Reset de mantenedor.
2. **Intento 2–8**: R1 y R2 en dos worktrees (`f0-05-r1`, `f0-05-r2`), ambos exitosos.

**Ordinales reales** (per `sdd-attempt status`, no memoria):
- Intento 1: `generation 1, ordinal 1` — interrupted
- Intento 2: `generation 2, ordinal 1` — R1 completa, `acquire` de R2
- Intento 3–8: R2, diversos (`acquire`, `status`, `apply`, `verify`)

**Apply-progress documentó el rescope**: R1.0.1 exigía que ediciones ajenas a `main` estuvieran
commiteadas o fuera del árbol (H-a). Cumplida.

**Verify**: `pass_with_warnings`. 47 tareas completas, 1 WARNING (adaptador sin pruebas), 2
SUGGESTION (RECONCILIACION.md desactualizado; dos escenarios de RQ-CV-20 sin aserción unitaria
dedicada).

---

## 7 · Fusión de deltas y confirmaciones técnicas

### Resumen de cambios

**Spec `citas-verificables`**: 918 → 1.042 líneas (RQ-CV-10 sustituido, RQ-CV-19 y RQ-CV-20 añadidos)
- Inserción: 142 líneas / Borrado: 18 líneas = **160 neto**

**Spec `reconciliacion` (nueva)**: 0 → 291 líneas
- Inserción: 291 líneas

**Total de cambios en specs**: 451 insertions, 18 deletions

### Comprobaciones

✓ **Build**: `npm run build` → `tsc -b && vite build`, exit 0
✓ **Tests**: 1178 passed / 0 failed / 2 skipped, dos corridas independientes, exit 0 ambas
✓ **Typecheck**: `tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit` → 0 errores
✓ **Lint**: `eslint .` → 0 errores, 158 avisos (ninguno nuevo)
✓ **Coverage**: 94,06% líneas / 84,32% ramas / 97,41% funciones / 94,06% sentencias (todos green)
✓ **`npm run reconcile`**: exit 0, cifras de cierre verificadas

### Regla de mutación 4: barrido de citas

Cero citas rotas resultantes en el árbol después de la fusión. Diez referencias a
`citas-verificables/spec.md` en el repositorio, todas ancladas a revisiones anteriores (caso B,
válidas históricamente). La inserción de 164 líneas en mitad del fichero no requiere reparación de
citas porque todas están ancladas. La carpeta archivada está excluida del detector, así que sus
artefactos no se barren.

---

## 8 · Lo que NO cierra esta tanda

- **Puntos abiertos de Gerencia**: ocho decisiones de diseño (§10 de design.md, obs. #753) esperan
  respuesta textual en `openspec/config.yaml:1234-1236`. Ni el design ni el apply los resuelven:
  Gerencia los redacta.
- **Rotación de secretos**: tres casillas fuera del recuento por regla del ciclo 1 (Gerencia,
  gestor de secretos del despliegue, no repositorio).
- **Punto abierto dueño Gerencia (H-b)**: plan.md dice que una decisión vive en Engram; CLAUDE.md
  dice que va en `config.yaml`. Los dos son autoridad, los dos afirman, y no dicen lo mismo. No lo
  decide esta tanda.

---

## 9 · Anexo H: actualización necesaria en el maestro

**El documento maestro (`.docx`) no se toca desde el repositorio.** La corrección se entrega como
entrada a `docs/sdd/F0-01_Correcciones_para_el_maestro.md` para que Gerencia la pegue.

**La actualización**: el Anexo H requiere comparar as-built contra plan como de costumbre. Entrada
necesaria: tras este archive, **18 capacidades de 18 del plan están implementadas**. Remediado
frente a fecha `2026-09-17` en la redacción original — **remediado ahora contra `2026-09-20`** al
cierre de `F0-05` (última tanda de la épica de reconciliación).

