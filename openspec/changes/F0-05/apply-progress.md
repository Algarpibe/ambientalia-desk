# Apply progress — F0-05 · R1 «el contrato»

**Intento:** ordinal **2** del objetivo `generation: 2` (`acquire` `f0-05-r1-acquire-2026-09-18-c`).
**Commit de partida:** `38c9c04`, árbol `8748d870`. **Worktree:** `C:/dev/Desk_2_R1.023-worktrees/f0-05-r1`,
rama `f0-05-r1`. **Commit de R1:** `778d617`.

**Estado: R1 CERRADA — 738 líneas medidas contra un techo de 800. Ver «Cierre», al final.**

---

## Resumen ejecutivo

R1 está **implementada, probada y commiteada** en `778d617`, R1.2.4 incluida. La medición de R1.4.5
contra la base VIEJA `5cfd056` dio **2.728** líneas y paró la tanda; el `reset` a `generation: 2` movió
la base a `38c9c04` —los artefactos de F0-05 commiteados aparte, en su propio commit— y contra esa base
R1 mide **738**. Lo de abajo NO se renumera: era cierto de su base, y es el Caso B de la regla de
mutación 4.

## TDD Cycle Evidence

| Pieza | Fichero de prueba | Capa | Red de seguridad | RED | GREEN | TRIANGULA | REFACTOR |
|---|---|---|---|---|---|---|---|
| R1.1.1-1.1.3 `comprobarCabeceras` (presencia) | `citas/cabecera.test.ts` | Unit | N/A (fichero nuevo) | ✅ Escrito — `Cannot find module './cabecera'` | ✅ 6/6 tras crear `cabecera.ts` | ✅ 6 casos (bloque ausente, `motivo` vacío, `origen_cabecera` ausente, 2×dominio cerrado, control del signo) | ➖ Ya limpio |
| R1.1.4 dominio cerrado (`cierra`, `origen_cabecera`) | `citas/cabecera.test.ts` | Unit | igual | ✅ igual | ✅ igual | ✅ dos casos separados (a y b) | ➖ |
| R1.1.5 control del otro signo | `citas/cabecera.test.ts` | Unit | igual | ✅ igual | ✅ igual | ➖ único caso positivo | ➖ |
| R1.3.1/R1.3.2 alcance incluye `archive/` (D2) | `citas/cli.test.ts` | Integration (repo git sintético) | ✅ 126/126 antes de tocar `cli.ts` | ✅ Escrito — `expected ... to match /cabeceras R-1 inválidas .+ 1/` con texto sin esa cifra | ✅ tras `alcanceCabeceras`+wiring | ✅ M2 (ver mutaciones) | ➖ Ya limpio |
| R1.3.4 quinta cifra en `informe()` | `citas/informe.test.ts` | Unit | ✅ 4/4 tests previos intactos | ✅ Escrito — 3 asserts en rojo (cifra, lista, frase) | ✅ tras editar `informe.ts` | ✅ caso sin cabeceras (compat.) + caso con 2 inválidas + caso de la frase | ➖ Ya limpio |
| R1.3.5 posición (M4) | `citas/cli.test.ts` | Integration | igual | ✅ Escrito — mismo patrón, cita rota + cabecera inválida a la vez | ✅ tras wiring correcto | ✅ M4 (ver mutaciones) | ➖ |

### Test Summary
- **Tests nuevos escritos:** 14 (6 `cabecera.test.ts` + 2 `cli.test.ts` + 4 `informe.test.ts` nuevos +
  2 controles de signo incluidos en los anteriores).
- **Tests pasando (suite completa `apps/desk/server/citas/`):** 126/126.
- **Tests pasando (`npm test`, repo completo):** 1144 passed, 2 skipped (124 ficheros, 1 skipped;
  ambos skips preexistentes, no tocados por esta tanda).
- **Capas usadas:** Unit (cabecera.ts, informe.ts) + Integration con repositorio git temporal aislado
  (cli.ts, vía `repoGitTemporal()`, mismo arnés que `hook.test.ts`).
- **Funciones puras nuevas:** `comprobarCabeceras`, `parsearBloque`, `primerCampoInvalido`,
  `valorEscalar`, `esLista`, `esDelimitador` (todas en `cabecera.ts`, sin git ni fs).

## Mutaciones (regla de mutación 1 y 2), con reversión probada

| Mut | Casilla | Qué se ensució | Qué se puso rojo | Reversión |
|---|---|---|---|---|
| **M1** | R1.2.6 | `openspec/changes/F0-01/proposal.md`, `origen_cabecera: derivada-17/09` → `heredada`, EN DISCO | `comprobarCabeceras` sobre el contenido real del fichero: `invalidas: [{ campo: 'origen_cabecera', ... }]` | `git diff --quiet` tras restaurar — SHA256 idéntico antes/después: `c831e0f0...774dc9d` |
| **M2** | R1.3.2 | `cli.ts`: `alcanceCabeceras` unificado con `EXCLUSIONES` (filtro añadido en la misma línea) | Las 2 pruebas de `cli.test.ts` (R1.3.1 y R1.3.5) pasan de verde a rojo: la cifra vuelve a 0 | `git diff --quiet apps/desk/server/citas/cli.ts` tras revertir — SHA256 idéntico: `1cd8d86a...74dc9d` |
| **M4** | R1.3.5 | `cli.ts`: `cabeceras` condicionado a `resultado.bloquea ? sinCabeceras : comprobarCabecerasDelArbol(...)` | La prueba de R1.3.5 (cita rota + cabecera inválida a la vez) pasa a rojo: la cifra de cabeceras vuelve a 0, sólo se nombra la cita | Mismo SHA256 que M2 tras revertir: `1cd8d86a...74dc9d` |

## Archivos cambiados

| Fichero | Acción | Qué se hizo |
|---|---|---|
| `apps/desk/server/citas/cabecera.ts` | Creado | Núcleo puro: parser de 7 claves + validación de forma/dominio (RQ-CV-19) |
| `apps/desk/server/citas/cabecera.test.ts` | Creado | 6 pruebas RED→GREEN de §7 del diseño |
| `apps/desk/server/citas/cli.ts` | Modificado | `alcanceCabeceras`/`comprobarCabecerasDelArbol` (D2, alcance propio) + wiring en `ejecutar()` |
| `apps/desk/server/citas/cli.test.ts` | Creado | 2 pruebas de integración (D2/R1.3.1, M4/R1.3.5) |
| `apps/desk/server/citas/informe.ts` | Modificado | Quinta cifra «cabeceras R-1 inválidas», lista de inválidas, frases actualizadas (RQ-CV-10) |
| `apps/desk/server/citas/informe.test.ts` | Modificado | 4 pruebas nuevas, ninguna existente tocada |
| `CLAUDE.md` | Modificado | R-1 pasa a 7 campos (`origen_cabecera` añadido al bloque de ejemplo) |
| `openspec/changes/F0-01/proposal.md` | Modificado | Cabecera R-1 añadida (10 líneas) |
| `openspec/changes/F0-02/proposal.md` | Modificado | Cabecera R-1 añadida |
| `openspec/changes/F0-03/proposal.md` | Modificado | Cabecera R-1 añadida |
| `openspec/changes/F0-04/proposal.md` | Modificado | Cabecera R-1 añadida + línea `Estado` reescrita (2b) |
| `openspec/changes/orden-precedencia-guardas/proposal.md` | Modificado | Cabecera R-1 añadida (sólo en `main`; ver R1.2.4 abajo) |
| `openspec/changes/archive/*/proposal.md` (8) | Modificado | Cabecera R-1 añadida en cada uno |
| `docs/sdd/F0-01_Correcciones_para_el_plan.md` | Modificado | Cita reparada: `F0-04/proposal.md:18` → `:28` |
| `openspec/config.yaml` | Modificado | Cita reparada: `F0-04/proposal.md:18` → `:28` (comentario, sin backticks) |
| `openspec/specs/transitions-st/spec.md` | Modificado | Cita reparada: `F0-04/proposal.md:20-26` → `:30-36` |
| `openspec/changes/F0-05/{proposal,design,tasks}.md`, `specs/*/spec.md` | Comiteados por primera vez | Artefactos de fases previas (propose/spec/design/tasks), sin tocar salvo las 4 citas de R1.4.2 en `proposal.md` y las dos en las delta specs |

## Casillas NO ejecutadas, y por qué

- **R1.2.4** (cabecera de `orden-precedencia-guardas` en el worktree `f1b-10-r1`): fuera del boundary
  de este intento — otro worktree, otra tanda (F1B-10) en vuelo. El bloque exacto que se habría
  escrito allí (idéntico al que sí entró en `main`):

  ```
  ---
  tanda: F1B-10
  motivo: ""
  capacidad: [transitions-st, tickets-core]
  maestro: ["nº 52"]
  cierra: si
  toca_maestro: no
  origen_cabecera: derivada-17/09
  ---
  ```

- **R1.4.6** (`settle`): no ejecutada porque R1.4.5 no cerró dentro de presupuesto. Este
  `apply-progress` SÍ se escribe (persistencia obligatoria de la fase); `settle` es del orquestador y
  sólo procede tras resolver el bloqueo de R1.4.5.

## El bloqueo de R1.4.5 — medición completa

```
git diff --shortstat --no-renames 5cfd056
 28 files changed, 2716 insertions(+), 12 deletions(-)
```

Nada nuevo sin trackear (`git status --short --untracked-files=all | grep '^??'` → vacío): todo lo
nuevo ya está en el `git diff` de arriba.

**Desglose:**

| Bloque | Líneas | Nota |
|---|---|---|
| Implementación de R1 (código + pruebas + 13 cabeceras + `CLAUDE.md` + 3 citas reparadas) | **494** | Dentro del rango estimado por `tasks.md` (450-540) |
| Artefactos propios de F0-05 (`proposal.md` 918, `design.md` 545, `tasks.md` 312 + 2 delta specs 291+168) | **2.234** | Nunca comiteados antes de este intento; el `git status` de arranque de la sesión ya los mostraba como `?? openspec/changes/F0-05/` |
| **Total medido** | **2.728** | **Supera el techo de 800 en 1.928 líneas** |

**Eso era el estado del 18/09 y está superado:** el `reset` rebasó el intento sobre `38c9c04` y R1 se
commiteó entera en `778d617`. La medición que vale es la de «Cierre».

### La pregunta que esto abre

¿Cuenta la primera persistencia de los artefactos SDD previos (propose/spec/design/tasks, nunca
comiteados) contra el presupuesto de la fase `apply`? Dos lecturas, ninguna decidida por esta tanda:

1. **Sí cuenta tal cual** — el ledger mide el árbol, no la intención; 2.728 es la cifra real y el
   techo de 800 no se cumple. Salida: partir el commit (artefactos SDD por un lado, implementación de
   R1 por otro) o pedir una excepción de tamaño, igual que el precedente de `detector-citas-extremos`
   (5.000 líneas aprobadas por Gerencia el 16/09, con justificación de que la mayoría era un `git mv`
   de coste de revisión cero — aquí NO hay ese atenuante: las 2.234 líneas son contenido nuevo,
   revisable de verdad).
2. **No debería contar contra R1** — son la salida de fases anteriores (`sdd-propose`, `sdd-spec`,
   `sdd-design`, `sdd-tasks`), que debieron comitearse al cierre de cada una de esas fases y no lo
   fueron; medirlas aquí penaliza a R1 por un hueco de proceso ajeno a su alcance.

**Esta tanda no elige entre las dos.** Es exactamente la cláusula de R1.4.5: si supera 800, se para y
se pregunta.

## Precondiciones documentales — nada pendiente en R1

Ninguna precondición de las que `proposal.md` enumera bloquea R1 (todas resueltas antes de empezar:
H-a y H-b cerradas por `5cfd056`, F0-04 resuelto por §18, orden interno respetado — cabeceras antes
que activación).

## Cierre de R1 (2026-09-20)

**Medición.** `git diff --shortstat --no-renames 38c9c04` → **738** líneas en `778d617` (689 + 49) y
**753** con este commit de cierre, sobre un techo de 800; `git status --porcelain` vacío. **Evidencia.** `npm test` 1144 pasadas · 2 saltadas, salida 0 (la
primera corrida añadió un `Timeout calling "onTaskUpdate"` del reportero de vitest, no reproducible en
la segunda); `typecheck` y `lint` en 0, con 158 avisos preexistentes y ninguno en los ficheros de la
tanda. Detector en **modo hook** sobre `778d617`: **cabeceras R-1 inválidas 0**; sobre la base
`38c9c04`, **13**, una por proposal sin bloque — esa es la discriminación, no la corrida verde. `--sha`
NO comprueba cabeceras: sólo el modo hook, como pide `RQ-CV-19`, así que la quinta cifra se lee de ahí.

**Lo que el detector sigue bloqueando, y no es de R1:** 7 citas rotas en `778d617` frente a **13** en
`38c9c04`; R1 cerró 6 (H-c). Las que quedan citan ficheros que siguen sin trackear en `main`. **R1.2.4**
se ejecutó en el worktree `f1b-10-r1` (`21b16ec`, +10/-0, bytes idénticos a la copia de `main`): no mueve
las 738, porque ese worktree no es el árbol del intento.

## R2 · Fase 1 · entrega A — el núcleo (2026-09-20)

**Intento:** ordinal 4 del objetivo `generation: 3` (`acquire` `f0-05-r2-fase1a-acquire-2026-09-20`),
techo 800. **Base:** `81fb7dc`. **Worktree:** `C:/dev/Desk_2_R1.023-worktrees/f0-05-r2`.

**Por qué la Fase 1 va en DOS entregas.** Escrita entera mide 763 líneas de código y pruebas; con las
marcas y un informe proporcionado pasa de 800, y el techo **no se puede subir**: `rescope` es la única
vía que el ledger ofrece y sus dos límites no pueden exceder los del objetivo vigente. Cambiar de
objetivo tampoco valía —el candidato no había derivado y se rechaza como «elective budget reset»—, así
que la salida fue partir el trabajo por donde el grafo de imports ya lo separaba.

**El corte, medido contra los imports reales:** `comprobaciones.ts` sólo importa `../citas/cabecera`;
`testing/arbolDePrueba.ts` sólo un TIPO suyo; `informe.ts` y `cli.ts` dependen de él y no al revés. El
núcleo no sabe nada del render ni del comando, así que la entrega A se sostiene sola.

| Entrega | Ficheros | Líneas | Cierra |
|---|---|---|---|
| **A · núcleo** | `comprobaciones.ts`, `comprobaciones.test.ts`, `testing/arbolDePrueba.ts` | 398 | R2.1.3 |
| **B · render y comando** | `informe.ts`, `informe.test.ts`, `cli.ts`, `cli.test.ts` | 365 | R2.1.1, R2.1.2, R2.1.4 |

### TDD — el rojo DISCRIMINA, no sólo falla

Rojo observado antes de escribir nada: `Failed to load url ./comprobaciones`. Verde después: 4/4 en
`reconciliacion/comprobaciones.test.ts`. Lo que hace que el verde signifique algo es el árbol
sintético: **AFIRMA «SIETE»** en su `cifras_ancladas` mientras `estados.ts` declara **once**. Una
implementación que leyera el registro para comprobar el registro —el fallo del 2026-09-17, que
`RQ-RC-04` existe para cerrar— pondría la prueba roja. Los otros tres casos fijan que el 4 del maestro
sigue enfrentado al 11, que «SIETE» no aparece como cifra del código, y que una divergencia declarada
legítima no convierte la comprobación 5 en bloqueante.

**Y el arnés NO ordena a propósito:** `listar()` devuelve en orden de declaración. Ordenar es trabajo
del núcleo (`RQ-RC-02`), y un arnés que entregara la lista ya ordenada no distinguiría si lo hace.

### Verificación con la entrega B AISLADA, no por inspección

Los cuatro ficheros de B se movieron FUERA del árbol antes de medir, para que el verde no viniera de
código que este commit no lleva:

    npm test            124 ficheros · 1148 pasadas · 2 saltadas · salida 0   (eran 1144: +4, los de A)
    npm run typecheck   0
    npm run lint        0 errores · 158 avisos, todos preexistentes y ninguno en los ficheros nuevos

### Dos decisiones de construcción, escritas para que no se relean como descuido

- `comprobaciones.ts` **no reimplementa** la validación de cabecera: importa `comprobarCabeceras` de
  `citas/cabecera` —la dependencia que la spec de esta capacidad declara— y sólo lee dos campos de un
  bloque YA validado. Se descartó extender `cabecera.ts` para que devolviera las cabeceras válidas,
  que sería más limpio, porque R2.3.5 no incluye ese fichero en su barrido de anclaje: la tanda no
  está pensada para tocarlo.
- La comprobación 2 **DICE** que `cierres_declarados_por_commit` no está declarado en `config.yaml`,
  en vez de deducirlo. `RQ-RC-05` exige siete cierres por commit y ningún artefacto los declara de
  forma legible por máquina —el §5 del plan no tiene columna de estado—. Leerlos del texto de la spec
  sería leer el registro para comprobar el registro. Muerde en R2.3.3, no aquí.
