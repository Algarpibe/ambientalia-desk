AMBIENTALIA S.A.S.
Proyecto Desk 2.0 · Revisión R08.4
Documento maestro
de ideas y funcionalidades
Consolidación de la visión, los flujos mapeados, los estudios de mercado y las decisiones de Gerencia, en una especificación funcional única con backlog priorizado.
Contenido: Resumen ejecutivo · Ejes de valor · Especificación funcional en 12 módulos · Backlog priorizado y roadmap · Anexos, incluido el seguimiento de lo construido frente al plan
Fuentes: Notion «CMMS (Desk 2.0) Ambientalia» — Ideas · IA · analisis-tickets · decisiones del 17/02, 19/02, 14/08, 20/08, 21/08, 27/08, 03/09 y 10/09 de 2026 · esquema de ejes de valor del 21/08/2026 · Código de la aplicación Desk 2.0, commit a3a8f03 del 21/08/2026 · Hojas de mapeo de los cuatro flujos (02–16/02/2026) y Diccionario de Campos Tickets · Registro de correcciones F0-01 (repositorio Desk_2_R1.023, docs/sdd/) · panel de supervisión de Gerencia (decisiones del 17/09 al 01/10/2026) · plan de fases R01.3 · expedientes R08.3 y R08.4
Fecha: 1 de octubre de 2026 (primera edición: 21 de agosto de 2026)
Revisión: R08.4 — documento definitivo del plan de desarrollo: incorpora las decisiones de Gerencia del 17/09 al 01/10/2026, las correcciones al blueprint, la revisión de GN y el plan de fases R01.3 (corte en dos tiempos). Base: R08.3
Contenido
 TOC \z \o "1-3" \u \h1. Resumen ejecutivo8
1.1 Propósito de este documento8
1.2 Novedades de esta revisión (R08.4)8
Lo que la R08.4 cierra9
1.3 Qué incorporaron las revisiones anteriores11
La R08.3 — borrador con la revisión de GN (30/09–01/10/2026)11
La R08.2 — decisiones del 10/09 y correcciones trazables (10/09/2026)11
La R08.1 — decisiones del 27/0811
Decisiones del 03/0912
La R08 — la revisión humana completa12
Las R06 y R07 — retirada del portal del empleado13
La R05 — los flujos de origen y el diccionario13
La R04 — el blueprint implementado14
La R03 — ejes de valor, capa de conocimiento y área de cliente14
La R02 — decisiones del 21/08/202614
1.4 Los tres ejes de valor15
1.4.1 El esquema15
1.4.2 No son tres bloques, son una cadena15
1.4.3 El riesgo rector: el error de captura15
1.4.4 El tercer eje es producto, no soporte17
1.4.5 Correspondencia con los módulos17
1.5 Qué es Desk 2.018
1.6 Visión y principios de diseño18
1.7 Los dolores que Desk 2.0 debe resolver18
1.8 Decisiones estructurales ya tomadas20
1.9 Alcance, hitos y plazos23
Calendario24
Entregables y compromisos24
1.10 Cómo leer la Parte 226
1.11 Cómo se revisa este documento (Man on the Loop)26
El ciclo de revisión26
Cómo entra lo decidido al maestro26
Las tres reglas que hacen que esto funcione27
Convención de marcas27
2. Especificación funcional por módulos27
M1. Núcleo de tickets, blueprints y máquina de estados28
M1.1 Identificación del ticket28
M1.2 Ramificación por tipo de servicio29
Precondición comercial de la recepción [DECIDIDO 10/09 — R08.2]30
Recepción de accesorios [DECIDIDO 30/09/2026 — R08.4]31
Recepción del equipo: rotulación, novedades, fotos y alta [R08.4]31
M1.3 Flujo de servicio técnico32
M1.4 Flujo equipo-nuevo [CONSTRUIDO]43
M1.5 Flujo soporte-remoto [CONSTRUIDO]45
M1.6 Modelo objetivo de máquina de estados45
M1.7 Reglas de transición: guardas, disparadores y tiempos47
M1.8 Tipos de evento49
M1.9 Roles, permisos, derivación y avisos50
M1.10 Registro de tiempos, anulación y métricas55
M1.11 Flujo comercial [AS-IS]57
M1.12 Flujo posible-cliente [AS-IS]59
M2. Diagnóstico guiado y base de conocimiento59
M2.1 Estructura del árbol de diagnóstico59
M2.2 Estructura de cada punto de control61
M2.3 Registro, evidencia y comentarios62
M2.4 Taxonomía de fallas63
M2.5 Informes de servicio64
M2.6 Asistencia por IA65
M2.7 Criterios analíticos de aprobación66
M3. Hojas de vida de equipos (ALM)66
M3.1 Estructura de datos66
M3.2 Taxonomía jerárquica ISO 1422467
M3.3 Funcionalidades de la hoja de vida68
M3.4 Identificación e ingreso de datos68
M3.5 Migración del historial69
M4. Comercial: cotización, aprobación y promesa de fecha70
M4.1 Aprobación del cliente71
M4.2 Simulador de fecha de entrega (CTP — Capable to Promise)72
M4.3 Reprogramación y comunicación de consecuencias72
M4.4 Cotización, recotización y facturación diferida72
M4.5 El dato como argumento comercial76
M5. Inventarios y repuestos (MRO)77
M5.1 Reservas y repuestos adelantados77
M5.2 Kitting78
M5.3 Ubicaciones bin78
M5.4 Reabastecimiento y compras78
M5.5 Operación del almacén79
M6. Planificación y capacidad79
M6.1 Parámetro de carga del servicio técnico79
M6.2 Calendarios79
M6.3 Asignación de trabajo80
M6.4 Exposición de la capacidad al cliente [NUEVO — R03]80
M7. Analítica, KPIs y predicciones81
M7.1 Cuadro de mando de KPIs del taller81
M7.2 KPIs de confiabilidad (si se extiende a mantenimiento de planta)85
M7.3 Análisis operativo85
M7.4 Predicciones86
M7.5 Dashboards por rol86
M7.6 Campos y estados que el modelo de datos debe garantizar87
M7.7 Métricas del área de cliente [NUEVO — R03]87
M8. Portal de cliente y comunicación externa88
M8.1 El modelo de dos niveles [DECIDIDO 21/08]88
M8.2 Nivel básico89
M8.3 La hoja de vida reducida89
M8.4 Nivel completo90
M8.5 Identidad y acceso91
M8.6 Regla de apertura del portal [DECIDIDO — R03]91
M8.7 Certificados y calibración92
M8.8 Canales de entrada92
M8.9 Servicio premium [FUTURO]92
M9. QA/QC, calibración y cumplimiento92
M9.1 Control de calidad interno92
M9.2 Trazabilidad y evidencia93
M9.3 Documentación publicada al cliente [NUEVO — R03]94
M10. Movilidad, UX y modo offline95
M10.1 Experiencia del técnico95
M10.2 Dispositivos96
M10.3 Modo offline96
M10.4 Arquitectura de mini-apps96
M11. Arquitectura, integraciones y datos96
M11.1 Decisiones de arquitectura tomadas96
M11.2 Stack recomendado [PROPUESTO]97
M11.3 Integraciones98
M11.4 Seguridad, permisos y auditoría99
M11.5 Infraestructura100
M11.6 Herramientas de desarrollo y prototipado101
M11.7 Deuda técnica registrada102
M12. Conocimiento, formación y capa RAG103
M12.1 Producción de contenido formativo103
M12.2 Las dos bases de conocimiento [DECIDIDO 21/08]103
M12.3 Arquitectura de la capa RAG104
M12.4 El copiloto interno (sobre la KBI)105
M12.5 El agente conversacional del cliente (sobre la KB Externa)105
M12.6 Gobernanza documental106
M12.7 Distribución de firmware y software106
M12.8 Conexión con el resto del sistema106
3. Backlog priorizado y roadmap107
3.1 Criterios107
3.2 Fases y épicas107
3.3 Catálogo de tandas108
Fase 0 · Cimientos SDD108
Épica 1A · Correcciones inmediatas109
Épica 1B · Paridad y recepción109
Épica 1C · Correcciones del blueprint110
Épica 1D · Diagnóstico con checklist110
Épica 1E · Informes111
Épica 1F · Corte111
Épicas 1G y 1H · Independencia de Zoho111
Fila sin épica112
3.4 Trabajo nuevo decidido el 30/09 y el 01/10, y dónde encaja112
Antes del corte112
Después del corte113
3.5 Calendario114
Hitos114
Margen y riesgos115
Primera tarea de persona: medidas M1, M2 y M3115
3.6 Lo que queda para después: 2027 y futuro116
3.7 Backlog original del MVP (R02–R08, referencia histórica)116
4. Anexos117
Anexo A — Benchmark de mercado y lecciones aplicables117
A.1 Segmento enterprise / EAM117
A.2 Segmento mid-market / cloud-native118
A.3 Segmento mobile-first118
A.4 Nicho y emergentes118
A.5 Posicionamiento objetivo de Ambientalia118
Anexo B — Catálogo consolidado de estados119
B.1 Estados por área que los mueve (servicio técnico)120
B.2 Estados retirados u obsoletos120
B.3 Estados sin salida y cómo quedan resueltos121
B.4 Estados de espera y reloj del SLA121
Anexo C — Registro histórico de decisiones122
C.1 — 17/02/2026 · Revisión de operativa y flujos122
C.2 — 19/02/2026 · Diagnóstico Grimm y prototipado123
C.3 — 14/08/2026 · Desarrollo y transición a Desk 2.0123
C.4 — 20/08/2026 · Hojas de vida y auditoría de flujos123
C.5 — 21/08/2026 · Desarrollo de Desk 2.0 y planes de formación124
C.6 — Decisiones del 21/08/2026 · Ejes de valor y área de cliente125
C.7 — 21/08/2026 · Auditoría del blueprint implementado126
C.8 — Febrero de 2026 · Las hojas de mapeo y el diccionario (incorporadas en la R05)126
C.9 — 27/08/2026 · Códigos internos, checklists dinámicos, órdenes de venta y priorización126
C.10 — Decisiones del 03/09/2026130
C.11 — 10/09/2026 · Decisiones de Gerencia (incorporadas en la R08.2)131
C.12 — Decisiones de Gerencia del 17/09 al 01/10/2026 (panel)131
Anexo D — Puntos abiertos que requieren decisión136
D.1 — Puntos abiertos a 01/10/2026136
D.2 — Puntos resueltos141
D.3 — Resumen a 01/10/2026145
Anexo E — Glosario145
Anexo F — Fuentes148
Anexo G — Diccionario de campos de la tabla de tickets151
G.1 Identificación del ticket y del cliente151
G.2 Estado, ciclo de vida y clasificación152
G.3 Equipo152
G.4 Personas, prioridad e interacción152
G.5 Fechas de hito153
G.6 Indicadores calculados154
G.6b Indicadores que continúan antes del corte154
G.7 Columnas marcadas como no relevantes155
G.8 Cómo usar este anexo155
Anexo H — Seguimiento: as-built frente a plan155
H.1 Cómo se lee y cómo se mantiene155
H.1b Estado de las tandas a 01/10/2026156
H.2 Los cuatro flujos157
H.3 Las doce correcciones158
H.4 Los doce módulos159
H.5 Los indicadores160
H.5b El plan, del 27/08 al corte en dos tiempos160
H.6 Lo que la R08 dejó en entredicho, y cómo quedó161
Anexo I — Registro de comentarios de revisión (Man on the Loop)161
I.1 Lo que esta revisión enseña sobre el propio documento165
I.2 Registro de cambios de la R08.2165
I.3 Registro de cambios de la R08.4166
1. Resumen ejecutivo
1.1 Propósito de este documento
[R08.4] Este es el documento definitivo del plan de desarrollo de Desk 2.0: la plataforma propia que sustituye a Zoho Desk y a las automatizaciones dispersas en n8n. Fija qué se construye, en qué orden y con qué reglas. Lo que dice el cuerpo es lo vigente a 01/10/2026; lo que sigue sin decidir figura como [ABIERTO], con su número en el Anexo D y su dueño. Las revisiones siguientes (R08.5 y posteriores) solo recogen lo que Gerencia decida a partir de ahora, por el mecanismo descrito en §1.11.
El documento consolida, en un único lugar, todas las ideas, funcionalidades, decisiones y pendientes que Ambientalia ha generado alrededor del proyecto Desk 2.0.
Se construyó a partir de las fuentes de trabajo del espacio de Notion «CMMS (Desk 2.0) Ambientalia» —Ideas, IA, analisis-tickets y el registro de decisiones—, más el esquema de ejes de valor del 21/08/2026.
Desde la revisión R04 se añade una fuente de naturaleza distinta a todas las anteriores: el propio código de la aplicación. Las fuentes de Notion recogen lo que se quiere construir; el código recoge lo que ya está construido.
La R05 añade la tercera pata: las hojas de mapeo originales de los cuatro flujos y el diccionario de campos, el trabajo de campo de febrero de 2026. Con las tres fuentes juntas —lo que se quiere, lo que está construido y lo que se levantó del sistema actual— se puede distinguir un error de diseño de un error de transcripción.
[R08.4] Desde el 17/09/2026, la fuente de lo decidido es el panel de supervisión de Gerencia y el registro de decisiones del repositorio que lo recoge (§1.11). El orden de construcción lo fija el plan de fases R01.3, con el corte en dos tiempos (§1.9 y Parte 3). La comparación entre lo planificado y lo construido ya no se hace en el cuerpo: vive solo en el Anexo H (§1.10).
El documento tiene cuatro capas de lectura: un resumen ejecutivo (Parte 1), el marco de ejes de valor que explica para qué se construye la plataforma (Parte 1, §1.4), una especificación funcional completa por módulos (Parte 2) y el plan de desarrollo —fases, épicas, tandas y calendario— (Parte 3), más los anexos de soporte.
1.2 Novedades de esta revisión (R08.4)
[R08.4] La R08.4 parte de la R08.3 —la R08.2 con los comentarios que GN anotó sobre ella— y la convierte en el documento definitivo del plan. Trae seis bloques de cambio:
Decisiones de Gerencia del 17/09 al 28/09. Unas 66 decisiones del panel de supervisión que la R08.2 no tenía. Entre ellas: permisos por área y cargo, reloj del SLA, estado Anulado, dos ramas de facturación, salidas de los estados de espera, Control de calidad, tipo de evento, registro de contrato, prioridad de los Top 5, Verificación con gas patrón, respaldo, calendario de días hábiles, corte del 14/12 y continuidad de indicadores. Registro completo en el Anexo C.12.
Correcciones del 30/09 y del 01/10 al blueprint y a la recepción y entrega. Prefijos suprimidos en los tickets nuevos (E-094) · tiempo promesa global (E-095) · encuesta en tableta en la entrega (E-096) · «Entregado» obsoleto (E-097) · asignación de trabajo sobre usuario, área y cargo (E-098) · orden de la cola por la hora de «Habilitar Servicio» (E-099) · accesorios desde el catálogo de artículos (E-100) · salidas de emergencia por la persona a cargo (E-101) · liberación sin factura en dos momentos (E-102) · «Pendiente» fuera de la rama de servicio técnico (E-103) · remisiones sin ticket (E-104) · aviso «En garantía» (E-105) · «Servicio externo» sin transiciones hacia Por Facturar (E-106) · SKU registrado por Comercial/Compras (E-107) · «Rechazo» desde Notificación cliente solo por Comercial (01/10) · «Solicitud repuestos» y «Entrega de Repuestos» como traspaso con el encargado de inventario (01/10). Con ellas, la rama de servicio técnico pasa de 34 a 31 transiciones y el mapa de 38 a 35 pasos. Las cuatro correcciones que la R08.3 había pegado en la tabla histórica de la R05 (E-094 a E-097) salen de esa tabla y se integran donde corresponden: M1.1 (prefijos), M4.1 (tiempo promesa), M7.1 y Anexo G (encuesta) y M1.3 y M1.7 («Entregado»).
Revisión de GN del 01/10. Sus comentarios quedan integrados en el texto: protocolo de traspaso (§1.7 y M1.9.2), qué cambia con la 17025 (§1.4.5 y M9.2), fotos obligatorias en las remisiones de entrada y salida, remisión de salida desde la entrega y su guarda, alta manual de equipo y cliente desconocidos, tipo de evento (C5) aprobado, criterio de falla en dos atributos, la R² fuera de la aprobación de la calibración, repuestos preventivos, equipos propios de Ambientalia, versión imprimible de la hoja de vida, carga masiva del histórico documental, búsqueda por número de ticket y serial, umbral del OTD por encima del 75 %, predicción a partir de los protocolos de servicio, Technical Notes y la propuesta de árbol RCM. Dos entregables quedan hechos (§1.9).
Plan de fases R01.3 y corte en dos tiempos. Corte operativo el lunes 14/12/2026 e independencia total de Zoho en enero de 2027, con un margen medido de +1,9 a +2,2 semanas y el plan A (corte único el 01/02/2027) sin activar. El plan cuenta 66 tandas; a 01/10 hay 18 cerradas. Ver §1.9 y Parte 3.
Retirada de la capa as-built del cuerpo (decisión p62-capa-as-built, 24/09). M1–M12 describen cómo debe funcionar el sistema: sin rutas de ficheros, números de línea, nombres de funciones ni commits. La marca [AS-BUILT] pasa a [CONSTRUIDO] cuando describe lo que hace hoy la aplicación, o desaparece si el pasaje se reescribe como regla. Donde decía «demostrador», ahora dice «la aplicación (en uso)». La comparación entre plan y construido vive solo en el Anexo H.
Puntos abiertos que siguen, con su dueño. El Anexo D se rehace como lista vigente: los resueltos se marcan con su fecha y su decisión, y se añaden los nuevos desde el nº 65. Los que más pesan: qué estados ve cada área, la calificación de los clientes sin contrato ni Top 5, qué son las «vistas equivalentes a Zoho», la ampliación de contrato, el proveedor de las copias de seguridad, las alarmas que dependen de la sincronización con Zoho, el encargado de inventario, el descuento único de inventario, la acreditación 17025 y las medidas M1, M2 y M3 del plan de independencia.
Cómo está escrita. El cuerpo dice solo lo vigente. Cuando una decisión sustituye a otra, el pasaje se reescribe y, si aporta, lleva una frase corta con lo sustituido; el histórico vive en §1.3 y en los Anexos C e I. Lo nuevo o reescrito lleva la marca [R08.4], y las decisiones fechadas, [DECIDIDO dd/mm/2026 — R08.4].
Lo que la R08.4 cierra
[R08.4] Pasan a resueltos estos puntos del Anexo D. El detalle está en el apartado indicado y el registro, en el Anexo C.12.
Nº
Punto
Cómo queda
Decisión y fecha
Dónde
3
Plazo de la alerta de no aprobación del cliente
4 días hábiles (36 h hábiles); aviso al Coordinador Comercial y marca de tablero, no estado
anexo-3-alerta · 24/09
M1.7
7
Garantía con el proveedor
Ficha propia vinculada al ticket y a la OVI de garantía, no rama del blueprint
anexo-7-garantia-proveedor · 24/09
M4.4
8
Migración del historial de Desk 1.0
Los documentos siguen en Drive, enlazados; el histórico de Zoho se repatría en la épica 1G
p8-p54-drive · 21/09
M3.5
9
Comentarios del checklist
Comentarios predeterminados del catálogo, con nota libre aparte; la base de conocimiento sugiere, no escribe
anexo-9-comentarios · 24/09
M2.3
10
Validación del informe
Tres firmas: Elaboró, Revisó (Coordinador Técnico) y Aprobó (Director Técnico)
roles-validacion-informe · 24/09
M2.5
12
Linealidad R² como criterio de aprobación
Por ahora no; se aprueba con los lineamientos del fabricante
Regla de GN · 01/10
M2.7
14
Origen de remisiones_entrada
La escribe Desk 2.0; la hoja de Google se cierra el 14/12
p14-remisiones-entrada · 23/09 · p14b-hoja-google · 24/09
M2.5
15
Rutas abreviadas
Equipo sin novedad: no; calibración directa: sí, con tres condiciones
p15-p59-rutas · 23/09
M2.1
31
Salida de los cuatro estados de espera
Dos externas con dos salidas que decide Comercial; dos internas que no se abandonan; la caducidad nunca ejecuta sola; ejecuta la persona a cargo
c3-salida-esperas · 23/09 · E-101 · 30/09
M1.3.4
32
Estado Anulado
Cinco motivos; el histórico se marca, no se reescribe
c2-anulado · 23/09
M1.10
33
Liberación sin factura
Solo el Director Comercial, con motivo de lista cerrada y fecha prevista de facturación; alarma con F1C-02
anexo-33-checkbox · 24/09 · E-102 · 30/09
M1.3.5
34
Ciclo facturar↔entregar
Dos ramas sin ciclo; «Facturado» es atributo; «Pendiente de facturar» es estado
c4-dos-ramas · 23/09
M1.3.5
35
Tipo de evento
Cuatro tipos, uno por transición; el informe en tres actos
c5-tipo-evento · 23/09 · aprobado por GN el 01/10
M1.8
36
Pérdida de aviso y borrado de administrador
Pérdida aceptada con revisión nocturna; borrado solo sin actividad real y con registro inmutable
anexo-36-aviso · 24/09
M1.9.3
37
Destino de los prefijos
Suprimidos en los tickets nuevos; los existentes conservan el suyo
E-094 · 30/09
M1.1
38
Salidas de Verificación
Obligatoria por tipo de equipo si hay gas patrón vigente; rechazada → Notificado
p38-verificacion-calidad · 23/09 · f1a03-familia-y-gas-patron · 28/09
M1.4
39
Permisos en tres niveles
Nivel cargo resuelto: el área es la base y el cargo solo restringe. El nivel «propietario del registro» sigue abierto
c10-permisos-cargo · 23/09 · c10b-gerente-director · 24/09
M1.9.1
40
SLA sobre Notificado
Recuperado en horas hábiles (9 h), junto con las alarmas de Remisión creada y Notificación cliente
anexo-3-alerta · calendario-habil · 24/09
M1.7
43
Servicio en sitio
Cuarta rama en 2027 T2; hasta entonces, modalidad «en sitio» en soporte remoto
anexo-43-en-sitio · 24/09
M1.5 · M1.6
44
Escritura hacia Zoho
La aplicación no escribe en Zoho por ahora; el «espejo de Zoho» es línea futura
p44-escritura-zoho · 17/09
M11.1
45
Macro-fases del diagnóstico
Los niveles macro son propios de cada marca y comunes dentro de cada familia
p45-macro-fases · 23/09
M2.1
46
Criterios analíticos de aprobación
En lo que toca a la R²: no es criterio de aprobación; se aprueba con los lineamientos del fabricante
GN · 01/10
M2.7
47
Repuestos adelantados
Tres casos; tope de $3.000.000 COP por ticket para los de rotación
anexo-47-repuestos · 24/09
M2.3 · M5
53
Identificación de contratos
Registro de contrato; un ticket es de contrato por su subOV
anexo-53-contratos · 24/09
M4.4
54
Convivencia con Google Drive
El enlace a Drive se queda, por capacidad de almacenamiento
p8-p54-drive · 21/09
M3.5
55
Módulo de respaldo
Responsable, periodicidad, retención y destino decididos; sigue abierto solo el proveedor
p55-backup · p55b-destino-copia · 24/09
M11.5
56
Norma de taxonomía de fallas
ISO 14224 (2016) simplificada, como referencia
anexo-56-taxonomia · 24/09
M2.4
59
Ruta del equipo sin novedades
Recorre igualmente las etapas macro
p15-p59-rutas · 23/09
M2.1
60
Criterio que ordena el MVP
Manda la paridad con Zoho Desk antes del corte; lo demás, después
fecha-corte · 24/09
§3.1
61
Incorporación de lo decidido al maestro
Registro de decisiones con revisión de entrada; R08.x cada dos semanas; ninguna decisión más de un mes pendiente
anexo-61-incorporacion · 24/09
§1.11
62
Capa as-built
Fuera del cuerpo; el Anexo H se genera desde el barrido de reconciliación
p62-capa-as-built · 24/09
§1.10 · Anexo H
64
Histórico de C1
Las liberaciones anteriores al arreglo se marcan, no se corrigen
p64-historico-c1 · p64b-quien-ejecuta · 24/09
M1.3.5
Treinta puntos en total. Los que siguen abiertos, con su dueño y su recomendación cuando la hay, están en el Anexo D.
1.3 Qué incorporaron las revisiones anteriores
[R08.4] Este apartado es el histórico de revisiones. Desde la R08.1 hacia atrás, las entradas se condensan; donde una novedad de entonces ya no es vigente, se dice entre paréntesis qué la sustituye. El registro de lo decidido en cada fecha está en el Anexo C, y el de las observaciones del revisor, en el Anexo I.
La R08.3 — borrador con la revisión de GN (30/09–01/10/2026)
[R08.4] La R08.3 es la R08.2 con los comentarios que GN anotó sobre el texto: pasajes resaltados, observaciones marcadas «**» y correcciones pegadas en su sitio. Gerencia decidió el 01/10 tratarla como borrador en revisión, no como versión vigente (maestro-r08-3-publicada). Esta R08.4 integra todos sus comentarios en el cuerpo y retira los resaltados; el registro de lo que se hizo con cada uno está en el Anexo I.3.
La R08.2 — decisiones del 10/09 y correcciones trazables (10/09/2026)
[R08.4] Revisión de corrección y registro, no de reescritura. Incorporó:
Las decisiones del 10/09: Verificación con salida y condicionada por familia de equipo (M1.4) · subórdenes con formato OV-AAAA-NNN-SS (M4.4) · cardinalidad 1 ticket : N OV (M4.4) · la OV es obligatoria para trabajar, no para recibir (M1.2) · las tres fechas derivadas las impone el servidor (M1.10) · la verificación no se mide con la duración del estado (M7.3) · el mapa del blueprint se genera desde el código, vigilado por una prueba (Anexo F).
Doce erratas, diez del registro de correcciones F0-01 y dos del 10/09. La de más alcance: Verificación sí tiene salida (Verificación —Liberación→ Finalizado, 71 usos), y la rama de equipo nuevo tiene seis transiciones, no cinco.
Anexo D: cerró los puntos 21, 52 y 33 (este último en su parte C1), dejó el 38 parcialmente resuelto, amplió el 62 y abrió el 64 (histórico de C1).
Lo decidido el 03/09, que se registró en el Anexo C.10.
Dejó dos lecciones que siguen vigentes. Resumir una fuente sin volver a ella produce errores que se leen igual de bien que los aciertos: la falsa «Verificación sin salida» sobrevivió cuatro revisiones. Y una promesa no es un mecanismo: el mapa del blueprint iba a actualizarse a mano y nadie lo hizo, hasta que pasó a generarse desde el código.
La R08.1 — decisiones del 27/08
Incorporó lo decidido el 27/08/2026, que ninguna revisión anterior recogía: ocho temas y once decisiones firmes. Entre ellas:
Arquitectura híbrida del diagnóstico: niveles macro como transiciones de estado y, dentro de cada uno, un checklist dinámico por marca y modelo. (Precisada el 23/09: los niveles macro son propios de cada marca y comunes dentro de cada familia; ver M2.1.)
Subdivisión de la orden de venta en subórdenes, con un ticket por subservicio. (Formato revisado el 10/09: OV-AAAA-NNN-SS.)
El código interno del cliente como identificador secundario de búsqueda (M3.1).
Informe de salida para todo tipo de servicio, con evidencia fotográfica y motivos tipificados (M2.5).
Captura en base de datos en lugar de carpetas, con entregables por plantilla. (Desde el 21/09 los documentos siguen en Drive, enlazados; ver M3.5.)
Portal de cliente y seguridad como etapa independiente, posterior a la versión interna (M8).
Una vía de escape manual para el cambio de estado (M1.3.4).
QR del certificado, cálculo de incertidumbre y etapas de validación con firma como requisitos de fase posterior (M9.1).
Lo decidido el 27/08 incluía retirar del maestro las referencias a lo construido. La R08.1 no lo aplicó y lo dejó como punto 62, que Gerencia resolvió el 24/09 (p62-capa-as-built) y que aplica esta R08.4. Abrió los puntos 52 a 63, entre ellos el 61 (cómo entra lo decidido al maestro, resuelto el 24/09) y el 63 (correspondencia entre los módulos M1–M8 citados el 27/08 y los M1–M12 de este documento).
Decisiones del 03/09
Lo decidido el 03/09/2026 —doce decisiones escritas y doce tareas con responsable— se recoge en el Anexo C.10. Aportó el criterio de replicar primero la funcionalidad de Zoho Desk para migrar rápido y crecer después por funciones (punto 60), y la regla de que el equipo sin novedad recorre igualmente las etapas macro (punto 59). [R08.4] El plan vigente sigue ese criterio desde el 24/09: antes del corte entra la paridad con Zoho Desk, y lo que Zoho no tiene va después (§1.9 y Parte 3).
La R08 — la revisión humana completa
La R08 es la primera revisión que nace de una lectura completa del documento por el revisor humano: 73 observaciones sobre la R07. El procedimiento está en §1.11 y la trazabilidad, en el Anexo I. Lo de fondo:
Lo construido entonces era un demostrador, no un producto. (Hoy la aplicación está en uso; ver §1.10.)
El backlog del MVP quedó congelado hasta revisarlo. (Lo sustituye el plan de fases de la Parte 3.)
Doce módulos, de M1 a M12, sin huecos; los huecos del backlog y del Anexo D se mantienen porque ahí el número identifica un elemento concreto.
Nace el Anexo H, que compara lo planificado con lo construido.
Decisiones y correcciones que trajo, con su estado vigente entre paréntesis:
Los tres bodegajes —entrada, proceso y salida— con sus fórmulas (M1.10; corrección C9).
Dos ramas para el ciclo de facturación, con un estado Pendiente de facturar (M1.3.5; decidido el 23/09).
La orden de venta previa vuelve a evaluación (resuelto el 10/09: obligatoria para trabajar, no para recibir).
El prefijo es una formalidad y la rama la define la clasificación (sustituido el 30/09: los prefijos se suprimen en los tickets nuevos).
Modelo de prioridades: Alta con contrato, Media y Baja según la valoración del cliente (precisado el 23/09: la prioridad de los Top 5 se fija a mano en el cliente, y la pone el Director Comercial; M1.9.1).
Fecha, hora y persona en toda etapa y transición, sin excepciones (M1.10).
La captura asistida —OCR, QR y reconocimiento visual— sale del MVP (M3.4).
Kitting descartado; ubicaciones y operación de almacén aplazadas sin descartar (M5).
El reabastecimiento se lee del Portal Ambientalia · Análisis de Inventario (M5.4).
Reserva de repuestos adelantada al diagnóstico (precisada el 24/09 en tres casos; M2.3 y M5).
Supabase no está en uso: solo PostgreSQL en la VPS propia de Hostinger (M11.5).
El flujo posible-cliente queda fuera de alcance (desde el 21/09, también el comercial: los dos se quedan en Zoho CRM; M1.11 y M1.12).
Un mismo evento clasificado en tres categorías a la vez (resuelto el 23/09; M1.8).
Alternativas al RAG a evaluar con prototipo (M12.3); modelo único de identidad del portal con enlace firmado (M8.5); certificados verificables públicamente (M8.2).
Abrió los puntos 43 a 51.
Las R06 y R07 — retirada del portal del empleado
La R06 no añadió contenido: retiró alcance. El portal del empleado —vacaciones, permisos, saldos y cadena de aprobación— dejó de formar parte de Desk 2.0. Salieron el módulo completo (entonces M10), los ítems 16 y 24 del MVP, sus hitos de despliegue, los puntos abiertos 19 y 22 y las decisiones que solo afectaban a ese módulo. La numeración del backlog y del Anexo D conserva esos huecos. El Anexo C sigue registrando lo decidido el 14/08 y el 21/08 sobre el portal, con una nota de alcance, igual que con los asuntos del 20/08 que no eran de plataforma (proyecto Laboratorio ONAC, Shelters XL, showroom).
La R05 — los flujos de origen y el diccionario
La R05 incorporó las hojas de mapeo originales de los cuatro flujos —servicio técnico (16/02/2026), equipo nuevo y soporte remoto (03/02/2026), comercial y posible-cliente (05/02/2026)— y el Diccionario de Campos Tickets, con las 59 columnas de la tabla y las fórmulas de los indicadores derivados.
La corrección de fondo: la fuente estaba bien. La hoja de servicio técnico contenía 34 transiciones y coincidía con las 34 de la aplicación; las diferencias eran de etiqueta. Lo que falló fue el resumen de veinte filas que entró al maestro. El riesgo no estaba en levantar el proceso, estaba en resumirlo sin volver a la fuente (§1.4.3).
Cerró los puntos 1 (flujos comercial y posible-cliente, M1.11 y M1.12), 2 (diccionario, Anexo G) y 4 (bodegaje de entrada: la fórmula existe y lo que falla es el dato; lo sustituye el punto 41). Y corrigió a la R04 en cinco temas: la calidad del mapeo original, el flujo de equipo nuevo, el soporte remoto, el bodegaje de entrada y el tipo de evento.
Lo que añadió, con su estado a 01/10/2026:
Novedad de la R05
Dónde
Estado vigente
Flujo comercial completo: 10 transiciones, 9 estados, dos terminales
M1.11
Fuera de Desk 2.0 en 2026: se queda en Zoho CRM (21/09)
Flujo posible-cliente: 4 transiciones, 5 estados, dos terminales
M1.12
Ídem
Diccionario de los 59 campos, con las fórmulas de los tiempos
Anexo G
Vigente; lista cerrada de nueve indicadores para la continuidad (24/09)
La taxonomía de tipo de evento ya existía en las hojas
M1.8
Aplicada: cuatro tipos, uno por transición (23/09)
Verificación, en equipo nuevo, sin salida
M1.4
Corregido en la R08.2: la salida Verificación —Liberación→ Finalizado existe (71 usos)
Guardas del as-is: condición del checkbox de liberación y restricción por cargo
M1.7 · M1.9.1
C1 construida; restricción por cargo construida (F1C-05)
SLA de 1 día sobre Notificado en Zoho, que la aplicación no tenía
M1.7
Recuperado: 9 horas hábiles (F1B-08)
Cinco prefijos (MT, CG, HV, SR, PRO) y convención de asunto normalizado
M1.1
Prefijos suprimidos en los tickets nuevos; el asunto se mantiene sin prefijo (30/09)
El tiempo promesa lo fija Servicio Técnico en «Escalado a Revisión»
M4.2
El técnico sigue fijando los días de entrega; al cliente se le comunica el tiempo promesa global (30/09)
Calificación de satisfacción del cliente (columna 55)
M7.1
En la lista de indicadores; encuesta por correo y en tableta en la entrega (30/09)
La columna Clasificaciones dispara las ramas
M1.2
Vigente
Origen del estado «Entregado»: un conector suelto del blueprint de Zoho
M1.3.6
Obsoleto: no existe en Desk 2.0 (30/09)
La R04 — el blueprint implementado
La R04 incorporó el blueprint de servicio técnico tal como estaba en el código (commit a3a8f03, 21/08/2026): 34 transiciones, 21 estados, 2 entradas y 1 estado terminal. Sustituyó al mapeo manual anterior, que tenía cuatro filas correctas de veinte.
Añadió la tabla de discrepancias (M1.3.6), las dos entradas al flujo que no se cruzan (M1.3.2), los dos pasos sin botón que se escriben al crear o anular una remisión (M1.3.3), la capa de derivación y avisos (M1.9.2 y M1.9.3), cinco correcciones anteponibles al MVP (C1–C5) y advertencias sobre cinco indicadores (M7.1). Señaló cuatro estados de espera sin salida de emergencia (punto 31), la falta de un estado Anulado (32), un checkbox obligatorio que se podía saltar (33) y el ciclo reentrante entre Por Facturar y Por Entregar / Sin facturar (34). Los cuatro quedan resueltos en esta R08.4.
Encajó en el marco de la R03: un flujo que cierra como «Finalizado» lo que se abandonó contamina el eje ② desde dentro del eje ①, igual que un serial mal tecleado. Ratificó, además, el artefacto de auditoría de blueprints con IA adoptado el 20/08/2026. [R08.4] Las cifras vigentes del blueprint son otras: 31 transiciones en servicio técnico y 35 pasos en el mapa (§1.2 y M1.3).
La R03 — ejes de valor, capa de conocimiento y área de cliente
La R03 añadió una capa de intención: por qué se construye Desk 2.0, en qué orden, y qué convierte la plataforma en un argumento comercial. Procede del esquema de ejes de valor del 21/08/2026. Aportó el marco de los tres ejes como cadena de dependencias (§1.4) · el riesgo rector del error de captura (§1.4.3 y principio nº 8) · la capa de conocimiento con KBI y KB Externa sobre RAG (M12.4) · el agente conversacional técnico para el cliente (M12.5) · el área de cliente en dos niveles (M8.1–M8.4) · la identidad escalonada del portal (M8.5) · la distribución de firmware a clientes registrados (M12.7) · el agendamiento contra la carga real del taller, con factor de holgura (M6.4 y M8.4) · y nuevos KPI de conversión, uso del portal y corrección de datos (M7.1 y M7.7). Subió al MVP el OCR de placas y el QR de identificación (la R08 sacó del MVP la captura asistida; ver M3.4).
También precisó cuatro temas de la R02: el área de clientes, especificada en dos niveles; el acceso al portal, con token para el nivel básico y cuenta para el completo; la capacidad del taller, que pasa de estimación interna a agenda pública; y la IA, que se apoya en una arquitectura de conocimiento explícita.
La R02 — decisiones del 21/08/2026
La R02 incorporó lo decidido el 21/08/2026 sobre el desarrollo de Desk 2.0 y los planes de formación:
Módulo nuevo de gestión del conocimiento y formación en vídeo (M12).
Autocompletado por número de serie, que trae cliente y modelo y asocia el ticket a las órdenes de venta activas (M1.1).
La orden de venta antes de recibir el equipo. (Sustituido el 10/09: la OV es obligatoria para trabajar, no para recibir; M1.2.)
Menú visual con fotos para los accesorios. (Sustituido el 30/09: los accesorios salen del catálogo de artículos, con foto, nombre oficial y número de parte; M1.2.)
La interfaz inicial replica la estructura de Zoho Desk (M10.1).
Piloto de modelado sobre el Grimm EDM 180/280 (M2.1).
Conexión Zoho → PostgreSQL con cliente REST propio y OAuth2, cada tres minutos (M11.1); fuera las hojas de Excel del circuito operativo (M11.1).
La saturación del cron de Zoho quedó resuelta: lo que saturaba era consultar Zoho en vivo; hoy el cron alimenta la base propia y la aplicación consulta PostgreSQL.
1.4 Los tres ejes de valor
Este capítulo responde a una pregunta que las revisiones anteriores no formulaban: para qué se construye Desk 2.0. Los doce módulos describen qué hace la plataforma; los tres ejes explican por qué, y en qué orden.
1.4.1 El esquema
El punto de partida es el Desk actual, en funcionamiento desde 2021, que es la línea base contra la que se mide todo lo demás. Sobre ella se plantean tres ejes:
Eje
Enunciado
Qué produce
Módulos
① Automatización digital
Reducir la carga operativa y el error humano
Dato limpio, capturado bien a la primera, sin texto libre ni retranscripción
M1 · M3 · M10
② Análisis
Programar · Detectar · Calcular
Capacidad conocida, desviaciones detectadas antes de que duelan, fecha calculable
M6 · M7 · M4.2
③ Interacción con clientes
Área de cliente ↔ Comercial
Autoservicio, agendamiento, contenido y un motivo permanente para volver a la plataforma
M8 · M12
Atravesándolos, una capa de conocimiento —arquitectura RAG— con dos bases: KBI, la base interna de Ambientalia, y KB Externa, la que se publica a clientes. Alimenta el diagnóstico y las mini-apps por dentro, y la biblioteca y el agente por fuera.
1.4.2 No son tres bloques, son una cadena
Los tres ejes pesan prácticamente lo mismo en importancia, pero la numeración es el orden de construcción, y ese orden no es arbitrario: cada eje es la condición del siguiente.
El eje ① produce el dato limpio. Sin dato limpio, el eje ② calcula sobre ruido. Sin un cálculo fiable, el eje ③ le promete al cliente cosas que el taller no puede cumplir.
Es la misma restricción que ya figuraba entre las decisiones anteriores —«las herramientas de IA sólo funcionan sobre bases de datos perfectamente estructuradas»— enunciada desde el otro extremo. La diferencia es de énfasis y es importante: la integridad del dato no es un requisito técnico del proyecto, es el producto del primer eje. Quien construya el eje ① no está preparando el terreno para lo interesante; está entregando lo que hace posible todo lo demás.
De ahí también el paso ① → ①' del esquema: no se automatiza el flujo actual tal cual, se rediseña. El flujo construido y verificado en M1.3 es la radiografía —y desde la R04 es una radiografía real, no un dibujo de memoria—; el flujo con pasos eliminados es el objetivo. (La lectura exacta de este paso queda pendiente de confirmación — Anexo D, punto 23.)
1.4.3 El riesgo rector: el error de captura
El eje de Control → ↓ Riesgo del esquema tiene un contenido concreto: los errores humanos de digitación. No es una preocupación abstracta de gobernanza, es el fallo que más lejos llega. Un número de serie mal tecleado en recepción contamina simultáneamente la hoja de vida del equipo, el ticket, el historial del cliente y toda la analítica que después se construya sobre ellos. Y a diferencia de un error de proceso, no se detecta: se propaga en silencio.
Las contramedidas ya están repartidas por el documento, pero conviene verlas juntas, porque forman un solo sistema:
Contramedida
Módulo
Qué error elimina
Número de serie obligatorio en la remisión
M1.1
Registros sin llave de identidad
Autocompletado por serial (trae cliente, modelo y OV)
M1.1
Reescritura de datos que ya existen
OCR de la placa del equipo en recepción
M3.4
Digitación manual del serial y el modelo
QR de identificación en el equipo
M3.4
Identificación por lectura visual del operario
[R08.4] Accesorios del catálogo de artículos, con foto, nombre oficial y número de parte, solo los asociados al modelo
M1.2
Accesorios mal nombrados o no registrados
Listas desplegables en lugar de texto libre
M1 · M2.4
Historial no procesable, nomenclaturas divergentes
[R08.4] Alta del equipo nuevo en el mismo paso que su ticket, con serial, modelo, cliente y fecha de factura; alta manual con el serial tecleado dos veces cuando el equipo no existe
M1.4 · M3.1 · M3.4
Fichas creadas sin datos comerciales
El error de captura tiene una tercera forma: la transcripción. La R05 la encuentra en este mismo documento. La hoja de mapeo de febrero era correcta y el resumen que entró a §M1.3 no lo era; nadie lo detectó durante tres revisiones porque una tabla mal resumida se lee igual de bien que una bien resumida. Vale la regla que ya rige para el dato operativo: la fuente se cita, no se recuerda, y cualquier tabla de este documento que resuma un archivo externo debe poder recomputarse desde él.
El mismo riesgo, entrando por otro sitio:
Todo lo anterior habla de errores de tecleo: alguien escribe mal un dato y el error viaja sin que nadie lo note. La R04 encontró tres fallos que no son errores de tecleo y terminan igual de mal. En los tres, el sistema guarda un dato bien formado, que pasa cualquier validación, y que significa algo distinto de lo que realmente ocurrió:
Lo que el sistema guarda
Lo que parece
Lo que de verdad pasó
Finalizado, en un ticket que se abandonó
Un servicio terminado
El cliente se echó atrás, o el equipo era irreparable (M1.10)
Una Fecha Remisión de Salida válida
La fecha en que se entregó el equipo
La fecha de la última vuelta del ciclo de facturación; la de la entrega real se borró (M1.3.5) Debe ser siempre la fecha real de la primera entrega —R08, ver M1.3.5
Un checkbox obligatorio guardado como «no marcado»
Que alguien respondió que no
Que nadie respondió: el motor dejó pasar la casilla sin marcar (M1.7)
Nadie se equivoca al escribir. El dato entra limpio y miente. Y como miente en silencio, contamina exactamente igual que un serial mal tecleado todo lo que se calcule encima.
La diferencia está en por dónde entra el error —por el flujo, no por el teclado—, y de ahí que las contramedidas de la tabla anterior no sirvan para nada aquí. Ni el OCR, ni el QR, ni los desplegables evitan que un ticket abandonado se cierre como terminado. Hacen falta otras tres:
Contramedida
Módulo
Qué error elimina
Que exista el estado que falta: Anulado, con motivo
M1.10 · C2
Servicios abandonados contados como cumplidos
Que un campo no se pise: primera fecha de salida no sobreescribible
M1.3.5 · C4
OTD calculado sobre la última vuelta del ciclo
Que una guarda bloquee de verdad: [R08.4] la liberación sin factura exige motivo de lista cerrada y fecha prevista de facturación, y solo la ejecuta el Director Comercial
M1.3.5 · M1.7 · C1
Liberación sin factura afirmada por nadie
Que ningún estado atrape el ticket: [R08.4] salidas decididas para los estados de espera; la caducidad avisa y sugiere, nunca ejecuta sola
M1.3.4 · C3
Tickets vivos que no aparecen en ningún backlog
[R08.4] Estado a 01/10/2026: C1 está construida. C2, C3 y C4 están decididas (23/09) y se construyen después del corte, en F1C-01, F1C-03 y F1C-02. Antes del corte entra solo la restricción de «Liberación sin factura» por cargo, con motivo y fecha prevista de facturación.
Consecuencia de priorización. Si el riesgo rector es el error de captura, van primero las contramedidas que actúan en el momento en que el dato entra al sistema. Por eso la R03 subió al MVP el OCR de placas y el QR de identificación. [R08.4] La R08 sacó la captura asistida del MVP (M3.4). Antes del corte, el riesgo se ataca con el serial obligatorio y el código de ticket derivado de él, el autocompletado, las listas cerradas y el alta manual con el serial tecleado dos veces (M1.1 y M3.4).
1.4.4 El tercer eje es producto, no soporte
La interacción con clientes no se plantea como una mejora del servicio de atención, sino como el gancho comercial del producto de contratos de mantenimiento. Esa diferencia cambia el diseño: un portal de soporte se mide por llamadas evitadas; un portal que es producto se mide por contratos firmados y renovados.
De ahí el modelo de dos niveles que especifica M8: un nivel básico para todos los clientes —que ya paga su coste en llamadas evitadas y en aprobaciones más rápidas— y un nivel completo bajo contrato, que incorpora la KB Externa, el firmware, el agente y el agendamiento en firme.
Conviene notar que esta dirección ya estaba insinuada en una decisión anterior: el piloto de «aprobación en un clic» acordado el 14/08 se hace con clientes que tienen contrato de mantenimiento activo. La R03 sólo nombra lo que aquella decisión ya suponía.
1.4.5 Correspondencia con los módulos
Rama del esquema
Contenido
Dónde se especifica
① Automatización digital → ↓ Operativa
Blueprints, estados, captura sin error, movilidad
M1 · M3 · M10
Control → ↓ Riesgo
Permisos por área y cargo, auditoría inmutable, ISO 9001, contramedidas de captura. [R08.4] Las medidas de este eje no dependen de la acreditación; la 17025 añade requisitos a la calibración y al certificado (ver M9.2).
M1.9 · M9 · M11.4 · §1.4.3
② Análisis → Programar
[R08.4] Asignación de trabajo construida sobre el modelo de usuario, área y cargo y sobre la derivación de M1.9.2, no como pieza independiente: carga definida por usuario (horas disponibles por técnico); calendario de capacidad = calendario laboral (construido en F1B-12) + disponibilidad de cada usuario (pendiente); enrutamiento automático solo a usuarios con el área y el cargo que permiten ejecutar la transición siguiente. Va después del corte y es condición previa del CTP (corrección del 30/09, E-098).
M6 · M1.9.2
② Análisis → Detección
Cuellos de botella, reincidencias, alertas de desviación
M7.3 · M7.4
② Análisis → Calcular
Simulador CTP, predicción de carga
M4.2 · M7.4
Calcular → Citas
Disponibilidad del taller expuesta como agenda al cliente
M6.4 · M8.4
③ Área Cliente ↔ Comercial
Portal en dos niveles, aprobación, seguimiento
M8.1 – M8.5
③ HV's · Vídeos · Mtto. básico · PDFs · FW/SW · Citas
Contenido y servicios del portal
M8.3 · M8.4 · M12
RAG → KBI
Copiloto de diagnóstico, mini-apps, troubleshooting interno
M12.4 · M2.6 · M10.4
RAG → KB Externa + Agente
Biblioteca del cliente y agente conversacional técnico
M12.4 · M12.5 · M8.3
1.5 Qué es Desk 2.0
Desk 2.0 no es «otro sistema de tickets». Es una plataforma de operaciones que combina tres naturalezas que hoy están separadas en Ambientalia:
Naturaleza
Qué aporta
Referente de mercado
CMMS / EAM
Hojas de vida de equipos, taxonomía de activos, historial de intervenciones, garantías, análisis de confiabilidad.
IBM Maximo, SAP EAM, Fracttal
Service Automation (taller)
El mantenimiento es el producto que se vende: diagnóstico → cotización → aprobación → reparación → entrega → factura.
Infraspeak, Odoo SAT
Field / Mobile Service
UX conversacional para el técnico, checklists, fotos, firma, offline.
MaintainX, Tractian
El matiz crítico, señalado explícitamente en el Estudio Funcional de Taller: a diferencia de un CMMS de planta, aquí el activo es del cliente y existe un proceso de venta intermedio. Por eso el KPI rector no es el MTBF sino el cumplimiento de la fecha prometida (OTD) y el turnaround time.
1.6 Visión y principios de diseño
1. La UX es el motor de la integridad de los datos, no cosmética. Si reportar una falla toma 15 clics, el técnico no lo hará o lo hará mal. El estándar es fricción mínima: interfaz conversacional, foto instantánea, dictado por voz, formularios que se adaptan al contexto.
2. Complejidad oculta. El sistema maneja datos complejos (jerarquía ISO 14224, costos, reservas de inventario) pero los presenta con la simplicidad de una app de consumo.
3. El sistema fuerza la ruta lógica. Acuerdo del 14/08: el diseño debe obligar al usuario —técnico y cliente— a seguir la secuencia estipulada, eliminando ambigüedades, nomenclaturas obsoletas y errores humanos.
4. Fin del texto libre en etapas críticas. Acuerdo del 20/08: se elimina la dependencia de comentarios manuales; todo se maneja con listas desplegables, transiciones y estados predefinidos, para que los datos sean procesables.
5. La fecha de entrega no se adivina, se calcula. El compromiso comercial se deriva de la carga real del taller y del lead time de repuestos, no de la intuición.
6. Arquitectura lista para IA desde el día uno. Los datos se guardan limpios y etiquetados para entrenar modelos futuros. Las herramientas de IA sólo funcionan si las bases de datos están perfectamente estructuradas antes.
7. Primero «as-is», después rediseño. Acuerdo del 17/02 y 19/02: se documenta el proceso tal como funciona hoy para tener la radiografía exacta, antes de proponer flujos alternativos.
8. El cálculo es determinista; la IA recupera, no compromete. (Principio nuevo en R03, [PROPUESTO].) La fecha prometida, la carga del taller y la disponibilidad de agenda se calculan con reglas y datos sobre PostgreSQL, nunca mediante un modelo de lenguaje. La capa RAG recupera documentación y asiste el diagnóstico; no interviene en ninguna cifra que constituya un compromiso con el cliente. El motivo es simple: una alucinación en una fecha de entrega es un incumplimiento contractual.
1.7 Los dolores que Desk 2.0 debe resolver
#
Dolor detectado
Origen
Módulo que lo resuelve
1
La fecha de entrega se promete sin visibilidad de la carga del taller ni del stock de repuestos. Pone en riesgo el SLA del 90 %.
Estudio Taller
M4 (CTP) + M6 (capacidad)
2
El equipo queda bloqueado semanas o meses esperando la orden de compra del cliente, ocupando mesa de trabajo.
Decisiones 14/08
M4 (aprobación 1 clic + cola de espera)
3
Nomenclatura CG/MT: un equipo entra por calibración, se detecta falla y requiere correctivo → duplicidad y confusión de códigos.
Decisiones 14/08
M1.1 (código único por serial; prefijos suprimidos en los tickets nuevos, 30/09)
4
No se sabe quién asume cada etapa; el traspaso entre técnicos no se formaliza. [R08.4] Protocolo de traspaso: ver el párrafo bajo la tabla y M1.9.2.
Decisiones 14/08
M1.9.2 (derivación y protocolo de traspaso)
5
El historial vive en comentarios de texto libre imposibles de procesar automáticamente.
Decisiones 20/08
M1 + M3 (estados y campos)
6
Riesgo de perder el rastro de equipos entregados pendientes de cobro («por entregar sin facturar»).
Decisiones 19/02
M1.3.5 (dos ramas sin ciclo y estado Pendiente de facturar, 23/09)
7
El flujo obliga a todos los tickets a pasar por revisión técnica y comercial, incluso los que no tienen novedad.
Decisiones 17/02
M1 (ramificación por tipo)
8
Cualquier técnico ve y ejecuta transiciones que no le corresponden.
Decisiones 20/08
M1.9.1 (permisos por área y cargo; nivel cargo construido)
9
El cron cada 3 minutos contra los servidores de Zoho satura el sistema.
Decisiones 14/08
M11 (BD propia Postgres) — resuelto
10
Licencias por usuario de Zoho limitan el número de agentes y el enrutamiento automático.
Decisiones 19/02
M11 (plataforma propia)
11
No se puede medir el bodegaje de entrada: no hay disparador claro de «Ingreso a servicio».
Decisiones 17/02
M7 (timestamps de transición)
12
Reproceso en «Habilitar servicio»: se vuelven a pedir datos comerciales que ya están en el ticket.
Decisiones 17/02
M1 (checkbox de validación)
13
El conocimiento técnico («el cómo») depende de personas concretas y genera consultas repetitivas de clientes y personal nuevo.
Decisiones 21/08
M12 (formación en vídeo + KBI)
14
La operación sigue apoyada en herramientas fragmentadas: n8n, Zoho Desk 1.0 y hojas de cálculo de Excel.
Decisiones 21/08
M11 (centralización)
15
Errores humanos al registrar los accesorios que acompañan al equipo en recepción.
Decisiones 21/08
M1.2 (accesorios del catálogo de artículos, con foto, nombre oficial y número de parte, 30/09)
16
Si Servicio Técnico recibe el equipo sin orden de venta previa, la trazabilidad queda bloqueada.
Decisiones 21/08
M1 (OV obligatoria en Habilitar Servicio, no en la recepción — R08.2)
17
Los errores de digitación en la captura —serial, modelo, accesorios— contaminan a la vez la hoja de vida, el ticket y todo el histórico, y se propagan sin detectarse.
Esquema 21/08
M1 + M3 (OCR, QR, autocompletado, desplegables)
18
El cliente no tiene ningún motivo permanente para volver a la plataforma, y el contrato de mantenimiento carece de una prestación digital que lo diferencie.
Esquema 21/08
M8 (portal en dos niveles) + M12 (KB Externa)
19
La disponibilidad del taller no es consultable por el cliente: cada cita nace de una llamada o un correo que alguien tiene que transcribir.
Esquema 21/08
M6.4 + M8.4 (agendamiento)
20
Cuatro estados de espera no tienen salida de emergencia: un ticket aparcado ahí sólo sale editando la base de datos a mano.
Código (R04)
M1.3.4 — corrección C3 (decidida el 23/09; F1C-03, después del corte)
21
No existe la anulación. Un servicio abandonado se cierra como Finalizado, y eso contamina las tres métricas de servicios cumplidos.
Código (R04)
M1.10 — corrección C2 (decidida el 23/09; F1C-01, después del corte)
22
Un checkbox declarado obligatorio se puede dejar sin marcar y la transición se ejecuta igual — justo el que deja salir un equipo sin factura.
Código (R04)
M1.7 · M11.7 — corrección C1 (construida)
23
El ciclo entre Por Facturar y Por Entregar / Sin facturar se puede recorrer indefinidamente, y cada vuelta borra la fecha de la primera entrega. Decidido el 23/09: dos ramas sin ciclo, y la fecha de remisión de salida se escribe una sola vez —ver M1.3.5
Código (R04)
M1.3.5 — corrección C4 (F1C-02, después del corte)
24
El indicador de bodegaje de entrada quedó inválido para 2026: se calcula contra la fecha de creación del ticket, y ahora Comercial crea el ticket antes de que el equipo llegue. Definición y fórmulas resueltas en la R08 —ver M1.10, «Los tres bodegajes»
Diccionario (R05)
M1.10 — corrección C9 (bodegajes de entrada y proceso construidos)
25
Verificación, en el flujo de equipo nuevo, no tenía transición de salida. [R08.4] Corregido en la R08.2: la salida Verificación —Liberación→ Finalizado existe (71 usos). La guarda de Verificación por tipo de equipo y gas patrón se construye en F1A-03.
Hoja 03/02 (R05)
M1.4 — corrección C12
26
Reglas que estaban escritas en el mapeo se perdieron al implementar: la condición del checkbox de liberación, la restricción por cargo y el SLA de un día sobre Notificado.
Hojas + Zoho (R05)
M1.7 · M1.9.1 — correcciones C10 y C11 (C11 construida en horas hábiles; C10 construida en su nivel cargo)
[R08.4] Protocolo de traspaso (dolor nº 4). Cada transición deriva el ticket a un área y, cuando la regla lo dice, a una persona concreta: «quien tomó el ticket», el técnico a cargo o el encargado de inventario. Cada traspaso queda registrado con la persona de origen, la persona o el área de destino, la fecha y la hora. Quien recibe ve el ticket en «Mis tickets» y recibe un aviso en la aplicación y por correo. La reasignación entre técnicos de la misma área exige un motivo y queda trazada. Hoy están construidas la derivación por área y la de «quien tomó el ticket»; el resto es propuesta de esta revisión. Detalle en M1.9.2.
1.8 Decisiones estructurales ya tomadas
Estas decisiones las ha tomado Gerencia y condicionan todo el diseño. El detalle y la justificación de cada una está en el Anexo C; las del 17/09/2026 en adelante, en el Anexo C.12. [R08.4] Las filas que una decisión posterior modificó dicen ya lo vigente.
Decisión
Fecha
Implicación
La plataforma se construye sobre base de datos propia en PostgreSQL; la conexión con Zoho será de solo lectura.
14/08/2026
Independencia, velocidad y protección de la integridad del dato.
Se elimina la nomenclatura CG/MT. El identificador del ticket pasa a basarse en el número de serie, asociado a cliente, modelo y fecha.
14/08/2026
Fin de la duplicidad de códigos entre calibración y correctivo. [R08.4] El 30/09 se suprimen los cinco prefijos en los tickets nuevos (M1.1).
El número de serie es obligatorio en la creación de la remisión.
14/08/2026
Trazabilidad garantizada desde el ingreso.
El blueprint se dispara con un desplegable inicial (Equipo Nuevo / Servicio / Soporte Remoto) que oculta pasos innecesarios.
14/08/2026
Un solo sistema, múltiples ramas.
La inspección técnica se diseña por fases lógicas secuenciales de macro a micro. [R08.4] Precisado el 23/09: los niveles macro son propios de cada marca y comunes dentro de cada familia; el motor es uno y cada equipo entra como datos de su catálogo.
14/08/2026 · 23/09/2026
Se descarta categorizar por sistemas como eje principal. Incorporar un equipo es configuración, no desarrollo (M2.1).
La priorización es automática según criterios comerciales; se bloquea la edición manual por el técnico. [R08.4] Excepción: la prioridad de los clientes Top 5 se fija a mano sobre el cliente, y la pone el Director Comercial (23/09).
14/08/2026
[R08.4] La cola —«Mis tickets» y el tablero— se ordena en el servidor por prioridad y, dentro de cada una, por la hora de «Habilitar Servicio» (M1.9.1).
El sistema formaliza el traspaso de tickets entre agentes al cambiar de fase.
14/08/2026
Trazabilidad de responsabilidad por etapa. Protocolo de traspaso en M1.9.2.
Se inician pruebas piloto de «aprobación en un clic» con clientes con contrato de mantenimiento activo.
14/08/2026
Ataca el cuello de botella de la OC y anticipa el modelo de portal escalonado.
Miguel y Julián se reorientan de programar la herramienta a digitalizar el conocimiento técnico.
14/08/2026
El equipo técnico actúa como generador de conocimiento.
Los equipos nuevos los da de alta el área Comercial/Administrativa en cuanto se conocen los seriales, con cliente y fecha de factura. [R08.4] Desde el 24/09, el equipo nuevo se registra en el mismo paso que su ticket (M1.4).
20/08/2026
Habilita el control automático de garantía.
Se mantiene la codificación interna actual (serial + modelo) por trazabilidad ISO 9001.
20/08/2026
Cumplimiento normativo.
Se restringen permisos y vistas por rol. [R08.4] Concretado el 23/09: el área es la base y el cargo solo restringe (ver la fila de esa fecha).
20/08/2026
Seguridad y limpieza operativa.
Las transiciones clave alimentan automáticamente la hoja de vida del equipo.
20/08/2026
Fin del historial en texto libre.
Se usa el artefacto de auditoría de blueprints generado con IA como herramienta de mejora continua.
20/08/2026
Detecta estados sin salida y checkboxes saltables. Su primer resultado incorporado es la R04.
La interfaz inicial de Desk 2.0 replicará la estructura de Zoho Desk, con blueprints mucho más controlados y completos.
21/08/2026
Reduce la curva de adaptación del equipo técnico.
El disparador del flujo será un menú inicial que define la rama de trabajo.
21/08/2026
Ratifica y precisa la decisión del 14/08.
Se usa el modelo Grimm EDM 180/280 como proyecto piloto para modelar las fases de diagnóstico.
21/08/2026
Es el equipo más complejo; estandarizarlo facilita adaptar Horiba y Environics.
El orden de construcción es ① automatización → ② análisis → ③ interacción con clientes, siendo los tres de importancia prácticamente equivalente.
21/08/2026
Cada eje es la condición del siguiente; no se pueden solapar sin degradar el resultado.
La capa de conocimiento se divide en dos bases: KBI (interna, Ambientalia) y KB Externa (clientes).
21/08/2026
Audiencias, contenidos y responsabilidades distintas; no es un mismo repositorio con permisos.
El agente conversacional atiende al cliente únicamente en temas técnicos, sobre la KB Externa.
21/08/2026
Impide que la IA adquiera compromisos comerciales no autorizados.
El área de cliente se estructura en dos niveles: básica (hojas de vida y aprobación de cotizaciones) para clientes sin contrato, y completa (+ KB Externa) para clientes con contrato.
21/08/2026
Convierte la plataforma en argumento de venta del producto de contratos de mantenimiento.
Ambientalia puede redistribuir firmware y software de los fabricantes únicamente a clientes registrados.
21/08/2026
Obliga a cuenta registrada y a registro de descargas.
El agendamiento de citas se apoya en el cálculo de carga del taller, mostrando disponibilidad real al cliente.
21/08/2026
La capacidad deja de ser una estimación interna y pasa a ser compromiso público.
Se simplifican los tipos de evento: los tres «operativos» se fusionan en Operativo.
17/02/2026
Categorización más medible. [R08.4] Desde el 23/09 cada transición lleva uno de cuatro tipos (M1.8).
En «Habilitar servicio» se usa un checkbox «Cumple condiciones comerciales».
17/02/2026
Elimina reproceso.
El mapeo se documenta as-is antes de rediseñar rutas abreviadas.
17/02 y 19/02
Base de comparación para medir la mejora.
Se usa la base de costos e historial de reparaciones como argumento comercial.
19/02/2026
El dato como activo comercial.
El listado de 78 puntos de control del diagnóstico Grimm evoluciona a árbol de decisiones.
19/02/2026
Núcleo del diagnóstico guiado (M2).
La derivación no puede frenar un ticket: la casilla «Derivado a» existe en todas las transiciones y ninguna la exige.
Código (R04)
Trazabilidad de responsabilidad sin coste de fricción.
Las etapas que proponen destinatario nombran un cargo, no una persona.
Código (R04)
Un identificador de persona ataría el flujo a que ese empleado siga en la empresa.
La columna Clasificaciones es el campo que dispara las ramas del blueprint. Ya existe en Zoho.
As-is (R05)
El «menú inicial» decidido el 14/08 no es una funcionalidad nueva: es la que ya está, mejor presentada.
El Tiempo promesa lo fija Servicio Técnico al escalar el diagnóstico a revisión, y es campo obligatorio.
As-is (R05)
El compromiso de fecha nace en el taller, no en Comercial. [R08.4] Desde el 30/09, al cliente se le comunica un tiempo promesa global —tiempo de diagnóstico más días de entrega— y el CTP parte de él (M4.1).
La prioridad del ticket está atada a la calificación del cliente (High para contratos y clientes con análisis favorable, Low para desfavorable).
As-is (R05)
La priorización automática decidida el 14/08 tiene su criterio y su origen de dato. [R08.4] Un cliente con contrato vigente hace nacer sus tickets en Alta; si además es Top 5, manda la más alta de las dos (24/09).
Se frenó el desarrollo hasta consensuar el documento maestro, para después trocear el proyecto por fases y prioridades.
27/08/2026
El proyecto pasó de exploración técnica a definición. [R08.4] Hecho: el plan de fases R01.3 ordena el desarrollo, que está en marcha. La meta de versión operativa al 31/12/2026 la sustituye el corte en dos tiempos (fila del 24/09).
Arquitectura híbrida del diagnóstico: los niveles macro son transiciones de estado; dentro de cada uno, un checklist dinámico parametrizado por marca y modelo.
27/08/2026
Incorporar un equipo nuevo deja de ser desarrollo y pasa a ser configuración. [R08.4] Las cuatro macro-fases comunes del 27/08 quedan superadas: los niveles macro son propios de cada marca (23/09). Cierra el punto 45.
Una orden de venta puede subdividirse en subórdenes con formato OV-AAAA-NNN-SS, con un ticket por subservicio.
27/08/2026 · 10/09/2026
Habilita el informe trimestral de avance de contrato y corrige la lectura de consumibles reservados.
El código interno del cliente entra como identificador secundario de búsqueda; el serial sigue siendo el primario.
27/08/2026
Las órdenes de compra y las remisiones llegan referenciadas por ese código, no por el serial.
El aplicativo sustituye carpetas y archivos por captura en base de datos, con entregables generados por plantilla.
27/08/2026
Fin de la creación manual de carpetas. [R08.4] Los documentos siguen en Google Drive, enlazados (21/09). La migración del histórico va aparte (M3.5).
El protocolo se extiende a informe de salida para todo tipo de servicio, con evidencia fotográfica.
27/08/2026
Cubre el vacío entre el ingreso del equipo y el informe de diagnóstico.
La seguridad y el portal de cliente pasan a etapa independiente, posterior a la versión interna.
27/08/2026
El objetivo inmediato es la parte interna del sistema.
Se conserva una vía de escape manual para el cambio de estado en casos especiales, con traza.
27/08/2026
Ninguna transición prevista cubre todos los casos; la alternativa es editar la base de datos sin dejar rastro.
El QR del certificado, el cálculo de incertidumbre y las etapas de validación con firma entran como requisitos, en fase posterior.
27/08/2026
El QR debe dirigir al área de cliente, no al PDF. [R08.4] La validación del informe con tres firmas está decidida (24/09; M2.5).
Las dos entradas del flujo no se cruzan, para no sacar del sincronismo un ticket venido de Zoho.
Código (R04)
Remisión creada solo existe para los tickets nacidos en la aplicación; condiciona toda métrica por estado inicial.
[R08.2] La OV es opcional al crear el ticket y obligatoria en Habilitar Servicio: «obligatoria para trabajar, no para recibir».
10/09/2026
Cierra el punto 21. El equipo espera la OV en Remisión creada, estado de espera de Comercial. [R08.4] Alarma a los 3 días hábiles al Coordinador Comercial, solo si el ticket no tiene OV. (Sustituye a lo decidido el 21/08: la OV antes de recibir el equipo.)
[R08.2] Cardinalidad 1 ticket : N OV. La OV global por lote se sustituye por subórdenes OV-AAAA-NNN-SS.
10/09/2026
Cierra el punto 52 y revisa el formato de subórdenes del 27/08. Ver M4.4.
[DECIDIDO 17/09/2026 — R08.4] La aplicación no escribe en Zoho por ahora. Si hace falta, un «espejo de Zoho» permitirá comparar y corregir a mano hasta que se active la escritura (p44-escritura-zoho).
17/09/2026
Zoho solo se lee; entre el corte y la independencia se consulta en solo lectura. Cierra el punto 44.
[DECIDIDO 21/09/2026 — R08.4] Los flujos comercial y posible-cliente se quedan en Zoho CRM; no entran en Desk 2.0 en 2026 (flujos-comercial).
21/09/2026
M1.11 y M1.12 quedan como documentación. El punto 42 sigue abierto.
[DECIDIDO 21/09/2026 — R08.4] Los documentos de servicio siguen en Google Drive, enlazados desde Desk 2.0, por la capacidad de almacenamiento del servidor (p8-p54-drive).
21/09/2026
Cierra los puntos 8 y 54. El respaldo alcanza la carpeta de documentación de servicio (M11.5).
[DECIDIDO 21/09/2026 — R08.4] Si la orden de venta se eligió en la aplicación, manda la aplicación y la sincronización no la pisa, ni el número ni su fecha; si no, manda Zoho (e005-iv4-iv11).
21/09/2026
La discrepancia no se pierde: se avisa a Comercial en la bandeja de la cabecera (23/09; M1.10 y M4.4).
[DECIDIDO 23/09/2026 — R08.4] Permisos: el área es la base y el cargo solo restringe, con una lista corta de excepciones. Siete cargos con nombre oficial: Director Técnico, Coordinador Técnico, Técnico, Técnico de campo, Director Comercial, Coordinador Comercial y Asistente Comercial (c10-permisos-cargo, c10b-gerente-director).
23/09/2026 · 24/09/2026
Liberación sin factura y prioridad de los Top 5 → Director Comercial; OVI de garantía → Director Técnico. El nivel «propietario del registro» se aplaza, salvo para las salidas de emergencia (M1.9.1).
[DECIDIDO 23/09/2026 — R08.4] Correcciones del blueprint: estado Anulado con cinco motivos (C2), salidas de los estados de espera (C3), dos ramas de facturación sin ciclo (C4), tipo de evento (C5), Control de calidad (C6) y reloj del SLA con lista propia (C7).
23/09/2026
Se construyen en la épica 1C después del corte, salvo la restricción de liberación sin factura por cargo, que entra antes. Detalle en M1.3 a M1.10 y M9.1.
[DECIDIDO 24/09/2026 — R08.4] Días hábiles con un calendario laboral único: lunes a viernes de 8 a 17 h, festivos de Colombia calculados por año y cierres de empresa, con una sola función de horas y días hábiles (calendario-habil).
24/09/2026
Lo usan las alarmas, el reloj del SLA, el tiempo promesa y la fecha prevista de facturación; ninguna otra pieza calcula su propio horario. Construido en F1B-12.
[DECIDIDO 24/09/2026 — R08.4] Corte en dos tiempos: corte operativo el lunes 14/12/2026 e independencia total en enero de 2027, cuando estén verificadas la repatriación del histórico (1G) y el correo propio (1H) (fecha-corte, corregida el 24/09).
24/09/2026
Antes del corte entra la paridad con Zoho Desk; lo que Zoho no tiene, después. Plan A: corte único el 01/02/2027 (§1.9).
[DECIDIDO 24/09/2026 — R08.4] El cuerpo del maestro describe reglas de negocio; la comparación con lo construido vive solo en el Anexo H, que se genera desde el barrido de reconciliación (p62-capa-as-built).
24/09/2026
Cierra el punto 62. Ver §1.10.
1.9 Alcance, hitos y plazos
[DECIDIDO 24/09/2026 — R08.4] El plan vigente es el corte en dos tiempos (decisión fecha-corte, corregida el 24/09; plan de fases R01.3). Sustituye a la primera versión de esa misma decisión —corte en seco el 14/12 con el 21/12 como fecha límite— y a la meta de versión operativa al 31/12/2026 fijada el 27/08.
Calendario
Fecha
Hito
Estado a 01/10/2026
24/09/2026
Cuenta del margen del plan R01.3
Hecha: +1,9 a +2,2 semanas, por encima de la semana que exige Gerencia. El plan A no se activa
Miércoles 09/12/2026
Confirmación del corte. Dos condiciones: crear y mover tickets en Desk 2.0, y pruebas con servicios reales superadas
Previsto
12–13/12/2026
Migración de los tickets abiertos de Zoho a su estado equivalente en Desk 2.0 (F1F-01)
Previsto
Lunes 14/12/2026
Corte operativo. Los tickets nacen en Desk 2.0 y Zoho Desk queda en solo lectura. Hasta que exista el correo propio, las respuestas al cliente salen del correo corporativo y se registran en el ticket
Previsto
Antes del 21/12/2026
Renovación de 2 licencias de Zoho en facturación mensual, de solo lectura, para consultar el histórico; no se renueva en anual (corte-licencias-plan-a)
Decidido el 24/09
Enero de 2027
Independencia total. Repatriación del histórico (1G) y correo propio (1H) verificados; baja de las licencias de Zoho
Previsto
Lunes 01/02/2027
Plan A: corte único, si no quedara al menos una semana de margen
No se activa, según la cuenta del 24/09
2027 · T2
Servicio en sitio como cuarta rama del blueprint (anexo-43-en-sitio)
Decidido el 24/09
Qué entra antes del corte: paridad con Zoho Desk. Fase 0 (salvo F0-06) y las épicas 1A, 1B y 1F. De 1C, solo la restricción de «Liberación sin factura» por cargo, con motivo de lista cerrada y fecha prevista de facturación; la alarma por fecha vencida llega con F1C-02, después del corte (corrección del 30/09). Entran también, con nombre propio: alta y edición del equipo (F1B-14), calendario laboral (F1B-12), respaldo (F1F-02), continuidad de indicadores y encuesta (F1F-05), migración de tickets abiertos (F1F-01) y pruebas antes del corte (F1F-03).
En enero de 2027: 1G (1G-01 a 1G-04) y 1H (1H-00 a 1H-03).
Después del corte, sin fecha: las otras siete correcciones de 1C, 1D (diagnóstico con checklist), 1E (informes), F0-06 y el mapa del blueprint dentro de la aplicación.
Primera tarea de persona: las medidas M1, M2 y M3 del plan de independencia, que fijan la talla de 1G y 1H (Parte 3).
Estado a 01/10/2026. La aplicación ya está en uso (Desk_2_R1.023) y Claude Code trabaja en modo producción: encadena tandas y solo se detiene en cinco casos previstos. El plan cuenta 66 tandas, de las que 35 entran antes del corte; a 01/10 hay 19 cerradas (el barrido de reconciliación cuenta 18; F0-04, cerrada sin su parte de staging, no figura en él). Abiertas o parciales: F1A-03 (Verificación, desbloqueada el 28/09), F1B-04 (recepción), F1B-07 (prioridad Top 5, en curso), F1B-08 (tablero y alarmas en horas hábiles construidos; faltan las «vistas equivalentes a Zoho»), F1B-11 (falta la ampliación de contrato) y F1C-05 (nivel cargo construido; falta el propietario del registro). Detalle tanda a tanda en la Parte 3 y en el Anexo H.
Entregables y compromisos
Entregable o compromiso
Plazo
Estado a 01/10/2026
Mapeo as-is de los cinco flujos
02–19/02/2026
Completado y verificado en la R05. Servicio técnico (16/02) coincidía con el código en las 34 transiciones; equipo nuevo y soporte remoto (03/02); comercial y posible-cliente (05/02)
Diccionario de campos de la tabla de tickets
—
Reconstruido en la R05: 59 columnas, Anexo G
Blueprint de servicio técnico en la aplicación
—
[R08.4] La aplicación está en uso. 34 transiciones en el código; pasan a 31 con las correcciones del 30/09, que se construyen antes del corte. Equipo nuevo (6 transiciones) y soporte remoto (4), construidos en F1B-06
Conexión Zoho → PostgreSQL mediante cliente REST propio con OAuth2
—
Lograda (confirmado el 21/08/2026)
Documento maestro consensuado, previo a reanudar el desarrollo
Compromiso del 27/08
[R08.4] Hecho: la R08.4 es el documento definitivo del plan, y el desarrollo está en marcha
Prototipo de checklist dinámico sobre el Grimm EDM 180
Compromiso del 27/08
Sin confirmación de entrega a 01/10
Excel de la fase de inspección física del Grimm EDM 180 (Gustavo y Johny)
Compromiso del 27/08
[R08.4] Hecho: primera etapa realizada y socializada (GN, 01/10)
Consolidado del listado de códigos internos de cliente (Gustavo)
Compromiso del 27/08
[R08.4] Hecho: enviado a Gerencia (GN, 01/10)
Flujo de construcción del informe de servicio en el documento
Compromiso del 27/08
Sin confirmación de entrega a 01/10. Ya están decididos la validación con tres firmas y el origen de las remisiones de entrada (M2.5); el módulo de informes (1E) va después del corte
Esquema de niveles macro y micro del Grimm
—
[R08.4] Recogido en el catálogo Grimm v1.8: 8 niveles macro (decisión del 23/09; M2.1)
Árbol de decisiones del diagnóstico Grimm (Gustavo)
Sin fecha
Sin confirmación de entrega a 01/10
Estandarización de SKUs por fase lógica de revisión
Sin fecha
Sin confirmación de entrega a 01/10
Migración del histórico
12–13/12/2026 y enero de 2027
[R08.4] Definida: tickets abiertos el 12–13/12 (F1F-01); repatriación del histórico de Zoho en 1G (enero de 2027); los documentos siguen en Drive, enlazados; carga masiva del histórico documental a las hojas de vida, después del corte (M3.5)
Respaldo del sistema
Antes del corte (F1F-02)
[R08.4] Decidido: responsable Alfonso; copia nocturna y copia previa a cada cambio, adelantadas sin esperar a diciembre. No puede arrancar hasta que se elija el proveedor del destino, que sigue abierto (M11.5)
Seguridad del portal de cliente
Sin fecha
Sin responsable asignado (punto 57)
Correcciones C1–C12 del flujo implementado
Antes y después del corte
[R08.4] C1 y C11 construidas; C10 construida en su nivel cargo; C9 en parte; C12 (Verificación) en curso en F1A-03; C2 a C7 decididas el 23/09 y se construyen en la épica 1C después del corte, salvo la restricción de liberación sin factura por cargo, que entra antes. Ver el Anexo H.3
Setup de grabación en el laboratorio y primer vídeo piloto
Sin fecha
Sin confirmación de entrega a 01/10
Índice de temas a grabar y plan semanal de grabación
Sin fecha
Sin confirmación de entrega a 01/10 (punto 17)
Piloto «aprobación de diagnóstico en un clic»
Sin fecha; con clientes bajo contrato
Por estructurar
Área de cliente — nivel básico (hoja de vida reducida y aprobación de cotizaciones)
Después de la versión interna
[R08.4] Etapa independiente, posterior a la versión interna (27/08); sin fecha
Área de cliente — nivel completo (KB Externa, firmware, agendamiento)
2027 · S1
Depende de la capa RAG y del parámetro de carga
Matriz de contenidos por nivel de contrato
Sin fecha
Sin confirmación de entrega a 01/10 (Alfonso / Comercial; punto 18)
Nota de foco. El acuerdo del 14/08 es explícito: el enfoque no es el diseño estético de la plataforma, sino un producto 100 % funcional. [R08.4] Desde el 24/09 se concreta así: antes del corte del 14/12 entra la paridad con Zoho Desk, y lo que Zoho no tiene se construye después.
1.10 Cómo leer la Parte 2
La especificación funcional se organiza en doce módulos. Cada módulo agrupa las ideas provenientes de las distintas fuentes, marcando su origen cuando resulta relevante y distinguiendo:
[CONSTRUIDO] — [R08.4] lo que hace hoy la aplicación, que está en uso (Desk_2_R1.023). Sustituye a la marca [AS-BUILT] de las revisiones R04 a R08.3. Desde la R08.4 el cuerpo no cita rutas de ficheros, números de línea, nombres de funciones ni commits (p62-capa-as-built, 24/09): donde un pasaje construido contenía una regla decidida, se reescribe como regla de negocio y pierde la marca. La comparación entre lo planificado y lo construido vive solo en el Anexo H, que se genera desde el barrido de reconciliación del repositorio, con la fecha y la versión contra la que se midió.
[AS-IS] — cómo funciona el proceso en Zoho Desk según las hojas de mapeo de febrero de 2026. Desde la R05 estas hojas son la fuente citada, no un resumen de segunda mano.
[DECIDIDO] — decidido por Gerencia, con su fecha; entra al diseño sin discusión adicional. El registro de cada decisión está en el Anexo C.
[PROPUESTO] — idea recogida en los estudios, en Notion o en el panel, pendiente de decisión.
[ABIERTO] — punto sin resolver que requiere una definición antes de construir. Lleva su número del Anexo D.
[R08], [R08.2], [R08.4]… — la revisión que introdujo o reescribió el texto. Ver §1.11.
1.11 Cómo se revisa este documento (Man on the Loop)
Este documento no se escribe de una sola mano. Lo redacta un asistente a partir de las fuentes —decisiones de Gerencia, hojas de mapeo, diccionario y código— y lo revisa una persona, que lo lee entero y anota sus observaciones sobre el propio texto. Ese es el esquema de supervisión del proyecto: la máquina propone y consolida; la persona decide, corrige y descarta.
El ciclo de revisión
Paso
Quién
Qué produce
1. Redacción
Asistente
Una revisión completa a partir de las fuentes disponibles.
2. Anotación
Revisor humano
Observaciones resaltadas sobre el texto.
3. Proceso
Asistente
Cada observación se integra, se responde o se convierte en punto abierto. Ninguna se descarta en silencio.
4. Registro
Asistente
El Anexo I deja constancia de qué se hizo con cada una.
Cómo entra lo decidido al maestro
[DECIDIDO 24/09/2026 — R08.4] (anexo-61-incorporacion; cierra el punto 61.)
Canal de entrada. Gerencia responde y anota en el panel de supervisión: el apartado 06 reúne las preguntas y sus respuestas, que son las decisiones, y el apartado 07, las ideas, reglas y correcciones. Una tarea programada, los lunes y los jueves, recoge lo nuevo del panel y lo registra en el repositorio.
Fuente de lo decidido. El registro de decisiones de Gerencia del repositorio, donde aterrizan todas las respuestas del panel. Cada decisión anota el pasaje del maestro que modifica (apartado y número del Anexo D) y la revisión del maestro en la que entró, o «pendiente».
Cadencia. Una revisión R08.x cada dos semanas, o antes si se acumulan 10 decisiones pendientes. La aprueba Gerencia. Al publicarla, cada decisión queda marcada con su revisión y su punto del Anexo D se cierra con fecha; el panel muestra la marca «En el maestro R08.x».
Plazo. Ninguna decisión puede llevar más de un mes pendiente de entrar al maestro. Si ocurre, el parte lo señala como desvío. La comprobación automática que lo vigila se construye en la tanda F0-06.
Las tres reglas que hacen que esto funcione
Ninguna observación se pierde. Toda marca de comentario queda registrada en el Anexo I con su disposición —incorporada, respondida, convertida en punto abierto, descartada—. Si el revisor no encuentra su comentario en el anexo, es que se perdió, y eso es un fallo del proceso.
El revisor puede corregir al documento, y el documento lo dice. Varias decisiones de la R08 contradecían lo que las revisiones anteriores daban por cerrado: la orden de venta previa volvió a evaluación, Supabase dejó de figurar, la captura asistida salió del MVP. [R08.4] Desde esta revisión, el cuerpo dice solo lo vigente: lo sustituido se nombra, si aporta, en una frase corta, y el histórico vive en §1.3 y en los Anexos C e I.
Lo que la máquina no sabe, lo pregunta. Las observaciones del tipo «no entiendo esto» son señal de que el documento está mal escrito, no de que el revisor no siga. En la R08 produjeron tres reescrituras —la taxonomía de eventos, el origen de remisiones_entrada y el KPI de precisión de diagnóstico— y una de ellas destapó un defecto real: un mismo evento clasificado en tres categorías a la vez.
Convención de marcas
Además de las etiquetas de estado de §1.10, el texto usa marcas de procedencia:
[R08] —y sus equivalentes de revisiones anteriores— señala contenido que entró por una observación del revisor o en esa revisión, para distinguirlo de lo que procede de las fuentes originales.
[R08.4] señala el texto nuevo o reescrito en esta revisión, y [DECIDIDO dd/mm/2026 — R08.4], el que recoge una decisión de Gerencia con fecha.
La marca de comentario es la que usa el revisor al anotar. En una revisión publicada no debe quedar ninguna: si aparece, es que quedó sin procesar.
2. Especificación funcional por módulos
Doce módulos cubren la totalidad del alcance identificado, numerados de M1 a M12 sin huecos: la R08 cerró el salto que dejó la retirada del portal del empleado, renumerando los tres últimos módulos. Ver §1.2. El orden va del núcleo operativo hacia los servicios periféricos y termina en la arquitectura y el conocimiento que lo sostienen.
Módulo
Nombre
Eje
Rol en el sistema
M1
Núcleo de tickets, blueprints y máquina de estados
①
El motor. Todo lo demás cuelga de aquí.
M2
Diagnóstico guiado y base de conocimiento
① / ③
Convierte la pericia técnica en un flujo repetible y medible.
M3
Hojas de vida de equipos (ALM)
①
El activo como entidad única y trazable.
M4
Comercial: cotización, aprobación y promesa de fecha
②
Donde se pierde o se gana el cumplimiento.
M5
Inventarios y repuestos (MRO)
① / ②
Reservas, kits, ubicaciones y reabastecimiento.
M6
Planificación y capacidad
②
Cuánto trabajo cabe y cuándo.
M7
Analítica, KPIs y predicciones
②
La capa de decisión.
M8
Portal de cliente y comunicación externa
③
El producto de cara al cliente.
M9
QA/QC, calibración y cumplimiento
①
Calidad y evidencia normativa.
M10
Movilidad, UX y modo offline
①
Cómo se usa en la mesa de trabajo y en campo.
M11
Arquitectura, integraciones y datos
—
Sobre qué se construye.
M12
Conocimiento, formación y capa RAG
③
Convierte «el cómo» en un activo de la empresa, no de las personas.
Dos precisiones de alcance añadidas en la R08.
M4 amplía su alcance a tres cosas concretas: la precotización de servicio que se traslada a Zoho CRM, la aprobación de cotizaciones vía portal de clientes, y una promesa de fecha más realista, apoyada en la carga del taller y en la disponibilidad de repuestos. Ver M4.2 y M4.4.
M5 debe distinguir tres situaciones del repuesto —en inventario, en camino con fecha estimada de llegada, o por solicitar con su lead time—, porque son las tres que cambian la fecha que se le promete al cliente. Posible conexión con el Portal Ambientalia · Análisis de Inventario. Ver M5.4.
[APLICADO EN LA R08] La numeración de módulos se cerró sin saltos: el antiguo M11 pasa a M10, el M12 a M11 y el M13 a M12. Ver §1.2.
M1. Núcleo de tickets, blueprints y máquina de estados
Es el corazón del sistema. Todas las decisiones registradas desde febrero coinciden en el mismo diagnóstico: las transiciones —no los estados— son el núcleo de la lógica. Un estado es una foto; la transición es la regla de negocio.
«El mapeo del proceso debe centrarse en documentar las reglas y datos requeridos en las transiciones, porque son el núcleo de la lógica del sistema.» — Decisiones del 17/02/2026
[R08.4] La aplicación confirma esa lectura: el blueprint está declarado en un solo sitio como una lista de transiciones, y los estados existen porque alguna transición los nombra. El mapa del blueprint se genera desde esa misma lista (Anexo F), de modo que el dibujo y el comportamiento no pueden separarse.
M1.1 Identificación del ticket
[DECIDIDO] Se elimina la nomenclatura CG (calibración) / MT (mantenimiento). El problema: un equipo que entra por CG y presenta falla requiere un MT, generando duplicidad y confusión. [R08.4] El 30/09 se suprimieron además los otros tres prefijos (ver «La convención de nombres y los prefijos», más abajo).
[DECIDIDO] El nuevo identificador se basa en el número de serie del equipo, asociado a nombre de cliente, modelo y fecha. [CONSTRUIDO] Cada ticket recibe un código único derivado del serial (F1B-01).
[DECIDIDO] El campo número de serie es obligatorio al crear la remisión. [CONSTRUIDO] (F1B-01).
[CONSTRUIDO] El serial se exige además en la transición Habilitar Servicio, porque los tickets traídos de Zoho llegan sin él.
[DECIDIDO] Se conserva la codificación interna actual (serial + modelo) para cumplir la trazabilidad exigida por ISO 9001.
[DECIDIDO 21/08] Autocompletado por serial: al introducir el número de serie, el sistema trae automáticamente la información de cliente y modelo, y asocia el ticket a las órdenes de venta activas. El serial deja de ser sólo un identificador y pasa a ser la llave de entrada de todo el registro. [CONSTRUIDO] Al escribir el serial, la aplicación completa cliente y modelo y ofrece las órdenes de venta libres (F1B-01).
[R08.4] [CONSTRUIDO] Guarda equipo ↔ cliente. Si el cliente del ticket no coincide con el cliente del equipo asociado, la aplicación rechaza el cambio y el aviso nombra a los dos clientes. No compara contra el cliente de la orden de venta: la titularidad OV ↔ equipo y el mantenedor se tratan en M3.1 y M4.4.
[DECIDIDO — R03] Identificación física por QR adherido por Ambientalia cuando el cliente no tiene etiqueta propia, para vincular remisión ↔ ticket ↔ hoja de vida. Sube a MVP por su efecto directo sobre el riesgo de captura (§1.4.3). [R08.4] La etiqueta de rotulación que se pone al recibir el equipo lleva el código del ticket (M1.2, «Recepción del equipo»).
[R08.4] Búsqueda por número de ticket y por serial. En el listado de tickets se puede buscar por número de ticket y por serial, con búsqueda parcial (por ejemplo, los últimos dígitos), con la misma lógica que el autocompletado por serial. Es paridad con Zoho Desk y va antes del corte del 14/12; si ya existe, solo se confirma (M7.5).
La convención de nombres y los prefijos
Hasta el 30/09/2026, el diccionario documentaba esta estructura para el asunto del ticket y el Código Servicio:
Tipo de servicio + Nombre del cliente + Tipo de equipo + Prefijo_NúmeroSerie_Modelo_AAMMDD
Ejemplo: MT_18A20070_EDM180C_260130
Prefijo
Qué identifica
MT
Equipo para servicio técnico: mantenimiento, reparación o diagnóstico.
CG
Equipo para calibración, generalmente Grimm.
HV
Equipo nuevo de cualquier marca (revisión y creación de hoja de vida).
SR
Soporte remoto para equipos de cualquier marca.
PRO
Protocolos de servicio de equipos Grimm y Horiba.
La decisión del 14/08 eliminó CG/MT por la duplicidad entre calibración y correctivo. La R05 observó que los prefijos en uso eran cinco y que HV y SR no describen el tipo de trabajo sino la rama del flujo, que es exactamente lo que la columna Clasificaciones ya distingue (punto abierto nº 37).
[DECIDIDO 30/09/2026 — R08.4] Se suprimen los cinco prefijos en los tickets nuevos. MT, CG, HV, SR y PRO dejan de existir en el alta: el campo prefijo ya no se pide, no es obligatorio y no se genera automáticamente. La rama del ticket la indica solo el desplegable de clasificación (M1.2). El asunto normalizado se mantiene, sin prefijo:
Tipo de servicio + Nombre del cliente + Tipo de equipo + NúmeroSerie_Modelo_AAMMDD
Es una convención de nombres consistente y verificable, y la aplicación puede construirla sola a partir del serial —que es la llave— en lugar de teclearla: una contramedida de captura más.
Tickets existentes. Los traídos de Zoho y los ya creados en Desk 2.0 conservan su prefijo tal como están: no se reescriben.
Antes de construir el cambio, hay que comprobar si alguna automatización o algún nombre de carpeta de Google Drive depende del prefijo, y avisar si es así.
Cuándo. Corrige F1B-03 y va antes del corte del 14/12.
Cierra el punto abierto nº 37 (sustituye a lo decidido en la R08: «el prefijo se conserva por legibilidad y se deriva de la clasificación»).
M1.2 Ramificación por tipo de servicio
[DECIDIDO 14/08, ratificado el 21/08] El blueprint se dispara mediante un menú desplegable al inicio del ticket, que envía el caso por la rama correcta y oculta los pasos innecesarios. [R08.4] La rama la indica solo este desplegable: desde el 30/09 los prefijos ya no se generan (M1.1). Ramas identificadas:
Rama
Disparador
Estado terminal
Situación en la R08.4
Servicio técnico
OV asignada (Zoho) / Ticket creado (aplicación)
Finalizado
Construida: 31 transiciones (M1.3)
Equipo nuevo
Ingreso equipo nuevo
Finalizado
Construida (F1B-06): 6 transiciones, con Verificación y su salida por Liberación (M1.4)
Soporte remoto
Solicitud Soporte
Finalizado
Construida (F1B-06): flujo propio de 4 transiciones, con modalidad remoto / en sitio (M1.5)
Servicio en sitio
—
Cerrado
Decidida el 24/09: cuarta rama en 2027 T2; mientras tanto, las visitas se registran por soporte remoto con modalidad «en sitio»
Comercial
Apertura de lead o trato
Cerrado Ganado / Cerrado Perdido
Fuera de Desk 2.0 en 2026: se queda en Zoho CRM (M1.11)
Posible cliente
Lead entrante
No cualificado / Convertir a Trato
Fuera de Desk 2.0 en 2026: se queda en Zoho CRM (M1.12)
[AS-IS — R05] El disparador ya existe. La ramificación no hay que inventarla: la columna Clasificaciones de la tabla de tickets es, en palabras del propio diccionario, «el campo que activa los diferentes flujos de trabajo», y sus valores son equipos para servicio de mantenimiento, equipo nuevo o soporte remoto. La decisión del 14/08 —un menú desplegable al inicio— no crea una capacidad nueva: le pone una interfaz a un campo que ya gobierna el flujo, y le quita la posibilidad de quedar mal diligenciado.
El diccionario añade además el Tipo de Servicio (columna 27), que es una segunda dimensión y no debe confundirse con la rama: Calibración · Diagnóstico · Garantía · Mantenimiento · No aplica · Otro. La rama dice por qué blueprint va el ticket; el tipo de servicio dice qué se le hace al equipo dentro de esa rama.
[DECIDIDO 24/09/2026 — R08.4] Modalidad remoto / en sitio. El servicio en sitio entra como cuarta rama del blueprint en el segundo trimestre de 2027, no en 2026. Hasta entonces, cualquier visita a instalaciones del cliente se registra por la rama de soporte remoto, que no exige remisión, con el campo «Modalidad: remoto / en sitio». [CONSTRUIDO] (F1B-06): la modalidad se elige al crear el ticket, solo en soporte remoto; si no se elige, queda «remoto», y después del alta no se cambia. La regla de remisión obligatoria para habilitar un servicio técnico se mantiene sin excepciones (ver abajo). Cierra el punto abierto nº 43.
Precondición comercial de la recepción [DECIDIDO 10/09 — R08.2]
[DECIDIDO 10/09 — R08.2] La OV es obligatoria para trabajar, no para recibir. La orden de venta es opcional al crear el ticket y obligatoria en Habilitar Servicio. El equipo sin OV se recibe, se hace su remisión de entrada y queda en bodega, pero nada entra a diagnóstico ni genera costo sin OV. Así se conserva, donde importa, la intención de lo decidido el 21/08 —OV previa por trazabilidad—, sin bloquear la recepción física (sustituye a lo decidido el 21/08: «Comercial crea la orden de venta antes de que Servicio Técnico reciba el equipo»). Cierra el punto abierto nº 21.
[CONSTRUIDO] Así funciona la aplicación: se puede recorrer Crear ticket (inicio) → Ticket creado → Remisión creada sin OV, y la OV se exige en Habilitar Servicio, junto al serial. Los obligatorios del alta son cliente, tipo de servicio y clasificación; el prefijo, que también lo era, deja de pedirse (M1.1).
El estado provisional es Remisión creada, no Ticket creado:
Estado sin OV
Qué significa
De quién depende
Ticket creado
El equipo no ha llegado: Comercial crea tickets por anticipado desde el 20/08
Cliente / logística
Remisión creada
El equipo está en bodega esperando la OV
Comercial
[CONSTRUIDO] Remisión creada es una espera interna, con área Comercial, y el tablero la muestra bajo «En espera». [DECIDIDO 17/09/2026 — R08.4] Si el ticket no tiene OV, la alarma salta a los 3 días hábiles (27 horas hábiles) y avisa al Coordinador Comercial; si nadie tiene ese cargo, al área Comercial. El aviso se da una vez por cada entrada al estado, en la aplicación y por correo, y solo cuenta la jornada laboral: lunes a viernes de 8 a 17 h, sin festivos de Colombia ni cierres de la empresa (M1.7). [CONSTRUIDO] (F1B-08). Con esto queda decidido qué cargo recibe el escalado (sustituye a la primera respuesta del 17/09, que mandaba el aviso también al Director Comercial).
[DECIDIDO 30/09/2026 — R08.4] Orden de la cola del taller según la habilitación comercial. Mientras el equipo está en Remisión creada no puede iniciarse el servicio. Cuando varios equipos salen de esa espera, la cola de trabajo del taller —«Mis tickets» y el tablero— los ordena así:
Primero, la prioridad (contrato, Top 5, valoración del cliente; ver M1.9).
Dentro de cada prioridad, la fecha y hora en que Comercial ejecutó «Habilitar Servicio» (la última; la de creación si no hay ninguna), no la fecha de llegada (sustituye al desempate por «fecha promesa» de revisiones anteriores). El orden lo aplica el servidor.
La lista de equipos en Remisión creada se muestra a Comercial por antigüedad, para que habilite primero los que más llevan esperando.
El bodegaje se mide en días naturales, no hábiles (M1.10).
Se construye con la prioridad por cliente (F1B-07, en curso).
[DECIDIDO 10/09 — R08.2; reafirmado el 24/09] Habilitar Servicio exige siempre remisión de entrada vigente (creada y no anulada), en sus tres orígenes. Hoy uno de ellos, Ticket creado, llega a Ingresado sin remisión: eso deja de ser posible. No hay excepciones: el servicio en sitio no se resuelve por ese atajo, sino con su propia rama en 2027 T2, y mientras tanto por soporte remoto (ver arriba). La guarda está sin construir (F1B-03). Antes de aplicarla hay que contar cuántos tickets llegaron a Ingresado sin remisión —es histórico que la guarda no repara—; el recuento lo hace una persona contra la base de producción. Si al construir la guarda se retira el origen Ticket creado de Habilitar Servicio, el recuento de pasos del mapa (M1.3.7) se mide de nuevo.
Garantía → OVI. Un servicio en garantía se asocia a una orden de venta interna (prefijo OVI-, total 0). Requiere un cambio de práctica: hoy las OVI se crean a nombre de Ambientalia, y tienen que crearse a nombre del cliente real. Los KPI de ingresos y de ticket promedio deben excluir las OVI. [DECIDIDO 17/09/2026 — R08.4] La OVI de garantía la crea el Director Técnico, como excepción a «Comercial crea la OV»; es una de las restricciones por cargo de M1.9. Al crearla, el Director Técnico responde si se reclama al fabricante; la reclamación sigue en una ficha propia, fuera del blueprint (M4.4).
Hallazgo con valor de negocio: las líneas de una OVI conservan el costo de referencia aunque el precio sea 0, así que el costo de garantía por equipo, marca y proveedor queda medible — material para reclamar al fabricante y argumento de M4.5.
Tres lados del mismo asunto. Esta decisión establece que el equipo puede esperar la OV en bodega; C9 mide cuánto espera —el tiempo en Remisión creada es el bodegaje de entrada—; y la regla de M1.10 sobre las fechas derivadas garantiza que la fecha que abre esa espera no llegue mal del navegador.
Consecuencia para el indicador de bodegaje. Si la OV llega después de la recepción, la fecha de la OV es precisamente el hito que cierra el bodegaje de entrada. Ver M1.10.
Recepción de accesorios [DECIDIDO 30/09/2026 — R08.4]
[DECIDIDO 30/09/2026 — R08.4] Cada accesorio se muestra con su foto, su nombre oficial y su número de parte, que ya existen en el inventario. Los datos se toman del catálogo de artículos sincronizado desde Zoho Books (nombre y SKU, y la imagen si la sincronización la trae; si no la trae, se añade), sin mantener una lista aparte. Solo se ofrecen los accesorios asociados al modelo del equipo en el catálogo de modelos. Se aplica igual en la remisión de entrada y en la de salida, y la de salida parte de lo registrado a la entrada, para que se vea qué vuelve y qué no. El objetivo sigue siendo el del 21/08: reducir los errores humanos en el inventario de lo que entra y sale con cada equipo (sustituye a «menú visual con fotos, en lugar de un listado de texto», decidido el 21/08).
Antes del corte, la lista cerrada de F1B-04 muestra ya nombre y número de parte desde el inventario; la foto se incorpora con el ítem 21 cuando esté disponible en el origen.
Recepción del equipo: rotulación, novedades, fotos y alta [R08.4]
[DECIDIDO 28/09/2026 — R08.4] Rotulado y guardado. La recepción registra una confirmación «Rotulado y guardado» con persona, fecha y hora, obligatoria para completar la recepción. La etiqueta física lleva el código del ticket, para que cualquier equipo de la estantería se pueda buscar en la aplicación. La ubicación no se registra antes del corte: una ubicación que solo se apunta al recibir queda desactualizada en cuanto el equipo se mueve. Entra después del corte, con las ubicaciones de almacén (M5.3), actualizada en cada movimiento.
[DECIDIDO 28/09/2026 — R08.4] Novedades de entrada. La observación de la remisión de entrada pasa a una lista de tipos de novedad con selección múltiple: Sin novedad · Golpe o abolladura en la carcasa · Rayón o daño estético · Pantalla o display dañado · Conector o puerto dañado · Falta un accesorio · Embalaje inadecuado o dañado · Humedad, suciedad o contaminación visible · Sello o precinto roto · Otro (texto obligatorio). Servicio Técnico puede ajustar la lista antes de construirla; después, los cambios los hace el Director Técnico.
[R08.4 — corrección de GN, 01/10/2026] Fotos de entrada y de salida. El registro fotográfico es siempre obligatorio en la remisión de entrada (al menos equipo, accesorios y embalaje, más la foto de cada novedad marcada) y en la de salida (equipo, accesorios y embalaje). La distinción con la inspección visual del diagnóstico, donde la foto sigue pidiéndose solo con novedad, está en M2.1 (sustituye, para las remisiones, a «foto solo con novedad», decidido el 28/09). Cambia lo construido en F1B-04 y se ajusta antes del corte.
[DECIDIDO 24/09/2026 — R08.4] Equipo nuevo: el alta del ticket registra el equipo. Cuando el ticket se clasifica como «Equipo nuevo», el alta permite registrar el equipo en ese mismo paso: serial, modelo del catálogo, cliente y fecha de factura como obligatorios; fecha de adquisición, fin de garantía, código interno, enlace a Drive y mantenedor como opcionales. El equipo queda creado en el registro de equipos y el ticket enlazado a él. Si el serial ya existe, no se crea otro: se ofrece el existente. [CONSTRUIDO] (F1B-14, «Alta y edición del equipo»).
[R08.4 — corrección de GN, 01/10/2026] Alta manual de equipo y cliente desconocidos. En mantenimiento y soporte remoto el equipo tenía que existir (regla del 24/09). Cuando ni el equipo ni el cliente aparecen en las bases de Ambientalia tras buscar por OCR, por serial y por cliente, la recepción permite registrarlos a mano en cualquier tipo de servicio: el equipo con serial tecleado dos veces, y el cliente como cliente provisional. Los dos quedan «pendiente de validar» y no se puede ejecutar Habilitar Servicio hasta que Comercial los valide. Detalle en M3.4. Va antes del corte: es paridad con Zoho Desk, y sin ella la recepción se bloquea con clientes nuevos.
M1.3 Flujo de servicio técnico
[R08.4] Esta sección describe el blueprint vigente de la rama de servicio técnico: el que está construido en la aplicación (en uso), con las correcciones que Gerencia decidió el 30/09 y el 01/10 —retirada de tres transiciones, nuevo origen de «Diagnóstico complementario», área del «Rechazo» desde Notificación cliente y derivación de los repuestos—. Sustituye por completo al mapeo manual de las revisiones anteriores. El grafo se lee de su definición en la aplicación, no del dibujo del blueprint de Zoho, y el mapa del blueprint (Anexo F) se genera desde esa misma definición. Las correcciones del 30/09 y el 01/10 van antes del corte del 14/12 (fila del plan por confirmar, §3.4); hasta que se construyan, la aplicación conserva las tres transiciones retiradas.
Las cifras del blueprint vigente:
Cifra
Qué cuenta
31
Transiciones con botón de la rama de servicio técnico. Eran 34: el 30/09 se retiraron «Marcar como pendiente» y las dos «Servicio externo» que llevaban a Por Facturar.
35
Pasos del mapa (M1.3.7): las 31 transiciones, más dos flechas porque Habilitar Servicio sale de tres estados, más los dos pasos sin botón. Eran 38.
20
Estados por los que puede pasar un equipo en esta rama. Pendiente deja de usarse aquí y solo existe en soporte remoto.
2
Entradas al flujo: OV asignada (Zoho) y Ticket creado (aplicación).
2
Pasos sin botón, que escribe la aplicación al crear o anular la remisión de entrada.
1
Estado terminal: Finalizado.
4
Estados de espera sin salida de emergencia, hasta que se construya la corrección C3 (M1.3.4).
5
Etapas que derivan el ticket a alguien concreto: tres construidas (Escalado a Revisión, Escalado a comercial y Aprobación) y dos decididas el 01/10 (Solicitud repuestos y Entrega de Repuestos). Ver M1.9.2.
3
Estados decididos y aún sin construir: Anulado (C2), Pendiente de facturar (C4) y Control de calidad (C6).
Las otras dos ramas de la aplicación tienen sus propias transiciones: equipo nuevo, 6 (M1.4), y soporte remoto, 4, con su estado propio Solicitud Soporte (M1.5). «Entregado» no existe en Desk 2.0 (M1.3.6).
Las etiquetas de las transiciones que aparecen en las tablas siguientes son el nombre exacto que ve el técnico en el botón, salvo las dos marcadas como «sin botón».
M1.3.1 Las tres fases del recorrido
Entrada y remisión — OV asignada · Ticket creado · Remisión creada convergen en Ingresado por la misma transición, Habilitar Servicio. La secuencia completa de un ticket nacido en la aplicación es Crear ticket (inicio) → Ticket creado → Remisión creada → Ingresado. Crear ticket es el formulario de alta, no un estado del grafo, y por eso no aparece en el mapa de M1.3.7: el blueprint arranca cuando el ticket ya existe.
Diagnóstico, cotización y ejecución — de Rev./Diagnostico a En Proceso, pasando por las notificaciones a Compras, a Comercial y al cliente, y por los cuatro estados de espera.
Cierre administrativo y entrega — de Por Facturar a Finalizado, por la vía facturada (Liberación Comercial → Por Entregar) o por la vía sin factura (Por Entregar / Sin facturar). Con la corrección C4, la vía sin factura pasará por Pendiente de facturar y terminará al facturar (M1.3.5).
M1.3.2 Dos entradas que nunca se cruzan
OV asignada y Ticket creado son la misma fase con dos nombres: la primera es como la llama Zoho y llega así en los tickets traídos de Zoho; la segunda es como nacen los tickets creados en la aplicación. Desde el corte operativo del 14/12 todos los tickets nuevos nacen en la aplicación, de modo que OV asignada queda solo para los tickets traídos de Zoho.
Regla: ningún camino lleva de una a la otra, y es deliberado. Mover un ticket traído de Zoho a una fase propia de la aplicación lo sacaría de la sincronización sin que nadie lo haya pedido. Por eso la aplicación solo aplica los pasos de la remisión (M1.3.3) a tickets que están en sus dos fases propias, Ticket creado y Remisión creada. [CONSTRUIDO]
La consecuencia operativa es que Remisión creada sólo existe para los tickets nacidos en la aplicación: un ticket traído de Zoho no pasa nunca por ese estado, aunque se le cree una remisión. Los dos primeros estados del mapa cuentan una historia distinta según de dónde venga el ticket.
Implicación para los indicadores y para el portal. Ningún indicador puede medir el tiempo en Ticket creado o en Remisión creada como si valiera para todos los tickets. Por eso los bodegajes se calculan sobre fechas e historial de transiciones, nunca sobre el estado inicial: el de entrada va de la fecha de remisión de entrada a la fecha de la OV (M1.10). Lo mismo vale para la barra de progreso del área de cliente (M8.2): dos equipos idénticos pueden arrancar en estados distintos según cómo se creó su ticket.
M1.3.3 Dos pasos sin botón
Dos de los 35 pasos del mapa no son transiciones con botón: los escribe la aplicación cuando ocurre algo con la remisión de entrada, sin que nadie pulse nada. Están declarados junto a las transiciones, pero no tienen origen ni destino que el técnico pueda elegir, y por eso no aparecen como botones. Con ellos y con las dos flechas de más de Habilitar Servicio, que sale de tres estados, la rama tiene 31 transiciones y el mapa 35 pasos (M1.3.7). [R08.4] Así se explica la cifra que la R08.2 dejaba «en revisión»: el mapa no cuenta transiciones sino caminos.
Desde
Hasta
Qué lo dispara
Ticket creado
Remisión creada
Se crea una remisión de entrada para el ticket.
Remisión creada
Ticket creado
Se anula la última remisión de entrada del ticket.
[R08.4] Por qué retrocede. Si la remisión de entrada se anula —porque se hizo por error, con el equipo equivocado o duplicada—, el ticket ya no puede decir que el equipo está en bodega. Por eso vuelve solo a Ticket creado. Es el único paso reversible automático de todo el mapa. Remisión creada sale hacia Ingresado con el mismo botón que las otras dos entradas.
[DECIDIDO 30/09/2026 — R08.4] Remisiones sin ticket. No todo lo que se remisiona es un servicio técnico. Para equipos, insumos o elementos que entran o salen con otro fin se crean, por trazabilidad, remisiones de entrada y de salida sin ticket:
Acceso directo desde el menú «Remisiones» → «Crear remisión de entrada» / «Crear remisión de salida», sin pasar por el flujo del ticket.
Motivo de lista cerrada: préstamo o demostración · devolución o envío a proveedor · envío al fabricante por garantía · insumo o material · consignación · otro, con texto obligatorio.
Contenido: el cliente o proveedor, de los contactos de Zoho Books, y los elementos con nombre y número de parte del inventario.
Numeración: la misma que las demás remisiones, marcadas «sin ticket». Una remisión de salida puede enlazarse con su entrada, y existe una lista de lo que salió y no ha vuelto.
No tocan el flujo: no cambian el estado de ningún ticket ni sirven para habilitar un servicio. Si lo recibido pasa a ser un servicio, se abre el ticket y se enlaza la remisión existente.
Va antes del corte del 14/12, porque puede ser el uso que mantiene viva la hoja de Google de remisiones, que se cierra con la migración (M2.5).
M1.3.4 Las cuatro esperas sin salida de emergencia, y sus salidas decididas
[CONSTRUIDO] Casi todos los estados ofrecen al menos un camino para abandonar el ticket: rechazar, devolver, cerrar. Cuatro no. Su única transición de salida depende de que ocurra algo que la aplicación no controla.
Estado
Única salida
De qué depende
Área
En Espera de Repuestos
Llegada de repuestos
Que el proveedor entregue.
Comercial / Compras
Solicitado
Entrega de Repuestos
Que almacén entregue la pieza.
Servicio Técnico
Servicio externo
Retorno de servicios externos
Que el laboratorio externo devuelva el sensor.
Servicio Técnico
En espera de SKU inventario
Notificación cliente (SKU)
Que se cree el SKU en inventario.
Comercial
Mientras no se construya la corrección C3, un ticket aparcado en cualquiera de los cuatro no tiene adónde ir si el pedido al proveedor se cancela o el laboratorio externo declara el sensor irreparable. Contrasta con un estado corriente como Notificación cliente, que ofrece tres salidas —Aprobación, Aprobación y S. Repuestos y Rechazo— y una de ellas sirve precisamente para abandonar el ticket.
Por qué importa más de lo que parece. Estos cuatro estados son justamente donde el eje ② tiene que medir: el tiempo de espera de repuesto es un KPI del cuadro de mando (M7.1) y una de las causas de desvío que el análisis de cuellos de botella persigue (M7.3). Un ticket que se queda ahí para siempre no sólo se pierde operativamente: distorsiona al alza el indicador que debería delatarlo.
[DECIDIDO 23/09/2026 — R08.4, corregido el 30/09] Salidas de las cuatro esperas (corrección C3). Las cuatro no se tratan igual: dos esperan a terceros y dos esperan a Ambientalia.
Espera
A quién se espera
Salida decidida
En Espera de Repuestos
Al proveedor (externa)
Dos salidas, que decide Comercial en cada caso, porque cobrar o no el diagnóstico depende del cliente y de quién falló: cobrar el diagnóstico → Por Facturar, o anular → Anulado, con motivo «repuesto no disponible» o «sin solución técnica».
Servicio externo
Al laboratorio externo (externa)
Las mismas dos salidas, que decide Comercial. Es también la salida cuando el equipo enviado a un tercero no vuelve para reparación.
Solicitado
Al almacén de Ambientalia (interna)
No se abandona. Si no hay pieza en el almacén, vuelve a En Espera de Repuestos para pedirla fuera.
En espera de SKU inventario
A un trámite de Comercial (interna)
No se abandona ni se anula. Si se retrasa, se avisa a Comercial para que cree el SKU.
Reglas comunes a las cuatro:
La caducidad nunca ejecuta sola una salida. Al cumplirse el plazo, el sistema notifica y sugiere la salida que corresponde: en las esperas externas, a Comercial; en las internas, escala al área responsable.
El plazo de cada espera se fija con datos: lo que hoy tarda el 90 % de los tickets en ese estado, medido en el historial.
La salida la ejecuta únicamente la persona a cargo de esa etapa, es decir, a quien está derivado el ticket en ese momento, y no cualquier usuario del área. En las dos esperas externas, donde la salida implica decidir si se cobra al cliente, la persona a cargo es de Comercial. Si no está disponible, puede ejecutarla el Director o el Coordinador del área, dejando registro. Esto adelanta el nivel de permisos «propietario del registro» solo para las salidas de emergencia; el resto de transiciones siguen por área y cargo (M1.9). (Sustituye a lo decidido el 23/09, que dejaba la salida a cualquier usuario del área).
Se conserva una vía de escape manual con traza, como se acordó el 27/08. Hoy no existe botón de retroceso: el cambio de estado hacia atrás se hace a mano desde propiedades. Ninguna transición prevista cubre todos los casos, y la alternativa a una salida manual controlada es la edición directa de la base de datos, que no deja rastro.
Cierra el punto abierto nº 31. Se construye en F1C-03, después del corte; recomendación: que la salida por persona a cargo vaya dentro de esa misma tanda.
M1.3.5 El ciclo entre facturar y entregar, y las dos ramas de cierre
[CONSTRUIDO] Hoy, Liberación sin factura baja de Por Facturar a Por Entregar / Sin facturar, y Entrega al cliente sin factura vuelve a subir a Por Facturar. El diseño tiene sentido —entregar ahora y facturar después, tal como exigen las fechas de corte de facturación de algunos clientes—, pero el ciclo puede recorrerse indefinidamente, la «Fecha Remisión de Salida» puede sobreescribirse y, como la vía sin factura vuelve a Por Facturar en lugar de cerrar, un equipo ya entregado y no cobrado queda indistinguible de uno que aún está en la estantería esperando salir (dolor nº 6, punto abierto nº 6).
Las dos ramas de cierre [DECIDIDO 23/09/2026 — R08.4]
Gerencia adoptó la propuesta de la R08 de eliminar el ciclo en lugar de parchearlo: separar las dos vías en ramas que avanzan, sin que ninguna vuelva atrás, con un cambio: no hay estado «Facturado».
Vía
Recorrido decidido (en cursiva, las transiciones)
Con factura
Por Facturar → Facturado → Liberación Comercial → Habilitado para entrega → Por Entregar → Entrega al cliente (con remisión de salida) → Finalizado; o, como hoy, facturado y cierre de TK directamente a Finalizado
Sin factura
Por Facturar → Liberación sin factura → Por Entregar / Sin facturar → Entrega al cliente sin factura (con remisión de salida) → Pendiente de facturar → Facturar → Finalizado
Facturado es un atributo del ticket, no un estado. El hecho de estar facturado vive en la fecha de factura del ticket, que ya existe; así no hay dos sitios que puedan decir cosas distintas (sustituye a la alternativa de la R08 de pasar por un estado «Facturado» antes de Finalizado).
Pendiente de facturar sí es estado, en la rama sin factura: es el sitio donde vive un equipo ya entregado y todavía no facturado, que el punto abierto nº 6 pedía desde febrero, y su antigüedad es un indicador de cobro directo. De ahí se sale con la transición «Facturar», que registra la factura y su fecha, directamente a Finalizado.
El ticket termina al facturar; el cobro se sigue en contabilidad, no en el ticket.
La «Fecha Remisión de Salida» se escribe una sola vez, en el momento en que el equipo sale físicamente de las instalaciones. Como no hay vuelta atrás, el grafo ya no permite la segunda escritura: no hace falta un campo protegido.
La corrección C4 deja de ser «proteger un campo» y pasa a ser «rediseñar las dos vías de cierre». Se construye en F1C-02, después del corte, y conviene hacerla junto con C2 (Anulado). Cierra el punto abierto nº 34.
[DECIDIDO 24/09/2026 — R08.4, corregido el 30/09] Liberación sin factura. Deja de ser una casilla. La transición la ejecuta solo el Director Comercial (un administrador siempre puede) y exige dos campos obligatorios: el motivo, de una lista cerrada (fecha de corte de facturación del cliente · servicio incluido en contrato con facturación periódica · autorización excepcional de Dirección Comercial, con texto obligatorio), y la fecha prevista de facturación. Se construye en dos momentos:
Antes del corte del 14/12, lo que es paridad con Zoho: la restricción al Director Comercial —[CONSTRUIDO] en F1C-05, nivel cargo—, el motivo y la fecha prevista.
Después del corte, con F1C-02 y el estado Pendiente de facturar, la alarma: si pasa la fecha prevista y el ticket sigue en Pendiente de facturar, se avisa al Director Comercial. Como la fecha prevista se registra desde el 14/12, la alarma se aplicará también a lo liberado sin factura desde entonces. F1C-02 no tiene fecha y depende de la medida M3.
Histórico. Las liberaciones sin factura registradas antes del arreglo del 09/09 (C1) conservan sus valores tal como se guardaron y llevan la marca «anterior al arreglo de C1 — sin afirmación registrada»: no se corrigen ni se excluyen. Cuentan en el recuento de liberaciones sin factura y quedan fuera solo de los indicadores que dependen del motivo o de la fecha prevista. Las que correspondan a tickets que sigan en Pendiente de facturar se regularizan hacia adelante: el Director Comercial registra motivo y fecha prevista como un evento nuevo, con su nombre y fecha, sin modificar la fila original. Cierran los puntos abiertos nº 33 y nº 64.
[R08.4 — revisión de GN, 01/10/2026] Remisión de salida en la entrega. Al ejecutar «Entrega al cliente» (Por Entregar → Finalizado) o su equivalente en la vía sin factura, la aplicación permite crear desde el propio ticket la remisión de salida del equipo y de los accesorios con los que ingresó, partiendo de lo registrado en la remisión de entrada (M1.2, recepción de accesorios). Va antes del corte. La guarda que impide entregar sin remisión de salida vigente está en M1.7.
Ampliación, después del corte: la remisión de salida lista también las partes autorizadas por el cliente que se reemplazaron durante el servicio, tomadas de la cotización aprobada. Para el sistema, esa remisión confirma que esas partes se entregaron al cliente, y el inventario les da salida automáticamente.
Condición: cada pieza se descuenta del inventario una sola vez. [ABIERTO] Falta definir cómo se reparte con «Entrega de Repuestos», donde la pieza pasa del almacén al técnico, y con la factura de Zoho Books mientras siga descontando inventario (Anexo D; ver también M5). Propuesta: la entrega al técnico deja la pieza asignada al ticket, y la remisión de salida confirma el consumo.
M1.3.6 Discrepancias con el mapeo manual anterior
Esta tabla existe para quien haya diseñado sobre la versión anterior de §M1.3. De sus 20 filas, cuatro eran correctas. Conviene leerla junto con M1.3.9: el error estaba en esta tabla, no en el mapeo del que salió. [R08.4] La columna de la derecha describe la aplicación y añade, donde corresponde, las correcciones del 30/09.
Lo que decía el mapeo manual
Lo que hace la aplicación
OV asignada → Habilitar servicio → Ingresado
Correcto.
Ingresado → Ingreso a servicio → Rev./Diagnóstico
Correcto.
Liberación Comercial → Habilitado para entrega → Por Entregar
Correcto.
Por Entregar → Entrega al cliente → Finalizado
Correcto.
Solicitado → Solicitud de repuestos → En Proceso
Invertido. Solicitud repuestos va de En Proceso a Solicitado. Lo que sube de Solicitado a En Proceso es Entrega de Repuestos.
(cualquiera) → Marcar como pendiente → Pendiente
Salía sólo de En Proceso. Retirada el 30/09/2026: Pendiente deja de usarse en esta rama (M1.3.7).
(en ejecución) → Calibración de sensores → «continúa ejecución»
Lleva a un estado propio, Servicio externo, y sale de dos orígenes: Rev./Diagnostico y En Proceso. Vuelve a En Proceso con «Retorno de servicios externos».
En espera de repuestos → Llegada de repuestos → Notificado
El destino es En Proceso.
Notificado → Escalado a revisión / Aprobación → «según decisión»
Escalado a Revisión sale de Rev./Diagnostico hacia Notificado. Aprobación sale de Notificación cliente. Ninguna de las dos parte de Notificado.
(cotización) → Solicitud SKU → En espera de SKU
El origen es Notificación Comercial.
En Proceso → Entrega de repuestos → «continúa»
Sale de Solicitado.
En Proceso → Retorno de servicios externos → «continúa»
Sale de Servicio externo.
En Proceso → Finalización de servicio → Entregado
El destino es Por Facturar. Entregado no existe en Desk 2.0: es un estado obsoleto de Zoho (ver abajo).
Notificación cliente → Notificación por garantía → Reporte por Garantía
Notificación por garantía va de Notificación a Compras a En Espera de Repuestos. Reporte por Garantía no es un estado: Reporte por garantía es la transición de Notificado a Notificación a Compras.
Reporte por Garantía → Rechazo de garantía → (salida)
Va de Notificación a Compras a Notificación Comercial.
Reporte por Garantía → Escalado a comercial → (salida)
Va de Notificado a Notificación Comercial.
Por Facturar → Facturado y cierre de TK → Facturado
El destino es Finalizado. Facturado no es un estado: es un atributo del ticket (M1.3.5).
Por Facturar → Diagnóstico complementario → (retorno a técnica)
Salía de Pendiente y llevaba a Continuación del proceso. Desde el 30/09/2026 sale de En Proceso.
Por Facturar → Liberación sin factura → Liberación Comercial
El destino es Por Entregar / Sin facturar. A Liberación Comercial se llega por la transición Facturado.
Por Facturar → (rechazo) → Rechazo
Rechazo no es un estado, es una transición que entra a Por Facturar desde Rev./Diagnostico, Notificación Comercial y Notificación cliente.
Seis estados faltaban por completo: Ticket creado, Remisión creada, Notificación a Compras, Notificación Comercial, Continuación del proceso y Por Entregar / Sin facturar. Cuatro estados que figuraban no existen: Entregado, Reporte por Garantía, Facturado y Rechazo.
De dónde salía Entregado [R05]. No era invención del documento. El estado existe en el blueprint de Zoho Desk, arriba a la izquierda, colgando de un conector suelto hacia Pendiente: un resto de una versión anterior del flujo que quedó dibujado y sin uso. Quien levantó la tabla lo vio en pantalla y lo dio por vivo. Es un argumento a favor de leer el grafo de su definición y no de su dibujo.
[DECIDIDO 30/09/2026 — R08.4] «Entregado» es un estado obsoleto. Sigue dibujado en el blueprint de Zoho Desk solo porque Zoho no permite eliminar estados ni transiciones que se hayan usado alguna vez. No existe ni se crea en Desk 2.0. Las guardas que las revisiones anteriores escribían sobre «Entregado» se aplican a la salida del equipo desde Por Entregar (M1.7).
[R08.4] Reglas de migración desde Zoho Desk. La migración de tickets y del historial lee los datos de cada ticket, no el dibujo del blueprint, que en Zoho no se puede limpiar. En consecuencia:
Ningún estado ni conector huérfano de ese dibujo —«Entregado» y su conector hacia Pendiente— se traslada a Desk 2.0.
El historial se conserva tal como está: los pasos por «Entregado», por «Pendiente» de servicio técnico y por las dos transiciones «Servicio externo» retiradas no se reescriben.
Si la migración de tickets abiertos (F1F-01) encuentra alguno de servicio técnico en «Entregado», pasa a Finalizado; si lo encuentra en «Pendiente», pasa a En Proceso.
M1.3.7 Tabla completa: los 35 pasos
Son 35 y no 31 porque Habilitar Servicio es una sola transición que sale de los tres estados de entrada, y porque los dos pasos de la remisión no son transiciones con botón sino algo que escribe la aplicación. Ordenados por el estado del que salen. Marcados con ·espera· los cuatro estados sin salida de emergencia (hasta C3); con ·propone·, las cinco etapas que pasan el trabajo a alguien concreto (M1.9.2). La columna «Regla vigente» recoge lo decidido el 30/09 y el 01/10 que cambia lo construido.
Desde
Hasta
Transición
Área
Regla vigente
OV asignada
Ingresado
Habilitar Servicio
Comercial
Exige OV y serial; con la guarda de F1B-03, también remisión de entrada vigente.
Ticket creado
Ingresado
Habilitar Servicio
Comercial
Con la guarda de remisión vigente (F1B-03), solo con remisión.
Ticket creado
Remisión creada
Remisión creada (sin botón)
Servicio Técnico
Al crear la remisión de entrada.
Remisión creada
Ingresado
Habilitar Servicio
Comercial
Exige OV y serial. Su fecha y hora ordenan la cola del taller.
Remisión creada
Ticket creado
Remisión anulada (sin botón)
Servicio Técnico
Al anular la remisión de entrada.
Ingresado
Rev./Diagnostico
Ingreso a Servicio
Servicio Técnico
—
Rev./Diagnostico
Notificado
Escalado a Revisión ·propone·
Servicio Técnico
El técnico fija los días de entrega.
Rev./Diagnostico
Servicio externo
Calibración de sensores ext.
Servicio Técnico
—
Rev./Diagnostico
Por Facturar
Rechazo
Comercial / S. Técnico
—
Notificado
Rev./Diagnostico
Devolución a corrección
Servicio Técnico
—
Notificado
Notificación a Compras
Reporte por garantía
Servicio Técnico
Se sugiere si el equipo está «En garantía».
Notificado
Notificación Comercial
Escalado a comercial ·propone·
Servicio Técnico
—
Notificación a Compras
En Espera de Repuestos
Notificación por garantía
Comercial / Compras
—
Notificación a Compras
Notificación Comercial
Rechazo de garantía
Comercial / Compras
—
Notificación Comercial
Notificación cliente
Notificación cliente
Comercial
—
Notificación Comercial
En espera de SKU inventario
Solicitud SKU
Comercial / Compras
—
Notificación Comercial
Por Facturar
Rechazo
Comercial / S. Técnico
—
En espera de SKU inventario ·espera·
Notificación cliente
Notificación cliente (SKU)
Comercial
Comercial/Compras registra el SKU; avisa al técnico.
Notificación cliente
En Proceso
Aprobación ·propone·
Comercial
Devuelve el ticket a quien lo tomó.
Notificación cliente
En Espera de Repuestos
Aprobación y S. Repuestos
Comercial / Compras
—
Notificación cliente
Por Facturar
Rechazo
Comercial
Solo Comercial desde el 01/10 (antes, también Servicio Técnico).
En Espera de Repuestos ·espera·
En Proceso
Llegada de repuestos
Comercial / Compras
—
En Proceso
Solicitado
Solicitud repuestos ·propone·
Servicio Técnico
La ejecuta el técnico a cargo; deriva al encargado de inventario.
En Proceso
Servicio externo
Calibración de sensores ext.
Servicio Técnico
—
En Proceso
Continuación del proceso
Diagnóstico complementario
Servicio Técnico
Sale de En Proceso desde el 30/09 (antes, de Pendiente).
En Proceso
Por Facturar
finalización de servicio
Servicio Técnico
—
Solicitado ·espera·
En Proceso
Entrega de Repuestos ·propone·
Servicio Técnico
La ejecuta el encargado de inventario; devuelve el ticket al técnico.
Servicio externo ·espera·
En Proceso
Retorno de servicios externos
Servicio Técnico
—
Continuación del proceso
Notificación Comercial
Notificación re cotización
Comercial
—
Por Facturar
Liberación Comercial
Facturado
Comercial
—
Por Facturar
Finalizado
facturado y cierre de TK
Comercial
—
Por Facturar
Por Entregar / Sin facturar
Liberación sin factura
Comercial
Solo el Director Comercial, con motivo y fecha prevista.
Por Entregar / Sin facturar
Por Facturar
Entrega al cliente sin factura
Servicio Técnico
Con C4 llevará a Pendiente de facturar.
Liberación Comercial
Por Entregar
Habilitado para entrega
Comercial
—
Por Entregar
Finalizado
Entrega al cliente
Servicio Técnico
Guarda de remisión de salida vigente (M1.7).
Retiradas el 30/09/2026. No figuran en la tabla; el historial que pasó por ellas se conserva tal como está:
Marcar como pendiente (En Proceso → Pendiente).
Servicio externo (Notificado → Por Facturar).
Servicio externo (Pendiente → Por Facturar).
Cambios decididos que el mapa incorporará cuando se construyan, después del corte:
C2 · Anulado (F1C-01): estado nuevo con cinco motivos, al que llevan las salidas de emergencia de las dos esperas externas.
C3 · Salidas de las esperas (F1C-03): de En Espera de Repuestos y de Servicio externo, a Por Facturar o a Anulado; de Solicitado, de vuelta a En Espera de Repuestos cuando no hay pieza en el almacén (M1.3.4).
C4 · Dos ramas de cierre (F1C-02): Entrega al cliente sin factura lleva a Pendiente de facturar, y de ahí la transición «Facturar» lleva a Finalizado (M1.3.5).
C5 · Tipo de evento (F1C-04): cada transición lleva su tipo (ver «Diagnóstico del flujo actual», más abajo).
C6 · Control de calidad (F1C-07): estado entre En Proceso y Por Facturar; aprobado → Por Facturar, rechazado → En Proceso (M9.1).
Calibración directa (F1B-03 y, en lo que no cubra, F1C-08): cuando la OV ya cubre la calibración, el ticket salta diagnóstico, cotización y aprobación, y pasa igualmente por Control de calidad (M2.1).
Reglas de los pasos decididas el 30/09 y el 01/10 [R08.4]
[CONSTRUIDO] Escalado a Revisión, cómo funciona hoy. El técnico que termina el diagnóstico pulsa «Escalado a Revisión» (Rev./Diagnostico → Notificado) para enviarlo a revisar, y en ese paso fija los días de entrega. Después, el Director Técnico decide desde Notificado si el ticket va a Comercial («Escalado a comercial»), a garantía («Reporte por garantía») o vuelve a corrección («Devolución a corrección»). Sobre Notificado hay un SLA de 9 horas hábiles (M1.7). Los días de entrega son la base del tiempo promesa global (M4.1).
[DECIDIDO 30/09/2026 — R08.4] Aviso «En garantía». Cuando se crea un ticket de un equipo cuya garantía sigue vigente, debe verse. No es un estado del flujo sino un distintivo calculado: el ticket está en garantía si su fecha de creación es anterior o igual al fin de garantía registrado en la hoja de vida del equipo.
Se muestra como aviso al elegir el equipo al crear el ticket, en la cabecera del ticket y en la lista y el tablero.
En Notificado, si el equipo está en garantía, la aplicación sugiere «Reporte por garantía» como salida, sin obligar: quien decide puede considerar que la falla no está cubierta.
Si el equipo no tiene fin de garantía registrado, se muestra «Garantía sin dato» para que Comercial lo complete.
Es pequeño y el dato ya existe (F1B-02): va antes del corte del 14/12.
[DECIDIDO 01/10/2026 — R08.4] Rechazo desde Notificación cliente: solo Comercial. Hasta ahora la podían ejecutar Comercial y Servicio Técnico; pasa a ejecutarla solo el área Comercial, que es la que recibe del cliente la aprobación o el rechazo de la cotización. No cambia su origen ni su destino (Notificación cliente → Por Facturar), ni las otras dos transiciones «Rechazo», que mantienen su área. Se construye junto con las demás correcciones del blueprint de servicio técnico del 30/09.
[DECIDIDO 01/10/2026 — R08.4] Solicitud repuestos y Entrega de Repuestos: traspaso interno de Servicio Técnico.
«Solicitud repuestos» (En Proceso → Solicitado) la ejecuta el técnico a cargo del ticket y deriva el ticket al encargado de inventario, que es quien entrega los repuestos. [ABIERTO] Falta fijar si «Encargado de inventario» es un cargo o una persona concreta (Anexo D).
«Entrega de Repuestos» (Solicitado → En Proceso) la ejecuta el encargado de inventario al entregar las piezas, y devuelve el ticket al técnico que lo tenía a cargo, como ya hace «Aprobación» con «quien tomó el ticket».
La derivación se construye ya, antes del corte. La restricción de que solo esas dos personas puedan ejecutar cada paso llega con el nivel de permisos «propietario del registro», que sigue pendiente (M1.9).
Se mantiene lo decidido en C3: si no hay pieza en el almacén, el ticket pasa a En Espera de Repuestos para pedirla fuera.
[DECIDIDO 30/09/2026 — R08.4] SKU: Comercial/Compras completa la tabla de repuestos. Cuando Comercial/Compras consigue el SKU de una pieza en «En espera de SKU inventario», ya no pide a Servicio Técnico que actualice la tabla de insumos y repuestos del informe:
Comercial/Compras registra el SKU en esa tabla, genera la cotización y ejecuta «Notificación cliente (SKU)»; al hacerlo, la aplicación avisa al técnico del ticket de que la pieza ya tiene SKU y se ha añadido al informe.
Comercial/Compras solo completa el SKU (código y precio) de las piezas que el técnico ya identificó: no añade, quita ni cambia piezas ni cantidades. Si hace falta cambiar una pieza, el ticket vuelve a Servicio Técnico.
Antes del corte entran el registro del SKU en la transición y el aviso al técnico; la edición directa de la tabla del informe llega con el módulo de informes (F1E-01), en 2027. Ver M4.4.
[DECIDIDO 30/09/2026 — R08.4] Pendiente sale de la rama de servicio técnico. En esta rama, «Pendiente» no tenía un objetivo claro y se elimina como paso intermedio: se retira «Marcar como pendiente» (En Proceso → Pendiente). «Diagnóstico complementario» pasa a salir directamente de En Proceso hacia Continuación del proceso: se usa cuando, durante la reparación, el técnico ve que hay que volver a diagnosticar, y conserva el circuito de recotización y el indicador de precisión del diagnóstico. En la rama de soporte remoto, «Pendiente» se mantiene con sus dos transiciones, porque allí sí significa soporte en pausa (M1.5). Pendiente de servicio técnico sale también de la lista del reloj del SLA (M1.6).
[DECIDIDO 30/09/2026 — R08.4] Servicio externo es solo ida y vuelta con un tercero. Las transiciones de servicio externo están pensadas para servicios que se hacen con un tercero y vuelven a Servicio Técnico para continuar o alistar el equipo. Ese camino se mantiene: «Calibración de sensores ext.» (desde Rev./Diagnostico o En Proceso) → Servicio externo → «Retorno de servicios externos» → En Proceso. Se retiran las dos transiciones llamadas «Servicio externo» que llevaban a Por Facturar, desde Notificado y desde Pendiente, porque no corresponden a ese concepto. Cuando un equipo enviado a un tercero no vuelve para reparación, sale del estado Servicio externo por su salida de emergencia de C3 (Por Facturar cobrando el diagnóstico, o Anulado con motivo), que ejecuta Comercial (M1.3.4).
Cuándo se construye. Las correcciones de esta lista —aviso «En garantía», Rechazo solo por Comercial, derivación de los repuestos, registro del SKU con aviso al técnico, las tres transiciones retiradas y el nuevo origen de Diagnóstico complementario— van antes del corte del 14/12. Su fila del plan está por confirmar (§3.4). Con ellas, la cifra de transiciones de la aplicación pasa de 34 a 31: las tres retiradas y la actualización de este apartado y del mapa van juntas.
M1.3.8 Lo que el mapa confirma que está sano
Todos los estados de la rama son alcanzables desde alguna de las dos entradas, y no hay estados huérfanos. Remisión creada no es alcanzable por ningún botón: su única entrada es el paso sin botón de M1.3.3. Con la retirada de «Marcar como pendiente», Pendiente deja de ser alcanzable en esta rama, que es lo que se busca.
Finalizado es el único estado terminal. No hay callejones sin salida no intencionados, más allá de las cuatro esperas de M1.3.4.
[CONSTRUIDO] Todos los campos que piden las transiciones se guardan en columnas propias del ticket. Ninguno cae en un cajón genérico, que es donde un campo mal etiquetado se guardaría sin que nadie lo encontrara.
[CONSTRUIDO] Ninguna etapa exige un comentario de texto libre. Es el principio de diseño nº 4 —fin del texto libre en etapas críticas— cumplido en la aplicación: un comentario obligatorio es texto libre elevado a requisito.
Nota sobre la creación del ticket. El mapa arranca ya en un estado porque la creación —la transición 1 del blueprint de Zoho— se maneja aparte: el historial guarda el nacimiento del ticket como una fila con origen «(creación)», que no es un estado de Zoho sino la marca de que esa fila es la foto del alta y no una transición.
M1.3.9 La hoja de origen coincide con la aplicación [R05]
La hoja DFserviciotecnico160226 es el mapeo de campo del 16 de febrero de 2026: 35 filas, la primera de las cuales es la creación del ticket —Agregar Ticket → Enviar → OV asignada— que el blueprint maneja aparte. Las 34 restantes coinciden una a una con las 34 transiciones implementadas. [R08.4] De esas 34, el 30/09 se retiraron tres (M1.3.7): la rama queda en 31.
Las cuatro diferencias que aparecen al cruzarlas son de etiqueta:
Hoja del 16/02
Aplicación
Lectura
Notificación a Comercial como estado origen
Notificación Comercial
El mismo estado con el artículo de más. Conviene fijar el nombre.
Calibración de sensores ext.
Calibración sensores ext.
La etiqueta del botón se acortó al implementar.
En espera de SKU inventario → Notificación cliente
ídem, etiquetada Notificación cliente (SKU)
La aplicación desambigua dos transiciones que la hoja llamaba igual. Es una mejora, no una desviación.
—
Ticket creado y Remisión creada → Ingresado
Las dos entradas propias de la aplicación. No existen en Zoho y por eso no podían estar en la hoja.
Qué significa esto para el proyecto. El as-is estaba bien levantado y la implementación fue fiel a él. Los seis hallazgos de la R04 no son fallos de traducción entre el mapeo y la aplicación: son propiedades del proceso tal como se diseñó, heredadas del blueprint de Zoho de 2021. Finalizado mezcla terminados y abandonados desde el principio; los cuatro estados de espera nunca tuvieron salida; el ciclo de facturación siempre fue reentrante. No se rompieron al migrar. Se copiaron.
Eso cambia a quién le toca resolverlos: no son deuda de desarrollo, son decisiones de proceso —y por eso las correcciones C1–C5 llevan un responsable de negocio en el Anexo D y no sólo un responsable técnico. [R08.4] Ya están tomadas: C1 está construida, y C2, C3, C4 y C5 se decidieron el 23/09 (M1.3.4, M1.3.5 y el apartado siguiente).
Diagnóstico del flujo actual
El mapeo original señalaba un problema estructural que la aplicación confirma: las transiciones mezclan acciones técnicas, decisiones comerciales y eventos logísticos. La recomendación registrada era separarlas en tres tipos: operativas (diagnóstico, calibración, entrega de repuestos), decisionales (aprobación, rechazo de garantía) y logísticas / administrativas (facturar, liberar, entregar). Hoy las transiciones llevan área y campos, pero no tipo de evento, y sin él el análisis de tiempos por tipo de evento previsto en M7.3 no es calculable.
[DECIDIDO 23/09/2026 — R08.4] Cada transición lleva un tipo de evento (corrección C5). Además de su área y sus campos, cada transición del blueprint lleva un tipo de evento, para poder analizar los tiempos por tipo (M7.3). Se aplica la clasificación de M1.8 con la fusión del 17/02 —«Operativo manual» y «Operativo digital» son la misma categoría—, en cuatro tipos:
Operativo: diagnóstico, calibración, reparación, elaboración del informe.
Decisional: aprobación, rechazo, escalado a revisión, autorización de liberación sin factura, validación del informe.
Compras / Logístico: solicitud y llegada de repuestos, SKU, servicio externo, entrega de repuestos, remisiones.
Administrativo: por facturar, liberación comercial, facturación y cierre, emisión del informe.
Reglas:
Cada transición tiene un solo tipo. El informe, que era lo que se solapaba, pasa por tres tipos porque son tres actos distintos, cada uno con su nombre: Elaboración del informe → Operativo; Emisión del informe → Administrativo; Validación del informe → Decisional, como la aprobación técnica. Hoy ninguna transición es «creación de informe» —el informe solo aparece como un campo de fecha dentro de otras transiciones—, así que esa parte se aplica cuando el informe entre en el flujo (épica 1E) y no bloquea el resto.
La tabla de transiciones con su tipo la valida Gerencia antes de aplicarse.
Como el tipo es una propiedad de la transición, los movimientos registrados antes de aplicarlo quedan clasificados igual y no se pierde historial.
Consecuencia en permisos: las transiciones que se clasifiquen como Decisionales solo las ejecuta el Director o el Coordinador del área correspondiente (M1.9).
Se aplica en F1C-04, después del corte. Cierra el punto abierto nº 35 (sustituye al [ABIERTO] de revisiones anteriores: «esa clasificación no llegó al código»).
M1.4 Flujo equipo-nuevo [CONSTRUIDO]
Fuente: hoja DFequiponuevo030226 y blueprint «Ingreso equipo Nuevo» de Zoho. Corregido en la R05 y completado en la R08.2: la revisión anterior listaba una sexta fila, «Verificación → (aprobación implícita) → En Proceso», que no existe. La R05 la retiró con razón, pero dejó fuera la que sí ocurre —Verificación —Liberación→ Finalizado, 71 usos observados—, y de ese hueco salió el punto abierto nº 38.
[R08.4] La rama está construida en la aplicación como flujo propio (F1B-06, cerrada). El alta del equipo en el mismo paso que el ticket está construida en F1B-14 (cerrada). La guarda de Verificación, su salida rechazada y el certificado en la Liberación están en F1A-03, desbloqueada el 28/09 y en curso.
Seis transiciones, cinco estados. [R08.2]
Estado origen
Transición
Estado destino
Ingresado
Ingreso equipo nuevo
En Proceso
En Proceso
Producto no conforme
Notificado
Notificado
Análisis y acciones
Ingresado
En Proceso
Verificación
Verificación
En Proceso
Liberación
Finalizado
Verificación
Liberación
Finalizado [R08.2]
Dos caminos y un bucle: el normal (Ingresado → En Proceso → Finalizado), el desvío a Verificación —del que también se sale a Finalizado por Liberación—, y el bucle de producto no conforme —se notifica, se analizan acciones y el equipo regresa a Ingresado— muy alineado con los procesos ISO que maneja Ambientalia.
[DECIDIDO 23/09/2026 — R08.4] Salida rechazada de Verificación → Notificado, igual que el único caso de producto no conforme registrado. El volumen esperado es casi nulo; lo que importa es que exista. Entra con F1A-03 y todavía no figura entre las seis transiciones construidas.
Verificación sí tiene salida
Hasta la R08.1 este apartado sostenía que Verificación era un nodo al que se llega y del que no sale ninguna flecha. Era un defecto de documentación, no de operación. La sexta fila que la R05 retiró —«Verificación → (aprobación implícita) → En Proceso»— no existe: cero apariciones en 181 tickets. Pero la salida real sí existe y se usa.
Evidencia [R08.2]. Historial de estados de Zoho Desk de los 181 tickets con clasificación «Equipo Nuevo» (oct-2021 → ago-2026, extracción completa sin muestreo, todos en Finalizado): Ingresado → En Proceso, 192 · En Proceso → Finalizado por Liberación, 116 · En Proceso → Verificación, 72 · Verificación → Finalizado por Liberación, 71 · Verificación → Ingresado a mano, 2 · bucle de producto no conforme, 1. Verificación es paso del flujo, no registro, y Liberación tiene dos orígenes: En Proceso y Verificación. Las dos salidas manuales Verificación → Ingresado (#181 y #203, de 2021) son correcciones de estado hechas a los dos minutos.
[R08.4] Corrección C12 y punto nº 38: resueltos. La salida aprobada (Verificación —Liberación→ Finalizado) quedó establecida por los hechos en la R08.2 y está construida. El resto del punto 38 lo decidió Gerencia, con validación de Calidad, el 23/09 y el 28/09: obligatoriedad por tipo de equipo, criterio del lote AP-370 de 2024, salida rechazada a Notificado y certificado en la Liberación. Se desarrolla en los dos apartados siguientes.
Verificación obligatoria por tipo de equipo y gas patrón
Lo observado [R08.2]. En los mismos 181 tickets, la Verificación es una verificación con gas patrón. Pasan por ella los analizadores de gases y los convertidores; no pasan los equipos de partículas ni los accesorios.
Familia
Tickets
Pasan por Verificación
Horiba AP-370 (analizadores de gases)
81
58 (72 %)
Convertidores TRS / NH3
8
7 (88 %)
GRIMM EDM (partículas)
45
0
Dataloggers SICA
7
0
Shelters / mástiles
7
0
Environics calibrador / aire cero
7
0
Otros (sondas, meteorología, OCMA, Kunak…)
26
3
[DECIDIDO 23/09/2026 — R08.4] La Verificación es obligatoria por tipo de equipo, sea cual sea su marca: para analizadores de gases y convertidores, y no para el resto. Se convierte en guarda: no se libera un equipo de esos tipos sin pasar por Verificación. La guarda solo la exige cuando hay gas patrón del compuesto que mide el equipo.
El lote AP-370 de 2024 no es una excepción, es el criterio. Los 23 AP-370 sin Verificación (jul-2024, #601–#622, y oct-2024, #653 y #654) son analizadores de H₂S, TRS y NH₃, y Ambientalia no tiene gas patrón de esos compuestos. Los convertidores sí se verifican, porque se les pasa un gas que sí se tiene. Si se consigue gas patrón de H₂S, TRS o NH₃, la Verificación pasa a ser obligatoria también para esos analizadores.
[DECIDIDO 28/09/2026 — R08.4] De dónde salen el compuesto y la lista de gases patrón:
El compuesto medido vive en cada equipo (hoja de vida) y se hereda del modelo al darlo de alta. Cada modelo del catálogo lleva su compuesto por defecto: APSA-370 SO₂, APNA-370 NOₓ, APMA-370 CO, APOA-370 O₃, y los convertidores el compuesto que convierten. Cuando un equipo mide otra cosa —por ejemplo, un AP-370 configurado para H₂S, TRS o NH₃—, se corrige en su hoja de vida.
Los equipos existentes se rellenan con el valor de su modelo, y solo se corrigen a mano las excepciones conocidas (el lote de 2024). La siembra la ejecuta Alfonso en producción.
La lista de gases patrón es una tabla de la aplicación con compuesto, disponibilidad y fecha de vencimiento del certificado del cilindro. La mantiene el Director Técnico.
La guarda: un analizador de gases o un convertidor no se libera sin Verificación si existe un patrón vigente de su compuesto. Si no existe, se libera y queda registrado el motivo.
Liberación: certificado de calibración de fábrica
[DECIDIDO 28/09/2026 — R08.4] La transición Liberación exige el número del certificado de calibración de fábrica del equipo, en un campo de texto obligatorio, con opción de adjuntar el PDF. Se exige tanto si el equipo pasó por Verificación como si se liberó sin ella por falta de patrón vigente. No es retroactiva: los equipos liberados antes de construirla no se marcan ni se corrigen. El certificado propio de Ambientalia, con sus tres firmas, no se exige aquí: llega con el módulo de informes en 2027 (M2.5).
[R08.4] Queda abierto si la guarda de remisión de salida vigente (M1.7) se aplica también a la Liberación de equipo nuevo (Anexo D).
Alta del equipo en el mismo paso que el ticket
[DECIDIDO 24/09/2026 — R08.4] Cuando el ticket se clasifica como «Equipo nuevo», el equipo todavía no existe en el Registro de equipos, y el alta del ticket permite registrarlo en ese mismo paso:
Obligatorios: serial, modelo del catálogo, cliente y fecha de factura.
Opcionales: fecha de adquisición, fin de garantía, código interno, enlace a Drive y mantenedor.
El equipo queda creado en el Registro de equipos y el ticket enlazado a él. Si el serial ya existe, no se crea otro: se ofrece el equipo existente.
[CONSTRUIDO] F1B-14, «Alta y edición del equipo», cerrada; incluye también la edición de los seis campos comerciales con sus restricciones (M3.1). En las clasificaciones «Equipo para servicio de mantenimiento» y «Soporte remoto» el equipo tiene que existir, salvo el alta manual en recepción cuando ni el equipo ni el cliente están en las bases (corrección del 01/10, M3.4).
Lo que este flujo aporta a los demás
Es el único de los cuatro que tiene una etapa de control de calidad explícita. [R08.4] La corrección C6, decidida el 23/09, la toma como modelo: el estado Control de calidad de servicio técnico aplica la misma regla que la Verificación —checklist siempre; verificación con gas patrón solo cuando la pide el tipo de equipo y hay gas— (M9.1, F1C-07, después del corte).
M1.5 Flujo soporte-remoto [CONSTRUIDO]
Fuente: hoja DFsoporteremoto030226 y blueprint «Soporte Remoto» de Zoho. Verificado en la R05: las cuatro transiciones que este documento venía recogiendo coinciden con la hoja y con el blueprint.
[R08.4] Construido en la aplicación como flujo propio (F1B-06, cerrada el 29/09), separado del de servicio técnico. Un ticket de «Soporte remoto» nace en Solicitud Soporte, no en Ticket creado. Los cuatro pares son los de Zoho, sin cambios:
Estado origen
Transición
Estado destino
Solicitud Soporte
Asignación
En Proceso
En Proceso
Ejecutar
Finalizado
En Proceso
Soporte pendiente
Pendiente
Pendiente
Continuación soporte
En Proceso
El bucle de pausa permite medir tiempos reales de espera del cliente y separar trabajo activo de trabajo bloqueado. Ninguna de las cuatro transiciones pide fecha ni motivo, y la rama no tiene salida de anulación.
[DECIDIDO 30/09/2026 — R08.4] Pendiente se mantiene aquí, y solo aquí: en soporte remoto significa soporte en pausa. En la rama de servicio técnico se eliminó como paso intermedio (M1.3).
[DECIDIDO 24/09/2026 — R08.4] Modalidad: remoto / en sitio. Se elige al crear el ticket, solo en soporte remoto; si no se elige, queda «remoto»; después del alta no se cambia. Hasta que exista la rama de servicio en sitio (2027 T2, M1.6 b), toda visita a instalaciones del cliente se registra por esta rama, que no exige remisión. La regla de remisión vigente para habilitar un servicio técnico se mantiene sin excepciones. Las visitas registradas así son la base del levantamiento de cómo se presta hoy el servicio en sitio.
[R08.4] Tickets anteriores. Los tickets de soporte remoto que estaban en En Proceso, Pendiente o Finalizado pasan a este flujo. En cualquier otro estado siguen en el de servicio técnico, sin quedarse sin salidas.
[ABIERTO — R08.4] Área de las cuatro transiciones. Se construyó con Servicio Técnico como supuesto, porque la hoja de Zoho trae el área vacía y este documento no la decía. Si Gerencia decide que «Asignación» es de Comercial, se cambia un dato del catálogo (Anexo D).
M1.6 Modelo objetivo de máquina de estados
De dónde salen estas dos referencias y qué aportan [R08]. No son propuestas de Ambientalia: proceden de los estudios de mercado del Anexo A, concretamente del Estudio Funcional de Taller de Servicio y del benchmark de las doce herramientas. Se recogen aquí como material de contraste —«así modela esto quien lleva años haciéndolo»— y no como diseño acordado.
Referencia
De dónde viene
Qué aporta que el flujo actual no tenga
a) Taller
Estudio Funcional de Taller de Servicio
Tres cosas: parada del reloj del SLA en las pausas, un destino explícito para el abandono y una etapa de QA con retrabajo. Son huecos reales del blueprint, recogidos como correcciones C7, C2 y C6, y las tres están decididas (ver c).
b) Campo
Benchmark de herramientas de field service
El modelo de un servicio en casa del cliente: asignación, viaje, llegada, ejecución y validación, con marcas de tiempo por hito. Base de la cuarta rama, decidida para 2027 T2.
Cómo conviene leerlas [R08.4]. La referencia (a) ya cumplió su función: cada una de sus tres aportaciones se convirtió en una corrección concreta y Gerencia las decidió el 23/09. La referencia (b) es el punto de partida de la rama de servicio en sitio.
a) Referencia de taller
Fase
Estados
Notas
Recepción
Recepción
Cliente envía equipo; alta del ticket y del activo.
Diagnóstico
Inspección visual → Pruebas funcionales → Identificación de repuestos
Sub-estados internos del diagnóstico.
Interacción comercial
Cotización pendiente → Espera de aprobación → Aprobado / Rechazado
Rechazado deriva a «Devolución sin reparar».
Planificación
Verificar stock → En cola de reparación / Espera de repuesto
Check de stock automático al aprobar.
Ejecución
En ejecución ⇄ Pausa interna
Arranque de cronómetro al iniciar.
Control de calidad
Validación checklist → Calibración (si aplica) → QA aprobado / Retrabajo
Retrabajo vuelve a ejecución con prioridad alta.
Cierre
Embalaje listo → Entregado → Cerrado
Genera remito; cierra al facturar.
[R08.4] Es el modelo del estudio, no el de Desk 2.0: en Desk 2.0 no existe el estado «Entregado» (obsoleto en Zoho, corrección del 30/09) y el ticket termina al facturar (C4, M1.3.5).
b) Referencia de campo (para servicio en sitio)
Modelo del benchmark: Borrador → Por aprobar → Abierto → Asignado → En viaje (geo-fencing de salida) → En sitio (geo-fencing de llegada) → En progreso (check-in NFC) → En pausa → Validación de calidad → Cerrado. Sub-estados obligatorios de pausa: Espera de repuesto · Espera de cliente · Condiciones inseguras; cada uno debe detener el reloj del SLA de resolución.
[DECIDIDO 24/09/2026 — R08.4] El servicio en sitio entra como cuarta rama del blueprint en el segundo trimestre de 2027, no en 2026. Punto nº 43 resuelto.
Mientras tanto, las visitas a instalaciones del cliente se registran por soporte remoto con «Modalidad: en sitio» (M1.5). Esas visitas son la base del levantamiento de cómo se hace hoy, que se hace al comenzar 2027 y es requisito para construir la rama.
Primera versión: Asignado → En viaje → En sitio → En ejecución → En pausa → Validación de calidad → Cerrado. Usa un acta de visita firmada por el cliente en lugar de la remisión de entrada, y reutiliza el reloj del SLA, el control de calidad, la validación del informe y el árbol de inspección de las otras ramas.
Segunda versión: geolocalización y registro por NFC.
Las visitas registradas en 2026 se quedan en soporte remoto; la rama nueva solo aplica a los servicios que se abran desde su puesta en marcha. Si antes llegan instalaciones o puestas en marcha en sitio (por ejemplo, del proyecto de estaciones de calidad del aire), la construcción se adelanta.
c) Cómo se cierran las tres brechas del modelo objetivo
El modelo de taller aportaba tres cosas que el blueprint no tenía. [R08.4] Las tres están decididas desde el 23/09 y se construyen después del corte:
Elemento del modelo objetivo
Lo decidido
Tanda
Sub-estados de pausa que paran el reloj del SLA
[DECIDIDO 23/09/2026 — R08.4] No se crean sub-estados. El reloj del SLA tiene su propia lista de estados en los que se para, declarada aparte y no derivada de la vista del tablero. Se para solo cuando la demora no es de Ambientalia: Notificación cliente, Por Entregar y Por Entregar / Sin facturar (se espera al cliente), En espera de repuestos (al proveedor) y Servicio externo (al laboratorio externo). Sigue corriendo en las seis esperas internas: Notificación a Compras, Notificación Comercial, En espera de SKU, Solicitado, Liberación Comercial y Remisión creada. El cuadro de mando enseña dos tiempos: el del SLA, sin pausas, y el total que esperó el cliente. «Pendiente» de servicio técnico desaparece con la corrección del 30/09 (M1.3).
F1C-06 (C7 + C9)
«Devolución sin reparar» como destino del rechazo
[DECIDIDO 23/09/2026 — R08.4] Se resuelve con el estado terminal Anulado y sus cinco motivos (M1.10).
F1C-01 (C2)
Retrabajo tras fallo de QA, con prioridad alta
[DECIDIDO 23/09/2026 — R08.4] Se resuelve con el estado Control de calidad entre En Proceso y Por Facturar; si se rechaza, el ticket vuelve a En Proceso con prioridad alta y el retrabajo se mide (M9.1).
F1C-07 (C6)
M1.7 Reglas de transición: guardas, disparadores y tiempos
Guardas
Guardas decididas:
[DECIDIDO 17/02/2026, precisado en la R08.2] Habilitar Servicio no obliga a volver a diligenciar la OV ni la OC. Exige la orden de venta asociada y el número de serie, y la remisión de entrada vigente, sin excepciones (M1.2). La casilla «Cumple condiciones comerciales» se mantiene como confirmación y no es campo obligatorio.
[DECIDIDO 23/09/2026 — R08.4] El equipo no sale desde Por Entregar (ni desde Por Entregar / Sin facturar) sin la foto del equipo embalado y el checklist de QA firmado. Llega con el estado Control de calidad (C6, F1C-07, después del corte). (Sustituye a la redacción anterior «no se puede pasar a Entregado…»: «Entregado» es un estado obsoleto de Zoho que no existe en Desk 2.0; corrección del 30/09.)
[DECIDIDO 01/10/2026 — R08.4] Remisión de salida en la entrega. No se puede ejecutar «Entrega al cliente» (Por Entregar → Finalizado) ni su equivalente en la rama sin factura (Por Entregar / Sin facturar → Pendiente de facturar) si el ticket no tiene una remisión de salida vigente, es decir, creada y no anulada.
La remisión de salida se puede crear desde la propia transición, con los accesorios registrados a la entrada (M1.3.5).
Su fecha es la «Fecha Remisión de Salida», que se escribe una sola vez (C4).
Se suma a las guardas de C6.
Cuándo: si la remisión de salida ya se crea dentro de la aplicación, la guarda entra antes del corte del 14/12; si no, entra junto con la creación de la remisión desde la transición.
[ABIERTO] Si aplica también a la Liberación de equipo nuevo (Anexo D).
[DECIDIDO 24/09/2026 — R08.4] Liberación sin factura deja de ser una casilla: la ejecuta solo el Director Comercial y exige motivo de lista cerrada y fecha prevista de facturación (M1.3.5).
[DECIDIDO 28/09/2026 — R08.4] Liberación de equipo nuevo: Verificación obligatoria por tipo de equipo cuando hay gas patrón vigente, y número del certificado de calibración de fábrica (M1.4).
Guardas propuestas por los estudios, sin aprobar [R08]: se conservan como material de diseño y hay que decidirlas una a una antes de construir.
No se puede pasar de Diagnóstico a Cotización sin haber listado los repuestos necesarios y las horas estimadas.
No se puede iniciar la ejecución si el cliente no está en estado «Aprobado» — bloqueo financiero.
No se puede pasar de En progreso a Validación sin al menos dos fotos cargadas y el 100 % de los ítems críticos del checklist completados (modelo de campo).
[CONSTRUIDO] Casillas obligatorias. [CERRADO 09/09 — R08.2] Hasta el arreglo C1, una casilla marcada como obligatoria podía dejarse sin marcar y la transición se ejecutaba sin error. El único caso afectado era «Liberación del ticket sin facturar», precisamente la que deja salir un equipo sin factura. C1 se cerró en F1A-01 el 09/09/2026. Las liberaciones registradas antes del arreglo se marcan y no se reescriben (punto nº 64, resuelto; M1.3.5).
[CONSTRUIDO] Hoy no hay control de calidad intermedio: se pasa de En Proceso a Por Facturar por finalización de servicio. Cambia con el estado Control de calidad (C6, M9.1).
Las guardas del as-is estaban escritas [AS-IS — R05]
La hoja de mapeo del 16/02 tiene una columna llamada «OPERADORES (condiciones que se deben cumplir para transición)», y en ella dos transiciones llevan su condición escrita de forma explícita:
Transición
Condición documentada en el as-is
Situación [R08.4]
Liberación sin factura
«Liberación del ticket sin facturar: Validación checkbox condición Liberación del ticket sin factura is False». La hoja añade: «esta transición solo puede ser ejecutada por el gerente comercial» (el cargo formal es Director Comercial).
Resuelto. La casilla se exige desde el 09/09 (C1) y la restricción por cargo está construida (F1C-05): solo la ejecuta el Director Comercial. Desde el 24/09 la casilla se sustituye por motivo y fecha prevista de facturación.
Diagnóstico complementario
«cumple la condición Requiere envío a fábrica o diagnóstico adicional is True».
Sin guarda en la aplicación. Desde el 30/09 sale de En Proceso hacia Continuación del proceso (M1.3).
La lección se mantiene: era una regla de negocio escrita en el mapeo que se perdió al implementar. La transición que deja salir un equipo sin factura debía estar condicionada y restringida a un cargo; hoy está las dos cosas.
SLA y alarmas en horas hábiles
De dónde viene [R05]. El blueprint de Zoho Desk tenía un SLA de 1 día sobre el estado Notificado —el estado en el que un diagnóstico espera revisión—. Notificado es la antesala de todo lo comercial: de ahí salen el reporte por garantía, el escalado a comercial y la devolución a corrección. Un diagnóstico parado ahí retrasa la cotización, y la cotización es el reloj que el cliente percibe. La aplicación lo recuperó el 09/09/2026, con correo redundante al cambiar de área y escalado (corrección C11; punto nº 40 resuelto).
[CONSTRUIDO] Las tres alarmas, en horas hábiles (F1B-08, 29/09; decisiones del 17/09 y del 24/09). El punto nº 3 queda resuelto.
Estado
Alarma
Condición
Qué hace
Notificado
9 h hábiles (1 día hábil)
Siempre
Aviso de escalado
Remisión creada
27 h hábiles (3 días hábiles)
Solo si el ticket no tiene orden de venta
Aviso al Coordinador Comercial
Notificación cliente
36 h hábiles (4 días hábiles)
Para todos los clientes, sin aprobación ni rechazo
Aviso al Coordinador Comercial para que haga seguimiento, y marca de tablero «Esperando aprobación del cliente», que no es un estado
Destinatario: quien tenga el cargo Coordinador Comercial; si nadie lo tiene, el área Comercial. Para Remisión creada es un solo destinatario (decisión del 17/09, que corrige el aviso doble a Director y Coordinador). [ABIERTO] Que la alarma de Notificado vaya también al Coordinador Comercial es un supuesto de la construcción, coincidente con lo que propone su transición de escalado: ninguna decisión lo nombra.
Cuándo avisa: una vez por cada entrada al estado; si el ticket sale y vuelve a entrar, es una alarma nueva. Aviso en la aplicación y por correo.
Día hábil: lunes a viernes, de 8 a 17 h (9 horas), sin festivos de Colombia ni cierres de la empresa. Lo calcula una sola función compartida sobre el calendario laboral (F1B-12, cerrada), que usan también el reloj del SLA, el tiempo promesa, la fecha prevista de facturación y los indicadores en días hábiles. Ninguna otra pieza construye su propio cálculo.
La alarma y el reloj son independientes: el reloj del SLA se para en Notificación cliente porque la espera es del cliente (c7), y la alarma mide justamente esa espera.
[ABIERTO] Las alarmas se evalúan hoy en la pasada periódica de la sincronización con Zoho. Hay que moverlas antes de apagarla con el modo sin Zoho (1G-04) (M11, Anexo D).
El escalado sí actúa [R08, construido]. La ampliación que pedía la R08 —aviso redundante por correo además del aviso en la aplicación, y escalado cuando el estado se excede— está construida para las tres alarmas. Se apoya en la derivación de M1.9.2.
Disparadores automáticos
[DECIDIDO 20/08] Al ejecutar «Retorno de servicios externos», se alimenta automáticamente la hoja de vida del equipo.
[R03] Al liberar el equipo para entrega, se publica en el área de cliente la actualización de la hoja de vida reducida y, si aplica, el certificado de calibración (M8.3).
[CONSTRUIDO] Al ejecutarse cualquier transición, la aplicación calcula el área destinataria del aviso a partir del estado de llegada y notifica en la aplicación y por correo (M1.9.3).
[CONSTRUIDO] Al crearse o anularse una remisión de entrada, la aplicación mueve el ticket entre Ticket creado y Remisión creada sin intervención humana (M1.3.3).
[DECIDIDO 30/09/2026 — R08.4] Al ejecutar «Notificación cliente (SKU)», la aplicación avisa al técnico del ticket de que la pieza ya tiene SKU y se ha añadido al informe (M1.3, M4.4). Antes del corte.
[DECIDIDO 24/09/2026 — R08.4] Cuando el técnico marca un repuesto en el diagnóstico, el sistema aplica los tres casos de repuestos adelantados (reserva, solicitud a Compras o espera a la orden del cliente). El sistema no compra: genera la solicitud y Compras la ejecuta (M2.3, M5; F1D-06). (Sustituye a la propuesta de los estudios de generar la solicitud al entrar en «Pausa: espera de repuesto».)
[DECIDIDO 23/09/2026 — R08.4] Cuando la sincronización trae una orden de venta distinta de la elegida en la aplicación, se protege el dato de la aplicación y se avisa a Comercial (M1.10).
Propuesta de los estudios, sin aprobar: al aprobar el cliente, verificación de stock y correo automático al técnico. [CONSTRUIDO] Lo que existe hoy: «Aprobación» deriva el ticket a quien lo tomó y avisa al área de llegada (M1.9.2).
Transiciones por tiempo
[DECIDIDO 23/09/2026 — R08.4] Ninguna transición se ejecuta sola por tiempo (c3). Al cumplirse el plazo de una espera, el sistema notifica y sugiere:
en las dos esperas externas (En espera de repuestos y Servicio externo), sugiere a Comercial la salida: Por Facturar cobrando el diagnóstico, o Anulado con motivo;
en las internas, escala al área responsable.
El plazo de cada espera se fija con datos: lo que hoy tarda el 90 % de los tickets en ese estado, medido en el historial. Se conserva la vía de escape manual con traza decidida el 27/08. [DECIDIDO 30/09/2026 — R08.4] La salida la ejecuta solo la persona a cargo del ticket; si no está disponible, el Director o el Coordinador del área, con registro (M1.9.2). El punto nº 31 queda resuelto.
[DECIDIDO 24/09/2026 — R08.4] Cliente que no aprueba: a los 4 días hábiles en Notificación cliente, aviso al Coordinador Comercial y marca de tablero, sin estado nuevo (ver arriba). (Sustituye a lo decidido antes: plazo de 24/48 h con salida del equipo a una «cola de espera», y lista de tickets con más de 48 h como cuello de botella en la vista comercial.)
[CONSTRUIDO] Todo movimiento requiere que alguien pulse un botón o que el servidor reaccione a una remisión. Las alarmas avisan; no mueven tickets.
M1.8 Tipos de evento
[DECIDIDO 17/02] Se fusionan «operativo manual», «operativo comercial» y «operativo digital» en una única categoría Operativo, manteniendo separadas las categorías de decisión/aprobación. La clasificación resultante alimenta la analítica de tiempos por tipo de evento.
[DECIDIDO 01/10/2026 — R08.4] Se aprueba la corrección C5. Cada transición del blueprint lleva un solo tipo de evento, además de su área y sus campos, para analizar los tiempos por tipo (M7.3). Cuatro tipos, con la fusión del 17/02:
Tipo
Qué agrupa
Operativo
Diagnóstico, calibración, reparación, informes
Decisional
Aprobación, rechazo, escalado a revisión, autorización de liberación sin factura
Compras / Logístico
Solicitud y llegada de repuestos, SKU, servicio externo, entrega de repuestos, remisiones
Administrativo
Por facturar, liberación comercial, facturación y cierre
El informe en tres actos (decisión del 23/09): Elaboración del informe → Operativo (redactarlo y generarlo); Emisión del informe → Administrativo (cerrarlo como soporte del servicio facturable); Validación → Decisional, como aprobación técnica. Son tres actos distintos con tres nombres, y así se resuelve el solape de «informes». Se aplica cuando el informe entre en el flujo (épica 1E).
Cómo se aplica: Claude Code propone la tabla de transiciones con su tipo y Gerencia la valida antes de aplicarla. Va en F1C-04, con el bloque de correcciones 1C, después del corte.
El historial no se pierde: como el tipo es una propiedad de la transición, los movimientos registrados antes quedan clasificados igual.
Efecto en permisos: las transiciones Decisionales solo las ejecuta el Director o el Coordinador del área (M1.9.1). Conviene revisarlo al validar la tabla: por ejemplo, «Escalado a Revisión» la pulsa hoy el técnico que termina el diagnóstico.
El punto nº 35 queda resuelto.
La taxonomía de partida [AS-IS — R05]
Las cuatro hojas de mapeo traían la clasificación completa, con sus listas de eventos concretos. Es el origen de la tabla anterior:
Tipo de evento
Eventos que agrupa
Operativo manual
Ingreso a diagnóstico · Calibración · Ajuste de parámetros · Instalación de repuestos · Prueba funcional · Remisiones · Generación de informes · Generación de protocolos de servicio
Operativo digital
Ticket Desk · Remisiones · Generación de informes
Operativo Comercial
Crear oportunidad · Actualizar información · Seguimiento · Llamada comercial · Reunión técnica · Actualizar forecast
Decisional
Aprobar reparación · Rechazar garantía · Autorizar liberación sin factura · Escalar a revisión · Aprobación comercial · Aprobación técnica
Compras / Logístico
Solicitud de repuestos · Llegada de repuestos · Solicitud SKU · En espera de repuestos · Retorno de servicio externo · Entrega de repuestos · Remisiones de entrada y salida
Administrativo
Por facturar · Facturado y cierre de TK · Creación de informe · Liberación comercial · Notificado administrativo
Las hojas son del 3 al 16 de febrero, anteriores a lo decidido el 17/02, y por eso traen todavía las tres variantes operativas. Las categorías Compras / Logístico y Administrativo no estaban en la decisión del 17/02 y se conservan: la primera es la que permite medir el tiempo que el ticket pasa fuera del control del taller. La variante del flujo comercial (Operativo Comercial · Decisional Comercial · Cotización / Pricing, M1.11) queda en Zoho CRM con ese flujo.
[CONSTRUIDO] Hoy las transiciones de la aplicación tienen área y campos, pero no tipo de evento. Ninguna es «Creación de informe»: el informe solo aparece como el campo «Fecha Revisión Informe» dentro de otras transiciones, y hoy se hace fuera del flujo.
M1.9 Roles, permisos, derivación y avisos
M1.9.1 Permisos y traspaso
Permisos por área y por cargo. [DECIDIDO 23/09/2026 y 24/09/2026 — R08.4]
El área es la base, como hasta ahora: cualquiera de un área ejecuta sus transiciones. Cada transición declara el área o áreas que pueden ejecutarla: Comercial, Servicio Técnico o Compras. Algunas las comparten dos áreas (Comercial / Compras o Comercial / Servicio Técnico).
El cargo solo restringe, nunca amplía lo que el área niega, y lo hace con una lista corta de excepciones; lo que no está en la lista no cambia.
Siete cargos, con estos nombres: Director Técnico, Coordinador Técnico, Técnico, Técnico de campo, Director Comercial, Coordinador Comercial y Asistente Comercial. «Gerente comercial», el nombre que usaba la hoja de mapeo del 16/02, es el Director Comercial.
Excepciones por cargo:
Liberación sin factura → Director Comercial;
crear la OVI de garantía → Director Técnico;
fijar la prioridad de los Top 5 → Director Comercial.
Un administrador siempre puede.
Regla para el resto: las transiciones que F1C-04 clasifique como Decisionales solo las ejecuta el Director o el Coordinador del área; las demás, cualquiera del área (M1.8).
[DECIDIDO 01/10/2026 — R08.4] Rechazo desde Notificación cliente pasa a ejecutarlo solo el área Comercial, que es la que recibe del cliente la aprobación o el rechazo. Las otras dos transiciones «Rechazo» mantienen su área (M1.3).
[CONSTRUIDO] Nivel cargo construido en F1C-05 (30/09).
La restricción de Liberación sin factura ya actúa.
La de la prioridad Top 5 la usa F1B-07, en curso.
La de la OVI de garantía entra en uso con F1B-03.
Desde el despliegue, un usuario de Comercial que no sea administrador no ve el botón de Liberación sin factura hasta que un administrador le asigne el cargo en la consola de usuarios («Cargo de permiso»).
El cargo que sale en la remisión (cargo de firma) no da permisos. [ABIERTO] Que el usuario tenga dos campos de cargo es un punto abierto (Anexo D).
La fila F1C-05 sigue abierta por el nivel «propietario del registro».
Los tres niveles del as-is [R05, actualizado en la R08.4]. La hoja del 16/02 exigía una granularidad que el modelo por área no alcanzaba: en varias transiciones el responsable no era un área sino «Propietario del registro (Servicio Técnico)», es decir, quien tiene el ticket.
Nivel
Ejemplo del as-is
Situación
Área
La mayoría de transiciones
Construido
Cargo
Liberación sin factura, solo el Director Comercial
Construido (F1C-05, 30/09)
Propietario del registro
Solicitud y entrega de repuestos, finalización de servicio
Aplazado hasta que la restricción por cargo esté funcionando (c10). Se adelanta solo para las salidas de emergencia de las esperas (corrección del 30/09) y está previsto para Solicitud y Entrega de repuestos (corrección del 01/10). Ver M1.9.2.
El nivel cargo del punto nº 39 queda resuelto; el de propietario del registro sigue abierto. El dato para construirlo ya existe: la derivación de M1.9.2 sabe a quién está derivado cada ticket.
Visibilidad de estados por área. [ABIERTO — R08.4] La R08 daba por decidido que «cada usuario ve solo los estados y transiciones de su rol». [CONSTRUIDO] La aplicación hace otra cosa, de forma deliberada: todo el personal que entra en la aplicación ve todos los tickets, y solo se filtran las transiciones por área. Queda abierto qué estados ve cada área (Anexo D):
(a) Mantener lo construido: todos ven todo; solo se filtran las transiciones.
(b) Vista por área sin restricción: cada área abre por defecto un filtro con sus estados, pero puede ver el resto. Exige la lista de estados por área, que hoy no existe.
(c) Segmentación real en el servidor: cada área solo ve sus estados.
Recomendación: opción (b).
Traspaso. [DECIDIDO 14/08] El sistema formaliza el traspaso del ticket entre agentes al cambiar de fase. Cómo se hace: M1.9.2.
Prioridad. [DECIDIDO 21/09/2026 y 23/09/2026 — R08.4] La prioridad se fija en el cliente, no en cada ticket: se fija una vez y todos sus tickets la heredan. Al nacer un ticket manda la más alta entre la del contrato y la del Top 5; sin ninguna de las dos, se aplica la regla general.
Prioridad al nacer
A quién corresponde
Quién la fija
Situación
Alta
Cliente con contrato de mantenimiento vigente, también en los correctivos cotizados aparte
La impone el servidor desde el registro de contrato (M4.4)
Construido (F1B-11)
La que fije el Director Comercial (Alta, Media o Baja)
Cliente Top 5
El Director Comercial, que también mantiene la lista de quiénes son Top 5
En construcción (F1B-07)
Media o Baja
Cliente sin contrato ni Top 5, según su calificación («Portal Ambientalia · Valoración de Clientes», modelo de la R08)
Regla automática
[ABIERTO] De dónde sale la calificación y cuántos niveles hay (Anexo D)
Ajuste por ticket: solo en tickets de clientes Top 5, con motivo obligatorio, por el Director Comercial o un administrador. Deja traza y no mueve el reloj del SLA. [ABIERTO] Quién ajusta fuera de los Top 5; hoy solo puede un administrador (Anexo D). (Sustituye a lo escrito en la R08: «el resto de prioridades se asigna sólo manualmente y sólo por superadministrador o Director Técnico».)
[CONSTRUIDO] El técnico ya no puede cambiar la prioridad. El campo desaparece de su formulario en «Escalado a Revisión» y en «Devolución a corrección», y el servidor rechaza un cambio por otra vía.
Orden de la cola (decisión del 30/09). La cola se ordena en el servidor y aplica a «Mis tickets» y al tablero:
primero la prioridad: Urgent, High, Medium, Low y, al final, sin prioridad;
dentro de cada prioridad, por la fecha y hora del último «Habilitar Servicio» (la de creación si no hay ninguno), no por la de llegada.
(Sustituye al «FIFO inteligente por fecha promesa» de la R08.)
Pendiente sin destino en el plan: aplicar el Top 5 a los tickets abiertos que ya existían al marcar al cliente.
Nótese que este modelo cambia el criterio del diccionario (Anexo G, columna 9), donde High correspondía a «clientes con análisis favorable o contrato prioritario»: ahora el contrato manda, el Top 5 es la excepción manual y la valoración solo distingue entre los demás.
Organización del trabajo.
[ABIERTO] Especializar al equipo como cadena de producción (punto nº 11).
[PROPUESTO] Enrutamiento automático de tickets a técnicos según especialidad o carga de trabajo. [DECIDIDO 30/09/2026 — R08.4] No es una pieza independiente: se construye sobre el modelo de usuario, área y cargo y sobre la derivación de M1.9.2. Solo puede asignar a usuarios con el área y el cargo que permiten ejecutar la transición siguiente. Va con M6, después del corte.
M1.9.2 Derivación y protocolo de traspaso
El mapa de estados dice por dónde va el equipo. Hay una segunda pregunta que las etapas también responden: de quién es el trabajo a partir de aquí. Es la formalización del traspaso que se decidió el 14/08. [R08.4] Este apartado desarrolla también el protocolo de traspaso que GN pidió para el dolor nº 4 (§1.7, «No se sabe quién asume cada etapa»), separando lo construido de lo propuesto.
Lo construido [CONSTRUIDO].
«Derivado a» en cada transición. Todas las transiciones del blueprint terminan en una casilla «Derivado a», y ninguna la exige. Es deliberado: derivar no puede frenar un ticket.
Herencia por defecto. La mayoría de transiciones heredan al responsable que el ticket ya traía. Tres proponen a otro:
Etapa
Propone
Por qué
Escalado a Revisión
Cargo · Director Técnico
Escalar una revisión es subirla al inmediato superior.
Escalado a comercial
Cargo · Coordinador Comercial
El ticket sale de Servicio Técnico y pasa a Comercial.
Aprobación
Quien tomó el ticket
El cliente aprobó y el trabajo vuelve al taller. Ahí no hay puesto fijo: se devuelve a quien diagnosticó ese ticket.
Cargo, no persona. Las dos primeras nombran un cargo. Un identificador de persona ataría el blueprint a que ese empleado siga en la empresa, y el día que el puesto cambiara de manos la etapa derivaría a quien ya no está.
Aviso al área de llegada, en la aplicación y por correo, calculado desde el estado de llegada (M1.9.3).
Registro de cada transición con persona, fecha y hora (M1.10). La derivación queda guardada en el ticket y en su historial aunque se pierda un aviso.
Escalado de las alarmas al Coordinador Comercial (M1.7).
Protocolo de traspaso [PROPUESTO — R08.4]. Se apoya en lo construido y en las decisiones del 30/09 y el 01/10. Lo que ya está decidido se marca como tal; el resto es propuesta de esta revisión, pendiente de aprobar.
Quién recibe el ticket. Cada transición deriva el ticket a un área y, cuando su regla lo dice, a una persona. Hay cuatro reglas de destino:
el área del estado de llegada (por defecto);
un cargo (Escalado a Revisión, Escalado a comercial);
«quien tomó el ticket» (Aprobación);
la persona que tiene un papel fijo en esa etapa. Es el caso de los repuestos: [DECIDIDO 01/10/2026 — R08.4] «Solicitud repuestos» (En Proceso → Solicitado) la ejecuta el técnico a cargo y deriva el ticket al encargado de inventario, que es quien entrega las piezas. «Entrega de Repuestos» (Solicitado → En Proceso) la ejecuta el encargado de inventario y devuelve el ticket al técnico que lo tenía, como hace «Aprobación». Si no hay pieza en el almacén, el ticket pasa a En espera de repuestos para pedirla fuera (c3). Esta derivación se construye ya, antes del corte. [ABIERTO] Si «Encargado de inventario» es un cargo nuevo o una persona designada (Anexo D).
La persona a cargo. La persona a quien está derivado el ticket en cada momento es la persona a cargo de esa etapa. [DECIDIDO 30/09/2026 — R08.4] Ella ejecuta las salidas de emergencia de las esperas; en las dos esperas externas, la persona a cargo es de Comercial. Si no está disponible, la ejecuta el Director o el Coordinador del área, con registro.
Registro del traspaso. Cada traspaso queda registrado en el historial del ticket con:
persona de origen (quien ejecutó la transición);
persona o área de destino;
fecha y hora.
Se lee como una línea de traspaso, no hay que reconstruirlo a partir de los campos de la transición.
Aviso a quien recibe. El ticket aparece en «Mis tickets» de la persona de destino, en el orden de la cola (M1.9.1). Esa persona recibe aviso en la aplicación y por correo. Si el destino es un área, el aviso llega al área, como hoy.
Reasignación entre técnicos de la misma área. Cambiar la persona a cargo sin cambiar de estado exige un motivo y queda trazado con origen, destino, motivo, fecha y hora. La pueden hacer la persona a cargo y el Director o el Coordinador del área.
Ausencias. Si la persona a cargo no está, el Director o el Coordinador del área reasigna el ticket o ejecuta la salida que corresponda, siempre con registro. La disponibilidad por usuario (vacaciones y ausencias) llega con M6.
Restricción de quién ejecuta. Que solo la persona a cargo pueda ejecutar cada paso es el nivel «propietario del registro», aplazado (M1.9.1). Hasta entonces, la derivación indica de quién es el trabajo pero cualquiera del área puede ejecutar la transición. Hay dos excepciones decididas: las salidas de emergencia, que se adelantan a ese nivel, y la pareja Solicitud / Entrega de repuestos, que se restringe cuando ese nivel exista.
Situación de cada pieza.
Pieza
Estado
Cuándo
«Derivado a», herencia y las tres propuestas por cargo o por «quien tomó el ticket»
Construido
—
Aviso al área de llegada, en la aplicación y por correo
Construido
—
Registro de persona, fecha y hora en cada transición
Construido
—
Escalado de las tres alarmas
Construido (F1B-08)
—
Derivación de Solicitud y Entrega de repuestos al encargado de inventario y de vuelta al técnico
Decidido 01/10
Antes del corte; propuesta de asignación, pendiente de confirmar fila
Salida de emergencia por la persona a cargo
Decidido 30/09
Después del corte; recomendación: dentro de F1C-03
Línea de traspaso en el historial, aviso personal y reasignación con motivo
Propuesto R08.4
Recomendación: en la fila F1B-05, que el plan ya reserva para el «traspaso formal entre agentes al cambiar de fase» (sin empezar); queda por confirmar si entra antes del corte
Restricción por propietario del registro
Aplazado (c10)
Después de la restricción por cargo
M1.9.3 Avisos: a quién se le notifica
[CONSTRUIDO] El destinatario del aviso se calcula desde el estado de llegada, no desde el área que ejecutó la transición, y se le restan las áreas de quien pulsó. El motivo es concreto. Escalado a comercial sale de Notificado, la pulsa Servicio Técnico y deja el ticket en Notificación Comercial. Avisar por el área de la transición ejecutada mandaría el aviso justo a quien acaba de hacer el trabajo. Y la resta importa igual: Facturado deja el ticket en una fase que también es de Comercial, y sin restar las áreas del ejecutor se avisaría a Comercial de que le toca a Comercial.
Un administrador tiene las tres áreas, así que no dispara ningún aviso de área: si hace el trabajo de las tres, no hay a quién pasarle el testigo.
[CONSTRUIDO] Primero se guarda la transición y después el aviso. El aviso se escribe después de la transición, en un paso aparte. Si el envío del correo falla, queda pendiente y se reintenta, sin deshacer la transición.
[DECIDIDO 24/09/2026 — R08.4] Pérdida de aviso aceptada, con revisión nocturna. Se acepta que una caída entre la escritura de la transición y la del aviso pueda perder el aviso. La transición y la derivación quedan siempre guardadas, y quien la recibe la ve igual en su vista. Como protección, una revisión nocturna recorre las transiciones del día, recalcula a quién correspondía avisar (estado de llegada menos las áreas de quien ejecutó) y crea los avisos que falten.
[DECIDIDO 24/09/2026 — R08.4] Borrado de administrador, limitado:
Solo para tickets sin actividad real: sin remisión, sin orden de venta y sin transiciones posteriores a su creación. Todo ticket con actividad se cierra con Anulado (M1.10).
Exige un motivo de lista cerrada: creado por error · duplicado · prueba.
Antes de borrar, escribe en un registro de borrados que nadie puede modificar ni borrar: quién, cuándo, motivo y copia completa del ticket.
Los tickets traídos de Zoho no se pueden borrar.
Con esto el borrado es compatible con la auditoría inmutable de M11.4. El punto nº 36 queda resuelto.
La bandeja de avisos de la cabecera recibe también:
las alarmas de SLA (M1.7);
el aviso a Comercial cuando la sincronización trae una orden de venta distinta de la elegida en la aplicación (M1.10);
el aviso al técnico cuando Comercial/Compras registra el SKU (M1.3).
M1.10 Registro de tiempos, anulación y métricas
Debe quedar registro del momento de llegada a cada etapa, para el análisis de tiempos entre fases y por ramas del flujo.
[DECIDIDO — R08] Toda etapa y toda transición deben registrar fecha, hora y persona. Es requisito de log y de análisis, y no admite excepciones. Sin el «quién» no hay trazabilidad de responsabilidad, que es lo que la derivación de M1.9.2 necesita. Sin la hora exacta no son calculables ni los tiempos entre fases ni los tres bodegajes de más abajo.
[CONSTRUIDO] La aplicación escribe la marca de tiempo y el usuario de cada transición en el mismo registro del historial. Está comprobado en todas las transiciones (F0-04). Ninguna fila del historial se escribe sin actor.
Cuando la transición la provoca un proceso automático sin usuario identificado (por ejemplo, la remisión creada desde el servicio de automatización), queda un actor de respaldo, no una persona. Queda por decidir cómo se identifica ese caso.
[CONSTRUIDO] Las fechas derivadas las impone el servidor (decisión del 10/09; F1A-07, cerrada el 22/09). Fecha creación ticket, Fecha Remisión Entrada y Fecha Revisión Informe las calcula el servidor, que ignora lo que llegue de la pantalla para esos tres campos. Fecha Remisión Entrada abre el bodegaje de entrada: si pudiera llegar mal, la corrección C9 quedaría resuelta solo sobre el papel.
La zona horaria está fijada (Bogotá). Dos de las tres fechas —Fecha creación ticket y Fecha Revisión Informe— se derivan de una marca de tiempo convertida a día local. Sin zona fijada, cinco horas de cada día cambiarían de fecha: un ticket creado a las 19:30 en Bogotá es 00:30 UTC del día siguiente. El cálculo no hereda la zona del proceso que lo ejecuta.
De dónde viene el bodegaje [R05]. El diccionario documentaba el bodegaje de entrada en la columna 56 (diferencia entre Fecha creación ticket y Fecha Remisión Entrada), con la instrucción «2026 omitir esta información». La columna 48 explica por qué: «para 2026 este cálculo se encuentra pendiente de reorganización, debido a que el área comercial crea los tickets con anterioridad a la llegada física del equipo, lo que afecta la precisión del indicador». Las columnas 48 y 56 quedan fuera de la lista de indicadores y las sustituyen los tres bodegajes (Anexo G).
Una decisión correcta que rompió un indicador [R05]
Merece nombrarse porque es el patrón, no la anécdota. El alta anticipada por Comercial —decidida el 20/08 para habilitar el control automático de garantía— y la exigencia de orden de venta —decidida el 21/08 para no bloquear la trazabilidad— son dos decisiones buenas y bien fundadas. Entre las dos invalidaron un KPI, porque la fecha de creación del ticket dejó de significar «el equipo llegó».
Nadie lo registró. El indicador simplemente dejó de calcularse bien, y la única traza de ello vive en una nota al margen del diccionario.
Corrección C9, punto nº 41 [R08.4: parcial]. El bodegaje se redefinió contra hitos que siguen significando lo mismo (abajo), leyendo el historial de transiciones y no la fecha de creación del ticket. Sigue abierto el hito de inicio del servicio y del diagnóstico, afectado por la misma creación anticipada. El hito de referencia debe ser siempre la transición, nunca el estado inicial, porque el ticket puede nacer en estados distintos según su origen (M1.3.2).
Los tres bodegajes [DEFINIDO — R08]
Bodegaje es el tiempo que un equipo pasa en Ambientalia esperando una respuesta del cliente, es decir, tiempo que no depende de nosotros. No mide desempeño del taller: mide demora del cliente, y por eso nunca debe sumarse a un indicador de servicio.
Bodegaje
Empieza cuando
Termina cuando
Se calcula con
De entrada
El equipo llega a las instalaciones
Llega la orden de compra del cliente y se genera la orden de venta
Fecha Orden De Venta − Fecha Remisión Entrada
De proceso
Se envía al cliente la cotización de la reparación
El cliente la aprueba con su orden de compra
Fecha Orden de Compra − Fecha de Cotización
De salida
Se avisa al cliente de que puede recoger el equipo
El cliente lo recoge
Fecha Remisión de Salida − fecha de aviso al cliente
[R08.4] Se miden en días naturales, no hábiles (confirmado el 30/09).
El de entrada cuenta 0 si la OV llega antes que el equipo.
[CONSTRUIDO] Entrada y proceso están construidos (09/09) sobre el historial de transiciones, no sobre columnas.
El de salida necesita un campo que no existe: la «fecha de aviso al cliente» de que el equipo está listo. La columna 51 lo aproxima con la hora del último cambio de estado, que no es lo mismo: si el aviso se demora dos días respecto a la finalización, esos dos días son de Ambientalia y el indicador se los atribuye al cliente. Lo natural es que lo escriba la propia transición que habilita la entrega (F1C-06).
Por qué esto arregla el indicador roto. El bodegaje de entrada así definido no depende de la fecha de creación del ticket. Ancla en dos hechos físicos y comerciales —el equipo llegó, la OV se generó— que siguen significando lo mismo aunque cambie cuándo se abre el registro.
Relación con el reloj del SLA [R08.4]. C7 y C9 se construyen juntas (F1C-06), pero la lista de estados que paran el reloj es propia (c7) y no se deriva de los bodegajes:
Notificación cliente y Por Entregar, donde transcurren los bodegajes de proceso y de salida, paran el reloj.
Remisión creada, donde transcurre el bodegaje de entrada, es una espera interna de Comercial y el reloj sigue corriendo en ella.
La regla general que conviene adoptar: toda decisión que cambie el momento en que se crea un registro o se rellena una fecha debe revisar los indicadores que dependen de ella.
Tiempo promesa global (corrección del 30/09): tiempo de diagnóstico + días de entrega, en días hábiles y sin las esperas ajenas de c7. Ver M4.1.
Propiedad del dato de la orden de venta. [DECIDIDO 21/09/2026 y 23/09/2026 — R08.4]
Si la orden de venta se eligió en la aplicación, manda la aplicación: la sincronización no pisa ni el número ni su fecha. Si no, manda Zoho, como hasta ahora.
Cuando la sincronización trae una orden distinta de la elegida en la aplicación, se protege el dato y se crea un aviso al área Comercial en la bandeja de la cabecera, con la orden que trae Zoho y la que tiene la aplicación, para corregirlo a mano.
Un solo aviso por ticket mientras la discrepancia no cambie.
Cuando exista el «espejo de Zoho» (línea futura, M11), la misma información se mostrará allí.
Se construye en F1B-11.
Anulación
[CONSTRUIDO] Hoy ningún estado lleva a algo parecido a «Anulado». Un ticket que hay que abandonar —el cliente se echa atrás, el equipo resulta irreparable— se empuja por Rechazo hasta Por Facturar, y de ahí a Finalizado. Finalizado mezcla «terminado bien» con «abandonado», y eso contamina las tres métricas que cuentan servicios cumplidos:
Métrica afectada
Cómo la contamina
Servicios finalizados
Cuenta como cumplidos los servicios que se cayeron.
Tiempo promedio de servicio
Un ticket abandonado en el día 2 y otro entregado en el día 30 pesan igual.
Cumplimiento (OTD)
Un servicio abandonado puede aparecer como entregado a tiempo.
Es el eje ② calculando sobre ruido producido por el eje ①, que es exactamente lo que §1.4.2 advierte que no puede pasar.
[DECIDIDO 23/09/2026 — R08.4] Estado terminal Anulado, con motivo (C2). El punto nº 32 queda resuelto.
Cinco motivos, la misma lista que usa el informe de salida:
el cliente no aprueba o se echa atrás;
sin solución técnica;
repuesto no disponible;
caducidad de espera: el cliente no responde ni retira el equipo;
otro, con texto obligatorio.
«Creado por error» y «duplicado» no se anulan: se borran (M1.9.3), para no contaminar la cifra de abandonos.
Desde dónde: desde las dos esperas externas, por decisión de Comercial (c3); Solicitado y En espera de SKU no se anulan. Los demás orígenes se fijan al construir F1C-01 sobre la propuesta de la R08: los estados donde hoy se usa Rechazo como sucedáneo.
Histórico: se marca, no se reescribe.
Los candidatos se sacan por la huella del apaño (tickets que pasaron por Rechazo y terminaron en Finalizado) y una persona los confirma.
Los confirmados siguen como Finalizado, como se registraron, pero llevan la marca «abandonado» con su motivo.
No se cambia el estado de tickets cerrados, por la auditoría inmutable de M11.4.
El mismo criterio se aplica a las liberaciones sin factura anteriores al arreglo de C1.
Los anulados y los marcados salen de las tres métricas de la tabla.
F1C-01, después del corte.
Borrar no es anular. El borrado de administrador queda limitado a tickets sin actividad real y deja copia en un registro inmutable (M1.9.3). Un servicio real que se cayó necesita quedar contado aparte, no desaparecer.
M1.11 Flujo comercial [AS-IS]
Fuente: hoja DFcomercial050226, pestaña «comercial», y su diagrama. Transcrito por primera vez en la R05 — cierra el punto abierto nº 1.
[DECIDIDO 21/09/2026 — R08.4] Este flujo se queda en Zoho CRM y no entra en Desk 2.0 en 2026. Se conserva la transcripción como referencia del contorno comercial.
Es el flujo del pipeline de venta, anterior al ticket de servicio y distinto de él: aquí no hay equipo en la mesa, hay una oportunidad. Diez transiciones, nueve estados y dos terminales.
Estado origen
Transición
Estado destino
Tipo de evento
Inicio
Especificaciones
Evaluación Especificaciones
Operativo Comercial
Evaluación Especificaciones
Ajuste Espec.
Ajuste Especificaciones
Decisional Comercial
Ajuste Especificaciones
Análisis Causa
Cerrado Perdido
Decisional / Operativo Comercial
Ajuste Especificaciones
Preparación Cotizac.
Cotización
Cotización / Pricing
Cotización
Ajuste Cotizac.
Ajuste Cotización
Decisional Comercial · Cotización / Pricing
Ajuste Cotización
Recotizar
Cotización
Decisional Comercial · Cotización / Pricing
Cotización
Seguimiento Cotizac.
Negociación
Operativo Comercial
Ajuste Cotización
Seguimiento no adj.
Negociación
Operativo Comercial
Negociación
Orden Compra
Fase Cierre
Decisional Comercial · Cotización / Pricing
Fase Cierre
Cierre
Cerrado Ganado
Operativo / Decisional Comercial
Todas las transiciones son responsabilidad del área Comercial.
Qué hace este flujo que el de servicio técnico no hace
Distingue el final bueno del malo. Cerrado Ganado y Cerrado Perdido son dos estados terminales distintos, y la transición que lleva al segundo se llama Análisis Causa: no solo registra que se perdió, obliga a decir por qué.
Es lo que la corrección C2 decidió para servicio técnico el 23/09: el estado Anulado con motivo obligatorio (M1.10). La casa ya lo hacía en el pipeline comercial, incluida la buena idea de exigir la causa en la propia transición.
El bucle de cotización
Cotización ⇄ Ajuste Cotización es un ciclo deliberado, con las razones documentadas en el propio mapeo: ajuste de cantidades, inclusión o eliminación de ítems, o cambio de las condiciones comerciales. Y tiene una salida por cada lado —Seguimiento Cotizac. desde Cotización, Seguimiento no adj. desde Ajuste Cotización— de modo que el ciclo nunca atrapa la oportunidad. [R08.4] Era el contraste útil con el ciclo Por Facturar ⇄ Por Entregar / Sin facturar de servicio técnico, que podía recorrerse indefinidamente y pisaba una fecha en cada vuelta. C4 lo eliminó el 23/09 con dos ramas sin ciclo (M1.3.5).
Una discrepancia a resolver
La hoja registra que Preparación Cotizac. sale de Ajuste Especificaciones; el diagrama la dibuja saliendo de Evaluación Especificaciones, en vertical y sin pasar por el ajuste. La diferencia no es cosmética: determina si toda oportunidad tiene que pasar obligatoriamente por una etapa de ajuste de especificaciones antes de poder cotizarse, o si puede cotizarse directamente cuando la primera entrevista no dejó nada pendiente.
Leyendo la descripción del propio mapeo —el ajuste se activa «en caso de que durante la primera entrevista hayan quedado aspectos pendientes por definir»— lo razonable es que existan las dos salidas desde Evaluación Especificaciones. Pero es una definición de proceso, no una interpretación que corresponda a este documento. [ABIERTO] Punto nº 42. [R08.4] Como el flujo se queda en Zoho CRM, su resolución es del proceso comercial y no bloquea nada de Desk 2.0.
Alcance de este flujo en Desk 2.0
El pipeline comercial vive en Zoho CRM, no en Desk 2.0, y así se mantiene en 2026. Su relación con el ticket de servicio:
Es el origen de la orden de venta. La OV es obligatoria para trabajar, no para recibir el equipo (M1.2). Fase Cierre → Cerrado Ganado es el punto exacto donde nace la OV que después habilita el servicio.
Alimenta la predicción de carga (M7.4): las oportunidades en Negociación y Fase Cierre son trabajo que aún no ha llegado al taller pero que va a llegar.
Idea del revisor [R08]: precarga de repuestos hacia el CRM. Que Servicio Técnico precargue en Desk 2.0 los artículos objeto de cambio o mantenimiento, y que esa lista genere automáticamente un borrador de cotización en Zoho CRM. Ataca un reproceso real: el técnico ya identifica los repuestos durante el diagnóstico (M2.3) y alguien vuelve a teclearlos después para cotizar. Es el error de captura del §1.4.3 en su forma más cara, porque una referencia mal transcrita en una cotización se factura.
[DECIDIDO 17/09/2026 — R08.4] La aplicación no escribe en Zoho por ahora. Si hace falta, habrá en la aplicación un «espejo de Zoho» para comparar y escribir a mano en Zoho, hasta que se active la escritura (línea futura, M11). Un borrador de cotización es una escritura, así que el borrador automático espera a esa línea futura. Mientras tanto, la lista de repuestos del diagnóstico la lleva Comercial a mano al CRM. El punto nº 44 queda resuelto.
Idea del revisor [R08]: visibilidad del trato desde el ticket. Poder ver desde Desk 2.0 en qué etapa del flujo comercial está el trato asociado a un ticket, y sus comentarios. Es de lectura, así que es compatible con la política de no escribir en Zoho. Resuelve una pregunta que hoy se responde por chat: «¿el cliente ya aprobó?». Encaja con las esperas de M1.3.4: Notificación cliente, En espera de SKU inventario y En espera de repuestos esperan algo que el CRM sabe antes que Desk 2.0. El conector propuesto en M11.3 —que al marcar «Ganada» en el CRM el caso pase a cola de reparación— se enganchará en la transición Cierre.
M1.12 Flujo posible-cliente [AS-IS]
[FUERA DE ALCANCE — R08] El revisor determinó que este flujo no es necesario para Desk 2.0: la cualificación de leads vive en Zoho CRM y no toca al ticket de servicio en ningún punto. [DECIDIDO 21/09/2026 — R08.4] Se queda en Zoho CRM, igual que el flujo comercial (M1.11).
Se conserva la transcripción —cuatro transiciones, cinco estados— porque cerrarla costó el punto abierto nº 1 y porque documenta el contorno del proceso comercial, pero no se construye nada de este flujo en Desk 2.0 y no genera ítems de backlog.
Fuente: hoja DFcomercial050226, pestaña «posible-cliente». Transcrito por primera vez en la R05.
Es el flujo de cualificación previo al pipeline: qué se hace con un lead antes de tratarlo como oportunidad. Cuatro transiciones, cinco estados, dos terminales.
Estado origen
Transición
Estado destino
Tipo de evento
Inicio
Asignación
Asignar Responsable
Decisional Comercial
Asignar Responsable
Contacto
Cualificación
Decisional Comercial
Cualificación
Descartado
No cualificado
Decisional Comercial
Cualificación
Requerimiento
Convertir a Trato
Decisional Comercial
Convertir a Trato es el enganche con M1.11: un lead cualificado se convierte en el Inicio del flujo comercial.
Observaciones. El flujo es enteramente decisional —no hay ninguna etapa operativa— y separa el descarte del éxito en dos terminales distintos, de modo que la tasa de cualificación es medible sin depender de ningún campo auxiliar.
La hoja escribe el estado como «Convertire a Trato». Se recoge aquí como Convertir a Trato; conviene corregirlo en el origen.
M2. Diagnóstico guiado y base de conocimiento
Este es el módulo que convierte la pericia de los técnicos en un proceso repetible, medible y defendible comercialmente. Nace del trabajo sobre el diagnóstico de equipos Grimm, hoy con 78 puntos de control documentados.
M2.1 Estructura del árbol de diagnóstico
[DECIDIDO] Se evoluciona de una lista lineal a un árbol de decisiones con ramas lógicas sí/no. [R08.2] Decisiones del 03/09/2026: una sola tabla de puntos de control para Grimm y Horiba —se elimina la separación entre tabla de inspección y tabla interna— y validación por nivel macro, desplegando subniveles e ítems únicamente cuando el nivel macro resulte «no OK».
[DECIDIDO] El flujo se organiza por fases lógicas y secuenciales, de macro a micro, no por sistemas. [R08.4] Las fases macro no son comunes a todo el portafolio: son los niveles N1 del catálogo de cada marca (ver más abajo, decisión del 23/09). El Grimm EDM180 ya tiene su catálogo (v1.8, ocho N1); su construcción en la aplicación va con la épica 1D, después del corte.
El criterio de ordenamiento es ir de lo más incapacitante a lo menos incapacitante: la primera prueba es siempre la más gruesa —¿el equipo enciende? sí/no— y sólo al fallar se abre el detalle.
Los niveles macro (N1) de cada catálogo [DECIDIDO 23/09/2026 — R08.4]
[R08.4] Las cuatro macro-fases comunes del 27/08 —física, neumática, óptica y electrónica— quedan superadas (p45-macro-fases, 23/09/2026). La regla vigente es ésta:
Los N1 son propios de cada marca, no comunes a todas. El Grimm EDM180 conserva sus 8 N1 (catálogo v1.8) y el Horiba sus 10 N1 (catálogo v1.4), tal como están en los catálogos.
Dentro de una misma familia tecnológica los N1 sí son comunes: los 10 del Horiba valen para los cuatro AP-370.
Lo que hace del diagnóstico una plataforma es el motor, no las fases. El motor es uno y cada equipo entra como datos importados de su catálogo; la tanda F1D-03 genera las transiciones internas de Rev./Diagnostico desde los N1 de cada catálogo.
Comparación entre marcas. Si más adelante el análisis de tiempos necesita comparar fases entre marcas, se añade al catálogo una columna opcional de categoría común, sin tocar los N1.
Ajustes en el catálogo Horiba: en el APNA, «Conexiones neumáticas traseras» pasa de Gabinete a Línea de muestreo, y se unifican entre los cuatro modelos los nombres de N2 que designan lo mismo.
El comportamiento de cada nivel macro no cambia: si el N1 aprueba, se asumen correctos sus subniveles e ítems; si falla, despliega su checklist específico. Punto abierto nº 45: cerrado (23/09/2026).
La arquitectura híbrida [DECIDIDO 27/08]
Lo decidido el 27/08 resuelve la pregunta de fondo que este apartado tenía abierta, y lo hace de una forma que no estaba sobre la mesa.
El problema era éste: si cada verificación del diagnóstico se modela como una transición de estado, hay que construir una estructura distinta por tecnología —Grimm, Horiba, Environics, sondas— y el esfuerzo de desarrollo se multiplica por cada marca que entre al portafolio. Es lo que hacía inviable el árbol de decisiones tal como se venía planteando.
La solución acordada separa las dos cosas [R08.4] (tabla actualizada con la decisión del 23/09):
Nivel
Qué es
Varía por marca-modelo
Macro (N1 del catálogo)
Transición interna dentro de Rev./Diagnostico, generada desde el catálogo de cada equipo (F1D-03)
Sí, por marca; comunes dentro de cada familia tecnológica (los 10 N1 del Horiba valen para los cuatro AP-370)
Checklist dentro de cada macro
Contenido parametrizado, con niveles jerárquicos, casillas de verificación y campos de valor (voltajes, flujos, fugas, corriente de láser)
Sí. Es un dato de configuración, no código
Por qué importa tanto. Incorporar un equipo nuevo deja de ser un desarrollo y pasa a ser rellenar una plantilla. El flujo no se rediseña: se parametriza. Y hay un antecedente concreto de viabilidad —el Excel de transiciones entregado en febrero fue interpretado correctamente por la herramienta de desarrollo—, lo que respalda alimentar los checklists desde plantillas en Excel en lugar de desde una pantalla de administración.
[R08.4] Se mantiene la arquitectura híbrida: motor único, niveles macro como transiciones dentro de Rev./Diagnostico y checklist como datos cargados desde el Excel del catálogo. Lo que cambió el 23/09 es el nivel macro: no hay un juego común a todas las marcas, sino los N1 de cada catálogo. La variabilidad entre marcas vive en los datos, no en el motor.
La inspección visual previa y las fotos de recepción y entrega [DECIDIDO 01/10/2026 — R08.4]
[R08.4] Hay que distinguir dos momentos con reglas de foto distintas.
1. Remisiones de entrada y de salida: la foto es siempre obligatoria (corrección de Gerencia del 01/10/2026, que sustituye a la regla «foto solo con novedad» que la recepción aplicaba hasta ahora):
Remisión de entrada. Haya o no novedad, al menos una foto del equipo, una de los accesorios y una del embalaje con el que llegó. Si se marca una novedad, se añade además su foto, como hasta ahora.
Remisión de salida. También obligatoria, como soporte de entrega ante el cliente: equipo, accesorios y embalaje. Son las mismas fotos que exige el Control de calidad (C6, «no se entrega sin foto del equipo embalado»), y no se piden dos veces.
Cuándo. Antes del corte del 14/12: se ajusta la remisión de entrada que la aplicación ya tiene en uso y se añaden las fotos a la remisión de salida.
2. Inspección visual del diagnóstico: la foto sólo con novedad. Es la inspección levantada por Servicio Técnico el 27/08:
Se hace antes de energizar el equipo, por componentes, con alcance variable según lo que haya ingresado según remisión.
La fotografía se exige sólo cuando hay novedad, no siempre. Es una decisión de fricción: obligar a fotografiar lo que está bien multiplica el trabajo sin añadir información. La misma regla vale para los checklists del catálogo.
Rutas abreviadas [DECIDIDO 23/09/2026 — R08.4]
Equipo sin novedades: no hay ruta abreviada. Lo decidido el 03/09, confirmado el 23/09 (p15-p59-rutas): debe recorrer igualmente las etapas macro, dejando constancia de que se revisaron y salieron conformes. Sin ese recorrido no hay diferencia registrable entre «se revisó y estaba bien» y «no se revisó». Con el checklist dinámico pasa rápido: marca OK en cada macro y no despliega detalle.
Calibración directa: sí. Cuando la orden de venta ya cubre la calibración, el ticket salta diagnóstico, cotización y aprobación y pasa directamente al trabajo, con tres condiciones: (1) sólo con la orden de venta de calibración asignada; (2) si aparece una falla, sale a la ruta completa para cotizar; (3) pasa igualmente por el Control de calidad. Se construye preferentemente con el tipo de servicio de F1B-03, que ya oculta los pasos que no aplican; F1C-08 se queda con lo que F1B-03 no cubra.
Puntos abiertos nº 15 y nº 59: cerrados (23/09/2026).
Equipo piloto de modelado [DECIDIDO 21/08]
Se utiliza el flujo del modelo Grimm EDM 180/280 como proyecto piloto, por ser el equipo más complejo del catálogo: estandarizar su flujo facilita después adaptar Horiba y Environics.
[TAREA — equipo técnico] Diseñar el borrador de macro-fases y micro-fases de un equipo Grimm y entregarlo a Alfonso para su programación. La instrucción explícita es no perderse en detalles microscópicos. [R08.4] Hecha: el catálogo del Grimm EDM180 está en su versión v1.8, y la primera etapa de la fase de inspección física está realizada y socializada (01/10/2026).
M2.2 Estructura de cada punto de control
Campo
Contenido
Uso
Fase
Etapa lógica a la que pertenece la prueba (N1 del catálogo)
Ordena el árbol y agrupa los tiempos
Prueba
Qué se verifica
Instrucción al técnico
Valor esperado
Rango o resultado correcto
Base de la comparación
Criterio de falla
[R08.4] Dos atributos: Cobro y Liberación (ver abajo)
Determina la acción, el impacto comercial y si el equipo puede liberarse
Acción automática
Qué hace el sistema al fallar
Motor de automatización del diagnóstico
Niveles de criterio de falla [DECIDIDO 01/10/2026 — R08.4]
[R08.4] La escala única Alerta / Cobrable / Bloqueante se quedaba corta: hay casos intermedios. Cada ítem del catálogo lleva dos atributos independientes:
Cobro: No · Incluido en el servicio (se corrige sin línea de cotización: ajuste, limpieza, consumible incluido en el contrato) · Cotizable (genera línea de cotización).
Liberación: No impide · Impide salvo aceptación escrita del cliente (puede entregarse si el cliente acepta por escrito llevárselo así, y queda constancia en el informe y en la remisión de salida) · Impide siempre (seguridad o exactitud de la medición).
Los tres niveles anteriores se conservan como combinaciones con nombre:
Nombre
Cobro
Liberación
Efecto
Alerta
No
No impide
Se registra y se informa; no detiene el proceso
Cobrable
Cotizable
No impide
Genera línea de cotización; alimenta el presupuesto al cliente
Bloqueante
Cotizable o No
Impide siempre
El equipo no puede liberarse sin resolverlo
Desaparece la regla de «mayor consecuencia» del catálogo Horiba: un ítem puede cotizarse y bloquear a la vez.
Reclasificación. Hay que reclasificar los catálogos del Grimm (v1.8) y del Horiba (v1.4) con los dos atributos; Servicio Técnico valida la reclasificación.
Falla nueva. La misma regla se aplica a la falla que no está en el catálogo (ver M2.3).
Cuándo. Va en F1D-01 (modelo de datos del catálogo) y F1D-06 (criterio de falla en acción), después del corte. No mueve el plan.
M2.3 Registro, evidencia y comentarios
Cada etapa exige dejar registro de OK / No OK para poder transicionar.
[DECIDIDO] Al fallar un punto de control, se derivan pruebas adicionales de análisis, apoyadas en la información registrada en esa etapa o en las anteriores mediante ayudas basadas en la base de conocimiento (KBI, M12.4). [R08] Analizar como alternativa la vía «LLM wiki» —documentación en Obsidian— frente al RAG clásico. Ver M12.3. [R08.4] La vía de la base de conocimiento sigue abierta (punto nº 51); cuando exista, sugiere al lado y no escribe en el informe (ver el punto siguiente).
[DECIDIDO 24/09/2026 — R08.4] Comentarios predeterminados (anexo-9-comentarios). Cuando un ítem sale No OK, el comentario de falla de su catálogo (Grimm v1.8, Horiba v1.4) aparece escrito automáticamente. El técnico puede añadir una nota libre, pero no borrar el texto del catálogo; el sistema guarda por separado el comentario del catálogo y la nota, y los análisis se hacen sobre el primero. Si la falla no está en el catálogo, se usa el formulario de falla nueva, y si el Director Técnico la incorpora, su comentario pasa a ser predeterminado en la siguiente versión del catálogo. La consulta a la base de conocimiento no escribe comentarios: mostrará al técnico casos parecidos como sugerencia al lado. F1D-04 se construye con esta regla y no depende de la base de conocimiento. Punto abierto nº 9: cerrado.
[DECIDIDO 23/09/2026 — R08.4] Falla nueva (falla-nueva-bloqueante). Si el técnico encuentra una falla que no está en el catálogo, no puede avanzar sin describirla. El formulario es obligatorio y corto —qué es, dónde está, gravedad y foto— para que no desanime a reportar. El técnico le asigna la gravedad con los dos atributos de M2.2 (Cobro y Liberación), con el mismo efecto que en el catálogo: se registra, se cotiza o impide liberar el equipo. Toda falla nueva genera un aviso al Director Técnico, que confirma la gravedad y decide si se incorpora al catálogo en su siguiente versión. Se construye en F1D-07.
Repuestos desde el diagnóstico. En cada etapa —o al menos en las No OK— el técnico puede seleccionar los artículos/repuestos correspondientes directamente desde el diagnóstico. [R08] El técnico debe ver sólo los repuestos que correspondan a la etapa del diagnóstico en la que está, no el catálogo entero: es lo que hace la selección rápida y lo que evita elegir la pieza de otra fase. Aplica también a la categorización de consumibles y repuestos de M2.4. [R08.4] Se construye en F1D-06, después del corte.
Repuestos adelantados [DECIDIDO 24/09/2026 — R08.4]
[R08.4] Criterio en tres casos (anexo-47-repuestos), que el sistema aplica sólo cuando el técnico marca un repuesto en el diagnóstico:
En inventario: se reserva desde el diagnóstico, siempre. Si el cliente rechaza, la reserva se libera.
No está en inventario pero es de rotación: se solicita a Compras desde el diagnóstico hasta un total de $3.000.000 COP por ticket (valor de compra, antes de IVA), sin esperar la orden del cliente; lo que exceda ese total espera a la orden. Si el cliente rechaza, la pieza entra a inventario y la consume el siguiente servicio.
Específico o de baja rotación, o por encima de ese valor: espera a la orden del cliente.
La marca de rotación la pone Compras en cada artículo, con los consumos del Portal de Análisis de Inventario, y la revisa cada trimestre. El sistema no compra: genera la solicitud y Compras la ejecuta. Se mide cada mes el valor de los repuestos pedidos por adelantado que quedaron sin servicio; si crece, se ajustan el umbral o la lista. F1D-06 construye la mecánica. Punto abierto nº 47: cerrado. Reserva, entrega e inventario: ver M5.
Repuestos preventivos [DECIDIDO 01/10/2026 — R08.4]
[R08.4] Además de las piezas que salen de una prueba No OK, el técnico puede agregar en cualquier etapa del flujo un repuesto como cambio preventivo cuando la prueba se supera pero, por su experiencia, ve un desgaste que anticipa una falla en campo. Requisitos:
La línea queda marcada como «Preventivo», con la etapa y la prueba en la que se detectó, y un motivo breve.
La evidencia es obligatoria: foto o valor medido que muestre el desgaste.
Se ofrecen los repuestos de esa etapa, igual que en las No OK.
En la cotización, las líneas preventivas van separadas de las correctivas, como recomendación que el cliente puede aprobar o no sin que eso bloquee la liberación del equipo.
Si se agrega cuando el cliente ya aprobó la cotización, el ticket pasa por «Diagnóstico complementario» para recotizar.
Las piezas preventivas que se reemplacen aparecen en el informe y en la remisión de salida como las demás, y se puede medir cuántas recomendaciones preventivas aprueban los clientes. Va con la épica del diagnóstico (1D), después del corte.
M2.4 Taxonomía de fallas
Categorías de falla acordadas: físicas/mecánicas · ópticas · electrónicas · neumáticas. [R08.4] Son categorías de falla, no las fases del diagnóstico, que fijan los N1 de cada catálogo (M2.1). Sobre ellas se aplica la taxonomía ISO 14224 simplificada, con menús desplegables en lugar de texto libre:
Dimensión
Concepto ISO 14224
Ejemplos
Objeto
Pieza mantenible
Bomba · Sensor · Analizador
Síntoma
Modo de falla
No enciende · Lectura errática · Fuga
Causa
Causa de la falla
Desgaste normal · Mal uso · Falla electrónica
Acción
Actividad de mantenimiento
Reemplazo · Ajuste · Limpieza
[DECIDIDO 24/09/2026 — R08.4] La norma es la ISO 14224 (edición 2016), sobre datos de fiabilidad y mantenimiento de equipos (anexo-56-taxonomia). Se adopta simplificada, como referencia y no para certificación: sus conceptos se corresponden con las cuatro columnas de la tabla, y las listas de valores se ajustan a los equipos Grimm, Horiba y Environics. Es la misma norma que M3.2 usa para la jerarquía de equipos. (Resuelve la duda del 27/08, cuando se citó la ISO 14024, que trata de etiquetado ambiental tipo I y no aplica). Punto abierto nº 56: cerrado.
[PROPUESTO] Extender la categorización a consumibles y repuestos.
[PROPUESTO] Construir un árbol de fallas RCM asociado a cada clase de activo. [R08.4] Antes de decidir si se construye, se prepara una estructura de ejemplo para evaluarla sobre los equipos del portafolio:
Alcance mínimo: una clase de activo completa (Grimm EDM180) y una parcial (Horiba AP-370).
Niveles: clase de activo → función → falla funcional → modo de falla → efecto → consecuencia → tarea de mantenimiento → frecuencia.
Enlace con el catálogo: cada modo de falla se enlaza con los ítems del catálogo de inspección que lo detectan y con su criterio de falla (M2.2).
Fuentes: catálogos Grimm v1.8 y Horiba v1.4, manuales del fabricante y la taxonomía ISO 14224.
Es análisis, no desarrollo: no entra en el plan de tandas hasta que Gerencia y Servicio Técnico decidan si se adopta y para qué (plan de mantenimiento de contratos, cambios preventivos, análisis de fallas recurrentes). [ABIERTO] Adopción del árbol RCM tras el ejemplo (Anexo D; dueño: Gerencia y Servicio Técnico).
M2.5 Informes de servicio
1. Se busca el número de ticket en la tabla de remisiones de entrada. [DECIDIDO 23/09/2026 — R08.4] Esa tabla la escribe Desk 2.0 y vive en su propia base de datos (p14-remisiones-entrada). No llegaba de la plataforma de hojas de vida: era una pestaña de una hoja de Google, cuyas 149 remisiones (29/01/2025–24/07/2026) se importaron una sola vez el 04/08; desde entonces las remisiones de entrada se crean y viven en la aplicación, con su checklist y sus fotos. La fecha de remisión de entrada, que arranca el bodegaje de entrada (M1.10), es la que registra la aplicación. Las remisiones históricas conservan como texto libre lo que traía el equipo, y los informes de esos tickets mostrarán el estado inicial sólo como texto. Punto abierto nº 14: cerrado.
[DECIDIDO 24/09/2026 — R08.4] La hoja de Google (p14b-hoja-google) se sigue usando y se cierra el día del corte, el 14/12/2026. Mientras convivan, manda la aplicación: si discrepan, vale lo registrado en la aplicación y la hoja se corrige. Antes del 31/10 hay que averiguar quién la rellena y para qué, y comprobar si ese uso queda cubierto por las remisiones sin ticket (E-104); lo que salga se construye antes del corte o se acepta perderlo, por escrito. El día del corte, las filas de la hoja posteriores al 24/07/2026 se comparan una a una con las remisiones de la aplicación y las que falten se registran con una nota de origen, sin segunda importación. Después, la hoja pasa a solo lectura con la primera fila «Cerrada el 14/12/2026 — las remisiones se registran en Desk 2.0».
2. Se abre la ficha del ticket y se toman los datos de cliente y equipo.
3. La aplicación recorre el diagrama de flujo diagnóstico, con etapas, transiciones y puntos de control obligatorios. [R08.2] Las decisiones del 03/09 cerraron la estructura de la tabla, pero el encadenamiento entre ítems —qué verificar tras un «no OK»— quedó sólo como tarea, sin decisión. Mientras siga así, esto es un listado secuencial, no un diagrama de flujo. [R08.4] En el plan, el encadenamiento es la tanda F1D-05 (tabla origen → destino tomada de los Excel del catálogo), después del corte.
4. Se registran los tiempos de llegada a cada etapa para el análisis posterior.
Validación del informe [DECIDIDO 24/09/2026 — R08.4]
[R08.4] Regla vigente (roles-validacion-informe):
Tres firmas. Elaboró (el técnico que hizo el trabajo), Revisó (el Coordinador Técnico) y Aprobó (el Director Técnico). Las dos validaciones antes de emitir son las dos últimas.
Revisó = Control de calidad. La revisión del Coordinador Técnico es la misma firma del Control de calidad (C6, M9.1): se hace en un solo paso y no se pide dos veces.
Nadie valida lo que elaboró. Si el autor es el Coordinador Técnico, el Director Técnico revisa y aprueba en un solo paso. Si el Director Técnico no está disponible, el Coordinador Técnico revisa y aprueba en un solo paso. En ambos casos el informe se emite con una sola validación y queda marcado como «validación única». Si el autor es el Coordinador Técnico y el Director no está, el informe espera a su regreso.
Ausencia registrada. La ausencia del Director Técnico se registra en el sistema con fecha de inicio y fin; sólo mientras esté vigente puede aprobar el Coordinador.
Comercial no valida informes.
Informe aprobado, informe cerrado. Se emite con la imagen de las firmas cargada automáticamente y ya no se puede modificar.
Punto abierto nº 10: cerrado. Se construye en F1E-04.
El informe de salida [DECIDIDO 27/08]
Lo decidido el 27/08 nombra un vacío que este documento no tenía identificado: no existe trazabilidad definida entre el ingreso del equipo y el informe de diagnóstico. Es, junto con el diagnóstico guiado, el frente menos documentado del proyecto.
Lo que ya funciona. El protocolo de servicio registra el antes y el después del equipo, y su uso es válido para cualquier servicio y no sólo para calibración —por eso Dirección Técnica lo incorporó a los contratos de mantenimiento—. El informe posterior a reparación, en cambio, se emitió sólo a petición de clientes puntuales, reelaborando el documento a mano, y nunca se generalizó.
Decisión: extender el protocolo a un formato ampliado con evidencia fotográfica que funcione como informe de salida para todo tipo de servicio.
El modelo acordado, y por qué encaja con el checklist dinámico. Al cerrar el servicio, los puntos que el diagnóstico marcó en rojo se resuelven de una de dos formas:
Resultado
Qué significa
Pasa a verde
El punto se corrigió durante el servicio
Queda en rojo con motivo tipificado
El cliente no aprobó el servicio · el repuesto no existe · no hay solución
De ahí sale un informe de salida sencillo y su conclusión. Nótese que el informe no se redacta: se deriva. Es el mismo checklist del diagnóstico, releído al cierre. Eso lo hace generable por plantilla y, sobre todo, hace que el motivo del rojo sea un dato tipificado y no una frase —que es exactamente lo que el principio de diseño nº 4 persigue, y lo que hoy impide analizar por qué se quedan servicios sin completar.
[R08.4] La lista de motivos del informe de salida es la misma que usan los motivos de Anulado (c2-anulado, M1.10). El checklist del Control de calidad revisa los puntos que fallaron en el diagnóstico y alimenta el informe de salida (c6-qa-liberacion, M9.1). Un ítem marcado «Impide salvo aceptación escrita del cliente» (M2.2) que el cliente acepta llevarse así queda anotado en el informe y en la remisión de salida.
[TAREA — Gerencia] Incorporar al documento maestro el flujo completo de construcción del informe de servicio, comprometido el 27/08 y todavía pendiente. Es el hueco más grande que le queda a este documento. [R08.4] En el plan es la tanda F1E-05 (entregable documental).
[R08.4] Cuándo. El módulo de informes (épica 1E: modelo del informe, informe de diagnóstico, informe de salida, validación y flujo documentado) va después del corte del 14/12, en 2027.
M2.6 Asistencia por IA
[R08] Analizar como alternativa la vía «LLM wiki» —documentación en Obsidian— frente al RAG clásico. Ver M12.3. [R08.4] La elección de la vía sigue abierta (punto nº 51).
Copiloto para técnicos: el técnico describe el síntoma en lenguaje natural y el sistema, cruzando el histórico del activo y los manuales de la KBI, sugiere causas probables y qué verificar.
Generación de procedimientos a partir de fotos de manuales, mediante OCR y modelo de lenguaje.
Digitalización del conocimiento técnico — [DECIDIDO] Manuales, procedimientos y troubleshooting.
Diagnóstico asistido con sugerencia automática de causa raíz, como meta a medio plazo.
Detección de reincidencias: mismo activo o misma causa en una ventana de 30 días.
Nota de arquitectura (R03). Todas estas funciones se apoyan en la KBI descrita en M12.4. La asistencia por IA recupera y sugiere; no calcula fechas ni compromisos (principio de diseño nº 8). [R08.4] Tampoco escribe en el informe: sugiere al lado del técnico (anexo-9-comentarios, M2.3).
M2.7 Criterios analíticos de aprobación
[DECIDIDO 01/10/2026 — R08.4] Por ahora no se usa la linealidad (R²) entre el candidato y el patrón como criterio de aprobación de la calibración (regla de Gerencia del 01/10/2026).
Con qué se aprueba. La calibración se sigue aprobando con los lineamientos del fabricante para cada marca y modelo, tal como se enseñan en los entrenamientos.
Cómo se traduce en Desk 2.0. Esos lineamientos son los valores esperados y las tolerancias que lleva cada ítem de calibración en el catálogo del equipo (campos de valor con rango), y el técnico no aprueba fuera de ellos.
La R², como dato informativo. Puede registrarse si el equipo la calcula, pero no decide la aprobación. Se podrá revisar más adelante con datos de varias calibraciones.
Cierra el punto abierto nº 46 en lo que respecta a la R² (y con él el nº 12, que planteaba la misma pregunta). Para las calibraciones acreditadas bajo la ISO/IEC 17025, ver M9.2.
M3. Hojas de vida de equipos (ALM)
El activo es el núcleo del sistema. En el caso de Ambientalia el activo es del cliente, lo que convierte la trazabilidad de garantías y del historial en un requisito comercial además de técnico. Con el modelo de portal en dos niveles (M8), la hoja de vida deja además de ser un registro interno y pasa a ser, en versión reducida, lo primero que el cliente ve de Desk 2.0. [R08.4] El módulo admite también los equipos propios de Ambientalia (ver M3.1).
M3.1 Estructura de datos
Campo
Estado
Observación
Código interno
Existe
Incluye serial y modelo; se mantiene por ISO 9001.
Nombre
Existe
Modelo
Existe
Número de serie
Existe
Obligatorio en la remisión.
Estado operativo
Existe
Funciona · Fuera de servicio · En mantenimiento.
Fecha de adquisición
[CONSTRUIDO] (F1B-02)
Campo comercial crítico.
Fecha de factura
[CONSTRUIDO] (F1B-02)
Base del cálculo automático de garantía.
Fin de garantía
[CONSTRUIDO] (F1B-02)
Alimenta el aviso «En garantía» (M1.3); sin dato, «Garantía sin dato».
Código interno del cliente
[CONSTRUIDO] (F1B-02)
Listado consolidado enviado a Gerencia (01/10/2026).
Enlace a Drive
[CONSTRUIDO] (F1B-02)
Botón «Ver en Google Drive» (M3.5).
Mantenedor
[CONSTRUIDO] (F1B-02)
Opcional; vacío significa que paga el dueño del equipo.
Visibilidad en el portal
Nuevo (R03)
Marca por campo: visible en la hoja de vida reducida, o sólo interno (M8.3).
Problema resuelto el 20/08. El área técnica creaba el registro del equipo al recibirlo, pero carecía de la información de facturación. Decisión: los equipos nuevos los da de alta Comercial/Administrativa en cuanto conoce los seriales —incluso antes de que lleguen físicamente— asignando cliente y fecha de factura. [R08.4] Desde el 24/09, además, el alta de un ticket de «Equipo nuevo» registra el equipo en el mismo paso (equipo-nuevo-alta-en-ticket, M1.4), y cuando ni el equipo ni el cliente existen se permite el alta manual en la recepción (M3.4).
[DECIDIDO 17/09, 21/09 y 23/09/2026 — R08.4] Mantenedor (titularidad-ov-equipo, titularidad-mantenedor, mantenedor-campo-cuando). Generalmente el titular del equipo es quien genera la orden de venta; hay un caso conocido en que la paga el mantenedor del equipo. El mantenedor se apunta en la hoja de vida y sólo el dueño o el mantenedor pueden pagar órdenes de ese equipo; cualquier otra discrepancia se bloquea. El campo es opcional y sólo se rellenan las excepciones: vacío significa que paga el dueño, como hasta ahora. El control de quién puede pagar vive en la tanda de las órdenes de venta (F1B-11, ver M4.4).
[DECIDIDO 24/09/2026 — R08.4] Edición de los seis campos comerciales (edicion-datos-comerciales-equipo). La restricción es por área, no por cargo:
Fecha de factura, fin de garantía y mantenedor: sólo los cambian el área Comercial y los administradores, porque deciden si un servicio se cobra y quién puede pagarlo.
Fecha de adquisición, código interno y enlace a Drive: los puede corregir cualquier usuario autenticado.
Historial de cambios: todo cambio en cualquiera de los seis campos queda registrado con persona, fecha y hora, valor anterior y valor nuevo, y se ve en la hoja de vida.
La hoja de vida tiene su propio botón «Editar», con las mismas reglas que desde la lista de Equipos, y el servidor aplica la restricción, no sólo la pantalla.
[CONSTRUIDO] en F1B-14, «Alta y edición del equipo» (cerrada).
Equipos propios de Ambientalia [DECIDIDO 01/10/2026 — R08.4]
[R08.4] El módulo de hojas de vida admite también los equipos internos de Ambientalia: patrones de referencia y gases patrón, instrumentos de medición, herramientas de taller y equipos de demostración o préstamo. Requisitos:
Alta y administración. Los da de alta y los administra el cargo Especialista técnico desde una vista propia de «Equipos internos», sin depender de Comercial. El propietario es Ambientalia y no llevan datos de facturación ni garantía de cliente.
Plan de mantenimiento y calibración por equipo. Cada tarea tiene su tipo (calibración externa, verificación interna o mantenimiento), su periodicidad y su responsable.
Alertas. Aviso al Especialista técnico con antelación configurable antes de cada vencimiento, y escalado a Dirección Técnica si la tarea se vence sin ejecutar.
Ejecución con evidencia. Cada tarea se registra con su fecha, quién la hizo, el resultado y el soporte adjunto (certificado del laboratorio externo o registro de la verificación interna). Con eso se recalcula el siguiente vencimiento.
Trazabilidad con el servicio. En cada calibración a un cliente se registra qué patrón o instrumento propio se usó, y el sistema no permite seleccionar uno con la calibración vencida (ver M9.2).
Salidas a calibración externa. Cuando un equipo propio sale a un laboratorio, se usa la remisión sin ticket (E-104).
Es funcionalidad nueva y va después del corte del 14/12. [ABIERTO] El cargo «Especialista técnico» no está entre los siete cargos de los permisos por cargo (F1C-05): hay que crearlo o asignar la función a uno existente (Anexo D; dueño: Gerencia). [ABIERTO] Confirmar si los equipos de demostración o préstamo entran en «equipos propios» (Anexo D; dueño: Gerencia).
M3.2 Taxonomía jerárquica ISO 14224
[DECIDIDO 24/09/2026 — R08.4] La jerarquía de equipos sigue la ISO 14224 (2016) simplificada, como referencia y no para certificación (anexo-56-taxonomia); es la misma norma de la taxonomía de fallas de M2.4.
Nivel
Categoría
Ejemplo
1
Industria / Negocio
—
2
Instalación / Sitio (geolocalizado)
Planta del cliente
3
Sistema técnico
Sistema de compresión
4
Equipo / Unidad
Compresor C-201
5
Subunidad / Componente mantenible
Motor eléctrico, bomba de aceite
6
Parte / Repuesto
Rodamiento SKF-6205
M3.3 Funcionalidades de la hoja de vida
ADN del activo — ficha técnica con atributos dinámicos definidos por clase de equipo mediante plantillas.
Timeline histórico — visualización cronológica de todos los eventos: instalación, preventivos, correctivos, cambios de piezas, movimientos. [R08.4] El historial anterior a Desk 2.0 entra por la carga masiva de M3.5.
Historial clínico por serial — cuántas veces ha entrado ese equipo a taller, con todos sus tickets asociados.
Componentes críticos con garantía propia — fecha y garantía de cada parte sustituida.
Gestión de garantías — alerta automática al intentar abrir una orden sobre un equipo con garantía vigente. [R08.4] Se concreta en el aviso «En garantía» (corrección del 30/09, M1.3): un distintivo calculado, no un estado, que se ve al elegir el equipo, en la cabecera, la lista y el tablero; en Notificado sugiere «Reporte por garantía» sin obligar.
Árbol de fallas (RCM) — biblioteca de modos de falla, causas y efectos por clase de activo. [R08.4] Pendiente del ejemplo y de la decisión de adopción de M2.4.
Costos acumulados — gráfico de costo acumulado vs. tiempo, con el ratio Costo de mantenimiento / RAV como umbral.
[DECIDIDO] Las transiciones clave alimentan automáticamente la hoja de vida, sin depender de comentarios manuales.
Versión imprimible de la hoja de vida [DECIDIDO 01/10/2026 — R08.4]
[R08.4] Desde la hoja de vida de cualquier equipo se puede generar un PDF para adjuntar o compartir como soporte cuando el cliente lo solicite. Requisitos:
Contenido para el cliente. Sólo incluye los campos marcados como visibles para el cliente (marca de visibilidad de M8.3). Lo que es sólo interno no aparece nunca en el PDF.
Datos del documento. Identificación del equipo (modelo, serial, código interno del cliente), datos de garantía, historial de intervenciones con fecha y tipo, y certificados de calibración vigentes.
Fecha de corte y registro. Se indica «emitida el [fecha], con información hasta esa fecha», y queda guardado quién la generó y para quién.
Versión completa interna. Hay también una versión completa para uso interno y auditorías, con todos los campos, que sólo pueden generar los cargos autorizados.
Equipos propios. Aplica igual a los equipos propios de Ambientalia (M3.1), como soporte ante auditorías ISO.
Es el mismo PDF que el cliente del nivel completo descarga en el portal (M8.3). Va después del corte del 14/12.
M3.4 Identificación e ingreso de datos
Este apartado es el que concentra las contramedidas contra el riesgo rector del eje ① (§1.4.3), y por eso su prioridad cambia en la R03.
[DECIDIDO — R03, sube a MVP] QR / NFC en el equipo para identificación, apertura del historial y check-in físico del técnico. En el MVP entra el QR de identificación; el check-in físico por NFC se mantiene en Fase 2.
[DECIDIDO — R03, sube a MVP] OCR en recepción — tablet que fotografía la placa del equipo, extrae marca/modelo/serial y busca si ya existe: si existe abre su historial; si no, pasa al alta manual descrita abajo. Se combina con el autocompletado por serial de M1.1: el OCR propone, el sistema valida contra el maestro de equipos y el operario confirma. El operario nunca teclea el serial completo a mano, salvo en el alta manual, donde lo teclea dos veces.
[PROPUESTO] Reconocimiento visual por cámara como respaldo cuando el QR está dañado.
Identificación de equipos por QR enlazando remisión ↔ ticket ↔ hoja de vida.
[R03] Toda captura asistida (OCR, QR, autocompletado) debe registrar si el dato fue aceptado tal cual o corregido manualmente. Ese registro alimenta el KPI de tasa de corrección (M7.1) y permite medir si las contramedidas funcionan.
Alta manual de equipo y cliente desconocidos [DECIDIDO 01/10/2026 — R08.4]
[R08.4] Cuando ni el equipo ni el cliente aparecen en las bases de Ambientalia, tras buscar por OCR, por serial y por cliente, el sistema permite registrarlos a mano en la recepción, en cualquier tipo de servicio (sustituye a la regla del 24/09 según la cual, en mantenimiento y soporte remoto, «el equipo tiene que existir»):
Equipo: serial, marca, modelo del catálogo (o «modelo no catalogado» con texto) y tipo. El serial manual se teclea dos veces y debe coincidir. Si el serial ya existe, se ofrece el equipo existente y no se crea otro.
Cliente: si no está en los contactos de Zoho Books, se registra como cliente provisional con razón social, NIT, contacto, teléfono y correo.
Validación: el equipo y el cliente quedan marcados «pendiente de validar». Comercial enlaza el cliente con su contacto de Zoho Books (o lo crea allí) y completa los datos comerciales del equipo (fecha de factura, garantía, mantenedor), que siguen reservados a Comercial. No se puede ejecutar «Habilitar Servicio» mientras siga pendiente.
Trazabilidad: queda registrado quién hizo el alta manual y por qué no se pudo usar el OCR ni el autocompletado.
Va antes del corte del 14/12: es paridad con Zoho Desk, que hoy permite registrar cualquier equipo, y sin ella la recepción se bloquea con clientes nuevos. [ABIERTO] Qué cargos pueden hacer el alta manual, y si los cinco datos del cliente provisional son el mínimo exigible (Anexo D; dueño: Gerencia).
Catálogo de modelos y registro de equipos
[R08.4] Los dos están sembrados en la aplicación:
Catálogo de modelos (e003-catalogo-equipos, 23/09): los tres catálogos tienen su pantalla; cada modelo lleva sus artículos con SKU y categorías, la mano de obra como una de las tres clases de artículo, y una marca de qué modelos llevan inspección. F1D-01 lo da por hecho. A 17/09 había 29 modelos (e003c-recuento-modelos). Lo que falta no es construcción sino datos: comprobar contra la base cuántos modelos llevan inspección y cuántos tienen cargados sus artículos y su mano de obra (recuento contra producción pendiente).
Registro de equipos (e003b-registro-equipos): serial, marca, modelo, tipo, cliente y estado, más los campos de la hoja de vida de M3.1 construidos en F1B-02 y su edición en F1B-14.
M3.5 Migración del historial
Lo decidido el 27/08
El aplicativo sustituye la creación manual de carpetas por captura directa en base de datos, con generación de entregables por plantilla. Hoy, por cada servicio, alguien crea a mano una carpeta con subcarpetas en Google Drive. El modelo objetivo presenta espacios de captura de datos en lugar de archivos y carpetas, con la misma lógica del CRM.
La migración del histórico se aborda como desarrollo independiente, y la fase inicial se resuelve con un botón «Ver en Google Drive» desde la propia hoja de vida, replicando lo ya hecho en el módulo de remisiones. Es la solución correcta para arrancar: no bloquea el proyecto con una migración de más de 300 equipos con historial, y da acceso al histórico desde el día uno.
[DECIDIDO 21/09/2026 — R08.4] Drive se queda enlazado (p8-p54-drive): por capacidad de almacenamiento del servidor, el sistema sigue enlazando a Drive y no lo sustituye. El enlace está construido en la hoja de vida (F1B-02). Puntos abiertos nº 8 y nº 54: cerrados.
Tres cosas que condicionan cómo se construye:
El entregable en PDF no desaparece. Sigue haciendo falta para respaldo y para entrega impresa al cliente.
El sistema debe conservar el documento exacto que vio el cliente, no sólo los datos para regenerarlo. Existen 23 plantillas de cotización distintas, y regenerar con la plantilla de hoy un documento emitido con la de hace dos años produce un papel que nadie firmó.
Convivencia de unos seis meses con los métodos tradicionales —Excel de citas y control— para validar la estabilidad del nuevo sistema antes de retirarlos.
[DECIDIDO 24/09/2026 — R08.4] Respaldo del sistema (p55-backup, p55b-destino-copia). Responsable: Alfonso. Copia nocturna y copia previa a cada cambio, con retención de 7 diarias, 4 semanales y 12 mensuales, cifrada fuera de Hostinger, y restauración de prueba mensual anotada; la carpeta de documentación de servicio de Drive se respalda semanalmente. Detalle en M11.5. Punto abierto nº 55: cerrado, salvo la elección del proveedor de almacenamiento, que sigue abierta (Anexo D).
[R08] La migración debe incluir, además del historial útil de Desk 1.0, las hojas de vida de Labcontrol. Son dos orígenes distintos, con estructuras distintas, y conviene tratarlos como dos migraciones y no como una.
Nota de dependencia (R03). La migración deja de ser un asunto puramente interno: la hoja de vida reducida es lo que el cliente ve en el portal, y un historial con huecos produce el efecto contrario al buscado. Ver la regla de apertura del portal en M8.6.
Carga masiva del histórico documental [DECIDIDO 01/10/2026 — R08.4]
[R08.4] Objetivo: que el historial que hoy está en PDF en las carpetas de Drive por serial se vea en orden cronológico en la hoja de vida de cada equipo y en el resto del sistema (indicadores, portal). Lo decidido el 21/09 se mantiene: los PDF siguen en Drive y en la base de datos entran los datos extraídos con un enlace a su documento. El proceso tiene dos pasos:
Preprocesado fuera de la aplicación, con la herramienta independiente de IA ya prevista. Lee los PDF y consolida una tabla estándar: serial, fecha, tipo de intervención, ticket o informe de origen, hallazgos, repuestos, resultado de calibración y enlace al PDF. Una persona de Servicio Técnico revisa la tabla antes de cargarla.
Importador en Desk 2.0 de esa tabla. Valida el formato, rechaza filas con serial desconocido o datos incompletos (con un informe de rechazos), no duplica eventos ya existentes y marca cada evento como «histórico importado».
Más adelante se puede añadir un módulo dentro de la aplicación que interprete archivos sueltos y use el mismo importador. Regla de apertura del portal (M8.6): un equipo sólo se muestra al cliente cuando su historial está cargado y revisado. El importador va después del corte del 14/12; el preprocesado puede adelantarse en paralelo porque no consume desarrollo de la aplicación.
M4. Comercial: cotización, aprobación y promesa de fecha
El punto donde se gana o se pierde el cumplimiento: el ticket no avanza si no hay aprobación comercial, y la fecha no se adivina, se calcula.
M4.1 Aprobación del cliente
[DECIDIDO] El cliente recibe un enlace o correo con el pre-diagnóstico y puede aprobar el cambio de piezas en un clic, sin necesidad de emitir primero la orden de compra formal.
[DECIDIDO] Se inicia como piloto con clientes que tienen contrato de mantenimiento activo.
[DECIDIDO 24/09 — R08.4] Alerta de no aprobación a los 4 días hábiles, para todos los clientes (anexo-3-alerta). Mientras espera la respuesta, el ticket sigue en Notificación cliente, que es una espera del cliente: el reloj del SLA está parado (ver M1.6 y M1.7). Cuando lleva 4 días hábiles (36 horas hábiles) sin aprobación ni rechazo, la aplicación avisa al Coordinador Comercial —si nadie tiene ese cargo, al área Comercial—, en la aplicación y por correo, una vez por cada entrada al estado, para que haga seguimiento. El tablero señala el ticket como «Esperando aprobación del cliente», que es una marca de vista y no un estado nuevo. Un día hábil va de lunes a viernes, de 8 a 17 h, sin festivos de Colombia ni cierres de la empresa. Sustituye a la idea de sacar el equipo «a una cola de espera» con un plazo de 24 o 48 h. Construido en F1B-08. Punto 3 del Anexo D cerrado.
Motivación: hoy se envía cotización, se espera la orden de compra y el equipo queda bloqueado semanas o meses.
[DECIDIDO — R03] El botón «Aprobar cotización» forma parte del nivel básico del área de cliente (M8.2): está disponible para todos los clientes, con o sin contrato, y funciona con acceso por token sin registro.
Punto de enganche en el blueprint [CONSTRUIDO]. La aprobación del cliente corresponde al estado Notificación cliente, que ofrece tres salidas: Aprobación (→ En Proceso), Aprobación y S. Repuestos (→ En Espera de Repuestos) y Rechazo (→ Por Facturar). El botón del portal debe disparar una de las dos primeras. [DECIDIDO 01/10 — R08.4] El Rechazo desde Notificación cliente lo ejecuta solo el área Comercial, que es la que recibe del cliente la aprobación o el rechazo; no cambia su origen ni su destino, y los otros dos Rechazo mantienen su área. [R08.4] No hace falta un estado propio para la espera por no aprobación: la alerta de los 4 días hábiles y la marca del tablero cubren el seguimiento. Si el cliente no responde nunca, Comercial cierra por Rechazo, cobrando el diagnóstico, o, cuando exista, por Anulado con el motivo «caducidad de espera: el cliente no responde ni retira el equipo» (c2-anulado, F1C-01, después del corte; ver M1.10).
El tiempo promesa: lo fija el taller y se comunica global
Cómo funciona hoy [AS-IS — R05]. La hoja del 16/02 dice de dónde sale la fecha: en la transición Escalado a Revisión, cuando el técnico manda el diagnóstico a revisión, el campo «Días de entrega» es obligatorio, y el propio mapeo aclara que «queda definido el Tiempo promesa». El diccionario lo confirma en la columna 52: «días hábiles que ST se demora en ejecutar el servicio, es un campo del ticket Tiempo promesa». Es decir: el compromiso lo estima Servicio Técnico al diagnosticar, no Comercial al cotizar. Tiene lógica —quien acaba de abrir el equipo es quien sabe cuánto va a costar arreglarlo—. Pero como se fija con el diagnóstico ya hecho, no incluye el tiempo de diagnóstico.
[DECIDIDO 30/09 — R08.4] Tiempo promesa global (corrección de Gerencia, E-095). En Desk 2.0:
El tiempo de diagnóstico se mide siempre, con la fecha y hora de las transiciones (ya construido en F1A-04 e incluido en la continuidad de indicadores de F1F-05).
Al cliente se le comunica un tiempo promesa global = tiempo de diagnóstico + días de entrega que fija el técnico en «Escalado a Revisión». El técnico sigue fijando los días de entrega.
Antes del diagnóstico, el tramo de diagnóstico se estima con lo que tarda hoy ese modelo según el historial; al escalar a revisión se sustituye por el tiempo real.
El plazo global se cuenta en días hábiles (con el calendario laboral de F1B-12) y excluye las esperas ajenas a Ambientalia definidas para el reloj del SLA (c7-reloj-sla): aprobación del cliente, proveedor y servicio externo.
Se mantienen dos indicadores: el cumplimiento del taller, que es el actual (columna 54, Cumplimiento del tiempo promesa: compara el tiempo comunicado contra el transcurrido hasta la finalización y devuelve Cumple o No cumple), y el cumplimiento global ante el cliente, que se suma como décimo indicador a la lista cerrada del Anexo G (ver M7.1). El umbral de cumplimiento está en M7.1. Es funcionalidad nueva y va después del corte del 14/12; todavía no tiene fila del plan (propuesta de asignación, pendiente de confirmar fila; ver §3.4).
Consecuencia para el CTP. El simulador de M4.2 no sustituye el número del técnico, parte de él: arranca del tiempo promesa global. El técnico sigue aportando el trabajo que el equipo requiere; lo que hoy nadie aporta es la cola del taller y el plazo del repuesto, que es justamente lo que convierte una estimación de esfuerzo en una fecha.
M4.2 Simulador de fecha de entrega (CTP — Capable to Promise)
[R08.4] El CTP parte del tiempo promesa global de M4.1 y depende del modelo de capacidad de M6, que es su condición previa. Los dos van después del corte, sin fecha en el plan vigente (ver §3).
Antes de que Comercial prometa una fecha, el sistema consulta:
Carga actual de técnicos — horas vendidas frente a horas disponibles de cada técnico (M6.1).
Stock de repuestos derivado del diagnóstico.
Lead time del repuesto si hay que comprarlo.
Precisión del revisor [R08] — las tres situaciones del repuesto. El cálculo no puede tratar el stock como un sí o un no. Son tres casos y cada uno da una fecha distinta:
Situación del repuesto
Qué aporta al cálculo
En inventario
Disponible ya; sólo cuenta la cola del taller.
En camino
Se calcula con la fecha estimada de recepción del pedido en curso.
Por solicitar
Se calcula con el lead time del proveedor, que según M5.4 es muy distinto si la pieza viene de Europa o es compra local.
Es la diferencia entre un CTP que sirve y uno que no: la mayoría de las promesas incumplidas no nacen de un mal cálculo de horas de taller, sino de dar por disponible un repuesto que aún no ha llegado. [R08.4] Con el criterio de repuestos adelantados (M5.1), los repuestos de rotación se piden desde el diagnóstico, así que pasan antes de «por solicitar» a «en camino». [ABIERTO] La lectura de esas tres situaciones desde el Portal Ambientalia · Análisis de Inventario sigue sin definir (Anexo D, punto 48; ver M5.4).
La heurística suma cola actual en estación + tiempo estándar de servicio + lead time de repuesto y devuelve una sugerencia del tipo «fecha más temprana posible: lunes próximo». El estudio lo identifica como el gran diferenciador competitivo.
Precisión de la R03. Este cálculo es determinista —reglas y consultas sobre PostgreSQL— y no pasa por la capa RAG ni por ningún modelo de lenguaje (principio de diseño nº 8). Su resultado alimenta dos destinos: la sugerencia interna a Comercial, y la disponibilidad de agenda que se muestra al cliente (M6.4).
M4.3 Reprogramación y comunicación de consecuencias
Si un cliente se demora en enviar la orden de compra, el sistema debe reprogramar automáticamente o dar una fecha estimada de inicio. [R08] La reprogramación debe avisarse al cliente por correo, no sólo recalcularse internamente: una fecha que cambia sin que el cliente se entere es un incumplimiento aunque el sistema lo haya previsto.
Análisis de cuello de botella por respuestas de clientes.
[DECIDIDO 24/09 — R08.4] Antigüedad de la aprobación: la alerta salta a los 4 días hábiles en Notificación cliente (ver M4.1 y M1.7), no a los 7 días que proponían las revisiones anteriores.
M4.4 Cotización, recotización y facturación diferida
[CONSTRUIDO] El rechazo por facturar existe, pero no como estado: Rechazo es una transición que lleva a Por Facturar desde Rev./Diagnostico, Notificación Comercial y Notificación cliente. El cliente no autoriza la reparación y se cobra el diagnóstico. [DECIDIDO 01/10 — R08.4] El Rechazo desde Notificación cliente solo lo ejecuta Comercial (ver M4.1). Cuando el servicio se abandona sin cobrar, el cierre es Anulado con su motivo, no Rechazo → Finalizado (c2-anulado; ver M1.10).
[DECIDIDO 23/09 — R08.4] Facturación diferida en dos ramas, sin ciclo (c4-dos-ramas; detalle en M1.3.5). Los estados Por Entregar / Sin facturar y Liberación Comercial siguen siendo la rama sin factura, que nace de las fechas de corte de facturación de los clientes. Facturado es un atributo del ticket (la fecha de factura), no un estado. En la rama sin factura, el equipo entregado y no facturado vive en el estado Pendiente de facturar, donde se mide su antigüedad, y de ahí sale con la transición «Facturar», que registra la factura y su fecha, directamente a Finalizado. El ticket termina al facturar; el cobro se sigue en contabilidad. Sustituye al ciclo reentrante facturar↔entregar. F1C-02, después del corte.
[DECIDIDO 23/09 — R08.4] El rastro de los equipos entregados pendientes de cobro queda resuelto por la decisión anterior: un equipo entregado y no facturado ya no vuelve a Por Facturar ni se confunde con uno pendiente de entregar, porque tiene su propio estado. Antes del corte, la «Liberación sin factura» solo la ejecuta el Director Comercial y exige un motivo de lista cerrada y la fecha prevista de facturación; la alarma al vencer esa fecha llega con F1C-02, después del corte, y se aplica también a lo liberado desde el 14/12 (anexo-33-checkbox, corrección del 30/09; ver M1.3.5). Con esto queda cubierto el riesgo del punto 6 del Anexo D (ver Anexo D).
[DECIDIDO 30/09 — R08.4] El diagnóstico complementario es el circuito de recotización: sale de En Proceso hacia Continuación del proceso, y de ahí vuelve a Notificación Comercial por Notificación re cotización. Se usa cuando, durante la reparación, el técnico ve que hay que volver a diagnosticar. Antes salía de Pendiente, que deja de usarse en la rama de servicio técnico (E-103; ver M1.3). Por el mismo circuito pasa el repuesto preventivo que se añade cuando el cliente ya aprobó la cotización (ver M2.3).
[DECIDIDO 30/09 — R08.4] SKU: Comercial/Compras completa y cotiza sin devolver el ticket al técnico (E-107). En «En espera de SKU inventario», cuando Comercial/Compras consigue el SKU, lo registra en la tabla de repuestos del informe, genera la cotización y ejecuta «Notificación cliente (SKU)»; al hacerlo, la aplicación avisa al técnico del ticket de que la pieza ya tiene SKU y se ha añadido al informe. Comercial/Compras solo completa el código y el precio de las piezas que el técnico ya identificó: no añade, quita ni cambia piezas o cantidades. Si hace falta cambiar una pieza, el ticket vuelve a Servicio Técnico. Antes del corte entra el registro del SKU en la transición y el aviso al técnico (propuesta de asignación, pendiente de confirmar fila; ver §3.4); la edición directa de la tabla del informe llega con el módulo de informes (F1E-01), en 2027. En espera de SKU no se abandona: si se retrasa, se avisa a Comercial (c3-salida-esperas).
[PROPUESTO] Visualización de precotizaciones para el área comercial dentro de la aplicación. [DECIDIDO 17/09 — R08.4] La aplicación no escribe en Zoho por ahora (p44-escritura-zoho), así que la precarga de repuestos hacia un borrador de cotización en Zoho CRM no se hace. Si hiciera falta antes de activar la escritura, se resolvería con un «espejo de Zoho» en la aplicación, para comparar y escribir a mano en Zoho (línea futura). Punto 44 del Anexo D cerrado.
Precisión de diagnóstico como KPI. [R08] Mide qué porcentaje de las cotizaciones aprobadas no necesitó adicionales después. Un diagnóstico preciso cotiza una vez; uno impreciso descubre a mitad de la reparación que hace falta otra pieza, y obliga a volver al cliente con una recotización —que es el circuito En Proceso → Diagnóstico complementario → Continuación del proceso → Notificación re cotización del punto anterior—. Interesa por dos motivos. Hacia dentro, un adicional cuesta más que la pieza: reabre la negociación, para el equipo en el taller y consume otra vez tiempo comercial. Hacia fuera, es lo que el cliente recuerda —«me dijeron un precio y acabé pagando otro»—. Y es medible sin campos nuevos: son los tickets que pasaron por Continuación del proceso sobre el total de los que llegaron a Aprobación. [R08.4] Por eso se conservó el circuito al retirar Pendiente.
Subdivisión de órdenes de venta y contratos [DECIDIDO 27/08]
Decisión: permitir la subdivisión de una orden de venta en subórdenes con un ticket asociado a cada subservicio, en lugar de exigir una orden de venta independiente por ticket. El formato vigente es OV-AAAA-NNN-SS, con SS de dos dígitos (OV-2026-170-01, -02…), revisado en la R08.2 por decisión de Gerencia del 10/09/2026 (sustituye al formato OV-XXX_1, _2, _3 acordado el 27/08: _1 y _10 se ordenan mal como texto, y el guion bajo dentro de un número que ya usa guiones invita al error que la validación quiere cazar; dos dígitos ordenan solos).
Qué desbloquea. Una OV de diez calibraciones, subdividida, hace calculable el porcentaje ejecutado del contrato, y con él el informe trimestral de avance que Comercial envía al cliente. Hasta ahora esa correlación se hacía a mano, en el comentario del albarán de reserva: alguien anotaba qué elemento de la orden correspondía a qué código de servicio. Era trabajo manual que además sólo conocía quien lo hacía.
Y corrige una lectura falsa del inventario. Los repuestos comprometidos en órdenes de paquete —filtros, baterías— aparecían como consumidos o reservados sin que se supiera contra qué servicio, lo que distorsiona el stock y genera riesgo de sobrestock. Con la suborden, cada consumo tiene un ticket detrás.
El argumento comercial. Clientes como Corola e Indoanálisis compran paquetes anuales. Medir su ejecución da conversación cuando el consumo real queda por debajo de lo pactado: es la misma lógica del dato como argumento comercial de M4.5, aplicada al contrato en vigor en lugar de al histórico de costes.
Lo que el sistema tiene que saber además. Que un ticket pertenece a un contrato, porque de ahí sale su prioridad alta y su recurrencia (resuelto con el registro de contrato, más abajo). Y tiene que soportar las variantes reales que se dan hoy:
Variante
Se da en
OV separadas por mano de obra y por repuestos
Clientes que compran los dos conceptos aparte
OV global por varios equipos
Ingresos por lote
Varias OV asociadas a un mismo ticket
Servicios ampliados sobre la marcha
Ninguna de las tres encaja en un modelo de «una OV, un ticket», y las tres son habituales. Resuelto el 10/09/2026 (punto 52 del Anexo D): ver los dos apartados siguientes.
Cardinalidad orden de venta ↔ ticket [DECIDIDO 10/09 — R08.2]
La relación es 1 ticket : N OV, nunca al revés. Cierra el punto 52. La restricción «una OV → un único ticket» sigue vigente y debe seguir cumpliéndose; lo que se relaja es la restricción implícita en sentido contrario, que un ticket sólo pudiera tener una OV.
Variante
Cardinalidad
Resolución
OV global por lote (varios equipos)
1 OV → N tickets
Se elimina. Comercial subdivide en subórdenes al crear la OV
OV separadas por mano de obra y repuestos
N OV → 1 ticket
Se mantiene — requisito del cliente (sus propias OC), no hábito interno
Varias OV sobre la marcha
N OV → 1 ticket
Se mantiene — hoy sólo se muestra la última y se pierde la trazabilidad de la primera
Por qué no hace falta tabla puente. La subOV de lote era la única variante que hacía que una OV apuntara a varios tickets. Resuelta ésa, sólo queda que un ticket tenga varias OV: es 1:N desde el ticket, no N:M.
Dónde vive la asociación. En una tabla propia de la aplicación, no en la réplica de Zoho Books: la sincronización sobrescribiría cualquier dato escrito allí. La asociación registra el ticket, la transición que asoció, fecha, hora y persona (regla de M1.10).
Cuándo se escribe. Desde el lado del ticket: de forma opcional en «Nuevo ticket», contra las OV existentes, y obligatoria en Habilitar Servicio (ver M1.2). Aprobación y Aprobación y S. Repuestos pueden añadir OV al ticket, nunca sustituir la de entrada.
[CONSTRUIDO — R08.4] La asociación OV ↔ ticket está construida en F1B-11 (ver más abajo el estado de la fila).
Cambio de proceso, no sólo de software. Eliminar la OV global por lote obliga a que Comercial subdivida siempre, desde el primer día. [ABIERTO] Sigue sin decidir qué pasa si llega una OV de lote sin subdividir: rechazarla o permitir subdividirla desde Desk 2.0 (ver Anexo D).
Cardinalidad, no titularidad. El punto 52 no dice —ni debe leerse como que dice— que la OV y el equipo puedan ser de clientes distintos. [DECIDIDO 17/09, 21/09 y 23/09 — R08.4] La titularidad se resolvió aparte (titularidad-ov-equipo, titularidad-mantenedor, mantenedor-campo-cuando): por regla general paga quien es dueño del equipo; la única excepción conocida es el mantenedor, que se apunta en la hoja de vida del equipo (campo opcional: vacío significa que paga el dueño). Solo el dueño o el mantenedor pueden pagar órdenes de ese equipo, y cualquier otra discrepancia se bloquea. El campo está en la hoja de vida (ver M3.1); el control de quién puede pagar va en F1B-11. Al crear el ticket ya existe la guarda equipo ↔ cliente, que avisa nombrando los dos clientes (ver M1.1).
Propiedad del dato de la OV [DECIDIDO 21/09 y 23/09 — R08.4] (e005-iv4-iv11, e005b-parche-vehiculo, e005c-discrepancia-sin-espejo). Si la orden de venta se eligió en la aplicación, manda la aplicación y la sincronización no la pisa, ni el número ni su fecha; si no, manda Zoho, como hasta ahora. Cuando la sincronización trae una orden distinta a la elegida en la aplicación, se protege el dato y se crea un aviso al área Comercial sobre ese ticket, en la bandeja de avisos de la cabecera, diciendo qué orden trae Zoho y cuál tiene la aplicación, para corregirlo a mano. Un solo aviso por ticket mientras la discrepancia no cambie. Cuando exista el espejo de Zoho, esa información se mostrará allí. El parche forma parte de F1B-11. Sigue sin confirmar dónde se teclean hoy las órdenes (solo en la aplicación, en Zoho o en los dos); no cambia la regla.
Criterios de la subOV de lote [DECIDIDO 10/09 — R08.2]
Formato. El lote se identifica por el número de la OV. OV-AAAA-NNN es el prefijo del lote y no es documento; cada subOV es OV-AAAA-NNN-SS, con SS de dos dígitos (OV-2026-170-01, -02…). El número base nunca existe como OV propia en Books, para no contar dos veces el mismo ingreso ni la misma reserva de stock. El tamaño del lote es el número de subOV creadas, todas de golpe al recibir la OC del cliente.
Cuarentena. Una OV con sufijo que no cumpla el formato no sale en el desplegable, no suma en ningún saldo y aparece en una lista «OV con número no reconocido» visible para Comercial. El formato se asume frágil y se compensa: un número mal escrito se detecta en lugar de descuadrar el saldo en silencio.
Saldo por lote [R08.4]. Hay dos cifras distintas, y las dos existen. Consumido = subOV con asociación vigente / subOV creadas: es el saldo del lote (creadas, consumidas y libres). % ejecutado = subOV con ticket Finalizado / subOV creadas. Una subOV con su ticket en curso está consumida, pero no ejecutada. Sin subOV libres, un contrato agotado no puede consumirse. Alimenta el informe trimestral del registro de contrato.
Un ticket vigente por subOV. Una subOV tiene como máximo un ticket vigente.
Anulación. La anulación no borra la asociación: la marca liberada, con fecha, hora, persona y motivo (regla de M1.10). Sólo se libera lo no consumido: si hubo diagnóstico facturable, esa subOV queda consumida.
Registro de contrato y vigencia [DECIDIDO 17/09 y 24/09 — R08.4]
Registro de contrato (anexo-53-contratos). Desk 2.0 tiene un registro de contrato que complementa la convención de subOV, no la sustituye:
Lo crea Comercial al recibir la orden de compra, con cliente, lote (OV-AAAA-NNN), fecha de inicio y fecha de fin. Hay uno por lote.
Un ticket es de contrato por su subOV: lo es cuando tiene asociada una subOV de un lote registrado como contrato vigente. Se calcula, nadie lo marca a mano, y deja de serlo si el contrato vence o la asociación se libera.
Contrato vencido: una subOV de un lote con el contrato vencido no se asocia a ningún ticket.
Prioridad: se toma del cliente, no del ticket. Si el cliente tiene un contrato vigente, sus tickets nacen en prioridad Alta, también los correctivos cotizados aparte. Si además es Top 5, manda la prioridad más alta de las dos (ver M1.9.1).
Informe trimestral, como tabla exportable. Cada subOV del lote está libre (sin ticket), en curso (ticket abierto) o ejecutada (ticket finalizado). Por cada trimestre del contrato, contado desde su fecha de inicio, la ficha del contrato da: % ejecutado acumulado, servicios del trimestre con equipo, serial, tipo de servicio y fecha, subOV libres y días hasta el vencimiento. El documento «informe» de cada servicio todavía no está en los datos, y la tabla lo dice en su columna en lugar de inventarlo. La versión con formato para enviar al cliente queda para el portal.
Aviso de ritmo a Comercial: si al ritmo actual no se van a consumir todas las subOV antes de la fecha de fin, la aplicación avisa a Comercial, una vez por contrato y trimestre, para proponer la ampliación.
Vigencia (vigencia-contrato). Un contrato vencido no se consume, porque al cambiar de año cambia la lista de precios. La excepción: si el contrato vence antes del final del año, se puede ampliar para consumir los trabajos no ejecutados. [ABIERTO] Qué año cuenta (el natural, el de inicio o el de fin del contrato) y cuál es el tope de la nueva fecha de fin (E-086; Anexo D). Mientras no se decida rige la regla estricta: contrato vencido, ninguna subOV de su lote se asocia. Sustituye al pendiente de la R08.2 «este modelo no tiene dónde guardar un fin de contrato».
Estado de construcción. F1B-11 tiene construidos sus tres cambios: la asociación OV ↔ ticket, el parche de la propiedad del dato de la OV y el registro de contrato con la vigencia, la prioridad Alta por contrato, el informe trimestral y el aviso de ritmo. Falta la ampliación de contrato, a la espera de la respuesta anterior, y la fila no se cierra. Cierra el punto 53 del Anexo D.
[ABIERTO] Siguen abiertos, con dueño propuesto Gerencia (ver Anexo D):
Corregir un contrato mal dado de alta (lote o cliente equivocados): hoy solo se puede en la base de datos, y el lote equivocado queda ocupado (E-088).
El aviso de ritmo depende de la pasada periódica de sincronización con Zoho: hay que moverlo a una pasada propia antes de apagar esa sincronización con el modo sin Zoho (1G-04; ver M11).
Garantía: OVI y reclamación al fabricante [DECIDIDO 17/09 y 24/09 — R08.4]
OVI de garantía. La crea Servicio Técnico, en concreto el Director Técnico (ovi-garantia-autor). Es una de las excepciones por cargo del modelo de permisos (ver M1.9); la crea F1B-03.
Reclamación de garantía al fabricante (anexo-7-garantia-proveedor). Es una ficha propia vinculada al ticket y a la OVI de garantía, no una rama del blueprint: el ticket se cierra cuando el cliente queda atendido, y la reclamación sigue su curso aparte.
Al crear la OVI de garantía, el Director Técnico responde «¿Se reclama al fabricante?». Si responde sí, se abre la ficha. Si responde no, elige el motivo de una lista cerrada: fuera de garantía de fábrica · daño por mal uso · el costo de envío supera el valor de la pieza.
La ficha registra fabricante, pieza (referencia y serial), ticket y OVI de origen, número de caso del fabricante (RMA), valor reclamado (tomado del costo de la OVI), estado (abierta → enviada al fabricante → resuelta: reposición, nota crédito o rechazada) y valor recuperado.
Si una reclamación lleva más de 60 días abierta, se avisa al Director Técnico.
Se miden el valor recuperado frente al reclamado por marca y las piezas con fallas repetidas, que alimentan la taxonomía ISO 14224 (M2.4).
El envío físico de la pieza al fabricante usa la remisión sin ticket (motivo «envío al fabricante por garantía»; ver M1.3).
Entra en Fase 1 junto a la OVI de garantía (F1B-03), como tanda pequeña; sin empezar a 01/10. Cierra el punto 7 del Anexo D.
M4.5 El dato como argumento comercial
[DECIDIDO] Usar la base de costos y el historial de reparaciones como argumento estructurado frente a quejas de precio. Caso de referencia: un cliente gastó 9.000 USD en un año para mantener 48 equipos — menos de 200 USD anuales por equipo en repuestos.
[DECIDIDO] El listado de 78 puntos de control del diagnóstico Grimm se usa como herramienta de defensa comercial del precio de las calibraciones.
[DECIDIDO — R03] Los avisos de vencimiento de calibración se envían a todos los clientes, tengan o no contrato. No se restringen al nivel completo del portal: su función registrada es servir de campaña comercial para recuperar clientes «desaparecidos», y meterlos tras el contrato apagaría precisamente el canal que los recupera.
M5. Inventarios y repuestos (MRO)
MRO —Maintenance, Repair, Operations— es donde más dinero se pierde por ineficiencia.
[R08.4] El inventario sigue siendo el de Zoho Books. Desk 2.0 no lleva un inventario propio: lee el catálogo de artículos sincronizado desde Zoho Books (nombre, número de parte o SKU y, si la sincronización la trae, la imagen), que es el mismo que usa para los accesorios de las remisiones (ver M1.2). El sistema no compra: genera solicitudes y Compras las ejecuta.
M5.1 Reservas y repuestos adelantados
[DECIDIDO 24/09 — R08.4] Qué repuestos se adelantan al diagnóstico (anexo-47-repuestos). La reserva no espera a la cotización: se activa sobre los repuestos que el técnico marca en el diagnóstico. El argumento es de negocio: más del 90 % de las cotizaciones se aprueban, y esperar a la aprobación para pedir es regalar el lead time del proveedor en nueve de cada diez casos. El sistema aplica tres casos cuando el técnico marca un repuesto en el diagnóstico:
Situación del repuesto
Qué hace el sistema
Si el cliente rechaza
En inventario
Se reserva desde el diagnóstico, siempre
La reserva se libera
No está en inventario, pero es de rotación
Se solicita a Compras desde el diagnóstico, sin esperar la orden del cliente, hasta un total de $3.000.000 COP por ticket (valor de compra, antes de IVA); lo que exceda ese total espera a la orden
La pieza entra a inventario y la consume el siguiente servicio
Específico o de baja rotación, o por encima del tope
Espera a la orden del cliente
No se ha pedido nada
La marca de rotación la pone Compras en cada artículo, con los consumos del Portal Ambientalia · Análisis de Inventario, y la revisa cada trimestre.
El sistema no compra: genera la solicitud y Compras la ejecuta.
Control del riesgo: cada mes se mide el valor de los repuestos pedidos por adelantado que quedaron sin servicio; si crece, se ajustan el tope o la lista.
F1D-06 construye la mecánica con este criterio, después del corte. Ver también M2.3. Cierra el punto 47 del Anexo D.
Momentos de la reserva [R08.4]. El modelo de referencia de mercado (reserva blanda al cotizar, asignación firme al aprobar, consumo al ejecutar) queda así:
Momento
Acción
Efecto sobre el stock
Al diagnosticar
Reserva, según los tres casos anteriores
El repuesto en inventario queda comprometido para el ticket
Al aprobar el cliente
Asignación firme
Deja de estar disponible para otras órdenes
Al ejecutar la orden
Consumo
Se descuenta del stock y se suma al costo de la orden, una sola vez (ver más abajo)
Solicitud y entrega de repuestos: traspaso con el encargado de inventario [DECIDIDO 01/10 — R08.4]
«Solicitud repuestos» y «Entrega de Repuestos» son un traspaso interno de Servicio Técnico (detalle en M1.3 y M1.9.2):
«Solicitud repuestos» (En Proceso → Solicitado) la ejecuta el técnico a cargo del ticket y deriva el ticket al encargado de inventario, que es quien entrega los repuestos. [ABIERTO] Si el encargado de inventario es un cargo o una persona está por confirmar (Anexo D).
«Entrega de Repuestos» (Solicitado → En Proceso) la ejecuta el encargado de inventario al entregar las piezas y devuelve el ticket al técnico que lo tenía, como ya hace «Aprobación» con «quien tomó el ticket».
Si no hay pieza en el almacén, el ticket pasa a «En espera de repuestos» para pedirla fuera. Solicitado no se abandona (c3-salida-esperas).
La derivación se construye antes del corte (propuesta de asignación, pendiente de confirmar fila; ver §3.4). La restricción de que solo esas dos personas puedan ejecutar cada paso llega con el nivel de permisos «propietario del registro», todavía aplazado.
Regla de descuento único de inventario [PROPUESTO — R08.4]
Cada pieza se descuenta del inventario una sola vez. La remisión de salida que se crea desde la transición de entrega (antes del corte; ver M1.3) podrá listar también, como mejora posterior al corte, las partes autorizadas por el cliente que se reemplazaron, tomadas de la cotización aprobada; para el sistema, esa remisión confirmaría que se entregaron al cliente, y el inventario les daría salida automáticamente. Hay que repartir el descuento entre tres momentos: la «Entrega de Repuestos», donde la pieza pasa del almacén al técnico; la remisión de salida; y la factura de Zoho Books, mientras siga descontando inventario. Propuesta: la entrega al técnico deja la pieza asignada al ticket, y la remisión de salida confirma el consumo. [ABIERTO] Cómo convive con la factura de Zoho Books (Anexo D).
M5.2 Kitting
[DESCARTADO — R08] El revisor descarta el kitting por ahora. Se conserva el apartado como referencia de mercado, sin ítem de backlog asociado.
Agrupación lógica de partes para tareas recurrentes — «Kit servicio 2000 h», «Kit sello bomba X».
Al diagnosticar, el técnico carga 1 kit y el sistema descuenta los componentes individuales.
Facilita el check-out en almacén con un solo escaneo.
M5.3 Ubicaciones bin
[DECIDIDO 28/09 — R08.4] Aplazado en la R08, ahora tiene momento: entra después del corte, sin fecha, junto con la ubicación del equipo recibido, que se actualiza en cada movimiento (f1b04-rotulacion). Antes del corte la ubicación no se registra, porque una ubicación que solo se apunta al recibir queda desactualizada en cuanto el equipo se mueve; lo que sí entra es la confirmación obligatoria «Rotulado y guardado», con persona, fecha y hora, y la etiqueta con el código del ticket (ver M1.2).
Estructura: nomenclatura jerárquica Área-Fila-Rack-Estante (p. ej. A-01-B-3).
Tipos: bins de recepción, de picking y de almacenamiento/volumen.
Beneficios: menos tiempo buscando artículos, mayor precisión de inventario, conteos más ágiles.
M5.4 Reabastecimiento y compras
[YA RESUELTO FUERA DE DESK — R08] El reabastecimiento ya está resuelto en el Portal Ambientalia · Análisis de Inventario. Desk 2.0 no tiene que construirlo.
Lo que sí queda es la conexión: el CTP de M4.2 necesita saber si un repuesto está en inventario, en camino con fecha estimada o por solicitar con su lead time, y esos tres datos viven en ese portal. La pieza pendiente no es un módulo de compras, es una lectura. [ABIERTO] Anexo D, punto 48; va con el CTP, después del corte.
Punto de pedido diferenciado por lead time.
Solicitud automática de materiales. [R08.4] Con el criterio de M5.1, el sistema genera la solicitud a Compras desde el diagnóstico para los repuestos de rotación, y al pasar a «En espera de repuestos» para los que esperan la orden del cliente; Compras la ejecuta.
Análisis de cuello de botella en solicitud de repuestos a fábrica.
[PROPUESTO] Pronóstico de compras de consumibles y repuestos.
Alertas de stock mínimo y de stock crítico en la vista del planificador.
M5.5 Operación del almacén
[APLAZADO — R08] No es prioritario por ahora, pero no se descarta para el futuro.
Multi-almacén y tránsito: transferencias entre bodega central y camionetas de técnicos.
Conteos cíclicos con clasificación ABC.
Valoración por costo promedio ponderado.
Trazabilidad repuesto → orden → activo.
[DECIDIDO — pendiente de ejecución] Estandarizar la lista de SKUs y categorizarlos por etapa de revisión. [R08.4] Las cuatro fases comunes (física, neumática, óptica, electrónica) quedaron superadas el 23/09 (p45-macro-fases): las etapas son los N1 del catálogo de cada marca. La categoría del SKU tiene que permitir lo que ya está decidido para el diagnóstico: que el técnico vea solo los repuestos de la etapa (M2.3, F1D-06). El catálogo de artículos por modelo, con SKU y categorías, ya existe (e003-catalogo-equipos); falta comprobar en los datos cuántos modelos tienen sus artículos y su mano de obra cargados.
Registro de consumo escaneando el código QR del repuesto desde la propia orden.
M6. Planificación y capacidad
Sin un modelo de capacidad, la promesa de fecha es una apuesta. Este módulo es la condición previa del simulador CTP (M4.2) y, desde la R03, también del agendamiento de citas del cliente (M8.4).
[DECIDIDO 30/09 — R08.4] La asignación de trabajo no es una pieza independiente (corrección de Gerencia, E-098). Depende de los usuarios y cargos que existan en el sistema: se construye sobre el modelo de usuario, área y cargo (F1C-05, construido en su nivel cargo) y sobre la derivación de M1.9.2. En consecuencia, la carga se define por usuario (M6.1), el calendario de capacidad es el calendario laboral más la disponibilidad de cada usuario (M6.2), y el enrutamiento automático solo asigna a usuarios con área y cargo válidos (M6.3). Sustituye al planteamiento anterior de un parámetro de carga por área y un enrutamiento independiente del modelo de permisos. M6 va después del corte y sigue siendo condición previa del CTP.
M6.1 Parámetro de carga del servicio técnico
Creación de un parámetro de carga (% de ocupación) que exprese la capacidad real de asumir trabajo. [R08.4] Se define por usuario —las horas disponibles de cada técnico—, no por área.
Las variables deben ser configurables para poder calibrar el modelo con la experiencia real.
Según el equipo —y el histórico del cliente— se asigna una ocupación de carga a un colaborador, en porcentaje.
Análisis por colaborador de su capacidad de trabajo.
M6.2 Calendarios
[R08.4] Calendario de capacidad = calendario laboral + disponibilidad de cada usuario.
Calendario laboral [CONSTRUIDO] (calendario-habil, F1B-12, cerrada): jornada de lunes a viernes de 8 a 17 h; tabla de días no laborables con los festivos de Colombia, generados por año según la ley de festivos (incluidos los que se trasladan a lunes y los que dependen de Semana Santa), más los cierres de la empresa que registre Gerencia; y una sola función que calcula horas y días hábiles entre dos fechas. La usan las alarmas de SLA, el reloj del SLA, el tiempo promesa, la fecha prevista de facturación y los indicadores en días hábiles; ninguna otra pieza hace su propio cálculo.
Disponibilidad de cada usuario (vacaciones y ausencias). Pendiente, sin fila del plan todavía (propuesta de asignación, pendiente de confirmar fila; ver §3.4).
Calendario de solicitud de cita de servicio técnico, que tiene en cuenta la carga y refleja la capacidad de respuesta disponible.
Calendario interno de vencimiento de calibraciones Grimm. [R08] Conecta con los avisos al cliente por correo: la cita no sirve de nada si el cliente no la recibe por el mismo canal por el que se le avisa de todo lo demás.
Agendamiento por slots de capacidad: dado que hay un solo banco de calibración, sólo pueden recibirse X equipos por semana. Si Comercial intenta ingresar un equipo urgente, el sistema advierte: «Banco de calibración lleno hasta el martes. ¿Desea sobreescribir con autorización de Director?». [R08.4] Propuesta sin decidir; se concreta al construir M6, después del corte.
Análisis histórico por cliente y por marca-modelo para el cálculo de capacidad.
Ampliación del revisor [R08]. El mismo análisis histórico permite predecir cuánto va a costar el mantenimiento de un cliente concreto, a partir de su historial de fallas. Es un salto de calidad sobre el promedio por modelo: dos clientes con el mismo equipo pueden dar trabajos muy distintos según cómo lo traten, y eso el histórico lo sabe. Alimenta el CTP de M4.2 y la valoración de clientes de M7.4.
Calendario anual de picos y valles para la vista 360.
M6.3 Asignación de trabajo
Organización del trabajo a colaboradores en función del estado actual y de las predicciones.
[R08.4] Enrutamiento solo a usuarios válidos. El enrutamiento automático de tickets por especialidad o carga (propuesto) solo puede asignar a usuarios con el área y el cargo que permiten ejecutar la transición siguiente. Queda ligado al nivel «propietario del registro» del modelo de permisos, que se aplazó hasta tener funcionando la restricción por cargo (ver M1.9).
«Mis tickets» [R08.4]. La cola se ordena en el servidor por prioridad (Urgent, High, Medium, Low y, al final, sin prioridad) y, dentro de cada prioridad, por la fecha y hora de «Habilitar Servicio», no por la de llegada; vale también para el tablero (F1B-07, en curso; ver M1.9.1). Sustituye al orden «por prioridad de fecha promesa».
Semáforo de disponibilidad de repuestos en la cola del técnico.
[PROPUESTO] Selección en mapa para asignar masivamente tickets a un técnico.
[CONSTRUIDO] Cada transición registra a quién se deriva el trabajo («Derivado a»): el área y, cuando la regla lo dice, la persona («quien tomó el ticket», el técnico a cargo o el encargado de inventario). Es la pieza sobre la que se construye la asignación: dice de quién es el trabajo a partir de cada etapa, sin frenar el ticket cuando no hay persona. Vale para las 31 transiciones de servicio técnico, las 6 de equipo nuevo y las 4 de soporte remoto. Ver M1.9.2.
[R08] Planes de trabajo por técnico, semanales y mensuales, para que cada uno tenga visión de sus tareas en el tiempo y no sólo de la cola del día. Es la contrapartida de la priorización automática: si el sistema decide el orden, el técnico necesita al menos ver el horizonte. Se refleja en el tablero como «Mi plan semanal» y «Mi plan mensual» (M7.5).
M6.4 Exposición de la capacidad al cliente [NUEVO — R03]
El esquema del 21/08 conecta Calcular con Citas: el análisis calcula la carga del servicio técnico y ese resultado se convierte en la base del agendamiento del cliente, que ve libre u ocupado. Es la consecuencia más exigente de todo el marco, porque convierte un parámetro interno en un compromiso público.
Qué cambia respecto a M6.1
Mientras la carga es una herramienta interna, un error de estimación se absorbe reprogramando. En cuanto se publica, un error de estimación es un incumplimiento frente al cliente. Por eso la publicación necesita tres reglas propias:
1. Factor de holgura. No se publica el 100 % de la capacidad calculada. Se reserva un porcentaje configurable para urgencias, retrabajos y desviaciones de diagnóstico. La holgura es un parámetro del sistema, no una decisión de quien atiende. [ABIERTO] Fijar el valor inicial — Anexo D, punto 24.
2. Sobreescritura con autorización. La regla de M6.2 —«banco de calibración lleno hasta el martes, ¿desea sobreescribir con autorización de Director?»— se conserva y sólo es accesible desde dentro. El cliente nunca ve ni puede activar la sobreescritura. [R08.4] Como en M6.2, la regla está propuesta y se concreta al construir M6.
3. Prioridad del cliente [DECIDIDO 23/09 y 24/09 — R08.4]. Los slots se ofrecen según la prioridad del cliente de M1.9.1 (top5-manual, anexo-53-contratos). El Top 5 está encajado como excepción puesta a mano sobre el cliente, no sobre cada ticket: la fija el Director Comercial, que también mantiene la lista de quiénes son Top 5, y la prioridad automática sigue para el resto. Un cliente con contrato vigente tiene prioridad Alta, y si además es Top 5 manda la más alta de las dos. [ABIERTO] La calificación de los clientes sin contrato ni Top 5 (Anexo D).
Solicitar frente a reservar
La distinción es lo que permite que el agendamiento sirva a la vez como descarga de trabajo y como gancho comercial:
Nivel básico (sin contrato)
Nivel completo (con contrato)
Qué ve
Disponibilidad orientativa por semana
Disponibilidad por slot
Qué hace
Solicita una cita; Comercial confirma
Reserva el slot en firme
Efecto en el taller
Solicitud estructurada, sin llamada ni transcripción
Ocupa capacidad al confirmar
Prioridad
Estándar
Preferente
El cliente sin contrato deja de llamar igualmente —su solicitud entra estructurada y sin errores de transcripción—, pero la reserva en firme sigue siendo una prestación del contrato. [R08] Y simétricamente: si el cliente con contrato no envía el equipo en la fecha reservada, su slot se libera y pasa a cola de espera. La reserva en firme obliga a las dos partes, o deja de ser firme.
M7. Analítica, KPIs y predicciones
M7.1 Cuadro de mando de KPIs del taller
KPI
Fórmula
Fuente
Frec.
Dueño
Umbral
% Cumplimiento fecha comprometida (OTD)
entregados a tiempo / entregados total
fecha_prometida, fecha_entrega
Sem./Mens.
Ops
[R08.4] Más del 75 %, global y por cliente; parámetro configurable
Exactitud de promesa
(fecha_real − fecha_prometida) en días hábiles, p50/p90
fecha_prometida, fecha_entrega
Mensual
Ops/Dir
p90 ≤ +2 días
Lead time total (dock-to-dock)
avg(Entrega − Recibido) + p50/p90
Timestamps
Semanal
Ops
(por definir)
Lead time de diagnóstico
avg(DiagnósticoFin − Recibido)
Timestamps de etapa
Semanal
Jefe taller
(por definir)
Lead time de cotización
avg(CotEnviada − DiagnósticoFin)
Timestamps + evento de envío
Semanal
Comercial/Ops
p90 ≤ 1 día
Aging de aprobación del cliente
Distribución 0–2 / 3–7 / 8–14 / >14 días
Estado + timestamps
Diario
Comercial
[R08.4] 4 días hábiles en Notificación cliente = aviso al Coordinador Comercial (M1.7)
Tiempo de espera de repuesto
suma de duración en «En espera de repuestos»
Timestamps + motivo de pausa
Semanal
Almacén
(por definir)
Productividad del técnico
horas efectivas / horas disponibles
Tiempos de orden + calendario
Semanal
Ops
70–85 %
% Retrabajo / rechazo QA
retrabajos / casos cerrados
[R08.4] Rechazos en Control de calidad (M9.1)
Mensual
QA
< 5–8 %
Causas principales de desvío
Top motivos: cliente, repuesto, capacidad, rework
Motivo de pausa + taxonomía
Mensual
Dirección
—
Utilización del banco de calibración
horas reales / capacidad total
Timesheets de técnico
Semanal
Jefe taller
—
Margen bruto por ticket
valor cotizado − (costo MO + costo repuestos)
Zoho Books + CMMS
Por ticket
Dirección
—
Tiempo de ciclo comercial
suma de tiempo en estado `Espera_OC`
Log de estados
Semanal
Comercial
—
Precisión de diagnóstico
cotizaciones sin cambios / total cotizaciones
Módulo de cotización
Mensual
Técnicos senior
—
Tasa de retrabajo (bounce rate)
equipos retornados / total reparaciones
QA + garantías < 30 días
Mensual
QA/Técnico
—
Tasa de corrección de datos capturados (nuevo R03)
campos corregidos manualmente tras OCR/autocompletado / total capturados
Log de captura (M3.4)
Mensual
Ops
Tendencia decreciente
Exactitud de la agenda publicada (nuevo R03)
citas cumplidas en el slot ofrecido / citas agendadas desde el portal
Agenda + timestamps
Mensual
Ops
≥ 95 %
Umbrales pendientes de fijar. Cuatro indicadores siguen sin umbral: lead time total, lead time de diagnóstico, tiempo de espera de repuesto y causas principales de desvío. Conviene cerrarlos antes de publicar el tablero, o el semáforo no significará nada. [ABIERTO] Anexo D, punto 5.
[R08.4] Umbral del OTD. La meta es un cumplimiento superior al 75 %, global y por cliente (corrección de GN del 01/10/2026; sustituye a la meta anterior de ≥ 90 %). Es un parámetro configurable, no fijado en el código, para poder subirlo cuando el proceso mejore. No mueve el plan: los semáforos y umbrales de los indicadores van en la Fase 2, con el cuadro de mando; antes del corte los indicadores se entregan sin umbrales (ver «Continuidad de indicadores» más abajo). [ABIERTO] Si el umbral se aplica a los dos indicadores de cumplimiento decididos el 30/09 —el del taller y el global ante el cliente— o solo a uno (Anexo D).
Los indicadores que ya existen [AS-IS — R05]
El diccionario documenta trece columnas calculadas que hoy se computan sobre la tabla de tickets. Conviene tenerlas delante antes de construir el cuadro de mando: buena parte del trabajo está hecha, y algunas fórmulas ya llevan dentro decisiones que hay que revisar.
Col.
Indicador
Cómo se calcula hoy
47
Tiempo permanencia
Entre remisión de entrada y remisión de salida. Es el dock-to-dock de este mismo apartado.
48
Tiempo inicio de servicio
Diferencia entre creación del ticket y remisión de entrada. Inválido para 2026 — ver M1.10.
49
Tiempo de diagnóstico
Fecha de revisión del informe menos fecha de creación del ticket. Arrastra el mismo problema que el 48.
50 · 53
Tiempo de servicio
Días hábiles desde la orden de venta —o desde la recepción de repuestos, si la hubo— hasta la finalización de ST. Excluye por diseño la espera de repuestos.
51
Tiempo recogida del equipo
Desde que el equipo está listo hasta que el cliente lo recoge.
52
Días de entrega
El Tiempo promesa que fija ST al escalar a revisión (M4.2).
54
Cumplimiento del tiempo promesa
Cumple / No cumple, comparando el 53 contra el 52. Es el OTD tal como se calcula hoy.
55
Calificación de satisfacción
La que el cliente da en el correo de finalización. Uso trimestral.
56
Tiempo bodegaje de ingreso
Inválido para 2026 — ver M1.10.
57
Tiempo de cotización
Entre revisión del informe y envío de la cotización.
58
Tiempo de orden de compra
Lo que tarda el cliente en enviar la OC tras la cotización. Es el aging de aprobación.
59
Tiempo de orden de venta
Lo que tarda en generarse la OV.
16
Número de comentarios
El diccionario lo propone como medida del desgaste en la atención del ticket.
Tres cosas que esto cambia en el cuadro de mando.
El OTD ya existe y mide al taller. La columna 54 mide el compromiso contra la fecha de finalización de Servicio Técnico, no contra la entrega al cliente; entre una fecha y otra está el tiempo de recogida (columna 51), que no depende de Ambientalia. Y el OTD del taller resulta inmune al problema del ciclo de facturación que describe la corrección C4, porque no usa la fecha de remisión de salida. [DECIDIDO 30/09/2026 — R08.4] Se mantienen dos indicadores de cumplimiento: el del taller (columna 54, contra los días de entrega que fija el técnico) y el global ante el cliente, que mide contra el tiempo promesa global = tiempo de diagnóstico + días de entrega fijados en «Escalado a Revisión», en días hábiles y sin las esperas ajenas a Ambientalia definidas en C7 (M4.1). El global es funcionalidad nueva y va después del corte.
La satisfacción entra en el cuadro. La columna 55 se recoge por correo al finalizar y hasta ahora sólo se usaba para el reporte trimestral. Es el único indicador del conjunto que mide lo que el cliente percibe. [R08.4] Forma parte de la lista cerrada de continuidad (abajo) y se mostrará por canal (correo o tableta), con el número de servicios que tienen al menos una calificación.
Idea del revisor [R08] — provocar la valoración. La calificación de satisfacción existe pero depende de que el cliente conteste un correo. Conviene pensar una estrategia para que valore, con mecánicas de gamificación —racha de respuestas, visibilidad de su propio historial de servicio, algún reconocimiento asociado al contrato—. El indicador sólo sirve si tiene volumen: una tasa de respuesta baja hace que mida a los descontentos, que son los que siempre contestan. [R08.4] La encuesta en tableta en la entrega (abajo) es la primera medida en esa dirección.
Los indicadores que dependían de la fecha de creación. El bodegaje (56) y el tiempo de inicio de servicio (48) dependen de la fecha de creación del ticket y quedaron inválidos en 2026; el tiempo de diagnóstico (49) usaba la misma referencia. [R08.4] Resuelto con la regla de tomar la marca de tiempo de la transición correspondiente en lugar de la fecha de creación del registro: el 48 y el 56 salen de la lista y los sustituyen los tres bodegajes, medidos sobre el historial de transiciones en días naturales (M1.10); el tiempo de diagnóstico se mide siempre desde las marcas de tiempo de las transiciones [CONSTRUIDO].
Continuidad de indicadores y encuesta de satisfacción
[DECIDIDO 24/09/2026 — R08.4] De todo el módulo de indicadores, una sola pieza se adelanta a antes del corte: la continuidad de los indicadores que hoy calcula Zoho Desk (decisiones e009-kpis y e009b-lista-indicadores). Desk 2.0 los calcula sobre las marcas de tiempo de las transiciones. Es la tanda F1F-05.
Lista cerrada de nueve indicadores del Anexo G: tiempo de permanencia (47), tiempo de diagnóstico (49), tiempo de servicio en días hábiles (50·53), tiempo de recogida del equipo (51), cumplimiento del tiempo promesa (54, contra el tiempo promesa del 52), satisfacción del cliente (55), tiempo de cotización (57), tiempo de orden de compra (58) y tiempo de orden de venta (59).
Quedan fuera las columnas 48 y 56, inválidas desde 2026 y sustituidas por los tres bodegajes, y la 16, que no se usa.
Forma de entrega: tabla exportable, sin tablero, semáforos ni umbrales.
Comprobación: durante las cuatro semanas previas al corte se calculan los nueve en la aplicación, en paralelo con Zoho y sobre los mismos tickets. Se dan por buenos si coinciden en al menos el 95 % de los tickets, con una diferencia máxima de un día en los tiempos; cada diferencia mayor se explica por escrito. Si a la aplicación le falta algún hito para calcular uno de ellos, se dice antes de construir y se decide aparte.
Dependencia: el tiempo de servicio necesita el calendario laboral, ya construido (F1B-12).
Lo demás se queda en la Fase 2: tablero Kanban, OTD y lead times con semáforo, y dashboards por rol.
[R08.4] El décimo indicador. A la lista de nueve se suma el cumplimiento global ante el cliente (corrección del 30/09), que mide contra el tiempo promesa global de M4.1. Va después del corte, porque el tiempo promesa global es funcionalidad nueva.
[ABIERTO] Indicadores rotos por reentrancia. Los indicadores 47, 50·53, 57 y 58 se rompen si un ticket vuelve a pasar por un estado que ya contó una vez. Falta decidir si se corrigen antes de publicar indicadores con ellos o si se documenta la limitación; el hallazgo no se ha vuelto a medir desde el 08/09. Anexo D, punto 66 (Alfonso / Ops). Afecta a la comprobación del 95 %, porque tres de los cuatro están en la lista cerrada.
[DECIDIDO 24/09/2026 — R08.4] Encuesta de satisfacción. Hoy la envía Zoho al finalizar el ticket; desde el corte del 14/12 Zoho queda en solo lectura y la encuesta pasa a Desk 2.0 en dos tiempos:
Entre el 14/12 y la independencia total: Comercial la envía a mano al finalizar cada servicio, desde el correo corporativo, con un enlace a un formulario de Google con las mismas preguntas. En enero de 2027 las respuestas se cargan en Desk 2.0 asociadas a su ticket, para que el reporte trimestral no tenga hueco (decisión encuesta-entre-corte-e-independencia).
Desde la independencia total: la envía Desk 2.0 automáticamente, con el correo propio (épica 1H, enero de 2027).
(Sustituye a lo previsto en e009-kpis, que hacía salir la encuesta automática de Desk 2.0 desde el mismo día del corte.)
[R08.4] Encuesta en tableta en la entrega (corrección del 30/09). Complementa la de correo, no la sustituye:
Cuando quien recoge el equipo es el propio cliente, se le ofrece en recepción, en una tableta, un formulario breve para calificar el servicio. Si recoge una transportadora, no se ofrece, porque no tiene criterio para valorar el servicio.
La remisión de salida registra quién recoge: cliente o transportadora.
Cada calificación guarda su canal (correo o tableta) y queda asociada al ticket. El indicador de satisfacción se muestra por canal y con el número de servicios que tienen al menos una calificación.
Mientras no esté construida, la tableta usa el mismo formulario de Google previsto para el periodo entre el corte y la independencia. La versión integrada en Desk 2.0 va después del corte.
Advertencias de calculabilidad [R04, estado a R08.4]
Cinco indicadores del cuadro no eran fiables por razones que estaban en el flujo y no en el modelo de datos: un indicador construido sobre estas bases habría que recalcularlo después, y el histórico anterior a la corrección no sería comparable. [R08.4] Las correcciones del flujo que los resuelven (C2, C3, C4, C5 y C7) están decididas y se construyen después del corte, dentro de la épica 1C. Hasta entonces, cualquier indicador publicado con ellas lleva esta advertencia.
Indicador
Obstáculo
Corrección
Estado a 01/10/2026
OTD, servicios finalizados y tiempo promedio
Finalizado mezcla servicios terminados con servicios abandonados.
C2 · M1.10
Decidida el 23/09: estado Anulado con cinco motivos; los anulados salen de las tres métricas y el histórico abandonado se marca, no se reescribe. F1C-01, después del corte.
OTD y exactitud de promesa
El ciclo facturar↔entregar reescribe Fecha Remisión de Salida en cada vuelta y borra la fecha de la primera entrega.
C4 · M1.3.5
Decidida el 23/09: dos ramas sin ciclo; la fecha de remisión de salida se escribe una sola vez. F1C-02, después del corte.
Tiempo de espera de repuesto
Los estados de espera no detienen ningún reloj de SLA, y un ticket atascado sin salida infla el indicador en lugar de delatarse.
C3 · C7 · M1.3.4
Decididas el 23/09: el reloj del SLA tiene su propia lista de estados en los que se para, sin sub-estados de pausa; las esperas tienen salidas decididas que ejecuta la persona a cargo (corrección del 30/09). F1C-06 y F1C-03, después del corte.
Análisis de tiempos por tipo de evento
Las transiciones no llevan el atributo de tipo.
C5 · M1.8
Decidida el 23/09 y aprobada por GN el 01/10: cuatro tipos (Operativo, Decisional, Compras/Logístico, Administrativo), uno por transición. F1C-04, después del corte.
Cualquier métrica por estado inicial
Ticket creado y Remisión creada sólo existen para los tickets nacidos en la aplicación; los de Zoho entran por OV asignada.
— · M1.3.2
Desde el corte del 14/12 todos los tickets nacen en la aplicación; la diferencia queda en el histórico traído de Zoho y hay que tenerla en cuenta al comparar periodos.
Añadido al análisis operativo (M7.3): un listado de tickets atascados en los estados de espera, con antigüedad. [R08.4] Hace visible el problema de M1.3.4 hasta que se construyan las salidas decididas para las esperas (C3, F1C-03, después del corte).
M7.2 KPIs de confiabilidad (si se extiende a mantenimiento de planta)
KPI
Definición y fórmula
Nota de diseño
MTTR
Σ(fecha reparación − fecha falla) / nº de fallas
Desglosarlo en notificación + asignación + viaje + diagnóstico + tiempo de llave + logística.
MTBF
Tiempo operativo total / nº de fallas
Alimenta lo predictivo.
OEE
Disponibilidad × Rendimiento × Calidad
Requiere integración con producción del cliente.
Cumplimiento de planificación
Regla del 10 %
Un preventivo mensual programado el día 15 sólo es conforme si se ejecuta entre el 12 y el 18.
Costo de mantenimiento / RAV
(costo anual / valor de reemplazo) × 100
Si supera 5–10 % anual, sugiere evaluar reemplazo.
M7.3 Análisis operativo
Tiempos entre fases y tiempos por ramas del flujo. [R08] Y tiempo por técnico, que es la desagregación que falta: sin ella no se distingue una etapa lenta de un reparto de carga desigual.
[DECIDIDO 10/09 — R08.2] La verificación no se mide con la duración del estado Verificación mientras el estado se registre al terminar. Evidencia: 72 estancias en Verificación en los 181 tickets de equipo nuevo, mediana 14 minutos, distribución bimodal —30 por debajo de 5 minutos, que se registran al terminar, y 30 por encima de una hora, 16 de ellas por encima de un día—. El estado debe abrirse al empezar la verificación, no al terminarla. Mientras se registre al final, su duración no mide el trabajo.
Probabilidad de deriva de las reparaciones por rama del flujo.
Pronóstico de tiempo de servicio estimado por modelo, marca y cliente.
Comportamientos históricos por cliente: tiempo de emisión de la OC, tiempo de recogida, tiempo de bodegaje. La observación de partida es que hay clientes con tendencia a no cuidar los equipos, cuyos servicios suelen ser más largos.
Análisis de cuellos de botella en puntos críticos.
Aging del backlog y top 10 de tickets más antiguos.
Reincidencias: mismo activo o misma causa en 30 días.
[R08.4] Tiempos por tipo de evento. Con la corrección C5 aprobada, cada transición lleva un tipo de evento —Operativo, Decisional, Compras/Logístico o Administrativo—, uno solo por transición (M1.8). El análisis de tiempos por tipo de evento se vuelve calculable cuando se aplique en F1C-04, después del corte; como el tipo es propiedad de la transición, el historial anterior queda clasificado igual.
M7.4 Predicciones
Predicción del comportamiento del cliente a partir del análisis histórico.
Predicción de la carga en función del estado actual + histórico + estado comercial en Zoho CRM + vencimientos de calibración.
Predicción de picos y valles en un calendario anual para la vista 360.
Alertas de desviación de comportamiento: certificado de calibración vencido que puede convertirse en urgencia; lámpara de un APSA cercana al límite. [ABIERTO] Falta completar una tercera alerta enunciada sin definir.
Dos cautelas sobre el mantenimiento predictivo [27/08]. La propuesta de predecir a partir de datos de logger —alarmas, horas de operación— se registró con dos advertencias que conviene no perder: sin histórico de años anteriores el sistema generaría alertas erróneas, y la conectividad de la generación actual de equipos Horiba [verificar] requiere una tarjeta adicional que pocos clientes integran. El obstáculo no es el algoritmo: es que no hay ni serie histórica ni parque conectado. Refuerza la ubicación del servicio premium en la fase más lejana del roadmap.
[R08.4] Mantenimiento predictivo a partir de los protocolos de servicio (GN, 01/10/2026; complementa las dos cautelas anteriores). En lugar de depender de equipos conectados, la predicción se basa en los valores que el técnico registra en los campos de valor del catálogo de diagnóstico de cada equipo que ingresa al taller. Tres requisitos:
Datos, desde ya. En el modelo de datos del catálogo (F1D-01), cada valor medido se guarda como dato numérico con su unidad, ligado a equipo, modelo, ítem del catálogo, fecha y ticket, y con dos lecturas cuando hay ajuste: «como se encontró» y «como se dejó».
Umbral para analizar. Cuando un modelo acumule datos de más de 6 meses y de más de 30 equipos, se analiza por modelo. Se buscan las tendencias de cada función interna, los valores que anticipan una falla, la vida útil típica de los repuestos y las diferencias entre equipos. [ABIERTO] Si, cuando un modelo no alcanza el umbral, el análisis se hace por familia tecnológica (Anexo D).
Uso de los resultados. Primero, como informe para Dirección Técnica. Si las tendencias se confirman, alimentan las recomendaciones de cambio preventivo (M2.3), los planes de mantenimiento de los contratos y, más adelante, el servicio premium (M8.9).
Sólo el requisito 1 afecta al desarrollo, y entra en la épica 1D, después del corte. El análisis no es desarrollo hasta que haya datos suficientes. Las mismas lecturas «como se encontró / como se dejó» son además un registro técnico que pide la ISO/IEC 17025 (M9.2).
Indicador de valoración del cliente por parte de servicio técnico.
M7.5 Dashboards por rol
Vista
Foco
Contenido
Dirección / Gerencial
Cumplimiento y dinero
SLA global, backlog en horas, costo acumulado, margen por ticket, OTD por técnico.
Dispatcher / Torre de control — [R08.4] la usa el Director Técnico
Qué se cae hoy
Kanban: Recepción · Diagnóstico · En cotización · En reparación · Control de calidad · Listo para entrega. Tarjetas en rojo si Fecha actual > (Fecha prometida − Lead time restante).
Comercial
Cuellos de botella y conversión
[R08.4] Tickets señalados «Esperando aprobación del cliente» (más de 4 días hábiles en Notificación cliente, M1.7); lista de Remisión creada por antigüedad (M1.2); precotizaciones; pronóstico de compras; embudo de conversión del portal (R03).
Planificador — [R08.4] la usa el Director Técnico
Recursos
Calendario, carga por técnico (WIP vs. capacidad), alertas de stock crítico, holgura publicada vs. real (R03).
Técnico
Ejecución
«Mis tickets» ordenados automáticamente ([R08.4] por prioridad y, dentro de cada una, por la fecha y hora de «Habilitar Servicio», M1.9), semáforo de repuestos, notificaciones. [R08] «Mi plan semanal» y «Mi plan mensual» en la vista del técnico (M6.3).
Requisitos transversales del tablero
Drill-down infinito: cualquier cifra es clicable hasta la ficha del ticket.
Carga asíncrona por widget.
Filtros: fecha, prioridad, cliente, tipo de activo, contrato, técnico, categoría, causa.
[R08.4] Se añaden número de ticket y serial del equipo (GN, 01/10/2026). El serial se filtra con búsqueda parcial —por ejemplo, los últimos dígitos—, con la misma lógica que el autocompletado por serial de la recepción (M1.1). En el listado de tickets, la búsqueda por número de ticket y por serial es paridad con Zoho Desk y entra antes del corte del 14/12; si la aplicación ya la ofrece, basta con confirmarla. En el cuadro de mando con indicadores entra con el resto de los filtros, en la Fase 2.
Acciones rápidas: reasignar, escalar, pausar con causa, solicitar repuesto, pedir aprobación al cliente.
Alertas push/correo: SLA en rojo, ticket reincidente, espera de repuesto superior a X días.
M7.6 Campos y estados que el modelo de datos debe garantizar
`fecha_prometida`, `fecha_entrega` / `Fecha_Salida`, `Fecha_Entrada`, `fecha_real`, `DiagnósticoFin`, `CotEnviada`, estado `Espera_OC`, estado «En espera de repuestos», `motivo_pausa` con taxonomía cerrada, eventos de rechazo de QA, horas efectivas y disponibles, horas de calibración, valor cotizado, costo de mano de obra y costo de repuestos.
Añadidos en R03: `origen_captura` y `corregido_manualmente` por campo capturado (M3.4); `nivel_portal` por cliente (básico / completo); `slot_ofrecido` y `slot_cumplido` en las citas agendadas desde el portal; `evento_portal` con tipo y marca de tiempo para el embudo de conversión.
[R08.4] Añadidos en R08.4: lecturas «como se encontró» y «como se dejó» por ítem medido (M7.4); quién recoge el equipo en la remisión de salida y canal de cada calificación de satisfacción (M7.1); motivo de Anulado (C2); tipo de evento por transición (C5); entradas y rechazos del estado Control de calidad (M9.1); fecha de factura como atributo del ticket, no como estado (C4).
Añadido en R05: el Anexo G documenta las 59 columnas de la tabla actual, con su significado y sus fórmulas. Es el punto de partida del modelo de datos de Desk 2.0 y la referencia para decidir qué migra, qué se deriva y qué se retira: el propio diccionario marca doce columnas como «omitir, no es relevante», y ésas son las primeras candidatas a no viajar a la nueva plataforma.
M7.7 Métricas del área de cliente [NUEVO — R03]
Si el portal es un producto y no un canal de soporte, necesita medirse como producto. Sin estos indicadores no será posible demostrar que el área de cliente genera ingreso y no sólo gasto.
Indicador
Definición
Dueño
Penetración
Clientes con acceso activo / clientes con equipos en cartera
Comercial
Cobertura de equipos
Equipos visibles en el portal / equipos totales del cliente
Ops
Uso
Sesiones y acciones por cliente y por mes
Comercial
Aprobaciones por portal
Cotizaciones aprobadas desde el portal / total aprobadas
Comercial
Ahorro de ciclo
Diferencia de tiempo medio de aprobación: portal vs. correo
Comercial/Ops
Conversión a contrato
Clientes que pasan de nivel básico a contrato con origen atribuido al portal / clientes en nivel básico
Comercial
Retención
Tasa de renovación de contratos entre clientes que usan el nivel completo frente a los que no
Dirección
Descargas de FW/SW
Descargas por cliente, serial y versión; equipos desactualizados
Dir. Técnica
Consultas resueltas sin persona
Consultas atendidas por la KB Externa o el agente / consultas totales entrantes
Dir. Técnica
M8. Portal de cliente y comunicación externa
Módulo reescrito en la R03. Deja de plantearse como un canal de soporte —«que el cliente pueda consultar el estado de su equipo»— y pasa a plantearse como producto: el gancho comercial del contrato de mantenimiento. La diferencia no es retórica; cambia qué se construye, qué se mide y a quién se le cobra.
Un portal de soporte se mide por llamadas evitadas. Un portal que es producto se mide por contratos firmados y renovados (M7.7).
M8.1 El modelo de dos niveles [DECIDIDO 21/08]
El área de cliente se estructura en dos niveles de acceso, determinados por la existencia de un contrato de mantenimiento activo:
Prestación
Nivel básico — sin contrato
Nivel completo — con contrato
Acceso
Token en enlace de correo, sin registro
Cuenta registrada (OAuth2 / OIDC)
Estado del equipo (Track & Trace)
Sí
Sí
Aprobación de cotización en un clic
Sí
Sí
Hoja de vida del equipo
Versión reducida
Completa: historial, intervenciones, componentes con garantía propia, costos
Certificados de calibración
Todos los del equipo, no sólo el vigente —ampliado en la R08—
Histórico completo descargable
Avisos de vencimiento de calibración
Sí
Sí
KB Externa: vídeos de operación, mantenimiento básico, PDFs y notas técnicas
Vitrina pública mínima
Acceso completo
Agente conversacional técnico
No
Sí
Descarga de firmware y software
No
Sí
Agendamiento de citas
Solicita (Comercial confirma)
Reserva en firme, con prioridad
Por qué el nivel básico no es una concesión. Aunque sea gratuito, el nivel básico se paga solo: elimina las llamadas para preguntar por el estado de un equipo, acelera el ciclo de aprobación de cotizaciones —que es tiempo de caja— y convierte cada solicitud de cita en un registro estructurado en lugar de un correo que alguien transcribe. Su coste marginal es casi nulo una vez construido el MVP; su beneficio es inmediato.
Por qué el nivel completo vende contratos. Lo que queda detrás del contrato no es información sobre el propio equipo del cliente —eso es suyo y se le da—, sino capacidad de autonomía: saber operar y mantener el equipo sin llamar, tener el firmware, poder preguntar a cualquier hora, y reservar taller con prioridad. Es una prestación que el cliente percibe todos los meses, no sólo cuando algo se rompe.
M8.2 Nivel básico
Alcance mínimo, ya definido: hojas de vida y aprobación de cotizaciones. [R08.4] Se construye después del corte: el plan de fases lo sitúa en la Fase 3, «Área de cliente nivel básico y seguridad» (2027 · T2), junto con la traducción de estados de la corrección C8 (sustituye a «entra en el MVP 2026»).
Track & Trace. El cliente ve el estado actual del equipo en lenguaje llano, con barra de progreso: «Recibido → Diagnosticando → Esperando tu aprobación → Reparando → Listo para entrega». Sin jerga interna ni nombres de estados del blueprint. [R08] Con aviso por correo en los cambios de estado relevantes, para que el cliente no tenga que entrar a mirar. El criterio de «relevante» conviene fijarlo con la traducción de estados de la corrección C8: el cliente no debe recibir un correo por cada una de las [R08.4] 31 transiciones de servicio técnico.
[R04] Esa barra necesita una traducción explícita desde los estados internos del blueprint (M1.3 y Anexo B), y no es trivial: varios —Notificación a Compras, Notificación Comercial, En espera de SKU inventario— no significan nada para quien está fuera y deben agruparse bajo una sola etiqueta. Hay además dos casos que resolver: el arranque, porque un ticket de Zoho y uno de la aplicación nacen en estados distintos (M1.3.2), y Por Entregar / Sin facturar, que para el cliente es «listo para entrega» aunque internamente siga a Pendiente de facturar ([R08.4] C4, rama sin factura). Es la corrección C8.
Botón «Aprobar cotización», que dispara directamente el cambio de estado en el sistema y detiene el reloj de espera (M4.1). Es la funcionalidad que ya está en piloto desde el 14/08.
Hoja de vida reducida del equipo — ver M8.3.
Descarga del certificado de calibración del servicio en curso.
Ampliación del revisor [R08] — certificados públicos y verificables. Que los certificados de calibración sean consultables públicamente, no sólo por el cliente propietario. El motivo no es de transparencia sino de antifraude: si cualquiera —una autoridad ambiental, un auditor, un tercero que recibe un informe— puede escanear el QR y comprobar que el certificado existe y es el que dice ser, falsificarlo deja de tener sentido.
Es un argumento comercial de primer orden y encaja con el QR verificable de M8.7. Lo que hay que acotar es qué se muestra: la verificación necesita confirmar que el certificado es auténtico y está vigente, no necesariamente exponer todos sus valores medidos. [ABIERTO] Punto abierto nº 49 (ver M8.7).
Solicitud de cita contra la disponibilidad orientativa del taller (M6.4).
Avisos automáticos de vencimiento de calibración, que llegan a todos los clientes por su función de campaña comercial (M4.5).
Escaparate de la KB Externa — ver M8.4.
M8.3 La hoja de vida reducida
El cliente ve la hoja de vida de sus propios equipos, en una versión acotada. Qué se muestra y qué no es una decisión de producto, no técnica, y está [ABIERTO] en su detalle (Anexo D, punto 28). La propuesta de partida:
Contenido
Nivel básico
Nivel completo
Identificación: modelo, serial, código interno del cliente
Sí
Sí
Estado operativo actual
Sí
Sí
Fecha de factura y fin de garantía
Sí
Sí
Última intervención (fecha y tipo)
Sí
Sí
Certificado de calibración vigente
Sí
Sí
Historial completo de intervenciones (15)
No — se indica que existe
Sí
Componentes sustituidos y su garantía propia
No
Sí
Costos acumulados del equipo
No
Sí
Timeline cronológico completo
No
Sí
[R08.4] Historial completo descargable (GN, 01/10/2026). En el nivel completo (clientes con contrato), el cliente puede descargar en PDF el historial completo de intervenciones de sus equipos, además de verlo en pantalla. En el nivel básico se mantiene lo decidido: se indica que el historial existe, pero no se abre ni se descarga. El PDF es el mismo que genera la versión imprimible de la hoja de vida (M3.3): incluye solo los campos visibles para el cliente y lleva la fecha de emisión. Queda registrado qué cliente lo descargó y cuándo. Va con el portal del cliente, después del corte.
El recorte es deliberadamente visible. Que el nivel básico indique «este equipo tiene 14 intervenciones registradas» sin poder abrirlas es lo que convierte la hoja de vida en argumento de venta en lugar de en una ficha incompleta. Ocultar la existencia del historial desperdiciaría el gancho; mostrarlo entero regalaría la prestación.
Cada campo de la hoja de vida lleva una marca de visibilidad en el modelo de datos (M3.1), de modo que la matriz anterior sea configurable sin tocar código.
Cómo se implementa [R08]. Lo que el cliente ve no se programa, se configura: cada campo de la hoja de vida (M3.1) lleva, además de su valor, un atributo que declara a quién se le muestra. Así, cambiar el alcance del nivel básico es tocar una configuración y no desplegar código, y el punto abierto nº 28 —fijar la hoja de vida reducida campo a campo— se convierte en rellenar esa tabla en lugar de en un desarrollo.
M8.4 Nivel completo
Depende de la capa RAG (M12.4) y del parámetro de carga (M6.1). [R08.4] En el plan de fases, la KB Externa publicada, la descarga de firmware y el agendamiento van en la Fase 4 (2027 · S2), y el agente conversacional del cliente en la Fase 5 (2028) (sustituye a «2027 · S1»). [R08] Ver las alternativas al RAG evaluadas en M12.3.
Biblioteca de contenidos — KB Externa
Vídeos de operación y de mantenimiento básico, cortos y específicos, producidos según M12.1.
PDFs y notas técnicas por marca y modelo. [R08.4] Todo instructivo o procedimiento publicado usa el formato único Technical Note (TN) de M9.3, con su audiencia (interna, externa o ambas) marcada desde que se crea.
Organización por equipo del cliente: al abrir su Grimm EDM 280, ve lo que aplica a ese modelo, no un catálogo general.
Vitrina pública mínima [PROPUESTO]. Cerrar la KB Externa por completo tiene un coste que paga Ambientalia: cada cliente sin contrato que no encuentra cómo cambiar un filtro llama a soporte y consume hora de técnico. La propuesta es dejar abierto un subconjunto reducido —guías de operación básica, sin troubleshooting— que además funciona como demostración de lo que hay dentro. El diagnóstico profundo, el correctivo y el agente quedan bajo contrato. [ABIERTO] Definir ese subconjunto — Anexo D, punto 25.
Agente conversacional
El cliente conversa directamente con el agente, que responde únicamente sobre temas técnicos apoyándose en la KB Externa. Especificación completa, alcance y guardarraíles en M12.5.
Descarga de firmware y software
Ambientalia tiene derecho a redistribuir el firmware y el software de los fabricantes, únicamente a clientes registrados. Esta es la razón técnica por la que el nivel completo exige cuenta y no basta el token. Especificación en M12.7.
Agendamiento en firme
El cliente con contrato reserva slot contra la agenda real del taller, con prioridad sobre las solicitudes del nivel básico. Reglas de capacidad, holgura y prioridad en M6.4.
M8.5 Identidad y acceso
El modelo de dos niveles resuelve por sí solo una tensión que arrastraba el documento: la R02 pedía un «portal sin login complejo, acceso por token en enlace de correo», y a la vez la distribución de firmware exige cliente registrado. No hay que elegir: cada nivel usa el mecanismo que le corresponde.
Objeción del revisor [R08] — ¿hacen falta dos mecanismos? La pregunta es pertinente: dos vías de acceso son dos desarrollos, dos superficies de error y dos sitios donde equivocarse con los permisos.
La respuesta corta es que no hacen falta dos, pero sí dos niveles de exigencia. El token no es un mecanismo de identidad alternativo: es un atajo de entrada para la acción que no puede tener fricción —aprobar una cotización, que es lo que desbloquea el taller—. Si esa acción exige registrarse, se pierde el beneficio que justificaba el portal.
La vía razonable es un solo sistema de identidad —el registrado— con un acceso por enlace firmado que actúa sobre él: el enlace del correo abre una sesión limitada de la cuenta del cliente, con alcance restringido a ese ticket y esa acción. No hay dos modelos de usuario ni dos árboles de permisos; hay uno, con dos formas de entrar. Y donde el registro es inevitable —descarga de firmware, historial completo— simplemente no se acepta el atajo.
Con eso el desarrollo se unifica y la fricción se mantiene donde interesa. Se recoge como recomendación de la R08, pendiente de confirmación. Punto abierto nº 50.
Nivel
Mecanismo
Alcance de la sesión
Por qué
Básico
Token de un solo uso en enlace de correo, con caducidad
Un ticket / un equipo concreto
Fricción cero justo donde importa: aprobar una cotización no puede requerir crear una cuenta.
Completo
Cuenta registrada con OAuth2 / OpenID Connect (Keycloak o Auth0, M11.2)
Todos los equipos del cliente, permanente
Descargas licenciadas, historial completo y agente requieren identidad verificable y trazable.
Los tokens caducan y son de alcance limitado; no dan acceso al resto de la cartera del cliente.
Un cliente puede tener varios usuarios registrados (mantenimiento, calidad, compras) con la misma cartera de equipos.
Toda acción del portal —aprobación, descarga, reserva— queda en la tabla inmutable de auditoría (M11.4), con usuario, marca de tiempo y equipo afectado.
[ABIERTO] Definir el procedimiento de alta y verificación del cliente registrado, y cómo se acredita la vigencia del contrato — Anexo D, punto 30.
M8.6 Regla de apertura del portal [DECIDIDO — R03]
El portal se abre por cliente, no globalmente. Un cliente sólo recibe acceso cuando sus equipos tienen la hoja de vida poblada con los campos comerciales de M3.1 ([R08.4] construidos en F1B-02; lo que falta es el dato en los equipos existentes). [R08.4] Además, un equipo solo se muestra al cliente cuando su historial está cargado y revisado con la carga masiva del histórico documental (M3.5). Un cliente que entra y ve una ficha vacía o un historial con huecos recibe exactamente la impresión contraria a la que se busca, y la primera impresión de un portal no se repite.
Orden de apertura recomendado:
1. Clientes del piloto de aprobación en un clic —los que ya tienen contrato activo—, que son también los que menos toleran una ficha incompleta.
2. Clientes Top 5 y/o con contrato, completada la carga de sus hojas de vida y de su historial.
3. Resto de la cartera, a medida que se completan los datos.
Esta regla convierte la calidad del dato en la condición de entrada del eje ③, que es exactamente lo que sostiene la cadena de §1.4.2.
M8.7 Certificados y calibración
Certificado digital con QR: el sticker físico pegado al equipo calibrado lleva un QR que, escaneado con cualquier celular, abre una URL pública segura con el PDF del certificado vigente. Valor inmenso para el cliente en auditorías.
Avisos automáticos de vencimiento de calibración a los clientes — a todos, con o sin contrato (M4.5).
El certificado con QR es público por diseño: su utilidad es que un auditor externo pueda verificarlo sin credenciales. [R08.4] La verificación pública confirma que el certificado es auténtico y está vigente sin exponer necesariamente sus valores medidos; qué datos muestra exactamente sigue [ABIERTO] (Anexo D, punto 49).
[R08.4] Si Ambientalia acredita calibraciones bajo la ISO/IEC 17025, el certificado público distingue siempre si es acreditado o no acreditado (M9.2).
M8.8 Canales de entrada
WhatsApp Business API [FUTURO]: el cliente reporta una incidencia enviando foto y ubicación; el sistema la convierte en ticket borrador mediante procesamiento de lenguaje natural.
Formularios de remisión conectados al flujo actual de n8n, integrados al ticket.
Usuarios externos limitados: gestionar empresas de servicios y contratistas como usuarios restringidos —por ejemplo, solicitudes de Metrological.
M8.9 Servicio premium [FUTURO]
Ambientalia monitorea los datos de los equipos de aquellos clientes con conectividad y avisa antes de que fallen o antes de que se venzan los tiempos de operación de los consumibles. Es la evolución natural del nivel completo: del autoservicio a la anticipación.
M9. QA/QC, calibración y cumplimiento
M9.1 Control de calidad interno
Etapa de validación de checklist obligatoria antes de la liberación, con calibración cuando aplica.
Retrabajo: el fallo de QA devuelve el equipo a ejecución con prioridad alta y queda registrado como evento medible.
Guarda de calidad: [R08.4] el equipo no sale desde Por Entregar sin foto del equipo embalado y checklist de QA firmado. («Entregado» es un estado obsoleto de Zoho Desk y no existe en Desk 2.0.)
Producto no conforme (flujo equipo-nuevo): notificación → análisis y acciones → retorno al flujo inicial.
[DECIDIDO 23/09/2026 — R08.4] Estado Control de calidad (corrección C6). Las cuatro piezas anteriores se concretan en un estado nuevo de la rama de servicio técnico. Hoy la aplicación [CONSTRUIDO] pasa de En Proceso a Por Facturar por finalización de servicio, sin etapa de calidad intermedia; con C6 queda así:
Dónde: entre En Proceso y Por Facturar.
Salidas: aprobado → Por Facturar; rechazado → vuelve a En Proceso con prioridad alta, y el retrabajo queda registrado para medirlo (indicador de retrabajo de M7.1).
Qué se revisa: el checklist se hace siempre; la verificación con gas patrón, solo cuando la pide el tipo de equipo y hay patrón vigente del compuesto, con la misma regla que la Verificación de equipo nuevo (M1.4). El checklist revisa los puntos que fallaron en el diagnóstico y alimenta el informe de salida.
Guardas de entrega: no se entrega el equipo sin foto del equipo embalado y checklist firmado. Esas fotos son las mismas que exige la remisión de salida (equipo, accesorios y embalaje, M2.1), sin pedirlas dos veces, y se suman a la guarda de remisión de salida vigente (M1.7).
Quién firma: el Coordinador Técnico, nunca el técnico que hizo el trabajo. Es la misma firma «Revisó» del informe (M2.5): se hace en un solo paso y no se pide dos veces. La firma se carga automáticamente con la imagen del responsable, como se decidió el 27/08.
Rutas abreviadas: la calibración directa también pasa por Control de calidad (M2.1).
Cuándo: tanda F1C-07, después del corte.
[R08.4] El modelo es la Verificación de equipo nuevo (M1.4), que sí tiene salida: Verificación → Liberación → Finalizado, y la salida rechazada va a Notificado. (Sustituye a lo dicho en la R05, que daba la Verificación por estado sin ninguna transición de salida.)
Certificados: QR, incertidumbre y firmas [DECIDIDO 27/08]
Tres requisitos que el Desk 2.0 no contemplaba y que se decidieron el 27/08, ubicados en una fase posterior del desarrollo:
Requisito
Situación hoy
Qué se decidió
QR del certificado digital
El aplicativo actual lo genera, verifica firmas y unifica certificado y protocolo, que hoy se producen por separado
Reconstruirlo dentro del Desk 2.0 para que el QR dirija al área de cliente en lugar de al PDF directo
Cálculo de incertidumbre
Se hace en Excel, fuera del sistema
Incorporarlo al flujo de calibración
Firmas y validación
—
El flujo debe incluir etapas de validación asociadas a los roles existentes, con carga automática de la imagen de firma del responsable de cada etapa
[DECIDIDO 24/09/2026 — R08.4] Firmas del informe. El informe lleva tres firmas: Elaboró (el técnico que hizo el trabajo), Revisó (el Coordinador Técnico, la misma firma del Control de calidad) y Aprobó (el Director Técnico). Nadie valida lo que él mismo elaboró: cuando el autor es el Coordinador Técnico, o cuando el Director Técnico tiene registrada su ausencia, el informe sale con una sola validación, marcada «validación única». Una vez aprobado, se emite con la imagen de las firmas cargada automáticamente y ya no se puede modificar. Detalle en M2.5. El certificado propio de Ambientalia llega con el módulo de informes (épica 1E), en 2027. Aparte, la Liberación de equipo nuevo ya exige el número del certificado de calibración de fábrica (M1.4).
Dos observaciones sobre el orden. La primera: que el QR apunte al área de cliente en vez de a un PDF es lo que convierte el certificado en algo verificable y revocable —y es la base técnica de la verificación pública antifalsificación de M8.2—. Aplazarlo a fase posterior es coherente con aplazar el portal, pero significa que las dos cosas se deciden juntas.
La segunda: las etapas de validación con firma son, en la práctica, la etapa de QA que pide la corrección C6, aplicada al flujo de calibración. [R08.4] Así quedó decidido: la revisión del Coordinador Técnico es a la vez la firma del Control de calidad y la firma «Revisó» del informe, en un solo paso.
M9.2 Trazabilidad y evidencia
ISO 9001 como marco de la codificación interna (serial + modelo). [DECIDIDO]
ISO 14224 como marco de la taxonomía de activos y de fallas. [DECIDIDO 24/09/2026 — R08.4] En su versión simplificada (edición 2016), como referencia y no para certificación (M2.4, M3.2).
Registro inmutable de auditoría de cada acción: quién, cuándo, qué cambió, valor anterior y valor nuevo (M11.4).
Firma digital y geostamping de las evidencias.
Check-in físico en el activo vía NFC o QR.
[DECIDIDO 24/09/2026 — R08.4] Validación de informes: tres firmas —Elaboró, Revisó y Aprobó— con las reglas de M9.1 y M2.5 (punto 10 del Anexo D, cerrado).
Qué cambia con la acreditación ISO/IEC 17025
[R08.4] Las medidas de este plan no dependen de la acreditación. Si Ambientalia se acredita bajo la ISO/IEC 17025, no cambia la estructura del sistema —el ticket, el flujo y la codificación interna bajo ISO 9001 siguen igual—, pero la norma añade requisitos a la calibración y al certificado. Este apartado es análisis para planificar, no una decisión.
Requisito
Cláusula
Situación en el plan
Cómo se cubre o qué falta
Equipos y trazabilidad metrológica
6.4 y 6.5
Sí, con los equipos propios
Hojas de vida de los equipos propios (M3.1): plan de calibración y verificación por equipo, avisos de vencimiento y registro del patrón usado en cada calibración, sin permitir uno vencido. Lista de gases patrón con el vencimiento del certificado del cilindro (M1.4).
Personal competente
6.2
Parcial
Cargos y permisos por cargo (M1.9); nadie valida lo que elaboró. Falta registrar la competencia y la autorización de cada técnico por tipo de calibración.
Condiciones ambientales
6.3
No
No se registran las condiciones en que se hace cada calibración.
Métodos versionados
7.2
No
Los catálogos tienen versión (Grimm v1.8, Horiba v1.4), pero la calibración no registra qué versión del procedimiento se aplicó.
Registros técnicos
7.5
Sí
Traza de cada transición con persona, fecha y hora; registro inmutable de auditoría (M11.4); lecturas «como se encontró» y «como se dejó» (M7.4); el informe aprobado no se modifica.
Incertidumbre de medida
7.6
No
Se calcula en Excel, fuera del sistema (M9.1). Es el requisito más exigente.
Certificado y regla de decisión
7.8
Parcial
Tres firmas y certificado con QR (M9.1, M8.7). Falta declarar la regla de decisión con la que se dictamina la conformidad; hoy se aprueba con las tolerancias del fabricante (M2.7).
Correcciones por versión nueva del certificado
7.8.8
Parcial
El informe aprobado no se modifica. Falta emitir cada corrección como versión nueva del certificado que identifique a la que sustituye.
Aseguramiento de la validez de los resultados
7.7
No
No hay verificaciones intermedias de los patrones ni comparaciones con otros laboratorios registradas en el sistema.
Imparcialidad y confidencialidad
4.1 y 4.2
Sí
Nadie valida lo que elaboró; permisos por área y cargo; cada cliente ve solo sus equipos en el portal (M8.5).
Integración en dos tiempos.
Desde ya, en el modelo de datos de la épica 1D y de los equipos propios: patrón usado, versión del procedimiento, condiciones ambientales, lecturas «como se encontró» y «como se dejó», y técnico que calibra.
Cuando se defina el alcance que se acredita ante ONAC: competencias del personal, cálculo de incertidumbre dentro del sistema, certificado acreditado con regla de decisión, versiones del certificado y verificaciones intermedias.
Los certificados acreditados y los no acreditados se distinguen siempre, en el documento y en la verificación pública (M8.7).
[ABIERTO] Qué procesos de calibración se acreditan y cuándo. Dueño: Gerencia y Dirección Técnica (Anexo D).
M9.3 Documentación publicada al cliente [NUEVO — R03]
Publicar procedimientos de mantenimiento básico y guías de operación en la KB Externa introduce una obligación que no existía cuando ese contenido vivía sólo en la cabeza de los técnicos: es documentación controlada. Bajo ISO 9001, todo documento que Ambientalia pone en manos del cliente necesita versión, fecha de emisión, responsable de aprobación y control de cambios.
Requisitos mínimos, desarrollados en M12.6:
Versión y fecha visibles en cada pieza de contenido publicada.
Responsable técnico que aprueba antes de publicar.
Registro de qué versión estaba vigente en cada momento, para poder responder qué instrucción tenía el cliente en una fecha dada.
Procedimiento de retirada de contenido obsoleto.
[R08.4] Formato único: Technical Notes (TN) (GN, 01/10/2026). Todo instructivo o procedimiento que se publique, en la KB Externa para clientes o en la interna, usa una sola plantilla con nombre transversal, «Technical Note» (TN). Cada TN lleva:
Identificación: código único (por ejemplo, TN-marca-número), título, versión, fecha de publicación y responsable de la aprobación.
A qué equipo va dirigida: marca, modelo o familia y, si aplica, versión de firmware.
Contenido: objetivo de la acción, precauciones de seguridad, herramientas o materiales, paso a paso numerado, cómo verificar que quedó bien y documentos de referencia (manual del fabricante, otras TN).
Audiencia: interna, externa o ambas, marcada desde que se crea, como ya está decidido para los vídeos.
Además:
Cada cambio es una versión nueva de la TN, y la anterior queda registrada: así se cumple el registro de qué versión estaba vigente en cada momento.
Desde la hoja de vida de un equipo se ven las TN de su modelo (M3.3; en el portal, M8.4).
Va después del corte. La producción del contenido se describe en M12.
Nota de responsabilidad. Trasladar tareas de mantenimiento básico al cliente es deseable comercialmente y ambiguo en responsabilidad: hay que definir qué ocurre con la garantía si el cliente ejecuta mal un procedimiento publicado. [ABIERTO] — Anexo D, punto 26.
M10. Movilidad, UX y modo offline
M10.1 Experiencia del técnico
Interfaz conversacional tipo chat dentro de la orden de trabajo.
Carga de fotos instantánea, dictado por voz y formularios inteligentes que se adaptan al contexto.
Checklists interactivos con lógica condicional.
Firma digital del cliente y del técnico.
Cronómetro de trabajo al iniciar la ejecución.
Objetivo declarado: adopción en horas, no en semanas.
[DECIDIDO 21/08] La interfaz inicial replicará la estructura de Zoho Desk para facilitar la adaptación del equipo técnico, pero con blueprints mucho más controlados y mucho menos dependientes de campos de texto libre.
[R08.4] Tres precisiones sobre esta lista:
La réplica de Zoho Desk es también el criterio de lo que entra antes del corte operativo del 14/12/2026: paridad con Zoho Desk. Lo que Zoho no tiene va después del corte (§3).
El dictado por voz quedó aplazado por lo decidido el 03/09 y no entra en la Fase 1.
Las firmas del informe (Elaboró, Revisó y Aprobó) y la del Control de calidad se cargan automáticamente con la imagen del responsable, como se decidió el 27/08 (ver M2.5 y M9.1).
Una tensión que conviene tener presente. Replicar la estructura de Zoho Desk reduce la curva de adaptación a corto plazo, pero los estudios de mercado señalan justo lo contrario como riesgo: heredar el paradigma de interfaz de escritorio es lo que hunde la adopción y, con ella, la calidad del dato. La lectura razonable es tomar la decisión como transitoria y planificar la evolución hacia la UX mobile-first del principio nº 1 una vez asentado el uso.
M10.2 Dispositivos
Tablet en recepción para el OCR de placas y el alta de equipos.
Tablet/móvil en la mesa de trabajo para el diagnóstico guiado.
Web de escritorio para dispatcher, comercial y almacén.
[R03] El portal de cliente (M8) se diseña mobile-first sin excepción: el cliente entra desde el móvil, muchas veces desde planta y con el equipo delante.
[R08.4] La tableta de recepción tiene además dos usos decididos el 30/09 y el 01/10:
las fotos obligatorias de las remisiones de entrada y de salida: equipo, accesorios y embalaje, más la foto de cada novedad (ver M2.1);
la encuesta de satisfacción en la entrega, cuando quien recoge el equipo es el propio cliente (E-096). Hasta que exista la versión integrada, que va después del corte, se usa el formulario de Google (ver M7.1).
[R08.4] Estado. La aplicación en uso se abre desde el navegador. En el plan de fases, la aplicación móvil y de tableta adaptable, con checklists, fotos y firma pero sin modo offline, está en la Fase 2. El modo offline está en la Fase 4.
M10.3 Modo offline
Cola de sincronización persistente.
Resolución de conflictos sin pérdida de datos — CRDTs o bases locales tipo PouchDB/WatermelonDB.
Criterio de aceptación: la aplicación descarga las órdenes del día al entrar, permite editar checklist y guardar fotos localmente, y sincroniza automáticamente al detectar red.
[R08.4] No entra antes del corte. Va en la Fase 4 del plan, con la resolución de conflictos, después de la aplicación móvil sin offline de la Fase 2.
M10.4 Arquitectura de mini-apps
[DECIDIDO] Las ideas operativas del equipo técnico —digitalización de manuales, troubleshooting de sensores— se traducen en mini-apps dentro del sistema.
[PROPUESTO] Realidad aumentada práctica: identificar activos por reconocimiento visual y superponer puntos de interés.
M11. Arquitectura, integraciones y datos
M11.1 Decisiones de arquitectura tomadas
[DECIDIDO] Base de datos propia en PostgreSQL, en la VPS propia (M11.5), como núcleo de Desk 2.0.
[LOGRADO 21/08] Se conectó con éxito Zoho a la base de datos externa PostgreSQL mediante un cliente REST propio con OAuth2 (refresh token por servicio). La información —tickets, órdenes de venta y contactos— se actualiza cada tres minutos. [R08.2] Las revisiones anteriores atribuían la conexión a MCP; MCP no interviene en el camino de datos.
[DECIDIDO 17/09 — R08.4] La aplicación no escribe en Zoho (p44-escritura-zoho). Desk 2.0 lee de Zoho sin permisos de edición ni de eliminación, y por ahora no se activa la escritura. Lo que haya que llevar a Zoho se escribe allí a mano. La línea futura, y condicional, es un «espejo de Zoho» dentro de la aplicación que enseñe lo que tiene Zoho frente a lo que tiene Desk 2.0, para comparar y corregir a mano en Zoho hasta que se decida activar la escritura. Con esto se cierra el punto 44: la precarga de repuestos en un borrador de cotización de Zoho CRM no se automatiza.
[DECIDIDO 21/09 — R08.4] Quién manda sobre la orden de venta (e005-iv4-iv11, e005c-discrepancia-sin-espejo). Si la orden de venta se eligió en la aplicación, manda la aplicación y la sincronización no pisa ni su número ni su fecha. Si no, manda Zoho, como hasta ahora. Cuando la sincronización trae una orden distinta de la elegida en la aplicación, el dato de la aplicación se protege y se avisa al área Comercial en la bandeja de avisos de la cabecera, diciendo qué orden trae Zoho y cuál tiene la aplicación. Hay un solo aviso por ticket mientras la discrepancia no cambie. Cuando exista el espejo de Zoho, la discrepancia se verá allí y el aviso podrá retirarse (ver M1.10 y M4.4).
[RESUELTO] El problema del 14/08 —el cron saturaba el sistema— se refería a consultar Zoho en vivo. Con la base propia, el cron alimenta PostgreSQL y las consultas de la aplicación van contra la base local.
[DECIDIDO 21/08] El objetivo es dejar de usar herramientas fragmentadas —n8n, Zoho Desk 1.0 y hojas de cálculo de Excel— y centralizar la operación desde la creación de remisiones hasta la facturación. [R08.4] Cómo queda cada pieza:
Zoho Desk deja de usarse para operar el 14/12/2026 y se deja de consultar con la independencia total de enero de 2027 (ver M11.3).
La hoja de Google de remisiones se cierra el 14/12/2026; mientras convivan, manda la aplicación (ver M2.5).
Los flujos comercial y de posible cliente se quedan en Zoho CRM en 2026, fuera de Desk 2.0 (flujos-comercial, ver M1.11 y M1.12).
El inventario y la facturación siguen en Zoho Books.
[DECIDIDO 21/09 — R08.4] Google Drive se queda enlazado (p8-p54-drive). Por la capacidad de almacenamiento del servidor, la documentación de servicio (informes, certificados y remisiones escaneadas) sigue en Drive y Desk 2.0 guarda el enlace. Con la carga masiva del histórico entran en la base los datos extraídos, cada uno con el enlace a su documento (ver M3.5). Cierra los puntos 8 y 54.
Bases de datos de referencia en Zoho: clientes, artículos y tickets, más órdenes de venta y contactos.
M11.2 Stack recomendado [PROPUESTO]
Capa
Recomendación
Razón
Patrón
Monolito modular para el MVP, con transición a microservicios al escalar
Gestiona la complejidad inicial sin cerrar la puerta a la escala.
Frontend web
React.js o Next.js
Mejor ecosistema para dashboards complejos.
Móvil
React Native o Flutter
Comparte lógica con la web; buen soporte de BD local para offline.
Backend
Node.js (NestJS) o Python (Django/FastAPI)
Node para tiempo real; Python si se integran librerías de IA en el mismo backend.
Base de datos
PostgreSQL
Relacional robusta + JSONB para formularios dinámicos. Ya decidido.
Almacén vectorial
pgvector sobre el mismo PostgreSQL (propuesto en R03)
Evita reintroducir un servicio aparte tras la decisión de eliminar Qdrant. Depende de la vía de la capa de conocimiento (M12.3, punto 51).
Series temporales
TimescaleDB o InfluxDB (fase 2)
Lecturas de sensores e histórico de estados.
API
GraphQL sobre REST para móvil
El cliente pide exactamente lo que necesita.
Autenticación
OAuth2 / OpenID Connect (Keycloak o Auth0)
SSO empresarial desde el día 1 y base del nivel completo del portal (M8.5).
[R08.4] La tabla es la recomendación de origen. Lo fijado hasta hoy es la base de datos: PostgreSQL en la VPS propia, con la aplicación en uso servida desde ese mismo servidor y abierta desde el navegador. Las filas de móvil, almacén vectorial, series temporales, API para móvil y autenticación del portal se deciden cuando llegue la fase que las necesita.
M11.3 Integraciones
Zoho CRM — estado comercial; alimenta la predicción de carga y, en R03, la determinación del nivel de portal de cada cliente según su contrato activo. [R08.4] Solo lectura. Los flujos comercial y de posible cliente siguen en Zoho CRM en 2026.
Zoho Books — costos y facturación; fuente del KPI de margen bruto por ticket. [R08.4] Solo lectura. Además aporta el catálogo de artículos (nombre oficial, número de parte y, si la sincronización la trae, la foto) para los accesorios de las remisiones y el SKU de los repuestos, y los contactos de clientes y proveedores, que usan también las remisiones sin ticket. El inventario sigue siendo el de Zoho Books (ver M5).
Zoho Desk — sistema actual a sustituir; conexión de solo lectura durante la transición. [R08.4] El calendario de su retirada está en el apartado siguiente, «Independencia de Zoho Desk».
Correo con el cliente — [R08.4] Hoy sale por Zoho Desk. Entre el 14/12/2026 y la independencia total, las respuestas al cliente salen del correo corporativo y se registran en el ticket. Después, el correo propio de Desk 2.0 (épica 1H) usa la Gmail API sobre el buzón de Google Workspace de la empresa.
Google Drive — [R08.4] Documentación de servicio enlazada desde Desk 2.0 (ver M11.1). La carpeta de documentación de servicio entra en el respaldo (ver M11.5).
Google Sheets — [R08.4] La hoja de remisiones se cierra el 14/12/2026 (ver M2.5). [ABIERTO] Si la doble escritura hacia Google Sheets se retira o se mantiene en paralelo con PostgreSQL, y quién resuelve la discrepancia si las dos fuentes divergen: punto 65. Dueño: Alfonso / Dirección Técnica.
n8n — automatizaciones y formularios actuales; se integran y progresivamente se absorben. [R08.4] El correo propio no pasa por n8n: se eligió la Gmail API porque Google firma el correo (DKIM), no hay que tocar el DNS y da sincronización incremental e hilos de conversación nativos.
Suite Ambientalia Cloud y sitio web — integración del frontend de clientes. [FUTURO]
Aplicación de valoración de clientes — recibe el indicador generado por servicio técnico.
API Gateway para ERP e IoT en fase posterior.
Independencia de Zoho Desk: corte en dos tiempos [DECIDIDO 24/09 — R08.4]
[DECIDIDO 24/09 — R08.4] La retirada de Zoho Desk se hace en dos tiempos (fecha-corte, corregida el 24/09; sustituye a la meta única del 31/12/2026 fijada el 09/09 y al «corte en seco» sin convivencia):
Corte operativo, lunes 14/12/2026. Desde ese día los tickets nacen en Desk 2.0 y Zoho Desk queda en solo lectura: nadie crea ni edita tickets allí, y ningún ticket se registra en los dos sistemas. Los tickets abiertos pasan a Desk 2.0 en su estado equivalente el fin de semana del 12–13/12. La fecha se confirma el miércoles 9/12 si se cumplen dos condiciones: crear y mover tickets en Desk 2.0, y pruebas con servicios reales superadas. Entre el corte y la independencia, el histórico se consulta en Zoho Desk en solo lectura y no se escribe en Zoho.
Independencia total, enero de 2027, cuando estén verificadas la repatriación del histórico (épica 1G) y el correo propio (épica 1H). Entonces se deja de consultar Zoho Desk y se dan de baja sus licencias.
Licencias (corte-licencias-plan-a): antes del 21/12 se renuevan solo 2 licencias de agente de Zoho Desk, en facturación mensual, para consultar el histórico en solo lectura. No se renueva en anual. Se dan de baja en cuanto 1G y 1H estén verificadas.
Plan A: si no queda al menos una semana de margen, corte único el lunes 01/02/2027. Con la cuenta del plan de fases R01.3 (24/09) hay entre +1,9 y +2,2 semanas de margen y el plan A no se activa.
Encuesta de satisfacción: entre el 14/12 y la independencia la envía Comercial a mano, con un formulario de Google, y en enero se carga en Desk 2.0. La encuesta automática entra con el correo propio (ver M7.1).
Épica 1G — Repatriación del histórico. Objetivo: que ninguna pantalla de Desk 2.0 necesite llamar a Zoho para mostrar algo del pasado. Los tickets, su historia, los contactos, las cuentas y los datos de los adjuntos ya están en la base propia; faltan las conversaciones completas y los propios archivos adjuntos.
Tanda
Qué hace
Depende de
1G-01 Conversaciones
Trae los comentarios internos y los hilos de correo de todos los tickets (unos 986 desde 2021) y comprueba, contra los recuentos de Zoho, que ningún ticket se queda sin los suyos.
—
1G-02 Adjuntos
Descarga los archivos adjuntos al almacenamiento propio. La aplicación los sirve desde allí y solo los pide a Zoho si faltan, dejando registro de cada caso para saber qué queda por traer.
Medida M1
1G-03 Verificación de completitud
Compara entidad por entidad lo que hay en Zoho con lo que hay en la base propia: tickets, conversaciones, adjuntos (cantidad y tamaño), historia, contactos y cuentas. Es la prueba de que se puede prescindir de Zoho Desk.
1G-01 y 1G-02
1G-04 Modo sin Zoho
Un interruptor que apaga toda llamada a Zoho Desk y deja la aplicación funcionando solo contra la base propia. Antes de dar de baja las licencias, la aplicación funciona una semana así con Zoho todavía contratado: es la forma de descubrir la llamada a Zoho que nadie recordaba.
1G-03
Épica 1H — Correo propio. Objetivo: recibir y responder el correo de los clientes sin Zoho.
Tanda
Qué hace
Depende de
1H-00 Decisiones de transporte
Confirma la Gmail API sobre el buzón de Workspace, la dirección exacta del buzón, la identidad y la firma, y la verificación de la autenticación del correo (DKIM, SPF y DMARC).
Medida M2
1H-01 Salida
Responde al cliente desde el ticket, en el hilo correcto, con adjuntos, y guarda la conversación en el ticket. Sustituye a la respuesta por Zoho.
1H-00
1H-02 Entrada
Lleva el correo entrante al ticket: lo empareja con un ticket existente o crea uno nuevo, evita duplicados y no entra en bucle con respuestas automáticas ni rebotes. Si la medida M2 confirma que los tickets se crean a mano, se reduce a capturar las respuestas del cliente y engancharlas a su ticket.
1H-00 y medida M2
1H-03 Corte del buzón
Pasa la recepción de Zoho a Gmail, con un periodo en que ambos reciben y se comparan.
1H-01 y 1H-02
Medidas previas. El tamaño de 1G y 1H lo fijan tres medidas que no necesitan desarrollo y son la primera tarea de persona del plan (ver §3.5): M1, cuánto pesan los adjuntos de Zoho (decide dónde se guardan); M2, cómo nacen de verdad los tickets, a mano o por correo entrante (puede reducir 1H-02); y M3, qué se usa de Zoho Desk que no esté en Desk 2.0 (vistas, plantillas, macros, etiquetas, informes, SLA propio). A 01/10/2026 siguen pendientes (Anexo D).
[ABIERTO — R08.4] Lo que hoy depende de la sincronización con Zoho. Las alarmas de SLA en horas hábiles (M1.7) y el aviso de ritmo de los contratos (M4.4) se evalúan hoy en la misma pasada periódica que sincroniza con Zoho. Si esa pasada se retira con el modo sin Zoho sin moverlos antes, dejarían de evaluarse sin que nada falle ni avise. Hay que darles una pasada periódica propia antes de 1G-04. No tiene fila del plan asignada. Dueño propuesto: Gerencia (Anexo D).
M11.4 Seguridad, permisos y auditoría
[DECIDIDO 23/09 — R08.4] Permisos: el área es la base y el cargo solo restringe (c10-permisos-cargo, c10b-gerente-director; sustituye a «permisos y vistas restringidos por rol»). Cualquiera de un área ejecuta las transiciones de su área. El cargo solo restringe, con una lista corta de excepciones, y nunca amplía lo que el área no permite:
Los cargos son siete: Director Técnico, Coordinador Técnico, Técnico, Técnico de campo, Director Comercial, Coordinador Comercial y Asistente Comercial.
Excepciones construidas: «Liberación sin factura», solo el Director Comercial; crear la OVI de garantía, solo el Director Técnico; fijar la prioridad de los Top 5, solo el Director Comercial. Un administrador siempre puede.
Las transiciones que F1C-04 clasifique como Decisionales las ejecutará solo el Director o el Coordinador del área.
El nivel «propietario del registro» se decide más adelante, salvo para las salidas de emergencia de las esperas, que ejecuta la persona a cargo (ver M1.3.4).
Construido el nivel cargo (F1C-05). Detalle en M1.9.
[CONSTRUIDO — R08.4] Los permisos de cada transición se declaran en un único sitio de la aplicación, no repartidos por la interfaz, y el servidor los aplica: no basta con ocultar un botón. El cargo con el que se firma la remisión no da permisos; los da el cargo de permiso, que es de lista cerrada. [ABIERTO] Si esos dos campos de cargo del usuario deben unificarse (E-092; Anexo D).
[ABIERTO — R08.4] Qué estados ve cada área. Hoy todo el personal ve todos los tickets y solo se filtran las transiciones. Recomendación: opción (b), vista por área sin restricción (ver M1.9; Anexo D).
Tabla inmutable de auditoría para todas las transacciones críticas: cambio de estado, ajuste de inventario y, desde R03, toda acción del portal de cliente (aprobación, descarga de firmware, reserva de cita).
[R08.4] Traza. Lo que queda registrado y no se reescribe:
Toda transición guarda persona, fecha y hora, y cada traspaso entre áreas o personas guarda origen, destino, fecha y hora (ver M1.9.2).
Los cambios en los seis campos comerciales del equipo guardan persona, fecha, hora, valor anterior y valor nuevo, y se ven en la hoja de vida (ver M3.1).
Las fechas derivadas las fija el servidor, con la zona horaria fijada (F1A-07).
El histórico se marca, no se reescribe: los tickets abandonados que se cerraron como Finalizado y las liberaciones sin factura anteriores al arreglo del 09/09 llevan su marca, sin tocar lo registrado (c2-anulado, p64-historico-c1).
Gestión de usuarios externos con alcance limitado.
[R03] Aislamiento estricto por cliente: ningún usuario del portal puede alcanzar datos de equipos que no estén en su cartera. Es el requisito de seguridad más crítico del eje ③.
[DECIDIDO 24/09 — R08.4] Borrado de administrador (anexo-36-aviso). Se mantiene, pero solo para tickets sin actividad real: sin remisión, sin orden de venta y sin transiciones posteriores a su creación. Todo ticket con actividad se cierra con Anulado (ver M1.10). El borrado exige un motivo de lista cerrada (creado por error, duplicado o prueba) y, antes de borrar, escribe en un registro de borrados que nadie puede modificar ni borrar: quién, cuándo, motivo y copia completa del ticket. Los tickets traídos de Zoho no se pueden borrar. Así el borrado es compatible con la auditoría inmutable de este apartado. Cierra el punto 36.
[ABIERTO — R08.4] Rotación de secretos. Hay una recomendación técnica de rotar periódicamente las claves y credenciales de la aplicación, sin decisión de Gerencia (Anexo D).
M11.5 Infraestructura
[DECIDIDO — R08] Se trabaja únicamente con PostgreSQL en la VPS propia de Hostinger. Supabase no está en uso y no debe considerarse en el diseño (sustituye a lo decidido el 17/02 sobre mantener una sola instancia de Supabase; el registro histórico queda en el Anexo C).
[DECIDIDO] Continuar con el plan de hosting básico (Hostinger / Easy Panel) y monitorear. Si los problemas persisten, upgrade a KVM2 con 8 GB de RAM.
[TAREA] Eliminar las bases de datos de prueba innecesarias (Supabase y Qdrant).
Consumo verificado como bajo: n8n.
[DECIDIDO 17/09 y 21/09 — R08.4] Sin copia de pruebas (e013-staging-f0-04, e013b-copia-pruebas). No existe una copia de pruebas en el servidor de Hostinger y no se monta: se trabaja directamente sobre la aplicación en uso. La tanda F0-04 se dio por cerrada el 21/09 con esa pieza retirada. Gerencia acepta el coste: cualquier error, incluida la migración de tickets del 12–13/12, que no tiene copia donde ensayarse, se descubre ya delante de los usuarios. Por eso la copia previa a cada cambio se adelanta (ver el respaldo, más abajo).
Respaldo [DECIDIDO 24/09 — R08.4]
[DECIDIDO 24/09 — R08.4] (p55-backup, p55b-destino-copia). Cierra el punto 55, salvo la elección del proveedor.
Responsable: Alfonso (Gerencia). La copia es automática; el responsable recibe un aviso por correo si una copia falla y revisa cada mes el resultado de la prueba de restauración.
Alcance: la base de datos completa y todos los archivos del servidor (adjuntos, fotos, informes emitidos y firmas), guardados cifrados fuera del servidor de Hostinger. Las claves de acceso se guardan aparte, también cifradas.
Periodicidad: una copia cada noche y una copia extra antes de cada cambio que se suba a la aplicación.
Retención: las 7 últimas copias diarias, 4 semanales y 12 mensuales.
Destino: almacenamiento de objetos de un proveedor distinto de Google y de Hostinger, con credenciales propias que no se usan para trabajar y con bloqueo de borrado durante la retención. Así, ni una cuenta de Google comprometida ni un servidor comprometido pueden destruir las copias.
Google Drive: el respaldo alcanza a la carpeta de documentación de servicio a la que enlaza Desk 2.0, no al resto del Drive de la empresa. Se copia al mismo destino una vez por semana, de forma incremental y con 12 meses de retención, directamente de Drive al almacenamiento, sin pasar por el disco del servidor.
Prueba de restauración mensual: se restaura una copia en una base aparte, se comprueba que los tickets coinciden y se recupera un documento de la carpeta de Drive. El resultado queda anotado en el parte.
Calendario: como se trabaja directamente sobre la aplicación en uso, la copia nocturna y la previa a cada cambio se ponen en marcha ya, sin esperar a diciembre. El resto de la tanda de respaldo (F1F-02) entra antes del corte del 14/12.
[ABIERTO] Proveedor del almacenamiento: Backblaze B2, Cloudflare R2 o Amazon S3. Recomendación: Backblaze B2. Sin destino, la copia no puede arrancar. Dueño: Gerencia (Anexo D).
Tensión que abre la capa RAG [ABIERTO — R03]. La decisión del 17/02 fue eliminar Qdrant y mantener una sola instancia con 2 GB. La capa de conocimiento de M12 necesita un almacén vectorial si se elige la vía RAG clásica, y la opción coherente con las decisiones tomadas sería pgvector sobre el PostgreSQL propio, sin servicio ni instancia nuevos, verificando antes que la memoria lo soporta. [R08] Antes de elegir el almacén hay que elegir la vía (punto 51, que sustituye al 27; ver M12.3).
M11.6 Herramientas de desarrollo y prototipado
Google Stitch (beta, con capacidades MCP y Antigravity) — genera rápidamente interfaces móvil, tablet y escritorio.
Claude — usado para auditar el código del blueprint actual, mapear el diagrama de flujo completo y detectar cuellos de botella y fallos de lógica. [DECIDIDO] Se adopta como herramienta de auditoría y mejora continua. [R08.4] Hoy cumple dos papeles: Claude Code construye la aplicación por tandas, y una supervisión con Claude recoge el panel de Gerencia, mide el avance y prepara los partes y los expedientes de cambios del maestro.
Gemini — usado para documentar lo decidido y en los estudios de mercado.
Restricción crítica registrada. Para que estas herramientas funcionen correctamente es estrictamente necesario tener las bases de datos —de diagnósticos, flujos y usuarios— perfectamente estructuradas de antemano. El éxito de todo lo anterior depende de esto.
La auditoría de blueprints, en concreto. La lectura del código del flujo con IA —adoptada como herramienta de mejora continua el 20/08— es la que produjo la revisión R04 de este documento: detectó los cuatro estados sin salida, el ciclo reentrante, la ausencia de anulación y la guarda que no bloquea. Conviene repetirla en cada hito del desarrollo. [R08.4] La primera auditoría tras las correcciones se hizo el 09/09/2026 (F1A-05), sobre C1, C11 y C9; sus hallazgos están en el Anexo D. La extensión a los tres flujos —servicio técnico, equipo nuevo y soporte remoto— es la tanda F1B-09, sin empezar. El mapa del blueprint se genera desde la definición de transiciones de la propia aplicación y una prueba vigila que no se desfase (R08.2); verlo dentro de la aplicación va después del corte.
Método de trabajo de la construcción [R08.4]
[R08.4] Cómo se construye y se controla Desk 2.0 a 01/10/2026:
Modo producción. La aplicación ya está en uso. Claude Code encadena las tandas del plan y solo se detiene en los cinco casos previstos.
Desarrollo guiado por especificaciones (SDD, con OpenSpec). Cada cambio lleva una ficha con su propuesta, su diseño y sus tareas, y realiza el contenido de una fila del plan. Cada cambio lleva un único identificador de tanda, o se declara «fuera del plan» con su motivo: no existe «cuenta en parte» (e001-por-entregar). Si un cambio toca las especificaciones, lleva ficha; si no, puede ir directo y el barrido lo lista (trabajo-sin-ficha). Ningún intento supera las 800 líneas; el que las supere se parte (ledger-ficheros-nuevos).
Engram. Memoria persistente donde cada decisión de Gerencia queda con su clave, para que la construcción la cargue antes de tocar lo que esa decisión afecta.
Panel de supervisión. Es el canal de entrada de Gerencia: el apartado 06 recoge preguntas y decisiones, y el 07 ideas, reglas y correcciones. Una tarea programada, los lunes y jueves, lo recoge y registra cada respuesta en el registro de decisiones de Gerencia del repositorio, con el pasaje del maestro que modifica y la revisión en la que entra (ver §1.11).
Barrido de reconciliación. Esa misma tarea compara el plan, el código y las decisiones, y publica el parte con los desvíos: tandas sin cerrar, cambios sin ficha y decisiones pendientes de entrar al maestro con su antigüedad. Ninguna decisión puede llevar más de un mes pendiente (anexo-61-incorporacion). El Anexo H se genera desde este barrido (p62-capa-as-built). La tanda F0-06 añadirá dos vigilancias automáticas, cambios sin ficha y decisiones sin llegar al maestro, después del corte.
M11.7 Deuda técnica registrada
[R08.4] El repositorio mantiene un registro de la deuda técnica conocida. La R04 incorporó al documento maestro el único punto de ese registro con efecto funcional visible:
Ref.
Descripción
Efecto
Arreglo
M-2
Al preparar una transición, la casilla de verificación se procesaba antes de comprobar si el campo era obligatorio.
Una casilla obligatoria sin marcar se guardaba como «no» y la transición se ejecutaba. Afectaba a «Liberación del ticket sin facturar».
Cerrado en F1A-01 el 09/09/2026. La comprobación de obligatorio va primero, y una casilla obligatoria solo se acepta si llega marcada: una casilla desmarcada llega como «no», no como vacía. Las liberaciones registradas antes del arreglo se marcan, no se reescriben (ver M1.3.5).
[R08.4] Otros dos puntos del mismo registro se cierran con la repatriación del histórico: los adjuntos que solo viven en Zoho (1G-02) y las conversaciones sin traer (1G-01). Ver M11.3.
M12. Conocimiento, formación y capa RAG
Módulo incorporado en la R02 a partir de las decisiones del 21/08/2026 y ampliado en la R03 con la arquitectura de conocimiento del esquema de ejes de valor.
Responde a un problema que no es de software sino de organización: el conocimiento técnico —«el cómo»— vive en las cabezas de personas concretas, lo que crea dependencia y genera consultas repetitivas tanto de clientes como de personal nuevo. Es también el destino del cambio de rol acordado: el equipo técnico deja de programar herramientas para convertirse en generador de conocimiento y estructurador de procesos.
[R08.4] Dónde encaja en el plan. La producción de contenido (M12.1) no es desarrollo y corre en paralelo desde 2026. En el plan de fases, la capa de conocimiento, el copiloto interno, la KB Externa publicada y la distribución de firmware van en la Fase 4, y el agente conversacional del cliente en la Fase 5. Ningún desarrollo de este módulo entra antes del corte del 14/12/2026.
M12.1 Producción de contenido formativo
[DECIDIDO] Documentar el conocimiento técnico en formatos digitales, priorizando el vídeo.
Vídeos cortos y específicos, de alcance muy acotado — el ejemplo citado es «cómo hacer una prueba de fuga en un Grimm». No manuales audiovisuales largos, sino piezas de un procedimiento concreto.
El laboratorio se usa como set de grabación, aprovechando el espacio y los equipos reales.
[PROPUESTO] Definir un plan de trabajo semanal de grabación —se propone el viernes por la tarde— y empezar por estructurar un índice de temas.
[TAREA] Armar el setup de grabación en el laboratorio y grabar el primer vídeo piloto.
Alcance doble: procedimientos internos (KBI) y externos (KB Externa).
[R08.4] Todo instructivo o procedimiento escrito que se publique, interno o externo, usa el formato único Technical Note (TN) (ver M12.6 y M9.3).
Criterio de clasificación en origen. Cada pieza que se produce se etiqueta desde el principio como interna, externa o ambas. Reclasificar después es costoso y propenso a errores; decidirlo al grabar cuesta un campo en el índice de temas. [R08.4] El mismo criterio vale para las Technical Notes: la audiencia se marca al crearlas.
M12.2 Las dos bases de conocimiento [DECIDIDO 21/08]
La capa de conocimiento se divide en dos bases con audiencias distintas. No es un mismo repositorio con permisos: son contenidos, responsabilidades y ciclos de vida diferentes.
KBI — Knowledge Base Interna
KB Externa
Audiencia
Técnicos y personal de Ambientalia
Clientes
Contenido
Manuales completos de fabricante, troubleshooting profundo, procedimientos de reparación, histórico de casos, notas internas
Guías de operación, mantenimiento básico, PDFs y notas técnicas divulgativas, vídeos formativos
Manuales de fabricante
Sí
Sí
Formato de los procedimientos [R08.4]
Technical Note
Technical Note
Consume
Copiloto de diagnóstico (M2.6), mini-apps (M10.4)
Biblioteca del portal (M8.4), agente conversacional (M12.5)
Control documental
Interno
Documentación controlada bajo ISO 9001 (M9.3)
Responsable
Dirección Técnica
Dirección Técnica + Comercial (qué se publica y a qué nivel)
Los manuales de fabricante están en ambas. Es una decisión tomada, no un descuido: el cliente tiene derecho a la documentación del equipo que compró. Lo que no cruza a la KB Externa es el conocimiento propio de Ambientalia —troubleshooting acumulado, procedimientos de reparación, histórico de casos de otros clientes—, que es precisamente el activo diferencial.
M12.3 Arquitectura de la capa RAG
Alternativas al RAG clásico [R08]
El revisor pide explorar dos vías distintas de la arquitectura RAG con almacén vectorial:
Vía
En qué consiste
Qué habría que comprobar
«LLM wiki» al estilo Karpathy, sobre Obsidian
La base de conocimiento se mantiene como una wiki de notas enlazadas, y el modelo la recorre como texto estructurado en vez de recuperar fragmentos por similitud.
Si el volumen de la KBI cabe en contexto sin recuperación, y si el equipo técnico mantiene mejor notas enlazadas que documentos sueltos —que para M12.1 no es un detalle menor: lo que no se mantiene, no sirve.
MCP contra NotebookLM o contra los notebooks propios
En lugar de construir el almacén vectorial, se consulta por MCP una herramienta que ya resuelve la recuperación.
Dónde quedan alojados los documentos, si eso es compatible con la gobernanza documental de M12.6, y qué pasa con la separación estricta entre KBI y KB Externa, que es un requisito y no una preferencia.
Cómo conviene decidirlo. No por comparación teórica, sino con un prototipo sobre un caso real —el troubleshooting de un modelo concreto— midiendo tres cosas: si la respuesta cita su fuente, si el equipo puede mantener el contenido sin ayuda, y si la separación entre las dos bases se sostiene. Punto abierto nº 51, que sustituye al nº 27 sobre el almacén vectorial: mientras la vía no esté decidida, elegir pgvector es prematuro.
RAG —Retrieval Augmented Generation— es el patrón que permite que un modelo de lenguaje responda sobre documentación propia en lugar de sobre su conocimiento general: la consulta recupera primero los fragmentos relevantes de la base documental, y sólo después se genera la respuesta a partir de ellos. Es lo que hace que la respuesta sea trazable a un documento concreto.
Componentes:
Componente
Función
Estado
Ingesta
Convierte PDFs, manuales, notas y transcripciones de vídeo en fragmentos indexables
Por construir
Almacén vectorial
Guarda los fragmentos y permite la búsqueda por similitud
[ABIERTO] Depende de la vía elegida (punto 51); si es RAG clásico, pgvector sobre PostgreSQL (M11.5)
Recuperación
Selecciona los fragmentos relevantes para cada consulta, filtrando por base (KBI/KB Externa) y por permisos
Por construir
Generación
Redacta la respuesta citando el documento y la versión de origen
Por construir
Trazabilidad
Registra qué se preguntó, qué fragmentos se recuperaron y qué se respondió
Por construir
Reglas de diseño:
1. Separación estricta por base. Una consulta de un cliente nunca puede recuperar fragmentos de la KBI. El filtro se aplica en la recuperación, no en la respuesta.
2. Toda respuesta cita su fuente, con documento y versión. Sin cita verificable, la respuesta no se emite.
3. La transcripción de los vídeos se indexa. Un vídeo que no está transcrito es invisible para la recuperación; transcribir es parte de producirlo (M12.1).
4. El RAG no calcula. No interviene en fechas, cargas, precios ni disponibilidad (principio de diseño nº 8). Si una consulta deriva hacia una cifra comprometida, se responde con el dato consultado en la base transaccional o se deriva a una persona.
M12.4 El copiloto interno (sobre la KBI)
Es la aplicación de la capa RAG al eje ①: asiste al técnico durante el diagnóstico. Ya descrito funcionalmente en M2.6; aquí queda su encaje arquitectónico.
[R08.4] Una alternativa viable es conectar el copiloto por MCP con los notebooks propios (NotebookLM) y aprovecharlos como RAG complementario. Es la segunda vía de M12.3 y se evalúa en el mismo prototipo (punto 51).
Recupera de la KBI: manuales, procedimientos, troubleshooting y casos anteriores del mismo modelo.
Se combina con el histórico del activo (M3.3) y con los puntos de control ya registrados en el ticket (M2.3).
Sugiere causas probables y qué verificar; no cierra puntos de control ni cambia estados. El técnico decide y registra.
[DECIDIDO 24/09 — R08.4] No escribe en el informe (anexo-9-comentarios). El comentario de falla lo pone el catálogo del equipo; la base de conocimiento, cuando exista, solo muestra al técnico casos parecidos como sugerencia al lado. El diagnóstico con comentarios predeterminados (F1D-04) no depende de ella.
Cada sugerencia aceptada o descartada es una señal de calidad de la base: conviene registrarla para mejorar el contenido.
M12.5 El agente conversacional del cliente (sobre la KB Externa)
[DECIDIDO 21/08] En Desk 2.0, el cliente conversa directamente con el agente, que atiende solo temas técnicos apoyándose en la KB Externa. Es una prestación del nivel completo del portal (M8.4).
Guardarraíles [DECIDIDO — R03]
«Solo temas técnicos» tiene que ser una regla del sistema, no una intención. El agente:
Responde sobre operación, mantenimiento básico, interpretación de lecturas, procedimientos publicados y documentación del equipo.
No responde sobre precios, cotizaciones, plazos de entrega, estado comercial del cliente, garantías ni condiciones contractuales.
Deriva a Comercial cuando la consulta entra en ese terreno, con un mensaje explícito y creando el registro correspondiente para que alguien responda.
No compromete nada: ninguna respuesta del agente constituye una oferta, una fecha ni una autorización.
Sólo ve los equipos del cliente que pregunta y el contenido de la KB Externa correspondiente a esos modelos.
El motivo es directo: sin este límite, la IA puede adquirir compromisos que Ambientalia no autorizó, y un cliente que lee una fecha o un precio en un chat lo trata como una promesa.
Registro y aprovechamiento
Toda conversación queda registrada y asociada al cliente y al equipo.
Las consultas que el agente no supo responder son el mejor índice de temas a grabar que existe: alimentan directamente el plan de contenido de M12.1.
Las consultas repetidas señalan un problema de producto o de documentación, no sólo de soporte.
El registro alimenta el indicador de valoración del cliente (M7.4) y el KPI de consultas resueltas sin persona (M7.7).
M12.6 Gobernanza documental
Lo que se publica en la KB Externa es documentación controlada (M9.3). Requisitos:
Versión y fecha visibles en cada pieza publicada.
Aprobación técnica antes de publicar, con responsable identificado.
Histórico de versiones: poder responder qué instrucción tenía el cliente en una fecha dada.
Retirada controlada del contenido obsoleto, con aviso a los clientes que lo hayan consultado si el cambio es relevante para la seguridad o la garantía.
La misma pieza puede tener versión interna y versión publicada con distinto nivel de detalle; ambas se versionan por separado.
[R08.4] Formato único: Technical Note (TN). Todo instructivo o procedimiento que se publique, en la KB Externa o en la KBI, usa una sola plantilla con nombre transversal, «Technical Note» (ver M8.4 y M9.3). Cada TN lleva:
Identificación: código único (por ejemplo, TN-marca-número), título, versión, fecha de publicación y responsable de la aprobación.
A qué equipo va dirigida: marca, modelo o familia y, si aplica, versión de firmware.
Contenido: objetivo de la acción, precauciones de seguridad, herramientas o materiales, paso a paso numerado, cómo verificar que quedó bien y documentos de referencia (manual del fabricante, otras TN).
Audiencia: interna, externa o ambas, marcada desde que se crea, como ya está decidido para los vídeos.
Los requisitos de esta lista se cumplen sobre la TN: cada cambio publica una versión nueva y la anterior queda en el histórico. La responsabilidad sobre la garantía cuando el cliente ejecuta un procedimiento publicado sigue abierta (punto 26).
M12.7 Distribución de firmware y software
[DECIDIDO 21/08] Ambientalia tiene derecho a redistribuir el firmware y el software de los fabricantes únicamente a clientes registrados.
Disponible en el nivel completo del portal (M8.4).
Exige cuenta registrada, no token — es la razón técnica del modelo de identidad escalonado de M8.5.
Registro obligatorio de cada descarga: cliente, usuario, equipo, serial, versión descargada y fecha.
Ese registro tiene doble uso: trazabilidad —saber qué versión corre cada equipo en campo— y dato comercial —identificar equipos desactualizados y convertirlos en campaña de actualización.
[ABIERTO] Confirmar qué marcas cubre el derecho de redistribución y cómo se acredita al cliente registrado — Anexo D, punto 30.
M12.8 Conexión con el resto del sistema
El contenido grabado es la materia prima de la digitalización de procedimientos en checklists interactivos (M2.6) y de las mini-apps de troubleshooting (M10.4).
Reduce la carga de consultas repetitivas y, con ella, el ruido en el flujo de soporte remoto (M1.5).
Documentar «el cómo» es la condición previa para que el copiloto tenga una base sobre la que responder: sin KBI no hay copiloto, y sin KB Externa no hay nivel completo del portal.
Es, por tanto, el módulo que sostiene el eje ③ por dentro. Empezar a grabar ahora —aunque el portal no exista hasta 2027— es lo que hace que el portal tenga algo que ofrecer cuando llegue.
3. Backlog priorizado y roadmap
[R08.4] Este capítulo es el plan de desarrollo definitivo de Desk 2.0. Sustituye al backlog del MVP que la R08 dejó en revisión: desde esta revisión, el orden de construcción lo fija el plan de fases y tandas (revisión R01.3, 24/09/2026) con las correcciones de Gerencia del 30/09 y el 01/10. Lo vigente está en §3.1 a §3.6; la numeración antigua de ítems (1–76) y de correcciones (C1–C12) se conserva en §3.7 solo como referencia, para que las citas cruzadas sigan encontrando dónde quedó cada cosa.
3.1 Criterios
[DECIDIDO 24/09/2026 — R08.4] El plan se ordena por tres tramos de tiempo, en este orden de peso:
Paridad con Zoho Desk antes del corte operativo del 14/12/2026. Antes del corte entra solo lo necesario para no perder nada de lo que Zoho ya daba: F0 (salvo F0-06), 1A, 1B, 1F y, de 1C, la restricción de «Liberación sin factura» por cargo, que Zoho tenía y Desk 2.0 no puede perder.
Independencia total en enero de 2027. Repatriación del histórico (épica 1G) y correo propio (épica 1H). Cuando las dos estén verificadas se deja de consultar Zoho y se dan de baja las licencias.
Lo que Zoho no tiene, después del corte. Las otras siete correcciones de 1C, el diagnóstico con checklist (1D), el módulo de informes (1E), F0-06 y el mapa del blueprint dentro de la aplicación. Van después del corte y sin fecha fija; el módulo de informes, en 2027.
[R08.4] Dentro de cada tramo siguen valiendo los criterios de valor de las revisiones anteriores: primero lo que ataca el incumplimiento de la fecha comprometida; después lo que garantiza la integridad del dato; la cadena de ejes (① antes que ②, ② antes que ③); y, a igualdad de valor, lo de menor esfuerzo. Las correcciones de lo ya construido van por delante de la funcionalidad nueva, porque reparan lo que todo lo demás hereda.
[R08.4] Unidad de avance. Una tanda es un cambio que realiza el contenido de una fila del plan. Cada cambio lleva un único ID de tanda, o la marca «fuera del plan» con su motivo; no existe «cuenta en parte» (decisión e001-por-entregar, 24/09). Una fila puede necesitar varios cambios y solo se cierra cuando el último lo declara. El denominador del avance es el número de filas del plan: 66 en la R01.3.
[R08.4] Tallas. Son estimaciones de Gerencia, no medidas: XS, menos de medio día; S, un día; M, dos o tres días; L, cuatro o cinco días. Una L que no quepa en tres días se parte en dos cambios. Para la cuenta del margen (§3.5) se convierten en XS ≈ 0,5 días, S ≈ 1, M ≈ 2,5 y L ≈ 4,5, con semanas de cinco días.
[R08.4] Modo producción. La aplicación ya está en uso (Desk_2_R1.023) y no hay copia de pruebas en el servidor (retirada el 21/09). Claude Code encadena tandas y solo se detiene en los cinco casos previstos. Las decisiones de Gerencia entran por el panel de supervisión y se registran antes de que una tanda las aplique.
3.2 Fases y épicas
[R08.4] Estado a 01/10/2026, medido sobre el repositorio y el parte de esa fecha. «Parcial» significa que la fila tiene cambios archivados pero no se ha cerrado.
Fase o épica
Filas
Objetivo
Cuándo
Estado a 01/10/2026
Fase 0 · Cimientos SDD
F0-00 a F0-06
Auditoría del as-built, specs de lo construido, memoria del proyecto, pruebas y CI, mecanismo de reconciliación y sus vigilancias
Antes del corte (F0-06, después)
6 de 7 cerradas; F0-06 sin empezar
1A · Correcciones inmediatas
F1A-01 a F1A-09
Correcciones y desvíos sin decisión pendiente: guardas, SLA de Notificado, bodegajes, fechas del servidor, OV, Verificación
Antes del corte
7 de 9 cerradas; F1A-03 en curso; F1A-09 sin empezar
1B · Paridad y recepción
F1B-01 a F1B-14
Replicar lo que hace Zoho Desk con blueprints controlados: serial, hoja de vida, recepción, permisos, flujos de equipo nuevo y soporte remoto, prioridad, tablero, OV y contratos, calendario laboral
Antes del corte
6 de 14 cerradas; 4 parciales o en curso; 4 sin empezar
1C · Correcciones del blueprint (C1–C12)
F1C-01 a F1C-08
Las correcciones que cambian el proceso: Anulado, dos ramas de facturación, salidas de las esperas, tipo de evento, permisos por cargo, reloj del SLA, Control de calidad, rutas abreviadas
Nivel cargo de F1C-05, antes del corte; las otras siete, después del corte
F1C-05 parcial (nivel cargo construido); 7 sin empezar
1D · Diagnóstico con checklist
F1D-01 a F1D-09
Diagnóstico protocolizado: motor único y catálogo de cada equipo cargado como datos
Después del corte
0 de 9
1E · Informes
F1E-01 a F1E-05
Informe de diagnóstico y de salida derivados del checklist, con validación por tres firmas
Después del corte (2027)
0 de 5
1F · Corte
F1F-01 a F1F-05
Migración de tickets abiertos, respaldo, pruebas con servicios reales, formación y continuidad de indicadores
Antes del corte
0 de 5
1G · Repatriación del histórico
1G-01 a 1G-04
Que ninguna pantalla necesite llamar a Zoho para mostrar el pasado
Enero de 2027
0 de 4
1H · Correo propio
1H-00 a 1H-03
Recibir y responder correo de clientes sin Zoho (Gmail API sobre el buzón de Workspace)
Enero de 2027
0 de 4
Mapa del blueprint en la aplicación
sin ID asignado
El diagrama de estados y transiciones, generado desde el código, visible en Configuración
Después del corte
Sin empezar
[R08.4] Totales. 66 filas: 35 antes del corte, 8 en enero de 2027 (1G y 1H) y 23 después del corte sin fecha (1C salvo F1C-05, 1D, 1E, F0-06 y el mapa). A 01/10/2026 la tabla de §3.3 da 19 cerradas, 6 parciales o en curso y 41 sin empezar. Todas las cerradas son de antes del corte: el avance es 19/66 (29 %) sobre el proyecto y 19/35 (54 %) sobre lo que entra antes del corte. El barrido de reconciliación del 01/10 deriva 18 (12 por cabecera y 6 nombradas por commit); la diferencia de una fila está por conciliar en el Anexo H.
3.3 Catálogo de tandas
[R08.4] Una fila por tanda, con su contenido vigente a 01/10/2026. El contenido recoge las decisiones posteriores al catálogo de la R01.1 (filas nuevas de la R01.3, épicas 1G y 1H, y precisiones del 17/09 al 01/10). La talla es la del plan; «—» indica que el plan no la fija.
Fase 0 · Cimientos SDD
ID
Contenido
Talla
Cuándo
Estado a 01/10/2026
F0-00
Auditoría del as-built en seis frentes, con veredicto conservar, refactorizar o rehacer
M
Antes del corte
Cerrada
F0-01
Arranque de SDD: configuración, reglas invariables y copia citable del maestro
S
Antes del corte
Cerrada
F0-02
Specs de lo construido, tal como está
L
Antes del corte
Cerrada
F0-03
Memoria del proyecto (Engram) con las decisiones cerradas
S
Antes del corte
Cerrada
F0-04
Pruebas del motor de transiciones y CI; la copia de pruebas en el servidor se retira (21/09)
M
Antes del corte
Cerrada sin la copia de pruebas
F0-05
Mecanismo de reconciliación y bandeja de entrada (barrido de lunes y jueves)
—
Antes del corte
Cerrada
F0-06
Vigilancias del repaso automático: commits sin ficha y decisiones que no han llegado al maestro
S
Después del corte
Sin empezar
Épica 1A · Correcciones inmediatas
ID
Contenido
Talla
Cuándo
Estado a 01/10/2026
F1A-01
C1: guarda del checkbox obligatorio
XS
Antes del corte
Cerrada
F1A-02
C11: SLA sobre Notificado, con escalado
S
Antes del corte
Cerrada
F1A-03
C12: salidas de Verificación en equipo nuevo; guarda por tipo de equipo con gas patrón vigente; número del certificado de fábrica en la Liberación
S
Antes del corte
En curso (desbloqueada el 28/09)
F1A-04
C9, parte técnica: los tres bodegajes sobre el historial de transiciones
S
Antes del corte
Cerrada
F1A-05
Auditoría del blueprint tras las correcciones de 1A
S
Antes del corte
Cerrada
F1A-06
Generador del mapa del blueprint desde el código, con prueba anti-desfase
—
Antes del corte
Cerrada
F1A-07
Fechas derivadas impuestas por el servidor, con zona horaria fijada
S
Antes del corte
Cerrada
F1A-08
Tercera puerta de la asociación OV ↔ ticket
S
Antes del corte
Cerrada
F1A-09
Barrido de citas tras la R08.2: regenerar la copia citable del maestro y actualizar las citas
S
Antes del corte
Sin empezar (dos semanas de retraso sobre su semana prevista)
Épica 1B · Paridad y recepción
ID
Contenido
Talla
Cuándo
Estado a 01/10/2026
F1B-01
Código de ticket derivado del serial, serial obligatorio en la remisión y autocompletado por serial
M
Antes del corte
Cerrada
F1B-02
Hoja de vida: fecha de adquisición, fecha de factura, fin de garantía, código interno del cliente, enlace a Drive y mantenedor
M
Antes del corte
Cerrada
F1B-03
Tipo de servicio que oculta pasos; OV obligatoria para Habilitar Servicio y no para recibir; guarda de remisión vigente; OVI de garantía por el Director Técnico; supresión de prefijos en tickets nuevos (30/09)
L
Antes del corte
Sin empezar
F1B-04
Recepción unificada: remisión, accesorios por lista cerrada, novedades de entrada, «Rotulado y guardado», fotos de entrada y salida
L
Antes del corte
Parcial («foto solo con novedad» construida, a corregir el 01/10)
F1B-05
Permisos y vistas por área, traspaso formal entre agentes, checkbox «Cumple condiciones comerciales», trazas completas
M
Antes del corte
Sin empezar (visibilidad por área abierta)
F1B-06
Blueprints de equipo nuevo (6 transiciones) y soporte remoto (4)
L
Antes del corte
Cerrada
F1B-07
Prioridad en el cliente (contrato y Top 5), ajuste con motivo, orden de la cola en el servidor
S
Antes del corte
En curso
F1B-08
Tablero, alarmas en horas hábiles y vistas de listado y ficha equivalentes a Zoho
L
Antes del corte
Parcial (tablero y alarmas construidos; faltan las vistas equivalentes a Zoho)
F1B-09
Auditoría del blueprint de los tres flujos
S
Antes del corte
Sin empezar
F1B-10
Orden único de precedencia entre guardas
M
Antes del corte
Cerrada
F1B-11
Asociación OV ↔ ticket (1 : N), subOV de lote, registro de contrato y ampliación de contrato
L
Antes del corte
Parcial (tres cambios construidos; falta la ampliación de contrato)
F1B-12
Calendario laboral: jornada L-V 8–17, festivos de Colombia, cierres de empresa y función única de horas y días hábiles
S
Antes del corte
Cerrada
F1B-13
Ficha de reclamación de garantía al proveedor, vinculada al ticket y a la OVI de garantía (ID propuesto en la R01.2)
pequeña
Antes del corte
Sin empezar
F1B-14
Alta y edición del equipo: alta en el mismo paso del ticket de equipo nuevo y edición de los seis campos con historial
S–M
Antes del corte
Cerrada
Épica 1C · Correcciones del blueprint
ID
Contenido
Talla
Cuándo
Estado a 01/10/2026
F1C-01
C2: estado Anulado con cinco motivos; histórico marcado, no reescrito; fuera de las tres métricas
S–M
Después del corte
Sin empezar
F1C-02
C4: dos ramas sin ciclo facturar↔entregar; Pendiente de facturar; «Facturar» a Finalizado; fecha de remisión de salida escrita una vez; alarma de la fecha prevista de facturación
S–M
Después del corte, tras la medida M3
Sin empezar
F1C-03
C3: salidas de las esperas; caducidad que notifica y sugiere, nunca ejecuta
S–M
Después del corte
Sin empezar
F1C-04
C5: tipo de evento (Operativo, Decisional, Compras/Logístico, Administrativo) en cada transición
S–M
Después del corte
Sin empezar
F1C-05
C10: permisos por cargo (siete cargos, el área como base) y, más adelante, por propietario del registro
S–M
Nivel cargo, antes del corte; propietario del registro, después
Parcial (nivel cargo construido; falta el propietario del registro)
F1C-06
C7 + C9: reloj del SLA con su propia lista de esperas; bodegajes como tiempo a descontar
S–M
Después del corte
Sin empezar
F1C-07
C6: estado Control de calidad entre En Proceso y Por Facturar, con retrabajo medido y firma del Coordinador Técnico
S–M
Después del corte
Sin empezar
F1C-08
Rutas abreviadas: calibración directa en lo que F1B-03 no cubra; el equipo sin novedad no tiene ruta abreviada
S–M
Después del corte
Sin empezar
Épica 1D · Diagnóstico con checklist
ID
Contenido
Talla
Cuándo
Estado a 01/10/2026
F1D-01
Modelo de datos del catálogo: fase, N1, N2, ítem; criterio de falla con dos atributos (Cobro y Liberación); valores «como se encontró» y «como se dejó»
M
Después del corte
Sin empezar
F1D-02
Importador del catálogo desde Excel (Grimm EDM180 v1.8, Horiba v1.4), con informe de filas rechazadas
M
Después del corte
Sin empezar
F1D-03
Transiciones generadas desde los N1 del catálogo de cada marca (Grimm 8, Horiba 10)
M
Después del corte
Sin empezar
F1D-04
Captura por visita y validación por macro; comentarios predeterminados del catálogo con nota libre aparte
L
Después del corte
Sin empezar
F1D-05
Encadenamiento No OK: ítems relacionados y acción sugerida
M
Después del corte
Sin empezar
F1D-06
Criterio de falla en acción; repuestos por etapa; repuestos adelantados en tres casos
M
Después del corte
Sin empezar
F1D-07
Formulario de falla nueva, obligatorio y corto, con aviso al Director Técnico
S
Después del corte
Sin empezar
F1D-08
Segundo equipo: Horiba AP-370 completo
S
Después del corte
Sin empezar
F1D-09
Auditoría de la épica 1D
S
Después del corte
Sin empezar
Épica 1E · Informes
ID
Contenido
Talla
Cuándo
Estado a 01/10/2026
F1E-01
Modelo del informe sobre las remisiones de la aplicación; edición de la tabla de repuestos por Comercial/Compras (SKU)
M
2027
Sin empezar
F1E-02
Informe de diagnóstico generado desde el ticket y el checklist
M
2027
Sin empezar
F1E-03
Informe de salida con motivos tipificados
M
2027
Sin empezar
F1E-04
Validación con tres firmas (Elaboró, Revisó, Aprobó); informe aprobado inmutable
M
2027
Sin empezar
F1E-05
Flujo de construcción del informe documentado en el maestro
doc
2027
Sin empezar
Épica 1F · Corte
ID
Contenido
Talla
Cuándo
Estado a 01/10/2026
F1F-01
Migración de los tickets abiertos de Zoho al estado equivalente, el fin de semana 12–13/12
M
Antes del corte
Sin empezar
F1F-02
Respaldo y continuidad: copia nocturna y previa a cada cambio, cifrada fuera de Hostinger, y prueba mensual de restauración
M
Antes del corte (la copia nocturna, ya)
Sin empezar (falta elegir el proveedor)
F1F-03
Pruebas de aceptación con dos o tres servicios reales
—
Antes del corte
Sin empezar
F1F-04
Formación breve, Zoho Desk a solo lectura y auditoría final
—
Antes del corte
Sin empezar
F1F-05
Continuidad de los nueve indicadores, calculados en paralelo con Zoho; la encuesta automática pasa a 1H
S–M
Antes del corte
Sin empezar
Épicas 1G y 1H · Independencia de Zoho
ID
Contenido
Talla
Cuándo
Estado a 01/10/2026
1G-01
Recuperación completa de conversaciones de los 986 tickets, verificada contra los recuentos de Zoho
M
Enero de 2027
Sin empezar
1G-02
Persistencia de adjuntos en el destino que decida la medida M1
M
Enero de 2027
Sin empezar
1G-03
Verificación de completitud entidad por entidad, repetida el día del corte
M
Enero de 2027
Sin empezar
1G-04
Modo sin Zoho: interruptor que apaga toda salida hacia Zoho Desk
S
Enero de 2027
Sin empezar
1H-00
Decisiones de transporte: Gmail API, identidad, firma y autenticación del dominio
S
Enero de 2027
Sin empezar
1H-01
Salida: responder al cliente desde el ticket con hilo correcto
L
Enero de 2027
Sin empezar
1H-02
Entrada: correo → ticket, con emparejamiento de hilos, deduplicación y anti-bucle
L (M si M2 sale favorable)
Enero de 2027
Sin empezar
1H-03
Corte del buzón, con periodo de solape
M
Enero de 2027
Sin empezar
Fila sin épica
ID
Contenido
Talla
Cuándo
Estado a 01/10/2026
sin ID
Mapa del blueprint en la aplicación: diagrama completo y una vista por fase, en Configuración
XS–S, por medir
Después del corte (sustituye a «antes de F1B-06»)
Sin empezar
3.4 Trabajo nuevo decidido el 30/09 y el 01/10, y dónde encaja
[R08.4] Las correcciones e ideas de Gerencia del 30/09 y del 01/10 traen trabajo con fecha («antes del corte» o «después del corte») que en su mayoría no tiene fila en el plan. La tabla dice el momento, que es lo decidido, y la fila. Cuando la fila no está fijada se marca «propuesta de asignación, pendiente de confirmar fila», con una recomendación. La asignación definitiva es un punto abierto del Anexo D.
[R08.4] Recomendación general: las piezas de antes del corte entran como cambios dentro de F1B-03, F1B-04 o F1B-08 según su tema, o como una fila nueva pequeña; las de después del corte, en su épica. Si se abren filas nuevas, el denominador sube y la cuenta del margen (§3.5) debe rehacerse.
Antes del corte
Pieza
Origen
Fila
Supresión de prefijos en tickets nuevos; los existentes conservan el suyo
E-094, 30/09
F1B-03
Accesorios con nombre oficial y número de parte desde el catálogo de artículos de Zoho Books, solo los del modelo; la foto, con el ítem 21
E-100, 30/09
F1B-04
Fotos siempre obligatorias en la remisión de entrada y en la de salida (equipo, accesorios y embalaje)
GN, 01/10
F1B-04 (ajusta lo construido)
Orden de la cola por la hora de «Habilitar Servicio» dentro de cada prioridad; lista de Remisión creada por antigüedad
E-099, 30/09
F1B-07 (en curso)
«Liberación sin factura»: motivo de lista cerrada y fecha prevista de facturación (el nivel cargo ya está construido)
E-102, 30/09
1C de paridad: propuesta de asignación, pendiente de confirmar fila (recomendación: F1C-05)
Remisiones sin ticket: menú «Remisiones», motivo de lista cerrada, numeración común, enlace entrada↔salida y lista de lo que no ha vuelto
E-104, 30/09
Propuesta de asignación, pendiente de confirmar fila (recomendación: fila nueva en 1B, porque es una capacidad nueva)
Aviso «En garantía» calculado, y «Garantía sin dato»
E-105, 30/09
Propuesta de asignación, pendiente de confirmar fila (recomendación: con la ficha de garantía, F1B-13)
Remisión de salida creada desde la transición de entrega, con los accesorios de entrada, y guarda «sin remisión de salida vigente no se entrega»
GN, 01/10
Propuesta de asignación, pendiente de confirmar fila (recomendación: F1B-04)
Alta manual de equipo y cliente desconocidos, con validación de Comercial antes de Habilitar Servicio
GN, 01/10
Propuesta de asignación, pendiente de confirmar fila (recomendación: F1B-04)
Búsqueda por número de ticket y por serial (parcial) en el listado de tickets; si ya existe, solo se confirma
GN, 01/10
Propuesta de asignación, pendiente de confirmar fila (recomendación: F1B-08)
Correcciones al blueprint de servicio técnico: se retiran «Marcar como pendiente» y las dos «Servicio externo» hacia Por Facturar; «Diagnóstico complementario» sale de En Proceso; Rechazo desde Notificación cliente solo por Comercial; derivación de «Solicitud repuestos» y «Entrega de Repuestos» al encargado de inventario y de vuelta al técnico
E-103, E-106, 30/09; GN, 01/10
Propuesta de asignación, pendiente de confirmar fila (recomendación: una fila nueva pequeña que agrupe todas las correcciones del blueprint de servicio técnico, con el mapa y las cifras de 31 transiciones y 35 pasos)
Registro del SKU por Comercial/Compras en «Notificación cliente (SKU)» y aviso al técnico
E-107, 30/09
Propuesta de asignación, pendiente de confirmar fila (recomendación: en la misma fila de correcciones del blueprint)
Después del corte
Pieza
Origen
Fila
Alarma de la fecha prevista de facturación de «Liberación sin factura», aplicada también a lo liberado desde el 14/12
E-102, 30/09
F1C-02
Salidas de emergencia de las esperas ejecutadas por la persona a cargo (o el Director o el Coordinador del área, con registro)
E-101, 30/09
Propuesta de asignación, pendiente de confirmar fila (recomendación: dentro de F1C-03)
Tiempo promesa global y su indicador de cumplimiento ante el cliente (décimo indicador)
E-095, 30/09
Propuesta de asignación, pendiente de confirmar fila (recomendación: con los indicadores de la Fase 2; el CTP parte de él)
Encuesta en tableta en la entrega, integrada en Desk 2.0; mientras tanto, formulario de Google
E-096, 30/09
Propuesta de asignación, pendiente de confirmar fila (recomendación: con la encuesta automática de 1H)
Disponibilidad por usuario (vacaciones y ausencias) sobre el calendario laboral
E-098, 30/09
Propuesta de asignación, pendiente de confirmar fila (recomendación: con M6, parámetro de carga)
Restricción de «Solicitud repuestos» y «Entrega de Repuestos» a sus dos ejecutores
GN, 01/10
F1C-05, nivel propietario del registro
Partes reemplazadas en la remisión de salida y salida automática de inventario, con descuento único de cada pieza
GN, 01/10
Propuesta de asignación, pendiente de confirmar fila (abierto cómo convive con la factura de Zoho Books)
Dos atributos del criterio de falla (Cobro y Liberación) y reclasificación de los catálogos Grimm y Horiba
GN, 01/10
F1D-01 y F1D-06
Repuestos preventivos, con evidencia obligatoria y líneas separadas en la cotización
GN, 01/10
Épica 1D: propuesta de asignación, pendiente de confirmar fila (recomendación: F1D-06)
Valores «como se encontró» y «como se dejó» para el análisis predictivo por protocolos
GN, 01/10
F1D-01 (el análisis no es desarrollo hasta tener datos)
Campos de trazabilidad para la 17025 (patrón usado, versión del procedimiento, condiciones ambientales, técnico)
R08.4, M9.2
F1D-01 y equipos propios; el resto, cuando se defina el alcance a acreditar
Hojas de vida de los equipos propios de Ambientalia, con plan de mantenimiento y calibración
GN, 01/10
Propuesta de asignación, pendiente de confirmar fila
Versión imprimible de la hoja de vida
GN, 01/10
Propuesta de asignación, pendiente de confirmar fila
Carga masiva del histórico documental de Drive a las hojas de vida (el preprocesado puede adelantarse)
GN, 01/10
Propuesta de asignación, pendiente de confirmar fila (recomendación: con la migración del histórico, ítem 49)
Historial completo descargable en el nivel completo del portal
GN, 01/10
Con el portal del cliente (Fase 3)
Technical Notes como formato único del contenido técnico publicado
GN, 01/10
Propuesta de asignación, pendiente de confirmar fila (recomendación: con la base de conocimiento externa, ítems 55 y 59)
Filtros por número de ticket y serial en el cuadro de mando
GN, 01/10
Fase 2, con el resto de filtros
Umbral del OTD por encima del 75 %, configurable
GN, 01/10
Fase 2, con los semáforos de los indicadores
Ubicación de almacén, actualizada en cada movimiento
f1b04-rotulacion, 28/09
Con las ubicaciones de M5.3
Árbol RCM: ejemplo sobre Grimm EDM180 (completo) y Horiba AP-370 (parcial)
GN, 01/10
Análisis, no desarrollo: no entra en el plan hasta que se decida adoptarlo
3.5 Calendario
Hitos
[DECIDIDO 24/09/2026 — R08.4] El corte se hace en dos tiempos: corte operativo el lunes 14/12/2026 e independencia total en enero de 2027 (sustituye a lo decidido antes el 24/09: corte en seco el 14/12, con el 21/12 como última fecha posible). Hasta que exista el correo propio, las respuestas al cliente salen del correo corporativo y se registran en el ticket; no se escribe en Zoho.
Fecha
Hito
Detalle
24/09/2026
Cuenta del margen (plan R01.3)
+1,9 a +2,2 semanas sobre la semana que exige Gerencia: el corte del 14/12 es viable y el plan A no se activa
02/10 y 09/10/2026
Recuentos contra producción
Liberaciones sin factura anteriores al arreglo de C1 (02/10) y catálogo de modelos (09/10); los ejecuta Alfonso; sin cifra registrada a 01/10
Antes del 17/10/2026
Revisión del maestro con las decisiones pendientes
Plazo de un mes fijado el 24/09
Antes del 31/10/2026
Uso de la hoja de Google de remisiones
Averiguar quién la rellena y para qué, y si las remisiones sin ticket lo cubren
Miércoles 09/12/2026
Confirmación del corte
Dos condiciones: crear y mover tickets en Desk 2.0, y pruebas con servicios reales superadas
12–13/12/2026
Migración
Los tickets abiertos de Zoho pasan a Desk 2.0 en su estado equivalente (F1F-01)
Lunes 14/12/2026
Corte operativo
Los tickets nacen en Desk 2.0; Zoho Desk queda en solo lectura; la hoja de Google de remisiones se cierra
Antes del 21/12/2026
Licencias de Zoho
Se renuevan solo 2 licencias de agente, en facturación mensual, para consultar el histórico
Enero de 2027
Independencia total
1G y 1H verificadas; se deja de consultar Zoho, se dan de baja las licencias y se cargan las encuestas del formulario de Google
Lunes 01/02/2027
Plan A
Corte único, solo si no queda al menos una semana de margen; hoy no se activa
2027, segundo trimestre
Servicio en sitio
Cuarta rama del blueprint; antes, si llegan instalaciones o puestas en marcha en sitio
Margen y riesgos
[R08.4] La cuenta del 24/09 (plan R01.3, §D.6): del 24/09 al examen del 9/12 hay 10,9 semanas; el trabajo pendiente antes del corte, ponderado por talla, es de 8,7 a 9,0 semanas (1B pendiente ~5,6; 1F ~2,5; F1A-03 y la 1C de paridad ~0,4; alta y edición del equipo 0,2 a 0,5). Margen: +1,9 a +2,2 semanas, con 0,9 a 1,2 de holgura sobre la semana exigida. Contada por filas, al ritmo observado del 09/09 al 23/09 (3,0 filas por semana), sale lo mismo: 26 filas pendientes son 8,7 semanas.
[R08.4] Cuatro riesgos que la cuenta no cubría y pueden comerse la holgura, con su estado a 01/10:
La encuesta de satisfacción. Resuelto el 24/09 (encuesta-entre-corte-e-independencia): entre el corte y la independencia la envía Comercial a mano con un formulario de Google; la encuesta automática entra con 1H y sale de la cuenta de antes del corte.
«Se registran en el ticket». Es una hipótesis no medida que registrar a mano las respuestas enviadas desde el correo corporativo quepa en lo que la aplicación ya tiene. Si hace falta una fila S, resta 0,2 semanas.
Las licencias entre el 14/12 y enero. Resuelto el 24/09 (corte-licencias-plan-a): 2 licencias mensuales, que se dan de baja al verificar 1G y 1H.
Enero depende de empezar antes. 1G y 1H suman de 5 a 7 semanas. Si nada arranca antes del 14/12, la independencia no llega en enero sino entre finales de enero y febrero. La holgura es lo único que puede adelantarlas, y las medidas M1, M2 y M3 lo que puede encogerlas.
[R08.4] Dos hechos posteriores mueven la cuenta y no se han medido. En contra: el trabajo antes del corte decidido el 30/09 y el 01/10 (§3.4) no estaba en la cuenta del 24/09. A favor: la cuenta partía de 9 filas cerradas y a 01/10 hay 19, en parte porque el numerador estaba infravalorado (R01.3, §E). Recomendación: rehacer la cuenta en cuanto se asignen filas a las piezas de §3.4.
Primera tarea de persona: medidas M1, M2 y M3
[R08.4] Van primero porque pueden encoger 1H y casi eliminar 1G, y ninguna necesita desarrollo. A 01/10/2026 no consta su resultado en las fuentes; siguen abiertas en el Anexo D.
Medida
Pregunta
Cómo se toma
Qué decide
M1
¿Cuánto pesan los adjuntos de Zoho?
Medición como super administrador sobre los 986 tickets, sin descargar nada (dos minutos)
El destino de 1G-02: disco del servidor si son pocos GB, almacenamiento de objetos si son decenas, la propia base solo si son cientos de MB
M2
¿Cómo nacen hoy los tickets?
Ver en Zoho si hay canal de correo activo y contar los tickets de 2026 con hilos de correo entrantes
Si se crean a mano, la mitad entrante del correo propio desaparece y 1H-02 baja de L a M
M3
¿Qué se usa de Zoho Desk que no esté en Desk 2.0?
Media hora con quien trabaja a diario en Zoho: vistas, plantillas y firmas, macros, etiquetas, encuesta, informes nativos y SLA propio
Cada cosa en uso es una tanda; cada una que no, alcance que se cierra. Clasifica las siete correcciones 1C y define las vistas equivalentes de F1B-08
3.6 Lo que queda para después: 2027 y futuro
[R08.4] Fuera de la Fase 1 quedan cuatro fases. Su contenido procede del plan R01.1, que las ordenó por la cadena de ejes; los horizontes son los de esa revisión y son orientativos: la R01.3 no los ha recalculado, y la épica 1E ya ocupa parte de 2027.
Fase
Horizonte orientativo
Contenido
Fase 2 · Operación interna completa
2027, primer trimestre
Tablero Kanban con WIP por etapa; OTD y lead times con semáforos y umbrales; dashboards por rol; descuento de repuesto usado; regla de liberación de mesa; solicitud automática de materiales en espera de repuesto; calendario de vencimientos de calibración; app para tableta con checklists, fotos y firma, sin modo offline; migración del histórico documental de Drive
Fase 3 · Área de cliente nivel básico y seguridad
2027, segundo trimestre
Traducción de estados a etapas visibles (C8); hoja de vida reducida, seguimiento y aprobación de cotizaciones; identidad registrada del cliente; los nueve puntos de seguridad; regla de apertura del portal, con el historial cargado y revisado
Fase 4 · Eficiencia, capacidad y conocimiento
2027, segundo semestre
Inventario transaccional y punto de pedido; parámetro de carga por usuario (M6); calendario de citas y agendamiento; análisis de cuellos de botella; capa RAG y copiloto interno; base de conocimiento externa publicada; firmware; offline con resolución de conflictos; OCR, QR y NFC en recepción
Fase 5 · Promesa, predicción y ecosistema
2028
CTP con capacidad finita, a partir del tiempo promesa global; predicción de carga, de picos y de compras; agente conversacional para el cliente; WhatsApp; usuarios externos limitados; servicio premium de monitoreo remoto; telemetría IoT; integración con la web y Ambientalia Cloud
[R08.4] Tres ideas de la lista futura cambiaron de sitio. La sustitución completa de Zoho Desk (antiguo ítem 76) ya no es futuro: es la independencia total de enero de 2027 (1G y 1H). El criterio de aprobación por R² (antiguo ítem 75) queda descartado por ahora: se aprueba con los lineamientos del fabricante y la R² se registra como dato informativo. La taxonomía ISO 14224 y el árbol RCM (antiguo ítem 72) se adoptan como referencia simplificada; el árbol RCM pasa a ser un ejemplo de análisis antes de decidir si se construye.
[R08.4] El servicio en sitio entra como cuarta rama del blueprint en el segundo trimestre de 2027 (decisión anexo-43-en-sitio). Hasta entonces, las visitas se registran en soporte remoto con la modalidad «en sitio».
[R08.4] Una restricción que no cambia. Lo que está en las fases 4 y 5 depende de que la Fase 1 deje el dato estructurado: las herramientas de IA solo funcionan sobre bases de datos bien estructuradas. Y la materia prima del eje ③ (vídeos, índice de temas, base de conocimiento interna) se produce desde ahora, porque no es desarrollo; grabar hoy lo que el portal publicará después es lo que evita que el portal llegue vacío.
3.7 Backlog original del MVP (R02–R08, referencia histórica)
[R08.4] La numeración de ítems de las revisiones R02 a R08 se conserva para que las citas cruzadas sigan funcionando. Esta tabla dice dónde quedó cada ítem o corrección en el plan vigente; no fija alcance. Los ítems 16 y 24 no existen: eran el portal del empleado, retirado en la R06.
Ítems o correcciones
Qué eran
Dónde quedaron
1, 19
Código de ticket por serial y autocompletado
F1B-01 (cerrada)
2, 20
Tipo de servicio y OV previa a la recepción
F1B-03; la OV es obligatoria para trabajar, no para recibir
3
Máquina de estados con validaciones de recepción y QA
F1B-04 y F1C-07 (Control de calidad)
4, 10, 21
Fin del texto libre, registro de entrada y menú de accesorios
F1B-04
5, 6, 7
Permisos y vistas, checkbox comercial, trazas
F1B-05 y F1C-05
8
Prioridad automática y «Mis tickets» ordenado
F1B-07
9
Hoja de vida con los campos comerciales
F1B-02 (cerrada) y F1B-14 (cerrada)
11, 12, 23
Diagnóstico guiado, repuestos y horas, piloto Grimm
Épica 1D
13, 14
Tablero Kanban y KPIs con semáforo
Continuidad de nueve indicadores, sin semáforos, en F1F-05; tablero Kanban con WIP, semáforos y umbrales, en la Fase 2
15, 18
Descuento de repuesto usado; app para tableta
Fase 2
17, 22
Base de datos propia con Zoho en lectura; interfaz como Zoho Desk
F1B-08; la aplicación no escribe en Zoho
25
Índice de temas y primer vídeo
En paralelo, no es desarrollo
26
Área de cliente, nivel básico
Fase 3
27, 28
OCR de placa y QR
Fase 4; el alta manual en recepción va antes del corte
29–60
Fase 2 de la R03 («Eficiencia y flujo»)
Fases 2, 3 y 4 del plan; la reserva y solicitud de repuestos desde el diagnóstico (repuestos adelantados), en F1D-06; la migración del historial (49), con la carga masiva
61–76
Futuro P2/P3
Fase 5, salvo los ítems 72, 75 y 76 (ver §3.6)
C1
Guarda del checkbox
F1A-01 (cerrada)
C2, C3, C4, C5
Anulado, salidas de esperas, dos ramas, tipo de evento
F1C-01, F1C-03, F1C-02, F1C-04
C6
Control de calidad
F1C-07
C7, C9
Reloj del SLA y bodegajes
F1C-06; la parte técnica de C9, en F1A-04 (cerrada)
C8
Estados visibles en el portal
Fase 3
C10
Permisos por cargo y propietario del registro
F1C-05 (nivel cargo construido)
C11
SLA sobre Notificado
F1A-02 (cerrada); en horas hábiles, F1B-08
C12
Salidas de Verificación
F1A-03 (en curso)
4. Anexos
Anexo A — Benchmark de mercado y lecciones aplicables
Doce herramientas analizadas, agrupadas por filosofía de diseño. La columna «lección» es lo que se decidió tomar de cada una.
A.1 Segmento enterprise / EAM
Herramienta
Fortalezas
Limitaciones
Lección para Ambientalia
IBM Maximo
Jerarquías de activos ilimitadas alineadas con ISO 14224; gestión de contratos, garantías y SLA de proveedores.
UX densa; curva de aprendizaje de meses; movilidad débil; implementaciones de 6 a 18 meses.
Emular la robustez del modelo de datos y evitar absolutamente su paradigma de interfaz de escritorio.
SAP EAM (S/4HANA)
Integración financiera total: cada pieza consumida impacta el balance y dispara reabastecimiento.
Rigidez: cambiar un flujo exige consultoría especializada.
La gestión de inventarios y costos debe ser transaccional y rigurosa; el CMMS no puede ser una isla contable.
Infraspeak
Prueba de presencia por NFC; marketplace modular; nativo para empresas de servicios.
Fragmentación de la experiencia; el costo escala con los módulos.
NFC/QR es esencial para validación y auditoría: implementar check-in físico en el activo.
A.2 Segmento mid-market / cloud-native
Herramienta
Fortalezas
Limitaciones
Lección para Ambientalia
Fracttal One
Movilidad real; comunidad que integra proveedores y contratistas; matriz de riesgos.
Complejidad creciente al cubrir IoT, flota y facility.
Gestionar contratistas y clientes externos como usuarios limitados es vital para una empresa de servicios.
Fiix (Rockwell)
Motor de IA que detecta anomalías; hub de integración con PLC y SCADA sin código.
Desafíos históricos con la sincronización offline.
La arquitectura debe estar preparada para IA desde el día uno: datos limpios y etiquetados.
eMaint (Fluke)
Configurabilidad extrema de campos, formularios y reportes sin programar.
Interfaz datada.
La flexibilidad de formularios permite adaptarse a distintos tipos de activo sin reescribir código.
A.3 Segmento mobile-first
Herramienta
Fortalezas
Limitaciones
Lección para Ambientalia
MaintainX
Interfaz tipo chat; adopción en horas; procedimientos con lógica condicional; registro inmutable con firma.
Gestión de activos superficial.
La comunicación contextual dentro de la orden reduce drásticamente los tiempos muertos por dudas.
Tractian
Prescriptivo: identifica qué componente falla y cómo arreglarlo; IoT plug-and-play.
Dependencia del hardware propietario.
El diagnóstico asistido con sugerencia de causa raíz debe ser meta funcional.
Limble CMMS
Programación de preventivos muy fluida; calculadora de ROI en tiempo real.
Menos capacidad de integración empresarial.
Mostrar el ahorro generado es una forma eficaz de sostener la adopción.
UpKeep
Precios transparentes; integración de inventario con códigos QR.
Reportes nativos insuficientes.
El QR como puente entre almacén y ejecución.
A.4 Nicho y emergentes
Makula — plataforma headless, API-first. Lección: la arquitectura desacoplada es el camino correcto para escalar.
Cityworks / FMX — infraestructura pública con fuerte componente GIS. Lección: si se gestionan activos distribuidos, la integración de mapas no es opcional.
Odoo (Mantenimiento + SAT) — integra CRM, inventario, taller y facturación de forma nativa; UX menos amigable para el técnico.
ServiceChannel — excelente gestión de proveedores subcontratados; excesivo para un taller único.
Zoho Creator — flexibilidad para construir el flujo exacto, a costa de desarrollo y mantenimiento constante.
A.5 Posicionamiento objetivo de Ambientalia
Característica
Enterprise
IoT
Mobile
Ambientalia — objetivo
Enfoque
Financiero y normativo
Técnico y predictivo
Comunicación y ejecución
Híbrido: ejecución ágil + control EAM
UX
Baja / compleja
Alta / moderna
Muy alta / conversacional
Muy alta, mobile-first y contextual
Datos
Jerárquica profunda
Flexible
Plana
Jerárquica estricta con interfaz simple
Offline
Limitada
Buena con caché
Excelente
Nativa, sin conflictos
Inventario
ERP nativo
Módulo propio
Básico
Transaccional en tiempo real + kitting
Flujos
Alta, con consultores
Media, visual
Baja, predefinidos
Motor propio configurable por el negocio
Cara al cliente
Portal de proveedor
Datos de sensor
Prácticamente inexistente
Portal en dos niveles como producto comercial
Costos
CAPEX elevado
SaaS por activo
SaaS por usuario
Desarrollo propio, OPEX controlado
Las herramientas tradicionales son excesivas y rígidas para un taller ágil; las de field service puro carecen de profundidad en la gestión física del taller. Los diferenciadores competitivos de Ambientalia serán la calculadora de fecha prometida —que ningún CMMS estándar resuelve bien de fábrica— y el área de cliente escalonada, que ninguno de los doce referentes plantea como producto vendible.
Anexo B — Catálogo consolidado de estados
[R08.4] Catálogo vigente a 01/10/2026. Distingue tres cosas que no deben mezclarse: los estados que existen hoy en la aplicación, los estados decididos y aún sin construir, y los que están retirados u obsoletos (B.2). Los nombres se escriben como en la aplicación.
Flujo
Estados
Servicio técnico — en la aplicación (20 estados)
OV asignada · Ticket creado · Remisión creada · Ingresado · Rev./Diagnostico · Notificado · Notificación a Compras · Notificación Comercial · En espera de SKU inventario · Notificación cliente · En Espera de Repuestos · En Proceso · Solicitado · Servicio externo · Continuación del proceso · Por Facturar · Liberación Comercial · Por Entregar / Sin facturar · Por Entregar · Finalizado
Servicio técnico — decididos, sin construir
Anulado (C2, c2-anulado, F1C-01) · Pendiente de facturar (C4, c4-dos-ramas, F1C-02) · Control de calidad (C6, c6-qa-liberacion, F1C-07). Los tres van después del corte
Equipo nuevo — en la aplicación (5 estados, 6 transiciones)
Ingresado · En Proceso · Notificado · Verificación · Finalizado. Verificación tiene salida: Liberación → Finalizado; la verificación rechazada va a Notificado (p38-verificacion-calidad)
Soporte remoto — en la aplicación, flujo propio (4 estados, 4 transiciones)
Solicitud Soporte · En Proceso · Pendiente · Finalizado. Aquí Pendiente sí se mantiene: significa soporte en pausa
Servicio en sitio — decidido para 2027 T2 (anexo-43-en-sitio), sin construir
Referencia de la primera versión: Asignado → En viaje → En sitio → En ejecución → En pausa → Validación de calidad → Cerrado. Hasta entonces, las visitas se registran por soporte remoto con «Modalidad: remoto / en sitio»
Comercial (as-is, R05) — fuera de Desk 2.0 en 2026
Inicio · Evaluación Especificaciones · Ajuste Especificaciones · Cotización · Ajuste Cotización · Negociación · Fase Cierre · Cerrado Ganado · Cerrado Perdido. Se queda en Zoho CRM (flujos-comercial)
Posible cliente (as-is, R05) — fuera de Desk 2.0 en 2026
Inicio · Asignar Responsable · Cualificación · No cualificado · Convertir a Trato. Se queda en Zoho CRM (flujos-comercial)
Taller (modelo objetivo de referencia, M1.6)
Recepción · Diagnóstico · Cotización pendiente · Espera de aprobación · Aprobado / Rechazado · Devolución sin reparar · Planificación · En ejecución ⇄ Pausa interna · Control de calidad · Embalaje listo · Entregado · Cerrado. Es referencia de mercado, no catálogo de la aplicación: en Desk 2.0 «Devolución sin reparar» se resuelve con Anulado, «Control de calidad» es el estado decidido en C6 y «Entregado» corresponde a la salida desde Por Entregar
Sub-estados de pausa
[DECIDIDO 23/09/2026 — R08.4] No se crean (c7-reloj-sla). El reloj del SLA tiene su propia lista de estados en los que se para (ver B.4)
Portal de cliente (R03)
Recibido · Diagnosticando · Esperando tu aprobación · Reparando · Listo para entrega · Entregado — lenguaje llano para el cliente, sin correspondencia uno a uno con los estados internos (corrección C8). Aquí «Entregado» es solo una etiqueta del portal
[DECIDIDO 30/09/2026 — R08.4] Pendiente deja de usarse en la rama de servicio técnico (E-103): se retira «Marcar como pendiente» (En Proceso → Pendiente) y «Diagnóstico complementario» pasa a salir de En Proceso hacia Continuación del proceso. Con la retirada de las dos transiciones «Servicio externo» hacia Por Facturar (E-106), la rama queda en 31 transiciones y el mapa en 35 pasos. La aplicación conserva todavía Pendiente en esta rama hasta que se construya la corrección, antes del corte. Los pasos por Pendiente del historial se conservan; si la migración de tickets abiertos encuentra alguno de servicio técnico en Pendiente, pasa a En Proceso.
B.1 Estados por área que los mueve (servicio técnico)
[R08.4] Lo que hay hoy en la aplicación, con las correcciones ya decididas. La base de los permisos es el área; el cargo solo restringe algunas transiciones (c10-permisos-cargo, ver M1.9).
Área
Estados desde los que esa área mueve el ticket
Precisiones R08.4
Comercial
OV asignada · Ticket creado · Remisión creada · Notificación Comercial · Notificación cliente · En espera de SKU inventario · Continuación del proceso · Por Facturar · Liberación Comercial
[DECIDIDO 01/10/2026 — R08.4] «Rechazo» desde Notificación cliente la ejecuta solo Comercial (antes, también Servicio Técnico); las otras dos «Rechazo» mantienen su área. «Liberación sin factura» la ejecuta solo el Director Comercial (anexo-33-checkbox). Las salidas de emergencia de En Espera de Repuestos y Servicio externo (a Por Facturar o a Anulado) las decide Comercial (c3-salida-esperas) y las ejecuta la persona a cargo (E-101)
Servicio Técnico
Ingresado · Rev./Diagnostico · Notificado · En Proceso · Solicitado · Servicio externo · Por Entregar / Sin facturar · Por Entregar
Pendiente sale de esta rama (30/09). «Solicitud repuestos» la ejecuta el técnico a cargo y deriva el ticket al encargado de inventario; «Entrega de Repuestos» la ejecuta el encargado de inventario y devuelve el ticket al técnico (01/10). El cargo o la persona «Encargado de inventario» sigue abierto (Anexo D)
Compras
Notificación a Compras · En Espera de Repuestos
Sin cambios
— (terminal)
Finalizado
Sin cambios
En equipo nuevo y soporte remoto, las transiciones son de Servicio Técnico. En soporte remoto, esa área se asignó por supuesto y sigue abierta en el Anexo D. Los tres estados decididos y sin construir se mueven así: Anulado es terminal; de Pendiente de facturar se sale con «Facturar» a Finalizado; Control de calidad lo firma el Coordinador Técnico, nunca quien hizo el trabajo.
B.2 Estados retirados u obsoletos
Los cuatro primeros se retiraron del catálogo en la R04 porque no existen en la aplicación. [R08.4] Se añaden los retirados y los obsoletos desde entonces.
Estado
Qué es en realidad
Entregado
[DECIDIDO 30/09/2026 — R08.4] Estado obsoleto del blueprint de Zoho Desk, que sigue allí porque Zoho no deja borrar lo que se usó. No existe en Desk 2.0 (E-097). La entrega es la salida desde Por Entregar. Los tickets de Zoho que pasaron por él lo conservan en su historial; si la migración encuentra alguno abierto en «Entregado», pasa a Finalizado
Reporte por Garantía
No es un estado. «Reporte por garantía» es la transición de Notificado a Notificación a Compras. En Notificado, si el equipo está en garantía, la aplicación la sugiere sin obligar (aviso «En garantía», 30/09)
Facturado
No es un estado. Hoy es la transición de Por Facturar a Liberación Comercial. [DECIDIDO 23/09/2026 — R08.4] El hecho de estar facturado es un atributo del ticket (la fecha de factura), no un estado (c4-dos-ramas)
Rechazo
No es un estado. «Rechazo» es la transición que entra a Por Facturar desde tres orígenes. La que sale de Notificación cliente es solo de Comercial desde el 01/10
Pendiente (rama de servicio técnico)
[DECIDIDO 30/09/2026 — R08.4] Retirado de esta rama (E-103); sigue en soporte remoto como soporte en pausa
Devolución sin reparar
Nunca existió en la aplicación: venía del modelo objetivo. [DECIDIDO 23/09/2026 — R08.4] Se resuelve con Anulado y sus cinco motivos (c2-anulado)
Sub-estados de pausa (Espera de repuesto · Espera de cliente · Condiciones inseguras)
Nunca existieron en la aplicación. [DECIDIDO 23/09/2026 — R08.4] No se crean (c7-reloj-sla)
B.3 Estados sin salida y cómo quedan resueltos
Tabla de la R05, actualizada a la R08.4.
Flujo
Estado
Naturaleza en la R05
Situación en la R08.4
Servicio técnico
En Espera de Repuestos · Servicio externo
Una sola salida, que depende de un suceso externo (M1.3.4)
[DECIDIDO 23/09/2026 — R08.4] Dos salidas, que decide Comercial: Por Facturar (cobrando el diagnóstico) o Anulado con motivo (c3-salida-esperas). La caducidad nunca ejecuta sola: notifica y sugiere. Se construye en F1C-03, después del corte
Servicio técnico
Solicitado · En espera de SKU inventario
Una sola salida, que depende de un suceso externo (M1.3.4)
[DECIDIDO 23/09/2026 — R08.4] No se abandonan. Solicitado sin pieza vuelve a En Espera de Repuestos; en En espera de SKU inventario, si se retrasa, se avisa a Comercial (c3-salida-esperas)
Equipo nuevo
Verificación
Ninguna salida (M1.4)
[DECIDIDO 10/09/2026 — R08.4] Ya no es estado sin salida: sale por Liberación a Finalizado (71 usos en 181 tickets). La verificación rechazada va a Notificado (p38-verificacion-calidad, 23/09)
Servicio técnico · equipo nuevo · soporte remoto
Finalizado
Terminal por diseño, pero mezcla terminado y abandonado (M1.10)
[DECIDIDO 23/09/2026 — R08.4] Lo abandonado irá a Anulado (F1C-01). El histórico no se reescribe: se marca «abandonado» con su motivo y sale de las métricas (c2-anulado)
Comercial
Cerrado Ganado · Cerrado Perdido
Terminales por diseño, y bien separados
Sin cambios. Flujo fuera de Desk 2.0 en 2026
Posible cliente
No cualificado · Convertir a Trato
Terminales por diseño, bien separados
Sin cambios. Flujo fuera de Desk 2.0 en 2026
La tabla resumía el argumento de la corrección C2: los dos flujos comerciales distinguen el final bueno del malo; los tres operativos, no. [R08.4] Con Anulado decidido, los operativos también lo distinguirán cuando se construya F1C-01.
B.4 Estados de espera y reloj del SLA
[R08.4] La aplicación clasifica once estados como espera. [DECIDIDO 12/09/2026 — R08.4] Por Entregar y Por Entregar / Sin facturar son espera externa: el equipo está listo y se espera al cliente (por-entregar-es-espera). El color del tablero no cambia. Por eso la lista pasó de nueve a once. [DECIDIDO 10/09/2026 — R08.4] Remisión creada es espera interna de Comercial.
La lista de estados que paran el reloj del SLA es propia del reloj (c7-reloj-sla). Hoy coincide con las esperas externas, pero no se deriva de ellas: un cambio en el tablero no mueve el SLA.
Estado
Clase
A quién se espera
Reloj del SLA
Alarma en horas hábiles
Notificación cliente
Externa
Cliente (aprobación)
Se para
4 días hábiles (36 h). Aviso al Coordinador Comercial y marca de tablero «Esperando aprobación del cliente», que no es un estado (anexo-3-alerta)
Por Entregar
Externa
Cliente (recogida)
Se para
—
Por Entregar / Sin facturar
Externa
Cliente (recogida)
Se para
—
En Espera de Repuestos
Externa
Proveedor
Se para
—
Servicio externo
Externa
Laboratorio externo
Se para
—
Notificación a Compras
Interna
Compras
Corre
—
Notificación Comercial
Interna
Comercial
Corre
—
En espera de SKU inventario
Interna
Comercial / Compras
Corre
—
Solicitado
Interna
Almacén (encargado de inventario)
Corre
—
Liberación Comercial
Interna
Comercial
Corre
—
Remisión creada
Interna
Comercial (OV)
Corre
3 días hábiles (27 h), solo si el ticket no tiene OV. Aviso al Coordinador Comercial (escalado-remision-creada, escalado-destinatario-doble)
La tercera alarma está en Notificado, que no es espera: 9 horas hábiles. Todas usan el calendario laboral único, de lunes a viernes de 8 a 17 h, sin festivos de Colombia ni cierres de la empresa (calendario-habil, F1B-12). Las tres están construidas en F1B-08. El aviso va al Coordinador Comercial (o al área Comercial si nadie tiene el cargo), una vez por entrada al estado, en la aplicación y por correo. A 01/10, la aplicación tiene Pendiente, Verificación y Solicitud Soporte sin clasificar como espera; el reloj corre en ellos.
Anexo C — Registro histórico de decisiones
[R08.4] Registro histórico: cada apartado conserva la fecha de origen de sus decisiones y lo que entonces quedó abierto, aunque después se haya decidido. Lo vigente está en el cuerpo del documento. Desde el 17/09/2026 las decisiones de Gerencia llegan por el panel de supervisión y se recogen en C.12.
C.1 — 17/02/2026 · Revisión de operativa y flujos
Participantes: Ambientalia · Gustavo Novoa Guzmán · Julián (brevemente).
Decisión: mantener una sola base de datos Supabase activa. Motivo: la duplicidad agotó los 2 GB del plan básico.
Decisión: continuar con el plan de hosting básico y monitorear; upgrade a KVM2 (8 GB) sólo si el problema persiste.
Decisión: reestructurar el documento de mapeo para dar mayor peso a la descripción de las transiciones.
Decisión: checkbox «Cumple condiciones comerciales» en Habilitar servicio.
Decisión: documentar el flujo as-is sin rediseñar rutas alternativas durante esta fase.
Decisión: fusionar los tres tipos de evento operativo en una sola categoría «Operativo».
Tarea: eliminar las bases de datos de prueba (PostgreSQL, Qdrant) — Ambientalia.
Tarea abierta: consultar si es posible extraer la marca de tiempo del historial de transiciones — Gustavo.
Aplazado: ruta abreviada para equipos sin novedad o de calibración directa.
Abierto: la gestión de garantía con el proveedor sigue ocurriendo fuera del sistema.
C.2 — 19/02/2026 · Diagnóstico Grimm y prototipado
Participantes: Alfonso (Ambientalia) · Gustavo Novoa Guzmán.
Decisión: usar la base de costos y el historial de reparaciones como argumento comercial estructurado. Caso: 9.000 USD anuales para 48 equipos.
Decisión: mantener mapeados tal cual los estados «liberación comercial» y «entrega sin factura».
Decisión: usar el listado de 78 puntos de control del diagnóstico Grimm como herramienta de defensa comercial.
Decisión: evolucionar ese listado de lista lineal a árbol de decisiones.
Decisión: continuar explorando la viabilidad técnica de la plataforma propia.
Tarea: finalizar el listado exhaustivo de pruebas y estructurar el árbol de decisiones — Gustavo.
Tarea: seguir iterando sobre las capacidades del prototipo — Alfonso.
En discusión: linealidad R² como criterio de aprobación.
Abierto: riesgo de perder el rastro de equipos entregados pendientes de cobro.
Restricción registrada: las herramientas de IA exigen bases de datos perfectamente estructuradas de antemano.
C.3 — 14/08/2026 · Desarrollo y transición a Desk 2.0
Participantes: Alfonso García del Pino · Gustavo Novoa Guzmán · un tercer participante técnico.
Decisión: consolidar la arquitectura sobre PostgreSQL propio; Zoho en solo lectura.
Decisión: eliminar la nomenclatura CG/MT; identificador basado en número de serie.
Decisión: número de serie obligatorio en la creación de la remisión.
Decisión: blueprint disparado por desplegable inicial.
Decisión: inspección técnica por fases lógicas secuenciales de macro a micro.
Decisión: priorización automatizada por criterio comercial.
Decisión: el sistema formaliza el traspaso de tickets entre agentes.
Decisión: iniciar pruebas piloto de aprobación en un clic con clientes con contrato activo.
Decisión: desplegar el portal de vacaciones y permisos en beta la semana siguiente. (Fuera del alcance desde la R06 — ver §1.2.)
En discusión (no elevado a decisión): simplificación de la cadena de aprobación de vacaciones a la firma del jefe inmediato. Ver el matiz del 21/08 en C.5. (Fuera del alcance desde la R06.)
Decisión: reorientar a Miguel y Julián hacia la digitalización del conocimiento técnico.
Tarea: estandarizar la lista de SKUs por fase lógica de revisión.
En discusión: especializar al equipo como cadena de producción.
Abierto: plazo exacto de la alerta de no-aprobación del cliente (24 o 48 h).
Plazo: MVP 100 % funcional antes de finalizar el año.
(Sobre el portal del empleado, ver la nota de alcance de C.5.)
C.4 — 20/08/2026 · Hojas de vida y auditoría de flujos
Participantes: Alfonso · Gustavo Novoa Guzmán.
Decisión: mantener la codificación interna actual (serial + modelo) por trazabilidad ISO 9001.
Decisión: los equipos nuevos los da de alta Comercial/Administrativa al conocer los seriales, con cliente y fecha de factura.
Decisión: restringir permisos y vistas por rol.
Decisión: parametrizar Desk 2.0 para que las transiciones clave alimenten la hoja de vida.
Decisión: usar el artefacto de auditoría de blueprints generado con IA como herramienta de mejora continua.
Tarea: extraer y proporcionar el listado de códigos internos de los clientes — Alfonso.
Tarea: parametrizar la creación de equipos desde Comercial con campos obligatorios de serial y factura.
Abierto: mecanismo de migración del historial de Desk 1.0 a Desk 2.0.
Fuera del alcance de este documento. El registro del 20/08 incluye además la adjudicación del proyecto Laboratorio Ola, la compra de tres Shelters XL a Edmira y la planificación del showroom con el equipo demo EDM 280.
C.5 — 21/08/2026 · Desarrollo de Desk 2.0 y planes de formación
Participantes: Alfonso García del Pino (Dirección/Desarrollo) · Gustavo Novoa Guzmán (Dirección Técnica/Operaciones) · Miguel y Julián (equipo técnico).
Nota de alcance (R06). Lo tratado el 21/08 incluyó además el portal del empleado —prototipo de vacaciones y permisos, control de saldos anómalos y cadena de aprobación—. Ese punto quedó fuera del alcance de Desk 2.0 en la R06 y su detalle se ha retirado de este anexo. Se deja constancia para que el registro del 21/08 no aparente estar incompleto.
Arquitectura y avances
Logro: se conectó Zoho a la base PostgreSQL mediante un cliente REST propio con OAuth2; tickets, órdenes de venta y contactos se actualizan cada tres minutos. [R08.2]
Confirmado: Desk 2.0 leerá Zoho sin permisos de edición ni eliminación.
Objetivo declarado: dejar de usar herramientas fragmentadas —n8n, Zoho Desk 1.0 y hojas de cálculo de Excel.
Decisión: la interfaz inicial replicará la estructura de Zoho Desk, con blueprints mucho más controlados.
Tickets y remisiones
Propuesta de flujo: al ingresar el número de serie, el sistema trae automáticamente cliente y modelo y lo asocia a las órdenes de venta activas.
Evaluado: menú visual con fotos para la selección de accesorios en recepción.
Decisión: el disparador del flujo será un menú inicial que define la rama de trabajo.
Decisión: Comercial crea la orden de venta antes de que Servicio Técnico reciba el equipo.
Digitalización del conocimiento
Prioridad: documentar «el cómo» en formatos digitales.
Vídeos cortos y específicos, usando el laboratorio como set de grabación.
A futuro alimentarán un «Área de Clientes» con manuales y capacitaciones según nivel de contrato.
Tarea [equipo técnico]: definir plan semanal de grabación y estructurar el índice de temas.
Estandarización de flujos: caso Grimm
Ir de lo macro a lo micro, sin perderse en detalles microscópicos.
Fases lógicas secuenciales: Física, Neumática, Óptica, Electrónica.
Decisión: usar el flujo del modelo Grimm EDM 180/280 como proyecto piloto.
Tarea [equipo técnico]: diseñar el borrador de macro-fases y micro-fases y entregarlo a Alfonso.
Conclusiones
Se ratifica el cambio de rol del equipo técnico.
La centralización de la información es la prioridad de la organización para lo que resta del año.
C.6 — Decisiones del 21/08/2026 · Ejes de valor y área de cliente
Participante: Alfonso García del Pino (Dirección / Desarrollo). Trabajo de estructuración sobre un esquema en pizarra, posterior a lo recogido en C.5.
No recoge decisiones de equipo, sino la estructuración de la visión. Su resultado es el marco de §1.4 y la especificación de M8 y M12. Se registra aquí por el mismo criterio que las demás: contiene decisiones que condicionan el diseño.
Marco general
Decisión: los tres ejes del esquema —automatización digital, análisis e interacción con clientes— se numeran por orden de construcción, siendo los tres de importancia prácticamente equivalente.
Precisión: el eje «Control → ↓ Riesgo» se refiere a reducir los errores humanos de digitación, no principalmente a permisos o gobernanza.
Precisión: la conexión «Calcular → Citas» significa que el análisis calcula la carga del servicio técnico y ese resultado sirve de base para el agendamiento de citas del cliente, que ve libre u ocupado.
[ABIERTO] Confirmar la lectura del paso ① → ①' del esquema. Punto abierto nº 23.
Capa de conocimiento
Decisión: dos bases separadas — KBI (Knowledge Base Interna, de Ambientalia) y KB Externa (para clientes).
Decisión: los manuales de fabricante están en ambas bases.
Decisión: en Desk 2.0, el cliente conversa directamente con el agente sobre la KB Externa, solo en temas técnicos.
Área de cliente
Decisión: el área de cliente es el gancho comercial del producto de contratos de mantenimiento.
Decisión: se estructura en dos niveles — básica (hojas de vida y aprobación de cotizaciones) para clientes sin contrato, y completa (+ KB Externa) para clientes con contrato.
Decisión: el alcance del MVP del área de cliente son las hojas de vida y la aprobación de cotizaciones.
Decisión: el cliente ve la hoja de vida en versión reducida.
Decisión: las citas son de servicio técnico contra la agenda del taller.
Decisión: Ambientalia puede redistribuir firmware y software de los fabricantes, solo a clientes registrados.
Aclaración de nomenclatura: «PDT's» en el esquema corresponde a PDFs.
Propuestas registradas el 21/08, pendientes de decisión
Distinguir solicitar (nivel básico) de reservar (nivel completo) en el agendamiento — M6.4.
Aplicar un factor de holgura sobre la capacidad publicada — punto abierto nº 24.
Mantener un escaparate público mínimo de la KB Externa — punto abierto nº 25.
Enviar los avisos de vencimiento de calibración a todos los clientes, con o sin contrato — M4.5.
Adoptar pgvector sobre el PostgreSQL propio como almacén vectorial — punto abierto nº 27.
Elevar a principio de diseño que el cálculo es determinista y la IA no interviene en compromisos — principio nº 8.
Regla de apertura del portal por cliente, condicionada a que sus hojas de vida estén completas — M8.6.
C.7 — 21/08/2026 · Auditoría del blueprint implementado
No recoge decisiones de equipo, sino una lectura del código. Se registra aquí por coherencia con el resto del anexo, y porque materializa la decisión del 20/08 de usar la auditoría con IA como herramienta de mejora continua.
Alcance: commit a3a8f03. Revisión de solo lectura: no se modificó nada.
Fuentes leídas: packages/shared/src/transitions.ts (el grafo) · apps/desk/server/transitionExec.ts (el motor) · apps/desk/server/db/estadoPorRemision.ts (el enganche de la remisión) · packages/shared/src/permissions.ts (los permisos) · apps/desk/server/services/ticketService.ts y services/avisoArea.ts (la derivación y los avisos) · debt.md.
Verificado sano:
Los 21 estados son alcanzables desde alguna de las dos entradas; no hay estados huérfanos.
Finalizado es el único estado terminal.
Las 27 etiquetas de campo mapean a columnas reales; ninguna cae a custom_fields.
El comentario ya no puede declararse obligatorio en ninguna etapa.
Remisión creada no queda atrapada: sale por Habilitar Servicio y vuelve sola si se anula la remisión.
Hallazgos: los seis recogidos en §1.2 y desarrollados en M1.3.2, M1.3.4, M1.3.5, M1.7, M1.9.3 y M1.10, con sus correcciones C1–C5 en §3.2.1 y sus puntos abiertos 31–36 en el Anexo D.
Consecuencia documental: §M1.3 se reescribe por completo. El mapeo manual que venía desde la primera revisión tenía 4 filas correctas de 20 y cuatro estados inexistentes; la tabla de discrepancias queda en M1.3.6 para quien haya diseñado sobre él.
C.8 — Febrero de 2026 · Las hojas de mapeo y el diccionario (incorporadas en la R05)
No son decisiones: son el trabajo de campo del que salieron las decisiones de febrero. Se registran aquí porque la R05 los incorpora como fuente citada.
Documento
Fecha
Contenido
DFequiponuevo030226
03/02/2026
Flujo de equipo nuevo: 5 transiciones.
DFsoporteremoto030226
03/02/2026
Flujo de soporte remoto: 4 transiciones.
DFcomercial050226
05/02/2026
Flujos comercial (10 transiciones) y posible-cliente (4).
DFserviciotecnico160226
16/02/2026
Flujo de servicio técnico: 35 filas, con descripción, campos y condiciones por transición.
Diccionario de Campos Tickets
—
Las 59 columnas de la tabla, con las fórmulas de los indicadores derivados.
Lo que aportan más allá de los grafos: la descripción de origen, transición y destino de cada paso; los campos que cada transición escribe y cuáles son obligatorios; las condiciones de guarda; el área responsable, distinguiendo cargo y propietario del registro; y la taxonomía de tipo de evento.
Verificación realizada: la hoja del 16/02 se cruzó transición a transición contra el código (M1.3.9). Coinciden en las 34.
C.9 — 27/08/2026 · Códigos internos, checklists dinámicos, órdenes de venta y priorización
Participantes: Alfonso García del Pino Beneítez (Gerencia) · Gustavo Novoa Guzmán (Servicio Técnico / Dirección Técnica) · Johny Luna (Servicio Técnico).
Incorporada en la R08.1. Es la fecha más densa en decisiones desde el 14/08, y ninguna revisión anterior la recogía.
Códigos internos de cliente
Levantamiento: unos 150 equipos tienen código interno asignado en Zoho Desk; el resto no.
Los códigos internos cambian con el tiempo. AGQ los ha modificado; el serial, en cambio, es inmutable. Se acordó no solicitarlos al cliente y actualizarlos cuando el equipo ingrese a servicio.
Casos particulares: equipos cuyo chasis y espectrómetro llevan seriales distintos, y clientes con nomenclatura propia (por ejemplo SGS-018).
Origen del dato: Corola fue el primer cliente en exigirlo dentro de los certificados. Desde entonces se incluye por defecto en los certificados de calibración de todos los clientes que lo tengan —«NA» si no aplica—, pero no en los informes de diagnóstico.
Riesgo comercial señalado por Gerencia: las órdenes de compra, cotizaciones y remisiones llegan referenciadas por el código interno del cliente y no por el serial. Si el sistema no maneja los dos identificadores, frena procesos.
Decisión: abrir una columna adicional en la base de datos de equipos para el código interno del cliente, como identificador secundario de búsqueda, conservando el serial como identificador primario.
Tarea [Gustavo Novoa]: finalizar el consolidado del listado de códigos internos y compartirlo.
Certificados de calibración: QR, incertidumbre y firmas
El Desk 2.0 no contempla todavía el QR que enlaza al repositorio del certificado digital.
El aplicativo actual ya genera el QR, verifica firmas y unifica documentos que hoy se producen por separado (certificado y protocolo). Se planteó reconstruirlo dentro del Desk 2.0 para que el QR dirija al área de cliente en lugar de al PDF directo.
El cálculo de incertidumbre se hace hoy en Excel; se planteó incorporarlo al flujo de calibración.
El flujo de calibración debe incluir etapas de validación asociadas a los roles existentes, con carga automática de la imagen de firma del responsable de cada etapa.
Decisión: registrar el QR del certificado digital, el cálculo de incertidumbre y las etapas de validación con firma como requisitos del Desk 2.0, en una fase posterior del desarrollo.
El documento maestro
Diagnóstico de Gerencia: demostrado que la arquitectura da para lo que se requiera, seguir desarrollando sin guía produce parches. La analogía usada fue construir sin planos ni jefe de obra.
El borrador consolidó los registros de decisiones, ideas del año anterior, las tablas de transiciones en Excel, la clasificación de etapas y el código existente.
Ruido señalado: el documento contrasta lo escrito con lo ya construido en el demo, y Gerencia considera que ese contraste introduce ruido porque el demo es una maqueta sin lógica consolidada.
Prefijos: se confirmó que hay cinco en uso (CGMT, HV, ESR y otros dos), que el prefijo es una formalidad documental y que la rama del flujo la define el desplegable de tipo de servicio —decisión del 14/08.
Decisiones:
Elaborar y consensuar el documento maestro antes de continuar con el desarrollo, y después trocear el proyecto por fases y prioridades.
Retirar de la próxima versión las referencias al estado actual construido del Desk 2.0.
Ratificado: la rama del flujo la determina el tipo de servicio, no el prefijo del ticket.
Tareas [Alfonso García del Pino]: depurar el documento maestro retirando las referencias a lo construido; e incorporar el flujo de construcción del informe de servicio, hoy sin desarrollar.
Órdenes de venta, contratos y trazabilidad
La OV es hoy campo obligatorio de la transición a servicio. Queda sin resolver qué ocurre si el equipo llega sin ella: no hay estado provisional ni recepción condicionada (punto abierto nº 21). Gustavo planteó el caso real de un lote de equipos sin OV correlacionada y el bloqueo logístico que produce.
Contratos: los equipos bajo contrato tienen mayor prioridad y recurrencia y se asocian a una única orden de venta. El sistema debe poder identificar si un ticket pertenece a un contrato.
Seguimiento de avance: una OV de diez calibraciones, subdividida, permite conocer el porcentaje ejecutado del contrato y alimentar el informe trimestral de avance que Comercial envía al cliente.
Paquetes anuales: clientes como Corola e Indoanálisis compran paquetes; medir su ejecución da argumento comercial cuando el consumo real queda por debajo de lo pactado.
Consumibles reservados: los repuestos comprometidos en órdenes de paquete distorsionan la lectura de inventario y generan riesgo de sobrestock.
Práctica actual: la correlación entre cada elemento de la orden y su código de servicio se hace a mano, en el comentario del albarán de reserva.
Variantes reales de OV: clientes que emiten OV separadas por mano de obra y por repuestos; OV globales por varios equipos; y tickets con varias OV asociadas.
Decisión: permitir la subdivisión de una orden de venta en subórdenes —formato OV-XXX_1, _2, _3— con un ticket asociado a cada subservicio, en lugar de exigir una OV independiente por ticket. Modifica el criterio anterior. [R08.2] Formato revisado el 10/09/2026: OV-AAAA-NNN-SS, con SS de dos dígitos (OV-2026-170-01, -02…). Ver M4.4 y C.11.
Repositorio documental e histórico de hojas de vida
Operativa actual: por cada servicio se crea a mano una carpeta con subcarpetas en Google Drive —protocolo de servicio y, si aplica, certificado, nota de liberación y capturas de los software de diagnóstico e hiperterminal.
Modelo objetivo: el aplicativo presenta espacios de captura de datos en lugar de archivos y carpetas; la información vive en base de datos y los entregables se imprimen sobre plantilla, con la misma lógica del CRM.
Respaldo: el entregable final debe seguir exportándose a PDF para respaldo y entrega impresa. Gerencia recordó que el sistema debe conservar el documento exacto que vio el cliente, dado que existen 23 plantillas de cotización distintas.
Backup: se identificó la necesidad de un módulo de respaldo del sistema para no perder el histórico ante una caída del servidor.
Migración: hay más de 300 equipos con historial en carpetas por serial. Se propuso una herramienta independiente de procesamiento con IA que lea, extraiga y organice esa información en CSV.
Convivencia: los métodos tradicionales —Excel de citas y control— se mantendrán en paralelo unos seis meses para validar la estabilidad del nuevo sistema.
Decisiones:
El aplicativo sustituye la creación manual de carpetas y archivos por captura directa en base de datos, con generación de entregables por plantilla.
La migración del histórico documental se aborda como desarrollo independiente, resolviendo la fase inicial con un enlace directo a la carpeta de Google Drive desde la hoja de vida.
Arquitectura del flujo de diagnóstico: macros y checklists
Flujo levantado por Johny: llegada, ingreso, remisionado, rotulación, inspección visual, almacenamiento y registro fotográfico; después, revisión del alcance según la OV y el tipo de contrato, revisión de documentación interna e histórico, y alistamiento de formatos.
Inspección visual previa: se hace antes de energizar el equipo, por componentes, con alcance variable según lo que haya ingresado según remisión. La fotografía se exige sólo cuando hay novedad.
Rama sin novedades: no existe salida definida para el equipo que no presenta ninguna. Se acordó que debe recorrer igualmente las etapas macro.
El debate de fondo: modelar cada verificación como una transición obligaría a estructuras distintas por tecnología —Grimm, Horiba, Environics, sondas—, multiplicando el esfuerzo de desarrollo por cada una.
Antecedente de viabilidad: el Excel de transiciones entregado previamente fue interpretado correctamente por la herramienta de desarrollo, lo que respalda alimentar los checklists desde plantillas en Excel.
Decisiones:
Adoptar una arquitectura híbrida: las macros —física, óptica, neumática, electrónica— son transiciones de estado, y dentro de cada macro vive un checklist dinámico parametrizado por marca y modelo, con niveles jerárquicos y campos de valor además de casillas de verificación.
Construir el prototipo sobre el Grimm EDM 180 y extrapolarlo después al resto de marcas y modelos.
Tareas: [Gustavo y Johny] Excel de la fase de inspección física del Grimm EDM 180 con macros, subniveles e ítems · [Johny] flujo de diagnóstico en formato visual e ítems del checklist · [Alfonso] transición de revisión física con checklist configurable en el demo.
Informes de diagnóstico y de salida
Vacío detectado: no existe trazabilidad definida entre el ingreso del equipo y el informe de diagnóstico.
El informe posterior a reparación se emitió en su momento a solicitud de clientes puntuales, reelaborando el documento en Word; no se generalizó.
El protocolo ya registra el antes y el después del equipo, y su uso es válido para cualquier servicio, no sólo calibración. Por eso Dirección Técnica lo incorporó a los contratos de mantenimiento.
Modelo propuesto: al cerrar el servicio, los puntos marcados en rojo durante el diagnóstico pasan a verde si se corrigieron, o quedan en rojo con motivo tipificado —cliente no aprueba el servicio, repuesto inexistente, sin solución—, generando un informe de salida sencillo y una conclusión.
Decisión: extender el protocolo actual a un formato ampliado con evidencia fotográfica que funcione como informe de salida para todo tipo de servicio.
Portal de cliente, seguridad y priorización
Dos niveles de acceso, ya recogidos en M8: básico gratuito y sin contrato, y completo como argumento comercial.
Seguridad: abrir un portal expone el sistema a ataques de denegación de servicio y obliga a inversión en seguridad y auditoría.
Priorización: Dirección Técnica planteó que el módulo de informes debe atacarse en una fase muy anterior a la que tenía.
Regresión de estados: hoy no existe botón de retroceso; el cambio de estado se hace a mano desde propiedades. Se acordó que debe conservarse una vía de escape manual para casos especiales.
Otras propuestas registradas: ruteo automático por especialidad o carga; reserva blanda de repuestos para lo detectado en diagnóstico y aún no aprobado; y mantenimiento predictivo a partir de datos de logger. Sobre esta última se advirtió que sin histórico de años anteriores el sistema generaría alertas erróneas, y que la conectividad de los Horiba de generación actual [verificar] requiere una tarjeta adicional que pocos clientes integran.
Decisiones:
Tratar la seguridad y el portal de cliente como proyecto o etapa independiente, posterior a la consolidación de la versión interna.
Centrar el objetivo inmediato del desarrollo en la parte interna del sistema.
Conclusiones del 27/08
El proyecto pasa de exploración técnica a fase de definición: se acordó frenar el desarrollo hasta disponer de un documento maestro consensuado, con meta de versión operativa al 31 de diciembre de 2026.
La adopción de checklists dinámicos parametrizados por marca-modelo es la decisión de mayor impacto del 27/08: evita multiplicar el desarrollo por cada tecnología y permite incorporar equipos nuevos sin rediseñar el flujo.
La subdivisión de órdenes de venta articula la trazabilidad entre Comercial, Servicio Técnico e inventario.
Tres frentes quedan sin responsable ni fecha: la migración del histórico documental, el módulo de backup y la seguridad del portal de cliente. Los tres condicionan la puesta en producción.
C.10 — Decisiones del 03/09/2026
[R08.4] Condensado. El 03/09/2026 se trataron ocho temas con Alfonso García del Pino (Gerencia), Gustavo Novoa (Dirección Técnica) y Johny Luna (Servicio Técnico). Quedaron doce decisiones escritas y doce tareas con responsable. El registro completo está en el repositorio del proyecto.
Lo que el 03/09 dejó sin cerrar, y dónde quedó.
Tema 4, criterios de falla y encadenamiento entre ítems. Fue el único de los ocho temas que quedó sin decisión, solo con tarea. Gerencia lo señaló como el punto más crítico por resolver. Desde entonces se ha decidido la falla nueva (falla-nueva-bloqueante, 23/09) y la regla de los dos atributos por ítem de M2.2 (revisión de GN, 01/10).
Punto abierto nº 62, capa as-built. No se trató el 03/09. Quedó resuelto el 24/09 (p62-capa-as-built) y se aplica en esta R08.4.
Equipo sin novedad. Se decidió que recorre igualmente las etapas macro. Lo ratificó p15-p59-rutas (23/09).
Entregables comprometidos el 27/08. Situación a 01/10/2026:
#
Entregable
Responsable
Situación a 01/10/2026
1
Consolidado del listado de códigos internos de cliente
Gustavo Novoa
Hecho: enviado a Gerencia (GN, 01/10)
2
Documento maestro depurado, sin referencias a lo ya construido
Alfonso García del Pino
Se cumple con esta R08.4 (p62-capa-as-built)
3
Flujo de construcción del informe de servicio incorporado al documento
Alfonso García del Pino
Sin confirmación de entrega a 01/10
4
Excel de la fase de inspección física del Grimm EDM 180
Gustavo Novoa
Hecho: primera etapa realizada y socializada (GN, 01/10)
5
Flujo de diagnóstico en formato visual e ítems del checklist
Johny Luna
Sin confirmación de entrega a 01/10
6
Transición de revisión física con checklist configurable en la aplicación
Alfonso García del Pino
Sin confirmación de entrega a 01/10
7
Listado de SKU con fotografía en el sistema
Alfonso García del Pino
Sin confirmación de entrega a 01/10
8
Actualización de los SKU del inventario con fotografía como fuente única
Gustavo Novoa
Sin confirmación de entrega a 01/10
9
Revisión del portal de órdenes pendientes (cuatro filtros)
Gustavo Novoa
Sin confirmación de entrega a 01/10
Las ocho cuestiones abiertas el 27/08 y dónde quedaron:
Ingreso sin orden de venta (nº 21): la OV es obligatoria para trabajar y no para recibir (10/09, C.11).
Contratos de mantenimiento y subórdenes: subOV OV-AAAA-NNN-SS (10/09) y registro de contrato (anexo-53-contratos, 24/09).
Migración del histórico documental: Drive se queda enlazado (p8-p54-drive, 21/09). La carga masiva del histórico se añadió el 01/10.
Módulo de backup: p55-backup y p55b-destino-copia (24/09). El proveedor sigue abierto.
Convivencia con Google Drive: enlace permanente por capacidad (p8-p54-drive).
Alcance de la KBI frente a la KBE: ver Anexo D, nº 58.
Norma de taxonomía de fallas: ISO 14224 simplificada, como referencia (anexo-56-taxonomia, 24/09).
Prefijos: suprimidos en los tickets nuevos (30/09, E-094).
Criterio de fases. El criterio que se propuso el 27/08 era replicar primero la funcionalidad del Desk 1.0. Quedó adoptado como paridad con Zoho Desk antes del corte operativo del 14/12/2026, en el plan de fases R01.3 (ver §3). El módulo de informes (épica 1E) va después del corte. La seguridad y el portal de cliente siguen como etapa independiente.
C.11 — 10/09/2026 · Decisiones de Gerencia (incorporadas en la R08.2)
Decididas por Gerencia (Alfonso García del Pino) el 10/09/2026, sobre los puntos preparados en docs/sdd/Puntos_para_Gerencia_2026-09-11.md. La evidencia completa está en docs/sdd/Decisiones_Gerencia_2026-09-10.md.
Decisión
Qué cambia
Dónde
Verificación en equipo nuevo: salida resuelta con datos
Verificación —Liberación→ Finalizado, 71 usos en 181 tickets. M1.4 pasa a seis transiciones. La obligatoriedad por familia queda como regla observada, pendiente de Calidad
M1.4 · nº 38
La verificación no se mide con la duración del estado
El estado debe abrirse al empezar la verificación, no al terminarla
M7.3
Cardinalidad 1 ticket : N OV
Se elimina la OV global por lote; la asociación vive en tabla propia de la app
M4.4 · nº 52
Criterios de la subOV de lote
Formato OV-AAAA-NNN-SS (modifica el formato del 27/08), cuarentena, saldo por lote, un ticket vigente por subOV, anulación que libera. Vigencia por fecha pendiente
M4.4
OV obligatoria para trabajar, no para recibir
OV opcional al crear el ticket, obligatoria en Habilitar Servicio; Remisión creada como espera de Comercial con alarma a 3 días; Habilitar Servicio exige remisión vigente; garantía con OVI
M1.2 · nº 21
Las tres fechas derivadas las impone el servidor
El servidor ignora lo que llegue del navegador para esos campos y fija la zona horaria explícitamente
M1.10
El mapa del blueprint se genera desde el código
Diagrama derivado de transitions.ts con prueba anti-desfase; el artefacto interactivo se retira como histórico
Anexo F
Decididas el mismo día y sin reflejo en este documento, porque son de implementación: la vista «Todos» del tablero pasa a devolver también los tickets cerrados, y las entradas 1, 2, 3 y 5 de correcciones al plan de fases quedan aprobadas. Viven en el plan y en el repositorio.
[R08.4] Lo que C.11 dejaba pendiente se cerró después. La obligatoriedad de la Verificación quedó como regla por tipo de equipo y gas patrón (p38-verificacion-calidad, 23/09). La vigencia del contrato quedó como «no se consume vencido, salvo ampliación dentro del año» (vigencia-contrato, 17/09). El mapa generado desde el código se mostrará dentro de la aplicación después del corte (mapa-antes-o-despues-del-corte, 24/09). Ver C.12.
C.12 — Decisiones de Gerencia del 17/09 al 01/10/2026 (panel)
[R08.4] Desde el 17/09/2026, Gerencia decide por escrito en el panel de supervisión. El apartado 06 recoge las preguntas, con 69 decisiones, cada una con su clave. El apartado 07 recoge las ideas, reglas y correcciones. Esta tabla incluye todas las decisiones del apartado 06 y la corrección del 24/09 a la fecha de corte. También incluye las ideas y correcciones del 30/09 (entradas E-094 a E-107) y las del 01/10, que recogen la revisión de GN sobre la R08.3. Hay una línea por entrada, y el texto literal está en el panel. Cuando una entrada posterior modifica otra anterior, se indica en la línea. Lo vigente es lo que dice el cuerpo del documento.
Fecha
Clave
Qué decide
Dónde entra
17/09
escalado-remision-creada
Aviso cuando un ticket lleva más de 72 h en Remisión creada sin OV (el destinatario lo fija la entrada siguiente)
M1.2 · M1.7
17/09
ovi-garantia-autor
La OVI de garantía la crea el Director Técnico
M1.9 · M4.4
17/09
p44-escritura-zoho
La aplicación no escribe en Zoho por ahora; el «espejo de Zoho» queda como línea futura
§1.8 · M11.1 · nº 44
17/09
titularidad-ov-equipo
Quien genera la OV suele ser el titular del equipo; hay un solo caso conocido de mantenedor
M3.1 · M4.4
17/09
vigencia-contrato
Un contrato vencido no se consume, salvo ampliación dentro del mismo año, porque la lista de precios cambia
M4.4
17/09
escalado-destinatario-doble
El aviso de Remisión creada va al cargo Coordinador Comercial
M1.7 · M1.9
17/09
e013-staging-f0-04
No hay copia de pruebas en el servidor: se trabaja sobre la aplicación en uso
M11.5
17/09
e003c-recuento-modelos
El catálogo tiene 29 modelos
M3.4
21/09
e013b-copia-pruebas
No se monta la copia de pruebas; F0-04 se cierra con esa pieza retirada
M11.5 · Anexo H
21/09
titularidad-mantenedor
El mantenedor se apunta en la hoja de vida; solo el dueño o el mantenedor pagan órdenes de ese equipo, y cualquier otra discrepancia se bloquea
M3.1 · M4.4
21/09
p8-p54-drive
Se mantiene el enlace a Drive por capacidad de almacenamiento
§1.8 · M3.5 · nº 8 y 54
21/09
flujos-comercial
Los flujos comercial y posible-cliente se quedan en Zoho CRM, fuera de Desk 2.0
§1.8 · M1.11 · M1.12 · Anexo B
21/09
top5-prioridad
La prioridad de los Top 5 no es automática: se pone a mano
M1.9
21/09
e005-iv4-iv11
Si la OV se eligió en la aplicación, manda la aplicación; si no, manda Zoho. Se hace un parche antes de F1B-11
§1.8 · M1.10 · M4.4
23/09
e005b-parche-vehiculo
El parche se declara dentro de F1B-11, sin cerrarla; F1B-11 cubre también IV-11
M4.4 · Anexo H
23/09
e005c-discrepancia-sin-espejo
Si Zoho trae otra OV, se protege el dato y se avisa a Comercial en la bandeja de avisos, un aviso por ticket
M1.10 · M4.4
23/09
mantenedor-campo-cuando
El campo mantenedor entra ya y es opcional: vacío significa que paga el dueño
M3.1
23/09
trabajo-sin-ficha
El barrido lista los cambios de código sin ficha; si un cambio toca las especificaciones, lleva ficha
§1.11 · M11.6
23/09
e003-catalogo-equipos
El catálogo de equipos ya está construido; F1D-01 lo da por hecho y queda comprobar los datos
M3.4
23/09
e003b-registro-equipos
El registro de equipos se completa en F1B-02, con cinco campos al sumar el mantenedor
M3.1 · M3.4
23/09
p38-verificacion-calidad
La Verificación es obligatoria por tipo de equipo (analizadores de gases y convertidores) cuando hay gas patrón; si se rechaza, el ticket va a Notificado
M1.4 · nº 38
23/09
top5-manual
La prioridad del Top 5 se fija en el cliente y la pone el Director Comercial; se puede ajustar por ticket con motivo
M1.9
23/09
c2-anulado
Estado Anulado con cinco motivos; «creado por error» y «duplicado» se borran; el histórico se marca
M1.6 · M1.10 · Anexo B
23/09
c4-dos-ramas
Dos ramas sin ciclo; Facturado es atributo; Pendiente de facturar es estado y sale con «Facturar» a Finalizado
M1.3.5 · Anexo B
23/09
c3-salida-esperas
Las esperas externas tienen dos salidas, que decide Comercial; Solicitado y la espera de SKU no se abandonan; la caducidad solo sugiere
M1.3.4 · nº 31 · Anexo B
23/09
c5-tipo-evento
El tipo de evento se aplica en F1C-04; el informe pasa por tres actos con tres tipos
M1.3 · M1.8 · nº 35
23/09
c10-permisos-cargo
El área es la base y el cargo solo restringe; siete cargos; lista corta de excepciones
§1.8 · M1.9 · nº 39
23/09
c7-reloj-sla
El reloj del SLA solo se para en esperas ajenas, con lista propia; el cuadro de mando muestra dos tiempos
M1.6 · M1.7 · Anexo B
23/09
c6-qa-liberacion
Estado Control de calidad entre En Proceso y Por Facturar
M9.1 · Anexo B
23/09
p15-p59-rutas
No hay ruta abreviada para el equipo sin novedad; la calibración directa se admite con tres condiciones
M2.1 · nº 15 y 59
23/09
p45-macro-fases
Los N1 son propios de cada marca; las cuatro macro-fases comunes quedan superadas
M2.1 · nº 45
23/09
falla-nueva-bloqueante
Formulario obligatorio de falla nueva; el técnico asigna la gravedad y se avisa al Director Técnico
M2.3
23/09
p14-remisiones-entrada
Las remisiones de entrada son de la aplicación, no de la hoja de Google
M2.5 · nº 14
24/09
roles-validacion-informe
Tres firmas; nadie valida lo que elaboró; validación única cuando hay ausencia registrada
M2.5 · nº 10
24/09
fecha-corte
Los tickets nacen en la aplicación desde el 14/12/2026, con confirmación el 9/12 (corregida el mismo día por la entrada siguiente)
§1.9 · §3.5
24/09
I-05 (corrección a fecha-corte)
Corte en dos tiempos: corte operativo el 14/12 e independencia total en enero de 2027; plan A el 01/02/2027
§1.9 · §3.5
24/09
p55-backup
Responsable Alfonso; copia nocturna y copia previa a cada cambio; retención 7/4/12; restauración de prueba mensual
M11.5 · nº 55
24/09
anexo-43-en-sitio
El servicio en sitio será la cuarta rama en 2027 T2; mientras tanto, soporte remoto con el campo de modalidad
M1.2 · M1.5 · M1.6 · nº 43
24/09
anexo-56-taxonomia
ISO 14224 (2016) simplificada, como referencia y no para certificación
M2.4 · M3.2 · nº 56
24/09
anexo-47-repuestos
Repuestos adelantados en tres casos, con tope de 3.000.000 COP por ticket
M2.3 · M5 · nº 47
24/09
anexo-33-checkbox
La liberación sin factura la hace solo el Director Comercial, con motivo de lista cerrada y fecha prevista de facturación
M1.3.5 · nº 33
24/09
anexo-36-aviso
Se acepta perder un aviso, con revisión nocturna; borrado limitado y registro inmutable
M1.9.3 · M11.4 · nº 36
24/09
anexo-53-contratos
Registro de contrato; un ticket es de contrato por su subOV; prioridad Alta; informe trimestral
M4.4 · nº 53
24/09
anexo-3-alerta
Alerta a los 4 días hábiles en Notificación cliente; jornada hábil L-V 8–17 h; tres alarmas en horas hábiles
M1.7 · nº 3
24/09
anexo-7-garantia-proveedor
Ficha de reclamación al fabricante, vinculada al ticket y a la OVI, fuera del blueprint
M4.4 · nº 7
24/09
anexo-9-comentarios
Comentarios predeterminados del catálogo y nota libre aparte; la base de conocimiento solo sugiere
M2.3 · nº 9
24/09
anexo-61-incorporacion
Las decisiones se registran en el repositorio; una R08.x cada dos semanas o al llegar a 10 pendientes; ninguna más de un mes pendiente
§1.11 · nº 61
24/09
p62-capa-as-built
El cuerpo M1–M12 queda sin capa as-built; el Anexo H se genera desde el barrido
Cuerpo · Anexo H · nº 62
24/09
p64-historico-c1
Las liberaciones sin factura anteriores al arreglo de C1 se marcan, no se corrigen
M1.3.5 · nº 64
24/09
e001-por-entregar
Por Entregar como espera queda fuera del plan; cada cambio lleva un único ID de tanda
Anexo B · Anexo H
24/09
e009-kpis
Continuidad de los indicadores antes del corte, como tabla exportable; la encuesta la envía Desk 2.0
M7.1 · Anexo G
24/09
calendario-habil
Calendario laboral único (F1B-12), con una sola función de horas hábiles
§1.8 · M1.7 · M6
24/09
barrido-comprobaciones-nuevas
Fila nueva F0-06 «Vigilancias del repaso automático»
M11.6 · §3
24/09
c10b-gerente-director
«Gerente comercial» es el Director Comercial; los cargos son siete
M1.9
24/09
p64b-quien-ejecuta
Los recuentos contra producción los ejecuta Alfonso, con plazos 25/09, 02/10 y 09/10
Anexo D
24/09
p14b-hoja-google
La hoja de Google de remisiones se cierra el 14/12 y manda la aplicación; antes del 31/10 se averigua quién la usa
M2.5
24/09
p55b-destino-copia
Copias en almacenamiento de objetos de otro proveedor, con bloqueo de borrado; la carpeta de Drive se copia cada semana
M11.5
24/09
e009b-lista-indicadores
Lista cerrada de nueve indicadores; se aceptan con ≥ 95 % de coincidencia y un día de diferencia como máximo
M7.1 · Anexo G
24/09
equipo-nuevo-alta-en-ticket
El alta del ticket de equipo nuevo registra el equipo en el mismo paso
M1.2 · M1.4 · M3.4
24/09
edicion-datos-comerciales-equipo
Edición de los seis campos; tres quedan reservados a Comercial y a los administradores; con historial
M3.1 · M11.4
24/09
mapa-en-la-app
El mapa del blueprint se ve en Configuración, dentro de la aplicación
Anexo F
24/09
mapa-antes-o-despues-del-corte
El mapa en la aplicación va después del corte
Anexo F · §3
24/09
encuesta-entre-corte-e-independencia
Entre el corte y la independencia, la encuesta se envía a mano con un formulario de Google y en enero se carga
M7.1
24/09
corte-licencias-plan-a
Antes del 21/12 se renuevan 2 licencias de Zoho en facturación mensual, de solo lectura
§1.9 · §3.5
28/09
f1a03-familia-y-gas-patron
El compuesto se guarda en cada equipo y se hereda del modelo; la tabla de gases patrón la mantiene el Director Técnico
M1.4
28/09
f1a03-certificado-liberacion
La Liberación exige el número del certificado de calibración de fábrica
M1.4
28/09
ledger-ficheros-nuevos
El contador de líneas incluye los ficheros nuevos; tope de 800 líneas por intento
M11.6
28/09
f1b04-rotulacion
Confirmación «Rotulado y guardado»; etiqueta con el código del ticket; la ubicación se registra después del corte
M1.2 · M5
28/09
f1b04-desplegables
Lista cerrada de tipos de novedad de entrada, con selección múltiple
M1.2
30/09
I-06 · E-094
Se suprimen los prefijos en los tickets nuevos; los existentes los conservan
M1.1 · nº 37
30/09
I-07 · E-095
Tiempo promesa global (diagnóstico + días de entrega) y dos indicadores de cumplimiento
M4.1 · M4.2 · Anexo G
30/09
I-08 · E-096
Encuesta en tableta en la entrega cuando recoge el propio cliente; indicador por canal
M7.1
30/09
I-09 · E-097
«Entregado» es un estado obsoleto de Zoho y no existe en Desk 2.0
M1.3 · M1.7 · Anexo B
30/09
I-10 · E-098
M6 se construye sobre usuario, área y cargo; la carga es por usuario y se suma la disponibilidad de cada uno
§1.4.5 · M6
30/09
I-11 · E-099
Dentro de cada prioridad, la cola se ordena por la hora de «Habilitar Servicio»; el bodegaje se mide en días naturales
M1.2 · M1.9 · M1.10
30/09
I-12 · E-100
Accesorios con foto, nombre y número de parte del catálogo de Zoho Books, filtrados por modelo
M1.2
30/09
I-13 · E-101
La salida de emergencia de las esperas solo la ejecuta la persona a cargo
M1.3.4 · nº 31
30/09
I-14 · E-102
Liberación sin factura en dos momentos: la restricción antes del corte y la alarma con F1C-02
M1.3.5 · §3
30/09
I-15 · E-103
Pendiente sale de la rama de servicio técnico; «Diagnóstico complementario» sale de En Proceso
M1.3 · Anexo B · Anexo F
30/09
I-16 · E-104
Remisiones de entrada y de salida sin ticket
M1.3 · M2.5
30/09
I-17 · E-105
Distintivo calculado «En garantía», que no es un estado
M1.3
30/09
I-18 · E-106
Se retiran las dos transiciones «Servicio externo» hacia Por Facturar
M1.3 · Anexo F
30/09
I-19 · E-107
Comercial/Compras registra el SKU y cotiza, y la aplicación avisa al técnico
M1.3 · M4.4
01/10
maestro-r08-3-publicada
La R08.3 queda como borrador no vigente y la R08.2 sigue vigente hasta la revisión definitiva, prevista antes del 17/10
§1.2 · §1.3
01/10
I-20 (GN)
Confirma I-19 (SKU)
M4.4
01/10
I-21
«Rechazo» desde Notificación cliente: solo Comercial
M1.3 · Anexo B
01/10
I-22
«Solicitud repuestos» y «Entrega de Repuestos» como traspaso con el encargado de inventario
M1.3 · M1.9.2
01/10
I-23 (GN)
Confirma I-15 (Pendiente y «Diagnóstico complementario»)
M1.3
01/10
I-24 (GN)
«Entrega de Repuestos» la ejecuta el encargado de inventario y devuelve el ticket al técnico (confirma I-22)
M1.3
01/10
I-25 (GN)
Confirma I-18 («Servicio externo» desde Pendiente)
M1.3
01/10
I-26 (GN)
Confirma I-15 («Diagnóstico complementario» desde En Proceso)
M1.3
01/10
I-27 (GN)
Remisión de salida creada desde la entrega; las partes reemplazadas y la salida de inventario, después del corte
M1.3 · M5
01/10
I-28 (GN)
C5 aprobada: cuatro tipos de evento, uno por transición
M1.3 · M1.8 · nº 35
01/10
I-29 (GN)
Guarda: no se entrega sin una remisión de salida vigente
M1.7
01/10
I-30 (GN)
Fotos obligatorias en las remisiones de entrada y de salida
M1.2 · M2.1
01/10
I-31 (GN)
Repuestos preventivos durante el diagnóstico y la reparación
M2.3
01/10
I-32 (GN)
Árbol RCM: preparar un ejemplo; es análisis, no desarrollo
M2.4
01/10
I-33 (GN)
La tabla de remisiones de entrada la escribe Desk 2.0; el paso 1 de M2.5 queda cerrado
M2.5 · nº 14
01/10
I-34 (GN)
La R² no es criterio de aprobación; se aplican los lineamientos del fabricante
M2.7 · nº 46
01/10
I-35 (GN)
Hojas de vida de los equipos propios de Ambientalia
M3.1
01/10
I-36 (GN)
Versión imprimible de la hoja de vida
M3.3
01/10
I-37 (GN)
Alta manual en la recepción del equipo y del cliente desconocidos
M1.2 · M3.4
01/10
I-38 (GN)
Carga masiva del histórico documental a las hojas de vida
M3.5 · M8.6
01/10
I-39 (GN)
Umbral del OTD por encima del 75 %, global y por cliente, configurable
M7.1 · Anexo G
01/10
I-40 (GN)
Predicción a partir de los protocolos, con valores «como se encontró» y «como se dejó»
M7.4
01/10
I-41 (GN)
Filtros por número de ticket y por serial
M7.5
01/10
I-42 (GN)
Historial completo descargable en el portal, en el nivel completo
M8.3
01/10
I-43 (GN)
Technical Notes como formato único del contenido técnico publicado
M8.4 · M9.3 · M12
Dos decisiones que no están en el apartado 06 del panel, pero que el documento recoge:
por-entregar-es-espera (12/09/2026): Por Entregar y Por Entregar / Sin facturar son espera externa (Anexo B.4).
e099-orden-cola-taller (01/10/2026): cierra I-11 como decisión. Ya está construida en F1B-07 (M1.9).
Las entradas del 01/10 marcadas «(GN)» proceden de la revisión de GN sobre la R08.3. Las que solo confirman una corrección del 30/09 no añaden contenido nuevo.
Anexo D — Puntos abiertos que requieren decisión
[R08.4] Lista de control vigente a 01/10/2026. Cada punto abierto es un riesgo de retrabajo si se construye sin resolverlo.
La numeración es estable y no se reutiliza ningún número. Los puntos 19 y 22 no existen: correspondían al portal del empleado, retirado en la R06, y se conserva el hueco. El 27 quedó sustituido por el 51 en la R08.
Desde esta revisión el anexo se presenta en dos tablas:
D.1 recoge lo que sigue abierto, con su dueño y, cuando la hay, una recomendación. Las recomendaciones no son decisiones.
D.2 recoge lo resuelto. Por la regla de incorporación de lo decidido (§1.11), cada punto resuelto aparece tachado, con la fecha de la decisión, la revisión en que entra al maestro, la decisión en una línea y el apartado donde se desarrolla.
Los puntos 65 y 66 los ordenó registrar Gerencia el 08/09 y no habían llegado a la R08.2. Del 67 en adelante son puntos nuevos de la R08.4. Salen de las preguntas pendientes de Gerencia, de las correcciones del 30/09 y el 01/10 y de lo que la construcción ha dejado sin destino.
D.1 — Puntos abiertos a 01/10/2026
#
Punto abierto
Módulo
Estado
Dueño · recomendación
5
Cerrar los cuatro umbrales de KPI sin definir.
M7
ABIERTO. [R08.4] El 01/10 se fijó la meta del OTD en más del 75 %, global y por cliente, como parámetro configurable (M7.1). Los semáforos y umbrales van en Fase 2.
Dirección / Ops
6
Resolver el rastro de equipos entregados pendientes de cobro.
M4
ABIERTO. [R08.4] Muy acotado por lo decidido sobre C4 (estado Pendiente de facturar, cuya antigüedad se mide) y sobre la liberación sin factura con motivo y fecha prevista (nº 33). Falta que Gerencia confirme si lo da por cerrado.
Comercial / Administración
11
Decidir sobre la especialización del equipo técnico como cadena de producción.
M1 / M6
ABIERTO
Alfonso / Gustavo
13
Completar la tercera alerta de desviación de comportamiento.
M7
ABIERTO
Gustavo
16
Transcribir las cinco imágenes de la página de KPIs.
M7
ABIERTO, en parte cubierto por el Anexo G. [R08.4] La lista de indicadores que pasan al corte ya está cerrada: nueve, más el décimo de cumplimiento global ante el cliente después del corte.
Alfonso
17
Fijar el índice de temas a grabar y el día semanal de grabación.
M12
ABIERTO
Equipo técnico
18
Completar la matriz de contenidos por nivel de contrato.
M12 / M8
ABIERTO, en parte resuelto por el modelo de dos niveles (M8.1). Falta el detalle pieza a pieza.
Alfonso / Comercial
20
Decidir hasta cuándo se mantiene la interfaz que replica Zoho Desk.
M10
ABIERTO
Alfonso
23
Confirmar la lectura del paso ① → ①’ del esquema de ejes de valor (interpretado como «flujo actual → flujo rediseñado con pasos eliminados»).
§1.4.2
ABIERTO
Alfonso
24
Fijar el factor de holgura de la capacidad publicada al cliente: qué porcentaje de la capacidad calculada no se ofrece en la agenda pública.
M6.4
ABIERTO
Alfonso / Gustavo
25
Definir el escaparate público mínimo de la KB Externa: qué contenido es accesible sin contrato y qué queda detrás.
M8.4 / M12
ABIERTO
Alfonso / Comercial
26
Definir la responsabilidad y el efecto sobre la garantía cuando el cliente ejecuta un procedimiento de mantenimiento básico publicado por Ambientalia.
M9.3
ABIERTO
Dirección Técnica / Comercial
28
Fijar el alcance exacto de la hoja de vida reducida visible en el nivel básico del portal, campo a campo.
M8.3
ABIERTO
Alfonso / Gustavo
29
Cerrar los guardarraíles del agente y el protocolo de derivación a Comercial: qué se responde, qué se deriva y con qué mensaje.
M12.5
ABIERTO
Alfonso / Gustavo
30
Confirmar qué marcas cubre el derecho de redistribución de firmware y software, y cómo se acredita la condición de cliente registrado con contrato vigente.
M12.7 / M8.5
ABIERTO
Alfonso / Comercial
41
Fijar el nuevo hito del bodegaje de entrada y de los tiempos de inicio de servicio y de diagnóstico, hoy inválidos por la creación anticipada de tickets.
M1.10 · C9
PARCIAL. [R08.4] Los bodegajes de entrada y de proceso están construidos sobre el historial de transiciones y se miden en días naturales (confirmado el 30/09). El de salida espera el campo «fecha de aviso al cliente». El hito de inicio de servicio y de diagnóstico sigue sin fijar.
Alfonso / Ops
42
Resolver de dónde sale Preparación Cotizac.: la hoja dice que de Ajuste Especificaciones y el diagrama, que de Evaluación Especificaciones. Determina si toda oportunidad pasa obligatoriamente por el ajuste.
M1.11
ABIERTO. [R08.4] Sin urgencia: los flujos comercial y posible-cliente se quedan en Zoho CRM en 2026 (decisión del 21/09).
Comercial
48
Definir la lectura de disponibilidad de repuestos desde el Portal Ambientalia · Análisis de Inventario hacia el CTP: en inventario, en camino con fecha estimada, o por solicitar con lead time.
M5.4 · M4.2
ABIERTO
Alfonso
49
Acotar qué datos expone el certificado verificable públicamente: si basta confirmar autenticidad y vigencia o se muestran también los valores medidos.
M8.2 · M8.7
ABIERTO
Dirección Técnica / Comercial
50
Confirmar el modelo único de identidad del portal (cuenta registrada con acceso por enlace firmado) en lugar de dos mecanismos separados.
M8.5
ABIERTO
Alfonso
51
Elegir la vía de la capa de conocimiento con un prototipo: RAG con almacén vectorial, wiki tipo Obsidian, o MCP contra NotebookLM. Sustituye al punto 27.
M12.3
ABIERTO. [R08.4] Ya no condiciona el diagnóstico: la base de conocimiento no escribe en el informe, solo sugiere al lado (nº 9), y F1D-04 no depende de ella.
Alfonso / equipo técnico
57
Asignar responsable y fecha a la seguridad del portal de cliente, hoy sin dueño y condicionante de la puesta en producción.
M8 · M11.4
ABIERTO
Alfonso
58
Delimitar el alcance de la base de conocimiento interna (KBI) frente a la externa (KBE), declarado sin resolver el 27/08.
M12
ABIERTO
Alfonso / Gustavo
63
Confirmar la correspondencia entre los módulos M1–M8 de lo decidido el 27/08 y los M1–M12 de este documento: si son la misma estructura vista en grueso o una agrupación distinta.
§2
ABIERTO
Alfonso / Gustavo
65
Definir si la doble escritura hacia Google Sheets se retira o se mantiene en paralelo con PostgreSQL, y quién es dueño de resolver la discrepancia si las dos fuentes divergen.
M11.3
ABIERTO — R08.4 (registro ordenado por Gerencia el 08/09)
Alfonso / Dirección Técnica
66
Los indicadores 47, 50·53, 57 y 58 se rompen si un ticket vuelve a pasar por un estado que ya contó una vez (reentrancia). Decidir si se corrigen antes de publicar indicadores con ellos o si se documenta la limitación.
M7.1 · M7.6
ABIERTO — R08.4 (registro ordenado por Gerencia el 08/09). No se ha vuelto a medir desde entonces. Los cuatro forman parte de la lista cerrada que se calcula en paralelo con Zoho antes del corte (M7.1).
Alfonso / Ops
67
Qué estados ve cada área. Opciones: (a) mantener lo construido, todos ven todos los tickets y solo se filtran las transiciones; (b) vista por área sin restricción: cada área abre por defecto un filtro con sus estados y puede ver el resto; (c) segmentación real en el servidor. Para (b) y (c) hace falta la matriz estado × área.
M1.9.1 · F1B-05
ABIERTO — R08.4. Bloquea el cierre de F1B-05.
Gerencia. Recomendación: (b), vista por área sin restricción.
68
Prioridad de los clientes sin contrato ni Top 5: confirmar el modelo de tres niveles (Alta, contrato; Media, buena calificación; Baja, calificación baja), de dónde sale la calificación («Portal Ambientalia · Valoración de Clientes») y quién ajusta a mano fuera de los Top 5 (hoy solo el administrador). Incluye si al marcar un cliente como Top 5 su prioridad pasa a los tickets abiertos que ya tiene (E-109).
M1.9.1 · F1B-07
ABIERTO — R08.4. Bloquea la parte automática de F1B-07.
Gerencia, con Comercial como dueña del dato
69
Qué son las «vistas equivalentes a Zoho»: qué vistas de listado, qué campos de ficha y qué entidades hay que igualar para dar la paridad por cumplida.
M10 · F1B-08
ABIERTO — R08.4. Es lo único que le falta a F1B-08.
Gerencia, con quien trabaja a diario en Zoho Desk. Recomendación: que las defina la medida M3 (nº 88).
70
Año y tope de la ampliación de contrato (E-086): qué año cuenta (natural del vencimiento, de inicio o de fin) y hasta qué fecha puede llevarse la nueva fecha de fin.
M4.4 · F1B-11
ABIERTO — R08.4. Mientras no se decida rige la regla estricta: con el contrato vencido no se asocia ninguna subOV de su lote. Es lo único que le falta a F1B-11.
Gerencia
71
Área de las cuatro transiciones de soporte remoto (E-090). Hoy son de Servicio Técnico por supuesto de construcción, no por decisión; cambiarlo es un dato del catálogo.
M1.5
ABIERTO — R08.4
Gerencia y Servicio Técnico
72
Proveedor del almacenamiento de las copias: Backblaze B2, Cloudflare R2 o Amazon S3. Sin destino, la copia nocturna y la previa a cada cambio no pueden arrancar.
M11.5 · F1F-02
ABIERTO — R08.4. Es lo que queda del nº 55.
Gerencia (cuesta dinero). Recomendación: Backblaze B2.
73
Las tres alarmas de SLA y el aviso de ritmo de contratos se evalúan hoy en la pasada periódica de sincronización con Zoho (E-087). Si esa pasada se retira con la independencia, dejan de funcionar sin que nada avise. Hay que moverlos antes de apagarla.
M11.3 · M1.7 · M4.4
ABIERTO — R08.4. Plazo: antes del modo sin Zoho (1G-04).
Gerencia; lo ejecuta quien retire la sincronización
74
Corrección de un contrato mal dado de alta (E-088). Hoy un lote o un cliente equivocados solo se corrigen en la base de datos, y el lote erróneo queda ocupado para su contrato verdadero.
M4.4 · F1B-11
ABIERTO — R08.4
Gerencia
75
Dos campos de cargo en el usuario (E-092): el cargo de firma (texto libre, el que sale en la remisión y el que leen las alarmas y la derivación) y el cargo de permiso (lista cerrada de siete). Decidir si se unifican o se mantienen separados a propósito.
M1.9.1 · F1C-05
ABIERTO — R08.4
Gerencia
76
Cargo o persona «Encargado de inventario», que recibe el ticket en «Solicitud repuestos» y lo devuelve al técnico en «Entrega de Repuestos».
M1.3 · M1.9.2
ABIERTO — R08.4. La derivación se construye ya; la restricción de quién ejecuta cada paso llega con el nivel «propietario del registro».
Gerencia y Servicio Técnico
77
Cargo «Especialista técnico», que da de alta y administra los equipos propios de Ambientalia. No está entre los siete cargos; la idea del 01/10 dice que se añade si no existe.
M3.1 · M1.9.1
ABIERTO — R08.4. Después del corte.
Gerencia / Dirección Técnica
78
Descuento único de inventario: cómo se reparte la salida de cada pieza entre «Entrega de Repuestos», la remisión de salida y la factura de Zoho Books mientras esta siga descontando inventario.
M5 · M1.3.5
ABIERTO — R08.4. Propuesta de GN: la entrega al técnico deja la pieza asignada al ticket y la remisión de salida confirma el consumo.
Gerencia, con Compras
79
Si la guarda «no se entrega sin remisión de salida vigente» se aplica también a la Liberación de equipo nuevo.
M1.7 · M1.4
ABIERTO — R08.4
Gerencia
80
Si los equipos de demostración o préstamo entran en «equipos propios» con hoja de vida y plan de mantenimiento. La idea del 01/10 los nombra entre los equipos internos, y las remisiones sin ticket tienen el motivo «préstamo o demostración».
M3.1
ABIERTO — R08.4
Gerencia / Dirección Técnica
81
Si la meta del OTD (más del 75 %) se aplica a los dos indicadores de cumplimiento: el del taller y el global ante el cliente.
M7.1 · Anexo G
ABIERTO — R08.4
Gerencia
82
Umbral del análisis predictivo. La idea del 01/10 fija más de 6 meses y más de 30 equipos por modelo; falta decidir si, cuando un modelo no lo alcanza, se analiza por familia.
M7.4
ABIERTO — R08.4. No condiciona el desarrollo: lo que entra en 1D es el registro de los valores.
Dirección Técnica
83
Alta manual en recepción de equipo y cliente desconocidos: qué cargos la pueden hacer y qué datos mínimos lleva el cliente provisional (la idea propone razón social, NIT, contacto, teléfono y correo).
M3.4 · M1.2
ABIERTO — R08.4. Va antes del corte.
Gerencia
84
Alcance y fecha de la acreditación ISO/IEC 17025: qué procesos se acreditan ante ONAC y cuándo. Recoge también los criterios de aprobación que la acreditación exija (resto del nº 46).
M9.2 · M2.7
ABIERTO — R08.4
Gerencia y Dirección Técnica
85
Adopción del árbol de fallas RCM, una vez preparado el ejemplo (Grimm EDM180 completo y Horiba AP-370 parcial).
M2.4
ABIERTO — R08.4. Es análisis, no desarrollo: no entra en el plan hasta que se decida.
Gerencia y Servicio Técnico
86
Asignación de fila del plan a las piezas nuevas del 30/09 y el 01/10 (ver §3.4). Incluye la carga en enero de las encuestas enviadas a mano entre el corte y la independencia (E-085), que ninguna fila reclama.
§3.4
ABIERTO — R08.4
Gerencia. Recomendación: las piezas de antes del corte, como cambios dentro de F1B-03, F1B-04 o F1B-08 según su tema, o como fila nueva pequeña; las de después, en su épica; la salida de emergencia por persona a cargo, dentro de F1C-03.
87
Cuántas personas consultan a la vez el histórico de Zoho entre el corte y la independencia. Con 2 licencias de solo lectura, si son más de dos no alcanzan. El dato está en la administración de Zoho.
§1.9 · F1F-01
ABIERTO — R08.4. Plazo: antes de renovar las licencias (21/12).
Gerencia
88
Medidas M1, M2 y M3 del plan de independencia: cuánto pesan los adjuntos de Zoho (M1), cómo nacen de verdad los tickets (M2) y qué se usa de Zoho Desk que no esté en Desk 2.0 (M3). Fijan la talla de 1G y 1H; M3 también clasifica las siete correcciones 1C.
§3.5 · 1G · 1H
ABIERTO — R08.4. Primera tarea de persona; no requiere desarrollo.
Gerencia
89
Recuentos contra producción pendientes: tickets que pasaron por Rechazo y terminaron en Finalizado (candidatos a Anulado), liberaciones sin factura anteriores al arreglo de C1 y modelos del catálogo con inspección, artículos y mano de obra cargados.
M1.10 · M1.7 · M3.4
ABIERTO — R08.4. Plazos fijados el 24/09: 25/09, 02/10 y 09/10. A 01/10 no consta ninguna cifra.
Alfonso
90
Uso de la hoja de Google de remisiones: quién la rellena y para qué, qué le da que la aplicación no, y si las remisiones sin ticket lo cubren. Lo que salga se construye antes del corte o se acepta perderlo, por escrito.
M2.5
ABIERTO — R08.4. Plazo: antes del 31/10.
Gerencia
91
Rotación de secretos: si se adopta una política periódica de rotación de credenciales del sistema.
M11.5
ABIERTO — R08.4. Propuesta del equipo de desarrollo, sin decisión de Gerencia.
Alfonso
D.2 — Puntos resueltos
#
Punto
Módulo
Estado y decisión
Fuente
1
Transcribir los diagramas de «Flujo comercial» y «Flujo posible-cliente».
M1.11 · M1.12
RESUELTO en la R05.
—
2
Reconstruir el diccionario de campos.
Anexo G
RESUELTO en la R05: 59 columnas con sus fórmulas.
—
3
Fijar el plazo exacto de la alerta de no aprobación del cliente: ¿24 o 48 horas?
M1.7 · M4
RESUELTO 24/09 — R08.4: 4 días hábiles (36 h hábiles) para todos los clientes; aviso al Coordinador Comercial y marca de tablero «Esperando aprobación del cliente», que no es un estado. Construido (F1B-08).
anexo-3-alerta · calendario-habil
4
Definir cómo extraer el momento de «Ingreso a servicio» para medir el bodegaje de entrada.
M1.10 · M7
RESUELTO en la R05: la fórmula existe (columna 56) y lo que falla es el dato. Sustituido por el nº 41.
—
7
Decidir cómo incorporar la gestión de garantía con el proveedor.
M4.4
RESUELTO 24/09 — R08.4: ficha propia vinculada al ticket y a la OVI de garantía, no rama del blueprint; el ticket cierra cuando el cliente queda atendido y la reclamación sigue aparte, con RMA, valor reclamado y valor recuperado.
anexo-7-garantia-proveedor
8
Definir el mecanismo de migración del historial de Desk 1.0 a Desk 2.0.
M3.5 · M11.3
RESUELTO 21/09 — R08.4: los documentos siguen en Drive, enlazados desde Desk 2.0, por capacidad de almacenamiento. La repatriación del histórico de Zoho es la épica 1G (enero de 2027) y la carga masiva a las hojas de vida va después del corte.
p8-p54-drive
9
Elegir entre comentarios predeterminados por etapa o textos dinámicos con consulta a la KB.
M2.3
RESUELTO 24/09 — R08.4: comentarios predeterminados del catálogo de cada equipo, con nota libre aparte que no los borra; la base de conocimiento sugiere al lado y no escribe en el informe.
anexo-9-comentarios
10
Definir el procedimiento de validación de informes antes de su emisión.
M2.5
RESUELTO 24/09 — R08.4: tres firmas (Elaboró, el técnico; Revisó, el Coordinador Técnico, la misma firma de Control de calidad; Aprobó, el Director Técnico); nadie valida lo que elaboró; validación única solo con ausencia registrada.
roles-validacion-informe
12
Decidir si se adopta la linealidad R² como criterio de aprobación en calibración.
M2.7
RESUELTO 01/10 — R08.4: por ahora no; se aprueba con los lineamientos del fabricante, que son los valores esperados y tolerancias de cada ítem de calibración del catálogo. La R² puede registrarse como dato informativo.
Regla de GN del 01/10
14
Confirmar si la entrada de remisiones_entrada procede de la plataforma de hojas de vida.
M2.5
RESUELTO 23/09 — R08.4: la tabla de remisiones de entrada la escribe Desk 2.0. Era una pestaña de una hoja de Google, que se sigue usando hasta el 14/12; mientras convivan, manda la aplicación. El uso actual de la hoja pasa al nº 90.
p14-remisiones-entrada · p14b-hoja-google
15
Decidir si se rehabilitan las rutas abreviadas para equipos sin novedad o de calibración directa.
M2.1 · F1C-08
RESUELTO 23/09 — R08.4: equipo sin novedad, no (recorre las etapas macro, como se decidió el 03/09); calibración directa, sí, con OV de calibración asignada, salida a la ruta completa si aparece una falla y paso por Control de calidad.
p15-p59-rutas
21
Definir qué ocurre si llega un equipo sin orden de venta previa.
M1.2
RESUELTO 10/09 (R08.2): OV obligatoria para trabajar, no para recibir; el estado de espera es Remisión creada, con alarma a los 3 días hábiles.
Decisiones del 10/09
27
Confirmar el almacén vectorial de la capa RAG.
M11.5 / M12.3
SUSTITUIDO en la R08 por el nº 51: antes de elegir el almacén hay que elegir la vía.
—
31
Definir la salida de emergencia de los cuatro estados de espera y su caducidad.
M1.3.4 · C3
RESUELTO 23/09 — R08.4 (corregido el 30/09): En espera de repuestos y Servicio externo tienen dos salidas que decide Comercial (Por Facturar cobrando el diagnóstico, o Anulado con motivo); Solicitado y En espera de SKU no se abandonan; la caducidad nunca ejecuta sola, notifica y sugiere; la salida la ejecuta la persona a cargo o, si no está, el Director o el Coordinador del área, con registro.
c3-salida-esperas · E-101
32
Decidir la introducción del estado Anulado con motivo y qué se hace con el histórico abandonado.
M1.10 · C2
RESUELTO 23/09 — R08.4: Anulado con cinco motivos; «creado por error» y «duplicado» se borran, no se anulan; el histórico se marca, no se reescribe, y lo marcado sale de las tres métricas. F1C-01, después del corte.
c2-anulado
33
Confirmar la corrección de C1 y decidir si «Liberación sin factura» sigue siendo un checkbox.
M1.3.5 · C1
RESUELTO 24/09 — R08.4 (corregido el 30/09): deja de ser checkbox. Antes del corte, solo el Director Comercial, con motivo de lista cerrada y fecha prevista de facturación; la alarma al vencer esa fecha llega con F1C-02, después del corte. La primera mitad se resolvió en F1A-01 el 09/09.
anexo-33-checkbox · E-102
34
Decidir cómo se conserva la fecha de la primera entrega en el ciclo facturar↔entregar.
M1.3.5 · C4
RESUELTO 23/09 — R08.4: dos ramas sin ciclo; Facturado es atributo (fecha de factura), no estado; Pendiente de facturar sí es estado y se sale con «Facturar» a Finalizado; la fecha de remisión de salida se escribe una sola vez.
c4-dos-ramas
35
Fijar la taxonomía de tipo de evento y aplicarla a las transiciones.
M1.8 · C5
RESUELTO 01/10 — R08.4: cuatro tipos (Operativo, Decisional, Compras/Logístico y Administrativo), uno por transición; el informe, en tres actos. Gerencia valida la tabla antes de aplicarla en F1C-04, después del corte.
c5-tipo-evento · corrección de GN del 01/10
36
Aceptar o no la pérdida de aviso entre las dos escrituras, y la compatibilidad del borrado de administrador con la auditoría inmutable.
M1.9.3 · M11.4
RESUELTO 24/09 — R08.4: se acepta, con una revisión nocturna que crea los avisos que falten; el borrado de administrador solo para tickets sin actividad real, con motivo de lista cerrada y registro inmutable; los tickets traídos de Zoho no se borran.
anexo-36-aviso
37
Decidir el destino de los cinco prefijos (MT, CG, HV, SR, PRO).
M1.1
RESUELTO 30/09 — R08.4: se suprimen en los tickets nuevos; la rama la indica la clasificación; los tickets existentes conservan el suyo. Antes de construir se comprueba si alguna automatización o carpeta de Drive depende del prefijo. Sustituye a lo decidido en la R08.
E-094
38
Definir las dos salidas de Verificación en equipo nuevo y la obligatoriedad por familia.
M1.4 · C12
RESUELTO 23/09 — R08.4 (precisado el 28/09): Verificación obligatoria para analizadores de gases y convertidores cuando hay gas patrón vigente del compuesto; el lote AP-370 de 2024 es el criterio, no un error; salida rechazada → Notificado. La Liberación exige el número del certificado de fábrica. En construcción (F1A-03).
p38-verificacion-calidad · f1a03-familia-y-gas-patron · f1a03-certificado-liberacion
39
Decidir el modelo de permisos de tres niveles (área · cargo · propietario del registro).
M1.9.1 · C10
RESUELTO 23/09 — R08.4, en el nivel cargo: el área es la base y el cargo solo restringe. Hay siete cargos y el «gerente comercial» es el Director Comercial. Excepciones: Liberación sin factura y prioridad Top 5 → Director Comercial; OVI de garantía → Director Técnico. Construido (F1C-05). El nivel propietario del registro queda aplazado por decisión y se adelanta solo para las salidas de emergencia.
c10-permisos-cargo · c10b-gerente-director
40
Confirmar si se recupera el SLA de un día sobre Notificado y si se extiende a otros estados de espera.
M1.7 · C11
RESUELTO 24/09 — R08.4: sí, en horas hábiles: Notificado, 9 h; Remisión creada, 27 h (solo sin OV); Notificación cliente, 36 h. Usan un único calendario laboral. Construido (F1B-08 y F1B-12). Que el aviso de Notificado vaya al Coordinador Comercial es supuesto de construcción, sin decisión expresa.
anexo-3-alerta · calendario-habil
43
Decidir si el servicio en sitio entra como cuarta rama del blueprint.
M1.6b · M1.5
RESUELTO 24/09 — R08.4: sí, en 2027 T2. En 2026 las visitas se registran por soporte remoto con «Modalidad: remoto / en sitio»; la guarda de remisión se mantiene sin excepciones.
anexo-43-en-sitio
44
Resolver cómo se lleva la precarga de repuestos a un borrador de cotización en Zoho CRM sin romper la política de solo lectura.
M11.1 · M1.11
RESUELTO 17/09 — R08.4: la aplicación no escribe en Zoho por ahora; el «espejo de Zoho» queda como línea futura condicional.
p44-escritura-zoho
45
Definir macro-fases de diagnóstico comunes a todas las marcas y modelos.
M2.1
RESUELTO 23/09 — R08.4: los N1 son propios de cada marca (Grimm EDM180: 8; Horiba: 10, válidos para los cuatro AP-370) y comunes dentro de cada familia; las cuatro macro-fases comunes quedan superadas. La R08.2 lo daba por resuelto con la decisión aún pendiente.
p45-macro-fases
46
Desarrollar los criterios analíticos de aprobación en calibración.
M2.7
RESUELTO 01/10 — R08.4, en lo que toca a la R²: se aprueba con los lineamientos del fabricante del catálogo y la R² no decide. Los criterios que exija la acreditación pasan al nº 84.
Regla de GN del 01/10
47
Fijar qué repuestos se adelantan al diagnóstico y cuáles esperan a la orden de compra.
M2.3 · M5.1
RESUELTO 24/09 — R08.4: en inventario se reserva siempre; de rotación se solicita hasta $3.000.000 COP por ticket sin esperar la orden; los específicos o de baja rotación esperan. Compras mantiene la marca de rotación por trimestre; el sistema no compra, genera la solicitud.
anexo-47-repuestos
52
Modelar las variantes reales de orden de venta.
M4.4 · M3.1
RESUELTO 10/09 (R08.2): 1 ticket : N OV y subórdenes OV-AAAA-NNN-SS. [R08.4] La titularidad OV ↔ equipo, que quedaba abierta, se cerró el 17, el 21 y el 23/09: el mantenedor se apunta en la hoja de vida (vacío significa que paga el dueño); solo el dueño o el mantenedor pagan órdenes del equipo; cualquier otra discrepancia se bloquea.
titularidad-ov-equipo · titularidad-mantenedor · mantenedor-campo-cuando
53
Definir cómo identifica el sistema que un ticket pertenece a un contrato, su prioridad y el informe trimestral.
M4.4 · M1.9.1
RESUELTO 24/09 — R08.4: registro de contrato creado por Comercial; un ticket es de contrato por su subOV, sin marca manual; cliente con contrato vigente → prioridad Alta, y con Top 5 manda la más alta; informe trimestral exportable y aviso de ritmo. Construido en F1B-11, salvo la ampliación (nº 70).
anexo-53-contratos
54
Decidir la convivencia con Google Drive.
M3.5
RESUELTO 21/09 — R08.4: el enlace a Drive se queda por capacidad de almacenamiento; ninguna versión lo sustituye.
p8-p54-drive
55
Definir el módulo de backup del sistema.
M11.5 · F1F-02
RESUELTO 24/09 — R08.4, salvo el proveedor: responsable, Alfonso. Copia nocturna y previa a cada cambio, con retención de 7 diarias, 4 semanales y 12 mensuales. Se guarda cifrada en almacenamiento de objetos de un proveedor distinto de Google y Hostinger, con bloqueo de borrado. La carpeta de servicio de Drive se copia cada semana y la restauración de prueba es mensual. El proveedor pasa al nº 72.
p55-backup · p55b-destino-copia
56
Verificar la norma de taxonomía de fallas: el 27/08 se citó ISO 14024, pero la estructura objeto·síntoma·causa·acción corresponde a ISO 14224.
M2.4 · M3.2
RESUELTO 24/09 — R08.4: ISO 14224 (2016) simplificada, como referencia y no para certificación; es la misma norma de M3.2.
anexo-56-taxonomia
59
Confirmar la ruta del equipo sin novedades.
M2.1
RESUELTO 23/09 — R08.4: recorre las etapas macro; con el checklist dinámico marca OK sin desplegar detalle. En el diagnóstico la foto sigue siendo solo con novedad; la foto obligatoria del 01/10 es la de las remisiones de entrada y salida.
p15-p59-rutas
60
Resolver qué criterio ordena el MVP: el de §3.1 o replicar la funcionalidad del Desk 1.0.
§3.1 · §3.2
RESUELTO 07/09 — R08.4: manda la paridad con el Desk 1.0, junto con el diagnóstico con checklist; los criterios de §3.1 ordenan lo que viene después. Lo confirma el corte en dos tiempos del 24/09: antes del 14/12, paridad con Zoho; lo que Zoho no tiene, después.
Decisiones del 07/09 (plan R01.1) · fecha-corte
61
Establecer el mecanismo de incorporación de lo decidido al documento maestro: quién avisa, con qué cadencia y contra qué fuente se comprueba.
§1.11
RESUELTO 24/09 — R08.4: la fuente es el registro de decisiones de Gerencia del repositorio; cada decisión anota en qué revisión entró. Una R08.x cada dos semanas, o antes si hay 10 pendientes. Ninguna decisión más de un mes pendiente; el barrido de lunes y jueves lo vigila.
anexo-61-incorporacion · barrido-comprobaciones-nuevas
62
Decidir qué se hace con la capa as-built: retirarla del cuerpo (27/08) o mantener la tabla de seguimiento del Anexo H.
§1.10 · Anexo H
RESUELTO 24/09 — R08.4: los dos criterios, cada uno en su sitio. Del cuerpo M1–M12 se retiran marcas, rutas y números de línea, y lo que tiene regla decidida se reescribe como regla de negocio. El Anexo H se mantiene y se genera desde el barrido de reconciliación. Aplicado en esta revisión.
p62-capa-as-built
64
Histórico de C1 que el arreglo no repara: liberaciones sin factura escritas antes del 09/09/2026.
M1.7 · C1
RESUELTO 24/09 — R08.4: se marcan; no se corrigen ni se excluyen. Las que siguen sin facturar se regularizan hacia adelante con un evento nuevo del Director Comercial. El recuento lo ejecuta Alfonso (nº 89).
p64-historico-c1 · p64b-quien-ejecuta
D.3 — Resumen a 01/10/2026
[R08.4] Hay 89 números en uso: del 1 al 91, sin el 19 ni el 22.
Resueltos o sustituidos: 38.
Resueltos en revisiones anteriores (5): 1, 2, 4, 21 y 52.
Sustituido (1): el 27, por el 51.
Resueltos en esta R08.4 (32): 3, 7, 8, 9, 10, 12, 14, 15, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 43, 44, 45, 46, 47, 53, 54, 55, 56, 59, 60, 61, 62 y 64.
Resueltos en parte: tres de los 32 lo están solo en parte, y lo que queda vive en otro punto: el 39 (el propietario del registro, aplazado por decisión), el 46 (los criterios de la acreditación, en el nº 84) y el 55 (el proveedor, en el nº 72).
Siguen abiertos: 51.
Heredados de revisiones anteriores (24): 5, 6, 11, 13, 16, 17, 18, 20, 23, 24, 25, 26, 28, 29, 30, 41, 42, 48, 49, 50, 51, 57, 58 y 63.
Nuevos (27): del 65 al 91.
Con plazo o que bloquean trabajo antes del corte del 14/12 (13):
67, 68, 69 y 70: bloquean el cierre de F1B-05, F1B-07, F1B-08 y F1B-11.
72: la copia nocturna no arranca sin él.
76, 79, 83 y 86: definen piezas que van antes del corte.
87: antes de renovar las licencias, el 21/12.
88: primera tarea de persona.
89: los recuentos vencen el 02/10 y el 09/10.
90: antes del 31/10.
Anexo E — Glosario
[R08.4] Glosario ampliado con los términos que introducen las decisiones del 17/09 al 01/10/2026 y ordenado alfabéticamente.
Término
Significado
ALM
Asset Lifecycle Management — gestión del ciclo de vida del activo.
Anulado
[R08.4] Estado terminal para el servicio que no se completa (corrección C2, decidida el 23/09). Cinco motivos: el cliente no aprueba o se echa atrás · sin solución técnica · repuesto no disponible · caducidad de la espera · otro, con texto obligatorio. «Creado por error» y «duplicado» no se anulan: se borran. Los anulados salen de las tres métricas de servicios cumplidos. Decidido y aún sin construir (F1C-01, después del corte).
as-built
Lo que la aplicación hace realmente, verificado en su código. Etiqueta introducida en la R04. [R08.4] Desde la decisión del 24/09 (p62-capa-as-built), la comparación entre lo planificado y lo construido vive solo en el Anexo H; en el cuerpo, la marca [AS-BUILT] se sustituye por [CONSTRUIDO] o el pasaje se reescribe como regla de negocio.
as-is
Lo que el proceso hacía en el sistema anterior, según mapeo manual y sin contrastar.
Blueprint
Definición del flujo de estados y transiciones de un tipo de ticket.
CG / MT
Nomenclatura de tickets de Zoho: calibración / mantenimiento. [R08.4] Suprimida en los tickets nuevos con el resto de prefijos (ver «Prefijo»).
CMMS
Computerized Maintenance Management System.
Como se encontró / como se dejó
[R08.4] Las dos lecturas de un valor medido cuando el técnico hace un ajuste: la del equipo tal como llegó y la del equipo tras el ajuste. Se guardan como dato numérico con su unidad, ligado a equipo, modelo, ítem del catálogo, fecha y ticket (modelo de datos del catálogo, F1D-01). Son la base del mantenimiento predictivo (M7.4) y un requisito de la trazabilidad de calibración (M9.2).
Construido
[R08.4] Marca del cuerpo del documento para lo que la aplicación ya hace hoy. Sustituye a [AS-BUILT].
Control de calidad
[R08.4] Estado entre En Proceso y Por Facturar (corrección C6, decidida el 23/09). El checklist se hace siempre; la verificación con gas patrón, solo cuando la pide el tipo de equipo y hay gas. Firma el Coordinador Técnico (la misma firma «Revisó» del informe), nunca quien hizo el trabajo. Aprobado → Por Facturar; rechazado → En Proceso con prioridad alta y retrabajo medido. No se entrega sin foto del equipo embalado y checklist firmado. Decidido y aún sin construir (F1C-07, después del corte).
Corte operativo
[R08.4] Primer tiempo del corte (decisión fecha-corte, corregida el 24/09): desde el lunes 14/12/2026 los tickets nacen en Desk 2.0 y Zoho Desk queda en solo lectura. Los tickets abiertos se migran el fin de semana 12–13/12 y la fecha se confirma el miércoles 9/12. Hasta que exista el correo propio, las respuestas al cliente salen del correo corporativo y se registran en el ticket.
CTP
Capable to Promise — cálculo de la fecha de entrega comprometible según capacidad real.
Derivación
Registro de a quién pasa el trabajo tras una transición; casilla «Derivado a». Ver M1.9.2.
Desk 2.0
Nombre interno de la plataforma Desk 2.0.
Días hábiles
[R08.4] De lunes a viernes, de 8 a 17 h (9 horas por día), sin festivos de Colombia ni cierres de empresa que registre Gerencia (calendario-habil, 24/09). Los calcula una sola función del calendario laboral (F1B-12, construido), que usan las alarmas, el reloj del SLA, el tiempo promesa, la fecha prevista de facturación y los indicadores en días hábiles. Los bodegajes se miden en días naturales.
EAM
Enterprise Asset Management.
Encargado de inventario
[R08.4] Quien entrega los repuestos al técnico. Recibe el ticket con «Solicitud repuestos» y lo devuelve al técnico que lo tenía con «Entrega de Repuestos» (corrección del 01/10). Si es un cargo nuevo o una persona nombrada sigue abierto (Anexo D).
Entregado
[R08.4] Estado obsoleto del blueprint de Zoho Desk, que sigue ahí porque Zoho no permite borrar lo que se usó. No existe en Desk 2.0 (corrección del 30/09, E-097). La guarda «no se entrega sin foto del equipo embalado» se refiere a la salida desde Por Entregar. Si la migración encuentra algún ticket en «Entregado», pasa a Finalizado; los pasos del historial se conservan.
Escaparate
Subconjunto de la KB Externa accesible sin contrato, que funciona como demostración del contenido completo.
Especialista técnico
[R08.4] Cargo que da de alta y administra los equipos propios de Ambientalia (patrones, gases patrón, instrumentos, herramientas) y recibe sus alertas de vencimiento (M3.1, GN 01/10). No está entre los siete cargos actuales; se añade a los permisos por cargo cuando se construya (Anexo D).
Estado de espera
Estado en el que el ticket espera a alguien. [R08.4] La aplicación clasifica once: cinco externas, en las que se espera al cliente o a un tercero y que paran el reloj del SLA (Notificación cliente, Por Entregar, Por Entregar / Sin facturar, En espera de repuestos y Servicio externo), y seis internas, que no lo paran (Notificación a Compras, Notificación Comercial, En espera de SKU, Solicitado, Liberación Comercial y Remisión creada). Las salidas de las cuatro esperas que no la tenían están en M1.3.4 (C3).
Estado terminal
Estado del que no sale ninguna transición. [R08.4] Hoy solo lo es Finalizado; Anulado (C2) lo será cuando se construya.
Guarda
Condición que debe cumplirse para permitir una transición de estado.
Hard allocation
Reserva firme de un repuesto.
Holgura
Porcentaje de la capacidad calculada que no se publica en la agenda del cliente, reservado para urgencias y desviaciones.
Independencia total
[R08.4] Segundo tiempo del corte, previsto para enero de 2027: cuando estén verificadas la repatriación del histórico (épica 1G) y el correo propio (épica 1H), se deja de consultar Zoho y se dan de baja sus licencias. Entre el corte operativo y la independencia se mantienen 2 licencias de Zoho en facturación mensual, de solo lectura (corte-licencias-plan-a).
ISO 14224
Norma de recolección e intercambio de datos de confiabilidad y mantenimiento. [R08.4] Se adopta la edición de 2016, simplificada, como referencia y no para certificación (M2.4, M3.2).
ISO 9001
Norma de sistemas de gestión de la calidad; marco de la trazabilidad exigida.
KB Externa
Base de conocimiento publicada a clientes; documentación controlada bajo ISO 9001.
KBI
Knowledge Base Interna — base de conocimiento de Ambientalia, para uso de sus técnicos.
Kitting
Agrupación lógica de partes para tareas recurrentes.
Lead time
Tiempo transcurrido entre dos hitos del proceso.
Macro-fase / micro-fase
Nivel grueso y nivel de detalle del diagnóstico. [R08.4] Los niveles macro (N1) son propios de cada marca y comunes dentro de cada familia tecnológica: 8 en el Grimm EDM180 y 10 en el Horiba, válidos para los cuatro AP-370 (p45-macro-fases, 23/09).
managed_by_app
Indicador que marca un ticket como gestionado por la app y lo saca del sincronismo con Zoho. Explica por qué las dos entradas no se cruzan.
Mantenedor
[R08.4] Cliente que paga las órdenes de venta de un equipo del que no es dueño (titularidad-mantenedor, 21/09). Se apunta en la hoja de vida; el campo es opcional y vacío significa que paga el dueño. Solo el dueño o el mantenedor pueden pagar órdenes de ese equipo; cualquier otra discrepancia se bloquea. Lo cambian Comercial y los administradores. Construido en F1B-02.
MCP
Model Context Protocol — protocolo por el que un agente consulta herramientas externas. En este proyecto es una de las vías candidatas para la capa de conocimiento (contra NotebookLM o contra los notebooks propios). No interviene en la conexión Zoho → PostgreSQL, que es un cliente REST propio con OAuth2. [R08.2]
MRO
Maintenance, Repair and Operations — inventario de mantenimiento.
MTBF / MTTR
Tiempo medio entre fallas / tiempo medio de reparación.
Nivel básico / nivel completo
Los dos escalones del área de cliente: sin contrato y con contrato de mantenimiento activo.
OC / OV
Orden de compra (cliente) / orden de venta.
Operadores
Columna de las hojas de mapeo donde se escribieron las condiciones de guarda de cada transición.
OTD
On Time Delivery — cumplimiento de la fecha prometida. [R08.4] Hay dos indicadores: el cumplimiento del taller (columna 54) y el cumplimiento global ante el cliente. Meta: más del 75 %, global y por cliente, como parámetro configurable (GN, 01/10).
Panel de supervisión
[R08.4] Canal por el que Gerencia decide y propone: el apartado 06 recoge preguntas y decisiones, cada una con su clave (por ejemplo, c7-reloj-sla), y el apartado 07, ideas, reglas y correcciones. Una tarea programada lo recoge los lunes y los jueves, registra cada entrada y la lleva al plan y al maestro (§1.11).
Paso sin botón
Cambio de estado que escribe el servidor, sin transición que el usuario pueda pulsar. Hay dos (M1.3.3).
Pendiente de facturar
[R08.4] Estado de la rama sin factura (corrección C4, decidida el 23/09): en él vive el equipo entregado y no facturado, y se mide su antigüedad. Se sale con la transición «Facturar», que registra la factura y su fecha, directamente a Finalizado. «Facturado» no es estado, es un atributo (la fecha de factura). Decidido y aún sin construir (F1C-02, después del corte).
pgvector
Extensión de PostgreSQL que permite almacenar y buscar vectores; almacén propuesto para la capa RAG.
Prefijo
Las tres letras iniciales del código de servicio: MT, CG, HV, SR o PRO (M1.1). [R08.4] Suprimido en los tickets nuevos desde la corrección del 30/09 (E-094): no se genera ni se pide en el alta, y la rama la indica solo la clasificación. Los tickets existentes conservan el suyo.
Propietario del registro
Quien tiene asignado el ticket, frente al área a la que pertenece. [R08.4] Nivel de permiso aplazado hasta que la restricción por cargo esté en marcha (c10-permisos-cargo), salvo para las salidas de emergencia de las esperas, que ejecuta la persona a cargo (E-101).
RAG
Retrieval Augmented Generation — patrón que hace que un modelo responda a partir de documentación propia recuperada, citando su fuente.
RCM
Reliability Centered Maintenance.
Registro de contrato
[R08.4] Ficha que crea Comercial al recibir la orden de compra de un contrato: cliente, lote (OV-AAAA-NNN), inicio y fin (anexo-53-contratos). Un ticket es de contrato cuando tiene asociada una subOV de un lote con contrato vigente; nadie lo marca a mano. Da prioridad Alta a los tickets del cliente y un informe trimestral exportable. Construido en F1B-11.
Remisión sin ticket
[R08.4] Remisión de entrada o de salida que no corresponde a un servicio técnico (préstamo o demostración, devolución o envío a proveedor, envío al fabricante por garantía, insumo, consignación u otro), creada desde el menú «Remisiones». Lleva la numeración común marcada «sin ticket», no cambia el estado de ningún ticket ni habilita servicio (corrección del 30/09, E-104). Antes del corte.
Reservar / solicitar
Reservar es ocupar un slot en firme (nivel completo); solicitar es pedir cita para que Comercial confirme (nivel básico).
Soft reservation
Compromiso preliminar de un repuesto al cotizar.
Technical Note (TN)
[R08.4] Formato único de todo instructivo o procedimiento publicado, en la base interna o en la externa: código (por ejemplo, TN-marca-número), título, versión, fecha, responsable de la aprobación, equipo al que va dirigida, contenido paso a paso y audiencia. Cada cambio es una versión nueva (M9.3, M12; GN, 01/10). Después del corte.
Tiempo promesa
Días hábiles que Servicio Técnico compromete al escalar el diagnóstico a revisión. Columna 52 del diccionario. [R08.4] Mide el cumplimiento del taller (columna 54).
Tiempo promesa global
[R08.4] Plazo que se comunica al cliente: tiempo de diagnóstico más los días de entrega fijados en «Escalado a Revisión». Antes del diagnóstico se estima con lo que tarda ese modelo según el historial, y al escalar se sustituye por el real. Se cuenta en días hábiles y excluye las esperas ajenas a Ambientalia (c7). Da el indicador de cumplimiento global ante el cliente (corrección del 30/09, E-095). Después del corte.
Token de acceso
Enlace de un solo uso y alcance limitado enviado por correo, que da entrada al nivel básico del portal sin registro.
Transición
Paso de un estado a otro; lleva el nombre del botón, un área que puede ejecutarla y sus campos.
Ubicación bin
Posición precisa de almacenamiento dentro del almacén.
WIP
Work in progress — trabajo en curso.
Anexo F — Fuentes
Fuente
Aportación a este documento
Notion → Ideas
Visión funcional, informes, taxonomía de fallas, análisis, hojas de vida, QAQC, automatizaciones, arquitectura, garantías, futuro, IA, KPIs, inventarios.
Notion → IA
Tres estudios: benchmark de 12 herramientas, especificación funcional CMMS/EAM, y Estudio Funcional de Taller de Servicio.
Notion → analisis-tickets → Flujo servicio-tecnico
Mapeo as-is de estados y transiciones. Sustituido en la R04 por la lectura del código — ver M1.3.6.
Notion → analisis-tickets → Flujo equipo-nuevo
Tabla de transiciones con área responsable y tipo de evento.
Notion → analisis-tickets → Flujo soporte-remoto
Tabla de transiciones del soporte remoto.
Notion → analisis-tickets → Funcionalidades
Dashboard, predicciones, capacidades y futuro.
Notion → analisis-tickets → KPIs
Las dos tablas de indicadores con fórmula, fuente, frecuencia, dueño y umbral.
Notion → analisis-tickets → Diccionario de campos
Reconstruido en la R05 a partir del documento «Diccionario de Campos Tickets» — Anexo G.
Notion → Flujo comercial / Flujo posible-cliente
Transcritos en la R05 a partir de la hoja DFcomercial050226 — M1.11 y M1.12.
Decisiones del 17/02, 19/02, 14/08 y 20/08 de 2026
Decisiones firmes, tareas, restricciones, plazos y puntos abiertos.
Decisiones del 21/08/2026 (incorporadas en la R02)
Conexión Zoho → PostgreSQL (cliente REST propio con OAuth2), autocompletado por serial, OV previa a la recepción, menú visual de accesorios, interfaz que replica Zoho Desk, piloto Grimm EDM 180/280 y el módulo de digitalización del conocimiento. (Incluían además el portal del empleado, retirado del alcance en la R06 — ver §1.3.)
Esquema de ejes de valor, 21/08/2026 (incorporado en la R03)
Marco de los tres ejes y su orden de construcción, el error de digitación como riesgo rector, la capa RAG con KBI y KB Externa, el agente conversacional y sus límites, el área de cliente en dos niveles, el agendamiento contra la carga del taller y la distribución de firmware a clientes registrados.
Fuente de código, nueva en la R04. Commit a3a8f03 del 21/08/2026.
Archivo
Aportación a este documento
packages/shared/src/transitions.ts
El grafo completo: 34 transiciones, sus etiquetas, sus campos y sus áreas.
apps/desk/server/transitionExec.ts
El motor que ejecuta las transiciones y comprueba los campos obligatorios. Origen del hallazgo M-2.
apps/desk/server/db/estadoPorRemision.ts
Los dos pasos sin botón y la regla que impide cruzar las dos entradas.
packages/shared/src/permissions.ts
Qué área puede ejecutar cada transición.
apps/desk/server/services/ticketService.ts · services/avisoArea.ts
La derivación, el cálculo del destinatario del aviso y su escritura fuera de la transacción.
debt.md
La deuda técnica registrada; M-2 es la que tiene efecto funcional.
[R08.4] Es la fuente de la R04 y se conserva como referencia histórica. Las cifras vigentes del grafo están en M1.3 (31 transiciones de servicio técnico tras las correcciones del 30/09) y el estado de lo construido, en el Anexo H.
Decisiones incorporadas en la R08.1 y la R08.2.
Fuente
Aportación
Notion → Desk 2.0, 27/08/2026
Ocho temas y once decisiones firmes: arquitectura híbrida de macros y checklists, subdivisión de órdenes de venta, código interno del cliente, informe de salida, captura en base de datos, portal como etapa independiente, vía de escape manual, y QR e incertidumbre en certificados. No estaba recogido en ninguna revisión anterior.
Notion → Desk 2.0, 03/09/2026
A la fecha de cierre de la R08.1 solo se conocían los asuntos pendientes: los nueve entregables, las ocho cuestiones por decidir y el criterio de MVP propuesto. [R08.2] Lo decidido el 03/09 se incorporó en la R08.2 (Anexo C.10).
Decisiones de Gerencia del 10/09/2026 y registro de correcciones F0-01 (incorporados en la R08.2)
Verificación con salida, subórdenes OV-AAAA-NNN-SS, cardinalidad 1 ticket : N OV, OV obligatoria para trabajar y no para recibir, fechas derivadas impuestas por el servidor y mapa del blueprint generado desde el código; correcciones trazables contra el código (Anexo I.2).
Fuentes de mapeo, nuevas en la R05.
Documento
Fecha
Aportación
DFserviciotecnico160226.xlsx
16/02/2026
35 filas con origen, transición, destino, área, tipo de evento, descripción, campos con obligatoriedad y condiciones de guarda. Coincide con el código en las 34 transiciones (M1.3.9).
DFequiponuevo030226.xlsx
03/02/2026
Flujo de equipo nuevo: 5 transiciones. Corrige M1.4. [R08.2] Son 6 con la salida de Verificación por Liberación (M1.4).
DFsoporteremoto030226.xlsx
03/02/2026
Flujo de soporte remoto: 4 transiciones. Confirma M1.5.
DFcomercial050226.xlsx
05/02/2026
Flujos comercial y posible-cliente. Origen de M1.11 y M1.12.
Diccionario de Campos Tickets
—
Las 59 columnas y las fórmulas de los indicadores derivados. Anexo G.
Blueprints de Zoho Desk (capturas)
21/08/2026
Confirman los cuatro grafos, el SLA de un día sobre Notificado y el estado Entregado desconectado. [R08.4] «Entregado» es un estado obsoleto de Zoho que no existe en Desk 2.0 (E-097).
Fuentes incorporadas en la R08.4.
Fuente
Fecha
Aportación
Panel de supervisión de Gerencia, apartado 06 (decisiones)
17/09 al 01/10/2026
Texto literal de 69 decisiones, cada una con su clave (por ejemplo, c7-reloj-sla). Es la fuente principal de lo que decide la R08.4; registro en el Anexo C.12 y en I.3.
Panel de supervisión de Gerencia, apartado 07 (ideas, reglas y correcciones)
24/09 al 01/10/2026
43 entradas, entre ellas las correcciones del 30/09 (E-094 a E-107) y las ideas y correcciones de GN del 01/10.
Revisión de GN sobre el borrador R08.3
30/09 y 01/10/2026
Comentarios resaltados sobre el texto de la R08.2, integrados en el cuerpo de la R08.4.
Plan de fases y tandas R01.3
24/09/2026
Corte en dos tiempos, épicas 1G (repatriación del histórico) y 1H (correo propio), 66 tandas, 35 de ellas antes del corte, cuenta de margen (+1,9 a +2,2 semanas) y medidas M1, M2 y M3. El catálogo de tandas es el §5 de la R01.1 más las filas de la R01.3.
Expediente de cambios R08.3
15/09 al 30/09/2026
Lo construido que la R08.2 no reflejaba y el índice, por punto del maestro, de las decisiones del 17/09 al 28/09 (§11 a §15).
Expediente de cambios R08.4
01/10/2026
Precisiones del 28/09 sobre la Verificación, las nueve correcciones del 30/09 que tocan el maestro, el cambio de las cifras ancladas (31 transiciones) y la prioridad Top 5.
Parte de desvíos del 01/10/2026
01/10/2026
Estado medido de tandas, decisiones y cifras contra el commit e3d5e90. Base del Anexo H.
Preguntas de Gerencia del 29/09/2026
29/09/2026
Preguntas abiertas que bloquean filas del plan (Anexo D).
Plan de independencia de Zoho Desk
—
Medidas M1, M2 y M3 y diseño de las épicas 1G y 1H.
Mapa visual del blueprint [DECIDIDO 10/09 — R08.2]. El mapa visual del blueprint se genera desde el código (docs/artefactos/blueprint-*.md, generador construido en F1A-06) y una prueba impide que quede desfasado. Las fichas de hallazgos viven en los documentos de auditoría, no en el mapa. El artefacto interactivo anterior, «Blueprint de Servicio Técnico — mapa de transiciones», se retira como histórico congelado en el commit a3a8f03. Por qué: «se actualiza con cada auditoría» no era un mecanismo, era una promesa, y nadie la cumplió.
Mapa del blueprint dentro de la aplicación [DECIDIDO 24/09/2026 — R08.4]. El mapa se mostrará en la entrada «Blueprint (estados y transiciones)» de Configuración, hoy reservada, con el diagrama completo y una vista por cada fase, generado desde el código, vigilado por la misma prueba y con las reglas de acceso del resto de Configuración (mapa-en-la-app). Es fila propia del plan, de talla XS o S según si la compilación puede producir la imagen del diagrama. Va después del corte del 14/12 (mapa-antes-o-despues-del-corte), lo que deja sin efecto el «antes de F1B-06» de la primera decisión. Motivo: Servicio Técnico y Comercial no abren el repositorio para ver el diagrama.
Recuento del mapa [R08.4]. El mapa de M1.3.7 cuenta filas, no transiciones: a las 34 transiciones con botón suma los dos pasos sin botón y repite «Habilitar Servicio» por cada uno de sus orígenes, y así llegaba a 38. Con las tres transiciones que se retiran el 30/09 («Marcar como pendiente» y las dos «Servicio externo» hacia Por Facturar, E-103 y E-106), la rama de servicio técnico pasa a 31 transiciones y el mapa a 35 pasos. La cifra de referencia es la del mapa generado desde el código.
Sobre la cobertura. De los cuatro vacíos que arrastraba este documento —el diccionario de campos, los dos diagramas comerciales y las cinco imágenes de la página de KPIs— la R05 cierra los tres primeros. Queda abierto el punto 16 (Anexo D), aunque el Anexo G cubre buena parte de su contenido: los once indicadores calculados y sus fórmulas.
Sobre la naturaleza de la R03. Aquella revisión no incorporó decisiones nuevas. Formalizó el marco de intención que estructura las decisiones ya tomadas y especificó dos áreas que hasta entonces existían como enunciado: la capa de conocimiento y el área de cliente. Ninguna decisión anterior quedó revocada.
Sobre la naturaleza de la R04. Esta revisión tampoco incorporó decisiones nuevas, y tampoco revocó ninguna. Lo que hizo es distinto de todo lo anterior: contrastó el documento contra el código y corrigió lo que no coincidía. Fue la primera vez que una parte de esta especificación dejó de ser lo que se quiere construir para pasar a ser lo que está construido.
Sobre la naturaleza de la R05. Tampoco incorporó decisiones nuevas ni revocó ninguna. Lo que hizo fue volver a las fuentes: recuperó las hojas de mapeo y el diccionario que estaban detrás de los resúmenes, y con ellos cerró tres puntos abiertos, corrigió un módulo y matizó una afirmación de la R04.
Sobre la verificación, al cierre de la R05.
Flujo
Estado de verificación
Servicio técnico
Verificado contra el código y contra la hoja del 16/02. Las tres fuentes coinciden.
Equipo nuevo
Verificado contra la hoja del 03/02 y el blueprint de Zoho. Corregido: son 5 transiciones, no 6. No implementado aún.
Soporte remoto
Verificado contra la hoja del 03/02 y el blueprint. Correcto. No implementado aún.
Comercial · posible-cliente
Transcritos de la hoja del 05/02. Pendiente de resolver una discrepancia entre hoja y diagrama (punto abierto nº 42).
Ya no queda ningún flujo cuya única referencia sea un resumen de segunda mano. [R08.4] Estado a 01/10/2026: equipo nuevo (6 transiciones, con la salida de Verificación) y soporte remoto (4) están construidos en F1B-06; los flujos comercial y posible-cliente se quedan en Zoho CRM en 2026 (flujos-comercial). Detalle en el Anexo H.
Anexo G — Diccionario de campos de la tabla de tickets
Fuente: «Diccionario de Campos Tickets.csv». Incorporado en la R05; cierra el punto abierto nº 2.
Las 59 columnas de la tabla de tickets del sistema actual, agrupadas por naturaleza. Es el punto de partida del modelo de datos de Desk 2.0: qué existe hoy, qué significa y cómo se calcula lo que se calcula. [R08.4] Los indicadores que Desk 2.0 tiene que seguir calculando antes del corte están en G.6b.
G.1 Identificación del ticket y del cliente
Col.
Campo
Contenido
3
Correo electrónico
Email del cliente.
4
Contact Name
Nombre del cliente.
5
Asunto
Nombre del ticket. Estructura normalizada: Tipo de servicio + Nombre del cliente + Tipo de equipo + Prefijo_NúmeroSerie_Modelo_AAMMDD. Ver M1.1. [R08.4] En los tickets nuevos el asunto normalizado va sin prefijo (corrección del 30/09, E-094); los existentes conservan el suyo.
8
ID de la solicitud
Número consecutivo del ticket.
22
Descripción
Comentario de Servicio Técnico; campo por defecto del sistema al crear el ticket.
34
NIT
Identificador tributario del cliente.
G.2 Estado, ciclo de vida y clasificación
Col.
Campo
Contenido
6
Estado
Estado del ticket según el diagrama de flujo. [R08.4] Los estados de Desk 2.0 son los del Anexo B. «Entregado» es un estado obsoleto de Zoho que no existe en Desk 2.0 (E-097).
7
Hora de modificación
Se actualiza automáticamente en cada cambio de estado y en cada comentario nuevo.
11
Clasificaciones
Mantenimiento · equipo nuevo · soporte remoto. Es el campo que activa los distintos flujos de trabajo (M1.2). [R08.4] Desde la supresión de los prefijos (E-094) es lo único que indica la rama del ticket.
12
Hora de actualización del estado
Marca de tiempo de cada transición. En tickets cerrados, el paso a Finalizado.
13
Hora de reapertura de la solicitud
Último paso de la categoría EN ESPERA a ABIERTO. Coincide con los comentarios del área comercial previos a la ejecución.
19
Status Group
Completed / In Progress.
27
Tipo de Servicio
Calibración · Diagnóstico · Garantía · Mantenimiento · No aplica · Otro. Segunda dimensión, distinta de la rama (M1.2).
G.3 Equipo
Col.
Campo
Contenido
25
Modelo de equipo
Modelo del analizador.
26
Serial
Código alfanumérico único de fábrica. Es la llave del registro (M1.1).
28
Ciudad
Ubicación del cliente.
30
Equipo
Tipo o nombre del equipo (monitor de partículas, analizador de NOx…).
31
Marca
Horiba, GRIMM Aerosol Technik…
32
Código Servicio
Tiposervicio_NumeroSerie_Modelo_aammdd. Ejemplo: MT_18A20070_EDM180C_260130. [R08.4] El prefijo del tipo de servicio (MT, CG, HV, SR o PRO) ya no se genera en los tickets nuevos ni se pide en el alta (E-094, 30/09); los tickets existentes, traídos de Zoho o creados en Desk 2.0, lo conservan tal como están. Antes de construirlo hay que comprobar si alguna automatización o carpeta de Drive depende del prefijo.
33
Código Interno
Código que el cliente asigna a su equipo. Se requiere para los entregables cuando el cliente lo pide.
G.4 Personas, prioridad e interacción
Col.
Campo
Contenido
9
Prioridad
High: clientes con análisis favorable o contrato prioritario · Medium: estándar · Low: clientes con análisis desfavorable. El diccionario anota que debe conectarse con la aplicación de calificación de clientes y asignarse desde la creación del ticket por Comercial — es el criterio de la priorización automática decidida el 14/08. [R08.4] La prioridad se fija en el cliente: con contrato vigente, Alta; los Top 5 la reciben a mano del Director Comercial; al nacer el ticket manda la más alta de las dos. El ajuste por ticket solo cabe en clientes Top 5, con motivo, y el técnico ya no puede cambiarla (M1.9).
29
Encargado
Persona de Ambientalia responsable del ticket.
35
Correo Encargado
Ligado directamente a la columna 29.
16
Número de comentarios
Total de comentarios de todas las áreas. El diccionario lo propone como medida del desgaste en la atención del ticket. [R08.4] Queda fuera de los indicadores que continúan antes del corte: no se usa (e009b-lista-indicadores).
55
Calificación de satisfacción
La que el cliente da en el correo de finalización. Hoy sólo se usa para el reporte trimestral. [R08.4] Entra en la lista cerrada de indicadores que continúan antes del corte (G.6b). Entre el 14/12 y la independencia, Comercial envía la encuesta a mano con un formulario de Google y las respuestas se cargan en enero; la encuesta automática llega con el correo propio (1H). Cuando recoge el propio cliente se le ofrece además una encuesta en tableta (E-096): cada calificación guarda su canal (correo o tableta) y el indicador se da por canal.
G.5 Fechas de hito
Son las que alimentan todos los indicadores derivados. La columna «Se escribe en» indica la transición del blueprint que la rellena, según la hoja del 16/02.
Col.
Campo
Se escribe en
36
Hora de creación
Creación del ticket.
38
Fecha creación ticket
Ingreso a Servicio (validación).
39
Fecha Remisión Entrada
Ingreso a Servicio — llegada del equipo a las instalaciones. Obligatoria. [R08.4] Es la que registra la aplicación y arranca el bodegaje de entrada (M1.10).
43
Fecha Orden De Venta
Habilitar Servicio (formaliza la activación del ticket) y Aprobación y S. Repuestos (packages/shared/src/transitions.ts:199). [R08.2] [R08.4] Si la orden de venta se eligió en la aplicación, manda la aplicación y la sincronización con Zoho no pisa ni el número ni su fecha; si no, manda Zoho (e005-iv4-iv11).
42
Fecha Orden de Compra
Aprobación · Aprobación y S. Repuestos. [R08.2] Habilitar Servicio no la escribe: omisión documentada y razonada en packages/shared/src/transitions.ts:179-180.
41
Fecha de Cotización
Notificación cliente y Notificación cliente (SKU).
40
Fecha Revisión Informe
Reporte por garantía y Escalado a comercial.
52
Días de entrega
Escalado a Revisión. Es el Tiempo promesa (M4.2). Obligatoria. [R08.4] Es el plazo del taller. El tiempo promesa global que se comunica al cliente le suma el tiempo de diagnóstico (E-095).
44
Fecha Recepción de repuestos
Llegada de repuestos. Obligatoria.
45
Fecha Finalización ST
finalización de servicio.
46
Fecha De Factura
Facturado y facturado y cierre de TK. Obligatoria. [R08.4] Con C4 (decidida el 23/09, F1C-02) «Facturado» deja de ser estado y pasa a ser este campo; en la rama sin factura lo escribe la transición «Facturar», de Pendiente de facturar a Finalizado.
—
Fecha Salida Servicio externo
Calibración de sensores ext. (desde Rev./Diagnostico y desde En Proceso).
—
Fecha Entrada servicio externo · Conformidad
Retorno de servicios externos.
—
Fecha Remisión de Salida
Entrega al cliente y Entrega al cliente sin factura. Hoy la reescribe cada vuelta del ciclo — ver M1.3.5. [R08.4] Con C4 se escribe una sola vez (F1C-02, después del corte). Es la fecha de la remisión de salida que exige la guarda de entrega (M1.7).
—
Fecha Notificación por garantía
Notificación por garantía.
—
Fecha solicitud SKU
Solicitud SKU.
G.6 Indicadores calculados
Col.
Indicador
Fórmula o definición
47
Tiempo permanencia
Entre remisión de entrada y remisión de salida. Es el dock-to-dock.
48
Tiempo inicio de servicio
Fecha creación ticket − Fecha Remisión Entrada. Inválido para 2026 (M1.10). [R08.4] Fuera de la lista de continuidad: lo sustituyen los tres bodegajes (F1A-04).
49
Tiempo de diagnóstico
Fecha Revisión Informe − Fecha creación ticket. Hereda el problema del 48. [R08.4] En Desk 2.0 se mide sobre las marcas de tiempo de las transiciones (base construida en F1A-04) y entra en la lista de continuidad.
50 · 53
Tiempo de servicio
Días hábiles desde Fecha Orden De Venta —o desde Fecha Recepción de repuestos, si la hubo— hasta Fecha Finalización ST. Devuelve 0 si el resultado es negativo o falta la fecha de finalización. [R08.4] Usa el calendario laboral (F1B-12, construido).
51
Tiempo recogida del equipo
Hora de actualización del estado − Fecha Finalización ST.
54
Cumplimiento del tiempo promesa
Cumple / No cumple, comparando el tiempo total de servicio contra los días de entrega comprometidos. Es el OTD tal como se calcula hoy — ver M7.1. [R08.4] Es el cumplimiento del taller, contra la columna 52. Se le suma un segundo indicador, el cumplimiento global ante el cliente, contra el tiempo promesa global (E-095).
56
Tiempo bodegaje de ingreso
Fecha creación ticket − Fecha Remisión Entrada. Inválido para 2026 (M1.10). [R08.4] Fuera de la lista de continuidad: lo sustituyen los tres bodegajes (F1A-04).
57
Tiempo de cotización
Entre Fecha Revisión Informe y Fecha de Cotización.
58
Tiempo de orden de compra
Entre Fecha Orden de Compra y Fecha de Cotización. Es el aging de aprobación.
59
Tiempo de orden de venta
Lo que tarda en generarse la orden de venta.
G.6b Indicadores que continúan antes del corte
[DECIDIDO 24/09/2026 — R08.4] (e009-kpis, e009b-lista-indicadores). Antes del corte del 14/12, Desk 2.0 calcula sobre las marcas de tiempo de las transiciones una lista cerrada de nueve indicadores del diccionario, para que no se pierda nada de lo que hoy calcula Zoho Desk. Se entregan como tabla exportable, sin tablero, semáforos ni umbrales, en la tanda F1F-05.
Comprobación. Durante las cuatro semanas previas al corte, los nueve se calculan en la aplicación sobre los mismos tickets que tiene Zoho. Se dan por buenos si coinciden en al menos el 95 % de los tickets, con una diferencia máxima de un día en los tiempos; cada diferencia mayor se explica por escrito. Si a la aplicación le falta algún hito para calcular uno de ellos, se dice antes de construir y se decide aparte.
#
Col.
Indicador
Nota
1
47
Tiempo de permanencia
Dock-to-dock.
2
49
Tiempo de diagnóstico
Sobre las marcas de tiempo de las transiciones.
3
50 · 53
Tiempo de servicio en días hábiles
Necesita el calendario laboral (F1B-12, construido).
4
51
Tiempo de recogida del equipo
—
5
54
Cumplimiento del tiempo promesa (del taller)
Contra los días de entrega de la columna 52.
6
55
Satisfacción del cliente
Necesita que la encuesta siga saliendo tras el corte (G.4). Desde la encuesta en tableta (E-096), se da por canal y con el número de servicios que tienen al menos una calificación.
7
57
Tiempo de cotización
—
8
58
Tiempo de orden de compra
—
9
59
Tiempo de orden de venta
—
10
—
Cumplimiento global ante el cliente
[DECIDIDO 30/09/2026 — R08.4] Décimo indicador, contra el tiempo promesa global (E-095). Funcionalidad nueva: va después del corte.
Fuera de la lista: las columnas 48 y 56, inválidas desde 2026 y sustituidas por los tres bodegajes (F1A-04), y la 16, que no se usa.
Umbral. [R08.4] La meta del OTD es un cumplimiento superior al 75 %, global y por cliente, como parámetro configurable que se puede subir cuando el proceso mejore (GN, 01/10). Los umbrales y semáforos llegan en Fase 2; antes del corte la tabla va sin ellos. Queda abierto si la meta se aplica a los dos indicadores de cumplimiento (Anexo D).
Reentrancia. Los indicadores 47, 50 · 53, 57 y 58 pueden romperse si un ticket vuelve a pasar por un estado que ya contó una vez. Está abierto como punto 66 del Anexo D.
G.7 Columnas marcadas como no relevantes
El diccionario descarta expresamente doce columnas: 1 (ID de sistema), 2 (nombre de contacto de sistema), 10 (tiempo de respuesta del cliente), 14 (hora de asignación), 15 (modificado por), 17 (tiempo de resolución en horario laboral), 18 (Ticket Age in Days), 20 (Completion Age Tier), 21 (Ticket handling Mode), 23 (nombre de empresa), 24 (tiempo en espera del ticket) y 37 (fecha de vencimiento del sistema).
Son las primeras candidatas a no migrar. Conviene, eso sí, revisar dos de ellas antes de descartarlas: la 14 y la 17 miden cosas que el cuadro de mando de M7.1 sí quiere —asignación y tiempo efectivo en horario laboral—, y es posible que se descartaran por poco fiables en Zoho y no por poco útiles.
G.8 Cómo usar este anexo
Para el modelo de datos (M7.6): G.5 y G.6 son el mínimo que Desk 2.0 tiene que conservar para que los indicadores existentes sigan calculándose. G.7 es lo que puede quedarse atrás.
Para la continuidad de indicadores antes del corte (F1F-05): G.6b es la lista cerrada y su criterio de aceptación.
Para la migración del historial (M3.5): la correspondencia de estados hay que leerla del propio Desk 1.0, pero la de campos está aquí.
Para las correcciones: [R08.4] la Fecha Remisión de Salida de G.5 es la que C4 deja de sobreescribir (F1C-02); las columnas 48 y 56 las sustituyen los tres bodegajes de C9, construidos en parte (F1A-04), y la 49 se mide sobre las marcas de tiempo de las transiciones.
Anexo H — Seguimiento: as-built frente a plan
Nuevo en la R08. Es la tabla de control del proyecto: qué se planificó, qué está construido, y dónde están las diferencias. [R08.4] Estado a 01/10/2026.
H.1 Cómo se lee y cómo se mantiene
Este anexo responde a una pregunta que el resto del documento no responde de un vistazo: de todo lo que aquí se especifica, ¿qué existe realmente?
[DECIDIDO 24/09/2026 — R08.4] Es el único lugar del maestro donde se compara lo planificado con lo construido (p62-capa-as-built). El cuerpo (M1–M12) describe cómo debe funcionar el sistema y marca con [CONSTRUIDO] lo que la aplicación ya hace, sin rutas de ficheros ni referencias al código. Este anexo sí conserva las referencias técnicas.
Tres columnas y una regla:
Plan — lo que el documento especifica o Gerencia decidió.
Construido — lo verificado en el código o en la aplicación en uso, con su fuente.
Diferencia — la brecha, nombrada. No «pendiente», sino qué falta y por qué importa.
La regla es que lo construido no se recuerda: se verifica. Cada línea de esa columna procede de una lectura del código, de una hoja de mapeo, del blueprint de Zoho o del barrido del repositorio, y la R05 dejó claro por qué importa: durante tres revisiones el documento describió un flujo que no era el implementado, y nadie lo notó porque una tabla mal resumida se lee igual de bien que una correcta.
Cadencia [R08.4]. El anexo deja de redactarse a mano: en cada revisión R08.x se genera a partir del barrido de reconciliación del repositorio (docs/sdd/RECONCILIACION.md, npm run reconcile), con la fecha y el commit contra el que se midió. Esta edición se ha redactado todavía con el estado del parte de desvíos del 01/10/2026 (medido contra el commit e3d5e90) y con el plan R01.3; la siguiente sale del barrido.
La aplicación ya está en uso [R08.4]. Lo que la R08 llamaba demostrador es hoy la aplicación en uso (Desk_2_R1.023), y se trabaja directamente sobre ella, sin copia de pruebas (decidido el 21/09). En este anexo, «construido» significa cambio archivado y fusionado en la rama principal; cuando falta verificarlo en la aplicación después de desplegar, la fila lo dice.
H.1b Estado de las tandas a 01/10/2026
[R08.4] Plan R01.3: corte operativo el 14/12/2026 e independencia total en enero de 2027. «Antes del corte» es paridad con Zoho Desk; «enero» son las épicas 1G y 1H; «después del corte» es lo que Zoho no tiene.
Épica
Cuándo
Cerradas
En curso o parciales
Sin empezar
Fase 0 · método
Antes del corte (F0-06, después)
F0-00, F0-01, F0-02, F0-03, F0-04 (sin el staging, retirado el 21/09) y F0-05
—
F0-06, vigilancias del barrido
1A · correcciones inmediatas
Antes del corte
F1A-01, F1A-02, F1A-04, F1A-05, F1A-06, F1A-07 y F1A-08
F1A-03, Verificación de equipo nuevo (desbloqueada el 28/09)
F1A-09, barrido de citas (prevista en la semana 38)
1B · paridad y recepción
Antes del corte
F1B-01, F1B-02, F1B-06, F1B-10, F1B-12 y F1B-14
F1B-04, recepción (parcial) · F1B-07, prioridad Top 5 y orden de la cola (en curso) · F1B-08, tablero y alarmas en horas hábiles construidos, faltan las «vistas equivalentes a Zoho» · F1B-11, tres cambios construidos, falta la ampliación de contrato
F1B-03, F1B-05, F1B-09 y la ficha de garantía con el proveedor
1C · correcciones del blueprint (C1–C12)
La restricción de «Liberación sin factura» por cargo, antes del corte; el resto, después
—
F1C-05, permisos por cargo: nivel cargo construido, falta el propietario del registro
F1C-01, F1C-02, F1C-03, F1C-04, F1C-06, F1C-07 y F1C-08
1D · diagnóstico con checklist
Después del corte
—
—
F1D-01 a F1D-09
1E · informes
Después del corte
—
—
F1E-01 a F1E-05
1F · corte
Antes del corte
—
—
F1F-01 a F1F-05 (migración, respaldo, pruebas, formación y continuidad de indicadores con encuesta)
1G · repatriación del histórico
Enero de 2027
—
—
1G-01 a 1G-04
1H · correo propio
Enero de 2027
—
—
1H-00 a 1H-03
Mapa del blueprint en la aplicación
Después del corte
—
—
Una fila
Cifras. El plan R01.3 cuenta 66 tandas: 35 antes del corte, 8 en enero (1G y 1H) y 23 después del corte, sin fecha. Cerradas a 01/10/2026: 19 de 66, todas de las que entran antes del corte (19 de 35). El parte del 01/10 cuenta 18 (12 cierres derivados de la cabecera de cada cambio y 6 nombrados por commit); la diferencia es F0-04, cerrada sin su parte de staging, que el barrido no recoge. La cuenta del 24/09 daba al corte operativo un margen de +1,9 a +2,2 semanas, por encima de la semana exigida, así que el plan A (corte único el 01/02/2027) no se activa; los riesgos que pueden comerse ese margen están en §3.5.
Diferencias que conviene tener delante:
Recuento. La tabla nombra 19 identificadores como cerrados y el parte cuenta 18. La diferencia de uno queda por conciliar en el próximo barrido.
Denominador. El barrido sigue leyendo el catálogo del §5 de la R01.1, donde F1B-12 y F1B-14 no tienen fila; hasta que las filas de la R01.3 se escriban ahí, el barrido y este anexo pueden dar cifras distintas.
Trabajo decidido sin fila. Varias piezas del 30/09 y el 01/10 con fecha «antes del corte» —remisiones sin ticket, aviso «En garantía», registro del SKU con aviso al técnico, entre otras— no tienen todavía fila del plan (§3.4 y Anexo D).
Tareas de persona que bloquean. El proveedor de las copias sigue sin elegir, y sin destino la copia nocturna no puede arrancar. Los recuentos contra producción (liberaciones sin factura anteriores al arreglo de C1, candidatos a Anulado, catálogo de modelos) no tienen cifra en el repositorio. Las medidas M1, M2 y M3 del plan de independencia siguen siendo la primera tarea, porque fijan la talla de 1G y 1H.
H.2 Los cuatro flujos
Flujo
Plan
Construido
Diferencia
Servicio técnico
[R08.4] 31 transiciones y 35 pasos del mapa, tras retirar «Marcar como pendiente» y las dos «Servicio externo» hacia Por Facturar, y con «Diagnóstico complementario» saliendo de En Proceso (30/09). «Pendiente» deja de usarse en esta rama. Estados decididos: Anulado, Pendiente de facturar y Control de calidad
34 transiciones, que cuadran con el maestro anterior. Red de pruebas del motor desde F0-04: 110 ficheros y 931 pruebas sobre el commit ad1875b (96 y 830 en el baseline)
Retirar las tres transiciones, mover el origen de «Diagnóstico complementario», dejar «Rechazo» desde Notificación cliente solo a Comercial y derivar Solicitud y Entrega de repuestos al encargado de inventario: antes del corte. Los tres estados decididos van con 1C, después del corte. El código declara 23 estados entre las tres ramas (con Verificación y Solicitud Soporte) frente a los 21 del maestro anterior
Equipo nuevo
6 transiciones, 5 estados. Verificación obligatoria por tipo de equipo cuando hay gas patrón vigente; certificado de fábrica en la Liberación; alta del equipo en el mismo paso que el ticket
Construido en F1B-06 (cerrada el 29/09). Alta y edición del equipo construidas en F1B-14
La guarda de Verificación por tipo y gas patrón y el número del certificado de fábrica (F1A-03, en curso)
Soporte remoto
4 transiciones. Nace en Solicitud Soporte; Pendiente es el soporte en pausa; modalidad remoto / en sitio, elegida al crear
Construido en F1B-06 (cerrada el 29/09), pendiente de verificar en la aplicación tras desplegar
El área de las cuatro transiciones es Servicio Técnico por supuesto, no por decisión (Anexo D). La columna propia de Solicitud Soporte en el tablero va con F1B-09
Comercial
10 transiciones, 9 estados
Fuera de Desk 2.0 en 2026: se queda en Zoho CRM (flujos-comercial, 21/09)
Lectura del estado del trato desde el ticket (M1.11). Punto 42 abierto
Posible cliente
4 transiciones, 5 estados
Fuera de alcance desde la R08; se queda en Zoho CRM
Ninguna: no se construye
H.3 Las doce correcciones
Es la tabla que más conviene mirar: son las diferencias entre lo que el proceso debería hacer y lo que hace.
#
Qué corrige
Estado a 01/10/2026
Tanda y momento
C1
Checkbox obligatorio que el motor deja saltar
Construida el 09/09/2026: un checkbox obligatorio sin marcar devuelve 422 y el ticket no se mueve. Las liberaciones anteriores al arreglo se marcan, no se reescriben (p64-historico-c1); el recuento contra producción lo hace Alfonso
F1A-01, cerrada
C2
No existe el estado Anulado
Decidida el 23/09 (c2-anulado): cinco motivos; «creado por error» y «duplicado» se borran; el histórico se marca y sale de las tres métricas
F1C-01, después del corte
C3
Cuatro estados de espera sin salida
Decidida el 23/09 (c3-salida-esperas) y corregida el 30/09 (E-101): dos esperas externas con dos salidas que decide Comercial; Solicitado y En espera de SKU no se abandonan; la caducidad nunca ejecuta sola; la salida la ejecuta la persona a cargo
F1C-03, después del corte. Recomendación: construir dentro de ella la salida por persona a cargo
C4
El ciclo facturar↔entregar pisa la fecha de entrega
Decidida el 23/09 (c4-dos-ramas): dos ramas sin ciclo; «Facturado» es atributo; Pendiente de facturar es estado; la fecha de remisión de salida se escribe una sola vez
F1C-02, después del corte. Antes del corte, solo la restricción de «Liberación sin factura» por cargo, con motivo y fecha prevista; la alarma llega con F1C-02 (E-102)
C5
Falta el atributo de tipo de evento
Decidida el 23/09 (c5-tipo-evento) y aprobada por GN el 01/10: cuatro tipos, uno por transición; Gerencia valida la tabla antes de aplicarla
F1C-04, después del corte
C6
No hay etapa de QA antes de la liberación
Decidida el 23/09 (c6-qa-liberacion): estado Control de calidad entre En Proceso y Por Facturar, firmado por el Coordinador Técnico
F1C-07, después del corte
C7
Las esperas no paran el reloj del SLA
Decidida el 23/09 (c7-reloj-sla): el reloj se para en las cinco esperas externas y corre en las seis internas, con lista propia. «Pendiente» de servicio técnico desaparece (E-103)
F1C-06, después del corte
C8
Traducir los estados a las etapas del portal
Sin decidir ni construir. Necesaria antes del área de cliente y de los avisos de cambio de estado por correo
Con el portal, después del corte
C9
Bodegaje inválido desde 2026
Construida en parte: los bodegajes de entrada y de proceso se calculan sobre el historial de transiciones; el de salida espera el campo «fecha de aviso al cliente». Se miden en días naturales (30/09)
F1A-04, cerrada; el descuento en el SLA va con F1C-06
C10
Permisos sólo por área, no por cargo ni propietario
Nivel cargo construido el 30/09: el área es la base y el cargo solo restringe; siete cargos; tres excepciones (Liberación sin factura y prioridad Top 5 → Director Comercial; OVI de garantía → Director Técnico). Propietario del registro aplazado, salvo las salidas de emergencia (E-101)
F1C-05, parcial
C11
SLA de un día sobre Notificado no implementado
Construida el 09/09 y pasada a horas hábiles el 29/09: Notificado 9 h, Remisión creada 27 h (solo sin orden de venta) y Notificación cliente 36 h; aviso al Coordinador Comercial, en la aplicación y por correo
F1A-02, cerrada; horas hábiles en F1B-08
C12
Verificación sin salida en equipo nuevo
La salida aprobada existe (R08.2). Decidida la guarda: obligatoria por tipo de equipo (analizadores de gases y convertidores) cuando hay gas patrón vigente; salida rechazada → Notificado; certificado de fábrica en la Liberación (p38-verificacion-calidad, 23/09; f1a03-familia-y-gas-patron y f1a03-certificado-liberacion, 28/09)
F1A-03, en curso
[R08.4] A 01/10/2026: dos construidas (C1 y C11), una construida en su nivel de cargo (C10), una construida en parte (C9), una en curso (C12), seis decididas y sin construir (C2 a C7) y una sin decidir (C8).
H.4 Los doce módulos
Módulo
Plan
Construido
Diferencia
M1 · Núcleo de tickets
Máquina de estados completa, permisos, derivación, tipos de evento
Tres ramas (servicio técnico 34 transiciones en el código, 31 tras las correcciones del 30/09; equipo nuevo 6; soporte remoto 4); permisos por área y por cargo; derivación y avisos; alarmas en horas hábiles con calendario laboral; serial como llave; fechas derivadas impuestas por el servidor; prioridad Top 5 y orden de la cola en curso
Correcciones del 30/09 y el 01/10 al blueprint (antes del corte); Anulado, Pendiente de facturar, Control de calidad, salidas de las esperas, tipo de evento y reloj del SLA (1C, después del corte); propietario del registro
M2 · Diagnóstico guiado
Árbol macro→micro con criterio de falla
No construido en la aplicación. Los catálogos Grimm v1.8 y Horiba v1.4 existen como datos; el catálogo de modelos y artículos está en la aplicación
Épica 1D, después del corte: N1 propios de cada marca, dos atributos de criterio de falla (Cobro y Liberación), repuestos preventivos, falla nueva
M3 · Hojas de vida
Ficha completa con los seis campos comerciales
Construido: fecha de adquisición, fecha de factura, fin de garantía, código interno, enlace a Drive y mantenedor (F1B-02); alta del equipo en el ticket de equipo nuevo y edición restringida con historial (F1B-14)
Alta manual de equipo y cliente desconocidos, antes del corte y sin fila; versión imprimible, equipos propios y carga masiva del histórico, después del corte
M4 · Comercial y promesa de fecha
CTP con capacidad finita
Asociación OV↔ticket 1 : N, subOV de lote y registro de contrato con prioridad Alta (F1B-11, parcial). El tiempo promesa lo fija el técnico
Ampliación de contrato (año y tope abiertos); corrección de un contrato mal dado de alta; tiempo promesa global después del corte; el CTP requiere M5 y M6
M5 · Inventarios
Reservas, kitting, bins, reabastecimiento
Resuelto fuera de Desk (Portal · Análisis de Inventario); el inventario sigue siendo el de Zoho Books. Kitting descartado
Repuestos adelantados (F1D-06); derivación de Solicitud y Entrega de repuestos (antes del corte); descuento único de inventario (abierto); ubicaciones de almacén después del corte; lectura de disponibilidad hacia el CTP (punto 48)
M6 · Planificación y capacidad
Carga por usuario y calendario de capacidad
Calendario laboral construido (F1B-12)
Disponibilidad por usuario, carga por usuario y enrutamiento solo a usuarios con área y cargo válidos (E-098). Después del corte; es la condición del CTP
M7 · Analítica y KPIs
Cuadro de mando completo
Bodegajes de entrada y de proceso y marcas de tiempo por transición (F1A-04). Hoy los once indicadores los calcula Zoho sobre la tabla de tickets (Anexo G)
Continuidad de los nueve indicadores antes del corte (F1F-05, sin empezar); el décimo, después; tablero con umbrales en Fase 2; reentrancia (punto 66)
M8 · Portal de cliente
Dos niveles, identidad, agendamiento
No construido
Después del corte. Depende de C8 y del modelo de identidad (punto 50); un equipo solo se muestra con su historial cargado y revisado
M9 · QA/QC
Etapa de validación con retrabajo
Salida de Verificación en equipo nuevo
Control de calidad decidido (C6, F1C-07); guarda de Verificación en curso (F1A-03); alcance de la acreditación 17025 sin definir (M9.2)
M10 · Movilidad y UX
App con checklists, fotos, firma, offline
No construido
La interfaz actual replica Zoho Desk, como se decidió
M11 · Arquitectura
PostgreSQL propio, Zoho en solo lectura
Construido. Conexión Zoho → PostgreSQL mediante cliente REST propio con OAuth2 (refresh token por servicio), operativa, actualización cada tres minutos. La aplicación no escribe en Zoho (p44-escritura-zoho)
Respaldo (F1F-02; proveedor de las copias sin elegir); repatriación del histórico (1G) y correo propio (1H) en enero; modo sin Zoho (1G-04). Las alarmas y el aviso de ritmo de contratos dependen hoy de la pasada de sincronización con Zoho
M12 · Conocimiento y RAG
Capa RAG con KBI y KB Externa
No construido. La vía técnica sigue abierta (punto 51)
Formato único del contenido publicado: Technical Notes (GN, 01/10), después del corte. El contenido —los vídeos— tampoco ha empezado
H.5 Los indicadores
Indicador
Plan
Construido
Diferencia
Cumplimiento del tiempo promesa
[R08.4] Dos indicadores: el del taller (columna 54) y el global ante el cliente, contra el tiempo promesa global. Meta: más del 75 %
El del taller lo calcula hoy Zoho (columna 54), contra la finalización de Servicio Técnico
El del taller entra en la continuidad antes del corte; el global, después del corte
Tiempo de servicio
Excluyendo esperas ajenas
Lo calcula Zoho (columnas 50 y 53); el calendario laboral ya existe (F1B-12)
Descontar las esperas ajenas va con C7 y C9 (F1C-06)
Bodegaje
Tres, en días naturales
Entrada y proceso, construidos sobre el historial (F1A-04)
El de salida espera el campo «fecha de aviso al cliente»
Tiempo de diagnóstico
Desde la recepción
Sobre las marcas de tiempo de las transiciones (F1A-04)
Entra en la continuidad antes del corte
Satisfacción del cliente
En la lista de continuidad; por canal (correo o tableta)
Existe en Zoho (columna 55), solo para el reporte trimestral
Encuesta a mano entre el corte y la independencia, automática con 1H; tableta en la entrega, integrada después del corte
Tiempos por tipo de evento
Por categoría de transición
No calculable
Calculable cuando F1C-04 asigne el tipo de evento a cada transición
Tickets atascados en espera
—
Alarmas en horas hábiles sobre Notificado, Remisión creada y Notificación cliente (F1B-08)
La caducidad de las demás esperas va con C3 (F1C-03)
H.5b El plan, del 27/08 al corte en dos tiempos
Lo decidido el 27/08 aportó lo que a esta tabla le faltaba: una fecha y un criterio de parada. [R08.4] Esa fecha y esos compromisos han quedado así:
Elemento del plan
Estado a 01/10/2026
Versión operativa del Desk 2.0
Era el 31/12/2026, ratificado el 27/08. Sustituido por el corte en dos tiempos: corte operativo el lunes 14/12/2026 e independencia total en enero de 2027 (fecha-corte, corregida el 24/09)
Desarrollo
Era «frenado hasta consensuar el documento maestro». Hoy en modo producción: Claude Code encadena tandas y solo se detiene en los casos previstos
Prototipo de checklist dinámico sobre Grimm EDM 180
Compromiso del 27/08 · sin confirmación de entrega a 01/10
Excel de inspección física del Grimm EDM 180
Hecho: primera etapa realizada y socializada (GN, 01/10)
Consolidado de códigos internos de cliente
Hecho: enviado a Gerencia (GN, 01/10)
Flujo de construcción del informe de servicio
Compromiso del 27/08 · sin confirmación de entrega a 01/10. Es la tanda F1E-05
Documento maestro depurado
Esta R08.4, documento definitivo del plan de desarrollo
Migración del histórico documental
Método decidido: los PDF siguen en Drive (21/09) y los datos se cargan en masa en dos pasos (GN, 01/10), después del corte
Módulo de backup del sistema
Responsable: Alfonso (24/09). Falta elegir el proveedor de las copias
Seguridad del portal de cliente
Sin responsable ni fecha; el portal va después del corte
De los tres frentes que el 27/08 quedaron sin dueño, el respaldo ya lo tiene y la migración del histórico tiene método; la seguridad del portal sigue sin dueño, pero el portal ya no condiciona el corte.
H.6 Lo que la R08 dejó en entredicho, y cómo quedó
Cosas que el plan daba por firmes y que después de la R08 dejaron de estarlo. [R08.4] Su estado a 01/10/2026:
Se daba por
Estado tras la R08.4
Orden de venta obligatoria antes de la recepción
Decidido el 10/09: obligatoria para trabajar, no para recibir. El equipo sin orden queda en Remisión creada, con alarma a las 27 horas hábiles
OCR y QR dentro del MVP
Fuera. El OCR propone y el operario confirma; si ni el equipo ni el cliente existen, alta manual en la recepción (antes del corte)
Kitting, bins y operación de almacén en el backlog
Kitting descartado; ubicaciones de almacén después del corte
pgvector como almacén de la capa RAG
En suspenso hasta elegir la vía (punto 51)
El backlog del MVP tal como está
Sustituido por el plan de desarrollo definitivo (§3)
El área de cliente dentro del MVP (ítem 26)
Fuera: el portal es una etapa independiente (27/08) y va después del corte
El criterio que ordena el MVP
Decidido (24/09): paridad con Zoho antes del corte, independencia en enero y lo que Zoho no tiene, después
La capa as-built de este documento
Decidido (24/09, p62-capa-as-built): sale del cuerpo y queda solo en este anexo, generado desde el barrido
Anexo I — Registro de comentarios de revisión (Man on the Loop)
Nuevo en la R08. Deja constancia de qué se hizo con cada observación del revisor humano, según el procedimiento de §1.11.
La R07 se revisó entera y se anotaron 73 observaciones sobre el texto. Ninguna se descartó en silencio: cada una está abajo con su disposición. Cuando una misma observación se repetía sobre varios puntos de un apartado, se registra una vez con su multiplicidad.
Resumen de la revisión
Disposición
Qué significa
Incorporado
La observación cambia el texto: añade una precisión, corrige un dato o amplía un apartado.
Decidido
La observación cierra algo: pasa a ser decisión y se refleja en §1.8 o en el módulo.
Respondido
Era una duda; produjo una reescritura del pasaje que no se entendía.
Punto abierto
Requiere una decisión que no corresponde a este documento; pasa al Anexo D.
Fuera de alcance
Descartado o aplazado por el revisor.
Pendiente de decisión
Marcado para decidirlo más adelante, antes de cerrarlo.
Detalle
Sección
Observación
Disposición
§1.4.3
siempre tiene que ser la fecha en la que se entregó el equipo
Incorporado como criterio: la fecha de salida es la de la primera entrega y no se sobreescribe. Refuerza C4.
§1.7 · dolor 23
Esto se resuelve tomando con salida Por facturar
Propuesta del revisor recogida y evaluada en M1.3.5; se convierte en la vía preferente de la corrección C4.
§1.7 · dolor 24
Necesito que revises cómo podemos implementar los KPIs relacionados con el bodegaje
Resuelto: M1.10 define los tres bodegajes con sus fórmulas y hitos.
§1.8
Está en evaluación porque no es un cierre
Reclasificada de DECIDIDO a EN EVALUACIÓN. El detalle del comportamiento actual queda en M1.2.
§1.10
En este momento no es crítico este estado porque es un “Toy Demo”
Incorporado: se acota el alcance de la etiqueta AS-BUILT al demostrador actual. [R08.4] Superado: la aplicación ya está en uso y la capa as-built sale del cuerpo (p62-capa-as-built, 24/09).
§1.10
– Comentario mío personal (Man in the loop)
Convención conservada y formalizada en §1.11 y Anexo I.
§2 · M4
Precotización de servicio para trasladar a Zoho CRM
Incorporado al rol del módulo M4 y desarrollado en M4.2 y M4.4.
§2 · M5
Disponibilidad de consumibles y repuestos en inventario o por llegar
Incorporado al rol de M5 y desarrollado en M4.2 y M5.4.
§2
Actualizar tabla y referencias para no tener salto de M9
Aplicado: renumeración completa verificada, M1–M12 sin huecos.
M1.1
No, el prefijo sólo es una formalidad. La rama se define a través de desplegable de tipo de Servicio
Cerrado el punto abierto 37: el prefijo es formalidad, la rama la define el desplegable; el prefijo se autogenera.
M1.2
Por eso no considero necesario asignar prefijo CG, HV, etc para identificar la rama del flujo
Coherente con el cierre del punto 37.
M1.2
En el modelo actual Desk 2.0 permite seguir con los estados CREAR TICKET
Regla reclasificada a EN EVALUACIÓN; documentado el comportamiento real y su efecto sobre el bodegaje. Reformula el punto 21.
M1.2
(en remisiones salida y entrada)
Precisión incorporada: el menú visual aplica a las dos remisiones.
M1.3.1
CREAR TICKET (inicio) - TICKET CREADO - REMISIÓN CREADA - INGRESADO
Incorporada la secuencia real de entrada, distinguiendo el formulario de alta de los estados del grafo.
M1.3.4
Pendiente de buscar las salidas
Confirmada la corrección C3; queda pendiente definir la salida de cada estado.
M1.4
Validar con ST
Añadida la validación con ST como paso previo a definir las salidas de Verificación.
M1.3.5
Revisar si esto se puede resolver tomando con salida Por facturar
Propuesta evaluada y adoptada como vía preferente de C4; resuelve además el punto abierto 6. Reformula el punto 34.
M1.7 · Guardas
Sin la remisión de salida
Añadida la remisión de salida como condición de la guarda de entrega.
M1.7 · Guardas
Eso no está aprobado, es solo una idea
Aclarado el estatus: las guardas propuestas no están aprobadas.
M1.7 · SLA
Importante pensar en avisos por correo electrónico redundantes
Ampliada la corrección C11: correo redundante y escalado jerárquico apoyado en la derivación por cargo.
M1.8
No entiendo “Creación de informe en el evento administrativo”
Duda resuelta con una nota al pie de la tabla de taxonomía.
M1.6
Necesito mas info sobre estas propuestas, en qué se basan, qué aportan, etc
Ampliado: origen de las dos referencias y qué aporta cada una, ligadas a C6, C7 y C2.
M1.6b
Interesante una 4ª vía
Recogido el interés en una cuarta rama de servicio en sitio; nuevo punto abierto 43.
M1.9.1
Pensamos que haya 2 prioridades automáticas
Concretado el modelo de prioridades automáticas y su origen de datos; señalada la diferencia con el diccionario.
M1.9.3
Creo conveniente tratarlo antes de decidir
Marcado para decisión; se mantiene el punto abierto 36. [R08.4] Resuelto el 24/09 (anexo-36-aviso).
M1.10
Es importante que todas la etapas y transiciones lleven fecha / hora / persona
Elevado a decisión: fecha, hora y persona en toda etapa y transición.
M1.10
El bodegaje es el tiempo que un equipo se encuentra en Ambientalia a la espera de respuesta del cliente
Definidos los tres bodegajes con sus fórmulas; dos son calculables hoy, el tercero requiere un campo nuevo. Resuelve C9 y la enlaza con C7.
M1.11 · alcance
Sería increíble en alguna etapa del proceso que Servicio Técnico precargue los artículos objeto de cambio
Idea recogida; identificada la colisión con la política de solo lectura sobre Zoho. Nuevo punto abierto 44.
M1.11 · alcance
Sería interesante que desde el desk se puedan ver comentarios y etapa de flujo comercial
Idea recogida; viable sin romper la política de solo lectura.
M1.12
Este flujo no es necesario para Desk, se puede omitir
Declarado fuera de alcance; se conserva la transcripción como documentación, sin ítems de backlog.
M2.1
Revisar conclusiones de diseño del 03/09/2026 “Checklist dinámico”
Incorporadas las decisiones del 03/09 [R08.2]: tema 3 cerrado con decisión; tema 4, sólo con tarea.
M2.1
Está pendiente desarrollarlo para Grimm EDM180
Marcado el estado real: el árbol aún no está desarrollado para el equipo piloto.
M2.1 · macro-fases
Aún está pendiente de que Johny piensa en Macro-fases que permitan un proceso común
Reclasificadas de DECIDIDO a pendiente de validar; nuevo punto abierto 45 sobre macro-fases comunes al portafolio.
M2.3
Sólo aquellos repuestos que procedan en la etapa del diagnóstico en la que se encuentre
Precisado el alcance: los repuestos ofrecidos se filtran por la etapa del diagnóstico.
M2.5
no entiendo “Revisar si la entrada procede de la plataforma de hojas de vida”
Duda resuelta reescribiendo el punto abierto 14 en términos claros.
M2.3
Analizar la integración método Karpathy LLM wiki
Remitido a M12.3, donde se evalúan las alternativas al RAG.
M2.6
Analizar la integración método Karpathy LLM wiki
Remitido a M12.3, donde se evalúan las alternativas al RAG.
M8.4
Analizar la integración método Karpathy LLM wiki
Remitido a M12.3, donde se evalúan las alternativas al RAG.
M2.7
Hay que desarrollar mucho más este punto
Reconocido como insuficiente; nuevo punto abierto 46 para desarrollarlo con Dirección Técnica.
M3.5
Incluir Hojas de Vida de Labcontrol
Ampliado el alcance de la migración: se añaden las hojas de vida de Labcontrol.
M4.2
Si hay repuestos en camino (cálculo con fecha estimada de recepción del repuesto)
Incorporadas las tres situaciones del repuesto al cálculo de la fecha prometida.
M4.3
Aviso a cliente por correo electrónico
Añadido el aviso por correo al cliente en la reprogramación.
M4.4
No entiendo este concepto, desarrollar un poco mas
Duda resuelta: se desarrolla la definición del KPI de precisión de diagnóstico.
M5.1
Deberían ser aquellos repuestos que se están identificando en diagnóstico
Adoptada la reserva anticipada desde el diagnóstico; acotado el riesgo del 10 % restante. Nuevo punto abierto 47.
M5.2
no lo veo por ahora, descartar esto
Descartado. Se retira del backlog.
M5.3
no es prioritario por ahora. No descartar para el futuro
Aplazado sin descartar.
M5.4
ya está resuelto vía Portal Ambientalia Análisis de Inventario
Reconocido como resuelto fuera de Desk; queda pendiente la lectura de disponibilidad para el CTP. Nuevo punto abierto 48.
M5.5
no es prioritario por ahora. No descartar para el futuro
Aplazado sin descartar.
M6.2
Conecta con avisos a clientes por correo electrónico
Enlazado el calendario con el canal de avisos por correo.
M6.2
Esto toca discutirlo más profundamente
Marcado para discusión.
M6.2
Un análisis de esto permitiría predecir cuánto tiempo nos podría llevar el mantenimiento
Incorporada la predicción por historial de fallas del cliente.
M6.3
Planes de trabajo semanales, mensuales, etc por técnico
Añadidos los planes de trabajo por técnico, con reflejo en el tablero.
M6.4
Esto toca discutirlo más profundamente
Marcado para discusión.
M6.4
Discutir si el Top 5 se encuentra dentro de esta prioridad
Pendiente: encaje del Top 5 en el modelo de prioridades.
M6.4
Igual, si el cliente con contrato no envía los equipos en el momento acordado
Añadida la simetría de la reserva: el slot no honrado se libera.
M7.1
Pensemos en alguna estrategia para que el cliente valore nuestro servicio
Recogida la idea de incentivar la valoración del cliente.
M7.3
Tiempo por técnico
Añadida la desagregación por técnico.
M7.5
Mi plan semanal, mi plan mensual
Añadidas las vistas de plan semanal y mensual del técnico.
M8.1
Se deberían mostrar todos los certificados
Ampliado: el portal muestra el histórico completo de certificados.
M8.2
Posibles avisos por correo electrónico de cambio de estado
Añadidos los avisos por correo de cambio de estado, acotados por la traducción de C8.
M8.2
Sería bueno que se puedan ver todos los certificados de calibración de forma pública
Adoptada la verificación pública de certificados como medida antifalsificación; queda por acotar qué datos se exponen. Nuevo punto abierto 49.
M8.3
Significa que qué ve el cliente no se programa: se configura
Definido el mecanismo: visibilidad por campo como atributo configurable. Simplifica el punto 28.
M8.5
Es realmente necesario tener dos mecanismos
Objeción atendida: se recomienda un único modelo de identidad con acceso por enlace firmado. Nuevo punto abierto 50.
M11.5
Sólo trabajamos con PostgreSQL en nuestra VPS de Hostinger, no considerar Supabase
Corregida una decisión obsoleta: no se usa Supabase; sólo PostgreSQL en VPS Hostinger.
M12.3
Desarrollar posibles conexiones alternativas al RAG
Recogidas y evaluadas las dos alternativas al RAG; sustituye el punto 27 por el 51, a decidir con prototipo.
M2.5
Revisar conclusiones de diseño del 03/09/2026
Incorporadas las decisiones del 03/09 [R08.2]: tema 3 cerrado con decisión; tema 4 —el encadenamiento que pide el paso 3— sólo con tarea.
M8.4
Analizar la integración método Karpathy LLM wiki
Remitido a M12.3.
M4.4
Sería increíble en alguna etapa del proceso que Servicio Técnico precargue
Remitido a M1.11, donde se evalúa junto con la política de solo lectura.
M3.4
No es crítico en primeras fases (No en MVP) (×4)
Sale del MVP: captura asistida reclasificada como no crítica en las primeras fases.
§3.2
Esto lo tenemos que revisar y discutir detenidamente
Backlog del MVP marcado en revisión; la tabla se congela y el Anexo H recoge el estado real. [R08.4] Sustituido por el plan de desarrollo definitivo (§3).
[R08.4] Las disposiciones de esta tabla son las que se dieron en la R08. Varias se han cerrado después (por ejemplo, el punto 37, superado el 30/09 por la supresión de los prefijos; el 43, el 45, el 46 en lo que toca a la R², y la entrada de M6.4 sobre el Top 5). El estado vigente de cada punto está en el Anexo D, y lo que cambió en esta revisión, en I.3.
I.1 Lo que esta revisión enseña sobre el propio documento
Tres patrones que conviene no perder de vista en las siguientes:
Las dudas encontraron defectos reales. De las tres observaciones del tipo «no entiendo esto», una destapó que un mismo evento estaba clasificado en tres categorías a la vez —un defecto que bloquea la corrección C5 y que nadie había visto en cinco revisiones—. Cuando el revisor no entiende un pasaje, la primera hipótesis debe ser que el pasaje está mal.
El documento se adelantaba a los hechos. Varias cosas figuraban como decididas sin serlo: la orden de venta previa, las cuatro macro-fases, las guardas de transición. El revisor las devolvió a su estado real. Conviene ser más estricto con la etiqueta [DECIDIDO]: sólo lo que consta como decisión registrada, no lo que parecía ir en esa dirección.
Las mejores soluciones vinieron de quien conoce la operación. La separación del ciclo de facturación en dos ramas, la definición de los tres bodegajes y el modelo de prioridades no son refinamientos de lo que había: son soluciones mejores que las propuestas, y ninguna podía deducirse del código ni de los registros de decisiones. Es el argumento del esquema: la máquina consolida y verifica, pero la operación la conoce quien la vive.
I.2 Registro de cambios de la R08.2
La R08.2 no procesa observaciones del revisor: aplica correcciones y decisiones que ya estaban escritas en el repositorio. Este registro deja, para cada cambio, la ubicación de partida en la copia citable de la R08.1 (docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.1.md, 4.935 líneas), para que la tanda de barrido de citas pueda rehacerlas.
#
Ubicación (R08.1.md)
Cambio
Fuente
A-1
M1.9.1 (:1636)
Diez → ocho transiciones compartidas por dos áreas
F0-01 #1
A-2
Anexo D nº 16 (:3927) · Anexo F (:4273) · H.4 (:4599)
«Trece» → «once» indicadores calculados, en las tres líneas
F0-01 #2
A-3
§1 (:472, :923) · M11.1 (:2650) · §3 (:2948) · C.5 (:3655) · Anexo F (:4225) · H.4 (:4615) · Anexo E (:4160)
«Vía MCP» → cliente REST propio con OAuth2 en siete líneas; glosario de MCP reescrito. Las cinco menciones legítimas (:259, :2709, :2767, :2768, :4055) no se tocan
F0-01 #3
A-6
Anexo G.5, cols. 42 y 43 (:4397-4402)
Habilitar Servicio no escribe la col. 42; Aprobación y S. Repuestos también escribe la 43
F0-01 #6
A-8
M1.9.2, fila Aprobación (:1665)
Retirado «+ Director Técnico», no implementado ni expresable en el código
F0-01 #8
A-9
M1.3.8 (:1413)
Recuento de alcanzabilidad con una sola convención (18 y 18 por botones; 20 con el paso sin botón)
F0-01 #9
A-11
M1.3.3 (:1151)
Los dos pasos sin botón se declaran en transitions.ts y los aplica estadoPorRemision.ts; la cifra de 38 pasos queda en revisión
F0-01 #11 · B.7
A-12
M1.10 (:1677) · H.2
Cerrado el pendiente del «quién»: ninguna fila del historial sin actor; matiz de la constante de respaldo. Red de pruebas en H.2
F0-01 #12
A-13
:17 · :161 · :217 · :268 · :1820 · :1911 · :3815-3816 · :4249 · :4812 (y fila M2.5 del Anexo I) · nº 62
Las decisiones del 03/09 sí se tomaron. M2.1 queda cerrada; M2.5 no (tema 4 sin decisión). Nº 62 sin decisión, vuelve al Anexo D
F0-01 #13
A-14
:544 · :1554-1556 · :2723 · :3025-3029 · :4520-4522 · nº 33 · nº 64
C1 son dos piezas, no una línea; cerrada en F1A-01 el 09/09/2026. Nº 33 cerrado; nuevo nº 64 por el histórico
F0-01 #14
A-15
M1.4 (:1445-1470) · H.2 · H.3
Seis transiciones, cinco estados: se añade Verificación —Liberación→ Finalizado. Retirada la afirmación de estado sin salida
Expediente R08.2 §3
A-16
:199 · :847 · :2065 · :3774
Subórdenes OV-AAAA-NNN-SS en lugar de OV-XXX_1. Modifica un [DECIDIDO 27/08] y así se dice
Expediente R08.2 §3
B-1
M1.4
Verificación condicional por familia de equipo, como regla observada
Decisiones 10/09 §1
B-2
M7.3
La verificación no se mide con la duración del estado
Decisiones 10/09 §1
B-3
M4.4 (:2064-2079)
Cardinalidad 1 ticket : N OV
Decisiones 10/09 §2
B-4
M4.4
Criterios de la subOV de lote; vigencia por fecha pendiente
Decisiones 10/09 §8
B-5
M1.2 · :691 · backlog ítem 20 · H.6
OV obligatoria para trabajar, no para recibir
Decisiones 10/09 §7
B-6
M1.10
Las tres fechas derivadas las impone el servidor, con zona horaria fijada
Decisiones 10/09 §4
B-7
Anexo F (:4272)
Mapa del blueprint generado desde transitions.ts, con prueba anti-desfase
Decisiones 10/09 §9
C
Anexo D nº 21 · 52 · 38
Cerrados el 21 y el 52; el 38 parcialmente resuelto
Expediente R08.2 §5
—
§1.2 · §1.3 · §1.8 · C.10 · C.11 · portada
Novedades de la R08.2; el bloque de la R08.1 pasa a §1.3; dos filas nuevas en §1.8; C.10 como registro de las decisiones del 03/09; C.11 nuevo
Esta revisión
No incorporado, a propósito: las entradas 4, 5 y 7 del registro F0-01 (baseline), la 10 (el documento está bien), las cinco correcciones al plan de fases y la titularidad OV ↔ equipo. Tampoco los tres puntos nuevos del Anexo D que el registro F0-01 propone en su cabecera —doble escritura Sheets / Postgres, cuatro indicadores rotos por reentrancia y rotación de secretos—, que el expediente de la R08.2 no incluye; quedan para la revisión siguiente si Gerencia los aprueba.
[R08.4] Los dos primeros entran en el Anexo D en la R08.4 como puntos 65 (doble escritura con Google Sheets) y 66 (indicadores rotos por reentrancia). La rotación de secretos figura como punto abierto, sin decisión de Gerencia.
I.3 Registro de cambios de la R08.4
[R08.4] La R08.4 es el documento definitivo del plan de desarrollo. No procesa una lista de observaciones como la R07: integra en el cuerpo los comentarios que GN dejó resaltados en el borrador R08.3 —que quedó como borrador de revisión y no se publicó como vigente (maestro-r08-3-publicada, 01/10)— y las decisiones y correcciones del panel de supervisión que el maestro aún no recogía. Las tablas dicen qué cambió, dónde y de qué fuente sale, en cinco bloques. El texto literal de cada decisión está en el panel; su índice por apartado, en los expedientes de cambios R08.3 (§11 a §15) y R08.4; y la lista fechada, en el Anexo C.12. Al publicarse esta revisión, cada decisión incorporada se marca con «R08.4» en el registro de decisiones del repositorio (§1.11).
1 · Decisiones de Gerencia del 17/09 al 28/09 (68 entradas del apartado 06 del panel)
Dónde
Qué cambió
Fuente
§1.8 · §1.9 · §3
Corte en dos tiempos: corte operativo el 14/12/2026, con migración el 12–13/12 y confirmación el 9/12, e independencia total en enero de 2027. Plan A el 01/02/2027. Dos licencias mensuales de Zoho, de solo lectura, entre ambas fechas
fecha-corte (corregida el 24/09), corte-licencias-plan-a
§1.8
Decisiones estructurales nuevas: manda la aplicación sobre la orden de venta elegida en ella; la aplicación no escribe en Zoho; flujos comercial y posible-cliente fuera de Desk 2.0 en 2026; Drive se queda enlazado; el área es la base de los permisos y el cargo solo restringe; días hábiles con un calendario laboral único
e005-iv4-iv11, p44-escritura-zoho, flujos-comercial, p8-p54-drive, c10-permisos-cargo, calendario-habil
§1.11 · M11.6
Cómo llega lo decidido al maestro: registro de decisiones del repositorio, revisión cada dos semanas o con 10 pendientes, ninguna decisión más de un mes pendiente; vigilancias nuevas del barrido (F0-06); trabajo sin ficha listado en el parte; cuenta del ledger con los ficheros nuevos
anexo-61-incorporacion, barrido-comprobaciones-nuevas, trabajo-sin-ficha, ledger-ficheros-nuevos
M1.2
Remisión creada: alarma a las 27 horas hábiles, solo sin orden de venta, al Coordinador Comercial. Rotulación obligatoria «Rotulado y guardado» y lista de tipos de novedad en la recepción. Servicio en sitio como cuarta rama en 2027 T2; hasta entonces, modalidad remoto / en sitio en soporte remoto
escalado-remision-creada, escalado-destinatario-doble, anexo-3-alerta, f1b04-rotulacion, f1b04-desplegables, anexo-43-en-sitio
M1.3 · M1.3.4 · M1.3.5
Salidas de las cuatro esperas; dos ramas sin ciclo, con «Facturado» como atributo y Pendiente de facturar como estado; «Liberación sin factura» solo por el Director Comercial, con motivo de lista cerrada y fecha prevista; las liberaciones anteriores al arreglo de C1 se marcan; tipo de evento sin bloqueo
c3-salida-esperas, c4-dos-ramas, anexo-33-checkbox, p64-historico-c1, p64b-quien-ejecuta, c5-tipo-evento
M1.4
Verificación obligatoria por tipo de equipo y condicionada al gas patrón; el compuesto vive en el equipo y se hereda del modelo; tabla de gases patrón del Director Técnico; certificado de fábrica en la Liberación; alta del equipo en el mismo paso del ticket
p38-verificacion-calidad, f1a03-familia-y-gas-patron, f1a03-certificado-liberacion, equipo-nuevo-alta-en-ticket
M1.6 · M1.7 · M9.1
Anulado con cinco motivos; Control de calidad entre En Proceso y Por Facturar; lista propia de esperas que paran el reloj del SLA; Por Entregar como espera del cliente en el tablero; alarmas en horas hábiles (9, 27 y 36 h)
c2-anulado, c6-qa-liberacion, c7-reloj-sla, e001-por-entregar, anexo-3-alerta
M1.9
Siete cargos con nombre oficial y tres excepciones por cargo; propietario del registro aplazado; prioridad fijada en el cliente, Top 5 manual por el Director Comercial; revisión nocturna de avisos y borrado de administrador limitado con registro inmutable
c10-permisos-cargo, c10b-gerente-director, top5-prioridad, top5-manual, anexo-36-aviso
M1.10 · M4.4
Propiedad del dato de la orden de venta y aviso de discrepancia a Comercial; registro de contrato, vigencia y prioridad Alta del cliente con contrato; titularidad de la orden y mantenedor; OVI de garantía creada por el Director Técnico; garantía con el proveedor como ficha propia
e005-iv4-iv11, e005b-parche-vehiculo, e005c-discrepancia-sin-espejo, anexo-53-contratos, vigencia-contrato, titularidad-ov-equipo, titularidad-mantenedor, mantenedor-campo-cuando, ovi-garantia-autor, anexo-7-garantia-proveedor
M2
N1 propios de cada marca (las cuatro macro-fases comunes quedan superadas); sin ruta abreviada para el equipo sin novedad y calibración directa con tres condiciones; falla nueva con formulario obligatorio; comentarios predeterminados del catálogo; repuestos adelantados en tres casos; ISO 14224 simplificada; remisiones de entrada escritas por la aplicación y cierre de la hoja de Google el 14/12; validación del informe con tres firmas
p45-macro-fases, p15-p59-rutas, falla-nueva-bloqueante, anexo-9-comentarios, anexo-47-repuestos, anexo-56-taxonomia, p14-remisiones-entrada, p14b-hoja-google, roles-validacion-informe
M3
Catálogo de modelos y registro de equipos sembrados; edición de los seis campos comerciales, con tres reservados a Comercial y a los administradores e historial de cambios
e003-catalogo-equipos, e003b-registro-equipos, e003c-recuento-modelos, edicion-datos-comerciales-equipo
M7.1 · Anexo G
Lista cerrada de nueve indicadores que continúan antes del corte, con criterio de aceptación; encuesta a mano entre el corte y la independencia
e009-kpis, e009b-lista-indicadores, encuesta-entre-corte-e-independencia
M11.5
Respaldo: responsable Alfonso, copia nocturna y previa a cada cambio, retención 7/4/12, destino de un proveedor distinto de Google y Hostinger con bloqueo de borrado, carpeta de Drive semanal. Staging retirado
p55-backup, p55b-destino-copia, e013-staging-f0-04, e013b-copia-pruebas
Anexo F
Mapa del blueprint dentro de la aplicación, después del corte
mapa-en-la-app, mapa-antes-o-despues-del-corte
Anexo C.12 · Anexo D
Registro fechado de todas las decisiones posteriores al 10/09; los puntos del Anexo D que cierran pasan a resueltos (lista en §1.2, «Lo que la R08.4 cierra»)
Todas las anteriores
2 · Correcciones de Gerencia del 30/09 (E-094 a E-107, apartado 07 del panel)
Dónde
Qué cambió
Fuente
M1.1 · Anexo D nº 37 · Anexo G
Se suprimen los prefijos en los tickets nuevos; la rama la indica la clasificación; los tickets existentes conservan el suyo
E-094
M4.1–M4.2 · M7.1 · Anexo G
Tiempo promesa global (diagnóstico + días de entrega) y décimo indicador, el cumplimiento global ante el cliente. Después del corte
E-095
M7.1 · Anexo G
Encuesta en tableta en la entrega cuando recoge el propio cliente; indicador por canal
E-096
M1.3 · M1.7 · Anexo B · Anexo E
«Entregado» es un estado obsoleto de Zoho y no existe en Desk 2.0
E-097
M6 · §1.4.5
La asignación de trabajo se construye sobre usuario, área y cargo; carga por usuario; calendario laboral más disponibilidad por usuario; enrutamiento solo a usuarios válidos
E-098
M1.2 · M1.9
La cola se ordena, dentro de cada prioridad, por la hora de «Habilitar Servicio»; el bodegaje se mide en días naturales
E-099
M1.2
Accesorios con foto, nombre oficial y número de parte desde el catálogo de artículos de Zoho Books, iguales en entrada y salida
E-100
M1.3.4 · Anexo D nº 31
La salida de emergencia de una espera la ejecuta la persona a cargo; si no está, el Director o el Coordinador del área, con registro
E-101
M1.3.5 · §3
La liberación sin factura en dos momentos: restricción por cargo con motivo y fecha antes del corte; la alarma, con F1C-02
E-102
M1.3 · Anexo B · Anexo F
«Pendiente» sale de la rama de servicio técnico y «Diagnóstico complementario» pasa a salir de En Proceso
E-103
M1.3 · §3.4
Remisiones sin ticket desde el menú «Remisiones». Antes del corte
E-104
M1.3 · §3.4
Aviso «En garantía» calculado, que sugiere «Reporte por garantía» en Notificado. Antes del corte
E-105
M1.3 · Anexo F · Anexo H
Se retiran las dos «Servicio externo» hacia Por Facturar. Con E-103, la rama pasa a 31 transiciones y el mapa a 35 pasos
E-106
M1.3 · M4.4
Comercial/Compras registra el SKU, cotiza y avisa al técnico; si hay que cambiar una pieza, el ticket vuelve a Servicio Técnico
E-107
3 · Comentarios de GN del 01/10 (revisión del borrador R08.3 e ideas y correcciones del apartado 07 del 01/10). Las que repetían una corrección del 30/09 se funden con ella en el bloque 2.
Dónde
Qué cambió
Fuente
§1.7 (dolor 4) · M1.9.2
Protocolo de traspaso: derivación por transición, registro de cada traspaso, aviso a quien recibe y reasignación con motivo
Comentario de GN en la R08.3
§1.4.5 · M9.2
Qué cambia con la acreditación 17025: no la estructura, sino los requisitos de la calibración y del certificado; tabla de requisitos y su situación; alcance a definir
Pregunta de GN en la R08.3
§1.9
Excel de inspección física del Grimm EDM 180: primera etapa hecha y socializada. Consolidado de códigos internos: enviado a Gerencia
Comentario de GN en la R08.3
M1.3
«Rechazo» desde Notificación cliente, solo Comercial. «Solicitud repuestos» y «Entrega de Repuestos» como traspaso con el encargado de inventario. Remisión de salida creada desde la entrega. C5 aprobada, con cuatro tipos de evento
Panel, 01/10 (correcciones de «Rechazo» y de repuestos; remisión de salida en la entrega; aprobación de C5)
M1.7
Guarda nueva: no se entrega sin remisión de salida vigente
Panel, 01/10 (guarda en la entrega)
M2.1
Fotos obligatorias en las remisiones de entrada y de salida; «solo con novedad» queda para la inspección del diagnóstico y los checklists
Panel, 01/10 (corrección a la regla de fotos)
M2.2
Criterio de falla con dos atributos por ítem, Cobro y Liberación, y sus equivalencias con Alerta, Cobrable y Bloqueante
Comentario de GN en la R08.3
M2.3 · M2.4
Repuestos preventivos; propuesta de árbol de fallas RCM como análisis, no desarrollo
Panel, 01/10 (ideas de repuestos preventivos y árbol RCM)
M2.5 · M2.7
Paso 1 del informe cerrado (punto 14); la R² no es criterio de aprobación de la calibración
Panel, 01/10 (corrección a M2.5; regla sobre la R²)
M3
Equipos propios de Ambientalia; versión imprimible de la hoja de vida; alta manual de equipo y cliente desconocidos (antes del corte); carga masiva del histórico
Panel, 01/10 (ideas y corrección al OCR en recepción)
M7
Meta del OTD superior al 75 %; mantenimiento predictivo a partir de los protocolos; filtros por número de ticket y serial; las vistas «Dispatcher / Torre de control» y «Planificador» las usa el Director Técnico
Panel, 01/10, y comentario de GN en la R08.3
M8.3 · M8.4 · M9.3 · M12
Historial completo descargable en el nivel completo del portal; Technical Notes como formato único del contenido publicado
Panel, 01/10 (ideas de historial descargable y Technical Notes)
4 · Plan de fases R01.3 (24/09)
Dónde
Qué cambió
Fuente
§3
El backlog priorizado se sustituye por el plan de desarrollo definitivo: fases y épicas, catálogo de tandas con su momento y su estado, trabajo nuevo del 30/09 y el 01/10, calendario y lo que queda para después. La tabla del MVP queda como referencia histórica
Plan R01.3 y catálogo §5 de la R01.1
§1.9 · §3.5
Hitos del corte en dos tiempos; margen de +1,9 a +2,2 semanas y riesgos que pueden comérselo; medidas M1, M2 y M3 como primera tarea
Plan R01.3 §C, §D.6 y §F
M11.1 · M11.3
Épicas 1G (repatriación del histórico y modo sin Zoho) y 1H (correo propio con Gmail API sobre el buzón de Workspace), en enero de 2027
Plan R01.3 §A
M7.1
La encuesta va dentro de la continuidad de indicadores (F1F-05) y depende del correo propio
Plan R01.3 §B
Anexo H
Estado de las tandas a 01/10/2026 sobre 66 filas; filas nuevas F1B-12 (calendario laboral) y F1B-14 (alta y edición del equipo)
Plan R01.3 §E y §G; parte del 01/10
5 · Retirada de la capa as-built del cuerpo (p62-capa-as-built, 24/09)
Dónde
Qué cambió
Fuente
M1–M12
Se retiran rutas de ficheros, números de línea, nombres de funciones y hashes de commit. Los pasajes con regla decidida se reescriben como regla de negocio; [AS-BUILT] pasa a [CONSTRUIDO] cuando describe lo que hace hoy la aplicación, o desaparece. «Demostrador» pasa a «la aplicación (en uso)»
p62-capa-as-built
Anexo H
Único lugar del maestro que compara plan y construido; en adelante se genera desde el barrido de reconciliación, con fecha y commit
p62-capa-as-built
Anexos B, G y H
Conservan las referencias técnicas que ya tenían
p62-capa-as-built
Anexo E
Entrada «as-built» actualizada y entrada nueva «Construido»
p62-capa-as-built
Además, en todo el documento: por instrucción de Gerencia, las decisiones se citan solo por su fecha, sin nombrar el contexto en que se tomaron (el Anexo C, como registro histórico, conserva sus títulos fechados); se usan los nombres oficiales de los siete cargos y de los estados; se retira la tabla de contenido manual, porque el índice se genera al producir el .docx; y §1.1 a §1.3 se reescriben para presentar la R08.4 como documento definitivo del plan.
