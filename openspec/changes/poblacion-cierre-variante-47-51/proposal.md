---
tanda: F1F-05
motivo: ""
capacidad: [kpis]
maestro: ["Anexo G"]
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta: población por cierre y variante de Zoho del 47 y del 51

## Intención

Gerencia fijó el 22/10 qué tickets cuentan en los nueve indicadores y con qué fórmula calcula Zoho el 47 y el 51:

- `decision/e224b-poblacion-indicadores` (`openspec/config.yaml:5186-5207`): población = tickets del departamento, de los
  tres flujos, **cerrados en el periodo**; fuera los anulados; cada indicador cuenta sólo los tickets con sus dos hitos.
- `decision/e224c-formulas-47-51-y-contraste` (`openspec/config.yaml:5226-5242`): 47 = cierre − remisión de entrada y
  51 = cierre − finalización ST, en días naturales; el «último cambio de estado» es el CIERRE.
- `decision/h1-fechas-migrados` (`openspec/config.yaml:4854-4871`): en los migrados cuenta la fecha original de Zoho; la
  de la migración no entra en ningún indicador.

Hoy el código hace otra cosa: corta por **creación** en SQL (`apps/desk/server/indicadores.ts:59-60`, sobre
`t.created_time`) y en memoria (`apps/desk/server/indicadores.ts:67-70`), deja entrar abiertos y anulados, y las
variantes de Zoho del 47 y del 51 son siempre «sin dato» (`packages/shared/src/indicadores.ts:238`, `:241`, con el
motivo de `:88`). Con la exportación de septiembre, la población por creación sería un solo ticket (el 998, el único
creado en septiembre); por cierre son los trece. Sin este cambio, el contraste de cuatro semanas que pide el maestro
(Anexo G, `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2957`) compararía poblaciones
distintas.

`cierra: no`: F1F-05 incluye además la encuesta de satisfacción (55), que depende de la salida de correo de 1H-01
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md:47-49`).

## Alcance

### Dentro

1. **Parte 1 — población por defecto** de `GET /api/indicadores` (json y csv) y de `POST /api/indicadores/comparacion`:
   tickets cerrados, no anulados, cuyo día de cierre en Bogotá cae en `desde`/`hasta`. Los dos endpoints leen por
   `leerEntradasIndicadores` (`apps/desk/server/routes/indicadoresComparacion.ts:33`), así que el cambio es uno. El
   filtro `flujo` (RQ-KP-29 a RQ-KP-32) se compone encima, sin cambios.
2. **Parte 2 — variante `formulaZoho` del 47 y del 51** en `packages/shared` (regla invariable 13). La letra no cambia
   (47 = remisión de entrada → remisión de salida; 51 = finalización → transición de entrega).
3. **Parte 3 — prueba de aceptación** con los trece tickets de la exportación de septiembre como fixture anonimizado.

### Fuera

- La encuesta y el 55 (dependen de 1H-01).
- El selector de periodo y de flujo del cliente: ya existe y no cambia; esta tanda no toca `apps/desk/src`.
- Escribir `closed_time` desde la aplicación al cerrar (ver S-2): se lee, no se repara.
- Filtrar por departamento (ver S-6).
- Cualquier cambio de la letra de los nueve indicadores o del cálculo de 49, 50·53, 54, 57, 58 y 59.

## Capacidades

- Nuevas: ninguna.
- Modificadas: `kpis`. Piezas que la spec delta MODIFICA: SP-5 (`openspec/specs/kpis/spec.md:31`); RQ-KP-11
  (`:405`), filas del 47 (`:413`) y del 51 (`:417`) y sus escenarios (`:441-449`); RQ-KP-13 (`:479`, «sobre el día de
  creación», `:481`); el escenario de RQ-KP-22 «creado fuera del periodo» (`:1011-1012`) y el de RQ-KP-25 «día de
  creación fuera» (`:1136-1139`). RQ-KP-14 (`:501`) se conserva: cuatro consultas, sólo lectura.

## Enfoque por piezas

| Pieza | Dónde | Qué |
|---|---|---|
| Día de cierre puro | `packages/shared` (junto a `cierreEnCifras.ts`) | Función pura: historial de la app + `closed_time` + cierre puesto por la migración → día de cierre en Bogotá o `null` (S-1). Reutiliza `esPasoDeMigracion` (`packages/shared/src/cierreEnCifras.ts:19-21`), `cierrePuestoPorMigracion` (`:24-26`) y `cierreQueCuenta` (`:29-33`). «Cerrado y no anulado» con el precedente de `:53` |
| Variante 47/51 | `packages/shared/src/indicadores.ts` | `formulaZoho` del 47 = cierre − remisión de entrada; del 51 = cierre − finalización ST; naturales, con signo y la marca `orden_invertido` como `naturales` (`:139-144`). `MOTIVO_H1` deja de usarse en las dos; «sin dato» nombra el hito que falta |
| Lectura y población | `apps/desk/server/indicadores.ts` | El corte pasa del día de creación al día de cierre. El marcador de la migración, que hoy se descarta en `:81`, se lee en la MISMA consulta para pasarlo a `cierreQueCuenta`: siguen siendo cuatro consultas (`:64`, `:76`, `:85` y `listarCierres`) |
| Pruebas sha256 | `apps/desk/server/routes/indicadores.test.ts:263`, `:271`; `apps/desk/server/routes/indicadoresComparacion.test.ts:326` | Se ACTUALIZAN por decisión de Gerencia, no se borran; el commit nombra `decision/e224b-poblacion-indicadores` |
| Fixture y aceptación | `apps/desk/server` (`.ts` nuevo) | Trece tickets anonimizados; la prueba pide a la ruta septiembre y compara (S-9, S-10) |

## Supuestos (todos reversibles; van a la lista semanal de Gerencia, regla E-237)

- **S-1 · Qué es «el cierre» de un ticket.** Por orden: (a) el `performed_at` de la ÚLTIMA transición de la aplicación
  cuyo destino es «Finalizado», excluido el marcador de la migración; (b) si no hay, `closed_time` pasado por
  `cierreQueCuenta`; (c) si tampoco, no tiene cierre que cuente. *Razón:* la aplicación nunca escribe `closed_time` al
  cerrar: `writeTransition` sólo pone estado y `status_type` (`packages/zoho-sync/src/db/repo.ts:298`), y
  `status_type` es `Closed` con destino «Finalizado» o «Anulado» (`apps/desk/server/transitionExec.ts:5`, `:39`). Un
  ticket cerrado en la aplicación tiene `closed_time` nulo o el de Zoho de antes (`packages/zoho-sync/src/db/schema.sql:26`).
- **S-2 · Sólo lectura.** No se escribe `closed_time` ni se rellena nada; la lectura no crece con el número de tickets
  (RQ-KP-14).
- **S-3 · Los migrados.** La migración escribe la fecha de Zoho si la trae y si no el instante de la migración
  (`packages/shared/src/migracionTickets.ts:123-129`) y deja el origen en el `values` de su marcador
  (`apps/desk/server/db/migracionTicketsAbiertos.ts:72-75`; `UPDATE` en `:85-88`). El de origen `migracion` no cuenta
  (`decision/h1-fechas-migrados`, consecuencia 1); mismo criterio que Análisis (`apps/desk/server/analisis.ts:26`).
- **S-4 · Sin cierre que cuente.** Con periodo no entra; sin periodo entra, coherente con lo que hoy hace RQ-KP-13 con
  un ticket sin `created_time` (`apps/desk/server/indicadores.ts:69`).
- **S-5 · Sin periodo.** Todos los cerrados no anulados. «Cerrado» = `status_type = 'Closed'` y estado no anulado
  (precedente `packages/shared/src/cierreEnCifras.ts:53`). El corte en SQL pasa a ser por `status_type`; el del día, en
  memoria con `diaEnZona`, como hoy.
- **S-6 · Departamento.** No se filtra: `tickets` no tiene columna de departamento y la sincronización sólo pide un
  departamento, `ZOHO_DEPARTMENT_ID` (`packages/zoho-sync/src/config.ts:81`; `packages/zoho-sync/src/sync.ts:139`,
  `:161`, `:395`; valor en `DEPLOY.md:86`). **Hipótesis**: que ese ID sea «Ambientalia Soporte y Servicio Técnico»; no
  es verificable sin la base.
- **S-7 · Transición «a Finalizado».** Se reconoce por el catálogo compartido (destino `Finalizado`, p. ej.
  `packages/shared/src/transitions.ts:242`, `:250`, `:359`, `:391`), no por una columna nueva en la consulta del
  historial. *Razón:* fuente única (regla 13) y la sentencia de `apps/desk/server/indicadores.ts:76` no cambia.
- **S-8 · Cubo «fuera del periodo».** Un «ID» del fichero que existe en Desk pero queda fuera de la población (abierto,
  anulado o cerrado fuera del periodo) sigue cayendo ahí (`apps/desk/server/comparacion/cruzarExportacion.ts:37-41`);
  el cubo no cambia de nombre.
- **S-9 · Tolerancia ±1 día** en la aceptación: la del Anexo G
  (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2957`).
- **S-10 · Fixture.** Sólo número, clasificación, estado, fechas y las columnas 47-59 (incluida la 52, días de
  entrega). NI contacto, NI asunto, NI serial, NI `cf_codigo_servicio` (lleva el serial dentro), NI tipo de servicio.
  `Fecha creación ticket` = `createdTime`; el cierre se carga a mediodía de Bogotá para que el día no dependa de la
  zona; `status_type = 'Closed'`. El 58 usa `cf_fecha_orden_de_compra` y el 59 `cf_fecha_orden_de_venta`
  (`decision/e224c-formulas-47-51-y-contraste`; comprobado a mano en el 939: 58 = 7, 59 = 0). El CSV de origen sigue
  sin trackear y no se copia.
- **S-11 · Negativos.** La variante del 47 y del 51 no lleva tope 0: un negativo sale con `orden_invertido`, como las
  demás naturales (consecuencia 3 de `decision/e224c-formulas-47-51-y-contraste`).

## Criterios de éxito

- [ ] Septiembre por cierre devuelve los trece tickets del fixture (por creación devolvía uno).
- [ ] `formulaZoho` coincide (±1) con Gerencia en las celdas con valor de los ocho indicadores de tiempo: 47 → 11,
      49 → 9, 50·53 → 11, 51 → 12, 54 → 9, 57 → 9, 58 → 9, 59 → 9.
- [ ] Anulados y abiertos fuera; migrados con la fecha de Zoho; `flujo` se compone; cuatro consultas, sólo lectura.
- [ ] Las tres sha256 actualizadas citando la decisión; `npm test`, `npm run typecheck` y `npm run lint` en verde.

## Mutaciones mínimas (se reproducen en apply; cada una debe poner algo en rojo)

1. Cortar por día de creación en vez de por cierre.
2. Dejar entrar los anulados.
3. Dejar entrar los abiertos.
4. Usar la fecha de la migración en vez de la original de Zoho.
5. Calcular el 47 o el 51 contra la remisión de salida o contra la entrega en vez del cierre.
6. Dejar de componer el filtro `flujo` sobre la nueva población.
7. Alterar en el fixture un valor de cada uno de los ocho indicadores (una mutación por indicador).
8. Mutar la PRECEDENCIA de S-1: `closed_time` antes que la transición a «Finalizado» (regla de mutación 1).

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| MODIFIED a mitad de `openspec/specs/kpis/spec.md` desplaza citas `spec.md:NNNN` | Alta | El delta conserva el número de líneas de cada bloque, o lo nuevo va al final; barrido de la regla de mutación 4 al archivar |
| `apps/desk/server/indicadores.ts` y `packages/shared/src/indicadores.ts` son muy citados | Alta | Lo nuevo al final del fichero o en su misma línea (`:88`, `:238`, `:241`, `:59-60`, `:67-70`, `:81`); barrido de citas en el cierre de cada lote |
| El corte por `status_type` lee todos los cerrados sin ventana de fechas | Media | **Hipótesis**: el volumen (cientos a pocos miles) lo admite; siguen siendo cuatro consultas. Si no, prefiltro por `closed_time` o por transición a «Finalizado» en la ventana, en diseño |
| Un ticket cerrado en Zoho y luego tocado en la app con fechas cruzadas | Baja | S-1 da preferencia a la app; reversible |
| Pruebas de `packages/shared/src/indicadores.test.ts` que hoy fijan «sin dato» en 47/51 | Segura | Se actualizan por `decision/e224c-formulas-47-51-y-contraste`, igual que las sha256 |
| Fuga de datos del CSV al fixture | Baja | Lista cerrada de S-10; la verificación revisa el fixture campo a campo |

## Lotes previstos (techo por intento: 720 líneas, `git diff --shortstat --no-renames` + `wc -l` de lo nuevo sin trackear)

| Intento | Contenido | Estimación |
|---|---|---|
| I1 | Propuesta + spec delta | ≤ 600 |
| I2 | Diseño + tareas | ≤ 500 |
| I3 | L1 · shared: día de cierre puro + variante 47/51 + pruebas | ≤ 400 |
| I4 | L2 · servidor: población por cierre + sha256 + pruebas | ≤ 450 |
| I5 | L3 · fixture + aceptación + barrido de citas | ≤ 400 |
| I6 | Verify (el informe cuenta, ~350) | ≤ 450 |
| I7 | Archive: la mudanza va fuera del techo; lo revisable (fusión del delta + informe) ≤ 800, medido antes | — |

## Plan de vuelta atrás

Revertir los commits de la tanda en `main`: la población vuelve a creación y las variantes a «sin dato». No hay
migración de datos ni escritura en la base, así que revertir no deja nada que limpiar.

## Dependencias

Ninguna técnica. La encuesta (55) queda fuera y depende de 1H-01.

## Ronda de preguntas (modo `auto`)

El preflight es `auto` (`openspec/config.yaml:22-30`) y ninguna duda cumple los criterios de parada: no cambia el
alcance, no cuesta dinero, no toca producción y todas tienen supuesto razonable. S-1 a S-11 van a la lista semanal.

## Tareas de persona — fuera del recuento

Archivar NO las da por hechas.

| Tarea | Dueño | Dónde queda escrito |
|---|---|---|
| Corregir, si procede, S-1 a S-11 | Gerencia | Lista semanal de supuestos (regla E-237) |
| Probar en la aplicación los indicadores de septiembre por cierre | Gerencia / analista | Lista acumulada de pruebas en la app |
