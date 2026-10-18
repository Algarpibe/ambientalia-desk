---
tanda: F1C-04
motivo: ""
capacidad: [transitions-st, trazas]
maestro: ["M1.8", "M1.3", "M7.3", "Anexo D nº 35"]
cierra: si
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta — `tipo-evento-transicion`

## 1. Qué fila atiende

F1C-04 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:102`): «C5 tipo de evento en cada transición», talla S–M,
después del corte. Respaldo: `decision/c5-tipo-evento` (`openspec/config.yaml:1866-1882`). De ella depende la parte de
Decisionales de F1C-05 (`…R01.4.md:269`).

- `cierra: si`: la fila es poner un tipo a cada transición, y se pone a todas (45 de los tres catálogos más los 2 pasos del
  servidor). Lo que la fila NO incluye —el análisis de M7.3 y la restricción de permisos de F1C-05— son filas propias.
- `toca_maestro: si`: el maestro dice «[CONSTRUIDO] Hoy las transiciones de la aplicación tienen área y campos, pero no
  tipo de evento» (M1.8, `R08.4.md:1932`), y lo mismo en M1.3 (`R08.4.md:1656`). Al terminar, las dos frases son falsas.
- La consecuencia 1 de la decisión habla de «las 34 transiciones» (`openspec/config.yaml:1874`): cifra de su fecha. Hoy
  son 33 de servicio, 7 de equipo nuevo y 5 de soporte remoto (`packages/shared/src/flujos.ts:19-22`).

## 2. La letra que manda

`decision/c5-tipo-evento`, `respuesta_textual` (`openspec/config.yaml:1871-1872`): «No bloquea la aplicación del tipo de
evento. […] F1C-04 puede aplicar el tipo de evento a todas las transiciones ya, sin esperar a esto. La desambiguación se
aplica en F1E, cuando el informe entre en el flujo.»

- **M1.3** (`R08.4.md:1655-1667`): los cuatro tipos y qué actos agrupa cada uno (`:1658-1661`); «Cada transición tiene
  un solo tipo» (`:1663`); «La tabla de transiciones con su tipo la valida Gerencia antes de aplicarse» (`:1664`); «Como
  el tipo es una propiedad de la transición, los movimientos registrados antes de aplicarlo quedan clasificados igual»
  (`:1665`); Decisionales sólo para Director o Coordinador del área (`:1666`), que es F1C-05.
- **M1.8** (`R08.4.md:1897-1932`): fusión del 17/02 en Operativo (`:1898`); tabla de los cuatro tipos (`:1899-1909`);
  «Claude Code propone la tabla […] y Gerencia la valida antes de aplicarla» (`:1911`); el conflicto de «Escalado a
  Revisión» (`:1913`); taxonomía de partida (`:1915-1930`).
- **M7.3** (`R08.4.md:3026`): tiempos por tipo de evento, «el historial anterior queda clasificado igual».
- **Anexo D nº 35** (`R08.4.md:5761-5764`): resuelto; «Gerencia valida la tabla antes de aplicarla en F1C-04».

**«Creación de informe» NO se desambigua aquí.** Ninguna transición es un acto de informe (`R08.4.md:1663`, `:1932`); los
tres actos (Elaboración, Emisión, Validación) se aplican en F1E (`openspec/config.yaml:1872`, `:1876`).

## 3. Medición, sobre `f64ea71`

**Fuentes.** **L** = lista de actos por tipo (`R08.4.md:1658-1661`, `:1903-1908`) y su taxonomía de partida (`:1917-1930`).
**H** = `docs/analisis-tickets/DF-servicio-tecnico-160226.xlsx`, columna `TIPO_EVENTO`, leída con la fusión del 17/02.
**N** = página de Notion «Flujo equipo-nuevo» (03/02/2026). **S** = supuesto. Las hojas de equipo nuevo y soporte remoto
traen la columna vacía. **Precedencia (S-3):** L gana cuando nombra el acto sin ambigüedad; H decide cuando L no lo nombra
o nombra dos actos de tipos distintos.

**Servicio** (`TRANSICIONES_BASE`, `packages/shared/src/transitions.ts:171-263`; la línea es la de cada entrada):

| # | id (línea) | Tipo | Fuente | # | id (línea) | Tipo | Fuente |
|---|---|---|---|---|---|---|---|
| 1 | `habilitar_servicio` (:178) | Operativo | H | 18 | `cal_sensores_proceso` (:224) | Operativo | H (L nombra dos) |
| 2 | `ingreso_a_servicio` (:190) | Operativo | H + L | 19 | `cal_sensores_revision` (:226) | Operativo | H (L nombra dos) |
| 3 | `escalado_a_revision` (:192) | Decisional | **L sobre H** | 20 | `retorno_servicio_externo` (:228) | Compras / Logístico | **L sobre H** |
| 4 | `devolucion_a_correccion` (:194) | Decisional | H | 21 | `rechazo_comercial` (:234) | Decisional | H + L |
| 5 | `llegada_repuestos` (:196) | Compras / Logístico | H + L | 22 | `rechazo_cliente` (:236) | Decisional | H + L |
| 6 | `aprobacion_y_repuestos` (:198) | Compras / Logístico | H (L nombra dos) | 23 | `rechazo_revision` (:238) | Decisional | H + L |
| 7 | `solicitud_repuestos` (:200) | Compras / Logístico | **L sobre H** | 24 | `facturado` (:240) | Administrativo | **L sobre H** |
| 8 | `aprobacion` (:202) | Decisional | **L sobre H** | 25 | `facturado_cierre` (:242) | Administrativo | **L sobre H** |
| 9 | `entrega_repuestos` (:204) | Compras / Logístico | H + L | 26 | `diagnostico_complementario` (:244) | Operativo | H + L |
| 10 | `notif_por_garantia` (:208) | Operativo | H | 27 | `liberacion_sin_factura` (:246) | Decisional | **L sobre H** |
| 11 | `notif_cliente_comercial` (:210) | Operativo | H | 28 | `entrega_sin_factura` (:248) | Operativo | H |
| 12 | `notif_cliente_sku` (:212) | Compras / Logístico | H + L | 29 | `entrega_al_cliente` (:250) | Operativo | H |
| 13 | `rechazo_garantia` (:214) | Decisional | **L sobre H** | 30 | `habilitado_para_entrega` (:259) | Operativo | H (L nombra el estado) |
| 14 | `solicitud_sku` (:216) | Compras / Logístico | **L sobre H** | 31 | `notif_recotizacion` (:261) | Operativo | H |
| 15 | `reporte_por_garantia` (:218) | Operativo | H | 32 | `anulacion` (:262) | Decisional | **S-1** |
| 16 | `escalado_a_comercial` (:220) | Operativo | H | 33 | `facturar` (:262) | Administrativo | L |
| 17 | `finalizacion_servicio` (:222) | Operativo | H (L nombra un estado) | | | | |

Servicio: Operativo 14 · Decisional 9 · Compras / Logístico 7 · Administrativo 3 = 33. **Nueve conflictos L sobre H**
(filas 3, 7, 8, 13, 14, 20, 24, 25 y 27); el de la fila 3 es el que el propio maestro nombra (`R08.4.md:1913`).

**Equipo nuevo** (`transitions.ts:350-363`): `ingreso_equipo_nuevo` (:351), `analisis_y_acciones` (:355) y
`verificacion` (:357) → Operativo (N); `producto_no_conforme` (:353) y `liberacion` (:359) → Decisional (N);
`rechazo_verificacion` (:361) → Decisional (L «rechazo» + N); `anulacion_equipo_nuevo` (:362) → Decisional (S-1).
**Soporte remoto** (`transitions.ts:388-397`): `asignacion_soporte` (:389), `ejecutar_soporte` (:391),
`soporte_pendiente` (:393) y `continuacion_soporte` (:395) → Operativo (S-2); `anulacion_soporte` (:396) → Decisional (S-1).
**Pasos del servidor** (`transitions.ts:150-151`): `remision_confirmada` y `remision_retirada` → Compras / Logístico
(L «remisiones», `R08.4.md:1660`).

**Total, 47:** Operativo 21 · Decisional 14 · Compras / Logístico 9 · Administrativo 3.

**Ids de traza fuera de todo catálogo → sin tipo (`null`, S-4):** la fila de creación (`packages/zoho-sync/src/db/repo.ts:428-436`),
los marcadores de migración (`packages/shared/src/migracionTickets.ts:14`; `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:46-48`)
y los ids retirados por F1C-09 (`transitions.ts:206-207`, `:230-233`), que la tabla de trazas, de sólo inserción, conserva.

**Dónde se consumirá.** En M7.3 (no existe en código: `apps/desk/server/indicadores.ts:76-84` lee `transition_id`,
`values` y `performed_at`, sin agregado por tipo) y en la parte de Decisionales de F1C-05 (`…R01.4.md:269`). Ninguno se
construye aquí.

**Vigilantes del catálogo: ninguna cifra cambia.** Cifras ancladas 33/22/41 (`packages/shared/src/cifrasAncladas.test.ts:24`),
45 = 33 + 7 + 5 (`invariantesGrafo.test.ts:173-174`), barridos de permisos y cargos y las 41 aristas del mapa
(`mapaBlueprint.test.ts:52`, `:184`). El generador del mapa imprime sólo `name`, `area`, `from` y `to`
(`packages/shared/src/mapaBlueprint.ts:93-115`): `docs/artefactos/blueprint-*.md` no cambia. `comentariosVigilados.test.ts`
lee `transitions.ts` como texto; sus anclas deben seguir en su sitio. Se rompen 6 literales `Transition` de pruebas
(`packages/shared/src/mapaBlueprint.test.ts:200`, `:294`; `packages/shared/src/sla.test.ts:8-11`;
`apps/desk/server/services/avisoArea.test.ts:47-49`; `apps/desk/server/transitionExec.test.ts:294`, `:303`); la lista
definitiva la da `tsc`. La carpeta de este cambio cuenta en «en curso», que el árbol de la rama ya fija en nueve con F1C-04
(`apps/desk/server/reconciliacion/registro.test.ts:218-220`); el archivo lo devuelve a ocho, con F1C-04 en «cerradas por archivo».

## 4. Qué se construye

1. **`packages/shared/src/tipoEvento.ts` (nuevo).** `TIPOS_EVENTO`, tupla cerrada `as const` con exactamente `'Operativo'`,
   `'Decisional'`, `'Compras / Logístico'` y `'Administrativo'`; el tipo `TipoEvento`; y
   `tipoEventoDeTransicion(transitionId: string | null | undefined): TipoEvento | null`, que resuelve en los tres catálogos
   (`CATALOGO_POR_FLUJO`, `flujos.ts:19-22`, por `transicionPorId`, `:74-80`) y en los dos pasos del servidor, y devuelve
   `null` para cualquier otro id. **Sin ciclo en tiempo de ejecución:** `flujos.ts` importa `transitions.ts` (`flujos.ts:7`);
   `tipoEvento.ts` importa los dos; `transitions.ts` sólo necesita el TIPO, con importación de tipo que se borra al compilar.
   El resolutor vive, pues, en `tipoEvento.ts`.
2. **`interface Transition` gana `tipoEvento: TipoEvento` OBLIGATORIO**: una transición sin tipo, o con uno fuera de la
   lista, no compila. Va en la MISMA línea física que `area` (`transitions.ts:60`). La importación va en la línea de
   importaciones en línea (`:74`), **delante** de su comentario final `//` —detrás quedaría comentada—; alternativa
   equivalente, el tipo en línea `import('./tipoEvento').TipoEvento`, molde de `:52`. Lo fija el diseño. Cada entrada de los
   tres catálogos recibe `tipoEvento` en su propia línea; `TRANSITIONS` lo hereda por el `...t` (`:295-298`). Los dos pasos
   del servidor también, comprobados contra la lista **sin conversión forzada** (p. ej. `satisfies`). **`transitions.ts` no
   gana ni pierde ninguna línea** (regla de mutación 4).
3. **Pruebas.** (a) Tabla fijada: cada id → su tipo, exactamente la de §3 (caza «un tipo cambiado por otra categoría»).
   (b) Barrido en ejecución: toda transición de todo catálogo y los dos pasos tienen un `tipoEvento` que está en
   `TIPOS_EVENTO` (caza conversiones forzadas y valores fuera de la lista). (c) El resolutor: `null` fuera de catálogo.
4. **No se guarda en la traza** (sin columna, sin migración): se deriva al leer, desde `transition_id`. El encargo decía
   «registrado en la traza si M7.3 lo necesita ahí», y la respuesta es NO: el maestro dice dos veces que el tipo es
   propiedad de la transición y que el historial anterior queda clasificado igual (`R08.4.md:1665`, `:3026`). Guardarlo
   por fila dejaría sin tipo todas las filas anteriores, y una corrección validada por Gerencia dejaría dos tipos para el
   mismo acto. La traza ya guarda el id (`packages/zoho-sync/src/db/schema.sql:57-61`), que es todo lo que M7.3 necesita.
5. **Servidor: el historial lo expone.** `getHistorialTicket` (`apps/desk/server/db/historial.ts:131-160`) ya selecciona
   `transition_id` (`:137`) y no lo usa; `eventoTransicion` (`:49-61`) añade `tipoEvento`, derivado del catálogo por
   `transition_id`, **nunca de `values` ni del cuerpo**: `b.values` llega casi entero al jsonb de la traza
   (`apps/desk/server/services/ticketService.ts:155`), así que un `values.tipoEvento` enviado por el navegador quedaría
   guardado. `HistoryEvent` (`packages/shared/src/types.ts:611`) gana `tipoEvento?: TipoEvento | null`, opcional y en la
   misma línea: los literales existentes siguen compilando. **Sin cambio de interfaz**: no se toca ningún `.tsx`, y en la
   aplicación no se ve nada.

## 5. Fuera de alcance

- El análisis de tiempos por tipo de M7.3 (`R08.4.md:3026`).
- Decisionales sólo para Director o Coordinador (`R08.4.md:1666`): F1C-05.
- El informe en tres actos (`R08.4.md:1663`, `:1910`): F1E.
- Toda interfaz: ni la pantalla de transiciones ni el historial pintan el tipo.
- Guardar el tipo en la traza (§4.4) y cambiar el generador del mapa del blueprint.

## 6. Regla 13 — decisiones del cliente (regla de mutación 3)

| Decisión del cliente | Línea del servidor que la impone |
|---|---|
| *Ninguna.* El cliente no decide ni enseña el tipo. `TransitionPanel.tsx` recibe las transiciones con el tipo `Transition` (`apps/desk/src/components/TransitionPanel.tsx:2`) y no lee el campo nuevo; `HistoriaPanel.tsx` sólo importa `HistoryEvent` (`apps/desk/src/components/HistoriaPanel.tsx:2`) | No aplica: el único que deriva el tipo es el servidor (§4.5) |

## 7. Mutaciones previstas

| # | Mutación | Debe ponerse rojo |
|---|---|---|
| M1 | Quitar `tipoEvento` de una transición | `npm run typecheck`, y `npx tsc -p packages/shared/tsconfig.json --noEmit` (que `npm run typecheck` no cubre). Línea base medida en `f64ea71`: 2 errores previos ajenos (`fasesBlueprint.test.ts:33`, `reasignacion.test.ts:60`); la condición es «los mismos dos, ninguno nuevo» |
| M2 | Un tipo fuera de la lista | Compilación; y con conversión forzada, el barrido en ejecución (§4.3 b) |
| M3 | Cambiar el tipo de una transición por otra categoría | La tabla fijada (§4.3 a) |
| M4 | El lector toma `values.tipoEvento` o el cuerpo antes que el catálogo | Prueba del historial con una traza que trae un `tipoEvento` falso en `values` |
| M5 | «La traza sin el tipo»: no aplica tal cual, porque no se guarda. Se sustituye por: el lector devuelve `null` para un id de catálogo, o deja de derivar | Prueba del historial |

Y en el cierre, barrido de la regla de mutación 4 sobre `transitions.ts`, aunque no se mueva ninguna línea.

## 8. Intentos (techo 800, válvula 720)

Medidos con `git diff --shortstat --no-renames` contra el commit de partida más `wc -l` de lo nuevo sin trackear.

| Intento | Contenido | Estimación (×1,8) |
|---|---|---|
| 1 | propuesta, delta de specs (`transitions-st`, `trazas`) y `registro.test.ts` a nueve (ya en el árbol de la rama) | ~600 |
| 2 | diseño y tareas | ~400 |
| 3 | lote 1, `packages/shared`: tipo cerrado, campo en las 45 + 2, resolutor, pruebas, mutaciones, 6 literales | ~650 |
| 4 | lote 2, servidor: el historial expone el tipo derivado; prueba del cuerpo | ~250 |
| 5 | verify | ~270 |
| 6 | archive (regla del archivo: fusión + informe ≤ 800) | mudanza |

## 9. Supuestos reversibles (para la lista semanal)

| # | Supuesto | Qué se decidió | Alternativa | Cómo se revierte |
|---|---|---|---|---|
| S-1 | Las tres «Anulación» | Decisional (C2 es posterior a las hojas; L no la nombra). Con F1C-05, anular quedaría en Director o Coordinador Comercial | Administrativo | Su valor en las tres entradas y en la tabla fijada |
| S-2 | Las cuatro de trabajo de soporte remoto | Operativo (sin fuente) | Otro tipo por transición | Ídem |
| S-3 | Precedencia | L sobre H cuando L nombra el acto; H si no lo nombra o nombra dos (9 conflictos, 5 lecturas) | H siempre | Las 9 filas afectadas |
| S-4 | Ids fuera de catálogo | Sin tipo (`null`); la hoja daba «Enviar» como Operativo manual | Un tipo fijo para la creación | El resolutor |
| S-5 | Equipo nuevo | Se toma de Notion del 03/02 (área «sugerida», no verificada) | Validación directa de Gerencia | Las 7 entradas |
| S-6 | Dónde vive el tipo | Se deriva al leer: corregir un tipo reclasifica el historial (`R08.4.md:1665`) | Columna en la traza | Columna y migración aditivas |
| S-7 | Exposición | Dato del evento del historial, sin pintarlo | Pintarlo en `HistoriaPanel.tsx` | Un cambio de interfaz |
| S-8 | «Antes de aplicarse» (`R08.4.md:1664`) | Se lee como «antes de que algo la consuma»: se construye inerte | Esperar la validación para construir | Ninguno: nada la consume hasta M7.3 y F1C-05 |

## 10. Tareas de persona (no se cuentan como tareas; regla del ciclo 1)

| Tarea | Dueño | Destino | Dónde queda escrita |
|---|---|---|---|
| Validar la tabla de §3 (`R08.4.md:1664`, `:1911`, `:5764`). La tanda la deja construida e inerte; la validación tiene que existir antes de que F1C-05 restrinja permisos con ella | Gerencia | Antes de la parte de Decisionales de F1C-05 | Esta propuesta y el parte del corte |
| Actualizar M1.3 (`R08.4.md:1656`) y M1.8 (`R08.4.md:1932`): se entrega como texto para Supervisión, no se aplica al `.docx` | Supervisión → Gerencia | Expediente de la revisión siguiente del maestro | `archive-report.md` de este cambio |

Archivar no las da por hechas.

## 11. Riesgos

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Gerencia corrige tipos de la tabla después de construida | Media | Un valor por línea y la tabla fijada: corregir es cambiar dos sitios; el historial se reclasifica solo (S-6) |
| S-8 se lee como contradicción con `R08.4.md:1664` | Baja | Nada consume el tipo; se publica en la lista semanal con plazo |
| S-1 entrega «anular» a Director o Coordinador cuando F1C-05 aplique Decisionales | Media | Se anota en la tarea de validación; F1C-05 no lo restringe sin ella |
| Grafía: el maestro escribe «Compras / Logístico» (`R08.4.md:1660`, `:1906`) y «Compras/Logístico» (`:3026`, `:5764`) | Baja | Se fija la de M1.3 y M1.8; la tupla cerrada impide la otra |
| `npm run typecheck` no ve los literales de `packages/shared` | Media | M1 corre también `tsc -p packages/shared/tsconfig.json` con la línea base de 2 errores |
| Un campo nuevo desplaza citas de `transitions.ts` | Baja | Mismas líneas físicas; `comentariosVigilados.test.ts` y barrido de la regla de mutación 4 en el cierre |

## Plan de vuelta atrás

Revertir el commit de fusión: no hay migración ni datos escritos; el campo es aditivo y nadie lo consume.

## Criterios de éxito

- Las 47 transiciones llevan su tipo de la tabla de §3, y una sin tipo o con tipo ajeno no compila.
- El historial expone `tipoEvento` derivado del catálogo, `null` fuera de catálogo, inmune a `values`.
- M1–M5 rojas al mutar; `transitions.ts` con el mismo número de líneas; cifras ancladas sin cambio.
