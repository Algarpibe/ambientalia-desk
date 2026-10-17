# Diseño — `fecha-migracion-fuera-de-cifras` (F1F-01, `cierra: no`)

## 1. Dónde vive el criterio (regla invariable 13)

Fichero NUEVO `packages/shared/src/cierreEnCifras.ts`, exportado con una línea al final de `packages/shared/src/index.ts`:

| Función | Qué decide |
|---|---|
| `esPasoDeMigracion(transitionId)` | si un paso es el marcador (`ID_TRANSICION_MIGRACION`, `migracionTickets.ts:14`) |
| `cierrePuestoPorMigracion(values)` | el `closed_time_destino` del marcador si `cierre_origen === 'migracion'`; si no, `null` |
| `cierreQueCuenta(closedTime, puestoPorMigracion)` | `null` si los dos son el mismo instante (S-1); si no, `closedTime` |
| `llegadaQueCuenta(paso)` | para el marcador: `closed_time_destino` si `cierre_origen === 'zoho'`, si no `null`; para otro paso, su `performedAt` (S-3) |
| `resolucionPromedioMs(tickets, puestos)` | media de `closedAt − createdAt` de los cerrados cuyo cierre cuenta; `null` sin ninguno |

## 2. Lectura en el servidor

Fichero NUEVO `apps/desk/server/db/cierresDeMigracion.ts`: `cierresPuestosPorMigracion(db)` → `Map<ticketId, instante>`, con
`SELECT ticket_id, values FROM ticket_transitions WHERE transition_id = $1` y `cierrePuestoPorMigracion` sobre cada fila. Una
consulta aparte y no un JOIN: la usan tres lectores con la misma forma, y un JOIN repetido en cada uno serían tres
implementaciones de la misma noción (molde de H5).

## 3. Cambios por lector, SIN insertar líneas en los ficheros muy citados

| Fichero (citas) | Cambio |
|---|---|
| `apps/desk/server/analisis.ts` (33) | `:2` import en sitio; `:13` añade `t.id`; `:22` pasa a `Promise.all` con `cierresPuestosPorMigracion`; `:26` usa `cierreQueCuenta` |
| `apps/desk/server/db/directory.ts` (52) | `:2` import en sitio; los `return {` de `getContactDetail` y `getAccountDetail` envuelven el detalle en `conResolucion(db, …)`, función nueva al final |
| `packages/shared/src/types.ts` | `ContactDetail` y `AccountDetail` (`:617`, `:618`) ganan `resolucionPromedioMs`, en la misma línea |
| `apps/desk/src/components/ClienteDetalle.tsx` (101) | `:123-128` (seis líneas) pasan a seis líneas que sólo formatean `data.resolucionPromedioMs` |
| `apps/desk/server/db/informeContrato.ts` (10) | import en sitio; `:34` lee `transition_id` y `values`; `:35` usa `llegadaQueCuenta` y salta el `null` |
| `apps/desk/server/indicadores.ts` | `:2` import en sitio; `:81` salta el paso marcador junto al `!vistos.has(id)` |

`packages/shared/src/indicadores.ts` (184 citas) NO se toca: el filtro va en la lectura del servidor, que alimenta los nueve
indicadores y la comparación con Zoho (`apps/desk/server/routes/indicadoresComparacion.ts:25-36`) a la vez.

## 4. Pruebas (strict_tdd)

- `packages/shared/src/cierreEnCifras.test.ts` (nuevo): las cinco funciones, con las fronteras de S-1 (mismo instante en otro
  formato ISO cuenta como el mismo) y de S-3.
- `apps/desk/server/cierreMigracionEnCifras.test.ts` (nuevo, arnés pg-mem): Análisis, detalle de cuenta y de contacto, informe
  de contrato e indicadores, con un marcador `'migracion'` y otro `'zoho'`.
- `apps/desk/server/migracionMarcadorLectores.test.ts:54-60`: la caracterización de `reentrante` falso se invierte (S-5): pasa a
  «sin dato» y el marcador ya no está en el historial de indicadores.

## 5. Regla de mutación 1 — posición de guardas

No se añade ninguna guarda de ruta ni se mueve ninguna: el cambio es de lectura. Las mutaciones de posición no aplican; sí las de
condición (§7).

## 6. Regla de mutación 3 — decisiones del cliente

Antes: `ClienteDetalle.tsx:123-128` decidía qué tickets entran en la media (cerrados con fechas) y la calculaba. Después: el `.tsx`
no decide nada; sólo formatea `resolucionPromedioMs` como h:mm, y «00:00» cuando llega `null` (la presentación de antes). La
decisión la impone `resolucionPromedioMs` (shared) en `conResolucion` (servidor). La tabla escrita va en `apply-progress.md`.

## 7. Mutaciones previstas

M-1 `cierreQueCuenta` devuelve siempre `closedTime` → rojo Análisis y ficha. M-2 `cierrePuestoPorMigracion` acepta `'zoho'` →
rojo «sí cuenta Zoho». M-3 `llegadaQueCuenta` devuelve el `performedAt` del marcador → rojo informe. M-4 quitar el salto del
marcador en `indicadores.ts:81` → rojo `reentrante`. M-5 (fichero vigilado) un marcador con `cierre_origen` en mayúsculas no es
de migración → prueba de igualdad exacta. M-6 la ficha vuelve a promediar con todos los cerrados → rojo la media.
