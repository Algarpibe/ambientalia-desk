# apply-progress: fecha-cierre-migracion (F1F-01, cierra: no)

Estado: lotes 1, 2 y 3 y cierre técnico HECHOS (4.1 a 4.6). 4.7 (medida del intento) la registra la orquestación al cerrar el intento. Sin commit.

## Rojo / verde por lote
| Lote | Rojo (antes del código) | Verde |
|---|---|---|
| 1 shared | `npx vitest run packages/shared/src/migracionTickets.test.ts` → exit 1, 7 pruebas nuevas caen con `ReferenceError: cierresDeMigracion is not defined` (y su par), 31 pasan | 38/38, exit 0 |
| 2 servidor | `npx vitest run apps/desk/server/db/migracionTicketsAbiertos.test.ts` → exit 1, 5 caen: `seco` (clave `cierres`), y 4 de «fecha de cierre de Entregado»; la de S-4 (Pendiente/identidad) ya pasaba, es regresión | 18/18, exit 0 (la integración `migracionConcurrente` queda skipped: pide base real) |
| 3 reversión | `npx vitest run apps/desk/server/db/migracionTicketsF1F01.test.ts` → exit 1, 4 caen: (a), (i), «una sola sentencia», «e2 vuelve a NULL»; las otras 2 nuevas pasan ya (no tocan closed_time en reglas que no cierran; reversión repetida) | 14/14, exit 0 |

## Mutaciones (todas restauradas; comparadas con copia exacta, `diff` sin salida)
1. **Precedencia** — `cierreDeMigracion`: `return closedTimeZoho !== null` → `return false as boolean` (la migración gana a Zoho). Rojo (exit 1, 4 caen): `cierreDeMigracion > «Entregado» con fecha de Zoho la conserva…`, `precedencia: con fecha de Zoho y con instante, gana Zoho`, `aplicar > el marcador lleva to_status NULL… (migracionTicketsAbiertos.test.ts:85)`, `fecha de cierre… un «Entregado» con closed_time lo conserva y el marcador dice zoho`. Restaurada.
2. **Filtro «sólo la regla que cierra»** — borrada `if (eq.statusTypeDestino !== 'Closed') return null`. Rojo (exit 1, 5 caen): `cierreDeMigracion > las otras tres reglas no cierran`, `aplicar > el marcador lleva to_status NULL… (:80, claves de más en identidad)`, `fecha de cierre… un «Pendiente» y una identidad no tocan closed_time…`, y (a) y (a2) de F1F01. Restaurada.
3a. **Regla 2, quitar la restauración de `.sql:76`** — Rojo (exit 1, 4 caen): `(a) la reversión restaura…`, `(i) no toca modified_time, restaura closed_time sólo en entregado-a-finalizado…`, `la restauración de closed_time aparece en UNA sola sentencia…`, `«e2» … vuelve a NULL`. Restaurada.
3b. **Regla 2, poner además la restauración en `.sql:81`** (regla `pendiente-servicio-a-en-proceso`) — Rojo (exit 1, 3 caen): `(i)…`, `la restauración… UNA sola sentencia…`, `la reversión no toca closed_time en las reglas que no cierran`. Restaurada.

## Regla 13 / mutación 3
`git diff --stat -- apps/desk/src` vacío. El cliente no toma ninguna decisión nueva: sin decisiones nuevas del cliente, no hay espejo que justificar.

## Barrido regla 4 (cero líneas desplazadas)
`git diff -U0` de los 6 ficheros: todos los hunks de en medio son `-N +N` (misma línea, 1 borrada / 1 insertada); lo nuevo está solo al final (`migracionTickets.ts` desde `:114`; `migracionTickets.test.ts` desde `:229`; `migracionTicketsAbiertos.test.ts` desde `:188`; `migracionTicketsF1F01.test.ts` desde `:196`). Ningún `.ts` ni el `.sql` ganan líneas en medio, así que no se renumera ninguna cita ni hace falta el grep de la regla 4. Pendiente de lectura humana (no de esta tanda): lo que AFIRMAN `openspec/config.yaml:4749` y `:4759` (describen el `UPDATE` sin `closed_time`, ahora falso: caso B/C, lo anota quien tenga permiso sobre `config.yaml`) y zoho-sync `spec.md:1381` (lo reescribe el delta).

Una línea del lote 1 se editó en `migracionTickets.test.ts:5` (import) y otra en `migracionTicketsAbiertos.test.ts:45` (tipo del helper `aplicar`, añadido `ahora?: Date`; detectado por `npm run typecheck`, que falló al primer intento con TS2353).

## Códigos de salida (uno por uno)
- `npm test`: 0 (277 ficheros pasan, 3 skipped; 4711 pruebas, 11 skipped). Sin reintento.
- `npm run typecheck`: 0 (tras corregir el tipo de `aplicar` en `:45`; el primer intento dio 2).
- `npm run lint`: 0 (0 errores, 165 avisos previos).
- `npm run build`: 0.
- (extra) `tsx apps/desk/server/citas/cli.ts --sha HEAD`: 0.

## Hipótesis
El cast `::timestamptz` sobre `NULL` se ejecuta en pg-mem, no en PostgreSQL real. La integración `migracionConcurrente` no corre (sin base).

## Medida
`git diff --shortstat --no-renames`: 6 ficheros, 208 inserciones, 21 borrados (~229). Sin ficheros nuevos sin trackear (`apply-progress.md` aparte, documental).
