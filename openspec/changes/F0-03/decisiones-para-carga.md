# F0-03 · Las decisiones que van a Engram, listadas antes de cargar nada

**Estado: lista para revisión. No se ha cargado ninguna observación.**

Fuente: `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.1.md`, apartado **§1.8
«Decisiones estructurales ya tomadas»**, líneas **734–870**.

## Cómo se extrajo, y por qué la cifra es fiable

La tabla del §1.8 llega del `.docx` **aplanada en tripletes**: una línea por celda, en el orden
decisión → fecha → implicación. La cabecera ocupa `:736-738` y las filas van de `:739` a `:870`.

```
awk 'NR>=739 && NR<=870 { i=(NR-739)%3
  if(i==0){n++; ln=NR; dec=$0} else if(i==1){fec=$0}
  else {printf "%d\t%d\t%s\t%s\n", n, ln, fec, dec} }' R08.1.md
```

- Líneas de tabla: `870 − 739 + 1` = **132**
- Filas: `132 / 3` = **44**, con **resto 0** — el triplete cierra exacto en las 132 líneas, así que no
  hay celda partida ni fila coja. Es la comprobación estructural, no un recuento a ojo.
- El reparto por fecha suma 44: `21/08` 10 · `27/08` 9 · `14/08` 9 · `20/08` 5 · `Código (R04)` 3 ·
  `As-is (R05)` 3 · `19/02` 2 · `17/02` 2 · `17/02 y 19/02` 1.

**De las 44, se cargan 43.** La número 17 (`:787`) lleva escrito dentro de la propia celda de decisión
`[EN EVALUACIÓN — R08] No es una decisión cerrada`, y el plan pide las **cerradas** (`:125`). Es la
única de las 44 con marca de estado: `awk` sobre la columna de decisión buscando `[` devuelve esa y
sólo esa.

## Las 44, con su línea y la clave propuesta

`P` = propuesta de carga. **✅** se carga · **⛔** no se carga, con motivo.

| # | Línea | Fecha | Decisión | `topic_key` propuesto | P |
|---|---|---|---|---|---|
| 1 | `:739` | 14/08/2026 | La plataforma se construye sobre base de datos propia en PostgreSQL; la conexión con Zoho será de solo lectura. | `decision/postgres-propio-zoho-solo-lectura` | ✅ |
| 2 | `:742` | 14/08/2026 | Se elimina la nomenclatura CG/MT. El identificador del ticket pasa a basarse en el número de serie, asociado a cliente, modelo y fecha. | `decision/identificador-por-serial` | ✅ |
| 3 | `:745` | 14/08/2026 | El número de serie es obligatorio en la creación de la remisión. | `decision/serial-obligatorio-en-remision` | ✅ |
| 4 | `:748` | 14/08/2026 | El blueprint se dispara con un desplegable inicial (Equipo Nuevo / Servicio / Soporte Remoto) que oculta pasos innecesarios. | `decision/desplegable-inicial-de-rama` | ✅ |
| 5 | `:751` | 14/08/2026 | La inspección técnica se diseña por fases lógicas secuenciales de macro a micro, estandarizadas para todos los equipos. | `decision/inspeccion-macro-a-micro` | ✅ |
| 6 | `:754` | 14/08/2026 | La priorización es automática según criterios comerciales; se bloquea la edición manual por el técnico. | `decision/prioridad-automatica` | ✅ |
| 7 | `:757` | 14/08/2026 | El sistema formaliza el traspaso de tickets entre agentes al cambiar de fase. | `decision/traspaso-formal-entre-agentes` | ✅ |
| 8 | `:760` | 14/08/2026 | Se inician pruebas piloto de «aprobación en un clic» con clientes con contrato de mantenimiento activo. | `decision/piloto-aprobacion-un-clic` | ✅ |
| 9 | `:763` | 14/08/2026 | Miguel y Julián se reorientan de programar la herramienta a digitalizar el conocimiento técnico. | `decision/equipo-tecnico-genera-conocimiento` | ✅ |
| 10 | `:766` | 20/08/2026 | Los equipos nuevos los da de alta el área Comercial/Administrativa en cuanto se conocen los seriales, con cliente y fecha de factura. | `decision/alta-anticipada-de-equipos` | ✅ |
| 11 | `:769` | 20/08/2026 | Se mantiene la codificación interna actual (serial + modelo) por trazabilidad ISO 9001. | `decision/codificacion-interna-iso-9001` | ✅ |
| 12 | `:772` | 20/08/2026 | Se restringen permisos y vistas por rol. | `decision/permisos-y-vistas-por-rol` | ✅ |
| 13 | `:775` | 20/08/2026 | Las transiciones clave alimentan automáticamente la hoja de vida del equipo. | `decision/hoja-de-vida-desde-transiciones` | ✅ |
| 14 | `:778` | 20/08/2026 | Se usa el artefacto de auditoría de blueprints generado con IA como herramienta de mejora continua. | `decision/auditoria-de-blueprint-continua` | ✅ |
| 15 | `:781` | 21/08/2026 | La interfaz inicial de Desk 2.0 replicará la estructura de Zoho Desk, con blueprints mucho más controlados y completos. | `decision/interfaz-replica-zoho-desk` | ✅ |
| 16 | `:784` | 21/08/2026 | El disparador del flujo será un menú inicial que define la rama de trabajo. | `decision/menu-inicial-define-la-rama` | ✅ |
| **17** | `:787` | 21/08/2026 | Comercial debe crear la orden de venta antes de que Servicio Técnico reciba el equipo. **`[EN EVALUACIÓN — R08] No es una decisión cerrada`** | — | **⛔** **No cerrada**, y el plan pide las cerradas. Es el punto abierto **P21** (plan `:152`) |
| 18 | `:790` | 21/08/2026 | Se usa el modelo Grimm EDM 180/280 como proyecto piloto para modelar las fases de diagnóstico. | `decision/grimm-edm180-como-piloto` | ✅ |
| 19 | `:793` | 21/08/2026 | El orden de construcción es ① automatización → ② análisis → ③ interacción con clientes, siendo los tres de importancia prácticamente equivalente. | `decision/orden-de-los-tres-ejes` | ✅ |
| 20 | `:796` | 21/08/2026 | La capa de conocimiento se divide en dos bases: KBI (interna, Ambientalia) y KB Externa (clientes). | `decision/dos-bases-de-conocimiento` | ✅ |
| 21 | `:799` | 21/08/2026 | El agente conversacional atiende al cliente únicamente en temas técnicos, sobre la KB Externa. | `decision/agente-solo-temas-tecnicos` | ✅ |
| 22 | `:802` | 21/08/2026 | El área de cliente se estructura en dos niveles: básica (hojas de vida y aprobación de cotizaciones) para clientes sin contrato, y completa (+ KB Externa) para clientes con contrato. | `decision/portal-en-dos-niveles` | ✅ |
| 23 | `:805` | 21/08/2026 | Ambientalia puede redistribuir firmware y software de los fabricantes únicamente a clientes registrados. | `decision/firmware-solo-a-registrados` | ✅ |
| 24 | `:808` | 21/08/2026 | El agendamiento de citas se apoya en el cálculo de carga del taller, mostrando disponibilidad real al cliente. | `decision/citas-sobre-carga-del-taller` | ✅ |
| 25 | `:811` | 17/02/2026 | Se simplifican los tipos de evento: los tres «operativos» se fusionan en Operativo. | `decision/tipos-de-evento-simplificados` | ✅ |
| 26 | `:814` | 17/02/2026 | En «Habilitar servicio» se usa un checkbox «Cumple condiciones comerciales». | `decision/checkbox-condiciones-comerciales` | ✅ |
| 27 | `:817` | 17/02 y 19/02 | El mapeo se documenta as-is antes de rediseñar rutas abreviadas. | `decision/as-is-antes-de-rediseñar` | ✅ |
| 28 | `:820` | 19/02/2026 | Se usa la base de costos e historial de reparaciones como argumento comercial. | `decision/historial-como-argumento-comercial` | ✅ |
| 29 | `:823` | 19/02/2026 | El listado de 78 puntos de control del diagnóstico Grimm evoluciona a árbol de decisiones. | `decision/checklist-a-arbol-de-decisiones` | ✅ |
| 30 | `:826` | Código (R04) | La derivación no puede frenar un ticket: la casilla «Derivado a» existe en las 34 transiciones y ninguna la exige. | `decision/derivacion-nunca-obligatoria` | ✅ |
| 31 | `:829` | Código (R04) | Las etapas que proponen destinatario nombran un cargo, no una persona. | `decision/derivacion-propone-cargo` | ✅ |
| 32 | `:832` | As-is (R05) | La columna Clasificaciones es el campo que dispara las ramas del blueprint. Ya existe en Zoho. | `decision/clasificaciones-dispara-la-rama` | ✅ |
| 33 | `:835` | As-is (R05) | El Tiempo promesa lo fija Servicio Técnico al escalar el diagnóstico a revisión, y es campo obligatorio. | `decision/tiempo-promesa-lo-fija-st` | ✅ |
| 34 | `:838` | As-is (R05) | La prioridad del ticket está atada a la calificación del cliente (High para contratos y clientes con análisis favorable, Low para desfavorable). | `decision/prioridad-por-calificacion-de-cliente` | ✅ |
| 35 | `:841` | 27/08/2026 | Se frena el desarrollo hasta consensuar el documento maestro, y después se trocea el proyecto por fases y prioridades. | `decision/maestro-antes-que-desarrollo` | ✅ |
| 36 | `:844` | 27/08/2026 | Arquitectura híbrida del diagnóstico: las macro-fases son transiciones de estado; dentro de cada una, un checklist dinámico parametrizado por marca y modelo. | `decision/diagnostico-hibrido` | ✅ |
| 37 | `:847` | 27/08/2026 | Una orden de venta puede subdividirse en subórdenes (OV-XXX_1, _2…), con un ticket por subservicio. | `decision/subordenes-de-venta` | ✅ |
| 38 | `:850` | 27/08/2026 | El código interno del cliente entra como identificador secundario de búsqueda; el serial sigue siendo el primario. | `decision/codigo-interno-como-secundario` | ✅ |
| 39 | `:853` | 27/08/2026 | El aplicativo sustituye carpetas y archivos por captura en base de datos, con entregables generados por plantilla. | `decision/base-de-datos-en-vez-de-carpetas` | ✅ |
| 40 | `:856` | 27/08/2026 | El protocolo se extiende a informe de salida para todo tipo de servicio, con evidencia fotográfica. | `decision/informe-de-salida-siempre` | ✅ |
| 41 | `:859` | 27/08/2026 | La seguridad y el portal de cliente pasan a etapa independiente, posterior a la versión interna. | `decision/portal-en-etapa-posterior` | ✅ |
| 42 | `:862` | 27/08/2026 | Se conserva una vía de escape manual para el cambio de estado en casos especiales. | `decision/via-de-escape-manual` | ✅ |
| 43 | `:865` | 27/08/2026 | El QR del certificado, el cálculo de incertidumbre y las etapas de validación con firma entran como requisitos, en fase posterior. | `decision/qr-incertidumbre-y-firmas` | ✅ |
| 44 | `:868` | Código (R04) | Las dos entradas del flujo no se cruzan, para no sacar del sincronismo un ticket venido de Zoho. | `decision/dos-entradas-no-se-cruzan` | ✅ |

**Total: 44 filas · 43 para cargar · 1 excluida (la 17).**

## Lo que cada observación llevará en el cuerpo

Formato fijo, para que las 43 se lean igual:

```
**Decisión**: [el texto literal de la celda del maestro]
**Fecha**: [la celda de fecha, tal cual — incluidas «Código (R04)» y «As-is (R05)»]
**Implicación**: [la tercera celda, literal]
**Fuente**: R08.1.md:NNN (§1.8, «Decisiones estructurales ya tomadas»)
**Estado en el código**: [sólo si una spec de F0-02 la verificó; con ruta y línea. Si no, se omite]
```

El campo **Fuente** es obligatorio y es la aplicación de la regla de método a la memoria: sin la línea,
la observación sería el resumen de segunda mano que ya costó cuatro afirmaciones falsas en R01/R02.

El campo **Estado en el código** sólo se rellena cuando F0-02 lo verificó, y es la razón por la que
esta carga vale más ahora que hace un mes: una decisión de agosto acompañada de lo que el código hace
hoy con ella es otra cosa que la decisión sola.

**Las siete que siguen están verificadas y son las que van con ese campo desde el primer día.** No se
afirma cuántas más lo tendrán: el resto se comprueba una a una al cargar, y la que no se pueda
verificar contra el código se carga **sin** ese campo antes que con una hipótesis dentro.

| # | Decisión | Lo que F0-02 verificó |
|---|---|---|
| 2 | Se elimina la nomenclatura CG/MT | **Superada por la R08.** Los cinco prefijos siguen (`packages/shared/src/ticketCreate.ts:1`) y se **derivan** (`:47-49`). `tickets-core` M-3 |
| 3 | Serial obligatorio en la remisión | Cumplida por otra vía: el serial sale del equipo del catálogo, no se teclea (`apps/desk/server/services/ticketService.ts:64-66`). `tickets-core` RQ-TC-04 |
| 4 | Desplegable inicial de rama | **Construida a medias.** Las tres clasificaciones se ofrecen y sólo una tiene grafo (`ticketCreate.ts:5`). `tickets-core` §4.3, destino F1B-06 |
| 12 | Permisos y vistas por rol | Construida y **probada** en el servidor (`apps/desk/server/permisos.test.ts:41-110`). Es lo que cerró IV-3 |
| 30 | Derivación nunca obligatoria | Exacta: `required: false` en las 34 (`packages/shared/src/transitions.ts:95-97`). `derivacion-avisos` RQ-AV-01 |
| 31 | Las etapas proponen un cargo | Exacta, y son **tres** (`transitions.ts:267-276`). `derivacion-avisos` RQ-AV-02 |
| 44 | Las dos entradas no se cruzan | Exacta, en un solo sitio (`apps/desk/server/db/estadoPorRemision.ts:41`). `transitions-st` RQ-TS-02 |

---

# Clase (b) · Las decisiones de la sesión del 03/09 — 12

Fuente: `docs/Manifesto/Desk2.0_Acta_Sesion_2026-09-03.md`, **parte III** (`:268-480`), exportada de
Notion en el commit `da084e9`.

## La trampa del fichero, y por qué esta lista sólo mira la parte III

El fichero tiene **dos partes que no son lo mismo**:

| Parte | Líneas | Qué es |
|---|---|---|
| I y II | `:26-267` | **La convocatoria.** Orden del día con casillas, preparado **antes** de la sesión |
| III | `:268-480` | **El acta.** Lo que ocurrió |

Sólo la parte III registra decisiones. **Las 45 casillas de la convocatoria no son decisiones**, ni
siquiera las marcadas: son temas que alguien quiso llevar a la mesa. Verificado por comando —
`grep -cE '^- \[[ x]\]'` da **45**, de las que `^- \[x\]` son **3** y `^- \[ \]` son **42**—, y las 45
están en las partes I y II: ninguna aparece a partir de `:268`.

## De dónde sale el 12

Siete bloques `**Decisiones tomadas:**` en la parte III, con sus viñetas:

```
awk '/^\*\*Decisiones tomadas:\*\*/{en=1;next} en&&/^- /{t++} en&&(/^\*\*/||/^## /){en=0} END{print t}' acta.md
→ 12
```

| Bloque | Tema | Decisiones |
|---|---|---|
| `:311` | 1 · Informes de gestión y alcance del indicador | 1 |
| `:329` | 2 · Fases del servicio y niveles macro | 1 |
| `:348` | 3 · Tabla de puntos de control Grimm/Horiba | 2 |
| `:380` | 5 · Base de conocimiento | 1 |
| `:400` | 6 · Módulo de informes en la Fase 1 | 4 |
| `:422` | 7 · Identificación en recepción (QR/NFC) | 1 |
| `:439` | 8 · Método de trabajo y pendientes | 2 |
| | **Total** | **12** |

**El tema 4 no aparece en esa tabla, y no es un olvido.** «Criterios de falla y encadenamiento del
diagnóstico» (`:359-370`) es el único de los ocho temas tratados que **no deja decisión**: sólo una
tarea (`:368-370`). Y es el que Gerencia señaló como «el punto más crítico por resolver, ya que de
ello depende que la estructura funcione como diagrama de flujo y no como simple listado» (`:366`).
Ocho temas, siete bloques de decisión.

## Las 12, con su línea y la clave propuesta

| # | Línea | Tema | Decisión | `topic_key` propuesto | P |
|---|---|---|---|---|---|
| 45 | `:313` | 1 | Mantener el indicador `[ARPIN — verificar]` dentro del informe, pese a la discusión previa sobre su retiro. | `decision/indicador-arpin-se-mantiene` | ✅ |
| 46 | `:331` | 2 | Adoptar una única estructura jerárquica: **fase → nivel macro → subnivel → ítem**, sin duplicar tablas. | `decision/jerarquia-fase-macro-subnivel-item` | ✅ |
| 47 | `:350` | 3 | Consolidar en una sola tabla de puntos de control para Grimm y Horiba, eliminando la separación entre tabla de inspección y tabla interna. | `decision/tabla-unica-de-puntos-de-control` | ✅ |
| 48 | `:351` | 3 | Validar por nivel macro y desplegar subniveles e ítems únicamente cuando el nivel macro resulte «no OK». | `decision/validacion-por-nivel-macro` | ✅ |
| 49 | `:382` | 5 | El nuevo sistema alimentará la base de conocimiento y permitirá documentar fallas y soluciones no catalogadas mediante un formulario condicional dentro del flujo de servicio. | `decision/formulario-de-falla-nueva` | ✅ |
| 50 | `:402` | 6 | **Incluir el módulo de informes en la Fase 1 del desarrollo.** | `decision/informes-en-fase-1` | ✅ |
| 51 | `:403` | 6 | En Fase 1, alimentar el informe con comentarios escritos; los comentarios predefinidos se abordan en Fase 2, una vez acumulado volumen de datos. | `decision/informe-con-campos-abiertos` | ✅ |
| 52 | `:404` | 6 | Aplazar el dictado por voz para no comprometer el avance del resto del desarrollo. | `decision/dictado-por-voz-aplazado` | ✅ |
| 53 | `:405` | 6 | Resolver la traducción de la nomenclatura oficial de repuestos mediante el comentario predefinido, sin crear un diccionario independiente. | `decision/nomenclatura-por-comentario` | ✅ |
| 54 | `:424` | 7 | Mantener el código QR en los certificados de calibración y explorar la etiqueta NFC para la identificación de equipos en recepción. | `decision/qr-en-certificados-nfc-en-recepcion` | ✅ |
| 55 | `:441` | 8 | Priorizar la revisión y el comentario sobre material generado por IA frente a la redacción desde cero, reservando el criterio técnico para validar y señalar huecos. | `decision/revisar-ia-en-vez-de-redactar` | ✅ |
| 56 | `:442` | 8 | Trasladar la siguiente sesión al **viernes 11/09/2026**. | `decision/siguiente-sesion-11-09` | ✅ |

**Total clase (b): 12 filas · 12 para cargar · 0 excluidas.**

## Dos de las 12 tocan lo que F0-02 ya escribió

| # | Decisión | Contra qué choca o confirma |
|---|---|---|
| 50 | Informes en la Fase 1 | **Confirma** F1E completa (plan `:201-205`). El maestro la trataba como decisión de alcance pendiente; ya no lo es |
| 54 | QR en certificados, NFC en recepción | **Matiza** la entrada §4.4 de `openspec/specs/tickets-core/spec.md`, que registra «la identificación física por QR no existe» con destino *sin tanda asignada* y cita M1.1 (`R08.1.md:1049`). El acta la **reorienta**: el QR se queda en los certificados y la identificación en recepción pasa a explorar **NFC**, con tarea asignada a Gustavo (`acta:428`, plan de acción nº 10 en `:478`). La entrada de la spec sigue siendo cierta —el QR no existe en el código— pero su destino ya no es «sin asignar» |

Al cargar la 54 se anotará ese cruce en el campo **Estado en el código**, con la ruta de la spec.

---

# Clase (c) · Casillas de la convocatoria **SIN** respaldo en el acta — 2. **No se cargan**

De las **3** casillas marcadas `[x]` en la convocatoria, sólo **una** tiene decisión en el acta. Las
otras dos se listan aquí, y se listan **precisamente para no cargarlas**: una casilla marcada dice que
alguien quiso tratar el tema, no que se decidiera. Cargarla como `decision/*` sería crear autoridad
desde una casilla.

| Línea | Casilla marcada `[x]` | ¿La respalda el acta? | Qué se hace |
|---|---|---|---|
| `:170` | **¿Entra el módulo de informes en la Fase 1?** | **Sí** — decisión en `:402` | Se carga como la **#50** de la clase (b) |
| `:173` | **P10** — procedimiento de validación de informes antes de su emisión, con carga automática de la firma por etapa | **No.** Se *discutió*: `:397`, «se planteó la necesidad de una etapa de revisión con dos personas, lo que conecta directamente con la definición de roles del sistema». Pero está en **«Resumen de la discusión»**, no en ningún bloque `Decisiones tomadas:` | **No se carga.** Vuelve al Anexo D |
| `:121` | **P62** — qué se hace con la capa as-built | **No, y ni siquiera se trató.** `awk` sobre la parte III entera buscando `P62`, `as-built`, `capa as` y `Anexo H` no devuelve **ninguna** línea | **No se carga.** Vuelve al Anexo D |

## Lo que dice la regla de la sesión sobre estas dos

No hace falta interpretar: la propia convocatoria lo escribe (`:114-116`).

> «**Regla de la sesión.** Cada bloque sale con una de dos cosas: una decisión escrita, o un
> responsable con una fecha. Lo que no salga con ninguna de las dos **vuelve al Anexo D y bloquea la
> construcción del módulo al que pertenece**.»

Ninguna de las dos salió con decisión ni con responsable. Las dos vuelven al Anexo D, y **bloquean**:

- **P10** bloquea la validación del informe antes de emitir, que es **F1E-04** (plan `:204`). El plan
  ya lo tenía como gate: `decision/roles-validacion-informe` (§4.5). Sigue abierto — y ahora se sabe
  que se llevó a la sesión y no salió.
- **P62** bloquea la decisión sobre la capa as-built del maestro, y con ella el destino de las **siete
  specs** que F0-02 escribió. El riesgo está anotado en el §6 del proposal de F0-02 y **sigue vivo,
  exactamente como estaba**.

**Se propone cargar una observación por cada una**, pero de tipo `context` y con clave `punto-abierto/`,
**no** `decision/`:

| `topic_key` | Qué dice |
|---|---|
| `punto-abierto/p10-validacion-informe` | Llevado a la sesión del 03/09 marcado en la convocatoria (`acta:173`), discutido (`:397`) y **sin decisión**. Vuelve al Anexo D por la regla de la sesión (`:114-116`). Gate de F1E-04 |
| `punto-abierto/p62-capa-as-built` | Llevado a la sesión (`acta:121`) y **no tratado**: cero apariciones en la parte III. Vuelve al Anexo D. Condiciona el destino de las siete specs de F0-02 |

Sin ellas, quien consulte la memoria vería doce decisiones del 03/09 y no sabría que dos temas del
orden del día se cayeron. **El hueco tiene que ser visible desde dentro de la memoria**, que es la
misma regla que se aplica en el §2.2 del proposal al acta que faltaba.

**Las 42 casillas sin marcar no se listan una a una.** No hay nada que decidir sobre ellas: no se
llevaron marcadas y el acta no las trata. Volverán al orden del día del **11/09** o quedarán en el
Anexo D, y ésa es una tarea de Gerencia, no de esta carga.

---

# Los tres totales, y el comando de cada uno

| Clase | Qué es | Cifra | Comando que la produjo |
|---|---|---|---|
| **(a)** | Decisiones del §1.8 del maestro | **44** halladas · **43** para cargar | Aritmética del triplete: `(870−739+1)/3 = 44`, resto 0. La excluida es la 17 (`:787`), única con marca de estado |
| **(b)** | Decisiones de la sesión del 03/09 | **12** halladas · **12** para cargar | `awk` sobre los siete bloques `Decisiones tomadas:` de la parte III |
| **(c)** | Casillas marcadas sin respaldo en el acta | **2** halladas · **0** para cargar | `grep -cE '^- \[x\]'` = 3, menos la única con decisión (`:402`) |
| | **Total a cargar como `decision/*`** | **55** | 43 + 12 |
| | **Total a cargar como `punto-abierto/*`** | **2** | las de la clase (c) |

**57 observaciones en total**, y ninguna cargada todavía.

## Comprobación de colisión de claves

El plan §4.5 (`:347-365`) ya declara **19** claves `decision/*` para decisiones **futuras**, las que
abren tandas. Las 55 de esta lista son de decisiones **pasadas**. Verificado que no chocan:

```
comm -12 <claves de esta lista> <claves del plan>  →  vacío
```

Las dos familias conviven: el plan escribe la clave **antes** de que la decisión exista, esta lista la
escribe **después**. Cuando una de las 19 se cierre el viernes, se guarda con su clave y pasa a ser
del mismo tipo que estas 55.
