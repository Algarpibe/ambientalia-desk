---
tanda: F1C-03
motivo: ""
capacidad: [transitions-st, permissions, derivacion-avisos]
maestro: ["M1.3.4", "M1.9.2", "Anexo D nº 31"]
cierra: si
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta — `salidas-esperas`

## 1. Qué fila atiende

F1C-03 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:101`): «C3 salidas de las esperas, ejecutadas por la
persona a cargo», talla S–M, después del corte. La regla del ejecutor va dentro de esta fila y F1C-05 no se reabre
(`…R01.4.md:163`). Respaldo: `decision/c3-salida-esperas` (`openspec/config.yaml:1828-1847`),
`decision/salida-emergencia-quien-la-ejecuta` (`openspec/config.yaml:3426-3440`) y la medición
`medicion/p90-esperas-2026-10-21` (`openspec/config.yaml:5276-5328`). Maestro R08.4: M1.3.4 (`R08.4.md:1297-1342`),
M1.9.2 «La persona a cargo» (`R08.4.md:2028`), «Ausencias» (`:2036`) y «Restricción de quién ejecuta» (`:2037`).

`cierra: si` — las cuatro esperas quedan con su salida decidida, la caducidad con plazo medido y la regla del ejecutor
construida; cierra el punto abierto nº 31 (`R08.4.md:1342`). `toca_maestro: si` — los plazos medidos y la forma concreta
de la regla del ejecutor (D4, D13) se entregan como corrección en `docs/sdd/F0-01_Correcciones_para_el_maestro.md`.

## 2. Intención

Un ticket aparcado en una de las cuatro esperas no tiene adónde ir si el proveedor cancela o el laboratorio devuelve el
sensor irreparable (`R08.4.md:1319`), y distorsiona al alza el KPI que debería delatarlo (`:1320`). Gerencia decidió que
las cuatro no se tratan igual (`openspec/config.yaml:1833-1837`):

| Espera | Clase | Salida decidida | Hoy en el catálogo |
|---|---|---|---|
| `En Espera de Repuestos` | externa | cobrar diagnóstico → `Por Facturar`, o anular → `Anulado` (decide Comercial) | sólo `anulacion` (`packages/shared/src/transitions.ts:262`) |
| `Servicio externo` | externa | las mismas dos | sólo `anulacion` (`transitions.ts:262`) |
| `Solicitado` | interna | no se abandona; sin pieza → `En Espera de Repuestos` | sólo `entrega_repuestos` (`transitions.ts:204`) |
| `En espera de SKU inventario` | interna | no se abandona ni se anula; si se retrasa, aviso a Comercial | sólo `notif_cliente_sku` (`transitions.ts:212`) |

Faltan dos salidas, la caducidad y la regla de quién ejecuta: hoy no existe ninguna regla «persona a cargo», aunque
`tickets.derivado_a` existe (`packages/zoho-sync/src/db/schema.sql:123`) y `executeTransition` lo lee antes de escribir (`apps/desk/server/services/ticketService.ts:154`).

## 3. Alcance — lo que entra

| # | Pieza | Dónde |
|---|---|---|
| D1 | `cobro_diagnostico_espera` «Cobro de diagnóstico»: from [`En Espera de Repuestos`, `Servicio externo`] → `Por Facturar`, Comercial, Decisional, `[comment()]` y, desde `decision/f1c03-quien-ejecuta-salidas` (`f00c9c68`), «Motivo del cobro de diagnóstico», texto obligatorio | en la línea física de `anulacion` (`transitions.ts:262`), como hizo F1C-01, sin desplazar citas |
| D2 | `sin_pieza_en_almacen` «Sin pieza en almacén»: from [`Solicitado`] → `En Espera de Repuestos`, Servicio Técnico, Compras / Logístico, `[comment()]` | misma línea |
| D3 | Interruptor propio `SALIDAS_ESPERAS`, nace cerrado (`=== 'true'`). Apagado: D1 y D2 dan `409` y el panel no las ofrece (molde `motivoQuitadaPorInterruptor`/`visibleConControlCalidad`, `packages/shared/src/controlCalidad.ts:103-111`); la alarma no corre; `anulacion` desde ER/SE sigue como hoy | `packages/zoho-sync/src/config.ts`, campo en la línea de `:66` y lectura junto a `:124-125`; `DEPLOY.md` §17 tras §16 (`DEPLOY.md:776`); `.env.example` |
| D4 | Regla pura del ejecutor de las salidas de las esperas externas (`cobro_diagnostico_espera` y `anulacion` con origen ER o SE), consumida por el servidor y espejada en el cliente. **Corregida por `decision/f1c03-quien-ejecuta-salidas` (2026-10-21, `f00c9c68`):** encendido, sólo el Director o el Coordinador Comercial por `cargo_permiso`, y el administrador; cualquier otro, `403`. `sin_pieza_en_almacen` sin regla de ejecutor. *Antes:* (a) la persona a cargo (`tickets.derivado_a`) sin motivo; (b) el Director o Coordinador del área con «Motivo del respaldo»; (c) `403` | módulo nuevo en `packages/shared` |
| D5 | Guardas del servidor: `409` del interruptor en escalón B, en la línea de `ticketService.ts:128`; `403` del ejecutor tras el `403` de área (`:129-130`) y, para esos orígenes, SUSTITUYE a Decisionales por cargo (`:131`) como excepción explícita, molde `IDS_FIRMA_CC` (`decisionales.ts:46`); `422` del motivo vacío en el agregado de `:134` | funciones auxiliares al final de `ticketService.ts` |
| D6 | Traza: `performed_by_id` y el motivo del cobro (antes, el del respaldo) en `values` de `ticket_transitions` | `applyTransition` ya los recibe (`ticketService.ts:155`) |
| D7 | Registro de plazos propio (hipótesis de nombre: `plazosEsperas.ts`): ER 79, SE 31, SKU 20, `Solicitado` 13 días naturales, con la clave y la fecha de la medición; sus claves son EXACTAMENTE `ESTADOS_SIN_SALIDA` (`packages/shared/src/estados.ts:151-160`); NUNCA derivado de `SLA_HORAS_POR_ESTADO` (`packages/shared/src/sla.ts:32-35`). Función pura de vencimiento | `packages/shared` |
| D8 | Alarma de caducidad (molde `apps/desk/server/services/avisoFacturacionVencida.ts`, F1C-02) en la pasada de `apps/desk/server/index.ts:88`. Externas: SUGIERE la salida a Comercial. Internas: ESCALA al área responsable. Un aviso por vencimiento (ticket, estado, entrada). Sólo crea avisos y su marca: nunca ejecuta una transición | `apps/desk/server/services/` |
| D9 | Invariantes de c3 fijadas por prueba: `Solicitado` y SKU sin salida a `Anulado` ni a `Por Facturar` | junto a `invariantesGrafo.test.ts` |
| D10 | Corrección EN SITIO del comentario de `estados.ts:151-160`, que describe `Solicitado` como «alta del SKU en el otro sistema» (`:154`) y la espera de SKU como inventario ajeno (`:158`), al revés de c3 (`R08.4.md:1331-1336`). Mismo número de líneas | `estados.ts` |
| D11 | Ampliación de RQ-TS-56 (§7) | `invariantesGrafo.test.ts:380-391` |
| D12 | Vigilantes y cifras (§6); mapa del blueprint regenerado | `shared`, `docs/artefactos/`, `openspec/config.yaml` → `cifras_ancladas` |
| D13 | Corrección del maestro: plazos medidos y regla del ejecutor | `docs/sdd/F0-01_Correcciones_para_el_maestro.md` |

**Pregunta de diseño (no de Gerencia): la entrada al estado.** La medición es 100 % de tickets venidos de Zoho
(`de_la_app: 0` en las cuatro, `openspec/config.yaml:5288`, `:5297`, `:5306`, `:5315`), y `apps/desk/server/db/sla.ts:88`
sólo lee `ticket_transitions`. Hay que fusionar con `ticket_history`, como hace `apps/desk/server/db/relojSla.ts:77-81`.
El anti-duplicado reutiliza `public.alarmas_avisadas` (PK `ticket_id, estado, entrada_at`, `schema.sql:582-589`) o una
columna nueva. Preferencia: sin migración. Lo decide el diseño.

**Destinatarios (S-6).** Externas: el `derivado_a` si es de Comercial, más Director y Coordinador Comercial por
`cargo_permiso` (`apps/desk/server/db/avisos.ts:121`); respaldo, el área Comercial (`avisos.ts:74`). `Solicitado`:
Director y Coordinador de Servicio Técnico. SKU: Director y Coordinador Comercial, texto «crear el SKU».

## 4. Lo que queda fuera

| Pieza | Por qué | Dónde cae |
|---|---|---|
| Nivel general «propietario del registro» para el resto de transiciones | Sigue aplazado (`R08.4.md:2037`; `openspec/config.yaml:3432`) | fila de permisos |
| Disponibilidad por usuario (vacaciones, ausencias) | «Llega con M6» (`R08.4.md:2036`) | M6 |
| Importe o cobro del diagnóstico | La salida sólo lleva a `Por Facturar`; facturar es de F1C-02 | no se construye aquí |
| Botón genérico de retroceso | S-9 | — |
| Restricción por persona de la pareja Solicitud / Entrega de repuestos | Se restringe cuando exista el nivel general (`R08.4.md:2037`) | fila de permisos |

## 5. Grafo antes y después

```
ANTES (y DESPUÉS con SALIDAS_ESPERAS apagado; D1 y D2 dan 409)
  En Espera de Repuestos ──llegada_repuestos──► En Proceso          ──anulacion──► Anulado
  Servicio externo ──retorno_servicio_externo──► En Proceso         ──anulacion──► Anulado
  Solicitado ──entrega_repuestos──► En Proceso
  En espera de SKU inventario ──notif_cliente_sku──► Notificación cliente

DESPUÉS, encendido (ejecutan el Director o el Coordinador Comercial, o el administrador; antes, la persona a cargo o el respaldo con motivo)
  En Espera de Repuestos / Servicio externo ──cobro_diagnostico_espera (Decisional)──► Por Facturar
  En Espera de Repuestos / Servicio externo ──anulacion (regla del ejecutor)──► Anulado
  Solicitado ──sin_pieza_en_almacen──► En Espera de Repuestos
  En espera de SKU inventario: sin salida nueva; la caducidad avisa a Comercial
```

Ningún estado nuevo. La caducidad no aparece en el grafo: no es una arista.

## 6. Cifras y vigilantes que se mueven (en la rama)

| Vigilante | Hoy | Después |
|---|---|---|
| Transiciones (`openspec/config.yaml:1367-1370`) | 38 | 40 |
| Pasos del mapa (`openspec/config.yaml:1360-1362`) | 46 | 49 (D1 sale de dos estados) |
| Estados de servicio (`openspec/config.yaml:1371-1373`) | 23 | 23 |
| Tipos de evento, matrices de permisos, salidas únicas, derivación por defecto | — | hipótesis: los mismos ficheros que movió F1C-08; la lista exacta con sus cifras la fija el diseño contra el árbol |

## 7. RQ-TS-56 se amplía — y no contradice F1C-07

Hoy, encendido, sólo los tres rechazos Decisionales entran en `Por Facturar` sin pasar por `Control de calidad`
(`invariantesGrafo.test.ts:384-387`). `cobro_diagnostico_espera` entra también: el recorrido desde `En Proceso` alcanza
`Servicio externo` por `cal_sensores_proceso` (`transitions.ts:224`) y `En Espera de Repuestos` por `solicitud_repuestos`
(`:200`) más D2, sin cruzar `Control de calidad`. Es otra salida Decisional sin reparación, como los rechazos.
`decision/f1c07-firma-control-calidad` y `decision/f1c07-supuestos-corregidos` (`openspec/config.yaml:5099-5136`)
regulan quién firma y qué es «intervino», no qué entra en `Por Facturar`: no hay contradicción. Lo que sí roza es
`decision/c6-qa-liberacion` («No se entrega el equipo sin … checklist firmado», `openspec/config.yaml:1892`), y lo roza
igual que los tres rechazos ya aceptados por F1C-08. Supuesto S-11.

## 8. Orden de guardas (F1B-10)

A existencia < B estado y permiso < C contenido < D unicidad. El `409` de `SALIDAS_ESPERAS` va en escalón B, en la
línea de `ticketService.ts:128`, junto al de Control de calidad. El `403` del ejecutor va en B tras el `403` de área y
el de cargo, en el lugar de Decisionales por cargo. El `422` del motivo del cobro (antes, del respaldo) entra en el agregado de `:134`. Cada
guarda nueva lleva prueba de POSICIÓN frente a su vecina (regla de mutación 1).

## 9. Regla 13

| Decisión del cliente | Imposición del servidor |
|---|---|
| No ofrecer D1 y D2 con el interruptor apagado | `409` de D5 |
| No ofrecer el cobro ni la anulación desde ER/SE a quien no es administrador, Director ni Coordinador Comercial (antes, persona a cargo o respaldo) | `403` de D5 |
| Pedir «Motivo del cobro de diagnóstico» (antes, «Motivo del respaldo» al respaldo) | `422` de D5 |

El cliente consume la misma regla pura de D4. Corregida por `decision/f1c03-quien-ejecuta-salidas`; la tabla con línea, en el diseño (D5) y en el `archive-report.md` (§5).

## 10. Supuestos reversibles

- **S-1** Persona a cargo = `tickets.derivado_a`, usuario activo y con el área de la transición. **RETIRADO por `decision/f1c03-quien-ejecuta-salidas` (2026-10-21).**
- **S-2** **RETIRADO por `decision/f1c03-quien-ejecuta-salidas` (2026-10-21).** `derivado_a` nulo, inactivo o de otra área = «no disponible»: sólo ejecuta el respaldo con motivo. Muchos
  tickets de Zoho llegan sin derivado. En `Solicitado` el derivado es el encargado de inventario (`R08.4.md:2027`, cuya
  figura sigue `[ABIERTO]`): si no es de Servicio Técnico, la salida la ejecuta el respaldo.
- **S-3** El administrador cuenta como respaldo y aporta motivo (molde de F1C-07, `openspec/config.yaml:5125`). **RETIRADO por `decision/f1c03-quien-ejecuta-salidas` (2026-10-21)**: el administrador ejecuta sin motivo propio.
- **S-4** Días naturales; vence cuando lo transcurrido es ≥ plazo, nunca antes.
- **S-5** Plazos provisionales (`openspec/config.yaml:5323-5326`): se recalculan con una medición nueva con clave propia.
- **S-6** Destinatarios de §3.
- **S-7** Al encender, un aviso por cada ticket ya vencido, sin corte.
- **S-8** Tipos de evento: D1 Decisional, D2 Compras / Logístico (como `solicitud_repuestos`, `transitions.ts:200`).
- **S-9** La «vía de escape manual con traza» del 27/08 (`R08.4.md:1341`) se cumple con estas salidas y su traza; no
  hay botón genérico.
- **S-10** Con `SALIDAS_ESPERAS` encendido, la regla del ejecutor rige aunque `DECISIONALES_POR_CARGO` esté apagado.
- **S-11** `cobro_diagnostico_espera` entra a `Por Facturar` sin `Control de calidad` (§7).

S-1 y S-2 tocan permisos: suben al apartado 06 del panel (E-237; respondidas, y retiradas, por `decision/f1c03-quien-ejecuta-salidas`); no frenan la construcción, porque el interruptor nace
cerrado. El resto, a la lista semanal agrupada por tanda.

## 11. Riesgos

| # | Riesgo | Mitigación |
|---|---|---|
| R-1 | Vigilantes de cifras: hipótesis (dato del encargo, sin cita): F1C-02 rompió 46 pruebas al mover el catálogo | Lote 1 corre la suite entera antes de cerrar; el diseño enumera los vigilantes |
| R-2 | La alarma no ve la entrada de los tickets de Zoho (`db/sla.ts:88`) | Fusión con `ticket_history` (§3, diseño) |
| R-3 | Barrido de citas de `transitions.ts`, `estados.ts`, `ticketService.ts`, `config.ts` | Inserción en líneas existentes; regla de mutación 4 al cierre |
| R-4 | Encendido, `anulacion` desde ER/SE se endurece para quien hoy la ejecuta: 2 + 1 estancias abiertas el 21/10 (`openspec/config.yaml:5293`, `:5302`) | Interruptor cerrado; `DEPLOY.md` §17 lo dice |
| R-5 | S-2 deja sin persona a cargo a la mayoría de tickets de Zoho | **Sin objeto desde `decision/f1c03-quien-ejecuta-salidas`**: el ejecutor ya no depende del derivado |
| R-6 | Muestras pequeñas (12 a 40) para los plazos | S-5 |

## 12. Mutaciones obligatorias

1. La caducidad ejecuta una salida sola.
2. Aviso antes del plazo.
3. Dos avisos por el mismo vencimiento.
4. Una espera interna que sugiere salida en vez de escalar.
5. `Solicitado` o SKU con salida a `Anulado` o a `Por Facturar` (ensuciando el catálogo, regla de mutación 2).
6. Plazo derivado de `SLA_HORAS_POR_ESTADO`.
7. Posición de cada guarda nueva frente a su vecina (regla de mutación 1).
8. Regla de mutación 4 sobre cada fichero muy citado que se toque.

## 13. Partición por intentos (techo 800, válvula 720)

| Intento | Contenido | Estimado |
|---|---|---|
| I1 | propuesta + specs delta | ~500 |
| I2 | diseño + tareas | ~350 |
| I3 | lote 1, `shared`: catálogo, plazos, regla pura, interruptor, vigilantes, cifras, mapa | ~650 |
| I4 | lote 2: guardas del servidor y sus pruebas de posición, espejo del cliente, `DEPLOY.md` §17 | ~500 |
| I5 | lote 3: alarma de caducidad, entrada al estado, anti-duplicado | ~450 |
| I6 | verify | ~150 |
| I7 | archive | techo 2 × carpeta + 800 (regla del archivo) |

## 14. Plan de vuelta atrás

Primera línea: dejar `SALIDAS_ESPERAS` sin `true`; D1 y D2 dan `409`, la alarma no corre y `anulacion` vuelve a la regla
de hoy. Segunda: revertir los commits de la rama; sin migración (preferencia de §3), no hay datos que deshacer.

## 15. Criterios de éxito

- [ ] Apagado: la suite de hoy pasa sin cambio de comportamiento; D1 y D2 dan `409`.
- [ ] Encendido: la persona a cargo ejecuta sin motivo; el respaldo, sólo con motivo; cualquier otro, `403`. **Superado por `decision/f1c03-quien-ejecuta-salidas`:** el Director o el Coordinador Comercial y el administrador ejecutan; cualquier otro, `403`.
- [ ] Un ticket vencido recibe un solo aviso, y ninguna transición se ejecuta sola.
- [ ] `Solicitado` y SKU no tienen salida a `Anulado` ni a `Por Facturar`.
- [ ] Cada mutación de §12 pone la suite en rojo.
- [ ] `npm test`, `npm run typecheck` y `npm run lint` en verde; barrido de citas sin roturas nuevas.

## 16. Ronda de preguntas

No se hizo: el preflight fija `execution_mode: auto` (`openspec/config.yaml:25-30`; «Regla de ejecución», `CLAUDE.md`).
Las dudas con supuesto razonable van como S-1…S-11; ninguna cambia el alcance de la fila, cuesta dinero ni toca datos de
producción. Las que tocan permisos (S-1, S-2) suben al panel sin frenar la tanda.

## 17. Capacidades

- **Modificadas:** `transitions-st` (D1, D2, interruptor, invariantes de c3, RQ-TS-56, cifras, orden de guardas);
  `permissions` (regla del ejecutor y su excepción a Decisionales por cargo, visibilidad en el cliente);
  `derivacion-avisos` (alarma de caducidad, destinatarios, anti-duplicado).
- **Nuevas:** ninguna (R-2 no aplica).
