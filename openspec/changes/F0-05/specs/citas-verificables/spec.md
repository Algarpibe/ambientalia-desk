# Delta for citas-verificables

Contexto: `openspec/specs/citas-verificables/spec.md`. Esta delta es **R1 «el contrato»** entera: la
comprobación de forma de la cabecera R-1 en el mismo `pre-push` que ya existe.

> **Anclaje: cada cita de este documento lleva su propia revisión INLINE, en su misma línea física.**
> No hay —ni puede haber— una declaración de anclaje en cabecera que valga por todas: el detector sólo
> reconoce el ancla pegada a su cita (`apps/desk/server/citas/cosecha.ts:63` en `ce93480`, constante
> `REVISION_RE`), y una declaración de cabecera **no ancla nada** a efectos del hook. Costó 15
> bloqueantes en F1B-10 el día que se registró.

**AÑADE:** `RQ-CV-19` (la comprobación de forma, siete campos), `RQ-CV-20` (alcance del barrido de
cabeceras y su precondición de cero incumplimientos).
**MODIFICA:** `RQ-CV-10` (el mensaje del hook gana una quinta cifra: cabeceras inválidas).

**Qué NO entra aquí, y vive en el delta de `reconciliacion`:** el barrido de seis comprobaciones, la
regla (d) del avance y las dos guardas del autocertificado. Son **R2**, y la frontera es exacta: esta
capacidad comprueba que la cabecera **existe y tiene forma**; nunca que su contenido sea cierto.

---

## ADDED Requirements

### Requirement: RQ-CV-19 · Comprobación de FORMA de la cabecera R-1, con siete campos, en el mismo pre-push

En cada push, el detector **SHALL** comprobar que **todo** `openspec/changes/<nombre>/proposal.md` del
sha local empieza con un bloque YAML delimitado por `---` **antes de cualquier prosa**, y que ese
bloque lleva los **siete** campos de R-1 (`CLAUDE.md:423-434`): `tanda`, `motivo`,
`capacidad`, `maestro`, `cierra`, `toca_maestro` y `origen_cabecera`.

La comprobación **SHALL** ser de **forma y dominio cerrado**, nunca de criterio:

| Campo | Qué se comprueba | Qué NO se comprueba |
|---|---|---|
| `tanda` | presente y no vacío | que el ID exista en el §5, ni que sea el correcto |
| `motivo` | presente; **no vacío si y sólo si** `tanda` es `fuera-del-plan` | que el motivo sea razonable |
| `capacidad` | presente, lista (puede ser `[]`) | que las capacidades existan en `capabilities` |
| `maestro` | presente, lista (puede ser `[]`) | que los pasajes existan ni que justifiquen |
| `cierra` | presente, y **exactamente** `si` o `no` | que la fila quede realmente cerrada |
| `toca_maestro` | presente, y **exactamente** `si` o `no` | — |
| `origen_cabecera` | presente, y **exactamente** `declarada` o `derivada-<fecha>` | que la procedencia sea cierta |

- Un `proposal.md` **sin** cabecera **SHALL** bloquear el push.
- Un `proposal.md` con `tanda: fuera-del-plan` y `motivo: ""` **SHALL** bloquear el push.
- Un `proposal.md` **sin `origen_cabecera`** **SHALL** bloquear el push. Es el campo más reciente y el
  único que no estaba en la redacción original de R-1, así que es el que una cabecera copiada de un
  ejemplo viejo va a perder.
- Un valor fuera del dominio cerrado de `cierra`, `toca_maestro` u `origen_cabecera` **SHALL** bloquear.
- `--no-verify` **MUST NOT** presentarse como salida, igual que en `RQ-CV-10`.

**Por qué de forma y no de criterio, y va escrito en la spec y no sólo en el diseño:** el `tanda:` lo
escribe el mismo agente que hace el trabajo y nada mecánico puede contrastarlo —`verify: pass` prueba
que el cambio cumplió su propio `tasks.md`, no lo que pide la fila del plan—. Contrastarlo es trabajo
de las dos guardas del autocertificado, que viven en `reconciliacion` y **enseñan en vez de bloquear**.
Una comprobación de forma que pretendiese juzgar contenido daría falsa confianza en la única barrera
que sí es mecánica.

**Dónde vive:** en el detector ya instalado, `apps/desk/server/citas/cli.ts` en `ce93480`, invocado por
`.githooks/pre-push:4` en `ce93480`. **No se añade un hook nuevo**: el push que ya se para por una cita
rota se para también por una cabecera inválida, con un solo mensaje.

#### Scenario: un proposal.md sin cabecera bloquea
- GIVEN un `openspec/changes/<nombre>/proposal.md` cuya primera línea no es `---`
- WHEN corre el `pre-push`
- THEN el push no sale, y el mensaje nombra el fichero y el campo o bloque que falta

#### Scenario: fuera-del-plan con motivo vacío bloquea
- GIVEN una cabecera con `tanda: fuera-del-plan` y `motivo: ""`
- WHEN corre el `pre-push`
- THEN el push no sale, y el mensaje dice que `motivo` es obligatorio y no vacío cuando `tanda` es
  `fuera-del-plan`

#### Scenario: falta `origen_cabecera` y bloquea
- GIVEN una cabecera con los seis campos originales de R-1 y sin `origen_cabecera`
- WHEN corre el `pre-push`
- THEN el push no sale, y el mensaje nombra `origen_cabecera` y sus dos valores admitidos

#### Scenario: un valor fuera del dominio cerrado bloquea
- GIVEN una cabecera con `cierra: quizá`, o con `origen_cabecera: heredada`
- WHEN corre el `pre-push`
- THEN el push no sale, y el mensaje nombra el campo y enumera su dominio

#### Scenario: la forma pasa aunque el contenido sea discutible
- GIVEN una cabecera con `tanda: F9-99`, una fila que no existe en el §5, y los siete campos con forma
  y dominio válidos
- WHEN corre el `pre-push`
- THEN el push **sale**, porque esta comprobación es de forma
- AND contrastar ese ID es trabajo de la comprobación 2 de `reconciliacion`, que informa y no bloquea

---

### Requirement: RQ-CV-20 · El barrido de cabeceras cubre el mismo alcance que el de citas, y nace con cero incumplimientos

El barrido de cabeceras **SHALL** cubrir **todo** `openspec/changes/<nombre>/proposal.md` del sha local,
**incluido `openspec/changes/archive/`**, y **SHALL** usar la misma regla de alcance que `RQ-CV-07`
(`openspec/specs/citas-verificables/spec.md:434` en `ce93480`) en lo que a ficheros trackeados se
refiere. A diferencia de las citas, aquí **no hay línea base**: la precondición se cumple de una vez.

**Precondición dura, y es la que hace que el requisito sea exigible:** antes de instalar la
comprobación, los **catorce** `proposal.md` del árbol **SHALL** tener cabecera válida — los trece que
existían más el de la propia F0-05. Medido en `ce93480`: **trece sin cabecera y uno con ella**.

**No hay línea base y es deliberado.** `RQ-CV-09`
(`openspec/specs/citas-verificables/spec.md:540` en `ce93480`)
admite una para las citas porque reparar una cita desfasada exige criterio —hay tres casos
y se decide leyendo qué afirma la frase—. Escribir una cabecera que falta **no exige criterio de ese
tipo**: los campos se derivan del documento, y cuando no se derivan **se para y se pregunta** en vez de
inventarlos. Una línea base aquí sería maquinaria para un problema que se resuelve de una vez, y el
precedente de `apps/desk/server/citas/lineaBase.jsonl` en `ce93480` avisa de que una lista de
excepciones sin tanda que la retire **se queda**: IV-10 necesitó cuatro bloques y una decisión de
Gerencia para llegar a cero.

**Consecuencia sobre la rama en vuelo, y es requisito y no nota:** `orden-precedencia-guardas` vive a la
vez en `main` y en el worktree `f1b-10-r1`, así que su cabecera **SHALL** existir en **los dos árboles**.
Si entrara sólo en `main`, la fusión de la rama reintroduciría el bloqueo que este requisito elimina.

#### Scenario: la precondición se comprueba antes de instalar
- GIVEN el árbol con uno o más `proposal.md` sin cabecera válida
- WHEN se intenta activar la comprobación
- THEN la activación no se da por hecha, porque bloquearía todo push desde el árbol principal

#### Scenario: un archivado sin cabecera bloquea igual que uno en vuelo
- GIVEN un `openspec/changes/archive/<fecha>-<nombre>/proposal.md` sin cabecera
- WHEN corre el `pre-push`
- THEN el push no sale: el archive no está exento

#### Scenario: la cabecera de la rama en vuelo existe en los dos árboles
- GIVEN `orden-precedencia-guardas` con cabecera en `main`
- WHEN se fusiona la rama `f1b-10-r1` que no la lleva
- THEN el resultado **no** puede quedar sin cabecera, porque la rama también la tiene

---

## MODIFIED Requirements

### Requirement: RQ-CV-10 · El mensaje declara CINCO cifras, lo que no comprueba, que las abreviadas no bloquean, y las dos salidas legítimas

En cada ejecución, el mensaje del hook **MUST** imprimir **cinco cifras separadas**: citas
**comprobadas**, **saltadas**, **fuera del repositorio**, **abreviadas rotas** —éstas con fichero,
línea y motivo— y **cabeceras R-1 inválidas**, con el fichero y el campo que falla. **MUST** decir que
las abreviadas rotas son **informativas y no bloquean**, y por qué: el referente de una abreviada lo
decide quien lee el contexto, no la sintaxis (`RQ-CV-06`). **MUST** declarar explícitamente que **no
comprueba lo semántico** — y esa declaración **MUST** cubrir ahora **las dos** cosas: ni que la línea
citada diga lo que su frase afirma, ni que el `tanda:` de una cabecera sea el que le corresponde.
**MUST** nombrar las **dos** salidas legítimas de un bloqueo de cita: repararla, o añadirla a la línea
base a mano. Para una cabecera inválida la única salida **MUST** ser **escribirla**, porque no hay
línea base (`RQ-CV-20`). `--no-verify` **MUST NOT** presentarse como salida.

Fuera de las cinco cifras, en su propia línea, el mensaje **MUST** seguir imprimiendo cuántos ficheros
trackeados del sha local con extensión de texto trata git como **binarios**, y que **no se barren**, sin
cambio respecto de su redacción anterior.

#### Scenario: el mensaje declara las cinco cifras
- GIVEN una ejecución con citas comprobadas, saltadas, fuera del repositorio, abreviadas rotas y una
  cabecera inválida
- WHEN el hook termina
- THEN imprime las **cinco** cifras por separado, y la cabecera inválida con su fichero y su campo

#### Scenario: la salida de una cabecera inválida no ofrece línea base
- GIVEN un push bloqueado sólo por una cabecera inválida
- WHEN se imprime el mensaje
- THEN la única salida que nombra es escribir la cabecera, y no menciona ni la línea base ni `--no-verify`

#### Scenario: la declaración de lo no comprobado cubre las dos cosas
- GIVEN cualquier ejecución
- WHEN se imprime el mensaje
- THEN dice que no comprueba si la línea citada afirma lo que su frase dice, **y** que no comprueba si
  el `tanda:` de una cabecera es el correcto
