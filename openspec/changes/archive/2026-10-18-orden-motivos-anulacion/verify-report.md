# Verify-report · `orden-motivos-anulacion` (F1C-01, `cierra: no`) · intento 3

Veredicto: **PASS**. CRITICAL 0 · WARNING 0 · SUGGESTION 2.
Revisión verificada: `2e62591` (planificación `569054c`, base `8f629b5`). Árbol limpio antes y después (`git status --short` vacío).

## 1. RQ-TS-41 contra pruebas (`packages/shared/src/anulacion.test.ts`, bloque `:188-219`)

| Requisito / escenario | Prueba |
|---|---|
| SHALL función pura, al final del fichero | `anulacion.ts:61-72`; las líneas 1-59 intactas (`git diff`: sólo 13 inserciones) |
| SHALL en las dos esperas: «Repuesto no disponible», «Sin solución técnica», luego el orden relativo, «Otro» último | `it.each(ESPERAS)` `:197-199` (`[M3,M2,M1,M4,M5]`) |
| SHALL en otro estado, el orden de `MOTIVOS_ANULACION` | `it.each(OTROS)` `:200-202` (5 estados, incl. `Notificación cliente`, `Rev./Diagnostico`) |
| MUST NOT añadir ni quitar un motivo | `:203-205` (mismo conjunto ordenado, 7 estados) |
| «Otro» siempre último | `:206-209` |
| MUST NOT apoyarse en la clase `externa` | `anulacion.ts:61` nombra los dos estados; la prueba de `Notificación cliente` (`:200-202`) la cazaría (M2b) |
| Las dos esperas son origen de `anulacion` | `:216-219` |
| Copia defensiva (D5) | `:210-215` |
| Desplegable consume la función para `CLAVE_MOTIVO_ANULACION` | `TransitionPanel.tsx:163`; sin prueba (los `.tsx` están fuera de la red por decisión de Gerencia, F0-00): presentación |
| Servidor MUST NOT cambiar | `git diff 8f629b5 2e62591 --stat -- apps/desk/server` vacío (0 líneas) |
| Escenarios 1-4 (ROJO) | = filas 2-5 anteriores |
| Escenario 5 (servidor acepta desde la espera) | `apps/desk/server/anulacion.test.ts:54-58` (5 orígenes, incluidas las dos esperas) y `:59-62` (cuatro motivos desde `Servicio externo`), leídos: correcto |

«MUST NOT existir restricción de motivo por estado de origen»: `erroresAnulacion` (`anulacion.ts:50`) no recibe el estado; sin cambio en el diff.

## 2. Tareas
1.1-2.5 `[x]` y describen trabajo hecho (diff y evidencia lo confirman). 3.1 `[ ]` es ESTE informe; 4.1-4.4 pendientes, correcto. P-1 y P-2 son de personas y están fuera del recuento (regla del ciclo 1).

## 3. Evidencia strict TDD
- `apply-progress.md` registra rojo (23 de 61, `motivosAnulacionOrdenados is not a function`) y verde 61/61, y ocho mutaciones restauradas. Coherente con el diff: 23 = 2+5+7+7+2 pruebas nuevas que usan la función.
- Mutación propia, reproducida por mí: variante de M3b (la constante `MOTIVOS_PRIMERO_EN_ESPERA` pierde «Sin solución técnica»). Resultado: **2 rojas, 59 verdes** (`en En Espera de Repuestos van primero…` y `en Servicio externo van primero…`). Restaurado con `git checkout`; `git diff --quiet` = 0.
- El orquestador ya reprodujo M1 (2 rojas) y M4 (10 rojas).
- `npm test`: 292 ficheros pasan, 3 omitidos, 4909 pruebas pasan, 11 omitidas.

## 4. Regla invariable 13 / mutación 3 — decisiones del cliente en `TransitionPanel.tsx:163`

| Decisión del cliente | ¿Bloquea? | ¿Rellena? | ¿Avisa? | Contrapartida en el servidor |
|---|---|---|---|---|
| Reordena las opciones del `select` del motivo en las dos esperas | no | no | no | **Presentación, sin contrapartida**: consecuencia 2 de `decision/f1c01-motivos-esperas` (`openspec/config.yaml:5041`) «el orden es presentación; la lista la sigue imponiendo el servidor» |
| Las opciones siguen siendo las de `MOTIVOS_ANULACION` | no | no | no | `erroresAnulacion` (`anulacion.ts:50`), probada en `apps/desk/server/anulacion.test.ts:54-62` |
| Ningún valor por defecto (el `select` conserva «Elegir…» `:258`) | no | no | no | — (no hay decisión nueva) |

El cliente no bloquea, no rellena ni avisa nada nuevo: sólo ordena, y el orden no tiene contrapartida porque no es una regla. Un orden «equivocado» no puede producir un estado inválido.

## 5. Regla de mutación 4
- `anulacion.ts`: 59 → 72 líneas, sólo crece al final. `anulacion.test.ts`: 186 → 219 con el import ampliado en sitio (`:4`, mismo número de líneas). `TransitionPanel.tsx`: 267 → 267 (`:8` y `:163` en sitio).
- Barrido `anulacion(.test).ts:N` fuera de los artefactos de este cambio: 17 coincidencias, **todas** en `openspec/changes/archive/2026-10-18-anulado-con-motivo/verify-report.md:23-49`. Las leídas con ruta completa apuntan a `apps/desk/server/anulacion.test.ts` (p. ej. `:47-49`: `:164-172`, `:180-187`, `:188-191`), no al fichero compartido, y el servidor no cambió. Las demás son abreviadas del mismo informe, del mismo molde (fichero del servidor, hipótesis: no abrí cada una; las comprueba el detector). Ninguna cita al fichero compartido más allá de `anulacion.ts:59` / `anulacion.test.ts:186`, salvo los artefactos de este cambio.
- `TransitionPanel.tsx:16[0-9]`: hits sólo a `:160` (docs/sdd/Paquete_de_Despliegue y archivos de `prioridad-*`). La línea 160 sigue siendo el `active.fields.filter((f) => f.target !== 'priority' || … puedeAjustarPrioridadTicket(user))`, lo que esas citas afirman; la edición `:163` queda en la línea de `f={…}`, que no citan.

## 6. Códigos de salida (comandos separados)
- `npm test`: **0**
- `npm run typecheck`: **0**
- `npm run lint`: **0**
- `tsx apps/desk/server/citas/cli.ts --sha HEAD`: **0**

## Hallazgos
- **SUGGESTION 1.** Mi mutación (quitar un motivo de la lista «primero») cae sólo en 2 pruebas y no en las de conjunto, porque la función rellena el resto desde `MOTIVOS_ANULACION`. Es coherente por construcción (la función no puede perder un motivo que está en la fuente); `apply-progress.md` registra M3b con 15 rojas porque quitaba el motivo del resultado, no de la lista inicial. Sin acción.
- **SUGGESTION 2.** «Otro» con detalle desde una espera no tiene prueba propia (reconocido en el escenario 5 como hipótesis; `anulacion.ts:50` no mira el origen). Sin acción en este cambio.

Siguiente: `sdd-archive` (techo para la mudanza, regla del archivo).
