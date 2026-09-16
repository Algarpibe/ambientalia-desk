# Apply-progress — `tercera-puerta-orden-venta` (desvío IV-4)

> Estado de tareas a fecha de hoy (2026-09-16, tras el intento R1): **9 de 23** (`1.1`–`1.9` hechas;
> `2.1`–`2.14` de la Rebanada R2 siguen pendientes, dueño: el siguiente intento del ledger sobre este
> mismo cambio). Este fichero fusiona el progreso encima de la pre-siembra original — no la sobrescribe.

## Rebanada R1 · La guarda — CERRADA el 2026-09-16 (intento/commit 1)

Secuencia de rojos ejecutada tal cual `design.md` §5 / `tasks.md` la definió, sin reordenar ninguna
casilla y sin dejar ninguna mutación aplicada al cierre:

| Tarea | Resultado |
|---|---|
| 1.1 [RED] | Quitado el `.fails` de `ordenVentaUnTicket.test.ts:161`. Rojo confirmado **exclusivamente** por `expected 201 to be 409` |
| 1.2 [GREEN] | Guarda `ticketConOrdenVenta` insertada en `remision.ts`, entre el `422` de la orden y el `UPDATE` (D2+D3). El bloque de la OV pasa de `:218-226` a `:218-240` (+14 líneas reales, no +11 estimadas) |
| 1.3 | `npm test` completo: ex-`it.fails` VERDE; `:141-159` ROJA por `expected 409 to be 201` (mutación deseada); ninguna otra prueba cayó (1130 verdes / 1 roja / 2 skip) |
| 1.4 [FUSIÓN D1] | Borrada `:141-159`; cabecera reescrita por tramos (Caso A/B/C); `describe` de la puerta 3 retitulado sin el paréntesis «la que no comprueba nada». `npm test` → todo verde (3/3 en el fichero) |
| 1.5 | Cinco citas re-ancladas: `:19`→`ticketService.ts:132-136` (A); `:20`→`remision.ts:218-240` (A, en el tramo del mapa); `:23`→`ticketService.ts:45,:134` en `b99d47a` (C, con qué lo cerró); `:24`→`remision.ts:223` en `b99d47a` (C, con nota de que hoy el WHERE, `:237`, queda ADEMÁS y no en lugar de); `:136`→`remision.ts:237` (A, doc del fixture) |
| 1.6 [RED→GREEN, D4] | Prueba de posición nueva al final de `remisiones.test.ts`, fixture propio (sin `equipo_id` ni serial, con `client_id`). VERDE al primer intento (54/54 en el fichero) |
| 1.7 [Mutación M-a] | Guarda subida con su prelusión por encima del 422 del serial (temporal). Prueba de posición → ROJA `expected 409 to be 422`; M5 → VERDE (solapamiento cero verificado). Revertido |
| 1.8 [Mutación M-b] | Guarda del serial bajada por debajo del bloque de la OV (temporal). Prueba de posición → ROJA `expected 409 to be 422`; M5 → ROJA (columnas escritas pese al rechazo). Las dos mutaciones revertidas; `npm test` → 1131 verdes / 0 rojas / 2 skip |
| 1.9 | `npm test`, `npm run typecheck`, `npm run lint` → los tres verdes (lint: 0 errores, sólo warnings preexistentes de `no-explicit-any` en ficheros no tocados por esta tanda) |

**Desviación respecto al contrato, declarada:** ninguna. El diseño (D1–D4, §5) se siguió literalmente.
La única corrección de cifra fue la propia (el bloque de la OV creció 14 líneas, no 11): no cambia
ninguna decisión, sólo el número exacto que las citas de 1.5 usan.

**Alcance de R1 respetado:** no se tocó ninguna casilla `2.x`; no se tocó `apps/desk/src/**`; no se
tocó `packages/zoho-sync/src/db/repo.ts`; no se corrió `sdd-verify` ni `sdd-archive`.

---

## Precondición operativa — RESUELTA el 2026-09-16, y el `apply` puede seguir

`apps/desk/server/ordenVentaUnTicket.test.ts:35-46` declara la **consulta 4.1 del runbook** como
precondición de tapar la tercera puerta, y dice por qué no es un trámite: si alguien en Comercial
descubrió que remisionando sí se puede duplicar una orden, esa es hoy su vía de trabajo, y taparla sin
mirar antes «no arregla un defecto: rompe un flujo real, en producción, sin aviso» (`:42-43`).

Gerencia la ejecutó en `psql` contra producción el **2026-09-16**:

```sql
SELECT salesorder_id, COUNT(*), array_agg(number ORDER BY number)
FROM desk.tickets WHERE COALESCE(salesorder_id,'') <> ''
GROUP BY salesorder_id HAVING COUNT(*) > 1;
```

### Las dos cifras, que van siempre juntas

| Cifra | Valor |
|---|---|
| Filas devueltas (órdenes en más de un ticket) | **0** |
| Población (tickets con `salesorder_id` no vacío en toda la base) | **1** |

### La lectura, que es la parte que importa

**El alcance NO cambia. El `apply` puede seguir.** No hay histórico que romper ni flujo real que cortar.

⚠️ **Pero la precondición se cumple POR VACÍO, no por comprobación.** Con población 1 un duplicado es
aritméticamente imposible: la consulta agrupa por `salesorder_id` y filtra `HAVING COUNT(*) > 1`, y con
un solo ticket en el universo ninguna agrupación puede pasar de uno. Ese `0` **no dice que nadie esté
usando la puerta abierta**; dice que **nadie pudo**.

Es una cifra **sin poder de refutación**. Separarla de su población la convertiría en una afirmación
sobre el sistema, y es una muestra de un caso. Por eso las dos van siempre juntas, aquí y en `proposal.md`
§12.1.

**La ventana en la que ese `0` empieza a significar algo es F1F-03** (`plan:214`, aceptación con
servicios reales), cuando la población deje de ser 1. **No es un destino**: es dónde volvería a verse.

Es la misma población 1 sobre la que se midió **IV-11** (la divergencia `orden_venta`/`salesorder_id`
por sincronización, en la tabla de «Incumplimientos vivos» de `CLAUDE.md` y en
`openspec/config.yaml`), y no es casualidad: las dos cifras miran al único ticket que hoy tiene
`salesorder_id`. Cuando F1F-03 repueble esa columna, **las dos hay que remedirlas**, no sólo una.

---

## Qué NO cambia por esto

- La tercera puerta se construye igual: la decisión de Gerencia (`Decisiones_Gerencia_2026-09-10.md:137-140`)
  no dependía de esta consulta. La consulta protegía al histórico, y no hay histórico.
- Sigue sin poder usarse este `0` para argumentar que la divergencia del sync (IV-11) no ocurre. Es la
  misma población, con la misma advertencia.
- Las tres exclusiones de alcance de `proposal.md` §2 siguen en pie.
