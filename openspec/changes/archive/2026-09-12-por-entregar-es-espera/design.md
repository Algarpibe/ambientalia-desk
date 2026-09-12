# Diseño técnico: `Por Entregar` es espera, y el predicado que CLASIFICA se escribe una sola vez

**Base `7a24021` (rama `main`). Entrada: `openspec/changes/por-entregar-es-espera/proposal.md`, APROBADA.**

Este diseño **no reabre** la propuesta ni las cinco preguntas del §13 (respondidas por Gerencia el
2026-09-12). Tampoco toca `vitest.config.ts` (F0-00), ni los dos usos de color (Q1), ni el punto
abierto nº 52, ni la titularidad OV↔equipo.

> **Regla de método.** Toda cita de este documento lleva ruta y línea y se leyó **de disco en esta
> sesión** sobre `7a24021`. Lo derivado por construcción y no ejecutado va marcado **predicción**.
> Lo no verificable va marcado **hipótesis**.

> **Extensión.** `openspec/config.yaml:957-959` fija `rules.design` para este repositorio —«documentar
> decisiones de arquitectura con su razón»— y no impone tope de palabras. Se sigue esa regla; el tope
> genérico de 800 palabras de la skill no cabe con ocho decisiones, dos tablas y un barrido de dos
> detectores, y documentar media decisión es no documentarla.

---

## 0 · Hallazgo de diseño: hay un QUINTO rojo, y la propuesta no lo lista

**Es lo más importante de este documento, y por eso va primero.** El §4 de la propuesta enumera cuatro
rojos y afirma que los que aparecen solos son tres (`estados.test.ts:25`, `:44`, `:85`). **Son cuatro.**

`estados.test.ts:157-163` cruza las dos propiedades derivables —estar en espera y tener salida única—
y fija el resultado:

```ts
157  it('la derivación da seis, y las dos que sobran son Liberación Comercial y Remisión creada: …', () => {
158    const derivadaMal = ESTADOS_EN_ESPERA.filter((e) => conUnaSolaSalida().includes(e))
159    expect(derivadaMal).toHaveLength(6)
160    expect(derivadaMal.filter((e) => !(ESTADOS_SIN_SALIDA as string[]).includes(e))).toEqual([
161      'Liberación Comercial',
162      STATUS_REMISION_CREADA,
163    ])
```

`conUnaSolaSalida()` (`estados.test.ts:173-179`) cuenta cuántas veces aparece cada estado como `from`
en `TRANSITIONS` y devuelve los que aparecen **una sola vez**. Verificado de disco en `transitions.ts`:

| Estado | Aparece como `from` en | Veces |
|---|---|---|
| `'Por Entregar'` | `entrega_al_cliente` (`transitions.ts:250`) | **1** |
| `'Por Entregar / Sin facturar'` | `entrega_sin_factura` (`transitions.ts:248`) | **1** |

Los dos entran hoy en `conUnaSolaSalida()`, y hoy no molestan porque no están en
`ESTADOS_EN_ESPERA`. **Al reclasificarlos, entran.** Por tanto `:159` pasa de **6 a 8** y `:160-163`
pasa de dos entradas a **cuatro**. Los dos asertos se ponen **ROJOS**, y el nombre de `:157` y el
comentario de `:145-155` pasan a afirmar algo falso.

**Consecuencias de diseño, y ninguna es cosmética:**

1. **Es el rojo (a4).** Se suma al §4 de la propuesta. Es además el **mejor** de los que aparecen
   solos: los otros tres dicen que la lista cambió; éste dice que cambió **una propiedad derivada del
   grafo**, que es exactamente lo que la prueba vigila.
2. **`ESTADOS_SIN_SALIDA` NO se toca.** Es lista declarada, criterio de M1.3.4 cerrado por Gerencia
   (`estados.ts:143`), y la propuesta lo deja fuera («no entra: reclasificar ningún otro estado»).
   `estados.test.ts:123` sigue fijando los cuatro y **sigue verde**.
3. **Pero queda una pregunta de negocio abierta, y se anota en vez de resolverla.** El discriminador
   de `sin_salida` (`estados.ts:125-127`) dice literalmente que el suceso ocurre fuera de la aplicación
   —«**una entrega física**, un retorno de laboratorio, un alta en otro sistema»—, y la única salida de
   `Por Entregar` depende de que el cliente venga a recoger el equipo. Con el criterio en la mano, los
   dos estados **parecen** candidatos a `sin_salida`. **Esta tanda no lo decide**: M1.3.4 es lista
   cerrada por Gerencia y cambiarla de oficio sería exactamente el molde que este repositorio castiga.
   Va como **hallazgo 3, sin destino asignado** (§9).
4. **La prosa que se reescribe tiene que decir la verdad nueva, no ajustar un número.** `:145-155`
   explica por qué la derivación no sirve; tras la tanda sirve **aún menos** —da ocho y sobran
   cuatro—, lo que refuerza el argumento original. El texto se amplía, no se recorta.

**No bloquea el diseño ni reabre la propuesta:** cae dentro del alcance aprobado (es consecuencia
directa de la reclasificación, en un fichero que la tanda ya abre) y no toca ninguna de las Q1-Q5.
Sube la estimación de `estados.test.ts` de 20-30 a **30-42** líneas.

---

## 1 · D1 · Dónde vive el predicado, cómo se llama y qué recibe

**Decisión.** Módulo nuevo `apps/desk/src/lib/enEspera.ts` con prueba `apps/desk/src/lib/enEspera.test.ts`,
que exporta:

```ts
export function esEstadoEnEspera(status?: string | null): boolean
```

### 1.1 · La firma recibe el ESTADO, no el ticket

Los dos consumidores traen tipos distintos, verificados de disco:

| Consumidor | Tipo | Campo | Lo que hace hoy |
|---|---|---|---|
| `boardView.ts:39` | `Ticket` (`types.ts:4-38`) | `status: string` (`types.ts:9`) | `(ESTADOS_EN_ESPERA as readonly string[]).includes(t.status ?? '')` |
| `ClienteDetalle.tsx:18` | `TicketLite` (`types.ts:575`) | `status: string` | `/espera/i.test(t.status)` |

| Opción | Coste | Decisión |
|---|---|---|
| **Recibe `status?: string \| null`** | Ninguno: los dos llaman `esEstadoEnEspera(t.status)` | **ELEGIDA** |
| Recibe el ticket con un tipo común | No existe tal tipo: `Ticket` y `TicketLite` son interfaces separadas (`types.ts:4`, `:575`) y unirlas es alcance ajeno | Rechazada |
| Recibe el ticket con genérico `<T extends { status: string }>` | Funciona, pero acopla el módulo a una forma de objeto para leer **un** campo, y obliga a construir un objeto a quien sólo tenga la cadena | Rechazada |

**Razón.** El predicado decide sobre un **estado**, no sobre un ticket: el ticket es sólo el sobre en
que llega. Tomar la cadena es la única firma que no obliga a elegir entre `Ticket` y `TicketLite` ni a
inventar un tercer tipo, y hace el contrato legible en el punto de llamada —`esEstadoEnEspera(t.status)`
dice qué se está mirando—. El `?? ''` defensivo que hoy vive en `boardView.ts:39` se absorbe dentro del
módulo, que es donde debe estar.

### 1.2 · El nombre

- **`esEstadoEnEspera`** nombra el ARGUMENTO (un estado), que es justo lo que la firma recibe, y usa el
  prefijo `es…` que el cliente ya emplea para predicados booleanos: `esAbierto`, `esEspera`,
  `esAtrasado` (`ClienteDetalle.tsx:17-19`). Verificado.
- **`enEspera.ts`** como fichero sigue el vocabulario del dominio —`EnEspera` (`estados.ts:40`),
  `ESTADOS_EN_ESPERA` (`:114`), `enEsperaDe` (`:163`)—.
- El nombre **no** colisiona con `enEsperaDe`: uno devuelve la CLASE y el otro un booleano, y llamarlos
  distinto es parte de la mitigación de D2.

### 1.3 · Un estado DESCONOCIDO devuelve `false`, y se dice por qué

**Es una decisión, no una omisión.** `estados.ts:156-162` razona que `enEsperaDe` devuelve `undefined`
y no `'ninguna'` a propósito, porque confundir «no está en el registro» con «no está en espera»
esconde el fallo justo donde el invariante 1 quiere que se vea.

| Opción | Decisión |
|---|---|
| Devolver `false` para desconocido | **ELEGIDA.** Es exactamente lo que `boardView.ts:39` hace hoy: la extracción **no cambia conducta** |
| Devolver `undefined` o lanzar | Rechazada: cambia la conducta del tablero en una tanda que se declara refactor, y obliga a los dos consumidores a decidir qué hacer con el tercer valor |

**Razón, y el límite de la razón.** El invariante 1 (`invariantesGrafo.test.ts:41`, conjuntos
declarados == derivados) garantiza que no hay estados del grafo sin clasificar; un `status` fuera del
registro es un fallo de datos venido de Zoho, no un estado nuevo. Y la vista no debe **esconderlo**:
con `false` cae en `abiertos` (`boardView.ts:47`), que es visible. El módulo es una **vista**, no el
detector del fallo de datos — el detector es el invariante 1, y sigue donde estaba.

### 1.4 · Por qué en `apps/desk/src/lib` y no en `packages/shared`

| Opción | Decisión |
|---|---|
| `apps/desk/src/lib/enEspera.ts` | **ELEGIDA** (y es lo que la propuesta aprobó, §2.2) |
| Añadirlo a `packages/shared/src/estados.ts`, junto al registro | Rechazada |

**Razón, con la medición.** Verificado en esta sesión con `grep -rn "ESTADOS_EN_ESPERA"` sobre el
repositorio: fuera de `packages/shared` los únicos consumos de ejecución son `boardView.ts:2` (import)
y `:39` (uso); todo lo demás son pruebas (`estados.test.ts:3`, `:85`, `:158`; `sla.test.ts:3`, `:52`),
la definición (`estados.ts:114`) o prosa. **No hay ningún consumidor en el servidor**, así que
exportarlo desde el dominio sería ampliar la superficie pública del paquete para un solo cliente.
Además `estados.ts` expone hoy el **dato** (`ESTADOS_EN_ESPERA`) y **la clase** (`enEsperaDe`); meter un
tercer accesorio booleano invita a la pregunta «¿cuál de los tres uso?», que es la que D2 quiere cerrar.

**Y el límite, declarado:** si algún día el servidor necesita clasificar esperas, el módulo **se mueve a
`packages/shared`** y no se copia. Queda escrito aquí para que ese día no nazca una cuarta
implementación.

---

## 2 · D2 · Se hereda la decisión de F1B-08; no se re-deduce

`openspec/specs/vistas-tablero/spec.md:119-125` ya lo decidió al archivar F1B-08, y este diseño
**lo hereda y lo cita**:

> `enEsperaDe` devuelve la CLASE (`externa | interna | ninguna | sin_clasificar`), no un booleano, y
> consumirla obligaría al cliente a reescribir el criterio «externa o interna» que `estados.ts` ya
> posee — «el mismo defecto IV-1 movido un metro».

El criterio «externa o interna» vive en `estados.ts:114-117` y **se queda ahí**. El módulo nuevo envuelve
`ESTADOS_EN_ESPERA.includes(...)`, que es el resultado de ese criterio, no el criterio. **No se escribe
lógica nueva**: es la misma expresión de `boardView.ts:39` con otro domicilio.

---

## 3 · D3 · El orden del registro manda sobre la prueba, nunca al revés

### 3.1 · Las dos entradas se MUEVEN, no se reetiquetan

`estados.ts:56-57` declara por escrito que la lista «va agrupada por clase y no por orden alfabético
porque la lista se lee para comprobar la clasificación». Dejar dos entradas `'externa'` dentro del
bloque rotulado `// ── ninguna (11)` (`estados.ts:80`) contradiría esa convención en el mismo fichero.
Se mueven de `:87-88` al bloque `externa` (`:60-65`), y los rótulos se corrigen: `:60` `(3)` → `(5)`,
`:80` `(11)` → `(9)`. `:67` `interna (6)` **no cambia**.

### 3.2 · La consecuencia, dicha antes de escribir ninguna prueba

`ESTADOS` es `Object.keys(CLASIFICACION_EN_ESPERA)` (`estados.ts:106`), `ESTADOS_EN_ESPERA` es
`ESTADOS.filter(...)` (`:114`) y el helper `estadosCon` de la prueba es también `ESTADOS.filter(...)`
(`estados.test.ts:182-184`). **Los tres heredan el orden físico del registro.**

**Predicción derivada** (por construcción, colocando las dos al final del bloque `externa`; se
**confirma corriendo**, no se da por buena):

```
ESTADOS_EN_ESPERA tras la tanda (11)
 1 En Espera de Repuestos          ← existentes
 2 Servicio externo
 3 Notificación cliente
 4 Por Entregar                    ← NUEVOS, EN MEDIO, no al final
 5 Por Entregar / Sin facturar
 6 Notificación a Compras          ← el bloque interna, intacto
 7 Notificación Comercial
 8 En espera de SKU inventario
 9 Solicitado
10 Liberación Comercial
11 Remisión creada
```

**Ahí está la trampa R-1 en concreto:** quien escriba el `toEqual` de `estados.test.ts:85` de memoria
los añadirá **al final de los nueve**, y el rojo que salga parecerá un fallo de la prueba.

### 3.3 · La regla que hay que prohibir por escrito

> **El array esperado se fija LEYENDO la salida del filtro. Reordenar el registro para que cuadre un
> `toEqual` escrito de memoria está PROHIBIDO.**

El orden del registro lo decide **una sola cosa**: la convención de agrupación por clase de
`estados.ts:56-57`. La prueba lo **constata**; no lo negocia. Invertir esa dirección convierte el
registro —que es la fuente— en el ajustable, y la prueba —que es el testigo— en la autoridad.
La mutación **M2** existe para detectar esa inversión.

### 3.4 · Lo que el reordenamiento NO rompe (verificado, acota el radio)

`ESTADOS` cambia de orden, y cinco pruebas lo consumen. Comprobado de disco que **ninguna** es sensible
al orden:

| Sitio | Forma | Sensible al orden |
|---|---|---|
| `invariantesGrafo.test.ts:41` | `[...derivados].sort()` vs `[...ESTADOS].sort()` | **No** — ordena los dos lados |
| `invariantesGrafo.test.ts:52` | `toHaveLength(21)` | **No** |
| `invariantesGrafo.test.ts:64-65` | `ESTADOS.filter(...)` → `['Finalizado']` | **No** — un solo elemento |
| `invariantesGrafo.test.ts:77` | `new Set<string>(ESTADOS)` | **No** |
| `sla.test.ts:52-53` | `filter(...)` → `toEqual([])` | **No** — lista vacía |

---

## 4 · D4 · La divergencia deliberada de `ClienteDetalle.tsx`, y dónde va el comentario

Tras la tanda, `:18` clasifica con el registro (once estados) y `:22` pinta con `/espera/i` (dos).
Un `Por Entregar` **se contará bajo «espera»** (`:96`, `:98`) **y se pintará azul** (`:23`, el respaldo
de `badgeClass`). Hoy las dos líneas son la misma expresión, así que la divergencia es **nueva**.
Riesgo R-3b, probabilidad **alta**.

### 4.1 · DOS anclas, no una

**Decisión: el comentario va en los dos extremos de la divergencia.**

| Ancla | Dónde | Qué lleva |
|---|---|---|
| **A — el bloque** | Justo **encima de `:18`** (`const esEspera = …`), la línea que esta tanda cambia y que el revisor ve en el diff | El razonamiento completo (los cuatro puntos de §4.2) |
| **B — el marcador** | En la línea del `/espera/i` de `badgeClass` (`:22`), una línea | «Divergencia deliberada: ver la nota de `esEspera`, arriba. NO unificar.» |

**Razón de las dos.** El lector que «arregla» la divergencia está leyendo `badgeClass`, y `badgeClass`
es una función cerrada: desde dentro de `:20-24` no se ve un comentario puesto en `:18`. Una mitigación
que sólo es visible desde el extremo que no falla no es una mitigación. El coste son **dos líneas**.

### 4.2 · Qué tiene que decir el ancla A (cuatro cosas, ninguna opcional)

1. **Que es deliberado**, con esas palabras: `:18` y `:22` **divergen a propósito** desde esta tanda.
2. **Por qué**: color y clasificación son nociones distintas. `Por Entregar` **no es un atasco** — el
   equipo está listo y lo que falta es que el cliente venga —, y el tablero ya lo pinta **azul** desde
   el mapa explícito de `TicketCard.tsx:21`. Unificarlas pintaría de ámbar un estado que el tablero
   pinta de azul.
3. **Con qué autoridad**: decisión de Gerencia Q1, 2026-09-12 (`proposal.md` §13).
4. **Cuál es el arreglo de verdad, y que no es éste**: que el color salga de una sola fuente —el mapa
   por estado de `TicketCard.tsx:14`— y no de un booleano, que no sabe decir «azul para listo, ámbar
   para atascado». **Es otra tanda** (§8, hallazgo 2 de la propuesta). Y la frase operativa:
   **no unificar estas dos líneas**.

### 4.3 · Restricción de higiene del detector (obliga a M6)

> **Ningún comentario de esta tanda puede reproducir la forma de llamada `/espera/i.test(`.**

No es estilo: el detector de M6 cuenta llamadas, y un comentario que reprodujera la llamada se contaría
como superviviente. Nombrar el patrón entre comillas —`/espera/i`— es correcto y no contamina. Ver §7.2.

---

## 5 · D5 · El orden de escritura bajo `strict_tdd`

Cuatro fases. La regla que las ordena: **primero el rojo que demuestra la DECISIÓN, luego el refactor a
conducta constante, luego el cambio de lista, y la prosa al final.**

### Fase 0 — el rojo que decide (ANTES de tocar `estados.ts`)

- **0.1** En `apps/desk/src/lib/boardView.test.ts`, un `describe` **nuevo** que reutiliza el molde
  `casoEnEspera(status)` de `:32-38` con los dos estados. Correr → **ROJO**: hoy los dos caen en
  `'abiertos'` (`boardView.ts:47`) y no en `'espera'` (`:48`). Se anota el texto del fallo.

  **Por qué un `describe` nuevo y no añadirlos al de `:31-45`:** ése se titula «los seis estados que la
  regex vieja no reconocía» y documenta F1B-08. Los dos de ahora **no** vienen de aquella regex: meterlos
  ahí volvería falso un título verdadero. El molde se reutiliza; el rótulo no.

Éste es el rojo **(b)**, el único que demuestra lo que Gerencia pidió: que el tablero **enseñe**
distinto. Los rojos (a) sólo dicen que la lista cambió.

### Fase 1 — la extracción, a REGISTRO CONSTANTE (sigue en nueve)

- **1.1** `enEspera.test.ts` con el contrato del módulo. Correr → **ROJO** (el módulo no existe).
- **1.2** Crear `enEspera.ts`. Correr → **VERDE**. El rojo de la Fase 0 **sigue rojo**, y eso es
  correcto: extraer no reclasifica.
- **1.3** `boardView.ts:39` consume el módulo y pierde el cast en línea; `:2` cambia de import. Correr →
  toda la suite **igual de verde que antes**. Es la prueba de que la Fase 1 es refactor puro.
- **1.4** `ClienteDetalle.tsx:18` consume el módulo, más las dos anclas de D4.

**Por qué la extracción va ANTES de la reclasificación, y separada.** Si las dos cayeran juntas y algo
se rompiera, el diff no podría decir cuál de las dos lo rompió. Separadas, la Fase 1 tiene una
propiedad comprobable —**ningún resultado de prueba cambia**— y la Fase 2 tiene otra —**cambian
exactamente los cinco asertos previstos**—.

**El contrato que `enEspera.test.ts` fija, y que es INVARIANTE al salto 9→11:**

| # | Qué afirma | Por qué así |
|---|---|---|
| 1 | Todo estado de `ESTADOS_EN_ESPERA` da `true` | Acuerdo con el registro, sin enumerar su contenido |
| 2 | Todo estado de `ESTADOS` que no esté en `ESTADOS_EN_ESPERA` da `false` | La otra mitad del acuerdo |
| 3 | `undefined`, `null` y `''` dan `false` | Fija la firma de D1.1 |
| 4 | Un estado inexistente da `false` | Fija D1.3, la decisión del desconocido |

**Escrito así, este fichero NO se toca en la Fase 2**, porque no enumera los nueve ni los once: los
**deriva** del registro. La enumeración vive en `estados.test.ts`, que es su sitio, y no se mantiene
dos veces.

**Y no es tautológico, que es la objeción obvia:** con la implementación identidad los asertos 1 y 2
parecen repetir el módulo. Su trabajo es matar la mutación **M4** — sustituir el registro por
`/espera|hold/i` dentro del módulo pone rojo el aserto 1 en `Servicio externo`, `Notificación a Compras`,
`Notificación Comercial`, `Solicitado`, `Liberación Comercial` y `Remisión creada`.

### Fase 2 — la reclasificación (nueve → once)

- **2.1** Mover `estados.ts:87-88` al bloque `externa`; rótulos `:60` y `:80`. Correr → **rojos
  esperados**: `estados.test.ts:25`, `:44`, `:85`, **`:159` y `:160-163`** (el hallazgo del §0), y la
  Fase 0 pasa a **VERDE**.
- **2.2** Fijar los arrays esperados **leyendo la salida** (regla de §3.3). Corregir los nombres que
  llevan la cuenta dentro: `:25` «estos tres» → cinco, `:44` «estos once» → nueve, `:84` «las nueve» →
  once; la prosa de `:22` y `:78`; y `:71`, la corrección de paso (3/5/12/1 → **5/6/9/1 = 21**).
- **2.3** Reescribir `:145-155` y `:157`-`:163` con la derivación que ahora da **ocho** y las **cuatro**
  que sobran, y dejar anotado el hallazgo 3 (§9).
- **2.4** Añadir a `enEspera.test.ts` **un** caso anclado —`esEstadoEnEspera('Por Entregar') === true`—
  como testigo del cambio desde el lado del cliente. Va aquí y no en la Fase 1 porque **antes sería
  rojo**.

> ⚠️ **Los nombres de `:25`, `:44` y `:84` llevan la cuenta dentro del título y NINGUNO se pone rojo
> por quedarse caduco.** Es la misma enfermedad que la propuesta arregla de paso en `:71`. Si la Fase
> 2.2 arregla sólo los arrays, la tanda deja **tres nombres nuevos mintiendo** y repite el defecto que
> vino a corregir.

### Fase 3 — barrido y registros (prosa, sin ejecución)

`estados.ts:21`, `:28`, `:109`; `sla.test.ts:44`, `:46`, `:50`; IV-9 reducida en `CLAUDE.md` y
`openspec/config.yaml`. Detalle en §7.

### Fase 4 — las seis mutaciones, ejecutadas y revertidas (§8)

### D5(d) · El consumidor que NO admite rojo previo

`ClienteDetalle.tsx` es `.tsx`: `vitest.config.ts:16` fija `environment: 'node'` y `:17-20` incluye
sólo `apps/**/*.test.ts` y `packages/**/*.test.ts`; `:57` lo excluye además de cobertura. Queda fuera
de la red por decisión de Gerencia (F0-00). **No se toca `vitest.config.ts` y no se finge una prueba.**

Se cubre por tres vías, y se declara que las tres juntas **no** equivalen a una prueba:

| Vía | Qué cubre | Qué NO cubre |
|---|---|---|
| `enEspera.test.ts` (Fase 1.1) | Que el **predicado** clasifica por el registro | Que `:18` lo **llame** |
| `tsc` (`npm run typecheck`) | Que la llamada existe y tipa: si `:18` no importa el módulo, el símbolo `esEstadoEnEspera` no está | Que el resultado se consuma en `:96`/`:98` |
| Tarea de **persona** (§12 de la propuesta) | Que la ficha de cliente cuente un `Por Entregar` bajo «espera», en el despliegue | — |

La mutación **M4** está diseñada para **medir** este hueco, no para taparlo.

---

## 6 · D6 · La casilla de la regla 13, marcada por escrito y línea a línea

> Regla de mutación 3: «la regla 13 recordada de memoria es exactamente la que se salta». Enumeración
> hecha **releyendo cada línea en esta sesión**, no copiando la tabla de la propuesta.

| # | Decisión que toma el cliente | Línea del servidor que la impone | Veredicto |
|---|---|---|---|
| 1 | Qué tickets caen en «espera» y cuáles en «abiertos» (`boardView.ts:47-48`) | **Ninguna, y no hace falta** | **Consumo de dominio, regla 13 punto 1.** Verificado: `boardView.ts:33-36` declara por escrito que es un filtro de VISTA, que el servidor devuelve todos los tickets a todo el mundo y que así debe seguir, citando `docs/modelo-autorizacion.md`. **No es guarda**: no restringe visibilidad, la ordena |
| 2 | Qué tickets del cliente caen en la sub-vista «espera» (`ClienteDetalle.tsx:18`, consumido en `:96` y `:98`) | **Ninguna** | **Mismo caso que 1.** Verificado: `:89` trae el detalle entero con `fetchContactDetail`/`fetchAccountDetail`, `:94` toma `data.tickets`, `:96` filtra en memoria y `:98` elige la sub-vista según `sub` (`:91`). Filtra **lo que el servidor ya entregó**: es presentación, no restricción |
| 3 | Qué estado es «de espera» (el módulo nuevo) | **Ninguna** | **El cliente no decide: importa.** El criterio vive en `estados.ts:114-117` (`packages/shared`) y el módulo lo consume. Regla 13 punto 1 en su forma literal |
| 4 | **Qué pasa con un estado DESCONOCIDO** (`false`, D1.3) | **Ninguna** | **No es guarda, y conviene decir por qué no.** No oculta nada: con `false` el ticket cae en `abiertos` (`boardView.ts:47`) y **se ve**. Quien vigila el estado fuera del registro es el invariante 1 (`invariantesGrafo.test.ts:41`), en `packages/shared`, y sigue ahí. Conserva la conducta de `boardView.ts:39` |

**Conclusión de la casilla: cuatro decisiones, CERO guardas, y ninguna guarda nueva.** Ninguna puede
estar esquivando una regla del servidor porque no existe regla del servidor que esquivar: las cuatro
son presentación sobre datos que el servidor ya entregó enteros. El punto 2 de la regla 13 —«si una
decisión no tiene contrapartida en el servidor, el cliente es la guarda»— **no se activa**, porque
ninguna de las cuatro impone ni relaja nada.

**La fila 4 es nueva respecto a la propuesta** (§5, tres filas). Se añade porque D1.3 introduce una
decisión que antes estaba implícita en el `?? ''` de `boardView.ts:39` y ahora es explícita y
exportada: dejarla sin fila sería marcar la casilla de memoria.

**Las dos decisiones de COLOR quedan fuera** porque quedan fuera de la tanda (Q1) y tampoco serían
guardas: `ClienteDetalle.tsx:22` y `TicketDetailView.tsx:245` son presentación pura — ninguna decisión
de negocio depende de un `bg-amber-50`.

---

## 7 · D7 · El barrido, con DOS detectores y sus controles

### 7.1 · Se barre lo que AFIRMA nueve sobre esta lista, no la cadena «nueve»

| Detector | Patrón | Papel |
|---|---|---|
| **D-palabra** | `grep -rniE "\bnueve\b"` | Caza la prosa |
| **D-numeral** | `grep -rnE "\b9\b"` | **Obligatorio.** Caza lo que el anterior no |
| Control positivo | `\bonce\b` | Demuestra que el patrón encuentra cuando existe |

**El numeral no es opcional, y está verificado en esta sesión.** `estados.ts:21` afirma
`| 9 estados — LO QUE DECLARA ESTE |` dentro de la tabla de los tres criterios. Corrido
`\b9\b|\bnueve\b` sobre `packages/shared/src`, `estados.ts:21` aparece **sólo** por el numeral: los
únicos aciertos de `\bnueve\b` en ese fichero son `:28` y `:109`. **Con un solo detector, la cabecera
del fichero que define la lista se queda mintiendo.** Ése es el control de M5.

**D-numeral es un GENERADOR DE CANDIDATOS, no un veredicto.** Verificado: `\b9\b` también acierta en
`M1.9.1`, `M1.9.2` y `toHaveLength(9)` porque el punto es carácter no-palabra. Cada acierto se adjudica
a mano; lo innegociable es que **`estados.ts:21` esté entre los candidatos**.

### 7.2 · Tercer detector, que la propuesta no tenía: las cuentas que NO dicen «nueve»

Verificado con `\b(tres|cinco|once|doce|seis)\b` sobre `estados.test.ts`: los títulos de `:25`
(«estos tres»), `:44` («estos once») y la prosa de `:22` («3/5/12/1») llevan la cuenta dentro **y no
contienen «nueve»**, así que los dos detectores de la propuesta **no los ven**. Entran en el barrido por
enumeración explícita (§5, Fase 2.2), no por patrón.

### 7.3 · La lista, verificada de disco

**SE BARREN:**

| Sitio | Qué dice hoy | Detector que lo caza |
|---|---|---|
| `estados.ts:21` | `\| 9 estados — LO QUE DECLARA ESTE \|` | **Sólo D-numeral** |
| `estados.ts:28` | «La vista muestra **las nueve**…» | D-palabra |
| `estados.ts:109` | «Las **NUEVE** que la vista del tablero enseña» | D-palabra |
| `estados.ts:60` | `// ── externa (3)` → `(5)` | Enumeración |
| `estados.ts:80` | `// ── ninguna (11)` → `(9)` | Enumeración |
| `estados.test.ts:78`, `:84` | «Las NUEVE de la vista», «las nueve en espera» | D-palabra |
| `estados.test.ts:22`, `:25`, `:44`, `:71` | Cuentas sin la palabra «nueve» | §7.2 |
| `sla.test.ts:44`, `:46`, `:50` | Cita textual + «los nueve» + nombre del `it` | D-palabra |

⚠️ **`estados.ts:21` es una tabla ASCII alineada a mano.** `9 estados` → `11 estados` gana un carácter y
la columna debe conservar su ancho; el control es que `:20`, `:22` y `:23` sigan cuadrando.

⚠️ **`sla.test.ts:44` es CITA TEXTUAL de `estados.ts:28`** —verificado: «La vista muestra las nueve. El
reloj del SLA NO lee esta clasificación.»—. **Se editan en la MISMA operación**, coordinadas: cambiar el
original y no la cita deja una comilla que ya no cita nada, y nada se pone rojo por ello.

**NO SE BARREN, y el porqué es el argumento de barrer por afirmación:**

| Sitio | Por qué no |
|---|---|
| `openspec/specs/transitions-st/spec.md:723` | Dice «nueve **líneas** más abajo». No habla de estados |
| `openspec/config.yaml:931`, `:933` | Nueve **observaciones** de Engram retituladas |
| `docs/sdd/Paquete_de_Despliegue_2026-09-10.md:65`, `:309` | **Registro FECHADO** de lo que se desplegó el 10/09, cuando la lista sí tenía nueve. Cambiarlo **falsificaría un registro histórico** — el documento dejaría de describir el despliegue que describe |
| `bodegaje.test.ts:178`, `:184` | Numeración de invariantes («9 · …»), verificado |
| `reentrancia.*`, `invariantesGrafo.test.ts:85`, `sla.ts:62`, `sla.test.ts:89` | Otras nueves: casos de C2, `M1.9.x`, referencias al maestro. Verificado |

**El spec de récord no se barre a mano:** las siete líneas de `transitions-st/spec.md` (`:366`, `:377`,
`:378`, `:380`, `:481`, `:590`, `:598`) las corrige el **delta spec**, y las funde `sdd-archive`.

---

## 8 · D8 · Las seis mutaciones, desarrolladas

Cada fila: qué se rompe a propósito, qué detector **debe** ponerse rojo, y el control que valida que el
detector sirve. Se ejecutan **todas** y se revierten. Una mutación que no se corre es una casilla.

| # | Mutación | Detector que DEBE ponerse rojo | Control que valida el detector |
|---|---|---|---|
| **M1** · obligatoria | Devolver `'Por Entregar'` a `'ninguna'` en `estados.ts` | El rojo (b): el `describe` nuevo de `boardView.test.ts` (Fase 0) | Si **no** se pone rojo, la prueba no mira lo que dice mirar: **se rehace, no se ajusta**. Control adicional: (a1)-(a4) también deben ponerse rojos, lo que confirma que el detector de vista y el de registro son independientes |
| **M2** · el fichero vigilado (regla de mutación 2) | Mover una entrada **dentro** del bloque `externa`, sin cambiar su valor | Los `toEqual` de `estados.test.ts:25` y `:85`, que fijan el ORDEN | `estados.test.ts:71` (la suma) debe seguir **VERDE**: una suma no distingue un reordenamiento. Quien «arregle» la tanda tocando sólo la suma no ha movido ningún detector. Es la comprobación directa de la regla de §3.3 |
| **M3** · la posición (regla de mutación 1) | Quitar `statusType !== 'Closed'` de la rama `espera` (`boardView.ts:48`) | RQ-VT-05, `boardView.test.ts:53-58` | Debe ponerse rojo **también** con un `Por Entregar` cerrado: se añade ese caso o se comprueba que el existente lo cubre. Un `Por Entregar` **cerrado no es una espera**, y el orden de las dos condiciones de `:48` es lo que lo garantiza |
| **M4** · cambia el destinatario, no el resultado | En `enEspera.ts`, sustituir el registro por `/espera\|hold/i` | Aserto 1 de `enEspera.test.ts` (§5, Fase 1) **y** el `describe` de RQ-VT-04 (`boardView.test.ts:31-45`) | **Mide el hueco, no lo tapa.** La salida de las vistas cambia y se detecta; la de `ClienteDetalle.tsx:18` **no la ve ninguna prueba**. Lo que la mutación cuantifica es exactamente cuánto de la Pieza 2 depende de la tarea de persona del §12 |
| **M5** · el detector del barrido | Devolver **una** cita a «nueve» (p. ej. `sla.test.ts:44`) | El barrido del §7 con sus **dos** patrones | Correr **D-palabra solo** y confirmar que `estados.ts:21` se le escapa. Es la prueba ejecutada de que el segundo detector hacía falta, y no una afirmación sobre él |
| **M6** · el recuento EXACTO de supervivientes | Retirar **una** de las dos regex de color que deben sobrevivir (`ClienteDetalle.tsx:22` o `TicketDetailView.tsx:245`) | El `grep` del criterio de aceptación, que afirma **exactamente dos** | Devuelve **uno** y el criterio debe ponerse rojo. Segundo control, al otro lado: **añadir** una tercera debe dar **tres** y también rojo. Un detector que acepte «cero o las que sea» no distingue la tanda hecha de la que se pasó de frenada |

### 8.1 · El detector de M6, corregido — el de la propuesta NO discrimina

**Hallazgo verificado en esta sesión, y hay que cambiar el criterio para que sea ejecutable.**

`grep -rnE "/espera(\|hold)?/i" apps/desk/src` devuelve **CUATRO** aciertos hoy, no tres:

```
ClienteDetalle.tsx:18      código
ClienteDetalle.tsx:22      código
TicketDetailView.tsx:245   código
boardView.test.ts:27       ← PROSA: el comentario de RQ-VT-04 nombra «la regex vieja (`/espera/i`)»
```

Con ese patrón el criterio «quedan exactamente dos» **es imposible de cumplir**: tras la tanda quedarían
tres (dos de color + la prosa), y **más** en cuanto el ancla A de D4 nombre el patrón en su comentario.

**Detector corregido — se cuentan LLAMADAS, no menciones:**

```bash
grep -rnE "/espera(\|hold)?/i\.test\(" apps/desk/src
```

**Verificado corriendo en esta sesión:** devuelve **exactamente tres** hoy —`ClienteDetalle.tsx:18`,
`:22`, `TicketDetailView.tsx:245`— y **ninguna** mención en prosa. Tras la tanda debe devolver
**exactamente dos**, las dos de color.

De aquí sale la restricción de higiene de §4.3: **ningún comentario puede reproducir `/espera/i.test(`**.
Es el precio de tener un detector que discrimina, y es barato.

---

## 9 · Hallazgo 3 — nuevo, y va a Gerencia sin destino

> Los hallazgos 1 y 2 están en la propuesta (§8) y no cambian. Éste sale del §0 de este diseño.

**¿`Por Entregar` y `Por Entregar / Sin facturar` son también `sin_salida` por M1.3.4?**

Los dos tienen **una sola** transición de salida (`transitions.ts:250`, `:248`, verificado), y el
discriminador de `sin_salida` (`estados.ts:125-127`) nombra literalmente «**una entrega física**» como
ejemplo de suceso que ocurre fuera de la aplicación. Tras esta tanda, la derivación del
`estados.test.ts:157` da **ocho** y las que sobran son **cuatro**, no dos.

**Esta tanda NO lo decide.** `ESTADOS_SIN_SALIDA` es lista declarada con criterio cerrado por Gerencia
(`estados.ts:143`), la propuesta la deja fuera («no entra: reclasificar ningún otro estado»), y
ampliarla de oficio sería derivar una clasificación de negocio de una propiedad del grafo — que es
justo lo que `estados.test.ts:132-143` y `:145-155` existen para prohibir.

**Sin destino asignado, a propósito:** asignar una épica de memoria es lo que dejó cuatro desvíos
huérfanos al cerrar F1A.

---

## 10 · Flujo de datos

```
packages/shared/src/estados.ts
  CLASIFICACION_EN_ESPERA (:59)  ──►  ESTADOS (:106)  ──►  ESTADOS_EN_ESPERA (:114)
                                                                   │
                                            apps/desk/src/lib/enEspera.ts
                                              esEstadoEnEspera(status)          ← ÚNICO punto de consumo
                                                       │
                        ┌──────────────────────────────┴───────────────────────┐
                        ▼                                                      ▼
        lib/boardView.ts:39 → :47 'abiertos' / :48 'espera'     components/ClienteDetalle.tsx:18
                        │                                            → :96 espera → :98 visibles
                        ▼                                                      │
              apps/desk/src/App.tsx (3 llamadas)                               ▼
                                                              ⚠ :22 badgeClass NO consume el módulo
                                                                 (divergencia deliberada, Q1)
```

Fuera del flujo, sin tocar: `TicketDetailView.tsx:245` (color) y `TicketCard.tsx:14` (mapa de color).

---

## 11 · Ficheros

| Fichero | Acción | Qué cambia | Líneas est. |
|---|---|---|---|
| `packages/shared/src/estados.ts` | Modificar | Mover `:87-88` al bloque `externa`; rótulos `:60`/`:80`; prosa `:21` (numeral), `:28`, `:109` | 12-18 |
| `packages/shared/src/estados.test.ts` | Modificar | `toEqual` `:25`/`:44`/`:85` + sus nombres; prosa `:22`/`:78`; nombre `:71`; **y `:145-163`, el hallazgo del §0** | **30-42** |
| `packages/shared/src/sla.test.ts` | Modificar | `:44` (cita coordinada con `estados.ts:28`), `:46`, `:50`. **`:52` no se toca** | 3-6 |
| `apps/desk/src/lib/enEspera.ts` | **Crear** | El predicado extraído de `boardView.ts:39` | 10-18 |
| `apps/desk/src/lib/enEspera.test.ts` | **Crear** | Los cuatro asertos del contrato + el anclado de la Fase 2.4 | 22-32 |
| `apps/desk/src/lib/boardView.ts` | Modificar | `:2` import, `:39` consume el módulo y pierde el cast | 3-5 |
| `apps/desk/src/lib/boardView.test.ts` | Modificar | El rojo (b): `describe` nuevo con el molde `casoEnEspera` | 8-14 |
| `apps/desk/src/components/ClienteDetalle.tsx` | Modificar | **Sólo `:18`** + las dos anclas de D4 | 8-12 |
| `apps/desk/src/components/TicketDetailView.tsx` | **Sin tocar** | `:245` se queda (Q1) | 0 |
| `apps/desk/src/components/TicketCard.tsx` | **Sin tocar** | El mapa de color es otra tanda | 0 |
| `vitest.config.ts` | **PROHIBIDO tocar** | F0-00, decisión de Gerencia | 0 |
| `CLAUDE.md` · `openspec/config.yaml` | Modificar | IV-9 **reducida**, no cerrada | 20-35 |
| **Total código + pruebas** | | | **~96-147** |

**Talla S+.** Sube respecto a las 80-120 de la propuesta por el hallazgo del §0 y la segunda ancla de
D4. Sigue muy por debajo de `review_budget_lines: 800`.

**Precondición de entrega (R-4, no es recomendación):** `proposal.md`, el delta spec, este `design.md` y
`tasks.md` se **commitean antes de que el intento de `sdd-apply` adquiera** — `sdd-attempt` diffea el
árbol entero (`CLAUDE.md`, regla del ciclo 2). Y **una tanda por árbol de trabajo** (R-5).

---

## 12 · Interfaces

```ts
// apps/desk/src/lib/enEspera.ts
import { ESTADOS_EN_ESPERA } from '@ambientalia/shared'

/**
 * ¿Este estado es de los que la vista enseña bajo «En espera»?
 *
 * NO es lógica nueva: es el `.includes` que `boardView.ts:39` ya hacía, con domicilio propio para que
 * los DOS sitios que CLASIFICAN lo compartan. El criterio «externa o interna» vive en
 * `estados.ts:114-117` y no se reescribe aquí (regla invariable 13, punto 1).
 *
 * Un estado que no esté en el registro devuelve `false`, igual que hacía `boardView.ts:39`: no lo
 * esconde —cae en «abiertos», que se ve—, y quien vigila los estados no declarados es el invariante 1
 * de `invariantesGrafo.test.ts`. Ver `enEsperaDe` (`estados.ts:163`) si hace falta la CLASE.
 */
export function esEstadoEnEspera(status?: string | null): boolean {
  return (ESTADOS_EN_ESPERA as readonly string[]).includes(status ?? '')
}
```

---

## 13 · Estrategia de pruebas

| Capa | Qué se prueba | Cómo |
|---|---|---|
| Unidad · dominio | La clasificación y el ORDEN del registro | `estados.test.ts` (`:25`, `:44`, `:85`, `:159`), `toEqual` sobre arrays ordenados |
| Unidad · cliente | El predicado acuerda con el registro | `enEspera.test.ts`, derivado de `ESTADOS`/`ESTADOS_EN_ESPERA` — invariante al salto 9→11 |
| Integración de vista | Que el tablero **enseñe** distinto | `boardView.test.ts`, molde `casoEnEspera` (`:32-38`) |
| Coherencia | El reloj y la vista no leen la misma lista | `sla.test.ts:52-53`, **verde comprobado CORRIENDO**, no razonado |
| Grafo | Declarados == derivados | `invariantesGrafo.test.ts:41`, insensible al orden (§3.4) |
| Mutación | Que los detectores discriminen | Las seis de §8, ejecutadas y revertidas |
| Interfaz (`.tsx`) | **Ninguna, por decisión de Gerencia** (F0-00) | Tarea de persona, §12 de la propuesta. **No se registra como carencia** |

---

## 14 · Matriz de amenazas

**N/A.** Este cambio no toca enrutado, comandos de shell, subprocesos, automatización de VCS/PR,
clasificación de ficheros ejecutables ni integración de procesos. No hay SQL: `rules.design` de
`openspec/config.yaml:959` (calificar el esquema en todo `CREATE TABLE`) **no aplica** — ninguna
sentencia SQL entra en esta tanda.

---

## 15 · Migración y reversión

**Sin migración.** La clasificación es un dato en código, no una columna. No toca el esquema
`desk`/`public`, no escribe hacia Zoho y no depende de `ENABLE_WRITES`.

Las fases del §5 se revierten por separado y en orden inverso: la Fase 2 (`git revert` del registro y
sus pruebas) deja la Fase 1 en pie y funcionando, porque la Fase 1 es refactor a conducta constante.
`ClienteDetalle.tsx:22` y `TicketDetailView.tsx:245` **no hay que revertirlos: no se tocaron**.

---

## 16 · Preguntas abiertas

- [ ] **Hallazgo 3 (§9), para Gerencia:** ¿`Por Entregar` y `Por Entregar / Sin facturar` entran también
      en `ESTADOS_SIN_SALIDA` por el criterio de M1.3.4? **No bloquea esta tanda** — se anota y se deja
      sin destino.
- [ ] **Hallazgo 1 de la propuesta (§8), para Gerencia:** ¿`liberacion_sin_factura` debe pedir también
      `'Fecha de aviso al cliente'`? No bloquea.
- [ ] **Hallazgo 2 de la propuesta (§8):** el color desde una sola fuente. Otra tanda, con decisión de
      alcance. No bloquea.

**Ninguna bloquea el diseño.** Las tres son decisiones de negocio ajenas a lo que esta tanda ejecuta.
