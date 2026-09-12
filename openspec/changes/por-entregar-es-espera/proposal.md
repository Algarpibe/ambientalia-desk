# Propuesta: `Por Entregar` es espera, y el predicado que CLASIFICA se escribe una sola vez

**Tanda · base `2e6b4d8` (rama `main`)**

Dos piezas del mismo desacuerdo. La primera ejecuta una decisión de Gerencia del 12/09: los dos
estados de entrega pasan a espera externa, y la lista de la vista pasa de nueve a once. La segunda
impide que la corrección valga sólo en el tablero: hoy el mismo predicado está escrito **cuatro
veces** en el cliente, y la copia que **clasifica** en la ficha de cliente
(`ClienteDetalle.tsx:18`) seguiría diciendo que un `Por Entregar` no espera a nadie.

> ⚠️ **Alcance reducido por respuesta de Gerencia (Q1, §13).** Las otras dos copias
> —`ClienteDetalle.tsx:22` y `TicketDetailView.tsx:245`— **no se tocan**: deciden COLOR, no
> clasificación, y unificarlas pintaría de ámbar un estado que el tablero pinta de azul. Esta tanda
> unifica **las dos que clasifican**, no las cuatro.

> **Regla de método.** Toda cita de código lleva ruta y línea, verificada de disco en esta sesión
> sobre `2e6b4d8`. La cita del maestro se comprobó **contra el `.md`**, no contra un documento
> intermedio. Lo que no se pudo verificar lleva la palabra **hipótesis** delante.

---

## 1 · Intención

| | |
|---|---|
| **El problema** | El tablero y el indicador describen la misma espera de forma distinta. `estados.ts:87-88` clasifica `Por Entregar` y `Por Entregar / Sin facturar` como `'ninguna'`, así que un equipo que ya fue avisado y espera a que el cliente lo recoja se lista como «abierto» (`boardView.ts:47`) y no como «en espera» (`:48`) |
| **Por qué ahora** | Salió de la verificación en producción del despliegue: Comercial preguntó por qué un ticket en `Por Entregar` no aparecía en «Tickets en espera». Gerencia (Comercial) lo decidió el 2026-09-12 — Engram `decision/por-entregar-es-espera`, obs. 494 |
| **Éxito** | Un equipo que espera al cliente **cuenta como espera en los dos sitios que clasifican** —el tablero y la ficha de cliente—, no sólo en el que se arregló la última vez; y esa clasificación la decide el registro de dominio, escrita una sola vez |

**Fuente en el maestro: M1.10, «Los tres bodegajes»** (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.1.md:1699-1702`, leído de primera mano).
El bodegaje **de salida** abre cuando «se avisa al cliente de que puede recoger el equipo» (`:1700`) y
cierra cuando «el cliente lo recoge» (`:1701`). Ése es exactamente el periodo que un ticket pasa en
`Por Entregar`: el código ya lo tiene escrito así en `bodegaje.ts:73-79`, entrada `clase: 'salida'`,
que abre con `CAMPO_AVISO_CLIENTE` (`bodegaje.ts:52`) y cierra con `'Fecha Remisión de Salida'`.

**Y las DOS ramas de entrega cierran el mismo operando**, que es lo que mete también a la rama sin
factura: `entrega_sin_factura` (`transitions.ts:248-249`, de `Por Entregar / Sin facturar` a
`Por Facturar`) y `entrega_al_cliente` (`transitions.ts:250-251`, de `Por Entregar` a `Finalizado`)
escriben las dos `cfDate('Fecha Remisión de Salida')`. En los dos estados el equipo espera lo mismo:
que el cliente venga a recogerlo.

**Zoho no coincide, y se dice.** En la medición del 2026-09-11 contra la API de Zoho Desk,
`Por Entregar` llega con `statusType: Open` y `Notificación cliente` con `On Hold`. La decisión se
toma contra el indicador propio —el bodegaje de M1.10—, no contra la clasificación de Zoho: es
divergencia declarada, no error de sincronización. **Y Zoho no se ajusta, por una razón que no es de
autoridad sino de coste: es el sistema que este proyecto va a sustituir, así que configurarlo es
trabajo que se tira** (Q3, §13).

---

## 2 · Alcance

### Entra

1. **`Por Entregar` y `Por Entregar / Sin facturar` pasan a `'externa'`** en `CLASIFICACION_EN_ESPERA`
   (`estados.ts:87-88`). `ESTADOS_EN_ESPERA` (`estados.ts:114`) pasa de nueve a once.
2. **El predicado «está en espera» se EXTRAE a un módulo propio** de `apps/desk/src/lib`, con su
   prueba, y lo consumen los **dos** sitios que CLASIFICAN: `boardView.ts:39` y
   `ClienteDetalle.tsx:18`.
3. **Un comentario en `ClienteDetalle.tsx`** que declare deliberada la divergencia que queda dentro
   del fichero entre `:18` (registro) y `:22` (color). Es tarea de implementación, no prosa de esta
   propuesta: ver §3, Pieza 2.
4. **Barrido de «nueve» → «once» por afirmación**, con dos detectores (palabra y numeral).
5. **IV-9 se REDUCE** —no se cierra— en `CLAUDE.md` y en `openspec/config.yaml`.
6. **Corrección de paso** del nombre caduco de `estados.test.ts:71`.

### No entra

- **Los dos usos de COLOR del predicado**: `ClienteDetalle.tsx:22` y `TicketDetailView.tsx:245`.
  Fuera por respuesta de Gerencia a Q1 (§13). **Siguen con su regex y IV-9 sigue viva por ellos.**
- **Unificar el color en una sola fuente** (`statusColorMap`, `TicketCard.tsx:14`). Es el arreglo de
  verdad de esa mitad, y es **otra tanda con decisión de alcance**: §8, hallazgo 2.
- **La pregunta de negocio del §8** (la rama sin factura cierra un bodegaje que nadie abrió). Va a
  Gerencia, sin destino asignado.
- **Tocar el reloj del SLA.** `SLA_HORAS_POR_ESTADO` (`sla.ts:32-35`) no se toca: ver §7.
- **Reclasificar ningún otro estado.** `Pendiente` sigue `sin_clasificar` (`estados.ts:99`).
- **`jsdom`, `@testing-library` o ampliar `vitest.config.ts:17-20` a `*.test.tsx`.** Prohibido por
  decisión de Gerencia (F0-00; `openspec/config.yaml:45-53`).
- El punto abierto nº 52 y la titularidad OV↔equipo: ajenos a este fichero.

---

## 3 · Enfoque, pieza a pieza

### Pieza 1 · La clasificación, y su FORMA

Las dos líneas **se mueven físicamente** al bloque `externa` (hoy `estados.ts:60-65`); no basta con
cambiarles el valor. La razón está escrita en el propio fichero: `estados.ts:56-57` declara que la
lista «va agrupada por clase y no por orden alfabético porque la lista se lee para comprobar la
clasificación». Dejar dos entradas `'externa'` dentro del bloque rotulado `// ── ninguna (11)`
(`estados.ts:80`) contradiría esa convención en el mismo fichero.

⚠️ **Consecuencia sobre el ORDEN, que hay que decir antes de escribir ninguna prueba.** `ESTADOS` es
`Object.keys(CLASIFICACION_EN_ESPERA)` (`estados.ts:106`) y `ESTADOS_EN_ESPERA` es `ESTADOS.filter(...)`
(`estados.ts:114`). Al mover las líneas, los dos estados nuevos caen **dentro del bloque `externa`**,
no al final de la lista. **El array esperado de los `toEqual` se fija contra lo que produzca el filtro,
nunca al revés**: ajustar el orden del registro para que case con una prueba escrita de memoria es
invertir quién manda.

### Pieza 2 · Un predicado, DOS consumidores — los que clasifican

Hoy la misma noción está escrita cuatro veces en `apps/desk/src`. **Pero no hacen lo mismo, y el
propio código lo enseña:** dos CLASIFICAN —deciden en qué lista cae el ticket— y dos PINTAN.

| Sitio | Lo que dice hoy | Qué hace | ¿Entra? |
|---|---|---|---|
| `lib/boardView.ts:39` | `(ESTADOS_EN_ESPERA as readonly string[]).includes(t.status ?? '')` | **Clasifica** (ramas `:47`/`:48`) | **Sí** — pierde el cast en línea |
| `components/ClienteDetalle.tsx:18` | `/espera/i.test(t.status)` | **Clasifica**: se consume en `:96`, `tickets.filter(esEspera)`, y alimenta la sub-vista de `:98` | **Sí** — acierta 2 de 9 |
| `components/ClienteDetalle.tsx:22` | `/espera/i.test(t.status)`, dentro de `badgeClass` | **Pinta** | **No** (Q1) |
| `components/TicketDetailView.tsx:245` | `/espera\|hold/i.test(ticket.status)`, dentro del `className` | **Pinta** | **No** (Q1) |

**Se extrae el de `boardView.ts:39`. No se escribe lógica nueva**: el módulo nuevo envuelve
exactamente ese `.includes` sobre el registro, y los dos clasificadores pasan a consumirlo. Forma
propuesta (la confirma `sdd-design`): `apps/desk/src/lib/enEspera.ts`,
`esEstadoEnEspera(status?: string | null): boolean`, con su `enEspera.test.ts` — `.ts`, luego
**dentro** de la red de pruebas (`vitest.config.ts:17-20` incluye `apps/**/*.test.ts`).

**Por qué envolver y no llamar a `enEsperaDe`:** ya está razonado y fusionado en la spec.
`openspec/specs/vistas-tablero/spec.md:119-125` lo decidió al archivar F1B-08 — `enEsperaDe`
(`estados.ts:163-167`) devuelve la CLASE, no un booleano, y consumirla obligaría al cliente a
reescribir el criterio «externa o interna» que `estados.ts` ya posee, «el mismo defecto IV-1 movido un
metro». Esta tanda no reabre esa decisión: la hereda.

#### Por qué el color se queda fuera — respuesta de Gerencia a Q1, con el dato medido

1. **No es un atasco.** El equipo está listo; lo que falta es que el cliente venga. Pintarlo igual
   que `En Espera de Repuestos` anuncia un problema donde no lo hay.
2. **Contradiría al propio tablero, y de forma peor de lo que parece.** `TicketCard.tsx:14` tiene un
   mapa explícito de color por estado que esta tanda **no toca**, y ahí los dos estados que se
   reclasifican **ya se pintan distinto entre sí** (verificado de disco):

   | Línea | Estado | Color |
   |---|---|---|
   | `TicketCard.tsx:21` | `'Por Entregar'` | `bg-[#EBF8FF]` / `text-[#3182CE]` — **azul** |
   | `TicketCard.tsx:20` | `'Por Entregar / Sin facturar'` | `bg-[#FFF9E6]` / `text-[#D97706]` — **ámbar ya hoy** |
   | `TicketCard.tsx:22` | `'En Espera de Repuestos'` | `bg-[#FFF9E6]` / `text-[#D97706]` — **ámbar** |

   O sea que unificar el predicado de color no crearía **una** incoherencia nueva: dejaría **tres
   colores para dos estados hermanos** — `Por Entregar` azul en el tablero y ámbar en la ficha,
   mientras su gemelo sin factura ya es ámbar en los dos sitios.
3. **Color y clasificación son dos nociones distintas.** `ClienteDetalle.tsx:18` decide una lista;
   `:22` y `TicketDetailView.tsx:245` deciden un estilo. Que hoy compartan expresión regular es
   coincidencia de implementación, no una regla común.

#### ⚠️ La divergencia que queda DENTRO de `ClienteDetalle.tsx` se comenta en el código

Tras la tanda, `:18` clasifica con el registro (once estados) y `:22` pinta con `/espera/i` (dos):
un `Por Entregar` **se contará bajo «espera» y se pintará azul**. Hoy las dos líneas son la misma
regex, así que la divergencia es nueva y deliberada.

**Sin un comentario que la declare y la justifique, el primer lector que las vea las «arregla»
haciéndolas coincidir** — y eso reintroduce exactamente lo que Q1 rechazó. Va como **tarea de
implementación**, no como prosa de esta propuesta.

**Nota sobre `/espera|hold/i` (`TicketDetailView.tsx:245`), que se queda:** es más ancha que las otras
dos y no aporta nada. Medido por ejecución en esta sesión contra los 21 estados del registro,
`/espera/i` y `/espera|hold/i` casan con exactamente los mismos dos —`'En Espera de Repuestos'` y
`'En espera de SKU inventario'`—, 0 diferencias y 0 falsos positivos; ningún estado del registro
contiene «hold». Se anota para la tanda del color, no se toca aquí.

### Pieza 3 · El barrido de «nueve» → «once», por AFIRMACIÓN

Se barre **lo que afirma nueve sobre esta lista**, no la cadena «nueve». Dos detectores, cada uno con
su ejecución de control:

- **Por palabra:** `grep -rniE "\bnueve\b"`, con `\bonce\b` como control positivo de que el patrón
  encuentra algo cuando existe.
- **Por numeral, y es obligatorio, no opcional:** `estados.ts:21` afirma lo mismo con la cifra —
  `| 9 estados — LO QUE DECLARA ESTE |`, dentro de la tabla de los tres criterios —, y `\bnueve\b`
  **no lo caza**. Verificado en esta sesión. Un barrido con un solo detector deja esa línea mintiendo
  en la cabecera del fichero que define la lista.

**Sitios que SÍ se barren** (verificados de disco): `estados.ts:21` (numeral), `:28` («La vista muestra
las nueve»), `:60` (rótulo `externa (3)` → 5), `:80` (rótulo `ninguna (11)` → 9), `:109` («Las NUEVE
que la vista del tablero enseña»); `estados.test.ts:78`, `:84`; `sla.test.ts:44` —**cita textual de
`estados.ts:28`**, así que si cambia `:28` y no ésta, la cita deja de casar—, `:46` y `:50`.
El rótulo `interna (6)` de `estados.ts:67` **no cambia**: la clase interna no se toca.

**NO se tocan, y el porqué es el argumento de barrer por afirmación:**

| Sitio | Por qué no |
|---|---|
| `openspec/specs/transitions-st/spec.md:723` | Dice «nueve **líneas** más abajo». No habla de estados |
| `openspec/config.yaml:931`, `:933` | Hablan de nueve **observaciones** de Engram retituladas |
| `docs/sdd/Paquete_de_Despliegue_2026-09-10.md:65`, `:309` | Es un registro **fechado** de lo que se desplegó el 10/09, cuando la lista sí tenía nueve. Cambiarlo falsificaría un registro histórico |
| `eliminarTicket.*`, `reentrancia.*`, el maestro, `debt.md`, los planes | Otras nueves (tablas hijas, casos) |

**El spec de récord no es barrido a mano.** `openspec/specs/transitions-st/spec.md` afirma «nueve»
sobre esta misma lista en **siete** líneas: `:366`, `:377`, `:378`, `:380`, `:481`, `:590`, `:598`.
Las corrige el **delta spec** de este cambio, y las funde `sdd-archive`. Va declarado aquí para que
no se pierda entre las fases.

### Pieza 4 · IV-9 se REDUCE. No se cierra

El desvío IV-9 (`CLAUDE.md:206`, y su gemela en `openspec/config.yaml:738`, `:740`, `:755`, `:784`)
nombra **tres** implementaciones supervivientes del predicado. Esta tanda retira **una**
(`ClienteDetalle.tsx:18`) y deja **dos** por decisión de Gerencia (Q1). La entrada **sigue VIVA**, con
el alcance reducido y redactado con precisión:

> «Sobreviven **dos** implementaciones del predicado, **las dos para COLOR**:
> `ClienteDetalle.tsx:22` y `TicketDetailView.tsx:245`.»

**Ni cerrarla ni dejarle el texto viejo: las dos cosas serían falsas.** Cerrarla diría que ya no hay
copias; el texto viejo diría que hay tres y que una de ellas clasifica.

**La medición que acompaña a la entrada reducida** (medido por ejecución en esta sesión): `/espera/i`
no casa ni con `Por Entregar` ni con `Por Entregar / Sin facturar`, así que el numerador **no cambia**
— las dos supervivientes siguen acertando 2, ahora de **once**, y los estados que se les escapan pasan
de siete a **nueve**. Lo que cambia es el **efecto**: ya sólo afecta al color de un badge, no a en qué
lista cae un ticket.

**El arreglo de verdad de esa mitad va anotado, no hecho:** §8, hallazgo 2.

### Pieza 5 · Corrección de paso, declarada como tal

`estados.test.ts:71` se llama `'3 + 5 + 12 + 1 = 21, y no hay ningún estado fuera de las cuatro clases'`
y el comentario de `:21-23` habla de «las cuentas 3/5/12/1». **Las dos cifras están caducas desde que
`Remisión creada` pasó a `interna`**: lo real HOY es 3/6/11/1 = 21 (contado por ejecución en esta
sesión). Tras esta tanda será **5/6/9/1 = 21**. El nombre afirma una cuenta que la prueba no comprueba
—usa `toBe(ESTADOS.length)` (`:74`)— y por eso nunca se puso roja.

**Es corrección de paso, no alcance nuevo:** una línea, en un fichero que esta tanda ya abre.

---

## 4 · El rojo primero (`strict_tdd: true`)

Hay **cuatro** rojos, y distinguirlos importa: tres aparecen solos y ninguno demuestra lo que la
decisión pide.

| # | Rojo | Qué demuestra |
|---|---|---|
| **a1** | `estados.test.ts:25` — `externa` son exactamente **tres** → pasan a cinco | Que la lista cambió |
| **a2** | `estados.test.ts:44` — `ninguna` son exactamente **once** → pasan a nueve | Que la lista cambió |
| **a3** | `estados.test.ts:85` — el `toEqual` de `ESTADOS_EN_ESPERA`, nueve → once | Que la lista cambió |
| **b** | **HAY QUE ESCRIBIRLO**: en `boardView.test.ts`, que `applyBoardView(..., 'espera')` incluya un ticket en `Por Entregar` y que `'abiertos'` **no** lo incluya | **Que el tablero enseña distinto** — que es lo que Gerencia decidió |
| **c** | **HAY QUE ESCRIBIRLO**: la prueba propia del módulo extraído (`enEspera.test.ts`) | Que el predicado compartido clasifica por el registro |

**(b) se escribe ANTES de tocar `estados.ts`.** El molde exacto ya está en el fichero:
`boardView.test.ts:31-45`, el `describe` de RQ-VT-04 con su helper `casoEnEspera(status)`, que afirma
justo esas dos cosas (`:35` y `:36`). Hoy ese caso no existe para los dos estados de entrega.

Los tres de (a) sirven, pero **no como único rojo**: dicen que la lista cambió, no que el usuario vea
algo distinto. Una tanda que sólo los ponga verdes ha cambiado un dato, no ha cerrado la petición.

⚠️ **El segundo consumidor no admite rojo, y se declara en vez de disimularse.**
`ClienteDetalle.tsx:18` es `.tsx` y queda fuera de la red de pruebas (`vitest.config.ts:16`,
`:17-20`; F0-00). Su detector es (c) —la prueba del módulo que pasa a consumir— más la comprobación
de persona del §12. No se finge una prueba ni se instala nada.

---

## 5 · Regla de mutación 3 — la casilla de la regla 13, marcada por escrito

Esta tanda toca `apps/desk/src`. Enumeración **decisión a decisión**, con la línea del servidor que la
impone o la declaración de que no la hay. Hecha por escrito, no de memoria.

| # | Decisión que toma el cliente | Línea del servidor que la impone | Veredicto |
|---|---|---|---|
| 1 | Qué tickets caen en «espera» y cuáles en «abiertos» (`boardView.ts:47-48`) | **Ninguna, y no hace falta** | **Consumo de dominio, regla 13 punto 1.** Ninguna conducta del servidor depende de esta lista: es presentación de un registro compartido. Además, el propio fichero ya declara por escrito por qué el filtro de vista vive en el cliente (`boardView.ts:33-36`, con `docs/modelo-autorizacion.md`), y `openspec/specs/permissions/spec.md` §4.4 lo adjudicó correcto |
| 2 | Qué tickets del cliente caen en la sub-vista «espera» de la ficha (`ClienteDetalle.tsx:18`, consumido en `:96` y `:98`) | **Ninguna** | **Mismo caso que 1**, sobre la lista que el servidor ya devolvió entera. Es un filtro de presentación, no una restricción de visibilidad |
| 3 | Qué estado es de espera (el módulo extraído) | **Ninguna** | **Es el registro de `packages/shared`, no una regla del cliente.** El cliente no decide: importa |

**Conclusión de la casilla: tres decisiones, cero guardas.** Ninguna de las tres puede estar
esquivando una regla de servidor, porque no existe regla de servidor que esquivar: ninguna es una
guarda en el sentido del punto 2 de la regla 13. Esta tanda no crea ni una.

**Las dos decisiones de COLOR quedan fuera de la tabla porque quedan fuera de la tanda** (Q1), y
tampoco serían guardas: `ClienteDetalle.tsx:22` y `TicketDetailView.tsx:245` son presentación pura —
ninguna decisión de negocio depende de un `bg-amber-50`.

---

## 6 · Tabla de mutaciones (enunciada aquí; `sdd-tasks` la desarrolla)

Una fila por pieza, con detector propio, y **una que no cambia el resultado sino el destinatario**.

| # | Qué se muta | Detector que debe ponerse rojo | Control que valida el detector |
|---|---|---|---|
| **M1 · obligatoria** | Devolver `'Por Entregar'` a `'ninguna'` en `estados.ts` | El rojo (b) del §4, en `boardView.test.ts` | Si (b) no se pone rojo, **la prueba no mira lo que dice mirar** y hay que rehacerla, no ajustarla |
| **M2 · el fichero vigilado** (regla de mutación 2) | Mover una entrada **dentro** del bloque `externa` de `estados.ts` sin cambiar su valor | Los `toEqual` de `estados.test.ts:25` y `:85`, que fijan el ORDEN | Comprobar que `estados.test.ts:71` (la suma) sigue **verde**: la suma no distingue un reordenamiento, y quien «arregle» la tanda tocando sólo la suma no ha movido ningún detector |
| **M3 · la posición** (regla de mutación 1) | Quitar el filtro `statusType !== 'Closed'` de la rama `espera` (`boardView.ts:48`) | `vistas-tablero` RQ-VT-05, hoy en `boardView.test.ts:53-58` | Debe ponerse rojo **también** con los dos estados nuevos: un `Por Entregar` cerrado no es una espera |
| **M4 · no cambia el resultado, cambia el destinatario** | En el módulo extraído, sustituir el registro por `/espera\|hold/i` | `enEspera.test.ts` y las pruebas de `boardView` | La salida de las **vistas** cambia; la de `ClienteDetalle.tsx:18` no la ve ninguna prueba. La mutación mide **cuánto de la Pieza 2 queda sin detector automático** — que es exactamente la tarea de persona del §12 |
| **M5 · el detector del barrido** | Devolver una sola cita a «nueve» (p. ej. `sla.test.ts:44`) | El barrido del §3, Pieza 3, corrido con sus **dos** patrones | Correr el detector por palabra **solo** y confirmar que `estados.ts:21` se le escapa. Es la prueba de que el segundo detector hacía falta |
| **M6 · el recuento exacto de supervivientes** | Retirar una de las dos regex de color que **deben** sobrevivir (`ClienteDetalle.tsx:22` o `TicketDetailView.tsx:245`) | El `grep` del criterio de aceptación, que afirma **exactamente dos** ocurrencias de `/espera/i\|/espera\|hold/i` en `apps/desk/src` | Devolvería **uno**, y el criterio debe ponerse rojo. Un detector que aceptara «cero o los que sea» no distinguiría entre la tanda hecha y la tanda que se pasó de frenada, que es justo lo que Q1 prohíbe |

---

## 7 · Lo que tiene que seguir VERDE, comprobado corriendo

`sla.test.ts:52` exige intersección vacía entre los estados con SLA y `ESTADOS_EN_ESPERA`.
`SLA_HORAS_POR_ESTADO` (`sla.ts:32-35`) sólo tiene `'Notificado': 24`, clasificado `'ninguna'`
(`estados.ts:83`), así que no entra en la lista ni antes ni después.

**Se declara con la ejecución de la suite, no con el razonamiento.** Es criterio de aceptación que
`sdd-verify` tiene que probar **corriendo**: el razonamiento de arriba es la hipótesis de por qué
seguirá verde, no la prueba de que siga.

---

## 8 · Hallazgos que NO entran en esta tanda

### Hallazgo 1 · La rama sin factura cierra un bodegaje que nunca abrió

**La rama sin factura CIERRA el bodegaje de salida pero no lo ABRE.** A `Por Entregar / Sin facturar`
se llega con `liberacion_sin_factura` (`transitions.ts:246-247`, desde `Por Facturar`), cuyos `fields`
son `comment()` y `cfCheck('Liberación del ticket sin facturar', true)`: **no escribe
`'Fecha de aviso al cliente'`**. La única transición que la escribe es `habilitado_para_entrega`
(`transitions.ts:259-260`), que va a `Por Entregar`, no a la rama sin factura.

Un equipo entregado por ese camino **cierra un periodo que nunca empezó**, así que su bodegaje de
salida no se puede calcular. Y `transitions.ts:256-258` ya avisa del precio: no es que valga cero, es
que queda **incalculable para siempre**, porque nadie vuelve a pasar por esa etapa.

Es **pregunta de negocio** —si `liberacion_sin_factura` debe pedir también la fecha de aviso—, va a
**Gerencia** y **no se arregla aquí**. Sin destino asignado, a propósito: asignar una épica de memoria
es lo que dejó cuatro desvíos huérfanos al cerrar F1A.

### Hallazgo 2 · El color debería salir de UNA fuente, y no de un booleano

La mitad de IV-9 que sobrevive (`ClienteDetalle.tsx:22`, `TicketDetailView.tsx:245`) **no se arregla
sustituyendo su regex por el registro** — eso es justo lo que Q1 rechazó. El arreglo de verdad es que
el color salga de **la misma fuente que ya usa el tablero**: el mapa explícito por estado de
`TicketCard.tsx:14`, hoy consumido sólo en `TicketCard.tsx:26`. Un predicado booleano no puede
expresar «azul para listo, ámbar para atascado»: sólo sabe decir sí o no.

**Es otra tanda y necesita decisión de alcance** —a dónde se mueve el mapa, qué pasa con los estados
que no están en él (`TicketCard.tsx:26` cae hoy en `bg-slate-100`), y si el color es dominio o
presentación—. Queda **anotado con destino pendiente**, igual que el hallazgo 1: asignarle una épica
de memoria es lo que dejó cuatro desvíos huérfanos al cerrar F1A.

---

## 9 · Riesgos

| # | Riesgo | Probabilidad | Mitigación |
|---|---|---|---|
| **R-1** | **El orden del filtro.** Mover las dos líneas cambia la posición de los estados dentro de `ESTADOS` y `ESTADOS_EN_ESPERA` (`estados.ts:106`, `:114`). Un `toEqual` escrito de memoria da rojo por el orden y se «arregla» reordenando el registro | Media | El array esperado se fija **contra la salida del filtro**, y la mutación M2 lo comprueba |
| **R-2** | **Citas que se descuelgan.** `openspec/specs/vistas-tablero/spec.md:113-117` cita `boardView.ts:39` **con la expresión literal** que la Pieza 2 se lleva a otro fichero; `spec.md:8` declara la dependencia | Alta | Es delta spec de esta tanda (§10), no barrido manual. Reanclar al archivar |
| **R-3** | **`ClienteDetalle.tsx` no admite rojo previo** bajo `strict_tdd` (`vitest.config.ts:16`, `:17-20`; F0-00) | Cierta | No se finge prueba ni se instala nada. El módulo extraído **sí** la tiene, y la comprobación del consumo de `:18` es tarea de persona: §12. No se registra como carencia ni como riesgo de calidad: es decisión de Gerencia |
| **R-3b** | **Alguien unifica las dos líneas divergentes de `ClienteDetalle.tsx`** (`:18` registro, `:22` regex) creyendo que arregla una copia olvidada, y reintroduce el ámbar que Q1 rechazó | **Alta** — hoy son la misma regex, así que la divergencia parece un descuido | El comentario que la declara deliberada es **tarea de implementación** (§3, Pieza 2), no prosa de esta propuesta. Y la entrada IV-9 reducida (§3, Pieza 4) lo dice desde fuera del fichero |
| **R-4** | **Presupuesto de revisión.** `changed_lines` se mide diffeando el **árbol entero** del intento (`CLAUDE.md`, regla del ciclo 2), y los artefactos SDD cuentan | Media | **PRECONDICIÓN, no recomendación:** `proposal.md`, `specs/`, `design.md` y `tasks.md` se **commitean ANTES de que el intento de `sdd-apply` adquiera**. Medido: es lo que hizo que `vista-todos-y-estados-en-espera` midiera **542 líneas** y no las ~1.900 que habría medido con la planificación dentro del intento. Código y pruebas ≈ 80-120 líneas, muy por debajo de 800 |
| **R-5** | **Paralelismo.** Dos tandas SDD sobre `C:\dev\Desk_2_R1.023` se imputan las líneas entre sí; desbloquearlo exige `sdd-attempt reset`, reservado a un mantenedor | Media | **Una tanda por árbol de trabajo.** Si hace falta otra en paralelo, worktree aislado |
| **R-6** | **Divergencia con Zoho visible.** Un informe construido sobre el `statusType` de Zoho seguirá contando `Por Entregar` como abierto | Baja | La divergencia se declara en el spec (§1) y Zoho no se toca: **es el sistema que este proyecto va a sustituir, así que ajustar su configuración es trabajo que se tira** (Q3). Si algún informe la lee, es hallazgo aparte |

---

## 10 · Capacidades

> Contrato con `sdd-spec`. Investigado sobre `openspec/specs/`.

### Capacidades nuevas

- **Ninguna.**

### Capacidades modificadas

- **`transitions-st`**: la lista `en_espera` pasa de **nueve a once** y `externa` de **tres a cinco**.
  Afecta a `spec.md:366`, `:377`, `:378`, `:380`, `:481`, `:590`, `:598` — siete líneas que afirman
  «nueve» sobre esta misma lista. `RQ-TS-15` no cambia de requisito: cambia su demostración.
- **`vistas-tablero`**: `RQ-VT-04` (`spec.md:111-128`) cita el predicado **en `boardView.ts:39`**;
  tras la Pieza 2 el predicado vive en un módulo propio y `boardView` lo consume. El requisito no
  cambia de fondo —clasificar por el registro, no por regex—; cambian su ubicación y sus
  consumidores, que pasan de uno a **dos**. `spec.md:8` (la dependencia declarada) se reancla.
  **Y el delta debe fijar el límite, no sólo la extensión:** el requisito alcanza a quien
  **clasifica** y **MUST NOT** extenderse a quien pinta (`ClienteDetalle.tsx:22`,
  `TicketDetailView.tsx:245`), por la decisión Q1. Sin esa frase en la spec, la divergencia
  deliberada queda sólo en un comentario del fichero, y la próxima tanda la «arregla».

---

## 11 · Áreas afectadas y estimación

| Área | Impacto | Qué cambia | Líneas est. |
|---|---|---|---|
| `packages/shared/src/estados.ts` | Modificado | Dos entradas se mueven a `externa`; rótulos `:60` y `:80`; prosa `:21`, `:28`, `:109` | 12-18 |
| `packages/shared/src/estados.test.ts` | Modificado | Tres `toEqual` (`:25`, `:44`, `:85`), prosa `:78`/`:84`, nombre caduco `:71` | 20-30 |
| `packages/shared/src/sla.test.ts` | Modificado | Tres citas (`:44`, `:46`, `:50`). El aserto `:52` **no se toca** | 3-6 |
| `apps/desk/src/lib/enEspera.ts` | **Nuevo** | El predicado extraído de `boardView.ts:39` | 10-18 |
| `apps/desk/src/lib/enEspera.test.ts` | **Nuevo** | Su prueba propia | 20-30 |
| `apps/desk/src/lib/boardView.ts` | Modificado | Consume el módulo; pierde el cast duplicado | 3-5 |
| `apps/desk/src/lib/boardView.test.ts` | Modificado | El rojo (b): `Por Entregar` en `espera` y no en `abiertos` | 8-14 |
| `apps/desk/src/components/ClienteDetalle.tsx` | Modificado | **Sólo `:18`**, que consume el módulo, más el comentario que declara deliberada la divergencia con `:22` | 6-10 |
| `apps/desk/src/components/TicketDetailView.tsx` | **Sin tocar** | `:245` se queda como está (Q1) | 0 |
| `apps/desk/src/components/TicketCard.tsx` | **Sin tocar** | El mapa de color de `:14` es el arreglo de la otra mitad, otra tanda (§8, hallazgo 2) | 0 |
| `CLAUDE.md` · `openspec/config.yaml` | Modificado | IV-9 **reducida**, no cerrada: de tres supervivientes a dos, las dos de color | 20-35 |
| **Total código + pruebas** | | | **~80-120** |

**Talla S+.** La extracción no es lógica nueva: envuelve el `.includes` que `boardView.ts:39` ya hace,
y la respuesta a Q1 quita dos consumidores del alcance.
**Presupuesto:** `review_budget_lines: 800`. El código cabe con mucha holgura; el intento completo
depende de que la planificación esté **commiteada antes de adquirir** (R-4) y del aislamiento del
árbol (R-5).

---

## 12 · Tarea de PERSONA — fuera del recuento de tareas

> **Archivar NO la da por hecha.** Se declara aquí para que `sdd-tasks` la ponga en sección aparte y
> **no la cuente** como tarea: una casilla cuyo dueño está fuera del repositorio no la marca ninguna
> tanda (`CLAUDE.md`, regla del ciclo 1).

| | |
|---|---|
| **Qué** | **Sólo la mitad de CLASIFICACIÓN:** que la ficha de cliente cuente bajo «espera» un ticket en `Por Entregar` (`ClienteDetalle.tsx:18`, consumido en `:96` y `:98`). **No cubre el color**, que esta tanda no toca (Q1) |
| **Dónde** | `ambientalia-desk.ambientalia.cloud` (⚠️ el CI no despliega, sólo verifica) |
| **Dueño y registro** | Quien verifique el despliegue. Se anota con **dueño, resultado y fecha** |
| **Por qué no es tarea de la tanda** | `ClienteDetalle.tsx` es `.tsx` y queda fuera de la red de pruebas por decisión de Gerencia (`vitest.config.ts:16`, `:17-20`; F0-00). **No describe trabajo que una tanda pueda hacer en este repositorio**: no admite aserción automatizada aquí, y fingir una sería instalar lo que Gerencia prohibió |

---

## 13 · Ronda de preguntas — RESPONDIDA por Gerencia (2026-09-12)

`execution_mode: interactive`. Las cinco preguntas de la ronda están **contestadas**. Q1 respondió
**NO** al supuesto y **redujo el alcance**; el resto de la propuesta ya refleja las cinco.

| # | Pregunta | Respuesta de Gerencia | Dónde queda |
|---|---|---|---|
| **Q1** | ¿«Por Entregar» debe pintar ámbar, como las otras diez esperas? | **NO, y el predicado extraído no decide color.** Tres razones: no es un atasco; contradiría al propio tablero, que pinta `Por Entregar` en **azul** desde el mapa explícito de `TicketCard.tsx:21`; y color y clasificación son dos nociones distintas — `ClienteDetalle.tsx:18` clasifica, `:22` y `TicketDetailView.tsx:245` pintan | **Reduce el alcance**: §2, §3 Pieza 2, §3 Pieza 4, §5, §11, §12, §14 y §15 |
| **Q2** | ¿Alguien lee «abiertos» y «en espera» como KPI? | **No, y con evidencia en vez de con «nadie las lee».** Medido con `grep -rn "ESTADOS_EN_ESPERA" packages/ apps/`, con `ESTADOS_SIN_SALIDA` como control positivo: fuera de `packages/shared` los únicos consumos son `boardView.ts:2` (import) y `:39` (uso); el resto son pruebas (`estados.test.ts:3`, `:85`, `:158`; `sla.test.ts:3`, `:52`) o la definición (`estados.ts:114`). **El salto nueve→once no mueve ningún KPI: mueve dos vistas** | Se anuncia en el paquete de despliegue |
| **Q3** | ¿Se ajusta también Zoho? | **No**, y la razón no es de autoridad: **Zoho es el sistema que este proyecto va a sustituir, así que configurarlo es trabajo que se tira**. La divergencia se declara en la spec, con su medición del 11/09 | §1 y R-6 |
| **Q4** | ¿Basta la comprobación visual? | **Sí, con dueño, resultado y fecha** — y **cubre sólo la mitad de clasificación**, porque IV-9 ya no se cierra entero: el color no se toca | §12 |
| **Q5** | ¿Una sola tanda bajo 800 líneas? | **Sí, con una condición operativa que no es opcional:** la planificación se **commitea antes de que el intento adquiera**. Medido: es lo que hizo que `vista-todos-y-estados-en-espera` midiera **542** líneas y no ~1.900 | R-4 y §15, primera casilla |

**Pregunta de negocio aparte, del §8** (no condiciona esta propuesta, y va a Gerencia por su propio
canal): ¿`liberacion_sin_factura` debe pedir también `'Fecha de aviso al cliente'`, para que la rama
sin factura abra el bodegaje que luego cierra?

---

## 14 · Plan de reversión

Las dos piezas son independientes y se revierten por separado.

| Pieza | Reversión |
|---|---|
| 1 (clasificación) | Devolver las dos entradas a `'ninguna'` y a su posición en el bloque `ninguna`, y las tres pruebas a su redacción anterior. **Sin efecto en datos**: la clasificación es un dato en código, no una columna |
| 2 (predicado) | `git revert` del módulo y de sus **dos** consumos. `boardView.ts:39` vuelve a tener el cast en línea y `ClienteDetalle.tsx:18` su regex. **`ClienteDetalle.tsx:22` y `TicketDetailView.tsx:245` no hay que revertirlos: no se tocaron** |
| 3-6 (comentario, barrido, IV-9, nombre) | Documentación y prosa de pruebas. Revertibles por separado, sin efecto de ejecución |

Ninguna pieza toca el esquema de base de datos, ni escribe hacia Zoho, ni depende de `ENABLE_WRITES`.

---

## 15 · Criterios de aceptación

- [ ] **PRECONDICIÓN DE ENTREGA, primero de todo:** `proposal.md`, el delta spec, `design.md` y
      `tasks.md` están **commiteados antes de que el intento de `sdd-apply` adquiera** (R-4).
- [ ] `CLASIFICACION_EN_ESPERA` clasifica `Por Entregar` y `Por Entregar / Sin facturar` como
      `'externa'`, y las dos entradas están **dentro del bloque `externa`**, no en el de `ninguna`.
- [ ] `ESTADOS_EN_ESPERA` tiene **once** entradas, y el array esperado de `estados.test.ts:85` se fijó
      contra la salida del filtro, no al revés.
- [ ] Existe la prueba del §4(b) y **se escribió antes** de tocar `estados.ts`.
- [ ] El predicado vive en un solo módulo con prueba propia, y lo usan los **dos** consumidores que
      CLASIFICAN: `boardView.ts:39` y `ClienteDetalle.tsx:18`.
- [ ] **Quedan EXACTAMENTE DOS** ocurrencias de `/espera/i` o `/espera|hold/i` en `apps/desk/src`
      —`ClienteDetalle.tsx:22` y `TicketDetailView.tsx:245`, las dos de color—, comprobado con `grep`
      y su control positivo. **El criterio afirma el número exacto, no «ninguna» ni «las que sea»**:
      un detector que acepte cualquier resto no distingue la tanda hecha de la tanda que se pasó de
      frenada (mutación M6).
- [ ] `ClienteDetalle.tsx` lleva **un comentario que declara deliberada** la divergencia entre `:18`
      (registro) y `:22` (color), con su porqué. Sin él, el siguiente lector las unifica.
- [ ] El barrido corrió con **los dos** detectores, y se comprobó que el de palabra se deja
      `estados.ts:21`.
- [ ] Las siete líneas de `transitions-st/spec.md` que dicen «nueve» sobre esta lista quedan
      corregidas por el delta spec; `:723` **sigue intacta**.
- [ ] `sla.test.ts:52` **verde, comprobado corriendo la suite**, no razonado.
- [ ] `estados.test.ts:71` ya no afirma una cuenta caduca.
- [ ] IV-9 **sigue viva** en `CLAUDE.md:206` y en `openspec/config.yaml` (`:738`, `:740`, `:755`,
      `:784`), con el alcance reducido a **dos** supervivientes, **las dos de color**, y su medición
      al día (2 de once; nueve escapados). Ni cerrada ni con el texto viejo.
- [ ] El hallazgo 2 del §8 —el color desde una sola fuente— queda anotado **con destino pendiente**,
      sin épica asignada de memoria.
- [ ] Las tres filas de la tabla de la regla 13 (§5) están comprobadas línea a línea, no de memoria.
- [ ] Las seis mutaciones del §6 se **ejecutaron**, con sus controles.
- [ ] `npm test`, `npm run typecheck`, `npm run lint` y `npm run build` en verde; `lint` sin superar
      los 158 avisos del trinquete (`.github/workflows/ci.yml:41`).
- [ ] La tarea de persona del §12 está **fuera** del recuento de `tasks.md`, con dueño, destino y la
      frase de que **archivar no la da por hecha**; y cubre **sólo** la mitad de clasificación.

---

## 16 · Dependencias

- **Ninguna bloqueante.** El registro (`estados.ts:114`) y el consumo del tablero (`boardView.ts:39`)
  existen desde F1B-08, y la decisión de Gerencia está cerrada (Engram `decision/por-entregar-es-espera`,
  obs. 494, 2026-09-12).
- **Acopla con `vistas-tablero`** en un punto: RQ-VT-04 cita la línea exacta que la Pieza 2 mueve
  (R-2). No la bloquea.
- **No depende** del punto abierto nº 52 ni de la titularidad OV↔equipo.
