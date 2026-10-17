---
tanda: F0-04
motivo: ""
capacidad: [reconciliacion]
maestro: ["M11.5"]
cierra: si
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta: cierre de F0-04 por dictamen

## Intención

Gerencia dio F0-04 por cerrada el 2026-09-21 con la pieza de staging retirada (`decision/e013b-copia-pruebas`,
`openspec/config.yaml:1686`): «F0-04 se da por cerrada con esa pieza retirada y con la fecha de la decisión, y el
avance recupera 1» (`openspec/config.yaml:1693-1695`). Su consecuencia (2) dejó el cierre **sin registrar**:
`openspec/changes/F0-04/proposal.md:6` sigue diciendo `cierra: no`, y «hasta que una sesión de construcción lo
cambie citando esta decisión, `npm run reconcile` no contará F0-04 por cabecera» (`openspec/config.yaml:1701-1704`).

Este cambio lo registra **por archivo**, como `cierre-f1b08-con-lo-construido` hizo con F1B-08 el 2026-10-17: un
cambio archivado con `tanda: F0-04` y `cierra: si`. No amplía `cierres_declarados_por_commit` ni RQ-RC-10.

**Es un cambio documental.** No toca código de producción, ni `openspec/specs/`, ni el maestro: el maestro ya lo
recoge en M11.5 (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3503`). Su efecto
medible es que, archivado, F0-04 pasa de «en curso» a «cerradas por archivo» en `docs/sdd/RECONCILIACION.md`.

## Qué pide la fila, medido

La fila de la R01.1 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:128`) pide tres contenidos, y la de la
R01.4 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:68`) ya la titula «Pruebas del motor y CI (staging
retirado)»:

| Contenido | Estado | Evidencia |
|---|---|---|
| Pruebas del motor donde F0-00 detectó huecos | Hecho | Matriz área × transición contra el servidor (`apps/desk/server/permisos.test.ts:41`); las transiciones ejecutadas con su estado destino y su traza (`apps/desk/server/transicionesEjecucion.test.ts:188`); `Finalizado` único terminal (`packages/shared/src/invariantesGrafo.test.ts:62`, `:177`) |
| Staging sobre la VPS con PostgreSQL | **Retirado por dictamen** | `decision/e013b-copia-pruebas`, consecuencia (1) (`openspec/config.yaml:1697-1700`); tachado en `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:128` |
| CI con `test`, `typecheck` y `lint` | Hecho | `.github/workflows/ci.yml:27`, `:41`, `:45`, en cada `push` y `pull_request` a `main` (`:2-6`) |

`openspec/changes/F0-04/proposal.md:16` declaraba exactamente eso: «dos de los tres contenidos de su fila están
verificados; falta constancia de staging». **No queda nada de la fila sin hacer salvo la pieza retirada.**

## Forma elegida: un cambio nuevo, y `F0-04/` se queda como está

Dos razones, las dos medidas:

1. **Mover `openspec/changes/F0-04/` rompería citas que esta tanda no puede reparar.** Hay citas a
   `openspec/changes/F0-04/proposal.md` en quince ficheros del repositorio, cinco de ellas en `openspec/config.yaml`
   —entre ellas la propia decisión—, que es fichero de Supervisión. Archivar la carpeta cambia su ruta.
2. **El barrido ya resuelve el caso sin tocar la carpeta vieja.** Una tanda con algún `proposal.md` archivado y
   `cierra: si` entra en «cerradas por archivo» y sale de «en curso», aunque exista otra cabecera suya sin archivar
   (`apps/desk/server/reconciliacion/comprobaciones.ts:217`, `:222-224`). Es el caso de F1B-08, con cinco cambios
   `cierra: no` archivados.

**R-4:** al terminar habrá un solo cambio archivado con `tanda: F0-04` y `cierra: si`: éste. `F0-04/proposal.md`
conserva su `cierra: no`, que es cierto de su fecha (caso B de la regla de mutación 4).

## Alcance

- Esta propuesta y su `tasks.md`; `verify-report.md` y `archive-report.md` al cerrar.
- `apps/desk/server/reconciliacion/registro.test.ts:218-221`: el recuento real pasa a SIETE en curso, sin F0-04;
  corregido en sitio, sin mover líneas, después de verlo en rojo.
- `docs/sdd/RECONCILIACION.md` regenerada.

**Fuera:** `openspec/changes/F0-04/`, código de producción, `openspec/specs/`, el maestro y los ficheros de
Supervisión (la fila del plan R01.4 y la consecuencia (2) de la decisión los actualiza Supervisión).
