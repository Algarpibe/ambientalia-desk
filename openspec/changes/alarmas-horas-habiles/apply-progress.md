# Apply progress — `alarmas-horas-habiles` (F1B-08, `cierra: no`)

## Lote 1 · `shared` (2026-09-29, base `bb58e83`)

Ledger: intento 1 de `gentle-ai sdd-attempt`, techo 800. **Estimación previa ~380** (código ~125, pruebas ~195, este
fichero ~60). Medida y contraste al final.

**Fase 0, desviaciones declaradas.** HEAD de arranque `bb58e83`, no `6516e5f`: entre medias está el commit documental que
revisó S-4 y S-13 (sólo `openspec/`). La línea base de 0.2 no se corrió antes del RED; la suite se midió tras el GREEN.
Recuentos de arranque (0.3) medidos en los tres ficheros del lote: `sla.ts` 109, `sla.test.ts` 210, `db/sla.ts` 63.

**RED (1.1-1.4).** 13 rojas naturales (`ALARMAS_SLA` y `estadosConAlarmaSinCargo` no existían, `:33` daba
`{ Notificado: 24 }`, los bordes hábiles vencían con el reloj). **Nacen verdes y se declaran:** las tres pruebas de
`sla.test.ts:62-81` (lunes 08:00 + 9 h hábiles = martes 08:00 = +24 h de reloj: el fixture no distingue, lo distinguen
las del final) y `destinatarioDelEscalado` (`:105-182`, sin tocar). No hubo rojo fuera de `shared`.

**GREEN (1.5-1.7).** `sla.ts` en sitio (`:2`, `:4-31`, `:32-35`, `:39-44`, `:46-55`, `:69-70`) y al final
(`AlarmaSla`, `ALARMAS_SLA` con `areaRespaldo`, `estadosConAlarmaSinCargo`); `sla.ts` 109 → 146, `sla.test.ts` 210 →
322 (`−39` sólo en líneas de sitio), `db/sla.ts` 63 → 63.
**Puente (1.6, A.1 confirmado):** `db/sla.ts:58` en `55eac92` pasaba `new Set()` como cierres; las 7 pruebas de `db/sla.test.ts` verdes.
Sin ciclo de importación (`calendarioLaboral.ts` no importa `sla.ts`).

**Hallazgo en 1.2 — la hipótesis de coma flotante SÍ se reproduce, pero no con el fixture previsto.** Con `Notificado`
y entrada a las 08:20 la suma da 9 exactas y quitar `Math.round` nacía verde. Sondeo sobre 9.720 entradas de los tres
umbrales: 220 superan el umbral exacto; p. ej. `Remisión creada` el lunes a las 08:02 suma 27,000000000000004 h el jueves
a las 08:02. El borde fraccionario de la prueba pasa a ese caso medido y la mutación 1.9 se pone roja.

**Borde exacto pedido (S-7).** `sla.test.ts`, «9 h hábiles cruzando un fin de semana y un cierre»: entra el viernes
18/09 a las 14:00 (3 h), sábado y domingo no cuentan, el lunes 21/09 es cierre; martes 22/09 14:00 → no vencido,
+1 ms → vencido; y sin el cierre habría vencido el lunes 14:00:00.001 (la cuarta aserción prueba que el cierre pesa).

**Mutaciones reproducidas por el orquestador** (script que muta, corre `sla.test.ts` y restaura; sha256 de `sla.ts`
idéntico antes y después):

| Mutación | Rojas | Cuáles |
|---|---|---|
| 1.8 `>` → `>=` | 7 | los siete bordes exactos (S2-S8 y el fraccionario) |
| 1.9 sin `Math.round` | 1 | borde fraccionario de `Remisión creada` (tras cambiar el fixture) |
| 1.10 `false` si el estado está en `ESTADOS_EN_ESPERA` | 2 | 27 h/36 h y el borde fraccionario |
| extra: ignorar `cierres` | 2 | fin de semana + cierre, y cierre de empresa |
| 1.11a cargo `''` | 3 | coherencia con el grafo, «las tres escalan…», «ninguna sin cargo» |
| 1.11a2 clave sin la propiedad `cargo` | 3 | las mismas tres |
| 1.11b `marcaTablero` en `Notificado` | 1 | «sólo Remisión creada… sólo Notificación cliente…» |
| 1.11c borrar la clave `Notificado` | 2 | «mismas claves» y coherencia con el grafo |
| 1.11d clave fuera de `SLA_HORAS_POR_ESTADO` (`En Proceso`) | 1 | «mismas claves» |
| 1.11e `areaRespaldo` fuera de `AREAS` | 1 | «las tres escalan…» |

Declarado: 1.10 NO pone roja la independencia de `:51-55` (S11): esa prueba mira las listas, no la función. Lo que
la discrimina es que el reloj deje de vencer en los estados de espera, y eso lo cazan S7 y S8.

**Cierre (1.12).** `npm test`: 157 ficheros, 1.949 pruebas verdes, 2 omitidas. `npm run typecheck` limpio. `eslint`:
0 errores, 165 avisos (el techo).
**Barrido de la regla de mutación 4** sobre `sla.ts`, `sla.test.ts` y `db/sla.ts:58`, leyendo qué afirma cada cita:
- **Caso B, 20 citas ancladas** en `bb58e83` (en `3f30710` la que ya medía sobre esa revisión, en `4796aad` las tres de
  `exploration.md`): afirmaban «una sola entrada, 24 h de reloj» o la exclusión de `sla.test.ts:51-55`. Ficheros:
  `Brecha_Maestro_R08.2`, `Plan R01.1` (3), `ENTRADA.md` (2), `Parte_2026-09-21`, `R08.3_Expediente`, `config.yaml` (4),
  specs vivas `calendario-laboral`, `transitions-equipo-nuevo` y `transitions-st` (3), `exploration.md` (3).
- **Caso A, sin tocar:** `sla.ts:78-109` (no cambian), `sla.ts:32` como «la declaración» (`bodegaje.ts:27`,
  `bodegaje.test.ts:37`), `sla.ts:34` en `Decisiones_Gerencia_2026-09-10.md:338` y `Plan R01.3:222`, `sla.ts:58` en
  `config.yaml:1622` (la palabra «ampliación», que sigue ahí), y las de `db/sla.ts:58` (sigue siendo la llamada a
  `slaVencido`).
- ⚠️ Esto toca `openspec/config.yaml` sólo en citas: la comprobación 4.12 («`git diff` de `config.yaml` vacío») se
  refiere a R-2 (ninguna capacidad nueva) y así se leerá al cerrar.
Regla 13: el lote no toca `apps/desk/src`.
**Medida** (`git diff --cached --shortstat --no-renames`, sin ficheros nuevos salvo éste): 15 ficheros, +324 −108 = **432**
frente a ~380 estimadas y techo 800. Desvío +52: el barrido de citas (+20 −20) y las 13 casillas de `tasks.md` (+13 −13)
no estaban estimados; código y pruebas midieron 299 (estimado ~310) y este fichero 67 (~60).

## Lote 2 · BD y consulta (2026-09-29, base `55eac92`)

Ledger: intento 1 del objetivo nuevo, techo 800. **Estimación previa ~570** (con `alarmas_corte` dentro): esquema ~16,
`migrate` ~42, `avisos` ~60, `db/sla.ts` ~130, `db/sla.test.ts` ~200, barrido ~20, casillas ~38, este fichero ~60.

**Hipótesis de pg-mem, ejecutadas ANTES del GREEN** (sondeo sobre el esquema real con `migrate`, luego borrado):

| H | Qué | Resultado | Consecuencia |
|---|---|---|---|
| H1 | `ON CONFLICT … DO NOTHING RETURNING` vacío en conflicto | **FALSA**: devuelve 1 fila también en el conflicto (aunque no inserta) | Plan B para el lote 3: `SELECT` previo en la transacción; la clave queda de cinturón. La prueba de unicidad cuenta filas |
| H2 | `lower(trim(cargo))` en SQL | **FALSA**: `function trim(text) does not exist` | Plan B aplicado: `SELECT … WHERE active = true AND cargo IS NOT NULL` y comparación en TS |
| H3 | `performed_at` con µs rompe la igualdad SQL | **Sin demostrar en pg-mem**: trunca a ms (`…00.123Z`) | Comparación de la marca en TS por `getTime()`, como estaba; queda prueba que lo fija |
| H5 | `ticket_id IN (SELECT id FROM tickets WHERE status IN …)` | Cierta | Se usa tal cual |

Un `INSERT` repetido SIN `ON CONFLICT` lanza `duplicate key`: la unicidad (ticket, estado, entrada) es de la base.

**RED.** Naturales: 4 en `migrate.test.ts` (recuento 35 y tablas inexistentes), 3 en `avisos.test.ts`
(`destinatariosDeCargo` no existía), 6 en `db/sla.test.ts` (`horas`/`alarma`, OV, enfrentamiento, cierres, N+1).
**Nacen verdes y se declaran:** «Notificado y Notificación cliente avisan con OV» (S21: la consulta vieja no miraba la
OV), «la entrada que cuenta es la del estado ACTUAL» (la vieja ya filtraba `to_status` por ticket) y el sondeo H3.
Su discriminación la dan 2.18a/b y 2.18f.

**GREEN.** `schema.sql` 576 → 596 (+20, `−0`, los dos comentarios sin `;`); `migrate.ts:73` en sitio (131);
`avisos.ts` 93 → 113 (sólo `+`); `db/sla.ts` 63 → 125 con las líneas citadas fijas: `:40` firma, `:45` filtro por
estado, `:49` filtro de flujo servicio, `:56` «sin foto no se mide», `:58` `slaVencido` con los cierres REALES
(`listarCierres` en cada llamada). Firma sin cambios `(db, ahora)`: los cierres se leen aquí, no en el servicio (se
desvía de D-3, que los pasaba por parámetro; el lote 3 ya no llama a `listarCierres`). Suite: 157 ficheros, 1.963
verdes, 2 omitidas; typecheck limpio; eslint 0 errores, 165 avisos.

**`tieneOrdenVenta` — molde H5.** `ticketConOrdenVenta` (`repo.ts:362-379`) contesta la pregunta inversa (dada una OV,
qué ticket) y no se reutiliza sin conocer la OV; tampoco hay otro predicado «¿este ticket tiene OV?». Tercera
implementación, con la misma definición (`COALESCE(orden_venta,'') <> ''`, `salesorder_id`, asociación con
`liberada_at IS NULL`) y una prueba que enfrenta tres cosas sobre cinco casos —columna, sólo `salesorder_id`,
asociación vigente, asociación liberada, ninguna—: `ticketConOrdenVenta` (las puertas y su tercera vía),
`tieneOrdenVenta` y la consulta de vencidos. Esperado `[sí, sí, sí, no, no]` en las tres.

**Sin N+1.** Espía de `Queryable`: con 1 candidato y con 5 (de los tres estados) las consultas son idénticas —1 al
historial, 1 a asociaciones, 1 a cierres— y el total no cambia.

**Mutaciones reproducidas por el orquestador** (script que muta, corre las tres pruebas del lote y restaura; sha256
de los cuatro ficheros idéntico antes y después):

| Mutación | Rojas | Dónde |
|---|---|---|
| 2.5 `alarmas_avisadas` sin `public.` | 1 | guardián «toda tabla clasificada» |
| 2.6a/b quitar una de las dos de `migrate.ts:73` | 2 / 2 | guardián y recuento 35 |
| 2.7a/b quitar la `PRIMARY KEY` de `schema.sql` (cada tabla) | 1 / 1 | las pruebas de unicidad en la base |
| 2.11a sin `active = true` / b sin normalizar / c admins de oficio | 1 / 1 / 2 | `destinatariosDeCargo` |
| 2.18a sin la vía `salesorder_id` / b sin `liberada_at IS NULL` | 1 / 1 | el enfrentamiento |
| 2.18c sin filtro de flujo | 1 | `db/sla.test.ts:141-145` |
| 2.18d primera entrada en vez de la última | 1 | `:78-84` |
| 2.18e una consulta al historial por ticket | 1 | N+1 |
| 2.18f no exigir el estado actual | 1 | «la entrada del estado ACTUAL» |
| 2.18g no leer los cierres | 2 | cierres y N+1 |
| 2.18h (posición) OV después del vencimiento | **0, declarado** | es intersección, no hay orden que probar |

Declarado: el desempate por `id` con `performed_at` idéntico (S9 con empate) no tiene prueba: con el filtro por
`to_status` dos entradas empatadas dan el mismo `desde`, así que no hay resultado observable que distinga.

**Barrido de la regla 4.** Caso A, sin tocar: `db/sla.ts:40`, `:40-45`, `:49` (paquetes de despliegue y specs),
`:28-33`, `:56`; `migrate.ts:70-73`; `avisos.test.ts:1-9`, `:21`, `:42`, `:80`; `db/sla.test.ts:78-84`, `:118-133`,
`:141-145`. Caso B, anclados: las que daban `db/sla.ts:58` como el puente o como llamada sin cierres (`55eac92` o
`6516e5f`: 5 en `tasks.md`, 1 en `proposal.md` y 1 en este fichero) y `:51-56` de `exploration.md` (`4796aad`).
**Medida** (`git diff --shortstat --no-renames HEAD`; ningún fichero nuevo, así que `git add -N` no hizo falta): 11 ficheros,
+443 −64 = **507** frente a ~570 estimadas y techo 800. Por debajo: `db/sla.test.ts` salió en +135 −8 (estimado ~200).
