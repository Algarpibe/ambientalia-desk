# F1B-09 — Repaso de la auditoría de blueprint sobre el código de hoy

| Dato | Valor |
|---|---|
| Tanda | `F1B-09`, cambio `cierre-f1b09-repaso-auditoria` (`cierra: si`) |
| Respaldo | `decision/f1b09-epica-1b-antes-del-corte` (Gerencia, 2026-11-12), por su clave: «cerrar la épica 1B» son sus filas de antes del corte; las de 2027 (F1B-16, F1B-17, F1B-20) tendrán su propia auditoría en su hito |
| Auditoría que se repasa | `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md`, del 2026-10-05, sobre el árbol `0d1a40b`. No se edita |
| Commit medido | `87510cbf`, `main` = `origin/main` el 2026-11-12 |
| Fecha | 2026-11-12 |
| Naturaleza | Lectura y documento. No se corrige nada: cada discrepancia va a la lista de §4 con un destino |

Las citas a `docs/sdd/ENTRADA.md`, `docs/sdd/R08.4_Expediente_de_cambios.md` y `docs/sdd/RECONCILIACION.md` van ancladas en
`87510cbf`: son de Supervisión o se regeneran en `main`. Las demás citas de código y pruebas describen `main` en `87510cbf`.

---

## 1 · Las cifras, medidas

Mismo método que el §0 de la auditoría: un guion de `tsx` que importa los tres catálogos, las dos transiciones sin botón y
`ESTADOS`, corrido sobre `main` y sobre `0d1a40b` exportado con `git archive`. No se versiona; las pruebas que se citan fijan
los mismos hechos.

| Medida | Servicio técnico | Equipo nuevo | Soporte remoto | Unión |
|---|---|---|---|---|
| Transiciones hoy | **40** | **7** | **5** | **52**; 54 con las dos que aplica el servidor |
| Transiciones el 05/10 (`0d1a40b`) | 31 | 6 | 4 | 41; 43 |
| Estados hoy | 23 | 6 | 5 | 26 |
| Estados el 05/10 | 20 | 5 | 4 | 23 |
| Sin salida | `Finalizado` y `Anulado`, los dos terminales | ídem | ídem | ídem |
| Inalcanzables desde el nacimiento | ninguno | ninguno | ninguno | — |
| No alcanzan un terminal | ninguno | ninguno | ninguno | — |
| Estados en algún ciclo | 14 (los 12 del ciclo grande y `Ticket creado` ⇄ `Remisión creada` por las dos sin botón) | 4 | 2 | — |
| Anulación | `anulacion` | `anulacion_equipo_nuevo` | `anulacion_soporte` | las tres de F1C-01 |
| Con algún campo obligatorio | 29 de 40 | 1 de 7: sólo la anulación | 1 de 5: sólo la anulación | — |
| Áreas | cuatro combinaciones | `Servicio Técnico` en las seis de trabajo y `Comercial` en la anulación | `Servicio Técnico` en las cuatro de trabajo y `Comercial` en la anulación | — |

**La hipótesis del analista se confirma: 41 (31 + 6 + 4) el 05/10 y 52 (40 + 7 + 5) hoy.** Lo fijan
`packages/shared/src/invariantesGrafo.test.ts:50` (40 sobre 23 estados), `packages/shared/src/invariantesGrafo.test.ts:172` (52
con ids únicos), `packages/shared/src/invariantesGrafo.test.ts:200` (las siete de equipo nuevo),
`packages/shared/src/invariantesGrafo.test.ts:240` (las cinco de soporte remoto) y
`packages/shared/src/invariantesGrafo.test.ts:177` (`Finalizado` y `Anulado`, únicos sin salida de la unión).

**De dónde salen las once nuevas.** Ninguna se retiró, y las once son de la épica 1C, no de la 1B:

| Transición | Flujo | Cambio | Primer commit |
|---|---|---|---|
| `anulacion`, `anulacion_equipo_nuevo`, `anulacion_soporte` | los tres | F1C-01, `anulado-con-motivo` | `bb350be6` |
| `facturar` | servicio | F1C-02, `facturar-dos-ramas` | `8167a804` |
| `envio_control_calidad`, `aprobacion_control_calidad`, `rechazo_control_calidad` | servicio | F1C-07, control de calidad | `5ffc930a` |
| `calibracion_directa`, `falla_calibracion` | servicio | F1C-08, `calibracion-directa` | `4f835bd0` |
| `cobro_diagnostico_espera`, `sin_pieza_en_almacen` | servicio | F1C-03, `salidas-esperas` | `df53227f` |

**Registro contra catálogos, en los dos sentidos.** Los 26 estados de `ESTADOS` (`packages/shared/src/estados.ts:112`) son
exactamente los derivados de los tres catálogos, sin sobrantes ni faltantes; lo fija `packages/shared/src/invariantesGrafo.test.ts:163-170`.
Ningún estado queda `sin_clasificar` (`packages/shared/src/estados.ts:103-105`), y en espera hay 12
(`packages/shared/src/estados.ts:120`), uno más que el 05/10: `Pendiente`.

---

## 2 · El contraste, apartado por apartado

«Coincide» = la auditoría y `main` dicen lo mismo. «Superado» = `main` ya no es como lo describió la auditoría, y su registro
lo dice. «**D-n**» = discrepancia, en la lista de §4 (supuesto S-1 de la propuesta).

### 2.1 · §0 y §1: los tres flujos

| Afirmación de la auditoría | Hoy | Evidencia | |
|---|---|---|---|
| El generador del mapa cubre sólo servicio (B-1) | Cubre los tres flujos desde `CATALOGO_POR_FLUJO` | `packages/shared/src/mapaBlueprint.test.ts:298`, `packages/shared/src/mapaBlueprint.test.ts:305`; E-222 cerrada (`docs/sdd/ENTRADA.md:2118` en `87510cbf`) | Superado |
| 31 + 6 + 4 transiciones, 20 + 5 + 4 estados | 40 + 7 + 5 y 23 + 6 + 5 | §1 | Cifra fechada; ver D-11 para el título que no se actualizó |
| Sin salida que no sea terminal: ninguno; sólo `Finalizado` | Ninguno; `Finalizado` y `Anulado` | `packages/shared/src/invariantesGrafo.test.ts:62` | Coincide, con `Anulado` |
| Ciclos con salida en los tres flujos | Igual: un ciclo grande de 12 estados en servicio, uno de 4 en equipo nuevo y `En Proceso` ⇄ `Pendiente` en soporte remoto | `packages/shared/src/reentrancia.test.ts:27`, `packages/shared/src/reentrancia.test.ts:191`, `packages/shared/src/reentrancia.test.ts:208` | Coincide |
| Anulación: no existe en ningún flujo | Existe en los tres | `packages/shared/src/transitions.ts:262`, `packages/shared/src/transitions.ts:362`, `packages/shared/src/transitions.ts:396` | Superado; su traza no lo dice: **D-1** |
| Campos obligatorios: ninguno en los dos flujos nuevos | Ninguno en las diez de trabajo; sólo la anulación pide su motivo | §1 | Coincide para las de trabajo |
| Áreas de los flujos nuevos, por supuesto | Decididas: `decision/e226-espera-y-areas-equipo-nuevo` y `decision/e090-areas-soporte-remoto` | `packages/shared/src/transitions.ts:347`, `packages/shared/src/transitions.ts:384` | Superado; sus trazas no lo dicen: **D-2** y **D-3** |
| Los dos flujos nuevos no imponen contenido (§1.2) | Sigue igual en las de trabajo; el servidor impone lo que el catálogo declara | `apps/desk/server/transitionExec.ts:76-77`; el supuesto, `packages/shared/src/transitions.ts:385` | Coincide |
| `liberacion` desde `En Proceso` se rechaza con `409` si el equipo exige verificación | Igual | `apps/desk/server/services/ticketService.ts:241-250`; la pertenencia al flujo, `apps/desk/server/services/ticketService.ts:125` y `apps/desk/server/services/ticketService.ts:231-234` | Coincide |
| §1.3 (1): equipo nuevo nace en `Ticket creado`; la guarda de remisión le alcanza, abierto en E-158 | Nace igual; E-158 cerrada el 13/10: el equipo nuevo llega con remisión | `packages/shared/src/flujos.ts:138-140`; `docs/sdd/ENTRADA.md:1783` en `87510cbf` | Superado |
| §1.3 (2): un `Pendiente` heredado de servicio no tiene transición, y de `Pendiente` «sólo sale `continuacion_soporte`»; lo resuelve la migración de F1F-01 | El heredado sigue sin transición, porque se enruta a servicio. De `Pendiente` sale además `anulacion_soporte` (`packages/shared/src/transitions.ts:396`). F1F-01 sigue en curso | `packages/shared/src/migracionTickets.ts:31-35`; `docs/sdd/RECONCILIACION.md:21` en `87510cbf` | Coincide, destino vivo |
| §1.3 (3): las áreas de soporte remoto son un supuesto; E-090 «nueva» | Decididas y construidas (`areas-soporte-remoto`, fusión `3ac80f32`) | `packages/shared/src/transitions.ts:384` | Superado; **D-3** |
| §1.4: tres decisiones del cliente, cada una con su línea del servidor | Las tres siguen impuestas en las mismas líneas | `apps/desk/src/components/TransitionPanel.tsx:56`; `apps/desk/server/services/ticketService.ts:125`, `apps/desk/server/services/ticketService.ts:126-128`, `apps/desk/server/services/ticketService.ts:129-131`, `apps/desk/server/services/ticketService.ts:91` | Coincide; los títulos de sus matrices, **D-11** |

### 2.2 · §2: los hallazgos de la R04 y de F1A-05

| # | La auditoría | Hoy | Evidencia | |
|---|---|---|---|---|
| R04-1 | La guarda que no bloquea: cerrada; ningún catálogo declara un checkbox obligatorio | Cerrada; pero **sí hay** checkbox obligatorio: tres en la aprobación del control de calidad, que la guarda impone | `apps/desk/server/transitionExec.ts:76-77`; `packages/shared/src/camposControlCalidad.ts:33` | Coincide la guarda; el comentario, **D-10** |
| R04-2 | Los cuatro estados sin salida siguen, con una salida cada uno; dueño F1C-03 | En el catálogo, tres de los cuatro tienen ya más de una salida; `En espera de SKU inventario` conserva una, por diseño. Dos de las nuevas, `cobro_diagnostico_espera` y `sin_pieza_en_almacen`, dan `409` con el interruptor `SALIDAS_ESPERAS` apagado, y entonces `Solicitado` vuelve a tener una sola | `packages/shared/src/estados.ts:151-160`; `packages/shared/src/invariantesGrafo.test.ts:439`; `apps/desk/server/services/ticketService.ts:313-320` | Superado (F1C-01 y F1C-03), con el interruptor; el comentario vecino, **D-12** |
| R04-3 | El ciclo reentrante sigue (11 campos); dueños F1C-02 y F1C-06 | F1C-02 quitó el ciclo de facturación; queda el grande, con 12 campos reentrantes, y los cuatro indicadores que afecta no tienen dueño. F1C-02 y F1C-06 están cerradas | `packages/shared/src/invariantesGrafo.test.ts:137`; `packages/shared/src/reentrancia.test.ts:166-171`; `packages/shared/src/reentrancia.ts:80-82` | **D-9** |
| R04-4 | La anulación: sin construir, en los tres flujos | Construida en los tres | §2.1 | Superado; **D-1** |
| A-1 | Bodegaje de proceso incalculable en la aprobación sin repuestos | Sigue: la rama sin repuestos escribe la variante «Final», opcional; la prueba lo documenta y nombra F1C-02, cerrada | `packages/shared/src/transitions.ts:199`, `packages/shared/src/transitions.ts:203`; `packages/shared/src/reentrancia.test.ts:126-128` | **D-8** |
| A-2 | `periodosDeBodegaje` y `diasDeBodegaje` sin llamador de producción | Igual; su destino en E-227 es F1C-06, cerrada | `packages/shared/src/bodegaje.ts:166`, `packages/shared/src/bodegaje.ts:208` | **D-5** |
| A-3 | «Habilitado para entrega» exige una fecha nueva | Igual | `packages/shared/src/transitions.ts:259-260` | Coincide |
| A-4 | El HTML es histórico y su desfase está en E-161 | Igual: E-161 sigue abierta | `docs/sdd/ENTRADA.md:1798` en `87510cbf` | Coincide |
| A-5 | `eslint` ignora `coverage/` | Igual | `eslint.config.js:16` | Coincide |

### 2.3 · §3: la épica 1B, tanda a tanda

El 05/10 seguían en curso F1B-03, F1B-04, F1B-05, F1B-07, F1B-08, F1B-09 y F1B-11, y F1B-13 estaba pendiente. Hoy todas las filas
de 1B de antes del corte están cerradas salvo F1B-09: F1B-01 por commit declarado y F1B-02 a F1B-08, F1B-10 a F1B-15, F1B-18 y
F1B-19 por archivo (`docs/sdd/RECONCILIACION.md:19-21` en `87510cbf`). Las de 2027 son F1B-16 y F1B-17, condicionadas
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:96-97`), y F1B-20, del §L
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:423`): por la decisión de respaldo, su auditoría va en su hito y no
en este repaso. La fila de F1B-05 que la auditoría veía «pendiente» dice hoy «cerrada por archivo»
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:85`); la de F1B-09 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:89`)
se pone al día en `main` al fusionar este cambio.

### 2.4 · §4: construido y no cableado

| Pieza | Hoy | Evidencia | |
|---|---|---|---|
| `transitionsForStatus` y `transitionById` | Sin llamador de producción; anotadas y vigiladas desde `cifras-caducas-y-lectores-de-servicio`; retirarlas lo decide Gerencia y no lo ha hecho | `packages/shared/src/transitions.ts:300-305` | **D-7** |
| `periodosDeBodegaje` y `diasDeBodegaje` | Sin llamador | §2.2, A-2 | **D-5** |
| `puedeCrearOVIGarantia` | Con dos llamadores: la ficha de garantía y la orden OVI (`packages/shared/src/mantenimientoNovedades.ts:10` sólo la nombra en un comentario) | `packages/shared/src/cargos.ts:71`; `packages/shared/src/garantiaProveedor.ts:91`, `packages/shared/src/ordenOVI.ts:55` | Superado, y E-227 ya lo dice |
| `puedeLiberarSinFactura` | Sin llamador, sin destino | `packages/shared/src/cargos.ts:63` | **D-6** |
| Rutas sin cliente: 14 de 120, todas bajo `/api/admin/` | Con la misma heurística, 20 de 122: 18 bajo `/api/admin/`, la carga de las respuestas de la encuesta (sólo administradores y sin pantalla por diseño, `apps/desk/server/routes/encuestaRespuestas.ts:9-10`) y el callback de n8n (`apps/desk/server/routes/remision.ts:355`) | — | Coincide en el fondo: ninguna es de la épica 1B |

### 2.5 · §5: precedencia de las guardas y los cuatro incumplimientos vivos

- **Las dos puertas del motor** siguen en A < B < C < D tal como están escritas: existencia
  (`apps/desk/server/services/ticketService.ts:122-125`), estado, permiso y las guardas de B
  (`apps/desk/server/services/ticketService.ts:125-131`), contenido (`apps/desk/server/services/ticketService.ts:132-147`) y la
  unicidad de la orden de venta al final (`apps/desk/server/services/ticketService.ts:148-151`). El alta acaba igual
  (`apps/desk/server/services/ticketService.ts:96-100`). Coincide.
- **Los cuatro incumplimientos vivos** siguen en las líneas que les da `CLAUDE.md`: `apps/desk/server/services/ticketService.ts:41`;
  `apps/desk/src/components/ClienteDetalle.tsx:41` y `apps/desk/src/components/TicketDetailView.tsx:245`;
  `packages/zoho-sync/src/db/repo.ts:44-54`, `packages/zoho-sync/src/db/repo.ts:71`, `packages/zoho-sync/src/db/repo.ts:78`,
  `packages/zoho-sync/src/db/repo.ts:305`, `packages/zoho-sync/src/db/schema.sql:187`, `packages/zoho-sync/src/config.ts:88` y
  `apps/desk/server/routes/remision.ts:240`; y `apps/desk/server/routes/remision.ts:127`, `apps/desk/server/routes/remision.ts:155`,
  `apps/desk/server/routes/remision.ts:158`, `apps/desk/server/routes/remision.ts:177`, `apps/desk/server/routes/remision.ts:197`,
  `apps/desk/server/routes/remision.ts:220`, `apps/desk/server/routes/remision.ts:232`, con la prueba de posición en
  `apps/desk/server/remisiones.test.ts:988`. Los dos detalles caducos que la auditoría encontró en sus fichas (B-8) los corrigió
  E-229, cerrada. Coincide, con una precisión: la auditoría da IV-12 «en sus tres puntos»
  (`docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md:227`) y hoy son cuatro. El cuarto, la guarda de cargo para asociar una
  orden OVI, en la misma `apps/desk/server/routes/remision.ts:220`, lo registró `ovi-garantia-por-cargo` (F1B-03) el 06/10 en
  `CLAUDE.md`, que ya lo dice. Es superado con su registro al día, no discrepancia.

### 2.6 · §6: los lectores comunes ante los tres flujos

| Lector | La auditoría | Hoy | Evidencia | |
|---|---|---|---|---|
| Motor, panel, aviso de área, traspaso y alarmas de SLA | Distinguen el flujo | Igual | `apps/desk/server/services/ticketService.ts:122`; `apps/desk/src/components/TransitionPanel.tsx:56`; `apps/desk/server/services/avisoArea.ts:15-16`; `apps/desk/server/db/traspaso.ts:33`; `apps/desk/server/db/sla.ts:48-49` | Coincide |
| Vistas del tablero | No lo necesitan | Igual | `apps/desk/src/lib/boardView.ts:39`, `apps/desk/src/lib/boardView.ts:47-48` | Coincide |
| Indicadores (B-3) | No distinguen el flujo | Hay filtro por flujo, en la descarga y en la comparación; sin el parámetro no se filtra | `apps/desk/server/indicadores.ts:98-114` | Superado a medias; su traza no lo dice: **D-4** |
| Columnas del tablero (B-4) | `Verificación` y `Solicitud Soporte` caen en «Otros» | Tienen columna propia | `packages/shared/src/columns.ts:15`, `packages/shared/src/columns.ts:20`; E-225 cerrada | Superado |
| Mapa generado (B-1) | Sólo servicio | Los tres flujos | §2.1 | Superado |
| Clase de espera (B-5) | Tres estados `sin_clasificar` | Ninguno: `Pendiente` es espera externa, `Verificación` y `Solicitud Soporte` no | `packages/shared/src/estados.ts:103-105` | Superado; **D-2** |

### 2.7 · §7: cifras y registros

| Medida | 05/10 | Hoy | Evidencia |
|---|---|---|---|
| Transiciones | 41 (43) | 52 (54) | §1 |
| Estados | 23 | 26 | §1 |
| Aristas del mapa generado | 35, sólo servicio | 49 en servicio, 11 en equipo nuevo y 6 en soporte remoto | `packages/shared/src/mapaBlueprint.test.ts:46`, `packages/shared/src/mapaBlueprint.test.ts:305` |
| Estados en espera | 11 | 12 | `packages/shared/src/estados.ts:120` |
| Campos de fecha reentrantes | 11 | 12, diez obligatorios | `packages/shared/src/invariantesGrafo.test.ts:137`, `packages/shared/src/reentrancia.test.ts:92` |
| Cifras ancladas del maestro | 31, 20 y 35, con guardián | 40, 23 y 49, con el mismo guardián | `packages/shared/src/cifrasAncladas.test.ts:24` |

Las cifras y afirmaciones caducas de §7.3 las cerraron E-228 (`cifras-caducas-y-lectores-de-servicio`) y E-229 (trabajo
documental directo), las dos cerradas. Queda la del maestro: **D-14**.

### 2.8 · §9: los nueve hallazgos y su entrada

| Hallazgo | Entrada | Estado de la entrada | Hoy |
|---|---|---|---|
| B-1 | E-222 | cerrada | Coincide |
| B-2 | E-223 | «abierta hasta construirse», destino F1C-01 | Construido: **D-1** |
| B-3 | E-224 | «abierta hasta construirse», destino F1F-05 | Construido a medias: **D-4** |
| B-4 | E-225 | cerrada | Coincide |
| B-5 | E-226 | «abierta hasta construirse», destino F1B-09 | Construido: **D-2** |
| B-6 | E-227 | abierta, reducida | Lo que queda: **D-5**, **D-6** y **D-7** |
| B-7 | E-228 | cerrada | Coincide |
| B-8 | E-229 | cerrada | Coincide |
| B-9 | E-230 | cerrada; texto de M11.6 en el expediente §14 | El texto ya no es cierto: **D-14** |

---

## 3 · Lo que la auditoría declaró no haber hecho

`docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md:323-339`, punto a punto.

| # | Lo que no hizo | En este repaso |
|---|---|---|
| 1 | Ejecutarse contra la aplicación desplegada | Tampoco: el encargo no toca producción |
| 2 | Auditar `main` | **Hecho**: todo se mide sobre `87510cbf` |
| 3 | Revisar el cliente `.tsx` con pruebas | Sigue fuera por decisión de Gerencia (F0-00; `vitest.config.ts:16`, `vitest.config.ts:17-20`). Se repasan las mismas tres decisiones de §1.4, no los 49 ficheros |
| 4 | Buscar «cliente sin ruta» | Tampoco; «ruta sin cliente» se remide en §2.4. Sigue sin dueño: **D-16** |
| 5 | Ejecutar B-3 | El filtro por flujo ya existe; el efecto en la tabla sin filtro sigue sin ejecutarse y es de E-224 (**D-4**) |
| 6 | Contrastar cada tanda de 1B con su `archive-report.md` | No se rehace: cada fila de 1B de antes del corte está cerrada por archivo con su línea R-1, que es lo que sostiene su `cierra` (supuesto S-6) |
| 7 | Buscar si cada hallazgo duplicaba una entrada | No se rehace; ninguna de las nueve entradas se cerró por duplicada |
| 8 | Regenerar o ampliar el mapa, y corregir las cifras de §7.3 | **Hecho por otros**: el mapa, `mapa-blueprint-tres-flujos` (`60b171fb`); las cifras, `cifras-caducas-y-lectores-de-servicio` (`1029c903`) |
| 9 | Revisar el flujo de la remisión (n8n, callback, anulación) | Tampoco. El flujo es común a la remisión de entrada, a la de salida y a la sin ticket, así que lo recorrerán las auditorías de hito de F1B-16 y F1B-17: **D-15** y **D-17** |

---

## 4 · Las discrepancias, con su destino

Diecinueve. **Diecisiete van a «bandeja»**, la lista para Supervisión de §5, que las registra en `docs/sdd/ENTRADA.md`. **Dos
caen en el alcance de una fila de 2027**: D-15 en F1B-16 y D-17 en F1B-17, porque las dos filas cambian el flujo común de la
remisión que la auditoría no revisó (supuesto S-2, corregido en el verify). Ninguna cae en F1B-20. Ninguna queda sin destino.
Este cambio no corrige ninguna.

D-11, D-18 y D-19 son de la clase de B-7 (cifras y afirmaciones caducas en comentarios y títulos) y no salen de un barrido
exhaustivo: son las que encontraron los dos lectores del repaso, el que lo escribió y el verificador.

| # | Discrepancia | Dónde, hoy | Destino |
|---|---|---|---|
| D-1 | E-223 dice «abierta hasta que se construya», con destino F1C-01 «después del corte». La anulación está construida en los tres flujos (F1C-01, `anulado-con-motivo`, fusión `9c57c5c6`), y F1C-01 está cerrada por archivo | `docs/sdd/ENTRADA.md:2126` en `87510cbf`; `packages/shared/src/transitions.ts:262`, `packages/shared/src/transitions.ts:362`, `packages/shared/src/transitions.ts:396` | bandeja |
| D-2 | E-226 dice «abierta hasta construirse», con destino F1B-09. Está construida por `espera-y-areas-equipo-nuevo` (fusión `8d132564`); `Solicitud Soporte` sigue como supuesto, como dijo la respuesta | `docs/sdd/ENTRADA.md:2141` en `87510cbf`; `packages/shared/src/estados.ts:103-105`; `packages/shared/src/transitions.ts:347` | bandeja |
| D-3 | E-090 dice «Estado: nueva» y, en su ruteo del 27/10, que `areas-soporte-remoto` está «sin fusionar en `main`». Se fusionó ese mismo día (`3ac80f32`) | `docs/sdd/ENTRADA.md:1258-1259` en `87510cbf`; `packages/shared/src/transitions.ts:384` | bandeja |
| D-4 | E-224 dice «abierta hasta que se construya». La consecuencia 3, el filtro por flujo, está construida (`filtro-indicadores-por-flujo`, F1F-05, archivado el 22/10); queda la población «como Zoho», por confirmar. El destino, F1F-05, sigue vivo | `docs/sdd/ENTRADA.md:2131` en `87510cbf`; `apps/desk/server/indicadores.ts:98-114` | bandeja |
| D-5 | E-227 da a `periodosDeBodegaje` y `diasDeBodegaje` destino F1C-06, que está cerrada por archivo; las dos siguen sin llamador. Es también A-2 de F1A-05. Un destino que nombra una fila cerrada no es un destino | `docs/sdd/ENTRADA.md:2146` en `87510cbf`; `packages/shared/src/bodegaje.ts:166`, `packages/shared/src/bodegaje.ts:208` | bandeja |
| D-6 | `puedeLiberarSinFactura` sigue sin llamador y E-227 la deja «SIN DESTINO ASIGNADO» | `docs/sdd/ENTRADA.md:2146` en `87510cbf`; `packages/shared/src/cargos.ts:63` | bandeja |
| D-7 | `transitionsForStatus` y `transitionById` siguen sin llamador, anotadas y vigiladas; E-227 deja a Gerencia decidir si se retiran, y no hay respuesta | `docs/sdd/ENTRADA.md:2146` en `87510cbf`; `packages/shared/src/transitions.ts:300-305` | bandeja |
| D-8 | A-1 de F1A-05 sigue: la aprobación sin repuestos escribe la fecha «Final» y deja vacía la de la columna 58. La prueba que lo documenta lo asigna a F1C-02, que está cerrada | `packages/shared/src/transitions.ts:203`; `packages/shared/src/reentrancia.test.ts:126-128` | bandeja |
| D-9 | El hallazgo 3 de la R04, el ciclo reentrante, sigue con 12 campos de fecha reentrantes, y los cuatro indicadores que afecta (columnas 50, 53, 57 y 58) no tienen dueño. La auditoría lo daba a F1C-02 y F1C-06, las dos cerradas | `packages/shared/src/reentrancia.ts:80-82`; `packages/shared/src/reentrancia.test.ts:166-171`; `packages/shared/src/invariantesGrafo.test.ts:137` | bandeja |
| D-10 | El comentario de la guarda de obligatorios dice que hoy no hay ningún checkbox obligatorio; hay tres, en la aprobación del control de calidad (F1C-07). La guarda sí los impone | `apps/desk/server/transitionExec.ts:73`; `packages/shared/src/camposControlCalidad.ts:33` | bandeja |
| D-11 | Títulos de prueba con cifras caducas, que ninguna aserción lee: la unión «(23)» tiene 26 estados; en equipo nuevo, «`Finalizado` es el único sin salida» y hoy también lo es `Anulado`; la matriz de equipo nuevo dice «6×3», «las cinco» y «pasa por las cinco» y recorre siete (21 casos, como dice bien `apps/desk/server/permisos.test.ts:243`); la de soporte remoto dice «4×3» y «las cuatro» y recorre cinco (15 casos, `apps/desk/server/permisos.test.ts:328`) | `packages/shared/src/invariantesGrafo.test.ts:163`, `packages/shared/src/invariantesGrafo.test.ts:302`; `apps/desk/server/permisos.test.ts:219`, `apps/desk/server/permisos.test.ts:221`, `apps/desk/server/permisos.test.ts:250`; `apps/desk/server/permisos.test.ts:304`, `apps/desk/server/permisos.test.ts:306` | bandeja |
| D-12 | El comentario de los estados de salida única pone `Ingresado` de ejemplo; desde F1C-08 tiene dos salidas (`calibracion_directa`). Las cifras del mismo comentario, nueve y cinco, aciertan y están vigiladas | `packages/shared/src/estados.ts:142-145` | bandeja |
| D-13 | Cuatro líneas de «Fuera de alcance» vecinas de las que corrige este cambio remiten a destinos ya cumplidos: la guarda de remisión a F1B-03, cerrada; la anulación y el área de soporte remoto, construidas; soporte remoto a `blueprint-soporte-remoto`, archivado; la guarda de `habilitar_servicio` a F1B-03 (hoy `apps/desk/server/services/ticketService.ts:273`). Una la dejó a propósito `areas-soporte-remoto`, por ser foto de lo que su tanda dejó fuera | `openspec/specs/transitions-soporte-remoto/spec.md:321`, `openspec/specs/transitions-soporte-remoto/spec.md:326`; `openspec/specs/transitions-equipo-nuevo/spec.md:551`, `openspec/specs/transitions-equipo-nuevo/spec.md:552` | bandeja |
| D-14 | M11.6 dice que la extensión a los tres flujos es F1B-09 «sin empezar», y el texto entregado para la R08.5 dice «en curso; el cierre se hace al cerrar la épica 1B». Con este cierre, ninguno de los dos es cierto | `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3521`; `docs/sdd/R08.4_Expediente_de_cambios.md:318` en `87510cbf` | bandeja |
| D-15 | El flujo de la remisión sigue sin auditar más allá de las líneas de IV-12. Su envío a n8n rechaza con `422` la remisión sin ticket, que es justo lo que F1B-16 tiene que cambiar; su auditoría de hito lo recorre | `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md:339`; `apps/desk/server/routes/remision.ts:273`, `apps/desk/server/routes/remision.ts:302` | F1B-16 |
| D-16 | «Cliente sin ruta» sigue sin buscarse de forma mecánica, y no tiene dueño | `docs/sdd/F1B-09_Auditoria_blueprint_audit-F1B.md:330-331` | bandeja |
| D-17 | La otra mitad del mismo flujo: anular, restaurar y el callback de n8n no distinguen el tipo de remisión, y el recuento que mueve el estado del ticket tampoco filtra por tipo. Sólo actúa con el ticket en `Ticket creado` o `Remisión creada`, pero la remisión de salida de F1B-17 pasará por esas mismas rutas; su auditoría de hito las recorre | `apps/desk/server/routes/remision.ts:329`, `apps/desk/server/routes/remision.ts:341`, `apps/desk/server/routes/remision.ts:355`; `apps/desk/server/db/estadoPorRemision.ts:41`, `apps/desk/server/db/estadoPorRemision.ts:43-46` | F1B-17 |
| D-18 | Comentarios del código con cifras de un catálogo de servicio de 31 o 33 transiciones, que hoy tiene 40: «las otras 28» (las que no proponen derivado; hoy 35, porque cinco sí lo proponen, `packages/shared/src/transitions.ts:274-282`), «33 declaraciones», «las 33 entradas … la 32.ª» y «las 33 copias»; «las 31 transiciones» en tres ficheros. Y el comentario de las columnas del tablero dice que son los estados de servicio técnico, cuando dos son de los flujos nuevos | `packages/shared/src/transitions.ts:269`, `packages/shared/src/transitions.ts:272`, `packages/shared/src/transitions.ts:289-290`, `packages/shared/src/transitions.ts:293`; `apps/desk/server/services/valoresDeTransicion.ts:10`, `packages/shared/src/bodegaje.ts:28`, `packages/shared/src/sla.ts:14`; `packages/shared/src/columns.ts:4` | bandeja |
| D-19 | Comentarios de pruebas con cifras o afirmaciones caducas: la matriz de servicio dice «93 casos, 55 prohibidos y 38 permitidos» y hoy son 120, 73 y 47 (`apps/desk/server/permisos.test.ts:77`); la de equipo nuevo, «seis … 12 prohibidos, 6 permitidos … las seis son Servicio Técnico», y hoy son siete, con la anulación de Comercial; la de soporte remoto, «4 permitidos, 8 prohibidos», y hoy son 5 y 10; un comentario dice que `transitionsForStatus` y `transitionById` son lo que ejecuta el servidor, cuando `packages/shared/src/transitions.ts:300` dice que no tienen llamador de producción; y «las 31 transiciones» en otra prueba | `apps/desk/server/permisos.test.ts:26-27`, `apps/desk/server/permisos.test.ts:338`, `apps/desk/server/permisos.test.ts:211-213`, `apps/desk/server/permisos.test.ts:301`; `packages/shared/src/invariantesGrafo.test.ts:16-18`; `packages/shared/src/sla.test.ts:22` | bandeja |

---

## 5 · Para Supervisión — no se editan en la rama

- **La bandeja.** Las diecisiete de §4 con destino «bandeja». En particular, las trazas de E-223 (D-1), E-226 (D-2) y E-090
  (D-3) dicen algo que ya no es cierto, y la de E-224 (D-4) se queda a medias. De E-227 queda sin destino lo de D-5, D-6 y D-7.
- **Las filas de 2027.** D-15 queda como entrada de la auditoría de hito de F1B-16, y D-17 de la de F1B-17
  (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:96-97`), que es donde la decisión de respaldo pone esa auditoría.
- **Las tres decisiones** que mantenían el `cierra: no` reciben su nota fechada 12/11, sin reescribirlas:
  `decision/orden-tres-tandas-04-10` (2), `decision/e222-mapa-equipo-nuevo-soporte-remoto` (5) y
  `decision/f1b04-recuento-no-retiene` (5).
- **T-P4 de `mapa-blueprint-tres-flujos`** queda hecha por este cambio en sus dos líneas; las otras cuatro son D-13.
- **El maestro.** Texto para el expediente, para la R08.5, sustituyendo el de su §14 en lo que dice de F1B-09:

  > M11.6 dice que la extensión de la auditoría a los tres flujos «es la tanda F1B-09, sin empezar». Debe decir: «es la tanda
  > F1B-09, cerrada por archivo el <fecha del archivo>: la auditoría del 05/10/2026 sobre los tres flujos, cuatro cambios que
  > atendieron sus hallazgos (el mapa generado de los tres flujos, las cifras caducas, la clase de espera y las áreas de equipo
  > nuevo, y las áreas de soporte remoto) y el repaso de cierre del 12/11/2026 sobre el código de `main`, con 52 transiciones
  > —40 de servicio técnico, 7 de equipo nuevo y 5 de soporte remoto—. La épica 1B se da por cerrada, para este repaso, en sus
  > filas de antes del corte; las de 2027 (F1B-16, F1B-17 y F1B-20) tendrán su propia auditoría en su hito». Y donde habla del
  > mapa del blueprint, añadir: «el mapa generado cubre los tres flujos desde mapa-blueprint-tres-flujos (E-222)».

  La fecha del archivo se escribe al fusionar. Pegarlo en el `.docx` es de Gerencia.
