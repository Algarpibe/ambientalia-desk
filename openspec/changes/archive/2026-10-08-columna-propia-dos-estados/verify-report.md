# Verify report: columna-propia-dos-estados (F1B-08, cierra: no)

Revisión verificada: `61b251b` (base `7a2b1c8`). Modo: strict TDD, hybrid. Todo lo de abajo se midió en esta sesión; ninguna cifra de `apply-progress.md` se repite sin remedirla.

## Veredicto: PASS CON AVISOS (0 CRITICAL, 3 WARNING, 2 SUGGESTION)

## 1. Criterios de aceptación y escenarios de los deltas
| # | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 1 | `Verificación`→`verificacion`, `Solicitud Soporte`→`solicitud_soporte` | PASA | `columns.ts:15`, `:20`; prueba (c) de `columns.test.ts`; `flujos.test.ts:125-128`, `:204-206` |
| 2 | Sólo esos dos cambian de columna | PASA | cálculo independiente con tsx (sección 4) |
| 3 | `Finalizado` y desconocido siguen en `otros` | PASA | `columns.test.ts:37-38` (previas) y (e) `:55` |
| 4 | `otros` última; posición de las dos | PASA | lista de ids `columns.test.ts:6-11`; mutaciones N7, N8, N16 la ponen roja |
| 5 | `columns.ts` 47 líneas; `:34`, `:38`, `:40-42`, `:45-47` | PASA | `wc -l` = 47; `cat -n`: `otros` en 34, `FALLBACK_COLUMN_ID` en 38, `STATUS_TO_COLUMN` en 40-42, `columnForStatus` en 45-47 |
| 6 | `flujos.test.ts` 258; `columns.test.ts` `:1-40` en su sitio | PASA | `wc -l` = 258; hunks `-1,11 +1,11` y `-38,3 +38,20`: ninguna línea previa se desplaza |
| 7 | Bloques `MODIFIED` conservan líneas | PASA | RQ-EN-07: 17 líneas en la spec viva (`:256-272`) y 17 en el delta (`:3-19`); RQ-SR-03: 38 y 38 (`:98-135` frente a `:3-40`) |
| 8-10 | Mutaciones 1-3 | PASAN | sección 5 (N1, N16, N7, N8, N13) |
| 11 | Nada bajo `apps/desk/src` | PASA | sección 2 |
| 12 | test, typecheck, lint | PASA | sección 6 |
| 13 | Barrido de citas | PASA CON AVISOS | sección 7 |

Escenarios. EN-07 «aparece en su columna propia»: PASA (`columnForStatus` de `Verificación` devuelve `verificacion`, dos pruebas). SR-03: unión = `ESTADOS`, no es de servicio, `sinSalida=['Finalizado']` (`invariantesGrafo.test.ts:179-180`) y clase `sin_clasificar` (`estados.test.ts:222`) pasan en el `npm test` completo; el escenario de quitar `Ejecutar` no se re-mutó (no ejecutado; este cambio no lo toca). La frase nueva «`solicitud_soporte` tras `ticket_creado`»: PASA.

## 2. `git diff --stat 7a2b1c8 61b251b`: 10 ficheros, +518/-10
Sólo la carpeta del cambio (`apply-progress`, `design`, `exploration`, `proposal`, `tasks`, dos `specs/*/spec.md`) y tres de código: `columns.ts` (+2/-2), `columns.test.ts` (+20/-3), `flujos.test.ts` (+5/-5). Nada bajo `apps/desk/src`, ni `estados.ts`, ni specs vivas, ni `docs/sdd/ENTRADA.md`, ni `openspec/config.yaml`.

## 3. Líneas
`columns.ts` 47; `flujos.test.ts` 258; `columns.test.ts` 57 (eran 40). `git diff -U0` de `columns.ts`: sólo los hunks `-15 +15` y `-20 +20`.

## 4. Ningún otro estado cambia (independiente de la prueba)
`git show 7a2b1c8:packages/shared/src/columns.ts` a un fichero fuera del repo (imports apuntados al worktree) y `tsx` sobre los 23 `ESTADOS`. Salida: `DIFF Verificación otros -> verificacion` y `DIFF Solicitud Soporte otros -> solicitud_soporte`; ninguna más. El mapa real de `7a2b1c8` coincide con `COLUMNA_ANTES`: JSON idéntico, 23 claves, mismos valores.

## 5. Mutaciones propias (restauradas; `cmp` contra copia previa idéntico; `git status` limpio)
| # | Qué cambié | Pruebas rojas |
|---|---|---|
| N1 | intercambiar los ids de las dos columnas nuevas | lista de ids; (c); `flujos` RQ-EN-07; `flujos` S-10 INVERTIDA |
| N2 | etiqueta `Verificación`→`Verificacion` | **SOBREVIVIÓ** |
| N3 | `Servicio externo` duplicado en `pendiente` | «mapea estados del Blueprint a su columna»; (b); (f) |
| N4 | `Finalizado` en los `statuses` de `otros` | (d) |
| N5 | borrar `Servicio externo` de `COLUMNA_ANTES` | (a); (b) |
| N6 | `COLUMNA_ANTES.Solicitado`→`otros` | (b) |
| N7 | `solicitud_soporte` antes de `ticket_creado` | lista de ids (sólo ella) |
| N8 | `solicitud_soporte` movida tras `otros` | lista de ids (sólo ella) |
| N9 | `Pendiente` también en `ov_asignada` (columna previa) | (f) (sólo ella) |
| N10 | `FALLBACK_COLUMN_ID` = `pendiente` | «lleva estados sin columna propia (cierre/desconocidos) a otros»; (b); (e) |
| N11 | `COLUMNA_ANTES.Verificación`→`verificacion` | (b) |
| N12 | `Solicitud Soporte` también en `ticket_creado` | (f) (sólo ella) |
| N13 | `Solicitud Soporte` también en `verificacion` | `flujos` S-10 INVERTIDA; (c); (f) |
| N14 | (b) esperando además `Pendiente` | (b) |
| N15 | etiqueta de `solicitud_soporte`→`Otros` | **SOBREVIVIÓ** |
| N16 | quitar la entrada `verificacion` dejando `proceso` | lista de ids; (b); (e) |

(a)-(f) son las pruebas de la suite «columna propia de Verificación y Solicitud Soporte (decision/e225-columna-propia-dos-estados)»; la lista de ids es «columns > define las columnas del Blueprint en orden de flujo + Otros al final».

**Supervivientes: N2 y N15 (etiquetas).** Importan poco: la etiqueta es el supuesto S-2 de Gerencia y ningún criterio la fija, pero es texto visible en el tablero y ninguna prueba la protege (W-3).

## 6. Los cuatro códigos, cada uno por separado
- `npm test`: salida **0** (259 ficheros pasan, 2 saltados; 4257 pasan, 7 saltadas).
- `npm run typecheck`: salida **0**.
- `npm run lint`: salida **0** (165 avisos, 0 errores).
- `tsx apps/desk/server/citas/cli.ts --sha HEAD`: salida **0** (6507 comprobadas; 13 abreviadas rotas informativas, ninguna de `columns`; 0 cabeceras R-1 inválidas; línea base 0).

## 7. Barrido de citas (sin excluir `archive/`)
51 citas `columns.ts:N`, más las de `flujos.test.ts` y `columns.test.ts`. Sólo cambian las líneas 15 y 20 de `columns.ts`; el resto (`4-5`, `6`, `27`, `29`, `33`, `34`, `38`, `40-42`, `44-45`, `45-46`, `45-47`) es idéntico a `7a2b1c8` (diff -U0) y `cat -n` lo confirma. Segundo pase de abreviadas `:15`/`:20` en los ficheros que citan el módulo: las que hay son de otros módulos (`ticketService.ts`, `estados.test.ts`, `repo.ts`); ninguna de `columns.ts`.

Citas a la `:15` y `:20`: las de esta carpeta (`proposal.md:74,114`, `tasks.md:16-17`, deltas, `apply-progress.md:4`) afirman «ahí va la entrada nueva» y son ciertas. Las dos de `archive/2026-09-29-blueprint-soporte-remoto` (`design.md:101`, `tasks.md:187`) dicen «`columns.ts:15`… cae en `otros`»: caso B histórico, falsas hoy como presente; no se tocan.

**Texto que deja de ser cierto sin mover la línea**
- En ficheros que la rama no puede tocar (traspaso a Supervisión): `docs/sdd/ENTRADA.md:2133` («no tienen columna»); `openspec/config.yaml:4193-4195` («pruebas que hoy afirman lo contrario», «requisitos que hoy lo prohíben»); `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md:259-261` (B-4).
- Specs vivas `transitions-equipo-nuevo/spec.md:264-267` y `transitions-soporte-remoto/spec.md:108-109`: las reemplazan los deltas al archivar.
- Caso B (fechados, no se tocan): `Paquete_de_Despliegue_2026-09-30.md:458` y `2026-10-01.md:620` («en `ae5aaf4`»).

## 8. Cabecera R-1
Los siete campos están (`tanda: F1B-08`, `motivo: ""`, `capacidad`, `maestro: []`, `cierra: no`, `toca_maestro: no`, `origen_cabecera: declarada`); el detector no la marca inválida. `cierra: no` es coherente: la propuesta deja fuera la paridad de vistas con Zoho (`decision/p4-vistas-equivalentes-zoho`, plazo 2026-10-16) y `openspec/config.yaml:4189-4205` (leído) lo confirma. La fila del plan no se leyó: no ejecutado.

## Avisos
- **W-1** El delta de RQ-EN-07 cambia el título sin bloque `RENAMED`; el nombre deja de casar con la spec viva (`:256`). El archive debe resolver el renombrado a mano o por script.
- **W-2** Textos falsos en tres ficheros que la rama no toca (sección 7); el archive-report debe declararlos como traspaso.
- **W-3** Etiquetas sin prueba (N2, N15).
- **S-1** `apply-progress.md` deja el segundo pase de abreviadas como «no ejecutado»; aquí se hizo para `:15`/`:20`, sin hallazgos.
- **S-2** Comprobación visual y S-1/S-2/S-3 de Gerencia siguen siendo tareas de personas fuera del recuento; archivar no las da por hechas.

Medida del intento (3.9): no ejecutada por este verify; la mide el orquestador.

## Adenda del 2026-10-08 — supervivientes cerrados después del veredicto

El veredicto de arriba es sobre `61b251b`. Después se añadió UNA prueba, sin tocar producción: `(g)` en
`packages/shared/src/columns.test.ts:57`, que fija la etiqueta de las dos columnas nuevas (supuesto S-2). El orquestador repitió
N2 y N15 contra ella: las dos en rojo, sólo `(g)`, y `columns.ts` restaurado (comprobado con `cmp`). W-3 queda cerrado.
W-1 lo resuelve el script de fusión, que casa por identificador; W-2 va al traspaso del paquete de despliegue.
