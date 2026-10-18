```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:d6935ca0103d857b1eb400aa990096a9326409d1d733d922911aee2af5cb647e
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 3/3
scenarios: 13/13
test_command: npx vitest run
test_exit_code: 0
test_output_hash: sha256:661ebddc859e5d56d9c31055010d603adb728990e7c18c1f210302f89a1eb9c6
build_command: npm run typecheck
build_exit_code: 0
build_output_hash: sha256:f9de8b15b07069fcbf31f4a415061f4b90d66551059b5518c6d53e721545e547
```

# Informe de verify — `tipo-evento-transicion` (F1C-04, `cierra: si`)

Verificado sobre `01edc33` (partida `f64ea71`; propuesta `9b82c14`, diseño y tareas `67670be`, lote 1 `b3d10cd`, lote 2 `01edc33`), en el worktree de la rama. **Veredicto: PASS WITH WARNINGS.**
0 CRITICAL · 3 WARNING · 5 SUGGESTION. Modo: strict TDD (`npx vitest run`). Los 3 requisitos nuevos (RQ-TS-44, RQ-TS-45, RQ-TZ-21) y la sección 3.5 modificada tienen prueba que pasó en tiempo de ejecución; un escenario (el que exige que no compile) lo cubre el compilador y no una prueba persistente (W3). Nada de `apply-progress.md` se tomó sin contrastarlo.

## 1. Códigos (por separado, sobre `01edc33`, cada uno con su código de salida capturado sin tubería)

| Código | Resultado |
|---|---|
| `npx vitest run` | 0 · 297 ficheros pasan (3 omitidos), 4.968 pruebas pasan (11 omitidas) |
| `npm run typecheck` | 0 |
| `npx tsc -p packages/shared/tsconfig.json --noEmit` | 2 (línea base): exactamente `fasesBlueprint.test.ts` (33,53) TS7053 y `reasignacion.test.ts` (60,57) TS2345, ambos de `packages/shared/src`; ningún error nuevo |
| `npx eslint .` | 0 · 0 errores, 165 avisos (el tope de partida) |
| `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` | 0 · 7.384 comprobadas, línea base 0, cabeceras R-1 inválidas 0; 13 abreviadas rotas informativas, todas atribuidas a ficheros que este cambio no toca (p. ej. `openspec/specs/permissions/spec.md` línea 42, `openspec/specs/transitions-st/spec.md` líneas 33 y 484): *hipótesis* de que son las mismas 13 de la partida |
| Focal: `tipoEvento.test.ts`, `historialTipoEvento.test.ts`, `comentariosVigilados.test.ts` | 0 · 20 de 20 (9 + 5 + 6) |

`git status --porcelain` vacío antes y después de cada mutación; al final sólo aparece este informe. El `npm run build` (tarea 1.7, tamaño del paquete) **no se repitió**: la cifra `index-C7NdRWwC.js` 418.292 a `index-CtuL2ALD.js` 419.433 bytes es de `apply-progress.md`, *hipótesis* para mí.

## 2. Escenario a prueba

Rutas relativas a la raíz. `TE` = `packages/shared/src/tipoEvento.test.ts`; `HT` = `apps/desk/server/db/historialTipoEvento.test.ts`; `TS` = `openspec/changes/tipo-evento-transicion/specs/transitions-st/spec.md`; `TZ` = `openspec/changes/tipo-evento-transicion/specs/trazas/spec.md`. C = COMPLIANT, P = PARCIAL.

| Requisito · escenario | Evidencia | |
|---|---|---|
| RQ-TS-44 · toda transición de todo catálogo tiene un tipo de la lista (`TS:69-72`) | `TE:56-59` (barrido de las 47 contra `TIPOS_EVENTO` y la tupla exacta); `TE:43-48` (47 ids distintos, 33/7/5/2) | C |
| RQ-TS-44 · la tabla fijada coincide con la normativa (`TS:74-78`) | `TE:37-39` (catálogo a tabla), `TE:40-42` (tabla a resolutor), `TE:49-55` (21/14/9/3 total y por catálogo); la tabla está en `TE:12-31`, escrita a mano; M3 | C |
| RQ-TS-44 · una transición sin tipo no compila (`TS:80-84`) | no hay prueba persistente: lo ejecuta `npm run typecheck`; M1 reproducida, §5 | P (W3) |
| RQ-TS-44 · un ejemplo por tipo (`TS:86-89`) | `TE:60-63` | C |
| RQ-TS-45 · un id de cada catálogo y de paso del servidor se resuelve (`TS:101-104`) | `TE:67-70` (`aprobacion`, `producto_no_conforme`, `ejecutar_soporte`, `remision_retirada`) | C |
| RQ-TS-45 · creación y marcadores de migración sin tipo (`TS:106-109`) | `TE:71-73` (`enviar`, `migracion_f1f01_abiertos`, `migracion_f1c09_pendiente`) | C |
| RQ-TS-45 · un id retirado no tiene tipo (`TS:111-114`) | `TE:71-73` (`marcar_pendiente`, en el mismo bucle) | C |
| RQ-TS-45 · la ausencia de id no lanza (`TS:116-119`) | `TE:74-76` (`null`, `undefined`, `''`) | C |
| RQ-TZ-21 · `aprobacion` sale Decisional (`TZ:26-29`) | `HT:21-25` | C |
| RQ-TZ-21 · un `tipoEvento` falso en `values` se ignora (`TZ:31-34`) | `HT:26-30`; M4 | C |
| RQ-TZ-21 · un marcador de migración no tiene tipo (`TZ:36-39`) | `HT:31-38` (los dos ids; exige la propiedad presente y `null`) | C |
| RQ-TZ-21 · la fila anterior se clasifica igual (`TZ:41-44`) | `HT:39-47` (compara las dos **y** exige `['Decisional','Decisional']`); M5 declarada, no repetida | C |
| RQ-TZ-21 · la creación no lleva tipo (`TZ:46-49`) | `HT:48-55` (propiedad ausente y `undefined`); M6 | C |
| RQ-TZ-21 · abrir el historial no escribe (viñeta de `TZ`, no escenario) | no hay prueba con una fila de transición con tipo; lo fijan las existentes `apps/desk/server/db/eventoReasignacion.test.ts:84-93` y `apps/desk/server/db/traspaso.test.ts:151-154` (verdes en la suite completa); el cambio no añade ninguna sentencia (S3) | C |
| §3.5 MODIFIED (`TS:123-140`) | texto; sin prueba posible. Se fusiona al archivar | — |

Cobertura de escenarios: 13 de 13; 12 con prueba en ejecución y uno (compilación) con el compilador.

## 3. Tabla normativa contra el código y contra la prueba (script mío, fuera del repo)

Script de sólo lectura en `C:\Users\algar\AppData\Local\Temp\claude\C--dev-Desk-2-R1-023\03242eed-30f8-4469-bc19-b98fa9dd1b6f\scratchpad\mut\verify\cmp3.mjs`: lee las dos tablas de `TS:27-57` (47 filas) y recorre `packages/shared/src/transitions.ts` emparejando cada `id` con el `tipoEvento` de su mismo objeto (acierta también las dos entradas de una misma línea física, `packages/shared/src/transitions.ts:262`).

| Comparación | Filas | Diferencias |
|---|---|---|
| tabla normativa (delta) contra valores de `packages/shared/src/transitions.ts` | 47 contra 47, sin ids repetidos | **0** |
| tabla normativa (delta) contra tabla fijada de `TE:12-31` | 47 contra 47 | **0** |
| recuentos de la delta | 21 / 14 / 9 / 3 | coinciden con `TE:49-55` y con lo que cuenta el script |

Nota de método: una primera versión de mi script sólo leía la primera entrada por línea y dio una diferencia falsa en `facturar` (la línea `packages/shared/src/transitions.ts:262` lleva `anulacion` y `facturar`); está corregido y la cifra de arriba es la de la versión buena. El fichero `transitions.ts` tiene 49 apariciones de `tipoEvento`: 47 valores, el campo de `interface Transition` y su comentario.

## 4. Posiciones y adición al final (regla de mutación 4, parte de líneas)

| Fichero | Partida a HEAD (`wc -l`) | `git diff --numstat f64ea71 HEAD` |
|---|---|---|
| `packages/shared/src/transitions.ts` | 397 a 397 | **47 / 47** |
| `apps/desk/server/db/historial.ts` | 162 a 162 | **2 / 2** |
| `packages/shared/src/types.ts` | 810 a 810 | **1 / 1** |
| `packages/shared/src/index.ts` | crece al final | 1 / 0 (`export * from './tipoEvento'`, la última línea) |

Pruebas editadas en su sitio, 1/1 o 2/2: `packages/shared/src/mapaBlueprint.test.ts`, `packages/shared/src/sla.test.ts`, `apps/desk/server/services/avisoArea.test.ts`, `apps/desk/server/transitionExec.test.ts` (los seis literales de D4, todos con `Operativo`) y `apps/desk/server/reconciliacion/registro.test.ts` (ocho a nueve «en curso»; ya lo declaraba la propuesta, §3). `packages/shared/src/comentariosVigilados.test.ts` pasa: las anclas de `transitions.ts` no se movieron.

## 5. Mutaciones reproducidas por mí (copia guardada en `…\scratchpad\mut\verify\`, restauración por copia y `cmp` idéntico, ningún `git checkout`, `restore` ni `stash`)

| # | Mutación | Resultado |
|---|---|---|
| M1 | quitar `tipoEvento: 'Decisional'` de `aprobacion` en `packages/shared/src/transitions.ts:202` | **rojo**: `npm run typecheck` sale con 2 y da `transitions.ts(202,3): error TS2741: Property 'tipoEvento' is missing…` dos veces (una por programa de `tsc`); confirma la hipótesis de D6 de que ese script ve `transitions.ts` |
| M2b | `tipoEvento: 'Logístico' as never` en la misma entrada | **rojo**: 6 de 9 en `tipoEvento.test.ts` (catálogo a tabla, tabla a resolutor, recuentos, **barrido en ejecución**, ejemplo, resolución de RQ-TS-45); no repetí que `tsc` queda verde con `as never` (lo declara `apply-progress.md`) |
| M3 | `aprobacion` de Decisional a Operativo (misma línea) | **rojo**: 5 de 9 (catálogo a tabla, tabla a resolutor, recuentos, ejemplo, RQ-TS-45) |
| M4 | `apps/desk/server/db/historial.ts:51` lee antes `json(fila.values)?.tipoEvento` | **rojo**: 1 de 5, «un `values` con otro tipo no lo cambia» (`HT:26-30`) |
| M6 | `eventoCreacion` (`apps/desk/server/db/historial.ts:32`) devuelve además `tipoEvento: null` | **rojo**: 1 de 5, «el evento de creación no lleva la propiedad tipoEvento» (`HT:48-55`) |

Ninguna sobrevivió. M2 (`'Logístico'` sin forzar), M5a y M5b no las repetí: las declara `apply-progress.md` (*hipótesis* de que caen como allí se anota); M5 está además cubierta por el rojo natural de las pruebas de `HT` en el lote 2.

## 6. Evidencia TDD

`apply-progress.md` lleva tablas de «Rojo visto» y «Verde» por tarea y por lote, no una tabla «TDD Cycle Evidence» con las columnas del módulo (W1, de forma). Contraste con la ejecución:
- `packages/shared/src/tipoEvento.test.ts` existe (77 líneas) y pasa 9 de 9; `apps/desk/server/db/historialTipoEvento.test.ts` existe (56 líneas) y pasa 5 de 5. Coinciden con «9/9» y «5 de 5».
- Triangulación: la tabla de 47 filas se compara en las dos direcciones (`TE:37-42`); `HT:39-47` compara las dos filas y además exige Decisional, para no nacer verde con las dos en `undefined`; hay cuatro ids sin tipo (`TE:71-73`) y tres ausencias (`TE:74-76`).
- La prueba de creación (`HT:48-55`) nace verde por construcción y se valida con M6; está declarado en `tasks.md` (2.1) y lo confirmo.

**Auditoría de aserciones.** Sin tautologías. Los bucles `for…of` de `TE:38` y `TE:41` recorren la tabla de 47 y el catálogo, ambos con cardinalidad fijada antes por `TE:43-48`, así que no pueden estar vacíos; los de `TE:72` y `TE:75` recorren ids literales. Los `toBeNull` van emparejados con pruebas de valor (`TE:67-70`, `HT:21-25`). Capas: unidad (`packages/shared`) y servidor con pg-mem; sin integración de interfaz ni E2E (los `.tsx` están fuera de la red, F0-00). Cobertura de los ficheros cambiados: no medida (S4).

## 7. Regla invariable 13 y regla de mutación 3

`git diff --stat f64ea71 HEAD -- apps/desk/src` está **vacío**: ningún fichero de `apps/desk/src` cambió, así que no existe decisión del cliente que enumerar. Coincide con `openspec/changes/tipo-evento-transicion/proposal.md` §6 («ninguna») y con D9: el cliente no importa `tipoEvento.ts`. El único que deriva el tipo es el servidor, en `apps/desk/server/db/historial.ts:51`, a partir de `transition_id` (seleccionado en `apps/desk/server/db/historial.ts:137`) y de ninguna otra fuente. **Cumple.**

## 8. Regla de mutación 4 sobre `transitions.ts`, `historial.ts`, `types.ts`

Ninguna línea se movió (§4), así que el riesgo es sólo de CONTENIDO. Barrido propio de las citas a `transitions.ts` en `:55-62`, `:60`, `:74` y `:150-151`, a `types.ts` en `:611` y a `historial.ts`, contra la tabla de D8 (`openspec/changes/tipo-evento-transicion/design.md`):

| Cita | Afirmación | Tratamiento comprobado |
|---|---|---|
| `openspec/specs/transitions-st/spec.md:1137-1142` en `f64ea71` | «sólo declara `id`, `name`, `from`, `to`, `area`, `fields`» | Caso C; lo sustituye el §3.5 MODIFIED (`TS:123-140`), que ya está en la delta. Pendiente de fusionar al archivar (S2) |
| `openspec/specs/transitions-equipo-nuevo/spec.md:24-26`, `openspec/specs/transitions-soporte-remoto/spec.md:38-40` | «la misma forma de `Transition`» con la lista de campos | Caso A en lo normativo; la lista **queda incompleta** (no nombra `tipoEvento`). Las dos capacidades no están en la cabecera de capacidad y la rama no las toca, como dice D8 (W2) |
| `docs/sdd/F0-00_Baseline_as-built.md:71`, `openspec/specs/transitions-st/spec.md:118`, `docs/sdd/F0-01_Correcciones_para_el_maestro.md:505` | forma de su fecha | Caso B; no se tocan, y la rama no los toca |
| `packages/shared/src/estados.ts:83`, `packages/shared/src/mapaBlueprint.ts:11-12`, `packages/shared/src/invariantesGrafo.test.ts:111` | `transitions.ts:150-151` son los dos pasos sin `fields` | Caso A; sigue cierto: las dos constantes llevan `satisfies Omit<Transition, 'fields'>` (`packages/shared/src/transitions.ts:150-151`) |
| `docs/sdd/F0-00_Recomendaciones_R02.md:59` | `transitions.ts:74` contiene `cfDate` con `required = true` | `packages/shared/src/transitions.ts:74` conserva sus importaciones en línea; la línea `:60` lleva ahora el campo nuevo junto a `area` |

El detector da 0 bloqueos (§1). Las abreviadas no las barre el detector: *hipótesis* de que ninguna relevante se desplazó, porque ningún número de línea cambió. El segundo pase de abreviadas queda para el archive, que es donde D8 lo coloca.

## 9. Coherencia con el diseño

- D1: `packages/shared/src/tipoEvento.ts:7-8` (tupla cerrada y tipo) y `packages/shared/src/tipoEvento.ts:11-15` (resolutor; devuelve `null` para vacío, catálogo y los dos pasos). Importa `./flujos` y `./transitions` en tiempo de ejecución; `transitions.ts` sólo importa el tipo (`packages/shared/src/transitions.ts:60`): sin ciclo, las 20 pruebas focales cargan sin zona muerta.
- D2: `interface Transition` obligatorio en la línea de `area`, 47/47 y 397 = 397 (§4).
- D4: los seis literales, en `Operativo`.
- D5: `apps/desk/server/db/historial.ts:51` con comprobación de tipo sobre `transition_id` en vez de `as string`; `eventoCreacion` y la línea de traspaso `apps/desk/server/db/historial.ts:143` sin cambio (el diff de `historial.ts` toca sólo dos líneas, la de importaciones y la del evento); `packages/shared/src/types.ts:611` declara `tipoEvento` opcional, con `null`.
- D9: nada de `apps/desk/src` cambia (§7); el paquete del cliente crece según lo medido por el apply (no repetido).
- Sin columna ni migración: el diff no toca `packages/zoho-sync` ni `schema.sql`.
- Cabecera R-1 de `openspec/changes/tipo-evento-transicion/proposal.md:1-9`: siete campos (`tanda: F1C-04`, `motivo` vacío, `capacidad: [transitions-st, trazas]`, `cierra: si`, `toca_maestro: si`, `origen_cabecera: declarada`). Las dos capacidades existen en `openspec/specs/` (R-2 no aplica: no se crea ninguna). El detector da 0 cabeceras inválidas.
- RQ-TS-44 y RQ-TZ-21 son los siguientes números libres tras RQ-TS-43 y RQ-TZ-20 de las specs vivas.

## 10. Criterios de éxito de la propuesta (`proposal.md`, «Criterios de éxito»)

| Criterio | Resultado |
|---|---|
| Las 47 llevan su tipo de la tabla de §3, y una sin tipo o ajeno no compila | **Cumple**: 0 diferencias por script (§3); M1 en rojo por compilación (§5); el tipo ajeno lo da el mismo compilador (M2 declarada, no repetida) y, forzado, el barrido (M2b) |
| El historial expone `tipoEvento` derivado del catálogo, `null` fuera de catálogo, inmune a `values` | **Cumple**: `HT:21-38`; M4 |
| M1-M5 rojas al mutar | **Cumple** para las que reproduje (M1, M2b, M3, M4, M6) y por declaración para M2 y M5 |
| `transitions.ts` con el mismo número de líneas | **Cumple**: 397 = 397, 47/47 |
| Cifras ancladas sin cambio | **Cumple**: `packages/shared/src/cifrasAncladas.test.ts` pasa en la suite completa (sin cambio de 33/22/41) y `TE:43-48` fija 33/7/5 |

## 11. Lo que la tanda dice y no hizo, y alcance de más

- **Nada dicho y no hecho.** Las tareas 1.1 a 2.4 de `openspec/changes/tipo-evento-transicion/tasks.md` están marcadas y coinciden con el código (comprobé 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2 y 2.3; 1.7 y 1.8 son medidas del apply, §1). Las casillas 3.1 (este verify) y 3.2 (archive) siguen sin marcar, a propósito.
- **Sin alcance de más.** El diff completo contra `f64ea71` son: los ficheros de `packages` y `apps/desk/server` de §4, `registro.test.ts` (previsto) y la carpeta del cambio. No hay `.tsx`, ni migración, ni `docs/sdd`, ni `openspec/config.yaml`, ni `openspec/specs/` (el archive los toca). Ninguna pantalla pinta el tipo, como pide RQ-TZ-21.

## 12. Hallazgos

**CRITICAL:** ninguno.

**WARNING**
- W1 · `apply-progress.md` no lleva una tabla «TDD Cycle Evidence» con las columnas RED / GREEN / TRIANGULATE / SAFETY NET, sino tablas de rojo y verde por lote. El rojo está contrastado (§6); es de forma. Mismo aviso que en el verify de `facturar-dos-ramas`.
- W2 · **Dos capacidades hermanas quedan con una enumeración incompleta de la forma de `Transition`:** `openspec/specs/transitions-equipo-nuevo/spec.md:24-26` y `openspec/specs/transitions-soporte-remoto/spec.md:38-40` listan `id, name, from, to, area, fields` sin `tipoEvento`. D8 lo decide (no se editan aquí, caso A) y exige anotarlo en el `archive-report.md` y en el texto para Supervisión; si el archive no lo escribe, nadie lo hará (R-3).
- W3 · El escenario «una transición sin tipo no compila» (`TS:80-84`) no tiene prueba persistente: lo comprueba `npm run typecheck`, y es más débil que una prueba, porque ninguna prueba falla si alguien relaja el campo a opcional en `packages/shared/src/transitions.ts:60` y deja los 47 valores rellenos. *Hipótesis* (no la medí): esa mutación sobrevive a `npx vitest run` en los valores y sólo la vería el compilador donde se use el campo como obligatorio.

**SUGGESTION**
- S1 · `tasks.md` 1.4 dice «32 de servicio, 7 de equipo nuevo, 5 de soporte remoto» más los 2 pasos: suma 46. Son 33 de servicio (la línea `packages/shared/src/transitions.ts:262` lleva dos); el código y la delta dicen 33. Corregir en el archive o dejarlo anotado.
- S2 · El encabezado de §3.5 en la delta (`TS:123`) dice «CERRADO en `tipo-evento-transicion` (F1C-04)» y el vivo (`openspec/specs/transitions-st/spec.md:1137` en `f64ea71`) dice «destino: sin tanda asignada». La fusión por script tiene que casar por el prefijo «### 3.5 · C5», no por el título entero. Es el mismo patrón de §3.6 (`openspec/specs/transitions-st/spec.md:1145`).
- S3 · «Abrir el historial no escribe» no tiene una prueba con una fila de transición con tipo; lo fijan las dos existentes (§2) y el cambio no añade ninguna sentencia. Suficiente; anotado.
- S4 · Cobertura de los ficheros cambiados no medida.
- S5 · Los títulos de escenario de ambas deltas llevan «— ROJO» (`TS:69`, `TZ:26`): quitarlo al fusionar o conservarlo por convención, como en F1C-01 y F1C-02.

## 13. Tareas de personas (no se dan por hechas al archivar)

Validar la tabla de 47 tipos (Gerencia, antes de la parte de Decisionales de F1C-05; S-1 y S-2 son supuestos, no fuente); actualizar M1.3 y M1.8 del maestro (texto para Supervisión en el `archive-report.md`); lista semanal de supuestos S-1 a S-8. Pruebas en la app: nada visible, sin entrada en la lista acumulada.
