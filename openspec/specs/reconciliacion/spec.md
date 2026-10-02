# Delta for reconciliacion

Capacidad **NUEVA**. Esta delta es **R2 «el barrido»** entera. R1 escribe el contrato —la cabecera
R-1 y su comprobación de forma, en `citas-verificables`—; **R2 lo mide**, y no puede medir cabeceras
que R1 todavía no ha escrito. Por eso el corte entre las dos rebanadas es la dependencia real del
trabajo y no el presupuesto.

> **Anclaje: cada cita de este documento lleva su propia revisión INLINE, en su misma línea física.**
> El detector sólo reconoce el ancla pegada a su cita
> (`apps/desk/server/citas/cosecha.ts:63` en `ce93480`, constante `REVISION_RE`);
> una declaración de anclaje en cabecera **no ancla nada**.

| Dato | Valor |
|---|---|
| Capacidad | `reconciliacion` (nueva) |
| Cubre | `npm run reconcile` y su fichero `docs/sdd/RECONCILIACION.md`, las **seis** comprobaciones, la regla (d) de `unidad_de_avance`, las **dos guardas del autocertificado** y el campo `estado` de `incumplimientos_vivos` |
| Tanda que la escribe | `F0-05` |
| Depende de | `citas-verificables`, y sólo para la comprobación 2: sin las cabeceras de R1, el numerador no tiene de dónde derivarse |
| Fuente en el maestro | **No aplica, y se dice en vez de forzarla.** Sale de `docs/sdd/F0-05_Mecanismo_de_Reconciliacion.md` y de `decision/tanda-por-contenido` (Gerencia, 2026-09-17, obs. #737). Presentar el maestro como fuente aquí sería la cita estirada que la regla de método castiga |

## Purpose

Hay cinco sitios donde vive la verdad de este proyecto —código, `openspec/`, plan, maestro y las
decisiones que se toman en conversación— y corren a velocidades distintas. El desvío no se ve en un
commit: se ve en el agregado. El principio ya estaba escrito en
`openspec/config.yaml:1259` en `ce93480` (`unidad_de_avance.trazabilidad`):
*«el as-built no se recuerda: se verifica»*. Lo que faltaba era **quién lo ejecuta y cada cuánto**.

**Límite explícito, y gobierna toda la capacidad: este barrido NO arregla ningún desvío. Los hace
visibles.** Un barrido que además corrige es un barrido en el que nadie puede confiar, porque ya no se
sabe si el número bajó porque el problema se fue o porque el barrido lo tapó.

**Por qué es capacidad propia y no parte de `citas-verificables`:** el `covers` de aquélla dice «línea
base de citas verificables, detector y hook de pre-push» (`openspec/config.yaml:208-211` en `ce93480`)
y su spec fija un límite explícito —«esta capacidad no cubre lo semántico»—. La comprobación 5 de aquí
compara cifras del maestro contra `packages/shared`, que es exactamente lo semántico. Estirarla haría
que significase «todo el utillaje de método», y una capacidad que significa eso no significa nada.

---

## ADDED Requirements

### Requirement: RQ-RC-01 · `npm run reconcile` escribe UN solo fichero, con su fecha y su commit, y seis comprobaciones

`npm run reconcile` **SHALL** escribir **un único** fichero, `docs/sdd/RECONCILIACION.md`, encabezado
por la **fecha** y el **commit** contra el que midió. **SHALL** leer ficheros y no interpretarlos, con
el mismo patrón que el detector de citas.

Las **seis** comprobaciones. La fila 2 cambia de fuente; las demás **MUST NOT** alterarse:

| # | Comprueba | Resultado |
|---|---|---|
| 1 | `capabilities` (`openspec/config.yaml`) **vs** `openspec/specs/*/spec.md` en disco | huérfanas = spec en disco no declarada |
| 2 | Tandas del **§C de la R01.4** (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md`) **vs** cabeceras `tanda:` y `cierres_declarados_por_commit` | tres cifras separadas: `RQ-RC-05` |
| 3 | Cambios con `tanda: fuera-del-plan`, con su motivo | sin cambio |
| 4 | IVs vivos sin destino · gates sin sesión · claves `decision/*` sin fila | sin cambio |
| 5 | Cifras ancladas (`cifras_ancladas`) | sin cambio |
| 6 | Ficheros de `docs/sdd` sin trackear | sin cambio |

- «Huérfana» **SHALL** significar **spec en disco que no está en `capabilities`**, no al revés.
- La comprobación 3 **SHALL** seguir contando por la cabecera `tanda: fuera-del-plan` y su `motivo`.
- La fila 2 **MUST NOT** leer la R01.1 como plan del denominador. La R01.1 sólo sigue siendo fuente
  para la guarda (b) de `RQ-RC-06`.

(Previously: la fila 2 decía «Tandas del §5 vs cabeceras `tanda:`» y el barrido leía el §5 de la R01.1;
ahora lee el §C de la R01.4 y añade `cierres_declarados_por_commit` como segunda fuente.)

#### Scenario: la fila 2 apunta al plan vigente
- GIVEN el árbol real del repositorio
- WHEN corre `npm run reconcile`
- THEN la cabecera de la comprobación 2 de `docs/sdd/RECONCILIACION.md` nombra la R01.4 como plan
  medido, y no nombra la R01.1 como fuente del denominador

#### Scenario: las demás comprobaciones no cambian
- GIVEN el mismo árbol antes y después del cambio
- WHEN corre `npm run reconcile`
- THEN las secciones de las comprobaciones 1, 3, 4, 5 y 6 son idénticas byte a byte y el código de
  salida sigue la regla de `RQ-RC-03`

---

### Requirement: RQ-RC-02 · Dos pasadas sin cambios producen un fichero IDÉNTICO

Dos ejecuciones seguidas sobre un árbol sin cambios **SHALL** producir un `docs/sdd/RECONCILIACION.md`
**idéntico**, de modo que su `git diff` **sea** la lista de desvíos nuevos desde la pasada anterior.
La salida **SHALL** ser ordenada y estable: mismo orden de comprobaciones, mismo orden dentro de cada
lista, sin marcas de tiempo fuera de la cabecera de fecha y commit.

**Es requisito, no comodidad.** Sin determinismo la pieza no sirve: un fichero que cambia solo
convierte el diff en ruido y obliga a releerlo entero cada vez, que es exactamente lo que el mecanismo
existe para evitar.

#### Scenario: idempotencia sobre árbol quieto
- GIVEN un árbol sin cambios entre dos ejecuciones
- WHEN se corre `npm run reconcile` dos veces
- THEN `git diff` sobre `docs/sdd/RECONCILIACION.md` no reporta nada

#### Scenario: el diff es la lista de desvíos nuevos
- GIVEN una ejecución previa registrada y una capacidad huérfana nueva
- WHEN se vuelve a correr
- THEN el `git diff` del fichero contiene esa huérfana y nada más

---

### Requirement: RQ-RC-03 · Exit code ≠ 0 SÓLO por la 1 o la 3

El comando **SHALL** salir con código **distinto de 0** si y sólo si la comprobación **1** encuentra
una capacidad huérfana o la **3** encuentra un cambio `fuera-del-plan` sin motivo escrito. Las
comprobaciones **2, 4, 5 y 6 SHALL** informar **sin** alterar el código de salida.

**Por qué sólo esas dos:** son las que significan **trabajo huérfano** —algo construido que el
registro no conoce—. Las otras cuatro reportan divergencias que pueden ser legítimas: la 5 lo es hoy
mismo (`esperas 4/11`), y un barrido que bloquea por una divergencia legítima enseña a saltárselo. Un
barrido que se salta no existe.

#### Scenario: divergencia legítima no rompe el comando
- GIVEN el árbol de hoy, con `esperas` en 4 frente a 11 y cinco incumplimientos vivos
- WHEN corre `npm run reconcile`
- THEN el código de salida es **0**, y las dos cifras aparecen en el fichero

#### Scenario: una capacidad huérfana rompe el comando
- GIVEN una spec en disco no declarada en `capabilities`
- WHEN corre `npm run reconcile`
- THEN el código de salida es distinto de 0

#### Scenario: un fuera-del-plan sin motivo rompe el comando
- GIVEN un `proposal.md` con `tanda: fuera-del-plan` y `motivo: ""`
- WHEN corre `npm run reconcile`
- THEN el código de salida es distinto de 0

---

### Requirement: RQ-RC-04 · La comprobación 5 lee `packages/shared`, NUNCA la documentación

La comprobación 5 **SHALL** obtener la cifra del código leyendo `packages/shared` —`estados.ts` y
`transitions.ts`— y compararla contra `cifras_ancladas` (`openspec/config.yaml:1197` en `ce93480`).
**MUST NOT** derivar la cifra del código de ningún documento, incluido el propio `config.yaml`.

Cada entrada de `cifras_ancladas` **SHALL** declarar si divergir es un **error** o una **diferencia
legítima de criterio**, y el barrido **SHALL** reproducir esa clasificación sin reinterpretarla.

**Por qué está escrito como requisito y no como nota de diseño:** el 2026-09-17 un hallazgo del informe
de brechas salió **falso** por leer `config.yaml` en vez del código, y la propia entrada `esperas` lo
deja escrito. Leer el registro para comprobar el registro es el molde del fallo.

#### Scenario: la cifra sale del código
- GIVEN `ESTADOS_EN_ESPERA` con once entradas en `packages/shared/src/estados.ts`
- WHEN corre la comprobación 5
- THEN reporta 11 frente a los 4 del maestro, leídos del código y no de `config.yaml`

#### Scenario: la divergencia legítima se reporta como tal
- GIVEN la entrada `esperas`, cuya clave `divergencia` la declara legítima
- WHEN corre la comprobación 5
- THEN el fichero la presenta como divergencia legítima y no como error, y el código de salida no cambia

---

### Requirement: RQ-RC-05 · El numerador son cifras SEPARADAS por origen, y sólo cuenta lo archivado; nunca una suma

La comprobación 2 **SHALL** publicar el avance como **tres cifras separadas**, cada una con sus tandas
nombradas: **cierres por archivo**, **cierres declarados por commit** y **en curso** (`RQ-RC-11`).
**MUST NOT** publicarlas sumadas, ni sumar «en curso» a ninguna de las dos de cerradas, ni imprimir un
total que mezcle poblaciones.

**Cierres por archivo.** Una tanda **SHALL** contar «por archivo» si y sólo si existe un
`openspec/changes/archive/*/proposal.md` con **cabecera R-1 válida**, cuyo `tanda:` sea el ID de una
fila del §C y cuyo `cierra` sea `si`. Un `proposal.md` con `cierra: si` fuera de
`openspec/changes/archive/` **MUST NOT** contar: ni plan commiteado, ni propuesta, ni código en curso
suman (`decision/avance-cuenta-lo-planificado`).

**Cierres declarados por commit.** Una tanda **SHALL** contar «por commit» si y sólo si
`cierres_declarados_por_commit` la declara con su `id`, su `commit` y su `prueba` (`RQ-RC-10`).

**Disjunción.** Las dos poblaciones de cerradas **SHALL** ser disjuntas. Una tanda presente en ambas
**SHALL** producir un hallazgo que nombre el ID y las dos fuentes; el hallazgo informa y **MUST NOT**
alterar el código de salida.

- **MUST NOT** escribirse cabecera retroactiva para las declaradas por commit: inventarla sería
  fabricar evidencia.
- `F0-04` **SHALL** salir de «cierres declarados por commit» y figurar **sólo** como «en curso»: la
  R01.4 la da como en curso, y su cabecera lleva `cierra: no`.
- El numerador **SHALL** seguir publicándose con el **motivo** de su cambio, `por trabajo` o
  `por dictamen`, según `RQ-RC-07`.
- La cifra por commit **SHALL** ser el número de entradas **completas** de `cierres_declarados_por_commit`;
  con las nueve entradas que registra este cambio (F0-01, F0-02, F0-03 y, en el lote 2, F0-00, F1A-01, F1A-02, F1A-04, F1A-05, F1B-01) es **9**.

(Previously: el numerador eran dos cifras, «derivables de cabecera» —todo `proposal.md` con `cierra: si`,
archivado o no— y «declarados por commit» —lista plana—, con F0-04 declarada por commit pese a tener
cabecera; ahora son tres cifras, la primera sólo con archivados, la segunda con bloques completos y la
tercera «en curso».)

#### Scenario: un `cierra: si` sin archivar no entra en «por archivo»
- GIVEN un árbol sintético con `openspec/changes/<x>/proposal.md` de `tanda: F1A-09`, `cierra: si` y
  cabecera válida, fuera de `archive/`
- WHEN corre la comprobación 2
- THEN «cierres por archivo» **no** contiene `F1A-09`, y `F1A-09` aparece en «en curso»

#### Scenario: el mismo proposal, archivado, sí cuenta
- GIVEN el mismo proposal movido a `openspec/changes/archive/<x>/proposal.md`
- WHEN corre la comprobación 2
- THEN «cierres por archivo» contiene `F1A-09` una vez, y «en curso» ya no la contiene

#### Scenario: una cabecera inválida no cuenta aunque esté archivada
- GIVEN un `archive/<y>/proposal.md` con `cierra: si` y una cabecera sin el campo `capacidad`
- WHEN corre la comprobación 2
- THEN su tanda no figura en «cierres por archivo»

#### Scenario: un archivado con `cierra: no` no cuenta como cierre
- GIVEN un `archive/<z>/proposal.md` con `tanda: F1B-07` y `cierra: no`
- WHEN corre la comprobación 2
- THEN `F1B-07` no figura en «por archivo» ni en «por commit»

#### Scenario: una tanda en las dos poblaciones produce hallazgo
- GIVEN `F0-01` declarada en `cierres_declarados_por_commit` **y** con un `archive/*/proposal.md`
  `cierra: si`
- WHEN corre la comprobación 2
- THEN emite un hallazgo que nombra `F0-01` y las dos fuentes, y el código de salida no cambia

#### Scenario: las cifras no se suman
- GIVEN el árbol real
- WHEN corre `npm run reconcile`
- THEN la sección de la comprobación 2 lista las tres cifras con sus tandas, y ninguna línea del
  fichero imprime una suma de «por archivo» + «por commit» + «en curso»

#### Scenario: F0-04 pasa de cerrada por commit a «en curso»
- GIVEN el árbol real, con `F0-04` de cabecera `cierra: no` y sin entrada en
  `cierres_declarados_por_commit`
- WHEN corre la comprobación 2
- THEN `F0-04` figura en «en curso» y no figura en «declarados por commit»

---

### Requirement: RQ-RC-06 · Las dos guardas del autocertificado ENSEÑAN, no rechazan

La guarda **(a)** queda **intacta**: el `archive-report.md` de todo cambio con `tanda:` **SHALL**
declarar en una línea qué parte del contenido de esa fila cubrió y qué dejó fuera.

La guarda **(b)** **SHALL** marcar **«sin verificar»** toda fila dada por cerrada —por archivo o por
commit— cuyo `maestro:` no cite ninguna de las fuentes que el plan declara para ella. **MUST NOT**
rechazarla ni alterar el código de salida. **De dónde sale la fuente:**

- La R01.4 **no tiene columna de fuentes del maestro**: su columna 4 es la ventana y su columna 6 son
  claves `decision/*`. La fuente **SHALL** seguir leyéndose de la **R01.1**
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md`), **sólo para las filas que existan
  allí**.
- Una fila que **no existe en la R01.1** (las filas nuevas de la R01.4) **MUST NOT** marcarse «sin
  verificar» ni defecto: no tiene fuente declarada contra la que comparar, y el barrido lo dice.
- Una fila cerrada **por commit** **SHALL** tratarse igual que una por archivo: su `maestro:` sólo
  puede contrastarse si existe una cabecera que la declare; sin cabecera, no se marca.

(Previously: (b) leía la fuente de «la columna del §5 que declara para ella» sin precisar versión del
plan; ahora fija la R01.1 como fuente única de esa columna y excluye las filas que no existan allí.)

#### Scenario: una fila cerrada sin fuente común se marca y no bloquea
- GIVEN `F0-02` con `maestro: ["Anexo H"]` y la columna de la R01.1 declarando M1.3, M1.9 y Anexo G
- WHEN corre la comprobación 2
- THEN la fila aparece marcada «sin verificar» y el código de salida no cambia

#### Scenario: una fila que sólo existe en la R01.4 no se marca
- GIVEN una tanda cerrada por archivo cuyo ID figura en el §C de la R01.4 y **no** figura en la R01.1
- WHEN corre la comprobación 2
- THEN no aparece como «sin verificar» y el fichero indica que no tiene fuente declarada

#### Scenario: la guarda lee la R01.1 y no la R01.4
- GIVEN un árbol sintético en que la R01.4 llevara en su columna 4 el texto `M9.9` para una fila
  cerrada
- WHEN corre la guarda (b)
- THEN `M9.9` no se toma como fuente del maestro de esa fila

---

### Requirement: RQ-RC-10 · `cierres_declarados_por_commit` son bloques con `id`, `commit` y `prueba`; una entrada incompleta es defecto y no cuenta

`openspec/config.yaml → cierres_declarados_por_commit` **SHALL** leerse como **lista de bloques**
`- id:` con los campos `commit:` y `prueba:`, con la misma lectura de entradas que el resto de la
comprobación (sin parser nuevo). Una entrada **SHALL** contar como cierre si y sólo si lleva `id` **y**
`commit` **y** `prueba`, los tres no vacíos.

Una entrada a la que le falte `commit` o `prueba`, o con alguno vacío, **SHALL** reportarse como
**defecto de registro** (mismo molde que `RQ-RC-08`) nombrando el `id` y el campo que falta, y
**MUST NOT** contar en ninguna cifra de cerradas. El defecto informa y **MUST NOT** alterar el código
de salida.

La clave **SHALL** admitir ausencia o lista vacía: el barrido publica entonces «0 por commit» sin
defecto.

Este cambio **SHALL** registrar exactamente nueve bloques, **al final** de
`openspec/config.yaml` (sin desplazar líneas citadas):

| `id` | `commit` | `prueba` |
|---|---|---|
| F0-01 | `3d44e1e` | `docs/sdd/Estado_As-Built_2026-09-09.md:20` |
| F0-02 | `fa445ac` | `openspec/changes/F0-03/proposal.md:21` · `docs/sdd/Estado_As-Built_2026-09-09.md:21` |
| F0-03 | `3aaa0f1` | `docs/sdd/Estado_As-Built_2026-09-09.md:22` |
| F0-00 | `0e8f581` | `docs/sdd/F0-00_Baseline_as-built.md:33` · `docs/sdd/Estado_As-Built_2026-09-09.md:19` |
| F1A-01 | `ec0ed1f` | `apps/desk/server/transicionesEjecucion.test.ts:41` · `apps/desk/server/transitionExec.test.ts:90` |
| F1A-02 | `5218d11` | `packages/shared/src/sla.test.ts:29` · `:105` · `apps/desk/server/db/sla.test.ts` |
| F1A-04 | `e8c5e90` | `packages/shared/src/bodegaje.test.ts:29` · `:318` · `apps/desk/server/transitionExec.test.ts:163` |
| F1A-05 | `43821b8` | `docs/sdd/F1A-05_Auditoria_blueprint_audit-F1A.md:1` · `packages/shared/src/bodegaje.test.ts:377` |
| F1B-01 | `607e26a` | `apps/desk/server/remisiones.test.ts:913` · `docs/sdd/F1B-01_Serial_llave_de_entrada.md:1` |

Los tres primeros los registró el lote 1; los otros seis, el lote 2, por encargo de Gerencia
(`decision/archivo-barrido-y-regla-del-archivo-01-10`, punto 4) y verificados uno a uno. Ninguno queda fuera.

#### Scenario: una entrada completa cuenta
- GIVEN una entrada `- id: F0-01` con `commit: 3d44e1e` y `prueba:` no vacía
- WHEN corre la comprobación 2
- THEN `F0-01` figura en «cierres declarados por commit» y no hay defecto de registro

#### Scenario: una entrada sin `prueba` es defecto y no cuenta
- GIVEN una entrada `- id: F0-02` con `commit:` y sin campo `prueba:`
- WHEN corre la comprobación 2
- THEN el fichero reporta un defecto de registro que nombra `F0-02` y `prueba`, `F0-02` no figura en
  ninguna cifra de cerradas, y el código de salida no cambia

#### Scenario: una entrada con `commit` vacío es defecto y no cuenta
- GIVEN una entrada `- id: F0-03` con `commit: ""` y `prueba:` no vacía
- WHEN corre la comprobación 2
- THEN se reporta como defecto de registro y no cuenta

#### Scenario: la lista plana antigua ya no cuenta
- GIVEN `cierres_declarados_por_commit` escrita como lista plana de IDs (`- F0-01`)
- WHEN corre la comprobación 2
- THEN ninguna de esas tandas cuenta, y cada una se reporta como entrada incompleta

#### Scenario: el árbol real registra nueve
- GIVEN `openspec/config.yaml` con los nueve bloques de la tabla
- WHEN corre `npm run reconcile`
- THEN «cierres declarados por commit» contiene exactamente `F0-00`, `F0-01`, `F0-02`, `F0-03`, `F1A-01`,
  `F1A-02`, `F1A-04`, `F1A-05` y `F1B-01`, con cero defectos de registro

---

### Requirement: RQ-RC-11 · La cifra «en curso» se publica aparte y nunca suma

La comprobación 2 **SHALL** publicar una cifra **«en curso»** con sus tandas nombradas: las tandas del
§C que tengan un cambio con `tanda:` de esa fila y que **no** estén en ninguna de las dos poblaciones
de cerradas. Entra en «en curso» un cambio cuyo proposal esté:

- **fuera de `openspec/changes/archive/`**, con cualquier valor de `cierra` (`si` o `no`); o
- **archivado con `cierra: no`**.

Una tanda con varios cambios **SHALL** aparecer **una sola vez**. Los cambios `tanda: fuera-del-plan`
**MUST NOT** entrar en «en curso»: no son fila del denominador. «En curso» **MUST NOT** sumarse a las
cerradas ni descontarse del denominador.

Con el árbol real, «en curso» **SHALL** dar seis: F0-04, F1B-04, F1B-07, F1B-08, F1B-11 y F1C-05.

#### Scenario: `cierra: si` sin archivar es «en curso»
- GIVEN un proposal fuera de `archive/` con `tanda: F1B-09` y `cierra: si`
- WHEN corre la comprobación 2
- THEN `F1B-09` figura en «en curso» y no en «por archivo»

#### Scenario: `cierra: no` sin archivar es «en curso»
- GIVEN un proposal fuera de `archive/` con `tanda: F1B-09` y `cierra: no`
- WHEN corre la comprobación 2
- THEN `F1B-09` figura en «en curso»

#### Scenario: archivado con `cierra: no` es «en curso»
- GIVEN un `archive/<x>/proposal.md` con `tanda: F1B-08` y `cierra: no`, y ningún otro cambio de esa
  tanda con `cierra: si` archivado
- WHEN corre la comprobación 2
- THEN `F1B-08` figura en «en curso»

#### Scenario: una tanda cerrada deja de estar en curso
- GIVEN `F1B-08` con un `archive/*/proposal.md` `cierra: si` y, además, otro cambio archivado
  `cierra: no`
- WHEN corre la comprobación 2
- THEN `F1B-08` figura en «por archivo» y **no** en «en curso»

#### Scenario: `fuera-del-plan` no es «en curso»
- GIVEN un proposal `tanda: fuera-del-plan` con motivo escrito
- WHEN corre la comprobación 2
- THEN no aparece en «en curso» y sigue contando en la comprobación 3

#### Scenario: el árbol real da seis en curso
- GIVEN el árbol real tras este cambio
- WHEN corre `npm run reconcile`
- THEN «en curso» contiene exactamente F0-04, F1B-04, F1B-07, F1B-08, F1B-11 y F1C-05, y el código de
  salida es 0

---

### Requirement: RQ-RC-12 · El denominador sale del §C de la R01.4, acotado a esa sección, e incluye 1G, 1H, F1A-10, F2 y F4

La comprobación 2 **SHALL** leer el denominador de las filas de la tabla del **§C** de
`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md`, **acotando la lectura al tramo entre el
encabezado `## C ·` y el siguiente separador `---`**. Las filas de otras secciones **MUST NOT** pisar
ni añadir al denominador, **en particular el §F.3**, que repite IDs en su primera columna.

Un ID de fila **SHALL** reconocerse con o sin negrita (`**F1A-10**` y `F1A-10`) y en las familias
`F0-`, `F1[A-F]-`, `1G-`, `1H-` y `F[2-5]-` (incluidas F2-xx y F4-xx). Cada ID **SHALL** contar una
sola vez. Con la R01.4 de hoy el denominador **SHALL** ser **78**.

La publicación **SHALL** fechar el denominador y nombrar el plan (R01.4) y su commit, según la regla
(a) de `unidad_de_avance`. El barrido **MUST NOT** excluir filas por familia: excluir F2/F4 sería
decidir alcance por su cuenta.

Si el §C no se encuentra o no produce ninguna fila, el barrido **SHALL** informar con hallazgo explícito, sin
alterar el código de salida (`RQ-RC-03`), y **MUST NOT** caer en silencio a otra sección u otro plan.

#### Scenario: el denominador es 78
- GIVEN la R01.4 real
- WHEN corre la comprobación 2
- THEN el denominador publicado es 78

#### Scenario: un ID repetido en el §F.3 no altera la cuenta
- GIVEN una R01.4 sintética con el ID `F1B-04` una vez en el §C y otra vez en la primera columna de
  una tabla del §F.3, con datos distintos
- WHEN corre la comprobación 2
- THEN el denominador cuenta `F1B-04` una vez, y los datos de la fila son los del §C

#### Scenario: se reconocen las cinco familias y la negrita
- GIVEN un §C sintético con las filas `**F1A-10**`, `1G-01`, `1H-00`, `F2-01` y `F4-01`
- WHEN corre la comprobación 2
- THEN las cinco cuentan en el denominador, y ninguna se descarta por la negrita ni por la familia

#### Scenario: mutar el fichero vigilado
- GIVEN la R01.4 sintética con el encabezado `## C ·` renombrado (regla de mutación 2)
- WHEN corre la comprobación 2
- THEN el barrido informa con hallazgo que nombra el §C, no altera el código de salida y no publica un
  denominador de otra sección

#### Scenario: una fila fuera del §C no entra
- GIVEN una fila `F1A-99` escrita sólo en el §G de la R01.4 sintética
- WHEN corre la comprobación 2
- THEN `F1A-99` no cuenta en el denominador

---

### Requirement: RQ-RC-07 · Regla (d) de `unidad_de_avance`: el numerador se publica con el motivo de su cambio

`openspec/config.yaml` **SHALL** declarar **CINCO** reglas de lectura en
`unidad_de_avance.reglas_de_lectura` (`openspec/config.yaml:1243` en `ce93480`), con ids `a`, `b`,
`c`, `d` y `e`, en ese orden. Las tres primeras —`openspec/config.yaml:1245` en `ce93480`,
`openspec/config.yaml:1250` en `ce93480` y `openspec/config.yaml:1255` en `ce93480`— **MUST NOT**
tocarse.

La regla **(d)** **SHALL** seguir publicando el numerador con el **motivo** de su cambio, `por
trabajo` o `por dictamen`.

**Por qué (d):** el 2026-09-17 el numerador pasó de 10 a 11 **sin que nadie escribiera código** —lo
movió un dictamen—. Es correcto, pero un lector que vea la serie sin más creerá que fue un día
productivo. El denominador ya va fechado por la regla (a); el numerador necesita lo simétrico.

La regla **(e)** **SHALL** declarar: «Un cambio lleva UN SOLO `tanda:`. No existe «cuenta en
parte»». Su origen es la decisión de Gerencia `decision/e001-por-entregar` (`openspec/config.yaml` →
`decisiones_de_gerencia` → `decision/e001-por-entregar`, 2026-09-24): `cierra:` dice si la fila
TERMINA; la (e) dice que el `tanda:` es ÚNICO y excluyente, y un `cierra: no` **MUST NOT** leerse
como «contar en parte».

(Previously: RQ-RC-07 sólo exigía la **cuarta** regla (d) y que las tres primeras no se tocaran;
ahora exige **CINCO** reglas (a-e), conserva (d) íntegra con su «Por qué» y su escenario, y añade el
origen y el alcance de (e).)

#### Scenario: un cierre por dictamen se distingue de uno por trabajo

- GIVEN un corte en el que el numerador sube por una decisión y no por una tanda
- WHEN se publica
- THEN lleva el motivo `por dictamen`, y la serie no se lee como productividad

#### Scenario: un cambio que realiza contenido de dos filas lleva un único `tanda:`

- GIVEN un cambio cuyo trabajo realiza contenido de dos filas del §5 del plan
- WHEN se declara su cabecera
- THEN lleva un único `tanda:` con el ID de UNA fila, o `fuera-del-plan` con motivo escrito — nunca
  las dos filas a la vez ni «cuenta en parte»

#### Scenario: el guardián discrimina la (e) sin arrastrar la (d)

- GIVEN una copia del registro a la que se le borra sólo la regla (d)
- WHEN la comprobación lee `reglas_de_lectura`
- THEN los ids que ve son `a`, `b`, `c` y `e` — la ausencia de (d) no borra ni desordena la (e)
---

### Requirement: RQ-RC-08 · El campo `estado` va en las DOCE entradas de `incumplimientos_vivos`, vivas incluidas

Las **doce** entradas de `incumplimientos_vivos` (`openspec/config.yaml:307` en `ce93480`) **SHALL**
llevar el campo `estado`, **las vivas también**, de modo que «vivo» quede **escrito y no deducido de
que falte una línea**. Un barrido que cuenta ausencias miente en cuanto alguien añade una entrada y se
olvida del campo.

Distribución medida en `ce93480`:

| Situación | Entradas | Dónde |
|---|---|---|
| `estado: CERRADO` | IV-1, IV-3, IV-4, IV-5, IV-7, IV-10 (**seis**) | `openspec/config.yaml:312` en `ce93480`, `:434`, `:474`, `:554`, `:675`, `:874` |
| `estado` en **prosa** | IV-6 (**uno**) | `openspec/config.yaml:652` en `ce93480` |
| **sin el campo** | IV-2, IV-8, IV-9, IV-11, IV-12 (**cinco**, los vivos) | `openspec/config.yaml:376` en `ce93480`, `:733`, `:783`, `:978`, `:1057` |

- **IV-6 es el único no mecánico**: su `estado` es hoy prosa. El valor **SHALL** pasar a `CERRADO` y
  **la prosa SHALL conservarse en una clave propia**. **MUST NOT** borrarse: este fichero tiene por
  cultura conservar el registro.
- La comprobación 4 **SHALL** contar los vivos por el campo `estado`, nunca por ausencia de línea.

#### Scenario: los vivos se cuentan por el campo, no por la ausencia
- GIVEN las doce entradas con `estado` escrito
- WHEN corre la comprobación 4
- THEN reporta cinco vivos, y una entrada nueva sin `estado` se reporta como **defecto de registro**,
  no como vivo

#### Scenario: la prosa de IV-6 sobrevive
- GIVEN IV-6, cuyo `estado` era prosa
- WHEN se escribe `estado: CERRADO`
- THEN la prosa anterior sigue en el fichero, en una clave propia

---

### Requirement: RQ-RC-09 · La capacidad se declara a sí misma en `capabilities` (R-2)

`reconciliacion` **SHALL** añadirse a `openspec/config.yaml → capabilities`
(`openspec/config.yaml:104` en `ce93480`) **en el mismo cambio** que crea
`openspec/specs/reconciliacion/spec.md`, según R-2 (`CLAUDE.md:467-469`).

**No es formalismo: es la comprobación 1 aplicada a esta misma capacidad.** Una spec que no está en
`capabilities` no la carga el preflight — existe y es invisible. Crear esta capacidad sin declararla
haría que `npm run reconcile` saliera con código ≠ 0 en su primera ejecución **por su propia culpa**,
y la capacidad nacería siendo el desvío que existe para cazar.

#### Scenario: la capacidad nace declarada
- GIVEN el cambio que crea `openspec/specs/reconciliacion/spec.md`
- WHEN corre `npm run reconcile` por primera vez
- THEN la comprobación 1 reporta **0 huérfanas** y el código de salida es 0
