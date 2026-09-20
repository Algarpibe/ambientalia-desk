# Diseño — `F0-05` · Mecanismo de reconciliación y bandeja de entrada

| Dato | Valor |
|---|---|
| Fase | `sdd-design`. Entradas: el `proposal.md` cerrado (918 líneas) y las dos delta specs de `specs/` |
| Árbol de referencia | **`995adbc`**, rama `main`, árbol principal. Ver la nota de anclaje de abajo |
| Rebanadas | **R1 «el contrato»** (capacidad `citas-verificables`) · **R2 «el barrido»** (capacidad `reconciliacion`) |
| Preflight | Leído de fichero, `openspec/config.yaml:22-30` en `995adbc`: `interactive · hybrid · ask-on-risk · 800 · strict_tdd` |
| Reglas de fase aplicadas | `openspec/config.yaml:1387-1389` en `995adbc` (`rules.design`) |

**Nota de anclaje — por qué `995adbc` y no `ce93480`.** El `proposal.md` y las dos delta specs anclan
a `ce93480`. Entre esa revisión y hoy entró `995adbc`, que añadió `decisiones_de_gerencia` a
`openspec/config.yaml` **por encima de `unidad_de_avance`**, así que las citas de ese fichero se
desplazaron. Las de las specs **siguen siendo verdaderas de su revisión** —para eso existe el ancla—,
pero leerlas contra el árbol de hoy es el modo de fallo. Este documento cita lo que ha leído, y lo ha
leído del árbol de trabajo, que es `995adbc`: por eso ancla ahí. El `git status` de arranque de esta
sesión no lista ningún fichero trackeado modificado; si alguno lo estuviera, el ancla sería una
etiqueta y no un hecho.

**Consecuencia inmediata, y no es teórica:** el desplazamiento que el criterio 15 anticipaba «en
cuanto el `apply` inserte líneas» **ya ocurrió antes de que R1 empiece**, y lo produjo otra tanda. El
barrido de la regla de mutación 4 no espera al `apply`.

---

## 0 · Qué fija este documento y qué no decide

**Fija el CÓMO.** El alcance está cerrado y ratificado: cinco piezas, dos rebanadas, trece cabeceras,
`cierra: no` para F0-04, capacidad `reconciliacion` nueva. Este diseño no reabre ninguna de esas
decisiones, no propone piezas nuevas, **no rutea destinos** de incumplimientos ni de entradas de la
bandeja (R-3 de `CLAUDE.md:411` en `995adbc` es explícita) y **no toca ningún fichero** salvo este.

**Lo que sí añade** son nueve decisiones de construcción (§3), el contrato de pruebas bajo
`strict_tdd` (§7), la declaración de qué NO caza cada guarda (§4) y la sección §10, que es
retrospectiva y nueva.

---

## 1 · Las dos rebanadas, y por qué el corte es troceable por esa línea

| Rebanada | Tareas | Capacidad | Qué entrega |
|---|---|---|---|
| **R1 · el contrato** | 1 · comprobación de forma en el pre-push<br>2 · las trece cabeceras<br>2b · cerrar el registro de F0-04 | `citas-verificables` | La regla R-1 existe y se impone |
| **R2 · el barrido** | 3 · regla (d) de `unidad_de_avance`<br>4 · las dos guardas del autocertificado<br>5 · `npm run reconcile` + `RECONCILIACION.md` | `reconciliacion` | La regla se mide |

**El corte NO es presupuestario: es la dependencia real del trabajo.** R2 mide lo que R1 escribe. La
comprobación 2 del barrido deriva el numerador de los campos `tanda:` y `cierra:`; sobre el árbol de
hoy leería **trece ausencias** —medido: sólo `openspec/changes/F0-05/proposal.md` lleva cabecera, los
otros trece no— y produciría un informe entero de ruido. Decisión de Gerencia, obs. #743 y #744.

**Dos intentos del ledger, dos commits, el mismo cambio.** No son dos tandas: el `proposal.md`, las
specs y este diseño son únicos, y el `cierra` de la fila F0-05 lo sostiene R2, no R1.

### 1.1 · Orden interno obligatorio dentro de R1

`RQ-CV-20` impone una precondición dura y el orden no es preferencia:

    tarea 2 (las trece cabeceras)  ──→  tarea 1 (instalar la comprobación)
    2b (cerrar el registro de F0-04) va DENTRO de la tarea 2, no después

Instalar primero la comprobación **bloquea todo push desde el árbol principal**, incluido el commit
que escribiría las cabeceras que faltan. El código se puede escribir antes —y debe, por el rojo
previo—, pero **la activación en `.githooks/pre-push:4` en `995adbc` es el último paso de R1**.

### 1.2 · Cómo se mide cada rebanada, y cuándo

**Cada rebanada se mide POR SEPARADO, en worktree aislado, ANTES de pedir nada:**

    git diff --shortstat --no-renames <commit de partida>   +   wc -l de lo nuevo sin trackear

Las dos partes hacen falta por los **tres desvíos medidos** del ledger que registra `CLAUDE.md`: no
cuenta lo nuevo sin trackear, cuenta 0 un fichero que era binario en el árbol de partida, y mide **sin
detección de renombrado**. Aquí el primero muerde de verdad: los ficheros nuevos de R2
(`apps/desk/server/reconciliacion/*`) nacen sin trackear.

**El worktree va bajo el directorio del usuario**, como sibling —`C:/dev/Desk_2_R1.023-worktrees/…`—,
nunca en temporales, y con su propio `.codegraph/` si se indexa. Es donde ya vive `f1b-10-r1`.

**Regla del ciclo 2:** una tanda SDD por árbol de trabajo. F0-05 corre en `main`; F1B-10 sigue aislado
en su worktree. El aislamiento se mantiene **hasta que F1B-10 fusione**, y la segunda copia de la
cabecera de `orden-precedencia-guardas` entra **por ese worktree**, sin sacarlo de su aislamiento.

---

## 2 · Arquitectura — dónde vive cada pieza

    pre-push (.githooks/pre-push:4 en `995adbc`)
        └─ tsx apps/desk/server/citas/cli.ts          ← R1: un solo hook, dos barridos
               ├─ detectar()      citas          → ResultadoDeteccion   (sin tocar)
               ├─ cabeceras()     cabeceras R-1  → ResultadoCabeceras   ← NUEVO
               └─ informe()       cinco cifras en UN mensaje            ← MODIFICADO

    npm run reconcile
        └─ tsx apps/desk/server/reconciliacion/cli.ts  ← R2: adaptador (git + fs)
               ├─ comprobaciones.ts   las seis, núcleo puro
               └─ informe.ts          render determinista → docs/sdd/RECONCILIACION.md
                                                          → código de salida 0 / ≠0

**La forma la impone el precedente, no la preferencia:** el detector ya está partido en puerto
(`apps/desk/server/citas/detector.ts:16-27` en `995adbc`), núcleo puro y adaptador de git. R2 repite
esa forma; R1 se enchufa a la que ya existe.

### 2.1 · Ficheros

| Fichero | Acción | Qué hace |
|---|---|---|
| `apps/desk/server/citas/cabecera.ts` | Crear | Núcleo puro: parsea y valida la cabecera R-1 de siete campos |
| `apps/desk/server/citas/cabecera.test.ts` | Crear | Los rojos de §7, caso a caso |
| `apps/desk/server/citas/cli.ts` | Modificar | Enchufa el barrido de cabeceras al modo hook; su propio alcance |
| `apps/desk/server/citas/informe.ts` | Modificar | Quinta cifra y la declaración de lo no comprobado |
| `apps/desk/server/citas/informe.test.ts` | Modificar | Rojo de la quinta cifra |
| `apps/desk/server/citas/guardianes.test.ts` | Modificar | Extiende el grafo de imports a `reconciliacion/` |
| `openspec/changes/**/proposal.md` (13) | Modificar | **Sólo añaden** el bloque de cabecera |
| `openspec/changes/F0-04/proposal.md` | Modificar | Cabecera **y** cierre de registro (2b) |
| `apps/desk/server/reconciliacion/cli.ts` | Crear | Adaptador: HEAD, sin trackear, lectura de disco, salida |
| `apps/desk/server/reconciliacion/comprobaciones.ts` | Crear | Las seis comprobaciones, puras |
| `apps/desk/server/reconciliacion/informe.ts` | Crear | Render determinista y ordenado |
| `apps/desk/server/reconciliacion/*.test.ts` | Crear | Rojos y mutaciones de §7 |
| `package.json` | Modificar | Script `reconcile` |
| `openspec/config.yaml` | Modificar | Regla (d), `estado` en las doce IV, `reconciliacion` en `capabilities` |
| `CLAUDE.md` | Modificar | R-1 pasa a siete campos |
| `docs/sdd/RECONCILIACION.md` | Generar | Salida del barrido |

**Nada de lo anterior toca `transitions.ts`, `estados.ts` ni ningún fichero de `apps/desk/src`.**

---

## 3 · Decisiones de construcción

### D1 · La comprobación de cabecera entra en el hook existente, en módulo propio

**Elegido:** módulo nuevo `cabecera.ts`, invocado desde el modo hook
(`apps/desk/server/citas/cli.ts:134-179` en `995adbc`), con **un solo mensaje** de salida.
**Descartado:** (a) un hook nuevo —dos hooks compiten por el mismo `pre-push` y el orden se vuelve
invisible—; (b) meterlo dentro de `detectar()` —ver D4—.
**Razón:** `RQ-CV-19` lo pide literal: «no se añade un hook nuevo». Un push que ya se para por una
cita rota se para también por una cabecera inválida, y el usuario lee una sola vez.

### D2 · El alcance de cabeceras NO reutiliza `EXCLUSIONES`

**Elegido:** lista de alcance propia, derivada de las rutas trackeadas del árbol local filtradas por
el patrón `openspec/changes/**/proposal.md`, **sin excluir el archive**.
**Descartado:** reutilizar `EXCLUSIONES` de `apps/desk/server/citas/cli.ts:46-53` en `995adbc`.
**Razón, y es el hallazgo de este diseño:** esa lista excluye `openspec/changes/archive/`
(`apps/desk/server/citas/cli.ts:48` en `995adbc`, por `RQ-CV-07`, en
`openspec/specs/citas-verificables/spec.md:436-439` en `995adbc`), mientras `RQ-CV-20` exige que el
barrido de cabeceras **incluya** el archive — ocho de las trece viven ahí. Reutilizar la lista dejaría
ocho cabeceras sin comprobar **y la suite en verde**. Los dos alcances son distintos a propósito y
cada uno lleva su prueba; la mutación que lo fija está en §7.

### D3 · Sin dependencia nueva para leer YAML

**Elegido:** parser de cabecera propio, en `cabecera.ts`, que sólo acepta el bloque plano de siete
claves entre dos `---` al principio del fichero.
**Descartado:** añadir `js-yaml`. `package.json:25-43` en `995adbc` no declara ningún parser de YAML.
**Razón:** el detector viaja a la imagen de producción como código **inerte** (`RQ-CV-18`, en
`openspec/specs/citas-verificables/spec.md:897` en `995adbc`). Una dependencia nueva para un hook
engorda imagen y cadena de suministro para ganar una gramática que aquí **no se quiere**: R-1 es un
dominio cerrado, y un parser general aceptaría formas que la regla no admite.
**Coste aceptado, declarado en §4:** el parser propio no caza YAML anidado, anclas, cadenas
multilínea ni claves duplicadas; y trata `\r` como blanco, porque los `proposal.md` pueden llegar con
CRLF en el árbol de trabajo y `apps/desk/server/citas/detector.ts:110` en `995adbc` ya parte sólo
por `\n`.

### D4 · El resultado de cabeceras NO entra en `ResultadoDeteccion`

**Elegido:** tipo propio `ResultadoCabeceras`, unido al de citas sólo en `informe()` y en el código
de salida.
**Descartado:** añadir campos al tipo existente.
**Razón:** `apps/desk/server/citas/detector.ts:53-56` en `995adbc` declara un **invariante de
conservación** —comprobadas + saltadas + fuera del repositorio + no son citas + abreviadas rotas +
bloqueantes + informadas suman exactamente las cosechadas—. Una cabecera no es una cita cosechada:
meterla ahí rompe el invariante o lo vuelve mentira. Se mantiene el invariante intacto y se suman los
dos códigos de salida con un `OR`.

### D5 · `reconcile` vive en `apps/desk/server/reconciliacion/`, no en `scripts/`

**Elegido:** `apps/desk/server/reconciliacion/`.
**Descartado:** `scripts/`, donde ya vive el instalador de hooks
(`package.json:11` en `995adbc`).
**Razón:** `vitest.config.ts:17-20` en `995adbc` incluye **sólo** `apps/**/*.test.ts` y
`packages/**/*.test.ts`. Un script en `scripts/` **no tendría pruebas recogidas**, y bajo
`strict_tdd` eso no es una preferencia de sitio: es no poder escribir el rojo.
**Efecto colateral que hay que asumir:** `vitest.config.ts:53` en `995adbc` mete
`apps/desk/server/**` en la cobertura, con umbrales en `vitest.config.ts:58-63` en `995adbc`. El
módulo nuevo entra al denominador y hay que cubrirlo, como se cubrió `citas/`.

### D6 · Adaptador de git propio y mínimo, sin importar `citas/git.ts`

**Elegido:** dos operaciones en `reconciliacion/cli.ts` — sha de `HEAD` y ficheros sin trackear bajo
`docs/sdd` —, con `spawnSync`, como ya hace el guardián de `eol`
(`apps/desk/server/citas/guardianes.test.ts:118` en `995adbc`).
**Descartado:** (a) importar `apps/desk/server/citas/git.ts` —acopla la capacidad nueva al hook: un
cambio en el adaptador del detector rompería el barrido, y al revés—; (b) extraer un adaptador común
—refactor de un fichero trackeado y muy citado, que dispara el barrido de la regla de mutación 4
sobre un tercer fichero dentro de R2—.
**Razón:** las seis comprobaciones necesitan **dos** operaciones de git; el resto es lectura de disco.
Quince líneas de adaptador cuestan menos que cualquiera de las dos alternativas.

### D7 · La fecha del informe sale del commit medido, no del reloj

**Elegido:** la cabecera de `RECONCILIACION.md` lleva el sha de `HEAD` y **la fecha de ese commit**.
**Descartado:** la fecha de ejecución.
**Razón:** `RQ-RC-02` exige que dos pasadas sin cambios produzcan un fichero **idéntico**. Con el
reloj, dos pasadas sobre el mismo árbol en días distintos difieren en una línea, y el `git diff` deja
de ser «la lista de desvíos nuevos» para ser «la lista más un ruido diario». Con la fecha del commit
la garantía es total y no sólo del mismo día.
**Riesgo declarado:** `RQ-RC-01` dice «la fecha y el commit contra el que midió», que admite las dos
lecturas. Si Gerencia lee ahí el reloj, cambia **una línea** del render y nada más del diseño.

### D8 · Lo medido es el ÁRBOL DE TRABAJO, etiquetado con `HEAD` y con su limpieza

**Elegido:** las seis comprobaciones leen el disco; el informe declara el sha de `HEAD` **y si el
árbol está limpio**.
**Descartado:** leer los blobs del commit con `git cat-file`, como hace el detector.
**Razón:** la comprobación 6 cuenta ficheros **sin trackear**, que por definición no están en ningún
commit — leer del commit la dejaría siempre en cero. Y si las otras cinco leyeran del commit mientras
la sexta lee el disco, el informe mezclaría dos árboles sin decirlo. Se lee uno solo y se dice cuál.
Esto es lo que sostiene el escenario de `RQ-RC-01`: «ninguna cifra queda sin decir contra qué se
midió».

### D9 · El código de salida se decide en el núcleo, no en el render

**Elegido:** `comprobaciones.ts` devuelve, por comprobación, `{ id, bloqueante, hallazgos[] }`;
`cli.ts` sale con ≠0 si y sólo si alguna **bloqueante** trae hallazgos.
**Descartado:** decidir el código leyendo el texto del informe.
**Razón:** `RQ-RC-03` fija que sólo la 1 y la 3 bloquean. Derivarlo del texto ata el contrato a la
redacción del informe, y la primera reescritura del mensaje cambiaría el comportamiento del comando
sin que ninguna prueba lo notara.

---

## 4 · Cada guarda declara qué NO caza

**Es regla de diseño de esta tanda, y sale de una medición propia.** Al remedir el anclaje de las dos
delta specs, el primer patrón usado exigía extensión conocida (`.ts`, `.md`, `.yaml`…) y dio **4 y
18**. El patrón correcto —el `NOMBRE_FICHERO` real,
`apps/desk/server/citas/cosecha.ts:67` en `995adbc`, que **no exige extensión**— da
**5 y 19, cero sin ancla**, que coincide al dígito con el criterio 16 del proposal. Lo que se le
escapaba era el hook, `.githooks/pre-push:4` en `995adbc`, sin extensión. Es el molde
de los tres detectores del §3.2 que registra `CLAUDE.md`: **un detector que no caza todo lo que la
afirmación abarca**. Por eso cada guarda de esta tanda escribe su límite al lado de su promesa.

| Guarda | Caza | NO caza | Quién lo caza entonces |
|---|---|---|---|
| **G1** · forma de la cabecera (`RQ-CV-19`) | ausencia del bloque, campo que falta, `motivo` vacío con `fuera-del-plan`, valor fuera de dominio | que el `tanda:` sea el correcto; que el `cierra` sea cierto; YAML anidado, anclas, multilínea, claves duplicadas | G4 y G5, que informan y no bloquean; nadie para lo demás, y se dice |
| **G2** · alcance del barrido de cabeceras (`RQ-CV-20`) | los catorce `proposal.md` trackeados, archive incluido | un `proposal.md` sin trackear; un cambio cuya carpeta no cuelga de `openspec/changes/` | nadie: es el mismo límite de `RQ-CV-07` |
| **G3** · comprobación 1 · huérfanas | spec en disco **no** declarada en `capabilities` | capacidad declarada **sin** spec: es trabajo pendiente, no desvío de registro | lectura humana |
| **G4** · comprobación 2 + guarda (b) | fila dada por cerrada cuya `maestro:` no cita ninguna fuente del §5 | que la fuente citada **justifique** algo; una `maestro:` correcta y una `tanda:` falsa | nadie, y por eso informa en vez de rechazar |
| **G5** · guarda (a) · `archive-report` | **ausencia** de la línea que dice qué cubrió y qué dejó fuera | que esa línea sea **verdad** | el lector del informe |
| **G6** · comprobación 3 · fuera del plan | `tanda: fuera-del-plan` con `motivo` vacío | que el motivo sea razonable | Gerencia |
| **G7** · comprobación 4 · IVs | vivos contados **por el campo** `estado`; entrada sin campo → **defecto de registro** | si el `estado` escrito es el que corresponde | el contraste de §7 del proposal, a mano |
| **G8** · comprobación 5 · cifras ancladas | divergencia entre `packages/shared` y `cifras_ancladas` | reclasificar una divergencia: reproduce la clave `divergencia`, no la reinterpreta | Gerencia, en `openspec/config.yaml:1187` en `995adbc` |
| **G9** · comprobación 6 · sin trackear | ficheros sin trackear bajo `docs/sdd` | sin trackear fuera de `docs/sdd`; un fichero trackeado y **obsoleto** | nadie: es la frontera de git, y por eso la comprobación existe |

---

## 5 · Contratos

```ts
// apps/desk/server/citas/cabecera.ts  (R1) — núcleo puro, sin git ni fs
export type OrigenCabecera = 'declarada' | `derivada-${string}`
export interface CabeceraR1 {
  tanda: string; motivo: string; capacidad: string[]; maestro: string[]
  cierra: 'si' | 'no'; toca_maestro: 'si' | 'no'; origen_cabecera: OrigenCabecera
}
export interface CabeceraInvalida { fichero: string; campo: string | null; motivo: string }
export interface ResultadoCabeceras { comprobadas: number; invalidas: CabeceraInvalida[] }
export function comprobarCabeceras(ficheros: readonly { ruta: string; texto: string }[]): ResultadoCabeceras
```

```ts
// apps/desk/server/reconciliacion/comprobaciones.ts  (R2) — núcleo puro
export interface Hallazgo { clave: string; detalle: string }
export interface Comprobacion { id: 1|2|3|4|5|6; titulo: string; bloqueante: boolean
  cifras: readonly string[]; hallazgos: readonly Hallazgo[] }
export interface Arbol {                    // el puerto: lo único que se sabe del entorno
  leer(ruta: string): string | null
  listar(prefijo: string): string[]         // rutas de disco bajo un prefijo
  sinTrackear(prefijo: string): string[]    // git
  head(): { sha: string; fecha: string; limpio: boolean }
}
export function reconciliar(arbol: Arbol): readonly Comprobacion[]
```

**`campo: null`** es el caso «falta el bloque entero», y se distingue a propósito de «falta un campo»:
el mensaje del hook tiene que poder decir cuál de los dos es, por `RQ-CV-10`.

---

## 6 · Flujo de datos

    push
      │
      ├─ cli.ts modo hook ── por árbol del sha local ──┬─ detectar()  → ResultadoDeteccion
      │                                                └─ cabeceras() → ResultadoCabeceras
      │                                                          │
      └───────────────── informe() ── CINCO cifras ──────────────┘
                              │
                              └─ código 1 si bloquea cualquiera de las dos (OR), 2 si git falla

    npm run reconcile
      │
      ├─ adaptador: HEAD + limpieza + sin trackear + lectura de disco
      ├─ reconciliar(arbol) ── seis comprobaciones puras y ORDENADAS
      └─ informe determinista ─┬─ docs/sdd/RECONCILIACION.md
                               └─ código ≠0 sólo por la 1 o la 3

---

## 7 · `strict_tdd` — el rojo previo, pieza a pieza

**El runner es `npm test` (`vitest run`)**, `package.json:20` en `995adbc`. Regla de la tanda: donde
cabe rojo literal, se escribe el rojo literal; donde no cabe, va una **mutación declarada y revertida**
con `cmp` o `git diff`, y la reversión se comprueba, no se supone.

| # | Pieza | Rojo previo literal | Dónde |
|---|---|---|---|
| 1 | `comprobarCabeceras` | el módulo se importa y devuelve `{ comprobadas: 0, invalidas: [] }`; el caso «sin cabecera» espera una invalidez y recibe lista vacía | `citas/cabecera.test.ts` |
| 2 | `fuera-del-plan` + `motivo: ""` | espera `campo: 'motivo'`, recibe `[]` | idem |
| 3 | falta `origen_cabecera` | espera `campo: 'origen_cabecera'`, recibe `[]` | idem |
| 4 | dominio cerrado (`cierra: quizá`, `origen_cabecera: heredada`) | espera el campo y su dominio, recibe `[]` | idem |
| 5 | la forma pasa con contenido discutible (`tanda: F9-99`) | **control del otro signo**: espera `[]`, y una implementación que valide contenido lo pone rojo | idem |
| 6 | alcance: archivado sin cabecera | espera que el `proposal.md` bajo `openspec/changes/archive/` salga en `invalidas`, recibe `[]` | `citas/cli.test.ts` |
| 7 | quinta cifra | `expect(texto).toContain('cabeceras R-1 inválidas')` sobre `informe()`, que hoy imprime cuatro | `citas/informe.test.ts` |
| 8 | determinismo del barrido | dos llamadas seguidas sobre el mismo árbol sintético devuelven textos distintos | `reconciliacion/informe.test.ts` |
| 9 | código de salida | huérfana → espera ≠0, recibe 0; `esperas 4/11` → espera 0 | `reconciliacion/cli.test.ts` |
| 10 | comprobación 5 lee el código | árbol sintético con `ESTADOS_EN_ESPERA` de **once** y `cifras_ancladas` diciendo otra cosa: espera 11 | `reconciliacion/comprobaciones.test.ts` |
| 11 | comprobación 4 por campo | entrada sin `estado` → espera **defecto de registro**, recibe «vivo» | idem |

**Sin rojo literal — las cuatro mutaciones declaradas.** Son cambios documentales o de fichero
vigilado, así que el detector se prueba **ensuciando lo vigilado** (regla de mutación 2), nunca
retocando el guardián:

| Mut | Qué se ensucia | Qué tiene que ponerse rojo | Reversión comprobada |
|---|---|---|---|
| **M1** | una de las trece cabeceras reales, en memoria a partir del fichero real | el guardián del árbol real: catorce `proposal.md`, cero inválidas | la copia sucia vive en memoria; `git diff --quiet` sobre el árbol |
| **M2** | unificar el alcance de cabeceras con `EXCLUSIONES` | el caso 6: el archivado deja de verse | `git diff` del `cli.ts`, revertido y recomprobado |
| **M3** | quitar la regla (d) de `unidad_de_avance` en una copia del `config.yaml` | el guardián que exige cuatro ids `a,b,c,d` y las tres primeras intactas | `cmp` contra la copia previa al ensuciado |
| **M4** · posición | mover el barrido de cabeceras detrás del retorno del bucle por árbol | un push con **cita rota y cabecera inválida a la vez** deja de nombrar las dos | `git diff` del `cli.ts` |

**M4 es la regla de mutación 1 y no es opcional:** hoy el bucle por árbol
(`apps/desk/server/citas/cli.ts:162-169` en `995adbc`)
acumula el código de salida sin retorno temprano, así que mover el bloque **no rompe nada** si
no existe una prueba que active los dos defectos a la vez. Es exactamente el molde del H3 que
`CLAUDE.md` registra: cero solapamiento entre los casos y el orden sin probar.

**Tres guardianes existentes que esta tanda pone en rojo si se olvida:**

1. `apps/desk/server/citas/guardianes.test.ts:66-75` en `995adbc` exige que **todo** `.ts` no de
   prueba bajo `apps/desk/server/citas/` contenga las frases «código INERTE» y «NADA de producción lo
   importa». `cabecera.ts` nace con las dos o el guardián se pone rojo **sin que nadie haya roto nada
   funcional**.
2. `apps/desk/server/citas/guardianes.test.ts:50-55` en `995adbc` recorre el grafo de imports desde
   `apps/desk/server/index.ts` y exige que no alcance `citas/`. R2 lo **extiende** a
   `apps/desk/server/reconciliacion/`, con el control del otro signo que ya existe en
   `apps/desk/server/citas/guardianes.test.ts:57-64` en `995adbc`.
3. `apps/desk/server/citas/guardianes.test.ts:16-18` en `995adbc` exige que ningún fichero de texto
   trackeado sea binario para git. Los ficheros nuevos entran trackeados y sin NUL, o el ledger vuelve
   a contar de menos (desvío 2 de los tres).

**El arnés de pruebas ya existe y se reutiliza:** sus constructores
(`apps/desk/server/testing/reposDePrueba.ts:21-35` en `995adbc`)
arman citas **en tiempo de ejecución** para que el propio detector no lea las pruebas
como afirmaciones reales, y `apps/desk/server/testing/reposDePrueba.ts:51` en `995adbc` da el `Repo`
en memoria. Las pruebas de cabecera siguen esa misma regla: **ninguna escribe una cabecera literal con
un `tanda:` que exista**, porque el barrido de cabeceras del propio repositorio la leería.

---

## 8 · Cifras, con su momento

**La precisión es el MOMENTO, no el número.** Medir una cifra contra el instante equivocado es el
error que esta tabla existe para evitar.

| Cifra | Valor | Momento en que vale |
|---|---|---|
| Numerador | **4 derivables de cabecera · 7 declarados por commit · 11 de 52** | fijado por obs. #749; no lo mueve esta tanda |
| Cambios **fuera del plan** | **CINCO** | hoy y al cerrar. El «seis» de la bandeja es un off-by-one: `5+1+2 = 8` cierra sobre ocho archivados, `6+1+2 = 9` no |
| Capacidades | **17 → 18** | **al cerrar la tanda**, por `RQ-RC-09`: la declaración entra en el mismo cambio que crea la spec |
| Ficheros de spec | **9 al cerrar · 10 tras archivar** | **dos movimientos, dos momentos**: las delta specs se funden en `sdd-archive`, no en `apply` |
| `proposal.md` en el árbol | **14**, de los que **13 sin cabecera** | medido hoy; sólo el de F0-05 la lleva |
| Incumplimientos vivos | **5** de **12** entradas | el campo `estado` los hace escritos en vez de deducidos |

**Ninguno de los dos movimientos de capacidad/spec es una huérfana.** Huérfana es spec en disco sin
declaración, y aquí es al revés: declaración sin fichero, que es trabajo pendiente. La comprobación 1
sigue saliendo con código 0.

**Las tablas ancladas a `ce93480` —la del §3.2 del proposal y la de `RQ-RC-01`— siguen diciendo 17 a
propósito.** Renumerarlas a 18 las volvería falsas sobre su propia revisión: es el **caso B** de la
regla de mutación 4, y está escrito en el criterio 9 para que nadie las «repare».

---

## 9 · El anclaje de citas, como regla de diseño

**El hallazgo:** el ancla inline **se cae sola al DAR FORMATO al texto**. Las cuatro citas sin ancla
de la primera pasada de las delta specs no fueron descuido — el `` en `ce93480` `` se fue a la línea
siguiente **al justificar el párrafo**, sin que nadie tocara la cita. Lo único que el detector lee para
resolver la revisión (`REVISION_RE`, en `apps/desk/server/citas/cosecha.ts:63` en `995adbc`; la 62 es
el JSDoc) **lo rompe un reflujo de texto**. Es peor que lo registrado en `hallazgo_ancla_de_cabecera`
(`openspec/config.yaml:948` en `995adbc`), que sólo dice que una declaración de cabecera no ancla.

**Tres consecuencias operativas, que son diseño y no estilo:**

1. **Toda cita `ruta:línea` lleva ancla INLINE**, en la misma línea física, y se comprueba **con el
   regex, nunca a ojo** — el `REVISION_RE` real y el `NOMBRE_FICHERO` real, no un patrón aproximado.
2. **La medición se repite AL CERRAR CADA REBANADA**, no una vez al final. R1 ya inserta líneas en
   `CLAUDE.md` y en `openspec/config.yaml`, así que **las 20 citas del proposal quedan desfasadas antes
   de que R2 empiece**. Un barrido único al final mediría el desfase acumulado de las dos contra un
   documento que ya nadie ha vuelto a leer.
3. **Al reparar se lee qué AFIRMA la frase**, y se decide entre los tres casos —A presente, B
   histórico, C superado—. Renumerar a ciegas convierte un registro fechado en una afirmación falsa
   sobre el presente, y encima **parece** reparado.

**Este documento no cita con línea ningún fichero sin trackear** —ni `docs/sdd/ENTRADA.md`, ni los
tres documentos de encargo, ni los propios artefactos de `openspec/changes/F0-05/`—, porque una cita
anclada a una revisión donde el fichero no existe es una cita que no resuelve. Se nombran por sección.

---

## 10 · Decisiones que NO han llegado — **se construye sobre ellas DECLARÁNDOLO**

**Esta sección es retrospectiva, y es el punto nuevo de esta ronda.** `CLAUDE.md:411` en `995adbc`
fija que la bandeja **no es fuente**: la decisión vive en `openspec/config.yaml → decisiones_de_gerencia`,
con su respuesta textual, y si es gate además en su fila de la tabla §4.5 del plan. **Una decisión que
sólo esté en la bandeja no ha llegado: se trata como pendiente y se dice.**

**Verificado de disco, no supuesto:** `openspec/config.yaml:1237` en `995adbc` tiene
`decisiones_de_gerencia` con **UNA sola entrada** —`decision/tanda-por-contenido`,
`openspec/config.yaml:1238` en `995adbc`— y en `openspec/config.yaml:1259` en `995adbc` ya empieza
`unidad_de_avance`. **Ninguna** de las decisiones de hoy sobre F0-05 está ahí: viven en Engram y en el
`proposal.md`, que no es lo que la sesión carga al arrancar.

**Por tanto, y se escribe sin suavizarlo: por la regla que este mismo cambio construye, HOY NO HAN
LLEGADO.** Este diseño construye sobre ellas **declarándolo**, no dándolas por cargadas.

| # | Decisión | Engram | Dónde debe aterrizar | ¿Parece gate? |
|---|---|---|---|---|
| 1 | Alcance aprobado de F0-05: tanda de método, campo `estado` en las doce entradas de IV | obs. **#734** | `decisiones_de_gerencia` | Parece que sí: abre la tanda |
| 2 | Fila propia en el §5 y denominador **51 → 52**; capacidad no vacía | obs. **#735** | `decisiones_de_gerencia`. **Parcialmente aterrizada:** el movimiento del denominador está dentro de las `consecuencias` de la entrada existente, `openspec/config.yaml:1253-1254` en `995adbc`, y la fila la aplicó `ce93480`; **entrada propia no tiene** | No |
| 3 | **TRECE** cabeceras y el campo **`origen_cabecera`** | obs. **#740** | `decisiones_de_gerencia`, y además `CLAUDE.md` R-1 por trabajo de R1 | No: fija alcance dentro de una tanda ya abierta |
| 4 | Numerador **4 y 7, total 11 de 52** | obs. **#740**, fijado por **#749** | `decisiones_de_gerencia` y `unidad_de_avance` | No |
| 5 | Entrega en **dos rebanadas R1/R2**, con las dos salidas descartadas y el disparador de 420 retirado | obs. **#743**, **#744** | `decisiones_de_gerencia` | No: es decisión de entrega |
| 6 | Salida **(c)** para F0-04: su registro se cierra dentro de R1; y las **tres casillas** de rotación de secretos salen del recuento por la regla del ciclo 1 | obs. **#746** | `decisiones_de_gerencia` | Parece que sí: **cambia el alcance** de una tanda en vuelo |
| 7 | **`cierra: no`** para F0-04, con la salida (3) declarada disponible y no tomada | obs. **#749** | `decisiones_de_gerencia`; el desvío del staging, en la bandeja con dueño | Parece que sí: **mueve una fila del §5** |
| 8 | Ratificación de la capacidad **`reconciliacion`** como capacidad propia, contra el «Nuevas: Ninguna» del §10 aprobado; y las dos correcciones del mismo acto —la línea real de `REVISION_RE`, `apps/desk/server/citas/cosecha.ts:63` en `995adbc`, y **18 capacidades · 9 specs · 10 tras archivar**— | obs. **#750**, ratificada en **#752** | `decisiones_de_gerencia` **y** `capabilities`, esto último por `RQ-RC-09` dentro de R2 | No |

**Lo que este diseño NO hace con ellas, y es deliberado:** **no las escribe**. Quién las redacta y con
qué respuesta textual es decisión de Gerencia — `openspec/config.yaml:1234-1236` en `995adbc` dice
literalmente que se escribe la respuesta **textual y no un resumen**, porque un resumen es una
interpretación. Este diseño no toca `openspec/config.yaml` ni el plan.

### 10.1 · Sobre el «¿parece gate?» — se señala, no se decide

Un gate es, por la tabla §4.5, **una decisión que abre una tanda**: sus cuatro columnas son
`Clave Engram | Decisión | Tanda(s) que abre | Sesión prevista`
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:362` en `995adbc`). La columna marcada
arriba es **una señal, no un dictamen**.

**Si alguna resulta ser gate, su fila en §4.5 sería otra precondición documental — y no la llamo «la
tercera», porque contadas contra el fichero no son dos.** La primera es la del §8 del proposal (fila
F0-05 y denominador), **ya aplicada** por `ce93480`. La segunda que el documento menciona es
**hipotética y no se materializó**: colgaba de la salida (3) para F0-04, que Gerencia **no** eligió.
Así que hoy hay **una aplicada y ninguna viva**, y una fila de §4.5 sería una nueva.

**Precedente medido, que es lo que hace la pregunta legítima:** la decisión que abre F0-05 —
`tanda-por-contenido` — aparece en la columna «Decisión» de su fila,
`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:459` en `995adbc`, pero **no tiene fila
propia en la tabla §4.5**: el barrido del plan no la encuentra en ninguna otra línea. Se registra; no
se arregla.

### 10.2 · Una tensión viva entre dos ficheros que la sesión carga — se registra, no se resuelve

`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:360` en `995adbc` sigue diciendo que, cuando
una decisión se cierra, **«se guarda en Engram (`decision/<clave>`)»**. `CLAUDE.md:411` en `995adbc`
dice hoy que la decisión vive en `openspec/config.yaml → decisiones_de_gerencia`. **Los dos son
autoridad y no dicen lo mismo.** No es de este diseño decidir cuál manda: queda registrado, y es
exactamente el molde de divergencia que la comprobación 4 del barrido existe para enseñar.

---

## 11 · Las tres casillas de rotación de secretos — fuera del recuento

Van **declaradas aparte**, por la **regla del ciclo 1** de `CLAUDE.md`: una casilla cuyo dueño está
fuera del repositorio no la marca ninguna tanda.

| Casilla | Dónde se ejecuta | ¿Trabajo de repositorio? |
|---|---|---|
| `ZOHO_CLIENT_SECRET` + los tres refresh tokens (**atómica**) | gestor de secretos del despliegue | **No** |
| Los tres passwords de BD | gestor de secretos del despliegue | **No** |
| `hub_reader`, con su `ALTER SUBSCRIPTION … CONNECTION` | PostgreSQL de **producción** | **No** |

- **Dueño:** Gerencia. **Destino:** el runbook
  (`docs/runbooks/verificaciones-pendientes-F0.md:98-100` en `995adbc`), que lleva las mismas tres con
  su orden y su aviso de atomicidad. Su origen está en
  `openspec/changes/F0-04/proposal.md:182-184` en `995adbc`.
- **Y se dice explícitamente: archivar NO las da por hechas.**
- **La cláusula inversa está comprobada antes de escribirlo**, que es lo que separa aplicar la regla de
  maquillar el contador: ninguna de las tres describe trabajo que una tanda pueda hacer aquí.
- `tasks.md` lo ejecuta: van en sección propia, **fuera del recuento de tareas**.

---

## 12 · Matriz de amenazas — aplicabilidad

Aplica: hay hook de `pre-push`, subprocesos de git y un script de `npm` nuevo.

| Frontera | Aplicabilidad | Respuesta de diseño | Rojo previo |
|---|---|---|---|
| Rutas con aspecto de documentación | **Aplicable**: un `proposal.md` es texto, y el hook decide sobre él | G2 filtra por patrón exacto `openspec/changes/**/proposal.md` sobre rutas **trackeadas**; nada se ejecuta, sólo se lee | caso 6 de §7, más un fichero llamado `proposal.md` fuera de `openspec/changes/` que **no** debe entrar |
| Selección del repositorio (`git -C`, rutas relativas y absolutas) | **Aplicable**: D6 lanza git | El adaptador recibe `cwd` explícito, como `apps/desk/server/citas/cli.ts:136` en `995adbc`; nunca depende del directorio del proceso | prueba en repositorio sintético con `cwd` distinto del proceso |
| Estado del índice (staged, `commit -a`, índice vacío) | **Aplicable**: D8 mide el árbol de trabajo | El informe declara `HEAD` **y** si el árbol está limpio; no se lee el índice | árbol sucio → el informe lo dice; árbol limpio → no |
| Estado del push (rama de seguimiento, primer push, refspec explícito) | **N/A para lo nuevo**: el barrido de cabeceras **no** usa el índice remoto; su alcance es el árbol del sha local, sin comparación con el remoto | — | — |
| Órdenes de PR | **N/A**: esta tanda no automatiza PRs ni ejecuta `gh` | — | — |

**Ninguna sentencia SQL en toda la tanda**, así que la segunda regla de `rules.design`
(`openspec/config.yaml:1389` en `995adbc`, calificar el esquema) no tiene caso aquí. Se dice en vez de
omitirse.

---

## 13 · Reversión

Cada pieza revierte sola y ninguna deja estado: la comprobación de forma es un commit sobre `citas/`,
las cabeceras son **líneas añadidas**, `reconcile` es un módulo nuevo más una entrada en
`package.json`, y `RECONCILIACION.md` es generado. **La única reversión con coste es la segunda copia
de la cabecera de `orden-precedencia-guardas`**, que vive en el worktree `f1b-10-r1`: si se revierte en
`main`, hay que revertirla también allí, y por eso es tarea con casilla y no nota.

---

## 14 · Preguntas abiertas

- [ ] **D7 · la fecha del informe.** Si Gerencia lee en `RQ-RC-01` el reloj y no la fecha del commit,
      cambia una línea del render. No bloquea el diseño; sí conviene decidirlo antes de fijar el
      primer `RECONCILIACION.md`, porque el fichero es el que después se diffea.
- [ ] **§10 · las ocho decisiones que no han aterrizado.** Bloquean sólo si alguien tiene que
      reconstruirlas sin esta sesión delante. Dueño: Gerencia.
- [ ] **La fila F0-05 declara UNA capacidad y la cabecera declara DOS.**
      `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:459` en `995adbc` pone
      `citas-verificables` en su columna; la cabecera del `proposal.md` declara
      `[citas-verificables, reconciliacion]` desde que el §10 cambió. **Se registra y no se arregla:**
      esta tanda no toca el plan (§2 del proposal), y es el primer desvío que el propio mecanismo
      produce sobre sí mismo — material de la bandeja, con dueño, no de este diseño.
