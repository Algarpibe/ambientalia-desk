# Diseño — Traspaso leído como línea y trazas que faltan (F1B-05, sin la mitad de visibilidad)

Tanda F1B-05, `cierra: no`. Este documento dice CÓMO se construye lo que fija `proposal.md`; no lo reabre.
Toda cita es contra el árbol de este worktree a 2026-10-05. Lo no comprobado lleva la palabra «hipótesis».

## 1. Enfoque técnico

Cuatro piezas independientes, ninguna con tabla nueva:

1. **Restauración con rastro** (lote 1): cuatro columnas anulables en `public.remisiones`, un `UPDATE` que copia
   la anulación antes de vaciarla, y un derivador de eventos aparte del compositor.
2. **Actor en la liberación por borrado** (lote 1): un parámetro que baja de la ruta a la sentencia.
3. **Barrido de escritores** (lote 1): una prueba que lee el código fuente como texto.
4. **Línea de traspaso** (lote 2): módulo puro que recibe una fila de `ticket_transitions` y devuelve cero o un
   evento; el compositor lo intercala.

**Regla de edición de todo el cambio: en los ficheros citados se edita EN SITIO, sin añadir ni quitar líneas.**
La lógica nueva va a ficheros nuevos; lo que entra en un fichero existente cabe en la línea que ya había o se
une con `;`, como ya hace `apps/desk/server/db/eliminarTicket.ts:11`.

```
GET /api/tickets/:id/history
  getHistorialTicket
    ticket_transitions ──┬─ creación ───────────────→ [Ticket creado]
                         ├─ marcador F1F-01 ────────→ [Transición]            (sin traspaso)
                         └─ resto ──────────────────→ [Traspaso?, Transición] (en ese orden)
    remisiones ──────────→ creada, desenlace, anulada vigente
                           + eventosRestauracion: [anulada previa, restaurada]
    orden estable, más reciente arriba ──→ HistoriaPanel (sin cambios)
```

## 2. Decisiones

| ID | Decisión | Alternativa descartada | Razón |
|---|---|---|---|
| D-1 | **Cuatro columnas**: `restaurada_at timestamptz`, `restaurada_por text`, `anulacion_previa_at timestamptz`, `anulacion_previa_por text`. `anulada_at` y `anulada_por` conservan su significado: anulación VIGENTE, `NULL` = vigente | Dejar `anulada_at` rellena y añadir sólo `restaurada_at` | Todos los lectores deciden «vigente» con `anulada_at IS NULL` (§3). Dejarla rellena obligaría a tocarlos todos, incluido un `.tsx` |
| D-2 | **Un solo `UPDATE`** en `restaurarRemision`, con la copia escrita ANTES del vaciado dentro del `SET`, y `WHERE id = $1 AND anulada_at IS NOT NULL` | Dos sentencias en transacción; leer y escribir desde JavaScript | Atómico sin transacción. PostgreSQL evalúa el lado derecho del `SET` sobre la fila vieja; el orden copia→vaciado lo hace correcto también si pg-mem evaluara en secuencia (hipótesis: no medido). El `WHERE` evita escribir una restauración falsa sobre una remisión vigente; la respuesta de la ruta no cambia |
| D-3 | `restaurarRemision(db, id, quien: string)`; la ruta pasa `req.user?.name ?? TRANSITION_ACTOR`, la misma expresión de `apps/desk/server/routes/remision.ts:346` | `string \| null`, como `anularRemision` (`apps/desk/server/db/remisiones.ts:146-148`) | Criterio 2: nunca vacía. El tipo lo impone |
| D-4 | `anularRemision` **no se toca**: no borra el rastro del ciclo anterior. Una remisión anulada, restaurada y anulada otra vez enseña tres hechos | Vaciar el rastro al anular | Es lo que ya hace; se fija con prueba. S-2: el segundo `UPDATE` de restauración pisa el ciclo anterior |
| D-5 | El derivador `eventosRestauracion(fila)` vive en un fichero nuevo y el compositor lo concatena en `apps/desk/server/db/historial.ts:120`. El bloque de la anulación vigente (`apps/desk/server/db/historial.ts:110-119`) queda intacto | Reescribir el bloque | Cero líneas movidas. La anulación previa reutiliza `eventName: 'RemisionAnulada'` y el título «Remisión anulada»; la restauración es `'RemisionRestaurada'` |
| D-6 | `liberarAsociacionesDeTicket(q, ticketId, motivo, actor: string)`; añade `liberada_por = $3` a la sentencia de `packages/zoho-sync/src/db/ovAsociaciones.ts:134` | Parámetro opcional | Un llamador nuevo no compila sin actor |
| D-7 | `eliminarTicket(db, id, opts)` con `opts: { dryRun: true } \| { dryRun?: false; actor: string }`, **sin valor por defecto** | `actor?: string`; parámetro posicional | El simulacro no necesita actor; el borrado real no compila sin él. La ruta arma `opts` según `req.query.dryRun` y usa `req.user?.name ?? TRANSITION_ACTOR` |
| D-8 | **El barrido vive en `apps/desk/server`** y lee los fuentes como texto: `apps/` y `packages/`, `.ts` que no sean `*.test.ts` ni estén bajo `testing/`. Un paquete no importa de `apps/`; un lector de ficheros no importa nada | Prueba en `packages/zoho-sync` | Tiene que ver los escritores de los dos sitios |
| D-9 | El barrido compara un **inventario exacto** `fichero → número de escritores` y exige que cada lista de columnas nombre `performed_by`. Un `INSERT` sin lista de columnas cuenta como infractor. Cero escritores es rojo | Sólo «todos nombran la columna» | Un quinto escritor pone rojo el inventario aunque nombre la columna: obliga a declararlo, como los recuentos de `packages/zoho-sync/src/db/migrate.test.ts:376-378` |
| D-10 | **El módulo del traspaso vive en `apps/desk/server/db`, no en `packages/shared`** | `packages/shared` | El cálculo del área no lo ata al servidor: `areasSiguientes` y `catalogoDelTicket` están en `packages/shared` (`packages/shared/src/transitions.ts:327-334`, `packages/shared/src/flujos.ts:64-66`). Lo que lo deja aquí es que reconoce la creación con `esCreacion` (`apps/desk/server/db/ticketFuentes.ts:25-27`), como el compositor al que sirve, y que el cliente no lo consume: la regla invariable 13 no pide moverlo. Moverlo no es trivial y no se hace |
| D-11 | Destino por área = `areasSiguientes(to_status, catalogoDelTicket({ classification, status: to_status }))`, llamada directamente: es la base de `areasAAvisar` (`apps/desk/server/services/avisoArea.ts:15-17`) y el mismo catálogo que el aviso (`apps/desk/server/services/ticketService.ts:196`) | Restar el área de la transición (`fila.area`) | No es una segunda implementación (molde H5): es la función que el aviso ya llama antes de su resta, y la que nombra el delta RQ-AV-18. No se resta nada porque la fila guarda el nombre del actor, no sus áreas. Consecuencia declarada: sale línea «Comercial → Comercial» cuando la fase siguiente es de la misma área (S-4) |
| D-12 | `classification` sale de la fila ACTUAL del ticket, que `datosTicket` ya trae (`apps/desk/server/db/ticketFuentes.ts:165`): sin consulta nueva | Guardarla en la transición | No hay escritura nueva. Mismo límite que ya declara el compositor para «Cliente» |
| D-13 | Orden de emisión por fila `[traspaso, transición]`. Con la misma hora el comparador devuelve 0 (`apps/desk/server/db/ticketFuentes.ts:139-148`) y `sort` es estable: el traspaso queda ENCIMA de su transición | Sumar un milisegundo a la hora | La hora del traspaso es la de la transición (RQ-TZ-18); no se inventa un instante |
| D-14 | Exclusiones, en este orden: creación (`esCreacion`) → marcador (`transition_id === ID_TRANSICION_MIGRACION`) → destino. `to_status` nulo o no texto no da área; con persona derivada sí hay línea | Excluir por destino vacío | Dos reglas del marcador llevan destino. Exige añadir `transition_id` al `SELECT` de `apps/desk/server/db/historial.ts:137` |
| D-15 | `HistoryEvent` no cambia (`packages/shared/src/types.ts:610-611`). El origen y el destino van en `title` y `details`, **no** en `actor` | Confiar en `actor` | Comprobado: `apps/desk/src/components/HistoriaPanel.tsx:37-48` pinta hora, `title` y `details`; no pinta `actor` ni lee `eventName`. La hipótesis de la propuesta queda confirmada: no se toca ningún `.tsx` |
| D-16 | El detalle del destino se etiqueta «A» y el del origen «De»; **nunca** «Derivado a» | Reutilizar la etiqueta | `apps/desk/server/db/historial.test.ts:173-174` filtra por esa etiqueta y espera dos valores |
| D-17 | `apps/desk/server/db/conversacion.ts` no se toca | Línea también en el relato | Fuera de alcance por la propuesta |
| D-18 | Sin prueba nueva de la casilla comercial | Añadir una | Ya está fijada (propuesta, «Lo que hay hoy»); el punto 5 del alcance no aplica |

## 3. Lectores de `anulada_at` y `anulada_por`, barridos

Ninguno cambia: tras restaurar, las dos columnas siguen quedando en `NULL`.

| Lector | Dónde | Qué decide |
|---|---|---|
| Mapeo a `Remision` | `apps/desk/server/db/remisiones.ts:25` | `anuladaAt`, `anuladaPor` |
| Pendiente sin desenlace | `apps/desk/server/db/remisiones.ts:69` | Bloquea otra remisión |
| Panel del ticket | `apps/desk/server/db/remisiones.ts:77` | Sólo vigentes |
| Listado y CSV | `apps/desk/server/db/remisiones.ts:93` | Filtro «Ver anuladas» |
| Columnas del listado | `apps/desk/server/db/remisiones.ts:96` | Trae las dos columnas; sin cambio |
| Mapeo a `RemisionListado` | `apps/desk/server/db/remisiones.ts:123-124` | `anuladaAt`, `anuladaPor`; sin cambio |
| Vigencia para «Habilitar Servicio» | `apps/desk/server/db/remisiones.ts:238` y `packages/shared/src/remision.ts:127` | Remisión de entrada vigente |
| Estado por remisión | `apps/desk/server/db/estadoPorRemision.ts:45` | Recuento de confirmadas |
| Relato | `apps/desk/server/db/conversacion.ts:168` | Sólo vigentes |
| Hoja de vida | `apps/desk/server/db/equipos.ts:210` | Sólo vigentes |
| Historial | `apps/desk/server/db/historial.ts:110-119` | «Remisión anulada» |
| Envío a n8n | `apps/desk/server/routes/remision.ts:279` | `409` si está anulada |
| Cliente | `apps/desk/src/components/RemisionesPage.tsx:34`, `apps/desk/src/components/RemisionesPage.tsx:303-305`, `apps/desk/src/components/RemisionesPage.tsx:316` | Etiqueta, pie y botón |
| Cliente, fila del listado | `apps/desk/src/components/RemisionesPage.tsx:275` | Atenúa la fila anulada; sin cambio |

El tipo `Remision` no gana campos: el historial lee las columnas nuevas con su consulta propia
(`apps/desk/server/db/historial.ts:151`).

**Llamadores barridos.** `restaurarRemision` del servidor: uno, `apps/desk/server/routes/remision.ts:344`
(la de `apps/desk/src/api/client.ts:513` es otra función). `liberarAsociacionesDeTicket`: uno de producción,
`apps/desk/server/db/eliminarTicket.ts:154`, y `packages/zoho-sync/src/db/ovAsociaciones.test.ts:109`.
`eliminarTicket`: uno de producción, `apps/desk/server/routes/tickets.ts:91`, y catorce llamadas en
`apps/desk/server/db/eliminarTicket.test.ts`, de las que siete no son simulacro y ganan `actor`.

## 4. Ficheros

| Fichero | Lote | Acción | Contenido |
|---|---|---|---|
| `packages/zoho-sync/src/db/schema.sql` | 1 | Añadir al final | Comentario y cuatro `ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS`, tras `packages/zoho-sync/src/db/schema.sql:718` |
| `packages/zoho-sync/src/db/migrate.test.ts` | 1 | En sitio | Recuentos de `packages/zoho-sync/src/db/migrate.test.ts:376-377`: 55 → 59 y 29 → 33; sin calificar sigue 26 |
| `apps/desk/server/db/remisiones.ts` | 1 | En sitio | `apps/desk/server/db/remisiones.ts:151-152`: firma y sentencia |
| `apps/desk/server/routes/remision.ts` | 1 | En sitio | `apps/desk/server/routes/remision.ts:344`: pasa el actor |
| `apps/desk/server/db/remisionRestaurada.ts` | 1 | Nuevo | `eventosRestauracion` |
| `apps/desk/server/db/historial.ts` | 1 y 2 | En sitio | L1: `import`, columnas en `apps/desk/server/db/historial.ts:151`, `return` de la línea 120. L2: `import`, `transition_id` en la 137, `flatMap` en `apps/desk/server/db/historial.ts:142-144` |
| `packages/zoho-sync/src/db/ovAsociaciones.ts` | 1 | En sitio | `packages/zoho-sync/src/db/ovAsociaciones.ts:132-137` |
| `apps/desk/server/db/eliminarTicket.ts` | 1 | En sitio | Tipo de `opts` y llamada de `apps/desk/server/db/eliminarTicket.ts:154` |
| `apps/desk/server/routes/tickets.ts` | 1 | En sitio | `apps/desk/server/routes/tickets.ts:91`; el `import` de `TRANSITION_ACTOR` se une con `;` a `apps/desk/server/routes/tickets.ts:17` |
| `apps/desk/server/testing/escritoresTransiciones.ts` | 1 | Nuevo | Extractor puro (§5) |
| `apps/desk/server/escritoresTransiciones.test.ts` | 1 | Nuevo | Barrido y fixture sintético |
| `apps/desk/server/remisionRestaurada.test.ts` | 1 | Nuevo | Ruta y base, con el arnés |
| `apps/desk/server/db/remisionRestaurada.test.ts` | 1 | Nuevo | Derivador e historial |
| `apps/desk/server/db/eliminarTicket.test.ts`, `packages/zoho-sync/src/db/ovAsociaciones.test.ts` | 1 | En sitio y al final | Llamadas con actor; casos nuevos al final |
| `apps/desk/server/reconciliacion/registro.test.ts` | 1 | En sitio | `apps/desk/server/reconciliacion/registro.test.ts:218` dice DIEZ; la lista de la línea 220 gana `'F1B-05'` entre `'F1B-04'` y `'F1B-07'` |
| `apps/desk/server/db/traspaso.ts` | 2 | Nuevo | `lineaTraspaso` (§5) |
| `apps/desk/server/db/traspaso.test.ts` | 2 | Nuevo | Pruebas del módulo y del historial |
| `apps/desk/server/db/historial.test.ts`, `apps/desk/server/tickets.test.ts` | 2 | En sitio | Aserciones que hoy esperan la transición en cabeza (§7) |
| `docs/sdd/F0-01_Correcciones_para_el_maestro.md`, `docs/sdd/ENTRADA.md` | 2 | Añadir al final | Corrección 26; E-219, E-220, E-221 |

## 5. Contratos

```sql
-- al final de schema.sql; remisiones es de PUBLIC_TABLES: las cuatro van CALIFICADAS
ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS restaurada_at timestamptz;
ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS restaurada_por text;
ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS anulacion_previa_at timestamptz;
ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS anulacion_previa_por text;

-- restaurarRemision: la copia va ANTES del vaciado
UPDATE remisiones
   SET anulacion_previa_at = anulada_at, anulacion_previa_por = anulada_por,
       restaurada_at = now(), restaurada_por = $2,
       anulada_at = NULL, anulada_por = NULL
 WHERE id = $1 AND anulada_at IS NOT NULL
```

```ts
// apps/desk/server/db/remisionRestaurada.ts — puro
/** `[]` si `restaurada_at` es nulo. Si no: la anulación previa (si tiene instante) y la restauración. */
export function eventosRestauracion(fila: Record<string, unknown>): HistoryEvent[]
// «Remisión restaurada»: details [['Restaurada por', restaurada_por]]

// apps/desk/server/testing/escritoresTransiciones.ts — puro
export interface EscritorTransicion { ruta: string; columnas: string[] | null /* null = sin lista */ }
export function escritoresDeTransiciones(ficheros: ReadonlyArray<{ ruta: string; texto: string }>): EscritorTransicion[]
export const nombraActor = (e: EscritorTransicion): boolean => e.columnas?.includes('performed_by') ?? false
// patrón: INSERT INTO [esquema.]ticket_transitions, con o sin lista entre paréntesis, en varias líneas

// apps/desk/server/db/traspaso.ts — puro
/** Cero o un evento. `fila` necesita transition_id, from_status, to_status, performed_by, performed_at, values. */
export function lineaTraspaso(fila: Record<string, unknown>, nombres: Map<string, string>,
  ticket: { classification?: unknown }): HistoryEvent[]
```

Evento de traspaso: `eventName: 'AppTraspaso'`; `time` = `performed_at`; `actor` = `performed_by ?? 'App'`;
`title` = `Traspaso: <origen> → <destino>`; `details` = `De`, `A`, `Por la etapa` (`transition_name`). Varias
áreas se unen con `, `. Persona: `nombres.get(id) ?? id` (S-5), con el mapa que `nombresDerivados` ya resuelve
(`apps/desk/server/db/ticketFuentes.ts:115-125`).

**Límites del barrido (S-6), escritos en la descripción de la prueba:** comprueba que la columna se nombra, no
que el valor llegue relleno; no ve un nombre de tabla interpolado. Inventario de hoy: tres en
`packages/zoho-sync/src/db/repo.ts` y uno en `apps/desk/server/db/migracionTicketsAbiertos.ts`. Aparte, sin
contar entre los cuatro, un segundo caso recorre `docs/sdd/*.sql` (normativo: RQ-TZ-16): hoy uno,
`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:46`; `docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql` no
inserta (sólo lecturas y reversión comentada). Hipótesis: la raíz del repositorio se resuelve como
en `apps/desk/server/reconciliacion/registro.test.ts`, que ya lee ficheros reales.

## 6. Guardas y precedencia (regla de mutación 1)

**No hay guardas HTTP nuevas.** Restaurar sigue siendo `401`/`403` del middleware → `404` de existencia (A) →
escritura; restaurar una remisión vigente sigue respondiendo `200` sin escribir nada. Borrar sigue siendo `403`
→ `404`/`409` dentro de `eliminarTicket` → escritura; el actor sólo llega a la sentencia. IV-12 no se toca.

Lo que sí tiene posición: el orden dentro del `SET` (D-2), el orden de exclusiones (D-14) y el de emisión (D-13).

## 7. Pruebas (strict TDD) y mutaciones

Rojo previo por requisito, con vitest en entorno node y pg-mem donde ya se usa.

| Requisito | Fichero | Casos |
|---|---|---|
| Cabecera | `apps/desk/server/reconciliacion/registro.test.ts` | Roja desde que existe `proposal.md`; primera tarea: DIEZ |
| RQ-TZ-14 | `apps/desk/server/remisionRestaurada.test.ts` | Anular y restaurar por la ruta deja las cuatro columnas y vacía las dos vigentes; sin nombre en la sesión se escribe el respaldo; restaurar una vigente no escribe; anular de nuevo conserva el rastro; segundo ciclo pisa el primero; el listado y el panel vuelven a enseñarla |
| RQ-TZ-14, RQ-TZ-06 | `apps/desk/server/db/remisionRestaurada.test.ts` | Derivador: nunca restaurada → `[]`; restaurada → dos eventos con persona e instante; tres hechos en orden; los títulos de `apps/desk/server/db/historial.test.ts:97` no cambian |
| RQ-TZ-15 | `packages/zoho-sync/src/db/ovAsociaciones.test.ts`, `apps/desk/server/db/eliminarTicket.test.ts` | Dos vigentes quedan con `liberada_por`; la ya liberada conserva el suyo; sin vigentes no falla; el simulacro no escribe |
| RQ-TZ-16 | `apps/desk/server/escritoresTransiciones.test.ts` | Inventario exacto; todos nombran al actor; fixture sin `performed_by`; fixture sin lista de columnas; fixture calificado y en varias líneas; árbol vacío → rojo; procedimientos de `docs/sdd/*.sql`: inventario exacto (uno) y fixture `.sql` sin `performed_by` → rojo |
| Esquema | `packages/zoho-sync/src/db/migrate.test.ts` | Recuentos; el guardián existente ya exige calificar (`packages/zoho-sync/src/db/migrate.test.ts:346-350`) |
| RQ-TZ-18, RQ-AV-18 | `apps/desk/server/db/traspaso.test.ts` | Con persona; sin persona → área, comparada contra `areasSiguientes` y contra `areasAAvisar` con actor sin áreas, llamadas en la propia prueba; transición cuya área es la misma que la siguiente → hay línea (S-4); clave vacía; id que no resuelve; persona igual al origen; estado terminal; catálogo de equipo nuevo; misma hora → traspaso en el índice anterior al de su transición; abrir dos veces no emite `INSERT`, `UPDATE` ni `DELETE` (espía, molde de `apps/desk/server/db/migracionTicketsAbiertos.test.ts:68`) |
| RQ-TZ-19 | el mismo | Creación con derivación; marcador con `to_status` nulo; marcador con destino; otra transición con `to_status` nulo y persona sí da línea |
| RQ-TZ-17 | el mismo (lote 2, ~15 líneas) | Con un ajuste en `prioridad_ajustes`, ningún evento del historial procede de él; y, leídos como texto, `apps/desk/server/db/historial.ts`, `apps/desk/server/db/ticketFuentes.ts`, `apps/desk/server/db/remisionRestaurada.ts` y `apps/desk/server/db/traspaso.ts` no nombran `prioridad_ajustes`, `ov_asociaciones` ni `equipos_cambios`. Límite declarado en la descripción: mira esos cuatro ficheros, no lo que importan |

**Pruebas existentes que el lote 2 pone rojas y se actualizan:** `apps/desk/server/db/historial.test.ts:23-26`,
`apps/desk/server/db/historial.test.ts:69` (usa `eventos[0]`) y `apps/desk/server/db/historial.test.ts:189`;
`apps/desk/server/tickets.test.ts:118` y `apps/desk/server/tickets.test.ts:133-136`. Hipótesis: «Ingresado»
tiene área siguiente en el catálogo de servicio; si no, siguen verdes. `apps/desk/server/migracionMarcadorLectores.test.ts:62-71`
sigue verde sin editarse: el marcador no da traspaso.

| Lote | Mutación | Rojo esperado |
|---|---|---|
| 1 | Quitar del `SET` las dos asignaciones de copia | «deja las cuatro columnas» |
| 1 | Poner el vaciado delante de la copia en el `SET` | Hipótesis: rojo sólo si pg-mem evalúa en secuencia; en PostgreSQL es equivalente. Si queda verde se anota como mutación equivalente, no como prueba que falta |
| 1 | Quitar `AND anulada_at IS NOT NULL` | «restaurar una vigente no escribe» |
| 1 | Pasar `null` en vez del respaldo | No compila (`typecheck`); con `as never`, «sin nombre en la sesión» |
| 1 | Quitar `liberada_por = $3` | «dos vigentes quedan con `liberada_por`» |
| 1 | Regla 2: el fixture sintético sin `performed_by` | El barrido lo señala; es la prueba de que discrimina |
| 1 | Regla 2: quitar `public.` a una `ALTER` nueva en `schema.sql` | Guardián de `ALTER` sin calificar |
| 2 | Quitar la exclusión del marcador | «marcador con destino» |
| 2 | Mover la exclusión del marcador detrás del cálculo del destino y devolver por destino vacío | «marcador con destino» |
| 2 | Invertir el orden de emisión | «misma hora» |
| 2 | Sustituir `areasSiguientes` por una lista fija | «catálogo de equipo nuevo» |
| 2 | Regla 2: añadir al compositor una consulta a `prioridad_ajustes` | La prueba de RQ-TZ-17 |

## 8. Lotes

| Lote | Contenido | Producción | Pruebas | Total |
|---|---|---|---|---|
| 1 | Cabecera del registro, esquema, restauración, liberación con actor, barrido | ~125 | ~322 | ~447 |
| 2 | Traspaso, excepciones de traza (RQ-TZ-17), pruebas existentes, corrección 26 y bandeja | ~65 código + ~85 documentos | ~265 | ~415 |

Por fichero, lote 1: esquema 7; `migrate.test.ts` 4; `remisiones.ts` 6; `remision.ts` 2;
`remisionRestaurada.ts` 35; `historial.ts` 6; `ovAsociaciones.ts` 6; `eliminarTicket.ts` 6; `tickets.ts` 4;
`registro.test.ts` 4; extractor 45; su prueba 82 (12 del caso de `docs/sdd/*.sql`); pruebas de restauración 110 y 70; `eliminarTicket.test.ts` 40;
`ovAsociaciones.test.ts` 22. Lote 2: `traspaso.ts` 55; `historial.ts` 8; `traspaso.test.ts` 245 (15 de RQ-TZ-17); pruebas
existentes 20; corrección 26, 40; bandeja 45.

Hipótesis: son estimaciones; una línea modificada cuenta dos. Cada lote es un intento, medido antes de cerrar
con `git diff --shortstat --no-renames` más `wc -l` de lo nuevo sin trackear; techo 800, objetivo 720.

## 9. Regla de mutación 4

Citas vivas medidas con `grep -rnoE`, sin `openspec/changes/archive/` ni este cambio:

| Fichero | Citas | Desplazamiento |
|---|---|---|
| `apps/desk/server/routes/remision.ts` | 131 | Ninguno: una línea editada en sitio |
| `apps/desk/server/routes/tickets.ts` | 61 | Ninguno |
| `packages/zoho-sync/src/db/ovAsociaciones.ts` | 32 | Ninguno; ninguna apunta a la línea 132 o posteriores |
| `apps/desk/server/db/remisiones.ts` | 30 | Ninguno |
| `packages/zoho-sync/src/db/migrate.test.ts` | 17 | Ninguno |
| `apps/desk/server/db/eliminarTicket.ts` | 15 | Ninguno |
| `apps/desk/server/db/historial.ts` | 5 | Ninguno |
| `packages/zoho-sync/src/db/schema.sql` | 289 | Ninguno: se añade tras la última línea |

Como no se mueve nada, el barrido del cierre es de CONTENIDO: las citas a líneas cuyo texto cambia pasan a
caso C. Son las de `restaurarRemision`, la sentencia de `liberarAsociacionesDeTicket`, la llamada de la línea
154 de `eliminarTicket.ts` (cuatro, todas en paquetes de despliegue fechados: caso B, no se tocan) y los
recuentos de `migrate.test.ts` (uno, en un paquete fechado). Las formas abreviadas de `openspec/specs/trazas/spec.md`
piden el segundo pase a mano.

## 10. Regla de mutación 3 y matriz de amenazas

El cambio no añade decisiones de cliente ni toca `apps/desk/src`. Matriz de amenazas: N/A — no hay enrutado de
agentes, órdenes de consola, subprocesos ni automatización de control de versiones.

## 11. Despliegue y reversión

Cuatro columnas anulables en `public.remisiones`, aplicadas por `migrate` al arrancar
(`apps/desk/server/index.ts:27`); idempotentes. Sin variables de entorno, sin flag y sin relleno. Nota para el
paquete de despliegue: tras el arranque, comprobar las cuatro columnas en `public.remisiones`; las
restauraciones anteriores al despliegue siguen sin rastro (S-3) y la liberación de asociaciones de borrados
anteriores sigue sin persona. Reversión: revertir la rama; las columnas quedan sin uso.

## 12. Puntos abiertos

- D-11 saca línea de traspaso cuando el área siguiente es la misma que actuó. Es S-4 y se revierte en una
  línea; si en la aplicación resulta ruido, se resta el área de la transición.
- Hipótesis: `public.remisiones` no está entre las tablas replicadas desde el hub, así que las columnas no
  afectan a la replicación.
- Un actor de respaldo en `restaurada_por` o `liberada_por` no se distingue de una persona (E-219).
- Si pg-mem no acepta la copia columna a columna de D-2, la salida es dos sentencias con `enTransaccion`, copia
  primero; ahí la mutación de posición sí es roja en los dos motores.
