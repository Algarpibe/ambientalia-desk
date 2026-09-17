AMBIENTALIA S.A.S.
Proyecto Desk 2.0 · Revisión R08.2
Documento maestro
de ideas y funcionalidades
Consolidación de la visión, los flujos mapeados, los estudios de mercado y las decisiones de las reuniones de trabajo, en una especificación funcional única con backlog priorizado.
Contenido: Resumen ejecutivo · Ejes de valor · Especificación funcional en 12 módulos · Backlog priorizado y roadmap · Anexos, incluido el seguimiento as-built frente a plan
Fuentes: Notion «CMMS (Desk 2.0) Ambientalia» — Ideas · IA · analisis-tickets · Reuniones (17/02, 19/02, 14/08, 20/08 y 21/08 de 2026) · Sesión de trabajo del 21/08/2026 sobre ejes de valor · Código de la aplicación Desk 2.0, commit a3a8f03 del 21/08/2026 · Hojas de mapeo de los cuatro flujos (02–16/02/2026) y Diccionario de Campos Tickets · Actas de Notion del 27/08/2026 y del 03/09/2026 · Decisiones de Gerencia del 10/09/2026 y registro de correcciones F0-01 (repositorio Desk_2_R1.023, docs/sdd/)
Fecha: 10 de septiembre de 2026 (primera edición: 21 de agosto de 2026)
Revisión: R08.2 — incorpora las decisiones de Gerencia del 10/09/2026, el acta de la sesión del 03/09/2026 y las correcciones trazables contra el código (ver §1.2 y Anexos C.10, C.11, D e I.2). Base: R08.1
Contenido
 TOC \o "1-3" \h \z \u Contenido PAGEREF _Toc239180933 \h 2
1. Resumen ejecutivo PAGEREF _Toc239180934 \h 8
1.1 Propósito de este documento PAGEREF _Toc239180935 \h 8
1.2 Novedades de esta revisión (R08.2) PAGEREF _Toc239180936 \h 8
Lo que el acta del 27/08 resuelve PAGEREF _Toc239180937 \h 8
Lo que hay que mirar de frente PAGEREF _Toc239180938 \h 9
La sesión del 03/09 — convocada al cierre de la R08.1, celebrada después PAGEREF _Toc239180939 \h 9
Puntos abiertos nuevos PAGEREF _Toc239180940 \h 9
1.3 Qué incorporaron las revisiones anteriores PAGEREF _Toc239180941 \h 9
La R08 — la revisión humana completa PAGEREF _Toc239180942 \h 9
Las R06 y R07 — retirada del portal del empleado PAGEREF _Toc239180943 \h 11
La R05 — los flujos de origen y el diccionario PAGEREF _Toc239180944 \h 11
La R04 — el blueprint implementado PAGEREF _Toc239180945 \h 13
La R03 — ejes de valor, capa de conocimiento y área de cliente PAGEREF _Toc239180946 \h 14
La R02 — reunión del 21/08/2026 PAGEREF _Toc239180947 \h 15
1.4 Los tres ejes de valor PAGEREF _Toc239180948 \h 16
1.4.1 El esquema PAGEREF _Toc239180949 \h 16
1.4.2 No son tres bloques, son una cadena PAGEREF _Toc239180950 \h 16
1.4.3 El riesgo rector: el error de captura PAGEREF _Toc239180951 \h 17
1.4.4 El tercer eje es producto, no soporte PAGEREF _Toc239180952 \h 18
1.4.5 Correspondencia con los módulos PAGEREF _Toc239180953 \h 18
1.5 Qué es Desk 2.0 PAGEREF _Toc239180954 \h 18
1.6 Visión y principios de diseño PAGEREF _Toc239180955 \h 19
1.7 Los dolores que Desk 2.0 debe resolver PAGEREF _Toc239180956 \h 19
1.8 Decisiones estructurales ya tomadas PAGEREF _Toc239180957 \h 21
1.9 Alcance, hitos y plazos PAGEREF _Toc239180958 \h 23
1.10 Cómo leer la Parte 2 PAGEREF _Toc239180959 \h 24
1.11 Cómo se revisa este documento (Man on the Loop) PAGEREF _Toc239180960 \h 25
El ciclo de revisión PAGEREF _Toc239180961 \h 25
Las tres reglas que hacen que esto funcione PAGEREF _Toc239180962 \h 25
Convención de marcas PAGEREF _Toc239180963 \h 25
2. Especificación funcional por módulos PAGEREF _Toc239180964 \h 25
M1. Núcleo de tickets, blueprints y máquina de estados PAGEREF _Toc239180965 \h 26
M1.1 Identificación del ticket PAGEREF _Toc239180966 \h 26
M1.2 Ramificación por tipo de servicio PAGEREF _Toc239180967 \h 27
Precondición comercial de la recepción [DECIDIDO 21/08] PAGEREF _Toc239180968 \h 28
Recepción de accesorios [DECIDIDO 21/08] PAGEREF _Toc239180969 \h 28
M1.3 Flujo de servicio técnico [AS-BUILT] PAGEREF _Toc239180970 \h 28
M1.4 Flujo equipo-nuevo [AS-IS] PAGEREF _Toc239180971 \h 34
M1.5 Flujo soporte-remoto [AS-IS] PAGEREF _Toc239180972 \h 35
M1.6 Modelo objetivo de máquina de estados [PROPUESTO] PAGEREF _Toc239180973 \h 35
M1.7 Reglas de transición: guardas, disparadores y tiempos PAGEREF _Toc239180974 \h 37
M1.8 Tipos de evento PAGEREF _Toc239180975 \h 38
M1.9 Roles, permisos, derivación y avisos PAGEREF _Toc239180976 \h 39
M1.10 Registro de tiempos, anulación y métricas PAGEREF _Toc239180977 \h 41
M1.11 Flujo comercial [AS-IS] PAGEREF _Toc239180978 \h 43
M1.12 Flujo posible-cliente [AS-IS] PAGEREF _Toc239180979 \h 44
M2. Diagnóstico guiado y base de conocimiento PAGEREF _Toc239180980 \h 45
M2.1 Estructura del árbol de diagnóstico PAGEREF _Toc239180981 \h 45
M2.2 Estructura de cada punto de control PAGEREF _Toc239180982 \h 46
M2.3 Registro, evidencia y comentarios PAGEREF _Toc239180983 \h 47
M2.4 Taxonomía de fallas PAGEREF _Toc239180984 \h 47
M2.5 Informes de servicio PAGEREF _Toc239180985 \h 47
M2.6 Asistencia por IA PAGEREF _Toc239180986 \h 48
M2.7 Criterios analíticos de aprobación PAGEREF _Toc239180987 \h 48
M3. Hojas de vida de equipos (ALM) PAGEREF _Toc239180988 \h 49
M3.1 Estructura de datos PAGEREF _Toc239180989 \h 49
M3.2 Taxonomía jerárquica ISO 14224 [PROPUESTO] PAGEREF _Toc239180990 \h 49
M3.3 Funcionalidades de la hoja de vida PAGEREF _Toc239180991 \h 49
M3.4 Identificación e ingreso de datos PAGEREF _Toc239180992 \h 50
M3.5 Migración del historial PAGEREF _Toc239180993 \h 50
M4. Comercial: cotización, aprobación y promesa de fecha PAGEREF _Toc239180994 \h 51
M4.1 Aprobación del cliente PAGEREF _Toc239180995 \h 51
M4.2 Simulador de fecha de entrega (CTP — Capable to Promise) PAGEREF _Toc239180996 \h 51
M4.3 Reprogramación y comunicación de consecuencias PAGEREF _Toc239180997 \h 52
M4.4 Cotización, recotización y facturación diferida PAGEREF _Toc239180998 \h 52
M4.5 El dato como argumento comercial PAGEREF _Toc239180999 \h 53
M5. Inventarios y repuestos (MRO) PAGEREF _Toc239181000 \h 53
M5.1 Reservas: soft vs. hard PAGEREF _Toc239181001 \h 53
M5.2 Kitting PAGEREF _Toc239181002 \h 54
M5.3 Ubicaciones bin PAGEREF _Toc239181003 \h 54
M5.4 Reabastecimiento y compras PAGEREF _Toc239181004 \h 54
M5.5 Operación del almacén PAGEREF _Toc239181005 \h 54
M6. Planificación y capacidad PAGEREF _Toc239181006 \h 55
M6.1 Parámetro de carga del servicio técnico PAGEREF _Toc239181007 \h 55
M6.2 Calendarios PAGEREF _Toc239181008 \h 55
M6.3 Asignación de trabajo PAGEREF _Toc239181009 \h 55
M6.4 Exposición de la capacidad al cliente [NUEVO — R03] PAGEREF _Toc239181010 \h 56
M7. Analítica, KPIs y predicciones PAGEREF _Toc239181011 \h 56
M7.1 Cuadro de mando de KPIs del taller PAGEREF _Toc239181012 \h 56
M7.2 KPIs de confiabilidad (si se extiende a mantenimiento de planta) PAGEREF _Toc239181013 \h 59
M7.3 Análisis operativo PAGEREF _Toc239181014 \h 59
M7.4 Predicciones PAGEREF _Toc239181015 \h 59
M7.5 Dashboards por rol PAGEREF _Toc239181016 \h 60
M7.6 Campos y estados que el modelo de datos debe garantizar PAGEREF _Toc239181017 \h 60
M7.7 Métricas del área de cliente [NUEVO — R03] PAGEREF _Toc239181018 \h 60
M8. Portal de cliente y comunicación externa PAGEREF _Toc239181019 \h 61
M8.1 El modelo de dos niveles [DECIDIDO 21/08] PAGEREF _Toc239181020 \h 61
M8.2 Nivel básico PAGEREF _Toc239181021 \h 62
M8.3 La hoja de vida reducida PAGEREF _Toc239181022 \h 62
M8.4 Nivel completo PAGEREF _Toc239181023 \h 63
M8.5 Identidad y acceso PAGEREF _Toc239181024 \h 63
M8.6 Regla de apertura del portal [DECIDIDO — R03] PAGEREF _Toc239181025 \h 64
M8.7 Certificados y calibración PAGEREF _Toc239181026 \h 64
M8.8 Canales de entrada PAGEREF _Toc239181027 \h 65
M8.9 Servicio premium [FUTURO] PAGEREF _Toc239181028 \h 65
M9. QA/QC, calibración y cumplimiento PAGEREF _Toc239181029 \h 65
M9.1 Control de calidad interno PAGEREF _Toc239181030 \h 65
M9.2 Trazabilidad y evidencia PAGEREF _Toc239181031 \h 66
M9.3 Documentación publicada al cliente [NUEVO — R03] PAGEREF _Toc239181032 \h 66
M10. Movilidad, UX y modo offline PAGEREF _Toc239181033 \h 66
M10.1 Experiencia del técnico PAGEREF _Toc239181034 \h 66
M10.2 Dispositivos PAGEREF _Toc239181035 \h 67
M10.3 Modo offline PAGEREF _Toc239181036 \h 67
M10.4 Arquitectura de mini-apps PAGEREF _Toc239181037 \h 67
M11. Arquitectura, integraciones y datos PAGEREF _Toc239181038 \h 67
M11.1 Decisiones de arquitectura tomadas PAGEREF _Toc239181039 \h 67
M11.2 Stack recomendado [PROPUESTO] PAGEREF _Toc239181040 \h 67
M11.3 Integraciones PAGEREF _Toc239181041 \h 68
M11.4 Seguridad, permisos y auditoría PAGEREF _Toc239181042 \h 68
M11.5 Infraestructura PAGEREF _Toc239181043 \h 68
M11.6 Herramientas de desarrollo y prototipado PAGEREF _Toc239181044 \h 69
M11.7 Deuda técnica registrada PAGEREF _Toc239181045 \h 69
M12. Conocimiento, formación y capa RAG PAGEREF _Toc239181046 \h 69
M12.1 Producción de contenido formativo PAGEREF _Toc239181047 \h 69
M12.2 Las dos bases de conocimiento [DECIDIDO 21/08] PAGEREF _Toc239181048 \h 70
M12.3 Arquitectura de la capa RAG PAGEREF _Toc239181049 \h 70
M12.4 El copiloto interno (sobre la KBI) PAGEREF _Toc239181050 \h 71
M12.5 El agente conversacional del cliente (sobre la KB Externa) PAGEREF _Toc239181051 \h 71
M12.6 Gobernanza documental PAGEREF _Toc239181052 \h 72
M12.7 Distribución de firmware y software PAGEREF _Toc239181053 \h 72
M12.8 Conexión con el resto del sistema PAGEREF _Toc239181054 \h 72
3. Backlog priorizado y roadmap PAGEREF _Toc239181055 \h 73
3.1 Criterios de priorización PAGEREF _Toc239181056 \h 73
3.2 MVP — P0 · «Control y ejecución» PAGEREF _Toc239181057 \h 73
3.2.1 Correcciones del blueprint implementado — P0 · prioridad inmediata PAGEREF _Toc239181058 \h 75
3.3 Fase 2 — P1 · «Eficiencia y flujo» PAGEREF _Toc239181059 \h 76
3.4 Futuro — P2/P3 · «Promesa, predicción y ecosistema» PAGEREF _Toc239181060 \h 77
3.5 Roadmap PAGEREF _Toc239181061 \h 78
4. Anexos PAGEREF _Toc239181062 \h 79
Anexo A — Benchmark de mercado y lecciones aplicables PAGEREF _Toc239181063 \h 79
A.1 Segmento enterprise / EAM PAGEREF _Toc239181064 \h 79
A.2 Segmento mid-market / cloud-native PAGEREF _Toc239181065 \h 79
A.3 Segmento mobile-first PAGEREF _Toc239181066 \h 80
A.4 Nicho y emergentes PAGEREF _Toc239181067 \h 80
A.5 Posicionamiento objetivo de Ambientalia PAGEREF _Toc239181068 \h 80
Anexo B — Catálogo consolidado de estados PAGEREF _Toc239181069 \h 81
B.1 Estados por área que los mueve [AS-BUILT] PAGEREF _Toc239181070 \h 81
B.3 Estados sin salida, en todos los flujos [R05] PAGEREF _Toc239181071 \h 81
B.2 Estados retirados del catálogo en la R04 PAGEREF _Toc239181072 \h 82
Anexo C — Registro de decisiones por reunión PAGEREF _Toc239181073 \h 82
C.1 — 17/02/2026 · Revisión de operativa y flujos PAGEREF _Toc239181074 \h 82
C.2 — 19/02/2026 · Diagnóstico Grimm y prototipado PAGEREF _Toc239181075 \h 82
C.3 — 14/08/2026 · Desarrollo y transición a Desk 2.0 PAGEREF _Toc239181076 \h 83
C.4 — 20/08/2026 · Hojas de vida y auditoría de flujos PAGEREF _Toc239181077 \h 83
C.5 — 21/08/2026 · Desarrollo de Desk 2.0 y planes de formación PAGEREF _Toc239181078 \h 83
C.6 — 21/08/2026 · Sesión de trabajo sobre ejes de valor y área de cliente PAGEREF _Toc239181079 \h 84
C.7 — 21/08/2026 · Auditoría del blueprint implementado PAGEREF _Toc239181080 \h 85
C.8 — Febrero de 2026 · Las hojas de mapeo y el diccionario (incorporadas en la R05) PAGEREF _Toc239181081 \h 86
C.9 — 27/08/2026 · Códigos internos, checklists dinámicos, órdenes de venta y priorización PAGEREF _Toc239181082 \h 86
C.10 — 03/09/2026 · Sesión celebrada PAGEREF _Toc239181083 \h 89
Anexo D — Puntos abiertos que requieren decisión PAGEREF _Toc239181084 \h 90
Anexo E — Glosario PAGEREF _Toc239181085 \h 94
Anexo F — Fuentes PAGEREF _Toc239181086 \h 96
Anexo G — Diccionario de campos de la tabla de tickets PAGEREF _Toc239181087 \h 97
G.1 Identificación del ticket y del cliente PAGEREF _Toc239181088 \h 98
G.2 Estado, ciclo de vida y clasificación PAGEREF _Toc239181089 \h 98
G.3 Equipo PAGEREF _Toc239181090 \h 98
G.4 Personas, prioridad e interacción PAGEREF _Toc239181091 \h 98
G.5 Fechas de hito PAGEREF _Toc239181092 \h 99
G.6 Indicadores calculados PAGEREF _Toc239181093 \h 99
G.7 Columnas marcadas como no relevantes PAGEREF _Toc239181094 \h 100
G.8 Cómo usar este anexo PAGEREF _Toc239181095 \h 100
Anexo H — Seguimiento: as-built frente a plan PAGEREF _Toc239181096 \h 100
H.1 Cómo se lee y cómo se mantiene PAGEREF _Toc239181097 \h 100
H.2 Los cuatro flujos PAGEREF _Toc239181098 \h 101
H.3 Las doce correcciones PAGEREF _Toc239181099 \h 101
H.4 Los doce módulos PAGEREF _Toc239181100 \h 102
H.5 Los indicadores PAGEREF _Toc239181101 \h 103
H.5b El plan, tras el acta del 27/08 PAGEREF _Toc239181102 \h 103
H.6 Lo que esta revisión deja en entredicho PAGEREF _Toc239181103 \h 103
Anexo I — Registro de comentarios de revisión (Man on the Loop) PAGEREF _Toc239181104 \h 104
I.1 Lo que esta revisión enseña sobre el propio documento PAGEREF _Toc239181105 \h 107
1. Resumen ejecutivo
1.1 Propósito de este documento
Este documento consolida, en un único lugar, todas las ideas, funcionalidades, decisiones y pendientes que Ambientalia ha generado alrededor del proyecto Desk 2.0 : la plataforma propia que sustituirá a Zoho Desk y a las automatizaciones dispersas en n8n.
Se ha construido a partir de las cuatro fuentes de trabajo del espacio de Notion «CMMS (Desk 2.0) Ambientalia» —Ideas, IA, analisis-tickets y Reuniones—, más el esquema de ejes de valor trabajado en sesión el 21/08/2026.
Desde la revisión R04 se añade una fuente de naturaleza distinta a todas las anteriores: el propio código de la aplicación. Las fuentes de Notion recogen lo que se quiere construir; el código recoge lo que ya está construido. Cuando ambas discrepan, este documento marca explícitamente cuál es cuál.
La R05 añade la tercera pata: las hojas de mapeo originales de los cuatro flujos y el diccionario de campos. Son el trabajo de campo de febrero de 2026, del que hasta ahora este documento sólo tenía resúmenes. Con las tres fuentes juntas —lo que se quiere, lo que está construido y lo que se levantó del sistema actual— ya se puede distinguir un error de diseño de un error de transcripción, que es justamente lo que la R05 encuentra.
El documento tiene cuatro capas de lectura: un resumen ejecutivo (Parte 1), el marco de ejes de valor que explica para qué se construye la plataforma (Parte 1, §1.4), una especificación funcional completa por módulos (Parte 2) y un backlog priorizado con roadmap (Parte 3), más los anexos de soporte.
1.2 Novedades de esta revisión (R08.2)
La R08.2 es una revisión de corrección y registro, no de reescritura. Incorpora las decisiones que Gerencia tomó el 10/09/2026 sobre los puntos preparados para la sesión del 11/09, aplica las correcciones trazables que las tandas F0-00 a F1A-01 levantaron al contrastar este documento con el código, y deja constancia de que la sesión del 03/09/2026 sí se celebró.
La regla que gobierna esta revisión. Toda afirmación sobre el comportamiento del código lleva ruta y línea; toda afirmación sobre este documento, apartado; lo demás lleva delante la palabra «hipótesis». Una cita de segunda mano es una hipótesis, aunque venga de un documento propio. Donde las fuentes no dicen exactamente qué escribir, el texto lo marca como pendiente en lugar de rellenarlo. Lo que entra en esta revisión va marcado [R08.2].
Tres clases de cambio, que no son intercambiables
Clase
Cuántos
Qué es y dónde está
Erratas
12
El documento decía algo falso. Diez proceden del registro de correcciones F0-01 (entradas 1, 2, 3, 6, 8, 9, 11, 12, 13 y 14) y dos son nuevas del 10/09: M1.4 tenía cinco transiciones y son seis (15), y el formato de las subórdenes (16). La 16 no es una errata de transcripción: modifica un [DECIDIDO 27/08], y el texto lo dice.
Decisiones del 10/09
7
El documento todavía no las contenía: Verificación condicional por familia de equipo (M1.4) · la verificación no se mide con la duración del estado (M7.3) · cardinalidad 1 ticket : N OV (M4.4) · criterios de la subOV de lote (M4.4) · «OV obligatoria para trabajar, no para recibir» (M1.2) · las tres fechas derivadas las impone el servidor (M1.10) · el mapa del blueprint se genera desde el código (Anexo F). Registro en C.11.
Puntos del Anexo D
3 + 3
Se cierran el nº 21 y el nº 52; el nº 38 queda parcialmente resuelto. Del registro F0-01 se cierra además el nº 33 (C1), se amplía el nº 62 y se abre el nº 64 (histórico de C1).
Lo que hay que mirar de frente
La lección de la R05 se repitió dentro de la propia R05. La R05 retiró con razón una fila falsa de M1.4 y no añadió la real, de modo que el documento sostuvo durante cuatro revisiones que Verificación no tenía salida. Se usó 71 veces. El riesgo no estaba en levantar el proceso, estaba en resumirlo sin volver a la fuente.
El documento tenía el dato y no lo cruzó. La ficha M-2 de M11.7 estimaba el arreglo de C1 en «una línea» en la celda contigua a la que describía su efecto con todas sus letras —la casilla sin marcar guarda false—, que es precisamente la segunda pieza del arreglo. Costó dos.
Una promesa no es un mecanismo. El mapa del blueprint iba a actualizarse con cada auditoría y nadie lo hizo. Pasa a generarse desde el código, con una prueba que impide el desfase (Anexo F). Queda nombrado, no resuelto, un hueco de dos entre los 38 pasos que cita M1.3.3 y los 36 que declara el código.
La sesión del 03/09 se celebró y el documento siguió diciendo lo contrario en diez sitios. Es el riesgo que describe el punto abierto nº 61. La R08.2 corrige los diez, y en M2.5 deja escrito que el encadenamiento entre ítems sigue sin decisión.
Lo que no entra en esta revisión
Las correcciones al plan de fases, que es otro documento · las entradas 4, 5 y 7 del registro F0-01, que corrigen el baseline as-built y no este documento · la entrada 10, porque en ese punto el documento está bien y lo que falla es un comentario del código · las cinco menciones legítimas de MCP como herramienta de la capa de conocimiento, que se dejan como están · y la titularidad OV ↔ equipo, que sigue abierta y no se apoya en el nº 52.
Después de esta revisión
La copia citable en .md se regenera desde este .docx, y eso desplaza todas las citas por línea del repositorio: las specs, los registros de correcciones, el documento de decisiones y CLAUDE.md. Es una tanda de barrido propia, no un efecto secundario. El Anexo I.2 conserva, para cada cambio, la línea de la copia de la R08.1 de la que parte.
1.3 Qué incorporaron las revisiones anteriores
La R08.1 — el acta del 27/08 y la convocatoria del 03/09
La R08.1 es una revisión de complemento, no de reescritura: incorpora el acta de la sesión del 27/08/2026, que ninguna revisión anterior recogía, y la convocatoria del 03/09/2026.
La del 27/08 es la sesión con más decisiones desde el 14/08, y su ausencia explica varios de los huecos que este documento arrastraba. Ocho temas, once decisiones firmes y tres frentes que quedan sin responsable.
Lo que el acta del 27/08 resuelve
Decisión
Qué cierra
Arquitectura híbrida del diagnóstico: macro-fases como transiciones de estado, y dentro de cada una un checklist dinámico parametrizado por marca-modelo, con campos de valor además de casillas.
Cierra el punto abierto nº 45. Las macro-fases ya eran comunes; lo que se parametriza es el checklist. Incorporar un equipo nuevo deja de ser desarrollo y pasa a ser configuración. Ver M2.1.
Subdivisión de la orden de venta en subórdenes (el 27/08 se acordó OV-XXX_1, _2…; formato revisado en la R08.2: OV-AAAA-NNN-SS, p. ej. OV-2026-170-01), con un ticket por subservicio. Modifica el criterio de la reunión anterior.
Habilita el informe trimestral de avance de contrato y corrige la lectura de consumibles reservados. Ver M4.4.
El código interno del cliente entra como identificador secundario de búsqueda.
Resuelve el origen del dato del punto abierto nº 9 y ataja un riesgo comercial: las órdenes de compra llegan referenciadas por ese código, no por el serial. Ver M3.1.
El protocolo se extiende a informe de salida para todo tipo de servicio, con evidencia fotográfica y motivos tipificados.
Cubre un vacío que este documento no tenía identificado: no había trazabilidad entre el ingreso del equipo y el informe. Ver M2.5.
Captura en base de datos en lugar de carpetas, con entregables por plantilla; migración del histórico como desarrollo aparte y botón «Ver en Google Drive» como fase 0.
Ver M3.5.
Portal de cliente y seguridad pasan a etapa independiente, posterior a la versión interna.
Pone en entredicho el ítem 26 del MVP. Ver M8.
Se conserva una vía de escape manual para el cambio de estado.
Matiza la corrección C3: la salida automática no sustituye a la manual. Ver M1.3.4.
QR del certificado, cálculo de incertidumbre y etapas de validación con firma como requisitos de fase posterior.
Ver M9.1.
Lo que hay que mirar de frente
El documento no tenía el acta del 27/08. Cinco revisiones consolidando fuentes y faltaba la sesión más densa en decisiones del último mes. No es un descuido de redacción: es que el documento no tiene un mecanismo que garantice que las actas nuevas entran. Conviene establecerlo, y es lo que propone el punto abierto nº 61.
El acta pide retirar las referencias a lo construido. El 27/08 se decidió «retirar de la próxima versión las referencias al estado actual construido del Desk 2.0», por considerar que el contraste con el demo introduce ruido. Esa decisión choca con la capa as-built que las R04 a R08 construyeron y con el Anexo H, encargado expresamente en la revisión posterior. La R08.1 no retira nada y deja la contradicción a la vista para que se resuelva en la sesión del 03/09: ambas posturas son defendibles y no me corresponde elegir. Punto abierto nº 62.
El acta numera los módulos de M1 a M8, no de M1 a M12. Conviene confirmar si son la misma estructura vista en grueso o si el 27/08 acordó una agrupación distinta. Punto abierto nº 63.
La sesión del 03/09 — convocada al cierre de la R08.1, celebrada después
[R08.2] La R08.1 se cerró con la convocatoria, no con el acta. La sesión se celebró el 03/09/2026 a las 14:00 por Google Meet, con Alfonso García del Pino (Gerencia, moderador), Gustavo Novoa (Dirección Técnica) y Johny Luna (Servicio Técnico). Trató ocho temas y dejó doce decisiones escritas y doce tareas con responsable. El acta es la fuente citable del repositorio (docs/Manifesto/Desk2.0_Acta_Sesion_2026-09-03.md) y se recoge en C.10. La siguiente sesión queda fijada para el viernes 11/09/2026.
Aporta además el criterio con el que se piensa ordenar el MVP: replicar primero la funcionalidad del Desk 1.0 para migrar rápido y crecer después por funciones. No coincide con el criterio que ordena hoy §3.1, y conviene resolverlo explícitamente. Punto abierto nº 60.
Puntos abiertos nuevos
Doce: 52 variantes reales de orden de venta · 53 identificación de contratos y subórdenes · 54 convivencia con Google Drive · 55 módulo de backup · 56 norma de taxonomía de fallas (ISO 14224) · 57 responsable de la seguridad del portal · 58 alcance de la KBI frente a la KBE · 59 ruta del equipo sin novedades · 60 criterio de ordenación del MVP · 61 mecanismo de incorporación de actas · 62 qué se hace con la capa as-built · 63 correspondencia entre los módulos M1–M8 del acta y los M1–M12 del documento.
La R08 — la revisión humana completa
La R08 es la primera revisión que nace de una lectura completa del documento por el revisor humano. Procesa 73 observaciones anotadas sobre el texto de la R07, y de ellas salen decisiones, correcciones, aclaraciones y nueve puntos abiertos nuevos. El procedimiento está descrito en §1.11 y la trazabilidad completa, en el Anexo I.
Lo que cambia de fondo
El as-built de hoy es un demostrador, no un producto. El revisor acota el alcance de la etiqueta as-built: lo construido es un toy demo. Eso no resta valor a los hallazgos —al contrario, los convierte en decisiones de proceso que conviene resolver antes de empezar el desarrollo estructurado— pero cambia cómo se leen. Ver §1.10.
El backlog del MVP queda en revisión. Se congela tal como está hasta una sesión de trabajo específica: la lista se armó antes de conocerse el as-built y antes de las decisiones de esta revisión, y ya no las refleja. El Anexo H es el documento con el que sentarse a esa revisión.
Se cierra el salto de numeración de módulos. Doce módulos, de M1 a M12, sin huecos. Los huecos del backlog y de los puntos abiertos se mantienen, porque ahí el número identifica un elemento concreto que puede haberse citado fuera del documento.
Aparece la tabla de seguimiento. El Anexo H compara, línea a línea, lo planificado con lo construido —los cuatro flujos, las doce correcciones, los doce módulos y los indicadores—. Es la herramienta de control del proyecto, pensada para actualizarse en cada revisión.
Decisiones y correcciones que trae la revisión
Cambio
Dónde
Los tres bodegajes quedan definidos —entrada, proceso y salida— con sus fórmulas. Dos son calculables hoy; el tercero necesita un campo de «fecha de aviso al cliente» que no existe. Resuelve la corrección C9.
M1.10
Nueva solución para el ciclo de facturación: separar las dos vías en ramas que avanzan, con un estado Pendiente de facturar. Resuelve a la vez la C4 y el punto abierto nº 6.
M1.3.5
La orden de venta previa vuelve a estar en evaluación. El demostrador permite abrir el ticket y recibir el equipo antes de la OV, y eso tiene valor operativo.
§1.8 · M1.2
El prefijo es una formalidad: la rama la define el desplegable de tipo de servicio. Cierra el punto abierto nº 37.
M1.1
Modelo de prioridades concretado: alta con contrato, media y baja según valoración del cliente, el resto sólo manual y por superadministrador o Director Técnico.
M1.9.1
Fecha, hora y persona en toda etapa y transición, sin excepciones.
M1.10
La captura asistida sale del MVP —OCR, QR y reconocimiento visual—. Revierte la repriorización de la R03.
M3.4
Kitting descartado; ubicaciones bin y operación de almacén aplazadas sin descartar.
M5.2 · M5.3 · M5.5
El reabastecimiento ya está resuelto en el Portal Ambientalia · Análisis de Inventario. Lo que queda es leerlo desde el CTP.
M5.4
Reserva de repuestos adelantada al diagnóstico, apoyada en una tasa de aprobación superior al 90 %.
M5.1
Supabase no está en uso. Sólo PostgreSQL en la VPS propia de Hostinger.
M11.5
El flujo posible-cliente queda fuera de alcance; se conserva sólo como documentación.
M1.12
Un mismo evento está clasificado en tres categorías a la vez: la taxonomía no se puede aplicar hasta desambiguarlo.
M1.8
Alternativas al RAG a evaluar con prototipo: wiki tipo Obsidian y MCP contra NotebookLM. Deja en suspenso la elección de pgvector.
M12.3
Un solo modelo de identidad para el portal, con acceso por enlace firmado, en lugar de dos mecanismos.
M8.5
Certificados verificables públicamente como medida antifalsificación.
M8.2
Puntos abiertos nuevos
Nueve: 43 cuarta rama de servicio en sitio · 44 precarga de repuestos hacia el CRM frente a la política de solo lectura · 45 macro-fases comunes a todo el portafolio · 46 desarrollar los criterios analíticos de aprobación · 47 qué repuestos se adelantan y cuáles no · 48 lectura de disponibilidad desde el Portal de Inventario · 49 qué se expone en el certificado público · 50 confirmar el modelo único de identidad · 51 elegir la vía de la capa de conocimiento con un prototipo.
Insumo pendiente
Queda por incorporar la reunión del 03/09/2026, «Checklist dinámico», citada por el revisor en M2.1 y M2.5 y no disponible al cerrar esta revisión. [R08.2] Incorporada como acta en la R08.2: docs/Manifesto/Desk2.0_Acta_Sesion_2026-09-03.md (Anexo C.10).
Las R06 y R07 — retirada del portal del empleado
La R06 no añade contenido: retira alcance. El portal del empleado —vacaciones, permisos, saldos y cadena de aprobación— deja de formar parte de Desk 2.0, por no corresponder a este proyecto.
Qué se retira
Elemento
Dónde estaba
El módulo Portal del empleado completo (entonces M10)
§2 y su apartado propio
Los ítems 16 (portal del empleado) y 24 (doble aprobación y saldos anómalos) del MVP
§3.2
Los hitos de despliegue en beta y de pruebas del módulo
§1.9
Los puntos abiertos 19 (doble aprobación o notificación cruzada) y 22 (umbral del saldo de vacaciones)
Anexo D
Las decisiones de acta que sólo afectaban a ese módulo
§1.8
La mención del portal en la correspondencia de ejes y en el eje ①
§1.4.1 · §1.4.5
Dos criterios que conviene conocer al leer
La numeración se dejó con huecos. No existían los ítems 16 y 24 del backlog, ni los puntos 19 y 22 del Anexo D, ni el módulo M10. (La R08 cerró el hueco de los módulos —ver §1.2— pero mantiene los del backlog y los puntos abiertos, porque ahí el número sí identifica un elemento concreto que puede haberse citado fuera del documento.)
Las actas se conservan. El portal del empleado se discutió el 14/08 y el 21/08, y eso ocurrió. El Anexo C sigue siendo el registro de lo que se dijo en cada reunión, con una nota de alcance que advierte de que ese punto ya no pertenece al proyecto. Es el mismo criterio que el documento aplica desde la R02 a los asuntos del acta del 20/08 que tampoco eran de plataforma —el proyecto Laboratorio ONAC, los Shelters XL, el showroom—.
Qué no cambia
Todo lo demás queda intacto: los cuatro flujos, el blueprint implementado, el diccionario de campos, las doce correcciones y los cuarenta puntos abiertos que siguen vivos. El recuento de módulos pasa de trece a doce, y ése es el único efecto de la retirada sobre el resto del documento.
La R05 — los flujos de origen y el diccionario
La R05 incorporó las hojas de mapeo originales de los cuatro flujos —servicio técnico (16/02/2026), equipo nuevo y soporte remoto (03/02/2026), comercial y posible-cliente (05/02/2026)— y el Diccionario de Campos Tickets, con las 59 columnas de la tabla y las fórmulas de los indicadores derivados.
Cierra tres puntos abiertos que llevaban desde la primera revisión, corrige un módulo, y obliga a matizar públicamente una afirmación de la R04.
La corrección de fondo: la fuente estaba bien
La R04 afirmó que el mapeo manual de §M1.3 tenía cuatro filas correctas de veinte. Es cierto de la tabla que figuraba en este documento. No es cierto de la fuente.
La hoja DFserviciotecnico160226 contiene 34 transiciones y coincide con las 34 implementadas en la aplicación. Las cuatro diferencias que aparecen al compararlas son de etiqueta, no de flujo: Notificación a Comercial frente a Notificación Comercial, Calibración de sensores ext. frente a Calibración sensores ext., y la desambiguación que el código introduce en Notificación cliente (SKU). Lo único que el código añade de su cosecha son las dos entradas propias de la app.
El trabajo de mapeo de febrero, por tanto, estaba bien hecho. Lo que falló fue el resumen que entró al documento maestro: una tabla de veinte filas que perdió transiciones, invirtió direcciones y convirtió tres transiciones en estados. La lección de la R04 cambia de sitio y conviene decirlo sin rodeos: el riesgo no estaba en levantar el proceso, estaba en resumirlo sin volver a la fuente. Es el mismo error de captura del §1.4.3, cometido sobre un documento en lugar de sobre un formulario.
Qué se cierra
Punto abierto
Cómo queda
nº 1 — transcribir los flujos «comercial» y «posible-cliente», que sólo existían como imagen.
Resuelto. Ambos quedan escritos en M1.11 y M1.12, con sus transiciones, estados, terminales y tipos de evento.
nº 2 — reconstruir el diccionario de campos.
Resuelto. Anexo G, con las 59 columnas y las fórmulas de los tiempos derivados.
nº 4 — cómo extraer el timestamp de «Ingreso a servicio» para medir el bodegaje de entrada.
Resuelto, y con mala noticia. La fórmula existe; lo que no sirve es el dato. Ver M1.10.
Qué se añade
Novedad
Dónde queda recogida
Flujo comercial completo: 10 transiciones, 9 estados, dos terminales (Cerrado Ganado / Cerrado Perdido).
M1.11 (nuevo)
Flujo posible-cliente: 4 transiciones, 5 estados, dos terminales.
M1.12 (nuevo)
Diccionario de los 59 campos, con las fórmulas de Tiempo de servicio, Cumplimiento del tiempo promesa, bodegaje, cotización y orden de compra.
Anexo G (nuevo)
La taxonomía de tipo de evento ya existe en las cuatro hojas, con sus listas de eventos concretos. La corrección C5 deja de ser «diseñar una taxonomía» y pasa a ser «aplicar la que hay».
M1.8
Un quinto estado sin salida, en otro flujo: Verificación, en equipo nuevo.
M1.4 · Anexo D nº 38
Las guardas del as-is estaban escritas. La hoja define la condición del checkbox que la C1 corrige, y una restricción por cargo que el código no distingue.
M1.7 · M1.9.1
Zoho tiene un SLA de 1 día sobre Notificado; la aplicación no tiene ninguna regla por tiempo.
M1.7 · Anexo D nº 40
Cinco prefijos en uso —MT, CG, HV, SR, PRO— y una convención de asunto normalizada. La decisión de eliminar CG/MT no dice qué pasa con los otros tres.
M1.1 · Anexo D nº 37
El Tiempo promesa lo fija Servicio Técnico en Escalado a Revisión, no Comercial. Condiciona el diseño del CTP.
M4.2
Existe una calificación de satisfacción del cliente (columna 55) que no figuraba en ningún KPI.
M7.1
La columna Clasificaciones ya dispara las ramas en Zoho: el «menú inicial» decidido el 14/08 existe hoy como campo.
M1.2
De dónde salía el estado fantasma Entregado: existe en el blueprint de Zoho, colgando de un conector suelto.
M1.3.6
Qué se corrige
Tema
Lo que decía la R04
Lo que dicen las fuentes
Calidad del mapeo original
«4 filas correctas de 20».
La tabla del documento, sí. La hoja de origen coincide con el código en las 34 transiciones.
Flujo equipo nuevo
6 transiciones, con una fila «(aprobación implícita) Verificación → En Proceso».
5 transiciones. Esa fila no existe, ni en la hoja ni en el blueprint: Verificación no tiene salida. [R08.2] La retirada fue correcta, pero la conclusión no: la sexta fila real es Verificación —Liberación→ Finalizado, 71 usos (M1.4).
Flujo soporte remoto
4 transiciones, sin verificar.
4 transiciones, verificadas contra la hoja. El mapeo era correcto.
Bodegaje de entrada
Punto abierto: falta el disparador.
La fórmula existe (columna 56). Lo que falta es un dato válido para 2026.
Tipo de evento
«Hay que fijar la taxonomía» (C5).
La taxonomía existe en las cuatro hojas; falta aplicarla y fusionar los tres «operativos» según el acta del 17/02.
La R04 — el blueprint implementado
La R04 incorporó el blueprint de servicio técnico tal como está implementado en la aplicación, leído directamente del código y contrastado contra el commit a3a8f03 del 21 de agosto de 2026. No es una idea nueva ni una decisión de acta: es la radiografía de lo que la plataforma hace hoy.
El motivo de incorporarlo es que no coincide con el mapeo as-is que figuraba en §M1.3 desde la primera revisión. Aquel mapeo se levantó a mano sobre Zoho Desk y arrastra errores de dirección y estados que no existen. De sus veinte filas, cuatro son correctas. Quien haya diseñado sobre §M1.3 ha estado trabajando con un plano equivocado.
Encaja además de forma directa en el marco de la R03. Si el eje ① produce el dato limpio y el eje ② calcula sobre él, un flujo que cierra como «Finalizado» los servicios que en realidad se abandonaron contamina el eje ② desde dentro del eje ①, y lo hace en silencio, igual que un serial mal tecleado (§1.4.3). Las correcciones de §3.2.1 no añaden funcionalidad: reparan la materia prima de los otros dos ejes.
Qué se añade
Novedad
Dónde queda recogida
El blueprint implementado, verificado contra el código: 34 transiciones, 21 estados, 2 entradas, 1 estado terminal. Sustituye al mapeo manual anterior.
M1.3 (reescrito)
Tabla de discrepancias entre el mapeo manual anterior y el flujo real, transición a transición.
M1.3.6
Dos entradas al flujo, no una. Un ticket que viene de Zoho nace en OV asignada; uno creado en la app nace en Ticket creado. Ningún camino lleva de una a la otra, y es deliberado.
M1.3.2
Dos pasos sin botón, escritos por el servidor al crearse o anularse una remisión.
M1.3.3
Capa de derivación y avisos: las 34 transiciones terminan en una casilla «Derivado a», ninguna la exige, y tres etapas proponen destinatario por cargo.
M1.9.2 · M1.9.3
Cuatro estados de espera sin salida de emergencia, cuya única transición depende de un suceso externo.
M1.3.4 · Anexo D nº 31
La ausencia de un estado «Anulado» y su efecto sobre las tres métricas de servicios cumplidos.
M1.10 · Anexo D nº 32
Un checkbox obligatorio que el motor deja saltar (Liberación del ticket sin facturar).
M1.7 · M11.7 · Anexo D nº 33
Ciclo reentrante entre Por Facturar y Por Entregar / Sin facturar que reescribe la fecha de la primera entrega.
M1.3.5 · Anexo D nº 34
Cinco correcciones anteponibles al MVP (C1–C5), con su daño y su esfuerzo.
§3.2.1
Advertencias de calculabilidad sobre cinco indicadores del cuadro de mando.
M7.1
Qué corrige
Tema
Lo que decía la R03
Lo que dice el código
Tabla de transiciones de servicio técnico
20 filas, de las cuales 4 son correctas.
38 filas: 34 transiciones más los dos pasos sin botón y las tres salidas de Habilitar Servicio.
Catálogo de estados
19 estados, 4 de los cuales no existen en la aplicación: Entregado, Reporte por Garantía, Facturado y Rechazo.
21 estados. Faltaban seis: Ticket creado, Remisión creada, Notificación a Compras, Notificación Comercial, Continuación del proceso y Por Entregar / Sin facturar.
Destino de finalización de servicio
Entregado.
Por Facturar.
Destino de facturado y cierre de TK
Facturado.
Finalizado — es la única de las dos vías de facturación que cierra el ticket.
Destino de Liberación sin factura
Liberación Comercial.
Por Entregar / Sin facturar. A Liberación Comercial se llega por Facturado.
Origen de Diagnóstico complementario
Por Facturar.
Pendiente, y lleva a Continuación del proceso.
Rechazo
Figuraba como estado de destino.
Es una transición, no un estado: entra a Por Facturar desde tres orígenes distintos.
Qué se ratifica
El artefacto de auditoría de blueprints con IA, adoptado como herramienta de mejora continua el 20/08/2026, es el instrumento que produjo esta revisión. La decisión ya estaba tomada; la R04 es su primer resultado incorporado al documento maestro.
Todo el contenido de la R03 se mantiene íntegro. La R04 no retira ninguna idea, decisión ni pendiente: reescribe §M1.3, amplía §M1.7, §M1.9, §M1.10 y §M7.1, corrige el Anexo B y añade seis puntos al Anexo D.
La R03 — ejes de valor, capa de conocimiento y área de cliente
La R03 no añadió actas nuevas. Añade una capa de intención que el documento no tenía: por qué se construye Desk 2.0, en qué orden, y qué convierte la plataforma en un argumento comercial y no sólo en una herramienta interna. Procede del esquema de ejes de valor trabajado el 21/08/2026 y de las precisiones que lo acompañaron.
Qué añadió la R03
Novedad
Dónde queda recogida
Marco de los tres ejes de valor —automatización, análisis e interacción con clientes— planteado como cadena de dependencias y no como bloques independientes. Es el orden de construcción acordado.
§1.4 (nuevo)
El riesgo rector queda nombrado: el error humano de captura. «Control → ↓ Riesgo» significa reducir errores de digitación, no sólo restringir permisos.
§1.4.3 · Principio de diseño nº 8
Capa de conocimiento con dos bases: KBI (Knowledge Base Interna, de Ambientalia) y KB Externa (para clientes), sobre una arquitectura RAG.
M12.4
Agente conversacional para el cliente, restringido a temas técnicos sobre la KB Externa, con guardarraíles y protocolo de derivación a Comercial.
M12.5
Área de cliente en dos niveles: básica (sin contrato de mantenimiento) y completa (con contrato, incluye KB Externa). Es el gancho comercial del producto de contratos.
M8.1 – M8.4
Modelo de identidad escalonado: token por correo para el nivel básico, cuenta registrada para el nivel completo. Resuelve la tensión entre «portal sin login» y la distribución de firmware.
M8.5
Distribución de firmware y software a clientes registrados, con registro por cliente, serial y versión.
M12.7
Agendamiento de citas contra la carga real del taller, distinguiendo solicitar (nivel básico) de reservar (nivel completo), con factor de holgura sobre la capacidad publicada.
M6.4 · M8.4
Repriorización: el OCR de placas y el QR de identificación suben al MVP, por atacar directamente el riesgo de digitación.
§3.2, ítems 27 y 28
KPIs nuevos: conversión de nivel básico a contrato, uso del portal y tasa de corrección de datos capturados.
M7.1 · M7.7
Qué precisó la R03 respecto a la R02
Tema
Lo registrado en R02
Lo que precisa la R03
Lectura
Área de Clientes
«A futuro alimentarán un Área de Clientes con manuales y capacitaciones según nivel de contrato» (M12.2), como idea de futuro dentro del módulo de conocimiento.
El área de cliente se estructura en dos niveles concretos, con contenido, identidad y alcance definidos para cada uno, y su nivel básico entra en el MVP.
No es un cambio de criterio: es la misma idea, ya especificada y con fecha. El módulo que la aloja pasa a ser M8; M12 aporta el contenido.
Acceso al portal
«Portal sin login complejo: acceso por token en enlace de correo» (M8.1).
Token para el nivel básico; cuenta registrada para el nivel completo.
No hay contradicción. La fricción cero se conserva justo donde importa —aprobar una cotización—, y el registro sólo aparece donde es inevitable: descargas de firmware e historial completo.
Relación entre análisis y cliente
El simulador CTP (M4.2) era una herramienta interna para que Comercial prometiera fechas.
El resultado del cálculo de carga se expone al cliente como disponibilidad de agenda.
Es un salto de exigencia, no de alcance: la capacidad deja de ser una estimación interna y pasa a ser un compromiso público. Obliga a un factor de holgura (M6.4).
Herramientas de IA
El copiloto y el diagnóstico asistido figuraban como funcionalidades sueltas (M2.6).
Se apoyan en una arquitectura de conocimiento explícita —RAG sobre KBI y KB Externa— con almacén vectorial, gobernanza y control de versiones.
La IA deja de ser una lista de deseos y pasa a tener una infraestructura nombrada, con sus propias decisiones pendientes (Anexo D, puntos 27 y 29).
La R02 — reunión del 21/08/2026
La R02 incorporó la reunión del 21/08/2026 («Desarrollo de Desk 2.0 y planes de formación»), con Alfonso García del Pino, Gustavo Novoa Guzmán y el equipo técnico (Miguel y Julián). Aportó un módulo nuevo, seis funcionalidades, resolvió un problema pendiente.
Novedad de la R02
Dónde queda recogida
Módulo nuevo: gestión del conocimiento y formación en vídeo. Grabación de procedimientos técnicos cortos en el laboratorio, con plan semanal.
M12
Autocompletado por número de serie. Al introducirlo, el sistema trae cliente y modelo, y asocia el ticket a las órdenes de venta activas.
M1.1
La orden de venta debe existir antes de que Servicio Técnico reciba el equipo, para no bloquear la trazabilidad.
M1.2
Menú visual con fotos para seleccionar accesorios en la recepción del equipo.
M1.2
La interfaz inicial replicará la estructura de Zoho Desk para facilitar la adaptación del equipo técnico.
M10.1
Piloto de modelado: Grimm EDM 180/280, por ser el equipo más complejo.
M2.1
Conexión Zoho → PostgreSQL mediante cliente REST propio con OAuth2 ya operativa, con actualización cada tres minutos.
M11.1
Eliminar también las hojas de cálculo de Excel del circuito operativo.
M11.1
Punto que la R02 dejó matizado. La saturación del cron de Zoho quedó resuelta, no revocada: lo que saturaba era consultar Zoho en vivo; hoy el cron alimenta la base propia y las consultas de la aplicación van contra PostgreSQL.
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
Es la misma restricción que ya figuraba en acta —«las herramientas de IA sólo funcionan sobre bases de datos perfectamente estructuradas»— enunciada desde el otro extremo. La diferencia es de énfasis y es importante: la integridad del dato no es un requisito técnico del proyecto, es el producto del primer eje. Quien construya el eje ① no está preparando el terreno para lo interesante; está entregando lo que hace posible todo lo demás.
De ahí también el paso ① → ①' del esquema: no se automatiza el flujo actual tal cual, se rediseña. El flujo as-built verificado en M1.3 es la radiografía —y desde la R04 es una radiografía real, no un dibujo de memoria—; el flujo con pasos eliminados es el objetivo. (La lectura exacta de este paso queda pendiente de confirmación — Anexo D, punto 23.)
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
Menú visual con fotos para accesorios
M1.2
Accesorios mal nombrados o no registrados
Listas desplegables en lugar de texto libre
M1 · M2.4
Historial no procesable, nomenclaturas divergentes
Alta de equipos nuevos por Comercial con serial y factura
M3.1
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
Que una guarda bloquee de verdad: el checkbox obligatorio
M1.7 · C1
Liberación sin factura afirmada por nadie
Que ningún estado atrape el ticket: salida de emergencia en los cuatro de espera
M1.3.4 · C3
Tickets vivos que no aparecen en ningún backlog
Consecuencia de priorización. Si el riesgo rector es el error de captura, dos ítems estaban mal colocados en el backlog de la R02: el OCR de placas (que figuraba en la fase Futuro) y el QR de identificación (en Fase 2). Ambos atacan el eje ① en su punto más frágil —el momento en que el dato entra al sistema— y en la R03 suben al MVP (§3.2, ítems 27 y 28).
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
Permisos por rol, auditoría inmutable, ISO 9001, contramedidas de captura
M1.9 · M9 · M11.4 · §1.4.3
② Análisis → Programar
Parámetro de carga, calendarios, asignación de trabajo
M6
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
Acta 14/08
M4 (aprobación 1 clic + cola de espera)
3
Nomenclatura CG/MT: un equipo entra por calibración, se detecta falla y requiere correctivo → duplicidad y confusión de códigos.
Acta 14/08
M1 (código único por serial)
4
No se sabe quién asume cada etapa; el traspaso entre técnicos no se formaliza.
Acta 14/08
M1 (roles y traspaso)
5
El historial vive en comentarios de texto libre imposibles de procesar automáticamente.
Acta 20/08
M1 + M3 (estados y campos)
6
Riesgo de perder el rastro de equipos entregados pendientes de cobro («por entregar sin facturar»).
Acta 19/02
M4 (liberación comercial)
7
El flujo obliga a todos los tickets a pasar por revisión técnica y comercial, incluso los que no tienen novedad.
Acta 17/02
M1 (ramificación por tipo)
8
Cualquier técnico ve y ejecuta transiciones que no le corresponden.
Acta 20/08
M1 (permisos por rol)
9
El cron cada 3 minutos contra los servidores de Zoho satura el sistema.
Acta 14/08
M11 (BD propia Postgres) — resuelto
10
Licencias por usuario de Zoho limitan el número de agentes y el enrutamiento automático.
Acta 19/02
M11 (plataforma propia)
11
No se puede medir el bodegaje de entrada: no hay disparador claro de «Ingreso a servicio».
Acta 17/02
M7 (timestamps de transición)
12
Reproceso en «Habilitar servicio»: se vuelven a pedir datos comerciales que ya están en el ticket.
Acta 17/02
M1 (checkbox de validación)
13
El conocimiento técnico («el cómo») depende de personas concretas y genera consultas repetitivas de clientes y personal nuevo.
Acta 21/08
M12 (formación en vídeo + KBI)
14
La operación sigue apoyada en herramientas fragmentadas: n8n, Zoho Desk 1.0 y hojas de cálculo de Excel.
Acta 21/08
M11 (centralización)
15
Errores humanos al registrar los accesorios que acompañan al equipo en recepción.
Acta 21/08
M1 (menú visual con fotos)
16
Si Servicio Técnico recibe el equipo sin orden de venta previa, la trazabilidad queda bloqueada.
Acta 21/08
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
M1.3.4 — corrección C3
21
No existe la anulación. Un servicio abandonado se cierra como Finalizado, y eso contamina las tres métricas de servicios cumplidos.
Código (R04)
M1.10 — corrección C2
22
Un checkbox declarado obligatorio se puede dejar sin marcar y la transición se ejecuta igual — justo el que deja salir un equipo sin factura.
Código (R04)
M1.7 · M11.7 — corrección C1
23
El ciclo entre Por Facturar y Por Entregar / Sin facturar se puede recorrer indefinidamente, y cada vuelta borra la fecha de la primera entrega. Solución propuesta en la R08: separar las dos vías en ramas distintas —ver M1.3.5
Código (R04)
M1.3.5 — corrección C4
24
El indicador de bodegaje de entrada quedó inválido para 2026: se calcula contra la fecha de creación del ticket, y ahora Comercial crea el ticket antes de que el equipo llegue. Definición y fórmulas resueltas en la R08 —ver M1.10, «Los tres bodegajes»
Diccionario (R05)
M1.10 — corrección C9
25
Verificación, en el flujo de equipo nuevo, no tiene ninguna transición de salida.
Hoja 03/02 (R05)
M1.4 — corrección C12
26
Reglas que estaban escritas en el mapeo se perdieron al implementar: la condición del checkbox de liberación, la restricción por cargo y el SLA de un día sobre Notificado.
Hojas + Zoho (R05)
M1.7 · M1.9.1 — correcciones C10 y C11
1.8 Decisiones estructurales ya tomadas
Estas decisiones están cerradas en actas y sesiones de trabajo, y condicionan todo el diseño. El detalle y la justificación de cada una está en el Anexo C.
Decisión
Fecha
Implicación
La plataforma se construye sobre base de datos propia en PostgreSQL; la conexión con Zoho será de solo lectura.
14/08/2026
Independencia, velocidad y protección de la integridad del dato.
Se elimina la nomenclatura CG/MT. El identificador del ticket pasa a basarse en el número de serie, asociado a cliente, modelo y fecha.
14/08/2026
Fin de la duplicidad de códigos entre calibración y correctivo.
El número de serie es obligatorio en la creación de la remisión.
14/08/2026
Trazabilidad garantizada desde el ingreso.
El blueprint se dispara con un desplegable inicial (Equipo Nuevo / Servicio / Soporte Remoto) que oculta pasos innecesarios.
14/08/2026
Un solo sistema, múltiples ramas.
La inspección técnica se diseña por fases lógicas secuenciales de macro a micro, estandarizadas para todos los equipos.
14/08/2026
Se descarta categorizar por sistemas como eje principal.
La priorización es automática según criterios comerciales; se bloquea la edición manual por el técnico.
14/08/2026
«Mis Tickets» se ordena solo, de más a menos urgente.
El sistema formaliza el traspaso de tickets entre agentes al cambiar de fase.
14/08/2026
Trazabilidad de responsabilidad por etapa.
Se inician pruebas piloto de «aprobación en un clic» con clientes con contrato de mantenimiento activo.
14/08/2026
Ataca el cuello de botella de la OC y anticipa el modelo de portal escalonado.
Miguel y Julián se reorientan de programar la herramienta a digitalizar el conocimiento técnico.
14/08/2026
El equipo técnico actúa como generador de conocimiento.
Los equipos nuevos los da de alta el área Comercial/Administrativa en cuanto se conocen los seriales, con cliente y fecha de factura.
20/08/2026
Habilita el control automático de garantía.
Se mantiene la codificación interna actual (serial + modelo) por trazabilidad ISO 9001.
20/08/2026
Cumplimiento normativo.
Se restringen permisos y vistas por rol.
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
Comercial debe crear la orden de venta antes de que Servicio Técnico reciba el equipo. [EN EVALUACIÓN — R08] No es una decisión cerrada
21/08/2026
Evita que la recepción bloquee la trazabilidad.
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
Categorización más medible.
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
La derivación no puede frenar un ticket: la casilla «Derivado a» existe en las 34 transiciones y ninguna la exige.
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
El compromiso de fecha nace en el taller, no en Comercial; el CTP de M4.2 debe alimentarlo, no sustituirlo.
La prioridad del ticket está atada a la calificación del cliente (High para contratos y clientes con análisis favorable, Low para desfavorable).
As-is (R05)
La priorización automática decidida el 14/08 tiene ya su criterio definido y su origen de dato.
Se frena el desarrollo hasta consensuar el documento maestro, y después se trocea el proyecto por fases y prioridades.
27/08/2026
El proyecto pasa de exploración técnica a fase de definición. Meta: versión operativa al 31/12/2026.
Arquitectura híbrida del diagnóstico: las macro-fases son transiciones de estado; dentro de cada una, un checklist dinámico parametrizado por marca y modelo.
27/08/2026
Incorporar un equipo nuevo deja de ser desarrollo y pasa a ser configuración. Resuelve el punto abierto nº 45.
Una orden de venta puede subdividirse en subórdenes (formato OV-AAAA-NNN-SS, revisado en la R08.2; el 27/08 se acordó OV-XXX_1, _2…), con un ticket por subservicio.
27/08/2026
Modifica el criterio anterior. Habilita el informe trimestral de avance de contrato y corrige la lectura de consumibles reservados.
[R08.2] La OV es opcional al crear el ticket y obligatoria en Habilitar Servicio: «obligatoria para trabajar, no para recibir».
10/09/2026
Cierra el punto abierto nº 21. El equipo espera la OV en Remisión creada, que pasa a ser estado de espera de Comercial. Ver M1.2.
[R08.2] Cardinalidad 1 ticket : N OV. La OV global por lote se sustituye por subórdenes OV-AAAA-NNN-SS.
10/09/2026
Cierra el punto abierto nº 52 y revisa el formato de subórdenes del 27/08. Ver M4.4.
El código interno del cliente entra como identificador secundario de búsqueda; el serial sigue siendo el primario.
27/08/2026
Las órdenes de compra y las remisiones llegan referenciadas por ese código, no por el serial.
El aplicativo sustituye carpetas y archivos por captura en base de datos, con entregables generados por plantilla.
27/08/2026
Fin de la creación manual de carpetas en Drive. La migración del histórico va aparte.
El protocolo se extiende a informe de salida para todo tipo de servicio, con evidencia fotográfica.
27/08/2026
Cubre el vacío entre el ingreso del equipo y el informe de diagnóstico.
La seguridad y el portal de cliente pasan a etapa independiente, posterior a la versión interna.
27/08/2026
El objetivo inmediato es la parte interna del sistema.
Se conserva una vía de escape manual para el cambio de estado en casos especiales.
27/08/2026
Ninguna transición prevista cubre todos los casos; la alternativa es editar la base de datos sin dejar rastro.
El QR del certificado, el cálculo de incertidumbre y las etapas de validación con firma entran como requisitos, en fase posterior.
27/08/2026
El QR debe dirigir al área de cliente, no al PDF.
Las dos entradas del flujo no se cruzan, para no sacar del sincronismo un ticket venido de Zoho.
Código (R04)
Remisión creada sólo existe para los tickets nacidos en la app; condiciona toda métrica por estado inicial.
1.9 Alcance, hitos y plazos
Hito
Plazo comprometido
Estado
MVP 100 % funcional de Desk 2.0
Antes de finalizar 2026
En desarrollo (declarado el 14/08/2026)
Piloto «aprobación de diagnóstico en un clic»
Sin fecha; con clientes bajo contrato
Por estructurar
Mapeo as-is de los cinco flujos
02 – 19/02/2026
Completado y verificado en la R05. Servicio técnico (16/02) coincide con el código en las 34 transiciones; equipo nuevo y soporte remoto (03/02); comercial y posible-cliente (05/02)
Diccionario de campos de la tabla de tickets
—
Reconstruido en la R05 — 59 columnas, Anexo G
Blueprint de servicio técnico implementado en la aplicación
—
34 transiciones y 21 estados en producción (verificado el 21/08/2026)
Versión operativa del Desk 2.0
31/12/2026
Meta ratificada el 27/08/2026
Documento maestro consensuado, previo a reanudar el desarrollo
Antes de continuar
En curso —la R08.1 incorpora las actas que faltaban
Prototipo de checklist dinámico sobre el Grimm EDM 180
Para la sesión del 03/09
Pendiente
Excel de la fase de inspección física del Grimm EDM 180
Para la sesión del 03/09
Pendiente —Gustavo y Johny
Consolidado del listado de códigos internos de cliente
Para la sesión del 03/09
Pendiente —Gustavo
Flujo de construcción del informe de servicio en el documento
Para la sesión del 03/09
Pendiente —es el hueco documental más grande
Migración del histórico · módulo de backup · seguridad del portal
Sin fecha
Sin responsable asignado (27/08)
Correcciones C1–C5 del flujo implementado
Antes de cerrar el MVP
Pendientes — ver §3.2.1
Árbol de decisiones del diagnóstico Grimm
Sin fecha
En construcción (Gustavo)
Estandarización de SKUs por fase lógica de revisión
Sin fecha
Pendiente
Migración del historial Desk 1.0 → Desk 2.0
Sin fecha
Mecanismo no definido
Conexión Zoho → PostgreSQL mediante cliente REST propio con OAuth2
—
Lograda (confirmado el 21/08/2026)
Esquema lógico de macro-fases y micro-fases del equipo Grimm
Sin fecha
Pendiente — equipo técnico
Setup de grabación en el laboratorio y primer vídeo piloto
Sin fecha
Pendiente — equipo técnico
Índice de temas a grabar y plan semanal de grabación
Sin fecha
Pendiente — equipo técnico
Área de cliente — nivel básico (hoja de vida reducida y aprobación de cotizaciones)
Dentro del MVP 2026
Por estructurar
Área de cliente — nivel completo (KB Externa, firmware, agendamiento)
2027 · S1
Depende de la capa RAG y del parámetro de carga
Matriz de contenidos por nivel de contrato
Sin fecha
Pendiente — Alfonso / Comercial
Nota de foco. El acuerdo del 14/08 es explícito: el enfoque actual no es el diseño estético de la plataforma, sino lograr un producto mínimo viable 100 % funcional antes de finalizar el año.
1.10 Cómo leer la Parte 2
La especificación funcional se organiza en doce módulos. Cada módulo agrupa las ideas provenientes de las distintas fuentes, marcando su origen cuando resulta relevante y distinguiendo:
[AS-BUILT] — verificado en el código de la aplicación. Es lo que la plataforma hace hoy. (Nuevo en la R04.)
Alcance actual de esta etiqueta [R08]. Lo que hoy está construido es un demostrador, no la plataforma de producción. Por eso los hallazgos marcados como as-built no describen defectos de un sistema en servicio, sino decisiones de proceso heredadas de Zoho que conviene no volver a copiar cuando empiece el desarrollo estructurado. La etiqueta gana importancia, no la pierde, a medida que el demostrador se convierta en producto: es el mecanismo que impedirá que el documento y el código vuelvan a divergir.
[AS-IS] — cómo funciona el proceso en Zoho Desk según las hojas de mapeo de febrero de 2026. Desde la R05 estas hojas son la fuente citada, no un resumen de segunda mano.
[DECIDIDO] — acordado en acta o sesión de trabajo, entra al diseño sin discusión adicional.
[PROPUESTO] — idea recogida en los estudios o en Notion, pendiente de decisión.
[ABIERTO] — punto sin resolver que requiere una definición antes de construir.
[COMENTARIO] / **— observación del revisor humano. Ver §1.11 y el Anexo I 
1.11 Cómo se revisa este documento (Man on the Loop)
Este documento no se escribe de una sola mano. Lo redacta un asistente a partir de las fuentes —actas, hojas de mapeo, diccionario y código— y lo revisa una persona, que lo lee entero y anota sus observaciones sobre el propio texto. Ese es el esquema de supervisión del proyecto: la máquina propone y consolida; la persona decide, corrige y descarta.
El ciclo de revisión
Paso
Quién
Qué produce
1. Redacción
Asistente
Una revisión completa a partir de las fuentes disponibles.
2. Anotación
Revisor humano
Observaciones marcadas [COMENTARIO] sobre el texto.
3. Proceso
Asistente
Cada observación se integra, se responde o se convierte en punto abierto. Ninguna se descarta en silencio.
4. Registro
Asistente
El Anexo I deja constancia de qué se hizo con cada una.
Las tres reglas que hacen que esto funcione
Ninguna observación se pierde. Toda marca de comentario queda registrada en el Anexo I con su disposición —incorporada, respondida, convertida en punto abierto, descartada—. Si el revisor no encuentra su comentario en el anexo, es que se perdió, y eso es un fallo del proceso.
El revisor puede corregir al documento, y el documento lo dice. Varias decisiones de esta revisión contradicen lo que las anteriores daban por cerrado: la orden de venta previa vuelve a estar en evaluación, Supabase deja de figurar, la captura asistida sale del MVP. Se marcan como corrección; no se reescribe la historia.
Lo que la máquina no sabe, lo pregunta. Las observaciones del tipo «no entiendo esto» son señal de que el documento está mal escrito, no de que el revisor no siga. En esta revisión produjeron tres reescrituras —la taxonomía de eventos, el origen de remisiones_entrada y el KPI de precisión de diagnóstico— y una de ellas destapó un defecto real: un mismo evento clasificado en tres categorías a la vez.
Convención de marcas
Además de las etiquetas de estado de §1.10, el texto usa dos marcas de procedencia:
[R08] —y sus equivalentes de revisiones anteriores— señala contenido que entró por una observación del revisor, para distinguirlo de lo que procede de las fuentes.
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
Es el corazón del sistema. Todas las actas coinciden en el mismo diagnóstico: las transiciones —no los estados— son el núcleo de la lógica. Un estado es una foto; la transición es la regla de negocio.
«El mapeo del proceso debe centrarse en documentar las reglas y datos requeridos en las transiciones, porque son el núcleo de la lógica del sistema.» — Acta 17/02/2026
El código de la aplicación confirma esa lectura literalmente: el grafo vive en un solo archivo, packages/shared/src/transitions.ts, y es una lista de transiciones. Los estados no se declaran en ninguna parte — existen porque alguna transición los nombra.
M1.1 Identificación del ticket
[DECIDIDO] Se elimina la nomenclatura CG (calibración) / MT (mantenimiento). El problema: un equipo que entra por CG y presenta falla requiere un MT, generando duplicidad y confusión.
[DECIDIDO] El nuevo identificador se basa en el número de serie del equipo, asociado a nombre de cliente, modelo y fecha.
[DECIDIDO] El campo número de serie es obligatorio al crear la remisión.
[AS-BUILT] El serial se exige además en la transición Habilitar Servicio, porque los tickets sincronizados desde Zoho llegan sin él. Es una de las 27 etiquetas de campo que usan las transiciones, y las 27 mapean a columnas reales de la tabla: ninguna cae al cajón custom_fields, que es donde una etiqueta mal escrita se guardaría sin que nadie la encontrara.
[DECIDIDO] Se conserva la codificación interna actual (serial + modelo) para cumplir la trazabilidad exigida por ISO 9001.
[DECIDIDO 21/08] Autocompletado por serial: al introducir el número de serie, el sistema trae automáticamente la información de cliente y modelo, y asocia el ticket a las órdenes de venta activas. El serial deja de ser sólo un identificador y pasa a ser la llave de entrada de todo el registro.
[DECIDIDO — R03] Identificación física por QR adherido por Ambientalia cuando el cliente no tiene etiqueta propia, para vincular remisión ↔ ticket ↔ hoja de vida. Sube a MVP por su efecto directo sobre el riesgo de captura (§1.4.3).
La convención vigente [AS-IS — R05]
El diccionario documenta la estructura que hoy se exige en el asunto del ticket y en el Código Servicio:
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
[ABIERTO — R05] La decisión del 14/08 elimina la nomenclatura CG/MT por la duplicidad entre calibración y correctivo. Pero los prefijos en uso son cinco, no dos, y los otros tres no describen el tipo de trabajo sino la rama del flujo —HV es equipo nuevo, SR es soporte remoto— que es exactamente lo que la columna Clasificaciones ya distingue. Hay que decidir si desaparecen los cinco, si sobreviven los tres que no causaban el problema, o si el prefijo se deriva automáticamente de la clasificación. Punto abierto nº 37.
Resuelto en la R08. El revisor cierra el punto: el prefijo es sólo una formalidad. La rama de trabajo no la define el prefijo, la define el desplegable de tipo de servicio —la columna Clasificaciones de M1.2—. Por tanto no hay que decidir «qué pasa con HV, SR y PRO» como si fueran parte de la lógica del flujo: no lo son. El prefijo se conserva por legibilidad del asunto y del código de servicio, y puede derivarse automáticamente de la clasificación y del tipo de servicio en lugar de teclearse. Con esto se cierra el punto abierto nº 37.
Lo que sí conviene conservar es la estructura del asunto: es una convención de nombres consistente y verificable, y en la aplicación puede construirse sola a partir del serial —que es la llave— en lugar de teclearse. Es una contramedida de captura más, gratis.
M1.2 Ramificación por tipo de servicio
[DECIDIDO 14/08, ratificado el 21/08] El blueprint se dispara mediante un menú desplegable al inicio del ticket, que envía el caso por la rama correcta y oculta los pasos innecesarios. Ramas identificadas:
Nota del revisor [R08]. No es necesario usar prefijos para identificar la rama: para eso está este desplegable. Ver M1.1.
Rama
Disparador
Estado terminal
Documentado
Servicio técnico
OV asignada (Zoho) / Ticket creado (app)
Finalizado
Sí — as-built verificado contra el código
Equipo nuevo
Ingreso equipo nuevo
Finalizado
Sí — tabla de transiciones (as-is, sin verificar)
Soporte remoto
Solicitud de soporte
Finalizado
Sí — tabla de transiciones (as-is, sin verificar)
Comercial
Apertura de lead o trato
Cerrado Ganado / Cerrado Perdido
Sí — as-is transcrito en M1.11
Posible cliente
Lead entrante
No cualificado / Convertir a Trato
Sí — as-is transcrito en M1.12
[AS-IS — R05] El disparador ya existe. La ramificación no hay que inventarla: la columna Clasificaciones de la tabla de tickets es, en palabras del propio diccionario, «el campo que activa los diferentes flujos de trabajo», y sus valores son equipos para servicio de mantenimiento, equipo nuevo o soporte remoto. La decisión del 14/08 —un menú desplegable al inicio— no crea una capacidad nueva: le pone una interfaz a un campo que ya gobierna el flujo, y le quita la posibilidad de quedar mal diligenciado.
El diccionario añade además el Tipo de Servicio (columna 27), que es una segunda dimensión y no debe confundirse con la rama: Calibración · Diagnóstico · Garantía · Mantenimiento · No aplica · Otro. La rama dice por qué blueprint va el ticket; el tipo de servicio dice qué se le hace al equipo dentro de esa rama.
Precondición comercial de la recepción [DECIDIDO 21/08]
Comercial debe crear la orden de venta antes de que Servicio Técnico reciba el equipo. Si el equipo entra sin OV, la trazabilidad queda bloqueada desde el origen: no hay a qué asociar el ticket ni contra qué validar las condiciones comerciales. Esta regla convierte la OV en requisito de entrada del flujo, no en un trámite posterior.
[AS-BUILT] La regla ya está implementada como campo obligatorio de la transición Habilitar Servicio, junto al serial. Lo que no está resuelto es qué ocurre operativamente si el equipo llega igualmente sin OV: hoy no hay estado provisional ni vía de recepción condicionada. Es el punto abierto nº 21. [R08.2] El estado provisional sí existe: es Remisión creada (ver abajo).
Cómo funciona hoy, y por qué la regla no está cerrada [R08]. El demostrador no exige la orden de venta desde el principio. Permite recorrer Crear ticket (inicio) → Ticket creado → Remisión creada, y es a partir de ahí donde la OV se vuelve necesaria. Esa secuencia tiene una virtud operativa concreta: deja abrir el ticket y recibir el equipo mientras se espera la orden de compra del cliente y la orden de venta de Ambientalia, en lugar de bloquear la recepción.
La decisión del 21/08 queda por tanto en evaluación, no cerrada: hay que analizar si en el futuro la OV pasa a ser obligatoria desde el inicio, asumiendo el bloqueo que eso supone, o si se consolida el modelo actual de exigirla en Habilitar Servicio. Es el punto abierto nº 21, que la R08 reformula en esos términos. [R08.2] Resuelto el 10/09/2026: se consolida el modelo actual.
[DECIDIDO 10/09 — R08.2] OV obligatoria para trabajar, no para recibir. La OV es opcional al crear el ticket y obligatoria en Habilitar Servicio. Cierra el punto abierto nº 21. No contradice el acta del 21/08: aquella pedía OV previa por trazabilidad, y esa intención se conserva donde importa, porque nada entra a diagnóstico ni genera costo sin OV. Lo que se descarta es bloquear la recepción física. La decisión confirma lo construido: los obligatorios del alta son cliente, tipo de servicio, clasificaciones y prefijo, sin OV (apps/desk/server/services/ticketService.ts:88-91), y la orden de venta es obligatoria en habilitar_servicio (packages/shared/src/transitions.ts:86).
El estado provisional ya existe, y es Remisión creada, no Ticket creado:
Estado sin OV
Qué significa
De quién depende
Ticket creado
El equipo no ha llegado — Comercial crea tickets por anticipado desde el 20/08
Cliente / logística
Remisión creada
El equipo está en bodega esperando la OV
Comercial
Remisión creada pasa a ser estado de espera, con área Comercial y alarma a los 3 días sin OV. Hoy no figura entre los estados de espera, así que los equipos parados en bodega no aparecen como espera en ningún sitio. [ABIERTO] Falta declarar qué cargo de Comercial recibe el escalado de esa alarma.
Regla nueva: Habilitar Servicio exige siempre remisión de entrada vigente. Hoy sale de tres orígenes y uno de ellos, Ticket creado, llega a Ingresado sin remisión. Eso deja de ser posible. El servicio en sitio no se resuelve por ese atajo: va a su propia rama, punto abierto nº 43, que sigue abierto. Antes de aplicar la guarda hay que contar cuántos tickets llegaron a Ingresado sin remisión: es histórico que la guarda no repara.
Garantía → OVI. Un servicio en garantía se asocia a una orden de venta interna (prefijo OVI-, total 0). Requiere un cambio de práctica: hoy las OVI se crean a nombre de Ambientalia, y tienen que crearse a nombre del cliente real. Los KPI de ingresos y de ticket promedio deben excluir las OVI. [ABIERTO] Queda por escribir quién crea la OVI de garantía: hoy la crea Servicio Técnico, lo que sería una excepción a la precondición «Comercial crea la OV».
Hallazgo con valor de negocio: las líneas de una OVI conservan el costo de referencia aunque el precio sea 0, así que el costo de garantía por equipo, marca y proveedor queda medible — material para reclamar al fabricante y argumento de M4.5.
Tres lados del mismo asunto. Esta decisión establece que el equipo puede esperar la OV en bodega; C9 mide cuánto espera —el tiempo en Remisión creada es el bodegaje de entrada—; y la regla de M1.10 sobre las fechas derivadas garantiza que la fecha que abre esa espera no llegue mal del navegador.
Consecuencia para el indicador de bodegaje. Si la OV llega después de la recepción, la fecha de la OV es precisamente el hito que cierra el bodegaje de entrada. Ver M1.10.
Recepción de accesorios [DECIDIDO 21/08]
La selección de los accesorios que acompañan al equipo se hará mediante un menú visual con fotos, en lugar de un listado de texto. El objetivo declarado es reducir los errores humanos en el inventario de lo que entra y sale con cada equipo. , tanto en la remisión de entrada como en la de salida [R08]
M1.3 Flujo de servicio técnico [AS-BUILT]
Esta sección sustituye por completo al mapeo manual que figuraba en las revisiones anteriores. Su origen es el código de la aplicación, leído el 21 de agosto de 2026 sobre el commit a3a8f03:
Qué
Dónde vive
El grafo de transiciones
packages/shared/src/transitions.ts
El motor que las ejecuta
apps/desk/server/transitionExec.ts
El enganche de la remisión
apps/desk/server/db/estadoPorRemision.ts
Los permisos por área
packages/shared/src/permissions.ts
La derivación y los avisos
apps/desk/server/services/ticketService.ts · services/avisoArea.ts
Las cifras del blueprint implementado:
Cifra
Qué cuenta
34
Transiciones con botón, declaradas en transitions.ts.
21
Estados por los que puede pasar un equipo.
2
Entradas al flujo: OV asignada (Zoho) y Ticket creado (app).
2
Pasos sin botón, escritos por el servidor.
1
Estado terminal: Finalizado.
4
Estados de espera sin salida de emergencia.
3
Etapas que proponen destinatario de la derivación.
27
Etiquetas de campo, todas mapeadas a columnas reales.
Las etiquetas de las transiciones que aparecen en las tablas siguientes son el nombre exacto que ve el técnico en el botón, salvo las dos marcadas como «sin botón».
M1.3.1 Las tres fases del recorrido
Entrada y remisión — OV asignada · Ticket creado · Remisión creada convergen en Ingresado por la misma transición, Habilitar Servicio.
Precisión del revisor [R08]. La secuencia completa tal como se recorre hoy en el demostrador es Crear ticket (inicio) → Ticket creado → Remisión creada → Ingresado. Crear ticket es el formulario de alta, no un estado del grafo, y por eso no aparece en el mapa de M1.3.7: el blueprint arranca cuando el ticket ya existe.
Diagnóstico, cotización y ejecución — de Rev./Diagnostico a En Proceso, pasando por las notificaciones a Compras, a Comercial y al cliente, y por los cuatro estados de espera.
Cierre administrativo y entrega — de Por Facturar a Finalizado, por la vía facturada (Liberación Comercial → Por Entregar) o por la vía sin factura (Por Entregar / Sin facturar).
M1.3.2 Dos entradas que nunca se cruzan [AS-BUILT]
OV asignada y Ticket creado son la misma fase con dos nombres: la primera es como la llama Zoho y llega así en todo lo que sincroniza; la segunda es como nacen los tickets creados en la aplicación.
Ningún camino lleva de una a la otra, y es deliberado. Mover un ticket venido de Zoho lo marcaría managed_by_app y lo sacaría del sincronismo sin que nadie lo haya pedido. La regla está escrita en un solo sitio: sincronizarEstadoPorRemision corta antes de tocar nada si el estado no es una de las dos fases propias de la app.
La consecuencia operativa es que Remisión creada sólo existe para la mitad de la aplicación: un ticket venido de Zoho no pasa nunca por ese estado, aunque se le cree una remisión. Los dos primeros estados del mapa cuentan una historia distinta según de dónde venga el ticket.
Implicación para el eje ② y para el portal. Cualquier indicador que mida tiempo en Ticket creado o en Remisión creada está midiendo sólo los tickets nacidos en la app. El bodegaje de entrada (punto abierto nº 4) tiene por tanto dos definiciones posibles según el origen del ticket, y hay que elegir una antes de publicar el indicador. Lo mismo vale para la barra de progreso del área de cliente (M8.2): dos equipos idénticos pueden arrancar en estados distintos según cómo se creó su ticket.
M1.3.3 Dos pasos sin botón [AS-BUILT]
Dos de los 38 pasos del mapa no son transiciones con botón: los escribe el servidor cuando ocurre algo con la remisión, sin que nadie pulse nada. Su declaración vive en el archivo de transiciones —packages/shared/src/transitions.ts:150-151, junto a las 34—, y quien los aplica es apps/desk/server/db/estadoPorRemision.ts. Lo que no tienen es from ni to: no son grafo, y por eso quedan fuera de la lista que la pantalla ofrece como botones. [R08.2] La cifra de 38 pasos está en revisión: el código declara 34 transiciones con botón más 2 sin botón, 36. Faltan dos y no se sabe cuáles. Hipótesis: el mapa cuenta caminos y no transiciones —Habilitar Servicio tiene tres orígenes y dibuja tres flechas—. Ver Anexo F.
Desde
Hasta
Qué lo dispara
Ticket creado
Remisión creada
Se crea una remisión para el ticket.
Remisión creada
Ticket creado
Se anula la última remisión del ticket.
Es el único paso reversible automático de todo el mapa. Remisión creada es fase nueva y no quedó atrapada: sale hacia Ingresado con el mismo botón que las otras dos entradas, y vuelve sola a Ticket creado si la remisión se anula.
M1.3.4 Cuatro estados de espera sin salida de emergencia [AS-BUILT]
Casi todos los estados ofrecen al menos un camino para abandonar el ticket: rechazar, devolver, cerrar. Cuatro no. Su única transición de salida depende de que ocurra algo que la aplicación no controla.
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
Sin cancelación, sin caducidad y sin vuelta atrás. Un ticket aparcado en cualquiera de los cuatro se queda aparcado hasta que alguien edite la base de datos a mano. Si el pedido al proveedor se cancela, o el laboratorio externo declara el sensor irreparable, el ticket no tiene adónde ir.
Estado en la R08. El revisor confirma la corrección y la deja pendiente de definir las salidas concretas de cada uno de los cuatro estados. No es una discusión de si hace falta, sino de a dónde va cada uno. Punto abierto nº 31.
Contrasta con un estado corriente como Notificación cliente, que ofrece tres salidas —Aprobación, Aprobación y S. Repuestos y Rechazo— y una de ellas sirve precisamente para abandonar el ticket.
Por qué importa más de lo que parece. Estos cuatro estados son justamente donde el eje ② tiene que medir: el tiempo de espera de repuesto es un KPI del cuadro de mando (M7.1) y una de las causas de desvío que el análisis de cuellos de botella persigue (M7.3). Un ticket que se queda ahí para siempre no sólo se pierde operativamente: distorsiona al alza el indicador que debería delatarlo.
Lo acordado el 27/08 sobre la regresión de estados. Hoy no existe botón de retroceso: el cambio de estado hacia atrás se hace a mano desde propiedades. Se acordó que debe conservarse una vía de escape manual para casos especiales, incluso cuando se implementen las salidas de estos cuatro estados. Es una decisión sensata: ninguna transición prevista cubre todos los casos, y la alternativa a una salida manual controlada es la edición directa de la base de datos, que es lo que hoy ocurre y no deja rastro.
Corrección C3, punto abierto nº 31: dotar a los cuatro estados de una transición de escape —hacia Por Facturar cobrando el diagnóstico, o hacia el Anulado que propone C2— y fijar una caducidad que la dispare o la sugiera.
M1.3.5 Un ciclo entre facturar y entregar [AS-BUILT]
Liberación sin factura baja de Por Facturar a Por Entregar / Sin facturar, y Entrega al cliente sin factura vuelve a subir a Por Facturar.
El diseño tiene sentido —entregar ahora y facturar después, tal como exigen las fechas de corte de facturación de algunos clientes—, pero el ciclo puede recorrerse indefinidamente. Para evitar que la fecha se sobreescriba, es importante aclarar que el campo «Fecha Remisión de Salida» debe registrarse una sola vez: en el momento en que el equipo sale físicamente de nuestras instalaciones.
La solución propuesta por el revisor [R08]
En lugar de parchear el ciclo conservando la primera fecha, la propuesta es eliminar el ciclo: separar las dos vías en ramas que avanzan, y que ninguna vuelva atrás.
Vía
Recorrido propuesto
Con factura
Por Facturar → Por Entregar → remisión de salida → Finalizado
Sin factura
Por Facturar → Por Entregar / Sin facturar → remisión de salida → Pendiente de facturar → Facturado → Finalizado
Es mejor solución que la corrección C4 tal como estaba planteada, y resuelve dos problemas en vez de uno.
La fecha deja de pisarse por construcción. No hay vuelta atrás, así que la remisión de salida se escribe una sola vez en cada rama. No hace falta un campo protegido ni una regla que recuerde no sobreescribir: el grafo ya no permite la segunda escritura.
Aparece el estado que faltaba. Pendiente de facturar es exactamente lo que hoy no existe y que el punto abierto nº 6 lleva pidiendo desde febrero: un sitio donde vive un equipo ya entregado y todavía no cobrado. Hoy ese equipo vuelve a Por Facturar y queda indistinguible de uno que sigue en la estantería. Con la rama nueva es contable, y su antigüedad es un indicador de cobro directo.
Lo que hay que decidir antes de construirlo. Si Facturado pasa a ser un estado —hoy es sólo una transición (Anexo B.2)—, o si Pendiente de facturar va directamente a Finalizado al emitirse la factura. La primera opción es más explícita y encaja mejor con la analítica; la segunda añade un estado menos. Punto abierto nº 34, reformulado en la R08.
Efecto sobre la C4. La corrección se mantiene pero cambia de naturaleza: deja de ser «proteger un campo» y pasa a ser «rediseñar las dos vías de cierre». Sube de esfuerzo —de Baja a Media— y baja de urgencia relativa, porque conviene hacerla junto con la C2 y no antes.
Agrava además un riesgo ya registrado: el rastro de equipos entregados pendientes de cobro (dolor nº 6, punto abierto nº 6). La vía sin factura vuelve a Por Facturar en lugar de cerrar, de modo que un equipo ya entregado y no cobrado queda indistinguible de uno que aún está en la estantería esperando salir.
Corrección C4, punto abierto nº 34: conservar la primera fecha de salida en un campo que no se sobreescriba, o registrar cada vuelta como un evento aparte en el historial.
M1.3.6 Discrepancias con el mapeo manual anterior
Esta tabla existe para quien haya diseñado sobre la versión anterior de §M1.3. De sus 20 filas, cuatro eran correctas. Conviene leerla junto con M1.3.9: el error estaba en esta tabla, no en el mapeo del que salió.
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
Sale sólo de En Proceso.
(en ejecución) → Calibración de sensores → «continúa ejecución»
Lleva a un estado propio, Servicio externo, y sale de dos orígenes: Rev./Diagnostico y En Proceso.
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
El destino es Por Facturar. Entregado no existe como estado.
Notificación cliente → Notificación por garantía → Reporte por Garantía
Notificación por garantía va de Notificación a Compras a En Espera de Repuestos. Reporte por Garantía no es un estado: Reporte por garantía es la transición de Notificado a Notificación a Compras.
Reporte por Garantía → Rechazo de garantía → (salida)
Va de Notificación a Compras a Notificación Comercial.
Reporte por Garantía → Escalado a comercial → (salida)
Va de Notificado a Notificación Comercial.
Por Facturar → Facturado y cierre de TK → Facturado
El destino es Finalizado. Facturado no existe como estado.
Por Facturar → Diagnóstico complementario → (retorno a técnica)
Sale de Pendiente y lleva a Continuación del proceso.
Por Facturar → Liberación sin factura → Liberación Comercial
El destino es Por Entregar / Sin facturar. A Liberación Comercial se llega por la transición Facturado.
Por Facturar → (rechazo) → Rechazo
Rechazo no es un estado, es una transición que entra a Por Facturar desde Rev./Diagnostico, Notificación Comercial y Notificación cliente.
Seis estados faltaban por completo: Ticket creado, Remisión creada, Notificación a Compras, Notificación Comercial, Continuación del proceso y Por Entregar / Sin facturar. Cuatro estados que figuraban no existen: Entregado, Reporte por Garantía, Facturado y Rechazo.
De dónde salía Entregado [R05]. No era invención del documento. El estado existe en el blueprint de Zoho Desk, arriba a la izquierda, colgando de un conector suelto hacia Pendiente: un resto de una versión anterior del flujo que quedó dibujado y sin uso. Quien levantó la tabla lo vio en pantalla y lo dio por vivo. Es un argumento a favor de leer el grafo de su definición y no de su dibujo —y de limpiar el blueprint de Zoho antes de migrarlo, porque cualquier resto así viaja con él.
M1.3.7 Tabla completa: los 38 pasos [AS-BUILT]
Son 38 y no 34 porque Habilitar Servicio es una sola transición que sale de los tres estados de entrada, y porque los dos pasos de la remisión no son transiciones con botón sino algo que escribe el servidor. Ordenados por el estado del que salen. Marcados con ·espera· los cuatro estados sin salida de emergencia; con ·propone·, las tres etapas que ya saben a quién pasarle el trabajo.
Desde
Hasta
Transición
Área
OV asignada
Ingresado
Habilitar Servicio
Comercial
Ticket creado
Ingresado
Habilitar Servicio
Comercial
Ticket creado
Remisión creada
Remisión creada (sin botón)
Servicio Técnico
Remisión creada
Ingresado
Habilitar Servicio
Comercial
Remisión creada
Ticket creado
Remisión anulada (sin botón)
Servicio Técnico
Ingresado
Rev./Diagnostico
Ingreso a Servicio
Servicio Técnico
Rev./Diagnostico
Notificado
Escalado a Revisión ·propone·
Servicio Técnico
Rev./Diagnostico
Servicio externo
Calibración de sensores ext.
Servicio Técnico
Rev./Diagnostico
Por Facturar
Rechazo
Comercial / S. Técnico
Notificado
Rev./Diagnostico
Devolución a corrección
Servicio Técnico
Notificado
Notificación a Compras
Reporte por garantía
Servicio Técnico
Notificado
Notificación Comercial
Escalado a comercial ·propone·
Servicio Técnico
Notificado
Por Facturar
Servicio externo
Servicio Técnico
Notificación a Compras
En Espera de Repuestos
Notificación por garantía
Comercial / Compras
Notificación a Compras
Notificación Comercial
Rechazo de garantía
Comercial / Compras
Notificación Comercial
Notificación cliente
Notificación cliente
Comercial
Notificación Comercial
En espera de SKU inventario
Solicitud SKU
Comercial / Compras
Notificación Comercial
Por Facturar
Rechazo
Comercial / S. Técnico
En espera de SKU inventario ·espera·
Notificación cliente
Notificación cliente (SKU)
Comercial
Notificación cliente
En Proceso
Aprobación ·propone·
Comercial
Notificación cliente
En Espera de Repuestos
Aprobación y S. Repuestos
Comercial / Compras
Notificación cliente
Por Facturar
Rechazo
Comercial / S. Técnico
En Espera de Repuestos ·espera·
En Proceso
Llegada de repuestos
Comercial / Compras
En Proceso
Solicitado
Solicitud repuestos
Servicio Técnico
En Proceso
Pendiente
Marcar como pendiente
Servicio Técnico
En Proceso
Servicio externo
Calibración de sensores ext.
Servicio Técnico
En Proceso
Por Facturar
finalización de servicio
Servicio Técnico
Solicitado ·espera·
En Proceso
Entrega de Repuestos
Servicio Técnico
Servicio externo ·espera·
En Proceso
Retorno de servicios externos
Servicio Técnico
Pendiente
Por Facturar
Servicio externo
Servicio Técnico
Pendiente
Continuación del proceso
Diagnóstico complementario
Servicio Técnico
Continuación del proceso
Notificación Comercial
Notificación re cotización
Comercial
Por Facturar
Liberación Comercial
Facturado
Comercial
Por Facturar
Finalizado
facturado y cierre de TK
Comercial
Por Facturar
Por Entregar / Sin facturar
Liberación sin factura
Comercial
Por Entregar / Sin facturar
Por Facturar
Entrega al cliente sin factura
Servicio Técnico
Liberación Comercial
Por Entregar
Habilitado para entrega
Comercial
Por Entregar
Finalizado
Entrega al cliente
Servicio Técnico
M1.3.8 Lo que el mapa confirma que está sano [AS-BUILT]
Los 21 estados son alcanzables desde alguna de las dos entradas. Contando sólo transiciones con botón, cada entrada alcanza 18 estados además de sí misma: desde OV asignada quedan fuera Ticket creado y Remisión creada; desde Ticket creado, OV asignada y Remisión creada. Remisión creada no es alcanzable por ningún botón: su única entrada es el paso sin botón de M1.3.3, y sumándolo Ticket creado alcanza los 20 restantes. No hay estados huérfanos ni callejones sin salida más allá de Finalizado. [R08.2] Corregido: la revisión anterior mezclaba dos convenciones de recuento (18 sin contar el origen, 20 contándolo y con el paso sin botón).
Finalizado es el único estado terminal. No hay callejones sin salida no intencionados, más allá de las cuatro esperas de M1.3.4.
Las 27 etiquetas de campo mapean a columnas reales de la tabla. Ninguna cae al cajón custom_fields.
El comentario ya no puede declararse obligatorio en ninguna etapa: el ayudante que construye los campos dejó de admitir ese parámetro, y el motor se quedó sin la guarda aparte que lo comprobaba. Es el principio de diseño nº 4 —fin del texto libre en etapas críticas— cumplido en el código: un comentario obligatorio es texto libre elevado a requisito.
Nota sobre la creación del ticket. El mapa arranca ya en un estado porque la creación —la transición 1 del Blueprint de Zoho— se maneja aparte: la fila que escribe createTicket lleva (creación) como origen, que no es un estado de Zoho sino la marca de que esa fila es la foto del nacimiento del ticket y no una transición.
M1.3.9 La hoja de origen coincide con el código [R05]
La hoja DFserviciotecnico160226 es el mapeo de campo del 16 de febrero de 2026: 35 filas, la primera de las cuales es la creación del ticket —Agregar Ticket → Enviar → OV asignada— que el blueprint maneja aparte. Las 34 restantes coinciden una a una con las 34 transiciones implementadas.
Las cuatro diferencias que aparecen al cruzarlas son de etiqueta:
Hoja del 16/02
Código
Lectura
Notificación a Comercial como estado origen
Notificación Comercial
El mismo estado con el artículo de más. Conviene fijar el nombre.
Calibración de sensores ext.
Calibración sensores ext.
La etiqueta del botón se acortó al implementar.
En espera de SKU inventario → Notificación cliente
ídem, etiquetada Notificación cliente (SKU)
El código desambigua dos transiciones que la hoja llamaba igual. Es una mejora, no una desviación.
—
Ticket creado y Remisión creada → Ingresado
Las dos entradas propias de la app. No existen en Zoho y por eso no podían estar en la hoja.
Qué significa esto para el proyecto. El as-is estaba bien levantado y la implementación fue fiel a él. Los seis hallazgos de la R04 no son fallos de traducción entre el mapeo y el código: son propiedades del proceso tal como se diseñó, heredadas del blueprint de Zoho de 2021. Finalizado mezcla terminados y abandonados desde el principio; los cuatro estados de espera nunca tuvieron salida; el ciclo de facturación siempre fue reentrante. No se rompieron al migrar. Se copiaron.
Eso cambia a quién le toca resolverlos: no son deuda de desarrollo, son decisiones de proceso pendientes —y por eso las correcciones C1–C5 llevan un responsable de negocio en el Anexo D y no sólo un responsable técnico.
Diagnóstico del flujo actual
El mapeo original señalaba un problema estructural que el as-built confirma: las transiciones mezclan acciones técnicas, decisiones comerciales y eventos logísticos. La recomendación registrada es separarlas en tres tipos:
Operativas — diagnóstico, calibración, entrega de repuestos.
Decisionales — aprobación, rechazo de garantía.
Logísticas / administrativas — facturar, liberar, entregar.
[ABIERTO] Esa clasificación no llegó al código: las 34 transiciones llevan área y campos, pero no tipo de evento. Es la corrección C5 y el punto abierto nº 35. Sin ella, el análisis de tiempos por tipo de evento previsto en M7.3 no es calculable.
M1.4 Flujo equipo-nuevo [AS-IS]
Fuente: hoja DFequiponuevo030226 y blueprint «Ingreso equipo Nuevo» de Zoho. Corregido en la R05 y completado en la R08.2: la revisión anterior listaba una sexta fila, «Verificación → (aprobación implícita) → En Proceso», que no existe. La R05 la retiró con razón, pero dejó fuera la que sí ocurre —Verificación —Liberación→ Finalizado, 71 usos observados—, y de ese hueco salió el punto abierto nº 38. La rama aún no está implementada en la aplicación.
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
Verificación sí tiene salida [AS-IS — corregido en la R08.2]
Hasta la R08.1 este apartado sostenía que Verificación era un nodo al que se llega y del que no sale ninguna flecha. Era un defecto de documentación, no de operación. La sexta fila que la R05 retiró —«Verificación → (aprobación implícita) → En Proceso»— no existe: cero apariciones en 181 tickets. Pero la salida real sí existe y se usa.
Evidencia [R08.2]. Historial de estados de Zoho Desk de los 181 tickets con clasificación «Equipo Nuevo» (oct-2021 → ago-2026, extracción completa sin muestreo, todos en Finalizado): Ingresado → En Proceso, 192 · En Proceso → Finalizado por Liberación, 116 · En Proceso → Verificación, 72 · Verificación → Finalizado por Liberación, 71 · Verificación → Ingresado a mano, 2 · bucle de producto no conforme, 1. Verificación es paso del flujo, no registro, y Liberación tiene dos orígenes: En Proceso y Verificación.
Lo que el documento llamaba el quinto estado sin salida no lo era. La afirmación de que «un equipo nuevo enviado a verificación de calidad no puede volver al flujo» queda retirada: el equipo sale de Verificación por Liberación, y lo hizo 71 veces. Las dos salidas manuales Verificación → Ingresado (#181 y #203, de 2021) son correcciones de estado hechas a los dos minutos.
Corrección C12, punto abierto nº 38 — parcialmente resuelto [R08.2]. La salida aprobada queda resuelta por los hechos: Verificación —Liberación→ Finalizado. C12 deja de ser una corrección y pasa a ser recuperación as-is: la transición existe en Zoho y se usa, y la escribe desarrollo sin esperar a Calidad. Sigue abierto lo que decide Gustavo / Calidad: si la obligatoriedad de Verificación se ata a la familia de equipo, qué pasó con el lote AP-370 de 2024, confirmar la salida rechazada hacia Notificado —cero rechazos de calidad en 181 tickets— y la guarda de certificado en Liberación desde Verificación.
Verificación es condicional por familia de equipo [OBSERVADO — R08.2]
Regla de facto observada en los mismos 181 tickets: es verificación con gas patrón. Pasan por Verificación los analizadores de gases y los convertidores; no pasan los equipos de partículas ni los accesorios.
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
Excepción sin explicar. Los 23 AP-370 sin Verificación son todos del lote de jul-2024 (#601–#622) y oct-2024 (#653, #654). Fuera de ese lote, todos los AP-370 pasaron.
Estado: la regla se documenta como observada, no como norma. Si se ata a una guarda —«analizador de gases ⇒ Verificación obligatoria antes de Liberación»— o se queda en costumbre lo decide Gustavo / Calidad, y esa parte del punto abierto nº 38 sigue abierta.
Lo que este flujo aporta a los demás
Es el único de los cuatro que tiene una etapa de control de calidad explícita. La corrección C6 —introducir QA antes de la liberación en servicio técnico— puede modelarse sobre ella en lugar de diseñarla de cero, siempre que se cierre antes lo que queda del punto abierto nº 38. [R08.2]
M1.5 Flujo soporte-remoto [AS-IS]
Fuente: hoja DFsoporteremoto030226 y blueprint «Soporte Remoto» de Zoho. Verificado en la R05: las cuatro transiciones que este documento venía recogiendo coinciden con la hoja y con el blueprint. El mapeo era correcto.
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
El bucle de pausa permite medir tiempos reales de espera del cliente y separar trabajo activo de trabajo bloqueado.
M1.6 Modelo objetivo de máquina de estados [PROPUESTO]
**
De dónde salen estas dos referencias y qué aportan [R08]. No son propuestas de Ambientalia: proceden de los estudios de mercado del Anexo A, concretamente del Estudio Funcional de Taller de Servicio y del benchmark de las doce herramientas. Se recogen aquí como material de contraste —«así modela esto quien lleva años haciéndolo»— y no como diseño acordado.
Referencia
De dónde viene
Qué aporta que el flujo actual no tenga
a) Taller
Estudio Funcional de Taller de Servicio
Tres cosas: sub-estados de pausa que paran el reloj del SLA, un destino explícito para el rechazo (Devolución sin reparar) y una etapa de QA con retrabajo. Las tres son huecos reales del blueprint implementado, y están recogidas como correcciones C7, C2 y C6.
b) Campo
Benchmark de herramientas de field service
El modelo de un servicio en casa del cliente: asignación, viaje, llegada, ejecución y validación, con marcas de tiempo por hito. Hoy Ambientalia no lo presta formalmente.
Cómo conviene leerlas. La referencia (a) es la útil a corto plazo: cada una de sus tres aportaciones ya está convertida en una corrección concreta de §3.2.1, y ahí es donde hay que discutirlas —no como «adoptar un modelo» sino como «cerrar tres huecos». La referencia (b) es material para cuando se decida si el servicio en sitio entra en el alcance.
a) Referencia de taller (recomendada)
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
b) Referencia de campo (para servicio en sitio)
**
Nota del revisor [R08]. El servicio en sitio resulta interesante como cuarta rama del blueprint, junto a servicio técnico, equipo nuevo y soporte remoto. Hoy no está en el alcance y no hay mapeo as-is de él —no se presta formalmente—, así que entra como línea a explorar, no como flujo a construir. Si se decide abrirla, el orden natural es el mismo que siguieron las otras tres: levantar primero cómo se hace hoy, y sólo después modelarlo. Punto abierto nº 43.
Borrador → Por aprobar → Abierto → Asignado → En viaje (geo-fencing de salida) → En sitio (geo-fencing de llegada) → En progreso (check-in NFC) → En pausa → Validación de calidad → Cerrado.
Sub-estados obligatorios de pausa. Espera de repuesto · Espera de cliente · Condiciones inseguras. Cada uno debe detener el reloj del SLA de resolución.
c) Distancia entre el modelo objetivo y lo implementado [AS-BUILT]
El modelo objetivo aporta tres cosas que el blueprint actual no tiene. Conviene tenerlas identificadas como brecha, no como contradicción:
Elemento del modelo objetivo
Situación en el as-built
Sub-estados de pausa con parada del reloj de SLA
No existen. Los cuatro estados de espera de M1.3.4 son estados plenos, y nada indica que detengan ningún cronómetro.
Devolución sin reparar como destino explícito del rechazo
No existe. Rechazo lleva a Por Facturar, mezclado con los servicios completados.
Retrabajo tras fallo de QA con prioridad alta
No existe como transición. Lo más cercano es Devolución a corrección, de Notificado a Rev./Diagnostico.
M1.7 Reglas de transición: guardas, disparadores y tiempos
Guardas
No se puede pasar de Diagnóstico a Cotización sin haber listado los repuestos necesarios y las horas estimadas.
No se puede iniciar la ejecución si el cliente no está en estado «Aprobado» — bloqueo financiero.
No se puede pasar a Entregado sin la foto del equipo embalado y el checklist de QA firmado. [R08] —ni sin la remisión de salida
No se puede pasar de En progreso a Validación sin al menos dos fotos cargadas y el 100 % de los ítems críticos del checklist completados.
Las cuatro guardas anteriores son propuestas de los estudios, no acuerdos: ninguna está aprobada. Se conservan como material de diseño y hay que decidirlas una a una antes de construir. [R08]
[DECIDIDO] En «Habilitar servicio» basta el checkbox «Cumple condiciones comerciales».
El estado actual de las guardas [AS-BUILT]
Los campos obligatorios sí se exigen y el motor los comprueba. En Habilitar Servicio lo que queda atado de verdad es la orden de venta y el número de serie.
El checkbox «Cumple condiciones comerciales» dejó de estar declarado obligatorio, y a propósito: el motor no puede exigir una casilla, de modo que el asterisco en pantalla sólo mentía. La decisión de fondo del 17/02 —no rediligenciar OV ni OC— se mantiene intacta.
[CERRADO 09/09 — R08.2] Existe una puerta que no cierra. En buildTransitionPlan, la rama que procesa el checkbox sale antes de la comprobación de campo obligatorio: una casilla marcada como requerida y dejada sin marcar guarda false y la transición se ejecuta sin error.
El único checkbox obligatorio que sobrevive en las 34 etapas es «Liberación del ticket sin facturar» — precisamente el que deja salir un equipo de las instalaciones sin factura. Existe para que alguien afirme algo, y se pasa sin afirmar nada. Está registrado como M-2 en debt.md (M11.7) y el arreglo resultó ser de dos piezas, no de una línea (ver M11.7). Corrección C1, punto abierto nº 33. [R08.2] Cerrada en F1A-01 el 09/09/2026; el histórico escrito antes del arreglo es el punto abierto nº 64.
Las guardas del as-is estaban escritas [AS-IS — R05]
La hoja de mapeo del 16/02 tiene una columna llamada «OPERADORES (condiciones que se deben cumplir para transición)», y en ella dos transiciones llevan su condición escrita de forma explícita:
Transición
Condición documentada en el as-is
Situación
Liberación sin factura
«Liberación del ticket sin facturar: Validación checkbox condición Liberación del ticket sin factura is False». La hoja añade: «esta transición solo puede ser ejecutada por el gerente comercial».
La casilla existe pero el motor no la exige (M-2, corrección C1). La restricción por cargo no está implementada: los permisos son por área, y toda el área Comercial puede ejecutarla. Corrección C10.
Diagnóstico complementario
«cumple la condición Requiere envío a fábrica o diagnóstico adicional is True».
No consta como guarda en el motor.
Esto cambia la naturaleza del hallazgo M-2. No es una validación que nadie pidió y que conviene añadir: es una regla de negocio que estaba escrita en el mapeo y se perdió al implementar. La transición que deja salir un equipo sin factura debía estar condicionada y restringida a un cargo, y hoy no está ni lo uno ni lo otro.
El SLA que se quedó en Zoho [AS-IS — R05]
El blueprint de Zoho Desk muestra un SLA de 1 día sobre el estado Notificado —el estado en el que un diagnóstico espera revisión—. Es la única regla por tiempo que el proceso actual tiene, y la aplicación no la trajo.
Merece atención porque Notificado es la antesala de todo lo comercial: de ahí salen el reporte por garantía, el escalado a comercial y la devolución a corrección. Un diagnóstico parado ahí retrasa la cotización, y la cotización es el reloj que el cliente percibe. Corrección C11, punto abierto nº 40.
Ampliación del revisor [R08]. El SLA no debería limitarse a marcar el retraso, sino escalarlo. Dos piezas:
Aviso redundante por correo cuando una transición cambia de área, además de la notificación en la aplicación —hoy el aviso existe, pero un correo perdido no deja rastro visible para quien espera.
Escalado jerárquico al superarse el SLA: si el estado se excede, el aviso se repite al inmediato superior. Convierte el SLA en algo que actúa, no sólo en algo que se mide.
Encaja con la derivación de M1.9.2, que ya sabe a qué cargo corresponde cada etapa: el escalado puede apoyarse en esa misma tabla en lugar de mantener una jerarquía aparte.
Ninguna de las cuatro guardas propuestas más arriba existe todavía en el código. Las tres primeras dependen de la etapa de QA, que el flujo implementado no tiene: se pasa de En Proceso a Por Facturar por finalización de servicio, sin control de calidad intermedio (M9.1).
Disparadores automáticos
Al entrar en Pausa: espera de repuesto, el sistema genera automáticamente una solicitud de materiales a almacén/compras.
Al aprobar el cliente, se dispara la verificación de stock y se envía correo automático al técnico.
Al ejecutar «Retorno de servicios externos», se alimenta automáticamente la hoja de vida del equipo. [DECIDIDO 20/08]
[R03] Al liberar el equipo para entrega, se publica en el área de cliente la actualización de la hoja de vida reducida y, si aplica, el certificado de calibración (M8.3).
[AS-BUILT] Al ejecutarse cualquier transición, el sistema calcula el área destinataria del aviso a partir del estado de llegada y notifica en la aplicación y por correo. Ver M1.9.3.
[AS-BUILT] Al crearse o anularse una remisión, el servidor mueve el ticket entre Ticket creado y Remisión creada sin intervención humana. Ver M1.3.3.
Transiciones por tiempo
Si un ticket permanece más de 24 h en «Por aprobar», escala automáticamente al responsable.
[DECIDIDO] Si el cliente no aprueba el diagnóstico en el plazo definido (24/48 h, plazo exacto abierto), el equipo sale de la mesa de trabajo y pasa a cola de espera.
Tickets en «Esperando aprobación cliente» con antigüedad > 48 h se listan como cuello de botella en la vista comercial.
[ABIERTO — AS-BUILT] No existe hoy ninguna transición por tiempo en el blueprint implementado. Ni escalado automático, ni caducidad de las cuatro esperas. Todo movimiento requiere que alguien pulse un botón o que el servidor reaccione a una remisión. Las tres reglas anteriores son, por tanto, diseño pendiente y no comportamiento actual.
M1.8 Tipos de evento
[DECIDIDO 17/02] Se fusionan «operativo manual», «operativo comercial» y «operativo digital» en una única categoría Operativo, manteniendo separadas las categorías de decisión/aprobación. La clasificación resultante alimenta la analítica de tiempos por tipo de evento.
La taxonomía ya existe [AS-IS — R05]
Las cuatro hojas de mapeo traen la clasificación completa, con sus listas de eventos concretos. La corrección C5 deja de ser «diseñar una taxonomía» y pasa a ser «aplicar la que hay»:
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
Un solape que hay que resolver antes de aplicarla [R08]. El revisor señala que no se entiende qué hace «Creación de informe» entre los eventos administrativos, y tiene razón en que no se entiende: el mismo hecho aparece en tres categorías. «Generación de informes» figura en Operativo manual y en Operativo digital, y «Creación de informe» en Administrativo.
La lectura razonable es que las hojas distinguen tres cosas distintas con nombres casi iguales: redactar el informe técnico es trabajo del técnico (operativo), generarlo desde el sistema es un acto de la herramienta (digital), y emitirlo —dejarlo cerrado y disponible como soporte del servicio facturable— es un acto administrativo. Si esa es la intención, hay que nombrarlas distinto. Si no lo es, sobran dos de las tres.
En cualquier caso, la taxonomía no se puede aplicar tal cual: un evento que pertenece a tres categorías rompe justamente el análisis de tiempos por tipo de evento para el que se creó. Hay que desambiguarlo al ejecutar la corrección C5. Punto abierto nº 35, ampliado.
El flujo comercial usa una variante propia, adecuada a su naturaleza: Operativo Comercial · Decisional Comercial · Cotización / Pricing (M1.11).
Dos avisos antes de aplicarla. Primero, las hojas son del 3 al 16 de febrero, anteriores al acta del 17/02 que fusionó «operativo manual», «operativo comercial» y «operativo digital» en una sola categoría Operativo: hay que aplicar esa fusión al trasladarla, y decidir si la variante comercial sobrevive como categoría aparte o se absorbe. Segundo, las categorías Compras/Logístico y Administrativo no estaban contempladas en la decisión del 17/02 y son claramente útiles: la primera es la que permite medir el tiempo que el ticket pasa fuera del control del taller.
[ABIERTO — AS-BUILT] El blueprint implementado no lleva ninguna clasificación. Las 34 transiciones tienen área y campos, pero no tipo de evento. Corrección C5, punto abierto nº 35.
M1.9 Roles, permisos, derivación y avisos
M1.9.1 Permisos y traspaso
[DECIDIDO] Cada usuario ve solo los estados y transiciones de su rol.
[DECIDIDO] El sistema formaliza el traspaso del ticket entre agentes al cambiar de fase.
[DECIDIDO] Las prioridades las define Comercial al inicio (contratos, clientes Top 5); se bloquea su edición por los técnicos.
Modelo de prioridad acordado en la revisión [R08]. La priorización automática del 14/08 se concreta así:
Prioridad
A quién corresponde
Origen del dato
Alta
Clientes con contrato de mantenimiento
Condición de contrato
Media
Clientes sin contrato con buena calificación
Portal Ambientalia · Valoración de Clientes
Baja
Clientes sin contrato con calificación baja
Portal Ambientalia · Valoración de Clientes
El resto de prioridades se asigna sólo manualmente y sólo por superadministrador o Director Técnico, para casos especiales. Con esto la prioridad deja de depender del criterio del técnico que abre el ticket y pasa a derivarse de dos datos que ya existen fuera del Desk: el contrato y la valoración del cliente.
Nótese que esto cambia el criterio que documenta el diccionario (Anexo G, columna 9), donde High correspondía a «clientes con análisis favorable o contrato prioritario». El nuevo modelo separa las dos cosas: el contrato manda, y la valoración sólo distingue entre los que no lo tienen.
El sistema ordena automáticamente «Mis Tickets» de más a menos urgente — FIFO inteligente por fecha promesa.
[EN DISCUSIÓN] Especializar al equipo como cadena de producción.
[PROPUESTO] Enrutamiento automático de tickets a técnicos según especialidad o carga de trabajo.
[AS-BUILT] Los permisos por área viven en packages/shared/src/permissions.ts, en un solo sitio y no repartidos por la interfaz. Cada transición declara el área o áreas que pueden ejecutarla: Comercial, Servicio Técnico o Compras. Ocho de las 34 transiciones son compartidas por dos áreas —cinco Comercial / Compras y tres Comercial / Servicio Técnico—; las 26 restantes declaran un área única. [R08.2] Corregido: las revisiones anteriores decían diez (packages/shared/src/transitions.ts:196-238).
[ABIERTO — R05] El as-is exige un nivel de granularidad que el modelo por área no alcanza. La hoja del 16/02 dice de Liberación sin factura que «solo puede ser ejecutada por el gerente comercial», y en varias transiciones el responsable no es un área sino «Propietario del registro (Servicio Técnico)» —quien tiene el ticket, no cualquiera del área—. Son dos ejes distintos de permiso que hoy se aplanan en uno:
Nivel
Ejemplo del as-is
Situación en el código
Área
La mayoría de transiciones.
Implementado.
Cargo
Liberación sin factura — sólo el gerente comercial.
No distinguido. Toda el área Comercial puede ejecutarla.
Propietario del registro
Solicitud y entrega de repuestos, marcar como pendiente, finalización de servicio.
No distinguido. Cualquier técnico puede moverlo.
Conviene resolverlo junto con la derivación de M1.9.2, que ya conoce a «quien tomó el ticket»: el dato para implementar el nivel de propietario ya existe en el sistema. Corrección C10, punto abierto nº 39.
M1.9.2 Derivación: de quién es el trabajo a partir de aquí [AS-BUILT]
El mapa de estados dice por dónde va el equipo. Hay una segunda pregunta que las etapas también responden: de quién es el trabajo a partir de aquí. Es la formalización del traspaso que el acta del 14/08 pedía, ya implementada.
Las 34 transiciones terminan en una casilla «Derivado a», y ninguna la exige. La razón es deliberada: derivar no puede frenar un ticket. Treinta y una heredan al responsable que el ticket ya traía; tres proponen a otro:
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
El cliente aprobó y el trabajo vuelve al taller. Ahí no hay puesto fijo al que mandarlo: hay que devolvérselo a quien diagnosticó ese ticket.
Las dos primeras nombran un CARGO y no una persona. Un identificador de persona ataría el blueprint a que ese empleado siga en la empresa, y el día que el puesto cambiara de manos la etapa derivaría a quien ya no está.
M1.9.3 Avisos: a quién se le notifica [AS-BUILT]
**
Pendiente de reunión [R08]. El revisor solicita tratar este apartado —el cálculo del destinatario del aviso y la pérdida en la ventana entre las dos escrituras— en una sesión de trabajo específica, antes de tomar decisiones. Se mantiene el punto abierto nº 36 y se añade a la agenda pendiente del Anexo I.
El destinatario del aviso se calcula desde el estado de llegada, no desde el área que ejecutó la transición, y se le restan las áreas de quien pulsó.
El motivo es concreto. Escalado a comercial sale de Notificado, la pulsa Servicio Técnico y deja el ticket en Notificación Comercial. Avisar por el área de la transición ejecutada mandaría el aviso justo a quien acaba de hacer el trabajo. Y la resta importa igual: Facturado deja el ticket en una fase que también es de Comercial, y sin restar las áreas del ejecutor se avisaría a Comercial de que le toca a Comercial.
Un administrador tiene las tres áreas, así que no dispara ningún aviso de área: si hace el trabajo de las tres, no hay a quién pasarle el testigo.
La escritura del aviso ocurre fuera de la transacción de la transición. La transición se guarda primero y los avisos después. El motivo es de arquitectura: la tabla de avisos es de la aplicación, y quien escribe la transición vive en el paquete de sincronización; meterla dentro ataría ese paquete a un concepto que no es suyo.
La contrapartida es real y está aceptada: una caída justo entre las dos escrituras pierde el aviso. Lo que importa —la derivación— sí queda en el ticket y en el historial, y quien la recibe la ve igual en su vista. Con el correo ocurre lo mismo: si n8n no responde, la fila se queda sin sellar y eso constituye la cola de reintento, pero la transición no se cae detrás. Punto abierto nº 36.
M1.10 Registro de tiempos, anulación y métricas
Debe quedar registro del momento de llegada a cada etapa, para el análisis de tiempos entre fases y por ramas del flujo.
[DECIDIDO — R08] Toda etapa y toda transición deben registrar fecha, hora y persona. Es requisito de log y de análisis, y no admite excepciones: sin el «quién» no hay trazabilidad de responsabilidad —que es lo que la derivación de M1.9.2 intenta reconstruir a posteriori—, y sin la hora exacta no son calculables ni los tiempos entre fases ni los tres bodegajes de más abajo. El as-built escribe la marca de tiempo y el usuario de cada transición: performed_by se escribe en la misma sentencia que el resto de la fila del historial (packages/zoho-sync/src/db/repo.ts:282-286), y está comprobado en las 34 transiciones (apps/desk/server/transicionesEjecucion.test.ts:312-325). Confirmado en F0-04 [R08.2]; queda por decidir el caso de la constante de respaldo, que sólo actúa si la sesión no trae nombre —el callback de n8n de la remisión, que no tiene sesión—. Lo confirmado es que ninguna fila del historial se escribe sin actor, no que el actor sea siempre una persona identificada.
[DECIDIDO 10/09 — R08.2] Las tres fechas derivadas las impone el servidor. Fecha creación ticket, Fecha Remisión Entrada y Fecha Revisión Informe se derivan hoy en el navegador y el servidor sólo exige que lleguen (apps/desk/server/transitionExec.ts:77). Pasan a calcularse en el servidor, que ignora lo que llegue del cliente para esos tres campos. Por qué: Fecha Remisión Entrada es el operando que abre el bodegaje de entrada; si puede llegar mal, la corrección C9 quedó resuelta sólo sobre el papel.
La zona horaria se fija explícitamente. Dos de las tres —Fecha creación ticket y Fecha Revisión Informe— se derivan de una marca de tiempo convertida a día local, y eso depende del reloj del dispositivo: un ticket creado a las 19:30 en Bogotá es 00:30 UTC del día siguiente. Cinco horas de cada día cambian de fecha si nadie fija la zona. La corrección la fija; no hereda la del proceso que la ejecuta.
[RESUELTO — R05] El bodegaje de entrada tenía fórmula desde el principio. El diccionario la documenta en la columna 56:
date_diff("Fecha creación ticket", "Fecha Remisión Entrada")
Y a continuación añade la instrucción que importa: «2026 omitir esta información». La columna 48 explica por qué: «para 2026 este cálculo se encuentra pendiente de reorganización, debido a que el área comercial crea los tickets con anterioridad a la llegada física del equipo, lo que afecta la precisión del indicador».
Una decisión correcta que rompió un indicador [R05]
Merece nombrarse porque es el patrón, no la anécdota. El alta anticipada por Comercial —decidida el 20/08 para habilitar el control automático de garantía— y la exigencia de orden de venta previa a la recepción —decidida el 21/08 para no bloquear la trazabilidad— son dos decisiones buenas y bien fundadas. Entre las dos invalidaron un KPI, porque la fecha de creación del ticket dejó de significar «el equipo llegó».
Nadie lo registró. El indicador simplemente dejó de calcularse bien, y la única traza de ello vive en una nota al margen del diccionario.
Corrección C9, punto abierto nº 41: redefinir el bodegaje contra un hito que siga significando lo mismo. La vía natural es la que este documento ya prefería —leer el historial de transiciones— tomando la marca de Ingreso a Servicio, que es la transición que registra la llegada física y exige adjuntar la remisión de entrada. Con el matiz de M1.3.2: el ticket puede nacer en dos estados distintos según su origen, así que el hito de referencia debe ser la transición, nunca el estado inicial.
Los tres bodegajes [DEFINIDO — R08]
La revisión aporta la definición que faltaba, y con ella el indicador deja de ser uno y pasa a ser tres. Bodegaje es el tiempo que un equipo pasa en Ambientalia esperando una respuesta del cliente —es decir, tiempo que no depende de nosotros—. Esa frase es la clave: no mide desempeño del taller, mide demora del cliente, y por eso nunca debe sumarse a un indicador de servicio.
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
Dos de los tres ya son calculables hoy. El de entrada usa las columnas 43 y 39 del diccionario; el de proceso es exactamente la columna 58, que ya existe con el nombre «Tiempo de orden de compra». No hace falta ningún campo nuevo para ponerlos en marcha.
El tercero necesita un campo que no existe. No hay ninguna columna que registre cuándo se avisó al cliente de que el equipo estaba listo. La columna 51 lo aproxima con la hora del último cambio de estado, que no es lo mismo: si el aviso se demora dos días respecto a la finalización, esos dos días son de Ambientalia y el indicador se los atribuye al cliente. Hay que añadir el campo, y lo natural es que lo escriba la propia transición que habilita la entrega.
Por qué esto arregla el indicador roto. El bodegaje de entrada así definido no depende de la fecha de creación del ticket, que es lo que lo invalidó en 2026 al empezar Comercial a crear tickets por anticipado. Ancla en dos hechos físicos y comerciales —el equipo llegó, la OV se generó— que siguen significando lo mismo aunque cambie cuándo se abre el registro. La corrección C9 queda por tanto resuelta en su definición y pendiente sólo del campo de aviso.
Y conecta con la corrección C7. Los tres bodegajes son, por definición, tiempo ajeno. Son exactamente los periodos que deben parar el reloj del SLA y quedar fuera del tiempo de servicio: medir al taller incluyéndolos es medirlo por la puntualidad de sus clientes. Conviene construir C7 y C9 juntas, porque son la misma idea vista desde dos sitios.
Y la regla general que conviene adoptar: toda decisión que cambie el momento en que se crea un registro o se rellena una fecha debe revisar los indicadores que dependen de ella. En este documento, esa revisión no existía como paso.
No existe la anulación [AS-BUILT]
Ningún estado lleva a algo parecido a «Anulado». Un ticket que hay que abandonar —el cliente se echa atrás, el equipo resulta irreparable— se empuja por Rechazo hasta Por Facturar, y de ahí a Finalizado.
La consecuencia es que Finalizado mezcla «terminado bien» con «abandonado», y eso contamina las tres métricas de Análisis que cuentan servicios cumplidos:
Métrica afectada
Cómo la contamina
Servicios finalizados
Cuenta como cumplidos los servicios que se cayeron.
Tiempo promedio de servicio
Un ticket abandonado en el día 2 y otro entregado en el día 30 pesan igual.
Cumplimiento (OTD)
Un servicio abandonado puede aparecer como entregado a tiempo.
Es el eje ② calculando sobre ruido producido por el eje ①, que es exactamente lo que §1.4.2 advierte que no puede pasar.
Borrar tampoco es anular. El botón de administrador barre el ticket de las nueve tablas y lo saca de la historia entera: es lo que hace falta para limpiar una prueba, y justo lo que no hace falta para un servicio real que se cayó, que lo que necesita es quedar contado aparte (M11.4).
Corrección C2, punto abierto nº 32: introducir un estado terminal Anulado con su motivo, alcanzable desde los estados donde hoy se usa Rechazo como sucedáneo y desde las cuatro esperas, y excluirlo de las tres métricas anteriores.
M1.11 Flujo comercial [AS-IS]
Fuente: hoja DFcomercial050226, pestaña «comercial», y su diagrama. Transcrito por primera vez en la R05 — cierra el punto abierto nº 1.
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
Distingue el final bueno del malo. Cerrado Ganado y Cerrado Perdido son dos estados terminales distintos, y la transición que lleva al segundo se llama Análisis Causa: no sólo registra que se perdió, obliga a decir por qué.
Es exactamente lo que la corrección C2 propone para servicio técnico, donde Finalizado mezcla los servicios terminados con los abandonados (M1.10). La casa ya sabe hacerlo y ya lo hace en el pipeline comercial. No hay que convencer a nadie de que la distinción importa ni inventar un modelo: hay que llevar al flujo de servicio el que ya existe cinco metros más allá, incluida la buena idea de exigir la causa en la propia transición.
El bucle de cotización
Cotización ⇄ Ajuste Cotización es un ciclo deliberado, con las razones documentadas en el propio mapeo: ajuste de cantidades, inclusión o eliminación de ítems, o cambio de las condiciones comerciales. Y tiene una salida por cada lado —Seguimiento Cotizac. desde Cotización, Seguimiento no adj. desde Ajuste Cotización— de modo que el ciclo nunca atrapa la oportunidad. Es el contraste útil con el ciclo Por Facturar ⇄ Por Entregar / Sin facturar de M1.3.5, que sí puede recorrerse indefinidamente y además pisa una fecha en cada vuelta.
Una discrepancia a resolver
La hoja registra que Preparación Cotizac. sale de Ajuste Especificaciones; el diagrama la dibuja saliendo de Evaluación Especificaciones, en vertical y sin pasar por el ajuste. La diferencia no es cosmética: determina si toda oportunidad tiene que pasar obligatoriamente por una etapa de ajuste de especificaciones antes de poder cotizarse, o si puede cotizarse directamente cuando la primera entrevista no dejó nada pendiente.
Leyendo la descripción del propio mapeo —el ajuste se activa «en caso de que durante la primera entrevista hayan quedado aspectos pendientes por definir»— lo razonable es que existan las dos salidas desde Evaluación Especificaciones. Pero es una definición de proceso, no una interpretación que corresponda a este documento. Punto abierto nº 42.
Alcance de este flujo en Desk 2.0
El pipeline comercial vive hoy en Zoho CRM, no en Desk
Idea del revisor [R08] — precarga de repuestos hacia el CRM. Que Servicio Técnico precargue en Desk 2.0 los artículos objeto de cambio o mantenimiento, y que esa lista genere automáticamente un borrador de cotización en Zoho CRM.
Merece atención porque ataca un reproceso que hoy nadie ha nombrado: el técnico ya identifica los repuestos durante el diagnóstico —es un requisito de M2.3— y alguien vuelve a teclearlos después para cotizar. Es el error de captura del §1.4.3 en su forma más cara, porque una referencia mal transcrita en una cotización se factura.
Tiene una implicación de arquitectura que hay que resolver antes. La decisión vigente es leer Zoho en solo lectura (M11.1). Un borrador de cotización es una escritura. Caben tres salidas: abrir una excepción acotada de escritura sólo para borradores de cotización; dejar la lista lista en Desk y que Comercial la importe con un clic; o esperar a que el CRM también se sustituya. Punto abierto nº 44.
Es el origen de la orden de venta, que desde el 21/08 es requisito de entrada del flujo de servicio (M1.2). Fase Cierre → Cerrado Ganado es el punto exacto donde nace la OV que después habilita el servicio.
Alimenta la predicción de carga (M7.4): las oportunidades en Negociación y Fase Cierre son trabajo que aún no ha llegado al taller pero que va a llegar.
Idea del revisor [R08] — visibilidad del trato desde el ticket. Poder ver desde el Desk en qué etapa del flujo comercial está el trato asociado a un ticket, y sus comentarios.
Es de lectura, así que no choca con la política de solo lectura sobre Zoho y puede construirse ya. Resuelve una pregunta que hoy se responde por chat: «¿el cliente ya aprobó?». Y encaja con los cuatro estados de espera de M1.3.4: tres de ellos —Notificación cliente, En espera de SKU inventario y En Espera de Repuestos— esperan algo que el CRM sabe antes que el Desk.
El conector bidireccional propuesto en M11.3 —que al marcar «Ganada» en el CRM el caso pase a cola de reparación— se enganchará por tanto en la transición Cierre.
M1.12 Flujo posible-cliente [AS-IS]
**
[FUERA DE ALCANCE — R08] El revisor determina que este flujo no es necesario para Desk 2.0. La cualificación de leads vive en Zoho CRM y no toca al ticket de servicio en ningún punto: su única salida hacia el Desk es indirecta, a través del flujo comercial (M1.11), que sí queda dentro por ser el origen de la orden de venta.
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
Observaciones. El flujo es enteramente decisional —no hay ninguna etapa operativa— y vuelve a hacer bien lo que servicio técnico hace mal: separa el descarte del éxito en dos terminales distintos, de modo que la tasa de cualificación es medible sin depender de ningún campo auxiliar.
La hoja escribe el estado como «Convertire a Trato». Se recoge aquí como Convertir a Trato; conviene corregirlo en el origen para que el nombre del estado no viaje con la errata a la nueva plataforma.
M2. Diagnóstico guiado y base de conocimiento
Este es el módulo que convierte la pericia de los técnicos en un proceso repetible, medible y defendible comercialmente. Nace del trabajo sobre el diagnóstico de equipos Grimm, hoy con 78 puntos de control documentados.
M2.1 Estructura del árbol de diagnóstico
[DECIDIDO] Se evoluciona de una lista lineal a un árbol de decisiones con ramas lógicas sí/no. [R08.2] Incorporadas las conclusiones de la sesión del 03/09/2026: una sola tabla de puntos de control para Grimm y Horiba —se elimina la separación entre tabla de inspección y tabla interna— y validación por nivel macro, desplegando subniveles e ítems únicamente cuando el nivel macro resulte «no OK» (Desk2.0_Acta_Sesion_2026-09-03.md:350-351).
[DECIDIDO] El flujo se organiza por fases lógicas y secuenciales, de macro a micro, estandarizadas para todos los equipos (Horiba, Grimm, Environics), no por sistemas. [R08] Pendiente de desarrollo para el Grimm EDM180.
El criterio de ordenamiento es ir de lo más incapacitante a lo menos incapacitante: la primera prueba es siempre la más gruesa —¿el equipo enciende? sí/no— y sólo al fallar se abre el detalle.
Las cuatro macro-fases [DECIDIDO 21/08]
**
La arquitectura híbrida [DECIDIDO 27/08]
El acta del 27/08 resuelve la pregunta de fondo que este apartado tenía abierta, y lo hace de una forma que no estaba sobre la mesa.
El problema era éste: si cada verificación del diagnóstico se modela como una transición de estado, hay que construir una estructura distinta por tecnología —Grimm, Horiba, Environics, sondas— y el esfuerzo de desarrollo se multiplica por cada marca que entre al portafolio. Es lo que hacía inviable el árbol de decisiones tal como se venía planteando.
La solución acordada separa las dos cosas:
Nivel
Qué es
Varía por marca-modelo
Macro —física, óptica, neumática, electrónica—
Transición de estado del blueprint
No. Son las mismas para todo el portafolio
Checklist dentro de cada macro
Contenido parametrizado, con niveles jerárquicos, casillas de verificación y campos de valor (voltajes, flujos, fugas, corriente de láser)
Sí. Es un dato de configuración, no código
Por qué importa tanto. Incorporar un equipo nuevo deja de ser un desarrollo y pasa a ser rellenar una plantilla. El flujo no se rediseña: se parametriza. Y hay un antecedente concreto de viabilidad —el Excel de transiciones entregado en febrero fue interpretado correctamente por la herramienta de desarrollo—, lo que respalda alimentar los checklists desde plantillas en Excel en lugar de desde una pantalla de administración.
Esto cierra el punto abierto nº 45. La pregunta era cómo encontrar macro-fases comunes a todas las marcas. La respuesta es que las macro-fases ya son comunes —son cuatro y no dependen del equipo—; lo que varía es el contenido del checklist que vive dentro de cada una. No había que buscar un denominador común: había que bajar la variabilidad un nivel.
La inspección visual previa [AS-IS 27/08]
Levantada por Servicio Técnico y no recogida hasta ahora:
Se hace antes de energizar el equipo, por componentes, con alcance variable según lo que haya ingresado según remisión.
La fotografía se exige sólo cuando hay novedad, no siempre. Es una decisión de fricción: obligar a fotografiar lo que está bien multiplica el trabajo sin añadir información.
El equipo sin novedades no tiene hoy salida definida. Se acordó que debe recorrer igualmente las etapas macro, dejando constancia de que se revisaron y salieron conformes. Sin ese recorrido no hay diferencia registrable entre «se revisó y estaba bien» y «no se revisó».
Estado de las cuatro macro-fases. Está por definir —trabajo asignado a Johny— un juego de macro-fases que permita un proceso común a todas las marcas y modelos del portafolio, no sólo al Grimm. Es la condición para que el diagnóstico guiado sea una plataforma y no un desarrollo por equipo. Punto abierto nº 45.
Orden
Macro-fase
Comportamiento
1
Física
Si la fase macro aprueba, se asumen correctos sus subcomponentes. Si falla, despliega su checklist micro específico.
2
Neumática
Ídem.
3
Óptica
Ídem.
4
Electrónica
Ídem.
Continuidad entre reuniones. Estas cuatro familias ya figuraban en los próximos pasos del acta del 14/08 para categorizar los SKUs. Lo que el 14/08 descartó fue usarlas como árbol de clasificación paralelo; lo que ambas actas sostienen es usarlas como orden secuencial de recorrido, con lógica macro→micro. No hay cambio de criterio.
Equipo piloto de modelado [DECIDIDO 21/08]
Se utiliza el flujo del modelo Grimm EDM 180/280 como proyecto piloto, por ser el equipo más complejo del catálogo: estandarizar su flujo facilita después adaptar Horiba y Environics.
[TAREA — equipo técnico] Diseñar el borrador de macro-fases y micro-fases de un equipo Grimm y entregarlo a Alfonso para su programación. La instrucción explícita es no perderse en detalles microscópicos.
M2.2 Estructura de cada punto de control
Campo
Contenido
Uso
Fase
Etapa lógica a la que pertenece la prueba
Ordena el árbol y agrupa los tiempos
Prueba
Qué se verifica
Instrucción al técnico
Valor esperado
Rango o resultado correcto
Base de la comparación
Criterio de falla
Alerta · Cobrable · Bloqueante
Determina la acción y el impacto comercial
Acción automática
Qué hace el sistema al fallar
Motor de automatización del diagnóstico
Niveles de criterio de falla
Alerta — se registra y se informa, no detiene el proceso.
Cobrable — genera línea de cotización; alimenta el presupuesto al cliente.
Bloqueante — impide continuar; el equipo no puede liberarse sin resolverlo.
M2.3 Registro, evidencia y comentarios
Cada etapa exige dejar registro de OK / No OK para poder transicionar.
[DECIDIDO] Al fallar un punto de control, se derivan pruebas adicionales de análisis, apoyadas en la información registrada en esa etapa o en las anteriores mediante ayudas basadas en la base de conocimiento (KBI, M12.4). [R08] Analizar como alternativa la vía «LLM wiki» —documentación en Obsidian— frente al RAG clásico. Ver M12.3.
[ABIERTO] Cómo encajar los comentarios ante un problema detectado: ¿textos predeterminados por etapa, o textos dinámicos con consulta a la KB? La inclinación registrada es por textos predeterminados. [R08] Analizar como alternativa la vía «LLM wiki» —documentación en Obsidian— frente al RAG clásico. Ver M12.3.
[PROPUESTO] En cada etapa —o al menos en las No OK— el técnico debe poder seleccionar los artículos/repuestos correspondientes directamente desde el diagnóstico. [R08] El técnico debe ver sólo los repuestos que correspondan a la etapa del diagnóstico en la que está, no el catálogo entero: es lo que hace la selección rápida y lo que evita elegir la pieza de otra fase. Aplica también a la categorización de consumibles y repuestos del apartado anterior.
M2.4 Taxonomía de fallas
Categorías de falla acordadas: físicas/mecánicas · ópticas · electrónicas · neumáticas. Sobre ellas se propone aplicar la taxonomía ISO 14224 simplificada, con menús desplegables en lugar de texto libre:
Dimensión
Ejemplos
Objeto
Bomba · Sensor · Analizador
Síntoma
No enciende · Lectura errática · Fuga
Causa
Desgaste normal · Mal uso · Falla electrónica
Acción
Reemplazo · Ajuste · Limpieza
[VERIFICAR — 27/08] La norma citada no coincide. En la sesión del 27/08 se propuso apoyarse en la taxonomía ISO 14224, mientras que la estructura de objeto, síntoma, causa y acción que este apartado recoge corresponde a la ISO 14224. La propia convocatoria del 03/09 marca la discrepancia para verificarla. La ISO 14224 trata de etiquetado ambiental tipo I, materia distinta; todo apunta a que la referencia correcta es la 14224, que es la que este documento viene citando desde la R01. Conviene confirmarlo antes de adoptarla formalmente. Punto abierto nº 56.
[PROPUESTO] Extender la categorización a consumibles y repuestos.
[PROPUESTO] Construir un árbol de fallas RCM asociado a cada clase de activo.
M2.5 Informes de servicio
1. Se busca el número de ticket en la tabla `remisiones_entrada`. [ABIERTO] Está sin confirmar quién escribe esa tabla: si las remisiones de entrada las registra el propio Desk al recibir el equipo, o si llegan desde la plataforma de hojas de vida y el Desk sólo las lee. La diferencia importa porque de ella depende dónde vive el dato maestro de la recepción —y, con él, la fecha de remisión de entrada, que es el hito con el que arranca el bodegaje de entrada (M1.10). Punto abierto nº 14, reformulado en la R08.
2. Se abre la ficha del ticket y se toman los datos de cliente y equipo.
3. La aplicación recorre el diagrama de flujo diagnóstico, con etapas, transiciones y puntos de control obligatorios. [R08.2] El 03/09 cerró la estructura de la tabla (tema 3), pero el encadenamiento entre ítems —qué verificar tras un «no OK»— salió sólo con tarea y sin decisión (acta:366-370). Mientras siga así, esto es un listado secuencial, no un diagrama de flujo.
4. Se registran los tiempos de llegada a cada etapa para el análisis posterior.
[ABIERTO] Definir el proceso de validación de informes antes de su emisión.
El informe de salida [DECIDIDO 27/08]
El acta del 27/08 nombra un vacío que este documento no tenía identificado: no existe trazabilidad definida entre el ingreso del equipo y el informe de diagnóstico. Es, junto con el diagnóstico guiado, el frente menos documentado del proyecto.
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
[TAREA — Gerencia] Incorporar al documento maestro el flujo completo de construcción del informe de servicio, comprometido el 27/08 y todavía pendiente. Es el hueco más grande que le queda a este documento.
M2.6 Asistencia por IA
** [R08] Analizar como alternativa la vía «LLM wiki» —documentación en Obsidian— frente al RAG clásico. Ver M12.3.
Copiloto para técnicos: el técnico describe el síntoma en lenguaje natural y el sistema, cruzando el histórico del activo y los manuales de la KBI, sugiere causas probables y qué verificar.
Generación de procedimientos a partir de fotos de manuales, mediante OCR y modelo de lenguaje.
Digitalización del conocimiento técnico — [DECIDIDO] Manuales, procedimientos y troubleshooting.
Diagnóstico asistido con sugerencia automática de causa raíz, como meta a medio plazo.
Detección de reincidencias: mismo activo o misma causa en una ventana de 30 días.
Nota de arquitectura (R03). Todas estas funciones se apoyan en la KBI descrita en M12.4. La asistencia por IA recupera y sugiere; no calcula fechas ni compromisos (principio de diseño nº 8).
M2.7 Criterios analíticos de aprobación
**
[R08] Apartado insuficientemente desarrollado. Hoy contiene una sola línea en discusión —la linealidad R² como criterio de aprobación— cuando debería contener el conjunto de criterios analíticos con los que se decide si una calibración es conforme. Es material para una sesión de trabajo con Dirección Técnica, y hasta entonces no puede considerarse especificado. Punto abierto nº 46.
[EN DISCUSIÓN] Usar la linealidad (R²) entre el candidato y el patrón como criterio de aprobación en calibración.
M3. Hojas de vida de equipos (ALM)
El activo es el núcleo del sistema. En el caso de Ambientalia el activo es del cliente, lo que convierte la trazabilidad de garantías y del historial en un requisito comercial además de técnico. Con el modelo de portal en dos niveles (M8), la hoja de vida deja además de ser un registro interno y pasa a ser, en versión reducida, lo primero que el cliente ve de Desk 2.0.
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
Falta
Campo comercial crítico.
Fecha de factura
Falta
Base del cálculo automático de garantía.
Fin de garantía
Falta
Dispara alertas y bloqueos.
Código interno del cliente
Falta
Alfonso debe extraer y entregar el listado.
Visibilidad en el portal
Nuevo (R03)
Marca por campo: visible en la hoja de vida reducida, o sólo interno (M8.3).
Problema resuelto el 20/08. El área técnica creaba el registro del equipo al recibirlo, pero carecía de la información de facturación. Decisión: los equipos nuevos los da de alta Comercial/Administrativa en cuanto conoce los seriales —incluso antes de que lleguen físicamente— asignando cliente y fecha de factura.
M3.2 Taxonomía jerárquica ISO 14224 [PROPUESTO]
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
Timeline histórico — visualización cronológica de todos los eventos: instalación, preventivos, correctivos, cambios de piezas, movimientos.
Historial clínico por serial — cuántas veces ha entrado ese equipo a taller, con todos sus tickets asociados.
Componentes críticos con garantía propia — fecha y garantía de cada parte sustituida.
Gestión de garantías — alerta automática al intentar abrir una orden sobre un equipo con garantía vigente.
Árbol de fallas (RCM) — biblioteca de modos de falla, causas y efectos por clase de activo.
Costos acumulados — gráfico de costo acumulado vs. tiempo, con el ratio Costo de mantenimiento / RAV como umbral.
[DECIDIDO] Las transiciones clave alimentan automáticamente la hoja de vida, sin depender de comentarios manuales.
M3.4 Identificación e ingreso de datos
Este apartado es el que concentra las contramedidas contra el riesgo rector del eje ① (§1.4.3), y por eso su prioridad cambia en la R03.
[DECIDIDO — R03, sube a MVP] QR / NFC en el equipo para identificación, apertura del historial y check-in físico del técnico. En el MVP entra el QR de identificación; el check-in físico por NFC se mantiene en Fase 2.
[DECIDIDO — R03, sube a MVP] OCR en recepción — tablet que fotografía la placa del equipo, extrae marca/modelo/serial y busca si ya existe: si existe abre su historial, si no crea la ficha. Se combina con el autocompletado por serial de M1.1: el OCR propone, el sistema valida contra el maestro de equipos y el operario confirma. El operario nunca teclea el serial completo a mano.
[PROPUESTO] Reconocimiento visual por cámara como respaldo cuando el QR está dañado.
Identificación de equipos por QR enlazando remisión ↔ ticket ↔ hoja de vida.
[R03] Toda captura asistida (OCR, QR, autocompletado) debe registrar si el dato fue aceptado tal cual o corregido manualmente. Ese registro alimenta el KPI de tasa de corrección (M7.1) y permite medir si las contramedidas funcionan.
M3.5 Migración del historial
Lo decidido el 27/08
El aplicativo sustituye la creación manual de carpetas por captura directa en base de datos, con generación de entregables por plantilla. Hoy, por cada servicio, alguien crea a mano una carpeta con subcarpetas en Google Drive. El modelo objetivo presenta espacios de captura de datos en lugar de archivos y carpetas, con la misma lógica del CRM.
La migración del histórico se aborda como desarrollo independiente, y la fase inicial se resuelve con un botón «Ver en Google Drive» desde la propia hoja de vida, replicando lo ya hecho en el módulo de remisiones. Es la solución correcta para arrancar: no bloquea el proyecto con una migración de más de 300 equipos con historial, y da acceso al histórico desde el día uno.
Tres cosas que condicionan cómo se construye:
El entregable en PDF no desaparece. Sigue haciendo falta para respaldo y para entrega impresa al cliente.
El sistema debe conservar el documento exacto que vio el cliente, no sólo los datos para regenerarlo. Existen 23 plantillas de cotización distintas, y regenerar con la plantilla de hoy un documento emitido con la de hace dos años produce un papel que nadie firmó.
Convivencia de unos seis meses con los métodos tradicionales —Excel de citas y control— para validar la estabilidad del nuevo sistema antes de retirarlos.
[ABIERTO — 27/08] Módulo de backup del sistema. Se identificó la necesidad de un respaldo propio para no perder el histórico ante una caída del servidor. Sin responsable ni fecha. Es uno de los tres frentes que el acta señala como condicionantes de la puesta en producción. Punto abierto nº 55.
[ABIERTO] No está definido el mecanismo de migración del historial útil de Desk 1.0 [R08] La migración debe incluir además las hojas de vida de Labcontrol, no sólo el historial de Desk 1.0. Amplía el alcance del punto abierto nº 8: son dos orígenes distintos, con estructuras distintas, y conviene tratarlos como dos migraciones y no como una.
Nota de dependencia (R03). La migración deja de ser un asunto puramente interno: la hoja de vida reducida es lo que el cliente ve en el portal, y un historial con huecos produce el efecto contrario al buscado. Ver la regla de apertura del portal en M8.6.
M4. Comercial: cotización, aprobación y promesa de fecha
El punto donde se gana o se pierde el cumplimiento: el ticket no avanza si no hay aprobación comercial, y la fecha no se adivina, se calcula.
M4.1 Aprobación del cliente
[DECIDIDO] El cliente recibe un enlace o correo con el pre-diagnóstico y puede aprobar el cambio de piezas en un clic, sin necesidad de emitir primero la orden de compra formal.
[DECIDIDO] Se inicia como piloto con clientes que tienen contrato de mantenimiento activo.
[DECIDIDO] Si el cliente no aprueba en el plazo definido, el equipo sale de la mesa de trabajo y pasa a cola de espera. [ABIERTO] El plazo exacto (24 o 48 h) falta fijarlo.
Motivación: hoy se envía cotización, se espera la orden de compra y el equipo queda bloqueado semanas o meses.
[DECIDIDO — R03] El botón «Aprobar cotización» forma parte del nivel básico del área de cliente (M8.2): está disponible para todos los clientes, con o sin contrato, y funciona con acceso por token sin registro.
Punto de enganche en el blueprint implementado [AS-BUILT]. La aprobación del cliente corresponde al estado Notificación cliente, que ofrece tres salidas: Aprobación (→ En Proceso), Aprobación y S. Repuestos (→ En Espera de Repuestos) y Rechazo (→ Por Facturar). El botón del portal debe disparar una de las dos primeras. La «cola de espera» por no aprobación no tiene hoy estado propio: habría que crearlo o reutilizar uno de los cuatro de espera, y en ese caso resolver antes su falta de salida (C3).
El compromiso de fecha ya existe, y lo fija el taller [AS-IS — R05]
Antes de diseñar el simulador conviene saber de dónde sale hoy la fecha. La hoja del 16/02 lo dice: en la transición Escalado a Revisión, cuando el técnico manda el diagnóstico a revisión, el campo «Días de entrega» es obligatorio, y el propio mapeo aclara que «queda definido el Tiempo promesa». El diccionario lo confirma en la columna 52: «días hábiles que ST se demora en ejecutar el servicio, es un campo del ticket Tiempo promesa».
Es decir: el compromiso lo estima Servicio Técnico al diagnosticar, no Comercial al cotizar. Tiene lógica —quien acaba de abrir el equipo es quien sabe cuánto va a costar arreglarlo— y tiene una consecuencia de diseño: el CTP de este apartado no sustituye ese número, lo alimenta. El técnico seguirá aportando el trabajo que el equipo requiere; lo que hoy nadie aporta es la cola del taller y el lead time del repuesto, que es justamente lo que convierte una estimación de esfuerzo en una fecha.
El indicador que cierra el círculo también existe ya: la columna 54, Cumplimiento del tiempo promesa, compara el tiempo comunicado en la cotización contra el transcurrido hasta la finalización, y devuelve Cumple o No cumple.
M4.2 Simulador de fecha de entrega (CTP — Capable to Promise)
Antes de que Comercial prometa una fecha, el sistema consulta:
Carga actual de técnicos — horas vendidas vs. horas disponibles.
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
Es la diferencia entre un CTP que sirve y uno que no: la mayoría de las promesas incumplidas no nacen de un mal cálculo de horas de taller, sino de dar por disponible un repuesto que aún no ha llegado.
La heurística suma cola actual en estación + tiempo estándar de servicio + lead time de repuesto y devuelve una sugerencia del tipo «fecha más temprana posible: lunes próximo». El estudio lo identifica como el gran diferenciador competitivo.
Precisión de la R03. Este cálculo es determinista —reglas y consultas sobre PostgreSQL— y no pasa por la capa RAG ni por ningún modelo de lenguaje (principio de diseño nº 8). Su resultado alimenta dos destinos: la sugerencia interna a Comercial, y la disponibilidad de agenda que se muestra al cliente (M6.4).
M4.3 Reprogramación y comunicación de consecuencias
Si un cliente se demora en enviar la orden de compra, el sistema debe reprogramar automáticamente o dar una fecha estimada de inicio. [R08] La reprogramación debe avisarse al cliente por correo, no sólo recalcularse internamente: una fecha que cambia sin que el cliente se entere es un incumplimiento aunque el sistema lo haya previsto.
Análisis de cuello de botella por respuestas de clientes.
Aging de aprobación con alerta a partir de 7 días de espera.
M4.4 Cotización, recotización y facturación diferida
[AS-BUILT] El rechazo por facturar existe, pero no como estado: Rechazo es una transición que lleva a Por Facturar desde Rev./Diagnostico, Notificación Comercial y Notificación cliente. El cliente no autoriza la reparación y se cobra el diagnóstico.
[AS-BUILT] Los estados Por Entregar / Sin facturar y Liberación Comercial existen y son ramas distintas de Por Facturar, originadas por las fechas de corte de facturación de los clientes. Ver el ciclo reentrante de M1.3.5.
[ABIERTO] Riesgo identificado y no resuelto: perder el rastro de equipos entregados pendientes de cobro. La R04 lo agrava con un dato concreto: la vía sin factura vuelve a Por Facturar en lugar de cerrar, de modo que un equipo entregado y no cobrado queda indistinguible de uno pendiente de entregar.
[AS-BUILT] El diagnóstico complementario existe como transición: sale de Pendiente hacia Continuación del proceso, y de ahí vuelve a Notificación Comercial por Notificación re cotización. Ese es el circuito de recotización completo.
[PROPUESTO] Visualización de precotizaciones para el área comercial. [R08] La precarga de repuestos hacia un borrador de cotización en Zoho CRM se evalúa en M1.11 · alcance; requiere resolver la política de solo lectura.
Precisión de diagnóstico como KPI. [R08] Mide qué porcentaje de las cotizaciones aprobadas no necesitó adicionales después. Un diagnóstico preciso cotiza una vez; uno impreciso descubre a mitad de la reparación que hace falta otra pieza, y obliga a volver al cliente con una recotización —que es el circuito Pendiente → Continuación del proceso → Notificación re cotización del punto anterior—.
Interesa por dos motivos. Hacia dentro, un adicional cuesta más que la pieza: reabre la negociación, para el equipo en el taller y consume otra vez tiempo comercial. Hacia fuera, es lo que el cliente recuerda —«me dijeron un precio y acabé pagando otro»—. Y es medible sin campos nuevos: son los tickets que pasaron por Continuación del proceso sobre el total de los que llegaron a Aprobación.
Subdivisión de órdenes de venta y contratos [DECIDIDO 27/08]
Decisión: permitir la subdivisión de una orden de venta en subórdenes —formato OV-AAAA-NNN-SS, con SS de dos dígitos (OV-2026-170-01, -02…); formato revisado en la R08.2 por decisión de Gerencia del 10/09/2026, el 27/08 se acordó OV-XXX_1, _2, _3— con un ticket asociado a cada subservicio, en lugar de exigir una orden de venta independiente por ticket. Modifica el criterio de la reunión anterior. [R08.2] Por qué se cambia el formato: _1 y _10 se ordenan mal como texto, y el guion bajo dentro de un número que ya usa guiones invita al error que la validación quiere cazar. Dos dígitos ordenan solos.
Qué desbloquea. Una OV de diez calibraciones, subdividida, hace calculable el porcentaje ejecutado del contrato, y con él el informe trimestral de avance que Comercial envía al cliente. Hoy esa correlación se hace a mano, en el comentario del albarán de reserva: alguien anota qué elemento de la orden corresponde a qué código de servicio. Es trabajo manual que además sólo conoce quien lo hace.
Y corrige una lectura falsa del inventario. Los repuestos comprometidos en órdenes de paquete —filtros, baterías— aparecen hoy como consumidos o reservados sin que se sepa contra qué servicio, lo que distorsiona el stock y genera riesgo de sobrestock. Con la suborden, cada consumo tiene un ticket detrás.
El argumento comercial. Clientes como Corola e Indoanálisis compran paquetes anuales. Medir su ejecución da conversación cuando el consumo real queda por debajo de lo pactado: es la misma lógica del dato como argumento comercial de M4.5, aplicada al contrato en vigor en lugar de al histórico de costes.
Lo que el sistema tiene que saber además. Que un ticket pertenece a un contrato, porque de ahí sale su prioridad alta (M1.9.1) y su recurrencia. Y tiene que soportar las variantes reales que se dan hoy:
Variante
Se da en
OV separadas por mano de obra y por repuestos
Clientes que compran los dos conceptos aparte
OV global por varios equipos
Ingresos por lote
Varias OV asociadas a un mismo ticket
Servicios ampliados sobre la marcha
Ninguna de las tres encaja en un modelo de «una OV, un ticket», y las tres son habituales. Punto abierto nº 52. [R08.2] Resuelto el 10/09/2026: ver los dos apartados siguientes.
Cardinalidad orden de venta ↔ ticket [DECIDIDO 10/09 — R08.2]
La relación es 1 ticket : N OV, nunca al revés. Cierra el punto abierto nº 52. La restricción «una OV → un único ticket» sigue vigente y debe seguir cumpliéndose; lo que se relaja es la restricción implícita en sentido contrario, que un ticket sólo pudiera tener una OV.
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
Dónde vive la asociación. En una tabla propia de la aplicación, no en la réplica de Zoho Books: el sync sobrescribiría cualquier dato escrito allí. La asociación registra el ticket, la transición que asoció, fecha, hora y persona (regla de M1.10).
Cuándo se escribe. Desde el lado del ticket: de forma opcional en «Nuevo ticket», contra las OV existentes, y obligatoria en Habilitar Servicio (ver M1.2). Aprobación y Aprobación y S. Repuestos pueden añadir OV al ticket, nunca sustituir la de entrada.
Cambio de proceso, no sólo de software. Eliminar la OV global por lote obliga a que Comercial subdivida siempre, desde el primer día. Queda por decidir qué pasa si llega una OV de lote sin subdividir: rechazarla o permitir subdividirla desde Desk.
Cardinalidad, no titularidad. El nº 52 no dice —ni debe leerse como que dice— que la OV y el equipo puedan ser de clientes distintos. La titularidad OV ↔ equipo es un asunto separado y sigue abierta.
Criterios de la subOV de lote [DECIDIDO 10/09 — R08.2]
Formato. El lote se identifica por el número de la OV. OV-AAAA-NNN es el prefijo del lote y no es documento; cada subOV es OV-AAAA-NNN-SS, con SS de dos dígitos (OV-2026-170-01, -02…). El número base nunca existe como OV propia en Books, para no contar dos veces el mismo ingreso ni la misma reserva de stock. El tamaño del lote es el número de subOV creadas, todas de golpe al recibir la OC del cliente.
Cuarentena. Una OV con sufijo que no cumpla el formato no sale en el desplegable, no suma en ningún saldo y aparece en una lista «OV con número no reconocido» visible para Comercial. El formato se asume frágil y se compensa: un número mal escrito se detecta en lugar de descuadrar el saldo en silencio.
Saldo por lote. Creadas / consumidas / libres, y % ejecutado = consumidas / creadas. Alimenta el punto abierto nº 53 y el informe trimestral de avance. Sin subOV libres, un contrato agotado no puede consumirse.
Un ticket vigente por subOV. Una subOV tiene como máximo un ticket vigente.
Anulación. La anulación no borra la asociación: la marca liberada, con fecha, hora, persona y motivo (regla de M1.10). Sólo se libera lo no consumido: si hubo diagnóstico facturable, esa subOV queda consumida.
[ABIERTO] Pendiente declarado: la vigencia por fecha. Este modelo no tiene dónde guardar un fin de contrato; si un paquete anual vence con subOV libres, no está decidido si se pueden seguir usando.
M4.5 El dato como argumento comercial
[DECIDIDO] Usar la base de costos y el historial de reparaciones como argumento estructurado frente a quejas de precio. Caso de referencia: un cliente gastó 9.000 USD en un año para mantener 48 equipos — menos de 200 USD anuales por equipo en repuestos.
[DECIDIDO] El listado de 78 puntos de control del diagnóstico Grimm se usa como herramienta de defensa comercial del precio de las calibraciones.
[DECIDIDO — R03] Los avisos de vencimiento de calibración se envían a todos los clientes, tengan o no contrato. No se restringen al nivel completo del portal: su función registrada es servir de campaña comercial para recuperar clientes «desaparecidos», y meterlos tras el contrato apagaría precisamente el canal que los recupera.
M5. Inventarios y repuestos (MRO)
MRO —Maintenance, Repair, Operations— es donde más dinero se pierde por ineficiencia.
M5.1 Reservas: soft vs. hard
Momento
Acción
Efecto sobre el stock
Al cotizar
Soft reservation
El repuesto se ve disponible pero marcado como «comprometido».
Precisión del revisor [R08] — adelantar la reserva al diagnóstico. La reserva blanda no debería esperar a la cotización: debería activarse sobre los repuestos que el técnico identifica durante el diagnóstico, antes incluso de cotizar.
El argumento es de negocio y es fuerte: más del 90 % de las cotizaciones se aprueban. Con esa tasa, esperar a la aprobación para pedir es regalar el lead time del proveedor en nueve de cada diez casos. Adelantar la solicitud convierte semanas de espera en días.
Lo que hay que acotar es el riesgo del 10 % restante: qué se hace con una pieza pedida para un servicio que se rechaza. Conviene limitar el adelanto a repuestos de rotación —los que el inventario acaba consumiendo igual— y dejar los específicos o de alto valor esperando a la orden de compra. Es una regla de negocio, no técnica, y hay que fijarla antes de automatizarlo. Punto abierto nº 47.| | Al aprobar el cliente | Hard allocation | Deja de estar disponible para otras órdenes. | | Al ejecutar la orden | Consumo | Se descuenta del stock y se suma al costo de la orden. |
M5.2 Kitting
**
[DESCARTADO — R08] El revisor descarta el kitting por ahora. Se conserva el apartado como referencia de mercado, sin ítem de backlog asociado.
Agrupación lógica de partes para tareas recurrentes — «Kit servicio 2000 h», «Kit sello bomba X».
Al diagnosticar, el técnico carga 1 kit y el sistema descuenta los componentes individuales.
Facilita el check-out en almacén con un solo escaneo.
M5.3 Ubicaciones bin
**
[APLAZADO — R08] No es prioritario por ahora, pero no se descarta para el futuro.
Estructura: nomenclatura jerárquica Área-Fila-Rack-Estante (p. ej. A-01-B-3).
Tipos: bins de recepción, de picking y de almacenamiento/volumen.
Beneficios: menos tiempo buscando artículos, mayor precisión de inventario, conteos más ágiles.
M5.4 Reabastecimiento y compras
**
[YA RESUELTO FUERA DE DESK — R08] El revisor indica que el reabastecimiento ya está resuelto en el Portal Ambientalia · Análisis de Inventario. Desk 2.0 no tiene que construirlo.
Lo que sí queda es la conexión: el CTP de M4.2 necesita saber si un repuesto está en inventario, en camino con fecha estimada o por solicitar con su lead time, y esos tres datos viven en ese portal. La pieza pendiente no es un módulo de compras, es una lectura. Punto abierto nº 48.
Punto de pedido diferenciado por lead time.
Trigger automático: al pasar a «Espera de repuesto» se genera la solicitud de materiales.
Análisis de cuello de botella en solicitud de repuestos a fábrica.
[PROPUESTO] Pronóstico de compras de consumibles y repuestos.
Alertas de stock mínimo y de stock crítico en la vista del planificador.
M5.5 Operación del almacén
**
[APLAZADO — R08] No es prioritario por ahora, pero no se descarta para el futuro.
Multi-almacén y tránsito: transferencias entre bodega central y camionetas de técnicos.
Conteos cíclicos con clasificación ABC.
Valoración por costo promedio ponderado.
Trazabilidad repuesto → orden → activo.
[DECIDIDO — pendiente de ejecución] Estandarizar la lista de SKUs y categorizarlos por la fase lógica de revisión: física, neumática, óptica, electrónica.
Registro de consumo escaneando el código QR del repuesto desde la propia orden.
M6. Planificación y capacidad
Sin un modelo de capacidad, la promesa de fecha es una apuesta. Este módulo es la condición previa del simulador CTP (M4.2) y, desde la R03, también del agendamiento de citas del cliente (M8.4).
M6.1 Parámetro de carga del servicio técnico
Creación de un parámetro de carga (% de ocupación) que exprese la capacidad real de asumir trabajo.
Las variables deben ser configurables para poder calibrar el modelo con la experiencia real.
Según el equipo —y el histórico del cliente— se asigna una ocupación de carga a un colaborador, en porcentaje.
Análisis por colaborador de su capacidad de trabajo.
M6.2 Calendarios
Calendario de solicitud de cita de servicio técnico, que tiene en cuenta la carga y refleja la capacidad de respuesta disponible.
Calendario interno de vencimiento de calibraciones Grimm. [R08] Conecta con los avisos al cliente por correo: la cita no sirve de nada si el cliente no la recibe por el mismo canal por el que se le avisa de todo lo demás.
Agendamiento por slots de capacidad: dado que hay un solo banco de calibración, sólo pueden recibirse X equipos por semana. Si Comercial intenta ingresar un equipo urgente, el sistema advierte: «Banco de calibración lleno hasta el martes. ¿Desea sobreescribir con autorización de Director?». [R08] Pendiente de discusión más a fondo.
Análisis histórico por cliente y por marca-modelo para el cálculo de capacidad.
Ampliación del revisor [R08]. El mismo análisis histórico permite predecir cuánto va a costar el mantenimiento de un cliente concreto, a partir de su historial de fallas. Es un salto de calidad sobre el promedio por modelo: dos clientes con el mismo equipo pueden dar trabajos muy distintos según cómo lo traten, y eso el histórico lo sabe. Alimenta el CTP de M4.2 y la valoración de clientes de M7.4.
Calendario anual de picos y valles para la vista 360.
M6.3 Asignación de trabajo
Organización del trabajo a colaboradores en función del estado actual y de las predicciones.
Vista «Mi cola de trabajo» ordenada por prioridad de fecha promesa.
Semáforo de disponibilidad de repuestos en la cola del técnico.
[PROPUESTO] Selección en mapa para asignar masivamente tickets a un técnico.
[AS-BUILT] La casilla «Derivado a» de las 34 transiciones es la pieza sobre la que se construye la asignación: registra de quién es el trabajo a partir de cada etapa, sin frenar el ticket cuando nadie la rellena. Ver M1.9.2.
[R08] Planes de trabajo por técnico, semanales y mensuales, para que cada uno tenga visión de sus tareas en el tiempo y no sólo de la cola del día. Es la contrapartida de la priorización automática: si el sistema decide el orden, el técnico necesita al menos ver el horizonte. Se refleja en el tablero como «Mi plan semanal» y «Mi plan mensual» (M7.5).
M6.4 Exposición de la capacidad al cliente [NUEVO — R03]
El esquema del 21/08 conecta Calcular con Citas: el análisis calcula la carga del servicio técnico y ese resultado se convierte en la base del agendamiento del cliente, que ve libre u ocupado. Es la consecuencia más exigente de todo el marco, porque convierte un parámetro interno en un compromiso público.
Qué cambia respecto a M6.1
Mientras la carga es una herramienta interna, un error de estimación se absorbe reprogramando. En cuanto se publica, un error de estimación es un incumplimiento frente al cliente. Por eso la publicación necesita tres reglas propias:
1. Factor de holgura. No se publica el 100 % de la capacidad calculada. Se reserva un porcentaje configurable para urgencias, retrabajos y desviaciones de diagnóstico. La holgura es un parámetro del sistema, no una decisión de quien atiende. [ABIERTO] Fijar el valor inicial — Anexo D, punto 24.
2. Sobreescritura con autorización. La regla ya existente en M6.2 —«banco de calibración lleno hasta el martes, ¿desea sobreescribir con autorización de Director?»— se conserva íntegra y sólo es accesible desde dentro. El cliente nunca ve ni puede activar la sobreescritura. [R08] Pendiente de discusión más a fondo.
3. Prioridad por contrato. Los slots se ofrecen según la priorización comercial ya decidida el 14/08: los clientes con contrato y los Top 5 tienen preferencia ( [R08] Queda por discutir si los clientes Top 5 entran en esta prioridad o si el criterio se limita al contrato de mantenimiento. Ver el modelo de tres niveles de M1.9.1.
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
≥ 90 % global y por cliente
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
> 7 días = alerta
Tiempo de espera de repuesto
suma de duración en «Espera repuesto»
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
Eventos de rechazo QA
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
Umbrales pendientes de fijar. Cuatro indicadores siguen sin umbral: lead time total, lead time de diagnóstico, tiempo de espera de repuesto y causas principales de desvío. Conviene cerrarlos antes de publicar el tablero, o el semáforo no significará nada.
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
El OTD ya existe y no es el que este documento define. La columna 54 mide el compromiso contra la fecha de finalización de Servicio Técnico, no contra la entrega al cliente. Son dos indicadores legítimos y distintos: uno mide al taller, el otro mide a la empresa. Conviene mantener los dos y nombrarlos aparte, porque entre ambos está el tiempo de recogida (columna 51), que no depende de Ambientalia. Y el OTD del taller resulta inmune al problema del ciclo de facturación que describe la corrección C4, porque no usa la fecha de remisión de salida.
Falta un KPI de satisfacción en el cuadro. La columna 55 existe, se recoge por correo al finalizar y hoy sólo se usa para el reporte trimestral. Es el único indicador del conjunto que mide lo que el cliente percibe, y no figura en la tabla de arriba. Debería, sobre todo ahora que el eje ③ convierte la relación con el cliente en producto.
Idea del revisor [R08] — provocar la valoración. La calificación de satisfacción existe pero depende de que el cliente conteste un correo. Conviene pensar una estrategia para que valore, con mecánicas de gamificación —racha de respuestas, visibilidad de su propio historial de servicio, algún reconocimiento asociado al contrato—. El indicador sólo sirve si tiene volumen: una tasa de respuesta baja hace que mida a los descontentos, que son los que siempre contestan.
Dos indicadores están rotos y uno está en riesgo. El bodegaje (56) y el tiempo de inicio de servicio (48) dependen de la fecha de creación del ticket y quedaron inválidos en 2026; el tiempo de diagnóstico (49) usa la misma referencia y hereda el problema aunque el diccionario no lo señale. Los tres se arreglan igual: tomando la marca de tiempo de la transición correspondiente en lugar de la fecha de creación del registro.
Advertencias de calculabilidad [AS-BUILT — R04]
Cinco indicadores del cuadro no son fiables todavía, por razones que están en el flujo implementado y no en el modelo de datos. Conviene resolverlas antes de publicar el tablero: un KPI construido sobre estas bases habrá que recalcularlo después, y el histórico anterior a la corrección no será comparable.
Indicador
Obstáculo
Corrección
OTD, servicios finalizados y tiempo promedio
Finalizado mezcla servicios terminados con servicios abandonados.
C2 · M1.10
OTD y exactitud de promesa
El ciclo facturar↔entregar reescribe Fecha Remisión de Salida en cada vuelta y borra la fecha de la primera entrega.
C4 · M1.3.5
Tiempo de espera de repuesto
Los estados de espera no detienen ningún reloj de SLA; no hay sub-estado de pausa con parada de cronómetro. Y un ticket atascado sin salida infla el indicador en lugar de delatarse.
C3 · C7 · M1.3.4
Análisis de tiempos por tipo de evento
Las transiciones implementadas no llevan el atributo de tipo (operativo / decisional / logístico).
C5 · M1.8
Cualquier métrica por estado inicial
Ticket creado y Remisión creada sólo existen para los tickets nacidos en la app; los de Zoho entran por OV asignada.
— · M1.3.2
Añadido al análisis operativo (M7.3): un listado de tickets atascados en los cuatro estados de espera, con antigüedad. Es lo que hace visible el problema de M1.3.4 mientras no exista la transición de escape.
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
M7.4 Predicciones
Predicción del comportamiento del cliente a partir del análisis histórico.
Predicción de la carga en función del estado actual + histórico + estado comercial en Zoho CRM + vencimientos de calibración.
Predicción de picos y valles en un calendario anual para la vista 360.
Alertas de desviación de comportamiento: certificado de calibración vencido que puede convertirse en urgencia; lámpara de un APSA cercana al límite. [ABIERTO] Falta completar una tercera alerta enunciada sin definir.
Dos cautelas sobre el mantenimiento predictivo [27/08]. La propuesta de predecir a partir de datos de logger —alarmas, horas de operación— se registró con dos advertencias que conviene no perder: sin histórico de años anteriores el sistema generaría alertas erróneas, y la conectividad de la generación actual de equipos Horiba [verificar] requiere una tarjeta adicional que pocos clientes integran. El obstáculo no es el algoritmo: es que no hay ni serie histórica ni parque conectado. Refuerza la ubicación del servicio premium en la fase más lejana del roadmap.
Indicador de valoración del cliente por parte de servicio técnico.
M7.5 Dashboards por rol
Vista
Foco
Contenido
Dirección / Gerencial
Cumplimiento y dinero
SLA global, backlog en horas, costo acumulado, margen por ticket, OTD por técnico.
Dispatcher / Torre de control
Qué se cae hoy
Kanban: Recepción · Diagnóstico · En cotización · En reparación · QA · Listo para entrega. Tarjetas en rojo si Fecha actual > (Fecha prometida − Lead time restante).
Comercial
Cuellos de botella y conversión
Tickets en «Esperando aprobación cliente» > 48 h; precotizaciones; pronóstico de compras; embudo de conversión del portal (R03).
Planificador
Recursos
Calendario, carga por técnico (WIP vs. capacidad), alertas de stock crítico, holgura publicada vs. real (R03).
Técnico
Ejecución
«Mis tickets» ordenados automáticamente, semáforo de repuestos, notificaciones. [R08] Añadir «Mi plan semanal» y «Mi plan mensual» a la vista del técnico (M6.3)
Requisitos transversales del tablero
Drill-down infinito: cualquier cifra es clicable hasta la ficha del ticket.
Carga asíncrona por widget.
Filtros: fecha, prioridad, cliente, tipo de activo, contrato, técnico, categoría, causa.
Acciones rápidas: reasignar, escalar, pausar con causa, solicitar repuesto, pedir aprobación al cliente.
Alertas push/correo: SLA en rojo, ticket reincidente, espera de repuesto superior a X días.
M7.6 Campos y estados que el modelo de datos debe garantizar
`fecha_prometida`, `fecha_entrega` / `Fecha_Salida`, `Fecha_Entrada`, `fecha_real`, `DiagnósticoFin`, `CotEnviada`, estado `Espera_OC`, estado «Espera de repuesto», `motivo_pausa` con taxonomía cerrada, eventos de rechazo de QA, horas efectivas y disponibles, horas de calibración, valor cotizado, costo de mano de obra y costo de repuestos.
Añadidos en R03: `origen_captura` y `corregido_manualmente` por campo capturado (M3.4); `nivel_portal` por cliente (básico / completo); `slot_ofrecido` y `slot_cumplido` en las citas agendadas desde el portal; `evento_portal` con tipo y marca de tiempo para el embudo de conversión.
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
Alcance mínimo, ya definido: hojas de vida y aprobación de cotizaciones. Entra en el MVP 2026.
Track & Trace. El cliente ve el estado actual del equipo en lenguaje llano, con barra de progreso: «Recibido → Diagnosticando → Esperando tu aprobación → Reparando → Listo para entrega». Sin jerga interna ni nombres de estados del blueprint. [R08] Con aviso por correo en los cambios de estado relevantes, para que el cliente no tenga que entrar a mirar. El criterio de «relevante» conviene fijarlo con la traducción de estados de la corrección C8: el cliente no debe recibir un correo por cada una de las 34 transiciones.
[R04] Esa barra necesita una traducción explícita desde los 21 estados internos verificados en M1.3, y no es trivial: varios —Notificación a Compras, Notificación Comercial, En espera de SKU inventario— no significan nada para quien está fuera y deben agruparse bajo una sola etiqueta. Hay además dos casos que resolver: el arranque, porque un ticket de Zoho y uno de la app nacen en estados distintos (M1.3.2), y Por Entregar / Sin facturar, que para el cliente es «listo para entrega» aunque internamente vuelva a Por Facturar. Es la corrección C8.
Botón «Aprobar cotización», que dispara directamente el cambio de estado en el sistema y detiene el reloj de espera (M4.1). Es la funcionalidad que ya está en piloto desde el 14/08.
Hoja de vida reducida del equipo — ver M8.3.
Descarga del certificado de calibración del servicio en curso.
Ampliación del revisor [R08] — certificados públicos y verificables. Que los certificados de calibración sean consultables públicamente, no sólo por el cliente propietario. El motivo no es de transparencia sino de antifraude: si cualquiera —una autoridad ambiental, un auditor, un tercero que recibe un informe— puede escanear el QR y comprobar que el certificado existe y es el que dice ser, falsificarlo deja de tener sentido.
Es un argumento comercial de primer orden y encaja con el QR verificable de M8.7. Lo que hay que acotar es qué se muestra: la verificación necesita confirmar que el certificado es auténtico y está vigente, no necesariamente exponer todos sus valores medidos. Punto abierto nº 49.
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
Historial completo de intervenciones
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
El recorte es deliberadamente visible. Que el nivel básico indique «este equipo tiene 14 intervenciones registradas» sin poder abrirlas es lo que convierte la hoja de vida en argumento de venta en lugar de en una ficha incompleta. Ocultar la existencia del historial desperdiciaría el gancho; mostrarlo entero regalaría la prestación.
Cada campo de la hoja de vida lleva una marca de visibilidad en el modelo de datos (M3.1), de modo que la matriz anterior sea configurable sin tocar código.
Cómo se implementa [R08]. Lo que el cliente ve no se programa, se configura: cada campo de la hoja de vida (M3.1) lleva, además de su valor, un atributo que declara a quién se le muestra. Así, cambiar el alcance del nivel básico es tocar una configuración y no desplegar código, y el punto abierto nº 28 —fijar la hoja de vida reducida campo a campo— se convierte en rellenar esa tabla en lugar de en un desarrollo.
M8.4 Nivel completo
Depende de la capa RAG (M12.4) y del parámetro de carga (M6.1). Se planifica para 2027 · S1. [R08] Ver las alternativas al RAG evaluadas en M12.3.
Biblioteca de contenidos — KB Externa
Vídeos de operación y de mantenimiento básico, cortos y específicos, producidos según M12.1.
PDFs y notas técnicas por marca y modelo.
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
El portal se abre por cliente, no globalmente. Un cliente sólo recibe acceso cuando sus equipos tienen la hoja de vida poblada con los cuatro campos comerciales que hoy faltan (M3.1). Un cliente que entra y ve una ficha vacía o un historial con huecos recibe exactamente la impresión contraria a la que se busca, y la primera impresión de un portal no se repite.
Orden de apertura recomendado:
1. Clientes del piloto de aprobación en un clic —los que ya tienen contrato activo—, que son también los que menos toleran una ficha incompleta.
2. Clientes Top 5 y/o con contrato, completada la carga de sus hojas de vida.
3. Resto de la cartera, a medida que se completan los datos.
Esta regla convierte la calidad del dato en la condición de entrada del eje ③, que es exactamente lo que sostiene la cadena de §1.4.2.
M8.7 Certificados y calibración
Certificado digital con QR: el sticker físico pegado al equipo calibrado lleva un QR que, escaneado con cualquier celular, abre una URL pública segura con el PDF del certificado vigente. Valor inmenso para el cliente en auditorías.
Avisos automáticos de vencimiento de calibración a los clientes — a todos, con o sin contrato (M4.5).
El certificado con QR es público por diseño: su utilidad es que un auditor externo pueda verificarlo sin credenciales.
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
Guarda de calidad: no se puede pasar a entregado sin foto del equipo embalado y checklist de QA firmado.
Producto no conforme (flujo equipo-nuevo): notificación → análisis y acciones → retorno al flujo inicial.
[R05] La pieza de QA sí existe en otro flujo: Verificación, en equipo nuevo (M1.4). Es el modelo natural para la corrección C6, con la salvedad de que ese estado hoy no tiene ninguna transición de salida y hay que resolverlo primero (C12).
[ABIERTO — AS-BUILT] Ninguna de estas cuatro piezas existe todavía en el blueprint de servicio técnico implementado. El flujo va de En Proceso a Por Facturar por finalización de servicio, sin etapa de QA intermedia. Introducirla implica un estado nuevo y, con él, la transición de retrabajo. Es la corrección C6 y condiciona tres de las cuatro guardas propuestas en M1.7.
Certificados: QR, incertidumbre y firmas [DECIDIDO 27/08]
Tres requisitos que el Desk 2.0 no contemplaba y que el acta del 27/08 incorpora, ubicados en una fase posterior del desarrollo:
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
Dos observaciones sobre el orden. La primera: que el QR apunte al área de cliente en vez de a un PDF es lo que convierte el certificado en algo verificable y revocable —y es la base técnica de la verificación pública antifalsificación de M8.2—. Aplazarlo a fase posterior es coherente con aplazar el portal, pero significa que las dos cosas se deciden juntas.
La segunda: las etapas de validación con firma son, en la práctica, la etapa de QA que pide la corrección C6, aplicada al flujo de calibración. Conviene diseñarlas a la vez y no como dos cosas distintas.
M9.2 Trazabilidad y evidencia
ISO 9001 como marco de la codificación interna (serial + modelo). [DECIDIDO]
ISO 14224 como marco de la taxonomía de activos y de fallas. [PROPUESTO]
Registro inmutable de auditoría de cada acción: quién, cuándo, qué cambió, valor anterior y valor nuevo.
Firma digital y geostamping de las evidencias.
Check-in físico en el activo vía NFC o QR.
[ABIERTO] Definir el procedimiento de validación de informes.
M9.3 Documentación publicada al cliente [NUEVO — R03]
Publicar procedimientos de mantenimiento básico y guías de operación en la KB Externa introduce una obligación que no existía cuando ese contenido vivía sólo en la cabeza de los técnicos: es documentación controlada. Bajo ISO 9001, todo documento que Ambientalia pone en manos del cliente necesita versión, fecha de emisión, responsable de aprobación y control de cambios.
Requisitos mínimos, desarrollados en M12.6:
Versión y fecha visibles en cada pieza de contenido publicada.
Responsable técnico que aprueba antes de publicar.
Registro de qué versión estaba vigente en cada momento, para poder responder qué instrucción tenía el cliente en una fecha dada.
Procedimiento de retirada de contenido obsoleto.
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
Una tensión que conviene tener presente. Replicar la estructura de Zoho Desk reduce la curva de adaptación a corto plazo, pero los estudios de mercado señalan justo lo contrario como riesgo: heredar el paradigma de interfaz de escritorio es lo que hunde la adopción y, con ella, la calidad del dato. La lectura razonable es tomar la decisión como transitoria y planificar la evolución hacia la UX mobile-first del principio nº 1 una vez asentado el uso.
M10.2 Dispositivos
Tablet en recepción para el OCR de placas y el alta de equipos.
Tablet/móvil en la mesa de trabajo para el diagnóstico guiado.
Web de escritorio para dispatcher, comercial y almacén.
[R03] El portal de cliente (M8) se diseña mobile-first sin excepción: el cliente entra desde el móvil, muchas veces desde planta y con el equipo delante.
M10.3 Modo offline
Cola de sincronización persistente.
Resolución de conflictos sin pérdida de datos — CRDTs o bases locales tipo PouchDB/WatermelonDB.
Criterio de aceptación: la aplicación descarga las órdenes del día al iniciar sesión, permite editar checklist y guardar fotos localmente, y sincroniza automáticamente al detectar red.
M10.4 Arquitectura de mini-apps
[DECIDIDO] Las ideas operativas del equipo técnico —digitalización de manuales, troubleshooting de sensores— se traducen en mini-apps dentro del sistema.
[PROPUESTO] Realidad aumentada práctica: identificar activos por reconocimiento visual y superponer puntos de interés.
M11. Arquitectura, integraciones y datos
M11.1 Decisiones de arquitectura tomadas
[DECIDIDO] Base de datos propia en PostgreSQL como núcleo de Desk 2.0.
[LOGRADO 21/08] Se conectó con éxito Zoho a la base de datos externa PostgreSQL mediante un cliente REST propio con OAuth2 (refresh token por servicio). La información —tickets, órdenes de venta y contactos— se actualiza cada tres minutos. [R08.2] Las revisiones anteriores atribuían la conexión a MCP; MCP no interviene en el camino de datos.
[DECIDIDO] Desk 2.0 lee la información de Zoho sin permisos de edición ni de eliminación.
[RESUELTO] El problema del 14/08 —el cron saturaba el sistema— se refería a consultar Zoho en vivo. Con la base propia, el cron alimenta PostgreSQL y las consultas de la aplicación van contra la base local.
[DECIDIDO 21/08] El objetivo es dejar de usar herramientas fragmentadas —n8n, Zoho Desk 1.0 y hojas de cálculo de Excel— y centralizar la operación desde la creación de remisiones hasta la facturación.
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
Evita reintroducir un servicio aparte tras la decisión de eliminar Qdrant. Ver M11.5.
Series temporales
TimescaleDB o InfluxDB (fase 2)
Lecturas de sensores e histórico de estados.
API
GraphQL sobre REST para móvil
El cliente pide exactamente lo que necesita.
Autenticación
OAuth2 / OpenID Connect (Keycloak o Auth0)
SSO empresarial desde el día 1 y base del nivel completo del portal (M8.5).
M11.3 Integraciones
Zoho CRM — estado comercial; alimenta la predicción de carga y, en R03, la determinación del nivel de portal de cada cliente según su contrato activo.
Zoho Books — costos y facturación; fuente del KPI de margen bruto por ticket.
Zoho Desk — sistema actual a sustituir; conexión de solo lectura durante la transición.
n8n — automatizaciones y formularios actuales; se integran y progresivamente se absorben.
Suite Ambientalia Cloud y sitio web — integración del frontend de clientes. [FUTURO]
Aplicación de valoración de clientes — recibe el indicador generado por servicio técnico.
API Gateway para ERP e IoT en fase posterior.
M11.4 Seguridad, permisos y auditoría
[DECIDIDO] Permisos y vistas restringidos por rol.
Tabla inmutable de auditoría para todas las transacciones críticas: cambio de estado, ajuste de inventario y, desde R03, toda acción del portal de cliente (aprobación, descarga de firmware, reserva de cita).
Gestión de usuarios externos con alcance limitado.
[R03] Aislamiento estricto por cliente: ningún usuario del portal puede alcanzar datos de equipos que no estén en su cartera. Es el requisito de seguridad más crítico del eje ③.
[AS-BUILT] Los permisos por área de cada transición están centralizados en packages/shared/src/permissions.ts — un solo sitio, no repartidos por la interfaz.
[ABIERTO — AS-BUILT] El botón de borrado de administrador barre el ticket de las nueve tablas y lo elimina del historial completo. Es adecuado para limpiar pruebas e inadecuado para cerrar un servicio real que se cayó (M1.10). Conviene además decidir si su existencia es compatible con la tabla inmutable de auditoría que este mismo apartado exige. Punto abierto nº 36.
M11.5 Infraestructura
[DECIDIDO] Mantener una sola base de datos Supabase activa; la duplicidad de instancias agotó los 2 GB de RAM del plan básico.
[CORREGIDO — R08] Se trabaja únicamente con PostgreSQL en la VPS propia de Hostinger. Supabase no está en uso y no debe considerarse en el diseño. La decisión del 17/02 sobre mantener una sola instancia de Supabase queda superada: no es que se conserve una, es que no hay ninguna. Se mantiene el registro en el Anexo C porque la reunión ocurrió, con esta nota de estado.
[DECIDIDO] Continuar con el plan de hosting básico (Hostinger / Easy Panel) y monitorear. Si los problemas persisten, upgrade a KVM2 con 8 GB de RAM.
[TAREA] Eliminar las bases de datos de prueba innecesarias (Supabase y Qdrant).
Consumo verificado como bajo: n8n.
Tensión que abre la capa RAG [ABIERTO — R03]. La decisión del 17/02 fue eliminar Qdrant y mantener una sola instancia con 2 GB. La capa de conocimiento de M12.4 necesita un almacén vectorial. La vía coherente con las decisiones ya tomadas es pgvector sobre el PostgreSQL propio, que no añade un servicio nuevo ni una instancia más; pero hay que verificar que la memoria disponible lo soporta con el volumen de contenido previsto, y decidirlo explícitamente antes de construir. Anexo D, punto 27.
M11.6 Herramientas de desarrollo y prototipado
Google Stitch (beta, con capacidades MCP y Antigravity) — genera rápidamente interfaces móvil, tablet y escritorio.
Claude — usado para auditar el código del blueprint actual, mapear el diagrama de flujo completo y detectar cuellos de botella y fallos de lógica. [DECIDIDO] Se adopta como herramienta de auditoría y mejora continua.
Gemini — usado en la documentación de actas y estudios de mercado.
Restricción crítica registrada. Para que estas herramientas funcionen correctamente es estrictamente necesario tener las bases de datos —de diagnósticos, flujos y usuarios— perfectamente estructuradas de antemano. El éxito de todo lo anterior depende de esto.
La auditoría de blueprints, en concreto. La lectura del código del flujo con IA —adoptada como herramienta de mejora continua el 20/08— es la que produjo la revisión R04 de este documento: detectó los cuatro estados sin salida, el ciclo reentrante, la ausencia de anulación y la guarda que no bloquea. Conviene repetirla en cada hito del desarrollo, y extenderla a los flujos de equipo nuevo y soporte remoto en cuanto estén implementados.
M11.7 Deuda técnica registrada
El repositorio mantiene un archivo debt.md con la deuda técnica conocida. La R04 incorpora al documento maestro el único punto de ese archivo con efecto funcional visible:
Ref.
Descripción
Efecto
Arreglo
M-2
En buildTransitionPlan, la rama del checkbox sale antes de la comprobación de campo obligatorio.
Una casilla obligatoria sin marcar guarda false y la transición se ejecuta. Afecta a «Liberación del ticket sin facturar».
Dos piezas: (a) mover el chequeo de obligatorio por delante del bloque del checkbox, cuyo continue se lo saltaba; y (b) que la condición para un checkbox sea «no llega marcado» (asBool(raw) !== true) y no «llega vacío»: un formulario con la casilla desmarcada manda false, no vacío, así que con sólo (a) el defecto sobrevive por el camino normal. Cerrado en F1A-01 el 09/09/2026. [R08.2]
M12. Conocimiento, formación y capa RAG
Módulo incorporado en la R02 a partir de la reunión del 21/08/2026 y ampliado en la R03 con la arquitectura de conocimiento del esquema de ejes de valor.
Responde a un problema que no es de software sino de organización: el conocimiento técnico —«el cómo»— vive en las cabezas de personas concretas, lo que crea dependencia y genera consultas repetitivas tanto de clientes como de personal nuevo. Es también el destino del cambio de rol acordado: el equipo técnico deja de programar herramientas para convertirse en generador de conocimiento y estructurador de procesos.
M12.1 Producción de contenido formativo
[DECIDIDO] Documentar el conocimiento técnico en formatos digitales, priorizando el vídeo.
Vídeos cortos y específicos, de alcance muy acotado — el ejemplo citado es «cómo hacer una prueba de fuga en un Grimm». No manuales audiovisuales largos, sino piezas de un procedimiento concreto.
El laboratorio se usa como set de grabación, aprovechando el espacio y los equipos reales.
[TAREA] Definir un plan de trabajo semanal para grabar —se propone el viernes por la tarde— y empezar por estructurar un índice de temas.
[TAREA] Armar el setup de grabación en el laboratorio y grabar el primer vídeo piloto.
Alcance doble: procedimientos internos (KBI) y externos (KB Externa).
Criterio de clasificación en origen. Cada pieza que se produce se etiqueta desde el principio como interna, externa o ambas. Reclasificar después es costoso y propenso a errores; decidirlo al grabar cuesta un campo en el índice de temas.
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
[ABIERTO] pgvector sobre PostgreSQL propuesto (M11.5)
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
Una alternativa viable sería establecer la conexión vía MTP con nuestros notebooks, lo que nos permitiría aprovechar esta tecnología como una solución de RAG (Generación Aumentada por Recuperación) complementaria.
Recupera de la KBI: manuales, procedimientos, troubleshooting y casos anteriores del mismo modelo.
Se combina con el histórico del activo (M3.3) y con los puntos de control ya registrados en el ticket (M2.3).
Sugiere causas probables y qué verificar; no cierra puntos de control ni cambia estados. El técnico decide y registra.
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
3.1 Criterios de priorización
3.2 MVP — P0 · «Control y ejecución»
**
[EN REVISIÓN — R08] El revisor marca todo el backlog del MVP como pendiente de revisar y discutir a fondo. No es una objeción a un ítem concreto: es que la lista se construyó antes de conocerse el as-built, antes de las doce correcciones y antes de las decisiones de esta revisión —que ya han sacado del MVP la captura asistida (M3.4) y han descartado o aplazado tres apartados de M5—.
La tabla siguiente se mantiene como está, sin retocar, hasta esa sesión. Ajustarla a medias sería peor que dejarla: quedaría un backlog que ya no es el acordado y todavía no es el revisado. Lo que sí refleja el estado real es el Anexo H, que compara lo planificado con lo construido ítem a ítem y marca cuáles han quedado en entredicho. Es el documento con el que conviene sentarse a esa revisión.
Cuatro criterios ordenan el backlog, en este orden de peso. El cuarto es nuevo en la R03 y procede del marco de ejes de valor.
1. Cumplimiento del compromiso comprometido. Todo lo que ataca directamente el incumplimiento de fecha —el dolor número uno— va primero.
2. Integridad del dato. Sin datos limpios y estructurados no hay analítica, ni predicción, ni IA. Lo que garantiza la calidad del dato precede a lo que lo explota. En la R03 este criterio se refuerza: el dato limpio no es una condición previa del proyecto, es el producto del eje ① (§1.4.2), y lo que reduce el error de captura sube de prioridad aunque parezca accesorio.
3. Orden de la cadena de ejes. ① antes que ②, y ② antes que ③. Una funcionalidad del eje ③ que dependa de un cálculo que aún no es fiable no se adelanta, por atractiva que sea comercialmente.
4. Esfuerzo frente a valor. A igualdad de valor, primero lo de menor complejidad.
El plazo rector sigue siendo el acordado el 14/08/2026: MVP 100 % funcional antes de finalizar 2026.
Añadido en la R04. Las correcciones de §3.2.1 se anteponen a todo lo demás dentro de su prioridad porque no añaden funcionalidad: reparan lo ya construido. Un flujo con un estado sin salida o una métrica contaminada no se arregla con las funcionalidades que vengan encima; se arrastra a todas. Es el criterio nº 2 aplicado a lo que ya existe.
Objetivo: eliminar el papel y las ambigüedades, saber en todo momento qué hay en el taller y en qué estado, y capturar el dato bien a la primera. Al final del MVP, el cliente ya tiene una ventana a sus equipos.
#
Funcionalidad
Módulo
Eje
Valor
Complejidad
1
Código único de ticket basado en número de serie; serial obligatorio en la remisión
M1
①
Muy alto
Baja
2
Blueprint con desplegable inicial de tipo de servicio y ramificación
M1
①
Muy alto
Media
3
Máquina de estados de taller con validaciones de recepción y QA
M1
①
Muy alto
Media
4
Sustitución del texto libre por listas desplegables y estados predefinidos
M1
①
Muy alto
Media
5
Permisos y vistas por rol; formalización del traspaso entre agentes
M1
①
Alto
Media
6
Checkbox «Cumple condiciones comerciales» en Habilitar servicio
M1
①
Medio
Baja
7
Registro de timestamps en todas las transiciones y extracción desde el historial
M1 / M7
①
Muy alto
Media
8
Priorización automática por criterio comercial; «Mis tickets» autoordenado
M1
①
Alto
Baja
9
Hoja de vida del equipo con los cuatro campos comerciales faltantes; alta por Comercial
M3
①
Muy alto
Baja
10
Registro de entrada en recepción con foto y datos, generando el ticket
M1 / M3
①
Alto
Media
11
Diagnóstico guiado por fases macro→micro con criterio Alerta / Cobrable / Bloqueante
M2
①
Muy alto
Alta
12
Selección de repuestos y horas estimadas desde el diagnóstico
M2 / M5
①
Alto
Media
13
Dashboard operativo Kanban con WIP por etapa y riesgo de compromiso
M7
②
Muy alto
Media
14
KPI de OTD, lead time total y lead time de cotización
M7
②
Muy alto
Media
15
Descuento de repuesto usado sobre orden aprobada
M5
①
Alto
Media
17
Base de datos PostgreSQL propia; Zoho en solo lectura (conexión mediante cliente REST propio con OAuth2 ya lograda)
M11
—
Muy alto
Alta
18
App móvil/tablet con checklists, fotos y firma; offline básico
M10
①
Muy alto
Alta
19
Autocompletado por serial: trae cliente, modelo y órdenes de venta activas
M1
①
Muy alto
Media
20
Orden de venta obligatoria antes de la recepción del equipo. [R08.2] Reformulado por la decisión del 10/09: obligatoria para trabajar (Habilitar Servicio), no para recibir
M1
①
Alto
Baja
21
Menú visual con fotos para la selección de accesorios en recepción
M1
①
Medio
Media
22
Interfaz que replica la estructura de Zoho Desk con blueprints controlados
M10
①
Alto
Media
23
Modelado piloto de macro-fases y micro-fases del Grimm EDM 180/280
M2
①
Muy alto
Media
25
Índice de temas y primer vídeo piloto de procedimiento técnico
M12
③
Alto
Baja
26
Área de cliente — nivel básico: hoja de vida reducida, seguimiento y aprobación de cotizaciones, con acceso por token
M8
③
Muy alto
Media
27
OCR de la placa en recepción, con validación contra el maestro de equipos y registro de correcciones
M3
①
Alto
Media
28
QR de identificación en equipos, enlazando remisión ↔ ticket ↔ hoja de vida
M3
①
Alto
Media
Movimientos respecto a la R02. Los ítems 27 (OCR) y 28 (QR) suben desde la fase Futuro y la Fase 2 respectivamente, por atacar directamente el riesgo rector del eje ① (§1.4.3). El ítem 26 es nuevo: es el alcance mínimo del área de cliente definido en sesión —hojas de vida y aprobación de cotizaciones—, y no requiere ni la capa RAG ni el parámetro de carga, por lo que cabe dentro del MVP sin romper la cadena de dependencias.
Advertencia de secuencia. El ítem 26 no puede desplegarse antes que el 9: un portal que muestra hojas de vida incompletas hace más daño que no tener portal (regla de apertura, M8.6).
Los ítems 16 y 24 no existen. Correspondían al portal del empleado, retirado del alcance en la R06 (§1.2). Los huecos se dejan a propósito: renumerar rompería las referencias cruzadas del documento y cualquier nota externa que cite un ítem.
3.2.1 Correcciones del blueprint implementado — P0 · prioridad inmediata
Cinco correcciones sobre lo ya construido, ordenadas por relación entre daño y esfuerzo. Se identifican con la letra C para no alterar la numeración del backlog de la R03. Las cinco pertenecen al eje ① y su beneficiario es el eje ②: son la diferencia entre calcular sobre datos y calcular sobre ruido.
#
Corrección
Módulo
Eje
Daño si no se hace
Esfuerzo
C1
Cerrar la puerta del checkbox obligatorio (debt.md M-2): dar error cuando el campo es obligatorio y el valor no llega marcado.
M1.7 · M11.7
①
Un equipo puede salir sin factura sin que nadie afirme nada. Es la única guarda de esa vía.
Dos piezas (era «una línea») · cerrada en F1A-01
C2
Estado terminal Anulado con motivo, alcanzable desde donde hoy se usa Rechazo como sucedáneo y desde las cuatro esperas. Excluirlo de las tres métricas de servicios cumplidos.
M1.10 / M7
①②
Los KPIs de cumplimiento, servicios finalizados y tiempo promedio cuentan como buenos los servicios que se cayeron. Toda la analítica se construye encima.
Media
C3
Transición de escape para los cuatro estados de espera, con caducidad que la dispare o la sugiera.
M1.3.4
①
Un ticket aparcado sólo sale editando la base de datos a mano, y de paso infla el KPI que debería delatarlo.
Media
C4
Conservar la primera Fecha Remisión de Salida en un campo que no se sobreescriba en el ciclo facturar↔entregar.
M1.3.5
①
El OTD y la exactitud de promesa se calculan sobre la última vuelta del ciclo, no sobre la entrega real.
Baja
C5
Atributo de tipo de evento (operativo / decisional / logístico) en las 34 transiciones.
M1.8
①
El análisis de tiempos por tipo de evento previsto en M7.3 no es calculable. Es una decisión de acta del 17/02 que no llegó al código.
Baja
Añadidas en la R05. Las cuatro proceden de las hojas de mapeo y del diccionario, y tres de ellas son recuperaciones: reglas que el as-is tenía y que la implementación perdió.
#
Corrección
Módulo
Eje
Daño si no se hace
Esfuerzo
C9
Redefinir el bodegaje de entrada —y el tiempo de inicio de servicio y el de diagnóstico— contra la marca de tiempo de la transición Ingreso a Servicio, no contra la fecha de creación del ticket.
M1.10 / M7.1
②
Tres indicadores llevan inválidos desde que Comercial crea los tickets por anticipado, y sólo consta en una nota al margen del diccionario.
Baja
C10
Permisos a nivel de cargo y de propietario del registro, además de por área.
M1.9.1
①
Liberación sin factura debía ser exclusiva del gerente comercial y hoy puede ejecutarla toda el área. Es la misma vía que la C1 deja sin guarda.
Media
C11
Recuperar el SLA de un día sobre Notificado que existe en Zoho y no se implementó.
M1.7
②
Un diagnóstico parado antes de la revisión retrasa la cotización, que es el reloj que el cliente percibe, y nada lo delata.
Baja
C12
Dar salida a Verificación en el flujo de equipo nuevo —aprobada y rechazada— antes de implementar esa rama.
M1.4 / M9
①
Un equipo enviado a verificación de calidad no puede volver al flujo. Corregirlo ahora no cuesta nada; después, sí. [R08.2] Superado: la salida aprobada existe en la operación (Verificación —Liberación→ Finalizado, 71 usos); falta que la tengan el documento y el código. Queda la guarda por familia, pendiente de Calidad (nº 38).
Baja
Orden sugerido de ejecución: C1 (dos piezas, riesgo real; cerrada en F1A-01 el 09/09/2026) → C4, C5, C9 y C11 (bajo esfuerzo, desbloquean métricas) → C12 (gratis mientras la rama no exista) → C2 → C10 → C3.
Una nota sobre la naturaleza de estas correcciones. M1.3.9 muestra que el as-is estaba bien levantado y la implementación fue fiel a él. Eso divide las doce correcciones en dos grupos que conviene no mezclar: C1, C10, C11 y C12 recuperan reglas que ya existían y su discusión es corta —alguien las escribió, se perdieron, se reponen—; C2, C3, C4, C5, C6, C7, C8 y C9 cambian el proceso, heredado de Zoho desde 2021, y requieren una decisión de negocio. Las primeras las puede cerrar desarrollo; las segundas no.
Relación con el ítem 26. El área de cliente en nivel básico muestra el estado del equipo. Conviene que C2 esté hecha antes: un portal que le dice al cliente «Finalizado» sobre un servicio que en realidad se abandonó es peor que no tener portal, y cae bajo la misma regla de apertura de M8.6.
3.3 Fase 2 — P1 · «Eficiencia y flujo»
Objetivo: acelerar el ciclo de caja, quitar de en medio los bloqueos que no dependen del técnico, y construir la capa de conocimiento que sostiene el nivel completo del portal.
#
Funcionalidad
Módulo
Eje
Valor
Complejidad
29
Aprobación del diagnóstico en un clic por el cliente (piloto con contratos activos)
M4
③
Muy alto
Media
30
Regla de liberación de mesa: sin aprobación en plazo, el equipo pasa a cola de espera
M4
②
Muy alto
Baja
31
Reserva soft/hard de repuestos y trazabilidad repuesto→orden→activo
M5
①
Alto
Alta
32
Solicitud automática de materiales al entrar en Espera de repuesto
M5 / M1
①
Alto
Baja
33
Kitting de mantenimiento
M5
①
Medio
Media
34
Punto de pedido diferenciado por lead time y alertas de stock mínimo
M5
②
Alto
Media
35
Parámetro de carga del ST con variables configurables
M6
②
Muy alto
Media
36
Calendario de citas de ST y slots del banco de calibración
M6
②
Alto
Media
37
Calendario interno de vencimientos de calibración Grimm
M6
②
Alto
Baja
38
Portal de cliente Track & Trace consolidado
M8
③
Alto
Media
39
Certificados con QR verificables públicamente
M8 / M9
③
Alto
Media
40
Avisos automáticos de vencimiento de calibración a clientes
M8
③
Alto
Baja
41
Dashboards por rol (dirección, comercial, planificador, técnico)
M7
②
Alto
Media
42
Análisis de comportamiento histórico por cliente y tipo de equipo
M7
②
Alto
Media
43
Análisis de cuellos de botella (repuestos a fábrica, respuesta de clientes)
M7
②
Alto
Media
44
Reprogramación automática por demora en la OC
M4
②
Alto
Media
45
Estandarización de SKUs por fase lógica de revisión
M5 / M2
①
Alto
Media
46
Integración de formularios de remisión (n8n) al flujo del ticket
M11 / M8
①
Medio
Baja
47
Auditoría inmutable de transacciones críticas, incluidas las del portal
M9 / M11
—
Medio
Media
48
Check-in físico en el activo por NFC
M3 / M9
①
Medio
Media
49
Migración del historial útil de Desk 1.0
M3 / M11
①
Alto
Alta
50
Offline con resolución de conflictos sin pérdida de datos
M10
①
Alto
Alta
51
Biblioteca interna de procedimientos en vídeo con plan semanal de grabación
M12
③
Alto
Baja
52
Identidad de cliente registrada (OAuth2/OIDC) y gestión de varios usuarios por cliente
M8 / M11
③
Muy alto
Media
53
Capa RAG: ingesta, almacén vectorial (pgvector) y recuperación con separación estricta KBI / KB Externa
M12 / M11
③
Muy alto
Alta
54
Copiloto interno de diagnóstico sobre la KBI
M2 / M12
①
Alto
Alta
55
KB Externa publicada en el portal: vídeos de operación, mantenimiento básico, PDFs y notas técnicas
M12 / M8
③
Muy alto
Media
56
Descarga de firmware y software con registro por cliente, serial y versión
M12 / M8
③
Alto
Media
57
Agendamiento de citas: solicitar (básico) y reservar (contrato), con factor de holgura y prioridad por contrato
M6 / M8
②③
Muy alto
Alta
58
Escaparate público mínimo de la KB Externa
M8 / M12
③
Medio
Baja
59
Gobernanza documental de la KB Externa: versionado, aprobación técnica y retirada controlada
M9 / M12
③
Alto
Media
60
Métricas del área de cliente: penetración, uso, conversión a contrato y retención
M7
③
Alto
Media
C6 | Etapa de QA/QC antes de la liberación, con transición de retrabajo | M9 / M1 | ① | Alto | Media |C7 | Sub-estados de pausa que detienen el reloj del SLA | M1.6c / M7 | ② | Alto | Media |C8 | Traducción de los 21 estados internos a las etapas visibles del portal de cliente | M8.2 | ③ | Medio | Baja |
Nota de dependencia. El ítem 57 (agendamiento) no puede construirse antes que el 35 (parámetro de carga): publicar disponibilidad sin un modelo de capacidad calibrado es prometer al azar con una interfaz mejor.
3.4 Futuro — P2/P3 · «Promesa, predicción y ecosistema»
Objetivo: diferenciación de mercado. Aquí es donde Desk 2.0 deja de ser una herramienta interna y se convierte en argumento comercial pleno.
#
Funcionalidad
Módulo
Eje
Valor
Complejidad
61
Simulador de fecha de entrega (CTP) con capacidad finita
M4 / M6
②
Muy alto
Alta
62
Predicción de carga (estado + histórico + CRM + vencimientos)
M7
②
Muy alto
Alta
63
Predicción de picos y valles; calendario anual vista 360
M7
②
Alto
Media
64
Pronóstico de compras de consumibles y repuestos
M5 / M7
②
Alto
Alta
65
Generación de procedimientos desde fotos de manuales (OCR + LLM)
M2 / M12
③
Alto
Alta
66
Agente conversacional técnico para el cliente sobre la KB Externa, con guardarraíles y derivación a Comercial
M12 / M8
③
Muy alto
Alta
67
Indicador de valoración del cliente desde ST
M7
②
Medio
Baja
68
Entrada de incidencias por WhatsApp Business API con NLP
M8
③
Medio
Alta
69
Usuarios externos limitados (empresas de servicios, Metrological)
M8 / M11
③
Medio
Media
70
Servicio premium de monitoreo remoto y aviso preventivo
M8
③
Muy alto
Muy alta
71
Ingesta de telemetría IoT / convergencia IT-OT
M11
—
Alto
Muy alta
72
Taxonomía ISO 14224 completa de 6 niveles y árbol de fallas RCM
M3 / M2
①
Alto
Alta
73
Integración con el sitio web y la suite Ambientalia Cloud
M11
③
Medio
Media
74
Realidad aumentada para identificación y puntos de interés
M10
①
Bajo
Muy alta
75
Criterio de aprobación por linealidad R² candidato vs. patrón
M2 / M9
①
Medio
Media
76
Sustitución completa de Zoho Desk
M11
—
Muy alto
Muy alta
Movimientos respecto a la R02. El OCR de placas sube al MVP (ítem 27) y el copiloto de diagnóstico baja a Fase 2 (ítem 54), porque una vez construida la capa RAG su coste incremental es bajo y su beneficio sobre el eje ① es inmediato. El ítem «Área de Clientes con manuales segmentados por nivel de contrato» de la R02 desaparece como línea suelta: queda absorbido y especificado en los ítems 26, 55 y 66.
3.5 Roadmap
Horizonte
Nombre
Eje dominante
Contenido
Resultado esperado
Inmediato
Correcciones del as-built
①
Ítems C1–C5, C9 y C11. Cerrar la guarda del checkbox, introducir la anulación, dar salida a las cuatro esperas, preservar la primera fecha de entrega y tipificar las transiciones.
El flujo deja de tener trampas y las métricas del eje ② empiezan a significar lo que dicen.
Ahora → cierre 2026
MVP — Control y ejecución
①
Ítems 1–28, salvo el 16 y el 24. Núcleo de tickets con autocompletado y captura asistida (OCR y QR), diagnóstico guiado piloto sobre Grimm EDM 180/280, hoja de vida completa, dashboard operativo, BD propia, primer vídeo formativo y área de cliente en nivel básico.
Cero papel, cero ambigüedad de códigos, el dato entra limpio, visibilidad completa del taller, primeros KPIs reales y el cliente deja de llamar para preguntar por su equipo.
2027 · S1
Fase 2 — Eficiencia, flujo y conocimiento
②
Ítems 29–60. Aprobación en un clic, inventario transaccional, parámetro de carga, dashboards por rol, capa RAG, KB Externa publicada, identidad registrada, firmware y agendamiento.
Se reduce el tiempo muerto por espera de OC y de repuestos; la capacidad del taller es conocida y publicable; el contrato de mantenimiento tiene por fin una prestación digital que lo diferencia.
2027 · S2 y siguientes
Futuro — Promesa y ecosistema
③
Ítems 61–76. CTP, predicción, agente conversacional, IoT, servicio premium y sustitución total de Zoho Desk.
La fecha de entrega se calcula, no se promete. El cliente se atiende solo. El dato se vuelve producto.
Y las correcciones son la condición del MVP. C2 en particular: cualquier KPI de cumplimiento construido antes de separar «finalizado» de «anulado» habrá que recalcularlo después, y el histórico anterior a la corrección no será comparable con el posterior.
Dependencia crítica del roadmap. Los ítems de la fase Futuro son inviables si el MVP no deja el dato estructurado. Es la restricción registrada en acta —las herramientas de IA sólo funcionan sobre bases de datos perfectamente estructuradas— y el fundamento de la cadena de ejes de §1.4.2. El MVP no es sólo el primer paso: es la condición de todo lo demás.
Una lectura del calendario. El eje ③ es el último en construirse, pero su materia prima —los vídeos, el índice de temas, la KBI— se produce desde el primer día (ítem 25). Grabar en 2026 lo que el portal publicará en 2027 no es adelantarse: es lo que evita que el portal llegue vacío.
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
Flujo
Estados
Servicio técnico (as-built, 21 estados)
OV asignada · Ticket creado · Remisión creada · Ingresado · Rev./Diagnostico · Notificado · Notificación a Compras · Notificación Comercial · En espera de SKU inventario · Notificación cliente · En Espera de Repuestos · En Proceso · Solicitado · Pendiente · Servicio externo · Continuación del proceso · Por Facturar · Liberación Comercial · Por Entregar / Sin facturar · Por Entregar · Finalizado
Equipo nuevo (as-is, verificado en R05)
Ingresado · En Proceso · Notificado · Verificación (sin salida) · Finalizado
Soporte remoto (as-is, verificado en R05)
Solicitud Soporte · En Proceso · Pendiente · Finalizado
Comercial (as-is, R05)
Inicio · Evaluación Especificaciones · Ajuste Especificaciones · Cotización · Ajuste Cotización · Negociación · Fase Cierre · Cerrado Ganado · Cerrado Perdido
Posible cliente (as-is, R05)
Inicio · Asignar Responsable · Cualificación · No cualificado · Convertir a Trato
Taller (modelo objetivo)
Recepción · Diagnóstico · Cotización pendiente · Espera de aprobación · Aprobado / Rechazado · Devolución sin reparar · Planificación · En ejecución ⇄ Pausa interna · Control de calidad · Embalaje listo · Entregado · Cerrado
Sub-estados de pausa
Espera de repuesto · Espera de cliente · Condiciones inseguras
Portal de cliente (R03)
Recibido · Diagnosticando · Esperando tu aprobación · Reparando · Listo para entrega · Entregado — lenguaje llano, sin correspondencia uno a uno con los estados internos
B.1 Estados por área que los mueve [AS-BUILT]
Área
Estados desde los que esa área mueve el ticket
Comercial
OV asignada · Ticket creado · Remisión creada · Notificación Comercial · Notificación cliente · En espera de SKU inventario · Continuación del proceso · Por Facturar · Liberación Comercial
Servicio Técnico
Ingresado · Rev./Diagnostico · Notificado · En Proceso · Solicitado · Pendiente · Servicio externo · Por Entregar / Sin facturar · Por Entregar
Compras
Notificación a Compras · En Espera de Repuestos
— (terminal)
Finalizado
B.3 Estados sin salida, en todos los flujos [R05]
Flujo
Estado
Naturaleza
Servicio técnico
En Espera de Repuestos · Solicitado · Servicio externo · En espera de SKU inventario
Una sola salida, dependiente de un suceso externo (M1.3.4).
Equipo nuevo
Verificación
Ninguna salida (M1.4).
Servicio técnico · equipo nuevo · soporte remoto
Finalizado
Terminal por diseño, pero mezcla terminado y abandonado (M1.10).
Comercial
Cerrado Ganado · Cerrado Perdido
Terminales por diseño, y bien separados.
Posible cliente
No cualificado · Convertir a Trato
Terminales por diseño, bien separados.
La tabla resume el argumento de la corrección C2 mejor que cualquier explicación: los dos flujos comerciales distinguen el final bueno del malo; los tres operativos, no.
B.2 Estados retirados del catálogo en la R04
Cuatro estados figuraban en el catálogo de las revisiones anteriores y no existen en la aplicación. Se retiran para que nadie los use como referencia:
Estado retirado
Qué era en realidad
Entregado
No existe. La finalización del servicio lleva a Por Facturar.
Reporte por Garantía
No es un estado. Reporte por garantía es la transición de Notificado a Notificación a Compras.
Facturado
No es un estado. Facturado es la transición de Por Facturar a Liberación Comercial.
Rechazo
No es un estado. Rechazo es la transición que entra a Por Facturar desde tres orígenes.
Anexo C — Registro de decisiones por reunión
C.1 — 17/02/2026 · Revisión de operativa y flujos
Asistentes: Ambientalia · Gustavo Novoa Guzmán · Julián (brevemente).
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
Asistentes: Alfonso (Ambientalia) · Gustavo Novoa Guzmán.
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
Asistentes: Alfonso García del Pino (moderador) · Gustavo Novoa Guzmán · un tercer participante técnico. Presencial.
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
Asistentes: Alfonso (moderador) · Gustavo Novoa Guzmán. Virtual.
Decisión: mantener la codificación interna actual (serial + modelo) por trazabilidad ISO 9001.
Decisión: los equipos nuevos los da de alta Comercial/Administrativa al conocer los seriales, con cliente y fecha de factura.
Decisión: restringir permisos y vistas por rol.
Decisión: parametrizar Desk 2.0 para que las transiciones clave alimenten la hoja de vida.
Decisión: usar el artefacto de auditoría de blueprints generado con IA como herramienta de mejora continua.
Tarea: extraer y proporcionar el listado de códigos internos de los clientes — Alfonso.
Tarea: parametrizar la creación de equipos desde Comercial con campos obligatorios de serial y factura.
Abierto: mecanismo de migración del historial de Desk 1.0 a Desk 2.0.
Fuera del alcance de este documento. El acta incluye además la adjudicación del proyecto Laboratorio Ola, la compra de tres Shelters XL a Edmira y la planificación del showroom con el equipo demo EDM 280.
C.5 — 21/08/2026 · Desarrollo de Desk 2.0 y planes de formación
Asistentes: Alfonso García del Pino (moderador, Dirección/Desarrollo) · Gustavo Novoa Guzmán (Dirección Técnica/Operaciones) · Miguel y Julián (equipo técnico). Presencial.
Nota de alcance (R06). El acta del 21/08 trató además el portal del empleado —prototipo de vacaciones y permisos, control de saldos anómalos y cadena de aprobación—. Ese punto quedó fuera del alcance de Desk 2.0 en la R06 y su detalle se ha retirado de este anexo. Se deja constancia para que el registro de la reunión no aparente estar incompleto.
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
C.6 — 21/08/2026 · Sesión de trabajo sobre ejes de valor y área de cliente
Participante: Alfonso García del Pino (Dirección / Desarrollo). Sesión de trabajo sobre esquema en pizarra, posterior a la reunión de C.5.
Esta sesión no es un acta de reunión de equipo, sino una sesión de estructuración de la visión. Su resultado es el marco de §1.4 y la especificación de M8 y M12. Se registra aquí por el mismo criterio que las demás: contiene decisiones que condicionan el diseño.
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
Propuestas registradas en esta sesión, pendientes de decisión
Distinguir solicitar (nivel básico) de reservar (nivel completo) en el agendamiento — M6.4.
Aplicar un factor de holgura sobre la capacidad publicada — punto abierto nº 24.
Mantener un escaparate público mínimo de la KB Externa — punto abierto nº 25.
Enviar los avisos de vencimiento de calibración a todos los clientes, con o sin contrato — M4.5.
Adoptar pgvector sobre el PostgreSQL propio como almacén vectorial — punto abierto nº 27.
Elevar a principio de diseño que el cálculo es determinista y la IA no interviene en compromisos — principio nº 8.
Regla de apertura del portal por cliente, condicionada a que sus hojas de vida estén completas — M8.6.
C.7 — 21/08/2026 · Auditoría del blueprint implementado
No es una reunión, sino una lectura del código. Se registra aquí por coherencia con el resto del anexo, y porque materializa la decisión del 20/08 de usar la auditoría con IA como herramienta de mejora continua.
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
No son reuniones: son el trabajo de campo del que salieron las decisiones de febrero. Se registran aquí porque la R05 los incorpora como fuente citada.
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
Asistentes: Alfonso García del Pino Beneítez (Gerencia, moderador) · Gustavo Novoa Guzmán (Servicio Técnico / Dirección Técnica) · Johny Luna (Servicio Técnico). Híbrido: dos participantes en sede y uno en conexión virtual.
Incorporada en la R08.1. Es la sesión más densa en decisiones desde el 14/08, y ninguna revisión anterior la recogía.
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
El borrador consolidó actas, ideas del año anterior, las tablas de transiciones en Excel, la clasificación de etapas y el código existente.
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
Decisión: permitir la subdivisión de una orden de venta en subórdenes —formato OV-XXX_1, _2, _3— con un ticket asociado a cada subservicio, en lugar de exigir una OV independiente por ticket. Modifica el criterio de la reunión anterior. [R08.2] Formato revisado el 10/09/2026: OV-AAAA-NNN-SS, con SS de dos dígitos (OV-2026-170-01, -02…). Ver M4.4 y C.11.
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
Conclusiones de la sesión
El proyecto pasa de exploración técnica a fase de definición: se acordó frenar el desarrollo hasta disponer de un documento maestro consensuado, con meta de versión operativa al 31 de diciembre de 2026.
La adopción de checklists dinámicos parametrizados por marca-modelo es la decisión de mayor impacto de la sesión: evita multiplicar el desarrollo por cada tecnología y permite incorporar equipos nuevos sin rediseñar el flujo.
La subdivisión de órdenes de venta articula la trazabilidad entre Comercial, Servicio Técnico e inventario.
Tres frentes quedan sin responsable ni fecha: la migración del histórico documental, el módulo de backup y la seguridad del portal de cliente. Los tres condicionan la puesta en producción.
C.10 — 03/09/2026 · Sesión celebrada
[R08.2] La sesión se celebró el 03/09/2026 a las 14:00 por Google Meet, con Alfonso García del Pino (Gerencia, moderador), Gustavo Novoa (Dirección Técnica) y Johny Luna (Servicio Técnico). Trató ocho temas y dejó doce decisiones escritas y doce tareas con responsable. El acta completa es la fuente citable del repositorio: docs/Manifesto/Desk2.0_Acta_Sesion_2026-09-03.md. Su parte III contiene el acta; sus partes I y II son la convocatoria previa y no registran decisiones. La siguiente sesión queda fijada para el viernes 11/09/2026.
Dos cosas que la sesión no cerró. El tema 4 —criterios de falla y encadenamiento entre ítems— es el único de los ocho que salió sin decisión, sólo con tarea, y Gerencia lo señaló como «el punto más crítico por resolver» (acta:366). Y el punto abierto nº 62, que la convocatoria llevaba marcado en el orden del día, no se trató: por la regla de la propia sesión vuelve al Anexo D. Una casilla marcada en la convocatoria no es una decisión.
Lo que sigue en este apartado es la convocatoria tal como se incorporó en la R08.1.
Convocados: Alfonso García del Pino Beneítez (Gerencia, moderador) · Gustavo Novoa Guzmán · Johny Luna.
Objetivo declarado: revisar el documento maestro depurado, cerrar los puntos que quedaron sin resolución el 27/08 y definir las fases y prioridades de desarrollo para arrancar la construcción.
Entregables comprometidos el 27/08, todos pendientes a la convocatoria
#
Entregable
Responsable
1
Consolidado del listado de códigos internos de cliente
Gustavo Novoa
2
Documento maestro depurado, sin referencias a lo ya construido
Alfonso García del Pino
3
Flujo de construcción del informe de servicio incorporado al documento
Alfonso García del Pino
4
Excel de la fase de inspección física del Grimm EDM 180
Gustavo Novoa
5
Flujo de diagnóstico en formato visual e ítems del checklist
Johny Luna
6
Transición de revisión física con checklist configurable en el demo
Alfonso García del Pino
7
Listado de SKU con fotografía en el sistema
Alfonso García del Pino
8
Actualización de los SKU del inventario con fotografía como fuente única
Gustavo Novoa
9
Revisión del portal de órdenes pendientes (cuatro filtros)
Gustavo Novoa
Qué se somete a decisión
Ocho cuestiones declaradas sin resolver el 27/08: el ingreso sin orden de venta (punto abierto nº 21) · los contratos de mantenimiento en el flujo y sus subórdenes · la migración del histórico documental · el módulo de backup · la convivencia con Google Drive y hasta qué versión se mantiene · el alcance de la KBI frente a la KBE · la norma de taxonomía de fallas aplicable · y la supresión o uso documental de los prefijos.
Qué se propone decidir sobre fases
Ordenar los módulos y, dentro de cada uno, sus puntos, de mayor a menor prioridad.
Criterio de MVP propuesto: replicar la funcionalidad del Desk 1.0 para migrar rápido y crecer después por funciones.
Ubicar el módulo de informes, señalado como prioritario y hoy situado en una fase tardía.
Confirmar el aplazamiento de la seguridad y el portal de cliente a etapa independiente.
Contrastar el plan con la meta del 31/12/2026.
Lectura para el documento. La convocatoria confirma que el backlog del MVP —congelado en la R08 a petición del revisor— se decide en esta sesión, y aporta el criterio con el que se va a decidir: replicar primero el Desk 1.0. Ese criterio no coincide con el que ordena hoy §3.1, donde manda el cumplimiento de la fecha comprometida y la integridad del dato. No es incompatible, pero es otro orden, y conviene resolverlo explícitamente. Punto abierto nº 60.
C.11 — 10/09/2026 · Decisiones de Gerencia (incorporadas en la R08.2)
Decididas por Gerencia (Alfonso García del Pino) el 10/09/2026, la víspera de la sesión del 11/09, sobre los puntos preparados en docs/sdd/Puntos_para_Gerencia_2026-09-11.md. La evidencia completa está en docs/sdd/Decisiones_Gerencia_2026-09-10.md.
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
Anexo D — Puntos abiertos que requieren decisión
Lista de control. Cada punto abierto es un riesgo de retrabajo si se construye sin resolverlo.
Los puntos 19 y 22 no existen, y los tachados están resueltos. Los primeros correspondían al portal del empleado, retirado en la R06; los segundos se cerraron en la R05. En ambos casos se conserva el hueco o la fila tachada para que la numeración siga siendo estable.
#
Punto abierto
Módulo
Quién decide
1
Transcribir los diagramas de «Flujo comercial» y «Flujo posible-cliente». RESUELTO en la R05 — M1.11 y M1.12.
M1
Gustavo / Alfonso
2
Reconstruir el diccionario de campos. RESUELTO en la R05 — Anexo G, 59 columnas con sus fórmulas.
M1 / M11
Equipo de desarrollo
3
Fijar el plazo exacto de la alerta de no-aprobación del cliente: ¿24 o 48 horas?
M4
Alfonso / Comercial
4
Definir cómo extraer el timestamp de «Ingreso a servicio» para medir el bodegaje de entrada. RESUELTO en la R05: la fórmula existe (columna 56) y lo que falla es el dato. Sustituido por el punto 41.
M1 / M7
—
5
Cerrar los cuatro umbrales de KPI sin definir.
M7
Dirección / Ops
6
Resolver el rastro de equipos entregados pendientes de cobro.
M4
Comercial / Administración
7
Decidir cómo incorporar la gestión de garantía con el proveedor, hoy fuera del sistema.
M1 / M3
Gustavo
8
Definir el mecanismo de migración del historial de Desk 1.0 a Desk 2.0.
M3 / M11
Alfonso / desarrollo
9
Elegir entre comentarios predeterminados por etapa o textos dinámicos con consulta a la KB.
M2
Gustavo
10
Definir el procedimiento de validación de informes antes de su emisión.
M2 / M9
Dirección Técnica
11
Decidir sobre la especialización del equipo técnico como cadena de producción.
M1 / M6
Alfonso / Gustavo
12
Decidir si se adopta la linealidad R² como criterio de aprobación en calibración.
M2 / M9
Gustavo
13
Completar la tercera alerta de desviación de comportamiento.
M7
Gustavo
14
Confirmar si la entrada de `remisiones_entrada` procede de la plataforma de hojas de vida.
M2
Desarrollo
15
Decidir si se rehabilitan las rutas abreviadas para equipos sin novedad o de calibración directa.
M1
Gustavo / Alfonso
16
Transcribir las cinco imágenes de la página de KPIs. Parcialmente cubierto por el Anexo G, que documenta los once indicadores calculados y sus fórmulas.
M7
Alfonso
17
Fijar el índice de temas a grabar y el día semanal de grabación.
M12
Equipo técnico
18
Completar la matriz de contenidos por nivel de contrato. Parcialmente resuelto por el modelo de dos niveles (M8.1); falta el detalle pieza a pieza.
M12 / M8
Alfonso / Comercial
20
Decidir hasta cuándo se mantiene la interfaz que replica Zoho Desk.
M10
Alfonso
21
Definir qué ocurre si llega un equipo sin orden de venta previa: ¿se rechaza o se abre en estado provisional? RESUELTO el 10/09/2026 (R08.2) — «OV obligatoria para trabajar, no para recibir»: opcional al crear el ticket, obligatoria en Habilitar Servicio; el estado provisional es Remisión creada, con alarma a los 3 días. Ver M1.2.
M1
Alfonso / Gustavo
23
Confirmar la lectura del paso ① → ①' del esquema de ejes de valor (interpretado como «flujo actual → flujo rediseñado con pasos eliminados»).
§1.4.2
Alfonso
24
Fijar el factor de holgura de la capacidad publicada al cliente: qué porcentaje de la capacidad calculada no se ofrece en la agenda pública.
M6.4
Alfonso / Gustavo
25
Definir el escaparate público mínimo de la KB Externa: qué contenido es accesible sin contrato y qué queda detrás.
M8.4 / M12
Alfonso / Comercial
26
Definir la responsabilidad y el efecto sobre la garantía cuando el cliente ejecuta un procedimiento de mantenimiento básico publicado por Ambientalia.
M9.3
Dirección Técnica / Comercial
27
Confirmar el almacén vectorial de la capa RAG: pgvector sobre el PostgreSQL propio, verificando que la memoria disponible lo soporta tras la decisión de eliminar Qdrant. SUSTITUIDO en la R08 por el punto 51: antes de elegir el almacén hay que elegir la vía.
M11.5 / M12.3
Alfonso / desarrollo
28
Fijar el alcance exacto de la hoja de vida reducida visible en el nivel básico del portal, campo a campo.
M8.3
Alfonso / Gustavo
29
Cerrar los guardarraíles del agente y el protocolo de derivación a Comercial: qué se responde, qué se deriva y con qué mensaje.
M12.5
Alfonso / Gustavo
30
Confirmar qué marcas cubre el derecho de redistribución de firmware y software, y cómo se acredita la condición de cliente registrado con contrato vigente.
M12.7 / M8.5
Alfonso / Comercial
31
Definir la salida de emergencia de los cuatro estados de espera: ¿a Por Facturar cobrando el diagnóstico, o al Anulado del punto 32? ¿Con qué caducidad?
M1.3.4 · C3
Alfonso / Gustavo
32
Decidir la introducción del estado Anulado con motivo, y qué se hace con el histórico ya cerrado como Finalizado que en realidad fue abandonado.
M1.10 / M7 · C2
Dirección
33
Confirmar la corrección de debt.md M-2, y decidir si «Liberación del ticket sin facturar» debe seguir siendo un checkbox o convertirse en un campo que el motor sí pueda exigir. RESUELTA la corrección en F1A-01 el 09/09/2026 (R08.2): la guarda bloquea; un checkbox obligatorio sin marcar devuelve 422 y el ticket no se mueve. La segunda mitad —si sigue siendo checkbox— no la decide ninguna fuente de esta revisión y queda abierta.
M1.7 · C1
Alfonso / desarrollo
34
Decidir cómo se conserva la fecha de la primera entrega en el ciclo facturar↔entregar: campo nuevo que no se sobreescriba, o evento en el historial.
M1.3.5 · C4
Comercial / desarrollo
35
Fijar la taxonomía de tipo de evento (operativo / decisional / logístico) y aplicarla a las 34 transiciones, para hacer calculable el análisis de tiempos de M7.3.
M1.8 · C5
Gustavo / desarrollo
37
~~Decidir el destino de los cinco prefijos (MT, CG, HV, SR, PRO). La decisión del 14/08 elimina CG/MT; los otros tres identifican la rama, que Clasificaciones ya distingue. ¿Desaparecen los cinco, sobreviven tres, o se derivan de la clasificación?
M1.1
Alfonso / Gustavo
38
Definir las dos salidas de Verificación en equipo nuevo —aprobada y rechazada— antes de implementar la rama. PARCIALMENTE RESUELTO el 10/09/2026 (R08.2): la salida aprobada existe —Verificación —Liberación→ Finalizado, 71 usos en 181 tickets— (M1.4). Sigue abierto, y es de Gustavo / Calidad: si la obligatoriedad de Verificación se ata a la familia de equipo, qué pasó con el lote AP-370 de 2024 y confirmar la salida rechazada hacia Notificado.
M1.4 · C12
Gustavo / Calidad
39
Decidir el modelo de permisos de tres niveles (área · cargo · propietario del registro) que el as-is exige y el código no distingue.
M1.9.1 · C10
Alfonso / Gustavo
40
Confirmar si se recupera el SLA de un día sobre Notificado, y si se extiende a otros estados de espera de decisión.
M1.7 · C11
Gustavo / Ops
41
Fijar el nuevo hito del bodegaje de entrada y de los tiempos de inicio de servicio y de diagnóstico, hoy inválidos por la creación anticipada de tickets.
M1.10 · C9
Alfonso / Ops
42
Resolver de dónde sale Preparación Cotizac.: la hoja dice que de Ajuste Especificaciones, el diagrama que de Evaluación Especificaciones. Determina si toda oportunidad pasa obligatoriamente por el ajuste.
M1.11
Comercial
43
Decidir si el servicio en sitio entra como cuarta rama del blueprint, y en tal caso levantar primero su as-is.
M1.6b
Alfonso / Gustavo
44
Resolver cómo se lleva la precarga de repuestos a un borrador de cotización en Zoho CRM sin romper la política de solo lectura: excepción acotada, importación manual, o esperar a sustituir el CRM.
M1.11 · M11.1
Alfonso
45
~~Definir macro-fases de diagnóstico comunes a todas las marcas y modelos** del portafolio, no sólo al Grimm. Trabajo asignado a Johny.
M2.1
Johny / Gustavo
46
Desarrollar los criterios analíticos de aprobación en calibración. Hoy el apartado tiene una sola línea y no puede considerarse especificado.
M2.7
Dirección Técnica
47
Fijar qué repuestos se adelantan al diagnóstico y cuáles esperan a la orden de compra, acotando el riesgo del 10 % de cotizaciones no aprobadas.
M5.1
Comercial / Compras
48
Definir la lectura de disponibilidad de repuestos desde el Portal Ambientalia · Análisis de Inventario hacia el CTP: en inventario, en camino con fecha estimada, o por solicitar con lead time.
M5.4 · M4.2
Alfonso
49
Acotar qué datos expone el certificado verificable públicamente: si basta confirmar autenticidad y vigencia o se muestran también los valores medidos.
M8.2
Dirección Técnica / Comercial
50
Confirmar el modelo único de identidad del portal —cuenta registrada con acceso por enlace firmado— en lugar de dos mecanismos separados.
M8.5
Alfonso
51
Elegir la vía de la capa de conocimiento con un prototipo: RAG con almacén vectorial, wiki tipo Obsidian, o MCP contra NotebookLM. Sustituye al punto 27.
M12.3
Alfonso / equipo técnico
52
Modelar las variantes reales de orden de venta: OV separadas por mano de obra y por repuestos, OV globales por varios equipos, y tickets con varias OV asociadas. Ninguna encaja en «una OV, un ticket». RESUELTO el 10/09/2026 (R08.2) — 1 ticket : N OV. La OV global por lote se elimina (subórdenes OV-AAAA-NNN-SS); las otras dos variantes se mantienen. La titularidad OV ↔ equipo es otro asunto y sigue abierto. Ver M4.4.
M4.4
Comercial / Alfonso
53
Definir cómo identifica el sistema que un ticket pertenece a un contrato, cómo se refleja en la prioridad y cómo se generan las subórdenes que alimentan el informe trimestral de avance.
M4.4 · M1.9.1
Comercial / Gustavo
54
Decidir la convivencia con Google Drive: si el sistema sigue generando el respaldo automático o lo sustituye por completo, y a partir de qué versión.
M3.5
Alfonso / Gustavo
55
Definir el módulo de backup del sistema: alcance, periodicidad y formato de exportación del histórico. Hoy sin responsable ni fecha.
M3.5 · M11
Alfonso
56
Verificar la norma de taxonomía de fallas aplicable: el 27/08 se citó ISO 14224, pero la estructura objeto·síntoma·causa·acción corresponde a ISO 14224.
M2.4
Gustavo
57
Asignar responsable y fecha a la seguridad del portal de cliente, hoy sin dueño y condicionante de la puesta en producción.
M8 · M11.4
Alfonso
58
Delimitar el alcance de la base de conocimiento interna (KBI) frente a la externa (KBE), declarado sin resolver el 27/08.
M12
Alfonso / Gustavo
59
Confirmar la ruta del equipo sin novedades: recorrido obligatorio de las etapas macro sin exigencia de fotografía.
M2.1
Gustavo / Johny
60
Resolver qué criterio ordena el MVP: el de §3.1 —cumplimiento de fecha e integridad del dato— o el propuesto el 03/09, replicar la funcionalidad del Desk 1.0 para migrar rápido. No son incompatibles, pero son órdenes distintos.
§3.1 · §3.2
Alfonso / Gustavo
61
Establecer el mecanismo de incorporación de actas al documento maestro: quién avisa, con qué cadencia y contra qué fuente se comprueba que no falta ninguna. La del 27/08 estuvo cinco revisiones sin entrar.
§1.11
Alfonso
62
Decidir qué se hace con la capa as-built. El 27/08 se acordó retirar las referencias a lo construido por considerarlas ruido; la revisión posterior encargó expresamente la tabla de seguimiento del Anexo H. Son criterios opuestos y hay que elegir. [R08.2] Llevado al orden del día de la sesión del 03/09/2026 (bloque 0 de la convocatoria) y no tratado en ella: el acta no registra decisión ni responsable. Por la regla de la sesión, vuelve al Anexo D. Sigue abierto, y con él sigue abierta la contradicción entre retirar la capa as-built y mantener el Anexo H.
§1.10 · Anexo H
Alfonso
63
Confirmar la correspondencia entre los módulos M1–M8 del acta del 27/08 y los M1–M12 de este documento: si son la misma estructura vista en grueso o una agrupación distinta.
§2
Alfonso / Gustavo
36
Aceptar formalmente —o no— la pérdida de aviso en la ventana entre las dos escrituras (M1.9.3), y decidir si el borrado de administrador es compatible con la auditoría inmutable que exige M11.4.
M1.9.3 / M11.4
Alfonso / Dirección
64
[R08.2] Histórico de C1 que el arreglo no repara. liberacion_sin_facturar es columna promovida (packages/zoho-sync/src/db/rows.ts:121), así que las filas escritas antes del 09/09/2026 pueden afirmar false en tickets que están exactamente en «Por Entregar / Sin facturar». F1A-01 detiene la sangría; no repara lo ya escrito. Pendiente: contar esas filas contra la base de producción y decidir si se corrigen —el dato correcto existe en ticket_transitions.values—, se marcan o se excluyen del indicador. Hipótesis mientras no se cuente: existen; no se ha verificado.
M1.7 · C1
Por asignar
Anexo E — Glosario
Término
Significado
ALM
Asset Lifecycle Management — gestión del ciclo de vida del activo.
as-built
Lo que la aplicación hace realmente, verificado en su código. Etiqueta introducida en la R04.
as-is
Lo que el proceso hacía en el sistema anterior, según mapeo manual y sin contrastar.
Desk 2.0
Nombre interno de la plataforma Desk 2.0.
Blueprint
Definición del flujo de estados y transiciones de un tipo de ticket.
CG / MT
Nomenclatura actual de tickets: calibración / mantenimiento. Se elimina.
CMMS
Computerized Maintenance Management System.
CTP
Capable to Promise — cálculo de la fecha de entrega comprometible según capacidad real.
EAM
Enterprise Asset Management.
Estado de espera
Estado cuya única salida depende de un suceso externo a la aplicación. Hay cuatro (M1.3.4).
Estado terminal
Estado del que no sale ninguna transición. En el blueprint sólo lo es Finalizado.
Derivación
Registro de a quién pasa el trabajo tras una transición; casilla «Derivado a».
Escaparate
Subconjunto de la KB Externa accesible sin contrato, que funciona como demostración del contenido completo.
Guarda
Condición que debe cumplirse para permitir una transición de estado.
Hard allocation
Reserva firme de un repuesto.
Holgura
Porcentaje de la capacidad calculada que no se publica en la agenda del cliente, reservado para urgencias y desviaciones.
ISO 14224
Norma de recolección e intercambio de datos de confiabilidad y mantenimiento.
ISO 9001
Norma de sistemas de gestión de la calidad; marco de la trazabilidad exigida.
KBI
Knowledge Base Interna — base de conocimiento de Ambientalia, para uso de sus técnicos.
KB Externa
Base de conocimiento publicada a clientes; documentación controlada bajo ISO 9001.
Kitting
Agrupación lógica de partes para tareas recurrentes.
Lead time
Tiempo transcurrido entre dos hitos del proceso.
managed_by_app
Indicador que marca un ticket como gestionado por la app y lo saca del sincronismo con Zoho. Explica por qué las dos entradas no se cruzan.
MCP
Model Context Protocol — protocolo por el que un agente consulta herramientas externas. En este proyecto es una de las vías candidatas para la capa de conocimiento (contra NotebookLM o contra los notebooks propios). No interviene en la conexión Zoho → PostgreSQL, que es un cliente REST propio con OAuth2. [R08.2]
Macro-fase / micro-fase
Nivel grueso y nivel de detalle del diagnóstico.
MRO
Maintenance, Repair and Operations — inventario de mantenimiento.
MTBF / MTTR
Tiempo medio entre fallas / tiempo medio de reparación.
Nivel básico / nivel completo
Los dos escalones del área de cliente: sin contrato y con contrato de mantenimiento activo.
OC / OV
Orden de compra (cliente) / orden de venta.
OTD
On Time Delivery — cumplimiento de la fecha prometida.
Operadores
Columna de las hojas de mapeo donde se escribieron las condiciones de guarda de cada transición.
Paso sin botón
Cambio de estado que escribe el servidor, sin transición que el usuario pueda pulsar. Hay dos (M1.3.3).
Prefijo
Las tres letras iniciales del código de servicio: MT, CG, HV, SR o PRO (M1.1).
Propietario del registro
Quien tiene asignado el ticket, frente al área a la que pertenece. Nivel de permiso que el as-is usa y el código no distingue.
Tiempo promesa
Días hábiles que Servicio Técnico compromete al escalar el diagnóstico a revisión. Columna 52 del diccionario.
pgvector
Extensión de PostgreSQL que permite almacenar y buscar vectores; almacén propuesto para la capa RAG.
RAG
Retrieval Augmented Generation — patrón que hace que un modelo responda a partir de documentación propia recuperada, citando su fuente.
RCM
Reliability Centered Maintenance.
Reservar / solicitar
Reservar es ocupar un slot en firme (nivel completo); solicitar es pedir cita para que Comercial confirme (nivel básico).
Soft reservation
Compromiso preliminar de un repuesto al cotizar.
Token de acceso
Enlace de un solo uso y alcance limitado enviado por correo, que da entrada al nivel básico del portal sin registro.
Ubicación bin
Posición precisa de almacenamiento dentro del almacén.
Transición
Paso de un estado a otro; lleva el nombre del botón, un área que puede ejecutarla y sus campos.
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
Reuniones → 17/02, 19/02, 14/08 y 20/08 de 2026
Decisiones firmes, tareas, restricciones, plazos y puntos abiertos.
Reuniones → 21/08/2026 (incorporada en R02)
Conexión Zoho → PostgreSQL (cliente REST propio con OAuth2), autocompletado por serial, OV previa a la recepción, menú visual de accesorios, interfaz que replica Zoho Desk, piloto Grimm EDM 180/280 y el módulo de digitalización del conocimiento. (El acta trató además el portal del empleado, retirado del alcance en la R06 — ver §1.2.)
Sesión de trabajo 21/08/2026 — esquema de ejes de valor (incorporada en R03)
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
Actas incorporadas en la R08.1.
Fuente
Aportación
Notion → Reuniones → Desk 2.0 27/08/2026
Ocho temas y once decisiones firmes: arquitectura híbrida de macros y checklists, subdivisión de órdenes de venta, código interno del cliente, informe de salida, captura en base de datos, portal como etapa independiente, vía de escape manual, y QR e incertidumbre en certificados. No estaba recogida en ninguna revisión anterior.
Notion → Reuniones → Desk 2.0 03/09/2026
Convocatoria, no acta: a la fecha de cierre de la R08.1 la sesión no se había celebrado. Aporta los nueve entregables pendientes, las ocho cuestiones que se someten a decisión y el criterio de MVP propuesto. [R08.2] Incorporada como acta en la R08.2: docs/Manifesto/Desk2.0_Acta_Sesion_2026-09-03.md (Anexo C.10).
Fuentes de mapeo, nuevas en la R05.
Documento
Fecha
Aportación
DFserviciotecnico160226.xlsx
16/02/2026
35 filas con origen, transición, destino, área, tipo de evento, descripción, campos con obligatoriedad y condiciones de guarda. Coincide con el código en las 34 transiciones (M1.3.9).
DFequiponuevo030226.xlsx
03/02/2026
Flujo de equipo nuevo: 5 transiciones. Corrige M1.4.
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
Confirman los cuatro grafos, el SLA de un día sobre Notificado y el estado Entregado desconectado.
Mapa visual del blueprint [DECIDIDO 10/09 — R08.2]. El mapa visual del blueprint se genera desde transitions.ts (docs/artefactos/blueprint-*.md) y una prueba impide que quede desfasado. Las fichas de hallazgos viven en los documentos de auditoría, no en el mapa. El artefacto interactivo anterior, «Blueprint de Servicio Técnico — mapa de transiciones», se retira como histórico congelado en el commit a3a8f03. Por qué: «se actualiza con cada auditoría» no era un mecanismo, era una promesa, y nadie la cumplió — el artefacto describía desde el 21/08 un flujo anterior a las correcciones C1, C11 y C9. La lección de la R05 recogida en §1.3 aplica igual: el riesgo no estaba en levantar el proceso, estaba en resumirlo sin volver a la fuente.
Hueco nombrado, no resuelto. M1.3.3 dice que el mapa tiene 38 pasos. El código tiene 34 transiciones con botón más 2 sin botón = 36. Faltan dos y no se sabe cuáles; puede que el mapa cuente caminos en vez de transiciones. La cifra está en revisión y el generador tiene que cerrarla antes de su criterio de aceptación.
Sobre la cobertura. De los cuatro vacíos que arrastraba este documento —el diccionario de campos, los dos diagramas comerciales y las cinco imágenes de la página de KPIs— la R05 cierra los tres primeros. Queda abierto el punto 16, aunque el Anexo G cubre buena parte de su contenido: los once indicadores calculados y sus fórmulas.
Sobre la naturaleza de la R03. Aquella revisión no incorporó actas nuevas. Formalizó el marco de intención que estructura las decisiones ya tomadas y especificó dos áreas que hasta entonces existían como enunciado: la capa de conocimiento y el área de cliente. Ninguna decisión anterior quedó revocada.
Sobre la naturaleza de la R04. Esta revisión tampoco incorpora actas nuevas, y tampoco revoca ninguna decisión. Lo que hace es distinto de todo lo anterior: contrasta el documento contra el código y corrige lo que no coincidía. Es la primera vez que una parte de esta especificación deja de ser lo que se quiere construir para pasar a ser lo que está construido.
Sobre la naturaleza de la R05. Tampoco incorpora actas nuevas ni revoca decisiones. Lo que hace es volver a las fuentes: recupera las hojas de mapeo y el diccionario que estaban detrás de los resúmenes, y con ellos cierra tres puntos abiertos, corrige un módulo y matiza una afirmación de la R04.
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
Ya no queda ningún flujo cuya única referencia sea un resumen de segunda mano.
Anexo G — Diccionario de campos de la tabla de tickets
Fuente: «Diccionario de Campos Tickets.csv». Incorporado en la R05; cierra el punto abierto nº 2.
Las 59 columnas de la tabla de tickets del sistema actual, agrupadas por naturaleza. Es el punto de partida del modelo de datos de Desk 2.0: qué existe hoy, qué significa y cómo se calcula lo que se calcula.
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
Nombre del ticket. Estructura normalizada: Tipo de servicio + Nombre del cliente + Tipo de equipo + Prefijo_NúmeroSerie_Modelo_AAMMDD. Ver M1.1.
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
Estado del ticket según el diagrama de flujo.
7
Hora de modificación
Se actualiza automáticamente en cada cambio de estado y en cada comentario nuevo.
11
Clasificaciones
Mantenimiento · equipo nuevo · soporte remoto. Es el campo que activa los distintos flujos de trabajo (M1.2).
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
Tiposervicio_NumeroSerie_Modelo_aammdd. Ejemplo: MT_18A20070_EDM180C_260130.
33
Código Interno
Código que el cliente asigna a su equipo. Se requiere para los entregables cuando el cliente lo pide.
G.4 Personas, prioridad e interacción
Col.
Campo
Contenido
9
Prioridad
High: clientes con análisis favorable o contrato prioritario · Medium: estándar · Low: clientes con análisis desfavorable. El diccionario anota que debe conectarse con la aplicación de calificación de clientes y asignarse desde la creación del ticket por Comercial — es el criterio de la priorización automática decidida el 14/08.
29
Encargado
Persona de Ambientalia responsable del ticket.
35
Correo Encargado
Ligado directamente a la columna 29.
16
Número de comentarios
Total de comentarios de todas las áreas. El diccionario lo propone como medida del desgaste en la atención del ticket.
55
Calificación de satisfacción
La que el cliente da en el correo de finalización. Hoy sólo se usa para el reporte trimestral. No figuraba en ningún KPI — ver M7.1.
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
Ingreso a Servicio — llegada del equipo a las instalaciones. Obligatoria.
43
Fecha Orden De Venta
Habilitar Servicio (formaliza la activación del ticket) y Aprobación y S. Repuestos (packages/shared/src/transitions.ts:199). [R08.2]
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
Escalado a Revisión. Es el Tiempo promesa (M4.2). Obligatoria.
44
Fecha Recepción de repuestos
Llegada de repuestos. Obligatoria.
45
Fecha Finalización ST
finalización de servicio.
46
Fecha De Factura
Facturado y facturado y cierre de TK. Obligatoria.
—
Fecha Salida Servicio externo
Calibración de sensores ext. (desde Rev./Diagnostico y desde En Proceso).
—
Fecha Entrada servicio externo · Conformidad
Retorno de servicios externos.
—
Fecha Remisión de Salida
Entrega al cliente y Entrega al cliente sin factura. La reescribe cada vuelta del ciclo — ver M1.3.5 y corrección C4.
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
Fecha creación ticket − Fecha Remisión Entrada. Inválido para 2026 (M1.10).
49
Tiempo de diagnóstico
Fecha Revisión Informe − Fecha creación ticket. Hereda el problema del 48.
50 · 53
Tiempo de servicio
Días hábiles desde Fecha Orden De Venta —o desde Fecha Recepción de repuestos, si la hubo— hasta Fecha Finalización ST. Devuelve 0 si el resultado es negativo o falta la fecha de finalización.
51
Tiempo recogida del equipo
Hora de actualización del estado − Fecha Finalización ST.
54
Cumplimiento del tiempo promesa
Cumple / No cumple, comparando el tiempo total de servicio contra los días de entrega comprometidos. Es el OTD tal como se calcula hoy — ver M7.1.
56
Tiempo bodegaje de ingreso
Fecha creación ticket − Fecha Remisión Entrada. Inválido para 2026 (M1.10).
57
Tiempo de cotización
Entre Fecha Revisión Informe y Fecha de Cotización.
58
Tiempo de orden de compra
Entre Fecha Orden de Compra y Fecha de Cotización. Es el aging de aprobación.
59
Tiempo de orden de venta
Lo que tarda en generarse la orden de venta.
G.7 Columnas marcadas como no relevantes
El diccionario descarta expresamente doce columnas: 1 (ID de sistema), 2 (nombre de contacto de sistema), 10 (tiempo de respuesta del cliente), 14 (hora de asignación), 15 (modificado por), 17 (tiempo de resolución en horario laboral), 18 (Ticket Age in Days), 20 (Completion Age Tier), 21 (Ticket handling Mode), 23 (nombre de empresa), 24 (tiempo en espera del ticket) y 37 (fecha de vencimiento del sistema).
Son las primeras candidatas a no migrar. Conviene, eso sí, revisar dos de ellas antes de descartarlas: la 14 y la 17 miden cosas que el cuadro de mando de M7.1 sí quiere —asignación y tiempo efectivo en horario laboral—, y es posible que se descartaran por poco fiables en Zoho y no por poco útiles.
G.8 Cómo usar este anexo
Para el modelo de datos (M7.6): G.5 y G.6 son el mínimo que Desk 2.0 tiene que conservar para que los indicadores existentes sigan calculándose. G.7 es lo que puede quedarse atrás.
Para la migración del historial (M3.5): la correspondencia de estados hay que leerla del propio Desk 1.0, pero la de campos está aquí.
Para las correcciones: la fila de Fecha Remisión de Salida en G.5 es la que la C4 tiene que dejar de sobreescribir; las columnas 48, 49 y 56 son las que la C9 tiene que redefinir.
Anexo H — Seguimiento: as-built frente a plan
Nuevo en la R08. Es la tabla de control del proyecto: qué se planificó, qué está construido, y dónde están las diferencias.
H.1 Cómo se lee y cómo se mantiene
Este anexo responde a una pregunta que el resto del documento no responde de un vistazo: de todo lo que aquí se especifica, ¿qué existe realmente?
Tres columnas y una regla:
Plan — lo que el documento especifica o el acta decidió.
As-built — lo verificado en el código o en el sistema actual, con su fuente.
Diferencia — la brecha, nombrada. No «pendiente», sino qué falta y por qué importa.
La regla es que el as-built no se recuerda: se verifica. Cada línea de esa columna procede de una lectura del código, de una hoja de mapeo o del blueprint de Zoho, y la R05 dejó claro por qué importa: durante tres revisiones el documento describió un flujo que no era el implementado, y nadie lo notó porque una tabla mal resumida se lee igual de bien que una correcta.
Cadencia. Se actualiza en cada revisión del documento y en cada hito de desarrollo. La auditoría del blueprint con IA —decidida el 20/08 y descrita en M2.6— es el mecanismo previsto para regenerar la columna de as-built sin volver a levantarla a mano.
Estado a la fecha de corte de la R08. Lo construido es un demostrador (§1.10), no una plataforma en producción. Conviene tenerlo delante al leer las tablas: un «construido» aquí significa «existe y funciona en el demostrador», no «está en servicio».
H.2 Los cuatro flujos
Flujo
Plan
As-built
Diferencia
Servicio técnico
34 transiciones, 21 estados
Construido y verificado. Coincide con la hoja del 16/02 en las 34 transiciones y con el código en las 38 filas del mapa (M1.3.7). [R08.2] Red de pruebas del motor desde F0-04: 110 ficheros y 931 pruebas sobre el commit ad1875b (96 y 830 en el baseline)
Ninguna en el grafo. Las diferencias son de comportamiento y están en H.3
Equipo nuevo
6 transiciones, 5 estados [R08.2]
No construido. Verificado sólo contra la hoja del 03/02 y el blueprint de Zoho
La salida aprobada de Verificación existe (71 usos, R08.2). Queda la guarda por familia de equipo, pendiente de Calidad (nº 38)
Soporte remoto
4 transiciones, 4 estados
No construido. Verificado contra la hoja del 03/02
El mapeo es correcto; falta implementarlo
Comercial
10 transiciones, 9 estados
Fuera de Desk. Vive en Zoho CRM
Falta la lectura del estado del trato desde el ticket (M1.11)
Posible cliente
4 transiciones, 5 estados
Fuera de alcance desde la R08
Ninguna: no se construye
H.3 Las doce correcciones
Es la tabla que más conviene mirar: son las diferencias entre lo que el proceso debería hacer y lo que hace.
#
Qué corrige
Estado a la R08
Esfuerzo
C1
Checkbox obligatorio que el motor deja saltar
Cerrada en F1A-01 el 09/09/2026: un checkbox obligatorio sin marcar devuelve 422 y el ticket no se mueve. Queda vivo el histórico escrito antes (punto abierto nº 64). [R08.2]
Dos piezas (era «una línea») · cerrada en F1A-01 el 09/09/2026
C2
No existe el estado Anulado
Pendiente de decisión de negocio. El flujo comercial ya modela la distinción
Media
C3
Cuatro estados de espera sin salida
Pendiente de definir cada salida. Confirmada en la R08
Media
C4
El ciclo facturar↔entregar pisa la fecha de entrega
Replanteada en la R08. Se adopta la separación en dos ramas con Pendiente de facturar; resuelve también el punto 6
Media (era Baja)
C5
Falta el atributo de tipo de evento
Bloqueada. La taxonomía existe pero un evento está en tres categorías: hay que desambiguar antes
Baja + desambiguación
C6
No hay etapa de QA antes de la liberación
Pendiente. Modelo disponible en el flujo de equipo nuevo, condicionado a C12
Media
C7
Las esperas no paran el reloj del SLA
Pendiente. Conviene hacerla junto con C9: los tres bodegajes son exactamente el tiempo a descontar
Media
C8
Traducir los 21 estados a las etapas del portal
Pendiente. Necesaria antes del área de cliente y de los avisos por correo
Baja
C9
Bodegaje inválido desde 2026
Resuelta en su definición (M1.10). Dos de los tres bodegajes son calculables hoy; el tercero necesita el campo «fecha de aviso al cliente»
Baja + un campo
C10
Permisos sólo por área, no por cargo ni propietario
Pendiente. El dato del propietario ya existe en la derivación
Media
C11
SLA de un día sobre Notificado no implementado
Pendiente. Ampliada en la R08: correo redundante y escalado al superior
Baja
C12
Verificación sin salida en equipo nuevo
Replanteada en la R08.2: la salida aprobada existe y pasa a recuperación as-is. Queda la guarda por familia, pendiente de Calidad (nº 38)
Baja
Ninguna de las doce está ejecutada a la fecha de corte. Cuatro cambiaron de definición o de alcance en esta revisión (C4, C5, C9, C11), lo que confirma que era pronto para ejecutarlas y tarde para seguir sin discutirlas. [R08.2] A 10/09/2026 C1 está cerrada (F1A-01, 09/09/2026) y C12 deja de ser corrección para ser recuperación as-is (M1.4).
H.4 Los doce módulos
Módulo
Plan
As-built
Diferencia
M1 · Núcleo de tickets
Máquina de estados completa, permisos, derivación, tipos de evento
Construido en el demostrador: 34 transiciones, permisos por área, derivación y avisos
Faltan tipos de evento, transiciones por tiempo y permisos por cargo y propietario
M2 · Diagnóstico guiado
Árbol macro→micro con criterio de falla
No construido. Ni el árbol del Grimm está desarrollado
Es el módulo con más distancia entre lo especificado y lo existente
M3 · Hojas de vida
Ficha completa con los cuatro campos comerciales
Parcial. Faltan fecha de adquisición, de factura, fin de garantía y código interno del cliente
La captura asistida sale del MVP en la R08
M4 · Comercial y promesa de fecha
CTP con capacidad finita
No construido. El Tiempo promesa lo fija hoy el técnico a ojo
Requiere M5 y M6 antes
M5 · Inventarios
Reservas, kitting, bins, reabastecimiento
Resuelto fuera de Desk (Portal · Análisis de Inventario). Kitting descartado; bins y almacén aplazados
Queda la lectura de disponibilidad hacia el CTP (punto 48)
M6 · Planificación y capacidad
Parámetro de carga configurable, calendarios
No construido
Es la condición del CTP; sin él la fecha se sigue prometiendo a ojo
M7 · Analítica y KPIs
Cuadro de mando completo
Parcial: once indicadores se calculan hoy sobre la tabla de tickets (Anexo G)
Tres están rotos o en riesgo; falta el de satisfacción en el cuadro
M8 · Portal de cliente
Dos niveles, identidad, agendamiento
No construido
Depende de C8 y del modelo de identidad (punto 50)
M9 · QA/QC
Etapa de validación con retrabajo
No construido
Es la corrección C6
M10 · Movilidad y UX
App con checklists, fotos, firma, offline
No construido
La interfaz actual replica Zoho Desk, como se decidió
M11 · Arquitectura
PostgreSQL propio, Zoho en solo lectura
Construido. Conexión Zoho → PostgreSQL mediante cliente REST propio con OAuth2 (refresh token por servicio), operativa, actualización cada tres minutos
Supabase queda descartado (R08). Pendiente la política de escritura del punto 44
M12 · Conocimiento y RAG
Capa RAG con KBI y KB Externa
No construido. La vía técnica está en discusión
El contenido —los vídeos— tampoco ha empezado
H.5 Los indicadores
Indicador
Plan
As-built
Diferencia
Cumplimiento del tiempo promesa
OTD contra la entrega al cliente
Se calcula hoy (columna 54), pero contra la finalización de ST
Son dos indicadores distintos; conviene mantener los dos y nombrarlos aparte
Tiempo de servicio
Excluyendo esperas ajenas
Se calcula (columnas 50 y 53)
No descuenta los tres bodegajes (C7 + C9)
Bodegaje
Uno solo, mal definido
Inválido desde 2026
Redefinido en la R08 como tres; dos calculables ya
Tiempo de diagnóstico
Desde la recepción
Se calcula contra la fecha de creación del ticket
Hereda el mismo defecto que el bodegaje
Satisfacción del cliente
—
Existe (columna 55), sólo para reporte trimestral
No figura en el cuadro de mando
Tiempos por tipo de evento
Por categoría de transición
No calculable
Bloqueado por C5
Tickets atascados en espera
—
No existe
Es lo que haría visible el problema de C3
H.5b El plan, tras el acta del 27/08
El acta aporta lo que a esta tabla le faltaba: una fecha y un criterio de parada.
Elemento del plan
Estado
Versión operativa del Desk 2.0
31/12/2026, ratificado el 27/08
Desarrollo
Frenado hasta consensuar el documento maestro
Prototipo de checklist dinámico sobre Grimm EDM 180
Comprometido para el 03/09 · pendiente
Excel de inspección física del Grimm EDM 180
Comprometido para el 03/09 · pendiente
Consolidado de códigos internos de cliente
Comprometido para el 03/09 · pendiente
Flujo de construcción del informe de servicio
Comprometido para el 03/09 · pendiente
Documento maestro depurado
Comprometido para el 03/09 · esta revisión lo aborda parcialmente
Migración del histórico documental
Sin responsable ni fecha
Módulo de backup del sistema
Sin responsable ni fecha
Seguridad del portal de cliente
Sin responsable ni fecha
Los tres frentes sin dueño condicionan la puesta en producción, según el propio acta. A cuatro meses de la fecha meta, es el dato más accionable de todo este anexo.
H.6 Lo que esta revisión deja en entredicho
Cinco cosas que el plan daba por firmes y que después de la R08 no lo están. Es la lista corta para la sesión de revisión del backlog:
Se daba por
Estado tras la R08
Orden de venta obligatoria antes de la recepción
Decidido el 10/09 (R08.2): obligatoria para trabajar, no para recibir. El estado provisional es Remisión creada
OCR y QR dentro del MVP
Fuera. No críticos en primeras fases
Kitting, bins y operación de almacén en el backlog
Descartado el primero; aplazados los otros dos
pgvector como almacén de la capa RAG
En suspenso hasta elegir la vía
El backlog del MVP tal como está
Congelado hasta la sesión de revisión del 03/09
El área de cliente dentro del MVP (ítem 26)
En entredicho. El portal pasa a etapa independiente (27/08)
El criterio que ordena el MVP
En disputa. §3.1 frente a «replicar el Desk 1.0» (03/09)
La capa as-built de este documento
En disputa. El 27/08 pide retirarla; la revisión posterior encargó el Anexo H
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
Pendiente de sesión
Marcado para tratarse en reunión antes de decidir.
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
Incorporado: se acota el alcance de la etiqueta AS-BUILT al demostrador actual.
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
Creo conveniente tratar en una reunión
Marcado para tratar en reunión; se mantiene el punto abierto 36.
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
Revisar conclusiones de diseño de reunión 03/09/2026 “Checklist dinámico”
Incorporadas las conclusiones del acta del 03/09 [R08.2]: tema 3 cerrado con decisión; tema 4, sólo con tarea.
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
Revisar conclusiones de diseño de reunión 03/09/2026
Incorporadas las conclusiones del acta del 03/09 [R08.2]: tema 3 cerrado con decisión; tema 4 —el encadenamiento que pide el paso 3— sólo con tarea.
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
Backlog del MVP marcado en revisión; la tabla se congela hasta la sesión y el Anexo H recoge el estado real.
I.1 Lo que esta revisión enseña sobre el propio documento
Tres patrones que conviene no perder de vista en las siguientes:
Las dudas encontraron defectos reales. De las tres observaciones del tipo «no entiendo esto», una destapó que un mismo evento estaba clasificado en tres categorías a la vez —un defecto que bloquea la corrección C5 y que nadie había visto en cinco revisiones—. Cuando el revisor no entiende un pasaje, la primera hipótesis debe ser que el pasaje está mal.
El documento se adelantaba a los hechos. Varias cosas figuraban como decididas sin serlo: la orden de venta previa, las cuatro macro-fases, las guardas de transición. El revisor las devolvió a su estado real. Conviene ser más estricto con la etiqueta [DECIDIDO]: sólo lo que consta en acta como decisión, no lo que parecía ir en esa dirección.
Las mejores soluciones vinieron de quien conoce la operación. La separación del ciclo de facturación en dos ramas, la definición de los tres bodegajes y el modelo de prioridades no son refinamientos de lo que había: son soluciones mejores que las propuestas, y ninguna podía deducirse del código ni de las actas. Es el argumento del esquema: la máquina consolida y verifica, pero la operación la conoce quien la vive.
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
Habilitar Servicio no escribe la col. 42; Aprobación y S. Repuestos también escribe la 43
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
La sesión del 03/09 sí se celebró. M2.1 queda cerrada; M2.5 no (tema 4 sin decisión). Nº 62 no tratado, vuelve al Anexo D
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
Novedades de la R08.2; el bloque de la R08.1 pasa a §1.3; dos filas nuevas en §1.8; C.10 como acta; C.11 nuevo
Esta revisión
No incorporado, a propósito: las entradas 4, 5 y 7 del registro F0-01 (baseline), la 10 (el documento está bien), las cinco correcciones al plan de fases y la titularidad OV ↔ equipo. Tampoco los tres puntos nuevos del Anexo D que el registro F0-01 propone en su cabecera —doble escritura Sheets / Postgres, cuatro indicadores rotos por reentrancia y rotación de secretos—, que el expediente de la R08.2 no incluye; quedan para la revisión siguiente si Gerencia los aprueba.
