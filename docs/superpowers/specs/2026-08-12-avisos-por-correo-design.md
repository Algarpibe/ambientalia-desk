# Avisos de ticket por correo — diseño

**Fecha:** 2026-08-12
**Estado:** aprobado por el usuario, pendiente de plan de implementación
**Alcance:** dos entregas. La 1 es desplegable y útil sola; la 2 añade el canal de correo.

## El problema

Cuando a alguien le toca trabajar en un ticket, hoy solo se entera si entra en la aplicación y mira.
Hay dos momentos en que eso pasa:

1. **Le derivan el ticket** a esa persona en concreto (la casilla «Derivado a»).
2. **El ticket entra en una fase de otra área** — el caso que motivó la petición: Servicio Técnico
   termina y pasa a «Por Facturar», y nadie de Comercial se entera de que hay algo que facturar.

El primero ya genera un aviso en la campana; el segundo no genera nada. Y ninguno de los dos sale de
la aplicación.

## El hallazgo que reformula la petición

La petición decía «cuando el ticket entra en fases que corresponden al área comercial, avisar al
usuario de esa área». Pero **el `area` de una transición es quién la EJECUTA, no a quién le toca
después**. Avisar por el área de la transición ejecutada manda el correo justo a quien acaba de hacer
el trabajo: `escalado_a_comercial` tiene `area: 'Servicio Técnico'` y deja el ticket en «Notificación
Comercial», donde a quien le toca es a Comercial.

Lo que hay que mirar es el **estado destino** y las transiciones que salen de él.

## La regla

Función pura nueva en `packages/shared/src/transitions.ts`:

```ts
export function areasSiguientes(estado: string): string[]
```

Devuelve las áreas base de todas las transiciones cuyo `from` incluye ese estado. Un estado terminal
(«Finalizado») devuelve lista vacía. Sobre ella, la regla de aviso:

> **áreas siguientes − áreas de quien acaba de actuar**

Es literalmente la definición que dio el usuario: «una transición en la cual interviene **otro**
perfil». Sin esa resta, «Facturado» (Comercial → Liberación Comercial, cuya siguiente también es
Comercial) le avisaría a Comercial de que le toca a Comercial.

Comprobado contra las 34 transiciones reales:

| Quién actúa | Transición | Estado nuevo | Se avisa a |
|---|---|---|---|
| S. Técnico | finalización de servicio | Por Facturar | **Comercial** (el caso pedido) |
| S. Técnico | Escalado a comercial | Notificación Comercial | **Comercial y Compras** |
| Comercial | Habilitar Servicio | Ingresado | **Servicio Técnico** |
| Comercial | Facturado | Liberación Comercial | **nadie**: sigue siendo suyo |
| S. Técnico | Entrega al cliente | Finalizado | **nadie**: estado terminal |

**Las áreas de quien actúa son las del USUARIO, no las de la transición.** Un admin tiene las tres, así
que al ejecutar cualquier transición la resta le deja el conjunto vacío y no se avisa a nadie por
cambio de área. Es correcto y deliberado: si el admin hace el trabajo de las tres áreas, no hay «otro
perfil» a quien pasarle el testigo. Su copia de administrador (ver abajo) es un canal aparte.

## Los destinatarios

**Por derivación explícita:** la persona derivada. La regla existente `avisoDerivacion` no se toca —
sus tres supresiones (persona que no cambia, auto-derivación, vaciar) siguen valiendo. Solo gana canal
de correo.

**Por cambio de área**, para cada área a avisar:

- Los usuarios activos cuyo **rol esté marcado como receptor de avisos** y cuyas áreas cubran esa área.
- **Más todos los administradores activos**, que reciben copia de todos los cambios de área (decisión
  del usuario). La copia del admin es solo de los cambios de área: las derivaciones ya tienen
  destinatario nombrado y añadirle copia sería ruido.
- Nadie recibe dos veces el mismo aviso, aunque sea admin y coordinador a la vez.
- El actor nunca se avisa a sí mismo.

El rol receptor se marca con una **casilla en la pantalla de Roles** («Recibe los avisos de su área»).
Se eligió frente a deducirlo del nombre del rol, que se rompe en silencio en cuanto alguien renombra
«Coordinador Comercial» o lo escribe distinto — y se rompe sin avisar de que se rompió.

Hoy se marcará en el rol «Coordinador Comercial»; el mecanismo sirve igual para Servicio Técnico y
Compras cuando se quiera, sin tocar código.

## «Administrativa» no existe como área

El usuario habló de «área comercial o administrativa». El sistema tiene tres áreas: `Comercial`,
`Servicio Técnico` y `Compras`. Las transiciones de facturación (`facturado`, `facturado_cierre`,
`liberacion_sin_factura`) son **todas de área Comercial** en el Blueprint. «Administrativa» es el
nombre de calle de esa parte, y ya está cubierta: no se crea ningún área nueva. Crearla sería un cambio
del modelo de permisos, no de las notificaciones.

## Los datos

Dos columnas aditivas, sin migración de datos:

```sql
ALTER TABLE roles ADD COLUMN IF NOT EXISTS recibe_avisos boolean NOT NULL DEFAULT false;
ALTER TABLE avisos ADD COLUMN IF NOT EXISTS enviado_at timestamptz;
```

`avisos.enviado_at` **ya estaba prevista**: el comentario de `schema.sql:128` dice que esa tabla es la
cola del correo y que el campo que falta es ese. Se sigue el diseño que ya estaba escrito.

⚠️ **Trampa de pg-mem:** `roles.areas` es `jsonb` y pg-mem no resuelve bien la contención (`@>`). Los
candidatos se leen con un `WHERE recibe_avisos = true AND active = true` y **el cruce de áreas se hace
en JS**, como ya hace `validAreas` en `roles.ts`.

⚠️ **Recordatorio de esquema:** las dos tablas son app-nativas, así que en `schema.sql` van calificadas
`public.` — sin calificar aterrizarían en `desk` por el `search_path` de producción.

## Entrega 1 — la regla y los avisos en la aplicación

Sin correo. La campana empieza a avisar los cambios de área.

1. `areasSiguientes` y la regla de destinatarios, puras, en shared, con tests propios.
2. `roles.recibe_avisos` + la casilla en `RolesAdmin.tsx` + el campo en el tipo `Role` y en su PATCH.
3. Una función de repo que resuelva los destinatarios de un área (candidatos por SQL, cruce en JS).
4. El enganche en `executeTransition`, justo donde hoy se crea el aviso de derivación (línea 112-122):
   se añade el bloque de avisos por área, igualmente **fuera de la transacción** y por la misma razón
   ya documentada ahí.

Es desplegable y útil sola: la campana ya existe y ya se lee.

## Entrega 2 — el canal de correo

5. `apps/desk/server/avisosWebhook.ts`, calcado de `remisionWebhook.ts`: `fetch` inyectable para los
   tests, config vacía = no-op explícito con motivo, fire-and-forget sin bloquear la respuesta de la
   transición, y resultado registrado en el log.
6. Tres variables de entorno nuevas en `config.ts`: la URL del webhook de avisos, su token
   (cabecera propia, como `X-Remision-Token`) y la **URL pública de la aplicación**, necesaria para
   que el correo pueda enlazar el ticket.
7. `enviado_at` se sella al despachar.
8. Un flujo **nuevo** en n8n: webhook + nodo Gmail. ⚠️ No se toca `Remisiones_ST_3.13` (producción) ni
   `_Desk` (activo y en uso real).

**Propiedad del diseño:** el aviso en la aplicación es la fuente de verdad y el correo va encima, en el
mejor esfuerzo. Si el correo falla, la persona lo ve igual en la campana y `enviado_at` se queda en
`NULL`, que es la cola de reintento del día de mañana. Es «avisar, no impedir»: un fallo del canal
externo nunca puede tumbar una transición ya escrita.

## Por qué n8n y no correo propio

La aplicación **no puede enviar correo hoy**: no hay transporte, ni dependencia, ni credenciales, ni
una sola variable de entorno de correo. Lo único que sale es `sendReply`, que escribe **al cliente** en
el hilo de Zoho.

Las tres vías evaluadas:

| Vía | Veredicto |
|---|---|
| **Webhook a n8n** | **Elegida.** n8n ya manda correos por Gmail en el flujo de remisiones: las credenciales existen y el patrón de disparo (`remisionWebhook.ts`) está probado. Cero dependencias nuevas en la aplicación. |
| Gmail API en Node | Es el Subsistema D2 de `debt.md`, ya diferido conscientemente: proyecto en Google Cloud, OAuth, scopes, composición MIME. Hacerlo ahora retrasa esto semanas. |
| SMTP con nodemailer | Dependencia y credenciales nuevas en el servidor, que habría que retirar cuando llegue el Subsistema D, y sin las ventajas de entregabilidad de Gmail. |

No compromete el futuro: cuando llegue el correo propio en Node, se cambia el transporte por detrás
sin tocar la regla ni los destinatarios.

## Verificación

Toda la lógica que puede romperse en silencio es pura y va con TDD y mutación posterior:
`areasSiguientes`, la resta de áreas y la deduplicación de destinatarios. El repo de destinatarios va
con pg-mem. El webhook, con `fetch` inyectable, como el de remisiones.

Prueba manual del usuario tras la entrega 1: marcar «Coordinador Comercial» como receptor, ejecutar
«finalización de servicio» en un ticket con un usuario de Servicio Técnico, y comprobar que a la
persona con ese rol le aparece el aviso en la campana y al técnico que lo ejecutó no.
