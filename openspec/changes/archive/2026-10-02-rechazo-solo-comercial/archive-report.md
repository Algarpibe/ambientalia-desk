# Archivo: Rechazo solo Comercial (F1C-10)

## Cobertura de la fila F1C-10

F1C-10 (plan R01.4, §5 y E-114 en ENTRADA.md:1460-1464) cierra íntegramente: `rechazo_cliente` (transición que sale de Notificación cliente hacia Por Facturar) pasa de área `Comercial / Servicio Técnico` a área simple `Comercial` (maestro R08.4.md:1616, :1945). Conseguencias: matriz 55/38 (compuesta 56/37), invariante 5 con siete compartidas en lugar de ocho, aviso por área S-1, y mapa regenerado con [C] en lugar de [C][ST] para las tres aristas.

**Cierra: sí**. No quedan desvíos abiertos de esta fila.

## Commits

Cambio trackeado en el worktree C:\dev\Desk_2_R1.023-worktrees\rechazo-solo-comercial:
- Planificación: `06d1fa1` (proposal, spec, design, tasks)
- Apply: `2277e3e` (cambios en el catálogo y pruebas), `8bae67a` (fixture anti-desfase de mapa)
- Verify: `4984c3b` (PASS WITH WARNINGS: 0 CRITICAL, 5 WARNING, 3 SUGGESTION)

## Verify: Estado Final

Origen: `verify-report` (obs. #1282, 2026-10-02 06:00:44).

- **Suite**: `npm test` 2424 verdes, 2 omitidos
- **Tipos**: `npm run typecheck` verde
- **Lint**: `npm run lint` 165 avisos (techo)
- **Build**: `npm run build` verde
- **Detector de citas**: 0 bloqueantes

**Matriz de requisitos y escenarios** (5 requisitos, 32 escenarios):
- permissions: RQ-PM-03 (10 escenarios, todos verdes)
- transitions-st: RQ-TS-07 (7 escenarios), RQ-TS-23 (5 escenarios), RQ-TS-30 (8 escenarios), RQ-TS-31 (3 escenarios) = 23 escenarios, todos verdes

**Mutaciones reproducidas y revertidas** (regla de mutación 3):
- M-1 revertir :236 → rojo en 55/38, 56/37, invariante 5, 403, areasSiguientes, mapa
- M-2a :234 a Comercial → rojo en invariante 5 (seis)
- M-2b :238 a Comercial → rojo en 200 de Servicio Técnico
- M-3 escribir [C][ST] a mano en los 3 .md → rojo en anti-desfase
- M-4 restaurar rechazo_cliente en :103 → rojo en invariante 5

## Fusión de deltas en specs vivas

### permissions/spec.md · MODIFIED RQ-PM-03

- Cifras: 55 prohibidos / 38 permitidos (antes 54/39)
- Escenarios nuevos: «la matriz compuesta sin cargo reparte 56 y 37», «Servicio Técnico recibe 403 en rechazo_cliente», «Comercial y administrador ejecutan rechazo_cliente», «las otras dos Rechazo siguen admitiendo a Servicio Técnico», «mutación — devolver rechazo_cliente a Comercial / Servicio Técnico pone la matriz en rojo»
- Notas: Conservadas con revisión F1C-09 (caso B)

Impacto: 179 inserciones, 20 borrados en los dos ficheros fusionados.

### transitions-st/spec.md · MODIFIED RQ-TS-07, RQ-TS-23 · ADDED RQ-TS-30, RQ-TS-31

**RQ-TS-07**: Cifras 55/38 (antes 54/39), siete compartidas (antes ocho), escenario nuevo «hay siete compartidas»

**RQ-TS-23**: Nota histórica (caso B) preservando revisión F1C-09 (:011f6ea), escenario nuevo «retirar las tres no movió el emparejamiento»

**RQ-TS-30** (ADDED): `rechazo_cliente` área Comercial, invariante 5 con siete, mapa [C], 8 escenarios

**RQ-TS-31** (ADDED): aviso por área S-1, 3 escenarios

**Notas de fusión**: Tabla invariantes fila 5 (:63) pasa a siete con `(Previously: ocho, hasta F1C-10)`. Escenario de invariantes 5 y 6 (:1640-1643) anotado con revisión F1C-09 y nota de que RQ-TS-30 lleva las compartidas a siete.

## Barrido de citas (tarea 6.3)

Barrido contra el estado post-fusión de la rama archive (`4984c3b`):

| Fichero | Línea | Contenido | Acción |
|---------|-------|----------|--------|
| openspec/specs/permissions/spec.md | :26-27, :70, :72-73 | cifras y referencias de matriz | en sitio, sin desplazamiento |
| openspec/specs/permissions/spec.md | :77, :80-81, :338 | matriz 55/38 viva | en sitio (reemplazada por delta) |
| openspec/specs/transitions-st/spec.md | :63 | tabla invariantes fila 5 | anotada con `(Previously: ocho, hasta F1C-10)` (caso B) |
| openspec/specs/transitions-st/spec.md | :1640-1643 | escenario invariantes 5 y 6 F1C-09 | anotado con revisión `011f6ea` y nota de F1C-10 (caso B) |

Detector `npx tsx apps/desk/server/citas/cli.ts --sha 4984c3b`: 0 bloqueantes.

## Supuestos y deuda

**S-1 (supuesto registrado)**: Servicio Técnico deja de recibir aviso de área al entrar en Notificación cliente, porque las tres salidas de ese estado ya no incluyen Servicio Técnico. Reversible con el cambio opuesto del catálogo. Registrado en proposal.md y tasks.md.

**Fuera del recuento (regla del ciclo 1)**: Verificación en la app tras desplegar. Usuario sólo de Servicio Técnico no ve «Rechazo» en Notificación cliente; Comercial sí; las otras dos «Rechazo» siguen visibles para Servicio Técnico; campana de ST no avisa. Responsabilidad: quien despliega / Gerencia. **No dada por hecha** por este archivo.

## Cifras finales

| Métrica | Valor |
|---------|-------|
| Requisitos | 5 (RQ-PM-03, RQ-TS-07, RQ-TS-23, RQ-TS-30, RQ-TS-31) |
| Escenarios | 32 (10+7+5+8+3) - todos en verde |
| Matriz permissions | 55 prohibidos / 38 permitidos (compuesta 56/37) |
| Compartidas transitions | 7 (5 Comercial/Compras, 2 Comercial/ST) |
| Líneas fusionadas specs | +179 / -20 (neto +159) |
| Techo Regla del archivo | 800 líneas revisables; medida final: 259 líneas (specs fusionadas + archive-report) |

## Artifact IDs (Engram)

- proposal: obs. #1276
- spec: obs. #1277
- design: obs. #1278
- tasks: obs. #1279
- verify-report: obs. #1282
- archive-report: (este fichero)

Cambio archivado exitosamente. F1C-10 completo.
