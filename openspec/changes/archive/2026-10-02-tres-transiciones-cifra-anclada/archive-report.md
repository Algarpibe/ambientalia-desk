# Archivo — F1C-09 `tres-transiciones-cifra-anclada` (cierra: si)

## Cobertura de fila

F1C-09 (R01.4 §C/§E, maestro R08.4) cierra: **31 transiciones, 35 pasos, 20 estados de servicio**. Retira `marcar_pendiente`, `servicio_externo_pendiente`, `servicio_externo_notificado`; `diagnostico_complementario` cambia de `Pendiente` a `En Proceso`; `Pendiente` pasa a soporte remoto. Cifras ancladas en `config.yaml`. Migración `Pendiente→En Proceso` escrita y probada en pg-mem (no ejecutada — tarea de Alfonso).

## Merges

Cinco specs vivas fusionadas: deltas ADDED (RQ-TS-23..29, RQ-MB-07, RQ-SR-12) y MODIFIED (RQ-TS-01/04/05/07/11/12/20, RQ-MB-02, RQ-PM-03, RQ-SR-05/06, RQ-AV-01/02) aplicados en `openspec/specs/`. Requisitos con formato "Requirement:" en encabezado convertidos a formato principal. 414 inserciones, 135 deletions en specs vivas.

## Verify

**PASS WITH WARNINGS** (commit `011f6ea`): 0 CRITICAL, 4 WARNING, 3 SUGGESTION.
- npm test: 2416 verdes / 2 saltadas (sin cambios; tests.ts fuera del árbol)
- typecheck, lint 165 (0 errores), build, mapa regenerado limpio
- Detector citas: 0 bloqueantes al cierre
- 22 requisitos / 68 escenarios cubiertos
- Cifras ancladas 31/35/20 ✓

Mutaciones reproducidas: revert `marcar_pendiente` = 28 rojos (7 ficheros); script UPDATE antes INSERT = 3 rojos; ambas revertidas.

## Migración (NO ejecutada; tarea de persona)

`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql`: escrita, probada pg-mem, idiopotente, con reversión. Recuento previo en 3 grupos (servicio `managed_by_app=true` / servicio Zoho / soporte remoto). Tabla calificada por esquema. Registra marcador `ov_elegida_en_app_at` (F1B-11 asociacion-ov-ticket).

Tareas de persona SIN marcar como hechas al archivar:
- **P-1 (Gerencia)**: Tickets servicio en `Pendiente` gobernados por Zoho (¿mover en Zoho o mapear F1F-01?). Supuesto: F1F-01.
- **Alfonso**: Recuento previo, ejecución + migración, verificación en app tras desplegar.

## Cifras

| Métrica | Valor |
|---------|-------|
| Transiciones | 31 (antes 34) |
| Pasos mapa | 35 (antes 38) |
| Estados servicio | 20 (antes 21) |
| Unión ids 3 catálogos | 41 (antes 44) |
| Permisos (área) | 93 · 54/39 (antes 102 · 60/42) |
| Reentrancia C2 | 8 estados (antes 9) |
| Fases | 4·11·5 (antes 4·12·5) |

## Reconcile

Registro.test.ts: `:220` espera "en curso" = SEIS (`['F0-04','F1B-04','F1B-07','F1B-08','F1B-11','F1C-05']`) sin F1C-09. `npm run reconcile` registra 11 por archivo, 9 por commit, 6 en curso, denominador 78.

Todos los tests pasan: 2416 verdes, 2 saltadas.

Observaciones Engram (artifacts de precedencia):
- #1268 sdd/tres-transiciones-cifra-anclada/proposal
- #1269 sdd/tres-transiciones-cifra-anclada/spec
- #1270 sdd/tres-transiciones-cifra-anclada/design
- #1271 sdd/tres-transiciones-cifra-anclada/tasks
- #1273 sdd/tres-transiciones-cifra-anclada/verify-report
