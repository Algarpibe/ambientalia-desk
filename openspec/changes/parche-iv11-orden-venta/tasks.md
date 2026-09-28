# Tasks — `parche-iv11-orden-venta` (F1B-11, cambio 1 de 3, `cierra: no`)

**Entradas:** `proposal.md`, `design.md`, `specs/{zoho-sync,remisiones,derivacion-avisos}/spec.md` de
esta misma carpeta. `strict_tdd` activo: cada tarea de implementación va precedida de su prueba en rojo.

## Review Workload Forecast

| Campo | Valor |
|---|---|
| Líneas estimadas | ~470 (`design.md` §Tamaño: código ~130 + pruebas ~340, `--no-renames`, las ediciones en su sitio cuentan doble). `proposal.md` estimaba ~350 antes de medir el contrato de `DiscrepanciaOV`/`AvisoOVDeps`; se usa la cifra de `design.md`, más reciente |
| Techo de esta sesión | **800** (`review_budget_lines`, no el 400 por defecto) |
| Riesgo de presupuesto | **Bajo** — 470 sobre 800 deja 330 de margen, sin contar `verify-report`/`archive-report` (van aparte, regla del ciclo 2) |
| PRs/commits encadenados | No — un solo lote cabe en el techo |
| Corte sugerido | PR único |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending — no aplica, lote único |

```text
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low
```

(La etiqueta literal de la guarda dice «400-line»; el techo real de esta sesión es 800, fijado por el
orquestador — ver tabla de arriba.)

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | Marca `ov_elegida_en_app_at` + protección en `upsertTicket` + descriptor de discrepancia + aviso a Comercial + cableado opcional del sync | PR único | `npx vitest run packages/zoho-sync/src/db/migrate.test.ts packages/zoho-sync/src/db/repo.test.ts packages/zoho-sync/src/sync.test.ts apps/desk/server/remisiones.test.ts apps/desk/server/services/avisoDiscrepanciaOV.test.ts apps/desk/server/ovDiscrepanciaSync.test.ts` | `npm test` completo contra el Postgres de pruebas (mismo arnés que hoy, sin credenciales Zoho) | `git revert` del commit único: las dos columnas nuevas son nullable y el sync no las lee sin este código — pueden quedarse (`proposal.md` §Rollback) |

## Phase 1 · Guardián de esquema

- [ ] 1.1 RED — `packages/zoho-sync/src/db/migrate.test.ts:369-373`: subir el recuento a 39 ALTER (19
  calificadas sin cambio, 20 sin calificar) y el texto del `it`. RQ: `zoho-sync` RQ-ZS-01.
- [ ] 1.2 Correr `npx vitest run packages/zoho-sync/src/db/migrate.test.ts` y confirmar rojo natural.
- [ ] 1.3 GREEN — `packages/zoho-sync/src/db/schema.sql`, tras `:509`: dos
  `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ov_elegida_en_app_at timestamptz` y
  `... ov_zoho_avisada text`, SIN calificar (D1), sin punto y coma en el comentario previo
  (trampa de `migrate.ts:20`, ya documentada en el fichero).
- [ ] 1.4 Confirmar verde.

## Phase 2 · Marca y descriptor en `repo.ts`

- [ ] 2.1 RED — `packages/zoho-sync/src/db/repo.test.ts` (al final): marca + OV distinta de Zoho →
  `orden_venta`/`fecha_orden_venta` intactas, `subject` sí cambia, devuelve `DiscrepanciaOV`; sin
  marca → Zoho manda (comportamiento actual); `managed_by_app=true` + marca → `null`; Zoho vacío tras
  `trim` → `null`; Zoho = `ov_zoho_avisada` → `null`; Zoho = valor de la app → `null`; alta
  (`createTicket`) y transición (`writeTransition`) marcan sólo si `ordenVenta`/`col==='orden_venta'`
  no está vacío; `ov_elegida_en_app_at`/`ov_zoho_avisada` NO están en `TICKET_COLS`. RQ: `zoho-sync`
  RQ-ZS-01, los 5 escenarios del delta.
- [ ] 2.2 Confirmar rojo natural.
- [ ] 2.3 GREEN — `upsertTicket` (`repo.ts:56-68`): ampliar el `SELECT` previo de `:58` a
  `managed_by_app, ov_elegida_en_app_at, orden_venta, ov_zoho_avisada`; el salto de `:59` se conserva
  PRIMERO (regla 13/D2); filtrar `orden_venta`/`fecha_orden_venta` de `updates` (`:62`) cuando hay
  marca; cambiar la firma a `Promise<DiscrepanciaOV | null>` y aplicar la detección de D3.
- [ ] 2.4 GREEN — `createTicket` (`repo.ts:385-387`): añadir la columna al `INSERT` y su parámetro
  `now()` sólo si `input.ordenVenta` no está vacío (D6).
- [ ] 2.5 GREEN — `writeTransition` (`repo.ts:274`): `sets.push('ov_elegida_en_app_at=now()')` sólo si
  `col === 'orden_venta'` y el valor no está vacío (D6, caso `habilitar_servicio`).
- [ ] 2.6 GREEN — añadir `export interface DiscrepanciaOV { ticketId; numero; ovApp; ovZoho }` al
  final de `repo.ts` (contrato del diseño).
- [ ] 2.7 Confirmar verde completo.

## Phase 3 · Marca en la remisión de entrada

- [ ] 3.1 RED — `apps/desk/server/remisiones.test.ts`: la remisión que captura una OV libre deja
  `ov_elegida_en_app_at` no nulo; una remisión sobre un ticket que ya tenía OV (el `WHERE` de `:237`
  hace no-op) NO la marca. RQ: `remisiones` RQ-RE-16, escenario «El UPDATE deja la orden protegida».
- [ ] 3.2 Confirmar rojo natural.
- [ ] 3.3 GREEN — `remision.ts:236`: añadir `ov_elegida_en_app_at = now()` al mismo `SET` del `UPDATE`
  de `:235-239`, sin tocar el `WHERE` de `:237` (guarda de carrera, ya cerrada, intacta).
- [ ] 3.4 Confirmar verde.

## Phase 4 · Servicio del aviso de discrepancia

- [ ] 4.1 RED — crear `apps/desk/server/services/avisoDiscrepanciaOV.test.ts`: un aviso por cada
  destinatario de `destinatariosDeArea(db,'Comercial','')`; segunda llamada con el mismo valor de Zoho
  → 0 avisos; valor de Zoho nuevo → otra tanda; fallo en `INSERT INTO avisos` → `ov_zoho_avisada`
  queda intacta y la llamada siguiente vuelve a avisar. RQ: `derivacion-avisos` RQ-AV-13, los 5
  escenarios del delta.
- [ ] 4.2 Confirmar rojo (módulo inexistente).
- [ ] 4.3 GREEN — crear `apps/desk/server/services/avisoDiscrepanciaOV.ts` con
  `avisarDiscrepanciaOV(db, d: DiscrepanciaOV)`: `BEGIN`;
  `UPDATE tickets SET ov_zoho_avisada=$2 WHERE id=$1 AND ov_elegida_en_app_at IS NOT NULL AND COALESCE(orden_venta,'')<>$2 AND COALESCE(ov_zoho_avisada,'')<>$2 RETURNING number, orden_venta`;
  0 filas → nada; si no, `crearAviso` (`avisos.ts:8-18`) por destinatario, `enviado_at` NULL (S-3);
  `COMMIT`; error → `ROLLBACK` + log, nunca lanza (patrón `repo.ts:299-314`, D4/D7).
- [ ] 4.4 Confirmar verde.

## Phase 5 · Cableado opcional del sync

- [ ] 5.1 RED — `packages/zoho-sync/src/sync.test.ts`: la devolución opcional recibe el descriptor una
  vez cuando `upsertTicket` detecta discrepancia; sin devolución, `persistTicket` no falla; si la
  devolución lanza, el ticket sigue contando como persistido (D5).
- [ ] 5.2 Confirmar rojo natural.
- [ ] 5.3 GREEN — `sync.ts:9`: `interface Deps extends AvisoOVDeps`; `sync.ts:62`: desestructurar
  `alDiscrepanciaOV`; `sync.ts:119` (dentro de `persistTicket`): invocar
  `alDiscrepanciaOV?.(descriptor).catch(() => {})` cuando `upsertTicket` devuelva no nulo. Añadir
  `export interface AvisoOVDeps { alDiscrepanciaOV?: (d: DiscrepanciaOV) => Promise<unknown> }` al
  final del fichero.
- [ ] 5.4 GREEN — `apps/desk/server/index.ts:20`: pasar
  `alDiscrepanciaOV: (d) => avisarDiscrepanciaOV(pool, d)` a `createSync` (única importación nueva).
- [ ] 5.5 Verificar por lectura, sin editar, que `apps/hub-sync/src/hub-sync.ts:21` sigue llamando a
  `createSync({ zohoFetch, db: pool, config })` sin `alDiscrepanciaOV` (RQ-AV-13, «el worker del hub
  nunca crea este aviso»).
- [ ] 5.6 Confirmar verde completo.

## Phase 6 · Extremo a extremo

- [ ] 6.1 Crear `apps/desk/server/ovDiscrepanciaSync.test.ts` (arnés `testing/appHarness`, mismo
  patrón que `remisiones.test.ts`): remisión captura una OV → una pasada de `upsertTicket` con otra OV
  de Zoho → 1 aviso; segunda pasada con el mismo valor → 0; valor nuevo → 1 aviso más.

## Phase 7 · Pruebas de mutación (design.md §Pruebas)

- [ ] 7.1 Regla 1 (posición): mover el salto de `repo.ts:59` detrás de la detección de discrepancia;
  correr la suite; confirmar rojo el caso `managed_by_app`+marca; revertir; `git diff` limpio.
- [ ] 7.2 Regla 2 (dato vigilado), parte A: meter `ov_elegida_en_app_at` en `TICKET_COLS`
  (`repo.ts:44-54`); confirmar rojo la prueba de pertenencia y la de dos pasadas; revertir.
- [ ] 7.3 Regla 2, parte B: escribir `ALTER TABLE desk.tickets ADD COLUMN ...` (calificado) en
  `schema.sql`; confirmar rojo el guardián de `migrate.test.ts`; revertir.
- [ ] 7.4 Seis mutaciones adicionales del diseño, cada una con reversión y `git diff` limpio: (a)
  quitar la marca del `UPDATE` de la remisión; (b) quitar el filtro de `updates` en `upsertTicket`;
  (c) quitar `<>$2` del anti-ruido en `avisarDiscrepanciaOV`; (d) sacar `crearAviso` de la transacción;
  (e) marcar siempre en `writeTransition` sin comprobar OV no vacía; (f) quitar la comprobación de
  Zoho vacío en la detección. Registrar en el `apply-progress` qué prueba se puso roja con cada una.

## Phase 8 · Regla 13 (checklist, sin código)

- [ ] 8.1 Confirmar que ningún fichero de `apps/desk/src` se edita en esta tanda. La única decisión de
  cliente que esta tanda toca —la OV en gris del formulario de remisión— sigue impuesta por
  `remision.ts:237` (`WHERE ... COALESCE(orden_venta,'') = ''`), sin cambios. Dejar la comparación
  escrita en el `apply-progress` (regla de mutación 3).

## Phase 9 · Cierre

- [ ] 9.1 `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` en verde.
- [ ] 9.2 Barrido de citas (regla de mutación 4) sobre `repo.ts`, `remision.ts`, `ticketService.ts`,
  `sync.ts`, `index.ts` (+1 por la importación nueva de `avisoDiscrepanciaOV`), `schema.sql` y
  `migrate.test.ts`: `grep -rnoE "<fichero>\.ts:[0-9]+(-[0-9]+)?"` sobre el repositorio + segundo pase
  para la forma abreviada en los ficheros que ya citan el módulo; comprobar los DOS extremos de cada
  rango; LEER qué afirma cada cita contra el fichero editado en su sitio (las ediciones son in-place,
  así que el contenido cambia aunque la línea no se mueva); clasificar A/presente, B/histórico o
  C/superado. Anotar que `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` corre después del commit,
  a cargo del orquestador — no de esta tanda.
- [ ] 9.3 Actualizar la fila de IV-11 en `CLAUDE.md` (tabla «Incumplimientos vivos»): estado
  REDUCIDO — filas marcadas desde ahora protegidas de la sobrescritura del sync; filas previas a este
  cambio siguen expuestas (sin relleno, S-1); la cura de raíz es el cambio 2 de F1B-11.
- [ ] 9.4 Actualizar `openspec/config.yaml` → `incumplimientos_vivos` → ficha de IV-11 EN EL SITIO:
  `estado: VIVO` → `REDUCIDO`, con la misma matización de 9.3. Conservar `la_cadena`/`las_dos_mitades`
  como Caso B (histórico, ciertas de antes de este parche) por la regla de mutación 4 — no reescribir
  como si nunca hubieran sido ciertas.
- [ ] 9.5 Corregir `docs/sdd/R08.3_Expediente_de_cambios.md:514`: la fila está dentro de §11.1
  (`:504-515`), no de §11.2 (`:527`) como afirma el `registro:` de `e005c`
  (`openspec/config.yaml:2122`). El texto de la fila dice hoy que la discrepancia «se enseña en el
  espejo»; el espejo sigue condicional (E-018, sin construir) y lo que existe desde este cambio es el
  aviso a Comercial (RQ-AV-13). Actualizar el texto de la fila y decidir si el puntero de `registro:`
  se corrige a §11.1 o si la fila se añade también en §11.2.

## Tareas de persona — fuera del recuento (regla del ciclo 1)

- [ ] P.1 Alfonso ejecuta `docs/sdd/Consulta_SubOV_formato_2026-09-27.sql` (sólo lectura) sobre
  producción y devuelve la salida; alimenta el cambio 2 de F1B-11.
- [ ] P.2 Gerencia decide si se rellena la marca en filas cuya OV ya se eligió en la aplicación antes
  de este cambio (hoy: sin relleno, S-1, declarado en `proposal.md`).
- [ ] P.3 Comercial verifica en la app, tras el despliegue, que aparece un aviso en la bandeja cuando
  Zoho trae una orden de venta distinta a la protegida.

## Dependencias entre fases

Fases 3-6 dependen del tipo `DiscrepanciaOV` y del `SELECT` ampliado de la Fase 2. Fase 5 depende de
que `avisarDiscrepanciaOV` (Fase 4) exista para cablearla en `index.ts`. Fase 7 corre con las Fases
1-6 ya en verde: muta código YA implementado, no sustituye a sus pruebas naturales. Fase 9 corre al
final, sobre el árbol ya revertido de toda mutación.
