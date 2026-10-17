---
tanda: F1F-03
motivo: ""
capacidad: [vistas-tablero]
maestro: []
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta — `busqueda-cliente-y-codigo`

## 1. Qué fila atiende y qué parte

`decision/e198-busqueda-cliente-y-codigo` (Gerencia, 2026-10-17, registrada en `e99f361`): «la búsqueda cubre número de
ticket, serial, cliente y código de servicio; el contacto no. Entra antes del corte como pieza pequeña, por paridad con
Zoho.» Su `tanda_que_abre` es F1F-03 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:127`), donde
`decision/f1b08-cierre-sin-capturas` pasa lo que falte de Zoho Desk. Este cambio construye **sólo** esa pieza; la
aceptación con servicios reales del 16/11 al 04/12 sigue pendiente. Por eso `cierra: no`.

**Cobertura de la fila:** de F1F-03 cubre la paridad de búsqueda de E-198 (cliente y código de servicio); deja fuera la
aceptación con los cuatro servicios, los tres puntos incumplibles de `decision/f1f03-criterio-aceptacion` y lo que cada
persona anote como ausente de Zoho Desk.

## 2. Medición de partida (B-1), en `e99f361`

**Cómo se busca hoy.** Una sola pieza en `packages/shared`: `leerBusquedaTickets`
(`packages/shared/src/busquedaTickets.ts:28-37`) recorta, rechaza más de 64 caracteres (`:33`), saca el número de
`^#?(\d+)$` (`:34-36`) y construye el patrón con `patronSerial` (`:15-17`): recorte de extremos, minúsculas y
`%…%`, sin escapar `%` ni `_`. El fragmento SQL es `sqlBusquedaTickets`
(`packages/zoho-sync/src/db/busquedaTickets.ts:17-24`): número exacto `OR` serial del ticket `OR` serial del equipo
enlazado (`:21`), todo entre paréntesis (`:22`) y unido con `AND` al filtro de estado. Lo usan las cuatro consultas
del listado (`packages/zoho-sync/src/db/repo.ts:143`, `:158`, `:173`, `:178`), y a través de `getActiveTickets`
también «Mis tickets» (`apps/desk/server/routes/prioridad.ts:85`). La caja dice «Buscar por número o serial»
(`apps/desk/src/components/BuscadorTickets.tsx:21-22`).

**Qué es el código de servicio.** `tickets.codigo_servicio`, texto (`packages/zoho-sync/src/db/schema.sql:28`). Tiene
dos orígenes con la MISMA forma `PREFIJO_SERIE_MODELO[_AAMMDD]`: los tickets de la app lo construyen con
`buildCodigoServicio` (`packages/shared/src/ticketCreate.ts:12-14`, partes unidas con `_`); los de Zoho lo traen en
un campo o, si no, se extrae del asunto con `extractServiceCode` (`packages/zoho-sync/src/db/mappers.ts:61-66`,
`packages/shared/src/ticketCreate.ts:38-44`), que reconstruye el código sin los espacios del asunto. Hipótesis, sin
dato de producción: hay tickets de Zoho sin código, los mismos que `RQ-VT-11` ya declara sin serial.

**De dónde sale el nombre del cliente.** Las tres consultas con filas lo calculan como `COALESCE(a.name, cl.name)`
(`packages/zoho-sync/src/db/repo.ts:144`, `:159`, `:179`): `accounts` es la cuenta de Zoho Desk y `clients` es la vista
de Books (`packages/zoho-sync/src/db/schema.sql:169-173`). `countClosedTickets` no hace ningún `JOIN`
(`packages/zoho-sync/src/db/repo.ts:173`). El cliente **provisional** NO sale de la consulta: lo rellena
`conProvisionales` DESPUÉS (`apps/desk/server/db/ticketsConCliente.ts:15-24`), sólo si el join no dio nombre y el
`client_id` lleva el prefijo `prov-` (`packages/shared/src/altaManual.ts:11-16`), leyendo
`public.clientes_provisionales.razon_social` de los NO enlazados (`apps/desk/server/db/clientesProvisionales.ts:48-57`).
Consecuencia: un filtro puesto en la consulta no ve a los provisionales si no los busca por su cuenta.

**Las otras nociones de nombre de cliente (molde H5).** `searchClients` busca con `LOWER(...) LIKE '%q%'` en nombre,
razón social y NIT, sólo clientes (`packages/zoho-sync/src/books/repo.ts:117-127`), y `searchProvisionales` igual en
razón social y NIT (`apps/desk/server/db/clientesProvisionales.ts:33-42`). `normalizarNombreCliente` pliega acentos,
puntuación y formas societarias (`apps/desk/server/backfillClientId.ts:47-68`). Las tres responden a preguntas
distintas y ninguna está rota por separado.

**Lo que pg-mem no sabe hacer, medido.** `translate(text,text,text)` y `replace(text,text,text)` no existen en pg-mem
(ejecutado el 2026-10-17 en el worktree): un plegado de acentos en SQL no se podría probar en la red de pruebas.

## 3. Qué cambia

1. `sqlBusquedaTickets` suma tres vías al `OR`, dentro del mismo paréntesis: código de servicio del ticket, nombre de
   la cuenta de Desk o del cliente de Books del ticket, y razón social del provisional no enlazado. Siempre con
   subconsulta `IN (SELECT …)`, como el serial del equipo: no hace falta `JOIN`, así que vale igual para
   `countClosedTickets` y no puede duplicar filas.
2. El número sigue exacto y el serial sigue igual. El contacto no se busca.
3. Una sola regla de normalización para los cuatro campos de texto, la que ya existe en `packages/shared`
   (`patronSerial`), declarada por escrito en `RQ-VT-17` y enfrentada en una prueba a `searchClients` y a
   `normalizarNombreCliente`.
4. La caja dice lo que busca: «Buscar por número, serial, cliente o código».

## 4. Supuestos nuevos (reversibles, a la lista semanal)

- **S-1 · No se pliegan acentos ni puntuación.** «energia» no encuentra «Energía»; «ambientalia sas» no encuentra
  «Ambientalia S.A.S.». Es la regla de `searchClients`, el buscador de clientes que ya usa el equipo, y de la búsqueda
  por serial. Plegar exige `translate` o `unaccent` en el SQL, que pg-mem no tiene (§2): quedaría sin prueba.
- **S-2 · Casa cualquiera de los dos nombres del ticket.** Si un ticket tiene cuenta de Desk y cliente de Books, se
  encuentra por cualquiera de los dos, aunque el listado enseñe el de Desk (`COALESCE`). Hipótesis: es raro, porque los
  de Zoho llevan cuenta y los de la app cliente.
- **S-3 · Del cliente sólo cuenta el nombre**, no la razón social de Books (`company_name`) ni el NIT, que
  `searchClients` sí mira: el listado no los enseña.
- **S-4 · Asunto fuera.** La respuesta no lo nombra.

## 5. Regla invariable 13

El cliente no decide nada nuevo: sigue enviando el texto tal cual y el servidor filtra. La tabla está en `design.md` D4.

## 6. Riesgos

- `LIKE '%x%'` sobre dos tablas más sin índice. Hipótesis: miles de filas, igual que `RQ-VT-11`.
- Un texto corto («sa») casará con muchos clientes. Es lo que hace Zoho con un texto corto; no se pone mínimo.
