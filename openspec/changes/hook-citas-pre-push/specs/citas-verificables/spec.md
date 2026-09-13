# Capacidad `citas-verificables` — las citas `ruta:línea` del repositorio son comprobables mecánicamente, y un push que las desfasa no sale

| Dato | Valor |
|---|---|
| Capacidad | `citas-verificables` (nueva) |
| Cubre | El detector de citas `ruta:línea` (vive en una carpeta hermana de `apps/desk/server/`; `sdd-design` fija el nombre exacto de fichero), su CLI, el hook `.githooks/pre-push`, el instalador `scripts/instalar-hooks.mjs` invocado desde un `prepare` nuevo, la línea base versionada, el aviso de la condición de escalada, y la convención de anclaje para las citas a los ficheros que la propia tanda modifica |
| Tanda que la escribe | `hook-citas-pre-push` |
| Depende de | Ninguna de las ocho capacidades de dominio existentes (`tickets-core`, `transitions-st`, `remisiones`, `permissions`, `zoho-sync`, `derivacion-avisos`, `trazas`, `vistas-tablero`): es una herramienta de infraestructura sin lógica de negocio, fuera de la red de ejecución del producto |
| Fuente en el maestro | **No aplica, y se dice en vez de forzarla.** Esta capacidad no sale de un ítem del maestro: sale de la regla de mutación 4 de este repositorio (`CLAUDE.md:171-205` en `648432d`) y de la decisión de Gerencia registrada en Engram `decision/detector-citas-pre-push` (obs. 513, 2026-09-13). Presentar el maestro como fuente aquí sería la cita estirada que la regla de método castiga |

## Purpose

Una cita `ruta:línea` en prosa no la ve ni `tsc`, ni `eslint`, ni las pruebas: cuando una tanda mueve
o inserta líneas en un fichero citado, la cita se desfasa en silencio. El caso real lo mide
`CLAUDE.md:186-190` en `648432d`: mover dos bloques en `estados.ts` desfasó ~20 citas de medio
repositorio, y el barrido de reparación posterior dejó 16 más. Esta capacidad hace que ese desfase
sea mecánicamente comprobable en `pre-push`, de modo que un push que lo produzca no salga. Cubre el
alcance del barrido, la regla de resolución de rutas, la línea base de citas ya rotas, el mensaje del
hook, el aviso de la condición de escalada, y la instalación versionada.

**Límite explícito, y va también en el mensaje del hook (RQ-CV-10):** esta capacidad no cubre lo
semántico. Que la línea citada diga lo que su frase afirma sigue siendo trabajo de una persona.

## Requirements

### Requirement: RQ-CV-01 · Barrido COMPLETO en cada push, contra el sha local y nunca contra el árbol de trabajo

En cada push, el detector **SHALL** barrer **todas** las citas en alcance del árbol —no sólo las de
los ficheros que el push cambia—, porque con línea base que una cita esté bien o rota depende sólo del
fichero donde vive y del fichero al que apunta (decisión Q8 de la propuesta), **siempre que la cita
resuelva igual antes y después del push**. De la entrada por stdin del hook
(`<ref local> <sha local> <ref remota> <sha remoto>`), el detector **SHALL** comprobarlo todo contra el
**sha local**: la cosecha con `git grep` sobre ese sha y la lectura de cada fichero citado por revisión
sobre ese mismo sha, **nunca** contra el árbol de trabajo. Con varias referencias en la entrada,
**SHALL** comprobar cada sha local distinto. Con **borrado de rama** (sha local en ceros) **SHALL**
salir con 0 sin comprobar nada.

El **sha remoto** **SHALL** usarse **sólo como índice de resolución**, con
`git ls-tree -r --name-only <sha remoto>`, y **MUST NOT** usarse para un rango entre shas ni para
`merge-base`. Con **rama nueva** (sha remoto en ceros), el índice **SHALL** tomarse de `origin/main` si
existe; si no existe —o si el objeto del sha remoto no está en el clon—, el mensaje **MUST** decir que
la comprobación del índice remoto no se hizo, y **MUST NOT** omitirlo en silencio. La regla de bloqueo
que usa ese índice está en RQ-CV-05.

Las citas **ancladas** **MUST** leerse agrupadas por pares (revisión, fichero) en **un solo proceso
`git cat-file --batch`**, y **MUST NOT** leerse con un `git show` por cita: es lo que sostiene el coste
de RQ-CV-13.

*(Mutaciones: M1, M7, M8, M29 · Rojo: g. M6 y el rojo f quedan retirados por Q8: con el barrido
completo no hay rango que probar. M7 vuelve con su número, redefinida como la mutación del índice
remoto.)*

#### Scenario: un push que sólo mueve líneas en el fichero citado bloquea (M1, obligatoria)
- GIVEN un push que inserta líneas en un fichero citado sin tocar ningún fichero que lo cite
- WHEN corre el hook
- THEN bloquea, porque la cita quedó desfasada
- AND el mismo push con la cita ya reparada pasa con 0

#### Scenario: una rotura que llegó sin hook la caza el siguiente push con hook (M29)
- GIVEN una cita rota por un commit **ya empujado sin hook**, y un push posterior que no toca ni el
  fichero donde vive la cita ni el fichero citado
- WHEN corre el hook en ese push posterior
- THEN bloquea
- AND con esa misma cita en la línea base, informa y sale 0
- AND si el barrido se limita a los ficheros que cambia el push (mutación), sale 0 sin la base y la
  prueba se pone roja

#### Scenario: fichero citado renombrado, con cita completa y con cita pelada (rojo g, M7)
- GIVEN un push que renombra un fichero al que apuntan una cita con `/` y una cita **pelada**, sin `/`
- WHEN corre el hook
- THEN las dos bloquean como «fichero inexistente (existía en `<sha remoto>`)»
- AND si se quita el índice remoto (mutación M7), la cita pelada pasa a **saltada**, sale 0 y la prueba
  se pone roja
- AND una cita pelada a un fichero que el push **no** renombra se comprueba y sale 0

#### Scenario: rama nueva, con y sin `origin/main`
- GIVEN un push de una rama nueva (sha remoto en ceros)
- WHEN corre el hook con `origin/main` presente
- THEN el índice remoto se toma de `origin/main`
- AND sin `origin/main`, el mensaje dice que la comprobación del índice remoto no se hizo, y no lo calla

#### Scenario: reparación sin commitear no cuenta (M8)
- GIVEN una cita rota reparada sólo en el árbol de trabajo, con el commit empujado todavía roto
- WHEN corre el hook
- THEN bloquea, porque comprueba contra el sha local, no contra el árbol de trabajo

#### Scenario: borrado de rama
- GIVEN un push que borra una rama remota (sha local en ceros)
- WHEN corre el hook
- THEN sale con 0 sin comprobar nada

#### Scenario: las anclas se leen en un solo proceso
- GIVEN varias citas ancladas que forman varios pares (revisión, fichero)
- WHEN el detector las comprueba
- THEN lanza un único proceso `git cat-file --batch` para todos los pares, y ningún `git show` por
  cita

### Requirement: RQ-CV-02 · La coincidencia EXACTA de ruta tiene precedencia sobre el sufijo con frontera de segmento

El detector **SHALL** resolver primero por coincidencia **exacta** de ruta trackeada; sólo si no hay
ninguna, **SHALL** resolver por **sufijo con frontera de segmento** (`<ruta>` termina en `/<algo>`) y
**MUST NOT** tratar una subcadena del basename como sufijo válido.

*(Mutaciones: M23)*

#### Scenario: nombre pelado con varios candidatos por sufijo resuelve a la raíz
- GIVEN varios ficheros homónimos trackeados en distintos directorios del monorepo
- WHEN se comprueba una cita al nombre pelado que también existe en la raíz
- THEN resuelve a la coincidencia exacta de la raíz, no a una lista ambigua

#### Scenario: control del otro signo — sin exacta, el sufijo sigue funcionando
- GIVEN una cita a un nombre de fichero sin ningún candidato en la raíz
- WHEN se resuelve
- THEN resuelve por sufijo al único fichero trackeado que termina en `/<ese nombre>`

#### Scenario: mutación — quitar la precedencia (M23)
- GIVEN que se retira la precedencia de coincidencia exacta
- WHEN se comprueba cualquier cita al nombre pelado con varios candidatos
- THEN pasa de comprobada a ambigua y se salta, y el contador de saltadas sube

### Requirement: RQ-CV-03 · Una cita ambigua bloquea sólo si está rota en TODAS sus candidatas

Cuando un token resuelve por sufijo a **varios** ficheros trackeados, el detector **SHALL** comprobar
la cita contra cada candidata. **SHALL** bloquear únicamente si está rota en **todas**; si al menos
una la valida, **SHALL** saltarla e informarla en el contador de saltadas.

*(Mutaciones: M15)*

#### Scenario: rota en todas las candidatas
- GIVEN un token con varias candidatas trackeadas y la línea citada rota en todas ellas
- WHEN corre el hook
- THEN bloquea

#### Scenario: válida en una sola candidata
- GIVEN el mismo token con la línea válida en una sola de sus candidatas
- WHEN corre el hook
- THEN se salta, no bloquea, y el contador de saltadas sube en 1

### Requirement: RQ-CV-04 · La categoría "fuera del repositorio" se evalúa antes que cualquier otra regla de resolución

Un token que empieza por `~/`, por `/`, por letra de unidad (`C:\` o `C:/`), o que lleva esquema
`://`, **SHALL** clasificarse como **fuera del repositorio** antes de aplicar cualquier otra regla de
resolución. **MUST NOT** bloquear, **MUST NOT** entrar en la línea base, y **SHALL** contarse en su
**propia cifra**, separada de las demás saltadas.

*(Mutaciones: M28)*

#### Scenario: ruta absoluta fuera del árbol se salta en su propia cifra
- GIVEN una cita cuyo token empieza por `~/`
- WHEN corre el hook
- THEN se salta, se cuenta en la cifra de "fuera del repositorio", y no bloquea aunque la línea
  citada no exista

#### Scenario: control del otro signo — una ruta relativa que no resuelve sigue bloqueando
- GIVEN una cita a un fichero relativo que no existe en el árbol
- WHEN corre el hook
- THEN bloquea como "fichero inexistente", porque no cae en la categoría fuera del repositorio

#### Scenario: mutación — quitar la categoría (M28)
- GIVEN que se retira la categoría "fuera del repositorio"
- WHEN se comprueba la cita del primer escenario
- THEN pasa de "saltada" a "bloqueante", como fichero inexistente

### Requirement: RQ-CV-05 · Lo que resolvía en el remoto y ya no resuelve bloquea; si no, sin `/` se informa y con `/` bloquea; un directorio se salta

Un token que **resolvía** en el índice remoto de RQ-CV-01 y **no resuelve** en el sha local **MUST**
bloquear como «fichero inexistente (existía en `<sha remoto>`)», **lleve `/` o no**: es el fichero que
el push borra o renombra. Esta regla **SHALL** evaluarse después de la categoría «fuera del
repositorio» de RQ-CV-04 y **antes** de las dos siguientes. Un token que **no resuelve** ni en el sha
local ni en el índice remoto y **contiene** `/` **SHALL** bloquear como "fichero inexistente". Un token
que no resuelve en ninguno de los dos y **no contiene** `/` **SHALL** saltarse e informarse, sin
bloquear. Un token que resuelve a un **directorio** **SHALL** saltarse e informarse: una cita a un
directorio con número de línea no es comprobable.

Sin el índice remoto, el renombrado de un fichero dejaría saltadas todas sus citas peladas, y hoy
**1.084 citas sin `/` resuelven a un único fichero** (medido el 2026-09-13 sobre `e6104af`, sin
archive, `superpowers-main` ni `.agent/skills/`; 133 a `packages/shared/src/transitions.ts`).

*(Mutaciones: M7 para la primera regla; las otras tres las fija la decisión Q2 y las exige el criterio
de aceptación correspondiente del §15.)*

#### Scenario: cita pelada a un fichero que el push renombra bloquea (M7)
- GIVEN una cita pelada, sin `/`, a un fichero que resolvía en el índice remoto
- WHEN un push renombra ese fichero y corre el hook
- THEN bloquea como «fichero inexistente (existía en `<sha remoto>`)»
- AND sin el índice remoto (mutación), la misma cita se salta y sale 0

#### Scenario: token sin barra que no resuelve se informa
- GIVEN una cita con número de línea cuyo nombre no lleva `/` y no resuelve a ningún fichero trackeado,
  ni en el sha local ni en el índice remoto
- WHEN corre el hook
- THEN se salta e informa, sin bloquear

#### Scenario: token con barra que no resuelve bloquea
- GIVEN una cita con número de línea a una ruta relativa que no existe en el árbol
- WHEN corre el hook
- THEN bloquea como fichero inexistente

#### Scenario: token que resuelve a un directorio se salta
- GIVEN una cita con número de línea que resuelve a un directorio del árbol
- WHEN corre el hook
- THEN se salta e informa, sin bloquear

### Requirement: RQ-CV-06 · La forma abreviada se atribuye al último fichero anterior por índice, y la anclada se verifica por revisión

La forma abreviada (`` `:N` ``) **SHALL** atribuirse al último nombre de fichero que aparece **antes**
de ella, por índice, en su **misma línea física** — nunca al último nombre de la línea completa —, y
sólo cuando ese nombre cumple los cuatro requisitos de cosecha: **(a)** el patrón del nombre **MUST
NOT** ser una lista de extensiones; **(b)** **SHALL** admitir que el nombre empiece por punto; **(c)**
la atribución **SHALL** ir al fichero anterior por índice, no al último de la línea; **(d)** una
mención **pelada** (sin número de línea) que resuelva a un fichero trackeado **SHALL** contar como
fichero al que atribuir. Sin fichero previo válido, la abreviada **SHALL** informarse como huérfana y
**MUST NOT** bloquear. Una cita **anclada** (`<ruta>:<N>` en `` `<rev>` ``) **SHALL** verificarse contra el
fichero en esa revisión, leído como exige RQ-CV-01; una revisión inexistente **MUST** bloquear.

*(Mutaciones: M3, M20, M24, M25, M26, M27 · Rojo: d)*

#### Scenario: abreviadas válidas tras un nombre con punto inicial se cosechan y comprueban
- GIVEN una línea con un nombre de fichero seguido de varias abreviadas válidas, incluyendo un
  nombre de fichero que empieza por punto
- WHEN corre el hook
- THEN todas figuran entre las **comprobadas**, no entre las huérfanas

#### Scenario: (a) un nombre sin extensión se cosecha y se comprueba (M24)
- GIVEN una cita válida a un fichero trackeado cuyo nombre no lleva extensión, como `Dockerfile`
- WHEN corre el hook
- THEN sale 0 **y** la cita figura entre las **comprobadas** — salir 0 no basta, porque una cita que
  no se cosecha también sale 0
- AND la misma cita con la línea fuera de rango bloquea
- AND si el patrón del nombre pasa a ser una lista de extensiones (mutación), la cita rota deja de
  cosecharse y sale verde

#### Scenario: (b) un nombre que empieza por punto se cosecha (M25)
- GIVEN una cita válida a `.dockerignore` y otra a ese mismo fichero con la línea fuera de rango
- WHEN corre el hook
- THEN la válida figura entre las **comprobadas** y la rota bloquea
- AND si el nombre tiene que empezar por letra o dígito (mutación), se cosecha el nombre sin el punto,
  que no resuelve ni lleva `/`: la rota pasa a **saltada** y sale verde

#### Scenario: (c) la abreviada va al fichero anterior por índice, en los dos órdenes (M26)
- GIVEN una línea «fichero A, abreviada, fichero B» con la línea citada válida en A y vacía en B
- WHEN corre el hook
- THEN sale 0
- AND con A y B intercambiados —vacía en A, válida en B— bloquea
- AND si la abreviada se atribuye al último fichero de la línea (mutación), las dos salidas se
  invierten: falso positivo en el primer orden y escape en el segundo

#### Scenario: (d) la mención pelada que resuelve captura; la que no resuelve no (M27)
- GIVEN una línea que nombra `.dockerignore` sin número de línea, y detrás `.git` y `docs` —el primero
  no trackeado, el segundo un directorio—, cada uno seguido de una abreviada válida para `.dockerignore`
- WHEN corre el hook
- THEN las abreviadas se atribuyen a `.dockerignore` y figuran entre las **comprobadas**, ninguna entre
  las huérfanas
- AND la misma línea con una abreviada fuera de rango bloquea
- AND si se quita (d) (mutación), las abreviadas quedan huérfanas y la rota sale verde; y si captura
  cualquier token pelado, resuelva o no (mutación), la abreviada va a `.git` o a `docs`, se salta y
  la rota también sale verde

#### Scenario: revisión inventada en una cita anclada bloquea
- GIVEN una cita anclada a una revisión que no existe en el repositorio
- WHEN corre el hook
- THEN bloquea, porque la revisión no existe y el fichero no puede leerse en ella
- AND la misma cita anclada a una revisión real pasa con 0

#### Scenario: mutación — el ancla protege contra el desfase de contenido (M20, repositorio sintético)
- GIVEN un repositorio sintético con una cita desanclada a otro fichero del mismo repositorio, y un
  commit que inserta líneas delante de la línea citada de modo que cae en línea vacía
- WHEN corre el hook
- THEN bloquea
- AND la misma cita, anclada a la revisión ANTERIOR a la inserción, pasa — es la única prueba de que
  el anclaje protege algo. Esta mutación nunca corre sobre las líneas reales de `CLAUDE.md`

### Requirement: RQ-CV-07 · El barrido cubre sólo ficheros trackeados, y excluye el archive y las skills de terceros

El detector **SHALL** limitarse a ficheros bajo control de versiones. **MUST** excluir del barrido
`openspec/changes/archive/` (registro fechado), `.claude/skills/superpowers-main/` (de terceros,
verificado) y `.agent/skills/` (skills importadas: de terceros verificado sólo en `react-components`,
hipótesis en las otras cinco, y hoy con 0 citas). La exclusión es **del barrido** —de las citas que
viven en esos directorios—, **no del índice de resolución**: sus ficheros siguen siendo candidatos al
resolver una ruta, y la precedencia exacta de RQ-CV-02 decide igual.

*(Mutaciones: M5, M14 · Rojo: e)*

#### Scenario: fichero sin trackear se ignora
- GIVEN una cita rota en un fichero sin trackear
- WHEN corre el hook
- THEN se ignora, sale 0

#### Scenario: control del otro signo — el mismo fichero, ya trackeado, bloquea
- GIVEN el mismo fichero tras un `git add`
- WHEN corre el hook
- THEN bloquea: el alcance es "trackeado", no "existe en disco"

#### Scenario: cita rota dentro de un directorio excluido se ignora
- GIVEN una cita rota dentro de `openspec/changes/archive/`, otra dentro de
  `.claude/skills/superpowers-main/` y otra dentro de `.agent/skills/`
- WHEN corre el hook
- THEN las tres se ignoran, sale 0
- AND la misma cita fuera de los tres directorios bloquea

### Requirement: RQ-CV-08 · Comprobación mecánica: fichero, rango, línea vacía, y los DOS extremos por separado

Para cada cita en alcance, el detector **MUST** verificar: que el fichero exista en la revisión
empujada; que la línea citada esté **dentro de rango**; que la línea **no esté vacía**; y, para un
rango, **ambos extremos por separado**, con el mensaje nombrando **cuál** de los dos falla.

*(Mutaciones: M2, M4 · Rojos: a, b, c)*

#### Scenario: cita rota bloquea, la misma válida pasa (rojos a, b)
- GIVEN una cita a una línea vacía de un doc trackeado
- WHEN corre el hook
- THEN bloquea
- AND la misma cita apuntando a una línea con contenido pasa con 0

#### Scenario: el extremo FINAL fuera de rango, con el inicial correcto (rojo c, M4)
- GIVEN un rango cuyo extremo final excede el número de líneas del fichero, con el inicial dentro de
  rango
- WHEN corre el hook
- THEN bloquea y el mensaje nombra el extremo **final**

#### Scenario: control de la dirección inversa — inicial en línea en blanco, final correcto (M4)
- GIVEN un rango cuyo extremo inicial cae en una línea en blanco, con el final correcto
- WHEN corre el hook
- THEN bloquea y el mensaje nombra el extremo **inicial**
- AND probar sólo una dirección dejaría fuera la mitad del modo de fallo dominante medido en la
  propuesta

### Requirement: RQ-CV-09 · La línea base sólo encoge, se genera por el detector, y no crece desde el hook

La línea base (fichero, línea de la cita, cita literal) **SHALL** generarse por el detector, nunca
copiarse a mano. El hook **SHALL** informar — no bloquear — de las citas presentes en ella. Si una
entrada de la base **ya no está rota**, el hook **MUST** fallar hasta que se quite de la base. Una
cita rota que **no** está en la base **MUST** bloquear siempre: la base **MUST NOT** crecer desde el
hook — añadir una entrada exige editar el fichero a mano.

*(Mutaciones: M9, M10, M17)*

#### Scenario: entrada de la base ya reparada pone el hook rojo (M9)
- GIVEN una cita de la base que ya no está rota, sin quitar su entrada
- WHEN corre el hook
- THEN falla
- AND quitando también la entrada de la base, pasa con 0

#### Scenario: cita rota nueva, con la base ya presente, bloquea (M10)
- GIVEN una cita rota nueva que no está en la base
- WHEN corre el hook
- THEN bloquea: la base no la absorbe automáticamente

#### Scenario: mutación de posición — consultar la base después de decidir el bloqueo (M17)
- GIVEN que la consulta a la línea base se mueve para correr **después** de decidir si bloquea
- WHEN corre el hook con una cita rota que **sí está** en la base
- THEN esa cita **bloquea** en vez de informarse, y la prueba de la base se pone roja
- AND si la prueba siguiera verde con la consulta movida, el orden no estaría probado — un comentario
  que declare el orden deliberado no sustituye a esta prueba

### Requirement: RQ-CV-10 · El mensaje declara las cifras, lo que no comprueba, y las dos salidas legítimas

En cada ejecución, el mensaje del hook **MUST** imprimir las cifras de citas **comprobadas** y
**saltadas**, con las de **fuera del repositorio** desglosadas aparte. **MUST** declarar explícitamente
que **no comprueba lo semántico** (si la línea dice lo que la frase afirma). **MUST** nombrar las
**dos** salidas legítimas de un bloqueo: reparar la cita, o añadirla a la línea base a mano.
`--no-verify` **MUST NOT** presentarse como salida.

*(No tiene mutación dedicada en el §6: lo exigen los criterios de aceptación del §15 sobre las dos
cifras, la declaración de lo no comprobado y las dos salidas legítimas.)*

#### Scenario: mensaje completo en una ejecución con citas saltadas
- GIVEN una ejecución con citas comprobadas, ambiguas saltadas y fuera del repositorio
- WHEN el hook termina
- THEN imprime las tres cifras por separado y la frase que declara qué no comprueba

#### Scenario: mensaje de bloqueo nombra las dos salidas
- GIVEN una cita rota que bloquea el push
- WHEN se imprime el mensaje
- THEN nombra reparar la cita y añadirla a la base a mano, y no menciona `--no-verify`

### Requirement: RQ-CV-11 · El aviso de la condición de escalada: más de una identidad, sin bloquear

En cada push, el hook **SHALL** ejecutar `git shortlog -sne --all` y, si aparece **más de una
identidad** de autor, **SHALL** imprimir un aviso visible que nombra la salida (añadir el job de CI
con `fetch-depth: 0`), **sin** cambiar el código de salida. Con **una** identidad, **MUST NOT**
imprimir aviso.

*(Mutaciones: M21 · Rojo: i)*

#### Scenario: una identidad, sin aviso
- GIVEN un repositorio sintético con una sola identidad de autor
- WHEN corre el hook
- THEN no imprime ningún aviso de escalada

#### Scenario: dos identidades, aviso sin bloquear
- GIVEN un repositorio sintético con dos identidades de autor
- WHEN corre el hook
- THEN imprime el aviso visible
- AND el código de salida es el mismo que con una identidad: el aviso no se convierte en guarda

#### Scenario: hueco declarado — un segundo clon con `--ignore-scripts` no genera aviso, pero lo que rompe no se pierde
- GIVEN la misma identidad de autor empujando desde un segundo clon instalado con `--ignore-scripts`
  (sin hook)
- WHEN esa identidad empuja una cita rota
- THEN `git shortlog` sigue viendo una sola identidad y no hay aviso
- AND la cita rota la caza el **siguiente push con hook**, desde cualquier clon, por el barrido
  completo de RQ-CV-01 (M29)
- AND el hueco que queda es de momento, no de detección: evitar que la rotura llegue al remoto lo cubre
  sólo la línea manual de instalación de `DEPLOY.md`, no este requisito

### Requirement: RQ-CV-12 · La instalación vive en un `.mjs`, con guarda de dos signos y fallo visible

El script `prepare` de `package.json` **MUST** invocar un instalador `.mjs` (nunca lógica de guarda en
línea de shell) que compruebe `git rev-parse --git-dir` vía `spawnSync`. **Sin** `.git` o **sin**
binario `git`, **SHALL** salir con 0 y **NO** instalar. **Con** `.git` presente, **SHALL** salir con 0
**y** fijar `git config core.hooksPath .githooks`. Si `git config` falla **con** repositorio presente,
**MUST** imprimir un mensaje visible y **MUST NOT** hacer fallar `npm ci`. Si el hook corre sin sus
dependencias de runtime, **MUST** fallar con mensaje explícito, nunca salir con 0 en silencio.

El hook **MUST** invocar el detector con `node_modules/.bin/tsx` o con `npx --no tsx`, y **MUST NOT**
invocarlo con `npx tsx` a secas. La documentación de la instalación local (npm 11.17.0, `npm-exec.md`,
línea 29) dice que, cuando el stdin no es un TTY, `npx` asume `--yes`; en `pre-push` el stdin es una
tubería, así que sin `node_modules` `npx tsx` descargaría `tsx` y el hook seguiría, en vez de fallar.
`--no-install` también lo evita, pero esa misma documentación lo da por obsoleto y lo convierte en
`--no` (línea 298). La invocación **SHALL** vigilarla un **guardián estático** sobre `.githooks/pre-push`,
nunca un control que ejecute `npx` y dependa de la red.

(El servidor arranca hoy con `tsx`: `package.json:13` en `648432d` y `package.json:15` en `648432d`;
`package.json:10-23` en `648432d` no declara `prepare` — es lo que esta capacidad añade.)

*(Mutaciones: M11, M12, M13, M16 · Rojo: h)*

#### Scenario: sin `.git`, no instala (control de un signo, insuficiente solo)
- GIVEN un directorio sin `.git`
- WHEN corre `npm ci`
- THEN el instalador sale 0 y no instala nada

#### Scenario: con `.git`, instala de verdad (el signo que falta en una guarda de shell)
- GIVEN un directorio con `.git` presente
- WHEN corre `npm ci`
- THEN el instalador sale 0 **y** `git config --get core.hooksPath` devuelve `.githooks`

#### Scenario: sin binario `git`, como en `node:22-alpine` (M12)
- GIVEN un entorno sin binario `git`, donde `spawnSync` devuelve `status` nulo
- WHEN corre el instalador
- THEN sale 0 y no instala
- AND con `git` presente y `.git` en el directorio, instala

#### Scenario: `git config` falla con repositorio presente
- GIVEN que `git config core.hooksPath` falla con `.git` presente
- WHEN corre el instalador
- THEN imprime un mensaje visible en la salida de `npm ci` y **no** tumba la instalación

#### Scenario: hook sin dependencias falla en voz alta (M16)
- GIVEN `node_modules` borrado antes de un push, con el hook invocando `node_modules/.bin/tsx` o
  `npx --no tsx`
- WHEN corre el hook
- THEN falla con mensaje explícito, nunca sale 0 en silencio

#### Scenario: guardián estático de la invocación, sin red (control de M16)
- GIVEN un guardián que lee `.githooks/pre-push` y falla si invoca `tsx` con `npx` sin `--no`
- WHEN el fichero vigilado invoca `node_modules/.bin/tsx` o `npx --no tsx`
- THEN el guardián pasa
- AND si se ensucia el fichero vigilado escribiendo `npx tsx` a secas (regla de mutación 2 del
  proyecto), el guardián se pone rojo, sin ejecutar `npx` ni depender de la red

### Requirement: RQ-CV-13 · Coste: objetivo ≤ 5 s, tope duro 10 s

El tiempo total del hook, medido invocándolo directamente con la misma entrada que git le pasa por
stdin y **sobre el árbol completo** —con el barrido de RQ-CV-01, el push típico y el más caro cuestan
lo mismo—, **SHALL** ser **≤ 5 s** (objetivo) y **MUST NOT** superar **10 s** (tope duro). El tiempo
**SHALL** incluir el arranque de `tsx`, la lectura de las anclas en un solo `git cat-file --batch`
(RQ-CV-01), el índice remoto (RQ-CV-01) y el aviso de escalada.

**Coste ya medido antes de construirlo, con su procedencia** (2026-09-13):

| Pieza | Tiempo | Procedencia |
|---|---|---|
| Prototipo del barrido completo: 1.873 citas en 663 ficheros, sin leer anclas | 541 ms | nivel 2 de la propuesta |
| Anclas: 53 citas, 8 pares (revisión, fichero), en un solo `git cat-file --batch` | 0,12 s | analista; reproducido por el orquestador en 31-49 ms |
| La misma lectura con un `git show` por par, para comparar | 0,75 s | analista; reproducido en 280-299 ms |
| `git shortlog -sne --all`, tres intentos | 267 / 281 / 314 ms | nivel 2 de la propuesta |
| Índice remoto: `git ls-tree -r --name-only` de un sha (665 rutas) y el índice de sufijos en Node, cinco intentos | 64 / 39 / 33 / 34 / 61 ms | orquestador; desde bash, sólo el `ls-tree` da 163-194 ms por el arranque de proceso de Git Bash |
| **Total: prototipo, anclas, shortlog e índice remoto** | **~1 s contra 5 s** | suma; **sin** el arranque de `tsx`, que se mide en la tanda |

*(Mutaciones: M19; decisiones Q3 y Q8 de la propuesta)*

#### Scenario: medición dentro del objetivo
- GIVEN el árbol completo, con sus citas ancladas
- WHEN se invoca el hook directamente con la entrada real por stdin
- THEN el tiempo total, con el arranque de `tsx`, las anclas, el índice remoto y el aviso de escalada,
  queda dentro de 5 s, y el número se registra

#### Scenario: control del tope duro
- GIVEN la misma medición
- WHEN se compara contra el tope
- THEN el tiempo no supera los 10 s bajo ninguna circunstancia medida

### Requirement: RQ-CV-14 · Precondición dura: 0 bloqueantes antes de instalar, y otra vez al final sobre lo commiteado

Antes de instalar el hook, el detector **MUST** dar **0 bloqueantes** sobre el árbol, mediante la
línea base ya generada. **MUST** repetirse la comprobación **al final**, sobre los artefactos de la
tanda ya **commiteados** (proposal, spec, design, tasks, `CLAUDE.md` y `openspec/config.yaml`, éstos
dos con IV-10 ya dentro). La comprobación sobre el árbol intermedio **MUST NOT** sustituir a esta
segunda.

*(Mutaciones: M18)*

#### Scenario: orden correcto — detector, base, IV-10, hook
- GIVEN el orden detector-con-pruebas → línea base generada → IV-10 escrito → hook e instalador
- WHEN se instala el hook
- THEN el primer push no queda bloqueado por citas que la tanda no rompió

#### Scenario: mutación — instalar antes de generar la base (M18)
- GIVEN que el hook se instala **antes** de generar la línea base
- WHEN se hace el push de cierre
- THEN se bloquea por citas que esta tanda no rompió — el orden es criterio de aceptación, no una
  recomendación

#### Scenario: la comprobación final se hace sobre lo commiteado, no sobre el árbol intermedio
- GIVEN que la comprobación intermedia dio 0 bloqueantes antes de insertar IV-10
- WHEN se repite la comprobación al final, con IV-10 y los cuatro ficheros de la tanda ya commiteados
- THEN es esta segunda medición la que decide, porque la intermedia es exactamente el estado en el
  que una medición anterior de la propuesta salió cierta y luego dejó de serlo

### Requirement: RQ-CV-15 · IV-10 se registra sin dueño asignado, y la regla de mutación 4 gana una frase

Un nuevo incumplimiento vivo, **IV-10**, **SHALL** añadirse a `CLAUDE.md` y a `incumplimientos_vivos`
de `openspec/config.yaml`, apuntando a la línea base generada, con cifra y fecha de medición, y
**SIN** dueño asignado, declarando explícitamente: «la base no encoge hasta que Gerencia asigne quién
la repara». El recuento de `CLAUDE.md:249` en `648432d` (que hoy dice **"Cuatro"** desvíos vivos)
**SHALL** pasar a **"Cinco"**. La regla de mutación 4 de `CLAUDE.md` — `CLAUDE.md:171-205` en `648432d`
— **SHALL** ganar la frase: «un ejemplo de cita rota se escribe sin forma de cita, o el detector lo
tratará como rota».

*(Mutaciones: M22; decisiones Q4 y Q6 de la ronda de preguntas de la propuesta)*

#### Scenario: IV-10 declarado sin dueño
- GIVEN la fila IV-10 recién escrita en `CLAUDE.md` y en `openspec/config.yaml`
- WHEN se revisa su campo de destino
- THEN dice explícitamente que no tiene dueño asignado, con la frase de la decisión Q4, y no un
  destino por omisión

#### Scenario: el recuento pasa de Cuatro a Cinco
- GIVEN el texto de `CLAUDE.md:249` en `648432d`, que hoy dice "Cuatro"
- WHEN se añade IV-10
- THEN el texto pasa a decir "Cinco", y la tabla gana la fila correspondiente

#### Scenario: mutación — un ejemplo de cita rota CON forma de cita bloquea (M22)
- GIVEN un ejemplo de cita rota escrito **con** forma de cita (nombre de fichero seguido de dos
  puntos y un número) en un doc trackeado
- WHEN corre el hook
- THEN el detector lo trata como cita real y bloquea
- AND el mismo ejemplo escrito **sin** forma de cita —nombrando el fichero y la línea en prosa— pasa:
  es la prueba de que la frase nueva de la regla de mutación 4 hacía falta

### Requirement: RQ-CV-16 · Un `host:puerto` dentro de una URL SHOULD no contarse como cita

El cosechador **SHOULD** no tratar un `host:puerto` dentro de una URL con esquema (`<esquema>://…`)
como una cita `ruta:línea`. El alcance final de esta regla lo cierra `sdd-design`, con la medición ya
hecha en la propuesta (18 casos de `host:puerto` sobre 864 candidatas sin `/`, medido el 2026-09-13,
nivel 2 de procedencia, no reverificado en esta spec).

*(No tiene mutación dedicada en el §6: es la nota de la Pieza 2 de la propuesta sobre `host:puerto`,
con su control de dos signos ya medido allí.)*

#### Scenario: puerto dentro de URL no se cuenta ni como comprobada ni como saltada
- GIVEN una mención de un `host:puerto` dentro de una URL con esquema, en un doc trackeado
- WHEN corre el cosechador
- THEN no figura ni entre las comprobadas ni entre las saltadas

#### Scenario: control del otro signo — una cita real de dos puntos sigue siendo cita
- GIVEN, en el mismo documento, una cita real a un fichero de la imagen de contenedor con su línea
- WHEN corre el cosechador
- THEN esa cita se cosecha y se comprueba con normalidad, porque no está dentro de una URL con esquema

### Requirement: RQ-CV-17 · `sdd-design` declara los huecos que esta spec no cierra

`sdd-design` **MUST** declarar por escrito, sin resolverlos en esta spec, los siguientes puntos: si la
atribución de una abreviada mira también la línea anterior, el párrafo, o el fichero de detrás cuando
no hay ninguno antes por índice; si la detección del ancla mira también la línea siguiente a la cita;
si se descartan marcas de tiempo ISO y horas (`HH:MM`) de la cosecha; si `docs/artefactos/` se excluye
del barrido, decidido por el coste medido con y sin esa carpeta; y el nombre exacto de los ficheros del
detector y el formato de la línea base.

**El umbral de la línea base NO es un hueco: lo fija el riesgo R-14 de la propuesta.** Antes de cerrar,
`sdd-design` **MUST** medir el tamaño de la base con el prototipo y con la atribución de abreviadas que
elija. El umbral es **100 entradas**, calculado contra `review_budget_lines: 800`
(`openspec/config.yaml:29` en `648432d`) y suponiendo una línea por entrada; si el formato ocupa más,
se divide por las líneas de cada entrada. Si la medición pasa del umbral, el diseño **MUST** parar y
preguntar a Gerencia **antes** de que se genere la base.

*(No es un requisito de comportamiento del detector, sino un requisito sobre el propio proceso de
diseño: que el hueco quede escrito, no omitido, y que el umbral se mida antes de cerrar.)*

#### Scenario: el diseño documenta el hueco, no lo resuelve en silencio
- GIVEN que la atribución de abreviadas deja huérfano entre el 60 % y el 71 % de las abreviadas del
  repositorio, según el patrón de cosecha elegido (medido el 2026-09-13 en la propuesta, nivel 2 de
  procedencia, no reverificado en esta spec)
- WHEN `sdd-design` fija el criterio de atribución
- THEN el documento de diseño declara explícitamente qué queda sin atribuir y por qué, en vez de
  omitirlo

#### Scenario: la base medida supera el umbral de R-14
- GIVEN que la medición con la atribución elegida da más de 100 entradas en la línea base
- WHEN `sdd-design` va a cerrarse
- THEN no se cierra ni se genera la base: se pregunta a Gerencia con la cifra medida

### Requirement: RQ-CV-18 · El detector vive fuera de `testing/`, no lo importa nada de producción y viaja inerte

El detector **SHALL** vivir en una carpeta hermana de `apps/desk/server/`, **nunca** en `testing/`:
la cobertura incluye el servidor (`vitest.config.ts:53`) y excluye `testing/` (`vitest.config.ts:57`),
así que en `testing/` sería la única pieza del servidor cuya cobertura no mide nadie. Su fichero
**SHALL** declarar por escrito dos cosas: que viaja a la imagen de producción como código inerte, y que
**nada de producción lo importa**. `apps/desk/server/index.ts` **MUST NOT** alcanzarlo en su grafo de
imports, y eso **SHALL** comprobarse, no sólo declararse.

*(No tiene mutación dedicada en el §6: lo exigen los criterios de aceptación del §15 sobre la carpeta
hermana y el grafo de imports, y la Pieza 4 de la propuesta.)*

#### Scenario: el grafo de imports de producción no llega al detector
- GIVEN el árbol con el detector en su carpeta hermana
- WHEN se recorre el grafo de imports desde `apps/desk/server/index.ts`
- THEN ningún fichero del detector aparece en él
- AND si un módulo de producción pasa a importar el detector, la comprobación falla

#### Scenario: la cobertura del detector cuenta
- GIVEN el detector en su carpeta hermana, fuera de `testing/`
- WHEN corre la suite con cobertura
- THEN los ficheros del detector entran en la medición contra los umbrales del servidor
