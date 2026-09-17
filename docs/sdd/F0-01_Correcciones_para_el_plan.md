# Correcciones para el plan de fases y tandas R01.1

> **Por qué existe este fichero, y por qué es distinto del del maestro.** El maestro es la fuente de
> lo que hay que construir; el plan (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md`) es el
> documento que **ordena el trabajo**: dice qué tanda va antes, de dónde sale cada una y qué gate la
> bloquea. Un error de cita en el maestro es una errata que se corrige cuando toque. Un error de cita
> en el plan es una tanda que se ejecuta creyendo tener una autoridad que no tiene.
>
> Igual que el del maestro, esto es **texto listo para pegar**, no un parche: el plan es un `.md` del
> repositorio, pero lo mantiene Gerencia y ninguna tanda lo edita por su cuenta.

| Dato | Valor |
|---|---|
| Documento corregido | `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md` |
| Tanda que abre el fichero | **F1A-02** (entrada 1) |
| Entradas posteriores | **F1A-03** (entrada 2) · **F1A-04** (entrada 3) · **F1A-05** (entrada 4) · **barrido de desvíos** (entrada 5) |
| Base | commit `6ea3ca8` para la entrada 1; `5218d11` para las entradas 2 y 3; `43821b8` para la entrada 4; `607e26a` para la entrada 5. Rama `main`. **Las citas de línea al plan (`plan:NNN` y `…ClaudeCode_R01.1.md:NNN`) de este documento se leen contra el plan en `a5da6b8` (539 líneas), NO contra el de hoy** (caso B/C de la regla de mutación 4 de `CLAUDE.md`): el plan creció a 598 líneas el 2026-09-17 al sincronizarse con el libro R01.3, y renumerarlas volvería falsas las frases que citan texto ya corregido. |
| Fuentes del contraste | `docs/Manifesto/Desk2.0_Acta_Sesion_2026-09-03.md` (480 líneas) · maestro `R08.1.md` |
| Fecha | 2026-09-09 |

---

## La de F1A-02 (1)

### 1 · El plan cita el acta del 03/09 como fuente de C11, y la sesión nunca trató C11 *(F1A-02)*

**Texto actual**, `plan:139`:

> `| F1A-02 | **C11** SLA de un día sobre Notificado, con correo redundante al cambiar de área y`
> `escalado al superior | M1.7 · P40 · **acta 03/09 (ampliada)** | Ninguno |`

**El problema.** La ampliación de C11 —correo redundante y escalado al superior— **no sale del acta**.
Sale de la **convocatoria**, que es la parte II del mismo fichero y se escribió **antes** de la
sesión:

> `acta:140` — «**C11** — SLA de un día sobre Notificado (P40). Existe en Zoho y no se implementó.
> **Ampliada: correo redundante al cambiar de área y escalado al inmediato superior.**»

Esa línea está en `II.2 · Bloque 2`, bajo el encabezado «Cierran sin discusión — las ejecuta
desarrollo», y **la casilla está sin marcar**. Es un tema que alguien quiso llevar a la mesa, no una
decisión. Es exactamente la regla que F0-03 aplicó a P10 y P62 al cargarlos como `punto-abierto/*` y
no como `decision/*`: **una casilla del orden del día no es una decisión, ni siquiera marcada.**

**Verificado por comando.** La parte III —el acta propiamente dicha, `:268-480`— **no menciona C11 ni
una sola vez**. Filtrando ese rango y contando: `C11` da **0** y `escalado` da **0**.

> ⚠️ **Cuidado con buscar «sla» sin distinguir mayúsculas sobre la parte III: da dos ocurrencias y
> las dos son falsas.** Casan dentro de «tra**sla**da»: `:437` («la sesión de seguimiento se traslada
> al viernes») y `:442` («Trasladar la siguiente sesión»). Ninguna es un SLA. Es la clase de
> comprobación que parece respaldar justo lo contrario de lo que dice.

**Dónde está la autoridad de verdad: en el maestro, no en el acta.** La ampliación es doctrina de la
**R08**, y está escrita en tres sitios:

| Línea | Qué dice |
|---|---|
| `R08.1.md:1572-1575` | «Ampliación del revisor [R08]. El SLA no debería limitarse a marcar el retraso, sino escalarlo. **Dos piezas:** … aviso redundante por correo cuando una transición cambia de área … escalado jerárquico al superarse el SLA … **Encaja con la derivación de M1.9.2**, que ya sabe a qué cargo corresponde cada etapa» |
| `R08.1.md:4561` | Anexo H: «Pendiente. **Ampliada en la R08:** correo redundante y escalado al superior» |
| `R08.1.md:4780` | «**Ampliada la corrección C11:** correo redundante y escalado jerárquico apoyado en la derivación por cargo» |

**Texto propuesto para `plan:139`:** sustituir la columna Fuente por

> `M1.7 (R08.1.md:1570-1575) · P40 · Anexo H (:4561)`

y **quitar «acta 03/09 (ampliada)»**. La ampliación la firma la R08, no la sesión.

**Por qué importa más que una errata.** F1A-02 se ejecutó creyendo que la ampliación venía de una
sesión donde tres personas la habían acordado. Venía de una casilla sin marcar de un orden del día.
El resultado técnico no cambia —la R08 sí la respalda—, pero la cadena de autoridad sí: si la única
fuente hubiera sido esa casilla, C11 tendría que haber vuelto al Anexo D como P10 y P62.

Y hay una consecuencia que sí cambió el trabajo: **`:1575` es la línea que resuelve el escalado**, y
al citar el acta en vez del maestro se llega al tema por el camino que no la contiene. La primera
lectura de F1A-02 dio por bloqueado el escalado «porque no hay jerarquía»; la línea siguiente a la
que se citó dice que no hace falta ninguna. Anotado en `openspec/specs/transitions-st/spec.md` §3.10.

---

## La de F1A-03 (2)

### 2 · El plan da a F1A-03 un gate que no tiene: la decisión de C12 está abierta y es de Calidad *(F1A-03)*

**Texto actual**, `plan:140`:

> `| F1A-03 | **C12** Salidas aprobada/rechazada de `Verificación` en el flujo de equipo nuevo |`
> `M1.4 · P38 | **Ninguno**; se hace antes de F1B-06 |`

**El problema no es dónde va la tanda, es que no tiene dueño.** F1A-03 se paró sin escribir código, y
la primera explicación que se dio —«C12 pertenece a F1B-06»— era **falsa**: `plan:155` dice que
F1B-06 «**hereda** C12», o sea que implementa lo que C12 define, y `maestro:1470` dice que C12 es
«definir las dos salidas […] **antes de implementar esta rama**». **C12 precede a F1B-06, no es
suya.** Lo que le falta a C12 no es un sitio: es la decisión.

**El defecto se sigue por tres documentos, y en cada salto pierde un dato.**

| # | Documento | Qué dice | Qué se pierde |
|---|---|---|---|
| 1 | `acta:136` + `:139` | C12 aparece bajo el encabezado «**Cierran sin discusión — las ejecuta desarrollo**», con la casilla **sin marcar** | Que no es de desarrollo |
| 2 | `maestro:4002-4005` | Anexo D nº 38: «Definir las dos salidas de Verificación en equipo nuevo —aprobada y rechazada— antes de implementar la rama. M1.4 · C12. **Gustavo / Calidad**» | Nada: aquí el dato está bien. Es el que los otros dos no recogen |
| 3 | `plan:140` | Copia la lectura del acta: «Gate: **Ninguno**» | El dueño y el estado del punto |

Y hay una cuarta línea que lo contradice todo desde el propio maestro, `:1468`:

> «**Pendiente de validar con Servicio Técnico** cuál es el comportamiento real de esta etapa **antes
> de definir sus salidas**: puede ser que el retorno exista en la práctica y no esté modelado, o que
> la etapa se use como registro y no como paso del flujo. Punto abierto nº 38.»

Es la misma clase de fallo que la entrada 1, y por eso van en el mismo fichero: **una casilla del
orden del día no es una decisión, ni siquiera marcada.** Allí una convocatoria se citó como acta;
aquí un encabezado de convocatoria («las ejecuta desarrollo») se convirtió en un gate vacío.

**Texto propuesto para `plan:140`:** sustituir la columna Gate por

> `Gustavo / Calidad · Anexo D nº 38 (ABIERTO). Se hace antes de F1B-06, que la hereda`

**Y una consecuencia que el plan tampoco dice: la decisión está sin cerrar en su contenido, no sólo
sin firmar.** `maestro:1470` propone que «aprobada» «devuelve a `En Proceso` **o** pasa a
`Finalizado`» — dos destinos, sin elegir. Ver el punto de agenda en
`docs/sdd/F1A-03_Agenda_P38_Verificacion.md`.

---

## La de F1A-04 (3)

### 3 · El plan manda anclar el bodegaje de entrada en un hito que la R08 sustituyó *(F1A-04)*

**Texto actual**, `plan:141`:

> `| F1A-04 | **C9** (parte técnica) Recalcular bodegaje de entrada, inicio de servicio y diagnóstico`
> `**contra la marca de tiempo de `Ingreso a Servicio`**; añadir el campo «fecha de aviso al cliente» |`

**El problema.** Esa frase mete **dos tríos distintos en una sola instrucción**, y para uno de los
tres es la prescripción caducada:

| Trío | Qué es | Hito correcto |
|---|---|---|
| **Los tres bodegajes** (entrada, proceso, salida) | M1.10, `:1685-1702`, `[DEFINIDO — R08]` | **Pares de campos de fecha.** El de entrada es `Fecha Orden De Venta − Fecha Remisión Entrada` (`:1694`) |
| **Los tres indicadores rotos** (56 bodegaje, 48 inicio de servicio, 49 diagnóstico) | `:2330` | La marca de tiempo de la transición correspondiente |

«Contra la marca de tiempo de `Ingreso a Servicio`» es la vía que el maestro proponía en `:1684`
—texto de la **R05**—. La **R08** la sustituyó para el bodegaje: `:1692` dice que el periodo lo abre
«el equipo llega a las instalaciones», y eso es la **fecha de la remisión de entrada**, no el
instante en que alguien pulsó el botón. Los dos datos los escribe la MISMA transición
(`transitions.ts:190-191`), así que están a un carácter de distancia, y `:1705` explica por qué el
valor y no el clic: el indicador tiene que anclar «en dos hechos físicos y comerciales —el equipo
llegó, la OV se generó— que siguen significando lo mismo aunque cambie cuándo se abre el registro».

Para los indicadores **48 y 49** la instrucción del plan **sí es correcta**, y F1A-04 los ha dejado
atendidos exponiendo el hito (`bodegaje.ts`, `marcaIngresoAServicio`). No se han construido los
indicadores porque no existe módulo de KPIs: eso es F1C-06 y la spec `kpis`.

**Texto propuesto para `plan:141`:** sustituir la columna Contenido por

> `**C9** (parte técnica) Los tres bodegajes de M1.10 (:1685-1702) calculados sobre`
> `ticket_transitions; reanclar los indicadores 48 y 49 en la marca de «Ingreso a Servicio»;`
> `añadir el campo «fecha de aviso al cliente»`

**Por qué importa.** Implementada al pie de la letra, la frase del plan habría vuelto a romper el
bodegaje de entrada: mediría cuándo se registró la llegada en la app, que desde el alta anticipada de
Comercial no es cuándo llegó el equipo. Es exactamente la avería que C9 existe para arreglar.

---

## La de F1A-05 (4)

### 4 · Dos tandas de auditoría dimensionadas sobre un generador que no existe *(F1A-05)*

**Texto actual**, cuatro filas y una tabla de artefactos:

> `plan:142` — `| F1A-05 | Auditoría de blueprint tras las correcciones (audit-F1A) | M11.6 | — |`
> `plan:158` — `| F1B-09 | — | Auditoría de blueprint de los tres flujos (audit-F1B); extensión a equipo nuevo y soporte remoto como pide M11.6 | — |`
> `plan:412` — `| F1A-05 | audit-F1A | — | M11.6 | — | S | S38 |`
> `plan:421` — `| F1B-09 | audit-F1B | — | M11.6 | — | S | S44 |`
> `plan:388` — `| docs/artefactos/blueprintserviciotecnico.html | Mapa de transiciones generado con IA (auditoría R04) | Vigente | Se regenera en cada tanda audit-* |`

**El problema, en dos mitades que el plan trata como una sola.** `plan:388` da por hecho que el
artefacto «se regenera en cada tanda `audit-*`», y las tallas **S** de `:412` y `:421` se apoyan en
esa premisa. **No hay generador en el repositorio**: verificado en `docs/artefactos/NOTA.md:34-46` en `c45bcb1`
sobre el commit `a3a8f03`, y de nuevo en F1A-05 sobre `43821b8` —`scripts/` contiene un solo fichero,
`docx2md.sh`—. No se puede regenerar lo que no tiene generador.

**Lo que F1A-05 añade, y que la nota de agosto no podía saber: la auditoría se hizo SIN el
artefacto.** `docs/sdd/F1A-05_Auditoria_blueprint_audit-F1A.md` se produjo leyendo el código, y salió
con cinco hallazgos nuevos. Eso separa dos funciones que `plan:388` mezclaba:

| Función | ¿La cumple algo hoy? |
|---|---|
| **Auditar el flujo** — detectar defectos, medir el estado de los hallazgos previos | **Sí**, el documento de auditoría. No necesita el artefacto |
| **Ser la fuente gráfica de §M1.3 para personas** — diagrama, leyenda por área, fichas | **No la cumple nada más.** `docs/blueprint-servicio-tecnico.md` es texto, es anterior a la app y el maestro no lo cita |

**Y el maestro dice para qué sirve, así que no es punto abierto.** `R08.1.md:4272`, dentro del
**Anexo F — Fuentes** (`:4201`):

> «Artefacto de apoyo. El mapa visual del blueprint —diagrama completo, leyenda por área y fichas de
> los hallazgos— vive como artefacto interactivo bajo el título «Blueprint de Servicio Técnico — mapa
> de transiciones». **Es la fuente gráfica de §M1.3 y se actualiza con cada auditoría del código.**»

El `<title>` del fichero es exactamente esa cadena, así que la identificación no es una inferencia.
El maestro lo adoptó como **fuente propia** con una cadencia declarada: no es el andamio de una
conversación de agosto, es un entregable con función y dueño documental.

**Consecuencia para las tallas.** La talla **S** no es falsa para toda la tanda: es correcta para
auditar —F1A-05 lo acaba de demostrar— y es falsa para regenerar. Lo que hay que separar en el plan
son **dos trabajos distintos**:

| Trabajo | Talla | Quién |
|---|---|---|
| La auditoría en sí (leer el código, medir hallazgos, registrar) | **S**, confirmada empíricamente por F1A-05 | `audit-F1A` / `audit-F1B` |
| **Construir el generador** del mapa visual, que hoy no existe | **Sin dimensionar.** Es una tanda propia y nadie la ha estimado | Sin asignar |

**Texto propuesto.** Tres cambios:

1. `plan:388` — sustituir la columna Estado y la de Notas por
   > `| docs/artefactos/blueprintserviciotecnico.html | Mapa de transiciones generado con IA (auditoría R04) | CADUCO — describe el flujo anterior a C1, C11 y C9 | NO tiene generador en el repositorio (docs/artefactos/NOTA.md §3): no se regenera. Construir el generador es una tanda propia, sin dimensionar |`

2. `plan:142` y `plan:158` — dejar el contenido como está y añadir a la columna Gate, en lugar de la
   raya:
   > `Ninguno. NO regenera docs/artefactos/ (no hay generador); audita leyendo el código`

3. `plan:412` y `plan:421` — la talla **S** se mantiene, ahora sobre la base correcta: es el coste de
   auditar, no el de regenerar. Añadir una fila nueva a la tabla de tandas para el generador del mapa
   visual, con talla **sin dimensionar** y sin semana asignada, hasta que Gerencia decida si sigue
   queriendo el artefacto que el Anexo F declara.

**Por qué importa.** Es la misma clase de premisa falsa que F0-04 ya corrigió una vez —«F0-04 no crea
la red de pruebas: la mide y la completa donde falta» (`openspec/changes/F0-04/proposal.md:18`)—, y
si no se corrige aquí, **F1B-09 la hereda entera** en la semana S44: misma fila sin gate, misma talla
S, mismo generador inexistente, y además con la extensión a dos flujos más que M11.6 pide.

---

## La del barrido de desvíos huérfanos (5)

### 5 · El plan no tiene sitio para el contrato de errores ni para dos decisiones que sus tandas necesitan *(barrido de desvíos, 2026-09-09)*

**Cómo salió.** Al cerrar F1A, sus **cuatro** desvíos vivos seguían apuntando a «F1A». Buscándoles
destino real aparecieron **tres huecos del plan**, y son de dos clases distintas: uno es una **fila de
tanda que falta**, y dos son **decisiones que no están en la tabla de los viernes**. Van juntos porque
los destapó el mismo barrido, no porque se parezcan.

---

#### 5.a · Falta una fila: el contrato de errores del motor no tiene tanda

**Qué falta.** `grep -niE "guarda|precedenc|409|422"` sobre el plan entero devuelve **cero** filas
sobre precedencia de guardas. Las únicas coincidencias son C1 (`plan:138`, `plan:408`, cerrada en
F1A-01) y la línea de tooling SDD (`plan:25`).

**Qué queda huérfano.** `openspec/specs/transitions-st` §3.8 —**dos** inversiones, no una— y
`openspec/specs/tickets-core` §4.1, las tres declaradas «destino F1A»:

| Inversión | Qué pasa hoy | Evidencia |
|---|---|---|
| (a) Las dos puertas de la OV evalúan la misma regla en órdenes opuestos | En el alta gana el `409`; en `habilitar_servicio` gana el `422` | `ticketService.test.ts:295` vs `:176`; el contraste, en `:277-287` |
| (b) El `409` de estado contesta antes que el `403` de área | A quien no tiene el área se le responde por el estado del ticket | `ticketService.ts:86-88` antes de `:89-91`; fijado en `:154` |

Y §3.8 cierra con **«corregir una sin la otra deja el problema»**: son una sola tanda, no dos.

**La talla, cuantificada antes de prometerla.** Hay **12 pruebas de precedencia** en dos bloques
(`ticketService.test.ts:143` y `:289`). De ellas:

- **`:176` y `:295` son directamente contradictorias** —misma pareja de guardas, ganador opuesto—, así
  que **una de las dos cambia sí o sí**, se elija el orden que se elija. Ése es el suelo.
- Si el orden unificado es «`422` de datos antes que `409` de conflicto» —el que `remision.ts` ya
  sigue desde F1B-01 y el que §4.1 sugiere—, cambian además **`:154`, `:160`, `:166`, `:187` y
  `:304`: **6 de 12**.
- Y no es sólo recuento: `:154`, `:160` y `:166` cambian **qué error ve el usuario** en el panel de
  transiciones, que se usa a diario.

→ **No es una talla XS.** Es una tanda propia, con decisión de contrato dentro.

**Texto propuesto:** añadir a la épica 1B, después de `plan:157`, una fila

> `| F1B-10 | — | Orden único de precedencia entre guardas en las dos puertas del motor (createManagedTicket y executeTransition), y en la del alta de remisión; unifica transitions-st §3.8 (a) y (b) y tickets-core §4.1 | Ninguno técnico; el orden se declara en la spec |`

y su fila en la tabla de trazabilidad (`plan:413` y siguientes) con talla **M**.

> ✅ **CERRADO — la fila se añadió y la tanda se ejecutó.** `F1B-10` entró al plan como
> `orden-precedencia-guardas` (`sdd-propose`, 2026-09-17; retallada de **M** a **L** en `proposal.md`
> §7, porque la premisa que fijó la M —«no toca código»— resultó falsa). Cierra las dos inversiones de
> (a) y (b) descritas arriba: el orden A/B/C/D queda aplicado en las dos puertas del motor (commit
> `ccedf4f`) y §3.8(b) se conserva, no se corrige. Nota Caso C (`CLAUDE.md` regla de mutación 4): este
> párrafo se conserva con su fecha, no se reescribe.

---

#### 5.b · Falta una decisión: la cardinalidad OV ↔ ticket (punto abierto nº 52)

**Qué falta.** La tabla de decisiones (`plan:348-359`) tiene `decision/p21-ingreso-sin-ov` para
F1B-03, pero **P21 es otra pregunta**: si la OV es obligatoria al inicio, no **cuántos tickets puede
tener una OV**. El punto abierto **nº 52** del maestro no aparece en ninguna fila.

**Por qué importa, y por qué no es sólo bookkeeping.** El maestro (`R08.1.md:2071-2079`) lista tres
variantes reales y **habituales** —OV separadas por mano de obra y repuestos, OV global por varios
equipos, varias OV sobre un mismo ticket— y concluye:

> «Ninguna de las tres encaja en un modelo de «una OV, un ticket», y las tres son habituales. Punto
> abierto nº 52.»

Y el código **ya impone esa regla en dos puertas** (`ticketService.ts:45` y `:100`). El desvío
registrado —la tercera puerta, en el alta de remisión— se venía tratando como «falta una puerta».
**Puede ser exactamente lo contrario:** si nº 52 se resuelve a favor de las variantes, el arreglo es
**retirar las dos que hay**. Construir la tercera antes de decidir cuesta el doble.

**Texto propuesto:** añadir a la tabla de decisiones

> `| decision/n52-cardinalidad-ov | Cuántos tickets puede tener una OV, y al revés: las tres variantes de R08.1.md:2071-2079 | Cierra IV-4 (tercera puerta) en una u otra dirección | Por fijar |`

---

#### 5.c · Falta una decisión: qué debe enseñar la vista «Todos» del tablero

**Qué falta.** `apps/desk/src/lib/boardView.ts:49-50` — la vista `todos` devuelve
`statusType !== 'Closed'`, o sea que **no enseña todos**. Medido en el Zoho Desk de producción:
**726 tickets cerrados** ocultos bajo un rótulo que promete lo contrario.

**Por qué es decisión y no arreglo.** Las dos salidas son correctas y difieren en a quién se ajusta el
tablero: **(a)** renombrar la vista a «Abiertos» —altera menos lo que el equipo tiene aprendido—, o
**(b)** cambiar lo que devuelve —cumple la expectativa del usuario y la vista homónima de Zoho Desk, a
cambio de meter 726 cerrados por omisión—. La rama `default`, que comparte cuerpo y filtra en silencio
cualquier clave desconocida, es defecto en los dos casos.

**Texto propuesto:** añadir a la tabla de decisiones

> `| decision/vista-todos-tablero | «Todos» se renombra a «Abiertos», o pasa a devolver también los cerrados | Desbloquea IV-7 dentro de F1B-08 | 11/09 |`

---

**Por qué las tres van en la misma entrada.** No es que se parezcan: es que **las destapó el mismo
barrido**, y ése es el dato de método. Un destino escrito en la tabla de desvíos es una promesa, y una
promesa que nombra una épica cerrada no la cumple nadie. La regla que sale de aquí queda escrita en
`CLAUDE.md`: **al cerrar una épica, barrer los desvíos que la nombraban.**

---

## El barrido: todas las filas del plan que citan el acta del 03/09

Mismo método que el de las casillas de F0-03, aplicado al plan. **«Respaldada»** significa que la
parte III (`:268-480`) la sostiene; **«convocatoria»**, que sólo está en las partes I y II.

El comando que produce la lista, sobre `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md`:
contar las líneas que contienen `03/09`. Devuelve **27**. Y las tres cifras del contraste, filtrando
la parte III (`:268-480`) del acta: `C11` → **0**, `escalado` → **0**, `sla` sin distinguir
mayúsculas → **2**, y las dos son los falsos positivos de «traslada» que se explican arriba.

| Línea del plan | Tanda / apartado | Qué cita | Respaldo en la parte III | Veredicto |
|---|---|---|---|---|
| `:125` | F0-03 | «decisiones cerradas … y acta 03/09» | Los siete bloques `Decisiones tomadas:` | **Respaldada** |
| `:139` | **F1A-02 (C11)** | «acta 03/09 (ampliada)» | **Ninguno.** Cero menciones de C11 | ⛔ **Convocatoria** (`:140`, sin marcar) |
| `:153` | F1B-04 | «la "recepción unificada" del acta 03/09» | `:324`, tema 2 | **Respaldada** |
| `:183` | F1D-01 | «acta 03/09 tema 3» | Decisiones en `:350-351` | **Respaldada** |
| `:186` | F1D-04 | «Acta 03/09 "flujo de validación por niveles"» | Decisión en `:351` | **Respaldada** |
| `:188` | **F1D-06** | «acta 03/09 **tema 4**» | El tema 4 se trató y **NO dejó decisión**: sólo tarea (`:368-370`) | ⚠️ **Tratada, sin decisión** |
| `:189` | F1D-07 | «Acta 03/09 tema 5» | Decisión en `:382` | **Respaldada** |
| `:190` | F1D-08 | «los macros coinciden entre modelos Horiba» | `:344`, **resumen de la discusión**, no decisión | ⚠️ **Hecho constatado, no decidido** |
| `:193` | Fuera de Fase 1 | «decidido 03/09: tras ~90 tickets» · «aplazado 03/09» | Decisiones `:403` y `:404` | **Respaldadas** |
| `:197` | Épica 1E | «Segunda adición, decidida el 03/09» | Decisión `:402` | **Respaldada** |
| `:201` | F1E-01 | «Acta 03/09 tema 6» | Decisiones `:402-405` | **Respaldada** |
| `:202` | F1E-02 | «M2.5, acta 03/09» | Decisión `:405` | **Respaldada** |
| `:218` | Fase 2 | «comentarios predefinidos … (decisión 03/09)» | Decisión `:403` | **Respaldada** |
| `:298` | Prompt de F1D-06 | «Acta 03/09/2026 tema 4 ("Encadenamiento **pendiente**")» | Lo cita **como pendiente**, que es correcto | **Correcta** |
| `:312` | Prompt de F1D-04 | «validación por nivel macro (acta 03/09)» | Decisión `:351` | **Respaldada** |
| `:453` | Riesgos | «cuello de botella declarado el 03/09» | `:456`, conclusiones | **Respaldada** |
| `:162` | Épica 1B | «la "regla de la sesión" de la **convocatoria** del 03/09» | Cita la convocatoria **y lo dice** | **Correcta** |
| `:4`, `:12`, `:179` | Cabecera y relato | El acta como fuente documental | Parte III | **Respaldadas** |
| `:406`, `:416`, `:423`, `:426`, `:429`, `:430`, `:432` | Tabla §5 | Duplican las filas de arriba | — | Igual que su fila |

**Dos hallazgos, y sólo uno es un defecto.**

1. **`plan:139` (C11) es el único caso de cita a una fuente que no existe**: la parte III no trata el
   tema. Es la entrada 1 de este fichero.
2. **`plan:188` (F1D-06) cita el tema 4 sin decir que salió sin decisión.** No es una cita falsa —el
   tema sí se trató— pero el plan lo presenta como fuente cerrada, y es justo el tema que F0-03 cargó
   como `punto-abierto/encadenamiento-diagnostico`. **Texto propuesto:** añadir a la columna Fuente
   «(tema tratado **sin decisión**: sólo tarea, `acta:368-370`)». No cambia la tanda; cambia lo que
   quien la ejecute espera encontrarse.

**Y una observación de método que el barrido deja clara:** `plan:162` cita «la regla de la sesión de
la **convocatoria** del 03/09» y acierta, porque esa regla **sí** está en la convocatoria (`:114-116`)
y el plan lo dice. La distinción entre las dos partes del fichero no es una sutileza de archivo: es
la diferencia entre citar bien y citar mal, y el plan la maneja bien en un sitio y mal en otro.

---

## Qué NO contiene este fichero

- No edita el plan. Es texto propuesto.
- No reordena tandas ni cambia gates: eso es de Gerencia.
- Las correcciones al **maestro** van en `docs/sdd/F0-01_Correcciones_para_el_maestro.md`, que es
  otro canal y otro documento.
