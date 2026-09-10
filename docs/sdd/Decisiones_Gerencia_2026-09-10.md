# Decisiones de Gerencia — 10/09/2026

Respuestas a los puntos planteados en `docs/sdd/Puntos_para_Gerencia_2026-09-11.md`, decididas por
Gerencia (Alfonso García del Pino) el **10/09/2026**, la víspera de la sesión.

**Cuatro de los seis puntos quedan cerrados aquí.** El quinto (IV-8) se resuelve solo con el nº 52.
El sexto (las cinco entradas de correcciones al plan) sigue pendiente.

| # | Punto | Estado | Clave en Engram |
|---|---|---|---|
| 1 | nº 38 · las dos salidas de `Verificación` | **Cerrado con datos**, salvo tres confirmaciones de Calidad | obs. #400 |
| 2 | nº 52 · cardinalidad OV ↔ ticket | **Decidido** | `decision/n52-cardinalidad-ov` |
| 3 | La vista «Todos» del tablero | **Decidido** | `decision/vista-todos-tablero` |
| 4 | IV-2 · las tres fechas derivadas | **Decidido** | `decision/iv2-fechas-derivadas` |
| 5 | IV-8 · `ticketService.ts:39` | Se resuelve con el nº 52 | — |
| 6 | Las cinco entradas de `F0-01_Correcciones_para_el_plan.md` | **Pendiente** | — |

---

## 1 · nº 38 — `Verificación` sí tiene salida, y la R05 abrió el hueco

**Resuelto con datos, no con criterio.** Gerencia extrajo el historial de estados de Zoho Desk de los
**181 tickets con clasificación «Equipo Nuevo»** (oct-2021 → ago-2026, extracción completa sin
muestreo, todos en `Finalizado`).

### Transiciones observadas

| Origen → Destino | Vía | Nº |
|---|---|---|
| `Ingresado → En Proceso` | BP · Ingreso equipo nuevo | 192 |
| `En Proceso → Finalizado` | BP · Liberación | 116 |
| `En Proceso → Verificación` | BP · Verificación | 72 |
| **`Verificación → Finalizado`** | **BP · Liberación** | **71** |
| `Verificación → Ingresado` | Manual | 2 |
| `En Proceso → Notificado → Ingresado` | BP · Producto no conforme / Análisis y acciones | 1 |

### Qué queda contestado

- **`Verificación` es paso del flujo, no registro.** Contesta la pregunta previa que `R08.1.md:1468`
  dejaba abierta.
- **La salida «aprobada» no es una elección de diseño**: es `Verificación —Liberación→ Finalizado`,
  observada 71 veces. La bifurcación que `:1470` proponía —«devuelve a `En Proceso` o pasa a
  `Finalizado`»— queda resuelta por los hechos.
- **C12 deja de ser corrección y pasa a ser recuperación *as-is*.** La transición existe en Zoho y se
  usa; lo que falta es que el maestro y el código la tengan. **La escribe desarrollo sin esperar a
  Calidad.**

### La R05 arregló una fila falsa y abrió un hueco en la misma edición

`R08.1.md:1445` dice que la R05 corrigió M1.4 «de seis transiciones a cinco», retirando
«Verificación → (aprobación implícita) → En Proceso». **Acertó al retirarla** —cero apariciones en
181 tickets— **pero no añadió la real**. Por eso `:1469` afirma que «un equipo nuevo enviado a
verificación de calidad no puede volver al flujo»: vuelve 71 veces. **El estado sin salida nunca fue
un problema operativo; era un defecto de documentación.**

### Correcciones al maestro que se derivan

1. **M1.4 tiene cinco filas y son seis.** Falta `Verificación —Liberación→ Finalizado`. La nota de
   `:1445` hay que enmendarla.
2. **`Liberación` tiene DOS orígenes**, `En Proceso` (116) y `Verificación` (71). El maestro declara
   uno, y **eso es lo que F1B-06 iba a construir**.
3. **La condicionalidad por familia de equipo no está escrita en ningún apartado** (ver abajo).
4. **M7.3 no puede medir la verificación con la duración del estado.** 72 estancias, mediana 14 min,
   distribución bimodal: 30 por debajo de 5 min —se registra al terminar— y 30 por encima de 1 h, 16
   por encima de un día. El estado tiene que abrirse al **empezar** la verificación.

### `Verificación` es condicional por familia de equipo

Regla de facto observada — **verificación con gas patrón**:

| Familia | Tickets | Pasan por `Verificación` |
|---|---|---|
| Horiba AP-370 (analizadores de gases) | 81 | 58 (72 %) |
| Convertidores TRS / NH3 | 8 | 7 (88 %) |
| GRIMM EDM (partículas) | 45 | **0** |
| Dataloggers SICA | 7 | **0** |
| Shelters / mástiles | 7 | **0** |
| Environics calibrador / aire cero | 7 | **0** |
| Otros (sondas, meteorología, OCMA, Kunak…) | 26 | 3 |

**Excepción sin explicar:** los 23 AP-370 sin `Verificación` son todos del lote de **jul-2024
(#601–#622)** y **oct-2024 (#653, #654)**. Fuera de ese lote, todos los AP-370 pasaron.

### Lo que queda para Gustavo / Calidad

1. **¿La obligatoriedad se ata a la familia de equipo?** Si Calidad confirma la regla de facto, es una
   guarda («analizador de gases ⇒ `Verificación` obligatoria antes de `Liberación`»); si no, es
   costumbre y no se codifica.
2. **¿Qué pasó con el lote AP-370 de 2024?** Determina si la guarda es dura o admite excepción.
3. **Confirmar `rechazada → Notificado`** (bucle de producto no conforme). **Cero rechazos de calidad
   en 181 tickets**: hace falta para cerrar el grafo, no por volumen. Las 2 salidas manuales
   `Verificación → Ingresado` (#181, #203, 2021) son correcciones de estado a los 2 minutos.
4. **Guarda de certificado** en `Liberación` desde `Verificación` (tarea «Verificar y generar el
   Certificado»).

### Desbloquea

- **F1A-03** deja de estar parada, y sin esperar a Calidad: las tres preguntas afectan a la guarda de
  obligatoriedad, no a la existencia de la transición.
- **F1B-06** construye el blueprint de equipo nuevo con datos observados en vez de con la tabla
  incompleta del maestro.

### Hallazgo lateral

**Ticket #979** (EDM180C, Epsilon Lab, ago-2026): clasificado `Equipo Nuevo`, pasado a mano a
«Servicio externo» y cerrado por el blueprint de **servicio técnico** (`Por Facturar → Liberación
Comercial → Por Entregar`). Mezcla de flujos en un mismo ticket. Es el mismo ticket que apareció por
otra vía al revisar por qué la vista «Todos los Tickets» de Zoho Desk ocultaba registros.

---

## 2 · nº 52 — la relación es `1 ticket : N OV`, sin tabla puente

**Decidido.** Verificado contra Zoho Books (org. 714421387).

### Las tres variantes, resueltas

| Variante (`R08.1.md:2071-2078`) | Cardinalidad aislada | Resolución |
|---|---|---|
| OV global por lote (varios equipos) | 1 OV → N tickets | **Se elimina.** Comercial subdivide en subórdenes (`OV-2026-XXX-01`, `-02`…), una por ticket, **al crear la OV** |
| OV separadas por mano de obra y repuestos | N OV → 1 ticket | **Se mantiene** — es requisito del cliente (sus propias OC), no hábito interno |
| Varias OV sobre la marcha | N OV → 1 ticket | **Se mantiene** — hoy sólo se muestra la última y se pierde la trazabilidad de la primera |

**Por qué no hace falta tabla puente.** La subOV de lote era la única variante que hacía que una OV
apuntara a varios tickets. Resuelta ésa, sólo queda que un ticket tenga varias OV: eso es 1:N desde el
ticket, no N:M.

### No se retira nada de lo construido

F0-04 implementó «una OV → un único ticket» en tres puertas (`c62fb42`), dos activas. **Esa
restricción sigue siendo válida y sigue debiendo cumplirse.** Lo que se relaja es la restricción
implícita en sentido contrario —que un ticket sólo pueda tener una OV—, que hoy vive en el campo
singular `salesorder_id` y en el desplegable de selección única.

### Tres comprobaciones contra el código

1. **`ordenVentaUnTicket.test.ts:141-159` prueba la dirección que se mantiene.** Afirma
   `porId: [7001, 7002]`, es decir una OV que acaba en DOS tickets. **Sigue en verde**, y el `it.fails`
   de `:161` **debe ponerse verde**: la tercera puerta sigue mereciendo construirse. **IV-4 pasa de
   bloqueado a construible.**

2. **La FK no puede ir en `sales_orders`.** `schema.sql:160` la declara en el esquema `books` con
   `synced_at`: es la **réplica del hub**, y `public.sales_orders` (`:176`) sólo una vista. Escribir
   `ticket_id` ahí lo borra cada pasada del sync — el mismo modo de fallo que el `serial` de los
   tickets de Zoho (`repo.ts:63`, que sólo se salva por la guarda `managed_by_app` de `:58-59`).

   **La asociación va en tabla propia de la app, con `salesorder_id` como `PRIMARY KEY`.** No es una
   tabla puente —una puente tendría clave compuesta y permitiría N:M—: es el `1 ticket : N OV` exacto.
   Y con esa PK, «una OV, un ticket» pasa a ser **restricción de la base de datos** en vez de tres
   guardas de aplicación que hay que mantener sincronizadas.

3. **`cf_n_ticket` ya está cableado.** `schema.sql:179` lo expone en la vista como `ticket_number`.
   Sirve para **precargar el desplegable como sugerencia**; nunca para escribir la asociación — es
   texto libre, `is_mandatory: false`, `is_unique: false` (verificado en Zoho Books).

### Dónde y cuándo se escribe la asociación

- **Dirección**: en la fila de la orden de venta, no en la del ticket.
- **Momento**: no coincide con la creación de la OV, que es anterior al ticket (precondición comercial
  del 21/08). Se escribe desde el lado del ticket, en uno de dos puntos:
  - **Nuevo ticket** — asociación *opcional*, contra las OV existentes.
  - **Habilitar Servicio → Ingresado** — asociación *obligatoria*, extendiendo la regla actual.
- **Selección**: desplegable de OV sin ticket asociado, filtrado por cliente. Un ticket puede
  seleccionar más de una.

### Pendiente de confirmar en la sesión

1. Si la asociación en «Nuevo ticket» es opcional u obligatoria — **va con el punto abierto nº 21**
   (OV antes de recepción) y conviene resolverlos juntos.
2. Criterios de aceptación de la subOV de lote: se retira del desplegable al consumirse; el saldo
   pendiente es visible; un contrato agotado no puede consumirse por un ticket nuevo.
3. **Qué pasa cuando llega una OV de lote sin subdividir** — rechazarla, o permitir subdividirla desde
   Desk. Eliminar esa variante es un **cambio de proceso comercial**, no de software: el modelo entero
   depende de que Comercial subdivida siempre, desde el día uno.

### La titularidad va aparte

El nº 52 habla de **cardinalidad**, no de **titularidad**. No dice que la OV y el equipo puedan ser de
clientes distintos. La guarda que hoy rechaza altas por discrepancia de cliente
(`ticketService.ts:65-77`) **no puede apoyarse en el nº 52**, y va como punto propio. Es también donde
queda **IV-8** (`ticketService.ts:39`).

---

## 3 · La vista «Todos» — pasa a devolver también los cerrados

**Decidido: opción (b).** Se descarta renombrarla a «Abiertos».

Una vista rotulada «Todos los Tickets» que oculta **726 registros** no informa, desinforma.

### No es el cambio barato que se estimaba

| | |
|---|---|
| `App.tsx:57` | `useState('todos')` — «todos» es la vista de **aterrizaje** |
| `App.tsx:70` | `applyBoardView(all, view)` — el filtro es de cliente |
| `tickets.ts:114` | el `default` llama a `getActiveTickets` — **el servidor ya filtra los cerrados** |
| `tickets.ts:113` | «`scope=all` (compat, **sin uso en el front**)» |

**Hoy los cerrados no llegan al navegador.** El filtro `statusType !== 'Closed'` de `boardView:49-50`
es casi un no-op. Así que (b) exige cambiar **qué se pide**, no cómo se filtra:

- Hay que pasar la petición de aterrizaje a `scope=all`, camino que **existe pero está declarado sin
  uso** en el front.
- Pasa de ~25 filas a **~751 en cada carga**, con cinco `LEFT JOIN` por fila y sin `LIMIT` visible en
  `getAllTickets` (`repo.ts:150`).

**Forma recomendada, y es decisión de implementación, no de Gerencia:** la vista de aterrizaje sigue
pidiendo los activos, y los cerrados se piden cuando el usuario **selecciona** «Todos». Rápido al
entrar, honesto al pedirlo.

### Lo que no es opcional con ninguna salida

`case 'todos':` comparte cuerpo con `default:`, así que cualquier clave de vista desconocida recibiría
los 751 y el rótulo «Todos los Tickets» (`boardView.ts:22`). **Hay que separarlos en la misma tanda.**

### Se cierra junto con IV-1, que no necesita decisión

La regex `/espera/i` de `boardView.ts:35` acierta **2 de los 8** estados `en_espera` y no tiene falsos
positivos. Se sustituye por `ESTADOS_EN_ESPERA`, que ya existe en `packages/shared/src/estados.ts:111`.
Hoy **seis estados de espera se listan como «abiertos»**. Las dos viven en el mismo fichero: **F1B-08**.

---

## 4 · IV-2 — el servidor impone las tres fechas, y va como F1A sin gate

**Decidido: opción (a).** El servidor calcula las tres fechas él mismo e **ignora lo que llegue del
navegador** para esos campos.

### Por qué no necesita gate

No abre una decisión de negocio: **cierra un hueco contra una regla ya decidida**. M1.10 está
`[DECIDIDO — R08]`: «toda etapa y toda transición deben registrar fecha, hora y persona […] no admite
excepciones». Misma categoría que C1 y que la tercera puerta de la OV — no hay alternativa que
discutir, hay una regla que no se cumple.

Es además el tercer tipo de error que el R04 nombró como el más peligroso: *el sistema guarda un dato
bien formado, que pasa cualquier validación, y que significa algo distinto de lo que realmente
ocurrió*. Una fecha derivada mal en el navegador entra limpia y miente.

**Es el caso opuesto a IV-3, no el mismo.** IV-3 se cerró como sano porque el servidor tiene matriz de
permisos propia y probada detrás del espejo. Aquí no hay nada detrás: `transitionExec.ts:77` sólo exige
que el campo **llegue**, no lo recalcula ni lo contrasta.

**Y pesa sobre un KPI que ya se había roto una vez.** `Fecha Remisión Entrada` es el operando que abre
el bodegaje de entrada (`bodegaje.ts:58-65`). C9 se cerró anclando el indicador en hechos físicos
precisamente para que no volviera a fallar; si ese ancla puede llegar mal, la corrección quedó resuelta
sólo sobre el papel.

### Las tres fechas, y la asimetría que cambia el tamaño del arreglo

| Fecha | De dónde sale | ¿Zona horaria? | Riesgo al mover |
|---|---|---|---|
| **`Fecha Remisión Entrada`** | `entrada.fecha`, ya `YYYY-MM-DD` (`:56`, `:65-67`) | **No** | **Ninguno** — es leer la misma fila |
| `Fecha creación ticket` | `diaLocal(ticket.createdAt)` (`:62-64`) | **Sí** | Cambia de día |
| `Fecha Revisión Informe` | `diaLocal(ticket.escaladoARevisionAt)` (`:72-74`) | **Sí** | Cambia de día |

**El operando del KPI es el que tiene riesgo cero**: no pasa por `diaLocal`.

**Pero `diaLocal` (`:30-36`) usa `getFullYear/getMonth/getDate`**, o sea la zona horaria del proceso
que lo ejecuta: el dispositivo del técnico en el navegador (Bogotá, UTC−5), el VPS en el servidor
(previsiblemente UTC). Un ticket creado a las **19:30 en Bogotá del día 9** es `00:30 UTC del día 10`:
**cinco horas de cada día cambiarían de fecha en silencio** si se mueve el cálculo sin fijar la zona
explícitamente. No invalida la decisión —la hace más necesaria, porque hoy el valor depende del reloj
del portátil de quien teclea— pero la corrección **debe fijar la zona**, no heredar la del proceso.

### Dos cosas que decide la tanda, no Gerencia

1. **La forma barata no es calcular y comparar.** Es que el servidor **ignore** lo que llegue para esos
   tres campos y los derive él, reutilizando la lógica que hoy vive sólo en `valoresTransicion.ts`.
   Comparar y reconciliar sería dos caminos y una tercera decisión.
2. **`yaEsta(...)`**: hoy la semántica es «prellena si falta», no «calcula siempre». Al mover al
   servidor hay que elegir entre respetar el valor existente —no cierra el hueco— o recalcular siempre
   —lo cierra, pero puede reescribir valores corregidos a mano—.

### Antes de escribir la corrección

Barrer qué otro KPI o campo, además del bodegaje de entrada, consume cada una de las tres, para no
dejar ninguno con el mismo hueco.

---

## 5 · IV-8 — sin decisión propia

`ticketService.ts:39` (`clientId = clientId ?? ov.clientId ?? null`) no contrasta el cliente de la OV
cuando el cuerpo trae el suyo. **Se resuelve el día que se decida la titularidad**, que va con el
nº 52 pero como punto separado. Queda anotado, con su porqué y sin destino inventado.

---

## 6 · Las cinco entradas de correcciones al plan — PENDIENTE

Sigue sin respuesta. Texto listo para pegar en `docs/sdd/F0-01_Correcciones_para_el_plan.md`.
Las entradas **3** (el bodegaje anclado en un hito que la R08 sustituyó) y **4** (dos tandas de
auditoría dimensionadas sobre un generador que no existe) son las que ahorran trabajo perdido; las
otras tres son higiene.

---

## 7 · P21 — «OV obligatoria para trabajar, no para recibir»

**Decidido**, y con esto **se cierra el punto abierto nº 21** (`R08.1.md:3943`). Clave en Engram:
`decision/p21-ingreso-sin-ov`.

**Se deja como está: OV opcional en «Nuevo ticket», obligatoria en `Habilitar Servicio`.**

No contradice el acta del 21/08, que pedía OV previa por trazabilidad: esa intención se conserva donde
importa, porque **nada entra a diagnóstico ni genera costo sin OV**. Lo que la R08 descartó fue
bloquear la recepción física.

**Verificado: el código ya hace exactamente eso.** Los obligatorios del alta son `cliente`,
`tipo de servicio`, `clasificaciones` y `prefijo` (`ticketService.ts:88-91`, sin OV); y `cfOrdenVenta`
es `required = true` por defecto (`transitions.ts:86`) en `habilitar_servicio`. La decisión **confirma
lo construido**, no lo cambia.

### 7.1 · El estado provisional ya existe: es `Remisión creada`

| Estado sin OV | Qué significa | De quién depende |
|---|---|---|
| `Ticket creado` | El equipo no ha llegado — Comercial crea tickets por anticipado desde el 20/08 | Cliente / logística |
| **`Remisión creada`** | **El equipo está en bodega esperando la OV** | Comercial |

`Ticket creado` mezcla dos situaciones; `Remisión creada` significa una sola. **No hace falta estado
nuevo.**

**Pero `Remisión creada` NO está entre los 8 `en_espera`:** `estados.ts:90` la clasifica como
`'ninguna'`. Los equipos parados en bodega **no aparecen como espera en ningún sitio**. Hay que
añadirla con área **Comercial**, y hace falta **junto con** la corrección de `boardView.ts:35` —la
regex que acierta 2 de 8— para que lleguen a verse. Las dos van en la misma tanda.

### 7.2 · La alarma: N = 3 días

Va al registro que C11 dejó montado, `SLA_HORAS_POR_ESTADO` (`sla.ts:34`), **que está en horas**:

```ts
'Remisión creada': 72,
```

**⚠️ Eso pondrá ROJA la guarda de C11**, y es correcto que lo haga. La prueba «estados con SLA y sin
destinatario de escalado» exige conjunto vacío, y el escalatario se deriva del cargo de la transición
saliente vía `DERIVACION_POR_DEFECTO` (`transitions.ts:269-275`). **`habilitar_servicio` no tiene
entrada ahí**, así que `escalatarioDe` devolvería `{ hay: false, motivo: 'ningun_cargo' }`.

Hay que **declarar qué cargo de Comercial recibe el escalado**: es una decisión, no código. El **aviso
por área** sí funciona sin eso (`avisoArea.ts`); lo que falta es la segunda mitad de C11, el escalado
al superior.

### 7.3 · `Habilitar Servicio` sin remisión: nunca

Hoy sale de tres orígenes y uno —`Ticket creado`— lleva a `Ingresado` **sin remisión de entrada**. La
guarda exigirá remisión de entrada vigente (no anulada) para los tres.

**Consecuencia verificada, y hay que asumirla a propósito.** `habilitar_servicio` es la **única
transición con botón** que sale de `Ticket creado` (`transitions.ts:178`; la otra ocurrencia, `:164`,
es una función auxiliar). Retirar ese origen deja al estado **sin salida con botón** y **rompe el
invariante 3** («`Finalizado` es el único estado sin salida»), hoy en verde.

Operativamente el estado sí tiene salida: el paso sin botón `Ticket creado → Remisión creada`, que
aplica el servidor. Pero los siete invariantes se afirman sobre `TRANSITIONS`, que **excluye los dos
pasos sin botón a propósito**. Así que hay que **relajar el invariante 3 conscientemente**, admitiendo
estados cuya única salida la aplica el servidor. Ya estaba anticipado en `invariantesGrafo.test.ts:73`
para F1B-06 — llega antes y por otra vía.

- `OV asignada` (Zoho) → `Ingresado` tampoco pasa por `Remisión creada`. La guarda lo cubre porque
  exige que la remisión **exista**, aunque no cambie de estado. Ese origen desaparece con la salida de
  Zoho (31/12/2026).
- **Servicio en sitio no se resuelve con este atajo**: va a su propia rama del blueprint, punto abierto
  nº 43, que sigue abierto.
- **Antes de cambiar:** contar cuántos tickets del demostrador llegaron a `Ingresado` sin remisión. Es
  histórico que la guarda no repara, igual que el caso D-nuevo 4 de C1.
- **⚠️ El recuento «38 → 37 pasos» NO está verificado.** Retirar un origen de un `from` quita un
  camino, no necesariamente un paso. Medir antes de escribirlo.

### 7.4 · Garantía → OVI, pero es un cambio de práctica

Hoy un servicio en garantía no tiene OV, así que no podría pasar `Habilitar Servicio`. Se le asocia una
**OVI** (orden de venta interna), que ya se usa para dar salida a artículos de stock.

**Verificado en Zoho Books (org. 714421387):** las OVI existen con prefijo `OVI-`, total 0 y factura
interna `AMI-` también en 0 — el ciclo de facturación puede seguir igual. **Pero las 22 OVI de 2026
están a nombre de un contacto de Ambientalia** (21 de «Ambientalia S.A.S.», 1 de «Ambientalia /
Gecelca»), no del cliente final; el cliente real y el serial aparecen sólo en texto libre.

Creadas así, una OVI de garantía **no sale en un desplegable filtrado por cliente** y **choca con la
guarda de titularidad**. Creadas a nombre del cliente real —lo que propone Gerencia— la guarda no
necesita excepción. Es un **cambio de práctica**, no la práctica actual.

- **Discriminador:** el prefijo `OVI-`. Los KPI de ingresos y de ticket promedio **deben excluirlas**.
- **Pendiente: quién crea la OVI de garantía.** Hoy la crea Servicio Técnico, lo que sería una
  excepción de autor a la precondición «Comercial crea la OV», y hay que escribirla.
- **OVI sin ticket** (préstamos, complemento de stock) siguen existiendo sin asociación, sin conflicto.

**Hallazgo lateral con valor de negocio:** las líneas de una OVI conservan el costo de referencia
(`sales_rate`) aunque el precio sea 0 —25,98 · 33,98 · 14,76 USD—. Con cada OVI asociada a un ticket de
garantía queda medible el **costo de garantía por equipo, marca y proveedor**: material para reclamar
al fabricante y argumento de M4.5.

### 7.5 · Segunda OV en `Aprobación`: añade, nunca sustituye

`Aprobación` y `Aprobación y S. Repuestos` deben poder **añadir** OV al ticket, nunca sustituir la de
entrada. Es el flujo normal —OV de diagnóstico al entrar, OV de reparación al aprobar—, no una
excepción.

**Y con el modelo `1 ticket : N OV` un defecto conocido desaparece por construcción.** `Fecha Orden de
Compra` (col. 42) es uno de los diez campos de fecha reentrantes: se escribe en `Habilitar Servicio` y
otra vez en `Aprobación`, y la segunda borra la primera. Con la fecha viviendo en **cada asociación**,
no en el ticket, no hay nada que pisar.

Campos de la asociación: `ticket_id`, transición que asoció, fecha y hora, persona (regla R08 de
M1.10). **El bodegaje de entrada toma la fecha de la OV asociada en `Habilitar Servicio`.**

### 7.6 · P21, C9 e IV-2 son el mismo asunto desde tres lados

- **P21** decide que el equipo puede esperar la OV en bodega.
- **C9** mide cuánto espera: el tiempo en `Remisión creada` es exactamente el bodegaje de entrada.
- **IV-2** garantiza que la fecha que abre esa espera no llegue mal del navegador.

**Cerrado P21 con esta salida, IV-2 deja de ser opcional.**
