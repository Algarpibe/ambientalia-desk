# Diseño: continuidad de los nueve indicadores de Zoho (`continuidad-indicadores`, F1F-05)

Base: rama `continuidad-indicadores`, árbol de `f55b7d9`. Toda `ruta:línea` de este documento se leyó en
ese árbol durante el diseño. **Esta fase no tuvo terminal**: nada se ejecutó; lo que depende de ejecutar
va con la palabra «hipótesis» y está reunido en §13.

## 1. Enfoque

Tres capas, de dentro afuera, y ninguna escribe en la base:

    desk.tickets ─┐
    ticket_transitions ─┼─► leerEntradasIndicadores (servidor, 3 consultas)
    calendario_cierres ─┘            │
                                     ▼
              calcularIndicadores (packages/shared, puro) ──► FilaIndicadores[]
                                     │                              │
                valorDeZoho (puro) ──┴─► compararIndicadores (puro) ─┤
                                                                    ▼
                         GET /api/indicadores  ──►  JSON  |  aCsv() → text/csv

El dominio vive en `packages/shared` y se prueba sin base; el servidor sólo lee y serializa; el cliente
sólo enlaza.

## 2. Decisiones

| # | Decisión | Alternativa rechazada | Razón |
|---|---|---|---|
| D1 | Un módulo puro `packages/shared/src/indicadores.ts` (cálculo + lectura del valor de Zoho) y otro `packages/shared/src/indicadoresComparacion.ts` | Calcular en SQL | Regla 13; las fórmulas necesitan `diasHabilesEntre` (`packages/shared/src/calendarioLaboral.ts:196`), que no existe en SQL |
| D2 | La variante «lunes a viernes sin festivos» se cuenta con `diasLunesAViernesFormulaZoho`, **dentro de `indicadores.ts`**, etiquetada como fórmula de Zoho (R2) | Función nueva en `calendarioLaboral.ts` | Esa cuenta NO es calendario laboral: Zoho no descuenta festivos (medido en el lote 1) y meterla en `packages/shared/src/calendarioLaboral.ts` la haría pasar por «hábil», contra `decision/calendario-habil` (RQ-CL-11). «Hábil» con festivos sólo sale de `diasHabilesEntre`; `calendarioLaboral.ts` no se edita. El dato «festivos y cierres del intervalo» sale de `diasNoHabilesDelIntervalo`: la lista de días de lunes a viernes que `esDiaHabil` descuenta |
| D3 | Cada hito se resuelve con UNA función: último valor legible en el historial, y si no hay, la columna | Elegir fuente por ticket (`managed_by_app`) | Un ticket heredado que la aplicación continúa tiene hitos de las dos fuentes; decidir por hito es lo que manda `packages/shared/src/reentrancia.ts:24` |
| D4 | Tres consultas; las transiciones se traen con `JOIN tickets` y el mismo predicado de periodo | `WHERE ticket_id = ANY($1)` | pg-mem no ejecuta arrays enlazados (`apps/desk/server/db/eliminarTicket.ts:65`, `apps/desk/server/db/ticketFuentes.ts:121`) |
| D5 | El valor de Zoho se busca sólo en `custom_fields` | Leer `raw` entero o `raw->'customFields'` | `custom_fields` ya es `customFields` menos lo promovido (`packages/zoho-sync/src/db/mappers.ts:43-44`, `:55-60`); `raw` es la carga completa del ticket y ningún lector del servidor usa `->` hoy. Si P-1 dice que el dato está sólo en `raw`, se añade una «bolsa» más a la función (§5) sin tocar el cálculo |
| D6 | Sin caché | Caché de 5 min como `apps/desk/server/analisis.ts:34-42` | El periodo es parámetro y la tabla se usa para comprobar contra Zoho: un valor viejo es un falso «no coincide» |
| D7 | CSV con `;`, CRLF y BOM UTF-8, generado en servidor | Coma; generarlo en el navegador | Excel en español abre `;` sin asistente; en servidor el escapado se prueba en `.ts`. **Supuesto S-11**, un parámetro |
| D8 | El cliente usa `<a href download>`, no `fetch` | Función nueva en `apps/desk/src/api/client.ts` | Mismo origen: la cookie viaja sola. `client.ts` **no se toca** y no desplaza ninguna cita |
| D9 | Sin parámetros, la ruta devuelve TODOS los tickets; `desde`/`hasta` filtran por día de creación en zona de negocio | Filtrar por última modificación | «Sobre los mismos tickets que tiene Zoho» (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:6317`) se cumple con el total. **Supuesto S-10** |

## 3. Interfaces

### 3.1 `packages/shared/src/indicadores.ts` (nuevo)

```ts
export type FuenteHito = 'transicion' | 'columna_heredada' | 'ausente'   // se serializa tal cual (lote 1)
export interface Hito { dia: DiaCivil | null; fuente: FuenteHito; escrituras: number }

// `motivo` es el TEXTO de la spec («falta el hito: remisión de salida»), no un código (lote 1).
export type Valor<T> =
  | { tipo: 'valor'; valor: T }
  | { tipo: 'sin_dato'; motivo: string }

export interface Indicador<T = number> {
  columna: ColumnaIndicador                 // '47' | '49' | '50_53' | '51' | '54' | '55' | '57' | '58' | '59'
  letra: Valor<T>
  varianteZoho: Valor<T>
  unidad: 'dias_naturales' | 'dias_habiles' | 'cumplimiento' | 'calificacion'   // 54 → cumplimiento, 55 → calificacion
  hitos: Record<string, Hito>               // etiqueta del campo → de dónde salió
  reentrante: boolean | null                // null = ticket sin historial: no se puede saber
  marcas: Array<'sin_finalizar' | 'orden_invertido'>   // R5: no hay 'copiado_de_zoho'; el 55 de Zoho va en `valorZoho`
  diasNoHabilesDelIntervalo: number | null  // jornada − hábiles; sólo 49 y 50
}

export interface TicketParaIndicadores {
  id: string; numero: number; estado: string; codigoServicio: string | null   // lo usa la ruta (lote 3)
  creadoEn: string | null                   // created_time, ISO con desplazamiento
  diasEntrega: number | null                // columna 52
  fechas: Partial<Record<EtiquetaHito, DiaCivil | null>>   // columnas fecha_*
  camposZoho: Record<string, unknown>       // custom_fields
}
export interface OpcionesIndicadores {
  cierres: ReadonlySet<DiaCivil>
  /** H-1. Hoy SIEMPRE ausente: el 51 y la variante del 47 se enchufan aquí cuando se decida. */
  horaActualizacionEstado?: string | null
  calificacionSatisfaccion?: string | null   // H-2: el 55 la usa tal cual; la ruta nunca la aporta
}
export interface FilaIndicadores { ticketId: string; numero: number; estado: string; reentrante: boolean | null; indicadores: Indicador<number | string>[] }

export function resolverHito(etiqueta: EtiquetaHito, t: TicketParaIndicadores, historial: PasoDelHistorial[]): Hito
export function calcularIndicadores(t: TicketParaIndicadores, historial: PasoDelHistorial[], o: OpcionesIndicadores): FilaIndicadores
export function valorDeZoho(columna: ColumnaIndicador, bolsas: ReadonlyArray<Record<string, unknown>>): { valor: number | string; campo: string } | null
export const NOMBRES_ZOHO: Record<ColumnaIndicador, readonly string[]>
```

`EtiquetaHito` son las etiquetas literales de `PROMOTED_COLUMNS` (`packages/zoho-sync/src/db/rows.ts:103-112`):
las mismas con que se escriben `ticket_transitions.values`. `PasoDelHistorial` es el tipo de
`packages/shared/src/bodegaje.ts:104-110`, sin copia.

**`resolverHito`**: recorre el historial ordenado por `performedAt`; toma el **último** paso cuyo
`values[etiqueta]` da un día con `diaEnZona` (`packages/shared/src/fechasDerivadas.ts:63`) → fuente
`transicion`; `escrituras` cuenta los pasos que lo traen. Si ninguno, la columna → `columna`. Si tampoco,
`ausente`. Los días de entrega se resuelven igual (último `Días de entrega` del historial,
`packages/shared/src/transitions.ts:193` y `:221`; respaldo `diasEntrega`).

**Reentrancia**: un indicador es `reentrante` si alguno de sus hitos tiene `escrituras ≥ 2`; `null` si el
historial está vacío. Una prueba guardiana comprueba que todo campo de `INDICADORES_G6`
(`packages/shared/src/reentrancia.ts:78-83`) es un hito del indicador de esa columna en este módulo: la
tabla no se copia, se enfrenta.

**Días naturales**: `diasNaturalesEntre(desde, hasta)` privada, resta de días civiles por `Date.UTC`, con
signo. No es cálculo de hábiles.

### 3.2 La cuenta de lunes a viernes (R2): dentro de `indicadores.ts`, `calendarioLaboral.ts` sin tocar

```ts
/** FÓRMULA DE ZOHO, no el calendario laboral: lunes a viernes de `(desde, hasta]`, sin festivos ni cierres. */
export function diasLunesAViernesFormulaZoho(desde: DiaCivil, hasta: DiaCivil): number
```

`Indicador.diasNoHabilesDelIntervalo` es `DiaCivil[] | null`: los días de lunes a viernes del intervalo que `esDiaHabil` descuenta (festivos y cierres); `null` en los indicadores sin intervalo hábil. Lo consume RQ-KP-16 (lote 5a).

### 3.3 `packages/shared/src/indicadoresComparacion.ts` (nuevo)

```ts
export interface ParComparacion { ticketId: string; columna: ColumnaIndicador; app: Valor<number | string>; variante: Valor<number | string>; zoho: unknown; hitos: HitoComparado[]; reentrante: boolean | null; diasNoHabiles: DiaCivil[] | null }
export interface Diferencia { ticketId: string; columna: ColumnaIndicador; contra: 'valor' | 'formula_zoho'; app: number | string; zoho: number | string; delta: number | null; hitos: HitoComparado[]; reentrante: boolean | null; diasNoHabiles: DiaCivil[] | null }
export interface Conteo { comparados: number; coincidentes: number; diferentes: number; sinComparar: number; porcentaje: number | null }
export interface ResumenColumna extends Conteo { columna: ColumnaIndicador; diferencias: Diferencia[]; variante: Conteo & { diferencias: Diferencia[] } }
export interface ResumenComparacion { comparable: boolean; mensaje: string | null; tolerancia: number; porColumna: ResumenColumna[]; tickets: { comparados: number; coincidentes: number; porcentaje: number | null }; nota: string }
export const TOLERANCIA_DIAS = 1
export function compararIndicadores(pares: ParComparacion[], tolerancia?: number): ResumenComparacion
export function parDeIndicador(ticketId: string, i: Indicador): ParComparacion
```

Reglas: `porcentaje` = coincidentes ÷ comparados ×100 con **un decimal** (`null` con `comparados = 0`, nunca 0 ni
100). Un par va a `sinComparar` y **no entra en ningún denominador** si no hay valor de Zoho usable (ausente, `null`,
vacío, no numérico; en el 54, distinto de Cumple/No cumple) o si el lado comparado es `sin_dato` (en la variante, su
propio `sin_dato`). Numérico: coincide si |app − zoho| ≤ tolerancia. Texto (54, 55): coincide si son iguales sin
distinguir mayúsculas ni espacios **laterales**. `porColumna` trae siempre los nueve indicadores, también sin pares
(con `porcentaje` `null`). La diferencia lleva la **lista** de días descontados (`diasNoHabiles`), no un número, y no
atribuye causa. `mensaje`: «sin valor de Zoho con que comparar» si ningún par tiene valor de Zoho, «sin pares
comparables» si lo hay pero ninguno se compara, `null` si se compara. `tickets` y la `nota` publican la segunda
lectura de **R4**: la letra no precisa cuál es «el 95 % de los tickets», así que el supuesto S-12 pasa a publicar las
dos (por indicador, y de tickets en que todo lo comparable coincide). No hay umbral, semáforo ni veredicto: el 95 % lo
juzgan las personas.

### 3.4 Servidor

`apps/desk/server/indicadores.ts`:

```ts
export function validarPeriodo(q: { desde?: unknown; hasta?: unknown; formato?: unknown }):
  | { ok: true; desde: DiaCivil | null; hasta: DiaCivil | null; formato: 'json' | 'csv' }
  | { ok: false; error: string }
export async function leerEntradasIndicadores(db: Queryable, p: { desde: DiaCivil | null; hasta: DiaCivil | null }):
  Promise<{ tickets: TicketParaIndicadores[]; historial: Map<string, PasoDelHistorial[]>; cierres: Set<DiaCivil> }>
// Lote 3: la tabla es una fila por ticket (`{ ticketId, codigoServicio, indicadores: Indicador[] }`); la `comparacion` es del lote 5a.
export function tablaIndicadores(e: Awaited<ReturnType<typeof leerEntradasIndicadores>>): FilaIndicadores[]
```

Las tres consultas, todas con parámetros ligados y sin calificar esquema, como el resto de lectores
(`apps/desk/server/analisis.ts:13-18`):

1. `SELECT id, number, status, created_time, codigo_servicio, dias_entrega, fecha_creacion_ticket, fecha_remision_entrada, fecha_revision_informe, fecha_cotizacion, fecha_orden_compra, fecha_orden_venta, fecha_recepcion_repuestos, fecha_finalizacion_st, fecha_remision_salida, custom_fields FROM tickets t [WHERE t.created_time >= $1 AND t.created_time < $2] ORDER BY number`
2. `SELECT tt.ticket_id, tt.transition_id, tt.values, tt.performed_at FROM ticket_transitions tt JOIN tickets t ON t.id = tt.ticket_id [mismo WHERE] ORDER BY tt.performed_at, tt.id` — se agrupa en memoria por `ticket_id` en un `Map`.
3. `listarCierres(db)` (`apps/desk/server/db/calendarioCierres.ts:31-34`).

El `WHERE` es un fragmento fijo que se añade o no; los valores van siempre en `$1`/`$2`. Los límites se
ensanchan un día por cada lado (`sumarDias(desde, -1)` y `sumarDias(hasta, 2)`, a medianoche UTC) y el
corte exacto lo hace en memoria `diaEnZona(creadoEn)`, para no escribir a mano el desplazamiento de
Bogotá. Las columnas `date` se normalizan con `comoDiaCivil` (`apps/desk/server/db/calendarioCierres.ts:18-23`).

`apps/desk/server/util/csv.ts`: `export function aCsv(cabeceras: string[], filas: Array<Array<string | number | null>>): string`.

`apps/desk/server/routes/indicadores.ts`: `registerIndicadoresRoutes(app, { db })`, una ruta
`GET /api/indicadores`. JSON (RQ-KP-13, lote 3): `{ periodo: { desde, hasta }, tickets, comparacion }`; por ticket `ticketId`, `codigoServicio`, `indicadores`; por indicador `columna`, `valor` (`null` si `sin_dato`), `unidad`, `estado`, `motivo` (sólo en `sin_dato`), `hitos` como lista `{ nombre, dia, fuente }`, `reentrante`, `sinFinalizar` (sólo 50·53 y 54), `formulaZoho` y `valorZoho` (`null` si no hay); `orden_invertido` queda en el dominio y no se serializa; `comparacion` es `null` hasta el lote 5a. CSV (RQ-KP-15, lote 4): formato LARGO, una cabecera y una fila por ticket e indicador, con las 13 columnas de la spec (`indicador` = primer nombre de `NOMBRES_ZOHO`; `fuente_hitos` = `hito: fuente` separados por `|`; `reentrante` y `sin_finalizar` como `true`/`false`, vacío si no aplica); cabeceras `Content-Type: text/csv; charset=utf-8`, `X-Content-Type-Options: nosniff` y
`Content-Disposition: attachment; filename="indicadores-<hoy>.csv"` (molde
`apps/desk/server/routes/certificadoFabrica.ts:54`).

Registro en `apps/desk/server/app.ts`: el `import` se añade al final de la línea `:22` y la llamada al
final de la línea `:61`, que ya agrupan varios registros por línea. **Ninguna línea se desplaza.**

## 4. Los indicadores, uno a uno

«Desde» y «hasta» son hitos resueltos por `resolverHito`. Intervalo hábil: `(desde, hasta]`.

| Col. | Letra: fórmula | Fuente primaria → respaldo | Unidad | Casos límite | Variante de Zoho | Define |
|---|---|---|---|---|---|---|
| 47 | `Fecha Remisión de Salida − Fecha Remisión Entrada` | historial (`packages/shared/src/transitions.ts:191`, `:249`, `:251`) → `fecha_remision_entrada`, `fecha_remision_salida` | naturales, con signo | Falta cualquiera (ticket abierto): `sin_dato/hito_ausente`. Mismo día: 0. Invertido: negativo + `orden_invertido`. Reentrante: última salida | Siempre `sin_dato/falta_hito_pendiente` (RQ-KP-11), con y sin H-1. **Nunca** cae en la remisión de salida | `R08.4.md:6287`; variante: Diccionario, línea 115, y exploración §4 |
| 49 | `diasHabilesEntre(día de la marca de ingreso_a_servicio, Fecha Revisión Informe)` | marca `marcaIngresoAServicio` (`packages/shared/src/bodegaje.ts:225-227`); **R1: sin marca es «sin dato — falta el hito: marca de ingreso a servicio»**, la fecha de creación sólo vive en la variante (S-9 queda reducido a la variante) | hábiles (S-2) | Sin revisión: `sin_dato/hito_ausente`. Mismo día o invertido: 0, y si invertido `orden_invertido`. La marca se pasa a día con `diaEnZona` | `diasLunesAViernesFormulaZoho(Fecha creación ticket, Fecha Revisión Informe)`; la creación es la del historial o `fecha_creacion_ticket`, **sin caer en `created_time`** (RQ-KP-11); sin ella, `sin_dato` | `R08.4.md:6293`; hasta: `transitions.ts:219`, `:221` |
| 50·53 | `diasHabilesEntre(Fecha Recepción de repuestos si la hay, si no Fecha Orden De Venta; Fecha Finalización ST)`; 0 si negativo o sin finalización | historial (`transitions.ts:189`, `:197`, `:199`, `:223`) → `fecha_orden_venta`, `fecha_recepcion_repuestos`, `fecha_finalizacion_st` | hábiles | Sin finalización: **0** + `sin_finalizar` (letra). Con finalización y sin desde: `sin_dato/hito_ausente`. Invertido: 0 + `orden_invertido`. Reentrante: últimos repuestos | Lo mismo con `diasLunesAViernesFormulaZoho` | `R08.4.md:6296`; Diccionario, línea 122 |
| 51 | — | — | — | Siempre `sin_dato/falta_hito_pendiente` mientras `horaActualizacionEstado` esté ausente. Si llega: `día(H-1) − Fecha Finalización ST`, naturales | Igual | `R08.4.md:6299`; `openspec/config.yaml:2654-2655` |
| 54 | `Cumple` si `53 ≤ 52`, `No cumple` si no | 53 de esta tabla; 52 = `Días de entrega` | texto | 52 ausente: `sin_dato/sin_tiempo_promesa`. 53 `sin_dato`: `sin_dato/hito_ausente`. Sin finalización: `Cumple` + `sin_finalizar` | `Cumple` también sin 52; usa el 53 variante | `R08.4.md:6302`, `:6341` |
| 55 | — | `valorDeZoho(55, …)` | calificacion | **R5:** `valor` siempre «sin dato» sin la entrada opcional; el 55 de Zoho va en `valorZoho`, nunca en `valor` | — | `R08.4.md:6345` |
| 57 | `Fecha de Cotización − Fecha Revisión Informe` | historial (`transitions.ts:211`, `:213`) → columnas | naturales, con signo | Falta uno: `sin_dato/hito_ausente`. Invertido: negativo. Reentrante: última cotización | Igual | `R08.4.md:6308` |
| 58 | `Fecha Orden de Compra − Fecha de Cotización` | historial (`transitions.ts:199`) → columnas | naturales, con signo | Ídem | Igual | `R08.4.md:6311` |
| 59 | `Fecha Orden De Venta − Fecha de Cotización` | historial → columnas | naturales, con signo | Ídem | Igual | Supuesto S-1 (`R08.4.md:6314` no da fórmula) |

`R08.4.md` es `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md`.

## 5. De dónde sale «el valor de Zoho»

Comprobado en código: el sincronizador guarda en `custom_fields` todo `customFields` que no sea columna
promovida (`packages/zoho-sync/src/db/mappers.ts:43-44`, `:55-60`) y la carga completa en `raw`
(`packages/zoho-sync/src/db/mappers.ts:53`); las columnas viven en
`packages/zoho-sync/src/db/schema.sql:40` y `:42`. Ninguna de las nueve columnas calculadas está en
`PROMOTED_COLUMNS` (`packages/zoho-sync/src/db/rows.ts:85-132`); la 52 sí (`:101`).

`valorDeZoho` normaliza las claves de cada bolsa (minúsculas, sin tildes, espacios colapsados) y busca
los nombres del diccionario, tal como están escritos allí, erratas incluidas:

| Col. | Nombres buscados (`docs/analisis-tickets/Diccionario de campos.txt`) |
|---|---|
| 47 | «Tiempo permanecia», «Tiempo permanencia» (línea 115) |
| 49 | «Tiempo de diagnóstico» (120) |
| 50 | «Tiempo de servicio» (122), «Tiempo total servicio» (129) |
| 51 | «Tiempo recogida del equipo» (125) |
| 54 | «Cumplimiento del tiempo promesa» (131) |
| 55 | «Calificación de satisfacción» (133) |
| 57 · 58 · 59 | «Tiempo de cotización» (137), «Tiempo de orden de compra» (139), «Tiempo de orden de Venta» (141) |

Numéricos: se aceptan enteros en número o en texto; cualquier otra cosa es «sin valor de Zoho». Si el
nombre no está, devuelve `null`. **Que estos nombres existan en producción NO está verificado: es la
tarea de persona P-1 (§11).** Las fórmulas del diccionario usan funciones de informe, así que la
hipótesis de trabajo es que no llegan y el resumen dirá «sin valor de Zoho con que comparar». Además, un
ticket con `managed_by_app` no recibe refresco del sincronizador, así que su `custom_fields` puede estar
viejo: se anota, no se corrige.

## 6. Permiso y orden de guardas

    GET /api/indicadores:  requireAuth(db) → requireAdmin → validarPeriodo (400) → leerEntradasIndicadores

Molde: `apps/desk/server/routes/analisis.ts:11`; guardas en `apps/desk/server/auth/middleware.ts:14-23`
y `:26-29`. Escalones de F1B-10: A/B (sesión, permiso) antes que C (contenido).

Pruebas de **posición** (regla de mutación 1), con una base espía pasada por `appWith({}, espia)`
(`apps/desk/server/testing/appHarness.ts:46`) que anota el texto de cada consulta:

- **PG-1** sin sesión y con `?desde=basura` → 401 (no 400), y ninguna consulta nombra `ticket_transitions`.
- **PG-2** usuario sin administrador, con `?desde=basura` y también sin parámetros → **403, no 400**, y ninguna consulta nombra `ticket_transitions` ni `calendario_cierres`. Activa a la vez la guarda de permiso y la de contenido.
- **PG-3** administrador con `?desde=basura`, con `desde > hasta` o con `formato=xml` → 400 con mensaje en español, y ninguna consulta nombra `ticket_transitions`.

## 7. Regla 13

| Decisión del cliente | Línea del servidor que la impone |
|---|---|
| Enseñar el enlace sólo a administradores (`user?.isAdmin`, molde `apps/desk/src/components/Header.tsx:90`) | `requireAuth` y `requireAdmin` en la ruta nueva de `apps/desk/server/routes/indicadores.ts` (la línea se cita al construirla), probado por PG-1 y PG-2 |
| Componer la dirección de descarga (formato, periodo) | `validarPeriodo` rechaza con 400 lo que no sea válido (PG-3) |

El cliente no calcula, no filtra y no formatea ningún indicador.

## 8. Cliente

- `apps/desk/src/lib/indicadoresUrl.ts` (nuevo, con `indicadoresUrl.test.ts`): `urlIndicadores(formato: 'json' | 'csv', periodo?: { desde?: string; hasta?: string }): string`, con `URLSearchParams`, y `mostrarDescargaIndicadores(user)` (sólo `isAdmin === true`; comodidad, lo impone el 403). Es lo único decidible y va en `.ts`, dentro del `include` de pruebas.
- `apps/desk/src/components/Analisis.tsx`: en la barra superior (`apps/desk/src/components/Analisis.tsx:81-88`, tras el lote 4), un `<a href={urlIndicadores('csv')} download>` con el texto **«Descargar indicadores (CSV)»** y `title` «Tabla de los nueve indicadores por ticket», visible si `user?.isAdmin`. El `.tsx` sólo pinta.
- `apps/desk/src/api/client.ts`: **no se toca** (D8).

## 9. Pruebas

Orden rojo → verde dentro de cada lote. Calendario de los casos, comprobado a mano: el 01/10/2026 es
jueves; el lunes 12/10/2026 es festivo (Día de la Raza, cae en lunes); el 01/11/2026 es domingo y Todos
los Santos pasa al lunes 02/11; el 11/11 es miércoles e Independencia de Cartagena pasa al lunes 16/11.

**`packages/shared/src/indicadores.test.ts`**

| # | Caso | Esperado |
|---|---|---|
| K1 fin de semana | OV 2026-10-01, finalización 2026-10-06 | 50 = **3** (2, 5 y 6); variante **3** |
| K2 festivo | OV 2026-10-08, finalización 2026-10-15 | 50 = **4** (9, 13, 14, 15); variante **5**; `diasNoHabilesDelIntervalo` = 1 |
| K2b cierre | K2 con cierre de empresa 2026-10-14 | 50 = **3** |
| K3 dos festivos | OV 2026-10-30, finalización 2026-11-17 | 50 = **10**; variante **12** |
| K4 extremos | OV y finalización 2026-10-05 → **0**; OV 2026-10-05, finalización 2026-10-06 → **1** | |
| K5 invertido | repuestos 2026-10-13, finalización 2026-10-09 | 50 = **0** + `orden_invertido` |
| K6 repuestos mandan | OV 2026-10-01, repuestos 2026-10-08, finalización 2026-10-15 | 50 = **4** |
| K7 reentrante | dos `llegada_repuestos` con 2026-10-05 y 2026-10-13; finalización 2026-10-15 | 50 = **2** (14 y 15), `reentrante: true`, `escrituras: 2` |
| K8 heredado | sin historial; columnas: revisión 2026-03-02, cotización 2026-03-05, OC 2026-03-09, OV 2026-03-10 | 57 = **3**, 58 = **4**, 59 = **5**; fuente `columna`; `reentrante: null` |
| K8b signo | cotización 2026-03-05, OV 2026-03-04 | 59 = **−1** + `orden_invertido` |
| K9 historial gana | K8 más un paso `notif_cliente_comercial` con cotización 2026-03-07 | 57 = **5**, fuente `transicion` |
| K10 47 | entrada 2026-10-01, salida 2026-10-15 → **14**; sin salida → `sin_dato/hito_ausente`; variante siempre `sin_dato/falta_hito_pendiente`, con y sin `horaActualizacionEstado` | |
| K11 49 y zona | marca `ingreso_a_servicio` a `2026-10-06T02:30:00Z` (en Bogotá, día 5); revisión 2026-10-13; `Fecha creación ticket` 2026-09-28 | 49 = **5** (6, 7, 8, 9, 13), fuente `marca`; variante **11** |
| K12 54 | 53 = 4 con 52 = 4 → `Cumple`; con 52 = 3 → `No cumple`; sin finalización y 52 = 5 → `Cumple` + `sin_finalizar`; 52 ausente → `sin_dato/sin_tiempo_promesa` y variante `Cumple` | |
| K13 51 y 55 | sin entrada opcional → `sin_dato/falta_hito_pendiente`; finalización 2026-10-15 y `horaActualizacionEstado` 2026-10-18 → **3**; 55 con «Good» en `camposZoho` → `valor` «sin dato» y `valorZoho` «Good» (R5) | |
| K14 guardián | todo campo de `INDICADORES_G6` es hito del indicador de su columna | |
| K15 `valorDeZoho` | encuentra «Tiempo permanecia» y « tiempo de diagnostico »; `"12"` → 12; ausente → `null`; texto no numérico en columna numérica → `null` | |

Las pruebas de `diasLunesAViernesFormulaZoho` (K1 3, K2 5, K3 12, mismo día 0) van en `indicadores.test.ts`;
`calendarioLaboral.test.ts` no se toca (R2).

**`packages/shared/src/indicadoresComparacion.test.ts`**: C1 app 4 / Zoho 5 → coincide; C2 app 10 / Zoho
12 → diferencia con causa `dias_no_habiles_en_intervalo`; C3 tres pares (uno coincide, uno difiere, uno
sin valor de Zoho) → `comparados: 2`, `sinComparar: 1`, porcentaje **50**; C4 `sin_dato` en la aplicación
con valor en Zoho → `sinComparar`; C5 ningún par con Zoho → `comparable: false`, sin porcentaje; C6
«Cumple» contra « cumple » coincide, contra «No Cumple» difiere; C7 los dos porcentajes de S-8 difieren
en K3 (letra 0 %, variante 100 %); C8 `porcentajeTickets`.

**`apps/desk/server/util/csv.test.ts`**: `a"b` → `"a""b"`; texto con salto de línea → entre comillas con
el salto dentro; `a;b` → entre comillas; `=1+1`, `+57`, `-x`, `@a` → con apóstrofo delante; `=A"` →
`"'=A"""`; el **número** −228 → `-228` sin apóstrofo; el **texto** `-228` → con apóstrofo; `null` →
celda vacía; BOM al principio y CRLF entre filas.

**`apps/desk/server/indicadores.test.ts`** (pg-mem): `validarPeriodo` (fechas inexistentes, orden,
formato); lectura con dos tickets y cinco transiciones → el `Map` agrupa bien y el espía cuenta
**exactamente tres** consultas con dos y con veinte tickets (sin N+1); el periodo deja fuera un ticket
creado a las `2026-10-01T03:00:00Z` (día 30/09 en Bogotá) cuando `desde=2026-10-01`; columna `date`
entregada como `Date` y como texto.

**`apps/desk/server/routes/indicadores.test.ts`**: PG-1 a PG-3; administrador → 200 JSON con K2 sembrado
(50 = 4, variante 5); `formato=csv` → cabeceras y cuerpo; sin valores de Zoho → `comparable: false`; con
«Tiempo de servicio» = 5 en `custom_fields` → resumen con los dos porcentajes.

**`apps/desk/src/lib/indicadoresUrl.test.ts`**: sin periodo, con periodo, y codificación de caracteres.

## 10. Mutaciones que el apply reproduce

| # | Mutación | Prueba que se pone roja |
|---|---|---|
| M1 | `requireAdmin` detrás de `validarPeriodo` | PG-2 (da 400) |
| M2 | `requireAdmin` detrás de la lectura | PG-2 (el espía ve `ticket_transitions`) |
| M3 | `requireAuth` detrás de `requireAdmin` | PG-1 (da 403) |
| M4 | `validarPeriodo` detrás de la lectura | PG-3 |
| M5 | Hábiles por naturales en el 50 | K1 (5), K2 (7) |
| M6 | Quitar el festivo del 12/10 de `FESTIVOS_TRASLADABLES` | K2 (5) |
| M7 | Invertir desde y hasta en 47, 57, 58 y 59 | K8, K8b, K10 |
| M8 | `(desde, hasta]` por `[desde, hasta]` | K4 |
| M9 | Preferir la orden de venta a los repuestos | K6 (9) |
| M10 | Quitar el tope en 0 | K5 |
| M11 | Primer valor en vez del último | K7 (7) |
| M12 | Leer la columna antes que el historial | K9 (3) |
| M13 | El 51 devuelve número sin la entrada opcional | K13 |
| M14 | La variante del 47 cae en la remisión de salida | K10 |
| M15 | Quitar `sin_finalizar`; `Cumple` sin tiempo promesa; `≤` por `<` | K12 |
| M16 | Tolerancia 2 | C2 |
| M17 | Contar como coincidente un par sin valor de Zoho, o un `sin_dato` | C3, C4, C5 |
| M18 | Quitar el apóstrofo de cada uno de `=`, `+`, `-`, `@`; quitar el duplicado de comillas; aplicar el apóstrofo a los números | las de `csv.test.ts`, una por carácter |
| M19 | Día UTC en vez de `diaEnZona` para la marca | K11 |
| M20 | Una consulta por ticket | la del recuento de consultas |

Regla de mutación 2: no aplica, ningún guardián de esta tanda lee un fichero de datos.

## 11. Lotes

Estimación: código + pruebas ×1,8 + casillas y `apply-progress.md`, y después el factor 1,6 medido.

| Lote | Contenido | Código | Pruebas | Casillas | Estimado | ×1,6 |
|---|---|---|---|---|---|---|
| 1 | Tipos, `resolverHito`, naturales (47, 57, 58, 59), reentrancia y guardián, 51 y 55 «sin dato», `valorDeZoho`; `export` en el índice | 125 | 225 | 25 | 375 | 600 |
| 2 | `diasLunesAViernesFormulaZoho`, 49, 50·53, 54, variantes | 120 | 215 | 25 | 360 | 576 |
| 3 | `validarPeriodo`, lectura, ruta JSON, registro en `app.ts`, PG-1 a PG-3 | 125 | 225 | 20 | 370 | 592 |
| 4 | `aCsv`, salida CSV, `indicadoresUrl` y enlace | 100 | 180 | 20 | 300 | 480 |
| 5 | `compararIndicadores` y resumen en la ruta | 115 | 205 | 20 | 340 | 544 |

Total 1.745. Ninguno pasa de la válvula de 720 con el factor; el mayor deja 120 de margen. Cada lote
termina con `npm test`, `npm run typecheck` y `npm run lint` en verde y se mide con
`git diff --shortstat --no-renames` más `wc -l` de lo nuevo sin trackear. Respecto a la propuesta: mismos
cinco lotes; `valorDeZoho` baja al lote 1 (lo necesita el 55) y el lote 2 gana la función del calendario.

**Ficheros muy citados.** Medido con `Grep` sin excluir `archive/`: 92 apariciones en 53 ficheros para
`app.ts`, `client.ts` e `index.ts` de `shared` juntos, y 31 en 18 para `Analisis.tsx` y
`calendarioLaboral.ts` juntos.

| Fichero | Cómo se toca | Desplaza |
|---|---|---|
| `apps/desk/server/app.ts` | Añadir al final de las líneas `:22` y `:61` | No |
| `packages/shared/src/index.ts` | Dos `export` después de `:28` | No |
| `packages/shared/src/calendarioLaboral.ts` | Función después de `:204` | No |
| `apps/desk/src/api/client.ts` | No se toca | No |
| `apps/desk/src/components/Analisis.tsx` | Líneas nuevas dentro de `:79-83` e `import` | **Sí, desde el `import` nuevo hacia abajo**: el cierre barre sus citas una a una |

## 12. Spec, despliegue y tareas de persona

- **R-2.** La spec `kpis` nace con este cambio: delta en `openspec/changes/continuidad-indicadores/specs/kpis/spec.md`, viva en `openspec/specs/kpis/spec.md` al archivar. La capacidad ya está declarada (`openspec/config.yaml:240`); `capabilities` no se toca.
- **Sin esquema y sin variables nuevas.** Ningún `CREATE` ni `ALTER`, ninguna clave en `packages/zoho-sync/src/config.ts` ni en `.env.example`, ningún escritor. Reversión: quitar el registro de `app.ts` y el enlace.
- **Fecha.** Desplegado antes del 13/11 para medir desde el 16/11 (P-2).
- **P-1, consulta de SÓLO LECTURA** en producción, base `desk`. Dueño: quien administra el despliegue. No ejecutada.

```sql
BEGIN TRANSACTION READ ONLY;
-- 1. ¿Qué campos trae custom_fields, y en cuántos tickets?
SELECT k AS campo, count(*) AS tickets
FROM desk.tickets t, jsonb_object_keys(t.custom_fields) AS k
GROUP BY k ORDER BY k;
-- 2. ¿Y la carga cruda? Claves de primer nivel y de customFields.
SELECT k AS clave_raw, count(*) AS tickets
FROM desk.tickets t, jsonb_object_keys(t.raw) AS k
WHERE jsonb_typeof(t.raw) = 'object'
GROUP BY k ORDER BY k;
SELECT k AS campo_raw, count(*) AS tickets
FROM desk.tickets t, jsonb_object_keys(t.raw -> 'customFields') AS k
WHERE jsonb_typeof(t.raw -> 'customFields') = 'object'
GROUP BY k ORDER BY k;
-- 3. Recuento dirigido: ¿algún nombre de indicador o de satisfacción?
SELECT count(*) AS tickets,
       count(*) FILTER (WHERE custom_fields::text ~* 'tiempo|cumplimiento|calificaci|satisf') AS en_custom_fields,
       count(*) FILTER (WHERE raw::text ~* 'tiempo permane|tiempo de servicio|cumplimiento del tiempo|calificaci|happiness') AS en_raw
FROM desk.tickets;
ROLLBACK;
```

Si (1) no trae los nombres de §5 y (2) sí, se añade `raw` como segunda bolsa de `valorDeZoho`; si ninguno,
queda abierta la pregunta E-173 de la propuesta.

## 13. Hipótesis — sin ejecutar

1. **Hipótesis:** pg-mem ejecuta el `JOIN` de la consulta 2 y entrega `values` como objeto.
2. **Hipótesis:** `comoDiaCivil` (getters UTC) da el día correcto con `node-postgres`. `packages/zoho-sync/src/db/mappers.ts:26-28` afirma que `pg` entrega `date` como medianoche **local** y `apps/desk/server/db/calendarioCierres.ts:13-16` que es UTC. Coinciden en un contenedor en UTC y en Bogotá; el lote 3 lo fija con una prueba de las dos formas.
3. **Hipótesis:** las etiquetas de `ticket_transitions.values` son las de `PROMOTED_COLUMNS` (se dedujo de `packages/shared/src/bodegaje.ts:104-110`, no de leer el escritor).
4. **Hipótesis:** los cálculos a mano de §9; el rojo de cada prueba los confirma o los corrige.
5. **Hipótesis:** Excel en español abre el CSV con `;` y BOM sin asistente (S-11).
6. **Hipótesis:** los recuentos de citas de §11 (salida de `Grep`, sin `git grep`).
7. **Hipótesis:** las estimaciones de líneas.
8. **Hipótesis (cita de segunda mano):** `openspec/config.yaml:2654-2655` se toma de la propuesta; en este diseño sólo se comprobó que la clave `decision/e009b-lista-indicadores` empieza en la línea 2650.
9. **Hipótesis:** el modo de sólo lectura y `jsonb_object_keys` de la consulta de P-1 son sintaxis estándar de PostgreSQL; no se probó contra la versión de producción.

## 14. Preguntas abiertas (no bloquean)

- [ ] S-9, S-10, S-11 y S-12 se suman a las preguntas de la propuesta en `docs/sdd/ENTRADA.md`.
- [ ] `Fecha Orden de Venta Final` (`packages/shared/src/transitions.ts:203`) no entra en el 50·53 ni en el 59: la letra nombra «Fecha Orden De Venta». Se anota para Gerencia.

## 15. Matriz de amenazas

No aplica: no hay comandos de consola, subprocesos, automatización de control de versiones ni
clasificación de ejecutables. La ruta HTTP nueva es de sólo lectura y su frontera está en §6.
