# Desk 2.0 — Plan de fases y tandas · revisión R01.3

**Fecha:** 2026-09-24 · **Base:** R01.2 (`Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.2.md`, borrador) y R01.1 (618 líneas). Ninguna se borra.

**Qué corrige respecto de la R01.2.** La R01.2 se commiteó marcada borrador porque su calendario no contaba las épicas **1G** y **1H** ni la **encuesta**. Esta revisión las incorpora, aplica el criterio de corte afinado por Gerencia el 24/09 y **vuelve a hacer la cuenta**.

**Veredicto, por delante — cierre, tras la corrección y la aclaración de Gerencia del 24/09:** con 1G y 1H en la independencia de enero, **el corte operativo del 14/12 es viable con un margen de +1,9 a +2,2 semanas**, por encima de la semana que Gerencia exige. El plan A (01/02/2027) no se activa. La cuenta está en §D.6.

*La primera medición de esta misma revisión, con 1G y 1H dentro del corte, daba un **déficit de 3,6 a 5,6 semanas** (§D.4), y es la que motivó la corrección de `decision/fecha-corte`. Se conserva tal cual porque la corrección la cita.*

---

## A · Épicas nuevas 1G y 1H

Vienen de `docs/sdd/Plan_Independencia_Zoho_Desk_31-12-2026.md`, que **esta sesión acaba de trackear** (commit `c6be63d`). Hasta hoy se presentaba a sí mismo como decisión de Gerencia sin ratificación en ningún documento versionado — `R08.3_Expediente_de_cambios.md:327` lo registraba así —, y commitearlo es lo que lo ratifica.

### 1G · Repatriación del histórico

Objetivo: que ninguna pantalla de Desk 2.0 necesite llamar a Zoho para mostrar algo del pasado (`Plan_Independencia…md:65`).

| ID | Contenido | Gate | Talla |
|---|---|---|---|
| **1G-01** | Backfill completo de conversaciones sobre los 986 tickets, con verificación contra `commentCount` y `threadCount`. Cierra el punto 2 de `debt.md` | — | **M** |
| **1G-02** | Persistencia de adjuntos: descargar bytes al destino que decida **M1**, poblar `storage_path`, `/api/attachment` sirve de local y sólo cae a Zoho si falta. Cierra el punto 1 de `debt.md` | **M1** | **M** |
| **1G-03** | Verificación de completitud, entidad por entidad, Zoho contra PostgreSQL. **Es la prueba de que el corte se puede hacer**, y se repite el día del corte | 1G-01, 1G-02 | **M** |
| **1G-04** | Modo sin Zoho: interruptor que apaga toda salida hacia Zoho Desk. **Es la tanda que da la garantía** — sin ella la independencia es una afirmación | 1G-03 | **S** |

**1G no tiene gates de negocio y no compite con nada**, así que puede arrancar ya (`Plan_Independencia…md:120`).

### 1H · Correo propio (Subsistema D)

Objetivo: recibir y responder correo de clientes sin Zoho. El diseño existe desde el 05/06/2026 en `debt.md` §3g.

| ID | Contenido | Gate | Talla |
|---|---|---|---|
| **1H-00** | Decisiones de transporte: Gmail API sobre el buzón de Workspace, proyecto en Google Cloud, scopes, refresh token, identidad y firma, verificación DKIM/SPF/DMARC | **M2** | **S** |
| **1H-01** | Salida: responder al cliente desde el ticket con hilo correcto. Sustituye a `sendReply` de Zoho | 1H-00 | **L** |
| **1H-02** | Entrada: correo → ticket, con emparejamiento por `threadId`/`References`, deduplicación y anti-bucle | 1H-00 · **M2** | **L** → **M** si M2 sale favorable |
| **1H-03** | Corte del buzón, con periodo de solape en que ambos reciben y se comparan | 1H-01, 1H-02 | **M** |

**Elección de transporte ya razonada** (`Plan_Independencia…md:84`): Gmail API sobre n8n porque Google firma DKIM, no hay que tocar DNS, el `historyId` da sincronización incremental y el `threadId` da hilos nativos.

⚠️ **Una discrepancia en la fuente, que anoto sin resolverla:** `Plan_Independencia…md:109` dice que de las ocho tandas «**tres son L**», pero sus propias tablas (§3 y §4) marcan **dos**: 1H-01 y 1H-02. Uso las tablas, que son el detalle, y dejo la nota para que quien revise el documento decida cuál corrige.

### B · La encuesta de satisfacción

**No es fila propia: entra dentro de F1F-05** (continuidad de indicadores), como pidió Gerencia. Y **depende de la salida de correo de 1H**, porque enviar la encuesta al cliente es enviar correo.

`config.yaml:2522` ya lo había visto: «la encuesta de satisfacción es alcance que la pregunta no contenía: hoy la envía Zoho al finalizar el ticket», y cruza con la decisión de correo. Con 1H en el plan, ese cruce deja de ser un cabo suelto y pasa a ser una dependencia declarada: **F1F-05 no puede cerrar antes que 1H-01**.

---

## C · El criterio de corte afinado (Gerencia, 24/09)

| | Antes del 14/12 | Después del corte |
|---|---|---|
| **Qué** | Paridad con Zoho Desk **más independencia** | Lo que Zoho no tiene |
| **Épicas** | F0 (salvo F0-06) · 1A · 1B · **1G** · **1H** · 1F | **1C** · **1D** · **1E** · **F0-06** · mapa en la aplicación |
| **Piezas nombradas** | respaldo (F1F-02) · calendario laboral (F1B-12) · continuidad de indicadores y encuesta (F1F-05) · migración de tickets abiertos (F1F-01) · pruebas antes del corte (F1F-03) | correcciones 1C · diagnóstico guiado · módulo de informes · validación con firmas · vigilancias del repaso |

### C.1 · La excepción de 1C: una se queda dentro

Gerencia pidió decirlo si alguna corrección de 1C es necesaria para la paridad. **Hay una clara:**

> **La restricción de «Liberación sin factura» por cargo.** Zoho la tenía, y Desk 2.0 hoy no: `decision/anexo-33-checkbox` (`config.yaml:2364-2379`) decide que deja de ser un checkbox y que **sólo la ejecuta el Director Comercial**. Si sale del corte, Desk 2.0 arranca permitiendo liberar sin factura a quien Zoho no se lo permitía — y eso es perder paridad, no aplazar una mejora. **Se queda dentro**, junto con la parte de `decision/c10-permisos-cargo` que la sostiene.

**Las otras siete de 1C no las clasifico, y la razón es que existe el instrumento y no se ha usado.** **M3** es literalmente la medida que responde «¿qué se usa de Zoho Desk que no esté en Desk 2.0?» (`Plan_Independencia…md:57-59`), y su lista de sospechosos —vistas personalizadas, plantillas de respuesta y firmas, macros, etiquetas, encuesta, informes nativos y el SLA propio de Zoho— es exactamente el material del que sale la frontera paridad/no-paridad. Clasificarlas a ojo antes de M3 sería inventar la respuesta que M3 va a dar en media hora.

### C.2 · Cómo queda el criterio tras la corrección y la aclaración (24/09)

La tabla de arriba es la que se midió en §D.4 y se conserva. Gerencia la corrigió el mismo día (`decision/fecha-corte` → `corregida_por`) y luego aclaró esa corrección (`decision/fecha-corte` → `aclarada_por`). Queda así:

| | Antes del 14/12 (corte operativo) | Enero de 2027 (independencia total) | Después del corte, sin fecha |
|---|---|---|---|
| **Épicas** | F0 (salvo F0-06) · 1A · 1B · 1F · la 1C de paridad (§C.1) · **Alta y edición del equipo** | **1G** · **1H** | 1C (las otras siete) · 1D · 1E · F0-06 · **Mapa del blueprint en la aplicación** |
| **Examen del 9/12** | **Dos** condiciones: crear y mover tickets en Desk 2.0, y pruebas con servicios reales superadas | El correo sin Zoho y el histórico completo verificado, que salen del examen | — |
| **Entre el 14/12 y enero** | — | El histórico se consulta en Zoho Desk **en solo lectura**. Las respuestas salen del **correo corporativo** y se registran en el ticket. No se escribe en Zoho (`p44-escritura-zoho` sigue intacta) | — |

`mapa-antes-o-despues-del-corte` queda decidido: **después del corte**. El «va antes de F1B-06» de `decision/mapa-en-la-app` queda sin efecto.

---

## D · La cuenta, y por qué el 14/12 no es viable

### D.1 · Filas

| | |
|---|---|
| R01.2 | 56 |
| +1G, +1H | **+8** |
| **Total R01.3** | **64** |
| Salen del corte (1D 9 · 1E 5 · 1C 7 · F0-06 1) | **−22** |
| **Antes del corte** | **42** |
| Cerradas | **−9** |
| **Pendientes antes del corte** | **33** |

### D.2 · Tiempo disponible, medido

Del **24/09 al 14/12**: 81 días = **11,6 semanas**. Hasta el **examen del miércoles 9/12** que fija `decision/fecha-corte` (`config.yaml:2170`): 76 días = **10,9 semanas**. La migración es el fin de semana **12–13/12**, sin copia donde ensayarla.

**El tiempo de construcción real son 10,9 semanas.**

### D.3 · Trabajo pendiente, ponderado por talla

**Hipótesis declarada:** las tallas del §5 son estimaciones de Gerencia, no medidas. Convierto con XS ≈ 0,5 d · S ≈ 1 d · M ≈ 2,5 d · L ≈ 4,5 d, y 5 días por semana. El resultado es un orden de magnitud, no una cifra exacta.

| Bloque | Días | Semanas |
|---|---|---|
| **1G + 1H** — cifra de la propia fuente (`Plan_Independencia…md:109`), no mía | — | **5 a 7** |
| 1B pendiente (F1B-03 L, -04 L, -05 M, -06 L, -07 S, -08 media M, -09 S, -11 L, -12 S, -13 S, resto de -01) | ~28 | ~5,6 |
| 1F (F1F-01 M, -02 M, -03, -04, -05 con encuesta) | ~12,5 | ~2,5 |
| F1A-03 + la 1C de paridad | ~2 | ~0,4 |
| **Total** | | **13,5 a 15,5 semanas** |

### D.4 · El veredicto, con el número delante

```
Disponible:   10,9 semanas (24/09 → examen del 9/12)
Necesario:    13,5 a 15,5 semanas
DÉFICIT:       2,6 a 4,6 semanas
Margen exigido por Gerencia: +1 semana
FALTAN:        3,6 a 5,6 semanas
```

**El corte del 14/12 NO es viable.** Y no lo es tampoco en el mejor caso: el propio plan de independencia dice que las medidas «pueden encoger 1H entre una y dos semanas y 1G casi por completo» (`:118`). Aun concediendo el recorte máximo —1G casi a cero y 1H dos semanas menos, que son **4 a 5 semanas ganadas**—, el resultado queda entre **8,5 y 11,5 semanas** contra 10,9 disponibles: **en el mejor caso se empata, no se gana margen.** La semana que Gerencia exige no aparece en ningún escenario.

### D.5 · Contraste con el ritmo observado

Del 09/09 al 23/09 se archivaron **13 cambios**, de los que **6 cerraron fila de plan** — **3,0 filas por semana** sostenidas. Las 33 filas pendientes a ese ritmo son **11 semanas**, ya por encima de las 10,9 disponibles **incluso sin ponderar por talla**. La ponderación no cambia el signo: lo empeora, porque 1G y 1H traen dos L y cinco M, más pesadas que las correcciones 1C que salieron.

**No recorto más.** El criterio de Gerencia ya eligió qué sale, y volver a recortar sería decidir por encima de él.

### D.6 · Cierre: la cuenta con la corrección y la aclaración

**Filas.** Las dos decisiones del 24/09 sobre el equipo van en **una** sola fila, y el mapa en otra:

| | |
|---|---|
| Total R01.3 inicial (§D.1) | 64 |
| + «Alta y edición del equipo» (S–M) | +1 |
| + «Mapa del blueprint en la aplicación» (XS–S por medir) | +1 |
| **Total** | **66** |
| Salen del corte, sin fecha (1D 9 · 1E 5 · 1C 7 · F0-06 1 · mapa 1) | −23 |
| Pasan a enero (1G 4 · 1H 4) | −8 |
| **Antes del corte** | **35** |
| Cerradas | −9 |
| **Pendientes antes del corte** | **26** |

**Trabajo pendiente antes del corte.** Con la misma conversión de §D.3, que sigue siendo una hipótesis:

| Bloque | Semanas |
|---|---|
| 1B pendiente (§D.3) | ~5,6 |
| 1F (§D.3, encuesta incluida) | ~2,5 |
| F1A-03 + la 1C de paridad (§D.3) | ~0,4 |
| «Alta y edición del equipo», S–M (1 a 2,5 días) | 0,2 a 0,5 |
| **Total** | **8,7 a 9,0** |

```
Disponible:   10,9 semanas (24/09 → examen del 9/12)
Necesario:     8,7 a 9,0 semanas
MARGEN:       +1,9 a +2,2 semanas
Margen exigido por Gerencia: +1 semana  →  SE CUMPLE, con 0,9 a 1,2 de holgura
```

**El corte operativo del 14/12 es viable, y el plan A no se activa.** Si se cuentan filas en lugar de tallas, el resultado es el mismo: las 26 pendientes al ritmo de §D.5 (3,0 por semana) son **8,7 semanas**.

**Lo que esta cuenta no cubre, y puede comerse la holgura:**

1. **La encuesta de satisfacción.** Va dentro de F1F-05 (§B) y depende de la salida de correo de 1H-01, que ahora está en enero. Hoy la envía Zoho, que desde el 14/12 queda en solo lectura, y nada dice cómo sale entre el corte y la independencia. La he dejado contada dentro de 1F, que es lo prudente. Devuelto como pregunta: `encuesta-entre-corte-e-independencia`.
2. **«Se registran en el ticket».** *Hipótesis:* registrar a mano en el ticket las respuestas enviadas desde el correo corporativo cabe en lo que la aplicación ya tiene. No está medido. Si resulta que hace falta una fila S, resta 0,2 semanas.
3. **Las licencias entre el 14/12 y enero.** La decisión original fijaba el 21/12 como tope por la renovación de las licencias de Zoho. Con la corrección, Zoho **se sigue consultando** hasta enero, así que la pregunta `corte-licencias-plan-a` no afecta solo al plan A: **afecta también al plan principal**. Lo señalo y no lo resuelvo.
4. **Enero depende de empezar antes.** 1G y 1H suman de 5 a 7 semanas (§D.3). Si nada de eso arranca antes del 14/12, la independencia no llega en enero sino entre finales de enero y febrero. La holgura de 0,9 a 1,2 semanas es lo único que puede adelantarlas, y M1, M2 y M3 (§F) son lo que puede encogerlas. Por eso siguen siendo la primera tarea.

---

## E · Avance con el denominador R01.3

Cifras de cierre, con las dos filas nuevas y el criterio de §C.2. Entre paréntesis, las de la primera medición:

| | |
|---|---|
| Denominador | **66 tandas** (64) |
| Cerradas | **9** |
| Avance sobre el proyecto | **9/66 = 13,6 %** (9/64 = 14,1 %) |
| **Avance sobre lo que entra antes del corte** | **9/35 = 25,7 %** (9/42 = 21,4 %) |
| Independencia de enero (1G, 1H) | **0/8** |
| Fuera del corte, sin fecha | **0/23** (0/22) |

⚠️ **El numerador está infravalorado y sé que lo está.** El mapeo del 22/09 encontró que **F1A-01, F1A-02, F1A-04, F1A-05, F1A-09, F1B-01 y la mitad de tablero de F1B-08 están construidas y archivadas sin cabecera R-1**, así que `reconcile` no las cuenta. El avance real es mayor que 9/64; cuánto, no lo sé, y medirlo exige retroajustar cabeceras — que es trabajo, no un barrido. **Esto afecta al veredicto de §D sólo en un sentido: el trabajo pendiente puede ser algo menor del que he contado**, porque alguna de las 33 —26 en el cierre de §D.6— podría estar hecha. No lo he descontado porque no está medido.

---

## F · Primera tarea de persona: M1, M2 y M3

**Van las primeras porque pueden encoger 1H y casi eliminar 1G**, y hasta que se tomen «cualquier fecha que pongamos es una opinión» (`Plan_Independencia…md:39`). Ninguna necesita desarrollo.

| Medida | Qué | Cómo | Qué decide |
|---|---|---|---|
| **M1** | ¿Cuánto pesan los adjuntos? | `GET /api/admin/measure-attachments` como super administrador. Recorre los 986 tickets y devuelve cantidad y `totalHuman` **sin descargar nada**. Dos minutos | El destino de 1G-02: disco de EasyPanel si son pocos GB, MinIO o S3 si son decenas, `bytea` sólo si son cientos de MB |
| **M2** | ¿Cómo nacen los tickets de verdad? | Mirar en el panel de Zoho si hay canal de correo activo sobre `soporte@`/`servicio@`, y contar los tickets de 2026 con `threadCount > 0` frente a los que sólo tienen comentarios | **La que más puede encoger el trabajo.** Si los tickets se crean a mano, la mitad entrante del Subsistema D desaparece y 1H-02 baja de L a M. «Es la diferencia entre dos tandas y cuatro» |
| **M3** | ¿Qué se usa de Zoho que no esté en Desk 2.0? | Media hora con quien trabaja a diario en Zoho. Sospechosos: vistas personalizadas, plantillas y firmas, macros, etiquetas, encuesta, informes nativos, SLA propio | «Cada una que se use es una tanda; cada una que no, es alcance que se cierra». **Y es el instrumento que clasifica las siete correcciones 1C** que §C.1 deja sin clasificar |

**Hipótesis de la fuente sobre M1**, que conviene ver confirmada o desmentida: los adjuntos «serán pocos», porque el campo «Documentacion Almacenada en el Drive?» existe precisamente porque los informes de servicio —lo pesado— viven en Drive y no como adjuntos de Zoho (`Plan_Independencia…md:45`).

**Hipótesis de la fuente sobre M2:** los tres tickets más recientes (984, 985, 986) traen `channel: "Email"` pero **los creó un agente**: `createdBy` apunta a personas, la descripción viene vacía o escrita a mano, y dos de los tres tienen cero hilos de correo (`:51`).

---

## G · Catálogo de filas

Esta R01.3 no trae un §5 propio (es el plan vigente heredado de la R01.2, sin esa sección escrita).
Las tandas nuevas cuyo contenido decide Gerencia se registran aquí, al final, para no desplazar
ninguna cita de las secciones A-F (F0-05, R-1: «todo trabajo que realiza el contenido de una fila del
§5 lleva su ID»).

| ID | Capacidad | Talla | Contenido | Decisión de Gerencia |
|---|---|---|---|---|
| F1B-12 | `calendario-laboral` | S | Jornada L-V 8-17h, festivos de Colombia calculados por año, cierres de empresa inyectados, y la función única de horas/días hábiles (`decision/calendario-habil`) | `openspec/config.yaml:2534-2535` |
| F1B-14 | `tickets-core` · `hojas-vida` | S–M | «Alta y edición del equipo»: alta del equipo en el mismo paso que el ticket de «Equipo nuevo», con reutilización del equipo si el serial ya existe (`decision/equipo-nuevo-alta-en-ticket`); restricción por área de fecha de factura, fin de garantía y mantenedor, registro de cambios de los seis campos y botón «Editar» en la hoja de vida (`decision/edicion-datos-comerciales-equipo`). Se entrega en dos cambios SDD: `alta-equipo-nuevo-en-ticket` (`cierra: no`) y `edicion-comercial-equipo` (`cierra: si`). ID asignado como supuesto de nomenclatura (modo producción, reversible): siguiente libre tras F1B-13 | `openspec/config.yaml:2758-2773` · `openspec/config.yaml:2775-2790` |

**Nota:** el paso de `'Notificado'` de 24 h de reloj a 9 h hábiles (`SLA_HORAS_POR_ESTADO`, `sla.ts:34`)
**no** va en F1B-12 — va en la misma tanda que construye la alerta de 4 días hábiles de
`decision/anexo-3-alerta`, para que las tres alarmas pasen a horas hábiles juntas. Supuesto aplicado
(modo producción, reversible): esa tanda es **F1B-08**, porque `anexo-3-alerta` declara
`tanda_que_abre: "F1A-02 · F1B-08"` (`config.yaml:2329`) y F1A-02 está cerrada (`proposal.md`,
pregunta 2 de `calendario-laboral`).
