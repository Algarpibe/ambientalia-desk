# Eliminar usuarios — diseño

**Fecha:** 2026-08-12
**Estado:** aprobado por el usuario, pendiente de plan de implementación
**Continúa:** `2026-08-12-editar-usuario-design.md` (misma pantalla, misma sesión).

## El problema

La pantalla de Usuarios deja crear, editar, desactivar y resetear la contraseña, pero no **eliminar**.
El caso real es acotado: un alta por error, un duplicado, un usuario de prueba. Para alguien que ya
trabajó, desactivar es lo correcto y ya existe.

## El hallazgo: el proyecto ya había decidido esto por escrito

`apps/desk/server/db/ticketFuentes.ts:101-105` documenta la invariante y construye un detector para
cuando se viole:

> «La derivación se guarda por ID […] pero esto lo lee una persona y un UUID no le dice nada. Si el id
> no está en el mapa se deja crudo a propósito: **no debería pasar (los usuarios se desactivan, no se
> borran)**, y verlo es lo único que permitiría diagnosticarlo.»

El motivo técnico: la derivación viaja **por id** dentro del `values` de cada transición, que es el
rastro de auditoría. Borrar a una persona hace que cada transición histórica que la derivó muestre un
UUID en pantalla, para siempre. Es irreparable sin falsificar el rastro.

⚠️ **El esquema no tiene ni una sola clave foránea** (verificado en las 430 líneas de `schema.sql`).
`DELETE FROM users` siempre funciona y deja huérfanos en silencio — la misma trampa que ya mordió dos
veces al borrar tickets (`debt.md:421`).

## Qué apunta a un usuario

**Por ID — se rompen al borrar:**

| Tabla | Columna | Qué es |
|---|---|---|
| `public.sessions` | `user_id` | Sesión abierta. Huérfana es inofensiva (el `JOIN` es INNER → 401 limpio) |
| `public.avisos` | `user_id` | Campana. Huérfanos quedan inaccesibles pero presentes para siempre |
| `public.ticket_reads` | `user_id` | Qué ha leído. Estado de interfaz, sin valor de auditoría |
| `desk.tickets` | `derivado_a` | A quién le toca ahora |
| `desk.ticket_transitions` | **`values->>'derivado_a'`** | ⚠️ **Referencia escondida en un jsonb.** Ningún grep de columnas la encuentra. Es auditoría |

**Por NOMBRE — sobreviven solos, no hay que hacer nada:** `ticket_transitions.performed_by`,
`conversations.author_name`, `tickets.resolution_by`, `resolution_attachments.created_by`,
`remisiones.creado_por`, `remisiones.anulada_por`, `catalogo_documentos.created_by`.

Que la firma de la remisión sea un nombre y no un id es lo que hace que borrar a alguien no rompa
ninguna remisión ya emitida.

## Decisión tomada

Del usuario, en la sesión del 2026-08-12: **borrar solo a quien no tenga historial**, replicando el
patrón `EntradaEnUso` que el catálogo de equipos ya usa (`apps/desk/server/db/catalogo.ts:201-289`).

Descartadas: borrar siempre avisando, y borrar siempre con vista previa de lo que se pierde. Las dos
rompen la auditoría de forma irreversible; la segunda solo deja mejor informado el destrozo.

No es un callejón sin salida —el principio del proyecto— porque **desactivar sigue estando ahí y
resuelve el objetivo práctico**. El mensaje del 409 lo dice explícitamente.

## Qué cambia

### Servidor (con TDD y mutación posterior)

1. **`usosDeUsuario(db, id)`** en `apps/desk/server/auth/users.ts`: cuenta las dos referencias por id
   que romperían — tickets con `derivado_a = id`, y transiciones cuyo `values->>'derivado_a' = id`.
   La segunda es la que de verdad importa: es el rastro histórico.
2. **`UsuarioEnUso extends Error`** con el conteo, calcada de `EntradaEnUso`.
3. **`borrarUsuario(db, id)`**: si hay usos, lanza. Si no, barre en este orden y borra:

   `sessions` → `avisos` → `ticket_reads` → `users`

   El usuario se borra **el último** a propósito: sin transacción que pg-mem pueda probar, un fallo a
   medias deja a la persona existiendo con menos estado personal. Molesto, nunca corrupto. Al revés
   —borrar primero la fila— dejaría exactamente los huérfanos que este diseño evita.

4. **`DELETE /api/users/:id`**, `requireAuth` + `requireAdmin`, con cuatro respuestas:
   - **404** si no existe.
   - **409** si te borras a ti mismo: te dejaría con la sesión muerta y sin poder deshacerlo.
   - **409** si es el último administrador activo. ⚠️ **Hoy esa protección solo vive en el PATCH**
     (`routes.ts:97-103`); ningún camino de borrado la tiene porque no había borrado.
   - **409** `UsuarioEnUso`, con el conteo y «Desactívalo en lugar de borrarlo», el mismo mensaje que
     ya usa el catálogo.
   - **204** al borrar.

### Interfaz (cableado)

5. Botón **«Eliminar»** en rojo, el último de la fila, con `confirm()` que nombra a la persona.
6. El error del 409 se muestra tal cual en la franja de error que la pantalla ya tiene: viene
   redactado para leerse, con el conteo y la salida.

## Verificación

Suite completa (tests nuevos de repo y de ruta), typecheck, lint (158 warnings exactos) y build, en
secuencia. Prueba manual del usuario al desplegar:

1. Crear un usuario de prueba y eliminarlo → desaparece de la lista.
2. Intentar eliminar a alguien con tickets derivados → 409 con el conteo y la sugerencia de
   desactivarlo.
3. Intentar eliminarte a ti mismo → 409.
4. Intentar eliminar al único administrador activo → 409.
