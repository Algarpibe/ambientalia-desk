# Verify-report: aviso-en-garantia (F1B-18)

Modo: Strict TDD. HEAD b3ae4d2, base fc06f7b. Verificador adversario, sin tocar código.

## Veredicto: PASS CON AVISOS — 0 CRITICAL · 2 WARNING · 2 SUGGESTION

## Códigos (cada uno mirado por separado)

| Comando | Exit | Detalle |
|---|---|---|
| `npm test` | 0 | 266 ficheros pasan, 2 omitidos; 4384 pruebas pasan, 7 omitidas |
| `npm run typecheck` | 0 | |
| `npm run lint -- --max-warnings 165` | 0 | 165 avisos, 0 errores |
| `tsx apps/desk/server/citas/cli.ts --sha HEAD` | 0 | sin bloqueantes |

## Mutaciones reproducidas (restauradas; `git status --short` vacío al final)

| Mutación | Prueba | Resultado |
|---|---|---|
| `<=` → `<` en `packages/shared/src/garantia.ts` | `garantia.test.ts` | ROJA: 5 caídas (G1, G3, G7, zona Bogotá y zona UTC) |
| quitar `garantia: garantias.get(...)` de `colaTaller.ts:24` | `garantiaListas.test.ts` | ROJA: 3 caídas (R1, R5, ruta de fallo) |

Una tercera (`en_garantia` → `null` en `distintivoGarantia.ts`) se aplicó y se restauró sin correr su prueba; la anotada en apply-progress (M11/M12) no se reprodujo aquí.

## Matriz requisito → evidencia

| Requisito / escenario | Evidencia |
|---|---|
| RQ-TC-58 frontera 20:00 −05 (en garantía) y 00:30 −05 (vencida), día anterior, fin nulo/vacío/inválido → `sin_dato`, `Date`, no depende de la zona | `packages/shared/src/garantia.test.ts` G1-G8, `it.each` de zona (`:9-10` instantes frontera, `:20-35`); impl. `packages/shared/src/garantia.ts:16-22` |
| RQ-TC-58 ticket cerrado conserva resultado; editar el fin recalcula | Por construcción: se calcula en cada lectura contra `created_time`, sin estado guardado. `garantiaListas.test.ts:58-69` (cerrados). No hay prueba de «editar recalcula» explícita (ver S-1) |
| RQ-TC-59 detalle: en garantía, sin dato, vencida, sin equipo | `garantiaListas.test.ts:71-84` (R3); `routes/tickets.ts:143-144` |
| RQ-TC-59 `date` sin desfase de zona | `garantiaTickets.ts:26` usa `fechaSolo`; `garantiaTickets.test.ts:95` (TZ Tokyo); mutaciones M4/M5 del apply |
| RQ-TC-59 consulta falla, el detalle se sirve | `garantiaTickets.ts:34-37` (warn + mapa vacío); `garantiaListas.test.ts:123-147` |
| RQ-TC-59 búsqueda de equipos trae `finGarantia` (ausente si NULL) | `equipos.test.ts` (+18 líneas, al final); impl. `equipos.ts:42,66` |
| RQ-TC-59 no escribe nada | `garantiaListas.test.ts:86`; `garantiaTickets.test.ts` (sólo SELECT) |
| RQ-TC-60 aviso en el alta, sugerencia en Notificado | Manual declarado, `.tsx` fuera de la red: `CreateTicket.tsx:345`, `TransitionPanel.tsx:54`; lógica en `garantia.test.ts` (`sugerenciaPorGarantia`) |
| RQ-TC-60 la sugerencia no cambia las guardas del servidor | Diff sin `transitions.ts`/`ticketService.ts`; `TRANSITIONS` cubierto en `garantia.test.ts` |
| RQ-VT-14 cola, mis tickets, cerrados, remisión creada | `garantiaListas.test.ts:44-121` (R1-R5); adjuntos `colaTaller.ts:23-24`, `routes/tickets.ts:110`, `listaRemisionCreada.ts:15-16` |
| RQ-VT-14 sin equipo, sin marca; instante frontera | `garantiaListas.test.ts:45`, `:110` (G1/G2 en `:18-19`) |
| RQ-VT-14 una consulta por lote | `garantiaListas.test.ts:149-151` (3 vs 6 tickets) y `garantiaTickets.test.ts` S3 |
| RQ-VT-14 productor sin la marca se detecta | R1-R5 + mutación M7a-d (apply) y la reproducida aquí |
| RQ-VT-15 distintivos y colores (verde/gris, no ámbar) | Parte lógica: `distintivoGarantia.test.ts` (6 pruebas) sobre `distintivoGarantia.ts:9-19`. Parte visual: manual declarado (`TicketCard.tsx:103`, `TicketList.tsx:29`, `TicketTable.tsx:34`, `TicketDetailView.tsx:183`) |

Sin huecos de cobertura que bloqueen. Los escenarios «manual» están declarados como tales en los specs.

## tasks.md

Todas las casillas están en `[x]` (1.1-1.9, 2.1-2.6, 3.1-3.9, 4.1-4.2, 5.1-5.6, 6.1-6.8). Contraste con `git diff fc06f7b HEAD`: los 29 ficheros del diff corresponden a lo marcado (`garantia.ts`, `garantiaTickets.ts`, adjuntos, `equipos.ts`, `types.ts`, seis `.tsx` más `DistintivoGarantia.tsx`, `distintivoGarantia.ts`, `registro.test.ts`). `types.ts` y `index.ts` coinciden con 2.1-2.2 (`types.ts` 4 líneas cambiadas en sitio, `index.ts` +1).

## Regla invariable 13

- Fórmula única: `packages/shared/src/garantia.ts:16-22`. El grep sobre `apps/desk/src` no encuentra ninguna comparación de fechas de garantía reimplementada: sólo `CreateTicket.tsx:345` llama a `estadoGarantia(new Date(), equipo.finGarantia)` del paquete compartido, y `TransitionPanel.tsx:54` llama a `sugerenciaPorGarantia`. El resto de `.tsx` sólo pinta `ticket.garantia` del servidor.
- Aviso del alta y resaltado en Notificado: no tienen contrapartida en el servidor, a propósito, y no bloquean ni rellenan (apply-progress 6.2). El espejo del alta usa la fórmula compartida (punto 1) y no impone nada (punto 2 no aplica). Sin CRITICAL.

## Fecha y zona

- El servidor normaliza el fin con `fechaSolo` (getters locales; `packages/zoho-sync/src/books/repo.ts:94-100`) en `garantiaTickets.ts:26`, y en `equipos.ts:42`.
- Las pruebas de frontera usan los instantes `2026-03-16T01:00:00Z` (20:00 −05) y `2026-03-16T05:30:00Z` (00:30 −05) (`garantia.test.ts:9-10`, `garantiaListas.test.ts:18-19`). Son −05 expresados en Z, con el comentario de Bogotá al lado. Equivalen a lo pedido.

## Ficheros vetados

`git diff --stat fc06f7b HEAD` NO incluye `repo.ts`, `schema.sql`, `transitions.ts`, `estados.ts`, `ticketService.ts`, `remision.ts`, `config.yaml` ni `ENTRADA.md`. Limpio.

## TDD

- Lote 1: rojo→verde registrado en apply-progress (tabla de evidencia; `10 failed / 40 passed` en 1.9, luego verde; M1-M10).
- Lote 2: el agente se colgó; el propio apply-progress declara que el rojo de 4.1 se reprodujo A POSTERIORI retirando el módulo, que las casillas y el apartado los escribió el orquestador, y que no es evidencia del orden de escritura. Se declara con honestidad. Sólo cubre `distintivoGarantia.ts` (6 pruebas, de peso bajo); los `.tsx` no admiten rojo por decisión de Gerencia.
- Rojo «por construcción» de pruebas de ausencia (sin marca, `finGarantia` ausente): anotado y compensado con mutaciones M10 y la forma `...(fin ? {…} : {})`.

## Hallazgos

### CRITICAL
Ninguno.

### WARNING
- W-1 · Rojo de 4.1 reproducido a posteriori (lote 2). Evidencia más débil que un rojo previo, pero declarada y reproducible; el módulo es pequeño y las mutaciones M11/M12 lo cubren. No bloquea.
- W-2 · Las casillas 6.7 y 6.8 (detector sobre el commit del lote y medida del intento) están marcadas `[x]`, pero apply-progress las difiere a «el informe del intento» y no anota valores. Este verify confirmó el detector (exit 0) y la medida no se pudo contrastar contra el `df149e1` del intento (sin ledger). Anótese en el archive-report.

### SUGGESTION
- S-1 · El escenario «editar el fin de garantía recalcula» (RQ-TC-58) y «ticket cerrado conserva su resultado» se cubren por construcción (sin estado guardado) y por R2, no por una prueba que edite el fin y relea. Opcional.
- S-2 · Las pruebas de frontera expresan los instantes en Z con comentario −05; añadir una con `-05:00` literal reflejaría mejor el escenario (cosmético).

## Nota

`registro.test.ts` lleva F1B-18 «en curso» (DOCE) y se devuelve a ONCE en el commit de archivo: no es hallazgo.

Worktree limpio tras las mutaciones (`git status --short` vacío).
