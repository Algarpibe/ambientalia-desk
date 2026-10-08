# Exploración — `prioridad-tres-niveles` (F1B-07)

Base: `main` en `6344b4a`. Origen: `decision/p3b-prioridad-tres-niveles` (`openspec/config.yaml` →
`decisiones_de_gerencia_adenda`). El ejecutor de la exploración no pudo escribir en disco; este fichero lo escribe el
orquestador con lo que **contrastó línea a línea**. Lo que el ejecutor afirmó y el orquestador no leyó va marcado
«hipótesis» y sin forma de cita.

## 1 · Lo ya construido — no se duplica

- **Lista asignable:** `PRIORIDADES_ASIGNABLES = ['High', 'Medium', 'Low']` (`packages/shared/src/prioridad.ts:13`).
  `Urgent` se compara pero no se ofrece; lo desconocido vale 0 (`packages/shared/src/prioridad.ts:22-23`).
- **Top 5 es una MARCA de cliente, no un valor de prioridad:** `prioridadTop5` devuelve la prioridad que el Director
  Comercial eligió para ese cliente, o `null`, y falla cerrado ante un valor fuera de la lista
  (`packages/shared/src/prioridad.ts:34-36`).
- **Prioridad al nacer:** `prioridadAlNacer` devuelve la más alta entre `High` por contrato vigente y la del Top 5; sin
  ninguna, la pedida en el cuerpo o `null` (`packages/shared/src/contratos.ts:66-69`). **Hoy no existe «media el
  resto».** Se aplica en `apps/desk/server/services/ticketService.ts:106`.
- **Contrato vigente del cliente:** `hayContratoVigente(db, clientId, hoy = hoyEnZona())`
  (`apps/desk/server/db/contratos.ts:79-81`) delega en `estadoContrato`, que da vencido sólo si `fechaFin < hoy`, con los
  dos extremos incluidos (`packages/shared/src/contratos.ts:41-45`). La ampliación mueve `fecha_fin`, así que la lee sin
  cambios. El día del vencimiento el contrato sigue vigente; el siguiente, no.
- **Permiso:** `puedeFijarPrioridadTop5` exige área Comercial y cargo Director Comercial; el administrador pasa
  (`packages/shared/src/cargos.ts:80-83`). Lo usan el `PUT` del cliente (`apps/desk/server/routes/prioridad.ts:40`), el
  `POST` del ajuste (`apps/desk/server/routes/prioridad.ts:71`) y la guarda de transición `cambiaPrioridadSinPermiso`
  (`packages/shared/src/prioridad.ts:81-86`, llamada en `apps/desk/server/services/ticketService.ts:131`). El Director
  Técnico no tiene excepción (`packages/shared/src/prioridad.ts:79`).
- **Escalera del ajuste por ticket:** A `404` (`apps/desk/server/routes/prioridad.ts:66`) < B1 `409` ticket sin cliente
  o cliente no Top 5 (`apps/desk/server/routes/prioridad.ts:68-69`) < B2 `403`
  (`apps/desk/server/routes/prioridad.ts:71`) < C `422` (`apps/desk/server/routes/prioridad.ts:73-74`).
- **Sincronizador:** `upsertTicket` no escribe `priority` si la fila tiene `prioridad_en_app_at`
  (`packages/zoho-sync/src/db/repo.ts:76-78`), y no escribe nada si `managed_by_app` (`packages/zoho-sync/src/db/repo.ts:71`).
  Ya construido: esta tanda lo prueba con un ticket venido de Zoho, no lo rehace.
- **Orden de la cola:** `ordenarColaTaller`, rango descendente y desempate por instante de habilitación
  (`packages/shared/src/prioridad.ts:101-109`). La ordena el servidor.

## 2 · Lo que la fuente no dice

- **Cómo se ordenan Top 5 y «alta» entre sí: la fuente no lo dice.** La decisión enumera tres niveles sin dar un orden.
  Hoy un Top 5 fijado en `High` y un cliente con contrato empatan en rango y se desempatan por habilitación.
- **Cliente Top 5 Y con contrato:** ya construido, manda la más alta de las dos (`prioridadMasAlta`,
  `packages/shared/src/prioridad.ts:26-28`).
- **Si «el ajuste puntual de un ticket» levanta el límite «sólo Top 5»:** no lo dice; la consecuencia (6) de la decisión
  lo deja como supuesto reversible: se levanta.

## 3 · Enfoque recomendado (A)

El Top 5 sigue siendo una marca de cliente con valor elegido. Cambia: (1) la lista asignable pasa a `High` y `Medium`,
a la par que las opciones del campo `priority` de `transitions.ts`; (2) `prioridadAlNacer` devuelve `Medium` cuando no
hay contrato ni Top 5, y la pedida deja de intervenir; (3) un predicado nuevo de cargo para el ajuste por ticket
—Director Comercial o Director Técnico; el administrador pasa— en el `POST` y en la guarda de transición; (4) se quita
B1 del `POST`; (5) el cliente consume la lista de `shared`. Sin esquema y sin tocar `repo.ts`.

Descartado (B): Top 5 como rango propio por encima de `High`. La fuente no lo pide, cambia el orden de la cola y el
tablero, y es inventar un dato.

## 4 · Supuestos reversibles, para anotar en la propuesta

- **S-A:** «Top 5» es la marca de cliente; el valor que impone lo elige el Director Comercial entre `High` y `Medium`.
  Top 5 y «alta» no tienen orden propio entre sí: empatan por rango y desempata la habilitación.
- **S-B:** «media el resto» = el servidor pone `Medium` al nacer; la prioridad pedida en el alta deja de intervenir.
- **S-C:** no se reescribe ningún ticket existente (consecuencia (2) de la decisión).
- **S-D:** se levanta el límite «sólo Top 5» del ajuste (consecuencia (6)).
- **S-E:** la excepción del Director Técnico alcanza el ajuste por ticket (ruta y transición), no el `PUT` del cliente.
- **S-F:** el Director Técnico ajusta por cargo, sin exigirle área; al Director Comercial se le sigue exigiendo la suya.
- **S-G:** el Director Técnico ajusta cualquier ticket: la respuesta no lo acota.
- **S-H:** levantado el límite, un ticket sin cliente también se puede ajustar.

## 5 · Dato de producción — sin relleno

- Los tickets con `Low`, `Urgent`, otro valor o sin prioridad no se tocan. Hipótesis: ningún código rompe al leerlos
  (se ordenan con su rango o con 0 y se pintan como llegan).
- Una fila de `cliente_prioridad` guardada con `Low` deja de imponer nada (`prioridadTop5` falla cerrado) hasta que el
  Director Comercial la vuelva a guardar. Va al paquete de despliegue.
- Consulta de sólo lectura, **no ejecutada**, para una persona con acceso a la base:

```sql
SELECT COALESCE(priority,'(sin prioridad)') AS prioridad, COUNT(*) AS tickets,
       COUNT(*) FILTER (WHERE status_type IS DISTINCT FROM 'Closed') AS abiertos,
       COUNT(*) FILTER (WHERE prioridad_en_app_at IS NOT NULL) AS con_marca
  FROM desk.tickets GROUP BY priority ORDER BY tickets DESC;
SELECT top5, COALESCE(prioridad,'(null)') AS prioridad, COUNT(*) AS clientes
  FROM public.cliente_prioridad GROUP BY top5, prioridad ORDER BY top5 DESC, clientes DESC;
```

  Hipótesis: los nombres `status_type` y `prioridad_en_app_at` de `desk.tickets` y las columnas de
  `public.cliente_prioridad` son los del esquema; el diseño los confirma contra `schema.sql` antes de entregarla.

## 6 · Cierre de la fila

**No cierra F1B-07** (consecuencia (7) de la decisión): la valoración del cliente sigue pendiente y no se construye.
Cabecera: `tanda: F1B-07`, `cierra: no`, `toca_maestro: si`.
