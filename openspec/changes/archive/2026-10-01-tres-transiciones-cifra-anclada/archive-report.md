# Informe de archivo — `tres-transiciones-cifra-anclada` (F1C-09, `cierra: si`)

Archivado en `openspec/changes/archive/2026-10-01-tres-transiciones-cifra-anclada/`.

## Cobertura de la fila (sostiene `cierra: si`)

Cubre todo el contenido de F1C-09 (R01.4 §C y §E; `decision/tres-transiciones-y-la-cifra-anclada`) en una sola entrega:
retira «Marcar como pendiente» y las dos «Servicio externo» hacia Por Facturar, «Diagnóstico complementario» sale de
«En Proceso», el mapa se regenera y las cifras ancladas pasan a 31 transiciones, 35 pasos y 20 estados de servicio. La
migración de los tickets de servicio en «Pendiente» queda **escrita y probada, sin ejecutar**: ejecutarla es tarea de
persona (regla del ciclo 1), y archivar no la da por hecha.

## Commits

| Qué | Commit |
|---|---|
| Planificación | `fd253aa` |
| Lote A · catálogo, estados, mapa, cifras ancladas y guardianes | `ad1aaa0` |
| Lote B · script de migración, su prueba en pg-mem y barrido de citas | `42f591e` |
| Verify (PASS WITH WARNINGS) | `011f6ea` |
| Archivo | el commit que contiene este informe y el siguiente |

## Cifras nuevas

| Cifra | Antes → después |
|---|---|
| Transiciones de servicio | 34 → **31** |
| Pasos del mapa | 38 → **35** |
| Estados de servicio | 21 → **20** («Pendiente» pasa a sólo soporte remoto) |
| Unión de ids de los tres catálogos | 44 → **41** |
| Matriz de permisos por área | 102 → **93** (54 prohibidos / 39 permitidos; 55/38 con la compuesta); 744 casos de cargo |
| Fases del mapa | 4·12·5 → **4·11·5** |

«Finalizado» sigue siendo el único estado terminal. Las tres ids retiradas responden `400` «Transición desconocida».

## Verify: PASS WITH WARNINGS (0 CRITICAL)

WARNING, que quedan como seguimiento:
1. El predicado del script (`LIKE '%soporte%remoto%'`) es más amplio que la igualdad normalizada de la aplicación
   (`packages/shared/src/flujos.ts:116-119`): no mueve de más, pero puede dejar en «Pendiente» un ticket con una
   clasificación inesperada. El paso 1 del script lista las clasificaciones; hay que leerlo antes de ejecutar.
2. `apps/desk/server/reconciliacion/registro.test.ts` dependía del estado transitorio del árbol: **resuelto en el
   archivo**, «en curso» vuelve a seis.
3. La reversión comentada borra todas las filas marcador, también las de tickets con transiciones posteriores.
4. El script no se ha ejecutado nunca contra PostgreSQL real; pg-mem no admite varias de sus sentencias y se probó por
   sentencias.

SUGGESTION: (1) la cita de RQ-TS-28 a `flujos.ts` apuntaba a `flujoDelTicket`: **corregida en el archivo** (caso A,
a `:116-119`); (2) `docs/artefactos/blueprintserviciotecnico.html` (líneas 765 y 770-771) sigue pintando las tres
transiciones retiradas y nada lo genera ni lo vigila: **sin destino, señalado**; (3) el validador nativo
`gentle-ai sdd-verify-validate` no se ejecutó.

## Migración — escrita, probada en pg-mem, SIN EJECUTAR

`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql`: calificada por esquema, en `BEGIN`/`COMMIT`, recuento previo de
sólo lectura en tres grupos (servicio gobernado por la app · servicio gobernado por Zoho, sólo listado · soporte remoto),
mueve sólo `managed_by_app = true`, idempotente. Por cada ticket inserta una fila de traza en `desk.ticket_transitions`
con `transition_id = 'migracion_f1c09_pendiente'` (antes del `UPDATE`) y no reescribe ninguna fila existente. Nada
del arranque ni de `migrate.ts` la invoca.

## Tareas de persona — archivar NO las da por hechas

| Tarea | Dueño | Nota |
|---|---|---|
| P-1 · Qué pasa con los tickets de servicio en «Pendiente» que gobierna Zoho | Gerencia | Supuesto mientras no conteste: los mueve F1F-01 el 14/12 |
| Recuento previo y ejecución del script | Alfonso | Desplegar y migrar **en el mismo corte**: entre ambos, un ticket de servicio en «Pendiente» se queda sin transiciones. Leer antes el listado de clasificaciones del paso 1 |
| Verificación en la app tras desplegar | Alfonso / Servicio Técnico | — |

## Specs fusionadas

Cinco specs vivas: `transitions-st` (RQ-TS-23..29 añadidos; RQ-TS-01, 04, 05, 07, 11, 12 y 20 modificados),
`mapa-blueprint` (RQ-MB-07; RQ-MB-02), `permissions` (RQ-PM-03), `transitions-soporte-remoto` (RQ-SR-12; RQ-SR-05 y 06)
y `derivacion-avisos` (RQ-AV-01 y 02). Los dos escenarios nuevos de RQ-TS-01 van **al final** de `transitions-st` bajo
su propio encabezado, para no desplazar las citas a ese fichero.

*Nota de procedencia:* el agente de archivo falló dos veces. El primer intento borró contenido de más en
`transitions-st` (+102/−293), dejó requisitos sin fusionar y el detector de citas en rojo; se deshizo antes de
publicarlo. El segundo dejó sin cuerpo RQ-MB-07 y RQ-SR-12, sin los dos escenarios nuevos de RQ-TS-01, la carpeta
partida en dos fechas y un informe con un dato falso (atribuía a la migración un marcador de F1B-11). Lo completó y
corrigió el orquestador, comprobando línea a línea que el texto de los 22 requisitos del delta está en las specs vivas.

## Medida (Regla del archivo)

Parte con carga de revisión —fusión en las cinco specs vivas más este informe—: por debajo de 800 (cifra exacta en el
`settle` del intento de archivo). Total con la mudanza de carpetas: por debajo del techo del intento (4.500).
`npm run reconcile`: **11** por archivo · **9** por commit declarado · **6** en curso · denominador **78**.
