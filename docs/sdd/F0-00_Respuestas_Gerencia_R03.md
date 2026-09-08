# F0-00 · Respuestas de Gerencia — R03, tras la lectura de primera mano del maestro

**Fecha:** 08/09/2026 · **Responde:** Alfonso García del Pino (Gerencia) · **Sustituye a:** R01 y R02 del mismo día
**Origen de esta revisión:** `F0-00_Correcciones_desde_Maestro_R08.1.md` (Claude Code, lectura directa del `.docx`), con cada cita reverificada contra el texto de la R08.1 antes de aceptarla o discutirla
**Lo que esta revisión hace:** retira cuatro afirmaciones, sostiene dos con la fuente correcta, devuelve una precisión al agente, eleva un hallazgo a bloqueante y añade un gate que faltaba

---

## Cambios R02 → R03

| Qué | Antes | Ahora | Fuente de primera mano |
|---|---|---|---|
| Justificación de «las esperas internas no paran el reloj» | «…que es el vicio que C9 corrige» | **Retirada. Era inventada.** La conclusión se sostiene sobre M1.10, no sobre C9 | M1.10: «tiempo que **no depende de nosotros**» |
| Hipótesis sobre los campos «Final» («no se espera otra orden») | Hipótesis etiquetada | **Retirada.** G.5 dice que `Aprobación` escribe la col. 42; el código escribe «Final». Es una divergencia de cableado, no un hecho de negocio | Anexo G.5, col. 42 |
| Principio nº 8 como apoyo a P44 | Citado | **Retirado.** El principio es sobre determinismo frente a LLM, no sobre intervención humana | §1.6, principio 8 |
| P14 y la doble escritura | Tratados como uno | **Separados.** P14 está cerrado por Desarrollo; la doble escritura es una cuestión sin numerar de `debt.md` | Anexo D, punto 14 |
| El atributo `espera` como diseño de C7 | Presentado como C7 | **Reubicado.** Es el criterio de la **vista del tablero**. Cuándo para el reloj lo define M1.10; cómo se representa está **abierto**, no decidido | M1.10 [DEFINIDO]; M1.6 [PROPUESTO] |
| C9 «resuelta en su definición, falta un campo» | Asumido del maestro | **Falso.** Sus tres fórmulas usan campos que se sobrescriben en caminos reentrantes | M1.10 × `transitions.ts` |
| Gate P52 | No existía | **Añadido** a F1B-01 y F1B-03 | Anexo D, punto 52 |

---

## A · Lo que retiro, y qué lo sustituye

### A.1 — La cita de C9 era inventada

En la R02 escribí que si el reloj parara en las esperas internas «Ambientalia escondería sus propias demoras de su propio indicador, que es el vicio que C9 vino a corregir». **C9 no dice eso.** C9 es, textualmente, redefinir el bodegaje de entrada —invalidado en 2026 cuando Comercial empezó a crear tickets por anticipado— y, por extensión (punto 41), los tiempos de inicio de servicio y de diagnóstico. No es una regla sobre esconder demoras. La escribí de memoria del plan, no del maestro, y la escribí como hecho. Es exactamente el fallo que la regla de método adoptada en la R02 debía atrapar, en la misma revisión en que se adoptó.

**Lo que sustituye a esa cita es mejor, y es de primera mano.** M1.10 define bodegaje como *«el tiempo que un equipo pasa en Ambientalia esperando una respuesta del cliente —es decir, tiempo que no depende de nosotros—»* y remata: *«no mide desempeño del taller, mide demora del cliente»*. Y en su conexión con C7: *«los tres bodegajes son, por definición, tiempo ajeno. Son exactamente los periodos que deben parar el reloj del SLA»*. La conclusión que defendía —un traspaso interno entre Servicio Técnico y Compras no es tiempo ajeno y no para el reloj— sale directamente de esa definición. No necesitaba a C9; necesitaba leer M1.10.

### A.2 — La hipótesis sobre «Final» queda desplazada por el Anexo G

G.5 documenta, para la columna 42 `Fecha Orden de Compra`, que la escriben *«Habilitar Servicio · Aprobación · Aprobación y S. Repuestos»*. El código hace que `aprobacion` escriba `Fecha Orden de Compra Final` (`transitions.ts:202-203`). Misma transición, misma ranura, etiqueta distinta. La pareja «Final» no es un hecho de negocio: es una divergencia entre el mapeo del 16/02 y el cableado de la app. Mi lectura de «no se espera otra orden» era una explicación elegante de algo que no necesita explicación. Retirada.

**Lo que sí importa, y es peor que la sobrescritura:** la columna 58 *«Tiempo de orden de compra»* se calcula como `Fecha Orden de Compra − Fecha de Cotización`, y M1.10 dice que es exactamente el bodegaje de proceso. Un ticket aprobado **sin repuestos** escribe la columna «Final» y deja la 42 vacía. **El bodegaje de proceso no es calculable hoy para ningún ticket aprobado sin repuestos.** No es que se pise el valor: se escribe en la columna equivocada.

**Verificación que decide de dónde viene la divergencia, y es de cinco minutos:** abrir el editor de blueprint de Zoho Desk y mirar qué campo escribe la transición *Aprobación*. Si escribe `cf_fecha_orden_de_compra`, la app se desvió del as-is y F1A lo corrige. Si escribe `cf_fecha_orden_de_compra_final`, la hoja del 16/02 simplificó y el defecto de la columna 58 viene de Zoho desde 2021. La pregunta a Gustavo cambia por tercera vez, y ahora ya no es de negocio: es una comprobación en la configuración.

### A.3 — El principio nº 8, estirado

Lo usé en P44 como si dijera «deja a una persona en medio de un compromiso comercial». Dice otra cosa: *«el cálculo es determinista; la IA recupera, no compromete… nunca mediante un modelo de lenguaje»*. Es determinismo frente a LLM. Empujar líneas de cotización deterministas al CRM no lo violaría. La decisión de P44 —cero escritura en Fase 1— se mantiene, sobre las dos patas que sí aguantan: no existe código de escritura y construirlo cuesta una tanda y un modo de fallo; y no hay contraparte de `managed_by_app` del lado Zoho.

### A.4 — P14 y la doble escritura son dos cosas

P14 pregunta si `remisiones_entrada` procede de la plataforma de hojas de vida; decide Desarrollo; la auditoría respondió que no. **Cerrado.** La doble escritura Sheets/Postgres es real pero no tiene número: vive en `debt.md:419-420`. La decisión provisional de la R01 (Postgres como origen del informe, Sheets como espejo hasta F1F-02) se mantiene, pero se registra como punto nuevo del Anexo D, no como P14.

---

## B · Lo que sostengo, con la fuente correcta

### B.1 — Las esperas internas no paran el reloj

Ahora sobre M1.10 y no sobre una cita inventada: el reloj para en *«tiempo que no depende de nosotros»*. `Notificación a Compras`, `Notificación Comercial`, `Solicitado`, `En espera de SKU inventario` y `Liberación Comercial` dependen de nosotros. Los tres bodegajes definidos —esperar la OC, esperar la aprobación, esperar la recogida— son todos espera **del cliente**. La conclusión no cambia; su fundamento sí, y ahora es de primera mano.

### B.2 — La clasificación de los 21 estados sobrevive, como criterio de la vista

El agente lo concede y tiene razón en cómo lo acota: sirve a la **vista «Tickets en espera» del tablero**, y no debe nombrarse igual que el criterio de M1.3.4 («sin salida de emergencia», que excluye deliberadamente `Notificación cliente`) ni que el de M1.10 (bodegaje = espera del cliente). Son tres criterios, y la spec los nombra distinto: `sin_salida` (M1.3.4, cuatro estados), `en_espera` (vista del tablero, ocho estados), `bodegaje` (M1.10, tres periodos entre fechas).

---

## C · Una precisión que devuelvo al agente: M1.6 no es una decisión

El documento de correcciones dice que *«el Anexo B lo especifica sin ambigüedad»* y que C7 *«son tres sub-estados nombrados»* —`Espera de repuesto · Espera de cliente · Condiciones inseguras`—, y de ahí concluye que el atributo por estado «es otra cosa» y que la pregunta se rehace con «C7 como sub-estados de pausa».

Los sub-estados están donde dice. Pero **M1.6 lleva la marca [PROPUESTO]**, y su nota R08 es explícita: *«No son propuestas de Ambientalia: proceden de los estudios de mercado del Anexo A… Se recogen aquí como material de contraste»*. El Anexo B reproduce ese modelo objetivo bajo el rótulo «Taller (modelo objetivo)». Y la fila que el agente cita («Sub-estados de pausa con parada del reloj de SLA — No existen») está en la tabla que **contrasta** el modelo objetivo con el as-built, no en una decisión.

Conviene separar entonces dos preguntas que el documento junta:

| Pregunta | Estado en el maestro | Fuente |
|---|---|---|
| **Cuándo** para el reloj | **Definido:** durante los tres bodegajes, que son periodos entre fechas | M1.10 [DEFINIDO — R08] |
| **Cómo** se representa la pausa | **Abierto:** el modelo objetivo propone sub-estados; el as-built los tiene como estados plenos | M1.6 [PROPUESTO], material de contraste |

Con eso, la conclusión es distinta de la que propone el agente. **Rehacer C7 como sub-estados de pausa es adoptar el modelo objetivo, y la Fase 1 replica el as-built.** En el as-built, toda pausa es una transición a un estado pleno, luego el periodo de pausa queda delimitado por dos filas de `ticket_transitions`. Calcular los bodegajes sobre ese registro —que es append-only— es al mismo tiempo la implementación fiel de M1.10 y el arreglo de la reentrancia de §D. El atributo por estado deja de ser un diseño rival y pasa a ser **cómo se calcula un periodo entre fechas cuando las fechas viven en el historial y no en columnas que se pisan**. Los sub-estados, si se adoptan, son trabajo del modelo objetivo, en Fase 2 o después.

No lo doy por decidido: lo dejo como la propuesta de Gerencia para la spec de C7, con las dos alternativas nombradas.

### C.2 — La taxonomía de C5 no es «tres contra cuatro»

El agente dice que el maestro propone tres valores y las hojas del 03/02 cuatro, y que hay que elegir. M1.8 cuenta otra historia: las hojas traen **seis** categorías (Operativo manual, Operativo digital, Operativo Comercial, Decisional, Compras/Logístico, Administrativo); el acta del **17/02 fusionó los tres operativos en uno** —decisión registrada en §1.8—, lo que deja cuatro; y P35 nombra tres porque no incluye Administrativo. Las hojas de equipo nuevo y soporte remoto muestran cuatro porque esos flujos no tienen eventos logísticos ni administrativos, no porque propongan otra taxonomía.

Lo que queda por decidir no es elegir entre listas: es **(a)** si Administrativo sobrevive como categoría, **(b)** si la variante comercial se absorbe, y **(c)** desambiguar «Creación de informe», que aparece en tres categorías (redactar / generar / emitir, según la lectura del propio maestro). Eso es P35 tal como está escrito, y C5 sigue bloqueada por (c), como decía la convocatoria del 03/09.

---

## D · El hallazgo caro, y lo que bloquea

Cruzando la definición de M1.10 con la enumeración de ciclos sobre `transitions.ts`:

| Bodegaje | Fórmula (M1.10) | Campos reentrantes y obligatorios |
|---|---|---|
| De entrada | `Fecha Orden De Venta − Fecha Remisión Entrada` | `Fecha Orden De Venta` (`aprobacion_y_repuestos`) |
| De proceso | `Fecha Orden de Compra − Fecha de Cotización` | **Los dos.** `Fecha de Cotización` la escriben `notif_cliente_comercial` y `notif_cliente_sku`; la col. 42 además queda vacía sin repuestos (§A.2) |
| De salida | `Fecha Remisión de Salida − fecha de aviso` | `Fecha Remisión de Salida` (`entrega_sin_factura`, el ciclo de C4) |

El maestro dice *«dos de los tres ya son calculables hoy»*. **Son calculables mal** para cualquier ticket que haya recorrido un bucle, y el de proceso no es calculable en absoluto para los aprobados sin repuestos. Y el propio M1.10 enuncia la regla que se saltó: *«toda decisión que cambie el momento en que se rellena una fecha debe revisar los indicadores que dependen de ella»*.

**Consecuencias en el plan:**

1. **F1A-04 pierde su premisa.** Estaba en la épica «sin decisión pendiente» porque la R08 decía que la definición de C9 estaba resuelta. No lo está: sus fórmulas dependen de resolver la reentrancia. **Pasa a F1C**, junto con C7, y **queda bloqueada por la enumeración de F0-04.**
2. **C4 cubre una fila; el problema afecta a diez campos en nueve transiciones.** P34 ya nombra la solución —*«campo nuevo que no se sobreescriba, o evento en el historial»*— y la segunda opción es la buena, porque escala a los diez campos sin añadir diez columnas. F1C-02 arranca desde M1.3.5 (las dos ramas con `Pendiente de facturar`, ya diseñadas) y desde P34, no desde cero; y sabiendo que su diseño resuelve 1 de los 9 casos.
3. **G.8 se queda corto.** Dice que C9 redefine las columnas 48, 49 y 56. Cruzando G.6 con los ciclos, hay cuatro indicadores más rotos por reentrancia (47, 50/53, 57, 58), y no están en el alcance de C4 ni de C9. Va al Anexo D como punto nuevo.
4. **F0-04 enumera antes de que nadie diseñe.** Ciclos del grafo × campos de fecha escritos dentro × indicadores de G.6 que los consumen. Es una tabla, y es la entrada de F1C-02, F1C-06 y de la spec `kpis`.

---

## E · Tres puntos abiertos que nadie había tocado

**P62 — qué se hace con la capa as-built.** Es la premisa de F0-00 y de F0-02, y está sin decidir. Pero no es cierto que nadie lo tocara: **el plan R01 propone resolverlo** —el as-built sale del documento maestro, que era lo que pedía el 27/08, y pasa a vivir como specs en `openspec/`, que es lo que quería la revisión posterior; el maestro conserva sólo el Anexo H apuntando a ellas—. Lo que faltaba era decirlo como decisión y no como propuesta. **Se lleva al viernes 11/09 para cerrarlo explícitamente, y hasta entonces F0-02 no arranca.**

**P52 — variantes reales de orden de venta.** El código implementa «una OV, un ticket» y devuelve 409 en las dos puertas; el maestro dice que *«ninguna [variante real] encaja en “una OV, un ticket”»*; y el 27/08 decidió las subórdenes `OV-XXX_1, _2`. Es un conflicto vivo entre lo construido y lo decidido, y no estaba como gate de ninguna tanda. **Se añade como gate de F1B-01 y F1B-03**, con la pregunta: ¿el modelo de subórdenes del 27/08 resuelve las tres variantes de P52 (OV por mano de obra y por repuestos, OV global por varios equipos, varias OV por ticket) o sólo la primera?

**P20 — hasta cuándo se mantiene la interfaz que replica Zoho Desk.** Decide Gerencia, y decido: **se mantiene mientras sea la superficie principal del técnico, es decir, durante la Fase 1 y hasta que la app móvil/tablet de la Fase 2 (ítem 18) la sustituya.** Eso refuerza la decisión 3: no se invierte en probar una interfaz con fecha de retirada, y la regla 13 protege lo único que importa de ella.

---

## F · Método: la segunda mitad de la regla

Acepto la adición: **una cita de segunda mano es una hipótesis, aunque venga de un documento propio.** Y la aplico al caso que la motivó: cité C9 desde el resumen del plan, no desde M1.10, y salió inventada. De aquí en adelante, en las respuestas de Gerencia y en los proposals, cada afirmación sobre el maestro lleva apartado y, cuando sea posible, línea del `.md` exportado; cada afirmación sobre el código lleva ruta y línea; y lo demás lleva la palabra «hipótesis» delante.

Una consecuencia práctica: **F0-01 exporta el maestro a `.md` como primera tarea**, no como una de varias. Sin el `.md` nadie puede citar líneas, y sin líneas la regla no se puede cumplir.

---

## G · Verificaciones y preguntas, actualizadas

| Qué | Quién | Cuándo | Tipo |
|---|---|---|---|
| Qué campo escribe la transición *Aprobación* en el blueprint de Zoho Desk (`cf_fecha_orden_de_compra` o `…_final`) | Alfonso | Esta semana | Configuración, 5 min |
| ¿Alguien lee `Remision_Data/remisiones_entrada` aparte de n8n? | Gustavo | 11/09 | Negocio |
| Clasificar `Pendiente` (¿pausa del técnico o trabajo en curso?) | Servicio Técnico | 11/09 | Negocio |
| ¿Las subórdenes `OV-XXX_n` cubren las tres variantes de P52? | Comercial / Alfonso | 11/09 | Negocio |
| P62: confirmar que el as-built vive en `openspec/` y el maestro conserva sólo el Anexo H | Alfonso, con el equipo | 11/09 | Decisión de método |
| P45: si la transición es cada N1 del catálogo o la macro-fase que los agrupa | Johny | 11/09 | Diseño de datos |
| `SYNC_CONTACTS` / `SYNC_ACTIVITIES` en el despliegue de Desk; estado de `pg_stat_subscription` | Alfonso | Esta semana | Producción |
| Corrección «trece» → «once» indicadores (P16 frente a G.6) | Anexo I | Próxima revisión | Documental |

---

## Texto para pegar en Claude Code

```
Lectura del maestro aceptada; cada cita reverificada contra el texto. Emito la
R03, que sustituye a R01 y R02. Guarda las correcciones en Engram sobre los
mismos topic_key y crea docs/sdd/F0-00_Respuestas_Gerencia_R03.md.

RETIRO, sin matices:
- La cita de C9 en la R02. Era inventada. La conclusión (las esperas internas
  no paran el reloj) se sostiene sobre M1.10 — «tiempo que no depende de
  nosotros», «mide demora del cliente» — no sobre C9.
- La hipótesis «Final = no se espera otra orden». G.5 col. 42 dice que
  Aprobación escribe Fecha Orden de Compra; el código escribe «Final». Es
  divergencia de cableado. Y la col. 58 (bodegaje de proceso) queda vacía para
  todo ticket aprobado sin repuestos: no es calculable, no es que se pise.
- El principio nº 8 como apoyo de P44. P44 se sostiene sobre las otras dos
  patas.
- P14 como sinónimo de la doble escritura. P14 está cerrado por Desarrollo;
  la doble escritura va al Anexo D como punto nuevo.

SOSTENGO, con fuente de primera mano:
- Las esperas internas (Notificación a Compras, Notificación Comercial,
  Solicitado, En espera de SKU, Liberación Comercial) no paran el reloj.
  Fuente: M1.10, definición de bodegaje.
- La clasificación de los 21 estados sobrevive como criterio de la VISTA del
  tablero. En la spec se nombran tres criterios distintos: sin_salida (M1.3.4,
  cuatro estados), en_espera (vista, ocho estados), bodegaje (M1.10, tres
  periodos entre fechas).

UNA PRECISIÓN DE VUELTA — M1.6 no es una decisión:
Los sub-estados de pausa (Espera de repuesto · Espera de cliente · Condiciones
inseguras) están en M1.6, marcado [PROPUESTO], y su nota R08 dice que «no son
propuestas de Ambientalia: proceden de los estudios de mercado del Anexo A…
material de contraste». Lo DEFINIDO es CUÁNDO para el reloj (M1.10: los tres
bodegajes, periodos entre fechas). CÓMO se representa la pausa está abierto.
Rehacer C7 como sub-estados es adoptar el modelo objetivo, y la Fase 1
replica el as-built, donde toda pausa es un estado pleno y su periodo queda
delimitado por dos filas de ticket_transitions. Propuesta de Gerencia para la
spec de C7: los bodegajes se calculan sobre ticket_transitions (append-only),
lo que implementa M1.10 tal cual y arregla la reentrancia a la vez; el
atributo por estado es cómo se calcula ese periodo, no un diseño rival. Los
sub-estados quedan como alternativa nombrada, para el modelo objetivo.

C5 no es «tres contra cuatro»: M1.8 trae seis categorías en las hojas, el
17/02 fusionó los tres operativos (§1.8), P35 nombra tres porque omite
Administrativo. Lo abierto es (a) si Administrativo sobrevive, (b) si la
variante comercial se absorbe, (c) desambiguar «Creación de informe». No hay
que elegir lista; hay que aplicar la fusión y cerrar esas tres.

ACEPTO Y ELEVO el hallazgo de la reentrancia sobre los bodegajes:
- F1A-04 pierde su premisa («definición ya resuelta»). Pasa a F1C junto con
  C7 y queda bloqueada por la enumeración de F0-04.
- F1C-02 arranca desde M1.3.5 (dos ramas con Pendiente de facturar) y desde
  P34 («evento en el historial» es la opción buena: escala a los diez campos).
  Sabe que cubre 1 de 9 casos.
- G.8 se queda corto: cuatro indicadores más rotos por reentrancia (47, 50/53,
  57, 58). Punto nuevo del Anexo D.
- F0-04 produce la tabla: ciclos × campos de fecha escritos dentro ×
  indicadores de G.6 que los consumen. Es la entrada de F1C-02, F1C-06 y de la
  spec kpis.

LOS TRES PUNTOS ABIERTOS:
- P62: el plan R01 ya propone la resolución (as-built a openspec/, el maestro
  conserva sólo el Anexo H). Faltaba decidirlo. Va al 11/09 y F0-02 no
  arranca hasta entonces.
- P52: gate nuevo de F1B-01 y F1B-03. Pregunta: ¿las subórdenes OV-XXX_n del
  27/08 cubren las tres variantes de P52?
- P20, decidido: la interfaz que replica Zoho Desk se mantiene durante la
  Fase 1 y hasta que la app móvil de la Fase 2 la sustituya. Refuerza la
  decisión 3.

MÉTODO: acepto la segunda mitad de la regla —una cita de segunda mano es una
hipótesis aunque venga de un documento propio— y la aplico a mi cita de C9.
Consecuencia: F0-01 exporta el maestro a .md como PRIMERA tarea, porque sin
líneas citables la regla no se puede cumplir. Y lee el Anexo D y el Anexo G
completos antes de escribir ninguna spec.

VERIFICACIONES que asumo yo esta semana: qué campo escribe Aprobación en el
blueprint de Zoho Desk; SYNC_CONTACTS/SYNC_ACTIVITIES y pg_stat_subscription
en producción. Preguntas para el 11/09: quién lee la hoja de Sheets (Gustavo),
clasificación de Pendiente (ST), variantes de P52 (Comercial), P62 y P45.

Con esto, reescribe el proposal de F0-01 (export .md primero; regla 13 con la
redacción de la R02; capacidad catalogo-equipos; rotación de secretos) y el de
F0-04 (registro de estados con prueba de coherencia; matriz área×transición;
la tabla de reentrancia; puertas con trinquete; partir app.test.ts).
Enséñamelos antes de ejecutar.
```
