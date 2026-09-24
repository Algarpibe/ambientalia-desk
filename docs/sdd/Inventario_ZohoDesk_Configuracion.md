> **Documento de trabajo: no contiene decisiones de Gerencia.**

# Inventario de configuración de Zoho Desk — primera pasada

**Fecha:** 09/09/2026 · **Método:** panel de administración de Zoho Desk leído directamente por el navegador (extensión de Chrome), sesión de Alfonso
**Estado:** **parcial.** Cubre canales de correo, blueprints, flujos de trabajo, macros y SLA. Falta la mitad del Setup —ver §6
**Para qué sirve:** es la medida **M3** del plan de independencia, la que dice cuánto trabajo hay de verdad en «replicar toda la funcionalidad»

---

## 0 · Por qué hacía falta el navegador

El MCP de Zoho Desk que veníamos usando da **datos** —tickets, contactos, conversaciones, historia, campos personalizados— pero en su juego de herramientas **no hay nada de configuración**: no permite listar blueprints, flujos, macros, SLA, vistas ni plantillas. Todo eso vive en el panel de administración, y ahí sólo se llega por navegador.

Es una distinción que conviene retener para lo que venga: **el MCP ve lo que la operación produjo; el navegador ve cómo está montada la operación.**

---

## 1 · El hallazgo que más cambia el plan: no hay correo entrante

**Canales → Correo electrónico.** Hay **una sola** dirección de asistencia configurada:

| Dirección | Nombre descriptivo | Recogida de correo | Última modificación |
|---|---|---|---|
| `support@ambientalia.zohodesk.com` | Ambientalia Soporte y Servicio Técnico | **(vacío)** | 17 nov 2020 |

Tres cosas se leen de ahí. La dirección es **`@zohodesk.com`**, no `@ambientalia.com.co`: no es una dirección que se dé a los clientes. La columna **«Recogida del correo electrónico» está vacía**: no hay IMAP ni POP configurado contra ningún buzón corporativo. Y no se toca desde **noviembre de 2020**.

Esto confirma lo que apuntaba la muestra de tickets: **los tickets no nacen de un correo entrante, los crea un agente a mano.** El campo `channel: "Email"` que traen es una etiqueta heredada, no un mecanismo.

**Consecuencia sobre el Subsistema D:** la mitad entrante —la parte cara, con emparejamiento ciego de hilos, deduplicación y anti-bucle— **no hay que replicarla, porque no existe.** Lo que sí hay que resolver es más pequeño y está acotado: cuando un agente responde a un cliente desde el ticket, la respuesta del cliente tiene que volver a engancharse a ese ticket. Eso es threading sobre mensajes que nosotros mismos enviamos, no ingesta de correo arbitrario.

**Una salvedad honesta:** queda por descartar que exista una **regla de reenvío** desde una dirección corporativa hacia `support@ambientalia.zohodesk.com`. Eso no se ve en esta pantalla —se configuraría en Google Workspace, no en Zoho— y explicaría los tickets que sí tienen hilos. Es una comprobación de dos minutos en el panel de Workspace y conviene hacerla antes de dar la conclusión por cerrada.

---

## 2 · Blueprints: hay tres, y uno no cuadra con nuestro as-built

**Automatización → Blueprint:**

| Blueprint | Módulo | Campo | **Transiciones** | Última modificación | Estado |
|---|---|---|---|---|---|
| Ingreso equipo Nuevo | Tickets | Estado | **5** | 05 jul 2024 | Activo |
| **Blueprint estado del Servicio** | Tickets | Estado | **31** | **09 mar** | Activo |
| Soporte Remoto | Tickets | Estado | **4** | 16 ene 2024 | Activo |

Lo bueno: **los tres flujos existen y están activos**, con lo que F1B-06 —equipo nuevo y soporte remoto— tiene su as-is a la vista y es pequeño: cinco y cuatro transiciones.

Lo que hay que investigar: **Zoho dice 31 transiciones para el flujo de servicio; nuestro código declara 34** —verificado en `transitions.ts` por la auditoría F0-00, y el mapeo de febrero decía lo mismo—. Hay tres explicaciones posibles y no son equivalentes:

1. **Zoho cuenta distinto.** Dos de las 34 del código (`Ticket creado → Ingresado` y `Remisión creada → Ingresado`) son entradas propias de la app que, como dice M1.3.9, *«no existen en Zoho y por eso no podían estar en la hoja»*. Eso explicaría dos de las tres.
2. **El blueprint cambió en Zoho.** La fecha de última modificación es **09 de marzo**, posterior al mapeo del 16 de febrero sobre el que se construyó todo el as-built. Si alguien tocó el blueprint en marzo, nuestro espejo lleva medio año desfasado y nadie lo sabía.
3. Una combinación de las dos.

**Es la primera vez que alguien compara el blueprint vivo de Zoho contra el código.** Sea cual sea la explicación, hay que resolverla antes de dar por buena la paridad, y entra como punto del Anexo D. Abrir el blueprint y listar sus 31 transiciones es media hora.

---

## 3 · Automatización: mucho menos de lo que temíamos

| Superficie | Qué hay |
|---|---|
| **Flujos de trabajo** | **Uno solo activo:** `VT_NIT_Tickets`, que se dispara al crear y al actualizar campo, y cuya única acción es **una función personalizada** (0 alertas, 0 tareas, 0 actualizaciones de campo, 0 cambios de dueño). Por el nombre, rellena el NIT del cliente |
| **Macros** | **Ninguna.** «No existe ninguna regla Activo para mostrar» |
| **SLA** | **Cinco acuerdos**, de los cuales cuatro son **las plantillas de fábrica de Zoho** —«basados en prioridades», «Gold», «Silver», «Bronze»; dos de ellas todavía en inglés, es decir, nunca tocadas— y **uno propio: `nivel 1`**, que se ejecuta al crear o actualizar |

**Lectura:** la automatización real de Ambientalia en Zoho Desk son **tres blueprints, una función personalizada y una regla de SLA**. Todo lo demás son valores de fábrica que nadie usa. Eso reduce mucho el riesgo de «se nos va a olvidar algo al replicar».

Y aporta un dato a **C11** —«recuperar el SLA de un día sobre Notificado que existe en Zoho y no se implementó»—: el candidato es la regla `nivel 1`, y ahora se sabe dónde mirar para leer su condición exacta.

---

## 4 · Extensiones instaladas, que no estaban en ningún inventario

La barra de navegación revela cinco extensiones de Marketplace activas, ninguna mencionada en el documento maestro ni en el baseline:

| Extensión | Qué es |
|---|---|
| **Custom Dashboards** | Cuadros de mando propios |
| **Bookmarks** | Marcadores de tickets |
| **Advanced Ticket Filters** | Filtros avanzados sobre la lista |
| **Google Calendar** | Eventos ligados a tickets |
| **WOZTELL LiveChat** | Chat en vivo, presumiblemente WhatsApp |

Más los módulos nativos en uso: **Base de Conocimientos**, **Mensajería Instantánea**, **Actividades** y **Análisis**.

Cada una es una pregunta para el equipo: **¿se usa?** Si «Advanced Ticket Filters» es como Servicio Técnico encuentra sus tickets a diario, eso es una funcionalidad a replicar que nadie había contado. Si «WOZTELL LiveChat» atiende clientes por WhatsApp, es un canal entero fuera del alcance actual. Y si ninguna se usa, son cinco preguntas que se cierran en dos minutos.

---

## 5 · Un camino para la repatriación que no habíamos considerado

**Administración de datos** ofrece, de fábrica: **Exportar**, **Copia de seguridad de datos**, **Importar**, **Zwitch (migración de datos)** y **Papelera de reciclaje**.

Si «Copia de seguridad de datos» permite descargar el histórico completo —tickets, conversaciones y **adjuntos**— en un volcado, la épica 1G cambia de forma: en lugar de recorrer 986 tickets por API descargando adjunto a adjunto, se pide un respaldo, se descarga y se carga. **Merece una mirada antes de escribir la spec de 1G-02**, porque puede convertir dos tandas en una.

También conviene mirar **Privacidad y seguridad → Control de archivos adjuntos**, que puede tener límites que afecten a la descarga masiva.

---

## 6 · Lo que falta por revisar

Esta pasada cubrió canales de correo, blueprints, flujos, macros y SLA. Queda la otra mitad, y el mapa de URLs ya está levantado, así que es trabajo mecánico:

**Personalización:** Diseños y campos (los 59 campos del layout, contra el Anexo G) · Plantillas de correo electrónico · Plantillas de tickets · Notificaciones · Botones · Seguimiento del tiempo.
**Automatización restante:** Reglas de asignación · Reglas de supervisor · Programaciones · Planes de asistencia.
**Organización:** Satisfacción de los clientes (¿hay encuesta activa?) · Horario laboral y festivos —que el SLA usa para contar— · Departamentos · Agentes, Roles y Perfiles, contra el modelo de permisos de Desk 2.0.
**Canales restantes:** Centro de ayuda · Formularios web · Mensajería instantánea · Teléfono.
**Espacio del desarrollador:** Funciones —ahí vive la función de `VT_NIT_Tickets`— · Webhooks · Conexiones · API.
**Integraciones:** Mercado, para ver las cinco extensiones y su configuración.

Calculo entre cuarenta y sesenta pasos de navegación: **una sesión dedicada**, no un rato. El resultado sería el inventario completo que cierra M3 y, con él, el alcance real de «replicar toda la funcionalidad».

---

## 7 · Qué se lleva a la sesión del 11/09

**Confirmado, y cambia el plan:** no hay correo entrante configurado, así que el Subsistema D pierde su mitad cara. Queda por descartar una regla de reenvío en Google Workspace.

**Confirmado, y tranquiliza:** la automatización de Zoho Desk son tres blueprints, un flujo con una función y una regla de SLA propia. No hay macros ni reglas de supervisor que replicar.

**Nuevo, y hay que resolverlo:** Zoho dice 31 transiciones donde el código dice 34, y el blueprint se modificó el 09 de marzo, después del mapeo sobre el que se construyó todo el as-built.

**Nuevo, y hay que preguntarlo:** cinco extensiones instaladas que nadie había inventariado. ¿Cuáles se usan?

**Por explorar antes de escribir la spec de 1G:** la copia de seguridad nativa de Zoho, que podría simplificar la repatriación entera.
