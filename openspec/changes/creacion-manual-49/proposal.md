---
tanda: F1F-05
motivo: ""
capacidad: [kpis]
maestro: ["Anexo G"]
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta: la creación del 49 en el fixture de septiembre es el campo manual

## Intención

Gerencia decidió el 24/10 qué es «creación» en el 49: `decision/f1f05-creacion-del-49-campo-manual`
(`openspec/config.yaml:5321-5344`). Respuesta literal (`openspec/config.yaml:5330`):

> ««Creación» en el 49 es el campo «Fecha creación ticket», el que se rellena a mano, no la fecha de creación del ticket
> en Zoho. […] La aplicación está bien; el error estaba en mi referencia, que regenero con ese campo y vuelvo a pasar. No
> hay cambio en packages/shared. Que el campo esté vacío o retrasado en algunos tickets es un defecto del dato de Zoho que
> se arrastra igual a la comparación; queda anotado como revisión futura de la definición del 49, fuera del alcance de
> F1F-05. […]»

Este cambio cumple la consecuencia (3) (`openspec/config.yaml:5335-5337`): el fixture
`apps/desk/server/testing/septiembre2026.ts` usa una sola fecha, `creado`, para la creación del ticket y para el campo
manual (`apps/desk/server/testing/septiembre2026.ts:60`, `t.creado` en `created_time` y en `fecha_creacion_ticket`), y sus
49 de 940, 941 y 972 son de la definición descartada. La aplicación ya lee el campo manual: columna
`fecha_creacion_ticket` (`packages/zoho-sync/src/db/rows.ts:103`), hito del 49 (`packages/shared/src/indicadores.ts:54`,
fórmula en `:190-193`) y su mapa a columna (`apps/desk/server/indicadores.ts:13`). Comprobación del maestro: Anexo G
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:2957`; lista en `:2954`).

`cierra: no`: F1F-05 sigue abierta por la encuesta (55) y la medición en paralelo.

## Alcance

### Dentro

1. **Fixture** (`apps/desk/server/testing/septiembre2026.ts`), editado en su sitio: `fechaCreacionTicket: string | null`
   separado de `creado` en el tipo (`:11`), en cada ticket (`:22-49`) y en `CLAVES_DEL_FIXTURE` (`:19`); sembrado en
   `fecha_creacion_ticket` (`:60`); las siete celdas medidas desde la referencia regenerada; comentarios `:3-8` y `:52-53`
   reescritos con el mismo número de líneas.
2. **Pruebas**: `apps/desk/server/routes/indicadoresSeptiembre.test.ts:43` y
   `apps/desk/server/routes/indicadoresComparacionSeptiembre.test.ts:23`, el 49 de 9 a 8.
3. **Spec viva** `kpis`: RQ-KP-38 y RQ-KP-42 MODIFIED, 49 → 8, citando la decisión.

### Fuera

- Código de producción y todo `packages/`: la decisión dice que la aplicación está bien.
- `creado` y `created_time`: siguen siendo la creación del ticket; la referencia no la trae y no cambia.
- La revisión futura de la definición del 49 por campo vacío o retrasado (consecuencia (4), fuera de F1F-05).
- La referencia de Gerencia y los JSON de `docs/sdd`: no se copian ni se commitean (llevan clientes).
- Los informes archivados que citan el fixture viejo (caso B; ver «Barrido de citas»).

## Las siete celdas (medidas por el orquestador contra la referencia regenerada del 24/10)

| Ticket (id) | `fechaCreacionTicket`: hoy (= `creado`) → referencia | 49 de Gerencia: hoy → referencia |
|---|---|---|
| 940 (`sep-03`) | 2026-05-07 → 2026-05-20 | 15 → 6 |
| 941 (`sep-04`) | 2026-05-07 → 2026-05-21 | 15 → 5 |
| 957 (`sep-05`) | 2026-06-11 → `null` | `null` (sin cambio) |
| 972 (`sep-09`) | 2026-08-03 → `null` | 2 → `null` |

En los otros nueve, `fechaCreacionTicket` = `creado`. Todo lo demás (estado, clasificación, ocho hitos, «Días de entrega»,
columnas 47 a 59) coincide en los trece. Comprobación aritmética, lunes a viernes hasta la revisión del 28/05: del 20/05
salen 6 y del 21/05 salen 5; del 07/05 salían 15.

## Capacidades

- Nuevas: ninguna.
- Modificadas: `kpis`. **El bloque de cada MODIFIED conserva su número de líneas y todos sus escenarios** (S-2):
  - **RQ-KP-38** (`openspec/specs/kpis/spec.md:1607-1632`): en `:1612`, «49 → 9» pasa a «49 → 8», con la cita de
    `decision/f1f05-creacion-del-49-campo-manual` en la misma línea. Cuatro escenarios, sin cambio.
  - **RQ-KP-42** (`openspec/specs/kpis/spec.md:1774-1808`): en `:1781`, «49 (9)» pasa a «49 (8)» con la misma cita; y en
    el segundo escenario (`:1793`), «9 en el 49» pasa a «8 en el 49» (S-1). Cinco escenarios.

## Pruebas afectadas y plan de rojo primero (strict_tdd)

- Las celdas del 49 con valor pasan de 9 a 8: 932, 939, 940, 941, 970, 971, 973 y 980.
- **Rojo:** con las siete celdas nuevas, las dos cifras a 8 y la siembra todavía en `t.creado`, falla la aceptación: en
  RQ-KP-38 el 49 da discrepancias en 940 (Desk 15, Gerencia 6) y 941 (15 frente a 5); en RQ-KP-42 el 49 coincide 6 de 8 y
  `ticketsVariante` (`apps/desk/server/routes/indicadoresComparacionSeptiembre.test.ts:66`) baja de 13/13.
- **Verde:** sembrar `t.fechaCreacionTicket` en `fecha_creacion_ticket`.
- **Mutación**: volver a sembrar `t.creado` en `fecha_creacion_ticket` tiene que tumbar el 49 de 940
  y 941. El 972 no la caza (Gerencia `null`, no se compara), y se dice para que nadie lo cuente.
- La prueba de claves (`apps/desk/server/routes/indicadoresSeptiembre.test.ts:55-63`) exige la clave nueva en
  `CLAVES_DEL_FIXTURE`; la del 998 (`:36-39`) mira `creado` y no cambia (S-5). La mutación por celda alterada
  (`apps/desk/server/routes/indicadoresComparacionSeptiembre.test.ts:80-87`) usa el 932 en el 49, que no cambia.

## Supuestos (reversibles; a la lista semanal de Gerencia, regla E-237)

- **S-1** · El escenario «Septiembre da 100 % por indicador con la variante» (`openspec/specs/kpis/spec.md:1793`) pasa también a 8: es
  el mismo requisito, y dejarlo en 9 lo haría contradecir su propio texto.
- **S-2** · Los MODIFIED conservan su número de líneas; la cita de la decisión va en la misma línea, aunque se alargue.
- **S-3** · `fechaCreacionTicket: string | null` justo después de `creado` en el tipo, en cada ticket y en
  `CLAVES_DEL_FIXTURE`; `null` en 957 y 972. Va a `fecha_creacion_ticket`; `created_time` sigue saliendo de `creado`.
  Es una fecha: cabe en la lista cerrada de S-10 y no es dato personal.
- **S-4** · El fixture se edita sin insertar ni borrar líneas.
- **S-5** · La prueba del único creado en septiembre (`apps/desk/server/routes/indicadoresSeptiembre.test.ts:36`) mira `creado` y no cambia.

## Barrido de citas (regla de mutación 4)

Ninguna línea del fixture, de las dos pruebas ni de `kpis/spec.md` se desplaza (S-2, S-4), así que siguen cayendo donde
caían `openspec/specs/kpis/spec.md:1776` (cita `:55-63`) y las archivadas:
`openspec/changes/archive/2026-10-24-comparacion-juzga-variante/proposal.md:97`,
`openspec/changes/archive/2026-10-24-comparacion-juzga-variante/specs/kpis/spec.md:199`,
`openspec/changes/archive/2026-10-24-comparacion-juzga-variante/design.md:111`,
`openspec/changes/archive/2026-10-24-comparacion-juzga-variante/verify-report.md:61` y
`openspec/changes/archive/2026-10-23-poblacion-cierre-variante-47-51/verify-report.md:75`. Las archivadas que describen el
fixture viejo (la siembra de `t.creado` en `:60`, los 49 de 940, 941 y 972) son **caso B**: ciertas de su fecha, no se
tocan. Al cerrar, el barrido se repite con el `grep` de la regla y se comprueba cada resultado contra el fichero.

## Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Desfasar citas al editar el fixture o la spec | Media | Edición en sitio a igual número de líneas; barrido al cerrar |
| Transcribir mal una celda (la referencia no está en el worktree) | Baja | La tabla de arriba es la fuente; los 49 nuevos cuadran con la aritmética de lunes a viernes |
| Que alguien lea esto como cambio de la definición del 49 | Baja | Fuera de alcance, escrito; sin cambio en `packages/` |

## Vuelta atrás

Revertir los commits de la tanda: el fixture vuelve a una sola fecha y las cifras a 9. Sin datos, migración ni escritura.

## Criterios de éxito

- [ ] RQ-KP-38 y RQ-KP-42 dicen 8 en el 49, citan la decisión y conservan su número de líneas.
- [ ] El fixture separa `fechaCreacionTicket` de `creado`, con las siete celdas de la tabla; rojo antes de la siembra.
- [ ] Sembrar `t.creado` en `fecha_creacion_ticket` pone rojo el 49 de 940 y 941.
- [ ] Sin cambio en `packages/`; `npm test`, `npm run typecheck` y `npm run lint` en verde; barrido de citas limpio.

## Ronda de preguntas (modo `auto`)

El preflight es `auto` (`openspec/config.yaml:22-30`) y ninguna duda cumple los criterios de parada: no cambia el alcance,
no cuesta dinero, no toca producción y todas tienen supuesto razonable. S-1 a S-5 van a la lista semanal.
