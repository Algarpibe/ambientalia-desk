# ¿Se puede replicar Zoho Desk «exactamente» en la Fase 1?

**Fecha:** 09/09/2026 · **Para:** sesión del 11/09 · **Verificado contra:** `C:\dev\Desk_2_R1.023` en `3aaa0f1`
**Respuesta corta:** el taller sí, y ya está casi hecho. El **correo no**, y no está en ninguna tanda del plan. Con la Fase 1 tal como está escrita hoy, **Desk 2.0 sustituye al Desk 1.0 como herramienta de trabajo, pero Zoho Desk no se puede apagar.**

---

## 1 · La palabra «exactamente» esconde tres proyectos distintos

| Capa | Qué es | Estado real |
|---|---|---|
| **El taller** | Blueprint, transiciones, permisos, derivación, avisos, hoja de vida, remisiones, catálogo, adjuntos visibles en el hilo | **Replicado y en producción.** Es lo que la Fase 1 completa |
| **El histórico** | Cinco años de conversaciones, adjuntos, informes firmados, remisiones escaneadas | **Espejo, no copia.** Los metadatos están en PostgreSQL; **los archivos siguen viviendo en Zoho** |
| **El correo** | Que los tickets nazcan de un correo y que se responda al cliente desde el ticket | **No existe.** Es el «último cordón con Zoho», diseñado en junio y diferido |

Las tres se confunden bajo «replicar el Desk 1.0», y sólo la primera cabe en 2026 junto con el diagnóstico y los informes.

---

## 2 · Lo que sí está, y es más de lo que parece

Los adjuntos **se ven en el hilo del ticket y en la hoja de vida**, con miniatura para imágenes y tarjeta con nombre para PDFs (`Adjuntos.tsx`). Las conversaciones están sincronizadas en tabla propia (`conversations`: autor, tipo, público/privado, contenido, fecha). Y la app **sí sabe subir ficheros por su cuenta**: hay `multer` montado en tres sitios —fotos de remisión (`/api/remisiones/:id/fotos`), adjuntos de resolución (`/api/tickets/:id/resolution/attachments`) y fichas del catálogo—, con los bytes guardados en PostgreSQL.

Es decir: **subir una foto desde la app ya funciona**, y ese archivo es de Ambientalia, no de Zoho.

---

## 3 · Lo que no está, por orden de coste

### 3.1 · El correo, entrante y saliente — *el más caro, y ya tiene diseño*

Hoy el circuito es: **Zoho Desk recibe el correo → crea el ticket → Desk 2.0 lo sincroniza en solo lectura.** Y para responder, `POST /api/tickets/:id/reply` no envía nada por su cuenta: **se lo pide a Zoho** (`POST /tickets/{id}/sendReply`), y además está apagado por `ENABLE_WRITES=false` en el despliegue documentado. O sea que hoy, ni siquiera con Zoho vivo, la app responde al cliente.

Esto no es un descuido: está diseñado y diferido. `debt.md` §3g lo llama, textualmente, **«el último cordón con Zoho»** y trae el alcance cerrado el 05/06/2026: transporte por **Gmail API** sobre el buzón de Workspace —elegido sobre IMAP/SMTP porque Google firma DKIM, no hay que tocar DNS, el `historyId` da sincronización incremental y el `threadId` da hilos nativos—, descompuesto en **D0** (OAuth, scopes, threading, DKIM/SPF/DMARC, anti-bucle, almacenamiento de adjuntos y averiguar cómo llega hoy el correo a Zoho, que no está confirmado) y **D1** (recepción: parsear, deduplicar, emparejar por `threadId`/`References` con un ticket o crear uno nuevo, reabrir si estaba cerrado), más los siguientes.

Son tres o cuatro tandas grandes con riesgo real —el emparejamiento de hilos y los bucles de autorespuesta son donde estos sistemas se rompen— y ninguna está en el plan R01.1.

### 3.2 · Los bytes de los adjuntos históricos — *barato de medir, aún sin medir*

`/api/attachment` es un **proxy en vivo**: valida la ruta, pide el fichero a Zoho con OAuth y lo devuelve. No guarda nada. El día que Zoho se apague, cinco años de fotos de equipos, informes firmados y remisiones escaneadas dejan de verse — y son parte de los seis acervos documentales sin dueño que la convocatoria del 03/09 ya listaba, incluida la evidencia ISO 9001.

Lo bueno: **el endpoint de medición ya existe y nadie lo ha llamado.** `GET /api/admin/measure-attachments`, logueado como super administrador, recorre los tickets y devuelve cantidad y GB totales sin descargar nada. Ese número decide el destino: volumen en disco de EasyPanel si son pocos GB, MinIO/S3 si son decenas, `bytea` sólo si son cientos de MB. **Es una llamada de dos minutos y hoy nadie sabe el tamaño del problema.**

### 3.3 · Lo que probablemente no se echará de menos, pero conviene decidir

Vistas personalizadas del usuario (las dos entradas «Views created by me / shared to me» están en el menú, deshabilitadas), SLA nativo de Zoho, plantillas de respuesta y firmas, macros, etiquetas, encuesta de satisfacción, informes nativos, portal y base de conocimiento de Zoho. Nada de eso está en Desk 2.0 y nada está en el plan. La pregunta para el viernes no es si se construyen, sino si alguien los usa hoy.

---

## 4 · Las dos lecturas de «Fase 1 = replicar el Desk 1.0»

| | (a) El taller trabaja entero en Desk 2.0 | (b) El 31/12 se apaga Zoho Desk |
|---|---|---|
| Qué falta | Lo que ya dice el plan: 1A a 1F | Lo anterior **más** Subsistema D completo, adjuntos persistidos y migración del histórico |
| ¿Cabe antes del 31/12? | Sí, con el margen ya conocido | **No.** Son 3–4 tandas L extra sobre 15 semanas que ya no tienen holgura |
| Qué se gana | El diagnóstico protocolizado y los informes, que es lo que el negocio pidió | Independencia y ahorro de licencias |
| Qué se paga | Se siguen pagando licencias de Zoho durante 2026, y el dolor nº 10 —licencias por usuario que limitan agentes— sigue vivo | Se sacrifican 1D y 1E, que son la razón del proyecto |

**El maestro respalda (a) sin ambigüedad:** el ítem 76, «Sustitución completa de Zoho Desk», está en la fase Futuro, no en el MVP. Lo que introdujo la duda fue el criterio del 03/09 —«replicar la funcionalidad del Desk 1.0 para migrar rápido»—, que se puede leer como que Zoho muere en diciembre. No lo dice, pero se entiende así.

---

## 5 · Recomendación

**Adoptar (a) explícitamente y escribirlo**, para que nadie llegue a diciembre esperando apagar Zoho. En concreto:

1. **Zoho Desk se queda como buzón durante 2026.** El correo entra por Zoho, Desk 2.0 lo sincroniza, y el taller trabaja entero en Desk 2.0. Es lo que ya ocurre; lo que cambia es que deja de ser un estado provisional sin nombre.
2. **El Subsistema D entra como épica propia de la Fase 2** (2027 · T1), con su D0 primero, porque D0 incluye averiguar cómo llega hoy el correo a Zoho —reenvío, MX o IMAP— y eso condiciona todo lo demás y nadie lo sabe.
3. **Medir los adjuntos esta semana** con `/api/admin/measure-attachments`, y meter su persistencia en F1F o al principio de la Fase 2 según lo que salga. No depende de ninguna decisión y protege la evidencia ISO.
4. **Activar `ENABLE_WRITES` para el reply**, o decidir que Comercial responde desde Zoho durante 2026. Hoy no está decidido: está apagado por defecto y nadie lo ha planteado.

---

## 6 · Para la sesión del 11/09

Tres preguntas nuevas, cortas:

- **¿Alguien responde hoy al cliente desde Desk 2.0, o todos van a Zoho?** Decide si `ENABLE_WRITES` se activa o el reply se retira de la interfaz hasta el Subsistema D.
- **¿Qué se usa de Zoho Desk que no esté en la lista de §3.3?** Vistas propias, plantillas, macros, satisfacción. Si nadie las usa, se cierra el alcance; si alguien las usa, aparecen tandas.
- **¿Se acepta que Zoho siga siendo el buzón durante 2026?** Es la pregunta de fondo, y de ella depende que el 31/12 signifique «el taller trabaja aquí» o «apagamos Zoho».
