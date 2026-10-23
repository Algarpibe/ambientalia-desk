# Tareas — `poblacion-cierre-variante-47-51` (F1F-05, `cierra: no`)

`strict_tdd`: cada tarea de producción va precedida de su tarea en ROJO, vista y anotada en `apply-progress.md` (salida y causa); luego el VERDE
mínimo. D* son de `design.md`; RQ-KP-* de `specs/kpis/spec.md`; M* de la tabla D8 (mismo número que las mutaciones de `proposal.md`). **Colocación
(mutación 4):** en `apps/desk/server/indicadores.ts` y `packages/shared/src/indicadores.ts` todo cambio es EN SU MISMA LÍNEA o va AL FINAL;
ninguna línea existente se desplaza. Las pruebas nuevas van al final de su fichero; los datos de las de hoy se ajustan en su línea (D6).
**Mutación** = aplicar, correr, ver el rojo con el nombre de la prueba (se anota), revertir y comprobar que el sha256 del fichero es el de antes.
Todo en el worktree `C:\dev\Desk_2_R1.023-worktrees\poblacion-cierre-variante-47-51`; rutas bajo `apps/desk/` salvo `packages/shared`.
Una rama, tres lotes (L1, L2, L3); cada lote es UN intento del registro, techo 800, válvula 720 medidas (`git diff --shortstat --no-renames <base>` +
`wc -l` de lo nuevo sin trackear; el `apply-progress` del lote cuenta). Sin PR encadenados.

**Cierre de lote (X.c):** commit del lote; luego, en UNA cadena: `set -o pipefail; npm run typecheck && npm run lint && npx tsx apps/desk/server/citas/cli.ts --sha HEAD && npm test`
(lint: 0 errores y 165 avisos, ninguno nuevo; si el recuento cambia se declara el nuevo; `npm test` sale 0); medida del lote; `apply-progress.md`.

## Lote L1 · shared (~215 × 1,8 → ~480 con progreso; ≤ 720)

- [x] L1.1 Línea base: `npm test` y `npm run typecheck` en verde; anotar los avisos de lint (esperado 165).
- [x] L1.2 ROJO `packages/shared/src/diaDeCierre.test.ts` (nuevo): `diaDeCierreDelTicket` — (a) mayor `performedAt` entre pasos a Finalizado, sin el marcador;
      (b) sin paso, `closed_time` por `cierreQueCuenta` con el ÚLTIMO marcador; (c) `null`; la transición manda sobre `closed_time` con días distintos (M8);
      migrado de origen `migracion` no cuenta (M4); día en Bogotá (23:30 local no salta). RQ-KP-34, incluido el escenario «La última transición a «Finalizado»»
      (`specs/kpis/spec.md:179-182`) y que una transición a «Anulado» NO cuenta como cierre. Rojo por símbolo inexistente.
- [x] L1.3 ROJO guardián de `TRANSICIONES_A_FINALIZADO` (mismo fichero): cada id del conjunto tiene `to === 'Finalizado'` en TODOS los catálogos de
      `CATALOGO_POR_FLUJO` donde aparece, y son los cinco de D1 (S-7). Regla de mutación 2.
- [x] L1.4 VERDE `packages/shared/src/diaDeCierre.ts` (nuevo, D1: `Set` derivado de `flujos.ts:19-22`, `diaEnZona` de `fechasDerivadas.ts:63`) y la línea 54 de
      `packages/shared/src/index.ts` (al final; hoy acaba en `:52`; la línea nueva es la 53).
- [x] L1.5 ROJO `packages/shared/src/indicadores.test.ts`: en su línea `:75`, `:77`, `:306-307`, `:332`, `:401` el motivo esperado pasa a
      `falta el hito: cierre del ticket` (título en su línea); AL FINAL, pruebas de RQ-KP-37: 47 = cierre − remisión de entrada, 51 = cierre − finalización ST,
      naturales con signo y `orden_invertido` sin duplicar, «sin dato» nombra el hito que falta (parte primero), la letra y `HITOS_POR_COLUMNA` intactas,
      M5 («el 47 no usa la salida», «el 51 no usa la entrega»).
- [x] L1.6 VERDE `packages/shared/src/indicadores.ts` en sitio: `:41` (`diaDeCierre?: DiaCivil | null`), `:88` (`MOTIVO_CIERRE`, D2), `:238` y `:241` (D3); `contraCierre` al final.
- [x] L1.7 Mutación M4: en `diaDeCierreDelTicket` pasar `null` como cierre de la migración → cae «el cierre de la migración no cuenta».
- [x] L1.8 Mutación M8 (regla 1): evaluar `closed_time` ANTES que la transición → cae «la transición manda» (activa las dos fuentes con días distintos).
- [x] L1.9 Mutación M5: en `:238`/`:241` pasar como cierre la remisión de salida / la entrega → caen «el 47 no usa la salida» y «el 51 no usa la entrega».
- [x] L1.10 Mutación G1 (regla 2): ensuciar lo vigilado — cambiar el `to` de `facturar` en `transitions.ts:262` → cae el guardián de L1.3.
- [x] L1.c Cierre de lote L1: X.c; medida; estimación **~480 (≤ 720)**; `apply-progress.md` con rojos y mutaciones.

## Lote L2 · servidor (~245 × 1,8 → ~530 con progreso; ≤ 720)

- [x] L2.1 Línea base: suite en verde con L1 aplicado.
- [x] L2.2 Datos en verde (D6), en su línea, sin mover ninguna: `INSERT` con `status_type = 'Closed'` y `closed_time = created_time` en `routes/indicadores.test.ts`
      (`:22`, `:77`, `:105`, `:114`, `:143`, `:154`, `:218`, `:227`, `:251`), `routes/indicadoresComparacion.test.ts` (`:37`, `:127`, `:315`, `:319` con `closed_time` en el `UPDATE`, `:335`),
      `server/indicadores.test.ts` (`:14`, `:191`) y `migracionMarcadorLectores.test.ts:55` (antepone `UPDATE tickets SET status_type = 'Closed'`). Siguen en verde con el código de hoy.
- [x] L2.3 ROJO `apps/desk/server/poblacionPorCierre.test.ts` (nuevo): RQ-KP-35 — cierre en el periodo con creación fuera (M1); anulado no entra (M2); abierto con `closed_time` dentro no entra (M3);
      migrado cuenta con la fecha de Zoho (M4); sin cierre y con periodo no entra, sin periodo sí (S-4); `flujo` se compone en el GET con la prueba «El flujo se compone» (M6); «Los bordes del periodo» (`specs/kpis/spec.md:237-240`: primer y último día inclusivos, un día fuera);
      el escenario MODIFIED de RQ-KP-22 de respuestas de tickets abiertos/anulados (`specs/kpis/spec.md:126-129`). RQ-KP-36 — cuatro consultas, sólo `SELECT`,
      el marcador sale en la misma consulta que el historial y no llega a los indicadores.
- [x] L2.4 ROJO en su línea `server/indicadores.test.ts`: `:150` título «mismo WHERE y mismos parámetros» y `:161` `length` 2 → 0 (ESTA es la aserción roja: hoy hay 2 parámetros de ventana).
      `:61` y `:63` pasan a la prueba de S-4 (`closed_time = NULL` además de `created_time`) y son CARACTERIZACIÓN (verde antes y después: con nulos el resultado es el mismo); su discriminante rojo
      de hoy es un ticket cerrado con creación fuera del periodo y cierre dentro, que se añade en `poblacionPorCierre.test.ts` (L2.3).
- [x] L2.5 VERDE `apps/desk/server/indicadores.ts` según la tabla de D4, en sitio (`:2`, `:53-54`, `:59`, `:60`, `:64`, `:65`, `:68`, `:69`, `:70`, `:73`, `:77`, `:78`, `:81`, `:84`); `poblacionPorCierre` al final.
      `:81` conserva el salto. Sólo lectura: ninguna escritura (S-2). `poblacionPorCierre` poda también `clasificaciones` (pasada en la llamada de `:84`) a los tickets admitidos;
      lo exige la prueba existente de `apps/desk/server/indicadores.test.ts:219-226` (`clasificaciones` sólo con admitidos, `size` = n).
- [x] L2.6 ROJO `routes/indicadoresComparacion.test.ts` (al final): un «ID» existente en Desk, abierto / anulado / cerrado fuera del periodo, cae en `fueraDelPeriodo`; el cuarto cubo mantiene su nombre (S-8; D5);
      `flujo` se compone en el POST (M6). Verde si D4 ya basta: se anota si nació rojo o verde y por qué (el POST hereda la lectura).
- [x] L2.7 Las tres sha256 (`routes/indicadores.test.ts:263`, `:271`; `routes/indicadoresComparacion.test.ts:326`): correr; si fallan, copiar a mano el hash «received»; si no, anotar «recalculado, bytes iguales»
      (pregunta abierta 1 de D6/RQ-KP-39). El commit nombra `decision/e224b-poblacion-indicadores`. El segundo escenario de RQ-KP-39 (`specs/kpis/spec.md:334-337`) lo cubren las
      caracterizaciones existentes de esas tres pruebas.
- [x] L2.8 Mutación M1: `poblacionPorCierre` corta por `diaEnZona(t.creadoEn)` → cae «cierre en el periodo, creación fuera».
- [x] L2.9 Mutación M2: quitar el `continue` de `esAnulado` (`:68`) → cae «un anulado no entra».
- [x] L2.10 Mutación M3: no empujar el filtro de `:59` → cae «un abierto no entra».
- [x] L2.11 Mutación M4 en el servidor: `poblacionPorCierre` ignora el marcador (lo pasa como `undefined`) → cae «migrado con la fecha de Zoho».
- [x] L2.12 Mutación M6: `recortarPorFlujo` (`:114-117`) devuelve siempre `e` → cae «El flujo se compone» (RQ-KP-35) en el GET; y `fl.flujo` → `null` en `indicadoresComparacion.ts:34` → cae «El flujo se compone» en el POST (L2.6).
- [x] L2.c Cierre de lote L2: X.c; medida; estimación **~530 (≤ 720)**; `apply-progress.md` con rojos, mutaciones y la nota de las sha256.

## Lote L3 · aceptación y barrido (~175 × 1,8 → ~405 con progreso; ≤ 720)

- [ ] L3.1 Línea base: suite en verde con L2 aplicado.
- [ ] L3.2 ROJO `apps/desk/server/routes/indicadoresSeptiembre.test.ts` (nuevo, arnés `instalarArnes`/`appWith`/`adminCookie` de `testing/appHarness.ts:34-39`): `GET /api/indicadores?desde=2026-09-01&hasta=2026-09-30` —
      (1) trece tickets; (2) el único creado en septiembre es el 998; (3) `it.each` POR INDICADOR (47, 49, 50·53, 51, 54, 57, 58, 59): `formulaZoho` vs celda de Gerencia, ±1 en números y igualdad en el 54, sólo
      donde hay valor, con el recuento 11, 9, 11, 12, 9, 9, 9, 9; (4) toda clave del fixture está en la lista cerrada de S-10. Rojo por fixture inexistente.
- [ ] L3.3 VERDE `apps/desk/server/testing/septiembre2026.ts` (nuevo): `TICKETS_SEPTIEMBRE` (`sep-01`…`sep-13`) y `sembrarSeptiembre(db)` según D7 (mediodía de Bogotá, `status_type = 'Closed'`, cada fecha en su
      columna de `COLUMNA_DE_HITO`, `server/indicadores.ts:12-18`). Datos comprobados a mano contra el CSV (sin copiarlo); sin contacto, asunto, serial, `cf_codigo_servicio` ni tipo de servicio.
- [ ] L3.4 Mutación M1 en la aceptación: cortar por creación → cae (1) trece tickets.
- [ ] L3.5 Mutación M7-47 (regla 2): en el FIXTURE, la celda `gerencia['47']` de un ticket +2 → cae la fila del 47; revertir.
- [ ] L3.6 Mutación M7-49: ídem `gerencia['49']` → cae la fila del 49.
- [ ] L3.7 Mutación M7-50·53: ídem `gerencia['50_53']` → cae la fila del 50·53.
- [ ] L3.8 Mutación M7-51: ídem `gerencia['51']` → cae la fila del 51.
- [ ] L3.9 Mutación M7-54: ídem `gerencia['54']` (`Cumple` → `No cumple`) → cae la fila del 54.
- [ ] L3.10 Mutación M7-57: ídem `gerencia['57']` +2 → cae la fila del 57.
- [ ] L3.11 Mutación M7-58: ídem `gerencia['58']` +2 → cae la fila del 58.
- [ ] L3.12 Mutación M7-59: ídem `gerencia['59']` +2 → cae la fila del 59.
- [ ] L3.13 **Barrido de la regla de mutación 4** sobre `apps/desk/server/indicadores.ts` y `packages/shared/src/indicadores.ts`: (1) `git diff -U0 <base> -- <fichero>` sólo con trozos en sitio o tras la última línea;
      (2) `git grep -nE "indicadores\.ts:[0-9]+"` (formas completas, SIN excluir `openspec/changes/archive/`), cada resultado leído contra lo que afirma su frase (casos A/B/C); (3) pase de abreviadas (`:NN`) en cada
      fichero que ya cita el módulo; (4) detector de pre-push. Conocido: `openspec/specs/kpis/spec.md:1447` cita `server/indicadores.ts:70` → caso A (se reapunta a `:60` al archivar, misma línea);
      `DEPLOY.md:615` (`:85`) y `migracionMarcadorLectores.test.ts:54`, `:58` siguen ciertas. NO se toca `openspec/config.yaml` (ver «Fuera de la rama»).
- [ ] L3.14 Tabla de la regla invariable 13 (mutación 3): cero decisiones nuevas del cliente (no se toca `apps/desk/src`); se anota en `apply-progress.md` con `git diff --stat` que lo prueba.
- [ ] L3.c Cierre de lote L3: X.c; medida; estimación **~405 (≤ 720)**; `apply-progress.md` con las 8 mutaciones M7 por indicador, rojas y restauradas.

## Fuera de la rama — tareas del orquestador en `main` (no se cuentan)

La rama NO toca `openspec/config.yaml`; lo escribe el orquestador en `main` tras la fusión, con el molde de hunk y el ancla «en `f0eb92c4`».

| # | Qué | Caso |
|---|---|---|
| O-1 | `openspec/config.yaml:4096` cita `MOTIVO_H1` en `:88`: nombrar la revisión en la cita (`MOTIVO_H1`, `:88` en `f0eb92c4`) y decir que hoy es `MOTIVO_CIERRE` | B |
| O-2 | `openspec/config.yaml:5199-5200` citan `:59` y `:67` de `apps/desk/server/indicadores.ts`: anclarlas «en `f0eb92c4`» | B |

## Tareas de persona — fuera del recuento

Regla del ciclo 1: no son unidades de trabajo del repositorio. **Archivar no las da por hechas.**

| # | Qué | Dueño | Destino | Dónde queda escrito |
|---|---|---|---|---|
| P-1 | Corregir, si procede, S-1 a S-11 | Gerencia | supuestos aceptados con fecha | lista semanal de supuestos (regla E-237) |
| P-2 | Probar en la app los indicadores de septiembre por cierre | Gerencia / analista | dar por visto el comportamiento | lista acumulada de pruebas en la app |

## Review Workload Forecast

| Lote | Bruto | ×1,8 | Con progreso | Tareas |
|---|---|---|---|---|
| L1 | ~215 | ~390 | ~480 | 11 |
| L2 | ~245 | ~440 | ~530 | 13 |
| L3 | ~175 | ~315 | ~405 | 15 |

Desviación frente a `proposal.md:149-151` (≤ 400 / ≤ 450 / ≤ 400): la diferencia es el `apply-progress` de cada lote (~90); los tres siguen ≤ 720.

Decision needed before apply: No — resolved: split by lots (una rama, L1/L2/L3, un intento por lote, techo 800, válvula 720; sin PR encadenados)
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium
