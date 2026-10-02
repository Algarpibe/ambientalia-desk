# Diseño: el barrido cuenta sólo lo archivado y lee el §C de la R01.4

> **Anclaje.** Toda cita a `comprobaciones.ts` de este documento se lee en `840a353` (base del worktree,
> rama `barrido-avance-archivado`), porque este cambio mueve sus líneas. Va escrita en cada cita. Una
> abreviada `:N` sin fichero en su línea es de `comprobaciones.ts`.

## Enfoque técnico

Se toca sólo la comprobación 2 (`numerador`, `apps/desk/server/reconciliacion/comprobaciones.ts:198-233` en `840a353`).
El núcleo sigue PURO: no se añade ninguna operación al puerto `Arbol` (`:38-43` en `840a353`) ni se toca
`informe.ts` ni `cli.ts`. Tres lecturas: la R01.4 para el denominador, la R01.1 para la fuente de la guarda (b)
y `config.yaml` para los cierres por commit. Las cuatro poblaciones (por archivo, por commit, en curso,
denominador) se calculan en ese orden y nunca se suman. Cubre RQ-RC-01, 05, 06, 10, 11 y 12 del delta.

## Decisiones

| # | Decisión | Elegida | Descartadas y por qué |
|---|---|---|---|
| D1 | Dónde se decide «archivado» | Predicado único sobre la ruta: `ruta.startsWith(PREFIJO_CHANGES + 'archive/')`, aplicado a la lista que ya da `proposals()` (`:122-128` en `840a353`). Se parte una sola lista en dos | (a) `listar('openspec/changes/archive/')` aparte: «en curso» necesita las dos mitades y serían dos lecturas de la misma noción (molde H5). (b) Exigir prefijo de fecha `AAAA-MM-DD-`: la convención es la carpeta, no el nombre. (c) Leer `verify-report.md` PASS: la propuesta lo deja fuera, el archivo lo presupone. (d) `includes('archive/')`: casaría `openspec/changes/no-archive/` |
| D2 | Cómo se leen los cierres por commit | `entradasYaml(config, 'cierres_declarados_por_commit')` (`:85-102` en `840a353`) + `campo()` para `commit` y `prueba`. Completa = los dos no vacíos. Para la lista plana antigua, `listaYaml` (`:61-76` en `840a353`) sobre la misma clave: todo elemento que no empiece por `id:` es defecto «sin forma de bloque». Es el mismo par que ya usa `capacidades` (`:172-173` en `840a353`) | Parser de YAML nuevo o dependencia `yaml`: segundo parser de la misma noción (H5) y dependencia nueva. Sólo `entradasYaml`: una lista plana quedaría invisible, sin defecto, contra RQ-RC-10 |
| D3 | Valores de `commit:`/`prueba:` | Escalares en UNA línea. `prueba: >` plegado lo lee `campo()` como vacío (`:108` en `840a353`) → defecto. Falla cerrado, y se dice en el comentario del bloque | Admitir bloques plegados: obliga a ampliar `campo()`, que usan las comprobaciones 4 y 5 |
| D4 | Acotar la lectura al §C | Helper `tramoDelPlan(texto, /^## C · /)`: líneas tras el encabezado hasta la primera `^---\s*$`. El separador de las tablas, que empieza por barra vertical, no casa. Sin encabezado → tramo vacío | Leer el fichero entero: el §F.3 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:210-226`) y el §E (`:173-178`) repiten IDs. Acotar por la tabla siguiente: frágil ante una tabla nueva dentro del §C |
| D5 | Patrón de ID | `^\| \*{0,2}((?:F0\|F1[A-F]\|1[GH]\|F[2-5])-\d\d)\*{0,2} \|`, sobre un `Set` | `F\d`: aceptaría `F6-`/`F9-`, que no existen. Exigir negrita simétrica: no aporta y complica |
| D6 | Guarda (b) de RQ-RC-06 | `filasDelPlan` (`:131-138` en `840a353`) se conserva **sin tocar** y se aplica a la R01.1. **Verificado:** leída entera, la última aparición gana y es la del §5 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:483-527`) para todo ID que esté ahí; las ocho F1C sólo están en la tabla de la épica 1C (`:174-181`), cuya cuarta columna es el apartado del maestro. La hipótesis de la propuesta se refuta: hoy no hay pisado observable. El `maestro:` se toma de las cabeceras válidas `cierra: si` de esa tanda, archivadas o no, para que F0-02 (por commit, cabecera fuera de `archive/`) siga marcándose | (a) Acotar la R01.1 a su §5: perdería las fuentes F1C (fila colapsada `F1C-01…08`, `:509`). (b) Tomar la fuente de la R01.4: su columna 4 es la ventana (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:62`) |
| D7 | Filas sin fuente | Cerradas sin fila en la R01.1, o con fuente vacía o `—`, no se marcan (como `:214` en `840a353`) y salen en una cifra propia «sin fuente declarada en la R01.1» | Callarlas: el delta (RQ-RC-06) pide que el fichero lo diga |
| D8 | §C ausente o vacío | Hallazgo informativo que nombra el §C y la ruta; denominador «sin leer». **No** cambia el código de salida: el delta declara RQ-RC-03 intacto, y «fallar» en RQ-RC-12 se lee como «decirlo», no como salida ≠ 0 | Lanzar excepción: rompe RQ-RC-03. Caer a la R01.1: es justo lo que RQ-RC-12 prohíbe |
| D9 | Fecha y commit del denominador | Los de la cabecera del informe (D7 de F0-05): la línea dice «del §C de la R01.4» y la cabecera, contra qué commit | Leer el commit del plan con git: nueva operación en `Arbol`, núcleo menos puro |
| D10 | Hallazgo «sin declarar» de `:218-220` en `840a353` | Se retira: RQ-RC-10 pide «0 por commit» sin defecto si la clave falta. La guarda de que la clave exista y tenga tres pasa a `registro.test.ts`, sobre el fichero real | Conservarlo: contradice el delta |
| D11 | Dónde se inserta código | Constantes nuevas tras la línea 54 y helpers nuevos tras `sinTrackear` (línea 345), las dos en `840a353`; `numerador` se reescribe en su sitio. `:46` sigue siendo `RUTA_PLAN`, ahora a la R01.4; `:49` no se mueve | Poner todo al final del fichero para no mover nada: `numerador` crece igual y desplaza `:257`. Se asume el desplazamiento y se barre al cierre |

## Flujo de datos (comprobación 2)

    R01.4 ─ tramoDelPlan(§C) ─ patrón D5 ─────────────► idsC (Set) ── denominador
    R01.1 ─ filasDelPlan (sin cambios) ───────────────► fuentes ───┐
    proposals() ─ comprobarCabeceras ─ válidas                     │
       ├─ archivada ∧ cierra si ∧ tanda ∈ idsC ──────► porArchivo ─┼─ guarda (b)
       └─ (no archivada ∨ cierra ≠ si) ∧ tanda ∈ idsC ┐            │
    config ─ entradasYaml + listaYaml ─ completas ───► porCommit ──┘
                                     └─ incompletas ► defectos (no cuentan)
    enCurso = candidatas − porArchivo − porCommit      (después de filtrar defectos)
    dobles  = porArchivo ∩ porCommit                   (hallazgo, nunca suma)

`fuera-del-plan` y tanda vacía se excluyen antes de todo, como hoy (`:206` en `840a353`).

## Contrato publicado (§2 de `docs/sdd/RECONCILIACION.md`)

Título: «Numerador del avance (§C de la R01.4) — cifras separadas, nunca una suma». Cifras, en este orden:
`N cerradas por archivo: …` · `N cerradas por commit declarado: …` · `N en curso, aparte y sin sumar: …` ·
`denominador: 78 tandas del §C de la R01.4` · `N cerradas sin fuente declarada en la R01.1: …` ·
`N marcadas sin verificar`. Ninguna línea de total. Hallazgos: «sin verificar», defectos de registro (id y
campo que falta), tandas en las dos poblaciones, §C ausente. Esperado en el árbol real: **10 / 3 / 6 / 78**,
código 0. Los «sin verificar» se miden al correrlo. `informe.ts` no cambia: su `cifra()` corta en el primer `: `.

## Bloque YAML que se añade AL FINAL de `openspec/config.yaml`

Commits comprobados en el registro de referencias del repositorio principal (`.git/logs/HEAD`): `3d44e1e`
«feat(sdd): inicializar contexto SDD, CLAUDE.md y el maestro citable»; `fa445ac` «docs(specs): specs as-built
de remisiones, derivacion-avisos y zoho-sync»; su hijo directo `749d205` «dos entradas mas en zoho-sync»;
`3aaa0f1` «docs(sdd): cerrar F0-03 con la carga en Engram y la convencion de topic_key». Las tres pruebas
dicen lo que se les atribuye (leídas en el árbol del worktree).

```yaml
cierres_declarados_por_commit:
  # Tandas terminadas ANTES de la convención de `openspec/changes/archive/`. Cuentan en la cifra «por
  # commit declarado» y nunca en «por archivo» (decision/orden-ejecucion-encargo-01-10, punto (a)).
  # Cada entrada lleva `commit:` y `prueba:` en UNA línea: si falta alguno, o va vacío o plegado, la
  # comprobación 2 la da por DEFECTO DE REGISTRO y no la cuenta (molde de RQ-RC-08). Va al final del
  # fichero para no desplazar líneas citadas. La crea `barrido-avance-archivado`.
  - id: F0-01
    commit: 3d44e1e
    asunto: "feat(sdd): inicializar contexto SDD, CLAUDE.md y el maestro citable"
    prueba: "docs/sdd/Estado_As-Built_2026-09-09.md:20"
    declarado_por: "decision/orden-ejecucion-encargo-01-10, punto (a)"
  - id: F0-02
    commit: fa445ac
    asunto: "docs(specs): specs as-built de remisiones, derivacion-avisos y zoho-sync"
    nota: "749d205 añade después dos entradas a zoho-sync; no cambia el número de specs"
    prueba: "openspec/changes/F0-03/proposal.md:21 · docs/sdd/Estado_As-Built_2026-09-09.md:21"
    declarado_por: "decision/orden-ejecucion-encargo-01-10, punto (a)"
  - id: F0-03
    commit: 3aaa0f1
    asunto: "docs(sdd): cerrar F0-03 con la carga en Engram y la convencion de topic_key"
    prueba: "docs/sdd/Estado_As-Built_2026-09-09.md:22"
    declarado_por: "decision/orden-ejecucion-encargo-01-10, punto (a)"
```

## Cambios por fichero

| Fichero | Acción |
|---|---|
| `apps/desk/server/reconciliacion/comprobaciones.ts` | `:46` → R01.4; constantes `RUTA_PLAN_FUENTES` (R01.1) y `PREFIJO_ARCHIVO`; `numerador` reescrito; helpers `tramoDelPlan`, `tandasDelPlan`, `cierresPorCommit` |
| `apps/desk/server/reconciliacion/comprobaciones.test.ts` | Pruebas nuevas en rojo; el fixture de `apps/desk/server/reconciliacion/comprobaciones.test.ts:145-156` en `840a353` pasa a `archive/` y gana una R01.4 sintética; las aserciones de `:175-179` cambian de etiqueta |
| `apps/desk/server/reconciliacion/registro.test.ts` | Pruebas sobre el `config.yaml` y la R01.4 REALES, con su control del otro signo |
| `openspec/config.yaml` | Bloque de arriba al final + anclas del barrido |
| `docs/sdd/RECONCILIACION.md` | Regenerado con `npm run reconcile` |
| R01.4, `docs/sdd/Parte_2026-09-21.md`, `proposal.md` | Sólo anclas del barrido de citas, en la misma línea física |

## Pruebas (strict TDD: cada una en rojo antes de su código)

| Prueba | Discrimina contra |
|---|---|
| `cierra: si` fuera de `archive/` → «en curso», no «por archivo»; la misma, archivada → «por archivo» | D1 ausente (hoy) |
| `openspec/changes/no-archive/proposal.md` `cierra: si` no cuenta por archivo | D1 mutado a `includes` |
| Bloque sin `prueba:`, con `commit: ""`, con `prueba: >`, y lista plana `- F0-01` → defecto con id y campo, no cuentan | D2/D3 |
| `**F1A-10**`, `1G-01`, `1H-00`, `F2-01`, `F4-01` cuentan; `F6-01`, `F1-01`, `F1G-01` no | D5 ensanchado o estrechado |
| Archivada `cierra: si` + otra `cierra: no` de la misma tanda → sólo «por archivo» | resta de `porArchivo` |
| Tanda en las dos poblaciones → hallazgo con las dos fuentes | disjunción |
| Tanda nueva sólo en la R01.4 cerrada → no «sin verificar», sí «sin fuente» | D6/D7 |
| La R01.4 con `M9.9` en su columna 4 no se toma como fuente | D6 (b) |

**Regla de mutación 1 (posición).** (P1) F0-01 por commit **y** con cabecera `cierra: si` fuera de `archive/`
→ no está «en curso»: mover la resta de `porCommit` antes de calcularla, o quitarla, la pone roja. (P2) Bloque
incompleto de F1B-09 **y** proposal suyo fuera de `archive/` → F1B-09 sigue «en curso» y no cuenta por
commit: restar antes de filtrar los defectos lo pone rojo. Cada una activa las dos guardas a la vez.

**Regla de mutación 2 (ensuciar lo vigilado), en `registro.test.ts` sobre ficheros reales.** `config.yaml`
real → 3 por commit, 0 defectos; copia sin la línea `prueba:` de F0-02 → 2 y un defecto que nombra
`F0-02`/`prueba`. R01.4 real → 78; copia con una fila de ID **nuevo** (`| F2-09 |`) tras el `---` que cierra
el §C → sigue 78; la misma fila dentro del §C → 79; copia con `## C ·` renombrado → hallazgo del §C, no 78.
El ID tiene que ser nuevo: con un `Set`, repetir `F1B-03` fuera del §C no movería la cuenta ni sin acotar.

## Barrido de citas al cierre (regla de mutación 4)

`grep -rnoE "comprobaciones\.ts:[0-9]+(-[0-9]+)?"` fuera de `archive/` (excluido del detector,
`apps/desk/server/citas/cli.ts:49`) da hoy cinco sitios, y todos pasan a llevar `en 840a353` en su misma
línea física, editada en sitio:
- `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:294` — cita las líneas 46 y 133; caso C: añadir que lo cierra este cambio.
- `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:175` — cita la línea 257; medición fechada, caso B.
- `openspec/config.yaml:3339` — cita las líneas 49 y 124; caso C.
- `docs/sdd/Parte_2026-09-21.md:35` — cita las líneas 203 a 207; caso B.
- Las citas de `proposal.md` de este cambio; caso B.

Segundo pase: abreviadas en esos ficheros y las tres citas nuevas del bloque YAML, leyendo qué afirman.
En `openspec/config.yaml` no se inserta nada salvo al final.

## Estimación (techo 800 por intento; medida = `git diff --shortstat --no-renames 840a353` + sin trackear)

| Intento | Líneas | Detalle |
|---|---|---|
| apply | ≈540 | código +120/−30 · `comprobaciones.test.ts` +190/−15 · `registro.test.ts` +60 · YAML +27 · informe ±20 · anclas ±20 · `apply-progress` ≈50. Si pasa de 800, lote 2 = YAML + `registro.test.ts` + informe + barrido |
| verify | ≈300-360 | precedente: 358 |
| archive | ≈2.600 | carpeta ≈1.100 × 2 (sin renombrado) + fusión (se mide en worktree) + `archive-report` ≈150. **Pide techo a Gerencia (≈3.000)**, con la condición de los precedentes: la parte revisable se mide antes |

## Matriz de amenazas

N/A: sin enrutado, subprocesos, shell ni automatización de VCS. `cli.ts` y su lectura de git no cambian.

## Preguntas abiertas (no bloquean; supuestos reversibles aplicados)

- Una tanda archivada `cierra: si` sin fila en el §C no cuenta (RQ-RC-05 lo exige), pero una por commit sí
  (RQ-RC-10, «si y sólo si»). Hoy no hay ningún caso; asimetría heredada del delta.
- RQ-RC-05 conserva «publicar con el motivo `por trabajo`/`por dictamen`», que el barrido no imprime ni antes
  ni después: lo publica el parte. No se amplía aquí.
