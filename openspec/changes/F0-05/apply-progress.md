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

## R2 · Fase 1 · entrega B — el render y el comando (2026-09-20)

**Intento:** ordinal 5 del objetivo `generation: 4` (`acquire` `f0-05-r2-fase1b-acquire-2026-09-20`),
techo 800. **Base:** `1a51ba0`, árbol `9cc678f7`. Cierra R2.1.1, R2.1.2 y R2.1.4, y con ellas la
**Fase 1 entera**.

**Por qué R2.1.4 se marca AQUÍ y no en la entrega A:** es el GREEN de los TRES módulos, y hasta esta
entrega no estaban los tres. Marcarla con A habría dado por hecho un verde que sólo existía en el
árbol de trabajo y no en el commit — que es exactamente lo que la verificación con B aislada
descartó.

### TDD — los dos rojos, y qué DISCRIMINA cada uno

| Casilla | Rojo observado | Verde | Lo que el caso distingue |
|---|---|---|---|
| R2.1.1 · `RQ-RC-02` | `Failed to load url ./comprobaciones` | 3/3 en `informe.test.ts` | que el texto lleve la fecha del COMMIT y no la de hoy |
| R2.1.2 · `RQ-RC-03` | `Failed to load url ./cli` | 4/4 en `cli.test.ts` | que sólo la 1 y la 3 muevan el código de salida |

**El caso de determinismo que importa no es la igualdad.** Dos llamadas a una función pura sobre la
misma entrada coinciden siempre: eso no prueba nada. Lo que lo prueba es la tercera aserción — el
texto contiene la fecha del commit sintético y **NO** contiene la de hoy. Un render que leyera el
reloj (D7) se pondría rojo ahí, y sólo ahí.

**Y el de salida se comprueba por los DOS signos:** las dos vías bloqueantes —una spec huérfana, y un
cambio fuera del plan sin motivo escrito— dan código distinto de 0; la divergencia legítima de
`esperas`, once frente a cuatro, sale en el fichero y **no** toca el código. Sin el segundo caso, una
implementación que bloqueara por todo pasaría igual de verde.

### Lo que se construyó

| Fichero | Líneas | Qué hace |
|---|---|---|
| `reconciliacion/informe.ts` | 79 | Render determinista: un array de líneas unido al final, cifras alineadas con puntos, cabecera con sha, fecha del commit y limpieza del árbol |
| `reconciliacion/informe.test.ts` | 49 | Los tres casos de `RQ-RC-02` |
| `reconciliacion/cli.ts` | 135 | Adaptador propio con `spawnSync` (D6), `Arbol` de disco, `ejecutar` puro respecto al proceso y defecto cerrado en código 2 |
| `reconciliacion/cli.test.ts` | 102 | Los cuatro casos de `RQ-RC-03` y `RQ-RC-01` |

**D6 cumplido y comprobable:** `cli.ts` NO importa el adaptador del detector de citas. Sus dos
operaciones de git —el `HEAD` con su fecha y su limpieza, y los ficheros sin trackear— van en un
envoltorio propio de `spawnSync`, sin `shell`, con `-c core.quotepath=off` y separador nulo.

**D8 cumplido:** se lee UN solo árbol, el de trabajo, y la cabecera del informe lo dice. La
comprobación 6 cuenta ficheros SIN TRACKEAR, que por definición no están en ningún commit: leerlos
del commit la dejaría siempre en cero, y mezclar dos árboles sin decirlo es lo que `RQ-RC-01`
prohíbe.

### Verificación sobre el árbol COMMITEADO

    npm test            126 ficheros · 1155 pasadas · 2 saltadas · salida 0
    npm run typecheck   0
    npm run lint        0 errores · 158 avisos, todos preexistentes

**La Fase 1 queda cerrada.** Lo que sigue son las Fases 2 y 3, cada una en su propio objetivo.

## R2 · Fase 2 — las guardas del autocertificado y el campo `estado` (2026-09-20)

**Intento:** ordinal 6 del objetivo `generation: 5` (`acquire` `f0-05-r2-fase2-acquire-2026-09-20`),
techo 800. **Base:** `4199ce8`, árbol `f7c9ac9f`. Cierra R2.2.1 a R2.2.6.

### Los dos rojos, y por qué ninguno fue «falta el módulo»

Los rojos de la Fase 1 eran de importación: el módulo no existía. Los de ésta son de
**comportamiento**, que es un rojo más caro de conseguir y más barato de creerse.

| Casilla | Rojo observado, literal | Verde |
|---|---|---|
| R2.2.1 · `RQ-RC-08` | `expected 'incumplimiento no cerrado' to contain 'defecto de registro'` | 5 casos |
| R2.2.5 · `RQ-RC-06` | `expected undefined to be defined` | 4 casos |

**R2.2.1 es la ausencia dejando de contar como vida.** Antes, una entrada sin `estado` caía en «no
cerrada» y se sumaba a los vivos. Ahora es un **defecto de registro** con su propia cifra, porque
«un barrido que cuenta ausencias miente en cuanto alguien añade una entrada y se olvida del campo».

**R2.2.5 es la guarda (b), que MARCA y no rechaza.** Cruza el `maestro:` de cada fila dada por
cerrada contra la columna de fuentes de su fila del §5 del plan; si no hay intersección, la marca
«sin verificar» sin tocar el código de salida. Va con su control del otro signo: una fila cuyo
`maestro:` sí cruza NO se marca. Sin ese caso, una guarda que sospechara de todas pasaría igual.

### M3 — la mutación se hizo sobre el fichero VIGILADO

Regla de mutación 2: mutar el guardián sólo demuestra que se ejecuta; mutar lo vigilado demuestra
que DISCRIMINA. Se borraron las siete líneas de la regla (d) de `openspec/config.yaml` en disco:

    sucio      → expected [ 'a', 'b', 'c' ] to deeply equal [ 'a', 'b', 'c', 'd' ]
    restaurado → cmp sin diferencias · sha256 idéntico · git diff de vuelta en 14/1 · guardián 6/6

La reversión se COMPROBÓ, no se supuso. Y el guardián lleva además su propio control del otro signo
en memoria, para que el caso siga vigilado cuando la mutación ya no se repita.

### Lo que cambió en el registro

| Cambio | Detalle |
|---|---|
| Regla (d) de `unidad_de_avance` | 7 líneas, detrás de la (c) y delante de `trazabilidad`. Las tres primeras intactas, comprobado por su TEXTO y no por su posición |
| `estado` en las DOCE IV | siete `CERRADO` (IV-1,3,4,5,6,7,10) y cinco `VIVO` (IV-2,8,9,11,12) |
| IV-6 | su `estado` era PROSA, que el barrido leía vacío — o sea, un defecto de registro. Pasa a `CERRADO` y la prosa se CONSERVA íntegra en `estado_prosa` |

**El guardián del registro es nuevo y vive en `reconciliacion/registro.test.ts`**: comprueba los
cuatro ids contra el fichero real y los cero defectos de registro haciendo pasar el `config.yaml`
real por el propio núcleo. Comprobar el registro con el mismo código que lo barre, y no con un
segundo parser, evita el molde de H5 que `CLAUDE.md` registra.

### La regla de mutación 4 se cobró su peaje EN ESTA MISMA TANDA

Las catorce líneas nuevas de `config.yaml` desplazaron una cita de R1 que vivía en `tasks.md`, y el
detector la cazó como séptimo bloqueante. **Es el caso B**: la frase afirma lo que R1 reparó, no el
árbol de hoy, así que se ANCLA y no se renumera. Anclada, el detector vuelve a seis.

**Y el primer intento de anclarla no funcionó**, por una razón que el propio detector imprime en cada
corrida: el ancla había quedado en la línea SIGUIENTE a su cita, porque el párrafo se partió justo
ahí. Hizo falta reflujar para que cada cita y su ancla compartieran línea física. Se anota porque
leer el aviso no es lo mismo que aplicarlo.

### Verificación sobre el árbol COMMITEADO

    npm test            127 ficheros · 1173 pasadas · 2 saltadas · salida 0   (eran 1155: +18)
    npm run typecheck   0
    npm run lint        0 errores · 158 avisos, todos preexistentes

## R2 · Fase 3 — el barrido real, y lo que sólo el árbol real enseña (2026-09-20)

**Intento:** ordinal 7 del objetivo `generation: 6` (`acquire` `f0-05-r2-fase3-acquire-2026-09-20`),
techo 800. **Base:** `0e4049f`. Cierra R2.3.1 a R2.3.8, y con ellas **R2 entera: 47 casillas de 47**.

### Lo que el árbol real destapó y ningún árbol sintético podía

Las pruebas del núcleo usaban `capabilities` como lista plana. En el fichero real son **bloques**
`- name: X`, y el barrido daba las NUEVE specs de disco por huérfanas. Ese es el valor de R2.3.3:
no confirma lo que las pruebas ya decían, sino que expone lo que las pruebas no sabían preguntar.

| Defecto | Cómo se veía | Rojo previo | Arreglo |
|---|---|---|---|
| Capacidades contadas dos veces | `36 declaradas` en vez de 18 | `expected '36 declaradas' to be '18 declaradas'` | `- name:` y lista plana se admiten, pero nunca a la vez |
| Divergencia ERROR sin medir | `transiciones` y `estados` marcadas | `expected [ 'transiciones', 'estados' ] to not include 'transiciones'` | sin lectura de código no hay divergencia que reportar |

El segundo es el fallo del 2026-09-17 **al revés**: aquel afirmó que nadie había escrito algo,
leyendo el registro en vez del código; éste afirmaba una divergencia que nadie había medido. Las dos
formas de mentir con el mismo mecanismo.

### Las cifras de cierre, y las dos que NO salieron

    18 capacidades · 9 specs · 0 huérfanas          ← RQ-RC-09 demostrado en su primera ejecución
    5 fuera del plan · 0 sin motivo                  ← coincide con lo esperado
    12 entradas IV · 5 vivos · 0 defectos de registro
    esperas: código 11 · maestro 4                   ← leído de packages/shared, no del registro
    dos pasadas seguidas → `cmp` sin diferencias     ← RQ-RC-02, comprobado y no supuesto

**El numerador no sale, y las dos mitades fallan por razones distintas.** Los **6 derivables**
(F0-01, F0-02, F0-03, F0-05, F1A-08, F1B-10) frente a los 4 esperados son legítimos: la cifra 4 está
anclada a `ce93480`, cuando F0-05 y F1B-10 todavía no tenían cabecera. Los **0 declarados por
commit** frente a 7 son el hueco real: **ningún artefacto declara esa lista de forma legible por
máquina** —el §5 del plan no tiene columna de estado—, y leerla del texto de la spec sería leer el
registro para comprobar el registro. El barrido lo DICE y no la inventa, que es lo que `RQ-RC-05`
ordena al prohibir la cabecera retroactiva.

### El barrido de anclaje da más de lo que cabe en esta tanda

Citas a `config.yaml`, `package.json` y `guardianes.test.ts`: **81 con ancla inline** —se leen contra
su revisión y R2 no las toca—, **34 intactas**, **47 sin ancla y desplazadas**.

| Dónde viven | Cuántas | Qué se hizo |
|---|---|---|
| Carpeta de F0-05 y el propio `config.yaml` | 6 | **reparadas**: 2 ancladas (caso B) y 4 repuntadas a hoy (caso A) |
| `openspec/changes/archive/**` | 24 | se reportan: son registros históricos y renumerarlos los volvería falsos sobre su fecha |
| Rama de F1B-10 | 15 | se reportan: no son de esta tanda |
| `CLAUDE.md` y `docs/sdd/**` | 4 | se reportan |

⚠️ **«Desplazada por R2» es una COTA SUPERIOR, no un veredicto.** Las tres de `CLAUDE.md` se
comprobaron a mano y **ya estaban mal en `5cfd056`**, antes de que R2 existiera. El barrido mecánico
compara el contenido de la línea entre dos revisiones; no puede saber qué afirma la frase. Sólo
leerla puede, y por eso esta casilla no se automatiza.

### Verificación sobre el árbol COMMITEADO

    npm test            127 ficheros · 1178 pasadas · 2 saltadas · CERO FALLOS · salida 1
    npm run typecheck   0
    npm run lint        0 errores · 158 avisos, todos preexistentes
    npm run reconcile   salida 0, el fichero escrito y determinista (`cmp` sin diferencias)

### ⚠️ La suite sale 1 con CERO pruebas rojas, y por eso R2 no se cierra aquí

Ninguna prueba falla: 1.178 pasan y 2 se saltan. La salida 1 viene de un error NO CONTROLADO del
reportero de vitest —un tiempo de espera agotado en su canal interno de actualización de tareas—,
que vitest cuenta como «1 error» y convierte en salida distinta de cero.

Medido, no supuesto:

| Dónde | Pruebas | Salida |
|---|---|---|
| worktree `f0-05-r1`, en `b55bfc7` | 1.144 | **0** |
| este worktree, Fase 2 | 1.173 | **0** |
| este worktree, Fase 3, tres corridas seguidas | 1.178 | **1**, las tres |
| este worktree, Fase 3, quitando `registro.test.ts` | 1.167 | **1** |

No lo causa el fichero nuevo —quitarlo no lo quita— y no aparece con una suite más pequeña ni
apareció en la Fase 2. Apunta a un fallo del reportero bajo carga, no del código.

**Aun así se para.** `npm test` es el `test_command` del contrato, y una salida 1 es ROJA aunque la
razón no sea una prueba: decir «suite en verde» aquí sería exactamente la clase de afirmación que
este proyecto castiga. Las 47 casillas están hechas y su trabajo commiteado; lo que NO se hace es
el `settle`, que esperaba una suite en verde.
