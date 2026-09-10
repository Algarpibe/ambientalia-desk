# Puntos para Gerencia — sesión del viernes 11/09/2026

Un solo documento con lo que ya está escrito y espera decisión. **No propone respuestas técnicas
disfrazadas de opciones**: cada punto expone las salidas que la documentación del proyecto ya deriva,
con su coste, y dice quién decide.

| | |
|---|---|
| **Base** | rama `main`, commit `b3fc829`, 2026-09-10 |
| **Fuentes primarias** | `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.1.md`; `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md`; el código del repositorio |
| **Qué NO hace** | no edita el plan, no reordena tandas, no cambia gates y no toca el `.docx` del maestro. Es texto para decidir y, donde procede, para pegar |

**Nota de método.** Toda afirmación sobre el código lleva ruta y línea; toda afirmación sobre el
maestro lleva línea del `.md` citable. Las citas del **acta del 03/09** que aparecen abajo llegan a
través de `docs/sdd/F0-01_Correcciones_para_el_plan.md` y **no se han comprobado contra el acta
original**: van marcadas como *(cita de segunda mano)*. Las del maestro y las del plan sí se leyeron
directamente.

---

## 1 · Punto abierto nº 38 — las dos salidas de `Verificación` (corrección C12)

**Decide: Gustavo / Calidad, con Servicio Técnico.** Así lo asigna el Anexo D del maestro
(`R08.1.md:4002-4005`: nº 38 · «M1.4 · C12» · «Gustavo / Calidad»).

**El hecho.** En el flujo de **equipo nuevo**, el estado `Verificación` no tiene ninguna transición de
salida. `R08.1.md:1469`: «Es el quinto estado sin salida del sistema, y el más incómodo de los cinco
[…]. Un equipo nuevo enviado a verificación de calidad no puede volver al flujo, ni aprobado ni
rechazado.»

**Hay una pregunta previa, y la contesta Servicio Técnico.** `R08.1.md:1468` la deja abierta: «puede
ser que el retorno exista en la práctica y no esté modelado, o que la etapa se use como registro y no
como paso del flujo». Si `Verificación` **se usa como registro**, no es un estado del grafo y el
arreglo es **un campo, no dos transiciones**: las opciones de abajo desaparecen.

**Si es un paso del flujo, la salida «aprobada» tiene dos destinos y el maestro no elige.**
`R08.1.md:1470` propone «devuelve a `En Proceso` **o** pasa a `Finalizado`».

| Salida «aprobada» | Qué significa | Consecuencia |
|---|---|---|
| `Verificación → En Proceso` | La verificación es un control **intermedio**: se aprueba y el equipo sigue trabajándose | El equipo pasa por `Liberación` después. Hay una etapa más antes de terminar |
| `Verificación → Finalizado` | La verificación es el **último** control: aprobar es terminar | Se salta `Liberación`, que hoy es la que cierra el flujo |

**La salida «rechazada» no es una elección, es una confirmación.** El maestro sí se moja
(`R08.1.md:1470`): «debería entroncar con el bucle de producto no conforme». Sólo hay que confirmar
que entra por `Notificado`, que es donde ese bucle empieza.

**Qué está parado mientras siga abierto.**

- **F1A-03** — es la tanda que declara estas dos salidas. Se ejecutó, no escribió código y devolvió el
  punto.
- **F1B-06** — implementa los blueprints de equipo nuevo y soporte remoto y **hereda** C12. Sin la
  decisión construiría el flujo con el mismo agujero que tiene hoy.
- **C6** (QA antes de la liberación) — `R08.1.md:1472`: «La corrección C6 […] puede modelarse sobre
  ella en lugar de diseñarla de cero, **siempre que se resuelva primero su falta de salida**.»

**Por qué ahora y no después.** La rama de equipo nuevo no está construida, así que hoy la corrección
es escribir dos filas en una tabla. Después de F1B-06 sería cambiar una máquina de estados con tickets
vivos dentro.

**Además, un acto de registro.** El plan da hoy a esta tanda un gate que no tiene. `plan:140`:

```
| F1A-03 | **C12** Salidas aprobada/rechazada de `Verificación` … | M1.4 · P38 | Ninguno; se hace antes de F1B-06 |
```

El punto no es «Ninguno»: es de Calidad y está abierto. **Texto propuesto para la columna Gate:**

```
Gustavo / Calidad · Anexo D nº 38 (ABIERTO). Se hace antes de F1B-06, que la hereda
```

*(El dato se perdió en un salto de documento: el punto llegó a la convocatoria del 03/09 bajo el
encabezado «Cierran sin discusión — las ejecuta desarrollo», con la casilla sin marcar, y de ahí pasó
al plan como gate vacío — cita de segunda mano, vía `F0-01_Correcciones_para_el_plan.md:96-100`. El
Anexo D siempre lo tuvo bien.)*

---

## 2 · Punto abierto nº 52 — la cardinalidad OV ↔ ticket

**Decide: Gerencia.** Hoy **no está en ninguna fila** de la tabla de decisiones del plan
(`plan:348-359`, doce filas), así que **ni siquiera llega a la agenda del viernes** si no se añade.

**La cita, del maestro y no de segunda mano.** `R08.1.md:2070` introduce: «Y tiene que soportar las
variantes reales que se dan hoy». Sigue una tabla de tres filas (`:2071-2078`) y una conclusión
(`:2079`):

| Variante | Se da en |
|---|---|
| OV separadas por mano de obra y por repuestos | Clientes que compran los dos conceptos aparte |
| OV global por varios equipos | Ingresos por lote |
| Varias OV asociadas a un mismo ticket | Servicios ampliados sobre la marcha |

> `R08.1.md:2079` — «Ninguna de las tres encaja en un modelo de «una OV, un ticket», y las tres son
> habituales. Punto abierto nº 52.»

**⚠️ La corrección que hay que llevar a la sesión: el maestro habla de CARDINALIDAD, no de
TITULARIDAD.** Dice cuántos tickets puede tener una OV y al revés. **No dice** que la OV y el equipo
puedan ser de clientes distintos. Atribuirle eso sería una cita de segunda mano, y el proyecto ya lo
declaró por escrito al cerrar la tanda anterior
(`openspec/changes/archive/2026-09-09-cerrar-hallazgos-revision-f1b-01/design.md:72-73`). Importa
porque hay una guarda viva que rechaza altas por discrepancia de cliente, y su justificación **no
puede apoyarse en nº 52**.

**El giro que hace urgente decidir.** El código **ya impone** «una OV, un ticket» en dos puertas
(`apps/desk/server/services/ticketService.ts:45` en el alta y `:128` en `habilitar_servicio`), y deja
una tercera sin comprobar (`apps/desk/server/routes/remision.ts:218-226`, el desvío IV-4).

| Salida | Qué hay que hacer | Coste |
|---|---|---|
| **(a) A favor de las tres variantes** | **RETIRAR** las dos puertas que ya existen. No construir la tercera | Trabajo ya hecho que se deshace. Nada que construir |
| **(b) A favor de «una OV, un ticket»** | **CONSTRUIR** la tercera puerta en el alta de remisión | El `it.fails` que ya espera (`apps/desk/server/ordenVentaUnTicket.test.ts:161`) se pone verde |

**Construir la tercera antes de decidir cuesta el doble**, porque si la decisión va en la dirección (a)
hay que retirarla acto seguido. Y lo medido no se pierde en ninguno de los dos casos: la prueba que fija
el daño observable de hoy está escrita en positivo (`ordenVentaUnTicket.test.ts:141-159`).

**Acto de registro, vaya como vaya.** Añadir a la tabla de decisiones del plan:

```
| decision/n52-cardinalidad-ov | Cuántos tickets puede tener una OV, y al revés: las tres variantes de R08.1.md:2071-2079 | Cierra IV-4 (tercera puerta) en una u otra dirección | Por fijar |
```

*No lo cubre `decision/p21-ingreso-sin-ov` (`plan:349`): P21 pregunta **si la OV es obligatoria al
inicio**, no **cuántos tickets puede tener una OV**.*

---

## 3 · La vista «Todos» del tablero

**Decide: Gerencia. La elección no es técnica** — las dos salidas son correctas y difieren en a quién
se ajusta el tablero.

**El hecho.** `apps/desk/src/lib/boardView.ts:49-50`:

```ts
    case 'todos':
    default: return tickets.filter((t) => t.statusType !== 'Closed')
```

La vista que el usuario ve rotulada **«Todos los Tickets»** (`boardView.ts:7`) **no enseña todos**:
oculta los cerrados. Medido en el Zoho Desk de producción: **726 tickets cerrados**.

| Salida | Qué gana | Qué cuesta |
|---|---|---|
| **(a) Renombrar la vista a «Abiertos»** | Altera menos lo que el equipo tiene aprendido. El rótulo deja de mentir. Cambia una cadena de texto | Los 726 cerrados siguen sin vista propia que los ofrezca por omisión |
| **(b) Cambiar lo que devuelve** | Cumple la expectativa del usuario y la vista homónima de Zoho Desk | Mete **726 cerrados** en el tablero por omisión, en cada carga |

**Hay una tercera cosa, y no es opcional en ninguno de los dos casos.** `case 'todos':` no tiene cuerpo
propio: cae en `default:`. Cualquier clave de vista no reconocida recibe **el mismo filtro y el mismo
rótulo** (`boardView.ts:22` devuelve «Todos los Tickets» como respaldo). Eso es defecto se elija (a) o
(b), y se arregla en la misma tanda.

**Contexto que conviene tener a la vista, aunque no se decide aquí.** La clasificación de esperas del
tablero se hace por expresión regular sobre el nombre del estado (`boardView.ts:35`, `/espera/i`), y
acierta **2 de los 8** estados `en_espera` sin ningún falso positivo. Consecuencia hoy: **seis estados
de espera se listan como «abiertos»** (`Servicio externo`, `Notificación cliente`, `Notificación a
Compras`, `Notificación Comercial`, `Solicitado`, `Liberación Comercial`). Es un arreglo técnico sin
decisión pendiente —sustituir la regex por `ESTADOS_EN_ESPERA`, que ya existe en
`packages/shared/src/estados.ts:111`— y va en la misma tanda, **F1B-08**.

**Acto de registro.** Añadir a la tabla de decisiones del plan:

```
| decision/vista-todos-tablero | «Todos» se renombra a «Abiertos», o pasa a devolver también los cerrados | Desbloquea IV-7 dentro de F1B-08 | 11/09 |
```

---

## 4 · IV-2 — ¿impone el servidor las tres fechas de `valoresTransicion.ts`?

**Decide: Gerencia. Ninguna tanda del plan lo cubre**, y eso no es una fila que falte: es que nadie ha
decidido de qué clase es esta pieza.

**El hecho.** `apps/desk/src/lib/valoresTransicion.ts` deriva tres fechas y las enseña bloqueadas en el
formulario de transición:

| Fecha | De dónde sale | Línea |
|---|---|---|
| `Fecha creación ticket` | `ticket.createdAt`, convertido a día local | `:62-64` |
| `Fecha Remisión Entrada` | la fecha de la remisión de entrada vigente | `:65-67` (con `:56`) |
| `Fecha Revisión Informe` | `ticket.escaladoARevisionAt` | `:72-74` |

**Verificado: ninguna línea del servidor las impone.** Se buscaron los tres nombres de campo y sus tres
columnas en `apps/desk/server` y en `packages/shared`. En `apps/desk/server` sólo aparecen en dos
fixtures de prueba y en un comentario. Lo único que el servidor hace es **exigir que lleguen**:
`apps/desk/server/transitionExec.ts:77` rechaza la transición si un campo obligatorio viene vacío. Pero
**no calcula el valor**: si el navegador manda una fecha equivocada —o si la manda otro cliente— el
servidor la acepta.

**Por qué no es cosmético.** `Fecha Remisión Entrada` es el **operando que abre el bodegaje de
entrada**, uno de los tres KPI de M1.10: `packages/shared/src/bodegaje.ts:58-65` define la clase
`entrada` como `abre: 'Fecha Remisión Entrada'` y `cierra: 'Fecha Orden De Venta'`. Un valor mal
derivado es un KPI mal calculado, en silencio.

Es exactamente el punto 2 de la **regla invariable 13** del proyecto: una decisión sin contrapartida
en el servidor no es un espejo, es la guarda — y vive donde no se puede confiar en ella.

| Salida | Qué significa | Qué cuesta |
|---|---|---|
| **(a) El servidor las impone** | La derivación se mueve al servidor; los tres valores no pueden llegar mal desde ningún cliente | Trabajo de servidor que hoy no está en ninguna tanda. Hay que crearle sitio en el plan |
| **(b) Se declaran prellenado** | Se acepta que son una comodidad del formulario, y **las specs de KPI dicen que su fuente es opcional** | Gratis hoy. El KPI de bodegaje de entrada arrastra esa reserva de forma permanente |

**No decidir deja la pieza donde está**, con el rótulo de regla de dominio y sin serlo.

---

## 5 · IV-8 — la orden de venta sigue sin contrastarse (`ticketService.ts:39`)

**Punto abierto sin destino, a propósito.** No hay que decidirlo el viernes; hay que saber que está y
por qué se dejó así.

**El hecho, con las dos líneas separadas** —porque se prestan a confusión:

```ts
:38      salesorderId = ov.id
:39      clientId = clientId ?? ov.clientId ?? null
```

El desvío está en **`:39`**, no en `:38`. Al completar el cliente desde la orden de venta, si el cuerpo
de la petición **ya trae** su propio `clientId`, el de la OV **no se contrasta con nada**. Un ticket
puede quedar con cliente y equipo de un lado y la orden de venta de otro, sin ningún aviso.

**No lo cubre la guarda nueva.** La guarda equipo↔cliente que se añadió el 09/09
(`ticketService.ts:65-77`) compara el `clientId` **final** contra `equipo.clientId`, no contra
`ov.clientId`. Esa pareja queda fuera de su alcance **a propósito**, y así lo pidió el criterio de
aceptación nº 8 de aquella tanda: que el desvío quedara **anotado, con su porqué y sin destino
inventado**.

**Por qué se dejó abierto y no se cerró.** Es la misma familia que el punto 2 de este documento: cerrar
`:39` endurecería la regla «una OV, un ticket» **antes** de que Gerencia resuelva nº 52. Si nº 52 se
resuelve a favor de las variantes, lo correcto será retirar puertas, no añadirlas.

**Consecuencia práctica para la sesión:** IV-8 no tiene decisión propia. **Se resuelve solo el día que
se decida nº 52**, y en la dirección que nº 52 marque.

---

## 6 · Las cinco entradas de `F0-01_Correcciones_para_el_plan.md`

Texto listo para pegar en el plan. **El plan lo mantiene Gerencia y ninguna tanda lo edita por su
cuenta**, por eso llega como propuesta y no como parche. Un error de cita en el maestro es una errata;
un error de cita en el plan es *una tanda que se ejecuta creyendo tener una autoridad que no tiene*.

### Entrada 1 · El plan cita el acta del 03/09 como fuente de C11, y la sesión nunca trató C11 *(F1A-02)*

`plan:139` da a F1A-02 la fuente «M1.7 · P40 · **acta 03/09 (ampliada)**». La ampliación no sale del
acta: sale de la **convocatoria**, escrita antes de la sesión *(cita de segunda mano)*. La autoridad
real está en el maestro, en tres sitios: `R08.1.md:1572-1575`, `:4561` (Anexo H) y `:4780`.

**Qué hacer:** sustituir la columna Fuente de `plan:139` por
`M1.7 (R08.1.md:1570-1575) · P40 · Anexo H (:4561)`, y **quitar «acta 03/09 (ampliada)»**.

**Por qué importa más que una errata:** `:1575` es la línea que resuelve el escalado. Al citar el acta
en vez del maestro se llega al tema por el camino que no la contiene, y la primera lectura de F1A-02
dio por bloqueado el escalado «porque no hay jerarquía» — cuando la línea siguiente a la citada dice
que no hace falta ninguna.

### Entrada 2 · El plan da a F1A-03 un gate que no tiene *(F1A-03)*

Es el punto 1 de este documento. **Qué hacer:** cambiar la columna Gate de `plan:140` por
`Gustavo / Calidad · Anexo D nº 38 (ABIERTO). Se hace antes de F1B-06, que la hereda`.

### Entrada 3 · El plan manda anclar el bodegaje de entrada en un hito que la R08 sustituyó *(F1A-04)*

`plan:141` mete **dos tríos distintos en una sola instrucción**. Los tres **bodegajes** (M1.10) son
**parejas de campos de fecha** —el de entrada es `Fecha Orden De Venta − Fecha Remisión Entrada`—,
mientras que los tres **indicadores** rotos (56, 48, 49) sí van sobre la marca de tiempo de la
transición. «Contra la marca de tiempo de `Ingreso a Servicio`» es texto de la **R05** que la **R08
sustituyó para el bodegaje**: el periodo abre cuando *el equipo llega a las instalaciones*, no cuando
alguien pulsa el botón.

**Qué hacer:** sustituir la columna Contenido de `plan:141` por
`**C9** (parte técnica) Los tres bodegajes de M1.10 (:1685-1702) calculados sobre ticket_transitions;
reanclar los indicadores 48 y 49 en la marca de «Ingreso a Servicio»; añadir el campo «fecha de aviso
al cliente»`.

**Por qué importa:** implementada al pie de la letra, la frase del plan **habría vuelto a romper el
bodegaje de entrada** — mediría cuándo se registró la llegada en la app, que desde el alta anticipada
de Comercial no es cuándo llegó el equipo. Es exactamente la avería que C9 existe para arreglar.

### Entrada 4 · Dos tandas de auditoría dimensionadas sobre un generador que no existe *(F1A-05)*

`plan:388` declara el artefacto `docs/artefactos/blueprintserviciotecnico.html` «Vigente» y dice que
«se regenera en cada tanda `audit-*`». **No hay generador en el repositorio**: `scripts/` contiene un
solo fichero, `docx2md.sh`. Y F1A-05 aportó el dato que faltaba: **la auditoría se hizo sin el
artefacto**, leyendo el código, y salieron **cinco hallazgos nuevos**. Eso separa dos funciones que
`plan:388` confundía: **auditar el flujo** (se cumple sin el artefacto) y ser **la fuente gráfica de
§M1.3 para personas** (no la cumple nada más). El maestro declara esa segunda función en el Anexo F
(`R08.1.md:4272`), así que no es un punto abierto: es algo que el proyecto dijo que quería.

**Qué hacer — tres cambios:**
1. `plan:388` → Estado «CADUCO — describe el flujo anterior a C1, C11 y C9»; Notas «NO tiene generador
   en el repositorio: no se regenera».
2. Gate de `plan:142` (F1A-05) y `plan:158` (F1B-09) → «Ninguno. NO regenera `docs/artefactos/` (no hay
   generador); audita leyendo el código».
3. **Añadir una tanda nueva para el generador del mapa visual**, sin dimensionar y sin semana, hasta
   que Gerencia decida si sigue queriendo el artefacto que el Anexo F declara.

**Por qué importa:** sin corregirlo, **F1B-09 hereda la fila entera** en la semana S44 —mismo gate
vacío, misma talla S, mismo generador inexistente— y con la extensión a dos flujos más.

### Entrada 5 · El plan no tiene sitio para el contrato de errores ni para dos decisiones que sus tandas necesitan

Tres huecos que destapó el mismo barrido, de dos clases distintas: **una fila que falta** y **dos
decisiones que no llegan a la agenda**.

**5.a — Falta una fila: el contrato de errores del motor no tiene tanda.** Las dos puertas del motor
evalúan la misma regla en órdenes opuestos: en el alta gana el `409` de la orden de venta; en
`habilitar_servicio` ganan los `422` de obligatorios. Y hay una segunda inversión hermana: el `409` de
estado contesta antes que el `403` de área. Las specs lo declaran y añaden que **corregir una sin la
otra deja el problema**. Ninguna fila del plan lo cubre.

*Talla cuantificada, no prometida:* hay **12 pruebas de precedencia** en el fichero del motor. Dos
tienen títulos literalmente opuestos y las dos están en verde, así que **una cambia sí o sí**. Bajo el
orden natural cambian **6 de 12**, y tres de ellas alteran **qué error ve el usuario** en el panel de
transiciones, que se usa a diario. **No es una talla XS.**

**Qué hacer:** añadir una tanda **F1B-10** — «Orden único de precedencia entre guardas en las dos
puertas del motor y en la del alta de remisión» — con talla **M** y sin gate técnico: el orden se
declara en la spec.

**5.b — Falta una decisión: la cardinalidad OV ↔ ticket.** Es el punto 2 de este documento.

**5.c — Falta una decisión: qué debe enseñar la vista «Todos».** Es el punto 3 de este documento.

**Y la regla de método que salió de ahí**, ya escrita en `CLAUDE.md`: al cerrar una épica, barrer los
desvíos que la nombraban y reasignarlos en el mismo acto. Un destino que nombra una épica cerrada no
es un destino, y el registro sigue diciendo que sí lo tiene — en cada sesión y en cada sub-agente.

---

## Resumen: qué sale de la sesión

| # | Punto | Quién decide | Si no se decide |
|---|---|---|---|
| 1 | nº 38 · las dos salidas de `Verificación` | Gustavo / Calidad, tras la respuesta de Servicio Técnico | F1A-03 sigue parada; F1B-06 construiría el flujo con el agujero dentro; C6 no se puede modelar |
| 2 | nº 52 · cardinalidad OV ↔ ticket | Gerencia | IV-4 e IV-8 siguen abiertos, y cualquier trabajo sobre esas puertas puede ir en la dirección equivocada |
| 3 | La vista «Todos» del tablero | Gerencia | F1B-08 no puede cerrar IV-7 |
| 4 | IV-2 · quién impone las tres fechas | Gerencia | La derivación sigue viviendo sólo en el navegador, y es operando de KPI |
| 5 | IV-8 · `ticketService.ts:39` | — (se resuelve con nº 52) | Nada nuevo; queda anotado |
| 6 | Las cinco entradas de `F0-01` | Gerencia (mantiene el plan) | El plan sigue mandando sobre fuentes que no dicen lo que se le atribuye |

**Dos filas nuevas para la tabla de decisiones del plan** (`plan:348-359`, hoy doce filas, ninguna sobre
estos dos puntos):

```
| decision/n52-cardinalidad-ov  | Cuántos tickets puede tener una OV, y al revés: las tres variantes de R08.1.md:2071-2079 | Cierra IV-4 (tercera puerta) en una u otra dirección | Por fijar |
| decision/vista-todos-tablero  | «Todos» se renombra a «Abiertos», o pasa a devolver también los cerrados | Desbloquea IV-7 dentro de F1B-08 | 11/09 |
```
