# Archive · `ovi-garantia-por-cargo` (F1B-03, `cierra: no`)

**Fecha:** 2026-10-06 · **Rama:** `ovi-garantia-por-cargo` · **Partida:** `215310d` · **Informe escrito por el orquestador**, con
cifras medidas por él; no lo generó el agente de archivo.

**Qué parte de la fila F1B-03 cubre, en una línea:** la OVI de garantía —asociar una orden `OVI-` exige el cargo Director Técnico en
las cuatro entradas de una orden, y un ticket de «Garantía» sólo admite OVI—; **deja fuera** la supresión de los prefijos (E-094, que
espera una comprobación de Gerencia) y la excepción de «Equipo nuevo» (E-158, pendiente), así que la fila NO se cierra.

## Qué decisión construye

`decision/e157-ovi-garantia-por-cargo` (Gerencia, 2026-10-06; `openspec/config.yaml` → `decisiones_de_gerencia_adenda`), que precisa
`decision/ovi-garantia-autor`.

## Qué quedó construido

- `puedeCrearOVIGarantia` deja de exigir el área: basta el cargo o ser administrador (`packages/shared/src/cargos.ts:71-74`).
- Una sola noción de «es OVI», por prefijo (`packages/shared/src/subOV.ts:65`), y las reglas puras de «orden que entra», motivo de
  cargo y motivo de garantía en `packages/shared/src/ordenOVI.ts`.
- El servidor las impone en las tres puertas, que son las cuatro entradas: el alta (`apps/desk/server/services/ticketService.ts:44`
  y `apps/desk/server/services/ticketService.ts:96`), las transiciones —«Habilitar Servicio» y la orden adicional de las dos
  aprobaciones— (`apps/desk/server/services/ticketService.ts:131` y `apps/desk/server/services/ticketService.ts:134`) y la remisión de
  entrada (`apps/desk/server/routes/remision.ts:220`), con `apps/desk/server/services/guardasOVI.ts` como único traductor a HTTP.
- No se tocó `apps/desk/src`: el cliente no decide nada sobre la OVI y no hay tabla de la regla 13 que escribir.

## Medida, por intento (registro de `gentle-ai sdd-attempt` = `git diff --shortstat --no-renames`)

| Intento | Commit | Registro | Git |
|---|---|---|---|
| Lote 1 · `packages/shared` | `d6a2957` | 295 | 265 + 30 |
| Lote 2 · alta y transiciones | `81d8389` | 516 | 492 + 24 |
| Lote 3 · remisión de entrada | `e4bdc6e` | 311 | 296 + 15 |
| Verify | `6b60a34` | 150 | 150 + 0 |
| Cierre | `1edae50` | 72 | 62 + 10 |

Ningún intento pasó de la válvula de 720. Producto y pruebas contra la partida: 14 ficheros, 878 inserciones y 31 borrados
(`git diff --shortstat --no-renames 215310d 1edae50 -- apps packages`).

**Ficheros muy citados, editados en sitio:** `ticketService.ts` 277 líneas antes y después (9 inserciones, 9 borrados);
`remision.ts` 397 antes y después (3 y 3). Ninguna cita cambia de número.

## Verificación

- `verify-report.md`: PASS WITH WARNINGS, 0 CRITICAL; 51 de 52 escenarios cubiertos y uno parcial (W-1), que el cierre cubrió con la
  prueba GA-TR-2b de `apps/desk/server/oviGarantia.test.ts`, comprobada con una mutación propia.
- Cuatro códigos repetidos por el orquestador tras cada lote y tras el cierre, los cuatro con salida 0; en el cierre, 3.636 pruebas.
- Mutaciones de posición reproducidas por el verificador independiente en las cuatro entradas: 14, ninguna sobrevivió.
- Pares declarados NO observables, con su argumento en `apply-progress.md`: cargo frente a garantía (ninguna orden activa las dos);
  «Orden de venta no encontrada» frente a cargo en la remisión (sin orden no hay número que juzgar); cargo frente a contrato vencido
  en la remisión (una OVI nunca es subOV de lote).

## Fusión de los deltas (por script, bloque a bloque)

`fusiona.mjs`: 10 bloques, los 10 idénticos al delta. Un MODIFIED (`RQ-PM-20`, mismas 20 líneas que el bloque vivo: no desplaza nada)
y nueve ADDED al final de su spec (`RQ-PM-24`, `RQ-PM-25`, `RQ-TC-42`, `RQ-TC-43`, `RQ-TS-36`, `RQ-TS-37`, `RQ-TS-38`, `RQ-RE-30`,
`RQ-RE-31`). Specs vivas: 350 inserciones y 8 borrados. No hay capacidad nueva: `capabilities` no cambia.

## Barrido de citas (regla de mutación 4)

Leídas las 112 citas vivas que apuntan a las líneas editadas, más el pase de abreviadas. Las de localización siguen ciertas. Dejaban
de serlo seis pasajes de exclusividad, ordinal o enumeración cerrada, corregidos en sitio en `1edae50`: la cuarentena que «comparte
el `if`» (`CLAUDE.md`), «última guarda de contenido» y la tabla del alta (`openspec/specs/tickets-core/spec.md`), y «la décima del
orden» y las dos tablas de la escalera (`openspec/specs/transitions-st/spec.md`). No se barrieron las citas a
`apps/desk/server/routes/tickets.ts`, que cambió una línea en sitio.

## Lo que queda anotado

- **IV-12 gana un cuarto punto**, sin corregir y sin destino: en la remisión la guarda de cargo (escalón B) corre detrás de guardas
  de contenido y de la remisión pendiente, porque el número de la orden sólo se conoce tras leer Books. En `CLAUDE.md` y en
  `openspec/config.yaml` (IV-12).
- **Diferencia entre puertas dentro del escalón C:** en el alta y en la remisión el contrato vencido se evalúa antes que «Garantía
  sólo con OVI»; en las transiciones, la garantía va dentro del `422` agregado, antes del vencido. No contradice el orden total.
- **Supuestos reversibles** (S-1 a S-10 de `proposal.md`). Los tres que cambian lo que ve una persona: reconfirmar la orden que el
  ticket ya tiene no pide cargo en ningún ticket, no sólo en los venidos de Zoho (S-3); la regla de garantía alcanza a la orden
  adicional de las aprobaciones (S-5); y es OVI todo número que empiece por `OVI-`, sin exigir la sintaxis completa (S-6, decidido
  por el orquestador en la fase de tareas).

## Tareas de persona — archivar NO las da por hechas

| Tarea | Dueño | Dónde queda escrito |
|---|---|---|
| Asignar el cargo Director Técnico ANTES de publicar; sin él sólo pasa el administrador | Gerencia y un administrador | `docs/sdd/Paquete_de_Despliegue_2026-10-06.md`, apartado 5 |
| Confirmar si una OVI sólo puede ir en tickets de garantía | Director Técnico | `decision/e157-ovi-garantia-por-cargo`, consecuencia 7 |
| Llevar al maestro la corrección 28 | Gerencia | `docs/sdd/F0-01_Correcciones_para_el_maestro.md` |
