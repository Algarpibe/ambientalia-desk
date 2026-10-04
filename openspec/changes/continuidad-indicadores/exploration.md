# Exploración — `continuidad-indicadores` (F1F-05)

Base: rama `continuidad-indicadores`, salida de `main` en `f55b7d9`. Fecha: 2026-10-03.

**Procedencia de este fichero.** La exploración la hizo un agente sin escritura ni terminal y quedó en
Engram (`sdd/continuidad-indicadores/explore`, obs. 1330). Este fichero la transcribe **contrastando cada
cita contra el código y los documentos**. Lo que se pudo comprobar va en §1 a §5 con su `ruta:línea`; lo
que no, en §6 con la palabra «hipótesis». Tres lecturas del explorador salieron **incompletas o
desplazadas** y se corrigen en §7.

---

## 1. La letra de Gerencia

| Qué dice | Dónde |
|---|---|
| Se adelanta una sola pieza de `kpis`: la continuidad de los indicadores que hoy calcula Zoho Desk, «sobre las marcas de tiempo de las transiciones», como «tabla exportable, sin tablero, semáforos ni umbrales», calculados en paralelo con Zoho las semanas previas al corte | `openspec/config.yaml:2526-2527` (`decision/e009-kpis`, `respuesta_textual`) |
| Lista cerrada de nueve: 47, 49, 50·53, 51, 54 (contra el 52), 55, 57, 58 y 59. Fuera: 48, 56 y 16. Comprobación: cuatro semanas previas al corte, ≥ 95 % de los tickets coincidentes, diferencia máxima de un día, cada diferencia mayor explicada por escrito. «Si a la aplicación le falta algún hito para calcular uno de ellos, se dice antes de construir y se decide aparte» | `openspec/config.yaml:2654-2655` (`decision/e009b-lista-indicadores`) |
| La encuesta se envía a mano entre el 14/12 y la independencia; las respuestas se cargan en enero; la encuesta automática entra con el correo propio (1H) | `openspec/config.yaml:2857-2858` (`decision/encuesta-entre-corte-e-independencia`) |
| Una sola función compartida de horas y días hábiles; «ninguna otra tanda construye su propio cálculo de horas hábiles»; la usan «los indicadores que se midan en días hábiles» | `openspec/config.yaml:2554-2555` (`decision/calendario-habil`) |
| Orden: F1C-11, F1B-04 sin accesorios y F1F-05 | `openspec/config.yaml:3755-3756` (`decision/orden-tres-tandas-03-10`) |
| La fila del plan: «Continuidad de los nueve indicadores de Zoho, midiendo en paralelo desde el 16/11», talla S–M, antes del 14/12 | `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:129`; la fecha dura del 16/11 en `:270` |

El maestro R08.4 repite la decisión y añade el diccionario:

- La lista, la forma de entrega, la comprobación y la dependencia del calendario:
  `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2953-2958`.
- El 49 «se mide siempre desde las marcas de tiempo de las transiciones»: `R08.4.md:2951`.
- La reentrancia sigue **abierta** (Anexo D, punto 66) y «afecta a la comprobación del 95 %»: `R08.4.md:2961`
  y `R08.4.md:6364`.
- Definiciones del diccionario (Anexo G.6): 47 `R08.4.md:6285-6287`, 49 `R08.4.md:6291-6293`,
  50·53 `R08.4.md:6294-6296`, 51 `R08.4.md:6297-6299`, 54 `R08.4.md:6300-6302`, 57 `R08.4.md:6306-6308`,
  58 `R08.4.md:6309-6311`, 59 `R08.4.md:6312-6314`.
- G.6b, la tabla de los nueve y el décimo (después del corte): `R08.4.md:6315-6364`.
- El Anexo H da la tanda por «sin empezar»: `R08.4.md:6560`.

**Lo que la letra NO define, comprobado leyéndola:**

1. El 59 no tiene fórmula: «Lo que tarda en generarse la orden de venta» (`R08.4.md:6314`).
2. El 51 se define con «Hora de actualización del estado» (`R08.4.md:6299`), un dato que la aplicación
   no tiene como columna (§3).
3. La unidad del 49, del 47, del 51, del 57, del 58 y del 59 no está escrita; sólo el 50·53 dice «días
   hábiles».
4. Qué pasa con el 54 cuando el ticket no ha terminado o no tiene tiempo promesa.

## 2. Qué existe ya en el código

| Pieza | Dónde | Sirve para |
|---|---|---|
| `diasHabilesEntre(desde, hasta, cierres)`, intervalo `(desde, hasta]` sobre días civiles | `packages/shared/src/calendarioLaboral.ts:196` | 50·53 y 49 |
| `esDiaHabil`, jornada de lunes a viernes | `packages/shared/src/calendarioLaboral.ts:139`, `:14` | variante «lunes a viernes sin festivos» |
| `listarCierres(db)` | `apps/desk/server/db/calendarioCierres.ts:31-34` | cierres de empresa para el cálculo |
| `diaEnZona`, `ZONA_NEGOCIO` | `packages/shared/src/fechasDerivadas.ts:63`, `:13` | pasar una marca de tiempo a día civil de Bogotá |
| `marcaIngresoAServicio(historial)` y `PasoDelHistorial` | `packages/shared/src/bodegaje.ts:225-226`, `:104-110` | hito inicial del 49 |
| `HITO_INDICADORES_ROTOS = 'ingreso_a_servicio'` | `packages/shared/src/bodegaje.ts:94` | ídem |
| `INDICADORES_G6`: 47, 50·53, 57 y 58 consumen campos reentrantes | `packages/shared/src/reentrancia.ts:78-83` | marca de «reentrante» |
| La regla «los KPIs de G.6 se calculan sobre `ticket_transitions.values`, no sobre `tickets.*`» | `packages/shared/src/reentrancia.ts:24` | fuente de los hitos |
| Ruta de administradores con sesión | `apps/desk/server/routes/analisis.ts:11`; `requireAuth` en `apps/desk/server/auth/middleware.ts:14-23` y `requireAdmin` en `:26-29` | molde de la ruta nueva |
| Registro de rutas | `apps/desk/server/app.ts:56` | dónde se registra |
| Lectura masiva de tickets en una consulta | `apps/desk/server/analisis.ts:11-32` | molde de la lectura |
| Pestaña de análisis sólo para administradores | `apps/desk/src/components/Header.tsx:90`; cliente HTTP en `apps/desk/src/api/client.ts:426` | dónde va el enlace de descarga |

**Lo que NO existe:** no hay módulo de indicadores ni `openspec/specs/kpis/spec.md` (el directorio
`openspec/specs/` tiene dieciséis specs y ninguna es `kpis`). La capacidad sí está **declarada**:
`openspec/config.yaml:240`, y su propio texto dice que «NO tiene spec y sigue debiéndose»
(`openspec/config.yaml:263-265` en `f55b7d9`). La regla R-2 queda cumplida sin tocar `capabilities`.

**Lo que se parece y no es:** `computeAnalisis` (`packages/shared/src/analisis.ts:17-95`) calcula días
**naturales** de creación a cierre y un cumplimiento contra `diasEntrega` (`packages/shared/src/analisis.ts:62-67`).
No es el 50·53 ni el 54: otro origen, otro final y otra unidad. No se reutiliza ni se toca.

## 3. Los datos

- `desk.tickets` guarda `dias_entrega` (`packages/zoho-sync/src/db/schema.sql:30`) y las fechas
  `fecha_*` (`packages/zoho-sync/src/db/schema.sql:32-37`), promovidas desde los `customFields` de
  Zoho por etiqueta (`packages/zoho-sync/src/db/rows.ts:85-118`). También `created_time` y `closed_time`
  (`packages/zoho-sync/src/db/schema.sql:26`), `custom_fields` (`:40`) y `raw` (`:42`).
- `ticket_transitions` guarda `values` (jsonb) y `performed_at`
  (`packages/zoho-sync/src/db/schema.sql:57-61`), con índice por ticket
  (`packages/zoho-sync/src/db/schema.sql:78`). **Sólo tiene lo hecho desde la aplicación:**
  `apps/desk/server/db/equipos.ts:297-298`, `apps/desk/server/db/fechasTicket.ts:18-20` y
  `packages/shared/src/etapasDesdeHistoria.ts:19-21`.
- `ticket_history` guarda la historia cruda de Zoho (`packages/zoho-sync/src/db/schema.sql:244-254`).
- Lo que el sincronizador no promueve se queda en `custom_fields`: `ticketRowFromZoho` copia los
  `customFields` y borra los promovidos (`packages/zoho-sync/src/db/mappers.ts:43-44`, `:55-60`).
- Qué transición escribe cada fecha: orden de venta `packages/shared/src/transitions.ts:189` y `:199`;
  remisión de entrada `:191`; recepción de repuestos `:197`; orden de compra `:199`; cotización `:211`
  y `:213`; revisión del informe `:219` y `:221`; finalización `:223`; remisión de salida `:249` y `:251`.
- **No hay dato de satisfacción** en `apps/` ni `packages/`: la única aparición es un rótulo fijo «0 %»
  en `apps/desk/src/components/ClienteDetalle.tsx:174`.
- **No hay columna de «Hora de actualización del estado»** (columna 12 del export). El propio código lo
  dice al explicar la fecha de aviso: la columna 51 «lo aproximaba con la hora del último cambio de
  estado» (`packages/shared/src/transitions.ts:252-255`).

## 4. El export de Zoho, leído fila a fila

Fuente: `docs/analisis-tickets/Tickets.csv` (export de enero de 2026; 640 líneas empiezan por un ID de
ticket) y `docs/analisis-tickets/Diccionario de campos.txt`. Las fórmulas escritas están en las líneas
122 (columna 50), 125 (51), 131 (54), 137 (57) y 139 (58) del diccionario; la 141 (columna 59) no da
fórmula. **Se leyeron las filas 2 a 32 del CSV** y se rehízo la cuenta a mano. Los números de fila son
los del fichero.

| Col. | Lo que Zoho calcula, según los datos | Filas que lo comprueban |
|---|---|---|
| 47 | **«Hora de actualización del estado» menos fecha de remisión de entrada, en días naturales.** El export no trae fecha de remisión de salida | 9, 13, 15, 16, 25, 26, 27, 28, 29, 30 y 32 (p. ej. fila 27: del 16/12 al 02/01 son 17, y la hora de modificación es otra, el 09/01) |
| 49 | Días de **lunes a viernes, sin descontar festivos**, de la fecha de creación a la de revisión del informe, intervalo `(desde, hasta]` | 13 (11), 16 (8), 25 (8), 28 (20), 31 (6) y 32 (10). En la fila 28 el calendario laboral daría 17: caen el 25/12, el 01/01 y el 12/01 |
| 50 | Lunes a viernes sin festivos, desde la orden de venta —o desde la recepción de repuestos si la hay— hasta la finalización; 0 si es negativo o no hay finalización | 25 (8) y 32 (0: repuestos el 26/01, finalización el 22/01) |
| 51 | «Hora de actualización del estado» menos finalización, días naturales | 25 (3) y 32 (11) |
| 54 | «Cumple» si el 53 no supera el 52. **Con el 52 vacío o el ticket sin terminar también dice «Cumple»** | 25 («No Cumple»: 8 contra 1); filas 2 a 8 («Cumple» sin tiempo promesa) |
| 55 | Texto, no número: el valor que aparece es **«Good»**, en 43 de las 640 filas | búsqueda sobre todo el fichero |
| 57 | Cotización menos revisión del informe, días naturales, **con signo** | 13 (−228), 27 (3), 31 (20) |
| 58 | Orden de compra menos cotización, días naturales, con signo | 10 (−345), 22 (0), 25 (4), 28 (10), 31 (11) |
| 59 | **Orden de venta menos cotización, días naturales, con signo** | 8 (1), 10 (−1), 16 (−12), 22 (24), 24 (24), 25 (4), 28 (11), 31 (12) |

Dos consecuencias que salen de la tabla y no del diccionario:

1. **El 47 de Zoho no mide lo que el maestro dice que mide.** El maestro lo define entre remisión de
   entrada y remisión de salida (`R08.4.md:6287`); el export lo calcula hasta el último cambio de
   estado, también en tickets que siguen abiertos. Un 47 calculado a la letra no va a coincidir con
   Zoho en los tickets sin remisión de salida.
2. **El calendario laboral difiere de Zoho por construcción** en todo intervalo que contenga dos o
   más festivos: la tolerancia es de un día.

## 5. Lo que sale de cruzar letra, código y datos

- **La comparación con Zoho valida fórmulas más que hitos**: en los tickets heredados las dos partes
  leen las mismas fechas `fecha_*`. El riesgo real está en los días hábiles (49, 50·53) y en los dos
  indicadores que Zoho apoya en la hora del último cambio de estado (47 y 51).
- **Faltan dos hitos, y la letra pide decirlo antes de construir:** la satisfacción (55) y la hora del
  último cambio de estado (51, y la variante de Zoho del 47).
- **IV-11 toca dos entradas:** el sincronizador puede reescribir `orden_venta` y `fecha_orden_venta`
  en filas no marcadas (CLAUDE.md, «Incumplimientos vivos»). El 50·53 y el 59 leen esa fecha. No se
  corrige aquí; se anota como riesgo.
- No hace falta tabla de fotos: el cálculo es determinista y se hace al leer.

## 6. Hipótesis — sin comprobar

1. **Hipótesis:** los valores que Zoho calcula (columnas 47 a 59) llegan en `desk.tickets.custom_fields`
   o en `raw`. Indicio en contra, también hipótesis: las fórmulas del diccionario usan
   `business_days`, `date_diff` y `days_between`, que parecen funciones de un informe y no campos del
   ticket; si es así, no llegan por el sincronizador. Sólo lo resuelve una consulta de sólo lectura en
   producción.
2. **Hipótesis:** la satisfacción («Good») llega en `raw` con algún nombre de campo. Mismo remedio.
3. **Hipótesis:** las fórmulas de la tabla de §4 valen para las 640 filas. Se comprobaron sobre 31; el
   apply las verifica con un script sobre el fichero entero y anota las excepciones.
4. **Hipótesis, y la propuesta NO se apoya en ella** (el hito que falta se decide aparte; el 51 sale
   «sin dato»): la hora del último cambio de estado se puede reconstruir —`closed_time` en los
   cerrados, el último `performed_at` en los tickets llevados por la aplicación, `ticket_history` en el
   resto—. El diccionario (línea 31) dice que en los cerrados «registra el dato del momento que pasó a
   finalizado», lo que apunta a `closed_time`; no se ha contrastado con datos.
5. **Hipótesis:** el volumen es de unos cientos de tickets y unos pocos miles de transiciones (el
   export de enero llega al ticket 873). Sin `psql` ni acceso a producción desde esta sesión.
6. **Hipótesis:** el 54 de Zoho con ticket sin terminar dice «Cumple» porque el 53 vale 0; se dedujo de
   siete filas, todas sin tiempo promesa.

## 7. Correcciones a la exploración original

| Decía | Es |
|---|---|
| «Calificación (col 55) vacía en todas las filas muestreadas» | Vacía en las muestreadas, pero **43 filas del fichero traen «Good»**. El 55 es un texto y sí existe en Zoho |
| 47 sin observación | El 47 de Zoho se calcula contra la hora del último cambio de estado, no contra la remisión de salida (§4) |
| `mappers.ts:44,60` | El fichero es `packages/zoho-sync/src/db/mappers.ts`; las líneas son correctas |
| `fechasTicket.ts:18` y `etapasDesdeHistoria.ts:19-22` | Están en `apps/desk/server/db/` y en `packages/shared/src/`; el segundo rango es 19 a 21 |
| Una cita del maestro para el punto 66 fuera de `R08.4.md:2961` | No se comprobó y no se copia; el punto 66 se cita por `R08.4.md:2961` y `R08.4.md:6364` |
| Tres lotes de hasta 720 | Insuficiente tras la medición de la tanda anterior (un lote estimado en 441 midió 708): la propuesta parte en cinco |
