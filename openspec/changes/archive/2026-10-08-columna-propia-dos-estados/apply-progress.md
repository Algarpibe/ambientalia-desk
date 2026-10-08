# apply-progress: columna-propia-dos-estados (lote único, 16 de 16 casillas)

## Qué se hizo
- `packages/shared/src/columns.ts:15` y `:20`: `solicitud_soporte` y `verificacion` en la misma línea física (texto exacto de D1). El fichero sigue en 47 líneas.
- `packages/shared/src/columns.test.ts`: import de `ESTADOS` en `:2`, dos ids en `:7-8`, y al final `COLUMNA_ANTES` + `describe` (a)-(f). Pasa de 40 a 57 líneas; `:1-40` en su posición.
- `packages/shared/src/flujos.test.ts:125-128` y `:204-206` invertidas en sitio (258 líneas).

## Evidencia TDD
Rojo (sin tocar `columns.ts`): 6 fallos, 59 verdes. Coincide con D5.
- `columns > define las columnas del Blueprint…` (lista de ids, 21 frente a 23)
- `(b) sólo esos dos estados cambian de columna` (recibe `[]`)
- `(c) sus columnas son verificacion y solicitud_soporte…` (recibe `'otros'`)
- `(e) el único estado del registro que cae en otros es Finalizado` (recibe `['Finalizado','Verificación','Solicitud Soporte']`)
- `flujos > RQ-EN-07 (tablero) · Verificación tiene columna propia`
- `flujos > S-10 INVERTIDA · Solicitud Soporte tiene columna propia`
(a), (d), (f) nacieron verdes, como predice D5. Verde: 65/65 en las dos suites.

## Mutaciones (una a una, restauradas; `cmp` contra la copia verde)
| # | Mutación | Pruebas rojas |
|---|---|---|
| M1 | quitar `verificacion` | lista de ids; (b); (c); (e); `flujos` RQ-EN-07 Verificación |
| M2 | quitar `solicitud_soporte` | lista de ids; (b); (c); (e); `flujos` S-10 INVERTIDA |
| M3 | `verificacion` movida tras `solicitado` | SÓLO la lista de ids |
| M4 | `'Pendiente'` en `statuses` de `verificacion` | (c) y (f); (b) NO |
Los resultados de M1 y M2 incluyen además (e), que D6 no listaba (es coherente: al quitar la columna el estado cae en `otros`).

## Códigos de salida (cada uno por separado)
- `npm test`: 0 (259 ficheros pasan, 2 saltados; 4257 pasan, 7 saltadas)
- `npm run typecheck`: 0
- `npm run lint`: 0 (165 avisos, 0 errores; confirma que no hay `max-len`)
- `tsx apps/desk/server/citas/cli.ts --sha HEAD`: 0

## Barrido de citas (3.8)
`wc -l`: `columns.ts` 47, `flujos.test.ts` 258. Las citas `columns.ts:N` del repositorio (`:4-5`, `:27`, `:29`, `:34`, `:38`, `:40-42`, `:45-47`) apuntan a líneas no desplazadas. Las de `flujos.test.ts` (`:125-126`, `:204-205`, `:42-45`) siguen existiendo; las dos primeras tienen texto que ya no es cierto (traspaso a Supervisión, ver tasks). Segundo pase de abreviadas: no ejecutado.

## Medida del intento (3.9)
`git diff --shortstat` (con renombrados): 3 ficheros, +27/-10. `--no-renames` y `wc -l` de lo nuevo: no ejecutado, lo mide el orquestador. Sin ficheros bajo `apps/desk/src`.

## Desviaciones
Ninguna de diseño. Sin Python en la máquina: las ediciones se hicieron con un script de node (conserva CRLF).
