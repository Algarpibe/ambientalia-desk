# Diseño: hoja de vida con seis campos comerciales (F1B-02)

Insumo: `proposal.md` y `openspec/specs/hojas-vida/spec.md` (RQ-HV-01…08). Citas releídas contra `ee0ed40`.

## Enfoque técnico

Extender la cadena existente capa a capa, sin endpoint nuevo: esquema → tipos → `db/equipos.ts` → `routes/equipos.ts` → dos `.tsx`. Toda validación vive en servidor, en UN helper de la ruta que corre antes de cualquier escritura; el cliente sólo consume.

## Decisiones

| Decisión | Elegido | Descartado | Razón |
|---|---|---|---|
| Nombres de columna | `fecha_adquisicion date`, `fecha_factura_compra date`, `fin_garantia date`, `codigo_interno text`, `mantenedor_id text`, `drive_url text` | `fecha_factura` | `tickets.fecha_factura` es otra noción (`packages/zoho-sync/src/db/repo.ts:50`); `_compra` evita la homonimia |
| Dónde van las `ALTER` | **Al final** de `schema.sql` (hoy 448 líneas) | junto a `:354` | Insertar tras `:356` desplaza 16 citas `schema.sql:3xx-4xx` (regla de mutación 4) |
| Nombre del mantenedor | `LEFT JOIN clients` en lectura, **sin séptima columna** | desnormalizar `mantenedor_nombre` como `cliente_nombre` | El alcance fija seis columnas; precedente probado del JOIN a la vista `public.clients` (`schema.sql:169-173`) en `apps/desk/server/analisis.ts:16` |
| Lectura de fechas `date` | exportar `fechaSolo` de `packages/zoho-sync/src/books/repo.ts:94-101` y consumirla | `toISOString().slice(0,10)` | `:89-92` documenta que `toISOString` rueda un día en UTC-5 y que `TZ=UTC` de vitest no lo caza. Cambio de una palabra (`export`), sin mover líneas |
| Validar Drive | `urlSegura` de `@ambientalia/shared` (`remision.ts:100-102`), importada como en `db/eliminarTicket.ts:13` | `startsWith('https://')` | Decidido; sólo `urlSegura` rechaza la comilla (`:94-98`) |
| Validar fecha | helper local `esFechaIso`: regex de `routes/remision.ts:127` + ida y vuelta `new Date(v+'T00:00:00Z').toISOString().slice(0,10) === v` | sólo regex | La regex deja pasar `2026-02-30`; hipótesis: PostgreSQL lo rechazaría en el `INSERT` y el usuario vería un 500 en vez de un 422. No existe validador de fecha en `packages/shared/src` |
| Vaciar un campo | `''` o `null` escriben `NULL`; `undefined` no toca | rechazar `''` | El formulario de edición manda los seis siempre; sin esto no se podría borrar un dato erróneo |
| `EquipoLite` vs `EquipoFull` | `codigoInterno` en `Lite`; el resto en `Full` | todo en `Lite` | `searchEquipos` devuelve `Lite` (`db/equipos.ts:58`) y casa por `codigo_interno`: quien lee el resultado debe ver por qué casó |

## Flujo de datos

    EquipoForm ──POST/PATCH──→ routes/equipos.ts
                                 existentes :52-58 / :71-88
                                 camposHojaDeVida(db, b)  ──422 si error──→ fin, sin escribir
                                 createEquipo / updateEquipo + setEquipoActive
    HojaDeVida ←── getEquipoHistorial → getEquipoFull (LEFT JOIN clients) ─ toFull + fechaSolo

## Validación en la ruta

`camposHojaDeVida(db, b): Promise<{ error: string } | { campos: CamposHojaDeVida }>` en `routes/equipos.ts`, al final del fichero. Por cada clave con `b[k] !== undefined`: vacío → `null`; si no, valida. Orden interno: mantenedor (`getClient`, existencia, 'Mantenedor no encontrado') → tres fechas → Drive (`urlSegura(v) === null` → 'El enlace de Drive debe empezar por https:// y no llevar comillas'). Existencia antes que contenido, como el orden total de F1B-10 (hipótesis: F1B-10 lo declara para las puertas del motor, no para esta ruta).

Punto de llamada: **POST** entre `:58` y `:59`; **PATCH** entre `:88` y `:89` — antes de `updateEquipo` (`:89`) **y** de `setEquipoActive` (`:90`), para que un `{active, driveUrl malo}` tampoco desactive.

## Cambios por fichero

| Fichero | Cambio |
|---|---|
| `packages/zoho-sync/src/db/schema.sql` | Seis `ALTER TABLE equipos ADD COLUMN IF NOT EXISTS …` sin calificar (`equipos` ∈ `DESK_TABLES`, `migrate.ts:63-64`), al final. Comentario **sin punto y coma** (trampa de `:445-447`) |
| `packages/zoho-sync/src/books/repo.ts` | `export` en `:94` |
| `packages/shared/src/types.ts` | `EquipoLite.codigoInterno?`; `EquipoFull` + `fechaAdquisicion?`, `fechaFacturaCompra?`, `finGarantia?`, `mantenedorId?`, `mantenedorNombre?`, `driveUrl?` (todos `string`) |
| `apps/desk/server/db/equipos.ts` | `EquipoInput` (`:85-94`, está aquí y no en `types.ts`) + seis opcionales `string \| null`; `createEquipo` $9-$14; `updateEquipo` seis `add(...)`; `toLite`/`toFull` los mapean; `getEquipoFull`/`listEquiposManage` seleccionan columnas + `cl.name AS mantenedor_nombre`; `searchEquipos` y `listEquiposManage` añaden `OR LOWER(COALESCE(codigo_interno,'')) LIKE $1`. El campo de `toLite` va **en la línea `:41`**, sin insertar líneas antes de `:45-53` (citado en `types.ts:342`) |
| `apps/desk/server/routes/equipos.ts` | helper + dos llamadas; POST pasa `campos` a `createEquipo` |
| `apps/desk/src/api/client.ts` | `EquipoInput` (`:301`) + seis opcionales `string \| null` |
| `HojaDeVida.tsx` | Tras `:161`, rejilla de seis pares etiqueta/valor, `'—'` si vacío. Fechas **tal cual** (`AAAA-MM-DD`), NO con `fmtFecha` (`:8-12`: `new Date('2026-01-05')` cae el día 4 en UTC-5). Botón «Ver en Google Drive» sólo si `urlSegura(eq.driveUrl)`, `target="_blank" rel="noopener noreferrer"` |
| `EquiposAdmin.tsx` | `EquipoForm`: tres `type="date"`, código interno, Drive, y un `SelectorMantenedor` local con `searchClients` + «Quitar»; el selector de cliente (`:203-218`) no se toca. Payload `:148` manda los seis |

## Regla 13 / mutación 3 — decisiones del cliente

| Cliente | Servidor que la impone |
|---|---|
| Oculta el botón si `urlSegura` es `null` | helper, rama Drive (nueva) — espejo probado |
| `type="date"` | helper, `esFechaIso` |
| Mantenedor sólo de la lista | helper, `getClient` |

## Pruebas (`apps/desk/server/equipos.test.ts`, hoy **201** líneas)

Nuevo `describe('Hoja de vida — F1B-02')`. La spec tiene **10** escenarios, no 14.

| # | Prueba | Cubre | Mutación que la pone roja |
|---|---|---|---|
| 1 | POST mínimo → 201, seis vacíos; PATCH `{active}` sigue | RQ-01 E1 | exigir un campo nuevo |
| 2 | POST con los seis → 201, los devuelve + `mantenedorNombre` | RQ-01 E2, RQ-02 | quitar una columna del INSERT |
| 3 | PATCH sólo `codigoInterno` → resto intacto | RQ-02 | `add` incondicional |
| 4 | Fecha `2026/01/01` en POST (0 equipos creados) y `2026-02-30` en PATCH → 422 | RQ-03 | quitar `esFechaIso` |
| 5 | Drive `http://` → 422, no escrito | RQ-04 E1 | quitar la rama Drive |
| 6 | Drive `https://drive.google.com/x" onmouseover="alert(1)` → 422 | RQ-04 E2 | cambiar `urlSegura` por `startsWith` |
| 7 | Mantenedor inexistente → 422 | RQ-05 | saltarse `getClient` |
| 8 | PATCH `{codigoInterno:'X', active:false, driveUrl:'http://x'}` → 422, `codigoInterno` nulo, `active` true | posición (mutación 1) | mover la llamada tras `:89`/`:90` |
| 9 | `INT-001` e `int-001` devuelven el mismo id que `SN-1` | RQ-06 | quitar el `OR` |
| 10 | `/historial` trae los seis; PATCH `driveUrl:''` → nulo | RQ-07 (servidor) | no mapear en `toFull` |

RQ-07 y RQ-08 son `.tsx`, fuera de la red por decisión (F0-00): se comprueban en la aplicación.

## Matriz de amenazas

N/A — sin enrutado de procesos, shell, subprocesos, automatización VCS/PR ni clasificación de ejecutables. (La inyección de atributo de Drive la cubre RQ-HV-04, prueba 6.)

## Migración

Seis columnas nullable, aditivas e idempotentes (`IF NOT EXISTS`); sin backfill (comprobación de persona).

## Cierre obligatorio

Barrido de la regla de mutación 4 sobre `db/equipos.ts`, `routes/equipos.ts`, `types.ts`, `HojaDeVida.tsx`, `EquiposAdmin.tsx` y `equipos.test.ts` (hoy 47 citas `ruta:línea` a `routes/equipos.ts`, `db/equipos.ts` y `equipos.test.ts`, más la forma abreviada; las de `spec.md`/`proposal.md` son **caso B**, se anclan a `ee0ed40`).

## Preguntas abiertas

- Ninguna bloqueante.
