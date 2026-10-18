# Informe de verify — `anulado-con-motivo` (F1C-01, `cierra: si`)

Verificado sobre `04339d6` (partida `200a9b5`; planificación `30fa8dc`, specs `594ca0b`, lote 1 `bb350be` y `490915f`, lote 2 `04339d6`), en el worktree de la rama. **Veredicto: PASS WITH WARNINGS.**
0 CRITICAL · 6 WARNING · 5 SUGGESTION. Modo: strict TDD (`npm test`, vitest). Los 12 requisitos y 46 escenarios de los cuatro deltas tienen prueba que pasó en tiempo de ejecución, salvo cuatro escenarios heredados sin prueba (W1, W2) y los declarados de persona.

## 1. Códigos (los cuatro, por separado, sobre `04339d6`)

| Código | Resultado |
|---|---|
| `npm test` | 0 · 292 ficheros pasan (3 omitidos), 4.885 pruebas pasan (11 omitidas) |
| `npm run typecheck` | 0 |
| `npm run lint` (`npx eslint . -f json`) | 0 · 0 errores, 165 avisos (el tope de partida) |
| `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` | 0 · 7.287 comprobadas, línea base 0, cabeceras R-1 inválidas 0; 13 abreviadas rotas informativas (ninguna de los ficheros de este cambio) |

`git status --short` vacío en el worktree antes y después de cada paso. El `npm run build` del lote 2 (apply-progress.md) no se repitió aquí: *hipótesis* de que sale 0 como dice el informe.

## 2. Escenario → prueba

Rutas relativas a la raíz del repositorio.

| Requisito · escenario | Evidencia |
|---|---|
| RQ-TS-40 · Comercial anula con motivo de la lista | `apps/desk/server/anulacion.test.ts:41-53` (200, `Anulado`, `Closed`, traza y `custom_fields`), `:54-58` (cinco orígenes), `:59-62`, `:63-67`; M5 |
| RQ-TS-40 · sin motivo, 422 | `apps/desk/server/anulacion.test.ts:71-79` (y el ticket no se mueve), PA-3 `:134-139`; M2 |
| RQ-TS-40 · motivo fuera de lista, 422 con la lista | `apps/desk/server/anulacion.test.ts:80-86`; `packages/shared/src/anulacion.test.ts:73-82`; M1 |
| RQ-TS-40 · «Otro» sin detalle, 422 | `apps/desk/server/anulacion.test.ts:87-93`; `packages/shared/src/anulacion.test.ts:96-105`; M10 |
| RQ-TS-40 · 403 antes que 422 | `apps/desk/server/anulacion.test.ts:97-103` y PA-1 `:120-129` (las dos guardas activas a la vez, con control); M4 |
| RQ-TS-40 · desde `Solicitado` y SKU, 409 | `apps/desk/server/anulacion.test.ts:104-109`, PA-2 `:130-133`; M4b |
| RQ-TS-40 · un anulado sale de los abiertos | `apps/desk/src/lib/boardView.test.ts:180-190` (caracterización: el ticket ya entra `Closed`) más `Closed` desde el servidor en `apps/desk/server/anulacion.test.ts:47`. Dos mitades, ninguna prueba la cadena entera (W4) |
| RQ-TS-40 · estado, cinco motivos, S-8 | `packages/shared/src/anulacion.test.ts:38-56`, `:133-147`; S-8 en `packages/shared/src/reasignacion.test.ts`, `apps/desk/server/services/avisoArea.test.ts`, `apps/desk/server/db/traspaso.test.ts`; M11 |
| RQ-TS-04 · `Finalizado` y `Anulado` únicos sin salida | `packages/shared/src/invariantesGrafo.test.ts:62-66`; en la unión `:177-180` |
| RQ-TS-04 · `Notificado` conserva sus tres salidas | **sin prueba** (W2). Medido con script: `devolucion_a_correccion`, `reporte_por_garantia`, `escalado_a_comercial` |
| RQ-TS-04 · `Pendiente` con salida | `packages/shared/src/transitionsSoporteRemoto.test.ts:49` |
| RQ-TS-04 · `Anulado` produce `Closed` | `apps/desk/server/anulacion.test.ts:41-53` y los otros dos flujos `:143-151`, `:164-172`; M5 cae en los tres |
| RQ-TS-05 · alcanzabilidad 19 / 19 / 20 | **sin prueba**; cifras medidas, §3 (W1) |
| RQ-TS-26 · 32 / 40 / 21 | `packages/shared/src/cifrasAncladas.test.ts:58-75` (lee `openspec/config.yaml → cifras_ancladas`) |
| RQ-TS-26 · `esperas` coherente con `Pendiente` | **sin prueba** (lectura de `openspec/config.yaml:1330-1357`, sin tocar). Heredado (W2) |
| RQ-EN-01 · siete pares; `sinSalida`; pares de `Verificación` | `packages/shared/src/invariantesGrafo.test.ts:200-211`, `:177-180`; ciclo y cero fechas: `packages/shared/src/reentrancia.test.ts:191-200` |
| RQ-EN-01 · campos declarados | `packages/shared/src/invariantesGrafo.test.ts:213-218` |
| RQ-EN-01 · mutaciones «quitar tres / quitar una» | descritas como mutación en la spec, no como prueba; las cazan `packages/shared/src/invariantesGrafo.test.ts:177-180` y `:200-211` por construcción |
| RQ-EN-01 · Liberación y Rechazo de verificación ejecutan (E1, E2) | heredadas, sin cambio: `apps/desk/server/flujoEquipoNuevo.test.ts` |
| RQ-EN-01 · Comercial anula equipo nuevo (E3) | `apps/desk/server/anulacion.test.ts:143-155` |
| RQ-EN-02 · las seis exigen Servicio Técnico; la anulación, Comercial | `apps/desk/server/flujoEquipoNuevo.test.ts:100` (con la anulación filtrada); `apps/desk/server/anulacion.test.ts:156-163`; M3b |
| RQ-EN-13 · el área la vigila una prueba | `packages/shared/src/invariantesGrafo.test.ts:215`; M3b cae ahí |
| RQ-SR-01 · cinco pares; sin salida extra desde `Solicitud Soporte` (S-5) | `packages/shared/src/invariantesGrafo.test.ts:240-252`, `packages/shared/src/transitionsSoporteRemoto.test.ts:49-50`, `apps/desk/server/anulacion.test.ts:173-179` |
| RQ-SR-01 · campos y cero fechas reentrantes | `packages/shared/src/invariantesGrafo.test.ts:254-260`; `packages/shared/src/reentrancia.test.ts:214-217` |
| RQ-SR-01 · Comercial anula desde `Pendiente` | `apps/desk/server/anulacion.test.ts:164-172` |
| RQ-SR-02 · las cuatro exigen ST; la anulación, Comercial | `apps/desk/server/flujoSoporteRemoto.test.ts:39`; `apps/desk/server/permisos.test.ts:324`; `apps/desk/server/anulacion.test.ts:180-187`; M3c |
| RQ-SR-05 · las cinco del catálogo, 409 de flujo, heredado no varado | heredadas, sin cambio: `apps/desk/server/flujoSoporteRemoto.test.ts:73`, `:83`, `:92`, `:100`; `apps/desk/server/anulacion.test.ts:188-191` |
| RQ-TC-71 · finalizados y tendencia; tiempo; OTD; creado y activo | `packages/shared/src/analisisAnulados.test.ts:16-20`, `:21-24`, `:25-28`, `:29-36`; M6, M7, M8 |
| RQ-TC-71 · la ficha de cliente no promedia anulados | `packages/shared/src/analisisAnulados.test.ts:41-47`; S-5 |
| RQ-TC-72 · la consulta sólo lee y el guardián cae al ensuciar el `.sql` | `apps/desk/server/consultaCandidatosAnulado.test.ts:14-37`; M9, M9b |
| RQ-TC-72 · lista los candidatos | **verificación de persona** declarada (P-1): pg-mem no ejecuta la consulta (apply-progress.md, lote 2) |

## 3. Alcanzabilidad de RQ-TS-05, medida (cierre transitivo sobre `TRANSITIONS`, script de sólo lectura fuera del repo)

`TRANSITIONS` 32, `ESTADOS_SERVICIO` 21. Desde `OV asignada`: **19**, no alcanza `Ticket creado` ni `Remisión creada`. Desde `Ticket creado` sólo por botones: **19**, no alcanza `OV asignada` ni `Remisión creada`. Sumando `TRANSICION_REMISION_CONFIRMADA` (y también con la retirada): **20**, no alcanza sólo `OV asignada`. **El delta acierta en las tres cifras y en los estados no alcanzados.** `Anulado` queda dentro de los alcanzados. Lo que no hay es prueba que las fije (W1).

## 4. Evidencia TDD (rojo reproducido)

Worktree temporal `anu-verify-rojo` sobre `594ca0b` con `node_modules` por junction y las cuatro pruebas nuevas de `04339d6`: `npx vitest run` de las cuatro da **44 caen y 1 pasa** (45 casos que cargan), 4 de 4 ficheros en rojo.
- `apps/desk/server/anulacion.test.ts`: **34 de 34** en rojo (`400` «Transición desconocida» en vez de 200, 403, 409 o 422).
- `packages/shared/src/anulacion.test.ts`: el fichero no carga (`./anulacion` no existe); sus 37 casos no pueden correr.
- `packages/shared/src/analisisAnulados.test.ts`: **6 de 6** en rojo.
- `apps/desk/server/consultaCandidatosAnulado.test.ts`: **4 de 5** en rojo; pasa «no escribe» en vacío (el fichero no existe), que vigila M9.

Coincide con `apply-progress.md` (34 de 34, 37 sin cargar, 6 de 6, 4 de 5). Carpeta y worktree eliminados (`git worktree list` sólo muestra main y la rama). Las 3 caracterizaciones de `boardView.test.ts` nacen en verde y así se declaran.

**Auditoría de aserciones:** sin tautologías, sin bucles fantasma (los `for` recorren catálogos de longitud fijada con `toHaveLength` o listas literales), sin pruebas de humo. Las claves y los motivos de `apps/desk/server/anulacion.test.ts` van a mano para no depender de lo vigilado. El guardián del `.sql` es de texto, por diseño (regla de mutación 2). Capas: unidad (shared) y servidor con `supertest` y pg-mem; sin E2E (los `.tsx` están fuera de la red, F0-00). Cobertura de los ficheros cambiados: no medida.

## 5. Mutaciones reproducidas (`mut.mjs`, restauradas, `git status --short` vacío)

| # | Resultado |
|---|---|
| M0 control | 82 de 82 en verde |
| M1 motivo fuera de la lista pasa | rojo: 9 (4 de shared, 5 de servidor) |
| M2 motivo sin `required` | rojo: 6 |
| M3 área `Servicio Técnico` (una por catálogo) | rojo: 5 servicio, 5 equipo nuevo, 7 soporte remoto (propias, `invariantesGrafo` y matriz de `permisos.test.ts`) |
| M4 guarda del motivo antes del `403` de área (reemplazo literal único en `ticketService.ts`: un `throw` 422 previo a la guarda de área) | rojo: 3 (PA-1 y sus réplicas en equipo nuevo y soporte remoto) |
| M4b guarda del motivo antes del `409` de estado (extra) | rojo: 4 (PA-1, PA-2 y las dos réplicas) |
| M5 `Anulado` fuera de `CLOSED_STATUSES` | rojo: 3 (los tres `status_type = 'Closed'`). **`boardView.test.ts` no cae** (W4) |
| M6 quitar `!esAnulado` de `analisis.ts` | rojo: 4 de `analisisAnulados.test.ts` |
| M7 exclusión sólo en contador y tendencia | rojo: 3 (tiempo, OTD y creado/activo por su aserto de tiempo) |
| M8 exclusión sólo en contador, tendencia y tiempo | rojo: 2 (OTD y creado/activo) |
| M9 `UPDATE` en el `.sql` | rojo: «no escribe» |
| M9b `ROLLBACK` por `COMMIT` | rojo: «transacción de sólo lectura» |
| M10 «Otro» sin detalle pasa | rojo: 7 |
| M11 quitar el segundo operando de la condición de `packages/shared/src/transitions.ts:330` (S-8) | rojo: 5 (`packages/shared/src/reasignacion.test.ts`, `apps/desk/server/routes/reasignacion.test.ts`, `apps/desk/server/services/avisoArea.test.ts` ×2, `apps/desk/server/db/traspaso.test.ts`) |
| S-5 quitar la exclusión de `resolucionPromedioMs` | rojo: 2 |

Ninguna sobrevivió. M7 y M8 se expresaron como reemplazos de varias operaciones sobre `packages/shared/src/analisis.ts`, sin reescribir el bloque.

## 6. Regla invariable 13 (tabla D10 contra el código)

Ningún `.tsx` de `apps/desk/src` nombra `Anulado`, `anulacion` ni `MOTIVOS_ANULACION` (`git grep`; única coincidencia ajena, un comentario de remisiones en `apps/desk/src/api/client.ts:512`). Decisión a decisión:
- Orígenes: `from` del catálogo; 409 en `apps/desk/server/services/ticketService.ts:126-128`.
- Quién: `area: 'Comercial'`; 403 en `apps/desk/server/services/ticketService.ts:129-130`; cargo en `apps/desk/server/services/ticketService.ts:131`.
- Motivo obligatorio: `apps/desk/server/transitionExec.ts:77`. Lista y detalle de «Otro»: `erroresAnulacion`, sumada al 422 de `apps/desk/server/services/ticketService.ts:134`.
- Cerrado: `apps/desk/server/transitionExec.ts:5`. Las vistas del cliente sólo leen `statusType` (`apps/desk/src/lib/boardView.ts:41`, `apps/desk/src/lib/boardView.ts:47`, `apps/desk/src/lib/boardView.ts:48`, `apps/desk/src/lib/boardView.ts:50`).
- Métricas: `packages/shared/src/analisis.ts:59` y `packages/shared/src/cierreEnCifras.ts:53`, con prueba (§2); `Analisis.tsx` sólo pinta.
- Desplegable: `apps/desk/src/components/TransitionPanel.tsx:257-260` pinta las `options` del catálogo; comodidad legítima, la impone el servidor con prueba (regla 13, punto 3). El detalle de «Otro» no lo exige el panel: lo exige sólo el servidor.

**Coincide con D10; ninguna decisión vive sólo en el cliente.** Los demás consumidores del servidor leen `status_type` (`packages/zoho-sync/src/db/repo.ts:151`, `packages/zoho-sync/src/db/repo.ts:166`, `apps/desk/server/db/prioridadCliente.ts:110`), así que un anulado es cerrado en todos.

## 7. Líneas y citas (regla de mutación 4)

`wc -l` frente a `200a9b5` de los 40 ficheros existentes del diff: **igual** en 34, entre ellos `packages/shared/src/estados.ts` (190), `apps/desk/server/services/ticketService.ts` (277), `apps/desk/server/transitionExec.ts` (99), `packages/shared/src/analisis.ts` (95), `packages/shared/src/cierreEnCifras.ts` (69) y `openspec/config.yaml` (5.137). **Cambian:** `packages/shared/src/transitions.ts` 397→399 (las dos líneas de `anulacion_soporte`, justo antes del `]` final), `apps/desk/src/lib/boardView.test.ts` 174→190 (bloque nuevo AL FINAL) y cinco `docs/artefactos/blueprint-*.md` (`completo` 75→81, `equipo-nuevo` 32→37, `fase-2-diagnostico` 48→54, `fase-3-cierre` 30→38, `soporte-remoto` 28→31; `fase-1-entrada` sin cambio). Los edits de `estados.ts` y del resto de `transitions.ts` son en la misma línea: no desplazan.

Barrido `git grep -noE` de cada fichero que cambia de longitud (incluidos `openspec/changes/archive/` y `docs/`):

- `boardView.test.ts`: las citas (la de `CLAUDE.md` línea 251, los archivados y `docs/sdd/F0-00_Baseline_as-built.md`) apuntan a líneas menores o iguales a 80; el bloque es nuevo y va al final. **Ninguna se desplazó.**
- `transitions.ts`, catálogo de soporte remoto: antes ocupaba de la línea 388 (declaración) a la 397 (el `]`); hoy el `]` está en la 399 y `anulacion_soporte` ocupa la 397 y la 398. Las citas a `389-396`, `393-396`, `395-396` y `389-395` (las cuatro entradas viejas) **siguen siendo ciertas**. Las que citan `388-397` como el catálogo entero **pierden su extremo final**, y como la línea 397 existe y no está vacía el detector no salta:

| Cita a `388-397` (ficheros) | Qué afirma | Caso |
|---|---|---|
| `openspec/specs/transitions-st/spec.md` línea 1510 (spec viva) | el catálogo de soporte remoto no contiene la marca de alta manual | **A** · presente, sigue cierto; reapuntar a `388-399` |
| `docs/sdd/ENTRADA.md` línea 2123 | «ningún catálogo tiene estado ni transición de anulación» (`350-363` y `388-397`) | **C** · superado por este cambio (F1C-01); conservar con su revisión y añadir qué lo cierra |
| `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md` línea 52; `docs/sdd/Paquete_de_Despliegue_2026-09-30.md` línea 569; `…2026-10-01.md` línea 785; `…2026-10-04.md` línea 114; `…2026-10-04b.md` línea 141 | el catálogo de entonces, cuatro entradas (áreas en 389, 391, 393, 395) | **B** · fechado; nombrar la revisión |
| `openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/verify-report.md` líneas 83 y 215; `…/2026-10-02-alta-manual-equipo-cliente/` (`exploration.md` 62, `proposal.md` 67, `specs/transitions-st/spec.md` 13); `…/2026-10-08-mapa-blueprint-tres-flujos/` (`design.md` 33, `proposal.md` 135) | el catálogo de cuatro entradas en su revisión | **B** · archivo fechado |

- `docs/artefactos/blueprint-*.md`: 11 citas, todas en archivados y sin ancla `en <sha>` en su línea:

| Cita (archivo) | Qué afirma | Hoy | Caso |
|---|---|---|---|
| línea 54 de `blueprint-completo.md`, 44 de `blueprint-fase-2-diagnostico.md` y 22 de `blueprint-fase-3-cierre.md` (`archive/2026-10-02-rechazo-solo-comercial/`: `apply-progress` 21, `design` 44, `exploration` 69-71, `proposal` 37-38, `tasks` 48, `verify-report` 92) | la arista `e03 --> e17 : Rechazo` que pasó de `[C][ST]` a `[C]` | la arista está hoy en la 55 de `blueprint-completo.md`, la 45 de `blueprint-fase-2-diagnostico.md` y la 25 de `blueprint-fase-3-cierre.md`; las líneas citadas son otras aristas o un `state` | **B** · registro de lo hecho aquel día; nombrar la revisión de esa tanda, no renumerar |
| línea 13 de `blueprint-completo.md` (`archive/2026-10-02-rechazo-solo-comercial/exploration.md` 67) | `state "Notificación cliente" as e03` | sigue en la 13 (las inserciones son posteriores) | **A** · cierta, sin cambio |
| línea 31 de `blueprint-completo.md` (`archive/2026-10-01-tres-transiciones-cifra-anclada/design.md` 22) | «`Pendiente` es el último (`e21`)» | la 31 es hoy `state "Anulado" as e21` (era una arista en `200a9b5`, y `Pendiente` ya no es de servicio desde F1C-09) | **B** · plan fechado, falso hoy; nombrar la revisión |

- Las abreviadas (dos puntos y número, sin nombre de fichero) no las barre `grep`: *hipótesis* de que ninguna relevante se desplazó; el detector no da ninguna rota nueva. **Ninguna cita de hoy sin ancla de los ficheros editados se desplazó**, salvo el caso A de la spec viva indicado arriba. No se corrigió nada: lo repara el archive.

## 8. Cabecera R-1, capacidades y la fila F1C-01

`openspec/changes/anulado-con-motivo/proposal.md:1-9`: siete campos (`tanda: F1C-01`, `motivo: ""`, `capacidad` de cuatro, `maestro` de tres, `cierra: si`, `toca_maestro: si`, `origen_cabecera: declarada`). Las cuatro capacidades están en `openspec/config.yaml → capabilities` (`openspec/config.yaml:105`, `openspec/config.yaml:109`, `openspec/config.yaml:113`, `openspec/config.yaml:123`); no hay capacidad nueva (R-2 no aplica). El detector da 0 cabeceras inválidas.

**Fila F1C-01** (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:99`, «C2 estado Anulado con motivo»): queda cubierto el estado, el motivo de lista cerrada con «Otro» más texto, las tres transiciones de Comercial, el cerrado y las tres métricas excluidas (más la ficha de cliente, S-5). **Fuera, como tareas de persona (el archive no las da por hechas):** P-1 ejecutar la consulta y marcar el histórico (la consulta lista; marcar necesitará migración en otra tanda), P-2 revisar S-1 a S-9, P-3 pegar 21, 32 y 40 en el maestro, P-4 comprobar a mano la pantalla de Comercial. `cierra: si` es coherente con la regla del ciclo 1 y con la consecuencia 3 de `decision/c2-anulado`.

## 9. El `.sql` de candidatos (leído entero)

`docs/sdd/Consulta_Candidatos_Anulado_2026-10-18.sql` sólo contiene `BEGIN TRANSACTION READ ONLY;` (línea 23), un `WITH … SELECT` (líneas 25 a 62) y `ROLLBACK;` (línea 64); ningún `INSERT`, `UPDATE`, `DELETE`, `ALTER` ni `CREATE` fuera de los comentarios. Sus CTE `rech_desk` y `rech_zoho` (líneas 25 a 42) reproducen los predicados del bloque A de `docs/sdd/Consultas_Recuentos_2026-09-25.sql:14-54` (los tres ids de Desk; la propiedad Transition con nombre Rechazo en `actorInfo` y `eventInfo`), con `MIN(fecha)` en lugar de `DISTINCT` para poder dar la fecha; `llegada` añade el último paso a Finalizado. Las columnas `event_time`, `performed_at`, `to_status` y `closed_time` existen en `packages/zoho-sync/src/db/schema.sql:26`, `packages/zoho-sync/src/db/schema.sql:57-60` y `packages/zoho-sync/src/db/schema.sql:244-248`. *Hipótesis:* la consulta no está probada por ejecución (pg-mem la rechaza) y la columna `numero` concatena el signo almohadilla con `t.number`, lo que presupone que Postgres acepta texto concatenado con entero; la comprueba la persona en producción (P-1).

## 10. Hallazgos

**CRITICAL:** ninguno.

**WARNING**
- W1 · **RQ-TS-05 no tiene prueba.** Las cifras 19, 19 y 20 del delta son correctas (§3), pero ninguna prueba las fija pese a que el requisito dice «la cifra se fija en la prueba»; `git grep` no halla ninguna prueba de alcanzabilidad en `packages/shared/src` ni en `apps/desk/server`, y este cambio no retiró ninguna (hipótesis: el hueco es heredado, la spec viva dice lo mismo). Los escenarios «alcanzabilidad desde `OV asignada`» y «no hay huérfanos con el paso sin botón» quedan sin cobertura en tiempo de ejecución.
- W2 · Dos escenarios heredados sin prueba: RQ-TS-04 «`Notificado` conserva sus tres salidas» (cierto, §2) y RQ-TS-26 «la mención a `Pendiente` de `esperas` queda coherente» (lectura de `openspec/config.yaml:1330-1357`).
- W3 · `tasks.md` 3.5 (cierre del intento 3) sigue sin marcar. El commit `04339d6` existe y el detector `--sha HEAD` da 0 (§1); el build no se repitió aquí. 4.1 es este informe y 5.1 es el archive: se marcan al asentar. `apply-progress.md` no lleva una tabla «TDD Cycle Evidence» con columnas, sino prosa y tablas de rojo y verde por lote; el rojo está reproducido (§4), así que es de forma.
- W4 · D9 anunciaba que M5 caería en «cerrado y vistas». Cae en cerrado (3), pero `apps/desk/src/lib/boardView.test.ts:180-190` no cae: construye el ticket ya `Closed` y no ejecuta el servidor. El escenario «un anulado sale de los abiertos» queda cubierto por dos mitades, no por la cadena. `apply-progress.md` lo declara.
- W5 · Cita desplazada con caso A: la línea 1510 de `openspec/specs/transitions-st/spec.md` apunta a `388-397` y el catálogo ocupa hoy `388-399` (§7). Más cinco casos B o C de citas a ese rango y once de `blueprint-*.md` que el archive debe anclar o reapuntar según las tablas.
- W6 · El delta de `transitions-soporte-remoto` dice en RQ-SR-01 «cubrir exactamente los cuatro estados» y enumera cinco (`Solicitud Soporte`, `En Proceso`, `Pendiente`, `Finalizado`, `Anulado`); el título del requisito dice «cinco». Corregir al fusionar.

**SUGGESTION**
- S1 · Los deltas llevan «— ROJO» en varios títulos de escenario (marca de planificación). Quitarlas al fusionar en `openspec/specs/`.
- S2 · `packages/shared/src/invariantesGrafo.test.ts:200`: el título dice «las salidas de `Verificación` son exactamente liberación y rechazo de verificación» y la aserción comprueba tres. El título quedó viejo.
- S3 · `apps/desk/src/components/TicketDetailView.tsx:245` pinta en verde todo `statusType === 'Closed'`, así que un anulado luce igual que un finalizado. Cosmético, el color sale del servidor; el `.tsx` está fuera de la red de pruebas (F0-00).
- S4 · Llevar a la bandeja lo que la propuesta §6 ya anota (indicadores por ticket y `estadoSubOV` cuentan al anulado) para que no se pierda.
- S5 · El `.sql` de candidatos no se ejecuta en ninguna prueba; si algún día entra un Postgres real en la red, es la primera consulta que lo merece.

## 11. Tareas de personas (no se dan por hechas al archivar)

P-1 (ejecutar la consulta y marcar el histórico), P-2 (revisar S-1 a S-9), P-3 (cifras 21, 32 y 40 en el maestro), P-4 (comprobación a mano de la pantalla de Comercial tras el despliegue).

## Correcciones en sitio tras el verify (orquestador, mismo intento)

- **W5, parte de `transitions.ts`:** la entrada `anulacion_soporte` pasa a la misma línea que cierra `continuacion_soporte`,
  como las de servicio y equipo nuevo. `transitions.ts` vuelve a 397 líneas y el cierre del catálogo sigue en la 397, así
  que las citas a ese rango que el informe daba por desplazadas siguen ciertas y no se repuntan.
- **W5, parte de los artefactos del mapa:** las once citas archivadas se tratan en el archive (caso B, con su revisión).
- **W5, caso C** de `docs/sdd/ENTRADA.md` (E-223, «ningún catálogo tiene transición de anulación»): la rama no toca ese
  fichero; va como texto para Supervisión.
- **W6:** RQ-SR-01 del delta dice «los cinco estados».
- **S2:** el título de la prueba de pares de equipo nuevo (`packages/shared/src/invariantesGrafo.test.ts:200`) nombra las
  tres salidas de `Verificación`.
- **W3:** casillas 3.5 y 4.1 marcadas.
- **S1** (quitar «— ROJO» al fusionar): no se aplica; los requisitos vivos de las cuatro specs conservan esa marca.
