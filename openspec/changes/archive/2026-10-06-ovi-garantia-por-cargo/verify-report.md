# Verify · `ovi-garantia-por-cargo` (F1B-03, `cierra: no`)

**VEREDICTO: PASS WITH WARNINGS** — 0 CRITICAL, 2 WARNING, 3 SUGGESTION. Escenarios CUBIERTOS 51 de 52, 1 PARCIAL, 0 SIN PRUEBA.
Verificador independiente; partida `215310d`, HEAD `e4bdc6e`. Todo lo de abajo lo leí o lo ejecuté yo.

## 1. Comandos (ejecutados por mí, en el worktree)

| Comando | Salida |
|---|---|
| `npm test` | **0** — 236 ficheros pasan, 2 saltados (integración con BD real); 3.635 pruebas pasan, 7 saltadas |
| `npm run typecheck` | **0** |
| `npm run lint` | **0** — 0 errores, 165 avisos (no medí si son previos) |
| `npm run build` | **0** |
| `tsx apps/desk/server/citas/cli.ts --sha HEAD` | **0** — no bloquea; sólo informa abreviadas rotas (ver W-2) |

## 2. Cumplimiento (requisito · escenario · prueba · estado)

Pruebas en `apps/desk/server/oviGarantia.test.ts` (AL/TR/RC/GA/POS), `apps/desk/server/oviGarantiaRemision.test.ts` (RE/GA-RE/POS-RE) y `packages/shared/src/{ordenOVI,subOV,cargos}.test.ts`.

**permissions**
| Req | Escenario | Prueba | Estado |
|---|---|---|---|
| RQ-PM-20 | por cargo y admin | `cargos.test.ts` «puedeCrearOVIGarantia: sin área, basta el cargo Director Técnico (RQ-PM-24)» | CUBIERTO |
| RQ-PM-20 | las dos primitivas tienen llamador | `cargos.test.ts` «PM20-2 · las dos primitivas tienen llamador…» | CUBIERTO |
| RQ-PM-24 | DT sin Servicio Técnico pasa | AL-2, RE-2, TR-2/4/6, `cargos.test.ts` | CUBIERTO |
| RQ-PM-24 | admin sin cargo pasa | AL-3, RE-3, TR-2/4/6 | CUBIERTO |
| RQ-PM-24 | sin cargo, no admin | AL-1, RE-1, TR-1/3/5 | CUBIERTO |
| RQ-PM-24 | minúsculas y espacios | AL-4/AL-5 (` ovi-2026-001 `), `subOV.test.ts` `esOVI`, RC-6 | CUBIERTO |
| RQ-PM-24 | número mal formado con prefijo OVI | AL-4/5 (`OVI-26-1`), `ordenOVI.test.ts` «una OV- no pide cargo; una OVI mal formada y en minúsculas sí» | CUBIERTO |
| RQ-PM-24 | `OV-` no pide cargo | AL-8, RE-7 | CUBIERTO |
| RQ-PM-25 | Zoho con OVI reconfirmada | RC-1 | CUBIERTO |
| RQ-PM-25 | ticket de la app reconfirmada | RC-2 | CUBIERTO |
| RQ-PM-25 | cambiar una OVI por otra entra | RC-4 | CUBIERTO |
| RQ-PM-25 | orden liberada vuelve a entrar | RC-5 | CUBIERTO |

**tickets-core** (alta)
| Req | Escenario | Prueba | Estado |
|---|---|---|---|
| RQ-TC-42 | OVI sin cargo | AL-1 | CUBIERTO |
| | tecleada sin id / número distinto del resuelto | AL-4/5, AL-6 | CUBIERTO |
| | con cargo / admin | AL-2, AL-3 | CUBIERTO |
| | sujeto ausente | AL-7 | CUBIERTO |
| | pos. A equipo < cargo | POS-AL-1 | CUBIERTO |
| | pos. A orden no encontrada < cargo | POS-AL-2 | CUBIERTO |
| | pos. cargo < C equipo↔cliente | POS-AL-3 | CUBIERTO |
| | pos. cargo < C obligatorios | POS-AL-4 | CUBIERTO |
| RQ-TC-43 | Garantía + `OV-` | GA-AL-1, GA-AL-4 | CUBIERTO |
| | Garantía + OVI con cargo | GA-AL-2 | CUBIERTO |
| | Garantía sin orden nace | GA-AL-3 | CUBIERTO |
| | OVI en no-Garantía con cargo | GA-AL-5 | CUBIERTO |
| | pos. C garantía < D 409 | POS-AL-5 | CUBIERTO |

**transitions-st**
| Req | Escenario | Prueba | Estado |
|---|---|---|---|
| RQ-TS-36 | OVI nueva sin cargo, cada transición | TR-1/3/5 (it.each, las tres) | CUBIERTO |
| | con cargo / admin / DT sin área | TR-2/4/6 | CUBIERTO |
| | OVI en no-Garantía con cargo | TR-2/4/6 (`tipo_servicio` nulo, `oviGarantia.test.ts:176`) | CUBIERTO |
| | pos. 409 estado < cargo | POS-TR-1 | CUBIERTO |
| | pos. área < cargo | POS-TR-2 | CUBIERTO |
| | pos. cargo < remisión vigente | POS-TR-3, 3b | CUBIERTO |
| | pos. cargo < obligatorios | POS-TR-4 | CUBIERTO |
| | pos. cargo < D | POS-TR-5, 5b | CUBIERTO |
| RQ-TS-37 | Garantía + `OV-` en cada transición | GA-TR-1 (HS), GA-TR-2 (`aprobacion`); `aprobacion_y_repuestos` no probada | **PARCIAL** (W-1) |
| | Garantía + OVI con cargo | GA-TR-4 | CUBIERTO |
| | pos. C garantía < D | POS-TR-6 (y POS-TR-7, dentro del agregado) | CUBIERTO |
| RQ-TS-38 | Zoho reconfirma en HS sin cargo | RC-1 | CUBIERTO |
| | ticket de la app con la OVI del DT | RC-2 | CUBIERTO |
| | Garantía con orden no-OVI reconfirma | GA-TR-3 | CUBIERTO |
| | asociación vigente cuenta | RC-3 (+RC-7) | CUBIERTO |

**remisiones**
| Req | Escenario | Prueba | Estado |
|---|---|---|---|
| RQ-RE-30 | OVI sin cargo | RE-1 | CUBIERTO |
| | cargo / admin / DT sin área | RE-2, RE-3 | CUBIERTO |
| | reconfirmar no pide cargo | RE-4, RE-5, RE-5b | CUBIERTO |
| | otra orden + OVI sin cargo (S-8) | RE-6 | CUBIERTO |
| | pos. cargo < C cuarentena | POS-RE-1 | CUBIERTO |
| | pos. cargo < D | POS-RE-2 | CUBIERTO |
| | pos. D pendiente < cargo | POS-RE-3 | CUBIERTO |
| | pos. C checklist < cargo | POS-RE-4 | CUBIERTO |
| RQ-RE-31 | Garantía + `OV-` | GA-RE-1 | CUBIERTO |
| | Garantía + OVI con cargo / OVI en no-Garantía | GA-RE-2, GA-RE-5 | CUBIERTO |
| | pos. C garantía < D | POS-RE-5 | CUBIERTO |
| | Garantía que reenvía su orden (S-1) | GA-RE-4 | CUBIERTO |

## 3. Las 34 casillas de `tasks.md`

Las 34 están marcadas. Comprobé que existe lo que afirman: los ids 2.2-2.10 y 3.2-3.4 coinciden con los nombres de prueba de `oviGarantia.test.ts` y `oviGarantiaRemision.test.ts`; `esOVI`, `ordenOVI.ts` y `guardasOVI.ts` existen con las funciones citadas; `cargos.test.ts:204-205` fija 1815; los numstat en sitio son correctos (§5); los cuatro códigos los reproduje (§1); las mutaciones de 1.9/2.12/3.7 están registradas en `apply-progress.md` y yo reproduje las de posición (§4). No verifiqué las «medidas reales» 1.11/2.14/3.9 contra el registro de intentos (lo lleva el orquestador); el agregado que mido yo, fuera de `openspec`, es +871/−31 contra `215310d` (`git diff --shortstat --no-renames`). Sin casillas marcadas en falso.

## 4. Mutaciones propias (reproducidas; cada una restaurada con `git checkout` del fichero)

| Entrada | Mutación | Pruebas en rojo |
|---|---|---|
| Alta | cargo movido tras los obligatorios (antes de `const cliente`) | POS-AL-3 «…B antes que la guarda equipo↔cliente» y POS-AL-4 «…B antes que los obligatorios» |
| Alta | cargo (sólo número tecleado) delante del bloque `if (b.salesOrderId)` | POS-AL-2 «…A antes que B» |
| Alta | garantía detrás del 409 (antes de `const codigoServicio`) | POS-AL-5 «…422 de garantía (C), no el 409 (D)» |
| Alta | garantía delante de la cuarentena | POS-AL-6 y POS-AL-7 |
| Transición (HS) | cargo antes del área | POS-TR-2 |
| Transición | cargo tras remisión vigente / alta validada | POS-TR-3 y POS-TR-3b |
| Transición | cargo tras el 422 agregado | POS-TR-3, 3b y POS-TR-4 |
| Transición | cargo tras el 409 de unicidad | POS-TR-3, 3b, 4, POS-TR-5 y POS-TR-5b |
| Transición | garantía tras el 409 (fuera del agregado) | POS-TR-6 (más GA-TR-1, GA-TR-2, POS-TR-7, POS-TR-8 por el cambio de forma del error) |
| «OV adicional» | comparte la llamada de transición: la fijan POS-TR-4 y POS-TR-5b, que usan las aprobaciones | (mismas mutaciones de arriba) |
| Remisión | cargo detrás de la cuarentena | POS-RE-1 |
| Remisión | cargo detrás del 409 | POS-RE-1 y POS-RE-2 |
| Remisión | garantía detrás del 409 | POS-RE-5 |
| Remisión | garantía delante de la cuarentena | POS-RE-6 y POS-RE-7 |
| Todas | quitar «ya la traía» (`ordenesQueEntran` sin el `continue`) | GA-TR-3, GA-RE-4, RC-1 (ticket de Zoho), RC-2, RC-3, RE-4, RE-5, RE-5b y 3 de `ordenOVI.test.ts` |

Ninguna mutación sobrevivió. Un primer intento mío (garantía del alta puesta antes del `if` del 409) dio verde; era una mutación mal colocada, no una laguna: puesta después del bloque del 409, POS-AL-5 cae. Al final `git status --short` mostró el árbol limpio salvo este informe.

## 5. Regla 13, ficheros muy citados, alcance

- `git diff --stat 215310d HEAD -- apps/desk/src packages/zoho-sync` da vacío. No se toca el cliente ni `upsertTicket` ni el sincronizador. No queda decisión de OVI/garantía en el cliente: la regla es `packages/shared/src/ordenOVI.ts` y la impone `apps/desk/server/services/guardasOVI.ts`.
- numstat: `ticketService.ts` **9/9**, `remision.ts` **3/3**, `routes/tickets.ts` 1/1, `cargos.ts` 5/5, `cargos.test.ts` 10/10, `index.ts` 1/1, `mantenimientoNovedades.ts` 1/1. `wc -l`: `ticketService.ts` 277 (igual que 215310d), `remision.ts` 397 (igual).
- Alcance: «OVI sólo en garantía» NO construido (GA-AL-5, GA-RE-5 y TR-2/4/6 admiten OVI sin ser Garantía, con el cargo). En la remisión sólo cambian el import, la línea 7 y la `:220`; el orden relativo A → cuarentena → vencido → D se conserva (el cargo se intercala tras A, la garantía tras el vencido); `remisiones.test.ts` y `recepcion.test.ts` siguen verdes sin tocarse. No se toca `upsertTicket`.

## 6. Revisión de código (sin estilo)

Revisé `ordenOVI.ts`, `esOVI` (`subOV.ts:55-67`) y `guardasOVI.ts`. Intentos de esquivar el cargo:
- **Número tecleado distinto del de Books (alta):** `entrantesDeAlta` juzga los dos (`guardasOVI.ts:27-29`; AL-6, GA-AL-4). Cerrado.
- **Caja y espacios:** `esOVI` recorta y no distingue caja (`subOV.ts:66`); en «ya la traía» la comparación es exacta, así que otra caja entra y pide cargo (falla cerrado, RC-6).
- **Orden por `salesOrderId` cuyo número de Books es OVI (remisión):** el número juzgado es `ov.number` (`guardasOVI.ts:52`); RE-1. Cerrado.
- **Ticket con una OVI que recibe OTRA OVI:** entra (RC-4, RE-6).
- **Asociación liberada:** `yaLoTiene` filtra `liberada_at` (`guardasOVI.ts:35`); RC-5.
- **Otras vías de escritura de la orden:** `asociarOV` y `orden_venta` sólo se escriben en `remision.ts`, `equipoNuevo.ts` (dentro del alta, tras la guarda) y el repositorio; no encontré otra entrada sin guarda.
- Sin errores reales de lógica. Observación de comportamiento (no defecto): reenviar la misma OVI con distinta caja a un ticket que ya la tiene pide el cargo; es fail-closed y está declarado.

## 7. Incoherencia a valorar (contrato vencido frente a garantía)

En el alta gana el vencido (`ticketService.ts:96`, POS-AL-7); en la transición la garantía va dentro del agregado de `:134` y sale antes que el vencido de `:147` (POS-TR-8); en la remisión gana el vencido (POS-RE-7). **No contradice ningún requisito vivo.** El orden total de `openspec/specs/transitions-st/spec.md:1193-1195` en `6344b4a` (toda guarda de un escalón anterior SHALL evaluarse antes que cualquier guarda de un escalón posterior) sólo ordena ENTRE escalones; las dos guardas son C, y `:1214` deja el sub-orden dentro de un escalón a la dependencia de datos y a la prueba, que aquí son POS-AL-7, POS-TR-8 y POS-RE-7. Es una diferencia entre puertas, no una inversión de escalón. El texto «Cero inversión: las dos puertas evalúan la misma pareja en el mismo orden» (apartado a, tras `:1214-1226`) habla de la pareja obligatorios/OV, no de ésta. Ver S-1.

## 8. Hallazgos

**CRITICAL:** ninguno.

**WARNING**
- **W-1** `apps/desk/server/oviGarantia.test.ts:312-336` en `e4bdc6e` (superado: el cierre `1edae50` añadió la prueba GA-TR-2b que cubre este hallazgo): el escenario de `specs/transitions-st` RQ-TS-37 «Garantía con `OV-` en cada transición… las dos aprobaciones» sólo se ejerce con `aprobacion` (GA-TR-2); `aprobacion_y_repuestos` + Garantía no tiene prueba. El código es el mismo (`ticketService.ts:134`, `plan.ovAdicional`), riesgo bajo; añadir un caso o acotar el escenario.
- **W-2** El detector de citas (salida 0, no bloquea) lista abreviadas rotas en `openspec/specs/permissions/spec.md:42`, `openspec/specs/transitions-st/spec.md:33` y `:484`. Esos ficheros no los toca el cambio (`git diff 215310d HEAD` sólo toca `openspec/changes/`), así que son previas; no las medí contra `215310d`. El barrido humano del cierre (regla de mutación 4) sigue pendiente: `ticketService.ts` `:21,:36,:43,:44,:96,:131,:134` y `remision.ts:220`.

**SUGGESTION**
- **S-1** Documentar en el `archive-report` y en la spec viva que la pareja garantía/vencido queda con orden distinto entre alta/remisión (vencido primero) y transición (garantía primero), con las tres pruebas que lo fijan.
- **S-2** El punto nuevo de IV-12 (cargo B en la remisión por detrás de C y D, `remision.ts:127,158,177,197`) está en la lista de cierre de `tasks.md`; debe quedar escrito en `CLAUDE.md` y `openspec/config.yaml` al cerrar.
- **S-3** `remision.ts:220` queda como una línea de unos 800 caracteres con cinco guardas encadenadas; es el coste deliberado de no desplazar citas, pero cualquier edición futura merece partirla (con barrido de citas).

## 9. Fuera de este informe

Tareas de persona, que archivar no da por hechas: P-1 asignar cargos antes de publicar (sin ellos sólo pasa el administrador), P-2 confirmación del Director Técnico sobre «OVI sólo para garantía», P-3 recoger en el expediente del maestro. Cierre del orquestador: barrido de citas, registro del intento y su medida, punto IV-12 nuevo, corrección para el maestro, nota de despliegue.
