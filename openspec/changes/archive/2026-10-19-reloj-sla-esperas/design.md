# Diseño — `reloj-sla-esperas` (F1C-06, `cierra: si`)

Base: `6a4f76e`. Requisitos: RQ-TC-73 a RQ-TC-77 (`specs/tickets-core/spec.md`). Ningún fichero muy citado desplaza
líneas: lo nuevo va en ficheros nuevos, al final de los existentes o dentro de una línea que ya existe (regla de mutación 4).
Todas las líneas citadas se comprobaron en este árbol.

## D1 · `packages/shared/src/relojSla.ts` (nuevo) — la regla pura

```ts
import type { Estado } from './estados'             // SÓLO el tipo: se borra al compilar; ningún valor de la vista
import { horasHabilesEntre, type DiaCivil } from './calendarioLaboral'
export const ESTADOS_QUE_PARAN_EL_RELOJ = ['Notificación cliente', 'Por Entregar', 'Por Entregar / Sin facturar',
  'En Espera de Repuestos', 'Servicio externo'] as const satisfies readonly Estado[]
export const ESTADOS_TERMINALES_DEL_RELOJ = ['Finalizado', 'Anulado'] as const satisfies readonly Estado[]
export interface PasoDelReloj { estado: string; desde: Date | string }
export interface TiemposDelReloj { slaHoras: number; totalHoras: number }
export function paraElReloj(estado: string): boolean
export function tiemposDelReloj(pasos: readonly PasoDelReloj[], hasta: Date, cierres: ReadonlySet<DiaCivil>): TiemposDelReloj | null
```

- El tipo `Estado` se importa a propósito: `satisfies` hace que un nombre mal escrito rompa `tsc` (R-3 de la propuesta).
  El guardián prohíbe cualquier import de VALOR desde `./estados` y los nombres `CLASIFICACION_EN_ESPERA`,
  `ESTADOS_EN_ESPERA`, `enEsperaDe` y `estadoEnEspera` en las sentencias `import` del fichero.
- `tiemposDelReloj`: copia y ordena por `desde` (orden estable); secuencia vacía o un `desde` inválido → `null`. Cada
  tramo va de su `desde` al del siguiente; el último, hasta `hasta`. Un tramo que empieza después de `hasta` se recorta a
  `hasta` (da 0, `calendarioLaboral.ts:175`). Tramo terminal: no suma. Tramo en pausa: sólo `totalHoras`. Resto: los dos.
  Cada tramo se mide con `horasHabilesEntre` (`calendarioLaboral.ts:174`); ningún cálculo propio de días.
- Cabecera: «ESTE es el reloj del SLA de c7; lo que `sla.ts:5` titula "EL RELOJ DEL SLA" son alarmas de permanencia, que
  siguen midiendo en su estado y no leen esta lista (`R08.4.md:1878`)».
- `export * from './relojSla'` como línea nueva al final de `packages/shared/src/index.ts` (hoy acaba en `:48`).

## D2 · `estados.ts` reescrito en sitio

- `:30-33` (4 líneas → 4): el reloj del SLA para en `ESTADOS_QUE_PARAN_EL_RELOJ` (`relojSla.ts`, `decision/c7-reloj-sla`),
  lista propia que no se deriva de esta; hoy coincide con las `externa` salvo `Pendiente`, que el reloj no para. Los
  bodegajes de M1.10 siguen sin declararse aquí. `:26` y `:28` no cambian: `:28` lo vigila `comentariosVigilados.test.ts:96`
  y lo cita textual `sla.test.ts:45`.
- `:117-118` (2 → 2): «Es la lista de la VISTA. El reloj del SLA no la lee: tiene la suya, `ESTADOS_QUE_PARAN_EL_RELOJ`».
- Cierre: `git diff --numstat` con inserciones = borrados. Las citas a `estados.ts:26-33` de `transitions-st/spec.md:1182`
  y `:28` de `:1191` siguen acertando el bloque; lo que cambia es que el bloque deja de afirmar los bodegajes.

## D3 · Servidor: `apps/desk/server/db/relojSla.ts` (nuevo)

`tiemposDelRelojPorTicket(db, filas, ahora): Promise<Map<string, TiemposDelReloj | null>>`, con TRES consultas fijas y
ninguna si no hay filas cerradas:

1. `SELECT id, ticket_id, from_status, to_status, performed_at FROM ticket_transitions WHERE ticket_id IN (SELECT id FROM tickets WHERE status_type = 'Closed')`
2. `SELECT ticket_id, raw FROM ticket_history WHERE event_name = 'TicketUpdated' AND ticket_id IN (SELECT id FROM tickets WHERE status_type = 'Closed')`
3. `listarCierres(db)` (`apps/desk/server/db/calendarioCierres.ts:31`).

Subconsulta no correlacionada, el mismo molde que pg-mem ya acepta en `apps/desk/server/db/sla.ts:88-89`; agrupación en TS,
sin `GROUP BY` (`sla.ts:76`); `raw` con `json()` de `ticketFuentes.ts:53` (pg-mem lo da como texto). `etapasDesdeHistoria`
(`etapasDesdeHistoria.ts:86`) sólo necesita los `TicketUpdated` para `fromStatus`/`toStatus`/`performedAt` (`:93`, `:115-121`).

Pura y exportada, `secuenciaDelReloj(ticket, filasApp, etapasZoho): PasoDelReloj[] | null`:
- La foto de creación (`from_status = FROM_STATUS_CREACION`, `esCreacion`, `ticketFuentes.ts:25-27`; la escribe
  `createTicket`, `repo.ts:428-436`) NO es una entrada: da el estado inicial (`to_status`).
- Entradas: transiciones de la app (`to_status`, `performed_at`, desempate por `id`) y etapas de Zoho (`toStatus`,
  `performedAt`), juntas y ordenadas (precedente `equipos.ts:317-325`).
- Estado inicial: el de la foto; si no hay, el `fromStatus` de la entrada más antigua. Primer paso = ese estado en
  `created_time` (S-7). Sin foto ni entradas, sin estado inicial o sin `created_time` → `null`.
- Si el último estado de la secuencia no es `ticket.status` → `null` (S-5).

Supuestos de diseño (reversibles, a la lista semanal):
- **S-D1** Se calcula sólo para filas `status_type = 'Closed'`: son las únicas que entran en las medias (RQ-TC-76); las
  abiertas llevan `null`. Mantiene intactas las cuentas de `apps/desk/server/analisis.test.ts:31`, `:36`, `:41`.
- **S-D2** Una fila cerrada cuyo estado no está en `ESTADOS_TERMINALES_DEL_RELOJ` → `null`: su último tramo correría hasta
  `ahora`, y eso es inventar tiempo (S-5).

## D4 · `getAnalisisRows` y tipos, sin mover líneas

- `apps/desk/server/analisis.ts`: `:3` gana el import al final de la línea; `:11` pasa a `(db: Queryable, ahora: Date = new
  Date())`; `:22` añade `tiemposDelRelojPorTicket(db, filas, ahora)` como tercer elemento del `Promise.all`; `:30` añade
  `slaHoras` y `totalHoras` (`?? null`). La caché (`:34-42`) los guarda igual; `t.id` ya está en el `SELECT` (`:13`).
- `packages/shared/src/types.ts`: `:591` → `clasificaciones: string | null; slaHoras?: number | null; totalHoras?: number | null`
  (opcionales: `analisis.test.ts:5` y `:40` declaran filas literales y `analisisAnulados.test.ts:10-12` usa `Partial`);
  `:571` → `cumplimientoPct: number | null; tiempoSlaPromedioDias: number | null; tiempoTotalPromedioDias: number | null;
  ticketsConReloj: number`. `types.ts:611` está citado (`trazas/spec.md:834`): por eso nada se inserta.

## D5 · `computeAnalisis` (`packages/shared/src/analisis.ts`)

- `:2`: `; import { JORNADA } from './calendarioLaboral'` al final de la línea (9 h = `finHora - inicioHora`, `:14`).
- `:19`: `const servicio: number[] = [], sla: number[] = [], total: number[] = []`.
- `:65`: tras `servicio.push(dias)`, en la misma línea, `if (r.slaHoras != null && r.totalHoras != null) { sla.push(…); total.push(…) }`:
  los MISMOS tickets que `tiempoPromedioDias`, dentro del bloque de `:59`.
- `:83`: `cumplimientoPct: …, ...mediasDelReloj(sla, total),` en la misma línea.
- `mediasDelReloj` al final del fichero, tras `:95`: horas / 9, media a un decimal, `null` sin ninguno, y el contador.

**Barrido de citas, hecho al diseñar** (`grep -rnoE "[A-Za-z/]*analisis\.ts:[0-9]+(-[0-9]+)?"`, vivas fuera del archivo):

| Cita | Fichero | Qué pasa |
|---|---|---|
| `tickets-core/spec.md:4264` → `packages/shared/src/analisis.ts:59` | condición única | intacta; las medias nuevas cuelgan de ella |
| `kpis/spec.md:648` → `packages/shared/src/analisis.ts:17-95` | rango de `computeAnalisis` | los dos extremos se quedan; prohíbe tocarla a `kpis`, no a esta capacidad |
| `ENTRADA.md:1284` → `packages/shared/src/analisis.ts:66` | la promesa | intacta (`:65` crece a lo ancho) |
| `kpis/spec.md:462` → `apps/desk/server/routes/analisis.ts:11` | `requireSuperAdmin` | fichero no tocado |
| `TRASPASO_2026-10-08.md:1108` → `apps/desk/server/analisis.ts:13`; `equipos.ts:163` → `analisis.ts:17` | `SELECT`, `JOIN clients` | intactas |
| `TRASPASO_2026-10-08.md:1151` → `apps/desk/server/analisis.ts:26` en `73bd52f` | anclada | caso B, no se toca |
| propuesta: `:11-32`, `:34-42`, `:59`, `:63`, `:17-95` | | siguen acertando |

Las del archivo (`openspec/changes/archive/`) son registros fechados (caso B). `Analisis.tsx`: vivas `:83` (paquetes del
04/10) y `:98`/`:19` (propuesta), todas antes del punto de inserción; `:95` de `ENTRADA.md` va anclada a `e27f9da`.
`index.ts`: sólo `:6` citada. `sla.ts` (alarmas): no se toca.

## D6 · Cliente (`apps/desk/src/components/Analisis.tsx`)

Dos líneas nuevas tras `:98`: `<Kpi label="Tiempo prom. SLA (sin pausas)" value={data.tiempoSlaPromedioDias} suffix="días háb." />`
y `<Kpi label="Tiempo prom. total del cliente" value={data.tiempoTotalPromedioDias} suffix="días háb." />`. `:94` en sitio:
`md:grid-cols-5` → `md:grid-cols-4 xl:grid-cols-7`, para que siete quepan. Sólo pinta; «—» ante `null` lo hace `:19`.

## D7 · Pruebas y orden TDD (rojo antes de verde)

- `packages/shared/src/relojSla.test.ts`: escenarios de RQ-TC-73 y RQ-TC-74 con instantes de `instanteDeJornada`
  (`calendarioLaboral.ts:155`), nunca con «-5 h» a mano; semana del lunes 26/10/2026 sin festivos (12/10 y 02/11 caen fuera).
  Guardián: lee `relojSla.ts` (imports) y, para RQ-TC-77, `packages/shared/src/sla.ts`, `apps/desk/server/db/sla.ts` y
  `apps/desk/server/services/alarmasSla.ts` (ninguno nombra `ESTADOS_QUE_PARAN_EL_RELOJ` ni `relojSla`); y la alarma de
  `Notificación cliente` con `slaVencido` sigue saltando. Rojo por módulo inexistente.
- `describe` nuevo al final de `packages/shared/src/analisis.test.ts`: los cinco escenarios de RQ-TC-76.
- `apps/desk/server/relojSla.test.ts` (pg-mem, molde `apps/desk/server/db/sla.test.ts:241-247`): RQ-TC-75 —dos épocas, historia que no llega,
  sin entradas, foto de creación como estado inicial, S-D2— y la cuenta de consultas con 10 y con 100 tickets.
- Caracterización (verde de partida, la discrimina la mutación): RQ-TC-77 tablero e indicadores, con las suites de hoy.

## D8 · Mutaciones (con `herramientas/mut.mjs`, reemplazo literal, restaura solo)

| Id | Fichero | Mutación | Debe caer |
|---|---|---|---|
| M1 | `relojSla.ts` | quitar `Notificación cliente` | «una pausa no entra en el SLA» |
| M2 | `relojSla.ts` | añadir `Solicitado` | «las seis internas corren», «espera interna entra» |
| M3 | `relojSla.ts` | lista = externas de `CLASIFICACION_EN_ESPERA` | «Pendiente corre» y guardián |
| M4 | `relojSla.ts` | añadir `Pendiente` / `Pendiente de facturar` | sus dos escenarios |
| M5 / M5b | `relojSla.ts` | pausa suma al SLA / se resta dos veces | «pausa no entra», «total ≥ SLA» |
| M6 | `relojSla.ts` | último tramo hasta su `desde` / pausa abierta al SLA | «pausa abierta» |
| M7 | `relojSla.ts` | terminal que suma | «terminales no cuentan» |
| M8 | `db/relojSla.ts` | quitar `último ≠ status → null` | «historia que no llega» |
| M9 | `analisis.ts` | el `push` del reloj fuera del bloque de `:59` | «un anulado no entra» (posición, regla 1) |
| M10 | `relojSla.ts` | escribir `import { CLASIFICACION_EN_ESPERA } from './estados'` | guardián (regla 2) |
| M11 | `services/alarmasSla.ts` | escribir el import de la lista del reloj | guardián RQ-TC-77 |
| M12 | `relojSla.ts` | quitar la ordenación | «desordenada da lo mismo» |
| M13 | `db/relojSla.ts` | una consulta por ticket | cuenta de consultas |
| M14 | `db/relojSla.ts` | quitar S-D2 | su prueba |
| M15 | `analisis.ts` | dividir entre 8 | «días de 9 horas» |

## D9 · Regla 13 (regla de mutación 3)

| Decisión que se ve en el cliente | Línea del servidor que la impone |
|---|---|
| Qué estados paran y cuánto vale cada tiempo | `getAnalisisRows` → `tiemposDelRelojPorTicket` (`apps/desk/server/analisis.ts:22`, `:30`) |
| Media, contador y `null` | `computeAnalisis` (`packages/shared/src/analisis.ts:65`, `:83`), servida en `apps/desk/server/routes/analisis.ts:14` |
| Quién lo ve | `requireSuperAdmin` (`apps/desk/server/routes/analisis.ts:11`) |
| «—» ante `null` | ninguna: `Analisis.tsx:19` pinta lo recibido, no decide |

## D10 · Lotes, intentos y datos

| Intento | Lote | Contenido | Estimación ×1,8 |
|---|---|---|---|
| 3 | 1 | D1, D2, D5, tipos, `index.ts`, pruebas de shared, M1-M7, M9-M12, M15 | ~450 |
| 4 | 2 | D3, D4 (servidor), D6, prueba del servidor, M8, M13, M14 | ~500 |

Sin migración, sin escritura, sin interruptor (la lectura no escribe nada; regla de secretos no aplica). Matriz de amenazas:
N/A, sin rutas nuevas, procesos ni automatización de VCS. Paquete del cliente: dos líneas, se mide con `npm run build`.
