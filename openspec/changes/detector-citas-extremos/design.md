# Diseño: el detector comprueba el extremo final y lee la abreviada en su ancla

**Cambio `detector-citas-extremos` · base `1c5ee7e` (rama `main`) · preflight de `openspec/config.yaml:25-30` en `1c5ee7e`**

> **Procedencia, en tres niveles.** (1) **Leído de disco en esta fase**, sobre el árbol de trabajo, que
> en las rutas citadas es idéntico a `1c5ee7e` (árbol limpio según el encargo); toda cita va anclada a
> `1c5ee7e` en su misma línea física y se comprobó por los dos extremos. (2) **Medido por el
> orquestador** sobre `1c5ee7e` y entregado en el encargo: no reverificado aquí. (3) Lo demás lleva
> **hipótesis**. Los artefactos de la tanda (propuesta, delta, exploración) se nombran por fichero y
> apartado. Los ejemplos de citas se escriben en prosa o con marcadores, sin forma de cita.

---

## 1 · La respuesta, primero

| # | Punto | Decisión |
|---|---|---|
| 1 | Dónde vive el ancla heredada | En el campo `ancla` que ya existe; la precedencia (la propia gana) se resuelve en la cosecha con una sola expresión. Sin campo nuevo (D1) |
| 2 | Lectura en dos pasadas | Las dos pasadas construyen la clave con `arbolDeLectura`; la primera no pide nada si la revisión no pela; la segunda decide en el orden huérfana → revisión inexistente → contenido ausente → rotura. Nada reutiliza la vía de la completa (D2) |
| 3 | Motivos | Cuarta rama: `extremo final en línea vacía`. Abreviada: `abreviada rota (atribuida a <fichero>[ en <rev>])[: <fallo de ancla>]`. No incluye el motivo de `rotura()` (D3) |
| 4 | Posición y cosecha | Cuarta rama después de la tercera. El ancla vigente cambia exactamente cuando cambia la atribución, más (b.2); el ancla propia no se propaga (D4) |
| 5 | Invariante | Cada salida de la rama abreviada suma 1 en exactamente un sumando; DCE-P8 afirma la suma **y el desglose**, porque la suma sola no ve DCE-M5 (D5) |
| 6 | Mutaciones | Copia fuera del repositorio, prueba roja nombrada, restauración con `cmp` y `git diff --exit-code`; DCE-M6 con `git stash create` y `--sha`: rojo en las nº 1-3, verde medido en las nº 4-5 (D6) |
| 7 | Huecos de RQ-CV-17 | Siete, H1 a H7 (D7) |
| 8 | Commits | 0 y 1 en pushes propios; 2 y 3 en el mismo push; 4 aparte (D8) |

---

## 2 · Enfoque técnico

Dos piezas del núcleo puro, ninguna del adaptador ni del CLI:

- `cosecha.ts` gana una variable de estado por línea física, `anclaVigente`, junto a las dos que ya
  guardan la atribución (`apps/desk/server/citas/cosecha.ts:104-107` en `1c5ee7e`).
- `detector.ts` gana la cuarta rama de `rotura()` y dos ramas en la abreviada.

`git.ts`, `cli.ts`, `resolucion.ts`, `informe.ts` y el arnés no cambian. **`informe.ts`, confirmado
leyendo:** `lista()` imprime el motivo tal cual (`apps/desk/server/citas/informe.ts:29-32` en `1c5ee7e`),
la cifra de abreviadas rotas es la longitud de su lista (`apps/desk/server/citas/informe.ts:42` en `1c5ee7e`)
y (d) no pide cifra nueva.

**Regla invariable 13:** no aplica; la tanda no toca `apps/desk/src`, y el detector es código de servidor
inerte que sólo corre bajo el hook (`apps/desk/server/citas/detector.ts:4-6` en `1c5ee7e`).

**Matriz de amenazas: N/A.** No cambia ninguna frontera de proceso ni el adaptador de git. La única
orden git nueva, `git stash create` de DCE-M6, es procedimiento manual, no código, y no mueve
referencias (medido por el orquestador).

```
cosecharLinea ── estado por línea: ultimoFicheroValido · ultimoFicheroValidoFin · anclaVigente
      └─> CitaAbreviada { atribuidoA, ancla = propia ?? anclaVigente }
detectar
      ├─ pasada 1: clave arbolDeLectura(c) + atribuidoA   (ninguna si el ancla no pela)
      ├─ leerLote: UNA lectura
      └─ pasada 2: huérfana → revisión inexistente → contenido ausente → rotura()
informe ── lista() sin cambios
```

---

## 3 · D1 · Dónde vive el ancla heredada

| Opción | Coste | Decisión |
|---|---|---|
| **Reutilizar `ancla` de `CitaAbreviada` (`apps/desk/server/citas/cosecha.ts:27-36` en `1c5ee7e`) y resolver la precedencia en la cosecha** | Una expresión, `propia ?? anclaVigente`, en la rama de la abreviada; el detector lee un solo campo | **Elegida** |
| Campo nuevo (`anclaHeredada`) o discriminante propia/heredada | Tipo nuevo, y la precedencia pasa al detector en las **dos** pasadas: dos sitios que DCE-M4 tendría que mutar a la vez y dos sitios donde divergir | Rechazada |

- **El motivo no la exige:** (b.3) y (d) nombran la revisión en los dos casos (D3).
- **DCE-P5 y DCE-M4 no necesitan observarla:** propia y heredada apuntan a revisiones con contenido
  distinto, así que la precedencia se ve en el resultado, comprobada o rota. DCE-M4 invierte la única
  expresión.
- **El fallo del prototipo no era del campo** (Engram 597, medido por el orquestador): usaba el mismo
  campo, pero leía sin mirar antes si la revisión pela, y la abreviada de habilitar_servicio cayó en
  `noLegibles` por la rama defensiva. Lo corrige el orden de ramas de D2, no un tipo nuevo.

**Contrato del campo**, escrito como comentario en el tipo: `ancla` es la revisión en la que se leería la
abreviada —la propia o, si no la lleva, la vigente en su posición—; el detector sólo la consume si
`atribuidoA` no es nulo. El tipo no cambia: ya es opcional.

---

## 4 · D2 · La lectura de la abreviada en su ancla

**Primera pasada** (hoy `apps/desk/server/citas/detector.ts:174-176` en `1c5ee7e`):

- sin ancla: clave del sha local, como hoy;
- con ancla que pela: clave `<rev>:<atribuidoA>`, construida con `arbolDeLectura`
  (`apps/desk/server/citas/detector.ts:124-126` en `1c5ee7e`), el ayudante que ya usa la completa; se usa
  en las dos pasadas, así que hay una sola forma de construir la clave;
- con ancla que no pela: **ninguna clave**.

La pregunta «¿pela?» pasa por `arbolCacheado` (`apps/desk/server/citas/detector.ts:154-158` en `1c5ee7e`):
la revisión de una abreviada comparte caché con las completas y la segunda pasada vuelve a preguntar sin
coste. RQ-CV-13 sigue en una resolución por revisión distinta. `atribuidoA` no se resuelve contra ningún
índice: ya es una ruta exacta del índice local.

**Segunda pasada** (hoy `apps/desk/server/citas/detector.ts:187-203` en `1c5ee7e`), en este orden, cada
rama con su `continue`:

| # | Condición | Destino |
|---|---|---|
| 1 | `atribuidoA` nulo | `saltadas.huerfanas`, como hoy, aunque lleve ancla propia |
| 2 | Con ancla y `arbolCacheado(ancla)` nulo | `abreviadasRotas`, motivo de revisión inexistente |
| 3 | Contenido ausente en el lote, con ancla | `abreviadasRotas`, motivo de fichero inexistente en la revisión |
| 4 | Contenido ausente, sin ancla | `saltadas.noLegibles`, como hoy |
| 5 | `rotura()` no nula | `abreviadasRotas` |
| 6 | Resto | `comprobadas` |

**La 2 va antes de la 3:** una revisión que no pela no tiene clave en el lote, así que invertirlas
informaría una revisión inexistente como fichero ausente (DCE-M8). **Y la 1 antes de la 2:** una huérfana
con ancla falsa sigue siendo huérfana.

**Por qué no se reutiliza la vía de la completa:**

- **Revisión inexistente** (`apps/desk/server/citas/detector.ts:208-210` en `1c5ee7e`) va a
  `candidatosDeBloqueo`: bloquearía, y RQ-CV-06 lo prohíbe para toda abreviada, anclada o no
  (`openspec/specs/citas-verificables/spec.md:214-216` en `1c5ee7e`).
- **`ancladaResueltaPorIndiceLocal`** (`apps/desk/server/citas/detector.ts:242-247` en `1c5ee7e` y `apps/desk/server/citas/detector.ts:255-259` en `1c5ee7e`)
  existe porque el nombre de una completa puede no resolver en el índice local. `atribuidoA` siempre
  está en él: la cosecha atribuye con `indice.exactos` (`apps/desk/server/citas/detector.ts:134` en `1c5ee7e`),
  que es el conjunto de rutas trackeadas (`apps/desk/server/citas/resolucion.ts:20` en `1c5ee7e`). El caso
  «ancla sin resolver» no existe para una abreviada, y su rama hermana bloquea.
- **El orden del bucle ya las separa:** la rama de la abreviada va primero y termina siempre en
  `continue` (`apps/desk/server/citas/detector.ts:188-203` en `1c5ee7e`); nunca llega a las de la completa.
  Las dos ramas nuevas viven dentro de ella.

---

## 5 · D3 · Motivos exactos

Marcadores: `<fichero>` es `atribuidoA`, `<rev>` es `ancla`, `<N>` y `<token>` los de la completa.

| Caso | Literal |
|---|---|
| Cuarta rama de `rotura()` | `extremo final en línea vacía` |
| Completa simple con el final vacío (lo que compara DCE-P1) | `extremo final en línea vacía (línea <N> de <token>)` |
| Abreviada rota por contenido, sin ancla | `abreviada rota (atribuida a <fichero>)` — **sin cambio** |
| Abreviada rota por contenido, con ancla propia o heredada (b.3) | `abreviada rota (atribuida a <fichero> en <rev>)` |
| Fallo de ancla: revisión que no pela (d) | `abreviada rota (atribuida a <fichero> en <rev>): revisión inexistente` |
| Fallo de ancla: fichero ausente en la revisión (d) | `abreviada rota (atribuida a <fichero> en <rev>): fichero inexistente en la revisión` |

- **El sufijo de la completa no es nuevo:** lo añade `apps/desk/server/citas/detector.ts:271-272` en `1c5ee7e`
  a todo motivo de `rotura()`. «Motivo exacto» en DCE-P1 y DCE-P3 es la cadena entera, comparada con
  igualdad, nunca con `stringContaining`.
- **Un solo ayudante** compone «atribuida a `<fichero>`» más « en `<rev>`» si hay ancla; lo usan las tres
  ramas que escriben motivo.
- **`lista()` los imprime sin cambios** tras el guion largo (`apps/desk/server/citas/informe.ts:31` en `1c5ee7e`).
  La cita cruda de la abreviada no lleva su ancla (`apps/desk/server/citas/cosecha.ts:142` en `1c5ee7e`): por
  eso la revisión tiene que ir en el motivo.

**Decisión: el motivo de una abreviada NO incluye el de `rotura()`.**

| Opción | Coste | Decisión |
|---|---|---|
| Añadir el motivo de `rotura()` a toda abreviada rota | Cambia el literal sin ancla, que fijan con igualdad `apps/desk/server/citas/detector.test.ts:123` en `1c5ee7e` y `apps/desk/server/citas/detector.test.ts:321` en `1c5ee7e`; y el escenario (b.2) del delta, que declara que nace verde, nacería rojo sólo por el literal | Rechazada |
| **Conservar el literal sin ancla y añadir sólo la revisión y el fallo de ancla** | Nada fuera de lo que (b.3) y (d) piden | **Elegida** |

Ninguna decisión de Gerencia pide nombrar el extremo en una abreviada, aunque el texto de RQ-CV-08 se
puede leer como si lo exigiera (`openspec/specs/citas-verificables/spec.md:349-353` en `1c5ee7e`). Se registra
como hueco (H6), no se construye.

---

## 6 · D4 · La cuarta rama, y la herencia en la cosecha

### La posición

`rotura()` (`apps/desk/server/citas/detector.ts:109-115` en `1c5ee7e`) gana la comprobación de línea vacía sobre
el extremo final, con la línea del final, **después de la tercera rama**:

| Vecina | Si la cuarta va antes | Qué lo pone rojo |
|---|---|---|
| Tercera, inicial vacía | Con los dos extremos vacíos, o en una cita de una sola línea vacía, el motivo pasa a nombrar el final | DCE-M1: DCE-P3; y además `apps/desk/server/citas/hook.test.ts:156` en `1c5ee7e`, una sola línea vacía con motivo entero |
| Segunda, final fuera de rango | `lineaVacia` da verdadero para `undefined` (`apps/desk/server/citas/detector.ts:87-89` en `1c5ee7e`): un final fuera de rango se informa como vacío | DCE-M2: `apps/desk/server/citas/detector.test.ts:38` en `1c5ee7e`, endurecido a igualdad (parte de DCE-P3) |
| Primera, inicial fuera de rango | Una cita de una línea fuera de rango se informa como final vacío | Variante de DCE-M2: `apps/desk/server/citas/informe.test.ts:44` en `1c5ee7e`, que ya compara el motivo entero |

Una cita de una sola línea vacía sigue diciendo «inicial», porque la tercera responde primero: ningún
motivo de hoy cambia.

### La herencia, rama por rama de `cosecharLinea`

Sobre `apps/desk/server/citas/cosecha.ts:96-168` en `1c5ee7e`. Principio: **el ancla vigente cambia exactamente
cuando cambia la atribución vigente, más (b.2)**; lo que no toca la atribución no toca el ancla.

| Rama | Dónde, hoy | Atribución | `anclaVigente` |
|---|---|---|---|
| Completa que resuelve, con ancla | `apps/desk/server/citas/cosecha.ts:124-126` en `1c5ee7e` | su fichero | **su ancla** |
| Completa que resuelve, sin ancla (b.2) | la misma | su fichero | **ninguna** (DCE-M7) |
| Completa que no resuelve, corte 1 | `apps/desk/server/citas/cosecha.ts:127-129` en `1c5ee7e` | nula | **ninguna** (DCE-M10) |
| Mención que resuelve a otro fichero | `apps/desk/server/citas/cosecha.ts:150-153` en `1c5ee7e` | el otro | **ninguna** (DCE-M3) |
| Mención que resuelve al mismo fichero (b.1) | la misma | la misma, con su fin | **sin cambio** |
| Mención que no resuelve | la misma, condición falsa | sin cambio | sin cambio |
| Abreviada tras barra de celda, corte 2 | `apps/desk/server/citas/cosecha.ts:137-143` en `1c5ee7e` | nula sólo para ella | sin cambio; su campo lleva la vigente, que nadie lee |
| Abreviada con ancla propia | `apps/desk/server/citas/cosecha.ts:134-136` en `1c5ee7e` | sin cambio | **sin cambio: la propia no se propaga** (DCE-M9) |
| Abreviada sin ancla propia | la misma | sin cambio | sin cambio; su campo toma la vigente |
| `fuera-de-repositorio` y `no-es-cita` | `apps/desk/server/citas/cosecha.ts:157-165` en `1c5ee7e` | sin cambio | sin cambio |

- **La propia no se propaga** porque (b) hereda «de la última completa válida», y una abreviada no lo es.
  Además `REVISION_RE` acepta cualquier palabra: propagarla contagiaría un ancla falsa, como
  habilitar_servicio, a las abreviadas siguientes.
- **«Válida» es el criterio de la cosecha, no «comprobada»:** que el nombre resuelva en el índice local
  (`apps/desk/server/citas/cosecha.ts:124` en `1c5ee7e`). Una completa anclada rota por contenido fija igual la
  atribución y su ancla.
- **«Mismo fichero» es igualdad de cadenas** entre el nombre de la mención y el último fichero válido.
  Equivale a igualdad de ruta resuelta porque los dos pasaron `resuelveAFichero`, que es pertenencia
  exacta a las rutas trackeadas (`apps/desk/server/citas/detector.ts:134` en `1c5ee7e`). **Riesgo:** sólo si la
  cosecha resolviera algún día por sufijo; dos nombres del mismo fichero cortarían entonces la herencia,
  que es el lado conservador: se leería en local, como hoy (H4).
- **El reinicio del corte 1 sólo se observa en la cosecha:** tras él, toda vía que restablece la
  atribución vuelve a fijar el ancla, así que ninguna cifra ni motivo del detector lo ve. Se fija sobre el
  campo en `cosecha.test.ts` (DCE-M10).

---

## 7 · D5 · Invariante de conservación

La suma de `apps/desk/server/citas/detector.ts:53-56` en `1c5ee7e` no cambia de forma: la cosecha no crea citas,
sólo rellena un campo.

| Camino | Sumando | Estado |
|---|---|---|
| Abreviada huérfana, con o sin ancla propia | `saltadas.huerfanas` | sin cambio |
| Abreviada con revisión que no pela | `abreviadasRotas` | **nuevo** |
| Abreviada con el fichero ausente en su revisión | `abreviadasRotas` | **nuevo** |
| Abreviada sin ancla y contenido local ausente | `saltadas.noLegibles` | sin cambio |
| Abreviada, con o sin ancla, rota por contenido | `abreviadasRotas` | ampliado |
| Abreviada, con o sin ancla, válida | `comprobadas` | ampliado |
| Completa con el final vacío, o ambigua rota en todas | `bloqueantes` o `informadas` | ampliado |
| Ambigua con el final vacío en una candidata y otra válida | `saltadas.ambiguas` | sin cambio |
| Resto de la completa | los de hoy | sin cambio |

**Por qué cada abreviada cae en exactamente uno:** las seis ramas de D2 son secuenciales, cada una
incrementa un solo sumando y termina en `continue`. La completa no gana salidas: la cuarta rama sólo
cambia qué candidatas cuentan como rotas (`apps/desk/server/citas/detector.ts:267` en `1c5ee7e`), las salidas siguen
siendo las de `apps/desk/server/citas/detector.ts:270-279` en `1c5ee7e` e `informadas` se deriva de los candidatos
(`apps/desk/server/citas/detector.ts:304` en `1c5ee7e`).

**DCE-P8, y lo que de verdad pone rojo a DCE-M5.** Mandar el fallo de ancla a `noLegibles` o a
`candidatosDeBloqueo` **no cambia la suma**: mueve una unidad de un sumando a otro. Una prueba que sólo
afirma la suma **sigue verde** con DCE-M5. Por eso DCE-P8 afirma tres cosas, como la prueba del
invariante de hoy (`apps/desk/server/citas/hook.test.ts:191-204` en `1c5ee7e`):

1. `cosechadas` igual a una constante contada a mano;
2. la suma igual a esa constante — la pone roja quitar un `continue` de una rama nueva (doble cuenta);
3. el **desglose exacto** por sumando, con `toEqual` — lo pone rojo DCE-M5, y también DCE-M8 en su toma
   «antes de la huérfana».

**Fixture, sintética con git de verdad:** una línea por camino —heredada válida, heredada rota por
contenido, revisión que no pela (una palabra que no es revisión), fichero ausente en una revisión real,
ancla propia que gana, huérfana con ancla propia falsa, completa con el final vacío—. Así ejercita además
el adaptador real: `rev-parse` admite la salida 1 (`apps/desk/server/citas/git.ts:90-93` en `1c5ee7e`) y `cat-file`
devuelve ausente (`apps/desk/server/citas/git.ts:79-81` en `1c5ee7e`). La constante y el desglose los cuenta
`sdd-tasks` sobre la fixture escrita.

---

## 8 · D6 · Mutaciones

**Cuándo:** tras el verde del commit 3 y antes del push de 2 y 3; una a la vez, y nunca con un intento de
`sdd-apply` liquidándose en medio. **Sin rastro (regla del ciclo 2):** el ledger mide el diff del árbol, y
toda mutación se restaura byte a byte antes de la siguiente.

**Mutaciones de código:**

1. Copiar el fichero a la carpeta temporal de la sesión, **fuera del repositorio**.
2. Aplicar la mutación.
3. `npx vitest run apps/desk/server/citas` y comprobar que se pone roja **la prueba nombrada**; no basta
   con que algo se ponga rojo.
4. Restaurar desde la copia; `cmp` entre copia y fichero; `git diff --exit-code` sobre el fichero.

| Mutación | Fichero | Qué cambia | Debe ponerse rojo |
|---|---|---|---|
| DCE-M1 | `detector.ts` | Cuarta rama antes de la tercera | DCE-P3, dos extremos vacíos |
| DCE-M2 | `detector.ts` | Cuarta rama antes de la segunda; variante: antes de la primera | El aserto endurecido de DCE-P3; variante: la prueba de informe de D4 |
| DCE-M3 | `cosecha.ts` | La mención de otro fichero no reinicia el ancla | DCE-P6, otro fichero; fila de cosecha |
| DCE-M4 | `cosecha.ts` | La vigente gana a la propia | DCE-P5; fila de cosecha |
| DCE-M5 | `detector.ts` | Fallo de ancla a `noLegibles`; otra toma: a `candidatosDeBloqueo` | DCE-P7; desglose de DCE-P8 |
| DCE-M7 | `cosecha.ts` | La completa sin ancla conserva la vigente | DCE-P4 (iii), b.2 |
| DCE-M8 | `detector.ts` | Revisión inexistente después de contenido ausente; otra toma: antes de la huérfana | DCE-P7 (i), por el literal; desglose de DCE-P8 |
| DCE-M9 | `cosecha.ts` | La propia pasa a ser la vigente | Fila de cosecha |
| DCE-M10 | `cosecha.ts` | El corte 1 no reinicia el ancla | Fila de cosecha |
| DCE-M11 | `detector.ts` | La abreviada pregunta a `repo.arbol` sin caché | Contador de DCE-P4 (i) |

**DCE-M6 · el fichero vigilado (regla de mutación 2)**, sobre los ficheros **reales**, una reparación cada vez:

1. Copia de respaldo fuera del repositorio.
2. Devolver **sólo la línea reparada** a su texto de `1c5ee7e`, a mano. No con `git show` del fichero
   entero: la spec de tickets-core lleva dos reparaciones y se revertirían juntas.
3. `T=$(git stash create)` en Git Bash, o `$T = git stash create` en PowerShell: un commit con el árbol
   de trabajo que no mueve ninguna referencia ni toca el stash. Si `T` sale vacío, la mutación no se
   aplicó: parar.
4. `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha $T` (en PowerShell, `npx --no tsx`). Hace
   falta el commit porque `--sha` lee el árbol commiteado, nunca el de trabajo:
   `apps/desk/server/citas/cli.ts:105-113` en `1c5ee7e`, `apps/desk/server/citas/git.ts:59-61` en `1c5ee7e`,
   `apps/desk/server/citas/git.ts:70-73` en `1c5ee7e` y `apps/desk/server/citas/git.ts:91` en `1c5ee7e`.
5. Restaurar; `cmp`; `git diff --exit-code` sobre el fichero. El objeto de `T` queda suelto, sin
   referencia: no toca el árbol ni el ledger.

Control previo: `--sha HEAD` tras el commit 3 da **0 bloqueantes**.

| # | Texto viejo devuelto | Esperado |
|---|---|---|
| 1 | Comentario de la línea 197 de apps/desk/server/admin.test.ts | **Rojo:** salida 1 y, en «Bloqueantes», la línea de ese documento y esa línea, con su cita cruda y un motivo que empieza por «ambigua, rota en sus» |
| 2 | Línea 189 de docs/sdd/Paquete_de_Despliegue_2026-09-10.md | **Rojo**, misma forma |
| 3 | Línea 544 de openspec/specs/tickets-core/spec.md | **Rojo**, misma forma |
| 4 | Línea 328 de openspec/specs/tickets-core/spec.md | **Verde, medido por el orquestador** |
| 5 | Comentario de la línea 20 de apps/desk/server/routes/directory.ts | **Verde, medido por el orquestador** |

- **Los tres rojos son ambiguas rotas en todas sus candidatas** (Engram 597, medido por el orquestador).
  El literal completo —número de candidatas y línea de la primera— lo registra `sdd-apply` al ejecutarlo.
  Hipótesis del número de candidatas: 2, 3 y 3, por los ficheros homónimos del árbol de trabajo.
- **Las nº 4 y 5 no se prometen rojas, porque no lo son.** La nº 4 cita la ruta completa y única de
  routes/directory.ts del 61 al 66, y sus dos extremos tienen contenido
  (`apps/desk/server/routes/directory.ts:61-66` en `1c5ee7e`): el error es de referente, no de sintaxis. La nº 5
  es una abreviada huérfana, y una huérfana no se comprueba. Su vigilancia sigue siendo lectura humana
  (H2): el verde se registra como medición, no como fallo de la prueba.

---

## 9 · D7 · Huecos de RQ-CV-17 que esta tanda NO cierra

| # | Hueco | Efecto | Por qué no se cierra |
|---|---|---|---|
| H1 | `REVISION_RE` acepta cualquier palabra como ancla (`apps/desk/server/citas/cosecha.ts:60` en `1c5ee7e`) | En una abreviada, una palabra que no es revisión pasa a fallo de ancla informativo (la de la línea 167 de docs/sdd/Puntos_para_Gerencia_2026-09-11.md); en una completa ya bloqueaba. Una palabra que sí es referencia, como un nombre de rama, se lee «válida por casualidad» | Fuera de alcance por (d); hallazgo para `hallazgos_que_siguen_vivos` |
| H2 | El detector no comprueba que la línea diga lo que la frase afirma (`apps/desk/server/citas/informe.ts:50` en `1c5ee7e`), ni comprueba huérfanas | Las reparaciones nº 4 y 5 son invisibles con la tanda hecha: DCE-M6 sale verde en ellas | Frontera declarada del detector |
| H3 | El ancla, y con ella la herencia, sólo se lee en la misma línea física (`apps/desk/server/citas/cosecha.ts:59` en `1c5ee7e`; D2 del diseño archivado de `hook-citas-pre-push`) | Una completa anclada en la línea anterior no ancla las abreviadas de la siguiente | (b) lo fija en la misma línea |
| H4 | «Mismo fichero» se decide por nombre cosechado | Hoy equivale a ruta resuelta; dejaría de hacerlo si la cosecha resolviera por sufijo | Sin efecto hoy (D4) |
| H5 | Una completa anclada cuyo nombre ya no está en el índice local corta la atribución (corte 1) | Sus abreviadas quedan huérfanas justo donde el ancla más protegería: un fichero renombrado o borrado después | Resolver en el índice de la revisión metería git en la cosecha, que es pura (`apps/desk/server/citas/cosecha.ts:170-171` en `1c5ee7e`) |
| H6 | El motivo de una abreviada rota por contenido no nombra el extremo que falla | RQ-CV-08 puede leerse como si lo exigiera | Nadie lo decidió (D3) |
| H7 | La huérfana con ancla propia no se lee, y el ancla propia no se propaga | Una segunda abreviada que el autor quería en la misma revisión se lee en la vigente o en local | Decisión de D4 |

---

## 10 · D8 · Orden de commits y cuándo corre cada comprobación

| # | Commit | Push | Comprobaciones |
|---|---|---|---|
| 0 | Planificación: propuesta, delta, este diseño, `tasks.md` | Propio, antes de que el intento de `sdd-apply` adquiera | Hook, con el detector de hoy |
| 1 | Las cinco reparaciones y la anotación del triaje | Propio | Antes: `--sha HEAD` de partida, cifras registradas. Después: `--sha HEAD` con el detector de hoy (0 bloqueantes), `npm test` y hook. CI verde: sólo cambian comentarios y documentos |
| 2 | Pruebas en rojo (§11) | **Con el 3** | `npm test` con el rojo literal de cada prueba registrado; `npm run typecheck` verde, porque las pruebas sólo usan API que ya existe, campo `ancla` incluido; `npm run lint` |
| 3 | Implementación | **Con el 2** | `npm test`, `npm run typecheck` y `npm run lint -- --max-warnings 158` como el CI (`.github/workflows/ci.yml:41` en `1c5ee7e`); `--sha HEAD`: 0 bloqueantes y habilitar_servicio en abreviadas rotas con el literal de revisión inexistente; mutaciones de código; DCE-M6; después, el push |
| 4 | Cierre: barrido de la regla de mutación 4, `CLAUDE.md`, `openspec/config.yaml` | Propio | `--sha HEAD` y hook |

- **Por qué 2 y 3 juntos:** el CI corre en push a `main` (`.github/workflows/ci.yml:1-6` en `1c5ee7e`) y, en este
  repositorio, cada push ha dado un solo run sobre el sha de cabeza (medido por el orquestador). Empujados
  juntos, el CI nunca ve el 2 aislado.
- **Por qué el hook no ve el rojo del 2, y por qué el 1 va antes:** el hook sólo corre el detector de
  citas, con el `cli.ts` del árbol de trabajo (`.githooks/pre-push:4` en `1c5ee7e`), es decir, con el
  detector del 3. Si el 1 no ha entrado antes, ese push lo bloquean las nº 1-3 (R-1 de la propuesta).
- **Si una mutación sale verde,** la prueba se endurece en un commit nuevo antes del push; no se
  reescriben el 2 ni el 3.
- **El barrido de la regla de mutación 4 va en el 4:** `detector.ts` y `cosecha.ts` insertan líneas, y
  `CLAUDE.md` las cita sin ancla en el párrafo de IV-10 (en `openspec/config.yaml`, hipótesis). Las citas
  de los artefactos de esta tanda van ancladas y no se desfasan.

---

## 11 · Dónde vive cada prueba

| Prueba | Fichero y `describe` | Fixture (en memoria, salvo DCE-P8) | Antes de la implementación |
|---|---|---|---|
| DCE-P1 | `detector.test.ts`, «detectar · RQ-CV-08 comprobación mecánica básica» | Rango del 1 al 3 con la 3 vacía; motivo `extremo final en línea vacía (línea 3 de citado.md)` | Rojo: `bloquea` es falso |
| DCE-P2 | `detector.test.ts`, «detectar · RQ-CV-03: una ambigua bloquea sólo si está rota en TODAS sus candidatas (M15)» | Rango del 1 al 3; a/comun.md con la 3 vacía y b/comun.md de una línea → bloquea con `ambigua, rota en sus 2 candidatas (línea 3 de comun.md)`; con b/comun.md válida → `saltadas.ambiguas` 1 | Rojo la primera; la segunda nace verde |
| DCE-P3 | `detector.test.ts`, el `describe` de DCE-P1 | Dos extremos vacíos → `extremo inicial en línea vacía (línea 1 de citado.md)`; y endurecer a igualdad `apps/desk/server/citas/detector.test.ts:38` en `1c5ee7e` y `apps/desk/server/citas/detector.test.ts:50` en `1c5ee7e` | Nace verde: DCE-M1, DCE-M2 |
| DCE-P4 | `detector.test.ts`, `describe` nuevo «detectar · RQ-CV-06: la abreviada se lee en su ancla, propia o heredada» | (i) completa anclada a rev1 y abreviada a la 3, vacía en local y con contenido en rev1 → comprobada, con `arbol()` llamado una vez; (ii) al revés → rota con `abreviada rota (atribuida a citado.md en rev1)`; (iii) b.2, una completa sin ancla del mismo fichero en medio → rota con `abreviada rota (atribuida a citado.md)` | (i) y (ii) rojos; el contador y (iii) nacen verdes: DCE-M11, DCE-M7 |
| DCE-P5 | el `describe` de DCE-P4 | Local y rev1 con la 3 vacía, rev2 con contenido; abreviada anclada a rev2 → comprobada | Rojo |
| DCE-P6 | el `describe` de DCE-P4 | Otro fichero: mención de otro.md, ausente en rev1 → comprobada en local. Mismo fichero: mención de citado.md, con la 3 vacía en local y con contenido en rev1 → comprobada | Otro: nace verde (DCE-M3). Mismo: rojo |
| DCE-P7 | el `describe` de DCE-P4 | (i) ancla propia «inventada» → `abreviada rota (atribuida a citado.md en inventada): revisión inexistente`; (ii) rev1 sin citado.md → `abreviada rota (atribuida a citado.md en rev1): fichero inexistente en la revisión`; en las dos, `bloquea` falso y `saltadas.noLegibles` 0 | Rojo: `expected [] to have a length of 1 but got 0` |
| Filas de cosecha | `cosecha.test.ts`, `describe` nuevo «cosechar · herencia del ancla en la misma línea física (RQ-CV-06, b)» | Tabla de D4 sobre el campo `ancla`: completa con ancla, b.2, corte 1, mención de otro, mención del mismo, la propia gana, la propia no se propaga | Rojo por las filas que heredan; discrimina DCE-M3, M4, M7, M9 y M10 |
| DCE-P8 | `hook.test.ts`, `it` nuevo en el `describe` del invariante (`apps/desk/server/citas/hook.test.ts:164-209` en `1c5ee7e`) | D5 | Hipótesis: rojo por el desglose, porque hoy la heredada válida sale rota |

---

## 12 · Ficheros y talla (hipótesis)

| Fichero | Cambio | Líneas |
|---|---|---|
| `apps/desk/server/citas/detector.ts` | Cuarta rama; clave con `arbolDeLectura`; ramas 2 y 3 de D2; ayudante del motivo | 15-25 |
| `apps/desk/server/citas/cosecha.ts` | `anclaVigente`, sus reinicios, la comparación de mismo fichero, la precedencia y el comentario del campo | 10-18 |
| `apps/desk/server/citas/detector.test.ts` | DCE-P1 a DCE-P7 y dos asertos endurecidos | 120-170 |
| `apps/desk/server/citas/cosecha.test.ts` | Filas de cosecha | 25-35 |
| `apps/desk/server/citas/hook.test.ts` | DCE-P8 | 35-50 |
| `apps/desk/server/admin.test.ts`, `apps/desk/server/routes/directory.ts`, `docs/sdd/Paquete_de_Despliegue_2026-09-10.md`, `openspec/specs/tickets-core/spec.md` | Las cinco reparaciones, una línea cada una | 10 |
| `docs/sdd/Triaje_Linea_Base_Citas_2026-09-15.md` | Anotación de la nº 4 | 2-4 |
| `apply-progress.md` | Nuevo, sin trackear (ceguera 1 del ledger) | 60-150 |
| `informe.ts`, `git.ts`, `cli.ts`, `resolucion.ts`, `reposDePrueba.ts` | Sin cambios | 0 |

**Bloque (ii) de la propuesta: ~277-462 líneas**, frente a 175-435; sube por las filas de cosecha y el
desglose de DCE-P8. Por debajo de 800; con `ask-on-risk`, sólo se señala. La medida real es
`git diff --shortstat` contra el commit de partida del intento más `wc -l` de lo nuevo sin trackear
(regla del ciclo 2).

---

## 13 · Divergencias con el delta y la propuesta que `sdd-tasks` tiene que llevar

| # | Dónde | Qué fija el diseño | Por qué |
|---|---|---|---|
| 1 | Delta, escenario de DCE-P8, «nace verde» | DCE-P8 afirma el desglose exacto y **nace rojo**; la suma sola nace verde y no discrimina DCE-M5 | D5 |
| 2 | Delta, RQ-CV-08, «motivo exacto» | En una completa, el motivo exacto es la cadena entera, con el sufijo de línea y fichero | D3 |
| 3 | Delta, RQ-CV-06, «completa válida» | «Válida» es que el nombre resuelva en el índice local, no que la cita esté comprobada | D4 |
| 4 | Delta, prefijo de mutaciones | Se añaden DCE-M8, DCE-M9, DCE-M10 y DCE-M11 | Regla de mutación 1 sobre las posiciones y decisiones nuevas |
| 5 | Propuesta §6, DCE-P6 otro fichero (hipótesis) | Confirmado leyendo: nace verde, hoy la abreviada se lee en local (`apps/desk/server/citas/detector.ts:195` en `1c5ee7e`) | D2 |
| 6 | Propuesta §8 | El bloque (ii) sube a ~277-462 | §12 |
| 7 | Propuesta, criterio 9 | DCE-M6 corre sobre las cinco: rojo en las nº 1-3, verde medido en las nº 4-5 | D6 |

## 14 · Preguntas abiertas

- [ ] Ninguna bloquea el diseño. El literal completo de los tres rojos de DCE-M6 lo registra `sdd-apply`.
