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
el mismo patrón que el detector de citas (`apps/desk/server/citas/cli.ts` en `ce93480`).

Las **seis** comprobaciones, y lo que cada una reporta medido contra `ce93480`:

| # | Comprueba | Contra `ce93480` |
|---|---|---|
| 1 | `capabilities` (`openspec/config.yaml:104` en `ce93480`) **vs** `openspec/specs/*/spec.md` en disco | **17 declaradas · 9 ficheros · 0 huérfanas** |
| 2 | Tandas del §5 **vs** cabeceras `tanda:` | **dos cifras separadas** — `RQ-RC-05` |
| 3 | Cambios con `tanda: fuera-del-plan`, con su motivo | **CINCO** |
| 4 | IVs vivos sin destino · gates sin sesión · claves `decision/*` sin fila | **5 vivos** (`openspec/config.yaml:307` en `ce93480`) |
| 5 | Cifras ancladas (`openspec/config.yaml:1197` en `ce93480`) | esperas **4 / 11**, divergencia **legítima** |
| 6 | Ficheros de `docs/sdd` sin trackear | **once** |

- «Huérfana» **SHALL** significar **spec en disco que no está en `capabilities`**, no al revés: una
  capacidad declarada sin spec es trabajo pendiente, no un desvío de registro.
- La comprobación 3 **SHALL** contar **cinco**, no seis. La enumeración de
  `docs/sdd/ENTRADA.md:24` (E-001) es exhaustiva y correcta —`cerrar-hallazgos-revision-f1b-01`,
  `mensaje-422-cliente-duplicado`, `reasignar-desvios-huerfanos`, `hook-citas-pre-push`,
  `detector-citas-extremos`—; el numeral «seis» que la acompaña es un off-by-one, porque `6+1+2 = 9`
  sobre **ocho** archivados y `5+1+2 = 8` sí cierra.

#### Scenario: el fichero lleva su procedencia
- GIVEN una ejecución de `npm run reconcile`
- WHEN termina
- THEN `docs/sdd/RECONCILIACION.md` empieza por la fecha y el commit medido, y ninguna cifra del cuerpo
  queda sin decir contra qué se midió

#### Scenario: una spec sin declarar es huérfana; una capacidad sin spec no lo es
- GIVEN una spec nueva en `openspec/specs/<nombre>/spec.md` que no está en `capabilities`
- WHEN corre el barrido
- THEN la comprobación 1 la reporta como huérfana
- AND una capacidad declarada en `capabilities` sin fichero en disco **no** se reporta como huérfana

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

### Requirement: RQ-RC-05 · El numerador son DOS cifras separadas, nunca una suma

La comprobación 2 **SHALL** publicar el numerador del avance como **dos cifras separadas**, cada una
con sus tandas nombradas: **cierres derivables de cabecera** y **cierres declarados por commit**.
**MUST NOT** publicarlas sumadas sin desglose.

Medido en `ce93480`:

    4  derivables de cabecera .... F0-01, F0-02, F0-03, F1A-08
    7  declarados por commit ..... F0-00, F0-04, F1A-01, F1A-02, F1A-04, F1A-05, F1B-01
    ─────────────────────────────────────────────────────────────────────────────────
    11 de 52

- **MUST NOT** escribirse cabecera retroactiva para los siete declarados por commit. Inventarla sería
  fabricar evidencia; contarlos sin decirlo, esconder de dónde sale el número.
- `F0-00` **SHALL** declararse explícitamente como **tanda sin carpeta de change** —es auditoría del
  as-built, sin código—, de modo que su ausencia no se lea como descuido.
- `F0-04` **SHALL** aparecer en la columna «declarados por commit» pese a tener cabecera, porque su
  `cierra` es `no` (`docs/sdd/ENTRADA.md` en `ce93480`, E-013): su fila pide tres cosas y sólo dos se
  verifican en el repositorio.
- El numerador **SHALL** publicarse con el **motivo** de su cambio, `por trabajo` o `por dictamen`,
  según `RQ-RC-07`.

#### Scenario: las dos cifras van nombradas
- GIVEN el árbol de hoy
- WHEN corre la comprobación 2
- THEN publica 4 y 7 con las tandas de cada columna enumeradas, y el total 11 de 52

#### Scenario: una tanda con cabecera y `cierra: no` no cuenta como cierre derivable
- GIVEN `F0-04` con cabecera válida y `cierra: no`
- WHEN corre la comprobación 2
- THEN no aparece entre los derivables de cabecera, y el total no cambia

---

### Requirement: RQ-RC-06 · Las dos guardas del autocertificado ENSEÑAN, no rechazan

El `tanda:` lo escribe el mismo agente que hace el trabajo y nada mecánico lo contrasta: `verify: pass`
prueba que el cambio cumplió **su propio** `tasks.md`, no lo que pide la fila del plan. Son dos
documentos y nadie los enfrenta. Antes del dictamen no importaba, porque reclamar un ID no daba nada;
**ahora da una tanda cerrada**. Dos guardas, y ninguna bloquea:

- **(a)** El `archive-report.md` de todo cambio con `tanda:` **SHALL** declarar **en una línea** qué
  parte del contenido de esa fila cubrió y qué dejó fuera. Es lo que sostiene el `cierra`, que se
  escribe como **intención** y se confirma después.
- **(b)** La comprobación 2 **SHALL** marcar **«sin verificar»** toda fila dada por cerrada cuya
  `maestro:` no cite ninguna de las fuentes que el §5 declara para ella. **MUST NOT** rechazarla ni
  alterar el código de salida.

**La guarda (b) tiene su primer caso antes de existir, y va escrito para que no se lea como defecto:**
`F0-02` declara `maestro: ["Anexo H"]` —su propio documento abre con «el Anexo H dice la frase que
gobierna esta tanda»— mientras la columna de `plan:456` en `ce93480` declara **M1.3, M1.9, Anexo G**.
No hay intersección, así que la comprobación 2 la marcará «sin verificar» el primer día. **Es su
trabajo.** Cuadrar el plan con el documento es decidir cuál de los dos manda, y no es de esta tanda.

#### Scenario: una fila cerrada sin fuente común se marca y no bloquea
- GIVEN `F0-02` con `maestro: ["Anexo H"]` y la columna del §5 declarando M1.3, M1.9 y Anexo G
- WHEN corre la comprobación 2
- THEN la fila aparece marcada «sin verificar», y el código de salida no cambia

#### Scenario: el informe de archivo sostiene el `cierra`
- GIVEN un cambio archivado con `tanda:` y `cierra: si`
- WHEN se lee su `archive-report.md`
- THEN contiene una línea que dice qué parte del contenido de la fila cubrió y qué dejó fuera

---

### Requirement: RQ-RC-07 · Regla (d) de `unidad_de_avance`: el numerador se publica con el motivo de su cambio

`openspec/config.yaml` **SHALL** ganar una **cuarta** regla de lectura en `unidad_de_avance`
(`openspec/config.yaml:1243` en `ce93480`): el numerador se publica con el **motivo** de su cambio,
`por trabajo` o `por dictamen`. Las tres existentes —`openspec/config.yaml:1245` en `ce93480`,
`openspec/config.yaml:1250` en `ce93480` y `openspec/config.yaml:1255` en `ce93480`— **MUST NOT**
tocarse.

**Por qué:** el 2026-09-17 el numerador pasó de 10 a 11 **sin que nadie escribiera código** —lo movió
un dictamen—. Es correcto, pero un lector que vea la serie sin más creerá que fue un día productivo. El
denominador ya va fechado por la regla (a); el numerador necesita lo simétrico.

#### Scenario: un cierre por dictamen se distingue de uno por trabajo
- GIVEN un corte en el que el numerador sube por una decisión y no por una tanda
- WHEN se publica
- THEN lleva el motivo `por dictamen`, y la serie no se lee como productividad

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
