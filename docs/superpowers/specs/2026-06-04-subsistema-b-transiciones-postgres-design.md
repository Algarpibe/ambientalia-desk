# Diseño — Subsistema B: Transiciones escribiendo en Postgres

**Fecha:** 2026-06-04
**Estado:** Aprobado para planificación
**Parte de:** `docs/migracion-zoho-roadmap.md` (programa "reemplazar Zoho Desk por completo").
**Depende de:** Subsistema A (esquema tipado, `ticket_transitions`, `conversations`, `managed_by_app`).

## Objetivo

Que las **transiciones del Blueprint** se ejecuten escribiendo en **Postgres** (nuestra base = fuente
de verdad) en vez de en Zoho. Mover un ticket por sus estados, registrar el comentario y el historial,
y marcar el ticket como **gestionado por la app** (`managed_by_app = true`) para que el sync deje de
sobrescribirlo (cutover por ticket). Reaprovecha el motor de transiciones ya existente.

## Decisiones (confirmadas)

| Decisión | Elección |
|---|---|
| Destino de escritura | **Postgres** (no Zoho) |
| Actor (quién ejecuta) | Constante temporal **`'Equipo Técnico'`** (configurable por env); el login/roles reales son el Subsistema H |
| Efecto en el sync | La transición marca `managed_by_app = true` → el sync no vuelve a tocar ese ticket |
| Guard `ENABLE_WRITES` | **Se quita** del endpoint de transición (escribimos en nuestra DB) |
| Frontend | **Sin cambios** (`TransitionPanel` + `executeTransition` siguen igual) |

## Qué se reaprovecha / qué se elimina

- **Reaprovecha:** `shared/transitions.ts` (34 transiciones + campos obligatorios), la validación de
  obligatorios, `src/components/TransitionPanel.tsx`, `src/api/client.ts#executeTransition`.
- **Elimina (Zoho-específico):** `server/cfApiNames.ts` (mapeaba etiqueta→api-name de Zoho) y la versión
  Zoho de `server/transitionExec.ts` (armaba el body de `updateTicket`).

## Comportamiento — una transición (todo en Postgres)

Al confirmar una transición válida sobre un ticket:

1. **Actualiza el ticket** (`tickets`):
   - `status` = destino; `status_type` = `'Closed'` si el destino es un estado de cierre
     (`'Finalizado'`), si no `'Open'`.
   - Las **columnas tipadas** correspondientes a los campos capturados (fechas del flujo, prioridad…),
     convertidas por tipo (date/bool/int/text).
   - Fusiona en `custom_fields` (jsonb) los campos capturados que **no** son columna promovida.
   - `modified_time = now()`, **`managed_by_app = true`**, `source = 'app'`.
2. **Inserta el comentario** en `conversations`: `kind='comment'`, `author_name` = actor,
   `author_type='agent'`, `is_public=false`, `content` = comentario, `content_type='plainText'`,
   `commented_time = now()`, `source='app'`.
3. **Registra el historial** en `ticket_transitions`: `transition_id`, `transition_name`,
   `from_status` (estado actual del ticket antes de la transición), `to_status`, `area`,
   `performed_by` = actor, `values` (jsonb con lo capturado), `comment_id` (ref al comentario).

Todo contra Postgres; ninguna llamada a Zoho.

## Mapeo de campos → columnas

Los campos de cada transición (`shared/transitions.ts`) vienen con `key` = **etiqueta de Zoho**
(p.ej. `'Fecha de Cotización'`) y un `target` (`comment` | `customField` | `priority` | …).
El mapeo a columnas usa el inverso de `PROMOTED_COLUMNS` (ya existe en `server/db/rows.ts`,
etiqueta↔columna↔tipo):

- `target='comment'` → el comentario.
- `target='priority'` → columna `priority`.
- `target='customField'`:
  - si la etiqueta está en `PROMOTED_COLUMNS` → escribe la **columna tipada** (convierte por su `kind`).
  - si no → fusiona en `custom_fields[etiqueta]`.

## Plan de transición (estructura intermedia, puro y testeable)

`buildTransitionPlan(transition, values)` valida obligatorios y produce:
```ts
interface TransitionPlan {
  status: string
  statusType: string                 // 'Open' | 'Closed'
  columns: Record<string, unknown>   // columna tipada → valor convertido
  customFields: Record<string, string | null>  // no promovidos
  priority?: string
  comment?: string
  errors: string[]
}
```
(La lógica de validación de obligatorios se reaprovecha del `transitionExec` actual; sólo cambia la
salida: de un body de Zoho a este plan de columnas Postgres.)

## Componentes (archivos)

- Rewrite `server/transitionExec.ts` → `buildTransitionPlan(transition, values): TransitionPlan`.
- Modify `server/db/repo.ts` → `applyTransition(db, ticketId, fromStatus, transition, plan, actor)`:
  update del ticket + insert de la conversación (comentario) + insert en `ticket_transitions`.
  (Genera el `id` del comentario; usa `now()` para tiempos.)
- Rewrite endpoint `POST /api/tickets/:id/transition` en `server/app.ts`: lee el ticket actual
  (`getTicketWithRefs` para `from_status`), valida con `buildTransitionPlan`, llama `applyTransition`,
  devuelve `rowToTicketDetail` del ticket actualizado. **Sin** `guardWrites`.
- Delete `server/cfApiNames.ts`.
- Add `server/transitionActor.ts` (o constante en config): `TRANSITION_ACTOR = env.TRANSITION_ACTOR || 'Equipo Técnico'`.
- Frontend: sin cambios.

## Estados de cierre

`CLOSED_STATUSES = ['Finalizado']` (único `statusType: 'Closed'` confirmado en el portal). Al transicionar
a un estado de cierre, `status_type='Closed'` (sale del tablero activo). El resto → `'Open'`.
(El refinamiento "En espera"/On Hold por estado se deja para reportería — Subsistema G.)

## Manejo de errores

- Validación de obligatorios falla → `422` con la lista de errores (igual que hoy).
- `applyTransition` se hace en una transacción si el driver lo permite; si no, en orden
  (update → comentario → historial) tolerando que un fallo se propague como `500` sin estado a medias
  crítico (el update del ticket es lo esencial; comentario/historial son aditivos).
- Transición desconocida → `400`.

## Pruebas

- **`buildTransitionPlan` (puro, TDD):** valida obligatorios; mapea fechas/prioridad a `columns`,
  no promovidos a `customFields`, comentario a `comment`; `statusType` Closed para `'Finalizado'`.
- **`applyTransition` con `pg-mem`:** tras aplicar, el ticket tiene el nuevo `status`, las columnas
  escritas, `managed_by_app=true`; hay 1 fila en `conversations` y 1 en `ticket_transitions`.
- **Endpoint (supertest + pg-mem):** `422` si faltan obligatorios; `200` aplica y devuelve el detalle
  con el nuevo estado; sin guard de `ENABLE_WRITES`.

## Fuera de alcance (otros subsistemas)

- **Login, usuarios, roles, permisos, página de configuración → Subsistema H** (RBAC/auth). Mientras
  tanto cualquiera puede ejecutar cualquier transición; el actor es la constante temporal.
- Validación de "área responsable" por rol → H.
- Creación de tickets → Subsistema C. Correo → D.
- `status_type` On Hold fino + indicadores calculados → reportería (G).
