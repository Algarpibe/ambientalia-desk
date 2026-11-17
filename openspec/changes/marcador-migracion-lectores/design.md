# Diseño — `marcador-migracion-lectores` (F1F-01, `cierra: no`)

Entrada: `proposal.md` y las tres deltas de este cambio (RQ-TZ-26..28, RQ-HV-20, RQ-TC-84..87; 15 escenarios ROJO y 9 de
CARACTERIZACIÓN). Partida `e728808d`. Toda cita a un fichero que esta tanda modifica lleva «en `e728808d`»; las demás, sin ancla.
Sin pasaje del maestro (`openspec/config.yaml:6780`).

## 1. Enfoque

Una sola regla pura, en un fichero NUEVO, `packages/shared/src/marcadorMigracion.ts` (S-8). Reconoce el marcador SÓLO con
`esPasoDeMigracion` (`packages/shared/src/cierreEnCifras.ts:19`) y contesta dos preguntas:

1. **Qué aporta un marcador a «desde cuándo está el ticket en su estado»** — `entradaDelMarcador`. Es la ÚNICA noción de «entrada
   con fecha de Zoho» del repositorio: la consumen `entradasActuales` y `secuenciaDelReloj` (y, por ésta, `ticketsEnEspera` y el
   reloj de Análisis). No se crea una segunda (molde H5).
2. **Cómo se enseña en el historial** — `presentarMarcador`, el texto en español de S-1.

Los lectores (c) se corrigen **editando la línea física que ya existe o añadiendo al final del fichero**. Ninguna línea existente
de ningún fichero cambia de número; el barrido de la regla de mutación 4 (§8) es semántico —qué afirma la línea editada—, no de
desplazamiento. El cliente no se toca (§9).

## 2. Decisiones

| # | Decisión | Alternativa descartada | Por qué |
|---|---|---|---|
| D-1 | Módulo nuevo, exportado con una línea 57 NUEVA tras `packages/shared/src/index.ts:56` en `e728808d` | Importarlo por subruta (`@ambientalia/shared/marcadorMigracion`, que `packages/shared/package.json:2` permite) | Hoy ningún fichero de `apps/` importa `shared` por subruta (0 coincidencias de `from '@ambientalia/shared/`): se sigue el patrón. Hipótesis: el bundle no cambia, porque el cliente no importa ningún símbolo del módulo; se mide (§10). Si cambiara, la subruta es la salida de reserva sin tocar la regla |
| D-2 | E-217, «Pendiente» de servicio → «En Proceso»: la fecha es la **última** entrada en Zoho a `from_status` del marcador (= `estado_previo`, `apps/desk/server/db/migracionTicketsAbiertos.ts:81`), sobre `etapasDesdeHistoria` (`packages/shared/src/etapasDesdeHistoria.ts:86`, ya ordenadas en `packages/shared/src/etapasDesdeHistoria.ts:126`) y comparando con `normalizarSiTexto` (`packages/shared/src/normalizarEstado.ts:6`) | `modified_time`, `created_time`, `performed_at` o `values.corte` (proposal §4) | Es la de RQ-TC-75 y la que ya leen `apps/desk/server/db/relojSla.ts:80-82` en `e728808d` y `apps/desk/server/db/esperasVencidas.ts:40-44` en `e728808d`. Se normaliza porque la historia de Zoho trae el estado en crudo y el ticket ya normalizado |
| D-3 | E-217, «Entregado» → «Finalizado»: la fecha es `llegadaQueCuenta` (`packages/shared/src/cierreEnCifras.ts:39-42`), es decir `closed_time_destino` con `cierre_origen: 'zoho'`; con `'migracion'`, sin dato | La regla de D-2 (última entrada en Zoho a «Entregado») | Una sola definición de «llegada a Finalizado de un migrado»: la que ya usa `apps/desk/server/db/informeContrato.ts:35`. Con D-2, el informe de contrato y el reloj de Análisis podrían dar dos fechas para el mismo cierre, ninguna rota por separado (H5). Coste: S-10 |
| D-4 | Qué rama: `to_status` nulo → no es entrada (identidad y «pendiente-soporte-se-conserva»: la escritura pone nulo cuando destino = estado, `apps/desk/server/db/migracionTicketsAbiertos.ts:81`). Con destino, decide `values.regla`: `entregado-a-finalizado` → D-3; `pendiente-servicio-a-en-proceso` → D-2; otra → sin dato (S-13) | Decidir por `to_status` | La regla es lo que la migración declara haber hecho (`apps/desk/server/db/migracionTicketsAbiertos.ts:73-76`); una regla desconocida no fecha |
| D-5 | `secuenciaDelReloj` resuelve el marcador DENTRO de sí misma: `resolverMarcador` quita los marcadores y añade al FINAL de las etapas de Zoho una etapa sintética `{ fromStatus: estado_previo, toStatus: destino, performedAt: fecha }`; sin fecha, `null` (S-6) | Renombrar el `toStatus` de la etapa de Zoho; resolver en cada llamador | Al final porque el orden estable de `apps/desk/server/db/relojSla.ts:46` en `e728808d` deja a la app antes que a Zoho en un empate: la sintética queda detrás de la entrada a «Pendiente» del mismo instante, ese tramo dura cero y el destino arranca en la fecha de Zoho. Es el «renombra» de proposal §4 con UN mecanismo para las dos reglas (renombrar no sirve para D-3, cuya fecha no es de una etapa). Dentro, para que los dos llamadores y la prueba directa lo vean |
| D-6 | `entradasActuales` lee `ticket_history` en una SEGUNDA consulta, sólo si alguna fila es marcador y sólo de esos tickets, con lista `IN ($1…$n)`, en una función nueva al final de `apps/desk/server/db/sla.ts` | Subconsulta no correlacionada (molde de `apps/desk/server/db/relojSla.ts:80-82` en `e728808d`); leer la historia de todos los tickets en estado con alarma | La subconsulta tendría que filtrar en SQL por el id del marcador, que RQ-TZ-28 prohíbe; leerlo todo contradice RQ-TC-84. La lista de parámetros es el molde del propio fichero (`apps/desk/server/db/sla.ts:107-108` en `e728808d`) y pg-mem la acepta. Sin N+1: una consulta para todos, cero si no hay marcadores |
| D-7 | `values` lo parsea el servidor con `json` (`apps/desk/server/db/ticketFuentes.ts:53-54`) antes de llamar al módulo; el módulo no parsea texto | Parsear en `shared` | Sería la tercera implementación de «jsonb de pg o de pg-mem» (ya están `json` y la de `apps/desk/server/db/informeContrato.ts:35`). Si llegara texto, `llegadaQueCuenta` no ve un objeto y da sin dato: falla del lado seguro |
| D-8 | Historial: evento propio con `eventName: 'AppTransition'` (S-1), `tipoEvento` de `tipoEventoDeTransicion` (da `null`, `packages/shared/src/tipoEvento.ts:11-15`), título y detalles de `presentarMarcador`. `lineaTraspaso` se sigue llamando antes, como hoy | No pasar el marcador por `lineaTraspaso` | Sin ese camino la guarda de `apps/desk/server/db/traspaso.ts:26` en `e728808d` quedaría muerta y su mutación no pondría nada rojo |
| D-9 | Conversación y hoja de vida: el `SELECT` gana `transition_id` en su misma línea y las filas se filtran con `!esPasoDeMigracion(...)` antes de cualquier otra decisión | Pintarlas con el presentador | S-2 y S-3 deciden ocultar |
| D-10 | Traspaso: `esPasoDeMigracion` en sitio, importado en su misma línea 2 (S-9) | — | Última comparación propia fuera de pruebas |
| D-11 | Pruebas: reescritura en sitio con el MISMO número de líneas por bloque; las nuevas, al final | Reescribir con otra longitud | `openspec/config.yaml:6775-6776` cita las líneas 41, 54, 62 y 73 de `apps/desk/server/migracionMarcadorLectores.test.ts` en `e728808d`, y la rama no puede tocar `openspec/config.yaml` |
| D-12 | RQ-TZ-28: una prueba lee como texto los `.ts`/`.tsx` de `apps/` y `packages/` (sin `*.test.ts`, `node_modules` ni `dist`) y exige que los que mencionan `ID_TRANSICION_MIGRACION` o `'migracion_f1f01_abiertos'` sean EXACTAMENTE cuatro: `packages/shared/src/migracionTickets.ts` (definición), `packages/shared/src/cierreEnCifras.ts` (`esPasoDeMigracion`), `apps/desk/server/db/migracionTicketsAbiertos.ts` (escritura) y `apps/desk/server/db/cierresDeMigracion.ts` (filtro SQL) | Buscar sólo `===` | Más estricta y sin falsos verdes por espacios. **Límite declarado** (molde RQ-TZ-17): granularidad de fichero; una comparación nueva DENTRO de uno de esos cuatro no la caza |

## 3. Flujo de datos

```
ticket_transitions ─┬─► entradasActuales ──► conFechaDeZoho ─────┐
  (+transition_id,  ├─► secuenciaDelReloj ─► resolverMarcador ───┼─► entradaDelMarcador ◄─ etapasDesdeHistoria ◄─ ticket_history
   values)          │     ▲ tiemposDelRelojPorTicket, ticketsEnEspera                        ▲ llegadaQueCuenta (D-3)
                    ├─► historial ──► esPasoDeMigracion ? presentarMarcador : eventoTransicion
                    ├─► conversación ─┐
                    └─► hoja de vida ─┴─► filtro !esPasoDeMigracion (oculto; la fila sigue en la base)
```

## 4. Contrato del módulo puro

```ts
// packages/shared/src/marcadorMigracion.ts (nuevo). Sin base de datos, sin reloj.
import { esPasoDeMigracion, llegadaQueCuenta } from './cierreEnCifras'
import { normalizarSiTexto } from './normalizarEstado'
import type { ReglaEquivalencia } from './migracionTickets'
import type { HistorialTransition, HistoryDetail } from './types'

/** Fila de ticket_transitions como la leen los lectores; `values` ya como objeto (D-7). */
export interface FilaConMarcador { transition_id?: unknown; from_status?: unknown; to_status?: unknown; values?: unknown }
/** 'ninguna' = no da entrada (identidad). 'entrada' con desde null = sin dato (S-6). */
export type EntradaDelMarcador = { tipo: 'ninguna' } | { tipo: 'entrada'; de: string | null; estado: string; desde: string | null }
/** null si la fila no es marcador (esPasoDeMigracion). Ramas de D-4; fechas de D-2 y D-3. */
export function entradaDelMarcador(fila: FilaConMarcador, etapasZoho: readonly HistorialTransition[]): EntradaDelMarcador | null
/** Quita los marcadores; por cada uno que cambia el estado, una etapa sintética al FINAL (D-5). null si alguno no tiene fecha. */
export function resolverMarcador<F extends FilaConMarcador>(filasApp: readonly F[], etapasZoho: readonly HistorialTransition[]):
  { filasApp: F[]; etapasZoho: HistorialTransition[] } | null
export const TITULO_MARCADOR_MIGRACION = 'Migración desde Zoho Desk'
export const TEXTO_REGLA_MIGRACION: Readonly<Record<ReglaEquivalencia, string>>
/** Título y detalles en español; etiquetas propias, nunca una clave de `values`; tolera `values` nulo o vacío sin lanzar. */
export function presentarMarcador(values: unknown): { title: string; details: HistoryDetail[] }
```

Textos (S-1, reversibles). Reglas de `packages/shared/src/migracionTickets.ts:18`: `identidad` → «El estado existe igual en Desk y
se conserva»; `pendiente-servicio-a-en-proceso` → «"Pendiente" de servicio técnico pasa a "En Proceso"»; `entregado-a-finalizado` →
«"Entregado" pasa a "Finalizado"»; `pendiente-soporte-se-conserva` → «"Pendiente" de soporte remoto se conserva». Detalles, en este
orden y omitiendo los vacíos: «Estado en Zoho» (`estado_previo`), «Estado en Desk» (`estado_destino`), «Regla aplicada», «Corte de
la migración» (`corte`, S-12) y «Ejecutada por» (`ejecutado_por`). No salen `status_type_previo`, `managed_by_app_previo`,
`closed_time_previo`, `closed_time_destino` ni `cierre_origen`. Ninguna etiqueta es `Regla` a secas, que es lo que produce la
etiqueta automática de la clave `regla`.

## 5. Cambios por lector

Todas las líneas, en `e728808d`; ninguna se inserta en medio, ninguna se mueve.

| Línea | Cambio | Líneas |
|---|---|---|
| `apps/desk/server/db/sla.ts:2` en `e728808d` | añade `entradaDelMarcador, esPasoDeMigracion, etapasDesdeHistoria` al import de `shared` y, tras `;`, `import { json } from './ticketFuentes'` | en sitio |
| `apps/desk/server/db/sla.ts:88` en `e728808d` | el `SELECT` gana `transition_id, from_status, values`; la subconsulta de la línea 89 no se toca | en sitio |
| `apps/desk/server/db/sla.ts:93` en `e728808d` | itera `(await conFechaDeZoho(db, r.rows as Record<string, unknown>[]))` en vez de `r.rows`, con la misma anotación de tipo; las líneas 94-100 no cambian | en sitio |
| final de `apps/desk/server/db/sla.ts`, tras la 125 | `conFechaDeZoho` (~20 líneas, D-6): sin marcadores devuelve las filas tal cual; si hay, una consulta a `ticket_history` (`TicketUpdated`) de esos tickets, y cada marcador sale con `performed_at` = `desde` de `entradaDelMarcador`, o se descarta si es `'ninguna'` o no tiene fecha | al final |
| `apps/desk/server/db/relojSla.ts:3` en `e728808d` | añade `resolverMarcador` al import | en sitio |
| `apps/desk/server/db/relojSla.ts:40` en `e728808d` | tras la llave: `const resuelto = resolverMarcador(filasApp.map((f) => ({ ...f, values: json(f.values) })), etapasZoho); if (resuelto === null) return null` | en sitio |
| `apps/desk/server/db/relojSla.ts:43` en `e728808d` y `:45` | `resuelto.filasApp` y `resuelto.etapasZoho` en vez de los parámetros; la foto de la línea 41 no cambia (un marcador nunca es creación, `apps/desk/server/db/ticketFuentes.ts:25-27`) | en sitio |
| `apps/desk/server/db/relojSla.ts:77` en `e728808d` | el `SELECT` gana `transition_id, values` | en sitio |
| `apps/desk/server/db/esperasVencidas.ts:36` en `e728808d` | el `SELECT` gana `transition_id, values`; lo demás lo hace `secuenciaDelReloj` | en sitio |
| `apps/desk/server/db/historial.ts:3` en `e728808d` | añade `esPasoDeMigracion, presentarMarcador` al import de valores | en sitio |
| `apps/desk/server/db/historial.ts:143` en `e728808d` | la rama que no es creación pasa a `[...lineaTraspaso(f, nombres, ticket), esPasoDeMigracion(f.transition_id) ? eventoMigracion(f) : eventoTransicion(f, nombres)]` | en sitio |
| final de `apps/desk/server/db/historial.ts`, tras la 162 | `eventoMigracion` (~6 líneas, D-8): `time` y `actor` como `eventoTransicion`, más `...presentarMarcador(json(fila.values))` | al final |
| `apps/desk/server/db/conversacion.ts:1` en `e728808d` | `import { esPasoDeMigracion, type Message } from '@ambientalia/shared'` | en sitio |
| `apps/desk/server/db/conversacion.ts:140` en `e728808d` | el `SELECT` gana `transition_id` | en sitio |
| `apps/desk/server/db/conversacion.ts:143` en `e728808d` | `const filasTr = (tr.rows as Record<string, unknown>[]).filter((f) => !esPasoDeMigracion(f.transition_id))`; `hayCreacion` y `nombres` (líneas 148 y 153) ya leen la lista filtrada | en sitio |
| `apps/desk/server/db/equipos.ts:6` en `e728808d` | añade `esPasoDeMigracion` | en sitio |
| `apps/desk/server/db/equipos.ts:274` en `e728808d` | el `SELECT` gana `transition_id`; la línea 275 no cambia | en sitio |
| `apps/desk/server/db/equipos.ts:278` en `e728808d` | itera `(tr.rows as any[]).filter((f) => !esPasoDeMigracion(f.transition_id))` | en sitio |
| `apps/desk/server/db/traspaso.ts:2` en `e728808d` | `ID_TRANSICION_MIGRACION` → `esPasoDeMigracion` | en sitio |
| `apps/desk/server/db/traspaso.ts:26` en `e728808d` | `if (esPasoDeMigracion(fila.transition_id)) return []` | en sitio |
| `packages/shared/src/index.ts:56` en `e728808d` | línea 57 nueva: `export * from './marcadorMigracion'` | al final |

## 6. Pruebas (strict_tdd)

**Reescrituras en sitio, en rojo antes del cambio.** Mismo número de líneas por bloque (D-11). Las únicas pruebas que citan líneas
de los ficheros tocados en su título son estas tres (barrido de `*.ts` con el patrón de los siete módulos), y sus citas siguen
apuntando al mismo `SELECT`/`FROM`: cambia sólo lo que afirma el título.

| Id | Bloque | Nuevo contenido | Escenarios |
|---|---|---|---|
| R1 | `apps/desk/server/migracionMarcadorLectores.test.ts:41-44` en `e728808d` | `toEqual([])`: z1 (identidad) y z2 quedan sin entrada. Ojo: los `values` de prueba de la línea 23 dicen `regla: 'identidad'` también para z2, que lleva destino, así que z2 sale por S-13 y no por falta de fecha; el «sin fecha» lo prueba R4 con la escritura real | TC-84 «identidad» (CAR) y S-13 |
| R2 | `apps/desk/server/migracionMarcadorLectores.test.ts:62-71` en `e728808d` | historial de z1: título `TITULO_MARCADOR_MIGRACION`, «Estado en Zoho» = «En Proceso», sin «Managed by app previo»; conversación de z1 sin mensajes | TZ-26 «identidad»; TZ-27 «identidad» (parte) |
| R3 | `apps/desk/server/migracionMarcadorLectores.test.ts:73-77` en `e728808d` | ninguna etapa con `NOMBRE_TRANSICION_MIGRACION` (z1 y z2) | HV-20 «identidad» y «destino relleno» |
| R4 | `apps/desk/server/db/migracionTicketsAbiertos.test.ts:142-147` en `e728808d` | `toEqual([])` y título nuevo: t2 lo escribe la migración real (`regla: 'pendiente-servicio-a-en-proceso'`) y no tiene historia de Zoho | TC-84 «sin fecha de Zoho» |

Los imports nuevos van en las líneas que ya existen (`apps/desk/server/migracionMarcadorLectores.test.ts:1` en `e728808d`, `:2`, `:4` y `:13`), unidos con `;` como en `apps/desk/server/db/sla.ts:2` en `e728808d`.

**Nuevas, al final de `apps/desk/server/migracionMarcadorLectores.test.ts`**, en dos `describe` (uno por lote), con un ayudante
para el marcador con sus `values` reales y otro para un `TicketUpdated` de `ticket_history` (`packages/zoho-sync/src/db/schema.sql:244-253`,
que exige `id` propio) con el `raw` que lee `etapasDesdeHistoria` (`eventInfo` con `Status`):

| Id | Qué | Escenario |
|---|---|---|
| P1 | `entradasActuales`: T-201 entra en «En Proceso» el 2026-10-20T14:00Z, no con el `performed_at` | TC-84 «cambia el estado» |
| P2 | `entradasActuales(…, ['Finalizado'])`: T-203 con historia a «Entregado» el 20/11 y `closed_time_destino` del 30/11 da el 30/11 (D-3) | TC-84 «Finalizado» |
| P3 | sin marcador y dos transiciones reales, la última | TC-84 «las demás» (CAR) |
| P4 | `secuenciaDelReloj` de T-202: con marcador de identidad, igual a sin él y no `null` | TC-85 «identidad» |
| P5 | `secuenciaDelReloj` de T-201: último paso `{ estado: 'En Proceso', desde: 2026-10-20T14:00Z }` | TC-85 «renombra» |
| P6 | lo mismo sin «Pendiente» en la historia: `null` | TC-85 «sin fecha» |
| P7 | `tiemposDelRelojPorTicket`: T-202 con identidad y transición real a «Finalizado», `slaHoras` y `totalHoras` no nulos | TC-85 «luego cierra» |
| P8 | `ticketsEnEspera`: T-202 en «En Espera de Repuestos», clasificación de servicio, medido desde 2026-10-05T09:00Z | TC-86 «con historia» |
| P9 | T-204 sin historia: no figura | TC-86 «sin historia» (CAR) |
| P10 | historial de T-201: sin «Transición:», nombra «Pendiente», «En Proceso», el corte y «Migración F1F-01», regla en español, ninguna etiqueta es `regla`, `estado_previo`, `estado_destino`, `status_type_previo` ni `managed_by_app_previo`; `eventName` es `AppTransition` | TZ-26 «cambia el estado» |
| P11 | conversación: T-202 con transición real «Habilitar Servicio» sale ella y no el marcador; T-201 sin rastro; la fila sigue en la base | TZ-27, los dos |
| P12 | hoja de vida: «Habilitar Servicio» sí y el marcador no; un ticket sin marcador conserva creación y dos etapas, en orden | HV-20 «identidad» y «no cambian» (CAR) |
| P13 | el escaneo de D-12 | TZ-28 «ninguna comparación» |

**Caracterizaciones que ya existen y no se tocan:** `apps/desk/server/db/traspaso.test.ts:139-144` (TZ-26 `eventName` y TZ-28
«traspaso»), `apps/desk/server/db/historialTipoEvento.test.ts:31-36` (TZ-26 `eventName`; exige `tipoEvento` nulo, que da D-8),
`apps/desk/server/cierreMigracionEnCifras.test.ts:87` (TC-87 «informe»), y en `apps/desk/server/migracionMarcadorLectores.test.ts`
en `e728808d` la línea 54 (TC-87 «indicadores») y la 46 (TC-87 «no lo ven»).

**Unitarias del módulo**, fichero nuevo `packages/shared/src/marcadorMigracion.test.ts`, rojas por importación antes de crear el
módulo: las cuatro ramas de D-4, la normalización de D-2, `null` sin fecha, el orden de la sintética de D-5, y el presentador con
`values` nulo, vacío y completo.

## 7. Mutaciones (CA-8)

Se hacen con el lote ya commiteado. Por cada una: `file <f>` antes; `perl -i -pe 's/\Qviejo\E/nuevo/ if $. == N' <f>` (nunca
`sed -i`); `npx vitest run <prueba>` y ver el rojo; restaurar con el `perl` inverso; `file <f>` igual que antes y
`git diff --numstat -- <f>` vacío. Las líneas son las de `e728808d`, porque nada se mueve.

| # | Lector | Mutación | Debe ponerse roja |
|---|---|---|---|
| M1 | `entradasActuales` | `apps/desk/server/db/sla.ts:93` en `e728808d`: vuelve a `r.rows` | P1, R1, R4 |
| M2 | `entradasActuales` | `apps/desk/server/db/sla.ts:88` en `e728808d`: sin `transition_id` | P1 |
| M3 | `secuenciaDelReloj` | `apps/desk/server/db/relojSla.ts:43` en `e728808d`: `filasApp` en vez de `resuelto.filasApp` | P4, P7, P8 |
| M4 | `secuenciaDelReloj` | `apps/desk/server/db/relojSla.ts:45` en `e728808d`: `etapasZoho` en vez de `resuelto.etapasZoho` | P5 |
| M5 | reloj de Análisis | `apps/desk/server/db/relojSla.ts:77` en `e728808d`: sin `transition_id` | P7 |
| M6 | `ticketsEnEspera` | `apps/desk/server/db/esperasVencidas.ts:36` en `e728808d`: sin `transition_id` | P8 |
| M7 | módulo | en `resolverMarcador`, «sin fecha → `null`» pasa a «se descarta» | P6 y su unitaria |
| M8 | módulo | la rama de D-3 usa la de D-2 | P2 y su unitaria |
| M9 | historial | `apps/desk/server/db/historial.ts:143` en `e728808d`: sólo `eventoTransicion(f, nombres)` | P10, R2 |
| M10 | conversación | `apps/desk/server/db/conversacion.ts:143` en `e728808d`: sin `.filter(...)` | P11, R2 |
| M11 | hoja de vida | `apps/desk/server/db/equipos.ts:278` en `e728808d`: sin `.filter(...)` | P12, R3 |
| M12 | traspaso | `apps/desk/server/db/traspaso.ts:26` en `e728808d`: se sustituye por un comentario | `apps/desk/server/db/traspaso.test.ts:139-144` |
| M13 | RQ-TZ-28 | las líneas 2 y 26 de `apps/desk/server/db/traspaso.ts` vuelven a su texto de `e728808d` (`git show e728808d:apps/desk/server/db/traspaso.ts`) | P13 |
| M14 | RQ-TZ-28, regla de mutación 2 | ensuciar el fichero vigilado: `apps/desk/server/db/equipos.ts:278` en `e728808d` con `f.transition_id !== 'migracion_f1f01_abiertos'` | P13 roja; R3 y P12 siguen verdes, así que P13 es el único detector |

Regla de mutación 1: no se añade ninguna guarda con vecina cuyo orden importe; el orden traspaso-antes-que-transición de
`apps/desk/server/db/historial.ts:143` en `e728808d` no cambia y ya lo fija `apps/desk/server/db/traspaso.test.ts:123-129`.

## 8. Barrido de citas (regla de mutación 4)

**Ningún fichero recibe líneas en medio.** Se añaden al final de `apps/desk/server/db/sla.ts`, `apps/desk/server/db/historial.ts`,
`packages/shared/src/index.ts` y `apps/desk/server/migracionMarcadorLectores.test.ts`, que no desplaza nada. El cierre barre igual
las citas a cada línea editada en sitio, porque cambia lo que dicen. Medido hoy (líneas con cita, `rg --count`, todo el repositorio,
archivo incluido):

| Fichero | Comando (sobre todo el repositorio) | Hoy | Que caen en una línea editada |
|---|---|---|---|
| `apps/desk/server/db/sla.ts` | `grep -rnoE "db/sla\.ts:[0-9]+(-[0-9]+)?" .` | 148 en 62 ficheros | línea 2: 6, todas del archivo; líneas 88 o 93: `openspec/config.yaml:6775`, `docs/sdd/ENTRADA.md:2094`, `openspec/specs/zoho-sync/spec.md:936`, el título de R1, las de este cambio y 20 del archivo |
| `apps/desk/server/db/relojSla.ts` | `grep -rnoE "db/relojSla\.ts:[0-9]+(-[0-9]+)?" .` | 31 en 14 | 9 del archivo y las de este cambio |
| `apps/desk/server/db/esperasVencidas.ts` | `grep -rnoE "esperasVencidas\.ts:[0-9]+(-[0-9]+)?" .` | 21 en 9 | sólo las de este cambio |
| `apps/desk/server/db/historial.ts` | `grep -rnoE "historial\.ts:[0-9]+(-[0-9]+)?" .` | 96 en 37 | 3 o 143: 2 de `docs/sdd/Paquete_de_Despliegue_2026-10-05*.md`, 14 del archivo y la propuesta |
| `apps/desk/server/db/conversacion.ts` | `grep -rnoE "conversacion\.ts:[0-9]+(-[0-9]+)?" .` | 22 en 18 | 140: `openspec/config.yaml:6775`, el título de R2, 5 del archivo y las de este cambio |
| `apps/desk/server/db/equipos.ts` | `grep -rnoE "equipos\.ts:[0-9]+(-[0-9]+)?" .` | 308 en 110 (incluye otros `equipos.ts`) | 274: sólo la propuesta |
| `apps/desk/server/db/traspaso.ts` | `grep -rnoE "traspaso\.ts:[0-9]+(-[0-9]+)?" .` | 23 en 10 | 26: 1 de `docs/sdd/Paquete_de_Despliegue_2026-10-05.md`, 2 del archivo y las de este cambio |
| `packages/shared/src/index.ts` | `grep -rnoE "shared/src/index\.ts:[0-9]+(-[0-9]+)?" .` | 51 en 47 | ninguna (sólo se añade la 57) |
| `apps/desk/server/migracionMarcadorLectores.test.ts` | `grep -rnoE "migracionMarcadorLectores\.test\.ts:[0-9]+(-[0-9]+)?" .` | 35 apariciones | dentro de 41-44, 62-71 o 73-77: `openspec/config.yaml:6775` (una completa y dos abreviadas), 8 del archivo (las 62, 62-71 y 63-68) y las de este cambio |
| `apps/desk/server/db/migracionTicketsAbiertos.test.ts` | `grep -rnoE "migracionTicketsAbiertos\.test\.ts:[0-9]+(-[0-9]+)?" .` | 52 apariciones | dentro de 142-147: sólo la propuesta |

**Segundo pase, abreviadas:** en cada fichero que ya cita uno de estos módulos, `grep -noE ':[0-9]+(-[0-9]+)?' <fichero>` y leer
las que vengan detrás de una cita completa del módulo en la misma línea física (p. ej. las de `openspec/config.yaml:6775`).

**Qué se hace con cada una.** Ninguna se rompe por posición (el detector sigue verde). Se lee qué afirma: caso A si sigue siendo
cierta; caso B si describe el comportamiento previo, y se le añade la revisión `e728808d` a la cita, sobre su misma línea física,
sin moverla. **Nunca se
editan `openspec/config.yaml` ni `docs/sdd/ENTRADA.md`:** sus tres impactos ya son caso B por su texto (`openspec/config.yaml:6775`
dice «medidos … sobre `d182230e`»; `docs/sdd/ENTRADA.md:2089` y `docs/sdd/ENTRADA.md:2094` cuelgan de entradas de 2026-10-04), y
los cierra la supervisión al resolver E-215 a E-217. El diseño garantiza que esas líneas citadas no se mueven.

## 9. Regla de mutación 3 — el cliente

No se toca `apps/desk/src` (CA-9). Decisiones del cliente sobre el marcador: **ninguna**. `apps/desk/src/components/HistoriaPanel.tsx:40`
pinta `e.title` tal cual; el resto de componentes de la fila 22 del inventario pinta lo que devuelve el servidor (hipótesis de
segunda mano, de la propuesta). El servidor es quien oculta (D-9) y quien redacta (D-8); el evento conserva `eventName`.

## 10. Despliegue y bundle

Sólo el servidor, sin migración ni variables nuevas. Fusionar y desplegar antes del 12/12. Comprobación del bundle tras
`npm run build`: el fichero de `apps/desk/dist/assets/` debe seguir llamándose `index-F1jDYjEU.js` y medir 427,51 kB (dato del
encargo, del build del intento 1; hipótesis hasta repetir la medida). Si cambia, el cliente también se despliega y el parte lo
dice; la regla no cambia (D-1).

## 11. Lotes para `sdd-tasks`

Estimación bruta × 1,8 (factor histórico). El `apply-progress.md` de cada lote suma aparte.

| Lote | Contenido | Bruto | Medido estimado |
|---|---|---|---|
| L1 · núcleo y relojes | módulo con `entradaDelMarcador` y `resolverMarcador` + sus unitarias, línea 57 del índice, `apps/desk/server/db/sla.ts`, `apps/desk/server/db/relojSla.ts`, `apps/desk/server/db/esperasVencidas.ts`, R1, R4, P1-P9, M1-M8 | ~260 | ~470 |
| L2 · pantallas y reconocimiento | presentador (añadido al final del módulo) + unitarias, historial, conversación, hoja de vida, traspaso, R2, R3, P10-P13, M9-M14, barrido de §8 | ~190 | ~340 |

L1 primero: L2 añade al final de ficheros que L1 crea o amplía. Un solo lote rondaría 800 con el `apply-progress.md`.

## 12. Supuestos nuevos (reversibles)

- **S-10** «Finalizado» fecha con `llegadaQueCuenta` (D-3): los migrados con `cierre_origen: 'migracion'` quedan sin entrada y sin
  reloj. Su número lo da ya el informe de la migración (`cierresDeMigracion`, `packages/shared/src/migracionTickets.ts:131-142`).
  *Lo deshace:* la rama de D-3 en `entradaDelMarcador`. Va a la lista semanal (punto 3 de proposal §10).
- **S-11** Un marcador que cambia el estado y no tiene fecha de Zoho deja la secuencia ENTERA en `null`, aunque después haya
  transiciones reales: el mismo criterio de hoy ante un hueco (`apps/desk/server/db/relojSla.ts:48` en `e728808d`). En esperas sólo
  afecta a un «Pendiente» → «En Proceso» que luego entre en una espera. *Lo deshace:* `resolverMarcador`.
- **S-12** El corte se enseña como se guardó (ISO, UTC). *Lo deshace:* el presentador.
- **S-13** Una `regla` desconocida con destino relleno no fecha (sin dato). *Lo deshace:* D-4.

## 13. Matriz de amenazas

N/A: sin enrutado, órdenes de shell, subprocesos, automatización de VCS, clasificación de ejecutables ni integración de procesos.
P13 lee ficheros del repositorio sólo en pruebas.

## 14. Vuelta atrás

Revertir la fusión y redesplegar el servidor. Sin migración ni escritura: las filas marcador no se tocan.

## 15. Preguntas abiertas

Ninguna bloquea. E-217 queda decidido por el diseño como supuesto reversible, como pide `openspec/config.yaml:6777` (D-2, D-3, S-10).
