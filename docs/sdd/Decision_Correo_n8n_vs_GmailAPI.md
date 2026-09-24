# Decisión · El correo propio, ¿por n8n o por Gmail API desde la app?

**Fecha:** 09/09/2026 · **Afecta a:** épica **1H** del plan de independencia · **Estado:** propuesta de Gerencia, a ratificar el 11/09
**Pregunta:** el Subsistema D se diseñó en junio sobre Gmail API llamada desde la aplicación. ¿Se puede hacer con n8n, como se hace hoy?

**Respuesta: sí, y probablemente sea mejor** — con una condición que no es negociable y una tensión documental que hay que resolver por escrito.

---

## 1 · Lo que hoy ya funciona, y es exactamente el patrón correcto

Antes de discutir, conviene ver que Ambientalia **ya envía correo por n8n** y que lo hace bien. Hay dos canales en producción, y los dos siguen la misma arquitectura:

| Pieza | Quién la hace |
|---|---|
| Decidir **a quién** se avisa (`destinatariosDeArea`), qué dice el texto, si lleva copia | **La app**, en código, con pruebas |
| Componer el payload y firmarlo con un secreto compartido (`X-Avisos-Token`) | **La app** |
| Hablar con el servidor de correo y entregar el mensaje | **n8n** |
| Contestar de vuelta a la app cuando el flujo termina | **n8n**, con su propio secreto (`REMISION_CALLBACK_TOKEN`, que valida la app) |

Es decir: **la app decide y guarda estado; n8n transporta.** Y ya está probado en los dos sentidos —disparo con token de ida y callback con token de vuelta—, con `fetch` inyectable para las pruebas, timeout acotado, y degradación limpia si el canal está apagado (URL vacía = no se manda nada y la campana sigue funcionando).

Eso no es un apaño: es la separación que uno querría de todos modos. Y significa que **1H no empieza de cero: extiende algo que ya existe y que el equipo sabe operar.**

---

## 2 · Qué gana n8n frente a Gmail API desde la app

**Las credenciales dejan de ser problema de la app.** El diseño de junio pedía un proyecto en Google Cloud, pantalla de consentimiento, scopes `gmail.modify` y `gmail.send`, un `GMAIL_REFRESH_TOKEN` guardado y renovado por la aplicación — es decir, replicar para Gmail toda la maquinaria de `tokenManager.ts` que hoy sostiene Zoho. Con n8n, eso vive en su almacén de credenciales y se configura una vez con el ratón.

**El sondeo del buzón tampoco lo escribe nadie.** El nodo Gmail Trigger de n8n hace el `history.list` incremental que D0 pedía construir a mano.

**Un fallo se ve y se reintenta.** n8n guarda cada ejecución con su entrada, su salida y su error. Cuando un correo no salga —y alguno no saldrá—, se ve en una pantalla y se reintenta con un clic, en vez de rebuscar en los registros del servidor.

**Y hay una razón práctica que pesa más que las tres anteriores:** conviene averiguar si el flujo de avisos ya envía por una cuenta de Google Workspace. Si es así, **D0 se queda casi sin contenido**: no hay OAuth nuevo que montar, ni DNS que verificar, ni DKIM que configurar. Eso es una tanda entera que desaparece.

---

## 3 · La condición que no es negociable

**En n8n va el transporte. Ni una regla de negocio.**

Concretamente, esto es lo que **no** puede vivir en un flujo:

- decidir a qué ticket pertenece un correo entrante;
- decidir si se crea un ticket nuevo o se reabre uno cerrado;
- deduplicar por `Message-ID`;
- decidir si un mensaje es una autorespuesta o un rebote que hay que ignorar;
- guardar cualquier estado.

Todo eso es **decisión y memoria**, y va en la app, en código, con spec y pruebas. n8n recibe el correo del buzón, lo entrega crudo a un endpoint de Desk 2.0, y la app resuelve. Igual que hoy: n8n manda el aviso, pero quién lo recibe lo decidió la app.

La razón no es purista. Es que **un flujo de n8n no está en git, no tiene spec, no pasa por CI y nadie lo revisa en una PR.** Después de haber montado en la Fase 0 los invariantes del grafo, la matriz de permisos y el trinquete de cobertura, meter la lógica de emparejamiento de hilos en un lienzo visual sería el único sitio del sistema sin red.

Y hay un precedente en casa que lo demuestra: el flujo de remisiones, con sus siete ramas en paralelo y su escritura a Google Sheets, es justo donde n8n **sí** tiene lógica de negocio — y es el que ha dado el punto abierto de la doble escritura, el que nadie sabe si alguien más lee, y el que la auditoría tuvo que ir a mirar por fuera para entender.

**Dos salvaguardas baratas** que conviene adoptar con la decisión: exportar el JSON del flujo a `docs/n8n/` del repositorio cada vez que se toque, para que al menos tenga historia; y que el contrato —la forma exacta del payload en cada dirección— viva en la spec de la capacidad `correo`, con pruebas del lado de la app. Así, el día que se quiera cambiar n8n por Gmail API directo, es un cambio de transporte y no un rediseño.

---

## 4 · La tensión documental, y hay que resolverla por escrito

El maestro dice dos cosas que no encajan del todo:

> **M11.1 [DECIDIDO 21/08]:** *«El objetivo es dejar de usar herramientas fragmentadas —n8n, Zoho Desk 1.0 y hojas de cálculo de Excel— y centralizar la operación desde la creación de remisiones hasta la facturación.»*

> **M11.3:** *«n8n — automatizaciones y formularios actuales; se integran y progresivamente se absorben.»*

Y el dolor nº 14 nombra a n8n como parte del problema.

Construir el correo sobre n8n contradice la primera leída al pie de la letra, y encaja con la segunda. Mi lectura, y la propongo como la que se escribe: **lo que M11.1 ataca es que la operación viva repartida en sitios que nadie controla, no que la app llame a un servicio externo.** Con la condición del §3, la operación queda entera en Desk 2.0 y n8n baja de categoría: deja de ser un lugar donde pasan cosas y pasa a ser un adaptador de transporte, como lo sería una librería de SMTP. Eso **cumple** M11.1 en el fondo aunque siga habiendo un n8n en el diagrama.

Pero conviene decirlo explícitamente en la R09 del maestro, porque si no, dentro de seis meses alguien leerá M11.1 y pensará que nos saltamos una decisión de acta.

---

## 5 · Cómo queda la épica 1H

| Tanda | Con Gmail API (diseño de junio) | **Con n8n (propuesta)** |
|---|---|---|
| **1H-00** Transporte | Google Cloud, consentimiento, scopes, refresh token en la app, DKIM/SPF/DMARC | Reutilizar las credenciales del flujo de avisos si ya son de Workspace; si no, configurarlas en n8n. **De S a XS, o desaparece** |
| **1H-01** Salida | La app llama a Gmail API, gestiona token y adjuntos | La app compone y dispara webhook con token; n8n envía; callback con `messageId`/`threadId` y la app lo guarda en `conversations`. **Calcado de `dispararRemision`.** De L a M |
| **1H-02** Entrada | La app sondea con `history.list`, parsea, empareja, deduplica | n8n sondea con Gmail Trigger y hace `POST /api/correo/entrante` con el mensaje crudo; **la app empareja, deduplica, crea o reabre, y guarda**. Sigue siendo L —la lógica no se abarata, sólo cambia de sitio la fontanería |
| **1H-03** Corte del buzón | Igual | Igual |

**Se ahorra aproximadamente una tanda y media**, y la que más riesgo tiene —1H-02— conserva toda su lógica en código probado, que es donde debe estar.

---

## 6 · Qué hay que averiguar antes del viernes

1. **¿Con qué cuenta envía hoy el flujo de avisos?** Si es Google Workspace de Ambientalia, 1H-00 casi desaparece. Si es un SMTP genérico o una cuenta personal, hay que montarlo bien: el correo al cliente sale con el dominio de la empresa o no sale.
2. **¿Quién mantiene n8n y dónde está alojado?** Si el correo entrante pasa a depender de n8n, su disponibilidad pasa a ser crítica. Hoy ya lo es para remisiones y avisos, así que probablemente no cambie nada, pero conviene decirlo en voz alta.
3. **¿Se acepta la condición del §3?** Es la que decide si esto sale bien. Sin ella, en seis meses habrá reglas de negocio en un lienzo que nadie versiona.

---

**Recomendación:** adoptar n8n como transporte, con la condición del §3 escrita como regla invariable 14 en `CLAUDE.md` —«en n8n va el transporte, nunca una decisión ni un estado»—, exportar el flujo al repositorio, y anotar en la R09 del maestro que M11.1 se cumple porque la operación se centraliza, no porque desaparezca el último servicio externo.
