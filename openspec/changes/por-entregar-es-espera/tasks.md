# Tasks: `Por Entregar` es espera, y el predicado que CLASIFICA se escribe una sola vez

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 96-147 (design.md §11) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Predicado único (`enEspera.ts`) + reclasificación 9→11 + barrido + IV-9 reducida | PR 1 | `npm test -- packages/shared/src/estados.test.ts packages/shared/src/sla.test.ts apps/desk/src/lib/enEspera.test.ts apps/desk/src/lib/boardView.test.ts` | N/A — comprobación visual de `ClienteDetalle.tsx:18` es tarea de persona (fuera de recuento), `.tsx` no admite arnés automatizado (F0-00) | `git revert`; sin migración, sin escritura a Zoho, sin `ENABLE_WRITES` |

## Phase 0: Precondición de entrega

- [ ] 0.1 Confirmar en `git log`/`git status` que `proposal.md` (7a24021) y `specs/`+`design.md` (674ae89) ya están en HEAD; commitear este `tasks.md` **antes** de que `sdd-apply` adquiera el intento (R-4, regla del ciclo 2 de `CLAUDE.md`).

## Phase 1: El rojo de la decisión (Fase 0 del diseño) — antes de tocar `estados.ts`

- [ ] 1.1 RED en `apps/desk/src/lib/boardView.test.ts`: `describe` nuevo (no el de `:31-45`) reutilizando `casoEnEspera(status)` para `'Por Entregar'` y `'Por Entregar / Sin facturar'`; confirmar que ambos caen hoy en `'abiertos'` y no en `'espera'`.

## Phase 2: Extracción a conducta constante (Fase 1 del diseño)

- [ ] 2.1 RED `apps/desk/src/lib/enEspera.test.ts`: 4 asertos del contrato D1 (todo estado de `ESTADOS_EN_ESPERA` → `true`; el resto de `ESTADOS` → `false`; `undefined`/`null`/`''` → `false`; estado inexistente → `false`).
- [ ] 2.2 GREEN: crear `apps/desk/src/lib/enEspera.ts`, `esEstadoEnEspera(status?: string | null): boolean`, envolviendo `ESTADOS_EN_ESPERA.includes(status ?? '')` — sin lógica nueva (D1, D2).
- [ ] 2.3 `boardView.ts:2`/`:39` consume el módulo, pierde el cast en línea. Correr suite completa: debe quedar exactamente igual de verde (refactor puro); el rojo 1.1 sigue rojo.
- [ ] 2.4 `ClienteDetalle.tsx:18` consume el módulo. Añadir ancla A encima de `:18` (deliberado + por qué + autoridad Q1 + arreglo real pendiente, §3 Pieza 2/§8 hallazgo 2 de `proposal.md`) y ancla B en `:22` («divergencia deliberada, ver nota de `esEspera` arriba, NO unificar»). Ningún comentario puede reproducir `/espera/i.test(` (restricción de higiene, obliga a M6).

## Phase 3: Reclasificación 9→11 (Fase 2 del diseño)

- [ ] 3.1 Mover `estados.ts:87-88` al bloque `externa`; corregir rótulos `:60` `(3)`→`(5)`, `:80` `(11)`→`(9)`. Correr → rojos esperados: `estados.test.ts:25`, `:44`, `:85`, y el rojo a4 (`:159`, `:160-163`); 1.1 pasa a VERDE.
- [ ] 3.2 Fijar los `toEqual` de `:25`/`:44`/`:85` **leyendo la salida real del filtro** (posiciones 4-5, entre `Notificación cliente` y `Notificación a Compras` — verificado, no se reordena el registro para cuadrar). Corregir nombres caducos: `:25` «tres»→cinco, `:44` «once»→nueve, `:84`/`:78` prosa, `:71` cuenta 3/5/12/1→**5/6/9/1=21**.
- [ ] 3.3 Rojo a4: reescribir `:145-155` (la derivación sirve aún menos) y `:157-163` (da **ocho**, sobrantes `Liberación Comercial`, `Remisión creada`, `Por Entregar`, `Por Entregar / Sin facturar`). Anotar hallazgo 3 (§9 design): ¿son también `sin_salida`? — **sin destino, no se decide, `ESTADOS_SIN_SALIDA` no se toca**.
- [ ] 3.4 En `enEspera.test.ts` añadir un caso anclado: `esEstadoEnEspera('Por Entregar') === true` (testigo desde el cliente; va aquí, no en Fase 2, porque antes sería rojo).

## Phase 4: Barrido «nueve»→«once» y registros (Fase 3 del diseño)

- [ ] 4.1 Correr los **tres** detectores: palabra (`\bnueve\b`, control `\bonce\b`), numeral (`\b9\b`, generador de candidatos, triado a mano), enumeración explícita (títulos sin la palabra: ya cubiertos en 3.2/3.3). Confirmar que solo-palabra deja escapar `estados.ts:21`.
- [ ] 4.2 Aplicar en `estados.ts:21` (numeral, tabla ASCII — conservar ancho de columna con `:20`/`:22`/`:23`), `:28`, `:109`.
- [ ] 4.3 `sla.test.ts:44` (cita textual de `estados.ts:28`, editar en la misma operación), `:46`, `:50`. **`:52` no se toca**, debe seguir verde comprobado corriendo.
- [ ] 4.4 Reducir IV-9 en `CLAUDE.md` y `openspec/config.yaml` (`:738`,`:740`,`:755`,`:784`) a **dos** supervivientes de color (`ClienteDetalle.tsx:22`, `TicketDetailView.tsx:245`), con medición al día (2 de once; nueve escapados). No cerrar, no dejar el texto de tres.
- [ ] 4.5 Confirmar intactos: `transitions-st/spec.md:723`, `config.yaml:931`/`:933`, `Paquete_de_Despliegue_2026-09-10.md:65`/`:309`.

## Phase 5: Regla 13 — la casilla marcada por escrito (mutación 3)

- [ ] 5.1 Comparar línea a línea (no de memoria) las 4 decisiones de `design.md` §6/D6 —vista tablero, sub-vista cliente, criterio del predicado, estado desconocido→`false`— contra la línea de servidor que las impone (ninguna la impone; las 4 son presentación, cero guardas). Dejar la tabla escrita en el PR/commit.

## Phase 6: Las seis mutaciones, ejecutadas y revertidas (Fase 4 del diseño)

| # | Mutación | Detector que DEBE ponerse rojo | Control |
|---|---|---|---|
| M1 | `estados.ts`: devolver `Por Entregar` a `'ninguna'` | Rojo de 1.1 (`boardView.test.ts`) | (a1-a4) también rojos |
| M2 | Mover una entrada dentro de `externa` sin cambiar su valor | `toEqual` `estados.test.ts:25`/`:85` (orden) | `:71` (suma) sigue VERDE |
| M3 | Quitar `statusType !== 'Closed'` de `boardView.ts:48` | RQ-VT-05, `boardView.test.ts:53-58` + caso con los 2 estados nuevos cerrados | Debe ponerse rojo también con ellos |
| M4 | En `enEspera.ts` sustituir el registro por `/espera\|hold/i` | Aserto 1 de `enEspera.test.ts` + `describe` RQ-VT-04 | Mide el hueco de `ClienteDetalle.tsx:18` (no lo tapa) |
| M5 | Dejar una sola cita a «nueve» (p. ej. `sla.test.ts:44`) | Barrido con los 3 detectores de 4.1 | D-palabra solo se deja `estados.ts:21` |
| M6 | Retirar una de las 2 regex de color supervivientes | `grep -rnE "/espera(\|hold)?/i\.test\(" apps/desk/src` (hoy 3, tras la tanda 2) — cuenta LLAMADAS, no menciones | Debe dar 1 y romper el criterio; añadir una 3ª da 3 y también rompe |

- [ ] 6.1 Ejecutar M1-M6 en orden, confirmar cada detector/control, revertir cada mutación antes de seguir.

## Phase 7: Verificación final

- [ ] 7.1 `npm test`, `npm run typecheck`, `npm run lint` (≤158 avisos, `.github/workflows/ci.yml:41`), `npm run build` — todo en verde.

---

## Tarea de PERSONA — fuera del recuento (regla del ciclo 1, `CLAUDE.md`)

> **Archivar NO la da por hecha.**

| | |
|---|---|
| Qué | Sólo la mitad de CLASIFICACIÓN: que la ficha de cliente cuente bajo «espera» un ticket en `Por Entregar` (`ClienteDetalle.tsx:18`, consumido en `:96`/`:98`). No cubre color. |
| Dónde | `ambientalia-desk.ambientalia.cloud` (el CI no despliega, sólo verifica). |
| Dueño y registro | Quien verifique el despliegue; anotar dueño, resultado y fecha. |
| Por qué no es tarea de tanda | `ClienteDetalle.tsx` es `.tsx`, fuera de la red de pruebas por decisión de Gerencia (`vitest.config.ts:16`,`:17-20`; F0-00). No describe trabajo ejecutable en este repositorio: no admite aserción automatizada aquí. |
