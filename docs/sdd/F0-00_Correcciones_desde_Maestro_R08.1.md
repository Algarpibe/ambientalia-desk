# F0-00 · Correcciones desde la lectura del maestro R08.1

**Fecha:** 08/09/2026
**Fuente:** `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.1.docx`, extraído a texto (4.935 líneas) con `unzip -p … word/document.xml`
**Motivo:** hasta hoy nadie había abierto el maestro. Todas las citas de la auditoría F0-00 y de las diez respuestas eran de segunda mano — vía el baseline, el plan, o entre sesiones.
**Estado:** correcciones **sin aplicar**. Este documento las enumera; no modifica el baseline ni las respuestas.

---

## 0. Qué se leyó y qué no

**Leído:** índice completo · §1.6 Principios de diseño · §1.7 Los dolores · M1.3.4 Cuatro estados de espera · M1.3.5 Ciclo facturar/entregar · M1.9.1 (permisos) · M1.10 Registro de tiempos y métricas · M2.1 Estructura del árbol de diagnóstico · Anexo B Catálogo consolidado de estados · §3.2.1 tabla de las doce correcciones y su orden de ejecución · las referencias a C7/C9 en M1.6c.

**No leído:** M1.6 completo · M1.7 · M1.8 (tipos de evento) · M1.9 completo · M2.2–M2.7 · M3 a M12 · §3.2 completo · Anexos A, C, D, E, F, G, H, I.

Lo que sigue vale sólo para lo leído. **El Anexo D (puntos abiertos) y el Anexo G (diccionario de campos) siguen sin verificar de primera mano**, y son los dos que más citan las diez respuestas.

---

## 1. Errores que esta lectura corrige

Ordenados por lo que cuesta no haberlos visto.

### 1.1 — La alarma sobre el invariante de F0-04 era falsa. El error es mío

**Lo que dije:** que si los macros N1 son transiciones internas y varían por modelo —Grimm 8 niveles macro, Horiba 332 ítems en cuatro modelos, 35 modelos en producción—, el invariante «exactamente 34 transiciones y 21 estados» nacería roto, y habría que escribirlo como instantánea por grafo en vez de como cifra.

**Lo que dice el maestro.** M2.1, «La arquitectura híbrida [DECIDIDO 27/08]», resuelve exactamente esa pregunta y decide lo contrario:

| Nivel | Qué es | ¿Varía por marca-modelo? |
|---|---|---|
| **Macro** — física, neumática, óptica, electrónica | **Transición de estado del blueprint** | **No.** Son las mismas para todo el portafolio |
| Checklist dentro de cada macro | Contenido parametrizado: niveles jerárquicos, casillas y campos de valor | **Sí.** Es dato de configuración, no código |

Y el motivo, textual: *«Incorporar un equipo nuevo deja de ser un desarrollo y pasa a ser rellenar una plantilla. El flujo no se rediseña: se parametriza.»* Cierra el punto abierto nº 45 con la frase *«no había que buscar un denominador común: había que bajar la variabilidad un nivel»*.

**Consecuencias:**

1. El grafo crece en una cantidad **acotada e independiente del modelo**. El invariante numérico de F0-04 es seguro.
2. Los «8 niveles macro» de Grimm y los «332 ítems» de Horiba **no son macro-fases del blueprint**: son contenido del checklist. Son cosas distintas que comparten la palabra «macro».
3. Mi advertencia salió de inferir desde los Excel en vez de leer el maestro — el mismo fallo de método que C7 y C9.

### 1.2 — C7 no es un atributo sobre los estados: son tres sub-estados nombrados

El Anexo B lo especifica sin ambigüedad. En el modelo objetivo de taller:

> `… Planificación · **En ejecución ⇄ Pausa interna** · Control de calidad · Embalaje listo · Entregado · Cerrado`
> **Sub-estados de pausa:** `Espera de repuesto · Espera de cliente · Condiciones inseguras`

Y la tabla modelo-objetivo/as-built (línea 1539): *«Sub-estados de pausa con parada del reloj de SLA — **No existen.** Los cuatro estados de espera de M1.3.4 son **estados plenos**, y nada indica que detengan ningún cronómetro.»*

La pregunta 3 decidió `espera: null | 'interna' | 'externa'` sobre los 21 estados existentes, con «C7 lee ese atributo». **No es una versión parcial de C7: es otra cosa.** Un atributo describe el estado entero; un sub-estado describe un periodo dentro de un estado que no cambia.

**Lo que sobrevive de la pregunta 3:** la clasificación de los 21 estados sigue siendo válida y útil **para la vista del tablero**. Lo que se cae es el acoplamiento con el reloj del SLA.

### 1.3 — La justificación de C9 que escribimos era inventada

Se escribió, y se repitió en varias respuestas: *«si parara el reloj en las internas, Ambientalia escondería sus propias demoras de su propio indicador, que es el vicio que corrige C9»*. **Nada de eso está en el maestro.**

C9 es, textualmente (M1.10): redefinir el bodegaje de entrada, que se invalidó en 2026 cuando Comercial empezó a crear tickets por anticipado y la fecha de creación dejó de significar «el equipo llegó». Y los tres bodegajes quedan definidos así:

| Bodegaje | Empieza cuando | Termina cuando | Fórmula |
|---|---|---|---|
| De entrada | El equipo llega a las instalaciones | Llega la OC del cliente y se genera la OV | `Fecha Orden De Venta − Fecha Remisión Entrada` |
| De proceso | Se envía la cotización | El cliente la aprueba con su OC | `Fecha Orden de Compra − Fecha de Cotización` |
| De salida | Se avisa al cliente | El cliente lo recoge | `Fecha Remisión de Salida − fecha de aviso` |

*«Bodegaje es el tiempo que un equipo pasa en Ambientalia esperando una respuesta del cliente… no mide desempeño del taller, mide demora del cliente.»* Y la conexión con C7 (línea 1706): *«Los tres bodegajes son, por definición, tiempo ajeno. Son exactamente **los periodos** que deben parar el reloj del SLA.»*

**El reloj para en periodos entre fechas, no en una clasificación de estados.**

### 1.4 — El principio de diseño nº 8 se citó estirado

Se usó en la respuesta 10 (P44) como *«deja a una persona en medio de un compromiso comercial, coherente con el principio nº 8»*. El principio existe y dice (§1.6):

> *«El cálculo es determinista; la IA recupera, no compromete. La fecha prometida, la carga del taller y la disponibilidad de agenda se calculan con reglas y datos sobre PostgreSQL, **nunca mediante un modelo de lenguaje**.»*

Es sobre **determinismo frente a LLM**, no sobre intervención humana. Generar las líneas de cotización de forma determinista y empujarlas al CRM automáticamente **no violaría el principio 8**. El argumento principal de la respuesta 10 —que no existe contraparte de `managed_by_app` del lado Zoho— se mantiene intacto; esta pata concreta se retira.

### 1.5 — «Externo» significa tres cosas distintas, y una spec las habría mezclado

| Fuente | Criterio | Bajo él, `Solicitado` es… |
|---|---|---|
| **M1.3.4** | *«Su única transición de salida depende de que ocurra algo que la aplicación no controla»* | **externo** (depende de almacén) |
| **Nuestra taxonomía (pregunta 3)** | A quién se espera: dentro o fuera de Ambientalia | **interna** |
| **M1.10 (bodegajes)** | Tiempo esperando respuesta **del cliente** | ninguno de los dos: no es bodegaje |

Y el maestro **excluye deliberadamente** `Notificación cliente` de los cuatro: *«Contrasta con un estado corriente como Notificación cliente, que ofrece tres salidas… y una de ellas sirve precisamente para abandonar el ticket.»* El criterio de M1.3.4 es **«sin salida de emergencia»**, no «esperando a alguien».

La pregunta 3 añadió `Notificación cliente` al conjunto de esperas. No es incompatible con el tablero, pero **son criterios distintos y hay que nombrarlos distinto en la spec.**

---

## 2. Hallazgo nuevo, y es el más caro de todos

### Los tres bodegajes se calculan sobre las columnas que se sobrescriben solas

Cruzando la definición de C9 (M1.10) con la enumeración de ciclos reentrantes hecha sobre `transitions.ts`:

| Bodegaje | Fórmula | Estado de sus campos |
|---|---|---|
| De entrada | `Fecha Orden De Venta − Fecha Remisión Entrada` | **`Fecha Orden De Venta` es reentrante y OBLIGATORIA** (`aprobacion_y_repuestos`, componente C2) |
| De proceso | `Fecha Orden de Compra − Fecha de Cotización` | **Las dos son reentrantes y OBLIGATORIAS.** `Fecha de Cotización` la escriben `notif_cliente_comercial` **y** `notif_cliente_sku`, ambas aterrizando en `Notificación cliente` |
| De salida | `Fecha Remisión de Salida − fecha de aviso` | **`Fecha Remisión de Salida` es reentrante y OBLIGATORIA** (`entrega_sin_factura`, componente C1 — el ciclo de C4) |

El maestro afirma: *«Dos de los tres ya son calculables hoy.»* **Son calculables mal** para cualquier ticket que haya recorrido un bucle: una recotización borra la fecha de la primera cotización, y una segunda aprobación con repuestos pisa la orden de compra original.

Y el propio maestro enuncia, en ese mismo apartado, la regla que el proyecto se saltó sin darse cuenta:

> *«Toda decisión que cambie el momento en que se crea un registro o se rellena una fecha debe revisar los indicadores que dependen de ella. En este documento, esa revisión no existía como paso.»*

La reentrancia es exactamente una instancia no advertida de esa regla.

**Consecuencias:**

1. **C9 no está «resuelta en su definición y pendiente sólo del campo de aviso»**, como afirma el maestro. Está pendiente además de resolver la reentrancia de sus tres fórmulas.
2. C7 y C9 se construyen juntas (línea 1706), luego **la reentrancia bloquea las dos**.
3. La solución ya propuesta —calcular sobre `ticket_transitions.values`, que conserva todos los valores— tiene ahora un consumidor con nombre y fórmula, no es una recomendación genérica.

---

## 3. Lo que la lectura confirma

| Afirmación | Verificación |
|---|---|
| **M1.9.1 dice diez** | Línea 1636, literal, marcado `[AS-BUILT]`: *«Diez de las 34 transiciones son compartidas por dos áreas.»* La corrección a ocho se sostiene entera |
| **El «dolor nº 2» existe y es el de la orden de compra** | §1.7 nº 2: *«El equipo queda bloqueado semanas o meses esperando la orden de compra del cliente, ocupando mesa de trabajo.»* Origen: acta 14/08. **Pero el módulo que lo resuelve es M4 (aprobación 1 clic + cola de espera), no la vista del tablero ni C7** |
| **Traza sin excepciones** | M1.10 `[DECIDIDO — R08]`: *«Toda etapa y toda transición deben registrar fecha, hora y persona… no admite excepciones.»* La tarea de F0-04 tiene mandato explícito |
| **`Liberación Comercial` es de Comercial** | Anexo B.1 la lista bajo Comercial. Corrobora su clasificación como espera interna en la pregunta 3 |
| **Foto sólo cuando hay novedad** | M2.1 `[AS-IS 27/08]`, con el motivo: *«obligar a fotografiar lo que está bien multiplica el trabajo sin añadir información»* |
| **Los Excel de inspección son el mecanismo de entrega previsto** | M2.1: *«respalda alimentar los checklists desde plantillas en Excel en lugar de desde una pantalla de administración»*. No son sólo material de partida |

---

## 4. Lo que el maestro dice y ninguna de las diez respuestas usó

### 4.1 — Para C4 ya hay una solución propuesta, y no es poner guardas

M1.3.5, «La solución propuesta por el revisor [R08]»: *«En lugar de parchear el ciclo conservando la primera fecha, la propuesta es **eliminar el ciclo**: separar las dos vías en ramas que avanzan, y que ninguna vuelva atrás.»*

| Vía | Recorrido propuesto |
|---|---|
| Con factura | `Por Facturar → Por Entregar → remisión de salida → Finalizado` |
| Sin factura | `Por Facturar → Por Entregar / Sin facturar → remisión de salida → **Pendiente de facturar → Facturado** → Finalizado` |

Dos estados nuevos. El proposal de F0-04 planteó C4 como «decidir qué significa cada campo» sin mencionar que hay un diseño sobre la mesa.

**Nota:** eliminar ese ciclo resuelve **1 de los 9** casos reentrantes (el componente C1). Los **8 del componente C2** —el núcleo de diagnóstico, cotización, repuestos y servicio externo— siguen sin tratar en el maestro.

### 4.2 — El maestro da orden de ejecución y separa lo que puede cerrar desarrollo

Líneas 3085–3086:

- **Orden sugerido:** C1 → C4, C5, C9, C11 → C12 → C2 → C10 → C3.
- **Dos grupos:** C1, C10, C11 y C12 *«recuperan reglas que ya existían… las puede cerrar desarrollo»*; C2, C3, C4, C5, C6, C7, C8 y C9 *«cambian el proceso, heredado de Zoho desde 2021, y requieren una decisión de negocio»*.

### 4.3 — F1B-06 ya tiene su as-is en el Anexo B

| Flujo | Estados |
|---|---|
| Equipo nuevo | `Ingresado · En Proceso · Notificado · Verificación (sin salida) · Finalizado` |
| Soporte remoto | `Solicitud Soporte · En Proceso · Pendiente · Finalizado` |

`Verificación` **no tiene ninguna salida** (B.3). Es un defecto del as-is que F1B-06 hereda si lo transcribe sin más.

### 4.4 — Las cuatro macro-fases están asignadas y pendientes

M2.1: *«Está por definir —trabajo asignado a Johny— un juego de macro-fases que permita un proceso común a todas las marcas y modelos.»* Punto abierto nº 45. Decididas en principio (cuatro, comunes, en orden física → neumática → óptica → electrónica); el juego concreto, pendiente.

---

## 5. Qué hacer con esto

1. **No emitir `F0-00_Respuestas_Gerencia.md`** hasta cerrar la pregunta 3 con §1.2 y §1.3 de este documento delante.
2. **Leer el Anexo D y el Anexo G** antes de escribir ninguna spec. Son los dos que más citan las diez respuestas y los dos que siguen sin verificar de primera mano.
3. **La pregunta 3 se rehace en dos piezas**, no en una: la clasificación de los 21 estados para la vista del tablero (sobrevive) y el diseño de C7 como sub-estados de pausa (nuevo, y va junto con C9).
4. **F1C-02 arranca desde M1.3.5**, no desde cero, y sabiendo que su propuesta cubre 1 de los 9 casos reentrantes.
5. **Retirar la advertencia sobre el invariante de F0-04.** Era falsa; el grafo no varía por modelo.

---

## 6. Anexo D — lo que dice de verdad

Leído completo (63 puntos; el 19 y el 22 no existen, y hay tachados resueltos).

### 6.1 — El punto 14 **no** es la doble escritura, y ya está cerrado

Texto literal: *«Confirmar si la entrada de `remisiones_entrada` procede de la plataforma de hojas de vida.»* Módulo M2. **Quién decide: Desarrollo.**

La auditoría lo respondió (§7.1 del baseline): **no**, la escribe n8n en una hoja de Google. **Con eso el punto 14 queda cerrado, y lo cierra Desarrollo, no Gerencia.**

La decisión sobre la doble escritura es real, pero **no es el punto 14**: es una cuestión sin numerar, registrada sólo en `debt.md:419-420`. La respuesta 9 las trató como una sola.

### 6.2 — El punto 34 es la reentrancia, ya abierta, y con la solución ya nombrada

*«Decidir cómo se conserva la fecha de la primera entrega en el ciclo facturar↔entregar: campo nuevo que no se sobreescriba, **o evento en el historial**.»* M1.3.5 · C4 — Comercial / desarrollo.

«O evento en el historial» es exactamente la solución que este análisis proponía. **No es una aportación nueva: ya estaba sobre la mesa.** Lo que sí es nuevo es el alcance — el punto 34 cubre un campo; el problema afecta a diez campos en nueve transiciones.

### 6.3 — La taxonomía de C5 del maestro y la de las hojas del 16/02 no coinciden

Punto 35: *«Fijar la taxonomía de tipo de evento (**operativo / decisional / logístico**)…»* — tres valores.

Las hojas `DF-equipo-nuevo-030226.xlsx` y `DF-soporte-remoto-030226.xlsx` usan **cuatro**: `Operativo manual · Operativo digital · Decisional · Operativo Comercial`.

Se dijo antes que «C5 no diseña desde cero». Es cierto que hay material, pero **las dos fuentes proponen taxonomías distintas** y hay que elegir, no destilar.

### 6.4 — Tres puntos abiertos que ninguna de las diez respuestas tocó

| # | Punto | Por qué importa aquí |
|---|---|---|
| **52** | *«Modelar las variantes reales de orden de venta… **tickets con varias OV asociadas. Ninguna encaja en “una OV, un ticket”**.»* | El código **implementa** «una OV, un ticket» y devuelve 409 en las dos puertas. El maestro dice que ninguna variante real encaja en ese modelo. Es un conflicto vivo entre lo construido y lo decidido |
| **20** | *«Decidir hasta cuándo se mantiene la interfaz que replica Zoho Desk.»* | Es el contexto que faltaba en la pregunta 1. Si esa interfaz tiene fecha de retirada, no probarla se refuerza; si no la tiene, la decisión es otra |
| **62** | *«El 27/08 se acordó **retirar las referencias a lo construido** por considerarlas ruido; la revisión posterior encargó expresamente la tabla del Anexo H. **Son criterios opuestos y hay que elegir.**»* | Toda la auditoría F0-00 y las specs as-built de F0-02 dan por hecho que la capa as-built se quiere. Está sin decidir |

Y el punto 60 decide qué ordena el MVP: el criterio de §3.1 (cumplimiento de fecha e integridad del dato) o el del 03/09 (replicar Desk 1.0 para migrar rápido). *«No son incompatibles, pero son órdenes distintos.»*

### 6.5 — Confirmaciones

El punto 44 es literal el que la respuesta 10 discutió, con sus tres opciones —excepción acotada, importación manual, o esperar a sustituir el CRM— y decisor Alfonso. El 39 confirma C10 como modelo de tres niveles (área · cargo · propietario). El 36 coincide con los hallazgos a.10 y a.11 del baseline. El 41 amplía C9: no es sólo el bodegaje de entrada, también *«los tiempos de inicio de servicio y de diagnóstico»*.

---

## 7. Anexo G — resuelve la pregunta 10, y agrava el hallazgo de la reentrancia

### 7.1 — Los campos «Final» son una duplicación de layout de las columnas 42 y 43

G.5 documenta quién escribe cada fecha de hito, según la hoja del 16/02:

| Col. | Campo | «Se escribe en», según G.5 |
|---|---|---|
| 42 | `Fecha Orden de Compra` | Habilitar Servicio · **Aprobación** · Aprobación y S. Repuestos |
| 43 | `Fecha Orden De Venta` | Habilitar Servicio |

**G.5 dice que `Aprobación` escribe la columna 42.** El código dice que `aprobacion` escribe `Fecha Orden de Compra **Final**` (`transitions.ts:202-203`).

Misma transición, misma ranura semántica, etiqueta distinta. **La pareja «Final» es la columna 42/43 renombrada en el layout de Zoho para la rama de `Aprobación`** — no un hecho de negocio nuevo. La hipótesis de «no se espera otra orden» queda desplazada por evidencia documental.

**Y de ahí sale un defecto peor que la sobreescritura.** La columna 58, *«Tiempo de orden de compra»*, se calcula como `Fecha Orden de Compra − Fecha de Cotización`, y M1.10 dice que **es exactamente el bodegaje de proceso**. Un ticket aprobado **sin repuestos** escribe la columna «Final» y deja la 42 vacía:

> **El bodegaje de proceso no es calculable para ningún ticket aprobado sin repuestos.** No es que el valor se pise: es que se escribe en la columna equivocada.

### 7.2 — G.5 no coincide con el código en dos filas, y una divergencia es deliberada

`habilitar_servicio` **no** escribe `Fecha Orden de Compra`, contra lo que dice G.5 col 42. El código lo documenta y razona (`transitions.ts:179-180`): *«Sin `Fecha de Cotización` ni `Fecha Orden de Compra`: en esta etapa no aportan —la cotización y la compra pueden no existir todavía— y las dos tienen su propia etapa.»*

Y la col 43 está incompleta: `Fecha Orden De Venta` la escriben `habilitar_servicio` (opcional, autorrellenada por la OV elegida, `:189`) **y** `aprobacion_y_repuestos` (obligatoria, `:199`).

G.8 declara que *«G.5 y G.6 son el mínimo que Desk 2.0 tiene que conservar»*. Un mapa de escritores equivocado se propaga al modelo de datos.

### 7.3 — El alcance de C9 en el maestro se queda corto

G.8, textual: *«la fila de `Fecha Remisión de Salida` en G.5 es la que la C4 tiene que dejar de sobreescribir; las columnas **48, 49 y 56** son las que la C9 tiene que redefinir.»*

C9 sólo cubre las tres columnas rotas por la creación anticipada de tickets. Cruzando G.6 con la enumeración de ciclos reentrantes, **hay cuatro indicadores más rotos, y por otra causa**:

| Col. | Indicador | Fórmula (G.6) | Campos reentrantes que usa |
|---|---|---|---|
| 47 | Tiempo permanencia | remisión entrada → remisión salida | `Fecha Remisión de Salida` *(sí lo cubre C4)* |
| 50 · 53 | Tiempo de servicio | desde `Fecha Orden De Venta` —o `Fecha Recepción de repuestos`— hasta `Fecha Finalización ST` | **las dos primeras** |
| 57 | Tiempo de cotización | `Fecha Revisión Informe − Fecha de Cotización` | **`Fecha de Cotización`** |
| 58 | Tiempo de orden de compra | `Fecha Orden de Compra − Fecha de Cotización` | **las dos** |

Ninguno está en el alcance de C4 (una fila) ni en el de C9 (tres columnas).

### 7.4 — Una inconsistencia interna del maestro

El punto 16 del Anexo D dice que el Anexo G documenta *«los **trece** indicadores calculados»*. G.6 tiene **once**. El baseline decía once y acertaba.

---

## Anexo — Regla de método, ilustrada

Las cinco correcciones de §1 vienen del mismo sitio: **la fuente primaria estaba disponible y decía otra cosa.**

| Corrección | De dónde salió la afirmación errónea |
|---|---|
| El invariante de F0-04 | Inferida de los Excel de `docs/inspecciones` |
| C7 como atributo | Citado vía el baseline |
| La justificación de C9 | Inventada |
| El principio nº 8 | Citado de memoria y estirado |
| «Externo» | Tres definiciones mezcladas sin comparar las fuentes |

La regla ya adoptada —*verificado con ruta y línea, o marcado como hipótesis*— habría atrapado las cinco. Conviene añadirle una segunda mitad: **una cita de segunda mano es una hipótesis, aunque venga de un documento propio.**
