# Verify report — `prefijo-deducido-en-el-alta` (F1B-03, segundo cambio, `cierra: si`)

**Veredicto: PASS WITH WARNINGS** — 0 CRITICAL · 3 WARNING · 3 SUGGESTION.
Worktree `C:\dev\Desk_2_R1.023-worktrees\prefijo-deducido-en-el-alta`, HEAD `94f960a`, partida `968bb53`. Verificación independiente: no me fié de `apply-progress.md`; reproduje los códigos y las mutaciones. Modo: hybrid, strict TDD.

## 1. Códigos de salida (cada uno con `; echo "x=$?"` pegado)
| Comando | Código | Detalle |
|---|---|---|
| `npm test` | **x=0** | 277 ficheros pasan, 3 omitidos; 4695 pruebas pasan, 11 omitidas. Una sola corrida, sin `Timeout calling "onTaskUpdate"` (no hizo falta repetir) |
| `npm run typecheck` | **x=0** | |
| `npm run lint` | **x=0** | 165 avisos, 0 errores = línea base |
| `npm run build` | **x=0** | bundle `index-t1QFmlpr.js` (coincide con apply-progress) |
| `tsx apps/desk/server/citas/cli.ts --sha HEAD` | **x=0** | 7383 comprobadas; línea base 0; cabeceras R-1 inválidas 0; 18 abreviadas rotas informativas (ver §8) |

## 2. Tareas y cabecera (R-1)
`tasks.md`: 50 de 50 marcadas, 0 pendientes. `proposal.md:1-9` lleva los siete campos (`tanda: F1B-03`, `motivo: ""`, `capacidad: [tickets-core]`, `maestro`, `cierra: si`, `toca_maestro: si`, `origen_cabecera: declarada`); el detector da 0 cabeceras inválidas.
`cierra: si` queda sostenido: la fila (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:83`, ampliación `:177`) tiene como contenido restante los prefijos, y los tres cambios previos de F1B-03 (`tipo-servicio-ticket-sin-ov`, `remision-creada-sin-salida`, `ovi-garantia-por-cargo`) son todos `cierra: no` y declaran en su `archive-report.md` que dejan fuera sólo los prefijos y E-158 (cerrado sin construir).

## 3. Cumplimiento de la spec (3 requisitos modificados, 3 añadidos, 42 escenarios)
ST = `apps/desk/server/services/prefijoDeducidoAlta.test.ts`, TC = `packages/shared/src/ticketCreate.test.ts`, TS = `apps/desk/server/services/ticketService.test.ts`.
| Requisito / escenario | Prueba | Estado |
|---|---|---|
| RQ-TC-61: HV, SR, CG, PRO, MT, tipo fuera de lista, clasificación gana, desconocida/vacía, mismos predicados, literal exacto, alcanzables | `TC:6-56` (11 pruebas de `prefijoDeducido`) | COMPLIANT |
| RQ-TC-61: el alta guarda el código con el deducido / por rama | `ST:78-106` (cinco ramas) | COMPLIANT |
| RQ-TC-61: «Protocolo» sexta, comodines al final | `TC:60`, `:65` | COMPLIANT |
| RQ-TC-61: día de Bogotá | `TC:129-141` (3) y `ST:108` | COMPLIANT |
| RQ-TC-61: los tickets existentes no cambian | sin prueba; lo sostiene la ausencia de migración (`git diff --stat 968bb53 -- packages/zoho-sync/src/db` vacío) | PARTIAL, ver W-2 |
| RQ-TC-62: prefijo, código y asunto del cuerpo se ignoran; prefijo inválido ya no se rechaza; sin prefijo no se echa en falta; fila 5 sin «prefijo»; cliente viejo | `ST:121-166` | COMPLIANT |
| RQ-TC-62: la deducción no mueve la escalera de guardas | `ST:169-200` ((a), (b), (b2), (c)) y la inversión del prefijo inválido XXX en TS | COMPLIANT |
| RQ-TC-03, RQ-TC-05 (11 escenarios), RQ-TC-10 (3) modificados | pruebas existentes de TS, `flujos` y `transitions`, verdes en la corrida completa | COMPLIANT |
| RQ-TC-63 «la regla 13 la impone el servidor y está probada» | ST + M-10/M-11/M-12 (§4) y tabla del §6 | COMPLIANT |
| RQ-TC-63 tres escenarios **manuales** (formulario sin desplegable; vista previa sigue a clasificación y tipo; el ticket conserva lo previsualizado) | `.tsx` fuera de la red por decisión de Gerencia (`vitest.config.ts:16-20`); el delta los declara «manual», tras el despliegue, y no como tarea (regla del ciclo 1) | MANUAL declarado, no contado como UNTESTED |

## 4. Mutaciones reproducidas por mí (editar, correr `ticketCreate.test.ts` + `apps/desk/server/services`, ver rojo, restaurar con `git checkout`)
| Mutación | Pruebas rojas |
|---|---|
| M-1 `HV`→`MT` (`ticketCreate.ts`, línea de la deducción) | 7: ST «Equipo nuevo → HV_», «código del cuerpo se ignora», «prefijo del cuerpo se ignora»; TC «Equipo nuevo → HV», «clasificación gana al tipo», «alcanzables», «mismos predicados» |
| M-9a `yymmdd` con getters locales | 2: TC «las 20:00 de Bogotá…» y `ST:108` |
| M-10 línea 82 vuelve a leer `b.prefijo` | 4: TS «prefijo fuera de lista ya no se rechaza», ST «prefijo del cuerpo se ignora», «cliente con los tres campos viejos», «prefijo inválido ya no se rechaza» |
| M-11 línea 101 vuelve a leer `b.codigoServicio` | 3: «código del cuerpo se ignora», «asunto del cuerpo se ignora», «cliente viejo» |
| M-12 línea 102 vuelve a leer `b.subject` | 1: «asunto del cuerpo se ignora» (la única que discrimina; suficiente) |
| M-17 (regla 1), guarda de prefijo inválido ANTES de `:61` (equipo↔cliente) | 6: (a), (b), (b2), (c), «XX crea», inversión de XXX |
| M-17 ANTES de `:88` (obligatorios) | 5: (b), (b2), (c), «XX crea», inversión |
| M-17 ENTRE obligatorios y cliente (antes de `:89`) | 4: (b2), (c), «XX crea», inversión (el refuerzo (b2) hace falta: (b) sola no lo ve) |
| M-17 ANTES del 409 (antes de `:97`) | 3: (c), «XX crea», inversión |
| M-17 DESPUÉS del 409 (antes de `:101`) | 2: «XX crea», «prefijo inválido ya no se rechaza» |
| M-16 `prefijo,` devuelto al literal de `createTicket` (`CreateTicket.tsx:230`) | `npx tsc -b` x=2, TS2353: la propiedad `prefijo` no existe en el tipo `CreateTicketPayload & CuerpoAltaManual` |

**Supervivientes: ninguno.** Tras cada mutación restauré con `git checkout --` y `git status --short` quedó limpio; al final, sólo este informe.
(Mi primera tanda de M-17 usó una inserción defectuosa con sed y dio 127 rojas por error de sintaxis; la descarté y la rehice con un script de Node. La inserción «antes de `:100`» cae dentro del bloque del 409, inalcanzable: la sustituí por «antes de `:101`».)

## 5. Lo que el cambio no debía tocar
`git diff --stat 968bb53 -- packages/zoho-sync/src/db` vacío: ni `schema.sql` ni migraciones. `CLAUDE.md`, `openspec/config.yaml`, `openspec/specs/` y `docs/sdd/ENTRADA.md` sin diff en la rama (los desvíos de citas que viven ahí se listan para Supervisión). Código tocado: `ticketCreate.ts`, `types.ts`, `ticketService.ts`, `CreateTicket.tsx` y sus pruebas; docs: `F0-01_Correcciones_para_el_maestro.md` (+45 al final), el plan `:177`, `F0-00_Baseline_as_built.md:314`.

## 6. Regla invariable 13 / regla de mutación 3 (tabla de apply-progress contrastada línea a línea)
El servidor impone: `ticketService.ts:82` (`prefijoDeducido(clasificaciones, tipoServicio)`, no lee `b.prefijo`), `:101` (`buildCodigoServicio(...)` sin `b.codigoServicio`), `:102` (`buildSubject(...)` sin `b.subject`); `:87` es ya sólo un comentario. Cliente: `CreateTicket.tsx:46` (misma función compartida), `:157-163` (mismas `buildCodigoServicio`/`buildSubject`, sin overrides), `:230`/`:232` (ya no manda los tres campos), `:434`/`:436` `readOnly`. Cada fila de la tabla coincide con el código; las seis con contrapartida tienen prueba y mutación en rojo (§4). Las dos sin contrapartida (lista de tipos `:417` y de clasificaciones `:421` frente a `ticketService.ts:85-86`, que aceptan cualquier texto no vacío) están **declaradas** en RQ-TC-63 como carencia preexistente: la regla 13 se cumple declarándolas. `potentialName` ya no tiene lector (S-3, coherente).

## 7. Recuentos de líneas (contra `968bb53`)
`ticketService.ts` 277→277, `CreateTicket.tsx` 455→455, `types.ts` 810→810, `ticketCreate.ts` 49→52 (+3 al final; `extractServiceCode` y `prefijoDeducido` conservan su sitio). Ninguna línea citada se movió; cambian de significado `ticketService.ts:82`, `:87`, `:101`, `:102` y las del cliente, tratadas en el barrido.

## 8. Citas (regla de mutación 4) — detector `--sha HEAD`
Sin bloqueos, línea base 0, 0 cabeceras inválidas. 18 abreviadas rotas informativas: 13 preexistentes y ajenas (`CLAUDE.md:349`, `ENTRADA.md:1838`, specs de permisos y transiciones, etc.), y **5 nuevas en `openspec/changes/prefijo-deducido-en-el-alta/apply-progress.md:105` y `:108`** (`:21-111`, `:86-88`, `:69-82`, `:74-181`, `:99-102`): son citas ajenas ya desfasadas que ese informe lista como tales y que el detector atribuye al último fichero nombrado. Caso B (descriptivas). Ver S-1.
Casos que dejó el cambio para Supervisión: `openspec/config.yaml:4714` y `:4724` (B, anclar a `968bb53`); `docs/sdd/ENTRADA.md:296`, `:463` (B/C); `openspec/specs/tickets-core/spec.md:82`, `:1463`, `:165` (C, las cubre el delta al archivar); `debt.md:765-771` (C, cerrado por este cambio). Reparadas en la rama: `F0-00_Baseline_as_built.md:314` y el plan `:177`.

## 9. Coherencia con el diseño
DD-3 (ciclo `ticketCreate`↔`flujos`): `npm test` y `tsc` pasan. DD-5 (constantes tipadas contra `TIPOS_SERVICIO`) presente (`TIPO_CALIBRACION`, `TIPO_PROTOCOLO`). DD-9 confirmada por mí (M-16). Retirada de `parseCodigoFromPotential` y `defaultPrefijoFor` limpia (typecheck verde). Desvío menor: el plan 2.4 esperaba (b) y (c) nacidas verdes y nacieron rojas porque la guarda vieja existía; declarado en apply-progress, sin efecto.

## 10. Hallazgos
**CRITICAL:** ninguno.

**WARNING**
- **W-1.** El delta (`specs/tickets-core/spec.md:11`) afirma que RQ-TC-05 «conserva sus 13» escenarios; el bloque tiene **11**, y la spec viva (`openspec/specs/tickets-core/spec.md:126`) también tiene 11. Afirmación falsa que puede confundir la fusión por script al archivar. Corregir la frase («sus 13» → «sus 11») antes de archivar; el contenido del bloque es correcto.
- **W-2.** «Los tickets existentes no cambian» no tiene prueba de ejecución: se sostiene por la ausencia de migración (comprobada, vacía). Aceptable por ser negativo y estructural, pero queda declarado.
- **W-3.** Pendientes de persona que archivar no da por hechos (regla del ciclo 1): los tres escenarios manuales de RQ-TC-63 tras el despliegue, la medición de si Drive o n8n dependen del prefijo (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1174`, E-094) y la corrección (35) del maestro que debe pegar Gerencia.

**SUGGESTION**
- **S-1.** `apply-progress.md:105`/`:108` generan 5 abreviadas rotas informativas; reescribirlas en prosa o con fichero y revisión las quitaría del informe del detector.
- **S-2.** Anclar `openspec/config.yaml:4714`/`:4724` y `ENTRADA.md:296`/`:463` en el próximo corte de Supervisión.
- **S-3.** M-12 la mata una sola prueba; para redundancia, que «cliente viejo» compruebe también el asunto.

## 11. Qué no ejecuté
Los tres escenarios manuales del `.tsx` (fuera de la red). Las pruebas de integración con base real (11 omitidas por diseño). El efecto sobre Drive/n8n. No repetí `npm test` (salió 0 a la primera). No commiteé ni usé `gentle-ai sdd-attempt`.

## 12. Próximo paso
`sdd-archive`, tras corregir W-1 en el delta. Al archivar: `cierra: si`, el `archive-report.md` dice en una línea qué parte de F1B-03 cubrió, y W-3 va declarado aparte con dueño.
