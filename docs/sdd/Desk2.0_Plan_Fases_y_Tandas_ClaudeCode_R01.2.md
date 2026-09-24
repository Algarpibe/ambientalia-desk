# Desk 2.0 — Plan de fases y tandas · revisión R01.2 — **BORRADOR**

> ## ⚠️ Calendario sin cuadrar: faltan las épicas 1G y 1H y la encuesta
>
> Esta revisión se commitea **como borrador** y su calendario **no es válido para planificar**. Las épicas **1G** (repatriación del histórico) y **1H** (correo propio) no están en ninguna de sus cuentas, y la **encuesta de satisfacción** tampoco — y las tres entran antes del corte. La revisión que sí las incorpora es la **R01.3**.

**Fecha:** 2026-09-24 · **Base:** `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md` (618 líneas), que **no se borra**.

**Qué es este fichero y qué no.** Es una revisión **diferencial**: contiene íntegras las secciones que cambian —§4.5 gates, §5 catálogo y §3.7 calendario— y remite a la R01.1 para todo lo demás. No reproduce las 618 líneas a propósito: regenerarlas desplazaría las citas `plan:NNN` de medio repositorio y la regla de mutación 4 de `CLAUDE.md` dice exactamente por qué eso es el modo de fallo, no la reparación.

**Qué la motiva.** Las 59 decisiones de `openspec/config.yaml → decisiones_de_gerencia`, y en particular la del corte: **el 31/12/2026 deja de ser la meta y la sustituye el lunes 14/12/2026** (`decision/fecha-corte`, `openspec/config.yaml:2151-2167`).

**Lo medido y lo supuesto.** Todo cuadro de este documento lleva su `ruta:línea`. Donde hay estimación y no medida, se dice con la palabra **hipótesis** delante.

---

## A · Filas nuevas que las decisiones piden expresamente

Cuatro, y **sólo cuatro**. Cada una con la clave de decisión que la respalda.

| ID | Nombre | Capacidad | Fuente (clave) | Talla | Semana |
|---|---|---|---|---|---|
| **F0-06** | Vigilancias del repaso automático | `reconciliacion` | `decision/barrido-comprobaciones-nuevas` (`config.yaml:2472-2487`) | S | S39 |
| **F1B-12** | Calendario laboral (jornada, festivos, día hábil) | `kpis` | `decision/calendario-habil` (`config.yaml:2455-2470`) | S | S40 |
| **F1B-13** | Reclamación de garantía al fabricante | `tickets-core` | `decision/anexo-7-garantia-proveedor` (`config.yaml:2256-2271`) | S | junto a F1B-03 |
| **F1F-05** | Continuidad de los indicadores de Zoho Desk | `kpis` | `decision/e009-kpis` (`:2438-2453`) + `decision/e009b-lista-indicadores` (`:2555-2773`) | S–M | **S47** (ver §D) |

**F0-06 llega con ID y talla ya decididos por Gerencia** (`config.yaml:2477-2487`): «fila nueva F0-06, *Vigilancias del repaso automático*, tamaño S, en la cola de Fase 0». Los ID de las otras tres los propone esta revisión y **no están decididos**: es nomenclatura, no alcance.

**F1B-12 es dependencia dura, no una fila más.** `decision/anexo-3-alerta` (`:2240-2254`) fija la alerta en **4 días hábiles**, y `decision/c7-reloj-sla` (`:1895-1915`) para el reloj del SLA según de quién sea la demora. Sin calendario laboral no existe «día hábil» que contar: por eso su fila va **antes** que cualquier alarma, que es lo que la propia decisión dice.

**F1F-05 trae el primer criterio de aceptación numérico que Gerencia fija para una tanda** (`config.yaml:2563`): ≥ 95 % de tickets coincidentes, diferencia máxima de un día, y cada diferencia mayor explicada por escrito.

### A.1 · Lo que NO es fila nueva, aunque lo parezca

| Asunto | Qué es en realidad | Dónde |
|---|---|---|
| Registro de contrato e informe trimestral | **Alcance añadido a F1B-11**, no fila. El propio registro lo dice: «ALCANCE AÑADIDO A F1B-11 (S41, talla L), que ya es la tanda más grande de la épica 1B» | `config.yaml:2377` |
| Catálogo de equipos | **Ya está hecho.** «No necesita fila propia», medido contra el código el 23/09 | `config.yaml:2049-2064` |
| Registro de equipos | **Ya tiene fila**: F1B-02, archivada y fusionada el 23/09 | `config.yaml:2066-2081` |

### A.2 · Tres filas que me pediste y que NO escribo, con su razón

`CLAUDE.md` dice que la bandeja no es fuente: *«Una decisión que sólo esté en la bandeja no ha llegado: trátala como pendiente y dilo.»* Las tres están en `docs/sdd/ENTRADA.md` y **no** en `decisiones_de_gerencia`:

| Asunto | Estado real en la bandeja |
|---|---|
| `equipo-nuevo-alta-en-ticket` | Destino **propuesto** F1B-06, no escrito (`ENTRADA.md:1089`) |
| `edicion-datos-comerciales-equipo` | **«Sin destino»**; además es decisión de permiso (`ENTRADA.md:1097`) |
| `mapa-en-la-app` | **«Sin destino»**, y remite a «Decide Gerencia» (`ENTRADA.md:1105`) |

Escribirles fila sería inventar destino, que es lo que R-3 prohíbe y lo que dejó cuatro desvíos huérfanos al cerrar F1A. **Quedan como punto abierto de Gerencia**, en §B de la entrega.

---

## B · Filas existentes que cambian de alcance o de gate

| Fila | Qué cambia | Clave |
|---|---|---|
| **F1A-03** (C12 salidas de Verificación) | **Se desbloquea el gate P38**: la Verificación es obligatoria por tipo de equipo. Sigue dependiendo de F1B-06, porque el estado «Verificación» no existe en código | `decision/p38-verificacion-calidad` (`:1957-1976`) |
| **F1B-06** (equipo nuevo y soporte remoto) | **Construye DOS ramas, no tres**: los flujos comercial y posible-cliente se quedan en Zoho CRM | `decision/flujos-comercial-posible-cliente` (`:1725-1743`) |
| **F1B-07** (prioridad y Mis tickets) | **Se desbloquea**: la prioridad automática sigue para todos y los Top 5 son la excepción manual. Cierra lo que el gate dejó a medias el 21/09 | `decision/top5-manual` (`:1939-1955`) |
| **F1B-08** (paridad de vistas) | Sigue **partida**: la alarma tiene destinatario único (Coordinador Comercial), pero la paridad Zoho **sigue bloqueada** porque la escritura contra Zoho no se activa | `escalado-remision-creada` (`:1411-1445`) · `p44-escritura-zoho` (`:1552-1572`) |
| **F1B-11** (OV ↔ ticket 1:N) | **Crece dos veces**: absorbe el registro de contrato e informe trimestral, y absorbe el parche de IV-11 con `cierra: no` | `anexo-53-contratos` (`:2364-2385`) · `e005b-parche-vehiculo` (`:2083-2098`) |
| **F1D-03** (macro-fases) | Los N1 son **propios de cada marca**, no comunes: Grimm conserva sus 8 y Horiba los suyos | `decision/p45-macro-fases` (`:1978-1994`) |
| **F1D-07** (formulario de falla nueva) | El formulario es **obligatorio pero no bloqueante**: son dos cosas distintas | `decision/falla-nueva-bloqueante` (`:2031-2047`) |
| **F1E-04** (validación y firma) | **Tres firmas**: Elaboró, Revisó y la tercera según el texto | `decision/roles-validacion-informe` (`:2221-2238`) |
| **F1F-01** (migración y corte) | La fecha deja de ser 31/12: **corte en seco el 14/12/2026**. La hoja de Google se cierra ese mismo día | `fecha-corte` (`:2151-2167`) · `p14b-hoja-google` (`:2505-2519`) |
| **F1F-02** (respaldo) | Responsable Alfonso, copia automática con aviso por correo, y **destino en proveedor distinto de Google y Hostinger** | `p55-backup` (`:2169-2185`) · `p55b-destino-copia` (`:2521-2536`) |
| **Fase 2 (2027 T1)** | Entra el **servicio en sitio** como cuarta rama del blueprint, en el T2 de 2027. Sale de Fase 1 | `decision/anexo-43-en-sitio` (`:2324-2339`) |

---

## C · §4.5 · Gates

### C.1 · Decididos (no bloquean nada)

`tanda-por-contenido` · `escalado-remision-creada` · `veto-plan-r01-1` · `escalado-destinatario-doble` · `e013-staging-f0-04` · `ovi-garantia-autor` · `p44-escritura-zoho` · `titularidad-ov-equipo` · `vigencia-contrato` · `e003c-recuento-modelos` · `e005-iv4-iv11` · `e013b-copia-pruebas` · `p8-p54-drive` · `flujos-comercial-posible-cliente` · `titularidad-mantenedor` · `c2-anulado` · `c3-salida-esperas` · `c4-dos-ramas` · `c5-tipo-evento` · `c6-qa-liberacion` · `c7-reloj-sla` · `c10-permisos-cargo` · `top5-manual` · `p38-verificacion-calidad` · `p45-macro-fases` · `p14-remisiones-entrada` · `p15-p59-rutas` · `falla-nueva-bloqueante` · `e003-catalogo-equipos` · `e003b-registro-equipos` · `e005b-parche-vehiculo` · `e005c-discrepancia-sin-espejo` · `mantenedor-campo-cuando` · `trabajo-sin-ficha` · `fecha-corte` · `p55-backup` · `p62-capa-as-built` · `p64-historico-c1` · `roles-validacion-informe` · `anexo-3-alerta` · `anexo-7-garantia-proveedor` · `anexo-9-comentarios` · `anexo-33-checkbox` · `anexo-36-aviso` · `anexo-43-en-sitio` · `anexo-47-repuestos` · `anexo-53-contratos` · `anexo-56-taxonomia` · `anexo-61-incorporacion` · `e001-por-entregar` · `e009-kpis` · `calendario-habil` · `barrido-comprobaciones-nuevas` · `c10b-gerente-director` · `p14b-hoja-google` · `p55b-destino-copia` · `p64b-quien-ejecuta` · `e009b-lista-indicadores`

**58 cerrados.**

### C.2 · Abiertos, con quién decide y qué desbloquean

| Gate | Estado | Quién decide | Qué desbloquea |
|---|---|---|---|
| `top5-prioridad` | **PARCIAL** — el propio registro dice que «por eso el gate no se cierra entero» (`:1745-1766`) | Gerencia | Ya no bloquea: lo cerró `top5-manual`. Se conserva abierto sólo como registro |
| **P44 / escritura contra Zoho** | Decidido «no por ahora» | Gerencia | La mitad de **paridad Zoho** de F1B-08. Mientras no se active, esa mitad no se puede construir |

**Y tres puntos abiertos que no son gates de una fila pero bloquean alcance**, todos de §A.2: `equipo-nuevo-alta-en-ticket`, `edicion-datos-comerciales-equipo` y `mapa-en-la-app`.

---

## D · Criterio de Gerencia aplicado (24/09) — qué entra y qué sale

**El criterio, literal:** antes del corte del 14/12 entra **todo lo que hoy hace Zoho Desk y lo necesario para operar sin él**; lo que Zoho **no** hace hoy —diagnóstico guiado (1D), módulo de informes (1E) y validación con firmas— pasa a **enero–febrero de 2027**, sin cambiar ninguna decisión tomada sobre ello. **El 21/12 es fecha de reserva, no plan.**

### D.1 · Cuál de los cuatro recortes elige el criterio

| # | Recorte enumerado en la versión anterior | ¿Lo elige el criterio? |
|---|---|---|
| 1 | **F1B-06 a un solo flujo** | **NO.** Zoho tiene hoy los cuatro grafos del blueprint, así que equipo nuevo y soporte remoto son «lo que hoy hace Zoho» y entran enteros. Y recortarla dejaría **F1A-03 bloqueada**, porque depende de que exista el estado «Verificación» |
| 2 | **F1D-08 (Horiba) a enero** | **SÍ, y ampliado.** El criterio no mueve una tanda: mueve **1D entera** (9 filas), porque el diagnóstico guiado es precisamente lo que Zoho no hace |
| 3 | **1C fuera de ruta crítica salvo C2** | **NO como recorte.** 1C son correcciones a tickets y transiciones, que el criterio mete dentro. Lo que sí cambia es la urgencia de **C2**: la R01.1 la exigía antes de F1E, y 1E se va — pero C2 **se queda**, porque es quien libera la subOV al anular y eso es de F1B-11, que entra |
| 4 | **Plan B del 21/12** | **NO.** Gerencia lo degrada explícitamente a reserva |

**Y el criterio añade un recorte que yo no había enumerado: 1E entera** (5 filas), módulo de informes, con la validación por firmas dentro.

### D.2 · Qué sale, con su destino

| Épica | Filas | Destino |
|---|---|---|
| **1D** · Diagnóstico guiado | **9** (F1D-01…F1D-09) | enero–febrero 2027 |
| **1E** · Módulo de informes | **5** (F1E-01…F1E-05, incluida F1E-04 validación con firmas) | enero–febrero 2027 |

**Ninguna decisión tomada sobre ellas cambia.** Siguen vigentes y sin tocar: `p45-macro-fases`, `falla-nueva-bloqueante`, `anexo-9-comentarios`, `anexo-47-repuestos`, `anexo-56-taxonomia`, `roles-validacion-informe` y `p14-remisiones-entrada`. Se mueve la **fecha**, no el contenido.

### D.3 · Qué entra, con su semana

Las once semanas se reparten así. **La construcción no llega a S50: termina el miércoles 9/12**, que es la fecha de examen que fija `decision/fecha-corte` (`config.yaml:2160`), y el fin de semana 12–13/12 es la migración.

| Semana | Entra |
|---|---|
| S40 (28/09) | **F1B-12** calendario laboral · **F0-06** vigilancias del repaso |
| S41 (05/10) | F1B-03 · F1B-13 garantía al fabricante |
| S42 (12/10) | F1B-04 recepción unificada · F1B-05 roles y traspaso |
| S43 (19/10) | **F1B-06** (dos ramas) → desbloquea F1A-03 |
| S44 (26/10) | **F1A-03** · F1B-07 prioridad y Mis tickets |
| S45 (02/11) | **F1B-11** (OV 1:N + contrato + parche IV-11) — talla L, se parte |
| S46 (09/11) | F1B-11 (segunda mitad) · F1B-08 alarma 72 h |
| **S47 (16/11)** | **F1F-05 arranca y empieza a medir** — las cuatro semanas en paralelo que exige `config.yaml:2564` |
| S48 (23/11) | 1C: C2 · C4 · C6 (el estado Control de calidad) |
| S49 (30/11) | 1C: C3 · C5 · C7 · C10 · F1B-09 audit-F1B |
| S50 (07/12) | **Examen el miércoles 9/12** (cuatro condiciones) · **F1F-01** migración de tickets abiertos · **F1F-03** pruebas con servicios reales |
| **12–13/12** | **Migración**, fin de semana, sin copia donde ensayarla (`e013b-copia-pruebas`) |
| **14/12** | **CORTE EN SECO** |

**F1F-02** (respaldo) no tiene semana propia: `config.yaml:2178` dice que «el adelanto es trabajo sin tanda» y que F1F-02 sigue con el resto. Se deja declarado, no inventado.

---

## D-bis · ¿Cabe? Los números, y la respuesta honesta

### El recuento

| | |
|---|---|
| Filas R01.2 | **56** |
| Salen a 2027 (1D + 1E) | **−14** |
| **Antes del corte** | **42** |
| Ya cerradas | **−9** |
| **Pendientes antes del 14/12** | **33** |

### El tiempo

Medido contra el calendario, no estimado: del **24/09 al 14/12** hay **81 días = 11,6 semanas**; hasta el **examen del 9/12**, **76 días = 10,9 semanas**. `config.yaml:2159` lo dice igual: «quedan ONCE semanas hasta el 14/12, no catorce hasta fin de año».

**33 filas ÷ 10,9 semanas = 3,0 filas por semana.**

### El ritmo observado

Del 09/09 al 23/09 —catorce días— se archivaron **13 cambios**, de los que **6 cerraron fila de plan**. Eso da **3 filas por semana sostenidas**, con un pico de 6 en la semana del 17 al 23/09.

**El ritmo exigido (3,0) es exactamente el ritmo observado (3,0).** Cabe, y cabe sin un solo día de margen.

### Por qué aun así NO puedo confirmarlo

`decision/fecha-corte` (`config.yaml:2160`) fija **cuatro condiciones de confirmación** para el examen del 9/12. **Dos de las cuatro no tienen fila en el plan:**

| Condición del corte | Estado |
|---|---|
| Creación y movimiento de tickets | Cubierto (1A + 1B + 1C) |
| **Respuesta al cliente por correo SIN Zoho** | **SIN FILA.** Existe `docs/sdd/Decision_Correo_n8n_vs_GmailAPI.md`, que está **sin trackear**; `config.yaml:257` lo cita como cruce pendiente |
| **Histórico completo verificado** (repatriación) | **SIN FILA, y sin decisión.** La palabra «repatriación» no aparece ni en `config.yaml` ni en `ENTRADA.md`: sólo en tres ficheros de `docs/sdd/` **sin trackear** |
| Pruebas | F1F-03, con semana asignada |

Y hay una tercera pieza nombrada por el criterio que tampoco tiene fila: **la encuesta de satisfacción**. `config.yaml:2447` lo dice él mismo — «es alcance que la pregunta no contenía: hoy la envía Zoho al finalizar el ticket», y cruza con el correo propio. `config.yaml:2565` remata: las dos dependencias de F1F-05 «son piezas **sin fila hoy**».

**Conclusión, con el número delante:** las 33 filas conocidas caben en 10,9 semanas al ritmo que este proyecto ya demuestra. Lo que no cabe en ninguna cuenta es lo que **no está contado**: tres piezas —correo propio, repatriación del histórico y encuesta— que el criterio mete antes del corte, que dos de ellas son **condición de examen**, y que hoy no tienen fila, ni talla, ni dueño. Dos de las tres sólo viven en ficheros **sin trackear**, así que quien clone el repositorio no las ve.

**No las escribo yo**: no hay decisión que las respalde, y R-3 prohíbe inventar destino. Es lo primero que hay que decidir, y va en §ii de la entrega.

---

## D-ter · Calendario anterior, para contraste

### D.1 · Cuánto tiempo se pierde

| | R01.1 | R01.2 |
|---|---|---|
| Meta | 31/12/2026 | **lunes 14/12/2026** (plan B: 21/12) |
| Última semana útil completa | S52 (21/12) | **S50 (07/12–11/12)** |
| Margen declarado | S53 | **ninguno** |

El lunes de S51 **es** el 14/12, así que S51 ya no es semana de construcción: es el corte. Se pierden **S51, S52 y S53 = tres semanas** (dos con el plan B).

### D.2 · Cuánto trabajo se añade

Cuatro filas nuevas: F0-06 (S) + F1B-12 (S) + F1B-13 (S) + F1F-05 (S–M). **Denominador: de 52 a 56 tandas.**

Más alcance añadido a F1B-11, que la R01.1 ya marcaba como talla L y «se parte si no cabe en tres días» (`plan:266`).

### D.3 · La restricción que lo decide

`decision/e009b-lista-indicadores` (`config.yaml:2564`) lo dice con estas palabras: **«⚠️ EL CALENDARIO NO CUADRA, Y ES LO QUE HAY QUE MIRAR. La comprobación dura las cuatro semanas previas al corte: del 16/11 (S47) al 14/12.»**

O sea que **F1F-05 tiene que estar construida y midiendo en S47**, no en S50. La R01.1 sitúa toda la épica 1F en S50–S52 (`plan:259-261`). Eso adelanta 1F **tres semanas** sobre lo planificado, en el mismo movimiento en que se pierden tres semanas por el otro extremo.

### D.4 · Los números

- **Se pierden 3 semanas** por el corte (S51–S53).
- **Se añaden 4 filas** (3×S + 1×S–M ≈ 4–5 días de trabajo).
- **F1F-05 debe adelantarse 3 semanas** respecto de su épica, y con ella la parte de F1F-01 que le da datos que medir.
- **F1B-11 crece** con el registro de contrato y con el parche de IV-11.

**Hipótesis (no medida):** entre lo perdido y lo añadido, el desfase está en el orden de **cuatro a cinco semanas**. No lo he medido contra tallas reales porque las tallas del §5 son estimaciones, no medidas; decir una cifra exacta sería inventarla.

### D.5 · Qué se puede recortar — enumerado, **no decidido**

La R01.1 ya dejó escritas sus dos piezas recortables (`plan:266`), y las decisiones de este corte añaden una tercera:

1. **F1B-06 a un solo flujo.** Ya venía marcada como la pieza recortable «porque el 90 % de los tickets son de servicio técnico» (`plan:268`). Coste: F1A-03 sigue bloqueada, porque depende de que exista el estado «Verificación».
2. **F1D-08 (Horiba) a enero.** También ya marcada como diferible «sin afectar la paridad» (`plan:266`).
3. **Las tandas 1C fuera de la ruta crítica**, salvo **C2**, que la R01.1 exige antes de F1E porque el informe de salida necesita distinguir finalizado de anulado, y porque es quien libera la subOV al anular (`plan:268`).
4. **El plan B del 21/12** recupera una de las tres semanas perdidas, sin tocar alcance.

**No elijo entre ellas.** Es decisión de alcance de Gerencia, y el criterio que falta es cuál de las dos cosas pesa más: llegar al 14/12 con menos funcionalidad, o mover el corte al 21/12 con la funcionalidad entera.

---

## E · Avance con el denominador nuevo

| | |
|---|---|
| Denominador R01.1 | 52 tandas |
| **Denominador R01.2** | **56 tandas** (+F0-06, +F1B-12, +F1B-13, +F1F-05) |
| Cerradas, derivables de cabecera | **9** — F0-01, F0-02, F0-03, F0-05, F1A-06, F1A-07, F1A-08, F1B-02, F1B-10 |
| Avance sobre el proyecto entero | **9/56 = 16,1 %** (era 9/52 = 17,3 %) |
| **Avance sobre lo que entra antes del corte** | **9/42 = 21,4 %** |

Medido con `npm run reconcile` sobre `main` en `3f30710`, más las cuatro filas de §A. El denominador sube y el numerador no: **el avance baja 1,2 puntos sin que nadie haya deshecho trabajo.** Es aritmética de alcance nuevo, no un retroceso, y por eso las dos cifras se publican siempre juntas con el denominador fechado.

**Y desde el criterio del 24/09 hay que publicar TRES cifras, no dos**, porque el denominador se parte en dos poblaciones que no se mezclan:

- **9/56 (16,1 %)** — el proyecto entero, incluyendo lo que se va a 2027.
- **9/42 (21,4 %)** — lo que tiene que estar antes del 14/12. **Es la cifra que gobierna el riesgo**, porque es la única con fecha dura detrás.
- **0/14** — 1D y 1E, que salen del corte y no tienen fecha todavía más allá de «enero–febrero de 2027».

Publicar sólo la primera haría parecer que el proyecto va peor de lo que va contra su fecha real; publicar sólo la segunda escondería catorce filas de trabajo que siguen existiendo.

⚠️ **Y una advertencia sobre el numerador**, que la R01.1 no traía: el mapeo del 22/09 encontró que **F1B-01 y la mitad de tablero de F1B-08 están construidas y archivadas sin cabecera R-1 que las declare**, igual que F1A-01/02/04/09. `reconcile` no las cuenta. El avance real es mayor que 9/56, y no sé cuánto: medirlo exige retroajustar cabeceras, que es trabajo, no un barrido.
