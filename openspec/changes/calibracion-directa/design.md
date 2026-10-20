# Diseño — `calibracion-directa` (F1C-08, `cierra: si`)

Base: `6e8319e3`. Requisitos: RQ-TS-52..59, RQ-PM-38..41 (`specs/*/spec.md`). Ningún fichero muy citado desplaza líneas: lo
nuevo va en un fichero nuevo, al final de los existentes o dentro de una línea que ya existe (regla de mutación 4). Matriz de
amenazas: N/A (sin shell, subprocesos, VCS ni clasificación de ejecutables). **Sin migración** (D9).

*Nota de método.* Las cifras de D5 se obtuvieron aplicando a mano `componentesFuertementeConexos` y `tablaDeReentrancia`
(`packages/shared/src/reentrancia.ts:129-203`, `:218-225`) al catálogo de `transitions.ts:178-262` con las dos transiciones
añadidas: este agente no disponía de ejecución. Valen como **cálculo sobre el código, no como medida ejecutada**; la prueba
roja del lote 1 (RQ-TS-57) las confirma o las corrige antes de escribirlas en ningún vigilante.

## D1 · Catálogo (`packages/shared/src/transitions.ts:262`, en la misma línea)

| id | Nombre | De → a | Área · tipo | Campos |
|---|---|---|---|---|
| `calibracion_directa` | Calibración directa | `Ingresado` → `En Proceso` | Servicio Técnico · Operativo | `comment()`, `cfText('Código Servicio')`, `cfDate('Fecha creación ticket')`, `cfDate('Fecha Remisión Entrada')` (copia literal de `:191`) |
| `falla_calibracion` | Falla en calibración | `En Proceso` → `Rev./Diagnostico` | Servicio Técnico · Operativo | `comment()`, `cfText('Descripción de la falla')` (obligatorio por omisión, `:77-78`) |

Los dos objetos van tras `rechazo_control_calidad` y antes del comentario final de `:262`, que gana «F1C-08 (RQ-TS-52)». Ninguna
entra en `DERIVACION_POR_DEFECTO` (`:274-282`, S-6). La igualdad de campos con `ingreso_a_servicio` la fija una prueba (molde H5,
como el envío a control de calidad frente a `finalizacion_servicio` en F1C-07). Las fechas de ingreso se derivan solas: el
servidor elige fuentes por ETIQUETA de campo (`packages/shared/src/fechasDerivadas.ts:90`, `fuentesQueNecesita`), no por id,
así que `valoresConFechasDerivadas` (`apps/desk/server/services/ticketService.ts:132`) las impone igual en el atajo (F1A-07 sin cambio).

## D2 · Regla pura (servidor y cliente consumen la misma)

```ts
// packages/shared/src/calibracionDirecta.ts (nuevo; `export *` en una línea al FINAL de index.ts)
export const ID_CALIBRACION_DIRECTA = 'calibracion_directa', ID_FALLA_CALIBRACION = 'falla_calibracion'
export const IDS_CALIBRACION_DIRECTA: ReadonlySet<string>          // las dos
export const CLAVE_DESCRIPCION_FALLA = 'Descripción de la falla'    // una prueba exige que sea la key del catálogo
export interface TicketParaCalibracion { tipoServicio: string | null; tieneOrdenVenta: boolean }
export function motivoNoCalibracionDirecta(transitionId: string, tk: TicketParaCalibracion): string | null
export function visibleCalibracionDirecta(transitionId: string, tk: TicketParaCalibracion): boolean  // (… === null)
export function erroresDescripcionFalla(transitionId: string, values: Record<string, unknown>): string[]
// packages/shared/src/controlCalidad.ts, AL FINAL (tras el `export *` de :114)
export function entradasAPorFacturarSinControlCalidad(ts: readonly Pick<Transition, 'id' | 'from' | 'to'>[], activo: boolean): string[]
```

- `motivoNoCalibracionDirecta`, en orden: atajo con `tipoServicio !== TIPO_CALIBRACION` → «La calibración directa es sólo para
  tickets de tipo de servicio Calibración»; atajo sin OV → «La calibración directa exige una orden de venta asignada al ticket»;
  escape con otro tipo → «"Falla en calibración" es sólo para tickets de tipo de servicio Calibración»; cualquier otra id → `null`.
- `TIPO_CALIBRACION` ya existe y es privado (`packages/shared/src/ticketCreate.ts:51`): gana `export ` en su línea. Comparación
  **exacta**, como `ticketCreate.ts:48` y `ordenOVI.ts:62` (S-11).
- `erroresDescripcionFalla`: sólo en el escape, «"Descripción de la falla" no puede estar en blanco» si llega texto de sólo
  espacios. Ausente o vacía ya la da `apps/desk/server/transitionExec.ts:76-77` (`empty` de `:44` no recorta), molde de
  `erroresContenidoControlCalidad` (`controlCalidad.ts:84-86`), para no duplicar el error.
- **Interruptor sin guarda nueva (S-1, S-8):** `motivoQuitadaPorInterruptor` (`controlCalidad.ts:103-107`) gana, al final de la
  línea `:105`, `; if (IDS_CALIBRACION_DIRECTA.has(transitionId) && !activo) return 'La calibración directa y su escape dependen
  de control de calidad, que está apagado'`; import en la línea `:7`. Así el `409` de `ticketService.ts:128` y el filtro
  `visibleConControlCalidad` del cliente (`TransitionPanel.tsx:57`) cubren las dos sin tocar su llamada. Sin ciclo de módulos:
  `calibracionDirecta.ts` importa sólo `ticketCreate.ts` (hipótesis: ninguno de sus imports llega a `controlCalidad.ts`; `tsc` y
  la suite lo confirman en el lote 1).

## D3 · Fuente de «OV asignada» y datos del ticket (decisión 1)

**Elección: las tres vías, con la función que ya existe.** `tieneOrdenVenta` (`apps/desk/server/db/sla.ts:120-125`) declara
que es «la MISMA definición que las puertas de "una OV, un ticket"» (`:112-118`): `orden_venta` no vacía, `salesorder_id` o una
asociación con `liberada_at IS NULL` en `public.ov_asociaciones` (`packages/zoho-sync/src/db/schema.sql:539-554`), y
`db/sla.test.ts` la enfrenta ya a `ticketConOrdenVenta` (`packages/zoho-sync/src/db/repo.ts:362-379`). Se reutiliza: escribir
una cuarta implementación sería el molde H5. `conAsociacionVigente` (`sla.ts:105-110`) gana `export ` en su línea.

`executeTransition` ya tiene cargadas las dos columnas y el tipo: `getTicketWithRefs` hace `SELECT t.*`
(`packages/zoho-sync/src/db/repo.ts:196`) y `TicketRow` declara `tipo_servicio`, `orden_venta` y `salesorder_id`
(`packages/zoho-sync/src/db/rows.ts:28`, `:31`, `:50`). **Consulta nueva sólo en el atajo y sólo con las dos columnas vacías**
(la asociación); en el escape y en las otras 36 transiciones, ninguna.

Rechazada: sólo `orden_venta` (falla con IV-11, R-3); `ticketConOrdenVenta` (contesta la pregunta inversa y exige conocer la OV).

## D4 · Guardas en el servidor: escalón, código y posición (decisión 2)

`exigirCalibracionDirecta(db, t, row)` al FINAL de `ticketService.ts` (molde `:285-288`): sale sin hacer nada fuera de las dos
ids; si no, calcula `tieneOrdenVenta({ orden_venta, salesorder_id }, asoc)` como en D3 y lanza `409` con
`motivoNoCalibracionDirecta`. Imports al final de `:5` (`../db/sla`) y de `:6` (shared).

| Guarda | Escalón · código | Dónde, en la misma línea | Fija el par |
|---|---|---|---|
| Interruptor (las dos) | B · `409` | `:128`, sin cambio de llamada (D2) | CD-1 (estado < interruptor), CD-6 (interruptor < `422`) |
| Condición (1) y tipo del escape | B · `409` | `:128`, `; await exigirCalibracionDirecta(db, t, current.row)` tras `exigirInterruptorControlCalidad` y antes del `}`/comentario | CD-2 (interruptor < condición), CD-3 (condición < `403` de área, `:129`), CD-4 (tipo < `422`) |
| Descripción en blanco | C · `422` agregado | `:134`, `errFalla = erroresDescripcionFalla(t.id, values)` en el `if` y en el `errors` | CD-5 (área < `422`) y «un único 422 lista los dos» |
| Descripción fuera del ticket | — | `:133`, `; delete plan.customFields[CLAVE_DESCRIPCION_FALLA]` | «vive en la traza, no en el ticket» (S-15) |

**Se confirma `409`** para la condición (1) y para el tipo del escape: describen el ESTADO del ticket, no el cuerpo ni al
usuario, igual que el `409` de estado (`:126-127`) y el del interruptor (`:128`); por eso van en B antes del `403` de área. Un
`422` (C) sería incorrecto: no hay nada en el formulario que el usuario pueda corregir. La rama `Ingresado`
→ `En Proceso` del catálogo de equipo nuevo (`transitions.ts:351`) no se ve afectada: `exigirMismoFlujo` (`:125`) responde antes.

## D5 · R-1 medido: dos destinos para el escape (decisión 3)

| Magnitud (`reentrancia.ts`) | Hoy | Escape → `Rev./Diagnostico` (S-5) | Escape → `Notificación Comercial` |
|---|---|---|---|
| Ciclos del grafo de servicio | 2: C2 (9 estados) y C3 (`Rev./Diagnostico`, `Notificado`) | **1**, de 12 estados: C2 + `Rev./Diagnostico`, `Notificado`, `Notificación a Compras`; C3 desaparece absorbido | 2, sin cambio |
| Transiciones internas con fecha | 9 | **13**: + `notif_por_garantia`, `reporte_por_garantia`, `escalado_a_comercial`, `cal_sensores_revision` | 9 |
| `camposFechaReentrantes` | 10 | **12**: + `Fecha Notificación por garantía` (`transitions.ts:209`) y `Fecha Revisión Informe` (`:219`, `:221`) | 10 |
| Obligatorios / opcionales | 8 / 2 | **10** / 2 (los dos nuevos son `cfDate` obligatorio, `:75-76`) | 8 / 2 |

Orden de los 12 (declaración): Recepción de repuestos, Orden de Compra, Orden De Venta, Orden de Compra Final, Orden de Venta
Final, **Notificación por garantía**, de Cotización, solicitud SKU, **Revisión Informe**, Salida Servicio externo, Entrada de
servicio externo, Finalización ST. `cal_sensores_revision` entra pero su campo ya contaba. Estados del ciclo único, en orden de
aparición: `Rev./Diagnostico`, `Notificado`, `En Espera de Repuestos`, `En Proceso`, `Notificación cliente`, `Solicitado`,
`Notificación a Compras`, `Notificación Comercial`, `En espera de SKU inventario`, `Servicio externo`, `Continuación del proceso`,
`Control de calidad`. `cicloEnElCierre` (`invariantesGrafo.test.ts:340`, `:357-359`) sigue `[]` en las dos opciones.

**Filas que cambian con `Rev./Diagnostico`:** `reentrancia.test.ts:27-40` (dos ciclos → uno), `:55-68` (C2: 12 estados, 13
transiciones), `:77-81` (C3 deja de existir: `componenteQueContiene('Notificado')` devuelve el ciclo grande; la prueba se invierte y
declara el escape como causa), `:83-85` (9 → 13), `:92-100` (10/8 → 12/10); `invariantesGrafo.test.ts:137-150` (diez → doce, los
dos nombres dentro de las líneas `:143` y `:145`); `bodegaje.test.ts:113` (10 → 12). Sin cambio: G.6 (`reentrancia.test.ts:157-178`,
sus campos siguen siendo reentrantes) y los catálogos de equipo nuevo y soporte remoto.

**Impacto.** *F1C-06:* el reloj es por tramos de estado (`packages/shared/src/relojSla.ts:50`) y la alarma de `Notificado` toma
la ÚLTIMA entrada al estado (`apps/desk/server/db/sla.ts:92-100`): una segunda estancia se mide bien en las dos opciones. *F1A-07:*
«Fecha Revisión Informe» se deriva del ÚLTIMO `escalado_a_revision` (`apps/desk/server/services/valoresDeTransicion.ts:28`), así que la
segunda pasada la reescribe en la columna; el historial conserva las dos (`reentrancia.ts:14-24`). *KPI:* el 57 «Tiempo de cotización»
mide «Fecha Revisión Informe» → «Fecha de Cotización» (`packages/shared/src/indicadores.ts:59`) con el ÚLTIMO valor de la traza
(`:98-105`). Con `Rev./Diagnostico` el ticket del atajo con falla obtiene una revisión y una cotización propias y el 57 es calculable;
con `Notificación Comercial` el 57 queda sin dato para el atajo (nunca hay revisión) y, para un ticket de ruta completa, mediría desde
la revisión VIEJA hasta la cotización NUEVA.

**Elección: `Rev./Diagnostico` (se confirma S-5).** Es lo que dice el criterio: el atajo «salta diagnóstico, cotización y
aprobación» y ante una falla «sale a la ruta completa para cotizar» (`openspec/config.yaml:2029`); la ruta completa empieza en el
diagnóstico, y una falla nueva necesita el informe técnico y el escalado Decisional (`transitions.ts:192`) antes de cotizarse. El
precio —un ciclo único y dos reentrantes obligatorios más— lo absorben el historial y el indicador, que ya leen la traza.
**Alternativa reversible (S-13):** `to: 'Notificación Comercial'` en la misma línea; deja la tabla de reentrancia intacta y repite lo
que hoy hace `diagnostico_complementario` → `notif_recotizacion` (`transitions.ts:244`, `:261`), a costa del diagnóstico y del KPI 57.

## D6 · Condición (3) como propiedad del grafo (decisión 4) — hallazgo sobre RQ-TS-56

**RQ-TS-56 tal como está escrito es falso sobre el catálogo de HOY, con el interruptor encendido y sin las transiciones nuevas:**
desde `En Proceso` se llega a `Por Facturar` sin cruzar `Control de calidad` por `diagnostico_complementario` → `notif_recotizacion`
→ `rechazo_comercial` (`transitions.ts:244`, `:261`, `:234`) y por la cotización hasta `rechazo_cliente` (`:236`). Con el escape se
suma `rechazo_revision` (`:238`). Son los rechazos Decisionales de la ruta completa: el cliente no aprueba y no hay trabajo que liberar.

**Propiedad que se prueba (S-14):** `entradasAPorFacturarSinControlCalidad(ts, activo)` = ids de las transiciones visibles con
`activo` (`motivoQuitadaPorInterruptor === null`) cuyo `to` es `Por Facturar` y alguno de cuyos `from` se alcanza desde `En Proceso`
por transiciones visibles sin entrar en `Control de calidad` (BFS). Esperado con `activo = true`: exactamente
`['rechazo_comercial', 'rechazo_cliente', 'rechazo_revision']`, todas Decisionales; con `activo = false`, además `finalizacion_servicio`
(caracterización). La prueba declara que `rechazo_revision` entra por el escape (sin `falla_calibracion` en memoria: dos). **Rojo por
catálogo ensuciado en memoria (regla de mutación 2):** añadir `{ ...finalizacion_servicio, id: 'atajo_sucio' }`, o una Operativa de
`Rev./Diagnostico` a `Por Facturar`, añade una id al conjunto. RQ-TS-56 se reescribe con esta propiedad en el lote 1 (tarea de spec).

## D7 · Cliente (mínimo)

`TransitionPanel.tsx:57` gana `&& visibleCalibracionDirecta(t.id, { tipoServicio: delTicket['Tipo de Servicio'] ?? null,
tieneOrdenVenta: (delTicket['Orden de Venta'] ?? '').trim() !== '' })`; import al final de `:3`. `delTicket` ya trae las dos
etiquetas: `valoresConocidos` copia `customFields` (`apps/desk/src/lib/valoresTransicion.ts:50-51`), que vuelca las
`PROMOTED_COLUMNS` `tipo_servicio` y `orden_venta` (`packages/zoho-sync/src/db/rows.ts:87`, `:99`; `mappers.ts:222-231`).
Ningún componente nuevo pasa props: `TicketDetailView.tsx:332` ya pasa `delTicket`. El interruptor llega por el `useEffect` de
`:55` (`GET /api/permisos/control-calidad`, sin ruta nueva). El cliente lee UNA vía de OV (S-12).

## D8 · Regla 13, decisión a decisión

| Decisión que toma el cliente | Línea del servidor que la impone |
|---|---|
| Oculta las dos con `activo` falso | `ticketService.ts:128` (`409`, `motivoQuitadaPorInterruptor` ampliada en `controlCalidad.ts:105`) |
| Oculta el atajo si el tipo no es «Calibración» | la guarda nueva de D4 en `ticketService.ts:128`, tras el interruptor |
| Oculta el atajo sin «Orden de Venta» | la misma guarda; el servidor lee tres vías y el cliente una: oculta de más, nunca de menos (S-12) |
| Oculta el escape si el tipo no es «Calibración» | la misma guarda |
| Asterisco en «Descripción de la falla» | `transitionExec.ts:76-77`; sólo espacios: `errFalla` en `ticketService.ts:134` |
| Bloquea y prellena las dos fechas de ingreso | `ticketService.ts:132` (`valoresConFechasDerivadas`, por etiqueta) |
| Sin respuesta de la ruta, `activo = false` | ninguna: degradación de comodidad; decide el `409` |
| No enseña la descripción anterior en una segunda falla | `ticketService.ts:133` (borra `CLAVE_DESCRIPCION_FALLA` de `customFields`) |

## D9 · Migración: no hace falta

`tipo_servicio`, `orden_venta`, `salesorder_id` y `public.ov_asociaciones` existen (D3); no hay estado, columna ni variable nueva
(S-1 reutiliza `CONTROL_CALIDAD_LIBERACION`, `packages/zoho-sync/src/config.ts:125`). Vuelta atrás: el interruptor apagado.

## D10 · Ficheros y citas

| Fichero | Acción | Cómo, sin desplazar |
|---|---|---|
| `packages/shared/src/transitions.ts` | dos objetos | dentro de `:262` |
| `packages/shared/src/calibracionDirecta.ts` (+ `.test.ts`) | nuevo | — |
| `packages/shared/src/controlCalidad.ts` | cláusula, import, propiedad | `:105`, `:7`, final del fichero |
| `packages/shared/src/ticketCreate.ts` · `index.ts` | `export` de `TIPO_CALIBRACION` · `export *` | `:51` · última línea |
| `apps/desk/server/services/ticketService.ts` | guarda, borrado, error, imports, auxiliar | `:128`, `:133`, `:134`, `:5`, `:6`, final |
| `apps/desk/server/db/sla.ts` | `export` de `conAsociacionVigente` | `:105` |
| `apps/desk/server/calibracionDirecta.test.ts` | nuevo (HTTP) | — |
| `apps/desk/src/components/TransitionPanel.tsx` | filtro e import | `:57`, `:3` |
| vigilantes (§6 de la propuesta, D5) y **además** `invariantesGrafo.test.ts:172-174` (unión 48 → 50), `mapaBlueprint.test.ts:52`, `:184` (44 → 46) | cifras | en su línea |
| `DEPLOY.md` §16 (`:776`), `docs/sdd/R08.4_Expediente_de_cambios.md`, `docs/artefactos/blueprint-*.md` (regenerado) | texto | al final de §16 |

`estados.ts` no se toca (ningún estado nuevo). **Barrido de la regla de mutación 4 (lote 3):** en los ficheros de la tabla salvo
los nuevos, `git diff --numstat` da inserciones = borrados (los finales de fichero aparte); se releen las citas a
`ticketService.ts:128`, `:133-134`, `controlCalidad.ts:103-107`, `:105`, `transitions.ts:262` y `sla.ts:105-110`, cuyo TEXTO cambia
aunque el número no; `estados.test.ts:148` cambia de `toContain` a `not.toContain` y su comentario `:142-144` dice diez.

## D11 · Mutaciones del encargo y el rojo que debe dar cada una

| Id | Mutación | Debe caer |
|---|---|---|
| M1 | `motivoNoCalibracionDirecta` sin el chequeo de OV; o el servidor pasa `tieneOrdenVenta: true` | «sin OV el atajo no pasa» (pura y HTTP), RQ-PM-38 |
| M1b | el servidor lee sólo `orden_venta` | «la OV por cualquiera de las vías cuenta» (casos sólo `salesorder_id` y sólo asociación) |
| M2 | quitar la cláusula de `controlCalidad.ts:105` | «apagado, el atajo da 409», «apagado, el escape da 409», visibilidad pura, CD-2, CD-6 |
| M3 | catálogo en memoria con una arista a `Por Facturar` desde `En Proceso` o `Rev./Diagnostico` que no cruce QA | D6 |
| M4 | quitar `falla_calibracion` en memoria, o llevarla a `Por Facturar`/`Finalizado` | «el grafo ofrece el escape y su destino cotiza»; D6 sin `rechazo_revision` |
| M5 | sin chequeo de tipo, o `!== null` en vez de `=== TIPO_CALIBRACION` | «otro tipo no pasa» (Mantenimiento, Garantía, sin tipo; `calibración` en minúscula, S-11) |
| P1-P3 | la guarda nueva antes del interruptor / tras el `403` de área / tras el `422` agregado (`:134`) | CD-2 / CD-3 / CD-4 (y CD-3) |
| M7 | `errFalla` fuera del agregado, o `required: false` en el catálogo | «descripción en blanco, 422», «un único 422 lista los dos» |
| M8 | sin el `delete` de `:133` | «la descripción vive en la traza, no en el ticket» |
| M9 | regla de mutación 4 | barrido de D10 sin roturas nuevas |

## D12 · Lotes (estimación `--no-renames`, ingenua × 1,8 como F1C-07; válvula 720)

| Intento | Lote | Contenido | Ingenua | × 1,8 |
|---|---|---|---|---|
| I3 | 1 | catálogo, `calibracionDirecta.ts`, `controlCalidad.ts`, `ticketCreate.ts`, `index.ts`, sus pruebas (RQ-TS-52, -55 grafo, -56, -57, -58; RQ-PM-39 pura), vigilantes de D5 y §6, `cifras_ancladas`, mapa regenerado, reescritura de RQ-TS-56; M2-M5 | 350 | 630 |
| I4 | 2 | `sla.ts`, `ticketService.ts`, `calibracionDirecta.test.ts` HTTP (RQ-TS-53/54/55, RQ-PM-38/40/41, CD-1..6), barridos de `permisos.test.ts` y `transicionesEjecucion.test.ts` (sembrar tipo y OV, app encendida para las dos); M1, M1b, M7, M8, P1-P3 | 310 | 560 |
| I5 | 3 | `TransitionPanel.tsx`, `DEPLOY.md` §16, corrección de M2.1, barrido de citas (M9) | 45 | 80 |

Verify y archive quedan en I6 e I7, como en la propuesta. Si el lote 1 mide más de 600 antes de cerrar, la propiedad D6 y la
reescritura de RQ-TS-56 salen a un intento propio (I3b).

## D13 · Supuestos nuevos (lista semanal, grupo F1C-08) y riesgos

- **S-10** «OV asignada» = `tieneOrdenVenta` de `sla.ts:120-125`, tres vías, reutilizada.
- **S-11** Tipo por igualdad exacta con `TIPO_CALIBRACION`; otra grafía no toma el atajo (concreta S-2).
- **S-12** El cliente mira sólo «Orden de Venta»: un ticket con la OV sólo en `salesorder_id` o en una asociación no ve el botón
  aunque el servidor lo aceptaría. Reversible: añadir un booleano al detalle del ticket.
- **S-13** Destino del escape `Rev./Diagnostico`; alternativa `Notificación Comercial` en la misma línea (D5).
- **S-14** La condición (3) se lee como «el trabajo terminado pasa por Control de calidad»; los tres rechazos Decisionales siguen
  yendo a `Por Facturar` sin QA, como hoy para cualquier ticket (D6).
- **S-15** La descripción de la falla vive sólo en `values` de la traza, molde `CLAVES_SOLO_TRAZA_CC` (`ticketService.ts:133`).
- **S-16** El atajo no es marca de ingreso: `HITO_INDICADORES_ROTOS = 'ingreso_a_servicio'` (`packages/shared/src/bodegaje.ts:94`,
  `:225-226`), así que el indicador 49 «Tiempo de diagnóstico» (`indicadores.ts:54`, `:133`) queda sin dato en los tickets del
  atajo, que no tienen diagnóstico. Se fija con una prueba de caracterización; ampliarlo es de `kpis`, fuera de esta fila.
- **R-9** RQ-TS-56 exige reescritura antes de aplicar (D6); es la duda más cercana a subir, porque matiza la condición (3) de Gerencia.
- **R-10** El ciclo único de 12 estados cambia la lectura de la tabla de reentrancia que usan F1C-02, F1C-06 y `kpis`
  (`reentrancia.ts:9`): se declara en la prueba y en el parte.
