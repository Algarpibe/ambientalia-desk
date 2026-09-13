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
>    citas y su reparto, las 43 rotas del sondeo, la línea base de 47 entradas medida sobre `20a951d`
>    (Pieza 3), los 663 ficheros trackeados, la tabla de tres variantes de la guarda del `prepare`, los tiempos del §7 y
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
2. **El alcance del barrido: COMPLETO en cada push**, contra el sha local que se empuja (§3, Pieza 1;
   decisión Q8, que sustituye al alcance anterior de «lo que el push pone en juego»).
3. **La regla de resolución de rutas** (§3, Pieza 2), y **la forma abreviada como cita INFORMATIVA**:
   se atribuye, se comprueba y se informa en su propia cifra, con fichero, línea y motivo, pero **no
   bloquea ni entra en la línea base** (§3, Pieza 2; decisión Q9).
4. **La línea base de citas ya rotas que BLOQUEAN** —completas y ancladas, ninguna abreviada—,
   versionada, **generada por el detector** y que **sólo puede encoger** (§3, Pieza 3). Medida en **47
   entradas** sobre `20a951d` (R-14).
5. **El aviso de la condición de escalada** en el propio hook: `git shortlog -sne --all`, y con más de
   una identidad un aviso visible **que no bloquea** (§3, Pieza 6), con prueba de los dos signos.
6. **El hook**, en `.githooks/pre-push`, con `core.hooksPath` (§3, Pieza 5).
7. **El instalador**: un `.mjs` con la guarda en Node, invocado desde un script `prepare` nuevo
   (`package.json:10-23` en `648432d` no lo tiene), más una línea en `DEPLOY.md`.
8. **Fila de incumplimiento vivo nueva (IV-10)** en `CLAUDE.md` y en `openspec/config.yaml`, con la
   cifra y la fecha de medición, apuntando a la línea base, y con la frase que Gerencia fijó en Q4:
   **«la base no encoge hasta que Gerencia asigne quién la repara»**.
9. **Dos frases nuevas en la regla de mutación 4 de `CLAUDE.md`**, las dos en la **unidad de trabajo
   2** (§11). La de la decisión Q6: «un ejemplo de cita rota se escribe sin forma de cita, o el detector
   lo tratará como rota». Y la de la decisión Q9: el detector **no bloquea la forma abreviada**, así que
   su comprobación sigue siendo **de lectura humana**, con el informe del hook como ayuda.
10. **El anclaje a `648432d` de todas las citas de los artefactos de esta tanda** a los cuatro ficheros
    que la tanda modifica (decisión Q7).

### No entra

- **Lo semántico.** Que la línea diga lo que la frase afirma sigue siendo trabajo de una persona
  (§12). El detector no lo intenta y su mensaje lo dice.
- **El job de CI con `fetch-depth: 0`.** Es la **condición de escalada**: el hook la vigila y avisa,
  pero no la construye.
- **Reparar las 47 citas ya rotas que bloquean** (medidas sobre `20a951d`; el sondeo dio ~43). Van a la
  línea base. Repararlas no es renumerar: son los tres casos A/B/C de `CLAUDE.md:195-199` en `648432d`,
  y elegir entre ellos exige leer qué afirma cada frase.
- **Bloquear por la forma abreviada** (decisión Q9). **El referente de una abreviada lo decide quien lee
  el contexto, no la sintaxis.** Con la atribución de la Pieza 2, las abreviadas rotas del árbol
  incluyen citas **válidas a otro documento**: 19 citaban el maestro nombrado en prosa, 16 cruzaban
  celdas de la misma tabla de `tickets-core/spec.md`, y al menos 3 más no las ve ningún corte
  sintáctico (Pieza 2). Un hook que bloquea no puede cargar con eso: las abreviadas se **informan**.
- **Barrer `docs/artefactos/`.** Medido el 2026-09-13 sobre `20a951d` (nivel 2 de procedencia): el HTML
  exportado del blueprint aporta **12 falsos positivos** de JavaScript minificado —expresiones como una
  letra, barra, número, dos puntos y cero—, **1,2-1,3 s** de cosecha y **3.510 saltadas**. Queda
  **fuera del barrido**, declarado igual que el archive; **no del índice de resolución**: sus dos ficheros siguen siendo candidatos al resolver una
  ruta.
- **Desambiguar las 145 citas ambiguas** (decisión Q1): es una migración con decisión de alcance.
- **Barrer `openspec/changes/archive/`.** Es registro fechado. Medido: las **20** citas al fichero
  `CLAUDE.md` con número de línea que hay en el repositorio están **todas** dentro del archive, y una
  de ellas —en el `proposal.md` de `por-entregar-es-espera`— apunta a la línea 206 de `CLAUDE.md`, que
  **hoy está vacía**. Es el caso B de la regla 4 y **se queda como está**.
- **Barrer `.claude/skills/superpowers-main/`.** Son **41** ficheros trackeados **de terceros**, y ya no
  es hipótesis por el nombre: los 41 tienen homólogo en el plugin `superpowers` 5.1.0 instalado en la
  máquina, que declara un autor ajeno al proyecto, y **40 son idénticos byte a byte** (el que difiere es
  un `.dot` de `writing-skills`). Sus citas **no son afirmaciones del proyecto**, así que el directorio
  queda fuera del barrido igual que el archive, **declarado** y no escondido. Su ejemplo de ruta
  inventada —en el `SKILL.md` de `writing-plans`, línea 70— **no va a la línea base**.
- **Barrer `.agent/skills/`.** Son **34** ficheros trackeados, en seis skills. **Que sean de terceros
  está verificado sólo para una de las seis:** **cuatro** ficheros de `react-components` llevan cabecera
  de licencia Apache 2.0 con «Copyright 2026 Google LLC» (dos `.tsx`, un `.sh` y un `.js`). El literal
  «Apache-2.0» sólo aparece en su `package-lock.json`, y ahí son licencias de **dependencias**, no de
  la skill. Los enlaces a los repositorios de shadcn-ui y de remotion **no prueban autoría**: el
  `SKILL.md` de remotion remite a las skills que mantiene Remotion, que son otras. **Hipótesis**, sin
  evidencia de licencia: que las otras cinco también sean de terceros. *(La versión anterior decía
  «verificado» para las seis, contaba tres ficheros con «Google LLC» y tomaba el `package-lock.json` y
  los enlaces por prueba: estaba inflada.)* Queda **fuera del barrido** porque hoy tiene **0 citas**, así
  que excluirlo no cambia ninguna cifra, y porque la que está verificada no es afirmación del proyecto. ⚠️ La exclusión es **del barrido** —de las citas que viven
  ahí—, **no del índice de resolución**: su `package.json` sigue siendo candidato, y la precedencia
  exacta de la Pieza 2 resuelve el nombre pelado a la raíz igual.
- **Ficheros sin trackear.** Los 8 de hoy quedan fuera por construcción, sin lista de exclusión.
- **Hooks de `pre-commit` o `commit-msg`.** Un hook por push, y sólo uno.
- **Renumerar citas automáticamente.** Un barrido que renumera a ciegas convierte un registro fechado
  en una afirmación falsa y **parece** reparado (`CLAUDE.md:201-205` en `648432d`).
- **Tocar `.git/hooks`** (se pierde con cada clon), los umbrales de `vitest.config.ts:58-63`, ni
  instalar `husky`, `lint-staged`, `jsdom` o `@testing-library`.
- **`--no-verify`. Nunca.** El push que cierre esta tanda es la primera ejecución real del hook.

---

## 3 · Enfoque, pieza a pieza

### Pieza 1 · El alcance: barrido COMPLETO en cada push (decisión Q8)

**Cambió el 2026-09-13, después de la ronda del §13.** La versión anterior barría «lo que el push pone
en juego»: las citas que viven en un fichero que el push cambia más las que apuntan a uno. Gerencia
decidió el **barrido completo** con un dato que la ronda no tenía: **con línea base, que una cita esté
bien o rota depende sólo del fichero donde vive y del fichero al que apunta**. El barrido completo da
por tanto el mismo resultado que el alcance por push **siempre que la cita resuelva igual antes y
después del push** —para eso está el índice remoto de la precisión 1—, **y además caza lo que un push
sin hook dejó roto en contenido** —el hueco del segundo clon de la Pieza 6, con la excepción del
renombrado o borrado que allí se declara—. Es más simple y cabe en coste (§7). Cinco precisiones:

1. **Todo se comprueba contra el sha LOCAL; el sha remoto se usa SÓLO como índice de resolución.** Git
   pasa una línea por referencia (`<ref local> <sha local> <ref remota> <sha remoto>`). El detector
   comprueba **todo** contra el sha local, y del sha remoto sólo saca un índice de nombres con
   `git ls-tree -r --name-only <sha remoto>`: **sin rango y sin `merge-base`**. Un token que **resolvía
   en el índice remoto y no resuelve en el sha local BLOQUEA** como «fichero inexistente (existía en
   `<sha remoto>`)», **lleve `/` o no**. **Rama nueva** (sha remoto todo ceros): el índice se toma de
   `origin/main` si existe; si no existe, **el mensaje dice que esa comprobación no se hizo**, nunca en
   silencio. Lo mismo si el objeto del sha remoto no está en el clon —**hipótesis**: que `pre-push` pueda
   recibir un sha remoto que el clon no tiene—. **Borrado de rama** (sha local todo ceros): nada que
   comprobar, salir con 0. Si la entrada trae varias referencias, se comprueba **cada sha local
   distinto**, con el índice de **su** sha remoto. Coste del índice: 33-64 ms (§7).
2. **Se verifica contra LO QUE SE EMPUJA, no contra el árbol de trabajo**: la cosecha con `git grep`
   sobre el sha local y la lectura de cada fichero citado por revisión sobre ese mismo sha. El árbol
   puede tener ediciones sin commitear que no viajan en el push (M8). Las ancladas, contra su propia
   revisión.
3. **Las anclas se leen agrupadas por (revisión, fichero) en UN solo proceso `git cat-file --batch`**, y
   no con un `git show` por cita. **Es requisito, no optimización: es lo que sostiene el coste.**
   Medido por el analista y reproducido aquí (2026-09-13): las **53** citas ancladas que hay fuera del
   archive y de `superpowers-main` forman **8 pares** (revisión, fichero). Leerlos con un `git show` por
   par cuesta 0,75 s según el analista y entre 280 y 299 ms aquí; con un solo `cat-file --batch`, 0,12 s
   y entre 31 y 49 ms. `sdd-design` decide si las lecturas del sha local comparten ese proceso.
4. **Un push que sólo mueve líneas en un fichero citado —sin tocar ningún fichero que lo cite— TIENE
   QUE BLOQUEAR.** Es el caso exacto de `30e698c`. Con el barrido completo sale por construcción, y **la
   mutación obligatoria se queda (M1)**: es lo que impide que alguien reintroduzca un alcance por fichero
   cambiado.
5. **Una cita rota en contenido por un commit YA empujado sin hook la caza el siguiente push con hook**,
   aunque ese push no toque ni el fichero donde vive la cita ni el citado (M29). Es justo lo que el
   alcance por push no podía ver. **No** la caza si ese commit renombró o borró el fichero citado y la
   cita es pelada: Pieza 6.

**Borrados y renombrados, sin `-M` y sin perder detección.** ⚠️ **La versión anterior de este párrafo
era FALSA.** Retiraba M7 diciendo que se perdía «precisión del mensaje, no detección», y confundía dos
casos distintos. El hueco de Q2 es el de los tokens sin `/` que **no resuelven hoy**. Una cita sin `/`
que **resolvía y deja de resolver** porque su fichero se borró o se renombró es otro caso, y sin índice
remoto **se saltaba**: si se renombra `transitions.ts`, cualquier cita pelada a él deja de resolver, no
lleva `/` y el push sale. No es un caso marginal: **1.084 citas sin `/` resuelven hoy a un único
fichero** —133 a `transitions.ts`, 97 a `ticketService.ts`, 74 a `schema.sql`, 68 a `debt.md`—
(medido aquí el 2026-09-13; el analista midió 1.075 con su cosecha, orientativo). **Con el índice
remoto de la precisión 1**, borrar o renombrar el fichero bloquea **todas** esas citas, con `/` y sin
ella, y el mensaje dice en qué revisión existía. **M7 vuelve con su número, redefinida** (§6): quitar el
índice remoto hace que la cita pelada al fichero renombrado pase a saltada, y la prueba se pone roja.
Lo que sigue sin decirse es **a dónde** fue el fichero: eso exigiría el diff entre los dos shas, y Q8
lo descarta.

### Pieza 2 · Cómo se resuelve la ruta

Medido sobre 1.873 citas (nivel 2 de procedencia): **597** son ruta completa trackeada; **1.006**
resuelven por sufijo de ruta a un único fichero; **145** son **ambiguas** (`repo.ts`→4 candidatos,
`migrate.test.ts`→3, `transitions-st/spec.md`→3); **125** no resuelven a nada. Suman 1.873.

**La regla, decidida por Gerencia (Q1 y Q2, §13):**

| Caso | Cuántas hoy | Qué hace el detector | Por qué |
|---|---|---|---|
| Ruta completa o **sufijo con frontera de segmento** (`<ruta> === <algo>` o `<ruta>` termina en `/<algo>`) a **un** candidato | 1.603 | **Comprueba y bloquea** si está rota | Es el 86 % del censo con una verdad única |
| **Ambigua** (varios candidatos) | 145 | **Comprueba en TODAS.** Bloquea **sólo si está rota en todas**; si alguna la valida, se **salta e informa** | Una cita ambigua no tiene verdad única, pero si **ninguna** candidata la sostiene está rota sea la que sea. Bloquear cualquier ambigua obligaría a desambiguar 145 citas a mano antes de poder instalar el hook: eso es una migración, no esta tanda |
| **Fuera del repositorio**: el token empieza por `~/`, por `/` o por letra de unidad (`C:\`, `C:/`), o lleva esquema `://` | — | **Se salta e informa en su PROPIA cifra**, separada de las demás saltadas. **No bloquea y no entra en la línea base** | No es una cita del repositorio: no hay árbol contra el que comprobarla. Sin esta categoría, la cita de `CLAUDE.md:333` en `648432d` a un contrato de `~/.claude/skills/` —**válida**, y fuera del repositorio— caería en la fila siguiente, y como `CLAUDE.md` lo modifica la unidad de trabajo 2, **acabaría en la base como rota sin estarlo**. Se evalúa **antes** que la fila siguiente |
| **Resolvía en el índice remoto y no resuelve en el sha local**, lleve `/` o no | — | **Bloquea** como «fichero inexistente (existía en `<sha remoto>`)» | Es el fichero borrado o renombrado por el propio push (Pieza 1, precisión 1). Sin esta fila, las 1.084 citas peladas que hoy resuelven se saltarían al renombrar su fichero. Se evalúa **después** de «fuera del repositorio» y **antes** de las dos filas siguientes |
| **No resuelve y el token lleva `/`** | parte de las 125 | **Bloquea** como «fichero inexistente» | Es exactamente el caso de los borrados y renombrados de la Pieza 1: rompen las citas que apuntan al fichero |
| **No resuelve y el token NO lleva `/`** | parte de las 125 | **Se salta e informa** | `R08.1.md` no es sufijo de ruta sino **subcadena del basename** de `docs/Manifesto/Desk2.0_..._R08.1.md`, y `app.test.ts` no existe. Resolver por subcadena haría casar `.ts:5` con cualquier fichero; bloquear todo lo que no resuelva convertiría cualquier `x.ts:5` escrito en prosa en un push parado |
| `<algo>` resuelve a un **directorio** del árbol | — | Se salta e informa | Una cita a un directorio con número de línea no es comprobable |

**⚠️ Precedencia: la coincidencia EXACTA gana al sufijo. Sin esta regla, la mitad de las citas de esta
propia tanda quedarían ambiguas y se saltarían.** Medido de disco: **`package.json` tiene SEIS
candidatos trackeados** —la raíz; `apps/desk`, `apps/hub-sync`, `packages/shared` y
`packages/zoho-sync`, por los workspaces que declara la propia raíz; y `.agent/skills/react-components/`,
de una skill importada (§2, «No entra»)—. *(La versión anterior decía cinco: se le escapaba el de
`.agent/skills/`. La conclusión no cambia.)* Así que con sufijo a secas **toda**
cita a `package.json` sería ambigua y el detector la saltaría informando. Con la precedencia, el nombre
pelado resuelve a la raíz, que es lo que quiere decir quien lo escribe. **Control del otro signo:**
`ci.yml` **no** tiene coincidencia exacta y resuelve por sufijo a `.github/workflows/ci.yml`, el único
trackeado — los quince homónimos de `node_modules` no compiten porque no están trackeados, que es
exactamente el alcance (a) haciendo su trabajo.

**Se mantiene lo que ya hacía el prototipo, con la atribución corregida por el requisito (c) de abajo:**
la forma **abreviada** (`` `:N` ``) se atribuye al último fichero **anterior a ella** en la misma línea
física —y si no hay ninguno, queda huérfana y se informa—; y la **anclada** («`<ruta>:<N>` en `` `<rev>` »`)
se comprueba con `git show <rev>:<ruta>`, con **revisión inexistente → bloquea**.

#### ⚠️ La abreviada se comprueba y se INFORMA, pero NO bloquea (decisión Q9)

Una abreviada atribuida **se comprueba igual que una completa** —fichero, rango, línea vacía, los dos
extremos— y, si está rota, **se informa en su propia cifra, con fichero, línea y motivo**. **No bloquea y
no entra en la línea base**, tampoco si va anclada. Una cita **completa** anclada a una revisión
inexistente sigue bloqueando (rojo d, M3).

**Por qué, medido** (2026-09-13, sobre `20a951d`, sin `docs/artefactos/`, nivel 2 de procedencia): con
la atribución de esta Pieza, la línea base salía en **102** entradas, y **55** eran abreviadas; **54**
si una completa sin resolver corta la atribución. De esas 54, clasificadas **por un script** —no leídas
una a una; Gerencia confirmó de disco los casos de muestra—,
**19 citaban el maestro nombrado en prosa** —«maestro M1.9.2» seguido de la abreviada, que la regla
atribuía al fichero de código anterior— y **16 cruzaban celdas** de la misma tabla de
`tickets-core/spec.md`, en sus filas 544 y 545. Cortar la atribución en esos dos casos —por la barra de
celda y por el vocabulario del maestro, más cuando delante va una completa que no resuelve— dejaba 18, y **al menos tres de esas 18 siguen siendo falsos
positivos que ningún corte ve**: en la línea 144 de `docs/sdd/F0-01_Correcciones_para_el_plan.md`, la
abreviada 1705 es la línea del maestro sobre el bodegaje de entrada, y la frase no nombra el maestro; en
la línea 33 de `openspec/specs/transitions-st/spec.md`, la 1636 es M1.9.1 del maestro, pero la celda
nombra `permissions.ts` justo antes; y en la línea 325 de `openspec/specs/trazas/spec.md`, la 20 es del
«design unificada» y la 380 de `repo.ts`, y las dos se atribuyen a `history.ts`. **El referente de una
abreviada lo decide quien lee el contexto, no la sintaxis**, y un corte por vocabulario siempre deja
falsos positivos en un hook que bloquea. Por eso su comprobación **sigue siendo de lectura humana**, con
el informe como ayuda, y la regla de mutación 4 lo dice (§2, «Entra» 9).

#### Cuatro requisitos de la cosecha, cada uno con su control de dos signos

Salieron de verificar esta misma propuesta. Con el patrón del sondeo, **siete de sus ocho abreviadas
salían huérfanas** y las citas a `Dockerfile` y a `ci.yml` **ni se cosechaban**; con los cuatro
requisitos, las ocho quedan atribuidas y todas las citas completas se cosechan. **Control verificado
con citas sembradas** (nivel 2 de procedencia, 2026-09-13): los cuatro casos válidos pasan, los cuatro
rotos se detectan, y la variante que incumple cada requisito deja escapar su caso roto. *(Con la
decisión Q9, «se detecta» significa **bloquea** en las completas de (a) y (b) y **figura en la lista de
abreviadas rotas** en las abreviadas de (c) y (d).)*

| Req. | Qué exige | Control de dos signos | Qué pasa si no se cumple |
|---|---|---|---|
| **(a)** | El patrón del nombre **NO es una lista de extensiones** | Una cita válida a `Dockerfile` → 0 **y figura entre las comprobadas**; la misma con la línea fuera de rango → ≠ 0 | Con lista de extensiones, `Dockerfile` y `ci.yml` **no se cosechan**: la rota sale verde, y la válida también sale 0 sin haberse mirado |
| **(b)** | El nombre **puede empezar por punto** | Una cita válida a `.dockerignore` → 0 y comprobada; fuera de rango → ≠ 0 | Se cosecha `dockerignore` sin el punto, que no resuelve ni lleva `/`: **se salta informando** y la rota sale verde |
| **(c)** | La abreviada se atribuye al último fichero **ANTERIOR a ella por índice** en su línea, no al último de la línea | Línea «fichero A, abreviada, fichero B» con esa línea válida en A y vacía en B → la abreviada **figura entre las comprobadas** y no en la lista de rotas; con A y B intercambiados → **figura en la lista de abreviadas rotas**. En los dos casos el push sale 0 (Q9) | Atribuyendo al último de la línea, **las dos salidas se invierten**: rota informada sin estarlo en la primera, y ausente de la lista de rotas en la segunda |
| **(d)** | La **mención pelada** de un fichero —sin número de línea— cuenta como fichero al que atribuir, **siempre que resuelva a un fichero trackeado** por la regla de esta Pieza | El párrafo de la Pieza 4 que nombra `.dockerignore` con tres abreviadas: las tres van a `.dockerignore`, no a `.git` ni a `docs`, que están entre medias, y **figuran entre las comprobadas**; la misma frase con una abreviada fuera de rango → **figura en la lista de abreviadas rotas** | Sin (d), las tres quedan **huérfanas** y la rota **deja de figurar en la lista de rotas**. Y si capturase **cualquier** token pelado, resuelva o no, la abreviada iría a `.git` (no trackeado) o a `docs` (directorio): **se salta** y tampoco figura en la lista |

El segundo signo de (a) y (b) no es «sale 0», sino **«figura entre las comprobadas»**: una cita que no se
cosecha también sale 0, así que un control que sólo mirase el código de salida no distinguiría la
cita válida de la ignorada. Mutaciones M24 a M27 (§6), y M30 para la abreviada que no bloquea.

**Precisión sobre (a) y (b), y es una corrección a la lectura literal de la decisión Q9.** Gerencia
pidió que M24 a M27 cambiaran «bloquea» por «figura en la lista de abreviadas rotas». **En M26 y M27 se
hace así**, porque sus controles son abreviadas. **En M24 y M25 no**: los requisitos (a) y (b) también
deciden a qué nombre se atribuye una abreviada, pero sus controles de dos signos son citas **completas**
a `Dockerfile`, `ci.yml` y `.dockerignore`, y las completas **siguen bloqueando**. Cambiarles el
«bloquea» los dejaría probando algo que no ejercitan.

⚠️ **El hueco queda declarado, no disimulado.** Las ambiguas que alguna candidata valida y las no
resueltas sin `/` son citas que el detector **no** comprueba. Es el molde que ya nombra
`CLAUDE.md:66-67` en `648432d` —«un detector que no caza todo lo que la afirmación abarca»—, y el mensaje
del hook imprime **cuatro cifras** en cada ejecución: lo comprobado, lo saltado, lo que está **fuera
del repositorio** y las **abreviadas rotas**, éstas informativas (Pieza 6). Un detector que sólo
informara de sus aciertos mentiría por omisión.

⚠️ **Si el detector definitivo encuentra tokens con `/` sin resolver sobre el árbol de hoy, van a la
línea base.** Para eso existe (Pieza 3), y es lo que hace viable la precondición dura del §8. **Medido
con `git grep` sin archive** (nivel 2 de procedencia, 2026-09-13): con la regla Q2 a secas son **cinco**.
**Tres son roturas de verdad** —tres citas a `apps/desk/server/app.test.ts`, fichero que ya no existe— y
van a la base. **Las otras dos son falsos positivos** y no llegan a ella: la cita a `~/.claude/skills/`
de `CLAUDE.md:333` en `648432d` cae en la categoría **fuera del repositorio**, y el ejemplo de ruta
inventada de `superpowers-main` queda fuera del barrido (§2, «No entra»). Control de dos signos en M28.

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
> decirlo.
>
> **Con la decisión Q9, esa elección ya NO mueve la línea base**: las abreviadas no entran en ella. Es
> una elección de **precisión del informe**, y se decide con número y **sin umbral**. Medido el
> 2026-09-13 sobre `20a951d`, sin `docs/artefactos/`, sobre **1.151** abreviadas (nivel 2 de
> procedencia), abreviadas rotas informadas y huérfanas por opción:
>
> | Atribución | Rotas informadas | Huérfanas |
> |---|---|---|
> | Misma línea, fichero anterior por índice (la regla de esta Pieza) | 55 | 810 |
> | Lo anterior, y una completa que no resuelve corta la atribución | 54 | 814 |
> | Lo anterior, y además no cruza una barra de celda | 33 | 843 |
> | Lo anterior, y además no cruza «maestro», `R08` ni un apartado `Mx.y` | 18 | 863 |
> | Misma línea; si no hay fichero antes, el de detrás | 127 | 699 |
> | Misma línea; si no, el último fichero de la línea anterior | 164 | 584 |
> | Misma línea; si no, el último fichero del párrafo | 195 | 453 |
>
> ⚠️ Ninguna fila está libre de falsos positivos: incluso la de 18 conserva al menos tres (el
> apartado de la abreviada que no bloquea, más arriba). Cuantas más atribuye una opción, más rotas
> informa **y más falsos positivos mete en el informe**; cuantas menos, más huérfanas calla.
>
> **Y el mismo problema tiene el ANCLA, un nivel más arriba.** Si «en `` `<rev>` »` cae en la línea
> siguiente a su cita, un detector por línea física la lee como cita del presente y el ancla no
> protege nada — que es justo lo contrario de para lo que se puso. Salieron **dos** casos así en esta
> propuesta, reparados moviendo el corte de línea. `sdd-design` decide si la detección del ancla mira
> la línea siguiente, y **declara el hueco si no lo hace**.
>
> **Y los puertos de una URL no son números de línea.** Sin lista de extensiones (requisito (a)), un
> `host:puerto` pasa a candidata sin `/`: no bloquea, pero **ensucia la cifra de saltadas**. El
> cosechador **no trata como cita un `host:puerto` dentro de una URL** (`esquema://…`). Control de dos
> signos: http://localhost:3001 → **ni comprobada ni saltada**; `Dockerfile:18` → **comprobada**. Es la
> frontera con la categoría **fuera del repositorio**: una URL con puerto no es una cita de fuera, **no
> es una cita**.
>
> **Medido, para decidir con número** (nivel 2 de procedencia, 2026-09-13, sin archive, con la cosecha
> de los requisitos (a) a (d)): de las **864** candidatas sin `/` que se saltan, `host:puerto` son
> **18** —**13** dentro de una URL y **5** con nombre de host pelado, como `localhost` o `postgres`—, 12
> de ellas en `docs/superpowers/`. **El ruido grande no son los puertos**: son **408 marcas de tiempo
> ISO** (fecha, `T`, hora y minutos) y **44 números pelados** —horas escritas como `HH:MM`—, más de la
> mitad de las saltadas. `sdd-design` decide si el cosechador las descarta también, y **declara** lo
> que siga contando como saltada.

### Pieza 3 · La línea base: sólo encoge

1. Un fichero versionado con las entradas exactas: **fichero, línea de la cita y cita literal**. El
   hook **informa** de las que estén en él; no bloquea. **Sólo contiene citas que bloquean** —completas
   y ancladas—: **ninguna abreviada**, porque las abreviadas no bloquean (decisión Q9, Pieza 2).
2. **Sólo puede ENCOGER.** Si una entrada de la base ya no está rota, el hook **falla** hasta que se
   quite de la base. Sin eso, la base silencia para siempre citas ya correctas y se podre.
3. **Una cita rota que NO está en la base bloquea, siempre.** La base **no crece desde el hook**:
   añadir una entrada exige editar el fichero a mano, y eso se ve en el diff.
4. **Se GENERA con el detector definitivo.** El sondeo del terminal dio 43 rotas (13 en
   `docs/sdd/F0-00_Baseline_as-built.md`, 11 en `docs/superpowers/plans/`, 14 en `openspec/specs/`, 1
   en `packages/zoho-sync/src/db/rows.ts`, 4 en otros) **y 2 falsos positivos por no leer anclas**. Esa
   cifra es histórica. **Medición de R-14: 47 entradas** —sólo completas y ancladas, sin
   `docs/artefactos/`—, el 2026-09-13 sobre `20a951d`, con el prototipo que lee todo en un solo
   `git cat-file --batch` (nivel 2 de procedencia). La definitiva sigue saliendo del detector de esta
   tanda.
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
derecho**. **Y con la decisión Q9 la conclusión se refuerza:** una abreviada desplazada ya **ni siquiera
bloquea**, sólo se informa, así que las citas de la tanda a sus cuatro ficheros van **completas y
ancladas**, nunca abreviadas.

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

**El hook no lleva lógica de shell.** Es una línea que invoca el detector con `node_modules/.bin/tsx`
—o con `npx --no tsx`—, **nunca con `npx tsx` a secas ni con `npm exec tsx` (o su alias `npm x
tsx`) sin `--no`**, y le pasa el stdin.

⚠️ **Por qué no `npx` ni `npm exec` a secas**, verificado en la documentación de la instalación local
(npm 11.17.0, `npm-exec.md`, línea 29): «When standard input is not a TTY or a CI environment is
detected, `--yes` is assumed». Esa línea es de la descripción de **`npm exec`**; `npx` usa `npm exec`
por dentro (línea 290) y el alias `x` lo declara la línea 15, así que vale para las tres formas. En
`pre-push` el stdin es una tubería, así que sin `node_modules` **cualquiera de ellas descarga `tsx` y
el hook sigue**: la imposición de M16 desaparecería en silencio. `--no-install` también lo evitaría,
pero esa misma documentación lo da por obsoleto y lo convierte en `--no` (línea 298).

Así
la pregunta de qué intérprete usa Git for Windows —**hipótesis**: su propio `sh`, no `cmd.exe`, que es
la diferencia con la tabla de arriba, donde el intérprete era `cmd.exe` porque lo lanzaba `npm run`—
**deja de ser carga**: si la hipótesis sale falsa, el hook no cambia.

**Y si faltan las dependencias, el hook FALLA con mensaje explícito.** No sale 0. Un hook que pasa
cuando no ha podido comprobar nada es exactamente el modo de fallo de la guarda en `sh`: la imposición
desaparece en silencio (M16).

**Y la forma de invocar la vigila un guardián ESTÁTICO, no una prueba con red.** Un control que
ejecutara `npx tsx` a secas para ver que descarga dependería de que haya red en el entorno de pruebas.
El guardián lee `.githooks/pre-push` y **falla si invoca `tsx` con `npx`, `npm exec` o `npm x` sin
`--no`**. Se prueba por la regla de mutación 2 del proyecto, **con una mutación por forma** sobre el
fichero vigilado: escribir `npx tsx` a secas → rojo; `npm exec tsx` → rojo; `npm x tsx` → rojo. Con
`node_modules/.bin/tsx` o `npx --no tsx`, verde.

### Pieza 6 · El mensaje del hook: lo que NO comprueba, y el aviso de escalada

El detector ve **sólo lo mecánico**: fichero inexistente, línea fuera de rango, línea vacía, **los dos
extremos** de un rango, revisión inexistente. **Que la línea diga lo que la frase afirma sigue siendo
trabajo de una persona** — `CLAUDE.md:177-179` en `648432d` lo mide: cuatro rangos distintos citaban el
mismo bloque de `estados.ts` y sólo uno acertaba.

Eso va **en el mensaje del hook**, no sólo en la spec. Un detector que bloquea por línea vacía y calla
sobre lo que no mira se lee como si hubiera comprobado la afirmación. El mensaje lleva además **cuatro
cifras separadas** —comprobadas, saltadas, fuera del repositorio y **abreviadas rotas**— y las **dos
salidas legítimas** de un bloqueo: reparar la cita, o añadirla a la línea base **a mano**. `--no-verify`
no es una de ellas.

**Las abreviadas rotas son informativas, y el mensaje lo dice con su porqué** (decisión Q9): se listan
con fichero, línea y motivo, **no bloquean**, porque el referente de una abreviada lo decide quien lee
el contexto y no la sintaxis (Pieza 2). Sin esa frase, una lista de rotas que no para el push se
leería como un fallo del detector.

#### El aviso de la condición de escalada (decisión Q5) — lo hace el hook, no una persona

El hook ejecuta `git shortlog -sne --all` y, si hay **más de una identidad**, imprime un **aviso visible
que NO bloquea**, nombrando la salida: añadir el job de CI con `fetch-depth: 0`, porque el hook local
deja de bastar cuando escribe **más de una persona**.

⚠️ **Lo que el aviso NO ve, y se declara.** Contar identidades mide **personas, no clones**. La misma
identidad empujando desde un **segundo clon instalado con `--ignore-scripts`** no tiene hook, y por
tanto tampoco aviso: para `git shortlog` sigue habiendo una sola identidad y nada avisa de que ese clon
empuja sin comprobar. **Lo que ese clon rompa en contenido** —líneas movidas en un fichero que sigue
existiendo— **no se pierde**: con el barrido completo (Q8), el siguiente push con hook desde cualquier
clon lo caza, aunque no toque los ficheros implicados (Pieza 1, M29). **Pero hay una excepción que sí
es de detección:** si ese push sin hook **renombra o borra** un fichero citado, cuando llega el
siguiente push con hook el remoto ya no tiene la ruta vieja, así que no está ni en el sha local ni en
el índice remoto. Las citas con `/` siguen bloqueando como fichero inexistente; las **peladas** no
resuelven en ningún índice, se saltan como el hueco de Q2 y quedan **saltadas para siempre**. **Sólo
la delata la cifra de saltadas.** No se construye nada para cerrarlo: se declara. **Evitar que
cualquiera de las dos roturas llegue** lo cubre sólo la línea de `DEPLOY.md` con el comando manual de
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
| ~~**f**~~ | **RETIRADO por Q8.** Era: push de varios commits con la rotura en el primero → ≠ 0 | Probaba que el rango salía de stdin y no de `HEAD~1`; con el barrido completo no hay rango |
| **g** | Fichero citado **renombrado** → una cita con `/` **y una cita pelada** que apuntaban a él dan ≠ 0 como «fichero inexistente (existía en `<sha remoto>`)» | Que el índice remoto detecta el renombrado sin `-M`, también en la cita pelada (Pieza 1, precisión 1) |
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
| ~~**M6**~~ | **RETIRADA por Q8**, conserva su número. Era: push de varios commits con la rotura en el primero | — | Probaba que el rango venía de stdin y no de `HEAD~1`; con el barrido completo no hay rango que probar. Lo que cubría lo cubre ahora M29, con más alcance |
| **M7 · el índice remoto** (VUELVE con su número, redefinida) | **Quitar el índice remoto** de la resolución | Con una cita **pelada** a un fichero que el push renombra: con el índice, **bloquea** como «fichero inexistente (existía en `<sha remoto>`)»; sin él, **pasa a saltada**, sale 0 y la prueba se pone roja | **El otro signo:** la misma cita pelada a un fichero que **no** se renombra → se comprueba y sale 0. Y la **rama nueva sin `origin/main`**: el mensaje dice que la comprobación del índice no se hizo, en vez de callarlo. *(Se retiró por Q8 creyendo que sólo perdía precisión del mensaje; perdía detección en las citas peladas, Pieza 1.)* |
| **M8** (D1.3) | Reparar la cita **en el árbol de trabajo** sin commitear, y empujar el commit roto | ≠ 0 | La variante que lee el worktree lo deja pasar |
| **M9** (D2.2) | Reparar una cita que está en la **línea base**, sin quitar su entrada | **El hook FALLA** hasta que se quite de la base | Quitar también la entrada → 0. Es el mecanismo que impide que la base se podre |
| **M10** (D2.3) | Añadir una cita rota **nueva** con la base ya presente | Bloquea | La base no crece desde el hook: el único camino es editarla a mano, y eso sale en el diff |
| **M11 · el fichero vigilado** (D4) | `prepare` en un directorio **sin `.git`** | Sale 0 y **NO instala** | **Control de dos signos, obligatorio:** **con** `.git` → sale 0 y **`git config --get core.hooksPath` devuelve `.githooks`**. La mutación de un solo signo la pasan las tres variantes de la tabla de la Pieza 5 |
| **M12** (D4.1) | Sin binario `git` (`node:22-alpine`) | `status` es `null` → sale 0 | Con `git` presente → instala |
| **M13** (D4.2) | Hacer fallar el `git config` **con** repositorio presente | Mensaje visible en la salida y `npm ci` **sigue en verde** (exit 0) | Que el mensaje exista: un fallo silencioso aquí es el defecto que esta pieza evita |
| **M14 · las cuatro exclusiones** | Cita rota **dentro** de `openspec/changes/archive/`, otra dentro de `.claude/skills/superpowers-main/`, otra dentro de `.agent/skills/` y otra dentro de `docs/artefactos/` | Se ignoran: 0 | La misma cita fuera de los cuatro directorios → bloquea |
| **M15 · las ambiguas** | Cita ambigua rota en **todas** las candidatas | ≠ 0 | Rota en **una sola** → se salta y el contador de saltadas sube en 1. Un detector que no contara las saltadas mentiría por omisión |
| **M16 · el hook sin dependencias** | Borrar `node_modules` y empujar, con el hook invocando `node_modules/.bin/tsx` o `npx --no tsx` | **≠ 0**, con mensaje explícito | **Control sin red, estático** (regla de mutación 2): un guardián lee `.githooks/pre-push` y falla si invoca `tsx` con `npx`, `npm exec` o `npm x` sin `--no`. Se **ensucia el fichero vigilado**, una mutación por forma: `npx tsx` a secas → **rojo**; `npm exec tsx` → **rojo**; `npm x tsx` → **rojo**; con `node_modules/.bin/tsx` o `npx --no tsx` → verde. Sustituye al control anterior, que ejecutaba `npx tsx` y dependía de la red. Un hook que saliera 0 aquí repite el fallo de la guarda en `sh` |
| **M17 · la posición** (regla de mutación 1) | Mover la consulta a la línea base **después** de decidir el bloqueo | Una entrada de la base debe empezar a bloquear → la prueba de la base se pone roja | Si sigue verde, **el orden no está probado** y un comentario que lo declare deliberado no es prueba |
| **M18 · el orden de la tanda** | Instalar el hook **antes** de generar la línea base | El push de cierre se bloquea por citas que esta tanda no rompió | Es la precondición dura del §8, y por eso es criterio de aceptación con orden, no una recomendación |
| **M19 · el coste** | — | Medir el hook con la entrada real por stdin | §7 |
| **M20 · el anclaje** (Q7c) | **SIEMPRE en un repositorio sintético**: un documento con una cita **desanclada** a otro fichero del mismo repositorio, y un commit que **inserta líneas delante** de la línea citada de modo que ésta caiga en **línea vacía** | El hook **bloquea** | La misma cita **anclada a la revisión anterior a la inserción** → pasa. Es la única prueba de que el anclaje sirve para algo. **Nunca sobre las líneas reales de `CLAUDE.md`**: una prueba atada a ellas se rompe con la siguiente edición del fichero, y haría depender el tipo de prueba del tamaño del diff de la unidad de trabajo 2. **La medición sobre el árbol real ya la hace la comprobación final del §8**, que se ejecuta una vez y se registra. Y la inserción del sintético se construye para caer en línea vacía, no en contenido equivocado: si cayera en contenido, la cita desanclada pasaría y la mutación saldría verde por el motivo equivocado |
| **M21 · el aviso de escalada** (Q5) | Repositorio sintético con **dos** identidades de autor | El hook **imprime el aviso** | Con **una** identidad → sin aviso. Y en los dos casos el **código de salida es el mismo**: si al añadir la segunda identidad el hook empieza a bloquear, el aviso se convirtió en guarda y eso no es lo decidido |
| **M22 · el ejemplo sin forma de cita** (Q6) | Escribir el ejemplo de cita rota **con** forma de cita (`fichero:línea`) en un doc trackeado | El detector lo trata como cita y **bloquea** | Escrito **sin** forma de cita —«la línea 206 de `CLAUDE.md`, hoy vacía»— → pasa. Es la prueba de que la frase nueva de la regla 4 hacía falta |
| **M23 · la precedencia del nombre pelado** | Quitar la precedencia de **coincidencia exacta** y dejar sólo el sufijo | Toda cita a `package.json` pasa de **comprobada** a **ambigua y saltada**, y el contador de saltadas sube | Con la precedencia, `package.json:10-23` en `648432d` se comprueba contra la raíz. **Y el control del otro signo:** `ci.yml`, que **no** tiene coincidencia exacta, debe seguir resolviendo por sufijo a `.github/workflows/ci.yml`. Una precedencia que rompiera el caso del sufijo cambiaría un hueco por otro |
| **M24 · (a) el nombre sin lista de extensiones** | Sustituir el patrón del nombre por una lista de extensiones | Una cita rota a `Dockerfile` o a `ci.yml` **deja de bloquear** → la prueba de (a) se pone roja | La misma cita válida **figura entre las comprobadas**, no sólo sale 0: una cita que no se cosecha también sale 0. *(Sigue siendo «bloquea», no «figura en la lista de abreviadas rotas», aunque (a) también decide a qué nombre se atribuye una abreviada: el control es una cita **completa**, y las completas bloquean — Pieza 2)* |
| **M25 · (b) el punto inicial** | Exigir que el nombre empiece por letra o dígito | La cita rota a `.dockerignore` pasa a **saltada** y deja de bloquear | La válida figura entre las **comprobadas**, no entre las saltadas. *(Mismo matiz que M24: (b) afecta también a la atribución de abreviadas, pero el control es una completa y por eso sigue siendo «bloquea»)* |
| **M26 · (c) la atribución por índice** | Atribuir la abreviada al último fichero **de la línea** | Las dos salidas del control de (c) se invierten: con A válido y B vacío, la abreviada **pasa a figurar en la lista de abreviadas rotas** sin estarlo; con los dos intercambiados, **deja de figurar** en ella. El push sale 0 en los cuatro casos (Q9) | Con la atribución por índice, las dos salidas vuelven a su signo: comprobada en el primer orden, en la lista de rotas en el segundo. Probar un solo orden no distingue las dos reglas |
| **M27 · (d) la mención pelada** | Dos mutaciones: **quitar** (d), y dejar que **cualquier** token pelado capture, resuelva o no | En las dos, la abreviada rota tras `.dockerignore` **deja de figurar en la lista de abreviadas rotas**: huérfana en la primera; atribuida a `.git` o a `docs` y saltada en la segunda | Las tres abreviadas válidas del párrafo de la Pieza 4 figuran entre las **comprobadas**, y ninguna entre las huérfanas; con (d), la rota **figura en la lista de rotas** |
| **M28 · fuera del repositorio** | Quitar la categoría **fuera del repositorio** de la Pieza 2 | Una cita a `~/x/y.md` con la línea 3 pasa de **saltada en la cifra de fuera** a **bloquear** como fichero inexistente → la prueba se pone roja | **El otro signo:** una cita a `apps/no-existe.ts` con la línea 3 **bloquea** con la categoría puesta. Una categoría que se tragara también las rutas relativas cambiaría un falso positivo por un escape |
| **M29 · el barrido completo** (Q8) | Limitar el barrido a los ficheros que cambia el push | Repositorio sintético: una cita rota en contenido por un commit **ya empujado sin hook**, sin renombrar ni borrar el citado, y un push posterior que no toca ni el fichero donde vive ni el citado → con el barrido completo **bloquea**; con la mutación **sale 0** y la prueba se pone roja | **El otro signo:** la misma situación con la cita **en la línea base** → informa y sale 0. Sin él, la prueba no distinguiría «barre todo» de «bloquea siempre» |
| **M30 · la abreviada no bloquea** (Q9) | Hacer que una abreviada rota **bloquee** | Una abreviada atribuida y rota → con la regla, **el push sale 0** y la abreviada **aparece en el informe de abreviadas rotas** con fichero, línea y motivo; con la mutación, el push sale ≠ 0 y **la prueba se pone roja** | **El otro signo:** la misma abreviada **válida** no aparece en la lista de rotas y **figura entre las comprobadas**. Sin él, la prueba no distinguiría «informa sin bloquear» de «no comprueba nada» |

---

## 7 · Coste: el hook corre en CADA push, y eso es una restricción de producto

Segundos, no minutos, o nadie lo soporta — y el atajo cuando molesta es `--no-verify`, que esta tanda
prohíbe. Así que el tiempo **no es una métrica de calidad, es la condición de que la regla sobreviva**.

**Objetivo decidido por Gerencia (Q3): ≤ 5 s en el push típico, tope duro 10 s.**

**Ya medido, con el barrido completo de Q8 y las anclas incluidas** (procedencia en cada fila):

| Pieza | Tiempo medido | Procedencia |
|---|---|---|
| `git shortlog -sne --all` sobre 766 commits —medido antes de `648432d`; hoy son 767—, tres intentos | **267 / 281 / 314 ms** | nivel 2 |
| El `git grep` del barrido entero | **256 ms** | nivel 2 |
| El prototipo completo: 1.873 citas, 663 ficheros —**barría ya el árbol entero, pero no leía anclas**— | **541 ms** (incluye el `git grep`) | nivel 2 |
| Las anclas: 53 citas fuera del archive y de `superpowers-main`, **8 pares** (revisión, fichero), en **un solo `git cat-file --batch`** | **0,12 s** | analista; reproducido aquí en 31-49 ms |
| *(la misma lectura con un `git show` por par, para comparar)* | *0,75 s* | *analista; reproducido aquí en 280-299 ms* |
| El índice remoto: `git ls-tree -r --name-only` de un sha (665 rutas) y construir el índice de sufijos en Node, cinco intentos | **64 / 39 / 33 / 34 / 61 ms** | medido aquí, 2026-09-13. *(Lanzado desde bash, sólo el `ls-tree` tarda 163-194 ms: es el arranque de proceso de Git Bash, no git)* |
| **Total: prototipo + anclas + shortlog + índice remoto** | **~1 s contra un objetivo de 5 s — unas 5× de margen** | suma de las filas anteriores |

⚠️ **Dos cosas que ese total NO incluye, y se dicen.** El arranque de `tsx`, que se mide en la tanda
(última fila de la tabla de abajo); y el efecto del barrido completo sobre el coste, que es **nulo**:
el prototipo ya barría el árbol entero, así que Q8 no añade coste, sólo quita la lógica del rango.

Se declara **antes** de construirlo, y no después, porque el coste del aviso de escalada era la única
objeción razonable a meterlo en el hook: 300 ms sobre un presupuesto de 5.000 no es una objeción.

| | |
|---|---|
| **Cómo se mide en la tanda** | Invocando el hook **directamente** con la misma entrada que git le pasa por stdin, **sobre el árbol completo**: con el barrido de Q8 el push típico y el más caro cuestan lo mismo. Se registra el número, no la impresión |
| **Palanca** | La cosecha de citas se hace con **`git grep -nIE` sobre el sha que se empuja** —una pasada en C sobre el árbol— y no leyendo 663 ficheros desde Node |
| **`docs/artefactos/`, decidido por el número (Q9)** | `docs/artefactos/blueprintserviciotecnico.html` pesa **3.370.299 bytes** (`openspec/config.yaml:837` en `648432d`) y `.gitattributes` lo marca `-diff -merge`. `-I` no lo salta, porque es texto. **Medido con y sin** el 2026-09-13 sobre `20a951d` (nivel 2): la cosecha pasa de 1,45-1,61 s a 0,27-0,33 s —**1,2-1,3 s** de diferencia—, y la carpeta aporta **12 falsos positivos** y **3.510 saltadas**. **Queda fuera del barrido**, declarada y justificada en el §2 junto a `openspec/changes/archive/` |
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
| **R-5** | **El hueco declarado**: 145 ambiguas + 125 sin resolver no se comprueban del todo | Cierta | Las cifras de comprobadas y saltadas se imprimen en cada ejecución (M15), junto a las de fuera del repositorio y abreviadas rotas (Pieza 6). Decidido por Q1 y Q2 |
| **R-6** | **Cobertura**: el detector cuenta contra el 92 % (`vitest.config.ts:53`, `:58-63`) y puede arrastrar la cifra global | Media | `strict_tdd` con los ocho rojos vigentes del §4 (el f, retirado por Q8). Si baja, **es la señal**; bajar el umbral exige justificación en el commit (`vitest.config.ts:36-39`) |
| **R-7** | **El detector se convierte en dependencia de la entrega**: si se cuelga, no se empuja | Media | Coste ya medido en ~1 s con unas 5× de margen, anclas incluidas (§7); salida 0 inmediata en el borrado de rama; y en la rama nueva sin `origin/main`, un mensaje que dice que el índice remoto no se comprobó, en vez de colgarse o callarlo |
| **R-8** | **`prepare` es nuevo y corre en tres sitios más** (`ci.yml:26`, `Dockerfile:6`, `:19`) | Media | Verificado: en el CI hay `.git` y fijar `core.hooksPath` es inocuo porque no empuja; en la imagen no hay `.git` ni `git` y sale 0 (M12) |
| **R-9** | **Presupuesto de revisión.** `changed_lines` se mide diffeando el **árbol entero** del intento (`CLAUDE.md:353-356` en `648432d`) y los artefactos SDD cuentan | Media | **Precondición, no recomendación:** `proposal.md`, el spec, `design.md` y `tasks.md` **commiteados antes de que el intento de `sdd-apply` adquiera** |
| **R-10** | **Paralelismo.** Dos tandas SDD sobre `C:\dev\Desk_2_R1.023` se imputan líneas entre sí, y desbloquearlo exige `sdd-attempt reset`, reservado a un mantenedor | Media | Una tanda por árbol de trabajo. Si hace falta otra, worktree aislado |
| **R-11** | **La tanda se rompe a sí misma.** Sus artefactos citan los dos ficheros que modifica, y el detector **no caza las citas que quedan en contenido equivocado**, en rango y no vacías. En la ilustración de la Pieza 3 —+1 en `CLAUDE.md`, +20 en `openspec/config.yaml`— se desplazan **ocho** y caza **cuatro**; con +5 en `CLAUDE.md`, o de +25 a +40 en `openspec/config.yaml`, **no caza ninguna** | **Cierta sin anclaje — ya pasó una vez en esta propuesta** | Anclaje a `648432d` **cita por cita** en los cuatro ficheros que la tanda toca, la mutación M20, y la comprobación final del §8 sobre los artefactos commiteados |
| **R-12** | **El 60 % de las abreviadas queda huérfano** con la atribución por línea física —**el 71 %** con los requisitos (a) a (d) de la Pieza 2—, y se salta en silencio. **Y las que se atribuyen pueden atribuirse mal**: el referente lo decide el contexto, no la sintaxis | Alta | **Las abreviadas no bloquean ni entran en la base** (Q9): se comprueban y se **informan** en su propia cifra, y su comprobación sigue siendo de lectura humana con el informe como ayuda. La atribución es **precisión del informe**: nota para `sdd-design` (Pieza 2) con la medición por opción, **sin umbral**, y el hueco que decida **se declara**. En esta propuesta las abreviadas a los cuatro ficheros de la tanda se reescribieron como citas completas |
| **R-13** | **El extremo del RANGO es el modo de fallo dominante, no el número suelto.** Medido en esta sesión: **cinco** citas desfasadas, **las cinco** por un extremo del rango; una de ellas mal **por los dos** a la vez (inicio en línea en blanco, final cortando el párrafo). Un detector que comprobara sólo el inicio, o sólo la existencia de la línea, dejaría fuera la mitad medida | **Cierta — ya ocurrió cinco veces** | Rojo (c) del §4 y mutación **M4 en sus dos direcciones**: final fuera con inicio bueno, **e** inicio en línea en blanco con final bueno. Y el mensaje nombra **cuál** de los dos extremos falla, porque «el rango está roto» no dice dónde mirar |
| **R-14** | **Presupuesto de la línea base.** **Cada entrada es una línea** contra las 800 de `review_budget_lines` (`openspec/config.yaml:29` en `648432d`). **Medido antes de `sdd-design`** (2026-09-13, sobre `20a951d`, nivel 2): con la atribución de la Pieza 2 y las abreviadas **bloqueando**, la base salía en **114** entradas, y en **102** sin `docs/artefactos/` —55 de ellas abreviadas—. Pasaba del umbral de 100, se paró y se preguntó a Gerencia | **CERRADO por Q9** | **Opción (d): las abreviadas no bloquean ni entran en la base, y `docs/artefactos/` sale del barrido. Base medida: 47 entradas**, sólo completas y ancladas. El extremo alto del §11 sin la base suma **619** líneas —617 antes de la segunda frase de la regla 4—; con las 47 son **666**, que dejan **134** de margen contra las 800. **La opción (a) se DESCARTÓ**: cortar la atribución por la barra de celda y por el vocabulario del maestro dejaba **65** entradas, pero ningún corte sintáctico decide el referente de una abreviada (Pieza 2). **⚠️ La versión anterior de esta medición, en el informe del orquestador, decía que las 18 abreviadas que quedaban con la opción (a) eran roturas reales revisadas una a una. ERA FALSO:** al menos tres son falsos positivos —la abreviada 1705 de la línea 144 de `docs/sdd/F0-01_Correcciones_para_el_plan.md`, que es del maestro; la 1636 de la línea 33 de `openspec/specs/transitions-st/spec.md`, que es M1.9.1 del maestro; y la 20 y la 380 de la línea 325 de `openspec/specs/trazas/spec.md`, del «design unificada» y de `repo.ts`—, y la «revisión» fue una **clasificación automática por vocabulario**, no una lectura de contexto. **El umbral de 100 se conserva sólo como guarda** para la base que genere el detector definitivo en la tanda: si pasara de 100, se para y se pregunta. No es tarea del diseño. Supone una línea por entrada: si el formato usa más, se divide por las líneas que ocupe cada una |

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
| `apps/desk/server/citas/` (detector + CLI) | **Nuevo** | Cosecha, resolución, comprobación, salida. **Sin** el rango entre shas, `merge-base` ni `-M`; **con** la lectura de anclas en un `cat-file --batch` y el **índice remoto** con su caso de rama nueva | 125-195 *(130-200 antes de Q8)* |
| `apps/desk/server/citas/*.test.ts` | **Nuevo** | Los ocho rojos vigentes del §4 y las mutaciones automatizables del §6: **sin** f ni M6; **con** M7 redefinida, M29 y el guardián estático de M16 | 160-260 *(igual que antes de Q8)* |
| `apps/desk/server/citas/` (línea base) | **Nuevo** | **Generada**, no copiada. Una entrada por cita rota **que bloquea** —completas y ancladas, ninguna abreviada (Q9)— | 47 (medido sobre `20a951d`; la definitiva la da el detector) |
| `.githooks/pre-push` | **Nuevo** | Invoca al detector con `node_modules/.bin/tsx` y el stdin, sin lógica de shell, **+ el aviso de escalada** (`git shortlog`, ~10 líneas) | 15-25 |
| `apps/desk/server/citas/` (prueba del aviso) | **Nuevo** | **Los dos signos** del aviso de escalada: una identidad / dos | 25-30 |
| `scripts/instalar-hooks.mjs` | **Nuevo** | `spawnSync` + `git config core.hooksPath`, con el mensaje en voz alta | 20-35 |
| `package.json` | Modificado | Script `prepare` (**no existe hoy**: `package.json:10-23` en `648432d`) | 1-2 |
| `DEPLOY.md` | Modificado | El comando manual para `--ignore-scripts` y el `--unset` de la reversión | 3-6 |
| `CLAUDE.md` | Modificado | Fila **IV-10**, el recuento de `CLAUDE.md:249` en `648432d` («Cuatro» → «Cinco») **y las dos frases de la regla de mutación 4**, la de Q6 y la de Q9 | 13-26 *(12-24 con sólo la de Q6)* |
| `openspec/config.yaml` | Modificado | IV-10 en `incumplimientos_vivos`, tras el final de IV-9 | 25-40 |
| **Total código + pruebas + datos** | | | **~435-665** *(~430-660 con la base estimada en ~45 y una sola frase en la regla 4; ~440-660 antes de Q8)* |

**Talla S, confirmada, con la reserva dicha.** No hay lógica de dominio nueva ni esquema ni escritura a
Zoho: es un lector de texto con su hook. Lo que la engorda son las pruebas, y eso es lo correcto bajo
`strict_tdd`. El aviso de escalada subió la estimación de 400-620 a ~440-660 (~10 líneas en el hook más
25-30 de prueba de dos signos), y el barrido completo de Q8 la deja en **~430-660**: se va la lógica del
rango con sus pruebas —f y M6— y entran la lectura en `cat-file --batch`, el índice remoto con M7
redefinida, M29 y el guardián estático de M16. Q9 fija la base en las 47 medidas y añade la segunda
frase de la regla 4; **M30 y la cifra de abreviadas rotas no mueven los rangos del detector ni de sus
pruebas**, que ya son amplios. Todo es **estimación**, no medida.
**Presupuesto `review_budget_lines: 800`** (`openspec/config.yaml:29` en `648432d`): cabe, pero sin la
holgura de una tanda S típica — depende de R-9 (planificación commiteada antes de adquirir) y R-10
(árbol aislado).

**Troceado por unidad de trabajo**, cada una revertible sola y en este orden (§8):

1. `feat(citas): detector de citas ruta:línea` — detector + pruebas. Útil solo: se puede correr a mano.
2. `chore(citas): línea base de citas ya rotas, IV-10 y las frases de la regla 4` — la base generada,
   las dos filas de registro **y las dos frases** de la regla de mutación 4 de `CLAUDE.md`: la de Q6 y
   la de Q9 (el detector no bloquea la forma abreviada; su comprobación sigue siendo de lectura humana,
   con el informe como ayuda).
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
| **Leer lo semántico**: que cada línea citada **diga** lo que su frase afirma, en las entradas de la línea base (47 medidas sobre `20a951d`; ~43 en el sondeo) | Quien decida el alcance de la reparación. Se anota con dueño, resultado y fecha | La regla 4 lo exige y el detector **no puede**: son los tres casos A/B/C de `CLAUDE.md:195-199` en `648432d`, y elegir entre ellos es leer una afirmación, no contar líneas |
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
ronda se hizo y está **respondida**. Las siete son **decisiones**, no supuestos. **Q8 llegó después de
cerrarla**, y reabre el alcance de la Pieza 1 con un dato que la ronda no tenía. **Q9 también**: la
medición de R-14 que exigía la propia propuesta pasó del umbral.

| # | Pregunta | Decisión de Gerencia | Dónde queda |
|---|---|---|---|
| **Q1** | Las 145 citas ambiguas: ¿bloquear siempre, o sólo cuando estén rotas en **todas** las candidatas? | **ACEPTADA tal como se propuso**: bloquea sólo si está rota en **todas**; si alguna la valida, se salta e informa | Pieza 2; §2 «No entra»; M15 |
| **Q2** | Las 125 que no resuelven: ¿basta que un token **sin `/`** se informe y no bloquee? | **ACEPTADA**: con `/` bloquea como fichero inexistente; sin `/`, informa | Pieza 2 |
| **Q3** | Coste: ¿**≤ 5 s** con **10 s** de tope duro? | **ACEPTADA** | §7, con los tiempos ya medidos |
| **Q4** | La línea base: ¿quién repara las ~43 entradas? | **ACEPTADA con matiz que cambia el enunciado**: sin dueño **decidido explícitamente, no por omisión**. IV-10 lo dice con estas palabras: **«la base no encoge hasta que Gerencia asigne quién la repara»** | Pieza 3 punto 5; §2 «Entra» 8; R-3; §12 |
| **Q5** | ¿Quién vigila `git shortlog -sne --all`? | **RECHAZADA en su forma.** No es tarea de persona: por el reverso de la regla del ciclo 1 es trabajo que una tanda hace aquí, y sacarla del recuento sería maquillarlo. **Lo hace el hook**: aviso visible **sin bloquear** con más de una identidad, y prueba de los dos signos | Pieza 6; §1; §2 «Entra» 5; rojo (i); M21; §11 |
| **Q6** | El ejemplo de cita rota del §2 tenía **forma de cita**, así que el detector lo trataría como rota | **ACEPTADA, opción (i)**: el ejemplo se reescribe **sin forma de cita**, y se añade a la tanda **una frase en la regla de mutación 4 de `CLAUDE.md`**: «un ejemplo de cita rota se escribe sin forma de cita, o el detector lo tratará como rota» | §2 «No entra» y «Entra» 9; convención 2 de la cabecera; M22; unidad de trabajo 2 |
| **Q7** | **NUEVA, y verificada de disco por Gerencia.** «Insertar IV-10 no desfasa ninguna cita en alcance» se midió **antes de que la propuesta existiera**: era cierta entonces y es **FALSA ahora** | **Tres partes: (a)** anclar a `648432d` toda cita de los artefactos de la tanda a los cuatro ficheros que la tanda modifica; **(b)** rehacer la medición **incluyendo los artefactos de la propia tanda** y mover la comprobación **al final, sobre los artefactos commiteados**; **(c)** añadir la mutación del anclaje | Cabecera (convenciones 1 y 2); Pieza 3 (medición rehecha); §8 (segunda comprobación); M20; R-11; §15 |
| **Q8** | **POSTERIOR a la ronda (2026-09-13), y reabre el alcance.** ¿Barrer «lo que el push pone en juego» o barrer todo? | **BARRIDO COMPLETO en cada push.** Con línea base, que una cita esté bien o rota depende sólo del fichero donde vive y del citado: el barrido completo da el mismo resultado, **caza lo que un push sin hook dejó roto en contenido** (no las citas peladas a un fichero que ese push renombró o borró: Pieza 6), es más simple y cabe en coste (~1 s). Todo se comprueba contra el sha local. **Corregida el mismo día:** el sha remoto se usa **sólo como índice de resolución** (`git ls-tree`), porque sin él las citas **peladas** a un fichero renombrado se saltaban | Pieza 1; Pieza 2 (fila del índice remoto); §2 «Entra» 2; Pieza 6 (hueco del segundo clon); §4 (f retirado, g con cita pelada); §6 (M6 retirada, M7 redefinida, M29 nueva); §7; §11; R-7; R-14; §15 |
| **Q9** | **POSTERIOR a la ronda (2026-09-13), y la dispara R-14.** Medida antes de `sdd-design`, la línea base salía en **114** entradas, y en **102** sin `docs/artefactos/`, contra un umbral de 100. ¿Qué se hace con una base de 102-114? | **Opción (d): las abreviadas son INFORMATIVAS.** Se atribuyen con los requisitos (a) a (d), se comprueban y se informan en su propia cifra, con fichero, línea y motivo; **no bloquean ni entran en la base**. La base sólo lleva citas que bloquean —completas y ancladas—: **47 entradas**, medidas sobre `20a951d`. `docs/artefactos/` sale del barrido. **Se descartó la opción (a)** —cortes por barra de celda y por vocabulario del maestro, 65 entradas— porque **el referente de una abreviada lo decide quien lee el contexto, no la sintaxis**, y al menos tres de sus abreviadas «reales» eran falsos positivos | §2 «Entra» 3, 4 y 9 y «No entra»; Pieza 2 (la abreviada no bloquea, precisión sobre (a) y (b), tabla de requisitos, nota para `sdd-design`); Pieza 3 (puntos 1 y 4, y la simulación de Q7); Pieza 6 (cuatro cifras); §6 (M14, M24 a M27, M30 nueva); §7; R-5; R-12; R-14; §11; §12; §15 |

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
- [ ] **Barrido COMPLETO en cada push** (Q8): todo se comprueba contra el **sha local** —cada sha local
      distinto si hay varias referencias; el remoto sólo da el índice de resolución, criterio propio más abajo—, con `git grep` y lectura por
      revisión, **nunca contra el árbol de trabajo** (M8), y el borrado de rama sale con 0.
- [ ] **Una cita rota en contenido por un commit ya empujado sin hook bloquea** en un push posterior que no toca ni
      el fichero donde vive ni el citado, y **con la cita en la línea base informa y sale 0** (M29, dos
      signos).
- [ ] **Las anclas se leen agrupadas por (revisión, fichero) en UN solo proceso `git cat-file
      --batch`**, no con un `git show` por cita: es lo que sostiene el coste del §7.
- [ ] **El índice remoto** (Pieza 1, precisión 1): el sha remoto se usa **sólo** para
      `git ls-tree -r --name-only`, sin rango ni `merge-base`; un token que resolvía en el índice remoto y
      no resuelve en el sha local **bloquea**, lleve `/` o no, con el sha remoto en el mensaje; en la rama
      nueva el índice sale de `origin/main`, y si no existe **el mensaje dice que la comprobación no se
      hizo**. Probado con M7 y el rojo g.
- [ ] El hook invoca el detector con **`node_modules/.bin/tsx` o `npx --no tsx`, nunca con `npx tsx` a
      secas ni con `npm exec tsx` o `npm x tsx` sin `--no`**, y lo vigila un **guardián estático** sobre
      `.githooks/pre-push`, probado **ensuciando el fichero vigilado** una vez por forma —`npx tsx`,
      `npm exec tsx`, `npm x tsx`, las tres rojas— (M16, regla de mutación 2). Ningún control depende
      de la red.
- [ ] La regla de resolución de la Pieza 2 está implementada tal cual (Q1 y Q2), con **sufijo de ruta
      con frontera de segmento** y **nunca** subcadena del basename.
- [ ] **La coincidencia EXACTA tiene precedencia sobre el sufijo** (Pieza 2, M23): sin ella, las seis
      candidatas trackeadas de `package.json` dejan ambigua **toda** cita a ese fichero. Y `ci.yml`, sin
      coincidencia exacta, sigue resolviendo por sufijo: los dos signos, no uno.
- [ ] **Los DOS extremos de un rango se comprueban por separado, y el mensaje dice CUÁL falla.** Probado
      en las dos direcciones (M4): final fuera con inicio bueno, **e** inicio en línea en blanco con
      final bueno. No es una nota al pie: es el modo de fallo **dominante** medido —cinco de cinco en
      esta sesión, una de ellas mal por los dos extremos a la vez (R-13)—.
- [ ] El mensaje del hook imprime **cuatro cifras separadas** —comprobadas, **saltadas**, fuera del
      repositorio y **abreviadas rotas**—, dice **qué NO comprueba** (lo semántico), dice que **las
      abreviadas rotas no bloquean y por qué** (Q9) y nombra las **dos** salidas legítimas de un
      bloqueo: reparar, o añadir a la línea base **a mano**.
- [ ] **Las abreviadas son informativas** (Q9): se atribuyen con los requisitos (a) a (d), se comprueban
      y se informan con fichero, línea y motivo, **no bloquean y no entran en la base**, tampoco si van
      ancladas; probado con **M30** en sus dos signos —abreviada rota → sale 0 y aparece en el informe,
      y con la mutación que la hace bloquear la prueba se pone roja; abreviada válida → figura entre las
      comprobadas y no en la lista de rotas—.
- [ ] **El aviso de la condición de escalada está en el hook** (Q5): `git shortlog -sne --all`, aviso
      visible con más de una identidad, **sin cambiar el código de salida**; con prueba de **los dos
      signos** (M21).
- [ ] La línea base está **generada por el detector**, no copiada del sondeo, y su cifra va con **fecha
      de medición**. **Sólo contiene citas que bloquean** —completas y ancladas, ninguna abreviada—; la
      medición previa dio **47** sobre `20a951d` (R-14), y si la generada pasa de 100 se para y se
      pregunta.
- [ ] La base **sólo encoge**: una entrada que ya no está rota **pone el hook rojo** (M9); y una cita
      rota que no está en la base **bloquea** aunque la base exista (M10).
- [ ] El barrido cubre **sólo ficheros trackeados** y **excluye `openspec/changes/archive/`,
      `.claude/skills/superpowers-main/`, `.agent/skills/` y `docs/artefactos/`**, las cuatro exclusiones
      declaradas en el §2, comprobado con M5 y M14.
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
      (≤ 5 s, tope 10 s), ya sin `docs/artefactos/` en el barrido (Q9, decidido por el número del §7).
- [ ] **Las veintinueve mutaciones vigentes del §6 se ejecutaron** —de M1 a M30 sin M6, retirada por Q8
      con su número—, cada una con su control. Las que no se puedan
      automatizar van declaradas como tal, no omitidas. **M20 corre SIEMPRE sobre un repositorio
      sintético**, nunca sobre las líneas reales de `CLAUDE.md`, con la inserción construida para que la
      cita desanclada caiga en **línea vacía**; el árbol real lo mide la comprobación final del §8.
- [ ] **La categoría fuera del repositorio de la Pieza 2 está implementada y probada con sus dos
      signos** (M28): un token que empieza por `~/`, por `/` o por letra de unidad, o que lleva `://`,
      se salta e informa **en su propia cifra**, no bloquea y no entra en la base; una ruta relativa que
      no resuelve **sigue bloqueando**.
- [ ] **Los cuatro requisitos de la cosecha de la Pieza 2 están implementados y probados con sus dos
      signos** (M24 a M27): (a) el nombre no es una lista de extensiones; (b) admite el punto inicial;
      (c) la abreviada va al último fichero **anterior** a ella por índice; (d) la mención pelada que
      resuelve a un fichero trackeado cuenta como fichero al que atribuir. En (a) y (b) el signo válido
      es **«figura entre las comprobadas»**, no «sale 0», y el roto **bloquea**, porque su control es una
      cita completa; en (c) y (d) el roto **figura en la lista de abreviadas rotas**, sin bloquear (Q9).
- [ ] IV-10 está en `CLAUDE.md` **y** en `openspec/config.yaml`, con cifra, fecha, **destino sin asignar
      decidido explícitamente** y la frase de Q4 **«la base no encoge hasta que Gerencia asigne quién la
      repara»**; y el recuento de `CLAUDE.md:249` en `648432d` pasó de «Cuatro» a «Cinco».
- [ ] **Las dos frases nuevas están en la regla de mutación 4 de `CLAUDE.md`**, en la **unidad de
      trabajo 2**: la de Q6 —«un ejemplo de cita rota se escribe sin forma de cita, o el detector lo
      tratará como rota»— y la de Q9 —el detector no bloquea la forma abreviada, así que su comprobación
      sigue siendo de lectura humana, con el informe como ayuda—.
- [ ] El ejemplo de la cita rota del archive está escrito **sin forma de cita** (Q6, opción i).
- [ ] La **nota para `sdd-design`** de la Pieza 2 —el 60 % de abreviadas huérfanas, el 71 % con los requisitos (a) a (d), y la
      tabla de rotas y huérfanas por opción— llegó al diseño **como nota, no como decisión de esta
      propuesta**; el diseño elige la atribución como **precisión del informe, sin umbral**, y **declara
      el hueco** que deje.
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
  2026-09-13, opción 4 de cuatro; la ronda del §13 cerrada el mismo día con siete respuestas; Q8,
  posterior a esa ronda, que cambia el alcance a barrido completo; y Q9, que hace informativas las
  abreviadas y fija la base en 47.
- **Acopla con el CI en un punto y no lo bloquea**: `ci.yml:26` (`npm ci`) disparará el `prepare` nuevo.
  El job de CI con `fetch-depth: 0` **no se construye aquí**: es la condición de escalada, y el hook la
  vigila.
- **No depende** de ningún punto abierto del maestro, del nº 52, ni de la titularidad OV↔equipo.
