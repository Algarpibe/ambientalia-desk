# Informe de verify — `espera-y-areas-equipo-nuevo` (F1B-09, `cierra: no`)

Verificado sobre `0f5e2b6` (partida `4124fb5`, planificación `5b98440`), en el worktree de la rama. **Veredicto: PASS.**
0 CRITICAL · 1 WARNING · 3 SUGGESTION.

## 1. Códigos

| Código | Resultado |
|---|---|
| `npm test` | 0 · 286 ficheros pasan (3 omitidos), 4.792 pruebas pasan (11 omitidas) |
| `npm run typecheck` | 0 |
| `npm run lint` | 0 · 0 errores, 165 avisos (el tope) |
| detector de citas `--sha HEAD` | 0 · 13 abreviadas rotas informativas (la línea base) |
| `npm run reconcile` | 0 · `esperas ... código 12 · maestro 4`; `RECONCILIACION.md` restaurado, árbol limpio |

## 2. Requisito → evidencia

| Requisito / escenario | Evidencia |
|---|---|
| RQ-TS-39 · `Pendiente` `externa`, `Verificación` y `Solicitud Soporte` `ninguna` | `packages/shared/src/estados.ts:103-105`; `estados.test.ts` (6 `externa`, 11 `ninguna`, `sin_clasificar` vacío, las doce) |
| RQ-TS-39 · doce con `Pendiente` la última | `estados.ts:120-123` (filtro sobre el registro, `Pendiente` en la última posición); `estados.test.ts` |
| RQ-TS-39 · tablero: `Pendiente` en «Espera»; las otras dos en «Abiertos» | `apps/desk/src/lib/esperaE226.test.ts:17-27`; lector `apps/desk/src/lib/enEspera.ts:15` |
| RQ-TS-39 · `Pendiente` sola y sin comentario; barrido = código | `estados.ts:103` frente a `comprobaciones.ts:162`; `esperasContraRegistro.test.ts:15-18`; M1 |
| RQ-TS-39 · cifras `:21`, `:28`, `:115` dicen doce, vigiladas | `estados.ts:21`, `:28`, `:115`; `comentariosVigilados.test.ts:93-99` (caso f); M6 |
| RQ-TS-39 · «da OCHO» (`:145`) y SLA sin leer la clasificación | `estados.ts:144-145` intacto; `comentariosVigilados.test.ts:33-34`; `sla.test.ts:45-55` |
| RQ-TS-17 / RQ-TS-25 / RQ-TS-26 (menciones a doce y a `Pendiente`) | texto de los deltas coherente con el código; `sla.test.ts:45` cita `estados.ts:28` con «doce» |
| RQ-EN-02 · seis `Servicio Técnico`, docblock sin s2 | `transitions.ts:347-348`; `invariantesGrafo.test.ts:213-215`; matriz `permisos.test.ts:211-245` |
| RQ-EN-02 · `liberacion` a Comercial cae (mutación) | M5 |
| RQ-EN-07 · `Verificación` `ninguna`, «Abiertos» | `estados.ts:104`; `esperaE226.test.ts:21-23`; M3 |
| RQ-SR-03 · `Solicitud Soporte` `ninguna`, fuera de `ESTADOS_SERVICIO` | `estados.ts:105`, `:182`; `estados.test.ts`; M4 |
| RQ-SR-12 · `Pendiente` `externa`, sólo-SR, «Espera» | `estados.ts:103`, `:182`; `esperaE226.test.ts:17-19`; M2, M7 |
| RQ-RC-04 · texto y registro cuentan lo mismo | `comprobaciones.ts:154` (`export`, cuerpo intacto); `esperasContraRegistro.test.ts`; reconcile da 12 |

## 3. Líneas (regla de mutación 4)

`git diff --numstat` y `wc -l` contra `4124fb5`: igual en los ficheros existentes de código y de prueba tocados (estados.ts 190,
transitions.ts 397, comprobaciones.ts 434, sla.test.ts 331, invariantesGrafo.test.ts 329, permisos.test.ts 461,
avisoArea.test.ts 111, estados.test.ts 235). **Excepción:** `comentariosVigilados.test.ts` 92 a 100 (+8, el caso (f) al final
por la tarea 1.4; ver W1). La entrada de `Pendiente` está sola y sin comentario en `estados.ts:103`; la lee `comprobaciones.ts:162`.

Barrido de citas a las líneas cambiadas (`estados.ts:21`, `:28`, `:60`, `:88`, `:101-105`, `:115`; `transitions.ts:347-348`):

| Cita | Caso |
|---|---|
| `comentariosVigilados.test.ts:95-98`, `sla.test.ts:45`, deltas y tasks del cambio (`estados.ts:21`, `:28`, `:115`, `:101-105`) | A: dicen lo de hoy |
| `openspec/specs/transitions-st/spec.md:1191` (`estados.ts:28`, «once») | la línea acierta, el texto dice once: previsto en el archive (3.3) |
| `docs/sdd/ENTRADA.md:2138`, `:2148`; `F1B-09_Auditoria_blueprint_audit-F1B.md:86`, `:265`, `:269`, `:306` | B/C: registro fechado, anterior a E-226; no se tocan |
| `Paquete_de_Despliegue_2026-09-27` a `2026-10-01` (`estados.ts:105`, `transitions.ts:347`) | B: paquetes fechados |
| `openspec/changes/archive/*` (`estados.ts:21`, `:28`, `:105`; `transitions.ts:348`) | B: archivados; `:348` sigue conteniendo «Campos:» |

Sin citas a `estados.ts:60` ni `:88` fuera del cambio.

## 4. Mutaciones reproducidas (`mut.mjs`, restauradas; árbol limpio tras cada una)

| # | Resultado |
|---|---|
| M0 control | 51 de 51 en verde |
| M1 comentario tras `Pendiente` | rojo sólo `esperasContraRegistro.test.ts` (1 de 25) |
| M2 `Pendiente` `sin_clasificar` | rojo: 3 de `estados.test.ts` + `esperaE226.test.ts` |
| M3 `Verificación` `externa` | rojo: 4 de `estados.test.ts` + `esperaE226.test.ts` |
| M4 `Solicitud Soporte` `interna` | rojo: 4 de `estados.test.ts` + la de RQ-SR-03 + `esperaE226.test.ts` |
| M5 `liberacion` `Comercial` | rojo: `invariantesGrafo.test.ts`, corrección (b) (`:213-215`), 1 de 26 |
| M6 `estados.ts:115` «ONCE» | rojo: `comentariosVigilados.test.ts` (f) |
| M7 `Pendiente` `interna` | rojo: 3 de `estados.test.ts` |

Las ocho cayeron donde `design.md` D4 dice. M1 sólo lo ve la prueba nueva (molde H5).

## 5. Razonamiento de `liberacion` y lectores

- `facturado` (`transitions.ts:240`), `liberacion_sin_factura` (`:246`) y `habilitado_para_entrega` (`:259`) son de Comercial y
  `liberacion` de equipo nuevo es de Servicio Técnico (`:359`, con certificado de fábrica `:360`). El maestro lo respalda
  (`R08.4.md:1693` Verificación, Liberación, Finalizado; `:1698` salida aprobada; `:5779` «La Liberación exige el número del
  certificado de fábrica»). El maestro no asigna área a esa liberación: es el supuesto S-2, declarado y reversible. Válido.
- Lectores de la clasificación en `apps/` y `packages/` (sin pruebas): `enEspera.ts:15`, `boardView.ts:39`,
  `ClienteDetalle.tsx:36`, `comprobaciones.ts:154-165`, `estados.ts:120-123`, `:169-173`; `fasesBlueprint.ts:3` solo lo
  menciona en un comentario. Todos están nombrados en `proposal.md` §2.

## 6. Hallazgos

- **CRITICAL:** ninguno.
- **WARNING W1.** `packages/shared/src/comentariosVigilados.test.ts` pasa de 92 a 100 líneas: «ningún fichero existente cambia de
  número de líneas» no es cierto al pie de la letra. Es benigno (caso (f) añadido al final por la tarea 1.4; las citas a ese
  fichero son `:33-34` y `:54-65`, anteriores). Dejarlo dicho en el `archive-report.md`.
- **SUGGESTION S1.** `openspec/specs/transitions-st/spec.md:1191` (`estados.ts:28`, «once») y `:1188` («11 estados»), más
  `:1209-1211` y `transitions-equipo-nuevo/spec.md:109` (encabezado «supuesto s2»), quedan para el archive (3.3) como está
  previsto; `transitions-equipo-nuevo/spec.md:121` («por s2») es historia entre paréntesis y puede quedarse.
- **SUGGESTION S2.** `apps/desk/src/lib/enEspera.test.ts:6` («salto de 9 a 11») y los fixtures `ESTADOS_CON_ONCE` de
  `apps/desk/server/reconciliacion/cli.test.ts:9` y `comprobaciones.test.ts:8` dicen once: son comentarios y datos sintéticos de
  su fecha, no afirman el código de hoy. Sin acción.
- **SUGGESTION S3.** Texto para Supervisión (no se edita aquí). (a) `CLAUDE.md`, IV-9: de ONCE a DOCE los `en_espera`; de
  «2 aciertos y 9 fallos sobre 11» a 2 aciertos y DIEZ fallos sobre 12 (`Pendiente` no contiene «espera» ni «hold»). (b)
  `openspec/config.yaml`, `cifras_ancladas.esperas`: de «ONCE: 5 externa + 6 interna» a «DOCE: 6 externa + 6 interna»; el
  barrido ya da 12 y la clasificación sigue siendo diferencia legítima de criterio frente a los 4 del maestro. (c)
  `docs/sdd/ENTRADA.md` E-226: marcar atendida por este cambio.

## 7. Estado de las tareas

1.1-1.4 y 2.1-2.6 marcadas y coinciden con el código. 3.2 se marca con este informe. 3.1 (barrido) queda cubierto por §3 y
3.3 es el archive. Las tareas P-1 y P-2 son de personas y archivar no las da por hechas.
