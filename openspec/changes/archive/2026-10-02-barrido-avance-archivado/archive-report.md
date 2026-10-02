# Archive report: barrido-avance-archivado

Cambio `barrido-avance-archivado` (`tanda: fuera-del-plan`, `cierra: no`). Modo `hybrid`, lotes 1-2 verificados con result PASS (+WARNING).

## Cambio registrado

**Comprobación 2 del barrido:** cuenta sólo lo archivado (archivos con `cierra: si` + declaradas por commit con `id`, `commit` y `prueba`), publica aparte «en curso» sin sumarlo, lee el §C de la R01.4 (denominador 78) en vez del §5 de la R01.1, y marca «sin fuente» leyendo sólo de la R01.1.

**Lote 1** (fases 1-6, `7f99f07`..`4ca245c`): código + pruebas + YAML F0-01..03 + delta spec. **Lote 2** (`51ae313`): seis bloques de commit más en el YAML (F0-00, F1A-01..02, F1A-04..05, F1B-01) y actualizar RQ-RC-10 de la spec.

## Verificación

| Fase | Resultado |
|---|---|
| Lote 1 (apply `7f99f07`) | verify `4ca245c`: **PASS WITH WARNINGS** (0 CRITICAL · 3 WARNING · 2 SUGGESTION) |
| Lote 2 (apply `51ae313`) | verify `4ca245c`: **PASS** (73/73 tests · lint 165 · npm run reconcile 10/9/6·78, seis en curso, sin defectos) |

**Nota de método:** `apply-progress.md:45` dice «41 tareas»; hay 30 casillas en `tasks.md`. Cifra errónea, sin impacto en el trabajo. Barrido de citas: 13 citas de `comprobaciones.ts` ancladas en `840a353`, todas verificadas contra el árbol.

## Tareas completadas

- **Fase 1 (RED):** 12 casillas — propuestas + pruebas sintéticas
- **Fase 2 (GREEN):** 5 casillas — código de comprobaciones
- **Fase 3 (YAML):** 5 casillas — config real, orden de precedencia
- **Fases 4-6 (informe, barrido, spec):** 12 casillas — regenerar informe, comprobación final, citas, spec

**Total:** 44 casillas (30 de fases 1-6 + 14 de lote 2 desglosado) marcadas, ninguna pendiente.

## Cifras del cambio

| Métrica | Valor |
|---|---|
| Cierres por archivo (R01.4 §C) | 10 |
| Cierres declarados por commit | 9 (F0-00..03, F1A-01..02, F1A-04..05, F1B-01) |
| En curso | 6 (F0-04, F1B-04, F1B-07, F1B-08, F1B-11, F1C-05) |
| Denominador (R01.4 §C) | 78 |
| Requisitos modificados | 3 (RQ-RC-01, -05, -06) |
| Requisitos añadidos | 3 (RQ-RC-10, -11, -12) |
| Escenarios cubiertos | 28/28 — todas sus pruebas en verde |

## Supuesto D8

RQ-RC-12 —si el §C no se encuentra— **informa con hallazgo sin cambiar el exit code**. Inicialmente RQ-RC-12 decía «fallar con mensaje explícito»; spec y diseño se contradicen. **Decidido en apply-progress.md:44:** que informe sin alterar el exit (coherente con RQ-RC-03, que deja que la comprobación 2 reporte sin bloquear). Spec actualizada, prueba sintética y real pasan.

## Declaración de cobertura de fila

`fuera-del-plan` con motivo escrito — no hay fila que cerrar. El cambio es ajuste de comprobación 2 por decisión de Gerencia (avance cuenta sólo lo archivado, orden de ejecución y escenario A del plan).

## Medida de líneas (regla del ciclo 2)

| Componente | Revisable | Total |
|---|---|---|
| `openspec/specs/reconciliacion/spec.md` (fusión del delta) | 144 | — |
| `archive-report.md` | 58 | — |
| **Revisable (PASO 1)** | **≤200 (dentro de 600)** | — |
| Carpeta archivada + movimiento `git mv` | — | ≈1.100 × 2 - 440 = **1.760** |
| **Total (PASO 2)** | — | **≤3.000 (aprobado)** |

Sin ficheros binarios. Medida real tras commit:  `git diff --cached --shortstat --no-renames`.

