# Delta for citas-verificables

Contexto: `openspec/specs/citas-verificables/spec.md`. Cierra los dos defectos que el cierre de IV-10
dejó vivos en el detector de citas: la comprobación de línea vacía no cubría el extremo final de un
rango, y una abreviada situada detrás de una cita anclada se leía siempre en el sha local en vez de en
el ancla que su cosecha ya le atribuye. RQ-CV-08 gana la cuarta rama de comprobación —el extremo final
en línea vacía, con un motivo exacto para cada combinación— y RQ-CV-06 gana la herencia del ancla entre
citas de una misma línea física, la precedencia del ancla propia sobre la heredada, sus dos cortes y el
fallo de ancla como categoría propia. RQ-CV-03 no cambia de texto: el escenario ambiguo nuevo de
RQ-CV-08 lo ejercita sin modificarlo, y por eso no aparece en este delta.

**Prefijo de esta tanda.** Las mutaciones y pruebas nuevas se nombran `DCE-M1`…`DCE-M5`, `DCE-M7` y
`DCE-P1`…`DCE-P8` (de *detector-citas-extremos*), para no chocar con la numeración `M1`…`M30` ya usada
en la spec viva. `DCE-M6` no aparece en ninguno de los dos requisitos: es la mutación del fichero
vigilado sobre las cinco reparaciones de citas de la propuesta (regla de mutación 2 del proyecto), y
vigila contenido reparado, no una rama de comportamiento del detector que esta capacidad describa.

## MODIFIED Requirements

### Requirement: RQ-CV-06 · La forma abreviada se atribuye al último fichero anterior por índice, se lee en su ancla —propia o heredada— y se INFORMA sin bloquear; la completa anclada se verifica por revisión

La forma abreviada (`` `:N` ``) **SHALL** atribuirse al último nombre de fichero que aparece **antes**
de ella, por índice, en su **misma línea física** — nunca al último nombre de la línea completa —, y
sólo cuando ese nombre cumple los cuatro requisitos de cosecha: **(a)** el patrón del nombre **MUST
NOT** ser una lista de extensiones; **(b)** **SHALL** admitir que el nombre empiece por punto; **(c)**
la atribución **SHALL** ir al fichero anterior por índice, no al último de la línea; **(d)** una
mención **pelada** (sin número de línea) que resuelva a un fichero trackeado **SHALL** contar como
fichero al que atribuir. Sin fichero previo válido, la abreviada **SHALL** informarse como huérfana.

Una abreviada atribuida **SHALL** comprobarse como exige RQ-CV-08 y, si está rota, **SHALL** informarse
en su **propia cifra**, con fichero, línea y motivo. Una abreviada —rota, huérfana o válida, anclada o
no— **MUST NOT** bloquear y **MUST NOT** entrar en la línea base (decisión Q9 de la propuesta de
`hook-citas-pre-push`). **El referente de una abreviada lo decide quien lee el contexto, no la
sintaxis**: con la atribución de este
requisito, el árbol tiene 56 abreviadas rotas, y 55 si una completa sin resolver corta la atribución
(medido el 2026-09-13 sobre `773ad75` por la ruta diseñada, con `git grep`, sin `docs/artefactos/` ni
`*.csv`, nivel 2 de procedencia). La clasificación se hizo por un script, no leyendo una a una, y sobre
las 54 del prototipo anterior: 19
citaban el maestro nombrado en prosa y 16 cruzaban celdas de la misma tabla de
`openspec/specs/tickets-core/spec.md`. La que suma la ruta diseñada viene del plan de catálogo de
equipos con un byte NUL (RQ-CV-09), y no está clasificada. Y, cortando la atribución en esos
casos, al menos tres de las que quedaban seguían siendo citas válidas a otro documento —en la línea 144
de `docs/sdd/F0-01_Correcciones_para_el_plan.md`, en la 33 de `openspec/specs/transitions-st/spec.md` y
en la 325 de `openspec/specs/trazas/spec.md`—. Un corte sintáctico siempre deja falsos positivos, y un
hook que bloquea no puede cargar con ellos.

Una cita **completa anclada** (`<ruta>:<N>` en `` `<rev>` ``) **SHALL** verificarse contra el fichero en
esa revisión, leído como exige RQ-CV-01; una revisión inexistente **MUST** bloquear.

Una abreviada atribuida **SHALL** leerse en su **ancla propia** si la lleva; si no la lleva, **SHALL**
leerse en el **ancla de la última cita completa válida anterior a ella en su misma línea física** —la
herencia—; si no hay ninguna completa válida anclada anterior en esa línea, **SHALL** leerse en el sha
local, como hoy. El **ancla propia** **SHALL** tener precedencia sobre la heredada.

La herencia **SHALL** reiniciarse cada vez que cambia la atribución vigente de esa línea física: una
cita completa **válida** fija su propio ancla —o **ninguna**, si ella misma no la lleva (b.2)— como la
nueva atribución; una mención pelada que resuelve a **otro** fichero corta la herencia; una mención
pelada que resuelve al **mismo** fichero **MUST NOT** cortarla (b.1). Una completa válida **sin ancla**,
posterior a una anclada, **SHALL** dejar la abreviada siguiente de esa línea **sin ancla** — se lee en
el sha local (b.2).

Si la revisión de una abreviada —propia o heredada— **no pela a árbol**, o el fichero atribuido **no
existe** en esa revisión, la abreviada **SHALL** informarse en «abreviadas rotas» con un motivo que
**nombre la revisión**, y **MUST NOT** bloquear, **MUST NOT** entrar en la línea base, y **MUST NOT**
contarse ni en «no legibles» ni en «anclas sin resolver» (d). Una abreviada con ancla —propia o
heredada— rota **por contenido** (la revisión sí pela y el fichero sí existe en ella, pero la línea
citada falla) **SHALL** también nombrar la revisión en su motivo (b.3).

Cada caso nuevo de este requisito cae en **exactamente un** sumando del invariante de conservación: la
abreviada heredada o con ancla propia, válida o rota por contenido, cuenta en comprobadas o en
abreviadas rotas; el fallo de ancla cuenta en abreviadas rotas —nunca en bloqueantes, en no legibles ni
en anclas sin resolver—; una abreviada con ancla pero sin atribución sigue contando en huérfanas, como
hoy. Que el patrón que reconoce un ancla acepte cualquier palabra como revisión válida queda **fuera de
alcance** de este requisito y se registra como hallazgo aparte, no como comportamiento exigido aquí. El
único caso real de hoy en el árbol es la abreviada de la línea 167 de
docs/sdd/Puntos_para_Gerencia_2026-09-11.md, que sale como abreviada rota informativa por fallo de
ancla (d).

(Previously: la abreviada atribuida se leía siempre en el sha local, ignorando el ancla de la completa
que la precede en su misma línea física; no existía herencia de ancla, ni precedencia del ancla propia,
ni el fallo de ancla como categoría propia con motivo.)

*(Mutaciones: M3, M20, M24, M25, M26, M27, M30, DCE-M3, DCE-M4, DCE-M5, DCE-M7 · Rojo: d. **Precisión
sobre M24 y M25**, que corrige la
lectura literal de Q9 —«M24 a M27 cambian bloquea por figura en la lista de abreviadas rotas»—: los
requisitos (a) y (b) deciden también a qué nombre se atribuye una abreviada, pero sus controles de dos
signos son citas **completas**, que siguen bloqueando; por eso M24 y M25 conservan «bloquea» y sólo
M26 y M27 pasan a la lista de abreviadas rotas.)*

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
- AND (a) también decide a qué nombre se atribuye una abreviada, pero el control se hace con la cita
  **completa**, porque es la que bloquea (RQ-CV-06)

#### Scenario: (b) un nombre que empieza por punto se cosecha (M25)
- GIVEN una cita válida a `.dockerignore` y otra a ese mismo fichero con la línea fuera de rango
- WHEN corre el hook
- THEN la válida figura entre las **comprobadas** y la rota bloquea
- AND si el nombre tiene que empezar por letra o dígito (mutación), se cosecha el nombre sin el punto,
  que no resuelve ni lleva `/`: la rota pasa a **saltada** y sale verde
- AND (b) también decide a qué nombre se atribuye una abreviada, pero el control se hace con la cita
  **completa**, porque es la que bloquea (RQ-CV-06)

#### Scenario: (c) la abreviada va al fichero anterior por índice, en los dos órdenes (M26)
- GIVEN una línea «fichero A, abreviada, fichero B» con la línea citada válida en A y vacía en B
- WHEN corre el hook
- THEN la abreviada figura entre las **comprobadas** y no en la lista de abreviadas rotas
- AND con A y B intercambiados —vacía en A, válida en B— **figura en la lista de abreviadas rotas**
- AND en los dos órdenes el push sale 0, porque una abreviada no bloquea
- AND si la abreviada se atribuye al último fichero de la línea (mutación), las dos salidas se
  invierten: en el primer orden pasa a figurar en la lista de rotas sin estarlo, y en el segundo deja
  de figurar en ella

#### Scenario: (d) la mención pelada que resuelve captura; la que no resuelve no (M27)
- GIVEN una línea que nombra `.dockerignore` sin número de línea, y detrás `.git` y `docs` —el primero
  no trackeado, el segundo un directorio—, cada uno seguido de una abreviada válida para `.dockerignore`
- WHEN corre el hook
- THEN las abreviadas se atribuyen a `.dockerignore` y figuran entre las **comprobadas**, ninguna entre
  las huérfanas
- AND la misma línea con una abreviada fuera de rango **figura en la lista de abreviadas rotas**, y el
  push sale 0
- AND si se quita (d) (mutación), las abreviadas quedan huérfanas y la rota **deja de figurar en la
  lista de abreviadas rotas**; y si captura cualquier token pelado, resuelva o no (mutación), la
  abreviada va a `.git` o a `docs`, se salta y la rota tampoco figura en esa lista

#### Scenario: una abreviada rota se informa y no bloquea (M30)
- GIVEN una abreviada atribuida a un fichero trackeado, con la línea citada fuera de rango
- WHEN corre el hook
- THEN el push sale 0
- AND la abreviada aparece en el informe de abreviadas rotas, con fichero, línea y motivo
- AND no entra en la línea base
- AND la misma abreviada válida no aparece en la lista de rotas y figura entre las **comprobadas**
- AND si se muta el detector para que una abreviada rota bloquee, el push sale ≠ 0 y la prueba se pone
  roja

#### Scenario: revisión inventada en una cita completa anclada bloquea
- GIVEN una cita completa anclada a una revisión que no existe en el repositorio
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

#### Scenario: la abreviada hereda el ancla de la última completa válida de su línea, en los dos signos (DCE-P4)
- GIVEN una completa anclada a una revisión válida, seguida en la misma línea física de una abreviada
  cuya línea citada está vacía en el sha local y con contenido en esa revisión
- WHEN corre el hook
- THEN la abreviada figura entre las **comprobadas**, porque se lee en la revisión heredada, no en el
  sha local
- AND control del otro signo: con la línea citada vacía también en la revisión heredada, y con
  contenido en el sha local, la abreviada **figura en la lista de abreviadas rotas**

#### Scenario: una completa válida sin ancla, entre la anclada y la abreviada, deja la herencia sin ancla (DCE-P4, b.2)
- GIVEN una completa anclada a una revisión, seguida en la misma línea física de una segunda completa
  válida SIN ancla, y después de ésta una abreviada
- WHEN corre el hook
- THEN la abreviada se lee en el sha local, no en la primera revisión: la completa sin ancla reinicia
  la herencia a «ninguna»
- AND si está rota, su motivo **no** nombra ninguna revisión
- AND este escenario nace verde —hoy también se lee en local—; la mutación DCE-M7, que conserva el
  ancla anterior en vez de vaciarla, lo pone rojo

#### Scenario: el motivo de una abreviada heredada rota por contenido nombra la revisión (DCE-P4, b.3)
- GIVEN una abreviada que hereda el ancla de la completa anterior de su línea, con esa revisión
  existente y el fichero atribuido presente en ella, pero la línea citada rota —fuera de rango o
  vacía— dentro de esa revisión
- WHEN corre el hook
- THEN la abreviada figura en la lista de abreviadas rotas con un motivo que nombra la revisión
  heredada, no sólo el motivo de la rotura

#### Scenario: el ancla propia de la abreviada gana sobre la heredada (DCE-P5)
- GIVEN una completa anclada a una primera revisión con la línea rota, y una segunda revisión donde la
  misma línea es válida, con la abreviada llevando su propio ancla a la segunda revisión
- WHEN corre el hook
- THEN la abreviada figura entre las **comprobadas**, porque su ancla propia tiene precedencia sobre
  la heredada
- AND la mutación DCE-M4 —invertir la precedencia, de modo que la heredada gane— pone este escenario
  en rojo

#### Scenario: una mención de OTRO fichero corta la herencia (DCE-P6)
- GIVEN una completa anclada a una revisión, seguida en la misma línea física de una mención pelada que
  resuelve a un fichero DISTINTO del de la completa, y después una abreviada; esa revisión no tiene ese
  otro fichero
- WHEN corre el hook
- THEN la abreviada se lee en el sha local, no en la revisión heredada de la completa
- AND este escenario nace verde —hoy también se lee en local—; la mutación DCE-M3 —quitar el reinicio
  del ancla en la rama de mención— lo pone rojo, porque entonces heredaría la revisión de la completa a
  pesar del cambio de fichero

#### Scenario: una mención del MISMO fichero no corta la herencia (DCE-P6, b.1)
- GIVEN la misma línea física del escenario anterior, pero con la mención pelada resolviendo al MISMO
  fichero que la completa anclada, y con la línea citada de la abreviada vacía en el sha local y con
  contenido en la revisión heredada
- WHEN corre el hook
- THEN la abreviada figura entre las **comprobadas**, porque hereda igual la revisión de la completa: la
  mención del mismo fichero no reinicia la atribución

#### Scenario: fallo de ancla — revisión que no pela a árbol, y revisión que no tiene el fichero atribuido (DCE-P7)
- GIVEN dos abreviadas con ancla propia: una a una revisión que no existe en el repositorio, y otra a
  una revisión real que no contiene el fichero atribuido
- WHEN corre el hook
- THEN las dos figuran en la lista de abreviadas rotas, cada una con un motivo que nombra su revisión
- AND ninguna de las dos bloquea el push, ni cuenta en «no legibles»

#### Scenario: el invariante de conservación se cumple con un caso de cada camino nuevo (DCE-P8, nace verde)
- GIVEN un árbol con al menos un caso de cada camino nuevo de este requisito: una abreviada heredada
  válida, una heredada rota por contenido, una con fallo de ancla y una con ancla propia que gana
- WHEN el detector cosecha y comprueba
- THEN la suma de todas las cifras del invariante —comprobadas, las seis saltadas, fuera del
  repositorio, no son citas, abreviadas rotas, bloqueantes e informadas— sigue cuadrando contra el total
  de citas cosechadas
- AND este escenario nace verde: la suma ya cuadraba antes de la tanda porque los casos nuevos caen en
  sumandos existentes; la mutación DCE-M5 —mandar el fallo de ancla a «no legibles» o a bloqueantes en
  vez de a abreviadas rotas— lo pone rojo

### Requirement: RQ-CV-08 · Comprobación mecánica: fichero, rango, línea vacía en los DOS extremos por separado, cada uno con su motivo exacto

Para cada cita en alcance, el detector **MUST** verificar: que el fichero exista en la revisión
empujada; que la línea citada esté **dentro de rango**; que la línea **no esté vacía**; y, para un
rango, **ambos extremos por separado**, con el mensaje nombrando **cuál** de los dos falla. En una
abreviada atribuida la comprobación es la misma, pero su resultado **se informa y no bloquea**
(RQ-CV-06).

El extremo **final** de un rango **SHALL** comprobarse contra línea vacía con la misma regla que el
inicial: un rango cuyo extremo final cae en una línea vacía **MUST** bloquear, con motivo exacto
`extremo final en línea vacía`, tanto en una cita completa simple como en cada candidata de una cita
ambigua — RQ-CV-03 no cambia: la candidata con el final vacío cuenta como rota, y la ambigua bloquea
sólo si lo está en todas. Cuando los **dos** extremos de un rango caen en línea vacía, el motivo
**SHALL** nombrar el **inicial**, nunca el final. Un extremo **fuera de rango** **MUST** informarse con
el motivo `extremo <inicial|final> fuera de rango`, y **MUST NOT** informarse como «en línea vacía»
aunque la línea no exista: fuera de rango y línea vacía son motivos distintos y no intercambiables entre
sí.

(Previously: el detector comprobaba línea vacía sólo en el extremo inicial de un rango; el extremo final
sólo se comprobaba fuera de rango, nunca vacío, y el mensaje no fijaba un motivo textual exacto por cada
combinación de extremo y tipo de fallo.)

*(Mutaciones: M2, M4, DCE-M1, DCE-M2 · Rojos: a, b, c · DCE-M1 exige que la cuarta rama corra después
de la tercera; DCE-M2 exige que corra después de la segunda)*

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

#### Scenario: el extremo final en línea vacía bloquea con motivo exacto, en una cita completa (DCE-P1)
- GIVEN un rango de una cita completa cuyo extremo inicial tiene contenido y cuyo extremo final cae en
  línea vacía
- WHEN corre el hook
- THEN bloquea con motivo exacto `extremo final en línea vacía`

#### Scenario: el final vacío en una candidata ambigua bloquea si lo está en todas, y se salta si otra la valida (DCE-P2)
- GIVEN un token ambiguo con dos candidatas trackeadas, una con el extremo final en línea vacía
- WHEN la otra candidata está rota por otra razón
- THEN bloquea en todas sus candidatas, como «ambigua, rota en sus 2 candidatas»
- AND si la otra candidata es válida, se salta e informa en el contador de saltadas, sin bloquear
  (RQ-CV-03)

#### Scenario: motivo exacto según la posición del extremo vacío, y fuera de rango nunca se informa como vacío (DCE-P3)
- GIVEN un rango con los dos extremos en línea vacía
- WHEN corre el hook
- THEN bloquea con motivo exacto `extremo inicial en línea vacía`, nombrando el inicial y no el final
- AND un rango con el extremo final fuera del número de líneas del fichero bloquea con motivo exacto
  `extremo final fuera de rango`, nunca con un motivo que diga «en línea vacía»
