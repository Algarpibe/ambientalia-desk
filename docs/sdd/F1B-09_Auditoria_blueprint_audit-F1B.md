# F1B-09 — Auditoría de blueprint de la épica 1B (`audit-F1B`)

| Dato | Valor |
|---|---|
| Tanda | `F1B-09`, fila `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:166` y `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:89` |
| Fuente | `M11.6` del maestro (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3521`) |
| Commit auditado | `0d1a40b`, rama `audit-f1b`, apilada sobre `traspaso-y-trazas`. **El árbol incluye F1F-01 (`migracion-tickets-abiertos`) y F1B-05 (`traspaso-y-trazas`), que NO están fusionadas a `main`:** la base común con `main` es `894efd7` y la rama lleva 14 commits por delante (`git log --oneline main..HEAD`). Lo que aquí se afirma de esas dos tandas no es cierto de `main` hasta que se fusionen |
| Fecha | 2026-10-05 |
| Cierre | `cierra: no`, por respuesta textual de Gerencia (`openspec/config.yaml:3792-3800`): la épica 1B sigue abierta y la auditoría se repasa al cerrarla |
| Naturaleza | Lectura y documento. No se corrige código, pruebas ni specs: cada hallazgo va a `docs/sdd/ENTRADA.md` con dueño (E-222 a E-230) |

---

## 0 · Alcance

**Qué pide el maestro.** `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3521`
pide repetir en cada hito la lectura del código del flujo que detectó «los cuatro estados sin salida, el
ciclo reentrante, la ausencia de anulación y la guarda que no bloquea», y dice que «la extensión a los
tres flujos —servicio técnico, equipo nuevo y soporte remoto— es la tanda F1B-09, sin empezar». Los dos
flujos nuevos existen desde F1B-06, así que la extensión ya es posible y se hace aquí.

**Qué se audita.** (1) Los tres catálogos, de forma mecánica (§1). (2) Los cuatro hallazgos de la R04 y
los cinco de F1A-05 (§2). (3) Lo que construyó la épica 1B: estado por tanda, lo construido y no
cableado, el orden de precedencia de las guardas, los cuatro incumplimientos vivos y la coherencia de
los lectores comunes con los tres flujos (§3 a §6). (4) Cifras e invariantes (§7).

**La premisa del mapa, comprobada.** La fila del plan dice que la tanda «hereda el generador de
diagramas» y que con él «la extensión de M11.6 deja de ser manual»
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:166`). El generador **existe**
(`scripts/generar-mapa-blueprint.ts:28-35`, construido por F1A-06) y **no está desfasado**: la prueba
anti-desfase (`packages/shared/src/mapaBlueprint.test.ts:168`) pasó en la ejecución completa de esta
tanda (§7). Pero **cubre un solo flujo**: recibe `TRANSITIONS` y `ESTADOS_SERVICIO`
(`scripts/generar-mapa-blueprint.ts:29` y `scripts/generar-mapa-blueprint.ts:31`), y el registro de
estados declara que `Verificación` «no debe aparecer en el mapa generado»
(`packages/shared/src/estados.ts:176-180`). Para equipo nuevo y soporte remoto la extensión **sigue
siendo manual**: es el hallazgo B-1, y esta auditoría los lee del catálogo, no de un mapa.

**Cómo se reproduce la parte mecánica.** Un guion de `tsx` que importa `TRANSITIONS`,
`TRANSITIONS_EQUIPO_NUEVO`, `TRANSITIONS_SOPORTE_REMOTO`, las dos transiciones sin botón y `ESTADOS`, y
calcula por flujo: estados derivados de `from`/`to`, estados sin salida, alcanzabilidad desde el estado
de nacimiento, estados que no alcanzan `Finalizado`, estados dentro de un ciclo, campos obligatorios y
áreas. No se versiona: los mismos hechos los fijan ya las pruebas que se citan en cada fila.

---

## 1 · Los tres flujos, leídos del catálogo

### 1.1 · Tabla mecánica

| Comprobación | Servicio técnico | Equipo nuevo | Soporte remoto |
|---|---|---|---|
| Catálogo | `packages/shared/src/transitions.ts:171` | `packages/shared/src/transitions.ts:350-363` | `packages/shared/src/transitions.ts:388-397` |
| Transiciones | 31 con botón, más 2 que aplica el servidor (`packages/shared/src/transitions.ts:150-151`) | 6 | 4 |
| Estados | 20 | 5 | 4 |
| Estado de nacimiento | `Ticket creado` (app) u `OV asignada` (Zoho) | **ninguno propio:** nace en `Ticket creado`, dentro del flujo de servicio (§1.3) | `Solicitud Soporte` (`packages/shared/src/flujos.ts:138-140`) |
| Sin salida que no sea terminal | ninguno; sólo `Finalizado` | ninguno; sólo `Finalizado` | ninguno; sólo `Finalizado` |
| Inalcanzables | ninguno | ninguno | ninguno |
| No alcanzan `Finalizado` | ninguno | ninguno | ninguno |
| Ciclos | 14 estados dentro de algún ciclo, todos con salida | `Ingresado`, `En Proceso`, `Notificado`, `Verificación`, con salida por `liberacion` | `En Proceso` ↔ `Pendiente`, con salida por `ejecutar_soporte` |
| Anulación | **no existe** | **no existe** | **no existe** |
| Campos obligatorios | 21 de las 31 declaran alguno | **ninguno** | **ninguno** |
| Áreas | cuatro combinaciones | las seis, `Servicio Técnico`, por supuesto | las cuatro, `Servicio Técnico`, por supuesto |

Lo fijan como pruebas: 31 sobre 20 y `Finalizado` como único sin salida
(`packages/shared/src/invariantesGrafo.test.ts:62`), la unión de 41 entradas con ids únicos
(`packages/shared/src/invariantesGrafo.test.ts:172`), los 23 estados de la unión
(`packages/shared/src/invariantesGrafo.test.ts:163`) y el único sin salida de la unión
(`packages/shared/src/invariantesGrafo.test.ts:177`). El ciclo de equipo nuevo tiene su propia aserción
(`packages/shared/src/reentrancia.test.ts:182`).

**Registro contra catálogos, en los dos sentidos.** Los 23 estados de `ESTADOS`
(`packages/shared/src/estados.ts:111-112`) son exactamente los derivados de los tres catálogos: no hay
estado declarado que ningún flujo use, ni estado usado que falte en el registro. Tampoco hay ids
repetidos entre catálogos.

### 1.2 · Lo que la tabla dice, en una lectura

**Los tres grafos están sanos como grafos.** Ninguno tiene callejones, estados huérfanos ni ciclos sin
salida. Lo que la R04 llamó «estados sin salida» no es una propiedad del grafo sino una clasificación de
negocio (§2, fila 2), y sigue igual.

**Los dos flujos nuevos no imponen ningún contenido.** Ninguna de sus diez transiciones declara un campo
obligatorio: un soporte remoto puede ir de `Solicitud Soporte` a `Finalizado` en dos pasos sin escribir
nada. No es un defecto del motor —el servidor impone lo que el catálogo declara
(`apps/desk/server/transitionExec.ts:76-77`)— y las specs lo declaran como supuesto por falta de fuente
(`packages/shared/src/transitions.ts:347-348`). Se anota porque es justo la clase de hueco que la R04
encontró en servicio: una etapa que se puede cruzar sin dejar el dato que la justifica.

**La única guarda propia de los flujos nuevos sí bloquea en el servidor.** `liberacion` desde
`En Proceso` se rechaza con `409` cuando el equipo exige verificación con gas patrón
(`apps/desk/server/services/ticketService.ts:241-250`), y la pertenencia de la transición al flujo del
ticket se impone antes que el estado y el permiso (`apps/desk/server/services/ticketService.ts:125` y
`apps/desk/server/services/ticketService.ts:231-234`).

### 1.3 · Tres observaciones sobre el enrutado, ya con dueño

No abren entrada nueva; se escriben para que el repaso de cierre no las redescubra.

1. **Un ticket de equipo nuevo no nace en su flujo.** El alta lo deja en `Ticket creado`
   (`packages/shared/src/flujos.ts:138-140`), y el catálogo de equipo nuevo sólo se aplica cuando el
   estado pertenece a él (`packages/shared/src/flujos.ts:57`). Hasta `Ingresado` sigue el flujo de
   servicio, así que pasa por «Habilitar Servicio» con todas sus guardas. Es diseño declarado; la duda
   de si la guarda de remisión le alcanza está abierta en E-158.
2. **Un «Pendiente» heredado de Zoho con clasificación de servicio no tiene transición en la
   aplicación.** F1C-09 retiró `Pendiente` del catálogo de servicio y hoy sólo sale de él
   `continuacion_soporte` (`packages/shared/src/transitions.ts:395-396`). La regla que lo resuelve existe
   (`packages/shared/src/migracionTickets.ts:31-34`, a `En Proceso`), pero es de la migración de F1F-01,
   cuya ejecución es tarea de persona y depende de E-207 a E-212.
3. **Las áreas de soporte remoto siguen siendo un supuesto.** E-090 está en la bandeja con estado
   «nueva» y `openspec/config.yaml` no contiene ninguna decisión que la responda (búsqueda de «E-090» y
   «e090»: cero resultados).

### 1.4 · Guardas sólo en cliente (regla invariable 13) en los flujos nuevos

| Decisión del cliente | Línea del servidor que la impone |
|---|---|
| Ofrecer sólo las transiciones del flujo del ticket (`apps/desk/src/components/TransitionPanel.tsx:56`) | `apps/desk/server/services/ticketService.ts:125` (`409` de flujo) y `apps/desk/server/services/ticketService.ts:126-128` (`409` de estado) |
| Ofrecer sólo las que permite el área del usuario | `apps/desk/server/services/ticketService.ts:129-131`, con las matrices `apps/desk/server/permisos.test.ts:219` (6×3) y `apps/desk/server/permisos.test.ts:304` (4×3) |
| Modalidad sólo en soporte remoto | `apps/desk/server/services/ticketService.ts:91` (`modalidadDelAlta`) |

No se encontró ninguna decisión de los dos flujos nuevos que viva sólo en el navegador. El barrido es el
de estas tres decisiones, no del cliente entero (§8, punto 3).

---

## 2 · Los hallazgos de la R04 y de F1A-05, con su estado hoy

### 2.1 · Los cuatro de la R04

| # | Hallazgo | Estado a `0d1a40b` | Evidencia | Dueño |
|---|---|---|---|---|
| 1 | La guarda que no bloquea | **CERRADO**, y sigue cerrado | `apps/desk/server/transitionExec.ts:76-77`. Hoy ningún catálogo declara un checkbox obligatorio (lo dice el propio comentario, `apps/desk/server/transitionExec.ts:73`, y lo confirma el guion de §0) | F1A-01 |
| 2 | Los cuatro estados sin salida | **SIGUEN**, los cuatro, con una sola salida cada uno | `packages/shared/src/estados.ts:151-160` | F1C-03, pendiente y después del corte (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:101`) |
| 3 | El ciclo reentrante | **SIGUE**, y la lista creció: de diez campos a **once** | `packages/shared/src/invariantesGrafo.test.ts:137` | F1C-02 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:100`) y F1C-06 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:104`) |
| 4 | La anulación | **SIN CONSTRUIR**, en los tres flujos | Ningún estado `Anulado` en `packages/shared/src/estados.ts` (`grep -c "Anulad"` da 0) | F1C-01 (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:99`); ver B-2 |

**Lectura.** La épica 1B no movió ninguno de los tres abiertos, y no le correspondía: los tres son
épica 1C y están programados después del corte. Lo que cambia respecto a F1A-05 es que el hallazgo 4
ahora alcanza a **tres** flujos y la decisión que lo gobierna se tomó cuando sólo había uno (B-2).

### 2.2 · Los cinco de F1A-05

| # | Hallazgo de F1A-05 | Estado hoy | Evidencia |
|---|---|---|---|
| A-1 | Bodegaje de proceso incalculable en la aprobación sin repuestos | **SIGUE** | «Fecha Orden de Compra» conserva un solo escritor (`packages/shared/src/transitions.ts:199`); la otra rama escribe la variante «Final», opcional (`packages/shared/src/transitions.ts:203`) |
| A-2 | `bodegaje.ts` construido y no cableado | **SIGUE, reducido** | `marcaIngresoAServicio` ya tiene consumidor (`packages/shared/src/indicadores.ts:125`); `periodosDeBodegaje` (`packages/shared/src/bodegaje.ts:166`) y `diasDeBodegaje` (`packages/shared/src/bodegaje.ts:208`) siguen sin llamador de producción |
| A-3 | «Habilitado para entrega» exige una fecha nueva | **VIGENTE** como condición de despliegue | `packages/shared/src/transitions.ts:259-260` |
| A-4 | El artefacto HTML describe un flujo anterior y no hay generador | **SUPERADO en su mitad** | El generador existe y el HTML quedó como histórico; el desfase del HTML sigue anotado en E-161. Lo que queda es B-1 |
| A-5 | `eslint` no ignoraba `coverage/` | **CERRADO** | `eslint.config.js:16` |

---

## 3 · La épica 1B, tanda a tanda

Estado contrastado con las cabeceras de los `proposal.md` archivados (`tanda:` y `cierra:`), no con la
tabla del plan, que es un documento fechado.

| Tanda | Estado hoy | Cambios que la llevan |
|---|---|---|
| F1B-01 | cerrada por commit declarado | anterior a la convención de archivo |
| F1B-02 | cerrada por archivo | `hojas-vida` (`cierra: si`) |
| F1B-03 | en curso | `tipo-servicio-ticket-sin-ov` y `remision-creada-sin-salida`, las dos con `cierra: no` |
| F1B-04 | en curso | `foto-solo-con-novedad` y `recepcion-rotulacion-foto-entrada`, `cierra: no` |
| F1B-05 | en curso **en esta rama** | `traspaso-y-trazas`, `cierra: no`; la mitad de visibilidad espera a E-089. En `main` no existe aún |
| F1B-06 | cerrada por archivo | `blueprint-equipo-nuevo` (`cierra: no`) y `blueprint-soporte-remoto` (`cierra: si`) |
| F1B-07 | en curso | `prioridad-top5-cliente` y `propagar-top5-lista-remision-creada`, `cierra: no` |
| F1B-08 | en curso | cuatro cambios, todos `cierra: no` |
| F1B-09 | en curso desde esta propuesta | `audit-f1b`, `cierra: no` |
| F1B-10 | cerrada por archivo | `orden-precedencia-guardas` (`cierra: si`) |
| F1B-11 | en curso | `parche-iv11-orden-venta`, `asociacion-ov-ticket` y `registro-contrato`, `cierra: no` |
| F1B-12 | cerrada por archivo | `calendario-laboral` (`cierra: si`) |

Fuera de la lista pedida, por completar la épica: F1B-14 y F1B-15 cerradas por archivo; F1B-13
pendiente; F1B-16 y F1B-17 condicionadas; F1B-18 en reserva.

**Dos filas del plan R01.4 ya no dicen el estado de hoy**, sin que eso sea un defecto del plan: F1B-05
figura como «pendiente» (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:85`) y F1B-09 también
(`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:89`). El avance no se lee de esa columna sino
de las cabeceras, y la prueba que lo cuenta se actualiza en esta tanda (§7.2).

---

## 4 · Construido y no cableado

Método: por cada `export` de `packages/shared/src` (sin pruebas, sin `index.ts`), búsqueda de la palabra
en `apps/`, `packages/` y `scripts/` fuera de su propio fichero y de las pruebas. Y por cada ruta
`/api/...` del servidor, búsqueda de sus segmentos fijos en `apps/desk/src`.

| Pieza | Situación | Lectura |
|---|---|---|
| `transitionsForStatus` (`packages/shared/src/transitions.ts:301`) y `transitionById` (`packages/shared/src/transitions.ts:305`) | Exportadas, sin llamador de producción | F1B-06 las sustituyó por el registro de flujos, y **sólo conocen el catálogo de servicio**. Mientras sigan exportadas, quien las use obtiene una respuesta incompleta sin error. Es el mismo riesgo que el registro evita |
| `periodosDeBodegaje` y `diasDeBodegaje` | Sin llamador de producción | A-2 de F1A-05, vigente |
| `puedeCrearOVIGarantia` (`packages/shared/src/cargos.ts:71`) | Sin llamador de producción | El permiso existe y la acción no: «crear la OVI de garantía» está sin definir (E-157) |
| `puedeLiberarSinFactura` (`packages/shared/src/cargos.ts:63`) | Sin llamador de producción | La liberación se impone por otra vía (`apps/desk/server/services/ticketService.ts:131`); el predicado suelto no lo consume nadie |
| Rutas sin cliente | 14 de 120, todas bajo `/api/admin/` | Son operaciones de mantenimiento que lanza una persona; ninguna es de la épica 1B. No es hallazgo |
| Cliente sin ruta | No se buscó de forma mecánica | Declarado en §8 |

Las utilidades de `reentrancia.ts` tampoco tienen llamador de producción, pero lo son por diseño desde
F0-04: existen para las pruebas de invariantes. No se cuentan.

---

## 5 · Orden de precedencia de las guardas (F1B-10) y los cuatro incumplimientos vivos

### 5.1 · Las dos puertas del motor

La ejecución de una transición respeta A < B < C < D tal como está escrita hoy: existencia de la
transición y del ticket (`apps/desk/server/services/ticketService.ts:122-125`); flujo, estado, área,
cargo, prioridad, verificación, alta validada y remisión vigente
(`apps/desk/server/services/ticketService.ts:125-131`); contenido
(`apps/desk/server/services/ticketService.ts:134` y `apps/desk/server/services/ticketService.ts:147`); y
unicidad de la orden de venta al final (`apps/desk/server/services/ticketService.ts:150-151`). El alta
de ticket acaba igual, con la unicidad como última guarda
(`apps/desk/server/services/ticketService.ts:96-100`).

**Una precisión que no es hallazgo:** dos guardas del escalón B responden `422` y no `403` ni `409` —la
alta validada y la remisión vigente (`apps/desk/server/services/ticketService.ts:258-277`)—. El escalón
lo fija la posición, no el código de respuesta, y así lo declaran sus comentarios.

### 5.2 · Los cuatro incumplimientos vivos de `CLAUDE.md`

| Desvío | ¿Sigue vivo? | ¿En las líneas que cita `CLAUDE.md`? |
|---|---|---|
| `clientId` de la orden de venta sin contrastar | **Sí** | Sí: `apps/desk/server/services/ticketService.ts:41`, y la guarda equipo↔cliente en `apps/desk/server/services/ticketService.ts:61-79`. **Pero la razón que da `CLAUDE.md` ha caducado otra vez** (B-8) |
| Color de las esperas por expresión regular (IV-9) | **Sí**, en dos puntos | **Uno no.** El de la ficha del ticket sí (`apps/desk/src/components/TicketDetailView.tsx:245`). El del detalle de cliente se desplazó: `CLAUDE.md` lo sitúa en la línea 22 de `ClienteDetalle.tsx`, que hoy es un comentario; la expresión está en `apps/desk/src/components/ClienteDetalle.tsx:41` y el clasificador en `apps/desk/src/components/ClienteDetalle.tsx:36` |
| IV-11, la sincronización y la orden de venta | **Sí, reducido** | Sí: `packages/zoho-sync/src/db/repo.ts:44-54`, `packages/zoho-sync/src/db/repo.ts:71`, `packages/zoho-sync/src/db/repo.ts:78`, `packages/zoho-sync/src/db/repo.ts:305`, `packages/zoho-sync/src/db/schema.sql:187`, `packages/zoho-sync/src/config.ts:88` y `apps/desk/server/routes/remision.ts:240` dicen lo que la ficha afirma |
| IV-12, el alta de remisión y el orden total | **Sí**, en sus tres puntos | Sí: `apps/desk/server/routes/remision.ts:127` («Fecha inválida»), `apps/desk/server/routes/remision.ts:155` (serial), `apps/desk/server/routes/remision.ts:158` (recepción), `apps/desk/server/routes/remision.ts:177` (`409` pendiente), `apps/desk/server/routes/remision.ts:197` (checklist) y `apps/desk/server/routes/remision.ts:220` (orden de venta). La prueba de posición sigue en `apps/desk/server/remisiones.test.ts:988` |

El encabezado «Cuatro desvíos vivos» de `CLAUDE.md` es correcto. Lo que ha caducado son dos detalles de
sus fichas, y se registran como B-8 porque el fichero se carga en cada sesión.

---

## 6 · Los lectores comunes ante los tres flujos

La pregunta es del molde H5: ¿algún lector asume el catálogo de servicio y trata mal a los otros dos?

| Lector | ¿Distingue el flujo? | Evidencia | Resultado |
|---|---|---|---|
| Motor de transiciones | Sí | `apps/desk/server/services/ticketService.ts:122` y `apps/desk/server/services/ticketService.ts:125` | Correcto |
| Panel de transiciones | Sí | `apps/desk/src/components/TransitionPanel.tsx:56` | Correcto |
| Aviso de área | Sí | `apps/desk/server/services/ticketService.ts:196`, `apps/desk/server/services/avisoArea.ts:15-16` | Correcto |
| Línea de traspaso del historial | Sí | `apps/desk/server/db/traspaso.ts:33` | Correcto |
| Alarmas de SLA | Sí, por exclusión | `apps/desk/server/db/sla.ts:48-49` descarta lo que no es de servicio | Correcto: un `Notificado` de equipo nuevo no dispara la alarma de servicio |
| Historial y hoja de vida | No lo necesitan | Leen nombres y estados ya escritos en `ticket_transitions` | Correcto |
| Vistas del tablero y «Mis tickets» | No lo necesitan | `apps/desk/src/lib/boardView.ts:39` y `apps/desk/src/lib/boardView.ts:47-48` | Correcto, con el matiz de B-5 |
| **Indicadores** | **No** | `apps/desk/server/indicadores.ts:57-64`: la consulta filtra sólo por periodo | **B-3** |
| **Columnas del tablero** | **No** | `packages/shared/src/columns.ts:4-5` declara que son los estados de servicio | **B-4** |
| **Mapa generado** | **No** | `scripts/generar-mapa-blueprint.ts:29` | **B-1** |

**B-3, con su límite.** Verificado: la consulta de entrada de los indicadores no mira la clasificación ni
el flujo. Hipótesis, no ejecutada: un ticket de equipo nuevo o de soporte remoto creado en el periodo
entra en la tabla y sus indicadores salen «sin dato» por falta de hito
(`packages/shared/src/indicadores.ts:141`), porque los hitos son fechas y marcas del flujo de servicio.
Si es así, la tabla y el fichero exportado mezclan tickets a los que el indicador no aplica con tickets
a los que les falta el dato, y las dos cosas se leen igual.

**B-4.** `Verificación` y `Solicitud Soporte` no tienen columna, así que caen en «Otros»
(`packages/shared/src/columns.ts:34` y `packages/shared/src/columns.ts:45-47`): un soporte remoto recién
creado aparece en la columna de seguridad. `Pendiente` conserva la suya
(`packages/shared/src/columns.ts:27`) aunque ya no es estado de servicio. El mapa de colores de la
tarjeta tampoco conoce los estados propios de los flujos nuevos
(`apps/desk/src/components/TicketCard.tsx:14`).

**B-5.** Tres estados siguen `sin_clasificar` (`packages/shared/src/estados.ts:105`): `Pendiente`,
`Verificación` y `Solicitud Soporte`. La vista «En espera» no los enseña y la de «Abiertos» sí, sea cual
sea la respuesta correcta. El propio registro dice quién decide el primero —Servicio Técnico— y que
apuntar `ninguna` no es decidir. Lo mismo ocurre con las áreas de las seis transiciones de equipo nuevo,
que son un supuesto (`packages/shared/src/transitions.ts:347`); para ese supuesto no se encontró entrada
en la bandeja (la de soporte remoto es E-090).

---

## 7 · Cifras, invariantes y registros

### 7.1 · Cifras medidas en esta tanda

| Medida | Resultado |
|---|---|
| `npx vitest run`, árbol `0d1a40b` más los ficheros de esta tanda antes de editar la prueba de §7.2 | **verde** — 217 ficheros (215 pasan, 2 omitidos), **3.354 pruebas** (3.347 pasan, 7 omitidas) |
| Transiciones por flujo | 31 + 6 + 4 = **41**; con las dos sin botón, 43 |
| Estados | **23** en el registro; 20 de servicio, 5 de equipo nuevo, 4 de soporte remoto (comparten nombres) |
| Aristas del mapa generado | **35**, sólo servicio (`packages/shared/src/mapaBlueprint.test.ts:46`) |
| Estados `en_espera` | **11** (`packages/shared/src/estados.ts:120`) |
| Campos de fecha reentrantes | **11** |

La cifra de pruebas coincide con la del último intento sobre el mismo commit (3.347 y 7), ahora medida y
no heredada. `typecheck`, `lint` y `build` **no se ejecutaron**: esta tanda no toca código de producción.

### 7.2 · Lo que esta tanda sí cambia

Una sola línea de prueba: `apps/desk/server/reconciliacion/registro.test.ts:218-220` contaba DIEZ tandas
«en curso» leyendo las cabeceras reales; con la propuesta `audit-f1b` son ONCE y entra F1B-09.

### 7.3 · Cifras y afirmaciones que ya no son ciertas, y nada se pone rojo

Ninguna está cubierta por una prueba; por eso se listan (regla de mutación 4: una cita o una cifra en un
comentario no es una aserción).

| Dónde | Qué dice | Qué es cierto hoy |
|---|---|---|
| `packages/shared/src/estados.ts:144-145` | Cruzar «salida única» con `en_espera` «da SEIS» | Da **ocho**: desde `por-entregar-es-espera` entran también `Por Entregar` y `Por Entregar / Sin facturar`. El «DOCE» de la línea anterior sigue siendo correcto |
| `packages/shared/src/estados.ts:83` | `Remisión creada` «entra por `facturado`/similar» | Entra por la transición sin botón `remision_confirmada` (`packages/shared/src/transitions.ts:150`) |
| `apps/desk/server/services/ticketService.ts:238` | «en las otras 43 transiciones» | Son **40**: la unión tiene 41 desde F1C-09 |
| `packages/shared/src/transitions.ts:67` | «las 32 etapas» | Son 31 |
| `packages/shared/src/transitions.ts:348` | Equipo nuevo: «Campos: sólo `comment()`» | `liberacion` declara además el certificado de fábrica (`packages/shared/src/transitions.ts:360`) |
| `openspec/specs/trazas/spec.md:51` | La cobertura SHALL ser «de las 34 transiciones» | Es un requisito vivo con la cifra anterior a F1C-09 |
| `openspec/specs/remisiones/spec.md:752`, `openspec/specs/tickets-core/spec.md:1672`, `openspec/specs/zoho-sync/spec.md:789`, `openspec/specs/derivacion-avisos/spec.md:732`, `openspec/specs/transitions-st/spec.md:1343` | «las 34 transiciones», en presente | 31 en servicio, 41 en la unión |
| `CLAUDE.md`, «Pruebas de interfaz» | «Los 39 ficheros `.tsx` (6.329 líneas)» | **49** ficheros y **7.556** líneas (`find apps/desk/src -name "*.tsx"`). La decisión no cambia; la cifra sí |
| `CLAUDE.md`, fila del `clientId` | La búsqueda de «mantenedor» en el código «da **0**» | Da **93** apariciones, 39 fuera de pruebas. El campo existe (`packages/shared/src/equipoComercial.ts:14`); lo que no existe es la guarda: `ticketService.ts` no lo nombra |
| `CLAUDE.md`, cierre de IV-1 | La línea 2 de `boardView.ts` «importa `ESTADOS_EN_ESPERA` de `@ambientalia/shared`» | Importa `esEstadoEnEspera` de `./enEspera` (`apps/desk/src/lib/boardView.ts:2`). El fondo se mantiene: sigue leyendo el registro |
| `openspec/config.yaml:1280-1285` (PF-1, campo `correccion`) | «F1A-05 y F1B-09 deben CONSTRUIR el generador» del HTML | Lo sustituyó `decision/mapa-blueprint-generado`: el generador lo construyó F1A-06 y produce los `.md` |
| `openspec/config.yaml`, `decisiones_de_gerencia` | Debería contener `decision/mapa-blueprint-generado` | **No la contiene** (cero apariciones de la clave). Vive en `docs/sdd/Decisiones_Gerencia_2026-09-10.md:511` y en `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md:389`, que la sesión no carga |
| `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3521` | F1B-09 «sin empezar» | Hecha una primera pasada, con `cierra: no` (B-9) |

Las cifras ancladas del maestro (31, 20 y 35) sí tienen guardián
(`packages/shared/src/cifrasAncladas.test.ts:24`) y están en verde.

---

## 8 · Lo que esta auditoría NO hizo, declarado

1. **No se ejecutó contra la aplicación desplegada** ni contra datos de producción. Todo es lectura del
   árbol `0d1a40b` y una ejecución de la suite.
2. **No se auditó `main`.** Dos tandas del árbol auditado no están fusionadas (cabecera). El repaso de
   cierre debe hacerse sobre `main`.
3. **No se revisó el cliente `.tsx` con pruebas**, porque no las hay por decisión de Gerencia
   (`vitest.config.ts:16`, `vitest.config.ts:17-20`). La comparación de la regla invariable 13 se hizo
   sólo para las tres decisiones de §1.4, no para los 49 ficheros.
4. **No se buscó «cliente sin ruta»** de forma mecánica; sólo «ruta sin cliente», y por coincidencia de
   segmentos, que es una heurística.
5. **B-3 no se ejecutó**: la consulta está leída; el efecto sobre la tabla es hipótesis.
6. **No se contrastó cada tanda de 1B con su `archive-report.md`** línea a línea: el estado de §3 sale
   de las cabeceras `tanda:` y `cierra:`. Qué parte del contenido de cada fila cubre cada cambio es lo
   que dice cada informe, y aquí no se ha verificado.
7. **No se comprobó si cada hallazgo tenía ya entrada** más allá de las búsquedas que se nombran. Que
   B-4 o B-5 dupliquen una entrada antigua es posible; hipótesis: no la duplican.
8. **No se regeneró ni se amplió el mapa**, ni se corrigió ninguna de las cifras de §7.3.
9. **No se revisó el flujo de la remisión** (n8n, callback, anulación) más allá de las líneas de IV-12.

---

## 9 · Hallazgos de F1B-09, en una línea cada uno

| # | Hallazgo | Severidad | Entrada |
|---|---|---|---|
| B-1 | El mapa generado y su prueba anti-desfase cubren sólo servicio; equipo nuevo y soporte remoto no tienen mapa, y la extensión de M11.6 sigue siendo manual | Media | E-222 |
| B-2 | La anulación no existe en ninguno de los tres flujos, y la decisión que la gobierna es anterior a los dos nuevos | Media | E-223 |
| B-3 | Los indicadores no distinguen el flujo: la consulta trae también los tickets de equipo nuevo y soporte remoto | Media | E-224 |
| B-4 | Dos estados de los flujos nuevos no tienen columna en el tablero y caen en «Otros»; `Pendiente` conserva columna sin ser ya de servicio | Baja | E-225 |
| B-5 | Supuestos sin decidir de los flujos nuevos: tres estados sin clase de espera y las áreas de equipo nuevo | Baja | E-226 |
| B-6 | Construido y no cableado: dos lectores del catálogo que sólo conocen servicio, el bodegaje y dos predicados de cargo | Baja | E-227 |
| B-7 | Cifras y comentarios caducos en el código y en seis specs vivas, sin prueba que los vigile | Baja | E-228 |
| B-8 | `CLAUDE.md` y `openspec/config.yaml` afirman varias cosas que ya no son ciertas, entre ellas la razón del desvío del `clientId` | Media | E-229 |
| B-9 | El maestro dice que F1B-09 está «sin empezar» | Informativa | E-230 |

**No abren entrada**, porque ya tienen dueño: los tres hallazgos abiertos de la R04 (épica 1C), A-1 y
A-2 de F1A-05, los cuatro incumplimientos vivos y las tres observaciones de §1.3.
