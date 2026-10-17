# Progreso de aplicación — `busqueda-cliente-y-codigo` (F1F-03, `cierra: no`)

Un solo intento (`apply`), sobre `f73be04`.

## Rojo antes del verde

- `packages/zoho-sync/src/db/busquedaClienteCodigo.test.ts` (nuevo, 8 pruebas) y
  `apps/desk/server/db/busquedaClienteConfrontacion.test.ts` (nuevo, 10 pruebas), corridos ANTES de tocar el código:
  **11 en rojo y 7 en verde**. Las 7 verdes son las que afirman que algo NO sale: el provisional enlazado, el contacto,
  los tres casos de la tabla de D3 que no casan, el de «colombia camposol» y el recuento de divergencias.
- Tras el verde (`packages/zoho-sync/src/db/busquedaTickets.ts:21`): **58 de 58** en las seis pruebas de búsqueda
  (las dos nuevas más `busquedaTickets.test.ts` de `zoho-sync` y de `shared`, `busquedaConfrontacion.test.ts` y
  `busquedaTicketsHuecos.test.ts`).

## Mutaciones (regla de mutación 1 y 2), con `herramientas/mut.mjs`, cada una restaurada

| Id | Mutación | Resultado |
|---|---|---|
| M0 | control, sin cambio | 18 de 18 en verde |
| M1 | quitar el paréntesis exterior del predicado | rojo: la de posición (un cerrado sale entre los activos) |
| M2 | sacar la vía de Books fuera del paréntesis | rojo: la de posición |
| M3 | quitar `LOWER` del código de servicio | rojo: la del código |
| M4 | quitar `enlazado_a IS NULL` del provisional | rojo: la del provisional enlazado |
| M5 | Books de «contiene» a «empieza por» (`substring($p, 2)`) | rojo: «una parte del medio» y «la vía del cliente suma» |
| M6 | plegar acentos sólo en el patrón de `packages/shared` | rojo: la confrontación («energía» deja de casar) |
| M7 | quitar la vía del provisional | rojo: el provisional en `zoho-sync` y por `ticketsConCliente` |

## Ficheros existentes, en sitio

`wc -l` igual antes y después: `packages/shared/src/busquedaTickets.ts` 37, `packages/zoho-sync/src/db/busquedaTickets.ts`
24, `apps/desk/src/components/BuscadorTickets.tsx` 27, `apps/desk/server/reconciliacion/registro.test.ts` sin cambio en
este intento. En la caja cambian además el ancho, de `w-56` a `w-72` (`:23`), para que quepa el texto nuevo: cosmético.

## Desvío del diseño, anotado

`searchClients` no recorta los extremos: la ruta le pasa el texto tal cual (`apps/desk/server/routes/directory.ts:16`).
La confrontación se lo pasa recortado para enfrentar sólo la regla del nombre, y fija esa diferencia en una prueba aparte.
Es una diferencia del buscador de clientes, no de este cambio, y no se corrige aquí.

## Medida del intento y bundle (W1 del verify, corregido en sitio)

- Medida: `git diff --shortstat --no-renames f73be04 6b303b8` = 7 ficheros, 268 inserciones y 22 borrados, **290**; sin
  ficheros nuevos sin trackear. Es la cifra que asentó el registro. Las 762 que cita el verify son `e99f361..6b303b8`, que
  suman la planificación (502, asentada en su propio intento).
- Bundle: `npm run build` en `6b303b8` da `index-DUWvYLlB.js` (416,69 kB); con la caja y `shared` de `f73be04` da
  `index-BcnKpGtZ.js` (416,64 kB), el mismo nombre que tiene producción. Cambia sólo por el texto y el ancho de la caja.
