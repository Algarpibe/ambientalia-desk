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

**El precedente sí lo hizo bien, y la evidencia es un `diff` vacío.** Los dos requisitos
`MODIFIED` del delta archivado de `detector-citas-extremos`
(`openspec/changes/archive/2026-09-16-detector-citas-extremos/specs/citas-verificables/spec.md:20-248`
y `:250-319`) son **byte a byte idénticos** a `openspec/specs/citas-verificables/spec.md:204-432` y
`:470-539` — `diff` sin salida en los dos. Aquella fusión no perdió nada; ésta sí habría perdido.

**La reparación, en `8e1ea3a`:** el bloque pasa de 33 a **56 líneas** y el delta de 168 a **191**
(`+28/-5`). **Cero obligación nueva, contado y no leído**: 7 `**MUST**` + 1 `**MUST NOT**`, los
mismos exactamente que el delta que validó el `verify` (el bloque vivo tenía 5 + 1; los dos de
diferencia ya los había añadido esta tanda y el verify ya los validó). Lo reinsertado es texto
descriptivo y escenarios **ya vivos y ya cubiertos por la suite**. La comprobación de que no se
perdía nada fueron **22 aserciones mecánicas** sobre cadenas únicas del bloque vivo —la lista de
extensiones, la justificación de `git grep -I`, la procedencia de 2026-09-13, las cabeceras y los
cuerpos de los dos escenarios—: **22 OK, 0 perdidas**, y en el `diff` de los dos bloques aparecen
como líneas de contexto, ni borradas ni insertadas.

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

## 4 · SUGGESTION-1: `docs/sdd/RECONCILIACION.md` va por detrás del HEAD

**Medido contra el fichero, no citado del verify.** La cabecera de `docs/sdd/RECONCILIACION.md` en
este árbol dice `Commit medido: b03282b`, y `git rev-list --count b03282b..HEAD` da **4**: los dos
commits previos a este archive (`0f500de`, `8e1ea3a`) y los dos del archive (`ad0db11`, `bd2122f`).

*La cifra de segunda mano habría sido otra, y por eso se remide.* El `verify-report` describía el
fichero con cabecera `0e4049f` y «seis commits detrás», y **él mismo se corrigió**: su nota de
procedencia (`openspec/changes/archive/2026-09-20-F0-05/verify-report.md:189`) registra que donde
decía «seis commits detrás» eran ocho. Ninguna de las dos es cierta hoy, porque `0f500de` regeneró
el fichero después. Repetir «seis» habría sido una cita de segunda mano presentada como medida.

**El fichero no puede nombrar su propio commit**, así que el mínimo alcanzable es **UN commit de
retraso, no cero**. Ese uno es el suelo estructural; los otros tres son retraso real y se cierran
con una regeneración. **Este archive no lo regenera**: queda fuera de su alcance y se anota como
pendiente sin dueño asignado.

**Y este archive resuelve una divergencia que el propio mecanismo venía reportando:** `npm run
reconcile` comparaba `capabilities` contra las specs en disco y veía `reconciliacion` declarada
(`openspec/config.yaml:254`) sin spec. Al crear `openspec/specs/reconciliacion/spec.md` la
divergencia desaparece, así que la próxima regeneración la verá cerrada.

---

## 5 · El detector: archivar SILENCIA citas, no las repara

`openspec/changes/archive/` es una **exclusión** del barrido, declarada en `RQ-CV-07`
(`openspec/specs/citas-verificables/spec.md:434`). El «cero bloqueantes» de después del archive
**no** dice que las citas de la carpeta archivada hayan quedado verificadas: dice que **han dejado
de mirarse**.

**Y se puede medir, así que se mide.** Detector en modo hook, misma rama, mismo procedimiento:

| | sobre `8e1ea3a` (antes) | sobre `bd2122f` (después) |
|---|---|---|
| comprobadas | 2.194 | **2.079** |
| saltadas | 2.514 | 2.400 |
| abreviadas rotas | 16 | 16 |
| cabeceras R-1 inválidas | 0 | 0 |
| salida | 0 | **0** |

**115 citas dejaron de comprobarse** al entrar los ocho ficheros de la carpeta en `archive/`. No es
un defecto —es `RQ-CV-07` funcionando— pero el cero de después vale menos que el de antes, y quien
lea sólo el cero no lo sabría.

---

## 6 · La historia del ciclo: dos rebanadas, un rescope y un objetivo agotado

No fue recta. Leído del ledger (`gentle-ai sdd-attempt status --change F0-05`), no de memoria:

| Ord. | Gen. | Unidad de trabajo | Desenlace | Líneas |
|---|---|---|---|---|
| 1 | 1 | R1 el contrato | `interrupted` | 0 |
| 2 | 2 | R1 el contrato | `passed` | 753 |
| 3 | 3 | R2 la reconciliación | `interrupted` | 44 |
| 4 | 3 | R2 la reconciliación | `passed` | 459 |
| 5 | 4 | R2 Fase 1 entrega B | `passed` | 439 |
| 6 | 5 | R2 Fase 2 | `passed` | 423 |
| 7 | 6 | R2 Fase 3 | `passed` | 310 |
| 8 | 7 | F0-05 verify | `passed` | 200 |
| 9 | 8 | F0-05 archive | este intento | — |

Tres cosas que la tabla enseña y que una lista de ocho no:

- **El intento 1 se cerró `interrupted` con 0 líneas y necesitó un `reset` de mantenedor.** Su
  diagnóstico: los artefactos de planificación estaban sin trackear y no formaban parte del
  `begin_candidate_tree`, así que commitearlos habría contado como líneas de R1. Se commitearon
  antes de reabrir.
- **La generación 3 AGOTÓ su objetivo**: consumió sus dos intentos (`3` interrumpido, `4` pasado)
  contra el mismo `objective_id`. Es el único objetivo de la tanda que llegó al límite.
- **El rescope está en el paso de generación 3 a 4**: «R2 la reconciliación» entera se partió en
  «R2 Fase 1 entrega B», «Fase 2» y «Fase 3» — tres objetivos nuevos en vez de uno.

`lifetime_attempts: 8` y `lifetime_changed_lines: 2.628` antes de este archive.
`openspec/changes/archive/2026-09-20-F0-05/apply-progress.md` lo cuenta entero.

---

## 7 · Fusión de deltas y confirmaciones técnicas

### Resumen de cambios

**Spec `citas-verificables`**: 918 → 1.042 líneas. `RQ-CV-10` sustituido por el bloque completo,
`RQ-CV-19` y `RQ-CV-20` añadidos al final.
- 142 inserciones / 18 borrados = **160 líneas de ledger**. El fichero crece **124** netas.

**Spec `reconciliacion` (nueva)**: 0 → 291 líneas, copia 1:1 del delta, verificada blob a blob.
- 291 inserciones.

**Las dos juntas, commit `ad0db11`**: **433 inserciones / 18 borrados = 451 líneas de ledger.**

### Comprobaciones

**Lo medido EN ESTE ARCHIVE:**

- ✓ **Detector en modo hook sobre `bd2122f`**: salida **0**, cero bloqueantes, **0 cabeceras R-1
  inválidas**.
- ✓ **Fusión byte a byte**: la spec fusionada es idéntica a la fusión simulada y validada antes de
  archivar; `reconciliacion` es idéntica blob a blob a su delta.
- ✓ **Árbol limpio**: `git status --porcelain --untracked-files=all` vacío tras los dos commits.

**Heredado del `verify-report`, medido sobre `b03282b` y NO vuelto a correr aquí** —los commits
posteriores tocan sólo documentación y specs, ningún fichero de código—:

- `npm test`: 1.178 pasadas, 0 rojas, 2 saltadas, salida 0.
- `npm run typecheck`: 0 errores. `npm run lint`: 0 errores, 158 avisos preexistentes.
- `npm run build`: salida 0. Cobertura 94,06 / 84,32 / 97,41 / 94,06 contra 92 / 78 / 96 / 92.

Se separa a propósito: presentar cifras heredadas como recién medidas es exactamente la cita de
segunda mano que la regla de método del proyecto prohíbe.

### Regla de mutación 4: el barrido, con su cifra

La fusión inserta 142 líneas **en mitad** de un fichero citable, así que toda cita a
`citas-verificables/spec.md:NNN` por encima de la 594 se desplaza. Barrido hecho:

- El barrido de `citas-verificables/spec.md:NNN` sobre el árbol da **8** resultados; **6 están
  dentro de `openspec/changes/archive/`** y **2 fuera**.
- Las **dos** vivas están dentro de la propia spec fusionada (`:1008` y `:1016`, en el texto de
  `RQ-CV-20`) y las dos van **ancladas a `ce93480`**. Comprobadas contra esa revisión:
  `ce93480:434` es `RQ-CV-07` y `ce93480:540` es `RQ-CV-09`. Correctas.
- **Caso B de la regla de mutación 4: no se renumeran.** Llevan su revisión escrita y renumerarlas
  al árbol de hoy las volvería falsas.

---

## 8 · Lo que NO cierra esta tanda

- **Puntos abiertos de Gerencia**: las **ocho** decisiones de la tabla del §10 del design
  (`openspec/changes/archive/2026-09-20-F0-05/design.md:422-482`) esperan respuesta textual en
  `openspec/config.yaml` bajo la clave `decisiones_de_gerencia` (`openspec/config.yaml:1285`). Ni
  el design ni el apply las resuelven: las redacta Gerencia.
- **Rotación de secretos**: tres casillas fuera del recuento por la regla del ciclo 1 (dueño
  Gerencia, gestor de secretos del despliegue, no el repositorio).
- **WARNING-1**, el §1 de este informe: el adaptador real de `reconciliacion/cli.ts` sigue sin
  prueba automatizada. No bloquea y no tiene destino asignado.
- **SUGGESTION-2 del verify**: dos de los tres escenarios de `RQ-CV-20` —la precondición previa a
  instalar, y la cabecera en los dos árboles— se sostienen por orden de tareas y por inspección de
  commits, no por una aserción unitaria dedicada.
- **La regeneración de `docs/sdd/RECONCILIACION.md`**, el §4: cuatro commits de retraso, de los que
  uno es suelo estructural. Sin dueño asignado.

---

## 9 · Anexo H: la corrección se ENTREGA COMO TEXTO, y ya está entregada

`openspec/config.yaml:1524` pide «Actualizar el Anexo H del documento maestro (as-built frente a
plan) al archivar». **El maestro es un `.docx` y no se edita desde el repositorio**, así que la
corrección se entrega como texto para que Gerencia la pegue.

**Entregada** como **entrada 15** de `docs/sdd/F0-01_Correcciones_para_el_maestro.md`, que es el
canal único hacia el maestro. Va a **H.1 «Cómo se lee y cómo se mantiene»**
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.2.md:4620-4628`), porque lo
que F0-05 cambia no es un flujo, ni una corrección, ni un módulo, ni un indicador: es **la cadencia
del propio anexo**, que `:4627` describe como enteramente manual.

**La cifra que la entrada lleva, medida y no estimada:** `openspec/config.yaml` declara **18
capacidades**; con spec en disco había **9** antes de este archive y hay **10** después. No son 18
de 18, y el propio design ya lo tenía escrito: la fila 8 de su §10 dice «18 capacidades · 9 specs ·
10 tras archivar».
