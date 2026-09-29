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
**Puente (1.6, A.1 confirmado):** `db/sla.ts:58` pasa `new Set()` como cierres; las 7 pruebas de `db/sla.test.ts` verdes.
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
