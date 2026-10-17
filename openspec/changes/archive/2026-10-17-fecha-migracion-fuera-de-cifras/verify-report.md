# Verify — `fecha-migracion-fuera-de-cifras` (F1F-01, `cierra: no`)

**Veredicto: PASS** · 0 críticos · 0 avisos · 1 sugerencia. Verificado sobre `5f3d036` por el orquestador, leyendo el código y
corriendo los códigos.

## Escenarios de RQ-TC-69 frente a sus pruebas

| Escenario | Prueba | Resultado |
|---|---|---|
| Análisis no cuenta el cierre puesto por la migración (y la fecha sigue en la base) | `apps/desk/server/cierreMigracionEnCifras.test.ts:48` | verde |
| Análisis sí cuenta la fecha de Zoho de un migrado | `:48` (ticket `z`, `finalizados` = 2) | verde |
| Un cierre posterior distinto del de la migración cuenta | `packages/shared/src/cierreEnCifras.test.ts:39` | verde |
| La ficha de cliente recibe la media sin el cierre de la migración | `cierreMigracionEnCifras.test.ts:63` y `:71` | verde |
| El informe de contrato no fecha por el marcador; con «zoho» fecha con la de Zoho | `cierreMigracionEnCifras.test.ts:87` | verde |
| El marcador no vuelve «reentrante» falso | `cierreMigracionEnCifras.test.ts:100` y `apps/desk/server/migracionMarcadorLectores.test.ts:54` | verde |

Fronteras de la regla pura (`packages/shared/src/cierreEnCifras.test.ts:21`, `:26`, `:35`, `:48`, `:53`, `:60`, `:69`): igualdad
exacta de `cierre_origen`, `values` que no es objeto, mismo instante en otro formato ISO, y el marcador de identidad.

## Diseño frente a código

| Diseño | Código | Conforme |
|---|---|---|
| §1 criterio en shared | `packages/shared/src/cierreEnCifras.ts`, exportado al final de `index.ts` | sí |
| §2 lectura aparte | `apps/desk/server/db/cierresDeMigracion.ts` | sí |
| §3 Análisis | `apps/desk/server/analisis.ts:22` (`Promise.all`) y `:26` (`cierreQueCuenta`) | sí |
| §3 ficha de cliente | `apps/desk/server/db/directory.ts:67-68` (`conResolucion`); el `.tsx` ya no lee `closedAt` ni promedia | sí |
| §3 informe de contrato | `apps/desk/server/db/informeContrato.ts:35` (`llegadaQueCuenta`) | sí |
| §3 indicadores | `apps/desk/server/indicadores.ts:81` (salta el marcador) | sí |
| §3 sin líneas insertadas en los muy citados | `git diff --numstat 9c14a7f`: inserciones = borrados salvo `directory.ts` (al final) e `index.ts` (línea final) | sí |
| `packages/shared/src/indicadores.ts` no se toca | sin diff | sí |

Regla invariable 13: ninguna decisión de qué cuenta vive en el `.tsx` (tabla de la regla de mutación 3 en `apply-progress.md`).
E-207 en pie: `cierreMigracionEnCifras.test.ts:48` comprueba que `closed_time` sigue en la base.

## Tareas

1.1 a 2.6, 3.1 y 3.2 hechas, con su evidencia en `apply-progress.md`. 3.3 es este informe. 3.4 es el archivo. P-1 a P-3 son de
personas y archivar no las da por hechas.

## Códigos (sobre `5f3d036`)

test 0 (4.764 pasan, 11 omitidas), typecheck 0, lint 0 (165 avisos, el máximo), build 0, detector `--sha HEAD` 0.

## Sugerencia

S-1: el «mismo instante» se compara en milisegundos. Si un día el sincronizador reescribiera `closed_time` de un migrado con otra
precisión, dejaría de reconocerse. Hoy no ocurre: `upsertTicket` no toca filas con `managed_by_app = true`
(`packages/zoho-sync/src/db/repo.ts:71`) y la migración las marca así.
