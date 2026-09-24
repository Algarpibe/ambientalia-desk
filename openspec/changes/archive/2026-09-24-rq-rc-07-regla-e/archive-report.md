# Informe de archivo: rq-rc-07-regla-e

**Archivado el 2026-09-24** · base `7e71eb8` (CI: success) · veredicto de verify: **pass** (re-verificación
tras remediación) · RDD apagado: archivo bajo la política ordinaria del repositorio.

## Cabecera R-1 (literal de `proposal.md`)

    tanda: fuera-del-plan
    motivo: "Realinear RQ-RC-07 y su prueba con la regla (e) de unidad_de_avance, que entró por la decisión de Gerencia decision/e001-por-entregar del 24/09; main está roja desde be78ef9"
    capacidad: [reconciliacion]
    maestro: []
    cierra: no
    toca_maestro: no
    origen_cabecera: declarada

**Qué cubrió y qué dejó fuera (R-1):** realineó el requisito `RQ-RC-07` y `registro.test.ts` con la regla (e)
que ya estaba en `openspec/config.yaml` (`unidad_de_avance.reglas_de_lectura`); no realiza contenido de
ninguna fila del §5 del plan y no deja nada fuera de su propio alcance.

## Qué se entregó

| Commit | Qué |
|---|---|
| `cce1c57` | Propuesta, delta spec, diseño y tareas |
| `5ce8e2c` | `registro.test.ts`: ids `a`-`e`; M3 acotada al siguiente `- id:` (borra sólo la (d) y espera `a, b, c, e`); cuatro pruebas al final del fichero para los escenarios de (d) y (e), con su control del otro signo |
| `7e71eb8` | Citas del `verify-report.md` separadas: el detector leía «`:96/:101/:108`» como ruta de fichero |

`main` estaba roja en CI desde `be78ef9` y volvió a verde con `7e71eb8`.

## Recorrido del ciclo

1. **Apply** (14 tareas, strict TDD): rojo heredado medido en `registro.test.ts:49`; rojo real de M3
   capturado con la regex sin acotar (`['a','b','c']` frente a `['a','b','c','e']`); verde al acotarla.
2. **Verify 1: fail**, con dos CRITICAL: los escenarios «un cierre por dictamen se distingue de uno por
   trabajo» y «un cambio que realiza contenido de dos filas lleva un único `tanda:`» no tenían prueba.
3. **Remediación** (8 tareas): las pruebas se añadieron **después de la última línea** del fichero, de
   modo que las líneas 96, 101 y 108, citadas desde otros artefactos, no se desplazaron.
4. **Verify 2: pass**, 3/3 escenarios cubiertos; suite completa 1292 verdes, typecheck y lint (165) exit 0.

## Fusión en la spec viva

`openspec/specs/reconciliacion/spec.md`: el bloque de `RQ-RC-07` (cabecera en la línea 225, idéntica en la
delta para que el MODIFIED case) se sustituyó por el de la delta: +32/−6. El requisito siguiente, `RQ-RC-08`,
pasa de la línea 244 a la 270.

**Citas desplazadas por la fusión:** las únicas citas `reconciliacion/spec.md:NNNN` posteriores a la 225 están
en carpetas de `openspec/changes/archive/` (`2026-09-20-F0-05/tasks.md`, líneas 90 y 189, y
`2026-09-22-fechas-derivadas-servidor/apply-progress.md`, línea 292, todas a la 281). Son registros fechados,
el detector no vigila `archive/` (E-032) y no se reparan aquí; leídas contra la revisión en que se
escribieron siguen siendo ciertas.

## Coste en el ledger

Presupuesto adquirido: **1800**, no 800, porque el ledger mide sin detección de renombrados y el `git mv`
cuenta dos veces. Medido: `git diff HEAD --shortstat --no-renames` = 678 inserciones y 652 borrados
(1330), de los que 1292 son el `git mv` de 646 líneas sin cambiar un byte; lo revisable es la fusión (+32/−6)
y este informe.
