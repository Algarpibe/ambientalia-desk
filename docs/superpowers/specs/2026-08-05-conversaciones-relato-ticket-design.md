# Diseño — CONVERSACIONES como relato del ticket

**Fecha:** 2026-08-05
**Estado:** Aprobado para planificación
**Hermano de:** `2026-08-05-historia-unificada-ticket-design.md`

## Objetivo

Que la pestaña **CONVERSACIONES** cuente el ticket como un hilo legible: una entrada por etapa,
firmada por quien la ejecutó, con su hora, su texto en prosa y sus adjuntos. Es lo que el equipo tenía
en Zoho escribiendo comentarios privados a mano, y lo que hace el ticket entendible de un vistazo.

## Cómo se reparte con HISTORIA

Conviven y no compiten:

| | HISTORIA | CONVERSACIONES |
|---|---|---|
| Qué es | El **log**: una fila por evento, con sus campos etiquetados | El **relato**: un párrafo por etapa, en prosa |
| Para qué | Auditar: qué pasó exactamente y cuándo | Entender: en qué va el equipo y qué falta |
| Adjuntos | No | Sí (enlaces a Drive) |

El usuario eligió al principio "unificar en HISTORIA" sobre "las dos cosas". Tras verla funcionando
cambió de criterio con la pantalla delante, que es la forma buena de cambiar de criterio.

## Hallazgo que ahorra la mitad del trabajo

**El panel ya tiene la forma exacta de la captura de Zoho.** `TicketDetailView.tsx` (la vista
`conversaciones`) ya pinta avatar con iniciales, nombre, insignia `Público`/`Privado`, hora, cuerpo
—texto plano con `whitespace-pre-line` o HTML saneado con DOMPurify— y tarjetas de adjunto. No hay que
rediseñar: hay que **alimentarlo**.

Consecuencia: las entradas generadas son objetos `Message` normales con `type: 'Privado'`. El frontend
casi no se toca.

## Decisiones

| Decisión | Elección | Por qué |
|---|---|---|
| Cómo se construye | **Derivada al leer**, como la historia | Aparece sola la historia que ya existe, las 149 remisiones migradas incluidas |
| Qué se genera ahora | Creación de ticket · remisión de entrada · transición (genérica) | Decidido por el usuario: "por ahora centrémonos en creación de ticket y remisión" |
| Adjuntos | **Enlaces a Drive**, no ficheros | La app no tiene credenciales de Google. El callback ya trae los ids |
| Correo de Zoho | Se queda en el mismo hilo | Hoy solo hay pruebas; cuando se desconecte Zoho el hilo queda entero nuestro |
| Orden | Más reciente primero | Es el orden que el panel ya tiene y el de la captura |

## Los adjuntos: qué se puede enlazar, verificado en el flujo

`Code Resumen Entrada` del workflow `Remisiones_ST_3.13_Desk` (`BpLlnPAfjpHaoeKA`) manda hoy en el
callback: `carpetaId`, `carpetaUrl`, `docId` (el Google Doc) y `pdfId` (el PDF), más el recuento de
fotos, los avisos y los fallos.

- **PDF** — `pdfId` → `https://drive.google.com/file/d/<id>/view`. Disponible hoy.
- **Documento** — `docId` → `https://docs.google.com/document/d/<id>/edit`. Disponible hoy.
- **Carpeta** — `carpetaUrl`, tal cual. Disponible hoy.
- **Etiqueta `.dymo`** — **NO viaja**. Los nodos existen (`Code JS .dymo`, `Sube el .dymo`,
  `Mueve dymo Entrada`) y el resumen los vigila por si fallan, pero su id nunca sale. Hay que añadir
  `dymoId: campo('Mueve dymo Entrada', 'id')` al `resultado`. **El usuario autorizó tocarlo.**

⚠️ **Las 149 remisiones históricas no tienen `resultado`**, así que su entrada no lleva ningún
adjunto. Es correcto: nunca pasaron por n8n.

## Backend

### Módulo nuevo: `apps/desk/server/db/conversacion.ts`

`getConversacionTicket(db, ticketId)` compone y devuelve `{ mensajes: Message[]; sincronizarConZoho }`,
mismo patrón que `getHistorialTicket`. Fuentes:

1. **Conversaciones de Zoho** — las de hoy, vía `getConversations` + `rowToMessage`.
2. **Creación** — la fila de `ticket_transitions` con `from_status = '(creación)'`.
3. **Remisiones** — todas las del ticket, anuladas incluidas (una remisión anulada pasó).
4. **Transiciones** — las demás filas de `ticket_transitions`.

Se ordena por el instante real y **después** se formatea la hora, porque `Message.time` es ya una
cadena formateada y ordenar por ella sería ordenar alfabéticamente.

### El texto de cada entrada

Texto plano con saltos de línea (`isHtml` sin poner): el panel lo respeta con `whitespace-pre-line` y
así el cuerpo no puede inyectar nada. Cada línea se omite si su dato falta.

**Ticket creado** — firma: `performed_by` de la transición de creación.
```
Ticket creado para Airlab Consulting S.A.S.
Equipo: Grimm EDM180C · serie 18A19035
Tipo de servicio: Calibración
Orden de venta: OV-2026-141
Clasificación: Garantía · Prioridad: Media
```

**Remisión de entrada** — firma: `creado_por`.
```
El equipo ingresa para Calibración.
El equipo ingresa sin sensor de temperatura y humedad.
Incluye: cabezal, tubo, sensor T/RH, cable de poder
Registro fotográfico: 3 fotos
```
La segunda línea son las `observaciones` del técnico **tal cual las escribió**. Ese es el hallazgo que
hace que esto funcione: la prosa de la captura de Zoho ya está en los datos, no hay que inventarla.

Adjuntos: PDF, Documento, Etiqueta `.dymo` y Carpeta, los que existan.

**Transición** — firma: `performed_by`. Genérica por ahora.
```
Habilitar Servicio: OV asignada → Ingresado
Área: Comercial
Diagnóstico: Sensor averiado
```
La redacción propia de cada transición se irá definiendo después; esta forma es el suelo, no el techo.

### `Attachment` gana `url`

Hoy `Attachment` es `{ name, size, path }` y el panel construye `/api/attachment?path=…`, el proxy de
Zoho. Los enlaces de Drive son externos. Se añade `url?: string`: cuando está, el enlace va directo;
cuando no, sigue el proxy. `size` pasa a llevar el tipo (`PDF`, `Documento`, `Etiqueta`, `Carpeta`) en
los generados, porque de un fichero de Drive no sabemos el tamaño y la segunda línea de la tarjeta
tiene que decir algo.

### Bug que se arregla de paso

`GET /api/tickets/:id/conversations` decide el sync perezoso con `if (convs.length === 0)`. Un ticket
nacido en la app **nunca** tiene conversaciones de Zoho, así que ese `if` se cumple **siempre** y la
ruta **espera a una llamada a Zoho en cada apertura** por un ticket que Zoho no conoce. Es el mismo
fallo que ya se corrigió en la ruta de historia, y se corrige igual: por el prefijo `app-` del id.

## n8n

Una operación sobre `Remisiones_ST_3.13_Desk` (`BpLlnPAfjpHaoeKA`): añadir `dymoId` al objeto
`resultado` de `Code Resumen Entrada`. Es **aditiva** — una clave más en el JSON del callback— y no
toca conexiones, ni nombres de nodo, ni la barrera del colector, que son las tres cosas que rompen
este flujo en silencio.

⚠️ **Verificar el id del workflow antes de escribir.** `Remisiones_ST_3.13` (`2OJl7Y75KykNNHyT`) es
producción y no se toca.

Se verifica con una remisión real, no solo con `validate_workflow`: en este flujo todos los fallos
serios los ha cazado la prueba real, nunca la validación.

## Frontend

Mínimo:
- El enlace del adjunto usa `att.url` cuando existe.
- `RemisionResultado` gana `dymoId?: string | null`.

## Manejo de errores y seguridad

- La ruta sigue bajo `requireAuth`.
- Los enlaces de Drive se construyen desde ids que llegan de n8n. Se pasan por `urlSegura`, que exige
  `https://` y rechaza la comilla doble. Un id con basura no produce enlace.
- El cuerpo va como texto plano, no HTML: no hay superficie de inyección en lo generado.

## Pruebas

Repo (pg-mem), `apps/desk/server/db/conversacion.test.ts`:
- Un ticket con conversaciones de Zoho **y** transiciones **y** remisiones devuelve las tres, ordenadas.
- La creación produce su entrada con cliente, equipo, tipo de servicio y orden de venta.
- La remisión produce su entrada con observaciones, `Incluye` y recuento de fotos.
- Los cuatro adjuntos salen con su `url` cuando los ids existen; ninguno cuando `resultado` es NULL
  (el caso de las 149 históricas).
- Una `carpetaUrl` que no sea `https://` no produce adjunto.
- Una remisión anulada aparece igual.
- Una transición normal lista sus campos diligenciados.
- `sincronizarConZoho` da `'no'` para un ticket `app-…` (la regresión del sync perezoso).

Endpoint (supertest + sesión): la ruta devuelve el hilo compuesto; 401 sin sesión.

## Fuera de alcance

- **Redacción propia por transición.** Se irá definiendo; hoy todas comparten forma genérica.
- **Adjuntar ficheros de verdad.** Se enlaza. Adjuntar exigiría que n8n mande los bytes o dar
  credenciales de Drive a la app.
- **Escribir entradas a mano.** El hilo es generado; no hay caja de texto.
- **La rama de salida de remisiones.** Sigue diferida.
- **Las fotos como miniaturas.** Se dice cuántas hay; verlas es abrir la carpeta de Drive.
