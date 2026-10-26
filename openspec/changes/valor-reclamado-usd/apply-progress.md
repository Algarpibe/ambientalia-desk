# apply-progress — `valor-reclamado-usd` (F1B-13, `cierra: no`) — lote L1

Estado: L1.1 a L1.10 hechas; L1.c es del orquestador. Modo `strict_tdd`. Worktree `C:\dev\Desk_2_R1.023-worktrees\valor-reclamado-usd`, partida `c6147860`.

## L1.1 Línea base (antes de editar)
`garantiaProveedor.test.ts` (27), `medicionGarantias.test.ts` (25) y `routes/medicionGarantias.test.ts` (12): 3 ficheros, 64 pruebas, verdes.

## L1.5 Rojos (cada uno por la causa esperada)
| Fichero | Prueba | Aserción | Causa del rojo |
|---|---|---|---|
| `packages/shared/src/valorReclamado.test.ts` | todo el fichero (22 pruebas) | la importación `./valorReclamado` | el módulo no existe (`Cannot find module`) |
| `packages/shared/src/medicionGarantias.test.ts` | «cada grupo trae moneda USD y el cociente no lleva moneda» | `expect(g.moneda).toBe('USD')` | `expected undefined to be 'USD'`: el grupo no trae `moneda` |
| `packages/shared/src/medicionGarantias.test.ts` | «CARACTERIZACIÓN: sumas, recuentos y orden idénticos; sólo se añade moneda» | `every(g => g.moneda === 'USD')` y `toEqual` con `moneda` | `expected false to be true`: sin `moneda` en el grupo |
| `apps/desk/server/routes/medicionGarantias.test.ts` | «cada grupo trae moneda USD y la ruta devuelve exactamente lo de shared» | `expect(g.moneda).toBe('USD')` | `expected undefined to be 'USD'`: la ruta devuelve lo de `shared`, que aún no pone `moneda` |

Las pruebas de `valorReclamado.test.ts` cubren: constantes y `SIN_FOTO`; `lineasDeLaOVI` (objeto, texto JSON, `null` por raw inválido, `line_items` ausente/vacía/no lista, sin `item_id`, cantidad 0/negativa/no finita/`'2'`); `fotoValorReclamado` (311,08; repetido = 40; 3 × 0,004 = 0,01; ausente/0/null/negativo/no finito → `SIN_FOTO`; nunca parcial); `origenTrasEditar` (los cinco casos de S-5); `etiquetaOrigenValor` (S-7).

## L1.6-L1.8 Verde
- `garantiaProveedor.ts`: `:36` en sitio (texto exacto de §4, una línea; `:37` sigue siendo `ORIGEN_VALOR_MANUAL`); cuatro líneas al final (`:193-196`, tras una línea en blanco en `:192`).
- `valorReclamado.ts` nuevo (88 líneas) y `index.ts:55` (una línea tras `:54`).
- `medicionGarantias.ts`: `:1` (importación), `:26` (`moneda: MonedaGarantiaProveedor`), `:63` (`moneda: MONEDA_GARANTIA_PROVEEDOR`). **Desvío de numeración del diseño:** §4 dice `:62`; la línea real del grupo nuevo que lleva `cociente: null,` es la `:63` (la `:62` es la de `fabricante:`). Se editó la `:63`, sin cambio de longitud del fichero.
- No hizo falta tocar `medicionGarantias.test.ts:15`: el constructor de la prueba construye `GarantiaProveedor`, no `MedicionFabricante`; el `moneda` de `GarantiaProveedor` es de L2.
- Verde: 4 ficheros, 89 pruebas.

## L1.9 Mutaciones
**M0** (suite entera sin mutar): `npm test`, exit 0, 323 ficheros pasan (4 omitidos), 5614 pruebas pasan (26 omitidas). Log: `C:/Users/algar/AppData/Local/Temp/claude/C--dev-Desk-2-R1-023/95fc3dd4-3b2b-4c44-9739-47b28e322b7d/scratchpad/npmtest-vru-l1-m0-1216.log`.

| Mut. | Cambio | Cae | Aserción |
|---|---|---|---|
| (a) | `suma += costo` (sin `cantidad`) | `valorReclamado.test.ts` «2 × 150,54 + 1 × 10 = 311,08» | `expected { valorReclamado: 160.54 } to deeply equal { valorReclamado: 311.08 }` |
| (f) | saltar la línea sin costo (`continue`, suma parcial) | «un artículo ausente del mapa o con costo 0 da SIN_FOTO…» y «costo null, negativo o no finito da SIN_FOTO» | `valorReclamado: 100` en vez de `null`; `+0` en vez de `null` |
| (i) | redondear por línea | «el redondeo es uno solo… 0,01» | `expected +0 to be 0.01` |
| (d2) | quitar `moneda` del grupo (`medicionGarantias.ts:63`) | las tres de moneda: dos de `shared` y la de la ruta | `expected undefined to be 'USD'` (x2) y el `toEqual` del grupo |

Cada mutación se restauró desde copia (`cmp` idéntico) y la suite del lote volvió a verde (62 pruebas en los tres ficheros afectados). Ninguna queda en el árbol.

## Cierre del lote (cifras del aplicador)
- `npm run typecheck`: 0. `npm run lint -- --max-warnings 165`: 0 errores, **165** avisos (sin holgura, igual que `main`).
- Colocación (regla de mutación 4): `git diff -U0` — todos los hunks de ficheros existentes son `-N +N` (misma cuenta) o se añaden al final: `garantiaProveedor.ts` `-36 +36` y `+192,5` al final; `index.ts` `+55`; `medicionGarantias.ts` `-1 +1`, `-26 +26`, `-63 +63`; las dos pruebas, al final. Ninguna línea existente cambió de número.
- Medida ingenua (L1.10): `git diff --shortstat --no-renames` 53 inserciones y 4 borrados en 5 ficheros + nuevos sin trackear (`valorReclamado.ts` 88, `valorReclamado.test.ts` 116) = ~261. Bajo ~400; no hay aviso de división. Este `apply-progress.md` y el informe suman aparte.
