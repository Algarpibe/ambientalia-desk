# Propuesta: el detector de citas se impone en `pre-push`, y la regla 4 deja de depender de que alguien se acuerde

**Tanda · base `648432d` (rama `main`) · talla declarada S**

La regla de mutación 4 (`CLAUDE.md:171-205` en `648432d`) manda barrer las citas `ruta:línea` cuando una
tanda mueve líneas en un fichero citado. Está escrita desde `98f3af1` y **se incumplió dos veces en la
misma sesión que la escribió**. Esta tanda construye el detector que la comprueba y lo cablea a un hook
de `pre-push` versionado, para que el incumplimiento **pare el push** en vez de quedar anotado.

> ### Procedencia de cada cifra — tres niveles, y se declaran
>
> 1. **Verificado de disco en este contexto**, con ruta y línea. Todo lo que cita `vitest.config.ts`,
>    `Dockerfile`, `.dockerignore`, `package.json`, `ci.yml`, `tsconfig.server.json`, `CLAUDE.md`,
>    `openspec/config.yaml`, `DEPLOY.md` y el maestro; y `git shortlog -sne --all`, que hoy da **767 de
>    767** commits de una identidad (el `766` del §7 es de antes de `648432d`).
> 2. **Medido en el terminal orquestador de esta sesión y registrado como tal**: el censo de 1.873
>    citas y su reparto, las 43 rotas del sondeo, los 663
>    ficheros trackeados, la tabla de tres variantes de la guarda del `prepare`, los tiempos del §7 y
>    el reparto de abreviadas huérfanas del §3 Pieza 2. **No reverificado aquí**, y por la regla de
>    método eso las hace de segunda mano: se usan para decidir, no como prueba. La cifra definitiva de
>    citas rotas **la produce el detector de esta tanda** (§3, Pieza 3).
> 3. Lo demás lleva la palabra **hipótesis** delante.

> ### ⚠️ Dos convenciones de cita que esta propuesta se aplica a SÍ MISMA
>
> **1 · Toda cita a un fichero que ESTA tanda modifica va ANCLADA a `648432d`.** Son cuatro:
> `CLAUDE.md`, `openspec/config.yaml`, `package.json` y `DEPLOY.md`. La forma es la que ya usa el
> repositorio —«`CLAUDE.md:249` en `648432d`»— y **el anclaje va cita por cita, no en una nota de
> cabecera**: el detector sólo reconoce el ancla cuando está junto a la cita, porque es lo que le dice
> qué revisión pasarle a `git show`. Una declaración global no la lee nadie, y las citas seguirían
> siendo afirmaciones sobre el presente. El porqué está medido en el §3, Pieza 3.
>
> **⚠️ Y el ancla NO se parte por el salto de línea.** Es el mismo modo de fallo de la abreviada
> huérfana, un nivel más arriba: si «en `648432d`» cae en la línea siguiente, un detector que lea por
> línea física ve una cita **del presente** y el ancla, para él, no existe. Al barrer este propio
> fichero salieron **dos** así —una en esta cabecera y otra en la Pieza 2— y están reparadas moviendo
> el corte, no el texto. Va como nota para `sdd-design` junto a la de las abreviadas.
>
> **2 · Esta propuesta NO cita sus propias líneas, ni las de ningún artefacto de la tanda.** Un
> artefacto que se cita a sí mismo se rompe con su propia siguiente edición, y no hay revisión a la
> que anclarlo porque todavía no existe. Los ejemplos internos se nombran en prosa —«el párrafo que
> habla de X»—, no con forma de cita. Es la decisión Q6 del §13 aplicada al artefacto que la escribe.

> **La regla `rules.proposal` de `openspec/config.yaml:964` en `648432d` — «cada propuesta cita el
> apartado del maestro del que sale» — NO APLICA aquí, y se dice en vez de forzarla.** Esta tanda no
> sale del maestro: sale de una regla de método del propio repositorio
> (`CLAUDE.md:171-205` en `648432d`) y de una decisión del 2026-09-13 (Engram `decision/detector-citas-pre-push`,
> obs. 513). Lo más parecido que tiene el maestro —«Toda respuesta cita su fuente, con documento y
> versión. Sin cita verificable, la respuesta no se emite»,
> `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.1.md:2793`, leído de primera
> mano— es una **regla de diseño de la capa RAG de M12.3**, sobre las respuestas del copiloto, no sobre
> las citas del repositorio. Presentarla como fuente sería exactamente la cita estirada que la regla de
> método castiga.
>
> *Esa cita va con la **ruta completa** a propósito: `R08.1.md` a secas es **subcadena del basename**,
> no sufijo de ruta, así que el detector no la resolvería y la saltaría informando (Pieza 2). Escribirla
> entera la vuelve comprobable, que es justo lo que esta tanda predica.*

---

## 1 · Intención

| | |
|---|---|
| **El problema** | Una cita `ruta:línea` en prosa **no la ve nadie**: ni `tsc`, ni `eslint`, ni las pruebas. Cuando una tanda inserta o mueve líneas, las citas que apuntan al fichero se desfasan en silencio y el registro sigue pareciendo correcto. `CLAUDE.md:186-190` en `648432d` lo mide: `4359b28` añadió 6 líneas de comentario en `estados.ts` y desfasó ~20 citas; el barrido de reparación de `30e698c` **dejó 16 más**, una de ellas apuntando a una línea vacía |
| **Por qué ahora** | Porque la regla ya existe y **no bastó**. Está escrita desde `98f3af1` y se incumplió dos veces en su propia sesión. Una regla que sólo vive en un documento es la tercera versión del mismo fallo: primero no había regla, luego hubo regla sin detector, y ahora hay detector sin imposición |
| **Éxito** | Que un push que desfasa una cita **no salga**, con el nombre del fichero, la línea y el porqué; y que lo que el detector NO puede comprobar —si la línea dice lo que la frase afirma— quede escrito **en su propio mensaje**, no sólo en la spec |

**⚠️ El dato vivo de esta misma sesión, y es el mejor argumento que tiene la tanda: CINCO citas
desfasadas, y las CINCO por un extremo del RANGO.** Al preparar esta propuesta, cinco de las citas que
llegaron por prompt tenían el rango desplazado, y ninguna de las cinco falló por el número suelto: falló
el principio o el final del rango. Dos ejemplos, verificados de disco sobre `648432d`: la regla de
mutación 4 se citó como el rango 148-182 cuando vive en `CLAUDE.md:171-205` en `648432d` —23 líneas de
desfase—, y la regla del ciclo 1 como el rango 329-347 cuando es `CLAUDE.md:330-349` en `648432d`, **mal
por los dos extremos**: el inicio caía en una línea en blanco y el final cortaba el párrafo del reverso
por la mitad. *(Los dos rangos erróneos van escritos **sin forma de cita**, por la decisión Q6: con
`fichero:línea` el detector los trataría como citas de verdad y bloquearía el push por los ejemplos.)*

**Y se cuenta sin adornarlo: quien escribió la regla la incumplió cinco veces mientras escribía la tanda
que la impone.** Con dos matices que la honestidad exige. Primero, un prompt **no es un fichero
versionado**, así que el detector no habría cazado ninguna de las cinco — no son un caso de uso, son una
**medición de frecuencia**. Segundo, y es lo que sí es carga: que las cinco fueran del rango y ninguna
del número suelto convierte el «los rangos se desfasan por los dos extremos» de
`CLAUDE.md:180` en `648432d` en el modo de fallo **dominante**, no en una nota al pie. Por eso el rojo
(c) del §4 y la mutación M4 comprueban el extremo **final** con el inicial correcto a propósito: es la
mitad que se escapa.

**El dato que decide la forma, y su condición de escalada.** `git shortlog -sne --all` da **767 de 767**
commits de una sola identidad: el inconveniente clásico del hook local —que no todo el equipo lo
tiene— no aplica hoy. **La condición de escalada la vigila el propio hook** (decisión Q5, §13): en cada
push ejecuta ese comando y, si aparece **más de una identidad**, imprime un **aviso visible sin
bloquear** que nombra la salida —añadir el job de CI con `fetch-depth: 0`—. El CI de hoy no puede
sustituir al hook: `ci.yml:21` es `actions/checkout@v4` **sin `fetch-depth`**, así que no podría
comprobar las citas ancladas a revisión, y además pondría el build en rojo **después** del push.

---

## 2 · Alcance

### Entra

1. **El detector**, en una carpeta hermana de `apps/desk/server/` (§3, Pieza 4), con su CLI y sus
   pruebas. Sólo comprueba lo **mecánico** (§3, Pieza 6).
2. **El alcance del barrido: «lo que el push pone en juego»** — unión de las citas que *viven en* un
   fichero que el push cambia y las que *apuntan a* uno que el push cambia (§3, Pieza 1).
3. **La regla de resolución de rutas** (§3, Pieza 2).
4. **La línea base de citas ya rotas**, versionada, **generada por el detector** y que **sólo puede
   encoger** (§3, Pieza 3).
5. **El aviso de la condición de escalada** en el propio hook: `git shortlog -sne --all`, y con más de
   una identidad un aviso visible **que no bloquea** (§3, Pieza 6), con prueba de los dos signos.
6. **El hook**, en `.githooks/pre-push`, con `core.hooksPath` (§3, Pieza 5).
7. **El instalador**: un `.mjs` con la guarda en Node, invocado desde un script `prepare` nuevo
   (`package.json:10-23` en `648432d` no lo tiene), más una línea en `DEPLOY.md`.
8. **Fila de incumplimiento vivo nueva (IV-10)** en `CLAUDE.md` y en `openspec/config.yaml`, con la
   cifra y la fecha de medición, apuntando a la línea base, y con la frase que Gerencia fijó en Q4:
   **«la base no encoge hasta que Gerencia asigne quién la repara»**.
9. **Una frase nueva en la regla de mutación 4 de `CLAUDE.md`** (decisión Q6): «un ejemplo de cita rota
   se escribe sin forma de cita, o el detector lo tratará como rota». Va en la **unidad de trabajo 2**
   (§11).
10. **El anclaje a `648432d` de todas las citas de los artefactos de esta tanda** a los cuatro ficheros
    que la tanda modifica (decisión Q7).

### No entra

- **Lo semántico.** Que la línea diga lo que la frase afirma sigue siendo trabajo de una persona
  (§12). El detector no lo intenta y su mensaje lo dice.
- **El job de CI con `fetch-depth: 0`.** Es la **condición de escalada**: el hook la vigila y avisa,
  pero no la construye.
- **Reparar las ~43 citas ya rotas.** Van a la línea base. Repararlas no es renumerar: son los tres
  casos A/B/C de `CLAUDE.md:195-199` en `648432d`, y elegir entre ellos exige leer qué afirma cada
  frase.
- **Desambiguar las 145 citas ambiguas** (decisión Q1): es una migración con decisión de alcance.
- **Barrer `openspec/changes/archive/`.** Es registro fechado. Medido: las **20** citas al fichero
  `CLAUDE.md` con número de línea que hay en el repositorio están **todas** dentro del archive, y una
  de ellas —en el `proposal.md` de `por-entregar-es-espera`— apunta a la línea 206 de `CLAUDE.md`, que
  **hoy está vacía**. Es el caso B de la regla 4 y **se queda como está**.
- **Ficheros sin trackear.** Los 8 de hoy quedan fuera por construcción, sin lista de exclusión.
- **Hooks de `pre-commit` o `commit-msg`.** Un hook por push, y sólo uno.
- **Renumerar citas automáticamente.** Un barrido que renumera a ciegas convierte un registro fechado
  en una afirmación falsa y **parece** reparado (`CLAUDE.md:201-205` en `648432d`).
- **Tocar `.git/hooks`** (se pierde con cada clon), los umbrales de `vitest.config.ts:58-63`, ni
  instalar `husky`, `lint-staged`, `jsdom` o `@testing-library`.
- **`--no-verify`. Nunca.** El push que cierre esta tanda es la primera ejecución real del hook.

---

## 3 · Enfoque, pieza a pieza

### Pieza 1 · El alcance: «lo que el push pone en juego»

Unión de dos conjuntos: las citas que **viven en** un fichero que el push cambia **más** las que
**apuntan a** un fichero que el push cambia. Cuatro precisiones, y cada una tapa un modo de fallo:

1. **El rango sale de la ENTRADA del hook, no de `HEAD~1`.** Git pasa por stdin una línea por
   referencia: `<ref local> <sha local> <ref remota> <sha remoto>`. Los cambiados son
   `git diff --name-status -M <sha remoto> <sha local>`. Un push lleva muchos commits y `HEAD~1` sólo
   ve el último. **Rama nueva** (sha remoto todo ceros): comparar contra `git merge-base` con
   `origin/main`. **Borrado de rama** (sha local todo ceros): nada que comprobar, salir con 0.
2. **Borrados y renombrados cuentan como cambiados.** `-M`, y tratar los estados `D` y `R`: borrar o
   renombrar rompe **todas** las citas que apuntan al fichero, y sin `-M` el renombrado no se ve como
   tal.
3. **Se verifica contra LO QUE SE EMPUJA**, no contra el árbol de trabajo: `git show <sha local>:<ruta>`.
   El árbol puede tener ediciones sin commitear que no viajan en el push. Las ancladas, contra su
   propia revisión.
4. **Un push que sólo mueve líneas en un fichero citado —sin tocar ningún fichero que lo cite— TIENE
   QUE BLOQUEAR.** Es el caso exacto de `30e698c`, y es lo que distingue este alcance de «las citas de
   los ficheros que editas». Va como mutación obligatoria (M1).

### Pieza 2 · Cómo se resuelve la ruta

Medido sobre 1.873 citas (nivel 2 de procedencia): **597** son ruta completa trackeada; **1.006**
resuelven por sufijo de ruta a un único fichero; **145** son **ambiguas** (`repo.ts`→4 candidatos,
`migrate.test.ts`→3, `transitions-st/spec.md`→3); **125** no resuelven a nada. Suman 1.873.

**La regla, decidida por Gerencia (Q1 y Q2, §13):**

| Caso | Cuántas hoy | Qué hace el detector | Por qué |
|---|---|---|---|
| Ruta completa o **sufijo con frontera de segmento** (`<ruta> === <algo>` o `<ruta>` termina en `/<algo>`) a **un** candidato | 1.603 | **Comprueba y bloquea** si está rota | Es el 86 % del censo con una verdad única |
| **Ambigua** (varios candidatos) | 145 | **Comprueba en TODAS.** Bloquea **sólo si está rota en todas**; si alguna la valida, se **salta e informa** | Una cita ambigua no tiene verdad única, pero si **ninguna** candidata la sostiene está rota sea la que sea. Bloquear cualquier ambigua obligaría a desambiguar 145 citas a mano antes de poder instalar el hook: eso es una migración, no esta tanda |
| **No resuelve y el token lleva `/`** | parte de las 125 | **Bloquea** como «fichero inexistente» | Es exactamente el caso de la precisión 1.2: un borrado o un renombrado rompe las citas que apuntan al fichero |
| **No resuelve y el token NO lleva `/`** | parte de las 125 | **Se salta e informa** | `R08.1.md` no es sufijo de ruta sino **subcadena del basename** de `docs/Manifesto/Desk2.0_..._R08.1.md`, y `app.test.ts` no existe. Resolver por subcadena haría casar `.ts:5` con cualquier fichero; bloquear todo lo que no resuelva convertiría cualquier `x.ts:5` escrito en prosa en un push parado |
| `<algo>` resuelve a un **directorio** del árbol | — | Se salta e informa | Una cita a un directorio con número de línea no es comprobable |

**⚠️ Precedencia: la coincidencia EXACTA gana al sufijo. Sin esta regla, la mitad de las citas de esta
propia tanda quedarían ambiguas y se saltarían.** Medido de disco: **`package.json` tiene cinco
candidatos trackeados** —la raíz más `apps/desk`, `apps/hub-sync`, `packages/shared` y
`packages/zoho-sync`, por los workspaces que declara la propia raíz—, así que con sufijo a secas **toda**
cita a `package.json` sería ambigua y el detector la saltaría informando. Con la precedencia, el nombre
pelado resuelve a la raíz, que es lo que quiere decir quien lo escribe. **Control del otro signo:**
`ci.yml` **no** tiene coincidencia exacta y resuelve por sufijo a `.github/workflows/ci.yml`, el único
trackeado — los quince homónimos de `node_modules` no compiten porque no están trackeados, que es
exactamente el alcance (a) haciendo su trabajo.

**Se mantiene lo que ya hacía el prototipo, con la atribución corregida por el requisito (c) de abajo:**
la forma **abreviada** (`` `:N` ``) se atribuye al último fichero **anterior a ella** en la misma línea
física —y si no hay ninguno, se informa y no bloquea—; y la **anclada** («`<ruta>:<N>` en `` `<rev>` »`)
se comprueba con `git show <rev>:<ruta>`, con **revisión inexistente → bloquea**.

#### Cuatro requisitos de la cosecha, cada uno con su control de dos signos

Salieron de verificar esta misma propuesta. Con el patrón del sondeo, **siete de sus ocho abreviadas
salían huérfanas** y las citas a `Dockerfile` y a `ci.yml` **ni se cosechaban**; con los cuatro
requisitos, las ocho quedan atribuidas y todas las citas completas se cosechan. **Control verificado
con citas sembradas** (nivel 2 de procedencia, 2026-09-13): los cuatro casos válidos pasan, los cuatro
rotos bloquean, y la variante que incumple cada requisito deja escapar su caso roto.

| Req. | Qué exige | Control de dos signos | Qué pasa si no se cumple |
|---|---|---|---|
| **(a)** | El patrón del nombre **NO es una lista de extensiones** | Una cita válida a `Dockerfile` → 0 **y figura entre las comprobadas**; la misma con la línea fuera de rango → ≠ 0 | Con lista de extensiones, `Dockerfile` y `ci.yml` **no se cosechan**: la rota sale verde, y la válida también sale 0 sin haberse mirado |
| **(b)** | El nombre **puede empezar por punto** | Una cita válida a `.dockerignore` → 0 y comprobada; fuera de rango → ≠ 0 | Se cosecha `dockerignore` sin el punto, que no resuelve ni lleva `/`: **se salta informando** y la rota sale verde |
| **(c)** | La abreviada se atribuye al último fichero **ANTERIOR a ella por índice** en su línea, no al último de la línea | Línea «fichero A, abreviada, fichero B» con esa línea válida en A y vacía en B → 0; con A y B intercambiados → ≠ 0 | Atribuyendo al último de la línea, **las dos salidas se invierten**: falso positivo en la primera, escape en la segunda |
| **(d)** | La **mención pelada** de un fichero —sin número de línea— cuenta como fichero al que atribuir, **siempre que resuelva a un fichero trackeado** por la regla de esta Pieza | El párrafo de la Pieza 4 que nombra `.dockerignore` con tres abreviadas: las tres van a `.dockerignore`, no a `.git` ni a `docs`, que están entre medias → 0; la misma frase con una abreviada fuera de rango → ≠ 0 | Sin (d), las tres quedan **huérfanas** y la rota sale verde. Y si capturase **cualquier** token pelado, resuelva o no, la abreviada iría a `.git` (no trackeado) o a `docs` (directorio): **se salta** y también sale verde |

El segundo signo de (a) y (b) no es «sale 0», sino **«figura entre las comprobadas»**: una cita que no se
cosecha también sale 0, así que un control que sólo mirase el código de salida no distinguiría la
cita válida de la ignorada. Mutaciones M24 a M27 (§6).

⚠️ **El hueco queda declarado, no disimulado.** Las ambiguas que alguna candidata valida y las no
resueltas sin `/` son citas que el detector **no** comprueba. Es el molde que ya nombra
`CLAUDE.md:66-67` en `648432d` —«un detector que no caza todo lo que la afirmación abarca»—, y el mensaje
del hook imprime **las dos cifras** en cada ejecución: lo comprobado y lo saltado. Un detector que sólo
informara de sus aciertos mentiría por omisión.

⚠️ **Si el detector definitivo encuentra tokens con `/` sin resolver sobre el árbol de hoy, van a la
línea base.** Para eso existe (Pieza 3), y es lo que hace viable la precondición dura del §8.

> #### 📐 Nota para `sdd-design` — NO es una decisión de esta propuesta
>
> La atribución de la abreviada «al último fichero **anterior** de la **misma línea física**» tiene un hueco que hay
> que dimensionar antes de implementarla: el markdown del repositorio corta a ~100 columnas, así que
> una abreviada puede quedar **huérfana** en la línea siguiente a su nombre de fichero y **saltarse en
> silencio**. Pasa dentro de esta propia propuesta: el párrafo de la Pieza 3 que nombra la tabla de
> IV-9 llevaba una abreviada sin fichero en su línea física, y por eso aquí está reescrita como cita
> completa y anclada.
>
> **Medido (nivel 2 de procedencia), para que el diseño decida con número y no con intuición:** en la
> **versión anterior** de esta propuesta, **6** abreviadas con fichero en su línea física y **14 sin
> él**. **Hoy, 8 con y 0 sin**: las de los cuatro ficheros de la tanda se reescribieron como citas
> completas, y las ocho que quedan las atribuye el patrón de los requisitos (a) a (d). En todo el
> repositorio sin `archive/`: con el patrón del sondeo, **456 con** fichero y **683 SIN** él —el
> **60 %**—; **con los requisitos (a) a (d), 336 con y 803 sin, el 71 %** (1.139 abreviadas, medido el
> 2026-09-13 sobre `648432d`). Sube porque (c) exige que el fichero vaya **antes**: de las 803, **649** no
> tienen ningún fichero en su línea, **106** lo tienen sólo **detrás** —la forma «`` `:N` `` de
> `fichero`»— y **48** van tras un nombre que no resuelve (desglose aproximado).
>
> `sdd-design` decide si la atribución mira también la línea anterior, el párrafo entero o el fichero
> que va detrás, y **declara el hueco que deje**. Lo que no cabe es dejar el 60-71 % saltándose sin
> decirlo. Y lo que decida mueve el tamaño de la línea base: R-14.
>
> **Y el mismo problema tiene el ANCLA, un nivel más arriba.** Si «en `` `<rev>` »` cae en la línea
> siguiente a su cita, un detector por línea física la lee como cita del presente y el ancla no
> protege nada — que es justo lo contrario de para lo que se puso. Salieron **dos** casos así en esta
> propuesta, reparados moviendo el corte de línea. `sdd-design` decide si la detección del ancla mira
> la línea siguiente, y **declara el hueco si no lo hace**.

### Pieza 3 · La línea base: sólo encoge

1. Un fichero versionado con las entradas exactas: **fichero, línea de la cita y cita literal**. El
   hook **informa** de las que estén en él; no bloquea.
2. **Sólo puede ENCOGER.** Si una entrada de la base ya no está rota, el hook **falla** hasta que se
   quite de la base. Sin eso, la base silencia para siempre citas ya correctas y se podre.
3. **Una cita rota que NO está en la base bloquea, siempre.** La base **no crece desde el hook**:
   añadir una entrada exige editar el fichero a mano, y eso se ve en el diff.
4. **Se GENERA con el detector definitivo.** El sondeo del terminal dio 43 rotas (13 en
   `docs/sdd/F0-00_Baseline_as-built.md`, 11 en `docs/superpowers/plans/`, 14 en `openspec/specs/`, 1
   en `packages/zoho-sync/src/db/rows.ts`, 4 en otros) **y 2 falsos positivos por no leer anclas**. Esa
   cifra es orientativa: la definitiva sale del detector de esta tanda.
5. Fila de incumplimiento vivo nueva —**IV-10**— en `CLAUDE.md` (donde `CLAUDE.md:249` en `648432d`
   dice «**Cuatro** desvíos vivos» y la tabla de `CLAUDE.md:262-265` en `648432d` tiene cuatro filas:
   pasan a **cinco**) y en `openspec/config.yaml`, tras el final de IV-9
   (`openspec/config.yaml:798` en `648432d`). **Destino: SIN ASIGNAR**, y por decisión Q4 la fila lo
   dice con estas palabras: **«la base no encoge hasta que Gerencia asigne quién la repara»** — sin
   dueño **decidido explícitamente, no por omisión**.

#### ⚠️ La medición del desfase, REHECHA incluyendo los artefactos de esta tanda (decisión Q7)

**La versión anterior de este párrafo era falsa, y el modo de fallo es exactamente el que la tanda
persigue.** Decía que insertar IV-10 «no desfasa ninguna cita en alcance», y se había medido **antes de
que esta propuesta existiera**: era cierta entonces. La propuesta añade **23 citas a `CLAUDE.md`** y
**10 a `openspec/config.yaml`** (13 y 9 distintas; eran ~15 y ~7 cuando se escribió este párrafo), y **hasta que se archive está dentro del alcance del hook**.

**Simulación de la inserción — es una ILUSTRACIÓN, no una cifra.** Se toman las 22 citas distintas de
esta propuesta a `CLAUDE.md` (13) y a `openspec/config.yaml` (9), se **desanclan a propósito** para ver
qué haría el detector sin el ancla, se inserta IV-10 y se compara el **contenido** de cada extremo antes
y después, no sólo si queda vacío (nivel 2 de procedencia, 2026-09-13, sobre `648432d`). El
desplazamiento va **declarado en cada fila**, porque el reparto depende de él y el real todavía no
existe: lo fija el diff de la unidad de trabajo 2.

⚠️ **La tabla va deliberadamente SIN forma de cita** (decisión Q6). Escrita con `fichero:línea`, el
detector la leería como citas de verdad y **bloquearía el push por los ejemplos** — exactamente lo mismo
que pasaba con el ejemplo del archive del §2.

| Cita (nombrada sin forma de cita) | Desplazamiento declarado | Hoy | Tras insertar | ¿La caza el detector? |
|---|---|---|---|---|
| rango 315-321 de `CLAUDE.md` | +1, tras la fila de IV-9 (línea 265) | la 315 abre el punto del preflight | la 315 pasa a ser «- Configuración», la línea de encima; la 321 también cambia | **NO. Contenido equivocado en los dos extremos, en rango y no vacío** |
| rango 330-349 de `CLAUDE.md` | +1, tras la 265 | la 330 es el título de la regla del ciclo 1 | la 330 pasa a ser **LÍNEA VACÍA** (hoy la 329) | **SÍ, bloquea** |
| rango 347-349 de `CLAUDE.md` | +1, tras la 265 | la 347 abre el reverso | la 347 pasa a ser **LÍNEA VACÍA** (hoy la 346) | **SÍ, bloquea** |
| rango 353-356 de `CLAUDE.md` | +1, tras la 265 | la 353 abre el enunciado de la regla del ciclo 2 | la 353 pasa a ser **LÍNEA VACÍA** | **SÍ, bloquea** |
| línea 837 de `openspec/config.yaml` | +20, tras el final de IV-9 (línea 798) | el peso del blueprint | una cita a otro documento | **NO. Contenido equivocado** |
| línea 964 de `openspec/config.yaml` | +20, tras la 798 | la regla `rules.proposal` | texto de otro apartado | **NO** |
| línea 980 de `openspec/config.yaml` | +20, tras la 798 | `tdd: true` | una ruta de otro apartado | **NO** |
| línea 981 de `openspec/config.yaml` | +20, tras la 798 | `test_command: "npm test"` | **LÍNEA VACÍA** | **SÍ, bloquea** |
| las 14 restantes: a `CLAUDE.md` los rangos 66-67, 171-205, 177-179, 186-190, 195-199, 201-205 y 262-265 y las líneas 180 y 249; a `openspec/config.yaml` el rango 25-30 y las líneas 20, 29, 30 y 798 | — | ok | ok | no se desplazan: van **antes** del punto de inserción |

**Cuenta de la ilustración:** de las **ocho** citas desplazadas, el detector caza **cuatro** y **se le
escapan cuatro**. *(La versión anterior de esta tabla decía «caza dos, escapan tres», y era falsa:
ponía el rango 315-321 entre los no afectados, aunque va detrás de la inserción; omitía los rangos
330-349 y 347-349; y comprobaba si el extremo quedaba vacío, no si cambiaba de contenido.)*

**Y el reparto cambia con cada línea insertada**, barrido sobre las mismas citas:

| Desplazamiento declarado | Caza | Se escapan |
|---|---|---|
| `CLAUDE.md` +1 | 3 (rangos 330-349, 347-349, 353-356) | 1 |
| `CLAUDE.md` +2 | 1 (rango 315-321) | 3 |
| `CLAUDE.md` +5 | **0** | **4** |
| `openspec/config.yaml` +20 | 1 (línea 981) | 3 |
| `openspec/config.yaml` de +25 a +40 —lo que estima el §11— | **0** | **4** |

La ilustración **no modela la frase de Q6**, que entra dentro de la regla de mutación 4 y desplaza
además todo lo que quede detrás de su punto de inserción, que tampoco está fijado.

**La conclusión se mantiene, y no depende del desplazamiento:** con **todos** los valores barridos se
escapa al menos una cita, y con varios se escapan todas. El anclaje a `648432d` **no es una mejora de
estilo: es lo único que protege a las que se escapan**, porque una cita desplazada a contenido
equivocado es **mecánicamente válida** —existe el fichero, la línea está en rango y no está vacía—.
Contra eso el detector no puede nada, y por eso las citas de esta tanda a los cuatro ficheros que toca
van ancladas, cita por cita.

**Y un dato sobre el método que explica por qué se pasó por alto:** las dos citas a las líneas 980 y 981
estaban escritas como **abreviadas** —sin nombre de fichero—, detrás de la cita completa a
`openspec/config.yaml`. Un barrido con el patrón `config\.yaml:[0-9]+` **no las ve**. Es el mismo hueco que la regla 4 ya nombra para la
forma abreviada, y es la razón de que la medición de abajo **cuente las abreviadas como citas de pleno
derecho**.

**Cuándo se comprueba, y es lo que cambia el criterio de aceptación:** la comprobación se hace **al
final, sobre los artefactos ya commiteados** —proposal, spec, design, tasks— y sobre `CLAUDE.md` y
`openspec/config.yaml` **ya con IV-10 dentro**. Sobre el árbol intermedio no vale: es justo el estado
en el que la medición anterior salió cierta y luego dejó de serlo.

### Pieza 4 · Dónde vive: carpeta hermana, NO `testing/`

`vitest.config.ts:53` incluye `apps/desk/server/**` en la cobertura y `:57` **excluye**
`**/testing/**`, con umbrales 92/92/96/78 en `vitest.config.ts:58-63`. En `testing/` sería la única pieza
del servidor cuya cobertura no mide nadie — y esa carpeta está excluida porque guarda el **arnés de
pruebas** (`testing/appHarness.ts`, `testing/superficieSaliente.ts`), que es justo lo que el detector
no es.

Hermanas de hoy, verificadas: `auth/`, `db/`, `routes/`, `services/`, `testing/`, `util/`. Se propone
**`citas/`** (`sdd-design` fija los nombres de fichero). En una hermana: typecheck sí, gratis
(`tsconfig.server.json:12`, `server/**/*.ts`); las pruebas corren (`vitest.config.ts:17-20`); y la
**cobertura CUENTA** contra el 92 % — con su coste: si el detector queda poco probado, arrastra la
cifra global. Bajo `strict_tdd` no debería pasar; si pasa, **es la señal**, y `vitest.config.ts:36-39`
ya dice que bajar el umbral exige una línea de justificación en el commit.

Dos cosas van escritas **en el propio fichero**:

1. **Viaja a la imagen de producción y es código inerte allí.** `Dockerfile:18` copia `apps` entera;
   `.dockerignore` deja fuera `.git` (`:3`), `docs` (`:10`) y `*.md` (`:12`), así que dentro del
   contenedor no tendría nada que leer. Igual que `testing/` hoy.
2. **No lo importa nada de producción.** Si aparece en el grafo de imports de
   `apps/desk/server/index.ts`, es un error.

### Pieza 5 · Instalación: la guarda en NODE, no en `sh`

**Medido con control de dos signos a través de `npm run` en esta máquina** (nivel 2 de procedencia;
`npm config get script-shell` → `null`, win32, luego `cmd.exe`):

| Variante de la guarda | CON `.git` | SIN `.git` |
|---|---|---|
| en línea, sintaxis sh (`git rev-parse --git-dir >/dev/null 2>&1 \|\| exit 0`) | exit 0, **NO INSTALA** | exit 0, no instala |
| en línea, sh sin la redirección POSIX | exit 0, **NO INSTALA** | exit 0, no instala |
| en un `.mjs` con `spawnSync` | exit 0, **INSTALA** | exit 0, no instala |

La guarda en línea con sintaxis `sh` deja `npm ci` en verde y el hook **sin instalar, en silencio**: la
imposición desaparece sin un aviso. Y no era sólo `/dev/null` — la variante sin redirección falla
igual: es la semántica de `||`/`exit 0` en `cmd.exe`.

⚠️ **La mutación «`prepare` sin `.git` → sale 0» la pasan las TRES variantes.** Comprueba que la guarda
se ejecuta, no que **discrimina**. Es la regla de mutación 2 del proyecto aplicada a sí misma, y por eso
el control de dos signos no es opcional (M11).

Cómo va:

1. Guarda e instalación en un **`.mjs` pequeño** (así no hay comillas anidadas en `package.json`):
   `spawnSync('git', ['rev-parse','--git-dir'])`; si `status !== 0`, **salir con 0**. Eso cubre *sin
   repositorio* **y** *sin binario `git`*: `node:22-alpine` no instala git (`Dockerfile:2`, `:10`, sin
   `apk add` — verificado) y ahí `status` sale **`null`**. Si no, `git config core.hooksPath .githooks`.
2. Si el `git config` falla **con** repositorio presente, que lo diga **en voz alta** —mensaje visible
   en la salida de `npm ci`— sin tumbar la instalación. El fallo silencioso es lo que esto viene a
   evitar.
3. Una línea en `DEPLOY.md` con el comando manual, para clones con `--ignore-scripts`. Anclas
   candidatas: `DEPLOY.md:64` en `648432d` (§2, el clon) o `DEPLOY.md:204` en `648432d` (`## Notas`).

**Dónde corre `prepare` hoy, verificado:** `ci.yml:26` (`npm ci`) y `Dockerfile:6` y `:19` (dos veces).
En el CI **sí** hay `.git` —`checkout@v4` lo crea—, así que fijará `core.hooksPath` en el workspace del
runner: inocuo, porque el CI no empuja. En la imagen no hay `.git` ni binario `git`: sale 0.

**El hook no lleva lógica de shell.** Es una línea que invoca `node`/`npx tsx` y le pasa el stdin. Así
la pregunta de qué intérprete usa Git for Windows —**hipótesis**: su propio `sh`, no `cmd.exe`, que es
la diferencia con la tabla de arriba, donde el intérprete era `cmd.exe` porque lo lanzaba `npm run`—
**deja de ser carga**: si la hipótesis sale falsa, el hook no cambia.

**Y si faltan las dependencias, el hook FALLA con mensaje explícito.** No sale 0. Un hook que pasa
cuando no ha podido comprobar nada es exactamente el modo de fallo de la guarda en `sh`: la imposición
desaparece en silencio (M16).

### Pieza 6 · El mensaje del hook: lo que NO comprueba, y el aviso de escalada

El detector ve **sólo lo mecánico**: fichero inexistente, línea fuera de rango, línea vacía, **los dos
extremos** de un rango, revisión inexistente. **Que la línea diga lo que la frase afirma sigue siendo
trabajo de una persona** — `CLAUDE.md:177-179` en `648432d` lo mide: cuatro rangos distintos citaban el
mismo bloque de `estados.ts` y sólo uno acertaba.

Eso va **en el mensaje del hook**, no sólo en la spec. Un detector que bloquea por línea vacía y calla
sobre lo que no mira se lee como si hubiera comprobado la afirmación. El mensaje lleva además las **dos
cifras** (comprobadas y saltadas) y las **dos salidas legítimas** de un bloqueo: reparar la cita, o
añadirla a la línea base **a mano**. `--no-verify` no es una de ellas.

#### El aviso de la condición de escalada (decisión Q5) — lo hace el hook, no una persona

El hook ejecuta `git shortlog -sne --all` y, si hay **más de una identidad**, imprime un **aviso visible
que NO bloquea**, nombrando la salida: añadir el job de CI con `fetch-depth: 0`, porque el hook local
deja de bastar cuando escribe **más de una persona**.

⚠️ **Lo que el aviso NO ve, y se declara.** Contar identidades mide **personas, no clones**. La misma
identidad empujando desde un **segundo clon instalado con `--ignore-scripts`** no tiene hook, y por
tanto tampoco aviso: para `git shortlog` sigue habiendo una sola identidad y nada avisa de que ese clon
empuja sin comprobar. Ese hueco **lo cubre sólo la línea de `DEPLOY.md`** con el comando manual de
instalación (Pieza 5, punto 3).

**Por qué lo hace el hook y no una casilla de persona, que es lo que esta propuesta decía antes.** La
regla del ciclo 1 (`CLAUDE.md:330-349` en `648432d`) permite sacar del recuento las casillas cuyo dueño
está fuera del repositorio, **pero su reverso lo prohíbe cuando la casilla describe trabajo que una
tanda podría hacer aquí**. El reverso es `CLAUDE.md:347-349` en `648432d`, y dice literalmente: «antes
de sacar una casilla del recuento, comprueba que **no describe trabajo que una tanda podría hacer en
este repositorio**. Si lo describe, es una tarea de verdad y sacarla es maquillar el contador».
Ejecutar un comando de git y comparar el número de líneas de su salida es trabajo de una tanda. Así que
**sale del §12** y entra en el hook, con **prueba de los dos signos**: una identidad → sin aviso; dos →
aviso, y el código de salida **no cambia**.

**Avisar sin bloquear es deliberado:** una segunda identidad no rompe ninguna cita, así que bloquear el
push sería castigar a quien acaba de incorporarse. Lo que hace falta es que nadie pueda decir que no se
sabía.

---

## 4 · El rojo primero (`strict_tdd: true`)

`openspec/config.yaml:20` en `648432d`, `openspec/config.yaml:30` en `648432d` y
`openspec/config.yaml:980` en `648432d` lo fijan; `test_command: "npm test"` en
`openspec/config.yaml:981` en `648432d`. **El detector es `.ts` y vive dentro de la red de pruebas, así
que aquí no hay excusa de `.tsx`: todo rojo es escribible.**

| # | Rojo | Qué demuestra |
|---|---|---|
| **a** | Cita rota en un doc trackeado → el detector devuelve ≠ 0 | Que detecta |
| **b** | La misma cita, válida → 0 | Que **discrimina**. (a) sin (b) es un detector que siempre dice sí |
| **c** | Rango con el extremo **FINAL** fuera, el inicial bien a propósito → ≠ 0 | Que comprueba **los dos** extremos (`CLAUDE.md:180` en `648432d`). **Es el modo de fallo dominante, medido**: las cinco citas desfasadas de esta sesión lo fueron por un extremo del rango, ninguna por el número suelto (§1) |
| **d** | Anclada a revisión real → 0; anclada a revisión inventada → ≠ 0 | Que las ancladas se leen con `git show`, y que su ausencia no pasa por válida |
| **e** | Cita rota en un fichero **sin trackear** → se ignora | El alcance por construcción |
| **f** | Push de varios commits con la rotura en el **primero** → ≠ 0 | Que el rango sale de stdin y no de `HEAD~1` |
| **g** | Fichero citado **renombrado** → ≠ 0, y el mensaje nombra el renombrado | `-M` y los estados `D`/`R` |
| **h** | `prepare` en un directorio **sin `.git`** → 0 **y no instala**; **con `.git`** → 0 **e instala** | Los dos signos. Uno solo lo pasan las tres variantes |
| **i** | Repositorio sintético con **una** identidad → sin aviso; con **dos** → aviso **y el mismo código de salida** | El aviso de escalada de la Pieza 6, y que **no** bloquea |

Las pruebas del hook **lo invocan directamente**, con la misma entrada que git le pasa por stdin.
⚠️ **Hipótesis de Gerencia, no prueba**: que git no ejecuta `pre-push` con `--dry-run`. Por eso no se
apoya ninguna prueba en `git push --dry-run`.

---

## 5 · Regla de mutación 3 — la casilla, marcada declarando que no aplica

**Esta tanda no toca `apps/desk/src`**: no hay ninguna decisión de cliente que enumerar y ninguna
guarda que contrastar contra el servidor. La casilla se marca **por escrito diciéndolo**, no
omitiéndola: la regla de mutación 3 existe porque dos tandas la recordaron de memoria y las dos se la
saltaron.

**Y el paralelo sí existe, en otro plano.** El detector es una guarda que vive **fuera de la red de
ejecución del producto**: ni `tsc`, ni `eslint`, ni la suite lo invocan en el flujo normal. Su
imposición es el hook, y **si el hook no está instalado, la guarda no existe** — el mismo argumento del
punto 2 de la regla invariable 13, con `.githooks` en el lugar del navegador. Por eso el detector de que
el hook está instalado es la mutación de dos signos del `prepare` (M11), y no la existencia del fichero.

---

## 6 · Tabla de mutaciones (enunciada aquí; `sdd-tasks` la desarrolla)

| # | Qué se muta | Detector que debe ponerse rojo | Control que valida el detector |
|---|---|---|---|
| **M1 · obligatoria** (D1.4) | Un push que **sólo** mueve líneas en un fichero citado, sin tocar ningún fichero que lo cite | El hook sale ≠ 0 | El mismo push con la cita reparada → 0. Sin este control, M1 sólo prueba que el hook corre |
| **M2** | Cita rota en un doc trackeado | ≠ 0, y el push se para | La misma cita, válida → 0 |
| **M3** | Anclada a revisión inventada | ≠ 0 | Anclada a revisión real → 0 |
| **M4** | Rango con el extremo **final** fuera (el inicial bien) | ≠ 0, y el mensaje nombra **cuál** de los dos extremos | Rango con los dos extremos bien → 0. **Y el inverso también**: extremo **inicial** en línea en blanco con el final bien → ≠ 0. Los dos casos se dieron esta misma sesión (§1), así que probar un solo extremo dejaría fuera la mitad medida |
| **M5** | Cita rota en un fichero **sin trackear** | Se ignora: 0 | `git add` a ese fichero → pasa a bloquear. Prueba que el alcance es «trackeado», no «existe en disco» |
| **M6** (D1.1) | Push de varios commits, rotura en el primero, último commit inocuo | ≠ 0 | La variante que mira `HEAD~1` lo deja pasar: es la prueba de que el rango viene de stdin |
| **M7** (D1.2) | **Renombrar** un fichero citado | ≠ 0, y el mensaje dice «renombrado» | Sin `-M`, el renombrado se clasifica como borrado + añadido y el mensaje pierde el rastro de dónde fue |
| **M8** (D1.3) | Reparar la cita **en el árbol de trabajo** sin commitear, y empujar el commit roto | ≠ 0 | La variante que lee el worktree lo deja pasar |
| **M9** (D2.2) | Reparar una cita que está en la **línea base**, sin quitar su entrada | **El hook FALLA** hasta que se quite de la base | Quitar también la entrada → 0. Es el mecanismo que impide que la base se podre |
| **M10** (D2.3) | Añadir una cita rota **nueva** con la base ya presente | Bloquea | La base no crece desde el hook: el único camino es editarla a mano, y eso sale en el diff |
| **M11 · el fichero vigilado** (D4) | `prepare` en un directorio **sin `.git`** | Sale 0 y **NO instala** | **Control de dos signos, obligatorio:** **con** `.git` → sale 0 y **`git config --get core.hooksPath` devuelve `.githooks`**. La mutación de un solo signo la pasan las tres variantes de la tabla de la Pieza 5 |
| **M12** (D4.1) | Sin binario `git` (`node:22-alpine`) | `status` es `null` → sale 0 | Con `git` presente → instala |
| **M13** (D4.2) | Hacer fallar el `git config` **con** repositorio presente | Mensaje visible en la salida y `npm ci` **sigue en verde** (exit 0) | Que el mensaje exista: un fallo silencioso aquí es el defecto que esta pieza evita |
| **M14 · el alcance del archive** | Cita rota **dentro** de `openspec/changes/archive/` | Se ignora: 0 | La misma cita fuera del archive → bloquea |
| **M15 · las ambiguas** | Cita ambigua rota en **todas** las candidatas | ≠ 0 | Rota en **una sola** → se salta y el contador de saltadas sube en 1. Un detector que no contara las saltadas mentiría por omisión |
| **M16 · el hook sin dependencias** | Borrar `node_modules` y empujar | **≠ 0**, con mensaje explícito | Un hook que saliera 0 aquí repite el fallo de la guarda en `sh`: imposición que desaparece en silencio |
| **M17 · la posición** (regla de mutación 1) | Mover la consulta a la línea base **después** de decidir el bloqueo | Una entrada de la base debe empezar a bloquear → la prueba de la base se pone roja | Si sigue verde, **el orden no está probado** y un comentario que lo declare deliberado no es prueba |
| **M18 · el orden de la tanda** | Instalar el hook **antes** de generar la línea base | El push de cierre se bloquea por citas que esta tanda no rompió | Es la precondición dura del §8, y por eso es criterio de aceptación con orden, no una recomendación |
| **M19 · el coste** | — | Medir el hook con la entrada real por stdin | §7 |
| **M20 · el anclaje de la propia tanda** (Q7c) | **Desanclar** una cita de un artefacto de esta tanda a `CLAUDE.md` —dejarla como cita del presente— **y** aplicar la inserción de IV-10 | El hook **bloquea** | Con la cita **anclada a `648432d`** → pasa. Es la única prueba de que el anclaje sirve para algo. **La cita se elige con el desplazamiento REAL** —el del diff de la unidad de trabajo 2—, **no con el de la ilustración de la Pieza 3**: el reparto cambia con cada línea insertada, y con +5 en `CLAUDE.md` o de +25 a +40 en `openspec/config.yaml` no cae ninguna en línea vacía. La prueba **afirma primero** que la cita desanclada cae en línea vacía o fuera de rango con ese desplazamiento; si ninguna cita de la tanda lo hace, M20 se construye sobre un **repositorio sintético** y se declara así. Con una cita que se escapa, la mutación saldría verde por el motivo equivocado |
| **M21 · el aviso de escalada** (Q5) | Repositorio sintético con **dos** identidades de autor | El hook **imprime el aviso** | Con **una** identidad → sin aviso. Y en los dos casos el **código de salida es el mismo**: si al añadir la segunda identidad el hook empieza a bloquear, el aviso se convirtió en guarda y eso no es lo decidido |
| **M22 · el ejemplo sin forma de cita** (Q6) | Escribir el ejemplo de cita rota **con** forma de cita (`fichero:línea`) en un doc trackeado | El detector lo trata como cita y **bloquea** | Escrito **sin** forma de cita —«la línea 206 de `CLAUDE.md`, hoy vacía»— → pasa. Es la prueba de que la frase nueva de la regla 4 hacía falta |
| **M23 · la precedencia del nombre pelado** | Quitar la precedencia de **coincidencia exacta** y dejar sólo el sufijo | Toda cita a `package.json` pasa de **comprobada** a **ambigua y saltada**, y el contador de saltadas sube | Con la precedencia, `package.json:10-23` en `648432d` se comprueba contra la raíz. **Y el control del otro signo:** `ci.yml`, que **no** tiene coincidencia exacta, debe seguir resolviendo por sufijo a `.github/workflows/ci.yml`. Una precedencia que rompiera el caso del sufijo cambiaría un hueco por otro |
| **M24 · (a) el nombre sin lista de extensiones** | Sustituir el patrón del nombre por una lista de extensiones | Una cita rota a `Dockerfile` o a `ci.yml` **deja de bloquear** → la prueba de (a) se pone roja | La misma cita válida **figura entre las comprobadas**, no sólo sale 0: una cita que no se cosecha también sale 0 |
| **M25 · (b) el punto inicial** | Exigir que el nombre empiece por letra o dígito | La cita rota a `.dockerignore` pasa a **saltada** y deja de bloquear | La válida figura entre las **comprobadas**, no entre las saltadas |
| **M26 · (c) la atribución por índice** | Atribuir la abreviada al último fichero **de la línea** | Las dos salidas del control de (c) se invierten: **falso positivo** con A válido y B vacío, y **escape** con los dos intercambiados | Con la atribución por índice, las dos salidas vuelven a su signo. Probar un solo orden no distingue las dos reglas |
| **M27 · (d) la mención pelada** | Dos mutaciones: **quitar** (d), y dejar que **cualquier** token pelado capture, resuelva o no | En las dos, la abreviada rota tras `.dockerignore` deja de bloquear: huérfana en la primera; atribuida a `.git` o a `docs` y saltada en la segunda | Las tres abreviadas válidas del párrafo de la Pieza 4 figuran entre las **comprobadas**, y ninguna entre las huérfanas |

---

## 7 · Coste: el hook corre en CADA push, y eso es una restricción de producto

Segundos, no minutos, o nadie lo soporta — y el atajo cuando molesta es `--no-verify`, que esta tanda
prohíbe. Así que el tiempo **no es una métrica de calidad, es la condición de que la regla sobreviva**.

**Objetivo decidido por Gerencia (Q3): ≤ 5 s en el push típico, tope duro 10 s.**

**Ya medido, y el aviso de escalada no rompe nada** (nivel 2 de procedencia):

| Pieza | Tiempo medido |
|---|---|
| `git shortlog -sne --all` sobre 766 commits —medido antes de `648432d`; hoy son 767—, tres intentos | **267 / 281 / 314 ms** |
| El `git grep` del barrido entero | **256 ms** |
| El prototipo completo: 1.873 citas, 663 ficheros | **541 ms** |
| **Total con el shortlog incluido** | **~0,8 s contra un objetivo de 5 s — 6× de margen** |

Se declara **antes** de construirlo, y no después, porque el coste del aviso de escalada era la única
objeción razonable a meterlo en el hook: 300 ms sobre un presupuesto de 5.000 no es una objeción.

| | |
|---|---|
| **Cómo se mide en la tanda** | Invocando el hook **directamente** con la misma entrada que git le pasa por stdin, sobre el push más caro que se pueda construir: un fichero muy citado **y** un doc que cita. Se registra el número, no la impresión |
| **Palanca** | La cosecha de citas se hace con **`git grep -nIE` sobre el sha que se empuja** —una pasada en C sobre el árbol— y no leyendo 663 ficheros desde Node |
| **Decisión que queda para `sdd-design`, con su medición** | `docs/artefactos/blueprintserviciotecnico.html` pesa **3.370.299 bytes** (`openspec/config.yaml:837` en `648432d`) y `.gitattributes` lo marca `-diff -merge`. `-I` no lo salta, porque es texto. Medir la cosecha **con y sin** `docs/artefactos/` y decidir por el número; si se excluye, la exclusión va **declarada y justificada** junto a la de `openspec/changes/archive/`, no escondida |
| **El coste del intérprete** | El detector es `.ts` y el servidor corre con `tsx` (`package.json:13` en `648432d`, `package.json:15` en `648432d`). El arranque de `tsx` entra en el presupuesto y se mide con él, no aparte |

---

## 8 · Precondición dura: 0 bloqueantes antes de instalar, y otra vez al final

**Antes de instalar el hook, el detector tiene que dar 0 bloqueantes sobre el árbol.** Para eso existe
la línea base. Si no, el primer push queda bloqueado por citas que esta tanda no rompió, y la primera
experiencia de la imposición es un falso acusador — que es como se acaba usando `--no-verify`.

Orden, y es criterio de aceptación (M18): **detector con pruebas → línea base generada → IV-10 escrito
→ hook e instalador**. No al revés.

⚠️ **Y una segunda comprobación al final, que la versión anterior de esta propuesta no tenía** (Q7b): 0
bloqueantes **sobre el árbol final, con los artefactos de la tanda ya commiteados e IV-10 ya dentro**.
La comprobación intermedia no basta: es exactamente el estado en el que la medición de la Pieza 3 salió
cierta y luego dejó de serlo.

---

## 9 · Riesgos

| # | Riesgo | Probabilidad | Mitigación |
|---|---|---|---|
| **R-1** | **La guarda del `prepare` en `sh` deja el hook sin instalar en silencio** (medido, Pieza 5) | **Cierta si se escribe en línea** | La guarda va en un `.mjs` con `spawnSync`, y el detector es la mutación de **dos signos** M11 |
| **R-2** | **La mutación de un signo no discrimina**: «sin `.git` → 0» la pasan las tres variantes | Alta — es la trampa natural | M11 exige el signo positivo: **con `.git` debe instalar**, comprobado con `git config --get core.hooksPath` |
| **R-3** | **La línea base se podre**: silencia para siempre citas ya correctas | Alta a un año | Sólo encoge (D2.2, M9) y no crece desde el hook (D2.3, M10). Y la fila IV-10 lo dice con la frase de Q4: **la base no encoge hasta que Gerencia asigne quién la repara** |
| **R-4** | **Un falso positivo para el push de una persona y la salida fácil es `--no-verify`** | Media | Mensaje con ruta, línea, cita literal y las **dos** salidas legítimas: reparar, o añadir a la base **a mano**. Y la regla de que `--no-verify` no se usa, escrita en el mensaje y en IV-10 |
| **R-5** | **El hueco declarado**: 145 ambiguas + 125 sin resolver no se comprueban del todo | Cierta | Las dos cifras se imprimen en cada ejecución (M15). Decidido por Q1 y Q2 |
| **R-6** | **Cobertura**: el detector cuenta contra el 92 % (`vitest.config.ts:53`, `:58-63`) y puede arrastrar la cifra global | Media | `strict_tdd` con los nueve rojos del §4. Si baja, **es la señal**; bajar el umbral exige justificación en el commit (`vitest.config.ts:36-39`) |
| **R-7** | **El detector se convierte en dependencia de la entrega**: si se cuelga, no se empuja | Media | Coste ya medido en ~0,8 s con 6× de margen (§7); salida 0 inmediata en los casos degenerados (borrado de rama, rama nueva sin `merge-base`) |
| **R-8** | **`prepare` es nuevo y corre en tres sitios más** (`ci.yml:26`, `Dockerfile:6`, `:19`) | Media | Verificado: en el CI hay `.git` y fijar `core.hooksPath` es inocuo porque no empuja; en la imagen no hay `.git` ni `git` y sale 0 (M12) |
| **R-9** | **Presupuesto de revisión.** `changed_lines` se mide diffeando el **árbol entero** del intento (`CLAUDE.md:353-356` en `648432d`) y los artefactos SDD cuentan | Media | **Precondición, no recomendación:** `proposal.md`, el spec, `design.md` y `tasks.md` **commiteados antes de que el intento de `sdd-apply` adquiera** |
| **R-10** | **Paralelismo.** Dos tandas SDD sobre `C:\dev\Desk_2_R1.023` se imputan líneas entre sí, y desbloquearlo exige `sdd-attempt reset`, reservado a un mantenedor | Media | Una tanda por árbol de trabajo. Si hace falta otra, worktree aislado |
| **R-11** | **La tanda se rompe a sí misma.** Sus artefactos citan los dos ficheros que modifica, y el detector **no caza las citas que quedan en contenido equivocado**, en rango y no vacías. En la ilustración de la Pieza 3 —+1 en `CLAUDE.md`, +20 en `openspec/config.yaml`— se desplazan **ocho** y caza **cuatro**; con +5 en `CLAUDE.md`, o de +25 a +40 en `openspec/config.yaml`, **no caza ninguna** | **Cierta sin anclaje — ya pasó una vez en esta propuesta** | Anclaje a `648432d` **cita por cita** en los cuatro ficheros que la tanda toca, la mutación M20, y la comprobación final del §8 sobre los artefactos commiteados |
| **R-12** | **El 60 % de las abreviadas queda huérfano** con la atribución por línea física —**el 71 %** con los requisitos (a) a (d) de la Pieza 2—, y se salta en silencio | Alta | Es nota explícita para `sdd-design` (Pieza 2) con la medición hecha, y el hueco que decida **se declara**. En esta propuesta las abreviadas a los cuatro ficheros de la tanda se reescribieron como citas completas |
| **R-13** | **El extremo del RANGO es el modo de fallo dominante, no el número suelto.** Medido en esta sesión: **cinco** citas desfasadas, **las cinco** por un extremo del rango; una de ellas mal **por los dos** a la vez (inicio en línea en blanco, final cortando el párrafo). Un detector que comprobara sólo el inicio, o sólo la existencia de la línea, dejaría fuera la mitad medida | **Cierta — ya ocurrió cinco veces** | Rojo (c) del §4 y mutación **M4 en sus dos direcciones**: final fuera con inicio bueno, **e** inicio en línea en blanco con final bueno. Y el mensaje nombra **cuál** de los dos extremos falla, porque «el rango está roto» no dice dónde mirar |
| **R-14** | **Presupuesto de la línea base.** Si `sdd-design` amplía la atribución de las abreviadas (nota de la Pieza 2), el detector definitivo **comprobará muchas más citas** —hoy quedan huérfanas 683 con el patrón del sondeo, 803 con los requisitos (a) a (d)— y la base puede crecer **muy por encima de las ~43** del sondeo. **Cada entrada es una línea** contra las 800 de `review_budget_lines` (`openspec/config.yaml:29` en `648432d`) | Media | **Medir con el prototipo y la atribución ampliada ANTES de cerrar `sdd-design`.** **Umbral: 100 entradas.** El extremo alto de la estimación del §11 sin la base suma 622 líneas; con 100 entradas son 722, que dejan 78 de margen —un 10 %— contra las 800. **Si la medición pasa de 100, se para y se pregunta a Gerencia antes de generar la base.** El umbral supone una línea por entrada: si el formato usa más, se divide por las líneas que ocupe cada una |

---

## 10 · Capacidades

> Contrato con `sdd-spec`. Investigado sobre `openspec/specs/` (ocho specs: `tickets-core`,
> `transitions-st`, `remisiones`, `permissions`, `zoho-sync`, `derivacion-avisos`, `trazas`,
> `vistas-tablero`).

### Capacidades nuevas

- **`citas-verificables`**: las citas `ruta:línea` del repositorio son **comprobables mecánicamente**, y
  un push que las desfase no sale. Cubre el alcance del barrido, la regla de resolución de rutas, la
  línea base que sólo encoge, la instalación versionada del hook, el límite explícito de lo que **no**
  se comprueba, el **aviso** de la condición de escalada, y la **convención de anclaje** para las citas
  a ficheros que la propia tanda modifica.

### Capacidades modificadas

- **Ninguna.** Las ocho specs existentes son de dominio y ninguna cambia de requisito. Esta tanda
  **cambia cómo se comprueban sus citas**, no lo que afirman.

---

## 11 · Áreas afectadas y estimación

| Área | Impacto | Qué cambia | Líneas est. |
|---|---|---|---|
| `apps/desk/server/citas/` (detector + CLI) | **Nuevo** | Cosecha, resolución, comprobación, salida | 130-200 |
| `apps/desk/server/citas/*.test.ts` | **Nuevo** | Los nueve rojos del §4 y las mutaciones automatizables del §6 | 160-260 |
| `apps/desk/server/citas/` (línea base) | **Nuevo** | **Generada**, no copiada. Una entrada por cita rota | ~45 (según la cifra definitiva) |
| `.githooks/pre-push` | **Nuevo** | Invoca al detector con el stdin, sin lógica de shell, **+ el aviso de escalada** (`git shortlog`, ~10 líneas) | 15-25 |
| `apps/desk/server/citas/` (prueba del aviso) | **Nuevo** | **Los dos signos** del aviso de escalada: una identidad / dos | 25-30 |
| `scripts/instalar-hooks.mjs` | **Nuevo** | `spawnSync` + `git config core.hooksPath`, con el mensaje en voz alta | 20-35 |
| `package.json` | Modificado | Script `prepare` (**no existe hoy**: `package.json:10-23` en `648432d`) | 1-2 |
| `DEPLOY.md` | Modificado | El comando manual para `--ignore-scripts` y el `--unset` de la reversión | 3-6 |
| `CLAUDE.md` | Modificado | Fila **IV-10**, el recuento de `CLAUDE.md:249` en `648432d` («Cuatro» → «Cinco») **y la frase de Q6 en la regla de mutación 4** | 12-24 |
| `openspec/config.yaml` | Modificado | IV-10 en `incumplimientos_vivos`, tras el final de IV-9 | 25-40 |
| **Total código + pruebas + datos** | | | **~440-660** |

**Talla S, confirmada, con la reserva dicha.** No hay lógica de dominio nueva ni esquema ni escritura a
Zoho: es un lector de texto con su hook. Lo que la engorda son las pruebas, y eso es lo correcto bajo
`strict_tdd`. El aviso de escalada sube la estimación de 400-620 a **~440-660**: ~10 líneas en el hook
más 25-30 de prueba de dos signos.
**Presupuesto `review_budget_lines: 800`** (`openspec/config.yaml:29` en `648432d`): cabe, pero sin la
holgura de una tanda S típica — depende de R-9 (planificación commiteada antes de adquirir) y R-10
(árbol aislado).

**Troceado por unidad de trabajo**, cada una revertible sola y en este orden (§8):

1. `feat(citas): detector de citas ruta:línea` — detector + pruebas. Útil solo: se puede correr a mano.
2. `chore(citas): línea base de citas ya rotas, IV-10 y la frase de la regla 4` — la base generada, las
   dos filas de registro **y la frase de Q6** en la regla de mutación 4 de `CLAUDE.md`.
3. `build(hooks): pre-push versionado con core.hooksPath` — hook + aviso de escalada + instalador +
   `DEPLOY.md`.

---

## 12 · Tareas de PERSONA — fuera del recuento de tareas

> **Archivar NO las da por hechas.** Van en sección aparte de `tasks.md` y **no se cuentan**: una
> casilla cuyo dueño está fuera del repositorio no la marca ninguna tanda (regla del ciclo 1,
> `CLAUDE.md:330-349` en `648432d`). **Quedan DOS**, y las dos pasan el reverso de esa regla: ninguna
> describe trabajo que una tanda pudiera hacer en este repositorio.

| Qué | Dueño y registro | Por qué no es de la tanda |
|---|---|---|
| **Leer lo semántico**: que cada línea citada **diga** lo que su frase afirma, en las ~43 entradas de la línea base | Quien decida el alcance de la reparación. Se anota con dueño, resultado y fecha | La regla 4 lo exige y el detector **no puede**: son los tres casos A/B/C de `CLAUDE.md:195-199` en `648432d`, y elegir entre ellos es leer una afirmación, no contar líneas |
| **Asignar destino a IV-10 y decir quién repara la base** | Gerencia | Asignar una épica de memoria es lo que dejó cuatro desvíos huérfanos al cerrar F1A. Nace **sin destino decidido explícitamente** (Q4), y la fila lo dice: «la base no encoge hasta que Gerencia asigne quién la repara» |

⚠️ **Vigilar la condición de escalada SALIÓ de esta sección** (decisión Q5). Estaba modelada como tarea
de persona y era **maquillar el contador** en el sentido exacto del reverso de la regla
(`CLAUDE.md:347-349` en `648432d`): ejecutar `git shortlog -sne --all` y comparar el número de líneas de
su salida es trabajo que una tanda hace en este repositorio, así que lo hace el hook (Pieza 6) y cuenta
como tarea de verdad.

---

## 13 · Ronda de preguntas — **CERRADA por Gerencia (2026-09-13)**

`openspec/config.yaml:25-30` en `648432d` fija `interactive`, y `CLAUDE.md:315-321` en `648432d`
registra que el 2026-09-10 se declaró el preflight de memoria y **se saltó esta ronda**. Esta vez no: la
ronda se hizo y está **respondida**. Las siete son **decisiones**, no supuestos.

| # | Pregunta | Decisión de Gerencia | Dónde queda |
|---|---|---|---|
| **Q1** | Las 145 citas ambiguas: ¿bloquear siempre, o sólo cuando estén rotas en **todas** las candidatas? | **ACEPTADA tal como se propuso**: bloquea sólo si está rota en **todas**; si alguna la valida, se salta e informa | Pieza 2; §2 «No entra»; M15 |
| **Q2** | Las 125 que no resuelven: ¿basta que un token **sin `/`** se informe y no bloquee? | **ACEPTADA**: con `/` bloquea como fichero inexistente; sin `/`, informa | Pieza 2 |
| **Q3** | Coste: ¿**≤ 5 s** con **10 s** de tope duro? | **ACEPTADA** | §7, con los tiempos ya medidos |
| **Q4** | La línea base: ¿quién repara las ~43 entradas? | **ACEPTADA con matiz que cambia el enunciado**: sin dueño **decidido explícitamente, no por omisión**. IV-10 lo dice con estas palabras: **«la base no encoge hasta que Gerencia asigne quién la repara»** | Pieza 3 punto 5; §2 «Entra» 8; R-3; §12 |
| **Q5** | ¿Quién vigila `git shortlog -sne --all`? | **RECHAZADA en su forma.** No es tarea de persona: por el reverso de la regla del ciclo 1 es trabajo que una tanda hace aquí, y sacarla del recuento sería maquillarlo. **Lo hace el hook**: aviso visible **sin bloquear** con más de una identidad, y prueba de los dos signos | Pieza 6; §1; §2 «Entra» 5; rojo (i); M21; §11 |
| **Q6** | El ejemplo de cita rota del §2 tenía **forma de cita**, así que el detector lo trataría como rota | **ACEPTADA, opción (i)**: el ejemplo se reescribe **sin forma de cita**, y se añade a la tanda **una frase en la regla de mutación 4 de `CLAUDE.md`**: «un ejemplo de cita rota se escribe sin forma de cita, o el detector lo tratará como rota» | §2 «No entra» y «Entra» 9; convención 2 de la cabecera; M22; unidad de trabajo 2 |
| **Q7** | **NUEVA, y verificada de disco por Gerencia.** «Insertar IV-10 no desfasa ninguna cita en alcance» se midió **antes de que la propuesta existiera**: era cierta entonces y es **FALSA ahora** | **Tres partes: (a)** anclar a `648432d` toda cita de los artefactos de la tanda a los cuatro ficheros que la tanda modifica; **(b)** rehacer la medición **incluyendo los artefactos de la propia tanda** y mover la comprobación **al final, sobre los artefactos commiteados**; **(c)** añadir la mutación del anclaje | Cabecera (convenciones 1 y 2); Pieza 3 (medición rehecha); §8 (segunda comprobación); M20; R-11; §15 |

**Lo que Q7 enseña, y por eso no es una corrección menor:** en la ilustración de la Pieza 3 —+1 en
`CLAUDE.md`, +20 en `openspec/config.yaml`— la inserción de IV-10 desplaza **ocho** citas, y el detector
caza **cuatro** y **se le escapan cuatro**: las que quedan en contenido equivocado, dentro de rango y no
vacías. Con otros desplazamientos plausibles no caza **ninguna**. Y dos de ellas —las líneas 980 y 981
de `openspec/config.yaml`— estaban escritas como **abreviadas**, que un barrido por
`config\.yaml:[0-9]+` no ve. **La tanda que construye el detector estuvo a punto de
entregar el defecto que el detector no puede cazar.** Eso es lo que el anclaje protege.

---

## 14 · Plan de reversión

Las tres unidades del §11 se revierten por separado, y el orden inverso es seguro.

| Unidad | Reversión |
|---|---|
| 3 (hook + aviso + instalador) | `git revert`, y además **`git config --unset core.hooksPath`** en cada clon que ya lo tuviera: quitar el fichero no deshace el `git config`. Va escrito en `DEPLOY.md` junto al comando de instalación |
| 2 (línea base + IV-10 + frase de la regla 4) | `git revert`. Sin efecto de ejecución si la unidad 3 ya está revertida |
| 1 (detector) | `git revert`. Nada de producción lo importa (Pieza 4, punto 2), así que no puede arrastrar nada |

**Reversión de urgencia sin revert**, para un push bloqueado a destiempo:
`git config --unset core.hooksPath`. Es local, explícito y deja rastro en la configuración del clon —
**no `--no-verify`**, que no deja ninguno.

Ninguna unidad toca el esquema de base de datos, escribe hacia Zoho ni depende de `ENABLE_WRITES`.

---

## 15 · Criterios de aceptación

- [ ] **PRECONDICIÓN DE ENTREGA, primero de todo:** `proposal.md`, el spec, `design.md` y `tasks.md`
      **commiteados antes de que el intento de `sdd-apply` adquiera** (R-9), y una sola tanda SDD sobre
      este árbol (R-10).
- [ ] El detector vive en una **hermana** de `apps/desk/server/`, **no** en `testing/`, y su fichero
      declara por escrito las dos cosas de la Pieza 4: que viaja inerte a la imagen y que **nada de
      producción lo importa**.
- [ ] `apps/desk/server/index.ts` **no** lo alcanza en su grafo de imports, comprobado.
- [ ] El rango de comprobación sale de la **entrada por stdin**, y los dos casos degenerados están
      cubiertos: rama nueva (`merge-base` con `origin/main`) y borrado de rama (salir con 0).
- [ ] `git diff --name-status -M`, con los estados `D` y `R` tratados, y el mensaje distingue
      **renombrado** de borrado.
- [ ] Las citas que apuntan a un fichero cambiado se verifican contra **`git show <sha local>:<ruta>`**,
      no contra el árbol de trabajo (M8).
- [ ] La regla de resolución de la Pieza 2 está implementada tal cual (Q1 y Q2), con **sufijo de ruta
      con frontera de segmento** y **nunca** subcadena del basename.
- [ ] **La coincidencia EXACTA tiene precedencia sobre el sufijo** (Pieza 2, M23): sin ella, las cinco
      candidatas trackeadas de `package.json` dejan ambigua **toda** cita a ese fichero. Y `ci.yml`, sin
      coincidencia exacta, sigue resolviendo por sufijo: los dos signos, no uno.
- [ ] **Los DOS extremos de un rango se comprueban por separado, y el mensaje dice CUÁL falla.** Probado
      en las dos direcciones (M4): final fuera con inicio bueno, **e** inicio en línea en blanco con
      final bueno. No es una nota al pie: es el modo de fallo **dominante** medido —cinco de cinco en
      esta sesión, una de ellas mal por los dos extremos a la vez (R-13)—.
- [ ] El mensaje del hook imprime **las dos cifras** —comprobadas y **saltadas**—, dice **qué NO
      comprueba** (lo semántico) y nombra las **dos** salidas legítimas: reparar, o añadir a la línea
      base **a mano**.
- [ ] **El aviso de la condición de escalada está en el hook** (Q5): `git shortlog -sne --all`, aviso
      visible con más de una identidad, **sin cambiar el código de salida**; con prueba de **los dos
      signos** (M21).
- [ ] La línea base está **generada por el detector**, no copiada del sondeo, y su cifra va con **fecha
      de medición**.
- [ ] La base **sólo encoge**: una entrada que ya no está rota **pone el hook rojo** (M9); y una cita
      rota que no está en la base **bloquea** aunque la base exista (M10).
- [ ] El barrido cubre **sólo ficheros trackeados** y **excluye `openspec/changes/archive/`**,
      comprobado con M5 y M14.
- [ ] `prepare` existe en `package.json` y la guarda vive en un **`.mjs`**, no en la línea del script.
- [ ] **La mutación de la instalación se corrió con LOS DOS SIGNOS** (M11): sin `.git` → 0 y **no
      instala**; con `.git` → 0 y `git config --get core.hooksPath` devuelve `.githooks`. **Un solo
      signo no vale**, y el porqué queda escrito.
- [ ] Un `git config` fallido **con** repositorio imprime un mensaje visible y **no tumba `npm ci`**
      (M13).
- [ ] `DEPLOY.md` lleva el comando manual para `--ignore-scripts` **y** el `--unset` de la reversión de
      urgencia.
- [ ] **Precondición dura del §8 cumplida en orden:** el detector da **0 bloqueantes** sobre el árbol
      **antes** de que el hook se instale (M18).
- [ ] **Y la comprobación FINAL, sobre los artefactos ya COMMITEADOS** (Q7b): 0 bloqueantes con
      `proposal.md`, el spec, `design.md`, `tasks.md`, `CLAUDE.md` e `openspec/config.yaml` **ya en su
      forma definitiva, con IV-10 dentro**. **No vale la comprobación sobre el árbol intermedio**: es el
      estado en el que la medición anterior salió cierta y luego dejó de serlo.
- [ ] **Toda cita de los artefactos de esta tanda a `CLAUDE.md`, `openspec/config.yaml`, `package.json`
      o `DEPLOY.md` está ANCLADA a `648432d`, cita por cita** (Q7a) — no en una nota de cabecera, que
      el detector no lee—, y **ninguna abreviada** queda huérfana en esos cuatro ficheros.
- [ ] **Ningún ancla queda partida por el salto de línea** en ningún artefacto de la tanda: «en
      `` `648432d` »` va en la **misma línea física** que su cita. Es la abreviada huérfana un nivel más
      arriba, y un ancla que el detector no ve no protege nada.
- [ ] **Ningún artefacto de la tanda cita sus propias líneas** ni las de otro artefacto de la tanda: no
      hay revisión a la que anclarlo y se rompe con la siguiente edición.
- [ ] El coste está **medido y registrado** con la entrada real por stdin, dentro del objetivo de Q3
      (≤ 5 s, tope 10 s); y la decisión sobre `docs/artefactos/` se tomó **por el número**, con la
      exclusión declarada si la hay.
- [ ] **Las veintisiete mutaciones del §6 se ejecutaron**, cada una con su control. Las que no se puedan
      automatizar van declaradas como tal, no omitidas. **M20 usa una cita que, desanclada, el detector
      SÍ caza con el desplazamiento REAL de la unidad de trabajo 2** —afirmado en la propia prueba—, o un
      repositorio sintético declarado como tal: con una cita que se escapa saldría verde por el motivo
      equivocado.
- [ ] **Los cuatro requisitos de la cosecha de la Pieza 2 están implementados y probados con sus dos
      signos** (M24 a M27): (a) el nombre no es una lista de extensiones; (b) admite el punto inicial;
      (c) la abreviada va al último fichero **anterior** a ella por índice; (d) la mención pelada que
      resuelve a un fichero trackeado cuenta como fichero al que atribuir. En (a) y (b) el signo válido
      es **«figura entre las comprobadas»**, no «sale 0».
- [ ] IV-10 está en `CLAUDE.md` **y** en `openspec/config.yaml`, con cifra, fecha, **destino sin asignar
      decidido explícitamente** y la frase de Q4 **«la base no encoge hasta que Gerencia asigne quién la
      repara»**; y el recuento de `CLAUDE.md:249` en `648432d` pasó de «Cuatro» a «Cinco».
- [ ] **La frase de Q6 está en la regla de mutación 4 de `CLAUDE.md`** —«un ejemplo de cita rota se
      escribe sin forma de cita, o el detector lo tratará como rota»— y va en la **unidad de trabajo 2**.
- [ ] El ejemplo de la cita rota del archive está escrito **sin forma de cita** (Q6, opción i).
- [ ] La **nota para `sdd-design`** de la Pieza 2 —el 60 % de abreviadas huérfanas, el 71 % con los requisitos (a) a (d)— llegó al diseño
      **como nota, no como decisión de esta propuesta**, y el diseño **declara el hueco** que deje.
- [ ] `npm test`, `npm run typecheck`, `npm run lint` y `npm run build` en verde; `lint` sin superar los
      158 avisos del trinquete (`.github/workflows/ci.yml:41`) y cobertura sobre los umbrales de
      `vitest.config.ts:58-63` (`ci.yml:45`).
- [ ] **Las DOS tareas de persona del §12** están **fuera** del recuento de `tasks.md`, con dueño,
      destino y la frase de que **archivar no las da por hechas**. Vigilar la condición de escalada
      **NO** está entre ellas: la hace el hook.

---

## 16 · Dependencias

- **Ninguna bloqueante.** No hay mecanismo de hooks previo: ni `core.hooksPath`, ni `.husky`, ni
  `.githooks`, ni script `prepare` (verificado: `.githooks` y `.husky` no existen; `scripts/` sólo
  contiene `docx2md.sh`; `package.json:10-23` en `648432d` no declara `prepare`). Se construye desde
  cero.
- **La decisión de Gerencia está cerrada**: Engram `decision/detector-citas-pre-push`, obs. 513,
  2026-09-13, opción 4 de cuatro; y la ronda del §13 cerrada el mismo día con siete respuestas.
- **Acopla con el CI en un punto y no lo bloquea**: `ci.yml:26` (`npm ci`) disparará el `prepare` nuevo.
  El job de CI con `fetch-depth: 0` **no se construye aquí**: es la condición de escalada, y el hook la
  vigila.
- **No depende** de ningún punto abierto del maestro, del nº 52, ni de la titularidad OV↔equipo.
