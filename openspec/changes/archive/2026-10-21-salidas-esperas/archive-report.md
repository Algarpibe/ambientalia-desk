# Informe de archivo — `salidas-esperas` (F1C-03, `cierra: si`)

Archivado el 2026-10-21 en `openspec/changes/archive/2026-10-21-salidas-esperas/`, rama `salidas-esperas`, worktree
`C:\dev\Desk_2_R1.023-worktrees\salidas-esperas`, base `24b86092`. **Sin fusionar a `main`**: la fusión es un encargo aparte.

**Qué cubre de la fila (sostiene `cierra: si`):** F1C-03 (plan R01.4, fila de F1C-03 y fila de E-101) queda construida
entera: las cuatro esperas tienen la salida que fija `decision/c3-salida-esperas` (Repuestos y Servicio externo: cobro de
diagnóstico o anulación, decide Comercial; Solicitado vuelve a Repuestos; SKU sin abandono), la caducidad por plazos
medidos sugiere o escala y nunca ejecuta, y las salidas las ejecuta la persona a cargo o su respaldo con motivo
(`decision/salida-emergencia-quien-la-ejecuta`), todo detrás de `SALIDAS_ESPERAS`, que nace cerrado. **Deja fuera, y no es
contenido de la fila:** el nivel general «propietario del registro» para el resto de transiciones (fila de permisos), las
ausencias por persona (F4-01) y el importe del cobro del diagnóstico.

## 1. Commits de la rama

| Intento | Commit | Contenido | Medida `--no-renames` (registro) |
|---|---|---|---|
| I1 | `c718b9be` | propuesta y deltas (transitions-st, permissions, derivacion-avisos) | 522 |
| I2 | `9dac72c8` | diseño y tareas | 332 |
| I3a | `df53227f` | catálogo 40/23/49, `SALIDAS_ESPERAS` con `409`, plazos, RQ-TS-56, vigilantes y barridos HTTP | 677 |
| I3b | `3d33f071` | regla pura del ejecutor, compuesta, `DEPLOY.md` §17 y `.env.example` | 367 |
| I4 | `59c8b76e` | `403` del ejecutor, `422` del motivo del respaldo, ruta de contexto, panel | 419 |
| I5 | `165d5c2d` | alarma de caducidad, cableado, corrección 37 del maestro, barrido de citas | 644 |
| I6 | `c95b0f9a` | verify PASS con avisos y casillas de cierre | 205 |
| I7 | este commit | archivo (ver §6) | ver §6 |

Cada intento se midió con `git diff --shortstat --no-renames <base>` más `wc -l` de lo nuevo sin trackear, y el registro
de intentos asentó exactamente esa cifra. Ninguno superó la válvula de 720. I3a absorbió lo mínimo de I4 (el `409` del
interruptor y los barridos HTTP) porque la suite del servidor no podía quedar verde con el catálogo nuevo y sin esa guarda.

## 2. Grafo, antes y después

| | Antes (`24b86092`) | Después |
|---|---|---|
| Transiciones de servicio | 38 | **40**: `cobro_diagnostico_espera` (ER y SE → Por Facturar, Comercial, Decisional) y `sin_pieza_en_almacen` (Solicitado → ER, Servicio Técnico, Compras / Logístico) |
| Estados de servicio | 23 | 23 |
| Pasos del mapa | 46 | **49** (+2 del cobro, que sale de dos estados; +1 de sin pieza) |
| Tabla de tipos de evento | 52 filas | 54 |
| Entradas a Por Facturar sin Control de calidad (RQ-TS-56, encendido) | los tres rechazos | los tres rechazos y `cobro_diagnostico_espera` |
| Salidas de Solicitado / SKU a Anulado o Por Facturar | ninguna | ninguna (RQ-TS-63, fijado por prueba) |

Las dos transiciones van en la misma línea física que `anulacion` (`packages/shared/src/transitions.ts:262`): ninguna cita
de ese fichero se desplazó.

## 3. Verify

PASS CON AVISOS (`verify-report.md`): 0 CRITICAL, 3 WARNING, 3 SUGGESTION; 45/45 escenarios con prueba y uno manual (el
panel de RQ-PM-45) fuera del recuento. Estado final de los avisos:

- **W1** (casillas de cierre de lote sin marcar): **cerrado** en `c95b0f9a`.
- **W2** (sin barrido HTTP que cruce la compuesta con la respuesta del servidor): **sigue**; la garantía es estructural,
  cliente y servidor llaman a la misma `ejecutorDeSalida`.
- **W3** (el reintento tras un fallo de aviso no se observa en pg-mem, que no honra `ROLLBACK`): **sigue**, límite del
  entorno de pruebas, misma estructura que F1B-08.
- **S3** («M1-M8» en la tarea I6.1): M7 es el conjunto de mutaciones de posición SE-0..SE-5; no hay M8. Errata del `tasks.md`.

## 4. Mutaciones

Todas ejecutadas con copia y restauración por copia (hash igual), nunca con `checkout` ni `stash`. El verify reprodujo
por su cuenta las de la lista del encargo:

| Mutación del encargo | Qué se mutó | Qué cayó |
|---|---|---|
| La caducidad ejecuta una salida sola | `UPDATE tickets` / `INSERT INTO ticket_transitions` tras avisar | «nunca ejecuta» (comportamiento y fuente) |
| Aviso antes del plazo | `dias >= plazo - 1` | «un día antes no avisa» ×4 y el literal de `plazosEsperas` |
| Dos avisos por el mismo vencimiento | avisar sin marcar | «dos pasadas, un aviso», «reentrada», «una vez por día civil» |
| Espera interna que sugiere en vez de escalar | «o anular» en Solicitado, «o cobrar» en SKU | prueba de textos (3 cada una) |
| Solicitado o SKU con abandono o anulación | `anulacion` / cobro desde Solicitado o SKU; quitar `sin_pieza_en_almacen` | RQ-TS-63 y `estados.test.ts` |
| Plazo derivado de `SLA_HORAS_POR_ESTADO` | `plazosEsperas.ts` importa `sla.ts`; `Solicitado: 5` en el SLA | prueba de fuente y disjunción |
| Posición de las guardas nuevas | SE-0, SE-1, SE-2, SE-2b, SE-3, SE-5 | su prueba de posición en cada caso |

Tres movimientos no cayeron y quedan declarados en D3: el interruptor de salidas antes del de control de calidad y el
ejecutor antes de `cargoFalta` son pares disjuntos (prueba de disjunción añadida), y mover el ejecutor tras Decisionales
es equivalente por construcción; esa posición la fija la condición `!ejecutor`, cuya mutación sí cae (RQ-PM-43).

## 5. Regla 13, decisión a decisión

| Decisión del cliente (`TransitionPanel.tsx`) | Línea del servidor que la impone |
|---|---|
| Oculta las dos nuevas con el interruptor apagado | `apps/desk/server/services/ticketService.ts:128` (`409`) |
| Oculta las tres salidas a quien no es persona a cargo ni respaldo | `ticketService.ts:131` (`403` del ejecutor; el área precede en `:129`) |
| Ofrece el cobro a la persona a cargo sin cargo, con Decisionales encendido | `ticketService.ts:131` (Decisionales sólo sin ejecutor) |
| Pide «Motivo del respaldo» al respaldo y no a la persona a cargo | `ticketService.ts:134` (`422`) |
| Vacante del Coordinador Técnico | `apps/desk/server/services/decisionales.ts:20`, la misma función en la guarda y en la ruta |
| Sin respuesta de la ruta, asume apagado | ninguna: degradación declarada (S-20); el cliente sólo puede ocultar de más |

El servidor lee `derivado_a` de la base, nunca del navegador.

## 6. Archivo

- **Fusión del delta, por script y comparando bloques:** RQ-TS-56 sustituido en sitio a igual longitud (18 líneas,
  `openspec/specs/transitions-st/spec.md:3215-3232`); RQ-TS-60..64, RQ-PM-42..45 y RQ-AV-25..27 añadidos al final de sus
  specs vivas.
- **Cifras vivas sustituidas en su línea (sin mover ninguna):** RQ-TS-26 (40 / 49 / 23), la matriz de áreas de
  transitions-st y de RQ-PM-03 (120 casos, 73 y 47), el barrido de ejecución (40 transiciones, 47 ejecuciones), la tabla
  de tipos (54 filas, 40 de servicio) y `capabilities` → `transitions-st` en `openspec/config.yaml:110`. RQ-TS-58 y
  RQ-PM-40 quedan como registro de F1C-08, igual que F1C-08 dejó RQ-TS-51 de F1C-07: RQ-TS-62 las precisa.
- `apps/desk/server/reconciliacion/registro.test.ts`: «en curso» vuelve a NUEVE y F1C-03 pasa a «cerradas por archivo».
- **Regla del archivo:** la parte revisable (fusión, cifras, prueba y este informe) se midió antes del commit y queda
  bajo 800; la mudanza va aparte y no pide techo. Medidas exactas y `git show --numstat` en el parte de cierre.

## 7. Supuestos reversibles

S-1..S-11 en `proposal.md` §10 y S-12..S-22 en `design.md` D8. **S-1, S-2, S-3 y S-12 tocan permisos** (quién es la
persona a cargo, qué pasa con un derivado nulo o de otra área, el administrador como respaldo): suben al apartado 06 del
panel (E-237). No frenaron la construcción porque el interruptor nace cerrado. El resto va a la lista semanal.

## 8. Notas para el expediente y la supervisión

- **R-7:** el discriminador de `packages/shared/src/estados.ts:131-140` sigue hablando de «la única salida» y de «un alta en
  otro sistema», desfasado con c3. Los comentarios de la lista (`:154`, `:158`) sí se corrigieron en sitio.
- **Corrección 37** para el maestro (M1.3.4), al final de `docs/sdd/F0-01_Correcciones_para_el_maestro.md`.
- **Cita reparada** (caso B): `docs/sdd/ENTRADA.md:2148` ahora ancla `estados.ts:144-145` en `24b86092`. ENTRADA.md es uno de
  los ficheros de Supervisión con cambios sin commitear en `main`: la fusión tendrá que tratarlo como `openspec/config.yaml`.
- **Plazos provisionales:** 79/31/20/13 salen de `medicion/p90-esperas-2026-10-21`, muestras de 12 a 40 estancias, todas de
  Zoho. Se recalculan con medición nueva y clave propia.

## 9. Tareas de persona (fuera del recuento; archivar no las da por hechas)

| Qué | Dueño | Dónde queda escrito |
|---|---|---|
| Preguntas S-1, S-2, S-3 y S-12 al apartado 06 del panel | Gerencia | `decisiones_de_gerencia` cuando responda |
| Encender `SALIDAS_ESPERAS=true` (no antes del 14/12/2026) | Gerencia | `DEPLOY.md` §17 |
| Prueba en la app (lista acumulada) | Gerencia / verificación | lista de pruebas pendientes |
| Recalcular los plazos con medición nueva | Gerencia mide; la construcción aplica | `mediciones_de_produccion` |
