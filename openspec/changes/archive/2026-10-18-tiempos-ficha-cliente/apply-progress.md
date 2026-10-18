# Progreso del apply — `tiempos-ficha-cliente` (F1F-03, `cierra: no`)

Un intento, techo 800, partida `a9052a2`.

## Rojo antes del verde

- `a9052a2` (planificación): 6 pruebas en rojo — cuatro de `ventanaResolucion.test.ts` (la ventana no existía) y las dos de
  `fichaClienteVentana.test.ts` (cuenta/contacto con `ahora` fijo; cuenta sin cierres en la ventana, `null`); 1 de
  caracterización en verde (la del cierre de la migración, de `ventanaResolucion.test.ts`; W2 del verify, corregido en sitio). Vistas en rojo otra vez antes de tocar código.
- Lote 1 (D1, D2, D4): las siete pasan a verde y las existentes de `cierreEnCifras.test.ts` y
  `cierreMigracionEnCifras.test.ts` siguen verdes con `ahora` fijo. 22 de 22 en los cuatro ficheros de prueba.

## Lo hecho

| Fichero | Qué | Líneas |
|---|---|---|
| `packages/shared/src/cierreEnCifras.ts` | docblock y `ahora` obligatorio de `resolucionPromedioMs`; `MESES_VENTANA_RESOLUCION` e `inicioVentanaResolucion` al final del fichero | 57 → 69 |
| `apps/desk/server/db/directory.ts` | `ahora` (por defecto `new Date()`) en `getContactDetail`, `getAccountDetail`, `conResolucion`; comentario de `:66` | 69 → 69 |
| `packages/shared/src/cierreEnCifras.test.ts` | `:67`, `:70`, `:71` con `new Date('2027-01-31T00:00:00Z')` | 73 → 73 |
| `apps/desk/server/cierreMigracionEnCifras.test.ts` | `:68`, `:69`, `:74` ídem | 107 → 107 |
| `apps/desk/src/components/ClienteDetalle.tsx` | `:2`, `:75`, `:123`, `:126`, `:192-194` en sitio (`Sin datos`, `Últimos {MESES_VENTANA_RESOLUCION} meses`) | 223 → 223 |

## Mutaciones (D5), todas restauradas

| # | Resultado |
|---|---|
| M0 control | 22 de 22 en verde |
| M1 sin filtro de fecha | rojo: 3 de `ventanaResolucion.test.ts` (fuera de ventana, límite, sin cierres) y 2 de `fichaClienteVentana.test.ts` |
| M2 `conResolucion` pasa `new Map()` | rojo: 1 de `fichaClienteVentana.test.ts` y 2 de `cierreMigracionEnCifras.test.ts` |
| M3 límite estricto | rojo: `ventanaResolucion.test.ts`, «el límite inferior cuenta» |
| M4 servidor ignora `ahora` | rojo: 2 de `fichaClienteVentana.test.ts` |
| M5 ventana de 7 meses | rojo: 4 de `ventanaResolucion.test.ts` y 2 de `fichaClienteVentana.test.ts` |

Ninguna de M1-M5 sobrevivió. `git diff` sin restos de mutación.

## Cierre del intento

Códigos en el worktree: test 0 (288 ficheros, 4.799 pruebas, 11 omitidas), typecheck 0, lint 0 (165 avisos, los de la
partida). `wc -l`: directory.ts 69, ClienteDetalle.tsx 223, cierreEnCifras.test.ts 73, cierreMigracionEnCifras.test.ts 107.
`git diff --shortstat --no-renames`: 5 ficheros, 34 inserciones, 22 borrados (más apply-progress y tasks).
