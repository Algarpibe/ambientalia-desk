# Diseño — Herramienta de migración de los tickets abiertos de Zoho Desk (F1F-01)

Tanda F1F-01, `cierra: no`. Este documento dice CÓMO se construye lo que fija `proposal.md`; no lo reabre.
Toda cita es contra el árbol de este worktree a 2026-10-04. Lo no comprobado lleva la palabra «hipótesis».

## 1. Enfoque técnico

Tres piezas, de dentro afuera:

1. **Núcleo puro** (`packages/shared`): tabla de equivalencias, plan por ticket y agregación del informe. Sin
   base de datos. Consume `ESTADOS` (`packages/shared/src/estados.ts:112`) y `esClasificacionSoporteRemoto`
   (`packages/shared/src/flujos.ts:116-119`); no los reescribe.
2. **Ejecutor** (`apps/desk/server/db`, fichero nuevo): lee los abiertos, llama al núcleo, y sólo si se pide
   aplicar y no hay negativa escribe marcador y `UPDATE` por ticket dentro de UNA transacción.
3. **Endpoint** de superadministrador: valida parámetros, llama al ejecutor, responde el informe.

```
POST /api/admin/migrar-tickets-abiertos?corte=…[&aplicar=true]
  requireAuth → requireSuperAdmin → validar parámetros (400)
     └─ migrarTicketsAbiertos(db, { corte, aplicar, actor })
          aplicar=false : leerPlan(db)            ── sin BEGIN, sin escrituras ──→ 200 informe
          aplicar=true  : enTransaccion(db, q =>
                              leerPlan(q)
                              ¿sinEquivalencia? ── sí ──→ informe con negativa (0 escrituras) → 409
                              por ticket: INSERT marcador → UPDATE … RETURNING id
                          )                                                        → 200 informe
```

## 2. Decisiones

| ID | Decisión | Alternativa descartada | Razón |
|---|---|---|---|
| D-1 | **Una sola transacción para toda la pasada**, con `enTransaccion` (`apps/desk/server/db/transaccion.ts:13-28`), el mismo molde que `applyTransition` (`packages/zoho-sync/src/db/repo.ts:331-346`). Al aplicar, la lectura del plan va DENTRO de la transacción, por el mismo cliente | Transacción por ticket | La negativa total y el «todo o nada» salen gratis; son unos cientos de filas |
| D-2 | **`aplicar=false` no abre transacción**: lee con `db` y devuelve | Leer siempre en transacción | Una pasada en seco que no emite `BEGIN` es comprobable por posición con un espía de SQL |
| D-3 | **Marcador, después `UPDATE … WHERE id=$1 AND managed_by_app = false RETURNING id`**; si no devuelve fila, se lanza error y la transacción entera se deshace. `RETURNING` ya corre sobre pg-mem (`apps/desk/server/db/clientesProvisionales.ts:94`, `apps/desk/server/db/clientesProvisionales.ts:98`) | `UPDATE` sin comprobar | `Queryable` sólo devuelve `rows` (`packages/zoho-sync/src/db/migrate.ts:5-7`); sin `RETURNING`, una fila movida entre la lectura y la escritura dejaría un marcador huérfano |
| D-4 | **`source` se queda en `'zoho'`** | Ponerlo a `'app'`, como `writeTransition` (`packages/zoho-sync/src/db/repo.ts:298`) | Ningún lector decide por `tickets.source`: «nacido en la app» se mira por prefijo del id, a propósito (`apps/desk/server/db/ticketFuentes.ts:32-38`). Es procedencia; dejarla ahorra un valor que restaurar. La primera transición real la pondrá a `'app'` |
| D-5 | **`modified_time` NO se toca; `updated_at = now()` sí** | Molde de F1C-09, que toca los dos (`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:51`) | Dos lectores: «leído» se calcula con `read_at >= modified_time` (`packages/zoho-sync/src/db/repo.ts:139`), así que tocarlo marcaría como no leídos todos los migrados para todos; y `history_synced_at < modified_time` (`packages/zoho-sync/src/sync.ts:307-309`) relanzaría la historia de Zoho de cada uno. El tablero ordena por `created_time` (`packages/zoho-sync/src/db/repo.ts:151`), no por éstas. Hipótesis: nada ordena por `updated_at` |
| D-6 | **En el marcador de una regla de identidad, `to_status` va `NULL`**; el destino va en `values`. En las dos reglas que cambian el estado, `to_status` es el destino | `to_status` = estado en todos | `entradasActuales` toma como entrada al estado actual la última fila cuyo `to_status` coincide con él (`apps/desk/server/db/sla.ts:88-95`): un marcador de identidad con `to_status` relleno **reiniciaría el reloj de alarma** de todos los migrados. `to_status` es nulable (`packages/zoho-sync/src/db/schema.sql:57-61`) y los compositores ya pintan `—` |
| D-7 | **El riesgo de numeración se informa, no bloquea**: `numeracion.masAltoAMarcar` y `numeracion.arrastra` (≥ `APP_TICKET_NUMBER_BASE`, `packages/zoho-sync/src/db/migrate.ts:43`), más una línea en `avisos` | Negarse a aplicar | El encargo fija informar; ni `reseedTicketNumber` (`packages/zoho-sync/src/db/migrate.ts:47-48`) ni `previewTicketNumber` (`packages/zoho-sync/src/db/repo.ts:245-246`) se tocan. Ver §6 |
| D-8 | **La negativa cuenta sólo los tickets que se migrarían**: no gobernados y no nacidos tras el corte. Un estado sin equivalencia en un ticket ya gobernado o posterior al corte se lista y no bloquea | Bloquear por cualquiera | No se van a tocar; bloquear por ellos impediría el corte sin proteger nada |
| D-9 | **Coincidencia de estado exacta**, sin plegar mayúsculas ni espacios | Normalizar | El estado se copia tal cual (`packages/zoho-sync/src/db/mappers.ts:47`). Lo que no coincida cae en «sin equivalencia» y se lista: es la dirección segura |
| D-10 | **`status_type` destino:** identidad no lo cambia; «Entregado» → `'Closed'` (S-2); «Pendiente» de servicio → `'Open'` | No tocarlo nunca | «En Proceso» no es una espera; el valor previo queda en el marcador |
| D-11 | **`corte` exige instante ISO con desfase** (`2026-12-01T00:00:00-05:00`); una fecha pelada es `400` | Aceptar `YYYY-MM-DD` | Una fecha sin zona cambia de día según quién la lea |
| D-12 | **`aplicar`**: ausente o `false` → seco; `true` → aplica; cualquier otro valor → `400` | Tratar lo raro como seco | Quien escribe `aplicar=1` cree estar aplicando; mejor decírselo |
| D-13 | **Negativa = `409`** con el informe completo; en seco, los mismos estados salen con `200` y `negativa` rellena | `422` | No es un defecto del cuerpo, es el estado de los datos |
| D-14 | **Procedimiento en un `.sql` comentado**, `docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql`, con la reversión prefijada `-- REV `, molde de `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:57-65` | Función y endpoint de reversión | La propuesta la fija «documentada». Sentencias estáticas, calificadas, sin subconsulta correlacionada |
| D-15 | **Tres lotes, no dos** (§8) | Los dos de la propuesta | El lote 2 quedaba a 53 líneas del techo de 720 con cifras estimadas |

## 3. Ficheros

| Fichero | Acción | Contenido |
|---|---|---|
| `packages/shared/src/migracionTickets.ts` | Nuevo | Núcleo puro (§4) |
| `packages/shared/src/migracionTickets.test.ts` | Nuevo | Pruebas del núcleo |
| `packages/shared/src/index.ts` | Añadir al final | `export * from './migracionTickets'` como línea 36, tras `packages/shared/src/index.ts:35`. **No mueve ninguna línea** |
| `apps/desk/server/db/migracionTicketsAbiertos.ts` | Nuevo | Ejecutor (§4) |
| `apps/desk/server/db/migracionTicketsAbiertos.test.ts` | Nuevo | Pruebas del ejecutor |
| `apps/desk/server/routes/admin.ts` | Añadir al final | Ruta nueva tras `apps/desk/server/routes/admin.ts:212` y el `import` del ejecutor DESPUÉS de la llave de cierre. **Sólo se desplaza la llave de `apps/desk/server/routes/admin.ts:213`**; las líneas 1 a 212 no se mueven. Un `import` a mitad de fichero ya existe en `packages/zoho-sync/src/db/repo.ts:129`. Hipótesis: `eslint` no lo rechaza; se comprueba con `npm run lint` |
| `apps/desk/server/migracionTicketsAbiertosRuta.test.ts` | Nuevo | Pruebas HTTP, con el arnés (`apps/desk/server/testing/appHarness.ts:34-40`) |
| `docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql` | Nuevo | Procedimiento y reversión |
| `packages/zoho-sync/src/db/migracionTicketsF1F01.test.ts` | Nuevo | Guardián del `.sql`, molde de `packages/zoho-sync/src/db/migracionPendienteF1C09.test.ts:29-34` |

**Sin sentencias de esquema.** `packages/zoho-sync/src/db/schema.sql` no se toca y los recuentos del guardián de
`migrate.test.ts` no cambian. Regla de mutación 4: el barrido del cierre es sobre `admin.ts` e `index.ts`; hoy
ninguna cita del repositorio apunta a las líneas 205 a 219 de `admin.ts` (comprobado con `grep`).

## 4. Contratos

**Núcleo** — `packages/shared/src/migracionTickets.ts`:

```ts
export const ID_TRANSICION_MIGRACION = 'migracion_f1f01_abiertos'
export const NOMBRE_TRANSICION_MIGRACION = 'Migración de ticket abierto de Zoho (F1F-01)'
export const ACTOR_MIGRACION = 'Migración F1F-01'

export type ReglaEquivalencia = 'identidad' | 'entregado-a-finalizado' | 'pendiente-servicio-a-en-proceso' | 'pendiente-soporte-se-conserva'
export interface Equivalencia { destino: Estado; regla: ReglaEquivalencia; statusTypeDestino: string | null /* null = no se cambia */ }
/** `null` = sin equivalencia. «Pendiente» y «Entregado» se deciden ANTES que la identidad. */
export function equivalenciaDeEstado(estadoZoho: string, clasificacion: string | null): Equivalencia | null

export interface TicketParaMigrar { id: string; number: number; status: string; statusType: string | null
  classification: string | null; managedByApp: boolean; createdTime: string | null }
export type AccionMigracion = 'migrar' | 'ya-gobernado' | 'tras-el-corte' | 'sin-equivalencia'
export interface PlanTicket { ticket: TicketParaMigrar; accion: AccionMigracion; equivalencia: Equivalencia | null }
/** Precedencia fija: ya-gobernado → tras-el-corte → sin-equivalencia → migrar. */
export function planDeTicket(t: TicketParaMigrar, corte: Date): PlanTicket
/** ¿El estado destino espera remisión de entrada? (S-6: «OV asignada» y «Ticket creado»). */
export function esperaRemisionDeEntrada(estado: string): boolean
export function resumenDeMigracion(planes: readonly PlanTicket[]): ResumenMigracion
```

«Abierto» (S-4) lo decide la consulta del ejecutor, con el predicado que ya usa el tablero
(`packages/zoho-sync/src/db/repo.ts:151`); el núcleo recibe sólo abiertos. `created_time` nulo cuenta como
anterior al corte. `esperaRemisionDeEntrada` usa `STATUS_OV_ASIGNADA` y `STATUS_TICKET_CREADO`
(`packages/shared/src/transitions.ts:142-143`).

**Ejecutor** — `apps/desk/server/db/migracionTicketsAbiertos.ts`:

```ts
export async function migrarTicketsAbiertos(
  db: Queryable, opts: { corte: Date; aplicar?: boolean; actor: string },
): Promise<InformeMigracion>
```

**Informe** (idéntico en seco y al aplicar):

```json
{
  "corte": "2026-12-01T05:00:00.000Z", "aplicar": false, "aplicado": false,
  "negativa": null,
  "abiertos": 0, "migrables": 0,
  "porEstado": [{ "origen": "Entregado", "destino": "Finalizado", "regla": "entregado-a-finalizado", "cambiaEstado": true, "tickets": 0 }],
  "sinEquivalencia": [{ "estado": "…", "tickets": 0, "numeros": [] }],
  "yaGobernados": { "nacidosEnLaApp": 0, "deZoho": 0 },
  "trasElCorte": [{ "numero": 0, "estado": "…", "creado": "…" }],
  "sinRemisionVigente": [{ "numero": 0, "estado": "OV asignada" }],
  "pendientes": [{ "numero": 0, "clasificacion": null, "destino": "En Proceso" }],
  "numeracion": { "masAltoAMarcar": null, "base": 10000, "arrastra": false },
  "avisos": ["Antes de aplicar: copia de la base y sincronización completa reciente (S-7)."]
}
```

`negativa`, cuando la hay: `{ "motivo": "estados-sin-equivalencia", "estados": ["…"] }`.

**Marcador** (`ticket_transitions`): `transition_id` = `ID_TRANSICION_MIGRACION`; `from_status` = estado previo;
`to_status` según D-6; `area` = `'Servicio Técnico'`; `performed_by` = `ACTOR_MIGRACION`; `values` =
`{ estado_previo, estado_destino, status_type_previo, managed_by_app_previo, regla, corte, ejecutado_por }`.

**`UPDATE`**: `status`, `status_type` (sólo si D-10 lo cambia), `managed_by_app = true`, `updated_at = now()`.

## 5. Lectura y escritura bajo pg-mem

- **Lectura única**, sin `NOT EXISTS` ni `TRIM`: `SELECT id, number, status, status_type, classification,
  managed_by_app, created_time FROM tickets WHERE (status_type <> 'Closed' OR status_type IS NULL)`. Toda la
  clasificación y la agregación van en JavaScript, por la razón escrita en
  `apps/desk/server/backfillClientId.ts:90-92` y `packages/zoho-sync/src/sync.ts:216-217`.
- **Nacido en la app**: prefijo `PREFIJO_TICKET_APP` (`packages/shared/src/transitions.ts:124`), para partir
  `yaGobernados` en dos.
- **Remisión de entrada vigente**: NO hay segunda implementación. Para cada ticket a migrar cuyo destino cumple
  `esperaRemisionDeEntrada`, el ejecutor llama a `vigenciaDeRemisiones` (`apps/desk/server/db/remisiones.ts:237-240`)
  y a `motivoSinRemisionVigente` (`packages/shared/src/remision.ts:131`): la misma pareja que la guarda de
  «Habilitar Servicio» (`apps/desk/server/services/ticketService.ts:273-277`). Una consulta por ticket de ese
  subconjunto.
- **Transacción**: D-1 y D-3.

## 6. Numeración

Al marcar, las filas de Zoho entran en el `MAX(number)` que leen `reseedTicketNumber` y `previewTicketNumber`.
Con números por debajo de 10000 no cambia nada: el suelo `APP_TICKET_NUMBER_BASE - 1` gana
(`packages/zoho-sync/src/db/migrate.ts:48`). La prueba `packages/zoho-sync/src/db/repo.test.ts:83-92` fija hoy
que un ticket de Zoho NO gobernado no arrastra; sigue verde porque no se toca.

**Qué comprueba la persona**, y queda en el procedimiento: en la pasada en seco, `numeracion.arrastra` debe ser
`false`. Si es `true`, la secuencia propia saltaría por encima de ese número en el siguiente arranque
(`apps/desk/server/index.ts:29`) y eso no tiene vuelta atrás: no se aplica y se consulta a Gerencia.

## 7. Orden de guardas, fijado por posición (regla de mutación 1)

| # | Guarda | Respuesta | Dónde |
|---|---|---|---|
| 1 | Sesión | `401` (`apps/desk/server/auth/middleware.ts:17`) | Ruta |
| 2 | Superadministrador | `403` (`apps/desk/server/auth/middleware.ts:27`) | Ruta |
| 3 | `corte` presente y válido; `aplicar` válido | `400` | Ruta, antes de llamar al ejecutor |
| 4 | Negativa por estados sin equivalencia | `409`, cero escrituras | Ejecutor, tras leer y antes del primer `INSERT` |
| 5 | Por ticket: marcador → `UPDATE` | — | Ejecutor |

Pruebas de solapamiento: (2 y 3) no administrador con `corte` inválido ve `403`, no `400`; (3 y 4) `corte`
inválido con un estado sin equivalencia en la base ve `400`; (4 y 5) un migrable y uno sin equivalencia con
`aplicar=true`: el espía de SQL no registra ni `INSERT` ni `UPDATE`.

## 8. Pruebas (strict TDD) y mutaciones

| Requisito | Fichero | Casos |
|---|---|---|
| RQ-TC-40 | `packages/shared/src/migracionTickets.test.ts` | Los 23 de `ESTADOS` salvo «Pendiente» dan identidad; «Entregado» NO está en `ESTADOS` (la regla no es muerta) y va a «Finalizado» con `'Closed'`; «Pendiente» de servicio y con clasificación nula va a «En Proceso»; «Pendiente» de soporte remoto se conserva, con la mayúscula variable; estado desconocido y estado con espacio sobrante dan `null` |
| RQ-TC-41 | el mismo | Precedencia de `planDeTicket` con casos solapados (gobernado y sin equivalencia; tras el corte y sin equivalencia); corte en el instante exacto; `createdTime` nulo; `resumenDeMigracion` cuenta y lista; `masAltoAMarcar` sólo sobre los migrables |
| RQ-ZS-17 | `apps/desk/server/db/migracionTicketsAbiertos.test.ts` | Seco: ni `BEGIN` ni escrituras, filas idénticas; aplicar: marcador y `UPDATE` por ticket, orden por espía; negativa total; segunda pasada sin cambios; `upsertTicket` posterior no altera la fila; `modified_time` y `source` intactos; marcador de identidad no mueve `entradasActuales`; `sinRemisionVigente` con y sin remisión; `numeracion.arrastra` a un lado y otro de 10000; `UPDATE` sin fila deshace todo |
| RQ-ZS-17 | `apps/desk/server/migracionTicketsAbiertosRuta.test.ts` | `401`, `403`, `400` (sin `corte`, fecha pelada, `aplicar=1`), `200` en seco por defecto, `409` de negativa, `200` al aplicar; los tres solapamientos del §7 |
| RQ-ZS-18 | `packages/zoho-sync/src/db/migracionTicketsF1F01.test.ts` | La reversión devuelve `status`, `status_type` y `managed_by_app`; no revierte donde el marcador ya no es la última transición; toda tabla calificada; una sentencia de reversión por cada regla del núcleo que cambia el estado |

**Mutaciones que reproduce el orquestador, y la prueba que debe ponerse roja:**

| Mutación | Rojo esperado |
|---|---|
| Quitar el seco por defecto (`aplicar` ausente escribe) | Ruta: «`200` en seco por defecto»; ejecutor: «seco: ni `BEGIN` ni escrituras» |
| Mover la negativa detrás de la primera escritura | Ejecutor: «negativa total», por el espía de SQL (no depende del `ROLLBACK` de pg-mem) |
| Invertir marcador y `UPDATE` | Ejecutor: «orden por espía» |
| Quitar `managed_by_app = true` del `UPDATE` | Ejecutor: «`upsertTicket` posterior no altera la fila» |
| Quitar el filtro de idempotencia (rama `ya-gobernado`) | Núcleo: precedencia; ejecutor: «segunda pasada sin cambios» |
| Quitar `requireSuperAdmin` de la ruta | Ruta: `403` |
| Rellenar `to_status` en identidad (D-6) | Ejecutor: «no mueve `entradasActuales`» |
| Añadir `modified_time = now()` (D-5) | Ejecutor: «`modified_time` intacto» |
| Regla de mutación 2: quitar del `.sql` la reversión de una regla | Guardián: «una sentencia por regla» |

El espía de SQL sigue el molde de `apps/desk/server/routes/altaManual.test.ts:158`.

## 9. Lotes

| Lote | Contenido | Producción | Pruebas (×1,8) | Total |
|---|---|---|---|---|
| 1 | Núcleo, su prueba y la línea de `index.ts` | ~126 | ~220 | ~346 |
| 2 | Ejecutor, ruta y sus dos pruebas | ~172 | ~310 | ~482 |
| 3 | Procedimiento `.sql` y su guardián | ~85 | ~100 | ~185 |

Hipótesis: son estimaciones. Cada lote es un intento, medido antes de cerrar con `git diff --shortstat
--no-renames` más `wc -l` de lo nuevo sin trackear; techo 800, objetivo 720.

## 10. Regla de mutación 3 y matriz de amenazas

Este cambio no añade ninguna decisión de cliente: no toca `apps/desk/src`.

Matriz de amenazas: N/A — no hay enrutado de agentes, órdenes de consola, subprocesos ni automatización de
control de versiones.

## 11. Despliegue y reversión

Sin migración de esquema ni flag. La reversión de datos es el bloque `-- REV ` del procedimiento: restaura sólo
donde el marcador sigue siendo la última transición del ticket (`id IN (SELECT max(id) … GROUP BY ticket_id)`,
la forma que ya corre sobre pg-mem en `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:61-63`) y borra
esos marcadores. El filtro por `"values"->>'status_type_previo'` usa el operador que ya corre sobre pg-mem en
`apps/desk/server/auth/users.ts:138`.

## 12. Puntos abiertos

- Hipótesis sin comprobar: que ningún otro lector de `ticket_transitions` trate el marcador como una entrada de
  estado. Medidos dos: `apps/desk/server/db/sla.ts:88-95` (cubierto por D-6) y
  `apps/desk/server/db/informeContrato.ts:34`, que toma la primera fila con `to_status = 'Finalizado'`: para un
  «Entregado» migrado, la fecha de finalización del informe de contrato será la de la migración. Va a la bandeja
  con la pregunta 1 de la propuesta.
- El marcador se ve en el historial del ticket como «Transición: Migración de ticket abierto…»
  (`apps/desk/server/db/historial.ts:54`), con sus valores como campos. Es deliberado: deja traza visible.
- Ejecutar con la aplicación en uso tiene una carrera residual; D-3 la convierte en un fallo limpio, no en un
  dato a medias.
