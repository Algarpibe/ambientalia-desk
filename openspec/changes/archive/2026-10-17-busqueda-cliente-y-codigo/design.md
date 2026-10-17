# Diseño — `busqueda-cliente-y-codigo`

Medido en `e99f361` (`proposal.md` §2).

## D1 · Tres vías nuevas dentro del mismo `OR`, en la misma línea

`sqlBusquedaTickets` (`packages/zoho-sync/src/db/busquedaTickets.ts:21`) construye hoy la parte de texto del
predicado. Pasa a construir cinco vías con el MISMO parámetro de patrón:

| Vía | SQL |
|---|---|
| serial del ticket (sin cambio) | `LOWER(t.serial) LIKE $p` |
| serial del equipo (sin cambio) | `t.equipo_id IN (SELECT id FROM equipos WHERE LOWER(serial) LIKE $p)` |
| código de servicio | `LOWER(t.codigo_servicio) LIKE $p` |
| cuenta de Desk o cliente de Books | `t.account_id IN (SELECT id FROM accounts WHERE LOWER(name) LIKE $p) OR t.client_id IN (SELECT id FROM clients WHERE LOWER(name) LIKE $p)` |
| provisional no enlazado | `t.client_id IN (SELECT id FROM public.clientes_provisionales WHERE enlazado_a IS NULL AND LOWER(razon_social) LIKE $p)` |

Todas con subconsulta y ninguna con `JOIN`, por la razón que el fichero ya escribe en `:11`: no duplican filas, y el
recuento de cerrados (`packages/zoho-sync/src/db/repo.ts:173`), que no hace `JOIN`, usa el mismo fragmento. `accounts`
y `clients` se nombran sin esquema, como en `repo.ts:146-147` (`search_path=desk,public`); la tabla de provisionales va
calificada, como en `apps/desk/server/db/clientesProvisionales.ts:53`.

El paréntesis exterior de `:22` no cambia y sigue siendo la guarda de posición: una vía fuera de él se salta el filtro
de estado.

**Por qué el provisional se busca en la consulta y no en `conProvisionales`.** `conProvisionales`
(`apps/desk/server/db/ticketsConCliente.ts:15-24`) rellena el nombre DESPUÉS de una consulta ya filtrada y paginada:
filtrar ahí perdería los provisionales de otras páginas y dejaría mal el `total` de cerrados. La condición
`enlazado_a IS NULL` es la misma que usa `nombresProvisionales` (`clientesProvisionales.ts:53`): un enlazado se
resuelve por Books, y su ticket se encuentra por el nombre de Books.

## D2 · Ninguna línea insertada en los ficheros que cambian

Los dos `busquedaTickets.ts` y `BuscadorTickets.tsx` tienen citas por línea en el archivo de `busqueda-ticket-serial`
(26 en `verify-report.md` y `apply-progress.md`). Todas sus ediciones son sustituciones en la misma línea física:
`wc -l` igual antes y después. Las pruebas van en ficheros nuevos.

## D3 · Normalización: la que ya existe, declarada y enfrentada

No hay función nueva. El patrón de los cuatro campos de texto es `patronSerial`
(`packages/shared/src/busquedaTickets.ts:15-17`), que construye `leerBusquedaTickets` (`:36`) en `packages/shared`.
El servidor sólo lo pasa como parámetro y el cliente no lo reescribe. Cambian sus comentarios de cabecera
(`:1-3`, `:11-13`, `:24-26`), en sitio, para decir que el patrón vale para los cuatro campos.

Se elige NO plegar acentos (S-1) por dos razones medidas: es el criterio del buscador de clientes que el equipo ya usa
(`packages/zoho-sync/src/books/repo.ts:118`, `:122`), y pg-mem no tiene `translate` ni `replace` (`proposal.md` §2).

La confrontación H5 va en `apps/desk/server/db/busquedaClienteConfrontacion.test.ts` (nuevo), con una tabla de casos:

| Nombre del cliente | Texto | Búsqueda de tickets y `searchClients` | `normalizarNombreCliente` de los dos |
|---|---|---|---|
| `Gecelca S.A. E.S.P.` | `gecelca` | casa | iguales |
| `Gecelca S.A. E.S.P.` | `  GECELCA s.a.  ` | casa | iguales |
| `Energía del Caribe` | `energía` | casa | iguales |
| `Energía del Caribe` | `energia` | **no casa** (S-1) | iguales |
| `Ambientalia S.A.S.` | `ambientalia sas` | **no casa** (S-1) | iguales |
| `Del Caribe Ltda` | `del  caribe` | no casa (espacio interior) | iguales |
| `Camposol Colombia` | `colombia camposol` | no casa | distintos |

La prueba exige el mismo veredicto en las dos búsquedas para cada fila y que las filas con «no casa» y nombres
normalizados iguales sean EXACTAMENTE las tres declaradas. Si alguien pliega acentos en una de las dos búsquedas, la
prueba se pone roja y obliga a decidirlo en las dos.

## D4 · Regla invariable 13, decisión a decisión

| Decisión del cliente | ¿Hay servidor que la imponga? | Línea |
|---|---|---|
| Qué campos busca la caja | sí: los decide el servidor, en el SQL | `packages/zoho-sync/src/db/busquedaTickets.ts:21-22` |
| Recortar, minúsculas, `#` | no la toma el cliente: envía el texto tal cual | `apps/desk/src/components/BuscadorTickets.tsx:12`, `apps/desk/server/util/busquedaTickets.ts:9` |
| Largo máximo 64 (`maxLength`) | sí: `422` | `packages/shared/src/busquedaTickets.ts:33`, `apps/desk/server/util/busquedaTickets.ts:10` |
| Texto «Buscar por número, serial, cliente o código» | no es decisión: es rótulo | — |

Ninguna decisión nueva en el cliente.

## D5 · Pruebas y mutaciones

- `packages/zoho-sync/src/db/busquedaClienteCodigo.test.ts` (nuevo): código, cuenta de Desk, cliente de Books,
  provisional no enlazado y enlazado, contacto fuera, número sin cambio, y la de posición con activos, cerrados y
  recuento.
- `apps/desk/server/db/busquedaClienteConfrontacion.test.ts` (nuevo): la tabla de D3 y el provisional a través de
  `ticketsConCliente` (sale y trae su nombre).
- Mutaciones (regla de mutación 1 y 2), cada una vista en rojo y restaurada: vía del cliente fuera del paréntesis;
  quitar `LOWER` del código; quitar `enlazado_a IS NULL`; «contiene» a «empieza por» en el cliente.

## D6 · El bundle cambia

Sólo por el texto de la caja (`BuscadorTickets.tsx:21-22`): cambia el nombre del `index-*.js`. No hay migración.
